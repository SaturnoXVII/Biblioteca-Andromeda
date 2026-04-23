
document.addEventListener("DOMContentLoaded", () => {
  const mount        = document.getElementById("webgl-container");
  const grainCanvas  = document.getElementById("grain-canvas");
  const btnDespertar = document.getElementById("btn-despertar");
  const uiLayer      = document.getElementById("ui-layer");
  const introBlock   = document.getElementById("intro-block");
  const titleText    = document.getElementById("title-text");
  const subtitleText = document.getElementById("subtitle-text");
  const soundtrack   = document.getElementById("intro-music") || document.querySelector("audio");

  if (!mount || !btnDespertar || typeof THREE === "undefined" || typeof gsap === "undefined") return;

  // ═══════════════════════════════════════════════════════════════
  // MAPA MUSICAL (offset relativo ao clique)
  // ═══════════════════════════════════════════════════════════════
  const BEAT = {
    MUSIC_OFFSET  : 18,
    CONTEMPLATE   : 0.0,   // plano aberto
    ARC_START     : 2.0,   // arco orbital
    DIVE_START    : 4.5,   // mergulho
    BH_REVEAL     : 8.5,   // revelação BH
    CHAOS_START   : 10.5,  // caos de maré
    TRAVEL_START  : 14.0,  // travessia
    SILENCE_START : 22.5,  // blackout
    REBIRTH_START : 25.5,  // renascimento
    FINAL_PULL    : 36.0,  // pullback final
    END           : 41.0,  // fade out
  };

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const rnd   = (a, b)    => a + Math.random() * (b - a);

  function ensureOverlay(id, css) {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("div"); el.id = id; document.body.appendChild(el); }
    el.style.cssText += css;
    return el;
  }

  function createLetterbox() {
    const make = (id, pos) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("div"); el.id = id; document.body.appendChild(el); }
      el.style.cssText += `
        position:fixed; left:0; width:100%; height:0px; background:#000;
        z-index:200; pointer-events:none; will-change:height;
        box-shadow:0 0 90px 30px rgba(0,0,0,.85); ${pos}`;
      return el;
    };
    return { top: make("bar-top","top:0;"), bottom: make("bar-bottom","bottom:0;") };
  }

  function roughEaseConfig() {
    if (typeof RoughEase !== "undefined" && RoughEase.ease?.config)
      return RoughEase.ease.config({ template:"none", strength:3.2, points:58, taper:"none", randomize:true, clamp:false });
    return "power4.inOut";
  }

  function disposeNode(root) {
    if (!root) return;
    root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        [obj.material].flat().forEach(m => m?.dispose?.());
      }
    });
    root.parent?.remove(root);
  }

  function initGrain(canvas) {
    if (!canvas) return { resize() {} };
    const ctx    = canvas.getContext("2d", { alpha:true });
    const off    = document.createElement("canvas");
    const offCtx = off.getContext("2d", { alpha:true });
    function resize() {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      off.width = 220; off.height = 120;
      Object.assign(canvas.style, { position:"fixed", inset:"0", pointerEvents:"none",
        mixBlendMode:"screen", opacity:"0.038", zIndex:"6", width:"100%", height:"100%" });
    }
    function render() {
      const img = offCtx.createImageData(off.width, off.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() * 255) | 0;
        d[i]=n; d[i+1]=n; d[i+2]=n; d[i+3]=12;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(render);
    }
    resize(); render();
    return { resize };
  }

  function startSoundtrack() {
    if (!soundtrack) return;
    try {
      soundtrack.currentTime = BEAT.MUSIC_OFFSET;
      const p = soundtrack.play();
      if (p?.catch) p.catch(() => {});
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════════
  // OVERLAYS & LETTERBOX
  // ═══════════════════════════════════════════════════════════════
  const overlays = {
    fade  : ensureOverlay("intro-fade-overlay",  "position:fixed;inset:0;z-index:130;pointer-events:none;background:#000;opacity:0;"),
    flash : ensureOverlay("intro-flash-overlay", "position:fixed;inset:0;z-index:131;pointer-events:none;background:#fff;opacity:0;"),
    // Hawking flare — branco quente levemente azulado
    hawking: ensureOverlay("hawking-overlay",    "position:fixed;inset:0;z-index:132;pointer-events:none;background:radial-gradient(ellipse at center,#c8e0ff 0%,#fff 40%,#000 100%);opacity:0;"),
  };

  const letterbox = createLetterbox();
  const grain     = initGrain(grainCanvas);

  // ═══════════════════════════════════════════════════════════════
  // VIEWPORT / ESTADO
  // ═══════════════════════════════════════════════════════════════
  const view = { w: window.innerWidth, h: window.innerHeight };
  const LB_H = Math.round(view.h * 0.118); // 2.35:1 aspect

  const state = {
    started:    false,
    tunneling:  false,
    finale:     false,
    trauma:     0,
    breathAmp:  0,   // câmera "respirando" como handheld
    hostAlive:  true,
    bhAlive:    true,
    lensFlareT: 0,
  };

  const lookTarget   = new THREE.Vector3(0, 0, 0);
  const camBasePos   = new THREE.Vector3(198, 26, 372);
  const bhProjected  = new THREE.Vector3();
  const origin       = new THREE.Vector3(0, 0, 0);

  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES FÍSICAS (inspiradas EHT M87*)
  // Rs = raio de Schwarzschild normalizado = 1 unidade
  // ═══════════════════════════════════════════════════════════════
  const EH_R     = 3.0;              // event horizon
  const PHOTON_R = EH_R * 1.5;      // photon sphere (3/2 Rs)
  const ISCO_R   = EH_R * 3.0;      // innermost stable circular orbit (6 Rs)
  const DISK_IN  = EH_R * 1.08;     // inner edge (acima ISCO)
  const DISK_OUT = EH_R * 7.5;      // outer edge

  // ═══════════════════════════════════════════════════════════════
  // SCENE / CAMERA / RENDERER
  // ═══════════════════════════════════════════════════════════════
  const scene = new THREE.Scene();
  scene.fog   = new THREE.FogExp2(0x00010a, 0.00052);

  // FOV 32° — teleobjetiva Kubrick, comprime profundidade
  const camera = new THREE.PerspectiveCamera(32, view.w / view.h, 0.05, 18000);
  camera.position.copy(camBasePos);
  camera.lookAt(origin);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
    alpha: true,
  });
  renderer.setSize(view.w, view.h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputEncoding     = THREE.sRGBEncoding;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  mount.appendChild(renderer.domElement);

  // ═══════════════════════════════════════════════════════════════
  // POST FX PIPELINE
  // renderPass → bloom → gravLens → dof → warp → chroma → vignette
  // ═══════════════════════════════════════════════════════════════
  const renderPass = new THREE.RenderPass(scene, camera);

  const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(view.w, view.h), 0.72, 0.38, 0.88);
  bloomPass.threshold = 0.048;
  bloomPass.strength  = 0.72;
  bloomPass.radius    = 0.68;

  // ─── Gravitational Lens (GRMHD-inspired, Einstein ring) ───────
  const GravLensShader = {
    uniforms: {
      tDiffuse   : { value: null },
      uBHCenter  : { value: new THREE.Vector2(0.5, 0.5) },
      uStrength  : { value: 0.0 },
      uEHRadius  : { value: 0.02 },
      uActive    : { value: 0.0 },
      uAspect    : { value: view.w / view.h },
      uRingBoost : { value: 0.0 }, // intensidade do anel de Einstein
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2  uBHCenter;
      uniform float uStrength, uEHRadius, uActive, uAspect, uRingBoost;
      varying vec2 vUv;

      void main() {
        if (uActive < 0.001) { gl_FragColor = texture2D(tDiffuse, vUv); return; }

        vec2 delta  = vUv - uBHCenter;
        delta.x    *= uAspect;
        float dist  = length(delta);
        delta.x    /= uAspect;

        // sombra absoluta do horizonte
        if (dist < uEHRadius * 0.82) { gl_FragColor = vec4(0.,0.,0.,1.); return; }

        // deflexão gravitacional radial
        float bend = uStrength / (dist * dist + 0.000065);
        bend = clamp(bend, 0., dist * 0.96);

        vec2 dir    = normalize(vUv - uBHCenter);
        vec2 bentUv = clamp(vUv - dir * bend * uActive, 0.001, 0.999);
        vec4 col    = texture2D(tDiffuse, bentUv);

        // anel de Einstein (multi-camada)
        float ph1 = uEHRadius * 2.62;
        float ph2 = uEHRadius * 2.12;
        float rw  = uEHRadius * 0.13;
        float ring1 = exp(-pow((dist - ph1)/rw, 2.)*2.5);
        float ring2 = exp(-pow((dist - ph2)/rw, 2.)*2.8) * 0.55;
        col.rgb += vec3(1.,.88,.56) * (ring1 + ring2) * 5.2 * uActive * (1. + uRingBoost);

        // penumbra gravitacional
        float shadow = smoothstep(uEHRadius * 0.82, uEHRadius * 3.2, dist);
        col.rgb *= mix(0.04, 1., shadow);

        gl_FragColor = col;
      }`,
  };
  const lensPass = new THREE.ShaderPass(GravLensShader);

  // ─── Anamorphic Lens Flare (horizontal streaks) ────────────────
  const AnamorphicShader = {
    uniforms: {
      tDiffuse  : { value: null },
      uCenter   : { value: new THREE.Vector2(0.5, 0.5) },
      uStrength : { value: 0.0 },
      uColor    : { value: new THREE.Color(0.62, 0.82, 1.0) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2      uCenter;
      uniform float     uStrength;
      uniform vec3      uColor;
      varying vec2 vUv;

      void main() {
        vec4 base = texture2D(tDiffuse, vUv);
        if (uStrength < 0.001) { gl_FragColor = base; return; }

        // streak horizontal anamórfico
        float dy    = (vUv.y - uCenter.y);
        float dist  = abs(dy) + 0.001;
        float streak = exp(-dist * dist * 280.) * exp(-abs(vUv.x - uCenter.x) * 1.6);
        streak *= uStrength;

        // cores: azul-ciano típico de lentes anamórficas Cooke/Panavision
        vec3 flare = uColor * streak * 3.8;
        gl_FragColor = vec4(base.rgb + flare, base.a);
      }`,
  };
  const anamorphicPass = new THREE.ShaderPass(AnamorphicShader);

  // ─── Radial Motion Blur (Warp / Zoom Streak) ──────────────────
  const WarpShader = {
    uniforms: {
      tDiffuse : { value: null },
      uAmount  : { value: 0.0 },
      uTime    : { value: 0.0 },
      uCenter  : { value: new THREE.Vector2(0.5, 0.5) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uAmount, uTime;
      uniform vec2  uCenter;
      varying vec2 vUv;

      void main() {
        vec2 delta = vUv - uCenter;
        float dist = length(delta);
        float warp = uAmount * pow(dist, 1.82) * 0.092;

        vec4  col   = vec4(0.);
        float total = 0.;
        for (int i = 0; i < 24; i++) {
          float t  = float(i) / 23.;
          float sc = 1. - warp * t;
          vec2 uv  = clamp(uCenter + delta * sc, .001, .999);
          float w  = 1. - t * 0.58;
          col += texture2D(tDiffuse, uv) * w;
          total += w;
        }
        gl_FragColor = col / total;
      }`,
  };
  const warpPass = new THREE.ShaderPass(WarpShader);

  // ─── Chromatic Aberration ──────────────────────────────────────
  const ChromaShader = {
    uniforms: { tDiffuse:{ value:null }, uStrength:{ value:0. } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        vec2 c = vUv - .5;
        float d = length(c);
        vec2 off = c * d * d * uStrength * 2.2;
        float r = texture2D(tDiffuse, vUv - off * 2.0).r;
        float g = texture2D(tDiffuse, vUv - off * 0.5).g;
        float b = texture2D(tDiffuse, vUv + off * 1.2).b;
        gl_FragColor = vec4(r,g,b,1.);
      }`,
  };
  const chromaticPass = new THREE.ShaderPass(ChromaShader);

  // ─── Vinheta Cinemática (oval, não circular) ──────────────────
  const VignetteShader = {
    uniforms: { tDiffuse:{ value:null }, uIntensity:{ value:0.52 }, uAspect:{ value: view.w/view.h } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uIntensity, uAspect;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        vec2 uv = vUv - .5;
        uv.x *= uAspect;
        float d = length(uv) * 1.32;
        float v = 1. - d * d * uIntensity;
        gl_FragColor = vec4(c.rgb * clamp(v, 0., 1.), c.a);
      }`,
  };
  const vignettePass = new THREE.ShaderPass(VignetteShader);
  vignettePass.renderToScreen = true;

  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(lensPass);
  composer.addPass(anamorphicPass);
  composer.addPass(warpPass);
  composer.addPass(chromaticPass);
  composer.addPass(vignettePass);

  // ═══════════════════════════════════════════════════════════════
  // STARS DE FUNDO — classificação espectral OBAFGKM
  // ═══════════════════════════════════════════════════════════════
  const spectralClasses = [
    { color: new THREE.Color(0x9bbcff), size: 1.62, weight: 0.01 }, // O
    { color: new THREE.Color(0xb7c8ff), size: 1.38, weight: 0.03 }, // B
    { color: new THREE.Color(0xdde5ff), size: 1.12, weight: 0.08 }, // A
    { color: new THREE.Color(0xf8f7ff), size: 0.98, weight: 0.14 }, // F
    { color: new THREE.Color(0xfff1c9), size: 0.94, weight: 0.18 }, // G (Sol)
    { color: new THREE.Color(0xffddb2), size: 1.04, weight: 0.24 }, // K
    { color: new THREE.Color(0xffb18a), size: 1.22, weight: 0.32 }, // M (maioria)
  ];
  function pickSpectral() {
    let acc = 0, r = Math.random();
    for (const s of spectralClasses) { acc += s.weight; if (r <= acc) return s; }
    return spectralClasses.at(-1);
  }

  function createBackgroundStars() {
    const N   = 20000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const sz  = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const r     = 2800 + Math.random() * 6500;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const s     = pickSpectral();
      pos[i*3]   = Math.sin(phi)*Math.cos(theta)*r;
      pos[i*3+1] = Math.cos(phi)*r*0.78;
      pos[i*3+2] = Math.sin(phi)*Math.sin(theta)*r;
      col[i*3]   = s.color.r; col[i*3+1] = s.color.g; col[i*3+2] = s.color.b;
      sz[i]      = s.size * (0.38 + Math.random() * 1.4);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("color",    new THREE.BufferAttribute(col,3));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sz, 1));

    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms: { uTime:{ value:0 }, uTwinkle:{ value:0. } },
      vertexShader:`
        attribute float aSize;
        varying vec3 vColor;
        void main(){
          vColor=color;
          vec4 mv=modelViewMatrix*vec4(position,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=(14.0/-mv.z)*aSize;
        }`,
      fragmentShader:`
        varying vec3 vColor;
        void main(){
          vec2 p=gl_PointCoord-.5;
          float d=dot(p,p)*4.;
          float s=exp(-d*5.2);
          gl_FragColor=vec4(vColor*s, s*.55);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return { pts, mat };
  }
  const background = createBackgroundStars();

  // ═══════════════════════════════════════════════════════════════
  // GALÁXIA HOSPEDEIRA — Via Láctea estilizada
  // 5 braços espirais, barra central, HII regions, dust lanes
  // ═══════════════════════════════════════════════════════════════
  function createHostGalaxy() {
    const group = new THREE.Group();
    group.rotation.x = -0.12;
    group.rotation.z = 0.018;
    scene.add(group);

    const SC   = 200000;
    const ARMS = 5;
    const PITCH= 0.195;
    const MAX_R= 185;

    const geo  = new THREE.BufferGeometry();
    const pos  = new Float32Array(SC * 3);
    const col  = new Float32Array(SC * 3);
    const rnd3 = new Float32Array(SC * 3);
    const sz   = new Float32Array(SC);

    const pinkHII  = new THREE.Color(0xff6090);
    const blueHII  = new THREE.Color(0x6090ff);
    const laneCol  = new THREE.Color(0x1a0a28); // dust lane escuro

    for (let i = 0; i < SC; i++) {
      const i3    = i * 3;
      const isCore= Math.random() < 0.10;
      const isHII = !isCore && Math.random() < 0.04; // regiões HII

      let radius, theta, armFactor = 0;

      if (isCore) {
        radius = Math.pow(Math.random(), 1.6) * 14 + 0.4;
        theta  = Math.random() * Math.PI * 2;
      } else if (isHII) {
        // clusters HII ao longo dos braços
        const arm = Math.floor(Math.random() * ARMS);
        armFactor  = arm / ARMS;
        const base = armFactor * Math.PI * 2;
        radius = 22 + Math.pow(Math.random(), 2.2) * 120;
        const spiral = Math.log(radius / 4.) / Math.tan(PITCH);
        theta  = base + spiral + (Math.random() - .5) * 0.35;
      } else {
        radius = 6 + Math.pow(Math.random(), 2.05) * MAX_R;
        const arm = Math.floor(Math.random() * ARMS);
        armFactor  = arm / ARMS;
        const base = armFactor * Math.PI * 2;
        const spiral = Math.log(radius / 4.) / Math.tan(PITCH);
        theta  = base + spiral + (Math.random() - .5) * 0.82;
      }

      // Warp galáctico — ondulação vertical (Galactic Warp)
      const warpPhase = Math.sin(theta * 1.5 + armFactor * 6.28) * (radius / MAX_R) * 9.5;
      const falloff   = Math.exp(-radius / 34.);
      const spread    = isCore ? Math.random()*2.2 : Math.pow(Math.random(),1.85)*5.8;
      const sa        = Math.random() * Math.PI * 2;

      const x = Math.cos(theta)*radius + Math.cos(sa)*spread;
      const z = Math.sin(theta)*radius + Math.sin(sa)*spread;
      const y = (Math.random()-.5) * (isCore ? 11. : 2.6) * falloff
              + warpPhase * 0.22 * (1. - falloff)
              + Math.sin(radius*.032 + theta*.75) * 0.44 * falloff;

      pos[i3]=x; pos[i3+1]=y; pos[i3+2]=z;

      let c;
      if (isHII) {
        // rosa/azul HII (nebulosas de emissão)
        c = Math.random() < .55 ? pinkHII.clone() : blueHII.clone();
        c.lerp(new THREE.Color(0xffffff), Math.random() * 0.3);
        sz[i] = 1.6 + Math.random() * 1.2;
      } else {
        const spec = pickSpectral();
        c = spec.color.clone();
        if (isCore) c.lerp(new THREE.Color(0xffcc78), 0.48);
        // dust lane: estrelas perto do plano ficam mais avermelhadas (reddening)
        const planeDist = Math.abs(y) / (radius * 0.04 + 1.);
        if (planeDist < 0.8 && !isCore) c.lerp(new THREE.Color(0xff7040), 0.12 * (1.-planeDist));
        sz[i] = spec.size * (isCore ? 1.32 : 1.0) * (.72 + Math.random()*.6);
      }

      col[i3]=c.r; col[i3+1]=c.g; col[i3+2]=c.b;
      rnd3[i3]=Math.random(); rnd3[i3+1]=Math.random(); rnd3[i3+2]=Math.random();
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("color",    new THREE.BufferAttribute(col,3));
    geo.setAttribute("aRnd",     new THREE.BufferAttribute(rnd3,3));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sz,1));

    const starMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms: {
        uTime    : { value:0 },
        uSpeed   : { value:1. },
        uDive    : { value:0. },
        uSuck    : { value:0. },
        uOpacity : { value:1. },
        uBreath  : { value:0. },
      },
      vertexShader:`
        uniform float uTime,uSpeed,uDive,uSuck,uBreath;
        attribute vec3 aRnd;
        attribute float aSize;
        varying vec3 vColor;
        varying float vStretch;

        void main(){
          vec3 p=position;
          float radius=length(p.xz);
          float angle=atan(p.z,p.x);

          // rotação diferencial de Keplerian
          float rotVel=(0.46/(radius*.076+1.))*(.82+aRnd.z*.48);
          angle+=uTime*rotVel;

          float suck=smoothstep(0.,1.,uSuck);
          float targetR=mix(radius,max(.7,radius*.028),pow(suck,1.6));
          float curR=mix(radius,targetR,suck);

          p.x=cos(angle)*curR;
          p.z=sin(angle)*curR;
          p.y*=mix(1.,.06,suck);

          // breathing (handheld sim)
          p.y+=sin(uTime*1.4+aRnd.x*22.+radius*.028)*.14*(1.-suck)*uBreath;

          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;

          float speedN=clamp(uSpeed/260.,0.,1.);
          vStretch=mix(1.,3.2,speedN);
          gl_PointSize=(36./-mv.z)*aSize*vStretch;
          vColor=color;
        }`,
      fragmentShader:`
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vStretch;
        void main(){
          vec2 uv=gl_PointCoord-.5;
          uv.x/=vStretch;
          float d=dot(uv,uv)*4.;
          float core=exp(-d*11.2);
          float halo=exp(-d*2.8)*.18;
          float s=core+halo;
          gl_FragColor=vec4(vColor*s*uOpacity, s*.92*uOpacity);
        }`,
    });
    const stars = new THREE.Points(geo, starMat);
    group.add(stars);

    // Bojo galáctico volumétrico
    const bulgeMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:.82 } },
      vertexShader:`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec3 vP;
        void main(){
          float r=length(vP)/14.;
          float glow=exp(-r*r*2.6);
          float pulse=.92+.08*sin(uTime*.48);
          vec3 col=mix(vec3(1.,.76,.34),vec3(.56,.18,.06),pow(r,.62));
          gl_FragColor=vec4(col*glow*pulse*uOpacity, glow*.65*uOpacity);
        }`,
    });
    const bulge = new THREE.Mesh(new THREE.SphereGeometry(14,56,56), bulgeMat);
    bulge.scale.set(1., .68, 1.);
    group.add(bulge);

    // Nebulosas / nuvens de ionização (HII regions como grandes blobs)
    const NEBULA = 6;
    const nebulaMats = [];
    for (let n = 0; n < NEBULA; n++) {
      const arm   = Math.floor(Math.random() * ARMS);
      const base  = (arm / ARMS) * Math.PI * 2;
      const r     = 30 + Math.random() * 120;
      const sp    = Math.log(r/4.) / Math.tan(PITCH);
      const th    = base + sp;
      const nx    = Math.cos(th) * r;
      const nz    = Math.sin(th) * r;
      const scale = 8 + Math.random() * 18;

      const nebulaCol = Math.random() < .5 ? [0.9,0.25,0.45] : [0.28,0.55,0.92];
      const nebMat = new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending,
        uniforms:{ uTime:{ value:0 }, uOpacity:{ value:.55+Math.random()*.3 }, uColor:{ value: new THREE.Vector3(...nebulaCol) } },
        vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader:`
          uniform float uTime,uOpacity;
          uniform vec3 uColor;
          varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
          float noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
          float fbm(vec2 p){ float f=0.,w=.5; for(int i=0;i<5;i++){ f+=w*noise(p); p*=2.1; w*=.5; } return f; }
          void main(){
            vec2 uv=vUv-.5;
            float r=length(uv)*2.;
            float n=fbm(uv*4.+uTime*.022);
            float mask=smoothstep(1.,.08,r)*n;
            float alpha=mask*.22*uOpacity;
            gl_FragColor=vec4(uColor*alpha*2.5, alpha);
          }`,
      });
      nebulaMats.push(nebMat);
      const neb = new THREE.Mesh(new THREE.PlaneGeometry(scale,scale), nebMat);
      neb.position.set(nx, (Math.random()-.5)*3., nz);
      neb.rotation.x = -Math.PI*.5 + (Math.random()-.5)*.3;
      group.add(neb);
    }

    // Dust lanes (partículas escuras / absorção)
    const DC = 44000;
    const dustGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(DC*3), dCol = new Float32Array(DC*3), dRnd = new Float32Array(DC);
    for (let i = 0; i < DC; i++) {
      const arm   = Math.floor(Math.random()*ARMS);
      const base  = (arm/ARMS)*Math.PI*2;
      const r     = 10 + Math.pow(Math.random(),1.28)*(MAX_R-24);
      const sp    = Math.log(r/4.)/Math.tan(PITCH);
      const th    = base + sp + (Math.random()-.5)*.42;
      const side  = (Math.random()-.5)*11.;
      const i3    = i*3;

      dPos[i3]   = Math.cos(th)*r + Math.cos(th+Math.PI*.5)*side;
      dPos[i3+1] = (Math.random()-.5)*3.1*Math.exp(-r/40.) + Math.sin(th*2.)*.38*(1.-r/MAX_R);
      dPos[i3+2] = Math.sin(th)*r + Math.sin(th+Math.PI*.5)*side;

      const c = [new THREE.Color(0x2244ff), new THREE.Color(0xd42875), new THREE.Color(0x8833ff), new THREE.Color(0xff8844)]
                [Math.floor(Math.random()*4)];
      dCol[i3]=c.r; dCol[i3+1]=c.g; dCol[i3+2]=c.b;
      dRnd[i] = Math.random();
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dPos,3));
    dustGeo.setAttribute("color",    new THREE.BufferAttribute(dCol,3));
    dustGeo.setAttribute("aRnd",     new THREE.BufferAttribute(dRnd,1));

    const dustMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:.48 } },
      vertexShader:`
        attribute float aRnd;
        varying vec3 vColor;
        void main(){
          vColor=color;
          float r=length(position.xz);
          float ang=atan(position.z,position.x)+uTime*(.16/(r*.08+1.));
          vec3 p=vec3(cos(ang)*r,position.y,sin(ang)*r);
          p.y+=sin(uTime*.72+r*.028+aRnd*8.)*.14;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=(110./-mv.z)*(.5+aRnd*2.2);
        }`,
      fragmentShader:`
        uniform float uOpacity;
        varying vec3 vColor;
        void main(){
          float d=length(gl_PointCoord-.5);
          float s=exp(-d*d*6.8)*.20;
          gl_FragColor=vec4(vColor*s*uOpacity, s*uOpacity);
        }`,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    group.add(dust);

    return { group, starMat, dustMat, bulgeMat, nebulaMats };
  }
  const hostGalaxy = createHostGalaxy();

  // ═══════════════════════════════════════════════════════════════
  // BURACO NEGRO — baseado em M87* / Sgr A* (EHT)
  // Event Horizon, Photon Ring, Accretion Disk com Doppler,
  // ISCO Hot Ring, Corona, Jets relativísticos, Hotspot orbital
  // ═══════════════════════════════════════════════════════════════
  function createBlackHole() {
    const group = new THREE.Group();
    scene.add(group);

    // Horizonte de eventos — sombra absoluta
    const eventHorizon = new THREE.Mesh(
      new THREE.SphereGeometry(EH_R, 192, 192),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    group.add(eventHorizon);

    // Photon Ring (anel de Einstein / photon sphere)
    const photonMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. } },
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec2 vUv;
        void main(){
          float angle=vUv.x*6.28318;
          // flickering não-uniforme (turbulência do plasma)
          float flicker=.7+.3*sin(angle*11.+uTime*4.8)*sin(angle*7.+uTime*6.9)*sin(angle*3.+uTime*2.2);
          float edge=abs(vUv.y-.5)*2.;
          float brightness=(1.-pow(edge,.28))*flicker;
          // cor: mix quente→frio dependendo do ângulo (Doppler beaming)
          float beam=(.5+.5*sin(angle+uTime*.9));
          vec3 col=mix(vec3(1.,.72,.24), vec3(.85,.96,1.), beam*.62+flicker*.38);
          gl_FragColor=vec4(col*brightness*uOpacity*4.8, brightness*uOpacity);
        }`,
    });
    const photonRing = new THREE.Mesh(new THREE.TorusGeometry(PHOTON_R, .055, 64, 720), photonMat);
    photonRing.rotation.x = Math.PI / 2.1;
    group.add(photonRing);

    // Halo de limb-brightening
    const haloMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, side:THREE.BackSide, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. } },
      vertexShader:`varying vec3 vN; void main(){ vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec3 vN;
        void main(){
          float rim=pow(abs(dot(vN,vec3(0.,0.,1.))),.72);
          float pulse=.88+.12*sin(uTime*1.7);
          vec3 col=mix(vec3(1.,.65,.18),vec3(.4,.78,1.),rim);
          float alpha=rim*pulse*uOpacity*.58;
          gl_FragColor=vec4(col*alpha, alpha*.5);
        }`,
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(EH_R*1.42,72,72), haloMat);
    group.add(halo);

    // Corona X-ray — plasma quente acima do disco
    const coronaMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. } },
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
        float fbm(vec2 p){ float f=0.,w=.5; for(int i=0;i<5;i++){ f+=w*noise(p); p*=2.; w*=.5; } return f; }
        void main(){
          vec2 uv=vUv-.5;
          float r=length(uv)*2.;
          float angle=atan(uv.y,uv.x);
          float streaks=fbm(vec2(angle*2.4, uTime*.072));
          float glow=exp(-r*1.85)*2.4;
          float mask=smoothstep(1.,.12,r);
          float intensity=glow*streaks*mask*uOpacity;
          // corona: laranja→azul (soft X-ray spectrum)
          vec3 col=mix(vec3(1.,.42,.08), vec3(.5,.82,1.), r*.42+streaks*.28);
          gl_FragColor=vec4(col*intensity, intensity*.72);
        }`,
    });
    const corona = new THREE.Mesh(new THREE.PlaneGeometry(36,36), coronaMat);
    corona.position.z = -.08;
    group.add(corona);

    // Disco de Acreção — Physically-Based
    // Doppler beaming, temperatura blackbody, turbulência MHD
    const diskMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:1. } },
      vertexShader:`
        varying vec2 vUv;
        varying vec3 vPos;
        void main(){ vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec2 vUv,vPos2;
        varying vec3 vPos;

        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
        float fbm(vec2 p){ float f=0.,w=.5; for(int i=0;i<7;i++){ f+=w*noise(p); p*=2.14; w*=.5; } return f; }

        vec3 blackbody(float T){
          // Temperatura vs cor de corpo negro (Wien)
          vec3 cold =vec3(.88,.06,.01);  // ~3000K vermelho
          vec3 warm =vec3(1.,.44,.06);   // ~5000K laranja
          vec3 white=vec3(1.,.96,.82);   // ~7000K branco
          vec3 blue =vec3(.74,.88,1.);   // ~15000K azul
          if(T<.25) return mix(cold,warm,T*4.);
          if(T<.55) return mix(warm,white,(T-.25)*3.33);
          return mix(white,blue,(T-.55)*2.22);
        }

        void main(){
          float radius=length(vPos.xy);
          float angle=atan(vPos.y,vPos.x);

          // velocidade kepleriana + relatividade
          float omega=1.58/(pow(radius,1.5)+.008);
          float swirl=angle+uTime*omega*.92 + 7.2/(radius+.08);

          // Doppler beaming relativístico
          float beta=.46*sqrt(${DISK_IN.toFixed(3)}/(radius+.001));
          beta=clamp(beta,0.,.96);
          float cosTheta=sin(angle-.68);
          float doppler=pow(1./max(1.-beta*cosTheta,.10), 4.5);
          doppler=clamp(doppler,.04,10.);

          // blueshift/redshift
          float shift=(cosTheta*beta+1.)*.5;
          vec3 dopplerTint=mix(vec3(1.,.18,.03), vec3(.38,.72,1.), shift);

          // temperatura: T ∝ r^(-3/4) (Novikov-Thorne)
          float rNorm=${DISK_IN.toFixed(3)}/(radius+.001);
          float Tnorm=pow(clamp(rNorm,0.,1.),.72);
          vec3 tempCol=blackbody(Tnorm);
          vec3 baseCol=mix(tempCol, dopplerTint, .48);

          // turbulência MHD multi-escala
          vec2 polUv=vec2(radius*.68, swirl*.48+uTime*.072);
          float gasA=fbm(polUv);
          float gasB=fbm(polUv*2.6-uTime*.18+4.);
          float gasC=fbm(polUv*5.2+uTime*.12+8.);
          float gas=gasA*.55+gasB*.28+gasC*.17;

          // dust lanes no disco
          float dust=smoothstep(.16,.74,fbm(polUv*3.8-uTime*.08));
          dust*=smoothstep(.08,.58,fbm(polUv*1.95+uTime*.06+7.4));

          float innerFade=smoothstep(${DISK_IN.toFixed(3)}, ${(DISK_IN+2.2).toFixed(3)}, radius);
          float outerFade=smoothstep(${DISK_OUT.toFixed(3)}, ${(DISK_OUT-2.8).toFixed(3)}, radius);
          float density=innerFade*outerFade;

          // gravitational redshift próximo ao horizonte
          float grav=1./sqrt(max(1.-2.8/(radius*3.+.001),.04));
          float intensity=clamp(density*gas*dust*doppler*grav*1.24, 0., 6.);
          gl_FragColor=vec4(baseCol*intensity*uOpacity, intensity*uOpacity*.98);
        }`,
    });
    const accretionDisk = new THREE.Mesh(
      new THREE.RingGeometry(DISK_IN, DISK_OUT, 1024, 256),
      diskMat
    );
    accretionDisk.rotation.x = Math.PI / 2.08;
    group.add(accretionDisk);

    // ISCO — innermost stable circular orbit (anel de plunge)
    const iscoMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. } },
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec2 vUv;
        void main(){
          float angle=vUv.x*6.28318;
          float dyn=.58+.42*sin(angle*8.+uTime*10.2)*sin(angle*5.+uTime*7.1)*sin(angle*3.+uTime*4.5);
          float fade=max(1.-abs(vUv.y-.5)*2.4, 0.);
          vec3 col=mix(vec3(1.,.55,.08),vec3(1.,.98,.92),dyn);
          gl_FragColor=vec4(col*fade*dyn*uOpacity*3.8, fade*dyn*uOpacity);
        }`,
    });
    const iscoRing = new THREE.Mesh(new THREE.TorusGeometry(ISCO_R*.82, .52, 28, 720), iscoMat);
    iscoRing.rotation.x = Math.PI / 2.08;
    group.add(iscoRing);

    // ─── HOTSPOT — ponto brilhante orbitando (observado no Sgr A*) ─
    // Em 2022, EHT captou hotspot orbitando Sgr A* em ~75min
    const hotspotMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. }, uOrbitR:{ value:ISCO_R } },
      vertexShader:`
        uniform float uTime,uOrbitR;
        void main(){
          // orbita circular no ISCO
          float ang=uTime*1.85; // período orbital relativístico
          vec3 p=vec3(cos(ang)*uOrbitR, sin(ang*0.18)*.4, sin(ang)*uOrbitR);
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=(22./-mv.z)*280.;
        }`,
      fragmentShader:`
        uniform float uOpacity;
        void main(){
          vec2 p=gl_PointCoord-.5;
          float d=dot(p,p)*4.;
          float core=exp(-d*12.);
          float glow=exp(-d*2.5)*.35;
          vec3 col=mix(vec3(1.,.92,.48), vec3(1.,.58,.12), d*.5);
          float s=core+glow;
          gl_FragColor=vec4(col*s*uOpacity*3.5, s*uOpacity);
        }`,
    });
    const hotspot = new THREE.Points(
      (() => { const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(new Float32Array([0,0,0]),3)); return g; })(),
      hotspotMat
    );
    group.add(hotspot);

    // ─── JETS RELATIVÍSTICOS ───────────────────────────────────────
    // Estrutura helicoidal com knots (ondas de choque)
    function createJet(dir) {
      const N = 3800;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N*3);
      const rnd = new Float32Array(N*2);
      const age = new Float32Array(N);
      const knot= new Float32Array(N); // knot index

      for (let i = 0; i < N; i++) {
        const t   = Math.random();
        const r   = t * t * t * 2.2;
        const ph  = Math.random() * Math.PI * 2;
        pos[i*3]   = Math.cos(ph)*r;
        pos[i*3+1] = t * 52. * dir;
        pos[i*3+2] = Math.sin(ph)*r;
        rnd[i*2]   = Math.random();
        rnd[i*2+1] = Math.random();
        age[i]     = t;
        knot[i]    = Math.floor(Math.random() * 5); // 5 knots por jet
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
      geo.setAttribute("aRnd",     new THREE.BufferAttribute(rnd,2));
      geo.setAttribute("aAge",     new THREE.BufferAttribute(age,1));
      geo.setAttribute("aKnot",    new THREE.BufferAttribute(knot,1));

      const mat = new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
        uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. }, uDir:{ value:dir } },
        vertexShader:`
          attribute vec2 aRnd;
          attribute float aAge,aKnot;
          uniform float uTime,uDir;
          varying float vAge,vKnot;
          void main(){
            vAge=aAge;
            vKnot=aKnot;
            float speed=.52+aRnd.x*.48;
            float flow=mod(aAge+uTime*speed*.24, 1.);
            float dist=flow*52.*uDir;
            float cone=flow*flow*2.4;
            float helix=uTime*1.62+aRnd.x*6.283;
            // knots: densificações periódicas (instabilidade de Kelvin-Helmholtz)
            float knotFactor=1.+1.8*exp(-pow(mod(flow*5.,1.)-.5, 2.)*22.)*smoothstep(.1,1.,flow);
            vec3 p;
            p.x=cos(helix)*cone*(.32+aRnd.x*.72)*knotFactor;
            p.y=dist;
            p.z=sin(helix)*cone*(.32+aRnd.x*.72)*knotFactor;
            vec4 mv=viewMatrix*modelMatrix*vec4(p,1.);
            gl_Position=projectionMatrix*mv;
            gl_PointSize=(9./-mv.z)*(.18+aRnd.y*.95)*(1.-flow*.48)*knotFactor;
          }`,
        fragmentShader:`
          uniform float uOpacity;
          varying float vAge,vKnot;
          void main(){
            float d=distance(gl_PointCoord,vec2(.5))*2.;
            float s=exp(-d*d*3.2);
            float alpha=s*uOpacity*(1.-vAge*.42);
            // cor: branco quente na base, azul no topo (sincrotron spectrum)
            vec3 a=vec3(1.,.98,.92);
            vec3 b=vec3(.28,.65,1.);
            vec3 c=vec3(.04,.06,.72);
            float t=clamp(vAge*1.5, 0., 1.);
            vec3 col=t<.5?mix(a,b,t*2.):mix(b,c,(t-.5)*2.);
            gl_FragColor=vec4(col*alpha*2.4, alpha);
          }`,
      });
      const pts = new THREE.Points(geo, mat);
      group.add(pts);
      return { pts, mat };
    }
    const jetA = createJet(1);
    const jetB = createJet(-1);

    // ─── LINHAS DE CAMPO MAGNÉTICO ─────────────────────────────────
    const MAG_LINES = 14;
    const magGroup  = new THREE.Group();
    const magMats   = [];
    for (let l = 0; l < MAG_LINES; l++) {
      const N   = 60;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      const phase = (l / MAG_LINES) * Math.PI * 2;
      for (let i = 0; i < N; i++) {
        const t = i / (N-1); // 0→1 do disco até o polo
        const r = DISK_IN + (DISK_OUT * .7 - DISK_IN) * (1. - t*t);
        const h = t * 22.;
        pos[i*3]   = Math.cos(phase) * r;
        pos[i*3+1] = h - 11.;
        pos[i*3+2] = Math.sin(phase) * r;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(.35,.65,1.), transparent:true, opacity:.0, blending:THREE.AdditiveBlending
      });
      magMats.push(mat);
      magGroup.add(new THREE.Line(geo, mat));
    }
    group.add(magGroup);

    return { group, photonMat, haloMat, coronaMat, diskMat, iscoMat, hotspotMat, jetA, jetB, magMats };
  }
  const blackHole = createBlackHole();

  // ═══════════════════════════════════════════════════════════════
  // PLASMA TIDAL / CAOS GRAVITACIONAL
  // Fluxo espiral + correntes de captura + stream de maré
  // ═══════════════════════════════════════════════════════════════
  function createTidalChaos() {
    // Partículas principais de plasma
    const N = 28000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N*3), col = new Float32Array(N*3), rnd = new Float32Array(N*2);
    for (let i = 0; i < N; i++) {
      const r = DISK_IN + Math.random()*(DISK_OUT*.98);
      const a = Math.random()*Math.PI*2;
      const i3=i*3;
      pos[i3]=Math.cos(a)*r; pos[i3+1]=(Math.random()-.5)*2.4; pos[i3+2]=Math.sin(a)*r;
      const c=[new THREE.Color(0xffac48), new THREE.Color(0xff3f70), new THREE.Color(0x8cc6ff)][Math.floor(Math.random()*3)];
      col[i3]=c.r; col[i3+1]=c.g; col[i3+2]=c.b;
      rnd[i*2]=Math.random(); rnd[i*2+1]=Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("color",    new THREE.BufferAttribute(col,3));
    geo.setAttribute("aRnd",     new THREE.BufferAttribute(rnd,2));

    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. }, uChaos:{ value:0. } },
      vertexShader:`
        attribute vec2 aRnd;
        uniform float uTime,uChaos;
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vColor=color;
          vec3 p=position;
          float r=length(p.xz);
          float a=atan(p.z,p.x);
          float chaos=smoothstep(0.,1.,uChaos);
          a+=uTime*(.88+aRnd.x*2.4)+chaos*(4.8+aRnd.y*9.2)/max(r,.72);
          r=mix(r,max(.45,r*.025),pow(chaos,1.55));
          p.x=cos(a)*r; p.z=sin(a)*r;
          p.y*=mix(1.,.05,chaos);
          p.y+=sin(uTime*18.+aRnd.x*44.)*.18*chaos;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=(32./-mv.z)*(.28+aRnd.x*1.1)*(1.+chaos*2.8);
          vAlpha=.32+.68*chaos;
        }`,
      fragmentShader:`
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vec2 p=gl_PointCoord-.5;
          float d=dot(p,p)*4.;
          float s=exp(-d*5.2);
          gl_FragColor=vec4(vColor*s*uOpacity*2.1, s*vAlpha*uOpacity);
        }`,
    });
    const particles = new THREE.Points(geo, mat);
    blackHole.group.add(particles);

    // Stream de maré — corrente de material sendo capturado
    // (Tidal Disruption Event stream)
    const STREAM = 9000;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(STREAM*3), sRnd = new Float32Array(STREAM*2);
    for (let i = 0; i < STREAM; i++) {
      // stream entra em espiral desde ~3x raio até o horizonte
      const t   = i / STREAM;
      const r   = DISK_OUT * .9 - t * (DISK_OUT * .9 - DISK_IN) + (Math.random()-.5)*3.;
      const ang = -t * Math.PI * 4.5 + (Math.random()-.5)*.8;
      sPos[i*3]   = Math.cos(ang)*r;
      sPos[i*3+1] = (Math.random()-.5)*.9;
      sPos[i*3+2] = Math.sin(ang)*r;
      sRnd[i*2]=Math.random(); sRnd[i*2+1]=Math.random();
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos,3));
    sGeo.setAttribute("aRnd",     new THREE.BufferAttribute(sRnd,2));

    const streamMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. }, uChaos:{ value:0. } },
      vertexShader:`
        attribute vec2 aRnd;
        uniform float uTime,uChaos;
        varying float vGlow,vT;
        void main(){
          vec3 p=position;
          float r=length(p.xz);
          float a=atan(p.z,p.x);
          float ch=smoothstep(0.,1.,uChaos);
          a+=uTime*(1.9+aRnd.x*2.0)+(7.2+aRnd.y*11.)*ch/max(r,.65);
          r=mix(r,max(.28,r*.04),pow(ch,1.78));
          p.x=cos(a)*r; p.z=sin(a)*r;
          p.y*=mix(1.,.12,ch);
          float t=1.-r/20.;
          vT=clamp(t,0.,1.);
          vGlow=.45+.55*ch;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          float streak=mix(1.,3.8,ch);
          gl_PointSize=(40./-mv.z)*(.55+aRnd.x*1.2)*streak;
        }`,
      fragmentShader:`
        uniform float uOpacity;
        varying float vGlow,vT;
        void main(){
          vec2 p=gl_PointCoord-.5;
          p.x*=.22;
          float d=dot(p,p)*5.;
          float core=exp(-d*4.2);
          // cor da stream: do frio (azul exterior) ao quente (laranja ISCO)
          vec3 col=mix(vec3(.45,.72,1.),vec3(1.,.44,.10), vT);
          gl_FragColor=vec4(col*core*uOpacity*2.8*vGlow, core*uOpacity*vGlow);
        }`,
    });
    const streams = new THREE.Points(sGeo, streamMat);
    blackHole.group.add(streams);

    // Ondas gravitacionais (visualização simbólica — anéis se expandindo)
    const GWAVE_RINGS = 6;
    const gravWaves   = [];
    for (let gw = 0; gw < GWAVE_RINGS; gw++) {
      const gwMat = new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending,
        uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. }, uPhase:{ value:gw/GWAVE_RINGS } },
        vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader:`
          uniform float uTime,uOpacity,uPhase;
          varying vec2 vUv;
          void main(){
            vec2 uv=vUv-.5;
            float r=length(uv)*2.;
            float phase=mod(uTime*.18+uPhase, 1.);
            float ring=exp(-pow((r-(.1+phase*.9))/.04,2.)*6.);
            float fade=1.-phase;
            vec3 col=mix(vec3(.8,.5,1.),vec3(.4,.7,1.),phase);
            gl_FragColor=vec4(col*ring*fade*uOpacity*.8, ring*fade*uOpacity*.55);
          }`,
      });
      const gw3d = new THREE.Mesh(new THREE.PlaneGeometry(DISK_OUT*2.4, DISK_OUT*2.4), gwMat);
      gw3d.rotation.x = -Math.PI*.5;
      blackHole.group.add(gw3d);
      gravWaves.push(gwMat);
    }

    return { mat, streamMat, gravWaves };
  }
  const tidalChaos = createTidalChaos();

  // ═══════════════════════════════════════════════════════════════
  // TÚNEL DE SINGULARIDADE
  // Estrutura tubular com geometria distorcida (não-Euclidiana visual)
  // ═══════════════════════════════════════════════════════════════
  function createTunnel() {
    const N   = 32000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N*3), col = new Float32Array(N*3), rnd = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const ang = Math.random()*Math.PI*2;
      const r   = 4 + Math.pow(Math.random(),.38)*260;
      pos[i*3]   = Math.cos(ang)*r;
      pos[i*3+1] = Math.sin(ang)*r;
      pos[i*3+2] = -Math.random()*7200;

      // paleta: azul, magenta, violeta, âmbar, ciano
      const paleta = [
        [0x1b,0x5c,0xff],[0x74,0xd2,0xff],
        [0xff,0x18,0x77],[0xff,0x8d,0xc9],
        [0x8a,0x38,0xff],[0xde,0x66,0xff],
        [0xff,0xd2,0x4b],[0xff,0x8d,0x28],
        [0x9b,0xf4,0xff],[0xfe,0xfe,0xfe],
      ][Math.floor(Math.random()*5)*2 + (Math.random()<.5?0:1)];

      col[i*3]  =paleta[0]/255; col[i*3+1]=paleta[1]/255; col[i*3+2]=paleta[2]/255;
      rnd[i]=Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("color",    new THREE.BufferAttribute(col,3));
    geo.setAttribute("aRnd",     new THREE.BufferAttribute(rnd,1));

    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms:{ uTime:{ value:0. }, uSpeed:{ value:0. }, uOpacity:{ value:0. }, uTwist:{ value:0. } },
      vertexShader:`
        attribute float aRnd;
        uniform float uSpeed,uTime,uTwist;
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vColor=color;
          vec3 p=position;
          p.z+=uSpeed*2.*aRnd;
          // rotação com torção (tunneling não-linear)
          float r=length(p.xy);
          float a=atan(p.y,p.x)+uTime*.14+uSpeed*.0009+uTwist*p.z*.00004;
          p.x=cos(a)*r; p.y=sin(a)*r;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          float stretch=1.+min(uSpeed,260.)*0.0026;
          gl_PointSize=(138./-mv.z)*stretch;
          vAlpha=smoothstep(140.,-140.,p.z);
        }`,
      fragmentShader:`
        uniform float uOpacity,uSpeed;
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vec2 c=gl_PointCoord-.5;
          float speed=clamp(uSpeed/230.,0.,1.);
          float sx=9.+speed*2.8;
          float sy=1.2+speed*2.5;
          float streak=exp(-abs(c.x)*sx)*exp(-abs(c.y)*sy);
          float alpha=streak*vAlpha*uOpacity;
          gl_FragColor=vec4(vColor*alpha*2.9, alpha);
        }`,
    });
    const points = new THREE.Points(geo, mat);
    points.visible = false;
    scene.add(points);
    return { points, geo, mat };
  }
  const tunnel = createTunnel();

  // ═══════════════════════════════════════════════════════════════
  // GALÁXIAS DE PASSAGEM — 6 morfologias distintas
  // ═══════════════════════════════════════════════════════════════
  function createPassingGalaxy(cfg) {
    const { x,y,z, radius=20, morph="grandDesign", tiltX=0, tiltY=0,
            clockwise=1, hero=false, roll=.14 } = cfg;
    const group = new THREE.Group();
    group.position.set(x,y,z);
    group.rotation.x = tiltX; group.rotation.y = tiltY;
    group.rotation.z = rnd(-0.09, 0.09);

    const SC = morph==="compactActive"?13000 : hero?20000 : 15000;
    const geo = new THREE.BufferGeometry();
    const pos=new Float32Array(SC*3), col=new Float32Array(SC*3), rnd2=new Float32Array(SC*2), sz=new Float32Array(SC);
    const warmA=new THREE.Color(0xff8f4c), warmB=new THREE.Color(0xffd59a);
    const coolA=new THREE.Color(0x85b7ff), coolB=new THREE.Color(0xeaf3ff);
    const gold =new THREE.Color(0xffe0a8);

    for (let i = 0; i < SC; i++) {
      const i3=i*3;
      let px=0,py=0,pz=0;
      const isC = Math.random() < (morph==="compactActive"?.26:morph==="barred"?.17:.12);

      if (isC) {
        const r=Math.pow(Math.random(),morph==="compactActive"?1.1:1.42)*radius*(morph==="compactActive"?.34:.19);
        const a=Math.random()*Math.PI*2;
        px=Math.cos(a)*r; py=(Math.random()-.5)*radius*.07; pz=Math.sin(a)*r;
      } else if (morph==="barred") {
        if (Math.random()<.22) {
          const t=(Math.random()-.5)*2.;
          px=t*radius*.78; py=(Math.random()-.5)*radius*.05; pz=(Math.random()-.5)*radius*.08;
        } else {
          const side=Math.random()<.5?-1:1;
          const r=radius*.22+Math.pow(Math.random(),1.32)*radius*.92;
          const theta=clockwise*(side*.74+side*Math.log(r+1.)*1.18+(Math.random()-.5)*.44);
          px=side*radius*.48+Math.cos(theta)*r*.74; py=(Math.random()-.5)*radius*.05; pz=Math.sin(theta)*r;
        }
      } else if (morph==="ringed") {
        if (Math.random()<.26) {
          const a=Math.random()*Math.PI*2;
          const rr=radius*.44+(Math.random()-.5)*radius*.09;
          px=Math.cos(a)*rr; py=(Math.random()-.5)*radius*.045; pz=Math.sin(a)*rr;
        } else {
          const side=Math.random()<.5?-1:1;
          const r=radius*.38+Math.pow(Math.random(),1.22)*radius*.88;
          const theta=clockwise*(side*.96+side*Math.log(r+1.)*1.1+(Math.random()-.5)*.4);
          px=Math.cos(theta)*r; py=(Math.random()-.5)*radius*.045; pz=Math.sin(theta)*r;
        }
      } else if (morph==="disturbed") {
        const dom=Math.random()<.7?1:-1;
        const r=radius*.18+Math.pow(Math.random(),1.16)*radius*1.05;
        const theta=clockwise*(dom*.84+Math.log(r+1.)*(dom>0?1.34:.94)+(Math.random()-.5)*.65);
        px=Math.cos(theta)*r+radius*.14; py=(Math.random()-.5)*radius*.058; pz=Math.sin(theta)*r*(dom>0?1.:.78);
      } else if (morph==="compactActive") {
        const r=radius*.08+Math.pow(Math.random(),2.1)*radius*.78;
        const theta=clockwise*(Math.log(r+1.)*1.82+(Math.random()-.5)*.36);
        px=Math.cos(theta)*r; py=(Math.random()-.5)*radius*.03; pz=Math.sin(theta)*r;
      } else { // grandDesign
        const side=Math.random()<.5?-1:1;
        const r=radius*.12+Math.pow(Math.random(),1.34)*radius;
        const theta=clockwise*(side*.95+side*Math.log(r+1.)*1.24+(Math.random()-.5)*.34);
        px=Math.cos(theta)*r; py=(Math.random()-.5)*radius*.05; pz=Math.sin(theta)*r;
      }

      pos[i3]=px; pos[i3+1]=py; pos[i3+2]=pz;
      const rN=Math.min(1.,Math.sqrt(px*px+pz*pz)/(radius*1.1));
      const c=new THREE.Color();
      if(rN<.14)       c.copy(gold).lerp(coolA,Math.random()*.2);
      else if(Math.random()<.22) c.copy(coolA).lerp(coolB,Math.random());
      else               c.copy(warmA).lerp(warmB,Math.random()*.48);
      col[i3]=c.r; col[i3+1]=c.g; col[i3+2]=c.b;
      rnd2[i*2]=Math.random(); rnd2[i*2+1]=Math.random();
      sz[i]=morph==="compactActive"?.95+Math.random()*1.1:hero?.82+Math.random()*.98:.68+Math.random()*.88;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("color",    new THREE.BufferAttribute(col,3));
    geo.setAttribute("aRnd",     new THREE.BufferAttribute(rnd2,2));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sz,1));

    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms:{ uTime:{ value:0. }, uOpacity:{ value:0. } },
      vertexShader:`
        attribute vec2 aRnd;
        attribute float aSize;
        uniform float uTime;
        varying vec3 vColor;
        void main(){
          vColor=color;
          float dist=length(position.xz);
          float av=.24/(dist*.072+1.);
          float ang=atan(position.z,position.x)+uTime*av*.68;
          vec3 p=vec3(cos(ang)*dist, position.y, sin(ang)*dist);
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=(33./-mv.z)*aSize*(.84+aRnd.x*.32);
        }`,
      fragmentShader:`
        uniform float uOpacity;
        varying vec3 vColor;
        void main(){
          vec2 uv=gl_PointCoord-.5;
          float d=dot(uv,uv)*4.;
          float core=exp(-d*9.8);
          float halo=exp(-d*2.8)*.18;
          float s=core+halo;
          gl_FragColor=vec4(vColor*s*uOpacity, s*.94*uOpacity);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    group.add(pts);

    const nucMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uOpacity:{ value:0. } },
      vertexShader:`varying vec3 vN; void main(){ vN=normalize(normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`uniform float uOpacity; varying vec3 vN; void main(){ float g=exp(-length(vN)*length(vN)*1.6); vec3 col=mix(vec3(1.,.95,.74),vec3(.58,.34,.14),length(vN)*.5); gl_FragColor=vec4(col*g*uOpacity*4.,g*uOpacity); }`,
    });
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(morph==="compactActive"?radius*.12:radius*.08,16,16), nucMat);
    group.add(nucleus);

    const cloudMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
      uniforms:{ uOpacity:{ value:0. }, uTime:{ value:0. } },
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uOpacity,uTime;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
        float fbm(vec2 p){ float f=0.,w=.5; for(int i=0;i<5;i++){ f+=w*noise(p); p*=2.; w*=.5; } return f; }
        void main(){
          vec2 uv=vUv-.5;
          float r=length(uv)*2.;
          float n=fbm(uv*5.2+uTime*.026);
          float mask=smoothstep(1.,.12,r)*n;
          float alpha=mask*.19*uOpacity;
          vec3 col=mix(vec3(.16,.44,1.),vec3(1.,.38,.58),vUv.y*.5+.5);
          gl_FragColor=vec4(col*alpha*2.2, alpha);
        }`,
    });
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(radius*2.5,radius*2.5), cloudMat);
    group.add(cloud);

    group.visible = false;
    group._z      = Math.abs(z);
    group._mats   = [mat, nucMat, cloudMat];
    group.userData = {
      hero, roll,
      focusX : clamp(x*.082, -7.5, 7.5),
      focusY : clamp(y*.052, -3.4, 3.4),
      driftX : x*.82,
      driftY : y*.85,
    };
    scene.add(group);
    return group;
  }

  const passingGalaxies = [
    createPassingGalaxy({ x:82,  y:24,   z:-580,  radius:28, morph:"grandDesign", tiltX:Math.PI*.13, tiltY:.36,  clockwise:1,  roll:.12 }),
    createPassingGalaxy({ x:-94, y:-30,  z:-1100, radius:25, morph:"barred",      tiltX:.74,         tiltY:-.92, clockwise:-1, roll:-.18 }),
    createPassingGalaxy({ x:16,  y:50,   z:-1640, radius:45, morph:"barred",      tiltX:Math.PI*.35, tiltY:.54,  clockwise:1,  hero:true, roll:.24 }),
    createPassingGalaxy({ x:-76, y:20,   z:-2240, radius:30, morph:"disturbed",   tiltX:Math.PI*.18, tiltY:1.12, clockwise:-1, roll:-.17 }),
    createPassingGalaxy({ x:96,  y:-18,  z:-2920, radius:32, morph:"ringed",      tiltX:Math.PI*.22, tiltY:.66,  clockwise:1,  roll:.15 }),
    createPassingGalaxy({ x:-36, y:-44,  z:-3500, radius:20, morph:"compactActive",tiltX:.98,        tiltY:-.30, clockwise:-1, roll:-.13 }),
  ];

  // ═══════════════════════════════════════════════════════════════
  // GALÁXIA DE RENASCIMENTO — Andrômeda/M31-inspired
  // Assimétrica, tidal warp, ring structure, dust lanes
  // ═══════════════════════════════════════════════════════════════
  function createRebirthGalaxy() {
    const group = new THREE.Group();
    group.visible = false;
    group.rotation.x = -.10;
    group.rotation.z = .05;
    scene.add(group);

    const MAX_R = 190;
    const SC    = 170000;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(SC*3), col = new Float32Array(SC*3);
    const rnd4  = new Float32Array(SC*4), sz  = new Float32Array(SC);

    for (let i = 0; i < SC; i++) {
      const i3=i*3, i4=i*4;
      let x=0,y=0,z=0;
      const pick=Math.random();

      if (pick<.17) { // núcleo
        const r=Math.pow(Math.random(),1.32)*24.;
        const a=Math.random()*Math.PI*2;
        x=Math.cos(a)*r; z=Math.sin(a)*r;
        y=(Math.random()-.5)*11.*Math.exp(-r/20.);
      } else if (pick<.30) { // barra
        const t=(Math.random()-.5)*2.;
        x=t*44.; z=(Math.random()-.5)*7.; y=(Math.random()-.5)*4.*(1.-Math.abs(t)*.5);
      } else if (pick<.50) { // ring
        const a=Math.random()*Math.PI*2;
        const rr=76+(Math.random()-.5)*12.;
        x=Math.cos(a)*rr+9.; z=Math.sin(a)*rr*.84-3.;
        y=(Math.random()-.5)*3.2*Math.exp(-rr/82.)+Math.sin(a*2.)*1.3;
      } else { // braços assimétricos + warp
        const arm=Math.random()<.62?1:-1;
        const r=18+Math.pow(Math.random(),1.20)*MAX_R;
        const theta=arm*.92+Math.log(r+1.)*(arm>0?1.20:.96)+(Math.random()-.5)*.48;
        x=Math.cos(theta)*r+(arm>0?9.:-4.);
        z=Math.sin(theta)*r*(arm>0?.94:.76);
        const outer=clamp(r/MAX_R,0,1);
        y=(Math.random()-.5)*(3.-outer*1.3)+Math.sin(theta*1.65)*outer*8.*.28;
      }

      pos[i3]=x; pos[i3+1]=y; pos[i3+2]=z;
      const rN=clamp(Math.sqrt(x*x+z*z)/MAX_R,0,1);
      const spec=pickSpectral();
      const c=spec.color.clone();
      if (rN<.12) c.lerp(new THREE.Color(0xffd090),.58);
      else if (rN>.34&&rN<.50) c.lerp(new THREE.Color(0xffbc88),.16);
      col[i3]=c.r; col[i3+1]=c.g; col[i3+2]=c.b;
      sz[i]=spec.size*(.70+Math.random()*.72);
      rnd4[i4]=Math.random(); rnd4[i4+1]=Math.random(); rnd4[i4+2]=Math.random(); rnd4[i4+3]=rN;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("color",    new THREE.BufferAttribute(col,3));
    geo.setAttribute("aRnd4",    new THREE.BufferAttribute(rnd4,4));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sz,1));

    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms:{
        uTime:{ value:0. }, uGrow:{ value:0. }, uOpen:{ value:0. },
        uPulse:{ value:0. }, uOpacity:{ value:1. }, uBallet:{ value:0. },
      },
      vertexShader:`
        uniform float uTime,uGrow,uOpen,uPulse,uBallet;
        attribute vec4 aRnd4;
        attribute float aSize;
        varying vec3 vColor;
        varying float vBlink;
        void main(){
          vec3 p=position;
          float r=length(p.xz);
          float a=atan(p.z,p.x);
          float g=smoothstep(0.,1.,uGrow);
          float open=smoothstep(0.,1.,uOpen);
          float ballet=smoothstep(0.,1.,uBallet);
          // espiral de nascimento: se desenrola
          float coil=(1.-open)*(.88+r*.026*(.88+aRnd4.x*.48));
          float sweep=sin(uTime*.88+aRnd4.y*6.283+aRnd4.w*4.2)*.065*ballet;
          a+=coil+sweep;
          p.x=cos(a)*r*g;
          p.z=sin(a)*r*g;
          p.y=mix(0.,p.y,open);
          p.y+=sin(uTime*1.28+aRnd4.z*18.+r*.026)*.18*ballet;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          float blink=.88+.12*sin(uTime*(4.2+aRnd4.x*6.4)+aRnd4.y*32.);
          float climax=mix(1.,1.62+aRnd4.z*.98,uPulse);
          gl_PointSize=(36./-mv.z)*aSize*blink*climax;
          vColor=color;
          vBlink=blink*climax;
        }`,
      fragmentShader:`
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vBlink;
        void main(){
          vec2 uv=gl_PointCoord-.5;
          float d=dot(uv,uv)*4.;
          float core=exp(-d*11.2);
          float halo=exp(-d*3.2)*.19;
          float s=core+halo;
          gl_FragColor=vec4(vColor*s*uOpacity*vBlink, s*.95*uOpacity);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    group.add(pts);

    const bulgeMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. } },
      vertexShader:`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec3 vP;
        void main(){
          float r=length(vP)/14.;
          float glow=exp(-r*r*2.42);
          float pulse=.90+.10*sin(uTime*.66);
          vec3 col=mix(vec3(1.,.80,.38),vec3(.54,.20,.08),pow(r,.60));
          gl_FragColor=vec4(col*glow*pulse*uOpacity, glow*.68*uOpacity);
        }`,
    });
    const bulge = new THREE.Mesh(new THREE.SphereGeometry(14,56,56), bulgeMat);
    bulge.scale.set(1.,.76,1.);
    group.add(bulge);

    // Onda de choque de nascimento (shockwave)
    const shockMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0 }, uScale:{ value:.28 } },
      vertexShader:`uniform float uScale; varying vec2 vUv; void main(){ vUv=uv; vec3 p=position*uScale; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
      fragmentShader:`
        uniform float uOpacity;
        varying vec2 vUv;
        void main(){
          vec2 uv=vUv-.5;
          float r=length(uv)*2.;
          float ring=exp(-pow((r-.74)/.092,2.)*4.8);
          vec3 col=mix(vec3(1.,.88,.62),vec3(.58,.80,1.),vUv.y);
          gl_FragColor=vec4(col*ring*uOpacity*2., ring*uOpacity);
        }`,
    });
    const shockwave = new THREE.Mesh(new THREE.PlaneGeometry(300,300), shockMat);
    group.add(shockwave);

    // Nebulosidade quântica de nascimento
    const quantumMat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending,
      uniforms:{ uTime:{ value:0 }, uOpacity:{ value:0. } },
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`
        uniform float uTime,uOpacity;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
        float fbm(vec2 p){ float f=0.,w=.5; for(int i=0;i<6;i++){ f+=w*noise(p); p*=2.1; w*=.5; } return f; }
        void main(){
          vec2 uv=vUv-.5;
          float r=length(uv)*2.;
          float a=atan(uv.y,uv.x);
          // vórtice quântico
          vec2 polar=vec2(a*.5+uTime*.06, r*2.+uTime*.04);
          float n=fbm(polar*2.8);
          float mask=smoothstep(1.,.06,r)*(1.-r*.7)*n;
          vec3 col=mix(vec3(.28,.16,.52),vec3(.58,.82,1.),vUv.y+n*.5);
          col=mix(col,vec3(1.,.72,.38),n*.4);
          gl_FragColor=vec4(col*mask*.38*uOpacity, mask*.32*uOpacity);
        }`,
    });
    const quantum = new THREE.Mesh(new THREE.PlaneGeometry(380,380), quantumMat);
    group.add(quantum);

    return { group, mat, bulgeMat, shockMat, quantumMat };
  }
  const rebirthGalaxy = createRebirthGalaxy();

  // ═══════════════════════════════════════════════════════════════
  // SHAKE — multi-frequência (simula câmera IMAX hand-held)
  // ═══════════════════════════════════════════════════════════════
  function smoothShake(t, level) {
    const sq = level * level;
    return {
      x: (Math.sin(t*52.1)*.54+Math.sin(t*21.3)*.30+Math.sin(t*79.7)*.16) * sq * 6.2,
      y: (Math.cos(t*36.8)*.54+Math.cos(t*18.9)*.30+Math.cos(t*57.4)*.16) * sq * 6.2,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // LOOP DE RENDERIZAÇÃO
  // ═══════════════════════════════════════════════════════════════
  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    background.mat.uniforms.uTime.value = t;
    warpPass.uniforms.uTime.value        = t;
    tunnel.mat.uniforms.uTime.value      = t;

    if (state.hostAlive) {
      hostGalaxy.starMat.uniforms.uTime.value  = t;
      hostGalaxy.dustMat.uniforms.uTime.value  = t;
      hostGalaxy.bulgeMat.uniforms.uTime.value = t;
      hostGalaxy.nebulaMats.forEach(m => { if(m.uniforms.uTime) m.uniforms.uTime.value=t; });
    }

    if (state.bhAlive) {
      blackHole.photonMat.uniforms.uTime.value  = t;
      blackHole.haloMat.uniforms.uTime.value    = t;
      blackHole.coronaMat.uniforms.uTime.value  = t;
      blackHole.diskMat.uniforms.uTime.value    = t;
      blackHole.iscoMat.uniforms.uTime.value    = t;
      blackHole.hotspotMat.uniforms.uTime.value = t;
      blackHole.jetA.mat.uniforms.uTime.value   = t;
      blackHole.jetB.mat.uniforms.uTime.value   = t;
      tidalChaos.mat.uniforms.uTime.value       = t;
      tidalChaos.streamMat.uniforms.uTime.value = t;
      tidalChaos.gravWaves.forEach(m => { m.uniforms.uTime.value=t; });
      blackHole.group.rotation.y = t * .009;
      blackHole.group.rotation.z = Math.sin(t*.20)*.026+Math.sin(t*.075)*.009;

      // Anamorphic flare pulsando com o hotspot
      const flareAmp = blackHole.hotspotMat.uniforms.uOpacity.value;
      bhProjected.set(0,0,0).project(camera);
      anamorphicPass.uniforms.uCenter.value.set((bhProjected.x+1)*.5, (bhProjected.y+1)*.5);
      anamorphicPass.uniforms.uStrength.value = flareAmp * (.22+Math.sin(t*2.8+1.)*.08);
    }

    rebirthGalaxy.mat.uniforms.uTime.value    = t;
    rebirthGalaxy.bulgeMat.uniforms.uTime.value  = t;
    rebirthGalaxy.shockMat.uniforms.uTime.value   = t;
    rebirthGalaxy.quantumMat.uniforms.uTime.value = t;

    passingGalaxies.forEach(g => {
      if (!g.visible) return;
      g._mats.forEach(m => { if(m.uniforms.uTime) m.uniforms.uTime.value=t; });
    });

    // Tunnel position update
    if (state.tunneling) {
      const arr = tunnel.geo.attributes.position.array;
      const sp  = tunnel.mat.uniforms.uSpeed.value;
      for (let i = 2; i < arr.length; i+=3) {
        arr[i] += sp;
        if (arr[i] > camera.position.z+420) arr[i] = camera.position.z-7200;
      }
      tunnel.geo.attributes.position.needsUpdate = true;
    }

    // Câmera: shake + breath
    if (state.started && state.trauma > .008) {
      const sh = smoothShake(t, state.trauma);
      camera.position.x += sh.x;
      camera.position.y += sh.y;
    }
    if (state.breathAmp > .001) {
      camera.position.y += Math.sin(t*.62)*.22*state.breathAmp;
      camera.position.x += Math.cos(t*.38)*.12*state.breathAmp;
    }

    // Lens pass: gravitational lensing dinâmico
    if (state.bhAlive) {
      bhProjected.set(0,0,0).project(camera);
      lensPass.uniforms.uBHCenter.value.set((bhProjected.x+1)*.5, (bhProjected.y+1)*.5);
      warpPass.uniforms.uCenter.value.set((bhProjected.x+1)*.5, (bhProjected.y+1)*.5);
      const dist   = camera.position.distanceTo(origin);
      const halfFov= camera.fov*Math.PI/360.;
      const ehNDC  = EH_R/(dist*Math.tan(halfFov));
      lensPass.uniforms.uEHRadius.value  = ehNDC*.52;
      lensPass.uniforms.uAspect.value    = view.w/view.h;
      // ring boost próximo ao horizonte
      lensPass.uniforms.uRingBoost.value = clamp(1.-dist/40.,0.,1.);
    }

    vignettePass.uniforms.uAspect.value = view.w/view.h;
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();
    composer.render();
    requestAnimationFrame(animate);
  }
  animate();

  // ═══════════════════════════════════════════════════════════════
  // COREOGRAFIA DAS GALÁXIAS DE PASSAGEM
  // ═══════════════════════════════════════════════════════════════
  function schedulePassingGalaxies(tl, startTime, travelDuration, zStart, zEnd) {
    const totalDist = Math.abs(zEnd - zStart);
    passingGalaxies.forEach(g => {
      const ratio = g._z / totalDist;
      const ta    = startTime + ratio * travelDuration;
      const hero  = !!g.userData.hero;

      const inDur   = hero?.78:.48;
      const outDur  = hero?1.08:.82;
      const driftDur= hero?2.0:1.22;
      const linger  = hero?.62:.30;

      tl.add(() => { g.visible=true; }, ta-.85);

      // Drift paraláctico
      tl.to(g.position, { x:g.userData.driftX, y:g.userData.driftY, duration:driftDur, ease:"sine.inOut" }, ta-.56);
      tl.to(g.rotation, { z:g.rotation.z+g.userData.roll, duration:driftDur, ease:"sine.inOut" }, ta-.50);

      // Rack focus: câmera vira para a galáxia brevemente
      tl.to(lookTarget, { x:g.userData.focusX, y:g.userData.focusY, duration:hero?.26:.18, ease:"power2.out" }, ta-.06);
      tl.to(lookTarget, { x:0, y:0, duration:hero?.58:.36, ease:"power2.inOut" }, ta+linger);

      // Opacidade
      g._mats.forEach((m,idx) => {
        const peak = idx===2?(hero?.78:.60):idx===1?(hero?.94:.76):(hero?1.:.86);
        tl.to(m.uniforms.uOpacity,  { value:peak,  duration:inDur,  ease:"power2.out" }, ta-.36);
        tl.to(m.uniforms.uOpacity,  { value:0.,    duration:outDur, ease:"power2.in"  }, ta+linger);
      });

      if (hero) {
        tl.to(bloomPass,                    { strength:1.92, radius:1.02, duration:.24, ease:"power2.out"  }, ta-.08);
        tl.to(bloomPass,                    { strength:1.06, radius:.76,  duration:.52, ease:"power2.inOut"}, ta+.20);
        tl.to(chromaticPass.uniforms.uStrength, { value:.32, duration:.20, ease:"power2.out"  }, ta-.02);
        tl.to(chromaticPass.uniforms.uStrength, { value:.0,  duration:.36, ease:"power2.inOut"}, ta+.20);
      } else {
        tl.to(bloomPass, { strength:1.26, duration:.18, ease:"power2.out"   }, ta-.03);
        tl.to(bloomPass, { strength:1.0,  duration:.30, ease:"power2.inOut" }, ta+.18);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // TIMELINE PRINCIPAL — DIRETOR DE FOTOGRAFIA
  // ═══════════════════════════════════════════════════════════════
  function startIntro() {
    if (state.started) return;
    state.started = true;
    document.body.classList.add("diving-active");
    startSoundtrack();

    const roughEase = roughEaseConfig();

    const tl = gsap.timeline({ defaults:{ ease:"power3.inOut" } });

    // ─────────────────────────────────────────────────────────────
    // UI OUT — dissolve com blur, estilo cinema
    // ─────────────────────────────────────────────────────────────
    tl.to(uiLayer||{}, { opacity:0, duration:.55, ease:"power2.out",
      onComplete:()=>{ if(uiLayer){ uiLayer.style.display="none"; uiLayer.style.pointerEvents="none"; } }
    }, 0);
    tl.to([btnDespertar,subtitleText,titleText].filter(Boolean), {
      opacity:0, scale:1.06, filter:"blur(12px)", stagger:.065, duration:1.0, ease:"power2.in"
    }, 0);
    tl.to(introBlock||{}, { opacity:0, duration:.40 }, 0);

    // Letterbox: entra suavemente — 2.35:1 (widescreen anamórfico)
    tl.to(letterbox.top,    { height:`${LB_H}px`, duration:1.8, ease:"power4.inOut" }, .06);
    tl.to(letterbox.bottom, { height:`${LB_H}px`, duration:1.8, ease:"power4.inOut" }, .06);

    // ─────────────────────────────────────────────────────────────
    // ATO 0 — PLANO ABERTO CONTEMPLATIVO (0–2s)
    // Câmera teleobjetiva compressa, galáxia em equilíbrio.
    // Breathing handheld suave.
    // ─────────────────────────────────────────────────────────────
    tl.to(state, { breathAmp:.65, duration:1.8, ease:"sine.inOut" }, .6);

    // ─────────────────────────────────────────────────────────────
    // ATO 1 — ARCO ORBITAL CONTEMPLATIVO (2–4.5s)
    // Câmera orbita lentamente ao redor da galáxia (plano orbital inclinado)
    // Regra dos terços: BH não está centralizado — está no terço esquerdo
    // ─────────────────────────────────────────────────────────────
    tl.to(camera.position, {
      x: 148, y:18, z:285,
      duration: 2.5, ease:"sine.inOut",
    }, BEAT.ARC_START);
    tl.to(lookTarget, { x:-8, y:2, z:0, duration:2.5, ease:"sine.inOut" }, BEAT.ARC_START);
    tl.to(camera, { fov:36, duration:2.5, ease:"sine.inOut", onUpdate:()=>camera.updateProjectionMatrix() }, BEAT.ARC_START);

    // Durante o arco: retorna ao centro
    tl.to(lookTarget, { x:0, y:0, z:0, duration:1.8, ease:"power2.inOut" }, BEAT.ARC_START+1.5);

    // ─────────────────────────────────────────────────────────────
    // ATO 2 — MERGULHO (4.5–8.5s)
    // Aceleração exponencial em direção ao núcleo.
    // FOV cresce (dolly-zoom reverso). Stars streaking.
    // ─────────────────────────────────────────────────────────────
    tl.to(state, { breathAmp:.22, duration:1.5 }, BEAT.DIVE_START);

    tl.to(hostGalaxy.starMat.uniforms.uDive, { value:1., duration:4.0, ease:"power2.inOut" }, BEAT.DIVE_START);
    tl.to(hostGalaxy.starMat.uniforms.uSpeed, { value:268., duration:4.0, ease:"expo.in" }, BEAT.DIVE_START);

    // Trajetória do mergulho — curva suave, não linear
    tl.to(camera.position, { x:22, y:5, z:48, duration:4.0, ease:"expo.in" }, BEAT.DIVE_START);
    tl.to(camera, { fov:96, duration:4.0, ease:"expo.in", onUpdate:()=>camera.updateProjectionMatrix() }, BEAT.DIVE_START);

    // Warp radial cresce com velocidade
    tl.to(warpPass.uniforms.uAmount, { value:1.18, duration:3.2, ease:"power2.inOut" }, BEAT.DIVE_START+.8);
    tl.to(bloomPass, { strength:1.18, duration:3.0 }, BEAT.DIVE_START+1.0);
    tl.to(chromaticPass.uniforms.uStrength, { value:.12, duration:2.5 }, BEAT.DIVE_START+1.5);

    // ─────────────────────────────────────────────────────────────
    // ATO 3 — REVELAÇÃO DO BURACO NEGRO (8.5–10.5s)
    // Câmera trava. BH emerge da névoa estelar.
    // Pausa dramática — "a nave para".
    // Lensing se ativa. Anamorphic flare aparece.
    // ─────────────────────────────────────────────────────────────
    // Freia bruscamente (desaceleração dramática)
    tl.to(hostGalaxy.starMat.uniforms.uSpeed, { value:18., duration:.68, ease:"power3.out" }, BEAT.BH_REVEAL);
    tl.to(camera.position, { x:5.5, y:1.6, z:22., duration:.68, ease:"power3.out" }, BEAT.BH_REVEAL);
    tl.to(camera, { fov:52, duration:.68, ease:"power3.out", onUpdate:()=>camera.updateProjectionMatrix() }, BEAT.BH_REVEAL);
    tl.to(warpPass.uniforms.uAmount, { value:.18, duration:.68 }, BEAT.BH_REVEAL);
    tl.to(state, { breathAmp:.0, duration:.5 }, BEAT.BH_REVEAL);

    // BH emerge: photon ring, halo, corona, jets, hotspot
    tl.to(blackHole.photonMat.uniforms.uOpacity,  { value:1.,   duration:.72 }, BEAT.BH_REVEAL+.05);
    tl.to(blackHole.haloMat.uniforms.uOpacity,    { value:1.,   duration:.72 }, BEAT.BH_REVEAL+.05);
    tl.to(blackHole.coronaMat.uniforms.uOpacity,  { value:.86,  duration:.72 }, BEAT.BH_REVEAL+.10);
    tl.to(blackHole.iscoMat.uniforms.uOpacity,    { value:.92,  duration:.68 }, BEAT.BH_REVEAL+.12);
    tl.to(blackHole.jetA.mat.uniforms.uOpacity,   { value:.46,  duration:.68 }, BEAT.BH_REVEAL+.15);
    tl.to(blackHole.jetB.mat.uniforms.uOpacity,   { value:.46,  duration:.68 }, BEAT.BH_REVEAL+.15);

    // Lensing ativa — gravitational lensing aparece
    tl.to(lensPass.uniforms.uActive,   { value:1.,     duration:.72 }, BEAT.BH_REVEAL+.04);
    tl.to(lensPass.uniforms.uStrength, { value:.0172,  duration:.72 }, BEAT.BH_REVEAL+.04);

    // Hotspot aparece com delay (observado na natureza com delay)
    tl.to(blackHole.hotspotMat.uniforms.uOpacity, { value:.84, duration:.52, ease:"power2.out" }, BEAT.BH_REVEAL+.5);

    // Linhas de campo magnético aparecem suavemente
    blackHole.magMats.forEach((m,i) => {
      tl.to(m, { opacity:.28+Math.random()*.18, duration:.8, ease:"sine.inOut" }, BEAT.BH_REVEAL+.4+i*.06);
    });

    // Bloom sobe levemente — "halo cinematográfico" da reveal
    tl.to(bloomPass, { strength:.96, radius:.78, duration:.52, ease:"power2.out" }, BEAT.BH_REVEAL);

    // ─────────────────────────────────────────────────────────────
    // ATO 4 — CAOS GRAVITACIONAL / PERTURBAÇÃO MAREAL (10.5–14s)
    // Câmera chacoalha — "the ship breaks apart"
    // Plasma espiral, ondas gravitacionais, disco se intensifica
    // ─────────────────────────────────────────────────────────────
    // Pancada inicial — trauma máximo
    tl.to(state, { trauma:1.28, duration:.22, ease:"power4.in" }, BEAT.CHAOS_START);

    // Plasma e streams aparecem
    tl.to(tidalChaos.mat.uniforms.uOpacity,      { value:1.,  duration:.20 }, BEAT.CHAOS_START);
    tl.to(tidalChaos.mat.uniforms.uChaos,        { value:1.,  duration:.88, ease:"power3.in" }, BEAT.CHAOS_START);
    tl.to(tidalChaos.streamMat.uniforms.uOpacity,{ value:1.,  duration:.20 }, BEAT.CHAOS_START+.05);
    tl.to(tidalChaos.streamMat.uniforms.uChaos,  { value:1.,  duration:.85, ease:"power3.in" }, BEAT.CHAOS_START+.05);

    // Ondas gravitacionais pulsam
    tidalChaos.gravWaves.forEach((m,i) => {
      tl.to(m.uniforms.uOpacity, { value:.52, duration:.36, ease:"power2.out" }, BEAT.CHAOS_START+i*.08);
    });

    // Estrelas sendo sugadas
    tl.to(hostGalaxy.starMat.uniforms.uSuck, { value:.52, duration:.82, ease:"power3.in" }, BEAT.CHAOS_START+.12);

    // Post-FX explode
    tl.to(lensPass.uniforms.uStrength,         { value:.042, duration:.72 }, BEAT.CHAOS_START+.15);
    tl.to(warpPass.uniforms.uAmount,           { value:2.04, duration:.72 }, BEAT.CHAOS_START+.15);
    tl.to(chromaticPass.uniforms.uStrength,    { value:.34,  duration:.64 }, BEAT.CHAOS_START+.18);
    tl.to(bloomPass, { strength:1.48, radius:.88, duration:.55 }, BEAT.CHAOS_START+.12);

    // Jerk da câmera — pancadas simétricas (trauma)
    tl.to(camera.position, { x:8.8,  duration:.13, ease:roughEase }, BEAT.CHAOS_START+.12);
    tl.to(camera.position, { x:-10.2,duration:.15, ease:roughEase }, BEAT.CHAOS_START+.28);
    tl.to(camera.position, { x:5.4,  duration:.12, ease:roughEase }, BEAT.CHAOS_START+.46);
    tl.to(camera.position, { y:3.8,  duration:.14, ease:roughEase }, BEAT.CHAOS_START+.62);
    tl.to(camera.position, { y:-4.2, duration:.12, ease:roughEase }, BEAT.CHAOS_START+.78);
    tl.to(camera.position, { x:0., y:0., duration:.16, ease:"power4.out" }, BEAT.CHAOS_START+.96);
    tl.to(lookTarget,      { x:0., y:0., z:0., duration:.16, ease:"power4.out" }, BEAT.CHAOS_START+.96);

    // Trauma decai gradualmente
    tl.to(state, { trauma:.62, duration:1.6 }, BEAT.CHAOS_START+.3);
    tl.to(state, { trauma:.28, duration:1.8 }, BEAT.CHAOS_START+1.8);

    // Dutch angle sutil — tensão visual
    tl.to(camera.rotation, { z:.04, duration:1.2, ease:"sine.inOut" }, BEAT.CHAOS_START+.5);

    // ─────────────────────────────────────────────────────────────
    // ATO 5 — SINGULARIDADE / TRAVESSIA (14s)
    // A singularidade engole tudo. Fade brusco → tunnel.
    // FOV 142°. Câmera vai a 0,0,-2.5 — dentro do horizonte.
    // ─────────────────────────────────────────────────────────────
    const T = BEAT.TRAVEL_START;

    // Colapso final
    tl.to(hostGalaxy.starMat.uniforms.uSuck, { value:1.,  duration:.32, ease:"power4.in" }, T-.30);
    tl.to(warpPass.uniforms.uAmount,         { value:6.2, duration:.34, ease:"power4.in" }, T-.30);
    tl.to(lensPass.uniforms.uStrength,       { value:.082,duration:.34, ease:"power4.in" }, T-.30);
    tl.to(chromaticPass.uniforms.uStrength,  { value:1.1, duration:.26, ease:"power3.in" }, T-.24);
    tl.to(camera.rotation, { z:0., duration:.25, ease:"power4.out" }, T-.28);

    // Câmera dispara para dentro do horizonte
    tl.to(camera.position, { x:0, y:0, z:-2.5, duration:.34, ease:"power4.in" }, T-.30);
    tl.to(camera, { fov:148, duration:.34, ease:"power4.in", onUpdate:()=>camera.updateProjectionMatrix() }, T-.30);
    tl.to(state, { trauma:.88, duration:.34 }, T-.30);

    // Flash de Hawking — branco quente
    tl.to(overlays.hawking, { opacity:.88, duration:.05, ease:"none" }, T-.04);
    tl.to(overlays.hawking, { opacity:0.,  duration:.12, ease:"none" }, T+.01);

    // Transição para o túnel
    tl.add(() => {
      blackHole.group.visible  = false;
      hostGalaxy.group.visible = false;
      tunnel.points.visible    = true;
      state.tunneling          = true;
      camera.rotation.z        = 0.;
      camera.position.set(0, 0, -90);
      lookTarget.set(0, 0, -1550);
      camera.fov = 112;
      camera.updateProjectionMatrix();
      passingGalaxies.forEach(g => { g.visible=false; g._mats.forEach(m=>(m.uniforms.uOpacity.value=0.)); });
    }, T);

    tl.to(tunnel.mat.uniforms.uOpacity, { value:1., duration:.20 }, T);
    tl.to(tunnel.mat.uniforms.uSpeed,   { value:265., duration:.20 }, T);
    tl.to(tunnel.mat.uniforms.uTwist,   { value:1., duration:3.8 }, T+.1);
    tl.to(camera.position, { z:-3600, duration:3.80, ease:"none" }, T);
    tl.to(state, { trauma:.36, duration:3.80 }, T);
    tl.to(bloomPass, { strength:1.22, duration:1.0 }, T+.22);

    schedulePassingGalaxies(tl, T, 3.80, -90, -3600);

    // ─────────────────────────────────────────────────────────────
    // ATO 6 — SILÊNCIO / BLACKOUT (22.5s)
    // Bloom explode → flash branco → negro absoluto.
    // ─────────────────────────────────────────────────────────────
    const S = BEAT.SILENCE_START;
    tl.to(bloomPass, { strength:7.5, radius:1.88, duration:.38, ease:"power3.in" }, S-.36);
    tl.to(chromaticPass.uniforms.uStrength, { value:1.65, duration:.26 }, S-.26);

    // Flash de Hawking radiation
    tl.to(overlays.flash,   { opacity:1., duration:.05, ease:"none" }, S-.09);
    tl.to(overlays.flash,   { opacity:0., duration:.08, ease:"none" }, S-.03);
    tl.to(overlays.hawking, { opacity:.55,duration:.06, ease:"none" }, S-.06);
    tl.to(overlays.hawking, { opacity:0., duration:.10, ease:"none" }, S+.01);
    tl.to(overlays.fade,    { opacity:1., duration:.20, ease:"power2.out" }, S-.05);

    tl.add(() => {
      state.tunneling = false;
      state.finale    = true;
      tunnel.points.visible = false;
      passingGalaxies.forEach(g => (g.visible=false));
      if (state.hostAlive) { disposeNode(hostGalaxy.group); state.hostAlive=false; }
      if (state.bhAlive)   { disposeNode(blackHole.group);  state.bhAlive=false; }

      rebirthGalaxy.group.visible = true;
      camera.position.set(0, 2, 32);
      camera.rotation.z = 0.;
      lookTarget.set(0, 0, 0);
      camera.fov = 40;
      camera.updateProjectionMatrix();

      bloomPass.strength = 2.32;
      bloomPass.radius   = 0.96;
      chromaticPass.uniforms.uStrength.value = 0.;
      warpPass.uniforms.uAmount.value        = 0.;
      lensPass.uniforms.uActive.value        = 0.;
      lensPass.uniforms.uStrength.value      = 0.;
      anamorphicPass.uniforms.uStrength.value= 0.;
      state.trauma = 0.;
    }, S);

    tl.to({}, { duration:2.2 }, S); // pausa de silêncio

    // ─────────────────────────────────────────────────────────────
    // ATO 7 — RENASCIMENTO (25.5s)
    // Andrômeda emerge da névoa quântica.
    // Shockwave de nascimento. Câmera recua lentamente.
    // Nebulosa quântica dissolve enquanto a galáxia se forma.
    // ─────────────────────────────────────────────────────────────
    const R = BEAT.REBIRTH_START;

    // Fade out do negro
    tl.to(overlays.fade, { opacity:0., duration:.92, ease:"power2.out" }, R);

    // Névoa quântica aparece primeiro
    tl.to(rebirthGalaxy.quantumMat.uniforms.uOpacity, { value:1., duration:.85, ease:"power2.out" }, R+.05);

    // Shockwave de nascimento — anel de energia
    tl.to(rebirthGalaxy.shockMat.uniforms.uOpacity, { value:.98, duration:.52, ease:"power2.out" }, R+.18);
    tl.to(rebirthGalaxy.shockMat.uniforms.uScale,   { value:1.12,duration:2.0, ease:"expo.out"   }, R+.18);
    tl.to(rebirthGalaxy.shockMat.uniforms.uOpacity, { value:0.,  duration:1.6, ease:"power2.in"  }, R+.72);

    // Galáxia se desenrola (grow: contrai→expande; open: plana→3D)
    tl.to(rebirthGalaxy.mat.uniforms.uGrow,   { value:1., duration:11.0, ease:"power2.out" }, R+.10);
    tl.to(rebirthGalaxy.mat.uniforms.uOpen,   { value:1., duration:13.2, ease:"expo.out"   }, R+.14);
    tl.to(rebirthGalaxy.mat.uniforms.uPulse,  { value:1., duration: 9.4, ease:"sine.inOut" }, R+.72);
    tl.to(rebirthGalaxy.mat.uniforms.uBallet, { value:1., duration:12.8, ease:"sine.inOut" }, R+.64);

    // Bojo acende
    tl.to(rebirthGalaxy.bulgeMat.uniforms.uOpacity, { value:.96, duration:1.52, ease:"power2.out" }, R+.18);

    // Névoa quântica dissolve enquanto galáxia se forma
    tl.to(rebirthGalaxy.quantumMat.uniforms.uOpacity, { value:0., duration:4.5, ease:"power2.in" }, R+3.5);

    // Câmera recua lentamente — revelar a galáxia completa
    // Arco suave: ascendente e recuando
    tl.to(camera.position, { x:0, y:18, z:295, duration:14.0, ease:"power2.out" }, R+.22);
    tl.to(lookTarget,      { x:0, y:0,  z:0,   duration:14.0, ease:"power2.out" }, R+.22);

    // Rotação sutil da galáxia — como M31 vista da Terra
    tl.to(rebirthGalaxy.group.rotation, { x:-.42, z:.018, duration:11.5, ease:"sine.inOut" }, R+.60);

    // Bloom decai: saúde normalizada
    tl.to(bloomPass, { strength:1.42, radius:.96, duration:9.5 }, R+.35);

    // Letterbox sai — passamos ao plano livre
    tl.to(letterbox.top,    { height:"0px", duration:4.4, ease:"expo.out" }, R+8.0);
    tl.to(letterbox.bottom, { height:"0px", duration:4.4, ease:"expo.out" }, R+8.0);

    // ─────────────────────────────────────────────────────────────
    // ATO 8 — PULLBACK CONTEMPLATIVO FINAL (36s)
    // Câmera orbita e recua. Galáxia no terço inferior da tela.
    // Breathing handheld suave retorna.
    // ─────────────────────────────────────────────────────────────
    tl.to(state, { breathAmp:.48, duration:3.5, ease:"sine.inOut" }, BEAT.FINAL_PULL);

    // Arco lateral + recuo
    tl.to(camera.position, { x:-28, y:10, z:345, duration:5.0, ease:"sine.inOut" }, BEAT.FINAL_PULL);
    tl.to(lookTarget,      { x:4,   y:-2, z:0,   duration:5.0, ease:"sine.inOut" }, BEAT.FINAL_PULL);

    // Fade final
    tl.to(overlays.fade, {
      opacity:1.,
      duration:4.2,
      ease:"power2.inOut",
      onComplete:() => { window.location.href = "login.php"; },
    }, BEAT.END - 4.2);
  }

  btnDespertar.addEventListener("click", e => { e.preventDefault(); startIntro(); });

  // ═══════════════════════════════════════════════════════════════
  // RESIZE
  // ═══════════════════════════════════════════════════════════════
  window.addEventListener("resize", () => {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    camera.aspect = view.w / view.h;
    camera.updateProjectionMatrix();
    renderer.setSize(view.w, view.h);
    composer.setSize(view.w, view.h);
    lensPass.uniforms.uAspect.value     = view.w / view.h;
    vignettePass.uniforms.uAspect.value = view.w / view.h;
    grain.resize();
  });
});