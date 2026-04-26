/* ═══════════════════════════════════════════════════════════════
   perfil.js — Andrômeda · Meu Perfil
   Cosmos JWST Scientific Edition · THREE.js r128 + GSAP 3
   Inspiração visual/científica: Webb Deep Field, Cosmic Cliffs,
   Pillars of Creation, poeira MIRI, NIRCam e lentes gravitacionais.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    /* ═══════════════════════════════════════════════════════════════
       1. MANTER ABA ATIVA APÓS REFRESH
    ═══════════════════════════════════════════════════════════════ */
    const CHAVE_ABA = "perfil_aba_ativa";
    const abaSalva = localStorage.getItem(CHAVE_ABA);

    if (abaSalva && typeof bootstrap !== "undefined" && bootstrap.Tab) {
      const btn = document.querySelector(`[data-bs-target="${abaSalva}"]`);
      if (btn) new bootstrap.Tab(btn).show();
      localStorage.removeItem(CHAVE_ABA);
    }

    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", () => {
        const abaAtiva = document.querySelector(
          ".nav-link.active[data-bs-target]",
        );
        if (abaAtiva)
          localStorage.setItem(CHAVE_ABA, abaAtiva.dataset.bsTarget);
      });
    });

    /* ═══════════════════════════════════════════════════════════════
       2. QUALIDADE VISUAL — Cinema / Equilíbrio / Eco
    ═══════════════════════════════════════════════════════════════ */
    const QUALITY_KEY = "andromeda_modo_visual";
    const LEGACY_KEYS = [
      "andromeda-quality-mode",
      "andromeda_quality_mode",
      "andromeda-quality",
      "andromeda-quality-profile",
      "andromeda-visual-mode",
      "andromeda-perfil-qualidade",
    ];

    const QUALITY_ALIASES = {
      cinema: "cinema",
      cinematic: "cinema",
      cinematica: "cinema",
      cinematografico: "cinema",
      cinematográfico: "cinema",
      equilibrio: "equilibrio",
      equilibrado: "equilibrio",
      balanced: "equilibrio",
      medio: "equilibrio",
      eco: "eco",
      economico: "eco",
      econômico: "eco",
      low: "eco",
    };

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cpu = navigator.hardwareConcurrency || 8;
    const memory = navigator.deviceMemory || 8;

    const QUALITY_PROFILES = {
      cinema: {
        label: "Cinema",
        next: "Equilíbrio",
        dpr: 1.75,
        fps: 60,
        antialias: true,
        power: "high-performance",
        stars: 1.0,
        dust: 1.0,
        galaxies: 1.0,
        arcs: 1.0,
        beacons: 1.0,
        nebulaOctaves: 6,
        nebulaGlow: 1.16,
        nebulaContrast: 1.08,
        bloom: true,
        bloomStrength: 1.18,
        bloomRadius: 0.58,
        bloomThreshold: 0.08,
        camera: 1.0,
      },
      equilibrio: {
        label: "Equilíbrio",
        next: "Eco",
        dpr: 1.35,
        fps: 45,
        antialias: false,
        power: "high-performance",
        stars: 0.68,
        dust: 0.7,
        galaxies: 0.72,
        arcs: 0.75,
        beacons: 0.72,
        nebulaOctaves: 5,
        nebulaGlow: 0.96,
        nebulaContrast: 1.0,
        bloom: true,
        bloomStrength: 0.82,
        bloomRadius: 0.48,
        bloomThreshold: 0.13,
        camera: 0.82,
      },
      eco: {
        label: "Eco",
        next: "Cinema",
        dpr: 1.0,
        fps: 30,
        antialias: false,
        power: "low-power",
        stars: 0.42,
        dust: 0.44,
        galaxies: 0.48,
        arcs: 0.46,
        beacons: 0.45,
        nebulaOctaves: 4,
        nebulaGlow: 0.78,
        nebulaContrast: 0.92,
        bloom: true,
        bloomStrength: 0.38,
        bloomRadius: 0.34,
        bloomThreshold: 0.2,
        camera: 0.6,
      },
    };

    function normalizeMode(value) {
      if (!value) return null;
      return QUALITY_ALIASES[String(value).toLowerCase().trim()] || null;
    }

    function savedMode() {
      const direct = normalizeMode(localStorage.getItem(QUALITY_KEY));
      if (direct) return direct;
      for (const key of LEGACY_KEYS) {
        const found = normalizeMode(localStorage.getItem(key));
        if (found) return found;
      }
      return null;
    }

    function autoMode() {
      const saved = savedMode();
      if (saved) return saved;
      if (prefersReducedMotion || isTouch || window.innerWidth < 768)
        return "eco";
      if (cpu <= 4 || memory <= 4) return "equilibrio";
      return "cinema";
    }

    let qualityName = autoMode();
    let quality = QUALITY_PROFILES[qualityName];
    document.documentElement.dataset.andromedaMode = qualityName;

    function nextMode(name) {
      if (name === "cinema") return "equilibrio";
      if (name === "equilibrio") return "eco";
      return "cinema";
    }

    function injectRuntimeStyle() {
      if (document.getElementById("andromeda-perfil-jwst-style")) return;
      const style = document.createElement("style");
      style.id = "andromeda-perfil-jwst-style";
      style.textContent = `
        #webgl {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -2;
          background: #020305;
        }
        #webgl canvas {
          display: block;
          width: 100% !important;
          height: 100% !important;
          transform: translateZ(0);
        }
        .andromeda-quality-toggle {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 1200;
          height: 32px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          border-radius: 999px;
          border: 1px solid rgba(224,240,255,.15);
          background: rgba(2,5,12,.48);
          color: rgba(224,240,255,.84);
          font-family: "Space Mono", monospace;
          font-size: 10px;
          letter-spacing: .12em;
          line-height: 1;
          text-transform: uppercase;
          backdrop-filter: blur(16px) saturate(135%);
          -webkit-backdrop-filter: blur(16px) saturate(135%);
          box-shadow: 0 10px 30px rgba(0,0,0,.28), inset 0 0 16px rgba(42,162,246,.05);
          cursor: pointer;
          transition: transform .28s ease, border-color .28s ease, background .28s ease, box-shadow .28s ease, color .28s ease, opacity .28s ease;
        }
        .andromeda-quality-toggle:hover {
          transform: translate3d(0,-2px,0);
          color: #fff;
          border-color: rgba(42,162,246,.38);
          background: rgba(4,12,26,.66);
          box-shadow: 0 14px 38px rgba(0,0,0,.38), 0 0 24px rgba(42,162,246,.11), inset 0 0 18px rgba(42,162,246,.07);
        }
        .andromeda-quality-toggle::after {
          content: "trocar";
          position: absolute;
          right: 0;
          bottom: calc(100% + 7px);
          opacity: 0;
          color: rgba(224,240,255,.50);
          font-size: 9px;
          letter-spacing: .16em;
          transform: translate3d(0,4px,0);
          pointer-events: none;
          transition: opacity .22s ease, transform .22s ease;
        }
        .andromeda-quality-toggle:hover::after {
          opacity: 1;
          transform: translate3d(0,0,0);
        }
        .andromeda-quality-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2aa2f6;
          box-shadow: 0 0 12px rgba(42,162,246,.75);
          flex: 0 0 auto;
        }
        .andromeda-quality-toggle[data-mode="cinema"] .andromeda-quality-dot {
          background: #a960ee;
          box-shadow: 0 0 14px rgba(169,96,238,.85), 0 0 26px rgba(42,162,246,.24);
        }
        .andromeda-quality-toggle[data-mode="equilibrio"] .andromeda-quality-dot {
          background: #2aa2f6;
          box-shadow: 0 0 12px rgba(42,162,246,.75);
        }
        .andromeda-quality-toggle[data-mode="eco"] .andromeda-quality-dot {
          background: #7fd4ff;
          box-shadow: 0 0 10px rgba(127,212,255,.52);
        }
        .andromeda-quality-toggle.is-changing { transform: scale(.96); opacity: .76; }
        .andromeda-ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,.16);
          transform: scale(0);
          animation: andromedaRipple .62s ease-out forwards;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        @keyframes andromedaRipple { to { transform: scale(2.85); opacity: 0; } }
        .perfil-gsap-ready .perfil-header,
        .perfil-gsap-ready .form-card,
        .perfil-gsap-ready .nav-tabs,
        .perfil-gsap-ready .alert,
        .perfil-gsap-ready .table tbody tr {
          will-change: transform, opacity, filter;
        }
        @media (pointer: coarse), (max-width: 767px) {
          #reticle, #reticle-dot { display: none !important; }
          .andromeda-quality-toggle { right: 14px; bottom: 14px; height: 31px; padding: 0 10px; }
        }
      `;
      document.head.appendChild(style);
    }

    function createQualityButton() {
      const old = document.querySelector(".andromeda-quality-toggle");
      if (old) old.remove();
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "andromeda-quality-toggle";
      btn.setAttribute("aria-label", "Alternar qualidade visual");
      btn.innerHTML = `
        <span class="andromeda-quality-dot" aria-hidden="true"></span>
        <span class="andromeda-quality-label"></span>
      `;
      document.body.appendChild(btn);

      function refresh() {
        btn.dataset.mode = qualityName;
        btn.title = `Modo atual: ${quality.label}. Clique para usar ${quality.next}.`;
        const label = btn.querySelector(".andromeda-quality-label");
        if (label) label.textContent = quality.label;
      }

      btn.addEventListener("click", () => {
        const next = nextMode(qualityName);
        localStorage.setItem(QUALITY_KEY, next);
        btn.classList.add("is-changing");
        setTimeout(() => window.location.reload(), 170);
      });

      refresh();
    }

    injectRuntimeStyle();
    createQualityButton();

    /* ═══════════════════════════════════════════════════════════════
       3. CURSOR MAGNÉTICO OTIMIZADO
    ═══════════════════════════════════════════════════════════════ */
    function setupCursor() {
      const reticle = document.getElementById("reticle");
      const dot = document.getElementById("reticle-dot");
      if (!reticle || isTouch) return;

      let tx = window.innerWidth / 2;
      let ty = window.innerHeight / 2;
      let rx = tx;
      let ry = ty;
      let dx = tx;
      let dy = ty;
      let hovering = false;
      let visible = !document.hidden;
      const selector =
        "a, button, input, textarea, select, label, .nav-link, .nav-item, .btn, .form-control, .interactable";

      document.addEventListener(
        "pointermove",
        (e) => {
          tx = e.clientX;
          ty = e.clientY;
        },
        { passive: true },
      );

      document.addEventListener(
        "pointerdown",
        () => reticle.classList.add("click"),
        { passive: true },
      );
      document.addEventListener(
        "pointerup",
        () => reticle.classList.remove("click"),
        { passive: true },
      );

      document.addEventListener(
        "mouseover",
        (e) => {
          if (e.target.closest && e.target.closest(selector)) {
            hovering = true;
            reticle.classList.add("hover");
          }
        },
        { passive: true },
      );

      document.addEventListener(
        "mouseout",
        (e) => {
          if (e.target.closest && e.target.closest(selector)) {
            hovering = false;
            reticle.classList.remove("hover");
          }
        },
        { passive: true },
      );

      document.addEventListener("visibilitychange", () => {
        visible = !document.hidden;
      });

      function cursorLoop() {
        requestAnimationFrame(cursorLoop);
        if (!visible) return;
        const retSpeed = hovering ? 0.3 : 0.22;
        rx += (tx - rx) * retSpeed;
        ry += (ty - ry) * retSpeed;
        dx += (tx - dx) * 0.72;
        dy += (ty - dy) * 0.72;
        reticle.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
        if (dot)
          dot.style.transform = `translate3d(${dx}px,${dy}px,0) translate(-50%,-50%)`;
      }
      cursorLoop();
    }

    setupCursor();

    /* ═══════════════════════════════════════════════════════════════
       4. THREE.JS — JWST COSMOS / DEEP FIELD / PILLARS / LENSING
    ═══════════════════════════════════════════════════════════════ */
    function setupJWSTCosmos() {
      const container = document.getElementById("webgl");
      if (!container || typeof THREE === "undefined") return;

      container.innerHTML = "";

      let vW = window.innerWidth;
      let vH = window.innerHeight;
      const DPR = Math.min(window.devicePixelRatio || 1, quality.dpr);
      const frameInterval = 1000 / quality.fps;
      let lastFrame = 0;
      let visible = !document.hidden;

      const renderer = new THREE.WebGLRenderer({
        antialias: quality.antialias,
        alpha: false,
        powerPreference: quality.power,
      });
      renderer.setPixelRatio(DPR);
      renderer.setSize(vW, vH);
      renderer.setClearColor(0x020305, 1);
      renderer.toneMapping =
        THREE.ACESFilmicToneMapping || THREE.ReinhardToneMapping;
      renderer.toneMappingExposure =
        qualityName === "cinema"
          ? 1.2
          : qualityName === "equilibrio"
            ? 1.08
            : 0.98;
      if ("outputColorSpace" in renderer)
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      else if ("outputEncoding" in renderer)
        renderer.outputEncoding = THREE.sRGBEncoding;
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(
        0x02050c,
        qualityName === "eco" ? 0.00072 : 0.00052,
      );

      const camera = new THREE.PerspectiveCamera(55, vW / vH, 0.1, 5200);
      camera.position.set(0, 20, 640);

      const root = new THREE.Group();
      const deepField = new THREE.Group();
      const arcsRoot = new THREE.Group();
      const dustRoot = new THREE.Group();
      const beaconRoot = new THREE.Group();
      scene.add(root, deepField, arcsRoot, dustRoot, beaconRoot);

      let composer = null;
      let bloomPass = null;
      if (
        quality.bloom &&
        typeof THREE.EffectComposer !== "undefined" &&
        typeof THREE.RenderPass !== "undefined" &&
        typeof THREE.UnrealBloomPass !== "undefined"
      ) {
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(vW, vH),
          quality.bloomStrength,
          quality.bloomRadius,
          quality.bloomThreshold,
        );
        composer.addPass(bloomPass);
      }

      const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
      document.addEventListener(
        "pointermove",
        (e) => {
          mouse.tx = (e.clientX / Math.max(1, vW) - 0.5) * 2;
          mouse.ty = (e.clientY / Math.max(1, vH) - 0.5) * 2;
        },
        { passive: true },
      );

      /* ── Nebulosa procedural: Cosmic Cliffs + Pillars + MIRI dust ── */
      const VS_QUAD = `
        void main() {
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `;

      const FS_NEBULA = `
        precision highp float;
        #define OCTAVES ${quality.nebulaOctaves}
        uniform float uTime;
        uniform vec2  uResolution;
        uniform vec2  uMouse;
        uniform float uGlow;
        uniform float uContrast;

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
          for (int i = 0; i < OCTAVES; i++) {
            v += a * noise(p);
            p = rot * p * 2.05;
            a *= 0.52;
          }
          return v;
        }

        float fbm4(vec2 p) {
          float v = 0.0;
          float a = 0.55;
          mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.15;
            a *= 0.50;
          }
          return v;
        }

        float pillar(vec2 uv, float x, float w, float y0, float lean, float seed) {
          float yy = smoothstep(y0, 1.05, uv.y);
          float center = x + lean * (uv.y - y0) + fbm4(vec2(uv.y * 3.0 + seed, seed)) * 0.026;
          float d = abs(uv.x - center);
          float body = (1.0 - smoothstep(w * 0.35, w, d)) * yy;
          float rugged = smoothstep(0.12, 0.55, fbm4(vec2(d * 10.0 + seed, uv.y * 4.0 - uTime * 0.025)));
          return body * rugged;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution.xy;
          float ar = uResolution.x / max(1.0, uResolution.y);
          vec2 p = (uv - 0.5) * vec2(ar, 1.0) * 2.20;
          p += uMouse * 0.035;

          float t = uTime * 0.030;
          vec2 q = vec2(fbm(p + vec2(t, -t * .25)), fbm(p + vec2(5.2, 1.3) - t * .35));
          vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2) + t), fbm(p + 3.7*q + vec2(8.3, 2.8) - t * .74));
          float f = fbm(p + 4.5 * r);
          float g = fbm(p * 1.78 + r * 2.35 + vec2(-t, t * .42));
          float h = fbm4(p * 3.1 + vec2(t * .20, -t * .12));

          vec3 abyss = vec3(0.000, 0.006, 0.020);
          vec3 nirBlue = vec3(0.006, 0.165, 0.600);
          vec3 ionCyan = vec3(0.018, 0.650, 0.840);
          vec3 deepIndigo = vec3(0.030, 0.022, 0.125);
          vec3 miriAmber = vec3(0.780, 0.330, 0.045);
          vec3 haRose = vec3(0.860, 0.095, 0.210);
          vec3 starGold = vec3(0.960, 0.660, 0.135);
          vec3 violet = vec3(0.310, 0.055, 0.650);

          vec3 col = abyss;

          /* NIRCam: azul/ciano de estrelas jovens e gás ionizado */
          col = mix(col, nirBlue, smoothstep(-0.12, 0.48, f) * 0.50 * uGlow);
          col += ionCyan * smoothstep(0.42, 0.72, f) * 0.22 * uGlow;
          col += violet * smoothstep(0.18, 0.64, g) * 0.20 * uGlow;

          /* MIRI: poeira quente laranja/âmbar */
          float warmDust = smoothstep(0.34, 0.74, g) * (1.0 - smoothstep(0.78, 0.94, f));
          col = mix(col, miriAmber, warmDust * 0.42 * uGlow);
          col += haRose * smoothstep(0.56, 0.86, g) * 0.17 * uGlow;

          /* Cosmic Cliffs: parede de gás no terço inferior */
          float cliffBase = smoothstep(0.36, 0.02, uv.y);
          float cliffShape = smoothstep(-0.18, 0.45, fbm4(vec2(p.x * 1.15 + t, uv.y * 5.2)));
          float cliff = cliffBase * cliffShape;
          col = mix(col, miriAmber * 0.60 + haRose * 0.18, cliff * 0.46 * uGlow);
          col += cliff * ionCyan * smoothstep(0.22, 0.70, h) * 0.11;

          /* Pillars of Creation: colunas densas com bordas ionizadas */
          float p1 = pillar(uv, 0.26, 0.090, 0.14,  0.050, 1.4);
          float p2 = pillar(uv, 0.57, 0.082, 0.20, -0.035, 4.7);
          float p3 = pillar(uv, 0.72, 0.062, 0.32,  0.020, 8.6);
          float pm = clamp(p1 + p2 * 0.86 + p3 * 0.72, 0.0, 1.0);
          col = mix(col, deepIndigo, pm * 0.64);

          float edge = clamp(
            (p1 * (1.0 - smoothstep(0.32, 0.64, fbm4(uv * 6.2 + 1.4)))) +
            (p2 * (1.0 - smoothstep(0.35, 0.68, fbm4(uv * 6.6 + 4.2)))) +
            (p3 * (1.0 - smoothstep(0.38, 0.70, fbm4(uv * 7.4 + 8.1)))),
            0.0, 1.0
          );
          col += edge * (ionCyan * 0.26 + miriAmber * 0.18) * uGlow;

          /* Região de formação estelar no alto */
          float nursery = smoothstep(0.62, 1.0, uv.y) * smoothstep(0.20, 0.72, f + h * .45);
          col += nursery * (starGold * 0.22 + ionCyan * 0.13) * uGlow;

          /* núcleo observacional atrás do perfil */
          vec2 c = p + vec2(-0.20, 0.02);
          float core = max(0.0, 1.0 - length(c * vec2(0.55, 0.90)));
          col += core * core * (starGold * 0.13 + ionCyan * 0.06) * uGlow;

          col *= 0.92 + 0.08 * sin(uTime * 0.23 + fbm4(p * 0.50) * 5.0);
          col = pow(max(col, 0.0), vec3(0.88 / max(0.2, uContrast)));

          float vign = length((uv - 0.5) * vec2(1.0, 1.22));
          col *= 1.0 - smoothstep(0.34, 1.08, vign) * 0.80;
          col = clamp(col, 0.0, 1.0);
          gl_FragColor = vec4(col, 1.0);
        }
      `;

      const nebulaMaterial = new THREE.ShaderMaterial({
        vertexShader: VS_QUAD,
        fragmentShader: FS_NEBULA,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(vW, vH) },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uGlow: { value: quality.nebulaGlow },
          uContrast: { value: quality.nebulaContrast },
        },
        depthTest: false,
        depthWrite: false,
      });

      const nebulaMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        nebulaMaterial,
      );
      nebulaMesh.frustumCulled = false;
      nebulaMesh.renderOrder = -100;
      scene.add(nebulaMesh);

      /* ── Estrelas esféricas via shader, classes OBAFGKM ───────── */
      const spectral = [
        { hex: "#9bb4ff", prob: 0.01, size: [2.3, 5.4] },
        { hex: "#b8cfff", prob: 0.03, size: [1.8, 4.2] },
        { hex: "#d8ecff", prob: 0.072, size: [1.5, 3.6] },
        { hex: "#f8f4ff", prob: 0.105, size: [1.2, 3.2] },
        { hex: "#fff8e8", prob: 0.155, size: [1.0, 2.8] },
        { hex: "#ffd4a0", prob: 0.265, size: [0.8, 2.4] },
        { hex: "#ffb862", prob: 0.363, size: [0.65, 2.1] },
      ];

      function pickSpectral() {
        let acc = 0;
        const r = Math.random();
        for (const item of spectral) {
          acc += item.prob;
          if (r <= acc) return item;
        }
        return spectral[spectral.length - 1];
      }

      function count(base) {
        return Math.max(1, Math.floor(base * quality.stars));
      }

      function makeStars(total, radius, zBias, spreadY, sizeBoost, alpha) {
        const positions = new Float32Array(total * 3);
        const colors = new Float32Array(total * 3);
        const sizes = new Float32Array(total);
        const phases = new Float32Array(total);
        const speeds = new Float32Array(total);
        const color = new THREE.Color();

        for (let i = 0; i < total; i++) {
          const i3 = i * 3;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.pow(Math.random(), 0.58) * radius;

          positions[i3] = Math.sin(phi) * Math.cos(theta) * r;
          positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r * spreadY;
          positions[i3 + 2] = Math.cos(phi) * r + zBias;

          const s = pickSpectral();
          color.set(s.hex).multiplyScalar(0.58 + Math.random() * 0.68);
          colors[i3] = color.r;
          colors[i3 + 1] = color.g;
          colors[i3 + 2] = color.b;

          sizes[i] =
            (s.size[0] +
              Math.pow(Math.random(), 1.6) * (s.size[1] - s.size[0])) *
            sizeBoost;
          phases[i] = Math.random() * Math.PI * 2;
          speeds[i] = 0.42 + Math.random() * 1.85;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
        geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: DPR },
            uAlpha: { value: alpha },
          },
          vertexShader: `
            attribute float aSize;
            attribute float aPhase;
            attribute float aSpeed;
            varying vec3 vColor;
            varying float vPulse;
            uniform float uTime;
            uniform float uPixelRatio;
            void main() {
              vColor = color;
              vPulse = 0.78 + sin(uTime * aSpeed + aPhase) * 0.22;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              float perspective = 320.0 / max(28.0, -mvPosition.z);
              gl_PointSize = aSize * vPulse * uPixelRatio * perspective;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            varying float vPulse;
            uniform float uAlpha;
            void main() {
              vec2 p = gl_PointCoord * 2.0 - 1.0;
              float d = dot(p, p);
              if (d > 1.0) discard;
              float sphere = pow(1.0 - d, 2.1);
              float core = pow(1.0 - d, 12.0);
              float rim = pow(max(0.0, 1.0 - abs(d - 0.55)), 5.0) * 0.08;
              vec3 col = vColor * (sphere * 0.72 + core * 1.75 + rim) * vPulse;
              float a = (sphere * 0.70 + core * 0.55) * uAlpha;
              gl_FragColor = vec4(col, a);
            }
          `,
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

        const points = new THREE.Points(geo, mat);
        points.frustumCulled = false;
        return { points, material: mat };
      }

      const starLayers = [
        makeStars(count(2600), 2300, -920, 0.58, 1.0, 0.78),
        makeStars(count(1250), 1080, -300, 0.45, 1.25, 0.88),
        makeStars(count(460), 520, 120, 0.55, 1.7, 0.96),
      ];
      starLayers.forEach((s) => root.add(s.points));

      /* ── Deep Field: galáxias pequenas, distantes, variadas ───── */
      function galaxyTexture(type) {
        const c = document.createElement("canvas");
        c.width = c.height = 96;
        const ctx = c.getContext("2d");
        const cx = 48;
        const cy = 48;

        ctx.clearRect(0, 0, 96, 96);
        if (type === 0) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34);
          g.addColorStop(0, "rgba(255,232,170,.95)");
          g.addColorStop(0.48, "rgba(216,142,48,.42)");
          g.addColorStop(1, "rgba(90,35,8,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 32, 15, 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 1) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
          g.addColorStop(0, "rgba(255,255,240,.94)");
          g.addColorStop(0.55, "rgba(150,198,255,.40)");
          g.addColorStop(1, "rgba(70,120,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, 15, 0, Math.PI * 2);
          ctx.fill();
          for (let arm = 0; arm < 2; arm++) {
            ctx.strokeStyle = arm
              ? "rgba(120,180,255,.34)"
              : "rgba(255,180,95,.28)";
            ctx.lineWidth = 1.45;
            ctx.beginPath();
            for (let k = 0; k <= 68; k++) {
              const tt = (k / 68) * Math.PI * 2.75;
              const rr = 4.0 + tt * 7.4;
              const x = cx + Math.cos(tt + arm * Math.PI) * rr;
              const y = cy + Math.sin(tt + arm * Math.PI) * rr * 0.48;
              k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.stroke();
          }
        } else if (type === 2) {
          const g = ctx.createRadialGradient(cx - 7, cy + 4, 0, cx, cy, 34);
          g.addColorStop(0, "rgba(210,170,255,.82)");
          g.addColorStop(0.5, "rgba(100,130,255,.36)");
          g.addColorStop(1, "rgba(50,40,180,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, 34, 0, Math.PI * 2);
          ctx.fill();
          const g2 = ctx.createRadialGradient(
            cx + 12,
            cy - 8,
            0,
            cx + 12,
            cy - 8,
            12,
          );
          g2.addColorStop(0, "rgba(255,210,180,.52)");
          g2.addColorStop(1, "rgba(255,100,80,0)");
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(cx + 12, cy - 8, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = "rgba(165,230,255,.55)";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 31, 14, 0.38, 0, Math.PI * 2);
          ctx.stroke();
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
          g.addColorStop(0, "rgba(230,250,255,.58)");
          g.addColorStop(1, "rgba(90,190,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
      }

      const galCount = Math.max(12, Math.floor(58 * quality.galaxies));
      const galDummy = new THREE.Object3D();
      for (let type = 0; type < 4; type++) {
        const mat = new THREE.MeshBasicMaterial({
          map: galaxyTexture(type),
          transparent: true,
          opacity: qualityName === "eco" ? 0.46 : 0.62,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const inst = new THREE.InstancedMesh(
          new THREE.PlaneGeometry(1, 1),
          mat,
          galCount,
        );
        inst.frustumCulled = false;
        for (let i = 0; i < galCount; i++) {
          const size = 2.4 + Math.random() * 10.5;
          galDummy.position.set(
            (Math.random() - 0.5) * 960,
            (Math.random() - 0.5) * 520,
            -620 - Math.random() * 1900,
          );
          galDummy.rotation.z = Math.random() * Math.PI * 2;
          galDummy.scale.set(
            size * (0.62 + Math.random() * 0.75),
            size * (0.36 + Math.random() * 0.42),
            1,
          );
          galDummy.updateMatrix();
          inst.setMatrixAt(i, galDummy.matrix);
        }
        deepField.add(inst);
      }

      /* ── Lentes gravitacionais: arcos finos tipo SMACS/Abell ───── */
      function makeArc(
        radiusX,
        radiusY,
        start,
        end,
        z,
        color,
        opacity,
        offsetX,
        offsetY,
      ) {
        const curve = new THREE.EllipseCurve(
          offsetX,
          offsetY,
          radiusX,
          radiusY,
          start,
          end,
          false,
          0,
        );
        const points = curve.getPoints(96);
        const geo = new THREE.BufferGeometry().setFromPoints(
          points.map((p) => new THREE.Vector3(p.x, p.y, z)),
        );
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        return line;
      }

      const arcNum = Math.max(5, Math.floor(11 * quality.arcs));
      for (let i = 0; i < arcNum; i++) {
        const side = i % 2 ? -1 : 1;
        const arc = makeArc(
          150 + Math.random() * 250,
          40 + Math.random() * 120,
          Math.PI * (0.05 + Math.random() * 0.18),
          Math.PI * (0.56 + Math.random() * 0.42),
          -720 - Math.random() * 620,
          i % 3 === 0 ? "#ffd48a" : i % 3 === 1 ? "#7fd4ff" : "#b98cff",
          0.08 + Math.random() * 0.13,
          side * (60 + Math.random() * 170),
          -40 + Math.random() * 110,
        );
        arc.rotation.z = (Math.random() - 0.5) * 0.9;
        arcsRoot.add(arc);
      }

      /* ── Poeira orbital volumétrica em torno do conteúdo ───────── */
      function makeDust(total, colorA, colorB, radius, z, spread) {
        total = Math.max(1, Math.floor(total * quality.dust));
        const pos = new Float32Array(total * 3);
        const col = new Float32Array(total * 3);
        const cA = new THREE.Color(colorA);
        const cB = new THREE.Color(colorB);
        const c = new THREE.Color();
        for (let i = 0; i < total; i++) {
          const i3 = i * 3;
          const a = Math.random() * Math.PI * 2;
          const r = radius * (0.45 + Math.pow(Math.random(), 0.5) * 0.82);
          pos[i3] = Math.cos(a) * r + (Math.random() - 0.5) * spread;
          pos[i3 + 1] =
            Math.sin(a) * r * 0.3 + (Math.random() - 0.5) * spread * 0.28;
          pos[i3 + 2] =
            z + Math.sin(a * 1.7) * 45 + (Math.random() - 0.5) * spread;
          c.copy(cA)
            .lerp(cB, Math.random())
            .multiplyScalar(0.3 + Math.random() * 0.56);
          col[i3] = c.r;
          col[i3 + 1] = c.g;
          col[i3 + 2] = c.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
          size: qualityName === "eco" ? 1.2 : 1.65,
          sizeAttenuation: true,
          transparent: true,
          opacity: qualityName === "cinema" ? 0.38 : 0.28,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;
        return pts;
      }

      const dust1 = makeDust(760, "#2aa2f6", "#a960ee", 420, -180, 220);
      const dust2 = makeDust(600, "#ff9d37", "#ff3355", 560, -300, 260);
      const dust3 = makeDust(420, "#7fd4ff", "#ffffff", 320, 20, 150);
      dustRoot.add(dust1, dust2, dust3);

      /* ── Faróis JWST com 8 espinhos de difração ───────────────── */
      function makeBeacon(x, y, z, size, hex) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        const color = new THREE.Color(hex);
        group.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(size * 0.55, 16, 12),
            new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: 0.95,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          ),
        );
        group.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(size * 2.5, 16, 12),
            new THREE.MeshBasicMaterial({
              color,
              transparent: true,
              opacity: 0.11,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          ),
        );
        const axes = [0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4];
        axes.forEach((ang, idx) => {
          const len = size * (idx % 2 ? 22 : 34);
          const pts = [];
          for (let i = 0; i < 54; i++) {
            const t = (i / 53) * 2 - 1;
            pts.push(
              new THREE.Vector3(
                Math.cos(ang) * len * t,
                Math.sin(ang) * len * t,
                0,
              ),
            );
          }
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const mat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: idx % 2 ? 0.3 : 0.48,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          group.add(new THREE.Line(geo, mat));
        });
        return group;
      }

      const beaconData = [
        [-92, 84, -170, 1.7, "#cde9ff"],
        [116, -46, -230, 1.28, "#ffd7a4"],
        [56, 118, -390, 1.05, "#a9c5ff"],
        [-178, -82, -520, 0.92, "#fff3dd"],
        [198, 72, -760, 0.78, "#ffbd7a"],
      ];
      beaconData
        .slice(0, Math.max(2, Math.floor(beaconData.length * quality.beacons)))
        .forEach((b) => beaconRoot.add(makeBeacon(...b)));

      /* ── Anéis do observatório: identidade específica do perfil ─ */
      function makeOrbitRing(radius, tube, color, opacity, yScale, z) {
        const geo = new THREE.TorusGeometry(radius, tube, 8, 220);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.y = yScale;
        mesh.position.z = z;
        mesh.rotation.x = Math.PI / 2.35;
        return mesh;
      }

      const orbit1 = makeOrbitRing(
        300,
        0.36,
        "#2aa2f6",
        qualityName === "cinema" ? 0.22 : 0.14,
        0.32,
        -120,
      );
      const orbit2 = makeOrbitRing(
        430,
        0.28,
        "#a960ee",
        qualityName === "cinema" ? 0.16 : 0.1,
        0.27,
        -240,
      );
      const orbit3 = makeOrbitRing(
        580,
        0.18,
        "#ff9d37",
        qualityName === "eco" ? 0.06 : 0.1,
        0.22,
        -420,
      );
      root.add(orbit1, orbit2, orbit3);

      document.addEventListener("visibilitychange", () => {
        visible = !document.hidden;
      });

      window.addEventListener(
        "resize",
        () => {
          requestAnimationFrame(() => {
            vW = window.innerWidth;
            vH = window.innerHeight;
            camera.aspect = vW / vH;
            camera.updateProjectionMatrix();
            renderer.setSize(vW, vH);
            if (composer) composer.setSize(vW, vH);
            nebulaMaterial.uniforms.uResolution.value.set(vW, vH);
          });
        },
        { passive: true },
      );

      const clock = new THREE.Clock();

      function render(now) {
        requestAnimationFrame(render);
        if (!visible) return;
        if (now - lastFrame < frameInterval) return;
        lastFrame = now - ((now - lastFrame) % frameInterval);

        const t = clock.getElapsedTime();
        mouse.x += (mouse.tx - mouse.x) * 0.035;
        mouse.y += (mouse.ty - mouse.y) * 0.035;

        nebulaMaterial.uniforms.uTime.value = t;
        nebulaMaterial.uniforms.uMouse.value.set(mouse.x, -mouse.y);
        starLayers.forEach((layer, idx) => {
          layer.material.uniforms.uTime.value = t * (0.55 + idx * 0.32);
          layer.points.rotation.y = t * (0.006 + idx * 0.004) + mouse.x * 0.018;
          layer.points.rotation.x = -mouse.y * 0.01;
        });

        deepField.rotation.y = t * 0.0025;
        deepField.rotation.x = Math.sin(t * 0.09) * 0.006;

        arcsRoot.rotation.z = Math.sin(t * 0.065) * 0.025;
        arcsRoot.rotation.y = mouse.x * 0.018;

        dust1.rotation.z = t * 0.026;
        dust1.rotation.y = Math.sin(t * 0.16) * 0.045;
        dust2.rotation.z = -t * 0.018;
        dust3.rotation.y = t * 0.012;

        orbit1.rotation.z = t * 0.02;
        orbit2.rotation.z = -t * 0.014;
        orbit3.rotation.z = t * 0.01;

        beaconRoot.children.forEach((b, i) => {
          const pulse = 0.88 + Math.sin(t * 1.2 + i * 0.9) * 0.14;
          b.scale.setScalar(pulse);
          b.rotation.z = t * (0.03 + i * 0.004);
          for (let k = 2; k < b.children.length; k++) {
            if (b.children[k].material)
              b.children[k].material.opacity =
                (k % 2 ? 0.26 : 0.42) + Math.sin(t * 1.4 + k + i) * 0.08;
          }
        });

        const camFactor = quality.camera;
        camera.position.x +=
          (mouse.x * 34 * camFactor - camera.position.x) * 0.022;
        camera.position.y +=
          (-mouse.y * 20 * camFactor + 18 - camera.position.y) * 0.022;
        camera.position.z = 640 + Math.sin(t * 0.13) * 18 * camFactor;
        camera.lookAt(
          mouse.x * 24 * camFactor,
          -mouse.y * 15 * camFactor,
          -260,
        );

        if (bloomPass) {
          bloomPass.strength =
            quality.bloomStrength + Math.sin(t * 0.23) * 0.06;
        }

        composer ? composer.render() : renderer.render(scene, camera);
      }

      requestAnimationFrame(render);
    }

    setupJWSTCosmos();

    /* ═══════════════════════════════════════════════════════════════
       5. GSAP — ENTRADA CINEMATOGRÁFICA DA INTERFACE
    ═══════════════════════════════════════════════════════════════ */
    function setupUIAnimations() {
      const runFallback = () => {
        requestAnimationFrame(() => {
          document
            .querySelectorAll(".perfil-header, .nav-tabs, .form-card, .alert")
            .forEach((el, i) => {
              el.style.opacity = "0";
              el.style.transform = "translateY(22px)";
              setTimeout(
                () => {
                  el.style.transition = "opacity .8s ease, transform .8s ease";
                  el.style.opacity = "1";
                  el.style.transform = "translateY(0)";
                },
                90 + i * 110,
              );
            });
        });
      };

      if (typeof gsap === "undefined") {
        runFallback();
        return;
      }

      document.body.classList.add("perfil-gsap-ready");
      gsap.set(".perfil-header, .nav-tabs, .form-card, .alert", {
        opacity: 0,
        y: 28,
        filter: "blur(10px)",
        force3D: true,
      });
      gsap.set(".perfil-user-avatar", {
        opacity: 0,
        scale: 0.72,
        rotate: -8,
        force3D: true,
      });
      gsap.set(".perfil-user-details h2, .perfil-user-meta", {
        opacity: 0,
        y: 16,
        force3D: true,
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(
        ".perfil-header",
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.95 },
        0.1,
      )
        .to(
          ".perfil-user-avatar",
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: 0.86,
            ease: "back.out(1.9)",
          },
          0.22,
        )
        .to(
          ".perfil-user-details h2, .perfil-user-meta",
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.09 },
          0.34,
        )
        .to(
          ".nav-tabs",
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.72 },
          0.52,
        )
        .to(
          ".form-card, .alert",
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.78,
            stagger: 0.1,
          },
          0.7,
        );

      if (qualityName !== "eco") {
        gsap.to(".perfil-user-avatar", {
          y: -5,
          duration: 4.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.4,
        });
        gsap.to(".form-card", {
          y: -3,
          duration: 5.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 2.0,
        });
      }

      document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => {
        tab.addEventListener("shown.bs.tab", () => {
          if (typeof gsap === "undefined") return;
          const target = document.querySelector(
            tab.getAttribute("data-bs-target"),
          );
          if (!target) return;
          gsap.fromTo(
            target.querySelectorAll(".form-card, table tbody tr"),
            { opacity: 0, y: 18, filter: "blur(6px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.52,
              stagger: 0.045,
              ease: "power2.out",
            },
          );
        });
      });
    }

    setupUIAnimations();

    /* ═══════════════════════════════════════════════════════════════
       6. RIPPLE NOS BOTÕES
    ═══════════════════════════════════════════════════════════════ */
    document.querySelectorAll(".btn, .btn-glow, .nav-link").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement("span");
        ripple.className = "andromeda-ripple";
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        const oldPosition = getComputedStyle(this).position;
        if (oldPosition === "static") this.style.position = "relative";
        this.style.overflow = "hidden";
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });
    });
  });
})();
