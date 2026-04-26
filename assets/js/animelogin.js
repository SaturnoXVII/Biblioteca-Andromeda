/* ═══════════════════════════════════════════════════════════════════
   login.js — Andrômeda · Acesso
   Cenário cósmico James Webb · THREE.js r128 + GSAP 3
   Versão otimizada — Eco Mode adaptativo + pulsação estelar na GPU
   Inspirado em: Cosmic Cliffs, Pillars of Creation, JWST Deep Field
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const container = document.getElementById("webgl");
  if (!container || typeof THREE === "undefined") return;

  /* ── Config / Qualidade adaptativa ──────────────────────────────── */
  let   vW     = window.innerWidth;
  let   vH     = window.innerHeight;
  const MOBILE = vW < 768;
  const SAVE_DATA = !!(navigator.connection && navigator.connection.saveData);
  const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const QUALITY_PROFILES = {
    cinematic: {
      label: "Cinema",
      title: "Modo Cinema",
      status: "Bloom alto · 60 FPS · máxima profundidade",
      nextLabel: "Ativar Eco",
      nextMode: "eco",
      className: "is-cinema",
      dpr: MOBILE ? 1.45 : 1.85,
      fps: 60,
      stars: 1.08,
      filaments: 1.10,
      clouds: 1.08,
      galaxies: 1.05,
      bloom: true,
      bloomStrength: MOBILE ? 1.16 : 1.48,
      bloomRadius: MOBILE ? 0.48 : 0.58,
      bloomThreshold: MOBILE ? 0.105 : 0.082,
      antialias: false,
      starSegScale: 1.00,
      nebulaMainOctaves: 5,
      nebulaLightOctaves: 4,
      motionScale: 1.12,
      cursorLerp: 0.36,
      uiFloat: true,
    },
    balanced: {
      label: "Equilíbrio",
      title: "Modo Equilibrado",
      status: "Bloom médio · 45 FPS · fluidez estável",
      nextLabel: "Ativar Cinema",
      nextMode: "cinematic",
      className: "is-balanced",
      dpr: MOBILE ? 1.10 : 1.38,
      fps: 45,
      stars: 0.72,
      filaments: 0.76,
      clouds: 0.76,
      galaxies: 0.82,
      bloom: true,
      bloomStrength: MOBILE ? 0.78 : 0.98,
      bloomRadius: 0.42,
      bloomThreshold: 0.13,
      antialias: false,
      starSegScale: 0.84,
      nebulaMainOctaves: 4,
      nebulaLightOctaves: 3,
      motionScale: 0.92,
      cursorLerp: 0.40,
      uiFloat: true,
    },
    eco: {
      label: "Eco",
      title: "Modo Eco",
      status: "Bloom leve · 30 FPS · beleza otimizada",
      nextLabel: "Ativar Equilibrado",
      nextMode: "balanced",
      className: "is-eco",
      dpr: MOBILE ? 0.92 : 1.00,
      fps: 30,
      stars: 0.46,
      filaments: 0.52,
      clouds: 0.52,
      galaxies: 0.58,
      bloom: true,
      bloomStrength: 0.48,
      bloomRadius: 0.26,
      bloomThreshold: 0.22,
      antialias: false,
      starSegScale: 0.64,
      nebulaMainOctaves: 3,
      nebulaLightOctaves: 2,
      motionScale: 0.68,
      cursorLerp: 0.46,
      uiFloat: true,
    },
  };

  function getStoredQuality() {
    try { return localStorage.getItem("andromeda-quality"); }
    catch (_) { return null; }
  }

  function setStoredQuality(value) {
    try { localStorage.setItem("andromeda-quality", value); }
    catch (_) {}
  }

  function detectQualityName() {
    const saved = getStoredQuality();
    if (saved && QUALITY_PROFILES[saved]) return saved;

    const cpu = navigator.hardwareConcurrency || 8;
    const mem = navigator.deviceMemory || 8;
    const weakDevice = MOBILE || SAVE_DATA || REDUCED_MOTION || cpu <= 4 || mem <= 4;
    const midDevice  = cpu <= 6 || mem <= 6 || window.devicePixelRatio > 1.75;

    if (weakDevice) return "eco";
    if (midDevice)  return "balanced";
    return "cinematic";
  }

  const QUALITY_NAME = detectQualityName();
  const QUALITY      = QUALITY_PROFILES[QUALITY_NAME];

  const DPR = Math.min(window.devicePixelRatio || 1, QUALITY.dpr);

  const qStarCount     = (desktop, mobile) => Math.max(1, Math.floor((MOBILE ? mobile : desktop) * QUALITY.stars));
  const qFilamentCount = (desktop, mobile) => Math.max(1, Math.floor((MOBILE ? mobile : desktop) * QUALITY.filaments));
  const qCloudCount    = (desktop, mobile) => Math.max(1, Math.floor((MOBILE ? mobile : desktop) * QUALITY.clouds));
  const qGalaxyCount   = value => Math.max(8, Math.floor(value * QUALITY.galaxies));
  const qSeg           = value => Math.max(4, Math.floor(value * QUALITY.starSegScale));

  let RAF_ID = 0;
  let IS_VISIBLE = !document.hidden;
  let lastFrameTime = 0;
  const FRAME_INTERVAL = 1000 / QUALITY.fps;

  /* ── Renderer ─────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    antialias             : QUALITY.antialias,
    alpha                 : false,
    depth                 : true,
    stencil               : false,
    preserveDrawingBuffer : false,
    powerPreference       : "high-performance",
  });
  renderer.setPixelRatio(DPR);
  renderer.setSize(vW, vH);
  renderer.setClearColor(0x000306, 1);
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  if ("outputColorSpace" in renderer)
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  else if ("outputEncoding" in renderer)
    renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  /* ── Scene + Camera ───────────────────────────────────────────── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, vW / vH, 0.1, 5000);
  camera.position.set(0, 0, 130);

  const root = new THREE.Group();
  scene.add(root);

  /* ── Post-processing (Bloom) ──────────────────────────────────── */
  let composer = null, bloomPass = null;
  if (
    QUALITY.bloom &&
    typeof THREE.EffectComposer !== "undefined" &&
    typeof THREE.RenderPass     !== "undefined" &&
    typeof THREE.UnrealBloomPass !== "undefined"
  ) {
    composer  = new THREE.EffectComposer(renderer);
    if (composer.setPixelRatio) composer.setPixelRatio(DPR);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(vW, vH),
      QUALITY.bloomStrength,
      QUALITY.bloomRadius,
      QUALITY.bloomThreshold
    );
    composer.addPass(bloomPass);
  }

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  1.  NEBULOSA — SHADER DE FUNDO COMPLETO                     ║
     ║      Domain-warped FBM · paleta JWST NIRCam + MIRI           ║
     ║      Inspiração: Carina Nebula, Tarantula, Cosmic Cliffs      ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  /* Vertex: quad full-screen que ignora câmera */
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

    /* ── Hash e ruído valor suave ──────────────────── */
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)),
               dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i),           f),
            dot(hash2(i+vec2(1,0)), f-vec2(1,0)), u.x),
        mix(dot(hash2(i+vec2(0,1)), f-vec2(0,1)),
            dot(hash2(i+vec2(1,1)), f-vec2(1,1)), u.x),
        u.y
      );
    }

    /* ── FBM otimizado: 5 oitavas no campo principal.
       Mantém a leitura orgânica da nebulosa, com menos custo por pixel. ── */
    float fbm(vec2 p) {
      float v = 0.0, a = 0.52;
      float s = 2.08;
      mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
      for (int i = 0; i < ${QUALITY.nebulaMainOctaves}; i++) {
        v += a * noise(p);
        p  = rot * p * s;
        a *= 0.50;
      }
      return v;
    }

    /* ── FBM leve: 3 oitavas para filamentos secundários. ── */
    float fbmL(vec2 p) {
      float v = 0.0, a = 0.52;
      mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
      for (int i = 0; i < ${QUALITY.nebulaLightOctaves}; i++) {
        v += a * noise(p);
        p  = rot * p * 2.08;
        a *= 0.50;
      }
      return v;
    }

    /* ── Paleta JWST ───────────────────────────────────
       NIRCam: azul = F090W/F150W, verde = F200W, vermelho = F444W
       MIRI:   laranja/âmbar = calor molecular                ── */
    const vec3 C_VOID  = vec3(0.000, 0.006, 0.020);  /* espaço profundo        */
    const vec3 C_OIII  = vec3(0.008, 0.260, 0.640);  /* O-III: ciano-azul      */
    const vec3 C_HBETA = vec3(0.020, 0.095, 0.480);  /* H-beta: azul médio     */
    const vec3 C_HALP  = vec3(0.880, 0.085, 0.145);  /* H-alpha: vermelho vivo */
    const vec3 C_MIRI  = vec3(0.720, 0.295, 0.035);  /* MIRI: âmbar quente     */
    const vec3 C_GOLD  = vec3(0.940, 0.660, 0.110);  /* núcleos ionizados      */
    const vec3 C_TEAL  = vec3(0.015, 0.680, 0.540);  /* OI/Ne: verde-ciano     */
    const vec3 C_PURP  = vec3(0.260, 0.050, 0.580);  /* Ca II: violeta         */
    const vec3 C_ROSE  = vec3(0.760, 0.180, 0.380);  /* borda filamentosa      */

    void main() {
      vec2 uv  = gl_FragCoord.xy / uResolution.xy;
      float ar = uResolution.x / uResolution.y;

      /* coordenadas em espaço centrado com aspect-ratio */
      vec2 p = (uv - 0.5) * vec2(ar, 1.0) * 2.2;
      p += uMouse * 0.045;

      float t = uTime * 0.030;

      /* ── Domain warping 3 níveis (Inigo Quilez) ───
         Cria turbulência orgânica característica de nebulosas.
         Cada nível torce o domínio do anterior.               ── */
      vec2 q = vec2(
        fbm(p + t),
        fbm(p + vec2(5.200, 1.300))
      );
      vec2 r = vec2(
        fbm(p + 4.0*q + vec2(1.700, 9.200) + 0.135*t),
        fbm(p + 4.0*q + vec2(8.300, 2.800) + 0.112*t)
      );
      float f = fbm(p + 4.6 * r);   /* campo principal    */

      /* estrutura fina (filamentos ionizados) */
      vec2 s = vec2(
        fbmL(p * 1.65 + vec2(3.1, t * 0.42)),
        fbmL(p * 1.65 + vec2(6.7, t * 0.35))
      );
      float g = fbmL(p * 1.65 + 3.0 * s);

      /* variação lenta para "respiração" */
      float breath = fbmL(p * 0.55 + vec2(0.0, t * 0.18));

      /* ── Composição de camadas ─────────────────── */
      vec3 col = C_VOID;

      /* Camada 0: halo H-beta (fundo azulado difuso) */
      col = mix(col, C_HBETA, smoothstep(-0.08, 0.45, f) * 0.50);

      /* Camada 1: O-III (ciano vivo, emissão principal) */
      col = mix(col, C_OIII, smoothstep(0.10, 0.60, f) * 0.62);

      /* Camada 2: MIRI poeira quente (âmbar/laranja) */
      col = mix(col, C_MIRI, smoothstep(0.38, 0.74, f) * 0.55);

      /* Camada 3: H-alpha (vermelho brilhante nas cristas) */
      col = mix(col, C_HALP, smoothstep(0.58, 0.88, f) * 0.50);

      /* Camada 4: filamentos O-III/OI finos */
      col += smoothstep(0.46, 0.68, g) * C_TEAL * 0.40;

      /* Camada 5: núcleos ionizados dourados */
      float coreF = smoothstep(0.70, 0.94, f) * smoothstep(0.64, 0.88, g);
      col += coreF * C_GOLD * 0.72;

      /* Camada 6: véu violeta (Ca II, regiões frias) */
      col = mix(col, C_PURP, smoothstep(0.28, 0.52, g) * (1.0 - smoothstep(0.55, 0.80, f)) * 0.30);

      /* Camada 7: rosado nas bordas de ionização */
      float edgeGlow = smoothstep(0.40, 0.62, f) * (1.0 - smoothstep(0.62, 0.78, f));
      col += edgeGlow * C_ROSE * 0.22;

      /* ── Pilares de Criação ────────────────────────
         3 colunas escuras de gás molecular com bordas ionizadas
         (inspirado na imagem JWST NIRCam de 2022)            ── */
      float px1 = abs(uv.x - 0.285) * 6.5;
      float px2 = abs(uv.x - 0.650) * 7.2;
      float px3 = abs(uv.x - 0.500) * 10.0;

      float pn1 = fbmL(vec2(px1 * 0.75, uv.y * 2.8 + t * 0.055));
      float pn2 = fbmL(vec2(px2 * 0.80, uv.y * 2.4 + t * 0.048));
      float pn3 = fbmL(vec2(px3 * 0.90, uv.y * 3.2 + t * 0.065));

      /* máscara: mais denso no centro, some nas bordas */
      float pm1 = (1.0 - smoothstep(0.0, 0.85, px1))
                * smoothstep(0.05, 0.88, uv.y);
      float pm2 = (1.0 - smoothstep(0.0, 0.78, px2))
                * smoothstep(0.12, 0.95, uv.y) * 0.88;
      float pm3 = (1.0 - smoothstep(0.0, 0.65, px3))
                * smoothstep(0.35, 1.00, uv.y) * 0.62;

      /* corpo escuro (gás molecular frio) */
      vec3 pillarBody = C_MIRI * 0.28 + C_VOID * 0.72;
      col = mix(col, pillarBody, pm1 * smoothstep(0.36, 0.62, pn1) * 0.78);
      col = mix(col, pillarBody * 0.90, pm2 * smoothstep(0.40, 0.64, pn2) * 0.65);
      col = mix(col, pillarBody * 0.78, pm3 * smoothstep(0.42, 0.66, pn3) * 0.50);

      /* bordas ionizadas luminosas (ionização UV das estrelas jovens) */
      vec3 ionEdge = mix(C_TEAL * 1.5, C_OIII * 1.7, 0.55);
      float e1 = pm1 * smoothstep(0.32, 0.50, pn1) * (1.0 - smoothstep(0.50, 0.66, pn1));
      float e2 = pm2 * smoothstep(0.35, 0.52, pn2) * (1.0 - smoothstep(0.52, 0.68, pn2));
      col += e1 * ionEdge * 0.48;
      col += e2 * ionEdge * 0.38;

      /* ── Região de formação estelar no topo ──────── */
      float topCluster = smoothstep(0.70, 1.0, uv.y)
                       * smoothstep(-0.15, 0.5, fbm(p*0.8 + vec2(0.0, t*0.12)));
      col += topCluster * (C_GOLD * 0.35 + C_OIII * 0.20);

      /* ── "Cosmic Cliffs": parede de gás no baixo ── */
      float cliff = smoothstep(0.30, 0.02, uv.y)
                  * smoothstep(-0.1, 0.5, fbm(p*1.2 + vec2(t*0.08, 0.0)));
      col = mix(col, C_MIRI * 0.6, cliff * 0.55);
      col += cliff * C_HALP * 0.18;

      /* ── Ajustes finais ──────────────────────────── */
      col = clamp(col, 0.0, 1.0);

      /* subtil gamma lift (JWST tem processamento de cor específico) */
      col = pow(col, vec3(0.87));

      /* brilho central difuso */
      float cGlow = 1.0 - length(p * vec2(0.58, 0.72));
      col += max(0.0, cGlow * 0.55) * vec3(0.004, 0.014, 0.044);

      /* respiração (pulsação lenta da nebulosa) */
      col *= 0.92 + breath * 0.10;

      /* vinheta suave */
      float vign = length((uv - 0.5) * vec2(1.0, 1.25));
      col *= 1.0 - smoothstep(0.35, 1.10, vign) * 0.75;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const nebulaMat = new THREE.ShaderMaterial({
    vertexShader   : VS_QUAD,
    fragmentShader : FS_NEBULA,
    uniforms       : {
      uTime       : { value: 0.0 },
      uResolution : { value: new THREE.Vector2(vW, vH) },
      uMouse      : { value: new THREE.Vector2(0.0, 0.0) },
    },
    depthTest  : false,
    depthWrite : false,
  });

  const nebulaMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), nebulaMat);
  nebulaMesh.frustumCulled = false;
  nebulaMesh.renderOrder   = -100;
  scene.add(nebulaMesh);

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  2.  CAMPO ESTELAR ESPECTRAL                                  ║
     ║      Classes O–M com scintilação realista                     ║
     ║      Distribuição de disco galáctico achatado                 ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  /* Tipos espectrais com cor, probabilidade e faixa de tamanho */
  const SPECTRAL = [
    { hex:"#9bb4ff", prob:0.010, sc:[0.32,1.25] }, /* O  — azul intenso       */
    { hex:"#b0c6ff", prob:0.030, sc:[0.28,1.08] }, /* B  — azul-branco        */
    { hex:"#d8ecff", prob:0.072, sc:[0.24,0.95] }, /* A  — branco azulado     */
    { hex:"#f8f4ff", prob:0.105, sc:[0.22,0.88] }, /* F  — branco puro        */
    { hex:"#fff8e8", prob:0.155, sc:[0.20,0.80] }, /* G  — amarelo-branco     */
    { hex:"#ffd4a0", prob:0.265, sc:[0.18,0.72] }, /* K  — laranja-amarelo    */
    { hex:"#ffb862", prob:0.363, sc:[0.15,0.62] }, /* M  — laranja-avermelhado */
  ];

  function pickStar() {
    let acc = 0, r = Math.random();
    for (const s of SPECTRAL) { acc += s.prob; if (r <= acc) return s; }
    return SPECTRAL[SPECTRAL.length - 1];
  }

  /* ── Shader estelar: a pulsação sai do JavaScript e vai para GPU ── */
  const VS_STAR = /* glsl */`
    precision highp float;

    uniform float uTime;

    attribute mat4  instanceMatrix;
    attribute vec3  aColor;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aPulse;

    varying vec3 vColor;

    void main() {
      float pulse = 0.88 + sin(uTime * aSpeed + aPhase) * aPulse;
      vec3 transformed = position * pulse;

      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      vColor = aColor;
    }
  `;

  const FS_STAR = /* glsl */`
    precision highp float;

    uniform float uOpacity;
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, uOpacity);
    }
  `;

  function buildStarLayer(N, opt) {
    const geom = new THREE.SphereGeometry(1, opt.seg, opt.seg);
    const mat  = new THREE.ShaderMaterial({
      uniforms : {
        uTime    : { value: 0.0 },
        uOpacity : { value: opt.opacity },
      },
      vertexShader   : VS_STAR,
      fragmentShader : FS_STAR,
      transparent    : true,
      depthWrite     : false,
      fog            : false,
      blending       : THREE.AdditiveBlending,
    });

    const mesh = new THREE.InstancedMesh(geom, mat, N);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const dummy = new THREE.Object3D();
    const col   = new THREE.Color();

    const colors = new Float32Array(N * 3);
    const phase  = new Float32Array(N);
    const speed  = new Float32Array(N);
    const pulse  = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const star  = pickStar();
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = opt.rMin + Math.pow(Math.random(), 0.62) * (opt.rMax - opt.rMin);
      const sx    = Math.sin(phi) * Math.cos(theta) * r;
      const sy    = Math.sin(phi) * Math.sin(theta) * r * opt.flat;
      const sz    = Math.cos(phi) * r + opt.z;

      const sc    = star.sc[0] + Math.pow(Math.random(), 1.75)
                    * (star.sc[1] - star.sc[0]);

      dummy.position.set(sx, sy, sz);
      dummy.scale.setScalar(sc * opt.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      col.set(star.hex).multiplyScalar(0.52 + Math.random() * 0.72);
      colors[i*3]     = col.r;
      colors[i*3 + 1] = col.g;
      colors[i*3 + 2] = col.b;

      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = 0.25 + Math.random() * 1.45;
      pulse[i] = 0.075 + Math.random() * 0.13;
    }

    geom.setAttribute("aColor", new THREE.InstancedBufferAttribute(colors, 3));
    geom.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    geom.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(speed, 1));
    geom.setAttribute("aPulse", new THREE.InstancedBufferAttribute(pulse, 1));

    return { mesh, material: mat };
  }

  const LAYERS = [
    buildStarLayer(qStarCount(2400, 1200), {
      opacity:0.88, seg:qSeg(5), scale:0.88,
      rMin:240, rMax:1800, flat:0.36, z:-720,
    }),
    buildStarLayer(qStarCount(1000, 500), {
      opacity:0.94, seg:qSeg(7), scale:1.28,
      rMin: 85, rMax: 740, flat:0.50, z:-240,
    }),
    buildStarLayer(qStarCount(220, 100), {
      opacity:1.00, seg:qSeg(9), scale:2.85,
      rMin: 38, rMax: 360, flat:0.66, z:  42,
    }),
  ];
  LAYERS.forEach(l => root.add(l.mesh));

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  3.  ESPINHOS DE DIFRAÇÃO — Assinatura visual do JWST        ║
     ║      Espelho hexagonal segmentado → 6 pontas principais +    ║
     ║      2 das estruturas de suporte → 8 raios no total          ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function makeSpikeGroup(x, y, z, sc, hex) {
    const baseCol = new THREE.Color(hex);
    const grp     = new THREE.Group();
    grp.position.set(x, y, z);

    /* Núcleo principal (estrela densa) */
    grp.add(new THREE.Mesh(
      new THREE.SphereGeometry(sc * 0.52, 14, 14),
      new THREE.MeshBasicMaterial({
        color       : baseCol,
        transparent : true,
        opacity     : 1.0,
        blending    : THREE.AdditiveBlending,
        depthWrite  : false,
      })
    ));

    /* Halo interno (corona estelar) */
    grp.add(new THREE.Mesh(
      new THREE.SphereGeometry(sc * 2.2, 12, 12),
      new THREE.MeshBasicMaterial({
        color       : baseCol,
        transparent : true,
        opacity     : 0.14,
        blending    : THREE.AdditiveBlending,
        depthWrite  : false,
      })
    ));

    /* 4 eixos = 8 espinhos de difração
       JWST real: ângulos ~0°, 60°, 120°, e mais 2 das hastes
       Aqui: 0°, 45°, 90°, 135° — estéticamente fiel               */
    const AXES = [
      { ang: 0,              len: sc * 30, bright: 0.58 },
      { ang: Math.PI / 4,    len: sc * 22, bright: 0.40 },
      { ang: Math.PI / 2,    len: sc * 30, bright: 0.58 },
      { ang: Math.PI * 3/4,  len: sc * 22, bright: 0.40 },
    ];

    AXES.forEach(ax => {
      const pts = [];
      const N   = 48;
      for (let k = 0; k < N; k++) {
        const t = k / (N - 1) * 2 - 1;        /* –1 → +1 */
        const d = t * ax.len;
        pts.push(new THREE.Vector3(
          Math.cos(ax.ang) * d,
          Math.sin(ax.ang) * d,
          0
        ));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({
        color       : baseCol,
        transparent : true,
        opacity     : ax.bright,
        blending    : THREE.AdditiveBlending,
        depthWrite  : false,
      });
      grp.add(new THREE.Line(g, m));
    });

    return grp;
  }

  const BRIGHT_STARS = [
    { x:  44, y:  28, z:  -82, sc: 1.72, hex: "#cce8ff" }, /* O-type  */
    { x: -64, y: -24, z: -115, sc: 1.35, hex: "#ffdcb0" }, /* K-giant */
    { x:  16, y:  46, z:  -60, sc: 1.08, hex: "#aac4ff" }, /* B-type  */
    { x: -30, y:  40, z:  -96, sc: 1.15, hex: "#fff8e0" }, /* F-type  */
    { x:  74, y: -34, z: -145, sc: 0.92, hex: "#ffcca0" }, /* K-type  */
    { x:  -9, y: -52, z:  -72, sc: 0.80, hex: "#d0f0ff" }, /* A-type  */
    { x: -88, y:  18, z: -200, sc: 0.70, hex: "#b8d8ff" }, /* B-type  */
  ];

  const spikeGroups = BRIGHT_STARS.map(b =>
    makeSpikeGroup(b.x, b.y, b.z, b.sc, b.hex)
  );
  spikeGroups.forEach(g => root.add(g));

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  4.  GALÁXIAS DISTANTES — JWST Deep Field                    ║
     ║      NIRCam: elípticas (âmbar), espirais (azul),             ║
     ║             irregulares (violeta), anel/lenticular (ciano)   ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function makeGalaxyCanvas(type) {
    const C   = document.createElement("canvas");
    C.width   = C.height = 64;
    const ctx = C.getContext("2d");
    const cx  = 32, cy = 32;

    if (type === 0) {
      /* Elíptica — velha, rica em metais, âmbar-dourado */
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
      g.addColorStop(0,   "rgba(255,225,155,0.96)");
      g.addColorStop(0.45,"rgba(215,160, 55,0.42)");
      g.addColorStop(1.0, "rgba(140, 70, 10,0.00)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22, 13, 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (type === 1) {
      /* Espiral — braços azuis, formação estelar ativa */
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
      g.addColorStop(0,   "rgba(255,255,245,0.94)");
      g.addColorStop(0.5, "rgba(180,210,255,0.40)");
      g.addColorStop(1.0, "rgba(100,160,255,0.00)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
      /* braços espirais em duas cores */
      for (let arm = 0; arm < 2; arm++) {
        const alpha = arm === 0 ? 0.42 : 0.30;
        ctx.strokeStyle = `rgba(${140+arm*30},${175+arm*20},255,${alpha})`;
        ctx.lineWidth   = 1.4;
        ctx.beginPath();
        for (let k = 0; k <= 55; k++) {
          const tt = (k / 55) * Math.PI * 2.5;
          const rr = 4.5 + tt * 8.0;
          const xx = cx + rr * Math.cos(tt + arm * Math.PI);
          const yy = cy + rr * Math.sin(tt + arm * Math.PI) * 0.52;
          k === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
    }
    else if (type === 2) {
      /* Irregular / merger — violeta-azul, interação gravitacional */
      const g = ctx.createRadialGradient(cx - 5, cy + 3, 0, cx, cy, 20);
      g.addColorStop(0,   "rgba(200,155,255,0.88)");
      g.addColorStop(0.5, "rgba(110,125,255,0.38)");
      g.addColorStop(1.0, "rgba( 55, 65,210,0.00)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
      /* segundo núcleo (pós-merger) */
      const g2 = ctx.createRadialGradient(cx + 6, cy - 4, 0, cx + 6, cy - 4, 7);
      g2.addColorStop(0,   "rgba(220,200,255,0.60)");
      g2.addColorStop(1.0, "rgba(150,100,255,0.00)");
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(cx + 6, cy - 4, 7, 0, Math.PI * 2); ctx.fill();
    }
    else {
      /* Anel / lenticular — ciano-azul, redshift moderado */
      ctx.strokeStyle = "rgba(155,220,255,0.58)";
      ctx.lineWidth   = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 18, 10, 0.38, 0, Math.PI * 2);
      ctx.stroke();
      /* anel interno mais fino */
      ctx.strokeStyle = "rgba(100,200,255,0.28)";
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 6.5, 0.38, 0, Math.PI * 2);
      ctx.stroke();
      /* núcleo central */
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
      g.addColorStop(0,   "rgba(200,245,255,0.52)");
      g.addColorStop(1.0, "rgba(100,185,255,0.00)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    }

    return new THREE.CanvasTexture(C);
  }

  const GAL_TYPES = 4, GAL_EACH = qGalaxyCount(55);
  const galDummy  = new THREE.Object3D();

  for (let ti = 0; ti < GAL_TYPES; ti++) {
    const tex  = makeGalaxyCanvas(ti);
    const mat  = new THREE.MeshBasicMaterial({
      map         : tex,
      transparent : true,
      opacity     : 0.64,
      blending    : THREE.AdditiveBlending,
      depthWrite  : false,
      side        : THREE.DoubleSide,
    });
    const inst = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1), mat, GAL_EACH
    );
    inst.frustumCulled = false;

    for (let i = 0; i < GAL_EACH; i++) {
      const sz = 2.0 + Math.random() * 9.5;
      galDummy.scale.set(
        sz * (0.52 + Math.random() * 0.92),
        sz * (0.36 + Math.random() * 0.64),
        1.0
      );
      galDummy.rotation.z = Math.random() * Math.PI * 2;
      galDummy.position.set(
        (Math.random() - 0.5) * 720,
        (Math.random() - 0.5) * 360,
        -240 - Math.random() * 1500
      );
      galDummy.updateMatrix();
      inst.setMatrixAt(i, galDummy.matrix);
    }
    root.add(inst);
  }

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  5.  FILAMENTOS DE GÁS IONIZADO                              ║
     ║      Espirais de partículas simulando correntes de plasma     ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function makeFilament(N, hex, spreadR, depth, opacity) {
    const pos  = new Float32Array(N * 3);
    const cols = new Float32Array(N * 3);
    const c    = new THREE.Color(hex);

    const ax = (Math.random() - 0.5) * 320;
    const ay = (Math.random() - 0.5) * 200;

    for (let i = 0; i < N; i++) {
      const tt = (i / N) * Math.PI * (3.8 + Math.random() * 2.8);
      const rr = 8 + tt * spreadR * 0.45;
      pos[i*3]   = ax + Math.cos(tt) * rr + (Math.random() - 0.5) * 24;
      pos[i*3+1] = ay + Math.sin(tt) * rr * 0.48 + (Math.random() - 0.5) * 16;
      pos[i*3+2] = depth + (Math.random() - 0.5) * 70;
      const b    = 0.32 + Math.random() * 0.78;
      cols[i*3]   = c.r * b;
      cols[i*3+1] = c.g * b;
      cols[i*3+2] = c.b * b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,  3));
    geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size            : 0.65 + Math.random() * 0.95,
      sizeAttenuation : true,
      transparent     : true,
      opacity,
      blending        : THREE.AdditiveBlending,
      vertexColors    : true,
      depthWrite      : false,
    }));
  }

  const FILAMENTS = [
    makeFilament(qFilamentCount(550, 360), "#00ffe4", 170, -350, 0.48),
    makeFilament(qFilamentCount(420, 280), "#ff4422", 155, -285, 0.42),
    makeFilament(qFilamentCount(480, 310), "#bb44ff", 165, -430, 0.40),
    makeFilament(qFilamentCount(360, 240), "#ffaa22", 140, -380, 0.44),
    makeFilament(qFilamentCount(320, 210), "#22eeff", 130, -265, 0.36),
    makeFilament(qFilamentCount(280, 190), "#ff5588", 120, -480, 0.35),
  ];
  FILAMENTS.forEach(f => root.add(f));

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  6.  NUVENS DE PARTÍCULAS VOLUMÉTRICAS                       ║
     ║      Simulam as regiões densas de gás nebular                ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  function makeVolumetricCloud(N, hex1, hex2, cx, cy, cz, spread) {
    const pos  = new Float32Array(N * 3);
    const cols = new Float32Array(N * 3);
    const c1   = new THREE.Color(hex1);
    const c2   = new THREE.Color(hex2);
    const mixed = new THREE.Color();

    for (let i = 0; i < N; i++) {
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);
      const r      = Math.pow(Math.random(), 0.55) * spread;
      pos[i*3]     = cx + Math.sin(phi) * Math.cos(theta) * r;
      pos[i*3+1]   = cy + Math.sin(phi) * Math.sin(theta) * r * 0.55;
      pos[i*3+2]   = cz + Math.cos(phi) * r;
      mixed.copy(c1).lerp(c2, Math.random());
      const b      = 0.28 + Math.random() * 0.68;
      cols[i*3]    = mixed.r * b;
      cols[i*3+1]  = mixed.g * b;
      cols[i*3+2]  = mixed.b * b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,  3));
    geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      size            : 1.4 + Math.random() * 1.8,
      sizeAttenuation : true,
      transparent     : true,
      opacity         : 0.32,
      blending        : THREE.AdditiveBlending,
      vertexColors    : true,
      depthWrite      : false,
    }));
  }

  const CLOUDS = [
    makeVolumetricCloud(qCloudCount(700, 420), "#004888", "#00c8e0",   30,  15, -280, 95),
    makeVolumetricCloud(qCloudCount(600, 360), "#880022", "#ff2244",  -80, -30, -220, 75),
    makeVolumetricCloud(qCloudCount(500, 320), "#440088", "#cc44ff",   60, -50, -340, 85),
    makeVolumetricCloud(qCloudCount(450, 280), "#884400", "#ff8822",  -20,  45, -300, 70),
  ];
  CLOUDS.forEach(c => root.add(c));

  /* ── Alternador de qualidade / Eco Mode ───────────────────────── */
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

  function createQualityToggle() {
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

  createQualityToggle();

  /* ── Mouse ────────────────────────────────────────────────────── */
  const MOUSE = { tx:0, ty:0, x:0, y:0 };
  window.addEventListener("mousemove", e => {
    MOUSE.tx = (e.clientX / vW - 0.5) * 2;
    MOUSE.ty = (e.clientY / vH - 0.5) * 2;
  }, { passive: true });

  /* ── Resize ───────────────────────────────────────────────────── */
  let resizeRAF = 0;
  function applyResize() {
    resizeRAF = 0;
    vW = window.innerWidth;
    vH = window.innerHeight;
    camera.aspect = vW / vH;
    camera.updateProjectionMatrix();
    renderer.setSize(vW, vH);
    if (composer) composer.setSize(vW, vH);
    nebulaMat.uniforms.uResolution.value.set(vW, vH);
  }
  window.addEventListener("resize", () => {
    if (!resizeRAF) resizeRAF = requestAnimationFrame(applyResize);
  }, { passive: true });

  /* ╔═══════════════════════════════════════════════════════════════╗
     ║  7.  LOOP PRINCIPAL                                          ║
     ╚═══════════════════════════════════════════════════════════════╝ */

  const clock  = new THREE.Clock();

  function animate(now) {
    if (!IS_VISIBLE) return;
    RAF_ID = requestAnimationFrame(animate);

    if (now - lastFrameTime < FRAME_INTERVAL) return;
    lastFrameTime = now - ((now - lastFrameTime) % FRAME_INTERVAL);

    const t = clock.getElapsedTime();

    /* suavização do mouse */
    MOUSE.x += (MOUSE.tx - MOUSE.x) * 0.030;
    MOUSE.y += (MOUSE.ty - MOUSE.y) * 0.030;

    /* nebulosa + paralaxe suave */
    nebulaMat.uniforms.uTime.value = t;
    nebulaMat.uniforms.uMouse.value.set(MOUSE.x, -MOUSE.y);

    /* scintilação estelar na GPU: sem recalcular instanceMatrix por frame */
    LAYERS[0].material.uniforms.uTime.value = t * 0.52;
    LAYERS[1].material.uniforms.uTime.value = t * 0.82;
    LAYERS[2].material.uniforms.uTime.value = t * 1.08;

    /* deriva galáctica suave */
    root.rotation.y = t * 0.014 * QUALITY.motionScale + MOUSE.x * 0.072;
    root.rotation.x = MOUSE.y   * 0.036 + Math.sin(t * 0.13) * 0.011 * QUALITY.motionScale;

    /* espinhos JWST: pulsação de brilho + rotação lenta */
    for (let i = 0; i < spikeGroups.length; i++) {
      const g = spikeGroups[i];
      g.rotation.z = t * (0.038 + i * 0.007) * QUALITY.motionScale;
      const pulse  = 0.86 + Math.sin(t * 1.05 + i * 1.15) * 0.17;
      g.scale.setScalar(pulse);
      for (let k = 2; k < g.children.length; k++) {
        if (g.children[k].material)
          g.children[k].material.opacity =
            0.28 + Math.sin(t * 1.35 + i * 0.8 + k * 0.4) * 0.22;
      }
    }

    /* câmera flutua suavemente com o mouse */
    camera.position.x += (MOUSE.x * 14 - camera.position.x) * 0.020;
    camera.position.y += (-MOUSE.y * 9  - camera.position.y) * 0.020;
    camera.position.z  = 130 + Math.sin(t * 0.17) * 7 * QUALITY.motionScale;
    camera.lookAt(MOUSE.x * 20, -MOUSE.y * 11, -115);

    /* filamentos e nuvens: deriva orgânica */
    for (let i = 0; i < FILAMENTS.length; i++) {
      const f = FILAMENTS[i];
      f.rotation.y = Math.sin(t * 0.09 + i * 0.72) * 0.050 * QUALITY.motionScale;
      f.rotation.x = Math.cos(t * 0.07 + i * 0.55) * 0.035 * QUALITY.motionScale;
    }
    for (let i = 0; i < CLOUDS.length; i++) {
      const c = CLOUDS[i];
      c.rotation.y = t * (0.006 + i * 0.002) * QUALITY.motionScale;
      c.rotation.x = Math.sin(t * 0.11 + i) * 0.025 * QUALITY.motionScale;
    }

    /* bloom respira ligeiramente */
    if (bloomPass) {
      bloomPass.strength  = QUALITY.bloomStrength * 0.94 + Math.sin(t * 0.25) * 0.08;
      bloomPass.threshold = QUALITY.bloomThreshold + Math.sin(t * 0.38) * 0.012;
    }

    composer ? composer.render() : renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", () => {
    IS_VISIBLE = !document.hidden;
    if (IS_VISIBLE && !RAF_ID) {
      clock.getDelta();
      lastFrameTime = 0;
      RAF_ID = requestAnimationFrame(animate);
    } else if (!IS_VISIBLE && RAF_ID) {
      cancelAnimationFrame(RAF_ID);
      RAF_ID = 0;
    }
  });

  RAF_ID = requestAnimationFrame(animate);

  /* ═══════════════════════════════════════════════════════════════
     GSAP — ANIMAÇÕES DE UI
     Requer GSAP 3.x CDN no HTML antes deste script
  ═══════════════════════════════════════════════════════════════ */

  if (typeof gsap !== "undefined") {

    gsap.set(".auth-brand, .auth-brand-line, .auth-subtitle, .auth-card, .form-group, .btn-prim, .auth-links", {
      willChange: "transform, opacity, filter",
      force3D: true,
    });

    const tl = gsap.timeline({ defaults: { ease: "expo.out", force3D: true } });

    /* 1. Marca principal */
    tl.fromTo(".auth-brand",
      { opacity:0, y:36, scaleX:0.88, filter:"blur(12px)" },
      { opacity:1, y: 0, scaleX:1.00, filter:"blur(0px)", duration:1.7 },
      0.12
    );

    /* 2. Linha decorativa */
    tl.fromTo(".auth-brand-line",
      { scaleX:0, opacity:0 },
      { scaleX:1, opacity:1, duration:1.2, transformOrigin:"center center" },
      0.75
    );

    /* 3. Subtítulo */
    tl.fromTo(".auth-subtitle",
      { opacity:0, letterSpacing:"0.58em" },
      { opacity:1, letterSpacing:"0.28em", duration:1.05 },
      0.95
    );

    /* 4. Card */
    tl.fromTo(".auth-card",
      { opacity:0, y:34, scale:0.948, filter:"blur(6px)" },
      { opacity:1, y: 0, scale:1.000, filter:"blur(0px)",
        duration:1.05, ease:"power3.out" },
      0.58
    );

    /* 5. Campos do formulário em cascata */
    tl.fromTo(
      ".form-group, .btn-prim, .auth-links",
      { opacity:0, y:18 },
      { opacity:1, y: 0, duration:0.60, stagger:0.10 },
      1.40
    );

    /* 6. Flutuação permanente no card */
    if (QUALITY.uiFloat) {
      gsap.to(".auth-card", {
        y       : -7,
        force3D : true,
        duration: QUALITY_NAME === "eco" ? 6.4 : (QUALITY_NAME === "cinematic" ? 4.2 : 5.1),
        repeat  : -1,
        yoyo    : true,
        ease    : "sine.inOut",
        delay   : 2.6,
      });
    }

    /* 7. Pulso de brilho no botão */
    if (QUALITY_NAME !== "eco") {
      gsap.to(".btn-prim", {
        boxShadow : QUALITY_NAME === "eco"
        ? "0 0 24px rgba(34,238,255,0.34), 0 12px 28px rgba(0,0,0,0.56)"
        : (QUALITY_NAME === "cinematic"
          ? "0 0 58px rgba(169,96,238,0.46), 0 0 38px rgba(42,162,246,0.36), 0 16px 40px rgba(0,0,0,0.68)"
          : "0 0 42px rgba(42,162,246,0.50), 0 14px 34px rgba(0,0,0,0.62)"),
        duration  : 2.4,
        repeat    : -1,
        yoyo      : true,
        ease      : "sine.inOut",
        delay     : 3.2,
      });
    }

    /* 8. Mensagem de erro PHP (se existir) */
    const errEl = document.querySelector(".auth-error");
    if (errEl) {
      gsap.fromTo(errEl,
        { opacity:0, y:-16, scale:0.94 },
        { opacity:1, y:  0, scale: 1.00,
          duration:0.58, ease:"back.out(2.2)", delay:1.85 }
      );
    }

  } else {
    /* Fallback CSS sem GSAP */
    requestAnimationFrame(() => {
      const brand    = document.querySelector(".auth-brand");
      const subtitle = document.querySelector(".auth-subtitle");
      const card     = document.querySelector(".auth-card");
      if (brand)    setTimeout(() => brand.classList.add("reveal"),    80);
      if (subtitle) setTimeout(() => subtitle.classList.add("reveal"), 900);
      if (card)     setTimeout(() => card.classList.add("reveal"),     420);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CURSOR MAGNÉTICO — versão otimizada e mais responsiva
     - Usa pointermove em vez de mousemove
     - Um único listener delegado para hover
     - Não trava o restante do JS caso o cursor não exista
     - Atualiza transform só quando há mudança real
     - Mais rápido: menor atraso visual no retículo
  ═══════════════════════════════════════════════════════════════ */

  const reticle    = document.getElementById("reticle");
  const reticleDot = document.getElementById("reticle-dot");

  if (reticle) {
    const isFinePointer = !window.matchMedia || window.matchMedia("(pointer:fine)").matches;

    if (!isFinePointer) {
      /* Em touch/mobile, o cursor customizado só pesa e não agrega. */
      reticle.style.display = "none";
      if (reticleDot) reticleDot.style.display = "none";
    } else {
      reticle.style.willChange = "transform";
      reticle.style.pointerEvents = "none";
      reticle.style.transform = "translate3d(-120px,-120px,0) translate(-50%,-50%)";

      if (reticleDot) {
        reticleDot.style.willChange = "transform";
        reticleDot.style.pointerEvents = "none";
        reticleDot.style.transform = "translate3d(-120px,-120px,0) translate(-50%,-50%)";
      }

      const CURSOR = {
        targetX : window.innerWidth  * 0.5,
        targetY : window.innerHeight * 0.5,
        x       : window.innerWidth  * 0.5,
        y       : window.innerHeight * 0.5,
        lastX   : -9999,
        lastY   : -9999,
        dotLastX: -9999,
        dotLastY: -9999,
        moved   : true,
        hover   : false,
      };

      /* Mais alto = mais responsivo. Antes era 0.11 e dava sensação de atraso. */
      const CURSOR_LERP = QUALITY.cursorLerp || (QUALITY_NAME === "eco" ? 0.42 : 0.34);
      const CURSOR_EPS  = 0.08;
      const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, label, .interactable, [role='button']";

      function setCursorTarget(e) {
        CURSOR.targetX = e.clientX;
        CURSOR.targetY = e.clientY;
        CURSOR.moved = true;
      }

      window.addEventListener("pointermove", setCursorTarget, { passive: true });

      window.addEventListener("pointerdown", () => {
        reticle.classList.add("click");
      }, { passive: true });

      window.addEventListener("pointerup", () => {
        reticle.classList.remove("click");
      }, { passive: true });

      window.addEventListener("pointerleave", () => {
        reticle.classList.remove("hover", "click");
      }, { passive: true });

      /* Delegação: evita adicionar listeners em cada botão/link/input. */
      document.addEventListener("pointerover", e => {
        if (e.target && e.target.closest && e.target.closest(INTERACTIVE_SELECTOR)) {
          if (!CURSOR.hover) {
            CURSOR.hover = true;
            reticle.classList.add("hover");
          }
        }
      }, { passive: true });

      document.addEventListener("pointerout", e => {
        const fromInteractive = e.target && e.target.closest && e.target.closest(INTERACTIVE_SELECTOR);
        const toInteractive = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(INTERACTIVE_SELECTOR);
        if (fromInteractive && !toInteractive) {
          CURSOR.hover = false;
          reticle.classList.remove("hover");
        }
      }, { passive: true });

      function cursorLoop() {
        if (IS_VISIBLE) {
          CURSOR.x += (CURSOR.targetX - CURSOR.x) * CURSOR_LERP;
          CURSOR.y += (CURSOR.targetY - CURSOR.y) * CURSOR_LERP;

          const dx = Math.abs(CURSOR.x - CURSOR.lastX);
          const dy = Math.abs(CURSOR.y - CURSOR.lastY);
          if (dx > CURSOR_EPS || dy > CURSOR_EPS || CURSOR.moved) {
            reticle.style.transform =
              `translate3d(${CURSOR.x}px,${CURSOR.y}px,0) translate(-50%,-50%)`;
            CURSOR.lastX = CURSOR.x;
            CURSOR.lastY = CURSOR.y;
          }

          if (reticleDot) {
            const ddx = Math.abs(CURSOR.targetX - CURSOR.dotLastX);
            const ddy = Math.abs(CURSOR.targetY - CURSOR.dotLastY);
            if (ddx > CURSOR_EPS || ddy > CURSOR_EPS || CURSOR.moved) {
              reticleDot.style.transform =
                `translate3d(${CURSOR.targetX}px,${CURSOR.targetY}px,0) translate(-50%,-50%)`;
              CURSOR.dotLastX = CURSOR.targetX;
              CURSOR.dotLastY = CURSOR.targetY;
            }
          }

          CURSOR.moved = false;
        }

        requestAnimationFrame(cursorLoop);
      }

      requestAnimationFrame(cursorLoop);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     PASSWORD TOGGLE
  ═══════════════════════════════════════════════════════════════ */

  document.querySelectorAll(".pass-toggle").forEach(btn => {
    const inp = btn.closest(".pass-wrap")?.querySelector("input");
    if (!inp) return;
    btn.addEventListener("click", () => {
      const vis  = inp.type === "password";
      inp.type   = vis ? "text" : "password";
      btn.innerHTML = vis
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
    });
  });

  /* ═══════════════════════════════════════════════════════════════
     RIPPLE NO BOTÃO
  ═══════════════════════════════════════════════════════════════ */

  document.querySelectorAll(".btn-prim").forEach(btn => {
    btn.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const rip  = document.createElement("span");
      rip.style.cssText = `
        position:absolute;border-radius:50%;
        background:rgba(255,255,255,.15);
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top :${e.clientY - rect.top  - size / 2}px;
        transform:scale(0);
        animation:andromeda-ripple .65s ease-out forwards;
        pointer-events:none;
      `;
      this.appendChild(rip);
      setTimeout(() => rip.remove(), 700);
    });
  });

  const ks = document.createElement("style");
  ks.textContent = "@keyframes andromeda-ripple{to{transform:scale(2.9);opacity:0;}}";
  document.head.appendChild(ks);

  /* ── Auto-foco no campo de e-mail ─────────────────────────────── */
  setTimeout(() => {
    const em = document.querySelector("input[name='email']");
    if (em) em.focus({ preventScroll: true });
  }, 1000);

})();