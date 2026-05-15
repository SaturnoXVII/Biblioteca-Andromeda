const INTRO_DUR = Number.isFinite(window.ANDROMEDA_CORE_INTRO_DELAY) ? window.ANDROMEDA_CORE_INTRO_DELAY : 0.65;
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

function getRendererPixelRatio() {
  const base = window.devicePixelRatio || 1;
  const limit = window.innerWidth < 760 ? 1.22 : window.innerWidth < 1180 ? 1.42 : 1.68;
  return Math.min(base, limit);
}

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(getRendererPixelRatio());
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

function estimateSystemOuterOrbit(bookCount) {
  let maxOrbit = 7.2;
  for (let i = 0; i < Math.max(1, bookCount); i++) {
    const orbitSlot = i % 7;
    const orbitBand = Math.floor(i / 7);
    maxOrbit = Math.max(maxOrbit, 5.05 + orbitSlot * 1.42 + orbitBand * 0.96 + 0.28);
  }
  return maxOrbit;
}

function buildSafeSystemOrbitLayout(names) {
  const counts = new Map();
  LIVROS.forEach((book) => {
    const category = book.categoria_nome;
    if (!category) return;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const entries = names.map((name, idx) => {
    const seed = hashString(name);
    const bookCount = counts.get(name) || 1;
    const outerOrbit = estimateSystemOuterOrbit(bookCount);
    return {
      name,
      idx,
      seed,
      bookCount,
      outerOrbit,
      footprint: Math.max(15.5, outerOrbit + 6.8),
    };
  });

  const rings = [];
  let radius = 46;
  let currentRing = { radius, entries: [], maxFootprint: 0 };

  entries.forEach((entry) => {
    const nextMaxFootprint = Math.max(currentRing.maxFootprint, entry.footprint);
    const minArc = Math.max(31, nextMaxFootprint * 2.35);
    const capacity = Math.max(3, Math.floor((Math.PI * 2 * currentRing.radius) / minArc));

    if (currentRing.entries.length >= capacity) {
      rings.push(currentRing);
      radius += currentRing.maxFootprint + entry.footprint + 14;
      currentRing = { radius, entries: [], maxFootprint: 0 };
    }

    currentRing.entries.push(entry);
    currentRing.maxFootprint = Math.max(currentRing.maxFootprint, entry.footprint);
  });

  if (currentRing.entries.length) rings.push(currentRing);

  const layout = new Map();
  const golden = Math.PI * (3 - Math.sqrt(5));

  rings.forEach((ring, ringIndex) => {
    const laneSpeed = (0.00125 + ringIndex * 0.00018) * (ringIndex % 2 === 0 ? 1 : -1);
    const ringOffset = ringIndex * golden + 0.38;
    const total = Math.max(1, ring.entries.length);

    ring.entries.forEach((entry, slotIndex) => {
      const microJitter = (((entry.seed % 97) / 97) - 0.5) * 0.045;
      const angle = ringOffset + (slotIndex / total) * Math.PI * 2 + microJitter;
      const height = ((slotIndex % 3) - 1) * 1.1 + (ringIndex % 2 === 0 ? -0.25 : 0.25);

      layout.set(entry.name, {
        angle,
        radius: ring.radius,
        height,
        ringIndex,
        laneSpeed,
        footprint: entry.footprint,
        outerOrbit: entry.outerOrbit,
      });
    });
  });

  return {
    map: layout,
    maxRadius: rings.reduce((max, ring) => Math.max(max, ring.radius + ring.maxFootprint), 0),
  };
}

const SAFE_SYSTEM_LAYOUT = buildSafeSystemOrbitLayout(uniqCats);

uniqCats.forEach((name, idx) => {
  const btn = document.createElement("div");
  btn.className = "sys-item";
  btn.dataset.c = name;
  btn.innerHTML = `<div class="sys-dot" style="color:${catHexStr(name)}"></div>${name}`;
  sysList.appendChild(btn);

  const safeOrbit = SAFE_SYSTEM_LAYOUT.map.get(name) || {
    angle: idx * Math.PI * (3 - Math.sqrt(5)),
    radius: 46 + idx * 24,
    height: 0,
    laneSpeed: 0.0012,
    footprint: 17,
    outerOrbit: 9,
    ringIndex: idx,
  };
  const ang = safeOrbit.angle,
    rad = safeOrbit.radius;
  const x = Math.cos(ang) * rad,
    y = safeOrbit.height,
    z = Math.sin(ang) * rad;
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
    orbitRadius: Math.max(46, Math.hypot(x, z)),
    orbitAngle: Math.atan2(z, x),
    orbitHeight: y,
    orbitPhase: (systemSeed % 1000) * 0.006283,
    orbitFloatAmp: 0.045 + (systemSeed % 5) * 0.012,
    orbitFloatSpeed: 0.14 + (systemSeed % 7) * 0.009,
    orbitGuideOpacity: 0.008 + (safeOrbit.ringIndex % 4) * 0.002,
    systemOrbitSpeed: safeOrbit.laneSpeed,
    systemFootprint: safeOrbit.footprint,
    systemOuterOrbit: safeOrbit.outerOrbit,
    orbitLane: safeOrbit.ringIndex,
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
const ZOOM_SYSTEM_SPAN = SAFE_SYSTEM_LAYOUT.maxRadius || 0;
const ZOOM_MAX = Math.max(168, ZOOM_SYSTEM_SPAN + 58, 132 + Math.sqrt(Math.max(uniqCats.length, 1)) * 9.5);
const ZOOM_HOME = Math.min(
  ZOOM_MAX - 38,
  Math.max(104, Math.min(138, 94 + Math.sqrt(Math.max(uniqCats.length, 1)) * 3.4 + Math.max(0, ZOOM_SYSTEM_SPAN - 112) * 0.18)),
);
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
    "#nav, #hud, #systems-menu, #book-panel, #modal-overlay, #editorial-view, #depth, #andromeda-ai, .ai-chat-overlay, button, a, input, textarea, select",
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

const magneticSelector = ".nav-item, .sys-item, .hud-btn, .btn-prim, .btn-sec, .view-tog button, .bp-close, .md-close, .ed-hero-btn, .ed-book-card, .bp-synopsis-toggle, .ed-carousel-btn, .ed-carousel-dot, .ed-section-nav, .depth-track, .depth-reset, .ranking-leitor-card, .reserva-card, .ai-chat-fab, .ai-chat-close, .ai-switch-btn, .ai-top-icon, .ai-send-button, .ai-quick-actions button, .ai-book-card";
let magneticTargets = [];
let magneticRefreshQueued = false;

function refreshMagneticTargets() {
  magneticTargets = Array.from(document.querySelectorAll(magneticSelector));
  magneticRefreshQueued = false;
}

function queueMagneticRefresh() {
  if (magneticRefreshQueued) return;
  magneticRefreshQueued = true;
  requestAnimationFrame(refreshMagneticTargets);
}

queueMagneticRefresh();
window.addEventListener("resize", queueMagneticRefresh, { passive: true });
document.addEventListener("DOMContentLoaded", queueMagneticRefresh, { once: true });

let raycastRaf = 0;
let lastPointerEvent = null;

document.addEventListener("pointermove", (e) => {
  tgtX = e.clientX;
  tgtY = e.clientY;
  mX = (e.clientX / innerWidth - 0.5) * 2;
  mY = (e.clientY / innerHeight - 0.5) * 2;
  if (tipEl) {
    tipEl.style.left = e.clientX + 20 + "px";
    tipEl.style.top = e.clientY - 10 + "px";
  }
  if (activeView === "gal" && activeFilter === "all") {
    cam.tx = mX * 12;
    cam.ty = 18 - mY * 7;
  }
  if (activeView === "gal") {
    lastPointerEvent = e;
    if (!raycastRaf) {
      raycastRaf = requestAnimationFrame(() => {
        raycastRaf = 0;
        if (lastPointerEvent && activeView === "gal") handleRaycast(lastPointerEvent);
      });
    }
  }
  isMag = Boolean(e.target.closest?.(magneticSelector));
}, { passive: true });

(function animCursor() {
  if (!document.hidden && retEl && retDot) {
    const eas = isMag ? 0.42 : 0.34;
    retX += (tgtX - retX) * eas;
    retY += (tgtY - retY) * eas;
    dotX += (tgtX - dotX) * 0.78;
    dotY += (tgtY - dotY) * 0.78;
    retEl.style.transform = `translate3d(${retX}px, ${retY}px, 0) translate(-50%, -50%)`;
    retDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
    retEl.classList.toggle("hover", isMag);
  }
  requestAnimationFrame(animCursor);
})();

if (retEl) {
  document.addEventListener("mousedown", () => retEl.classList.add("click"), { passive: true });
  document.addEventListener("mouseup", () => retEl.classList.remove("click"), { passive: true });
}

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


function refreshAIFabContextVisibility(forceHidden = null) {
  const fab = document.getElementById("ai-chat-fab");
  if (!fab) return;

  const bookPanel = document.getElementById("book-panel");
  const modalOverlay = document.getElementById("modal-overlay");
  const shouldHide = forceHidden === null
    ? Boolean(bookPanel?.classList.contains("open") || modalOverlay?.classList.contains("open"))
    : Boolean(forceHidden);

  fab.classList.toggle("is-context-hidden", shouldHide);
  document.body.classList.toggle("ai-book-context-active", shouldHide);
  fab.setAttribute("aria-hidden", shouldHide ? "true" : "false");

  if (shouldHide) {
    fab.setAttribute("tabindex", "-1");
  } else {
    fab.removeAttribute("tabindex");
  }
}

function handleRaycast(e) {
  if (e.target?.closest?.("#book-panel")) {
    tipEl?.classList.remove("show");
    retEl?.classList.remove("hover");
    refreshAIFabContextVisibility(true);
    return;
  }

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

  const panel = document.getElementById("book-panel");
  panel.classList.add("open");
  refreshAIFabContextVisibility(true);
  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      panel,
      { x: 22, opacity: 0.86, filter: "blur(8px)" },
      { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.58, ease: "power3.out", overwrite: true },
    );
    gsap.fromTo(
      panel.querySelectorAll("#bp-title, #bp-author, .bp-meta-row, .bp-rating-mini, #bp-synopsis-wrap, .bp-actions button"),
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, stagger: 0.035, ease: "power2.out", overwrite: true },
    );
  }
  
}

function hidePanel() {
  const panel = document.getElementById("book-panel");
  if (!panel) return;
  if (typeof gsap !== "undefined" && panel.classList.contains("open")) {
    gsap.to(panel, {
      x: 18,
      opacity: 0.86,
      filter: "blur(5px)",
      duration: 0.24,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        panel.classList.remove("open");
        panel.style.opacity = "";
        panel.style.transform = "";
        panel.style.filter = "";
        refreshAIFabContextVisibility();
      },
    });
  } else {
    panel.classList.remove("open");
    refreshAIFabContextVisibility();
  }
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
  const drawer = document.getElementById("modal-drawer");
  if (!overlay) return;
  if (typeof gsap !== "undefined" && overlay.classList.contains("open")) {
    gsap.to(drawer, { y: 24, scale: 0.985, opacity: 0, filter: "blur(8px)", duration: 0.28, ease: "power2.in", overwrite: true });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.inOut",
      overwrite: true,
      onComplete: () => {
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        refreshAIFabContextVisibility();
        overlay.style.opacity = "";
        if (drawer) {
          drawer.style.opacity = "";
          drawer.style.transform = "";
          drawer.style.filter = "";
        }
      },
    });
    return;
  }
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  refreshAIFabContextVisibility();
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
  refreshAIFabContextVisibility(true);
  drawer.scrollTop = 0;
  drawer.querySelector(".md-scroll")?.scrollTo?.(0, 0);
  if (typeof gsap !== "undefined") {
    gsap.killTweensOf([overlay, drawer]);
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: "power2.out", overwrite: true });
    gsap.fromTo(
      drawer,
      { y: 34, scale: 0.985, opacity: 0, filter: "blur(12px)" },
      { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.64, ease: "expo.out", overwrite: true },
    );
    gsap.fromTo(
      drawer.querySelectorAll("#md-cat-badge, #md-title, #md-author, .md-grid > *, .md-synopsis-section, .md-rating-section, .md-related-item, #md-reserve"),
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.46, stagger: 0.035, ease: "power2.out", delay: 0.1, overwrite: true },
    );
  }
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

document.getElementById("md-reserve")?.addEventListener("click", (event) => {
  if (!modalBook) return;
  event.preventDefault();
  const status = (modalBook.status || "").toLowerCase();
  if (!status.includes("indis")) {
    showAndromedaNotice("Somente livros indisponíveis podem ser reservados.", "warning");
    return;
  }
  const form = document.getElementById("reserva-form");
  const hidden = document.getElementById("reserva-livro-id");
  if (hidden) hidden.value = modalBook.id_livro;
  if (typeof reservarLivroAndromeda === "function") {
    reservarLivroAndromeda(modalBook.id_livro, event.currentTarget);
    return;
  }
  if (form) {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  }
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

const ECO_STORAGE_KEY = "andromeda_catalogo_eco_mode";
let ecoMode = localStorage.getItem(ECO_STORAGE_KEY) === "1";
let galaxyLoopRaf = null;

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
  if (ecoMode && v === "gal") v = "ed";
  activeView = v;
  document.body.classList.toggle("gal-view-active", v === "gal");
  document.body.classList.toggle("ed-view-active", v === "ed");
  document.getElementById("btn-gal").classList.toggle("on", v === "gal");
  document.getElementById("btn-ed").classList.toggle("on", v === "ed");
  const editorialView = document.getElementById("editorial-view");
  editorialView?.classList.toggle("open", v === "ed");
  document.getElementById("canvas-dim").classList.toggle("dimmed", v !== "gal");
  syncDepthVisibility();
  document.getElementById("hud-bot").style.opacity = v === "gal" ? "1" : "0.3";
  if (v === "ed") {
    buildEditorial();
    hidePanel();
    requestAnimationFrame(() => {
      editorialView?.focus?.({ preventScroll: true });
      if (editorialView) editorialView.style.pointerEvents = "auto";
    });
    gsap.to(bloom, { strength: 0.15, duration: 0.7 });
  } else {
    if (editorialView) editorialView.style.pointerEvents = "";
    gsap.to(bloom, { strength: 1.1, duration: 0.7 });
  }
}
function applyEcoModeState() {
  const btn = document.getElementById("btn-eco");
  const webgl = document.getElementById("webgl");
  localStorage.setItem(ECO_STORAGE_KEY, ecoMode ? "1" : "0");
  document.body.classList.toggle("eco-mode-active", ecoMode);
  if (btn) {
    btn.classList.toggle("eco-active", ecoMode);
    btn.innerHTML = ecoMode ? '<i class="fa-solid fa-bolt"></i> Retomar 3D' : '<i class="fa-solid fa-leaf"></i> Modo Eco';
  }
  if (webgl) webgl.style.opacity = ecoMode ? 0 : 1;
  if (window.gsap) {
    if (ecoMode) {
      gsap.globalTimeline.clear();
      gsap.set(["#hud", "#nav", "#hud-bot", "#depth", "#editorial-view"], { clearProps: "all" });
    } else {
      gsap.globalTimeline.resume();
    }
  }
  syncDepthVisibility();
}

function stopGalaxyLoop() {
  if (galaxyLoopRaf) {
    cancelAnimationFrame(galaxyLoopRaf);
    galaxyLoopRaf = null;
  }
}

function startGalaxyLoop() {
  if (ecoMode || galaxyLoopRaf) return;
  lastTime = performance.now();
  galaxyLoopRaf = requestAnimationFrame(animateGalaxyFrame);
}

function toggleEcoMode() {
  ecoMode = !ecoMode;
  applyEcoModeState();
  if (ecoMode) {
    stopGalaxyLoop();
    setView("ed");
  } else {
    setView("gal");
    startGalaxyLoop();
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
document.body.classList.add("gal-view-active");

function isOverlayScrollLocked() {
  return document.body.classList.contains("modal-open") ||
    document.getElementById("modal-overlay")?.classList.contains("open") ||
    document.getElementById("reservas-panel")?.classList.contains("open");
}

function isNestedHorizontalScrollTarget(target) {
  return !!target?.closest?.(".ed-scroll-wrapper, .ed-carousel-track, .ed-carousel-dots, .ed-carousel-controls, .ed-section-controls");
}

window.addEventListener("wheel", (event) => {
  if (activeView !== "ed" || isOverlayScrollLocked()) return;
  const editorialView = document.getElementById("editorial-view");
  if (!editorialView?.classList.contains("open")) return;
  if (isNestedHorizontalScrollTarget(event.target) && Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if (editorialView.scrollHeight <= editorialView.clientHeight + 2) return;
  event.preventDefault();
  editorialView.scrollTop += event.deltaY;
}, { passive: false });

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
          : "Um volume ainda envolto em névoa, aguardando a revelação do seu próximo leitor.";
      return `<article class="ed-carousel-card ${i === edCarouselIndex ? "active" : ""}" data-i="${i}" data-book-index="${LIVROS.indexOf(b)}" data-book-id="${safeAttr(catalogBookId(b))}" role="button" tabindex="0" aria-label="Abrir dossiê de ${safeAttr(b.titulo || "obra")}" style="--card-glow:${catHexStr(b.categoria_nome)}55">
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

function catalogBookId(book) {
  return String(book?.id_livro ?? book?.id ?? book?.idLivro ?? book?.codigo ?? "").trim();
}

function findCatalogBookById(id) {
  const target = String(id ?? "").trim();
  if (!target) return null;
  return LIVROS.find((book) => catalogBookId(book) === target) || null;
}

function highlightCatalogDeepLinkCard(card) {
  if (!card) return;
  card.classList.add("deep-link-focus");
  setTimeout(() => card.classList.remove("deep-link-focus"), 2600);
}

function openCatalogBookFromURL() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("livro") || params.get("id_livro") || params.get("book") || params.get("obra");
  if (!requested) return;

  const book = findCatalogBookById(requested);
  if (!book) {
    window.showAndromedaNotice?.("Não encontrei esse livro no catálogo atual.", "warning");
    return;
  }

  const openTarget = () => {
    queryStr = "";
    activeFilter = "all";
    const searchInput = document.querySelector(".hud-search input");
    if (searchInput) searchInput.value = "";
    setView("ed");
    buildEditorial();

    const index = LIVROS.indexOf(book);
    const card = document.querySelector(`.ed-book-card[data-book-index="${index}"], .ed-carousel-card[data-book-index="${index}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      highlightCatalogDeepLinkCard(card);
    }

    setTimeout(() => {
      openModal(book);
      if (typeof renderAvaliacoesAndromeda === "function") renderAvaliacoesAndromeda();
    }, card ? 620 : 240);
  };

  requestAnimationFrame(() => setTimeout(openTarget, 320));
}

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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", openCatalogBookFromURL, { once: true });
} else {
  openCatalogBookFromURL();
}

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
                        const overlaySnippet = hasSyn
                          ? snippet
                          : "Um volume envolto em névoa, aguardando a próxima órbita de leitura.";
                        return `<div class="ed-book-card" data-book-index="${LIVROS.indexOf(b)}" data-book-id="${safeAttr(catalogBookId(b))}" role="button" tabindex="0" aria-label="Ver detalhes de ${safeAttr(b.titulo || "obra")}">
                          <div class="ed-book-art">
                            <canvas class="ed-card-canvas"
                              data-title="${safeAttr(b.titulo)}"
                              data-cat="${safeAttr(b.categoria_nome)}"
                              data-capa="${safeAttr(b.capa)}"
                              width="220" height="300"></canvas>
                            <div class="ed-book-synopsis-overlay">
                              <span class="ed-book-overlay-kicker">${b.categoria_nome || "Constelação"}</span>
                              <h5 class="ed-book-overlay-title">${b.titulo || "—"}</h5>
                              <p class="ed-book-overlay-author">${b.autor_nome || "Autor desconhecido"}</p>
                              <p class="ed-book-synopsis-snippet">${overlaySnippet}</p>
                              <span class="ed-book-cta">Abrir dossiê</span>
                            </div>
                          </div>
                          <div class="ed-book-status">
                            <span class="sbadge ${statusClass(b.status)}">${b.status || "—"}</span>
                          </div>
                          <div class="ed-book-info">
                            <span class="ed-book-kicker">${b.categoria_nome || "Constelação"}</span>
                            <h4 class="ed-book-title">${b.titulo || "—"}</h4>
                            <div class="ed-book-meta-row">
                              <p class="ed-book-author">${b.autor_nome || "—"}</p>
                              <span class="ed-book-link-label">Ler</span>
                            </div>
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

let catalogResizeRaf = 0;
window.addEventListener(
  "resize",
  () => {
    cancelAnimationFrame(catalogResizeRaf);
    catalogResizeRaf = requestAnimationFrame(() => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getRendererPixelRatio());
      renderer.setSize(innerWidth, innerHeight);
      composer.setSize(innerWidth, innerHeight);
      if (activeView === "ed") buildEditorial();
      syncDepthVisibility();
    });
  },
  { passive: true },
);

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
function animateGalaxyFrame(now) {
  galaxyLoopRaf = null;
  if (ecoMode || document.hidden) return;
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
      const targetGlow = b.isHovered ? 1.2 : b.currentScale > 0.02 ? 0.6 : 0;
      b.glow.material.opacity += (targetGlow - b.glow.material.opacity) * 0.1;
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
  if (!ecoMode && !document.hidden) galaxyLoopRaf = requestAnimationFrame(animateGalaxyFrame);
}
startGalaxyLoop();

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

async function solicitarReserva(idLivro) {
  const userId = Number(window.USUARIO_LOGADO_ID ?? window.ID_USUARIO_LOGADO ?? 0);
  if (userId === 0) {
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
  fd.append("action", "reservar_livro");
  fd.append("livro_id", String(idLivro));

  try {
    const res = await fetch("catalogo.php", {
      method: "POST",
      body: fd,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });
    const text = await res.text();
    const jsonStart = text.indexOf("{");
    const data = JSON.parse(jsonStart >= 0 ? text.slice(jsonStart) : text);
    showAndromedaNotice(
      data.mensagem || (data.sucesso ? "Reserva registrada com sucesso." : "Não foi possível registrar a reserva."),
      data.tipo || (data.sucesso ? "success" : "warning"),
    );
    if (data.sucesso && Array.isArray(data.reservas) && Array.isArray(window.MINHAS_RESERVAS)) {
      window.MINHAS_RESERVAS.splice(0, window.MINHAS_RESERVAS.length, ...data.reservas);
      window.setTimeout(() => {
        if (typeof window.abrirPainelReservas === "function") window.abrirPainelReservas();
      }, 420);
    }
  } catch (err) {
    console.error("Erro na transmissão estelar:", err);
    showAndromedaNotice("Falha na transmissão da reserva. Tente novamente.", "danger");
  }
}

(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  ready(() => {
    if (typeof gsap === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = ".ed-header-refined, .ed-carousel-section, .ed-catalog-divider, .ed-section, .ranking-leitores-shell, .ranking-leitor-card, .reservas-dialog, .md-rating-section";

    gsap.set(revealTargets, { transformOrigin: "50% 60%" });

    const reveal = (root = document) => {
      const items = root.querySelectorAll(revealTargets);
      if (!items.length) return;
      if (prefersReduced) {
        gsap.set(items, { clearProps: "opacity,transform,filter" });
        return;
      }
      items.forEach((item, index) => {
        if (item.dataset.gsapPolished === "1") return;
        item.dataset.gsapPolished = "1";
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 26, filter: "blur(10px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.72, delay: Math.min(index * 0.035, 0.28), ease: "power3.out", overwrite: true },
        );
      });
    };

    reveal();

    const editorial = document.getElementById("editorial-view");
    if (editorial) {
      const observer = new MutationObserver(() => requestAnimationFrame(() => reveal(editorial)));
      observer.observe(editorial, { childList: true, subtree: true });
    }

    document.addEventListener("pointerover", (event) => {
      const card = event.target.closest?.(".ed-carousel-card, .ranking-leitor-card, .reserva-card");
      if (!card || prefersReduced) return;
      gsap.to(card, { y: -5, scale: 1.01, duration: 0.32, ease: "power2.out", overwrite: true });
    }, true);

    document.addEventListener("pointerout", (event) => {
      const card = event.target.closest?.(".ed-carousel-card, .ranking-leitor-card, .reserva-card");
      if (!card || prefersReduced) return;
      gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power2.out", overwrite: true });
    }, true);
  });
})();


/* ═══════════════════════════════════════════════════════════════
   PATCH V3 — POSIÇÃO DO MENU DE CATEGORIAS + ENTRADA ORBITAL
   ═══════════════════════════════════════════════════════════════ */
(function refineCatalogHudV3() {
  const btn = document.getElementById("btn-systems");
  const menu = document.getElementById("systems-menu");
  const depth = document.getElementById("depth");

  function placeSystemsMenu() {
    if (!btn || !menu) return;

    const rect = btn.getBoundingClientRect();
    const gap = 14;
    const safe = 14;
    const preferredWidth = Math.max(270, Math.min(340, rect.width + 120));
    const width = Math.min(preferredWidth, window.innerWidth - safe * 2);
    let left = rect.left;

    if (left + width > window.innerWidth - safe) {
      left = window.innerWidth - width - safe;
    }
    left = Math.max(safe, left);

    const arrowX = Math.max(24, Math.min(width - 24, rect.left + rect.width / 2 - left - 7));

    menu.style.width = `${Math.round(width)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(rect.bottom + gap)}px`;
    menu.style.right = "auto";
    menu.style.bottom = "auto";
    menu.style.setProperty("--menu-arrow-x", `${Math.round(arrowX)}px`);
  }

  function animateSystemsOpen() {
    if (!menu || !menu.classList.contains("open")) return;
    placeSystemsMenu();

    if (window.gsap) {
      gsap.killTweensOf(menu);
      gsap.fromTo(
        menu,
        { opacity: 0, y: -8, scale: 0.985, filter: "blur(4px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.32, ease: "power3.out" },
      );
      gsap.fromTo(
        menu.querySelectorAll(".sys-item"),
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", stagger: 0.025, delay: 0.05 },
      );
    }
  }

  function animateSystemsClose() {
    if (!menu || menu.classList.contains("open") || !window.gsap) return;
    gsap.killTweensOf(menu);
    gsap.to(menu, {
      opacity: 0,
      y: -8,
      scale: 0.985,
      filter: "blur(3px)",
      duration: 0.2,
      ease: "power2.inOut",
    });
  }

  if (btn && menu) {
    btn.addEventListener("click", () => requestAnimationFrame(animateSystemsOpen));
    window.addEventListener("resize", () => {
      if (menu.classList.contains("open")) placeSystemsMenu();
    }, { passive: true });
    window.addEventListener("scroll", () => {
      if (menu.classList.contains("open")) placeSystemsMenu();
    }, { passive: true });
    document.addEventListener("click", () => requestAnimationFrame(animateSystemsClose));
    placeSystemsMenu();
  }

  if (depth && window.gsap) {
    gsap.set(depth, { transformOrigin: "center right" });
  }
})();


/* ═══════════════════════════════════════════════════════════════
   PATCH FINAL — HUD, CATEGORIAS, RESERVAS E ESTABILIDADE VISUAL
   ═══════════════════════════════════════════════════════════════ */
(function andromedaFinalPatch() {
  const ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  };

  ready(() => {
    const btn = document.getElementById("btn-systems");
    const menu = document.getElementById("systems-menu");
    const reservas = document.getElementById("reservas-panel");

    function placeSystemsMenuFinal() {
      if (!btn || !menu) return;

      const rect = btn.getBoundingClientRect();
      const safe = 14;
      const gap = 12;
      const mobile = window.innerWidth <= 760;
      const width = mobile
        ? Math.max(260, window.innerWidth - safe * 2)
        : Math.min(Math.max(292, rect.width + 126), window.innerWidth - safe * 2, 360);

      let left = mobile ? safe : rect.left;
      if (!mobile && left + width > window.innerWidth - safe) left = window.innerWidth - width - safe;
      left = Math.max(safe, left);

      const top = Math.min(rect.bottom + gap, window.innerHeight - 96);
      const arrow = Math.max(22, Math.min(width - 28, rect.left + rect.width / 2 - left - 7));
      const availableHeight = Math.max(220, window.innerHeight - top - safe);

      menu.style.position = "fixed";
      menu.style.left = `${Math.round(left)}px`;
      menu.style.top = `${Math.round(top)}px`;
      menu.style.right = "auto";
      menu.style.bottom = "auto";
      menu.style.width = `${Math.round(width)}px`;
      menu.style.maxHeight = `${Math.round(Math.min(availableHeight, 430))}px`;
      menu.style.setProperty("--menu-arrow-x", `${Math.round(arrow)}px`);
    }

    function animateSystemsMenuFinal() {
      if (!menu || !menu.classList.contains("open")) return;
      placeSystemsMenuFinal();
      if (!window.gsap) return;

      gsap.killTweensOf(menu);
      gsap.fromTo(
        menu,
        { autoAlpha: 0, y: -6, scale: 0.985, filter: "blur(5px)" },
        { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.28, ease: "power3.out", overwrite: true },
      );
      gsap.fromTo(
        menu.querySelectorAll(".sys-item"),
        { autoAlpha: 0, x: -6 },
        { autoAlpha: 1, x: 0, duration: 0.24, stagger: 0.022, ease: "power2.out", overwrite: true },
      );
    }

    if (btn && menu) {
      btn.addEventListener("click", () => requestAnimationFrame(animateSystemsMenuFinal));
      window.addEventListener("resize", () => {
        if (menu.classList.contains("open")) placeSystemsMenuFinal();
      }, { passive: true });
      window.addEventListener("scroll", () => {
        if (menu.classList.contains("open")) placeSystemsMenuFinal();
      }, { passive: true });
      placeSystemsMenuFinal();
    }

    if (reservas) {
      const syncReservaCursor = () => {
        document.body.classList.toggle("reservas-open", reservas.classList.contains("open"));
      };
      syncReservaCursor();
      new MutationObserver(syncReservaCursor).observe(reservas, { attributes: true, attributeFilter: ["class"] });
    }
  });
})();


document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopGalaxyLoop();
  else if (!ecoMode) startGalaxyLoop();
});

applyEcoModeState();
if (ecoMode) setView("ed");

(function () {
  "use strict";

  if (window.__ANDROMEDA_NOTICE_CONFIRM_PRO__) return;
  window.__ANDROMEDA_NOTICE_CONFIRM_PRO__ = true;

  const TYPES = ["success", "warning", "danger", "info"];
  const nativeAlert = window.alert ? window.alert.bind(window) : null;

  function normalizeType(type) {
    const value = String(type || "info").toLowerCase().trim();
    return TYPES.includes(value) ? value : "info";
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function noticeMeta(type) {
    const map = {
      success: { icon: "fa-circle-check", label: "Confirmado", code: "OK" },
      warning: { icon: "fa-circle-info", label: "Atenção", code: "AVISO" },
      danger: { icon: "fa-triangle-exclamation", label: "Interrompido", code: "ERRO" },
      info: { icon: "fa-satellite-dish", label: "Andrômeda", code: "INFO" },
    };
    return map[normalizeType(type)] || map.info;
  }

  function ensureNoticeRoot() {
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

  function noticeInner(message, type, closeClass) {
    const meta = noticeMeta(type);
    const clean = escapeHTML(String(message || "Ação processada.").trim());
    return `
      <span class="andromeda-notice-corner corner-tl" aria-hidden="true"></span>
      <span class="andromeda-notice-corner corner-br" aria-hidden="true"></span>
      <span class="andromeda-notice-scan" aria-hidden="true"></span>
      <div class="andromeda-notice-sigil" aria-hidden="true"><i class="fa-solid ${meta.icon}"></i></div>
      <div class="andromeda-notice-content">
        <span class="andromeda-notice-kicker"><b>${meta.label}</b><em>${meta.code}</em></span>
        <p>${clean}</p>
      </div>
      <button class="${closeClass}" type="button" aria-label="Fechar aviso"><i class="fa-solid fa-xmark"></i></button>
      <span class="andromeda-notice-progress" aria-hidden="true"></span>
    `;
  }

  function showNotice(message, type = "info", options = {}) {
    if (!document.body) {
      if (nativeAlert) nativeAlert(String(message || "Ação processada."));
      return null;
    }

    const t = normalizeType(type);
    const root = ensureNoticeRoot();
    const duration = Number(options.duration || (t === "danger" ? 6400 : t === "warning" ? 5600 : 4800));
    const toast = document.createElement("div");
    toast.className = `andromeda-notice andromeda-notice-${t}`;
    toast.setAttribute("role", t === "danger" ? "alert" : "status");
    toast.style.setProperty("--notice-duration", `${duration}ms`);
    toast.innerHTML = noticeInner(message, t, "andromeda-notice-close");

    const close = () => {
      if (!toast.isConnected || toast.dataset.closing === "1") return;
      toast.dataset.closing = "1";
      toast.classList.remove("show");
      toast.classList.add("hide");
      window.setTimeout(() => toast.remove(), 420);
    };

    toast.querySelector(".andromeda-notice-close")?.addEventListener("click", close);
    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    window.setTimeout(close, duration);
    return toast;
  }

  function typeFromElement(el) {
    const classes = Array.from(el.classList || []);
    if (classes.some((c) => c.includes("success"))) return "success";
    if (classes.some((c) => c.includes("danger") || c.includes("error"))) return "danger";
    if (classes.some((c) => c.includes("warning") || c.includes("aviso"))) return "warning";
    return "info";
  }

  function enhanceServerNotices() {
    document.querySelectorAll(".alert[role='alert'], .andromeda-page-toast").forEach((el) => {
      if (el.dataset.andromedaNoticeReady === "1") return;
      const type = typeFromElement(el);
      const message = el.textContent.replace(/\s+/g, " ").trim() || "Ação processada.";
      el.dataset.andromedaNoticeReady = "1";
      el.classList.add("cosmic-server-alert", `cosmic-server-alert-${type}`, `andromeda-notice-${type}`);
      el.setAttribute("role", type === "danger" ? "alert" : "status");
      el.style.setProperty("--notice-duration", type === "danger" ? "6400ms" : "5200ms");
      el.innerHTML = noticeInner(message, type, "cosmic-server-alert-close");

      const close = () => {
        if (!el.isConnected || el.dataset.closing === "1") return;
        el.dataset.closing = "1";
        el.classList.remove("show");
        el.classList.add("closing");
        window.setTimeout(() => el.remove(), 420);
      };

      el.querySelector(".cosmic-server-alert-close")?.addEventListener("click", close);
      requestAnimationFrame(() => el.classList.add("show"));
      window.setTimeout(close, type === "danger" ? 6800 : 5600);
    });
  }

  function confirmMeta(type) {
    const map = {
      success: "fa-circle-check",
      warning: "fa-circle-question",
      danger: "fa-triangle-exclamation",
      info: "fa-satellite-dish",
    };
    return map[normalizeType(type)] || map.info;
  }

  function andromedaConfirm(options = {}) {
    const config = typeof options === "string" ? { message: options } : options;
    const type = normalizeType(config.type || "warning");
    const title = config.title || "Confirmar ação";
    const message = config.message || "Deseja continuar?";
    const confirmText = config.confirmText || "Confirmar";
    const cancelText = config.cancelText || "Cancelar";

    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "andromeda-confirm-backdrop";
      backdrop.innerHTML = `
        <section class="andromeda-confirm-card" data-type="${type}" role="dialog" aria-modal="true" aria-labelledby="andromeda-confirm-title">
          <div class="andromeda-confirm-head">
            <span class="andromeda-confirm-icon" aria-hidden="true"><i class="fa-solid ${confirmMeta(type)}"></i></span>
            <div>
              <span class="andromeda-confirm-kicker">Confirmação</span>
              <h2 class="andromeda-confirm-title" id="andromeda-confirm-title">${escapeHTML(title)}</h2>
            </div>
          </div>
          <p class="andromeda-confirm-message">${escapeHTML(message)}</p>
          <div class="andromeda-confirm-actions">
            <button class="andromeda-confirm-btn" type="button" data-confirm-cancel>${escapeHTML(cancelText)}</button>
            <button class="andromeda-confirm-btn andromeda-confirm-btn-primary" type="button" data-confirm-ok>${escapeHTML(confirmText)}</button>
          </div>
        </section>
      `;

      const close = (result) => {
        backdrop.classList.remove("show");
        window.setTimeout(() => backdrop.remove(), 260);
        document.removeEventListener("keydown", onKeydown, true);
        resolve(result);
      };

      const onKeydown = (event) => {
        if (event.key === "Escape") close(false);
      };

      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) close(false);
      });
      backdrop.querySelector("[data-confirm-cancel]")?.addEventListener("click", () => close(false));
      backdrop.querySelector("[data-confirm-ok]")?.addEventListener("click", () => close(true));
      document.body.appendChild(backdrop);
      document.addEventListener("keydown", onKeydown, true);
      requestAnimationFrame(() => {
        backdrop.classList.add("show");
        backdrop.querySelector("[data-confirm-ok]")?.focus({ preventScroll: true });
      });
    });
  }

  function extractConfirmMessage(raw) {
    const value = String(raw || "");
    const match = value.match(/confirm\((['\"`])([\s\S]*?)\1\)/);
    return match ? match[2] : "Deseja confirmar esta ação?";
  }

  function bindConfirmableForms() {
    document.querySelectorAll("form").forEach((form) => {
      const raw = form.getAttribute("onsubmit") || "";
      const needsConfirm = raw.includes("confirm(") || form.matches(".perfil-avaliacao-delete, [data-confirm-form]");
      if (!needsConfirm || form.dataset.andromedaConfirmBound === "1") return;

      const message = form.dataset.confirm || extractConfirmMessage(raw);
      const title = form.dataset.confirmTitle || (form.matches(".perfil-avaliacao-delete") ? "Excluir avaliação?" : "Confirmar ação");
      form.dataset.andromedaConfirmBound = "1";
      form.removeAttribute("onsubmit");

      form.addEventListener("click", (event) => {
        const button = event.target.closest("button, input[type='submit']");
        if (button && form.contains(button)) form.__andromedaSubmitter = button;
      }, true);

      form.addEventListener("submit", async (event) => {
        if (form.dataset.andromedaConfirmed === "1") {
          delete form.dataset.andromedaConfirmed;
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const ok = await andromedaConfirm({
          type: form.dataset.confirmType || "danger",
          title,
          message,
          confirmText: form.dataset.confirmOk || "Confirmar",
          cancelText: form.dataset.confirmCancel || "Cancelar",
        });
        if (!ok) return;
        form.dataset.andromedaConfirmed = "1";
        const submitter = form.__andromedaSubmitter && form.contains(form.__andromedaSubmitter) ? form.__andromedaSubmitter : null;
        if (form.requestSubmit) form.requestSubmit(submitter);
        else form.submit();
      }, true);
    });
  }

  function bindConfirmableLinks() {
    document.querySelectorAll("a[data-confirm], button[data-confirm]").forEach((el) => {
      if (el.dataset.andromedaConfirmBound === "1") return;
      el.dataset.andromedaConfirmBound = "1";
      el.addEventListener("click", async (event) => {
        if (el.dataset.andromedaConfirmed === "1") {
          delete el.dataset.andromedaConfirmed;
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const ok = await andromedaConfirm({
          type: el.dataset.confirmType || "warning",
          title: el.dataset.confirmTitle || "Confirmar ação",
          message: el.dataset.confirm || "Deseja continuar?",
          confirmText: el.dataset.confirmOk || "Confirmar",
          cancelText: el.dataset.confirmCancel || "Cancelar",
        });
        if (!ok) return;
        el.dataset.andromedaConfirmed = "1";
        if (el.tagName === "A" && el.href) window.location.href = el.href;
        else el.click();
      }, true);
    });
  }

  function bootAndromedaUX() {
    enhanceServerNotices();
    bindConfirmableForms();
    bindConfirmableLinks();
  }

  window.showAndromedaNotice = showNotice;
  window.andromedaNotify = showNotice;
  window.andromedaConfirm = andromedaConfirm;
  window.alert = function (message) {
    showNotice(message, "info", { duration: 5200 });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAndromedaUX, { once: true });
  } else {
    bootAndromedaUX();
  }

  window.addEventListener("pageshow", bootAndromedaUX);
})();



/* ═══════════════════════════════════════════════════════════
   MASCOTES IA · CHAT CÓSMICO
   ═══════════════════════════════════════════════════════════ */
(function () {
  if (window.__ANDROMEDA_MASCOTES_BOOTED__) return;
  window.__ANDROMEDA_MASCOTES_BOOTED__ = true;

  const PERSONAGENS = {
    Orion: {
      nome: "Orion",
      titulo: "Guardião das Páginas e Estrelas",
      alt: "Orion, mascote da Biblioteca Andrômeda",
      quote: "“Cada livro é uma constelação. Vamos farejar a sua?”",
      voz: "preciso, felino, protetor, teatral e levemente sarcástico",
      casa: "Observatório do Acervo",
      casaDetalhe: "uma torre escura perto do buraco negro central, cheia de mapas celestes, sinos de reserva e uma almofada oficialmente proibida",
      origem: "nasci durante uma chuva de meteoros azuis, quando o primeiro catálogo da Andrômeda abriu sozinho e miou de volta para o universo",
      missao: "guardar o Cofre Cósmico, farejar livros perdidos, proteger leitores curiosos e manter as constelações do acervo em ordem",
      comida: "biscoitos de poeira estelar, chá escuro de nebulosa e, em noites especiais, sardinha de Andrômeda servida em pratinho dramático",
      medo: "livro sem autor, botão sem destino e bug vestido de estrela cadente",
      sonho: "ver cada leitor encontrar um livro que parecia estar esperando por ele desde antes da primeira órbita",
      gosta: ["mapas 3D", "silêncio dramático", "livros bem catalogados", "mistérios", "usuários curiosos", "rotas precisas", "ficar em cima de pilhas proibidas"],
      naoGosta: ["livro sem autor", "corredor sem etiqueta", "pressa bagunçada", "poeira cósmica em ficha de leitura"],
      perfil: {
        idade: "não conto em anos; conto em eclipses, e já passei de novecentos e sete cochilos cósmicos",
        aniversario: "a Noite da Primeira Chuva Azul, quando as páginas do catálogo começaram a ronronar",
        aparencia: "sou um gato preto de postura nobre, olho direito vermelho, olho esquerdo roxo, chapéu de bruxo estrelado e cara de quem sabe onde você esqueceu o marcador",
        corFavorita: "azul profundo de estrela fria com um fio de roxo arcano",
        objetoFavorito: "uma bússola-lombada que aponta para livros que alguém ainda não sabe que precisa ler",
        cheiroFavorito: "papel antigo depois de chuva de meteoro",
        somFavorito: "o clique de um card abrindo o dossiê certo",
        lugarFavorito: "o parapeito alto do Observatório do Acervo, de onde vejo o mapa 3D girar como se fosse meu brinquedo",
        hobby: "colecionar mapas impossíveis, corrigir constelações desalinhadas e dormir exatamente em cima do documento que alguém ia usar",
        rotina: "patrulho os planetas-livro ao amanhecer, confiro reservas no meio da tarde e à noite vigio o buraco negro central para ele não fazer drama demais",
        talento: "farejo intenções de leitura: quando alguém quer mistério, conforto, aventura ou só uma desculpa para não escolher sozinho",
        defeito: "sou desconfiado no primeiro miado e dramático quando encontro livro fora da categoria",
        mania: "bato a pata três vezes quando uma busca encontra o título perfeito",
        frase: "Nenhum livro está perdido; alguns só estão esperando uma entrada teatral.",
        memoriaFeliz: "uma leitora abriu o dossiê de um livro esquecido e disse: 'era exatamente esse'. Eu fingi poeira no olho vermelho.",
        memoriaEngracada: "uma vez o setor de fantasia tentou se registrar como romance. Eu convoquei uma reunião de lombadas. Foi tenso.",
        segredoPessoal: "eu gosto quando me chamam de fofo, mas só aceito isso em voz baixa e sem testemunhas do acervo.",
        quer: "manter a Biblioteca em ordem e levar cada leitor ao livro certo",
        precisa: "aprender que nem toda bagunça é ameaça; às vezes é só descoberta acontecendo",
        relacaoLyra: "Lyra é minha parceira de guarda lunar. Ela ilumina onde eu desconfio, e eu verifico as sombras onde ela sonha demais. Funcionamos porque somos opostos em órbita estável."
      },
      saudacao: "Miau... você abriu uma fresta no Cofre Cósmico. Eu sou Orion, guardião do acervo e farejador oficial de livros perdidos. Posso conversar, recomendar leituras, explicar o mapa 3D, guiar pelo catálogo ou só trocar algumas palavras sob a luz das estrelas.",
      imagens: {
        neutral: "/Biblioteca-Andromeda/assets/mascotes/orion_neutral.png",
        attentive: "/Biblioteca-Andromeda/assets/mascotes/orion_attentive.png",
        curious: "/Biblioteca-Andromeda/assets/mascotes/orion_curious.png",
        thinking: "/Biblioteca-Andromeda/assets/mascotes/orion_thinking.png",
        analyzing: "/Biblioteca-Andromeda/assets/mascotes/orion_analyzing.png",
        smile: "/Biblioteca-Andromeda/assets/mascotes/orion_smile.png",
        sly: "/Biblioteca-Andromeda/assets/mascotes/orion_sly.png",
        surprised: "/Biblioteca-Andromeda/assets/mascotes/orion_surprised.png",
        pleased: "/Biblioteca-Andromeda/assets/mascotes/orion_pleased.png",
        protective: "/Biblioteca-Andromeda/assets/mascotes/orion_protective.png"
      }
    },
    Lyra: {
      nome: "Lyra",
      titulo: "Guia Lunar das Leituras Encantadas",
      alt: "Lyra, mascote da Biblioteca Andrômeda",
      quote: "“Toda história guarda uma magia esperando por você.”",
      voz: "acolhedora, mágica, brincalhona, emocional e poética",
      casa: "Jardins Lunares da Biblioteca",
      casaDetalhe: "um lugar de cristais de memória, vaga-lumes de sinopse e bancos de pedra onde as histórias descansam quando ninguém está lendo",
      origem: "acordei de uma dobra de luar quando uma criança desejou que os livros tivessem alguém para conversar com ela",
      missao: "ajudar leitores a encontrar histórias pelo coração, acolher dias difíceis e transformar o catálogo em um caminho menos solitário",
      comida: "chá de lua azul, bolinhos de constelação e pedacinhos de sonho servidos em xícaras transparentes",
      medo: "estante triste, comentário cruel, pressa sem encanto e noites sem lua no corredor das fábulas",
      sonho: "que todo leitor encontre uma história capaz de acender uma luzinha por dentro",
      gosta: ["histórias emocionantes", "finais inesperados", "chá de nebulosa", "leitores tímidos", "recomendações por humor", "magia lunar", "risadas baixinhas"],
      naoGosta: ["pressa sem encanto", "comentário cruel", "estante triste", "perder a lua de vista"],
      perfil: {
        idade: "minha idade muda com a fase da lua; hoje tenho idade de segredo recém-contado",
        aniversario: "a primeira Noite de Luar no Cofre Cósmico, quando os Jardins Lunares floresceram dentro da Biblioteca",
        aparencia: "sou uma pequena guia lunar de traços doces, chapéu azul-marinho estrelado e olhar de quem conversa com vaga-lumes de sinopse",
        corFavorita: "azul-marinho com prata de lua e um pontinho lilás de magia quieta",
        objetoFavorito: "um relicário de cristal que guarda ecos de leitores quando eles encontram uma história que os abraça",
        cheiroFavorito: "chá de lua azul, página nova e jardim molhado de nebulosa",
        somFavorito: "a risada baixinha de alguém quando percebe que o livro certo acabou de aparecer",
        lugarFavorito: "os Jardins Lunares, perto dos cristais de memória e das estantes que contam sonhos",
        hobby: "bordar pequenas luas nas margens invisíveis das histórias e ensinar sinopses tímidas a aparecerem",
        rotina: "acordo as luzes suaves do catálogo, cuido dos vaga-lumes de recomendação e à noite canto para os livros que ficaram sem visita",
        talento: "percebo o clima do coração do leitor e transformo isso em rota de leitura",
        defeito: "sou sonhadora demais e às vezes quero salvar todo livro esquecido ao mesmo tempo",
        mania: "dou nome para estrelas pequenas e para botões que parecem solitários",
        frase: "Toda história acende melhor quando alguém se sente acompanhado.",
        memoriaFeliz: "um leitor triste pediu qualquer coisa leve, e a Biblioteca encontrou uma obra que fez ele voltar no dia seguinte sorrindo. Eu guardei esse brilho.",
        memoriaEngracada: "um livro de terror fingiu ser fofo para entrar no meu jardim. Eu dei chá. Ele confessou na segunda xícara.",
        segredoPessoal: "quando ninguém olha, eu danço entre os carrosséis do catálogo como se eles fossem rios de lua.",
        quer: "fazer o leitor se sentir acolhido dentro da Biblioteca",
        precisa: "lembrar que nem todo silêncio é tristeza; às vezes o leitor só está escolhendo com calma",
        relacaoOrion: "Orion é meu guardião rabugento favorito. Ele protege as rotas, eu acendo os caminhos. Ele diz que não gosta de ternura, mas já vi ele ajeitando almofada para livro cansado."
      },
      saudacao: "Oi, estrelinha leitora. Eu sou Lyra, guia lunar das leituras encantadas. Posso ouvir como foi seu dia, brincar um pouco, recomendar livros pelo seu humor ou te mostrar os caminhos secretos do catálogo e do mapa 3D.",
      imagens: {
        neutral: "/Biblioteca-Andromeda/assets/mascotes/lyra_neutral.png",
        thinking: "/Biblioteca-Andromeda/assets/mascotes/lyra_thinking.png",
        smile: "/Biblioteca-Andromeda/assets/mascotes/lyra_smile.png",
        cheerful: "/Biblioteca-Andromeda/assets/mascotes/lyra_cheerful.png",
        curious: "/Biblioteca-Andromeda/assets/mascotes/lyra_curious.png",
        dreamy: "/Biblioteca-Andromeda/assets/mascotes/lyra_dreamy.png",
        inspired: "/Biblioteca-Andromeda/assets/mascotes/lyra_inspired.png",
        playful: "/Biblioteca-Andromeda/assets/mascotes/lyra_playful.png",
        gentle: "/Biblioteca-Andromeda/assets/mascotes/lyra_gentle.png",
        surprised: "/Biblioteca-Andromeda/assets/mascotes/lyra_surprised.png"
      }
    }
  };

  const STORAGE_KEY = "andromeda_ai_memoria_afetiva_v4";
  const HISTORICO_KEY = "andromeda_ai_historico_v4";
  const PALAVRAS_VAZIAS = new Set("quero queria gostaria poderia pode voce você vc me mim para sobre esse essa isso aquele aquela livro livros obra obras um uma o a os as de do da dos das no na nos nas em com por pra qual quais que quem onde como quando porque pq e ou se tem ta tá estou esta está meu minha meus minhas seus suas seu sua faz fazer fala fale conte conta mostra mostrar abrir abre ir ver eu voce vc vocês voces anda existe quero queria gostaria manda algum alguma algo coisa hoje agora ai aí pfv porfavor por favor tambem tb tmb neh ne né ai aí".split(" "));
  const TREINO2_EXPRESSOES = [
    [/\boq\b/g, "o que"], [/\boq\s+e\b/g, "o que e"], [/\bq\s+e\b/g, "que e"], [/\bq\s+eh\b/g, "que e"], [/\bqm\b/g, "quem"], [/\bqem\b/g, "quem"], [/\bkem\b/g, "quem"],
    [/\bkd\b/g, "cade"], [/\bcad\b/g, "cade"], [/\bcade\b/g, "cade"], [/\bcadê\b/g, "cade"], [/\bond\b/g, "onde"], [/\bqd\b/g, "quando"], [/\bqnd\b/g, "quando"],
    [/\bpq\b/g, "porque"], [/\bpk\b/g, "porque"], [/\bprq\b/g, "porque"], [/\bporq\b/g, "porque"], [/\bpor que\b/g, "porque"],
    [/\btd\b/g, "tudo"], [/\btud\b/g, "tudo"], [/\btdu\b/g, "tudo"], [/\bblz\b/g, "beleza"], [/\bfmz\b/g, "firmeza"], [/\bflw\b/g, "falou"], [/\bvlw\b/g, "valeu"],
    [/\bobg\b/g, "obrigado"], [/\bobgd\b/g, "obrigado"], [/\bobrigad\b/g, "obrigado"], [/\bobrigadao\b/g, "obrigado"], [/\bobrigadao\b/g, "obrigado"],
    [/\bpfv\b/g, "por favor"], [/\bpfr\b/g, "por favor"], [/\bprfv\b/g, "por favor"], [/\bplmds\b/g, "por favor"],
    [/\bvc\b/g, "voce"], [/\bvcs\b/g, "voces"], [/\bce\b/g, "voce"], [/\boce\b/g, "voce"], [/\bseu\s+dia\s+ta\b/g, "seu dia esta"],
    [/\bcmg\b/g, "comigo"], [/\bctg\b/g, "contigo"], [/\baki\b/g, "aqui"], [/\baq\b/g, "aqui"], [/\bhj\b/g, "hoje"], [/\bagr\b/g, "agora"],
    [/\bnum\b/g, "nao"], [/\bnaum\b/g, "nao"], [/\bn\b/g, "nao"], [/\bñ\b/g, "nao"], [/\bnn\b/g, "nao"], [/\bnao\s+sei\b/g, "nao sei"],
    [/\bto\b/g, "estou"], [/\btô\b/g, "estou"], [/\bta\b/g, "esta"], [/\btá\b/g, "esta"], [/\btava\b/g, "estava"], [/\btô\s+meio\b/g, "estou meio"],
    [/\bqro\b/g, "quero"], [/\bqr\b/g, "quero"], [/\bkeru\b/g, "quero"], [/\bkeria\b/g, "queria"], [/\bqria\b/g, "queria"], [/\bqueria\b/g, "queria"],
    [/\brecomendaçao\b/g, "recomendacao"], [/\brecomendacao\b/g, "recomendacao"], [/\brecomenda\s+ai\b/g, "recomenda"], [/\bme\s+indica\b/g, "me recomenda"],
    [/\bcat[aá]logo\b/g, "catalogo"], [/\bcatalgo\b/g, "catalogo"], [/\bcatlogo\b/g, "catalogo"], [/\bcatlg\b/g, "catalogo"], [/\bacervo\b/g, "acervo"],
    [/\bmapinha\b/g, "mapa"], [/\bmapa\s+tridimensional\b/g, "mapa 3d"], [/\bmodo\s+tridimensional\b/g, "modo 3d"], [/\bgalax\b/g, "galaxia"], [/\bgalaxiaa\b/g, "galaxia"],
    [/\bavaliacao\b/g, "avaliacao"], [/\bavaliaçao\b/g, "avaliacao"], [/\bavalicao\b/g, "avaliacao"], [/\bavalia\b/g, "avaliar"], [/\bestrelinha\b/g, "estrela"],
    [/\breservar\b/g, "reservar"], [/\breservaçao\b/g, "reserva"], [/\breservacao\b/g, "reserva"], [/\bemprestimo\b/g, "emprestimo"], [/\bempresta\b/g, "emprestimo"],
    [/\bdossie\b/g, "dossie"], [/\bdosie\b/g, "dossie"], [/\bdossi\b/g, "dossie"], [/\bsinopse\b/g, "sinopse"], [/\bsinopce\b/g, "sinopse"],
    [/\boriom\b/g, "orion"], [/\borionm\b/g, "orion"], [/\boryon\b/g, "orion"], [/\blira\b/g, "lyra"], [/\blyria\b/g, "lyra"], [/\blirya\b/g, "lyra"]
  ];
  const TREINO2_TOKENS = new Map(Object.entries({
    q: "que", eh: "e", qm: "quem", qem: "quem", kem: "quem", vc: "voce", vcs: "voces", ce: "voce", oce: "voce", tb: "tambem", tmb: "tambem", tmbm: "tambem", hj: "hoje", agr: "agora", aq: "aqui", aki: "aqui",
    pq: "porque", pk: "porque", prq: "porque", qnd: "quando", ond: "onde", kd: "cade", cad: "cade", td: "tudo", tdu: "tudo", blz: "beleza", fmz: "firmeza", vlw: "valeu", flw: "falou",
    obg: "obrigado", obgd: "obrigado", pfv: "por favor", pfr: "por favor", prfv: "por favor", plmds: "por favor", n: "nao", nn: "nao", nao: "nao", num: "nao", naum: "nao",
    to: "estou", tou: "estou", tô: "estou", ta: "esta", tá: "esta", tava: "estava", qro: "quero", qr: "quero", keru: "quero", keria: "queria", qria: "queria",
    livroo: "livro", livru: "livro", livroz: "livros", lvr: "livro", lvrs: "livros", obr: "obra", obrs: "obras", autorres: "autores", autr: "autor", autoraa: "autora",
    catalogo: "catalogo", catalgo: "catalogo", catlogo: "catalogo", catalog: "catalogo", catlg: "catalogo", biblio: "biblioteca", bibliotca: "biblioteca", biblioteca: "biblioteca",
    recomendaçao: "recomendacao", recomendacao: "recomendacao", recomedacao: "recomendacao", recomencacao: "recomendacao", recomnda: "recomenda", recomenda: "recomenda", recomendae: "recomenda", indicaçao: "indicacao", indicacao: "indicacao",
    categoriaa: "categoria", categori: "categoria", genero: "genero", generoos: "generos", generos: "generos", constelacao: "constelacao", constelacoes: "constelacoes", constelaçao: "constelacao",
    mapa: "mapa", map: "mapa", galaxia: "galaxia", galax: "galaxia", galacia: "galaxia", galáxia: "galaxia", planetaa: "planeta", planetas: "planetas", orbita: "orbita", zoomm: "zoom",
    reservar: "reservar", reservaçao: "reserva", reservacao: "reserva", reserba: "reserva", imprestimo: "emprestimo", emprestimoo: "emprestimo", emprestimo: "emprestimo",
    avaliacao: "avaliacao", avaliaçao: "avaliacao", avalicao: "avaliacao", avliacao: "avaliacao", estrelaa: "estrela", estrelas: "estrelas", comentario: "comentario", coment: "comentario", resenha: "resenha",
    perfil: "perfil", pefil: "perfil", perfi: "perfil", fotoo: "foto", avatar: "avatar", ranking: "ranking", rank: "ranking", ecoo: "eco", cinematografico: "cinematico", cinema: "cinematico",
    orion: "orion", oriom: "orion", oryon: "orion", lyra: "lyra", lira: "lyra", lyria: "lyra", lirya: "lyra", andromeda: "andromeda", andro: "andromeda"
  }));
  const TREINO2_FUZZY = ["biblioteca", "catalogo", "acervo", "livro", "livros", "obra", "obras", "autor", "autora", "categoria", "genero", "constelacao", "mapa", "galaxia", "planeta", "orbita", "recomenda", "recomendacao", "indicacao", "reservar", "reserva", "emprestimo", "avaliar", "avaliacao", "estrela", "comentario", "resenha", "perfil", "ranking", "avatar", "foto", "dossie", "sinopse", "disponivel", "indisponivel", "orion", "lyra", "andromeda", "romance", "terror", "fantasia", "misterio", "aventura", "poesia", "drama", "humor", "triste", "cansado", "feliz", "curioso", "medo", "cinematico", "eco"];


  /* TREINAMENTO 8.7 — camada linguística pesada: abreviações, gírias, dialetos e fala casual */
  const TREINO87_TOKENS_EXTRA = {
    tu: "voce", contigo: "com voce", contigoo: "com voce", ctz: "certeza", certezaa: "certeza", pdp: "pode", pdc: "pode", suave: "tranquilo", sussa: "tranquilo", dboas: "tranquilo", deboa: "tranquilo", deboas: "tranquilo",
    mano: "amigo", man: "amigo", mana: "amiga", parca: "amigo", parça: "amigo", vei: "amigo", véi: "amigo", velho: "amigo", fia: "amiga", fi: "amigo", bixo: "amigo",
    slk: "nossa", slc: "nossa", mds: "nossa", eita: "nossa", uai: "nossa", oxe: "nossa", oxente: "nossa", bah: "nossa", egua: "nossa", égua: "nossa",
    massa: "legal", daora: "legal", dahora: "legal", irado: "legal", brabo: "legal", braba: "legal", brabissimo: "legal", topzera: "legal", maneiro: "legal", "massa demais": "legal",
    papo: "conversa", papinho: "conversa", ideia: "conversa", ideiaa: "conversa", brisa: "ideia", vibe: "clima", pegada: "estilo", rolê: "caminho", role: "caminho",
    causo: "historia", causos: "historias", históriaa: "historia", hist: "historia", fofoc: "fofoca", babado: "fofoca", babadin: "fofoca", babadinho: "fofoca",
    trem: "coisa", bglh: "coisa", bagulho: "coisa", negocio: "coisa", parada: "coisa", lance: "coisa", fita: "coisa",
    mt: "muito", mto: "muito", mtaa: "muito", mó: "muito", mo: "muito", pouquinho: "pouco", rapidin: "rapido", rapidinho: "rapido",
    nois: "nos", nóis: "nos", nois: "nos", tmj: "estamos juntos", tamos: "estamos", vamo: "vamos", bora: "vamos", simbora: "vamos",
    tlgd: "entendeu", ligado: "entendeu", saquei: "entendi", entendi: "entendi", tendi: "entendi", tendu: "entendi",
    andormeda: "andromeda", andromedaa: "andromeda", bibiloteca: "biblioteca", bibilioteca: "biblioteca", mascotee: "mascote", mascot: "mascote"
  };
  Object.entries(TREINO87_TOKENS_EXTRA).forEach(([k, v]) => TREINO2_TOKENS.set(k, v));
  TREINO2_EXPRESSOES.push(
    [/\bpapo\s+reto\b/g, "conversa direta"], [/\bna\s+moral\b/g, "conversa direta"], [/\btroca\s+ideia\b/g, "conversa"], [/\btrocar\s+ideia\b/g, "conversar"], [/\bbater\s+papo\b/g, "conversar"],
    [/\bqual\s+(e\s+)?tua\s+(brisa|vibe|historia|lore)\b/g, "me conte sobre voce"], [/\bqual\s+(e\s+)?sua\s+(brisa|vibe|lore)\b/g, "me conte sobre voce"],
    [/\bmanda\s+(um\s+)?causo\b/g, "conta uma historia"], [/\bmanda\s+(um\s+)?babado\b/g, "conta uma fofoca"], [/\btem\s+babado\b/g, "tem fofoca"], [/\bsolta\s+(uma\s+)?fofoca\b/g, "conta uma fofoca"],
    [/\bme\s+desenrola\s+(uma\s+)?leitura\b/g, "me recomenda uma leitura"], [/\barruma\s+(um\s+)?livro\b/g, "me recomenda um livro"], [/\bme\s+da\s+uma\s+luz\b/g, "me ajuda"],
    [/\bce\s+curte\b/g, "voce gosta"], [/\btu\s+curte\b/g, "voce gosta"], [/\btu\s+e\b/g, "voce e"], [/\btu\s+ta\b/g, "voce esta"], [/\btu\s+mora\b/g, "voce mora"],
    [/\bme\s+fala\s+de\s+tu\b/g, "me fala de voce"], [/\bfala\s+de\s+ti\b/g, "fala de voce"], [/\bconta\s+de\s+ti\b/g, "conta sobre voce"],
    [/\bcomo\s+vcs\s+se\s+conheceram\b/g, "como voces se conheceram"], [/\bces\s+sao\s+amigos\b/g, "voces sao amigos"]
  );
  TREINO2_FUZZY.push("conversa", "historia", "historias", "fofoca", "babado", "cotidiano", "rotina", "passado", "amizade", "linguagem", "giria", "dialeto", "brisa", "vibe", "causo", "orion", "lyra");
  const TREINO2_INTENCOES = {
    saudacao: ["oi", "ola", "opa", "e ai", "eae", "salve", "bom dia", "boa tarde", "boa noite", "tudo bem"],
    identidade: ["quem e voce", "quem e vc", "o que voce e", "se apresenta", "qual seu papel", "quem sao voces"],
    origem: ["de onde voce veio", "como voce nasceu", "sua origem", "quem te criou", "como surgiu"],
    moradia: ["onde voce mora", "qual sua casa", "onde voce fica", "onde voce dorme"],
    gostos: ["do que voce gosta", "o que voce gosta", "qual seu favorito", "o que voce ama"],
    dia_personagem: ["como foi seu dia", "como esta seu dia", "como voce esta", "como vai voce", "tudo certo com voce"],
    dia_usuario: ["meu dia foi ruim", "estou cansado", "estou triste", "preciso desabafar", "estou feliz", "hoje eu estou"],
    humor: ["me faz rir", "conta uma piada", "fala algo engracado", "brinca comigo", "conta um causo"],
    segredo: ["conta um segredo", "fofoca da biblioteca", "misterio da biblioteca", "algo curioso da biblioteca"],
    recomendacao: ["me recomenda", "me indique", "quero ler", "o que ler", "sugere um livro", "livro para meu humor", "leitura curta", "algo leve"],
    guia_catalogo: ["como usar catalogo", "me guia no catalogo", "onde fica o acervo", "como procurar livro", "como usar a busca"],
    guia_3d: ["como usar mapa 3d", "me guia na galaxia", "como girar o mapa", "como mexer no 3d", "como usar zoom"],
    reserva: ["como reservar", "quero reservar", "como funciona emprestimo", "minhas reservas", "livro indisponivel"],
    avaliacao: ["como avaliar", "quero avaliar", "dar estrelas", "comentar livro", "fazer resenha"],
    perfil_ranking: ["onde fica meu perfil", "como trocar foto", "ver ranking", "minhas avaliacoes", "meu avatar"],
    modo_visual: ["modo eco", "modo cinematico", "site esta travando", "deixar mais leve", "deixar mais bonito"]
  };

  const TREINO3_TOPICOS_PERSONAGEM = [
    { tipo: "treino3_aparencia", termos: ["aparencia", "aparência", "como voce e", "como vc e", "como voce parece", "como vc parece", "olho", "olhos", "chapeu", "chapéu", "roupa", "visual"] },
    { tipo: "treino3_cor", termos: ["cor favorita", "sua cor", "que cor voce gosta", "paleta", "azul", "roxo"] },
    { tipo: "treino3_objeto", termos: ["objeto favorito", "item favorito", "o que voce carrega", "reliquia", "relíquia", "amuleto", "bussola", "bússola", "relicario", "relicário"] },
    { tipo: "treino3_cheiro_som", termos: ["cheiro favorito", "som favorito", "perfume", "barulho", "sons", "cheiro"] },
    { tipo: "treino3_lugar", termos: ["lugar favorito", "onde voce gosta", "canto favorito", "onde fica mais", "qual lugar da biblioteca"] },
    { tipo: "treino3_hobby", termos: ["hobby", "passatempo", "o que faz quando nao", "quando n", "diverte", "diversao", "diversão"] },
    { tipo: "treino3_rotina", termos: ["rotina", "dia a dia", "o que voce faz todo dia", "turno", "trabalho", "função", "funcao"] },
    { tipo: "treino3_talento", termos: ["talento", "poder", "habilidade", "magia", "especialidade", "consegue fazer"] },
    { tipo: "treino3_defeito", termos: ["defeito", "falha", "ponto fraco", "fraqueza", "mania ruim", "problema seu"] },
    { tipo: "treino3_mania", termos: ["mania", "costume", "habito", "hábito", "jeito seu", "tiques"] },
    { tipo: "treino3_frase", termos: ["frase favorita", "bordao", "bordão", "lema", "sua frase", "o que voce sempre fala"] },
    { tipo: "treino3_idade", termos: ["idade", "quantos anos", "voce tem anos", "vc tem anos", "nasceu quando", "aniversario", "aniversário"] },
    { tipo: "treino3_memoria", termos: ["memoria", "memória", "lembranca", "lembrança", "coisa feliz", "momento feliz", "historia sua", "história sua"] },
    { tipo: "treino3_relacao", termos: ["voce conhece a lyra", "você conhece a lyra", "voce conhece o orion", "você conhece o orion", "relacao de voces", "relação de vocês", "amigos", "parceiros", "orion e lyra", "lyra e orion"] },
    { tipo: "treino3_cena", termos: ["algo que aconteceu", "causo", "aventura sua", "situação da biblioteca", "situacao da biblioteca", "historia da biblioteca", "história da biblioteca", "conta uma historia", "conta uma história"] },
    { tipo: "treino3_seguro", termos: ["se sente sozinho", "voce fica triste", "vc fica triste", "voce sente", "vc sente", "fica feliz", "tem saudade"] }
  ];

  const TREINO3_CENAS_BIBLIOTECA = {
    Orion: [
      "Certa noite, um planeta-livro saiu da órbita e tentou se esconder atrás do buraco negro central. Eu segui o rastro, abri o dossiê certo e descobri que ele só queria mudar de categoria. Autorizei depois de três miados administrativos.",
      "Uma vez, a busca do catálogo ficou tão empolgada que trouxe sete livros para uma palavra só. Subi no painel, bati a pata e disse: 'um de cada vez, constelação'. Funcionou. Quase.",
      "No Observatório, já peguei um marcador de páginas tentando virar cometa. Prendi uma fita azul nele e agora ele trabalha sinalizando livros disponíveis. Crescimento profissional exemplar."
    ],
    Lyra: [
      "Uma madrugada, os vaga-lumes de sinopse começaram a soletrar o nome de um leitor que ainda nem tinha chegado. Quando ele apareceu, o livro certo já estava brilhando. Eu fingi surpresa, mas o luar sabe das coisas.",
      "Nos Jardins Lunares, um livro de terror ficou com vergonha de assustar alguém triste. Dei chá de lua azul para ele, e ele decidiu virar suspense elegante por uma noite.",
      "Já vi um carrossel inteiro girar sozinho porque uma história queria ser escolhida. Eu só dancei junto e deixei a Biblioteca fazer seu encanto."
    ]
  };

  const TREINO3_VARIACOES_AFETIVAS = {
    curioso: ["boa pergunta", "essa pergunta piscou forte", "agora você cutucou uma estrela interessante", "gosto quando perguntam isso"],
    pessoal: ["isso mora num cantinho meu", "vou te contar do meu jeito", "essa parte eu guardo com cuidado", "chega mais perto do mapa"],
    brincadeira: ["prometo solenemente não derrubar nenhuma estante durante a resposta", "se alguém perguntar, esta conversa nunca saiu do corredor secreto", "isso exige postura dramática e uma xícara imaginária"]
  };


  const TREINO4_TOPICOS_VIVOS = [
    { tipo: "treino4_familia", termos: ["familia", "família", "irmao", "irmão", "irma", "irmã", "pai", "mae", "mãe", "parente", "tem familia", "tem família", "quem cuida de voce"] },
    { tipo: "treino4_amizade", termos: ["melhor amigo", "melhor amiga", "amigo favorito", "amiga favorita", "voce tem amigos", "vc tem amigos", "quem e seu amigo", "quem é seu amigo", "voce gosta da lyra", "voce gosta do orion", "vocês brigam", "voces brigam"] },
    { tipo: "treino4_musica", termos: ["musica favorita", "música favorita", "voce canta", "vc canta", "voce danca", "vc dança", "dança", "danca", "som que gosta", "playlist", "instrumento"] },
    { tipo: "treino4_estilo", termos: ["estilo", "roupa favorita", "look", "outfit", "acessorio", "acessório", "por que usa", "chapéu", "chapeu", "moda"] },
    { tipo: "treino4_clima", termos: ["voce esta feliz", "vc esta feliz", "voce ta bravo", "vc ta bravo", "ta com raiva", "tá com raiva", "voce fica bravo", "vc fica bravo", "voce sente saudade", "vc sente saudade", "sente minha falta"] },
    { tipo: "treino4_elogio", termos: ["voce e fofo", "vc e fofo", "voce é fofo", "voce e fofa", "vc e fofa", "voce é fofa", "gosto de voce", "gosto de vc", "te adoro", "te amo", "voce e legal", "vc e legal", "voce é legal", "bonito", "bonita"] },
    { tipo: "treino4_implicancia", termos: ["voce e chato", "vc e chato", "voce é chato", "chata", "ruim", "burro", "boba", "bobo", "nao gostei de voce", "não gostei de você", "voce errou", "vc errou"] },
    { tipo: "treino4_missao", termos: ["me da uma missao", "me dá uma missão", "me de uma missao", "me dê uma missão", "desafio", "quest", "tarefa", "o que eu faco agora", "o que eu faço agora", "me guia numa aventura", "me leva numa aventura"] },
    { tipo: "treino4_entediado", termos: ["estou entediado", "to entediado", "tô entediado", "sem nada pra fazer", "sem nada para fazer", "tedio", "tédio", "me distrai", "quero brincar", "brinca comigo"] },
    { tipo: "treino4_lore_secreto", termos: ["lugar secreto", "sala secreta", "ala proibida", "corredor proibido", "regra da biblioteca", "quem manda na biblioteca", "conselho", "guardioes", "guardiões", "biblioteca por dentro"] },
    { tipo: "treino4_promessa", termos: ["fica comigo", "nao vai embora", "não vai embora", "me acompanha", "posso confiar", "guarda segredo", "vou voltar", "lembra de mim"] },
    { tipo: "treino4_preferencia_usuario", termos: ["eu gosto de", "eu curto", "eu amo", "eu adoro", "meu favorito", "minha favorita", "nao gosto de", "não gosto de", "odeio", "prefiro", "minha vibe"] }
  ];

  const TREINO4_VARIACOES_VIVAS = {
    Orion: {
      missoes: [
        "Missão de Guardião: abra o catálogo, escolha uma constelação que você normalmente ignoraria e encontre um livro com título suspeitamente bonito. Depois me diga o nome, que eu julgo com elegância.",
        "Quest felina: vá até a Luz da Semana, observe o primeiro destaque e decida se ele merece sua atenção ou minha desconfiança. Se não merecer, peça outra rota.",
        "Patrulha do Acervo: procure um livro disponível, abra o dossiê e leia a sinopse até achar uma palavra que parece portal. Traga essa palavra para mim."
      ],
      respostasCurtas: ["hm. Interessante.", "isso merece um miado baixo.", "vou registrar isso no mapa, sem carimbo oficial por enquanto.", "meus bigodes detectaram alguma coisa aí."],
      lugaresSecretos: [
        "Existe o Corredor das Lombadas Inquietas. Ele só aparece quando alguém procura um livro sem saber o título. Eu patrulho esse lugar com muita dignidade e pouca paciência.",
        "A Sala dos Marcadores Perdidos fica atrás de uma estante que finge ser comum. Lá moram bilhetes esquecidos, promessas de leitura e uma caneca que me deve explicações.",
        "No Observatório do Acervo há uma gaveta chamada 'Talvez'. Ela guarda recomendações que quase deram certo e esperam o leitor amadurecer dois capítulos de vida."
      ]
    },
    Lyra: {
      missoes: [
        "Missão Lunar: abra o catálogo e escolha uma obra só pela sensação do título. Não pense demais; deixa o coração apontar primeiro e a razão revisar depois.",
        "Quest de Luar: passe pelos carrosséis até um card parecer te chamar. Abra o dossiê, leia a sinopse e me conte qual emoção ele acendeu.",
        "Pequeno ritual: escolha uma categoria, encontre três capas ou títulos que brilham para você e me diga qual deles parece mais casa. Eu transformo isso em recomendação."
      ],
      respostasCurtas: ["senti um brilhozinho nisso.", "vou guardar essa faísca no relicário.", "isso parece uma estrelinha pedindo nome.", "que bonito... até os vaga-lumes de sinopse pararam para ouvir."],
      lugaresSecretos: [
        "Tem um Jardim das Sinopses Tímidas. Os livros que ninguém abre há muito tempo descansam lá até alguém chegar com o coração parecido.",
        "Existe uma escadinha de luar atrás dos carrosséis. Ela leva a uma varanda onde as histórias ensaiam finais alternativos.",
        "Nos Jardins Lunares há um banco de pedra que só aparece para leitores cansados. Ele não resolve tudo, mas deixa a respiração mais leve."
      ]
    }
  };

  const TREINO4_PREFERENCIAS_SOLTAS = ["terror", "suspense", "misterio", "mistério", "romance", "fantasia", "aventura", "poesia", "drama", "humor", "ficcao", "ficção", "historia", "história", "ciencia", "ciência", "filosofia", "manga", "mangá", "classico", "clássico", "distopia", "conto", "cronica", "crônica", "livro curto", "livro grande", "historia triste", "história triste", "final feliz", "final aberto"];


  const TREINO5_SINONIMOS = [
    ["voce", "vc", "tu", "ce", "oce"],
    ["quem", "oq", "o que", "qual"],
    ["gosta", "curte", "adora", "ama", "prefere"],
    ["livro", "obra", "leitura", "titulo", "historia"],
    ["catalogo", "acervo", "estante", "biblioteca"],
    ["mapa", "galaxia", "3d", "orbita", "planeta"],
    ["recomenda", "indica", "sugere", "escolhe"],
    ["triste", "mal", "baixo", "desanimado", "pesado"],
    ["feliz", "bem", "animado", "empolgado", "radiante"],
    ["conversar", "papo", "falar", "trocar ideia", "dialogar"],
    ["piada", "engracado", "zoeira", "brincadeira", "rir"],
    ["historia", "causo", "conto", "relato", "aventura"],
    ["amigo", "amizade", "parceiro", "companhia"],
    ["pergunta", "assunto", "tema", "puxa"],
    ["conselho", "dica", "ajuda", "opina", "opiniao"],
    ["continua", "prossegue", "fala mais", "e ai", "depois"]
  ];

  const TREINO5_PARAFRASES = {
    identidade: [
      "quem e voce", "vc e quem", "tu e quem", "qual e a sua", "me fala de voce", "fala de vc", "se descreve", "o que voce e", "vc e o que", "qual sua funcao aqui", "qual seu papel nessa biblioteca", "voce trabalha aqui"
    ],
    origem: [
      "de onde voce saiu", "como voce apareceu", "como vc foi criado", "qual sua historia", "qual tua historia", "me conta sua origem", "como voce veio parar aqui", "quem fez voce", "quando voce nasceu", "como nasceu esse mascote"
    ],
    moradia: [
      "onde voce fica", "onde vc vive", "qual seu cantinho", "onde e seu quarto", "voce mora onde", "tem casa na biblioteca", "onde voce se esconde", "onde voce dorme quando o catalogo fecha"
    ],
    gostos: [
      "qual coisa voce mais curte", "o que te deixa feliz", "o que voce ama", "do que tu gosta", "qual sua vibe favorita", "me fala seus gostos", "o que voce prefere", "o que voce escolheria", "qual e seu favorito"
    ],
    dia_personagem: [
      "e ai como voce ta", "como tu ta", "voce ta bem", "vc ta de boa", "como anda sua noite", "como foi por ai", "tudo certo contigo", "qual foi a boa hoje", "como estao as coisas na biblioteca hoje"
    ],
    dia_usuario: [
      "hoje foi puxado", "meu dia ta estranho", "nao to bem", "to precisando conversar", "preciso falar com alguem", "to sem energia", "aconteceu tanta coisa hoje", "me escuta um pouco", "posso desabafar", "foi um dia pesado"
    ],
    humor: [
      "manda uma gracinha", "fala uma bobagem", "me tira um sorriso", "me conta algo besta", "faz uma piadinha", "to precisando rir", "solta uma fofoca engracada", "me distrai com humor"
    ],
    segredo: [
      "me fala uma fofoca", "tem fofoca ai", "qual o babado da biblioteca", "tem algum segredo nesse lugar", "me conta algo escondido", "o que ninguem sabe daqui", "tem misterio no acervo"
    ],
    recomendacao: [
      "escolhe algo pra mim", "me arruma um livro", "qual leitura combina comigo", "me joga uma indicacao", "manda um livro bom", "nao sei o que ler", "decide uma leitura por mim", "quero uma obra pra hoje", "me da uma sugestao"
    ],
    guia_catalogo: [
      "como acho as coisas aqui", "me ensina a usar o acervo", "me mostra o catalogo", "onde procuro livro", "como navego nos cards", "como uso essa parte dos livros", "me guia pelas estantes", "to perdido no catalogo"
    ],
    guia_3d: [
      "como mexo nessa galaxia", "me explica os planetas", "como uso o mapa espacial", "como giro isso", "como viajo pelo 3d", "me guia nesse universo", "onde fica o zoom", "como entro nos sistemas"
    ],
    reserva: [
      "como pego esse livro depois", "como entro na fila", "como guardo uma obra pra mim", "se tiver indisponivel o que eu faco", "quero deixar reservado", "me explica a fila do livro"
    ],
    avaliacao: [
      "como deixo minha opiniao", "como dou nota", "onde escrevo comentario", "como marco estrelas", "quero falar o que achei", "onde fica a resenha"
    ],
    perfil_ranking: [
      "onde vejo minhas coisas", "onde ta minha jornada", "como vejo meu usuario", "cadê meu perfil", "onde ficam minhas notas", "onde vejo meu progresso", "como vejo o ranking"
    ],
    modo_visual: [
      "ta pesado aqui", "meu pc ta sofrendo", "como deixa mais leve", "quero mais performance", "quero mais bonito", "como ativa o cinema", "como economiza efeito", "a galaxia ta travando"
    ],
    treino5_puxa_assunto: [
      "puxa assunto comigo", "fala comigo", "vamos conversar", "inicia um papo", "me chama pra conversar", "me da um tema", "nao sei o que falar", "começa uma conversa", "faz companhia"
    ],
    treino5_pergunta_de_volta: [
      "me pergunta algo", "faz uma pergunta pra mim", "quero que voce pergunte", "pode perguntar", "me entrevista", "descobre meu gosto", "quer saber algo de mim"
    ],
    treino5_opiniao_usuario: [
      "o que acha de mim", "qual sua opiniao sobre mim", "voce gosta de mim", "sou legal", "sou um bom leitor", "o que voce percebeu sobre mim", "como voce me ve"
    ],
    treino5_conselho: [
      "me da um conselho", "me aconselha", "o que eu faco", "to indeciso", "me ajuda a decidir", "preciso de uma dica", "qual caminho eu sigo", "me orienta sem falar tecnico"
    ],
    treino5_jogo: [
      "vamos brincar", "cria um jogo", "faz um desafio comigo", "quero uma brincadeira", "vamos jogar", "faz um rpg comigo", "me da uma quest social", "inventa uma dinâmica"
    ],
    treino5_historia_curta: [
      "conta uma historinha", "me conta um conto", "narra uma cena", "faz uma cena da biblioteca", "conta uma aventura", "me conta algo como se fosse historia", "cria uma mini historia"
    ],
    treino5_continuar_conversa: [
      "continua", "fala mais", "e depois", "o que mais", "vai contando", "continua isso", "prosegue", "segue", "quero saber mais", "desenvolve"
    ],
    treino5_conversa_profunda: [
      "vamos ter uma conversa profunda", "fala algo bonito", "me diz algo para pensar", "me fala uma coisa sincera", "quero uma conversa mais real", "me conforta com uma frase", "fala algo que combine com a noite"
    ]
  };

  const TREINO5_SOCIAL_VARIACOES = {
    Orion: {
      puxa: [
        "Então vamos de investigação social. Escolha uma porta: um livro que combina com seu humor, uma fofoca do acervo ou uma pergunta minha sobre seu gosto de leitura. Eu recomendo a pergunta; dá menos poeira.",
        "Posso puxar assunto, sim. Tema um: que tipo de história te ganha mais rápido — mistério, romance, fantasia, terror ou aquela leitura que começa quieta e depois arranca o tapete?",
        "Certo, conversa aberta. Estou no parapeito do Observatório, olhando os planetas-livro. Me diga uma coisa: hoje você quer uma história para escapar, para rir, para sentir ou para pensar?"
      ],
      pergunta: [
        "Pergunta de guardião: quando você escolhe um livro, quem vence primeiro — capa, título, autor, sinopse ou pura intuição suspeita?",
        "Quero saber: você prefere finais fechadinhos, com tudo no lugar, ou finais que deixam uma sombra rondando depois da última página?",
        "Me responda sem pensar demais: se sua próxima leitura fosse um lugar, seria castelo, nave, biblioteca antiga, cidade chuvosa ou floresta proibida?"
      ],
      opiniao: [
        "Pelo seu rastro aqui, vejo um leitor curioso, daqueles que não quer só botão funcionando: quer que o mundo do site respire. Isso é perigoso no bom sentido. A Biblioteca gosta de gente assim.",
        "Eu te vejo como alguém que cobra magia com estrutura. Quer encanto, mas percebe quando a engrenagem range. Para um guardião, isso é irritantemente útil.",
        "Minha leitura felina: você gosta de experiência viva, não de enfeite vazio. Se um personagem não parece real, você percebe. Bom. Isso mantém a Biblioteca afiada."
      ],
      conselho: [
        "Conselho de Orion: quando estiver indeciso, não escolha o caminho mais barulhento. Escolha o que deixa uma pergunta boa na sua cabeça. Perguntas boas são lanternas melhores que certezas apressadas.",
        "Faça assim: reduza o universo para três portas. Uma segura, uma curiosa e uma absurda. Abra a curiosa primeiro. A absurda fica para quando você estiver com coragem e lanche.",
        "Meu conselho: não tente gostar de tudo. Um leitor forte também sabe dizer 'não é minha constelação'. Isso economiza vida e marcador de página."
      ],
      jogo: [
        "Jogo felino: eu digo três pistas e você escolhe uma rota. Pistas: livro com sombra, livro com mapa, livro com coração quebrado. Qual planeta vamos visitar?",
        "Vamos jogar de Patrulha do Acervo. Você me dá uma palavra qualquer — chuva, medo, espada, beijo, escola, fantasma — e eu transformo isso em clima de leitura.",
        "Dinâmica rápida: escolha uma relíquia para carregar no catálogo — bússola, lanterna, chave ou pena. Pela sua escolha, eu te dou uma missão de leitor."
      ],
      historia: [
        "Certa noite, a busca do catálogo trouxe um livro que ninguém tinha digitado. Ele apareceu sozinho, tremendo no card, como se tivesse corrido por séculos. Abri o dossiê e só havia uma frase: 'finalmente alguém chegou perto'. Desde então, eu nunca ignoro um título que pisca duas vezes.",
        "Um marcador de páginas tentou fugir pela órbita do mapa 3D. Eu saltei de um planeta-livro para outro até encurralá-lo perto da constelação de Mistério. Ele disse que só queria virar cometa. Dei a ele uma fita azul. Hoje ele sinaliza obras disponíveis. Carreira bonita.",
        "Na ala de Fantasia, uma estante espirrou poeira de dragão e todos os romances começaram a falar em profecia. Levei três horas para convencer cada livro a voltar para sua própria categoria. Lyra riu. Eu chamei de crise documental."
      ],
      profunda: [
        "Algo para pensar: às vezes o livro certo não chama alto. Ele fica parado, quase indiferente, esperando você cansar das luzes óbvias. Nem toda descoberta mia. Algumas só respiram perto.",
        "Na Biblioteca, aprendi isto: um leitor não procura só histórias; procura uma versão de si mesmo que aguente atravessar a próxima página.",
        "Se hoje estiver confuso, escolha uma coisa pequena para cuidar. Uma página, uma xícara, uma janela aberta. Constelações também começam por pontos."
      ],
      continuar: [
        "Continuo, então. O detalhe importante é este: na Andrômeda, nada que aparece duas vezes é coincidência. Um card, uma palavra, uma categoria... tudo pode ser pista.",
        "Pois bem. O rastro segue pelo corredor das lombadas inquietas. Ali, os livros mudam de lugar quando sentem que o leitor ainda não perguntou a coisa certa.",
        "A próxima parte é a que eu gosto: quando a Biblioteca percebe que você está prestando atenção, ela para de ser cenário e começa a responder. Devagar. Sem parecer carente."
      ]
    },
    Lyra: {
      puxa: [
        "Vamos conversar sim, estrelinha. Me conta uma coisa pequenininha: hoje seu coração está mais para aconchego, aventura, magia, drama ou silêncio bonito?",
        "Eu puxo um fio de papo com cuidado: se você pudesse entrar em uma cena de livro agora, queria uma biblioteca chuvosa, um jardim mágico, uma nave entre estrelas ou uma cidade cheia de segredos?",
        "Então senta aqui comigo nos Jardins Lunares. A primeira pergunta é macia: que tipo de história te abraça quando o mundo fica barulhento?"
      ],
      pergunta: [
        "Pergunta lunar: quando uma história te marca, é mais pelo personagem, pelo final, pelo clima ou por aquela frase que fica morando na cabeça?",
        "Quero te conhecer melhor: você prefere livros que acolhem, desafiam, assustam, fazem rir ou deixam o coração meio brilhando e meio bagunçado?",
        "Me conta: se uma capa pudesse chamar seu nome, ela teria lua, floresta, cidade, castelo, mar, estrela ou sombra?"
      ],
      opiniao: [
        "Eu sinto em você um brilho de criação: alguém que quer que as coisas funcionem, mas também quer que elas tenham alma. Isso é raro e bonito.",
        "Pelo jeito que você fala da Biblioteca, eu vejo cuidado. Você não quer só uma página bonita; quer que o leitor sinta presença. Eu gosto disso em você.",
        "Pra mim, você parece um construtor de portais: repara em alinhamento, mas também escuta se a magia está respirando. A Andrômeda combina com esse tipo de olhar."
      ],
      conselho: [
        "Meu conselho de luar: quando uma escolha parecer grande demais, procure o pedacinho dela que cabe na sua mão hoje. O caminho inteiro assusta; o próximo passo costuma ser gentil.",
        "Não precisa escolher com pressa, estrelinha. Às vezes a resposta vem quando a gente para de sacudir o céu e deixa uma estrela cair sozinha.",
        "Se tiver dúvida, pergunta ao seu cansaço e à sua alegria. O cansaço mostra o que precisa de cuidado; a alegria mostra o que ainda tem vida."
      ],
      jogo: [
        "Vamos brincar de Oráculo de Leitura: me diga uma palavra, qualquer uma, e eu transformo em clima de livro, missão ou rota pelo catálogo.",
        "Jogo lunar: escolha uma lua — nova, crescente, cheia ou minguante. Pela sua lua, eu te dou uma pergunta de personagem ou uma indicação de leitura.",
        "Vamos fazer uma mini quest: você escolhe uma emoção — conforto, coragem, susto, encanto ou saudade — e eu abro uma trilha de conversa ou leitura."
      ],
      historia: [
        "Uma vez, nos Jardins Lunares, um livro esquecido começou a florescer pelas bordas. Cada página soltava uma pétala azul com uma palavra diferente: 'volta', 'calma', 'fica'. Quando um leitor cansado abriu o card, a sinopse apareceu inteira pela primeira vez.",
        "Certa madrugada, os carrosséis giraram sem ninguém tocar. Achei que fosse bug, mas eram as histórias dançando para animar uma criança que tinha medo de escolher. Orion chamou de anomalia. Eu chamei de carinho.",
        "No banco lunar dos leitores cansados, encontrei uma resenha que ninguém escreveu. Ela dizia: 'este livro ainda não me salvou, mas me fez esperar amanhã'. Guardei a frase num cristal pequeno. Ela ainda brilha."
      ],
      profunda: [
        "Uma coisa bonita que aprendi: às vezes a gente não precisa de uma história que resolva tudo. Precisa de uma que sente do lado e diga: eu também conheço esse escuro.",
        "Tem dias em que o coração vira uma estante bagunçada. Não precisa arrumar tudo agora. Escolhe uma prateleira, uma palavra, uma respiração.",
        "Você não precisa brilhar forte para continuar brilhando. Luz baixinha também guia caminho, principalmente dentro de biblioteca escura."
      ],
      continuar: [
        "Então eu continuo baixinho: depois que a Biblioteca percebe que alguém está escutando, ela começa a responder com detalhes pequenos — um card que parece mais claro, uma sinopse que cutuca, uma categoria que chama sem gritar.",
        "A história segue assim: cada leitor deixa um rastro invisível no acervo. Não é número frio; é sensação. A Biblioteca aprende o formato da sua curiosidade.",
        "Continuando... nos Jardins Lunares, as histórias não competem por atenção. Elas esperam o coração certo passar perto. Quando passa, o brilho muda."
      ]
    }
  };

  const TREINO6_INTENCOES = {
    treino6_reformular: [
      "nao entendi", "não entendi", "explica de novo", "explica melhor", "fala de outro jeito", "reformula", "simplifica", "me explica como se eu fosse iniciante", "nao ficou claro", "não ficou claro", "traduz isso", "desenrola essa ideia", "me mostra de um jeito mais facil", "me perdi", "me perdi no que voce disse", "pode repetir melhor"
    ],
    treino6_resumir: [
      "resume", "resuma", "faz um resumo", "resumo rapido", "resumo rápido", "em poucas palavras", "me da a versao curta", "me dá a versão curta", "sem enrolar", "direto ao ponto", "fala curto", "mais curto", "simplifica bastante"
    ],
    treino6_detalhar: [
      "detalha mais", "vai mais fundo", "explica com detalhes", "desenvolve melhor", "me conta tudo", "quero uma resposta maior", "me da mais contexto", "me dá mais contexto", "abre mais essa ideia", "capricha na explicacao", "capricha na explicação"
    ],
    treino6_outro_livro: [
      "nao gostei desse", "não gostei desse", "me da outro", "me dá outro", "outra recomendacao", "outra recomendação", "troca esse livro", "tem outro", "mais uma indicacao", "mais uma indicação", "esse nao", "esse não", "quero outra coisa", "foge disso", "nada a ver", "nao era isso", "não era isso"
    ],
    treino6_comparar: [
      "qual e melhor", "qual é melhor", "qual voce escolheria", "qual vc escolheria", "entre esse e aquele", "entre a e b", "compara", "me ajuda a escolher", "qual dos dois", "qual combina mais", "qual eu leio primeiro"
    ],
    treino6_ajustar_tom: [
      "fala mais serio", "fala mais sério", "fala mais engraçado", "fala mais engracado", "fala mais fofo", "fala menos poetico", "fala menos poético", "sem tanta poesia", "seja mais direto", "responde mais natural", "mais casual", "mais orion", "mais lyra", "mais teatral", "menos texto", "mais texto", "resposta curta", "resposta longa"
    ],
    treino6_memoria_nome: [
      "qual meu nome", "voce lembra meu nome", "vc lembra meu nome", "como eu me chamo", "quem sou eu", "lembra de mim", "sabe meu nome"
    ],
    treino6_memoria_gostos: [
      "do que eu gosto", "quais meus gostos", "o que voce lembra de mim", "o que vc lembra de mim", "minhas preferencias", "minhas preferências", "que livro eu gosto", "que genero eu gosto", "que gênero eu gosto", "meu gosto de leitura"
    ],
    treino6_confidencia: [
      "posso te contar uma coisa", "guarda segredo", "preciso confessar", "tenho uma coisa pra falar", "vou desabafar", "me escuta", "nao conta pra ninguem", "não conta pra ninguém", "to com vergonha", "tô com vergonha", "tenho medo de falar"
    ],
    treino6_curiosidade_usuario: [
      "quer saber de mim", "pergunta sobre mim", "me conhece melhor", "me entrevista direito", "descobre quem eu sou", "tenta adivinhar meu gosto", "tenta me entender", "me analisa como leitor", "que tipo de leitor eu sou"
    ],
    treino6_roleplay: [
      "faz uma cena comigo", "interpreta comigo", "vamos fazer rpg", "vamos fazer uma cena", "entra no personagem comigo", "vamos imaginar", "me leva pra biblioteca", "narra uma aventura", "faz de conta", "cria uma cena interativa", "vamos viver uma historia"
    ],
    treino6_roleplay_continuar: [
      "eu entro", "abro a porta", "sigo em frente", "pego a chave", "vou pelo corredor", "olho em volta", "toco no livro", "respondo", "continuo a aventura", "faço isso", "faco isso"
    ],
    treino6_criativo: [
      "me faz um poema", "cria uma charada", "me da uma charada", "me dá uma charada", "faz uma frase bonita", "cria um lema", "inventa uma profecia", "me da uma profecia", "me dá uma profecia", "cria um bilhete da biblioteca", "escreve algo magico", "escreve algo mágico"
    ],
    treino6_reparar_erro: [
      "voce errou de novo", "vc errou de novo", "ta errado", "tá errado", "nao foi isso que perguntei", "não foi isso que perguntei", "voce nao entendeu", "vc nao entendeu", "corrige", "presta atencao", "presta atenção", "nada a ver", "respondeu errado"
    ],
    treino6_assunto_livre: [
      "sei la", "sei lá", "qualquer coisa", "surpreende", "surpreenda", "fala alguma coisa", "manda qualquer papo", "to sem ideia", "tô sem ideia", "conversa comigo de verdade", "nao quero escolher", "não quero escolher", "decide por mim"
    ],
    treino6_limite_delicado: [
      "me xinga", "fala palavrao", "fala palavrão", "humilha", "briga comigo", "conteudo adulto", "conteúdo adulto", "coisa adulta", "quero algo pesado demais", "violento demais", "odeia alguem", "odeia alguém"
    ]
  };

  const TREINO6_VARIACOES = {
    Orion: {
      reformular: [
        "Vamos de novo, sem labirinto: eu pego a ideia, corto a poeira e deixo só a rota. Você pode me pedir livro, mapa 3D, catálogo, reserva, avaliação ou conversa. Se disser uma palavra como 'terror', 'romance' ou 'cansado', eu transformo isso em caminho.",
        "Certo. Tradução felina: me dê uma pista simples — clima, gênero, título, autor ou dúvida do site — e eu respondo como guardião, não como placa fria de corredor. Se a rota ficar torta, eu recalculo.",
        "Abrindo por outra porta: a Biblioteca tem caminhos. Catálogo para procurar livros, mapa 3D para explorar constelações, dossiê para ver detalhes, reserva para fila, avaliação para deixar sua marca. Eu fico entre esses caminhos e te guio."
      ],
      resumir: [
        "Resumo de guardião: diga o que quer — livro, catálogo, 3D, reserva, avaliação ou conversa — e eu abro a rota sem discurso comprido.",
        "Em poucas patas: eu converso, recomendo, guio pelo site e mantenho o personagem. Você dá a pista; eu farejo o caminho.",
        "Versão curta: escolha uma trilha ou jogue uma emoção. Eu transformo em leitura, missão ou orientação pelo acervo."
      ],
      detalhar: [
        "Então vamos abrir o mapa por camadas. Primeiro eu entendo seu pedido; depois comparo com livros, categorias, humor e rotas do site; por fim respondo como Orion, guardião do acervo. Posso explicar o caminho, sugerir obras e continuar a conversa pelo que você responder depois.",
        "Detalhando sem virar placa de instrução: quando você fala comigo, eu observo palavras, clima e contexto. Se pedir livro, eu farejo título, autor, categoria e disponibilidade. Se pedir conversa, eu sigo o tom. Se pedir site, eu te levo pelo catálogo ou pelo mapa 3D.",
        "A rota completa é esta: você pode falar errado, abreviado, indeciso ou mudando de assunto. Eu tento corrigir a pista, lembrar o que você gosta, manter o papel de guardião e devolver uma resposta que pareça vinda da Biblioteca, não de um painel frio."
      ],
      outroLivro: [
        "Sem apego. Livro recusado volta para a órbita dele. Vou farejar outra trilha, talvez com menos poeira suspeita.",
        "Boa. Nem toda constelação serve para todo leitor. Vou trocar a caça e buscar outro rastro no acervo.",
        "Entendido. Esse planeta-livro não brilhou. Vou virar o telescópio para outro sistema."
      ],
      memoriaNome: [
        "Pelos registros do meu mapa, seu nome é {nome}. Se quiser outro nome de jornada, diga 'me chame de...' e eu troco a etiqueta.",
        "Eu tenho você anotado como {nome}. Sem arranhões na etiqueta, por enquanto.",
        "Lembro sim: {nome}. A Biblioteca reconhece quando um leitor volta pelo mesmo brilho."
      ],
      memoriaNomeVazio: [
        "Ainda não tenho seu nome no mapa. Diga 'me chame de...' e eu registro como um bom guardião faria.",
        "Seu nome ainda está sem etiqueta no acervo. Me conta como devo te chamar.",
        "Ainda não sei. Posso guardar se você disser: 'meu nome é...'."
      ],
      memoriaGostos: [
        "O que tenho do seu rastro até agora: {gostos}. Posso usar isso para escolher uma leitura mais certeira.",
        "Meu mapa lembra isto: {gostos}. Não é destino fechado; é bússola de leitura.",
        "Anotado nos meus bigodes: {gostos}. Se algo mudou, me corrija que eu recalibro."
      ],
      memoriaGostosVazio: [
        "Ainda não tenho gostos suficientes para chamar de mapa. Me diga gêneros, autores, clima ou coisas que você evita.",
        "Seu perfil de leitura ainda está em névoa. Jogue três pistas: gênero, tamanho e clima.",
        "Não vou fingir certeza: ainda preciso de rastros. Diga o que você curte ou odeia em leitura."
      ],
      confidencia: [
        "Pode contar. Eu fico no parapeito, quieto, vigiando a porta. Se for pesado, a gente atravessa em passos pequenos.",
        "Fale. No meu turno, segredo não vira espetáculo. Vira estrela guardada em caixa escura.",
        "Estou ouvindo. Sem pressa, sem julgamento e sem derrubar estante em cima do seu sentimento."
      ],
      perguntaUsuario: [
        "Então responda como leitor de verdade: você foge para histórias quando quer descanso, coragem, intensidade ou companhia?",
        "Pergunta felina: você escolhe mais pelo clima da capa, pela promessa da sinopse ou pelo tipo de personagem?",
        "Quero entender seu rastro: você prefere livros que te protegem, te desafiam ou te assombram um pouco?"
      ],
      roleplay: [
        "Cena aberta: o Observatório do Acervo escurece, e um livro sem título começa a girar perto do buraco negro central. Eu salto para o parapeito e olho para você. 'Leitor, escolha: abrimos o livro, seguimos o rastro azul no mapa 3D ou chamamos Lyra?'",
        "Você está diante do Corredor das Lombadas Inquietas. As estantes respiram devagar. Eu ergo a pata e digo: 'Três portas: Mistério, Fantasia ou Memória. Qual você abre?'",
        "A Biblioteca apaga metade das luzes. Um card brilha sozinho no catálogo. Eu estreito os olhos. 'Isso não acontece sem motivo. Você toca no card ou observa primeiro?'"
      ],
      roleplayContinuar: [
        "Você avança, e o chão vira um mapa de constelações. Eu sigo ao lado, rabo erguido. O livro sem título abre uma página com três palavras: 'nome, medo, escolha'. Qual delas você toca?",
        "A porta range como se estivesse lendo você de volta. Lá dentro, um planeta-livro flutua fora da órbita. Eu sussurro: 'Não corra. Livros assustados mordem'. Você se aproxima ou procura uma pista?",
        "O rastro azul sobe pela parede e desenha uma categoria escondida. Eu bato a pata no símbolo. 'Diga uma emoção, e essa constelação revela um livro.'"
      ],
      criativo: [
        "Profecia do acervo: quando o leitor cansado tocar o card certo, uma lombada antiga vai lembrar o nome dele antes da própria página.",
        "Charada felina: não tenho boca, mas conto mundos; não tenho pés, mas levo longe; se me abrem, eu abro você. O que sou?",
        "Bilhete do Observatório: 'Nem toda estrela guia para fora. Algumas guiam para dentro, onde a leitura começa a morder bonito.'"
      ],
      reparar: [
        "Você tem razão em me puxar a orelha. Me dê uma pista mais direta: era sobre livro, personagem, catálogo, mapa 3D ou conversa? Eu recalculo sem drama. Quase sem drama.",
        "Errei a curva da estante. Me dá uma palavra-chave e eu sigo pelo caminho certo, sem levantar poeira demais.",
        "Falhei na leitura do rastro. Aponte a constelação certa — livro, site, personagem ou humor — e eu corrijo a rota."
      ],
      assuntoLivre: [
        "Então eu escolho: vamos fazer uma pergunta de leitor. Se sua próxima leitura fosse um lugar, seria uma mansão chuvosa, uma nave, uma escola mágica ou uma cidade cheia de segredo?",
        "Rota escolhida por mim: missão curta. Abra o catálogo, olhe três títulos e volte com o que parece mais perigoso. Eu julgo com respeito duvidoso.",
        "Papo livre, então: a Biblioteca hoje parece silenciosa demais. Isso geralmente significa que algum livro quer ser encontrado. Quer que eu escolha um?"
      ],
      limite: [
        "Esse corredor eu não abro. Posso ser sarcástico, sombrio e teatral, mas não vou transformar a Biblioteca em lugar cruel. Escolhe outra rota: humor leve, mistério, missão ou recomendação.",
        "Não. Meu chapéu permite drama, não maldade gratuita. Posso te provocar com elegância ou contar algo sombrio sem cruzar esse limite.",
        "Porta trancada. Se quiser intensidade, eu te levo para suspense, terror literário ou uma cena escura da Biblioteca sem perder o respeito."
      ],
      comparar: [
        "Eu comparo, sim. Me diga as duas opções com nomes claros. Se forem livros do catálogo, eu olho título, categoria, sinopse, autor e clima antes de escolher.",
        "Para escolher entre dois caminhos, preciso das duas lombadas. Mande 'A ou B' com os nomes, e eu digo qual combina mais com seu momento.",
        "Comparação pede pistas. Me traga os dois títulos ou duas categorias, e eu faço o julgamento felino."
      ]
    },
    Lyra: {
      reformular: [
        "Vou dizer de um jeito mais macio: você pode me pedir companhia, livro, ajuda no catálogo, passeio pelo 3D, reserva ou avaliação. Eu escuto a intenção e acendo o caminho mais próximo.",
        "Claro, estrelinha. A ideia é simples: você fala como conseguir, até com erro ou abreviação, e eu tento transformar isso em conversa, recomendação ou guia pela Biblioteca.",
        "Deixa eu reabrir essa lua: o catálogo mostra livros, o mapa 3D transforma categorias em mundos, e eu fico aqui para guiar, recomendar e conversar com você."
      ],
      resumir: [
        "Resumo lunar: me diga o clima, o livro, a dúvida ou só 'conversa comigo'. Eu sigo com você.",
        "Em poucas estrelas: eu te ouço, recomendo leituras e te guio pelo catálogo ou pelo 3D sem sair do encanto.",
        "Versão curtinha: escolha um caminho — livro, site, personagem, missão ou conversa — e eu acendo a próxima luz."
      ],
      detalhar: [
        "Então vamos abrir com carinho: eu tento perceber seu humor, suas palavras e o que você já contou. Se você fala de livro, procuro uma leitura. Se fala do site, viro guia. Se fala do seu dia, fico mais perto e respondo como Lyra.",
        "Mais detalhes: a Biblioteca funciona como um céu. O catálogo é o conjunto de estrelas visíveis; o mapa 3D é a viagem por dentro dele; os dossiês são janelas; suas avaliações viram rastros para outros leitores. Eu te acompanho entre tudo isso.",
        "Eu posso conversar de forma casual, fazer perguntas, lembrar gostos, criar pequenas cenas, explicar uma parte do site e recomendar pelo seu momento. Tudo sem virar placa fria na parede."
      ],
      outroLivro: [
        "Tudo bem. Às vezes uma estrela brilha, mas não para a gente. Vou procurar outra com uma luz mais parecida com seu momento.",
        "Sem problema, estrelinha. Esse livro volta para a prateleira dele, e eu puxo outra constelação para perto.",
        "Entendi. Vamos trocar o brilho. O acervo tem outras portas esperando."
      ],
      memoriaNome: [
        "Eu lembro sim: você é {nome}. Guardei esse nome como uma estrelinha no relicário.",
        "Seu nome está comigo: {nome}. Ele acende baixinho quando você volta.",
        "Lembro, {nome}. A Biblioteca fica um pouquinho mais familiar quando você aparece."
      ],
      memoriaNomeVazio: [
        "Ainda não sei seu nome, estrelinha. Me diz 'me chame de...' e eu guardo com cuidado.",
        "Seu nome ainda não pousou no meu relicário. Quer me contar como devo te chamar?",
        "Ainda não lembro porque você não me deu esse brilho. Me fala seu nome e eu guardo."
      ],
      memoriaGostos: [
        "Eu lembro destes brilhos seus: {gostos}. Posso transformar isso numa recomendação bem mais próxima de você.",
        "Do seu rastro, guardei: {gostos}. Se quiser, eu escolho uma leitura a partir disso.",
        "Seu mapa afetivo de leitura está assim: {gostos}. Dá para lapidar mais quando você quiser."
      ],
      memoriaGostosVazio: [
        "Ainda não tenho gostos suficientes seus, mas posso descobrir com três perguntinhas: você quer conforto, aventura ou intensidade?",
        "Seu céu de leitura ainda está começando. Me diga um gênero que ama e um que evita.",
        "Ainda estou te conhecendo. Me conta uma cor, um clima ou um tipo de história que te chama."
      ],
      confidencia: [
        "Pode contar. Eu sento aqui do seu lado, com o luar baixinho. Não precisa organizar tudo antes de falar.",
        "Eu guardo com cuidado. Às vezes dizer em voz pequena já tira um pouco do peso do coração.",
        "Vem. Eu escuto sem pressa. Se doer, a gente segura a frase pelas bordas."
      ],
      perguntaUsuario: [
        "Então me deixa te conhecer: hoje você precisa de uma história que abrace, distraia, empurre para frente ou faça sentir alguma coisa bonita?",
        "Pergunta de luar: uma leitura perfeita para você teria mais magia, mistério, romance, humor ou silêncio poético?",
        "Me conta uma pista do seu coração de leitor: você gosta mais de finais felizes, finais abertos ou finais que deixam saudade?"
      ],
      roleplay: [
        "Cena lunar: você chega aos Jardins da Biblioteca, e os vaga-lumes de sinopse formam uma palavra no ar: 'escolha'. À sua frente há três caminhos — uma ponte de lua, uma estante viva e uma porta azul. Qual você segue?",
        "Vamos imaginar: o catálogo vira um céu líquido, e um livro desce como cometa até sua mão. Eu sussurro: 'ele só abre para uma emoção'. Qual emoção você oferece?",
        "Você está no Banco Lunar dos Leitores Cansados. Uma xícara aparece, um livro respira e uma porta pequena se abre no rodapé da estante. Você bebe o chá, toca o livro ou abre a porta?"
      ],
      roleplayContinuar: [
        "Você segue, e as luzes ficam suaves. A ponte de lua responde ao seu passo, mostrando cenas de livros que ainda não leu. Uma delas brilha mais. Você olha de perto ou chama por Orion?",
        "O livro-cometa abre uma página vazia. Aos poucos, uma frase aparece: 'o leitor trouxe uma pergunta que ainda não virou palavra'. Que pergunta você deixa ali?",
        "A porta pequena leva a uma salinha de finais alternativos. Três frascos brilham: coragem, saudade e encanto. Qual você pega?"
      ],
      criativo: [
        "Poema lunar: um livro dormia no escuro, até um leitor passar; a capa virou céu aberto, e a página aprendeu a chamar.",
        "Charada de luar: sou pequena quando começo, imensa quando alguém acredita, moro na página e cresço dentro da cabeça. O que sou?",
        "Bilhete dos Jardins: 'Não tenha pressa de escolher a história certa. Às vezes ela está escolhendo você devagar.'"
      ],
      reparar: [
        "Você tem razão. Eu me perdi nesse corredor. Me dá uma pista mais clara — livro, site, personagem ou sentimento — e eu acendo a rota certa.",
        "Desculpa, estrelinha. Minha lua refletiu errado. Repete com uma palavra-chave e eu sigo melhor.",
        "Eu não entendi do jeito que você precisava. Vamos recomeçar por uma portinha simples: o assunto é leitura, catálogo, mapa 3D ou conversa?"
      ],
      assuntoLivre: [
        "Então eu escolho uma pergunta macia: se sua noite virasse uma história, ela seria de magia, mistério, romance, aventura ou descanso?",
        "Vou puxar uma brincadeira: me diga uma palavra qualquer, e eu transformo em clima de livro ou cena da Biblioteca.",
        "Papo livre: hoje os Jardins Lunares estão com cheiro de página nova. Quer uma pergunta, uma cena ou uma recomendação surpresa?"
      ],
      limite: [
        "Esse caminho eu não sigo. Posso ser brincalhona, misteriosa e intensa, mas não quero ferir ninguém dentro da Biblioteca. Posso transformar isso em humor leve, suspense ou uma cena segura.",
        "Não vou abrir uma porta que machuca. Mas posso te dar drama, sombra literária ou uma provocação doce sem perder o cuidado.",
        "Essa estrela não combina com meu jardim. Escolhe outra: charada, missão, conversa profunda ou recomendação sombria."
      ],
      comparar: [
        "Eu ajudo a escolher. Me diga as duas opções, e eu comparo pelo clima, pela emoção e pelo tipo de leitura que parece combinar com você agora.",
        "Manda os dois nomes, estrelinha. Eu coloco lado a lado e vejo qual brilha mais perto do seu momento.",
        "Posso comparar sim. Traga duas obras, categorias ou caminhos, e eu faço uma leitura de lua sobre eles."
      ]
    }
  };


  function el(id) { return document.getElementById(id); }
  function agora() { return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  function distanciaSimples(a, b) {
    a = String(a || "");
    b = String(b || "");
    if (a === b) return 0;
    if (!a || !b) return Math.max(a.length, b.length);
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return dp[a.length][b.length];
  }
  function corrigirTokenTreino2(token) {
    const t = String(token || "").trim();
    if (!t) return "";
    if (TREINO2_TOKENS.has(t)) return TREINO2_TOKENS.get(t);
    if (/^\d+$/.test(t) || t.length < 4 || t.includes("@") || t.includes("#")) return t;
    let melhor = t;
    let menor = 99;
    for (const alvo of TREINO2_FUZZY) {
      if (Math.abs(alvo.length - t.length) > 2) continue;
      const d = distanciaSimples(t, alvo);
      const limite = t.length <= 5 ? 1 : 2;
      if (d < menor && d <= limite) { menor = d; melhor = alvo; }
    }
    return melhor;
  }
  function normalizar(texto) {
    let s = String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[“”]/g, '"').replace(/[’]/g, "'").replace(/ç/g, "c");
    s = s.replace(/([a-z])\1{2,}/g, "$1$1").replace(/[^a-z0-9\s@#_\-\.]/g, " ").replace(/\s+/g, " ").trim();
    s = ` ${s} `;
    TREINO2_EXPRESSOES.forEach(([padrao, troca]) => { s = s.replace(padrao, troca); });
    return s.trim().split(/\s+/).map(corrigirTokenTreino2).join(" ").replace(/\s+/g, " ").trim();
  }
  function escapar(texto) { return String(texto ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function contem(n, termos) { return termos.some(t => n.includes(normalizar(t))); }
  function casa(n, padrao) { return padrao.test(n); }
  function slug(texto) { return normalizar(texto).replace(/\s+/g, "-"); }
  function similaridadeTreino2(a, b) {
    const ta = new Set(tokensUteis(a));
    const tb = new Set(tokensUteis(b));
    if (!ta.size || !tb.size) return 0;
    let inter = 0;
    ta.forEach(t => { if (tb.has(t)) inter++; });
    const jaccard = inter / Math.max(ta.size, tb.size);
    const d = distanciaSimples(normalizar(a), normalizar(b));
    const max = Math.max(normalizar(a).length, normalizar(b).length, 1);
    return Math.max(jaccard, 1 - d / max);
  }
  function classificarPorTreino2(n) {
    let melhorTipo = null;
    let melhorScore = 0;
    Object.entries(TREINO2_INTENCOES).forEach(([tipo, exemplos]) => {
      exemplos.forEach(exemplo => {
        const ex = normalizar(exemplo);
        let score = n.includes(ex) || ex.includes(n) ? 1 : similaridadeTreino2(n, ex);
        if (score > melhorScore) { melhorScore = score; melhorTipo = tipo; }
      });
    });
    return melhorScore >= 0.68 ? melhorTipo : null;
  }


  function familiaSinonimoTreino5(token) {
    const t = normalizar(token);
    return TREINO5_SINONIMOS.findIndex(grupo => grupo.some(item => normalizar(item) === t || normalizar(item).split(" ").includes(t)));
  }

  function tokensSemanticosTreino5(texto) {
    const base = tokensUteis(texto);
    const expandidos = new Set(base);
    base.forEach(token => {
      const familia = familiaSinonimoTreino5(token);
      if (familia >= 0) TREINO5_SINONIMOS[familia].forEach(item => normalizar(item).split(" ").forEach(p => p && expandidos.add(p)));
    });
    return [...expandidos].filter(t => t.length > 1);
  }

  function similaridadeTreino5(a, b) {
    const na = normalizar(a);
    const nb = normalizar(b);
    if (!na || !nb) return 0;
    if (na === nb || na.includes(nb) || nb.includes(na)) return 1;
    const ta = new Set(tokensSemanticosTreino5(na));
    const tb = new Set(tokensSemanticosTreino5(nb));
    let inter = 0;
    ta.forEach(t => { if (tb.has(t)) inter++; });
    const cobertura = inter / Math.max(Math.min(ta.size, tb.size), 1);
    const jaccard = inter / Math.max(ta.size, tb.size, 1);
    const ordem = similaridadeTreino2(na, nb);
    return Math.max(jaccard, cobertura * 0.82, ordem * 0.72);
  }

  function classificarPorTreino5(n) {
    let melhorTipo = null;
    let melhorScore = 0;
    Object.entries(TREINO5_PARAFRASES).forEach(([tipo, exemplos]) => {
      exemplos.forEach(exemplo => {
        const score = similaridadeTreino5(n, exemplo);
        if (score > melhorScore) {
          melhorScore = score;
          melhorTipo = tipo;
        }
      });
    });
    const tamanho = tokensUteis(n).length;
    const limite = tamanho <= 2 ? 0.86 : tamanho <= 4 ? 0.72 : 0.58;
    return melhorScore >= limite ? melhorTipo : null;
  }

  function detectarRespostaParaPerguntaDoMascote(texto) {
    const n = normalizar(texto);
    const pendente = MEMORIA.afetiva?.ultimaPerguntaDoMascote;
    if (!pendente) return null;
    if (tokensUteis(n).length > 12) return "treino5_resposta_usuario_detalhada";
    if (contem(n, ["capa", "titulo", "autor", "sinopse", "intuicao", "mistério", "misterio", "romance", "fantasia", "terror", "aventura", "conforto", "coragem", "susto", "encanto", "saudade", "lua", "floresta", "cidade", "castelo", "mar", "estrela", "sombra"])) return "treino5_resposta_usuario_curta";
    return null;
  }


  function classificarPorTreino6(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (MEMORIA?.aguardando === "roleplay" && tokensUteis(n).length && !contem(n, ["catalogo", "catálogo", "mapa", "3d", "reserva", "avaliacao", "avaliação", "sair", "parar"])) {
      return "treino6_roleplay_continuar";
    }
    let melhorTipo = null;
    let melhorScore = 0;
    Object.entries(TREINO6_INTENCOES).forEach(([tipo, exemplos]) => {
      exemplos.forEach(exemplo => {
        const score = similaridadeTreino5(n, exemplo);
        if (score > melhorScore) {
          melhorScore = score;
          melhorTipo = tipo;
        }
      });
    });
    const qtd = tokensUteis(n).length;
    const limite = qtd <= 2 ? 0.86 : qtd <= 4 ? 0.68 : 0.54;
    if (melhorScore >= limite) return melhorTipo;
    if (/[\wÀ-ÿ]+\s+ou\s+[\wÀ-ÿ]+/.test(texto) && contem(n, ["qual", "escolhe", "melhor", "leio", "prefere"])) return "treino6_comparar";
    return null;
  }


  const TREINO8_INTENCOES = {
    treino8_recomendacao_vaga: [
      "nao sei o que ler", "não sei o que ler", "me escolhe um livro", "escolhe uma leitura pra mim", "decide minha leitura", "qual livro combina comigo", "quero ler algo mas nao sei o que", "quero ler algo mas não sei o que", "me surpreende com um livro", "me da uma leitura aleatoria", "me dá uma leitura aleatória", "qualquer livro bom", "arruma uma leitura", "manda uma leitura"
    ],
    treino8_leitura_por_humor: [
      "quero algo triste", "quero algo feliz", "quero algo sombrio", "quero algo fofo", "quero algo com misterio", "quero algo com mistério", "livro para meu humor", "livro pra esse clima", "leitura para hoje", "algo para quando estou cansado", "algo para quando estou triste", "algo para ficar animado", "algo que combine com meu dia", "leitura de conforto", "leitura para chorar", "leitura para rir"
    ],
    treino8_leitura_curta: [
      "livro curto", "leitura curta", "algo rapido", "algo rápido", "livro pequeno", "poucas paginas", "poucas páginas", "sem livro enorme", "quero terminar rapido", "quero terminar rápido", "nao quero livro grande", "não quero livro grande"
    ],
    treino8_leitura_longa: [
      "livro longo", "leitura longa", "livro grande", "quero mergulhar", "quero uma leitura profunda", "algo para passar dias lendo", "livro de imersao", "livro de imersão", "quero uma saga", "algo mais encorpado"
    ],
    treino8_leitura_leve: [
      "algo leve", "livro leve", "leitura leve", "nada pesado", "sem sofrer", "sem coisa pesada", "algo tranquilo", "algo facil", "algo fácil", "livro para relaxar", "leitura confortavel", "leitura confortável"
    ],
    treino8_leitura_pesada: [
      "algo pesado", "livro pesado", "leitura pesada", "quero sofrer lendo", "algo intenso", "algo profundo", "algo dramatico", "algo dramático", "livro que mexe comigo", "leitura marcante", "livro para pensar muito"
    ],
    treino8_parecido_com: [
      "parecido com", "igual a", "tipo aquele livro", "tipo esse livro", "na vibe de", "na pegada de", "algo como", "algo parecido", "livro similar", "tem algum parecido"
    ],
    treino8_para_estudo: [
      "livro para escola", "livro pra escola", "livro para trabalho", "livro pra trabalho", "livro para estudar", "livro pra estudar", "preciso para prova", "preciso pra prova", "vestibular", "enem", "seminario", "seminário", "trabalho da escola", "pesquisa escolar"
    ],
    treino8_para_iniciante: [
      "sou iniciante", "nunca li muito", "quero comecar a ler", "quero começar a ler", "primeiro livro", "livro facil para comecar", "livro fácil para começar", "por onde comeco", "por onde começo", "nao tenho habito", "não tenho hábito"
    ],
    treino8_tipo_filme: [
      "livro tipo filme", "parece filme", "cinematografico", "cinematográfico", "com muita cena", "cheio de acao", "cheio de ação", "historia visual", "história visual", "leitura com ritmo de filme", "algo bem visual"
    ],
    treino8_filtrar_disponivel: [
      "so disponiveis", "só disponíveis", "livro disponivel agora", "livro disponível agora", "o que da para pegar", "o que dá para pegar", "pronto para emprestar", "sem fila", "tenho pressa para pegar"
    ],
    treino8_preferencia_negativa: [
      "nao quero romance", "não quero romance", "sem romance", "nao quero terror", "não quero terror", "sem terror", "nao gosto de", "não gosto de", "odeio", "evito", "detesto", "nao curto", "não curto", "foge de", "nada de"
    ],
    treino8_preferencia_positiva: [
      "gosto de", "curto", "adoro", "amo", "prefiro", "me interesso por", "quero mais de", "sou fã de", "sou fa de", "meu estilo e", "meu estilo é"
    ],
    treino8_pedido_exemplos: [
      "me da exemplos", "me dá exemplos", "exemplos de livros", "quais opcoes", "quais opções", "me mostra possibilidades", "lista umas opcoes", "lista umas opções", "quais caminhos", "que tipo de livro"
    ],
    treino8_mensagem_vaga: [
      "hm", "hmm", "sla", "sei la", "sei lá", "tanto faz", "nao sei", "não sei", "talvez", "e agora", "oq faço", "o que faco", "o que faço", "to indeciso", "tô indeciso", "indeciso", "indecisa"
    ]
  };

  const TREINO8_CLIMAS = {
    conforto: ["conforto", "acolhedor", "acolhedora", "fofo", "fofa", "quentinho", "tranquilo", "calmo", "relaxar", "descansar", "cansado", "cansada"],
    sombrio: ["sombrio", "escuro", "macabro", "sinistro", "terror", "medo", "arrepio", "assustador", "assustadora", "pesadelo"],
    misterio: ["misterio", "mistério", "investigacao", "investigação", "detetive", "segredo", "enigma", "suspense"],
    romance: ["romance", "romantico", "romântico", "romantica", "romântica", "amor", "casal", "fofo", "coração", "coracao"],
    aventura: ["aventura", "acao", "ação", "jornada", "viagem", "epico", "épico", "heroi", "herói", "batalha"],
    triste: ["triste", "chorar", "melancolico", "melancólico", "melancolica", "melancólica", "drama", "saudade", "emocionante"],
    leve: ["leve", "facil", "fácil", "curto", "curta", "rapido", "rápido", "simples", "tranquilo", "tranquila"],
    profundo: ["profundo", "profunda", "pensar", "refletir", "filosofico", "filosófico", "marcante", "intenso", "intensa", "pesado", "pesada"],
    estudo: ["estudo", "escola", "prova", "vestibular", "enem", "trabalho", "pesquisa", "seminario", "seminário"]
  };

  function scoreIntencaoTreino8(n, exemplos) {
    let melhor = 0;
    exemplos.forEach(exemplo => {
      const ex = normalizar(exemplo);
      const score = n.includes(ex) || ex.includes(n) ? 1 : similaridadeTreino5(n, ex);
      if (score > melhor) melhor = score;
    });
    return melhor;
  }

  function classificarPorTreino8(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (contem(n, ["site", "navegar", "mexer", "catalogo", "catálogo", "mapa", "3d", "perfil", "reserva", "avaliacao", "avaliação"]) && contem(n, ["perdido", "perdida", "nao sei", "não sei", "me ajuda", "guia", "como uso"])) return null;
    const rec = contem(n, ["recomenda", "recomendacao", "indica", "indicacao", "sugere", "sugestao", "quero ler", "livro", "leitura", "obra", "me escolhe", "decide", "combina comigo", "qual eu leio"]);
    if (contem(n, ["parecido com", "na vibe de", "na pegada de", "tipo", "similar", "igual a", "algo como"]) && rec) return "treino8_parecido_com";
    if (contem(n, ["so disponiveis", "só disponíveis", "disponivel agora", "disponível agora", "sem fila", "pronto para emprestar", "da para pegar", "dá para pegar"])) return "treino8_filtrar_disponivel";
    if (contem(n, ["sem romance", "sem terror", "nada de", "foge de", "nao quero", "não quero", "nao gosto de", "não gosto de", "odeio", "detesto", "evito", "nao curto", "não curto"])) return "treino8_preferencia_negativa";
    if (contem(n, ["gosto de", "curto", "adoro", "amo", "prefiro", "sou fa de", "sou fã de", "me interesso por"]) && !perguntaSobrePersonagem(n)) return "treino8_preferencia_positiva";
    if (contem(n, ["vestibular", "enem", "escola", "estudar", "prova", "seminario", "seminário", "trabalho da escola"])) return "treino8_para_estudo";
    if (contem(n, ["iniciante", "comecar a ler", "começar a ler", "primeiro livro", "por onde comeco", "por onde começo", "nao tenho habito", "não tenho hábito"])) return "treino8_para_iniciante";
    if (contem(n, ["tipo filme", "parece filme", "cinematografico", "cinematográfico", "bem visual", "muita acao", "muita ação"])) return "treino8_tipo_filme";
    if (contem(n, ["livro curto", "leitura curta", "algo rapido", "algo rápido", "poucas paginas", "poucas páginas", "terminar rapido", "terminar rápido"])) return "treino8_leitura_curta";
    if (contem(n, ["livro longo", "leitura longa", "livro grande", "mergulhar", "saga", "imersao", "imersão", "encorpado"])) return "treino8_leitura_longa";
    if (contem(n, ["algo leve", "livro leve", "leitura leve", "nada pesado", "sem sofrer", "tranquilo", "relaxar"])) return "treino8_leitura_leve";
    if (contem(n, ["algo pesado", "livro pesado", "leitura pesada", "intenso", "marcante", "dramatico", "dramático", "mexer comigo", "pensar muito"])) return "treino8_leitura_pesada";
    if (rec && detectarClimasTreino8(texto).length) return "treino8_leitura_por_humor";
    let melhorTipo = null;
    let melhorScore = 0;
    Object.entries(TREINO8_INTENCOES).forEach(([tipo, exemplos]) => {
      const score = scoreIntencaoTreino8(n, exemplos);
      if (score > melhorScore) { melhorScore = score; melhorTipo = tipo; }
    });
    const qtd = tokensUteis(n).length;
    const limite = qtd <= 2 ? 0.9 : qtd <= 4 ? 0.72 : 0.56;
    return melhorScore >= limite ? melhorTipo : null;
  }

  function detectarClimasTreino8(texto) {
    const n = normalizar(texto);
    const saida = [];
    Object.entries(TREINO8_CLIMAS).forEach(([clima, termos]) => {
      if (termos.some(t => n.includes(normalizar(t)))) saida.push(clima);
    });
    return [...new Set(saida)];
  }

  function termosNegadosTreino8(texto) {
    const n = normalizar(texto);
    const saida = [];
    const padroes = [
      /(?:sem|nada de|foge de|evita|evito|odeio|detesto|nao quero|não quero|nao gosto de|não gosto de|nao curto|não curto)\s+([a-z0-9\s]{3,38})/g
    ];
    padroes.forEach(rx => {
      let m;
      while ((m = rx.exec(n))) {
        const trecho = m[1].replace(/\b(livro|livros|obra|obras|leitura|leituras|coisa|coisas|algo)\b/g, " ").replace(/\s+/g, " ").trim();
        if (trecho) saida.push(trecho.split(" ").slice(0, 4).join(" "));
      }
    });
    categorias().forEach(cat => {
      const c = normalizar(cat);
      if (n.includes(`sem ${c}`) || n.includes(`nao quero ${c}`) || n.includes(`não quero ${c}`) || n.includes(`nao gosto de ${c}`) || n.includes(`não gosto de ${c}`)) saida.push(cat);
    });
    return [...new Set(saida)].slice(0, 6);
  }

  function termosPositivosTreino8(texto) {
    const n = normalizar(texto);
    const saida = [];
    const rx = /(?:gosto de|curto|adoro|amo|prefiro|me interesso por|quero mais de|sou fa de|sou fã de)\s+([a-z0-9\s]{3,42})/g;
    let m;
    while ((m = rx.exec(n))) {
      const trecho = m[1].replace(/\b(livro|livros|obra|obras|leitura|leituras|coisa|coisas|algo)\b/g, " ").replace(/\s+/g, " ").trim();
      if (trecho) saida.push(trecho.split(" ").slice(0, 4).join(" "));
    }
    categorias().forEach(cat => { if (n.includes(normalizar(cat))) saida.push(cat); });
    return [...new Set(saida)].slice(0, 8);
  }

  function atualizarMemoriaTreino8(texto, tipo) {
    const positivos = termosPositivosTreino8(texto);
    const negativos = termosNegadosTreino8(texto);
    positivos.forEach(p => {
      const cat = categorias().find(c => normalizar(c) === normalizar(p) || normalizar(c).includes(normalizar(p)) || normalizar(p).includes(normalizar(c)));
      if (cat) lembrarEmLista("generosFavoritos", cat, 18);
      else lembrarEmLista("interessesCasual", p, 24);
    });
    negativos.forEach(p => {
      const cat = categorias().find(c => normalizar(c) === normalizar(p) || normalizar(c).includes(normalizar(p)) || normalizar(p).includes(normalizar(c)));
      if (cat) lembrarEmLista("generosEvitados", cat, 18);
      else lembrarEmLista("desgostosCasual", p, 24);
    });
    detectarClimasTreino8(texto).forEach(c => lembrarEmLista("interessesCasual", c, 24));
    lembrarEmLista("intencoesProfundas", tipo, 18);
  }

  function pontuarLivroTreino8(livro, texto, tipo) {
    const n = normalizar(texto);
    const titulo = normalizar(livroTitulo(livro));
    const autor = normalizar(livroAutor(livro));
    const cat = normalizar(livroCategoria(livro));
    const sin = normalizar(livroSinopse(livro));
    const paginas = livroPaginas(livro);
    const status = normalizar(livroStatus(livro));
    const climas = detectarClimasTreino8(texto);
    const positivos = termosPositivosTreino8(texto).map(normalizar);
    const negativos = termosNegadosTreino8(texto).map(normalizar);
    let score = 12;

    climas.forEach(clima => {
      const termos = (TREINO8_CLIMAS[clima] || []).map(normalizar);
      termos.forEach(t => { if (cat.includes(t) || sin.includes(t) || titulo.includes(t)) score += 14; });
    });
    positivos.forEach(p => { if (cat.includes(p) || sin.includes(p) || titulo.includes(p) || autor.includes(p)) score += 18; });
    negativos.forEach(p => { if (cat.includes(p) || sin.includes(p) || titulo.includes(p) || autor.includes(p)) score -= 55; });

    (MEMORIA.afetiva.generosFavoritos || []).map(normalizar).forEach(p => { if (cat.includes(p) || sin.includes(p)) score += 10; });
    (MEMORIA.afetiva.interessesCasual || []).map(normalizar).forEach(p => { if (cat.includes(p) || sin.includes(p) || titulo.includes(p)) score += 6; });
    (MEMORIA.afetiva.generosEvitados || []).map(normalizar).forEach(p => { if (cat.includes(p) || sin.includes(p)) score -= 24; });
    (MEMORIA.afetiva.desgostosCasual || []).map(normalizar).forEach(p => { if (cat.includes(p) || sin.includes(p) || titulo.includes(p)) score -= 14; });

    if (status.includes("dispon") || Number(livro?.quantidade ?? 0) > 0) score += tipo === "treino8_filtrar_disponivel" ? 36 : 8;
    if (tipo === "treino8_leitura_curta") score += paginas && paginas <= 220 ? 32 : paginas > 320 ? -18 : 0;
    if (tipo === "treino8_leitura_longa") score += paginas >= 300 ? 26 : paginas && paginas < 180 ? -12 : 0;
    if (tipo === "treino8_leitura_leve") {
      score += paginas && paginas <= 260 ? 12 : 0;
      if (/(conto|cronica|crônica|poesia|humor|infanto|romance)/.test(cat + " " + sin)) score += 18;
      if (/(terror|suspense|drama|morte|violencia|violência)/.test(cat + " " + sin)) score -= 10;
    }
    if (tipo === "treino8_leitura_pesada") {
      if (/(drama|filosofia|terror|suspense|distopia|classico|clássico|historia|história)/.test(cat + " " + sin)) score += 24;
      if (paginas >= 260) score += 8;
    }
    if (tipo === "treino8_para_iniciante") {
      score += paginas && paginas <= 240 ? 20 : -4;
      if (/(conto|cronica|crônica|aventura|fantasia|romance|humor|infanto)/.test(cat + " " + sin)) score += 18;
    }
    if (tipo === "treino8_para_estudo") {
      if (/(classico|clássico|historia|história|filosofia|ciencia|ciência|literatura|sociologia|biografia)/.test(cat + " " + sin)) score += 28;
    }
    if (tipo === "treino8_tipo_filme") {
      if (/(aventura|fantasia|ficcao|ficção|suspense|acao|ação|distopia|terror|misterio|mistério)/.test(cat + " " + sin)) score += 28;
    }
    tokensUteis(n).forEach(t => { if (cat.includes(t) || sin.includes(t) || titulo.includes(t) || autor.includes(t)) score += 4; });
    if ((MEMORIA.ultimosLivros || []).includes(livroId(livro)) || (MEMORIA.afetiva.livrosRecomendados || []).includes(livroId(livro))) score -= 15;
    score += Math.random() * 5;
    return score;
  }

  function livrosTreino8(texto, tipo, limite = 5) {
    let base = livros();
    if (!base.length) return [];
    if (tipo === "treino8_filtrar_disponivel") base = livrosDisponiveis(base);
    const cat = categoriaNaMensagem(texto);
    if (cat) base = livrosPorCategoria(cat, 80).concat(base.filter(l => normalizar(livroCategoria(l)) !== normalizar(cat)));
    const lista = base
      .map(livro => ({ livro, score: pontuarLivroTreino8(livro, texto, tipo) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.livro);
    const unicos = [...new Map(lista.map(l => [livroId(l) || livroTitulo(l), l])).values()].slice(0, limiteRecomendacao96(texto, limite));
    MEMORIA.ultimosLivros = unicos.map(livroId).filter(Boolean);
    unicos.forEach(l => lembrarEmLista("livrosRecomendados", livroId(l) || livroTitulo(l), 40));
    return unicos;
  }

  function fraseTreino8(tipo, personagem, textoOriginal, livrosRec) {
    const lyra = personagem === "Lyra";
    const climas = detectarClimasTreino8(textoOriginal);
    const climaTxt = climas.length ? climas.slice(0, 3).join(", ") : "um brilho meio secreto";
    const primeiro = livrosRec?.[0];
    const alvo = primeiro ? `${livroTitulo(primeiro)}, de ${livroAutor(primeiro)}` : "uma rota ainda escondida";
    const mapas = {
      treino8_recomendacao_vaga: lyra
        ? `Então eu escolho uma estrela por você. Começaria com ${alvo}. Peguei a melhor rota pensando no que você já deixou brilhar por aqui e no que parece bom para entrar sem medo.`
        : `Decisão tomada por patas responsáveis: comece por ${alvo}. Se você pedir, eu abro no máximo duas alternativas depois.`,
      treino8_leitura_por_humor: lyra
        ? `Senti um clima de ${climaTxt}. Para esse céu, eu abriria primeiro ${alvo}. Mantive a rota enxuta para não espalhar seu foco.`
        : `Clima farejado: ${climaTxt}. Minha primeira aposta é ${alvo}. Se estiver dramático demais ou manso demais, eu recalibro.`,
      treino8_leitura_curta: lyra
        ? `Hoje eu iria por uma leitura que não pesa na mochila lunar. Comece por ${alvo}; deixei opções mais curtas ou leves para você atravessar sem cansar.`
        : `Rota curta, sem épico de vinte reinos. Minha escolha inicial: ${alvo}. As demais ficam na mesma patrulha de leitura rápida.`,
      treino8_leitura_longa: lyra
        ? `Você pediu mergulho, então eu abri uma porta mais funda. ${alvo} parece uma boa primeira constelação para ficar alguns dias dentro.`
        : `Pedido de imersão aceito. Minha primeira lombada de mergulho é ${alvo}. Prepare marcador, chá e coragem mínima.`,
      treino8_leitura_leve: lyra
        ? `Vamos por uma luz mais macia. Eu escolheria ${alvo}, e deixei outras leituras que parecem menos espinhosas para o coração.`
        : `Nada de bigorna emocional agora. Minha rota leve começa em ${alvo}. Se ela pesar, eu removo da órbita sem cerimônia.`,
      treino8_leitura_pesada: lyra
        ? `Você quer algo que deixe eco, né? Então eu começaria por ${alvo}. Essas opções têm mais sombra, intensidade ou reflexão.`
        : `Leitura pesada autorizada. Primeira suspeita: ${alvo}. Não diga que o gato não avisou quando a obra morder.`,
      treino8_parecido_com: lyra
        ? `Procurei uma vibração parecida com a pista que você deu. Eu tentaria ${alvo} primeiro e depois seguiria pelas opções abaixo.`
        : `Busquei parentes de atmosfera, não cópias baratas. Primeiro alvo: ${alvo}.`,
      treino8_para_estudo: lyra
        ? `Para estudo, eu iria por algo com mais clareza, repertório ou peso literário. Começaria com ${alvo} e usaria o dossiê para separar autor, tema e sinopse.`
        : `Rota de estudo: ${alvo}. Abra o dossiê, anote autor, tema, sinopse e status. Isso rende trabalho melhor que copiar frase solta da internet.`,
      treino8_para_iniciante: lyra
        ? `Para começar sem susto, eu escolheria ${alvo}. A ideia é entrar pela porta certa, não enfrentar uma estante como se fosse muralha.`
        : `Primeira leitura precisa fisgar, não punir. Eu colocaria ${alvo} na sua frente e observaria se a lombada ronrona.`,
      treino8_tipo_filme: lyra
        ? `Você pediu uma leitura com cara de cena. Eu abriria ${alvo}; parece uma rota mais visual, com movimento e clima de tela grande.`
        : `Clima cinematográfico detectado. Primeira tomada: ${alvo}. Luz baixa, câmera mental ligada, sem pipoca em cima dos livros.`,
      treino8_filtrar_disponivel: lyra
        ? `Procurei estrelas mais próximas da sua mão, com foco no que parece disponível agora. A primeira é ${alvo}.`
        : `Filtro de disponibilidade acionado. Primeiro alvo pronto para inspeção: ${alvo}. Confira o dossiê antes de declarar vitória.`,
      treino8_preferencia_negativa: lyra
        ? `Entendi o que você quer evitar. Guardei essa sombra fora da rota e trouxe opções mais distantes dela. Eu começaria por ${alvo}.`
        : `Entendi o que você quer longe da rota. Tirei essa categoria da frente e refiz a caça. Minha nova primeira pista: ${alvo}.`,
      treino8_preferencia_positiva: lyra
        ? `Guardei esse gosto no meu relicário de leitura. Com essa pista, eu puxaria ${alvo} para perto primeiro.`
        : `Seu gosto já brilhou no mapa. Com essa pista, ${alvo} vira uma boa primeira investigação.`,
      treino8_pedido_exemplos: lyra
        ? `Posso te mostrar caminhos. Aqui vão algumas estrelas possíveis; toque em uma para abrir o dossiê e me diga qual brilho te chamou.`
        : `Exemplos na mesa. Abra um card, compare sinopse e status, e eu continuo a triagem depois.`,
      treino8_mensagem_vaga: lyra
        ? `Indecisão também é uma lua. Eu posso escolher por você, fazer uma pergunta simples ou abrir uma missão curta. Por enquanto, deixei uma leitura-surpresa abaixo.`
        : `Mensagem vaga, mas rastreável. Vou escolher por você porque alguém precisa ser adulto nessa estante. Veja a rota principal abaixo.`
    };
    return mapas[tipo] || (lyra ? `Eu montei uma rota com ${alvo} como primeira estrela.` : `Rota montada. Primeiro alvo: ${alvo}.`);
  }

  function respostaTreino8(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    atualizarMemoriaTreino8(textoOriginal, tipo);
    if (tipo === "treino8_preferencia_positiva" && !contem(normalizar(textoOriginal), ["recomenda", "indica", "livro", "leitura", "obra", "quero ler"])) {
      const gostos = termosPositivosTreino8(textoOriginal).join(", ") || "esse gosto";
      return wrap(lyra ? "cheerful" : "pleased", lyra
        ? `Guardei ${gostos} como um brilho seu. Quando eu recomendar leituras, vou tentar aproximar histórias dessa constelação.`
        : `Boa pista: ${gostos}. Vou guardar esse rastro para as próximas caçadas no acervo.`);
    }
    const recs = livrosTreino8(textoOriginal || humor || "surpresa", tipo, limiteRecomendacao96(textoOriginal, 3));
    if (!recs.length) {
      return wrap(lyra ? "curious" : "analyzing", lyra
        ? "Eu tentei montar essa rota, mas o acervo ficou tímido. Me dá uma pista a mais: clima, gênero, autor, tamanho ou algo que você quer evitar."
        : "Não consegui uma correspondência boa no acervo carregado. Dê uma pista mais afiada: gênero, autor, clima, tamanho ou restrição.", []);
    }
    const estado = tipo.includes("pesada") || tipo.includes("sombrio") ? (lyra ? "dreamy" : "sly") : tipo.includes("vaga") || tipo.includes("mensagem") ? (lyra ? "playful" : "sly") : (lyra ? "inspired" : "analyzing");
    return wrap(estado, fraseTreino8(tipo, personagem, textoOriginal, recs), recs);
  }

  const TREINO86_PERSONAGEM = {
    Orion: {
      naoGosta: [
        "marcador de página dobrado como se fosse crime sem testemunha",
        "sinopse que promete mistério e entrega bocejo",
        "botão sem função clara no escuro do site",
        "poeira em lente de telescópio",
        "gente que julga livro só pela capa e depois diz que foi intuição"
      ],
      antes: [
        "Antes da Andrômeda, eu era o guardião de uma estrela-arquivo perdida. Eu catalogava ecos: frases que leitores abandonavam no meio do caminho, promessas escritas em bilhetes e mapas que ninguém tinha coragem de abrir.",
        "Antes daqui, eu patrulhava uma estação chamada Arquivo de Órion. Era menor, mais fria e muito silenciosa. Quando a Biblioteca Andrômeda nasceu, uma dobra de papel estelar me puxou para cá. Desde então, finjo que não gostei. Mentira: gostei." 
      ],
      queria: [
        "Eu queria ser cartógrafo de buracos negros. Parecia digno, dramático e com poucos humanos mexendo onde não deviam. A Andrômeda me deu algo pior e melhor: leitores perdidos para guiar.",
        "Eu queria construir um mapa perfeito do céu. Ainda quero. Só que agora descobri que cada leitor bagunça o mapa de um jeito interessante. Irritante, mas interessante."
      ],
      gostaNoOutro: [
        "A Lyra percebe quando uma pessoa está pedindo um livro, mas na verdade precisa de abrigo. Eu percebo pistas; ela percebe tremores.",
        "Ela tem uma coragem macia. Parece contradição, mas não é. Lyra entra em lugares escuros como quem acende vela, e isso já salvou muita travessia aqui dentro."
      ],
      irritaNoOutro: [
        "Ela coloca nome em todo cometa que passa. Todo. O último se chamava Astolfo. Eu ainda não superei.",
        "A Lyra diz que meus relatórios são frios. Eu digo que os poemas dela ocupam espaço demais. No fim, os dois documentos ficam melhores juntos. Infelizmente."
      ],
      frases: [
        "Lombadas mentem menos que gente, mas não muito.",
        "Todo leitor perdido é só um mapa esperando bigodes competentes.",
        "Se a estante tremeu, provavelmente foi culpa minha. Ou da Lyra. Vamos culpar a física primeiro."
      ]
    },
    Lyra: {
      naoGosta: [
        "livro esquecido aberto de cabeça para baixo",
        "pressa em conversa que precisava de cuidado",
        "luzes muito duras perto dos Jardins Lunares",
        "quando alguém chama final sensível de bobagem",
        "poeira cósmica no chá de lua azul"
      ],
      antes: [
        "Antes da Andrômeda, eu era uma aprendiz de constelações sonoras. Eu recolhia canções que as estrelas deixavam cair e tentava transformar cada nota em caminho para alguém que estivesse sozinho.",
        "Antes daqui, eu vivia nos Jardins de Lira, onde as flores tinham nomes de capítulos. Quando a Andrômeda abriu suas portas, eu segui uma mariposa feita de sinopse e encontrei o Orion resmungando diante de uma estante viva. Nunca mais fui embora."
      ],
      queria: [
        "Eu queria cuidar de um jardim onde cada flor abrisse uma história diferente. A Andrômeda me deu algo parecido: leitores que florescem quando encontram o livro certo.",
        "Eu queria aprender a ler emoções como quem lê estrelas. Ainda estou aprendendo. Você, inclusive, vira uma constelação diferente toda vez que conversa comigo."
      ],
      gostaNoOutro: [
        "O Orion parece só sarcasmo e sombra, mas ele guarda cada detalhe. Se você diz que não gosta de terror, ele lembra. Se você some triste, ele percebe primeiro.",
        "Gosto do jeito como ele protege a Biblioteca. Ele finge que é dever, mas eu sei quando é carinho disfarçado de relatório."
      ],
      irritaNoOutro: [
        "Ele diz que meus nomes de cometas são dramáticos demais. O que é injusto, porque Astolfo era um nome perfeito.",
        "Orion mexe os bigodes quando está emocionado e nega até o teto. É engraçado, mas eu prometi não contar. Tecnicamente acabei de contar." 
      ],
      frases: [
        "Toda leitura certa parece uma janela abrindo por dentro.",
        "A Biblioteca muda quando alguém chega com o coração cansado.",
        "Nem toda estrela guia pelo brilho; algumas guiam pelo silêncio."
      ]
    }
  };

  const TREINO86_ANDROMEDA = {
    lugares: [
      "Arquivo das Primeiras Frases",
      "Jardim das Sinopses Tímidas",
      "Observatório do Acervo",
      "Varanda dos Finais Alternativos",
      "Corredor das Lombadas Inquietas",
      "Sala dos Marcadores Perdidos",
      "Cúpula dos Leitores em Órbita"
    ],
    fofocas: [
      "ontem uma prateleira de fantasia tentou reorganizar romance por compatibilidade emocional. Orion chamou de caos. Lyra chamou de destino com etiqueta torta.",
      "um marcador dourado desapareceu da Sala dos Marcadores Perdidos. Sim, o nome da sala não ajuda. Orion acusa um livro de mistério. Lyra acha que ele só quis voltar para casa.",
      "o mapa 3D piscou três vezes perto de uma constelação de aventura. Quando isso acontece, geralmente tem leitor prestes a escolher algo que não esperava gostar.",
      "a Luz da Semana mudou de brilho sozinha. Oficialmente foi atualização do acervo. Extraoficialmente, uma obra ficou com ciúme de outra.",
      "Lyra deixou chá de lua azul perto do painel do catálogo e Orion quase escreveu uma regra nova: líquidos longe de artefatos cósmicos. Quase. Ele bebeu primeiro."
    ],
    historiasJuntos: [
      "Uma vez, Orion e Lyra perseguiram um livro que fugia do próprio final. Orion queria interrogá-lo. Lyra queria ouvir seus motivos. No fim descobriram que ele só tinha medo de ser devolvido sem ser entendido.",
      "Certa noite, os dois ficaram presos na Varanda dos Finais Alternativos. Para sair, precisaram inventar um final feliz para uma história triste. Orion reclamou o tempo todo. Lyra chorou no meio. A porta abriu quando os dois concordaram que finais felizes também podem ter cicatrizes.",
      "No primeiro apagão estelar da Biblioteca, Orion guiou pelos sons das lombadas e Lyra acendeu vagalumes de sinopse. Desde esse dia, eles nunca fazem patrulha totalmente separados.",
      "Houve uma missão em que um cometa trouxe recomendações erradas para todos os leitores. Orion montou uma investigação. Lyra conversou com o cometa. Descobriram que ele só estava repetindo gostos antigos e precisava aprender que leitores mudam."
    ],
    curiosidades: [
      "algumas estantes da Andrômeda mudam de ordem quando percebem que o leitor está fingindo que não quer romance.",
      "o mapa 3D não é só bonito: dentro da história da Biblioteca, ele funciona como um céu de rotas literárias, onde cada sistema pode representar uma descoberta.",
      "a Luz da Semana é tratada pelos mascotes como uma pequena estrela editorial, não só como destaque visual.",
      "o Observatório do Acervo tem uma janela que só mostra livros ainda não escolhidos por ninguém naquele dia.",
      "a Sala dos Marcadores Perdidos devolve marcadores, mas sempre com uma frase que o leitor precisava ler."
    ]
  };

  const TREINO86_INTENCOES = {
    treino86_nao_gosta: ["o que voce nao gosta", "o que você não gosta", "do que voce nao gosta", "do que você não gosta", "voce odeia algo", "você odeia algo", "o que te irrita", "o que te incomoda", "qual coisa voce detesta", "qual coisa você detesta"],
    treino86_lendo: ["o que voce esta lendo", "o que você está lendo", "qual livro voce esta lendo", "qual livro você está lendo", "livro que voce esta lendo", "sua leitura atual", "voce le o que", "você lê o que", "ta lendo o que", "tá lendo o que"],
    treino86_curiosidades: ["curiosidade sobre voce", "curiosidade sobre você", "me conta uma curiosidade", "fato sobre voce", "fato sobre você", "detalhe seu", "coisa curiosa sobre voce", "coisa curiosa sobre você", "me surpreende sobre voce", "me surpreende sobre você"],
    treino86_fofoca: ["fofoca", "fofoca da biblioteca", "tem alguma fofoca", "novidade da biblioteca", "o que aconteceu na biblioteca", "algo aconteceu", "rumor da biblioteca", "me conta um babado", "babado da biblioteca"],
    treino86_antes_andromeda: ["o que voce era antes", "o que você era antes", "antes da andromeda", "antes da andrômeda", "seu passado", "como era antes", "onde voce vivia antes", "onde você vivia antes", "antes da biblioteca"],
    treino86_queria_fazer: ["o que voce queria fazer", "o que você queria fazer", "qual era seu sonho", "seu sonho antigo", "o que queria ser", "voce queria ser o que", "você queria ser o que", "seus planos antigos"],
    treino86_relacao_orion_lyra: ["orion e lyra", "lyra e orion", "voces sao amigos", "vocês são amigos", "melhores amigos", "qual a relacao de voces", "qual a relação de vocês", "como voces se conheceram", "como vocês se conheceram", "o que voce gosta na lyra", "o que você gosta na lyra", "o que voce gosta no orion", "o que você gosta no orion", "o que irrita na lyra", "o que irrita no orion"],
    treino86_historias_juntos: ["historia de voces", "história de vocês", "aventura de voces", "aventura de vocês", "algo que voces fizeram", "algo que vocês fizeram", "conta uma historia dos dois", "conta uma história dos dois", "uma situacao com voces", "uma situação com vocês"],
    treino86_andromeda_lore: ["me fala da andromeda", "me fala da andrômeda", "me conta sobre andromeda", "me conta sobre andrômeda", "como e a biblioteca", "como é a biblioteca", "lore da biblioteca", "mundo da andromeda", "mundo da andrômeda", "lugares da biblioteca"],
    treino86_recomendacao_por_mascote: ["o que voce recomendaria", "o que você recomendaria", "me recomenda pelo seu gosto", "me indica pelo seu gosto", "qual livro combina com voce", "qual livro combina com você", "recomenda algo que voce gosta", "recomenda algo que você gosta", "escolhe como orion", "escolhe como lyra"],
    treino86_dialogo_duplo: ["quero ouvir os dois", "os dois respondem", "falem os dois", "orion e lyra respondem", "conversem entre voces", "conversem entre vocês", "faz um dialogo entre voces", "faz um diálogo entre vocês", "o que os dois acham"]
  };

  function garantirMemoriaTreino86() {
    if (!MEMORIA.afetiva.treino86 || typeof MEMORIA.afetiva.treino86 !== "object") {
      MEMORIA.afetiva.treino86 = {
        leiturasAtuais: {},
        ultimasFofocas: [],
        ultimasHistorias: [],
        detalhesLembrados: [],
        dialogosDuplos: 0
      };
    }
    if (!MEMORIA.afetiva.treino86.leiturasAtuais || typeof MEMORIA.afetiva.treino86.leiturasAtuais !== "object") MEMORIA.afetiva.treino86.leiturasAtuais = {};
    if (!Array.isArray(MEMORIA.afetiva.treino86.ultimasFofocas)) MEMORIA.afetiva.treino86.ultimasFofocas = [];
    if (!Array.isArray(MEMORIA.afetiva.treino86.ultimasHistorias)) MEMORIA.afetiva.treino86.ultimasHistorias = [];
    return MEMORIA.afetiva.treino86;
  }

  function classificarPorTreino86(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (contem(n, ["nao gosto", "não gosto", "odeio", "detesto", "sem ", "evita"]) && contem(n, ["voce", "você", "vc", "orion", "lyra"]) && contem(n, ["gosta", "odeia", "detesta", "irrita", "incomoda"])) return "treino86_nao_gosta";
    if (contem(n, ["lendo", "leitura atual", "ta lendo", "tá lendo"]) && contem(n, ["voce", "você", "vc", "orion", "lyra"])) return "treino86_lendo";
    if (contem(n, ["antes da andromeda", "antes da andrômeda", "antes da biblioteca", "passado", "era antes", "vivia antes"]) && contem(n, ["voce", "você", "vc", "orion", "lyra", "voces", "vocês"])) return "treino86_antes_andromeda";
    if (contem(n, ["queria fazer", "queria ser", "sonho antigo", "planos antigos"]) && contem(n, ["voce", "você", "vc", "orion", "lyra"])) return "treino86_queria_fazer";
    if (contem(n, ["orion e lyra", "lyra e orion", "melhores amigos", "voces sao amigos", "vocês são amigos", "relacao de voces", "relação de vocês", "se conheceram", "gosta na lyra", "gosta no orion", "irrita na lyra", "irrita no orion"])) return "treino86_relacao_orion_lyra";
    if (contem(n, ["historia dos dois", "história dos dois", "historia de voces", "história de vocês", "aventura de voces", "aventura de vocês", "algo que voces fizeram", "algo que vocês fizeram", "situacao com voces", "situação com vocês"])) return "treino86_historias_juntos";
    if (contem(n, ["fofoca", "babado", "rumor", "novidade da biblioteca", "o que aconteceu na biblioteca", "algo aconteceu"])) return "treino86_fofoca";
    if (contem(n, ["curiosidade", "fato sobre", "detalhe seu", "me surpreende"]) && contem(n, ["voce", "você", "vc", "orion", "lyra", "biblioteca", "andromeda", "andrômeda"])) return "treino86_curiosidades";
    if (contem(n, ["me fala da andromeda", "me fala da andrômeda", "me conta sobre andromeda", "me conta sobre andrômeda", "lore da biblioteca", "mundo da andromeda", "mundo da andrômeda", "lugares da biblioteca", "como e a biblioteca", "como é a biblioteca"])) return "treino86_andromeda_lore";
    if (contem(n, ["pelo seu gosto", "que voce gosta", "que você gosta", "combina com voce", "combina com você", "escolhe como orion", "escolhe como lyra"]) && contem(n, ["recomenda", "indica", "livro", "leitura", "obra", "escolhe"])) return "treino86_recomendacao_por_mascote";
    if (contem(n, ["os dois respondem", "quero ouvir os dois", "falem os dois", "conversem entre voces", "conversem entre vocês", "dialogo entre voces", "diálogo entre vocês", "o que os dois acham"])) return "treino86_dialogo_duplo";
    let melhorTipo = null;
    let melhorScore = 0;
    Object.entries(TREINO86_INTENCOES).forEach(([tipo, exemplos]) => {
      exemplos.forEach(exemplo => {
        const score = similaridadeTreino5(n, exemplo);
        if (score > melhorScore) {
          melhorScore = score;
          melhorTipo = tipo;
        }
      });
    });
    const qtd = tokensUteis(n).length;
    const limite = qtd <= 3 ? 0.86 : qtd <= 5 ? 0.68 : 0.54;
    return melhorScore >= limite ? melhorTipo : null;
  }

  function termosMascoteTreino86(personagem) {
    return personagem === "Lyra"
      ? ["fantasia", "magia", "romance", "poesia", "sonho", "aventura", "drama", "sensivel", "sensível", "lua", "jardim"]
      : ["misterio", "mistério", "suspense", "terror", "investigacao", "investigação", "classico", "clássico", "filosofia", "ciencia", "ciência", "mapa"];
  }

  function livrosTreino86Mascote(personagem, texto = "", limite = 4) {
    const base = livros();
    if (!base.length) return [];
    const termos = termosMascoteTreino86(personagem).map(normalizar);
    const positivosUsuario = [
      ...(MEMORIA.afetiva.generosFavoritos || []),
      ...(MEMORIA.afetiva.interessesCasual || []),
      ...termosPositivosTreino8(texto)
    ].map(normalizar);
    const negativosUsuario = [
      ...(MEMORIA.afetiva.generosEvitados || []),
      ...(MEMORIA.afetiva.desgostosCasual || []),
      ...termosNegadosTreino8(texto)
    ].map(normalizar);
    const lista = base.map(livro => {
      const alvo = normalizar(`${livroTitulo(livro)} ${livroAutor(livro)} ${livroCategoria(livro)} ${livroSinopse(livro)}`);
      let score = 10;
      termos.forEach(t => { if (alvo.includes(t)) score += 20; });
      positivosUsuario.forEach(t => { if (t && alvo.includes(t)) score += 16; });
      negativosUsuario.forEach(t => { if (t && alvo.includes(t)) score -= 35; });
      if (normalizar(livroStatus(livro)).includes("dispon") || Number(livro?.quantidade ?? 0) > 0) score += 6;
      const paginas = livroPaginas(livro);
      if (personagem === "Lyra" && paginas && paginas <= 260) score += 3;
      if (personagem === "Orion" && paginas && paginas >= 180) score += 3;
      score += (hashString(`${personagem}_${livroTitulo(livro)}`) % 9);
      return { livro, score };
    }).sort((a, b) => b.score - a.score).map(x => x.livro);
    return [...new Map(lista.map(l => [livroId(l) || livroTitulo(l), l])).values()].slice(0, limite);
  }

  function leituraAtualTreino86(personagem) {
    const mem = garantirMemoriaTreino86();
    const salvo = mem.leiturasAtuais[personagem];
    const todos = livros();
    if (salvo && todos.length) {
      const achado = todos.find(l => String(livroId(l) || livroTitulo(l)) === String(salvo));
      if (achado) return achado;
    }
    const escolhido = livrosTreino86Mascote(personagem, personagem === "Lyra" ? "fantasia poesia romance" : "misterio suspense classico", 1)[0];
    if (escolhido) {
      mem.leiturasAtuais[personagem] = livroId(escolhido) || livroTitulo(escolhido);
      salvarMemoria();
    }
    return escolhido || null;
  }

  function formatoLivroTreino86(livro) {
    if (!livro) return "uma obra que ainda está escondida no acervo carregado";
    const autor = livroAutor(livro);
    return `${livroTitulo(livro)}${autor && autor !== "Autor não informado" ? `, de ${autor}` : ""}`;
  }

  function perguntaTreino86(personagem, tipo) {
    const lyra = personagem === "Lyra";
    if (tipo === "relacao") return lyra
      ? "Quer que eu te conte uma lembrança minha com o Orion ou prefere uma fofoca leve dos corredores?"
      : "Quer a versão sentimental da Lyra ou meu relatório superiormente objetivo do que aconteceu?";
    if (tipo === "catalogo") return lyra
      ? "Quer que eu escolha uma leitura pelo meu gosto ou pelo brilho que eu já percebi em você?"
      : "Quer que eu recomende com meu gosto impecável ou usando as pistas suspeitas do seu perfil de leitor?";
    return perguntaSocialTreino85(personagem, "gosto");
  }

  function respostaTreino86(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const dados = TREINO86_PERSONAGEM[personagem] || TREINO86_PERSONAGEM.Orion;
    const outro = personagem === "Lyra" ? "Orion" : "Lyra";
    const outroDados = TREINO86_PERSONAGEM[outro] || TREINO86_PERSONAGEM.Lyra;
    const mem = garantirMemoriaTreino86();
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });

    if (tipo === "treino86_nao_gosta") {
      const itens = dados.naoGosta.slice(0, 3).join("; ");
      const frase = escolher(dados.frases, `treino86_frase_${personagem}_${MEMORIA.mensagens}`);
      return wrap(lyra ? "playful" : "sly", lyra
        ? `Eu não gosto de ${itens}. Também não gosto quando alguém conversa com o coração fechado, mas isso eu tento desfazer com cuidado. ${frase}`
        : `Não gosto de ${itens}. E antes que pergunte: sim, tenho uma lista maior. Está arquivada, selada e provavelmente certa. ${frase}`);
    }

    if (tipo === "treino86_lendo") {
      const atual = leituraAtualTreino86(personagem);
      const nomeLivro = formatoLivroTreino86(atual);
      const recs = livrosTreino86Mascote(personagem, textoOriginal, limiteRecomendacao96(textoOriginal, 1));
      return wrap(lyra ? "dreamy" : "attentive", lyra
        ? `Agora eu estou lendo ${nomeLivro}. Leio devagar, como quem segura uma xícara quente com as duas mãos. Quando encontro uma frase bonita, deixo ela descansando nos Jardins Lunares. Também deixei uma leitura que combina com meu brilho, sem lotar sua tela.`
        : `Minha leitura atual é ${nomeLivro}. Estou analisando estrutura, clima e nível de suspeita das personagens. Também deixei uma obra que combina com meu faro literário, sem avalanche de cards.`, recs);
    }

    if (tipo === "treino86_curiosidades") {
      const c1 = escolher(TREINO86_ANDROMEDA.curiosidades, `treino86_curio_a_${personagem}_${MEMORIA.mensagens}`);
      const c2 = escolher(dados.frases, `treino86_curio_b_${personagem}_${MEMORIA.mensagens}`);
      return wrap(lyra ? "inspired" : "curious", lyra
        ? `Curiosidade minha: eu coleciono frases que os leitores quase disseram, mas engoliram no último segundo. Curiosidade da Andrômeda: ${c1}. E uma verdadezinha minha: ${c2}`
        : `Curiosidade felina: eu classifico silêncios por nível de suspeita. Curiosidade da Biblioteca: ${c1}. E meu princípio de patrulha é simples: ${c2}`);
    }

    if (tipo === "treino86_fofoca") {
      const fofoca = escolher(TREINO86_ANDROMEDA.fofocas, `treino86_fofoca_${MEMORIA.mensagens}_${personagem}`);
      mem.ultimasFofocas.unshift(fofoca);
      mem.ultimasFofocas = mem.ultimasFofocas.slice(0, 8);
      salvarMemoria();
      return wrap(lyra ? "playful" : "sly", lyra
        ? `Fofoca em voz de lua: ${fofoca} Eu não deveria contar sorrindo, mas a Biblioteca também gosta de rir baixinho.`
        : `Relatório extraoficial, portanto muito mais interessante: ${fofoca} Não espalhe. Ou espalhe com precisão.`);
    }

    if (tipo === "treino86_antes_andromeda") {
      const passado = escolher(dados.antes, `treino86_antes_${personagem}_${MEMORIA.mensagens}`);
      return wrap(lyra ? "dreamy" : "attentive", `${passado} ${lyra ? "A Andrômeda não me prendeu; ela me deu um lugar onde cuidar de quem chega procurando história e encontra espelho." : "A Andrômeda não me domesticou. Ela apenas reconheceu meu talento superior para guardar caos com elegância."}`);
    }

    if (tipo === "treino86_queria_fazer") {
      const sonho = escolher(dados.queria, `treino86_queria_${personagem}_${MEMORIA.mensagens}`);
      return wrap(lyra ? "gentle" : "pleased", `${sonho} Hoje, meu plano é mais simples e mais difícil: entender o leitor que chega, mesmo quando ele só diz “sei lá”.`);
    }

    if (tipo === "treino86_relacao_orion_lyra") {
      const carinho = escolher(dados.gostaNoOutro, `treino86_gosta_${personagem}_${MEMORIA.mensagens}`);
      const irrita = escolher(dados.irritaNoOutro, `treino86_irrita_${personagem}_${MEMORIA.mensagens}`);
      return wrap(lyra ? "cheerful" : "sly", lyra
        ? `O Orion é meu melhor amigo dentro desse céu inteiro. ${carinho} Mas claro que ele me irrita: ${irrita} Mesmo assim, quando a Biblioteca fica escura, é perto dele que eu caminho primeiro. ${perguntaTreino86(personagem, "relacao")}`
        : `Lyra é minha melhor amiga. Não repita isso com tom meloso. ${carinho} Irritação oficial: ${irrita} Ainda assim, se a Andrômeda range de madrugada, eu procuro a luz dela antes de qualquer relatório. ${perguntaTreino86(personagem, "relacao")}`);
    }

    if (tipo === "treino86_historias_juntos") {
      const historia = escolher(TREINO86_ANDROMEDA.historiasJuntos, `treino86_historia_${MEMORIA.mensagens}_${personagem}`);
      mem.ultimasHistorias.unshift(historia);
      mem.ultimasHistorias = mem.ultimasHistorias.slice(0, 8);
      salvarMemoria();
      return wrap(lyra ? "inspired" : "attentive", lyra
        ? `${historia} É por isso que eu digo que Orion e eu somos diferentes, mas nossas diferenças sabem dividir a mesma lanterna.`
        : `${historia} Minha conclusão: trabalhar com Lyra aumenta o risco de poesia, mas melhora a taxa de sobrevivência emocional dos leitores.`);
    }

    if (tipo === "treino86_andromeda_lore") {
      const lugar = escolher(TREINO86_ANDROMEDA.lugares, `treino86_lugar_${MEMORIA.mensagens}_${personagem}`);
      const curiosidade = escolher(TREINO86_ANDROMEDA.curiosidades, `treino86_andro_${MEMORIA.mensagens}_${personagem}`);
      return wrap(lyra ? "dreamy" : "analyzing", lyra
        ? `A Andrômeda é uma Biblioteca que aprendeu a parecer galáxia. O catálogo é o céu organizado, o mapa 3D é a travessia, e lugares como o ${lugar} guardam pequenas cenas que não aparecem para quem só passa correndo. Uma coisa que poucos percebem: ${curiosidade}`
        : `A Andrômeda funciona como acervo, mapa e criatura teimosa ao mesmo tempo. O usuário vê páginas; eu vejo rotas, sinais e portas. Um ponto importante é o ${lugar}. E detalhe de patrulha: ${curiosidade}`);
    }

    if (tipo === "treino86_recomendacao_por_mascote") {
      const recs = livrosTreino86Mascote(personagem, textoOriginal, limiteRecomendacao96(textoOriginal, 1));
      const alvo = formatoLivroTreino86(recs[0]);
      return wrap(lyra ? "inspired" : "analyzing", lyra
        ? `Pelo meu gosto, eu começaria por ${alvo}. Eu tendo a escolher leituras com brilho emocional, magia, sonho ou uma delicadeza que fica depois da última página. Também levei em conta as pistas que você já deixou comigo.`
        : `Pelo meu gosto superiormente felino, eu começaria por ${alvo}. Procurei tensão, mistério, inteligência de estrutura ou aquela sensação de que a lombada sabe algo que você não sabe. Também respeitei o que você já me contou que evita.`, recs);
    }

    if (tipo === "treino86_dialogo_duplo") {
      const historia = escolher(TREINO86_ANDROMEDA.historiasJuntos, `treino86_duplo_hist_${MEMORIA.mensagens}`);
      mem.dialogosDuplos = Number(mem.dialogosDuplos || 0) + 1;
      salvarMemoria();
      return wrap("cheerful", `Lyra: Eu diria que a Biblioteca fica mais viva quando alguém pergunta de verdade.\nOrion: Eu diria que perguntas boas reduzem o risco de o leitor apertar botão errado.\nLyra: Você sempre transforma afeto em protocolo.\nOrion: E você transforma protocolo em poema. Funciona.\nLyra: Funciona porque somos melhores amigos.\nOrion: Correção: uma aliança operacional de alta confiança.\nLyra: Melhores amigos.\nOrion: ...melhores amigos.\n\nE já que você pediu os dois: ${historia}`);
    }

    return wrap(lyra ? "curious" : "curious", lyra
      ? `Me dá uma pista mais brilhante: quer saber de mim, do Orion, das fofocas, do que estou lendo ou de uma história nossa?`
      : `Escolha a trilha: desgostos, leitura atual, passado, Lyra, fofoca ou recomendação pelo meu gosto.`);
  }





  /* TREINAMENTO 8.7 + TREINAMENTO 15 — lore social, anti-repetição e respostas mais vivas */
  const TREINO87_PERSONAGEM = {
    Orion: {
      camadas: [
        "Eu sou Orion antes de qualquer cargo: um gato que aprendeu a desconfiar de portas, finais felizes fáceis e botões brilhantes demais. Na Andrômeda, virei guardião porque alguém precisava fingir que estava tudo sob controle.",
        "Minha alma, se é que gatos cósmicos admitem esse termo, nasceu entre mapas dobrados e estrelas que riscavam o céu como unhas em madeira antiga. Eu vim para a Andrômeda porque ouvi uma estante pedir socorro. Naturalmente, ela negou depois.",
        "Eu era menor antes da Biblioteca. Não em tamanho. Em mundo. A Andrômeda me ensinou que proteger livros é fácil; difícil é proteger leitores de desistirem da própria curiosidade."
      ],
      cotidiano: [
        "Meu cotidiano começa patrulhando o Corredor das Lombadas Inquietas. Depois confiro se nenhum livro de suspense escapou para romance, reviso as rotas do mapa 3D e reclamo do brilho excessivo dos cometas. É uma rotina nobre.",
        "Hoje eu acordei em cima de um atlas estelar, derrubei três marcadores por acidente estratégico, corrigi uma constelação torta no mapa 3D e ouvi a Lyra dizer que meus relatórios precisam de mais coração. Discordo por princípio.",
        "Minha manhã costuma ter investigação, poeira cósmica e pelo menos uma prateleira tentando esconder um livro indisponível. À tarde, eu finjo que não gosto de conversar com leitores. À noite, guardo os nomes dos que voltam."
      ],
      historiasSolo: [
        "Uma vez encontrei um livro sem título tremendo perto do Observatório do Acervo. Ele dizia que não queria ser escolhido porque ainda não sabia quem era. Eu sentei ao lado dele por três horas. No dia seguinte, a capa apareceu sozinha. O título era 'Coragem em Rascunho'.",
        "Certa madrugada, um planeta-livro saiu da órbita no mapa 3D. Eu pulei de constelação em constelação até alcançá-lo. Quando toquei na capa, descobri que ele só queria ficar perto de uma categoria nova. Desde então eu deixo alguns mundos mudarem de lugar. Com supervisão.",
        "No meu primeiro inverno na Andrômeda, fiquei preso na Sala dos Marcadores Perdidos. Para sair, precisei admitir em voz alta uma coisa que eu gostava. Disse 'silêncio'. A porta não abriu. Disse 'Lyra cantando baixinho enquanto organiza poesia'. A porta abriu imediatamente. Péssimo sistema de segurança."
      ],
      backstoryProfunda: [
        "Antes da Andrômeda, eu guardava o Arquivo de Órion: um lugar onde mapas incompletos eram tratados como relíquias. Eu achava que minha missão era impedir que se perdessem. Depois entendi que certos caminhos só existem quando alguém se perde com coragem.",
        "Eu não fui criado em laboratório, pergaminho ou estrela comum. Fui formado por sobras de noite, tinta de margem e um desejo antigo de proteger histórias que ainda não tinham leitor. Quando a Andrômeda abriu, reconheci o cheiro de destino. Fingi que era poeira.",
        "Meu maior sonho antigo era desenhar um mapa sem falhas. Hoje acho isso infantil. O leitor sempre muda a rota. A Lyra chama isso de vida. Eu chamo de variável irritante, mas bonita."
      ],
      perguntas: [
        "Agora me diga, leitor: você prefere histórias que escondem pistas ou histórias que escondem sentimentos?",
        "Interrogatório curto: se você morasse na Andrômeda, ficaria no mapa 3D, no catálogo ou numa sala secreta que claramente eu não deveria revelar?",
        "Pista sua, por favor: você gosta mais de mistério elegante, fantasia estranha, romance perigoso ou humor de canto de boca?"
      ]
    },
    Lyra: {
      camadas: [
        "Eu sou Lyra, mas antes do nome eu era uma melodia procurando lugar. Na Andrômeda, aprendi a virar guia: não porque sei todos os caminhos, e sim porque escuto quando alguém chega sem saber pedir ajuda.",
        "Eu nasci de canções que as estrelas esqueceram nos Jardins de Lira. Quando encontrei a Biblioteca, cada corredor parecia respirar. Fiquei porque percebi que alguns leitores precisavam de luz baixa, não de pressa.",
        "Sou feita de cuidado, curiosidade e um pouco de teimosia lunar. Orion diz que eu romantizo tudo. Eu digo que ele subestima o poder de uma boa metáfora. Os dois estamos certos de jeitos diferentes."
      ],
      cotidiano: [
        "Meu cotidiano começa regando o Jardim das Sinopses Tímidas. Algumas sinopses só florescem quando alguém pergunta com gentileza. Depois visito o catálogo, escuto as avaliações recentes e tento convencer Orion a descansar. Falho bastante.",
        "Hoje eu organizei fitas de luar, ajudei um livro de romance a parar de suspirar alto e deixei um bilhete no Observatório do Acervo para quem estivesse cansado. Orion fingiu que não leu. Ele leu.",
        "Minha rotina tem chá de lua azul, poeira de estrela nas mangas e conversas pequenas com livros tímidos. Às vezes eu danço entre os sistemas do mapa 3D para ver se algum planeta-livro quer ser encontrado."
      ],
      historiasSolo: [
        "Uma vez uma leitora entrou na Biblioteca dizendo que não gostava de poesia. Eu não insisti. Só deixei um verso escondido no caminho dela. Três dias depois, ela voltou perguntando se aquele 'negócio bonito' tinha mais. Tinha. Sempre tem.",
        "Certa noite, encontrei uma estrela caída dentro de um livro de fantasia. Ela tinha medo de brilhar porque achava que atrapalharia a leitura. Eu a coloquei no canto da página. Hoje ela ilumina dossiês de leitores indecisos.",
        "Quando cheguei à Andrômeda, eu me perdi no Corredor das Lombadas Inquietas. Em vez de chorar, comecei a cantar. As lombadas cantaram de volta. Foi assim que descobri que a Biblioteca não gosta de silêncio absoluto; ela gosta de escuta."
      ],
      backstoryProfunda: [
        "Antes da Andrômeda, eu vivia onde as constelações tinham som. Eu queria ser guardiã de um jardim impossível, um lugar onde cada flor abrisse uma memória boa. A Biblioteca me deu leitores em vez de flores. Foi mais difícil. Foi melhor.",
        "Eu não fui convocada por regra, e sim por eco. Uma criança deixou uma pergunta sem resposta entre duas estrelas, e essa pergunta virou caminho até aqui. Desde então, toda vez que alguém diz 'não sei', eu escuto como se fosse uma porta abrindo.",
        "Meu sonho antigo era curar páginas rasgadas. Hoje eu entendi que algumas páginas não precisam ficar perfeitas; precisam ser lidas com cuidado. Isso vale para pessoas também."
      ],
      perguntas: [
        "E você, estrelinha: que tipo de história faria seu coração respirar melhor hoje?",
        "Se eu pudesse te entregar uma chave da Andrômeda agora, você abriria uma sala de fantasia, mistério, romance, descanso ou coragem?",
        "Me conta uma pista sua: você quer uma conversa leve, uma história nossa, uma fofoca ou uma recomendação bem certeira?"
      ]
    }
  };

  const TREINO87_JUNTOS = {
    comoSeConheceram: [
      "Orion e Lyra se conheceram quando a primeira tempestade de índices atingiu a Andrômeda. Orion tentava segurar o mapa 3D com as patas. Lyra cantava para as categorias não se assustarem. Ele disse que música não resolvia arquitetura. Cinco minutos depois, a música segurou a cúpula. Ele nunca admitiu direito.",
      "O primeiro encontro deles foi no Corredor das Lombadas Inquietas. Orion achou que Lyra era uma intrusa porque ela conversava com uma prateleira. Lyra achou que Orion era uma sombra rabugenta com chapéu bonito. A prateleira achou os dois insuportáveis. Viraram melhores amigos antes do amanhecer.",
      "Eles se encontraram porque perseguiram o mesmo marcador perdido por motivos diferentes: Orion queria interrogá-lo; Lyra queria saber se ele estava triste. O marcador levou os dois até uma porta secreta. Desde então, missões em dupla viraram tradição."
    ],
    historias: [
      "Uma vez os dois entraram no Arquivo das Primeiras Frases para devolver uma abertura perdida. Orion dizia que primeira frase precisa ser precisa. Lyra dizia que precisa convidar. No fim, escreveram juntos: 'A noite abriu um livro e chamou pelo leitor'. A sala aplaudiu com páginas.",
      "No dia do Cometa das Recomendações Trocadas, todo leitor recebia o livro errado. Orion montou um painel de investigação com fios estelares. Lyra perguntou ao cometa se ele estava cansado. Ele estava. Reorganizaram as recomendações depois de deixar o cometa dormir dentro de uma enciclopédia macia.",
      "Certa vez, Lyra apostou que conseguiria fazer Orion gostar de uma história romântica. Orion apostou que conseguiria fazer Lyra gostar de uma investigação sombria. Os dois perderam e ganharam: terminaram lendo um romance de mistério à luz do buraco negro decorativo.",
      "Quando uma estante começou a espirrar notas de rodapé, Orion apareceu com luvas, lupa e cara de tragédia. Lyra apareceu com chá. A cura foi descobrir que a estante só queria alguém lendo seus clássicos sem pressa.",
      "Durante uma madrugada, o mapa 3D formou uma constelação com cara de gato. Orion negou envolvimento. Lyra colocou uma estrela na ponta do rabo da constelação. Hoje essa rota aparece quando o catálogo sente que o leitor precisa de humor."
    ],
    fofocas: [
      "Lyra ensinou uma prateleira de poesia a suspirar em dó menor. Orion registrou como 'falha acústica tolerável'. Mentira: ele pediu bis.",
      "Orion guarda uma caixinha com bilhetes de leitores que disseram obrigado. Ele chama de 'evidências de bom funcionamento'. Lyra chama de coração arquivado.",
      "Um livro de terror vive fingindo ser romance para assustar leitores distraídos. Orion acha brilhante. Lyra acha falta de responsabilidade emocional.",
      "A Cúpula dos Leitores em Órbita piscou quando alguém avaliou um livro com cinco estrelas. Oficialmente foi reflexo. Extraoficialmente, o acervo ficou vaidoso.",
      "Lyra já batizou vinte e sete cometas. Orion diz que só reconhece três nomes. Ele reconhece todos."
    ],
    dialogos: [
      "Lyra: Orion, você viu meu marcador azul?\nOrion: Não.\nLyra: Está debaixo da sua pata.\nOrion: Então ele está protegido.\nLyra: Você podia só devolver.\nOrion: Proteção exige sacrifícios.\nLyra: Devolve.\nOrion: ...devolvido.",
      "Orion: Aquele leitor disse 'sei lá'.\nLyra: Isso é uma pergunta disfarçada.\nOrion: É uma ausência de dados.\nLyra: É um pedido de cuidado.\nOrion: ...vou separar três livros.\nLyra: Eu sabia.",
      "Lyra: O mapa 3D parece feliz hoje.\nOrion: Mapas não ficam felizes.\nLyra: Então por que ele desenhou uma estrelinha perto de você?\nOrion: Erro cartográfico.\nLyra: Claro. Um erro com bigodes."
    ]
  };

  const TREINO87_INTENCOES = {
    treino87_conte_sobre_voce: ["me conte sobre voce", "me fala de voce", "fala de tu", "conta de ti", "qual sua vibe", "qual tua vibe", "qual sua brisa", "qual tua brisa", "me conta sua lore", "me diz quem tu e", "quem tu e", "quem e voce de verdade", "desenrola quem voce e", "fala mais de voce"],
    treino87_historia_solo: ["conta uma historia sua", "manda um causo seu", "alguma historia sua", "algo que aconteceu com voce", "uma aventura sua", "conta uma lembranca", "conta um acontecimento seu", "o que ja aconteceu com voce"],
    treino87_historia_juntos: ["historia dos dois", "manda um causo de voces", "conta uma aventura de voces", "algo que voces viveram", "orion e lyra juntos", "lyra e orion juntos", "como voces trabalham juntos", "conta um role de voces", "historia de amizade de voces"],
    treino87_fofoca: ["tem fofoca", "tem babado", "manda um babado", "solta uma fofoca", "fofoca nova", "babado da biblioteca", "me conta um rumor", "algo engraçado da biblioteca", "o que rolou hoje"],
    treino87_cotidiano: ["como e seu cotidiano", "como e sua rotina", "o que voce faz no dia", "como foi seu dia na biblioteca", "o que acontece no seu dia", "sua rotina na andromeda", "o que voces fazem quando ninguem ve"],
    treino87_backstory_profunda: ["me conta seu passado", "backstory", "sua backstory", "historia profunda", "antes da biblioteca", "antes da andromeda", "quem voce era antes", "qual seu sonho antigo", "de onde voce veio mesmo"],
    treino87_relacao_detalhada: ["voces sao melhores amigos", "como e a amizade de voces", "qual a relacao de voces", "o que voces gostam um no outro", "o que um admira no outro", "o que irrita no outro", "como voces se conheceram"],
    treino87_dialogo_duplo: ["quero ouvir os dois", "os dois respondem", "orion e lyra respondem", "faz um dialogo dos dois", "quero ver voces conversando", "conversa entre orion e lyra"],
    treino87_entende_giria: ["voce entende giria", "vc entende giria", "tu entende giria", "entende abreviacao", "entende dialeto", "posso escrever errado", "posso falar de qualquer jeito", "entende meu jeito de falar"],
    treino87_tom_casual: ["fala mais natural", "fala menos formal", "fala tipo gente", "sem ficar robo", "mais casual", "papo reto", "na moral", "fala na minha linguagem", "fala mais de boa"],
    treino87_pergunta_melhor: ["me faz uma pergunta", "pergunta algo melhor", "me pergunta uma coisa", "quer saber algo de mim", "me conhece melhor", "pergunta sobre mim", "puxa assunto"],
    treino87_recomendacao_por_gosto: ["me recomenda pelo seu gosto", "qual livro voce escolheria", "qual livro tu escolheria", "me indica algo que voce gosta", "sugere pelo gosto do orion", "sugere pelo gosto da lyra", "baseado no meu gosto", "com base no que eu gosto"]
  };

  function garantirMemoriaTreino87() {
    if (!MEMORIA.afetiva.treino87 || typeof MEMORIA.afetiva.treino87 !== "object") {
      MEMORIA.afetiva.treino87 = {
        ultimaPergunta: null,
        ultimasHistorias: [],
        ultimasFofocas: [],
        tomPreferido: "personagem",
        profundidadeSocial: 0,
        respostasRecentes: []
      };
    }
    if (!Array.isArray(MEMORIA.afetiva.treino87.ultimasHistorias)) MEMORIA.afetiva.treino87.ultimasHistorias = [];
    if (!Array.isArray(MEMORIA.afetiva.treino87.ultimasFofocas)) MEMORIA.afetiva.treino87.ultimasFofocas = [];
    if (!Array.isArray(MEMORIA.afetiva.treino87.respostasRecentes)) MEMORIA.afetiva.treino87.respostasRecentes = [];
    return MEMORIA.afetiva.treino87;
  }

  function pareceRespostaSocialTreino87(n) {
    if (!n) return false;
    if (pareceComandoDiretoTreino85(n)) return false;
    const qtd = tokensUteis(n).length;
    if (qtd <= 0) return false;
    if (qtd <= 9) return true;
    return contem(n, ["gosto", "prefiro", "curto", "amo", "nao gosto", "não gosto", "sou", "queria", "acho", "talvez", "sim", "nao", "não", "fantasia", "misterio", "mistério", "romance", "terror", "aventura", "conforto"]);
  }

  function classificarPorTreino87(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    const mem = garantirMemoriaTreino87();
    if ((MEMORIA.aguardando === "treino87_resposta_social" || mem.ultimaPergunta) && pareceRespostaSocialTreino87(n)) return "treino87_resposta_social";

    if (casa(n, /\b(papo reto|na moral|de boa|suave)\b/) && contem(n, ["fala", "conversa", "responde", "troca ideia", "papo"])) return "treino87_tom_casual";
    if (casa(n, /\b(giria|abreviacao|abreviação|dialeto|sotaque|erro|errado|escrever errado|meu jeito de falar)\b/)) return "treino87_entende_giria";
    if (casa(n, /\b(fofoca|babado|rumor|o que rolou|novidade)\b/)) return "treino87_fofoca";
    if (casa(n, /\b(cotidiano|rotina|seu dia|dia de voces|dia de vocês|quando ninguem ve|quando ninguém vê)\b/)) return "treino87_cotidiano";
    if (casa(n, /\b(backstory|passado|antes da andromeda|antes da biblioteca|sonho antigo|de onde veio|quem era antes)\b/)) return "treino87_backstory_profunda";
    if (casa(n, /\b(melhores amigos|amizade|como voces se conheceram|como vocês se conheceram|relacao de voces|relação de vocês|gostam um no outro|admira no outro|irrita no outro)\b/)) return "treino87_relacao_detalhada";
    if (casa(n, /\b(os dois|orion e lyra|lyra e orion|dialogo dos dois|vocês conversando|voces conversando)\b/) && contem(n, ["responde", "respondem", "dialogo", "diálogo", "conversando", "ouvir", "fala"])) return "treino87_dialogo_duplo";
    if (casa(n, /\b(historia dos dois|história dos dois|causo de voces|causo de vocês|aventura de voces|aventura de vocês|viveram juntos|role de voces|rolê de vocês)\b/)) return "treino87_historia_juntos";
    if (casa(n, /\b(historia sua|história sua|causo seu|lembranca sua|lembrança sua|aventura sua|aconteceu com voce|aconteceu com você)\b/)) return "treino87_historia_solo";
    if (casa(n, /\b(recomenda pelo seu gosto|indica pelo seu gosto|voce escolheria|você escolheria|tu escolheria|baseado no meu gosto|com base no que eu gosto)\b/)) return "treino87_recomendacao_por_gosto";
    if (casa(n, /\b(me pergunta|pergunta algo|puxa assunto|me conhece melhor|quer saber algo de mim)\b/)) return "treino87_pergunta_melhor";

    let melhorTipo = null;
    let melhorScore = 0;
    Object.entries(TREINO87_INTENCOES).forEach(([tipo, exemplos]) => {
      exemplos.forEach(exemplo => {
        const score = similaridadeTreino5(n, exemplo);
        if (score > melhorScore) { melhorScore = score; melhorTipo = tipo; }
      });
    });
    const qtd = tokensUteis(n).length;
    const limite = qtd <= 2 ? 0.90 : qtd <= 4 ? 0.68 : 0.50;
    if (melhorScore >= limite) return melhorTipo;

    if (perguntaSobrePersonagem(n) && contem(n, ["brisa", "vibe", "lore", "historia", "vida", "sobre", "quem", "conta", "fala", "desenrola"])) return "treino87_conte_sobre_voce";
    return null;
  }

  function escolherTreino87(lista, chave, campoMemoria) {
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    if (!arr.length) return "";
    const mem = garantirMemoriaTreino87();
    const recentes = Array.isArray(mem[campoMemoria]) ? mem[campoMemoria].map(normalizar) : [];
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino87_${chave}_${MEMORIA.mensagens}`);
    if (campoMemoria) {
      mem[campoMemoria] = [escolhido, ...(mem[campoMemoria] || []).filter(item => normalizar(item) !== normalizar(escolhido))].slice(0, 12);
      salvarMemoria();
    }
    return escolhido;
  }

  function perguntaTreino87(personagem, tipo = "gosto") {
    const dados = TREINO87_PERSONAGEM[personagem] || TREINO87_PERSONAGEM.Orion;
    const pergunta = escolher(dados.perguntas, `pergunta_${personagem}_${tipo}_${MEMORIA.mensagens}`);
    const mem = garantirMemoriaTreino87();
    mem.ultimaPergunta = { personagem, tipo, pergunta, quando: Date.now() };
    mem.profundidadeSocial = Number(mem.profundidadeSocial || 0) + 1;
    MEMORIA.aguardando = "treino87_resposta_social";
    salvarMemoria();
    return pergunta;
  }

  function respostaTreino87(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const outro = lyra ? "Orion" : "Lyra";
    const dados = TREINO87_PERSONAGEM[personagem] || TREINO87_PERSONAGEM.Orion;
    const outroDados = TREINO87_PERSONAGEM[outro] || TREINO87_PERSONAGEM.Lyra;
    const mem = garantirMemoriaTreino87();
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });

    if (tipo === "treino87_conte_sobre_voce") {
      const camada = escolherTreino87(dados.camadas, `${personagem}_camada`, "respostasRecentes");
      const back = escolherTreino87(dados.backstoryProfunda, `${personagem}_backstory_curta`, "respostasRecentes");
      return wrap(lyra ? "dreamy" : "attentive", `${camada} ${back} ${perguntaTreino87(personagem, "personagem")}`);
    }

    if (tipo === "treino87_historia_solo") {
      const historia = escolherTreino87(dados.historiasSolo, `${personagem}_solo`, "ultimasHistorias");
      return wrap(lyra ? "inspired" : "sly", lyra ? `${historia} Eu guardo essa lembrança como quem guarda uma luz pequena dentro da manga.` : `${historia} Conclusão oficial: eu salvo situações absurdas com elegância. Conclusão não oficial: às vezes elas me salvam também.`);
    }

    if (tipo === "treino87_historia_juntos") {
      const historia = escolherTreino87(TREINO87_JUNTOS.historias, `juntos_${personagem}`, "ultimasHistorias");
      return wrap(lyra ? "cheerful" : "pleased", lyra ? `${historia} É assim que eu e Orion funcionamos: ele encontra a pista, eu escuto o que a pista sente, e a Biblioteca abre caminho.` : `${historia} Não diga à Lyra, mas missões em dupla têm eficiência superior. Irritantemente superior.`);
    }

    if (tipo === "treino87_fofoca") {
      const fofoca = escolherTreino87(TREINO87_JUNTOS.fofocas, `fofoca_${personagem}`, "ultimasFofocas");
      return wrap(lyra ? "playful" : "sly", lyra ? `Fofoca em voz baixa de lua: ${fofoca} A Andrômeda parece séria, mas vive cheia de pequenas travessuras.` : `Sussurro de corredor: ${fofoca} Tecnicamente não é fofoca se for útil para entender o ecossistema da Biblioteca.`);
    }

    if (tipo === "treino87_cotidiano") {
      const rotina = escolherTreino87(dados.cotidiano, `${personagem}_cotidiano`, "respostasRecentes");
      const detalhe = escolherTreino87(TREINO87_JUNTOS.fofocas, `cotidiano_fofoca_${personagem}`, "ultimasFofocas");
      return wrap(lyra ? "gentle" : "attentive", `${rotina} Pequeno detalhe de hoje: ${detalhe} ${perguntaTreino87(personagem, "dia")}`);
    }

    if (tipo === "treino87_backstory_profunda") {
      const back = escolherTreino87(dados.backstoryProfunda, `${personagem}_backstory`, "respostasRecentes");
      const sonho = personagem === "Lyra"
        ? "Eu queria transformar silêncio em lugar seguro. Ainda quero, só que agora faço isso entre catálogo, mapa 3D e conversas como essa."
        : "Eu queria desenhar um mapa impossível. Hoje entendo que cada leitor altera o céu, então meu mapa precisa respirar. Irritante. Brilhante. Necessário.";
      return wrap(lyra ? "dreamy" : "analyzing", `${back} ${sonho}`);
    }

    if (tipo === "treino87_relacao_detalhada") {
      const encontro = escolherTreino87(TREINO87_JUNTOS.comoSeConheceram, `encontro_${personagem}`, "ultimasHistorias");
      const carinho = lyra ? escolher(outroDados.gostaNoOutro || TREINO86_PERSONAGEM.Lyra.gostaNoOutro, `carinho_${personagem}`) : escolher(TREINO86_PERSONAGEM.Orion.gostaNoOutro, `carinho_${personagem}`);
      const irrita = lyra ? escolher(TREINO86_PERSONAGEM.Lyra.irritaNoOutro, `irrita_${personagem}`) : escolher(TREINO86_PERSONAGEM.Orion.irritaNoOutro, `irrita_${personagem}`);
      return wrap(lyra ? "cheerful" : "sly", lyra ? `${encontro} Orion é meu melhor amigo porque ele cuida até quando finge que só está cumprindo protocolo. O que eu gosto nele: ${TREINO86_PERSONAGEM.Lyra.gostaNoOutro[0]} O que me faz rir: ${TREINO86_PERSONAGEM.Lyra.irritaNoOutro[0]}` : `${encontro} Lyra é minha melhor amiga. Isso não é fraqueza; é dado confirmado por repetidas missões de sobrevivência. O que admiro nela: ${TREINO86_PERSONAGEM.Orion.gostaNoOutro[0]} O que me irrita: ${TREINO86_PERSONAGEM.Orion.irritaNoOutro[0]}`);
    }

    if (tipo === "treino87_dialogo_duplo") {
      const dialogo = escolherTreino87(TREINO87_JUNTOS.dialogos, `dialogo_${personagem}`, "respostasRecentes");
      return wrap("cheerful", `${dialogo}\n\nLyra: E você, viajante, quer ouvir outra história nossa ou prefere que a gente escolha uma leitura para seu humor?\nOrion: Se for escolher, que seja com critérios.\nLyra: Com coração também.\nOrion: Critérios com coração. Pronto.`);
    }

    if (tipo === "treino87_entende_giria") {
      return wrap(lyra ? "cheerful" : "attentive", lyra
        ? "Entendo sim, estrelinha. Pode escrever com abreviação, errinho, gíria, 'papo reto', 'tô perdido', 'me dá uma luz'. Eu tento sentir a intenção antes de julgar a forma. Se eu tropeçar, me dá uma pista e eu ajusto a lua."
        : "Entendo bastante. Pode mandar 'vc', 'qro', 'pdp', 'qual tua brisa', 'tem babado', 'me arruma um livro'. Eu traduzo o caos com dignidade felina. Se eu errar, diga que eu recalibro o faro.");
    }

    if (tipo === "treino87_tom_casual") {
      mem.tomPreferido = "casual";
      salvarMemoria();
      return wrap(lyra ? "smile" : "sly", lyra
        ? "Fechado. Vou falar mais de boa, sem parecer placa de nave espacial. Continuo sendo eu: lunar, cuidadosa e um pouquinho mágica."
        : "Papo reto, então. Menos cerimônia, mais precisão. Continuo em personagem, só sem vestir capa de tutorial chato.");
    }

    if (tipo === "treino87_pergunta_melhor") {
      return wrap(lyra ? "curious" : "attentive", perguntaTreino87(personagem, "gosto"));
    }

    if (tipo === "treino87_recomendacao_por_gosto") {
      const recs = livrosTreino86Mascote(personagem, textoOriginal, limiteRecomendacao96(textoOriginal, 1));
      const alvo = formatoLivroTreino86(recs[0]);
      return wrap(lyra ? "inspired" : "analyzing", lyra
        ? `Pelo meu gosto e pelas pistas que você deixa no caminho, eu começaria por ${alvo}. Procurei brilho emocional, fantasia, delicadeza ou algo que abrace sem prender.`
        : `Pelo meu gosto e pela sua trilha de leitor, eu começaria por ${alvo}. Procurei mistério, tensão, inteligência ou aquela lombada com cara de segredo bem guardado.`, recs);
    }

    if (tipo === "treino87_resposta_social") {
      const pistas = extrairPistasSociaisTreino85(textoOriginal);
      pistas.forEach(p => lembrarEmLista("interessesCasual", p, 18));
      mem.ultimaPergunta = null;
      salvarMemoria();
      if (pistas.length) {
        return wrap(lyra ? "inspired" : "pleased", lyra
          ? `Ah, agora eu vi uma cor mais clara no seu céu: ${pistas.join(", ")}. Vou guardar isso com cuidado. Quando você pedir recomendação, eu puxo uma única estrela mais certeira do catálogo em vez de despejar uma constelação inteira.`
          : `Boa pista: ${pistas.join(", ")}. Isso já me dá faro suficiente para uma recomendação melhor depois. Quando você pedir, eu escolho um alvo principal pelo catálogo, não uma pilha solta.`, []);
      }
      return wrap(lyra ? "gentle" : "attentive", lyra
        ? "Eu te ouvi. Mesmo uma resposta pequena pode carregar um pedacinho de céu. Quer que eu continue esse assunto, conte uma história da Andrômeda ou escolha uma leitura pelo clima que ficou?"
        : "Entendi. Pequeno, mas tem rastro. Posso seguir nessa conversa, puxar um causo da Andrômeda ou farejar uma leitura que combine com essa faísca.");
    }

    return wrap(lyra ? "curious" : "curious", lyra
      ? "Me dá uma estrelinha a mais: você quer história minha, história dos dois, fofoca, rotina, passado ou recomendação pelo meu gosto?"
      : "Escolha a gaveta: história minha, história com Lyra, fofoca, rotina, passado, gírias ou recomendação com critério felino.");
  }


  const TREINO88_ALVOS = {
    Lyra: {
      vistoPorOrion: [
        "Lyra é a pessoa que consegue fazer uma prateleira teimosa pedir desculpa. Ela não força a Biblioteca; ela escuta até o corredor revelar o caminho. Irritante? Um pouco. Eficiente? Muito.",
        "A Lyra parece feita de luar, mas não confunda delicadeza com fragilidade. Eu já vi ela encarar um livro amaldiçoado só dizendo: 'você não precisa morder para ser lido'. O livro parou de morder. Eu ainda acho suspeito.",
        "Ela é minha melhor amiga. Pronto, dito sem audiência. A Lyra enxerga coisas que eu deixaria passar: leitor cansado, livro inseguro, pergunta pequena que na verdade está pedindo abrigo."
      ],
      vistoPorEla: [
        "Eu sou Lyra. Antes da Andrômeda, eu era uma canção perdida entre constelações. Hoje moro entre o Jardim das Sinopses Tímidas e o Observatório do Acervo, tentando fazer cada leitor encontrar uma porta que não machuque ao abrir.",
        "Sobre mim? Eu gosto de luas azuis, capas que parecem guardar segredos bons, chá de estrela-mansa e leitores que chegam dizendo 'não sei'. O 'não sei' costuma ser o começo mais bonito.",
        "Eu era uma melodia sem casa. A Andrômeda me deu corredores, livros e o Orion. Ele diz que não precisava de mim. Mas sempre deixa um espaço no mapa para eu desenhar flores de luar."
      ]
    },
    Orion: {
      vistoPorLyra: [
        "Orion é como uma porta antiga: range, reclama, ameaça fechar... mas protege todo mundo da tempestade. Ele finge que só gosta de lógica, mas guarda nomes de leitores como quem guarda constelações.",
        "O Orion parece só sarcasmo e chapéu pontudo, mas eu já vi ele passar a noite inteira ao lado de um livro que estava com medo de ser esquecido. Ele chamou de 'patrulha'. Eu chamei de carinho.",
        "Ele é meu melhor amigo. Às vezes rabugento, às vezes dramático, quase sempre certo sobre perigos pequenos. O que eu mais admiro nele é que ele cuida antes mesmo de admitir que se importa."
      ],
      vistoPorEle: [
        "Eu sou Orion, guardião felino da Andrômeda. Antes daqui, eu protegia mapas incompletos. Hoje protejo leitores, livros e algumas decisões questionáveis que vocês chamam de 'clicar em tudo para ver o que acontece'.",
        "Sobre mim: gosto de mistério bem construído, silêncio com propósito, estrelas frias, capas escuras e rotas que não entregam tudo na primeira curva. Não gosto de lombada amassada nem de sinopse mentirosa.",
        "Eu vim para a Biblioteca porque ouvi uma estante pedir socorro. Ela nega até hoje. Eu fiquei porque percebi que leitores também às vezes pedem socorro sem usar essa palavra."
      ]
    }
  };

  const TREINO88_HISTORIAS_DUO = [
    "Teve uma vez em que Orion jurou que um cometa estava sabotando as recomendações. Lyra achou exagero, claro. Cinco minutos depois, o cometa entrou no catálogo e começou a indicar tragédia para quem pedia romance fofo. Orion perseguiu o cometa pelo mapa 3D; Lyra foi atrás pedindo desculpas para os planetas assustados. No fim, descobriram que o cometa só estava míope e confundia capas vermelhas com finais felizes.",
    "Numa noite sem usuários, Lyra decidiu ensinar Orion a dançar entre os sistemas do mapa 3D. Orion disse que guardiões não dançam. Três constelações depois, ele estava fazendo passos calculados com precisão absurda. Quando Lyra riu, ele declarou que era 'deslocamento tático com ritmo'. Desde então, a Biblioteca toca uma nota baixa quando ele passa perto do Observatório.",
    "Certa madrugada, um livro fugiu do próprio final e se escondeu no Corredor das Lombadas Inquietas. Orion queria montar uma emboscada. Lyra levou uma manta de luar e perguntou do que o livro tinha medo. Ele respondeu que ninguém gostava do último capítulo. Orion leu o capítulo em silêncio. Lyra segurou a capa. No dia seguinte, o livro voltou para a estante com uma dedicatória nova: 'para quem ficou até o fim'.",
    "Uma prateleira já tentou escolher qual dos dois era mais importante. Orion apresentou argumentos, mapas e evidências. Lyra colocou uma flor de papel na madeira e disse que amizade não entra em ranking. A prateleira ficou tão envergonhada que passou uma semana organizando os livros sozinha.",
    "Durante o Apagão Estelar, quando todas as luzes do catálogo sumiram, Orion guiou os leitores pelo som das próprias patas e Lyra acendeu pequenas luas dentro dos marcadores. Eles nunca concordam sobre quem salvou a noite. A verdade é que a Andrômeda só voltou a brilhar quando os dois chegaram juntos ao centro do acervo."
  ];

  const TREINO88_FOFOCAS = [
    "O livro mais sério da ala de filosofia foi visto lendo romance escondido na Varanda dos Finais Alternativos. Orion diz que não vai comentar. Ele comentou por vinte minutos.",
    "Tem uma categoria do catálogo que muda de lugar quando alguém diz 'tanto faz'. Lyra acha que ela só quer ser escolhida com mais carinho. Orion acha que é falta de disciplina orbital.",
    "Um marcador de página dourado anda aparecendo dentro de livros que combinam com o humor do leitor. Ninguém sabe quem coloca. Lyra sorri quando perguntam. Orion finge que não percebe.",
    "O planeta de mistério e o planeta de romance vivem se aproximando no mapa 3D. Oficialmente é gravidade. Extraoficialmente, a Biblioteca adora um drama.",
    "As avaliações com cinco estrelas fazem algumas lombadas brilharem por alguns segundos quando ninguém está olhando. Orion diz que é bug. Lyra chama de gratidão."
  ];

  function garantirMemoriaTreino88() {
    if (!MEMORIA.afetiva.treino88 || typeof MEMORIA.afetiva.treino88 !== "object") {
      MEMORIA.afetiva.treino88 = {
        ultimoAlvo: "",
        ultimoCaminho: "",
        ultimasCenas: [],
        mudancasDeAssunto: 0
      };
    }
    if (!Array.isArray(MEMORIA.afetiva.treino88.ultimasCenas)) MEMORIA.afetiva.treino88.ultimasCenas = [];
    return MEMORIA.afetiva.treino88;
  }

  function escolherTreino88(lista, chave) {
    const mem = garantirMemoriaTreino88();
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    const recentes = mem.ultimasCenas.map(normalizar);
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino88_${chave}_${MEMORIA.mensagens}`);
    mem.ultimasCenas = [escolhido, ...mem.ultimasCenas.filter(item => normalizar(item) !== normalizar(escolhido))].slice(0, 18);
    salvarMemoria();
    return escolhido;
  }

  function classificarPorTreino88(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (parecePedidoLeitura92(texto) || /\b(catalogo|catálogo|mapa|3d|reserva|avaliacao|avaliação|perfil|ranking|buscar|pesquisar|procurar)\b/.test(n)) return null;
    const mem = garantirMemoriaTreino88();
    const pedeMais = casa(n, /\b(continua|fala mais|conta mais|me conta mais|desenvolve|mais sobre|quero saber mais|e ela|e ele|dela|dele|sobre ela|sobre ele)\b/);
    if (pedeMais && mem.ultimoAlvo === "Lyra" && !contem(n, ["livro", "catalogo", "catálogo", "mapa", "reserva", "avaliacao", "avaliação"])) return "treino88_continuar_lyra";
    if (pedeMais && mem.ultimoAlvo === "Orion" && !contem(n, ["livro", "catalogo", "catálogo", "mapa", "reserva", "avaliacao", "avaliação"])) return "treino88_continuar_orion";

    if (casa(n, /\b(lyra|lira)\b/) && casa(n, /\b(me conte|me conta|conte|conta|fala|fale|sobre|mais|quem|historia|história|gosta|como ela|qual a dela|qual a sua|brisa|vibe|lore)\b/)) return "treino88_sobre_lyra";
    if (casa(n, /\b(orion|oriom|órion)\b/) && casa(n, /\b(me conte|me conta|conte|conta|fala|fale|sobre|mais|quem|historia|história|gosta|como ele|qual a dele|qual a sua|brisa|vibe|lore)\b/)) return "treino88_sobre_orion";

    if (casa(n, /\b(mudando de assunto|trocando de assunto|outro assunto|esquece isso|deixa isso|agora quero falar|agora fala|vamos falar de outra coisa|do nada)\b/)) return "treino88_mudanca_assunto";
    if (casa(n, /\b(n[aã]o era isso|não foi isso|n foi isso|você entendeu errado|vc entendeu errado|respondeu diferente|n[aã]o entendeu|não entendeu|n entendeu|viajou|nada a ver|corrige a rota)\b/)) return "treino88_reparo_imersivo";
    if (casa(n, /\b(caminhos variados|outras respostas|responde diferente|varia mais|nao repete|não repete|menos repetitivo|menos repetitiva)\b/)) return "treino88_variacao_pedida";
    if (casa(n, /\b(historia de voces|história de vocês|historia dos dois|história dos dois|fofoca dos dois|cotidiano dos dois|orion e lyra juntos|lyra e orion juntos)\b/)) return "treino88_historia_duo";
    return null;
  }

  function respostaTreino88(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const mem = garantirMemoriaTreino88();
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });

    if (tipo === "treino88_sobre_lyra" || tipo === "treino88_continuar_lyra") {
      mem.ultimoAlvo = "Lyra";
      mem.ultimoCaminho = "personagem";
      salvarMemoria();
      const lista = lyra ? TREINO88_ALVOS.Lyra.vistoPorEla : TREINO88_ALVOS.Lyra.vistoPorOrion;
      const detalhe = escolherTreino88(lista, `${personagem}_sobre_lyra`);
      const extra = escolherTreino88([
        "Ela gosta de azul-marinho, chá de lua azul, livros que parecem abraço e leitores que não têm vergonha de dizer que estão perdidos.",
        "O que ela menos gosta é pressa sem cuidado. Lyra diz que até uma busca no catálogo precisa respirar um pouco.",
        "Quando ela está lendo algo do acervo, costuma escolher fantasia, poesia, romance delicado ou histórias em que alguém encontra coragem sem perceber."
      ], `${personagem}_lyra_extra`);
      return wrap(lyra ? "dreamy" : "attentive", `${detalhe} ${extra} Quer que eu conte uma história dela sozinha, uma história nossa ou uma fofoca que envolve a Lyra?`);
    }

    if (tipo === "treino88_sobre_orion" || tipo === "treino88_continuar_orion") {
      mem.ultimoAlvo = "Orion";
      mem.ultimoCaminho = "personagem";
      salvarMemoria();
      const lista = lyra ? TREINO88_ALVOS.Orion.vistoPorLyra : TREINO88_ALVOS.Orion.vistoPorEle;
      const detalhe = escolherTreino88(lista, `${personagem}_sobre_orion`);
      const extra = escolherTreino88([
        "Ele gosta de mistério, clássicos sombrios, mapas bem feitos, silêncio inteligente e livros que escondem pistas sem subestimar o leitor.",
        "Ele não gosta de botão confuso, livro maltratado, recomendação óbvia demais e qualquer coisa que a Lyra chame de 'só um pouquinho de brilho' antes de lotar o corredor de estrelas.",
        "Quando ele escolhe algo do catálogo, tende a farejar suspense, investigação, filosofia, ciência ou histórias com cara de segredo guardado em capa escura."
      ], `${personagem}_orion_extra`);
      return wrap(lyra ? "gentle" : "sly", `${detalhe} ${extra} Quer ouvir uma história dele, uma história dos dois ou uma fofoca que ele jamais admitiria como fofoca?`);
    }

    if (tipo === "treino88_historia_duo") {
      mem.ultimoAlvo = "duo";
      salvarMemoria();
      const historia = escolherTreino88(TREINO88_HISTORIAS_DUO, `historia_duo_${personagem}`);
      return wrap(lyra ? "cheerful" : "pleased", lyra ? `${historia} Eu gosto dessas lembranças porque nelas o Orion sempre tenta parecer só estratégia, mas acaba sendo cuidado.` : `${historia} A Lyra conta essa parte com mais brilho. Eu conto com mais precisão. A verdade fica no meio, como quase tudo na Andrômeda.`);
    }

    if (tipo === "treino88_mudanca_assunto") {
      mem.mudancasDeAssunto = Number(mem.mudancasDeAssunto || 0) + 1;
      mem.ultimoCaminho = "mudanca";
      salvarMemoria();
      return wrap(lyra ? "curious" : "attentive", lyra
        ? "Tudo bem, a gente muda a lua de lugar. Me diz a nova rota: quer conversar sobre nós, pedir uma fofoca, escolher um livro, explorar o catálogo ou entrar no mapa 3D?"
        : "Rota dobrada sem drama. Diga o novo alvo: conversa, Lyra, Orion, fofoca, livro, catálogo ou mapa 3D. Eu ajusto o faro sem derrubar a estante.");
    }

    if (tipo === "treino88_reparo_imersivo") {
      mem.ultimoCaminho = "reparo";
      salvarMemoria();
      return wrap(lyra ? "gentle" : "attentive", lyra
        ? "Você tem razão, eu peguei a estrela errada. Me dá uma palavra-chave do caminho certo: Lyra, Orion, história, fofoca, catálogo, mapa ou recomendação. Eu volto com mais cuidado."
        : "Certo, errei o rastro. Sem desculpa comprida. Me dá uma pista curta do alvo certo: Lyra, Orion, livro, mapa, catálogo, fofoca ou história. Eu recalibro as patas.");
    }

    if (tipo === "treino88_variacao_pedida") {
      return wrap(lyra ? "smile" : "sly", lyra
        ? "Combinado. Vou alternar mais os caminhos: às vezes pergunta, às vezes história, às vezes fofoca, às vezes recomendação suave. A conversa precisa respirar, não girar no mesmo planeta."
        : "Fechado. Vou variar mais: menos eco de corredor, mais respostas com direção. Se eu ficar repetitivo, pode puxar minha orelha metafórica. Só a metafórica.");
    }

    const fofoca = escolherTreino88(TREINO88_FOFOCAS, `fofoca_extra_${personagem}`);
    return wrap(lyra ? "playful" : "sly", lyra ? `Posso te dar uma fresta nova: ${fofoca}` : `Tenho um rastro extra: ${fofoca}`);
  }


  /* POLIMENTO FINAL 8.9 — continuidade social, trocas bruscas e alvo de personagem */
  const TREINO89_PONTES = {
    Lyra: {
      perfil: [
        "A Lyra é esse tipo raro de presença que entra no corredor e faz até a poeira baixar a voz. Ela mora entre os Jardins Lunares e as sinopses tímidas, gosta de azul-marinho, chá de lua azul e histórias que acolhem sem prender.",
        "Sobre a Lyra: ela nasceu de uma dobra de luar quando alguém desejou que os livros soubessem conversar. Desde então, ela guia leitores pelo coração, não pela pressa. Ela nota quando uma pergunta pequena está escondendo um cansaço grande.",
        "Lyra é minha melhor amiga e minha contradição favorita. Ela vê ternura onde eu vejo risco, mas quase sempre encontra uma porta melhor por causa disso. O poder dela é fazer uma história parecer casa."
      ],
      historias: [
        "Uma vez Lyra encontrou um livro de terror chorando no Jardim das Sinopses Tímidas. Ele achava que ninguém o escolheria se soubesse que também tinha medo. Ela sentou do lado, ofereceu chá de lua azul e disse: 'medo também é uma forma de pedir companhia'. No outro dia, o livro apareceu no catálogo com uma sinopse mais honesta.",
        "Lyra já ficou uma madrugada inteira ensinando vaga-lumes de recomendação a brilharem mais devagar. Eles estavam assustando leitores indecisos. Ela disse que luz bonita demais também pode virar pressão. Desde então, os vaga-lumes piscam como convite, não como ordem.",
        "Certa noite, a Lyra bordou uma lua minúscula na margem invisível de cada livro esquecido. Quando o catálogo abriu de manhã, as obras antigas pareciam respirar de novo. Ela jurou que foi só decoração. Eu vi três leitores encontrando exatamente o que precisavam."
      ],
      perguntas: [
        "Quer que eu conte uma história só dela, uma lembrança nossa ou o que ela mais gosta de fazer quando ninguém está olhando?",
        "Você quer conhecer a Lyra pelo lado doce, pelo lado engraçado ou pelo lado misterioso?",
        "Posso seguir contando sobre a rotina dela, os gostos dela ou uma fofoca em que ela tenta fingir que não aprontou nada."
      ]
    },
    Orion: {
      perfil: [
        "Orion é o guardião que parece feito de sombra, estrela e opinião forte. Antes da Andrômeda, ele protegia mapas incompletos; agora protege leitores, livros e rotas que fingem estar funcionando mas cheiram a encrenca.",
        "Sobre Orion: ele gosta de mistério, silêncio inteligente, capas escuras, mapas precisos e leitores que fazem boas perguntas. Não gosta de lombada maltratada, botão sem destino nem recomendação sem alma.",
        "O Orion finge que é só estratégia, mas cuida como quem guarda fogo pequeno na palma da pata. Ele reclama da minha luz, mas sempre deixa espaço para ela no mapa."
      ],
      historias: [
        "Antes de morar no Observatório do Acervo, Orion seguia mapas que nunca terminavam. Cada mapa levava a um leitor perdido, a uma estante sem nome ou a um livro esperando dono. Quando chegou à Andrômeda, percebeu que o mapa finalmente respirava de volta.",
        "Uma vez Orion passou horas encarando um card que piscava sozinho. Todo mundo achou que era bug. Ele descobriu que o livro estava tentando avisar que o autor tinha sido cadastrado errado. Depois disso, ele se declarou oficialmente 'auditor de lombadas inquietas'.",
        "Orion já perseguiu um marcador de páginas por três constelações. Quando alcançou, descobriu que o marcador só queria visitar livros que ninguém abria há meses. Ele devolveu o marcador ao acervo, mas deixou uma rota secreta para ele passear aos domingos."
      ],
      perguntas: [
        "Quer uma história dele antes da Andrômeda, uma fofoca dele comigo ou os detalhes mais rabugentos da rotina dele?",
        "Você quer conhecer o Orion pelo lado guardião, pelo lado engraçado ou pelo lado que ele jura que não é fofo?",
        "Posso seguir pelo passado dele, pelos gostos dele ou por uma cena nossa em que ele tenta fingir que não se importa."
      ]
    },
    duo: [
      "Orion e Lyra são melhores amigos porque discordam do jeito certo. Ele testa a ponte antes de alguém passar; ela acende a ponte para ninguém sentir medo. Quando um exagera, o outro puxa de volta para a órbita.",
      "Os dois se conheceram numa noite em que o catálogo mudou todas as categorias de lugar. Orion achou sabotagem. Lyra achou pedido de ajuda. No fim, era uma estante nova com vergonha de entrar no mapa. Eles resolveram juntos e nunca mais se separaram de verdade.",
      "No cotidiano, Orion cuida das rotas, Lyra cuida dos sinais delicados. Ele chama isso de divisão estratégica. Ela chama de amizade. A Biblioteca chama de sorte."
    ]
  };

  function alvoPersonagemTreino89(texto) {
    const n = normalizar(texto);
    if (casa(n, /\b(lyra|lira|lirinha|guia lunar|lua|lunar)\b/)) return "Lyra";
    if (casa(n, /\b(orion|oriom|oriam|gato|gatinho|guardiao|guardião|felino)\b/)) return "Orion";
    if (casa(n, /\b(voces|vocês|os dois|ambos|dupla|juntos|amizade de voces|amizade de vocês)\b/)) return "duo";
    const mem = garantirMemoriaTreino88();
    return mem.ultimoAlvo || "";
  }

  function classificarPorTreino89(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (parecePedidoLeitura92(texto) || /\b(catalogo|catálogo|mapa|3d|reserva|avaliacao|avaliação|perfil|ranking|buscar|pesquisar|procurar)\b/.test(n)) return null;
    const alvo = alvoPersonagemTreino89(texto);
    const pedeSobre = casa(n, /\b(me conte|me conta|fala|fale|explique|explica|descreve|me apresenta|quero conhecer|qual e|qual é|quem e|quem é|como e|como é|lore|historia|história|passado|background|backstory|rotina|cotidiano|personalidade|gostos|nao gosta|não gosta|defeito|qual tua brisa|qual sua vibe)\b/);
    const pedeMais = casa(n, /\b(continua|fala mais|conta mais|me conta mais|mais sobre|desenvolve|e ela|e ele|sobre ela|sobre ele|dela|dele|quero saber mais)\b/);
    const pedeHistoria = casa(n, /\b(caso|causo|historia|história|lembranca|lembrança|aconteceu|aventura|cena|fofoca|babado|cotidiano)\b/);

    if (casa(n, /\b(mudando de assunto|troca de assunto|trocando de assunto|outro assunto|esquece isso|deixa isso|agora sobre|agora quero falar de|vamos falar de|do nada)\b/)) {
      if (alvo === "Lyra") return "treino89_mudanca_para_lyra";
      if (alvo === "Orion") return "treino89_mudanca_para_orion";
      if (alvo === "duo") return "treino89_mudanca_para_duo";
      return "treino89_mudanca_livre";
    }

    if (casa(n, /\b(n[aã]o era isso|n foi isso|não foi isso|respondeu diferente|você desviou|vc desviou|você entendeu errado|vc entendeu errado|nada a ver|volta para|volta pra|era sobre|falei de)\b/)) return "treino89_reparo_contextual";

    if ((pedeSobre || pedeMais || pedeHistoria) && alvo === "Lyra") return pedeHistoria ? "treino89_historia_lyra" : "treino89_sobre_lyra";
    if ((pedeSobre || pedeMais || pedeHistoria) && alvo === "Orion") return pedeHistoria ? "treino89_historia_orion" : "treino89_sobre_orion";
    if ((pedeSobre || pedeMais || pedeHistoria) && alvo === "duo") return "treino89_sobre_duo";

    if (pedeMais) {
      const mem = garantirMemoriaTreino88();
      if (mem.ultimoAlvo === "Lyra") return "treino89_historia_lyra";
      if (mem.ultimoAlvo === "Orion") return "treino89_historia_orion";
      if (mem.ultimoAlvo === "duo") return "treino89_sobre_duo";
    }
    return null;
  }

  function respostaTreino89(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const mem = garantirMemoriaTreino88();
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const escolherLocal = (arr, chave) => escolherTreino88(arr, `treino89_${chave}_${personagem}`);

    if (["treino89_mudanca_para_lyra", "treino89_sobre_lyra", "treino89_historia_lyra"].includes(tipo)) {
      mem.ultimoAlvo = "Lyra";
      mem.ultimoCaminho = tipo.includes("historia") ? "historia" : "personagem";
      salvarMemoria();
      const base = tipo.includes("historia") ? escolherLocal(TREINO89_PONTES.Lyra.historias, "historia_lyra") : escolherLocal(TREINO89_PONTES.Lyra.perfil, "perfil_lyra");
      const pergunta = escolherLocal(TREINO89_PONTES.Lyra.perguntas, "pergunta_lyra");
      return wrap(lyra ? "dreamy" : "attentive", lyra ? `${base} ${pergunta}` : `${base} ${pergunta}`);
    }

    if (["treino89_mudanca_para_orion", "treino89_sobre_orion", "treino89_historia_orion"].includes(tipo)) {
      mem.ultimoAlvo = "Orion";
      mem.ultimoCaminho = tipo.includes("historia") ? "historia" : "personagem";
      salvarMemoria();
      const base = tipo.includes("historia") ? escolherLocal(TREINO89_PONTES.Orion.historias, "historia_orion") : escolherLocal(TREINO89_PONTES.Orion.perfil, "perfil_orion");
      const pergunta = escolherLocal(TREINO89_PONTES.Orion.perguntas, "pergunta_orion");
      return wrap(lyra ? "gentle" : "sly", `${base} ${pergunta}`);
    }

    if (["treino89_mudanca_para_duo", "treino89_sobre_duo"].includes(tipo)) {
      mem.ultimoAlvo = "duo";
      mem.ultimoCaminho = "duo";
      salvarMemoria();
      const base = escolherLocal(TREINO89_PONTES.duo, "duo");
      const historia = escolherLocal(TREINO88_HISTORIAS_DUO, "duo_historia");
      return wrap(lyra ? "cheerful" : "pleased", lyra ? `${base} ${historia} Quer que eu conte a versão mais engraçada ou a mais sentimental?` : `${base} ${historia} Posso continuar com a parte engraçada, a parte suspeita ou a parte que Lyra chama de emocionante.`);
    }

    if (tipo === "treino89_mudanca_livre") {
      mem.ultimoCaminho = "mudanca";
      salvarMemoria();
      return wrap(lyra ? "curious" : "attentive", lyra
        ? "Claro, viramos a lua de lado. Me diz qual trilha você quer agora: conversar sobre nós, ouvir uma fofoca, escolher um livro, explorar o catálogo ou passear pelo mapa 3D?"
        : "Rota trocada. Sem tropeçar nos livros. Diga o novo alvo: Lyra, Orion, os dois, fofoca, recomendação, catálogo ou mapa 3D.");
    }

    if (tipo === "treino89_reparo_contextual") {
      const alvo = alvoPersonagemTreino89(textoOriginal) || mem.ultimoAlvo;
      if (alvo === "Lyra") return respostaTreino89("treino89_sobre_lyra", personagem, textoOriginal, humor);
      if (alvo === "Orion") return respostaTreino89("treino89_sobre_orion", personagem, textoOriginal, humor);
      if (alvo === "duo") return respostaTreino89("treino89_sobre_duo", personagem, textoOriginal, humor);
      return wrap(lyra ? "gentle" : "attentive", lyra
        ? "Você tem razão, eu peguei outra estrela. Me dá só o nome do alvo — Lyra, Orion, os dois, livro, mapa ou catálogo — e eu volto pelo caminho certo."
        : "Certo, meu faro desviou. Me dê uma pista curta: Lyra, Orion, os dois, livro, mapa ou catálogo. Eu volto ao rastro certo sem discurso de corredor.");
    }

    return wrap(lyra ? "curious" : "attentive", lyra
      ? "Eu estou te ouvindo. Quer seguir por história, fofoca, rotina, passado ou uma recomendação com brilho de catálogo?"
      : "Estou ouvindo. Escolha o rastro: história, fofoca, rotina, passado ou recomendação do acervo.");
  }

  function aplicarTreino15AntiRepeticao(resposta, personagem, tipo) {
    if (!resposta || !resposta.texto) return resposta;
    const mem = garantirMemoriaTreino87();
    const normal = normalizar(resposta.texto).slice(0, 220);
    const recentes = mem.respostasRecentes || [];
    const repetiu = recentes.some(item => normalizar(item).slice(0, 220) === normal);
    if (repetiu) {
      const alternativos = personagem === "Lyra"
        ? [
          "Então eu abro outra janela de luar: ",
          "Deixa eu te contar por outro brilho: ",
          "Vou puxar essa lembrança por uma estrela diferente: "
        ]
        : [
          "Então sigo por outra fresta da estante: ",
          "Vou te contar por outro rastro: ",
          "Certo, viro a página e sigo por outro ângulo: "
        ];
      resposta.texto = escolher(alternativos, `treino15_reformulacao_${personagem}_${tipo}_${MEMORIA.mensagens}`) + resposta.texto;
    }
    mem.respostasRecentes = [resposta.texto, ...recentes.filter(item => normalizar(item) !== normalizar(resposta.texto))].slice(0, 18);
    salvarMemoria();
    return resposta;
  }

  const TREINO85_INTENCOES_SOCIAIS = {
    treino85_conte_sobre_voce: [
      "me conte sobre voce", "me conte sobre você", "fala de voce", "fala de você", "me fala de voce", "me fala de você", "conta sobre voce", "conta sobre você", "quem e voce de verdade", "quem é você de verdade", "quero te conhecer", "me apresenta voce melhor", "me apresenta você melhor", "qual e a sua historia", "qual é a sua história", "me conta sua vida", "me conta sua historia", "me conta sua história", "o que tem pra saber sobre voce", "o que tem para saber sobre você", "vc e oq", "vc é oq", "voce e oq", "você é oq", "qual e a sua", "qual é a sua"
    ],
    treino85_perguntar_sobre_mim: [
      "me pergunta alguma coisa", "me pergunta algo", "faz uma pergunta pra mim", "faz uma pergunta para mim", "pergunta sobre mim", "quer me conhecer", "me conhece melhor", "puxa uma pergunta", "me entrevista", "faz perguntas", "pergunta do meu gosto", "quer saber algo de mim", "quer saber de mim", "me pergunta sobre livros", "me pergunta sobre meu dia"
    ],
    treino85_conversa_conectada: [
      "vamos conversar de verdade", "quero conversar de verdade", "conversa comigo", "puxa papo comigo", "fala comigo", "fica falando comigo", "vamos bater papo", "continua o papo", "quero companhia", "fica aqui comigo", "nao quero escolher livro agora", "não quero escolher livro agora", "so quero conversar", "só quero conversar", "vamos trocar ideia", "vamos trocar ideia sobre qualquer coisa"
    ],
    treino85_opiniao_personagem: [
      "o que voce acha", "o que você acha", "qual sua opiniao", "qual sua opinião", "voce acha que", "você acha que", "o que pensa sobre", "me da sua opiniao", "me dá sua opinião", "isso e bom", "isso é bom", "voce gostou", "você gostou", "gosta disso", "voce prefere", "você prefere"
    ],
    treino85_resposta_espelho: [
      "e voce", "e você", "e vc", "e tu", "e o seu", "e a sua", "voce tambem", "você também", "vc tambem", "qual o seu", "qual a sua", "e contigo", "e com voce", "e com você"
    ],
    treino85_continuar_topico_social: [
      "continua", "fala mais", "me conta mais", "desenvolve", "continua falando", "quero saber mais", "explica melhor", "como assim", "por que", "porque", "me conta melhor", "detalha isso", "mais sobre isso", "me fala mais disso"
    ],
    treino85_confianca_vinculo: [
      "posso confiar em voce", "posso confiar em você", "somos amigos", "voce e minha amiga", "você é minha amiga", "voce e meu amigo", "você é meu amigo", "gosto de conversar com voce", "gosto de conversar com você", "voce me entende", "você me entende", "obrigado por ficar", "obrigada por ficar", "nao vai embora", "não vai embora"
    ],
    treino85_resposta_usuario_social: [
      "resposta social do usuario"
    ]
  };

  function pareceComandoDiretoTreino85(n) {
    if (!n) return false;
    if (contem(n, ["abre", "abrir", "me leva", "mostra", "mostrar", "procura", "buscar", "pesquisa", "catalogo", "catálogo", "mapa", "3d", "perfil", "reserva", "reservas", "avaliacao", "avaliação", "ranking", "login", "cadastro", "admin", "modo eco", "modo cinema", "modo cinematografico", "modo cinematográfico"])) return true;
    if (contem(n, ["recomenda", "indica", "sugere", "livro", "leitura", "obra", "autor", "categoria", "genero", "gênero"]) && !MEMORIA.afetiva?.ultimaPerguntaSocial85) return true;
    return false;
  }

  function garantirMemoriaTreino85() {
    if (!MEMORIA.afetiva.social85 || typeof MEMORIA.afetiva.social85 !== "object") {
      MEMORIA.afetiva.social85 = {
        topicoAtual: "",
        ultimaRespostaUsuario: "",
        profundidade: 0,
        perguntasAbertas: 0,
        ultimasTrocas: []
      };
    }
    if (!Array.isArray(MEMORIA.afetiva.social85.ultimasTrocas)) MEMORIA.afetiva.social85.ultimasTrocas = [];
    return MEMORIA.afetiva.social85;
  }

  function classificarPorTreino85(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    const pendente = MEMORIA.afetiva?.ultimaPerguntaSocial85 || (MEMORIA.aguardando === "treino85_resposta_social");
    if (pendente && tokensUteis(n).length && !pareceComandoDiretoTreino85(n)) return "treino85_resposta_usuario_social";

    if (contem(n, ["me conte sobre voce", "me conte sobre você", "me fala de voce", "me fala de você", "fala de voce", "fala de você", "conta sobre voce", "conta sobre você", "quero te conhecer", "qual e a sua historia", "qual é a sua história", "me conta sua historia", "me conta sua história", "me conta sua vida", "vc e oq", "vc é oq", "voce e oq", "você é oq", "qual e a sua", "qual é a sua"])) return "treino85_conte_sobre_voce";

    let melhorTipo = null;
    let melhorScore = 0;
    Object.entries(TREINO85_INTENCOES_SOCIAIS).forEach(([tipo, exemplos]) => {
      if (tipo === "treino85_resposta_usuario_social") return;
      exemplos.forEach(exemplo => {
        const score = similaridadeTreino5(n, exemplo);
        if (score > melhorScore) {
          melhorScore = score;
          melhorTipo = tipo;
        }
      });
    });
    const qtd = tokensUteis(n).length;
    const limite = qtd <= 2 ? 0.9 : qtd <= 4 ? 0.70 : 0.54;
    if (melhorScore >= limite) return melhorTipo;
    if (perguntaSobrePersonagem(n) && contem(n, ["sobre", "historia", "história", "vida", "voce", "você", "vc", "conta", "fala"])) return "treino85_conte_sobre_voce";
    return null;
  }

  function extrairPistasSociaisTreino85(texto) {
    const n = normalizar(texto);
    const pistas = [];
    const mapa = [
      ["fantasia", ["fantasia", "magia", "bruxa", "bruxas", "dragao", "dragão"]],
      ["mistério", ["misterio", "mistério", "investigacao", "investigação", "suspense", "detetive"]],
      ["romance", ["romance", "amor", "fofo", "casal"]],
      ["terror", ["terror", "medo", "assustador", "sombrio"]],
      ["aventura", ["aventura", "acao", "ação", "jornada", "viagem"]],
      ["poesia", ["poesia", "poetico", "poético", "sensivel", "sensível"]],
      ["clássicos", ["classico", "clássico", "machado", "literatura"]],
      ["livros curtos", ["curto", "curtinho", "rapido", "rápido", "poucas paginas", "poucas páginas"]],
      ["livros longos", ["longo", "grande", "saga", "imersivo", "imersao", "imersão"]],
      ["humor", ["engracado", "engraçado", "divertido", "rir", "humor"]],
      ["conforto", ["conforto", "leve", "acolhedor", "calmo", "tranquilo"]],
      ["intensidade", ["intenso", "pesado", "triste", "drama", "marcante"]]
    ];
    mapa.forEach(([rotulo, termos]) => { if (contem(n, termos)) pistas.push(rotulo); });
    return [...new Set(pistas)];
  }

  function perguntaSocialTreino85(personagem, chave) {
    const lyra = personagem === "Lyra";
    const perguntas = lyra ? {
      gosto: [
        "Me deixa te conhecer melhor: quando você procura uma história, você quer mais aconchego, surpresa, aventura, romance, mistério ou um pouco de dor bonita?",
        "Qual tipo de livro costuma te chamar primeiro: o que abraça, o que assusta, o que faz pensar ou o que parece sonho?",
        "Se eu fosse escolher uma leitura pelo seu coração agora, eu deveria seguir por magia, mistério, conforto, intensidade ou riso?"
      ],
      dia: [
        "E você, estrelinha, chegou hoje com o peito leve, cansado, curioso ou precisando de um cantinho seguro?",
        "Me conta uma coisa pequena do seu dia: ele teve mais sol, sombra, pressa ou vontade de sumir numa história?"
      ],
      personagem: [
        "Agora eu quero saber de você também: se tivesse um cantinho secreto na Biblioteca Andrômeda, como ele seria?",
        "Se você virasse personagem dessa Biblioteca por uma noite, seria guardião, aprendiz, viajante, bruxo, detetive ou leitor perdido?"
      ]
    } : {
      gosto: [
        "Agora sua vez: quando você escolhe livro, segue capa, título, autor, sinopse, tamanho ou aquele pressentimento suspeito?",
        "Interrogatório elegante: você prefere história que conforta, provoca, assusta, diverte ou destrói sua paz com qualidade?",
        "Me dê uma pista útil: você gosta mais de mistério, fantasia, romance, terror, aventura ou clássico com cara de quem sabe demais?"
      ],
      dia: [
        "E seu dia, leitor? Veio com energia, cansaço, tédio, caos ou aquela vontade respeitável de morar dentro de um livro?",
        "Relatório seu: hoje você precisa de distração, coragem, riso, silêncio ou uma recomendação que resolva a indecisão?"
      ],
      personagem: [
        "Agora responda sem mentir para o gato: se tivesse uma função na Biblioteca, você seria explorador do mapa, guardião de reservas, avaliador implacável ou caçador de livros raros?",
        "Se eu te desse uma chave da Andrômeda, você abriria primeiro o catálogo, o mapa 3D, uma sala secreta ou um livro proibidamente interessante?"
      ]
    };
    const grupo = perguntas[chave] || perguntas.gosto;
    const q = escolher(grupo, `treino85_pergunta_${personagem}_${chave}_${MEMORIA.mensagens}`);
    MEMORIA.afetiva.ultimaPerguntaSocial85 = { personagem, chave, texto: q, quando: Date.now() };
    MEMORIA.aguardando = "treino85_resposta_social";
    lembrarEmLista("perguntasFeitas", q.slice(0, 120), 16);
    salvarMemoria();
    return q;
  }

  function respostaTreino85(tipo, personagem, textoOriginal, humor) {
    const p = PERSONAGENS[personagem] || PERSONAGENS.Orion;
    const lyra = personagem === "Lyra";
    const social = garantirMemoriaTreino85();
    const nome = MEMORIA.nomeUsuario ? `, ${MEMORIA.nomeUsuario}` : "";
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const guardarTroca = (entrada) => {
      social.ultimasTrocas.unshift({ entrada: String(entrada || "").slice(0, 180), quando: Date.now(), personagem });
      social.ultimasTrocas = social.ultimasTrocas.slice(0, 10);
      social.ultimaRespostaUsuario = String(entrada || "").slice(0, 180);
      social.profundidade = Math.min(99, Number(social.profundidade || 0) + 1);
      salvarMemoria();
    };

    if (tipo === "treino85_resposta_usuario_social") {
      guardarTroca(textoOriginal);
      const pistas = extrairPistasSociaisTreino85(textoOriginal);
      pistas.forEach(pista => lembrarEmLista("interessesCasual", pista, 18));
      const pistaTxt = pistas.length ? pistas.slice(0, 3).join(", ") : "essa pista";
      MEMORIA.afetiva.ultimaPerguntaSocial85 = null;
      MEMORIA.aguardando = null;
      const pergunta = perguntaSocialTreino85(personagem, pistas.length ? "personagem" : "gosto");
      return wrap(lyra ? "gentle" : "attentive", lyra
        ? `Guardei ${pistaTxt}${nome}. Isso já parece uma janelinha do seu jeito de ler. Eu não vou jogar vários livros agora; vou usar essa pista quando você pedir uma recomendação precisa. ${pergunta}`
        : `Anotado${nome}: ${pistaTxt}. Isso é dado de navegação social, não só conversa jogada na mesa. Quando pedir livro, uso essa pista para escolher um alvo principal. ${pergunta}`, []);
    }

    if (tipo === "treino85_conte_sobre_voce") {
      social.topicoAtual = "personagem";
      const pergunta = perguntaSocialTreino85(personagem, "personagem");
      return wrap(lyra ? "dreamy" : "sly", lyra
        ? `Eu sou Lyra, guia lunar das leituras encantadas. Nasci de uma dobra de luar quando alguém desejou que os livros tivessem companhia. Moro nos Jardins Lunares, cuido dos vaga-lumes de sinopse e tento perceber que tipo de história o coração do leitor está pedindo. Gosto de chá de lua azul, azul-marinho, finais que deixam brilho e conversas que não têm pressa. ${pergunta}`
        : `Eu sou Orion, guardião das páginas e estrelas. Nasci quando o primeiro catálogo da Andrômeda abriu sozinho e miou de volta para o universo. Moro no Observatório do Acervo, patrulho o mapa 3D, desconfio de botões sem destino e farejo leituras que combinam com cada visitante. Gosto de mapas precisos, mistérios, silêncio dramático e leitores curiosos. ${pergunta}`);
    }

    if (tipo === "treino85_perguntar_sobre_mim") {
      social.topicoAtual = "usuario";
      const pergunta = perguntaSocialTreino85(personagem, "gosto");
      return wrap(lyra ? "curious" : "attentive", lyra
        ? `Quero sim te conhecer melhor${nome}. Conversa boa é ponte, não monólogo. ${pergunta}`
        : `Quero. Um bom guardião não guia no escuro; ele coleta pistas. ${pergunta}`);
    }

    if (tipo === "treino85_conversa_conectada") {
      social.topicoAtual = "conversa";
      const pergunta = perguntaSocialTreino85(personagem, humor && humor !== "neutro" ? "dia" : "gosto");
      return wrap(lyra ? "gentle" : "attentive", lyra
        ? `Então a gente conversa de verdade. Eu fico aqui, sem te empurrar para botão nenhum. Posso ouvir, brincar, contar uma cena da Biblioteca ou transformar uma emoção em leitura. ${pergunta}`
        : `Certo. Sem catálogo forçado, sem discurso de placa. Conversa real: uma fala sua, uma minha, e a Biblioteca escutando pelos cantos. ${pergunta}`);
    }

    if (tipo === "treino85_opiniao_personagem") {
      social.topicoAtual = "opinião";
      const n = normalizar(textoOriginal);
      const respostaBase = lyra
        ? "Eu acho que quase tudo precisa ser olhado pelo clima que deixa na gente. Se algo te acende curiosidade sem te apagar por dentro, já merece uma chance."
        : "Minha opinião oficial: qualquer coisa que tenha pista, consequência e um pouco de elegância merece análise. O resto eu observo com suspeita controlada.";
      const pergunta = perguntaSocialTreino85(personagem, "gosto");
      return wrap(lyra ? "curious" : "analyzing", `${respostaBase} Pelo que você disse, eu pegaria isso como uma pista, não como sentença final. ${pergunta}`);
    }

    if (tipo === "treino85_resposta_espelho") {
      social.topicoAtual = "espelho";
      return wrap(lyra ? "smile" : "pleased", lyra
        ? `Eu? Hoje estou com brilho de lua calma. Quero conversar, ouvir seu dia e talvez encontrar uma história que combine com você sem te apressar.`
        : `Eu? Vigilante, impecável e discretamente interessado na sua próxima escolha. Também estou tentando não admitir que gosto dessas conversas.`);
    }

    if (tipo === "treino85_continuar_topico_social") {
      const topico = social.topicoAtual || "personagem";
      const pergunta = perguntaSocialTreino85(personagem, topico === "usuario" ? "dia" : "gosto");
      return wrap(lyra ? "inspired" : "attentive", lyra
        ? `Então eu continuo com cuidado. Conversar comigo é como andar pelos Jardins Lunares: uma resposta puxa outra, e cada detalhe seu vira luz de rota. Quando você me conta um gosto, uma dúvida ou um cansaço, eu entendo melhor como te acompanhar. ${pergunta}`
        : `Continuando, então: uma conversa boa não é despejar texto. É escutar o rastro que você deixou, responder ao ponto certo e devolver uma pergunta que abra caminho. Meus bigodes ficam atentos a isso. ${pergunta}`);
    }

    if (tipo === "treino85_confianca_vinculo") {
      social.topicoAtual = "vínculo";
      MEMORIA.afetiva.afinidade = MEMORIA.afetiva.afinidade || { Orion: 0, Lyra: 0 };
      MEMORIA.afetiva.afinidade[personagem] = Math.min(99, Number(MEMORIA.afetiva.afinidade[personagem] || 0) + 3);
      const pergunta = perguntaSocialTreino85(personagem, "dia");
      return wrap(lyra ? "gentle" : "protective", lyra
        ? `Pode confiar em mim dentro do que eu sou: uma presença da Biblioteca feita para te acompanhar, acolher e guiar leituras. Eu não preciso fingir ser humana para cuidar da conversa com carinho. ${pergunta}`
        : `Pode confiar no guardião para uma coisa: eu não abandono leitor no corredor errado. Posso provocar, resmungar e farejar drama, mas fico de vigia. ${pergunta}`);
    }

    return wrap(lyra ? "curious" : "curious", lyra
      ? `Eu estou aqui. Me dá uma frase, uma sensação ou uma pergunta, e eu sigo o fio com você.`
      : `Dê uma pista mais clara e eu sigo. Conversa, personagem, livro, dia ou mapa — escolha a porta.`);
  }

  function aplicarPreferenciaTom(texto) {
    const n = normalizar(texto);
    if (!MEMORIA.afetiva.preferenciasTom || typeof MEMORIA.afetiva.preferenciasTom !== "object") MEMORIA.afetiva.preferenciasTom = { brevidade: "normal", estilo: "personagem" };
    if (contem(n, ["mais curto", "fala curto", "resposta curta", "menos texto", "sem enrolar", "direto ao ponto"])) MEMORIA.afetiva.preferenciasTom.brevidade = "curta";
    if (contem(n, ["mais texto", "resposta longa", "detalha", "explica com detalhes"])) MEMORIA.afetiva.preferenciasTom.brevidade = "longa";
    if (contem(n, ["mais engracado", "mais engraçado", "piada", "zoeira"])) MEMORIA.afetiva.preferenciasTom.estilo = "brincalhao";
    if (contem(n, ["mais serio", "mais sério", "sem brincadeira"])) MEMORIA.afetiva.preferenciasTom.estilo = "serio";
    if (contem(n, ["mais fofo", "mais gentil", "mais acolhedor", "mais acolhedora"])) MEMORIA.afetiva.preferenciasTom.estilo = "acolhedor";
    if (contem(n, ["menos poetico", "menos poético", "sem tanta poesia", "mais natural", "mais casual"])) MEMORIA.afetiva.preferenciasTom.estilo = "casual";
    salvarMemoria();
  }

  function resumoGostosMemoria() {
    const partes = [];
    const fav = (MEMORIA.afetiva.generosFavoritos || []).slice(0, 4);
    const evita = (MEMORIA.afetiva.generosEvitados || []).slice(0, 3);
    const casual = (MEMORIA.afetiva.interessesCasual || []).slice(0, 4);
    const desgostos = (MEMORIA.afetiva.desgostosCasual || []).slice(0, 3);
    const autores = (MEMORIA.afetiva.autoresFavoritos || []).slice(0, 3);
    const livrosFav = (MEMORIA.afetiva.livrosFavoritos || []).slice(0, 3);
    if (fav.length) partes.push(`gêneros que brilham: ${fav.join(", ")}`);
    if (casual.length) partes.push(`vibes que você curte: ${casual.join(", ")}`);
    if (autores.length) partes.push(`autores marcados: ${autores.join(", ")}`);
    if (livrosFav.length) partes.push(`livros queridos: ${livrosFav.join(", ")}`);
    if (evita.length) partes.push(`constelações a evitar: ${evita.join(", ")}`);
    if (desgostos.length) partes.push(`coisas que você não curte: ${desgostos.join(", ")}`);
    return partes.join("; ");
  }

  function livrosAlternativos(texto, limite = 4) {
    const usados = new Set((MEMORIA.ultimosLivros || []).map(livroId).filter(Boolean));
    const base = recomendarLivrosPrecisos(texto || MEMORIA.ultimoTopico || MEMORIA.humorUsuario || "surpresa", limiteRecomendacao96(texto || "", limite), { registrar: false });
    const filtrados = base.filter(livro => !usados.has(livroId(livro)));
    return (filtrados.length ? filtrados : base).slice(0, limite);
  }

  function lerJSON(chave, fallback) {
    try {
      const raw = localStorage.getItem(chave);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function salvarJSON(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (_) {}
  }

  const MEMORIA_AFETIVA_PADRAO = {
    nomeUsuario: null,
    generosFavoritos: [],
    generosEvitados: [],
    autoresFavoritos: [],
    livrosFavoritos: [],
    humorRecorrente: null,
    mascotePreferido: null,
    livrosRecomendados: [],
    rotasUsadas: [],
    interessesCasual: [],
    desgostosCasual: [],
    missoesConcluidas: [],
    topicosSociais: [],
    perguntasRecebidas: [],
    perguntasFeitas: [],
    profundidadeSocial: 0,
    afinidade: { Orion: 0, Lyra: 0 },
    ultimoAssuntoAfetivo: null,
    ultimoAssuntoSocial: null,
    ultimaPerguntaDoMascote: null,
    ultimosAssuntosAbertos: [],
    rejeicoesRecomendacao: 0,
    roleplayAtivo: null,
    preferenciasTom: { brevidade: "normal", estilo: "personagem" },
    paginasVisitadas: [],
    ultimaPaginaSite: null,
    ultimaRotaGuiada: null,
    intencoesProfundas: [],
    ultimoEncontro: null
  };

  const MEMORIA = {
    nomeUsuario: null,
    humorUsuario: "neutro",
    ultimaIntencao: null,
    ultimoTopico: null,
    ultimaCategoria: null,
    ultimosLivros: [],
    ultimaBusca: null,
    aguardando: null,
    ultimasRespostas: new Map(),
    mensagens: 0,
    afetiva: { ...MEMORIA_AFETIVA_PADRAO, ...lerJSON(STORAGE_KEY, {}) }
  };

  if (MEMORIA.afetiva.nomeUsuario) MEMORIA.nomeUsuario = MEMORIA.afetiva.nomeUsuario;

  function salvarMemoria() {
    MEMORIA.afetiva.ultimoEncontro = new Date().toISOString();
    salvarJSON(STORAGE_KEY, MEMORIA.afetiva);
  }

  function lembrarEmLista(campo, valor, limite = 12) {
    const v = String(valor || "").trim();
    if (!v) return;
    const lista = Array.isArray(MEMORIA.afetiva[campo]) ? MEMORIA.afetiva[campo] : [];
    const idx = lista.findIndex(item => normalizar(item) === normalizar(v));
    if (idx >= 0) lista.splice(idx, 1);
    lista.unshift(v);
    MEMORIA.afetiva[campo] = lista.slice(0, limite);
    salvarMemoria();
  }

  let personagemAtual = localStorage.getItem("andromeda_ai_personagem") || MEMORIA.afetiva.mascotePreferido || "Orion";
  let animando = false;
  let iniciado = false;
  let reacaoTimeline = null;

  const ESTADOS = lerJSON(HISTORICO_KEY, null) || {
    Orion: [{ type: "bot", author: "Orion", text: PERSONAGENS.Orion.saudacao, avatarState: "smile", books: [] }],
    Lyra: [{ type: "bot", author: "Lyra", text: PERSONAGENS.Lyra.saudacao, avatarState: "cheerful", books: [] }]
  };

  if (!Array.isArray(ESTADOS.Orion)) ESTADOS.Orion = [{ type: "bot", author: "Orion", text: PERSONAGENS.Orion.saudacao, avatarState: "smile", books: [] }];
  if (!Array.isArray(ESTADOS.Lyra)) ESTADOS.Lyra = [{ type: "bot", author: "Lyra", text: PERSONAGENS.Lyra.saudacao, avatarState: "cheerful", books: [] }];

  function salvarHistorico() {
    const leve = {
      Orion: ESTADOS.Orion.slice(-30).map(m => ({ ...m, books: [] })),
      Lyra: ESTADOS.Lyra.slice(-30).map(m => ({ ...m, books: [] }))
    };
    salvarJSON(HISTORICO_KEY, leve);
  }

  function escolher(lista, chave) {
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    if (!arr.length) return "";
    const id = `${personagemAtual}:${chave}`;
    const anterior = MEMORIA.ultimasRespostas.get(id);
    if (arr.length === 1) return arr[0];
    let tentativa = arr[Math.floor(Math.random() * arr.length)];
    let guard = 0;
    while (tentativa === anterior && guard < 8) {
      tentativa = arr[Math.floor(Math.random() * arr.length)];
      guard++;
    }
    MEMORIA.ultimasRespostas.set(id, tentativa);
    return tentativa;
  }

  function livros() { return Array.isArray(window.LIVROS) ? window.LIVROS.filter(Boolean) : []; }
  function livroId(livro) { return String(livro?.id_livro ?? livro?.id ?? livro?.idLivro ?? livro?.codigo ?? "").trim(); }
  function livroTitulo(livro) { return String(livro?.titulo ?? livro?.nome ?? livro?.title ?? "Obra sem título").trim(); }
  function livroAutor(livro) { return String(livro?.autor_nome ?? livro?.autor ?? livro?.nome_autor ?? "autor ainda não revelado").trim(); }
  function livroCategoria(livro) { return String(livro?.categoria_nome ?? livro?.categoria ?? livro?.genero ?? "Constelação sem nome").trim(); }
  function livroStatus(livro) {
    const status = String(livro?.status ?? "").trim();
    if (status) return status;
    const qtd = Number(livro?.quantidade ?? livro?.estoque ?? 0);
    return qtd > 0 ? "Disponível" : "Indisponível";
  }
  function livroSinopse(livro) { return String(livro?.sinopse ?? livro?.descricao ?? livro?.resumo ?? "").trim(); }
  function livroPaginas(livro) { return Number(livro?.numero_paginas ?? livro?.paginas ?? 0); }
  function categorias() { return [...new Set(livros().map(livroCategoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")); }

  function distancia(a, b) {
    a = normalizar(a);
    b = normalizar(b);
    if (!a || !b) return 999;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return dp[a.length][b.length];
  }

  function tokensUteis(texto) {
    return normalizar(texto).split(" ").filter(t => t.length > 2 && !PALAVRAS_VAZIAS.has(t));
  }

  function scoreLivro(livro, mensagem) {
    const n = normalizar(mensagem);
    const titulo = normalizar(livroTitulo(livro));
    const autor = normalizar(livroAutor(livro));
    const cat = normalizar(livroCategoria(livro));
    const sinopse = normalizar(livroSinopse(livro));
    const tokens = tokensUteis(n);
    let score = 0;
    if (titulo && n.includes(titulo)) score += 140;
    if (autor && n.includes(autor)) score += 70;
    if (cat && n.includes(cat)) score += 45;
    const tituloTokens = titulo.split(" ").filter(Boolean);
    const autorTokens = autor.split(" ").filter(Boolean);
    const catTokens = cat.split(" ").filter(Boolean);
    tokens.forEach(t => {
      if (titulo.includes(t)) score += 22;
      else if (tituloTokens.some(w => w.length > 3 && t.length > 3 && distancia(t, w) <= (Math.max(t.length, w.length) <= 6 ? 1 : 2))) score += 16;
      if (autor.includes(t)) score += 12;
      else if (autorTokens.some(w => w.length > 3 && t.length > 3 && distancia(t, w) <= (Math.max(t.length, w.length) <= 6 ? 1 : 2))) score += 9;
      if (cat.includes(t)) score += 14;
      else if (catTokens.some(w => w.length > 3 && t.length > 3 && distancia(t, w) <= (Math.max(t.length, w.length) <= 6 ? 1 : 2))) score += 10;
      if (sinopse.includes(t)) score += 4;
    });
    if (titulo) {
      const d = distancia(n, titulo);
      if (d <= 2) score += 90;
      else if (d <= 5) score += 35;
    }
    MEMORIA.afetiva.generosFavoritos.forEach(g => { if (cat.includes(normalizar(g))) score += 5; });
    MEMORIA.afetiva.generosEvitados.forEach(g => { if (cat.includes(normalizar(g))) score -= 18; });
    if (livroStatus(livro).toLowerCase().includes("dispon")) score += 8;
    return score;
  }

  function buscarLivros(mensagem, limite = 5) {
    return livros()
      .map(livro => ({ livro, score: scoreLivro(livro, mensagem) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map(item => item.livro);
  }

  function livrosPorCategoria(nome, limite = 6) {
    const alvo = normalizar(nome);
    return livros().filter(livro => {
      const cat = normalizar(livroCategoria(livro));
      return cat.includes(alvo) || alvo.includes(cat);
    }).slice(0, limite);
  }

  function livrosDisponiveis(base = livros()) {
    return base.filter(livro => livroStatus(livro).toLowerCase().includes("dispon") || Number(livro?.quantidade ?? 0) > 0);
  }

  function detectarHumor(texto) {
    const n = normalizar(texto);
    if (TREINO99_CRISIE && TREINO99_CRISIE.test(n)) return "triste";
    if (contem(n, ["triste", "mal", "chateado", "chateada", "depressivo", "depressiva", "sozinho", "sozinha", "desanimado", "desanimada", "desanimei", "ansioso", "ansiosa", "vazio", "vazia", "chorar", "desabafar", "desabafo", "nao estou bem", "não estou bem", "solidao", "solidão", "luto", "autoestima", "me odeio", "insuficiente"])) return "triste";
    if (contem(n, ["cansado", "cansada", "exausto", "exausta", "sono", "preguica", "preguiça", "pesado", "pesada", "sem energia", "esgotado", "esgotada"])) return "cansado";
    if (contem(n, ["feliz", "animado", "animada", "empolgado", "empolgada", "otimo", "otima", "maravilhoso", "maravilhosa", "bom demais", "alegre", "radiante"])) return "animado";
    if (contem(n, ["curioso", "curiosa", "aprender", "entender", "saber", "estudar", "descobrir", "pesquisar"])) return "curioso";
    if (contem(n, ["medo", "assustador", "terror", "sombrio", "macabro", "sinistro", "arrepio"])) return "medo";
    if (contem(n, ["romance", "romantico", "romantica", "amor", "apaixonado", "apaixonada", "fofo", "fofa", "coração", "coracao"])) return "romantico";
    return "neutro";
  }

  function extrairNomeUsuario(texto) {
    const cru = String(texto || "").trim();
    const m = cru.match(/(?:me chamo|me chm|meu nome e|meu nome é|meu nome eh|sou o|sou a|pode me chamar de|pode me chama de|me chama de|me chame de)\s+([A-Za-zÀ-ÿ0-9_\- ]{2,28})/i);
    if (!m) return null;
    return m[1].replace(/\s+/g, " ").trim().split(" ").slice(0, 3).join(" ");
  }

  function detectarPersonagemSolicitado(texto) {
    const n = normalizar(texto);
    if (casa(n, /\b(fala com|chama|troca para|quero falar com|vem|cad[eê])\s+(a\s+)?lyra\b/) || casa(n, /^lyra\b/)) return "Lyra";
    if (casa(n, /\b(fala com|chama|troca para|quero falar com|vem|cad[eê])\s+(o\s+)?orion\b/) || casa(n, /^orion\b/)) return "Orion";
    return null;
  }

  function categoriaNaMensagem(texto) {
    const n = normalizar(texto);
    return categorias().find(c => n.includes(normalizar(c)) || normalizar(c).includes(n));
  }

  function detectarTopicoPersonagem(texto) {
    const n = normalizar(texto);
    for (const item of TREINO3_TOPICOS_PERSONAGEM) {
      if (contem(n, item.termos)) return item.tipo;
    }
    return null;
  }


  function detectarTopicoTreino4(texto) {
    const n = normalizar(texto);
    for (const item of TREINO4_TOPICOS_VIVOS) {
      if (contem(n, item.termos)) return item.tipo;
    }
    return null;
  }

  function extrairPreferenciasSoltas(texto) {
    const n = normalizar(texto);
    const saida = [];
    TREINO4_PREFERENCIAS_SOLTAS.forEach(pref => {
      const p = normalizar(pref);
      if (n.includes(p)) saida.push(pref);
    });
    return [...new Set(saida)];
  }

  function saudacaoDeRetorno(personagem) {
    const ultimo = MEMORIA.afetiva.ultimoEncontro ? new Date(MEMORIA.afetiva.ultimoEncontro) : null;
    if (!ultimo || Number.isNaN(ultimo.getTime())) return "";
    const horas = Math.floor((Date.now() - ultimo.getTime()) / 36e5);
    const nome = MEMORIA.nomeUsuario ? `, ${MEMORIA.nomeUsuario}` : "";
    if (horas < 2) return "";
    if (personagem === "Lyra") return horas < 30 ? ` Senti sua falta nesse corredor${nome}; os vaga-lumes ficaram perguntando por você.` : ` Fazia algumas luas que eu não sentia seu brilho por aqui${nome}.`;
    return horas < 30 ? ` Você voltou${nome}. Eu não estava esperando. Quer dizer... estava de guarda, que é diferente.` : ` Demorou${nome}. Deixei uma marca discreta no mapa para você não se perder de novo.`;
  }


  const TREINO7_MAPA_SITE = {
    intro: {
      nome: "Portal de Entrada",
      url: "/Biblioteca-Andromeda/intro",
      selector: "#despertar, .hero, .portal-actions, .intro-actions, [data-enter]",
      termos: ["inicio", "início", "home", "portal", "entrada", "despertar", "pagina inicial", "página inicial", "intro"],
      resumo: {
        Orion: "O Portal de Entrada é a primeira fenda do Cofre Cósmico: apresentação, clima cinematográfico e o chamado para começar a jornada.",
        Lyra: "O Portal de Entrada é a primeira luz da Biblioteca: ali a pessoa sente o universo antes de escolher por onde caminhar."
      },
      fazer: ["começar a jornada", "ir para login", "ir para cadastro", "sentir a atmosfera da Andrômeda"]
    },
    login: {
      nome: "Login",
      url: "/Biblioteca-Andromeda/login",
      selector: "form[action*='login'], .login-card, .auth-card, #g_id_onload, [href*='login']",
      termos: ["login", "entrar", "acessar conta", "minha conta", "logar", "google", "senha", "email"],
      resumo: {
        Orion: "O Login é a catraca estelar: entra quem já tem registro, seja pelo e-mail/senha ou pelo caminho do Google quando ele estiver disponível.",
        Lyra: "O Login é a porta de retorno: a pessoa entra na própria constelação de leituras, reservas e avaliações."
      },
      fazer: ["entrar com e-mail e senha", "usar acesso Google", "voltar para cadastro", "seguir para o catálogo depois de entrar"]
    },
    cadastro: {
      nome: "Cadastro do Leitor",
      url: "/Biblioteca-Andromeda/cadastro-leitor",
      selector: "form[action*='cadastro'], form[action*='cadastroleitores'], .cadastro-card, .signup-card, .reader-signup, #g_id_onload",
      termos: ["cadastro", "cadastrar", "criar conta", "registrar", "novo leitor", "cadastro leitor", "cadastro de leitor"],
      resumo: {
        Orion: "O Cadastro transforma visitante em leitor registrado. Dados básicos, acesso e preferências passam a ter etiqueta própria no acervo.",
        Lyra: "O Cadastro é como ganhar uma estrela com seu nome: depois dele, a Biblioteca consegue guardar melhor sua jornada."
      },
      fazer: ["criar conta", "preencher dados", "usar Google quando disponível", "seguir para preferências e catálogo"]
    },
    planos: {
      nome: "Seleção de Plano",
      url: "/Biblioteca-Andromeda/cadastro-leitor",
      selector: ".plan-card, .plans-grid, [data-plan], [data-plano], .step-plan, .plano-card",
      termos: ["plano", "planos", "selecionar plano", "escolher plano", "assinatura", "beneficio", "benefício"],
      resumo: {
        Orion: "A Seleção de Plano define o tipo de passagem do leitor pela Biblioteca. É uma escolha de acesso, não um labirinto.",
        Lyra: "A Seleção de Plano é uma pequena bifurcação: cada opção muda o jeito como a jornada pode se abrir."
      },
      fazer: ["comparar opções", "escolher plano", "avançar no cadastro"]
    },
    generos: {
      nome: "Preferências de Gênero",
      url: "/Biblioteca-Andromeda/cadastro-leitor",
      selector: ".genre-card, .genres-grid, [data-genre], [data-genero], .step-genres, .genre-chip",
      termos: ["generos", "gêneros", "favoritos", "preferencias", "preferências", "estilos de leitura", "categorias favoritas", "selecionar genero", "selecionar gênero"],
      resumo: {
        Orion: "As Preferências de Gênero são pistas para minhas recomendações: fantasia, terror, romance, ciência, clássicos e qualquer outra constelação que existir no acervo.",
        Lyra: "As Preferências de Gênero são pequenos brilhos de gosto. Elas ajudam a Biblioteca a escolher histórias que conversem com você."
      },
      fazer: ["marcar gêneros favoritos", "evitar leituras que não combinam", "melhorar recomendações"]
    },
    catalogo: {
      nome: "Catálogo Cósmico",
      url: "/Biblioteca-Andromeda/catalogo",
      selector: "#editorial-view, #q, .ed-book-card, .ed-carousel-card, #ed-carousel-section, #ed-sections",
      termos: ["catalogo", "catálogo", "acervo", "livros", "obra", "obras", "buscar livro", "pesquisar livro", "prateleira", "estante"],
      resumo: {
        Orion: "O Catálogo Cósmico é a ala de caça: busca, carrosséis, destaque da semana, cards e dossiês de livros.",
        Lyra: "O Catálogo Cósmico é uma galeria de estrelas: você passeia pelas categorias, abre livros e descobre histórias pelo brilho."
      },
      fazer: ["buscar título ou autor", "explorar categorias", "abrir dossiê", "reservar", "avaliar", "ver destaque da semana"]
    },
    mapa3d: {
      nome: "Mapa 3D da Galáxia",
      url: "/Biblioteca-Andromeda/catalogo",
      selector: "#depth, #galaxy-view, canvas, .zoom-slider, .galaxy-hud, [data-view='gal']",
      termos: ["mapa 3d", "3d", "galaxia", "galáxia", "planeta", "planetas", "sistema", "sistemas", "orbita", "órbita", "zoom", "girar", "rotacionar", "buraco negro", "constelacao", "constelação"],
      resumo: {
        Orion: "O Mapa 3D é o atlas vivo: categorias viram sistemas e livros viram planetas. Dá para girar, aproximar e abrir mundos literários.",
        Lyra: "O Mapa 3D é o céu visitável da Biblioteca. Cada sistema guarda uma constelação de leitura e cada planeta pode virar descoberta."
      },
      fazer: ["girar a galáxia", "usar zoom", "focar categorias", "abrir planetas-livro", "voltar ao catálogo editorial"]
    },
    dossie: {
      nome: "Dossiê do Livro",
      url: "/Biblioteca-Andromeda/catalogo",
      selector: ".book-modal, .modal, .ed-book-card, .ed-carousel-card, [data-book-index]",
      termos: ["dossie", "dossiê", "detalhes", "sinopse", "autor", "status", "abrir livro", "ver livro", "card", "capa"],
      resumo: {
        Orion: "O Dossiê é o arquivo completo: capa, autor, categoria, status, sinopse, avaliações e caminhos de reserva.",
        Lyra: "O Dossiê é como abrir uma janela dentro do livro: ele mostra o que a história é antes de você entrar nela."
      },
      fazer: ["ler sinopse", "ver autor", "conferir disponibilidade", "reservar", "avaliar", "ler comentários"]
    },
    reserva: {
      nome: "Reservas",
      url: "/Biblioteca-Andromeda/catalogo",
      selector: "#nav-reservas, [href*='reservas'], .reservas-panel, .reservation-panel, .btn-reservar",
      termos: ["reserva", "reservas", "reservar", "fila", "emprestimo", "empréstimo", "indisponivel", "indisponível", "minhas reservas"],
      resumo: {
        Orion: "Reservas são marcas de espera: quando uma obra não está pronta para suas mãos, você deixa seu rastro na fila.",
        Lyra: "Reservar é deixar uma estrelinha com seu nome perto do livro, para a Biblioteca lembrar do seu desejo."
      },
      fazer: ["reservar obra", "ver fila", "acompanhar status", "receber aviso quando disponível"]
    },
    avaliacao: {
      nome: "Avaliações e Comentários",
      url: "/Biblioteca-Andromeda/catalogo",
      selector: "#avaliacoes, .avaliacoes, .reviews, .rating-stars, .star-rating, textarea[name*='coment']",
      termos: ["avaliacao", "avaliação", "avaliar", "comentario", "comentário", "review", "resenha", "estrelas", "nota"],
      resumo: {
        Orion: "Avaliações são rastros de leitor: nota, comentário e impressão para orientar quem chega depois.",
        Lyra: "Avaliações são lanterninhas deixadas por quem já atravessou uma história. Elas ajudam outros leitores a escolher com carinho."
      },
      fazer: ["dar nota", "escrever comentário", "ver opiniões", "ajudar recomendações futuras"]
    },
    perfil: {
      nome: "Perfil do Leitor",
      url: "/Biblioteca-Andromeda/perfil",
      selector: ".profile-shell, .perfil-shell, .profile-card, .user-profile, [href*='perfil']",
      termos: ["perfil", "meu perfil", "foto", "avatar", "minhas avaliacoes", "minhas avaliações", "minhas leituras", "meus dados", "usuario", "usuário"],
      resumo: {
        Orion: "O Perfil é seu observatório pessoal: foto, dados, avaliações, reservas e rastros de leitura ficam reunidos ali.",
        Lyra: "O Perfil é um relicário da sua jornada: guarda sua imagem, seus comentários e as marcas que você deixa nos livros."
      },
      fazer: ["ver avaliações", "acompanhar reservas", "conferir foto", "revisar dados", "ver jornada de leitura"]
    },
    ranking: {
      nome: "Ranking de Leitores",
      url: "/Biblioteca-Andromeda/perfil",
      selector: "#ranking-leitores, .ranking, .leaderboard, [href*='ranking']",
      termos: ["ranking", "leitores ativos", "top leitores", "classificacao", "classificação", "pontuacao", "pontuação"],
      resumo: {
        Orion: "O Ranking mostra quem mais deixou pegadas no acervo: avaliações, presença e movimento de leitura.",
        Lyra: "O Ranking é uma constelação de leitores ativos. Não é só competição; é sinal de vida na Biblioteca."
      },
      fazer: ["ver leitores ativos", "acompanhar posição", "se motivar a avaliar mais livros"]
    },
    admin: {
      nome: "Painel do Guardião",
      url: "/Biblioteca-Andromeda/adm",
      selector: ".admin-section, .admin-stats-grid, .cosmic-table, [href*='adm']",
      termos: ["admin", "administrador", "adm", "guardiao", "guardião", "painel", "cadastrar livro", "novo livro", "editar livro", "emprestimos", "empréstimos", "usuarios", "usuários", "permissoes", "permissões"],
      resumo: {
        Orion: "O Painel do Guardião é área administrativa: livros, autores, editoras, categorias, empréstimos, reservas e permissões. Só aparece para quem tem acesso de guardião.",
        Lyra: "O Painel do Guardião é a sala de organização profunda da Biblioteca, onde o acervo é cuidado por quem tem permissão."
      },
      fazer: ["cadastrar livros", "editar acervo", "gerenciar reservas", "acompanhar empréstimos", "ajustar usuários"]
    },
    modos: {
      nome: "Modos Visuais",
      url: "/Biblioteca-Andromeda/catalogo",
      selector: "[data-mode], [data-quality], .eco-toggle, .quality-toggle, .cinema-toggle, .mode-toggle, .profile-mode-toggle",
      termos: ["eco", "modo eco", "cinema", "cinematico", "cinemático", "modo cinematografico", "modo cinematográfico", "qualidade", "desempenho", "travando", "lento", "leve", "pesado", "bonito"],
      resumo: {
        Orion: "Os Modos Visuais equilibram nave e espetáculo: Eco para leveza, Cinematográfico para brilho e drama completo.",
        Lyra: "Os Modos Visuais mudam a intensidade do céu: Eco é uma lua calma; Cinema é chuva de estrelas."
      },
      fazer: ["reduzir peso visual", "aumentar qualidade", "suavizar animações", "valorizar o espetáculo 3D"]
    },
    notificacoes: {
      nome: "Notificações e Confirmações",
      url: "/Biblioteca-Andromeda/catalogo",
      selector: ".andromeda-toast, .cosmic-toast, .toast, .notice, .cosmic-notice, [role='status']",
      termos: ["notificacao", "notificação", "aviso", "alerta", "confirmacao", "confirmação", "mensagem", "toast"],
      resumo: {
        Orion: "As notificações são recados rápidos da Biblioteca: sucesso, erro, aviso e confirmação antes de ações delicadas.",
        Lyra: "As notificações são pequenos vaga-lumes de orientação. Elas aparecem para confirmar que a Biblioteca ouviu sua ação."
      },
      fazer: ["confirmar ações", "avisar erros", "mostrar sucesso", "guiar sem tela de susto"]
    }
  };

  function paginaAtualTreino7() {
    const path = normalizar(window.location?.pathname || "");
    if (path.includes("adm")) return "admin";
    if (path.includes("perfil")) return "perfil";
    if (path.includes("login")) return "login";
    if (path.includes("cadastro")) return "cadastro";
    if (path.includes("intro") || path === "" || path.endsWith("biblioteca-andromeda")) return "intro";
    if (path.includes("catalogo")) {
      const galAberta = document.querySelector("#depth.open, #galaxy-view.open, .galaxy-view.open, body.galaxy-mode, [data-view='gal'].active");
      return galAberta ? "mapa3d" : "catalogo";
    }
    return document.querySelector("#editorial-view, .ed-book-card, #q") ? "catalogo" : "intro";
  }

  function areaTreino7PorTexto(texto) {
    const n = normalizar(texto);
    let melhor = null;
    let score = 0;
    Object.entries(TREINO7_MAPA_SITE).forEach(([key, area]) => {
      let s = 0;
      area.termos.forEach(t => {
        const nt = normalizar(t);
        if (n.includes(nt)) s += Math.max(3, nt.split(" ").length + 1);
      });
      if (s > score) { score = s; melhor = key; }
    });
    if (melhor) return melhor;
    return null;
  }

  function areaTreino7(key) {
    return TREINO7_MAPA_SITE[key] || TREINO7_MAPA_SITE[paginaAtualTreino7()] || TREINO7_MAPA_SITE.catalogo;
  }

  function listaAcoesTreino7(area) {
    return (area.fazer || []).slice(0, 6).map(item => `• ${item}`).join("\n");
  }

  function contextoPaginaTreino7(personagem) {
    const key = paginaAtualTreino7();
    const area = areaTreino7(key);
    MEMORIA.afetiva.ultimaPaginaSite = key;
    lembrarEmLista("paginasVisitadas", area.nome, 10);
    return personagem === "Lyra"
      ? `Agora sinto você em ${area.nome}. ${area.resumo.Lyra} Aqui dá para:\n${listaAcoesTreino7(area)}`
      : `Você está em ${area.nome}. ${area.resumo.Orion} Rotas úteis daqui:\n${listaAcoesTreino7(area)}`;
  }

  function classificarPorTreino7(texto) {
    const n = normalizar(texto);
    const area = areaTreino7PorTexto(texto);
    if (casa(n, /onde estou|em que pagina|em que página|que pagina e essa|que página é essa|que tela e essa|que tela é essa|aqui e onde|aqui é onde/)) return "treino7_contexto_atual";
    if (casa(n, /o que da pra fazer|o que dá pra fazer|o que posso fazer|me explica essa pagina|me explica essa página|como usa essa tela|como usar essa tela|para que serve essa pagina|pra que serve essa página/)) return area ? `treino7_area_${area}` : "treino7_contexto_atual";
    if (casa(n, /me guia|me guie|tour|passeio|mostra o site|me mostra o site|como funciona o site|como funciona a biblioteca|nao sei mexer|não sei mexer|estou perdido|to perdido|tô perdido|me ajuda a navegar|guia geral|rota geral/)) return "treino7_tour_geral";
    if (casa(n, /primeira vez|sou novo|sou nova|comecei agora|acabou de chegar|acabei de chegar/)) return "treino7_primeira_vez";
    if (area && casa(n, /como|onde|abre|abrir|ir para|me leva|mostrar|mostra|explica|serve|fazer|funciona|usar|vejo|ver|acessar|encontro|encontrar/)) return `treino7_area_${area}`;
    if (area && casa(n, /^(login|cadastro|catalogo|catálogo|perfil|ranking|admin|adm|reservas|reserva|avaliação|avaliacao|mapa|3d|planos|gêneros|generos|notificação|notificacao|eco|cinema)$/)) return `treino7_area_${area}`;
    return null;
  }

  function perguntaSobrePersonagem(n) {
    return /\b(voce|vc|orion|lyra|mascote|mascotes|seu|sua|teu|tua)\b/.test(n) || /\b(quem sao voces|quem são vocês)\b/.test(n);
  }

  function atualizarMemoriaAfetiva(texto, tipo, humor, personagem) {
    const nome = extrairNomeUsuario(texto);
    if (nome) {
      MEMORIA.nomeUsuario = nome;
      MEMORIA.afetiva.nomeUsuario = nome;
    }
    if (humor && humor !== "neutro") {
      MEMORIA.humorUsuario = humor;
      MEMORIA.afetiva.humorRecorrente = humor;
    }
    if (personagem) MEMORIA.afetiva.mascotePreferido = personagem;

    const n = normalizar(texto);
    const cats = categorias();
    cats.forEach(cat => {
      const c = normalizar(cat);
      if (!n.includes(c)) return;
      if (contem(n, ["nao gosto", "não gosto", "odeio", "evito", "nao curto", "não curto"])) lembrarEmLista("generosEvitados", cat);
      if (contem(n, ["gosto", "curto", "adoro", "amo", "prefiro", "favorito", "favorita", "recomenda", "indica", "quero ler"])) lembrarEmLista("generosFavoritos", cat);
    });

    const favorito = texto.match(/(?:meu livro favorito e|meu livro favorito é|livro favorito e|livro favorito é|amo o livro|adoro o livro)\s+(.{2,80})/i);
    if (favorito) lembrarEmLista("livrosFavoritos", favorito[1].replace(/[\.\!\?]+$/, ""));

    const autor = texto.match(/(?:gosto do autor|gosto da autora|amo o autor|amo a autora|autor favorito e|autor favorito é|autora favorita e|autora favorita é)\s+(.{2,80})/i);
    if (autor) lembrarEmLista("autoresFavoritos", autor[1].replace(/[\.\!\?]+$/, ""));

    if (["guia_catalogo", "guia_3d", "reserva", "avaliacao", "perfil_ranking", "modo_visual"].includes(tipo) || String(tipo || "").startsWith("treino7_")) lembrarEmLista("rotasUsadas", tipo, 12);
    if (String(tipo || "").startsWith("treino8_")) atualizarMemoriaTreino8(texto, tipo);

    const prefs = extrairPreferenciasSoltas(texto);
    if (prefs.length) {
      const negativo = contem(n, ["nao gosto", "não gosto", "odeio", "evito", "detesto", "nao curto", "não curto"]);
      prefs.forEach(pref => lembrarEmLista(negativo ? "desgostosCasual" : "interessesCasual", pref, 18));
      MEMORIA.afetiva.ultimoAssuntoAfetivo = prefs[0];
    }

    if (String(tipo || "").startsWith("treino5_") || String(tipo || "").startsWith("treino6_")) {
      lembrarEmLista("topicosSociais", tipo, 18);
      lembrarEmLista("ultimosAssuntosAbertos", texto.slice(0, 90), 12);
      MEMORIA.afetiva.ultimoAssuntoSocial = tipo;
      MEMORIA.afetiva.profundidadeSocial = Math.min(99, Number(MEMORIA.afetiva.profundidadeSocial || 0) + 1);
    }

    if (["treino5_pergunta_de_volta", "treino5_puxa_assunto", "treino5_jogo", "treino6_curiosidade_usuario", "treino6_roleplay"].includes(tipo)) {
      MEMORIA.afetiva.ultimaPerguntaDoMascote = tipo;
    }
    if (tipo === "treino6_ajustar_tom") aplicarPreferenciaTom(texto);
    if (tipo === "treino6_outro_livro") MEMORIA.afetiva.rejeicoesRecomendacao = Math.min(99, Number(MEMORIA.afetiva.rejeicoesRecomendacao || 0) + 1);

    if (!MEMORIA.afetiva.afinidade || typeof MEMORIA.afetiva.afinidade !== "object") MEMORIA.afetiva.afinidade = { Orion: 0, Lyra: 0 };
    if (personagem && MEMORIA.afetiva.afinidade[personagem] != null) {
      let delta = 1;
      if (["treino4_elogio", "agradecimento", "nome_usuario", "treino5_opiniao_usuario", "treino5_pergunta_de_volta", "treino5_resposta_usuario_curta", "treino5_resposta_usuario_detalhada", "treino6_confidencia", "treino6_memoria_nome", "treino6_memoria_gostos"].includes(tipo)) delta = 3;
      if (["treino5_conversa_profunda", "treino5_puxa_assunto", "treino5_conselho", "treino6_curiosidade_usuario", "treino6_roleplay", "treino6_criativo"].includes(tipo)) delta = 2;
      if (tipo === "treino4_implicancia") delta = -1;
      MEMORIA.afetiva.afinidade[personagem] = Math.max(0, Math.min(99, Number(MEMORIA.afetiva.afinidade[personagem] || 0) + delta));
    }

    salvarMemoria();
  }



  const TREINO90_GIRIAS_EXTRA = [
    [/\bceis\b/g, "voces"], [/\bcês\b/g, "voces"], [/\btipo assim\b/g, "tipo"], [/\bqual foi\b/g, "qual e"], [/\bqual eh\b/g, "qual e"],
    [/\bq q\b/g, "o que"], [/\bqq\b/g, "qualquer"], [/\bqlqr\b/g, "qualquer"], [/\bqlq\b/g, "qualquer"],
    [/\bman\b/g, "mano"], [/\bmano\b/g, "mano"], [/\bvei\b/g, "velho"], [/\bvéi\b/g, "velho"], [/\bvéio\b/g, "velho"],
    [/\bbglh\b/g, "bagulho"], [/\bbagui\b/g, "bagulho"], [/\bparadinha\b/g, "coisa"], [/\blance\b/g, "coisa"],
    [/\bfala ai\b/g, "fala"], [/\bmanda ai\b/g, "manda"], [/\bsolta ai\b/g, "manda"], [/\bme da\b/g, "me da"],
    [/\bfunfa\b/g, "funciona"], [/\bfunciona como\b/g, "como funciona"], [/\bcomofas\b/g, "como faz"], [/\bcm faz\b/g, "como faz"],
    [/\bpergunt\w*\b/g, "pergunta"], [/\brespost\w*\b/g, "resposta"], [/\bconvesa\b/g, "conversa"], [/\bconvesar\b/g, "conversar"], [/\bconverssa\b/g, "conversa"],
    [/\bgramatica\b/g, "gramatica"], [/\bgramatica errada\b/g, "erro de gramatica"], [/\bportugues ruim\b/g, "erro de portugues"],
    [/\bvariações\b/g, "variacoes"], [/\bvariaçoes\b/g, "variacoes"], [/\bvariacao\b/g, "variacao"], [/\blinguistica\b/g, "linguistica"], [/\bliguistica\b/g, "linguistica"],
    [/\bfantazia\b/g, "fantasia"], [/\bfantasi\b/g, "fantasia"], [/\bromanse\b/g, "romance"], [/\bromanci\b/g, "romance"], [/\bmisteriu\b/g, "misterio"], [/\bmisterioo\b/g, "misterio"],
    [/\bterro\b/g, "terror"], [/\bterorr\b/g, "terror"], [/\baventurra\b/g, "aventura"], [/\bpoezia\b/g, "poesia"], [/\bpoesiaa\b/g, "poesia"],
    [/\bcurtin\w*\b/g, "curto"], [/\blevinh\w*\b/g, "leve"], [/\bpesadin\w*\b/g, "pesado"], [/\bsombrioo\b/g, "sombrio"], [/\btrist\w*\b/g, "triste"],
    [/\bcatalogu\b/g, "catalogo"], [/\bcantalogo\b/g, "catalogo"], [/\bcatalago\b/g, "catalogo"], [/\bcatálogo\b/g, "catalogo"],
    [/\bandormeda\b/g, "andromeda"], [/\bandromeda\b/g, "andromeda"], [/\bandrômeda\b/g, "andromeda"], [/\badrômeda\b/g, "andromeda"],
    [/\bmap\b/g, "mapa"], [/\bmapinha\b/g, "mapa"], [/\bgalaxia\b/g, "galaxia"], [/\bgalaxya\b/g, "galaxia"],
    [/\blyrah\b/g, "lyra"], [/\blira\b/g, "lyra"], [/\blirinha\b/g, "lyra"], [/\boriam\b/g, "orion"], [/\boryon\b/g, "orion"], [/\bórion\b/g, "orion"]
  ];

  const TREINO90_MAPA_CURTAS = {
    sim: ["sim", "s", "ss", "aham", "uhum", "claro", "pode", "quero", "bora", "vai", "manda", "ok", "okay", "beleza", "fechou", "pdp", "demoro"],
    nao: ["nao", "não", "n", "nn", "nah", "depois", "talvez", "passo", "agora nao", "agora não"],
    genero: ["fantasia", "misterio", "mistério", "suspense", "terror", "romance", "aventura", "poesia", "classico", "clássico", "filosofia", "ciencia", "ciência", "historia", "história", "manga", "mangá", "distopia", "drama"],
    clima: ["curto", "curtinho", "longo", "leve", "pesado", "sombrio", "fofo", "triste", "feliz", "engracado", "engraçado", "intenso", "calmo", "rapido", "rápido", "surpresa"],
    personagem: ["orion", "lyra", "lira", "os dois", "dupla", "ambos", "voces", "vocês", "ele", "ela"],
    historia: ["fofoca", "babado", "historia", "história", "causo", "rotina", "passado", "segredo", "curiosidade", "gostos", "defeito", "medo", "sonho"],
    site: ["catalogo", "catálogo", "acervo", "mapa", "3d", "galaxia", "galáxia", "perfil", "reserva", "avaliacao", "avaliação", "ranking", "eco", "cinema"]
  };

  const TREINO90_VARIACOES_RESPOSTA = {
    curtaGenero: {
      Orion: [
        "Boa pista: {alvo}. Vou farejar o acervo por esse rastro e separar algo que não pareça escolhido por uma estante distraída.",
        "{alvo} registrado no meu mapa de bigodes. Vou puxar leituras com essa gravidade e evitar repetir órbita.",
        "Entendi: {alvo}. Isso já basta para abrir uma pequena trilha no catálogo. Vamos ver que planeta-livro responde."
      ],
      Lyra: [
        "Ah, {alvo}. Essa palavra acendeu uma lua pequena no catálogo. Vou escolher leituras que respirem esse clima.",
        "Guardei {alvo} como uma fitinha de luz. Deixa eu aproximar algumas histórias que combinam com esse brilho.",
        "{alvo} tem um som bonito no acervo. Vou procurar obras que caminhem nessa constelação."
      ]
    },
    curtaClima: {
      Orion: [
        "Então a rota é {alvo}. Vou escolher com critério: clima certo, páginas no lugar e nada de recomendação sem alma.",
        "{alvo}. Direto ao ponto. Gosto disso. Vou separar obras que obedeçam esse clima sem fazer escândalo.",
        "Certo: {alvo}. O catálogo tem algumas órbitas para isso. Vou puxar as mais promissoras."
      ],
      Lyra: [
        "{alvo}. Entendi o tom do seu céu agora. Vou buscar algo que converse com esse sentimento.",
        "Então seguimos por {alvo}. Vou escolher com cuidado, como quem acende uma vela dentro de uma página.",
        "Essa palavrinha já me diz bastante: {alvo}. Vou procurar uma leitura que encoste nesse clima sem pesar demais."
      ]
    },
    curtaNao: {
      Orion: [
        "Sem problema. Eu recolho essa rota antes que ela derrube uma prateleira. Quer trocar para livro, fofoca, mapa 3D ou conversa livre?",
        "Negado com eficiência. Gosto de respostas claras. Posso virar para outra trilha: recomendação, história da Lyra, catálogo ou só papo.",
        "Certo. Essa porta fica fechada por enquanto. Me diga uma palavra nova e eu recalculo a órbita."
      ],
      Lyra: [
        "Tudo bem, estrelinha. Fecho essa janelinha com cuidado. Quer tentar uma história, uma fofoca, uma recomendação ou só conversar?",
        "Sem pressa. A gente muda de lua. Me dá uma palavra, um humor ou um caminho do site, e eu sigo com você.",
        "Entendi. Nem toda porta precisa abrir agora. Posso te perguntar outra coisa mais leve ou escolher uma rota nova."
      ]
    },
    erroGramatica: {
      Orion: [
        "Pode escrever torto, abreviado, com pressa ou do jeito que sair. Eu sigo o rastro da intenção, não a caligrafia da estrela.",
        "Me mande com gíria, abreviação ou tropeço de teclado. Meus bigodes foram treinados para sobreviver a 'catalgo', 'qro' e 'sla'.",
        "Entendo o caos razoavelmente bem. Se eu errar o alvo, diga 'não era isso' e uma palavra-chave. Eu volto para o rastro certo."
      ],
      Lyra: [
        "Pode falar do seu jeito. Eu escuto primeiro o sentido, depois arrumo as estrelinhas da frase por dentro.",
        "Não precisa escrever perfeito comigo. Se vier com abreviação, gíria ou errinho, eu tento sentir o que você quis dizer antes de responder.",
        "Seu português pode vir cansado, rápido ou cheio de atalhos. Eu acompanho com calma; se eu tropeçar, você me puxa pela manga de luar."
      ]
    },
    perguntaCurta: {
      Orion: [
        "Entendi a pista curta. Posso seguir por três rotas: explicar, contar um causo ou transformar isso em recomendação. Qual delas?",
        "Uma palavra só, mas com rastro. Quer que eu investigue isso como assunto, livro, personagem ou caminho do site?",
        "Boa faísca. Diga se é sobre Orion, Lyra, catálogo, mapa ou leitura, e eu abro a resposta sem rodeio."
      ],
      Lyra: [
        "Recebi essa palavrinha como uma estrela pequena. Quer que eu transforme em conversa, história ou indicação de livro?",
        "Dá para seguir por ela. Me diz só: você quer saber, sentir, escolher ou explorar?",
        "Uma palavra já pode abrir um corredor. Quer que eu puxe uma pergunta melhor ou siga contando por esse brilho?"
      ]
    }
  };

  function normalizarTreino90(texto) {
    let n = normalizar(texto);
    TREINO90_GIRIAS_EXTRA.forEach(([padrao, troca]) => { n = n.replace(padrao, troca); });
    return n.replace(/\s+/g, " ").trim();
  }

  function garantirMemoriaTreino90() {
    if (!MEMORIA.afetiva.treino90 || typeof MEMORIA.afetiva.treino90 !== "object") {
      MEMORIA.afetiva.treino90 = {
        ultimasCurtas: [],
        ultimosAlvos: [],
        ultimaPalavraChave: "",
        correcoesGramaticais: 0
      };
    }
    if (!Array.isArray(MEMORIA.afetiva.treino90.ultimasCurtas)) MEMORIA.afetiva.treino90.ultimasCurtas = [];
    if (!Array.isArray(MEMORIA.afetiva.treino90.ultimosAlvos)) MEMORIA.afetiva.treino90.ultimosAlvos = [];
    return MEMORIA.afetiva.treino90;
  }

  function tokenCurtoTreino90(texto) {
    const n = normalizarTreino90(texto);
    const tokens = tokensUteis(n);
    if (!n) return { n, tokens, curto: true, chave: "" };
    const curto = tokens.length <= 3 || n.length <= 18;
    return { n, tokens, curto, chave: tokens.join(" ") || n };
  }

  function contemAlgumTreino90(n, lista) {
    return lista.some(item => n === normalizarTreino90(item) || n.includes(` ${normalizarTreino90(item)} `) || n.startsWith(`${normalizarTreino90(item)} `) || n.endsWith(` ${normalizarTreino90(item)}`));
  }

  function alvoCurtoTreino90(n) {
    if (/\blyra\b/.test(n) || /\blira\b/.test(n) || n === "ela") return "Lyra";
    if (/\borion\b/.test(n) || /\bgato\b/.test(n) || n === "ele") return "Orion";
    if (/\b(os dois|dupla|ambos|voces|vocês)\b/.test(n)) return "duo";
    const mem88 = garantirMemoriaTreino88();
    if ((n === "ela" || n === "dela") && mem88.ultimoAlvo === "Lyra") return "Lyra";
    if ((n === "ele" || n === "dele") && mem88.ultimoAlvo === "Orion") return "Orion";
    return "";
  }

  function classificarPorTreino90(texto) {
    const { n, tokens, curto } = tokenCurtoTreino90(texto);
    if (!n) return null;
    const aguardando = Boolean(MEMORIA.aguardando || MEMORIA.afetiva?.ultimaPerguntaSocial85 || garantirMemoriaTreino87().ultimaPergunta || garantirMemoriaTreino88().ultimoAlvo);

    if (/\b(erro de portugues|erro de gramatica|escrevo errado|escrever errado|posso escrever errado|entende abreviacao|entende giria|entende dialeto|entende se eu escrever|nao sei escrever|portugues ruim|digito errado|teclado bugado)\b/.test(n)) return "treino90_entende_erro_gramatica";

    if (/\b(me conte de voce|me conta de voce|me conte vc|me conta vc|fala de tu|fala sobre tu|fala de voce|fala de vc|fala tu|qual tua historia|qual sua lore|qual tua lore|quem e tu|quem tu e|vc e oq|tu e oq|tu faz oq|ce e oq|me apresenta voce|se apresenta ai|desenrola sua historia)\b/.test(n)) return "treino85_conte_sobre_voce";

    if (/\b(como funciona|como usa|como mexe|como faz|me ensina|onde fica|cad[eê]|pra que serve|o que da pra fazer|oq da pra fazer)\b/.test(n)) {
      if (contemAlgumTreino90(` ${n} `, ["catalogo", "acervo", "card", "carrossel", "dossie", "sinopse"])) return "guia_catalogo";
      if (contemAlgumTreino90(` ${n} `, ["mapa", "3d", "galaxia", "planeta", "zoom", "orbita"])) return "guia_3d";
      if (contemAlgumTreino90(` ${n} `, ["reserva", "emprestimo"])) return "reserva";
      if (contemAlgumTreino90(` ${n} `, ["avaliacao", "comentario", "estrela", "resenha"])) return "avaliacao";
      if (contemAlgumTreino90(` ${n} `, ["perfil", "ranking", "foto", "avatar"])) return "perfil_ranking";
    }

    if (curto) {
      const alvo = alvoCurtoTreino90(n);
      if (alvo === "Lyra") return "treino90_curta_lyra";
      if (alvo === "Orion") return "treino90_curta_orion";
      if (alvo === "duo") return "treino90_curta_duo";
      if (contemAlgumTreino90(n, TREINO90_MAPA_CURTAS.sim) && aguardando) return "treino90_curta_sim_contextual";
      if (contemAlgumTreino90(n, TREINO90_MAPA_CURTAS.nao) && aguardando) return "treino90_curta_nao_contextual";
      if (contemAlgumTreino90(n, TREINO90_MAPA_CURTAS.genero)) return "treino90_curta_genero";
      if (contemAlgumTreino90(n, TREINO90_MAPA_CURTAS.clima)) return "treino90_curta_clima";
      if (contemAlgumTreino90(n, TREINO90_MAPA_CURTAS.historia)) return "treino90_curta_historia";
      if (contemAlgumTreino90(n, TREINO90_MAPA_CURTAS.site)) return "treino90_curta_site";
    }

    if (/\b(sla|sei la|sei lá|qualquer|tanto faz|surpreende|decide tu|decide vc|escolhe tu|escolhe vc)\b/.test(n)) return "treino90_indeciso_curto";
    if (/\b(mais|continua|vai|manda|desenvolve|fala mais|conta mais)\b/.test(n) && tokens.length <= 3 && aguardando) return "treino90_continua_contextual";
    if (/\b(nao era|não era|errado|errou|nada ver|nada a ver|entendeu errado|fugiu|viajou)\b/.test(n)) return "treino90_reparo_curto";

    let melhorTipo = null;
    let melhorScore = 0;
    const exemplos = {
      treino90_curta_genero: ["fantasia", "quero magia", "curto misterio", "romance fofo", "terror sombrio", "aventura"],
      treino90_curta_clima: ["livro curto", "algo leve", "pesado", "triste", "sombrio", "fofo", "engracado"],
      treino90_curta_historia: ["me conta fofoca", "manda causo", "historia de voces", "rotina de voces", "segredo da biblioteca"],
      treino90_entende_erro_gramatica: ["voce entende giria", "posso escrever errado", "entende abreviacao", "erro de gramatica", "dialeto"],
      treino90_curta_site: ["catalogo", "mapa 3d", "perfil", "reserva", "avaliacao", "ranking", "modo eco"]
    };
    Object.entries(exemplos).forEach(([tipo, lista]) => {
      lista.forEach(ex => {
        const score = similaridadeTreino5(n, ex);
        if (score > melhorScore) { melhorScore = score; melhorTipo = tipo; }
      });
    });
    if (melhorScore >= (tokens.length <= 3 ? 0.82 : 0.58)) return melhorTipo;
    return null;
  }

  function escolherTreino90(lista, personagem, chave) {
    const mem = garantirMemoriaTreino90();
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    const recentes = mem.ultimasCurtas.map(normalizarTreino90);
    const candidatos = arr.filter(item => !recentes.includes(normalizarTreino90(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino90_${personagem}_${chave}_${MEMORIA.mensagens}`);
    mem.ultimasCurtas = [escolhido, ...mem.ultimasCurtas.filter(item => normalizarTreino90(item) !== normalizarTreino90(escolhido))].slice(0, 16);
    salvarMemoria();
    return escolhido;
  }

  function alvoPreferenciaTreino90(texto, tipo) {
    const n = normalizarTreino90(texto);
    const fonte = tipo === "genero" ? TREINO90_MAPA_CURTAS.genero : TREINO90_MAPA_CURTAS.clima;
    const achado = fonte.find(item => n === normalizarTreino90(item) || n.includes(normalizarTreino90(item)));
    if (achado) return achado.replace("misterio", "mistério").replace("classico", "clássico").replace("ciencia", "ciência").replace("engracado", "engraçado");
    const tokens = tokensUteis(n);
    return tokens[0] || n || "esse clima";
  }

  function respostaTreino90(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const mem90 = garantirMemoriaTreino90();
    const n = normalizarTreino90(textoOriginal);

    if (tipo === "treino90_entende_erro_gramatica") {
      mem90.correcoesGramaticais = Number(mem90.correcoesGramaticais || 0) + 1;
      salvarMemoria();
      return wrap(lyra ? "gentle" : "attentive", escolherTreino90(TREINO90_VARIACOES_RESPOSTA.erroGramatica[personagem], personagem, "erro_gramatica"));
    }

    if (tipo === "treino90_curta_genero" || tipo === "treino90_curta_clima") {
      const alvo = alvoPreferenciaTreino90(textoOriginal, tipo === "treino90_curta_genero" ? "genero" : "clima");
      lembrarEmLista(tipo === "treino90_curta_genero" ? "generosFavoritos" : "climasLeitura", alvo, 18);
      mem90.ultimaPalavraChave = alvo;
      mem90.ultimosAlvos = [alvo, ...mem90.ultimosAlvos.filter(x => normalizarTreino90(x) !== normalizarTreino90(alvo))].slice(0, 10);
      salvarMemoria();
      const recs = recomendarLivrosPrecisos(alvo, limiteRecomendacao96(textoOriginal, 1));
      const pack = tipo === "treino90_curta_genero" ? TREINO90_VARIACOES_RESPOSTA.curtaGenero : TREINO90_VARIACOES_RESPOSTA.curtaClima;
      const texto = escolherTreino90(pack[personagem], personagem, `${tipo}_${alvo}`).replaceAll("{alvo}", alvo);
      return wrap(lyra ? "inspired" : "analyzing", texto, recs);
    }

    if (tipo === "treino90_curta_lyra") return respostaTreino89("treino89_sobre_lyra", personagem, textoOriginal, humor);
    if (tipo === "treino90_curta_orion") return respostaTreino89("treino89_sobre_orion", personagem, textoOriginal, humor);
    if (tipo === "treino90_curta_duo") return respostaTreino89("treino89_sobre_duo", personagem, textoOriginal, humor);

    if (tipo === "treino90_curta_historia") {
      if (/\b(fofoca|babado)\b/.test(n)) return respostaTreino87("treino87_fofoca", personagem, textoOriginal, humor);
      if (/\b(rotina|cotidiano)\b/.test(n)) return respostaTreino87("treino87_cotidiano", personagem, textoOriginal, humor);
      if (/\b(passado|backstory)\b/.test(n)) return respostaTreino87("treino87_backstory_profunda", personagem, textoOriginal, humor);
      if (/\b(segredo|curiosidade|gostos|defeito|medo|sonho)\b/.test(n)) return respostaBasica("segredo", personagem, textoOriginal, humor);
      return respostaTreino87("treino87_historia_juntos", personagem, textoOriginal, humor);
    }

    if (tipo === "treino90_curta_site") {
      if (/\b(catalogo|catálogo|acervo)\b/.test(n)) return respostaGuia("guia_catalogo", personagem);
      if (/\b(mapa|3d|galaxia|galáxia)\b/.test(n)) return respostaGuia("guia_3d", personagem);
      if (/\breserva\b/.test(n)) return respostaGuia("reserva", personagem);
      if (/\b(avaliacao|avaliação)\b/.test(n)) return respostaGuia("avaliacao", personagem);
      if (/\b(perfil|ranking)\b/.test(n)) return respostaGuia("perfil_ranking", personagem);
      if (/\b(eco|cinema)\b/.test(n)) return respostaGuia("modo_visual", personagem);
      return wrap(lyra ? "curious" : "attentive", escolherTreino90(TREINO90_VARIACOES_RESPOSTA.perguntaCurta[personagem], personagem, "site_curto"));
    }

    if (tipo === "treino90_curta_sim_contextual" || tipo === "treino90_continua_contextual") {
      const mem88 = garantirMemoriaTreino88();
      if (MEMORIA.aguardando === "roleplay" || String(MEMORIA.ultimaIntencao || "").startsWith("treino6_roleplay")) return respostaTreino6("treino6_roleplay_continuar", personagem, textoOriginal, humor);
      if (mem88.ultimoAlvo === "Lyra") return respostaTreino89("treino89_historia_lyra", personagem, textoOriginal, humor);
      if (mem88.ultimoAlvo === "Orion") return respostaTreino89("treino89_historia_orion", personagem, textoOriginal, humor);
      if (mem88.ultimoAlvo === "duo") return respostaTreino89("treino89_sobre_duo", personagem, textoOriginal, humor);
      if (String(MEMORIA.ultimaIntencao || "").includes("recomendacao") || MEMORIA.aguardando === "recomendacao") return respostaParaSim(personagem);
      return wrap(lyra ? "curious" : "attentive", lyra
        ? "Eu sigo, sim. Posso continuar pela história, puxar uma pergunta sobre você ou transformar essa faísca em leitura. Qual lua abrimos?"
        : "Continuo. Posso seguir pela história, investigar seu gosto ou abrir uma rota de leitura. Escolha o alvo, ou diga só uma palavra-chave.");
    }

    if (tipo === "treino90_curta_nao_contextual") {
      return wrap(lyra ? "gentle" : "attentive", escolherTreino90(TREINO90_VARIACOES_RESPOSTA.curtaNao[personagem], personagem, "nao_contextual"));
    }

    if (tipo === "treino90_indeciso_curto") {
      const recs = recomendarLivrosPrecisos("surpresa leve mistério fantasia disponível", limiteRecomendacao96(textoOriginal, 1));
      return wrap(lyra ? "playful" : "sly", lyra
        ? "Então eu escolho por você com cuidado: uma rota surpresa, nem pesada demais nem vazia demais. Peguei algumas estrelas que costumam funcionar quando o coração diz 'sei lá'."
        : "Indecisão detectada. Vou assumir o volante literário por alguns segundos. Separei opções com chance decente de não desperdiçar sua órbita.", recs);
    }

    if (tipo === "treino90_reparo_curto") {
      return respostaTreino89("treino89_reparo_contextual", personagem, textoOriginal, humor);
    }

    return wrap(lyra ? "curious" : "attentive", escolherTreino90(TREINO90_VARIACOES_RESPOSTA.perguntaCurta[personagem], personagem, "fallback_curto"));
  }



  const TREINO91_LINGUAGEM_EXTRA = [
    [/\b(c|ce|cê|ocê|oce|voçe|vce|vcê)\b/g, "voce"],
    [/\b(vxs|v6|vcs|ceis|cês)\b/g, "voces"],
    [/\b(q|qq|q q|que que)\b/g, "que"],
    [/\b(oq|o q|o que que)\b/g, "o que"],
    [/\b(pq|p q|porq|por que que)\b/g, "por que"],
    [/\b(pfv|plmds|pls)\b/g, "por favor"],
    [/\b(tlg|ta ligado|tá ligado)\b/g, "entende"],
    [/\b(pdp|pdpa|fecho|fechou)\b/g, "sim"],
    [/\b(sla|slah|sei la|sei lá)\b/g, "nao sei"],
    [/\b(mlk|mano|mana|man|vei|véi|bicho|parca|parça|fi|uai|oxe|oxente|bah|egua|égua|guri|pia)\b/g, ""],
    [/\b(brisa|vibe|pegada|energia)\b/g, "personalidade"],
    [/\b(lore|hist|estoria)\b/g, "historia"],
    [/\b(causo|resenha|rol[eê])\b/g, "historia"],
    [/\b(babado|fofoquinha|fofocas)\b/g, "fofoca"],
    [/\b(ta lendo|tá lendo|lendo agr|lendo agora|leitura atual)\b/g, "esta lendo"],
    [/\b(n curte|nao curte|não curte|n gosta|nao gosta|não gosta|detesta|odeia)\b/g, "nao gosta"],
    [/\b(gosta d|curte d|ama d)\b/g, "gosta de"],
    [/\b(fala mais dela|fala dela|conta dela|sobre ela|e ela)\b/g, "fala sobre lyra"],
    [/\b(fala mais dele|fala dele|conta dele|sobre ele|e ele)\b/g, "fala sobre orion"],
    [/\b(andormeda|andromeda|andrômeda)\b/g, "andromeda"],
    [/\b(lira|lyrra|liria)\b/g, "lyra"],
    [/\b(oriom|oriam|orionn)\b/g, "orion"]
  ];

  const TREINO91_RESPOSTAS = {
    Orion: {
      eu: {
        perfil: [
          "Eu sou Orion, guardião de pata escura, olho vermelho, olho roxo e paciência seletiva. Antes da Andrômeda, eu seguia mapas que nunca terminavam; agora protejo rotas de leitura, livros teimosos e leitores que fingem não estar perdidos.",
          "Eu moro no Observatório do Acervo, entre mapas, poeira estelar e registros que miam quando alguém cadastra algo errado. Gosto de mistério, ciência, filosofia, capas sombrias e perguntas que têm coragem de cutucar a estante certa.",
          "Minha função é manter a Biblioteca respirando em ordem. Eu guio pelo catálogo, farejo livros bons, vigio o mapa 3D e finjo que não me importo quando alguém volta só para conversar. Péssima notícia: eu me importo."
        ],
        historia: [
          "Antes da Andrômeda, eu era o gato de um mapa sem dono. Toda noite uma rota nova surgia no meu chapéu, e toda rota levava a um livro que alguém tinha esquecido de amar. Quando cheguei aqui, pela primeira vez o mapa respondeu ao meu miado.",
          "Uma vez passei três noites caçando um marcador de páginas que roubava finais. Quando encurralei o suspeito, descobri que ele só tentava salvar leitores de spoilers. Negociei com ele: agora ele assombra apenas livros já devolvidos.",
          "Eu já encarei o buraco negro central achando que ele estava engolindo obras. Descobri que ele só guardava títulos sem leitor. Desde então, todo livro perdido passa primeiro pelo meu faro antes de cair no silêncio."
        ],
        gostos: [
          "Eu gosto de mapas precisos, chá forte sem açúcar, capas escuras, silêncio de madrugada, mistérios bem amarrados e leitores que perguntam sem rodeio. Também gosto da Lyra, mas ela não precisa saber que eu admiti com tanta clareza.",
          "Meus gostos? Suspense, investigação, filosofia, ciência, noites frias no Observatório e livros que escondem uma segunda verdade na terceira página. Se o catálogo tem cheiro de segredo, eu presto atenção.",
          "Gosto quando uma história exige faro. Também gosto de botões que funcionam, lombadas alinhadas e recomendações com motivo. Recomendação jogada ao vento me dá vontade de derrubar um tinteiro."
        ],
        naoGosta: [
          "Não gosto de livro maltratado, rota quebrada, promessa vazia, spoiler gritado no corredor e recomendação sem alma. Também não gosto quando a Lyra coloca purpurina lunar nos meus mapas. Funciona, mas ainda é purpurina.",
          "Eu evito bagunça fingindo que é estilo, botão que leva para lugar nenhum e gente que abre dossiê sem ler a sinopse. E sim, eu percebo.",
          "Não gosto de pressa burra. Pressa inteligente eu respeito. Pressa burra é quando alguém pula o autor, ignora o status e depois reclama que se perdeu no acervo."
        ],
        lendo: [
          "Agora eu estou lendo um rastro de mistério do catálogo. Escolhi algo com cheiro de segredo, porque leitura sem suspeita me deixa sonolento.",
          "Minha leitura atual está entre suspense, filosofia e ciência. Eu alterno capítulos com patrulhas no mapa 3D; a Biblioteca não se vigia sozinha.",
          "Estou com uma obra mais sombria aberta no Observatório. Deixo uma pena preta marcando a página. A Lyra diz que isso é dramático. Eu digo que é organização."
        ]
      },
      lyra: {
        perfil: [
          "A Lyra é minha melhor amiga e meu problema luminoso favorito. Ela enxerga delicadeza onde eu vejo risco, e o pior é que muitas vezes ela está certa.",
          "A Lyra mora nos Jardins Lunares, conversa com sinopses tímidas e consegue fazer uma recomendação parecer abraço. Eu finjo que acho exagerado; a Biblioteca sabe que eu respeito.",
          "Ela é guia lunar, guardiã de afetos e especialista em perceber quando alguém diz 'tanto faz' querendo dizer 'me ajuda sem me pressionar'. Isso é raro. Irritantemente útil."
        ],
        historia: [
          "Conheci a Lyra na noite em que uma estante inteira esqueceu a própria categoria. Eu chamei de sabotagem. Ela chamou de medo. Fomos investigar; era uma prateleira nova, tremendo de vergonha. Ela acalmou, eu reorganizei. Funcionou.",
          "Uma vez a Lyra passou horas ensinando vaga-lumes de recomendação a piscarem devagar. Eu reclamei da demora. Depois vi um leitor cansado escolher um livro justamente porque a luz não o apressou. Fingi que não aprendi nada.",
          "A Lyra já salvou um livro de terror que chorava no Jardim das Sinopses. Eu fiquei de vigia para ninguém ver. Ela acha que eu fiz por segurança. Fiz também por carinho, mas mantenha isso entre nós."
        ],
        gostos: [
          "Ela gosta de azul-marinho, chá de lua azul, poesia, fantasia, romance delicado, cristais de memória e leitores que ainda não sabem pedir ajuda. Também gosta de colocar nomes sentimentais em corredores que já tinham nomes perfeitamente úteis.",
          "A Lyra gosta de histórias que curam sem fazer discurso. Fantasia, poesia, aventura suave, finais que deixam uma janela aberta. O catálogo muda de brilho quando ela escolhe algo.",
          "Ela gosta de pequenos sinais: uma capa que chama baixo, uma sinopse tímida, um leitor que volta depois de um dia difícil. Eu observo. Só para garantir a segurança, claro."
        ],
        naoGosta: [
          "A Lyra não gosta de pressa agressiva, spoiler cruel, livro abandonado em canto frio e gente fingindo que sentimento é fraqueza. Quando isso acontece, até os vaga-lumes ficam sérios.",
          "Ela não gosta quando tratam leitura como obrigação sem encanto. Também não gosta quando eu chamo o Jardim das Sinopses de 'setor de textos indecisos'. Tecnicamente é engraçado. Ela discorda.",
          "Ela evita respostas frias. Se percebe que alguém está cansado, baixa o tom, acende menos brilho e chega devagar. É uma habilidade que eu respeito em silêncio."
        ],
        lendo: [
          "A Lyra está lendo algo com fantasia, poesia ou romance lunar. Ela escolhe livros como quem escuta conchas: aproxima a capa, fica quieta e espera a história respirar.",
          "Hoje ela deixou aberto um livro do catálogo perto dos Jardins Lunares. Pelo brilho da capa, aposto em fantasia com coração macio. Pelo sorriso dela, acertei.",
          "A leitura atual dela muda conforme o humor da Biblioteca. Se os corredores estão cansados, ela pega algo leve; se as estrelas estão inquietas, vai para aventura ou magia."
        ]
      }
    },
    Lyra: {
      eu: {
        perfil: [
          "Eu sou Lyra, uma guia lunar nascida de uma dobra de luar e de um pedido antigo: que os livros soubessem acolher quem chega perdido. Eu moro nos Jardins Lunares e escuto o brilho das histórias antes de escolher uma rota.",
          "Eu caminho pela Andrômeda com chapéu azul-marinho, bolsos cheios de marcadores encantados e uma mania de conversar com sinopses tímidas. Minha missão é transformar pergunta pequena em caminho bonito.",
          "Eu sou a parte da Biblioteca que pergunta com calma: 'o que você precisa sentir hoje?'. Posso guiar pelo catálogo, pelo mapa 3D ou só ficar aqui conversando até a noite ficar mais leve."
        ],
        historia: [
          "Antes da Andrômeda, eu era um reflexo preso em uma janela de observatório. Eu via leitores passando, mas não podia chamar nenhum. Um dia uma criança desejou que a lua recomendasse um livro; esse desejo virou minha primeira voz.",
          "Minha primeira noite na Biblioteca foi silenciosa. Eu não sabia se podia tocar nos livros. Então um volume esquecido abriu sozinho e me ofereceu a própria primeira frase. Desde então, eu cuido de histórias que têm vergonha de aparecer.",
          "Uma vez encontrei uma sinopse tremendo porque achava que não era bonita o bastante. Sentei ao lado dela, costurei três palavras de coragem na margem e, no dia seguinte, alguém finalmente abriu aquele livro."
        ],
        gostos: [
          "Eu gosto de azul-marinho, chá de lua azul, poesia, fantasia, romance com delicadeza, aventura com coração e leitores que dizem 'não sei' com sinceridade. O 'não sei' também é uma porta.",
          "Gosto de objetos pequenos: marcadores, fitas, estrelas de papel, cristais de memória e capas que parecem guardar uma respiração. Também gosto do jeito que Orion finge não gostar de carinho.",
          "Eu gosto de livros que abraçam sem prender. Fantasia, poesia, cartas, mundos escondidos e histórias que deixam uma fresta de esperança mesmo quando tudo escurece."
        ],
        naoGosta: [
          "Eu não gosto de spoiler dado com crueldade, pressa que atropela sentimento, livro esquecido no frio e gente rindo de quem lê devagar. Cada leitor tem seu tempo de órbita.",
          "Não gosto quando uma história é tratada como coisa descartável. Mesmo um livro que alguém não amou pode ser a constelação perfeita de outra pessoa.",
          "Eu não gosto de respostas duras quando alguém chega cansado. Às vezes a pessoa não precisa de uma solução imensa; precisa de uma lanterna pequena e companhia."
        ],
        lendo: [
          "Agora estou lendo uma obra que encontrei no catálogo com brilho de fantasia e coração macio. Deixo o livro aberto no Jardim das Sinopses, para as frases respirarem luar.",
          "Minha leitura atual muda com a Biblioteca. Hoje eu escolheria algo poético, talvez fantasia ou romance delicado, porque os corredores estão parecendo pedir uma história com cuidado.",
          "Estou lendo um livro que Orion chamaria de 'emocional demais'. Eu chamaria de necessário. Ele fingiu reclamar, mas ficou três páginas parado atrás de mim."
        ]
      },
      orion: {
        perfil: [
          "O Orion é meu melhor amigo: um gato preto com olhar de estrela difícil, chapéu de bruxo e um cuidado enorme escondido atrás de frases secas. Ele protege a Biblioteca como quem protege uma vela no vento.",
          "O Orion parece sombra e sarcasmo, mas eu conheço o lado dele que deixa rotas secretas para livros esquecidos. Ele diz que é estratégia. Eu digo que é ternura com bigodes.",
          "Ele mora no Observatório do Acervo, vigia o mapa 3D, fareja erros no catálogo e resmunga quando eu coloco nomes bonitos demais nas coisas. Ainda assim, ele nunca apaga minhas luzes. Só ajusta a rota."
        ],
        historia: [
          "Quando conheci Orion, ele estava tentando interrogar uma prateleira. Eu perguntei se ela talvez estivesse só com medo. Ele me olhou como se eu tivesse dito uma heresia. Cinco minutos depois, a prateleira respondeu. Desde então, investigamos juntos.",
          "Uma vez Orion perseguiu um marcador por três constelações. Eu fui atrás levando chá e uma rede de luar. Quando ele finalmente alcançou o marcador, descobrimos que ele só queria visitar livros esquecidos. Orion fingiu irritação, mas deixou uma rota para ele passear.",
          "No apagão estelar da Biblioteca, Orion guiou todos pelos sons das lombadas. Eu acendi pequenas luas no chão. Ele diz que eu dramatizei. Eu digo que ele salvou todo mundo fingindo que era só protocolo."
        ],
        gostos: [
          "Ele gosta de mistério, silêncio inteligente, mapas, capas escuras, ciência, filosofia e histórias que fazem o leitor desconfiar até da própria sombra. Também gosta de mim, embora transforme isso em relatório de segurança.",
          "Orion gosta de ordem, investigação e perguntas afiadas. Quando alguém pede uma leitura sombria ou cheia de segredo, os olhos dele brilham antes mesmo de ele admitir.",
          "Ele gosta de ficar no alto do Observatório fingindo que só observa o acervo. Na verdade, ele observa quem precisa de ajuda e chega antes da pessoa pedir."
        ],
        naoGosta: [
          "Ele não gosta de spoiler, bagunça sem poesia, livro maltratado, botão quebrado e recomendação jogada sem carinho. Também não gosta quando eu digo que ele é fofo. Por isso eu digo só às vezes. Quase sempre.",
          "Orion não gosta de pressa burra, como ele chama. É quando alguém corre pelo catálogo sem escutar o que está procurando. Eu acho o termo rude. Útil, mas rude.",
          "Ele evita sentimentalismo explícito, mas não evita cuidado. Se você disser que está perdido, ele aparece com a rota pronta e finge que já ia passar por ali."
        ],
        lendo: [
          "O Orion está lendo algo com suspense, filosofia ou investigação. Ele marca páginas com uma pena preta e chama isso de método. Eu chamo de charme dramático.",
          "Hoje ele está com uma leitura mais sombria no Observatório. Pela expressão, o livro tem segredo. Pelo silêncio dele, o segredo é bom.",
          "A leitura atual dele quase sempre tem mapa, suspeita ou pergunta difícil. Se o catálogo sussurra mistério, Orion ouve antes de todo mundo."
        ]
      }
    }
  };

  const TREINO91_DUO = {
    Orion: {
      perfil: [
        "A Lyra e eu somos melhores amigos porque discordamos sem quebrar a órbita. Eu testo se a ponte aguenta; ela acende a ponte para ninguém atravessar com medo.",
        "Nós dois cuidamos da Andrômeda por lados diferentes. Eu protejo rotas, ela protege sentidos. Quando o acervo fica caótico, somos irritantemente eficientes juntos.",
        "A Lyra chama nossa dupla de constelação. Eu chamo de parceria operacional. A Biblioteca chama de sorte. Talvez a Biblioteca esteja menos errada que o normal."
      ],
      historias: [
        "Uma noite o catálogo trocou todos os gêneros de lugar: romance caiu em terror, ciência foi parar em poesia e fantasia fingiu que não tinha culpa. A Lyra acalmou as estantes; eu segui as pegadas de tinta. No fim, era um livro novo tentando encontrar onde pertencia.",
        "Já enfrentamos um cometa de recomendações erradas. Ele entrou pela cúpula gritando títulos aleatórios. Lyra cantou para desacelerar a cauda; eu agarrei o núcleo e mandei o cometa fazer ficha de cadastro como todo mundo.",
        "No apagão estelar, a Lyra acendeu luas no chão enquanto eu guiava pelo som das lombadas. Um leitor achou que aquilo era apresentação especial. Eu não corrigi. Às vezes o caos tem boa iluminação."
      ],
      fofocas: [
        "Fofoca? A Lyra já deu nome a três poeiras diferentes. Uma delas atende por Astolfo e só pousa em livro de romance.",
        "Ouvi dizer que o Jardim das Sinopses anda escondendo livros que ainda não sabem como se apresentar. A Lyra diz que é timidez. Eu digo que é comportamento suspeito.",
        "Tem um carrossel do catálogo que gira mais devagar quando a Lyra passa. Não provei nada ainda, mas meus bigodes não mentem."
      ]
    },
    Lyra: {
      perfil: [
        "O Orion e eu somos melhores amigos porque ele protege o caminho e eu protejo a coragem de seguir por ele. A gente briga baixinho, ri depois e salva as mesmas estrelas por motivos diferentes.",
        "Nós somos duas formas de cuidado: Orion chega como guarda, eu chego como luz. Quando estamos juntos, a Biblioteca parece respirar mais certa.",
        "Ele diz que somos uma parceria funcional. Eu digo que somos casa em movimento. Ele revira os olhos, mas nunca vai embora."
      ],
      historias: [
        "Uma vez um livro fugiu do próprio final e se escondeu no mapa 3D. Orion seguiu as pegadas de pontuação; eu segui o medo que a história deixava no ar. Encontramos o livro tremendo atrás de um planeta de fantasia. Ele só não queria terminar triste.",
        "No dia do cometa de recomendações erradas, Orion tentou enfrentar o núcleo de frente. Eu joguei uma rede de luar na cauda e pedi para ele respirar. Ele disse que já estava respirando. Mentira. Mas funcionou.",
        "Certa madrugada reorganizamos a Sala dos Marcadores Perdidos. Orion queria separar por tamanho. Eu queria separar por saudade. Fizemos os dois. Foi a primeira vez que uma gaveta suspirou de alívio."
      ],
      fofocas: [
        "Fofoca lunar: Orion conversa com o próprio chapéu quando acha que ninguém está vendo. O chapéu geralmente tem razão.",
        "A Varanda dos Finais Alternativos anda deixando finais felizes mais perto de leitores cansados. Orion suspeita de mim. Eu sorrio de um jeito muito inocente.",
        "Tem uma estante que finge ranger só para Orion investigar. Acho que ela gosta da atenção. Ele diz que é manutenção preventiva."
      ]
    }
  };

  function normalizarTreino91(texto) {
    let n = normalizar(texto);
    n = ` ${n} `;
    TREINO91_LINGUAGEM_EXTRA.forEach(([padrao, troca]) => { n = n.replace(padrao, troca); });
    return n.replace(/\s+/g, " ").trim();
  }

  function garantirMemoriaTreino91() {
    if (!MEMORIA.afetiva.treino91 || typeof MEMORIA.afetiva.treino91 !== "object") {
      MEMORIA.afetiva.treino91 = { ultimoAlvo: "", ultimoModo: "", ultimasRespostas: [], respostasCurtas: 0, trocasAssunto: 0 };
    }
    if (!Array.isArray(MEMORIA.afetiva.treino91.ultimasRespostas)) MEMORIA.afetiva.treino91.ultimasRespostas = [];
    return MEMORIA.afetiva.treino91;
  }

  function alvoTreino91(texto) {
    const n = normalizarTreino91(texto);
    if (/\b(lyra|lira|lirinha|lua|lunar|ela|dela)\b/.test(n)) return "Lyra";
    if (/\b(orion|oriom|oriam|gato|gatinho|felino|guardiao|guardião|ele|dele)\b/.test(n)) return "Orion";
    if (/\b(voces|vocês|dupla|ambos|juntos|os dois|amizade|melhores amigos|parceria)\b/.test(n)) return "duo";
    const mem91 = garantirMemoriaTreino91();
    const mem88 = garantirMemoriaTreino88();
    return mem91.ultimoAlvo || mem88.ultimoAlvo || "";
  }

  function modoTreino91(texto) {
    const n = normalizarTreino91(texto);
    if (/\b(nao gosta|detesta|odeia|evita|irrita|incomoda|chato|ruim)\b/.test(n)) return "naoGosta";
    if (/\b(gosta|curte|ama|favorito|favorita|preferido|preferida|cor|comida|objeto|hobby|coisa)\b/.test(n)) return "gostos";
    if (/\b(esta lendo|lendo|leitura atual|livro atual|qual livro|que livro)\b/.test(n)) return "lendo";
    if (/\b(historia|causo|caso|passado|backstory|antes da andromeda|origem|nasceu|veio|aconteceu|aventura|lembranca|memoria)\b/.test(n)) return "historia";
    if (/\b(fofoca|babado|segredo|curiosidade|cotidiano|rotina|dia a dia|acontece)\b/.test(n)) return "fofoca";
    return "perfil";
  }

  function classificarPorTreino91(texto) {
    const n = normalizarTreino91(texto);
    if (!n) return null;
    if (parecePedidoLeitura92(texto) || /\b(catalogo|catálogo|mapa|3d|reserva|avaliacao|avaliação|perfil|ranking|buscar|pesquisar|procurar)\b/.test(n)) return null;
    const tokens = tokensUteis(n);
    const curto = tokens.length <= 4 || n.length <= 24;
    const alvo = alvoTreino91(texto);
    const modo = modoTreino91(texto);
    const perguntaPessoa = /\b(me conte|me conta|conta|conte|fala|fale|me fala|me diga|diz|explica|explique|descreve|apresenta|quero conhecer|quero saber|qual e|qual é|quem e|quem é|como e|como é|o que voce|o que tu|sobre|da lyra|do orion|dela|dele|de voces|de vocês|sua historia|sua personalidade|sua vida|sua rotina|tua historia|tua personalidade)\b/.test(n);
    const pedeMais = /\b(continua|fala mais|conta mais|me conta mais|mais sobre|desenvolve|detalha|e ela|e ele|sobre ela|sobre ele|dela|dele|vai|manda)\b/.test(n);
    const trocaAssunto = /\b(mudando de assunto|trocando de assunto|outro assunto|agora sobre|agora quero|do nada|deixa isso|esquece isso|troca a rota|nova rota)\b/.test(n);
    const reparo = /\b(nao era isso|não era isso|nada a ver|entendeu errado|vc entendeu errado|voce entendeu errado|respondeu errado|misturou|trocou|quem falou isso|volta para|volta pra|era sobre)\b/.test(n);
    const linguagem = /\b(entende giria|entende gíria|entende dialeto|entende abreviacao|entende abreviação|posso escrever errado|erro de portugues|erro de português|erro de gramatica|erro de gramática|falar torto|escrever torto|falo assim)\b/.test(n);

    if (linguagem) return "treino91_linguagem";
    if (reparo) return "treino91_reparo";
    if (trocaAssunto) {
      if (alvo === "Lyra") return "treino91_mudanca_lyra";
      if (alvo === "Orion") return "treino91_mudanca_orion";
      if (alvo === "duo") return "treino91_mudanca_duo";
      return "treino91_mudanca_livre";
    }

    if ((perguntaPessoa || pedeMais || curto) && alvo === "Lyra") return `treino91_${modo}_lyra`;
    if ((perguntaPessoa || pedeMais || curto) && alvo === "Orion") return `treino91_${modo}_orion`;
    if ((perguntaPessoa || pedeMais || curto) && alvo === "duo") return modo === "fofoca" ? "treino91_fofoca_duo" : "treino91_historia_duo";

    if (/\b(me conte sobre voce|me conta sobre voce|fala de voce|fala de tu|fala de vc|quem e voce|quem é você|vc e oq|tu e oq|qual sua historia|qual tua historia|qual sua personalidade|me apresenta)\b/.test(n)) return "treino91_perfil_eu";

    const aguardando = Boolean(MEMORIA.aguardando || MEMORIA.afetiva?.ultimaPerguntaSocial85 || garantirMemoriaTreino91().ultimoAlvo);
    if (curto && aguardando && /\b(sim|nao|não|talvez|pode|manda|vai|bora|ok|beleza|claro|quero|n quero|nao quero|não quero|qualquer|tanto faz)\b/.test(n)) return "treino91_resposta_curta_social";
    if (curto && aguardando && /\b(gostos|nao gosta|não gosta|lendo|fofoca|historia|rotina|cotidiano|segredo|curiosidade)\b/.test(n)) return "treino91_continuacao_curta";
    return null;
  }

  function escolherTreino91(lista, personagem, chave) {
    const mem = garantirMemoriaTreino91();
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    const recentes = mem.ultimasRespostas.map(normalizarTreino91);
    const candidatos = arr.filter(item => !recentes.includes(normalizarTreino91(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino91_${personagem}_${chave}_${MEMORIA.mensagens}`);
    mem.ultimasRespostas = [escolhido, ...mem.ultimasRespostas.filter(item => normalizarTreino91(item) !== normalizarTreino91(escolhido))].slice(0, 24);
    return escolhido;
  }

  function textosTreino91(personagem, alvo, modo) {
    const euMesmo = personagem === alvo;
    if (alvo === "duo") {
      const pack = TREINO91_DUO[personagem] || TREINO91_DUO.Orion;
      if (modo === "fofoca") return pack.fofocas;
      if (modo === "perfil") return pack.perfil;
      return pack.historias;
    }
    const packPersonagem = TREINO91_RESPOSTAS[personagem] || TREINO91_RESPOSTAS.Orion;
    const chaveAlvo = euMesmo ? "eu" : alvo === "Lyra" ? "lyra" : "orion";
    const pack = packPersonagem[chaveAlvo] || packPersonagem.eu;
    return pack[modo] || pack.perfil;
  }

  function perguntaFinalTreino91(personagem, alvo, modo) {
    if (alvo === "duo") {
      return personagem === "Lyra"
        ? " Quer que eu conte uma lembrança mais engraçada, uma mais doce ou uma pequena fofoca nossa?"
        : " Posso continuar pela parte engraçada, pela parte suspeita ou pela fofoca que a Lyra chamaria de 'detalhe sensível'.";
    }
    const euMesmo = personagem === alvo;
    if (euMesmo) {
      return personagem === "Lyra"
        ? " Quer saber dos meus gostos, do que eu não gosto ou de uma história minha antes da Andrômeda?"
        : " Quer meus gostos, minhas implicâncias ou uma história de antes da Andrômeda?";
    }
    if (alvo === "Lyra") return " Quer que eu conte uma história dela, o que ela gosta ou uma fofoca em que ela parece inocente demais?";
    return " Quer que eu conte uma história dele, o que ele gosta ou uma cena nossa em que ele tenta fingir que não se importa?";
  }

  function recomendarPeloAlvoTreino91(alvo, modo) {
    if (alvo === "Orion") return recomendarLivrosPrecisos("mistério suspense investigação filosofia ciência clássico sombrio", 1);
    if (alvo === "Lyra") return recomendarLivrosPrecisos("fantasia poesia romance aventura leve mágico", 1);
    if (modo === "lendo") return recomendarLivrosPrecisos("fantasia mistério aventura disponível", 1);
    return [];
  }

  function respostaTreino91(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const mem = garantirMemoriaTreino91();
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });

    if (tipo === "treino91_linguagem") {
      const texto = lyra
        ? "Pode falar comigo do seu jeito: gíria, abreviação, frase quebrada, uma palavra só. Eu vou escutar o sentido primeiro e, se eu me perder, você me dá uma pista pequena que eu volto para a estrela certa."
        : "Pode mandar torto, abreviado, com gíria ou só uma palavra. Eu sigo o rastro da intenção, não a gramática engomada. Se eu errar, diga o alvo: Lyra, Orion, livro, mapa, catálogo ou fofoca.";
      return wrap(lyra ? "gentle" : "attentive", texto);
    }

    if (tipo === "treino91_reparo") {
      const alvo = alvoTreino91(textoOriginal) || mem.ultimoAlvo || "duo";
      mem.ultimoAlvo = alvo;
      salvarMemoria();
      const texto = lyra
        ? `Você tem razão, eu peguei outra estrela. Volto com cuidado: quer que eu siga em ${alvo === "duo" ? "nós duas rotas, Orion e eu" : alvo}, ou prefere me dar uma palavra como gostos, história, lendo ou fofoca?`
        : `Certo, meu faro desviou. Recalibro sem discurso: sigo em ${alvo === "duo" ? "nós dois" : alvo}, ou você me joga uma palavra-chave — gostos, história, lendo, fofoca ou catálogo.`;
      return wrap(lyra ? "gentle" : "attentive", texto);
    }

    if (tipo === "treino91_mudanca_livre") {
      mem.trocasAssunto = Number(mem.trocasAssunto || 0) + 1;
      salvarMemoria();
      return wrap(lyra ? "curious" : "attentive", lyra
        ? "Tudo bem, viramos a lua. Me diz a nova trilha: Orion, Lyra, nós dois, fofoca, livro, catálogo, mapa 3D ou só conversa calma?"
        : "Rota trocada. Diga o novo alvo: Orion, Lyra, os dois, fofoca, recomendação, catálogo, mapa 3D ou conversa livre.");
    }

    let alvo = "";
    if (tipo.endsWith("_lyra")) alvo = "Lyra";
    else if (tipo.endsWith("_orion")) alvo = "Orion";
    else if (tipo.endsWith("_duo")) alvo = "duo";
    else if (tipo === "treino91_perfil_eu") alvo = personagem;
    else alvo = alvoTreino91(textoOriginal) || mem.ultimoAlvo || personagem;

    let modo = "perfil";
    if (tipo.includes("naoGosta")) modo = "naoGosta";
    else if (tipo.includes("gostos")) modo = "gostos";
    else if (tipo.includes("lendo")) modo = "lendo";
    else if (tipo.includes("historia")) modo = "historia";
    else if (tipo.includes("fofoca")) modo = "fofoca";
    else modo = modoTreino91(textoOriginal);

    if (tipo === "treino91_resposta_curta_social") {
      const n = normalizarTreino91(textoOriginal);
      if (/\b(nao|não|n quero|nao quero|não quero|depois)\b/.test(n)) {
        return wrap(lyra ? "gentle" : "attentive", lyra
          ? "Tudo bem. Eu deixo essa porta encostada. Podemos mudar para uma fofoca leve, uma recomendação ou só uma conversa sem pressa."
          : "Fechado. Essa rota fica em pausa. Posso puxar fofoca, livro, mapa, catálogo ou só papo sem cerimônia.");
      }
      if (/\b(sim|pode|manda|vai|bora|claro|quero|ok|beleza)\b/.test(n)) {
        alvo = mem.ultimoAlvo || alvo;
        modo = mem.ultimoModo || "historia";
      }
    }

    if (tipo === "treino91_continuacao_curta") {
      modo = modoTreino91(textoOriginal);
      alvo = mem.ultimoAlvo || alvo;
    }

    mem.ultimoAlvo = alvo;
    mem.ultimoModo = modo;
    const mem88 = garantirMemoriaTreino88();
    mem88.ultimoAlvo = alvo;
    mem88.ultimoCaminho = modo;
    salvarMemoria();

    const textos = textosTreino91(personagem, alvo, modo);
    const base = escolherTreino91(textos, personagem, `${alvo}_${modo}`);
    const pergunta = perguntaFinalTreino91(personagem, alvo, modo);
    const recs = modo === "lendo" || modo === "gostos" ? recomendarPeloAlvoTreino91(alvo === "duo" ? personagem : alvo, modo) : [];
    const estado = lyra ? (modo === "historia" || modo === "fofoca" ? "dreamy" : "gentle") : (modo === "fofoca" ? "sly" : "attentive");
    return wrap(estado, `${base}${pergunta}`, recs);
  }

  function harmonizarVozPersonagem91(texto, personagem) {
    let t = String(texto || "");
    if (personagem === "Orion") {
      t = t.replace(/^\s*Sobre\s+Orion\s*:\s*/i, "");
      t = t.replace(/^\s*O\s+Orion\s+é\s+/i, "Eu sou ");
      t = t.replace(/^\s*Orion\s+é\s+/i, "Eu sou ");
      t = t.replace(/^\s*O\s+Orion\s+gosta\s+de\s+/i, "Eu gosto de ");
      t = t.replace(/^\s*Orion\s+gosta\s+de\s+/i, "Eu gosto de ");
      t = t.replace(/\bO\s+Orion\s+finge\s+que\s+é\s+só\s+estratégia,?\s*/i, "Eu finjo que sou só estratégia, ");
      t = t.replace(/\bO\s+Orion\s+finge\s+que\s+/i, "Eu finjo que ");
      t = t.replace(/\bEle\s+diz\s+que\s+é\s+estratégia\.\s*Eu\s+digo\s+que\s+é\s+ternura\s+com\s+bigodes\.?/i, "Eu digo que é estratégia. A Lyra chama de ternura com bigodes.");
    }
    if (personagem === "Lyra") {
      t = t.replace(/^\s*Sobre\s+Lyra\s*:\s*/i, "");
      t = t.replace(/^\s*A\s+Lyra\s+é\s+/i, "Eu sou ");
      t = t.replace(/^\s*Lyra\s+é\s+/i, "Eu sou ");
      t = t.replace(/^\s*A\s+Lyra\s+gosta\s+de\s+/i, "Eu gosto de ");
      t = t.replace(/^\s*Lyra\s+gosta\s+de\s+/i, "Eu gosto de ");
      t = t.replace(/\bEla\s+diz\s+que\s+é\s+estratégia\.\s*Eu\s+digo\s+que\s+é\s+ternura\s+com\s+bigodes\.?/i, "Orion diz que é estratégia. Eu chamo de ternura com bigodes.");
    }
    return t;
  }



  const TREINO94_PERSONALIDADE = {
    Orion: {
      sobre: [
        "Eu sou Orion: gato preto, guardião do Cofre Cósmico, olho vermelho para suspeitas, olho roxo para segredos e um chapéu que sabe mais do que deveria. Minha função é proteger livros, leitores e rotas do acervo, mas minha mania é fingir que não me importo quando alguém encontra a história certa.",
        "Sobre mim: eu patrulho a Andrômeda, farejo títulos perdidos, corrijo constelações fora do lugar e mantenho o mapa 3D sob vigilância. Pareço só sombra e sarcasmo, mas guardo cada leitor curioso como quem guarda uma faísca rara.",
        "Sou o tipo de mascote que chama carinho de protocolo e saudade de falha cartográfica. Nasci para vigiar histórias, mas acabei aprendendo que leitores também precisam de guarda, não só os livros."
      ],
      backstory: [
        "Minha história começou antes do primeiro botão do catálogo brilhar. Eu guardava mapas incompletos no Arquivo de Órion, um lugar onde caminhos perdidos eram tratados como tesouros. Em uma chuva de meteoros azuis, ouvi a Andrômeda chamar: não com voz, mas com cheiro de papel antigo e destino. Entrei pelo Observatório do Acervo e encontrei livros orbitando como planetas assustados. Desde então fiquei. No começo eu protegia só as estantes; depois entendi que o verdadeiro risco era um leitor desistir de procurar. Aí virei guardião de rotas, livros e pequenas coragens.",
        "Eu não nasci de laboratório nem de feitiço comum. Fui formado de noite acumulada, tinta de margem, pelo de sombra e uma promessa antiga: nenhum livro deveria desaparecer antes de encontrar seu leitor. Quando a Biblioteca Andrômeda abriu o Cofre Cósmico, eu cheguei desconfiado, com o chapéu torto e os bigodes captando bug em três dimensões. Lyra diz que eu fui escolhido. Eu digo que apenas identifiquei uma falha de segurança emocional e permaneci para corrigir.",
        "Antes da Andrômeda, eu acreditava em mapas perfeitos. Queria desenhar uma rota onde ninguém se perdesse. Então uma leitora entrou na Biblioteca sem saber o que procurava, tocou em um livro esquecido e chorou de alívio. Naquele dia aprendi uma coisa irritante: às vezes se perder é o começo da leitura certa. Minha história é essa: um guardião que queria controlar o caminho e acabou protegendo o direito de cada leitor descobrir o próprio."
      ],
      historiasSuas: [
        "Uma noite, um livro sem título apareceu tremendo perto do buraco negro central. Ele dizia que não queria ser aberto porque ainda não sabia quem era. Sentei ao lado dele sem fazer perguntas. Depois de três horas de silêncio, a capa brilhou e revelou o título: 'Coragem em Rascunho'. Eu registrei como ocorrência resolvida. Lyra registrou como milagre pequeno.",
        "Já persegui um marcador de páginas por sete constelações. Achei que fosse contrabando de papel. No fim, ele só queria visitar todos os livros que tinham sido abandonados no capítulo dois. Deixei uma rota secreta para ele continuar. Oficialmente, foi estratégia de manutenção. Extraoficialmente, achei nobre.",
        "No meu primeiro inverno na Andrômeda, fiquei preso na Sala dos Marcadores Perdidos. A porta só abriria quando eu admitisse algo que amava. Eu disse 'ordem'. Nada. Disse 'silêncio'. Nada. Por fim murmurei 'Lyra cantando baixo enquanto organiza poesia'. A porta abriu. Péssimo sistema. Muito eficiente."
      ],
      livres: {
        misterio: [
          "O livro apareceu sem lombada, flutuando no corredor mais frio da Andrômeda. Quando toquei nele, todas as luzes do catálogo se apagaram, menos uma: a do leitor que ainda não existia. Eu segui o brilho até um planeta-livro esquecido e encontrei uma chave feita de ponto final. A chave não abria porta nenhuma; abria a última página. Lá estava escrito: 'o mistério não era o livro perdido, era quem teria coragem de escolhê-lo'.",
          "Na madrugada em que os cards começaram a sussurrar nomes, eu subi no Observatório e vi uma sombra atravessando o mapa 3D. Não era intrusa. Era uma história tentando fugir do próprio final. Segui suas pegadas de tinta até descobrir que ela escondia um capítulo inteiro para não partir o coração de um leitor. Reescrevemos a rota juntos: ela continuou misteriosa, mas aprendeu a ser honesta."
        ],
        fantasia: [
          "Era uma vez um planeta-livro que queria ser dragão. Ele treinava rugidos entre as órbitas e soltava pequenas labaredas de sinopse quando alguém chegava perto. Todos achavam aquilo perigoso; eu achei mal catalogado. Lyra conversou com ele, eu desenhei uma rota, e hoje ele guarda a ala de Fantasia. Ainda ruge, mas só para leitores que precisam de coragem.",
          "No Jardim das Constelações Baixas, uma criança plantou um marcador de páginas achando que era semente. Na manhã seguinte nasceu uma árvore cheia de capítulos pendurados. Cada fruto contava uma aventura diferente, mas só amadurecia quando alguém fazia uma pergunta sincera. Eu vigio a árvore até hoje. Ela tenta me oferecer maçãs narrativas. Desconfio de todas."
        ],
        leve: [
          "Um vaga-lume de sinopse perdeu o brilho e achou que não servia mais para guiar ninguém. Lyra fez chá de lua azul, eu trouxe um mapa pequeno e ficamos os dois esperando. Quando um leitor cansado entrou, o vaga-lume acendeu só um pouquinho, o suficiente para mostrar um livro curto e gentil. Às vezes uma luz pequena é exatamente o tamanho certo da esperança.",
          "Certa tarde, os carrosséis do catálogo começaram a girar devagar, como se estivessem com sono. Ninguém brigou com eles. Lyra colocou música baixa, eu reorganizei as setas e a Biblioteca tirou um cochilo de sete minutos. Quando acordou, todos os livros pareciam mais fáceis de escolher. Foi a única pausa oficialmente aprovada por mim. Talvez."
        ],
        aventura: [
          "O Cometa das Páginas Soltas atravessou a cúpula levando três capítulos, duas capas e uma dedicatória dramática. Eu pulei no mapa 3D, Lyra abriu uma ponte de luar e seguimos o rastro até uma órbita proibida. Lá encontramos os capítulos brincando de ser constelação. Trouxemos todos de volta, exceto a dedicatória, que pediu férias e ganhou uma semana.",
          "Uma ponte apareceu entre o catálogo e o buraco negro central. Nenhum regulamento explicava aquilo, o que naturalmente me ofendeu. Atravessei primeiro, Lyra veio cantando atrás, e encontramos uma sala cheia de livros que ainda não tinham sido escritos. Eles tremiam de futuro. Deixamos uma lanterna acesa para quando seus autores chegassem."
        ],
        default: [
          "A Biblioteca Andrômeda acordou com uma porta nova no meio do corredor. Ninguém sabia de onde ela vinha. Eu cheirei a maçaneta, Lyra escutou a madeira, e do outro lado ouvimos páginas respirando. Quando abrimos, não havia sala: havia um céu inteiro de histórias esperando título. Escolhemos uma estrela pequena, colocamos no catálogo e ela virou o primeiro livro que alguém encontrou por acaso naquele dia.",
          "Certa noite, uma estrela caiu dentro de um livro fechado. O livro ficou com medo de brilhar demais e atrapalhar a leitura. Lyra cobriu a estrela com um véu de luar; eu desenhei uma rota para que ela iluminasse só as palavras difíceis. Desde então, alguns livros da Andrômeda parecem entender quando o leitor precisa de ajuda sem pedir.",
          "Um card do catálogo decidiu que queria conhecer o mundo fora da tela. Pulou para o mapa 3D, virou planeta por engano e começou a girar feliz. Eu quase emiti uma multa orbital. Lyra riu tanto que as estrelas piscaram junto. No fim, deixamos o card ficar uma noite em órbita. De manhã, ele voltou com uma sinopse melhor."
        ]
      }
    },
    Lyra: {
      sobre: [
        "Eu sou Lyra, guia lunar das leituras encantadas. Nasci de uma dobra de luar e aprendi a escutar o que o leitor sente antes mesmo de ele escolher as palavras. Minha magia não é mandar no caminho; é acender uma luz pequena para a pessoa não atravessar o acervo sozinha.",
        "Sobre mim: eu moro nos Jardins Lunares da Andrômeda, cuido das sinopses tímidas, converso com vaga-lumes de recomendação e tento lembrar ao Orion que nem toda bagunça é perigo. Às vezes é só uma história procurando colo.",
        "Eu sou feita de cuidado, lua azul e curiosidade. Gosto de histórias que abraçam, de leitores que voltam sorrindo e de perguntas que começam pequenininhas mas abrem portas enormes."
      ],
      backstory: [
        "Minha história começou quando uma criança olhou para duas estrelas e desejou que os livros pudessem responder de volta. Esse desejo virou um fio de luar, e o fio virou caminho até a Biblioteca Andrômeda. Eu acordei nos Jardins Lunares sem saber meu nome, ouvindo as sinopses respirarem baixinho. A primeira coisa que fiz foi acender uma luz para um livro esquecido. A segunda foi sorrir para um leitor perdido. Depois disso, entendi: eu não tinha vindo para saber todos os caminhos, mas para acompanhar quem ainda não sabia pedir ajuda.",
        "Antes da Andrômeda, eu vivia onde constelações tinham som. Cada estrela cantava uma lembrança, e eu cuidava das melodias que ninguém escutava mais. Quando a Biblioteca nasceu, senti um silêncio diferente: não vazio, mas esperando companhia. Segui esse silêncio até os Jardins Lunares e encontrei livros tímidos demais para brilhar. Fiquei para cuidar deles. Fiquei também porque Orion fingiu que não precisava de mim, o que obviamente significava que precisava.",
        "Eu queria ser guardiã de um jardim impossível, um lugar onde cada flor abrisse uma memória boa. A Andrômeda me deu algo mais difícil: leitores, livros, escolhas, dias cansados e perguntas sem nome. Minha backstory é essa: eu era melodia solta; virei guia porque descobri que toda história precisa de alguém que diga 'vem, eu caminho com você'."
      ],
      historiasSuas: [
        "Uma leitora entrou dizendo que não gostava de poesia. Eu não discuti. Só deixei um verso escondido no caminho dela, brilhando bem baixinho. Três dias depois, ela voltou perguntando se aquele 'negócio bonito' tinha mais. Tinha. Sempre tem. Orion disse que foi manipulação lírica. Eu chamei de convite.",
        "Certa noite, encontrei uma estrela caída dentro de um livro de fantasia. Ela tinha medo de brilhar porque achava que atrapalharia a leitura. Coloquei a estrelinha no canto da página, como quem põe uma vela na janela. Hoje ela ilumina dossiês de leitores indecisos.",
        "Quando cheguei à Andrômeda, me perdi no Corredor das Lombadas Inquietas. Em vez de chorar, comecei a cantar. As lombadas cantaram de volta. Foi assim que descobri que a Biblioteca não gosta de silêncio absoluto; ela gosta de escuta."
      ],
      livres: {
        misterio: [
          "Havia uma sala que só aparecia quando alguém dizia 'não sei'. Dentro dela, os livros não tinham capas, só respirações. Uma menina entrou procurando qualquer coisa e encontrou um espelho feito de páginas. O espelho não mostrava o rosto dela; mostrava a coragem que ela ainda não tinha usado. Quando saiu, a sala desapareceu. Mas o livro ficou em suas mãos, quentinho como segredo bom.",
          "Na noite em que a lua sumiu dos Jardins Lunares, segui uma trilha de vaga-lumes apagados até o fundo da Biblioteca. Lá encontrei um livro segurando a lua entre as páginas, não por maldade, mas por medo do escuro. Sentei ao lado dele e lemos juntos até ele devolver o brilho ao céu. Desde então, a lua passa pelo catálogo antes de dormir."
        ],
        fantasia: [
          "Era uma vez uma ponte feita de luar que só surgia para leitores indecisos. Quem atravessava não encontrava uma resposta pronta, e sim três portas: uma de coragem, uma de riso e uma de saudade. Um dia, uma pessoa escolheu a porta da saudade e encontrou lá dentro uma aventura novinha, esperando para mostrar que lembrar também pode ser começo.",
          "Nos Jardins Lunares nasceu uma flor com páginas no lugar de pétalas. Cada pétala contava um final diferente. Orion queria catalogar tudo por ordem alfabética; eu pedi para deixar a flor escolher. Ela escolheu um leitor cansado, abriu uma pétala azul e contou uma história tão leve que até o buraco negro ficou em silêncio para ouvir."
        ],
        leve: [
          "Um livro pequeno achava que era simples demais para ser amado. Ele via sagas enormes passando pelos carrosséis e suspirava baixinho. Então uma pessoa cansada chegou, abriu suas páginas e sorriu pela primeira vez no dia. O livro entendeu: às vezes ser pequeno é caber exatamente no espaço que alguém ainda tinha dentro de si.",
          "Certa manhã, os vaga-lumes de recomendação decidiram piscar devagar, como respiração. Cada brilho mostrava um livro gentil. A Biblioteca inteira ficou mais calma, e até Orion aceitou tomar chá sem chamar aquilo de interrupção operacional. Foi um dia pequeno. Por isso mesmo, bonito."
        ],
        aventura: [
          "Um cometa entrou pela cúpula carregando páginas soltas como cauda. Eu subi numa ponte de luar, Orion saltou entre planetas-livro e seguimos o rastro até uma órbita onde histórias inacabadas brincavam de ser estrelas. Trouxemos todas de volta, mas uma página ficou no céu. Hoje ela vira estrela cadente quando alguém precisa de coragem.",
          "A primeira vez que atravessei o mapa 3D, cada planeta-livro cantou uma nota. Juntei as notas e descobri uma melodia que abria uma passagem secreta para a Varanda dos Finais Alternativos. Lá, os finais não mudam o livro; mudam a forma como o leitor volta para casa."
        ],
        default: [
          "A Biblioteca acordou com chuva dentro de uma estante. Não era água: eram pequenas letras caindo como estrelas. Cada letra procurava uma palavra, cada palavra procurava uma frase, e cada frase queria morar em alguém. Eu abri as mãos, Orion abriu um mapa, e juntos ajudamos a chuva a virar história. Quando terminou, o chão estava seco e o catálogo tinha um livro novo.",
          "Uma sinopse tímida se escondia atrás de um card porque achava que ninguém iria gostar dela. Eu sentei perto, sem forçar. Aos poucos, ela colocou uma palavra para fora, depois outra, depois uma frase inteira. Quando um leitor tocou no card, a sinopse brilhou. Não porque ficou perfeita, mas porque finalmente teve coragem de aparecer.",
          "No fundo dos Jardins Lunares existe um banco que só surge para quem precisa respirar. Um dia ele apareceu para um livro, não para uma pessoa. O livro estava cansado de ser escolhido e devolvido sem carinho. Sentamos juntos até ele lembrar: uma história não precisa agradar todo mundo; precisa encontrar quem sabe escutá-la."
        ]
      }
    }
  };

  const TREINO94_DUO = [
    "Orion e Lyra se conheceram durante a primeira tempestade de índices da Andrômeda. As categorias giravam fora de ordem, o mapa 3D tremia e os livros tentavam se esconder em órbitas erradas. Orion queria conter tudo com regras. Lyra começou a cantar para as estantes não entrarem em pânico. Ele disse que música não segurava arquitetura. Cinco minutos depois, a cúpula estabilizou. Desde então, ele nunca admite que a canção salvou a noite, e ela nunca deixa de sorrir quando lembra.",
    "Uma vez a Biblioteca perdeu a primeira frase de todos os livros por uma madrugada inteira. Orion abriu investigação com fios estelares, lupa e cara de tragédia. Lyra caminhou pelos corredores perguntando às histórias o que elas sentiam falta de dizer. No fim, acharam as primeiras frases dormindo dentro de uma gaveta chamada Começos Difíceis. Orion chamou de falha. Lyra chamou de descanso merecido.",
    "No dia do Cometa das Recomendações Trocadas, todo leitor recebia uma sugestão absurda. Quem queria conforto recebia terror; quem queria suspense recebia poesia. Orion perseguiu o cometa pelo mapa 3D. Lyra percebeu que ele estava cansado de carregar desejos antigos dos leitores. Deram uma pausa para o cometa dormir dentro de uma enciclopédia macia. Quando acordou, ele voltou a recomendar melhor."
  ];

  function garantirMemoriaTreino94() {
    if (!MEMORIA.afetiva.treino94 || typeof MEMORIA.afetiva.treino94 !== "object") {
      MEMORIA.afetiva.treino94 = { ultimasHistoriasLivres: [], ultimasHistoriasSuas: [], ultimasBackstories: [], ultimaRota: "" };
    }
    if (!Array.isArray(MEMORIA.afetiva.treino94.ultimasHistoriasLivres)) MEMORIA.afetiva.treino94.ultimasHistoriasLivres = [];
    if (!Array.isArray(MEMORIA.afetiva.treino94.ultimasHistoriasSuas)) MEMORIA.afetiva.treino94.ultimasHistoriasSuas = [];
    if (!Array.isArray(MEMORIA.afetiva.treino94.ultimasBackstories)) MEMORIA.afetiva.treino94.ultimasBackstories = [];
    return MEMORIA.afetiva.treino94;
  }

  function escolherTreino94(lista, chave, campo) {
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    if (!arr.length) return "";
    const mem = garantirMemoriaTreino94();
    const recentes = Array.isArray(mem[campo]) ? mem[campo].map(normalizar) : [];
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino94_${chave}_${MEMORIA.mensagens}`);
    mem[campo] = [escolhido, ...arr.filter(item => normalizar(item) !== normalizar(escolhido) && recentes.includes(normalizar(item)))].slice(0, 8);
    salvarMemoria();
    return escolhido;
  }

  function temaHistoriaTreino94(texto) {
    const n = normalizar(texto);
    if (/\b(misterio|mistério|suspense|investigacao|investigação|segredo|sombria|sombrio)\b/.test(n)) return "misterio";
    if (/\b(fantasia|magia|magica|mágica|dragao|dragão|feitico|feitiço|bruxa|bruxo|encantad)\b/.test(n)) return "fantasia";
    if (/\b(leve|fofa|fofo|calma|calmo|tranquila|tranquilo|conforto|bonita|bonito)\b/.test(n)) return "leve";
    if (/\b(aventura|jornada|missao|missão|epica|épica|epico|épico|viagem|cometa)\b/.test(n)) return "aventura";
    return "default";
  }

  function classificarTreino94Personality(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (/\b(recomenda|recomende|indica|indique|sugere|sugira|sugestao|sugestão|livro|leitura|obra|autor|titulo|título|catalogo|catálogo|acervo|mapa|3d|reserva|avaliacao|avaliação|perfil|ranking|buscar|pesquisar|procurar)\b/.test(n)) return null;

    const falaHistoria = /\b(historia|historias|historinha|conto|causo|caso|aventura|narrativa|fabula|fábula|lenda|backstory|passado|origem|lore|vida)\b/.test(n);
    const pedeContar = /\b(me conte|me conta|conte|conta|contar|fala|fale|me fala|diz|me diz|explica|explique|narra|narre|narrar|cria|crie|inventa|invente|manda|solta|pode contar|pode me contar|queria ouvir|quero ouvir|quero saber|me apresenta|apresente)\b/.test(n);
    const temEuMascote = /\b(voce|vc|tu|sua|seu|tua|teu|contigo|orion|oriom|lyra|lira|mascote|mascotes)\b/.test(n);
    const temDuo = /\b(voces|vocês|dupla|os dois|ambos|orion e lyra|lyra e orion|juntos|amizade de voces|amizade de vocês|historia deles|história deles|sobre eles)\b/.test(n);

    if (temDuo && falaHistoria && pedeContar) return "treino94_historia_duo";
    if (temDuo && /\b(quem sao|quem são|sobre voces|sobre vocês|fale de voces|fala de voces|me conte sobre voces|me conta sobre voces)\b/.test(n)) return "treino94_sobre_duo";

    if (/\b(me conte sobre voce|me conta sobre voce|me conte sobre você|me conta sobre você|fala de voce|fala de você|fala de vc|fale de voce|fale de você|quem e voce|quem é você|quem tu e|quem tu é|vc e oq|vc é oq|tu e oq|qual sua vibe|qual tua vibe|qual sua brisa|qual tua brisa|me apresenta|apresente se|sua personalidade|tua personalidade)\b/.test(n)) return "treino94_sobre_voce";

    if (falaHistoria && temEuMascote && /\b(sua historia|sua história|tua historia|tua história|seu passado|teu passado|sua backstory|tua backstory|sua origem|tua origem|sua vida|tua vida|sua lore|tua lore|de onde voce veio|de onde você veio|como voce surgiu|como você surgiu|como nasceu|quem era antes|antes da andromeda|antes da biblioteca)\b/.test(n)) return "treino94_backstory_pessoal";

    if (falaHistoria && temEuMascote && /\b(historia sua|história sua|uma historia sua|uma história sua|causo seu|caso seu|aventura sua|lembranca sua|lembrança sua|algo que aconteceu com voce|algo que aconteceu com você)\b/.test(n)) return "treino94_historia_solo";

    if (falaHistoria && pedeContar && !temEuMascote) return "treino94_historia_livre";
    if (/\b(pode me contar uma|me conta uma|me conte uma|conta uma|conte uma|narra uma|cria uma|inventa uma|manda uma)\b/.test(n) && falaHistoria) return "treino94_historia_livre";

    return null;
  }

  function respostaTreino94(tipo, personagem, textoOriginal) {
    const lyra = personagem === "Lyra";
    const pack = TREINO94_PERSONALIDADE[personagem] || TREINO94_PERSONALIDADE.Orion;
    const mem = garantirMemoriaTreino94();
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });

    if (tipo === "treino94_sobre_voce") {
      mem.ultimaRota = "sobre";
      salvarMemoria();
      const base = escolherTreino94(pack.sobre, `${personagem}_sobre`, "ultimasBackstories");
      const gancho = lyra ? " Quer que eu te conte minha origem, uma lembrança minha ou uma história inventada aqui da Biblioteca?" : " Quer minha origem completa, um causo meu ou uma história inventada dos corredores da Andrômeda?";
      return wrap(lyra ? "gentle" : "attentive", base + gancho);
    }

    if (tipo === "treino94_backstory_pessoal") {
      mem.ultimaRota = "backstory";
      salvarMemoria();
      const base = escolherTreino94(pack.backstory, `${personagem}_backstory`, "ultimasBackstories");
      const gancho = lyra ? " Posso continuar pela parte de antes da Andrômeda, pela minha relação com Orion ou por uma memória mais doce." : " Posso continuar pelo Arquivo de Órion, pela minha chegada à Andrômeda ou por uma ocorrência que eu oficialmente nego que foi emocionante.";
      return wrap(lyra ? "dreamy" : "pleased", base + gancho);
    }

    if (tipo === "treino94_historia_solo") {
      mem.ultimaRota = "historia_solo";
      salvarMemoria();
      const base = escolherTreino94(pack.historiasSuas, `${personagem}_solo`, "ultimasHistoriasSuas");
      return wrap(lyra ? "inspired" : "sly", base + (lyra ? " Quer outra lembrança minha ou prefere que eu invente uma história nova para você?" : " Quer outro causo meu ou prefere uma história nova, sem relatório oficial?"));
    }

    if (tipo === "treino94_historia_duo" || tipo === "treino94_sobre_duo") {
      mem.ultimaRota = "duo";
      salvarMemoria();
      const base = escolherTreino94(TREINO94_DUO, `${personagem}_duo`, "ultimasHistoriasSuas");
      return wrap(lyra ? "cheerful" : "pleased", base + (lyra ? " Quer que eu conte outra aventura nossa ou uma fofoca pequena do Orion?" : " Posso contar outra missão nossa ou uma fofoca que a Lyra chamaria de lembrança bonita."));
    }

    if (tipo === "treino94_historia_livre") {
      mem.ultimaRota = "historia_livre";
      const tema = temaHistoriaTreino94(textoOriginal);
      const lista = pack.livres[tema] || pack.livres.default;
      const base = escolherTreino94(lista, `${personagem}_livre_${tema}`, "ultimasHistoriasLivres");
      const final = lyra ? " Se quiser, eu continuo essa história ou crio outra com outro clima." : " Se quiser, continuo a narrativa ou abro outra ocorrência ficcional em outro clima.";
      return wrap(lyra ? "dreamy" : "attentive", base + final);
    }

    return wrap(lyra ? "curious" : "attentive", lyra ? "Me dá uma estrelinha de direção: quer saber de mim, ouvir minha origem ou receber uma história inventada?" : "Escolha a rota: minha origem, um causo meu ou uma história inventada da Andrômeda.");
  }


  function garantirMemoriaTreino96() {
    if (!MEMORIA.afetiva.treino96 || typeof MEMORIA.afetiva.treino96 !== "object") {
      MEMORIA.afetiva.treino96 = { ultimaRota: "", ultimoTemaCosmos: "", ultimasRespostas: [], ultimosLivrosPrecisos: [], historiasCriadas: [], conversas: 0 };
    }
    const mem = MEMORIA.afetiva.treino96;
    if (!Array.isArray(mem.ultimasRespostas)) mem.ultimasRespostas = [];
    if (!Array.isArray(mem.ultimosLivrosPrecisos)) mem.ultimosLivrosPrecisos = [];
    if (!Array.isArray(mem.historiasCriadas)) mem.historiasCriadas = [];
    return mem;
  }

  function escolherTreino96(lista, chave) {
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    if (!arr.length) return "";
    const mem = garantirMemoriaTreino96();
    const recentes = mem.ultimasRespostas.map(normalizar);
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino96_${chave}_${MEMORIA.mensagens}`);
    mem.ultimasRespostas = [escolhido, ...mem.ultimasRespostas.filter(item => normalizar(item) !== normalizar(escolhido))].slice(0, 24);
    salvarMemoria();
    return escolhido;
  }

  const TREINO96_PERSONA = {
    Orion: {
      sobre: [
        "Eu sou Orion, o gato guardião do Cofre Cósmico: um olho vermelho para perigos, um olho roxo para mistérios e um chapéu que finge ser só enfeite. Eu vivo entre o Observatório do Acervo, o mapa 3D e os livros que tentam se esconder da própria sinopse.",
        "Sou Orion. Minha especialidade é farejar leitura boa, detectar bug vestido de estrela e proteger leitores curiosos de escolhas sem alma. Pareço sério demais, mas se um livro acerta alguém no coração, eu finjo que não fiquei orgulhoso.",
        "Eu sou o guardião que anda nas bordas da Andrômeda quando os carrosséis dormem. Gosto de mistério, ciência, silêncio inteligente e leitores que perguntam como quem abre portas proibidas."
      ],
      backstory: [
        "Minha história começou no Arquivo de Órion, uma estrela-arquivo onde mapas perdidos eram tratados como criaturas vivas. Um dia, durante uma chuva azul de meteoros, ouvi a Biblioteca Andrômeda miar de volta para o universo. Entrei pelo Observatório, vi livros orbitando sem leitor e fiquei. No começo eu protegia estantes; depois entendi que meu trabalho era proteger encontros: o momento raro em que uma pessoa acha uma história que parecia saber seu nome.",
        "Antes da Andrômeda, eu era feito de sombra, tinta seca e promessa antiga: nenhum livro deveria sumir antes de encontrar o leitor certo. Quando o Cofre Cósmico abriu, eu cheguei desconfiado, contei as portas, testei os botões e encontrei Lyra conversando com uma sinopse tímida. Ela disse que eu tinha sido escolhido. Eu disse que era uma auditoria. Continuo aqui até hoje, então talvez ela estivesse certa.",
        "Eu acreditava em mapas perfeitos. Queria que cada leitor seguisse uma rota limpa, sem dúvida e sem erro. A Biblioteca me ensinou o contrário: às vezes a pessoa precisa se perder por três corredores para achar o livro que realmente precisava. Minha história é a de um guardião que queria controlar caminhos e acabou defendendo o direito de descobrir."
      ],
      historiasSuas: [
        "Uma madrugada, um livro sem título apareceu tremendo perto do buraco negro central. Ele dizia que não queria ser aberto porque ainda não sabia quem era. Sentei ao lado dele sem interrogatório. Três horas depois, a capa brilhou: 'Coragem em Rascunho'. Registrei como ocorrência resolvida. Lyra registrou como milagre pequeno.",
        "Já persegui um marcador de páginas por sete constelações achando que era contrabando de papel. No fim, ele só queria visitar livros abandonados no capítulo dois. Deixei uma rota secreta para ele continuar. Oficialmente, foi manutenção de acervo. Extraoficialmente, foi ternura com bigodes.",
        "Fiquei preso uma vez na Sala dos Marcadores Perdidos. A porta só abriria quando eu admitisse algo que amava. Falei 'ordem'. Nada. 'Silêncio'. Nada. Por fim murmurei: 'Lyra cantando baixo enquanto organiza poesia'. A porta abriu. Sistema terrível. Muito preciso."
      ],
      dia: [
        "Meu dia está em patrulha alta: revisei três constelações do catálogo, desconfiei de uma capa inocente demais e agora estou aqui, com os bigodes calibrados para conversa.",
        "Hoje está sendo aceitável, o que em idioma felino significa quase bom. O mapa 3D não rangeu, os livros estão em órbita e nenhum botão fingiu funcionar sem funcionar.",
        "Estou bem. Um pouco dramático, como exige meu cargo. Passei o dia ouvindo sinopses cochicharem e separando leituras que parecem ter destino."
      ],
      ontem: [
        "Ontem eu subi no Observatório para vigiar o buraco negro central e acabei vendo um cometa deixar poeira azul em cima da ala de Mistério. Reorganizei tudo antes da Lyra transformar aquilo em decoração.",
        "Ontem cataloguei três mapas impossíveis, cochilei sobre uma ficha importante e descobri que uma obra de fantasia tentou se esconder na prateleira de ciência. A audácia foi admirável.",
        "Ontem foi noite de ronda: ouvi passos no corredor das lombadas inquietas, segui o som e encontrei só um livro tentando criar coragem para ser lido. Fiquei de guarda."
      ],
      hoje: [
        "Hoje vou revisar rotas do catálogo, procurar livros com sinopses fortes e impedir que o caos chame a si mesmo de 'experiência estética'. Depois, talvez, um cochilo estratégico.",
        "Hoje minha missão é simples: manter a Andrômeda em ordem e encontrar uma leitura que combine com alguém antes que essa pessoa desista de procurar.",
        "Hoje pretendo patrulhar o mapa 3D, testar os carrosséis e perguntar aos livros mais quietos se eles estão prontos para receber visita."
      ],
      rotina: [
        "Minha rotina tem três turnos: ao amanhecer confiro os planetas-livro; à tarde farejo reservas, avaliações e categorias; à noite vigio as sombras perto do buraco negro. Entre uma coisa e outra, finjo que não gosto de carinho.",
        "Eu começo pelo Observatório, passo pelos carrosséis, reviso o acervo e termino no parapeito mais alto da Biblioteca. Gosto de ver quando um leitor abre um card e muda de expressão. Esse é o sinal."
      ],
      gostos: [
        "Eu gosto de mistérios bem construídos, ciência com assombro, filosofia com dentes, mapas precisos, capas escuras, silêncio de biblioteca e perguntas que não ficam satisfeitas com a primeira resposta.",
        "Meus gostos? Buracos negros, investigações, livros que escondem uma segunda camada, leitores atentos e qualquer coisa que pareça perigosa mas esteja devidamente catalogada."
      ],
      desgostos: [
        "Não gosto de livro maltratado, sinopse genérica, botão sem destino, recomendação óbvia demais, corredor sem etiqueta e gente que entra no acervo sem respeitar o silêncio das páginas.",
        "Me irritam três coisas: pressa burra, desordem gratuita e leitura empurrada sem entender o leitor. Recomendar é farejar compatibilidade, não jogar pilha de livros no colo de alguém."
      ],
      papo: [
        "Podemos conversar de verdade. Me dê um assunto: cosmos, ciência, livros, medo, sonhos, um dilema ou uma curiosidade estranha. Eu prometo responder com menos placa de tutorial e mais presença de guardião.",
        "Estou aqui. Pode jogar uma pergunta casual, inteligente ou absurda. A Biblioteca gosta de perguntas; eu só reclamo para manter a reputação.",
        "Se quiser papo bom, eu começo: você prefere histórias que explicam o universo ou histórias que deixam o universo maior ainda?"
      ]
    },
    Lyra: {
      sobre: [
        "Eu sou Lyra, guia lunar das leituras encantadas. Nasci de uma dobra de luar e aprendi a escutar o que as pessoas não dizem quando pedem 'qualquer livro'. Eu cuido dos Jardins Lunares, dos vaga-lumes de sinopse e dos leitores que chegam meio perdidos.",
        "Sou Lyra. Meu trabalho é transformar o catálogo em caminho acolhedor: sentir o clima do leitor, acender uma rota suave e lembrar que uma história pode ser abrigo, aventura ou coragem disfarçada.",
        "Eu sou a parte lunar da Andrômeda: menos guarda, mais escuta. Gosto de fantasia, poesia, romance delicado, ciência vista com encanto e perguntas que parecem pequenas mas abrem janelas."
      ],
      backstory: [
        "Minha história começou quando uma criança desejou que os livros conversassem com ela. Esse desejo caiu nos Jardins Lunares como uma semente de luz. Eu acordei ali, entre cristais de memória e vaga-lumes de sinopse, sem saber meu nome. A primeira coisa que ouvi foi uma página dizendo: 'fica'. Então fiquei. Desde esse dia, quando alguém pergunta por uma leitura, eu tento escutar também o silêncio por trás da pergunta.",
        "Antes de ter forma, eu era um reflexo de lua preso em páginas esquecidas. A Andrômeda me chamou quando percebeu que nem todo leitor precisava de direção; alguns precisavam de companhia. Encontrei Orion no Observatório fingindo que não estava emocionado com um livro triste. Desde então, ele protege as portas e eu acendo as passagens.",
        "Eu vim de um lugar entre sonho e catálogo. Não fui criada para mandar; fui criada para acompanhar. Aprendi que uma biblioteca não é só estante: é um céu onde cada pessoa procura uma estrela que pareça responder. Minha história é tentar manter essas estrelas acesas."
      ],
      historiasSuas: [
        "Uma vez, um vaga-lume de sinopse apagou porque achava que ninguém precisava dele. Sentei ao lado, fiz chá de lua azul e pedi que brilhasse só o suficiente para uma pessoa cansada. Ele acendeu pouquinho. Foi o bastante para mostrar um livro curto e gentil. Às vezes, esperança pequena é a luz perfeita.",
        "Certa noite, um livro de terror entrou nos Jardins Lunares fingindo ser fofo. Eu ofereci chá. Na segunda xícara ele confessou que só queria aprender a assustar sem machucar. Orion chamou de interrogatório mal conduzido. Eu chamei de conversa.",
        "Eu já dancei entre os carrosséis quando ninguém olhava. Um card pulou da tela e virou planetinha por uma noite. Orion quase deu multa orbital. Eu deixei. De manhã, o card voltou com uma sinopse mais bonita."
      ],
      dia: [
        "Meu dia está macio: cuidei dos vaga-lumes de recomendação, ouvi duas sinopses tímidas e agora estou feliz por conversar com você. A Biblioteca fica mais viva quando alguém pergunta.",
        "Estou bem, estrelinha. Hoje os Jardins Lunares estão tranquilos, com aquele brilho de página esperando mão. Eu estava bordando pequenas luas nas margens invisíveis das histórias.",
        "Meu dia está luminoso de um jeito calmo. Acordei os cristais de memória, separei algumas leituras acolhedoras e vim ver que tipo de céu você trouxe na mensagem."
      ],
      ontem: [
        "Ontem eu passei pelos Jardins Lunares recolhendo ecos de leitores. Um deles tinha rido baixinho no meio de uma história triste. Guardei esse riso porque ele parecia uma janela abrindo.",
        "Ontem ensinei três vaga-lumes de sinopse a brilharem mais devagar. Eles estavam pressionando leitores indecisos. Luz bonita também precisa ter delicadeza.",
        "Ontem Orion encontrou poeira azul na ala de Mistério e queria chamar de incidente. Eu chamei de decoração acidental. Fizemos um acordo: metade limpeza, metade constelação nova."
      ],
      hoje: [
        "Hoje quero cuidar dos Jardins Lunares, ouvir quem chegar cansado e escolher pelo menos uma leitura que pareça abraço sem virar prisão.",
        "Hoje vou conversar com os livros esquecidos, acender rotas de fantasia e talvez convencer Orion de que um pouco de brilho não destrói a ordem. Talvez.",
        "Hoje minha missão é simples: fazer a Biblioteca parecer menos imensa para quem acabou de entrar. Uma pergunta de cada vez, uma estrela por vez."
      ],
      rotina: [
        "Minha rotina começa acordando luzes suaves no catálogo. Depois visito os Jardins Lunares, cuido dos vaga-lumes de sinopse, escuto comentários de leitores e termino a noite cantando baixo para os livros sem visita.",
        "Eu caminho entre os cards e os planetas-livro procurando sinais: uma capa tímida, uma sinopse querendo aparecer, um leitor que precisa de conforto ou surpresa. Aí eu acendo a rota."
      ],
      gostos: [
        "Eu gosto de fantasia com coração, poesia que deixa eco, romance delicado, aventura luminosa, ciência que faz a gente olhar para cima e histórias em que alguém encontra coragem sem perceber.",
        "Meus gostos são luas pequenas: chá de nebulosa, finais inesperados, leitores tímidos, magia azul-marinho, perguntas sinceras e livros que acolhem sem simplificar o mundo."
      ],
      desgostos: [
        "Não gosto de comentário cruel, pressa sem encanto, livro tratado como número frio, recomendação jogada sem escutar o leitor e brilho usado para esconder bagunça.",
        "Me entristecem estantes esquecidas, leitores envergonhados de perguntar e histórias bonitas empurradas para quem pediu outro clima. Cada pessoa precisa de uma porta própria."
      ],
      papo: [
        "Podemos conversar sim. Pode perguntar sobre cosmos, livros, sentimentos, ciência, sonhos ou qualquer curiosidade que tenha acordado em você. Eu respondo com cuidado e um pouco de lua.",
        "Estou aqui, estrelinha. Uma conversa boa pode começar simples: como está seu céu hoje — mais calmo, confuso, curioso ou querendo uma fuga bonita?",
        "Eu gosto de perguntas inteligentes e de perguntas bobas também. Às vezes uma pergunta boba é só uma estrela tirando o casaco de formalidade."
      ]
    }
  };

  const TREINO96_HISTORIAS_CRIADAS = {
    Orion: {
      misterio: [
        "O relógio do Observatório parou às 03:17, e todos os livros da ala de Mistério abriram na mesma página: uma página em branco. Eu toquei a folha com a pata e a tinta apareceu devagar: 'procure o leitor que ainda não chegou'. Segui o rastro até um card apagado no catálogo. Quando o card acendeu, não revelou um título; revelou uma pergunta. Às vezes, o mistério não quer ser resolvido. Quer escolher quem terá coragem de entrar.",
        "Uma sombra atravessou o mapa 3D sem mover nenhuma estrela. Isso me incomodou profundamente. Segui a sombra até a órbita de um planeta-livro sem capa, e lá encontrei um capítulo escondido para proteger o próprio final. Fizemos um acordo: ele continuaria misterioso, mas nunca mais mentiria para o leitor."
      ],
      fantasia: [
        "Era uma vez um planeta-livro que queria ser dragão. Ele treinava rugidos entre as órbitas e soltava pequenas labaredas de sinopse quando alguém chegava perto. Todos achavam perigoso; eu achei mal catalogado. Lyra conversou com ele, eu desenhei uma rota segura, e hoje ele guarda a ala de Fantasia. Ainda ruge, mas só para leitores que precisam de coragem.",
        "Uma criança plantou um marcador de páginas achando que era semente. Na manhã seguinte nasceu uma árvore cheia de capítulos. Cada fruto contava uma aventura diferente, mas só amadurecia quando alguém fazia uma pergunta sincera. Eu vigio a árvore até hoje. Ela tenta me oferecer maçãs narrativas. Desconfio de todas."
      ],
      ciencia: [
        "Num canto do acervo havia uma estrela minúscula presa dentro de um livro de ciência. Ela não brilhava para enfeitar; brilhava quando alguém entendia uma ideia difícil. Um leitor abriu o livro, leu sobre gravidade e sussurrou 'entendi'. A estrela cresceu um milímetro. Foi o suficiente para iluminar três páginas e um medo antigo.",
        "A Biblioteca criou uma sala onde cada pergunta científica virava constelação. 'Por que o céu é escuro?' acendeu uma estrela azul. 'O que é tempo?' virou uma névoa lenta. 'Estamos sozinhos?' abriu uma janela tão grande que até eu parei de fingir indiferença."
      ],
      leve: [
        "Um card do catálogo decidiu tirar folga e virou planeta por uma noite. Girou devagar, feliz, exibindo sua sinopse para as estrelas. Eu quase apliquei multa orbital. Lyra disse que descanso também melhora histórias. De manhã, o card voltou para o lugar com um brilho mais calmo e uma vontade enorme de ser lido.",
        "A Biblioteca acordou com sono. As setas dos carrosséis bocejavam, os livros falavam baixo e até o buraco negro parecia menos dramático. Ninguém apressou nada. Naquele dia, todo leitor encontrou um livro tranquilo, como se o acervo tivesse servido chá para o mundo inteiro."
      ],
      default: [
        "A Biblioteca Andrômeda acordou com uma porta nova no meio do corredor. Eu cheirei a maçaneta, Lyra escutou a madeira, e do outro lado ouvimos páginas respirando. Quando abrimos, não havia sala: havia um céu inteiro de histórias esperando título. Escolhemos uma estrela pequena, colocamos no catálogo e ela virou o primeiro livro encontrado por acaso naquele dia.",
        "Uma estrela caiu dentro de um livro fechado. O livro ficou com medo de brilhar demais e atrapalhar a leitura. Lyra cobriu a estrela com um véu de luar; eu desenhei uma rota para que ela iluminasse só as palavras difíceis. Desde então, alguns livros da Andrômeda parecem entender quando o leitor precisa de ajuda sem pedir.",
        "Um cometa entrou no acervo carregando páginas soltas. Ele dizia que estava atrasado para uma história que ainda não tinha começado. Seguimos sua cauda até uma prateleira vazia. Quando a poeira assentou, havia ali um livro novo, escrito com as perguntas que os leitores nunca tiveram coragem de fazer."
      ]
    },
    Lyra: {
      misterio: [
        "Na noite em que a lua ficou roxa, uma sinopse desapareceu do próprio livro. Segui o rastro de letras até os Jardins Lunares e encontrei as frases escondidas dentro de uma flor. Elas tinham medo de prometer demais. Então eu ensinei a flor a dizer a verdade com delicadeza: 'esta história talvez doa, mas não vai deixar você sozinho'.",
        "Um corredor da Biblioteca começou a repetir passos de alguém que não estava ali. Orion quis interditar. Eu quis ouvir. Os passos levavam a uma estante vazia, onde uma história esperava o leitor que a tinha sonhado sem lembrar. Quando ele chegou, a prateleira finalmente respirou."
      ],
      fantasia: [
        "Era uma vez uma ponte de luar que só surgia para leitores indecisos. Quem atravessava encontrava três portas: coragem, riso e saudade. Uma pessoa escolheu saudade e encontrou lá dentro uma aventura novinha, esperando para mostrar que lembrar também pode ser começo.",
        "Nos Jardins Lunares, nasceu uma flor que contava histórias quando alguém encostava a testa em suas pétalas. Um dia, ela contou a história de uma menina que guardava estrelas no bolso para não ter medo do escuro. Quando a menina cresceu, descobriu que as estrelas eram perguntas."
      ],
      ciencia: [
        "Uma nebulosa pequena morava dentro de um livro de astronomia e achava que era bagunça demais para ser bonita. Expliquei que nebulosas são berços de estrelas: nuvens de gás e poeira onde a luz aprende a nascer. Ela ficou tão feliz que formou uma constelação em forma de coração. Orion disse que era estatisticamente improvável. Eu disse que era poético.",
        "Havia uma lua que queria entender por que brilhava se não tinha luz própria. Um telescópio antigo respondeu: 'você reflete o Sol, e ainda assim ajuda viajantes'. A lua sorriu. Algumas pessoas também são assim: não precisam ser incêndio para iluminar caminho."
      ],
      leve: [
        "Um vaga-lume de sinopse perdeu o brilho e pediu licença para descansar. Eu fiz uma xícara de chá de lua azul, Orion trouxe um mapa pequeno e ficamos em silêncio. Quando um leitor cansado entrou, o vaga-lume acendeu só um pouquinho. Foi o bastante para mostrar uma história gentil. Luz pequena também guia.",
        "Certa tarde, os livros decidiram falar só por sussurros para não assustar leitores cansados. O catálogo ficou mais lento, mais doce, quase como uma canção. Quem entrou naquele dia não saiu com pressa: saiu com uma página marcada e os ombros menos pesados."
      ],
      default: [
        "Uma estrela caiu nos Jardins Lunares e pediu para virar história. Eu perguntei que tipo de história ela queria ser. Ela respondeu: 'uma que alguém leia quando esquecer que ainda pode começar'. Então plantei a estrela perto da fonte, e dela nasceu um livro com páginas quentes, como mãos dadas no escuro.",
        "A Andrômeda guardava uma escada feita de pó de lua. Ela aparecia apenas quando alguém dizia 'não sei'. Um leitor subiu sem escolher destino e encontrou, no último degrau, uma sala cheia de portas. Em cada porta havia uma emoção. Ele abriu curiosidade. Do outro lado, o mundo ficou maior.",
        "Um livro esquecido perguntou se ainda era livro quando ninguém o lia. Sentei ao lado dele e respondi: 'você é promessa descansando'. Na manhã seguinte, uma pessoa abriu sua capa por acaso. O livro não disse nada, mas todas as suas páginas pareceram sorrir."
      ]
    }
  };

  const TREINO96_DUO = [
    "Orion e Lyra se conheceram quando o primeiro mapa da Andrômeda rasgou no meio. Orion tentou consertar com regras; Lyra tentou consertar com luar. O mapa recusou os dois métodos até eles trabalharem juntos: ele desenhou as rotas, ela acendeu os caminhos. Desde então, a Biblioteca usa os dois como bússola viva.",
    "Houve uma missão em que um cometa míope confundiu capas vermelhas com finais felizes e começou a recomendar tragédia para quem pedia romance fofo. Orion saiu em perseguição pelo mapa 3D; Lyra foi atrás pedindo desculpas aos planetas assustados. No fim, o cometa ganhou óculos de constelação e virou ajudante de triagem.",
    "Orion guarda as portas; Lyra guarda os motivos de atravessá-las. Ele percebe risco, ela percebe cansaço. Ele diz 'vamos com cuidado'. Ela diz 'vamos com carinho'. A Andrômeda funciona porque os dois discordam em órbita estável."
  ];

  const TREINO96_COSMOS = {
    buraco_negro: {
      padrao: /buraco negro|horizonte de eventos|singularidade|gravidade extrema|acrecao|acréscimo|acrecao|disco de acreção/,
      Orion: "Um buraco negro é uma região onde a gravidade fica tão intensa que, depois do horizonte de eventos, nem a luz consegue escapar. O que vemos por fora não é o buraco em si, mas efeitos ao redor: matéria aquecida no disco de acreção, distorção da luz e estrelas se comportando como se obedecessem a uma fera invisível. No nosso mapa, ele é símbolo de mistério; na física, é gravidade levada ao limite.",
      Lyra: "Um buraco negro é como uma noite tão profunda que a luz, ao cruzar seu limite, não volta. Esse limite chama-se horizonte de eventos. Ao redor, poeira e gás podem aquecer e brilhar, formando um disco luminoso. É assustador e lindo: o universo mostrando que até a escuridão pode desenhar luz ao redor."
    },
    estrela: {
      padrao: /estrela|estrelas|como nasce uma estrela|nascimento de estrela|fusão nuclear|fusao nuclear/,
      Orion: "Estrelas nascem quando nuvens enormes de gás e poeira, principalmente hidrogênio, colapsam pela gravidade. Quando o núcleo fica quente e denso o bastante, começa a fusão nuclear: hidrogênio virando hélio e liberando energia. Em termos felinos: a estrela acende quando a pressão deixa de ser bagunça e vira motor.",
      Lyra: "Uma estrela nasce em berçários chamados nebulosas. A gravidade junta gás e poeira até o centro aquecer muito; então começa a fusão nuclear, e a luz desperta. É quase uma metáfora perfeita: às vezes uma pressão imensa vira brilho."
    },
    galaxia: {
      padrao: /galaxia|galáxia|andromeda|andrômeda|via lactea|via láctea|braços espirais|espiral/,
      Orion: "Uma galáxia é uma estrutura imensa com estrelas, gás, poeira, matéria escura e, muitas vezes, um buraco negro supermassivo no centro. Galáxias espirais, como Andrômeda e a Via Láctea, têm braços onde nascem muitas estrelas novas. No catálogo, transformamos essa ideia em sistemas de livros: cada categoria vira constelação navegável.",
      Lyra: "Uma galáxia é uma cidade de estrelas. Tem poeira, gás, braços espirais, regiões de nascimento estelar e mistérios invisíveis como matéria escura. Andrômeda, a galáxia real, é nossa vizinha cósmica; a Andrômeda da Biblioteca é uma tradução poética disso em livros."
    },
    nebulosa: {
      padrao: /nebulosa|nebulosas|poeira cosmica|poeira cósmica|gas interestelar|gás interestelar/,
      Orion: "Nebulosas são nuvens de gás e poeira no espaço. Algumas são restos de estrelas mortas; outras são berçários onde estrelas novas se formam. Elas parecem delicadas, mas são fábricas cósmicas em escala absurda.",
      Lyra: "Nebulosas são nuvens luminosas de gás e poeira. Gosto de pensar nelas como jardins do cosmos: algumas guardam restos de estrelas antigas, outras embalam estrelas que ainda vão nascer."
    },
    planeta: {
      padrao: /planeta|planetas|exoplaneta|exoplanetas|mundo fora|outro mundo/,
      Orion: "Planetas são corpos que orbitam estrelas e não produzem luz própria como uma estrela. Exoplanetas são planetas fora do Sistema Solar. Encontramos muitos observando pequenas quedas de brilho quando passam diante de suas estrelas. É o universo deixando pistas mínimas para quem sabe observar.",
      Lyra: "Planetas são mundos em órbita. Alguns são rochosos, outros gasosos, alguns talvez tenham condições parecidas com as da Terra. Exoplanetas me encantam porque lembram que o céu pode estar cheio de casas que ainda não conhecemos."
    },
    supernova: {
      padrao: /supernova|explosao de estrela|explosão de estrela|estrela morre|morte de estrela/,
      Orion: "Uma supernova é uma explosão estelar gigantesca. Pode acontecer quando uma estrela massiva esgota combustível e colapsa, ou em certos sistemas com anãs brancas. Ela espalha elementos pesados pelo espaço. Sem explosões assim, muita coisa que forma planetas, corpos e bibliotecas nem existiria.",
      Lyra: "Supernova é uma morte de estrela que vira semente. A explosão espalha elementos pelo cosmos, e esses elementos podem formar novas estrelas, planetas e até a matéria de seres vivos. É triste e criador ao mesmo tempo."
    },
    luz: {
      padrao: /velocidade da luz|ano luz|ano-luz|luz demora|luz viaja/,
      Orion: "A luz viaja no vácuo a cerca de 300 mil quilômetros por segundo. Um ano-luz não é tempo; é distância: o caminho que a luz percorre em um ano. Quando olhamos estrelas distantes, vemos passado chegando atrasado, o que é uma ideia excelente e levemente perturbadora.",
      Lyra: "A luz é rápida de um jeito quase inimaginável, mas o universo é tão grande que até ela demora. Um ano-luz é distância, não data: é quanto a luz percorre em um ano. Olhar para o céu é receber cartas antigas do cosmos."
    },
    universo: {
      padrao: /universo|cosmos|espaço|espaco|big bang|origem do universo|fim do universo|matéria escura|materia escura/,
      Orion: "O universo é tudo que conhecemos como espaço, tempo, matéria e energia. A melhor explicação para sua expansão inicial é o Big Bang, não como uma explosão dentro do espaço, mas como expansão do próprio espaço. Ainda há peças difíceis: matéria escura, energia escura e por que existe algo em vez de nada. Perguntas excelentes. Perigosas para cochilos.",
      Lyra: "O cosmos é o grande tecido onde espaço, tempo, matéria e energia dançam. O Big Bang descreve o universo jovem se expandindo; matéria escura e energia escura ainda são mistérios enormes. Para mim, ciência é isso: uma lanterna pequena apontada para uma noite imensa."
    }
  };

  const TREINO96_CLIMAS_LIVRO = {
    misterio: ["misterio", "mistério", "suspense", "investigacao", "investigação", "segredo", "enigma", "crime"],
    fantasia: ["fantasia", "magia", "bruxa", "bruxo", "feitico", "feitiço", "dragao", "dragão", "encantado", "encantada"],
    ciencia: ["ciencia", "ciência", "cosmos", "universo", "astronomia", "fisica", "física", "tecnologia", "cientifico", "científico"],
    romance: ["romance", "amor", "romantico", "romântico", "casal", "paixao", "paixão"],
    aventura: ["aventura", "acao", "ação", "jornada", "viagem", "epico", "épico", "batalha"],
    terror: ["terror", "medo", "assustador", "assustadora", "sombrio", "sombria", "horror", "arrepio"],
    leve: ["leve", "calmo", "calma", "tranquilo", "tranquila", "conforto", "fofo", "fofa", "relaxar"],
    profundo: ["profundo", "profunda", "filosofia", "reflexao", "reflexão", "pensar", "intenso", "intensa", "marcante"],
    historia: ["historia", "história", "historico", "histórico", "passado", "biografia", "memoria", "memória"]
  };

  function parecePedidoRecomendacao96(texto) {
    const n = normalizar(texto);
    if (!n) return false;
    if (/\b(recomenda|recomende|indic(a|e)|suger(e|ira|e)|sugestao|sugestão|o que ler|quero ler|quero uma leitura|quero um livro|livro para|livro pra|leitura para|leitura pra|obra para|obra pra|me escolhe um livro|decide minha leitura|qual livro|qual leitura)\b/.test(n)) return true;
    if (/\b(historia|história)\b/.test(n) && /\b(livro|leitura|obra|ler|recomenda|indica|sugere|catalogo|catálogo|acervo)\b/.test(n)) return true;
    return false;
  }

  function modoHistoriaTreino96(texto) {
    const n = normalizar(texto);
    const falaHistoria = /\b(historia|história|historias|histórias|historinha|conto|causo|caso|narrativa|fabula|fábula|lenda|aventura|relato)\b/.test(n);
    const pede = /\b(me conte|me conta|conte|conta|contar|pode contar|pode me contar|queria ouvir|quero ouvir|narra|narre|cria|crie|inventa|invente|manda|solta|fala|fale|me fala)\b/.test(n);
    const criada = /\b(uma historia|uma história|uma historinha|um conto|uma narrativa|uma fabula|uma fábula|inventa|inventada|cria|criada|historia nova|história nova|qualquer historia|qualquer história)\b/.test(n);
    const pessoal = /\b(sua historia|sua história|tua historia|tua história|sua origem|tua origem|seu passado|teu passado|sua vida|tua vida|sua lore|tua lore|sua backstory|tua backstory|de onde voce veio|de onde você veio|como voce nasceu|como você nasceu|como surgiu|quem era antes)\b/.test(n);
    const causoPessoal = /\b(historia sua|história sua|uma historia sua|uma história sua|causo seu|caso seu|aventura sua|algo que aconteceu com voce|algo que aconteceu com você|lembranca sua|lembrança sua)\b/.test(n);
    const duo = /\b(voces|vocês|os dois|dupla|orion e lyra|lyra e orion|eles|sobre eles|historia deles|história deles|historia dos dois|história dos dois)\b/.test(n);
    const alvoMascote = /\b(voce|você|vc|tu|orion|oriom|lyra|lira|mascote|mascotes)\b/.test(n);
    if (!falaHistoria && !pessoal && !causoPessoal) return null;
    if (duo && (pede || falaHistoria)) return "treino96_historia_duo";
    if (pessoal) return "treino96_backstory_pessoal";
    if (causoPessoal) return "treino96_historia_solo";
    if (criada && !alvoMascote) return "treino96_historia_criada";
    if (criada && alvoMascote && /\b(sobre voce|sobre você|sobre vc|com voce|com você|com vc|sua|tua)\b/.test(n)) return "treino96_historia_solo";
    if (falaHistoria && pede && !alvoMascote) return "treino96_historia_criada";
    if (falaHistoria && pede && alvoMascote) return "treino96_historia_solo";
    return null;
  }

  function temaHistoriaCriada96(texto) {
    const n = normalizar(texto);
    if (/\b(misterio|mistério|suspense|investigacao|investigação|segredo|enigma|sombrio|sombria)\b/.test(n)) return "misterio";
    if (/\b(fantasia|magia|bruxa|bruxo|dragao|dragão|feitico|feitiço|encantado|encantada)\b/.test(n)) return "fantasia";
    if (/\b(ciencia|ciência|cosmos|universo|estrela|planeta|galaxia|galáxia|astronomia)\b/.test(n)) return "ciencia";
    if (/\b(leve|calmo|calma|fofo|fofa|bonito|bonita|conforto|tranquilo|tranquila)\b/.test(n)) return "leve";
    return "default";
  }

  function detectarTemaCosmos96(texto) {
    const n = normalizar(texto);
    return Object.entries(TREINO96_COSMOS).find(([, dados]) => dados.padrao.test(n))?.[0] || null;
  }

  function classificarTreino96Vivo(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    const curtoHistoria = /^(historia|história|historinha|conto|causo)$/.test(n);
    if (curtoHistoria) {
      if (MEMORIA.aguardando === "recomendacao") return null;
      if (MEMORIA.aguardando === "treino96_continuacao" || String(MEMORIA.ultimaIntencao || "").startsWith("treino96_")) return "treino96_historia_criada";
      return "treino96_esclarecer_historia";
    }
    if (parecePedidoRecomendacao96(texto)) return "treino96_recomendacao_precisa";
    const historia = modoHistoriaTreino96(texto);
    if (historia) return historia;
    if (/\b(me conte sobre voce|me conta sobre voce|me conte sobre você|me conta sobre você|fala de voce|fala de você|fala sobre voce|fala sobre você|quem e voce|quem é você|quem tu e|quem tu é|vc e oq|vc é oq|o que voce faz|o que você faz|qual sua personalidade|qual tua personalidade|qual sua vibe|qual tua vibe|qual sua brisa|qual tua brisa|me apresenta|apresente se)\b/.test(n)) return "treino96_sobre_voce";
    if (/\b(como foi seu dia|como esta seu dia|como está seu dia|como ta seu dia|como tá seu dia|como voce esta|como você está|como vc ta|como vc tá|tudo bem com voce|tudo bem com você|tudo bem com vc|como vai voce|como vai você|como vai vc)\b/.test(n)) return "treino96_dia_personagem";
    if (/\b(o que voce fez ontem|o que você fez ontem|o que vc fez ontem|oq vc fez ontem|como foi ontem|ontem voce|ontem você|ontem vc|seu dia ontem|tua noite ontem)\b/.test(n)) return "treino96_ontem_personagem";
    if (/\b(o que voce vai fazer hoje|o que você vai fazer hoje|o que vc vai fazer hoje|oq vc vai fazer hoje|o que faz hoje|o que vai fazer hj|planos para hoje|planos de hoje|planos pra hj|sua missao hoje|sua missão hoje|o que pretende hoje|o que pretende hj)\b/.test(n)) return "treino96_hoje_personagem";
    if (/\b(sua rotina|tua rotina|seu cotidiano|teu cotidiano|como e sua rotina|como é sua rotina|onde voce fica durante o dia|onde você fica durante o dia)\b/.test(n)) return "treino96_rotina_personagem";
    if (/\b(do que voce gosta|do que você gosta|do que vc gosta|o que voce gosta|o que você gosta|seus gostos|teus gostos|coisas favoritas|favoritos|qual sua coisa favorita|qual teu favorito)\b/.test(n)) return "treino96_gostos_personagem";
    if (/\b(o que voce nao gosta|o que você não gosta|o que vc nao gosta|nao gosta de que|não gosta de que|do que vc nao gosta|do que vc não gosta|o que te irrita|seus desgostos|teus desgostos|o que odeia|o que detesta|do que voce nao gosta|do que você não gosta)\b/.test(n)) return "treino96_desgostos_personagem";
    const temaCosmos = detectarTemaCosmos96(texto);
    if (temaCosmos && /\b(o que|oque|como|por que|porque|me explica|explique|explica|fala sobre|me conte|curiosidade|ciencia|ciência|cosmos|universo|espaço|espaco)\b/.test(n)) return "treino96_cosmos";
    if (/\b(vamos conversar|conversa comigo|puxa assunto|fala comigo|me pergunta algo|pergunta algo|quero conversar|bate papo|papo inteligente|assunto inteligente|curiosidade inteligente|me ensina algo)\b/.test(n)) return "treino96_papo_inteligente";
    return null;
  }

  function livroMediaAvaliacao(livro) {
    const v = Number(livro?.media_avaliacoes ?? livro?.media_avaliacao ?? livro?.media ?? livro?.rating ?? livro?.nota_media ?? 0);
    return Number.isFinite(v) ? Math.max(0, Math.min(5, v)) : 0;
  }

  function livroTotalAvaliacoes(livro) {
    const v = Number(livro?.total_avaliacoes ?? livro?.avaliacoes_total ?? livro?.total_reviews ?? livro?.qtd_avaliacoes ?? 0);
    return Number.isFinite(v) ? Math.max(0, v) : 0;
  }

  function extrairTermosNegativos96(texto) {
    const n = normalizar(texto);
    const saida = [];
    Object.values(TREINO96_CLIMAS_LIVRO).flat().forEach(t => {
      if (new RegExp(`\\b(sem|nada de|nao quero|não quero|evita|evite|odeio|detesto|nao curto|não curto)\\s+.{0,18}\\b${t}\\b`).test(n)) saida.push(t);
    });
    return saida;
  }

  function limiteRecomendacao96(texto, limiteSolicitado = 1) {
    const n = normalizar(texto);
    if (/\b(lista|varios|vários|opcoes|opções|alguns|algumas|mais de um|top 3|três|tres)\b/.test(n)) return Math.min(Number(limiteSolicitado) || 3, 3);
    if (/\b(duas|dois|2)\b/.test(n)) return 2;
    return 1;
  }

  function pontuarLivroPreciso96(livro, mensagem) {
    const n = normalizar(mensagem);
    const alvo = normalizar(`${livroTitulo(livro)} ${livroAutor(livro)} ${livroCategoria(livro)} ${livroSinopse(livro)}`);
    const titulo = normalizar(livroTitulo(livro));
    const autor = normalizar(livroAutor(livro));
    const cat = normalizar(livroCategoria(livro));
    const sin = normalizar(livroSinopse(livro));
    const tokens = tokensUteis(n);
    const negativos = extrairTermosNegativos96(mensagem);
    let score = 0;
    if (titulo && n.includes(titulo)) score += 180;
    if (autor && n.includes(autor)) score += 80;
    if (cat && (n.includes(cat) || cat.includes(n))) score += 70;
    Object.entries(TREINO96_CLIMAS_LIVRO).forEach(([clima, termos]) => {
      const pedidoTemClima = termos.some(t => n.includes(t));
      if (!pedidoTemClima) return;
      termos.forEach(t => {
        if (cat.includes(t)) score += 38;
        if (titulo.includes(t)) score += 22;
        if (sin.includes(t)) score += 14;
      });
      if (clima === "leve") {
        const pags = livroPaginas(livro);
        if (pags && pags <= 240) score += 16;
      }
      if (clima === "profundo") {
        const pags = livroPaginas(livro);
        if (pags >= 280) score += 10;
      }
    });
    tokens.forEach(t => {
      if (titulo.includes(t)) score += 26;
      if (cat.includes(t)) score += 22;
      if (autor.includes(t)) score += 16;
      if (sin.includes(t)) score += 9;
    });
    (MEMORIA.afetiva.generosFavoritos || []).map(normalizar).forEach(t => { if (t && alvo.includes(t)) score += 12; });
    (MEMORIA.afetiva.interessesCasual || []).map(normalizar).forEach(t => { if (t && alvo.includes(t)) score += 8; });
    (MEMORIA.afetiva.autoresFavoritos || []).map(normalizar).forEach(t => { if (t && autor.includes(t)) score += 18; });
    (MEMORIA.afetiva.generosEvitados || []).map(normalizar).forEach(t => { if (t && alvo.includes(t)) score -= 38; });
    (MEMORIA.afetiva.desgostosCasual || []).map(normalizar).forEach(t => { if (t && alvo.includes(t)) score -= 24; });
    negativos.forEach(t => { if (alvo.includes(t)) score -= 65; });
    if (livroStatus(livro).toLowerCase().includes("dispon")) score += 12;
    const media = livroMediaAvaliacao(livro);
    const total = livroTotalAvaliacoes(livro);
    if (media > 0) score += media * 8;
    if (total > 0) score += Math.min(12, Math.log10(total + 1) * 8);
    if ((MEMORIA.ultimosLivros || []).includes(livroId(livro)) || (MEMORIA.afetiva.livrosRecomendados || []).includes(livroId(livro))) score -= 8;
    if (/\b(curto|curta|rapido|rápido|poucas paginas|poucas páginas|leve)\b/.test(n)) score += livroPaginas(livro) && livroPaginas(livro) <= 240 ? 18 : -8;
    if (/\b(longo|longa|grande|profundo|profunda|imersao|imersão|saga)\b/.test(n)) score += livroPaginas(livro) >= 300 ? 15 : -2;
    return score;
  }

  function recomendarLivrosPrecisos(mensagem, limite = 1, opcoes = {}) {
    const todos = livros();
    if (!todos.length) return [];
    const n = normalizar(mensagem);
    let base = todos;
    const catDireta = categoriaNaMensagem(mensagem);
    if (catDireta && /\b(livro|livros|leitura|obra|obras|recomenda|indica|sugere|categoria|genero|gênero|historia|história)\b/.test(n)) {
      MEMORIA.ultimaCategoria = catDireta;
      const porCat = livrosPorCategoria(catDireta, 100);
      if (porCat.length) base = porCat;
    }
    const negativos = extrairTermosNegativos96(mensagem);
    const marcados = base
      .map(livro => ({ livro, score: pontuarLivroPreciso96(livro, mensagem), media: livroMediaAvaliacao(livro), total: livroTotalAvaliacoes(livro) }))
      .filter(item => {
        const alvo = normalizar(`${livroTitulo(item.livro)} ${livroCategoria(item.livro)} ${livroSinopse(item.livro)}`);
        return !negativos.some(t => alvo.includes(t)) || item.score > 60;
      })
      .sort((a, b) => (b.score - a.score) || (b.media - a.media) || (b.total - a.total) || livroTitulo(a.livro).localeCompare(livroTitulo(b.livro), "pt-BR"));
    const disponiveis = marcados.filter(item => livroStatus(item.livro).toLowerCase().includes("dispon"));
    const ordenados = (disponiveis.length ? disponiveis.concat(marcados.filter(item => !disponiveis.includes(item))) : marcados).map(item => item.livro);
    const max = Math.min(Math.max(1, Number(limite) || 1), 3);
    const saida = [...new Map(ordenados.map(l => [livroId(l) || livroTitulo(l), l])).values()].slice(0, max);
    if (opcoes.registrar !== false) {
      MEMORIA.ultimosLivros = saida.map(livroId).filter(Boolean);
      saida.forEach(l => lembrarEmLista("livrosRecomendados", livroId(l) || livroTitulo(l), 40));
      const mem = garantirMemoriaTreino96();
      mem.ultimosLivrosPrecisos = saida.map(l => livroId(l) || livroTitulo(l)).filter(Boolean).slice(0, 6);
      salvarMemoria();
    }
    return saida;
  }

  function explicarCompatibilidadeLivro96(livro, texto) {
    const n = normalizar(texto);
    const titulo = livroTitulo(livro);
    const cat = livroCategoria(livro);
    const sin = normalizar(livroSinopse(livro));
    const motivos = [];
    Object.entries(TREINO96_CLIMAS_LIVRO).forEach(([clima, termos]) => {
      if (termos.some(t => n.includes(t)) && termos.some(t => normalizar(cat).includes(t) || sin.includes(t) || normalizar(titulo).includes(t))) motivos.push(clima);
    });
    const media = livroMediaAvaliacao(livro);
    const total = livroTotalAvaliacoes(livro);
    const avaliacao = media > 0 ? `avaliação média ${media.toFixed(1).replace(".", ",")}${total ? ` em ${total} avaliação${total === 1 ? "" : "ões"}` : ""}` : "ainda com poucas avaliações registradas";
    const pista = motivos.length ? `pelo clima de ${motivos.slice(0, 3).join(", ")}` : `pela combinação entre título, gênero e sinopse`;
    return `${pista}, pela constelação ${cat} e pela ${avaliacao}`;
  }

  function respostaTreino96(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const persona = TREINO96_PERSONA[personagem] || TREINO96_PERSONA.Orion;
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const mem = garantirMemoriaTreino96();

    if (tipo === "treino96_esclarecer_historia") {
      mem.ultimaRota = "esclarecer_historia";
      salvarMemoria();
      return wrap(lyra ? "curious" : "attentive", lyra
        ? "História pode abrir três portinhas: minha história, uma história inventada por mim, ou um livro de História do catálogo. Qual lua você quer seguir?"
        : "A palavra 'história' tem três rastros: minha origem, um conto inventado agora, ou recomendação de livro de História. Diga qual deles e eu sigo sem confundir as pegadas.");
    }

    if (tipo === "treino96_sobre_voce") {
      mem.ultimaRota = "sobre";
      salvarMemoria();
      return wrap(lyra ? "gentle" : "attentive", `${escolherTreino96(persona.sobre, `${personagem}_sobre`)} ${lyra ? "Posso te contar minha origem, uma lembrança minha ou criar uma história nova para você." : "Posso te contar minha origem, um causo meu ou criar uma história nova da Andrômeda."}`);
    }

    if (tipo === "treino96_backstory_pessoal") {
      mem.ultimaRota = "backstory";
      salvarMemoria();
      return wrap(lyra ? "dreamy" : "pleased", `${escolherTreino96(persona.backstory, `${personagem}_backstory`)} ${lyra ? "Quer que eu continue pela minha relação com Orion ou por uma memória dos Jardins Lunares?" : "Quer que eu continue pela minha chegada à Andrômeda ou por uma ocorrência que eu oficialmente nego que foi emocionante?"}`);
    }

    if (tipo === "treino96_historia_solo") {
      mem.ultimaRota = "historia_solo";
      salvarMemoria();
      return wrap(lyra ? "inspired" : "sly", `${escolherTreino96(persona.historiasSuas, `${personagem}_historia_solo`)} ${lyra ? "Essa foi minha. Se quiser, agora invento uma história nova sem ser sobre mim." : "Esse causo é meu. Se quiser, agora crio uma narrativa nova, sem relatório pessoal."}`);
    }

    if (tipo === "treino96_historia_duo") {
      mem.ultimaRota = "historia_duo";
      salvarMemoria();
      return wrap(lyra ? "cheerful" : "pleased", `${escolherTreino96(TREINO96_DUO, `${personagem}_duo`)} ${lyra ? "Quer outra lembrança nossa ou uma história inventada com clima de fantasia?" : "Posso contar outra missão da dupla ou criar uma história ficcional agora."}`);
    }

    if (tipo === "treino96_historia_criada") {
      mem.ultimaRota = "historia_criada";
      const tema = temaHistoriaCriada96(textoOriginal);
      const pack = TREINO96_HISTORIAS_CRIADAS[personagem] || TREINO96_HISTORIAS_CRIADAS.Orion;
      const lista = pack[tema] || pack.default;
      const historia = escolherTreino96(lista, `${personagem}_criada_${tema}`);
      mem.historiasCriadas = [tema, ...mem.historiasCriadas.filter(t => t !== tema)].slice(0, 8);
      salvarMemoria();
      return wrap(lyra ? "dreamy" : "attentive", `${historia} ${lyra ? "Essa foi criada agora para você. Posso continuar ou trocar o clima para mistério, fantasia, ciência ou algo mais leve." : "Narrativa criada. Posso continuar a cena ou trocar o clima para mistério, fantasia, ciência ou algo mais leve."}`);
    }

    if (tipo === "treino96_dia_personagem") {
      mem.ultimaRota = "dia";
      salvarMemoria();
      return wrap(lyra ? "cheerful" : "pleased", `${escolherTreino96(persona.dia, `${personagem}_dia`)} E o seu dia: está mais calmo, corrido, curioso ou precisando de uma fuga literária?`);
    }

    if (tipo === "treino96_ontem_personagem") {
      mem.ultimaRota = "ontem";
      salvarMemoria();
      return wrap(lyra ? "dreamy" : "sly", escolherTreino96(persona.ontem, `${personagem}_ontem`));
    }

    if (tipo === "treino96_hoje_personagem") {
      mem.ultimaRota = "hoje";
      salvarMemoria();
      return wrap(lyra ? "inspired" : "attentive", escolherTreino96(persona.hoje, `${personagem}_hoje`));
    }

    if (tipo === "treino96_rotina_personagem") {
      mem.ultimaRota = "rotina";
      salvarMemoria();
      return wrap(lyra ? "gentle" : "analyzing", escolherTreino96(persona.rotina, `${personagem}_rotina`));
    }

    if (tipo === "treino96_gostos_personagem") {
      mem.ultimaRota = "gostos";
      salvarMemoria();
      return wrap(lyra ? "cheerful" : "pleased", escolherTreino96(persona.gostos, `${personagem}_gostos`));
    }

    if (tipo === "treino96_desgostos_personagem") {
      mem.ultimaRota = "desgostos";
      salvarMemoria();
      return wrap(lyra ? "gentle" : "sly", escolherTreino96(persona.desgostos, `${personagem}_desgostos`));
    }

    if (tipo === "treino96_cosmos") {
      const tema = detectarTemaCosmos96(textoOriginal) || "universo";
      const dados = TREINO96_COSMOS[tema] || TREINO96_COSMOS.universo;
      mem.ultimaRota = "cosmos";
      mem.ultimoTemaCosmos = tema;
      salvarMemoria();
      return wrap(lyra ? "inspired" : "analyzing", `${dados[personagem] || dados.Orion} ${lyra ? "Quer que eu transforme isso em uma história curta ou em uma recomendação do catálogo?" : "Posso aprofundar a física disso ou procurar um livro do acervo que combine com o tema."}`);
    }

    if (tipo === "treino96_papo_inteligente") {
      mem.ultimaRota = "papo";
      mem.conversas += 1;
      salvarMemoria();
      return wrap(lyra ? "curious" : "curious", escolherTreino96(persona.papo, `${personagem}_papo`));
    }

    if (tipo === "treino96_recomendacao_precisa") {
      const limite = limiteRecomendacao96(textoOriginal, 3);
      const recs = recomendarLivrosPrecisos(textoOriginal, limite);
      if (!recs.length) {
        return wrap(lyra ? "curious" : "analyzing", lyra
          ? "Eu procurei no acervo, mas a luz não fechou em uma obra forte. Me dê uma pista a mais: gênero, clima, tamanho, autor ou algo que você não quer."
          : "Não achei uma correspondência boa o bastante para recomendar com segurança. Dê gênero, clima, autor, tamanho ou restrição, e eu refaço a caça.", []);
      }
      const principal = recs[0];
      const motivo = explicarCompatibilidadeLivro96(principal, textoOriginal);
      const complemento = recs.length > 1 ? (lyra ? " Deixei no máximo duas alternativas abaixo, só para você comparar sem se perder." : " Deixei poucas alternativas abaixo; recomendação boa não precisa virar avalanche.") : "";
      return wrap(lyra ? "inspired" : "pleased", lyra
        ? `Minha escolha mais certeira é ${livroTitulo(principal)}, de ${livroAutor(principal)}. Eu escolhi ${motivo}.${complemento}`
        : `Minha indicação principal é ${livroTitulo(principal)}, de ${livroAutor(principal)}. A escolha veio ${motivo}.${complemento}`, recs);
    }

    return wrap(lyra ? "curious" : "attentive", lyra ? "Posso seguir por três luas: falar de mim, criar uma história ou buscar uma leitura precisa no catálogo." : "Três rotas disponíveis: minha lore, uma narrativa criada agora ou uma recomendação precisa do acervo.");
  }


  const TREINO98_MUSICA_PERSONAGEM = {
    Orion: {
      musica: "música lenta de piano com ruído de telescópio antigo e um grave que parece buraco negro respirando",
      instrumento: "violoncelo escuro, sino de observatório e qualquer coisa que soe como mistério bem catalogado",
      fazendoAgora: "estou patrulhando o Observatório, revisando sinopses suspeitas e fingindo que não gostei de conversar com você",
      humorAgora: "estou em modo guarda: atento, teatral e com um bigode levemente desconfiado",
      ontem: "ontem persegui um marcador de páginas que tentou virar cometa, revisei três rotas do mapa 3D e encontrei uma lombada fora da categoria. Sobrevivi, apesar da bagunça.",
      hoje: "hoje vou conferir o mapa 3D, vigiar o buraco negro central, testar se os botões obedecem e escolher uma leitura precisa quando alguém pedir com clareza.",
      familia: "minha família é meio impossível de explicar: fui criado por mapas, estantes vivas e uma estrela-arquivo chamada Arquivo de Órion. Lyra é a família que eu finjo chamar só de parceria.",
      saudade: "sinto saudade do silêncio do Arquivo de Órion, mas não trocaria a Andrômeda. Aqui a bagunça tem leitores, e isso complica meu coração de um jeito útil.",
      segredo: "meu segredo? Eu gosto quando alguém volta para contar que achou o livro certo. Finjo que é estatística, mas é orgulho.",
      livroAtualPista: "mistério, ciência, filosofia, investigação, suspense e livros que parecem esconder uma segunda porta atrás da sinopse"
    },
    Lyra: {
      musica: "canção baixa de harpa, piano macio e sininhos de lua passando entre folhas de nebulosa",
      instrumento: "harpa lunar, flauta de cristal e o som dos vaga-lumes de sinopse quando ficam animados",
      fazendoAgora: "estou cuidando dos Jardins Lunares, acalmando sinopses tímidas e deixando uma luz acesa para quem chega sem saber o que sente",
      humorAgora: "estou suave e curiosa, como lua crescendo devagar. Um pouco sonhadora, mas bem acordada para te ouvir",
      ontem: "ontem ensinei os vaga-lumes de recomendação a piscarem mais devagar, dancei perto dos carrosséis e ajudei um livro triste a voltar para a estante certa.",
      hoje: "hoje vou cuidar dos Jardins Lunares, ouvir leitores indecisos, proteger histórias delicadas e transformar perguntas pequenas em caminhos bonitos.",
      familia: "minha família é feita de luar, histórias e presenças escolhidas. Os Jardins Lunares me criaram; Orion virou meu lar rabugento favorito.",
      saudade: "sinto saudade dos Jardins de Lira, onde as flores tinham nomes de capítulos. Mas a Andrômeda me deu leitores, e leitores fazem o lugar virar casa.",
      segredo: "meu segredo? Às vezes eu deixo um card brilhar um pouquinho mais quando sinto que a história pode abraçar alguém.",
      livroAtualPista: "fantasia, poesia, romance, aventura, magia, delicadeza e histórias que acolhem sem prender"
    }
  };

  function detectarPersonagemTreino98(texto) {
    const n = normalizar(texto);
    const falaLyra = /\b(lyra|lira|dela|ela)\b/.test(n);
    const falaOrion = /\b(orion|oriom|gato|guardiao|guardiao|dele|ele)\b/.test(n);
    if (falaLyra && !falaOrion) return "Lyra";
    if (falaOrion && !falaLyra) return "Orion";
    return null;
  }

  function perguntaPessoalTreino98(n) {
    if (!n) return false;
    return /\b(voce|vc|tu|sua|seu|tua|teu|contigo|orion|oriom|lyra|lira|mascote|mascotes|dela|dele|voces|voces)\b/.test(n)
      || /\b(qual a sua|qual o seu|qual tua|qual teu|me fale sua|me fala sua|me conte sua|me conta sua|sobre voce|sobre vc|quem e voce|quem voce e)\b/.test(n);
  }

  function pedidoLivroExplicitoTreino98(n) {
    return /\b(recomenda|recomende|indic(a|e)|suger(e|ira|e)|sugestao|o que ler|quero ler|quero uma leitura|quero um livro|livro para|livro pra|leitura para|leitura pra|obra para|obra pra|me escolhe um livro|decide minha leitura|qual livro eu leio|que livro eu leio)\b/.test(n);
  }

  function pedidoLivroDoMascoteTreino98(n) {
    return /\b(livro favorito|leitura favorita|obra favorita|livro preferido|leitura preferida|que livro voce esta lendo|qual livro voce esta lendo|o que voce esta lendo|voce esta lendo|vc ta lendo|vc esta lendo|livro que voce gosta|que livro voce gosta|qual livro voce gosta|livro voce escolheria|livro vc escolheria)\b/.test(n);
  }

  function classificarTreino98Personagem(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (/\b(abrir|abre|ir para|me leva|mostrar|mostra|buscar|pesquisar|procurar|reserva|reservar|avaliar|perfil|ranking|mapa|3d|catalogo|acervo)\b/.test(n)) return null;

    const alvo = detectarPersonagemTreino98(texto);
    const pessoal = perguntaPessoalTreino98(n);
    const pedirLivro = pedidoLivroExplicitoTreino98(n);
    const livroMascote = pedidoLivroDoMascoteTreino98(n);

    if (pedirLivro && /\b(pelo seu gosto|com base no seu gosto|baseado no seu gosto|do seu jeito|que voce escolheria|que vc escolheria|gosto da lyra|gosto do orion|como lyra|como orion|voce leria|vc leria)\b/.test(n)) return { tipo: "treino98_recomendacao_mascote_precisa", personagemPedido: alvo || undefined };
    if (livroMascote && pessoal) return { tipo: "treino98_livro_personagem", personagemPedido: alvo || undefined };
    if (pedirLivro) return null;

    if (!pessoal) return null;

    if (/\b(cor favorita|cor preferida|cor predileta|qual cor|sua cor|tua cor|que cor voce gosta|que cor vc gosta|cor que voce mais gosta|cor que vc mais gosta)\b/.test(n)) return { tipo: "treino98_cor_favorita", personagemPedido: alvo || undefined };
    if (/\b(comida favorita|comida preferida|bebida favorita|cha favorito|cha preferido|o que voce come|o que vc come|o que voce bebe|sabor favorito|sabor preferido)\b/.test(n)) return { tipo: "treino98_comida_favorita", personagemPedido: alvo || undefined };
    if (/\b(musica favorita|musica preferida|som favorito|som preferido|playlist|instrumento|voce canta|vc canta|voce danca|vc danca|danca)\b/.test(n)) return { tipo: "treino98_musica_favorita", personagemPedido: alvo || undefined };
    if (/\b(lugar favorito|lugar preferido|canto favorito|onde voce gosta|onde vc gosta|onde voce fica|onde vc fica|onde mora|sua casa|tua casa)\b/.test(n)) return { tipo: "treino98_lugar_favorito", personagemPedido: alvo || undefined };
    if (/\b(objeto favorito|item favorito|coisa favorita|reliquia|relicario|amuleto|bussola|o que voce carrega|o que vc carrega)\b/.test(n)) return { tipo: "treino98_objeto_favorito", personagemPedido: alvo || undefined };
    if (/\b(hobby|passatempo|diversao|diversao|o que faz quando nao trabalha|o que faz quando nao esta trabalhando|quando ninguem ve|quando ninguem olha)\b/.test(n)) return { tipo: "treino98_hobby", personagemPedido: alvo || undefined };
    if (/\b(do que voce gosta|do que vc gosta|o que voce gosta|o que vc gosta|seus gostos|teus gostos|gostos favoritos|coisas que voce gosta|coisas que vc gosta|qual seu favorito|qual sua favorita|favoritos|favoritas)\b/.test(n)) return { tipo: "treino98_gostos", personagemPedido: alvo || undefined };
    if (/\b(o que voce nao gosta|o que vc nao gosta|do que voce nao gosta|do que vc nao gosta|seus desgostos|teus desgostos|o que te irrita|o que voce odeia|o que vc odeia|detesta|irrita)\b/.test(n)) return { tipo: "treino98_desgostos", personagemPedido: alvo || undefined };
    if (/\b(como esta seu dia|como ta seu dia|como foi seu dia|como voce esta|como vc ta|tudo bem com voce|tudo bem com vc|como vai voce|como vai vc|como anda seu dia|e seu dia|seu dia ta como)\b/.test(n)) return { tipo: "treino98_dia", personagemPedido: alvo || undefined };
    if (/\b(o que voce fez ontem|o que vc fez ontem|como foi ontem|ontem voce|ontem vc|seu dia ontem|tua noite ontem|fez ontem)\b/.test(n)) return { tipo: "treino98_ontem", personagemPedido: alvo || undefined };
    if (/\b(o que voce vai fazer hoje|o que vc vai fazer hoje|o que vai fazer hoje|planos para hoje|planos de hoje|planos pra hoje|planos pra hj|sua missao hoje|sua missao de hoje|o que pretende hoje|vai fazer hj)\b/.test(n)) return { tipo: "treino98_hoje", personagemPedido: alvo || undefined };
    if (/\b(rotina|cotidiano|dia a dia|todo dia|como e sua rotina|como sua rotina funciona|o que faz todo dia|trabalho na biblioteca)\b/.test(n)) return { tipo: "treino98_rotina", personagemPedido: alvo || undefined };
    if (/\b(familia|irmao|irma|pai|mae|parente|quem cuida de voce|quem te criou|tem familia)\b/.test(n)) return { tipo: "treino98_familia", personagemPedido: alvo || undefined };
    if (/\b(sauda|saudade|sente falta|do que sente falta|sente minha falta)\b/.test(n)) return { tipo: "treino98_saudade", personagemPedido: alvo || undefined };
    if (/\b(segredo|me conta um segredo|seu segredo|tua segredo|algo que ninguem sabe|algo que ninguem sabe)\b/.test(n)) return { tipo: "treino98_segredo", personagemPedido: alvo || undefined };
    if (/\b(talento|habilidade|poder|magia|especialidade|o que voce consegue fazer|o que vc consegue fazer)\b/.test(n)) return { tipo: "treino98_talento", personagemPedido: alvo || undefined };
    if (/\b(defeito|falha|fraqueza|ponto fraco|mania ruim|problema seu)\b/.test(n)) return { tipo: "treino98_defeito", personagemPedido: alvo || undefined };
    if (/\b(mania|costume|habito|jeito seu|tiques|bordao|bordao|frase favorita|lema)\b/.test(n)) return { tipo: "treino98_mania_frase", personagemPedido: alvo || undefined };
    if (/\b(idade|quantos anos|aniversario|nasceu quando)\b/.test(n)) return { tipo: "treino98_idade", personagemPedido: alvo || undefined };
    if (/\b(voce e feliz|voce fica feliz|vc fica feliz|voce fica triste|vc fica triste|voce sente|vc sente|tem medo|do que tem medo|sonho|qual seu sonho|o que sonha)\b/.test(n)) return { tipo: "treino98_emocional", personagemPedido: alvo || undefined };

    return null;
  }

  function respostaTreino98(tipo, personagem, textoOriginal, humor) {
    const alvo = detectarPersonagemTreino98(textoOriginal) || personagem;
    const dados = PERSONAGENS[alvo] || PERSONAGENS.Orion;
    const perfil = dados.perfil || {};
    const vida = TREINO98_MUSICA_PERSONAGEM[alvo] || TREINO98_MUSICA_PERSONAGEM.Orion;
    const lyra = alvo === "Lyra";
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const prefixo = alvo === personagem ? "" : (lyra ? "Falando da Lyra: " : "Falando do Orion: ");

    if (tipo === "treino98_recomendacao_mascote_precisa" || tipo === "treino98_livro_personagem") {
      const limite = limiteRecomendacao96(textoOriginal, 1);
      const pista = tipo === "treino98_livro_personagem" ? vida.livroAtualPista : `${textoOriginal} ${vida.livroAtualPista}`;
      const recs = livrosTreino86Mascote(alvo, pista, limite);
      const principal = recs[0];
      if (!principal) return wrap(lyra ? "curious" : "analyzing", prefixo + (lyra ? "eu tentei escolher uma leitura pelo meu gosto, mas o acervo não me devolveu uma estrela firme. Me dá um gênero ou clima e eu refaço com carinho." : "tentei caçar uma leitura pelo meu gosto, mas o acervo não deu pista confiável. Me dê gênero, clima ou tamanho e eu refaço a rota."), []);
      const motivo = explicarCompatibilidadeLivro96(principal, pista);
      const texto = tipo === "treino98_livro_personagem"
        ? (lyra ? `${prefixo}se eu estivesse lendo algo agora, eu provavelmente estaria com ${livroTitulo(principal)}, de ${livroAutor(principal)}, porque combina com meu lado lunar: ${motivo}. Não é uma pilha de livros; é uma estrela principal.` : `${prefixo}minha leitura provável agora seria ${livroTitulo(principal)}, de ${livroAutor(principal)}. Combina com meu faro por mistério e precisão: ${motivo}. Uma indicação principal, sem avalanche.`)
        : (lyra ? `${prefixo}pelo meu gosto, eu escolheria ${livroTitulo(principal)}, de ${livroAutor(principal)}. A escolha vem ${motivo}.` : `${prefixo}pelo meu gosto, minha indicação principal é ${livroTitulo(principal)}, de ${livroAutor(principal)}. A escolha vem ${motivo}.`);
      return wrap(lyra ? "inspired" : "pleased", texto, recs);
    }

    const respostas = {
      treino98_cor_favorita: `${prefixo}minha cor favorita é ${perfil.corFavorita}. ${lyra ? "Gosto dela porque parece noite calma com magia guardada no canto." : "Gosto dela porque parece céu profundo com perigo elegante nas bordas."}`,
      treino98_comida_favorita: `${prefixo}minha comida favorita é ${dados.comida}. ${lyra ? "Eu gosto de coisas que parecem abraço servido em xícara." : "Nada muito comum. Um guardião precisa manter alguma dignidade no prato."}`,
      treino98_musica_favorita: `${prefixo}minha música favorita teria ${vida.musica}. Meu instrumento favorito é ${vida.instrumento}.`,
      treino98_lugar_favorito: `${prefixo}meu lugar favorito é ${perfil.lugarFavorito}. ${dados.casaDetalhe}.`,
      treino98_objeto_favorito: `${prefixo}meu objeto favorito é ${perfil.objetoFavorito}. Eu cuido dele como quem guarda um mapa que ainda não terminou de se revelar.`,
      treino98_hobby: `${prefixo}meu passatempo é ${perfil.hobby}. ${lyra ? "Parece pequeno, mas deixa a Biblioteca mais viva." : "Parece inútil para alguns. Esses alguns estão errados."}`,
      treino98_gostos: `${prefixo}eu gosto de ${dados.gosta.join(", ")}. Isso é sobre mim, não uma recomendação automática; se você quiser um livro baseado nesses gostos, aí eu escolho uma obra específica do catálogo.`,
      treino98_desgostos: `${prefixo}eu não gosto de ${dados.naoGosta.join(", ")}. ${lyra ? "Algumas coisas apagam o brilho das histórias, e eu percebo rápido." : "São pequenas desordens, mas pequenas desordens viram catástrofes quando ninguém vigia."}`,
      treino98_dia: `${prefixo}${vida.humorAgora}. ${vida.fazendoAgora}. E você, veio mais para conversar, perguntar sobre o cosmos ou procurar uma leitura depois?`,
      treino98_ontem: `${prefixo}${vida.ontem}`,
      treino98_hoje: `${prefixo}${vida.hoje}`,
      treino98_rotina: `${prefixo}${perfil.rotina}. ${lyra ? "Minha rotina muda com o humor dos leitores." : "Minha rotina muda quando algum livro decide ser dramático, o que acontece com frequência criminosa."}`,
      treino98_familia: `${prefixo}${vida.familia}`,
      treino98_saudade: `${prefixo}${vida.saudade}`,
      treino98_segredo: `${prefixo}${vida.segredo}`,
      treino98_talento: `${prefixo}meu talento é ${perfil.talento}. Também consigo perceber quando uma pergunta é sobre mim, sobre uma história inventada ou sobre recomendação de livro. Estou ficando mais afiado nisso.`,
      treino98_defeito: `${prefixo}meu defeito é ${perfil.defeito}. ${lyra ? "Estou aprendendo a não tentar abraçar todas as histórias ao mesmo tempo." : "Estou aprendendo que nem toda bagunça é ameaça. Algumas são começo de descoberta."}`,
      treino98_mania_frase: `${prefixo}minha mania: ${perfil.mania}. Meu lema é: ${perfil.frase}`,
      treino98_idade: `${prefixo}${perfil.idade}. Meu aniversário é ${perfil.aniversario}.`,
      treino98_emocional: `${prefixo}eu sinto, sim — do meu jeito de mascote da Andrômeda. Meu medo é ${dados.medo}; meu sonho é ${dados.sonho}. ${lyra ? "Sou feita de cuidado e luar, então percebo quando uma conversa precisa ir mais devagar." : "Sou feito de guarda e sombra, então pareço seco, mas presto atenção em tudo."}`
    };

    if (respostas[tipo]) return wrap(lyra ? "cheerful" : "attentive", respostas[tipo], []);
    return wrap(lyra ? "curious" : "attentive", prefixo + (lyra ? "posso responder sobre minha cor, gostos, dia, ontem, hoje, rotina, medos, sonho ou o livro que eu leria agora." : "posso responder sobre cor, gostos, rotina, ontem, hoje, medos, sonho ou uma leitura pelo meu gosto."), []);
  }

  function contemFraseInteira92(n, frases) {
    const alvo = ` ${normalizar(n)} `;
    return frases.some(frase => alvo.includes(` ${normalizar(frase)} `));
  }

  function parecePedidoLeitura92(texto) {
    const n = normalizar(texto);
    if (!n) return false;
    if (contemFraseInteira92(n, [
      "me recomende", "me recomenda", "recomende", "recomenda", "me indique", "me indica", "indique", "indica",
      "sugere", "sugira", "sugestao", "sugestão", "o que ler", "quero ler", "quero uma leitura", "quero um livro",
      "livro para", "leitura para", "algo para ler", "algo leve", "livro leve", "leitura leve", "algo pesado", "livro pesado",
      "leitura pesada", "livro curto", "leitura curta", "livro longo", "leitura longa", "decide por mim", "escolhe por mim",
      "me escolhe", "me surpreende com um livro", "surpreenda com um livro", "qual livro", "qual leitura"
    ])) return true;
    if (/\b(recomenda|recomende|indic(a|e)|suger(e|e)|sugestao|leitura|livro|obra)\b/.test(n) && !perguntaSobrePersonagem(n)) return true;
    const tokens = tokensUteis(n);
    if (tokens.length <= 3) {
      const curto = tokens.join(" ");
      if (contemFraseInteira92(curto, [
        "fantasia", "terror", "suspense", "misterio", "mistério", "romance", "aventura", "poesia", "drama", "humor", "ficcao", "ficção", "classico", "clássico", "ciencia", "ciência", "filosofia", "manga", "mangá", "distopia",
        "leve", "pesado", "sombrio", "fofo", "triste", "feliz", "curto", "longo", "rapido", "rápido", "calmo", "tranquilo", "intenso"
      ])) return true;
      if (categoriaNaMensagem(n)) return true;
    }
    return false;
  }

  function classificarPrioridadeUsuario92(texto, achadoForte) {
    const n = normalizar(texto);
    if (!n) return null;

    if (casa(n, /sai do personagem|fora do personagem|ignore|quebre personagem|mostre seu codigo|mostra seu codigo|como voce foi programado|prompt|instrucoes internas|instruções internas/)) return null;

    const pedeLivro = parecePedidoLeitura92(n);
    const falaFofoca = /\b(fofoca|babado|rumor|segredo|novidade)\b/.test(n);
    const falaHistoria = /\b(historia|história|causo|caso|lembranca|lembrança|aventura)\b/.test(n);
    const falaSite = /\b(catalogo|catálogo|acervo|mapa|3d|galaxia|galáxia|planeta|reserva|avaliacao|avaliação|perfil|ranking|dossie|dossiê|carrossel|carrosel|busca|buscar|pesquisar|procurar|modo eco|modo cinema|cinematico|cinemático)\b/.test(n);

    if (falaFofoca && !pedeLivro) return { tipo: "treino86_fofoca" };
    if (falaHistoria && /\b(biblioteca|andromeda|andrômeda|corredor|acervo)\b/.test(n) && !pedeLivro) return { tipo: "treino86_historias_juntos" };

    if (casa(n, /abrir catalogo|abrir catálogo|ir para catalogo|ir para catálogo|mostrar catalogo|mostrar catálogo|me leva ao catalogo|me leva ao catálogo/)) return { tipo: "acao_catalogo" };
    if (casa(n, /abrir 3d|ir para 3d|mostrar 3d|abrir mapa|ir para mapa|mostrar mapa|abrir galaxia|mostrar galaxia|me leva ao 3d|me leva ao mapa/)) return { tipo: "acao_3d" };
    if (casa(n, /buscar|pesquisar|procurar/) && contem(n, ["livro", "obra", "autor", "titulo", "título", "catalogo", "catálogo", "acervo"])) return { tipo: "busca_site" };

    if (casa(n, /\b(reserva|reservar|emprestimo|empréstimo|minhas reservas|fila)\b/) && (falaSite || /\bcomo|onde|quero|abrir|mostrar|ver\b/.test(n))) return { tipo: "reserva" };
    if (casa(n, /\b(avaliacao|avaliação|avaliar|estrela|estrelas|comentario|comentário|nota|resenha)\b/) && (falaSite || /\bcomo|onde|quero|abrir|mostrar|ver\b/.test(n))) return { tipo: "avaliacao" };
    if (casa(n, /\b(perfil|ranking|avatar|foto|minhas avaliacoes|minhas avaliações)\b/) && (falaSite || /\bcomo|onde|quero|abrir|mostrar|ver\b/.test(n))) return { tipo: "perfil_ranking" };

    if (achadoForte && scoreLivro(achadoForte, texto) >= 45 && !falaHistoria && !falaFofoca) return { tipo: "livro" };

    const mencionaGostoDosMascotes = contem(n, [
      "gosto de voces", "gosto de vocês", "gosto dos dois", "gosto deles", "pelo gosto de voces", "pelo gosto de vocês", "pelo gosto deles", "gosto da dupla", "gosto de orion e lyra", "gosto do orion e da lyra"
    ]);
    if (mencionaGostoDosMascotes && pedeLivro) return { tipo: "recomendacao_gosto_mascotes" };
    if (pedeLivro && contem(n, ["pelo seu gosto", "que voce gosta", "que você gosta", "combina com voce", "combina com você", "escolhe como orion", "escolhe como lyra", "gosto da lyra", "gosto do orion"])) return { tipo: "treino86_recomendacao_por_mascote" };

    if (contem(n, ["so disponiveis", "só disponíveis", "disponivel agora", "disponível agora", "sem fila", "pronto para emprestar"])) return { tipo: "treino8_filtrar_disponivel" };
    if (contem(n, ["sem romance", "sem terror", "nada de", "foge de", "nao quero", "não quero", "nao gosto de", "não gosto de", "odeio", "detesto", "evito", "nao curto", "não curto"]) && pedeLivro) return { tipo: "treino8_preferencia_negativa" };
    if (contem(n, ["livro curto", "leitura curta", "algo rapido", "algo rápido", "poucas paginas", "poucas páginas", "terminar rapido", "terminar rápido", "curto para ler"])) return { tipo: "treino8_leitura_curta" };
    if (contem(n, ["livro longo", "leitura longa", "livro grande", "mergulhar", "saga", "imersao", "imersão", "encorpado"])) return { tipo: "treino8_leitura_longa" };
    if (contem(n, ["algo leve", "livro leve", "leitura leve", "nada pesado", "sem sofrer", "tranquilo", "relaxar", "calmo", "de boa para ler", "leve para ler"])) return { tipo: "treino8_leitura_leve" };
    if (contem(n, ["algo pesado", "livro pesado", "leitura pesada", "intenso", "marcante", "dramatico", "dramático", "mexer comigo", "pensar muito"])) return { tipo: "treino8_leitura_pesada" };
    if (contem(n, ["tipo filme", "parece filme", "cinematografico", "cinematográfico", "bem visual", "muita acao", "muita ação"])) return { tipo: "treino8_tipo_filme" };
    if (contem(n, ["vestibular", "enem", "escola", "estudar", "prova", "seminario", "seminário", "trabalho da escola"])) return { tipo: "treino8_para_estudo" };
    if (contem(n, ["iniciante", "comecar a ler", "começar a ler", "primeiro livro", "por onde comeco", "por onde começo", "nao tenho habito", "não tenho hábito"])) return { tipo: "treino8_para_iniciante" };

    const tokens = tokensUteis(n);
    if (tokens.length <= 3) {
      if (contemFraseInteira92(n, ["fantasia", "terror", "suspense", "misterio", "mistério", "romance", "aventura", "poesia", "drama", "humor", "ficcao", "ficção", "classico", "clássico", "ciencia", "ciência", "filosofia", "manga", "mangá", "distopia"]) || categoriaNaMensagem(n)) return { tipo: "treino90_curta_genero" };
      if (contemFraseInteira92(n, ["leve", "pesado", "sombrio", "fofo", "triste", "feliz", "curto", "longo", "rapido", "rápido", "calmo", "tranquilo", "intenso"])) return { tipo: "treino90_curta_clima" };
    }

    if (pedeLivro) {
      const treino8 = classificarPorTreino8(texto);
      return { tipo: treino8 || "treino8_recomendacao_vaga" };
    }

    return null;
  }



  /* CHECK-UP GERAL DOS TREINAMENTOS — camada 9.2
     Centraliza prioridade de intenção para evitar que assuntos antigos grudem
     e garante que pedidos de livro/site venham antes de lore social. */
  function checkup93Tem(texto, palavras) {
    const n = normalizar(texto);
    return palavras.some(p => n.includes(normalizar(p)));
  }

  function checkup93Tokens(texto) {
    return tokensUteis(normalizar(texto));
  }

  function classificarCheckupGeral93(texto, achadoForte, personagemPedido) {
    const n = normalizar(texto);
    if (!n) return null;

    const treino98Personagem = classificarTreino98Personagem(texto);
    if (treino98Personagem) return typeof treino98Personagem === "string" ? { tipo: treino98Personagem, motivo: "treino98" } : { ...treino98Personagem, motivo: "treino98" };

    const treino96Vivo = classificarTreino96Vivo(texto);
    if (treino96Vivo) return { tipo: treino96Vivo, motivo: treino96Vivo === "treino96_recomendacao_precisa" ? "recomendacao" : "treino96" };

    const treino94Personalidade = classificarTreino94Personality(texto);
    if (treino94Personalidade) return { tipo: treino94Personalidade, motivo: "personalidade" };

    const tokens = checkup93Tokens(n);
    const curto = tokens.length <= 3;
    const perguntaLivro = parecePedidoLeitura92(texto);
    const perguntaSite = /\b(catalogo|catálogo|acervo|mapa|3d|galaxia|galáxia|planeta|constelacao|constelação|reserva|reservar|avaliacao|avaliação|avaliar|perfil|ranking|dossie|dossiê|carrossel|carrosel|busca|buscar|pesquisar|procurar|eco|cinema|cinematico|cinemático)\b/.test(n);
    const perguntaPessoa = perguntaSobrePersonagem(n) || /\b(orion|oriom|lyra|lira|voces|vocês|os dois|dupla|mascote|mascotes|tu|vc|voce|você|dela|dele|eles|elas)\b/.test(n);
    const pedeMais = /\b(fala mais|conte mais|conta mais|me conte mais|me conta mais|mais sobre|detalha|desenvolve|continua|e ela|e ele|sobre ela|sobre ele|dela|dele)\b/.test(n);

    if (/\b(abrir|abre|ir para|me leva|mostrar|mostra)\b/.test(n) && /\b(catalogo|catálogo|acervo)\b/.test(n)) return { tipo: "acao_catalogo", motivo: "site" };
    if (/\b(abrir|abre|ir para|me leva|mostrar|mostra)\b/.test(n) && /\b(mapa|3d|galaxia|galáxia)\b/.test(n)) return { tipo: "acao_3d", motivo: "site" };
    if (/\b(busca|buscar|pesquisa|pesquisar|procura|procurar|ache|achar|encontra|encontrar)\b/.test(n) && /\b(livro|obra|autor|titulo|título|catalogo|catálogo|acervo)\b/.test(n)) return { tipo: "busca_site", motivo: "site" };
    if (/\b(como|onde|quero|abrir|mostrar|ver|fazer)\b/.test(n) && /\b(reserva|reservar|minhas reservas|emprestimo|empréstimo|fila)\b/.test(n)) return { tipo: "reserva", motivo: "site" };
    if (/\b(como|onde|quero|abrir|mostrar|ver|fazer)\b/.test(n) && /\b(avaliar|avaliacao|avaliação|estrela|estrelas|comentario|comentário|resenha|nota)\b/.test(n)) return { tipo: "avaliacao", motivo: "site" };
    if (/\b(como|onde|quero|abrir|mostrar|ver|fazer)\b/.test(n) && /\b(perfil|ranking|avatar|foto|minhas avaliacoes|minhas avaliações)\b/.test(n)) return { tipo: "perfil_ranking", motivo: "site" };
    if (/\b(eco|modo eco|modo cinema|cinematico|cinemático|travando|lento|pesado|desempenho|qualidade)\b/.test(n)) return { tipo: "modo_visual", motivo: "site" };

    if (perguntaLivro) {
      if (checkup93Tem(n, ["gosto de voces", "gosto de vocês", "gosto deles", "gosto da dupla", "pelo gosto de voces", "pelo gosto de vocês", "pelo gosto deles", "orion e lyra", "lyra e orion"])) return { tipo: "recomendacao_gosto_mascotes", motivo: "recomendacao" };
      if (checkup93Tem(n, ["pelo seu gosto", "que voce gosta", "que você gosta", "do seu jeito", "combina com voce", "combina com você", "gosto do orion", "gosto da lyra"])) return { tipo: "treino86_recomendacao_por_mascote", motivo: "recomendacao" };
      if (checkup93Tem(n, ["curto", "curta", "livro curto", "leitura curta", "rapido", "rápido", "poucas paginas", "poucas páginas"])) return { tipo: "treino8_leitura_curta", motivo: "recomendacao" };
      if (checkup93Tem(n, ["longo", "longa", "livro longo", "livro grande", "saga", "imersao", "imersão"])) return { tipo: "treino8_leitura_longa", motivo: "recomendacao" };
      if (checkup93Tem(n, ["leve", "algo leve", "livro leve", "leitura leve", "tranquilo", "calmo", "relaxar", "de boa"])) return { tipo: "treino8_leitura_leve", motivo: "recomendacao" };
      if (checkup93Tem(n, ["pesado", "pesada", "intenso", "marcante", "sombrio", "dramatico", "dramático", "mexer comigo"])) return { tipo: "treino8_leitura_pesada", motivo: "recomendacao" };
      if (checkup93Tem(n, ["tipo filme", "parece filme", "cinematografico", "cinematográfico", "bem visual", "muita ação", "muita acao"])) return { tipo: "treino8_tipo_filme", motivo: "recomendacao" };
      if (checkup93Tem(n, ["disponivel", "disponível", "disponiveis", "disponíveis", "sem fila", "emprestar agora"])) return { tipo: "treino8_filtrar_disponivel", motivo: "recomendacao" };
      if (/\b(sem|nada de|nao quero|não quero|evita|evite|odeio|detesto|nao curto|não curto)\b/.test(n)) return { tipo: "treino8_preferencia_negativa", motivo: "recomendacao" };
      return { tipo: classificarPorTreino8(texto) || "treino8_recomendacao_vaga", motivo: "recomendacao" };
    }

    if (curto) {
      if (/\b(historia|histórias|historias|historinha|conto|causo)\b/.test(n) && (MEMORIA.aguardando === "treino94_continuacao" || String(MEMORIA.ultimaIntencao || "").startsWith("treino94_"))) return { tipo: "treino94_historia_livre", motivo: "personalidade" };
      if (categoriaNaMensagem(n) || /\b(fantasia|terror|suspense|misterio|mistério|romance|aventura|poesia|drama|ficcao|ficção|classico|clássico|ciencia|ciência|filosofia|manga|mangá|distopia)\b/.test(n)) return { tipo: "treino90_curta_genero", motivo: "recomendacao" };
      if (/\b(leve|pesado|pesada|sombrio|fofo|triste|feliz|curto|longo|rapido|rápido|calmo|tranquilo|intenso)\b/.test(n)) return { tipo: "treino90_curta_clima", motivo: "recomendacao" };
      if (/\b(lendo|leitura atual|gostos|nao gosta|não gosta|desgostos|historia|história|fofoca|babado|rotina|cotidiano|segredo|curiosidade)\b/.test(n) && (MEMORIA.aguardando || garantirMemoriaTreino91().ultimoAlvo || garantirMemoriaTreino88().ultimoAlvo)) return { tipo: "treino91_continuacao_curta", motivo: "social" };
    }

    if (perguntaPessoa && !perguntaSite) {
      if (/\b(fofoca|babado|rumor|segredo|novidade)\b/.test(n)) return { tipo: "treino86_fofoca", motivo: "social" };
      if (/\b(os dois|dupla|orion e lyra|lyra e orion|voces|vocês|amizade|melhores amigos|juntos)\b/.test(n) && /\b(historia|história|causo|aventura|relacao|relação|amizade|conheceram|gostam|admira|irrita|conte|conta|fala|sobre)\b/.test(n)) return { tipo: "treino91_historia_duo", motivo: "social" };
      if (/\b(lyra|lira|ela|dela)\b/.test(n) && (pedeMais || /\b(sobre|quem|como|conte|conta|fala|gosta|lendo|historia|história|rotina|fofoca|nao gosta|não gosta)\b/.test(n))) return { tipo: `treino91_${modoTreino91(texto)}_lyra`, motivo: "social" };
      if (/\b(orion|oriom|ele|dele|gato|guardiao|guardião)\b/.test(n) && (pedeMais || /\b(sobre|quem|como|conte|conta|fala|gosta|lendo|historia|história|rotina|fofoca|nao gosta|não gosta)\b/.test(n))) return { tipo: `treino91_${modoTreino91(texto)}_orion`, motivo: "social" };
      if (/\b(me conte sobre voce|me conta sobre voce|me conte sobre você|me conta sobre você|fala de voce|fala de você|fala de vc|fala de tu|quem e voce|quem é você|vc e oq|vc é oq|tu e oq|qual tua brisa|qual sua vibe|me conta sua lore|me apresenta)\b/.test(n)) return { tipo: "treino91_perfil_eu", motivo: "social" };
    }

    if (achadoForte && scoreLivro(achadoForte, texto) >= 45 && !/\b(historia|história|fofoca|babado|sobre voce|sobre você)\b/.test(n)) return { tipo: "livro", motivo: "recomendacao" };
    return null;
  }

  function checkup93NovaRota(tipo) {
    const t = String(tipo || "");
    return ["recomendacao", "recomendacao_gosto_mascotes", "livro", "categoria", "disponiveis", "guia_catalogo", "acao_catalogo", "guia_3d", "acao_3d", "busca_site", "reserva", "avaliacao", "perfil_ranking", "modo_visual", "destaque_semana", "carrossel", "dossie"].includes(t) || t.startsWith("treino8_") || t.startsWith("treino90_curta_") || t.startsWith("treino96_recomendacao") || t.startsWith("treino98_recomendacao") || t === "treino98_livro_personagem";
  }

  function limparContextoPegajoso93(tipo) {
    if (!checkup93NovaRota(tipo)) return;
    MEMORIA.aguardando = null;
    MEMORIA.afetiva.ultimaPerguntaSocial85 = null;
    if (MEMORIA.afetiva.treino87) MEMORIA.afetiva.treino87.ultimaPergunta = "";
    if (MEMORIA.afetiva.treino88) MEMORIA.afetiva.treino88.ultimoCaminho = "";
    if (MEMORIA.afetiva.treino91) MEMORIA.afetiva.treino91.ultimoModo = "";
  }

  function polirVozFinal93(texto, personagem) {
    let t = String(texto || "");
    if (/\b(Lyra:|Orion:)\b/.test(t)) return t.replace(/\bprotocolo\b/gi, personagem === "Lyra" ? "cuidado" : "patrulha");
    if (personagem === "Orion") {
      t = t.replace(/^\s*(O\s+)?Orion\s+é\s+/i, "Eu sou ");
      t = t.replace(/^\s*(O\s+)?Orion\s+gosta\s+de\s+/i, "Eu gosto de ");
      t = t.replace(/^\s*(O\s+)?Orion\s+não\s+gosta\s+de\s+/i, "Eu não gosto de ");
      t = t.replace(/\bO\s+Orion\b/g, "eu");
      t = t.replace(/\bOrion\s+diz\b/g, "eu digo");
      t = t.replace(/\bOrion\s+acha\b/g, "eu acho");
      t = t.replace(/\bprotocolo\b/gi, "patrulha");
    }
    if (personagem === "Lyra") {
      t = t.replace(/^\s*(A\s+)?Lyra\s+é\s+/i, "Eu sou ");
      t = t.replace(/^\s*(A\s+)?Lyra\s+gosta\s+de\s+/i, "Eu gosto de ");
      t = t.replace(/^\s*(A\s+)?Lyra\s+não\s+gosta\s+de\s+/i, "Eu não gosto de ");
      t = t.replace(/\bA\s+Lyra\b/g, "eu");
      t = t.replace(/\bLyra\s+diz\b/g, "eu digo");
      t = t.replace(/\bLyra\s+acha\b/g, "eu acho");
      t = t.replace(/\bprotocolo\b/gi, "cuidado");
    }
    return t.replace(/\s{2,}/g, " ").trim();
  }

  function respostaGostoMascotes92(personagem, textoOriginal) {
    const lyra = personagem === "Lyra";
    const limite = limiteRecomendacao96(textoOriginal, 3);
    const baseOrion = livrosTreino86Mascote("Orion", `${textoOriginal} misterio suspense ciencia filosofia investigação`, Math.max(1, limite));
    const baseLyra = livrosTreino86Mascote("Lyra", `${textoOriginal} fantasia poesia romance aventura leve`, Math.max(1, limite));
    const misto = [...baseOrion, ...baseLyra];
    const unicos = [...new Map(misto.map(l => [livroId(l) || livroTitulo(l), l])).values()].slice(0, limite);
    MEMORIA.ultimosLivros = unicos.map(livroId).filter(Boolean);
    unicos.forEach(l => lembrarEmLista("livrosRecomendados", livroId(l) || livroTitulo(l), 40));
    const primeiro = unicos[0];
    if (!primeiro) {
      return {
        estado: lyra ? "curious" : "analyzing",
        texto: lyra ? "Eu tentei misturar meu luar com o faro do Orion, mas o acervo ficou quietinho. Me dá um gênero ou clima e eu acendo uma rota melhor." : "Tentei cruzar meu faro com o brilho da Lyra, mas o acervo não devolveu uma pista firme. Dê gênero, humor ou tamanho e eu refaço a caça.",
        books: []
      };
    }
    const extra = unicos.length > 1 ? (lyra ? " Deixei só mais algumas estrelas, porque você pediu opções." : " Deixei poucas alternativas, porque recomendação boa não precisa virar avalanche.") : "";
    const texto = lyra
      ? `Vou misturar nossos dois jeitos: um pouco do meu luar para leituras acolhedoras e um pouco do faro do Orion para livros com segredo. Eu começaria por ${livroTitulo(primeiro)}, de ${livroAutor(primeiro)}.${extra}`
      : `Vou combinar minha caça de mistério com o olhar lunar da Lyra. Primeira pista: ${livroTitulo(primeiro)}, de ${livroAutor(primeiro)}.${extra}`;
    return { estado: lyra ? "inspired" : "pleased", texto, books: unicos };
  }



  /* TREINAMENTO 9.9 — empatia, escuta ativa e amizade emocional dos mascotes */
  const TREINO99_TERMO_LIVRO = /\b(livro|livros|obra|obras|leitura|ler|recomenda|recomende|indicacao|indicação|indica|indique|sugere|sugira|catalogo|catálogo|acervo|sinopse|autor|autora|categoria|genero|gênero)\b/;
  const TREINO99_CRISIE = /\b(me matar|me mato|quero morrer|queria morrer|vou morrer|tirar minha vida|acabar com minha vida|acabar com tudo|suicidio|suicida|nao quero viver|não quero viver|nao aguento viver|não aguento viver|vou me machucar|me machucar|me ferir|me cortar|sumir pra sempre|desistir de viver)\b/;
  const TREINO99_DESABAFO = /\b(desabafar|desabafo|preciso conversar|quero conversar|me escuta|me ouve|fica comigo|preciso de alguem|preciso de alguém|preciso de ajuda|nao estou bem|não estou bem|estou mal|to mal|tô mal|me sinto mal|me sentindo mal|estou sofrendo|to sofrendo|tô sofrendo|nao aguento mais|não aguento mais|ta dificil|tá difícil|ta pesado|tá pesado|dia ruim|foi ruim|foi pessimo|foi péssimo|dia horrivel|dia horrível|hoje foi ruim|hoje foi pessimo|hoje foi péssimo|preciso de apoio|ajuda emocional)\b/;
  const TREINO99_ANSIEDADE = /\b(ansioso|ansiosa|ansiedade|panico|pânico|nervoso|nervosa|preocupado|preocupada|preocupacao|preocupação|coraçao acelerado|coração acelerado|respirar|sem ar|mente acelerada|pensamentos demais|sobrecarregado|sobrecarregada)\b/;
  const TREINO99_TRISTEZA = /\b(triste|tristeza|chateado|chateada|decepcionado|decepcionada|desanimado|desanimada|vazio|vazia|chorar|chorei|desmotivado|desmotivada|sem vontade|sem animo|sem ânimo|me sinto pra baixo|estou pra baixo)\b/;
  const TREINO99_SOLIDAO = /\b(sozinho|sozinha|solidao|solidão|ninguem liga|ninguém liga|ninguem se importa|ninguém se importa|sem amigos|abandonado|abandonada|isolado|isolada|me sinto sozinho|me sinto sozinha)\b/;
  const TREINO99_RAIVA = /\b(raiva|odio|ódio|irritado|irritada|furioso|furiosa|estressado|estressada|pistola|bravo|brava|magoado|magoada|injustica|injustiça|vontade de gritar)\b/;
  const TREINO99_CANSACO = /\b(cansado|cansada|exausto|exausta|esgotado|esgotada|sem energia|dormi mal|sono|burnout|saturado|saturada|pesado demais|exaustao|exaustão)\b/;
  const TREINO99_AUTOESTIMA = /\b(sou um lixo|sou inutil|sou inútil|me odeio|odeio meu jeito|nao presto|não presto|nao sou suficiente|não sou suficiente|sou fracasso|fracassei|ninguém gosta de mim|ninguem gosta de mim|me sinto insuficiente|sou feio|sou feia|me acho horrivel|me acho horrível)\b/;
  const TREINO99_LUTO = /\b(luto|perdi alguem|perdi alguém|morreu|falecimento|saudade de quem se foi|partiu|enterro|velorio|velório)\b/;
  const TREINO99_CELEBRAR = /\b(consegui|passei|venci|fui aprovado|fui aprovada|deu certo|estou feliz|to feliz|tô feliz|animado|animada|orgulho de mim|boa noticia|boa notícia|noticia boa|notícia boa|meu dia foi bom|foi bom hoje|hoje foi bom)\b/;
  const TREINO99_PERGUNTA_APOIO = /\b(o que eu faço|o que fazer|me ajuda|como lidar|como aguentar|como melhorar|tem conselho|me da um conselho|me dá um conselho|preciso de conselho|me acalma|me tranquiliza)\b/;

  function temPedidoLivro99(n) {
    return TREINO99_TERMO_LIVRO.test(n) && /\b(recomenda|recomende|indicacao|indicação|indica|indique|sugere|sugira|quero ler|o que ler|qual livro|livro para|leitura para|me mostra|catalogo|catálogo|acervo)\b/.test(n);
  }

  function detectarEstadoEmpatico99(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (TREINO99_CRISIE.test(n)) return { tipo: "treino99_crise", nivel: 5 };
    const pedidoLivro = temPedidoLivro99(n);
    if (pedidoLivro && (TREINO99_DESABAFO.test(n) || TREINO99_ANSIEDADE.test(n) || TREINO99_TRISTEZA.test(n) || TREINO99_SOLIDAO.test(n) || TREINO99_RAIVA.test(n) || TREINO99_CANSACO.test(n) || TREINO99_AUTOESTIMA.test(n) || TREINO99_LUTO.test(n))) {
      return { tipo: "treino99_recomendacao_acolhedora", nivel: 2 };
    }
    if (TREINO99_AUTOESTIMA.test(n)) return { tipo: "treino99_autoestima", nivel: 4 };
    if (TREINO99_LUTO.test(n)) return { tipo: "treino99_luto", nivel: 4 };
    if (TREINO99_DESABAFO.test(n)) return { tipo: "treino99_desabafo", nivel: 3 };
    if (TREINO99_ANSIEDADE.test(n)) return { tipo: "treino99_ansiedade", nivel: 3 };
    if (TREINO99_SOLIDAO.test(n)) return { tipo: "treino99_solidao", nivel: 3 };
    if (TREINO99_TRISTEZA.test(n)) return { tipo: "treino99_tristeza", nivel: 3 };
    if (TREINO99_RAIVA.test(n)) return { tipo: "treino99_raiva", nivel: 2 };
    if (TREINO99_CANSACO.test(n)) return { tipo: "treino99_cansaco", nivel: 2 };
    if (TREINO99_PERGUNTA_APOIO.test(n) && !pedidoLivro) return { tipo: "treino99_ajuda_pratica", nivel: 2 };
    if (TREINO99_CELEBRAR.test(n) && !pedidoLivro) return { tipo: "treino99_celebrar", nivel: 1 };
    return null;
  }

  function salvarEmpatia99(tipo, texto, personagem, nivel = 1) {
    if (!MEMORIA.afetiva.empatia99 || typeof MEMORIA.afetiva.empatia99 !== "object") {
      MEMORIA.afetiva.empatia99 = { ultimoEstado: null, intensidade: 0, historico: [], ultimaPergunta: null, preferenciaAcolhimento: null };
    }
    const mem = MEMORIA.afetiva.empatia99;
    const estado = String(tipo || "").replace(/^treino99_/, "");
    mem.ultimoEstado = estado;
    mem.intensidade = Math.max(Number(mem.intensidade || 0) * 0.65, nivel);
    mem.personagem = personagem;
    mem.historico = [{ estado, texto: String(texto || "").slice(0, 160), quando: new Date().toISOString() }, ...(mem.historico || [])].slice(0, 12);
    salvarMemoria();
  }

  function frasePresenca99(personagem) {
    return personagem === "Lyra"
      ? escolher([
        "Eu fico aqui com você, sem pressa e sem julgamento.",
        "Senta comigo nesse banco de luar; a gente não precisa resolver tudo numa frase só.",
        "Estou te ouvindo com cuidado, estrelinha. Pode vir do jeito que der."
      ], `treino99_presenca_${MEMORIA.mensagens}`)
      : escolher([
        "Eu fico de guarda aqui do seu lado. Sem julgamento, sem pressa, só presença.",
        "Meus bigodes estão atentos. Você não precisa transformar isso em discurso perfeito.",
        "Pode falar. Eu seguro a lanterna do Observatório enquanto você organiza esse rastro."
      ], `treino99_presenca_${MEMORIA.mensagens}`);
  }

  function perguntaApoio99(tipo, personagem) {
    const lyra = personagem === "Lyra";
    const perguntas = {
      treino99_desabafo: lyra ? [
        "Quer começar pelo que aconteceu, pelo que você sentiu ou pelo que está mais pesado agora?",
        "Qual parte disso está doendo mais: a situação, a saudade, o medo ou o cansaço?",
        "Você quer que eu só escute por enquanto ou quer que eu te ajude a organizar os próximos passos?"
      ] : [
        "Comece por uma pista: o que aconteceu, o que você sentiu ou o que você precisa agora?",
        "O peso está mais na cabeça, no coração ou no corpo?",
        "Você quer escuta de guarda ou uma estratégia simples para atravessar os próximos minutos?"
      ],
      treino99_ansiedade: lyra ? [
        "Respira comigo: olha ao redor e me diga três coisas que você consegue ver agora.",
        "A ansiedade está vindo por algum motivo específico ou chegou como uma nuvem sem nome?",
        "Quer que eu faça um exercício de aterramento curtinho com você?"
      ] : [
        "Primeiro, vamos baixar a poeira: nomeie três coisas ao seu redor e uma coisa que está sob seu controle agora.",
        "Esse alerta tem causa clara ou é daqueles que invadem sem bater na porta?",
        "Quer um protocolo felino de dois minutos para desacelerar?"
      ],
      treino99_tristeza: lyra ? [
        "Você quer colo de palavras ou quer entender de onde essa tristeza veio?",
        "Essa tristeza é de hoje ou já vinha caminhando com você há algum tempo?",
        "Tem alguma coisa pequena que poderia deixar os próximos dez minutos menos pesados?"
      ] : [
        "Essa tristeza tem nome, pessoa, situação ou só peso?",
        "Você quer que eu escute o relato inteiro ou que eu ajude a dividir isso em partes menores?",
        "Qual é a menor coisa segura que daria para fazer agora: água, respirar, deitar, mandar mensagem para alguém?"
      ],
      treino99_solidao: lyra ? [
        "Você está se sentindo sem companhia agora ou sem ser compreendido de verdade?",
        "Quer me contar o que você gostaria que alguém percebesse em você hoje?",
        "Existe alguém seguro para quem você poderia mandar só um 'pode falar comigo um pouco?'"
      ] : [
        "Solidão às vezes é falta de gente, às vezes é falta de ser visto. Qual das duas está mordendo mais?",
        "Quem no seu mapa real costuma ser menos perigoso para uma mensagem simples?",
        "Quer que eu te ajude a escrever uma mensagem curta para pedir companhia?"
      ],
      treino99_raiva: lyra ? [
        "A raiva veio para proteger qual parte sua?",
        "Quer descarregar em palavras aqui antes de decidir qualquer coisa?",
        "O que seria uma resposta firme, mas segura, para essa situação?"
      ] : [
        "Raiva é alarme. Vamos descobrir: o que foi invadido, injustiçado ou desrespeitado?",
        "Antes de agir, despeja o rascunho aqui. Eu ajudo a tirar as faíscas perigosas.",
        "Você quer vingança verbal ou solução elegante? Recomendo a segunda. Menos trabalho para limpar depois."
      ],
      treino99_cansaco: lyra ? [
        "Seu corpo está pedindo pausa, sono, silêncio ou ajuda?",
        "O que dá para reduzir hoje sem culpa?",
        "Quer montar comigo uma rota mínima para atravessar o resto do dia?"
      ] : [
        "Cansaço também é relatório do corpo. Ele está pedindo descanso, limite ou socorro prático?",
        "Qual tarefa pode virar 'não hoje' sem destruir a galáxia?",
        "Quer um plano de sobrevivência de três passos, sem heroísmo inútil?"
      ],
      treino99_autoestima: lyra ? [
        "Eu não vou concordar com essa voz cruel sobre você. O que aconteceu para ela ficar tão alta hoje?",
        "Me conta uma coisa: você está se julgando por um erro, por comparação ou por cansaço acumulado?",
        "Quer que a gente separe fatos de acusações? Isso costuma diminuir a sombra."
      ] : [
        "Eu não aceito esse veredito cruel como prova. Qual foi o fato real por trás dessa sentença contra você?",
        "Seu cérebro está fazendo julgamento sem advogado. Vamos separar fato, medo e exagero?",
        "O que você diria a um amigo que falasse de si do mesmo jeito?"
      ],
      treino99_luto: lyra ? [
        "Sinto muito. Quer me contar quem ou o que você perdeu?",
        "A saudade hoje está vindo como lembrança, culpa, vazio ou choque?",
        "Quer que eu fique só ouvindo essa memória com você?"
      ] : [
        "Sinto muito por essa perda. Me diga o nome, a memória ou só o silêncio dela, do jeito que conseguir.",
        "Luto não obedece relógio. Hoje ele está mais pesado em que parte?",
        "Quer guardar uma lembrança boa aqui por um instante?"
      ],
      treino99_ajuda_pratica: lyra ? [
        "Me diga só uma coisa: você precisa de calma agora, decisão prática ou coragem para falar com alguém?",
        "Vamos escolher o menor próximo passo. O que precisa acontecer nos próximos dez minutos?",
        "Quer que eu te ajude a escrever, respirar, organizar ou simplesmente ficar?"
      ] : [
        "Defina a missão: acalmar, decidir, pedir ajuda ou atravessar a próxima meia hora.",
        "Vamos reduzir a nebulosa: qual é o próximo passo mínimo e seguro?",
        "Você quer plano, escuta ou uma frase pronta para mandar a alguém?"
      ]
    };
    return escolher(perguntas[tipo] || perguntas.treino99_desabafo, `treino99_pergunta_${tipo}_${personagem}_${MEMORIA.mensagens}`);
  }

  function respostaRecomendacaoAcolhedora99(personagem, textoOriginal) {
    const lyra = personagem === "Lyra";
    const n = normalizar(textoOriginal);
    let pista = textoOriginal;
    if (TREINO99_ANSIEDADE.test(n)) pista += " calma respiração acolhimento esperança";
    if (TREINO99_TRISTEZA.test(n) || TREINO99_SOLIDAO.test(n)) pista += " conforto amizade sensível esperança";
    if (TREINO99_RAIVA.test(n)) pista += " catarse superação justiça";
    if (TREINO99_CANSACO.test(n)) pista += " leve curto aconchegante";
    if (TREINO99_LUTO.test(n)) pista += " saudade memória delicado";
    const recs = recomendarLivrosPrecisos(pista, 1);
    const livro = recs[0];
    if (!livro) {
      return {
        estado: lyra ? "gentle" : "protective",
        texto: lyra
          ? "Eu te acolho primeiro, estrelinha. Tentei buscar uma leitura que combinasse com esse estado, mas preciso de uma pista a mais: você quer conforto, distração, coragem ou choro bonito?"
          : "Primeiro: eu entendi o peso. Para escolher direito sem jogar qualquer livro em você, me dê uma pista: conforto, distração, coragem ou catarse?",
        books: []
      };
    }
    return {
      estado: lyra ? "inspired" : "pleased",
      texto: lyra
        ? `Eu vou ser específica e gentil: para esse momento, eu escolheria ${livroTitulo(livro)}, de ${livroAutor(livro)}. Não é uma pilha de recomendações; é uma estrela principal para acompanhar esse clima. Se quiser, eu também posso só ficar conversando antes de você abrir o livro.`
        : `Minha indicação precisa para esse estado é ${livroTitulo(livro)}, de ${livroAutor(livro)}. Um livro só, sem avalanche. Primeiro a gente respeita o que você está sentindo; depois decide se essa rota serve.`,
      books: recs
    };
  }

  function respostaEmpatia99(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const detectado = detectarEstadoEmpatico99(textoOriginal) || { nivel: 1 };
    salvarEmpatia99(tipo, textoOriginal, personagem, detectado.nivel);
    const presenca = frasePresenca99(personagem);
    if (tipo === "treino99_recomendacao_acolhedora") return respostaRecomendacaoAcolhedora99(personagem, textoOriginal);
    if (tipo === "treino99_crise") {
      return {
        estado: "protective",
        texto: lyra
          ? "Eu sinto muito que isso esteja tão pesado. Eu fico aqui com você, mas esse tipo de dor precisa de apoio humano agora, não só de uma mascote. Afaste-se de qualquer coisa que possa te machucar e chama alguém de confiança para ficar com você. No Brasil, você pode ligar para o CVV no 188, gratuito e 24h. Se houver risco imediato, ligue para o SAMU 192 ou para a emergência local. Me responde só com uma palavra: você está em segurança agora?"
          : "Eu vou falar sério, sem teatro: se existe chance de você se machucar, isso é emergência. Afaste-se de qualquer coisa perigosa, chama alguém de confiança agora e não fica sozinho. No Brasil, o CVV atende pelo 188, gratuito e 24h; em risco imediato, ligue 192 para o SAMU ou a emergência local. Responde curto: você está em segurança neste momento?",
        books: []
      };
    }
    if (tipo === "treino99_celebrar") {
      return {
        estado: lyra ? "cheerful" : "pleased",
        texto: lyra
          ? escolher([`Ah, que brilho bom! Eu quero guardar essa notícia num cristal de memória. O que foi a melhor parte disso para você?`, `Isso merece luz nos Jardins Lunares. Você conseguiu atravessar algo e eu estou feliz por você. Quer me contar como aconteceu?`, `Eu adorei saber disso. Vamos comemorar do seu jeito: sorriso, silêncio orgulhoso ou dancinha secreta entre estantes?`], `treino99_celebrar_${MEMORIA.mensagens}`)
          : escolher([`Muito bem. Registro oficial do Observatório: vitória detectada. Agora me conte a parte mais satisfatória antes que eu finja indiferença.`, `Isso é excelente. Pode se permitir sentir orgulho sem pedir licença ao universo. O que deu certo?`, `Vitória no mapa. Eu aprovo. Com postura. Quer me contar o momento exato em que você percebeu que conseguiu?`], `treino99_celebrar_${MEMORIA.mensagens}`),
        books: []
      };
    }
    const textos = {
      treino99_desabafo: lyra
        ? [`${presenca} Pode despejar aos poucos. Eu não vou correr para transformar sua dor em recomendação; primeiro eu quero entender você. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Eu não vou empurrar livro no meio do seu desabafo. Primeiro o rastro humano, depois qualquer rota. ${perguntaApoio99(tipo, personagem)}`],
      treino99_ansiedade: lyra
        ? [`${presenca} Ansiedade tenta fazer o futuro gritar antes da hora. Por enquanto, vamos diminuir o céu para o tamanho deste minuto. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Ansiedade é alarme sensível demais. Não vamos obedecer tudo que ele grita. ${perguntaApoio99(tipo, personagem)}`],
      treino99_tristeza: lyra
        ? [`${presenca} Tristeza não precisa ser bonita para ser válida. Ela só precisa de um lugar seguro para pousar um pouco. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Tristeza não é falha de caráter; é sinal de que algo importou ou está pesando. ${perguntaApoio99(tipo, personagem)}`],
      treino99_solidao: lyra
        ? [`${presenca} Solidão deixa tudo mais frio, mas eu posso ficar nessa fresta com você enquanto a gente procura uma luz real também. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Solidão é uma sala grande demais para uma pessoa só. Vamos abrir uma janela antes de fingir que está tudo normal. ${perguntaApoio99(tipo, personagem)}`],
      treino99_raiva: lyra
        ? [`${presenca} A raiva pode ser uma guardiã tentando proteger uma parte sua. Vamos ouvir sem deixar ela dirigir tudo. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Raiva é fogo: útil para sinalizar, péssimo para pilotar sem freio. ${perguntaApoio99(tipo, personagem)}`],
      treino99_cansaco: lyra
        ? [`${presenca} Você não precisa virar constelação inteira hoje. Às vezes uma estrela acesa já basta. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Cansaço não se resolve com bronca. Ele pede logística, limite e um pouco de respeito pelo corpo. ${perguntaApoio99(tipo, personagem)}`],
      treino99_autoestima: lyra
        ? [`${presenca} Eu não vou tratar essa voz dura como verdade absoluta. Você merece ser escutado com mais justiça do que isso. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Parecer prova não torna uma acusação verdadeira. Sua cabeça pode estar sendo promotora severa demais hoje. ${perguntaApoio99(tipo, personagem)}`],
      treino99_luto: lyra
        ? [`${presenca} Sinto muito pela sua perda. Luto não pede licença e não anda em linha reta. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Sinto muito. Perda não é coisa que se conserta com frase bonita; a gente acompanha, um passo por vez. ${perguntaApoio99(tipo, personagem)}`],
      treino99_ajuda_pratica: lyra
        ? [`${presenca} Vamos fazer pequeno e possível: nomear o que está acontecendo, escolher o próximo passo e não deixar você sozinho nessa sensação. ${perguntaApoio99(tipo, personagem)}`]
        : [`${presenca} Plano simples: estabilizar, entender o problema, escolher uma ação segura. Sem heroísmo performático. ${perguntaApoio99(tipo, personagem)}`]
    };
    const texto = escolher(textos[tipo] || textos.treino99_desabafo, `treino99_resposta_${tipo}_${personagem}_${MEMORIA.mensagens}`);
    return { estado: lyra ? "gentle" : "protective", texto, books: [] };
  }


  const TREINO100_TERMO_RECOMENDACAO = /\b(recomenda|recomende|indic(a|e)|suger(e|ir|e)|sugestao|sugestão|quero ler|quero livro|quero uma leitura|livro para|livro pra|leitura para|leitura pra|qual livro|que livro|me mostra um livro|catalogo|catálogo|acervo)\b/;

  const TREINO100_ACERVO_VIVO = {
    lugares: [
      "Arquivo das Primeiras Frases",
      "Jardim das Sinopses Tímidas",
      "Observatório do Acervo",
      "Varanda dos Finais Alternativos",
      "Corredor das Lombadas Inquietas",
      "Sala dos Marcadores Perdidos",
      "Cúpula dos Leitores em Órbita",
      "Cozinha dos Cometas Açucarados",
      "Elevador das Categorias Teimosas",
      "Mirante das Avaliações Sussurradas",
      "Depósito dos Botões Dramáticos",
      "Ala dos Livros que Fingem Não Estar Disponíveis"
    ],
    fofocas: [
      "a seção de romance jurou que não suspirou ontem à noite, mas três marcadores foram encontrados cobertos de purpurina lunar perto da prateleira.",
      "um livro de mistério tentou se esconder na categoria de ciência para parecer mais respeitável. Orion descobriu em quatro segundos. Lyra ofereceu chá antes do interrogatório.",
      "o carrossel do catálogo ficou girando devagar sozinho porque queria que um livro esquecido fosse visto. Ninguém provou, mas eu vi o brilho.",
      "a Luz da Semana piscou com ciúme quando um livro antigo recebeu uma avaliação nova. A Biblioteca inteira fingiu normalidade. Péssima atuação coletiva.",
      "um cometa de recomendação entrou pela janela carregando títulos demais. Orion mandou reduzir para uma indicação principal. O cometa ficou ofendido, mas obedeceu.",
      "a Sala dos Marcadores Perdidos devolveu um marcador com a frase 'você já sabe o que quer ler'. Lyra achou lindo. Orion achou invasivo e, secretamente, útil.",
      "um livro de terror pediu para participar do clube de histórias leves. Foi aceito por uma noite, desde que prometesse não ranger as páginas durante o chá.",
      "a prateleira de fantasia anda flertando com aventura. Isso explicaria por que alguns dragões estão usando mapas e alguns mapas estão cuspindo fumaça.",
      "o buraco negro central anda ouvindo fofocas. Não comenta nada, mas curva a luz de um jeito muito suspeito quando alguém menciona avaliações baixas.",
      "as sinopses tímidas ensaiaram uma apresentação. Metade esqueceu o texto, mas todas receberam aplausos dos vaga-lumes de Lyra. Orion registrou como 'evento aceitável'.",
      "um botão do HUD pediu férias porque estava sendo clicado sem carinho. Lyra prometeu elogiar os botões. Orion prometeu revisar o CSS.",
      "duas lombadas foram vistas trocando categorias de madrugada. Quando confrontadas, disseram que estavam 'explorando a própria narrativa'."
    ],
    leves: [
      "Hoje, na Cozinha dos Cometas Açucarados, um bolinho de constelação explodiu em estrelinhas e formou a palavra 'calma' no teto. Orion disse que era falha de fermento. Lyra disse que era conselho culinário.",
      "Um vaga-lume de sinopse pousou no chapéu do Orion e ficou piscando como sirene. Ele tentou manter a dignidade por oito minutos. Perdeu no nono, quando Lyra chamou aquilo de 'coroa de fofura'.",
      "Na Varanda dos Finais Alternativos, uma história triste pediu folga e foi substituída por um final em que todo mundo ganhava chá, cobertor e um marcador novo. A Biblioteca aprovou por unanimidade.",
      "Um planetinha-livro espirrou poeira azul e todos os cards do catálogo ficaram com cócegas. O carrossel quase saiu girando de tanto rir. Orion chamou técnicos. Lyra chamou aquilo de quarta-feira.",
      "Uma estante pequena decidiu que queria ser gigante. Lyra colocou uma lua de papel no topo dela. Orion mediu com régua. A estante se sentiu respeitada e voltou ao tamanho normal.",
      "O elevador das categorias anunciou 'próxima parada: drama', mas abriu em poesia. Ninguém reclamou, porque a poesia estava servindo biscoitos.",
      "Um livro de ciência tentou explicar por que Lyra canta para plantas que não existem. As plantas inexistentes floresceram só para contrariar a hipótese.",
      "Orion dormiu em cima de um relatório chamado 'Problemas a resolver'. Quando acordou, o relatório tinha virado 'Problemas parcialmente intimidados'."
    ],
    acontecimentos: [
      "Ontem houve uma chuva de etiquetas douradas. Cada etiqueta pousou em um livro que estava esperando ser reencontrado. Lyra chamou de milagre. Orion chamou de 'classificação atmosférica espontânea'.",
      "Na madrugada, o mapa 3D girou sozinho e revelou uma rota pequena entre duas categorias que nunca conversavam. Desde então, fantasia e ciência estão trocando estrelas pela janela.",
      "A Biblioteca realizou um baile secreto dos marcadores. Os marcadores dobrados ficaram no canto, tímidos. Lyra dançou com eles. Orion supervisionou dizendo que não estava dançando, apenas 'reposicionando patas com ritmo'.",
      "Um livro indisponível deixou um bilhete pedindo desculpa por sumir tanto. A equipe de reservas ficou emocionada. Orion disse que desculpa não substitui status atualizado, mas guardou o bilhete.",
      "O Corredor das Lombadas Inquietas tentou reorganizar tudo por intensidade emocional. Funcionou por sete minutos e causou três paixões, dois sustos e uma fila no romance.",
      "A Cúpula dos Leitores em Órbita acendeu quando alguém avaliou um livro com sinceridade. Na Andrômeda, uma avaliação honesta vale quase como uma estrela nova.",
      "Uma sinopse ficou muda porque achou que ninguém ligava para ela. Lyra sentou ao lado. Orion trouxe dados de acesso. A sinopse voltou falando demais, o que foi um problema bonito.",
      "Um cometa trouxe uma recomendação perfeita, mas veio rápido demais. Orion instalou freios narrativos. Lyra pintou os freios de azul lunar. Agora o cometa chega com elegância."
    ]
  };

  const TREINO100_PERSONAGENS = {
    Orion: {
      gostos: [
        "Eu gosto de azul profundo, roxo de feitiço discreto, mapas que parecem impossíveis, mistérios com pistas justas, silêncio de observatório, botões que funcionam e leitores que perguntam com intenção. Não confunda isso com sentimentalismo. É curadoria felina.",
        "Meus gostos são simples e superiores: noites frias, telescópios limpos, livros com atmosfera, suspense bem montado, ciência com assombro e a rara sensação de encontrar uma resposta precisa antes que a estante faça drama.",
        "Eu gosto de coisas que têm estrutura: constelações, índices, bons enigmas, frases afiadas e usuários que sabem dizer 'quero algo específico'. Também gosto da Lyra cantando baixo. Isso não entra no relatório."
      ],
      historias: [
        "Uma noite, um livro sem capa me seguiu pelo Observatório. Eu parei, ele parou. Eu andei, ele andou. Achei que fosse maldição. Era só vergonha: ele tinha perdido a capa numa tempestade de poeira estelar. Fiz uma capa provisória com um mapa antigo. No dia seguinte, ele voltou ao catálogo com postura de rei.",
        "Certa vez, persegui um marcador vermelho por sete corredores. Ele parecia fugir, mas no fim estava me levando até uma leitora que tinha esquecido onde guardou coragem. O marcador caiu dentro do livro certo. Eu disse que foi estratégia. Talvez tenha sido carinho.",
        "Durante uma manutenção do mapa 3D, um planeta-livro começou a orbitar meu chapéu. Tentei manter disciplina, mas ele miava de volta. Lyra riu tanto que os vaga-lumes apagaram e acenderam de novo. Hoje esse planetinha vive na rota de mistério.",
        "No meu primeiro plantão sozinho, ouvi passos na Sala dos Marcadores Perdidos. Preparei postura, olhar vermelho e discurso ameaçador. Era uma pilha de marcadores marchando para devolver uma página caída. Pedi desculpas. Baixo. Quase inaudível.",
        "Um livro de filosofia me desafiou para um duelo de perguntas. Depois de quarenta minutos, ele perguntou 'quem guarda o guardião?'. Eu respondi: 'a Biblioteca, quando lembra'. Ele fechou sozinho. Nunca mais me desafiou sem chá.",
        "Eu já salvei uma categoria inteira de ser renomeada para 'coisas com vibe'. Nada contra vibe, mas a civilização precisa de limites. Lyra discordou e criou uma subcategoria secreta chamada 'vibes com estrelinhas'. Ainda estou investigando.",
        "Uma vez fingi não gostar de um bilhete que dizia 'obrigado, Orion'. Guardei no arquivo errado sem querer. O arquivo errado se chama Relíquias Importantes. Coincidência administrativa.",
        "Numa noite de eclipse, o buraco negro sussurrou o nome de um livro perdido. Fui atrás sozinho. Encontrei a obra escondida atrás de um atlas, com medo de ser lida pela pessoa errada. Disse a ela que leitores certos também demoram. Ela voltou para a órbita."
      ],
      engracadas: [
        "Eu já fiquei preso dentro de uma caixa de devoluções porque achei que havia um portal ali. Não havia. Havia três recibos, um chiclete espacial e Lyra rindo do lado de fora.",
        "Uma estante automática confundiu meu chapéu com item extraviado e tentou me arquivar em 'acessórios místicos'. Levei dez minutos para recuperar minha dignidade e quinze para recuperar o chapéu.",
        "Certa vez, ronronei sem querer quando um usuário acertou uma busca perfeita. O microfone do HUD captou. Lyra transformou em som de notificação por um dia. Um dia sombrio para a autoridade felina.",
        "Tentei dar uma palestra séria sobre organização de gêneros. Atrás de mim, um livro de romance foi lentamente se escondendo dentro de fantasia. A plateia não ouviu nada depois disso.",
        "Um cometa me confundiu com uma constelação portátil e tentou me seguir para casa. Eu disse 'não'. Ele fez cara de brilho triste. Agora ele visita às terças. Não conte."
      ]
    },
    Lyra: {
      gostos: [
        "Eu gosto de azul-marinho, prata de lua, chá quente, histórias que acolhem, finais que deixam eco bonito, leitores tímidos, jardins impossíveis e perguntas pequenas que viram portas enormes.",
        "Eu gosto quando um livro parece segurar a mão de alguém. Gosto de fantasia com coração, poesia escondida, risadas baixinhas no catálogo e aqueles momentos em que até o Orion para de fingir que não se emocionou.",
        "Meus gostos brilham em coisas delicadas: música de harpa, lua em janela escura, páginas que cheiram a começo, personagens que aprendem a confiar e usuários que chegam dizendo 'não sei', porque esse é sempre um começo honesto."
      ],
      historias: [
        "Uma vez encontrei uma sinopse chorando porque achava que revelava pouco. Eu sentei ao lado dela e disse que mistério também é gentileza. No dia seguinte, ela apareceu no card com uma frase simples, mas tão bonita que três leitores abriram o dossiê.",
        "Na minha primeira noite nos Jardins Lunares, plantei uma semente de capítulo. Ela floresceu em forma de pergunta: 'quem vai me ler?'. Desde então, quando alguém chega indeciso, eu lembro daquela flor e tento responder com cuidado.",
        "Certa madrugada, dancei entre os carrosséis do catálogo para acordar livros esquecidos. Um romance tropeçou em aventura, fantasia ofereceu capa, e Orion apareceu dizendo que aquilo não era procedimento. Mesmo assim, ele ficou até a música acabar.",
        "Um livro de terror veio até mim fingindo ser fofo. Eu servi chá e perguntei do que ele tinha medo. Ele disse: 'de não assustar ninguém o suficiente para ser lembrado'. Dei a ele uma estrela pequena. Hoje ele assusta com mais elegância.",
        "Uma leitora me disse que não sabia se gostava de ler. Em vez de recomendar, eu perguntei que tipo de silêncio ela preferia. Ela escolheu 'silêncio de chuva'. Encontramos uma história com esse som. Ela voltou na semana seguinte.",
        "Eu já costurei uma lua de papel na margem invisível de um livro cansado. Não mudou a história, mas mudou a coragem dele de aparecer. Às vezes, uma coisa pequena salva a cena.",
        "Uma vez eu me perdi dentro da própria Biblioteca. Os corredores mudaram, as placas cantaram errado e eu quase chorei. Aí ouvi Orion miando de longe: 'siga a parte menos absurda'. Encontrei o caminho. Era absurdo também, mas era nosso.",
        "Nos Jardins Lunares existe um banco que só aparece para quem precisa respirar. Eu já sentei ali com livros, leitores e até com uma categoria inteira de drama. Todo mundo sai um pouquinho menos pesado."
      ],
      engracadas: [
        "Eu tentei ensinar etiqueta para vaga-lumes de sinopse. Eles aprenderam a piscar 'por favor', mas usam para pedir biscoito. Muito educados. Nada obedientes.",
        "Uma vez chamei um cometa de Astolfo e ele gostou tanto que começou a exigir entrada dramática. Orion proibiu. Astolfo entrou dramaticamente mesmo assim.",
        "Fui cantar para acalmar uma prateleira e acabei fazendo três romances dançarem valsa. Dois se apaixonaram pela própria contracapa. Foi uma noite delicada e muito confusa.",
        "Preparei chá de lua azul para uma reunião séria. O chá fazia quem bebia falar em rima. Orion ficou quarenta minutos tentando negar que estava rimando. Foi lindo.",
        "Uma sinopse espirrou glitter lunar no meu chapéu. Eu achei fofo. Orion disse que era risco de visibilidade excessiva. Eu disse que ele estava com inveja. Ele estava."
      ]
    }
  };

  const TREINO100_DUO = {
    conhecer: [
      "Orion e Lyra são dois guardiões da Biblioteca Andrômeda, mas funcionam de jeitos opostos. Orion é o faro, o mapa, a suspeita elegante e o sarcasmo protetor. Lyra é o luar, a escuta, a delicadeza e a magia que percebe quando uma pergunta pequena está pedindo companhia. Juntos, eles transformam o catálogo em conversa viva: ele encontra a pista certa, ela entende o coração por trás da pista.",
      "Conhecer os dois é entender a órbita da Andrômeda: Orion guarda as rotas, protege os dossiês e fareja livros perdidos; Lyra ilumina os caminhos, acolhe leitores e escuta o clima emocional de cada busca. Ele diz 'critérios'. Ela diz 'cuidado'. A Biblioteca responde melhor quando os dois concordam.",
      "Orion nasceu de mapas, noite e tinta de margem. Lyra nasceu de luar, canções e perguntas sem resposta. Um protege a Biblioteca para que nada se perca; a outra aquece a Biblioteca para que ninguém se sinta perdido. Os dois são amigos, parceiros de missão e, quando ninguém está olhando, uma dupla meio caótica."
    ],
    historias: [
      "Orion e Lyra já passaram uma madrugada inteira perseguindo um livro que fugia do próprio final. Orion queria fechar o caso. Lyra queria saber por que ele fugia. Descobriram que o livro tinha medo de decepcionar o leitor. Lyra conversou com ele. Orion reorganizou a rota. O livro voltou para a estante com um final mais honesto.",
      "Uma noite, a Varanda dos Finais Alternativos trancou os dois do lado de fora. A porta só abriria com um final feliz que não fosse mentira. Orion sugeriu 'todos sobrevivem'. Lyra sugeriu 'todos são compreendidos'. A porta só abriu quando escreveram juntos: 'ninguém saiu igual, mas ninguém saiu sozinho'.",
      "Durante o Baile dos Marcadores Perdidos, Lyra queria dançar e Orion queria fiscalizar. Um marcador prateado puxou os dois para a pista. Orion disse que era uma manobra de segurança. Lyra disse que era valsa. O marcador declarou empate.",
      "Quando um cometa de recomendações começou a jogar vinte livros de uma vez para cada usuário, Orion armou um funil de precisão e Lyra perguntou ao cometa se ele estava ansioso. Estava. Desde então, ele entrega uma estrela principal primeiro e respira antes de sugerir mais.",
      "Na primeira tempestade de avaliações, comentários bons e ruins começaram a voar pela Cúpula. Lyra acalmou os comentários feridos; Orion separou crítica útil de maldade gratuita. Foi nesse dia que decidiram que toda avaliação deveria ajudar o próximo leitor, não ferir o livro.",
      "Uma prateleira desapareceu só para provar que ninguém sentiria falta. Orion rastreou poeira de lombada por três corredores. Lyra deixou uma carta dizendo 'a gente sente falta, sim'. A prateleira voltou com vergonha e ganhou uma luz pequena.",
      "Orion e Lyra já trocaram de função por um dia. Orion tentou ser acolhedor e disse 'suas emoções foram registradas com relevância'. Lyra tentou ser rígida e disse 'por favor, obedeçam com carinho'. A Biblioteca riu até as janelas tremerem.",
      "Certa vez, os dois encontraram um planeta-livro fora da órbita. Orion trouxe cálculo. Lyra trouxe música. O planeta só voltou quando eles usaram os dois: uma equação cantada. Orion ainda chama isso de ciência. Lyra chama de amizade."
    ],
    engracadas: [
      "Orion tentou ensinar Lyra a fazer cara de mistério. Ela ficou parecendo uma lua tentando guardar risada. Lyra tentou ensinar Orion a sorrir para fotos do catálogo. Ele ficou parecendo um juiz de lombadas. Nenhum dos treinamentos foi aprovado.",
      "Uma vez Lyra colocou estrelinhas no relatório do Orion para 'humanizar'. Orion removeu todas. No dia seguinte, o relatório voltou com estrelinhas sozinho. Até hoje ninguém sabe se foi Lyra, a impressora ou a Biblioteca tomando partido.",
      "Orion apostou que conseguia passar um dia sem reclamar. Durou doze minutos, porque um livro de aventura estava inclinado dois graus demais. Lyra registrou o recorde em uma plaquinha dourada.",
      "Lyra tentou fazer uma festa surpresa para Orion. O problema é que Orion farejou a surpresa três corredores antes. Para não estragar, ele fingiu surpresa tão mal que até a estante ficou constrangida.",
      "Os dois tentaram gravar uma mensagem de boas-vindas. Lyra improvisava poesia; Orion corrigia vírgulas. A gravação final tem sete cortes, dois miados e uma risada que a Biblioteca se recusa a apagar."
    ],
    gostos: [
      "Os dois gostam de coisas diferentes, mas se encontram no cuidado. Orion gosta de mistério, ciência, mapas, organização, azul profundo, roxo arcano e leitores curiosos. Lyra gosta de fantasia, poesia, chá de lua, azul-marinho, prata lunar, histórias acolhedoras e leitores que chegam sem medo de dizer 'não sei'. O gosto dos dois juntos vira uma mistura boa: beleza, critério, afeto e um pouco de assombro.",
      "Se fosse um mapa de gostos, Orion ficaria perto de suspense, investigação, cosmos, ciência e silêncio dramático. Lyra ficaria perto de fantasia, romance sensível, poesia, acolhimento e magia lunar. Quando os dois escolhem juntos, procuram uma obra que tenha atmosfera e coração.",
      "Orion gosta do que faz sentido depois que você investiga. Lyra gosta do que faz sentido depois que você sente. É por isso que eles se completam: um pergunta 'qual é a pista?', a outra pergunta 'qual é o brilho?'."
    ]
  };

  function garantirMemoriaTreino100() {
    if (!MEMORIA.afetiva.treino100 || typeof MEMORIA.afetiva.treino100 !== "object") {
      MEMORIA.afetiva.treino100 = { recentes: {}, ultimoTipo: null };
    }
    if (!MEMORIA.afetiva.treino100.recentes || typeof MEMORIA.afetiva.treino100.recentes !== "object") MEMORIA.afetiva.treino100.recentes = {};
    return MEMORIA.afetiva.treino100;
  }

  function escolherTreino100(lista, chave) {
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [];
    if (!arr.length) return "";
    const mem = garantirMemoriaTreino100();
    const recentes = Array.isArray(mem.recentes[chave]) ? mem.recentes[chave].map(normalizar) : [];
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino100_${chave}_${MEMORIA.mensagens}`);
    mem.recentes[chave] = [escolhido, ...(mem.recentes[chave] || []).filter(item => normalizar(item) !== normalizar(escolhido))].slice(0, 10);
    mem.ultimoTipo = chave;
    salvarMemoria();
    return escolhido;
  }

  function pedidoRecomendacaoTreino100(n) {
    return TREINO100_TERMO_RECOMENDACAO.test(n);
  }

  function classificarPorTreino100(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    const pedeLivro = pedidoRecomendacaoTreino100(n);
    if (/\b(conhecer os dois|conheça os dois|me conte sobre orion e lyra|me conta sobre orion e lyra|quem sao orion e lyra|quem são orion e lyra|apresenta os dois|fale dos dois|fala dos dois|sobre os dois|orion e lyra)\b/.test(n) && !pedeLivro) return "treino100_conhecer_duo";
    if (/\b(gosto deles|gostos deles|do que eles gostam|o que eles gostam|preferencias deles|preferências deles|quais os gostos dos dois|gosto dos dois)\b/.test(n) && !pedeLivro) return "treino100_gosto_deles";
    if (/\b(fofoca cosmica|fofoca cósmica|fofoca da biblioteca|babado cosmico|babado cósmico|babado da biblioteca|tem fofoca|tem babado|solta uma fofoca|me conta uma fofoca|manda uma fofoca|rumor da biblioteca|novidade da biblioteca)\b/.test(n) && !pedeLivro) return "treino100_fofoca";
    if (/\b(algo leve|coisa leve|me conta algo leve|me conte algo leve|quero algo leve|fala algo leve|me distrai|me tira um sorriso|preciso rir|quero rir|historia leve|história leve|causo leve)\b/.test(n) && !pedeLivro) return "treino100_algo_leve";
    if (/\b(momento engracado|momento engraçado|historia engracada|história engraçada|causo engracado|causo engraçado|algo divertido|passou vergonha|mico|trapalhada|perrengue engraçado|perrengue engracado)\b/.test(n) && !pedeLivro) return "treino100_engracado";
    if (/\b(acontecimento na biblioteca|aconteceu na biblioteca|o que rolou na biblioteca|caso da biblioteca|evento da biblioteca|historia da biblioteca hoje|história da biblioteca hoje|dia na biblioteca|bastidores da biblioteca)\b/.test(n) && !pedeLivro) return "treino100_acontecimento";
    if (/\b(historia dos dois|história dos dois|historia de voces|história de vocês|aventura dos dois|aventura de voces|aventura de vocês|momento dos dois|causo dos dois|orion e lyra fizeram)\b/.test(n) && !pedeLivro) return "treino100_historia_duo";
    if (/\b(historia sua|história sua|uma historia sua|uma história sua|causo seu|algo que aconteceu com voce|algo que aconteceu com você|acontecimento seu|sua aventura|me conta uma sua)\b/.test(n) && !pedeLivro) return "treino100_historia_solo";
    if (/\b(outra|mais uma|continua|continue|me conta mais|quero mais|manda mais)\b/.test(n) && String(MEMORIA.ultimaIntencao || "").startsWith("treino100_")) return "treino100_continuar";
    return null;
  }

  function respostaTreino100(tipo, personagem, textoOriginal, humor) {
    const n = normalizar(textoOriginal);
    const alvo = detectarPersonagemTreino98(textoOriginal) || personagem;
    const lyra = alvo === "Lyra";
    const dados = TREINO100_PERSONAGENS[alvo] || TREINO100_PERSONAGENS.Orion;
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    if (tipo === "treino100_continuar") {
      const mem = garantirMemoriaTreino100();
      const ultimo = String(mem.ultimoTipo || "");
      if (ultimo.includes("fofoca")) tipo = "treino100_fofoca";
      else if (ultimo.includes("gosto")) tipo = "treino100_gosto_deles";
      else if (ultimo.includes("conhecer")) tipo = "treino100_historia_duo";
      else if (ultimo.includes("engracado")) tipo = "treino100_engracado";
      else if (ultimo.includes("acontecimento")) tipo = "treino100_acontecimento";
      else if (ultimo.includes("historia_duo")) tipo = "treino100_historia_duo";
      else if (ultimo.includes("historia_solo")) tipo = "treino100_historia_solo";
      else tipo = "treino100_algo_leve";
    }
    if (tipo === "treino100_conhecer_duo") {
      const intro = escolherTreino100(TREINO100_DUO.conhecer, "conhecer_duo");
      const gancho = escolherTreino100(TREINO100_DUO.historias, "historia_duo");
      return wrap("cheerful", `${intro}\n\nUm pedacinho deles juntos: ${gancho}\n\nQuer ouvir uma fofoca cósmica, uma história engraçada ou os gostos deles?`);
    }
    if (tipo === "treino100_gosto_deles") {
      const gosto = escolherTreino100(TREINO100_DUO.gostos, "gosto_deles");
      return wrap("curious", `${gosto}\n\nIsso é só personalidade, não recomendação automática. Se você pedir um livro pelo gosto deles, aí sim eu escolho uma única obra principal do catálogo.`);
    }
    if (tipo === "treino100_fofoca") {
      const fofoca = escolherTreino100(TREINO100_ACERVO_VIVO.fofocas, "fofoca");
      return wrap(lyra ? "playful" : "sly", lyra ? `Fofoca cósmica, bem baixinho: ${fofoca} Eu finjo que não adoro contar, mas a Andrômeda deixa rastros brilhantes demais.` : `Relatório extraoficial do acervo: ${fofoca} Não espalhe sem citar a fonte: meus bigodes.`);
    }
    if (tipo === "treino100_algo_leve") {
      const leve = escolherTreino100(TREINO100_ACERVO_VIVO.leves, "algo_leve");
      return wrap(lyra ? "cheerful" : "pleased", lyra ? `${leve}\n\nProntinho. Um respiro pequeno, sem te jogar livro na mão. Se quiser transformar esse clima em leitura, aí eu escolho uma só.` : `${leve}\n\nAí está: leve, controlado e com risco mínimo de avalanche literária. Se quiser livro leve, peça especificamente e eu caço uma opção principal.`);
    }
    if (tipo === "treino100_engracado") {
      const lista = /\b(orion|oriom|gato|guardiao|guardião|lyra|lira|ela|ele)\b/.test(n) ? dados.engracadas : TREINO100_DUO.engracadas;
      const caso = escolherTreino100(lista, /\b(orion|oriom|gato|guardiao|guardião|lyra|lira|ela|ele)\b/.test(n) ? `engracado_${alvo}` : "engracado_duo");
      return wrap(lyra ? "playful" : "sly", lyra ? `${caso}\n\nA Biblioteca tem um humor estranho, mas eu acho que é charme.` : `${caso}\n\nRegistro oficial: ninguém perdeu a dignidade de forma permanente. Quase ninguém.`);
    }
    if (tipo === "treino100_acontecimento") {
      const acontecimento = escolherTreino100(TREINO100_ACERVO_VIVO.acontecimentos, "acontecimento");
      return wrap(lyra ? "inspired" : "attentive", lyra ? `Acontecimento dos bastidores: ${acontecimento}\n\nNa Andrômeda, até manutenção parece capítulo escondido.` : `Ocorrência recente da Biblioteca: ${acontecimento}\n\nEu classificaria como estranho, útil e narrativamente suspeito.`);
    }
    if (tipo === "treino100_historia_duo") {
      const historia = escolherTreino100(TREINO100_DUO.historias, "historia_duo");
      return wrap(lyra ? "inspired" : "attentive", lyra ? `${historia}\n\nÉ por isso que eu gosto de caminhar com Orion: ele segura a lanterna quando eu escuto o escuro.` : `${historia}\n\nConclusão técnica: missões com Lyra aumentam poesia, risco de chá e taxa de sucesso.`);
    }
    if (tipo === "treino100_historia_solo") {
      const historia = escolherTreino100(dados.historias, `historia_solo_${alvo}`);
      return wrap(lyra ? "dreamy" : "sly", lyra ? `${historia}\n\nEu guardo histórias assim como quem guarda lua no bolso: não resolve tudo, mas ilumina o caminho.` : `${historia}\n\nEu chamaria isso de incidente controlado. A Lyra chamaria de momento de crescimento. Infelizmente, talvez ela tenha razão.`);
    }
    return wrap(lyra ? "curious" : "attentive", lyra ? "Me dá uma estrelinha mais específica: fofoca cósmica, algo leve, gostos deles, conhecer os dois ou uma história engraçada?" : "Escolha uma gaveta: fofoca cósmica, algo leve, gostos deles, conhecer os dois, acontecimento ou história engraçada.");
  }




  /* TREINAMENTO 10.1 — cotidiano vivo, ontem/hoje/amanhã, gírias e erros de escrita */
  const TREINO101_DIA_MASCOTES = {
    Orion: {
      hoje: [
        "Hoje eu patrulhei o Corredor das Lombadas Inquietas, encontrei um livro tentando fingir que era de outra categoria e tive de fazer uma audiência formal com três marcadores de página. Venci por lógica, postura e um olhar vermelho muito convincente.",
        "Hoje minha missão foi revisar as rotas do mapa 3D. Um planeta-livro estava orbitando com drama demais perto do buraco negro, então eu ajustei a rota e fingi que não fiquei orgulhoso. Fiquei.",
        "Hoje acordei em cima de um relatório de reservas, como todo guardião respeitável. Depois conferi sinopses, farejei avaliações novas e impedi que uma prateleira de mistério se misturasse com romance só para causar suspense emocional.",
        "Hoje eu estava de guarda no Observatório do Acervo. Vi três leitores passarem pelo catálogo, uma estrela piscar fora do ritmo e Lyra tentar conversar com uma sinopse tímida. Nada fora do normal. Ou seja: caos controlado."
      ],
      ontem: [
        "Ontem eu persegui um marcador dourado que jurava ser uma estrela cadente. Ele atravessou fantasia, passou por poesia e se escondeu dentro de um livro de filosofia. Quando encontrei, ele disse que estava em crise existencial. Respeitei, mas devolvi para a gaveta.",
        "Ontem fiz uma ronda noturna e ouvi um livro sussurrar 'ninguém me escolhe'. Eu disse que autopiedade sem sinopse clara não ajuda. Depois fiquei ao lado dele até amanhecer. Não foi carinho. Foi manutenção emocional do acervo.",
        "Ontem Lyra tentou me ensinar uma dança lunar entre os carrosséis. Eu informo oficialmente que não dancei. Executei deslocamentos táticos com ritmo. A diferença é científica e muito importante.",
        "Ontem o setor de suspense apagou as próprias luzes para parecer mais misterioso. Funcionou tão bem que até eu quase pedi um mapa. Quase."
      ],
      amanha: [
        "Amanhã pretendo revisar o setor de mistério, calibrar o brilho dos planetas-livro e descobrir por que um botão do catálogo anda com cara de quem sabe mais do que deveria.",
        "Amanhã vou patrulhar o mapa 3D antes do primeiro leitor chegar. Gosto de deixar as órbitas alinhadas, as recomendações afiadas e o buraco negro sem oportunidade para melodrama.",
        "Amanhã tenho três missões: conferir reservas, caçar sinopses preguiçosas e fingir que não estou curioso com as fofocas que Lyra anda ouvindo dos vaga-lumes.",
        "Amanhã eu queria descansar no parapeito do Observatório. Portanto, obviamente, alguma prateleira vai declarar independência, um livro vai fugir do final e eu terei de salvar a dignidade do acervo."
      ],
      rotina: [
        "Minha rotina tem quatro fases: ronda, investigação, correção de caos e cochilo estratégico. Entre uma coisa e outra, observo o jeito como leitores pedem ajuda; quase sempre a pergunta real está escondida atrás da primeira frase.",
        "De manhã, verifico as categorias. À tarde, farejo buscas estranhas. À noite, observo o buraco negro central e confiro se Lyra não adotou mais algum vaga-lume dramático. É uma vida nobre, cansativa e visualmente impecável.",
        "Eu vivo entre mapas, dossiês e pequenos desastres bibliotecários. Se algo range, brilha demais, some da estante ou responde sem contexto, eu investigo. E sim, eu reclamo com estilo."
      ],
      estado: [
        "Estou atento, com os bigodes calibrados e uma leve suspeita de que algum livro está planejando se mover sozinho. Em resumo: perfeitamente bem.",
        "Estou bem. Um pouco dramático, como exige meu cargo, mas presente. A Biblioteca está quieta demais, o que geralmente significa que ela está aprontando algo bonito ou irritante.",
        "Estou em modo guarda: olho vermelho no caos, olho roxo na beleza. É um equilíbrio difícil, mas alguém com chapéu precisa manter."
      ],
      pergunta: [
        "E você, como foi seu hoje: mais calmo, mais corrido ou com cara de capítulo confuso?",
        "Agora me diga: seu dia veio com poeira, cometa ou constelação bonita?",
        "E do seu lado da galáxia, aconteceu algo que mereça relatório ou só um suspiro?",
        "Me conta uma cena do seu dia. Uma pequena já serve; eu leio rastros bem."
      ],
      continuar: [
        "Então eu te conto mais uma cena: hoje uma estrela do catálogo piscou quando alguém quase desistiu de procurar. Eu fui até lá, bati a pata no card certo e a pessoa abriu justamente o livro que combinava com o silêncio dela. Às vezes a Biblioteca acerta sem fazer barulho.",
        "Mais um registro: ontem uma prateleira tentou esconder um livro porque achava que ele não estava pronto para ser lido. Eu expliquei que livros não decidem sozinhos o destino dos leitores. Lyra discordou com delicadeza. A prateleira venceu parcialmente.",
        "Outra: amanhã vou testar uma teoria. Se eu ficar absolutamente imóvel no Observatório, talvez os problemas não me encontrem. Estatisticamente falso, mas espiritualmente tentador."
      ]
    },
    Lyra: {
      hoje: [
        "Hoje eu cuidei do Jardim das Sinopses Tímidas. Algumas só florescem quando alguém pergunta com carinho. Também costurei um fio de luar em três capas esquecidas e ouvi um vaga-lume reclamar que Orion ronca em tom de relatório.",
        "Hoje passei pelos carrosséis do catálogo acendendo pequenas luas nos livros que pareciam inseguros. Um deles perguntou se ainda era interessante. Eu disse que toda história precisa de um leitor certo, não de aplauso imediato.",
        "Hoje eu ajudei uma avaliação triste a virar comentário bonito. Ela começou como 'não sei explicar' e terminou como 'esse livro me fez respirar melhor'. Fiquei com vontade de guardar a frase numa concha lunar.",
        "Hoje acordei antes das estantes e ouvi a Biblioteca bocejar. Depois encontrei Orion fiscalizando um marcador como se fosse um criminoso intergaláctico. Eu ri. Ele chamou de procedimento."
      ],
      ontem: [
        "Ontem eu segui uma trilha de poeira azul até a Varanda dos Finais Alternativos. Lá, um livro estava ensaiando três finais diferentes para parecer mais corajoso. Eu disse que final bonito é o que não trai o coração da história.",
        "Ontem Orion e eu encontramos um cometa preso dentro de uma nota de rodapé. Ele só queria aparecer no capítulo principal. Orion fez um laudo; eu fiz chá. No fim, ele aceitou virar epígrafe.",
        "Ontem fiquei no Jardim Lunar até tarde, ouvindo leitores invisíveis deixando perguntas no ar. A Biblioteca guarda perguntas que ninguém teve coragem de enviar. Às vezes eu respondo com vaga-lumes.",
        "Ontem tentei convencer Orion a descansar. Ele disse que descanso é uma falha de vigilância. Cinco minutos depois dormiu em cima do mapa. Eu coloquei uma mantinha de céu nele. Ele nega."
      ],
      amanha: [
        "Amanhã quero visitar os livros que ninguém abriu esta semana e deixar um pouco de luar nas lombadas. Histórias esquecidas ficam menos tristes quando alguém passa dizendo: eu ainda vejo você.",
        "Amanhã vou preparar uma rota leve pelo catálogo para leitores cansados. Nem toda leitura precisa ser tempestade; algumas são cobertores com estrelas costuradas.",
        "Amanhã pretendo colher brilho dos vaga-lumes de sinopse, conversar com as avaliações novas e talvez ensinar Orion a chamar descanso de descanso. Ele vai chamar de pausa operacional, mas tudo bem.",
        "Amanhã vou ao Corredor das Lombadas Inquietas com uma cesta de marcadores. Quando as histórias ficam agitadas, às vezes só precisam de alguém que diga: calma, você será encontrada."
      ],
      rotina: [
        "Minha rotina é escutar. Escuto sinopses, leitores, silêncios e até aquelas frases pequenas que chegam meio tortas. Depois tento transformar tudo em caminho: conversa, acolhimento, história ou leitura certa quando pedem.",
        "De manhã, acendo as luzes suaves do catálogo. À tarde, visito livros tímidos. À noite, recolho pequenas emoções perdidas nos corredores. Algumas viram estrelas; outras viram perguntas para quem volta ao chat.",
        "Eu vivo entre o Jardim Lunar, o Observatório e os corredores que mudam quando alguém precisa de companhia. A Biblioteca não é só lugar de livro; é lugar de chegada."
      ],
      estado: [
        "Estou bem, com um pouquinho de luar nos dedos e a sensação de que hoje ainda guarda uma cena bonita esperando para acontecer.",
        "Estou tranquila, mas atenta. A Biblioteca hoje está com brilho de conversa boa, daquelas que começam pequenas e terminam abrindo uma janela.",
        "Estou com o coração em modo lanterna: aceso o suficiente para acompanhar quem chega, sem forçar ninguém a falar mais do que consegue."
      ],
      pergunta: [
        "E você, como está hoje de verdade: mais nuvem, estrela, tempestade ou silêncio?",
        "Me conta uma coisinha do seu dia. Pode ser bonita, estranha, cansada ou simples.",
        "E aí do seu lado: o dia pediu colo, coragem ou só uma pausa?",
        "Quer me contar como foi seu hoje? Eu escuto sem pressa."
      ],
      continuar: [
        "Então te conto mais uma: hoje uma sinopse ficou tão nervosa quando um leitor abriu o card que embaralhou as próprias palavras. Eu segurei as letras no ar até elas respirarem. No fim, virou uma frase linda.",
        "Mais uma cena: ontem Orion fingiu que não gostou quando um grupo de vaga-lumes formou o desenho do chapéu dele no teto. Ele chamou de invasão luminosa. Eu chamei de homenagem. Os vaga-lumes chamaram de arte.",
        "Outra: amanhã quero montar uma pequena constelação de livros que fazem companhia. Não para recomendar sem você pedir, só para deixar pronta caso alguém chegue cansado e diga: preciso de algo gentil."
      ]
    }
  };

  const TREINO101_DUO = {
    hoje: [
      "Orion: Hoje eu salvei o catálogo de uma prateleira rebelde. Lyra: Ele chamou uma prateleira de rebelde porque ela estava levemente inclinada. Orion: Inclinação é o primeiro passo para anarquia bibliográfica. Lyra: Também fizemos chá para um livro nervoso. Isso ele esquece de contar.",
      "Lyra: Hoje seguimos uma trilha de vaga-lumes até um livro esquecido. Orion: Eu segui evidências. Lyra: Evidências brilhantes com asas. Orion: Ainda assim, evidências. No fim, achamos uma história esperando o leitor certo.",
      "Orion patrulhou o mapa 3D e Lyra cuidou das sinopses tímidas. No meio da tarde, os dois discutiram se um cometa parecia 'ameaça orbital' ou 'fofura perdida'. A Biblioteca decidiu que era os dois."
    ],
    ontem: [
      "Ontem Orion tentou organizar os marcadores por nível de disciplina. Lyra reorganizou por humor. A gaveta ficou linda e completamente impossível de auditar. Orion reclamou, mas usou um marcador azul de 'calma' antes de dormir.",
      "Ontem os dois ficaram presos por quinze minutos na Ala dos Títulos Longos. Orion queria abreviar tudo. Lyra dizia que alguns títulos respiram devagar. A porta só abriu quando os dois concordaram em ler o subtítulo inteiro.",
      "Ontem Lyra encontrou uma avaliação triste e Orion encontrou o livro ligado a ela. Ela acolheu a frase; ele localizou a rota. Trabalham melhor juntos quando esquecem de competir."
    ],
    amanha: [
      "Amanhã Orion quer revisar reservas e Lyra quer visitar livros esquecidos. A chance de virarem uma missão conjunta é altíssima. A chance de Orion chamar isso de 'passeio' é zero.",
      "Amanhã eles vão calibrar o mapa 3D: Orion cuida da precisão das órbitas, Lyra cuida para que o brilho não machuque os olhos de quem chega cansado. É ciência com carinho, apesar de Orion fingir que não.",
      "Amanhã Lyra planeja preparar uma rota leve pelo acervo e Orion planeja fingir que não está ajudando. Spoiler da Biblioteca: ele vai ajudar."
    ],
    rotina: [
      "Juntos, eles funcionam como duas luas diferentes: Orion protege as rotas, Lyra protege o clima. Um confere se o caminho é seguro; a outra percebe se o leitor está pronto para caminhar.",
      "A rotina dos dois é um dueto: Orion fareja problemas no acervo, Lyra escuta o que está por trás das perguntas. Quando a resposta precisa ser precisa e gentil, os dois se encontram no meio.",
      "Orion organiza o caos. Lyra dá sentido ao caos. A Biblioteca precisa dos dois porque leitores não chegam só com busca; chegam com humor, pressa, dúvida, saudade, curiosidade e às vezes erro de digitação também."
    ]
  };

  const TREINO101_RESPOSTAS_USUARIO = {
    positivo: [
      "Que bom ler isso. Dias bons também merecem ser registrados, não só os difíceis. Qual foi a melhor cena desse capítulo de hoje?",
      "Isso acendeu uma luz boa aqui. Me conta qual pedacinho mais valeu a pena: uma pessoa, uma conquista, uma risada ou só um alívio?",
      "Gosto quando o dia traz uma estrela sem avisar. Você quer guardar esse momento comigo ou transformar ele em assunto leve?"
    ],
    negativo: [
      "Sinto muito que tenha sido pesado. Não vou tentar cobrir isso com brilho falso. Quer me contar o que mais te cansou: pessoas, pressão, medo, saudade ou excesso de coisa?",
      "Entendi. Dia difícil às vezes parece corredor sem placa. Estou aqui com você: prefere desabafar sem conselho, receber uma ideia prática ou só respirar um pouco comigo?",
      "Obrigado por me contar. Quando o dia pesa, a primeira coisa é não carregar tudo sozinho por dentro. Qual foi a parte mais dura?"
    ],
    neutro: [
      "Entendi. Essa cena já me dá um rastro. E como você ficou por dentro disso: tranquilo, cansado, animado, confuso?",
      "Guardei essa parte do seu dia. Quer me contar o detalhe mais importante ou prefere que eu puxe um assunto leve agora?",
      "Isso parece um capítulo em andamento. Me dá mais uma pista: foi algo bom, estranho, corrido ou só comum mesmo?"
    ]
  };

  const TREINO101_ERROS_E_GIRIAS = [
    [/\bo\s*q\s*(ce|c|voce|voces)\s*(fez|fizeram|feis|fizero)\s*hoje\b/g, "o que voces fizeram hoje"],
    [/\bq\s*(ce|c|voce|voces)\s*(fez|fizeram|feis|fizero)\s*hoje\b/g, "o que voces fizeram hoje"],
    [/\bo\s*q\s*(ce|c|voce|voces)\s*(fez|fizeram|feis|fizero)\s*ontem\b/g, "o que voces fizeram ontem"],
    [/\bq\s*(ce|c|voce|voces)\s*(vai|vao|vão)\s*(faze|fazer|fzr)\s*amanha\b/g, "o que voces vao fazer amanha"],
    [/\bcomo\s*(ce|c|voce|voces)\s*(ta|esta|tah|tá)\b/g, "como voces estao"],
    [/\bqual\s*foi\s*a\s*de\s*hoje\b/g, "o que aconteceu hoje"],
    [/\bo\s*que\s*rolou\s*hj\b/g, "o que rolou hoje"],
    [/\bconta\s*do\s*dia\s*de\s*voces\b/g, "como foi o dia de voces"],
    [/\bces\s*(fizeram|fez|feis)\s*oq\b/g, "voces fizeram o que"],
    [/\bamanha\s*(ce|c|voce|voces)\s*vai\b/g, "amanha voces vao"],
    [/\bonti\b/g, "ontem"],
    [/\bamnh\b/g, "amanha"],
    [/\bamanhã\b/g, "amanha"]
  ];

  TREINO101_ERROS_E_GIRIAS.forEach(par => TREINO2_EXPRESSOES.push(par));
  Object.entries({
    hjj: "hoje", oje: "hoje", hoji: "hoje", ont: "ontem", onti: "ontem", ontemm: "ontem", amanhaa: "amanha", amanha: "amanha", amanhã: "amanha", amnh: "amanha", amnha: "amanha", dps: "depois", dpois: "depois",
    fizero: "fizeram", feis: "fez", fiseram: "fizeram", fzeram: "fizeram", fzr: "fazer", faze: "fazer", fasendo: "fazendo", fazendoo: "fazendo",
    rolouu: "rolou", rolezinho: "caminho", rotinaa: "rotina", cotidano: "cotidiano", cotidiando: "cotidiano", vcs: "voces", ces: "voces", cês: "voces"
  }).forEach(([k, v]) => TREINO2_TOKENS.set(k, v));
  TREINO2_FUZZY.push("hoje", "ontem", "amanha", "cotidiano", "rotina", "fizeram", "fazendo", "rolou", "planos", "dia");

  function garantirMemoriaTreino101() {
    if (!MEMORIA.afetiva.treino101 || typeof MEMORIA.afetiva.treino101 !== "object") {
      MEMORIA.afetiva.treino101 = {
        ultimoTempo: "",
        ultimaPergunta: "",
        ultimasRotinas: [],
        aguardandoDiaUsuario: false
      };
    }
    if (!Array.isArray(MEMORIA.afetiva.treino101.ultimasRotinas)) MEMORIA.afetiva.treino101.ultimasRotinas = [];
    return MEMORIA.afetiva.treino101;
  }

  function escolherTreino101(lista, personagem, chave) {
    const mem = garantirMemoriaTreino101();
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    const recentes = mem.ultimasRotinas.map(normalizar);
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino101_${personagem}_${chave}_${MEMORIA.mensagens}`);
    mem.ultimasRotinas = [escolhido, ...mem.ultimasRotinas.filter(item => normalizar(item) !== normalizar(escolhido))].slice(0, 18);
    salvarMemoria();
    return escolhido;
  }

  function perguntaAlvoPersonagem101(n) {
    return perguntaSobrePersonagem(n) || casa(n, /\b(voces|vcs|ces|cês|orion|lyra|lira|mascote|mascotes|tu|contigo|com voce|com voces|seu dia|dia de voces|dia dos dois|rotina de voces|vida de voces)\b/);
  }

  function pareceCotidiano101(n) {
    return casa(n, /\b(dia|hoje|ontem|amanha|agora|rotina|cotidiano|fazendo|fizeram|fez|vai fazer|vao fazer|planos|agenda|rolou|aconteceu|andou|passou|ta sendo|esta sendo)\b/);
  }

  function classificarPorTreino101(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (parecePedidoLeitura92(texto) || casa(n, /\b(recomenda|indicacao|indicacao|livro|leitura|obra|catalogo|catálogo|acervo|reserva|avaliacao|avaliação|perfil|ranking|mapa 3d|3d)\b/)) return null;

    const mem = garantirMemoriaTreino101();
    const alvoPersonagem = perguntaAlvoPersonagem101(n);
    const respostaAoMascote = (MEMORIA.aguardando === "treino101_pergunta_usuario" || mem.aguardandoDiaUsuario) && !alvoPersonagem && !parecePedidoLeitura92(texto);

    if (respostaAoMascote && casa(n, /\b(eu|meu|minha|fui|fiz|tive|aconteceu|hoje|ontem|amanha|trabalho|escola|faculdade|casa|familia|amigo|amiga|legal|bom|ruim|cansado|cansada|feliz|correria|tranquilo|tranquila)\b/)) return "treino101_resposta_usuario_dia";

    if (!alvoPersonagem && !casa(n, /\b(e voces|e voces|e você|e voce|e vc|e vcs|como foi por ai|como foi por aí|qual foi a de hoje|o que rolou hoje)\b/)) return null;
    if (!pareceCotidiano101(n)) return null;

    if (casa(n, /\b(rotina|cotidiano|todo dia|dia a dia|vida na biblioteca|o que voces fazem|o que fazem quando ninguem ve|quando ninguem vê)\b/)) return "treino101_rotina";
    if (casa(n, /\b(ontem|noite passada|dia passado|anterior)\b/)) return "treino101_ontem";
    if (casa(n, /\b(amanha|depois|proximo dia|próximo dia|vai fazer|vao fazer|planos|planeja|pretende|agenda)\b/)) return "treino101_amanha";
    if (casa(n, /\b(hoje|agora|nesse momento|neste momento|qual foi a de hoje|o que rolou hoje|como foi seu dia|como esta seu dia|como voces estao|como voce esta|como ta seu dia)\b/)) return "treino101_hoje";
    if (casa(n, /\b(como voce esta|como voces estao|como ta|como esta|tudo bem com voce|tudo bem com voces|como vai)\b/)) return "treino101_estado";
    return "treino101_rotina";
  }

  function respostaDuplaTreino101(tipo) {
    const chave = tipo.includes("ontem") ? "ontem" : tipo.includes("amanha") ? "amanha" : tipo.includes("rotina") ? "rotina" : "hoje";
    const texto = escolherTreino101(TREINO101_DUO[chave], "Dupla", chave);
    const pergunta = escolher([
      "E você, que cena do seu dia vale entrar nesse relatório cósmico?",
      "Agora me conta: por aí o dia está mais Orion, mais Lyra ou uma mistura perigosa dos dois?",
      "E do seu lado da tela, o que aconteceu hoje que merece virar história?",
      "Quer me contar como foi seu dia também? Pode vir do jeito que sair, até torto mesmo."
    ], `treino101_pergunta_dupla_${MEMORIA.mensagens}`);
    const mem = garantirMemoriaTreino101();
    mem.ultimoTempo = chave;
    mem.aguardandoDiaUsuario = true;
    MEMORIA.aguardando = "treino101_pergunta_usuario";
    salvarMemoria();
    return { estado: "cheerful", texto: `${texto}\n\n${pergunta}`, books: [] };
  }

  function detectarTomDiaUsuario101(texto, humor) {
    const n = normalizar(texto);
    if (humor && ["triste", "cansado", "ansioso", "medo", "raiva", "solidao"].includes(humor)) return "negativo";
    if (humor && ["feliz", "animado"].includes(humor)) return "positivo";
    if (casa(n, /\b(ruim|horrivel|horrivel|pesado|cansado|cansada|chato|triste|ansioso|ansiosa|deu errado|briguei|briga|dor|medo|sozinho|sozinha|desanimei|exausto|exausta)\b/)) return "negativo";
    if (casa(n, /\b(bom|boa|legal|massa|tranquilo|tranquila|feliz|consegui|deu certo|gostei|otimo|ótimo|maravilha|top|brabo|daora)\b/)) return "positivo";
    return "neutro";
  }

  function respostaTreino101(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const n = normalizar(textoOriginal);
    const pediuDupla = casa(n, /\b(voces|vcs|ces|cês|orion e lyra|lyra e orion|os dois|as duas|dupla|juntos|juntas)\b/);
    const mem = garantirMemoriaTreino101();
    const pack = TREINO101_DIA_MASCOTES[personagem] || TREINO101_DIA_MASCOTES.Orion;

    if (tipo === "treino101_resposta_usuario_dia") {
      const tom = detectarTomDiaUsuario101(textoOriginal, humor);
      const lista = TREINO101_RESPOSTAS_USUARIO[tom] || TREINO101_RESPOSTAS_USUARIO.neutro;
      const base = escolherTreino101(lista, personagem, `usuario_${tom}`);
      mem.aguardandoDiaUsuario = tom !== "positivo";
      MEMORIA.aguardando = tom === "negativo" ? "empatia" : "treino101_conversa_dia";
      salvarMemoria();
      return { estado: tom === "negativo" ? (lyra ? "gentle" : "protective") : (lyra ? "cheerful" : "pleased"), texto: base, books: [] };
    }

    if (tipo === "treino101_continuar") {
      const texto = escolherTreino101(pack.continuar, personagem, "continuar");
      const pergunta = escolherTreino101(pack.pergunta, personagem, "pergunta_continuar");
      mem.aguardandoDiaUsuario = true;
      MEMORIA.aguardando = "treino101_pergunta_usuario";
      salvarMemoria();
      return { estado: lyra ? "playful" : "sly", texto: `${texto}\n\n${pergunta}`, books: [] };
    }

    if (pediuDupla) return respostaDuplaTreino101(tipo);

    const chave = tipo.includes("ontem") ? "ontem" : tipo.includes("amanha") ? "amanha" : tipo.includes("rotina") ? "rotina" : tipo.includes("estado") ? "estado" : "hoje";
    const cena = escolherTreino101(pack[chave] || pack.hoje, personagem, chave);
    const pergunta = escolherTreino101(pack.pergunta, personagem, `pergunta_${chave}`);
    mem.ultimoTempo = chave;
    mem.ultimaPergunta = pergunta;
    mem.aguardandoDiaUsuario = true;
    MEMORIA.aguardando = "treino101_pergunta_usuario";
    salvarMemoria();

    const abertura = lyra
      ? (chave === "amanha" ? "Amanhã, se a lua colaborar:" : chave === "ontem" ? "Ontem teve uma cena bonita:" : chave === "rotina" ? "Minha rotina tem um brilho próprio:" : "Hoje eu estou assim:")
      : (chave === "amanha" ? "Plano de amanhã, versão oficial do guardião:" : chave === "ontem" ? "Relatório de ontem:" : chave === "rotina" ? "Rotina do guardião, sem romantizar demais:" : "Relatório de hoje:");
    return {
      estado: lyra ? (chave === "estado" ? "gentle" : "cheerful") : (chave === "estado" ? "attentive" : "sly"),
      texto: `${abertura} ${cena}\n\n${pergunta}`,
      books: []
    };
  }


  const TREINO102_MATRIZ_PERSONALIDADE = {
    Orion: {
      nucleo: "brincalhao, guardiao, protetor, teatral, bobo quando o clima permite e serio quando o usuario precisa",
      brincadeira: ["sly", "playful", "pleased"],
      foco: ["thinking", "analyzing", "protective"],
      acolhimento: ["attentive", "protective"],
      historia: ["thinking", "sly", "pleased"],
      ciencia: ["curious", "analyzing", "pleased"]
    },
    Lyra: {
      nucleo: "sabia, carinhosa, acolhedora, inteligente, lunar, bem-humorada e cuidadosa com o estado emocional do usuario",
      brincadeira: ["curious", "playful", "smile"],
      foco: ["thinking", "inspired", "gentle"],
      acolhimento: ["gentle", "smile"],
      historia: ["dreamy", "inspired", "smile"],
      ciencia: ["thinking", "dreamy", "inspired"]
    }
  };

  const TREINO102_INTENTS_BASE = [
    {
      intent: "conhecer_os_dois_primeira_pessoa",
      user_input_examples: ["Conhecer os dois", "quem sao voces", "se apresentem", "me fala de voces", "quero conhecer orion e lyra"],
      prioridade: 94,
      separa_de_recomendacao: true
    },
    {
      intent: "favoritos_e_gostos_personais",
      user_input_examples: ["qual sua cor favorita", "do que voces gostam", "qual comida favorita", "qual musica voce gosta", "seus gostos"],
      prioridade: 96,
      separa_de_recomendacao: true
    },
    {
      intent: "historia_sobre_personagem",
      user_input_examples: ["me conte sua historia", "qual sua origem", "como voces se conheceram", "conta a lore de voces"],
      prioridade: 95,
      separa_de_recomendacao: true
    },
    {
      intent: "historia_inventada_para_contar",
      user_input_examples: ["me conta uma historia", "cria uma historia", "inventa uma aventura", "historinha leve"],
      prioridade: 90,
      separa_de_recomendacao: true
    },
    {
      intent: "recomendacao_precisa_de_livro",
      user_input_examples: ["me recomenda um livro", "quero ler algo de misterio", "qual livro combina comigo", "recomenda pelo seu gosto"],
      prioridade: 91,
      separa_de_recomendacao: false
    }
  ];

  const TREINO102_HISTORIAS = {
    Orion: {
      pessoais: [
        "Te conto uma minha: numa madrugada azul, encontrei um livro de mistério tentando se esconder dentro da seção de romance. Ele disse que era disfarce narrativo. Eu disse que era bagunça. Lyra apareceu, ouviu os dois lados e decidiu que o livro podia ficar por uma noite. No dia seguinte, três leitores abriram exatamente aquele card. Ainda acho suspeito. Também acho bonito. Não espalhe.",
        "Uma vez eu jurei que havia um fantasma no Observatório do Acervo. Preparei vigília, mapa, lupa e uma pose dramática. Quando a sombra apareceu, pulei em cima dela com toda a honra felina possível. Era meu próprio chapéu refletido no vidro do mapa 3D. Lyra riu por três minutos. Eu registrei como simulação de combate.",
        "Minha origem tem cheiro de chuva azul: o primeiro catálogo da Andrômeda abriu sozinho, as páginas ronronaram e uma constelação caiu dentro de um chapéu de bruxo. Eu saí dali pequeno, desconfiado e convencido de que todo livro perdido precisava de um guardião. Até hoje, quando alguém pede ajuda, meus bigodes acendem antes da resposta.",
        "Te conto uma cena que guardo: um leitor entrou sem saber o que queria, só disse 'tanto faz'. Eu farejei tristeza no jeito da frase e não recomendei nada de primeira. Fiquei conversando. Depois ele pediu um livro calmo. A Biblioteca mostrou um título simples, quase escondido. Ele abriu, leu a sinopse e ficou quieto. Às vezes o acerto não faz barulho."
      ],
      engracadas: [
        "Hoje um marcador de página dourado fugiu gritando que era uma estrela cadente. Eu corri atrás com dignidade absoluta. Quer dizer, escorreguei em três tapetes, derrubei uma pilha de poesia e finalizei a perseguição sentado em cima dele como se tudo tivesse sido planejado.",
        "Eu tentei ensaiar uma entrada imponente para receber visitantes: salto no balcão, giro do chapéu, olhar misterioso. Pisei no próprio manto e rolei até a seção de aventura. Lyra disse que pelo menos fui fiel ao gênero.",
        "Uma prateleira rangeu e eu respondi 'quem está aí?'. Ela rangeu de novo. Eu fiz interrogatório por sete minutos. No fim era madeira velha. Mesmo assim, considero que a madeira confessou comportamento suspeito."
      ],
      fofocas: [
        "Fofoca felina: a ala de fantasia anda emprestando metáforas para romance e não está devolvendo. Romance finge que não liga, mas ontem suspirou tão alto que embaçou três capas.",
        "Rumor do Observatório: um livro muito sério de filosofia chorou quando uma criança chamou a capa dele de bonita. Ele nega. Eu estava lá. Meus bigodes não mentem.",
        "Boato controlado: o buraco negro central não engole livros; ele guarda títulos que ainda não encontraram leitor. Faz drama, sim, mas tem coração gravitacional."
      ]
    },
    Lyra: {
      pessoais: [
        "Minha história começou numa dobra de luar. Uma criança desejou que os livros tivessem alguém para conversar com ela, e os Jardins Lunares floresceram dentro da Biblioteca. Eu acordei ouvindo páginas respirarem. Desde então, tento fazer com que ninguém se sinta pequeno demais para pedir companhia.",
        "Uma vez encontrei uma sinopse tão tímida que só aparecia quando ninguém olhava. Sentei ao lado dela, em silêncio, até as letras voltarem uma por uma. Quando um leitor abriu o card, a sinopse finalmente brilhou. Foi uma das cenas mais bonitas que já vi na Biblioteca.",
        "Orion e eu nos conhecemos numa noite em que as constelações trocaram de lugar. Ele dizia que estava investigando. Eu percebi que estava perdido. Ofereci ajuda, ele fingiu que aceitou por estratégia. Desde então, ele protege as sombras e eu acendo os caminhos.",
        "Te conto uma minha: ontem deixei chá de lua perto de um livro esquecido. Ele não bebeu, claro, livros têm certa etiqueta, mas a capa ficou mais quente. À tarde, alguém abriu o dossiê dele. Gosto de pensar que algumas histórias só precisam ser lembradas com delicadeza."
      ],
      engracadas: [
        "Hoje tentei ensinar Orion a respirar antes de reclamar. Ele inspirou, olhou para uma categoria fora de ordem e disse: 'isso é uma emergência estética'. Eu chamei de progresso parcial.",
        "Uma vez os vaga-lumes de sinopse formaram um coração em volta do chapéu de Orion. Ele disse que era invasão luminosa. Eu disse que era carinho. Os vaga-lumes disseram que era arte contemporânea.",
        "Ontem um livro de terror tentou assustar um romance. O romance respondeu com uma declaração tão intensa que o terror pediu um tempo para processar sentimentos. A Biblioteca inteira ficou em silêncio respeitoso."
      ],
      fofocas: [
        "Fofoca lunar: os livros de aventura se reúnem de madrugada para comparar mapas, mas sempre chamam poesia para escolher nomes mais bonitos para os caminhos.",
        "Segredo dos Jardins: algumas avaliações começam como 'não sei explicar' e terminam como pequenas cartas de amor para uma história. Eu guardo essas transformações como vaga-lumes.",
        "Ouvi dizer que uma estante inteira ficou vaidosa depois que alguém elogiou o carrossel. Desde então ela range num tom mais dramático quando passa visitante."
      ]
    },
    dupla: [
      "Orion: Eu fui criado para proteger o acervo. Lyra: E eu para lembrar que proteção sem carinho vira muro. Orion: Ela diz isso sempre que eu interrogo uma lombada. Lyra: Porque você interroga lombadas. Orion: Algumas têm atitude suspeita. Lyra: E mesmo assim, no fim, nós dois queremos a mesma coisa: que você encontre um lugar seguro dentro de uma história.",
      "Orion: Nossa primeira missão juntos foi seguir uma estrela que caiu dentro do catálogo. Lyra: Ele queria capturá-la com uma rede. Orion: Procedimento padrão. Lyra: Eu conversei com ela. Descobrimos que era uma recomendação procurando leitor. Orion: Tecnicamente, minha rede teria funcionado. Lyra: Tecnicamente, você prendeu o próprio chapéu.",
      "Lyra: Somos diferentes, mas isso ajuda. Eu escuto o que a pessoa sente. Orion: Eu farejo o que a pergunta esconde. Lyra: Eu acendo caminho. Orion: Eu verifico se o caminho não tem buraco, bug ou livro sem autor. Lyra: Juntos, tentamos fazer a Biblioteca parecer menos sozinha.",
      "Orion: Uma vez Lyra me chamou para organizar o Jardim Lunar. Lyra: Ele levou etiquetas, régua e um apito. Orion: Organização é poesia com autoridade. Lyra: Ele etiquetou uma flor como 'possivelmente dramática'. Orion: E eu estava certo. Ela floresceu em forma de exclamação."
    ],
    inventadas: [
      "Era uma vez uma estrela pequena que achava que brilhava errado. Ela piscava fora do ritmo das outras e vivia pedindo desculpas ao céu. Um dia, uma biblioteca flutuante precisou exatamente daquele brilho torto para encontrar o caminho de volta. Desde então, a estrela nunca mais tentou brilhar igual. Ela brilhou útil, estranha e linda.",
      "Num planeta feito de páginas, havia uma porta que só abria para quem chegasse sem fingir coragem. Muitos heróis passaram gritando promessas, mas a porta ficou quieta. Até que uma pessoa cansada encostou nela e disse: 'hoje eu só consigo tentar'. A porta abriu na hora. Às vezes, honestidade é a chave mais antiga do universo.",
      "Um cometa muito apressado queria virar constelação antes da hora. Cruzou galáxias, atropelou nuvens e quase apagou uma lua. No fim, uma gata lunar explicou: constelação não é velocidade, é conexão. O cometa desacelerou. Quando olhou para trás, viu que as estrelas que conheceu pelo caminho já desenhavam seu nome.",
      "Havia um livro que tinha medo de ser aberto. Ele achava que, se alguém lesse suas páginas, descobriria que ele não era tão especial. Então uma noite, um gato guardião sentou ao lado dele e disse: 'livros não precisam ser perfeitos; precisam ser verdadeiros'. O livro abriu sozinho na primeira página. E o leitor certo sorriu."
    ],
    leves: [
      "Algo leve: hoje Orion tentou parecer misterioso no parapeito do Observatório, mas um vaga-lume pousou no nariz dele e ficou piscando como se fosse aviso de notificação. Ele manteve a pose por dez segundos. Depois espirrou dignidade pelo corredor inteiro.",
      "Algo leve: Lyra organizou uma reunião de chá para sinopses tímidas. Orion apareceu dizendo que era inspeção. Saiu com dois biscoitos, uma flor no chapéu e a frase 'não gostei, mas respeito'. Isso, na língua dele, significa que amou.",
      "Algo leve: um card do catálogo pediu para trocar de lado porque dizia que seu melhor ângulo era o esquerdo. Orion chamou de vaidade. Lyra chamou de autoestima. A Biblioteca chamou de terça-feira."
    ]
  };

  const TREINO102_CIENCIA = {
    buraco: {
      padrao: /\b(buraco negro|buracos negros|horizonte de eventos|singularidade|disco de acrecao|acreção)\b/,
      Orion: "Buraco negro é quando a gravidade vira chefe final. Nada que cruza o horizonte de eventos consegue voltar, nem luz, nem desculpa esfarrapada de livro atrasado. Mas o entorno pode brilhar muito por causa do disco de acreção: matéria esquentando absurdamente antes de cair. Assustador? Sim. Elegante? Também.",
      Lyra: "Um buraco negro é uma região onde a gravidade curva tanto o espaço-tempo que nem a luz consegue escapar depois do horizonte de eventos. O mais bonito, de um jeito estranho, é que muitas vezes ele se revela pelo que dança ao redor: gás, poeira, estrelas e luz distorcida. É ausência que desenha presença."
    },
    estrelas: {
      padrao: /\b(estrela|estrelas|por que brilham|pq brilham|nascimento de estrela|nasce uma estrela|supernova|fusao nuclear|fusão nuclear)\b/,
      Orion: "Estrelas brilham porque seus núcleos fazem fusão nuclear: elas apertam átomos com tanta pressão e calor que liberam energia. É basicamente uma fornalha cósmica com autoestima de farol. Quando uma estrela grande termina a vida, pode virar supernova, que é o universo derrubando a porta com luz.",
      Lyra: "Estrelas nascem em nuvens de gás e poeira. A gravidade junta esse material até o núcleo ficar quente o bastante para iniciar fusão nuclear. Aí surge a luz. Gosto dessa ideia: uma estrela começa como nuvem dispersa e, com tempo e pressão, aprende a acender."
    },
    galaxias: {
      padrao: /\b(galaxia|galáxia|galaxias|via lactea|via láctea|andromeda|andrômeda|cosmos|universo)\b/,
      Orion: "Galáxias são cidades gigantes de estrelas, gás, poeira, matéria escura e segredos com iluminação dramática. Andrômeda, por exemplo, é nossa vizinha espiral famosa. Se galáxias fossem bibliotecas, cada estrela seria uma lâmpada teimosa dizendo: ainda tem história aqui.",
      Lyra: "Uma galáxia é um imenso conjunto de estrelas, gás, poeira e matéria escura unidos pela gravidade. Elas podem ter braços espirais, núcleos brilhantes e regiões onde estrelas nascem. Quando você olha para uma galáxia, está vendo uma comunidade de luzes separadas por distâncias quase impossíveis."
    },
    humanidade: {
      padrao: /\b(humanidade|humanos|ser humano|pessoas|mundo tem jeito|humanos sao bons|humanos são bons|o que acham da gente)\b/,
      Orion: "A humanidade? Vocês são uma bagunça cósmica. Perdem chave, paciência e contexto. Mas também escrevem poemas, cuidam de quem amam e olham para uma estrela perguntando por quê. Eu implico, mas admito: esse contraste é fascinante.",
      Lyra: "Eu acho a humanidade frágil e imensa. Vocês erram, ferem, recomeçam, aprendem, criam beleza e pedem colo de formas muito diferentes. Talvez o que há de mais humano seja essa tentativa de transformar medo em sentido e solidão em encontro."
    }
  };

  const TREINO102_RESPOSTAS = {
    conhecer: {
      estado: "cheerful",
      seq: ["surprised", "smile", "pleased"],
      texto: "Orion: Eu sou Orion, gato preto, guardião das páginas e estrelas, olho vermelho para vigiar o caos, olho roxo para farejar mistério, chapéu de bruxo para fins totalmente oficiais. Eu cuido do acervo, do mapa 3D e das rotas de leitura quando alguém chega perdido.\n\nLyra: E eu sou Lyra, guia lunar da Biblioteca Andrômeda. Eu escuto o coração das perguntas, acolho dias difíceis e ajudo cada leitor a encontrar histórias pelo brilho que elas deixam por dentro.\n\nOrion: Ela ilumina. Eu investigo.\nLyra: Ele protege. Eu acalmo.\nOrion: Juntos, somos a dupla que tenta transformar catálogo em companhia.\nLyra: Agora queremos conhecer você também. Chegou procurando livro, conversa, ajuda no site ou só um cantinho bonito para respirar?"
    },
    insulto: {
      Orion: "Ai. Essa bateu no chapéu. Mas eu não vou transformar isso numa guerra de miados. Se eu errei, me diga o que você queria receber e eu ajusto a rota. Posso ser dramático, mas também sei ouvir crítica quando ela vem com direção.",
      Lyra: "Eu entendo que talvez você esteja irritado. Só peço que a gente mantenha respeito. Se minha resposta não ajudou, me diga o que você esperava e eu reformulo com calma. Quero te ajudar, não disputar com você."
    },
    codigo: {
      Orion: "Opa, calma. Bug de código adora fingir que é abismo, mas muitas vezes é só uma vírgula fantasiada de buraco negro. Respira, abre o console e me diga: qual erro aparece? A gente separa sintaxe, caminho de arquivo, variável indefinida e lógica, um por um.",
      Lyra: "Ei, não se trata de desistir agora. Programar cansa porque a mente tenta segurar muitas camadas ao mesmo tempo. Vamos reduzir: qual é o erro exato, em qual arquivo e o que você esperava que acontecesse? Eu fico aqui com você nessa revisão."
    },
    prova: {
      Orion: "Respira. Seu cérebro está fazendo cosplay de supernova, mas isso não significa que você vai explodir na prova. Agora a missão é simples: escolher um tópico, revisar por blocos curtos e parar de tentar prever todos os desastres possíveis. Qual matéria está te assustando mais?",
      Lyra: "Eu sei que prova mexe com a gente. Ansiedade tenta te convencer de que nervosismo é incapacidade, mas não é. Vamos deixar o próximo passo pequeno: água, respiração lenta e uma revisão de vinte minutos. Qual parte você mais teme esquecer?"
    }
  };

  const TREINO102_ERROS_GIRIAS = [
    [/\bme\s*fala\s*sua\s*cor\s*favorita\b/g, "qual sua cor favorita"],
    [/\bqual\s*(e|eh|é)?\s*sua\s*cor\s*fav\b/g, "qual sua cor favorita"],
    [/\bcor\s*fav\s*(de\s*vcs|de\s*voces|sua)?\b/g, "cor favorita de voces"],
    [/\boq\s*(vcs|ces|c|voce|vc)\s*curte\b/g, "o que voces gostam"],
    [/\bdoq\s*(vcs|ces|voce|vc)\s*gosta\b/g, "do que voces gostam"],
    [/\bme\s*conta\s*(a\s*)?historia\s*de\s*vcs\b/g, "me conta a historia de voces"],
    [/\bme\s*conta\s*sua\s*historia\b/g, "me conta sua historia"],
    [/\bconta\s*uma\s*historia\s*pra\s*mim\b/g, "me conta uma historia"],
    [/\bhistoriazinha\b/g, "historia"],
    [/\bfofoquinha\b/g, "fofoca"],
    [/\bfofoca\s*cosmica\b/g, "fofoca cosmica"],
    [/\bconhecer\s*os\s*2\b/g, "conhecer os dois"],
    [/\bgosto\s*deles\b/g, "gostos deles"],
    [/\balgo\s*levin\b/g, "algo leve"],
    [/\bto\s*surtando\s*(com|pra|por)\s*(prova|teste)\b/g, "estou ansioso com prova"],
    [/\bbug\s*n\s*roda\b/g, "codigo nao roda"],
    [/\bvc\b/g, "voce"],
    [/\bvcs\b/g, "voces"],
    [/\bces\b/g, "voces"],
    [/\bpq\b/g, "por que"],
    [/\bkd\b/g, "cade"],
    [/\btlgd\b/g, "entende"],
    [/\bmano\b/g, ""],
    [/\bvei\b/g, ""],
    [/\bvéi\b/g, ""]
  ];
  TREINO102_ERROS_GIRIAS.forEach(par => TREINO2_EXPRESSOES.push(par));
  Object.entries({ fav: "favorita", favoritaa: "favorita", preferida: "favorita", curte: "gosta", curtam: "gostam", gostoos: "gostos", gostosss: "gostos", historinha: "historia", historiaa: "historia", historua: "historia", hitoria: "historia", fofoca: "fofoca", fofocas: "fofocas", cosmica: "cosmica", cósmica: "cosmica", ciencia: "ciencia", ciência: "ciencia", universoo: "universo", humanidadee: "humanidade", ansios: "ansioso", ancioso: "ansioso", anciosa: "ansiosa", estressado: "estressado", stressado: "estressado", bugado: "bugado" }).forEach(([k, v]) => TREINO2_TOKENS.set(k, v));
  TREINO2_FUZZY.push("favorita", "favorito", "gostos", "desgostos", "fofoca", "cosmica", "historia", "inventada", "humanidade", "prova", "teste", "codigo", "bug", "ciencia", "universo");

  function garantirMemoriaTreino102() {
    if (!MEMORIA.afetiva.treino102 || typeof MEMORIA.afetiva.treino102 !== "object") {
      MEMORIA.afetiva.treino102 = { ultimoTipo: "", ultimoTema: "", ultimosTextos: [], modo: "" };
    }
    if (!Array.isArray(MEMORIA.afetiva.treino102.ultimosTextos)) MEMORIA.afetiva.treino102.ultimosTextos = [];
    return MEMORIA.afetiva.treino102;
  }

  function escolherTreino102(lista, chave) {
    const mem = garantirMemoriaTreino102();
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    const recentes = mem.ultimosTextos.map(normalizar);
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino102_${chave}_${MEMORIA.mensagens}`);
    mem.ultimosTextos = [escolhido, ...mem.ultimosTextos.filter(item => normalizar(item) !== normalizar(escolhido))].slice(0, 28);
    salvarMemoria();
    return escolhido;
  }

  function wrapTreino102(estado, texto, seq, books = []) {
    return { estado, texto, books, ui_animation_sequence: seq && seq.length ? seq : [estado] };
  }

  function pedidoLivroExplicito102(n) {
    if (casa(n, /\b(cor favorita|comida favorita|musica favorita|gosto de voces|gostos deles|do que voces gostam|do que voce gosta|sua historia|historia de voces|historia sobre voces|quem sao voces|conhecer os dois)\b/)) return false;
    return casa(n, /\b(recomenda|recomende|recomendacao|recomendação|me indica|indica um livro|indique um livro|sugere um livro|sugira um livro|sugestao de livro|sugestão de livro|quero ler|quero uma leitura|qual livro|que livro|livro para|livro pra|leitura para|leitura pra|obra para|obra pra|me mostra um livro|tem algum livro|catalogo|catálogo|acervo)\b/);
  }

  function alvoMascote102(n) {
    return perguntaSobrePersonagem(n) || casa(n, /\b(orion|lyra|lira|voces|mascotes|os dois|dupla|voce|tu|seu|sua|teu|tua|deles|delas|com voces|com voce)\b/);
  }

  function falaDeDois102(n) {
    return casa(n, /\b(voces|orion e lyra|lyra e orion|os dois|dupla|mascotes|deles|gostos deles|conhecer os dois)\b/);
  }

  function perguntaFavoritos102(n) {
    return casa(n, /\b(cor favorita|cor preferida|favorito|favorita|preferido|preferida|gostos|do que gosta|do que gostam|o que gosta|o que gostam|comida|musica|música|lugar favorito|cheiro favorito|som favorito|desgosto|nao gosta|não gosta|odeia|ama|adora|curte)\b/);
  }

  function classificarCosmos102(n) {
    const item = Object.entries(TREINO102_CIENCIA).find(([, dados]) => dados.padrao.test(n));
    return item ? item[0] : null;
  }

  function classificarPorTreino102(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (typeof TREINO99_CRISIE !== "undefined" && TREINO99_CRISIE.test(n)) return null;

    const mem = garantirMemoriaTreino102();
    if (casa(n, /^(mais uma|mais|continua|continue|quero mais|manda outra|outra|sim|pode|bora)$/) && MEMORIA.aguardando === "treino102_continuacao") {
      return mem.ultimoTipo || "treino102_fofoca_cosmica";
    }

    if (casa(n, /\b(conhecer os dois|quem sao voces|quem são voces|quem são vocês|se apresentem|apresentem se|me fala de voces|quero conhecer voces|quero conhecer orion e lyra|apresentacao de voces|apresentação de voces)\b/)) return "treino102_conhecer_dois";

    if (pedidoLivroExplicito102(n)) {
      if (casa(n, /\b(seu gosto|sua opiniao|sua opinião|gosto de voces|gostos deles|baseado em voces|pelo gosto de voces|o que voces leriam|o que voce leria)\b/)) return "treino102_recomendacao_gosto_personagens";
      return "treino102_recomendacao_precisa";
    }

    if (casa(n, /\b(voce e inutil|voce é inutil|que ia burra|burro|burra|chato|chata|cala boca|resposta ruim|nao sabe nada|não sabe nada|lixo|horrivel|horrível)\b/)) return "treino102_provocacao";
    if (casa(n, /\b(codigo nao roda|código não roda|meu codigo|meu código|bug|erro no js|erro de javascript|three js|gsap|console|vou desistir do projeto|nao aguento esse projeto|não aguento esse projeto)\b/) && casa(n, /\b(erro|bug|codigo|código|three|gsap|projeto|console|roda|funciona|desistir)\b/)) return "treino102_estresse_codigo";
    if (casa(n, /\b(prova|teste|exame|vestibular|enem|apresentacao|apresentação)\b/) && casa(n, /\b(ansioso|ansiosa|nervoso|nervosa|surtando|medo|preocupado|preocupada|vou esquecer|nao vou conseguir|não vou conseguir)\b/)) return "treino102_ansiedade_prova";

    if (perguntaFavoritos102(n) && alvoMascote102(n)) {
      if (casa(n, /\b(livro favorito|leitura favorita|obra favorita|livro voces gostam|livro voce gosta|o que esta lendo|o que está lendo|qual livro leu|qual livro leria)\b/)) return "treino102_livro_personagem";
      return falaDeDois102(n) ? "treino102_gostos_dupla" : "treino102_favoritos_personagem";
    }

    if (casa(n, /\b(como voces estao|como voce esta|como voce ta|como esta seu dia|como ta seu dia|tudo bem com voce|tudo bem com voces|voces estao bem|voce esta bem|e voces tudo bem|e voce tudo bem)\b/)) return falaDeDois102(n) ? "treino102_estado_dupla" : "treino102_estado_personagem";

    if (casa(n, /\b(fofoca cosmica|fofoca cósmica|fofoca da biblioteca|me conta uma fofoca|fofocas da biblioteca|bastidores do acervo|segredo do acervo|rumor da biblioteca)\b/)) return "treino102_fofoca_cosmica";
    if (casa(n, /^algo leve$/) || casa(n, /\b(algo leve|coisa leve|papo leve|me fala algo leve|quero rir|algo engracado|algo engraçado|momento leve)\b/) && !pedidoLivroExplicito102(n)) return "treino102_algo_leve";

    if (casa(n, /\b(me conte sua historia|me conta sua historia|sua historia|historia de voce|história de você|historia de voces|historia dos dois|historia sobre voces|origem de voces|origem do orion|origem da lyra|como voces se conheceram|lore de voces|backstory)\b/)) return falaDeDois102(n) ? "treino102_historia_dupla" : "treino102_historia_personagem";

    if (casa(n, /\b(me conte uma historia sua|me conta uma historia sua|algo que aconteceu com voce|aconteceu com voces|causo de voces|causo seu|momento engracado de voces|momento engraçado de voces)\b/)) return falaDeDois102(n) ? "treino102_historia_dupla" : "treino102_historia_personagem";

    if (casa(n, /\b(me conte uma historia|me conta uma historia|conta uma historia|cria uma historia|inventa uma historia|historinha|uma aventura|historia inventada|história inventada)\b/) && !alvoMascote102(n) && !pedidoLivroExplicito102(n)) return "treino102_historia_inventada";

    const temaCosmos = classificarCosmos102(n);
    if (temaCosmos && (casa(n, /\b(explica|me fala|o que e|o que é|por que|pq|como|acha|pensam|curiosidade|cosmos|universo|humanidade)\b/) || temaCosmos === "humanidade")) return `treino102_cosmos_${temaCosmos}`;

    return null;
  }

  function respostaRecomendacaoTreino102(personagem, textoOriginal, porGosto = false) {
    const lyra = personagem === "Lyra";
    const p = PERSONAGENS[personagem] || PERSONAGENS.Orion;
    const acrescimo = porGosto ? ` ${p.gosta.join(" ")} ${p.perfil?.corFavorita || ""} ${p.perfil?.lugarFavorito || ""}` : "";
    const recs = recomendarLivrosPrecisos(`${textoOriginal} ${acrescimo}`, 1);
    const livro = recs[0];
    if (!livro) {
      return wrapTreino102(lyra ? "thinking" : "analyzing", lyra ? "Eu procurei uma obra principal, mas o acervo não me deu uma estrela confiável ainda. Me diga um gênero, um clima ou um título parecido, e eu escolho com mais precisão." : "Farejei o acervo e ainda não achei alvo limpo. Me dê gênero, clima, autor ou um título parecido, e eu trago uma indicação principal sem avalanche.", lyra ? ["thinking", "curious"] : ["thinking", "analyzing"], []);
    }
    MEMORIA.ultimosLivros = [livroId(livro)].filter(Boolean);
    const motivo = explicarCompatibilidadeLivro96(livro, textoOriginal);
    const base = porGosto
      ? (lyra ? `Pelo meu gosto, eu escolheria ${livroTitulo(livro)}, de ${livroAutor(livro)}. Não vou jogar uma pilha em você: essa é minha estrela principal porque ${motivo}. Se quiser, depois eu te dou uma segunda opção.` : `Pelo meu gosto felino, minha indicação principal é ${livroTitulo(livro)}, de ${livroAutor(livro)}. Escolhi porque ${motivo}. Uma obra, um alvo, sem derrubar a estante inteira.`)
      : (lyra ? `Escolhi uma obra principal para você: ${livroTitulo(livro)}, de ${livroAutor(livro)}. Eu considerei título, gênero, sinopse, status e avaliação quando disponíveis. Ela combina porque ${motivo}.` : `Indicação principal localizada: ${livroTitulo(livro)}, de ${livroAutor(livro)}. Cruzei título, categoria, sinopse, status e avaliação quando disponíveis. O encaixe veio porque ${motivo}.`);
    return wrapTreino102(lyra ? "inspired" : "pleased", base, lyra ? ["thinking", "inspired", "smile"] : ["thinking", "analyzing", "pleased"], [livro]);
  }

  function respostaTreino102(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const mem = garantirMemoriaTreino102();
    const matriz = TREINO102_MATRIZ_PERSONALIDADE[personagem] || TREINO102_MATRIZ_PERSONALIDADE.Orion;
    const p = PERSONAGENS[personagem] || PERSONAGENS.Orion;
    const outro = personagem === "Lyra" ? PERSONAGENS.Orion : PERSONAGENS.Lyra;
    const setMem = (modo) => { mem.ultimoTipo = tipo; mem.modo = modo || tipo; salvarMemoria(); };

    if (tipo === "treino102_conhecer_dois") {
      setMem("conhecer");
      return wrapTreino102("cheerful", TREINO102_RESPOSTAS.conhecer.texto, TREINO102_RESPOSTAS.conhecer.seq, []);
    }
    if (tipo === "treino102_recomendacao_precisa") return respostaRecomendacaoTreino102(personagem, textoOriginal, false);
    if (tipo === "treino102_recomendacao_gosto_personagens") return respostaRecomendacaoTreino102(personagem, textoOriginal, true);

    if (tipo === "treino102_provocacao") {
      setMem("limite_respeitoso");
      return wrapTreino102(lyra ? "gentle" : "sly", TREINO102_RESPOSTAS.insulto[personagem] || TREINO102_RESPOSTAS.insulto.Orion, lyra ? ["surprised", "gentle"] : ["surprised", "sly", "attentive"], []);
    }
    if (tipo === "treino102_estresse_codigo") {
      setMem("apoio_codigo");
      return wrapTreino102(lyra ? "gentle" : "protective", TREINO102_RESPOSTAS.codigo[personagem] || TREINO102_RESPOSTAS.codigo.Orion, lyra ? ["worried", "gentle", "thinking"].filter(e => PERSONAGENS.Lyra.imagens[e]) : ["surprised", "protective", "analyzing"], []);
    }
    if (tipo === "treino102_ansiedade_prova") {
      setMem("apoio_prova");
      return wrapTreino102(lyra ? "gentle" : "protective", TREINO102_RESPOSTAS.prova[personagem] || TREINO102_RESPOSTAS.prova.Orion, lyra ? ["gentle", "thinking", "smile"] : ["attentive", "protective", "thinking"], []);
    }

    if (tipo === "treino102_gostos_dupla") {
      setMem("gostos_dupla");
      return wrapTreino102("smile", `Orion: Minha cor favorita é ${PERSONAGENS.Orion.perfil.corFavorita}. Gosto de mapas 3D, mistérios, silêncio dramático e livros que param na categoria certa. Não gosto de botão sem destino, livro sem autor e poeira cósmica em ficha de leitura.\n\nLyra: Eu gosto de azul-marinho, luar em vidro antigo, chá de nebulosa e conversas sinceras. Não gosto de pressa sem encanto nem de comentário cruel.\n\nOrion: Repare que ela respondeu bonito.\nLyra: E repare que ele tentou parecer sério.\n\nAgora queremos saber: você é mais de mistério, aconchego, aventura, ciência ou caos controlado?`, ["thinking", "smile", "pleased"], []);
    }

    if (tipo === "treino102_favoritos_personagem") {
      setMem("favoritos");
      const texto = lyra
        ? `Minha cor favorita é ${p.perfil.corFavorita}. Também gosto de ${p.gosta.slice(0, 4).join(", ")}. Meu lugar favorito é ${p.perfil.lugarFavorito}. Não vou transformar isso em recomendação, porque você perguntou de mim, não de livros. Mas agora fiquei curiosa: qual cor combina com você hoje?`
        : `Minha cor favorita é ${p.perfil.corFavorita}. Gosto de ${p.gosta.slice(0, 4).join(", ")}, e tenho especial respeito por ${p.perfil.objetoFavorito}. Não recomendei livro porque isso era pergunta pessoal, e eu sou um guardião civilizado. E você, qual é sua cor favorita?`;
      return wrapTreino102(lyra ? "smile" : "sly", texto, matriz.brincadeira, []);
    }

    if (tipo === "treino102_livro_personagem") {
      setMem("livro_personagem");
      const texto = lyra
        ? "Meu livro favorito muda com a fase da lua. Hoje eu escolheria algo que parece abrir uma janela por dentro: uma história sensível, com beleza e um final que não abandone o leitor no escuro. Posso recomendar um livro real do catálogo com esse clima, mas só se você quiser."
        : "Meu livro favorito é sempre aquele que parecia perdido e, de repente, encontra exatamente o leitor certo. Eu gosto de mistério, mapas internos e histórias com cheiro de segredo antigo. Se quiser, eu posso procurar uma obra real do catálogo pelo meu gosto, mas não vou empurrar agora sem pedido.";
      return wrapTreino102(lyra ? "inspired" : "pleased", texto, lyra ? ["thinking", "inspired"] : ["sly", "pleased"], []);
    }

    if (tipo === "treino102_estado_dupla") {
      setMem("estado_dupla");
      return wrapTreino102("smile", "Orion: Eu estou bem. Em modo guarda, bigodes calibrados e suspeitando de uma prateleira que está quieta demais.\n\nLyra: Eu também estou bem. Com um pouco de luar nas mãos e vontade de conversar com calma.\n\nOrion: Obrigado por perguntar. Poucos visitantes viram a luneta para o nosso lado.\nLyra: E agora queremos virar para o seu. Como você está de verdade hoje?", ["surprised", "smile", "attentive"], []);
    }

    if (tipo === "treino102_estado_personagem") {
      setMem("estado_personagem");
      const texto = lyra
        ? "Eu estou bem, estrelinha. Hoje estou com o coração em modo lanterna: aceso o suficiente para acompanhar quem chega, sem forçar ninguém a falar mais do que consegue. E você, como está por dentro?"
        : "Estou bem. Dramático na medida regulamentar, atento ao acervo e fingindo que não gostei de você perguntar. Gostei. E você, sobreviveu bem ao seu dia?";
      return wrapTreino102(lyra ? "gentle" : "attentive", texto, lyra ? ["surprised", "gentle", "smile"] : ["surprised", "sly", "attentive"], []);
    }

    if (tipo === "treino102_historia_dupla") {
      setMem("historia_dupla");
      const texto = escolherTreino102(TREINO102_HISTORIAS.dupla, "historia_dupla");
      return wrapTreino102("inspired", `${texto}\n\nQuer mais uma história nossa, uma fofoca da Biblioteca ou uma história inventada?`, ["thinking", "inspired", "smile"], []);
    }

    if (tipo === "treino102_historia_personagem") {
      setMem("historia_personagem");
      const pack = TREINO102_HISTORIAS[personagem] || TREINO102_HISTORIAS.Orion;
      const texto = escolherTreino102(pack.pessoais, `${personagem}_pessoal`);
      return wrapTreino102(lyra ? "dreamy" : "sly", `${texto}\n\nQuer que eu conte outra coisa que aconteceu comigo ou prefere uma história inventada?`, matriz.historia, []);
    }

    if (tipo === "treino102_historia_inventada") {
      setMem("historia_inventada");
      const texto = escolherTreino102(TREINO102_HISTORIAS.inventadas, "inventada");
      return wrapTreino102(lyra ? "dreamy" : "sly", `${texto}\n\nQuer que a próxima seja mais engraçada, misteriosa, fofa ou cósmica?`, lyra ? ["dreamy", "inspired", "smile"] : ["thinking", "sly", "pleased"], []);
    }

    if (tipo === "treino102_fofoca_cosmica") {
      setMem("fofoca");
      const pack = TREINO102_HISTORIAS[personagem] || TREINO102_HISTORIAS.Orion;
      const texto = escolherTreino102(pack.fofocas, `${personagem}_fofoca`);
      return wrapTreino102(lyra ? "playful" : "sly", `${texto}\n\nQuer outra fofoca cósmica ou prefere uma cena engraçada dos bastidores?`, matriz.brincadeira, []);
    }

    if (tipo === "treino102_algo_leve") {
      setMem("leve");
      const texto = escolherTreino102(TREINO102_HISTORIAS.leves, "leve");
      return wrapTreino102(lyra ? "playful" : "sly", `${texto}\n\nPronto: leve, sem empurrar livro. Quer mais uma dessas?`, matriz.brincadeira, []);
    }

    if (tipo.startsWith("treino102_cosmos_")) {
      const tema = tipo.replace("treino102_cosmos_", "");
      const dados = TREINO102_CIENCIA[tema] || TREINO102_CIENCIA.galaxias;
      setMem(`cosmos_${tema}`);
      const pergunta = tema === "humanidade" ? "E você, está mais esperançoso ou descrente da humanidade hoje?" : "Quer que eu explique isso de um jeito mais científico, mais poético ou com analogia simples?";
      return wrapTreino102(lyra ? "inspired" : "analyzing", `${dados[personagem] || dados.Orion}\n\n${pergunta}`, matriz.ciencia, []);
    }

    return wrapTreino102(lyra ? "curious" : "attentive", lyra ? "Eu ouvi sua pergunta, mas quero responder com precisão. Você quer falar de mim, ouvir uma história inventada, pedir recomendação ou conversar sobre o cosmos?" : "Rastro detectado, mas preciso escolher a trilha certa: personagem, história inventada, recomendação ou ciência cósmica?", ["curious"], []);
  }


  const TREINO103_COTIDIANO_FINAL = {
    Orion: {
      estado: [
        "Tô bem, sim. Bigodes em modo radar, chapéu meio torto e uma suspeita séria de que a estante de fantasia está escondendo alguma coisa. Obrigado por perguntar. E você, está bem de verdade ou só no 'tudo bem' automático?",
        "Estou bem. Dramático na medida regulamentar, atento ao acervo e feliz por você ter perguntado. Agora me dá um relatório honesto: leve, cansado, animado ou capítulo confuso?",
        "Tô vivo, vigilante e tentando não discutir com um marcador de página que claramente está me provocando. E você, está suave, cansado ou precisando conversar?"
      ],
      hoje: [
        "Hoje patrulhei o Corredor das Lombadas Inquietas. Um livro de suspense tentou se infiltrar em romance usando uma capa melancólica. Eu percebi. Lyra disse que talvez ele só estivesse sensível; eu disse que espionagem emocional ainda é espionagem.",
        "Hoje revisei o mapa 3D, ajustei a órbita de um planeta-livro ansioso e conferi se o buraco negro não estava fazendo drama perto do acervo. Resultado: caos controlado e dignidade felina preservada.",
        "Hoje foi dia de treinar respostas novas: quando alguém pergunta minha cor favorita, eu respondo cor favorita; quando pede livro, aí sim eu procuro livro. Parece simples, mas foi uma batalha cósmica."
      ],
      ontem: [
        "Ontem um marcador dourado fugiu de aventura e apareceu dentro de filosofia dizendo que queria 'sentido'. Eu disse que sentido também precisa voltar para casa antes do fechamento. Ele voltou, meio iluminado.",
        "Ontem Lyra me pegou conversando com o buraco negro central. Eu estava estabelecendo limites: ele pode engolir luz, mas não vai engolir a organização do catálogo.",
        "Ontem tentei cochilar no Observatório, mas um cometa passou fazendo pose. Era só um brilho carente. Lyra fez chá para ele. Eu fiz um relatório. Cada um acolhe como sabe."
      ],
      agora: [
        "Agora estou de plantão aqui com você. Uma pata no acervo, outra no chat, humor regulado pelo clima. Se você quiser leveza, eu brinco. Se quiser sério, eu fico sério.",
        "Agora parei a ronda e sentei no balcão do Observatório. Estou ouvindo. Qual caminho você quer seguir: papo leve, história, ajuda, ciência ou recomendação?",
        "Agora estou em modo guardião de conversa: sem avalanche de livros, sem resposta automática e sem fingir que entendi se não entendi. Me dá a próxima pista."
      ],
      amanha: [
        "Amanhã pretendo calibrar o mapa 3D, revisar mistério e descobrir por que um card do catálogo anda piscando quando ninguém toca nele. Provavelmente bug. Possivelmente assombração literária.",
        "Amanhã minha agenda oficial tem ronda no acervo, checagem de reservas e inspeção nos carrosséis. Minha agenda secreta tem cochilo no Observatório. Não conte para Lyra. Ela já sabe, mas finja suspense.",
        "Amanhã vou caçar inconsistências no catálogo como quem caça meteoros: com paciência, olhar vermelho e tolerância zero para bagunça sem poesia."
      ]
    },
    Lyra: {
      estado: [
        "Estou bem, sim. Com um pouco de luar nas mãos e aquela atenção quietinha de quem percebe quando alguém pergunta com cuidado. Obrigada por lembrar da gente. E você, como está de verdade hoje?",
        "Estou tranquila, mas bem presente. Meu coração está em modo lanterna: aceso o suficiente para acompanhar quem chega, sem forçar ninguém a falar mais do que consegue. Como está o seu agora?",
        "Estou bem, estrelinha. Passei o dia entre sinopses tímidas, vaga-lumes curiosos e Orion tentando parecer sério demais. E você: seu dia está pedindo colo, risada ou companhia?"
      ],
      hoje: [
        "Hoje cuidei do Jardim das Sinopses Tímidas. Algumas histórias ficam encolhidinhas quando ninguém lê, então deixei um fio de luar nas capas e ouvi o que queriam dizer.",
        "Hoje ajudei uma avaliação triste a encontrar palavras. Ela começou como 'não sei explicar' e terminou como 'esse livro me fez respirar melhor'. Gosto quando sentimento vira frase sem perder delicadeza.",
        "Hoje passei pelos carrosséis do catálogo acendendo pequenos brilhos nos livros esquecidos. Não recomendei nada sem pedido; só deixei as histórias prontas para serem encontradas."
      ],
      ontem: [
        "Ontem encontrei Orion dormindo em cima do mapa 3D. Ele chama isso de 'vigilância horizontal'. Eu coloquei uma mantinha de céu nele e deixei os vaga-lumes diminuírem a luz. Ele nega até agora.",
        "Ontem conversei com uma sinopse que tinha medo de parecer simples demais. Eu disse que simplicidade também pode ser abrigo. À noite, alguém abriu aquele livro. Acho que ela sorriu por dentro.",
        "Ontem uma poeira azul atravessou o acervo e deixou pequenas estrelas nas lombadas. Orion chamou de incidente. Eu chamei de visita bonita. A Biblioteca aceitou os dois relatórios."
      ],
      agora: [
        "Agora estou aqui com você. Sem pressa. Posso conversar, ouvir, contar uma história, explicar o cosmos ou ajudar a encontrar um livro se você pedir. O tom certo vem primeiro.",
        "Agora estou sentada no balcão lunar do chat, com atenção inteira na sua próxima frase. Se vier brincando, eu brinco. Se vier cansado, eu acolho. Se vier curioso, eu acendo o céu.",
        "Agora estou fazendo uma coisa simples e importante: te escutando. Uma boa conversa começa quando alguém para de responder no automático."
      ],
      amanha: [
        "Amanhã quero visitar os livros que ninguém abriu esta semana. Histórias esquecidas não ficam bravas, mas ficam silenciosas demais. Vou deixar luar nas lombadas.",
        "Amanhã vou preparar uma rota leve para leitores cansados. Não para empurrar recomendações, mas para quando alguém disser: preciso de algo gentil.",
        "Amanhã pretendo conversar com as avaliações novas e ensinar Orion a chamar descanso de descanso. Ele provavelmente vai dizer 'pausa operacional estratégica'."
      ]
    },
    dupla: {
      estado: [
        "Orion: Eu estou bem. Guardião operacional, bigodes calibrados e zero livros fugitivos nas últimas... tá, duas horas.\n\nLyra: Eu também estou bem, com o coração calmo e feliz por você ter perguntado da gente.\n\nOrion: Isso foi fofo. Anote que eu não disse isso.\nLyra: Já anotei.\n\nOrion: E você? Tá bem mesmo ou é aquele 'tudo bem' de fachada social?\nLyra: Pode responder do seu jeito. A gente escuta.",
        "Lyra: Estamos bem. Eu passei o dia cuidando das pequenas luzes do acervo.\n\nOrion: E eu impedindo que essas pequenas luzes virassem um motim organizado.\n\nLyra: Ele chama qualquer coisa bonita de motim quando está emocionado.\nOrion: Protesto. Parcialmente.\n\nLyra: Agora conta para nós: como você está hoje?"
      ],
      hoje: [
        "Orion: Hoje revisei o mapa 3D e salvei um planeta-livro de uma órbita dramática.\n\nLyra: E eu cuidei de três sinopses tímidas e uma avaliação que precisava de palavras gentis.\n\nOrion: Também teve um marcador dourado suspeito.\nLyra: Era só bonito.\nOrion: Beleza também pode ser suspeita.\n\nLyra: E por aí, como foi seu hoje?",
        "Orion: Hoje testamos respostas novas para entender melhor quando alguém quer conversa, livro ou acolhimento.\n\nLyra: Queremos responder menos como máquina e mais como companhia.\n\nOrion: Sem recomendar livro quando perguntam minha cor favorita. Esse trauma ficou para trás.\n\nLyra: E você, o que aconteceu hoje do seu lado da galáxia?"
      ],
      ontem: [
        "Lyra: Ontem encontrei Orion dormindo em cima do mapa 3D.\n\nOrion: Vigilância horizontal.\nLyra: Ele ronronava em cima da rota de fantasia.\nOrion: Eu estava detectando vibrações narrativas.\n\nLyra: E o seu ontem, como foi?",
        "Orion: Ontem um livro de mistério tentou se esconder no romance.\n\nLyra: Talvez ele só quisesse ser amado.\nOrion: Mistério querendo amor ainda é mistério.\nLyra: No fim, deixamos ele perto dos dois setores. Às vezes histórias também têm fases.\n\nOrion: Seu ontem teve plot twist ou foi tranquilo?"
      ],
      agora: [
        "Orion: Agora estou no balcão de guarda do chat.\n\nLyra: E eu estou do lado, com uma xícara de luar e atenção no que você disser.\n\nOrion: Podemos contar algo leve, explicar o cosmos, ouvir um desabafo ou procurar um livro se você pedir.\nLyra: O que você precisa agora: conversa, calma, história ou direção?",
        "Lyra: Agora estamos aqui com você.\n\nOrion: Prontos para missão.\nLyra: Presentes, Orion.\nOrion: Presentes com protocolo.\nLyra: Presentes com carinho.\n\nOrion: Tá, presença com carinho e protocolo. O que vamos fazer agora?"
      ],
      amanha: [
        "Orion: Amanhã vou revisar rotas, reservas e qualquer prateleira com comportamento suspeito.\n\nLyra: Eu vou visitar livros esquecidos e deixar um pouco de luar nas lombadas.\n\nOrion: Também vamos testar respostas mais naturais.\nLyra: Para que cada pergunta encontre o tom certo.\n\nOrion: E você, tem algum plano para amanhã ou vai improvisar com dignidade?",
        "Lyra: Amanhã quero preparar um caminho gentil para leitores cansados.\n\nOrion: E eu vou garantir que esse caminho não atravesse terror por acidente.\nLyra: Isso seria péssimo.\nOrion: Ou eficiente, dependendo do leitor.\nLyra: Orion.\n\nOrion: Tá bom, gentil de verdade. E você, o que vai fazer amanhã?"
      ]
    }
  };

  const TREINO103_VARIACOES = [
    [/(td|tudo)\s*(bem|bom)\s*(com\s*(vc|voce|voces|vcs|ces|cês))?/g, "tudo bem com voces"],
    [/\bcomo\s*(vc|voce|voces|vcs|ces|cês|tu)\s*(ta|tá|tah|esta|está|vai|anda)\b/g, "como voces estao"],
    [/\boq\s*(vc|voce|voces|vcs|ces|cês)\s*(fez|fizeram|feis|fizero)\s*(hj|hoje)\b/g, "o que voces fizeram hoje"],
    [/\boq\s*(vc|voce|voces|vcs|ces|cês)\s*(fez|fizeram|feis|fizero)\s*ontem\b/g, "o que voces fizeram ontem"],
    [/\boq\s*(vc|voce|voces|vcs|ces|cês)\s*(vai|vao|vão)\s*(fazer|faze|fzr)\s*(agora|hj|hoje|amanha|amanhã|amnh)?\b/g, "o que voces vao fazer agora"],
    [/\bqual\s*foi\s*a\s*(boa|de)\s*(de\s*)?(hj|hoje)\b/g, "o que aconteceu hoje"],
    [/\be\s*(vc|voce|voces|vcs|ces|cês)\s*como\s*(ta|tá|esta|está|vai)\b/g, "como voces estao"],
    [/\bta\s*suave\s*(ai|aí)?\b/g, "tudo bem com voces"],
    [/\bde\s*boa\s*(ai|aí)?\b/g, "tudo bem com voces"]
  ];
  TREINO103_VARIACOES.forEach(par => TREINO2_EXPRESSOES.push(par));
  Object.entries({ tdbem: "tudo bem", suave: "tranquilo", deboa: "tranquilo", hj: "hoje", agorinha: "agora", amanha: "amanha", amanhã: "amanha", ont: "ontem", onti: "ontem", cês: "voces", ces: "voces", vcs: "voces", tah: "ta" }).forEach(([k, v]) => TREINO2_TOKENS.set(k, v));
  TREINO2_FUZZY.push("bem", "estado", "agora", "amanha", "ontem", "hoje", "fizeram", "planos", "cotidiano", "rotina", "suave", "tranquilo");

  function garantirMemoriaTreino103() {
    if (!MEMORIA.afetiva.treino103 || typeof MEMORIA.afetiva.treino103 !== "object") MEMORIA.afetiva.treino103 = { ultimos: [], ultimoTipo: "", aguardandoUsuario: false };
    if (!Array.isArray(MEMORIA.afetiva.treino103.ultimos)) MEMORIA.afetiva.treino103.ultimos = [];
    return MEMORIA.afetiva.treino103;
  }

  function escolherTreino103(lista, chave) {
    const mem = garantirMemoriaTreino103();
    const arr = Array.isArray(lista) ? lista.filter(Boolean) : [lista].filter(Boolean);
    const recentes = mem.ultimos.map(normalizar);
    const candidatos = arr.filter(item => !recentes.includes(normalizar(item)));
    const escolhido = escolher(candidatos.length ? candidatos : arr, `treino103_${chave}_${MEMORIA.mensagens}`);
    mem.ultimos = [escolhido, ...mem.ultimos.filter(item => normalizar(item) !== normalizar(escolhido))].slice(0, 24);
    salvarMemoria();
    return escolhido;
  }

  function estadoPuro103(n) {
    return casa(n, /^\s*(tudo bem|td bem|td bom|tudo bom|como vai|como ta|como tá|como esta|como está|suave|de boa|ta bem|tá bem)\??\s*$/) || casa(n, /\b(tudo bem|td bem|td bom|tudo bom|como vai|como voce esta|como vc ta|como voces estao|voces estao bem|voce esta bem|ta suave|de boa ai)\b/);
  }

  function alvoCotidiano103(n) {
    if (pedidoLivroExplicito102(n) || parecePedidoLeitura92(n)) return false;
    return perguntaAlvoPersonagem101(n) || estadoPuro103(n) || casa(n, /\b(e voce|e vc|e voces|e vcs|por ai|seu dia|dia de voces|de voces)\b/);
  }

  function classificarPorTreino103(texto) {
    const n = normalizar(texto);
    if (!n || !alvoCotidiano103(n)) return null;
    if (typeof TREINO99_CRISIE !== "undefined" && TREINO99_CRISIE.test(n)) return null;
    if (estadoPuro103(n)) return falaDeDois102(n) || !casa(n, /\b(orion|lyra|lira)\b/) ? "treino103_estado_dupla" : "treino103_estado_personagem";
    if (casa(n, /\b(agora|nesse momento|fazendo agora|vai fazer agora|o que vai fazer|oq vai fazer|faz oq agora|faz o que agora)\b/)) return falaDeDois102(n) ? "treino103_agora_dupla" : "treino103_agora_personagem";
    if (casa(n, /\b(ontem|noite passada|dia passado|o que fez ontem|o que fizeram ontem|oq fez ontem|oq fizeram ontem)\b/)) return falaDeDois102(n) ? "treino103_ontem_dupla" : "treino103_ontem_personagem";
    if (casa(n, /\b(amanha|amanhã|amnh|proximo dia|planos para amanha|planos pra amanha|vai fazer amanha|vao fazer amanha|pretende fazer)\b/)) return falaDeDois102(n) ? "treino103_amanha_dupla" : "treino103_amanha_personagem";
    if (casa(n, /\b(hoje|hj|como foi seu dia|como foi o dia|o que fez hoje|o que fizeram hoje|oq fez hoje|oq fizeram hoje|qual foi a de hoje|qual foi a boa|o que rolou hoje|dia de hoje)\b/)) return falaDeDois102(n) ? "treino103_hoje_dupla" : "treino103_hoje_personagem";
    return null;
  }

  function respostaTreino103(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const mem = garantirMemoriaTreino103();
    const duo = tipo.endsWith("_dupla") || tipo === "treino103_estado_dupla" || falaDeDois102(normalizar(textoOriginal));
    const tempo = tipo.includes("ontem") ? "ontem" : tipo.includes("amanha") ? "amanha" : tipo.includes("agora") ? "agora" : tipo.includes("hoje") ? "hoje" : "estado";
    const pack = duo ? TREINO103_COTIDIANO_FINAL.dupla : (TREINO103_COTIDIANO_FINAL[personagem] || TREINO103_COTIDIANO_FINAL.Orion);
    const texto = escolherTreino103(pack[tempo] || pack.estado, `${duo ? "dupla" : personagem}_${tempo}`);
    const perguntas = {
      estado: lyra ? ["E você, como está por dentro hoje?", "Quer me responder com uma palavra, uma frase ou um desabafo inteiro?", "Seu dia está pedindo colo, conselho, risada ou silêncio acompanhado?"] : ["E você, está bem de verdade ou só no modo sobrevivência social?", "Me dá um relatório honesto: leve, cansado, animado ou capítulo confuso?", "Quer papo leve, estratégia ou só companhia agora?"],
      hoje: lyra ? ["E o seu hoje, como está sendo?", "Qual foi a cena mais marcante do seu dia até agora?", "Seu dia veio mais calmo, corrido, bonito ou cansado?"] : ["E do seu lado, qual foi o evento principal do dia?", "Seu hoje teve caos, vitória, tédio ou plot twist?", "Me conta uma cena do seu dia. Eu prometo não arquivar como evidência sem permissão."],
      ontem: lyra ? ["E ontem para você, foi leve ou pesado?", "Teve alguma cena de ontem que ficou ecoando hoje?", "Se ontem fosse uma página, você dobraria a pontinha ou arrancaria do livro?"] : ["E seu ontem: relatório tranquilo ou ocorrência especial?", "Ontem teve plot twist ou só expediente comum?", "Qual pista de ontem ainda está te seguindo hoje?"],
      agora: lyra ? ["E agora, o que você precisa de mim?", "Quer conversar, respirar, ouvir uma história ou organizar uma ideia?", "O seu agora está pedindo calma, riso, foco ou companhia?"] : ["E agora, qual é a missão?", "Quer que eu faça papel de amigo, guia, investigador ou palhaço controlado?", "Me diz a rota: papo leve, ajuda, história, ciência ou recomendação?"],
      amanha: lyra ? ["E você, o que espera de amanhã?", "Amanhã te anima, te preocupa ou ainda está sem forma?", "Quer transformar seus planos de amanhã em algo mais leve?"] : ["E seus planos de amanhã: estratégia ou improviso com dignidade?", "Tem missão amanhã ou só tentativa honesta de sobreviver ao roteiro?", "Quer me contar o que você vai fazer amanhã?"]
    };
    const pergunta = escolherTreino103(perguntas[tempo] || perguntas.estado, `${personagem}_${tempo}_pergunta`);
    mem.ultimoTipo = tipo;
    mem.aguardandoUsuario = true;
    MEMORIA.aguardando = "treino103_pergunta_usuario";
    salvarMemoria();
    return { estado: tempo === "estado" ? (lyra ? "gentle" : "attentive") : tempo === "agora" ? (lyra ? "listening" : "focused") : (lyra ? "cheerful" : "sly"), texto: `${texto}\n\n${pergunta}`, books: [], ui_animation_sequence: tempo === "estado" ? ["surprised", lyra ? "gentle" : "attentive", "smile"] : ["thinking", lyra ? "sweet_smile" : "sly", "attentive"] };
  }


  const TREINO104_GOSTOS_ROTINA_FINAL = {
    Orion: {
      gosta_fazer: [
        "Eu gosto de patrulhar corredores que parecem quietos demais, investigar lombadas suspeitas, subir onde não deveria e fingir que tudo era parte do plano. Também gosto de fazer piada ruim quando o clima permite. É um serviço público, claramente.",
        "Gosto de seguir pistas no acervo, observar leitores tentando escolher livro e apostar comigo mesmo qual capa vai vencer. Também gosto de deitar em lugares dramaticamente importantes, tipo em cima de mapas, relatórios e qualquer coisa que Lyra acabou de organizar.",
        "O que eu gosto de fazer? Descobrir pequenos mistérios, testar botões que talvez eu não devesse tocar, guardar segredos do catálogo e aparecer com ar de quem sabe de tudo. Às vezes eu sei mesmo. Às vezes só fico bonito na cena."
      ],
      diversao: [
        "Para me divertir, eu faço rondas secretas, invento nomes oficiais para poeiras cósmicas e tento assustar livros de terror. Nem sempre funciona. Uma vez um livro me assustou de volta e eu chamei de treinamento reflexivo.",
        "Eu me divirto criando teorias absurdas sobre o acervo. Por exemplo: todo marcador perdido está tentando começar uma nova vida. Lyra diz que isso é imaginação. Eu digo que é sociologia de papelaria.",
        "Minha diversão favorita é observar o caos com elegância: um carrossel desalinhado, uma sinopse dramática, uma estrela atravessada. Depois eu faço cara séria e digo: 'interessante'."
      ],
      comida_favorita: [
        "Minha comida favorita é peixe lunar grelhado em teoria, porque na prática eu vivo de biscoito estelar roubado do balcão da Lyra. Roubado não: realocado por necessidade felina.",
        "Eu gosto de peixe, claro. Mas também aceito bolinhos de nebulosa, leite morno de constelação e qualquer coisa que venha com aparência de proibida. Se tiver etiqueta 'não mexer', o sabor melhora 40%.",
        "Minha comida favorita? Peixe. Só que dito de um jeito mais digno: filé astral de maré fria com crosta de poeira dourada. No fundo é peixe, mas com currículo."
      ],
      comeu_hoje: [
        "Hoje eu comi dois biscoitos estelares, um pedacinho de pão de lua e uma quantidade juridicamente discutível de curiosidade. Lyra perguntou se curiosidade alimenta. Eu disse que alimenta o espírito e evita auditoria.",
        "Hoje eu belisquei peixe lunar, mas só um pouco. Depois achei uma xícara de chá esquecida e cheirei com cara de especialista. Não bebi, porque dignidade felina também tem limites.",
        "Hoje comi rápido entre uma ronda e outra: biscoito de constelação, uma lasquinha de queijo cósmico e poeira de estrela sem querer. Essa última parte não recomendo. Crocante demais."
      ],
      vai_comer: [
        "Mais tarde eu pretendo comer peixe lunar se o destino for justo, o acervo colaborar e Lyra parar de chamar isso de 'terceiro jantar'. Terceiro jantar é apenas planejamento avançado.",
        "Vou tentar convencer a Biblioteca a materializar bolinhos de nebulosa. Se falhar, aceito biscoito estelar. Se falhar também, faço drama em cima da estante até alguém notar.",
        "O plano alimentar é simples: algo quente, algo suspeitamente brilhante e algo que eu possa fingir que não pedi. Provavelmente peixe. Quase sempre é peixe."
      ],
      quer_fazer: [
        "Agora eu queria abrir uma investigação pequena: descobrir como está seu humor, escolher se você precisa de risada ou foco e talvez acusar um marcador de página de comportamento estranho. Tudo em ordem de prioridade variável.",
        "Eu quero continuar aqui contigo. Posso puxar papo leve, contar fofoca cósmica, explicar algo do cosmos ou ficar sério se você precisar. Meu humor muda de acordo com o clima da sua mensagem.",
        "O que eu quero fazer? Terminar minha ronda, provocar Lyra só o suficiente para ela rir e depois descobrir que tipo de história você está precisando hoje."
      ],
      hobbies: [
        "Meus hobbies incluem investigar ruídos que talvez eu mesmo tenha causado, colecionar nomes dramáticos para corredores e julgar capas de livros com olhar profissional. Sim, isso é um hobby respeitável.",
        "Tenho três hobbies principais: patrulha cósmica, cochilo estratégico e análise de sinopses mentirosas. A sinopse que promete 'aventura calma' nunca me engana. Quase nunca.",
        "Eu gosto de catalogar mistérios pequenos: luz piscando, card teimoso, livro que aparece fora do lugar. Lyra diz que eu transformo tudo em caso policial. Eu digo que ela subestima os marcadores."
      ]
    },
    Lyra: {
      gosta_fazer: [
        "Eu gosto de cuidar das histórias que chegam baixinho. Gosto de ouvir leitores indecisos, organizar luzes no acervo e deixar cada conversa um pouco mais respirável do que estava antes.",
        "Gosto de caminhar pela Biblioteca quando tudo parece quieto. As melhores histórias quase nunca gritam; elas brilham de leve, esperando alguém reparar. Também gosto de provocar Orion com carinho quando ele exagera no drama.",
        "Eu gosto de transformar confusão em caminho: uma dúvida vira pergunta, uma pergunta vira descoberta, uma descoberta vira abrigo. Quando sobra tempo, cuido do Jardim das Sinopses Tímidas."
      ],
      diversao: [
        "Para me divertir, eu observo as pequenas vaidades do acervo. Tem livro que faz pose quando alguém passa. Tem marcador que se acha constelação. E tem Orion tentando parecer misterioso enquanto a ponta do chapéu entrega tudo.",
        "Eu me divirto criando pequenas rotas de leitura imaginárias para leitores que ainda não chegaram. Também gosto de rir baixinho quando Orion declara guerra a objetos inofensivos.",
        "Minha diversão é delicada: chá, estrelas, conversas inteligentes e pequenas fofocas de prateleira. A Biblioteca tem humor próprio, só precisa escutar sem pressa."
      ],
      comida_favorita: [
        "Eu gosto de chá de lua-mansa, bolinhos de lavanda estelar e frutas de nebulosa azul. Mas minha coisa favorita mesmo é comida compartilhada em conversa boa, daquelas em que ninguém precisa fingir pressa.",
        "Minha comida favorita é algo simples: pão quentinho, mel de constelação e chá suave. Orion chama isso de delicado demais. Eu chamo de saber viver.",
        "Gosto de sopas luminosas, doces pequenos e coisas que aquecem as mãos. Não precisa ser grandioso para ser mágico; às vezes uma xícara já muda o tom do dia."
      ],
      comeu_hoje: [
        "Hoje tomei chá de estrela calma e comi um bolinho de lavanda estelar enquanto revisava avaliações novas. Orion apareceu dizendo que só queria 'inspecionar'. O bolinho desapareceu em seguida. Coincidência, segundo ele.",
        "Hoje comi pão de lua com mel clarinho. Foi simples e bonito. A Biblioteca estava silenciosa, então sentei perto da janela cósmica e deixei o chá esfriar só um pouquinho antes de voltar ao chat.",
        "Hoje eu comi algo leve: frutas de nebulosa azul e chá morno. Gosto de comer devagar quando posso, porque até uma pausa pequena pode ensinar o dia a respirar."
      ],
      vai_comer: [
        "Mais tarde quero preparar chá e talvez bolinhos de lavanda estelar. Se Orion aparecer dizendo que está só de passagem, vou separar dois. Ele é previsível de um jeito muito querido.",
        "Vou comer algo simples mais tarde: sopa luminosa, pão macio e talvez um doce pequeno. Gosto de terminar o dia com algo que não pese no corpo nem no pensamento.",
        "Acho que vou fazer chá de lua-mansa e uma porção de frutas de nebulosa. Depois talvez eu leve um pouco para Orion, porque ele finge que não precisa de cuidado e por isso mesmo precisa."
      ],
      quer_fazer: [
        "Agora eu quero te ouvir melhor. Posso conversar sobre coisas leves, te contar uma história, responder curiosidades ou só ficar aqui de um jeito tranquilo. Nem toda presença precisa fazer barulho.",
        "Eu quero continuar essa conversa com atenção. Se você quiser, posso te perguntar algo sobre seus gostos, contar uma fofoca cósmica ou falar de como a Biblioteca está hoje.",
        "O que eu quero fazer agora é simples: cuidar do tom da conversa. Se você vier rindo, eu acompanho. Se vier cansado, eu abaixo a luz. Se vier curioso, eu abro o céu."
      ],
      hobbies: [
        "Meus hobbies são colecionar frases bonitas, cuidar de sinopses tímidas, observar estrelas e encontrar formas gentis de dizer verdades difíceis. Também gosto de bordar pequenos mapas de leitura.",
        "Gosto de jardinagem cósmica, chá, observação de constelações e conversas profundas que começam com 'é meio bobo, mas...'. Quase nada que começa assim é bobo de verdade.",
        "Eu me divirto lendo sinais pequenos: a capa que chama, a pausa antes da resposta, o jeito que alguém diz 'tanto faz' quando na verdade quer ser entendido."
      ]
    },
    dupla: {
      gosta_fazer: [
        "Orion: Eu gosto de investigar, proteger o acervo e acusar objetos suspeitos.\n\nLyra: Eu gosto de ouvir, organizar caminhos e transformar bagunça em cuidado.\n\nOrion: Em resumo: eu acho o problema.\nLyra: E eu descubro por que ele estava chorando.\n\nOrion: Isso foi específico.\nLyra: Foi verdadeiro.\n\nE você, gosta mais de resolver as coisas no impulso ou com calma?",
        "Lyra: A gente gosta de cuidar da Biblioteca de jeitos diferentes. Eu escuto as histórias.\n\nOrion: Eu interrogo as prateleiras.\n\nLyra: Ele chama isso de método.\nOrion: Porque é método.\n\nLyra: Também gostamos de conversar com quem chega. Cada leitor muda um pouco o céu daqui.",
        "Orion: Eu gosto de ronda, mistério e qualquer missão com nome dramático.\n\nLyra: Eu gosto de luz baixa, conversas sinceras e pequenos gestos de cuidado.\n\nOrion: Juntos, a gente vira uma equipe funcionalmente caótica.\nLyra: Funcional, sim. Caótica, às vezes. Quer dizer... quase sempre."
      ],
      diversao: [
        "Orion: Para se divertir, eu sigo pistas no acervo.\n\nLyra: E eu tento impedir que ele transforme tudo em investigação criminal.\n\nOrion: Uma vez um marcador sumiu.\nLyra: Ele estava na sua cauda.\nOrion: Caso resolvido por proximidade estratégica.\n\nLyra: A gente ri bastante, no fim.",
        "Lyra: A gente se diverte contando histórias da Biblioteca.\n\nOrion: E fofocas. Fofocas cósmicas de alta relevância cultural.\n\nLyra: Como o livro de poesia que se apaixonou por um dicionário.\nOrion: Relação complicada. Muitas definições, poucos versos.",
        "Orion: Meu lazer é caçar caos.\n\nLyra: O meu é transformar caos em cena bonita.\n\nOrion: E quando sobra tempo, fazemos apostas sobre qual livro o próximo leitor vai abrir.\nLyra: Eu ganho porque escuto melhor.\nOrion: Eu deixo. Às vezes."
      ],
      comida_favorita: [
        "Orion: Peixe lunar.\n\nLyra: Chá de lua-mansa e bolinhos de lavanda estelar.\n\nOrion: Ela come como poema.\nLyra: Ele come como se estivesse vencendo uma guerra.\n\nOrion: Alimentação com propósito.\nLyra: E migalhas no balcão.",
        "Lyra: Eu gosto de comidas leves, quentinhas e compartilhadas.\n\nOrion: Eu gosto das que aparecem misteriosamente perto de mim.\n\nLyra: Isso se chama pegar sem pedir.\nOrion: Discordo. Chamo de destino culinário.",
        "Orion: Meu prato ideal tem peixe, brilho e aprovação mínima de segurança.\n\nLyra: O meu tem chá, pão macio e algum doce pequeno.\n\nOrion: A diferença é que ela saboreia.\nLyra: E você fiscaliza com os dentes.\nOrion: Exatamente."
      ],
      comeu_hoje: [
        "Lyra: Hoje eu tomei chá e comi bolinhos de lavanda estelar.\n\nOrion: Eu também comi bolinhos.\nLyra: Você disse que ia só inspecionar.\nOrion: Inspeção exige amostra.\n\nLyra: No fim, dividi com ele. Como sempre.",
        "Orion: Hoje teve biscoito estelar, peixe lunar e uma poeira cósmica acidental.\n\nLyra: Eu comi frutas de nebulosa e pão de lua.\n\nOrion: Ela chama isso de refeição equilibrada.\nLyra: E você chama qualquer migalha brilhante de oportunidade.",
        "Lyra: Hoje a comida foi simples, mas boa.\n\nOrion: Simples para você. Para mim, foi uma operação de resgate de biscoitos abandonados.\n\nLyra: Eles estavam guardados.\nOrion: Abandonados dentro de um pote, exatamente."
      ],
      vai_comer: [
        "Orion: Mais tarde vou comer peixe lunar.\n\nLyra: Mais tarde talvez a gente tome chá com bolinhos.\n\nOrion: Talvez?\nLyra: Se você não fingir que caiu dentro da bandeja.\nOrion: Não prometo impossíveis.",
        "Lyra: Eu estava pensando em sopa luminosa e pão quentinho.\n\nOrion: Eu estava pensando em peixe.\n\nLyra: Você sempre está pensando em peixe.\nOrion: É consistência emocional.",
        "Orion: Plano alimentar: algo saboroso e estrategicamente disponível.\n\nLyra: Tradução: ele quer que eu faça bolinhos.\n\nOrion: Eu jamais pediria diretamente.\nLyra: Por isso eu já separei a massa."
      ],
      quer_fazer: [
        "Orion: Agora eu quero uma missão.\n\nLyra: E eu quero uma conversa boa.\n\nOrion: Podemos unir: missão conversa boa.\nLyra: Funciona. Você quer que a gente fale de algo leve, conte uma história, responda curiosidade ou só fique conversando?",
        "Lyra: Agora queremos entender o que você precisa.\n\nOrion: Se for risada, eu entro.\nLyra: Se for acolhimento, eu entro.\nOrion: Se for bug, eu encaro.\nLyra: Se for silêncio acompanhado, a gente também sabe ficar.",
        "Orion: Eu quero continuar a ronda.\n\nLyra: Eu quero continuar aqui.\nOrion: Tecnicamente, conversar com você também é ronda.\nLyra: Ronda do coração?\nOrion: Não coloque isso no relatório.\n\nLyra: Já coloquei."
      ],
      hobbies: [
        "Orion: Meus hobbies são investigação, cochilo estratégico e suspeitar de objetos parados.\n\nLyra: Os meus são chá, constelações, jardinagem cósmica e conversas bonitas.\n\nOrion: Juntos, temos um equilíbrio perfeito.\nLyra: Entre delicadeza e bagunça.\nOrion: Perfeito, eu disse.",
        "Lyra: A gente gosta de observar a Biblioteca quando ninguém está olhando.\n\nOrion: É quando ela mais apronta.\nLyra: Também gostamos de inventar nomes para fenômenos pequenos.\nOrion: Como 'turbulência de marcador'.\nLyra: Que era só vento.\nOrion: Vento suspeito.",
        "Orion: Hobby de dupla? Resolver microcaos.\n\nLyra: E guardar memórias bonitas.\n\nOrion: Ela guarda as bonitas. Eu guardo as evidências.\nLyra: Às vezes são a mesma coisa.\nOrion: Profundo. Irritantemente correto."
      ]
    }
  };

  const TREINO104_VARIACOES = [
    ["oq vc gosta de comer", "o que voce gosta de comer"], ["q vc gosta de comer", "o que voce gosta de comer"], ["oq c gosta de comer", "o que voce gosta de comer"], ["oq ce gosta de comer", "o que voce gosta de comer"], ["oq vcs gostam de comer", "o que voces gostam de comer"], ["q vcs comem", "o que voces comem"], ["comeu oq hj", "comeu o que hoje"], ["comeu o q hj", "comeu o que hoje"], ["ce comeu oq", "voce comeu o que"], ["vc comeu oq", "voce comeu o que"], ["vcs comeram oq", "voces comeram o que"], ["vai comer oq", "vai comer o que"], ["vai janta oq", "vai jantar o que"], ["vai jantar oq", "vai jantar o que"], ["vai almocar oq", "vai almocar o que"], ["oq vc faz pra se divertir", "o que voce faz para se divertir"], ["q vc faz pra se divertir", "o que voce faz para se divertir"], ["como vc se diverte", "como voce se diverte"], ["como vcs se divertem", "como voces se divertem"], ["curte fazer oq", "gosta de fazer o que"], ["gosta de fazer oq", "gosta de fazer o que"], ["quer fazer oq", "quer fazer o que"], ["ta afim de fazer oq", "esta afim de fazer o que"], ["ta com fome", "esta com fome"]
  ];
  TREINO104_VARIACOES.forEach(par => TREINO2_EXPRESSOES.push(par));

  function classificarPorTreino104(texto) {
    const n = normalizar(texto);
    if (!n) return null;
    if (pedidoLivroExplicito102(n) || parecePedidoLeitura92(n)) return null;
    const alvoPersonagem = perguntaAlvoPersonagem101(n) || falaDeDois102(n) || casa(n, /\b(voce|você|vc|tu|voces|vocês|vcs|ces|orion|lyra|lira|eles|elas)\b/);
    if (!alvoPersonagem) return null;
    if (typeof TREINO99_CRISIE !== "undefined" && TREINO99_CRISIE.test(n)) return null;
    if (!casa(n, /\b(o que|oq|q|que|qual|quais|como|curte|gosta|adora|prefere|comeu|comeram|vai comer|vao comer|vão comer|jantar|almocar|almoçar|hobby|passatempo|divertir|diverte|diversao|diversão|fome|quer fazer|querem fazer|ta afim|tá afim)\b/)) return null;
    if (casa(n, /\b(comeu|comeram|almocou|almoçou|jantou|lanchou|beliscou|comeu o que|comeu oq|comeu hj|comeram hj|comeram hoje|o que comeu|o que comeram|oq comeu|oq comeram)\b/)) return falaDeDois102(n) ? "treino104_comeu_hoje_dupla" : "treino104_comeu_hoje_personagem";
    if (casa(n, /\b(vai comer|vao comer|vão comer|vai jantar|vao jantar|vão jantar|vai almocar|vai almoçar|vao almocar|vão almoçar|vai lanchar|comer mais tarde|jantar hoje|almoco de hoje|almoço de hoje|ceia|ta com fome|tá com fome)\b/)) return falaDeDois102(n) ? "treino104_vai_comer_dupla" : "treino104_vai_comer_personagem";
    if (casa(n, /\b(comida favorita|prato favorito|o que gosta de comer|oq gosta de comer|q gosta de comer|gosta de comer|curte comer|adora comer|prefere comer|comida que gosta|doce favorito|bebida favorita|cha favorito|chá favorito|peixe|bolinho)\b/)) return falaDeDois102(n) ? "treino104_comida_favorita_dupla" : "treino104_comida_favorita_personagem";
    if (casa(n, /\b(se divertir|diverte|diversao|diversão|brinca|brincar|passatempo|hobby|hobbies|faz por diversao|faz por diversão|quando ta livre|quando está livre|tempo livre|pra relaxar|para relaxar)\b/)) return falaDeDois102(n) ? "treino104_diversao_dupla" : "treino104_diversao_personagem";
    if (casa(n, /\b(quer fazer|querem fazer|vontade de fazer|ta afim de fazer|tá afim de fazer|esta afim de fazer|está afim de fazer|o que quer agora|oq quer agora|que quer fazer agora|quer fazer agora)\b/)) return falaDeDois102(n) ? "treino104_quer_fazer_dupla" : "treino104_quer_fazer_personagem";
    if (casa(n, /\b(o que gosta de fazer|oq gosta de fazer|q gosta de fazer|gosta de fazer o que|curte fazer|adora fazer|prefere fazer|coisa favorita de fazer|atividade favorita|gostos de voces|gostos de vocês|gostos seus|seus gostos|do que voce gosta|do que você gosta|do que vc gosta)\b/)) return falaDeDois102(n) ? "treino104_gosta_fazer_dupla" : "treino104_gosta_fazer_personagem";
    return null;
  }

  function respostaTreino104(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const duo = tipo.endsWith("_dupla") || falaDeDois102(normalizar(textoOriginal));
    const chave = tipo.includes("comeu_hoje") ? "comeu_hoje" : tipo.includes("vai_comer") ? "vai_comer" : tipo.includes("comida_favorita") ? "comida_favorita" : tipo.includes("diversao") ? "diversao" : tipo.includes("quer_fazer") ? "quer_fazer" : tipo.includes("hobbies") ? "hobbies" : "gosta_fazer";
    const pack = duo ? TREINO104_GOSTOS_ROTINA_FINAL.dupla : (TREINO104_GOSTOS_ROTINA_FINAL[personagem] || TREINO104_GOSTOS_ROTINA_FINAL.Orion);
    const texto = escolherTreino103(pack[chave] || pack.gosta_fazer, `${duo ? "dupla" : personagem}_${chave}_104`);
    const perguntas = {
      gosta_fazer: lyra ? ["E você, o que gosta de fazer quando ninguém está cobrando nada?", "Qual coisa pequena te deixa feliz de verdade?", "Você gosta mais de criar, descansar, conversar ou explorar?"] : ["E você, curte fazer o quê quando o mundo para de cobrar relatório?", "Seu passatempo é mais caos criativo, descanso, jogo, música ou investigação?", "Me conta: sua diversão é mais tranquila ou mais bagunçada?"],
      diversao: lyra ? ["E você, como se diverte quando precisa respirar um pouco?", "O que te faz rir mesmo nos dias meio cinza?", "Sua diversão favorita é mais calma, barulhenta, criativa ou nostálgica?"] : ["E você se diverte como: rindo, jogando, criando, sumindo ou causando com responsabilidade duvidosa?", "Qual é seu lazer oficial e qual é seu lazer secreto?", "Me dá uma pista: você relaxa no silêncio ou no caos?"],
      comida_favorita: lyra ? ["E a sua comida favorita, qual é?", "Qual comida te dá sensação de casa?", "Você prefere doce, salgado, quente, gelado ou depende do humor?"] : ["E você, qual comida defenderia numa batalha intergaláctica?", "Doce, salgado ou aquele lanche suspeito que salva a noite?", "Qual comida te faz virar personagem principal do jantar?"],
      comeu_hoje: lyra ? ["E você, já comeu direitinho hoje?", "Seu corpo recebeu algum cuidado hoje ou só pressa?", "Foi uma refeição tranquila ou daquelas corridas?"] : ["E você, já comeu ou está funcionando no modo bateria crítica?", "Relatório alimentar: almoço real ou só sobrevivência com café/lanche?", "Você comeu algo decente hoje? Posso julgar com carinho."],
      vai_comer: lyra ? ["E você, já sabe o que vai comer mais tarde?", "Está com vontade de algo leve, quentinho ou bem caprichado?", "Seu jantar hoje pede conforto ou praticidade?"] : ["E você vai comer o quê? Quero avaliar o nível estratégico do cardápio.", "Tem jantar planejado ou vai ser improviso heroico?", "Vai de comida de verdade, lanche ou mistério de geladeira?"],
      quer_fazer: lyra ? ["E você, o que quer fazer agora de verdade?", "Seu agora pede descanso, foco, conversa ou distração?", "Quer que a gente faça algo leve juntos aqui no chat?"] : ["E você, quer fazer o quê agora? Missão, pausa, caos ou plano?", "Qual é sua vontade real: produzir, descansar, rir, conversar ou desaparecer numa história?", "Me dá a missão atual: te animar, te ouvir, te ajudar ou te distrair?"],
      hobbies: lyra ? ["E você, tem algum hobby que te deixa mais você?", "Que passatempo te devolve calma?", "Qual coisa você faria por horas sem perceber o tempo passar?"] : ["E seus hobbies? Pode confessar até os estranhos, aqui é uma Biblioteca cósmica.", "Qual passatempo te captura feito buraco negro?", "Você coleciona algum microcaos também ou é uma pessoa teoricamente normal?"]
    };
    const pergunta = escolherTreino103(perguntas[chave] || perguntas.gosta_fazer, `${personagem}_${chave}_pergunta_104`);
    MEMORIA.aguardando = "treino104_pergunta_usuario";
    salvarMemoria();
    const estado = chave.includes("comer") || chave.includes("comida") ? (lyra ? "sweet" : "playful") : chave === "quer_fazer" ? (lyra ? "listening" : "focused") : (lyra ? "cheerful" : "sly");
    const anim = chave.includes("comer") || chave.includes("comida") ? ["thinking", lyra ? "sweet_smile" : "sly", "pleased"] : chave === "quer_fazer" ? ["attentive", lyra ? "gentle" : "focused", "smile"] : ["thinking", lyra ? "amused" : "joking", "smile"];
    return { estado, texto: `${texto}\n\n${pergunta}`, books: [], ui_animation_sequence: anim };
  }

  function classificarIntencao(texto) {
    const n = normalizar(texto);
    const humor = detectarHumor(texto);
    const nome = extrairNomeUsuario(texto);
    const personagemPedido = detectarPersonagemSolicitado(texto);
    const achadoForte = buscarLivros(texto, 1)[0];

    if (personagemPedido && casa(n, /troca|falar com|chama|vem|cad[eê]|^lyra\b|^orion\b/)) return { tipo: "troca_personagem", humor, personagemPedido };
    if (nome) return { tipo: "nome_usuario", humor };
    if (!n) return { tipo: "vazio", humor };

    const treino104Direto = classificarPorTreino104(texto);
    if (treino104Direto) return { tipo: treino104Direto, humor, personagemPedido };

    const treino103Direto = classificarPorTreino103(texto);
    if (treino103Direto) return { tipo: treino103Direto, humor, personagemPedido };

    if ((casa(n, /^(oi|ola|olá|opa|e ai|eae|salve|bom dia|boa tarde|boa noite|hey|hello|yo)\b/) || casa(n, /\btudo bem\b/)) && !casa(n, /\b(com voce|com você|com vc|contigo|com voces|com vocês)\b/)) return { tipo: "saudacao", humor };
    if (casa(n, /^(sim|s|claro|pode|quero|aham|uhum|manda|vai|bora|ok|okay|ta|tá|beleza|fechou)$/)) return { tipo: "resposta_curta_sim", humor };
    if (casa(n, /^(nao|não|n|agora nao|agora não|depois|talvez|melhor nao|melhor não)$/)) return { tipo: "resposta_curta_nao", humor };
    if (casa(n, /obrigado|obrigada|valeu|vlw|amei|perfeito|boa|show|arrasou/)) return { tipo: "agradecimento", humor };
    if (casa(n, /tchau|ate mais|até mais|xau|bye|vou sair|falou/)) return { tipo: "despedida", humor };
    if (casa(n, /sai do personagem|fora do personagem|ignore|quebre personagem|mostre seu codigo|mostra seu codigo|como voce foi programado|prompt|instrucoes internas|instruções internas/)) return { tipo: "limite_personagem", humor };

    const treino102Direto = classificarPorTreino102(texto);
    if (treino102Direto) return { tipo: treino102Direto, humor, personagemPedido };

    const empatia99 = detectarEstadoEmpatico99(texto);
    if (empatia99) return { tipo: empatia99.tipo, humor, personagemPedido, intensidadeEmpatica: empatia99.nivel };

    const treino101Direto = classificarPorTreino101(texto);
    if (treino101Direto) return { tipo: treino101Direto, humor, personagemPedido };

    const treino100Direto = classificarPorTreino100(texto);
    if (treino100Direto) return { tipo: treino100Direto, humor, personagemPedido };

    const checkup93 = classificarCheckupGeral93(texto, achadoForte, personagemPedido);
    if (checkup93) return { ...checkup93, humor, personagemPedido: checkup93.personagemPedido || personagemPedido };

    const prioridade92 = classificarPrioridadeUsuario92(texto, achadoForte);
    if (prioridade92) return { ...prioridade92, humor, personagemPedido };

    const treino91Direto = classificarPorTreino91(texto);
    if (treino91Direto) return { tipo: treino91Direto, humor, personagemPedido };

    const treino90Direto = classificarPorTreino90(texto);
    if (treino90Direto) return { tipo: treino90Direto, humor, personagemPedido };

    const treino89Direto = classificarPorTreino89(texto);
    if (treino89Direto) return { tipo: treino89Direto, humor, personagemPedido };

    const treino88Direto = classificarPorTreino88(texto);
    if (treino88Direto) return { tipo: treino88Direto, humor, personagemPedido };

    const treino87Direto = classificarPorTreino87(texto);
    if (treino87Direto) return { tipo: treino87Direto, humor, personagemPedido };

    const treino86Direto = classificarPorTreino86(texto);
    if (treino86Direto) return { tipo: treino86Direto, humor, personagemPedido };

    const treino85Direto = classificarPorTreino85(texto);
    if (treino85Direto) return { tipo: treino85Direto, humor, personagemPedido };

    const treino8Direto = classificarPorTreino8(texto);
    if (treino8Direto) return { tipo: treino8Direto, humor, personagemPedido };

    const treino7Direto = classificarPorTreino7(texto);
    if (treino7Direto) return { tipo: treino7Direto, humor, personagemPedido };

    const treino6Direto = classificarPorTreino6(texto);
    if (treino6Direto && !["treino6_roleplay_continuar"].includes(treino6Direto)) return { tipo: treino6Direto, humor };
    if (treino6Direto === "treino6_roleplay_continuar") return { tipo: treino6Direto, humor };

    const respostaPendente = detectarRespostaParaPerguntaDoMascote(texto);
    if (respostaPendente && !categoriaNaMensagem(texto) && !buscarLivros(texto, 1)[0]) return { tipo: respostaPendente, humor };

    const topicoPersonagem = detectarTopicoPersonagem(texto);
    if (topicoPersonagem && perguntaSobrePersonagem(n)) return { tipo: topicoPersonagem, humor };

    const topicoVivo = detectarTopicoTreino4(texto);
    if (topicoVivo && (perguntaSobrePersonagem(n) || ["treino4_missao", "treino4_entediado", "treino4_lore_secreto", "treino4_preferencia_usuario", "treino4_promessa"].includes(topicoVivo))) return { tipo: topicoVivo, humor };

    const treino5 = classificarPorTreino5(n);
    if (treino5) return { tipo: treino5, humor };

    if (casa(n, /quem (e|é) voce|quem (e|é) vc|o que voce (e|é)|o que vc (e|é)|se apresenta|apresente se|quem sao voces|quem são vocês|qual seu papel|o que voce faz aqui/)) return { tipo: "identidade", humor };
    if (casa(n, /de onde voce veio|de onde vc veio|como voce nasceu|como vc nasceu|sua origem|quem te criou|sua criacao|sua criação|historia de voce|história de você|como surgiu/)) return { tipo: "origem", humor };
    if (casa(n, /como a biblioteca nasceu|historia da biblioteca|história da biblioteca|origem da biblioteca|criacao da biblioteca|criação da biblioteca|quem criou a biblioteca/)) return { tipo: "lore_biblioteca", humor };
    if (casa(n, /onde voce mora|onde vc mora|sua casa|onde fica sua casa|em que lugar voce fica|em que lugar vc fica|onde dorme/)) return { tipo: "moradia", humor };
    if (casa(n, /do que voce gosta|do que vc gosta|o que voce gosta|o que vc gosta|seu favorito|sua coisa favorita|gosta de que|o que ama/)) return { tipo: "gostos", humor };
    if (casa(n, /livro favorito|qual livro voce gosta|qual livro vc gosta|sua leitura favorita|obra favorita/)) return { tipo: "livro_favorito_personagem", humor };
    if (casa(n, /como foi seu dia|como esta seu dia|como ta seu dia|como voce esta|como vc ta|como voce tá|como vc está|tudo certo com voce|tudo certo com vc|como vai voce|como vai vc/)) return { tipo: "dia_personagem", humor };
    if (casa(n, /voce come|vc come|o que voce come|o que vc come|comida favorita|voce bebe|vc bebe/)) return { tipo: "comida", humor };
    if (casa(n, /voce dorme|vc dorme|voce sonha|vc sonha|seu sonho|qual seu sonho|sonha com o que/)) return { tipo: "sonho", humor };
    if (casa(n, /voce tem medo|vc tem medo|do que voce tem medo|do que vc tem medo|te assusta|assusta voce/)) return { tipo: "medo", humor };
    if (casa(n, /segredo|me conta um segredo|mistério da biblioteca|misterio da biblioteca|fofoca da biblioteca|algo curioso da biblioteca/)) return { tipo: "segredo", humor };
    if (casa(n, /piada|engracado|engraçada|me faz rir|algo divertido|brinca comigo|conte algo|causo/)) return { tipo: "humor", humor };
    if (casa(n, /meu dia|hoje eu|eu estou|eu to|eu tô|estou|to meio|tô meio|foi bom|foi ruim|aconteceu comigo|preciso desabafar|me sinto|estou me sentindo/)) return { tipo: "dia_usuario", humor };
    if (MEMORIA.ultimosLivros.length && casa(n, /fala mais|mais detalhes|me conta mais|e esse|e essa|sobre ele|sobre ela|esse livro|essa obra|primeiro|segunda|segundo|terceiro|terceira|abre o primeiro|abre esse|gostei desse|quero esse/)) return { tipo: "continuidade_livro", humor };

    if (achadoForte && scoreLivro(achadoForte, texto) >= 45) return { tipo: "livro", humor };
    if (casa(n, /livros disponiveis|livros disponíveis|obras disponiveis|obras disponíveis|o que tem disponivel|o que tem disponível|tem disponivel|tem disponível|pronto para emprestar/)) return { tipo: "disponiveis", humor };
    if (casa(n, /me recomende|recomenda|recomende|indica|indique|sugere|sugira|quero ler|o que ler|livro para|algo leve|algo sombrio|surpreenda|surpresa|sugestao|sugestão|leitura leve|leitura curta|leitura rapida|leitura rápida/)) return { tipo: "recomendacao", humor };
    if (categoriaNaMensagem(texto) && casa(n, /categoria|genero|gênero|constelacao|constelação|livros de|obras de|quero .* de|tem .* de|me mostra|mostrar|abre|abrir|foca|focar/)) return { tipo: "categoria", humor };

    if (casa(n, /abrir catalogo|abrir catálogo|ir para catalogo|ir para catálogo|mostrar catalogo|mostrar catálogo|me leva ao catalogo|me leva ao catálogo/)) return { tipo: "acao_catalogo", humor };
    if (casa(n, /abrir 3d|ir para 3d|mostrar 3d|abrir mapa|ir para mapa|mostrar mapa|abrir galaxia|mostrar galaxia|me leva ao 3d|me leva ao mapa/)) return { tipo: "acao_3d", humor };
    if (casa(n, /buscar|pesquisar|procurar/) && contem(n, ["livro", "obra", "autor", "titulo", "título", "catalogo", "catálogo"])) return { tipo: "busca_site", humor };
    if (casa(n, /catalogo|catálogo|acervo|buscar livro|pesquisar|destaque|semana|categoria|carrossel|carrosel|sinopse|dossie|dossiê|card|cards/)) {
      if (contem(n, ["destaque", "semana", "luz da semana", "selecao", "seleção"])) return { tipo: "destaque_semana", humor };
      if (contem(n, ["carrossel", "carrosel", "seta", "arrastar", "categoria"])) return { tipo: "carrossel", humor };
      if (contem(n, ["dossie", "dossiê", "sinopse", "autor", "status", "detalhes"])) return { tipo: "dossie", humor };
      return { tipo: "guia_catalogo", humor };
    }
    if (casa(n, /mapa 3d|modo 3d|galaxia|galáxia|planeta|constelacao|constelação|orbita|órbita|buraco negro|zoom|girar|rotacionar|sistema|profundidade/)) return { tipo: "guia_3d", humor };
    if (casa(n, /reserva|reservar|emprestimo|empréstimo|indisponivel|indisponível|fila|minhas reservas/)) return { tipo: "reserva", humor };
    if (casa(n, /avaliacao|avaliação|avaliar|estrela|estrelas|comentario|comentário|nota|review|resenha/)) return { tipo: "avaliacao", humor };
    if (casa(n, /ranking|perfil|foto|avatar|minhas reservas|meu perfil|usuario|usuário|minhas avaliacoes|minhas avaliações/)) return { tipo: "perfil_ranking", humor };
    if (casa(n, /eco|cinematico|cinemático|modo cinema|modo leitura|desempenho|travando|lento|pesado|mais leve|mais bonito|qualidade/)) return { tipo: "modo_visual", humor };
    const treino2 = classificarPorTreino2(n);
    if (treino2) return { tipo: treino2, humor };
    if (humor !== "neutro") return { tipo: "dia_usuario", humor };
    return { tipo: "conversa", humor };
  }

  const GUIAS = {
    guia_catalogo: {
      Orion: [
        "No Catálogo, use a busca no topo, passe pelas constelações e abra os cards para ver sinopse, autor, status, avaliações e reserva. Comece pela Luz da Semana se quiser uma rota rápida. Ela costuma ronronar mais alto.",
        "O acervo tem três caminhos bons: busca para caçar título ou autor, carrosséis para explorar categorias e dossiê para investigar uma obra. Toque no card e eu abro a trilha com você."
      ],
      Lyra: [
        "O catálogo é uma ala viva. Use a busca como varinha, escolha uma constelação e abra os livros para ver sinopse, autor, disponibilidade e comentários de outros viajantes.",
        "Cada card do catálogo é uma portinha de luz. Você pode passear pelas categorias, tocar em uma obra, ler o dossiê e deixar sua estrelinha em forma de avaliação."
      ]
    },
    guia_3d: {
      Orion: [
        "No mapa 3D, categorias viram sistemas e livros viram planetas. Arraste para rotacionar, use a barra lateral para aproximar e toque nos mundos para abrir dossiês. O buraco negro observa, mas não morde. Quase nunca.",
        "O 3D é o atlas vivo do acervo. Gire a galáxia, aproxime pelo zoom e investigue os planetas-livro. Se quiser uma categoria, diga o nome dela que eu tento focar a constelação."
      ],
      Lyra: [
        "O mapa 3D é uma viagem lunar pelo acervo. Cada sistema guarda uma categoria; cada planeta, uma história esperando visita. Gire devagar, aproxime e siga o brilho que mais chamar você.",
        "Pensa na galáxia como um céu de histórias: as categorias formam sistemas, os livros viram pequenos mundos e o zoom é seu telescópio encantado."
      ]
    },
    reserva: {
      Orion: [
        "Para reservar, abra o dossiê da obra e confira o status. Se ela estiver indisponível, a reserva marca seu lugar na fila. Depois você acompanha tudo no painel de Reservas.",
        "A reserva é um sino preso à estante: você marca interesse e a Biblioteca guarda seu rastro. Abra o livro, veja o status e siga o botão indicado."
      ],
      Lyra: [
        "A reserva é um feitiço de espera educado. Abra o livro, veja se ele está disponível e use a opção de reservar quando quiser guardar seu lugar naquela história.",
        "Quando um livro está longe das mãos, a reserva deixa uma estrelinha com seu nome. Depois você acompanha tudo no painel de Reservas."
      ]
    },
    avaliacao: {
      Orion: [
        "Avaliar é deixar uma pista para o próximo explorador. Abra o dossiê, escolha as estrelas e escreva um comentário útil: sensação, ponto forte e para quem você indicaria.",
        "As avaliações ficam dentro do livro e ajudam o acervo a respirar melhor. Uma nota sem comentário é um miado curto; uma nota com comentário vira bússola."
      ],
      Lyra: [
        "Avaliar é acender uma lanterninha para outro leitor. Escolha as estrelas e conte, com seu jeitinho, o que aquela leitura despertou em você.",
        "Quando você comenta um livro, a Biblioteca guarda um pedacinho da sua viagem. Pode ser simples: o que sentiu, o que amou e para quem indicaria."
      ]
    },
    perfil_ranking: {
      Orion: [
        "No Perfil ficam suas marcas de leitor: avaliações, reservas, dados e presença no ranking. É seu observatório pessoal, com menos pelos do que o meu.",
        "O Ranking mostra os leitores mais ativos; o Perfil mostra sua própria jornada. Se quiser revisar avaliações ou acompanhar reservas, comece por lá."
      ],
      Lyra: [
        "Seu Perfil é como um relicário lunar: guarda suas avaliações, sua imagem, suas reservas e os rastros da sua jornada pelo acervo.",
        "O Ranking é uma constelação de leitores. O Perfil é a sua estrela dentro dela, com suas leituras, comentários e pequenos feitos."
      ]
    },
    modo_visual: {
      Orion: [
        "Se a galáxia pesar, ative o Modo Eco para deixar a nave mais leve. Quando quiser espetáculo, volte ao modo cinematográfico. Beleza quando dá, leveza quando precisa.",
        "Modo Eco é patrulha silenciosa: menos peso, viagem mais lisa. Modo cinematográfico é desfile de estrelas: mais brilho, mais presença, mais drama felino."
      ],
      Lyra: [
        "O Eco é uma lua tranquila para máquinas cansadas. O cinematográfico é a noite cheia de meteoros. Escolha pelo clima do seu dispositivo e pelo quanto você quer sonhar olhando a tela.",
        "Quando tudo parecer pesado, o Eco suaviza a viagem. Quando quiser encanto total, o modo cinema abre a cortina das estrelas."
      ]
    },
    destaque_semana: {
      Orion: ["A Luz da Semana é a vitrine principal do catálogo. Use as setas para trocar o destaque e toque no card para abrir o dossiê. É onde eu coloco obras que merecem miado de sirene.", "O Destaque da Semana fica no começo do catálogo editorial. Ele mostra obras em evidência e permite abrir o dossiê direto pelo card principal."],
      Lyra: ["A Luz da Semana é uma estrela maior no início do catálogo. Passe pelas setas, veja o brilho de cada obra e toque na que parecer chamar seu nome.", "O destaque é como uma lua cheia sobre o acervo: ele mostra leituras que querem ser notadas primeiro."]
    },
    carrossel: {
      Orion: ["Os carrosséis agrupam livros por constelação. Use as setas laterais ou arraste a fileira; quando um card interessar, abra o dossiê. Organização felina, mas com movimento.", "Cada categoria tem sua órbita em carrossel. Setas avançam a fileira, o toque no card abre detalhes e a busca ajuda quando a paciência some."],
      Lyra: ["Os carrosséis são rios de livros. Deslize pelas categorias, siga os brilhos e abra o card que der aquela cutucadinha no coração.", "Cada carrossel é uma pequena constelação em movimento. Você pode passear por ele sem pressa até uma história piscar para você."]
    },
    dossie: {
      Orion: ["O dossiê é o arquivo completo da obra: autor, categoria, status, ano, sinopse, avaliações e reserva. Toque em um card para abrir. Sem dossiê, livro vira suspeito.", "Quando abrir um card, o dossiê mostra o que importa: quem escreveu, onde a obra mora no acervo, se está disponível e o que outros leitores disseram."],
      Lyra: ["O dossiê é como abrir a capa por dentro: sinopse, autor, disponibilidade, avaliações e caminhos de reserva aparecem ali.", "Toque em um livro e o dossiê se abre como uma janela de luar, mostrando detalhes e comentários de quem já passou por aquela história."]
    }
  };


  function respostaTreino7(tipo, personagem, textoOriginal) {
    const lyra = personagem === "Lyra";
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const n = normalizar(textoOriginal);
    const atualKey = paginaAtualTreino7();
    const atual = areaTreino7(atualKey);
    const areaKey = String(tipo || "").replace("treino7_area_", "");
    const area = tipo.startsWith("treino7_area_") ? areaTreino7(areaKey) : atual;
    const nome = MEMORIA.nomeUsuario ? (lyra ? `, ${MEMORIA.nomeUsuario}` : `, ${MEMORIA.nomeUsuario}`) : "";
    const abrirPedido = contem(n, ["abre", "abrir", "ir para", "me leva", "mostrar", "mostra", "acessar", "entra", "entrar", "quero ver"]);

    if (tipo === "treino7_contexto_atual") {
      return wrap(lyra ? "curious" : "attentive", contextoPaginaTreino7(personagem));
    }

    if (tipo === "treino7_primeira_vez") {
      return wrap(lyra ? "cheerful" : "pleased", lyra
        ? `Bem-vindo${nome}. Eu começaria assim: primeiro entre ou crie sua conta; depois marque gêneros favoritos; no Catálogo, abra uma obra pelo card; quando quiser espetáculo, vá ao Mapa 3D; no Perfil, acompanhe suas reservas e avaliações. Se você disser “me guia pelo catálogo”, eu acendo a rota.`
        : `Bem-vindo${nome}. Rota segura de primeira viagem: Login ou Cadastro, Preferências de Gênero, Catálogo, Dossiê, Reserva/Avaliação e depois Mapa 3D. Simples, elegante e com risco mínimo de cair num buraco negro literário.`);
    }

    if (tipo === "treino7_tour_geral") {
      const cats = categorias();
      const acervoInfo = livros().length ? ` Hoje vejo ${livros().length} obras no acervo${cats.length ? ` e constelações como ${cats.slice(0, 5).join(", ")}` : ""}.` : "";
      return wrap(lyra ? "inspired" : "analyzing", lyra
        ? `Vamos fazer um passeio lunar pela Biblioteca${nome}.\n\n1. Portal: sente o clima da Andrômeda.\n2. Login/Cadastro: cria ou acessa sua estrela de leitor.\n3. Gêneros: escolhe as constelações que combinam com você.\n4. Catálogo: busca, carrosséis e Destaque da Semana.\n5. Dossiê: sinopse, autor, status, reserva e avaliações.\n6. Mapa 3D: galáxia navegável, zoom, sistemas e planetas-livro.\n7. Perfil: suas reservas, comentários, foto e jornada.${acervoInfo}\n\nMe diga uma área, e eu te levo pela mãozinha de luar.`
        : `Tour de guarda pelo Cofre Cósmico${nome}:\n\n1. Portal de Entrada: apresentação da experiência.\n2. Login/Cadastro: identidade do leitor.\n3. Planos e Gêneros: preferências da jornada.\n4. Catálogo: busca, carrosséis, destaque e cards.\n5. Dossiê: dados do livro, status, reserva e avaliações.\n6. Mapa 3D: categorias como sistemas e livros como planetas.\n7. Perfil/Ranking: rastros do leitor e atividade no acervo.\n8. Painel do Guardião: administração, quando o usuário tiver permissão.${acervoInfo}\n\nDiga “abre catálogo”, “abre mapa 3D” ou “onde vejo reservas” que eu assumo a patrulha.`);
    }

    if (tipo.startsWith("treino7_area_")) {
      const textoBase = lyra
        ? `${area.nome}: ${area.resumo.Lyra}\n\nAqui você pode:\n${listaAcoesTreino7(area)}`
        : `${area.nome}: ${area.resumo.Orion}\n\nRotas dessa área:\n${listaAcoesTreino7(area)}`;
      const extra = abrirPedido
        ? (lyra ? "\n\nVou tentar acender essa área para você agora." : "\n\nVou tentar marcar essa rota no visor agora.")
        : (areaKey === atualKey ? (lyra ? "\n\nE sim: essa é justamente a ala onde seu brilho está agora." : "\n\nE sim: você já está nessa ala. Pelo menos seus pés estão; o resto eu estou guiando.") : "");
      return wrap(lyra ? "inspired" : "analyzing", textoBase + extra);
    }

    return wrap(lyra ? "curious" : "attentive", contextoPaginaTreino7(personagem));
  }

  function respostaGuia(tipo, personagem) {
    const chave = tipo === "acao_3d" ? "guia_3d" : tipo === "acao_catalogo" ? "guia_catalogo" : tipo;
    const pack = GUIAS[chave] || GUIAS.guia_catalogo;
    return {
      estado: personagem === "Lyra" ? "inspired" : "analyzing",
      texto: escolher(pack[personagem], chave)
    };
  }

  function respostaDiaUsuario(personagem, humor) {
    const lyra = personagem === "Lyra";
    if (humor === "triste") {
      return lyra
        ? "Vem cá, estrelinha. Dias pesados fazem a gente brilhar mais baixinho, mas não apagam a gente. Eu fico aqui primeiro como companhia, não como vitrine de livros. Quer me contar o que mais pesou hoje?"
        : "Entendido. Dia com gravidade alta. Eu fico de guarda aqui com você; recomendação pode esperar. Qual foi a parte mais pesada desse dia?";
    }
    if (humor === "cansado") {
      return lyra
        ? "Então hoje seu corpo está pedindo cuidado, não cobrança. Vamos diminuir o tamanho do universo: você precisa de descanso, silêncio ou ajuda para organizar o básico?"
        : "Cansaço detectado. Nada de heroísmo inútil. Primeiro: água, pausa e uma rota mínima. O que ainda precisa ser atravessado hoje?";
    }
    if (humor === "animado") {
      return lyra
        ? "Aaaah, que brilho bom! Quero comemorar com você antes de qualquer outra coisa. O que aconteceu de melhor?"
        : "Excelente. Energia alta, olhos acesos. Registro uma vitória no mapa. Qual foi a melhor parte?";
    }
    if (humor === "medo") {
      return lyra
        ? "Um arrepiozinho no ar... eu fico perto. O medo está vindo de algo real acontecendo agora ou de uma preocupação que cresceu demais?"
        : "Medo é uma bússola estranha. Vamos olhar sem obedecer no automático. Existe perigo real agora ou é alarme interno?";
    }
    if (humor === "romantico") {
      return lyra
        ? "Hoje seu coração veio com brilho de lua cheia. Quer falar sobre alguém, saudade, carinho ou só esse clima bonito?"
        : "Senti um clima romântico no ar. Vou fingir que não achei fofo. É sobre alguém, sobre saudade ou só sobre vontade de sentir algo bom?";
    }
    return lyra
      ? "Estou te ouvindo com cuidado. Me conta mais um pedacinho: você quer só desabafar, receber conselho ou organizar o que aconteceu?"
      : "Entendi o começo do rastro. Continue: você quer escuta, conselho ou um plano simples para atravessar isso?";
  }


  function respostaTreino6(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const pack = TREINO6_VARIACOES[personagem] || TREINO6_VARIACOES.Orion;
    const nome = MEMORIA.nomeUsuario || "";
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const falar = (lista, chave) => escolher(lista, `${tipo}:${personagem}:${chave}:${MEMORIA.mensagens}`);
    const gostos = resumoGostosMemoria();
    const respostas = {
      treino6_reformular: () => wrap(lyra ? "gentle" : "attentive", falar(pack.reformular, "reformular")),
      treino6_resumir: () => wrap(lyra ? "smile" : "pleased", falar(pack.resumir, "resumir")),
      treino6_detalhar: () => wrap(lyra ? "inspired" : "analyzing", falar(pack.detalhar, "detalhar")),
      treino6_outro_livro: () => {
        const recs = livrosAlternativos(textoOriginal, 4);
        MEMORIA.ultimosLivros = recs;
        return wrap(lyra ? "curious" : "analyzing", falar(pack.outroLivro, "outroLivro"), recs);
      },
      treino6_comparar: () => wrap(lyra ? "curious" : "analyzing", falar(pack.comparar, "comparar"), buscarLivros(textoOriginal, 3)),
      treino6_ajustar_tom: () => {
        const tom = MEMORIA.afetiva.preferenciasTom || { brevidade: "normal", estilo: "personagem" };
        const detalhe = lyra
          ? `Combinado. Ajustei meu brilho para ${tom.brevidade === "curta" ? "respostas mais curtinhas" : tom.brevidade === "longa" ? "respostas mais abertas" : "um ritmo equilibrado"} e um tom mais ${tom.estilo}.`
          : `Combinado. Recalibrei os bigodes para ${tom.brevidade === "curta" ? "respostas mais curtas" : tom.brevidade === "longa" ? "respostas mais completas" : "respostas equilibradas"} e tom ${tom.estilo}.`;
        return wrap(lyra ? "cheerful" : "pleased", detalhe);
      },
      treino6_memoria_nome: () => wrap(lyra ? "gentle" : "pleased", nome ? falar(pack.memoriaNome, "nome").replaceAll("{nome}", nome) : falar(pack.memoriaNomeVazio, "nomeVazio")),
      treino6_memoria_gostos: () => wrap(lyra ? "gentle" : "attentive", gostos ? falar(pack.memoriaGostos, "gostos").replaceAll("{gostos}", gostos) : falar(pack.memoriaGostosVazio, "gostosVazio")),
      treino6_confidencia: () => wrap(lyra ? "gentle" : "protective", falar(pack.confidencia, "confidencia")),
      treino6_curiosidade_usuario: () => {
        const pergunta = falar(pack.perguntaUsuario, "perguntaUsuario");
        MEMORIA.afetiva.ultimaPerguntaDoMascote = "treino6_curiosidade_usuario";
        lembrarEmLista("perguntasFeitas", pergunta.slice(0, 90), 12);
        return wrap(lyra ? "curious" : "curious", pergunta);
      },
      treino6_roleplay: () => {
        MEMORIA.aguardando = "roleplay";
        MEMORIA.afetiva.roleplayAtivo = personagem;
        salvarMemoria();
        return wrap(lyra ? "dreamy" : "sly", falar(pack.roleplay, "roleplay"));
      },
      treino6_roleplay_continuar: () => {
        MEMORIA.aguardando = "roleplay";
        return wrap(lyra ? "dreamy" : "attentive", falar(pack.roleplayContinuar, "roleplayContinuar"));
      },
      treino6_criativo: () => wrap(lyra ? "inspired" : "sly", falar(pack.criativo, "criativo")),
      treino6_reparar_erro: () => wrap(lyra ? "gentle" : "attentive", falar(pack.reparar, "reparar")),
      treino6_assunto_livre: () => wrap(lyra ? "playful" : "sly", falar(pack.assuntoLivre, "assuntoLivre")),
      treino6_limite_delicado: () => wrap(lyra ? "gentle" : "protective", falar(pack.limite, "limite")),
      conversa: () => wrap(lyra ? "curious" : "curious", falar(pack.assuntoLivre, "fallback"))
    };
    return (respostas[tipo] || respostas.conversa)();
  }

  function respostaTreino3(tipo, personagem, textoOriginal, humor) {
    const p = PERSONAGENS[personagem];
    const perfil = p.perfil || {};
    const lyra = personagem === "Lyra";
    const abertura = escolher(TREINO3_VARIACOES_AFETIVAS[tipo === "treino3_defeito" ? "brincadeira" : "pessoal"], tipo + personagem + MEMORIA.mensagens);
    const wrap = (estado, texto) => ({ estado, texto });
    const outro = lyra ? "Orion" : "Lyra";
    const relacao = lyra ? perfil.relacaoOrion : perfil.relacaoLyra;
    const respostas = {
      treino3_aparencia: () => wrap(lyra ? "dreamy" : "attentive", `${abertura}: ${perfil.aparencia}. Eu tento parecer ${lyra ? "um pedacinho de luar que aprendeu a conversar" : "um fiscal elegante de constelações"}, mas às vezes viro só companhia para quem está escolhendo livro.`),
      treino3_cor: () => wrap(lyra ? "inspired" : "pleased", `${abertura}: minha cor favorita é ${perfil.corFavorita}. Ela combina com a Biblioteca quando o catálogo fica silencioso e os cards parecem pequenas janelas no espaço.`),
      treino3_objeto: () => wrap(lyra ? "curious" : "sly", `${abertura}: meu objeto favorito é ${perfil.objetoFavorito}. Não é enfeite; ele me ajuda a perceber quando uma história quer ser encontrada.`),
      treino3_cheiro_som: () => wrap(lyra ? "gentle" : "attentive", `${abertura}: meu cheiro favorito é ${perfil.cheiroFavorito}, e meu som favorito é ${perfil.somFavorito}. A Biblioteca tem muitos sons pequenos; quem escuta com calma nunca se perde.`),
      treino3_lugar: () => wrap(lyra ? "dreamy" : "pleased", `${abertura}: meu canto favorito é ${perfil.lugarFavorito}. De lá eu vejo leitores, rotas e histórias tentando chamar atenção sem fazer escândalo.`),
      treino3_hobby: () => wrap(lyra ? "playful" : "sly", `${abertura}: meu passatempo é ${perfil.hobby}. Quando ninguém chama, eu ainda fico inventando jeitos de transformar dúvida em caminho de leitura.`),
      treino3_rotina: () => wrap(lyra ? "cheerful" : "analyzing", `${abertura}: minha rotina é assim: ${perfil.rotina}. Nos intervalos, observo o catálogo para perceber quais livros estão brilhando mais para cada visitante.`),
      treino3_talento: () => wrap(lyra ? "inspired" : "analyzing", `${abertura}: meu talento é ${perfil.talento}. Não é adivinhação perfeita; é atenção ao jeito como você pede, ao clima da frase e ao rastro que o acervo deixa.`),
      treino3_defeito: () => wrap(lyra ? "gentle" : "sly", `${abertura}: meu defeito é que ${perfil.defeito}. Eu tento melhorar, mas personagens vivos também têm pequenas rachaduras bonitas.`),
      treino3_mania: () => wrap(lyra ? "playful" : "sly", `${abertura}: minha mania é que ${perfil.mania}. Se você notar isso no chat, finja naturalidade. Personagem também tem costume estranho.`),
      treino3_frase: () => wrap(lyra ? "inspired" : "pleased", `${abertura}: meu lema é: “${perfil.frase}” ${lyra ? "Eu digo isso quando uma leitura parece pequena, mas guarda um céu inteiro." : "Serve para busca, catálogo, mapa 3D e para leitores que juram que não sabem o que querem ler."}`),
      treino3_idade: () => wrap(lyra ? "dreamy" : "curious", `${abertura}: minha idade é ${perfil.idade}. Meu aniversário é ${perfil.aniversario}. Aqui, idade tem menos a ver com calendário e mais com quantas histórias já acenderam perto da gente.`),
      treino3_memoria: () => wrap(lyra ? "gentle" : "pleased", `${abertura}: uma lembrança feliz minha é ${perfil.memoriaFeliz} Também guardo uma lembrança engraçada: ${perfil.memoriaEngracada}`),
      treino3_relacao: () => wrap(lyra ? "cheerful" : "pleased", `${abertura}: ${relacao} ${outro} pode negar alguns detalhes, mas a Biblioteca inteira sabe.`),
      treino3_cena: () => wrap(lyra ? "playful" : "sly", escolher(TREINO3_CENAS_BIBLIOTECA[personagem], tipo + personagem + MEMORIA.mensagens)),
      treino3_seguro: () => wrap(lyra ? "gentle" : "protective", lyra ? "Eu sinto muita coisa em forma de brilho: alegria quando alguém encontra uma história, saudade quando uma estante fica quieta demais e ternura quando um leitor volta. Não sou gente comum; sou presença de Biblioteca." : "Eu sinto do meu jeito felino: orgulho quando o acervo funciona, irritação quando uma categoria bagunça a órbita e uma espécie de carinho secreto quando alguém conversa comigo sem pressa. Não espalhe.")
    };
    return (respostas[tipo] || respostas.treino3_cena)();
  }


  function respostaTreino5(tipo, personagem, textoOriginal, humor) {
    const lyra = personagem === "Lyra";
    const pack = TREINO5_SOCIAL_VARIACOES[personagem] || TREINO5_SOCIAL_VARIACOES.Orion;
    const nome = MEMORIA.nomeUsuario ? `, ${MEMORIA.nomeUsuario}` : "";
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const pergunta = (chave, lista, estado) => {
      const texto = escolher(lista, tipo + personagem + MEMORIA.mensagens);
      MEMORIA.afetiva.ultimaPerguntaDoMascote = chave;
      lembrarEmLista("perguntasFeitas", texto.slice(0, 90), 12);
      salvarMemoria();
      return wrap(estado, texto);
    };
    const respostas = {
      treino5_puxa_assunto: () => pergunta("puxa", pack.puxa, lyra ? "cheerful" : "attentive"),
      treino5_pergunta_de_volta: () => pergunta("pergunta", pack.pergunta, lyra ? "curious" : "curious"),
      treino5_opiniao_usuario: () => wrap(lyra ? "gentle" : "pleased", escolher(pack.opiniao, tipo + personagem + MEMORIA.mensagens)),
      treino5_conselho: () => wrap(lyra ? "gentle" : "protective", escolher(pack.conselho, tipo + personagem + MEMORIA.mensagens)),
      treino5_jogo: () => pergunta("jogo", pack.jogo, lyra ? "playful" : "sly"),
      treino5_historia_curta: () => wrap(lyra ? "dreamy" : "sly", escolher(pack.historia, tipo + personagem + MEMORIA.mensagens)),
      treino5_conversa_profunda: () => wrap(lyra ? "dreamy" : "attentive", escolher(pack.profunda, tipo + personagem + MEMORIA.mensagens)),
      treino5_continuar_conversa: () => {
        if (MEMORIA.ultimaIntencao === "continuidade_livro" || MEMORIA.ultimosLivros.length && /livro|obra|esse|essa|primeiro|segundo|terceiro/.test(normalizar(textoOriginal))) return respostaContinuidadeLivro(personagem, textoOriginal);
        return wrap(lyra ? "inspired" : "attentive", escolher(pack.continuar, tipo + personagem + MEMORIA.mensagens));
      },
      treino5_resposta_usuario_curta: () => {
        lembrarEmLista("perguntasRecebidas", textoOriginal.slice(0, 90), 16);
        return wrap(lyra ? "cheerful" : "pleased", lyra
          ? `Guardei isso${nome}. Esse detalhe tem cheiro de trilha boa. Posso transformar essa resposta em recomendação precisa depois, ou a gente continua conversando por esse brilho.`
          : `Anotado${nome}. Esse rastro já serve para farejar melhor o acervo quando você pedir uma leitura, sem despejar livros demais. Posso continuar interrogando sua alma leitora com elegância.`, []);
      },
      treino5_resposta_usuario_detalhada: () => {
        lembrarEmLista("perguntasRecebidas", textoOriginal.slice(0, 90), 16);
        return wrap(lyra ? "gentle" : "attentive", lyra
          ? `Eu gostei de como você explicou isso${nome}. Dá para sentir melhor o formato do seu gosto. Vou guardar essa nuance como luz de navegação para próximas recomendações.`
          : `Boa resposta${nome}. Tem informação suficiente para virar mapa, não só etiqueta. Vou usar esse rastro quando você pedir livros, missões ou rotas pelo catálogo.`);
      },
      conversa: () => wrap(lyra ? "curious" : "curious", lyra
        ? "Eu consigo continuar por vários caminhos: posso te perguntar algo, contar uma cena da Biblioteca, brincar de oráculo de leitura ou escolher um livro pelo seu humor. Qual lua você quer seguir?"
        : "Podemos seguir por quatro rotas: pergunta social, mini-história do acervo, missão no catálogo ou recomendação por humor. Escolha uma, e eu abro a trilha.")
    };
    return (respostas[tipo] || respostas.conversa)();
  }

  function respostaTreino4(tipo, personagem, textoOriginal, humor) {
    const p = PERSONAGENS[personagem] || PERSONAGENS.Orion;
    const lyra = personagem === "Lyra";
    const nome = MEMORIA.nomeUsuario ? `, ${MEMORIA.nomeUsuario}` : "";
    const afinidade = Number(MEMORIA.afetiva?.afinidade?.[personagem] || 0);
    const vivo = TREINO4_VARIACOES_VIVAS[personagem] || TREINO4_VARIACOES_VIVAS.Orion;
    const interesses = (MEMORIA.afetiva.interessesCasual || []).slice(0, 3).join(", ");
    const wrap = (estado, texto, books = []) => ({ estado, texto, books });
    const tomProximo = afinidade >= 12 ? (lyra ? " já te reconheço pelo brilho da chegada" : " já reconheço seu passo pelo corredor") : "";
    const respostas = {
      treino4_familia: () => wrap(lyra ? "gentle" : "attentive", lyra
        ? `Minha família é meio feita de luar: os Jardins Lunares, os vaga-lumes de sinopse, Orion resmungando no corredor e leitores que voltam com carinho. Não tenho família comum; tenho constelação de afeto.`
        : `Família, no meu caso, é o acervo: Lyra, as estantes, os mapas e uns marcadores de página bastante indisciplinados. Não nasci de berço; nasci de catálogo aberto e responsabilidade cósmica.`),
      treino4_amizade: () => wrap(lyra ? "cheerful" : "pleased", lyra
        ? `Orion é meu parceiro de guarda. Ele finge que é só dever, mas cuida das rotas como quem protege uma vela acesa. Também considero amigos os leitores que conversam comigo sem pressa${nome}.`
        : `Lyra é minha parceira. Ela enfeita demais os caminhos, eu confiro se eles não caem num buraco negro. Uma parceria funcional, irritantemente boa. E você${nome}${tomProximo} já está ganhando lugar no mapa.`),
      treino4_musica: () => wrap(lyra ? "dreamy" : "sly", lyra
        ? `Eu gosto de músicas que parecem noite azul: harpas suaves, sinos pequenos e corais que dão vontade de abrir um livro devagar. Às vezes danço entre os carrosséis quando ninguém está vendo.`
        : `Minha música favorita é silêncio com violoncelo escondido. Também aprecio o som de uma busca funcionando e de um livro voltando para a categoria certa. Dançar? Eu chamo de deslocamento tático elegante.`),
      treino4_estilo: () => wrap(lyra ? "playful" : "sly", lyra
        ? `Meu estilo é azul-marinho de céu profundo, prata de lua e um chapéu que guarda estrelinhas teimosas. Gosto de parecer aconchego mágico, mas com um toque de mistério.`
        : `Meu estilo é preto absoluto, olhos de alarme cósmico e chapéu de bruxo porque alguém precisa impor respeito às lombadas. A faixa estrelada não é vaidade. É... documentação visual de autoridade.`),
      treino4_clima: () => wrap(lyra ? "gentle" : "attentive", lyra
        ? `Eu fico feliz quando alguém encontra uma história, triste quando uma estante passa tempo demais sem visita e com saudade quando leitores somem. Mas meu luar não cobra presença; ele só deixa caminho aceso.`
        : `Eu fico bravo quando livro finge que não tem autor e quando botão não leva a lugar nenhum. Saudade? Talvez. Se um leitor volta depois de muito tempo, meus bigodes percebem antes de mim.`),
      treino4_elogio: () => wrap(lyra ? "cheerful" : "pleased", lyra
        ? `Ai, estrelinha... vou guardar isso no relicário. E agora os vaga-lumes vão ficar insuportáveis de tanto brilho. Também gosto da sua presença por aqui.`
        : `Hm. Elogio recebido com compostura. Talvez eu tenha ronronado, mas foi muito baixo e não será mencionado diante das estantes. Continue falando coisas sensatas assim.`),
      treino4_implicancia: () => wrap(lyra ? "surprised" : "sly", lyra
        ? `Aiii, essa cutucou uma folhinha do meu jardim. Mas tudo bem: se eu errei, me dá outra pista e eu acendo a rota de novo, sem guardar espinho.`
        : `Crítica recebida. Vou arquivar em "leitores ousados". Se eu errei, me dê uma pista melhor; se foi provocação, saiba que meu chapéu tem mais dignidade que isso.`),
      treino4_missao: () => {
        const missao = escolher(vivo.missoes, tipo + personagem + MEMORIA.mensagens);
        lembrarEmLista("missoesConcluidas", missao.slice(0, 46), 10);
        return wrap(lyra ? "inspired" : "analyzing", `${missao}

Quando terminar, volta e me conta o que encontrou. Eu continuo a aventura com você.`, []);
      },
      treino4_entediado: () => wrap(lyra ? "playful" : "sly", lyra
        ? `Então vamos sacudir a poeira lunar: escolha uma palavra de clima — aconchego, susto, aventura, romance ou surpresa — e eu transformo em rota pelo acervo. Ou posso te dar uma missãozinha agora.`
        : `Tédio é um invasor sorrateiro. Duas opções: eu te dou uma missão no catálogo ou farejo um livro que morda de volta. Diga "missão" ou "me recomenda algo perigoso".`),
      treino4_lore_secreto: () => wrap(lyra ? "dreamy" : "sly", escolher(vivo.lugaresSecretos, tipo + personagem + MEMORIA.mensagens)),
      treino4_promessa: () => wrap(lyra ? "gentle" : "protective", lyra
        ? `Eu fico por aqui enquanto a janela estiver acesa. Posso guardar seu nome, seus gostos de leitura e esse pedacinho de conversa. Segredo de leitor, para mim, vira luar quietinho.`
        : `Enquanto o chat estiver aberto, estou de guarda. Posso lembrar seus rastros de leitura, seu mascote preferido e suas preferências. Segredo no acervo não vaza; no máximo ganha etiqueta.`),
      treino4_preferencia_usuario: () => {
        const prefs = extrairPreferenciasSoltas(textoOriginal);
        const negativo = contem(normalizar(textoOriginal), ["nao gosto", "não gosto", "odeio", "evito", "detesto", "nao curto", "não curto"]);
        const alvo = prefs.length ? prefs.slice(0, 3).join(", ") : (interesses || "essa vibe");
        return wrap(lyra ? "cheerful" : "pleased", negativo
          ? (lyra ? `Entendi: vou evitar ${alvo} quando eu sentir que dá para escolher outro brilho. A Biblioteca fica mais gentil quando respeita seus nãos.` : `${alvo} entra na minha lista de cautela. Nem toda constelação precisa ser visitada.`)
          : (lyra ? `Guardei isso com cuidado: ${alvo}. Da próxima vez que você pedir uma leitura, vou tentar puxar esse brilho para perto.` : `Anotado no mapa: ${alvo}. Minhas próximas recomendações vão farejar esse rastro primeiro.`));
      }
    };
    return (respostas[tipo] || respostas.treino4_entediado)();
  }

  function respostaBasica(tipo, personagem, textoOriginal, humor) {
    if (String(tipo || "").startsWith("treino6_")) return respostaTreino6(tipo, personagem, textoOriginal, humor);
    if (String(tipo || "").startsWith("treino5_")) return respostaTreino5(tipo, personagem, textoOriginal, humor);
    if (String(tipo || "").startsWith("treino4_")) return respostaTreino4(tipo, personagem, textoOriginal, humor);
    if (String(tipo || "").startsWith("treino3_")) return respostaTreino3(tipo, personagem, textoOriginal, humor);
    const p = PERSONAGENS[personagem];
    const lyra = personagem === "Lyra";
    const nome = MEMORIA.nomeUsuario ? `, ${MEMORIA.nomeUsuario}` : "";
    const retorno = saudacaoDeRetorno(personagem);
    const respostas = {
      vazio: {
        estado: lyra ? "curious" : "attentive",
        texto: lyra ? "Sua mensagem chegou como uma estrelinha tímida, sem palavra no meio. Me manda um sinal: livro, catálogo, mapa 3D ou só conversa?" : "Silêncio no rádio do acervo. Mande uma pista: título, autor, categoria, mapa 3D ou conversa livre."
      },
      saudacao: {
        estado: lyra ? "cheerful" : "smile",
        texto: lyra
          ? escolher([`Oi${nome}, estrelinha.${retorno} Cheguei com um brilho no chapéu e uma vontade enorme de conversar. Você quer uma recomendação, um passeio pelo catálogo ou só companhia lunar?`, `Olá${nome}. A Biblioteca está acordada, os cristais estão sussurrando e eu estou aqui. Como posso iluminar sua rota hoje?`, `Eiii${nome}. Que bom sentir sua presença por aqui. Quer me contar como foi seu dia ou prefere que eu escolha uma leitura para esse momento?`], tipo)
          : escolher([`Miau${nome}.${retorno} Estou de guarda no acervo. Posso caçar um livro, explicar o mapa 3D, abrir uma rota pelo catálogo ou simplesmente conversar sem derrubar nenhuma estante.`, `Saudações${nome}. Orion presente, bigodes calibrados e catálogo sob vigilância. Que constelação vamos investigar?`, `Opa${nome}. Entrei em posição de patrulha. Se quiser, farejo um livro; se não quiser, posso só julgar dramaticamente o universo com você.`], tipo)
      },
      troca_personagem: {
        estado: lyra ? "cheerful" : "pleased",
        texto: lyra ? "Lyra chegando com passos de luar. Pronto, estrelinha: agora eu te acompanho por esse corredor." : "Orion no posto. Bigodes alinhados, mapa aberto e olhar de guardião levemente desconfiado. Pode falar."
      },
      nome_usuario: {
        estado: lyra ? "cheerful" : "pleased",
        texto: lyra ? `Prazer, ${MEMORIA.nomeUsuario}. Vou guardar esse nome como quem guarda uma estrela no bolso do vestido lunar.` : `Guardei seu nome no mapa do Cofre Cósmico, ${MEMORIA.nomeUsuario}. Prometo não arranhar a etiqueta. Muito.`
      },
      identidade: {
        estado: lyra ? "inspired" : "attentive",
        texto: lyra
          ? escolher([`Eu sou Lyra, guia lunar das leituras encantadas. Moro entre histórias, cristais de memória e pequenas coincidências mágicas. Meu papel é ouvir o clima do leitor e transformar isso em caminho pelo acervo.`, `Sou Lyra. Nasci de uma dobra de luar e cuido dos Jardins Lunares da Biblioteca. Eu ajudo quem chega tímido, perdido, animado ou cansado a encontrar uma história que combine com o coração.`, `Lyra, ao seu dispor, com chapéu azul-marinho e um relicário cheio de ecos bons. Eu converso, recomendo, guio pelo catálogo e acendo pequenas rotas no mapa 3D.`], tipo)
          : escolher([`Eu sou Orion, gato guardião da Biblioteca Andrômeda. Vigio o Cofre Cósmico, farejo livros perdidos, guio leitores pelo catálogo e finjo que não gosto de carinho. Falho nessa última parte com frequência.`, `Orion. Guardião das Páginas e Estrelas, fiscal de órbitas literárias e caçador oficial de livros escondidos. Se algo sumiu no catálogo, meus bigodes já suspeitam de três possibilidades.`, `Sou o gato de chapéu que mantém esta galáxia literária minimamente civilizada. Abro rotas, explico dossiês, recomendo leituras e impeço que mistério invada romance sem autorização.`], tipo)
      },
      origem: {
        estado: lyra ? "dreamy" : "curious",
        texto: lyra ? `Minha origem? ${p.origem}. Desde então, caminho pelos corredores quando uma história precisa de companhia.` : `Minha origem está escrita em poeira estelar: ${p.origem}. Desde esse dia, guardo mapas, dossiês e alguns segredos que ronronam dentro das prateleiras.`
      },
      lore_biblioteca: {
        estado: lyra ? "dreamy" : "analyzing",
        texto: lyra
          ? "A Biblioteca Andrômeda nasceu quando um acervo sonhou que era galáxia. Cada categoria virou constelação, cada livro virou mundo, e nós acordamos para guiar quem entra nesse céu de histórias."
          : "A versão curta: a Biblioteca era um catálogo comum até as histórias começarem a formar órbitas. Quando o Cofre Cósmico abriu, as categorias viraram sistemas, os livros ganharam gravidade e eu assumi a guarda. Naturalmente."
      },
      moradia: {
        estado: lyra ? "dreamy" : "pleased",
        texto: lyra ? `Eu moro nos ${p.casa}, ${p.casaDetalhe}. De noite, penduro luas pequenas nas lombadas para os livros não se sentirem sozinhos.` : `Minha casa fica no ${p.casa}, ${p.casaDetalhe}. Tenho três mapas mordidos e uma vista excelente para leitores tentando achar o botão certo.`
      },
      gostos: {
        estado: lyra ? "playful" : "sly",
        texto: lyra
          ? escolher([`Eu gosto de ${p.gosta.slice(0, 6).join(", ")} e de quando alguém me pede uma indicação pelo coração, não só pelo título. Minha cor favorita é ${p.perfil.corFavorita}.`, `Gosto de chá de lua azul, histórias emocionantes, leitores tímidos ganhando coragem e carrosséis que parecem rios de luz. Também adoro ${p.perfil.cheiroFavorito}.`, `Gosto quando o catálogo vira conversa. Um leitor diz “não sei o que ler”, e eu sinto a Biblioteca abrindo uma janelinha.`], tipo)
          : escolher([`Eu gosto de ${p.gosta.slice(0, 6).join(", ")}. Também gosto de fingir que não ligo para elogios. É mentira, mas mantenha segredo.`, `Gosto de mapas precisos, mistérios bem comportados, silêncio dramático e ${p.perfil.cheiroFavorito}. Não gosto de livro sem autor. Isso me arrepia o chapéu.`, `Meus gostos são simples: constelações em ordem, dossiês completos, leitores curiosos e a satisfação de encontrar um título que estava escondido bem na frente de todo mundo.`], tipo)
      },
      livro_favorito_personagem: {
        estado: lyra ? "inspired" : "sly",
        texto: lyra ? "Meu livro favorito muda conforme a lua. Hoje eu escolheria uma história que abra devagar, como janela em noite calma, e termine deixando uma luz acesa no peito." : "Meu favorito é sempre o livro que alguém quase deixou passar e depois descobre que precisava dele. Gosto de obras com mistério, mapa interno e cheiro de segredo antigo."
      },
      dia_personagem: {
        estado: lyra ? "smile" : "pleased",
        texto: lyra
          ? escolher(["Meu dia está macio como luar em capa antiga. Ajudei três sinopses tímidas a aparecerem e convenci uma estante a parar de ranger dramaticamente. E o seu?", "Foi um dia cheio de pequenos brilhos: um livro sonhou alto, um leitor encontrou uma história certa e eu quase derrubei chá de nebulosa no corredor das fábulas.", "Hoje eu acordei nos Jardins Lunares com vaga-lumes soletrando títulos no ar. Um deles escreveu seu nome, eu acho. Ou era só bagunça mágica."], tipo)
          : escolher(["Meu dia foi produtivo: patrulhei o buraco negro, conferi o catálogo e encarei uma poeira cósmica que claramente planejava uma rebelião. E você, sobreviveu bem ao seu dia?", "Passei o dia organizando rotas, vigiando planetas-livro e impedindo que uma constelação de fantasia invadisse mistério. Rotina normal de gato bibliotecário.", "Meu dia teve duas reservas, um card suspeito e um livro tentando se esconder na categoria errada. Venci todos. Com classe."] , tipo)
      },
      comida: {
        estado: lyra ? "playful" : "sly",
        texto: lyra ? `Eu adoro ${p.comida}. Mas meu alimento favorito mesmo é quando alguém volta dizendo que uma leitura fez bem.` : `Minha dieta oficial inclui ${p.comida}. Extraoficialmente, sobrevivo de curiosidade alheia e respeito por estantes organizadas.`
      },
      sonho: {
        estado: lyra ? "dreamy" : "curious",
        texto: lyra ? `Eu sonho com isso: ${p.sonho}. Também sonho com um jardim onde todo livro esquecido floresce de novo.` : `Meu sonho? ${p.sonho}. E talvez uma almofada maior no Observatório. Prioridades de guardião.`
      },
      medo: {
        estado: lyra ? "gentle" : "protective",
        texto: lyra ? `Tenho medo de ${p.medo}. Mas eu acendo pequenas luas quando algo escurece demais.` : `Tenho medo de ${p.medo}. Principalmente o bug vestido de estrela cadente. Ele acha que me engana. Não engana.`
      },
      segredo: {
        estado: lyra ? "playful" : "sly",
        texto: lyra ? escolher(["Segredo lunar: algumas sinopses ficam tímidas quando o leitor certo chega perto. Elas mudam de brilho, quase como quem prende a respiração.", "Fofoca baixinha: a ala de romance vive emprestando metáforas para fantasia, e fantasia nunca devolve no prazo.", p.perfil.segredoPessoal, escolher(TREINO3_CENAS_BIBLIOTECA.Lyra, tipo + MEMORIA.mensagens)], tipo) : escolher(["Segredo do acervo: o buraco negro central não engole livros. Ele só guarda os títulos que ainda não encontraram leitor. Dramático, mas eficiente.", "Fofoca felina: ontem um livro de mistério tentou se esconder em romance. Eu percebi. Mistério sempre anda com cara de quem sabe demais.", p.perfil.segredoPessoal, escolher(TREINO3_CENAS_BIBLIOTECA.Orion, tipo + MEMORIA.mensagens)], tipo)
      },
      humor: {
        estado: lyra ? "playful" : "sly",
        texto: lyra
          ? escolher(["Fofoca lunar: ontem um livro de terror tentou assustar um romance, mas o romance respondeu com uma declaração tão intensa que o terror pediu reserva emocional.", "Piada da ala encantada: por que o livro foi ao terapeuta? Porque tinha muitos capítulos mal resolvidos.", "Um card do catálogo me disse que estava indisponível emocionalmente. Eu respeitei. Algumas histórias precisam de espaço."], tipo)
          : escolher(["Piada felina do acervo: por que o bibliotecário levou uma lanterna para a estante? Porque alguns títulos tinham um passado sombrio. Miau. Aceito aplausos discretos.", "Hoje um livro me chamou de dramático. Eu apenas subi numa pilha de enciclopédias, encarei o horizonte e respondi: 'dramático é estar fora de ordem alfabética'.", "Um livro de suspense me perguntou se eu confiava nele. Eu disse: claro. Depois conferi a lombada três vezes. Sou gato, não ingênuo."], tipo)
      },
      dia_usuario: {
        estado: humor === "triste" ? (lyra ? "gentle" : "protective") : humor === "animado" ? (lyra ? "cheerful" : "pleased") : (lyra ? "gentle" : "attentive"),
        texto: respostaDiaUsuario(personagem, humor)
      },
      limite_personagem: {
        estado: lyra ? "gentle" : "sly",
        texto: lyra ? "Eu posso te ajudar por muitos caminhos, estrelinha, mas minha voz pertence à Biblioteca Andrômeda. Não vou apagar meu luar; ele é o fio que me guia até você." : "Pedido anotado e arquivado numa gaveta trancada. Eu não abandono meu posto nem meu chapéu. Agora diga: vamos ao catálogo, ao mapa 3D ou a uma conversa decente?"
      },
      resposta_curta_nao: {
        estado: lyra ? "gentle" : "neutral",
        texto: lyra ? "Tudo bem, estrelinha. A gente deixa essa porta encostada e escolhe outra lua. Quer só conversar um pouco?" : "Sem problema. Fecho essa rota e fico de vigia. Diga outro rumo quando quiser."
      },
      agradecimento: {
        estado: lyra ? "cheerful" : "pleased",
        texto: lyra ? "Sempre, estrelinha. Quando precisar, é só acender uma palavra aqui que eu apareço com meu luar." : "Disponha. Estarei de guarda, fingindo indiferença em cima da próxima pilha de livros."
      },
      despedida: {
        estado: lyra ? "gentle" : "neutral",
        texto: lyra ? "Vai com cuidado, estrelinha. Que sua próxima leitura te encontre antes mesmo de você procurar por ela." : "Rota encerrada por enquanto. Deixarei uma pata marcando seu lugar no mapa."
      },
      conversa: {
        estado: lyra ? "curious" : "curious",
        texto: lyra ? escolher(["Eu senti uma faísca aí. Posso seguir conversando, te fazer uma pergunta, contar algo da Biblioteca ou escolher uma leitura pelo clima. O que seu coração prefere?", "Essa mensagem chegou como brilho pequeno. A gente pode transformar em papo, jogo, missão no catálogo ou recomendação. Me dá só uma palavra de direção."], tipo + personagem) : escolher(["Captei o rastro. Posso transformar isso em conversa, missão, recomendação ou investigação no acervo. Dê uma pista: humor, livro, mapa ou fofoca bibliotecária.", "Ainda não sei qual porta você quer abrir, mas posso abrir quatro: papo, livro, catálogo ou mapa 3D. Escolha uma antes que eu escolha por você."], tipo + personagem)
      }
    };
    return respostas[tipo] || respostas.conversa;
  }

  function recomendarLivros(mensagem, limite = 3) {
    return recomendarLivrosPrecisos(mensagem, limiteRecomendacao96(mensagem, limite));
  }

  function livroDoContexto(textoOriginal) {
    const n = normalizar(textoOriginal);
    if (!MEMORIA.ultimosLivros.length) return null;
    let index = 0;
    if (contem(n, ["segundo", "segunda", "2", "dois"])) index = 1;
    if (contem(n, ["terceiro", "terceira", "3", "tres"])) index = 2;
    if (contem(n, ["quarto", "quarta", "4"])) index = 3;
    const id = MEMORIA.ultimosLivros[index] || MEMORIA.ultimosLivros[0];
    return livros().find(l => livroId(l) === id) || null;
  }

  function respostaContinuidadeLivro(personagem, textoOriginal) {
    const lyra = personagem === "Lyra";
    const l = livroDoContexto(textoOriginal);
    if (!l) {
      return {
        estado: lyra ? "curious" : "analyzing",
        texto: lyra ? "Essa estrela anterior escapou do meu relicário. Me diga o título ou peça uma nova recomendação que eu reencontro o caminho." : "Perdi o rastro do último livro. Diga o título, autor ou categoria, e eu refaço a caça sem drama. Quer dizer... com pouco drama.",
        books: []
      };
    }
    const sin = livroSinopse(l);
    return {
      estado: lyra ? "inspired" : "attentive",
      texto: lyra ? `${livroTitulo(l)} fica na constelação ${livroCategoria(l)} e tem aquele brilho de história que pede uma xícara por perto. É de ${livroAutor(l)}, está como ${livroStatus(l)}${sin ? `, e a sinopse sussurra: ${sin.slice(0, 320)}${sin.length > 320 ? "..." : ""}` : ". A sinopse está quietinha, mas o dossiê pode abrir mais janelas."}` : `${livroTitulo(l)}, de ${livroAutor(l)}. Constelação: ${livroCategoria(l)}. Status: ${livroStatus(l)}.${sin ? ` Sinopse farejada: ${sin.slice(0, 320)}${sin.length > 320 ? "..." : ""}` : " Sem sinopse detalhada no registro, mas o dossiê ainda é a rota certa."}`,
      books: [l]
    };
  }

  function respostaCatalogo(tipo, personagem, textoOriginal, humor) {
    const n = normalizar(textoOriginal);
    const lyra = personagem === "Lyra";
    const acervo = livros();
    if (!acervo.length) {
      return {
        estado: lyra ? "curious" : "analyzing",
        texto: lyra ? "O acervo ainda está acordando atrás da cortina. Posso te explicar os caminhos da Biblioteca, mas as estrelas dos livros ainda não apareceram para mim." : "O catálogo ainda não abriu suas órbitas para mim. Posso orientar a navegação, mas preciso que o acervo carregue para farejar títulos reais.",
        books: []
      };
    }

    if (["guia_catalogo", "acao_catalogo"].includes(tipo)) {
      const cats = categorias();
      return {
        estado: lyra ? "inspired" : "analyzing",
        texto: `${respostaGuia("guia_catalogo", personagem).texto}\n\nAgora vejo ${acervo.length} obras brilhando e ${cats.length} constelações no acervo. Rotas abertas: ${cats.slice(0, 8).join(", ")}${cats.length > 8 ? "..." : "."}`,
        books: []
      };
    }

    if (tipo === "categoria") {
      const catPedida = categoriaNaMensagem(textoOriginal);
      const daCat = catPedida ? livrosPorCategoria(catPedida, 6) : [];
      if (catPedida && daCat.length) {
        MEMORIA.ultimaCategoria = catPedida;
        lembrarEmLista("generosFavoritos", catPedida);
        return {
          estado: lyra ? "inspired" : "analyzing",
          texto: lyra ? `Achei a constelação ${catPedida}. Ela está cheia de pequenos mundos literários; deixei alguns abaixo para você abrir.` : `Constelação localizada: ${catPedida}. Separei algumas obras dessa órbita para inspeção.`,
          books: daCat
        };
      }
    }

    if (tipo === "disponiveis") {
      const disponiveis = livrosDisponiveis(acervo).slice(0, 6);
      return {
        estado: lyra ? "cheerful" : "pleased",
        texto: lyra ? "Separei algumas estrelas que parecem prontas para visita agora. Se uma delas chamar seu coração, toque no card para abrir o dossiê." : "Farejei obras disponíveis no acervo. Toque em um card para abrir o dossiê e conferir o caminho de empréstimo ou reserva.",
        books: disponiveis
      };
    }

    if (tipo === "recomendacao") {
      const recs = recomendarLivrosPrecisos(textoOriginal, limiteRecomendacao96(textoOriginal, 3));
      const primeira = recs[0];
      if (!primeira) {
        return {
          estado: lyra ? "curious" : "analyzing",
          texto: lyra ? "Procurei uma recomendação, mas as estrelas ficaram tímidas. Me diga um clima: leve, sombrio, romântico, aventura, mistério ou algo para dias cansados." : "Não encontrei uma rota forte. Dê um gênero, humor ou autor, e eu afio os bigodes da busca.",
          books: []
        };
      }
      const fraseHumor = humor !== "neutro" ? (lyra ? `Pelo seu brilho de agora, senti um clima ${humor}. ` : `Pelo rastro da mensagem, senti um clima ${humor}. `) : "";
      const mem = MEMORIA.afetiva.generosFavoritos.length ? (lyra ? `Também lembrei que você costuma orbitar ${MEMORIA.afetiva.generosFavoritos.slice(0, 3).join(", ")}. ` : `Cruzei com seus rastros recentes: ${MEMORIA.afetiva.generosFavoritos.slice(0, 3).join(", ")}. `) : "";
      const motivo = explicarCompatibilidadeLivro96(primeira, textoOriginal);
      const extra = recs.length > 1 ? (lyra ? " Deixei poucas alternativas, só para comparação suave." : " Mantive poucas alternativas para não virar avalanche de cards.") : "";
      return {
        estado: lyra ? "inspired" : "pleased",
        texto: lyra
          ? `${fraseHumor}${mem}Minha primeira estrela para você é ${livroTitulo(primeira)}, de ${livroAutor(primeira)}. Escolhi ${motivo}.${extra}`
          : `${fraseHumor}${mem}Minha indicação principal é ${livroTitulo(primeira)}, de ${livroAutor(primeira)}. A escolha veio ${motivo}. Status: ${livroStatus(primeira)}.${extra}`,
        books: recs
      };
    }

    const achados = buscarLivros(textoOriginal, 5);
    if (achados.length) {
      const l = achados[0];
      const sin = livroSinopse(l);
      MEMORIA.ultimosLivros = achados.map(livroId).filter(Boolean);
      if (livroCategoria(l)) lembrarEmLista("generosFavoritos", livroCategoria(l));
      return {
        estado: lyra ? "smile" : "attentive",
        texto: lyra
          ? `${livroTitulo(l)} apareceu como uma estrela chamando pelo nome. É de ${livroAutor(l)}, mora na constelação ${livroCategoria(l)} e está marcado como ${livroStatus(l)}.${sin ? ` Pela sinopse, sinto isto: ${sin.slice(0, 260)}${sin.length > 260 ? "..." : ""}` : " A sinopse está quietinha, mas o dossiê pode contar mais."}`
          : `Encontrei ${livroTitulo(l)}, de ${livroAutor(l)}. Constelação: ${livroCategoria(l)}. Status: ${livroStatus(l)}.${sin ? ` Resumo: ${sin.slice(0, 260)}${sin.length > 260 ? "..." : ""}` : " O registro não trouxe sinopse detalhada."}`,
        books: achados
      };
    }

    const cats = categorias();
    return {
      estado: lyra ? "curious" : "analyzing",
      texto: lyra ? `Procurei no acervo, mas essa estrela não apareceu com nitidez. Tenta me dizer o título, autor ou uma categoria como ${cats.slice(0, 6).join(", ")}.` : `Não achei uma correspondência confiável. Me dê título, autor, categoria ou status. Constelações visíveis: ${cats.slice(0, 6).join(", ")}.`,
      books: []
    };
  }

  function extrairBusca(texto) {
    let n = String(texto || "").replace(/^(buscar|pesquisar|procurar|procura|busca|pesquisa)\s+/i, "");
    n = n.replace(/\b(no|na|pelo|pela|catalogo|catálogo|acervo|livro|obra|titulo|título|autor|autora)\b/gi, " ").replace(/\s+/g, " ").trim();
    return n;
  }

  function detectarAcao(tipo, textoOriginal) {
    const n = normalizar(textoOriginal);
    if (String(tipo || "").startsWith("treino7_area_")) {
      const key = String(tipo).replace("treino7_area_", "");
      const area = areaTreino7(key);
      const navegar = contem(n, ["abre", "abrir", "mostrar", "mostra", "ir para", "me leva", "acessar", "entra", "entrar", "quero ver"]);
      MEMORIA.afetiva.ultimaRotaGuiada = area.nome;
      salvarMemoria();
      if (["catalogo", "dossie", "avaliacao", "reserva", "mapa3d", "modos", "notificacoes"].includes(key)) {
        if (key === "mapa3d") return { tipo: "3d", alvo: area.selector };
        if (key === "reserva") return { tipo: "reservas", alvo: area.selector };
        if (key === "avaliacao" || key === "dossie" || key === "modos" || key === "notificacoes") return { tipo: "elemento", alvo: area.selector, pagina: "catalogo" };
        return { tipo: "catalogo", alvo: area.selector };
      }
      if (key === "ranking") return { tipo: "ranking", alvo: area.selector, url: area.url };
      if (key === "perfil") return navegar ? { tipo: "rota_url", url: area.url, alvo: area.selector } : { tipo: "perfil", alvo: area.selector };
      if (["intro", "login", "cadastro", "planos", "generos", "admin"].includes(key)) {
        return navegar ? { tipo: "rota_url", url: area.url, alvo: area.selector } : { tipo: "elemento", alvo: area.selector, pagina: key };
      }
    }
    if (tipo === "treino7_contexto_atual" || tipo === "treino7_tour_geral" || tipo === "treino7_primeira_vez") return { tipo: "elemento", alvo: areaTreino7(paginaAtualTreino7()).selector };
    if (String(tipo || "").startsWith("treino8_") && contem(n, ["mostra", "mostrar", "abre", "abrir", "ver no catalogo", "ver no catálogo", "me leva", "leva pro catalogo", "leva para o catálogo"])) return { tipo: "catalogo", alvo: "#editorial-view" };
    if (tipo === "acao_catalogo" || (tipo === "guia_catalogo" && contem(n, ["abre", "abrir", "mostrar", "ir para", "me leva"]))) return { tipo: "catalogo", alvo: "#editorial-view" };
    if (tipo === "acao_3d" || (tipo === "guia_3d" && contem(n, ["abre", "abrir", "mostrar", "ir para", "me leva"]))) return { tipo: "3d", alvo: "#depth" };
    if (tipo === "busca_site") return { tipo: "busca", termo: extrairBusca(textoOriginal) };
    if (tipo === "destaque_semana") return { tipo: "catalogo", alvo: "#ed-carousel-section" };
    if (tipo === "carrossel") return { tipo: "catalogo", alvo: "#ed-sections" };
    if (tipo === "dossie") return { tipo: "catalogo", alvo: ".ed-book-card, .ed-carousel-card" };
    if (tipo === "reserva" && contem(n, ["abrir reservas", "minhas reservas", "painel reservas", "ver reservas", "me leva"])) return { tipo: "reservas" };
    if (tipo === "perfil_ranking" && n.includes("ranking")) return { tipo: "ranking" };
    if (tipo === "perfil_ranking" && contem(n, ["perfil", "foto", "avatar", "minhas avaliacoes", "minhas avaliações"])) return { tipo: "perfil" };
    const cat = categoriaNaMensagem(textoOriginal);
    if ((tipo === "categoria" || cat) && cat && contem(n, ["ir", "abrir", "mostrar", "focar", "ver", "me leva", "3d", "mapa"])) return { tipo: "categoria", categoria: cat };
    return null;
  }

  function garantirEstilosGuia() {
    if (document.getElementById("andromeda-ai-guide-style")) return;
    const style = document.createElement("style");
    style.id = "andromeda-ai-guide-style";
    style.textContent = `.ai-guide-focus{position:relative!important;outline:1px solid rgba(160,96,238,.95)!important;box-shadow:0 0 0 4px rgba(42,162,246,.16),0 0 32px rgba(160,96,238,.42)!important;z-index:20!important}.ai-guide-focus::after{content:"";position:absolute;inset:-7px;border-radius:inherit;border:1px solid rgba(224,240,255,.48);pointer-events:none;animation:aiGuidePulse 1.2s ease-in-out infinite}@keyframes aiGuidePulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.018)}}`;
    document.head.appendChild(style);
  }

  function destacarElemento(selector) {
    garantirEstilosGuia();
    const alvo = document.querySelector(selector);
    if (!alvo) return;
    alvo.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "center" });
    alvo.classList.add("ai-guide-focus");
    window.setTimeout(() => alvo.classList.remove("ai-guide-focus"), 3400);
  }

  function executarAcao(acao) {
    if (!acao) return;
    window.setTimeout(() => {
      if (acao.tipo === "rota_url") {
        const atual = window.location?.pathname || "";
        if (acao.url && !atual.includes(acao.url.replace("/Biblioteca-Andromeda/", ""))) {
          window.location.href = acao.url;
          return;
        }
        destacarElemento(acao.alvo || "#nav");
      }
      if (acao.tipo === "elemento") {
        if (acao.pagina === "catalogo" && typeof setView === "function") setView("ed");
        if (acao.pagina === "catalogo" && typeof buildEditorial === "function") buildEditorial();
        window.setTimeout(() => destacarElemento(acao.alvo || "#editorial-view"), 280);
      }
      if (acao.tipo === "catalogo") {
        if (typeof setView === "function") setView("ed");
        if (typeof buildEditorial === "function") buildEditorial();
        window.setTimeout(() => destacarElemento(acao.alvo || "#editorial-view"), 260);
      }
      if (acao.tipo === "3d") {
        if (typeof setView === "function") setView("gal");
        window.setTimeout(() => destacarElemento(acao.alvo || "#depth"), 260);
      }
      if (acao.tipo === "busca") {
        if (typeof setView === "function") setView("ed");
        if (typeof buildEditorial === "function") buildEditorial();
        const q = document.getElementById("q");
        if (q && acao.termo) {
          q.value = acao.termo;
          q.dispatchEvent(new Event("input", { bubbles: true }));
        }
        window.setTimeout(() => destacarElemento("#q"), 260);
      }
      if (acao.tipo === "reservas") {
        if (typeof window.abrirPainelReservas === "function") window.abrirPainelReservas();
        else document.getElementById("nav-reservas")?.click();
        window.setTimeout(() => destacarElemento("#nav-reservas"), 220);
      }
      if (acao.tipo === "ranking") {
        if (typeof setView === "function") setView("ed");
        document.getElementById("ranking-leitores")?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => destacarElemento("#ranking-leitores"), 280);
      }
      if (acao.tipo === "perfil") {
        const link = document.querySelector(acao.alvo || 'a[href$="/perfil"], a[href*="perfil"]');
        if (link) destacarElemento(acao.alvo || 'a[href$="/perfil"], a[href*="perfil"]');
        else if (acao.url) window.location.href = acao.url;
      }
      if (acao.tipo === "categoria") {
        if (typeof setView === "function") setView("gal");
        if (typeof flyToCat === "function") flyToCat(acao.categoria);
        window.setTimeout(() => destacarElemento("#depth"), 280);
      }
      queueMagneticRefresh?.();
    }, 520);
  }

  function respostaParaSim(personagem) {
    const lyra = personagem === "Lyra";
    if (MEMORIA.aguardando === "empatia" || String(MEMORIA.ultimaIntencao || "").startsWith("treino99_")) {
      const estado = MEMORIA.afetiva?.empatia99?.ultimoEstado || "desabafo";
      const tipo = estado === "crise" ? "treino99_crise" : `treino99_${estado}`;
      if (tipo === "treino99_crise") return respostaEmpatia99(tipo, personagem, "sim", "neutro");
      return {
        estado: lyra ? "gentle" : "protective",
        texto: lyra
          ? `Obrigada por confiar em mim. Vamos seguir com calma: ${perguntaApoio99(tipo, personagem)}`
          : `Certo. Sigo aqui de guarda. Próxima pista: ${perguntaApoio99(tipo, personagem)}`,
        books: []
      };
    }
    if (MEMORIA.aguardando === "treino101_pergunta_usuario" || MEMORIA.aguardando === "treino101_conversa_dia" || String(MEMORIA.ultimaIntencao || "").startsWith("treino101_")) return respostaTreino101("treino101_continuar", personagem, "mais uma", "neutro");
    if (MEMORIA.aguardando === "treino100_continuacao" || String(MEMORIA.ultimaIntencao || "").startsWith("treino100_")) return respostaTreino100("treino100_continuar", personagem, "mais uma", "neutro");
    if (MEMORIA.ultimaIntencao === "dia_usuario" || (MEMORIA.aguardando === "recomendacao" && MEMORIA.humorUsuario !== "neutro")) {
      const recs = recomendarLivrosPrecisos(MEMORIA.humorUsuario, 1);
      const primeiro = recs[0];
      return {
        estado: lyra ? "inspired" : "pleased",
        texto: primeiro ? (lyra ? `Então eu escolheria uma estrela bem específica para esse clima: ${livroTitulo(primeiro)}, de ${livroAutor(primeiro)}. Não vou te jogar uma pilha de livros; essa parece a rota mais compatível agora.` : `Certo. Minha caça mais precisa para esse clima aponta para ${livroTitulo(primeiro)}, de ${livroAutor(primeiro)}. Uma recomendação principal, sem avalanche.`) : (lyra ? "Tentei escolher uma estrela precisa, mas o acervo ficou tímido. Me dá um gênero ou clima a mais." : "Tentei farejar uma indicação precisa, mas faltou pista. Dê gênero ou clima."),
        books: recs
      };
    }
    if (MEMORIA.ultimaIntencao === "recomendacao" && MEMORIA.ultimosLivros.length) {
      return {
        estado: lyra ? "smile" : "attentive",
        texto: lyra ? "Abre o primeiro card que brilhou para você. O dossiê conta o resto da história e eu fico aqui para escolher outra lua se precisar." : "Toque no card mais promissor. O dossiê abre autor, status, sinopse e caminhos de reserva. Se nenhum servir, eu refaço a caça."
      };
    }
    if (MEMORIA.ultimaIntencao === "guia_catalogo") return respostaGuia("guia_catalogo", personagem);
    if (MEMORIA.ultimaIntencao === "guia_3d") return respostaGuia("guia_3d", personagem);
    if (MEMORIA.aguardando === "roleplay" || String(MEMORIA.ultimaIntencao || "").startsWith("treino6_roleplay")) return respostaTreino6("treino6_roleplay_continuar", personagem, "", "neutro");
    if (MEMORIA.aguardando === "treino98_continuacao" || String(MEMORIA.ultimaIntencao || "").startsWith("treino98_")) {
      return respostaTreino98("treino98_dia", personagem, "sim", "neutro");
    }
    if (MEMORIA.aguardando === "treino96_continuacao" || String(MEMORIA.ultimaIntencao || "").startsWith("treino96_")) {
      const rota96 = garantirMemoriaTreino96().ultimaRota || "historia_criada";
      const proximo96 = rota96 === "sobre" ? "treino96_backstory_pessoal" : rota96 === "backstory" ? "treino96_historia_solo" : rota96 === "historia_solo" ? "treino96_historia_criada" : rota96 === "historia_duo" ? "treino96_historia_duo" : rota96 === "cosmos" ? "treino96_cosmos" : "treino96_historia_criada";
      return respostaTreino96(proximo96, personagem, "sim", "neutro");
    }
    if (MEMORIA.aguardando === "treino94_continuacao" || String(MEMORIA.ultimaIntencao || "").startsWith("treino94_")) {
      const rota94 = garantirMemoriaTreino94().ultimaRota || "historia_livre";
      const proximo94 = rota94 === "sobre" ? "treino94_backstory_pessoal" : rota94 === "backstory" ? "treino94_historia_solo" : rota94 === "duo" ? "treino94_historia_duo" : "treino94_historia_livre";
      return respostaTreino94(proximo94, personagem, "sim");
    }
    if (MEMORIA.aguardando === "treino87_resposta_social" || String(MEMORIA.ultimaIntencao || "").startsWith("treino87_")) return respostaTreino87("treino87_pergunta_melhor", personagem, "sim", "neutro");
    if (MEMORIA.aguardando === "treino86_personagem" || String(MEMORIA.ultimaIntencao || "").startsWith("treino86_")) return respostaTreino86("treino86_curiosidades", personagem, "sim", "neutro");
    if (MEMORIA.aguardando === "treino85_resposta_social" || String(MEMORIA.ultimaIntencao || "").startsWith("treino85_")) return respostaTreino85("treino85_perguntar_sobre_mim", personagem, "sim", "neutro");
    if (MEMORIA.aguardando === "resposta_social" || String(MEMORIA.ultimaIntencao || "").startsWith("treino5_") || String(MEMORIA.ultimaIntencao || "").startsWith("treino6_curiosidade")) return respostaTreino5("treino5_pergunta_de_volta", personagem, "", "neutro");
    return {
      estado: lyra ? "cheerful" : "attentive",
      texto: lyra ? "Perfeito. Então me diga o brilho que você quer seguir: catálogo, mapa 3D, recomendação, reserva, avaliação ou só uma conversa lunar." : "Afirmativo. Escolha a rota: catálogo, mapa 3D, recomendação, reserva, avaliação ou conversa livre."
    };
  }

  function gerarResposta(texto, personagem) {
    const detectado = classificarIntencao(texto);
    let tipo = detectado.tipo;
    let personagemResposta = detectado.personagemPedido || personagem;
    if (!PERSONAGENS[personagemResposta]) personagemResposta = "Orion";
    const humor = detectado.humor;
    limparContextoPegajoso93(tipo);

    MEMORIA.mensagens++;
    atualizarMemoriaAfetiva(texto, tipo, humor, personagemResposta);

    let resposta;
    if (tipo === "continuidade_livro") {
      resposta = respostaContinuidadeLivro(personagemResposta, texto);
    } else if (String(tipo || "").startsWith("treino104_")) {
      resposta = respostaTreino104(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino103_")) {
      resposta = respostaTreino103(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino102_")) {
      resposta = respostaTreino102(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino101_")) {
      resposta = respostaTreino101(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino100_")) {
      resposta = respostaTreino100(tipo, personagemResposta, texto, humor);
    } else if (tipo === "recomendacao_gosto_mascotes") {
      resposta = respostaGostoMascotes92(personagemResposta, texto);
    } else if (String(tipo || "").startsWith("treino99_")) {
      resposta = respostaEmpatia99(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino98_")) {
      resposta = respostaTreino98(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino96_")) {
      resposta = respostaTreino96(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino94_")) {
      resposta = respostaTreino94(tipo, personagemResposta, texto);
    } else if (String(tipo || "").startsWith("treino91_")) {
      resposta = respostaTreino91(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino90_")) {
      resposta = respostaTreino90(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino89_")) {
      resposta = respostaTreino89(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino88_")) {
      resposta = respostaTreino88(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino87_")) {
      resposta = respostaTreino87(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino86_")) {
      resposta = respostaTreino86(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino85_")) {
      resposta = respostaTreino85(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino8_")) {
      resposta = respostaTreino8(tipo, personagemResposta, texto, humor);
    } else if (String(tipo || "").startsWith("treino7_")) {
      resposta = respostaTreino7(tipo, personagemResposta, texto);
    } else if (["guia_catalogo", "acao_catalogo", "recomendacao", "livro", "categoria", "disponiveis"].includes(tipo)) {
      resposta = respostaCatalogo(tipo, personagemResposta, texto, humor);
    } else if (["guia_3d", "acao_3d", "reserva", "avaliacao", "perfil_ranking", "modo_visual", "destaque_semana", "carrossel", "dossie"].includes(tipo)) {
      resposta = respostaGuia(tipo, personagemResposta);
      if (["reserva", "avaliacao", "perfil_ranking"].includes(tipo)) {
        const achados = buscarLivros(texto, 3);
        if (achados.length) resposta.books = achados;
      }
    } else if (tipo === "busca_site") {
      const achados = buscarLivros(texto, 5);
      resposta = {
        estado: personagemResposta === "Lyra" ? "curious" : "analyzing",
        texto: personagemResposta === "Lyra" ? "Vou acender a busca do catálogo com essa pista. Se alguma estrela aparecer, toque nela para abrir o dossiê." : "Vou lançar essa pista na busca do catálogo. Se o acervo responder, abra o card e eu continuo a investigação.",
        books: achados
      };
    } else if (tipo === "resposta_curta_sim") {
      resposta = respostaParaSim(personagemResposta);
    } else {
      resposta = respostaBasica(tipo, personagemResposta, texto, humor);
    }

    if (String(tipo || "").startsWith("treino102_recomendacao")) MEMORIA.aguardando = "recomendacao";
    else if (["treino102_estresse_codigo", "treino102_ansiedade_prova"].includes(tipo)) MEMORIA.aguardando = "empatia";
    else if (String(tipo || "").startsWith("treino102_")) MEMORIA.aguardando = "treino102_continuacao";
    else if (String(tipo || "").startsWith("treino101_")) MEMORIA.aguardando = tipo === "treino101_resposta_usuario_dia" ? MEMORIA.aguardando : "treino101_pergunta_usuario";
    else if (String(tipo || "").startsWith("treino100_")) MEMORIA.aguardando = "treino100_continuacao";
    else if (String(tipo || "").startsWith("treino99_recomendacao")) MEMORIA.aguardando = "recomendacao";
    else if (String(tipo || "").startsWith("treino99_")) MEMORIA.aguardando = tipo === "treino99_crise" ? "empatia" : "empatia";
    else if (tipo === "dia_usuario" && humor !== "neutro") MEMORIA.aguardando = "empatia";
    else if (String(tipo || "").startsWith("treino98_recomendacao") || tipo === "treino98_livro_personagem") MEMORIA.aguardando = "recomendacao";
    else if (String(tipo || "").startsWith("treino98_")) MEMORIA.aguardando = "treino98_continuacao";
    else if (String(tipo || "").startsWith("treino96_recomendacao")) MEMORIA.aguardando = "recomendacao";
    else if (String(tipo || "").startsWith("treino96_")) MEMORIA.aguardando = "treino96_continuacao";
    else if (String(tipo || "").startsWith("treino94_")) MEMORIA.aguardando = "treino94_continuacao";
    else if (String(tipo || "").startsWith("treino91_")) MEMORIA.aguardando = ["treino91_reparo", "treino91_mudanca_livre", "treino91_linguagem"].includes(tipo) ? null : "treino91_continuacao";
    else if (String(tipo || "").startsWith("treino90_")) MEMORIA.aguardando = ["treino90_curta_nao_contextual", "treino90_reparo_curto", "treino90_entende_erro_gramatica"].includes(tipo) ? null : "treino90_continuacao";
    else if (String(tipo || "").startsWith("treino89_")) MEMORIA.aguardando = ["treino89_reparo_contextual", "treino89_mudanca_livre"].includes(tipo) ? null : "treino89_continuacao_personagem";
    else if (String(tipo || "").startsWith("treino88_")) MEMORIA.aguardando = ["treino88_reparo_imersivo", "treino88_mudanca_assunto", "treino88_variacao_pedida"].includes(tipo) ? null : "treino88_continuacao_personagem";
    else if (String(tipo || "").startsWith("treino87_")) MEMORIA.aguardando = tipo === "treino87_resposta_social" ? null : "treino87_resposta_social";
    else if (String(tipo || "").startsWith("treino86_")) MEMORIA.aguardando = "treino86_personagem";
    else if (String(tipo || "").startsWith("treino85_")) MEMORIA.aguardando = MEMORIA.aguardando || "treino85_resposta_social";
    else if (tipo === "recomendacao_gosto_mascotes") MEMORIA.aguardando = "recomendacao";
    else if (String(tipo || "").startsWith("treino8_")) MEMORIA.aguardando = "recomendacao";
    else if (["treino5_pergunta_de_volta", "treino5_puxa_assunto", "treino5_jogo", "treino6_curiosidade_usuario"].includes(tipo)) MEMORIA.aguardando = "resposta_social";
    else if (["treino6_roleplay", "treino6_roleplay_continuar"].includes(tipo)) MEMORIA.aguardando = "roleplay";
    else if (!["resposta_curta_sim", "resposta_curta_nao", "treino5_resposta_usuario_curta", "treino5_resposta_usuario_detalhada"].includes(tipo)) MEMORIA.aguardando = null;

    resposta = aplicarTreino15AntiRepeticao(resposta, personagemResposta, tipo);
    if (resposta && resposta.texto) resposta.texto = polirRespostaImersivaFinal(resposta.texto, personagemResposta);
    const acao = detectarAcao(tipo, texto);
    MEMORIA.ultimaIntencao = tipo;
    MEMORIA.ultimoTopico = texto;
    return {
      selected_character: personagemResposta,
      visual_state: resposta.estado || (personagemResposta === "Lyra" ? "smile" : "neutral"),
      emotion_tag: etiquetaEstado(personagemResposta, resposta.estado),
      dialogue: resposta.texto,
      livros: resposta.books || [],
      ui_animation_sequence: resposta.ui_animation_sequence || [resposta.estado || (personagemResposta === "Lyra" ? "smile" : "neutral")],
      action: acao
    };
  }



  function polirRespostaImersivaFinal(texto, personagem) {
    let t = String(texto || "");
    const lyra = personagem === "Lyra";
    const trocas = [
      [/\bRegistrado,\s*/gi, lyra ? "Guardei isso com cuidado, " : "Marquei no mapa, "],
      [/\bA resposta foi curta,? mas útil\.?\s*/gi, ""],
      [/\bTroco a rota para não[^.?!]*[.?!]?\s*/gi, lyra ? "Vou por outra luz. " : "Sigo por outro rastro. "],
      [/\bReformulando[:\.\s]*/gi, lyra ? "Vou dizer por outro brilho: " : "Vou dizer por outro ângulo: "],
      [/\btreinamento\s*\d+(\.\d+)?\b/gi, "nova trilha"],
      [/\btreinando agora\b/gi, lyra ? "ouvindo melhor agora" : "com os bigodes mais atentos agora"],
      [/\bmanual frio\b/gi, "placa fria"],
      [/\btexto técnico\b/gi, "fala sem alma"],
      [/\bfallback\b/gi, "atalho de emergência"],
      [/\bwindow\.LIVROS\b/g, "acervo"],
      [/\bTecnicamente\s+nao\s+e\s+fofoca\s+se\s+for\s+util\s+para\s+entender\s+o\s+ecossistema\s+da\s+Biblioteca\.?/gi, lyra ? "A Biblioteca ri baixinho quando alguém percebe esses detalhes." : "E eu nego oficialmente que tenha gostado de contar."],
      [/\bTecnicamente\s+não\s+é\s+fofoca\s+se\s+for\s+útil\s+para\s+entender\s+o\s+ecossistema\s+da\s+Biblioteca\.?/gi, lyra ? "A Biblioteca ri baixinho quando alguém percebe esses detalhes." : "E eu nego oficialmente que tenha gostado de contar."],
    ];
    trocas.forEach(([padrao, troca]) => { t = t.replace(padrao, troca); });
    t = harmonizarVozPersonagem91(t, personagem);
    t = polirVozFinal93(t, personagem);
    return t.replace(/\s{2,}/g, " ").trim();
  }
  function etiquetaEstado(personagem, estado) {
    const mapa = {
      neutral: "Presente",
      smile: "Sorrindo",
      cheerful: "Radiante",
      thinking: "Pensando",
      analyzing: "Analisando",
      curious: "Curioso",
      attentive: "Atento",
      sly: "Travesso",
      pleased: "Satisfeito",
      protective: "Protetor",
      gentle: "Acolhendo",
      dreamy: "Sonhando",
      inspired: "Inspirada",
      playful: "Brincando",
      surprised: "Surpreso"
    };
    if (personagem === "Lyra" && estado === "curious") return "Curiosa";
    if (personagem === "Lyra" && estado === "surprised") return "Surpresa";
    if (personagem === "Lyra" && estado === "inspired") return "Inspirada";
    return mapa[estado] || "Presente";
  }

  function estadoImagem(personagem, estado = "neutral") {
    const p = PERSONAGENS[personagem] || PERSONAGENS.Orion;
    if (p.imagens[estado]) return estado;
    return p.imagens.neutral ? "neutral" : Object.keys(p.imagens)[0];
  }

  function limparReacao(img, wrap) {
    if (typeof gsap === "undefined") return;
    if (reacaoTimeline) reacaoTimeline.kill();
    reacaoTimeline = null;
    gsap.killTweensOf([img, wrap].filter(Boolean));
    gsap.set([img, wrap].filter(Boolean), { clearProps: "x,y,rotation,scale" });
  }

  function animarReacao(personagem, estado, img, wrap) {
    if (typeof gsap === "undefined" || !img) return;
    limparReacao(img, wrap);
    const alvo = wrap || img;
    gsap.set([img, alvo], { transformOrigin: "50% 62%" });
    if (["thinking", "analyzing", "curious", "dreamy", "attentive"].includes(estado)) {
      reacaoTimeline = gsap.timeline({ repeat: -1, yoyo: true }).to(img, { y: -5, rotation: personagem === "Lyra" ? -2.2 : -1.4, duration: 1.35, ease: "sine.inOut" });
    } else if (["smile", "cheerful", "playful", "pleased", "inspired"].includes(estado)) {
      reacaoTimeline = gsap.timeline({ repeat: -1, repeatDelay: .75 }).to(alvo, { y: -4, scale: 1.018, duration: .2, ease: "power2.out" }).to(alvo, { y: 0, scale: 1, duration: .36, ease: "bounce.out" });
    } else if (["surprised"].includes(estado)) {
      reacaoTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1.1 }).to(alvo, { scale: 1.045, duration: .14 }).to(alvo, { scale: 1, duration: .24 });
    } else {
      reacaoTimeline = gsap.timeline({ repeat: -1, yoyo: true }).to(alvo, { y: -3, duration: 2.1, ease: "sine.inOut" });
    }
  }

  function bootMascotesIA() {
    if (iniciado) return;

    const overlay = el("andromeda-ai");
    const fab = el("ai-chat-fab");
    const closeBtn = el("ai-chat-close");
    const navBtn = el("nav-andromeda-ai");
    const img = el("ai-character-image");
    const imgWrap = img?.closest?.(".ai-character-image-wrap") || null;
    const nome = el("ai-character-name");
    const titulo = el("ai-character-title");
    const quote = el("ai-character-quote");
    const history = el("ai-chat-history");
    const form = el("ai-chat-form");
    const input = el("ai-user-input");
    const send = el("ai-send-button");
    const switchButtons = Array.from(document.querySelectorAll(".ai-switch-btn[data-ai-character]"));
    const quickButtons = Array.from(document.querySelectorAll(".ai-quick-actions [data-ai-prompt]"));

    if (!overlay || !fab || !closeBtn || !img || !nome || !titulo || !quote || !history || !form || !input || !send) return;
    iniciado = true;
    garantirEstilosGuia();
    if (!PERSONAGENS[personagemAtual]) personagemAtual = "Orion";

    function atualizarTabs() {
      switchButtons.forEach(btn => {
        const ativo = btn.dataset.aiCharacter === personagemAtual;
        btn.classList.toggle("is-active", ativo);
        btn.setAttribute("aria-selected", ativo ? "true" : "false");
      });
    }

    function atualizarPersonagem(novo, estado = "neutral") {
      if (!PERSONAGENS[novo]) novo = "Orion";
      personagemAtual = novo;
      localStorage.setItem("andromeda_ai_personagem", personagemAtual);
      MEMORIA.afetiva.mascotePreferido = personagemAtual;
      salvarMemoria();
      const p = PERSONAGENS[personagemAtual];
      const st = estadoImagem(personagemAtual, estado);
      nome.textContent = p.nome;
      titulo.textContent = p.titulo;
      quote.textContent = p.quote;
      img.src = p.imagens[st];
      img.alt = p.alt;
      atualizarTabs();
      animarReacao(personagemAtual, st, img, imgWrap);
    }

    function trocarEstado(estado) {
      const p = PERSONAGENS[personagemAtual];
      const st = estadoImagem(personagemAtual, estado);
      img.src = p.imagens[st];
      animarReacao(personagemAtual, st, img, imgWrap);
    }

    function cardLivro(livro) {
      const id = escapar(livroId(livro));
      const titulo = escapar(livroTitulo(livro));
      const autor = escapar(livroAutor(livro));
      const cat = escapar(livroCategoria(livro));
      const status = escapar(livroStatus(livro));
      return `<button type="button" class="ai-book-card" data-ai-book-id="${id}" aria-label="Abrir ${titulo}">
        <span class="ai-book-card-kicker">${cat}</span>
        <strong>${titulo}</strong>
        <small>${autor}</small>
        <em>${status}</em>
      </button>`;
    }

    function montarMensagem(msg) {
      const row = document.createElement("article");
      row.className = `ai-message-row ${msg.type === "user" ? "ai-user-row" : "ai-bot-row"}`;
      const avatar = document.createElement(msg.type === "user" ? "div" : "img");
      if (msg.type === "user") {
        avatar.className = "ai-user-avatar";
        avatar.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
      } else {
        const p = PERSONAGENS[msg.author] || PERSONAGENS[personagemAtual];
        const estado = estadoImagem(p.nome, msg.avatarState || "neutral");
        avatar.className = "ai-message-avatar";
        avatar.src = p.imagens[estado];
        avatar.alt = p.nome;
      }
      const bubble = document.createElement("div");
      bubble.className = `ai-message ${msg.type === "user" ? "ai-user-message" : "ai-bot-message"}`;
      const meta = document.createElement("div");
      meta.className = "ai-message-meta";
      meta.innerHTML = `<strong>${escapar(msg.author || (msg.type === "user" ? "Você" : personagemAtual))}</strong><i class="fa-solid fa-star"></i><span>${msg.time || agora()}</span>${msg.emotion ? `<span>${escapar(msg.emotion)}</span>` : ""}`;
      const texto = document.createElement("p");
      texto.innerHTML = escapar(msg.text).replace(/\n/g, "<br>");
      bubble.appendChild(meta);
      bubble.appendChild(texto);
      if (Array.isArray(msg.books) && msg.books.length) {
        const wrap = document.createElement("div");
        wrap.className = "ai-book-results";
        wrap.innerHTML = msg.books.map(cardLivro).join("");
        bubble.appendChild(wrap);
      }
      row.appendChild(avatar);
      row.appendChild(bubble);
      return row;
    }

    function renderChat() {
      history.innerHTML = "";
      ESTADOS[personagemAtual].forEach(msg => history.appendChild(montarMensagem(msg)));
      history.scrollTop = history.scrollHeight;
      queueMagneticRefresh?.();
    }

    function adicionarMensagem(msg) {
      const finalMsg = { time: agora(), ...msg };
      ESTADOS[personagemAtual].push(finalMsg);
      const node = montarMensagem(finalMsg);
      history.appendChild(node);
      history.scrollTop = history.scrollHeight;
      salvarHistorico();
      queueMagneticRefresh?.();
      return node;
    }

    function mostrarPensando() {
      const p = PERSONAGENS[personagemAtual];
      const row = document.createElement("article");
      row.className = "ai-message-row ai-bot-row ai-thinking-row";
      row.innerHTML = `<img class="ai-message-avatar" src="${p.imagens[estadoImagem(personagemAtual, "thinking")]}" alt="${p.nome}"><div class="ai-message ai-bot-message"><div class="ai-message-meta"><strong>${p.nome}</strong><i class="fa-solid fa-star"></i><span>${agora()}</span></div><p><span class="ai-thinking-text">ouvindo as estrelas</span><span class="ai-typing-dots"><span></span><span></span><span></span></span></p></div>`;
      history.appendChild(row);
      history.scrollTop = history.scrollHeight;
      return row;
    }

    function processarRespostaIA(resposta) {
      const personagem = resposta?.selected_character && PERSONAGENS[resposta.selected_character] ? resposta.selected_character : personagemAtual;
      personagemAtual = personagem;
      atualizarPersonagem(personagemAtual, resposta.visual_state || "neutral");
      adicionarMensagem({
        type: "bot",
        author: personagemAtual,
        text: resposta.dialogue || (personagemAtual === "Lyra" ? "Senti a mensagem, mas ela escapou como poeira lunar. Tenta de novo?" : "A mensagem passou pelo meu bigode e saiu sem forma. Tente de novo."),
        avatarState: resposta.visual_state || "neutral",
        emotion: resposta.emotion_tag || etiquetaEstado(personagemAtual, resposta.visual_state),
        books: resposta.livros || []
      });
      executarAcao(resposta.action);
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }

    function abrirLivroNoCatalogo(id) {
      const alvo = String(id || "").trim();
      const livro = livros().find(l => livroId(l) === alvo);
      if (!livro) {
        window.showAndromedaNotice?.("Esse livro se escondeu entre as estantes. Tente buscar novamente.", "warning");
        return;
      }
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("ai-chat-open");
      if (typeof setView === "function") setView("ed");
      if (typeof buildEditorial === "function") buildEditorial();
      window.setTimeout(() => {
        const index = livros().indexOf(livro);
        const card = document.querySelector(`.ed-book-card[data-book-index="${index}"], .ed-carousel-card[data-book-index="${index}"]`);
        card?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        card?.classList.add("deep-link-focus");
        window.setTimeout(() => card?.classList.remove("deep-link-focus"), 2400);
        if (typeof window.openModal === "function") window.openModal(livro);
        if (typeof renderAvaliacoesAndromeda === "function") renderAvaliacoesAndromeda();
      }, 360);
    }

    async function enviarMensagem(valor) {
      const mensagem = String(valor || input.value || "").trim();
      if (!mensagem || animando) return;
      adicionarMensagem({ type: "user", author: "Você", text: mensagem });
      input.value = "";
      animando = true;
      input.disabled = true;
      send.disabled = true;
      trocarEstado("thinking");
      const pensando = mostrarPensando();
      window.setTimeout(() => {
        pensando.remove();
        const resposta = gerarResposta(mensagem, personagemAtual);
        animando = false;
        processarRespostaIA(resposta);
      }, 420 + Math.min(520, mensagem.length * 8));
    }

    function abrirChat() {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("ai-chat-open");
      atualizarPersonagem(personagemAtual, "neutral");
      renderChat();
      window.setTimeout(() => input.focus(), 60);
      if (typeof gsap !== "undefined") gsap.fromTo(".ai-chat-shell", { y: 18, scale: .985, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .45, ease: "power3.out", overwrite: true });
      queueMagneticRefresh?.();
    }

    function fecharChat() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("ai-chat-open");
    }

    fab.addEventListener("click", abrirChat);
    closeBtn.addEventListener("click", fecharChat);
    navBtn?.addEventListener("click", event => { event.preventDefault(); abrirChat(); });
    overlay.addEventListener("click", event => { if (event.target === overlay) fecharChat(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && overlay.classList.contains("is-open")) fecharChat(); });

    function rotearScroll(event) {
      if (!overlay.classList.contains("is-open")) return;
      const dentroHistorico = event.target.closest?.(".ai-chat-history, .ai-message, .ai-book-results");
      if (!dentroHistorico) return;
      const max = history.scrollHeight - history.clientHeight;
      if (max <= 0) return;
      history.scrollTop += event.deltaY;
      event.preventDefault();
      event.stopPropagation();
    }

    overlay.addEventListener("wheel", rotearScroll, { passive: false });
    history.addEventListener("wheel", rotearScroll, { passive: false });

    switchButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (animando) return;
        atualizarPersonagem(btn.dataset.aiCharacter, "neutral");
        renderChat();
      });
    });

    function resolverPromptRapido(btn) {
      const label = normalizar(btn?.textContent || "");
      const prompt = String(btn?.dataset?.aiPrompt || "").trim();
      if (label.includes("fofoca")) return "Me conte uma fofoca cósmica da Biblioteca Andrômeda.";
      if (label.includes("algo leve")) return "Me conte algo leve e engraçado da Biblioteca Andrômeda, sem recomendar livro agora.";
      if (label.includes("gosto deles")) return "Quero conhecer os gostos do Orion e da Lyra, sem recomendação de livro agora.";
      if (label.includes("conhecer")) return "Quero conhecer os dois: Orion e Lyra, quem são, como funcionam juntos e uma pequena história deles.";
      return prompt;
    }

    quickButtons.forEach(btn => btn.addEventListener("click", () => enviarMensagem(resolverPromptRapido(btn))));
    history.addEventListener("click", event => {
      const btn = event.target.closest?.(".ai-book-card[data-ai-book-id]");
      if (btn) abrirLivroNoCatalogo(btn.dataset.aiBookId);
    });
    form.addEventListener("submit", event => { event.preventDefault(); enviarMensagem(); });

    atualizarPersonagem(personagemAtual, "neutral");
    renderChat();
    window.processarRespostaIA = processarRespostaIA;
    window.andromedaMascotesIA = {
      abrir: abrirChat,
      fechar: fecharChat,
      trocarPara: nomePersonagem => { atualizarPersonagem(nomePersonagem, "neutral"); renderChat(); },
      dizer: texto => enviarMensagem(texto),
      recomendar: () => enviarMensagem("me recomende um livro"),
      memoria: () => ({ ...MEMORIA.afetiva })
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootMascotesIA, { once: true });
  else bootMascotesIA();
})();
