/* ═══════════════════════════════════════════════════════════════════
   cadadm.js — Andrômeda · Cadastro de Administradores
   Mesmo modelo visual do cadleitores/login:
   Cosmos cinematográfico Three.js + Eco Mode + Cursor otimizado + Reveals
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    /* ═══════════════════════════════════════════════════════════════
       0. PERFIS DE QUALIDADE — IGUAL AO CADLEITORES
    ═══════════════════════════════════════════════════════════════ */
    const QUALITY_KEY = "andromeda-quality";

    const QUALITY_PROFILES = {
      cinema: {
        label: "Cinema",
        next: "Equilíbrio",
        dpr: 1.75,
        fps: 60,
        antialias: false,
        stars: 3200,
        nearStars: 900,
        clouds: 1800,
        distantGalaxies: 72,
        bloom: true,
        bloomStrength: 1.18,
        bloomRadius: 0.48,
        bloomThreshold: 0.08,
        nebulaIntensity: 1.0,
        motion: 1.0,
      },
      equilibrio: {
        label: "Equilíbrio",
        next: "Eco",
        dpr: 1.28,
        fps: 45,
        antialias: false,
        stars: 2200,
        nearStars: 560,
        clouds: 1100,
        distantGalaxies: 42,
        bloom: true,
        bloomStrength: 0.82,
        bloomRadius: 0.42,
        bloomThreshold: 0.12,
        nebulaIntensity: 0.88,
        motion: 0.78,
      },
      eco: {
        label: "Eco",
        next: "Cinema",
        dpr: 1.0,
        fps: 30,
        antialias: false,
        stars: 1350,
        nearStars: 280,
        clouds: 620,
        distantGalaxies: 18,
        bloom: true,
        bloomStrength: 0.42,
        bloomRadius: 0.30,
        bloomThreshold: 0.20,
        nebulaIntensity: 0.72,
        motion: 0.58,
      },
    };

    function normalizeQuality(value) {
      if (!value) return null;
      const v = String(value).toLowerCase().trim();
      if (["cinema", "cinematic", "cinematico", "cinemático"].includes(v)) return "cinema";
      if (["equilibrio", "equilíbrio", "balanced", "medio", "médio"].includes(v)) return "equilibrio";
      if (["eco", "low", "leve"].includes(v)) return "eco";
      return null;
    }

    function detectQuality() {
      const forced = normalizeQuality(document.documentElement.dataset.andromedaQuality || document.body?.dataset?.andromedaQuality);
      if (forced) return forced;

      const saved = normalizeQuality(localStorage.getItem(QUALITY_KEY));
      if (saved) return saved;

      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const mobile = window.innerWidth < 768 || matchMedia?.("(pointer: coarse)")?.matches;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;

      if (reducedMotion || mobile || cores <= 4 || memory <= 4) return "eco";
      if (cores <= 6 || memory <= 6) return "equilibrio";
      return "cinema";
    }

    let QUALITY_NAME = detectQuality();
    let QUALITY = QUALITY_PROFILES[QUALITY_NAME];
    document.documentElement.dataset.andromedaQuality = QUALITY_NAME;

    function injectQualityButton() {
      if (document.getElementById("andromeda-quality-toggle")) return;

      const style = document.createElement("style");
      style.textContent = `
        .andromeda-quality-toggle{
          position:fixed;
          right:18px;
          bottom:18px;
          z-index:80;
          display:inline-flex;
          align-items:center;
          gap:.46rem;
          height:34px;
          padding:0 .78rem;
          border:1px solid rgba(224,240,255,.18);
          border-radius:999px;
          background:rgba(2,6,14,.42);
          color:#e0f0ff;
          font-family:"Space Mono",monospace;
          font-size:.66rem;
          letter-spacing:.08em;
          text-transform:uppercase;
          backdrop-filter:blur(14px) saturate(130%);
          -webkit-backdrop-filter:blur(14px) saturate(130%);
          box-shadow:0 0 18px rgba(42,162,246,.10), inset 0 0 14px rgba(42,162,246,.045);
          cursor:pointer;
          opacity:.74;
          transform:translateZ(0);
          transition:opacity .25s ease, border-color .25s ease, box-shadow .25s ease, background .25s ease, transform .25s ease;
        }
        .andromeda-quality-toggle::before{
          content:"";
          width:6px;
          height:6px;
          border-radius:50%;
          background:#2aa2f6;
          box-shadow:0 0 10px rgba(42,162,246,.9);
        }
        .andromeda-quality-toggle[data-mode="eco"]::before{background:#7fd4ff;box-shadow:0 0 8px rgba(127,212,255,.8)}
        .andromeda-quality-toggle[data-mode="equilibrio"]::before{background:#a960ee;box-shadow:0 0 9px rgba(169,96,238,.78)}
        .andromeda-quality-toggle:hover{
          opacity:1;
          transform:translateY(-1px) translateZ(0);
          border-color:rgba(42,162,246,.38);
          background:rgba(3,10,22,.62);
          box-shadow:0 0 26px rgba(42,162,246,.18), inset 0 0 18px rgba(169,96,238,.07);
        }
        .andromeda-quality-toggle .quality-next{
          display:none;
          color:rgba(224,240,255,.48);
          letter-spacing:.05em;
          margin-left:.15rem;
        }
        .andromeda-quality-toggle:hover .quality-next{display:inline;}
        @media (max-width: 768px){
          .andromeda-quality-toggle{right:12px;bottom:12px;height:31px;padding:0 .64rem;font-size:.58rem;}
        }
      `;
      document.head.appendChild(style);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "andromeda-quality-toggle";
      btn.className = "andromeda-quality-toggle interactable";
      btn.dataset.mode = QUALITY_NAME;
      btn.setAttribute("aria-label", `Modo visual atual: ${QUALITY.label}. Clique para trocar para ${QUALITY.next}.`);
      btn.innerHTML = `<span class="quality-current">${QUALITY.label}</span><span class="quality-next">trocar</span>`;

      btn.addEventListener("click", () => {
        const order = ["cinema", "equilibrio", "eco"];
        const next = order[(order.indexOf(QUALITY_NAME) + 1) % order.length];
        localStorage.setItem(QUALITY_KEY, next);
        document.documentElement.dataset.andromedaQuality = next;
        window.location.reload();
      });

      document.body.appendChild(btn);
    }

    injectQualityButton();

    /* ═══════════════════════════════════════════════════════════════
       1. BACKGROUND — MESMO PADRÃO DO CADLEITORES
    ═══════════════════════════════════════════════════════════════ */
    function initCosmicBackground() {
      const container = document.getElementById("webgl") || document.getElementById("estrelas");
      if (!container || typeof THREE === "undefined") return;

      let vW = window.innerWidth;
      let vH = window.innerHeight;
      const DPR = Math.min(window.devicePixelRatio || 1, QUALITY.dpr);

      const renderer = new THREE.WebGLRenderer({
        antialias: QUALITY.antialias,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(DPR);
      renderer.setSize(vW, vH);
      renderer.setClearColor(0x020305, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping || THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = QUALITY_NAME === "cinema" ? 1.16 : QUALITY_NAME === "equilibrio" ? 1.04 : 0.96;
      if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      else if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;

      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(54, vW / vH, 0.1, 5000);
      camera.position.set(0, 0, 136);

      const root = new THREE.Group();
      scene.add(root);

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

      const VS_QUAD = `
        void main(){
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `;

      const FS_NEBULA = `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uIntensity;

        vec2 hash2(vec2 p){
          p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }
        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f*f*(3.0-2.0*f);
          return mix(
            mix(dot(hash2(i+vec2(0.0,0.0)), f-vec2(0.0,0.0)), dot(hash2(i+vec2(1.0,0.0)), f-vec2(1.0,0.0)), u.x),
            mix(dot(hash2(i+vec2(0.0,1.0)), f-vec2(0.0,1.0)), dot(hash2(i+vec2(1.0,1.0)), f-vec2(1.0,1.0)), u.x),
            u.y
          );
        }
        float fbm(vec2 p){
          float v = 0.0;
          float a = 0.52;
          mat2 r = mat2(0.866, 0.5, -0.5, 0.866);
          for(int i=0;i<5;i++){
            v += a * noise(p);
            p = r * p * 2.06;
            a *= 0.52;
          }
          return v;
        }
        float fbmLow(vec2 p){
          float v = 0.0;
          float a = 0.55;
          mat2 r = mat2(0.866, 0.5, -0.5, 0.866);
          for(int i=0;i<4;i++){
            v += a * noise(p);
            p = r * p * 2.02;
            a *= 0.52;
          }
          return v;
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / uResolution.xy;
          float ar = uResolution.x / uResolution.y;
          vec2 p = (uv - 0.5) * vec2(ar, 1.0) * 2.15;
          p += uMouse * 0.042;

          float t = uTime * 0.034;
          vec2 q = vec2(fbm(p + vec2(t, 0.0)), fbm(p + vec2(5.2, 1.3)));
          vec2 r = vec2(
            fbm(p + 4.0*q + vec2(1.7, 9.2) + t * 0.42),
            fbm(p + 4.0*q + vec2(8.3, 2.8) + t * 0.36)
          );
          float f = fbm(p + 4.35*r);
          float g = fbmLow(p * 1.8 + r * 2.2 + vec2(0.0, t * 0.35));

          vec3 cVoid = vec3(0.002, 0.010, 0.026);
          vec3 cBlue = vec3(0.015, 0.24, 0.68);
          vec3 cCyan = vec3(0.015, 0.66, 0.78);
          vec3 cPurple = vec3(0.30, 0.06, 0.62);
          vec3 cRose = vec3(0.76, 0.18, 0.42);
          vec3 cAmber = vec3(0.92, 0.38, 0.06);
          vec3 cGold = vec3(1.0, 0.68, 0.16);

          vec3 col = cVoid;
          col = mix(col, cBlue, smoothstep(-0.12, 0.42, f) * 0.62 * uIntensity);
          col = mix(col, cPurple, smoothstep(0.16, 0.58, g) * 0.38 * uIntensity);
          col += cCyan * smoothstep(0.44, 0.72, g) * 0.34 * uIntensity;
          col += cRose * smoothstep(0.54, 0.82, f) * 0.24 * uIntensity;
          col += cAmber * smoothstep(0.64, 0.90, f) * smoothstep(0.50, 0.78, g) * 0.38 * uIntensity;
          col += cGold * smoothstep(0.76, 0.96, f) * 0.28 * uIntensity;

          float center = 1.0 - length(p * vec2(0.56, 0.74));
          col += max(0.0, center) * vec3(0.008, 0.025, 0.075) * 0.55;

          float breath = fbmLow(p * 0.48 + vec2(0.0, t * 0.18));
          col *= 0.92 + breath * 0.10;

          float vign = length((uv - 0.5) * vec2(1.0, 1.25));
          col *= 1.0 - smoothstep(0.34, 1.08, vign) * 0.76;
          gl_FragColor = vec4(pow(max(col, 0.0), vec3(0.88)), 1.0);
        }
      `;

      const nebulaMat = new THREE.ShaderMaterial({
        vertexShader: VS_QUAD,
        fragmentShader: FS_NEBULA,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(vW, vH) },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uIntensity: { value: QUALITY.nebulaIntensity },
        },
        depthTest: false,
        depthWrite: false,
      });

      const nebulaMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), nebulaMat);
      nebulaMesh.frustumCulled = false;
      nebulaMesh.renderOrder = -100;
      scene.add(nebulaMesh);

      const spectral = [
        { color: new THREE.Color("#9bb4ff"), weight: 0.012, size: 1.55 },
        { color: new THREE.Color("#b9ccff"), weight: 0.040, size: 1.35 },
        { color: new THREE.Color("#dceaff"), weight: 0.085, size: 1.10 },
        { color: new THREE.Color("#f8f4ff"), weight: 0.130, size: 0.96 },
        { color: new THREE.Color("#fff3d5"), weight: 0.180, size: 0.92 },
        { color: new THREE.Color("#ffd2a0"), weight: 0.250, size: 0.90 },
        { color: new THREE.Color("#ffb36e"), weight: 0.303, size: 0.84 },
      ];

      function pickSpectral() {
        let acc = 0;
        const r = Math.random();
        for (const s of spectral) {
          acc += s.weight;
          if (r <= acc) return s;
        }
        return spectral[spectral.length - 1];
      }

      function buildStarField(count, radius, zOffset, scaleMul, opacity) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const size = new Float32Array(count);
        const seed = new Float32Array(count);

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.pow(Math.random(), 0.62) * radius;
          const s = pickSpectral();
          const bright = 0.58 + Math.random() * 0.72;

          pos[i3] = Math.sin(phi) * Math.cos(theta) * r;
          pos[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.58;
          pos[i3 + 2] = Math.cos(phi) * r + zOffset;

          col[i3] = s.color.r * bright;
          col[i3 + 1] = s.color.g * bright;
          col[i3 + 2] = s.color.b * bright;
          size[i] = s.size * scaleMul * (0.65 + Math.pow(Math.random(), 2.0) * 1.4);
          seed[i] = Math.random() * Math.PI * 2;
        }

        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
        geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

        const mat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
          uniforms: {
            uTime: { value: 0 },
            uOpacity: { value: opacity },
          },
          vertexShader: `
            attribute float aSize;
            attribute float aSeed;
            uniform float uTime;
            varying vec3 vColor;
            varying float vAlpha;
            void main(){
              vColor = color;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              float twinkle = 0.82 + 0.18 * sin(uTime * (1.4 + aSeed * 0.2) + aSeed * 4.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = clamp((120.0 / -mv.z) * aSize * twinkle, 0.7, 18.0);
              vAlpha = twinkle;
            }
          `,
          fragmentShader: `
            precision highp float;
            uniform float uOpacity;
            varying vec3 vColor;
            varying float vAlpha;
            void main(){
              vec2 p = gl_PointCoord - 0.5;
              float d = dot(p, p) * 4.0;
              if(d > 1.0) discard;
              float core = exp(-d * 5.5);
              float halo = exp(-d * 1.65) * 0.28;
              float a = (core + halo) * uOpacity * vAlpha;
              gl_FragColor = vec4(vColor * a * 1.35, a);
            }
          `,
        });

        return { points: new THREE.Points(geo, mat), mat };
      }

      const farStars = buildStarField(QUALITY.stars, 1850, -720, 1.0, QUALITY_NAME === "eco" ? 0.72 : 0.88);
      const nearStars = buildStarField(QUALITY.nearStars, 680, -80, 2.1, QUALITY_NAME === "eco" ? 0.70 : 0.92);
      root.add(farStars.points, nearStars.points);

      function buildCloud(count, colorA, colorB, center, spread, pointSize, opacity) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const c1 = new THREE.Color(colorA);
        const c2 = new THREE.Color(colorB);
        const c = new THREE.Color();

        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.pow(Math.random(), 0.55) * spread;
          pos[i3] = center.x + Math.sin(phi) * Math.cos(theta) * r;
          pos[i3 + 1] = center.y + Math.sin(phi) * Math.sin(theta) * r * 0.52;
          pos[i3 + 2] = center.z + Math.cos(phi) * r;

          c.copy(c1).lerp(c2, Math.random());
          const b = 0.34 + Math.random() * 0.58;
          col[i3] = c.r * b;
          col[i3 + 1] = c.g * b;
          col[i3 + 2] = c.b * b;
        }

        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
          size: pointSize,
          sizeAttenuation: true,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
          depthWrite: false,
        });
        return new THREE.Points(geo, mat);
      }

      const cloudA = buildCloud(Math.floor(QUALITY.clouds * 0.42), "#003f88", "#00d5ff", new THREE.Vector3(260, 80, -310), 260, 1.9, QUALITY_NAME === "eco" ? 0.22 : 0.30);
      const cloudB = buildCloud(Math.floor(QUALITY.clouds * 0.34), "#350070", "#a960ee", new THREE.Vector3(-330, -120, -230), 240, 1.8, QUALITY_NAME === "eco" ? 0.18 : 0.26);
      const cloudC = buildCloud(Math.floor(QUALITY.clouds * 0.24), "#64131c", "#ff7a2e", new THREE.Vector3(20, -20, -470), 300, 1.7, QUALITY_NAME === "eco" ? 0.16 : 0.24);
      root.add(cloudA, cloudB, cloudC);

      function makeGalaxyTexture(type) {
        const C = document.createElement("canvas");
        C.width = C.height = 64;
        const ctx = C.getContext("2d");
        const cx = 32;
        const cy = 32;

        if (type === 0) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 25);
          g.addColorStop(0, "rgba(255,235,185,.90)");
          g.addColorStop(0.45, "rgba(224,145,48,.34)");
          g.addColorStop(1, "rgba(80,40,8,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 23, 12, 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
          g.addColorStop(0, "rgba(230,245,255,.9)");
          g.addColorStop(0.55, "rgba(110,170,255,.35)");
          g.addColorStop(1, "rgba(40,80,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(150,200,255,.40)";
          ctx.lineWidth = 1.2;
          for (let a = 0; a < 2; a++) {
            ctx.beginPath();
            for (let k = 0; k < 48; k++) {
              const t = (k / 48) * Math.PI * 2.3;
              const r = 4 + t * 7.2;
              const x = cx + Math.cos(t + a * Math.PI) * r;
              const y = cy + Math.sin(t + a * Math.PI) * r * 0.48;
              if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
        return new THREE.CanvasTexture(C);
      }

      const galaxyDummy = new THREE.Object3D();
      for (let t = 0; t < 2; t++) {
        const each = Math.ceil(QUALITY.distantGalaxies / 2);
        const mat = new THREE.MeshBasicMaterial({
          map: makeGalaxyTexture(t),
          transparent: true,
          opacity: QUALITY_NAME === "eco" ? 0.38 : 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const inst = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, each);
        inst.frustumCulled = false;
        for (let i = 0; i < each; i++) {
          const s = 2.2 + Math.random() * 8.5;
          galaxyDummy.scale.set(s * (0.6 + Math.random() * 0.8), s * (0.32 + Math.random() * 0.45), 1);
          galaxyDummy.position.set((Math.random() - 0.5) * 760, (Math.random() - 0.5) * 380, -520 - Math.random() * 1350);
          galaxyDummy.rotation.z = Math.random() * Math.PI * 2;
          galaxyDummy.updateMatrix();
          inst.setMatrixAt(i, galaxyDummy.matrix);
        }
        root.add(inst);
      }

      const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
      window.addEventListener("pointermove", (e) => {
        mouse.tx = (e.clientX / vW - 0.5) * 2;
        mouse.ty = (e.clientY / vH - 0.5) * 2;
      }, { passive: true });

      let pageVisible = true;
      document.addEventListener("visibilitychange", () => {
        pageVisible = !document.hidden;
      });

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

      const clock = new THREE.Clock();
      let lastFrame = 0;
      const frameInterval = 1000 / QUALITY.fps;

      function animate(now) {
        requestAnimationFrame(animate);
        if (!pageVisible) return;
        if (now - lastFrame < frameInterval) return;
        lastFrame = now - ((now - lastFrame) % frameInterval);

        const time = clock.getElapsedTime();
        const m = QUALITY.motion;

        mouse.x += (mouse.tx - mouse.x) * 0.045;
        mouse.y += (mouse.ty - mouse.y) * 0.045;

        nebulaMat.uniforms.uTime.value = time;
        nebulaMat.uniforms.uMouse.value.set(mouse.x, -mouse.y);
        farStars.mat.uniforms.uTime.value = time * 0.85;
        nearStars.mat.uniforms.uTime.value = time * 1.15;

        root.rotation.y = time * 0.012 * m + mouse.x * 0.068;
        root.rotation.x = mouse.y * 0.034 + Math.sin(time * 0.16) * 0.010 * m;

        cloudA.rotation.y = time * 0.010 * m;
        cloudA.rotation.z = Math.sin(time * 0.08) * 0.030 * m;
        cloudB.rotation.y = -time * 0.008 * m;
        cloudC.rotation.x = Math.sin(time * 0.10) * 0.026 * m;

        camera.position.x += (mouse.x * 13 - camera.position.x) * 0.025;
        camera.position.y += (-mouse.y * 8 - camera.position.y) * 0.025;
        camera.position.z = 136 + Math.sin(time * 0.18) * 6 * m;
        camera.lookAt(mouse.x * 18, -mouse.y * 10, -120);

        if (bloomPass) {
          bloomPass.strength = QUALITY.bloomStrength + Math.sin(time * 0.28) * (QUALITY_NAME === "cinema" ? 0.10 : 0.04);
        }

        composer ? composer.render() : renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    }

    initCosmicBackground();

    /* ═══════════════════════════════════════════════════════════════
       2. CURSOR MAGNÉTICO — OTIMIZADO IGUAL AO CADLEITORES
    ═══════════════════════════════════════════════════════════════ */
    function initMagneticCursor() {
      const reticle = document.getElementById("reticle");
      const reticleDot = document.getElementById("reticle-dot");
      const isTouch = matchMedia?.("(pointer: coarse)")?.matches;
      if (!reticle || !reticleDot || isTouch) {
        if (reticle) reticle.style.display = "none";
        if (reticleDot) reticleDot.style.display = "none";
        return;
      }

      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let cursorX = targetX;
      let cursorY = targetY;
      let hover = false;
      let visible = true;

      const hoverSelector = "a, button, input, select, textarea, label, .nivel-label, .nivel-card, .interactable, [data-hover]";

      document.addEventListener("pointermove", (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      }, { passive: true });

      document.addEventListener("pointerdown", () => reticle.classList.add("click"));
      document.addEventListener("pointerup", () => reticle.classList.remove("click"));

      document.addEventListener("pointerover", (e) => {
        if (e.target.closest?.(hoverSelector)) {
          hover = true;
          reticle.classList.add("hover");
        }
      });

      document.addEventListener("pointerout", (e) => {
        if (e.target.closest?.(hoverSelector)) {
          hover = false;
          reticle.classList.remove("hover");
        }
      });

      document.addEventListener("visibilitychange", () => {
        visible = !document.hidden;
      });

      function loop() {
        requestAnimationFrame(loop);
        if (!visible) return;
        const speed = hover ? 0.34 : 0.22;
        cursorX += (targetX - cursorX) * speed;
        cursorY += (targetY - cursorY) * speed;
        reticle.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
        reticleDot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(loop);
    }

    initMagneticCursor();

    /* ═══════════════════════════════════════════════════════════════
       3. INTRO E REVEALS — GSAP SE EXISTIR, FALLBACK SE NÃO EXISTIR
    ═══════════════════════════════════════════════════════════════ */
    function revealPage() {
      const h2 = document.querySelector("#Cadastro h2, .auth-brand");
      const sub = document.querySelector(".subtitulo, .auth-subtitle");
      const card = document.querySelector(".formulario.card, .auth-card");
      const loginLnk = document.querySelector(".login-link, .auth-links");
      const groups = document.querySelectorAll(".form-group, .nivel-card, .btn-prim, button[type='submit']");

      if (typeof gsap !== "undefined") {
        gsap.set([h2, sub, card, loginLnk].filter(Boolean), { willChange: "transform, opacity, filter" });
        if (h2) gsap.fromTo(h2, { opacity: 0, y: 28, filter: "blur(14px)", scaleX: 0.92 }, { opacity: 1, y: 0, filter: "blur(0px)", scaleX: 1, duration: 1.25, ease: "expo.out" });
        if (sub) gsap.fromTo(sub, { opacity: 0, letterSpacing: "0.42em" }, { opacity: 1, letterSpacing: "0.18em", duration: 1.0, ease: "expo.out", delay: 0.18 });
        if (card) gsap.fromTo(card, { opacity: 0, y: 30, scale: 0.965, filter: "blur(10px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.05, ease: "power3.out", delay: 0.28 });
        if (groups.length) gsap.fromTo(groups, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.58, stagger: 0.055, ease: "power2.out", delay: 0.62 });
        if (loginLnk) gsap.fromTo(loginLnk, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", delay: 0.82 });
      } else {
        if (h2) setTimeout(() => h2.classList.add("reveal"), 100);
        if (sub) setTimeout(() => sub.classList.add("reveal"), 250);
        if (card) setTimeout(() => card.classList.add("reveal"), 400);
        if (loginLnk) setTimeout(() => loginLnk.classList.add("reveal"), 700);
      }
    }

    const intro = document.getElementById("intro-cinematic");
    if (intro) {
      const brand = intro.querySelector(".intro-brand");
      const tagline = intro.querySelector(".intro-tagline");

      if (typeof gsap !== "undefined") {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.fromTo(brand, { opacity: 0, y: 20, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.05 }, 0.1)
          .fromTo(tagline, { opacity: 0, y: 12, letterSpacing: "0.32em" }, { opacity: 1, y: 0, letterSpacing: "0.16em", duration: 0.85 }, 0.42)
          .to(intro, { opacity: 0, filter: "blur(18px)", duration: 0.82, ease: "power2.inOut", delay: 0.82 })
          .add(() => {
            intro.classList.add("gone");
            revealPage();
          });
      } else {
        setTimeout(() => { if (brand) brand.classList.add("reveal"); }, 200);
        setTimeout(() => { if (tagline) tagline.classList.add("reveal"); }, 700);
        setTimeout(() => { intro.classList.add("fade-out"); }, 2200);
        setTimeout(() => {
          intro.classList.add("gone");
          revealPage();
        }, 3000);
      }
    } else {
      revealPage();
    }

    /* ═══════════════════════════════════════════════════════════════
       4. PASSWORD VISIBILITY TOGGLE
    ═══════════════════════════════════════════════════════════════ */
    document.querySelectorAll(".pass-toggle").forEach((btn) => {
      const input = btn.closest(".pass-wrap")?.querySelector("input");
      if (!input) return;
      btn.addEventListener("click", () => {
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        btn.innerHTML = isPass
          ? '<i class="bi bi-eye-slash"></i><i class="fa-solid fa-eye-slash"></i>'
          : '<i class="bi bi-eye"></i><i class="fa-solid fa-eye"></i>';
      });
    });

    /* ═══════════════════════════════════════════════════════════════
       5. RIPPLE NO BOTÃO SUBMIT
    ═══════════════════════════════════════════════════════════════ */
    document.querySelectorAll("button[type='submit'], .btn-prim").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement("span");
        ripple.style.cssText = `
          position:absolute;
          border-radius:50%;
          background:rgba(255,255,255,.16);
          width:${size}px;
          height:${size}px;
          left:${e.clientX - rect.left - size / 2}px;
          top:${e.clientY - rect.top - size / 2}px;
          transform:scale(0);
          animation:andromedaAdminRipple .62s ease-out forwards;
          pointer-events:none;
        `;
        this.style.position = this.style.position || "relative";
        this.style.overflow = this.style.overflow || "hidden";
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 680);
      });
    });

    const rippleStyle = document.createElement("style");
    rippleStyle.textContent = `@keyframes andromedaAdminRipple{to{transform:scale(2.75);opacity:0;}}`;
    document.head.appendChild(rippleStyle);

    /* ═══════════════════════════════════════════════════════════════
       6. SYNC HIDDEN SELECT COM NIVEL-CARDS
    ═══════════════════════════════════════════════════════════════ */
    const radios = document.querySelectorAll(".nivel-card input[type='radio']");
    const hiddenSelect = document.querySelector("select[name='nivel_acesso']");

    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (hiddenSelect) hiddenSelect.value = radio.value;
      });
    });
  });
})();
