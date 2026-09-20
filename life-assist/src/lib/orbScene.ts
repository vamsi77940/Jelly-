import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export interface OrbSceneApi {
  /** Rotate the camera around the orb by the given angles (radians). */
  rotateBy(deltaTheta: number, deltaPhi: number): void;
  /** Multiply the camera distance by `factor` (<1 zooms in, >1 zooms out). */
  zoomBy(factor: number): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
  dispose(): void;
  updateState(state: 'idle' | 'listening' | 'thinking' | 'speaking'): void;
}

const HOME_POSITION = new THREE.Vector3(0, 0.5, 5.5);
const MIN_DISTANCE = 0.6;
const MAX_DISTANCE = 40;

export function createOrbScene(container: HTMLElement): OrbSceneApi {
  const width = container.clientWidth;
  const height = container.clientHeight;

  // SCENE
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
  camera.position.copy(HOME_POSITION);

  const isSmall = width < 150;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSmall ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  container.appendChild(renderer.domElement);

  // POST PROCESSING
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  let chromaticPass: ShaderPass | null = null;

  if (!isSmall) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.8, // strength
      0.4, // radius
      0.2  // threshold
    );
    composer.addPass(bloom);

    const chromaticShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uIntensity: { value: 0.003 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        void main() {
          vec2 dir = vUv - vec2(0.5);
          float d = length(dir);
          float offset = uIntensity * d;
          // Slight flicker
          float flicker = 1.0 + 0.02 * sin(uTime * 30.0) * sin(uTime * 7.3);
          vec4 cr = texture2D(tDiffuse, vUv + dir * offset);
          vec4 cg = texture2D(tDiffuse, vUv);
          vec4 cb = texture2D(tDiffuse, vUv - dir * offset * 0.5);
          gl_FragColor = vec4(cr.r, cg.g * 1.05, cb.b * 0.6, 1.0) * flicker;
          // Push towards amber/orange tone
          gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(1.15, 0.85, 0.55), 0.3);
        }
      `,
    };
    chromaticPass = new ShaderPass(chromaticShader);
    composer.addPass(chromaticPass);
  }

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.zoomSpeed = 1.4;
  controls.enablePan = false;

  // STATE CONFIGURATIONS
  const stateColors = {
    idle: {
      bright: new THREE.Color(0x00d2ff), // classic Jarvis cyan/blue
      mid: new THREE.Color(0x0072ff),
      dim: new THREE.Color(0x0032aa),
      faint: new THREE.Color(0x001255),
      hot: new THREE.Color(0x80e8ff),
    },
    listening: {
      bright: new THREE.Color(0x00ffcc), // neon turquoise/teal
      mid: new THREE.Color(0x00aaff),
      dim: new THREE.Color(0x0055aa),
      faint: new THREE.Color(0x002255),
      hot: new THREE.Color(0xaaffff),
    },
    thinking: {
      bright: new THREE.Color(0xffaa00), // hot amber/orange
      mid: new THREE.Color(0xdd5500),
      dim: new THREE.Color(0x882200),
      faint: new THREE.Color(0x441100),
      hot: new THREE.Color(0xffddaa),
    },
    speaking: {
      bright: new THREE.Color(0x34c759), // mint green
      mid: new THREE.Color(0x00a651),
      dim: new THREE.Color(0x005e2f),
      faint: new THREE.Color(0x002e17),
      hot: new THREE.Color(0xaaffbb),
    },
  };

  let currentState: 'idle' | 'listening' | 'thinking' | 'speaking' = 'idle';

  const activeColors = {
    bright: stateColors.idle.bright.clone(),
    mid: stateColors.idle.mid.clone(),
    dim: stateColors.idle.dim.clone(),
    faint: stateColors.idle.faint.clone(),
    hot: stateColors.idle.hot.clone(),
  };

  // Keep track of all materials to dynamically transition their colors
  const colorTrackedMaterials: { material: any; type: 'bright' | 'mid' | 'dim' | 'faint' | 'hot' }[] = [];

  function registerMaterial(material: any, type: 'bright' | 'mid' | 'dim' | 'faint' | 'hot') {
    colorTrackedMaterials.push({ material, type });
    return material;
  }

  // ORB ROOT
  const orbGroup = new THREE.Group();
  scene.add(orbGroup);

  // MATERIAL HELPERS
  function lineMat(colorType: 'bright' | 'mid' | 'dim' | 'faint' | 'hot', opacity = 1) {
    const mat = new THREE.LineBasicMaterial({
      color: activeColors[colorType],
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    registerMaterial(mat, colorType);
    return mat;
  }

  // UTILITY: Create ring at latitude
  function latRing(radius: number, lat: number, segs = 60) {
    const r = radius * Math.cos(lat);
    const y = radius * Math.sin(lat);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  // UTILITY: Create meridian
  function meridian(radius: number, lon: number, segs = 60) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const lat = (i / segs) * Math.PI - Math.PI / 2;
      pts.push(
        new THREE.Vector3(
          radius * Math.cos(lat) * Math.cos(lon),
          radius * Math.sin(lat),
          radius * Math.cos(lat) * Math.sin(lon)
        )
      );
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  // LAYER 1: OUTER SHELL
  const outerShell = new THREE.Group();
  const R1 = 2.0;

  for (let i = -15; i <= 15; i++) {
    const lat = (i / 15) * (Math.PI / 2) * 0.95;
    const opacity = i % 3 === 0 ? 0.5 : 0.12;
    const colorType = i % 3 === 0 ? 'mid' : ('faint' as const);
    outerShell.add(new THREE.Line(latRing(R1, lat), lineMat(colorType, opacity)));
  }

  for (let i = 0; i < 24; i++) {
    const lon = (i / 24) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    outerShell.add(
      new THREE.Line(
        meridian(R1, lon),
        lineMat(isMajor ? 'mid' : 'faint', isMajor ? 0.6 : 0.1)
      )
    );
  }

  const CROSS_LINES = 18;
  const CROSS_SPREAD = 0.25;
  for (let i = 0; i < 4; i++) {
    const lon = (i / 4) * Math.PI * 2;
    for (let j = 0; j < CROSS_LINES; j++) {
      const t = (j / (CROSS_LINES - 1)) * 2 - 1;
      const offset = (t * CROSS_SPREAD) / 2;
      const falloff = 1 - Math.abs(t) * 0.7;
      const opacity = 0.85 * falloff;
      const colorType = Math.abs(t) < 0.3 ? 'bright' : ('mid' as const);
      outerShell.add(
        new THREE.Line(meridian(R1, lon + offset, 200), lineMat(colorType, opacity))
      );
    }
  }

  const EQ_LINES = 20;
  const EQ_SPREAD = 0.35;
  for (let j = 0; j < EQ_LINES; j++) {
    const t = (j / (EQ_LINES - 1)) * 2 - 1;
    const offset = (t * EQ_SPREAD) / 2;
    const falloff = 1 - Math.abs(t) * 0.65;
    const opacity = 0.8 * falloff;
    const colorType = Math.abs(t) < 0.3 ? 'bright' : ('mid' as const);
    outerShell.add(
      new THREE.Line(latRing(R1, offset, 200), lineMat(colorType, opacity))
    );
  }

  orbGroup.add(outerShell);

  // LAYER 2: GRID PANELS
  const panelGroup = new THREE.Group();

  function createSpherePanel(
    latCenter: number,
    lonCenter: number,
    latSpan: number,
    lonSpan: number,
    radius: number,
    divisions = 4
  ) {
    const group = new THREE.Group();
    const mat = lineMat('dim', 0.25);

    for (let i = 0; i <= divisions; i++) {
      const lat = latCenter - latSpan / 2 + (i / divisions) * latSpan;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= divisions * 4; j++) {
        const lon = lonCenter - lonSpan / 2 + (j / (divisions * 4)) * lonSpan;
        pts.push(
          new THREE.Vector3(
            radius * Math.cos(lat) * Math.cos(lon),
            radius * Math.sin(lat),
            radius * Math.cos(lat) * Math.sin(lon)
          )
        );
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }

    for (let j = 0; j <= divisions; j++) {
      const lon = lonCenter - lonSpan / 2 + (j / divisions) * lonSpan;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= divisions * 4; i++) {
        const lat = latCenter - latSpan / 2 + (i / (divisions * 4)) * latSpan;
        pts.push(
          new THREE.Vector3(
            radius * Math.cos(lat) * Math.cos(lon),
            radius * Math.sin(lat),
            radius * Math.cos(lat) * Math.sin(lon)
          )
        );
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }

    return group;
  }

  const gridPanelsCount = isSmall ? 0 : 8;
  for (let i = 0; i < gridPanelsCount; i++) {
    const lat = (Math.random() - 0.5) * Math.PI * 0.8;
    const lon = Math.random() * Math.PI * 2;
    const size = 0.15 + Math.random() * 0.25;
    const panel = createSpherePanel(
      lat,
      lon,
      size,
      size,
      R1 + 0.01,
      3 + Math.floor(Math.random() * 2)
    );
    panelGroup.add(panel);
  }
  orbGroup.add(panelGroup);

  // LAYER 3: SECONDARY SHELL
  const shell2 = new THREE.Group();
  const R2 = 2.12;

  const arcLatCount = isSmall ? 0 : 5;
  const arcLonCount = isSmall ? 0 : 4;
  for (let i = 0; i < arcLatCount; i++) {
    const lat = (Math.random() - 0.5) * Math.PI * 0.85;
    const startLon = Math.random() * Math.PI * 2;
    const arcLen = 0.3 + Math.random() * 1.2;
    const pts: THREE.Vector3[] = [];
    const segs = 30;
    const r = R2 * Math.cos(lat);
    const y = R2 * Math.sin(lat);
    for (let j = 0; j <= segs; j++) {
      const a = startLon + (j / segs) * arcLen;
      pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
    }
    shell2.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat('mid', 0.2 + Math.random() * 0.3)
      )
    );
  }

  for (let i = 0; i < arcLonCount; i++) {
    const lon = Math.random() * Math.PI * 2;
    const startLat = (Math.random() - 0.5) * Math.PI * 0.8;
    const arcLen = 0.3 + Math.random() * 0.8;
    const pts: THREE.Vector3[] = [];
    const segs = 20;
    for (let j = 0; j <= segs; j++) {
      const lat = startLat + (j / segs) * arcLen;
      pts.push(
        new THREE.Vector3(
          R2 * Math.cos(lat) * Math.cos(lon),
          R2 * Math.sin(lat),
          R2 * Math.cos(lat) * Math.sin(lon)
        )
      );
    }
    shell2.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat('dim', 0.15 + Math.random() * 0.2)
      )
    );
  }
  orbGroup.add(shell2);

  // LAYER 4: INNER CORE
  const innerCore = new THREE.Group();
  const R3 = 0.9;

  for (let s = 0; s < 8; s++) {
    const pts: THREE.Vector3[] = [];
    const turns = 3 + Math.random() * 2;
    const segs = 300;
    const phase = (s / 8) * Math.PI * 2;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const lat = t * Math.PI - Math.PI / 2;
      const lon = t * turns * Math.PI * 2 + phase;
      pts.push(
        new THREE.Vector3(
          R3 * Math.cos(lat) * Math.cos(lon),
          R3 * Math.sin(lat),
          R3 * Math.cos(lat) * Math.sin(lon)
        )
      );
    }
    innerCore.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        lineMat('bright', 0.3 + Math.random() * 0.2)
      )
    );
  }

  for (let i = -6; i <= 6; i++) {
    const lat = (i / 6) * (Math.PI / 2) * 0.9;
    innerCore.add(new THREE.Line(latRing(R3, lat, 80), lineMat('dim', 0.2)));
  }

  for (let i = 0; i < 12; i++) {
    const lon = (i / 12) * Math.PI * 2;
    innerCore.add(new THREE.Line(meridian(R3, lon, 80), lineMat('dim', 0.15)));
  }

  orbGroup.add(innerCore);

  // LAYER 5: INNERMOST CORE
  const coreR = 0.25;

  const icoGeo = new THREE.IcosahedronGeometry(coreR, 1);
  const icoEdges = new THREE.EdgesGeometry(icoGeo);
  const icoWireMat = lineMat('hot', 0.9);
  const icoWire = new THREE.LineSegments(icoEdges, icoWireMat);
  orbGroup.add(icoWire);

  const coreSphereMat = registerMaterial(
    new THREE.MeshBasicMaterial({
      color: activeColors.hot,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    }),
    'hot'
  );
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), coreSphereMat);
  orbGroup.add(coreSphere);

  const glowSphereMat = registerMaterial(
    new THREE.MeshBasicMaterial({
      color: activeColors.mid,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
    }),
    'mid'
  );
  const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), glowSphereMat);
  orbGroup.add(glowSphere);

  // CODE TEXT
  const codeSnippets = [
    "sys.init()", "0xFF3A", "malloc()", ">> SCAN", "void*", "ACK",
    "SYNC OK", "ptr_ref", "exec()", "hash256", "::bind", "core.0",
    "01101001", "10110100", ">>> RDY", "HEAP 4K", "TCP/SYN",
    "mutex.lk", "IRQ 0x7", "DMA xfer", "REG EAX", "FAULT 0",
    "kernel.d", "pipe |>", "chmod +x", "fork()", "SIGTERM",
    "eth0: UP", "AES-256", "RSA 4096", "TLS 1.3", "HTTP/2",
    "latency", "200 OK", "PATCH /", "fn main", "use std",
    "impl Orb", "async {}", "spawn()", "arc::new", ".unwrap",
  ];

  interface SpriteDrift {
    phi: number;
    theta: number;
    r: number;
    speed: number;
  }

  function makeTextSprite(text: string, size = 0.08) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 32;
    const ctx = c.getContext("2d")!;
    ctx.font = "bold 14px Courier New";
    const alpha = 0.35 + Math.random() * 0.55;
    // Draw white text so tinting works correctly
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 16);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;

    const mat = registerMaterial(
      new THREE.SpriteMaterial({
        map: tex,
        color: activeColors.bright,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      'bright'
    );
    const s = new THREE.Sprite(mat);
    s.scale.set(size * 5, size * 0.7, 1);
    return s;
  }

  function scatterText(count: number, sizeFn: () => number, rFn: () => number, speedScale: [number, number]) {
    const group = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const sp = makeTextSprite(
        codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
        sizeFn()
      );
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = rFn();
      sp.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      sp.userData = {
        phi,
        theta,
        r,
        speed:
          (speedScale[0] + Math.random() * speedScale[1]) *
          (Math.random() > 0.5 ? 1 : -1),
      } satisfies SpriteDrift;
      group.add(sp);
    }
    return group;
  }

  const textOuterCount = isSmall ? 0 : 80;
  const textInnerCount = isSmall ? 0 : 20;
  const textAmbientCount = isSmall ? 0 : 30;

  const textOuter = scatterText(
    textOuterCount,
    () => 0.04 + Math.random() * 0.04,
    () => R1 + 0.03 + Math.random() * 0.08,
    [0.0002, 0.0008]
  );
  orbGroup.add(textOuter);

  const textInner = scatterText(
    textInnerCount,
    () => 0.03 + Math.random() * 0.03,
    () => R3 + 0.02,
    [0.0005, 0.001]
  );
  orbGroup.add(textInner);

  const textAmbient = scatterText(
    textAmbientCount,
    () => 0.03,
    () => R3 + 0.2 + Math.random() * (R1 - R3 - 0.3),
    [0.0003, 0.0006]
  );
  orbGroup.add(textAmbient);

  // ORBITING DEBRIS
  const debrisGeos = [
    new THREE.IcosahedronGeometry(0.012, 0),
    new THREE.IcosahedronGeometry(0.02, 0),
    new THREE.IcosahedronGeometry(0.03, 1),
    new THREE.IcosahedronGeometry(0.008, 0),
    new THREE.TetrahedronGeometry(0.015, 0),
    new THREE.OctahedronGeometry(0.018, 0),
  ];
  interface DebrisOrbit {
    orbitR: number;
    speed: number;
    tiltX: number;
    tiltZ: number;
    phase: number;
  }
  const debris: THREE.Mesh[] = [];
  const debrisCount = isSmall ? 10 : 30;
  for (let i = 0; i < debrisCount; i++) {
    const geo = debrisGeos[Math.floor(Math.random() * debrisGeos.length)];
    const debrisColorType = Math.random() > 0.7 ? 'bright' : ('mid' as const);
    const mat = registerMaterial(
      new THREE.MeshBasicMaterial({
        color: activeColors[debrisColorType],
        transparent: true,
        opacity: 0.3 + Math.random() * 0.6,
        blending: THREE.AdditiveBlending,
      }),
      debrisColorType
    );
    const mesh = new THREE.Mesh(geo, mat);
    const orbitR = 1.2 + Math.random() * 4.0;
    const speed = (0.08 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1);
    const tiltX = (Math.random() - 0.5) * Math.PI * 0.9;
    const tiltZ = (Math.random() - 0.5) * Math.PI * 0.5;
    const phase = Math.random() * Math.PI * 2;
    mesh.userData = { orbitR, speed, tiltX, tiltZ, phase } satisfies DebrisOrbit;
    debris.push(mesh);
    orbGroup.add(mesh);

    if (Math.random() > 0.85) {
      const trailPts: THREE.Vector3[] = [];
      for (let j = 0; j <= 15; j++) {
        const a = -(j / 15) * 0.3;
        trailPts.push(
          new THREE.Vector3(
            orbitR * Math.cos(a + phase),
            orbitR * 0.08 * Math.sin(a * 3),
            orbitR * Math.sin(a + phase)
          )
        );
      }
      const trail = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(trailPts),
        lineMat('faint', 0.08)
      );
      mesh.add(trail);
    }
  }

  // DUST PARTICLES
  const dustCount = isSmall ? 100 : 350;
  const dustPos = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    const rr = 0.5 + Math.pow(Math.random(), 0.6) * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dustPos[i * 3] = rr * Math.sin(phi) * Math.cos(theta);
    dustPos[i * 3 + 1] = rr * Math.cos(phi);
    dustPos[i * 3 + 2] = rr * Math.sin(phi) * Math.sin(theta);
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(dustPos, 3));

  const dotC = document.createElement("canvas");
  dotC.width = dotC.height = 64;
  const dCtx = dotC.getContext("2d")!;
  const g = dCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(255,255,255,0.6)");
  g.addColorStop(0.5, "rgba(255,255,255,0.15)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  dCtx.fillStyle = g;
  dCtx.fillRect(0, 0, 64, 64);

  const dustMat = registerMaterial(
    new THREE.PointsMaterial({
      map: new THREE.CanvasTexture(dotC),
      size: 0.04,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      color: activeColors.bright,
    }),
    'bright'
  );
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  orbGroup.add(dustPoints);

  // SCANNING RINGS
  function makeScanRing(radius: number, thickness = 0.015) {
    const geo = new THREE.RingGeometry(radius - thickness, radius + thickness, 120);
    const mat = registerMaterial(
      new THREE.MeshBasicMaterial({
        color: activeColors.bright,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      'bright'
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  const scanRing1 = makeScanRing(R1, 0.01);
  const scanRing2 = makeScanRing(R1 * 0.7, 0.008);
  orbGroup.add(scanRing1, scanRing2);

  // HEXAGONAL NODES
  for (let i = 0; i < 15; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = R1 + 0.02;
    const hexGeo = new THREE.CircleGeometry(0.03 + Math.random() * 0.02, 6);
    const hexEdges = new THREE.EdgesGeometry(hexGeo);
    const hex = new THREE.LineSegments(hexEdges, lineMat('mid', 0.5));
    hex.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    hex.lookAt(0, 0, 0);
    outerShell.add(hex);
  }

  // GESTURE / PROGRAMMATIC CAMERA CONTROL
  const sphericalScratch = new THREE.Spherical();
  const offsetScratch = new THREE.Vector3();

  function rotateBy(deltaTheta: number, deltaPhi: number) {
    offsetScratch.copy(camera.position).sub(controls.target);
    sphericalScratch.setFromVector3(offsetScratch);
    sphericalScratch.theta -= deltaTheta;
    sphericalScratch.phi = THREE.MathUtils.clamp(
      sphericalScratch.phi - deltaPhi,
      0.05,
      Math.PI - 0.05
    );
    sphericalScratch.makeSafe();
    offsetScratch.setFromSpherical(sphericalScratch);
    camera.position.copy(controls.target).add(offsetScratch);
    camera.lookAt(controls.target);
  }

  function zoomBy(factor: number) {
    offsetScratch.copy(camera.position).sub(controls.target);
    const dist = THREE.MathUtils.clamp(
      offsetScratch.length() * factor,
      MIN_DISTANCE,
      MAX_DISTANCE
    );
    offsetScratch.setLength(dist);
    camera.position.copy(controls.target).add(offsetScratch);
  }

  function resetView() {
    camera.position.copy(HOME_POSITION);
    controls.target.set(0, 0, 0);
    camera.lookAt(controls.target);
    controls.update();
  }

  // ANIMATION
  const clock = new THREE.Clock();
  let flickerTimer = 0;
  let rafId = 0;
  let disposed = false;
  let lastFrameTime = 0;
  const fpsInterval = isSmall ? 1000 / 30 : 0; // 30 FPS throttle for small buttons, uncapped for full overlays

  function animate() {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);

    const now = performance.now();
    const elapsed = now - lastFrameTime;

    if (fpsInterval > 0 && elapsed < fpsInterval) {
      return;
    }
    lastFrameTime = now - (elapsed % fpsInterval);

    const t = clock.getElapsedTime();

    // Lerp active colors towards target state colors
    const target = stateColors[currentState];
    const lerpSpeed = 0.05; // smooth transitions
    activeColors.bright.lerp(target.bright, lerpSpeed);
    activeColors.mid.lerp(target.mid, lerpSpeed);
    activeColors.dim.lerp(target.dim, lerpSpeed);
    activeColors.faint.lerp(target.faint, lerpSpeed);
    activeColors.hot.lerp(target.hot, lerpSpeed);

    // Apply active colors to all registered materials
    for (let i = 0; i < colorTrackedMaterials.length; i++) {
      const entry = colorTrackedMaterials[i];
      if (entry.material.color) {
        entry.material.color.copy(activeColors[entry.type]);
      }
    }

    // State-based speed and surge parameters
    let speedMult = 1.0;
    let rotationSpeed = 0.0015;
    let innerRotationSpeed = 0.005;
    let waveFreq = 1.2;
    let corePulseFreq = 5;
    let surge = 0.0;
    let coreOpacityBase = 0.08;

    if (currentState === 'listening') {
      speedMult = 1.4;
      rotationSpeed = 0.0025;
      innerRotationSpeed = 0.008;
      waveFreq = 2.0;
      const breathe = Math.sin(t * waveFreq);
      surge = 0.2 + breathe * 0.15;
      coreOpacityBase = 0.15;
    } else if (currentState === 'thinking') {
      speedMult = 4.0; // Spin super fast!
      rotationSpeed = 0.01;
      innerRotationSpeed = 0.03;
      waveFreq = 8.0;
      corePulseFreq = 20;
      const thinkingSurge = Math.sin(t * waveFreq);
      surge = 0.8 + thinkingSurge * 0.3;
      coreOpacityBase = 0.25;
    } else if (currentState === 'speaking') {
      speedMult = 1.2;
      rotationSpeed = 0.002;
      innerRotationSpeed = 0.006;
      waveFreq = 3.5;
      const speechWave = Math.sin(t * waveFreq);
      surge = 0.4 + speechWave * 0.25;
      coreOpacityBase = 0.2;
    } else {
      // Idle
      speedMult = 1.0;
      rotationSpeed = 0.0015;
      innerRotationSpeed = 0.005;
      waveFreq = 1.2;
      corePulseFreq = 5;
      const wave3 = Math.pow(Math.max(0, Math.sin(t * 0.4)), 5);
      const wave4 = Math.pow(Math.max(0, Math.sin(t * 0.7 + 2)), 8);
      surge = wave3 * 1.5 + wave4 * 2.0;
      coreOpacityBase = 0.08;
    }

    const fadeOut = Math.pow(Math.max(0, Math.sin(t * 0.25)), 3);

    outerShell.rotation.y += rotationSpeed;
    outerShell.rotation.x = Math.sin(t * 0.08) * 0.05;

    panelGroup.rotation.y += rotationSpeed * 1.2;
    panelGroup.rotation.x = Math.sin(t * 0.08 + 0.5) * 0.04;

    shell2.rotation.y -= rotationSpeed * 0.7;
    shell2.rotation.z = Math.sin(t * 0.12) * 0.03;

    innerCore.rotation.y -= innerRotationSpeed;
    innerCore.rotation.z += innerRotationSpeed * 0.4;
    innerCore.rotation.x = Math.cos(t * 0.1) * 0.08;

    icoWire.rotation.x += 0.008 * speedMult;
    icoWire.rotation.y += 0.012 * speedMult;

    const wave1 = Math.sin(t * waveFreq);
    const coreScale = 1 + surge + Math.sin(t * corePulseFreq) * 0.05;
    coreSphere.scale.setScalar(coreScale);
    
    // Core opacity changes to reflect activity
    const coreOpacity = Math.max(
      0,
      (coreOpacityBase + wave1 * 0.05 + surge * 0.2) * (1 - (currentState === 'idle' ? fadeOut * 0.95 : 0))
    );
    coreSphereMat.opacity = Math.min(0.6, coreOpacity);
    glowSphere.scale.setScalar(1 + surge * 0.8);
    glowSphereMat.opacity = Math.max(0, (0.03 + surge * 0.08) * (1 - (currentState === 'idle' ? fadeOut * 0.9 : 0)));
    icoWire.scale.setScalar(1 + surge * 0.6);
    icoWireMat.opacity = Math.min(1, 0.5 + surge * 0.4);

    debris.forEach((d) => {
      const u = d.userData as DebrisOrbit;
      const a = t * u.speed * (speedMult * 0.8) + u.phase;
      d.position.set(
        u.orbitR * Math.cos(a) * Math.cos(u.tiltX),
        u.orbitR * Math.sin(u.tiltX) * Math.sin(a * 0.8) + Math.sin(a * 0.3 + u.tiltZ) * 0.2,
        u.orbitR * Math.sin(a) * Math.cos(u.tiltZ)
      );
      d.rotation.x += 0.015 * speedMult;
      d.rotation.z += 0.01 * speedMult;
    });

    const driftGroups: [THREE.Group, number][] = [
      [textOuter, 1],
      [textInner, 2],
      [textAmbient, 1.2],
    ];
    for (const [group, mult] of driftGroups) {
      group.children.forEach((sp) => {
        const u = sp.userData as SpriteDrift;
        u.theta += u.speed * mult * speedMult;
        sp.position.set(
          u.r * Math.sin(u.phi) * Math.cos(u.theta),
          u.r * Math.cos(u.phi),
          u.r * Math.sin(u.phi) * Math.sin(u.theta)
        );
      });
    }

    const scanY1 = Math.sin(t * 0.4) * R1;
    scanRing1.position.y = scanY1;
    const scanS1 = Math.sqrt(Math.max(0, R1 * R1 - scanY1 * scanY1)) / R1;
    scanRing1.scale.set(scanS1, scanS1, 1);
    (scanRing1.material as THREE.MeshBasicMaterial).opacity = 0.2 * scanS1;

    const scanY2 = Math.sin(t * 0.6 + 2) * R3;
    scanRing2.position.y = scanY2;
    const scanS2 = Math.sqrt(Math.max(0, R3 * R3 - scanY2 * scanY2)) / R3;
    scanRing2.scale.set(scanS2, scanS2, 1);
    (scanRing2.material as THREE.MeshBasicMaterial).opacity = 0.15 * scanS2;

    dustPoints.rotation.y += 0.0002 * speedMult;

    flickerTimer += 0.016;
    if (flickerTimer > 0.1) {
      flickerTimer = 0;
      panelGroup.children.forEach((p) => {
        if (Math.random() > 0.95) {
          p.visible = !p.visible;
        }
      });
    }

    controls.update();

    if (!isSmall && composer && bloom && chromaticPass) {
      bloom.strength = 1.6 + Math.sin(t * 0.8) * 0.3;
      chromaticPass.uniforms.uTime.value = t;
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  animate();

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) {
      composer.setSize(w, h);
    }
  }
  window.addEventListener("resize", onResize);

  function dispose() {
    disposed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    controls.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        const anyMat = mat as THREE.Material & { map?: THREE.Texture };
        anyMat.map?.dispose();
        mat.dispose();
      }
    });
    if (composer) {
      composer.dispose();
    }
    renderer.dispose();
    renderer.domElement.remove();
  }

  return {
    rotateBy,
    zoomBy,
    zoomIn: () => zoomBy(0.65),
    zoomOut: () => zoomBy(1.55),
    resetView,
    dispose,
    updateState: (state: 'idle' | 'listening' | 'thinking' | 'speaking') => {
      currentState = state;
    },
  };
}
