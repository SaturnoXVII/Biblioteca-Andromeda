/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  INTRO CINEMATOGRÁFICO — v5.0 FINAL CUT · IMAX · RELATIVISTIC            ║
 * ║  GALÁXIA ESPIRAL CIENTÍFICA + KERR BLACK HOLE VOLUMÉTRICO + WORMHOLE     ║
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
  const AUDIO_SRC = btnDespertar.dataset.audio || "./Gravity_s_Maw.mp3";
  let soundtrack =
    document.getElementById("intro-music") ||
    document.querySelector("audio[data-intro-music]") ||
    document.querySelector("audio");

  if (!soundtrack) {
    soundtrack = new Audio(AUDIO_SRC);
    soundtrack.id = "intro-music";
    soundtrack.setAttribute("data-intro-music", "true");
    soundtrack.style.display = "none";
    document.body.appendChild(soundtrack);
  }

  if (!soundtrack.getAttribute("src") && !soundtrack.querySelector("source")) {
    soundtrack.src = AUDIO_SRC;
  }
  soundtrack.preload = "auto";
  soundtrack.loop = false;
  soundtrack.setAttribute("playsinline", "true");

  if (
    !mount ||
    !btnDespertar ||
    typeof THREE === "undefined" ||
    typeof gsap === "undefined"
  )
    return;

  const rawNextPage =
    btnDespertar.dataset.next || btnDespertar.getAttribute("href") || "";
  const NEXT_PAGE =
    rawNextPage && rawNextPage !== "#" ? rawNextPage : "./login.php";

  // ─── DEVICE TIER ────────────────────────────────────────────────
  const _dpr = Math.min(devicePixelRatio || 1, 2);
  const _cores = navigator.hardwareConcurrency || 4;
  const TIER =
    _dpr >= 2 && _cores >= 8
      ? "ULTRA"
      : _dpr >= 1.5 || _cores >= 4
        ? "MID"
        : "LOW";

  const TIER_FACTOR = TIER === "ULTRA" ? 1.0 : TIER === "MID" ? 0.72 : 0.48;

  // ─── BEAT MAP ───────────────────────────────────────────────────
  const BEAT = {
    // Gravity_s_Maw.mp3 foi gerada para acompanhar a intro inteira desde o clique.
    // Mapa musical: vazio 0-6s, aproximação 6-12s, revelação 12-18s,
    // queda/gravidade 18-27s, túnel 27-36s, blackout 36-39s,
    // renascimento 39-45s e clímax/final 45-54.6s.
    MUSIC_OFFSET: 0,
    TDE_INTERLUDE: 18.2,
    CHAOS_START: 27.0,
    IMAX_OPEN: 29.25,
    TRAVEL_START: 32.7,
    SILENCE_START: 36.8,
    REBIRTH_START: 39.4,
    FINAL_PULL: 45.0,
    END: 54.55,
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
    el.style[pos === "top" ? "top" : "bottom"] = "0";
    return el;
  }
  const LB = { top: makeBar("lb-top", "top"), bot: makeBar("lb-bot", "bot") };
  const LB_H = Math.round(window.innerHeight * 0.1215);

  // ─── GRAIN OTIMIZADO ────────────────────────────────────────────
  function initGrain(canvas) {
    if (!canvas) return { resize() {} };
    const ctx = canvas.getContext("2d", { alpha: true });
    const noiseSize = 256;
    const off = document.createElement("canvas");
    off.width = off.height = noiseSize;
    const oCtx = off.getContext("2d", { alpha: true });
    const img = oCtx.createImageData(noiseSize, noiseSize);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = n;
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
      const dx = Math.random() * noiseSize,
        dy = Math.random() * noiseSize;
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

  async function startSoundtrack() {
    if (!soundtrack) return false;

    try {
      gsap.killTweensOf(soundtrack);
      soundtrack.pause();
      soundtrack.currentTime = BEAT.MUSIC_OFFSET;
      soundtrack.playbackRate = 1;
      soundtrack.volume = 0;
      soundtrack.muted = false;

      await soundtrack.play();

      SYNC.audioClock = true;
      SYNC.fallbackClock = false;
      SYNC.lastTimelineTime = 0;

      gsap.to(soundtrack, {
        volume: 1,
        duration: 1.35,
        ease: "power2.out",
      });

      return true;
    } catch (err) {
      // Fallback: se o navegador/arquivo bloquear o áudio, a intro ainda roda pelo relógio local.
      SYNC.audioClock = false;
      SYNC.fallbackClock = true;
      SYNC.fallbackStart = performance.now();
      SYNC.lastTimelineTime = 0;
      if (soundtrack) soundtrack.volume = 1;
      return false;
    }
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
    finished: false,
    hostAlive: true,
    bhAlive: true,
  };

  // Relógio mestre da experiência:
  // a timeline visual segue o tempo real da trilha para não atrasar em PCs lentos.
  const SYNC = {
    timeline: null,
    audioClock: false,
    fallbackClock: false,
    fallbackStart: 0,
    lastTimelineTime: 0,
  };

  function finishIntroAndGoToLogin() {
    if (ST.finished) return;
    ST.finished = true;

    document.body.classList.remove("diving-active");
    document.body.classList.add("intro-finished");

    if (SYNC.timeline) {
      SYNC.timeline.pause(BEAT.END);
    }

    if (OV?.fade) {
      gsap.killTweensOf(OV.fade);
      gsap.to(OV.fade, {
        opacity: 1,
        duration: 0.55,
        ease: "power2.inOut",
      });
    }

    if (soundtrack) {
      gsap.killTweensOf(soundtrack);
      gsap.to(soundtrack, {
        volume: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    }

    window.setTimeout(() => {
      window.location.assign(NEXT_PAGE || "login.php");
    }, 560);
  }

  const lookTarget = new THREE.Vector3(0, 0, 0);
  const origin = new THREE.Vector3(0, 0, 0);

  const _basePos = new THREE.Vector3();
  const _centerV3 = new THREE.Vector3();
  const _edgeV3 = new THREE.Vector3();
  const _edgeV2 = new THREE.Vector2();

  const HF_TABLE_SIZE = 512;
  const _hfTableX = new Float32Array(HF_TABLE_SIZE);
  const _hfTableY = new Float32Array(HF_TABLE_SIZE);
  for (let i = 0; i < HF_TABLE_SIZE; i++) {
    _hfTableX[i] = Math.random() * 2 - 1;
    _hfTableY[i] = Math.random() * 2 - 1;
  }
  let _hfIdx = 0;

  // ─── ESCALA FÍSICA-COMPRIMIDA ────────────────────────────────────
  const GALAXY_SCALE = {
    RADIUS: 260,
    BULGE_RADIUS: 25,
    DISK_SCALE: 78,
    THICKNESS: 2.4,
    WARP: 13.5,
    ARMS: 4,
    PITCH_DEG: 13.2,
    PARTICLES: Math.round(170000 * TIER_FACTOR),
    DUST_PARTICLES: Math.round(52000 * TIER_FACTOR),
    NEBULA_COUNT: TIER === "LOW" ? 16 : 24,
  };

  // BURACO NEGRO DE KERR (Rotação Extrema)
  const BH_SCALE = {
    EH_R: 0.62,
    PHOTON_R: 0.62 * 1.5,
    ERGOSPHERE: 0.62 * 2.0,
    ISCO_R: 0.62 * 1.2,
    DISK_IN: 0.62 * 1.25,
    DISK_OUT: 18.5,
    REVEAL_START_DIST: 140,
    REVEAL_FULL_DIST: 25,
    LENS_START_DIST: 110,
    LENS_FULL_DIST: 16,
  };

  const EH_R = BH_SCALE.EH_R;
  const PHOTON_R = BH_SCALE.PHOTON_R;
  const ISCO_R = BH_SCALE.ISCO_R;
  const DISK_IN = BH_SCALE.DISK_IN;
  const DISK_OUT = BH_SCALE.DISK_OUT;

  function saturate(v) {
    return Math.max(0, Math.min(1, v));
  }
  function smoothstepJS(e0, e1, x) {
    const t = saturate((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  }
  function gaussianRandom() {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
  }
  function expDiskRadius(scale, maxR) {
    let r = 0;
    do {
      r = -Math.log(1 - Math.random()) * scale;
    } while (r > maxR);
    return r;
  }
  function weightedPick(list) {
    let total = 0;
    for (const i of list) total += i.w;
    let r = Math.random() * total;
    for (const i of list) {
      r -= i.w;
      if (r <= 0) return i;
    }
    return list[list.length - 1];
  }

  // Precisão Espectral (Kelvin para RGB aproximado)
  const STAR_CLASSES = {
    hotArms: [
      { type: "O", temp: 1.0, color: 0x91b8ff, size: 2.4, w: 0.05 },
      { type: "B", temp: 0.88, color: 0xb8ccff, size: 1.9, w: 0.14 },
      { type: "A", temp: 0.72, color: 0xe1e8ff, size: 1.45, w: 0.22 },
      { type: "F", temp: 0.55, color: 0xffffee, size: 1.12, w: 0.2 },
      { type: "G", temp: 0.42, color: 0xfff2c4, size: 1.0, w: 0.18 },
      { type: "K", temp: 0.26, color: 0xffc184, size: 0.95, w: 0.13 },
      { type: "M", temp: 0.1, color: 0xff8b62, size: 0.8, w: 0.08 },
    ],
    oldBulge: [
      { type: "G", temp: 0.42, color: 0xffe6a8, size: 1.0, w: 0.2 },
      { type: "K", temp: 0.26, color: 0xffb46b, size: 1.06, w: 0.42 },
      { type: "M", temp: 0.1, color: 0xff7658, size: 1.2, w: 0.3 },
      { type: "A", temp: 0.72, color: 0xf3f5ff, size: 1.2, w: 0.08 },
    ],
    fieldDisk: [
      { type: "A", temp: 0.72, color: 0xdde7ff, size: 1.18, w: 0.09 },
      { type: "F", temp: 0.55, color: 0xffffee, size: 1.0, w: 0.18 },
      { type: "G", temp: 0.42, color: 0xfff0bd, size: 0.94, w: 0.25 },
      { type: "K", temp: 0.26, color: 0xffbf82, size: 0.93, w: 0.28 },
      { type: "M", temp: 0.1, color: 0xff8363, size: 0.82, w: 0.2 },
    ],
  };

  // ═══════════════════════════════════════════════════════════════
  // SCENE / CAMERA / RENDERER
  // ═══════════════════════════════════════════════════════════════
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x00010a, 0.00046);

  const camera = new THREE.PerspectiveCamera(32, VIEW.w / VIEW.h, 0.05, 22000);
  camera.position.set(-44, 192, 648);
  camera.lookAt(new THREE.Vector3(0, 12, 0));

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
    alpha: true,
  });
  renderer.setSize(VIEW.w, VIEW.h);
  renderer.setPixelRatio(Math.min(_dpr, TIER === "LOW" ? 1.0 : 1.7));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  mount.appendChild(renderer.domElement);

  // ═══════════════════════════════════════════════════════════════
  // SHADERS DE POST-PROCESS
  // ═══════════════════════════════════════════════════════════════
  const VERT_UV = `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
  `;

  const bloomRes = new THREE.Vector2(
    TIER === "LOW" ? VIEW.w * 0.5 : VIEW.w,
    TIER === "LOW" ? VIEW.h * 0.5 : VIEW.h,
  );
  const bloomPass = new THREE.UnrealBloomPass(bloomRes, 0.75, 0.45, 0.85);
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
      uniform float uRadius,uStrength,uActive,uAspect,uTime,uSpin,uPlunge,uRingBoost;
      varying vec2 vUv;
      void main(){
        if(uActive<0.001){ gl_FragColor=texture2D(tDiffuse,vUv); return; }
        vec2 d=vUv-uCenter; d.x*=uAspect;
        float r=length(d); float radius=max(uRadius,0.0007);
        vec2 dir=normalize(d+0.000001);
        vec2 screenDir=vec2(dir.x/uAspect,dir.y);
        float rSq=r*r; float radSq=radius*radius;
        float massDistortion=(radSq*uStrength*1.5)/max(rSq,radSq*0.1);
        massDistortion=clamp(massDistortion,0.0,r*mix(0.9,1.2,uPlunge));
        vec2 tangent=vec2(-screenDir.y,screenDir.x);
        float swirl=exp(-r*15.0)*uSpin*radius*0.4*sin(uTime*2.0);
        vec2 uv=vUv-screenDir*massDistortion*uActive+tangent*swirl;
        float chromaStr=massDistortion*mix(0.02,0.08,uPlunge);
        vec2 uvR=uv-screenDir*chromaStr*1.2;
        vec2 uvB=uv+screenDir*chromaStr*0.8;
        float colR=texture2D(tDiffuse,clamp(uvR,0.001,0.999)).r;
        float colG=texture2D(tDiffuse,clamp(uv, 0.001,0.999)).g;
        float colB=texture2D(tDiffuse,clamp(uvB,0.001,0.999)).b;
        vec3 col=vec3(colR,colG,colB);
        // IMPORTANTE: este pass agora é SOMENTE uma lente gravitacional sutil.
        // A versão anterior desenhava um buraco negro 2D em tela cheia por cima do mesh 3D.
        // O disco, o horizonte e os anéis passam a ser 100% geometry/shader 3D no buildBlackHole().
        float photonR=radius*2.15;
        float ringDist=abs(r-photonR);
        float photonIntensity=exp(-ringDist*34.0/radius)*uActive;
        vec3 ringCol=mix(vec3(1.0,0.36,0.10),vec3(0.45,0.76,1.0),0.5+0.5*sin(atan(d.y,d.x)+uTime));
        col+=ringCol*photonIntensity*(0.18+uRingBoost*0.28);
        float softCore=smoothstep(radius*0.18,radius*0.92,r);
        col*=mix(1.0,softCore,0.16*uActive*uPlunge);
        float plungeGlow=exp(-pow((r-radius*1.15)/(radius*0.72),2.0))*uPlunge;
        col+=vec3(0.22,0.48,0.82)*plungeGlow*0.18;
        gl_FragColor=vec4(max(col,vec3(0.0)),1.0);
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
      uniform float uStrength,uAspect; varying vec2 vUv;
      void main(){
        vec4 base=texture2D(tDiffuse,vUv);
        if(uStrength<0.001){gl_FragColor=base;return;}
        float dy=(vUv.y-uCenter.y)*uAspect;
        float streak=exp(-dy*dy*450.0)*exp(-abs(vUv.x-uCenter.x)*1.2);
        float halo=exp(-abs(dy)*220.0)*exp(-pow(vUv.x-uCenter.x,2.0)*2.5)*0.5;
        // Mantém flare cinematográfico, mas sem formar a barra branca 2D que escondia o volume.
        vec3 flare=(vec3(0.40,0.75,1.0)*streak+vec3(0.50,0.80,1.0)*halo)*(uStrength*1.25);
        gl_FragColor=vec4(base.rgb+flare,base.a);
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
      void main(){
        vec2 delta=vUv-uCenter;
        float warp=uAmount*pow(length(delta),1.5)*0.09;
        vec4 col=vec4(0.0); float tot=0.0;
        for(int i=0;i<26;i++){
          float t=float(i)/25.0;
          vec2 uv=clamp(uCenter+delta*(1.0-warp*t),0.001,0.999);
          float w=1.0-t*0.56; col+=texture2D(tDiffuse,uv)*w; tot+=w;
        }
        gl_FragColor=col/tot;
      }
    `,
  });

  const chromaPass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uStr: { value: 0.0 } },
    vertexShader: VERT_UV,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uStr; varying vec2 vUv;
      void main(){
        vec2 c=vUv-0.5; float d=length(c);
        vec2 off=c*d*d*uStr*2.8;
        float r=texture2D(tDiffuse,clamp(vUv-off*2.5,0.001,0.999)).r;
        float g=texture2D(tDiffuse,clamp(vUv-off*0.5,0.001,0.999)).g;
        float b=texture2D(tDiffuse,clamp(vUv+off*1.8,0.001,0.999)).b;
        gl_FragColor=vec4(r,g,b,1.0);
      }
    `,
  });

  const barrelPass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uStr: { value: 0.0 } },
    vertexShader: VERT_UV,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uStr; varying vec2 vUv;
      void main(){
        vec2 uv=vUv-0.5; float r2=dot(uv,uv);
        uv*=1.0+uStr*r2; uv+=0.5;
        if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){gl_FragColor=vec4(0,0,0,1);return;}
        gl_FragColor=texture2D(tDiffuse,uv);
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
      uniform sampler2D tDiffuse; uniform float uInt,uAspect,uOpen; varying vec2 vUv;
      void main(){
        vec4 c=texture2D(tDiffuse,vUv); vec2 uv=vUv-0.5; uv.x*=uAspect;
        float sc=mix(1.30,1.90,uOpen); float d=length(uv)*sc;
        float v=1.0-d*d*mix(uInt,uInt*0.25,uOpen);
        gl_FragColor=vec4(c.rgb*clamp(v,0.0,1.0),c.a);
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
  // ARRAY CENTRALIZADO DE MATERIAIS uT
  // ═══════════════════════════════════════════════════════════════
  const _allTimeMats = [];
  function regMat(mat) {
    if (mat?.uniforms?.uT) _allTimeMats.push(mat);
    return mat;
  }

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
    const mat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: { uT: { value: 0 }, uOpacity: { value: 1 } },
        vertexShader: `
        attribute float aSize; attribute float aTwk; uniform float uT; varying vec3 vC;
        void main(){
          vC=color;
          float tw=0.85+0.15*sin(uT*2.6+aTwk)*sin(uT*1.2+aTwk*2.1);
          vec4 mv=modelViewMatrix*vec4(position,1.0);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=(16.0/-mv.z)*aSize*tw;
        }
      `,
        fragmentShader: `
        varying vec3 vC; uniform float uOpacity;
        void main(){ vec2 p=gl_PointCoord-0.5; float d=dot(p,p)*4.0; float s=exp(-d*5.0); gl_FragColor=vec4(vC*s*uOpacity,s*0.50*uOpacity); }
      `,
      }),
    );
    return { pts: new THREE.Points(geo, mat), mat };
  }
  const bgStars = buildBgStars();
  scene.add(bgStars.pts);

  // ═══════════════════════════════════════════════════════════════
  // GALÁXIA HOSPEDEIRA — LENSE-THIRRING & CIENTÍFICA
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
    const pos = new Float32Array(N * 3),
      col = new Float32Array(N * 3);
    const seed = new Float32Array(N),
      size = new Float32Array(N);
    const temp = new Float32Array(N),
      region = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const i3 = i * 3,
        roll = Math.random();
      let r, theta, y, starClass, regionType;
      const isBulge = roll < 0.18,
        isArm = !isBulge && roll < 0.78;

      if (isBulge) {
        regionType = 0; // Pop II (Older, yellower)
        const br = Math.pow(Math.random(), 1.92) * cfg.BULGE_RADIUS;
        const a = Math.random() * Math.PI * 2;
        r = br * (0.45 + Math.random() * 0.75);
        theta = a + gaussianRandom() * 0.06;
        y =
          gaussianRandom() *
          cfg.BULGE_RADIUS *
          0.24 *
          Math.exp(-br / cfg.BULGE_RADIUS);
        starClass = weightedPick(STAR_CLASSES.oldBulge);
      } else if (isArm) {
        regionType = 1; // Pop I (Younger, hotter, blue/white)
        const armIndex = Math.floor(Math.random() * cfg.ARMS);
        const armPhase = (armIndex / cfg.ARMS) * Math.PI * 2;
        r = 16 + expDiskRadius(cfg.DISK_SCALE, cfg.RADIUS - 10);
        const baseTheta =
          Math.log(Math.max(r, r0) / r0) / Math.tan(pitch) + armPhase;
        const armTightness = THREE.MathUtils.lerp(
          0.42,
          0.95,
          saturate(r / cfg.RADIUS),
        );
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
        regionType = 2; // Field Disk
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
      pos[i3] = Math.cos(theta) * r + Math.cos(clusterAngle) * clusterNoise;
      pos[i3 + 1] = y;
      pos[i3 + 2] = Math.sin(theta) * r + Math.sin(clusterAngle) * clusterNoise;

      const c = new THREE.Color(starClass.color);
      if (regionType === 0) c.lerp(new THREE.Color(0xffb15b), 0.42);
      else if (regionType === 1 && Math.random() < 0.13)
        // Regiões H-II simuladas
        c.lerp(
          new THREE.Color(Math.random() < 0.5 ? 0x7fb4ff : 0xff3b7c),
          0.45,
        );
      
      const lj = 0.78 + Math.random() * 0.42;
      col[i3] = c.r * lj;
      col[i3 + 1] = c.g * lj;
      col[i3 + 2] = c.b * lj;
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

    const starMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uSpeed: { value: 1 },
          uTravel: { value: 0 },
          uSuck: { value: 0 },
          uFrameDrag: { value: 0 }, 
          uOpacity: { value: 1 },
          uCoreDimming: { value: 0 },
        },
        vertexShader: `
        uniform float uT, uSpeed, uTravel, uSuck, uFrameDrag;
        attribute vec3 aColor; attribute float aSeed, aSize, aTemp, aRegion;
        varying vec3 vColor; varying float vAlpha, vTemp, vTravel, vRegion, vDrag, vSeed;
        void main(){
          vec3 p=position; float radius=length(p.xz); float angle=atan(p.z,p.x);
          float orbital=0.34/(pow(radius*0.075+1.0,0.82));
          angle+=uT*orbital*(0.52+aSeed*0.18);
          
          float suck = smoothstep(0.0, 1.0, uSuck); 
          float drag = smoothstep(0.0, 1.0, uFrameDrag);
          
          float collapsedRadius=max(0.18, radius*mix(1.0, 0.018, pow(suck,1.75)));
          float currentRadius=mix(radius, collapsedRadius, suck);
          
          // Efeito Lense-Thirring
          angle += drag * (65.0 / (currentRadius + 0.5)) * (0.8 + aSeed * 0.4);
          
          p.x=cos(angle)*currentRadius; p.z=sin(angle)*currentRadius;
          p.y *= mix(1.0, 0.005, max(suck, drag)); 
          
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          float pulse=0.92+0.08*sin(uT*mix(1.1,3.8,aTemp)+aSeed*6.28318)*sin(uT*0.73+aSeed*21.0);
          float speedTravel=clamp(uSpeed/260.0,0.0,1.0);
          float travel=max(uTravel,speedTravel);
          float travelStretch=mix(1.0, 6.0, smoothstep(0.0,1.0,travel));
          
          float dragBoost = 1.0 + drag * 5.0; 
          gl_PointSize=clamp((72.0/-mv.z)*aSize*pulse*travelStretch*dragBoost, 0.25, 60.0);
          
          vColor=aColor; vAlpha=pulse; vTemp=aTemp; vTravel=travel; vRegion=aRegion; vDrag=drag; vSeed=aSeed;
        }
      `,
        fragmentShader: `
        precision highp float;
        uniform float uOpacity, uCoreDimming;
        varying vec3 vColor; varying float vAlpha, vTemp, vTravel, vRegion, vDrag, vSeed;
        void main(){
          vec2 p=gl_PointCoord*2.0-1.0; float r2=dot(p,p);
          if(r2>1.0) discard;
          float z=sqrt(max(0.0,1.0-r2)); vec3 n=normalize(vec3(p,z));
          float diffuse=max(dot(n,normalize(vec3(-0.35,0.42,0.82))),0.0);
          
          // Renderização Científica Diferenciada por População (vRegion)
          float rim=pow(1.0-z,2.4); 
          float coreFactor = vRegion == 0.0 ? 3.5 : 5.8; // Bojo = difuso, Braços = pontual
          float core=exp(-r2*coreFactor); 
          float glow=exp(-r2*1.35);
          float hotBloom=mix(0.85,1.75,vTemp);
          
          // Simulação de emissão H-II para jovens nos braços
          vec3 h2 = vec3(1.0, 0.1, 0.3) * step(0.95, fract(vSeed*13.0)) * step(0.5, vRegion) * step(vRegion, 1.5);
          
          vec3 c=vColor*(0.36+diffuse*0.74+rim*0.32)*hotBloom;
          c+=vColor*glow*0.28 + h2*glow*0.5; 
          c+=vec3(0.65,0.82,1.0)*core*vTemp*0.22;
          
          // Efeito Doppler / Blueshift
          if(vDrag > 0.0){
            vec3 blueshift = vec3(0.7, 0.9, 1.0) + core * vec3(1.0);
            c = mix(c, blueshift, vDrag * 0.85);
          }
          
          float travelAlpha=mix(core+glow*0.25,exp(-abs(p.y)*8.0)*exp(-abs(p.x)*1.8),vTravel);
          float alpha=travelAlpha*vAlpha*uOpacity;
          
          // Controle agressivo de dimming para isolar o Buraco Negro
          float isBulgeOrClose = step(vRegion, 0.5) + step(vTemp, 0.2);
          alpha*=mix(1.0,0.02,uCoreDimming*clamp(isBulgeOrClose,0.0,1.0));
          
          gl_FragColor=vec4(c*alpha,alpha);
        }
      `,
      }),
    );

    const stars = new THREE.Points(geo, starMat);
    grp.add(stars);

    const bulgeMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0.72 },
          uRevealBH: { value: 0 },
        },
        vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
        precision highp float;
        uniform float uT,uOpacity,uRevealBH; varying vec3 vP;
        void main(){
          float r=length(vP)/25.0; float core=exp(-r*r*2.2); float halo=exp(-r*1.6)*0.35;
          float pulse=0.93+0.07*sin(uT*0.42);
          vec3 c=mix(mix(vec3(1.0,0.70,0.30),vec3(0.65,0.20,0.07),smoothstep(0.0,1.15,r)),vec3(0.55,0.82,1.0),uRevealBH*core*0.18);
          // Ocultar agressivamente o bojo quando revelar o BH
          float a=(core+halo)*pulse*uOpacity*mix(1.0,0.02,pow(uRevealBH,1.5));
          gl_FragColor=vec4(c*a*1.7,a);
        }
      `,
      }),
    );
    const bulge = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.BULGE_RADIUS, 64, 64),
      bulgeMat,
    );
    bulge.scale.set(1.0, 0.56, 1.0);
    grp.add(bulge);

    const dust = buildGalaxyDustLayer(cfg);
    grp.add(dust.points);

    const nebMats = buildArmNebulae(grp, cfg);
    return { grp, stars, starMat, bulge, bulgeMat, dustMat: dust.mat, nebMats };
  }

  function buildGalaxyDustLayer(cfg) {
    const N = cfg.DUST_PARTICLES;
    const pitch = THREE.MathUtils.degToRad(cfg.PITCH_DEG),
      r0 = 4.2;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3),
      seed = new Float32Array(N),
      size = new Float32Array(N);
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
    const mat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0.42 },
          uTravel: { value: 0 },
        },
        vertexShader: `
        uniform float uT,uTravel; attribute float aSeed,aSize; varying float vSeed,vTravel;
        void main(){
          vec3 p=position; float r=length(p.xz); float a=atan(p.z,p.x);
          a+=uT*0.018/(r*0.018+1.0); p.x=cos(a)*r; p.z=sin(a)*r;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp((96.0/-mv.z)*aSize*mix(1.0,2.8,uTravel),0.3,58.0);
          vSeed=aSeed; vTravel=uTravel;
        }
      `,
        fragmentShader: `
        precision highp float; uniform float uOpacity; varying float vSeed,vTravel;
        void main(){
          vec2 p=gl_PointCoord-0.5; float d=dot(p,p)*4.0;
          float cloud=exp(-d*1.6);
          float grain=0.75+0.25*sin(vSeed*80.0+p.x*14.0+p.y*9.0);
          vec3 dustColor=mix(vec3(0.08,0.035,0.018),vec3(0.42,0.20,0.08),cloud);
          float a=cloud*grain*uOpacity*mix(1.0,0.36,vTravel);
          gl_FragColor=vec4(dustColor*a,a*0.58);
        }
      `,
      }),
    );
    return { points: new THREE.Points(geo, mat), mat };
  }

  function buildArmNebulae(parent, cfg) {
    const mats = [],
      pitch = THREE.MathUtils.degToRad(cfg.PITCH_DEG),
      r0 = 4.2;
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
          : new THREE.Vector3(1.0, 0.3, 0.55);
      const mat = regMat(
        new THREE.ShaderMaterial({
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
          vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
          fragmentShader: `
          precision highp float;
          uniform float uT,uOpacity,uTravel; uniform vec3 uColor; varying vec2 vUv;
          float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
          float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
          float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<5;i++){f+=w*n(p);p*=2.08;w*=0.5;}return f;}
          void main(){
            vec2 uv=vUv-0.5; float r=length(uv)*2.0;
            float n1=fbm(uv*3.2+vec2(uT*0.010,-uT*0.006));
            float n2=fbm(uv*7.4-vec2(uT*0.014,uT*0.008));
            float mask=smoothstep(1.0,0.06,r)*smoothstep(0.18,0.82,n1);
            float filaments=exp(-pow(abs(n2-0.62),0.36)*8.5)*n1;
            vec3 c=mix(uColor,vec3(1.0,0.86,0.72),filaments*0.42);
            float a=(mask*0.30+filaments*0.20)*uOpacity*mix(1.0,0.55,uTravel);
            gl_FragColor=vec4(c*a*2.6,a);
          }
        `,
        }),
      );
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
  // BURACO NEGRO — RIG 100% 3D REAL · SEM OVERLAY 2D · KERR VOLUMÉTRICO
  // ═══════════════════════════════════════════════════════════════
  function buildBlackHole() {
    const grp = new THREE.Group();
    grp.name = "KerrBlackHole_TRUE_3D_Rig_SEM_OVERLAY_2D";
    // Inclinação base: evita a leitura chapada/frontal e deixa o disco claramente tridimensional.
    grp.rotation.set(-0.18, 0.22, 0.035);
    scene.add(grp);

    const BH_SEG = TIER === "LOW" ? 64 : 128;
    const TORUS_SEG = TIER === "LOW" ? 192 : 512;
    const GAS_COUNT = TIER === "LOW" ? 190 : TIER === "MID" ? 360 : 560;

    const ctrl = {
      reveal: 0,
      spin: 0,
      plunge: 0,
      diskLift: 0,
    };

    const COL = {
      blue: new THREE.Vector3(0.22, 0.52, 1.0),
      cyan: new THREE.Vector3(0.50, 0.84, 1.0),
      amber: new THREE.Vector3(1.0, 0.54, 0.12),
      gold: new THREE.Vector3(1.0, 0.78, 0.34),
      red: new THREE.Vector3(0.86, 0.09, 0.035),
      violet: new THREE.Vector3(0.62, 0.26, 1.0),
    };

    function makeVolumeShellMaterial(colorA, colorB, fresnelPower, alphaMul) {
      return regMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          depthTest: true,
          side: THREE.FrontSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uT: { value: 0 },
            uOpacity: { value: 0 },
            uSpin: { value: 0 },
            uPlunge: { value: 0 },
            uColorA: { value: colorA },
            uColorB: { value: colorB },
          },
          vertexShader: `
            uniform float uT, uSpin, uPlunge;
            varying vec3 vN;
            varying vec3 vView;
            varying vec3 vObj;
            void main(){
              vec3 p = position;
              float a = atan(p.z, p.x);
              float r = length(p.xz);
              float twist = sin(r * 0.34 + uT * 0.55 + a * 2.0) * 0.035 * uSpin;
              float c = cos(twist);
              float s = sin(twist);
              p.xz = mat2(c,-s,s,c) * p.xz;
              p *= 1.0 + 0.012 * sin(uT * 1.4 + a * 5.0) * uPlunge;
              vObj = p;
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              vView = -mv.xyz;
              vN = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            precision highp float;
            uniform float uT, uOpacity, uSpin, uPlunge;
            uniform vec3 uColorA, uColorB;
            varying vec3 vN;
            varying vec3 vView;
            varying vec3 vObj;
            void main(){
              vec3 n = normalize(vN);
              vec3 v = normalize(vView);
              vec3 o = normalize(vObj);
              float mu = max(dot(n, v), 0.0);
              float fresnel = pow(1.0 - mu, ${fresnelPower.toFixed(2)});
              float equator = exp(-abs(o.y) * 9.0);
              float polar = 1.0 - exp(-pow(abs(o.y) * 2.8, 1.65));
              float a = atan(vObj.z, vObj.x);
              float frameDrag = 0.5 + 0.5 * sin(a * 8.0 - uT * (1.0 + uSpin * 2.6) + length(vObj.xz) * 0.95);
              float turbulence = 0.5 + 0.5 * sin(a * 17.0 - uT * (2.1 + uSpin * 4.0) + equator * 2.5);
              float shear = mix(0.82, 1.24, frameDrag * 0.68 + turbulence * 0.32);
              float opticalDepth = equator * (1.35 + uPlunge * 0.52) + fresnel * 0.58;
              float synch = pow(max(dot(normalize(vec3(-o.z, 0.0, o.x) + 1e-5), v), 0.0), 2.6) * (0.28 + equator * 0.72);
              float pulse = 0.92 + 0.08 * sin(uT * 1.55 + a * 2.8 + turbulence * 1.4);
              vec3 col = mix(uColorA, uColorB, clamp(frameDrag * 0.76 + polar * 0.24, 0.0, 1.0));
              col += uColorB * fresnel * 0.18;
              col += mix(uColorA, uColorB, 0.5) * synch * 0.55;
              float alpha = (opticalDepth * 0.40 + fresnel * 0.36 + equator * 0.10 + synch * 0.22) * shear * pulse * uOpacity * ${alphaMul.toFixed(2)} * (0.44 + uPlunge * 0.32);
              gl_FragColor = vec4(col * alpha * 1.22, alpha * 0.38);
            }
          `,
        }),
      );
    }

    // 1) Horizonte de eventos: esfera física 3D, escura, oblíqua e com rim Fresnel.
    const horizonMat = regMat(
      new THREE.ShaderMaterial({
        transparent: false,
        depthWrite: true,
        depthTest: true,
        uniforms: {
          uT: { value: 0 },
          uSpin: { value: 0 },
          uPlunge: { value: 0 },
        },
        vertexShader: `
          uniform float uT, uSpin, uPlunge;
          varying vec3 vN;
          varying vec3 vView;
          varying vec3 vObj;
          void main(){
            vec3 p = position;
            float a = atan(p.z, p.x);
            float r = length(p.xz);
            float twist = (1.0 - smoothstep(0.0, ${EH_R.toFixed(3)}, r)) * (0.10 + uSpin * 0.08);
            float c = cos(twist);
            float s = sin(twist);
            p.xz = mat2(c,-s,s,c) * p.xz;
            p.y *= 0.82 + 0.035 * sin(uT * 1.3 + a * 4.0) * uPlunge;
            vObj = p;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vView = -mv.xyz;
            vN = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uT, uSpin, uPlunge;
          varying vec3 vN;
          varying vec3 vView;
          varying vec3 vObj;
          void main(){
            vec3 n = normalize(vN);
            vec3 v = normalize(vView);
            float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.4);
            float equator = exp(-abs(normalize(vObj).y) * 20.0);
            float a = atan(vObj.z, vObj.x);
            float kerr = equator * (0.45 + 0.55 * sin(a * 8.0 - uT * (2.0 + uSpin * 3.0)));
            vec3 abyss = vec3(0.0, 0.0, 0.0);
            vec3 coldEdge = vec3(0.015, 0.032, 0.055) * fresnel * (0.5 + uSpin);
            vec3 redEdge = vec3(0.12, 0.028, 0.008) * kerr * 0.045 * (0.35 + uPlunge);
            gl_FragColor = vec4(abyss + coldEdge + redEdge, 1.0);
          }
        `,
      }),
    );
    const horizon = new THREE.Mesh(new THREE.SphereGeometry(EH_R, BH_SEG, BH_SEG), horizonMat);
    horizon.name = "EventHorizon_Oblate_3D";
    horizon.scale.set(1.24, 0.80, 1.24);
    horizon.renderOrder = 9;
    grp.add(horizon);

    // 2) Ergosfera e halos: volumes esféricos reais envolvendo o centro.
    const ergosphereMat = makeVolumeShellMaterial(COL.blue, COL.amber, 2.1, 1.0);
    const ergosphere = new THREE.Mesh(new THREE.SphereGeometry(BH_SCALE.ERGOSPHERE, BH_SEG, BH_SEG), ergosphereMat);
    ergosphere.name = "Ergosphere_Volume_3D";
    ergosphere.scale.set(1.38, 0.68, 1.38);
    ergosphere.renderOrder = 4;
    grp.add(ergosphere);

    const coronaMat = makeVolumeShellMaterial(COL.cyan, COL.blue, 2.85, 0.82);
    const corona = new THREE.Mesh(new THREE.SphereGeometry(DISK_OUT * 0.46, BH_SEG, BH_SEG), coronaMat);
    corona.name = "Corona_Spherical_Volume_3D";
    corona.scale.set(1.02, 0.42, 1.02);
    corona.renderOrder = 2;
    grp.add(corona);

    const haloMat = makeVolumeShellMaterial(COL.violet, COL.cyan, 4.0, 0.62);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(DISK_OUT * 0.72, BH_SEG, BH_SEG), haloMat);
    halo.name = "Gravitational_Lensing_Halo_3D";
    halo.scale.set(1.12, 0.46, 1.12);
    halo.renderOrder = 1;
    grp.add(halo);

    // 3) Disco de acreção: camadas tubulares 3D, não RingGeometry/PlaneGeometry.
    const diskMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uSpin: { value: 0 },
          uPlunge: { value: 0 },
          uDiskLift: { value: 0 },
        },
        vertexShader: `
          uniform float uT, uSpin, uPlunge, uDiskLift;
          varying vec3 vPos;
          varying vec3 vNormalW;
          varying float vRad;
          varying float vTube;
          varying float vLayer;
          void main(){
            vec3 p = position;
            float rad = length(p.xy);
            float a = atan(p.y, p.x);
            float shear = (2.2 / (pow(max(rad, 0.2), 0.72))) * uSpin;
            float c = cos(shear);
            float s = sin(shear);
            p.xy = mat2(c,-s,s,c) * p.xy;
            float verticalWave = sin(a * 3.0 + uT * 0.9) * 0.035 + sin(a * 7.0 - uT * 1.25) * 0.018;
            p.z += verticalWave * (0.4 + uSpin + uDiskLift);
            p.z *= 1.0 + uDiskLift * 0.85 + uPlunge * 1.15;
            vPos = p;
            vRad = rad;
            vTube = abs(p.z);
            vLayer = position.z;
            vNormalW = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uT, uOpacity, uSpin, uPlunge, uDiskLift;
          varying vec3 vPos;
          varying vec3 vNormalW;
          varying float vRad;
          varying float vTube;
          varying float vLayer;

          float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
          float n(vec2 p){
            vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
            return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);
          }
          float fbm(vec2 p){
            float f=0.0,w=0.5;
            for(int i=0;i<6;i++){f+=w*n(p);p*=2.07;w*=0.5;}
            return f;
          }
          void main(){
            float rad = max(vRad, 0.001);
            float a = atan(vPos.y, vPos.x);
            float orbit = 2.9 / (pow(rad, 1.45) + 0.15);
            float swirl = a + uT * orbit * (1.0 + uSpin * 0.85);

            float beta = clamp(0.70 * sqrt(${DISK_IN.toFixed(3)} / rad), 0.0, 0.94);
            float cosTheta = sin(a - 0.60);
            float doppler = sqrt(1.0 - beta * beta) / max(0.075, 1.0 - beta * cosTheta);
            float beam = pow(doppler, 3.15);

            float inner = smoothstep(${DISK_IN.toFixed(3)}, ${(DISK_IN + 0.65).toFixed(3)}, rad);
            float outer = 1.0 - smoothstep(${(DISK_OUT - 3.8).toFixed(3)}, ${DISK_OUT.toFixed(3)}, rad);
            float radialMask = inner * outer;

            float tubeCore = exp(-pow(vTube * 3.1, 2.0));
            float tubeGlow = exp(-pow(vTube * 0.86, 2.0)) * 0.22;
            float volume = max(tubeCore, tubeGlow * (0.7 + uDiskLift));

            vec2 uv = vec2(rad * 1.12, swirl * 1.18);
            float gas = fbm(uv + vec2(uT * 0.025, -uT * 0.04));
            float filaments = fbm(uv * 3.4 + vec2(-uT * 0.10, uT * 0.03));
            float rings = 0.5 + 0.5 * sin(rad * 5.4 - uT * 0.58 + filaments * 3.0);
            rings *= 0.5 + 0.5 * sin(rad * 13.5 + gas * 4.0);

            float density = radialMask * volume * (gas * 0.60 + filaments * 0.32 + rings * 0.22);
            float temp = clamp(${(DISK_IN * 1.55).toFixed(3)} / rad, 0.0, 1.0) * doppler;
            float gravRed = smoothstep(${DISK_IN.toFixed(3)}, ${(DISK_IN + 3.5).toFixed(3)}, rad);

            vec3 red = vec3(0.50, 0.045, 0.020);
            vec3 amber = vec3(1.0, 0.42, 0.09);
            vec3 gold = vec3(1.0, 0.78, 0.34);
            vec3 blue = vec3(0.46, 0.76, 1.0);
            vec3 col = mix(red, amber, smoothstep(0.08, 0.36, temp));
            col = mix(col, gold, smoothstep(0.30, 0.62, temp));
            col = mix(col, blue, smoothstep(0.66, 1.12, temp));
            col *= mix(1.38, 0.72, gravRed) * beam;

            float photonLift = exp(-pow((rad - ${PHOTON_R.toFixed(3)}) * 1.5, 2.0)) * (0.28 + uPlunge * 0.8);
            col += vec3(0.52,0.82,1.0) * photonLift;

            float alpha = density * uOpacity * (0.78 + beam * 0.18);
            gl_FragColor = vec4(col * alpha * 2.35, alpha);
          }
        `,
      }),
    );

    const disk = new THREE.Group();
    disk.name = "AccretionDisk_MULTI_TORUS_3D";
    const diskLayers = [
      { major: (DISK_IN + 3.2) * 0.5, minor: 1.25, z: 0.34, sx: 1.02, sy: 0.94 },
      { major: (DISK_IN + DISK_OUT) * 0.35, minor: 2.25, z: 0.26, sx: 1.05, sy: 0.90 },
      { major: (DISK_IN + DISK_OUT) * 0.50, minor: 3.65, z: 0.19, sx: 1.08, sy: 0.86 },
      { major: (DISK_IN + DISK_OUT) * 0.66, minor: 4.85, z: 0.145, sx: 1.12, sy: 0.82 },
    ];
    diskLayers.forEach((layer, i) => {
      const geo = new THREE.TorusGeometry(layer.major, layer.minor, 52, TORUS_SEG);
      geo.scale(layer.sx, layer.sy, layer.z);
      const mesh = new THREE.Mesh(geo, diskMat);
      mesh.name = `AccretionDiskLayer_${i + 1}_3D`;
      mesh.rotation.x = Math.PI / 2.05;
      mesh.rotation.z = i * 0.08;
      mesh.renderOrder = 3;
      disk.add(mesh);
    });
    grp.add(disk);

    // 4) Arco lenteado: tubos curvos em 3D, passando atrás/por cima do horizonte.
    const lensedDiskMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uSpin: { value: 0 },
          uPlunge: { value: 0 },
        },
        vertexShader: `
          uniform float uT, uSpin, uPlunge;
          varying vec3 vPos;
          varying vec2 vUv;
          void main(){
            vec3 p = position;
            float a = atan(p.z, p.x);
            p.y += sin(a * 2.0 + uT * 0.55) * 0.025 * (0.4 + uSpin);
            p *= 1.0 + 0.018 * sin(uT * 1.2 + a * 3.0) * uPlunge;
            vPos = p;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uT, uOpacity, uSpin, uPlunge;
          varying vec3 vPos;
          varying vec2 vUv;
          void main(){
            float a = atan(vPos.z, vPos.x);
            float axial = smoothstep(0.0, 1.0, vUv.x);
            float approach = 0.5 + 0.5 * sin(a - 0.42);
            float pulse = 0.72 + 0.28 * sin(a * 9.5 - uT * (2.2 + uSpin * 2.8));
            float tube = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.1);
            float caustic = pow(sin(vUv.x * 3.14159265), 1.55) * pow(1.0 - abs(vUv.y - 0.5) * 2.0, 0.8);
            float doppler = mix(0.68, 1.42, pow(approach, 1.2));
            vec3 receding = vec3(1.0, 0.38, 0.06);
            vec3 hot = vec3(1.0, 0.74, 0.22);
            vec3 approaching = vec3(0.56, 0.84, 1.0);
            vec3 col = mix(receding, hot, smoothstep(0.0, 0.46, axial));
            col = mix(col, approaching, pow(approach, 1.15));
            col += vec3(0.72, 0.90, 1.0) * caustic * 0.35;
            float alpha = tube * (0.58 + caustic * 0.95) * pulse * uOpacity * (0.72 + uPlunge * 0.35);
            gl_FragColor = vec4(col * doppler * alpha * 4.9, alpha * 0.9);
          }
        `,
      }),
    );

    const lensedDisk = new THREE.Group();
    lensedDisk.name = "LensedAccretionArcs_TUBE_3D";
    function makeArcTube(radius, yLift, zDepth, startA, endA, tubeR, name, tilt) {
      const pts = [];
      const STEPS = 94;
      for (let i = 0; i <= STEPS; i++) {
        const k = i / STEPS;
        const a = startA + (endA - startA) * k;
        const y = Math.sin(k * Math.PI) * yLift;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius + zDepth));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, STEPS, tubeR, 14, false);
      const mesh = new THREE.Mesh(geo, lensedDiskMat);
      mesh.name = name;
      mesh.rotation.x = tilt;
      mesh.renderOrder = 8;
      lensedDisk.add(mesh);
      return mesh;
    }
    makeArcTube(DISK_OUT * 0.46, 1.25, -0.35, -Math.PI * 0.95, Math.PI * 0.95, 0.040, "BackLensedArc_Main_3D", 0.12);
    makeArcTube(DISK_OUT * 0.37, 0.95, -0.20, -Math.PI * 0.78, Math.PI * 0.82, 0.026, "BackLensedArc_Inner_3D", 0.10);
    makeArcTube(DISK_OUT * 0.58, 1.72, -0.55, -Math.PI * 0.88, Math.PI * 0.88, 0.024, "BackLensedArc_Outer_3D", 0.15);
    grp.add(lensedDisk);

    // 5) Esfera de fótons e ISCO: múltiplos torus 3D inclinados, formando volume orbital.
    const photonMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uSpin: { value: 0 },
          uPlunge: { value: 0 },
        },
        vertexShader: `
          uniform float uT, uSpin, uPlunge;
          varying vec2 vUv;
          varying vec3 vPos;
          void main(){
            vec3 p = position;
            float a = atan(p.y, p.x);
            p *= 1.0 + 0.035 * sin(uT * 2.2 + a * 5.0) * (0.5 + uSpin + uPlunge);
            vUv = uv;
            vPos = p;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uT, uOpacity, uSpin, uPlunge;
          varying vec2 vUv;
          varying vec3 vPos;
          void main(){
            float a = atan(vPos.y, vPos.x);
            float tube = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 3.4);
            float interference = 0.62 + 0.38 * sin(a * 18.0 - uT * (5.0 + uSpin * 4.0));
            float doppler = 0.5 + 0.5 * sin(a - 0.55);
            vec3 c = mix(vec3(1.0,0.42,0.08), vec3(0.65,0.90,1.0), doppler);
            c = mix(c, vec3(1.0), pow(tube, 6.0) * 0.32);
            float alpha = tube * interference * uOpacity * (0.85 + uPlunge * 0.7);
            gl_FragColor = vec4(c * alpha * 7.6, alpha);
          }
        `,
      }),
    );

    const photonRing = new THREE.Group();
    photonRing.name = "PhotonSphere_MULTI_RING_3D";
    const photonGeo = new THREE.TorusGeometry(PHOTON_R * 1.12, 0.032, 28, TORUS_SEG);
    const photonTilts = [0, Math.PI * 0.36, -Math.PI * 0.36, Math.PI * 0.5];
    photonTilts.forEach((tilt, i) => {
      const ring = new THREE.Mesh(photonGeo, photonMat);
      ring.name = `PhotonOrbit_${i + 1}_3D`;
      ring.rotation.x = Math.PI / 2.05 + tilt;
      ring.rotation.y = i * 0.16;
      ring.scale.set(1.18 + i * 0.025, 1.0, 1.0);
      ring.renderOrder = 10;
      photonRing.add(ring);
    });
    grp.add(photonRing);

    const iscoMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uSpin: { value: 0 },
          uPlunge: { value: 0 },
        },
        vertexShader: `
          uniform float uT, uSpin;
          varying vec2 vUv;
          varying vec3 vPos;
          void main(){
            vec3 p = position;
            float a = atan(p.y, p.x);
            p.z += sin(a * 6.0 + uT * 2.0) * 0.022 * (0.3 + uSpin);
            vUv = uv;
            vPos = p;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uT, uOpacity, uSpin;
          varying vec2 vUv;
          varying vec3 vPos;
          void main(){
            float a = atan(vPos.y, vPos.x);
            float tube = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.7);
            float dash = smoothstep(0.18, 1.0, 0.5 + 0.5 * sin(a * 34.0 - uT * (2.8 + uSpin)));
            vec3 col = mix(vec3(1.0,0.28,0.06), vec3(0.34,0.74,1.0), dash);
            float alpha = tube * (0.38 + dash * 0.62) * uOpacity;
            gl_FragColor = vec4(col * alpha * 4.2, alpha * 0.82);
          }
        `,
      }),
    );
    const iscoRing = new THREE.Group();
    iscoRing.name = "ISCO_MULTI_TORUS_3D";
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(ISCO_R * (1.65 + i * 0.22), 0.017, 20, TORUS_SEG), iscoMat);
      ring.rotation.x = Math.PI / 2.05 + (i - 1) * 0.08;
      ring.rotation.y = (i - 1) * 0.13;
      ring.renderOrder = 7;
      iscoRing.add(ring);
    }
    grp.add(iscoRing);

    // 6) Hotspots: esferas reais orbitando em profundidade.
    const hotspotMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uSpin: { value: 0 },
          uPlunge: { value: 0 },
        },
        vertexShader: `
          uniform float uT, uSpin, uPlunge;
          varying vec3 vN;
          varying vec3 vView;
          varying float vPulse;
          void main(){
            vec3 p = position;
            vPulse = 0.82 + 0.18 * sin(uT * (4.0 + uSpin * 2.0) + position.x * 12.0);
            p *= 0.92 + vPulse * 0.14 + uPlunge * 0.08;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vView = -mv.xyz;
            vN = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uOpacity;
          varying vec3 vN;
          varying vec3 vView;
          varying float vPulse;
          void main(){
            vec3 n = normalize(vN);
            vec3 v = normalize(vView);
            float light = max(dot(n, normalize(vec3(-0.25, 0.42, 0.86))), 0.0);
            float rim = pow(1.0 - max(dot(n, v), 0.0), 2.0);
            vec3 col = mix(vec3(1.0,0.30,0.07), vec3(0.70,0.92,1.0), rim);
            float alpha = (0.42 + light * 0.82 + rim * 1.25) * uOpacity * vPulse;
            gl_FragColor = vec4(col * alpha * 2.9, alpha * 0.84);
          }
        `,
      }),
    );
    const hotspotGrp = new THREE.Group();
    hotspotGrp.name = "HotspotSpheres_Orbiting_3D";
    const hotspotGeo = new THREE.SphereGeometry(0.095, 18, 18);
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 + rnd(-0.14, 0.14);
      const r = rnd(DISK_IN + 0.62, DISK_IN + 4.6);
      const h = new THREE.Mesh(hotspotGeo, hotspotMat);
      h.position.set(Math.cos(a) * r, rnd(-0.42, 0.42), Math.sin(a) * r);
      h.scale.setScalar(rnd(0.78, 1.7));
      hotspotGrp.add(h);
    }
    grp.add(hotspotGrp);

    // 7) Volume de gás: InstancedMesh de microesferas 3D no disco, sincronizado com a opacidade do disco.
    const gasMat = new THREE.MeshBasicMaterial({
      color: 0xffb15f,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const gasGeo = new THREE.SphereGeometry(0.055, 10, 10);
    const gasVolume = new THREE.InstancedMesh(gasGeo, gasMat, GAS_COUNT);
    gasVolume.name = "AccretionGasMicroSpheres_Instanced_3D";
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s3 = new THREE.Vector3();
    const p3 = new THREE.Vector3();
    for (let i = 0; i < GAS_COUNT; i++) {
      const r = rnd(DISK_IN + 0.65, DISK_OUT * 0.92);
      const a = Math.random() * Math.PI * 2;
      const y = gaussianRandom() * THREE.MathUtils.lerp(0.08, 0.62, r / DISK_OUT);
      p3.set(Math.cos(a) * r, y, Math.sin(a) * r);
      s3.setScalar(rnd(0.45, 1.55) * THREE.MathUtils.lerp(1.2, 0.55, r / DISK_OUT));
      q.setFromEuler(new THREE.Euler(rnd(-0.3, 0.3), rnd(0, Math.PI), rnd(-0.3, 0.3)));
      m4.compose(p3, q, s3);
      gasVolume.setMatrixAt(i, m4);
    }
    gasVolume.instanceMatrix.needsUpdate = true;
    gasVolume.renderOrder = 6;
    grp.add(gasVolume);

    // 8) Jatos relativísticos: cones/cilindros 3D no eixo polar.
    function makeJetMaterial(colorA, colorB) {
      return regMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uT: { value: 0 },
            uOpacity: { value: 0 },
            uSpin: { value: 0 },
            uPlunge: { value: 0 },
            uColorA: { value: colorA },
            uColorB: { value: colorB },
          },
          vertexShader: `
            uniform float uT, uSpin, uPlunge;
            varying vec3 vPos;
            varying vec2 vUv;
            void main(){
              vec3 p = position;
              float yN = position.y / 12.0;
              float swirl = sin(yN * 8.0 + uT * 2.25) * 0.10 * (0.4 + uSpin);
              float c = cos(swirl);
              float s = sin(swirl);
              p.xz = mat2(c,-s,s,c) * p.xz;
              p.x += sin(yN * 10.0 + uT * 3.6) * 0.04 * uPlunge;
              p.z += cos(yN * 9.0 - uT * 2.8) * 0.04 * uPlunge;
              vPos = p;
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }
          `,
          fragmentShader: `
            precision highp float;
            uniform float uT, uOpacity, uSpin, uPlunge;
            uniform vec3 uColorA, uColorB;
            varying vec3 vPos;
            varying vec2 vUv;
            void main(){
              float axial = smoothstep(-12.0, 12.0, vPos.y);
              float radius = length(vPos.xz);
              float core = exp(-radius * radius * 11.0);
              float sheath = exp(-radius * radius * 2.2) * 0.30;
              float knots = 0.70 + 0.30 * sin(axial * 44.0 - uT * (5.0 + uSpin * 3.0));
              vec3 col = mix(uColorA, uColorB, axial);
              float alpha = (core + sheath) * knots * uOpacity * (0.72 + uPlunge * 0.72);
              gl_FragColor = vec4(col * alpha * 2.55, alpha * 0.56);
            }
          `,
        }),
      );
    }
    const jetMatA = makeJetMaterial(COL.blue, COL.cyan);
    const jetMatB = makeJetMaterial(COL.violet, COL.cyan);
    const jetGeo = new THREE.ConeGeometry(1.65, 24, 52, 18, true);
    const jetA = new THREE.Mesh(jetGeo, jetMatA);
    jetA.name = "NorthRelativisticJet_TRUE_3D";
    jetA.position.y = 13.6;
    jetA.scale.set(0.32, 1.0, 0.32);
    grp.add(jetA);
    const jetB = new THREE.Mesh(jetGeo, jetMatB);
    jetB.name = "SouthRelativisticJet_TRUE_3D";
    jetB.position.y = -13.6;
    jetB.rotation.z = Math.PI;
    jetB.scale.set(0.24, 0.82, 0.24);
    grp.add(jetB);

    // 9) Campo magnético: tubos/toroides 3D, não textura plana.
    const magLines = new THREE.Group();
    magLines.name = "MagneticField_TorusKnots_3D";
    const magMats = [];
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: [0x2aa2f6, 0xa960ee, 0xff9d42][i % 3],
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const geo = new THREE.TorusKnotGeometry(
        3.0 + i * 0.48,
        0.006 + i * 0.0013,
        TIER === "LOW" ? 112 : 220,
        8,
        2 + (i % 2),
        3,
      );
      const line = new THREE.Mesh(geo, mat);
      line.rotation.x = Math.PI * (0.20 + i * 0.048);
      line.rotation.y = Math.PI * (0.12 + i * 0.082);
      line.scale.set(1.0, 0.50 + i * 0.035, 1.0);
      magLines.add(line);
      magMats.push(mat);
    }
    grp.add(magLines);

    return {
      grp,
      ctrl,
      horizon,
      horizonMat,
      ergosphere,
      ergosphereMat,
      disk,
      diskMat,
      lensedDisk,
      lensedDiskMat,
      photonRing,
      photonMat,
      iscoRing,
      iscoMat,
      corona,
      coronaMat,
      halo,
      haloMat,
      hotspotGrp,
      hotspotMat,
      gasVolume,
      gasMat,
      jetA,
      jetB,
      jetMatA,
      jetMatB,
      magLines,
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
      rn = new Float32Array(N * 2);
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
      rn[i * 2] = Math.random();
      rn[i * 2 + 1] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aRnd", new THREE.BufferAttribute(rn, 2));
    const pMat = regMat(
      new THREE.ShaderMaterial({
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
          gl_PointSize=(34.0/-mv.z)*(0.3+aRnd.x*1.2)*(1.0+ch*3.0); vA=0.32+0.68*ch;
        }
      `,
        fragmentShader: `
        uniform float uOpacity; varying vec3 vC; varying float vA;
        void main(){
          float d=dot(gl_PointCoord-0.5,gl_PointCoord-0.5)*4.0; float s=exp(-d*5.2);
          gl_FragColor=vec4(vC*s*uOpacity*2.4,s*vA*uOpacity);
        }
      `,
      }),
    );
    BH.grp.add(new THREE.Points(geo, pMat));

    const SN = 12000,
      sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(SN * 3),
      sRnd = new Float32Array(SN * 2);
    for (let i = 0; i < SN; i++) {
      const t = i / SN,
        r2 =
          DISK_OUT * 0.9 -
          t * (DISK_OUT * 0.9 - DISK_IN) +
          (Math.random() - 0.5) * 3;
      const ang = -t * Math.PI * 4.5 + (Math.random() - 0.5) * 0.8;
      sPos[i * 3] = Math.cos(ang) * r2;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      sPos[i * 3 + 2] = Math.sin(ang) * r2;
      sRnd[i * 2] = Math.random();
      sRnd[i * 2 + 1] = Math.random();
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute("aRnd", new THREE.BufferAttribute(sRnd, 2));
    const sMat = regMat(
      new THREE.ShaderMaterial({
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
      }),
    );
    BH.grp.add(new THREE.Points(sGeo, sMat));

    const gwMats = [];
    for (let gw = 0; gw < 8; gw++) {
      const m = regMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uT: { value: 0 },
            uOpacity: { value: 0 },
            uPh: { value: gw / 8 },
          },
          vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
          fragmentShader: `
          uniform float uT,uOpacity,uPh; varying vec2 vUv;
          void main(){
            float r=length(vUv-0.5)*2.0; float ph=mod(uT*0.2+uPh,1.0);
            float ring=exp(-pow((r-(0.1+ph*0.9))/0.035,2.0)*6.0)*(1.0-ph);
            vec3 c=mix(vec3(0.7,0.5,1.0),vec3(0.3,0.6,1.0),ph);
            gl_FragColor=vec4(c*ring*uOpacity*1.2,ring*uOpacity*0.65);
          }
        `,
        }),
      );
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
  // TÚNEL DE SINGULARIDADE — DISTORÇÃO DE ESPAÇO TEMPO APLICADA
  // ═══════════════════════════════════════════════════════════════
  function buildTunnel() {
    const N = Math.round(52000 * TIER_FACTOR),
      geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3),
      col = new Float32Array(N * 3),
      rn = new Float32Array(N);
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
        lO = lane * 0.785398,
        sp = a + lO * 0.18;
      const r =
        6 + Math.pow(Math.random(), 0.34) * 330 + Math.sin(lO * 3.0) * 8;
      pos[i * 3] = Math.cos(sp) * r;
      pos[i * 3 + 1] = Math.sin(sp) * r;
      pos[i * 3 + 2] = -Math.random() * 8600;
      const p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      col[i * 3] = p[0] / 255;
      col[i * 3 + 1] = p[1] / 255;
      col[i * 3 + 2] = p[2] / 255;
      rn[i] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aRnd", new THREE.BufferAttribute(rn, 1));
    const mat = regMat(
      new THREE.ShaderMaterial({
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
        attribute float aRnd; uniform float uT,uSpeed,uTwist;
        varying vec3 vC; varying float vA,vRad,vAngle,vGate,vSpeed,vLens,vDepth;
        void main(){
          vec3 p=position; float speedNorm=clamp(uSpeed/520.0,0.0,1.0);
          float zFlow=mod(abs(p.z)-uSpeed*(1.45+aRnd*0.92),8600.0); p.z=-zFlow;
          float z01=clamp(abs(p.z)/8600.0,0.0,1.0);
          float gravWell=1.0-smoothstep(0.0,1.0,z01);
          float r=length(p.xy); float a=atan(p.y,p.x);
          float helix=uT*mix(0.06,0.28,speedNorm)+uTwist*p.z*0.000075+sin(p.z*0.0025+uT*0.95+aRnd*6.28318)*0.24*speedNorm;
          a+=helix+sin(r*0.035-uT*1.8+p.z*0.0015)*0.04*speedNorm;
          float radialPulse=sin(p.z*0.007-uT*2.6+aRnd*18.0)*0.06;
          float pinch=(0.10+0.55*speedNorm)*(0.35+gravWell*0.85);
          float lensing=1.0-pinch/(1.0+r*0.032);
          float tidal=1.0+radialPulse+sin(a*6.0-uT*2.1)*0.028*speedNorm;
          r*=max(0.12,lensing)*tidal;
          p.x=cos(a)*r + sin(p.z*0.004+a*2.0)*0.18*(0.6+gravWell*1.4)*speedNorm;
          p.y=sin(a)*r + cos(p.z*0.004-a*2.0)*0.18*(0.6+gravWell*1.4)*speedNorm;
          float timeWarp=sin(p.z*0.005-uT*8.0)*0.55*speedNorm;
          p.xy*=1.0+timeWarp/(r*0.026+1.0);
          p.xy*=mix(1.0,0.72,gravWell*speedNorm);
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          float gate=smoothstep(260.0,-260.0,p.z);
          float cathedral=0.55+0.45*pow(abs(sin(r*0.055-uT*2.4)),3.0);
          gl_PointSize=(138.0/-mv.z)*(0.72+aRnd*1.8)*mix(0.95,3.6,speedNorm)*cathedral*mix(0.85,1.35,gravWell);
          vC=color; vA=gate; vRad=clamp(r/330.0,0.0,1.0); vAngle=a; vGate=cathedral; vSpeed=speedNorm; vLens=gravWell; vDepth=z01;
        }
      `,
        fragmentShader: `
        uniform float uOpacity; varying vec3 vC; varying float vA,vRad,vAngle,vGate,vSpeed,vLens,vDepth;
        void main(){
          vec2 p=gl_PointCoord-0.5; float ca=cos(vAngle),sa=sin(vAngle);
          vec2 q=mat2(ca,-sa,sa,ca)*p;
          float core=exp(-dot(p,p)*22.0);
          float streak=exp(-abs(q.y)*mix(30.0,8.0,vSpeed))*exp(-abs(q.x)*mix(9.0,1.8,vSpeed));
          float halo=exp(-dot(p,p)*4.2)*mix(0.16,0.32,vLens);
          float ring=exp(-pow(length(p)-0.36,2.0)*42.0)*0.18*vLens;
          float lensBloom=exp(-abs(q.y)*8.5)*exp(-abs(q.x)*2.2)*0.22*vLens*vSpeed;
          float a=(core*0.74+streak*0.95+halo+ring+lensBloom)*vA*uOpacity*vGate;
          vec3 blueShift=vec3(0.45,0.78,1.0),violetShift=vec3(0.72,0.35,1.0),redShift=vec3(1.0,0.26,0.08),goldShift=vec3(1.0,0.72,0.22);
          vec3 gravTint=mix(vec3(0.55,0.86,1.0),vec3(1.0,0.72,0.22),vLens*0.65);
          vec3 edgeColor=mix(violetShift,redShift,smoothstep(0.45,1.0,vRad));
          vec3 centerColor=mix(blueShift,goldShift,pow(1.0-vRad,2.5));
          vec3 c=mix(vC,mix(centerColor,edgeColor,vRad),0.72);
          c=mix(c,gravTint,0.28+vLens*0.25);
          c+=vec3(0.78,0.92,1.0)*core*(0.42+vLens*0.36);
          c+=vec3(0.52,0.82,1.0)*ring*0.85;
          gl_FragColor=vec4(c*a*3.8,a);
        }
      `,
      }),
    );
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    scene.add(pts);
    return { pts, geo, mat };
  }
  const TUNNEL = buildTunnel();

  // ═══════════════════════════════════════════════════════════════
  // COSMIC SHOW
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
    const m = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uOpacity: { value: 0 },
          uHue: { value: hue },
        },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
        uniform float uT,uOpacity,uHue; varying vec2 vUv;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
        float fbm(vec2 p){float f=0.0,w=0.5;for(int i=0;i<4;i++){f+=w*n(p);p*=2.1;w*=0.5;}return f;}
        vec3 hsl(float h2,float s,float l){h2=mod(h2,1.0);vec3 rgb=clamp(abs(mod(h2*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);return l+s*(rgb-0.5)*(1.0-abs(2.0*l-1.0));}
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
      }),
    );
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(scale * 2, scale * 2),
      m,
    );
    mesh.position.set(rnd(-72, 72), rnd(-36, 36), zPos);
    mesh.rotation.x = tilt;
    mesh.rotation.z = rnd(-0.4, 0.4);
    addCosmic(mesh, [m], zPos, "nebula");
    return m;
  }

  function makePulsar(zPos) {
    const grp = new THREE.Group();
    grp.position.set(rnd(-56, 56), rnd(-28, 28), zPos);
    const coreMat = regMat(
      new THREE.ShaderMaterial({
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
      }),
    );
    const cg = new THREE.BufferGeometry();
    cg.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
    );
    grp.add(new THREE.Points(cg, coreMat));
    const jetMat = regMat(
      new THREE.ShaderMaterial({
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
      }),
    );
    const j1 = new THREE.Mesh(new THREE.PlaneGeometry(200, 3.2), jetMat);
    j1.rotation.y = Math.PI / 2;
    grp.add(j1);
    addCosmic(grp, [coreMat, jetMat], zPos, "pulsar");
    return [coreMat, jetMat];
  }

  function makeQuasar(zPos) {
    const grp = new THREE.Group();
    grp.position.set(rnd(-48, 48), rnd(-24, 24), zPos);
    const m = regMat(
      new THREE.ShaderMaterial({
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
      }),
    );
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
      pos[i * 3 + 2] = Math.sin(a) * r + rnd(-8, 8);
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
    const mat = regMat(
      new THREE.ShaderMaterial({
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
      }),
    );
    const pts = new THREE.Points(geo, mat);
    pts.position.set(rnd(-60, 60), rnd(-30, 30), zPos);
    addCosmic(pts, [mat], zPos, "cluster");
    return mat;
  }

  function makeGasCloud(zPos, r, g, b, scale) {
    const mat = regMat(
      new THREE.ShaderMaterial({
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
      }),
    );
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
  function buildPassGalaxy(cfg2) {
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
    } = cfg2;
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.x = tiltX;
    grp.rotation.y = tiltY;
    grp.rotation.z = rnd(-0.09, 0.09);
    const SC = morph === "compact" ? 14000 : hero ? 52000 : 26000,
      ARMS2 = morph === "barred" ? 2 : morph === "ringed" ? 3 : 4;
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
        r = radius * 0.45 + Math.pow(Math.random(), 0.65) * radius * 0.55;
        a = Math.random() * Math.PI * 2;
      } else if (morph === "disturbed") {
        r = Math.pow(Math.random(), 0.58) * radius;
        a =
          Math.random() * Math.PI * 2 +
          Math.sin(r * 0.18) * 0.8 +
          Math.random() * 0.7;
      } else {
        const arm = Math.floor(Math.random() * ARMS2);
        r = Math.pow(Math.random(), 0.62) * radius;
        a =
          (arm / ARMS2) * Math.PI * 2 +
          cw * Math.log(r + 2.0) * 1.82 +
          (Math.random() - 0.5) * 0.58;
      }
      if (morph === "barred" && !isCore && Math.random() < 0.22) {
        pos[i3] = (Math.random() - 0.5) * radius * 1.15;
        pos[i3 + 2] = (Math.random() - 0.5) * radius * 0.18;
      } else {
        const sc = isCore ? radius * 0.035 : radius * 0.045;
        pos[i3] = Math.cos(a) * r + rnd(-sc, sc);
        pos[i3 + 2] = Math.sin(a) * r + rnd(-sc, sc);
      }
      pos[i3 + 1] =
        (Math.random() - 0.5) *
        (isCore ? radius * 0.18 : radius * 0.035) *
        (hero ? 1.2 : 1.0);
      let c = isCore
        ? new THREE.Color(0xffd28a).lerp(
            new THREE.Color(0xffffff),
            Math.random() * 0.22,
          )
        : isBlue
          ? new THREE.Color(0x78b8ff).lerp(
              new THREE.Color(0xffffff),
              Math.random() * 0.22,
            )
          : pickSpec().col.clone();
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
    const mat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `
        attribute vec3 aRnd; attribute float aSize; uniform float uT; varying vec3 vC;
        void main(){
          vec3 p=position; float r2=length(p.xz); float a2=atan(p.z,p.x);
          a2+=uT*0.12/(r2*0.035+1.0)*(0.75+aRnd.x*0.5); p.x=cos(a2)*r2; p.z=sin(a2)*r2;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          gl_PointSize=(38.0/-mv.z)*aSize*(0.8+aRnd.y*0.7); vC=color;
        }
      `,
        fragmentShader: `
        uniform float uOpacity; varying vec3 vC;
        void main(){vec2 p=gl_PointCoord-0.5;float d=dot(p,p)*4.0;float s=exp(-d*7.2);gl_FragColor=vec4(vC*s*uOpacity*2.0,s*uOpacity);}
      `,
      }),
    );
    grp.add(new THREE.Points(geo, mat));
    const nucMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
        uniform float uT,uOpacity; varying vec3 vP;
        void main(){float r2=length(vP)/6.0;float g=exp(-r2*r2*2.4)*(0.9+0.1*sin(uT*0.8));vec3 c=mix(vec3(1.0,0.88,0.58),vec3(0.8,0.35,0.12),r2);gl_FragColor=vec4(c*g*uOpacity*2.1,g*uOpacity);}
      `,
      }),
    );
    const nuc = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.13, 24, 24),
      nucMat,
    );
    nuc.scale.y = 0.55;
    grp.add(nuc);
    const cloudMat = regMat(
      new THREE.ShaderMaterial({
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
          vec2 uv=vUv-0.5; float r2=length(uv)*2.0; float k=fbm(uv*4.0+uT*0.02);
          float mask=smoothstep(1.0,0.06,r2)*k; vec3 c=mix(uCol,vec3(1.0,0.86,0.58),vUv.y*0.5+0.5);
          gl_FragColor=vec4(c*mask*0.45*uOpacity,mask*0.35*uOpacity);
        }
      `,
      }),
    );
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
      SC = Math.round(190000 * TIER_FACTOR);
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
        z2 = 0;
      if (pick < 0.17) {
        const r = Math.pow(Math.random(), 1.32) * 24,
          a = Math.random() * Math.PI * 2;
        x = Math.cos(a) * r;
        z2 = Math.sin(a) * r;
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
        z2 = Math.sin(swirl) * r + Math.sin(sa) * scatter;
        const warp =
          Math.sin(swirl * 1.45 + af) * Math.pow(r / MAX_R, 1.35) * 13.0;
        y = (Math.random() - 0.5) * 2.8 * Math.exp(-r / 70) + warp * 0.18;
      }
      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z2;
      const s = pickSpec();
      let c = s.col.clone();
      const dist = Math.sqrt(x * x + z2 * z2);
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
    const starMat = regMat(
      new THREE.ShaderMaterial({
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
          vec3 target=position; float r2=length(target.xz); float a=atan(target.z,target.x);
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
          float core=exp(-d*12.0),halo=exp(-d*3.0)*0.28;
          vec3 c=vC; c+=vec3(1.0,0.82,0.46)*vCore*0.65;
          gl_FragColor=vec4(c*(core+halo)*vA*2.35,(core+halo)*vA);
        }
      `,
      }),
    );
    grp.add(new THREE.Points(geo, starMat));

    const bulgeMat = regMat(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
        uniform float uT,uOpacity; varying vec3 vP;
        void main(){float r2=length(vP)/26.0;float g=exp(-r2*r2*2.2)*(0.86+0.14*sin(uT*0.5));vec3 c=mix(vec3(1.0,0.82,0.45),vec3(0.55,0.22,0.08),pow(r2,0.65));gl_FragColor=vec4(c*g*uOpacity*1.9,g*uOpacity*0.75);}
      `,
      }),
    );
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(28, 48, 48), bulgeMat));

    const tailMat = regMat(
      new THREE.ShaderMaterial({
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
          vec2 uv=vUv-0.5; uv.x*=1.55; float r2=length(uv)*2.0;
          float flow=fbm(vec2(atan(uv.y,uv.x)*2.0+uT*0.035,r2*3.0-uT*0.02));
          float arms=exp(-pow(abs(sin(atan(uv.y,uv.x)*5.0+r2*6.0-uT*0.2)),0.7)*2.6);
          float mask=smoothstep(1.0,0.1,r2)*smoothstep(0.0,1.0,uGrow)*flow*arms;
          vec3 c=mix(vec3(0.26,0.58,1.0),vec3(1.0,0.38,0.72),flow);
          c+=vec3(1.0,0.82,0.45)*exp(-r2*3.0)*0.6; float a=mask*uOpacity*0.32;
          gl_FragColor=vec4(c*a*2.4,a);
        }
      `,
      }),
    );
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), tailMat);
    tail.rotation.x = -Math.PI * 0.5;
    tail.position.y = -0.4;
    grp.add(tail);

    const shockMat = regMat(
      new THREE.ShaderMaterial({
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
          vec2 uv=vUv-0.5; float r2=length(uv)*2.0;
          float ring=exp(-pow((r2-0.62)/0.055,2.0)*4.0)+exp(-pow((r2-0.78)/0.035,2.0)*4.0)*0.55;
          vec3 c=mix(vec3(0.45,0.78,1.0),vec3(1.0,0.78,0.35),r2);
          gl_FragColor=vec4(c*ring*uOpacity*2.8,ring*uOpacity);
        }
      `,
      }),
    );
    const shock = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), shockMat);
    shock.rotation.x = -Math.PI * 0.5;
    grp.add(shock);

    const quantumMat = regMat(
      new THREE.ShaderMaterial({
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
          vec2 uv=vUv-0.5; float r2=length(uv)*2.0;
          float k=fbm(uv*4.0+uT*0.015)*fbm(uv*12.0-uT*0.02);
          float mask=smoothstep(1.0,0.04,r2)*smoothstep(0.22,0.95,k);
          vec3 c=mix(vec3(0.2,0.62,1.0),vec3(1.0,0.38,0.9),vUv.y+k*0.5);
          c+=vec3(1.0,0.92,0.62)*exp(-r2*4.0)*0.65;
          gl_FragColor=vec4(c*mask*0.45*uOpacity,mask*0.35*uOpacity);
        }
      `,
      }),
    );
    const quantum = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      quantumMat,
    );
    quantum.rotation.x = -Math.PI * 0.5;
    quantum.position.y = -1.2;
    grp.add(quantum);

    const satMats = [];
    for (let s = 0; s < 3; s++) {
      const N2 = 9000,
        sg = new THREE.BufferGeometry();
      const sp = new Float32Array(N2 * 3),
        sc = new Float32Array(N2 * 3),
        sr = new Float32Array(N2);
      const ringR = 95 + s * 38;
      for (let i = 0; i < N2; i++) {
        const a = Math.random() * Math.PI * 2,
          r2 = ringR + rnd(-8, 8);
        sp[i * 3] = Math.cos(a) * r2;
        sp[i * 3 + 1] = rnd(-2.0, 2.0);
        sp[i * 3 + 2] = Math.sin(a) * r2;
        const c2 =
          s === 0
            ? new THREE.Color(0x80b7ff)
            : s === 1
              ? new THREE.Color(0xff8ac8)
              : new THREE.Color(0xffd67a);
        c2.lerp(new THREE.Color(0xffffff), Math.random() * 0.25);
        sc[i * 3] = c2.r;
        sc[i * 3 + 1] = c2.g;
        sc[i * 3 + 2] = c2.b;
        sr[i] = Math.random();
      }
      sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      sg.setAttribute("color", new THREE.BufferAttribute(sc, 3));
      sg.setAttribute("aRnd", new THREE.BufferAttribute(sr, 1));
      const sm = regMat(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
          uniforms: { uT: { value: 0 }, uOpacity: { value: 0 } },
          vertexShader: `
          attribute float aRnd; uniform float uT; varying vec3 vC;
          void main(){
            vC=color; vec3 p=position; float r2=length(p.xz); float a=atan(p.z,p.x);
            a+=uT*(0.04+aRnd*0.025); p.x=cos(a)*r2; p.z=sin(a)*r2;
            vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
            gl_PointSize=(28.0/-mv.z)*(0.45+aRnd*1.35);
          }
        `,
          fragmentShader: `
          uniform float uOpacity; varying vec3 vC;
          void main(){vec2 p=gl_PointCoord-0.5;float d=dot(p,p)*4.0;float s=exp(-d*8.0);gl_FragColor=vec4(vC*s*uOpacity*1.8,s*uOpacity);}
        `,
        }),
      );
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
  // START INTRO — COREOGRAFIA COMPLETA
  // ═══════════════════════════════════════════════════════════════
  function startIntro(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (ST.started) return;
    ST.started = true;
    btnDespertar.disabled = true;
    btnDespertar.style.pointerEvents = "none";
    document.body.classList.add("diving-active");

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

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.inOut" },
    });
    SYNC.timeline = tl;
    SYNC.audioClock = false;
    SYNC.fallbackClock = false;
    SYNC.lastTimelineTime = 0;

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
          const m = Array.isArray(o.material) ? o.material : [o.material];
          m.filter(Boolean).forEach((m2) => m2.dispose?.());
        }
      });
      grp.parent?.remove(grp);
    };

    // Reset
    camera.position.set(-44, 192, 648);
    camera.fov = 24;
    camera.updateProjectionMatrix();
    lookTarget.set(0, 12, 0);
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
    HOST.starMat.uniforms.uSpeed.value = 1;
    HOST.starMat.uniforms.uTravel.value = 0;
    HOST.starMat.uniforms.uSuck.value = 0;
    HOST.starMat.uniforms.uFrameDrag.value = 0;
    HOST.starMat.uniforms.uOpacity.value = 1;
    HOST.starMat.uniforms.uCoreDimming.value = 0;
    HOST.bulgeMat.uniforms.uRevealBH.value = 0;
    HOST.dustMat.uniforms.uTravel.value = 0;
    HOST.dustMat.uniforms.uOpacity.value = 0.42;
    HOST.nebMats.forEach((m) => {
      if (m.uniforms.uTravel) m.uniforms.uTravel.value = 0;
    });
    BH.grp.visible = true;
    BH.grp.scale.set(0.92, 0.92, 0.92);
    BH.grp.rotation.set(-0.18, 0.22, 0.035);
    BH.ctrl.reveal = 0;
    BH.ctrl.spin = 0;
    BH.ctrl.plunge = 0;
    BH.ctrl.diskLift = 0;
    BH.photonMat.uniforms.uOpacity.value = 0;
    BH.haloMat.uniforms.uOpacity.value = 0;
    BH.coronaMat.uniforms.uOpacity.value = 0;
    BH.diskMat.uniforms.uOpacity.value = 0;
    BH.lensedDiskMat.uniforms.uOpacity.value = 0;
    BH.ergosphereMat.uniforms.uOpacity.value = 0;
    BH.iscoMat.uniforms.uOpacity.value = 0;
    BH.hotspotMat.uniforms.uOpacity.value = 0;
    BH.jetMatA.uniforms.uOpacity.value = 0;
    BH.jetMatB.uniforms.uOpacity.value = 0;
    BH.magMats.forEach((m) => {
      m.opacity = 0;
    });
    if (BH.gasMat) BH.gasMat.opacity = 0;
    lensPass.uniforms.uTime.value = 0;
    lensPass.uniforms.uSpin.value = 0;
    lensPass.uniforms.uPlunge.value = 0;
    bgStars.mat.uniforms.uOpacity.value = 1.0;

    // UI OUT
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
    // ATO 1 — DESCIDA ORBITAL CONTEMPLATIVA (DIRECTOR'S CUT)
    // ═══════════════════════════════════════════════════════════════
    camTo({
      at: 0.0,
      duration: 0.01,
      pos: { x: -44, y: 192, z: 648 },
      target: { x: 0, y: 12, z: 0 },
      fov: 24,
      roll: -0.012,
      ease: "none",
    });

    tl.to(
      HOST.grp.rotation,
      { y: "+=0.18", z: "+=0.025", duration: 12.5, ease: "none" },
      0.0,
    );

    tl.to(
      bloomPass,
      {
        strength: 0.65,
        radius: 0.45,
        threshold: 0.045,
        duration: 4.8,
        ease: "sine.inOut",
      },
      0.1,
    );

    tl.to(breathCtrl, { amp: 0.18, duration: 5.0, ease: "sine.inOut" }, 0.1);
    tl.to(
      shakeCtrl,
      { lf: 0.008, mf: 0.0, hf: 0.0, duration: 4.0, ease: "sine.inOut" },
      0.15,
    );

    camTo({
      at: 0.1,
      duration: 4.5,
      pos: { x: -32, y: 145, z: 510 },
      target: { x: 0, y: 8.5, z: 12 },
      fov: 26,
      roll: -0.022,
      ease: "power2.inOut",
    });

    camTo({
      at: 4.0,
      duration: 3.5,
      pos: { x: 18, y: 65, z: 280 },
      target: { x: 5, y: 4.0, z: 22 },
      fov: 32,
      roll: 0.005,
      ease: "power2.inOut",
    });

    toU(HOST.starMat.uniforms.uTravel, 0.12, 3.5, 4.0, "power1.inOut");
    toU(HOST.dustMat.uniforms.uTravel, 0.1, 3.5, 4.0, "power1.inOut");
    HOST.nebMats.forEach((m, i) => {
      toU(m.uniforms.uTravel, 0.15, 3.0, 4.2 + i * 0.02, "power1.inOut");
    });

    // ═══════════════════════════════════════════════════════════════
    // ATO 2 — ODISSEIA ATÉ O NÚCLEO E A REVELAÇÃO DO BEHEMOTH
    // ═══════════════════════════════════════════════════════════════
    tl.addLabel("ACT_2_TRAVEL", 6.0);

    tl.to(
      shakeCtrl,
      { lf: 0.015, mf: 0.004, duration: 3.0, ease: "power2.inOut" },
      6.0,
    );

    tl.to(
      bloomPass,
      {
        strength: 0.85,
        radius: 0.55,
        threshold: 0.035,
        duration: 3.0,
        ease: "sine.inOut",
      },
      6.0,
    );

    toU(HOST.starMat.uniforms.uTravel, 0.45, 3.5, 6.0, "power2.inOut");
    toU(HOST.starMat.uniforms.uSpeed, 35.0, 3.5, 6.0, "power2.inOut");
    toU(HOST.dustMat.uniforms.uTravel, 0.35, 3.2, 6.0, "power2.inOut");
    HOST.nebMats.forEach((m, i) => {
      toU(m.uniforms.uTravel, 0.4, 3.0, 6.1 + i * 0.015, "power2.inOut");
    });

    camTo({
      at: 6.0,
      duration: 2.6,
      pos: { x: 34, y: 24, z: 210 },
      target: { x: 8, y: 3.5, z: 44 },
      fov: 36,
      roll: 0.012,
      ease: "power2.inOut",
    });

    camTo({
      at: 7.9,
      duration: 2.3,
      pos: { x: 18, y: 7.5, z: 108 },
      target: { x: 2, y: 0.8, z: 12 },
      fov: 44,
      roll: 0.02,
      ease: "power2.inOut",
    });

    // A REVELAÇÃO - aproximação mais cinematográfica ao estilo Gargantua,
    // entrando por uma lateral para evidenciar o disco e a lente gravitacional.
    camTo({
      at: 9.75,
      duration: 2.4,
      pos: { x: 8.4, y: 1.5, z: 22.5 },
      target: { x: -0.6, y: 0.0, z: 0.0 },
      fov: 58,
      roll: -0.012,
      ease: "power3.out",
    });

    camTo({
      at: 11.1,
      duration: 1.8,
      pos: { x: -7.8, y: -0.35, z: 16.2 },
      target: { x: 0.0, y: 0.0, z: 0.0 },
      fov: 63,
      roll: Math.PI * 0.008,
      ease: "sine.inOut",
    });

    toU(HOST.bulgeMat.uniforms.uRevealBH, 1.0, 2.5, 8.5, "sine.inOut");
    // Diminuir drasticamente as estrelas da galáxia ao se aproximar do monstro
    toU(HOST.starMat.uniforms.uCoreDimming, 0.98, 2.5, 8.5, "sine.inOut");
    toU(HOST.starMat.uniforms.uOpacity, 0.35, 2.5, 8.5, "sine.inOut");
    // Apagar estrelas de fundo
    toU(bgStars.mat.uniforms.uOpacity, 0.02, 3.0, 8.0, "power2.inOut");

    toU(BH.diskMat.uniforms.uOpacity, 1.12, 2.8, 8.55, "power2.inOut");
    toU(BH.lensedDiskMat.uniforms.uOpacity, 0.86, 2.3, 8.8, "power2.out");
    toU(BH.coronaMat.uniforms.uOpacity, 0.28, 2.3, 8.92, "power2.inOut");
    toU(BH.haloMat.uniforms.uOpacity, 0.20, 2.1, 9.0, "power2.inOut");
    toU(BH.ergosphereMat.uniforms.uOpacity, 0.34, 2.0, 9.08, "power2.inOut");
    toU(BH.photonMat.uniforms.uOpacity, 1.46, 1.55, 9.55, "power2.out");
    toU(BH.iscoMat.uniforms.uOpacity, 0.86, 1.6, 9.78, "power2.inOut");
    toU(BH.hotspotMat.uniforms.uOpacity, 0.92, 1.4, 9.95, "power2.inOut");
    toU(BH.jetMatA.uniforms.uOpacity, 0.24, 1.8, 10.0, "sine.inOut");
    toU(BH.jetMatB.uniforms.uOpacity, 0.16, 1.8, 10.0, "sine.inOut");
    tl.to(BH.ctrl, { reveal: 1.0, spin: 0.56, duration: 2.8, ease: "power2.out" }, 8.65);
    tl.to(BH.grp.scale, { x: 1.03, y: 1.03, z: 1.03, duration: 2.4, ease: "sine.out" }, 8.7);
    tl.to(BH.grp.rotation, { x: -0.11, y: 0.38, z: 0.028, duration: 2.4, ease: "power2.out" }, 8.7);
    BH.magMats.forEach((m, i) => {
      tl.to(m, { opacity: 0.16 + i * 0.035, duration: 1.6, ease: "sine.out" }, 9.6 + i * 0.08);
    });

    toU(lensPass.uniforms.uRingBoost, 0.18, 1.6, 9.5, "power2.out");
    toU(warpPass.uniforms.uAmount, 0.08, 2.0, 9.8, "sine.inOut");
    toU(chromaPass.uniforms.uStr, 0.005, 2.0, 9.8, "sine.inOut");

    tl.to(
      shakeCtrl,
      { lf: 0.005, mf: 0.0, duration: 1.5, ease: "sine.out" },
      10.5,
    );
    toU(HOST.starMat.uniforms.uTravel, 0.05, 1.5, 10.5, "power2.out");
    toU(HOST.starMat.uniforms.uSpeed, 5.0, 1.5, 10.5, "power2.out");

    // ═══════════════════════════════════════════════════════════════
    // ATO 3 — THE EYE OF THE BEHEMOTH
    // ═══════════════════════════════════════════════════════════════
    tl.addLabel("ACT_3_HANDOFF", BEAT.TDE_INTERLUDE - 2.0);

    camTo({
      at: BEAT.TDE_INTERLUDE - 2.0,
      duration: 1.25,
      pos: { x: 8.2, y: 1.9, z: 12.0 },
      target: { x: -1.8, y: 0.0, z: 0 },
      fov: 64,
      roll: -Math.PI * 0.022,
      ease: "sine.inOut",
    });

    camTo({
      at: BEAT.TDE_INTERLUDE - 0.82,
      duration: 1.05,
      pos: { x: -6.4, y: -0.25, z: 10.6 },
      target: { x: 0.0, y: 0.0, z: 0 },
      fov: 67,
      roll: Math.PI * 0.012,
      ease: "power2.inOut",
    });

    toU(
      HOST.starMat.uniforms.uSuck,
      0.08,
      1.0,
      BEAT.TDE_INTERLUDE - 1.0,
      "power2.in",
    );
    toU(
      HOST.starMat.uniforms.uFrameDrag,
      0.05,
      1.0,
      BEAT.TDE_INTERLUDE - 1.0,
      "power2.in",
    );

    toU(
      warpPass.uniforms.uAmount,
      0.15,
      1.0,
      BEAT.TDE_INTERLUDE - 1.0,
      "power2.inOut",
    );
    toU(
      chromaPass.uniforms.uStr,
      0.015,
      1.0,
      BEAT.TDE_INTERLUDE - 1.0,
      "power2.inOut",
    );
    toU(
      barrelPass.uniforms.uStr,
      0.025,
      1.0,
      BEAT.TDE_INTERLUDE - 1.0,
      "power2.inOut",
    );

    tl.to(
      shakeCtrl,
      { lf: 0.035, mf: 0.015, hf: 0.001, duration: 1.0, ease: "power1.in" },
      BEAT.TDE_INTERLUDE - 1.0,
    );

    // ═══════════════════════════════════════════════════════════════
    // ATO 4 — A ERGOSFERA E O ARRASTE DE REFERENCIAL (FRAME-DRAGGING)
    // ═══════════════════════════════════════════════════════════════
    const D = BEAT.TDE_INTERLUDE;

    // ── 4A · CRUZANDO O LIMITE ESTÁTICO (D ... D+2.0)
    camTo({
      at: D,
      duration: 2.5,
      pos: { x: 10.5, y: 2.6, z: 13.4 },
      target: { x: -2.8, y: 0.0, z: 0 },
      fov: 63,
      roll: -Math.PI * 0.038,
      ease: "power2.inOut",
    });

    tl.to(BH.ctrl, { spin: 0.88, diskLift: 0.52, duration: 2.4, ease: "power2.inOut" }, D);
    tl.to(BH.diskMat.uniforms.uOpacity, { value: 1.52, duration: 2.0, ease: "power2.inOut" }, D);
    tl.to(BH.lensedDiskMat.uniforms.uOpacity, { value: 1.08, duration: 2.0, ease: "power2.inOut" }, D + 0.15);
    tl.to(BH.photonMat.uniforms.uOpacity, { value: 1.95, duration: 2.0, ease: "power2.inOut" }, D);
    tl.to(BH.ergosphereMat.uniforms.uOpacity, { value: 0.42, duration: 1.8, ease: "power2.out" }, D + 0.2);
    tl.to(BH.coronaMat.uniforms.uOpacity, { value: 0.34, duration: 1.8, ease: "power2.out" }, D + 0.2);
    tl.to(BH.jetMatA.uniforms.uOpacity, { value: 0.30, duration: 1.8, ease: "sine.inOut" }, D + 0.15);
    tl.to(BH.jetMatB.uniforms.uOpacity, { value: 0.21, duration: 1.8, ease: "sine.inOut" }, D + 0.15);

    tl.to(shakeCtrl, { lf: 0.01, mf: 0.03, hf: 0.008, duration: 2.0, ease: "sine.inOut" }, D);

    // ── 4B · COROTAÇÃO NO LENSE-THIRRING (D+2.0 ... D+4.0)
    camTo({
      at: D + 2.0,
      duration: 3.0,
      pos: { x: -9.6, y: -0.45, z: 8.2 },
      target: { x: 1.25, y: 0, z: 0 },
      fov: 72,
      roll: Math.PI * 0.042,
      ease: "power2.inOut",
    });

    tl.to(BH.ctrl, { spin: 1.14, diskLift: 0.82, duration: 3.0, ease: "power2.inOut" }, D + 1.5);
    tl.to(BH.grp.rotation, { x: -0.06, y: 0.94, z: 0.05, duration: 3.0, ease: "sine.inOut" }, D + 1.55);
    tl.to(HOST.starMat.uniforms.uFrameDrag, { value: 0.90, duration: 3.0, ease: "power2.inOut" }, D + 1.5);
    tl.to(HOST.starMat.uniforms.uSpeed, { value: 132, duration: 3.0, ease: "power2.inOut" }, D + 1.5);

    tl.to(TIDAL.pMat.uniforms.uOpacity, { value: 0.8, duration: 2.5, ease: "sine.inOut" }, D + 1.8);
    toU(warpPass.uniforms.uAmount, 0.65, 2.5, D + 1.8, "sine.inOut");
    toU(chromaPass.uniforms.uStr, 0.045, 2.5, D + 1.8, "sine.inOut");

    TIDAL.gwMats.slice(0, 4).forEach((m, i) => {
      tl.to(
        m.uniforms.uOpacity,
        { value: 0.35, duration: 1.2, ease: "power2.out" },
        D + 2.0 + i * 0.25,
      );
      tl.to(
        m.uniforms.uOpacity,
        { value: 0.0, duration: 2.0, ease: "power2.in" },
        D + 3.2 + i * 0.25,
      );
    });

    // ── 4C · QUEDA LIVRE RELATIVÍSTICA (D+4.0 ... C)
    const dur4C = Math.max(0.8, BEAT.CHAOS_START - (D + 4.0));
    camTo({
      at: D + 4.0,
      duration: dur4C,
      pos: { x: 5.1, y: 0.14, z: 5.8 },
      target: { x: 0.0, y: 0.0, z: 0 },
      fov: 78,
      roll: -Math.PI * 0.058,
      ease: "power2.in",
    });

    tl.to(HOST.starMat.uniforms.uFrameDrag, { value: 1.0, duration: dur4C, ease: "power3.in" }, D + 4.0);
    tl.to(HOST.starMat.uniforms.uSuck, { value: 0.88, duration: dur4C, ease: "power2.inOut" }, D + 4.0);
    tl.to(HOST.starMat.uniforms.uSpeed, { value: 220, duration: dur4C, ease: "power3.in" }, D + 4.0);
    tl.to(TIDAL.sMat.uniforms.uOpacity, { value: 1.0, duration: 1.2, ease: "power2.out" }, D + 3.7);

    toU(lensPass.uniforms.uStrength, 0.022, dur4C, D + 4.0, "power2.in");
    toU(warpPass.uniforms.uAmount, 1.45, dur4C, D + 4.0, "power2.in");
    toU(chromaPass.uniforms.uStr, 0.10, dur4C, D + 4.0, "power2.in");
    toU(barrelPass.uniforms.uStr, -0.05, dur4C, D + 4.0, "power2.in");

    // Bloom mais controlado para preservar a leitura do disco, da lente e do horizonte.
    tl.to(bloomPass, { strength: 1.02, radius: 0.72, threshold: 0.038, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(BH.ctrl, { plunge: 0.64, spin: 1.32, diskLift: 1.06, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(BH.diskMat.uniforms.uOpacity, { value: 0.78, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(BH.lensedDiskMat.uniforms.uOpacity, { value: 1.52, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(BH.photonMat.uniforms.uOpacity, { value: 2.35, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(BH.hotspotMat.uniforms.uOpacity, { value: 1.18, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(BH.jetMatA.uniforms.uOpacity, { value: 0.50, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(BH.jetMatB.uniforms.uOpacity, { value: 0.34, duration: dur4C, ease: "power2.in" }, D + 4.0);
    tl.to(shakeCtrl, { lf: 0.08, mf: 0.07, hf: 0.015, duration: dur4C, ease: "power2.in" }, D + 4.0);

    // ═══════════════════════════════════════════════════════════════
    // ATO 5 — MERGULHO NO HORIZONTE
    // ═══════════════════════════════════════════════════════════════
    const C = BEAT.CHAOS_START;
    tl.to(
      bloomPass,
      {
        strength: 1.85,
        radius: 0.88,
        threshold: 0.03,
        duration: 1.4,
        ease: "power1.inOut",
      },
      C,
    );
    tl.to(
      bloomPass,
      {
        strength: 2.8,
        radius: 1.22,
        threshold: 0.024,
        duration: 1.6,
        ease: "power2.in",
      },
      C + 1.5,
    );
    camTo({
      at: C,
      duration: 1.8,
      pos: { x: 6.4, y: 1.4, z: 10.8 },
      target: { x: -0.6, y: 0, z: 0 },
      fov: 68,
      roll: Math.PI * 0.022,
      ease: "power1.inOut",
    });
    camTo({
      at: C + 1.55,
      duration: 2.05,
      pos: { x: -4.6, y: -0.22, z: 7.2 },
      target: { x: 0.0, y: 0, z: 0 },
      fov: 80,
      roll: -Math.PI * 0.016,
      ease: "power2.inOut",
    });
    toU(lensPass.uniforms.uStrength, 0.014, 1.6, C, "power1.inOut");
    toU(lensPass.uniforms.uStrength, 0.026, 2.2, C + 1.8, "power2.in");
    toU(lensPass.uniforms.uRadius, 0.02, 3.0, C, "power2.in");
    toU(lensPass.uniforms.uRingBoost, 0.20, 1.4, C + 0.5, "power1.inOut");
    toU(lensPass.uniforms.uRingBoost, 0.28, 1.8, C + 2.0, "power2.in");
    toU(warpPass.uniforms.uAmount, 1.15, 1.5, C, "power1.inOut");
    toU(warpPass.uniforms.uAmount, 3.6, 1.8, C + 1.8, "power3.in");
    toU(chromaPass.uniforms.uStr, 0.11, 1.4, C + 0.6, "power1.inOut");
    toU(chromaPass.uniforms.uStr, 0.44, 1.8, C + 2.0, "power3.in");
    toU(barrelPass.uniforms.uStr, -0.05, 1.6, C + 0.4, "power1.inOut");
    toU(barrelPass.uniforms.uStr, -0.12, 1.8, C + 2.0, "power3.in");
    toU(anamPass.uniforms.uStrength, 0.012, 1.2, C + 0.6, "sine.inOut");

    tl.to(BH.ctrl, { plunge: 1.0, spin: 1.72, diskLift: 1.22, duration: 3.2, ease: "power3.in" }, C + 0.1);
    tl.to(BH.photonMat.uniforms.uOpacity, { value: 2.95, duration: 1.8, ease: "power2.in" }, C + 0.4);
    tl.to(BH.lensedDiskMat.uniforms.uOpacity, { value: 1.95, duration: 1.8, ease: "power2.in" }, C + 0.55);
    tl.to(BH.ergosphereMat.uniforms.uOpacity, { value: 0.48, duration: 1.6, ease: "power2.in" }, C + 0.6);
    tl.to(BH.coronaMat.uniforms.uOpacity, { value: 0.36, duration: 1.8, ease: "power2.in" }, C + 0.7);
    tl.to(BH.jetMatA.uniforms.uOpacity, { value: 0.72, duration: 1.5, ease: "power2.in" }, C + 0.8);
    tl.to(BH.jetMatB.uniforms.uOpacity, { value: 0.52, duration: 1.5, ease: "power2.in" }, C + 0.8);
    tl.to(BH.grp.scale, { x: 1.13, y: 1.13, z: 1.13, duration: 2.4, ease: "power3.in" }, C + 1.0);
    tl.to(
      shakeCtrl,
      { lf: 0.05, mf: 0.08, hf: 0.0, duration: 1.6, ease: "power1.inOut" },
      C,
    );
    tl.to(
      shakeCtrl,
      { mf: 0.20, hf: 0.03, duration: 1.8, ease: "power2.in" },
      C + 1.8,
    );
    tl.to(BH.grp.rotation, { x: -0.03, y: 1.18, z: 0.035, duration: 2.4, ease: "power2.inOut" }, C + 0.35);
    tl.to(
      HOST.starMat.uniforms.uSuck,
      { value: 1.0, duration: 3.2, ease: "power3.in" },
      C + 0.2,
    );
    tl.to(
      TIDAL.pMat.uniforms.uChaos,
      { value: 1.0, duration: 3.0, ease: "power2.in" },
      C + 0.1,
    );
    tl.to(
      TIDAL.sMat.uniforms.uChaos,
      { value: 1.0, duration: 2.8, ease: "power2.in" },
      C + 0.3,
    );
    camTo({
      at: C + 3.0,
      duration: 2.2,
      pos: { x: 0.42, y: 0.03, z: 3.15 },
      target: { x: 0, y: 0, z: 0 },
      fov: 92,
      roll: 0,
      ease: "power4.in",
    });
    camTo({
      at: C + 4.15,
      duration: 0.95,
      pos: { x: 0.02, y: 0.005, z: 2.05 },
      target: { x: 0, y: 0, z: -0.18 },
      fov: 100,
      roll: 0,
      ease: "power4.in",
    });
    tl.to(
      camera.position,
      { x: "+=0.32", y: "+=0.14", duration: 0.05, ease: roughEase },
      C + 3.42,
    );
    tl.to(
      camera.position,
      { x: 0.42, y: 0.03, duration: 0.18, ease: "power3.out" },
      C + 3.47,
    );
    tl.to(
      shakeCtrl,
      { mf: 0.06, hf: 0.0, duration: 1.8, ease: "power2.out" },
      C + 3.55,
    );
    tl.to(
      LB.top,
      { height: "0px", duration: 5.8, ease: "power1.inOut" },
      BEAT.IMAX_OPEN,
    );
    tl.to(
      LB.bot,
      { height: "0px", duration: 5.8, ease: "power1.inOut" },
      BEAT.IMAX_OPEN,
    );
    toU(vigPass.uniforms.uOpen, 1.0, 5.6, BEAT.IMAX_OPEN, "power1.inOut");
    tl.to(
      OV.imax,
      { opacity: 0.0, duration: 5.0, ease: "power1.inOut" },
      BEAT.IMAX_OPEN + 0.2,
    );

    // ATO 5→6 ENTRADA NO TÚNEL
    const T = BEAT.TRAVEL_START,
      S = BEAT.SILENCE_START,
      travelDur = S - T;
    camTo({
      at: T - 1.4,
      duration: 1.4,
      pos: { x: 0.04, y: 0.008, z: -3.1 },
      target: { x: 0, y: 0, z: -18 },
      fov: 100,
      roll: 0,
      ease: "power2.inOut",
    });
    tl.to(
      camera,
      {
        fov: 112,
        duration: 1.0,
        ease: "power2.in",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      T - 0.85,
    );
    toU(warpPass.uniforms.uAmount, 5.2, 0.85, T - 0.88, "power3.in");
    toU(chromaPass.uniforms.uStr, 0.54, 0.72, T - 0.75, "power3.in");
    toU(barrelPass.uniforms.uStr, -0.08, 0.72, T - 0.75, "power3.in");
    toU(anamPass.uniforms.uStrength, 0.018, 0.78, T - 0.82, "power3.in");
    tl.to(
      shakeCtrl,
      { mf: 0.28, hf: 0.1, duration: 0.65, ease: "power2.out" },
      T - 0.72,
    );
    tl.to(
      OV.hawking,
      { opacity: 0.82, duration: 0.065, ease: "none" },
      T - 0.05,
    );
    tl.to(
      OV.flash,
      { opacity: 0.58, duration: 0.055, ease: "none" },
      T - 0.035,
    );
    tl.to(OV.flash, { opacity: 0, duration: 0.1, ease: "none" }, T + 0.03);
    tl.to(OV.hawking, { opacity: 0, duration: 0.16, ease: "none" }, T + 0.06);

    tl.add(() => {
      ST.tunneling = true;
      shakeCtrl.hf = 0.012;
      shakeCtrl.mf = 0.07;
      shakeCtrl.lf = 0.032;
      breathCtrl.amp = 0;
      BH.grp.visible = false;
      HOST.grp.visible = false;
      TUNNEL.pts.visible = true;
      cosmicGrp.visible = true;
      camRoll.z = 0;
      camera.rotation.z = 0;
      camera.position.set(0, 0, -86);
      lookTarget.set(0, 0, -1600);
      camera.fov = 112;
      camera.updateProjectionMatrix();
      barrelPass.uniforms.uStr.value = 0;
      warpPass.uniforms.uAmount.value = 2.0;
      chromaPass.uniforms.uStr.value = 0.18;
      anamPass.uniforms.uStrength.value = 0.012;
      PASS_GALAXIES.forEach((g) => {
        g.visible = false;
        if (g._mats)
          g._mats.forEach((m) => {
            if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = 0;
          });
      });
    }, T);

    toU(TUNNEL.mat.uniforms.uOpacity, 1.0, 0.85, T, "power2.out");
    toU(TUNNEL.mat.uniforms.uSpeed, 340, 1.2, T, "power2.out");
    toU(TUNNEL.mat.uniforms.uTwist, 2.35, travelDur * 0.45, T, "sine.inOut");
    toU(TUNNEL.mat.uniforms.uTwist, 3.05, travelDur * 0.32, T + travelDur * 0.35, "sine.inOut");
    toU(TUNNEL.mat.uniforms.uTwist, 2.1, travelDur * 0.25, T + travelDur * 0.72, "sine.out");

    tl.to(
      camera.position,
      {
        x: 2.1,
        y: 0.8,
        z: -2100,
        duration: travelDur * 0.34,
        ease: "sine.inOut",
      },
      T,
    );
    tl.to(
      camera.position,
      {
        x: -1.6,
        y: -0.6,
        z: -4380,
        duration: travelDur * 0.33,
        ease: "sine.inOut",
      },
      T + travelDur * 0.34,
    );
    tl.to(
      camera.position,
      {
        x: 0.0,
        y: 0.0,
        z: -6200,
        duration: travelDur * 0.33,
        ease: "sine.inOut",
      },
      T + travelDur * 0.67,
    );
    tl.to(
      lookTarget,
      {
        x: 0.4,
        y: 0.12,
        z: -3100,
        duration: travelDur * 0.34,
        ease: "sine.inOut",
      },
      T,
    );
    tl.to(
      lookTarget,
      {
        x: -0.25,
        y: -0.08,
        z: -5450,
        duration: travelDur * 0.33,
        ease: "sine.inOut",
      },
      T + travelDur * 0.34,
    );
    tl.to(
      lookTarget,
      {
        x: 0.0,
        y: 0.0,
        z: -7350,
        duration: travelDur * 0.33,
        ease: "sine.inOut",
      },
      T + travelDur * 0.67,
    );
    tl.to(
      camRoll,
      { z: Math.PI * 0.022, duration: travelDur * 0.45, ease: "sine.inOut" },
      T + 0.35,
    );
    tl.to(
      camRoll,
      { z: -Math.PI * 0.015, duration: travelDur * 0.4, ease: "sine.inOut" },
      T + travelDur * 0.48,
    );
    tl.to(
      camRoll,
      { z: 0.0, duration: travelDur * 0.18, ease: "sine.out" },
      T + travelDur * 0.82,
    );
    tl.to(
      camera,
      {
        fov: 108,
        duration: 2.0,
        ease: "sine.inOut",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      T + 0.3,
    );
    tl.to(
      camera,
      {
        fov: 118,
        duration: 2.8,
        ease: "sine.inOut",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      T + 2.5,
    );
    tl.to(
      camera,
      {
        fov: 112,
        duration: 2.4,
        ease: "sine.out",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      T + 5.2,
    );
    toU(TUNNEL.mat.uniforms.uSpeed, 295, 1.35, T + 1.3, "sine.inOut");
    toU(TUNNEL.mat.uniforms.uSpeed, 430, 1.55, T + 3.0, "sine.inOut");
    toU(TUNNEL.mat.uniforms.uSpeed, 335, 1.45, T + 4.65, "sine.out");
    toU(warpPass.uniforms.uAmount, 2.6, 1.35, T + 1.1, "sine.inOut");
    toU(warpPass.uniforms.uAmount, 3.4, 1.45, T + 3.0, "sine.inOut");
    toU(warpPass.uniforms.uAmount, 2.2, 1.3, T + 4.7, "sine.out");
    toU(chromaPass.uniforms.uStr, 0.24, 1.2, T + 1.2, "sine.inOut");
    toU(chromaPass.uniforms.uStr, 0.34, 1.35, T + 3.0, "sine.inOut");
    toU(chromaPass.uniforms.uStr, 0.18, 1.25, T + 4.7, "sine.out");
    tl.to(
      bloomPass,
      {
        strength: 1.35,
        radius: 0.84,
        threshold: 0.034,
        duration: 1.6,
        ease: "sine.inOut",
      },
      T + 0.25,
    );
    tl.to(
      shakeCtrl,
      { mf: 0.05, hf: 0.0, lf: 0.035, duration: 2.6, ease: "sine.inOut" },
      T + 0.95,
    );

    COSMIC_OBJECTS.forEach((obj) => {
      const zDist = Math.abs(obj.zPos),
        ratio = clamp(zDist / 7000, 0, 1),
        ta = T + ratio * (travelDur - 0.8);
      const isNeb = obj.type === "nebula",
        isQ = obj.type === "quasar",
        isP = obj.type === "pulsar";
      const inD = isNeb ? 1.05 : isP ? 0.52 : 0.62,
        outD = isNeb ? 1.25 : 0.8,
        peak = isNeb ? 0.82 : isQ ? 1.05 : 0.88;
      obj.mats.forEach((m) => {
        if (!m.uniforms?.uOpacity) return;
        tl.to(
          m.uniforms.uOpacity,
          { value: peak, duration: inD, ease: "sine.out" },
          ta - 0.58,
        );
        tl.to(
          m.uniforms.uOpacity,
          { value: 0, duration: outD, ease: "sine.in" },
          ta + 0.82,
        );
      });
    });
    schedulePassGalaxies(tl, T, travelDur, -86, -6200);

    // ATO 7 — BLACKOUT / SILÊNCIO
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
    tl.to(
      OV.godray,
      { opacity: 0.18, duration: 1.2, ease: "power1.out" },
      S + 0.4,
    );
    tl.to(
      OV.godray,
      { opacity: 0.38, duration: 0.8, ease: "power2.inOut" },
      S + 1.6,
    );
    tl.to(
      OV.godray,
      { opacity: 0.0, duration: 0.6, ease: "power2.out" },
      S + 2.5,
    );
    tl.to(
      bloomPass,
      {
        strength: 1.2,
        radius: 0.65,
        threshold: 0.045,
        duration: 1.0,
        ease: "power1.out",
      },
      S + 0.2,
    );
    tl.to(
      bloomPass,
      {
        strength: 2.75,
        radius: 1.15,
        threshold: 0.025,
        duration: 1.4,
        ease: "power2.out",
      },
      S + 1.8,
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
      camera.position.set(0, 0.8, 6);
      lookTarget.set(0, 0, 0);
      camera.fov = 52;
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

    // ATO 8 — RENASCIMENTO
    const R = BEAT.REBIRTH_START;
    tl.to(OV.fade, { opacity: 0, duration: 1.55, ease: "power2.out" }, R);
    camTo({
      at: R,
      duration: 2.8,
      pos: { x: 0.8, y: 1.6, z: 18 },
      target: { x: 0, y: 0, z: 0 },
      fov: 46,
      roll: 0,
      ease: "power2.out",
    });
    camTo({
      at: R + 1.55,
      duration: 6.1,
      pos: { x: 18, y: 7.6, z: 66 },
      target: { x: 0, y: 0, z: 0 },
      fov: 40,
      roll: -Math.PI * 0.016,
      ease: "sine.inOut",
    });
    camTo({
      at: R + 5.7,
      duration: 7.4,
      pos: { x: -24, y: 15.5, z: 136 },
      target: { x: 0, y: 0, z: 0 },
      fov: 34,
      roll: Math.PI * 0.02,
      ease: "sine.inOut",
    });
    camTo({
      at: BEAT.FINAL_PULL,
      duration: BEAT.END - BEAT.FINAL_PULL - 1.15,
      pos: { x: 0, y: 25, z: 252 },
      target: { x: 0, y: 0, z: 0 },
      fov: 29,
      roll: 0,
      ease: "sine.inOut",
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
    REBIRTH.satMats.forEach((m, i) =>
      toU(
        m.uniforms.uOpacity,
        0.62 + i * 0.09,
        3.8,
        R + 3.0 + i * 1.05,
        "power1.out",
      ),
    );
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
      finishIntroAndGoToLogin();
    }, BEAT.END);

    tl.pause(0);
    startSoundtrack().then((audioStarted) => {
      if (audioStarted && soundtrack) {
        const initialTime = clamp(soundtrack.currentTime - BEAT.MUSIC_OFFSET, 0, BEAT.END);
        tl.time(initialTime, false);
      } else {
        SYNC.fallbackClock = true;
        SYNC.fallbackStart = performance.now();
        tl.time(0, false);
      }
    });
  }

  btnDespertar.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startIntro(e);
  });

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
      (Math.sin(t * 1.23) * 0.5 + Math.sin(t * 0.87 + 1.7) * 0.5) * lf * 4.0;
    const lowY =
      (Math.cos(t * 1.39 + 0.4) * 0.5 + Math.cos(t * 0.91 + 2.0) * 0.5) *
      lf *
      3.5;
    const midX =
      (Math.sin(t * 12.76) * 0.4 + Math.sin(t * 18.63) * 0.6) * mf * 2.5;
    const midY =
      (Math.cos(t * 11.58) * 0.4 + Math.cos(t * 22.41) * 0.6) * mf * 2.5;
    
    _hfIdx = (_hfIdx + 1) & (HF_TABLE_SIZE - 1);
    const highX =
      (_hfTableX[_hfIdx] * 0.5 + Math.sin(t * 45.4) * 0.5) * hf * 5.0;
    const highY =
      (_hfTableY[_hfIdx] * 0.5 + Math.cos(t * 43.1) * 0.5) * hf * 5.0;
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
      smoothstepJS(BH_SCALE.REVEAL_FULL_DIST, BH_SCALE.REVEAL_START_DIST, dist);
    const lensReveal =
      1.0 -
      smoothstepJS(BH_SCALE.LENS_FULL_DIST, BH_SCALE.LENS_START_DIST, dist);
    const plunge = 1.0 - smoothstepJS(8.0, 31.0, dist);

    if (HOST.bulgeMat?.uniforms?.uRevealBH)
      HOST.bulgeMat.uniforms.uRevealBH.value = Math.max(
        HOST.bulgeMat.uniforms.uRevealBH.value,
        reveal * 0.72,
      );
    if (HOST.starMat?.uniforms?.uCoreDimming)
      HOST.starMat.uniforms.uCoreDimming.value = Math.max(
        HOST.starMat.uniforms.uCoreDimming.value,
        reveal * 0.98,
      );

    if (BH.ctrl) {
      BH.ctrl.reveal = Math.max(BH.ctrl.reveal || 0, reveal);
      BH.ctrl.plunge = Math.max(BH.ctrl.plunge || 0, plunge * 0.72);
    }

    _centerV3.set(0, 0, 0).project(camera);
    _edgeV3.set(DISK_IN * 2.55, 0, 0).project(camera);

    const visible =
      _centerV3.z > -1 &&
      _centerV3.z < 1 &&
      Math.abs(_centerV3.x) < 1.35 &&
      Math.abs(_centerV3.y) < 1.35;

    _edgeV2.set(_edgeV3.x - _centerV3.x, _edgeV3.y - _centerV3.y);
    const projectedRadius = _edgeV2.length() * 0.5;

    const cx = clamp(0.5 + _centerV3.x * 0.5, 0.02, 0.98);
    const cy = clamp(0.5 + _centerV3.y * 0.5, 0.02, 0.98);

    lensPass.uniforms.uCenter.value.set(cx, cy);
    warpPass.uniforms.uCenter.value.set(cx, cy);
    anamPass.uniforms.uCenter.value.set(cx, cy);

    const autoRadius = THREE.MathUtils.clamp(
      projectedRadius * THREE.MathUtils.lerp(0.72, 1.08, plunge),
      0.0014,
      THREE.MathUtils.lerp(0.012, 0.030, plunge),
    );
    const autoStrength =
      THREE.MathUtils.lerp(0.0, 0.008, lensReveal) + plunge * 0.012;
    lensPass.uniforms.uRadius.value = Math.max(
      autoRadius,
      lensPass.uniforms.uRadius.value * 0.985,
    );
    // O lensPass não desenha mais o buraco negro: apenas distorce discretamente a luz ao redor do mesh 3D.
    lensPass.uniforms.uActive.value = visible ? Math.max(lensReveal * 0.22, reveal * 0.10) : 0;
    lensPass.uniforms.uStrength.value = Math.max(
      lensPass.uniforms.uStrength.value,
      autoStrength,
    );
    lensPass.uniforms.uSpin.value = Math.max(
      lensPass.uniforms.uSpin.value,
      THREE.MathUtils.lerp(0.0, 1.45, reveal),
    );
    lensPass.uniforms.uPlunge.value = Math.max(lensPass.uniforms.uPlunge.value, plunge);
    lensPass.uniforms.uTime.value = t;

    anamPass.uniforms.uStrength.value = Math.max(
      anamPass.uniforms.uStrength.value,
      reveal * 0.012 + plunge * 0.045,
    );
  }

  function syncTimelineToSoundtrack() {
    const tl = SYNC.timeline;
    if (!ST.started || !tl) return;

    let targetTime = SYNC.lastTimelineTime;

    if (SYNC.audioClock && soundtrack && !soundtrack.paused && !soundtrack.ended) {
      targetTime = clamp(soundtrack.currentTime - BEAT.MUSIC_OFFSET, 0, BEAT.END);
    } else if (SYNC.fallbackClock) {
      targetTime = clamp((performance.now() - SYNC.fallbackStart) / 1000, 0, BEAT.END);
    } else {
      return;
    }

    if (targetTime >= BEAT.END - 0.035 || (SYNC.audioClock && soundtrack?.ended)) {
      tl.time(BEAT.END, false);
      finishIntroAndGoToLogin();
      return;
    }

    // Pequenas diferenças são corrigidas suavemente; engasgos grandes pulam para o tempo certo.
    const current = tl.time();
    const diff = targetTime - current;
    const syncedTime = Math.abs(diff) > 0.18 ? targetTime : current + diff * 0.55;

    SYNC.lastTimelineTime = syncedTime;
    tl.time(syncedTime, false);
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER LOOP
  // ═══════════════════════════════════════════════════════════════
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.033);
    const t = clock.elapsedTime;

    syncTimelineToSoundtrack();

    for (let i = 0; i < _allTimeMats.length; i++) {
      _allTimeMats[i].uniforms.uT.value = t;
    }

    REBIRTH.grp.rotation.y += dt * 0.012;
    REBIRTH.grp.rotation.z += dt * 0.004;

    if (ST.tunneling) {
      bgStars.pts.rotation.y += dt * 0.008;
      bgStars.pts.rotation.x += dt * 0.002;
    }

    if (cosmicGrp.visible) {
      for (let i = 0; i < COSMIC_OBJECTS.length; i++) {
        const obj = COSMIC_OBJECTS[i];
        if (obj.mesh) obj.mesh.rotation.z += dt * 0.025;
      }
    }

    for (let i = 0; i < PASS_GALAXIES.length; i++) {
      const g = PASS_GALAXIES[i];
      if (g.visible) g.rotation.z += dt * 0.08;
    }

    if (ST.bhAlive && BH.grp.visible) {
      const bhSpin = 0.22 + (BH.ctrl?.spin || 0) * 1.35;
      const bhPlunge = BH.ctrl?.plunge || 0;
      const bhLift = BH.ctrl?.diskLift || 0;

      BH.disk.rotation.z += dt * (0.12 + bhSpin * 0.22);
      BH.lensedDisk.rotation.z += dt * (0.18 + bhSpin * 0.32);
      BH.photonRing.rotation.z -= dt * (1.25 + bhSpin * 2.2);
      BH.iscoRing.rotation.z += dt * (1.85 + bhSpin * 1.55);
      BH.hotspotGrp.rotation.y += dt * (0.92 + bhSpin * 1.8);
      BH.ergosphere.rotation.y -= dt * (0.035 + bhSpin * 0.065);
      BH.corona.rotation.y += dt * (0.018 + bhSpin * 0.045);
      BH.halo.rotation.y -= dt * 0.012;
      BH.magLines.rotation.y += dt * (0.045 + bhSpin * 0.075);
      BH.jetA.scale.y = 1.0 + Math.sin(t * 3.2) * 0.025 + bhPlunge * 0.22;
      BH.jetB.scale.y = 0.82 + Math.cos(t * 2.7) * 0.022 + bhPlunge * 0.18;
      BH.jetA.scale.x = BH.jetA.scale.z = 0.32 + bhPlunge * 0.035;
      BH.jetB.scale.x = BH.jetB.scale.z = 0.24 + bhPlunge * 0.028;
      if (BH.gasVolume) BH.gasVolume.rotation.y += dt * (0.20 + bhSpin * 0.55);
      if (BH.gasMat) BH.gasMat.opacity = Math.min(0.34, (BH.diskMat?.uniforms?.uOpacity?.value || 0) * 0.18);

      const bhMats = [
        BH.horizonMat,
        BH.ergosphereMat,
        BH.diskMat,
        BH.lensedDiskMat,
        BH.photonMat,
        BH.iscoMat,
        BH.coronaMat,
        BH.haloMat,
        BH.hotspotMat,
        BH.jetMatA,
        BH.jetMatB,
      ];
      for (let i = 0; i < bhMats.length; i++) {
        const u = bhMats[i]?.uniforms;
        if (!u) continue;
        if (u.uSpin) u.uSpin.value = bhSpin;
        if (u.uPlunge) u.uPlunge.value = bhPlunge;
        if (u.uDiskLift) u.uDiskLift.value = bhLift;
      }
    }

    calcShake(t, dt);
    _basePos.copy(camera.position);
    const breath = Math.sin(t * 0.45) * breathCtrl.amp;

    camera.position.set(
      _basePos.x + _sh.x,
      _basePos.y + _sh.y + breath,
      _basePos.z,
    );
    camera.lookAt(lookTarget);
    camera.rotateZ(camRoll.z + _sh.roll);

    updateBlackHoleProjection(t);

    composer.render();
    camera.position.copy(_basePos);
  });

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