/* ═══════════════════════════════════════════════════════════════
           1. INTRO CINEMATOGRÁFICA (GSAP)
        ═══════════════════════════════════════════════════════════════ */
const INTRO_DUR = 4.8;
const tl = gsap.timeline();
tl.to("#i-brand", {
  y: 0,
  opacity: 1,
  duration: 1.5,
  ease: "power4.out",
  delay: 0.3,
})
  .to(
    "#i-brand",
    {
      letterSpacing: "0.3em",
      duration: 2.5,
      ease: "power2.out",
    },
    "-=1",
  )
  .to(
    "#i-tag",
    {
      opacity: 1,
      y: -10,
      duration: 1,
      ease: "power2.out",
    },
    "-=2",
  )
  .to("#intro-cinematic", {
    opacity: 0,
    duration: 1,
    ease: "power2.inOut",
    delay: 0.5,
    onComplete: () => {
      document.getElementById("intro-cinematic").style.display = "none";
    },
  });

/* ═══════════════════════════════════════════════════════════════
           2. UTILITÁRIOS & ARTE GERATIVA
        ═══════════════════════════════════════════════════════════════ */
function hexToRgb(h) {
  return {
    r: (h >> 16) & 255,
    g: (h >> 8) & 255,
    b: h & 255,
  };
}

function statusClass(s) {
  const n = (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (n.includes("disp")) return "s-disp";
  if (n.includes("empr")) return "s-empr";
  if (n.includes("res")) return "s-res";
  return "s-unk";
}

function hashString(str) {
  let h = 0;
  for (const c of str || "") h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function lerpNum(a, b, t) {
  return a + (b - a) * t;
}

function lerpTriplet(a, b, t) {
  return [
    lerpNum(a[0], b[0], t),
    lerpNum(a[1], b[1], t),
    lerpNum(a[2], b[2], t),
  ];
}

function arrayToHex(arr) {
  return (
    (Math.max(0, Math.min(255, Math.round(arr[0] * 255))) << 16) |
    (Math.max(0, Math.min(255, Math.round(arr[1] * 255))) << 8) |
    Math.max(0, Math.min(255, Math.round(arr[2] * 255)))
  );
}

function mixHexColors(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return (
    (Math.round(lerpNum(ca.r, cb.r, t)) << 16) |
    (Math.round(lerpNum(ca.g, cb.g, t)) << 8) |
    Math.round(lerpNum(ca.b, cb.b, t))
  );
}

const STELLAR_CLASSES = {
  O: [0.61, 0.72, 1.0],
  B: [0.70, 0.80, 1.0],
  A: [0.92, 0.95, 1.0],
  F: [1.0, 0.98, 0.92],
  G: [1.0, 0.93, 0.68],
  K: [1.0, 0.77, 0.47],
  M: [1.0, 0.56, 0.38],
};

const SCIENTIFIC_SYSTEM_PALETTE = [
  arrayToHex(STELLAR_CLASSES.O),
  arrayToHex(STELLAR_CLASSES.B),
  arrayToHex(STELLAR_CLASSES.A),
  arrayToHex(STELLAR_CLASSES.F),
  arrayToHex(STELLAR_CLASSES.G),
  arrayToHex(STELLAR_CLASSES.K),
  arrayToHex(STELLAR_CLASSES.M),
  0x63c5ff,
  0x8bd9ff,
  0xffd37a,
  0xffb06b,
  0xff8f73,
  0xc59cff,
  0x7fe6d5,
];

const PALETTE = SCIENTIFIC_SYSTEM_PALETTE;

const STATUS_ACCENTS = {
  disponivel: 0x61d8ff,
  emprestado: 0xff5e7d,
  reservado: 0xb787ff,
  neutro: 0x8ea6ff,
};

function catColor(n) {
  if (!n) return PALETTE[0];
  return PALETTE[hashString(n) % PALETTE.length];
}

function getSystemPalette(name) {
  const seed = hashString(name);
  const core = SCIENTIFIC_SYSTEM_PALETTE[seed % SCIENTIFIC_SYSTEM_PALETTE.length];
  const halo = SCIENTIFIC_SYSTEM_PALETTE[(seed + 3) % SCIENTIFIC_SYSTEM_PALETTE.length];
  const nebula = mixHexColors(core, halo, 0.45);
  return { core, halo, nebula };
}

function catHexStr(n) {
  return "#" + catColor(n).toString(16).padStart(6, "0");
}

function drawBookArt(canvas, title, category, w, h) {
  if (!canvas) return;
  canvas.width = w || canvas.clientWidth || 300;
  canvas.height = h || canvas.clientHeight || 200;
  const ctx = canvas.getContext("2d"),
    W = canvas.width,
    H = canvas.height;

  let seed = 0;
  for (const c of title || "X")
    seed = ((seed << 5) - seed + c.charCodeAt(0)) | 0;
  const rnd = (() => {
    let s = Math.abs(seed);
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  })();

  const col = catColor(category);
  const { r: cr, g: cg, b: cb } = hexToRgb(col);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(
    0,
    `rgb(${Math.round(cr * 0.25)},${Math.round(cg * 0.2)},${Math.round(cb * 0.3)})`,
  );
  bg.addColorStop(
    0.5,
    `rgb(${Math.round(cr * 0.1)},${Math.round(cg * 0.1)},${Math.round(cb * 0.15)})`,
  );
  bg.addColorStop(
    1,
    `rgb(${Math.round(cr * 0.05)},${Math.round(cg * 0.1)},${Math.round(cb * 0.2)})`,
  );
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < H; y += 3) {
    for (let x = 0; x < W; x += 3) {
      const n = (rnd() - 0.5) * 0.08;
      ctx.fillStyle = `rgba(${n > 0 ? 0 : cr},${n > 0 ? 255 : cg},${n > 0 ? 255 : cb},${Math.abs(n)})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  for (let i = 0; i < 3; i++) {
    const x = rnd() * W,
      y = rnd() * H,
      rad = 30 + rnd() * 80;
    const gc = ctx.createRadialGradient(x, y, 0, x, y, rad);
    gc.addColorStop(0, `rgba(${cr},${cg},${cb},${0.15 + rnd() * 0.2})`);
    gc.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = gc;
    ctx.fill();
  }

  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.08)`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < W; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, H);
    ctx.stroke();
  }
  for (let i = 0; i < H; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(W, i);
    ctx.stroke();
  }

  const formulas = ["∇×E", "iℏ∂Ψ", "G_μν", "H|ψ⟩", "ΔxΔp", "∫e^ix", "Ω_Λ"];
  ctx.font = `${Math.min(H * 0.08, 12)}px 'Space Mono',monospace`;
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.2)`;
  for (let i = 0; i < 2; i++) {
    ctx.fillText(
      formulas[Math.floor(rnd() * formulas.length)],
      rnd() * W * 0.8,
      rnd() * H,
    );
  }

  ctx.font = `bold ${Math.min(H * 0.1, 20)}px 'Cormorant Garamond',serif`;
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.3)`;
  ctx.textAlign = "center";
  const words = (title || "").split(" ");
  let line = "",
    lineY = H * 0.5;
  words.forEach((word) => {
    const test = line + word + " ";
    if (ctx.measureText(test).width > W * 0.85 && line !== "") {
      ctx.fillText(line.trim(), W / 2, lineY);
      line = word + " ";
      lineY += H * 0.12;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line.trim(), W / 2, lineY);

  const vig = ctx.createRadialGradient(
    W / 2,
    H / 2,
    Math.min(W, H) * 0.3,
    W / 2,
    H / 2,
    Math.max(W, H) * 0.9,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(2,3,5,.8)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/* ═══════════════════════════════════════════════════════════════
           2.1 ARTE COM CAPA REAL (+ FALLBACK GERATIVO)
        ═══════════════════════════════════════════════════════════════ */
function drawBookArtWithCover(canvas, title, category, w, h, capaUrl) {
  if (!canvas) return;
  canvas.width = w || canvas.clientWidth || 300;
  canvas.height = h || canvas.clientHeight || 200;

  const semCapa =
    !capaUrl || capaUrl === "uploads/capas/default.jpg" || capaUrl === "";

  if (!semCapa) {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      const W = canvas.width,
        H = canvas.height;
      const scale = Math.max(W / img.width, H / img.height);
      const sw = img.width * scale,
        sh = img.height * scale;
      const ox = (W - sw) / 2,
        oy = (H - sh) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, ox, oy, sw, sh);
      const vig = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.35,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.9,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(2,3,5,.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };
    img.onerror = () => {
      drawBookArt(canvas, title, category, w, h);
    };
    img.src = "../" + capaUrl;
  } else {
    drawBookArt(canvas, title, category, w, h);
  }
}

/* ═══════════════════════════════════════════════════════════════
           3. THREE.JS SETUP & SHADERS
        ═══════════════════════════════════════════════════════════════ */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  48,
  innerWidth / innerHeight,
  0.1,
  3000,
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.getElementById("webgl").appendChild(renderer.domElement);

const cam = {
  tx: 0,
  ty: 18,
  tz: 96,
};
const baseCamPos = new THREE.Vector3(0, 18, 96);
let camTzTarget = 96;
const camLook = {
  x: 0,
  y: 0,
  z: 0,
};
const camLookDst = {
  x: 0,
  y: 0,
  z: 0,
};

const rPass = new THREE.RenderPass(scene, camera);
const bloom = new THREE.UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.1,
  0.55,
  0.82,
);

const ChromaShader = {
  uniforms: {
    tDiffuse: { value: null },
    uS: { value: 0.002 },
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uS;varying vec2 vUv;void main(){vec2 c=vUv-.5;float d=length(c);vec2 o=c*d*uS;gl_FragColor=vec4(texture2D(tDiffuse,vUv-o*.8).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv+o*.7).b,1.0);}`,
};
const chroma = new THREE.ShaderPass(ChromaShader);

const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBHPos: { value: new THREE.Vector2(0.5, 0.5) },
    uBHR: { value: 0.026 },
    uStr: { value: 0.0065 },
    uTime: { value: 0 },
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform vec2 uBHPos;uniform float uBHR,uStr,uTime;varying vec2 vUv;void main(){vec2 delta=vUv-uBHPos;float dist=length(delta);vec2 dir=normalize(delta+vec2(0.00001));vec2 tangent=vec2(-dir.y,dir.x);float ang=atan(delta.y,delta.x);float compact=1.0-smoothstep(uBHR*0.78,uBHR*3.72,dist);float lensCore=(uBHR*uBHR)/(dist*dist+0.00022);float micro=sin(ang*2.0+uTime*0.22+dist*58.0)*0.5+0.5;float bend=clamp(uStr*lensCore*compact*(0.92+0.08*micro),0.0,0.026);float shear=sin(ang*3.0-uTime*0.16)*uBHR*0.020*compact;vec2 uv2=vUv-dir*bend+tangent*shear;vec4 col=texture2D(tDiffuse,uv2);float shadow=1.0-smoothstep(uBHR*0.56,uBHR*0.88,dist);col.rgb*=1.0-shadow*0.985;float photon=smoothstep(uBHR*0.90,uBHR*1.05,dist)*(1.0-smoothstep(uBHR*1.07,uBHR*1.24,dist));float einstein=smoothstep(uBHR*1.30,uBHR*1.52,dist)*(1.0-smoothstep(uBHR*1.54,uBHR*2.08,dist));float diskBand=1.0-smoothstep(uBHR*0.10,uBHR*0.26,abs(delta.y+delta.x*0.13));float diskFade=smoothstep(uBHR*1.04,uBHR*1.32,dist)*(1.0-smoothstep(uBHR*2.20,uBHR*3.12,dist));float disk=diskBand*diskFade*(0.78+0.22*sin(delta.x*220.0+uTime*0.75));vec3 hot=vec3(1.0,0.58,0.20);vec3 jwstBlue=vec3(0.38,0.72,1.0);vec3 violet=vec3(0.72,0.42,1.0);col.rgb+=hot*photon*0.48;col.rgb+=mix(hot,jwstBlue,micro)*einstein*0.20;col.rgb+=hot*disk*0.18;col.rgb+=mix(violet,jwstBlue,0.58)*compact*0.018;float ca=compact*uBHR*0.24;col.r+=texture2D(tDiffuse,uv2-dir*ca).r*0.016*compact;col.b+=texture2D(tDiffuse,uv2+dir*ca).b*0.018*compact;gl_FragColor=col;}`,
};
const lensPass = new THREE.ShaderPass(LensShader);

const VigShader = {
  uniforms: {
    tDiffuse: { value: null },
    uI: { value: 0.48 },
  },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uI;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float d=length(vUv-.5)*1.5;float v=1.0-d*d*uI;c.rgb*=clamp(v,.0,1.);gl_FragColor=c;}`,
};
const vigPass = new THREE.ShaderPass(VigShader);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(rPass);
composer.addPass(bloom);
composer.addPass(lensPass);
composer.addPass(chroma);
composer.addPass(vigPass);

/* ═══════════════════════════════════════════════════════════════
           4. ASTROFÍSICA REALISTA (Estrelas, Galáxia e Gargantua)
        ═══════════════════════════════════════════════════════════════ */
let bgMat, galMat, galDustMat, diskMat;
const bhVisuals = { group: null, rings: [], sprites: [], disk: null, jets: null };

(function () {
  const starVS = `attribute float aR,aFlicker;uniform float uT;varying float vR;varying vec3 vC;void main(){vC=color;float tw=0.5+0.5*sin(uT*0.8+aR*88.0+aFlicker*7.0)*sin(uT*1.3+aFlicker*3.0);vec4 vp=viewMatrix*modelMatrix*vec4(position,1.0);gl_Position=projectionMatrix*vp;gl_PointSize=(9.0/-vp.z)*(0.25+aR*0.95)*tw;}`;
  const starFS = `varying vec3 vC;void main(){float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.5);gl_FragColor=vec4(vC,s*.88);}`;
  const OBAFGKM = [
    STELLAR_CLASSES.O,
    STELLAR_CLASSES.B,
    STELLAR_CLASSES.A,
    STELLAR_CLASSES.F,
    STELLAR_CLASSES.G,
    STELLAR_CLASSES.K,
    STELLAR_CLASSES.M,
  ];

  function mkLayer(N, spread, minS, maxS, colA, colB) {
    const g = new THREE.BufferGeometry(),
      p = new Float32Array(N * 3),
      r = new Float32Array(N),
      fl = new Float32Array(N),
      c = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * spread;
      p[i * 3 + 1] = (Math.random() - 0.5) * spread;
      p[i * 3 + 2] = (Math.random() - 0.5) * spread;
      r[i] = Math.random();
      fl[i] = Math.random();
      const t = Math.random();
      c[i * 3] = colA[0] * (1 - t) + colB[0] * t;
      c[i * 3 + 1] = colA[1] * (1 - t) + colB[1] * t;
      c[i * 3 + 2] = colA[2] * (1 - t) + colB[2] * t;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(r, 1));
    g.setAttribute("aFlicker", new THREE.BufferAttribute(fl, 1));
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  }
  const mkMat = (u) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: u,
      vertexShader: starVS,
      fragmentShader: starFS,
    });
  scene.add(
    new THREE.Points(
      mkLayer(6000, 1800, 0.2, 0.8, OBAFGKM[0], OBAFGKM[2]),
      mkMat({ uT: { value: 0 } }),
    ),
  );
  scene.add(
    new THREE.Points(
      mkLayer(3000, 1400, 0.25, 0.7, OBAFGKM[3], OBAFGKM[4]),
      mkMat({ uT: { value: 0 } }),
    ),
  );
  bgMat = mkMat({ uT: { value: 0 } });
  scene.add(
    new THREE.Points(
      mkLayer(1800, 800, 0.35, 1.1, OBAFGKM[5], OBAFGKM[6]),
      bgMat,
    ),
  );
})();

(function () {
  const ARMS = 4,
    N = 80000;
  const geom = new THREE.BufferGeometry(),
    pos = new Float32Array(N * 3),
    col = new Float32Array(N * 3),
    aR = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const i3 = i * 3,
      rng = Math.random(),
      r = Math.pow(rng, 1.5) * 72 + (rng < 0.12 ? 0 : 2);
    const armAng = (Math.floor(Math.random() * ARMS) / ARMS) * Math.PI * 2;
    const spiral = r * 0.52 + armAng,
      spread = Math.pow(Math.random(), 1.8) * Math.max(0, (72 - r) * 0.18);
    pos[i3] = Math.cos(spiral) * r + (Math.random() - 0.5) * spread;
    pos[i3 + 1] = (Math.random() - 0.5) * (r < 10 ? 3 : r < 25 ? 1 : 0.5);
    pos[i3 + 2] = Math.sin(spiral) * r + (Math.random() - 0.5) * spread;    let starColor;
    if (r < 8) {
      starColor = lerpTriplet(STELLAR_CLASSES.K, STELLAR_CLASSES.G, Math.random() * 0.55);
    } else if (r < 18) {
      starColor = lerpTriplet(STELLAR_CLASSES.G, STELLAR_CLASSES.F, Math.random());
    } else if (r < 38) {
      starColor = lerpTriplet(STELLAR_CLASSES.F, STELLAR_CLASSES.A, Math.random() * 0.82);
    } else {
      starColor = lerpTriplet(STELLAR_CLASSES.B, STELLAR_CLASSES.O, Math.random() * 0.7);
    }
    col[i3] = starColor[0];
    col[i3 + 1] = starColor[1];
    col[i3 + 2] = starColor[2];
    aR[i] = Math.random();
  }
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geom.setAttribute("aR", new THREE.BufferAttribute(aR, 1));
  galMat = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    transparent: true,
    uniforms: { uT: { value: 0 } },
    vertexShader: `attribute float aR;uniform float uT;varying vec3 vC;void main(){vC=color;float dist=length(position.xz);float omega=0.072/(dist*0.052+0.6);float ang=atan(position.z,position.x)+uT*omega;vec3 p=vec3(cos(ang)*dist,position.y,sin(ang)*dist);vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);gl_Position=projectionMatrix*vp;float tw=0.62+0.38*sin(uT*0.85+aR*52.0);gl_PointSize=(22.0/-vp.z)*(0.13+aR*0.52)*tw*(1.0+0.18*smoothstep(0.0,9.0,9.0-dist));}`,
    fragmentShader: `varying vec3 vC;void main(){float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),3.0);gl_FragColor=vec4(vC*(0.82+s*0.55),s*.62);}`,
  });
  const gal = new THREE.Points(geom, galMat);
  gal.rotation.x = 1.12;
  gal.rotation.z = 0.1;
  scene.add(gal);

  const ND = 15000,
    dg = new THREE.BufferGeometry(),
    dp = new Float32Array(ND * 3),
    dc = new Float32Array(ND * 3);
  for (let i = 0; i < ND; i++) {
    const i3 = i * 3,
      r = 10 + Math.random() * 55,
      armAng =
        ((Math.floor(Math.random() * ARMS) + 0.5) / ARMS) * Math.PI * 2 +
        Math.PI * 0.15;
    const spiral = r * 0.52 + armAng,
      spread = Math.random() * (r * 0.18);
    dp[i3] = Math.cos(spiral) * r + (Math.random() - 0.5) * spread;
    dp[i3 + 1] = (Math.random() - 0.5) * 0.4;
    dp[i3 + 2] = Math.sin(spiral) * r + (Math.random() - 0.5) * spread;
    dc[i3] = 0.04;
    dc[i3 + 1] = 0.015;
    dc[i3 + 2] = 0.01;
  }
  dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  dg.setAttribute("color", new THREE.BufferAttribute(dc, 3));
  galDustMat = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexColors: true,
    transparent: true,
    uniforms: { uT: { value: 0 } },
    vertexShader: `uniform float uT;varying vec3 vC;void main(){vC=color;float dist=length(position.xz);float omega=0.058/(dist*0.048+0.6);float ang=atan(position.z,position.x)+uT*omega;vec3 p=vec3(cos(ang)*dist,position.y,sin(ang)*dist);vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);gl_Position=projectionMatrix*vp;gl_PointSize=(52.0/-vp.z)*(0.48+0.52*fract(sin(dist*17.3)*43758.5));}`,
    fragmentShader: `varying vec3 vC;void main(){float s=1.0-smoothstep(0.2,.5,distance(gl_PointCoord,vec2(.5)));gl_FragColor=vec4(vC*(0.75+s*0.45),s*.46);}`,
  });
  const dust = new THREE.Points(dg, galDustMat);
  dust.rotation.x = 1.12;
  dust.rotation.z = 0.1;
  scene.add(dust);
})();

(function () {
  const group = new THREE.Group();
  group.name = "Andromeda_Gargantua_LocalModel";
  scene.add(group);
  bhVisuals.group = group;

  function makeRadialSprite(hex, size, opacity = 1, softness = 1) {
    const { r, g, b } = hexToRgb(hex);
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const cx = cv.getContext("2d");
    const gr = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0.00, `rgba(${r},${g},${b},${0.95 * opacity})`);
    gr.addColorStop(0.12, `rgba(${r},${g},${b},${0.38 * opacity})`);
    gr.addColorStop(0.42, `rgba(${r},${g},${b},${0.10 * opacity})`);
    gr.addColorStop(Math.min(0.92, 0.72 + softness * 0.16), `rgba(${r},${g},${b},${0.025 * opacity})`);
    gr.addColorStop(1.00, `rgba(${r},${g},${b},0)`);
    cx.fillStyle = gr;
    cx.fillRect(0, 0, 256, 256);
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity,
      }),
    );
    sp.scale.set(size, size, 1);
    group.add(sp);
    bhVisuals.sprites.push(sp);
    return sp;
  }

  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(2.18, 72, 72),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  horizon.name = "Event_Horizon_Shadow";
  group.add(horizon);

  const shadowShell = new THREE.Mesh(
    new THREE.SphereGeometry(2.58, 72, 72),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      side: THREE.BackSide,
    }),
  );
  shadowShell.name = "Black_Hole_Shadow_Shell";
  group.add(shadowShell);

  const ringSpecs = [
    { r: 2.46, t: 0.026, c: 0xfff3dc, o: 0.92, tilt: 0.00 },
    { r: 2.64, t: 0.020, c: 0xffa24a, o: 0.60, tilt: 0.025 },
    { r: 2.94, t: 0.014, c: 0x6cbcff, o: 0.26, tilt: -0.035 },
    { r: 3.34, t: 0.010, c: 0xa960ee, o: 0.15, tilt: 0.055 },
  ];
  ringSpecs.forEach((spec, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.r, spec.t, 18, 220),
      new THREE.MeshBasicMaterial({
        color: spec.c,
        transparent: true,
        opacity: spec.o,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.rotation.x = Math.PI / 2 + spec.tilt;
    ring.rotation.z = i * 0.28;
    group.add(ring);
    bhVisuals.rings.push(ring);
  });

  makeRadialSprite(0xff8f38, 16.0, 0.24, 0.7);
  makeRadialSprite(0x52b7ff, 23.0, 0.105, 0.95);
  makeRadialSprite(0xa960ee, 31.0, 0.040, 1.0);

  const NA = 22000,
    ag = new THREE.BufferGeometry(),
    ap = new Float32Array(NA * 3),
    ac = new Float32Array(NA * 3),
    aAng = new Float32Array(NA),
    aRad = new Float32Array(NA),
    aSeed = new Float32Array(NA);
  for (let i = 0; i < NA; i++) {
    const i3 = i * 3,
      r = 2.85 + Math.pow(Math.random(), 0.58) * 9.6,
      a = Math.random() * Math.PI * 2,
      verticalTaper = 1 / (r * 0.22 + 0.86);
    aAng[i] = a;
    aRad[i] = r;
    aSeed[i] = Math.random();
    ap[i3] = Math.cos(a) * r;
    ap[i3 + 1] = (Math.random() - 0.5) * 0.12 * verticalTaper;
    ap[i3 + 2] = Math.sin(a) * r;
    const tt = Math.pow((r - 2.85) / 9.6, 0.74);
    ac[i3] = Math.min(1.0, 1.0 - tt * 0.05);
    ac[i3 + 1] = Math.max(0.18, 0.78 - tt * 0.54);
    ac[i3 + 2] = Math.max(0.05, 0.38 - tt * 0.34);
  }
  ag.setAttribute("position", new THREE.BufferAttribute(ap, 3));
  ag.setAttribute("color", new THREE.BufferAttribute(ac, 3));
  ag.setAttribute("aAng", new THREE.BufferAttribute(aAng, 1));
  ag.setAttribute("aRad", new THREE.BufferAttribute(aRad, 1));
  ag.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
  diskMat = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    transparent: true,
    uniforms: { uT: { value: 0 } },
    vertexShader: `attribute float aAng,aRad,aSeed;uniform float uT;varying vec3 vC;varying float vBright;void main(){vC=color;float omega=0.58/sqrt(aRad*aRad*aRad*0.012+aRad);float ang=aAng+uT*omega;float wave=sin(ang*5.0+aRad*1.15+uT*0.9+aSeed*6.2831)*0.035;vec3 p=vec3(cos(ang)*aRad,position.y+wave*(1.0/(aRad*.22+1.0)),sin(ang)*aRad);p.y*=0.82;vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);gl_Position=projectionMatrix*vp;float szFac=1.0-(aRad-2.85)/9.6;gl_PointSize=(11.0/-vp.z)*(0.13+szFac*.46)*(0.86+0.14*sin(uT+aSeed*31.0));vBright=szFac;}`,
    fragmentShader: `varying vec3 vC;varying float vBright;void main(){float s=pow(1.0-distance(gl_PointCoord,vec2(.5)),2.4);gl_FragColor=vec4(vC*s,s*(.36+vBright*.48));}`,
  });
  const disk = new THREE.Points(ag, diskMat);
  disk.name = "Accretion_Disk_JWST_Infrared";
  disk.rotation.x = 0.08;
  group.add(disk);
  bhVisuals.disk = disk;

  const NJ = 1600,
    jg = new THREE.BufferGeometry(),
    jp = new Float32Array(NJ * 3),
    jc = new Float32Array(NJ * 3);
  for (let i = 0; i < NJ; i++) {
    const i3 = i * 3,
      h = (Math.random() - 0.5) * 28,
      r = Math.abs(h) * 0.030 * (Math.random() * 0.8 + 0.2),
      a = Math.random() * Math.PI * 2;
    jp[i3] = Math.cos(a) * r;
    jp[i3 + 1] = h;
    jp[i3 + 2] = Math.sin(a) * r;
    const tl = Math.abs(h) / 14;
    jc[i3] = 0.82 - tl * 0.30;
    jc[i3 + 1] = 0.52 - tl * 0.30;
    jc[i3 + 2] = 1.0 - tl * 0.42;
  }
  jg.setAttribute("position", new THREE.BufferAttribute(jp, 3));
  jg.setAttribute("color", new THREE.BufferAttribute(jc, 3));
  const jets = new THREE.Points(
    jg,
    new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.095,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.28,
    }),
  );
  jets.name = "Relativistic_Polar_Whisper";
  group.add(jets);
  bhVisuals.jets = jets;
})();
/* ═══════════════════════════════════════════════════════════════
           5. SISTEMAS DE CATEGORIAS & PLANETAS
        ═══════════════════════════════════════════════════════════════ */
function mkGlow(hex, sz) {
  const { r, g, b } = hexToRgb(hex),
    cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const cx = cv.getContext("2d"),
    gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.18, `rgba(${r},${g},${b},.55)`);
  gr.addColorStop(0.5, `rgba(${r},${g},${b},.1)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  cx.fillStyle = gr;
  cx.fillRect(0, 0, 128, 128);
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  sp.scale.set(sz, sz, 1);
  return sp;
}

const PLANET_TYPES = [
  "rocky",
  "gaseous",
  "icy",
  "volcanic",
  "oceanic",
  "desert",
  "crystal",
  "nebular",
  "forest",
  "methane",
  "metallic",
  "sulfuric",
];
function getPlanetType(n) {
  return PLANET_TYPES[hashString(n) % PLANET_TYPES.length];
}

const PLANET_SWATCHES = {
  gaseous: [0xf4d8a2, 0xd8ab72, 0xbd784b, 0xe9efe6],
  rocky: [0x8c7662, 0xb19379, 0x6b5d52, 0xcab59d],
  icy: [0xd6f4ff, 0x97ddff, 0x6cc9e8, 0xf4fbff],
  volcanic: [0x2b1820, 0x7b2e1f, 0xe95d24, 0xffbb55],
  oceanic: [0x082c52, 0x1268a8, 0x3aa4dd, 0xaee8ff],
  desert: [0x8f6641, 0xc9934a, 0xe1b36c, 0xf9e1ab],
  crystal: [0x92b5ff, 0xd7c8ff, 0x78f1ff, 0xffffff],
  nebular: [0x3b2157, 0x6d40a0, 0x49a2ff, 0xff8ef6],
  forest: [0x14311a, 0x2e6a38, 0x67a25e, 0xc3d6a2],
  methane: [0x65d5e8, 0x2f88aa, 0x0d5670, 0xb5fcff],
  metallic: [0x545d6a, 0x909cad, 0xcfd6de, 0xeff2f5],
  sulfuric: [0x745611, 0xcaa31d, 0xf2de66, 0xfff7b7],
};

function pickPlanetSwatches(catName) {
  const type = getPlanetType(catName);
  return { type, swatches: PLANET_SWATCHES[type] || PLANET_SWATCHES.rocky };
}

function makePlanetTexture(pcol, catName, sz) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = sz;
  const ctx = cv.getContext("2d");
  const { type, swatches } = pickPlanetSwatches(catName);
  let seed = hashString(catName);
  const rnd = (() => {
    let s = Math.abs(seed) || 1;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  })();
  const accent = hexToRgb(pcol);
  const cols = swatches.map(hexToRgb);

  const paintSphere = (g) => {
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sz * 0.5, sz * 0.5, sz * 0.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const base = ctx.createRadialGradient(sz * 0.35, sz * 0.3, 0, sz * 0.5, sz * 0.5, sz * 0.65);
  base.addColorStop(0, `rgb(${cols[3].r},${cols[3].g},${cols[3].b})`);
  base.addColorStop(0.38, `rgb(${cols[1].r},${cols[1].g},${cols[1].b})`);
  base.addColorStop(1, `rgb(${cols[0].r},${cols[0].g},${cols[0].b})`);
  paintSphere(base);

  if (["gaseous", "methane", "sulfuric", "nebular"].includes(type)) {
    for (let i = 0; i < 9; i++) {
      const y = rnd() * sz;
      const h = 2 + rnd() * sz * 0.1;
      const band = ctx.createLinearGradient(0, y, sz, y + h);
      const c1 = cols[i % cols.length], c2 = cols[(i + 1) % cols.length];
      band.addColorStop(0, `rgba(${c1.r},${c1.g},${c1.b},${0.18 + rnd() * 0.28})`);
      band.addColorStop(1, `rgba(${c2.r},${c2.g},${c2.b},${0.08 + rnd() * 0.18})`);
      ctx.fillStyle = band;
      ctx.fillRect(0, y, sz, h);
    }
  }

  if (["rocky", "desert", "metallic", "volcanic", "forest"].includes(type)) {
    for (let i = 0; i < 18; i++) {
      const cx = rnd() * sz;
      const cy = rnd() * sz;
      const cr = sz * (0.03 + rnd() * 0.12);
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      const crater = cols[(1 + i) % cols.length];
      ctx.strokeStyle = `rgba(${crater.r},${crater.g},${crater.b},${type === "volcanic" ? 0.5 : 0.22})`;
      ctx.lineWidth = 1 + rnd() * 1.2;
      ctx.stroke();
      if (type === "volcanic" && rnd() > 0.45) {
        ctx.fillStyle = `rgba(${accent.r},${accent.g},${accent.b},0.18)`;
        ctx.fill();
      }
    }
  }

  if (["oceanic", "icy", "forest"].includes(type)) {
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(rnd() * sz, rnd() * sz, sz * (0.06 + rnd() * 0.18), 0, Math.PI * 2);
      const patch = cols[(2 + i) % cols.length];
      ctx.fillStyle = `rgba(${patch.r},${patch.g},${patch.b},${0.08 + rnd() * 0.16})`;
      ctx.fill();
    }
  }

  if (type === "crystal") {
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      const x = rnd() * sz, y = rnd() * sz;
      ctx.moveTo(x, y);
      ctx.lineTo(x + sz * (0.04 + rnd() * 0.12), y + sz * (0.02 + rnd() * 0.08));
      ctx.lineTo(x + sz * (0.01 + rnd() * 0.06), y + sz * (0.11 + rnd() * 0.16));
      ctx.closePath();
      const crystal = cols[(i + 1) % cols.length];
      ctx.fillStyle = `rgba(${crystal.r},${crystal.g},${crystal.b},0.16)`;
      ctx.fill();
    }
  }

  const shine = ctx.createRadialGradient(sz * 0.34, sz * 0.28, 0, sz * 0.36, sz * 0.3, sz * 0.28);
  shine.addColorStop(0, "rgba(255,255,255,0.42)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(sz * 0.35, sz * 0.3, sz * 0.28, 0, Math.PI * 2);
  ctx.fill();

  const aura = ctx.createRadialGradient(sz * 0.5, sz * 0.5, sz * 0.18, sz * 0.5, sz * 0.5, sz * 0.5);
  aura.addColorStop(0, "rgba(0,0,0,0)");
  aura.addColorStop(1, `rgba(${accent.r},${accent.g},${accent.b},0.14)`);
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, sz, sz);

  const vignette = ctx.createRadialGradient(sz * 0.5, sz * 0.5, sz * 0.28, sz * 0.5, sz * 0.5, sz * 0.56);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, sz, sz);

  return cv;
}

const catMap = new Map();
const catStars = [];
const uniqCats = [
  ...new Set(LIVROS.map((l) => l.categoria_nome).filter(Boolean)),
];
const sysList = document.getElementById("systems-menu");

uniqCats.forEach((name, idx) => {
  const btn = document.createElement("div");
  btn.className = "sys-item";
  btn.dataset.c = name;
  btn.innerHTML = `<div class="sys-dot" style="color:${catHexStr(name)}"></div>${name}`;
  sysList.appendChild(btn);

  const t = (idx + 0.5) / Math.max(1, uniqCats.length),
    golden = Math.PI * (3 - Math.sqrt(5)),
    ringLayer = idx % 6,
    orbitShell = Math.floor(idx / Math.max(6, Math.ceil(Math.sqrt(Math.max(uniqCats.length, 1))))),
    ang = idx * golden + t * Math.PI * 0.82,
    // Campo equilibrado: menor que a versão anterior, mas ainda preserva um vazio seguro
    // ao redor do buraco negro para evitar planetas atravessando a zona do horizonte.
    rad = 36 + t * (50 + Math.sqrt(Math.max(uniqCats.length, 1)) * 2.15) + ringLayer * 2.35 + orbitShell * 1.85;
  const x = Math.cos(ang) * rad + (Math.random() - 0.5) * 0.95,
    y = (Math.random() - 0.5) * 3.0,
    z = Math.sin(ang) * rad + (Math.random() - 0.5) * 0.95;
  const sysPalette = getSystemPalette(name);
  const col = sysPalette.core;
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 24, 24),
    new THREE.MeshBasicMaterial({ color: col }),
  );
  star.position.set(x, y, z);
  star.userData = { isCategory: true, name };
  scene.add(star);
  catStars.push(star);
  const glow = mkGlow(sysPalette.core, 16),
    glow2 = mkGlow(sysPalette.halo, 36),
    neb = mkGlow(sysPalette.nebula, 72);
  glow.position.set(x, y, z);
  glow.material.opacity = 0.9;
  glow2.position.set(x, y, z);
  glow2.material.opacity = 0.24;
  neb.position.set(x, y, z);
  neb.material.opacity = 0.065;
  scene.add(glow);
  scene.add(glow2);
  scene.add(neb);

  // Guia orbital extremamente sutil: não rouba a cena, mas ajuda o usuário a sentir
  // que cada constelação pertence a uma órbita real ao redor do buraco negro.
  const orbitGuidePts = [];
  const ORBIT_GUIDE_STEPS = 180;
  for (let j = 0; j <= ORBIT_GUIDE_STEPS; j++) {
    const a = (j / ORBIT_GUIDE_STEPS) * Math.PI * 2;
    orbitGuidePts.push(new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad));
  }
  const orbitGuide = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(orbitGuidePts),
    new THREE.LineBasicMaterial({
      color: sysPalette.halo,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  orbitGuide.visible = false;
  scene.add(orbitGuide);

  const systemSeed = hashString(name);
  catMap.set(name, {
    name,
    col,
    star,
    glow,
    glow2,
    neb,
    orbitGuide,
    palette: sysPalette,
    pos: new THREE.Vector3(x, y, z),
    orbitRadius: Math.max(36, Math.hypot(x, z)),
    orbitAngle: Math.atan2(z, x),
    orbitHeight: y,
    orbitPhase: (systemSeed % 1000) * 0.006283,
    orbitFloatAmp: 0.09 + (systemSeed % 5) * 0.018,
    orbitFloatSpeed: 0.18 + (systemSeed % 7) * 0.012,
    orbitGuideOpacity: 0.010 + (idx % 4) * 0.0025,
    // Órbita lenta e charmosa: quase imperceptível em segundos, clara ao contemplar.
    // O valor está em rad/s e alterna direção para criar uma coreografia orgânica.
    systemOrbitSpeed: (0.0026 + (idx % 7) * 0.00022) * (idx % 2 === 0 ? 1 : -1),
    books: [],
  });
});

const MAX_CONST = 200,
  constPos = new Float32Array(MAX_CONST * 6),
  constGeom = new THREE.BufferGeometry();
constGeom.setAttribute("position", new THREE.BufferAttribute(constPos, 3));
constGeom.setDrawRange(0, 0);
const constLines = new THREE.LineSegments(
  constGeom,
  new THREE.LineBasicMaterial({
    color: 0x2aa2f6,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
);
scene.add(constLines);

function updateConstellations() {
  if (activeFilter === "all") {
    constGeom.setDrawRange(0, 0);
    return;
  }
  const cd = catMap.get(activeFilter);
  if (!cd) return;
  let i = 0;
  cd.books.forEach((b) => {
    if (!b.filtered || !b.searched || i >= MAX_CONST) return;
    const cp = cd.pos;
    constPos[i * 6] = cp.x;
    constPos[i * 6 + 1] = cp.y;
    constPos[i * 6 + 2] = cp.z;
    constPos[i * 6 + 3] = b._px || cp.x;
    constPos[i * 6 + 4] = b._py || cp.y;
    constPos[i * 6 + 5] = b._pz || cp.z;
    i++;
  });
  constGeom.attributes.position.needsUpdate = true;
  constGeom.setDrawRange(0, i * 2);
}

const bookObjs = [],
  planetGroup = new THREE.Group();
scene.add(planetGroup);
const planetMeshes = [];
LIVROS.forEach((livro, idx) => {
  const cd = catMap.get(livro.categoria_nome);
  if (!cd) return;
  const oIdx = cd.books.length,
    orbitSlot = oIdx % 7,
    orbitBand = Math.floor(oIdx / 7),
    // Órbitas compactas, mas com separação suficiente para evitar choques visuais.
    oRad = 5.05 + orbitSlot * 1.42 + orbitBand * 0.96 + Math.random() * 0.22,
    oSpd = ((0.055 + Math.random() * 0.105) / (1 + orbitBand * 0.11)) * (Math.random() > 0.5 ? 1 : -1),
    oAng = ((orbitSlot / 7) * Math.PI * 2 + orbitBand * 0.47 + idx * 0.071) % (Math.PI * 2);
  const tiltX = (Math.random() - 0.5) * Math.PI * 0.62,
    tiltZ = (Math.random() - 0.5) * Math.PI * 0.34,
    sz = 0.145 + Math.random() * 0.105;
  const st = (livro.status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const baseSystemColor = cd.palette?.core || catColor(livro.categoria_nome);
  const statusAccent = st.includes("disp")
    ? STATUS_ACCENTS.disponivel
    : st.includes("empr")
      ? STATUS_ACCENTS.emprestado
      : st.includes("res")
        ? STATUS_ACCENTS.reservado
        : STATUS_ACCENTS.neutro;
  const pcol = mixHexColors(baseSystemColor, statusAccent, 0.28);
  const tex = new THREE.CanvasTexture(
    makePlanetTexture(pcol, `${livro.categoria_nome || ""}|${livro.titulo || ""}`, 64),
  );
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 20),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  mesh.userData.bookIdx = idx;
  planetGroup.add(mesh);
  const glow = mkGlow(pcol, sz * 20);
  glow.material.opacity = 0.65;
  scene.add(glow);
  const OP = 120,
    oPts = [];
  for (let i = 0; i <= OP; i++) {
    const a = (i / OP) * Math.PI * 2;
    oPts.push(
      Math.cos(a) * oRad * Math.cos(tiltX),
      Math.sin(a) * oRad * Math.sin(tiltZ) * 0.38,
      Math.sin(a) * oRad * Math.cos(tiltX),
    );
  }
  const oGeom = new THREE.BufferGeometry();
  oGeom.setAttribute("position", new THREE.Float32BufferAttribute(oPts, 3));
  const oLine = new THREE.LineLoop(
    oGeom,
    new THREE.LineBasicMaterial({
      color: pcol,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    }),
  );
  oLine.position.copy(cd.pos);
  scene.add(oLine);
  const obj = {
    data: livro,
    cd,
    glow,
    orbitLine: oLine,
    mesh,
    tex,
    oRad,
    oSpd,
    oAng,
    tiltX,
    tiltZ,
    sz,
    pcol,
    idx,
    filtered: true,
    searched: true,
    currentScale: 1,
    isHovered: false,
    _px: cd.pos.x,
    _py: cd.pos.y,
    _pz: cd.pos.z,
    _spinY: 0,
  };
  cd.books.push(obj);
  bookObjs.push(obj);
  planetMeshes.push(mesh);
});

/* ═══════════════════════════════════════════════════════════════
           6. ESTADO, CURSOR & EVENTOS
        ═══════════════════════════════════════════════════════════════ */
let mX = 0,
  mY = 0,
  activeView = "gal",
  activeFilter = "all",
  queryStr = "",
  searchDebounce = null;
const ray = new THREE.Raycaster();
ray.params.Points = { threshold: 0.8 };
const mVec = new THREE.Vector2();
const retEl = document.getElementById("reticle"),
  retDot = document.getElementById("reticle-dot"),
  tipEl = document.getElementById("tip");
let retX = window.innerWidth / 2,
  retY = window.innerHeight / 2,
  dotX = retX,
  dotY = retY,
  tgtX = retX,
  tgtY = retY,
  isMag = false,
  HOVER = null,
  selBook = null,
  HOVER_CAT = null;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const normalizeAngle = (v) => {
  const tau = Math.PI * 2;
  v = ((v + Math.PI) % tau + tau) % tau - Math.PI;
  return v;
};
const ZOOM_MIN = 5;
// Zoom-out adaptativo: abre campo para sistemas atuais e futuros sem cortar as bordas da galáxia.
const ZOOM_MAX = Math.max(168, 132 + Math.sqrt(Math.max(uniqCats.length, 1)) * 9.5);
const ZOOM_HOME = Math.min(122, Math.max(104, 94 + Math.sqrt(Math.max(uniqCats.length, 1)) * 3.4));
cam.tz = ZOOM_HOME;
camTzTarget = ZOOM_HOME;
baseCamPos.set(0, 18, ZOOM_HOME);

const galaxyOrbit = {
  yaw: 0,
  pitch: 0,
  targetYaw: 0,
  targetPitch: 0,
  dragging: false,
  lastX: 0,
  lastY: 0,
};

function isGalaxyControlBlocked(target) {
  return !!target.closest(
    "#nav, #hud, #systems-menu, #book-panel, #modal-overlay, #editorial-view, #depth, button, a, input, textarea, select",
  );
}

function updateDepthUI(value = camTzTarget) {
  const track = document.getElementById("depth-track");
  const dot = document.getElementById("ddot");
  const fill = document.getElementById("depth-fill");
  const readout = document.getElementById("depth-readout");
  if (!track || !dot || !fill || !readout) return;

  const topPct = clamp(((value - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100, 0, 100);
  const zoomPct = clamp(Math.round(100 - topPct), 0, 100);

  dot.style.top = `${topPct}%`;
  fill.style.height = `${topPct}%`;
  readout.textContent = `${zoomPct}%`;
  track.setAttribute("aria-valuenow", String(zoomPct));
}

function setGalaxyZoom(value, shouldAnimate = false) {
  const next = clamp(value, ZOOM_MIN, ZOOM_MAX);
  if (shouldAnimate) {
    gsap.to({ v: camTzTarget }, {
      v: next,
      duration: 0.55,
      ease: "power3.out",
      onUpdate() {
        camTzTarget = this.targets()[0].v;
        updateDepthUI(camTzTarget);
      },
    });
  } else {
    camTzTarget = next;
    updateDepthUI(camTzTarget);
  }

  if (camTzTarget > Math.min(ZOOM_MAX - 10, ZOOM_HOME + 32) && activeFilter !== "all") flyToCat("all");
}

function setGalaxyZoomFromPointer(e) {
  const track = document.getElementById("depth-track");
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const ratio = clamp((e.clientY - rect.top) / rect.height, 0, 1);
  setGalaxyZoom(ZOOM_MIN + ratio * (ZOOM_MAX - ZOOM_MIN), false);
}

document.addEventListener("mousemove", (e) => {
  tgtX = e.clientX;
  tgtY = e.clientY;
  mX = (e.clientX / innerWidth - 0.5) * 2;
  mY = (e.clientY / innerHeight - 0.5) * 2;
  tipEl.style.left = e.clientX + 20 + "px";
  tipEl.style.top = e.clientY - 10 + "px";
  if (activeView === "gal" && activeFilter === "all") {
    cam.tx = mX * 12;
    cam.ty = 18 - mY * 7;
  }
  if (activeView === "gal") handleRaycast(e);
  const els = document.querySelectorAll(
    ".nav-item, .sys-item, .hud-btn, .btn-prim, .btn-sec, .view-tog button, .bp-close, .md-close, .ed-hero-btn, .ed-book-card, .bp-synopsis-toggle, .ed-carousel-btn, .ed-carousel-dot, .ed-section-nav, .depth-track, .depth-reset",
  );
  let closest = null,
    closestDist = 50;
  els.forEach((el) => {
    if (!el.offsetParent) return;
    const r = el.getBoundingClientRect(),
      cx = r.left + r.width / 2,
      cy = r.top + r.height / 2,
      d = Math.hypot(e.clientX - cx, e.clientY - cy);
    if (d < closestDist) {
      closestDist = d;
      closest = { x: cx, y: cy };
      isMag = true;
    }
  });
  if (!closest) isMag = false;
});

(function animCursor() {
  const eas = isMag ? 0.4 : 0.35;
  retX += (tgtX - retX) * eas;
  retY += (tgtY - retY) * eas;
  dotX += (tgtX - dotX) * 0.65;
  dotY += (tgtY - dotY) * 0.65;
  retEl.style.transform = `translate3d(${retX}px, ${retY}px, 0) translate(-50%, -50%)`;
  retDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
  requestAnimationFrame(animCursor);
})();

document.addEventListener("mousedown", () => retEl.classList.add("click"));
document.addEventListener("mouseup", () => retEl.classList.remove("click"));

window.addEventListener("pointerdown", (e) => {
  if (activeView !== "gal" || ecoMode || isGalaxyControlBlocked(e.target)) return;
  galaxyOrbit.dragging = true;
  galaxyOrbit.lastX = e.clientX;
  galaxyOrbit.lastY = e.clientY;
  document.body.classList.add("galaxy-dragging");
});

window.addEventListener("pointermove", (e) => {
  if (!galaxyOrbit.dragging) return;
  const dx = e.clientX - galaxyOrbit.lastX;
  const dy = e.clientY - galaxyOrbit.lastY;
  galaxyOrbit.lastX = e.clientX;
  galaxyOrbit.lastY = e.clientY;
  galaxyOrbit.targetYaw = normalizeAngle(galaxyOrbit.targetYaw + dx * 0.0042);
  galaxyOrbit.targetPitch = clamp(galaxyOrbit.targetPitch + dy * 0.0028, -1.08, 1.08);
});

window.addEventListener("pointerup", () => {
  galaxyOrbit.dragging = false;
  document.body.classList.remove("galaxy-dragging");
});

window.addEventListener("pointercancel", () => {
  galaxyOrbit.dragging = false;
  document.body.classList.remove("galaxy-dragging");
});

const depthTrack = document.getElementById("depth-track");
const depthReset = document.getElementById("depth-reset");
if (depthTrack) {
  depthTrack.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    document.getElementById("depth").classList.add("dragging");
    depthTrack.setPointerCapture(e.pointerId);
    setGalaxyZoomFromPointer(e);
  });
  depthTrack.addEventListener("pointermove", (e) => {
    if (!depthTrack.hasPointerCapture(e.pointerId)) return;
    setGalaxyZoomFromPointer(e);
  });
  depthTrack.addEventListener("pointerup", (e) => {
    document.getElementById("depth").classList.remove("dragging");
    if (depthTrack.hasPointerCapture(e.pointerId)) depthTrack.releasePointerCapture(e.pointerId);
  });
  depthTrack.addEventListener("keydown", (e) => {
    if (activeView !== "gal") return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setGalaxyZoom(camTzTarget - 6, true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setGalaxyZoom(camTzTarget + 6, true);
    }
    if (e.key === "Home") {
      e.preventDefault();
      setGalaxyZoom(ZOOM_MIN, true);
    }
    if (e.key === "End") {
      e.preventDefault();
      setGalaxyZoom(ZOOM_MAX, true);
    }
  });
}
if (depthReset) {
  depthReset.addEventListener("click", () => {
    galaxyOrbit.targetYaw = 0;
    galaxyOrbit.targetPitch = 0;
    galaxyOrbit.yaw = 0;
    galaxyOrbit.pitch = 0;
    setGalaxyZoom(ZOOM_HOME, true);
    if (activeView === "gal" && activeFilter !== "all") flyToCat("all");
  });
}
updateDepthUI(ZOOM_HOME);

const sysBtn = document.getElementById("btn-systems"),
  sysMenu = document.getElementById("systems-menu");
sysBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sysMenu.classList.toggle("open");
  sysBtn.classList.toggle("active");
});
document.addEventListener("click", (e) => {
  if (!sysMenu.contains(e.target) && !sysBtn.contains(e.target)) {
    sysMenu.classList.remove("open");
    sysBtn.classList.remove("active");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (document.getElementById("modal-overlay").classList.contains("open")) {
      closeModal();
    } else if (
      document.getElementById("book-panel").classList.contains("open")
    ) {
      hidePanel();
    } else if (activeFilter !== "all") {
      flyToCat("all");
    }
  }
});

/* ─── TOGGLE DA SINOPSE NO PAINEL ─── */
document.getElementById("bp-synopsis-toggle").addEventListener("click", () => {
  const synText = document.getElementById("bp-synopsis-text");
  const toggleBtn = document.getElementById("bp-synopsis-toggle");
  const isExpanded = synText.classList.toggle("expanded");
  toggleBtn.classList.toggle("open", isExpanded);
  toggleBtn.innerHTML = isExpanded
    ? '<i class="fa-solid fa-chevron-up"></i> Recolher'
    : '<i class="fa-solid fa-chevron-down"></i> Ler mais';
});

/* ═══════════════════════════════════════════════════════════════
           7. INTERAÇÕES & UI
        ═══════════════════════════════════════════════════════════════ */
function handleRaycast(e) {
  mVec.set(
    (e.clientX / innerWidth) * 2 - 1,
    -(e.clientY / innerHeight) * 2 + 1,
  );
  ray.setFromCamera(mVec, camera);
  if (HOVER) {
    HOVER.isHovered = false;
    HOVER = null;
  }
  HOVER_CAT = null;
  const catHits = ray.intersectObjects(catStars),
    bookHits = ray.intersectObjects(planetMeshes);
  if (
    bookHits.length &&
    (!catHits.length || bookHits[0].distance < catHits[0].distance)
  ) {
    const bo = bookObjs.find(
      (b) => b.idx === bookHits[0].object.userData.bookIdx,
    );
    if (bo && bo.filtered && bo.searched) {
      HOVER = bo;
      bo.isHovered = true;
      showPanel(bo);
      document.getElementById("tip-cat").textContent =
        bo.data.categoria_nome || "";
      document.getElementById("tip-title").textContent = bo.data.titulo || "";
      document.getElementById("tip-author").textContent =
        bo.data.autor_nome || "";
      tipEl.classList.add("show");
      retEl.classList.add("hover");
      return;
    }
  } else if (catHits.length) {
    const name = catHits[0].object.userData.name,
      cd = catMap.get(name);
    if (cd) {
      HOVER_CAT = name;
      hidePanel();
      document.getElementById("tip-cat").textContent = "Sistema";
      document.getElementById("tip-title").textContent = name;
      document.getElementById("tip-author").textContent =
        cd.books.length + " obras";
      tipEl.classList.add("show");
      retEl.classList.add("hover");
      return;
    }
  }
  if (selBook) hidePanel();
  tipEl.classList.remove("show");
  retEl.classList.remove("hover");
}

renderer.domElement.addEventListener("click", () => {
  if (HOVER) openModal(HOVER.data);
  else if (HOVER_CAT) flyToCat(HOVER_CAT);
  else hidePanel();
});

/* ─── showPanel() COM SINOPSE ─── */
function showPanel(bo) {
  const d = bo.data;
  selBook = bo;
  const c = document.getElementById("bp-art-canvas");
  c.width = c.parentElement.clientWidth;
  c.height = 180;
  drawBookArtWithCover(c, d.titulo, d.categoria_nome, c.width, 180, d.capa);

  document.getElementById("bp-cat").textContent = d.categoria_nome || "—";
  document.getElementById("bp-title").textContent = d.titulo || "—";
  document.getElementById("bp-author").textContent = d.autor_nome || "—";
  document.getElementById("bp-year").textContent = d.ano_publicacao || "—";
  document.getElementById("bp-pub").textContent = d.editora_nome || "—";
  const bsel = document.getElementById("bp-status");
  bsel.className = "sbadge " + statusClass(d.status);
  bsel.textContent = d.status || "—";

  const synWrap = document.getElementById("bp-synopsis-wrap");
  const synText = document.getElementById("bp-synopsis-text");
  const synToggle = document.getElementById("bp-synopsis-toggle");

  synText.classList.remove("expanded");
  synToggle.classList.remove("open");
  synToggle.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Ler mais';

  if (d.sinopse && d.sinopse.trim()) {
    synText.textContent = d.sinopse;
    synWrap.style.display = "block";
    requestAnimationFrame(() => {
      const isClamped = synText.scrollHeight > synText.clientHeight + 4;
      synToggle.style.display = isClamped ? "inline-flex" : "none";
    });
  } else {
    synText.innerHTML =
      '<span class="bp-synopsis-empty">Sinopse não disponível</span>';
    synToggle.style.display = "none";
    synWrap.style.display = "block";
  }

  document.getElementById("book-panel").classList.add("open");
  
}

function hidePanel() {
  document.getElementById("book-panel").classList.remove("open");
  selBook = null;
}
document.getElementById("bp-close").addEventListener("click", hidePanel);
document.getElementById("bp-reserve").addEventListener("click", () => {
  if (selBook) openModal(selBook.data);
});
document.getElementById("bp-expand").addEventListener("click", () => {
  if (selBook) openModal(selBook.data);
});

/* ─── openModal() COM SINOPSE ─── */
let modalBook = null;

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openModal(d) {
  if (!d) return;
  modalBook = d;

  const overlay = document.getElementById("modal-overlay");
  const drawer = document.getElementById("modal-drawer");
  const mc = document.getElementById("md-art-canvas");

  if (!overlay || !drawer || !mc) {
    console.warn("[Andrômeda] Modal incompleto no DOM. Verifique #modal-overlay, #modal-drawer e #md-art-canvas.");
    return;
  }

  mc.width = mc.parentElement?.clientWidth || 720;
  mc.height = 240;
  drawBookArtWithCover(mc, d.titulo, d.categoria_nome, mc.width, 240, d.capa);

  const setText = (id, value = "—") => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  };

  setText("md-cat-badge", d.categoria_nome);
  setText("md-title", d.titulo);
  setText("md-author", d.autor_nome);
  setText("md-year", d.ano_publicacao);
  setText("md-pub", d.editora_nome);
  setText("md-catv", d.categoria_nome);
  setText("md-sv", d.status);

  const ms = document.getElementById("md-status");
  if (ms) {
    ms.className = "sbadge " + statusClass(d.status);
    ms.textContent = d.status || "—";
  }

  const mdSyn = document.getElementById("md-synopsis-text");
  if (mdSyn) {
    if (d.sinopse && d.sinopse.trim()) {
      mdSyn.textContent = d.sinopse;
      mdSyn.classList.remove("md-synopsis-empty");
    } else {
      mdSyn.innerHTML =
        '<span class="md-synopsis-empty">Sinopse não cadastrada para esta obra.</span>';
    }
  }

  const rel = LIVROS.filter(
    (l) => l.categoria_nome === d.categoria_nome && l.titulo !== d.titulo,
  ).slice(0, 4);
  const related = document.getElementById("md-related");
  if (related) {
    related.innerHTML =
      rel.length === 0
        ? '<p style="font-size:.8rem;color:var(--text-dim);font-style:italic;">Nenhuma obra relacionada</p>'
        : rel
            .map((r) => {
              const idx = LIVROS.indexOf(r);
              return `<button class="md-related-item" type="button" data-book-index="${idx}">
                      <div class="md-related-dot" style="background:${catHexStr(r.categoria_nome)};box-shadow:0 0 8px ${catHexStr(r.categoria_nome)}88;"></div>
                      <div class="md-related-info"><strong>${r.titulo || "—"}</strong><span>${r.autor_nome || "—"}</span></div>
                      <span class="sbadge ${statusClass(r.status)}">${r.status || "—"}</span>
                    </button>`;
            })
            .join("");
  }

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  drawer.scrollTop = 0;
  drawer.querySelector(".md-scroll")?.scrollTo?.(0, 0);
}

window.openModal = openModal;
window.closeModal = closeModal;


/* ═══════════════════════════════════════════════════════════════
           7.1 NOTIFICAÇÕES CÓSMICAS DO CATÁLOGO
           Substitui alert() e estiliza mensagens PHP sem alterar o PHP.
        ═══════════════════════════════════════════════════════════════ */
function noticeTypeFromClass(el) {
  if (!el) return "info";
  if (el.classList.contains("alert-success")) return "success";
  if (el.classList.contains("alert-danger")) return "danger";
  if (el.classList.contains("alert-warning")) return "warning";
  return "info";
}

function normalizeNoticeType(type) {
  const t = String(type || "info").toLowerCase();
  if (["success", "danger", "warning", "info"].includes(t)) return t;
  return "info";
}

function escapeNoticeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function noticeMeta(type) {
  const t = normalizeNoticeType(type);
  const map = {
    success: {
      icon: "fa-circle-check",
      label: "Reserva confirmada",
      code: "OK · 204",
    },
    warning: {
      icon: "fa-circle-info",
      label: "Atenção orbital",
      code: "WAIT · 302",
    },
    danger: {
      icon: "fa-triangle-exclamation",
      label: "Falha na transmissão",
      code: "ERR · 503",
    },
    info: {
      icon: "fa-satellite-dish",
      label: "Central Andrômeda",
      code: "PING · 101",
    },
  };
  return map[t] || map.info;
}

function ensureAndromedaNoticeRoot() {
  let root = document.getElementById("andromeda-notice-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "andromeda-notice-root";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-atomic", "false");
    document.body.appendChild(root);
  }
  return root;
}

function buildAndromedaNoticeInner(message, type, closeClass) {
  const meta = noticeMeta(type);
  const cleanMessage = escapeNoticeHtml(String(message || "Transmissão recebida.").trim());
  return `
    <span class="andromeda-notice-corner corner-tl" aria-hidden="true"></span>
    <span class="andromeda-notice-corner corner-br" aria-hidden="true"></span>
    <span class="andromeda-notice-scan" aria-hidden="true"></span>
    <div class="andromeda-notice-sigil" aria-hidden="true">
      <i class="fa-solid ${meta.icon}"></i>
    </div>
    <div class="andromeda-notice-content">
      <span class="andromeda-notice-kicker"><b>${meta.label}</b><em>${meta.code}</em></span>
      <p>${cleanMessage}</p>
    </div>
    <button class="${closeClass}" type="button" aria-label="Fechar aviso"><i class="fa-solid fa-xmark"></i></button>
    <span class="andromeda-notice-progress" aria-hidden="true"></span>
  `;
}

function showAndromedaNotice(message, type = "info", options = {}) {
  const t = normalizeNoticeType(type);
  const root = ensureAndromedaNoticeRoot();
  const duration = Number(options.duration || (t === "danger" ? 5600 : 4600));

  const toast = document.createElement("div");
  toast.className = `andromeda-notice andromeda-notice-${t}`;
  toast.setAttribute("role", t === "danger" ? "alert" : "status");
  toast.innerHTML = buildAndromedaNoticeInner(message, t, "andromeda-notice-close");

  const close = () => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    window.setTimeout(() => toast.remove(), 420);
  };

  toast.querySelector(".andromeda-notice-close")?.addEventListener("click", close);
  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  toast.style.setProperty("--notice-duration", `${duration}ms`);
  window.setTimeout(close, duration);
  return toast;
}

window.showAndromedaNotice = showAndromedaNotice;

function enhanceServerReserveAlerts() {
  document.querySelectorAll(".alert[role='alert']").forEach((el) => {
    if (el.dataset.andromedaEnhanced === "1") return;
    const type = noticeTypeFromClass(el);
    const originalMessage = el.textContent.trim() || "Transmissão recebida.";

    el.dataset.andromedaEnhanced = "1";
    el.classList.add("cosmic-server-alert", `cosmic-server-alert-${type}`);
    el.innerHTML = buildAndromedaNoticeInner(originalMessage, type, "cosmic-server-alert-close");

    const close = el.querySelector(".cosmic-server-alert-close");
    close?.addEventListener("click", () => {
      el.classList.add("closing");
      window.setTimeout(() => el.remove(), 420);
    });

    window.setTimeout(() => {
      if (!document.body.contains(el)) return;
      el.classList.add("closing");
      window.setTimeout(() => el.remove(), 420);
    }, 6400);
  });
}

requestAnimationFrame(enhanceServerReserveAlerts);
window.addEventListener("pageshow", enhanceServerReserveAlerts);

document
  .getElementById("modal-close")
  ?.addEventListener("click", closeModal);

document.getElementById("modal-overlay")?.addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay") closeModal();
});

document.addEventListener("click", (e) => {
  const related = e.target.closest(".md-related-item[data-book-index]");
  if (!related) return;
  const book = LIVROS[Number(related.dataset.bookIndex)];
  if (book) openModal(book);
});

document.getElementById("md-reserve")?.addEventListener("click", () => {
  if (!modalBook) return;
  const status = (modalBook.status || "").toLowerCase();
  if (!status.includes("indis")) {
    showAndromedaNotice("Somente livros indisponíveis podem ser reservados.", "warning");
    return;
  }
  const form = document.getElementById("reserva-form");
  document.getElementById("reserva-livro-id").value = modalBook.id_livro;
  form.submit();
});

/* ═══════════════════════════════════════════════════════════════
           8. CONTROLES (NAVEGAÇÃO E ZOOM)
        ═══════════════════════════════════════════════════════════════ */
function flyToCat(name) {
  activeFilter = name;
  document
    .querySelectorAll(".sys-item")
    .forEach((p) => p.classList.toggle("on", p.dataset.c === name));
  document.getElementById("sys-active-label").textContent =
    name === "all" ? "Todas Constelações" : name;
  bookObjs.forEach((b) => {
    b.filtered = name === "all" || b.data.categoria_nome === name;
    if (!b.filtered) {
      b.currentScale = 0;
      b.glow.material.opacity = 0;
      b.orbitLine.material.opacity = 0;
      b.mesh.visible = false;
    }
  });
  if (name !== "all" && activeView === "gal") {
    const cd = catMap.get(name);
    if (!cd) return;
    const sp = cd.pos,
      dir = sp.clone().normalize();
    if (dir.length() < 0.01) dir.set(0, 0, 1);
    const cp = sp.clone().add(dir.clone().multiplyScalar(30));
    cp.y += 16;
    cp.x += 6;
    camTzTarget = cp.z;
    const lbl = document.getElementById("cat-label");
    lbl.textContent = name;
    gsap.to(lbl, { opacity: 1, duration: 0.4 });
    setTimeout(() => gsap.to(lbl, { opacity: 0, duration: 1.2 }), 3000);
    gsap.to(cd.star.scale, {
      x: 2.5,
      y: 2.5,
      z: 2.5,
      duration: 1.1,
      ease: "back.out(1.2)",
    });
    gsap.to(cd.glow.material, { opacity: 1, duration: 0.5 });
    gsap.to(camLookDst, {
      x: sp.x,
      y: sp.y,
      z: sp.z,
      duration: 3.2,
      ease: "power3.inOut",
    });
    gsap.to(camera, {
      fov: 36,
      duration: 3.2,
      ease: "power3.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    });
    gsap.to(cam, {
      tx: cp.x,
      ty: cp.y,
      tz: cp.z,
      duration: 3.2,
      ease: "power3.inOut",
      onComplete: () => {
        let n = 0;
        bookObjs.forEach((b) => {
          if (b.filtered && b.searched) {
            b.mesh.visible = true;
            const d = n * 0.04;
            n++;
            gsap.to(b, {
              currentScale: 1,
              duration: 0.9,
              ease: "back.out(1.3)",
              delay: d,
            });
            gsap.to(b.glow.material, {
              opacity: 0.65,
              duration: 0.8,
              delay: d,
            });
            gsap.to(b.orbitLine.material, {
              opacity: 0.18,
              duration: 1.4,
              delay: d,
            });
          }
        });
      },
    });
  } else if (name === "all" && activeView === "gal") {
    camTzTarget = ZOOM_HOME;
    gsap.to(cam, {
      tx: 0,
      ty: 18,
      tz: ZOOM_HOME,
      duration: 3.5,
      ease: "power3.inOut",
    });
    gsap.to(camLookDst, {
      x: 0,
      y: 0,
      z: 0,
      duration: 3.5,
      ease: "power3.inOut",
    });
    gsap.to(camera, {
      fov: 48,
      duration: 3.5,
      ease: "power3.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    });
    catMap.forEach((cd) =>
      gsap.to(cd.star.scale, { x: 1, y: 1, z: 1, duration: 0.7 }),
    );
    bookObjs.forEach((b) => {
      if (b.searched) {
        b.mesh.visible = true;
        gsap.to(b, { currentScale: 1, duration: 0.7, ease: "back.out(1.5)" });
        gsap.to(b.glow.material, { opacity: 0.65, duration: 0.7 });
        gsap.to(b.orbitLine.material, { opacity: 0.1, duration: 0.7 });
      }
    });
  }
  if (activeView === "ed") buildEditorial();
}

document.getElementById("systems-menu").addEventListener("click", (e) => {
  const btn = e.target.closest(".sys-item");
  if (btn) {
    flyToCat(btn.dataset.c);
    sysMenu.classList.remove("open");
    sysBtn.classList.remove("active");
  }
});

document.getElementById("q").addEventListener("input", (e) => {
  queryStr = e.target.value.toLowerCase().trim();
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => doSearch(queryStr), 260);
});

function doSearch(q) {
  const matches = [];
  bookObjs.forEach((b) => {
    const ok =
      !q ||
      (b.data.titulo || "").toLowerCase().includes(q) ||
      (b.data.autor_nome || "").toLowerCase().includes(q) ||
      (b.data.categoria_nome || "").toLowerCase().includes(q);
    b.searched = ok;
    const vis = ok && b.filtered;
    if (!vis) {
      b.currentScale = 0;
      gsap.to(b.glow.material, { opacity: 0, duration: 0.25 });
      b.orbitLine.material.opacity = 0;
      b.mesh.visible = false;
    } else {
      b.mesh.visible = true;
      gsap.to(b, { currentScale: 1, duration: 0.45, ease: "back.out(1.5)" });
      gsap.to(b.glow.material, { opacity: 0.65, duration: 0.35 });
      if (q) matches.push(b);
    }
  });
  const cnt = bookObjs.filter((b) => b.searched && b.filtered).length,
    cntEl = document.getElementById("search-count");
  if (q) {
    cntEl.textContent = cnt;
    cntEl.classList.add("show");
  } else {
    cntEl.classList.remove("show");
  }
  if (q && matches.length && activeView === "gal") {
    let cx = 0,
      cy = 0,
      cz = 0;
    matches.forEach((b) => {
      cx += b._px || b.cd.pos.x;
      cy += b._py || b.cd.pos.y;
      cz += b._pz || b.cd.pos.z;
    });
    cx /= matches.length;
    cy /= matches.length;
    cz /= matches.length;
    camTzTarget = cz + 28;
    const fl = document.getElementById("fly-label");
    fl.textContent = `${cnt} obra${cnt !== 1 ? "s" : ""} encontrada${cnt !== 1 ? "s" : ""}`;
    gsap.to(fl, { opacity: 1, duration: 0.3 });
    setTimeout(() => gsap.to(fl, { opacity: 0, duration: 0.7 }), 2200);
    gsap.to(cam, {
      tx: cx + 10,
      ty: cy + 8,
      tz: cz + 28,
      duration: 1.8,
      ease: "power3.inOut",
    });
    gsap.to(camLookDst, {
      x: cx,
      y: cy,
      z: cz,
      duration: 1.8,
      ease: "power3.inOut",
    });
  } else if (!q && activeView === "gal") {
    camTzTarget = ZOOM_HOME;
    gsap.to(cam, { tx: 0, ty: 18, tz: ZOOM_HOME, duration: 2, ease: "power3.out" });
    gsap.to(camLookDst, { x: 0, y: 0, z: 0, duration: 2, ease: "power3.out" });
  }
  if (activeView === "ed") buildEditorial();
}

let ecoMode = false;

function syncDepthVisibility() {
  const depth = document.getElementById("depth");
  if (!depth) return;

  const shouldShow = activeView === "gal" && !ecoMode;
  depth.classList.toggle("is-visible", shouldShow);
  depth.classList.toggle("is-hidden", !shouldShow);

  // Fallback inline para vencer estados presos por GSAP/from(), troca de catálogo ou bfcache do navegador.
  depth.style.opacity = shouldShow ? "1" : "0";
  depth.style.visibility = shouldShow ? "visible" : "hidden";
  depth.style.pointerEvents = shouldShow ? "auto" : "none";
  depth.setAttribute("aria-hidden", shouldShow ? "false" : "true");

  updateDepthUI(camTzTarget);
}

function setView(v) {
  if (ecoMode && v === "gal") toggleEcoMode();
  activeView = v;
  document.getElementById("btn-gal").classList.toggle("on", v === "gal");
  document.getElementById("btn-ed").classList.toggle("on", v === "ed");
  document
    .getElementById("editorial-view")
    .classList.toggle("open", v === "ed");
  document.getElementById("canvas-dim").classList.toggle("dimmed", v !== "gal");
  syncDepthVisibility();
  document.getElementById("hud-bot").style.opacity = v === "gal" ? "1" : "0.3";
  if (v === "ed") {
    buildEditorial();
    hidePanel();
    gsap.to(bloom, { strength: 0.15, duration: 0.7 });
  } else {
    gsap.to(bloom, { strength: 1.1, duration: 0.7 });
  }
}
function toggleEcoMode() {
  ecoMode = !ecoMode;
  const btn = document.getElementById("btn-eco");
  if (ecoMode) {
    btn.classList.add("eco-active");
    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Retomar 3D';
    document.getElementById("webgl").style.opacity = 0;
    setView("ed");
  } else {
    btn.classList.remove("eco-active");
    btn.innerHTML = '<i class="fa-solid fa-leaf"></i> Modo Eco';
    document.getElementById("webgl").style.opacity = 1;
    lastTime = performance.now();
    setView("gal");
  }
}
document
  .getElementById("btn-gal")
  .addEventListener("click", () => setView("gal"));
document
  .getElementById("btn-ed")
  .addEventListener("click", () => setView("ed"));
document.getElementById("btn-eco").addEventListener("click", toggleEcoMode);

// Garante que a barra de profundidade já nasça visível no 3D,
// sem depender de entrar no catálogo e voltar.
syncDepthVisibility();
window.addEventListener("pageshow", syncDepthVisibility);

/* ═══════════════════════════════════════════════════════════════
           8.1 CARROSSEL DINÂMICO DO DESTAQUE DA SEMANA
        ═══════════════════════════════════════════════════════════════ */
let edCarouselBooks = [];
let edCarouselIndex = 0;
let edCarouselTimer = null;
let edHeroBook = null;

function safeAttr(v) {
  return String(v || "").replace(/"/g, "&quot;");
}

function pickCarouselBooks(filtered) {
  const source = filtered.length ? filtered : LIVROS;
  const score = (b) => {
    const status = (b.status || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    let points = 0;
    if (status.includes("disp")) points += 4;
    if (b.capa && b.capa !== "uploads/capas/default.jpg") points += 3;
    if (b.sinopse && b.sinopse.trim()) points += 2;
    if (b.ano_publicacao) points += 1;
    return points;
  };

  return [...source]
    .sort((a, b) => score(b) - score(a))
    .slice(0, Math.min(10, source.length));
}

function syncCatalogCarousel(instant = false) {
  const track = document.getElementById("ed-carousel-track");
  const dots = document.getElementById("ed-carousel-dots");
  if (!track || !dots || !edCarouselBooks.length) return;

  track.querySelectorAll(".ed-carousel-card").forEach((card, idx) => {
    card.classList.toggle("active", idx === edCarouselIndex);
  });
  dots.querySelectorAll(".ed-carousel-dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === edCarouselIndex);
  });

  const active = track.querySelector(`.ed-carousel-card[data-i="${edCarouselIndex}"]`);
  if (active) {
    const left = active.offsetLeft - (track.clientWidth - active.clientWidth) / 2;
    track.scrollTo({ left, behavior: instant ? "auto" : "smooth" });
  }
}

function setCatalogCarouselIndex(index, instant = false) {
  if (!edCarouselBooks.length) return;
  edCarouselIndex = (index + edCarouselBooks.length) % edCarouselBooks.length;
  syncCatalogCarousel(instant);
}

function startCatalogCarouselAuto() {
  clearInterval(edCarouselTimer);
  if (edCarouselBooks.length <= 1 || activeView !== "ed") return;
  edCarouselTimer = setInterval(() => {
    if (activeView === "ed" && !document.getElementById("modal-overlay").classList.contains("open")) {
      setCatalogCarouselIndex(edCarouselIndex + 1);
    }
  }, 6200);
}

function buildCatalogCarousel(filtered) {
  const section = document.getElementById("ed-carousel-section");
  const track = document.getElementById("ed-carousel-track");
  const dots = document.getElementById("ed-carousel-dots");
  if (!section || !track || !dots) return;

  edCarouselBooks = pickCarouselBooks(filtered);
  if (!edCarouselBooks.length) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  edCarouselIndex = clamp(edCarouselIndex, 0, edCarouselBooks.length - 1);

  track.innerHTML = edCarouselBooks
    .map((b, i) => {
      const synopsis =
        b.sinopse && b.sinopse.trim()
          ? b.sinopse.trim().substring(0, 210) + (b.sinopse.trim().length > 210 ? "…" : "")
          : "Uma obra aguardando sinopse no acervo cósmico da Biblioteca Andrômeda.";
      return `<article class="ed-carousel-card ${i === edCarouselIndex ? "active" : ""}" data-i="${i}" data-book-index="${LIVROS.indexOf(b)}" role="button" tabindex="0" aria-label="Abrir dossiê de ${safeAttr(b.titulo || "obra")}" style="--card-glow:${catHexStr(b.categoria_nome)}55">
        <div class="ed-carousel-art">
          <canvas class="ed-carousel-canvas"
            data-i="${i}"
            data-title="${safeAttr(b.titulo)}"
            data-cat="${safeAttr(b.categoria_nome)}"
            width="220" height="320"></canvas>
          <span class="ed-carousel-badge">${b.categoria_nome || "Constelação"}</span>
        </div>
        <div class="ed-carousel-content">
          <div class="ed-carousel-meta">
            <span class="ed-carousel-pill">${b.ano_publicacao || "Ano não informado"}</span>
            <span class="sbadge ${statusClass(b.status)}">${b.status || "—"}</span>
          </div>
          <h3 class="ed-carousel-book-title">${b.titulo || "—"}</h3>
          <p class="ed-carousel-author">${b.autor_nome || "Autor desconhecido"}</p>
          <p class="ed-carousel-synopsis">${synopsis}</p>
          <span class="ed-carousel-action">Abrir dossiê <i class="fa-solid fa-arrow-right-long"></i></span>
        </div>
      </article>`;
    })
    .join("");

  dots.innerHTML = edCarouselBooks
    .map((_, i) => `<button class="ed-carousel-dot ${i === edCarouselIndex ? "active" : ""}" type="button" data-i="${i}" aria-label="Ir para destaque ${i + 1}"></button>`)
    .join("");

  requestAnimationFrame(() => {
    document.querySelectorAll(".ed-carousel-canvas").forEach((c) => {
      const b = edCarouselBooks[Number(c.dataset.i)];
      drawBookArtWithCover(c, b?.titulo, b?.categoria_nome, 220, 320, b?.capa);
    });
    syncCatalogCarousel(true);
  });

  startCatalogCarouselAuto();
  enableHighlightCarouselDrag();
}

document.getElementById("ed-car-prev")?.addEventListener("click", () => {
  setCatalogCarouselIndex(edCarouselIndex - 1);
  startCatalogCarouselAuto();
});

document.getElementById("ed-car-next")?.addEventListener("click", () => {
  setCatalogCarouselIndex(edCarouselIndex + 1);
  startCatalogCarouselAuto();
});

document.getElementById("ed-carousel-dots")?.addEventListener("click", (e) => {
  const dot = e.target.closest(".ed-carousel-dot");
  if (!dot) return;
  setCatalogCarouselIndex(Number(dot.dataset.i));
  startCatalogCarouselAuto();
});

document.getElementById("ed-carousel-track")?.addEventListener("click", (e) => {
  if (performance.now() - lastCatalogModalOpen < 360) return;
  const track = e.currentTarget;
  if (track?.dataset.justDragged === "1") return;
  const card = e.target.closest(".ed-carousel-card[data-book-index]");
  if (!card) return;
  openCatalogCardModal(card);
});

function enableHighlightCarouselDrag() {
  const track = document.getElementById("ed-carousel-track");
  if (!track || track.dataset.dragReady === "1") return;
  track.dataset.dragReady = "1";
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  track.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = false;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("dragging");
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    track.scrollLeft = startLeft - dx;
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("dragging");
    if (track.hasPointerCapture?.(e.pointerId)) track.releasePointerCapture(e.pointerId);
    if (moved) {
      track.dataset.justDragged = "1";
      const cards = [...track.querySelectorAll(".ed-carousel-card")];
      let nearest = edCarouselIndex;
      let best = Infinity;
      cards.forEach((card, idx) => {
        const center = card.offsetLeft + card.clientWidth / 2;
        const dist = Math.abs(center - (track.scrollLeft + track.clientWidth / 2));
        if (dist < best) {
          best = dist;
          nearest = idx;
        }
      });
      setCatalogCarouselIndex(nearest);
      setTimeout(() => delete track.dataset.justDragged, 140);
    }
  };

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
}

/* Categoria: carrossel manual por constelação */
function scrollCategoryCarousel(button) {
  const section = button.closest(".ed-section");
  const track = section?.querySelector(".ed-scroll-wrapper");
  if (!track) return;
  const dir = Number(button.dataset.dir || 1);
  const amount = Math.max(260, Math.floor(track.clientWidth * 0.82));
  track.scrollBy({ left: dir * amount, behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const nav = e.target.closest(".ed-section-nav");
  if (nav) scrollCategoryCarousel(nav);
});

function enableCategoryDrag() {
  document.querySelectorAll(".ed-scroll-wrapper").forEach((track) => {
    if (track.dataset.dragReady === "1") return;
    track.dataset.dragReady = "1";
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    track.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, a")) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      track.classList.add("dragging");
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      track.scrollLeft = startLeft - dx;
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("dragging");
      if (track.hasPointerCapture?.(e.pointerId)) track.releasePointerCapture(e.pointerId);
      if (moved) {
        track.dataset.justDragged = "1";
        setTimeout(() => delete track.dataset.justDragged, 120);
      }
    };

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("lostpointercapture", endDrag);
  });
}

let catalogTapCandidate = null;
let lastCatalogModalOpen = 0;

function resolveBookFromCatalogCard(card) {
  if (!card) return null;
  const byIndex = LIVROS[Number(card.dataset.bookIndex)];
  if (byIndex) return byIndex;
  if (card.classList.contains("ed-carousel-card")) {
    return edCarouselBooks[Number(card.dataset.i)] || null;
  }
  return null;
}

function openCatalogCardModal(card) {
  const book = resolveBookFromCatalogCard(card);
  if (!book) return false;
  lastCatalogModalOpen = performance.now();
  openModal(book);
  return true;
}

function isCatalogCardTapTarget(target) {
  return target?.closest?.(
    ".ed-book-card[data-book-index], .ed-carousel-card[data-book-index]",
  );
}

function isCatalogControlTarget(target) {
  return !!target?.closest?.(
    ".ed-carousel-btn, .ed-carousel-dot, .ed-section-nav, #modal-overlay, input, textarea, select, a",
  );
}

// Captura o tap antes dos carrosséis. Assim o drag continua funcionando,
// mas um clique limpo em qualquer livro/destaque sempre abre o dossiê.
document.addEventListener(
  "pointerdown",
  (e) => {
    if (activeView !== "ed" || e.button !== 0 || isCatalogControlTarget(e.target)) return;
    const card = isCatalogCardTapTarget(e.target);
    if (!card) return;
    catalogTapCandidate = {
      card,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
    };
  },
  true,
);

document.addEventListener(
  "pointerup",
  (e) => {
    if (!catalogTapCandidate || catalogTapCandidate.pointerId !== e.pointerId) return;
    const tap = catalogTapCandidate;
    catalogTapCandidate = null;
    const moved = Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8;
    if (moved) return;
    requestAnimationFrame(() => openCatalogCardModal(tap.card));
  },
  true,
);

document.addEventListener(
  "click",
  (e) => {
    if (activeView !== "ed" || isCatalogControlTarget(e.target)) return;
    const card = isCatalogCardTapTarget(e.target);
    if (!card) return;

    // Evita abrir duas vezes quando o pointerup já abriu o modal.
    if (performance.now() - lastCatalogModalOpen < 360) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    if (openCatalogCardModal(card)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },
  true,
);

function openBookCardFromDataset(card) {
  const track = card.closest(".ed-scroll-wrapper");
  if (track?.dataset.justDragged === "1") return;
  openCatalogCardModal(card);
}

document.addEventListener("click", (e) => {
  const card = e.target.closest(".ed-book-card[data-book-index]");
  if (!card) return;
  openBookCardFromDataset(card);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest?.(".ed-book-card[data-book-index], .ed-carousel-card[data-book-index]");
  if (!card) return;
  e.preventDefault();
  openBookCardFromDataset(card);
});

/* ═══════════════════════════════════════════════════════════════
           9. EDITORIAL VIEW BUILDER COM SINOPSE
        ═══════════════════════════════════════════════════════════════ */
function buildEditorial() {
  const filtered = LIVROS.filter((l) => {
    const catOk = activeFilter === "all" || l.categoria_nome === activeFilter;
    const qOk =
      !queryStr ||
      (l.titulo || "").toLowerCase().includes(queryStr) ||
      (l.autor_nome || "").toLowerCase().includes(queryStr) ||
      (l.categoria_nome || "").toLowerCase().includes(queryStr);
    return catOk && qOk;
  });
  const avail = LIVROS.filter((l) =>
    (l.status || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes("disp"),
  ).length;
  document.getElementById("ed-avail").textContent = avail;

  buildCatalogCarousel(filtered);
  buildEdSections(filtered, "all");
}

function buildEdSections(filtered, catFilter) {
  const secs = document.getElementById("ed-sections");
  const cats = catFilter === "all" ? uniqCats : [catFilter];
  secs.innerHTML = cats
    .map((cat) => {
      const books = filtered.filter((l) => l.categoria_nome === cat);
      if (!books.length) return "";
      const safeCat = safeAttr(cat);
      return `<div class="ed-section" data-cat="${safeCat}">
                  <div class="ed-section-header">
                    <div>
                      <h2 class="ed-section-title">${cat}</h2>
                      <span class="ed-section-count">${books.length} obra${books.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div class="ed-section-controls" aria-label="Controles da categoria ${safeCat}">
                      <button class="ed-section-nav" type="button" data-dir="-1" aria-label="Ver obras anteriores de ${safeCat}"><i class="fa-solid fa-arrow-left"></i></button>
                      <button class="ed-section-nav" type="button" data-dir="1" aria-label="Ver próximas obras de ${safeCat}"><i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                  </div>
                  <div class="ed-scroll-wrapper" data-cat="${safeCat}">
                    ${books
                      .map((b) => {
                        const hasSyn = b.sinopse && b.sinopse.trim();
                        const snippet = hasSyn
                          ? b.sinopse.substring(0, 120) +
                            (b.sinopse.length > 120 ? "…" : "")
                          : "";
                        return `<div class="ed-book-card" data-book-index="${LIVROS.indexOf(b)}" role="button" tabindex="0" aria-label="Ver detalhes de ${safeAttr(b.titulo || "obra")}">
                          <div class="ed-book-art">
                            <canvas class="ed-card-canvas"
                              data-title="${safeAttr(b.titulo)}"
                              data-cat="${safeAttr(b.categoria_nome)}"
                              data-capa="${safeAttr(b.capa)}"
                              width="220" height="300"></canvas>
                            ${
                              hasSyn
                                ? `<div class="ed-book-synopsis-overlay">
                              <p class="ed-book-synopsis-snippet">${snippet}</p>
                              <span class="ed-book-cta">Ver detalhes</span>
                            </div>`
                                : ""
                            }
                          </div>
                          <div class="ed-book-status">
                            <span class="sbadge ${statusClass(b.status)}">${b.status || "—"}</span>
                          </div>
                          <div class="ed-book-info">
                            <h4>${b.titulo || "—"}</h4>
                            <p>${b.autor_nome || "—"}</p>
                          </div>
                        </div>`;
                      })
                      .join("")}
                  </div>
                </div>`;
    })
    .join("");

  setTimeout(
    () => {
      document.querySelectorAll(".ed-card-canvas").forEach((c) => {
        const livro = LIVROS.find((l) => l.titulo === c.dataset.title);
        drawBookArtWithCover(c, c.dataset.title, c.dataset.cat, 220, 300, livro?.capa);
      });
      enableCategoryDrag();
    },
    10,
  );
}

window.addEventListener(
  "wheel",
  (e) => {
    if (activeView !== "gal") return;
    setGalaxyZoom(camTzTarget + e.deltaY * 0.05, false);
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  if (activeView === "ed") buildEditorial();
});

/* ═══════════════════════════════════════════════════════════════
           10. RENDER LOOP
        ═══════════════════════════════════════════════════════════════ */
const clock = new THREE.Clock(),
  bhNDC = new THREE.Vector3(),
  lookVec = new THREE.Vector3(),
  orbitOffset = new THREE.Vector3(),
  yawQ = new THREE.Quaternion(),
  pitchQ = new THREE.Quaternion(),
  pitchAxis = new THREE.Vector3(),
  yAxis = new THREE.Vector3(0, 1, 0),
  xAxis = new THREE.Vector3(1, 0, 0),
  bhWorldPos = new THREE.Vector3(0, 0, 0);

const bhLensState = { radius: 0, strength: 0 };
const BH_LENS_LOCK = {
  x: 0.5,
  y: 0.5,
  radius: 0.018,
  strength: 0.0039,
  centerTolerance: 0.42,
};
let lastTime = 0;

function updateCategorySystemOrbits(dt, t = 0) {
  const shouldOrbit = activeView === "gal" && activeFilter === "all" && !ecoMode;
  const safeDt = Math.min(0.05, Math.max(0, dt || 0));

  catMap.forEach((cd) => {
    if (!cd || !Number.isFinite(cd.orbitRadius) || !Number.isFinite(cd.orbitAngle)) return;

    // As trilhas orbitais aparecem só na leitura galáctica geral.
    // Quando o usuário entra em um sistema, elas desaparecem junto com a lente.
    if (cd.orbitGuide?.material) {
      const targetOpacity = shouldOrbit ? cd.orbitGuideOpacity : 0;
      cd.orbitGuide.material.opacity += (targetOpacity - cd.orbitGuide.material.opacity) * 0.055;
      cd.orbitGuide.visible = cd.orbitGuide.material.opacity > 0.001;
    }

    if (!shouldOrbit) return;

    // Movimento orbital real em torno do buraco negro.
    // É lento, suave e acumulativo: nada salta de posição, mas em contemplação dá para sentir a mudança.
    cd.orbitAngle = normalizeAngle(cd.orbitAngle + cd.systemOrbitSpeed * safeDt);

    const orbitalFloat = Math.sin(t * cd.orbitFloatSpeed + cd.orbitPhase) * cd.orbitFloatAmp;
    cd.pos.set(
      Math.cos(cd.orbitAngle) * cd.orbitRadius,
      cd.orbitHeight + orbitalFloat,
      Math.sin(cd.orbitAngle) * cd.orbitRadius,
    );

    cd.star.position.copy(cd.pos);
    cd.glow.position.copy(cd.pos);
    cd.glow2.position.copy(cd.pos);
    cd.neb.position.copy(cd.pos);

    // Pulso mínimo para dar presença viva sem parecer videogame/cartoon.
    const pulse = 1 + Math.sin(t * 0.42 + cd.orbitPhase) * 0.018;
    cd.star.scale.setScalar(pulse);
    cd.glow.material.opacity += ((0.88 + Math.sin(t * 0.34 + cd.orbitPhase) * 0.035) - cd.glow.material.opacity) * 0.025;
    cd.glow2.material.opacity += ((0.235 + Math.sin(t * 0.29 + cd.orbitPhase) * 0.018) - cd.glow2.material.opacity) * 0.025;
  });
}

function updateBlackHoleLens() {
  // Trava final anti-bug:
  // A lente não usa projeção da câmera nem distância real da câmera.
  // Assim ela não escorrega ao arrastar/orbitar a galáxia e nunca nasce ao lado do buraco negro.
  lensPass.uniforms.uBHPos.value.set(BH_LENS_LOCK.x, BH_LENS_LOCK.y);

  const lookDistanceFromBH = Math.hypot(camLook.x, camLook.y, camLook.z);
  const targetLookDistanceFromBH = Math.hypot(camLookDst.x, camLookDst.y, camLookDst.z);

  const lensAllowed =
    activeView === "gal" &&
    activeFilter === "all" &&
    !ecoMode &&
    lookDistanceFromBH < BH_LENS_LOCK.centerTolerance &&
    targetLookDistanceFromBH < 0.08;

  if (lensAllowed) {
    bhLensState.radius += (BH_LENS_LOCK.radius - bhLensState.radius) * 0.18;
    bhLensState.strength += (BH_LENS_LOCK.strength - bhLensState.strength) * 0.18;
  } else {
    bhLensState.radius += (0 - bhLensState.radius) * 0.62;
    bhLensState.strength += (0 - bhLensState.strength) * 0.62;
  }

  lensPass.uniforms.uBHR.value = bhLensState.radius;
  lensPass.uniforms.uStr.value = bhLensState.strength;
  lensPass.enabled = bhLensState.radius > 0.00038 || bhLensState.strength > 0.00018;
}
(function animate(now) {
  requestAnimationFrame(animate);
  if (ecoMode) return;
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const t = clock.getElapsedTime();
  if (bgMat) bgMat.uniforms.uT.value = t;
  if (galMat) galMat.uniforms.uT.value = t;
  if (galDustMat) galDustMat.uniforms.uT.value = t;
  if (diskMat) diskMat.uniforms.uT.value = t;
  if (bhVisuals.group) {
    bhVisuals.group.rotation.y = t * 0.018;
    bhVisuals.rings.forEach((ring, i) => {
      ring.rotation.z += (i % 2 === 0 ? 1 : -1) * (0.0014 + i * 0.00035);
      ring.material.opacity += (((i === 0 ? 0.9 : i === 1 ? 0.58 : i === 2 ? 0.24 : 0.13) * (0.92 + 0.08 * Math.sin(t * 1.2 + i))) - ring.material.opacity) * 0.035;
    });
    bhVisuals.sprites.forEach((sp, i) => {
      sp.material.opacity += (((i === 0 ? 0.22 : i === 1 ? 0.095 : 0.038) * (0.88 + 0.12 * Math.sin(t * 0.65 + i * 1.7))) - sp.material.opacity) * 0.035;
      const base = i === 0 ? 16.0 : i === 1 ? 23.0 : 31.0;
      sp.scale.setScalar(base * (0.97 + 0.025 * Math.sin(t * 0.9 + i)));
    });
    if (bhVisuals.jets) bhVisuals.jets.rotation.y = t * 0.025;
  }
  updateCategorySystemOrbits(dt, t);
  if (lensPass?.uniforms?.uTime) lensPass.uniforms.uTime.value = t;
  cam.tz += (camTzTarget - cam.tz) * 0.08;
  baseCamPos.x += (cam.tx - baseCamPos.x) * 0.016;
  baseCamPos.y += (cam.ty - baseCamPos.y) * 0.016;
  baseCamPos.z += (cam.tz - baseCamPos.z) * 0.02;
  camLook.x += (camLookDst.x - camLook.x) * 0.018;
  camLook.y += (camLookDst.y - camLook.y) * 0.018;
  camLook.z += (camLookDst.z - camLook.z) * 0.018;

  galaxyOrbit.yaw += (galaxyOrbit.targetYaw - galaxyOrbit.yaw) * 0.085;
  galaxyOrbit.pitch += (galaxyOrbit.targetPitch - galaxyOrbit.pitch) * 0.085;

  lookVec.set(camLook.x, camLook.y, camLook.z);
  orbitOffset.copy(baseCamPos).sub(lookVec);
  yawQ.setFromAxisAngle(yAxis, galaxyOrbit.yaw);
  pitchAxis.copy(xAxis).applyQuaternion(yawQ);
  pitchQ.setFromAxisAngle(pitchAxis, galaxyOrbit.pitch);
  orbitOffset.applyQuaternion(yawQ).applyQuaternion(pitchQ);
  camera.position.copy(lookVec).add(orbitOffset);
  camera.lookAt(lookVec);
  updateBlackHoleLens();
  bookObjs.forEach((b) => {
    b.oAng += b.oSpd * 0.005;
    const px = b.cd.pos.x + Math.cos(b.oAng) * b.oRad * Math.cos(b.tiltX),
      py = b.cd.pos.y + Math.sin(b.oAng) * b.oRad * Math.sin(b.tiltZ) * 0.38,
      pz = b.cd.pos.z + Math.sin(b.oAng) * b.oRad * Math.cos(b.tiltX);
    b._px = px;
    b._py = py;
    b._pz = pz;
    if (b.orbitLine) b.orbitLine.position.copy(b.cd.pos);
    if (b.filtered && b.searched) {
      const fs = b.sz * b.currentScale;
      b.mesh.position.set(px, py, pz);
      b.mesh.scale.setScalar(fs);
      b._spinY = (b._spinY || 0) + 0.008 * (b.isHovered ? 4 : 1);
      b.mesh.rotation.y = b._spinY;
      b.mesh.visible = b.currentScale > 0.02;
    } else {
      b.mesh.visible = false;
    }
    if (b.glow.visible) {
      b.glow.position.set(px, py, pz);
      b.glow.material.opacity +=
        (b.isHovered
          ? 1.2
          : (b.currentScale > 0.02 ? 0.6 : 0) - b.glow.material.opacity) * 0.1;
    }
  });
  catMap.forEach((cd) => {
    const p = 0.68 + 0.32 * Math.sin(t * 1.2 + cd.pos.x * 0.09);
    cd.glow.material.opacity = p * 0.88;
    cd.glow2.material.opacity = p * 0.22;
    cd.neb.material.opacity =
      0.058 + 0.025 * Math.sin(t * 0.55 + cd.pos.z * 0.07);
    cd.star.rotation.y = t * 0.2;
    cd.star.scale.setScalar(0.95 + 0.05 * Math.sin(t * 2 + cd.pos.x * 0.15));
  });
  updateConstellations();
  updateDepthUI(cam.tz);
  bloom.strength = 1.02 + 0.46 * clamp(1 - (cam.tz - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN), 0, 1);
  composer.render();
})();

baseCamPos.set(0, 55, 220);
camera.position.copy(baseCamPos);
gsap.to(baseCamPos, {
  y: 22,
  z: ZOOM_HOME,
  duration: 3.5,
  ease: "power3.out",
  delay: INTRO_DUR - 0.5,
});
gsap.from("#hud", {
  opacity: 0,
  y: -20,
  duration: 1.4,
  ease: "power3.out",
  delay: INTRO_DUR + 0.2,
});
gsap.from("#nav", {
  opacity: 0,
  x: -30,
  duration: 1.4,
  ease: "power3.out",
  delay: INTRO_DUR,
});
gsap.fromTo("#hud-bot, #depth",
  { opacity: 0 },
  {
    opacity: 1,
    duration: 1.4,
    ease: "power3.out",
    delay: INTRO_DUR + 0.5,
    onComplete: syncDepthVisibility,
  },
);
gsap.from("#scroll-hint", {
  opacity: 0,
  duration: 1,
  delay: INTRO_DUR + 1.2,
  onComplete: () =>
    gsap.to("#scroll-hint", { opacity: 0, delay: 4, duration: 1.6 }),
});

// Fallback final: alguns navegadores preservam inline styles antigos ao voltar pelo histórico.
gsap.delayedCall(INTRO_DUR + 2.2, syncDepthVisibility);
requestAnimationFrame(syncDepthVisibility);

function solicitarReserva(idLivro) {
  if (typeof ID_USUARIO_LOGADO !== "undefined" && ID_USUARIO_LOGADO === 0) {
    showAndromedaNotice(
      "Identidade não verificada. Faça login para entrar na fila de reserva.",
      "warning",
      { duration: 3600 },
    );
    window.setTimeout(() => {
      window.location.href = "login.php";
    }, 1100);
    return;
  }

  const fd = new FormData();
  fd.append("acao", "reservar");
  fd.append("id_livro", idLivro);

  fetch("reservas.php", {
    method: "POST",
    body: fd,
  })
    .then((res) => res.json())
    .then((data) => {
      const ok = data.status === "success";
      showAndromedaNotice(
        data.mensagem || (ok ? "Reserva registrada com sucesso." : "Não foi possível registrar a reserva."),
        ok ? "success" : "warning",
      );
      if (ok) {
        window.setTimeout(() => location.reload(), 1400);
      }
    })
    .catch((err) => {
      console.error("Erro na transmissão estelar:", err);
      showAndromedaNotice("Falha na transmissão da reserva. Tente novamente.", "danger");
    });
}
