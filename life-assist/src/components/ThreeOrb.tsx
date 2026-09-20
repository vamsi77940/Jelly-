import { useEffect, useRef } from "react";
import { createOrbScene, type OrbSceneApi } from "@/lib/orbScene";

interface ThreeOrbProps {
  size?: number;
  state?: 'idle' | 'listening' | 'thinking' | 'speaking';
  showControls?: boolean;
}

export function ThreeOrb({ size = 320, state = 'idle', showControls = true }: ThreeOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OrbSceneApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = createOrbScene(container);
    sceneRef.current = scene;
    scene.updateState(state);
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Update 3D scene state dynamically when state changes
  useEffect(() => {
    sceneRef.current?.updateState(state);
  }, [state]);

  useEffect(() => {
    if (!showControls) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "+":
        case "=":
          sceneRef.current?.zoomIn();
          break;
        case "-":
        case "_":
          sceneRef.current?.zoomOut();
          break;
        case "r":
        case "R":
          sceneRef.current?.resetView();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showControls]);

  if (!showControls) {
    return (
      <div className="relative overflow-hidden rounded-full pointer-events-none" style={{ width: size, height: size }}>
        {/* Three.js Orb Canvas Container */}
        <div 
          ref={containerRef} 
          className="rounded-full relative overflow-hidden bg-black/35"
          style={{ width: size, height: size }}
        />

        {/* Film grain / scanlines simulation inside the orb */}
        <div className="absolute inset-0 rounded-full pointer-events-none z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-cyan/10 via-transparent to-accent-amber/10 opacity-30" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/50 opacity-60" />
        </div>
      </div>
    );
  }

  const offset = 40; // (size + 80 - size) / 2
  return (
    <div className="relative flex flex-col items-center select-none" style={{ width: size + 80 }}>
      {/* Three.js Orb Canvas Container */}
      <div 
        ref={containerRef} 
        className="rounded-full border border-white/10 relative overflow-hidden bg-black/30 shadow-glow shadow-accent-cyan/10"
        style={{ width: size, height: size }}
      />

      {/* Film grain / scanlines simulation inside the orb */}
      <div className="absolute inset-0 rounded-full pointer-events-none z-10 overflow-hidden" style={{ width: size, height: size, left: offset }}>
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-cyan/5 via-transparent to-accent-amber/5 opacity-40" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 opacity-80" />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => sceneRef.current?.resetView()}
          className="px-4 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-xs font-mono tracking-wider text-ink-muted hover:text-ink-primary transition-all duration-300"
        >
          RESET VIEW
        </button>
      </div>
    </div>
  );
}

