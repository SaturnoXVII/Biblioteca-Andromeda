   /* ═══════════════════════════════════════════════════════════════
           CURSOR INTERATIVO
        ═══════════════════════════════════════════════════════════════ */
        let mX = 0, mY = 0;
        const retEl = document.getElementById('reticle'), retDot = document.getElementById('reticle-dot');
        let retX = window.innerWidth / 2, retY = window.innerHeight / 2, dotX = retX, dotY = retY, tgtX = retX, tgtY = retY, isMag = false;

        document.addEventListener('mousemove', e => {
            tgtX = e.clientX; tgtY = e.clientY;
            mX = (e.clientX / innerWidth - .5) * 2; 
            mY = (e.clientY / innerHeight - .5) * 2;

            // Atração magnética para botões e inputs
            const els = document.querySelectorAll('.form-control, .interactable');
            let closest = null, closestDist = 40;
            els.forEach(el => {
                const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                const d = Math.hypot(e.clientX - cx, e.clientY - cy);
                if (d < closestDist) { closestDist = d; closest = { x: cx, y: cy }; isMag = true; }
            });
            if (!closest) isMag = false;
        });

        (function animCursor() {
            const eas = isMag ? 0.4 : 0.35; 
            retX += (tgtX - retX) * eas; retY += (tgtY - retY) * eas;
            dotX += (tgtX - dotX) * 0.65; dotY += (tgtY - dotY) * 0.65;
            retEl.style.transform = `translate3d(${retX}px, ${retY}px, 0) translate(-50%, -50%)`;
            retDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
            if (isMag) retEl.classList.add('hover'); else retEl.classList.remove('hover');
            requestAnimationFrame(animCursor);
        })();
        
        document.addEventListener('mousedown', () => retEl.classList.add('click')); 
        document.addEventListener('mouseup', () => retEl.classList.remove('click'));

        /* ═══════════════════════════════════════════════════════════════
           THREE.JS - O PORTAL DE ANDRÔMEDA (BACKGROUND)
        ═══════════════════════════════════════════════════════════════ */
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 3000);
        camera.position.set(0, 8, 45); // Posição estática mas grandiosa
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        document.getElementById('webgl').appendChild(renderer.domElement);

        // Pós-processamento (Bloom e Aberração Cromática)
        const rPass = new THREE.RenderPass(scene, camera);
        const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.2, .55, .82);

        const ChromaShader = {
            uniforms: { tDiffuse: { value: null }, uS: { value: 0.002 } },
            vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `uniform sampler2D tDiffuse;uniform float uS;varying vec2 vUv;void main(){vec2 c=vUv-.5;float d=length(c);vec2 o=c*d*uS;gl_FragColor=vec4(texture2D(tDiffuse,vUv-o*.8).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv+o*.7).b,1.0);}`
        };
        const chroma = new THREE.ShaderPass(ChromaShader);

        const composer = new THREE.EffectComposer(renderer);
        composer.addPass(rPass); composer.addPass(bloom); composer.addPass(chroma);

        // Estrelas de Fundo Clássicas
        let bgMat;
        (function() {
            const starVS = `attribute float aR,aFlicker;uniform float uT;varying float vR;varying vec3 vC;void main(){vC=color;float tw=0.5+0.5*sin(uT*0.8+aR*88.0+aFlicker*7.0)*sin(uT*1.3+aFlicker*3.0);vec4 vp=viewMatrix*modelMatrix*vec4(position,1.0);gl_Position=projectionMatrix*vp;gl_PointSize=(9.0/-vp.z)*(0.25+aR*0.95)*tw;}`;
            const starFS = `varying vec3 vC;void main(){float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.5);gl_FragColor=vec4(vC,s*.88);}`;
            const OBAFGKM = [ [0.6,0.7,1.0], [0.7,0.8,1.0], [1.0,1.0,1.0], [1.0,1.0,0.8], [1.0,0.9,0.6], [1.0,0.7,0.4], [1.0,0.4,0.2] ];

            function mkLayer(N, spread, colA, colB) {
                const g = new THREE.BufferGeometry(), p = new Float32Array(N*3), r = new Float32Array(N), fl = new Float32Array(N), c = new Float32Array(N*3);
                for (let i=0; i<N; i++) {
                    p[i*3]=(Math.random()-.5)*spread; p[i*3+1]=(Math.random()-.5)*spread; p[i*3+2]=(Math.random()-.5)*spread;
                    r[i]=Math.random(); fl[i]=Math.random(); const t=Math.random();
                    c[i*3]=colA[0]*(1-t)+colB[0]*t; c[i*3+1]=colA[1]*(1-t)+colB[1]*t; c[i*3+2]=colA[2]*(1-t)+colB[2]*t;
                }
                g.setAttribute('position', new THREE.BufferAttribute(p,3)); g.setAttribute('aR', new THREE.BufferAttribute(r,1)); g.setAttribute('aFlicker', new THREE.BufferAttribute(fl,1)); g.setAttribute('color', new THREE.BufferAttribute(c,3));
                return g;
            }
            const mkMat = u => new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true, uniforms:u, vertexShader:starVS, fragmentShader:starFS });
            scene.add(new THREE.Points(mkLayer(4000, 1000, OBAFGKM[0], OBAFGKM[2]), mkMat({uT:{value:0}}))); 
            bgMat = mkMat({uT:{value:0}});
            scene.add(new THREE.Points(mkLayer(2000, 800, OBAFGKM[5], OBAFGKM[6]), bgMat)); 
        })();

        // Resize
        window.addEventListener('resize', () => { 
            camera.aspect = innerWidth / innerHeight; 
            camera.updateProjectionMatrix(); 
            renderer.setSize(innerWidth, innerHeight); 
            composer.setSize(innerWidth, innerHeight); 
        });

        // Loop de Renderização
        const clock = new THREE.Clock();
        (function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            if (bgMat) bgMat.uniforms.uT.value = t;

            // Movimento sutil da câmera baseado no mouse para dar paralaxe
            camera.position.x += (mX * 2 - camera.position.x) * 0.05;
            camera.position.y += (8 - mY * 2 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);

            composer.render();
        })();