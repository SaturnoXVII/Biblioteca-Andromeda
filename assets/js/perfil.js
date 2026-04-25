document.addEventListener('DOMContentLoaded', () => {
    
    // ═══════════════════════════════════════════════════════════════
    // 1. MANTER ABA ATIVA APÓS REFRESH
    // ═══════════════════════════════════════════════════════════════
    const CHAVE = 'perfil_aba_ativa';
    const abaSalva = localStorage.getItem(CHAVE);
    
    if (abaSalva) {
        const btn = document.querySelector(`[data-bs-target="${abaSalva}"]`);
        if (btn) new bootstrap.Tab(btn).show();
        localStorage.removeItem(CHAVE);
    }
    
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
            const abaAtiva = document.querySelector('.nav-link.active[data-bs-target]');
            if (abaAtiva) localStorage.setItem(CHAVE, abaAtiva.dataset.bsTarget);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // 2. CURSOR MAGNÉTICO E SUAVE
    // ═══════════════════════════════════════════════════════════════
    const retEl = document.getElementById('reticle');
    const dotEl = document.getElementById('reticle-dot');
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let retX = mouseX, retY = mouseY;
    let dotX = mouseX, dotY = mouseY;
    let isHovering = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        const speedReticle = isHovering ? 0.3 : 0.15;
        const speedDot = 0.6;

        retX += (mouseX - retX) * speedReticle;
        retY += (mouseY - retY) * speedReticle;
        dotX += (mouseX - dotX) * speedDot;
        dotY += (mouseY - dotY) * speedDot;

        if(retEl && dotEl) {
            retEl.style.transform = `translate3d(${retX}px, ${retY}px, 0) translate(-50%, -50%)`;
            dotEl.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
        }
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const interactables = document.querySelectorAll('.form-control, .btn, a, button, .nav-link');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => { isHovering = true; if(retEl) retEl.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { isHovering = false; if(retEl) retEl.classList.remove('hover'); });
    });

    // ═══════════════════════════════════════════════════════════════
    // 3. BACKGROUND THREE.JS: ESTRELAS CIENTÍFICAS E PULSANTES
    // ═══════════════════════════════════════════════════════════════
    if(typeof THREE !== 'undefined' && document.getElementById('webgl')) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 4000);
        
        // CORREÇÃO CRÍTICA: Renderer sem alpha, pintando o fundo escuro diretamente.
        // Isso evita o bug de transparência com AdditiveBlending.
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor(0x020305, 1); // Fundo "Void" do CSS
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
        document.getElementById('webgl').appendChild(renderer.domElement);

        // Gera a textura esférica (gradiente de branco para preto)
        function getStarTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            // Fundo PRETO essencial para o AdditiveBlending funcionar
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 32, 32);

            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
            gradient.addColorStop(1, 'rgba(0,0,0,1)'); 
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
            return new THREE.CanvasTexture(canvas);
        }

        // Cores baseadas nas classes espectrais reais
        const spectralColors = [
            { hex: 0x9bb0ff, prob: 0.02 }, // O (Azul muito quente)
            { hex: 0xaabfff, prob: 0.05 }, // B 
            { hex: 0xcad7ff, prob: 0.10 }, // A 
            { hex: 0xf8f7ff, prob: 0.15 }, // F 
            { hex: 0xfff4ea, prob: 0.20 }, // G (Como o nosso Sol)
            { hex: 0xffd2a1, prob: 0.25 }, // K 
            { hex: 0xffcc6f, prob: 0.23 }  // M (Anã vermelha)
        ];

        function getScientificColor() {
            let rand = Math.random();
            let sum = 0;
            for(let sc of spectralColors) {
                sum += sc.prob;
                if(rand <= sum) return new THREE.Color(sc.hex);
            }
            return new THREE.Color(0xffcc6f); 
        }

        const starTexture = getStarTexture();
        const groups = [
            { count: 3500, size: 3.0, pulseSpeed: 0 },      // Fundo imóvel (aumentei o size base)
            { count: 1000, size: 5.0, pulseSpeed: 0.02 },   // Cintilação suave
            { count: 500,  size: 8.0, pulseSpeed: 0.05 }    // Cintilação rápida e proeminente
        ];

        const particleSystems = [];

        groups.forEach(group => {
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(group.count * 3);
            const colors = new Float32Array(group.count * 3);

            for(let i = 0; i < group.count; i++) {
                // Distribuição esférica
                positions[i*3]   = (Math.random() - 0.5) * 3500; 
                positions[i*3+1] = (Math.random() - 0.5) * 3500; 
                positions[i*3+2] = (Math.random() - 0.5) * 3500; 

                const c = getScientificColor();
                colors[i*3] = c.r;
                colors[i*3+1] = c.g;
                colors[i*3+2] = c.b;
            }
            
            // Usando Float32BufferAttribute para compatibilidade máxima
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const mat = new THREE.PointsMaterial({
                size: group.size,
                map: starTexture,
                vertexColors: true,
                transparent: true,
                depthWrite: false, 
                blending: THREE.AdditiveBlending 
            });

            const points = new THREE.Points(geo, mat);
            points.userData = { 
                pulseSpeed: group.pulseSpeed,
                phase: Math.random() * Math.PI * 2 
            };
            
            scene.add(points);
            particleSystems.push(points);
        });

        camera.position.z = 800;

        // Paralaxe Suave
        let targetX = 0;
        let targetY = 0;
        
        document.addEventListener('mousemove', (event) => {
            targetX = (event.clientX - window.innerWidth / 2) * 0.05;
            targetY = (event.clientY - window.innerHeight / 2) * 0.05;
        });

        let time = 0;
        function animateStars() {
            requestAnimationFrame(animateStars);
            time += 1;
            
            particleSystems.forEach(sys => {
                // Rotação suave da galáxia
                sys.rotation.y += 0.0002;
                sys.rotation.x += 0.0001;

                // Cintilação orgânica (Pulsação)
                if(sys.userData.pulseSpeed > 0) {
                    const sineWave = Math.sin(time * sys.userData.pulseSpeed + sys.userData.phase);
                    sys.material.opacity = 0.5 + 0.5 * sineWave;
                }
            });

            camera.position.x += (targetX - camera.position.x) * 0.02;
            camera.position.y += (-targetY - camera.position.y) * 0.02;
            camera.lookAt(scene.position);
            
            renderer.render(scene, camera);
        }
        animateStars();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
});