/* ═══════════════════════════════════════════════════════════════════
   cadleitores.js — Andrômeda · Cadastro de Leitores
   Mesma base visual do login · Nebulosa cinematográfica + Eco Mode
   THREE.js r128 + Bloom opcional + Cursor magnético otimizado
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════
     0. QUALIDADE / ECO MODE
  ═══════════════════════════════════════════════════════════════ */

  const QUALITY_PROFILES = {
    cinematic: {
      label: "Cinema",
      title: "Modo Cinema",
      status: "Bloom alto · 60 FPS · máxima profundidade",
      nextLabel: "Ativar Eco",
      nextMode: "eco",
      className: "is-cinema",
      dpr: 1.82,
      fps: 60,
      stars: 1.08,
      clouds: 1.08,
      filaments: 1.10,
      galaxies: 1.05,
      bloom: true,
      bloomStrength: 1.46,
      bloomRadius: 0.58,
      bloomThreshold: 0.082,
      nebulaOctaves: 5,
      antialias: false,
      motionScale: 1.12,
      toneMappingExposure: 1.22,
      cursorLerp: 0.36,
    },

    balanced: {
      label: "Equilíbrio",
      title: "Modo Equilibrado",
      status: "Bloom médio · 45 FPS · fluidez estável",
      nextLabel: "Ativar Cinema",
      nextMode: "cinematic",
      className: "is-balanced",
      dpr: 1.36,
      fps: 45,
      stars: 0.72,
      clouds: 0.76,
      filaments: 0.76,
      galaxies: 0.82,
      bloom: true,
      bloomStrength: 0.98,
      bloomRadius: 0.42,
      bloomThreshold: 0.13,
      nebulaOctaves: 4,
      antialias: false,
      motionScale: 0.92,
      toneMappingExposure: 1.16,
      cursorLerp: 0.40,
    },

    eco: {
      label: "Eco",
      title: "Modo Eco",
      status: "Bloom leve · 30 FPS · beleza otimizada",
      nextLabel: "Ativar Equilibrado",
      nextMode: "balanced",
      className: "is-eco",
      dpr: 1.0,
      fps: 30,
      stars: 0.46,
      clouds: 0.52,
      filaments: 0.52,
      galaxies: 0.58,
      bloom: true,
      bloomStrength: 0.48,
      bloomRadius: 0.26,
      bloomThreshold: 0.22,
      nebulaOctaves: 3,
      antialias: false,
      motionScale: 0.68,
      toneMappingExposure: 1.10,
      cursorLerp: 0.46,
    },
  };

  function detectBestQuality() {
    const saved = localStorage.getItem("andromeda-quality");
    if (saved && QUALITY_PROFILES[saved]) return saved;

    const isMobile = window.innerWidth < 768;
    const weakCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const weakMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const reducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || isMobile || weakMemory) return "eco";
    if (weakCPU) return "balanced";
    return "cinematic";
  }

  const QUALITY_NAME = detectBestQuality();
  const QUALITY = QUALITY_PROFILES[QUALITY_NAME];

  const qCount = (value, kind) => Math.max(1, Math.floor(value * QUALITY[kind]));

  /* ═══════════════════════════════════════════════════════════════
     1. WEBGL — FUNDO CÓSMICO DO LOGIN APLICADO AO CADASTRO
  ═══════════════════════════════════════════════════════════════ */

  const container = document.getElementById("webgl");
  const hasWebGL = container && typeof THREE !== "undefined";

  if (hasWebGL) {
    let vW = window.innerWidth;
    let vH = window.innerHeight;
    const MOBILE = vW < 768;
    const DPR = Math.min(window.devicePixelRatio || 1, QUALITY.dpr);

    const renderer = new THREE.WebGLRenderer({
      antialias: QUALITY.antialias && !MOBILE,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(DPR);
    renderer.setSize(vW, vH);
    renderer.setClearColor(0x000306, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping || THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = QUALITY.toneMappingExposure || 1.16;

    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ("outputEncoding" in renderer) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, vW / vH, 0.1, 5000);
    camera.position.set(0, 0, 130);

    const root = new THREE.Group();
    scene.add(root);

    /* ── Post-processing / Bloom opcional ─────────────────────── */
    let composer = null;
    let bloomPass = null;

    if (
      QUALITY.bloom &&
      typeof THREE.EffectComposer !== "undefined" &&
      typeof THREE.RenderPass !== "undefined" &&
      typeof THREE.UnrealBloomPass !== "undefined"
    ) {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(vW, vH),
        QUALITY.bloomStrength,
        QUALITY.bloomRadius,
        QUALITY.bloomThreshold
      );
      composer.addPass(bloomPass);
    }

    /* ╔════════════════════════════════════════════════════════════╗
       ║ NEBULOSA — shader de fundo otimizado                      ║
       ╚════════════════════════════════════════════════════════════╝ */

    const VS_QUAD = /* glsl */`
      void main() {
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `;

    const FS_NEBULA = /* glsl */`
      precision highp float;

      uniform float uTime;
      uniform vec2  uResolution;
      uniform vec2  uMouse;

      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(dot(hash2(i), f), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
          mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.52;
        mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
        for (int i = 0; i < ${QUALITY.nebulaOctaves}; i++) {
          v += a * noise(p);
          p = rot * p * 2.08;
          a *= 0.50;
        }
        return v;
      }

      float fbmL(vec2 p) {
        float v = 0.0;
        float a = 0.52;
        mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
        for (int i = 0; i < ${Math.max(2, QUALITY.nebulaOctaves - 1)}; i++) {
          v += a * noise(p);
          p = rot * p * 2.08;
          a *= 0.50;
        }
        return v;
      }

      const vec3 C_VOID  = vec3(0.000, 0.006, 0.020);
      const vec3 C_OIII  = vec3(0.008, 0.260, 0.640);
      const vec3 C_HBETA = vec3(0.020, 0.095, 0.480);
      const vec3 C_HALP  = vec3(0.880, 0.085, 0.145);
      const vec3 C_MIRI  = vec3(0.720, 0.295, 0.035);
      const vec3 C_GOLD  = vec3(0.940, 0.660, 0.110);
      const vec3 C_TEAL  = vec3(0.015, 0.680, 0.540);
      const vec3 C_PURP  = vec3(0.260, 0.050, 0.580);
      const vec3 C_ROSE  = vec3(0.760, 0.180, 0.380);

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float ar = uResolution.x / uResolution.y;
        vec2 p = (uv - 0.5) * vec2(ar, 1.0) * 2.2;
        p += uMouse * 0.038;

        float t = uTime * 0.030;

        vec2 q = vec2(
          fbm(p + t),
          fbm(p + vec2(5.2, 1.3))
        );

        vec2 r = vec2(
          fbm(p + 3.6 * q + vec2(1.7, 9.2) + 0.130 * t),
          fbm(p + 3.6 * q + vec2(8.3, 2.8) + 0.112 * t)
        );

        float f = fbm(p + 4.2 * r);
        float g = fbmL(p * 1.62 + 2.6 * q + vec2(0.0, t * 0.32));
        float breath = fbmL(p * 0.56 + vec2(0.0, t * 0.18));

        vec3 col = C_VOID;
        col = mix(col, C_HBETA, smoothstep(-0.08, 0.45, f) * 0.50);
        col = mix(col, C_OIII,  smoothstep( 0.10, 0.60, f) * 0.62);
        col = mix(col, C_MIRI,  smoothstep( 0.38, 0.74, f) * 0.54);
        col = mix(col, C_HALP,  smoothstep( 0.58, 0.88, f) * 0.48);

        col += smoothstep(0.46, 0.68, g) * C_TEAL * 0.34;

        float coreF = smoothstep(0.70, 0.94, f) * smoothstep(0.64, 0.88, g);
        col += coreF * C_GOLD * 0.68;

        col = mix(
          col,
          C_PURP,
          smoothstep(0.28, 0.52, g) * (1.0 - smoothstep(0.55, 0.80, f)) * 0.28
        );

        float edgeGlow = smoothstep(0.40, 0.62, f) * (1.0 - smoothstep(0.62, 0.78, f));
        col += edgeGlow * C_ROSE * 0.20;

        /* Pilares escuros de gás molecular, mais baratos que geometria extra */
        float px1 = abs(uv.x - 0.285) * 6.3;
        float px2 = abs(uv.x - 0.650) * 7.0;
        float pn1 = fbmL(vec2(px1 * 0.78, uv.y * 2.8 + t * 0.055));
        float pn2 = fbmL(vec2(px2 * 0.82, uv.y * 2.4 + t * 0.048));
        float pm1 = (1.0 - smoothstep(0.0, 0.85, px1)) * smoothstep(0.05, 0.88, uv.y);
        float pm2 = (1.0 - smoothstep(0.0, 0.78, px2)) * smoothstep(0.12, 0.95, uv.y) * 0.86;
        vec3 pillarBody = C_MIRI * 0.26 + C_VOID * 0.74;
        col = mix(col, pillarBody, pm1 * smoothstep(0.36, 0.62, pn1) * 0.70);
        col = mix(col, pillarBody * 0.90, pm2 * smoothstep(0.40, 0.64, pn2) * 0.58);

        float e1 = pm1 * smoothstep(0.32, 0.50, pn1) * (1.0 - smoothstep(0.50, 0.66, pn1));
        float e2 = pm2 * smoothstep(0.35, 0.52, pn2) * (1.0 - smoothstep(0.52, 0.68, pn2));
        col += (e1 * 0.40 + e2 * 0.32) * mix(C_TEAL * 1.4, C_OIII * 1.6, 0.55);

        float topCluster = smoothstep(0.70, 1.0, uv.y) * smoothstep(-0.15, 0.5, fbm(p * 0.8 + vec2(0.0, t * 0.12)));
        col += topCluster * (C_GOLD * 0.30 + C_OIII * 0.18);

        float cliff = smoothstep(0.30, 0.02, uv.y) * smoothstep(-0.1, 0.5, fbm(p * 1.2 + vec2(t * 0.08, 0.0)));
        col = mix(col, C_MIRI * 0.56, cliff * 0.48);
        col += cliff * C_HALP * 0.16;

        col = clamp(col, 0.0, 1.0);
        col = pow(col, vec3(0.88));

        float cGlow = 1.0 - length(p * vec2(0.58, 0.72));
        col += max(0.0, cGlow * 0.50) * vec3(0.004, 0.014, 0.044);
        col *= 0.92 + breath * 0.10;

        float vign = length((uv - 0.5) * vec2(1.0, 1.25));
        col *= 1.0 - smoothstep(0.35, 1.10, vign) * 0.74;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: VS_QUAD,
      fragmentShader: FS_NEBULA,
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(vW, vH) },
        uMouse: { value: new THREE.Vector2(0.0, 0.0) },
      },
      depthTest: false,
      depthWrite: false,
    });

    const nebulaMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), nebulaMat);
    nebulaMesh.frustumCulled = false;
    nebulaMesh.renderOrder = -100;
    scene.add(nebulaMesh);

    /* ╔════════════════════════════════════════════════════════════╗
       ║ ESTRELAS — pulsação na GPU, sem atualizar matriz no loop   ║
       ╚════════════════════════════════════════════════════════════╝ */

    const SPECTRAL = [
      { hex: "#9bb4ff", prob: 0.010, sz: [1.2, 4.7] },
      { hex: "#b0c6ff", prob: 0.030, sz: [1.1, 4.1] },
      { hex: "#d8ecff", prob: 0.072, sz: [0.9, 3.6] },
      { hex: "#f8f4ff", prob: 0.105, sz: [0.8, 3.2] },
      { hex: "#fff8e8", prob: 0.155, sz: [0.75, 3.0] },
      { hex: "#ffd4a0", prob: 0.265, sz: [0.65, 2.8] },
      { hex: "#ffb862", prob: 0.363, sz: [0.58, 2.5] },
    ];

    function pickStar() {
      let acc = 0;
      const r = Math.random();
      for (const s of SPECTRAL) {
        acc += s.prob;
        if (r <= acc) return s;
      }
      return SPECTRAL[SPECTRAL.length - 1];
    }

    const VS_STAR = /* glsl */`
      attribute float aSize;
      attribute float aPhase;
      attribute float aSpeed;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vColor = color;
        float pulse = 0.84 + sin(uTime * aSpeed + aPhase) * 0.18;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * pulse * uPixelRatio * (340.0 / max(1.0, -mvPosition.z));
        vAlpha = clamp(pulse, 0.58, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const FS_STAR = /* glsl */`
      precision mediump float;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);
        float core = smoothstep(0.50, 0.02, d);
        float halo = smoothstep(0.50, 0.16, d) * 0.35;
        float alpha = (core + halo) * vAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(vColor * (1.0 + core * 0.65), alpha);
      }
    `;

    function buildStarField(N, opt) {
      const positions = new Float32Array(N * 3);
      const colors = new Float32Array(N * 3);
      const sizes = new Float32Array(N);
      const phases = new Float32Array(N);
      const speeds = new Float32Array(N);

      const color = new THREE.Color();

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const star = pickStar();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = opt.rMin + Math.pow(Math.random(), 0.62) * (opt.rMax - opt.rMin);

        positions[i3] = Math.sin(phi) * Math.cos(theta) * r;
        positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r * opt.flat;
        positions[i3 + 2] = Math.cos(phi) * r + opt.z;

        color.set(star.hex).multiplyScalar(0.55 + Math.random() * 0.70);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        sizes[i] = (star.sz[0] + Math.pow(Math.random(), 1.8) * (star.sz[1] - star.sz[0])) * opt.scale;
        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = 0.30 + Math.random() * 1.28;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
      geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

      const mat = new THREE.ShaderMaterial({
        vertexShader: VS_STAR,
        fragmentShader: FS_STAR,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: DPR },
        },
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      root.add(points);
      return points;
    }

    const starLayers = [
      buildStarField(qCount(MOBILE ? 1300 : 2600, "stars"), {
        scale: 0.80,
        rMin: 240,
        rMax: 1850,
        flat: 0.36,
        z: -720,
      }),
      buildStarField(qCount(MOBILE ? 600 : 1150, "stars"), {
        scale: 1.20,
        rMin: 90,
        rMax: 760,
        flat: 0.50,
        z: -240,
      }),
      buildStarField(qCount(MOBILE ? 140 : 280, "stars"), {
        scale: 2.45,
        rMin: 38,
        rMax: 360,
        flat: 0.66,
        z: 42,
      }),
    ];

    /* ── Estrelas brilhantes com espinhos JWST ─────────────────── */

    function makeSpikeGroup(x, y, z, sc, hex) {
      const baseCol = new THREE.Color(hex);
      const grp = new THREE.Group();
      grp.position.set(x, y, z);

      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(sc * 0.52, QUALITY_NAME === "eco" ? 8 : 14, QUALITY_NAME === "eco" ? 8 : 14),
        new THREE.MeshBasicMaterial({
          color: baseCol,
          transparent: true,
          opacity: 1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      ));

      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(sc * 2.2, QUALITY_NAME === "eco" ? 8 : 12, QUALITY_NAME === "eco" ? 8 : 12),
        new THREE.MeshBasicMaterial({
          color: baseCol,
          transparent: true,
          opacity: 0.13,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      ));

      const axes = [
        { ang: 0, len: sc * 30, bright: 0.55 },
        { ang: Math.PI / 4, len: sc * 22, bright: 0.36 },
        { ang: Math.PI / 2, len: sc * 30, bright: 0.55 },
        { ang: Math.PI * 3 / 4, len: sc * 22, bright: 0.36 },
      ];

      axes.forEach((ax) => {
        const pts = [];
        const steps = QUALITY_NAME === "eco" ? 24 : 44;
        for (let k = 0; k < steps; k++) {
          const tt = (k / (steps - 1)) * 2 - 1;
          const d = tt * ax.len;
          pts.push(new THREE.Vector3(Math.cos(ax.ang) * d, Math.sin(ax.ang) * d, 0));
        }
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        const m = new THREE.LineBasicMaterial({
          color: baseCol,
          transparent: true,
          opacity: ax.bright,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        grp.add(new THREE.Line(g, m));
      });

      return grp;
    }

    const brightStarData = [
      { x: 44, y: 28, z: -82, sc: 1.72, hex: "#cce8ff" },
      { x: -64, y: -24, z: -115, sc: 1.35, hex: "#ffdcb0" },
      { x: 16, y: 46, z: -60, sc: 1.08, hex: "#aac4ff" },
      { x: -30, y: 40, z: -96, sc: 1.15, hex: "#fff8e0" },
      { x: 74, y: -34, z: -145, sc: 0.92, hex: "#ffcca0" },
      { x: -9, y: -52, z: -72, sc: 0.80, hex: "#d0f0ff" },
      { x: -88, y: 18, z: -200, sc: 0.70, hex: "#b8d8ff" },
    ];

    const spikeGroups = brightStarData
      .slice(0, QUALITY_NAME === "eco" ? 4 : brightStarData.length)
      .map((b) => makeSpikeGroup(b.x, b.y, b.z, b.sc, b.hex));
    spikeGroups.forEach((g) => root.add(g));

    /* ── Galáxias distantes do deep field ──────────────────────── */

    function makeGalaxyCanvas(type) {
      const C = document.createElement("canvas");
      C.width = C.height = 64;
      const ctx = C.getContext("2d");
      const cx = 32;
      const cy = 32;

      if (type === 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
        g.addColorStop(0, "rgba(255,225,155,0.96)");
        g.addColorStop(0.45, "rgba(215,160,55,0.42)");
        g.addColorStop(1, "rgba(140,70,10,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22, 13, 0.62, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 1) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
        g.addColorStop(0, "rgba(255,255,245,0.94)");
        g.addColorStop(0.5, "rgba(180,210,255,0.40)");
        g.addColorStop(1, "rgba(100,160,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        for (let arm = 0; arm < 2; arm++) {
          ctx.strokeStyle = arm === 0 ? "rgba(140,175,255,0.42)" : "rgba(170,195,255,0.30)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let k = 0; k <= 48; k++) {
            const tt = (k / 48) * Math.PI * 2.5;
            const rr = 4.5 + tt * 8;
            const xx = cx + rr * Math.cos(tt + arm * Math.PI);
            const yy = cy + rr * Math.sin(tt + arm * Math.PI) * 0.52;
            k === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }
      } else {
        const g = ctx.createRadialGradient(cx - 5, cy + 3, 0, cx, cy, 20);
        g.addColorStop(0, "rgba(200,155,255,0.86)");
        g.addColorStop(0.5, "rgba(110,125,255,0.36)");
        g.addColorStop(1, "rgba(55,65,210,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(C);
      tex.needsUpdate = true;
      return tex;
    }

    const galaxyTypes = QUALITY_NAME === "eco" ? 2 : 3;
    const galaxyEach = qCount(40, "galaxies");
    const galDummy = new THREE.Object3D();

    for (let ti = 0; ti < galaxyTypes; ti++) {
      const tex = makeGalaxyCanvas(ti);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: QUALITY_NAME === "eco" ? 0.48 : 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const inst = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, galaxyEach);
      inst.frustumCulled = false;

      for (let i = 0; i < galaxyEach; i++) {
        const sz = 2.0 + Math.random() * 8.8;
        galDummy.scale.set(sz * (0.52 + Math.random() * 0.92), sz * (0.36 + Math.random() * 0.64), 1);
        galDummy.rotation.z = Math.random() * Math.PI * 2;
        galDummy.position.set(
          (Math.random() - 0.5) * 720,
          (Math.random() - 0.5) * 360,
          -260 - Math.random() * 1450
        );
        galDummy.updateMatrix();
        inst.setMatrixAt(i, galDummy.matrix);
      }
      root.add(inst);
    }

    /* ── Filamentos e nuvens volumétricas ─────────────────────── */

    function makeFilament(N, hex, spreadR, depth, opacity) {
      const pos = new Float32Array(N * 3);
      const cols = new Float32Array(N * 3);
      const c = new THREE.Color(hex);
      const ax = (Math.random() - 0.5) * 320;
      const ay = (Math.random() - 0.5) * 200;

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const tt = (i / N) * Math.PI * (3.8 + Math.random() * 2.4);
        const rr = 8 + tt * spreadR * 0.45;
        pos[i3] = ax + Math.cos(tt) * rr + (Math.random() - 0.5) * 24;
        pos[i3 + 1] = ay + Math.sin(tt) * rr * 0.48 + (Math.random() - 0.5) * 16;
        pos[i3 + 2] = depth + (Math.random() - 0.5) * 70;
        const b = 0.32 + Math.random() * 0.78;
        cols[i3] = c.r * b;
        cols[i3 + 1] = c.g * b;
        cols[i3 + 2] = c.b * b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));

      return new THREE.Points(geo, new THREE.PointsMaterial({
        size: QUALITY_NAME === "eco" ? 0.82 : 1.05,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        depthWrite: false,
      }));
    }

    function makeVolumetricCloud(N, hex1, hex2, cx, cy, cz, spread) {
      const pos = new Float32Array(N * 3);
      const cols = new Float32Array(N * 3);
      const c1 = new THREE.Color(hex1);
      const c2 = new THREE.Color(hex2);
      const mixed = new THREE.Color();

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.pow(Math.random(), 0.55) * spread;
        pos[i3] = cx + Math.sin(phi) * Math.cos(theta) * r;
        pos[i3 + 1] = cy + Math.sin(phi) * Math.sin(theta) * r * 0.55;
        pos[i3 + 2] = cz + Math.cos(phi) * r;
        mixed.copy(c1).lerp(c2, Math.random());
        const b = 0.28 + Math.random() * 0.68;
        cols[i3] = mixed.r * b;
        cols[i3 + 1] = mixed.g * b;
        cols[i3 + 2] = mixed.b * b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));

      return new THREE.Points(geo, new THREE.PointsMaterial({
        size: QUALITY_NAME === "eco" ? 1.85 : 2.45,
        sizeAttenuation: true,
        transparent: true,
        opacity: QUALITY_NAME === "eco" ? 0.25 : 0.32,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        depthWrite: false,
      }));
    }

    const FILAMENTS = [
      makeFilament(qCount(500, "filaments"), "#00ffe4", 170, -350, 0.44),
      makeFilament(qCount(390, "filaments"), "#ff4422", 155, -285, 0.38),
      makeFilament(qCount(430, "filaments"), "#bb44ff", 165, -430, 0.36),
      makeFilament(qCount(340, "filaments"), "#ffaa22", 140, -380, 0.40),
    ];

    const CLOUDS = [
      makeVolumetricCloud(qCount(620, "clouds"), "#004888", "#00c8e0", 30, 15, -280, 95),
      makeVolumetricCloud(qCount(520, "clouds"), "#880022", "#ff2244", -80, -30, -220, 75),
      makeVolumetricCloud(qCount(470, "clouds"), "#440088", "#cc44ff", 60, -50, -340, 85),
      makeVolumetricCloud(qCount(390, "clouds"), "#884400", "#ff8822", -20, 45, -300, 70),
    ];

    FILAMENTS.forEach((f) => root.add(f));
    CLOUDS.forEach((c) => root.add(c));

    /* ── Mouse / ponteiro otimizado ────────────────────────────── */

    const MOUSE = { tx: 0, ty: 0, x: 0, y: 0 };

    window.addEventListener("pointermove", (e) => {
      MOUSE.tx = (e.clientX / vW - 0.5) * 2;
      MOUSE.ty = (e.clientY / vH - 0.5) * 2;
    }, { passive: true });

    /* ── Resize otimizado ──────────────────────────────────────── */

    let resizeRAF = 0;
    window.addEventListener("resize", () => {
      if (resizeRAF) cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(() => {
        vW = window.innerWidth;
        vH = window.innerHeight;
        camera.aspect = vW / vH;
        camera.updateProjectionMatrix();
        renderer.setSize(vW, vH);
        if (composer) composer.setSize(vW, vH);
        nebulaMat.uniforms.uResolution.value.set(vW, vH);
      });
    }, { passive: true });

    /* ── Loop principal com FPS cap e pause em aba oculta ──────── */

    const clock = new THREE.Clock();
    let lastFrame = 0;
    const frameInterval = 1000 / QUALITY.fps;
    let pageVisible = true;

    document.addEventListener("visibilitychange", () => {
      pageVisible = !document.hidden;
      if (pageVisible) clock.getDelta();
    });

    function loop(now) {
      requestAnimationFrame(loop);
      if (!pageVisible) return;
      if (now - lastFrame < frameInterval) return;
      lastFrame = now - ((now - lastFrame) % frameInterval);

      const t = clock.getElapsedTime();

      MOUSE.x += (MOUSE.tx - MOUSE.x) * 0.040;
      MOUSE.y += (MOUSE.ty - MOUSE.y) * 0.040;

      nebulaMat.uniforms.uTime.value = t;
      nebulaMat.uniforms.uMouse.value.set(MOUSE.x, -MOUSE.y);

      for (let i = 0; i < starLayers.length; i++) {
        starLayers[i].material.uniforms.uTime.value = t * (0.55 + i * 0.25);
      }

      root.rotation.y = t * 0.014 * QUALITY.motionScale + MOUSE.x * 0.072;
      root.rotation.x = MOUSE.y * 0.036 + Math.sin(t * 0.13) * 0.011 * QUALITY.motionScale;

      for (let i = 0; i < spikeGroups.length; i++) {
        const g = spikeGroups[i];
        g.rotation.z = t * (0.038 + i * 0.007) * QUALITY.motionScale;
        const pulse = 0.88 + Math.sin(t * 1.05 + i * 1.15) * 0.14;
        g.scale.setScalar(pulse);
        for (let k = 2; k < g.children.length; k++) {
          if (g.children[k].material) {
            g.children[k].material.opacity = 0.26 + Math.sin(t * 1.35 + i * 0.8 + k * 0.4) * 0.18;
          }
        }
      }

      camera.position.x += (MOUSE.x * 14 - camera.position.x) * 0.024;
      camera.position.y += (-MOUSE.y * 9 - camera.position.y) * 0.024;
      camera.position.z = 130 + Math.sin(t * 0.17) * 6.4 * QUALITY.motionScale;
      camera.lookAt(MOUSE.x * 20, -MOUSE.y * 11, -115);

      FILAMENTS.forEach((f, i) => {
        f.rotation.y = Math.sin(t * 0.09 + i * 0.72) * 0.050 * QUALITY.motionScale;
        f.rotation.x = Math.cos(t * 0.07 + i * 0.55) * 0.035 * QUALITY.motionScale;
      });

      CLOUDS.forEach((c, i) => {
        c.rotation.y = t * (0.006 + i * 0.002) * QUALITY.motionScale;
        c.rotation.x = Math.sin(t * 0.11 + i) * 0.025 * QUALITY.motionScale;
      });

      if (bloomPass) {
        bloomPass.strength = QUALITY.bloomStrength + Math.sin(t * 0.25) * (QUALITY_NAME === "cinematic" ? 0.12 : 0.06);
        bloomPass.threshold = QUALITY.bloomThreshold + Math.sin(t * 0.38) * (QUALITY_NAME === "cinematic" ? 0.014 : 0.008);
      }

      composer ? composer.render() : renderer.render(scene, camera);
    }

    requestAnimationFrame(loop);
  }

  /* ═══════════════════════════════════════════════════════════════
     2. BOTÃO DE QUALIDADE — criado via JS, sem mexer no HTML
  ═══════════════════════════════════════════════════════════════ */

  function setupQualityToggle() {
    function setStoredQuality(value) {
      try { localStorage.setItem("andromeda-quality", value); } catch (_) {}
    }

    function injectQualityToggleStyle() {
    const styleId = "andromeda-quality-toggle-style";
    if (document.getElementById(styleId)) return;
    const qStyle = document.createElement("style");
    qStyle.id = styleId;
    qStyle.textContent = `

      .andromeda-quality-toggle{position:fixed;right:22px;bottom:22px;z-index:70;display:inline-flex;align-items:center;gap:.46rem;border:1px solid rgba(224,240,255,.16);background:rgba(2,7,14,.46);color:#e0f0ff;-webkit-backdrop-filter:blur(16px) saturate(120%);backdrop-filter:blur(16px) saturate(120%);border-radius:999px;padding:.48rem .70rem;font-family:"Space Mono",monospace;text-transform:uppercase;letter-spacing:.12em;font-size:.62rem;line-height:1;box-shadow:0 8px 28px rgba(0,0,0,.30),inset 0 0 0 1px rgba(255,255,255,.035);cursor:pointer;overflow:visible;isolation:isolate;transform:translateZ(0);transition:transform .22s ease,border-color .22s ease,background .22s ease,box-shadow .22s ease,color .22s ease;will-change:transform}.andromeda-quality-toggle::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,transparent,rgba(224,240,255,.08),transparent);opacity:0;transition:opacity .22s ease;pointer-events:none}.andromeda-quality-toggle:hover{transform:translateY(-2px);border-color:rgba(224,240,255,.28);background:rgba(2,10,20,.60);box-shadow:0 10px 34px rgba(0,0,0,.38),0 0 22px rgba(42,162,246,.12),inset 0 0 0 1px rgba(255,255,255,.045)}.andromeda-quality-toggle:hover::before{opacity:1}.andromeda-quality-toggle .quality-dot{width:.46rem;height:.46rem;flex:0 0 .46rem;border-radius:50%;background:#2aa2f6;box-shadow:0 0 10px rgba(42,162,246,.72),0 0 22px rgba(42,162,246,.18);transition:background .22s ease,box-shadow .22s ease,transform .22s ease}.andromeda-quality-toggle:hover .quality-dot{transform:scale(1.18)}.andromeda-quality-toggle .quality-label{font-weight:700;color:rgba(224,240,255,.90);white-space:nowrap}.andromeda-quality-toggle .quality-hint{position:absolute;right:calc(100% + 8px);top:50%;transform:translate(6px,-50%);opacity:0;pointer-events:none;border:1px solid rgba(224,240,255,.12);background:rgba(2,7,14,.52);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-radius:999px;padding:.38rem .54rem;color:rgba(224,240,255,.66);font-size:.50rem;letter-spacing:.12em;white-space:nowrap;box-shadow:0 8px 26px rgba(0,0,0,.28);transition:opacity .2s ease,transform .2s ease}.andromeda-quality-toggle:hover .quality-hint{opacity:1;transform:translate(0,-50%)}.andromeda-quality-toggle.is-cinema{border-color:rgba(169,96,238,.22)}.andromeda-quality-toggle.is-cinema .quality-dot{background:#a960ee;box-shadow:0 0 12px rgba(169,96,238,.78),0 0 26px rgba(169,96,238,.22)}.andromeda-quality-toggle.is-balanced{border-color:rgba(42,162,246,.22)}.andromeda-quality-toggle.is-balanced .quality-dot{background:#2aa2f6;box-shadow:0 0 12px rgba(42,162,246,.78),0 0 26px rgba(42,162,246,.20)}.andromeda-quality-toggle.is-eco{border-color:rgba(34,238,255,.20);background:rgba(1,12,16,.46)}.andromeda-quality-toggle.is-eco .quality-dot{background:#22eeff;box-shadow:0 0 12px rgba(34,238,255,.72),0 0 24px rgba(34,238,255,.18)}@media (max-width:768px){.andromeda-quality-toggle{right:14px;bottom:14px;padding:.46rem .62rem;font-size:.58rem}.andromeda-quality-toggle .quality-hint{display:none}}
        `;
    document.head.appendChild(qStyle);
  }


    injectQualityToggleStyle();
    const oldBtn = document.getElementById("quality-toggle");
    if (oldBtn) oldBtn.remove();
    const existing = document.getElementById("andromeda-quality-toggle");
    if (existing) existing.remove();
    const btn = document.createElement("button");
    btn.id = "andromeda-quality-toggle";
    btn.type = "button";
    btn.className = `andromeda-quality-toggle ${QUALITY.className || ""} interactable`;
    const nextQuality = QUALITY_PROFILES[QUALITY.nextMode] || QUALITY_PROFILES.eco;
    btn.setAttribute("aria-label", `Modo atual: ${QUALITY.title}. Clique para trocar para ${nextQuality.title}.`);
    btn.setAttribute("title", `${QUALITY.title} — trocar para ${nextQuality.title}`);
    btn.innerHTML = `<span class="quality-dot" aria-hidden="true"></span><span class="quality-label">${QUALITY.label}</span><span class="quality-hint">trocar</span>`;
    btn.addEventListener("click", () => {
      setStoredQuality(QUALITY.nextMode || "eco");
      window.location.reload();
    });
    document.body.appendChild(btn);
  }

  setupQualityToggle();

  /* ═══════════════════════════════════════════════════════════════
     3. CURSOR MAGNÉTICO OTIMIZADO
  ═══════════════════════════════════════════════════════════════ */

  function setupMagneticCursor() {
    const reticle = document.getElementById("reticle");
    const reticleDot = document.getElementById("reticle-dot");
    const isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

    if (!reticle || isTouch) {
      if (reticle) reticle.style.display = "none";
      if (reticleDot) reticleDot.style.display = "none";
      return;
    }

    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let cx = rx;
    let cy = ry;
    let lastX = -9999;
    let lastY = -9999;
    let active = true;

    document.addEventListener("pointermove", (e) => {
      rx = e.clientX;
      ry = e.clientY;
    }, { passive: true });

    document.addEventListener("pointerdown", () => reticle.classList.add("click"), { passive: true });
    document.addEventListener("pointerup", () => reticle.classList.remove("click"), { passive: true });

    document.addEventListener("pointerover", (e) => {
      if (e.target.closest("a, button, input, select, textarea, label, .interactable")) {
        reticle.classList.add("hover");
      }
    }, { passive: true });

    document.addEventListener("pointerout", (e) => {
      if (e.target.closest("a, button, input, select, textarea, label, .interactable")) {
        reticle.classList.remove("hover");
      }
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      active = !document.hidden;
    });

    function cursorLoop() {
      requestAnimationFrame(cursorLoop);
      if (!active) return;

      cx += (rx - cx) * QUALITY.cursorLerp;
      cy += (ry - cy) * QUALITY.cursorLerp;

      if (Math.abs(cx - lastX) > 0.12 || Math.abs(cy - lastY) > 0.12) {
        reticle.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
        if (reticleDot) {
          reticleDot.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
        }
        lastX = cx;
        lastY = cy;
      }
    }

    requestAnimationFrame(cursorLoop);
  }

  setupMagneticCursor();

  /* ═══════════════════════════════════════════════════════════════
     4. REVEAL DA UI — mesmo ritmo do login, com GSAP se existir
  ═══════════════════════════════════════════════════════════════ */

  function setupUIReveal() {
    const els = document.querySelectorAll(
      ".auth-brand, .auth-brand-line, .auth-subtitle, .auth-card, .form-group, .btn-prim, .auth-links"
    );
    els.forEach((el) => {
      el.style.willChange = "transform, opacity, filter";
    });

    if (typeof gsap !== "undefined") {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(".auth-brand",
        { opacity: 0, y: 36, scaleX: 0.88, filter: "blur(16px)", force3D: true },
        { opacity: 1, y: 0, scaleX: 1, filter: "blur(0px)", duration: 1.7, force3D: true },
        0.12
      );

      tl.fromTo(".auth-brand-line",
        { scaleX: 0, opacity: 0, force3D: true },
        { scaleX: 1, opacity: 1, duration: 1.2, transformOrigin: "center center", force3D: true },
        0.75
      );

      tl.fromTo(".auth-subtitle",
        { opacity: 0, letterSpacing: "0.58em" },
        { opacity: 1, letterSpacing: "0.28em", duration: 1.05 },
        0.95
      );

      tl.fromTo(".auth-card",
        { opacity: 0, y: 34, scale: 0.948, filter: "blur(8px)", force3D: true },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.05, ease: "power3.out", force3D: true },
        0.58
      );

      tl.fromTo(".form-group, .btn-prim, .auth-links",
        { opacity: 0, y: 18, force3D: true },
        { opacity: 1, y: 0, duration: 0.60, stagger: 0.08, force3D: true },
        1.40
      );

      gsap.to(".auth-card", {
        y: -7,
        duration: QUALITY_NAME === "eco" ? 6.4 : (QUALITY_NAME === "cinematic" ? 4.2 : 5.1),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2.6,
        force3D: true,
      });

      gsap.to(".btn-prim", {
        boxShadow: QUALITY_NAME === "eco"
          ? "0 0 24px rgba(34,238,255,0.34), 0 12px 28px rgba(0,0,0,0.56)"
          : (QUALITY_NAME === "cinematic"
            ? "0 0 58px rgba(169,96,238,0.46), 0 0 38px rgba(42,162,246,0.36), 0 16px 40px rgba(0,0,0,0.68)"
            : "0 0 42px rgba(42,162,246,0.50), 0 14px 34px rgba(0,0,0,0.62)"),
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 3.2,
      });

      const errEl = document.querySelector(".auth-error");
      if (errEl) {
        gsap.fromTo(errEl,
          { opacity: 0, y: -16, scale: 0.94, force3D: true },
          { opacity: 1, y: 0, scale: 1, duration: 0.58, ease: "back.out(2.2)", delay: 1.85, force3D: true }
        );
      }
    } else {
      requestAnimationFrame(() => {
        const brand = document.querySelector(".auth-brand");
        const subtitle = document.querySelector(".auth-subtitle");
        const card = document.querySelector(".auth-card");
        if (brand) setTimeout(() => brand.classList.add("reveal"), 80);
        if (subtitle) setTimeout(() => subtitle.classList.add("reveal"), 900);
        if (card) setTimeout(() => card.classList.add("reveal"), 420);
      });
    }
  }

  setupUIReveal();

  /* ═══════════════════════════════════════════════════════════════
     5. PASSWORD TOGGLE
  ═══════════════════════════════════════════════════════════════ */

  document.querySelectorAll(".pass-toggle").forEach((btn) => {
    const inp = btn.closest(".pass-wrap")?.querySelector("input");
    if (!inp) return;

    btn.addEventListener("click", () => {
      const vis = inp.type === "password";
      inp.type = vis ? "text" : "password";
      btn.innerHTML = vis
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
    });
  });

  /* ═══════════════════════════════════════════════════════════════
     6. RIPPLE NO BOTÃO
  ═══════════════════════════════════════════════════════════════ */

  document.querySelectorAll(".btn-prim").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const rip = document.createElement("span");

      rip.style.cssText = `
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,.15);
        width:${size}px;
        height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
        transform:scale(0);
        animation:andromeda-ripple .65s ease-out forwards;
        pointer-events:none;
      `;

      this.appendChild(rip);
      setTimeout(() => rip.remove(), 700);
    });
  });

  if (!document.getElementById("andromeda-ripple-style")) {
    const ks = document.createElement("style");
    ks.id = "andromeda-ripple-style";
    ks.textContent = "@keyframes andromeda-ripple{to{transform:scale(2.9);opacity:0;}}";
    document.head.appendChild(ks);
  }

})();
