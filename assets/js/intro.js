// ═══════════════════════════════════════════════
// 1. MOTOR DE RENDERIZAÇÃO & PÓS-PROCESSAMENTO VFX
// ═══════════════════════════════════════════════
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000205, 0.0015);

const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  0.1,
  4000,
);
camera.position.set(0, 45, 120);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4; // Exposição cinematográfica alta
document.getElementById("webgl-container").appendChild(renderer.domElement);

const renderPass = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  2.0,
  0.3,
  0.85,
);
bloomPass.threshold = 0.05;
bloomPass.strength = 1.8; // Glow intenso para o buraco negro
bloomPass.radius = 1.2;

const ChromaShader = {
  uniforms: { tDiffuse: { value: null }, uStrength: { value: 0.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uStrength; varying vec2 vUv; void main(){ vec2 c=vUv-0.5; float d=length(c); vec2 off=c*d*uStrength; float r=texture2D(tDiffuse,vUv-off*1.5).r; float g=texture2D(tDiffuse,vUv).g; float b=texture2D(tDiffuse,vUv+off).b; gl_FragColor=vec4(r,g,b,1.0); }`,
};
const chromaticPass = new THREE.ShaderPass(ChromaShader);

// Shader de distorção gravitacional (Warp/Lens)
const WarpShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAmount: { value: 0.0 },
    uTime: { value: 0.0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmount, uTime; varying vec2 vUv; void main(){ vec2 center = vec2(0.5); vec2 delta = vUv - center; float dist = length(delta); float warp = uAmount * pow(dist, 2.2); vec4 col = vec4(0.0); float total = 0.0; for(int i=0; i<12; i++){ float t = float(i) / 11.0; float sc = 1.0 - warp * t; vec2 uv = center + delta * sc; uv = clamp(uv, 0.001, 0.999); col += texture2D(tDiffuse, uv) * (1.0 - t * 0.5); total += (1.0 - t * 0.5); } gl_FragColor = col / total; }`,
};
const warpPass = new THREE.ShaderPass(WarpShader);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(warpPass);
composer.addPass(chromaticPass);

// ═══════════════════════════════════════════════
// 2. TÚNEL INTERDIMENSIONAL (Partículas Esticadas/Streak)
// ═══════════════════════════════════════════════
const tunnelCount = 15000;
const tunnelGeom = new THREE.BufferGeometry();
const tPos = new Float32Array(tunnelCount * 3);
const tColors = new Float32Array(tunnelCount * 3);
const tRand = new Float32Array(tunnelCount);

for (let i = 0; i < tunnelCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 10 + Math.random() * 180;
  tPos[i * 3] = Math.cos(angle) * radius;
  tPos[i * 3 + 1] = Math.sin(angle) * radius;
  tPos[i * 3 + 2] = -Math.random() * 4000; // Profundidade absurda

  const mixCol = Math.random();
  const c = new THREE.Color(0x1144ff).lerp(
    new THREE.Color(mixCol > 0.6 ? 0xff33aa : 0xffee55),
    Math.random(),
  );
  tColors[i * 3] = c.r;
  tColors[i * 3 + 1] = c.g;
  tColors[i * 3 + 2] = c.b;
  tRand[i] = Math.random();
}
tunnelGeom.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
tunnelGeom.setAttribute("color", new THREE.BufferAttribute(tColors, 3));
tunnelGeom.setAttribute("aRand", new THREE.BufferAttribute(tRand, 1));

// Shader Customizado: Estica a partícula com base na velocidade de dobra
const tunnelMat = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexColors: true,
  uniforms: { uSpeed: { value: 0.0 }, uOpacity: { value: 0.0 } },
  vertexShader: `
    attribute float aRand; varying vec3 vColor; varying float vAlpha; uniform float uSpeed;
    void main() {
      vColor = color;
      vec3 p = position;
      // Estica em Z baseado na velocidade
      p.z += uSpeed * 2.0 * aRand; 
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = (150.0 / -mvPosition.z) * (1.0 + uSpeed * 0.1); // Aumenta o tamanho com a velocidade
      vAlpha = smoothstep(50.0, -100.0, p.z); // Fade no fim do túnel
    }
  `,
  fragmentShader: `
    varying vec3 vColor; varying float vAlpha; uniform float uOpacity; uniform float uSpeed;
    void main() {
      // Cria o formato de "agulha/streak"
      vec2 c = gl_PointCoord - 0.5;
      float streak = exp(-abs(c.x) * 10.0) * exp(-abs(c.y) * 2.0);
      float alpha = streak * vAlpha * uOpacity;
      gl_FragColor = vec4(vColor * alpha * 2.0, alpha);
    }
  `,
});
const dimensionTunnel = new THREE.Points(tunnelGeom, tunnelMat);
dimensionTunnel.visible = false;
scene.add(dimensionTunnel);

// ═══════════════════════════════════════════════
// 3. O CORPO CELESTIAL (A LUA) - VISUAL FANTASIA SOMBRIA
// ═══════════════════════════════════════════════
const moonSystem = new THREE.Group();
moonSystem.visible = false;
scene.add(moonSystem);

const celestialGeom = new THREE.SphereGeometry(4.0, 256, 256);

// Shader Refinado com Efeito Mineral/Obsidiana e Rim Light Cinematográfico
const celestialShader = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uProgress: { value: 0.0 },
    uMorph: { value: 0.0 },
    uLightAngle: { value: -2.0 },
  },
  vertexShader: `
    varying vec2 vUv; varying vec3 vN, vPos, vViewPosition; 
    void main(){ 
        vUv = uv; 
        vN = normalize(normalMatrix * normal); 
        vPos = position; 
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition; 
    }`,
  fragmentShader: `
    uniform float uProgress; uniform float uMorph; uniform float uLightAngle; 
    varying vec2 vUv; varying vec3 vN, vPos, vViewPosition;
    
    // Funções de Ruído Otimizadas
    float h(float n){ return fract(sin(n)*1e4); } 
    float noise(vec3 x){ vec3 i=floor(x),f=fract(x); float n=dot(i,vec3(110,241,171)); vec3 u=f*f*(3.0-2.0*f); return mix(mix(mix(h(n),h(n+110.0),u.x),mix(h(n+241.0),h(n+351.0),u.x),u.y),mix(mix(h(n+171.0),h(n+281.0),u.x),mix(h(n+412.0),h(n+522.0),u.x),u.y),u.z); } 
    float fbm(vec3 p){ float f=0.0,w=0.5; for(int i=0;i<5;i++){f+=w*noise(p);p*=2.0;w*=0.5;} return f; }
    
    void main(){
        // Relevo Procedural
        float macro = fbm(vPos * 0.8);
        float micro = fbm(vPos * 3.5);
        float craters = fbm(vPos * 12.0) * 0.2;
        
        // Cores Base: Tons escuros, alienígenas e minerais
        vec3 darkObsidian = vec3(0.04, 0.05, 0.08);
        vec3 paleSilver = vec3(0.4, 0.45, 0.55);
        vec3 baseColor = mix(darkObsidian, paleSilver, macro * 0.5 - craters);
        
        // Iluminação
        vec3 ld = normalize(vec3(cos(uLightAngle), 0.3, sin(uLightAngle)));
        vec3 normal = normalize(vN + (vec3(macro, micro, craters) * 0.1)); // Bump mapping falso
        float diff = max(0.0, dot(normal, ld));
        
        // Especularidade Metálica/Mineral
        vec3 viewDir = normalize(vViewPosition);
        vec3 halfVector = normalize(ld + viewDir);
        float spec = pow(max(dot(normal, halfVector), 0.0), 80.0) * diff * 0.8;
        
        // Rim Light Etereo (Azul Espectral)
        float rimPower = pow(1.0 - max(dot(vN, viewDir), 0.0), 3.5);
        vec3 rimColor = vec3(0.2, 0.5, 1.0) * rimPower * (0.2 + diff * 0.8);
        
        // Composição Final
        vec3 ambient = vec3(0.005, 0.01, 0.02); 
        vec3 finalColor = (baseColor * diff) + ambient + spec + rimColor;
        
        // Controle de Aparição Dramática (uProgress controla a sombra invadindo)
        float shadowMask = smoothstep(0.0, 0.8, diff + (uProgress * 1.5 - 0.5));
        
        gl_FragColor = vec4(mix(vec3(0.0), finalColor * shadowMask, uMorph), 1.0);
    }`,
});
const celestialBody = new THREE.Mesh(celestialGeom, celestialShader);
celestialBody.scale.set(0.525, 0.525, 0.525);
moonSystem.add(celestialBody);

// Coroa Solar (Aura Específica para contrastar com a textura sombria)
const coronaShader = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform float uTime, uOpacity; varying vec2 vUv;
    void main(){ 
        vec2 center = vUv - 0.5; 
        float dist = length(center) * 2.0; 
        float glow = exp(-dist * 2.5) * 2.0; 
        float mask = smoothstep(0.24, 0.28, dist); 
        // Gradiente de azul profundo para ciano fantasmagórico
        vec3 col = mix(vec3(0.1, 0.8, 1.0), vec3(0.05, 0.1, 0.4), dist); 
        gl_FragColor = vec4(col * glow * mask * uOpacity, glow * mask * uOpacity); 
    }`,
});
const webglCorona = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), coronaShader);
webglCorona.position.set(0, 0, -4.2);
moonSystem.add(webglCorona);

// Anéis de Poeira de Cristal
const ringCount = 3500; // Mais partículas para um visual mais denso
const ringGeom = new THREE.BufferGeometry();
const rPos = new Float32Array(ringCount * 3);
const rRnd = new Float32Array(ringCount * 2);
const rAng = new Float32Array(ringCount);
for (let i = 0; i < ringCount; i++) {
  const ang = Math.random() * Math.PI * 2;
  const radius = 5.8 + Math.random() * 3.5;
  rPos[i * 3] = Math.cos(ang) * radius;
  rPos[i * 3 + 1] = (Math.random() - 0.5) * 0.15; // Anel mais achatado e preciso
  rPos[i * 3 + 2] = Math.sin(ang) * radius;
  rRnd[i * 2] = Math.random();
  rRnd[i * 2 + 1] = Math.random();
  rAng[i] = ang;
}
ringGeom.setAttribute("position", new THREE.BufferAttribute(rPos, 3));
ringGeom.setAttribute("aRnd", new THREE.BufferAttribute(rRnd, 2));
ringGeom.setAttribute("aAngle", new THREE.BufferAttribute(rAng, 1));

const ringMat = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.0 } },
  vertexShader: `
    attribute vec2 aRnd; attribute float aAngle; uniform float uTime; varying vec2 vR; 
    void main(){ 
        vR=aRnd; 
        float speed = 0.08 + aRnd.x * 0.1; // Rotação mais lenta e imponente
        float ang = aAngle + uTime * speed; 
        vec3 p = vec3(cos(ang) * length(position.xz), position.y, sin(ang) * length(position.xz)); 
        vec4 vp = viewMatrix * modelMatrix * vec4(p, 1.0); 
        gl_Position = projectionMatrix * vp; 
        gl_PointSize = (12.0 / -vp.z) * (0.5 + aRnd.y * 0.5); 
    }`,
  fragmentShader: `
    uniform float uOpacity; varying vec2 vR; 
    void main(){ 
        float s = pow(1.0 - distance(gl_PointCoord, vec2(0.5)), 2.0); 
        vec3 col = mix(vec3(0.4, 0.7, 1.0), vec3(0.8, 0.9, 1.0), vR.x); 
        gl_FragColor = vec4(col * s * uOpacity, s * uOpacity); 
    }`,
});
const moonRing = new THREE.Points(ringGeom, ringMat);
moonRing.rotation.x = Math.PI * 0.05; // Leve inclinação no anel
moonSystem.add(moonRing);


// ═══════════════════════════════════════════════
// 4. O BURACO NEGRO CINEMATOGRÁFICO (GARGÂNTUA)
// ═══════════════════════════════════════════════
const bhSystem = new THREE.Group();
scene.add(bhSystem);

// Horizonte de Eventos (Esfera de Escuridão Absoluta Escalonada)
const eventHorizon = new THREE.Mesh(
  new THREE.SphereGeometry(1.65, 128, 128),
  new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
);
bhSystem.add(eventHorizon);

// Disco de Acreção Volumétrico (FBM Polar Coordinates Shader)
const accretionGeom = new THREE.RingGeometry(1.65, 6.5, 256, 64);
const accretionShader = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
  vertexShader: `varying vec2 vUv; varying vec3 vPos; void main(){ vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform float uTime; uniform float uOpacity; varying vec2 vUv; varying vec3 vPos; 
    // Ruído Simplex/FBM
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); } 
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
    float fbm(vec2 p){ float f=0.0, w=0.5; for(int i=0;i<5;i++){f+=w*noise(p);p*=2.0;w*=0.5;} return f; } 
    
    void main(){ 
        vec2 center = vec2(0.5);
        vec2 d = vUv - center;
        float radius = length(vPos.xy); 
        float angle = atan(vPos.y, vPos.x); 
        
        // Espiral e Rotação
        float vortex = angle + uTime * 0.8 + 10.0 / radius; 
        vec2 polarUv = vec2(radius * 2.0, vortex * 1.5);
        
        // Textura procedural de poeira e gás
        float gas = fbm(polarUv + fbm(polarUv + uTime * 0.2)) * 1.2;
        float darkLanes = smoothstep(0.4, 1.0, fbm(polarUv * 3.0 - uTime * 0.5));
        
        // Doppler Beaming (Efeito Cinematográfico - Um lado azul brilhante, outro escuro avermelhado)
        float doppler = sin(angle - 0.5); 
        float beam = smoothstep(-1.0, 1.0, doppler) * 1.8 + 0.2;
        
        // Densidade baseada na distância do horizonte de eventos
        float coreDensity = smoothstep(1.65, 2.5, radius) * smoothstep(6.5, 3.0, radius);
        float intensity = coreDensity * gas * beam * darkLanes; 
        
        // Paleta de Cores de Acreção
        vec3 hotCore = vec3(1.0, 0.95, 0.9); // Branco incandescente
        vec3 blueShift = vec3(0.3, 0.6, 1.0); 
        vec3 redShift = vec3(1.0, 0.2, 0.05); 
        
        vec3 dopplerColor = mix(redShift, blueShift, smoothstep(-0.8, 0.8, doppler));
        vec3 finalColor = mix(dopplerColor, hotCore, smoothstep(2.5, 1.65, radius));
        
        gl_FragColor = vec4(finalColor * intensity * uOpacity, intensity * uOpacity); 
    }`,
});
const photonDisk = new THREE.Mesh(accretionGeom, accretionShader);
photonDisk.rotation.x = Math.PI / 2.2; // Inclinação elegante
bhSystem.add(photonDisk);

// Estrelas e Galáxia orbitando o buraco
const starsParam = { count: 120000, radius: 80, branches: 5, spin: 6.0 };
const starsGeom = new THREE.BufferGeometry();
const positions = new Float32Array(starsParam.count * 3);
const colors = new Float32Array(starsParam.count * 3);
const randomness = new Float32Array(starsParam.count * 3);
for (let i = 0; i < starsParam.count; i++) {
  const i3 = i * 3;
  const radius = Math.pow(Math.random(), 3.0) * starsParam.radius + 3.0;
  const spinAngle = radius * starsParam.spin;
  const branchAngle =
    ((i % starsParam.branches) / starsParam.branches) * Math.PI * 2;
  const spread =
    Math.pow(Math.random(), 2.0) * (starsParam.radius - radius) * 0.35;
  positions[i3] =
    Math.cos(branchAngle + spinAngle) * radius +
    Math.cos(Math.random() * Math.PI * 2) * spread;
  positions[i3 + 1] = (Math.random() - 0.5) * (radius < 10 ? 4.0 : 0.5);
  positions[i3 + 2] =
    Math.sin(branchAngle + spinAngle) * radius +
    Math.sin(Math.random() * Math.PI * 2) * spread;
  const mx = radius / starsParam.radius;
  const mixed = new THREE.Color(0xff8833).lerp(new THREE.Color(0x3388ff), mx);
  colors[i3] = mixed.r;
  colors[i3 + 1] = mixed.g;
  colors[i3 + 2] = mixed.b;
  randomness[i3] = Math.random();
  randomness[i3 + 1] = Math.random();
  randomness[i3 + 2] = Math.random();
}
starsGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
starsGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
starsGeom.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));
const starShader = new THREE.ShaderMaterial({
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  transparent: true,
  uniforms: {
    uTime: { value: 0 },
    uSpeedMult: { value: 1.0 },
    uOpacity: { value: 1.0 },
  },
  vertexShader: `uniform float uTime,uSpeedMult; attribute vec3 aRandomness; varying vec3 vColor; void main(){ vec3 pos=position; float dist=length(pos); float angle=atan(pos.z,pos.x)+(uTime*uSpeedMult/(dist*0.2)); pos.x=cos(angle)*dist; pos.z=sin(angle)*dist; vec4 vp=viewMatrix*modelMatrix*vec4(pos,1.0); gl_Position=projectionMatrix*vp; gl_PointSize=(35.0/-vp.z)*(0.2+aRandomness.x); vColor=color; }`,
  fragmentShader: `uniform float uOpacity; varying vec3 vColor; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),3.0); gl_FragColor=vec4(vColor*s*uOpacity,s*uOpacity); }`,
});
const galaxy = new THREE.Points(starsGeom, starShader);
bhSystem.add(galaxy);

// ═══════════════════════════════════════════════
// 5. BACKGROUND (Espaço Profundo)
// ═══════════════════════════════════════════════
const bgGeom = new THREE.BufferGeometry();
const bgPos = new Float32Array(8000 * 3);
for (let i = 0; i < 8000; i++) {
  bgPos[i * 3] = (Math.random() - 0.5) * 2000;
  bgPos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
  bgPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
}
bgGeom.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
const bgMat = new THREE.PointsMaterial({
  size: 2.0,
  color: 0xffffff,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
});
const spaceBg = new THREE.Points(bgGeom, bgMat);
scene.add(spaceBg);

// Efeito Filme Granulado
const gc = document.getElementById("grain-canvas");
if(gc) { // Prevenção de erro caso o canvas não exista no HTML ainda
  gc.width = 200;
  gc.height = 200;
  const gCtx = gc.getContext("2d");
  setInterval(() => {
    const img = gCtx.createImageData(200, 200);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    gCtx.putImageData(img, 0, 0);
  }, 80);
}

// ═══════════════════════════════════════════════
// 6. LOOP DE ANIMAÇÃO & PARALLAX
// ═══════════════════════════════════════════════
let mouseX = 0,
  mouseY = 0,
  isDiving = false,
  isTunneling = false;
const traumaParams = { level: 0 };

document.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX - innerWidth / 2) * 0.00018;
  mouseY = (e.clientY - innerHeight / 2) * 0.00018;
});

function smoothShake(t, level) {
  const sq = level * level;
  return {
    x: (Math.sin(t * 45) * 0.5 + Math.sin(t * 21) * 0.3) * sq * 4.0,
    y: (Math.cos(t * 33) * 0.5 + Math.cos(t * 17) * 0.3) * sq * 4.0,
  };
}

const clock = new THREE.Clock();
(function animate() {
  const delta = clock.getElapsedTime();
  warpPass.uniforms.uTime.value = delta;

  if (bhSystem.visible) {
    starShader.uniforms.uTime.value = delta;
    accretionShader.uniforms.uTime.value = delta;
    bhSystem.rotation.y = delta * 0.015;
    bhSystem.rotation.z = Math.sin(delta * 0.3) * 0.05; // Respiração majestosa do eixo
  }

  if (moonSystem.visible) {
    coronaShader.uniforms.uTime.value = delta;
  }

  // Túnel Loop Mágico
  if (isTunneling) {
    tunnelMat.uniforms.uSpeed.value = 80.0; // Velocidade absurda de dobra
    const tArray = dimensionTunnel.geometry.attributes.position.array;
    for (let i = 2; i < tArray.length; i += 3) {
      tArray[i] += tunnelMat.uniforms.uSpeed.value;
      if (tArray[i] > camera.position.z + 200)
        tArray[i] = camera.position.z - 4000;
    }
    dimensionTunnel.geometry.attributes.position.needsUpdate = true;
  }

  if (!isDiving) {
    camera.position.x += (mouseX * 50 - camera.position.x) * 0.01;
    camera.position.y += (45 - mouseY * 50 - camera.position.y) * 0.01;
  } else if (traumaParams.level > 0.01) {
    const sh = smoothShake(delta, traumaParams.level);
    camera.position.x += sh.x;
    camera.position.y += sh.y;
  }

  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, isTunneling ? -500 : 0);
  composer.render();
  requestAnimationFrame(animate);
})();

// ═══════════════════════════════════════════════
// 7. A COREOGRAFIA (SURF GRAVITACIONAL E TÚNEL)
// ═══════════════════════════════════════════════
document.getElementById("btn-despertar")?.addEventListener("click", (e) => {
  e.preventDefault();
  if (isDiving) return;
  isDiving = true;
  document.body.classList.add("diving-active");

  const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // FASE 1: Fade out UI e Atmosfera
  tl.to(
    "#ui-layer",
    {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        const ui = document.getElementById("ui-layer");
        if(ui) ui.style.display = "none";
      },
    },
    0,
  )
    .to(
      ["#btn-despertar", "#subtitle-text", "#title-text"],
      {
        opacity: 0,
        scale: 1.1,
        filter: "blur(10px)",
        stagger: 0.1,
        duration: 1.5,
      },
      0,
    )
    .to(
      ["#bar-top", "#bar-bottom"],
      { height: "12vh", duration: 2.5, ease: "power4.inOut" },
      0,
    );

  // FASE 2: Aproximação Colossal (Surfing Gargantua)
  tl.to(
    camera.position,
    { x: 3, y: 1.0, z: 12, duration: 6.5, ease: "power2.inOut" },
    1.0,
  )
    .to(
      camera,
      {
        fov: 95,
        duration: 6.5,
        ease: "power2.inOut",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      1.0,
    )
    .to(
      starShader.uniforms.uSpeedMult,
      { value: 12.0, duration: 6.0, ease: "power2.in" },
      1.0,
    )
    .to(traumaParams, { level: 0.3, duration: 4.0 }, 3.0)
    .to(
      warpPass.uniforms.uAmount,
      { value: 1.8, duration: 5.0, ease: "power2.inOut" },
      2.0,
    ); // Dobra a luz em volta do buraco

  // FASE 3: Contemplação à beira do abismo
  tl.to(
    camera.position,
    { x: -3, y: -0.5, duration: 4.5, ease: "sine.inOut" },
    7.5,
  )
    .to(traumaParams, { level: 0.1, duration: 1.5 }, 7.5)
    .to(bloomPass, { strength: 2.8, duration: 3.0 }, 7.5);

  // FASE 4: O Colapso e Cruzando o Horizonte de Eventos
  tl.to(
    camera.position,
    { x: 0, y: 0, z: -1.0, duration: 2.5, ease: "power4.in" },
    12.0,
  )
    .to(
      camera,
      {
        fov: 150,
        duration: 2.5,
        ease: "power4.in",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      12.0,
    )
    .to(
      warpPass.uniforms.uAmount,
      { value: 5.0, duration: 2.5, ease: "power4.in" },
      12.0,
    ) // Lente rasga a tela
    .to(traumaParams, { level: 1.5, duration: 2.5, ease: "power4.in" }, 12.0)
    .to(bgMat, { opacity: 0.0, duration: 1.0 }, 13.5); // Espaço normal morre

  // FASE 5: O Túnel de Velocidade de Dobra (Interdimensional)
  tl.add(() => {
    bhSystem.visible = false; 
    dimensionTunnel.visible = true; 
    isTunneling = true;
    camera.position.set(0, 0, -50);
  }, 14.5)
    .to(tunnelMat.uniforms.uOpacity, { value: 1.0, duration: 1.0, ease: "power2.out" }, 14.5)
    .to(camera.position, { z: -2000, duration: 5.5, ease: "power1.inOut" }, 14.5)
    .to(traumaParams, { level: 0.8, duration: 5.5 }, 14.5);

  // FASE 6: O Clarão Branco e o Revelar do Cofre
  // Aumentamos o raio e a força do bloom para cobrir a tela inteira
  tl.to(bloomPass, { strength: 20.0, radius: 4.0, duration: 1.2, ease: "power4.in" }, 18.8)
    .to(chromaticPass.uniforms.uStrength, { value: 2.5, duration: 1.0 }, 19.0)
    .add(() => {
      isTunneling = false;
      dimensionTunnel.visible = false;
      moonSystem.visible = true; 
      camera.position.set(0, 0, 30); // Câmera começa um pouco mais distante
      camera.fov = 45;
      camera.updateProjectionMatrix();
    }, 20.0)
    .to(celestialShader.uniforms.uMorph, { value: 1.0, duration: 0.1 }, 20.0)
    // O Bloom recua de forma mais suave, revelando a escuridão
    .to(bloomPass, { strength: 1.2, radius: 0.8, duration: 5.0, ease: "power2.out" }, 20.0)
    .to(chromaticPass.uniforms.uStrength, { value: 0.0, duration: 4.0, ease: "power2.out" }, 20.0)
    .to(traumaParams, { level: 0.0, duration: 0.5 }, 20.0)
    .to(bgMat, { opacity: 0.8, duration: 3.0 }, 20.0);

  // FASE 7: A Dança Mágica e Majestosa da Lua
  // A luz caminha pela superfície revelando as texturas minerais
  tl.to(celestialShader.uniforms.uLightAngle, { value: 1.2, duration: 8.0, ease: "power2.out" }, 21.0)
    .to(celestialShader.uniforms.uProgress, { value: 1.0, duration: 6.0, ease: "sine.inOut" }, 21.0)
    .to(coronaShader.uniforms.uOpacity, { value: 0.6, duration: 5.0, ease: "power1.inOut" }, 21.5) // Coroa mais sutil
    .to(ringMat.uniforms.uOpacity, { value: 0.8, duration: 5.0, ease: "power1.inOut" }, 22.0)
    .to(webglCorona.rotation, { z: "+=0.5", duration: 10.0, ease: "none" }, 20.0)
    .to(["#bar-top", "#bar-bottom"], { height: "0vh", duration: 4.0, ease: "power3.inOut" }, 23.0);

  // FASE FINAL: O Pouso
  tl.to(camera.position, { z: 4.0, duration: 6.0, ease: "power3.in" }, 26.0)
    .to(bloomPass, { strength: 6.0, duration: 4.0, ease: "power2.in" }, 27.5)
    .to(
      "#void-transition",
      {
        opacity: 1,
        duration: 3.0,
        ease: "power2.inOut",
        onComplete: () => {
          // Aqui ocorre o redirecionamento final
          window.location.href = "login.php"; 
        },
      },
      28.5,
    );
});

// Listener de Redimensionamento da Tela
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});