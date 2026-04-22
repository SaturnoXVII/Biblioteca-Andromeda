/* ═══════════════════════════════════════════════════
   login.js — Avalon · Acesso
   Campo estelar Three.js + Bloom + Cursor magnético
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ────────────────────────────────────────────────
     1. THREE.JS — CAMPO ESTELAR NO #webgl
  ──────────────────────────────────────────────── */
  const container = document.getElementById("webgl");
  if (!container || typeof THREE === "undefined") return;

  const W = window.innerWidth;
  const H = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x020305, 1);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 2000);
  camera.position.z = 550;

  /* — Bloom se disponível — */
  let composer = null;
  if (
    typeof THREE.EffectComposer  !== "undefined" &&
    typeof THREE.RenderPass      !== "undefined" &&
    typeof THREE.UnrealBloomPass !== "undefined"
  ) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(
      new THREE.Vector2(W, H),
      1.0,   // strength — levemente mais forte no login
      0.55,
      0.50
    );
    composer.addPass(bloom);
  }

  /* — Estrelas — */
  const N = 2200;
  const pos   = new Float32Array(N * 3);
  const cols  = new Float32Array(N * 3);
  const sizes = new Float32Array(N);

  const palette = [
    new THREE.Color("#2aa2f6"),
    new THREE.Color("#e0f0ff"),
    new THREE.Color("#a960ee"),
    new THREE.Color("#ffffff"),
    new THREE.Color("#14599d"),
    new THREE.Color("#7fd4ff"),
  ];

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    pos[i3]     = (Math.random() - 0.5) * 2600;
    pos[i3 + 1] = (Math.random() - 0.5) * 2600;
    pos[i3 + 2] = (Math.random() - 0.5) * 1400;
    sizes[i] = Math.random() * 3 + 0.3;

    const c = palette[Math.floor(Math.random() * palette.length)];
    const b = 0.5 + Math.random() * 0.5;
    cols[i3]     = c.r * b;
    cols[i3 + 1] = c.g * b;
    cols[i3 + 2] = c.b * b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3));
  geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 2.4, sizeAttenuation: true,
    vertexColors: true, transparent: true, opacity: 0.92,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  /* — Nebulosas — */
  function nebula(color, ox, oy, oz, spread, n) {
    const g   = new THREE.BufferGeometry();
    const p   = new Float32Array(n * 3);
    const cl  = new Float32Array(n * 3);
    const col = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const r  = Math.random() * spread;
      const θ  = Math.random() * Math.PI * 2;
      const φ  = Math.acos(2 * Math.random() - 1);
      const i3 = i * 3;
      p[i3]     = ox + r * Math.sin(φ) * Math.cos(θ);
      p[i3 + 1] = oy + r * Math.sin(φ) * Math.sin(θ);
      p[i3 + 2] = oz + r * Math.cos(φ);
      const b   = 0.3 + Math.random() * 0.7;
      cl[i3]     = col.r * b;
      cl[i3 + 1] = col.g * b;
      cl[i3 + 2] = col.b * b;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(cl, 3));
    const m = new THREE.PointsMaterial({
      size: 2, sizeAttenuation: true,
      vertexColors: true, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    return new THREE.Points(g, m);
  }

  const neb1 = nebula("#2aa2f6",  350,  120, -280, 360, 800);
  const neb2 = nebula("#a960ee", -400, -180, -160, 300, 600);
  const neb3 = nebula("#14599d",    0,   60, -520, 380, 500);
  scene.add(neb1, neb2, neb3);

  /* — Mouse parallax — */
  let mx = 0, my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* — Resize — */
  window.addEventListener("resize", () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
  });

  /* — Loop — */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.0003;

    stars.rotation.y = t * 0.2 + mx * 0.03;
    stars.rotation.x = my * 0.016;
    neb1.rotation.y  = t * 0.16;
    neb1.rotation.z  = t * 0.07;
    neb2.rotation.y  = -t * 0.12;
    neb3.rotation.x  = t * 0.09;

    camera.position.x += (mx * 8 - camera.position.x) * 0.03;
    camera.position.y += (-my * 6 - camera.position.y) * 0.03;

    if (composer) composer.render();
    else renderer.render(scene, camera);
  })();

  /* ────────────────────────────────────────────────
     2. CURSOR MAGNÉTICO
  ──────────────────────────────────────────────── */
  const reticle    = document.getElementById("reticle");
  const reticleDot = document.getElementById("reticle-dot");
  if (!reticle) return;

  let rx = innerWidth / 2, ry = innerHeight / 2;
  let cx = rx, cy = ry;

  document.addEventListener("mousemove", (e) => { rx = e.clientX; ry = e.clientY; });
  document.addEventListener("mousedown", () => reticle.classList.add("click"));
  document.addEventListener("mouseup",   () => reticle.classList.remove("click"));

  document.querySelectorAll("a, button, input, select, label, .interactable").forEach((el) => {
    el.addEventListener("mouseenter", () => reticle.classList.add("hover"));
    el.addEventListener("mouseleave", () => reticle.classList.remove("hover"));
  });

  (function cursorLoop() {
    cx += (rx - cx) * 0.11;
    cy += (ry - cy) * 0.11;
    reticle.style.transform    = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
    reticleDot.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(cursorLoop);
  })();

  /* ────────────────────────────────────────────────
     3. REVEAL DO CARD
  ──────────────────────────────────────────────── */
  requestAnimationFrame(() => {
    const card = document.querySelector(".auth-card");
    if (card) setTimeout(() => card.classList.add("reveal"), 100);
  });

  /* ────────────────────────────────────────────────
     4. PASSWORD TOGGLE
  ──────────────────────────────────────────────── */
  document.querySelectorAll(".pass-toggle").forEach((btn) => {
    const inp = btn.closest(".pass-wrap")?.querySelector("input");
    if (!inp) return;
    btn.addEventListener("click", () => {
      const vis = inp.type === "password";
      inp.type  = vis ? "text" : "password";
      btn.innerHTML = vis
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
    });
  });

  /* ────────────────────────────────────────────────
     5. RIPPLE NO BTN-PRIM
  ──────────────────────────────────────────────── */
  document.querySelectorAll(".btn-prim").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position:absolute;border-radius:50%;background:rgba(255,255,255,.18);
        width:${size}px;height:${size}px;
        left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;
        transform:scale(0);animation:ripple .55s ease-out forwards;pointer-events:none;
      `;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  const ks = document.createElement("style");
  ks.textContent = "@keyframes ripple{to{transform:scale(2.8);opacity:0;}}";
  document.head.appendChild(ks);

  /* ────────────────────────────────────────────────
     6. FOCO AUTOMÁTICO NO CAMPO EMAIL
  ──────────────────────────────────────────────── */
  setTimeout(() => {
    const emailInput = document.querySelector("input[name='email']");
    if (emailInput) emailInput.focus({ preventScroll: true });
  }, 600);

})();