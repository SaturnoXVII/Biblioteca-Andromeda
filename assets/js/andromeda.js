/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  INTRO CINEMATOGRÁFICO — v3.1 DIRECTOR'S CUT · IMAX · RELATIVISTIC       ║
 * ║  GALÁXIA ESPIRAL REALISTA + BH ESCALADO · CAMERA ACTS REFACTORED          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

document.addEventListener("DOMContentLoaded", () => {
  // ─── ELEMENTOS DOM ──────────────────────────────────────────────
  const mount = document.getElementById("webgl-container");
  const grainCanvas = document.getElementById("grain-canvas");
  const btnDespertar = document.getElementById("btn-despertar");
  const uiLayer = document.getElementById("ui-layer");
  const introBlock = document.getElementById("intro-block");
  const titleText = document.getElementById("title-text");
  const subtitleText = document.getElementById("subtitle-text");
  const soundtrack =
    document.getElementById("intro-music") || document.querySelector("audio");

  if (
    !mount ||
    !btnDespertar ||
    typeof THREE === "undefined" ||
    typeof gsap === "undefined"
  ) {
    return;
  }

  // ─── BEAT MAP ───────────────────────────────────────────────────
  const BEAT = {
    MUSIC_OFFSET: 18,

    // ── NOVOS ATOS 1 & 2 (do Código 1) ──────────────────────────
    // ATO 1 — APROXIMAÇÃO COLOSSAL: t = 1.0 … 7.5
    // ATO 2 — CONTEMPLAÇÃO:         t = 7.5 … 12.2
    // ─────────────────────────────────────────────────────────────

    TDE_INTERLUDE: 12.2, // ATO 4 começa aqui (inalterado)
    CHAOS_START: 15.0,
    IMAX_OPEN: 15.35,
    TRAVEL_START: 20.6,
    SILENCE_START: 27.4,
    REBIRTH_START: 30.4,
    FINAL_PULL: 41.0,
    END: 49.5,
  };

  // ─── HELPERS ────────────────────────────────────────────────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ─── OVERLAYS ───────────────────────────────────────────────────
  function makeOverlay(id, css) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      zIndex: "130",
      pointerEvents: "none",
      opacity: "0",
    });
    if (css) Object.assign(el.style, css);
    return el;
  }

  const OV = {
    fade: makeOverlay("ov-fade", { background: "#000", zIndex: "130" }),
    flash: makeOverlay("ov-flash", { background: "#fff", zIndex: "131" }),
    hawking: makeOverlay("ov-hawking", {
      background:
        "radial-gradient(ellipse at center,#cceeff 0%,#fff 38%,#000 100%)",
      mixBlendMode: "screen",
      zIndex: "132",
    }),
    godray: makeOverlay("ov-godray", {
      background:
        "conic-gradient(from 180deg at 50% 48%,transparent 0deg,rgba(255,210,120,.09) 7deg,transparent 14deg,rgba(255,200,100,.05) 22deg,transparent 30deg)",
      filter: "blur(22px)",
      zIndex: "128",
    }),
    imax: makeOverlay("ov-imax", {
      background:
        "radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(0,0,0,.78) 100%)",
      zIndex: "129",
    }),
  };

  // ─── LETTERBOX ──────────────────────────────────────────────────
  function makeBar(id, pos) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }
    Object.assign(el.style, {
      position: "fixed",
      left: "0",
      width: "100%",
      height: "0px",
      background: "#000",
      zIndex: "200",
      pointerEvents: "none",
      willChange: "height",
    });
    if (pos === "top") el.style.top = "0";
    else el.style.bottom = "0";
    return el;
  }

  const LB = {
    top: makeBar("lb-top", "top"),
    bot: makeBar("lb-bot", "bot"),
  };

  const LB_H = Math.round(window.innerHeight * 0.1215);

  // ─── GRAIN OTIMIZADO ────────────────────────────────────────────
  function initGrain(canvas) {
    if (!canvas) return { resize() {} };
    const ctx = canvas.getContext("2d", { alpha: true });
    const noiseSize = 256;
    const off = document.createElement("canvas");
    off.width = noiseSize;
    off.height = noiseSize;
    const oCtx = off.getContext("2d", { alpha: true });
    const img = oCtx.createImageData(noiseSize, noiseSize);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() * 255) | 0;
      d[i] = n;
      d[i + 1] = n;
      d[i + 2] = n;
      d[i + 3] = 13;
    }
    oCtx.putImageData(img, 0, 0);
    const pattern = ctx.createPattern(off, "repeat");
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: "0.045",
        zIndex: "6",
      });
    }
    (function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = pattern;
      const dx = Math.random() * noiseSize;
      const dy = Math.random() * noiseSize;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.fillRect(
        -dx,
        -dy,
        canvas.width + noiseSize,
        canvas.height + noiseSize,
      );
      ctx.restore();
      requestAnimationFrame(tick);
    })();
    resize();
    return { resize };
  }

  const grain = initGrain(grainCanvas);

  function startSoundtrack() {
    if (!soundtrack) return;
    try {
      soundtrack.currentTime = BEAT.MUSIC_OFFSET;
      const p = soundtrack.play();
      if (p?.catch) p.catch(() => {});
    } catch (_) {}
  }

  // ─── VIEWPORT ───────────────────────────────────────────────────
  const VIEW = { w: window.innerWidth, h: window.innerHeight };

  // ─── ESTADO DA CÂMERA ───────────────────────────────────────────
  const camRoll = { z: 0 };
  const shakeCtrl = { lf: 0, mf: 0, hf: 0 };
  const breathCtrl = { amp: 0 };

  const ST = {
    started: false,
    tunneling: false,
    finale: false,
    hostAlive: true,
    bhAlive: true,
  };

  const lookTarget = new THREE.Vector3(0, 0, 0);
  const bhProj = new THREE.Vector3();
  const origin = new THREE.Vector3(0, 0, 0);

  // ─── ESCALA FÍSICA-COMPRIMIDA · GALÁXIA + BURACO NEGRO ─────────
  // A escala astronômica real faria o horizonte de eventos ficar subpixel.
  // Aqui usamos hierarquia correta com compressão cinematográfica:
  // galáxia enorme, bulbo dominante de longe, buraco negro só legível no centro.
  const GALAXY_SCALE = {
    RADIUS: 260,
    BULGE_RADIUS: 25,
    DISK_SCALE: 78,
    THICKNESS: 2.4,
    WARP: 13.5,
    ARMS: 4,
    PITCH_DEG: 13.2,
    PARTICLES: Math.min(window.devicePixelRatio || 1, 1.4) > 1.2 ? 210000 : 170000,
    DUST_PARTICLES: 52000,
    NEBULA_COUNT: 24,
  };

  const BH_SCALE = {
    EH_R: 0.72,
    PHOTON_R: 0.72 * 1.5,
    ISCO_R: 0.72 * 3.0,
    DISK_IN: 0.72 * 1.9,
    DISK_OUT: 17.5,
    REVEAL_START_DIST: 165,
    REVEAL_FULL_DIST: 42,
    LENS_START_DIST: 190,
    LENS_FULL_DIST: 28,
  };

  const EH_R = BH_SCALE.EH_R;
  const PHOTON_R = BH_SCALE.PHOTON_R;
  const ISCO_R = BH_SCALE.ISCO_R;
  const DISK_IN = BH_SCALE.DISK_IN;
  const DISK_OUT = BH_SCALE.DISK_OUT;

  function saturate(v) {
    return Math.max(0, Math.min(1, v));
  }

  function smoothstepJS(edge0, edge1, x) {
    const t = saturate((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }

  function gaussianRandom() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(Math.PI * 2.0 * v);
  }

  function expDiskRadius(scale, maxRadius) {
    let r = 0;
    do {
      r = -Math.log(1 - Math.random()) * scale;
    } while (r > maxRadius);
    return r;
  }

  function weightedPick(list) {
    let total = 0;
    for (const item of list) total += item.w;

    let r = Math.random() * total;
    for (const item of list) {
      r -= item.w;
      if (r <= 0) return item;
    }

    return list[list.length - 1];
  }

  const STAR_CLASSES = {
    hotArms: [
      { type: "O", temp: 1.0, color: 0x91b8ff, size: 2.4, w: 0.05 },
      { type: "B", temp: 0.88, color: 0xb8ccff, size: 1.9, w: 0.14 },
      { type: "A", temp: 0.72, color: 0xe1e8ff, size: 1.45, w: 0.22 },
      { type: "F", temp: 0.55, color: 0xffffee, size: 1.12, w: 0.20 },
      { type: "G", temp: 0.42, color: 0xfff2c4, size: 1.0, w: 0.18 },
      { type: "K", temp: 0.26, color: 0xffc184, size: 0.95, w: 0.13 },
      { type: "M", temp: 0.1, color: 0xff8b62, size: 0.8, w: 0.08 },
    ],
    oldBulge: [
      { type: "G", temp: 0.42, color: 0xffe6a8, size: 1.0, w: 0.20 },
      { type: "K", temp: 0.26, color: 0xffb46b, size: 1.06, w: 0.42 },
      { type: "M", temp: 0.1, color: 0xff7658, size: 1.2, w: 0.30 },
      { type: "A", temp: 0.72, color: 0xf3f5ff, size: 1.2, w: 0.08 },
    ],
    fieldDisk: [
      { type: "A", temp: 0.72, color: 0xdde7ff, size: 1.18, w: 0.09 },
      { type: "F", temp: 0.55, color: 0xffffee, size: 1.0, w: 0.18 },
      { type: "G", temp: 0.42, color: 0xfff0bd, size: 0.94, w: 0.25 },
      { type: "K", temp: 0.26, color: 0xffbf82, size: 0.93, w: 0.28 },
      { type: "M", temp: 0.1, color: 0xff8363, size: 0.82, w: 0.20 },
    ],
  };

  // ═══════════════════════════════════════════════════════════════
  // SCENE / CAMERA / RENDERER
  // ═══════════════════════════════════════════════════════════════
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00010a, 0.00046);

  const camera = new THREE.PerspectiveCamera(32, VIEW.w / VIEW.h, 0.05, 22000);
  camera.position.set(198, 26, 372);
  camera.lookAt(origin);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
    alpha: true,
  });
  renderer.setSize(VIEW.w, VIEW.h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  mount.appendChild(renderer.domElement);

  // ═══════════════════════════════════════════════════════════════
  // SHADERS DE POST-PROCESS
  // ═══════════════════════════════════════════════════════════════
  const VERT_UV = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(VIEW.w, VIEW.h),
    0.75,
    0.45,
    0.85,
  );
  bloomPass.threshold = 0.04;

  const lensPass = new THREE.ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uRadius: { value: 0.006 },
      uStrength: { value: 0.0 },
      uActive: { value: 0.0 },
      uAspect: { value: VIEW.w / VIEW.h },
      uTime: { value: 0.0 },
      uSpin: { value: 0.0 },
      uPlunge: { value: 0.0 },
      uRingBoost: { value: 0.0 },
    },
    vertexShader: VERT_UV,
    fragmentShader: `
      precision highp float;

      uniform sampler2D tDiffuse;
      uniform vec2 uCenter;
      uniform float uRadius;
      uniform float uStrength;
      uniform float uActive;
      uniform float uAspect;
      uniform float uTime;
      uniform float uSpin;
      uniform float uPlunge;
      uniform float uRingBoost;

      varying vec2 vUv;

      vec3 sampleRGB(vec2 uv, vec2 off) {
        float r = texture2D(tDiffuse, clamp(uv + off * 1.8, 0.001, 0.999)).r;
        float g = texture2D(tDiffuse, clamp(uv + off * 0.4, 0.001, 0.999)).g;
        float b = texture2D(tDiffuse, clamp(uv - off * 1.4, 0.001, 0.999)).b;
        return vec3(r, g, b);
      }

      void main() {
        if (uActive < 0.001) {
          gl_FragColor = texture2D(tDiffuse, vUv);
          return;
        }

        vec2 d = vUv - uCenter;
        d.x *= uAspect;

        float r = length(d);
        float radius = max(uRadius, 0.0007);

        vec2 dir = normalize(d + 0.000001);
        vec2 screenDir = vec2(dir.x / uAspect, dir.y);
        vec2 tangent = vec2(-screenDir.y, screenDir.x);

        float shadowR = radius * mix(0.78, 1.15, uPlunge);
        float photonR = radius * 2.62;
        float secondaryR = radius * 3.55;

        float nearField = smoothstep(radius * 8.0, radius * 1.2, r);
        float bend = uStrength / (r * r + radius * radius * 0.085);
        bend = clamp(bend, 0.0, r * mix(0.78, 1.08, uPlunge));

        float swirl =
          sin(r * 85.0 - uTime * 1.7) *
          nearField *
          uSpin *
          radius *
          0.32;

        vec2 uv = vUv - screenDir * bend * uActive + tangent * swirl;

        vec2 chroma = screenDir * nearField * mix(0.0012, 0.0065, uPlunge);
        vec3 col = sampleRGB(uv, chroma);

        float ringWidth = max(radius * 0.105, 0.0015);
        float photonRing = exp(-pow((r - photonR) / ringWidth, 2.0) * 3.4);
        float secondaryRing = exp(-pow((r - secondaryR) / (ringWidth * 1.8), 2.0) * 3.0) * 0.34;

        float hotSide = 0.55 + 0.45 * sin(atan(d.y, d.x) + uTime * 0.65);
        vec3 ringColor = mix(vec3(1.0, 0.62, 0.18), vec3(0.55, 0.82, 1.0), hotSide * 0.42);

        col += ringColor * (photonRing + secondaryRing) * uActive * (2.6 + uRingBoost * 4.4);

        float shadow = smoothstep(shadowR * 0.75, shadowR * 1.22, r);
        col *= mix(0.0, 1.0, shadow);

        float plungeGlow = exp(-pow((r - radius * 1.42) / (radius * 0.62), 2.0)) * uPlunge;
        col += vec3(0.72, 0.84, 1.0) * plungeGlow * 0.38;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const anamPass = new THREE.ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uStrength: { value: 0.0 },
      uAspect: { value: VIEW.w / VIEW.h },
    },
    vertexShader: VERT_UV,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 uCenter;
      uniform float uStrength, uAspect; varying vec2 vUv;
      void main() {
        vec4 base = texture2D(tDiffuse, vUv);
        if (uStrength < 0.001) { gl_FragColor = base; return; }
        float dy = (vUv.y - uCenter.y) * uAspect;
        float streak = exp(-dy * dy * 450.0) * exp(-abs(vUv.x - uCenter.x) * 1.2);
        float halo = exp(-abs(dy) * 220.0) * exp(-pow(vUv.x - uCenter.x, 2.0) * 2.5) * 0.5;
        vec3 flare = (vec3(0.40, 0.75, 1.0) * streak + vec3(0.50, 0.80, 1.0) * halo) * (uStrength * 5.5);
        gl_FragColor = vec4(base.rgb + flare, base.a);
      }
    `,
  });

  const warpPass = new THREE.ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uAmount: { value: 0.0 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    },
    vertexShader: VERT_UV,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uAmount; uniform vec2 uCenter;
      varying vec2 vUv;
      void main() {
        vec2 delta = vUv - uCenter;
        float warp = uAmount * pow(length(delta), 1.5) * 0.09;
        vec4 col = vec4(0.0); float tot = 0.0;
        for (int i = 0; i < 26; i++) {
          float t = float(i) / 25.0;
          vec2 uv = clamp(uCenter + delta * (1.0 - warp * t), 0.001, 0.999);
          float w = 1.0 - t * 0.56; col += texture2D(tDiffuse, uv) * w; tot += w;
        }
        gl_FragColor = col / tot;
      }
    `,
  });

  const chromaPass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uStr: { value: 0.0 } },
    vertexShader: VERT_UV,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uStr; varying vec2 vUv;
      void main() {
        vec2 c = vUv - 0.5; float d = length(c);
        vec2 off = c * d * d * uStr * 2.8;
        float r = texture2D(tDiffuse, clamp(vUv - off * 2.5, 0.001, 0.999)).r;
        float g = texture2D(tDiffuse, clamp(vUv - off * 0.5, 0.001, 0.999)).g;
        float b = texture2D(tDiffuse, clamp(vUv + off * 1.8, 0.001, 0.999)).b;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `,
  });

  const barrelPass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uStr: { value: 0.0 } },
    vertexShader: VERT_UV,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uStr; varying vec2 vUv;
      void main() {
        vec2 uv = vUv - 0.5; float r2 = dot(uv, uv);
        uv *= 1.0 + uStr * r2; uv += 0.5;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0,0.0,0.0,1.0); return;
        }
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    `,
  });

  const vigPass = new THREE.ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uInt: { value: 0.6 },
      uAspect: { value: VIEW.w / VIEW.h },
      uOpen: { value: 0.0 },
    },
    vertexShader: VERT_UV,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uInt, uAspect, uOpen; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv); vec2 uv = vUv - 0.5; uv.x *= uAspect;
        float sc = mix(1.30, 1.90, uOpen); float d = length(uv) * sc;
        float v = 1.0 - d * d * mix(uInt, uInt * 0.25, uOpen);
        gl_FragColor = vec4(c.rgb * clamp(v, 0.0, 1.0), c.a);
      }
    `,
  });

  vigPass.renderToScreen = true;

  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(bloomPass);
  composer.addPass(lensPass);
  composer.addPass(anamPass);
  composer.addPass(warpPass);
  composer.addPass(chromaPass);
  composer.addPass(barrelPass);
  composer.addPass(vigPass);

  // ═══════════════════════════════════════════════════════════════
  // ESTRELAS DE FUNDO
  // ═══════════════════════════════════════════════════════════════
  const SPECTRAL = [
    { col: new THREE.Color(0x9bbcff), sz: 1.62, w: 0.01 },
    { col: new THREE.Color(0xb7c8ff), sz: 1.38, w: 0.03 },
    { col: new THREE.Color(0xdde5ff), sz: 1.12, w: 0.08 },
    { col: new THREE.Color(0xf8f7ff), sz: 0.98, w: 0.14 },
    { col: new THREE.Color(0xfff1c9), sz: 0.94, w: 0.18 },
    { col: new THREE.Color(0xffddb2), sz: 1.04, w: 0.24 },
    { col: new THREE.Color(0xffb18a), sz: 1.22, w: 0.32 },
  ];

  function pickSpec() {
    let acc = 0;
    const r = Math.random();
    for (const s of SPECTRAL) {
      acc += s.w;
      if (r <= acc) return s;
    }
    return SPECTRAL[SPECTRAL.length - 1];
  }

  function buildBgStars() {
    const N = 24000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3),
      col = new Float32Array(N * 3),
      sz = new Float32Array(N),
      twk = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = 3400 + Math.random() * 8000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const s = pickSpec();
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.cos(phi) * r * 0.74;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
      col[i * 3] = s.col.r;
      col[i * 3 + 1] = s.col.g;
      col[i * 3 + 2] = s.col.b;
      sz[i] = s.sz * (0.35 + Math.random() * 1.6);
      twk[i] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    geo.setAttribute("aTwk", new THREE.BufferAttribute(twk, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uT: { value: 0 } },
      vertexShader: `
        attribute float aSize; attribute float aTwk; uniform float uT; varying vec3 vC;
        void main() {
          vC = color;
          float tw = 0.85 + 0.15 * sin(uT * 2.6 + aTwk) * sin(uT * 1.2 + aTwk * 2.1);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (16.0 / -mv.z) * aSize * tw;
        }
      `,
      fragmentShader: `
        varying vec3 vC;
        void main() {
          vec2 p = gl_PointCoord - 0.5; float d = dot(p,p)*4.0; float s = exp(-d*5.0);
          gl_FragColor = vec4(vC * s, s * 0.50);
        }
      `,
    });
    return { pts: new THREE.Points(geo, mat), mat };
  }

  const bgStars = buildBgStars();
  scene.add(bgStars.pts);

  // ═══════════════════════════════════════════════════════════════
  // GALÁXIA HOSPEDEIRA
  // ═══════════════════════════════════════════════════════════════
  function buildHostGalaxy() {
    const cfg = GALAXY_SCALE;
    const grp = new THREE.Group();

    grp.rotation.x = -0.16;
    grp.rotation.z = 0.035;
    scene.add(grp);

    const N = cfg.PARTICLES;
    const pitch = THREE.MathUtils.degToRad(cfg.PITCH_DEG);
    const r0 = 4.2;

    const geo = new THREE.BufferGeometry();

    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const size = new Float32Array(N);
    const temp = new Float32Array(N);
    const region = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const roll = Math.random();

      let r;
      let theta;
      let y;
      let starClass;
      let regionType;

      const isBulge = roll < 0.18;
      const isArm = !isBulge && roll < 0.78;

      if (isBulge) {
        regionType = 0;

        const br = Math.pow(Math.random(), 1.92) * cfg.BULGE_RADIUS;
        const a = Math.random() * Math.PI * 2;
        const vertical = gaussianRandom() * cfg.BULGE_RADIUS * 0.24;

        r = br * (0.45 + Math.random() * 0.75);
        theta = a + gaussianRandom() * 0.06;
        y = vertical * Math.exp(-br / cfg.BULGE_RADIUS);

        starClass = weightedPick(STAR_CLASSES.oldBulge);
      } else if (isArm) {
        regionType = 1;

        const armIndex = Math.floor(Math.random() * cfg.ARMS);
        const armPhase = (armIndex / cfg.ARMS) * Math.PI * 2;

        r = 16 + expDiskRadius(cfg.DISK_SCALE, cfg.RADIUS - 10);

        const baseTheta =
          Math.log(Math.max(r, r0) / r0) / Math.tan(pitch) + armPhase;

        const armTightness = THREE.MathUtils.lerp(0.42, 0.95, saturate(r / cfg.RADIUS));
        const angularScatter =
          gaussianRandom() * THREE.MathUtils.lerp(0.12, 0.38, armTightness);

        const subArmRipple =
          Math.sin(r * 0.055 + armIndex * 1.7) * 0.13 +
          Math.sin(r * 0.021 + armIndex * 3.1) * 0.08;

        theta = baseTheta + angularScatter + subArmRipple;

        const scaleHeight =
          cfg.THICKNESS * THREE.MathUtils.lerp(0.42, 1.25, r / cfg.RADIUS);
        const galacticWarp =
          Math.sin(theta * 1.55 + r * 0.018) *
          cfg.WARP *
          Math.pow(saturate(r / cfg.RADIUS), 1.8);

        y = gaussianRandom() * scaleHeight + galacticWarp * 0.18;

        starClass = weightedPick(STAR_CLASSES.hotArms);
      } else {
        regionType = 2;

        r = 10 + expDiskRadius(cfg.DISK_SCALE * 0.85, cfg.RADIUS);
        theta = Math.random() * Math.PI * 2;

        const galacticWarp =
          Math.sin(theta * 1.35 + r * 0.015) *
          cfg.WARP *
          Math.pow(saturate(r / cfg.RADIUS), 1.7);

        y = gaussianRandom() * cfg.THICKNESS * 0.85 + galacticWarp * 0.12;

        starClass = weightedPick(STAR_CLASSES.fieldDisk);
      }

      const clusterNoise =
        Math.pow(Math.random(), 2.5) * (regionType === 1 ? 4.6 : 1.8);
      const clusterAngle = Math.random() * Math.PI * 2;

      const x = Math.cos(theta) * r + Math.cos(clusterAngle) * clusterNoise;
      const z = Math.sin(theta) * r + Math.sin(clusterAngle) * clusterNoise;

      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      const c = new THREE.Color(starClass.color);

      if (regionType === 0) {
        c.lerp(new THREE.Color(0xffb15b), 0.42);
      } else if (regionType === 1 && Math.random() < 0.13) {
        c.lerp(new THREE.Color(Math.random() < 0.5 ? 0x7fb4ff : 0xff6fa3), 0.35);
      }

      const luminosityJitter = 0.78 + Math.random() * 0.42;
      col[i3] = c.r * luminosityJitter;
      col[i3 + 1] = c.g * luminosityJitter;
      col[i3 + 2] = c.b * luminosityJitter;

      seed[i] = Math.random();
      temp[i] = starClass.temp;
      region[i] = regionType;

      const giantChance = regionType === 0 ? 0.018 : 0.008;
      const giantBoost = Math.random() < giantChance ? rnd(2.2, 4.8) : 1.0;

      size[i] =
        starClass.size *
        giantBoost *
        THREE.MathUtils.lerp(0.64, 1.36, Math.random()) *
        (regionType === 0 ? 1.18 : 1.0);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aTemp", new THREE.BufferAttribute(temp, 1));
    geo.setAttribute("aRegion", new THREE.BufferAttribute(region, 1));

    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uSpeed: { value: 1 },
        uTravel: { value: 0 },
        uSuck: { value: 0 },
        uTear: { value: 0 },
        uOpacity: { value: 1 },
        uCoreDimming: { value: 0 },
      },
      vertexShader: `
        uniform float uT;
        uniform float uSpeed;
        uniform float uTravel;
        uniform float uSuck;
        uniform float uTear;

        attribute vec3 aColor;
        attribute float aSeed;
        attribute float aSize;
        attribute float aTemp;
        attribute float aRegion;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vTemp;
        varying float vTravel;
        varying float vRegion;
        varying float vTear;

        void main() {
          vec3 p = position;

          float radius = length(p.xz);
          float angle = atan(p.z, p.x);

          float orbital = 0.34 / (pow(radius * 0.075 + 1.0, 0.82));
          angle += uT * orbital * (0.52 + aSeed * 0.18);

          float suck = smoothstep(0.0, 1.0, uSuck);
          float tear = smoothstep(0.0, 1.0, uTear);

          float collapsedRadius = max(0.18, radius * mix(1.0, 0.018, pow(suck, 1.75)));
          float currentRadius = mix(radius, collapsedRadius, suck);

          angle -= tear * (18.0 / (currentRadius + 2.0)) * (0.4 + aSeed);

          p.x = cos(angle) * currentRadius;
          p.z = sin(angle) * currentRadius;
          p.y *= mix(1.0, 0.035, suck);
          p.y += sin(uT * 17.0 + aSeed * 50.0) * tear * 0.45;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          float pulse =
            0.92 +
            0.08 *
              sin(uT * mix(1.1, 3.8, aTemp) + aSeed * 6.28318) *
              sin(uT * 0.73 + aSeed * 21.0);

          float speedTravel = clamp(uSpeed / 260.0, 0.0, 1.0);
          float travel = max(uTravel, speedTravel);
          float travelStretch = mix(1.0, 3.8, smoothstep(0.0, 1.0, travel));
          float tearBoost = 1.0 + tear * 3.2;

          gl_PointSize =
            clamp((72.0 / -mv.z) * aSize * pulse * travelStretch * tearBoost, 0.25, 46.0);

          vColor = aColor;
          vAlpha = pulse;
          vTemp = aTemp;
          vTravel = travel;
          vRegion = aRegion;
          vTear = tear;
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uOpacity;
        uniform float uCoreDimming;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vTemp;
        varying float vTravel;
        varying float vRegion;
        varying float vTear;

        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float r2 = dot(p, p);

          if (r2 > 1.0) discard;

          float z = sqrt(max(0.0, 1.0 - r2));
          vec3 n = normalize(vec3(p, z));
          vec3 lightDir = normalize(vec3(-0.35, 0.42, 0.82));

          float diffuse = max(dot(n, lightDir), 0.0);
          float rim = pow(1.0 - z, 2.4);
          float core = exp(-r2 * 4.8);
          float glow = exp(-r2 * 1.35);

          float hotBloom = mix(0.85, 1.75, vTemp);
          float sphereShade = 0.36 + diffuse * 0.74 + rim * 0.32;

          vec3 c = vColor * sphereShade * hotBloom;
          c += vColor * glow * 0.28;
          c += vec3(0.65, 0.82, 1.0) * core * vTemp * 0.22;

          if (vTear > 0.0) {
            float doppler = sin(p.x * 9.0 + p.y * 4.0);
            c = mix(c, mix(vec3(1.0, 0.22, 0.08), vec3(0.30, 0.64, 1.0), doppler * 0.5 + 0.5), vTear * 0.65);
          }

          float travelAlpha =
            mix(core + glow * 0.25, exp(-abs(p.y) * 8.0) * exp(-abs(p.x) * 1.8), vTravel);
          float alpha = travelAlpha * vAlpha * uOpacity;

          alpha *= mix(1.0, 0.72, uCoreDimming * step(vRegion, 0.5));

          gl_FragColor = vec4(c * alpha, alpha);
        }
      `,
    });

    const stars = new THREE.Points(geo, starMat);
    grp.add(stars);

    const bulgeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0.72 },
        uRevealBH: { value: 0 },
      },
      vertexShader: `
        varying vec3 vP;
        void main() {
          vP = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uT;
        uniform float uOpacity;
        uniform float uRevealBH;

        varying vec3 vP;

        void main() {
          float r = length(vP) / 25.0;
          float core = exp(-r * r * 2.2);
          float halo = exp(-r * 1.6) * 0.35;
          float pulse = 0.93 + 0.07 * sin(uT * 0.42);

          vec3 gold = vec3(1.0, 0.70, 0.30);
          vec3 ember = vec3(0.65, 0.20, 0.07);
          vec3 blueWhite = vec3(0.55, 0.82, 1.0);

          vec3 c = mix(gold, ember, smoothstep(0.0, 1.15, r));
          c = mix(c, blueWhite, uRevealBH * core * 0.18);

          float a = (core + halo) * pulse * uOpacity * mix(1.0, 0.55, uRevealBH);

          gl_FragColor = vec4(c * a * 1.7, a);
        }
      `,
    });

    const bulge = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.BULGE_RADIUS, 64, 64),
      bulgeMat,
    );
    bulge.scale.set(1.0, 0.56, 1.0);
    grp.add(bulge);

    const dust = buildGalaxyDustLayer(cfg);
    grp.add(dust.points);

    const nebMats = buildArmNebulae(grp, cfg);

    return {
      grp,
      stars,
      starMat,
      bulge,
      bulgeMat,
      dustMat: dust.mat,
      nebMats,
    };
  }

  function buildGalaxyDustLayer(cfg) {
    const N = cfg.DUST_PARTICLES;
    const pitch = THREE.MathUtils.degToRad(cfg.PITCH_DEG);
    const r0 = 4.2;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const size = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;

      const armIndex = Math.floor(Math.random() * cfg.ARMS);
      const armPhase = (armIndex / cfg.ARMS) * Math.PI * 2;

      const r = 20 + expDiskRadius(cfg.DISK_SCALE * 0.95, cfg.RADIUS);
      const theta =
        Math.log(Math.max(r, r0) / r0) / Math.tan(pitch) +
        armPhase +
        gaussianRandom() * 0.28 +
        Math.sin(r * 0.047) * 0.12;

      const laneOffset = gaussianRandom() * 2.9;

      pos[i3] =
        Math.cos(theta) * r + Math.cos(theta + Math.PI * 0.5) * laneOffset;
      pos[i3 + 1] = gaussianRandom() * 1.05;
      pos[i3 + 2] =
        Math.sin(theta) * r + Math.sin(theta + Math.PI * 0.5) * laneOffset;

      seed[i] = Math.random();
      size[i] = rnd(3.2, 9.8) * THREE.MathUtils.lerp(1.1, 0.38, r / cfg.RADIUS);
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0.42 },
        uTravel: { value: 0 },
      },
      vertexShader: `
        uniform float uT;
        uniform float uTravel;

        attribute float aSeed;
        attribute float aSize;

        varying float vSeed;
        varying float vTravel;

        void main() {
          vec3 p = position;

          float r = length(p.xz);
          float a = atan(p.z, p.x);
          a += uT * 0.018 / (r * 0.018 + 1.0);

          p.x = cos(a) * r;
          p.z = sin(a) * r;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          gl_PointSize =
            clamp((96.0 / -mv.z) * aSize * mix(1.0, 2.8, uTravel), 0.3, 58.0);

          vSeed = aSeed;
          vTravel = uTravel;
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uOpacity;
        varying float vSeed;
        varying float vTravel;

        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float d = dot(p, p) * 4.0;

          float cloud = exp(-d * 1.6);
          float grain = 0.75 + 0.25 * sin(vSeed * 80.0 + p.x * 14.0 + p.y * 9.0);

          vec3 dustColor = mix(vec3(0.08, 0.035, 0.018), vec3(0.42, 0.20, 0.08), cloud);
          float a = cloud * grain * uOpacity * mix(1.0, 0.36, vTravel);

          gl_FragColor = vec4(dustColor * a, a * 0.58);
        }
      `,
    });

    return {
      points: new THREE.Points(geo, mat),
      mat,
    };
  }

  function buildArmNebulae(parent, cfg) {
    const mats = [];
    const pitch = THREE.MathUtils.degToRad(cfg.PITCH_DEG);
    const r0 = 4.2;

    for (let n = 0; n < cfg.NEBULA_COUNT; n++) {
      const armIndex = n % cfg.ARMS;
      const armPhase = (armIndex / cfg.ARMS) * Math.PI * 2;

      const r = rnd(34, cfg.RADIUS * 0.78);
      const theta =
        Math.log(Math.max(r, r0) / r0) / Math.tan(pitch) +
        armPhase +
        gaussianRandom() * 0.16;

      const hueColor =
        Math.random() < 0.54
          ? new THREE.Vector3(0.24, 0.55, 1.0)
          : new THREE.Vector3(1.0, 0.30, 0.55);

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: rnd(0.26, 0.62) },
          uColor: { value: hueColor },
          uTravel: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;

          uniform float uT;
          uniform float uOpacity;
          uniform float uTravel;
          uniform vec3 uColor;

          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(
              mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }

          float fbm(vec2 p) {
            float f = 0.0;
            float w = 0.5;

            for (int i = 0; i < 5; i++) {
              f += w * noise(p);
              p *= 2.08;
              w *= 0.5;
            }

            return f;
          }

          void main() {
            vec2 uv = vUv - 0.5;
            float r = length(uv) * 2.0;

            float n1 = fbm(uv * 3.2 + vec2(uT * 0.010, -uT * 0.006));
            float n2 = fbm(uv * 7.4 - vec2(uT * 0.014, uT * 0.008));

            float mask = smoothstep(1.0, 0.06, r) * smoothstep(0.18, 0.82, n1);
            float filaments = exp(-pow(abs(n2 - 0.62), 0.36) * 8.5) * n1;

            vec3 c = mix(uColor, vec3(1.0, 0.86, 0.72), filaments * 0.42);
            float a = (mask * 0.30 + filaments * 0.20) * uOpacity * mix(1.0, 0.55, uTravel);

            gl_FragColor = vec4(c * a * 2.6, a);
          }
        `,
      });

      mats.push(mat);

      const size = rnd(18, 48);
      const neb = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);

      neb.position.set(
        Math.cos(theta) * r,
        gaussianRandom() * 1.8,
        Math.sin(theta) * r,
      );

      neb.rotation.x = -Math.PI * 0.5 + gaussianRandom() * 0.08;
      neb.rotation.z = theta + Math.PI * 0.5 + gaussianRandom() * 0.25;

      parent.add(neb);
    }

    return mats;
  }

  const HOST = buildHostGalaxy();

  // ═══════════════════════════════════════════════════════════════
  // BURACO NEGRO
  // ═══════════════════════════════════════════════════════════════
  function buildBlackHole() {
    const grp = new THREE.Group();
    scene.add(grp);

    grp.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(EH_R, 192, 192),
        new THREE.MeshBasicMaterial({ color: 0x000000 }),
      ),
    );

    const photonMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec2 vUv;
        void main(){
          float a=vUv.x*6.28318;
          float fl=0.7+0.3*sin(a*11.0+uT*4.8)*sin(a*7.0+uT*6.9)*sin(a*3.0+uT*2.2);
          float e=abs(vUv.y-0.5)*2.0; float br=(1.0-pow(e,0.28))*fl;
          float bm=0.5+0.5*sin(a+uT*0.9);
          vec3 c=mix(vec3(1.0,0.72,0.24),vec3(0.85,0.96,1.0),bm*0.62+fl*0.38);
          gl_FragColor=vec4(c*br*uOpacity*5.5,br*uOpacity);
        }
      `,
    });
    const photonRing = new THREE.Mesh(
      new THREE.TorusGeometry(PHOTON_R, 0.055, 64, 720),
      photonMat,
    );
    photonRing.rotation.x = Math.PI / 2.1;
    grp.add(photonRing);

    const haloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec3 vN; void main(){ vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec3 vN;
        void main(){
          float rim=pow(abs(dot(vN,vec3(0,0,1))),0.72);
          vec3 c=mix(vec3(1.0,0.65,0.18),vec3(0.4,0.78,1.0),rim);
          float a=rim*(0.88+0.12*sin(uT*1.7))*uOpacity*0.58;
          gl_FragColor=vec4(c*a,a*0.5);
        }
      `,
    });
    grp.add(
      new THREE.Mesh(new THREE.SphereGeometry(EH_R * 1.42, 72, 72), haloMat),
    );

    const coronaMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec2 vUv;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
          return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.0;w*=0.5;}return f;}
        void main(){
          vec2 uv=vUv-0.5; float r=length(uv)*2.0;
          float s=fbm(vec2(atan(uv.y,uv.x)*2.4,uT*0.072));
          float i=exp(-r*1.85)*2.4*s*s*smoothstep(1.0,0.12,r)*uOpacity;
          vec3 c=mix(vec3(1.0,0.42,0.08),vec3(0.5,0.82,1.0),r*0.42+s*0.28);
          gl_FragColor=vec4(c*i*1.2,i*0.72);
        }
      `,
    });
    const corona = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), coronaMat);
    corona.position.z = -0.08;
    grp.add(corona);

    const diskMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec3 vPos;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
          return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.14;w*=0.5;}return f;}
        vec3 bb(float T){
          vec3 cold=vec3(0.88,0.06,0.01),warm=vec3(1.0,0.44,0.06),white=vec3(1.0,0.96,0.82),blue=vec3(0.54,0.78,1.0);
          if(T<0.25)return mix(cold,warm,T*4.0);
          if(T<0.55)return mix(warm,white,(T-0.25)*3.33);
          return mix(white,blue,(T-0.55)*2.22);
        }
        void main(){
          float rad=length(vPos.xy); float ang=atan(vPos.y,vPos.x);
          float om=1.58/(pow(rad,1.5)+0.008);
          float sw=ang+uT*om*0.92+7.2/(rad+0.08);
          float beta=clamp(0.52*sqrt(${DISK_IN.toFixed(2)}/(rad+0.001)),0.0,0.98);
          float ct=sin(ang-0.68); float dopplerFactor=1.0/max(1.0-beta*ct,0.05);
          float dp=pow(dopplerFactor,4.2);
          vec3 dt=mix(vec3(1.0,0.12,0.01),vec3(0.30,0.70,1.0),(ct*beta+1.0)*0.5);
          vec3 bc=mix(bb(pow(clamp(${DISK_IN.toFixed(2)}/(rad+0.001),0.0,1.0),0.72)),dt,0.55);
          vec2 puv=vec2(rad*0.68,sw*0.48+uT*0.072);
          float gas=fbm(puv)*0.55+fbm(puv*2.6-uT*0.18+4.0)*0.28+fbm(puv*5.2+uT*0.12+8.0)*0.17;
          float dust=smoothstep(0.16,0.74,fbm(puv*3.8-uT*0.08))*smoothstep(0.08,0.58,fbm(puv*1.95+uT*0.06+7.4));
          float inner=smoothstep(${DISK_IN.toFixed(2)},${(DISK_IN + 2.2).toFixed(2)},rad);
          float outer=smoothstep(${DISK_OUT.toFixed(2)},${(DISK_OUT - 2.8).toFixed(2)},rad);
          float grav=1.0/sqrt(max(1.0-2.8/(rad*3.0+0.001),0.04));
          float intensity=clamp(inner*outer*gas*dust*clamp(dp,0.02,12.0)*grav*1.4,0.0,8.0);
          gl_FragColor=vec4(bc*intensity*uOpacity,intensity*uOpacity*0.98);
        }
      `,
    });
    const disk = new THREE.Mesh(
      new THREE.RingGeometry(DISK_IN, DISK_OUT, 1024, 256),
      diskMat,
    );
    disk.rotation.x = Math.PI / 2.08;
    grp.add(disk);

    const iscoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec2 vUv;
        void main(){
          float a=vUv.x*6.28318;
          float d=0.58+0.42*sin(a*8.0+uT*10.2)*sin(a*5.0+uT*7.1)*sin(a*3.0+uT*4.5);
          float f=max(1.0-abs(vUv.y-0.5)*2.4,0.0);
          gl_FragColor=vec4(mix(vec3(1.0,0.55,0.08),vec3(1.0,0.98,0.92),d)*f*d*uOpacity*4.5,f*d*uOpacity);
        }
      `,
    });
    const iscoRing = new THREE.Mesh(
      new THREE.TorusGeometry(ISCO_R * 0.82, 0.52, 28, 720),
      iscoMat,
    );
    iscoRing.rotation.x = Math.PI / 2.08;
    grp.add(iscoRing);

    const hotspotMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `
        uniform float uT;
        void main(){
          float a=uT*1.85;
          vec3 p=vec3(cos(a)*${ISCO_R.toFixed(2)},sin(a*0.18)*0.4,sin(a)*${ISCO_R.toFixed(2)});
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mv; gl_PointSize=(22.0/-mv.z)*300.0;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        void main(){
          vec2 p=gl_PointCoord-0.5; float d=dot(p,p)*4.0;
          float s=exp(-d*12.0)+exp(-d*2.5)*0.35;
          gl_FragColor=vec4(mix(vec3(1.0,0.92,0.48),vec3(1.0,0.58,0.12),d*0.5)*s*uOpacity*4.0,s*uOpacity);
        }
      `,
    });
    const hspot = new THREE.BufferGeometry();
    hspot.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
    );
    grp.add(new THREE.Points(hspot, hotspotMat));

    function buildJet(dir) {
      const N = 4500,
        geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3),
        rj = new Float32Array(N * 2),
        age = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const t = Math.random(),
          r = t * t * t * 2.4,
          ph = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(ph) * r;
        pos[i * 3 + 1] = t * 54 * dir;
        pos[i * 3 + 2] = Math.sin(ph) * r;
        rj[i * 2] = Math.random();
        rj[i * 2 + 1] = Math.random();
        age[i] = t;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aRnd", new THREE.BufferAttribute(rj, 2));
      geo.setAttribute("aAge", new THREE.BufferAttribute(age, 1));
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uDir: { value: dir },
        },
        vertexShader: `
          attribute vec2 aRnd; attribute float aAge; uniform float uT,uDir; varying float vAge;
          void main(){
            vAge=aAge;
            float flow=mod(aAge+uT*(0.62+aRnd.x*0.48)*0.24,1.0);
            float dist=flow*54.0*uDir; float cone=flow*flow*2.8; float helix=uT*1.8+aRnd.x*6.283;
            float kf=1.0+2.0*exp(-pow(mod(flow*5.0,1.0)-0.5,2.0)*22.0)*smoothstep(0.1,1.0,flow);
            vec3 p=vec3(cos(helix)*cone*(0.32+aRnd.x*0.72)*kf,dist,sin(helix)*cone*(0.32+aRnd.x*0.72)*kf);
            vec4 mv=viewMatrix*modelMatrix*vec4(p,1.0);
            gl_Position=projectionMatrix*mv;
            gl_PointSize=(10.0/-mv.z)*(0.2+aRnd.y*1.0)*(1.0-flow*0.48)*kf;
          }
        `,
        fragmentShader: `
          uniform float uOpacity; varying float vAge;
          void main(){
            float d=distance(gl_PointCoord,vec2(0.5))*2.0; float s=exp(-d*d*3.2);
            float t=clamp(vAge*1.5,0.0,1.0);
            vec3 c=t<0.5?mix(vec3(1.0,0.98,0.92),vec3(0.28,0.65,1.0),t*2.0):mix(vec3(0.28,0.65,1.0),vec3(0.04,0.06,0.72),(t-0.5)*2.0);
            gl_FragColor=vec4(c*s*uOpacity*(1.0-vAge*0.42)*2.8,s*uOpacity*(1.0-vAge*0.42));
          }
        `,
      });
      const pts = new THREE.Points(geo, mat);
      grp.add(pts);
      return mat;
    }
    const jetMatA = buildJet(1),
      jetMatB = buildJet(-1);

    const magMats = [];
    const magGrp = new THREE.Group();
    for (let l = 0; l < 16; l++) {
      const N = 60,
        geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3),
        ph = (l / 16) * Math.PI * 2;
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1),
          r = DISK_IN + (DISK_OUT * 0.7 - DISK_IN) * (1 - t * t);
        pos[i * 3] = Math.cos(ph) * r;
        pos[i * 3 + 1] = t * 22 - 11;
        pos[i * 3 + 2] = Math.sin(ph) * r;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const m = new THREE.LineBasicMaterial({
        color: new THREE.Color(0.3, 0.65, 1),
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
      });
      magMats.push(m);
      magGrp.add(new THREE.Line(geo, m));
    }
    grp.add(magGrp);

    return {
      grp,
      photonMat,
      haloMat,
      coronaMat,
      diskMat,
      iscoMat,
      hotspotMat,
      jetMatA,
      jetMatB,
      magMats,
    };
  }

  const BH = buildBlackHole();

  // ═══════════════════════════════════════════════════════════════
  // PLASMA TIDAL
  // ═══════════════════════════════════════════════════════════════
  function buildTidal() {
    const N = 32000,
      geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3),
      col = new Float32Array(N * 3),
      rnd = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const r = DISK_IN + Math.random() * (DISK_OUT * 0.98),
        a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
      pos[i * 3 + 2] = Math.sin(a) * r;
      const c = [
        new THREE.Color(0xffac48),
        new THREE.Color(0xff3f70),
        new THREE.Color(0x8cc6ff),
      ][Math.floor(Math.random() * 3)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      rnd[i * 2] = Math.random();
      rnd[i * 2 + 1] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 2));
    const pMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0 },
        uChaos: { value: 0 },
      },
      vertexShader: `
        attribute vec2 aRnd; uniform float uT,uChaos; varying vec3 vC; varying float vA;
        void main(){
          vC=color; vec3 p=position; float r=length(p.xz); float a=atan(p.z,p.x);
          float ch=smoothstep(0.0,1.0,uChaos);
          a+=uT*(1.2+aRnd.x*2.8)+ch*(5.2+aRnd.y*10.2)/max(r,0.72);
          r=mix(r,max(0.40,r*0.020),pow(ch,1.6));
          p.x=cos(a)*r; p.z=sin(a)*r; p.y*=mix(1.0,0.05,ch);
          p.y+=sin(uT*20.0+aRnd.x*44.0)*0.22*ch;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          gl_PointSize=(34.0/-mv.z)*(0.3+aRnd.x*1.2)*(1.0+ch*3.0);
          vA=0.32+0.68*ch;
        }
      `,
      fragmentShader: `
        uniform float uOpacity; varying vec3 vC; varying float vA;
        void main(){
          float d=dot(gl_PointCoord-0.5,gl_PointCoord-0.5)*4.0; float s=exp(-d*5.2);
          gl_FragColor=vec4(vC*s*uOpacity*2.4,s*vA*uOpacity);
        }
      `,
    });
    BH.grp.add(new THREE.Points(geo, pMat));

    const SN = 12000,
      sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(SN * 3),
      sRnd = new Float32Array(SN * 2);
    for (let i = 0; i < SN; i++) {
      const t = i / SN,
        r =
          DISK_OUT * 0.9 -
          t * (DISK_OUT * 0.9 - DISK_IN) +
          (Math.random() - 0.5) * 3;
      const ang = -t * Math.PI * 4.5 + (Math.random() - 0.5) * 0.8;
      sPos[i * 3] = Math.cos(ang) * r;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      sPos[i * 3 + 2] = Math.sin(ang) * r;
      sRnd[i * 2] = Math.random();
      sRnd[i * 2 + 1] = Math.random();
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute("aRnd", new THREE.BufferAttribute(sRnd, 2));
    const sMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0 },
        uChaos: { value: 0 },
      },
      vertexShader: `
        attribute vec2 aRnd; uniform float uT,uChaos; varying float vG,vT;
        void main(){
          vec3 p=position; float r=length(p.xz); float a=atan(p.z,p.x);
          float ch=smoothstep(0.0,1.0,uChaos);
          a+=uT*(2.2+aRnd.x*2.4)+(8.2+aRnd.y*12.0)*ch/max(r,0.65);
          r=mix(r,max(0.25,r*0.03),pow(ch,1.8));
          p.x=cos(a)*r; p.z=sin(a)*r; p.y*=mix(1.0,0.10,ch);
          vT=clamp(1.0-r/20.0,0.0,1.0); vG=0.45+0.55*ch;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          gl_PointSize=(42.0/-mv.z)*(0.55+aRnd.x*1.2)*mix(1.0,4.2,ch);
        }
      `,
      fragmentShader: `
        uniform float uOpacity; varying float vG,vT;
        void main(){
          vec2 p=gl_PointCoord-0.5; p.x*=0.20;
          float c=exp(-dot(p,p)*5.0*4.2);
          gl_FragColor=vec4(mix(vec3(0.40,0.70,1.0),vec3(1.0,0.40,0.08),vT)*c*uOpacity*3.2*vG,c*uOpacity*vG);
        }
      `,
    });
    BH.grp.add(new THREE.Points(sGeo, sMat));

    const gwMats = [];
    for (let gw = 0; gw < 8; gw++) {
      const m = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uPh: { value: gw / 8 },
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
          uniform float uT,uOpacity,uPh; varying vec2 vUv;
          void main(){
            float r=length(vUv-0.5)*2.0; float ph=mod(uT*0.2+uPh,1.0);
            float ring=exp(-pow((r-(0.1+ph*0.9))/0.035,2.0)*6.0)*(1.0-ph);
            vec3 c=mix(vec3(0.7,0.5,1.0),vec3(0.3,0.6,1.0),ph);
            gl_FragColor=vec4(c*ring*uOpacity*1.2,ring*uOpacity*0.65);
          }
        `,
      });
      const gw3 = new THREE.Mesh(
        new THREE.PlaneGeometry(DISK_OUT * 2.8, DISK_OUT * 2.8),
        m,
      );
      gw3.rotation.x = -Math.PI * 0.5;
      BH.grp.add(gw3);
      gwMats.push(m);
    }
    return { pMat, sMat, gwMats };
  }

  const TIDAL = buildTidal();

  // ═══════════════════════════════════════════════════════════════
  // TÚNEL DE SINGULARIDADE
  // ═══════════════════════════════════════════════════════════════
  function buildTunnel() {
    const N = 52000,
      geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3),
      col = new Float32Array(N * 3),
      rnd = new Float32Array(N);
    const PALETTES = [
      [0x2a, 0xa2, 0xf6],
      [0x74, 0xd2, 0xff],
      [0xa9, 0x60, 0xee],
      [0xff, 0x4f, 0xa3],
      [0xff, 0xd2, 0x66],
      [0xff, 0x8d, 0x28],
      [0x9b, 0xf4, 0xff],
      [0xff, 0xff, 0xff],
    ];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2,
        lane = Math.floor(Math.random() * 8),
        laneOffset = lane * 0.785398,
        spiral = a + laneOffset * 0.18;
      const r =
        6 +
        Math.pow(Math.random(), 0.34) * 330 +
        Math.sin(laneOffset * 3.0) * 8;
      pos[i * 3] = Math.cos(spiral) * r;
      pos[i * 3 + 1] = Math.sin(spiral) * r;
      pos[i * 3 + 2] = -Math.random() * 8600;
      const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      col[i * 3] = p[0] / 255;
      col[i * 3 + 1] = p[1] / 255;
      col[i * 3 + 2] = p[2] / 255;
      rnd[i] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uT: { value: 0 },
        uSpeed: { value: 0 },
        uOpacity: { value: 0 },
        uTwist: { value: 0 },
      },
      vertexShader: `
        attribute float aRnd; uniform float uT,uSpeed,uTwist; varying vec3 vC; varying float vA,vRad,vAngle,vGate,vSpeed;
        void main(){
          vec3 p=position; float speedNorm=clamp(uSpeed/520.0,0.0,1.0);
          float zFlow=mod(abs(p.z)-uSpeed*(1.25+aRnd*0.85),8600.0); p.z=-zFlow;
          float r=length(p.xy); float a=atan(p.y,p.x);
          float helix=uT*mix(0.06,0.22,speedNorm)+uTwist*p.z*0.000055+sin(p.z*0.002+uT*0.8+aRnd*6.28318)*0.18*speedNorm;
          a+=helix;
          float breathing=1.0+sin(p.z*0.006+uT*1.2+aRnd*20.0)*0.045+sin(a*8.0-uT*2.0)*0.035*speedNorm;
          p.x=cos(a)*r*breathing; p.y=sin(a)*r*breathing;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          float gate=smoothstep(220.0,-260.0,p.z);
          float cathedral=0.55+0.45*pow(abs(sin(r*0.055-uT*2.4)),3.0);
          gl_PointSize=(135.0/-mv.z)*(0.72+aRnd*1.8)*mix(0.9,3.2,speedNorm)*cathedral;
          vC=color; vA=gate; vRad=clamp(r/330.0,0.0,1.0); vAngle=a; vGate=cathedral; vSpeed=speedNorm;
        }
      `,
      fragmentShader: `
        uniform float uOpacity; varying vec3 vC; varying float vA,vRad,vAngle,vGate,vSpeed;
        void main(){
          vec2 p=gl_PointCoord-0.5; float ca=cos(vAngle),sa=sin(vAngle);
          mat2 rot=mat2(ca,-sa,sa,ca); vec2 q=rot*p;
          float core=exp(-dot(p,p)*22.0);
          float streak=exp(-abs(q.y)*mix(28.0,10.0,vSpeed))*exp(-abs(q.x)*mix(8.0,2.4,vSpeed));
          float halo=exp(-dot(p,p)*4.5)*0.18;
          float a=(core*0.75+streak*0.9+halo)*vA*uOpacity*vGate;
          vec3 blueShift=vec3(0.45,0.78,1.0),violetShift=vec3(0.72,0.35,1.0),redShift=vec3(1.0,0.26,0.08),goldShift=vec3(1.0,0.72,0.22);
          vec3 edgeColor=mix(violetShift,redShift,smoothstep(0.45,1.0,vRad));
          vec3 centerColor=mix(blueShift,goldShift,pow(1.0-vRad,2.5));
          vec3 c=mix(vC,mix(centerColor,edgeColor,vRad),0.72);
          c+=vec3(0.7,0.9,1.0)*core*0.5;
          gl_FragColor=vec4(c*a*3.6,a);
        }
      `,
    });
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    scene.add(pts);
    return { pts, geo, mat };
  }

  const TUNNEL = buildTunnel();

  // ═══════════════════════════════════════════════════════════════
  // COSMIC SHOW — OBJETOS DA TRAVESSIA
  // ═══════════════════════════════════════════════════════════════
  const cosmicGrp = new THREE.Group();
  cosmicGrp.visible = false;
  scene.add(cosmicGrp);

  const COSMIC_OBJECTS = [];
  function addCosmic(mesh, mats, zPos, type) {
    cosmicGrp.add(mesh);
    COSMIC_OBJECTS.push({
      mesh,
      mats: Array.isArray(mats) ? mats : [mats],
      zPos,
      type,
    });
  }

  function makeNebula(zPos, hue, scale, tilt) {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0 },
        uHue: { value: hue },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uT,uOpacity,uHue; varying vec2 vUv;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.1;w*=0.5;}return f;}
        vec3 hsl(float h,float s,float l){h=mod(h,1.0);vec3 rgb=clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);return l+s*(rgb-0.5)*(1.0-abs(2.0*l-1.0));}
        void main(){
          vec2 uv=vUv-0.5; float n1=fbm(uv*2.8+uT*0.008),n2=fbm(uv*5.6-uT*0.012+n1),n3=fbm(uv*11.0+uT*0.006+n2*0.4);
          float mask=smoothstep(1.0,0.08,length(uv)*2.0)*(0.4+0.6*n1)*(0.3+0.7*n2);
          float fil=exp(-pow(abs(n3-0.7),0.2)*8.0)*n2; float rim=exp(-pow(length(uv)*2.8,1.4));
          vec3 c=mix(hsl(uHue,0.92,0.52),hsl(uHue+0.55,0.88,0.68),n1)*mask;
          c+=hsl(uHue+0.55,0.88,0.68)*fil*1.4; c+=vec3(1.0,0.98,0.92)*rim*0.32;
          float a=(mask*0.42+fil*0.28)*uOpacity;
          gl_FragColor=vec4(c*a*2.5,a);
        }
      `,
    });
    const x = rnd(-72, 72),
      y = rnd(-36, 36);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(scale * 2, scale * 2),
      m,
    );
    mesh.position.set(x, y, zPos);
    mesh.rotation.x = tilt;
    mesh.rotation.z = rnd(-0.4, 0.4);
    addCosmic(mesh, [m], zPos, "nebula");
    return m;
  }

  function makePulsar(zPos) {
    const grp = new THREE.Group();
    grp.position.set(rnd(-56, 56), rnd(-28, 28), zPos);
    const coreMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=(18.0/-mv.z)*440.0;}`,
      fragmentShader: `
        uniform float uT,uOpacity;
        void main(){
          vec2 p=gl_PointCoord-0.5; float d=dot(p,p)*4.0;
          float pulse=0.4+0.6*pow(abs(sin(uT*19.24)),8.0);
          float s=exp(-d*18.0)*pulse+exp(-d*3.5)*0.4*pulse;
          gl_FragColor=vec4(mix(vec3(0.9,0.97,1.0),vec3(0.4,0.7,1.0),d*0.5)*s*uOpacity*6.0,s*uOpacity);
        }
      `,
    });
    const cg = new THREE.BufferGeometry();
    cg.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
    );
    grp.add(new THREE.Points(cg, coreMat));
    const jetMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec2 vUv;
        void main(){
          vec2 uv=vUv-0.5; float pulse=pow(abs(sin(uT*19.24)),6.0);
          float beam=exp(-uv.x*uv.x*180.0)*exp(-abs(uv.y*2.0)*4.0)*pulse;
          gl_FragColor=vec4(mix(vec3(0.5,0.8,1.0),vec3(0.2,0.5,1.0),abs(uv.x)*2.0)*beam*0.72*uOpacity*4.0,beam*0.72*uOpacity);
        }
      `,
    });
    const j1 = new THREE.Mesh(new THREE.PlaneGeometry(200, 3.2), jetMat);
    j1.rotation.y = Math.PI / 2;
    grp.add(j1);
    addCosmic(grp, [coreMat, jetMat], zPos, "pulsar");
    return [coreMat, jetMat];
  }

  function makeQuasar(zPos) {
    const grp = new THREE.Group();
    grp.position.set(rnd(-48, 48), rnd(-24, 24), zPos);
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=(22.0/-mv.z)*560.0;}`,
      fragmentShader: `
        uniform float uT,uOpacity;
        void main(){
          vec2 p=gl_PointCoord-0.5; float d=dot(p,p)*4.0;
          float fl=0.7+0.3*sin(uT*0.42)*sin(uT*0.87+1.3);
          float core=exp(-d*22.0)*fl,halo=exp(-d*4.2)*0.5*fl;
          float jet=exp(-p.y*p.y*160.0)*exp(-abs(p.x)*1.1)*fl*0.8;
          gl_FragColor=vec4((vec3(1.0,0.94,0.78)*(core+halo)+vec3(0.52,0.72,1.0)*jet)*uOpacity*5.0,(core+halo+jet)*uOpacity);
        }
      `,
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
    );
    grp.add(new THREE.Points(g, m));
    addCosmic(grp, [m], zPos, "quasar");
    return m;
  }

  function makeCluster(zPos) {
    const N = 1200,
      geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3),
      col = new Float32Array(N * 3),
      sz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = Math.pow(Math.random(), 0.42) * 44,
        a = Math.random() * Math.PI * 2,
        y = (Math.random() - 0.5) * 30;
      pos[i * 3] = Math.cos(a) * r + rnd(-8, 8);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.35;
      const spec = pickSpec();
      const c = spec.col
        .clone()
        .lerp(new THREE.Color(0xffffff), Math.random() * 0.35);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      sz[i] = spec.sz * (0.8 + Math.random() * 2.4);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `
        attribute float aSize; uniform float uT; varying vec3 vC;
        void main(){
          vC=color; vec3 p=position;
          p.x+=sin(uT*0.25+position.y*0.05)*0.8; p.y+=cos(uT*0.2+position.x*0.05)*0.55;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          gl_PointSize=(26.0/-mv.z)*aSize;
        }
      `,
      fragmentShader: `
        uniform float uOpacity; varying vec3 vC;
        void main(){vec2 p=gl_PointCoord-0.5;float d=dot(p,p)*4.0;float s=exp(-d*7.5);gl_FragColor=vec4(vC*s*uOpacity*2.4,s*uOpacity);}
      `,
    });
    const pts = new THREE.Points(geo, mat);
    pts.position.set(rnd(-60, 60), rnd(-30, 30), zPos);
    addCosmic(pts, [mat], zPos, "cluster");
    return mat;
  }

  function makeGasCloud(zPos, r, g, b, scale) {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0 },
        uCol: { value: new THREE.Vector3(r, g, b) },
      },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity; uniform vec3 uCol; varying vec2 vUv;
        float h(vec2 p){return fract(sin(dot(p,vec2(91.7,271.3)))*43758.5453123);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.05;w*=0.5;}return f;}
        void main(){
          vec2 uv=vUv-0.5; float rad=length(uv)*2.0;
          float smoke=fbm(uv*3.4+vec2(uT*0.012,-uT*0.008));
          float veins=fbm(uv*9.0-smoke*0.9+uT*0.02);
          float mask=smoothstep(1.0,0.04,rad)*smoothstep(0.15,0.95,smoke)*(0.45+0.55*veins);
          float a=mask*uOpacity*0.58; vec3 c=uCol*(0.62+smoke*0.9);
          c+=vec3(0.85,0.95,1.0)*pow(veins,4.0)*0.35;
          gl_FragColor=vec4(c*a*2.2,a);
        }
      `,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(scale * 2, scale * 2),
      mat,
    );
    mesh.position.set(rnd(-70, 70), rnd(-34, 34), zPos);
    mesh.rotation.z = rnd(-0.6, 0.6);
    mesh.rotation.x = rnd(-0.22, 0.22);
    addCosmic(mesh, [mat], zPos, "gas");
    return mat;
  }

  makeNebula(-420, 0.62, 72, -0.18);
  makeNebula(-820, 0.0, 55, 0.22);
  makeNebula(-1340, 0.8, 88, -0.12);
  makeNebula(-2100, 0.45, 65, 0.15);
  makeNebula(-2900, 0.12, 78, -0.2);
  makeNebula(-3800, 0.72, 92, 0.08);
  makeNebula(-4600, 0.35, 62, -0.25);
  makePulsar(-620);
  makePulsar(-1580);
  makePulsar(-2680);
  makePulsar(-4200);
  makeQuasar(-1100);
  makeQuasar(-2480);
  makeQuasar(-5200);
  [-480, -1200, -2300, -3500, -5800].forEach((z) => makeCluster(z));
  makeGasCloud(-700, 1.0, 0.28, 0.55, 52);
  makeGasCloud(-1420, 0.35, 0.62, 1.0, 68);
  makeGasCloud(-2050, 0.8, 0.4, 1.0, 58);
  makeGasCloud(-3100, 1.0, 0.72, 0.28, 72);
  makeGasCloud(-4000, 0.28, 0.82, 0.92, 82);
  makeGasCloud(-5500, 0.9, 0.22, 0.5, 62);

  // ═══════════════════════════════════════════════════════════════
  // GALÁXIAS DE PASSAGEM
  // ═══════════════════════════════════════════════════════════════
  function buildPassGalaxy(cfg) {
    const {
      x,
      y,
      z,
      radius = 20,
      morph = "grandDesign",
      tiltX = 0,
      tiltY = 0,
      cw = 1,
      hero = false,
      roll = 0.14,
    } = cfg;
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.x = tiltX;
    grp.rotation.y = tiltY;
    grp.rotation.z = rnd(-0.09, 0.09);
    const SC = morph === "compact" ? 14000 : hero ? 52000 : 26000,
      ARMS = morph === "barred" ? 2 : morph === "ringed" ? 3 : 4;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(SC * 3),
      col = new Float32Array(SC * 3),
      rndA = new Float32Array(SC * 3),
      sz = new Float32Array(SC);
    for (let i = 0; i < SC; i++) {
      const i3 = i * 3,
        isCore = Math.random() < 0.12,
        isBlue = Math.random() < 0.18;
      let r, a;
      if (isCore) {
        r = Math.pow(Math.random(), 1.55) * radius * 0.18;
        a = Math.random() * Math.PI * 2;
      } else if (morph === "ringed") {
        r =
          radius * 0.45 +
          Math.pow(Math.random(), 0.65) * radius * 0.55 +
          Math.sin(Math.random() * Math.PI * 2) * radius * 0.045;
        a = Math.random() * Math.PI * 2;
      } else if (morph === "disturbed") {
        r = Math.pow(Math.random(), 0.58) * radius;
        a =
          Math.random() * Math.PI * 2 +
          Math.sin(r * 0.18) * 0.8 +
          Math.random() * 0.7;
      } else {
        const arm = Math.floor(Math.random() * ARMS);
        r = Math.pow(Math.random(), 0.62) * radius;
        a =
          (arm / ARMS) * Math.PI * 2 +
          cw * Math.log(r + 2.0) * 1.82 +
          (Math.random() - 0.5) * 0.58;
      }
      if (morph === "barred" && !isCore && Math.random() < 0.22) {
        pos[i3] = (Math.random() - 0.5) * radius * 1.15;
        pos[i3 + 2] = (Math.random() - 0.5) * radius * 0.18;
      } else {
        const scatter = isCore ? radius * 0.035 : radius * 0.045;
        pos[i3] = Math.cos(a) * r + rnd(-scatter, scatter);
        pos[i3 + 2] = Math.sin(a) * r + rnd(-scatter, scatter);
      }
      pos[i3 + 1] =
        (Math.random() - 0.5) *
        (isCore ? radius * 0.18 : radius * 0.035) *
        (hero ? 1.2 : 1.0);
      let c;
      if (isCore) {
        c = new THREE.Color(0xffd28a);
        c.lerp(new THREE.Color(0xffffff), Math.random() * 0.22);
      } else if (isBlue) {
        c = new THREE.Color(0x78b8ff);
        c.lerp(new THREE.Color(0xffffff), Math.random() * 0.22);
      } else {
        c = pickSpec().col.clone();
      }
      if (morph === "disturbed") c.lerp(new THREE.Color(0xff5f95), 0.18);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
      rndA[i3] = Math.random();
      rndA[i3 + 1] = Math.random();
      rndA[i3 + 2] = Math.random();
      sz[i] = (hero ? 1.2 : 0.86) * (0.65 + Math.random() * 1.4);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aRnd", new THREE.BufferAttribute(rndA, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `
        attribute vec3 aRnd; attribute float aSize; uniform float uT; varying vec3 vC;
        void main(){
          vec3 p=position; float r=length(p.xz); float a=atan(p.z,p.x);
          a+=uT*0.12/(r*0.035+1.0)*(0.75+aRnd.x*0.5); p.x=cos(a)*r; p.z=sin(a)*r;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          gl_PointSize=(38.0/-mv.z)*aSize*(0.8+aRnd.y*0.7); vC=color;
        }
      `,
      fragmentShader: `
        uniform float uOpacity; varying vec3 vC;
        void main(){vec2 p=gl_PointCoord-0.5;float d=dot(p,p)*4.0;float s=exp(-d*7.2);gl_FragColor=vec4(vC*s*uOpacity*2.0,s*uOpacity);}
      `,
    });
    grp.add(new THREE.Points(geo, mat));
    const nucMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec3 vP;
        void main(){float r=length(vP)/6.0;float g=exp(-r*r*2.4)*(0.9+0.1*sin(uT*0.8));vec3 c=mix(vec3(1.0,0.88,0.58),vec3(0.8,0.35,0.12),r);gl_FragColor=vec4(c*g*uOpacity*2.1,g*uOpacity);}
      `,
    });
    const nuc = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.13, 32, 32),
      nucMat,
    );
    nuc.scale.y = 0.55;
    grp.add(nuc);
    const cloudMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0 },
        uCol: {
          value:
            morph === "disturbed"
              ? new THREE.Vector3(1.0, 0.38, 0.58)
              : new THREE.Vector3(0.45, 0.68, 1.0),
        },
      },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity; uniform vec3 uCol; varying vec2 vUv;
        float h(vec2 p){return fract(sin(dot(p,vec2(41.7,191.3)))*43758.5453123);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.08;w*=0.5;}return f;}
        void main(){
          vec2 uv=vUv-0.5; float r=length(uv)*2.0; float k=fbm(uv*4.0+uT*0.02);
          float mask=smoothstep(1.0,0.06,r)*k; vec3 c=mix(uCol,vec3(1.0,0.86,0.58),vUv.y*0.5+0.5);
          gl_FragColor=vec4(c*mask*0.45*uOpacity,mask*0.35*uOpacity);
        }
      `,
    });
    grp.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(radius * 2.5, radius * 2.5),
        cloudMat,
      ),
    );
    grp.visible = false;
    grp._mats = [mat, nucMat, cloudMat];
    grp._zAbs = Math.abs(z);
    grp._hero = hero;
    grp._roll = roll;
    grp._focusX = clamp(x * 0.065, -6.5, 6.5);
    grp._focusY = clamp(y * 0.045, -3, 3);
    grp._driftX = x * 0.78;
    grp._driftY = y * 0.82;
    scene.add(grp);
    return grp;
  }

  const PASS_GALAXIES = [
    buildPassGalaxy({
      x: 95,
      y: 28,
      z: -520,
      radius: 32,
      morph: "grandDesign",
      tiltX: Math.PI * 0.12,
      tiltY: 0.42,
      cw: 1,
      roll: 0.14,
    }),
    buildPassGalaxy({
      x: -88,
      y: -24,
      z: -1020,
      radius: 28,
      morph: "barred",
      tiltX: 0.82,
      tiltY: -0.78,
      cw: -1,
      roll: -0.2,
    }),
    buildPassGalaxy({
      x: 18,
      y: 38,
      z: -1550,
      radius: 52,
      morph: "barred",
      tiltX: Math.PI * 0.32,
      tiltY: 0.62,
      cw: 1,
      hero: true,
      roll: 0.28,
    }),
    buildPassGalaxy({
      x: -72,
      y: 22,
      z: -2180,
      radius: 34,
      morph: "disturbed",
      tiltX: Math.PI * 0.2,
      tiltY: 1.08,
      cw: -1,
      roll: -0.18,
    }),
    buildPassGalaxy({
      x: 105,
      y: -20,
      z: -2860,
      radius: 36,
      morph: "ringed",
      tiltX: Math.PI * 0.24,
      tiltY: 0.72,
      cw: 1,
      roll: 0.16,
    }),
    buildPassGalaxy({
      x: -28,
      y: -36,
      z: -3450,
      radius: 22,
      morph: "compact",
      tiltX: 0.94,
      tiltY: -0.28,
      cw: -1,
      roll: -0.14,
    }),
    buildPassGalaxy({
      x: 76,
      y: 30,
      z: -4300,
      radius: 42,
      morph: "grandDesign",
      tiltX: Math.PI * 0.18,
      tiltY: -0.58,
      cw: 1,
      roll: 0.18,
    }),
    buildPassGalaxy({
      x: -96,
      y: -18,
      z: -5350,
      radius: 48,
      morph: "disturbed",
      tiltX: Math.PI * 0.26,
      tiltY: 0.86,
      cw: -1,
      hero: true,
      roll: -0.3,
    }),
  ];

  function schedulePassGalaxies(tl, tStart, tDur, zStart, zEnd) {
    const totalZ = Math.abs(zEnd - zStart);
    PASS_GALAXIES.forEach((g) => {
      const ratio = g._zAbs / totalZ,
        ta = tStart + ratio * tDur,
        hero = g._hero;
      const inD = hero ? 0.88 : 0.54,
        outD = hero ? 1.24 : 0.92,
        lingr = hero ? 0.7 : 0.32;
      tl.add(() => {
        g.visible = true;
      }, ta - 0.92);
      tl.to(
        g.position,
        {
          x: g._driftX,
          y: g._driftY,
          duration: hero ? 2.2 : 1.3,
          ease: "sine.inOut",
        },
        ta - 0.58,
      );
      tl.to(
        g.rotation,
        {
          z: g.rotation.z + g._roll,
          duration: hero ? 2.2 : 1.3,
          ease: "sine.inOut",
        },
        ta - 0.52,
      );
      tl.to(
        lookTarget,
        {
          x: g._focusX * (hero ? 1.3 : 1.0),
          y: g._focusY * (hero ? 1.2 : 1.0),
          duration: hero ? 0.28 : 0.2,
          ease: "power2.out",
        },
        ta - 0.1,
      );
      tl.to(
        lookTarget,
        { x: 0, y: 0, duration: hero ? 0.72 : 0.4, ease: "power2.inOut" },
        ta + lingr,
      );
      if (hero) {
        tl.to(
          camRoll,
          { z: -0.026, duration: 0.24, ease: "power2.out" },
          ta - 0.1,
        );
        tl.to(
          camRoll,
          { z: 0, duration: 0.58, ease: "power2.inOut" },
          ta + 0.22,
        );
      }
      g._mats.forEach((m, mi) => {
        const pk =
          mi === 2
            ? hero
              ? 0.8
              : 0.62
            : mi === 1
              ? hero
                ? 0.94
                : 0.76
              : hero
                ? 1.0
                : 0.86;
        tl.to(
          m.uniforms.uOpacity,
          { value: pk, duration: inD, ease: "power2.out" },
          ta - 0.4,
        );
        tl.to(
          m.uniforms.uOpacity,
          { value: 0, duration: outD, ease: "power2.in" },
          ta + lingr,
        );
      });
      if (hero) {
        tl.to(
          bloomPass,
          { strength: 2.45, radius: 1.08, duration: 0.42, ease: "power2.out" },
          ta - 0.12,
        );
        tl.to(
          bloomPass,
          { strength: 1.5, radius: 0.84, duration: 0.9, ease: "power2.inOut" },
          ta + 0.44,
        );
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // GALÁXIA DE RENASCIMENTO
  // ═══════════════════════════════════════════════════════════════
  function buildRebirthGalaxy() {
    const grp = new THREE.Group();
    grp.visible = false;
    grp.rotation.x = -0.1;
    grp.rotation.z = 0.05;
    scene.add(grp);
    const MAX_R = 210,
      SC = 190000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(SC * 3),
      col = new Float32Array(SC * 3),
      rn4 = new Float32Array(SC * 4),
      sz = new Float32Array(SC);
    for (let i = 0; i < SC; i++) {
      const i3 = i * 3,
        i4 = i * 4,
        pick = Math.random();
      let x = 0,
        y = 0,
        z = 0;
      if (pick < 0.17) {
        const r = Math.pow(Math.random(), 1.32) * 24,
          a = Math.random() * Math.PI * 2;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        y = (Math.random() - 0.5) * 11 * Math.exp(-r / 20);
      } else {
        const arm = Math.floor(Math.random() * 5),
          af = (arm / 5) * Math.PI * 2;
        const r = 8 + Math.pow(Math.random(), 1.92) * MAX_R;
        const swirl =
          af +
          Math.log(r / 4.0) / Math.tan(0.22) +
          (Math.random() - 0.5) * 0.58;
        const scatter = Math.pow(Math.random(), 1.8) * 5.8,
          sa = Math.random() * Math.PI * 2;
        x = Math.cos(swirl) * r + Math.cos(sa) * scatter;
        z = Math.sin(swirl) * r + Math.sin(sa) * scatter;
        const warp =
          Math.sin(swirl * 1.45 + af) * Math.pow(r / MAX_R, 1.35) * 13.0;
        y = (Math.random() - 0.5) * 2.8 * Math.exp(-r / 70) + warp * 0.18;
      }
      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;
      const s = pickSpec();
      let c = s.col.clone();
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 28) c.lerp(new THREE.Color(0xffcc78), 0.55);
      else if (Math.random() < 0.08) c.lerp(new THREE.Color(0x80b7ff), 0.65);
      else if (Math.random() < 0.045) c.lerp(new THREE.Color(0xff6b9a), 0.45);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
      rn4[i4] = Math.random();
      rn4[i4 + 1] = Math.random();
      rn4[i4 + 2] = Math.random();
      rn4[i4 + 3] = dist / MAX_R;
      sz[i] = s.sz * (0.8 + Math.random() * 1.45);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aRnd", new THREE.BufferAttribute(rn4, 4));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uT: { value: 0 },
        uGrow: { value: 0 },
        uOpen: { value: 0 },
        uPulse: { value: 0 },
        uBallet: { value: 0 },
      },
      vertexShader: `
        attribute vec4 aRnd; attribute float aSize; uniform float uT,uGrow,uOpen,uPulse,uBallet;
        varying vec3 vC; varying float vA,vCore;
        void main(){
          vec3 target=position; float r=length(target.xz); float a=atan(target.z,target.x);
          float birth=smoothstep(0.0,1.0,uGrow),open=smoothstep(0.0,1.0,uOpen),ballet=smoothstep(0.0,1.0,uBallet);
          float seedA=aRnd.x*6.28318,seedR=pow(aRnd.y,0.38)*18.0;
          vec3 singularity=vec3(cos(seedA)*seedR*0.06,(aRnd.z-0.5)*5.0,sin(seedA)*seedR*0.06);
          float delay=aRnd.w*0.42,localBirth=smoothstep(delay,1.0,birth);
          vec3 p=mix(singularity,target,localBirth);
          float swirl=(1.0-localBirth)*(8.5+aRnd.x*4.0)+sin(uT*0.22+aRnd.y*20.0)*0.045*ballet;
          float rr=length(p.xz),aa=atan(p.z,p.x)+swirl*(1.0-open)+uT*0.018*ballet;
          p.x=cos(aa)*rr; p.z=sin(aa)*rr;
          p.y+=sin(uT*0.62+aRnd.z*40.0)*0.65*ballet*(1.0-aRnd.w);
          float expansionPulse=sin(uT*1.8+aRnd.x*6.28318)*uPulse*0.55*(1.0-aRnd.w);
          p.xz*=1.0+expansionPulse*0.018;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          float core=1.0-smoothstep(0.0,0.18,aRnd.w);
          gl_PointSize=(46.0/-mv.z)*aSize*mix(0.25,1.35,localBirth)*(1.0+core*0.95+uPulse*0.35);
          vC=color; vA=localBirth; vCore=core;
        }
      `,
      fragmentShader: `
        varying vec3 vC; varying float vA,vCore;
        void main(){
          vec2 p=gl_PointCoord-0.5; float d=dot(p,p)*4.0;
          float core=exp(-d*12.0),halo=exp(-d*3.0)*0.28; float s=core+halo;
          vec3 c=vC; c+=vec3(1.0,0.82,0.46)*vCore*0.65;
          gl_FragColor=vec4(c*s*vA*2.35,s*vA);
        }
      `,
    });
    grp.add(new THREE.Points(geo, starMat));
    const bulgeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec3 vP;
        void main(){float r=length(vP)/26.0;float g=exp(-r*r*2.2)*(0.86+0.14*sin(uT*0.5));vec3 c=mix(vec3(1.0,0.82,0.45),vec3(0.55,0.22,0.08),pow(r,0.65));gl_FragColor=vec4(c*g*uOpacity*1.9,g*uOpacity*0.75);}
      `,
    });
    const bulge = new THREE.Mesh(
      new THREE.SphereGeometry(28, 64, 64),
      bulgeMat,
    );
    bulge.scale.set(1.15, 0.55, 1.15);
    grp.add(bulge);

    const tailMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0 },
        uGrow: { value: 0 },
      },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity,uGrow; varying vec2 vUv;
        float h(vec2 p){return fract(sin(dot(p,vec2(117.1,211.7)))*43758.5453123);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.12;w*=0.5;}return f;}
        void main(){
          vec2 uv=vUv-0.5; uv.x*=1.55; float r=length(uv)*2.0;
          float flow=fbm(vec2(atan(uv.y,uv.x)*2.0+uT*0.035,r*3.0-uT*0.02));
          float arms=exp(-pow(abs(sin(atan(uv.y,uv.x)*5.0+r*6.0-uT*0.2)),0.7)*2.6);
          float mask=smoothstep(1.0,0.1,r)*smoothstep(0.0,1.0,uGrow)*flow*arms;
          vec3 c=mix(vec3(0.26,0.58,1.0),vec3(1.0,0.38,0.72),flow);
          c+=vec3(1.0,0.82,0.45)*exp(-r*3.0)*0.6; float a=mask*uOpacity*0.32;
          gl_FragColor=vec4(c*a*2.4,a);
        }
      `,
    });
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), tailMat);
    tail.rotation.x = -Math.PI * 0.5;
    tail.position.y = -0.4;
    grp.add(tail);

    const shockMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uT: { value: 0 },
        uOpacity: { value: 0 },
        uScale: { value: 0 },
      },
      vertexShader: `uniform float uScale; varying vec2 vUv; void main(){vUv=uv;vec3 p=position*max(0.001,uScale);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec2 vUv;
        void main(){
          vec2 uv=vUv-0.5; float r=length(uv)*2.0;
          float ring=exp(-pow((r-0.62)/0.055,2.0)*4.0)+exp(-pow((r-0.78)/0.035,2.0)*4.0)*0.55;
          vec3 c=mix(vec3(0.45,0.78,1.0),vec3(1.0,0.78,0.35),r);
          gl_FragColor=vec4(c*ring*uOpacity*2.8,ring*uOpacity);
        }
      `,
    });
    const shock = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), shockMat);
    shock.rotation.x = -Math.PI * 0.5;
    grp.add(shock);

    const quantumMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float uT,uOpacity; varying vec2 vUv;
        float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453123);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.0;w*=0.5;}return f;}
        void main(){
          vec2 uv=vUv-0.5; float r=length(uv)*2.0;
          float k=fbm(uv*4.0+uT*0.015)*fbm(uv*12.0-uT*0.02);
          float mask=smoothstep(1.0,0.04,r)*smoothstep(0.22,0.95,k);
          vec3 c=mix(vec3(0.2,0.62,1.0),vec3(1.0,0.38,0.9),vUv.y+k*0.5);
          c+=vec3(1.0,0.92,0.62)*exp(-r*4.0)*0.65;
          gl_FragColor=vec4(c*mask*0.45*uOpacity,mask*0.35*uOpacity);
        }
      `,
    });
    const quantum = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      quantumMat,
    );
    quantum.rotation.x = -Math.PI * 0.5;
    quantum.position.y = -1.2;
    grp.add(quantum);

    const satMats = [];
    for (let s = 0; s < 3; s++) {
      const N = 9000,
        sg = new THREE.BufferGeometry();
      const sp = new Float32Array(N * 3),
        sc = new Float32Array(N * 3),
        sr = new Float32Array(N);
      const ringR = 95 + s * 38;
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2,
          r = ringR + rnd(-8, 8);
        sp[i * 3] = Math.cos(a) * r;
        sp[i * 3 + 1] = rnd(-2.0, 2.0);
        sp[i * 3 + 2] = Math.sin(a) * r;
        const c =
          s === 0
            ? new THREE.Color(0x80b7ff)
            : s === 1
              ? new THREE.Color(0xff8ac8)
              : new THREE.Color(0xffd67a);
        c.lerp(new THREE.Color(0xffffff), Math.random() * 0.25);
        sc[i * 3] = c.r;
        sc[i * 3 + 1] = c.g;
        sc[i * 3 + 2] = c.b;
        sr[i] = Math.random();
      }
      sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      sg.setAttribute("color", new THREE.BufferAttribute(sc, 3));
      sg.setAttribute("aRnd", new THREE.BufferAttribute(sr, 1));
      const sm = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `
          attribute float aRnd; uniform float uT; varying vec3 vC;
          void main(){
            vC=color; vec3 p=position; float r=length(p.xz); float a=atan(p.z,p.x);
            a+=uT*(0.04+aRnd*0.025); p.x=cos(a)*r; p.z=sin(a)*r;
            vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
            gl_PointSize=(28.0/-mv.z)*(0.45+aRnd*1.35);
          }
        `,
        fragmentShader: `
          uniform float uOpacity; varying vec3 vC;
          void main(){vec2 p=gl_PointCoord-0.5;float d=dot(p,p)*4.0;float s=exp(-d*8.0);gl_FragColor=vec4(vC*s*uOpacity*1.8,s*uOpacity);}
        `,
      });
      satMats.push(sm);
      const pts = new THREE.Points(sg, sm);
      pts.rotation.x = -Math.PI * 0.5 + rnd(-0.06, 0.06);
      pts.rotation.z = rnd(-0.08, 0.08);
      grp.add(pts);
    }

    const rayMats = [];
    for (let gr = 0; gr < 12; gr++) {
      const ang = (gr / 12) * Math.PI * 2,
        len = rnd(80, 180);
      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([
            0,
            0,
            0.5,
            Math.cos(ang) * len + (Math.random() - 0.5) * 22,
            Math.sin(ang) * len + (Math.random() - 0.5) * 22,
            0.5,
          ]),
          3,
        ),
      );
      const rm = new THREE.LineBasicMaterial({
        color: new THREE.Color(1, 0.88, 0.58),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      rayMats.push(rm);
      grp.add(new THREE.Line(rGeo, rm));
    }
    return {
      grp,
      starMat,
      bulgeMat,
      tailMat,
      shockMat,
      quantumMat,
      satMats,
      rayMats,
    };
  }

  const REBIRTH = buildRebirthGalaxy();

  // ═══════════════════════════════════════════════════════════════
  // START INTRO — COREOGRAFIA COM ATO 1 & 2 DO CÓDIGO 1
  // ═══════════════════════════════════════════════════════════════
  function startIntro() {
    if (ST.started) return;
    ST.started = true;
    document.body.classList.add("diving-active");
    startSoundtrack();

    let roughEase = "power4.inOut";
    if (typeof RoughEase !== "undefined" && RoughEase.ease?.config) {
      roughEase = RoughEase.ease.config({
        template: "none",
        strength: 1.85,
        points: 36,
        taper: "out",
        randomize: true,
        clamp: false,
      });
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    const camTo = ({
      at,
      duration,
      pos,
      target,
      fov,
      roll,
      ease = "power3.inOut",
    }) => {
      if (pos)
        tl.to(
          camera.position,
          { x: pos.x, y: pos.y, z: pos.z, duration, ease },
          at,
        );
      if (target)
        tl.to(
          lookTarget,
          { x: target.x, y: target.y, z: target.z, duration, ease },
          at,
        );
      if (typeof fov === "number")
        tl.to(
          camera,
          {
            fov,
            duration,
            ease,
            onUpdate: () => camera.updateProjectionMatrix(),
          },
          at,
        );
      if (typeof roll === "number")
        tl.to(camRoll, { z: roll, duration, ease }, at);
    };

    const toU = (uniform, value, duration, at, ease = "power3.inOut") => {
      if (!uniform) return;
      tl.to(uniform, { value, duration, ease }, at);
    };

    const disposeGroup = (grp) => {
      if (!grp) return;
      grp.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.filter(Boolean).forEach((m) => m.dispose?.());
        }
      });
      grp.parent?.remove(grp);
    };

    // Reset.
    camera.position.set(198, 26, 372);
    camera.fov = 32;
    camera.updateProjectionMatrix();
    lookTarget.set(0, 0, 0);
    camRoll.z = 0;
    lensPass.uniforms.uActive.value = 0;
    lensPass.uniforms.uStrength.value = 0;
    lensPass.uniforms.uRingBoost.value = 0;
    warpPass.uniforms.uAmount.value = 0;
    chromaPass.uniforms.uStr.value = 0;
    barrelPass.uniforms.uStr.value = 0;
    vigPass.uniforms.uOpen.value = 0;
    bloomPass.strength = 0.72;
    bloomPass.radius = 0.48;
    bloomPass.threshold = 0.045;


    // Reset dos novos controles de escala/viagem.
    HOST.starMat.uniforms.uSpeed.value = 1;
    HOST.starMat.uniforms.uTravel.value = 0;
    HOST.starMat.uniforms.uSuck.value = 0;
    HOST.starMat.uniforms.uTear.value = 0;
    HOST.starMat.uniforms.uOpacity.value = 1;
    HOST.starMat.uniforms.uCoreDimming.value = 0;
    HOST.bulgeMat.uniforms.uRevealBH.value = 0;
    HOST.dustMat.uniforms.uTravel.value = 0;
    HOST.dustMat.uniforms.uOpacity.value = 0.42;
    HOST.nebMats.forEach((m) => {
      if (m.uniforms.uTravel) m.uniforms.uTravel.value = 0;
    });

    BH.photonMat.uniforms.uOpacity.value = 0;
    BH.haloMat.uniforms.uOpacity.value = 0;
    BH.coronaMat.uniforms.uOpacity.value = 0;
    BH.diskMat.uniforms.uOpacity.value = 0;
    BH.iscoMat.uniforms.uOpacity.value = 0;
    BH.hotspotMat.uniforms.uOpacity.value = 0;
    BH.jetMatA.uniforms.uOpacity.value = 0;
    BH.jetMatB.uniforms.uOpacity.value = 0;
    BH.magMats.forEach((m) => {
      m.opacity = 0;
    });

    lensPass.uniforms.uTime.value = 0;
    lensPass.uniforms.uSpin.value = 0;
    lensPass.uniforms.uPlunge.value = 0;

    // UI OUT.
    tl.to(
      uiLayer || {},
      {
        opacity: 0,
        duration: 0.64,
        ease: "power2.out",
        onComplete: () => {
          if (uiLayer) {
            uiLayer.style.display = "none";
            uiLayer.style.pointerEvents = "none";
          }
        },
      },
      0,
    );
    tl.to(
      [btnDespertar, subtitleText, titleText].filter(Boolean),
      {
        opacity: 0,
        scale: 1.035,
        filter: "blur(14px)",
        stagger: 0.07,
        duration: 1.05,
        ease: "power2.in",
      },
      0,
    );
    tl.to(introBlock || {}, { opacity: 0, duration: 0.42 }, 0);

    // LETTERBOX FECHA NO COMEÇO.
    tl.to(
      LB.top,
      { height: `${LB_H}px`, duration: 2.0, ease: "power4.inOut" },
      0.05,
    );
    tl.to(
      LB.bot,
      { height: `${LB_H}px`, duration: 2.0, ease: "power4.inOut" },
      0.05,
    );
    tl.to(OV.imax, { opacity: 0.16, duration: 1.8, ease: "power2.out" }, 0.12);

    // ═══════════════════════════════════════════════════════════════
    // ATO 1 — A CONTEMPLAÇÃO
    // Macro orbital: a câmera entende a galáxia inteira antes da viagem.
    // ═══════════════════════════════════════════════════════════════
    camTo({
      at: 0.0,
      duration: 0.01,
      pos: { x: 0, y: 112, z: 640 },
      target: { x: 0, y: 0, z: 0 },
      fov: 28,
      roll: 0,
      ease: "none",
    });

    tl.to(
      HOST.grp.rotation,
      {
        y: "+=0.12",
        z: "+=0.018",
        duration: 7.2,
        ease: "sine.inOut",
      },
      0.35,
    );

    tl.to(
      bloomPass,
      {
        strength: 0.64,
        radius: 0.42,
        threshold: 0.055,
        duration: 2.4,
        ease: "sine.out",
      },
      0.2,
    );

    tl.to(breathCtrl, { amp: 0.28, duration: 2.8, ease: "sine.inOut" }, 0.8);
    tl.to(shakeCtrl, { lf: 0.025, duration: 3.2, ease: "sine.inOut" }, 0.8);

    camTo({
      at: 0.75,
      duration: 3.25,
      pos: { x: -250, y: 92, z: 480 },
      target: { x: 0, y: 4, z: 0 },
      fov: 30,
      roll: -0.018,
      ease: "sine.inOut",
    });

    camTo({
      at: 3.65,
      duration: 3.45,
      pos: { x: 230, y: 74, z: 345 },
      target: { x: 0, y: 1.5, z: 0 },
      fov: 34,
      roll: 0.018,
      ease: "sine.inOut",
    });

    toU(HOST.starMat.uniforms.uTravel, 0.10, 2.0, 5.2, "sine.inOut");
    toU(HOST.dustMat.uniforms.uTravel, 0.12, 2.0, 5.2, "sine.inOut");

    HOST.nebMats.forEach((m, i) => {
      toU(m.uniforms.uTravel, 0.12, 2.0, 5.4 + i * 0.012, "sine.inOut");
    });

    // ═══════════════════════════════════════════════════════════════
    // ATO 2 — A VIAGEM
    // Mergulho pelos braços, poeira e nebulosas até o centro.
    // ═══════════════════════════════════════════════════════════════
    tl.addLabel("ACT_2_TRAVEL", 6.75);

    tl.to(shakeCtrl, { lf: 0.055, mf: 0.018, duration: 2.2, ease: "sine.inOut" }, 6.8);

    tl.to(
      bloomPass,
      {
        strength: 0.86,
        radius: 0.55,
        threshold: 0.035,
        duration: 2.5,
        ease: "sine.inOut",
      },
      6.85,
    );

    toU(HOST.starMat.uniforms.uTravel, 0.62, 2.4, 6.8, "power2.inOut");
    toU(HOST.starMat.uniforms.uSpeed, 68.0, 2.4, 6.8, "power2.inOut");
    toU(HOST.dustMat.uniforms.uTravel, 0.52, 2.4, 6.8, "power2.inOut");

    HOST.nebMats.forEach((m, i) => {
      toU(m.uniforms.uTravel, 0.58, 2.2, 7.0 + i * 0.018, "power2.inOut");
    });

    camTo({
      at: 6.75,
      duration: 1.65,
      pos: { x: 150, y: 38, z: 225 },
      target: { x: 44, y: 4, z: 58 },
      fov: 42,
      roll: -0.035,
      ease: "power2.inOut",
    });

    camTo({
      at: 8.05,
      duration: 1.75,
      pos: { x: 76, y: 18, z: 116 },
      target: { x: 14, y: 1.4, z: 22 },
      fov: 51,
      roll: 0.046,
      ease: "power3.inOut",
    });

    camTo({
      at: 9.45,
      duration: 1.35,
      pos: { x: 31, y: 7.5, z: 52 },
      target: { x: 2.2, y: 0.4, z: 2.5 },
      fov: 59,
      roll: -0.022,
      ease: "power3.inOut",
    });

    camTo({
      at: 10.6,
      duration: 1.45,
      pos: { x: 8.3, y: 2.3, z: 22 },
      target: { x: 0, y: 0, z: 0 },
      fov: 66,
      roll: 0.012,
      ease: "power4.out",
    });

    toU(HOST.bulgeMat.uniforms.uRevealBH, 0.78, 2.2, 8.8, "sine.inOut");
    toU(HOST.starMat.uniforms.uCoreDimming, 0.8, 2.2, 8.8, "sine.inOut");

    toU(BH.diskMat.uniforms.uOpacity, 1.0, 2.6, 8.85, "sine.inOut");
    toU(BH.coronaMat.uniforms.uOpacity, 0.9, 2.4, 9.05, "sine.inOut");
    toU(BH.haloMat.uniforms.uOpacity, 0.85, 2.0, 9.45, "sine.inOut");
    toU(BH.photonMat.uniforms.uOpacity, 1.0, 1.65, 10.15, "sine.inOut");
    toU(BH.iscoMat.uniforms.uOpacity, 0.55, 1.55, 10.35, "sine.inOut");
    toU(BH.hotspotMat.uniforms.uOpacity, 0.66, 1.25, 10.55, "sine.inOut");

    toU(lensPass.uniforms.uRingBoost, 0.85, 1.7, 10.1, "sine.inOut");
    toU(warpPass.uniforms.uAmount, 0.08, 1.5, 10.4, "sine.inOut");
    toU(chromaPass.uniforms.uStr, 0.004, 1.7, 10.35, "sine.inOut");

    tl.to(shakeCtrl, { lf: 0.018, mf: 0.0, duration: 1.2, ease: "sine.out" }, 10.95);
    toU(HOST.starMat.uniforms.uTravel, 0.16, 1.25, 10.95, "sine.out");
    toU(HOST.starMat.uniforms.uSpeed, 16.0, 1.25, 10.95, "sine.out");
    toU(HOST.dustMat.uniforms.uTravel, 0.12, 1.25, 10.95, "sine.out");

    HOST.nebMats.forEach((m) => {
      toU(m.uniforms.uTravel, 0.08, 1.15, 10.95, "sine.out");
    });

    // ═══════════════════════════════════════════════════════════════
    // HANDOFF SUAVE PARA O ATO 3 ORIGINAL
    // O BH não cresce; a câmera entra na escala dele.
    // ═══════════════════════════════════════════════════════════════
    tl.addLabel("ACT_3_HANDOFF", BEAT.TDE_INTERLUDE - 0.95);

    camTo({
      at: BEAT.TDE_INTERLUDE - 0.95,
      duration: 0.95,
      pos: { x: 3.2, y: 0.86, z: 8.8 },
      target: { x: 0, y: 0, z: 0 },
      fov: 71,
      roll: -0.006,
      ease: "power3.inOut",
    });

    toU(HOST.starMat.uniforms.uSuck, 0.10, 0.95, BEAT.TDE_INTERLUDE - 0.95, "power2.inOut");
    toU(HOST.starMat.uniforms.uTear, 0.06, 0.95, BEAT.TDE_INTERLUDE - 0.72, "power2.inOut");

    toU(warpPass.uniforms.uAmount, 0.16, 0.9, BEAT.TDE_INTERLUDE - 0.85, "power3.inOut");
    toU(chromaPass.uniforms.uStr, 0.011, 0.9, BEAT.TDE_INTERLUDE - 0.85, "power3.inOut");
    toU(barrelPass.uniforms.uStr, 0.045, 0.9, BEAT.TDE_INTERLUDE - 0.85, "power3.inOut");

    tl.to(
      shakeCtrl,
      { lf: 0.09, mf: 0.035, hf: 0.012, duration: 0.9, ease: "sine.inOut" },
      BEAT.TDE_INTERLUDE - 0.72,
    );

    // ═══════════════════════════════════════════════════════════════
    // ATO 4 — TDE / ESPAGUETIFICAÇÃO  (inalterado a partir daqui)
    // ═══════════════════════════════════════════════════════════════
    const D = BEAT.TDE_INTERLUDE;

    camTo({
      at: D,
      duration: 2.4,
      pos: { x: 14, y: 4.2, z: 23 },
      target: { x: 0, y: 0, z: 0 },
      fov: 62,
      roll: -Math.PI * 0.06,
      ease: "power2.inOut",
    });

    tl.to(
      HOST.starMat.uniforms.uTear,
      { value: 1.0, duration: 3.3, ease: "power2.inOut" },
      D - 0.3,
    );
    tl.to(
      HOST.starMat.uniforms.uSpeed,
      { value: 120, duration: 3.4, ease: "power2.in" },
      D - 0.2,
    );
    tl.to(
      TIDAL.pMat.uniforms.uOpacity,
      { value: 1.0, duration: 1.4, ease: "power2.out" },
      D,
    );
    tl.to(
      TIDAL.sMat.uniforms.uOpacity,
      { value: 0.95, duration: 1.4, ease: "power2.out" },
      D + 0.4,
    );

    TIDAL.gwMats.forEach((m, i) => {
      tl.to(
        m.uniforms.uOpacity,
        { value: 0.26, duration: 1.2, ease: "power2.out" },
        D + 0.35 + i * 0.06,
      );
      tl.to(
        m.uniforms.uOpacity,
        { value: 0.02, duration: 2.2, ease: "power2.in" },
        D + 2.2 + i * 0.05,
      );
    });

    toU(warpPass.uniforms.uAmount, 1.1, 2.2, D + 0.4, "sine.inOut");
    toU(chromaPass.uniforms.uStr, 0.18, 1.8, D + 0.6, "sine.inOut");
    tl.to(shakeCtrl, { lf: 0.16, mf: 0.2, duration: 2.3 }, D + 0.2);

    // ATO 5 — MERGULHO NO HORIZONTE / ABERTURA IMAX.
    const C = BEAT.CHAOS_START;

    camTo({
      at: C,
      duration: 1.55,
      pos: { x: 8.5, y: 2.4, z: 15.8 },
      target: { x: 0, y: 0, z: 0 },
      fov: 68,
      roll: Math.PI * 0.045,
      ease: "power2.in",
    });
    camTo({
      at: C + 1.35,
      duration: 1.85,
      pos: { x: -4.3, y: -1.1, z: 9.4 },
      target: { x: 0, y: 0, z: 0 },
      fov: 78,
      roll: -Math.PI * 0.035,
      ease: "power3.inOut",
    });
    camTo({
      at: C + 3.0,
      duration: 2.2,
      pos: { x: 0.55, y: 0.12, z: 4.25 },
      target: { x: 0, y: 0, z: 0 },
      fov: 92,
      roll: 0,
      ease: "power4.in",
    });

    // Abertura IMAX.
    tl.to(
      LB.top,
      { height: "0px", duration: 5.6, ease: "sine.inOut" },
      BEAT.IMAX_OPEN,
    );
    tl.to(
      LB.bot,
      { height: "0px", duration: 5.6, ease: "sine.inOut" },
      BEAT.IMAX_OPEN,
    );
    toU(vigPass.uniforms.uOpen, 1.0, 5.4, BEAT.IMAX_OPEN, "sine.inOut");
    tl.to(
      OV.imax,
      { opacity: 0.0, duration: 4.8, ease: "sine.inOut" },
      BEAT.IMAX_OPEN + 0.2,
    );

    tl.to(
      HOST.starMat.uniforms.uSuck,
      { value: 1, duration: 4.8, ease: "power3.in" },
      C + 0.3,
    );
    tl.to(
      TIDAL.pMat.uniforms.uChaos,
      { value: 1, duration: 4.6, ease: "power3.in" },
      C + 0.2,
    );
    tl.to(
      TIDAL.sMat.uniforms.uChaos,
      { value: 1, duration: 4.4, ease: "power3.in" },
      C + 0.35,
    );

    toU(lensPass.uniforms.uStrength, 0.12, 4.0, C + 0.2, "power3.in");
    toU(lensPass.uniforms.uRadius, 0.095, 4.0, C + 0.2, "power3.in");
    toU(lensPass.uniforms.uRingBoost, 1.1, 3.4, C + 0.7, "power3.in");
    toU(warpPass.uniforms.uAmount, 4.2, 3.6, C + 0.5, "power3.in");
    toU(chromaPass.uniforms.uStr, 0.72, 2.8, C + 1.0, "power3.in");
    toU(barrelPass.uniforms.uStr, -0.16, 3.0, C + 0.8, "power3.in");

    tl.to(
      bloomPass,
      { strength: 2.2, radius: 1.12, threshold: 0.025, duration: 3.4 },
      C + 0.6,
    );
    tl.to(shakeCtrl, { mf: 0.42, hf: 0.08, duration: 2.0 }, C + 0.8);
    tl.to(shakeCtrl, { mf: 0.2, hf: 0.0, duration: 2.4 }, C + 2.4);

    tl.to(
      camera.position,
      { x: 1.1, duration: 0.08, ease: roughEase },
      C + 3.55,
    );
    tl.to(
      camera.position,
      { y: -0.8, duration: 0.08, ease: roughEase },
      C + 3.68,
    );
    tl.to(
      camera.position,
      { x: 0.0, y: 0.0, duration: 0.22, ease: "power4.out" },
      C + 3.82,
    );

    // ATO 6 — TRAVESSIA.
    const T = BEAT.TRAVEL_START;
    const S = BEAT.SILENCE_START;
    const travelDur = S - T;

    camTo({
      at: T - 0.62,
      duration: 0.62,
      pos: { x: 0, y: 0, z: -2.4 },
      target: { x: 0, y: 0, z: -24 },
      fov: 148,
      roll: 0,
      ease: "power4.in",
    });

    toU(warpPass.uniforms.uAmount, 9.0, 0.7, T - 0.72, "power4.in");
    toU(chromaPass.uniforms.uStr, 1.55, 0.55, T - 0.58, "power4.in");
    toU(barrelPass.uniforms.uStr, -0.32, 0.55, T - 0.58, "power4.in");
    toU(anamPass.uniforms.uStrength, 0.34, 0.5, T - 0.5, "power4.in");

    tl.to(shakeCtrl, { mf: 0.95, hf: 0.55, duration: 0.48 }, T - 0.5);
    tl.to(
      OV.hawking,
      { opacity: 1.0, duration: 0.045, ease: "none" },
      T - 0.08,
    );
    tl.to(
      OV.flash,
      { opacity: 0.86, duration: 0.035, ease: "none" },
      T - 0.055,
    );
    tl.to(OV.flash, { opacity: 0, duration: 0.08, ease: "none" }, T + 0.015);
    tl.to(OV.hawking, { opacity: 0, duration: 0.12, ease: "none" }, T + 0.04);

    tl.add(() => {
      ST.tunneling = true;
      shakeCtrl.hf = 0.05;
      shakeCtrl.mf = 0.22;
      shakeCtrl.lf = 0.08;
      breathCtrl.amp = 0;
      BH.grp.visible = false;
      HOST.grp.visible = false;
      TUNNEL.pts.visible = true;
      cosmicGrp.visible = true;
      camRoll.z = 0;
      camera.rotation.z = 0;
      camera.position.set(0, 0, -92);
      lookTarget.set(0, 0, -1600);
      camera.fov = 116;
      camera.updateProjectionMatrix();
      barrelPass.uniforms.uStr.value = 0;
      warpPass.uniforms.uAmount.value = 2.4;
      chromaPass.uniforms.uStr.value = 0.28;
      anamPass.uniforms.uStrength.value = 0.08;
      PASS_GALAXIES.forEach((g) => {
        g.visible = false;
        if (g._mats)
          g._mats.forEach((m) => {
            if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = 0;
          });
      });
    }, T);

    toU(TUNNEL.mat.uniforms.uOpacity, 1.0, 0.55, T, "power2.out");
    toU(TUNNEL.mat.uniforms.uSpeed, 390, 1.0, T, "power3.out");
    toU(TUNNEL.mat.uniforms.uTwist, 2.25, travelDur, T, "sine.inOut");

    tl.to(
      camera.position,
      { x: 0, y: 0, z: -6200, duration: travelDur, ease: "power1.inOut" },
      T,
    );
    tl.to(
      lookTarget,
      { x: 0, y: 0, z: -7350, duration: travelDur, ease: "none" },
      T,
    );
    tl.to(
      camRoll,
      { z: Math.PI * 0.052, duration: travelDur * 0.45, ease: "sine.inOut" },
      T + 0.35,
    );
    tl.to(
      camRoll,
      { z: -Math.PI * 0.035, duration: travelDur * 0.42, ease: "sine.inOut" },
      T + travelDur * 0.45,
    );

    tl.to(
      camera,
      {
        fov: 104,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      T + 0.4,
    );
    tl.to(
      camera,
      {
        fov: 132,
        duration: 1.4,
        ease: "power2.inOut",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      T + 2.1,
    );
    tl.to(
      camera,
      {
        fov: 118,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      T + 4.0,
    );

    toU(TUNNEL.mat.uniforms.uSpeed, 260, 1.15, T + 1.2, "power2.inOut");
    toU(TUNNEL.mat.uniforms.uSpeed, 470, 1.25, T + 2.75, "power3.in");
    toU(TUNNEL.mat.uniforms.uSpeed, 330, 1.4, T + 4.15, "power2.out");

    tl.to(
      bloomPass,
      { strength: 1.55, radius: 0.92, threshold: 0.034, duration: 1.3 },
      T + 0.3,
    );
    tl.to(shakeCtrl, { mf: 0.14, hf: 0.02, lf: 0.07, duration: 2.4 }, T + 0.8);

    COSMIC_OBJECTS.forEach((obj) => {
      const zDist = Math.abs(obj.zPos),
        ratio = clamp(zDist / 7000, 0, 1),
        ta = T + ratio * (travelDur - 0.8);
      const isNeb = obj.type === "nebula",
        isQ = obj.type === "quasar",
        isP = obj.type === "pulsar";
      const inD = isNeb ? 0.95 : isP ? 0.42 : 0.52,
        outD = isNeb ? 1.1 : 0.64,
        peak = isNeb ? 0.9 : isQ ? 1.15 : 0.95;
      obj.mats.forEach((m) => {
        if (!m.uniforms?.uOpacity) return;
        tl.to(
          m.uniforms.uOpacity,
          { value: peak, duration: inD, ease: "power2.out" },
          ta - 0.52,
        );
        tl.to(
          m.uniforms.uOpacity,
          { value: 0, duration: outD, ease: "power2.in" },
          ta + 0.72,
        );
      });
    });

    if (typeof schedulePassGalaxies === "function")
      schedulePassGalaxies(tl, T, travelDur, -92, -6200);

    // ATO 7 — BLACKOUT / SILÊNCIO.
    toU(TUNNEL.mat.uniforms.uSpeed, 600, 0.38, S - 0.42, "power4.in");
    toU(chromaPass.uniforms.uStr, 2.0, 0.34, S - 0.34, "power4.in");
    toU(warpPass.uniforms.uAmount, 10.5, 0.34, S - 0.34, "power4.in");
    tl.to(
      bloomPass,
      { strength: 8.8, radius: 2.35, duration: 0.42, ease: "power4.in" },
      S - 0.46,
    );
    tl.to(OV.flash, { opacity: 1, duration: 0.035, ease: "none" }, S - 0.09);
    tl.to(
      OV.hawking,
      { opacity: 0.84, duration: 0.05, ease: "none" },
      S - 0.08,
    );
    tl.to(OV.flash, { opacity: 0, duration: 0.08, ease: "none" }, S - 0.015);
    tl.to(OV.hawking, { opacity: 0, duration: 0.12, ease: "none" }, S + 0.01);
    tl.to(
      OV.fade,
      { opacity: 1, duration: 0.42, ease: "power2.out" },
      S - 0.16,
    );

    tl.add(() => {
      ST.tunneling = false;
      ST.finale = true;
      shakeCtrl.mf = 0;
      shakeCtrl.hf = 0;
      shakeCtrl.lf = 0;
      breathCtrl.amp = 0;
      camRoll.z = 0;
      TUNNEL.pts.visible = false;
      cosmicGrp.visible = false;
      PASS_GALAXIES.forEach((g) => {
        g.visible = false;
      });
      if (ST.hostAlive) {
        disposeGroup(HOST.grp);
        ST.hostAlive = false;
      }
      if (ST.bhAlive) {
        disposeGroup(BH.grp);
        ST.bhAlive = false;
      }
      REBIRTH.grp.visible = true;
      camera.position.set(0, 2.1, 24);
      lookTarget.set(0, 0, 0);
      camera.fov = 46;
      camera.updateProjectionMatrix();
      bloomPass.strength = 2.75;
      bloomPass.radius = 1.15;
      bloomPass.threshold = 0.025;
      chromaPass.uniforms.uStr.value = 0;
      warpPass.uniforms.uAmount.value = 0;
      lensPass.uniforms.uActive.value = 0;
      lensPass.uniforms.uStrength.value = 0;
      lensPass.uniforms.uRingBoost.value = 0;
      anamPass.uniforms.uStrength.value = 0;
      barrelPass.uniforms.uStr.value = 0;
      vigPass.uniforms.uOpen.value = 1;
    }, S);

    // ATO 8 — NASCIMENTO DA GALÁXIA.
    const R = BEAT.REBIRTH_START;

    tl.to(OV.fade, { opacity: 0, duration: 1.55, ease: "power2.out" }, R);

    camTo({
      at: R,
      duration: 2.4,
      pos: { x: 0, y: 2.1, z: 24 },
      target: { x: 0, y: 0, z: 0 },
      fov: 46,
      roll: 0,
      ease: "sine.inOut",
    });
    camTo({
      at: R + 2.0,
      duration: 4.4,
      pos: { x: 14, y: 6.2, z: 54 },
      target: { x: 0, y: 0, z: 0 },
      fov: 40,
      roll: -Math.PI * 0.025,
      ease: "power2.inOut",
    });
    camTo({
      at: R + 6.1,
      duration: 5.3,
      pos: { x: -36, y: 18, z: 108 },
      target: { x: 0, y: 0, z: 0 },
      fov: 35,
      roll: Math.PI * 0.045,
      ease: "sine.inOut",
    });
    camTo({
      at: BEAT.FINAL_PULL,
      duration: BEAT.END - BEAT.FINAL_PULL - 1.4,
      pos: { x: 0, y: 27, z: 238 },
      target: { x: 0, y: 0, z: 0 },
      fov: 30,
      roll: 0,
      ease: "power2.inOut",
    });

    toU(REBIRTH.quantumMat.uniforms.uOpacity, 1.0, 1.0, R + 0.02, "power2.out");
    toU(REBIRTH.shockMat.uniforms.uOpacity, 1.0, 0.42, R + 0.12, "power2.out");
    toU(REBIRTH.shockMat.uniforms.uScale, 1.9, 3.2, R + 0.12, "expo.out");
    toU(REBIRTH.shockMat.uniforms.uOpacity, 0.0, 2.4, R + 0.9, "power2.in");
    toU(REBIRTH.starMat.uniforms.uGrow, 1.0, 13.4, R + 0.05, "power2.out");
    toU(REBIRTH.starMat.uniforms.uOpen, 1.0, 15.2, R + 0.12, "expo.out");
    toU(REBIRTH.starMat.uniforms.uPulse, 1.0, 11.8, R + 0.75, "sine.inOut");
    toU(REBIRTH.starMat.uniforms.uBallet, 1.0, 15.0, R + 0.55, "sine.inOut");
    toU(REBIRTH.bulgeMat.uniforms.uOpacity, 1.35, 2.2, R + 0.14, "power2.out");
    toU(REBIRTH.tailMat.uniforms.uOpacity, 0.88, 6.0, R + 2.15, "power1.out");
    toU(REBIRTH.tailMat.uniforms.uGrow, 1.0, 9.4, R + 2.15, "expo.out");

    REBIRTH.satMats.forEach((m, i) => {
      toU(
        m.uniforms.uOpacity,
        0.62 + i * 0.09,
        3.8,
        R + 3.0 + i * 1.05,
        "power1.out",
      );
    });
    REBIRTH.rayMats.forEach((m, i) => {
      tl.to(
        m,
        { opacity: 0.34, duration: 0.28, ease: "power2.out" },
        R + 0.18 + i * 0.035,
      );
      tl.to(
        m,
        { opacity: 0, duration: 2.8, ease: "power2.inOut" },
        R + 0.75 + i * 0.04,
      );
    });

    tl.to(
      REBIRTH.quantumMat.uniforms.uOpacity,
      { value: 0, duration: 6.2, ease: "power2.inOut" },
      R + 4.2,
    );
    tl.to(
      bloomPass,
      { strength: 3.4, radius: 1.35, threshold: 0.018, duration: 3.2 },
      R + 0.2,
    );
    tl.to(
      bloomPass,
      { strength: 2.05, radius: 0.92, threshold: 0.035, duration: 8.2 },
      R + 5.8,
    );
    tl.to(chromaPass.uniforms.uStr, { value: 0.18, duration: 2.2 }, R + 0.4);
    tl.to(chromaPass.uniforms.uStr, { value: 0.035, duration: 6.0 }, R + 4.0);
    tl.to(shakeCtrl, { lf: 0.08, mf: 0.03, hf: 0, duration: 1.2 }, R + 0.2);
    tl.to(shakeCtrl, { lf: 0.015, mf: 0, hf: 0, duration: 5.0 }, R + 4.0);

    tl.to(
      OV.fade,
      { opacity: 1, duration: 1.15, ease: "power2.inOut" },
      BEAT.END - 1.15,
    );
    tl.add(() => {
      document.body.classList.remove("diving-active");
      document.body.classList.add("intro-finished");
    }, BEAT.END);
  }

  btnDespertar.addEventListener("click", startIntro);

  // ═══════════════════════════════════════════════════════════════
  // SHAKE CINEMATOGRÁFICO
  // ═══════════════════════════════════════════════════════════════
  const _sh = { x: 0, y: 0, roll: 0 };

  function calcShake(t, dt) {
    const settle = clamp(dt * 9.5, 0, 1);
    const lf = shakeCtrl.lf,
      mf = shakeCtrl.mf * shakeCtrl.mf,
      hf = shakeCtrl.hf * shakeCtrl.hf;
    const lowX =
      (Math.sin(t * 0.23) * 0.58 + Math.sin(t * 0.47 + 1.7) * 0.42) * lf * 3.8;
    const lowY =
      (Math.cos(t * 0.29 + 0.4) * 0.56 + Math.cos(t * 0.51 + 2.0) * 0.44) *
      lf *
      2.8;
    const midX =
      (Math.sin(t * 1.76 + 0.2) * 0.48 +
        Math.sin(t * 2.63 + 1.1) * 0.34 +
        Math.sin(t * 3.31 + 2.3) * 0.18) *
      mf *
      4.4;
    const midY =
      (Math.cos(t * 1.58 + 0.7) * 0.46 +
        Math.cos(t * 2.41 + 1.8) * 0.36 +
        Math.cos(t * 3.02 + 0.3) * 0.18) *
      mf *
      4.2;
    const highX =
      (Math.sin(t * 7.4) * 0.55 +
        Math.sin(t * 10.2 + 0.6) * 0.3 +
        Math.sin(t * 13.6 + 1.2) * 0.15) *
      hf *
      6.4;
    const highY =
      (Math.cos(t * 7.1 + 0.5) * 0.52 +
        Math.cos(t * 9.8 + 1.4) * 0.32 +
        Math.cos(t * 12.9 + 2.2) * 0.16) *
      hf *
      6.4;
    const targetX = lowX + midX + highX,
      targetY = lowY + midY + highY;
    const targetRoll =
      Math.sin(t * 1.45 + 0.8) * 0.0032 * shakeCtrl.mf +
      Math.sin(t * 4.6 + 0.2) * 0.0014 * shakeCtrl.hf;
    _sh.x += (targetX - _sh.x) * settle;
    _sh.y += (targetY - _sh.y) * settle;
    _sh.roll += (targetRoll - _sh.roll) * settle;
  }


  function updateBlackHoleProjection(t) {
    if (!ST.bhAlive) {
      lensPass.uniforms.uActive.value = 0;
      lensPass.uniforms.uStrength.value = 0;
      return;
    }

    const dist = camera.position.distanceTo(origin);

    const reveal =
      1.0 -
      smoothstepJS(
        BH_SCALE.REVEAL_FULL_DIST,
        BH_SCALE.REVEAL_START_DIST,
        dist,
      );

    const lensReveal =
      1.0 -
      smoothstepJS(
        BH_SCALE.LENS_FULL_DIST,
        BH_SCALE.LENS_START_DIST,
        dist,
      );

    const plunge = 1.0 - smoothstepJS(8.0, 31.0, dist);

    if (HOST.bulgeMat?.uniforms?.uRevealBH) {
      HOST.bulgeMat.uniforms.uRevealBH.value = Math.max(
        HOST.bulgeMat.uniforms.uRevealBH.value,
        reveal * 0.72,
      );
    }

    if (HOST.starMat?.uniforms?.uCoreDimming) {
      HOST.starMat.uniforms.uCoreDimming.value = Math.max(
        HOST.starMat.uniforms.uCoreDimming.value,
        reveal * 0.62,
      );
    }

    const center = origin.clone().project(camera);
    const edge = new THREE.Vector3(EH_R * 2.6, 0, 0).project(camera);

    const visible =
      center.z > -1 &&
      center.z < 1 &&
      center.x > -1.3 &&
      center.x < 1.3 &&
      center.y > -1.3 &&
      center.y < 1.3;

    const projectedRadius =
      new THREE.Vector2(edge.x - center.x, edge.y - center.y).length() * 0.5;

    const cx = clamp(0.5 + center.x * 0.5, 0.02, 0.98);
    const cy = clamp(0.5 + center.y * 0.5, 0.02, 0.98);

    lensPass.uniforms.uCenter.value.set(cx, cy);
    warpPass.uniforms.uCenter.value.set(cx, cy);
    anamPass.uniforms.uCenter.value.set(cx, cy);

    lensPass.uniforms.uRadius.value = THREE.MathUtils.clamp(
      projectedRadius * 1.65,
      0.0012,
      THREE.MathUtils.lerp(0.018, 0.145, plunge),
    );

    lensPass.uniforms.uActive.value = visible ? lensReveal : 0;
    lensPass.uniforms.uStrength.value = THREE.MathUtils.lerp(
      0.0,
      0.016,
      lensReveal,
    );
    lensPass.uniforms.uSpin.value = THREE.MathUtils.lerp(0.0, 1.0, reveal);
    lensPass.uniforms.uPlunge.value = plunge;
    lensPass.uniforms.uTime.value = t;

    anamPass.uniforms.uStrength.value = Math.max(
      anamPass.uniforms.uStrength.value,
      reveal * 0.18 + plunge * 0.55,
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER LOOP
  // ═══════════════════════════════════════════════════════════════
  const clock = new THREE.Clock();
  const basePos = new THREE.Vector3();

  function updateMaterialTime(mat, t) {
    if (mat?.uniforms?.uT) mat.uniforms.uT.value = t;
  }

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.033);
    const t = clock.elapsedTime;

    bgStars.mat.uniforms.uT.value = t;

    updateMaterialTime(HOST.starMat, t);
    updateMaterialTime(HOST.bulgeMat, t);
    updateMaterialTime(HOST.dustMat, t);
    HOST.nebMats.forEach((m) => updateMaterialTime(m, t));

    updateMaterialTime(BH.photonMat, t);
    updateMaterialTime(BH.haloMat, t);
    updateMaterialTime(BH.coronaMat, t);
    updateMaterialTime(BH.diskMat, t);
    updateMaterialTime(BH.iscoMat, t);
    updateMaterialTime(BH.hotspotMat, t);
    updateMaterialTime(BH.jetMatA, t);
    updateMaterialTime(BH.jetMatB, t);

    updateMaterialTime(TIDAL.pMat, t);
    updateMaterialTime(TIDAL.sMat, t);
    TIDAL.gwMats.forEach((m) => updateMaterialTime(m, t));

    updateMaterialTime(TUNNEL.mat, t);

    COSMIC_OBJECTS.forEach((obj) => {
      obj.mats.forEach((m) => updateMaterialTime(m, t));
      if (obj.mesh) obj.mesh.rotation.z += dt * 0.025;
    });

    PASS_GALAXIES.forEach((g) => {
      if (!g.visible) return;
      g.rotation.z += dt * 0.08;
      if (g._mats) g._mats.forEach((m) => updateMaterialTime(m, t));
    });

    updateMaterialTime(REBIRTH.quantumMat, t);
    updateMaterialTime(REBIRTH.shockMat, t);
    updateMaterialTime(REBIRTH.starMat, t);
    updateMaterialTime(REBIRTH.bulgeMat, t);
    updateMaterialTime(REBIRTH.tailMat, t);
    REBIRTH.satMats.forEach((m) => updateMaterialTime(m, t));

    REBIRTH.grp.rotation.y += dt * 0.012;
    REBIRTH.grp.rotation.z += dt * 0.004;

    if (ST.tunneling) {
      bgStars.pts.rotation.y += dt * 0.008;
      bgStars.pts.rotation.x += dt * 0.002;
    }

    calcShake(t, dt);

    basePos.copy(camera.position);
    const breath = Math.sin(t * 0.45) * breathCtrl.amp;

    camera.position.set(
      basePos.x + _sh.x,
      basePos.y + _sh.y + breath,
      basePos.z,
    );
    camera.lookAt(lookTarget);
    camera.rotateZ(camRoll.z + _sh.roll);

    updateBlackHoleProjection(t);

    composer.render();
    camera.position.copy(basePos);
  }

  loop();

  // ═══════════════════════════════════════════════════════════════
  // RESIZE
  // ═══════════════════════════════════════════════════════════════
  window.addEventListener("resize", () => {
    VIEW.w = window.innerWidth;
    VIEW.h = window.innerHeight;
    camera.aspect = VIEW.w / VIEW.h;
    camera.updateProjectionMatrix();
    renderer.setSize(VIEW.w, VIEW.h);
    composer.setSize(VIEW.w, VIEW.h);
    if (typeof bloomPass.setSize === "function")
      bloomPass.setSize(VIEW.w, VIEW.h);
    lensPass.uniforms.uAspect.value = VIEW.w / VIEW.h;
    anamPass.uniforms.uAspect.value = VIEW.w / VIEW.h;
    vigPass.uniforms.uAspect.value = VIEW.w / VIEW.h;
    grain.resize();
  });
});
