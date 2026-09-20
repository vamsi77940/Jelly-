import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  px: number;
  py: number;
}

interface Strand {
  points: Point[];
  length: number;
  angleOffset: number;
}

export function BackgroundWisp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });
  const emitterRef = useRef({ x: 0, y: 0 });
  const strandsRef = useRef<Strand[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Initialize emitter position to center of the screen
      if (!initializedRef.current) {
        emitterRef.current = { x: width / 2, y: height / 2 };
        mouseRef.current.targetX = width / 2;
        mouseRef.current.targetY = height / 2;
        mouseRef.current.x = width / 2;
        mouseRef.current.y = height / 2;
        initStrands(width / 2, height / 2);
        initializedRef.current = true;
      }
    };

    // Initialize strands radiating outwards
    const initStrands = (ex: number, ey: number) => {
      const numStrands = 130;
      const numSegments = 12;
      const segmentLength = 12;
      const newStrands: Strand[] = [];

      for (let j = 0; j < numStrands; j++) {
        const baseAngle = (j / numStrands) * Math.PI * 2;
        // Slightly randomize strand properties for organic look
        const angleOffset = (Math.random() - 0.5) * 0.15;
        const finalAngle = baseAngle + angleOffset;
        const lengthMultiplier = 0.85 + Math.random() * 0.3;
        const currentSegLength = segmentLength * lengthMultiplier;

        const points: Point[] = [];
        for (let i = 0; i < numSegments; i++) {
          const x = ex + Math.cos(finalAngle) * i * currentSegLength;
          const y = ey + Math.sin(finalAngle) * i * currentSegLength;
          points.push({ x, y, px: x, py: y });
        }

        newStrands.push({
          points,
          length: currentSegLength,
          angleOffset,
        });
      }

      strandsRef.current = newStrands;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.targetX = e.touches[0].clientX;
        mouseRef.current.targetY = e.touches[0].clientY;
        mouseRef.current.active = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Physics parameters
    const damping = 0.88;
    const springStrength = 0.05;
    const influenceRadius = 130;
    const pushStrength = 1.8;
    let time = 0;

    // Animation Loop
    const animate = () => {
      time += 0.012;
      const width = canvas.width;
      const height = canvas.height;

      // Clear with radial gradient base background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const emitter = emitterRef.current;
      const mouse = mouseRef.current;

      // Emitter smoothly follows cursor (with visual lag)
      if (mouse.active) {
        emitter.x += (mouse.targetX - emitter.x) * springStrength;
        emitter.y += (mouse.targetY - emitter.y) * springStrength;

        // Smoothly move mouse coordinate tracker
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;
      } else {
        // Slow float movement when cursor is inactive
        const driftX = width / 2 + Math.cos(time * 0.4) * (width * 0.15);
        const driftY = height / 2 + Math.sin(time * 0.3) * (height * 0.1);
        emitter.x += (driftX - emitter.x) * 0.02;
        emitter.y += (driftY - emitter.y) * 0.02;

        mouse.x = emitter.x;
        mouse.y = emitter.y;
      }

      // Draw custom background radial glow
      const bgGrad = ctx.createRadialGradient(emitter.x, emitter.y, 50, emitter.x, emitter.y, Math.max(width, height) * 0.8);
      bgGrad.addColorStop(0, '#040614');
      bgGrad.addColorStop(0.4, '#010206');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Add gorgeous electric-blue gradient wash on the left side to match the video aesthetics
      const leftGlow = ctx.createRadialGradient(0, height * 0.5, 0, 0, height * 0.5, Math.max(width, height) * 0.65);
      leftGlow.addColorStop(0, 'rgba(0, 100, 255, 0.22)');
      leftGlow.addColorStop(0.5, 'rgba(0, 40, 180, 0.08)');
      leftGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw cursor interactive glow
      if (mouse.active) {
        const cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 250);
        cursorGlow.addColorStop(0, 'rgba(0, 150, 255, 0.12)');
        cursorGlow.addColorStop(0.5, 'rgba(0, 80, 240, 0.04)');
        cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Physics update for each strand
      const strands = strandsRef.current;
      for (let j = 0; j < strands.length; j++) {
        const strand = strands[j];
        const pts = strand.points;

        // Base angle for this strand's direction
        const baseAngle = (j / strands.length) * Math.PI * 2 + strand.angleOffset;

        // 1. Verlet position update for each point
        for (let i = 1; i < pts.length; i++) {
          const pt = pts[i];
          
          // Velocity from previous frame
          const vx = (pt.x - pt.px) * damping;
          const vy = (pt.y - pt.py) * damping;

          pt.px = pt.x;
          pt.py = pt.y;

          // Gentle organic wave force
          const waveFreq = 2.0;
          const waveAmp = 0.18;
          const waveX = Math.cos(time * waveFreq + i * 0.6 + j * 0.08) * waveAmp;
          const waveY = Math.sin(time * waveFreq + i * 0.6 + j * 0.08) * waveAmp;

          // Radial expansion pressure to keep dandelion shape
          const expForce = 0.06;
          const rx = Math.cos(baseAngle) * expForce * i;
          const ry = Math.sin(baseAngle) * expForce * i;

          pt.x += vx + waveX + rx;
          pt.y += vy + waveY + ry;

          // Mouse perturbation (repulsion)
          if (mouse.active) {
            const dx = pt.x - mouse.x;
            const dy = pt.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < influenceRadius) {
              const force = (1 - dist / influenceRadius) * pushStrength;
              const angle = Math.atan2(dy, dx);
              pt.x += Math.cos(angle) * force;
              pt.y += Math.sin(angle) * force;
            }
          }
        }

        // 2. Resolve length constraints
        pts[0].x = emitter.x;
        pts[0].y = emitter.y;

        for (let i = 1; i < pts.length; i++) {
          const p1 = pts[i - 1];
          const p2 = pts[i];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist !== 0) {
            p2.x = p1.x + (dx / dist) * strand.length;
            p2.y = p1.y + (dy / dist) * strand.length;
          }
        }

        // 3. Draw strand segment by segment to taper opacity and thickness
        for (let i = 1; i < pts.length; i++) {
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);

          const t = i / pts.length;
          // Make strands significantly brighter and more visible (opacity up to 0.42)
          const opacity = (1 - t) * 0.42;
          const thickness = (1 - t) * 1.5 + 0.3;

          ctx.strokeStyle = `rgba(180, 220, 255, ${opacity})`;
          ctx.lineWidth = thickness;
          ctx.stroke();
        }
      }

      // Draw blooming center emitter core (larger and more glowing)
      ctx.beginPath();
      const coreGlow = ctx.createRadialGradient(emitter.x, emitter.y, 0, emitter.x, emitter.y, 45);
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGlow.addColorStop(0.12, 'rgba(235, 245, 255, 0.95)');
      coreGlow.addColorStop(0.4, 'rgba(100, 185, 255, 0.45)');
      coreGlow.addColorStop(0.8, 'rgba(100, 185, 255, 0.12)');
      coreGlow.addColorStop(1, 'rgba(100, 185, 255, 0)');
      ctx.fillStyle = coreGlow;
      ctx.arc(emitter.x, emitter.y, 45, 0, Math.PI * 2);
      ctx.fill();

      // Tiny bright physical center star (slightly larger for clear definition)
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(emitter.x, emitter.y, 3.5, 0, Math.PI * 2);
      ctx.fill();


      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-screen h-screen pointer-events-none"
    />
  );
}
