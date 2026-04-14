<?php 
session_start();
// include ("../config/conexao.php");
// include ("../config/crud.php");
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteca Andrômeda | O Cofre Cósmico</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">

    <style>
        :root {
            --magenta-lux: #A61C5C;
            --white-starlight: #ffffff;
            --dark-void: #010103;
        }

        body, html {
            margin: 0; padding: 0; width: 100%; height: 100%;
            overflow: hidden; background-color: var(--dark-void);
            font-family: 'Montserrat', sans-serif;
            color: var(--white-starlight);
        }

        #webgl-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }

        /* Interface Principal */
        .cinematic-vignette {
            position: relative; z-index: 2; height: 100vh;
            display: flex; align-items: center; justify-content: center;
            background: radial-gradient(circle at center, transparent 10%, rgba(1, 1, 3, 0.6) 60%, rgba(0, 0, 0, 1) 100%);
            transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .intro-content {
            text-align: center; mix-blend-mode: screen; 
            opacity: 0;
            animation: oscarReveal 5s cubic-bezier(0.19, 1, 0.22, 1) 1s forwards;
            transition: transform 2.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 1.5s;
        }

        h1.title {
            font-family: 'Cinzel', serif;
            font-size: clamp(3.5rem, 9vw, 7rem); font-weight: 700;
            margin-bottom: 0; color: transparent;
            background: linear-gradient(180deg, var(--white-starlight) 0%, #e8e8e8 50%, var(--magenta-lux) 100%);
            -webkit-background-clip: text; text-transform: uppercase;
            letter-spacing: 0.25em; line-height: 1.1;
            filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.2));
        }

        p.subtitle {
            font-weight: 300; font-size: clamp(0.8rem, 1.5vw, 1.2rem);
            letter-spacing: 1em; margin-top: 15px; margin-bottom: 4rem;
            color: #d1c4e9; text-transform: uppercase; opacity: 0.7; margin-left: 1em;
        }

        .btn-entrar {
            background: rgba(255, 255, 255, 0.02);
            color: var(--white-starlight);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 20px 70px; font-family: 'Cinzel', serif;
            font-size: 0.95rem; font-weight: 700;
            letter-spacing: 0.5em; text-transform: uppercase;
            text-decoration: none; display: inline-block;
            position: relative; backdrop-filter: blur(10px);
            cursor: pointer;
            transition: all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .btn-entrar:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--magenta-lux);
            box-shadow: 0 0 60px rgba(166, 28, 92, 0.5), inset 0 0 20px rgba(166, 28, 92, 0.2);
            letter-spacing: 0.7em; transform: translateY(-3px);
        }

        /* TELA DE TRANSIÇÃO (Eclipse -> Lua) */
        #transition-layer {
            position: fixed; inset: 0; background: #000;
            z-index: 100; opacity: 0; pointer-events: none;
            display: flex; align-items: center; justify-content: center;
            transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .moon-container {
            position: relative; width: 300px; height: 300px;
            transform: scale(0.7) translateY(20px);
            transition: transform 5s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .moon-glow {
            position: absolute; inset: 0;
            background: radial-gradient(circle, #ffffff 20%, #e0c3fc 70%, transparent 100%);
            border-radius: 50%; opacity: 0;
            transition: opacity 3s ease, box-shadow 4s ease;
        }

        .moon-shadow {
            position: absolute; inset: -1%;
            background: #000; border-radius: 50%;
            transform: translateX(0); 
            transition: transform 5s cubic-bezier(0.5, 0, 0.1, 1);
        }

        #whiteout {
            position: fixed; inset: 0; background: #fff;
            z-index: 200; opacity: 0; pointer-events: none;
            transition: opacity 1.2s cubic-bezier(0.7, 0, 0.3, 1);
        }

        @keyframes oscarReveal {
            0% { opacity: 0; transform: scale(1.1) translateY(40px); filter: blur(30px); letter-spacing: 0.7em; }
            100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); letter-spacing: 0.25em; }
        }
    </style>
</head>
<body>

    <div id="webgl-container"></div>

    <div class="cinematic-vignette" id="ui-layer">
        <div class="intro-content" id="intro-block">
            <h1 class="title">Andrômeda</h1>
            <p class="subtitle">O Cofre Cósmico</p>
            <a href="#" class="btn-entrar" id="btn-despertar">Despertar Guardiões</a>
        </div>
    </div>

    <div id="transition-layer">
        <div class="moon-container" id="moon-stage">
            <div class="moon-glow" id="moon-light"></div>
            <div class="moon-shadow" id="moon-dark"></div>
        </div>
    </div>
    <div id="whiteout"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <script>
        // --- CONFIGURAÇÃO WEBGL ---
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2('#010103', 0.015);
        
        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Posição inicial de "mergulho" (distante e alta)
        camera.position.set(0, 60, 120); 
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('webgl-container').appendChild(renderer.domElement);

        const cosmicSystem = new THREE.Group();
        scene.add(cosmicSystem);

        // --- 1. O BURACO NEGRO CIENTÍFICO (Magnitude & Ciência) ---
        const bhRadius = 1.3;
        
        // 1.1 Horizonte de Eventos (Vazio Absoluto)
        const bhGeom = new THREE.SphereGeometry(bhRadius, 64, 64);
        const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const blackHole = new THREE.Mesh(bhGeom, bhMat);
        cosmicSystem.add(blackHole);

        // 1.2 Disco de Acreção Detalhado (Shader Avançado)
        // Cria volume, turbulência sutil e gradiente de temperatura hiper-quente
        const accretionGeom = new THREE.TorusGeometry(bhRadius * 1.6, bhRadius * 0.4, 4, 100);
        const accretionShader = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vPosition;

                // Função de ruído simples para simular turbulência de gás
                float noise(vec2 p) {
                    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
                }

                void main() {
                    // Distância radial do centro do toro
                    float radialDist = length(vPosition.xy);
                    
                    // Intensidade baseada na proximidade do Horizonte de Eventos
                    float intensity = pow(1.0 - smoothstep(1.5, 3.5, radialDist), 2.0);
                    
                    // Adiciona ruído temporal para simular gás turbulento
                    float turbulence = noise(vUv * 20.0 + uTime * 0.1) * 0.1;
                    intensity += turbulence;

                    // Gradiente Cromático Místico: Branco Platinado (Quente) -> Magenta (Borda)
                    vec3 colorHot = vec3(1.0, 1.0, 1.0); // Núcleo
                    vec3 colorCool = vec3(0.65, 0.1, 0.36); // Magenta da paleta nas bordas
                    
                    vec3 finalColor = mix(colorHot, colorCool, smoothstep(1.8, 3.0, radialDist));
                    
                    // Aplica intensidade volumétrica sutil
                    float ringVolume = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
                    
                    gl_FragColor = vec4(finalColor * intensity * 2.0, intensity * ringVolume);
                }
            `
        });
        const photonDisk = new THREE.Mesh(accretionGeom, accretionShader);
        photonDisk.rotation.x = Math.PI / 2; // Deita o disco
        photonDisk.scale.z = 0.1; // Achata o volume para parecer um disco fino curvado
        cosmicSystem.add(photonDisk);

        // --- 2. GALÁXIA CINTILANTE ULTRA-DENSA ---
        const starsParam = { count: 90000, radius: 26, branches: 5, spin: 2.6 };
        const starsGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(starsParam.count * 3);
        const colors = new Float32Array(starsParam.count * 3);
        const scales = new Float32Array(starsParam.count);
        const randomness = new Float32Array(starsParam.count * 3);

        for (let i = 0; i < starsParam.count; i++) {
            const i3 = i * 3;
            const r = Math.random();
            // As estrelas nascem mais concentradas perto do disco de acreção
            const radius = Math.pow(r, 1.4) * starsParam.radius + (bhRadius * 1.8);
            
            const spinAngle = radius * starsParam.spin;
            const branchAngle = ((i % starsParam.branches) / starsParam.branches) * Math.PI * 2;
            const randFactor = 0.25 * radius;
            const randX = Math.pow(Math.random(), 4) * (Math.random() < 0.5 ? 1 : -1) * randFactor;
            const randY = Math.pow(Math.random(), 5) * (Math.random() < 0.5 ? 1 : -1) * randFactor;
            const randZ = Math.pow(Math.random(), 4) * (Math.random() < 0.5 ? 1 : -1) * randFactor;

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randX;
            positions[i3 + 1] = randY * (radius < 6 ? 0.7 : 0.12); // Achatamento realista
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randZ;

            const luminance = 0.75 + Math.random() * 0.25;
            colors[i3] = luminance; colors[i3 + 1] = luminance; colors[i3 + 2] = luminance + 0.08;
            scales[i] = Math.random();
            randomness[i3] = Math.random(); randomness[i3+1] = Math.random(); randomness[i3+2] = Math.random();
        }

        starsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeom.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        starsGeom.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

        const starShader = new THREE.ShaderMaterial({
            depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, transparent: true,
            uniforms: { uTime: { value: 0 }, uSize: { value: 30.0 * renderer.getPixelRatio() } },
            vertexShader: `
                uniform float uTime; uniform float uSize;
                attribute float aScale; attribute vec3 aRandomness;
                varying vec3 vColor;
                void main() {
                    vec4 viewPos = viewMatrix * modelMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * viewPos;
                    // Piscar mais orgânico e suave
                    float twinkle = sin(uTime * 2.5 + aRandomness.x * 150.0) * 0.5 + 0.5;
                    gl_PointSize = uSize * aScale * (0.7 + twinkle * 0.7) * (1.0 / -viewPos.z);
                    vColor = color;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    // Partículas esféricas suaves
                    float strength = pow(1.0 - distance(gl_PointCoord, vec2(0.5)), 4.0);
                    gl_FragColor = vec4(vColor * strength, strength);
                }
            `
        });

        const galaxy = new THREE.Points(starsGeom, starShader);
        cosmicSystem.add(galaxy);

        // Inclinação Estética de Cinema
        cosmicSystem.rotation.x = 1.25;
        cosmicSystem.rotation.z = 0.15;

        // --- 3. ANIMAÇÃO ULTRA-SUAVE (Mergulho e Parallax) ---
        let mouseX = 0, mouseY = 0;
        let isDiving = false; 
        
        // Posição alvo para o mergulho inicial (suave)
        const camTargetPos = new THREE.Vector3(0, 15, 65);
        
        document.addEventListener('mousemove', (e) => {
            if(isDiving) return;
            // Sensibilidade do mouse reduzida para suavidade
            mouseX = (e.clientX - window.innerWidth / 2) * 0.0006;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.0006;
        });

        const clock = new THREE.Clock();

        const animate = () => {
            const delta = clock.getElapsedTime();
            starShader.uniforms.uTime.value = delta;
            accretionShader.uniforms.uTime.value = delta;
            
            // Galáxia gira majestosamente devagar
            galaxy.rotation.y = delta * 0.06;

            if(!isDiving) {
                // MERGULHO DE ABERTURA & PARALLAX DO MOUSE (Lógica Perfeita)
                // A câmera viaja da posição inicial (0,60,120) para a camTargetPos (0,15,65) suavemente
                camera.position.lerp(camTargetPos, 0.012); // Lerp muito baixo = suavidade extrema
                
                // Aplica o Parallax do mouse somado à posição alvo
                camera.position.x += (mouseX * 40 - (camera.position.x - camTargetPos.x)) * 0.02;
                camera.position.y += (-mouseY * 40 - (camera.position.y - camTargetPos.y)) * 0.02;

                // FOV normal
                camera.fov += (55 - camera.fov) * 0.02; 
            } else {
                // MODO WARP (Puxada violenta e suave)
                // Câmera sela no centro absoluto
                camera.position.lerp(new THREE.Vector3(0, 0, bhRadius * 0.8), 0.04);
                
                // FOV estica dramaticamente (efeito mola harmônica)
                camera.fov += (150 - camera.fov) * 0.03; 
                
                // Sistema gira violentamente
                cosmicSystem.rotation.y += (0.12 - (cosmicSystem.rotation.y - delta*0.1)) * 0.05;
            }
            
            camera.updateProjectionMatrix();
            // Câmera sempre foca suavemente no Buraco Negro
            camera.lookAt(0, 0, 0); 
            
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        // --- 4. A COREOGRAFIA DO DESPERTAR ---
        document.getElementById('btn-despertar').addEventListener('click', (e) => {
            e.preventDefault();
            if(isDiving) return;
            isDiving = true;

            // 1. Derrete a Interface
            const introBlock = document.getElementById('intro-block');
            introBlock.style.transform = 'scale(1.8) translateZ(150px) translateY(-50px)';
            introBlock.style.opacity = '0';
            document.getElementById('ui-layer').style.opacity = '0';

            // 2. Coreografia Celestial (Eclipse -> Lua Cheia)
            // Inicia um pouco antes do mergulho final para suavizar a transição
            setTimeout(() => {
                const transLayer = document.getElementById('transition-layer');
                const moonLight = document.getElementById('moon-light');
                const moonDark = document.getElementById('moon-dark');
                const moonStage = document.getElementById('moon-stage');

                transLayer.style.opacity = '1'; // Tela fica preta suavemente

                // 2.1 Aparece a Coroa Celéstial (Diamond Ring)
                setTimeout(() => {
                    moonLight.style.opacity = '1';
                    moonStage.style.transform = 'scale(1) translateY(0)'; // Sobe e cresce
                }, 800);

                // 2.2 A sombra desliza suavemente revelando as fases
                setTimeout(() => {
                    moonDark.style.transform = 'translateX(105%)'; // Sombra sai totalmente
                    
                    // Lua Cheia ofuscante
                    moonLight.style.boxShadow = '0 0 180px rgba(255, 255, 255, 1), inset 0 0 40px rgba(255,255,255,0.5)';
                    moonLight.style.background = 'radial-gradient(circle, #ffffff 60%, #ffffff 100%)';
                }, 2500);

                // 2.3 Flash de Luz (Whiteout Estourado) e Redirecionamento
                setTimeout(() => {
                    document.getElementById('whiteout').style.opacity = '1';
                    
                    setTimeout(() => {
                        window.location.href = 'login.php';
                    }, 1200); // Carrega a página no auge do clarão

                }, 6000);

            }, 2200); // Tempo do mergulho Warp antes da fase da lua
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            starShader.uniforms.uSize.value = 30.0 * renderer.getPixelRatio();
        });
    </script>
</body>
</html>