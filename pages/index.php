<?php
// session_start();
// include ("../config/conexao.php");
// include ("../config/crud.php");
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda | Edição Definitiva</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">

    <style>
        :root {
            --magenta-lux: #A61C5C;
            --white-starlight: #ffffff;
            --dark-void: #000000;
        }

        *, *::before, *::after { box-sizing: border-box; }

        body, html {
            margin: 0; padding: 0;
            width: 100%; height: 100%;
            overflow: hidden;
            background-color: var(--dark-void);
            font-family: 'Montserrat', sans-serif;
            color: var(--white-starlight);
        }

        #webgl-container {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%; z-index: 1;
        }

        /* ── Grain cinematográfico ── */
        #grain-canvas {
            position: fixed; inset: 0;
            width: 100%; height: 100%;
            z-index: 6;
            pointer-events: none;
            opacity: 0.04;
            image-rendering: pixelated;
            mix-blend-mode: screen;
        }

        /* ── Letterbox cinemático ── */
        .letterbox {
            position: fixed; left: 0; right: 0;
            background: #000; z-index: 20;
            pointer-events: none;
            transition: height 0.05s;
        }
        #bar-top    { top: 0;    height: 0; }
        #bar-bottom { bottom: 0; height: 0; }

        /* ── Vignette magenta (ativa durante o mergulho) ── */
        #dive-vignette {
            position: fixed; inset: 0; z-index: 4;
            pointer-events: none; opacity: 0;
            background: radial-gradient(ellipse at center, transparent 20%, rgba(90,5,38,0.85) 100%);
        }

        /* ── UI ── */
        .cinematic-vignette {
            position: relative; z-index: 2;
            height: 100vh;
            display: flex; align-items: center; justify-content: center;
            background: radial-gradient(circle at center, transparent 0%, rgba(0,0,5,0.35) 55%, rgba(0,0,0,0.92) 100%);
            pointer-events: none;
        }

        .intro-content {
            text-align: center;
            mix-blend-mode: screen;
            pointer-events: auto;
            opacity: 0;
            animation: oscarReveal 4s cubic-bezier(0.19,1,0.22,1) 1.2s forwards;
        }

        /* Cada elemento filho pode ser animado independentemente */
        .title-wrap    { overflow: hidden; }
        .subtitle-wrap { overflow: hidden; }
        .btn-wrap      { overflow: hidden; }

        h1.title {
            font-family: 'Cinzel', serif;
            font-size: clamp(4rem, 10vw, 8.5rem);
            font-weight: 700;
            margin-bottom: 0;
            color: transparent;
            background: linear-gradient(180deg,
                var(--white-starlight) 0%,
                #c0c0c0 45%,
                var(--magenta-lux) 100%
            );
            -webkit-background-clip: text;
            background-clip: text;
            text-transform: uppercase;
            letter-spacing: 0.22em;
            line-height: 1.1;
            filter: drop-shadow(0 0 55px rgba(166,28,92,0.35));
            will-change: transform, opacity, filter;
        }

        p.subtitle {
            font-weight: 300;
            font-size: clamp(0.75rem, 1.3vw, 1.1rem);
            letter-spacing: 1.6em;
            margin-top: 8px; margin-bottom: 3.5rem;
            color: #d8d8d8;
            text-transform: uppercase;
            opacity: 0.65;
            margin-left: 1.6em;
            will-change: transform, opacity;
        }

        .btn-entrar {
            background: rgba(255,255,255,0.025);
            color: var(--white-starlight);
            border: 1px solid rgba(255,255,255,0.18);
            padding: 20px 82px;
            font-family: 'Cinzel', serif;
            font-size: 0.95rem; font-weight: 700;
            letter-spacing: 0.72em;
            text-transform: uppercase;
            text-decoration: none;
            display: inline-block;
            position: relative;
            backdrop-filter: blur(18px);
            cursor: pointer;
            transition:
                background 0.9s cubic-bezier(0.165,0.84,0.44,1),
                border-color 0.9s cubic-bezier(0.165,0.84,0.44,1),
                box-shadow 0.9s cubic-bezier(0.165,0.84,0.44,1),
                letter-spacing 0.9s cubic-bezier(0.165,0.84,0.44,1),
                transform 0.9s cubic-bezier(0.165,0.84,0.44,1);
            overflow: hidden;
            animation: btnBreathe 3.8s ease-in-out infinite;
            will-change: transform, opacity;
        }

        .btn-entrar::before {
            content: '';
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(166,28,92,0.08) 0%, transparent 60%);
            opacity: 0;
            transition: opacity 0.9s;
        }

        .btn-entrar::after {
            content: '';
            position: absolute; top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
            transition: left 0.85s cubic-bezier(0.23,1,0.32,1);
        }

        .btn-entrar:hover {
            background: rgba(166,28,92,0.12);
            border-color: rgba(166,28,92,0.7);
            box-shadow: 0 0 70px rgba(166,28,92,0.55), inset 0 0 30px rgba(166,28,92,0.2);
            letter-spacing: 0.92em;
            transform: scale(1.03);
            color: #fff;
            animation: none;
        }
        .btn-entrar:hover::before { opacity: 1; }
        .btn-entrar:hover::after  { left: 100%; }

        /* ── Whiteout final ── */
        #whiteout {
            position: fixed; inset: 0;
            background: #ffffff; z-index: 200;
            opacity: 0; pointer-events: none;
        }

        /* ── Overlay escuro que "engole" o UI durante o dive ── */
        #ui-fade-overlay {
            position: fixed; inset: 0; z-index: 3;
            pointer-events: none; opacity: 0;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%);
        }

        @keyframes oscarReveal {
            0%   { opacity: 0; transform: scale(1.08) translateY(45px); filter: blur(22px); }
            100% { opacity: 1; transform: scale(1)    translateY(0);     filter: blur(0px);  }
        }

        @keyframes btnBreathe {
            0%,100% { box-shadow: 0 0 15px rgba(166,28,92,0.12); }
            50%     { box-shadow: 0 0 48px rgba(166,28,92,0.42), 0 0 90px rgba(166,28,92,0.12); }
        }

        /* Classe adicionada pelo JS ao iniciar o dive */
        .diving-active .btn-entrar {
            pointer-events: none;
        }
    </style>
</head>
<body>

    <!-- Grain -->
    <canvas id="grain-canvas"></canvas>

    <!-- Letterbox cinematográfico -->
    <div class="letterbox" id="bar-top"></div>
    <div class="letterbox" id="bar-bottom"></div>

    <!-- Vignette magenta -->
    <div id="dive-vignette"></div>

    <!-- UI fade overlay -->
    <div id="ui-fade-overlay"></div>

    <div id="webgl-container"></div>

    <div class="cinematic-vignette" id="ui-layer">
        <div class="intro-content" id="intro-block">
            <div class="title-wrap">
                <h1 class="title" id="title-text">Andromeda</h1>
            </div>
            <div class="subtitle-wrap">
                <p class="subtitle" id="subtitle-text">O Cofre Cósmico</p>
            </div>
            <div class="btn-wrap">
                <a href="#" class="btn-entrar" id="btn-despertar">Despertar</a>
            </div>
        </div>
    </div>

    <div id="whiteout"></div>

    <!-- Three.js + GSAP + Postprocessing -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>

    <script>
    // ═══════════════════════════════════════════════
    // 1. MOTOR & PIPELINE DE PÓS-PROCESSAMENTO
    // ═══════════════════════════════════════════════
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 2000);
    camera.position.set(0, 40, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    document.getElementById('webgl-container').appendChild(renderer.domElement);

    const renderPass = new THREE.RenderPass(scene, camera);

    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.05;
    bloomPass.strength  = 1.4;
    bloomPass.radius    = 0.9;

    // ── Aberração Cromática ──
    const ChromaShader = {
        uniforms: {
            tDiffuse:  { value: null },
            uStrength: { value: 0.0  }
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
            uniform sampler2D tDiffuse; uniform float uStrength; varying vec2 vUv;
            void main(){
                vec2 c=vUv-0.5; float d=length(c);
                vec2 off=c*d*uStrength;
                float r=texture2D(tDiffuse,vUv-off*1.3).r;
                float g=texture2D(tDiffuse,vUv).g;
                float b=texture2D(tDiffuse,vUv+off).b;
                gl_FragColor=vec4(r,g,b,1.0);
            }
        `
    };
    const chromaticPass = new THREE.ShaderPass(ChromaShader);

    // ── Radial Blur / Warp para o mergulho ──
    const WarpShader = {
        uniforms: {
            tDiffuse: { value: null },
            uAmount:  { value: 0.0  },
            uTime:    { value: 0.0  }
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uAmount, uTime;
            varying vec2 vUv;
            void main(){
                vec2 center = vec2(0.5);
                vec2 delta  = vUv - center;
                float dist  = length(delta);
                float warp  = uAmount * dist * dist;
                vec4 col    = vec4(0.0);
                float total = 0.0;
                for(int i=0; i<8; i++){
                    float t  = float(i) / 7.0;
                    float sc = 1.0 - warp * t;
                    vec2 uv  = center + delta * sc;
                    uv       = clamp(uv, 0.001, 0.999);
                    col     += texture2D(tDiffuse, uv) * (1.0 - t * 0.5);
                    total   += (1.0 - t * 0.5);
                }
                gl_FragColor = col / total;
            }
        `
    };
    const warpPass = new THREE.ShaderPass(WarpShader);

    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(warpPass);
    composer.addPass(chromaticPass);

    // ═══════════════════════════════════════════════
    // 2. CAMPO ESTELAR PROFUNDO (fundo fixo)
    // ═══════════════════════════════════════════════
    const bgCount = 8000;
    const bgGeom  = new THREE.BufferGeometry();
    const bgPos   = new Float32Array(bgCount * 3);
    const bgRand  = new Float32Array(bgCount);
    for(let i=0;i<bgCount;i++){
        bgPos[i*3]   = (Math.random()-0.5)*1400;
        bgPos[i*3+1] = (Math.random()-0.5)*1400;
        bgPos[i*3+2] = (Math.random()-0.5)*1400;
        bgRand[i]    = Math.random();
    }
    bgGeom.setAttribute('position', new THREE.BufferAttribute(bgPos,3));
    bgGeom.setAttribute('aRand',    new THREE.BufferAttribute(bgRand,1));
    const bgMat = new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
        uniforms:{ uTime:{ value:0 } },
        vertexShader:`
            attribute float aRand; uniform float uTime; varying float vR;
            void main(){
                vR=aRand;
                float tw=0.55+0.45*sin(uTime*1.6+aRand*97.3);
                vec4 vp=viewMatrix*modelMatrix*vec4(position,1.0);
                gl_Position=projectionMatrix*vp;
                gl_PointSize=(5.5/-vp.z)*(0.35+aRand*0.65)*tw;
            }
        `,
        fragmentShader:`
            varying float vR;
            void main(){
                float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.2);
                vec3 col=mix(vec3(0.72,0.86,1.0),vec3(1.0,0.93,0.82),vR);
                gl_FragColor=vec4(col*s,s*0.88);
            }
        `
    });
    const bgStars = new THREE.Points(bgGeom, bgMat);
    scene.add(bgStars);

    // ═══════════════════════════════════════════════
    // 3. SISTEMA DO BURACO NEGRO
    // ═══════════════════════════════════════════════
    const bhSystem = new THREE.Group();
    scene.add(bhSystem);

    // Esfera negra central
    const bhMesh = new THREE.Mesh(
        new THREE.SphereGeometry(2.0, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    bhSystem.add(bhMesh);

    // Disco de acreção
    const accretionGeom = new THREE.TorusGeometry(3.2, 0.8, 64, 128);
    const accretionShader = new THREE.ShaderMaterial({
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
        uniforms:{ uTime:{ value:0 }, uIntensityMulti:{ value:1.0 } },
        vertexShader:`varying vec2 vUv; varying vec3 vPos; void main(){ vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader:`
            uniform float uTime,uIntensityMulti; varying vec2 vUv; varying vec3 vPos;
            float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
            float fbm(vec2 p){ float f=0.0; f+=0.5*h(p); p*=2.01; f+=0.25*h(p); p*=2.01; f+=0.125*h(p); return f; }
            void main(){
                float r=length(vPos.xy);
                float ang=atan(vPos.y,vPos.x);
                float turb=fbm(vUv*24.0+vec2(uTime*0.22,0.0))*0.32;
                float pulse=0.90+0.10*sin(uTime*2.9+r);
                float intensity=pow(1.0-smoothstep(1.8,5.5,r),3.0)*pulse+turb;
                float dopp=sin(ang+uTime*0.38)*0.5+0.5;
                vec3 hotCore=vec3(1.0,0.97,0.88);
                vec3 blueShift=vec3(0.45,0.65,1.0);
                vec3 redShift=vec3(1.0,0.28,0.06);
                vec3 col=mix(hotCore, mix(redShift,blueShift,dopp), smoothstep(1.8,4.2,r));
                float vol=smoothstep(0.0,0.18,vUv.y)*smoothstep(1.0,0.82,vUv.y);
                gl_FragColor=vec4(col*intensity*uIntensityMulti, intensity*vol);
            }
        `
    });
    const photonDisk = new THREE.Mesh(accretionGeom, accretionShader);
    photonDisk.rotation.x = Math.PI/2;
    photonDisk.scale.z    = 0.05;
    bhSystem.add(photonDisk);

    // ── Galáxia Espiral (3 braços) ──
    const starsParam = { count:120000, radius:60, branches:3, spin:4.2 };
    const starsGeom  = new THREE.BufferGeometry();
    const positions  = new Float32Array(starsParam.count*3);
    const colors     = new Float32Array(starsParam.count*3);
    const randomness = new Float32Array(starsParam.count*3);

    for(let i=0;i<starsParam.count;i++){
        const i3=i*3;
        const radius     = Math.pow(Math.random(),2.5)*starsParam.radius + 4.0;
        const spinAngle  = radius*starsParam.spin;
        const branchAngle= ((i%starsParam.branches)/starsParam.branches)*Math.PI*2;
        const spread     = Math.pow(Math.random(),2.0)*(starsParam.radius-radius)*0.28;
        positions[i3]   = Math.cos(branchAngle+spinAngle)*radius + Math.cos(Math.random()*Math.PI*2)*spread;
        positions[i3+1] = (Math.random()-0.5)*(radius<12?3.2:0.7);
        positions[i3+2] = Math.sin(branchAngle+spinAngle)*radius + Math.sin(Math.random()*Math.PI*2)*spread;
        const mx=radius/starsParam.radius;
        colors[i3]  =1.0-(mx*0.88); colors[i3+1]=0.9-(mx*0.78); colors[i3+2]=0.65+(mx*0.35);
        randomness[i3]=Math.random(); randomness[i3+1]=Math.random(); randomness[i3+2]=Math.random();
    }
    starsGeom.setAttribute('position',  new THREE.BufferAttribute(positions,3));
    starsGeom.setAttribute('color',     new THREE.BufferAttribute(colors,3));
    starsGeom.setAttribute('aRandomness',new THREE.BufferAttribute(randomness,3));

    const starShader = new THREE.ShaderMaterial({
        depthWrite:false, blending:THREE.AdditiveBlending,
        vertexColors:true, transparent:true,
        uniforms:{ uTime:{value:0}, uSpeedMult:{value:1.0}, uSuck:{value:0.0} },
        vertexShader:`
            uniform float uTime,uSpeedMult,uSuck;
            attribute vec3 aRandomness; varying vec3 vColor; varying float vDist;
            void main(){
                vec3 pos=position; float dist=length(pos); vDist=dist;
                float angle=atan(pos.z,pos.x)+(uTime*uSpeedMult/(dist*0.5));
                float sf=smoothstep(0.0,1.0,uSuck);
                float curR=mix(dist,1.8,sf*(1.0-aRandomness.x*0.4));
                pos.x=cos(angle)*curR; pos.z=sin(angle)*curR;
                pos.y*=(1.0-sf*0.92);
                vec4 vp=viewMatrix*modelMatrix*vec4(pos,1.0);
                gl_Position=projectionMatrix*vp;
                gl_PointSize=(22.0/-vp.z)*(0.3+aRandomness.x); vColor=color;
            }
        `,
        fragmentShader:`varying vec3 vColor; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),3.0); gl_FragColor=vec4(vColor*s,s*0.85); }`
    });
    const galaxy = new THREE.Points(starsGeom, starShader);
    bhSystem.add(galaxy);

    // ── Jatos Relativísticos Polares ──
    function createJet(direction){
        const count=700;
        const geom=new THREE.BufferGeometry();
        const pos  =new Float32Array(count*3);
        const rands=new Float32Array(count*2);
        for(let i=0;i<count;i++){
            const t=Math.random();
            const ang=Math.random()*Math.PI*2;
            const spread=Math.pow(1-t,2)*2.2;
            pos[i*3]  =Math.cos(ang)*spread;
            pos[i*3+1]=t*20+2.2;
            pos[i*3+2]=Math.sin(ang)*spread;
            rands[i*2]=Math.random(); rands[i*2+1]=Math.random();
        }
        geom.setAttribute('position',new THREE.BufferAttribute(pos,3));
        geom.setAttribute('aRand',   new THREE.BufferAttribute(rands,2));
        const mat=new THREE.ShaderMaterial({
            transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
            uniforms:{ uTime:{value:0}, uIntensity:{value:0.0} },
            vertexShader:`
                attribute vec2 aRand; uniform float uTime,uIntensity; varying float vY; varying vec2 vR;
                void main(){
                    vR=aRand; float speed=3.5+aRand.x*5.0;
                    vec3 p=position;
                    p.y=mod(p.y-2.2+uTime*speed*aRand.x,20.0)+2.2;
                    vY=p.y/22.0;
                    vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);
                    gl_Position=projectionMatrix*vp;
                    float sz=(1.0-vY)*uIntensity*(0.5+aRand.y*0.5);
                    gl_PointSize=(28.0/-vp.z)*sz;
                }
            `,
            fragmentShader:`
                varying float vY; varying vec2 vR;
                void main(){
                    float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.0);
                    float fade=1.0-vY;
                    vec3 col=mix(vec3(0.9,0.95,1.0),vec3(0.25,0.45,1.0),vY*0.8);
                    gl_FragColor=vec4(col*s*fade,s*fade*0.9);
                }
            `
        });
        const pts=new THREE.Points(geom,mat);
        if(direction<0) pts.rotation.x=Math.PI;
        return {mesh:pts, mat};
    }
    const jetUp   = createJet(1);
    const jetDown = createJet(-1);
    bhSystem.add(jetUp.mesh);
    bhSystem.add(jetDown.mesh);

    // ── Estrias de velocidade ──
    const streakCount=220;
    const streakGeom=new THREE.BufferGeometry();
    const sPos=new Float32Array(streakCount*3);
    const sRnd=new Float32Array(streakCount*3);
    for(let i=0;i<streakCount;i++){
        const ang=Math.random()*Math.PI*2;
        const r=8+Math.random()*38;
        sPos[i*3]=Math.cos(ang)*r; sPos[i*3+1]=(Math.random()-0.5)*25; sPos[i*3+2]=(Math.random()-0.5)*90;
        sRnd[i*3]=Math.random(); sRnd[i*3+1]=Math.random(); sRnd[i*3+2]=Math.random();
    }
    streakGeom.setAttribute('position',new THREE.BufferAttribute(sPos,3));
    streakGeom.setAttribute('aRnd',    new THREE.BufferAttribute(sRnd,3));
    const streakMat=new THREE.ShaderMaterial({
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
        uniforms:{ uTime:{value:0}, uSpeed:{value:0.0} },
        vertexShader:`
            attribute vec3 aRnd; uniform float uTime,uSpeed; varying float vD; varying float vS;
            void main(){
                vec3 p=position; vS=uSpeed;
                p.z=mod(p.z+uTime*uSpeed*(10.0+aRnd.z*18.0),100.0)-50.0;
                vD=length(p.xy)/50.0;
                vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);
                gl_Position=projectionMatrix*vp;
                gl_PointSize=(uSpeed*1.8/-vp.z)*(0.5+aRnd.x);
            }
        `,
        fragmentShader:`
            varying float vD; varying float vS;
            void main(){
                float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.0);
                vec3 col=mix(vec3(1.0,1.0,1.0),vec3(0.45,0.65,1.0),vD);
                gl_FragColor=vec4(col*s,(1.0-vD)*s*0.85);
            }
        `
    });
    const speedStreaks=new THREE.Points(streakGeom,streakMat);
    bhSystem.add(speedStreaks);

    bhSystem.rotation.x=1.15;
    bhSystem.rotation.z=0.15;

    // ═══════════════════════════════════════════════
    // 4. SUPERNOVA FLASH
    // ═══════════════════════════════════════════════
    const supernova = new THREE.Mesh(
        new THREE.SphereGeometry(1,32,32),
        new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, depthWrite:false })
    );
    scene.add(supernova);

    const shockGeom=new THREE.TorusGeometry(1,0.06,16,64);
    const shockMat=new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, depthWrite:false });
    const shockwave=new THREE.Mesh(shockGeom,shockMat);
    scene.add(shockwave);

    // ═══════════════════════════════════════════════
    // 5. SISTEMA DA LUA
    // ═══════════════════════════════════════════════
    const moonSystem = new THREE.Group();
    moonSystem.visible = false;
    scene.add(moonSystem);

    const nebula = new THREE.Mesh(
        new THREE.PlaneGeometry(160,160),
        new THREE.ShaderMaterial({
            transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
            uniforms:{ uTime:{value:0}, uOpacity:{value:1.0} },
            vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader:`
                uniform float uTime,uOpacity; varying vec2 vUv;
                float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
                float noise(vec2 p){ vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
                float fbm(vec2 p){ float f=0.0,w=0.5; for(int i=0;i<5;i++){ f+=w*noise(p); p*=2.0; w*=0.5; } return f; }
                void main(){
                    vec2 uv=vUv*3.0;
                    float n=fbm(uv+fbm(uv+uTime*0.016)+fbm(uv*2.0-uTime*0.022));
                    vec3 col=mix(vec3(0.02,0.0,0.09),vec3(0.28,0.04,0.38),n);
                    col+=mix(vec3(0.0),vec3(0.1,0.02,0.2),fbm(uv*1.5+uTime*0.01));
                    float mask=pow(max(0.0,1.0-distance(vUv,vec2(0.5))*1.6),2.0);
                    gl_FragColor=vec4(col*mask,mask*uOpacity*0.55);
                }
            `
        })
    );
    nebula.position.set(0,0,-40);
    moonSystem.add(nebula);

    const baseRadius=4.0;

    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(baseRadius*1.05,64,64),
        new THREE.ShaderMaterial({
            transparent:true, blending:THREE.AdditiveBlending, side:THREE.BackSide, depthWrite:false,
            uniforms:{ uProgress:{value:0.0} },
            vertexShader:`varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader:`
                uniform float uProgress; varying vec3 vN;
                void main(){
                    float lx=mix(2.0,0.5,uProgress),lz=mix(-1.0,1.5,uProgress);
                    vec3 ld=normalize(vec3(lx,0.0,lz));
                    float intensity=pow(0.62-dot(vN,vec3(0,0,1.0)),4.0);
                    float diff=max(0.0,dot(vN,ld));
                    vec3 col=mix(vec3(1.0,0.45,0.1),vec3(0.25,0.55,1.0),uProgress)*intensity*diff*uProgress;
                    gl_FragColor=vec4(col,col.b+col.r*0.4);
                }
            `
        })
    );
    moonSystem.add(atmosphere);

    const finalMoon = new THREE.Mesh(
        new THREE.SphereGeometry(baseRadius,256,256),
        new THREE.ShaderMaterial({
            transparent:true,
            uniforms:{ uProgress:{value:0.0} },
            vertexShader:`varying vec2 vUv; varying vec3 vN,vPos; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader:`
                uniform float uProgress; varying vec2 vUv; varying vec3 vN,vPos;
                float h(float n){ return fract(sin(n)*1e4); }
                float noise(vec3 x){ vec3 i=floor(x),f=fract(x); float n=dot(i,vec3(110,241,171)); vec3 u=f*f*(3.0-2.0*f); return mix(mix(mix(h(n),h(n+110.0),u.x),mix(h(n+241.0),h(n+351.0),u.x),u.y),mix(mix(h(n+171.0),h(n+281.0),u.x),mix(h(n+412.0),h(n+522.0),u.x),u.y),u.z); }
                float fbm(vec3 p){ float f=0.0,w=0.5; for(int i=0;i<6;i++){f+=w*noise(p);p*=2.2;w*=0.5;} return f; }
                void main(){
                    float macro=fbm(vPos*0.8),micro=fbm(vPos*4.0),dust=fbm(vPos*16.0)*0.1;
                    vec3 base=vec3(0.89,0.89,0.94)-(macro*0.28)-(micro*0.18)-dust;
                    float lx=mix(2.0,0.5,uProgress),lz=mix(-1.0,1.5,uProgress);
                    vec3 ld=normalize(vec3(lx,0.0,lz));
                    float diff=max(0.0,dot(vN,ld));
                    vec3 vd=normalize(-vPos),hd=normalize(ld+vd);
                    float spec=pow(max(dot(vN,hd),0.0),40.0)*diff*0.35;
                    float rim=pow(1.0-max(dot(vN,vec3(0,0,1)),0.0),8.0);
                    float rimI=rim*(1.0-smoothstep(0.0,0.25,uProgress))*0.9;
                    vec3 final=(base*smoothstep(0.0,0.55,diff))+vec3(spec)+vec3(0.85,0.92,1.0)*rimI;
                    gl_FragColor=vec4(final,1.0);
                }
            `
        })
    );
    moonSystem.add(finalMoon);

    const coronaShader = new THREE.ShaderMaterial({
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
        uniforms:{ uTime:{value:0}, uOpacity:{value:0.0} },
        vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader:`
            uniform float uTime,uOpacity; varying vec2 vUv;
            vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
            vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
            vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
            float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 xx=2.0*fract(p*C.www)-1.0;vec3 hh=abs(xx)-0.5;vec3 ox=floor(xx+0.5);vec3 a0=xx-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+hh*hh);vec3 g;g.x=a0.x*x0.x+hh.x*x0.y;g.yz=a0.yz*x12.xz+hh.yz*x12.yw;return 130.0*dot(m,g);}
            void main(){
                vec2 center=vUv-0.5; float dist=length(center)*2.0;
                float twist=dist*2.8; float spAng=atan(center.y,center.x)+twist;
                float rays=(snoise(vec2(spAng*3.0,uTime*0.045))*0.5+0.5)*0.55+(snoise(vec2(spAng*11.0,uTime*0.075))*0.5+0.5)*0.45;
                float glow=exp(-dist*2.1)*2.8; float mask=smoothstep(0.25,0.27,dist);
                float intensity=glow*rays*mask;
                vec3 col=mix(vec3(1.0,1.0,1.0),vec3(0.45,0.15,0.75),dist*0.55);
                gl_FragColor=vec4(col*intensity,intensity*uOpacity);
            }
        `
    });
    const webglCorona=new THREE.Mesh(new THREE.PlaneGeometry(44,44),coronaShader);
    webglCorona.position.set(0,0,-4.2);
    moonSystem.add(webglCorona);

    const ringCount=2200;
    const ringGeom=new THREE.BufferGeometry();
    const rPos=new Float32Array(ringCount*3);
    const rRnd=new Float32Array(ringCount*2);
    const rAng=new Float32Array(ringCount);
    for(let i=0;i<ringCount;i++){
        const ang=Math.random()*Math.PI*2;
        const radius=5.5+Math.random()*2.8;
        rPos[i*3]=Math.cos(ang)*radius; rPos[i*3+1]=(Math.random()-0.5)*0.55; rPos[i*3+2]=Math.sin(ang)*radius;
        rRnd[i*2]=Math.random(); rRnd[i*2+1]=Math.random();
        rAng[i]=ang;
    }
    ringGeom.setAttribute('position',new THREE.BufferAttribute(rPos,3));
    ringGeom.setAttribute('aRnd',    new THREE.BufferAttribute(rRnd,2));
    ringGeom.setAttribute('aAngle',  new THREE.BufferAttribute(rAng,1));
    const ringMat=new THREE.ShaderMaterial({
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
        uniforms:{ uTime:{value:0}, uOpacity:{value:0.0} },
        vertexShader:`
            attribute vec2 aRnd; attribute float aAngle;
            uniform float uTime,uOpacity; varying vec2 vR;
            void main(){
                vR=aRnd; float speed=0.18+aRnd.x*0.22;
                float ang=aAngle+uTime*speed;
                float rad=length(position.xz);
                vec3 p=vec3(cos(ang)*rad,position.y,sin(ang)*rad);
                vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);
                gl_Position=projectionMatrix*vp;
                gl_PointSize=(18.0/-vp.z)*(0.3+aRnd.y*0.7)*uOpacity;
            }
        `,
        fragmentShader:`
            varying vec2 vR;
            void main(){
                float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.0);
                vec3 col=mix(vec3(0.65,0.78,1.0),vec3(1.0,0.94,0.88),vR.x);
                gl_FragColor=vec4(col*s,s*0.8);
            }
        `
    });
    const moonRing=new THREE.Points(ringGeom,ringMat);
    moonSystem.add(moonRing);

    const dustCount=400;
    const dustGeom=new THREE.BufferGeometry();
    const dPos=new Float32Array(dustCount*3);
    const dRnd=new Float32Array(dustCount*3);
    for(let i=0;i<dustCount;i++){
        dPos[i*3]=(Math.random()-0.5)*44; dPos[i*3+1]=(Math.random()-0.5)*44; dPos[i*3+2]=(Math.random()-0.5)*22;
        dRnd[i*3]=Math.random(); dRnd[i*3+1]=Math.random(); dRnd[i*3+2]=Math.random();
    }
    dustGeom.setAttribute('position',new THREE.BufferAttribute(dPos,3));
    dustGeom.setAttribute('aRnd',    new THREE.BufferAttribute(dRnd,3));
    const dustMat=new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
        uniforms:{ uTime:{value:0}, uOpacity:{value:0.0} },
        vertexShader:`
            attribute vec3 aRnd; uniform float uTime,uOpacity; varying float vT;
            void main(){
                vT=aRnd.z;
                vec3 p=position;
                p.x+=sin(uTime*0.09*aRnd.x+aRnd.y*100.0)*2.2;
                p.y+=cos(uTime*0.07*aRnd.y+aRnd.z*100.0)*2.2;
                vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);
                gl_Position=projectionMatrix*vp;
                float tw=0.4+0.6*sin(uTime*1.9+aRnd.z*314.0);
                gl_PointSize=(9.0/-vp.z)*tw*uOpacity;
            }
        `,
        fragmentShader:`
            varying float vT;
            void main(){
                float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.0);
                gl_FragColor=vec4(vec3(0.75,0.82,1.0)*s,s*0.55);
            }
        `
    });
    const spaceDust=new THREE.Points(dustGeom,dustMat);
    moonSystem.add(spaceDust);

    // ═══════════════════════════════════════════════
    // 6. GRAIN CINEMATOGRÁFICO
    // ═══════════════════════════════════════════════
    const gc=document.getElementById('grain-canvas');
    gc.width=200; gc.height=200;
    const gCtx=gc.getContext('2d');
    function renderGrain(){
        const img=gCtx.createImageData(200,200);
        for(let i=0;i<img.data.length;i+=4){
            const v=Math.random()*255;
            img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255;
        }
        gCtx.putImageData(img,0,0);
    }
    setInterval(renderGrain,80);

    // ═══════════════════════════════════════════════
    // 7. CÂMERA & FÍSICA
    // ═══════════════════════════════════════════════
    let mouseX=0, mouseY=0, isDiving=false;
    const traumaParams = { level:0 };

    gsap.to(camera.position,{ x:0, y:12, z:65, duration:6, ease:"power2.out" });

    document.addEventListener('mousemove', e=>{
        mouseX=(e.clientX-innerWidth/2)*0.00018;
        mouseY=(e.clientY-innerHeight/2)*0.00018;
    });

    function smoothShake(t, level){
        const sq=level*level;
        return {
            x:(Math.sin(t*38.7)*0.5+Math.sin(t*19.3)*0.3+Math.sin(t*63.1)*0.2)*sq*3.8,
            y:(Math.cos(t*29.7)*0.5+Math.cos(t*14.9)*0.3+Math.cos(t*49.3)*0.2)*sq*3.8
        };
    }

    const clock = new THREE.Clock();

    // ═══════════════════════════════════════════════
    // 8. LOOP DE ANIMAÇÃO
    // ═══════════════════════════════════════════════
    (function animate(){
        const delta=clock.getElapsedTime();

        bgMat.uniforms.uTime.value=delta;
        warpPass.uniforms.uTime.value=delta;

        if(bhSystem.visible){
            starShader.uniforms.uTime.value       = delta;
            accretionShader.uniforms.uTime.value  = delta;
            jetUp.mat.uniforms.uTime.value        = delta;
            jetDown.mat.uniforms.uTime.value      = delta;
            streakMat.uniforms.uTime.value        = delta;
            bhSystem.rotation.y                   = delta*0.012;
        }

        if(moonSystem.visible){
            coronaShader.uniforms.uTime.value              = delta;
            nebula.material.uniforms.uTime.value           = delta;
            ringMat.uniforms.uTime.value                   = delta;
            dustMat.uniforms.uTime.value                   = delta;
        }

        if(!isDiving){
            camera.position.x+=(mouseX*28 - camera.position.x)*0.012;
            camera.position.y+=(12 - mouseY*28 - camera.position.y)*0.012;
        } else if(traumaParams.level>0.01){
            const sh=smoothShake(delta, traumaParams.level);
            camera.position.x+=sh.x;
            camera.position.y+=sh.y;
        }

        camera.updateProjectionMatrix();
        camera.lookAt(0,0,0);
        composer.render();
        requestAnimationFrame(animate);
    })();

    // ═══════════════════════════════════════════════
    // 9. LINHA DO TEMPO — ANIMAÇÃO DO DIVE
    // ═══════════════════════════════════════════════
    document.getElementById('btn-despertar').addEventListener('click', e=>{
        e.preventDefault();
        if(isDiving) return;
        isDiving=true;
        document.body.classList.add('diving-active');

        const tl = gsap.timeline({ defaults:{ ease:"power3.inOut" } });

        // ══════════════════════════════════════════
        // FASE 0 — DISSOLUÇÃO DO TÍTULO (T=0 → T=2)
        // Cada elemento some com seu próprio caráter
        // ══════════════════════════════════════════

        // Título: cada letra flutua e desaparece individualmente
        const titleEl    = document.getElementById('title-text');
        const subtitleEl = document.getElementById('subtitle-text');
        const btnEl      = document.getElementById('btn-despertar');

        // Botão: primeiro some
        tl.to(btnEl, {
            opacity: 0,
            y: 12,
            filter: 'blur(8px)',
            duration: 0.9,
            ease: 'power2.in'
        }, 0)

        // Subtítulo: some logo depois com letter-spacing explodindo
        .to(subtitleEl, {
            opacity: 0,
            letterSpacing: '3.5em',
            filter: 'blur(6px)',
            duration: 1.1,
            ease: 'power2.in'
        }, 0.15)

        // Título: cresce, desfoca e evanesce — como se fosse sugado para o centro
        .to(titleEl, {
            opacity: 0,
            scale: 1.18,
            y: -18,
            filter: 'blur(16px)',
            letterSpacing: '0.5em',
            duration: 1.4,
            ease: 'power2.inOut'
        }, 0.05)

        // UI layer some por completo
        .to('#intro-block', {
            opacity: 0,
            duration: 0.4,
            ease: 'none'
        }, 1.4)

        // ══════════════════════════════════════════
        // FASE 1 — LETTERBOX + RECUO (T=0.5 → T=1.5)
        // ══════════════════════════════════════════
        .to('#bar-top',    { height:'7.5vh', duration:1.8, ease:"power3.inOut" }, 0.4)
        .to('#bar-bottom', { height:'7.5vh', duration:1.8, ease:"power3.inOut" }, 0.4)

        // Recua levemente antes de mergulhar
        .to(camera.position, { z:72, duration:1.0, ease:"power2.out" }, 0.5)

        // ══════════════════════════════════════════
        // FASE 2 — ACELERAÇÃO (T=1.5 → T=7)
        // ══════════════════════════════════════════
        .to(camera.position, {
            x:0, y:0, z:2.5,
            duration: 5.5,
            ease: "expo.in"
        }, 1.5)

        .to(camera, {
            fov: 158,
            duration: 5.5,
            ease: "expo.in",
            onUpdate: ()=>camera.updateProjectionMatrix()
        }, 1.5)

        .to(starShader.uniforms.uSpeedMult, { value:175.0, duration:5.5, ease:"power4.in" }, 1.5)
        .to(bhSystem.rotation,              { y:"+=14",   duration:5.5, ease:"power4.in" }, 1.5)

        .to(accretionShader.uniforms.uIntensityMulti, { value:60.0, duration:4.5, ease:"power3.in" }, 2.0)
        .to(starShader.uniforms.uSuck,                { value:1.0,  duration:4.0, ease:"power2.in" }, 2.5)
        .to(streakMat.uniforms.uSpeed,                { value:20.0, duration:4.2, ease:"power2.in" }, 2.0)

        // Warp radial cresce durante o mergulho
        .to(warpPass.uniforms.uAmount, { value:3.2, duration:5.0, ease:"power3.in" }, 2.0)

        // Jatos
        .to(jetUp.mat.uniforms.uIntensity,   { value:5.0, duration:3.5, ease:"power2.in" }, 1.8)
        .to(jetDown.mat.uniforms.uIntensity, { value:5.0, duration:3.5, ease:"power2.in" }, 1.8)

        // Vignette magenta
        .to('#dive-vignette', { opacity:1, duration:3.8, ease:"power2.in" }, 2.2)

        // Bloom
        .to(bloomPass, { strength:5.2, duration:2.8, ease:"power2.in" }, 4.2)

        // Aberração cromática
        .to(chromaticPass.uniforms.uStrength, { value:0.07, duration:3.2, ease:"power2.in" }, 3.5)

        // Shake
        .to(traumaParams, { level:1.0, duration:2.8, ease:"power2.in" }, 4.2)

        // ══════════════════════════════════════════
        // PONTO DE SILÊNCIO (T=7 → T=7.2)
        // Breve pausa antes da singularidade
        // ══════════════════════════════════════════
        .to(traumaParams, { level:0.0, duration:0.2 }, 7.0)
        .to(bloomPass,    { strength:0.4, duration:0.15 }, 7.0)
        .to(warpPass.uniforms.uAmount, { value:0.0, duration:0.2 }, 7.0)

        // ══════════════════════════════════════════
        // FASE 3 — SINGULARIDADE (T=7.2)
        // ══════════════════════════════════════════
        .to(supernova.scale,    { x:180, y:180, z:180, duration:0.28, ease:"power3.out" }, 7.2)
        .to(supernova.material, { opacity:1, duration:0.07 }, 7.2)
        .to(shockwave.scale,    { x:90, y:90, z:90, duration:0.85, ease:"power2.out" }, 7.28)
        .to(shockMat,           { opacity:0.65, duration:0.06 }, 7.28)
        .to(chromaticPass.uniforms.uStrength, { value:0.26, duration:0.06 }, 7.2)

        .add(()=>{
            bhSystem.visible   = false;
            moonSystem.visible = true;
            camera.position.set(0,0,8.5);
            camera.fov=38;
            camera.updateProjectionMatrix();
            bloomPass.strength=0.4;
            bloomPass.radius=1.2;
        }, 7.5)

        // ══════════════════════════════════════════
        // FASE 4 — REVELAÇÃO (T=7.5 → T=14)
        // ══════════════════════════════════════════
        .to(supernova.material, { opacity:0, duration:3.8, ease:"power2.out" }, 7.5)
        .to(shockMat,           { opacity:0, duration:2.0, ease:"power2.out" }, 7.5)

        // Aberração cromatica dissolve suavemente
        .to(chromaticPass.uniforms.uStrength, { value:0.0, duration:4.2, ease:"power2.out" }, 7.5)

        // Corona
        .to(coronaShader.uniforms.uOpacity, { value:1.0, duration:3.2, ease:"power2.out" }, 7.5)

        // Anel e poeira
        .to(ringMat.uniforms.uOpacity, { value:1.0, duration:3.8, ease:"power2.out" }, 8.0)
        .to(dustMat.uniforms.uOpacity, { value:1.0, duration:4.5, ease:"power2.out" }, 8.2)

        // Letterbox abre
        .to('#bar-top',    { height:'0vh', duration:4.0, ease:"power2.inOut" }, 9.0)
        .to('#bar-bottom', { height:'0vh', duration:4.0, ease:"power2.inOut" }, 9.0)
        .to('#dive-vignette', { opacity:0, duration:4.5, ease:"power2.out" }, 8.0)

        // Câmera recua graciosamente
        .to(camera.position, { z:23, duration:11.0, ease:"power2.out" }, 7.5)
        .to(bloomPass, { strength:1.6, radius:1.0, duration:5.0, ease:"power2.inOut" }, 7.5)

        // ══════════════════════════════════════════
        // FASE 5 — DESPERTAR (T=10 → T=20)
        // ══════════════════════════════════════════
        .to(finalMoon.material.uniforms.uProgress, { value:1.0, duration:12.0, ease:"sine.inOut" }, 10.0)
        .to(atmosphere.material.uniforms.uProgress,{ value:1.0, duration:12.0, ease:"sine.inOut" }, 10.0)
        .to(coronaShader.uniforms.uOpacity,        { value:0.0, duration:6.5,  ease:"sine.inOut" }, 12.0)

        // ══════════════════════════════════════════
        // FASE 6 — PORTAL → LOGIN (T=19 → T=24)
        // ══════════════════════════════════════════
        .to(bloomPass, { strength:3.5, duration:5.5, ease:"sine.inOut" }, 17.5)

        .to('#whiteout', {
            opacity: 1,
            duration: 3.5,
            ease: "power2.inOut",
            onComplete: ()=>{
                window.location.href = 'login.php';
            }
        }, 21.5);
    });

    window.addEventListener('resize', ()=>{
        camera.aspect=innerWidth/innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth,innerHeight);
        composer.setSize(innerWidth,innerHeight);
    });
    </script>
</body>
</html>