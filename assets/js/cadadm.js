/* ═══════════════════════════════════════════════════
   estrelas.js — Avalon / Azul Cósmico
   Campo estelar Three.js + cursor magnético + reveals
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ───────────────────────────────────────────────
     1. CAMPO ESTELAR — THREE.JS
  ─────────────────────────────────────────────── */
  const container = document.getElementById("estrelas");
  if (!container || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.z = 600;

  /* — estrelas estáticas — */
  const STAR_COUNT = 1800;
  const positions  = new Float32Array(STAR_COUNT * 3);
  const sizes      = new Float32Array(STAR_COUNT);
  const colors     = new Float32Array(STAR_COUNT * 3);

  const palette = [
    new THREE.Color("#2aa2f6"),
    new THREE.Color("#e0f0ff"),
    new THREE.Color("#a960ee"),
    new THREE.Color("#ffffff"),
    new THREE.Color("#14599d"),
  ];

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * 2200;
    positions[i3 + 1] = (Math.random() - 0.5) * 2200;
    positions[i3 + 2] = (Math.random() - 0.5) * 1200;
    sizes[i]          = Math.random() * 2.5 + 0.4;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));
  starGeo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));

  const starMat = new THREE.PointsMaterial({
    size:         2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity:     0.85,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* — nebulosas suaves como esferas de partículas — */
  function makeNebula(color, x, y, z, spread, count) {
    const geo  = new THREE.BufferGeometry();
    const pos  = new Float32Array(count * 3);
    const c    = new THREE.Color(color);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r  = Math.random() * spread;
      const θ  = Math.random() * Math.PI * 2;
      const φ  = Math.acos(2 * Math.random() - 1);
      pos[i3]     = x + r * Math.sin(φ) * Math.cos(θ);
      pos[i3 + 1] = y + r * Math.sin(φ) * Math.sin(θ);
      pos[i3 + 2] = z + r * Math.cos(φ);
      const bright = 0.5 + Math.random() * 0.5;
      cols[i3]     = c.r * bright;
      cols[i3 + 1] = c.g * bright;
      cols[i3 + 2] = c.b * bright;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size:         1.6,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity:     0.18,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    return new THREE.Points(geo, mat);
  }

  const neb1 = makeNebula("#2aa2f6",  400,  200, -200, 300, 600);
  const neb2 = makeNebula("#a960ee", -500, -300, -100, 280, 500);
  const neb3 = makeNebula("#14599d",   50,  100, -400, 320, 400);
  scene.add(neb1, neb2, neb3);

  /* — mouse parallax — */
  let mouseX = 0, mouseY = 0;
  document.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* — resize — */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* — loop — */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.0004;

    stars.rotation.y = t * 0.3 + mouseX * 0.04;
    stars.rotation.x = mouseY * 0.02;

    neb1.rotation.y = t * 0.2;
    neb1.rotation.z = t * 0.1;
    neb2.rotation.y = -t * 0.15;
    neb3.rotation.x = t * 0.12;

    camera.position.x += (mouseX * 8 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 6 - camera.position.y) * 0.04;

    renderer.render(scene, camera);
  }
  animate();

  /* ───────────────────────────────────────────────
     2. CURSOR MAGNÉTICO
  ─────────────────────────────────────────────── */
  const reticle    = document.getElementById("reticle");
  const reticleDot = document.getElementById("reticle-dot");
  if (!reticle || !reticleDot) return;

  let rX = window.innerWidth  / 2;
  let rY = window.innerHeight / 2;
  let cX = rX, cY = rY;

  document.addEventListener("mousemove", (e) => {
    rX = e.clientX;
    rY = e.clientY;
  });

  document.addEventListener("mousedown", () => reticle.classList.add("click"));
  document.addEventListener("mouseup",   () => reticle.classList.remove("click"));

  const hoverTargets = "a, button, input, select, label, .nivel-label, [data-hover]";

  function trackHover() {
    document.querySelectorAll(hoverTargets).forEach((el) => {
      el.addEventListener("mouseenter", () => reticle.classList.add("hover"));
      el.addEventListener("mouseleave", () => reticle.classList.remove("hover"));
    });
  }
  trackHover();

  (function loopCursor() {
    cX += (rX - cX) * 0.12;
    cY += (rY - cY) * 0.12;
    reticle.style.transform    = `translate3d(${cX}px, ${cY}px, 0) translate(-50%, -50%)`;
    reticleDot.style.transform = `translate3d(${rX}px, ${rY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loopCursor);
  })();

  /* ───────────────────────────────────────────────
     3. INTRO CINEMATOGRÁFICA
  ─────────────────────────────────────────────── */
  const intro = document.getElementById("intro-cinematic");
  if (intro) {
    const brand   = intro.querySelector(".intro-brand");
    const tagline = intro.querySelector(".intro-tagline");

    setTimeout(() => { brand   && brand.classList.add("reveal");   }, 200);
    setTimeout(() => { tagline && tagline.classList.add("reveal");  }, 700);
    setTimeout(() => { intro.classList.add("fade-out"); }, 2200);
    setTimeout(() => {
      intro.classList.add("gone");
      revealPage();
    }, 3000);
  } else {
    revealPage();
  }

  /* ───────────────────────────────────────────────
     4. REVEALS DE PÁGINA
  ─────────────────────────────────────────────── */
  function revealPage() {
    const h2       = document.querySelector("#Cadastro h2");
    const sub      = document.querySelector(".subtitulo");
    const card     = document.querySelector(".formulario.card");
    const loginLnk = document.querySelector(".login-link");

    if (h2)       setTimeout(() => h2.classList.add("reveal"),       100);
    if (sub)      setTimeout(() => sub.classList.add("reveal"),      250);
    if (card)     setTimeout(() => card.classList.add("reveal"),     400);
    if (loginLnk) setTimeout(() => loginLnk.classList.add("reveal"), 700);
  }

  /* ───────────────────────────────────────────────
     5. PASSWORD VISIBILITY TOGGLE
  ─────────────────────────────────────────────── */
  document.querySelectorAll(".pass-toggle").forEach((btn) => {
    const input = btn.closest(".pass-wrap")?.querySelector("input");
    if (!input) return;
    btn.addEventListener("click", () => {
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btn.innerHTML = isPass
        ? '<i class="bi bi-eye-slash"></i>'
        : '<i class="bi bi-eye"></i>';
    });
  });

  /* ───────────────────────────────────────────────
     6. RIPPLE NO BOTÃO SUBMIT
  ─────────────────────────────────────────────── */
  const submitBtn = document.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      const rect   = this.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size   = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute; border-radius:50%; background:rgba(255,255,255,0.2);
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top  - size/2}px;
        transform:scale(0); animation:rippleAnim 0.55s ease-out forwards;
        pointer-events:none;
      `;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /* inject ripple keyframe */
  const style = document.createElement("style");
  style.textContent = `@keyframes rippleAnim { to { transform:scale(2.5); opacity:0; } }`;
  document.head.appendChild(style);

  /* ───────────────────────────────────────────────
     7. SYNC HIDDEN SELECT COM NIVEL-CARDS
  ─────────────────────────────────────────────── */
  const radios      = document.querySelectorAll(".nivel-card input[type='radio']");
  const hiddenSelect = document.querySelector("select[name='nivel_acesso']");

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (hiddenSelect) hiddenSelect.value = radio.value;
    });
  });

})();