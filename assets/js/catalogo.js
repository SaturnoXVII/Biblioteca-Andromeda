/* ═══════════════════════════════════════════════════════════════
           1. INTRO CINEMATOGRÁFICA (GSAP)
        ═══════════════════════════════════════════════════════════════ */
        const INTRO_DUR = 4.8;
        const tl = gsap.timeline();
        tl.to('#i-brand', {
                y: 0,
                opacity: 1,
                duration: 1.5,
                ease: 'power4.out',
                delay: 0.3
            })
            .to('#i-brand', {
                letterSpacing: '0.3em',
                duration: 2.5,
                ease: 'power2.out'
            }, '-=1')
            .to('#i-tag', {
                opacity: 1,
                y: -10,
                duration: 1,
                ease: 'power2.out'
            }, '-=2')
            .to('#intro-cinematic', {
                opacity: 0,
                duration: 1,
                ease: 'power2.inOut',
                delay: 0.5,
                onComplete: () => {
                    document.getElementById('intro-cinematic').style.display = 'none';
                }
            });

        /* ═══════════════════════════════════════════════════════════════
           2. UTILITÁRIOS & ARTE GERATIVA
        ═══════════════════════════════════════════════════════════════ */
        function hexToRgb(h) {
            return {
                r: (h >> 16) & 255,
                g: (h >> 8) & 255,
                b: h & 255
            };
        }

        function statusClass(s) {
            const n = (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (n.includes('disp')) return 's-disp';
            if (n.includes('empr')) return 's-empr';
            if (n.includes('res')) return 's-res';
            return 's-unk';
        }

        const PALETTE = [0x2AA2F6, 0xA960EE, 0x00F0FF, 0x14599D, 0x4D9FFF, 0x7B2CBF, 0x0B4F6C, 0x00B4D8];

        function catColor(n) {
            if (!n) return PALETTE[0];
            let h = 0;
            for (const c of n) h = ((h << 5) - h) + c.charCodeAt(0) | 0;
            return PALETTE[Math.abs(h) % PALETTE.length];
        }

        function catHexStr(n) {
            return '#' + catColor(n).toString(16).padStart(6, '0');
        }

        function drawBookArt(canvas, title, category, w, h) {
            if (!canvas) return;
            canvas.width = w || canvas.clientWidth || 300;
            canvas.height = h || canvas.clientHeight || 200;
            const ctx = canvas.getContext('2d'),
                W = canvas.width,
                H = canvas.height;

            let seed = 0;
            for (const c of (title || 'X')) seed = ((seed << 5) - seed) + c.charCodeAt(0) | 0;
            const rnd = (() => {
                let s = Math.abs(seed);
                return () => {
                    s = (s * 1664525 + 1013904223) & 0xffffffff;
                    return (s >>> 0) / 0xffffffff;
                }
            })();

            const col = catColor(category);
            const {
                r: cr,
                g: cg,
                b: cb
            } = hexToRgb(col);

            const bg = ctx.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, `rgb(${Math.round(cr*.25)},${Math.round(cg*.2)},${Math.round(cb*.3)})`);
            bg.addColorStop(.5, `rgb(${Math.round(cr*.1)},${Math.round(cg*.1)},${Math.round(cb*.15)})`);
            bg.addColorStop(1, `rgb(${Math.round(cr*.05)},${Math.round(cg*.1)},${Math.round(cb*.2)})`);
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            for (let y = 0; y < H; y += 3) {
                for (let x = 0; x < W; x += 3) {
                    const n = (rnd() - .5) * .08;
                    ctx.fillStyle = `rgba(${n>0?0:cr},${n>0?255:cg},${n>0?255:cb},${Math.abs(n)})`;
                    ctx.fillRect(x, y, 2, 2);
                }
            }

            for (let i = 0; i < 3; i++) {
                const x = rnd() * W,
                    y = rnd() * H,
                    rad = 30 + rnd() * 80;
                const gc = ctx.createRadialGradient(x, y, 0, x, y, rad);
                gc.addColorStop(0, `rgba(${cr},${cg},${cb},${.15+rnd()*.2})`);
                gc.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(x, y, rad, 0, Math.PI * 2);
                ctx.fillStyle = gc;
                ctx.fill();
            }

            ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.08)`;
            ctx.lineWidth = .5;
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

            const formulas = ['∇×E', 'iℏ∂Ψ', 'G_μν', 'H|ψ⟩', 'ΔxΔp', '∫e^ix', 'Ω_Λ'];
            ctx.font = `${Math.min(H*.08,12)}px 'Space Mono',monospace`;
            ctx.fillStyle = `rgba(${cr},${cg},${cb},0.2)`;
            for (let i = 0; i < 2; i++) {
                ctx.fillText(formulas[Math.floor(rnd() * formulas.length)], rnd() * W * .8, rnd() * H);
            }

            ctx.font = `bold ${Math.min(H*.1,20)}px 'Cormorant Garamond',serif`;
            ctx.fillStyle = `rgba(${cr},${cg},${cb},0.3)`;
            ctx.textAlign = 'center';
            const words = (title || '').split(' ');
            let line = '',
                lineY = H * .5;
            words.forEach(word => {
                const test = line + word + ' ';
                if (ctx.measureText(test).width > W * .85 && line !== '') {
                    ctx.fillText(line.trim(), W / 2, lineY);
                    line = word + ' ';
                    lineY += H * .12;
                } else {
                    line = test;
                }
            });
            if (line) ctx.fillText(line.trim(), W / 2, lineY);

            const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .9);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(2,3,5,.8)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
        }

        /* ═══════════════════════════════════════════════════════════════
           2.1 ARTE COM CAPA REAL (+ FALLBACK GERATIVO)
        ═══════════════════════════════════════════════════════════════ */
        function drawBookArtWithCover(canvas, title, category, w, h, capaUrl) {
            if (!canvas) return;
            canvas.width  = w || canvas.clientWidth  || 300;
            canvas.height = h || canvas.clientHeight || 200;

            const semCapa = !capaUrl
                || capaUrl === 'uploads/capas/default.jpg'
                || capaUrl === '';

            if (!semCapa) {
                const img = new Image();
                img.onload = () => {
                    const ctx = canvas.getContext('2d');
                    // Limpa e desenha a imagem cobrindo todo o canvas (object-fit: cover)
                    const W = canvas.width, H = canvas.height;
                    const scale = Math.max(W / img.width, H / img.height);
                    const sw = img.width * scale, sh = img.height * scale;
                    const ox = (W - sw) / 2, oy = (H - sh) / 2;
                    ctx.clearRect(0, 0, W, H);
                    ctx.drawImage(img, ox, oy, sw, sh);

                    // Vinheta sutil sobre a capa para manter o estilo cósmico
                    const vig = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*.35, W/2, H/2, Math.max(W,H)*.9);
                    vig.addColorStop(0, 'rgba(0,0,0,0)');
                    vig.addColorStop(1, 'rgba(2,3,5,.55)');
                    ctx.fillStyle = vig;
                    ctx.fillRect(0, 0, W, H);
                };
                img.onerror = () => {
                    // Imagem não carregou: usa arte gerativa como fallback
                    drawBookArt(canvas, title, category, w, h);
                };
                // Ajuste do caminho: catalogo.php fica em pages/, uploads/ fica na raiz
                img.src = '../' + capaUrl;
            } else {
                drawBookArt(canvas, title, category, w, h);
            }
        }

        /* ═══════════════════════════════════════════════════════════════
           3. THREE.JS SETUP & SHADERS
        ═══════════════════════════════════════════════════════════════ */
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 3000);
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        document.getElementById('webgl').appendChild(renderer.domElement);

        const cam = {
            tx: 0,
            ty: 18,
            tz: 96
        };
        let camTzTarget = 96;
        const camLook = {
            x: 0,
            y: 0,
            z: 0
        };
        const camLookDst = {
            x: 0,
            y: 0,
            z: 0
        };

        const rPass = new THREE.RenderPass(scene, camera);
        const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.1, .55, .82);

        const ChromaShader = {
            uniforms: {
                tDiffuse: { value: null },
                uS: { value: 0.002 }
            },
            vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `uniform sampler2D tDiffuse;uniform float uS;varying vec2 vUv;void main(){vec2 c=vUv-.5;float d=length(c);vec2 o=c*d*uS;gl_FragColor=vec4(texture2D(tDiffuse,vUv-o*.8).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv+o*.7).b,1.0);}`
        };
        const chroma = new THREE.ShaderPass(ChromaShader);

        const LensShader = {
            uniforms: {
                tDiffuse: { value: null },
                uBHPos: { value: new THREE.Vector2(.5, .5) },
                uBHR: { value: 0.035 },
                uStr: { value: 0.012 }
            },
            vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `uniform sampler2D tDiffuse;uniform vec2 uBHPos;uniform float uBHR,uStr;varying vec2 vUv;void main(){vec2 delta=vUv-uBHPos;float dist=length(delta);float alpha=uStr*(uBHR*uBHR)/(dist*dist+0.0001);alpha=clamp(alpha,0.0,0.08);vec2 dir=normalize(delta+vec2(0.00001));vec2 uv2=vUv-dir*alpha;vec4 col=texture2D(tDiffuse,uv2);float eh=smoothstep(uBHR*.7,0.0,dist);col.rgb*=(1.0-eh*.97);float ring=smoothstep(uBHR*.9,uBHR*1.05,dist)*smoothstep(uBHR*1.45,uBHR*1.12,dist);col.rgb+=vec3(1.0,0.6,0.2)*ring*0.6;gl_FragColor=col;}`
        };
        const lensPass = new THREE.ShaderPass(LensShader);

        const VigShader = {
            uniforms: {
                tDiffuse: { value: null },
                uI: { value: 0.48 }
            },
            vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `uniform sampler2D tDiffuse;uniform float uI;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float d=length(vUv-.5)*1.5;float v=1.0-d*d*uI;c.rgb*=clamp(v,.0,1.);gl_FragColor=c;}`
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

        (function() {
            const starVS = `attribute float aR,aFlicker;uniform float uT;varying float vR;varying vec3 vC;void main(){vC=color;float tw=0.5+0.5*sin(uT*0.8+aR*88.0+aFlicker*7.0)*sin(uT*1.3+aFlicker*3.0);vec4 vp=viewMatrix*modelMatrix*vec4(position,1.0);gl_Position=projectionMatrix*vp;gl_PointSize=(9.0/-vp.z)*(0.25+aR*0.95)*tw;}`;
            const starFS = `varying vec3 vC;void main(){float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.5);gl_FragColor=vec4(vC,s*.88);}`;
            const OBAFGKM = [
                [0.6, 0.7, 1.0],
                [0.7, 0.8, 1.0],
                [1.0, 1.0, 1.0],
                [1.0, 1.0, 0.8],
                [1.0, 0.9, 0.6],
                [1.0, 0.7, 0.4],
                [1.0, 0.4, 0.2]
            ];

            function mkLayer(N, spread, minS, maxS, colA, colB) {
                const g = new THREE.BufferGeometry(),
                    p = new Float32Array(N * 3),
                    r = new Float32Array(N),
                    fl = new Float32Array(N),
                    c = new Float32Array(N * 3);
                for (let i = 0; i < N; i++) {
                    p[i * 3] = (Math.random() - .5) * spread;
                    p[i * 3 + 1] = (Math.random() - .5) * spread;
                    p[i * 3 + 2] = (Math.random() - .5) * spread;
                    r[i] = Math.random();
                    fl[i] = Math.random();
                    const t = Math.random();
                    c[i * 3] = colA[0] * (1 - t) + colB[0] * t;
                    c[i * 3 + 1] = colA[1] * (1 - t) + colB[1] * t;
                    c[i * 3 + 2] = colA[2] * (1 - t) + colB[2] * t;
                }
                g.setAttribute('position', new THREE.BufferAttribute(p, 3));
                g.setAttribute('aR', new THREE.BufferAttribute(r, 1));
                g.setAttribute('aFlicker', new THREE.BufferAttribute(fl, 1));
                g.setAttribute('color', new THREE.BufferAttribute(c, 3));
                return g;
            }
            const mkMat = u => new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
                uniforms: u,
                vertexShader: starVS,
                fragmentShader: starFS
            });
            scene.add(new THREE.Points(mkLayer(6000, 1800, .2, .8, OBAFGKM[0], OBAFGKM[2]), mkMat({ uT: { value: 0 } })));
            scene.add(new THREE.Points(mkLayer(3000, 1400, .25, .7, OBAFGKM[3], OBAFGKM[4]), mkMat({ uT: { value: 0 } })));
            bgMat = mkMat({ uT: { value: 0 } });
            scene.add(new THREE.Points(mkLayer(1800, 800, .35, 1.1, OBAFGKM[5], OBAFGKM[6]), bgMat));
        })();

        (function() {
            const ARMS = 4, N = 80000;
            const geom = new THREE.BufferGeometry(),
                pos = new Float32Array(N * 3),
                col = new Float32Array(N * 3),
                aR = new Float32Array(N);
            for (let i = 0; i < N; i++) {
                const i3 = i * 3, rng = Math.random(),
                    r = Math.pow(rng, 1.5) * 72 + (rng < .12 ? 0 : 2);
                const armAng = (Math.floor(Math.random() * ARMS) / ARMS) * Math.PI * 2;
                const spiral = r * .52 + armAng, spread = Math.pow(Math.random(), 1.8) * Math.max(0, (72 - r) * .18);
                pos[i3] = Math.cos(spiral) * r + (Math.random() - .5) * spread;
                pos[i3 + 1] = (Math.random() - .5) * (r < 10 ? 3 : r < 25 ? 1 : .5);
                pos[i3 + 2] = Math.sin(spiral) * r + (Math.random() - .5) * spread;
                if (r < 8) { col[i3] = 1.0; col[i3+1] = 0.95; col[i3+2] = 0.85; }
                else if (r < 25) { const t=(r-8)/17; col[i3]=1.0-t*0.6; col[i3+1]=0.95-t*0.25; col[i3+2]=0.85+t*0.15; }
                else { const t=(r-25)/47; col[i3]=0.4-t*0.3; col[i3+1]=0.7-t*0.3; col[i3+2]=1.0; }
                aR[i3] = Math.random();
            }
            geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
            geom.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
            galMat = new THREE.ShaderMaterial({
                depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, transparent: true,
                uniforms: { uT: { value: 0 } },
                vertexShader: `attribute float aR;uniform float uT;varying vec3 vC;void main(){vC=color;float dist=length(position.xz);float omega=0.072/(dist*0.052+0.6);float ang=atan(position.z,position.x)+uT*omega;vec3 p=vec3(cos(ang)*dist,position.y,sin(ang)*dist);vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);gl_Position=projectionMatrix*vp;float tw=0.62+0.38*sin(uT*0.85+aR*52.0);gl_PointSize=(20.0/-vp.z)*(0.16+aR*0.48)*tw;}`,
                fragmentShader: `varying vec3 vC;void main(){float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),3.0);gl_FragColor=vec4(vC*s,s*.65);}`
            });
            const gal = new THREE.Points(geom, galMat);
            gal.rotation.x = 1.12; gal.rotation.z = .1;
            scene.add(gal);

            const ND = 15000, dg = new THREE.BufferGeometry(),
                dp = new Float32Array(ND * 3), dc = new Float32Array(ND * 3);
            for (let i = 0; i < ND; i++) {
                const i3 = i * 3, r = 10 + Math.random() * 55,
                    armAng = (Math.floor(Math.random() * ARMS) + .5) / ARMS * Math.PI * 2 + Math.PI * .15;
                const spiral = r * .52 + armAng, spread = Math.random() * (r * .18);
                dp[i3] = Math.cos(spiral) * r + (Math.random() - .5) * spread;
                dp[i3 + 1] = (Math.random() - .5) * .4;
                dp[i3 + 2] = Math.sin(spiral) * r + (Math.random() - .5) * spread;
                dc[i3] = 0.04; dc[i3+1] = 0.015; dc[i3+2] = 0.01;
            }
            dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
            dg.setAttribute('color', new THREE.BufferAttribute(dc, 3));
            galDustMat = new THREE.ShaderMaterial({
                depthWrite: false, blending: THREE.NormalBlending, vertexColors: true, transparent: true,
                uniforms: { uT: { value: 0 } },
                vertexShader: `uniform float uT;varying vec3 vC;void main(){vC=color;float dist=length(position.xz);float omega=0.058/(dist*0.048+0.6);float ang=atan(position.z,position.x)+uT*omega;vec3 p=vec3(cos(ang)*dist,position.y,sin(ang)*dist);vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);gl_Position=projectionMatrix*vp;gl_PointSize=(45.0/-vp.z)*(0.55+0.45*fract(sin(dist*17.3)*43758.5));}`,
                fragmentShader: `varying vec3 vC;void main(){float s=1.0-smoothstep(0.2,.5,distance(gl_PointCoord,vec2(.5)));gl_FragColor=vec4(vC,s*.55);}`
            });
            const dust = new THREE.Points(dg, galDustMat);
            dust.rotation.x = 1.12; dust.rotation.z = .1;
            scene.add(dust);
        })();

        (function() {
            scene.add(new THREE.Mesh(new THREE.SphereGeometry(2.2, 40, 40), new THREE.MeshBasicMaterial({ color: 0x000000 })));
            [[2.25,0.06,0xffffff,0.9],[2.45,0.05,0xffa040,0.7],[2.7,0.04,0x883000,0.5]].forEach(([r,t,c,o]) => {
                const rm = new THREE.Mesh(new THREE.TorusGeometry(r,t,12,180), new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:o }));
                rm.rotation.x = Math.PI/2; scene.add(rm);
            });
            const NA = 24000, ag = new THREE.BufferGeometry(),
                ap = new Float32Array(NA*3), ac = new Float32Array(NA*3),
                aAng = new Float32Array(NA), aRad = new Float32Array(NA);
            for (let i = 0; i < NA; i++) {
                const i3=i*3, r=2.6+Math.pow(Math.random(),.5)*11, a=Math.random()*Math.PI*2;
                aAng[i]=a; aRad[i]=r;
                ap[i3]=Math.cos(a)*r; ap[i3+1]=(Math.random()-.5)*.1*(1/(r*.15+.9)); ap[i3+2]=Math.sin(a)*r;
                const tt=Math.pow((r-2.6)/11,0.6);
                ac[i3]=1.0; ac[i3+1]=Math.max(0,0.85-tt*0.8); ac[i3+2]=Math.max(0,0.5-tt*1.5);
            }
            ag.setAttribute('position', new THREE.BufferAttribute(ap,3));
            ag.setAttribute('color', new THREE.BufferAttribute(ac,3));
            ag.setAttribute('aAng', new THREE.BufferAttribute(aAng,1));
            ag.setAttribute('aRad', new THREE.BufferAttribute(aRad,1));
            diskMat = new THREE.ShaderMaterial({
                depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true, transparent:true,
                uniforms:{ uT:{ value:0 } },
                vertexShader:`attribute float aAng,aRad;uniform float uT;varying vec3 vC;varying float vBright;void main(){vC=color;float omega=0.72/sqrt(aRad*aRad*aRad*0.012+aRad);float ang=aAng+uT*omega;vec3 p=vec3(cos(ang)*aRad,position.y,sin(ang)*aRad);vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);gl_Position=projectionMatrix*vp;float szFac=1.0-(aRad-2.6)/11.0;gl_PointSize=(12.0/-vp.z)*(0.15+szFac*.5);vBright=szFac;}`,
                fragmentShader:`varying vec3 vC;varying float vBright;void main(){float s=pow(1.0-distance(gl_PointCoord,vec2(.5)),2.2);gl_FragColor=vec4(vC*s,s*(.5+vBright*.45));}`
            });
            scene.add(new THREE.Points(ag, diskMat));

            const NJ=2000, jg=new THREE.BufferGeometry(), jp=new Float32Array(NJ*3), jc=new Float32Array(NJ*3);
            for (let i=0;i<NJ;i++){
                const i3=i*3, h=(Math.random()-.5)*30, r=Math.abs(h)*.035*(Math.random()*.8+.2), a=Math.random()*Math.PI*2;
                jp[i3]=Math.cos(a)*r; jp[i3+1]=h; jp[i3+2]=Math.sin(a)*r;
                const tl=Math.abs(h)/15; jc[i3]=1.0; jc[i3+1]=0.6-tl*0.5; jc[i3+2]=0.2-tl*0.5;
            }
            jg.setAttribute('position', new THREE.BufferAttribute(jp,3));
            jg.setAttribute('color', new THREE.BufferAttribute(jc,3));
            scene.add(new THREE.Points(jg, new THREE.PointsMaterial({ vertexColors:true, size:.12, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:.4 })));
        })();

        /* ═══════════════════════════════════════════════════════════════
           5. SISTEMAS DE CATEGORIAS & PLANETAS
        ═══════════════════════════════════════════════════════════════ */
        function mkGlow(hex, sz) {
            const { r, g, b } = hexToRgb(hex), cv = document.createElement('canvas');
            cv.width = cv.height = 128;
            const cx = cv.getContext('2d'), gr = cx.createRadialGradient(64,64,0,64,64,64);
            gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
            gr.addColorStop(.18, `rgba(${r},${g},${b},.55)`);
            gr.addColorStop(.5, `rgba(${r},${g},${b},.1)`);
            gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
            cx.fillStyle = gr; cx.fillRect(0,0,128,128);
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(cv), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false }));
            sp.scale.set(sz,sz,1);
            return sp;
        }

        const PLANET_TYPES = ['rocky','gaseous','icy','volcanic','oceanic','desert','crystal','nebular'];
        function getPlanetType(n) {
            let h=0; for(const c of (n||'')) h=((h<<5)-h)+c.charCodeAt(0);
            return PLANET_TYPES[Math.abs(h)%PLANET_TYPES.length];
        }

        function makePlanetTexture(pcol, catName, sz) {
            const cv = document.createElement('canvas'); cv.width=cv.height=sz;
            const ctx=cv.getContext('2d'), {r,g,b}=hexToRgb(pcol), type=getPlanetType(catName);
            let seed=0; for(const c of (catName||'')) seed=((seed<<5)-seed)+c.charCodeAt(0);
            const rnd=(()=>{ let s=Math.abs(seed); return ()=>{ s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; }; })();
            if(type==='gaseous'||type==='nebular'){
                const bg=ctx.createLinearGradient(0,0,0,sz);
                bg.addColorStop(0,`rgb(${r},${Math.round(g*.7)},${Math.round(b*.4)})`);
                bg.addColorStop(.3,`rgb(${Math.round(r*.8)},${g},${Math.round(b*.6)})`);
                bg.addColorStop(.5,`rgb(${Math.round(r*.6)},${Math.round(g*.8)},${b})`);
                bg.addColorStop(1,`rgb(${Math.round(r*.7)},${Math.round(g*.6)},${Math.round(b*.4)})`);
                ctx.fillStyle=bg; ctx.fillRect(0,0,sz,sz);
                for(let i=0;i<8;i++){ ctx.fillStyle=`rgba(255,255,255,${.08+rnd()*.12})`; ctx.fillRect(0,rnd()*sz,sz,2+rnd()*sz*.08); }
            } else if(type==='rocky'||type==='desert'){
                const bg=ctx.createRadialGradient(sz*.4,sz*.4,0,sz*.5,sz*.5,sz*.7);
                bg.addColorStop(0,`rgb(${Math.min(r+30,255)},${Math.min(g+20,255)},${Math.min(b+10,255)})`);
                bg.addColorStop(.6,`rgb(${r},${g},${b})`);
                bg.addColorStop(1,`rgb(${Math.round(r*.6)},${Math.round(g*.5)},${Math.round(b*.4)})`);
                ctx.fillStyle=bg; ctx.fillRect(0,0,sz,sz);
                for(let i=0;i<12;i++){
                    const cx=rnd()*sz, cy=rnd()*sz, cr=2+rnd()*sz*.08;
                    ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2);
                    ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1; ctx.stroke();
                }
            } else {
                ctx.fillStyle=`rgb(${r},${g},${b})`; ctx.fillRect(0,0,sz,sz);
                for(let i=0;i<10;i++){
                    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.beginPath();
                    ctx.arc(rnd()*sz,rnd()*sz,rnd()*sz*.2,0,Math.PI*2); ctx.fill();
                }
            }
            const atm=ctx.createRadialGradient(sz*.5,sz*.5,sz*.3,sz*.5,sz*.5,sz*.5);
            atm.addColorStop(0,'rgba(0,0,0,0)');
            atm.addColorStop(1,`rgba(${Math.min(r+40,255)},${Math.min(g+30,255)},${Math.min(b+20,255)},.15)`);
            ctx.fillStyle=atm; ctx.fillRect(0,0,sz,sz);
            return cv;
        }

        const catMap = new Map();
        const catStars = [];
        const uniqCats = [...new Set(LIVROS.map(l => l.categoria_nome).filter(Boolean))];
        const sysList = document.getElementById('systems-menu');

        uniqCats.forEach((name, idx) => {
            const btn = document.createElement('div');
            btn.className = 'sys-item'; btn.dataset.c = name;
            btn.innerHTML = `<div class="sys-dot" style="color:${catHexStr(name)}"></div>${name}`;
            sysList.appendChild(btn);

            const t=(idx+.5)/uniqCats.length, br=idx%4,
                ang=(br/4)*Math.PI*2+t*Math.PI*6.2, rad=14+t*46;
            const x=Math.cos(ang)*rad+(Math.random()-.5)*3, y=(Math.random()-.5)*5, z=Math.sin(ang)*rad+(Math.random()-.5)*3;
            const col=catColor(name);
            const star=new THREE.Mesh(new THREE.SphereGeometry(.7,24,24), new THREE.MeshBasicMaterial({ color:col }));
            star.position.set(x,y,z); star.userData={ isCategory:true, name };
            scene.add(star); catStars.push(star);
            const glow=mkGlow(col,16), glow2=mkGlow(col,36), neb=mkGlow(col,72);
            glow.position.set(x,y,z); glow.material.opacity=.9;
            glow2.position.set(x,y,z); glow2.material.opacity=.24;
            neb.position.set(x,y,z); neb.material.opacity=.065;
            scene.add(glow); scene.add(glow2); scene.add(neb);
            catMap.set(name, { name, col, star, glow, glow2, neb, pos:new THREE.Vector3(x,y,z), books:[] });
        });

        const MAX_CONST=200, constPos=new Float32Array(MAX_CONST*6), constGeom=new THREE.BufferGeometry();
        constGeom.setAttribute('position', new THREE.BufferAttribute(constPos,3));
        constGeom.setDrawRange(0,0);
        const constLines=new THREE.LineSegments(constGeom, new THREE.LineBasicMaterial({ color:0x2AA2F6, transparent:true, opacity:.1, depthWrite:false, blending:THREE.AdditiveBlending }));
        scene.add(constLines);

        function updateConstellations() {
            if(activeFilter==='all'){ constGeom.setDrawRange(0,0); return; }
            const cd=catMap.get(activeFilter); if(!cd) return;
            let i=0;
            cd.books.forEach(b=>{
                if(!b.filtered||!b.searched||i>=MAX_CONST) return;
                const cp=cd.pos;
                constPos[i*6]=cp.x; constPos[i*6+1]=cp.y; constPos[i*6+2]=cp.z;
                constPos[i*6+3]=b._px||cp.x; constPos[i*6+4]=b._py||cp.y; constPos[i*6+5]=b._pz||cp.z;
                i++;
            });
            constGeom.attributes.position.needsUpdate=true;
            constGeom.setDrawRange(0,i*2);
        }

        const bookObjs=[], planetGroup=new THREE.Group();
        scene.add(planetGroup);
        const planetMeshes=[];
        LIVROS.forEach((livro,idx)=>{
            const cd=catMap.get(livro.categoria_nome); if(!cd) return;
            const oIdx=cd.books.length, oRad=3.4+(oIdx%8)*.88+Math.random()*.5,
                oSpd=(.12+Math.random()*.28)*(Math.random()>.5?1:-1),
                oAng=(idx*2.399)%(Math.PI*2);
            const tiltX=(Math.random()-.5)*Math.PI*.5, tiltZ=(Math.random()-.5)*Math.PI*.25, sz=.16+Math.random()*.13;
            const st=(livro.status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
            let pcol=st.includes('disp')?0x00F0FF:st.includes('empr')?0xFF3366:st.includes('res')?0xA960EE:0x5555AA;
            const tex=new THREE.CanvasTexture(makePlanetTexture(pcol, livro.categoria_nome, 64));
            const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,20,20), new THREE.MeshBasicMaterial({ map:tex }));
            mesh.userData.bookIdx=idx; planetGroup.add(mesh);
            const glow=mkGlow(pcol,sz*20); glow.material.opacity=.65; scene.add(glow);
            const OP=120, oPts=[];
            for(let i=0;i<=OP;i++){
                const a=(i/OP)*Math.PI*2;
                oPts.push(Math.cos(a)*oRad*Math.cos(tiltX), Math.sin(a)*oRad*Math.sin(tiltZ)*.38, Math.sin(a)*oRad*Math.cos(tiltX));
            }
            const oGeom=new THREE.BufferGeometry();
            oGeom.setAttribute('position', new THREE.Float32BufferAttribute(oPts,3));
            const oLine=new THREE.LineLoop(oGeom, new THREE.LineBasicMaterial({ color:pcol, transparent:true, opacity:.1, depthWrite:false }));
            oLine.position.copy(cd.pos); scene.add(oLine);
            const obj={ data:livro, cd, glow, orbitLine:oLine, mesh, tex, oRad, oSpd, oAng, tiltX, tiltZ, sz, pcol, idx, filtered:true, searched:true, currentScale:1, isHovered:false, _px:cd.pos.x, _py:cd.pos.y, _pz:cd.pos.z, _spinY:0 };
            cd.books.push(obj); bookObjs.push(obj); planetMeshes.push(mesh);
        });

        /* ═══════════════════════════════════════════════════════════════
           6. ESTADO, CURSOR & EVENTOS KEYBOARD (UX)
        ═══════════════════════════════════════════════════════════════ */
        let mX=0, mY=0, activeView='gal', activeFilter='all', queryStr='', searchDebounce=null;
        const ray=new THREE.Raycaster(); ray.params.Points={ threshold:.8 };
        const mVec=new THREE.Vector2();
        const retEl=document.getElementById('reticle'), retDot=document.getElementById('reticle-dot'), tipEl=document.getElementById('tip');
        let retX=window.innerWidth/2, retY=window.innerHeight/2, dotX=retX, dotY=retY, tgtX=retX, tgtY=retY, isMag=false, HOVER=null, selBook=null, HOVER_CAT=null;

        document.addEventListener('mousemove', e=>{
            tgtX=e.clientX; tgtY=e.clientY;
            mX=(e.clientX/innerWidth-.5)*2; mY=(e.clientY/innerHeight-.5)*2;
            tipEl.style.left=(e.clientX+20)+'px'; tipEl.style.top=(e.clientY-10)+'px';
            if(activeView==='gal'&&activeFilter==='all'){ cam.tx=mX*12; cam.ty=18-mY*7; }
            if(activeView==='gal') handleRaycast(e);
            const els=document.querySelectorAll('.nav-item, .sys-item, .hud-btn, .btn-prim, .btn-sec, .view-tog button, .bp-close, .md-close, .ed-hero-btn, .ed-book-card');
            let closest=null, closestDist=50;
            els.forEach(el=>{
                if(!el.offsetParent) return;
                const r=el.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2, d=Math.hypot(e.clientX-cx,e.clientY-cy);
                if(d<closestDist){ closestDist=d; closest={ x:cx, y:cy }; isMag=true; }
            });
            if(!closest) isMag=false;
        });

        (function animCursor(){
            const eas=isMag?.4:.35;
            retX+=(tgtX-retX)*eas; retY+=(tgtY-retY)*eas;
            dotX+=(tgtX-dotX)*.65; dotY+=(tgtY-dotY)*.65;
            retEl.style.transform=`translate3d(${retX}px, ${retY}px, 0) translate(-50%, -50%)`;
            retDot.style.transform=`translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(animCursor);
        })();

        document.addEventListener('mousedown',()=>retEl.classList.add('click'));
        document.addEventListener('mouseup',()=>retEl.classList.remove('click'));

        const sysBtn=document.getElementById('btn-systems'), sysMenu=document.getElementById('systems-menu');
        sysBtn.addEventListener('click',e=>{ e.stopPropagation(); sysMenu.classList.toggle('open'); sysBtn.classList.toggle('active'); });
        document.addEventListener('click',e=>{ if(!sysMenu.contains(e.target)&&!sysBtn.contains(e.target)){ sysMenu.classList.remove('open'); sysBtn.classList.remove('active'); } });

        document.addEventListener('keydown',e=>{
            if(e.key==='Escape'){
                if(document.getElementById('modal-overlay').classList.contains('open')){ document.getElementById('modal-overlay').classList.remove('open'); }
                else if(document.getElementById('book-panel').classList.contains('open')){ hidePanel(); }
                else if(activeFilter!=='all'){ flyToCat('all'); }
            }
        });

        /* ═══════════════════════════════════════════════════════════════
           7. INTERAÇÕES & UI
        ═══════════════════════════════════════════════════════════════ */
        function handleRaycast(e) {
            mVec.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
            ray.setFromCamera(mVec, camera);
            if(HOVER){ HOVER.isHovered=false; HOVER=null; }
            HOVER_CAT=null;
            const catHits=ray.intersectObjects(catStars), bookHits=ray.intersectObjects(planetMeshes);
            if(bookHits.length&&(!catHits.length||bookHits[0].distance<catHits[0].distance)){
                const bo=bookObjs.find(b=>b.idx===bookHits[0].object.userData.bookIdx);
                if(bo&&bo.filtered&&bo.searched){
                    HOVER=bo; bo.isHovered=true; showPanel(bo);
                    document.getElementById('tip-cat').textContent=bo.data.categoria_nome||'';
                    document.getElementById('tip-title').textContent=bo.data.titulo||'';
                    document.getElementById('tip-author').textContent=bo.data.autor_nome||'';
                    tipEl.classList.add('show'); retEl.classList.add('hover'); return;
                }
            } else if(catHits.length){
                const name=catHits[0].object.userData.name, cd=catMap.get(name);
                if(cd){
                    HOVER_CAT=name; hidePanel();
                    document.getElementById('tip-cat').textContent='Sistema';
                    document.getElementById('tip-title').textContent=name;
                    document.getElementById('tip-author').textContent=cd.books.length+' obras';
                    tipEl.classList.add('show'); retEl.classList.add('hover'); return;
                }
            }
            if(selBook) hidePanel();
            tipEl.classList.remove('show'); retEl.classList.remove('hover');
        }

        renderer.domElement.addEventListener('click',()=>{
            if(HOVER) openModal(HOVER.data);
            else if(HOVER_CAT) flyToCat(HOVER_CAT);
            else hidePanel();
        });

        function showPanel(bo) {
            const d=bo.data; selBook=bo;
            const c=document.getElementById('bp-art-canvas');
            c.width=c.parentElement.clientWidth; c.height=180;
            // ── USA CAPA REAL SE DISPONÍVEL ──────────────────────────
            drawBookArtWithCover(c, d.titulo, d.categoria_nome, c.width, 180, d.capa);
            // ─────────────────────────────────────────────────────────
            document.getElementById('bp-cat').textContent=d.categoria_nome||'—';
            document.getElementById('bp-title').textContent=d.titulo||'—';
            document.getElementById('bp-author').textContent=d.autor_nome||'—';
            document.getElementById('bp-year').textContent=d.ano_publicacao||'—';
            document.getElementById('bp-pub').textContent=d.editora_nome||'—';
            const bsel=document.getElementById('bp-status');
            bsel.className='sbadge '+statusClass(d.status); bsel.textContent=d.status||'—';
            document.getElementById('book-panel').classList.add('open');
        }

        function hidePanel() {
            document.getElementById('book-panel').classList.remove('open'); selBook=null;
        }
        document.getElementById('bp-close').addEventListener('click', hidePanel);
        document.getElementById('bp-reserve').addEventListener('click',()=>{ if(selBook) openModal(selBook.data); });
        document.getElementById('bp-expand').addEventListener('click',()=>{ if(selBook) openModal(selBook.data); });

        function openModal(d) {
            const mc=document.getElementById('md-art-canvas');
            mc.width=mc.parentElement.clientWidth||720; mc.height=240;
            // ── USA CAPA REAL SE DISPONÍVEL ──────────────────────────
            drawBookArtWithCover(mc, d.titulo, d.categoria_nome, mc.width, 240, d.capa);
            // ─────────────────────────────────────────────────────────
            document.getElementById('md-cat-badge').textContent=d.categoria_nome||'—';
            document.getElementById('md-title').textContent=d.titulo||'—';
            document.getElementById('md-author').textContent=d.autor_nome||'—';
            document.getElementById('md-year').textContent=d.ano_publicacao||'—';
            document.getElementById('md-pub').textContent=d.editora_nome||'—';
            document.getElementById('md-catv').textContent=d.categoria_nome||'—';
            document.getElementById('md-sv').textContent=d.status||'—';
            const ms=document.getElementById('md-status');
            ms.className='sbadge '+statusClass(d.status); ms.textContent=d.status||'—';
            const rel=LIVROS.filter(l=>l.categoria_nome===d.categoria_nome&&l.titulo!==d.titulo).slice(0,4);
            document.getElementById('md-related').innerHTML=rel.length===0
                ?'<p style="font-size:.8rem;color:var(--text-dim);font-style:italic;">Nenhuma obra relacionada</p>'
                :rel.map(r=>`<div class="md-related-item" onclick="openModal(LIVROS[${LIVROS.indexOf(r)}])"><div class="md-related-dot" style="background:${catHexStr(r.categoria_nome)};box-shadow:0 0 8px ${catHexStr(r.categoria_nome)}88;"></div><div class="md-related-info"><strong>${r.titulo||'—'}</strong><span>${r.autor_nome||'—'}</span></div><span class="sbadge ${statusClass(r.status)}">${r.status||'—'}</span></div>`).join('');
            document.getElementById('modal-overlay').classList.add('open');
            document.querySelector('.md-scroll').scrollTop=0;
        }
        document.getElementById('modal-close').addEventListener('click',()=>document.getElementById('modal-overlay').classList.remove('open'));

        /* ═══════════════════════════════════════════════════════════════
           8. CONTROLES (NAVEGAÇÃO E RESET POR ZOOM)
        ═══════════════════════════════════════════════════════════════ */
        function flyToCat(name) {
            activeFilter=name;
            document.querySelectorAll('.sys-item').forEach(p=>p.classList.toggle('on',p.dataset.c===name));
            document.getElementById('sys-active-label').textContent=name==='all'?'Todas Constelações':name;
            bookObjs.forEach(b=>{
                b.filtered=(name==='all'||b.data.categoria_nome===name);
                if(!b.filtered){ b.currentScale=0; b.glow.material.opacity=0; b.orbitLine.material.opacity=0; b.mesh.visible=false; }
            });
            if(name!=='all'&&activeView==='gal'){
                const cd=catMap.get(name); if(!cd) return;
                const sp=cd.pos, dir=sp.clone().normalize();
                if(dir.length()<.01) dir.set(0,0,1);
                const cp=sp.clone().add(dir.clone().multiplyScalar(30));
                cp.y+=16; cp.x+=6; camTzTarget=cp.z;
                const lbl=document.getElementById('cat-label');
                lbl.textContent=name; gsap.to(lbl,{ opacity:1, duration:.4 });
                setTimeout(()=>gsap.to(lbl,{ opacity:0, duration:1.2 }),3000);
                gsap.to(cd.star.scale,{ x:2.5,y:2.5,z:2.5,duration:1.1,ease:'back.out(1.2)' });
                gsap.to(cd.glow.material,{ opacity:1,duration:.5 });
                gsap.to(camLookDst,{ x:sp.x,y:sp.y,z:sp.z,duration:3.2,ease:'power3.inOut' });
                gsap.to(camera,{ fov:36,duration:3.2,ease:'power3.inOut',onUpdate:()=>camera.updateProjectionMatrix() });
                gsap.to(cam,{ tx:cp.x,ty:cp.y,tz:cp.z,duration:3.2,ease:'power3.inOut',
                    onComplete:()=>{
                        let n=0;
                        bookObjs.forEach(b=>{
                            if(b.filtered&&b.searched){
                                b.mesh.visible=true; const d=n*.04; n++;
                                gsap.to(b,{ currentScale:1,duration:.9,ease:'back.out(1.3)',delay:d });
                                gsap.to(b.glow.material,{ opacity:.65,duration:.8,delay:d });
                                gsap.to(b.orbitLine.material,{ opacity:.18,duration:1.4,delay:d });
                            }
                        });
                    }
                });
            } else if(name==='all'&&activeView==='gal'){
                camTzTarget=96;
                gsap.to(cam,{ tx:0,ty:18,tz:96,duration:3.5,ease:'power3.inOut' });
                gsap.to(camLookDst,{ x:0,y:0,z:0,duration:3.5,ease:'power3.inOut' });
                gsap.to(camera,{ fov:48,duration:3.5,ease:'power3.inOut',onUpdate:()=>camera.updateProjectionMatrix() });
                catMap.forEach(cd=>gsap.to(cd.star.scale,{ x:1,y:1,z:1,duration:.7 }));
                bookObjs.forEach(b=>{
                    if(b.searched){
                        b.mesh.visible=true;
                        gsap.to(b,{ currentScale:1,duration:.7,ease:'back.out(1.5)' });
                        gsap.to(b.glow.material,{ opacity:.65,duration:.7 });
                        gsap.to(b.orbitLine.material,{ opacity:.1,duration:.7 });
                    }
                });
            }
            if(activeView==='ed') buildEditorial();
        }
        document.getElementById('systems-menu').addEventListener('click',e=>{
            const btn=e.target.closest('.sys-item');
            if(btn){ flyToCat(btn.dataset.c); sysMenu.classList.remove('open'); sysBtn.classList.remove('active'); }
        });

        document.getElementById('q').addEventListener('input',e=>{
            queryStr=e.target.value.toLowerCase().trim();
            clearTimeout(searchDebounce);
            searchDebounce=setTimeout(()=>doSearch(queryStr),260);
        });

        function doSearch(q) {
            const matches=[];
            bookObjs.forEach(b=>{
                const ok=!q||(b.data.titulo||'').toLowerCase().includes(q)||(b.data.autor_nome||'').toLowerCase().includes(q)||(b.data.categoria_nome||'').toLowerCase().includes(q);
                b.searched=ok;
                const vis=ok&&b.filtered;
                if(!vis){ b.currentScale=0; gsap.to(b.glow.material,{ opacity:0,duration:.25 }); b.orbitLine.material.opacity=0; b.mesh.visible=false; }
                else{ b.mesh.visible=true; gsap.to(b,{ currentScale:1,duration:.45,ease:'back.out(1.5)' }); gsap.to(b.glow.material,{ opacity:.65,duration:.35 }); if(q) matches.push(b); }
            });
            const cnt=bookObjs.filter(b=>b.searched&&b.filtered).length, cntEl=document.getElementById('search-count');
            if(q){ cntEl.textContent=cnt; cntEl.classList.add('show'); } else { cntEl.classList.remove('show'); }
            if(q&&matches.length&&activeView==='gal'){
                let cx=0,cy=0,cz=0;
                matches.forEach(b=>{ cx+=b._px||b.cd.pos.x; cy+=b._py||b.cd.pos.y; cz+=b._pz||b.cd.pos.z; });
                cx/=matches.length; cy/=matches.length; cz/=matches.length; camTzTarget=cz+28;
                const fl=document.getElementById('fly-label');
                fl.textContent=`${cnt} obra${cnt!==1?'s':''} encontrada${cnt!==1?'s':''}`;
                gsap.to(fl,{ opacity:1,duration:.3 }); setTimeout(()=>gsap.to(fl,{ opacity:0,duration:.7 }),2200);
                gsap.to(cam,{ tx:cx+10,ty:cy+8,tz:cz+28,duration:1.8,ease:'power3.inOut' });
                gsap.to(camLookDst,{ x:cx,y:cy,z:cz,duration:1.8,ease:'power3.inOut' });
            } else if(!q&&activeView==='gal'){
                camTzTarget=96;
                gsap.to(cam,{ tx:0,ty:18,tz:96,duration:2,ease:'power3.out' });
                gsap.to(camLookDst,{ x:0,y:0,z:0,duration:2,ease:'power3.out' });
            }
            if(activeView==='ed') buildEditorial();
        }

        let ecoMode=false;
        function setView(v) {
            if(ecoMode&&v==='gal') toggleEcoMode();
            activeView=v;
            document.getElementById('btn-gal').classList.toggle('on',v==='gal');
            document.getElementById('btn-ed').classList.toggle('on',v==='ed');
            document.getElementById('editorial-view').classList.toggle('open',v==='ed');
            document.getElementById('canvas-dim').classList.toggle('dimmed',v!=='gal');
            document.getElementById('depth').style.opacity=v==='gal'?'1':'0';
            document.getElementById('hud-bot').style.opacity=v==='gal'?'1':'0.3';
            if(v==='ed'){ buildEditorial(); hidePanel(); gsap.to(bloom,{ strength:.15,duration:.7 }); }
            else{ gsap.to(bloom,{ strength:1.1,duration:.7 }); }
        }
        function toggleEcoMode() {
            ecoMode=!ecoMode; const btn=document.getElementById('btn-eco');
            if(ecoMode){ btn.classList.add('eco-active'); btn.innerHTML='<i class="fa-solid fa-bolt"></i> Retomar 3D'; document.getElementById('webgl').style.opacity=0; setView('ed'); }
            else{ btn.classList.remove('eco-active'); btn.innerHTML='<i class="fa-solid fa-leaf"></i> Modo Eco'; document.getElementById('webgl').style.opacity=1; lastTime=performance.now(); setView('gal'); }
        }
        document.getElementById('btn-gal').addEventListener('click',()=>setView('gal'));
        document.getElementById('btn-ed').addEventListener('click',()=>setView('ed'));
        document.getElementById('btn-eco').addEventListener('click',toggleEcoMode);

        /* ═══════════════════════════════════════════════════════════════
           9. EDITORIAL VIEW BUILDER
        ═══════════════════════════════════════════════════════════════ */
        function buildEditorial() {
            const filtered=LIVROS.filter(l=>{
                const catOk=activeFilter==='all'||l.categoria_nome===activeFilter;
                const qOk=!queryStr||(l.titulo||'').toLowerCase().includes(queryStr)||(l.autor_nome||'').toLowerCase().includes(queryStr)||(l.categoria_nome||'').toLowerCase().includes(queryStr);
                return catOk&&qOk;
            });
            const avail=LIVROS.filter(l=>(l.status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes('disp')).length;
            document.getElementById('ed-avail').textContent=avail;
            if(filtered.length){
                const hero=filtered[0], hc=document.getElementById('ed-hero-canvas');
                hc.width=hc.parentElement.clientWidth||600; hc.height=hc.parentElement.clientHeight||400;
                // ── USA CAPA REAL NO HERO ────────────────────────────
                drawBookArtWithCover(hc, hero.titulo, hero.categoria_nome, hc.width, hc.height, hero.capa);
                // ─────────────────────────────────────────────────────
                document.getElementById('ed-hero-title').textContent=hero.titulo||'—';
                document.getElementById('ed-hero-author').textContent=hero.autor_nome||'—';
                document.getElementById('ed-hero-cat').textContent=hero.categoria_nome||'—';
                document.getElementById('ed-hero-year').textContent=hero.ano_publicacao||'—';
                const hs=document.getElementById('ed-hero-status');
                hs.className='sbadge '+statusClass(hero.status); hs.textContent=hero.status||'—';
                document.getElementById('ed-hero-btn').onclick=()=>openModal(hero);
            }
            buildEdSections(filtered,'all');
        }

        function buildEdSections(filtered, catFilter) {
            const secs=document.getElementById('ed-sections'), cats=catFilter==='all'?uniqCats:[catFilter];
            secs.innerHTML=cats.map(cat=>{
                const books=filtered.filter(l=>l.categoria_nome===cat);
                if(!books.length) return '';
                return `<div class="ed-section"><div class="ed-section-header"><h2 class="ed-section-title">${cat}</h2><span class="ed-section-count">${books.length} obras</span></div><div class="ed-scroll-wrapper">${books.map(b=>`<div class="ed-book-card" onclick="openModal(LIVROS[${LIVROS.indexOf(b)}])"><div class="ed-book-art"><canvas class="ed-card-canvas" data-title="${b.titulo||''}" data-cat="${b.categoria_nome||''}" data-capa="${b.capa||''}" width="220" height="300"></canvas></div><div class="ed-book-status"><span class="sbadge ${statusClass(b.status)}">${b.status||'—'}</span></div><div class="ed-book-info"><h4>${b.titulo||'—'}</h4><p>${b.autor_nome||'—'}</p></div></div>`).join('')}</div></div>`;
            }).join('');
            // ── USA CAPA REAL NOS CARDS EDITORIAIS ──────────────────
            setTimeout(()=>document.querySelectorAll('.ed-card-canvas').forEach(c=>{
                const livro=LIVROS.find(l=>l.titulo===c.dataset.title);
                drawBookArtWithCover(c, c.dataset.title, c.dataset.cat, 220, 300, livro?.capa);
            }), 10);
            // ─────────────────────────────────────────────────────────
        }

        window.addEventListener('wheel',e=>{
            if(activeView!=='gal') return;
            camTzTarget=Math.max(5,Math.min(125,camTzTarget+e.deltaY*0.05));
            if(camTzTarget>118&&activeFilter!=='all') flyToCat('all');
            document.getElementById('ddot').style.top=((1-(cam.tz-5)/(125-5))*100)+'%';
        },{ passive:true });

        window.addEventListener('resize',()=>{
            camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
            renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
            if(activeView==='ed') buildEditorial();
        });

        /* ═══════════════════════════════════════════════════════════════
           10. RENDER LOOP
        ═══════════════════════════════════════════════════════════════ */
        const clock=new THREE.Clock(), bhNDC=new THREE.Vector3();
        let lastTime=0;
        (function animate(now){
            requestAnimationFrame(animate);
            if(ecoMode) return;
            const dt=Math.min(.05,(now-lastTime)/1000); lastTime=now;
            const t=clock.getElapsedTime();
            if(bgMat) bgMat.uniforms.uT.value=t;
            if(galMat) galMat.uniforms.uT.value=t;
            if(galDustMat) galDustMat.uniforms.uT.value=t;
            if(diskMat) diskMat.uniforms.uT.value=t;
            cam.tz+=(camTzTarget-cam.tz)*0.08;
            camera.position.x+=(cam.tx-camera.position.x)*.016;
            camera.position.y+=(cam.ty-camera.position.y)*.016;
            camera.position.z+=(cam.tz-camera.position.z)*.02;
            camLook.x+=(camLookDst.x-camLook.x)*.018;
            camLook.y+=(camLookDst.y-camLook.y)*.018;
            camLook.z+=(camLookDst.z-camLook.z)*.018;
            camera.lookAt(camLook.x,camLook.y,camLook.z);
            bhNDC.set(0,0,0).project(camera);
            lensPass.uniforms.uBHPos.value.set((bhNDC.x+1)/2,(bhNDC.y+1)/2);
            const bhDist=camera.position.length();
            lensPass.uniforms.uBHR.value=Math.min(.07,4.5/bhDist);
            lensPass.uniforms.uStr.value=Math.min(.025,2.2/bhDist);
            bookObjs.forEach(b=>{
                b.oAng+=b.oSpd*.005;
                const px=b.cd.pos.x+Math.cos(b.oAng)*b.oRad*Math.cos(b.tiltX),
                    py=b.cd.pos.y+Math.sin(b.oAng)*b.oRad*Math.sin(b.tiltZ)*.38,
                    pz=b.cd.pos.z+Math.sin(b.oAng)*b.oRad*Math.cos(b.tiltX);
                b._px=px; b._py=py; b._pz=pz;
                if(b.filtered&&b.searched){
                    const fs=b.sz*b.currentScale;
                    b.mesh.position.set(px,py,pz); b.mesh.scale.setScalar(fs);
                    b._spinY=(b._spinY||0)+.008*(b.isHovered?4:1);
                    b.mesh.rotation.y=b._spinY; b.mesh.visible=b.currentScale>.02;
                } else { b.mesh.visible=false; }
                if(b.glow.visible){
                    b.glow.position.set(px,py,pz);
                    b.glow.material.opacity+=(b.isHovered?1.2:(b.currentScale>.02?.6:0)-b.glow.material.opacity)*.1;
                }
            });
            catMap.forEach(cd=>{
                const p=.68+.32*Math.sin(t*1.2+cd.pos.x*.09);
                cd.glow.material.opacity=p*.88; cd.glow2.material.opacity=p*.22;
                cd.neb.material.opacity=.058+.025*Math.sin(t*.55+cd.pos.z*.07);
                cd.star.rotation.y=t*.2; cd.star.scale.setScalar(.95+.05*Math.sin(t*2+cd.pos.x*.15));
            });
            updateConstellations();
            bloom.strength=1.1+.55*(1-((cam.tz-5)/(125-5)));
            composer.render();
        })();

        camera.position.set(0,55,220);
        gsap.to(camera.position,{ y:22,z:96,duration:3.5,ease:'power3.out',delay:INTRO_DUR-.5 });
        gsap.from('#hud',{ opacity:0,y:-20,duration:1.4,ease:'power3.out',delay:INTRO_DUR+.2 });
        gsap.from('#nav',{ opacity:0,x:-30,duration:1.4,ease:'power3.out',delay:INTRO_DUR });
        gsap.from('#hud-bot, #depth',{ opacity:0,duration:1.4,ease:'power3.out',delay:INTRO_DUR+.5 });
        gsap.from('#scroll-hint',{ opacity:0,duration:1,delay:INTRO_DUR+1.2,onComplete:()=>gsap.to('#scroll-hint',{ opacity:0,delay:4,duration:1.6 }) });