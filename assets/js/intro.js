// ═══════════════════════════════════════════════
// 1. MOTOR & PÓS-PROCESSAMENTO (Otimizado)
// ═══════════════════════════════════════════════
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  0.1,
  2000,
);
camera.position.set(0, 40, 100);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById("webgl-container").appendChild(renderer.domElement);

const renderPass = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.5,
  0.4,
  0.85,
);
bloomPass.threshold = 0.02;
bloomPass.strength = 1.6;
bloomPass.radius = 1.2;

const ChromaShader = {
  uniforms: { tDiffuse: { value: null }, uStrength: { value: 0.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uStrength; varying vec2 vUv; void main(){ vec2 c=vUv-0.5; float d=length(c); vec2 off=c*d*uStrength; float r=texture2D(tDiffuse,vUv-off*1.3).r; float g=texture2D(tDiffuse,vUv).g; float b=texture2D(tDiffuse,vUv+off).b; gl_FragColor=vec4(r,g,b,1.0); }`,
};
const chromaticPass = new THREE.ShaderPass(ChromaShader);

const WarpShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAmount: { value: 0.0 },
    uTime: { value: 0.0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmount, uTime; varying vec2 vUv; void main(){ vec2 center = vec2(0.5); vec2 delta = vUv - center; float dist = length(delta); float warp = uAmount * dist * dist; vec4 col = vec4(0.0); float total = 0.0; for(int i=0; i<8; i++){ float t = float(i) / 7.0; float sc = 1.0 - warp * t; vec2 uv = center + delta * sc; uv = clamp(uv, 0.001, 0.999); col += texture2D(tDiffuse, uv) * (1.0 - t * 0.5); total += (1.0 - t * 0.5); } gl_FragColor = col / total; }`,
};
const warpPass = new THREE.ShaderPass(WarpShader);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(warpPass);
composer.addPass(chromaticPass);

// ═══════════════════════════════════════════════
// 2. O CORPO CELESTIAL UNIFICADO
// ═══════════════════════════════════════════════
const celestialGeom = new THREE.SphereGeometry(4.0, 128, 128);
const celestialShader = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: { uProgress: { value: 0.0 }, uMorph: { value: 0.0 } },
  vertexShader: `varying vec2 vUv; varying vec3 vN,vPos; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
            uniform float uProgress; uniform float uMorph; varying vec2 vUv; varying vec3 vN,vPos;
            float h(float n){ return fract(sin(n)*1e4); }
            float noise(vec3 x){ vec3 i=floor(x),f=fract(x); float n=dot(i,vec3(110,241,171)); vec3 u=f*f*(3.0-2.0*f); return mix(mix(mix(h(n),h(n+110.0),u.x),mix(h(n+241.0),h(n+351.0),u.x),u.y),mix(mix(h(n+171.0),h(n+281.0),u.x),mix(h(n+412.0),h(n+522.0),u.x),u.y),u.z); }
            float fbm(vec3 p){ float f=0.0,w=0.5; for(int i=0;i<5;i++){f+=w*noise(p);p*=2.2;w*=0.5;} return f; }
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
                vec3 moonColor=(base*smoothstep(0.0,0.55,diff))+vec3(spec)+vec3(0.85,0.92,1.0)*rimI;
                vec3 finalColor = mix(vec3(0.0), moonColor, uMorph);
                gl_FragColor=vec4(finalColor, 1.0);
            }
        `,
});
const celestialBody = new THREE.Mesh(celestialGeom, celestialShader);
celestialBody.scale.set(0.525, 0.525, 0.525);
scene.add(celestialBody);

// ═══════════════════════════════════════════════
// 3. SISTEMA DO BURACO NEGRO
// ═══════════════════════════════════════════════
const bhSystem = new THREE.Group();
scene.add(bhSystem);

const accretionGeom = new THREE.TorusGeometry(3.2, 0.8, 64, 128);
const accretionShader = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  uniforms: {
    uTime: { value: 0 },
    uIntensityMulti: { value: 1.0 },
    uOpacity: { value: 1.0 },
  },
  vertexShader: `varying vec2 vUv; varying vec3 vPos; void main(){ vUv=uv; vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform float uTime,uIntensityMulti,uOpacity; varying vec2 vUv; varying vec3 vPos; float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); } float fbm(vec2 p){ float f=0.0; f+=0.5*h(p); p*=2.01; f+=0.25*h(p); p*=2.01; f+=0.125*h(p); return f; } void main(){ float r=length(vPos.xy); float ang=atan(vPos.y,vPos.x); float turb=fbm(vUv*24.0+vec2(uTime*0.22,0.0))*0.32; float pulse=0.90+0.10*sin(uTime*2.9+r); float intensity=pow(1.0-smoothstep(1.8,5.5,r),3.0)*pulse+turb; float dopp=sin(ang+uTime*0.38)*0.5+0.5; vec3 hotCore=vec3(0.94,0.97,1.0); vec3 blueShift=vec3(0.35,0.68,1.0); vec3 redShift=vec3(0.68,0.38,1.0); vec3 col=mix(hotCore, mix(redShift,blueShift,dopp), smoothstep(1.8,4.2,r)); float vol=smoothstep(0.0,0.18,vUv.y)*smoothstep(1.0,0.82,vUv.y); gl_FragColor=vec4(col*intensity*uIntensityMulti*uOpacity, intensity*vol*uOpacity); }`,
});
const photonDisk = new THREE.Mesh(accretionGeom, accretionShader);
photonDisk.rotation.x = Math.PI / 2;
photonDisk.scale.z = 0.05;
bhSystem.add(photonDisk);

const starsParam = { count: 90000, radius: 65, branches: 4, spin: 4.5 };
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
  positions[i3 + 1] = (Math.random() - 0.5) * (radius < 8 ? 4.0 : 0.5);
  positions[i3 + 2] =
    Math.sin(branchAngle + spinAngle) * radius +
    Math.sin(Math.random() * Math.PI * 2) * spread;
  const mx = radius / starsParam.radius;
  const mixed = new THREE.Color(0xe0f0ff).lerp(
    new THREE.Color(0xa960ee),
    mx * 1.15,
  );
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
    uSuck: { value: 0.0 },
    uOpacity: { value: 1.0 },
  },
  vertexShader: `uniform float uTime,uSpeedMult,uSuck; attribute vec3 aRandomness; varying vec3 vColor; varying float vDist; void main(){ vec3 pos=position; float dist=length(pos); vDist=dist; float angle=atan(pos.z,pos.x)+(uTime*uSpeedMult/(dist*0.5)); float sf=smoothstep(0.0,1.0,uSuck); float curR=mix(dist,1.5,pow(sf, 1.5)*(1.0-aRandomness.x*0.2)); pos.x=cos(angle)*curR; pos.z=sin(angle)*curR; pos.y*=(1.0-sf*0.95); vec4 vp=viewMatrix*modelMatrix*vec4(pos,1.0); gl_Position=projectionMatrix*vp; gl_PointSize=(28.0/-vp.z)*(0.2+aRandomness.x); vColor=color; }`,
  fragmentShader: `uniform float uOpacity; varying vec3 vColor; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.5); gl_FragColor=vec4(vColor*s*uOpacity,s*0.9*uOpacity); }`,
});
const galaxy = new THREE.Points(starsGeom, starShader);
bhSystem.add(galaxy);

function createJet(direction) {
  const count = 600;
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const rands = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const ang = Math.random() * Math.PI * 2;
    const spread = Math.pow(1 - t, 2) * 2.2;
    pos[i * 3] = Math.cos(ang) * spread;
    pos[i * 3 + 1] = t * 20 + 2.2;
    pos[i * 3 + 2] = Math.sin(ang) * spread;
    rands[i * 2] = Math.random();
    rands[i * 2 + 1] = Math.random();
  }
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("aRand", new THREE.BufferAttribute(rands, 2));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.0 },
      uOpacity: { value: 1.0 },
    },
    vertexShader: `attribute vec2 aRand; uniform float uTime,uIntensity; varying float vY; varying vec2 vR; void main(){ vR=aRand; float speed=3.5+aRand.x*5.0; vec3 p=position; p.y=mod(p.y-2.2+uTime*speed*aRand.x,20.0)+2.2; vY=p.y/22.0; vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0); gl_Position=projectionMatrix*vp; float sz=(1.0-vY)*uIntensity*(0.5+aRand.y*0.5); gl_PointSize=(28.0/-vp.z)*sz; }`,
    fragmentShader: `uniform float uOpacity; varying float vY; varying vec2 vR; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.0); float fade=1.0-vY; vec3 col=mix(vec3(0.94,0.97,1.0),vec3(0.22,0.60,1.0),vY*0.8); gl_FragColor=vec4(col*s*fade*uOpacity,s*fade*0.9*uOpacity); }`,
  });
  const pts = new THREE.Points(geom, mat);
  if (direction < 0) pts.rotation.x = Math.PI;
  return { mesh: pts, mat };
}
const jetUp = createJet(1);
const jetDown = createJet(-1);
bhSystem.add(jetUp.mesh);
bhSystem.add(jetDown.mesh);

const streakCount = 200;
const streakGeom = new THREE.BufferGeometry();
const sPos = new Float32Array(streakCount * 3);
const sRnd = new Float32Array(streakCount * 3);
for (let i = 0; i < streakCount; i++) {
  const ang = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 38;
  sPos[i * 3] = Math.cos(ang) * r;
  sPos[i * 3 + 1] = (Math.random() - 0.5) * 25;
  sPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
  sRnd[i * 3] = Math.random();
  sRnd[i * 3 + 1] = Math.random();
  sRnd[i * 3 + 2] = Math.random();
}
streakGeom.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
streakGeom.setAttribute("aRnd", new THREE.BufferAttribute(sRnd, 3));
const streakMat = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  uniforms: {
    uTime: { value: 0 },
    uSpeed: { value: 0.0 },
    uOpacity: { value: 1.0 },
  },
  vertexShader: `attribute vec3 aRnd; uniform float uTime,uSpeed; varying float vD; varying float vS; void main(){ vec3 p=position; vS=uSpeed; p.z=mod(p.z+uTime*uSpeed*(10.0+aRnd.z*18.0),100.0)-50.0; vD=length(p.xy)/50.0; vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0); gl_Position=projectionMatrix*vp; gl_PointSize=(uSpeed*1.8/-vp.z)*(0.5+aRnd.x); }`,
  fragmentShader: `uniform float uOpacity; varying float vD; varying float vS; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.0); vec3 col=mix(vec3(0.96,0.98,1.0),vec3(0.38,0.68,1.0),vD); gl_FragColor=vec4(col*s*uOpacity,(1.0-vD)*s*0.85*uOpacity); }`,
});
const speedStreaks = new THREE.Points(streakGeom, streakMat);
bhSystem.add(speedStreaks);
bhSystem.rotation.x = 1.15;
bhSystem.rotation.z = 0.15;

// ═══════════════════════════════════════════════
// 4. SISTEMA DA LUA (Anéis, Corona, Atmosfera)
// ═══════════════════════════════════════════════
const moonSystem = new THREE.Group();
moonSystem.visible = false;
scene.add(moonSystem);

const nebula = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160),
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime,uOpacity; varying vec2 vUv; float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); } float noise(vec2 p){ vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); } float fbm(vec2 p){ float f=0.0,w=0.5; for(int i=0;i<5;i++){ f+=w*noise(p); p*=2.0; w*=0.5; } return f; } void main(){ vec2 uv=vUv*3.0; float n=fbm(uv+fbm(uv+uTime*0.016)+fbm(uv*2.0-uTime*0.022)); vec3 col=mix(vec3(0.01,0.03,0.10),vec3(0.14,0.10,0.34),n); col+=mix(vec3(0.0),vec3(0.04,0.10,0.22),fbm(uv*1.5+uTime*0.01)); float mask=pow(max(0.0,1.0-distance(vUv,vec2(0.5))*1.6),2.0); gl_FragColor=vec4(col*mask*uOpacity,mask*uOpacity*0.55); }`,
  }),
);
nebula.position.set(0, 0, -40);
moonSystem.add(nebula);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(4.0 * 1.05, 128, 128),
  new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uProgress: { value: 0.0 } },
    vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uProgress; varying vec3 vN; void main(){ float lx=mix(2.0,0.5,uProgress),lz=mix(-1.0,1.5,uProgress); vec3 ld=normalize(vec3(lx,0.0,lz)); float intensity=pow(0.62-dot(vN,vec3(0,0,1.0)),4.0); float diff=max(0.0,dot(vN,ld)); vec3 col=mix(vec3(0.62,0.34,0.96),vec3(0.24,0.62,1.0),uProgress)*intensity*diff*uProgress; gl_FragColor=vec4(col,col.b+col.r*0.4); }`,
  }),
);
moonSystem.add(atmosphere);

// COROA DE LUZ - Elemento Chave da Espiral
const coronaShader = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform float uTime,uOpacity; varying vec2 vUv; vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;} vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;} vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);} float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 xx=2.0*fract(p*C.www)-1.0;vec3 hh=abs(xx)-0.5;vec3 ox=floor(xx+0.5);vec3 a0=xx-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+hh*hh);vec3 g;g.x=a0.x*x0.x+hh.x*x0.y;g.yz=a0.yz*x12.xz+hh.yz*x12.yw;return 130.0*dot(m,g);} void main(){ vec2 center=vUv-0.5; float dist=length(center)*2.0; float twist=dist*2.8; float spAng=atan(center.y,center.x)+twist; float rays=(snoise(vec2(spAng*3.0,uTime*0.045))*0.5+0.5)*0.55+(snoise(vec2(spAng*11.0,uTime*0.075))*0.5+0.5)*0.45; float glow=exp(-dist*2.1)*2.8; float mask=smoothstep(0.25,0.27,dist); float intensity=glow*rays*mask; vec3 col=mix(vec3(0.96,0.99,1.0),vec3(0.45,0.26,0.92),dist*0.55); gl_FragColor=vec4(col*intensity*uOpacity,intensity*uOpacity); }`,
});
const webglCorona = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 44),
  coronaShader,
);
webglCorona.position.set(0, 0, -4.2);
moonSystem.add(webglCorona);

// ANÉIS - Elemento Auxiliar da Espiral
const ringCount = 1800;
const ringGeom = new THREE.BufferGeometry();
const rPos = new Float32Array(ringCount * 3);
const rRnd = new Float32Array(ringCount * 2);
const rAng = new Float32Array(ringCount);
for (let i = 0; i < ringCount; i++) {
  const ang = Math.random() * Math.PI * 2;
  const radius = 5.5 + Math.random() * 2.8;
  rPos[i * 3] = Math.cos(ang) * radius;
  rPos[i * 3 + 1] = (Math.random() - 0.5) * 0.55;
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
  vertexShader: `attribute vec2 aRnd; attribute float aAngle; uniform float uTime,uOpacity; varying vec2 vR; void main(){ vR=aRnd; float speed=0.18+aRnd.x*0.22; float ang=aAngle+uTime*speed; float rad=length(position.xz); vec3 p=vec3(cos(ang)*rad,position.y,sin(ang)*rad); vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0); gl_Position=projectionMatrix*vp; gl_PointSize=(18.0/-vp.z)*(0.3+aRnd.y*0.7); }`,
  fragmentShader: `uniform float uOpacity; varying vec2 vR; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.0); vec3 col=mix(vec3(0.56,0.78,1.0),vec3(0.94,0.96,1.0),vR.x); gl_FragColor=vec4(col*s*uOpacity,s*0.8*uOpacity); }`,
});
const moonRing = new THREE.Points(ringGeom, ringMat);
moonSystem.add(moonRing);

// ═══════════════════════════════════════════════
// 5. BACKGROUND FIXO E EVENTOS
// ═══════════════════════════════════════════════
const bgGeom = new THREE.BufferGeometry();
const bgPos = new Float32Array(6000 * 3);
const bgRand = new Float32Array(6000);
for (let i = 0; i < 6000; i++) {
  bgPos[i * 3] = (Math.random() - 0.5) * 1400;
  bgPos[i * 3 + 1] = (Math.random() - 0.5) * 1400;
  bgPos[i * 3 + 2] = (Math.random() - 0.5) * 1400;
  bgRand[i] = Math.random();
}
bgGeom.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
bgGeom.setAttribute("aRand", new THREE.BufferAttribute(bgRand, 1));
const bgMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 } },
  vertexShader: `attribute float aRand; uniform float uTime; varying float vR; void main(){ vR=aRand; float tw=0.55+0.45*sin(uTime*1.6+aRand*97.3); vec4 vp=viewMatrix*modelMatrix*vec4(position,1.0); gl_Position=projectionMatrix*vp; gl_PointSize=(5.5/-vp.z)*(0.35+aRand*0.65)*tw; }`,
  fragmentShader: `varying float vR; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.2); vec3 col=mix(vec3(0.72,0.86,1.0),vec3(1.0,0.93,0.82),vR); gl_FragColor=vec4(col*s,s*0.88); }`,
});
scene.add(new THREE.Points(bgGeom, bgMat));

const gc = document.getElementById("grain-canvas");
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

let mouseX = 0,
  mouseY = 0,
  isDiving = false;
const traumaParams = { level: 0 };
gsap.to(camera.position, {
  x: 0,
  y: 12,
  z: 65,
  duration: 6,
  ease: "power2.out",
});
document.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX - innerWidth / 2) * 0.00018;
  mouseY = (e.clientY - innerHeight / 2) * 0.00018;
});
function smoothShake(t, level) {
  const sq = level * level;
  return {
    x:
      (Math.sin(t * 38.7) * 0.5 +
        Math.sin(t * 19.3) * 0.3 +
        Math.sin(t * 63.1) * 0.2) *
      sq *
      3.8,
    y:
      (Math.cos(t * 29.7) * 0.5 +
        Math.cos(t * 14.9) * 0.3 +
        Math.cos(t * 49.3) * 0.2) *
      sq *
      3.8,
  };
}

const clock = new THREE.Clock();
(function animate() {
  const delta = clock.getElapsedTime();
  bgMat.uniforms.uTime.value = delta;
  warpPass.uniforms.uTime.value = delta;

  if (bhSystem.visible) {
    starShader.uniforms.uTime.value = delta;
    accretionShader.uniforms.uTime.value = delta;
    jetUp.mat.uniforms.uTime.value = delta;
    jetDown.mat.uniforms.uTime.value = delta;
    streakMat.uniforms.uTime.value = delta;
    bhSystem.rotation.y = delta * 0.012;
  }
  if (moonSystem.visible) {
    coronaShader.uniforms.uTime.value = delta;
    nebula.material.uniforms.uTime.value = delta;
    ringMat.uniforms.uTime.value = delta;
  }

  if (!isDiving) {
    camera.position.x += (mouseX * 28 - camera.position.x) * 0.012;
    camera.position.y += (12 - mouseY * 28 - camera.position.y) * 0.012;
  } else if (traumaParams.level > 0.01) {
    const sh = smoothShake(delta, traumaParams.level);
    camera.position.x += sh.x;
    camera.position.y += sh.y;
  }
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  composer.render();
  requestAnimationFrame(animate);
})();

// ═══════════════════════════════════════════════
// 6. A COREOGRAFIA (TRANSIÇÃO E ESPIRAL DE SUCK)
// ═══════════════════════════════════════════════
document.getElementById("btn-despertar").addEventListener("click", (e) => {
  e.preventDefault();
  if (isDiving) return;
  isDiving = true;
  document.body.classList.add("diving-active");

  const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // FASE 0 & 1 — Sumiço da UI
  tl.to(
    "#ui-layer",
    {
      opacity: 0,
      duration: 0.32,
      ease: "power2.out",
      onComplete: () => {
        const uiLayer = document.getElementById("ui-layer");
        uiLayer.style.display = "none";
        uiLayer.style.pointerEvents = "none";
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
        duration: 1.2,
        ease: "power2.in",
      },
      0,
    )
    .to("#intro-block", { opacity: 0, duration: 0.5 }, 0)
    .to("#bar-top", { height: "9vh", duration: 2, ease: "power4.inOut" }, 0.5)
    .to(
      "#bar-bottom",
      { height: "9vh", duration: 2, ease: "power4.inOut" },
      0.5,
    )
    .to(camera.position, { z: 80, duration: 1.5, ease: "power2.out" }, 0.5)

    // FASE 2 — O Mergulho
    .to(
      camera.position,
      { x: 0, y: 0, z: 2.5, duration: 6.0, ease: "expo.in" },
      2.0,
    )
    .to(
      camera,
      {
        fov: 165,
        duration: 6.0,
        ease: "expo.in",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      2.0,
    )
    .to(
      starShader.uniforms.uSpeedMult,
      { value: 250.0, duration: 6.0, ease: "power4.in" },
      2.0,
    )
    .to(bhSystem.rotation, { y: "+=18", duration: 6.0, ease: "power4.in" }, 2.0)
    .to(
      starShader.uniforms.uSuck,
      { value: 1.0, duration: 4.5, ease: "power3.in" },
      3.5,
    )
    .to(
      warpPass.uniforms.uAmount,
      { value: 4.0, duration: 5.5, ease: "power3.in" },
      2.5,
    )
    .to("#dive-vignette", { opacity: 1, duration: 4.0, ease: "power2.in" }, 2.5)
    .to(bloomPass, { strength: 6.0, duration: 3.0, ease: "power2.in" }, 5.0)
    .to(
      chromaticPass.uniforms.uStrength,
      { value: 0.1, duration: 3.5, ease: "power2.in" },
      4.5,
    )
    .to(traumaParams, { level: 1.2, duration: 3.0, ease: "power2.in" }, 5.0)

    // FASE 3 — O Instante de Silêncio
    .to(traumaParams, { level: 0.0, duration: 0.1 }, 7.9)
    .to(bloomPass, { strength: 0.2, duration: 0.1 }, 7.9)
    .to(warpPass.uniforms.uAmount, { value: 0.0, duration: 0.1 }, 7.9)

    // FASE 4 — O MORPH
    .to(
      celestialBody.scale,
      { x: 1.0, y: 1.0, z: 1.0, duration: 4.0, ease: "power2.inOut" },
      8.0,
    )
    .to(
      celestialShader.uniforms.uMorph,
      { value: 1.0, duration: 3.5, ease: "power2.inOut" },
      8.0,
    )
    .to(camera.position, { z: 22, duration: 8.0, ease: "power3.out" }, 8.0)
    .to(
      camera,
      {
        fov: 35,
        duration: 2.0,
        ease: "power2.out",
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      8.0,
    )

    // Desintegração do Buraco Negro Antigo
    .to(
      bhSystem.scale,
      { x: 4.0, y: 4.0, z: 4.0, duration: 4.0, ease: "power2.out" },
      8.0,
    )
    .to(
      accretionShader.uniforms.uOpacity,
      { value: 0.0, duration: 2.5, ease: "power2.out" },
      8.0,
    )
    .to(
      starShader.uniforms.uOpacity,
      { value: 0.0, duration: 3.0, ease: "power2.out" },
      8.0,
    )
    .to(jetUp.mat.uniforms.uOpacity, { value: 0.0, duration: 1.5 }, 8.0)
    .to(jetDown.mat.uniforms.uOpacity, { value: 0.0, duration: 1.5 }, 8.0)
    .to(streakMat.uniforms.uOpacity, { value: 0.0, duration: 1.5 }, 8.0)
    .add(() => {
      bhSystem.visible = false;
    }, 12.0)

    // Flash de Ocultamento
    .to(bloomPass, { strength: 8.0, duration: 0.6, ease: "power2.in" }, 8.0)
    .to(
      bloomPass,
      { strength: 1.8, radius: 0.8, duration: 4.0, ease: "power2.out" },
      8.6,
    )
    .to(chromaticPass.uniforms.uStrength, { value: 0.4, duration: 0.6 }, 8.0)
    .to(chromaticPass.uniforms.uStrength, { value: 0.0, duration: 3.0 }, 8.6)

    // Revela o sistema lunar
    .add(() => {
      moonSystem.visible = true;
    }, 8.0)
    .to(
      coronaShader.uniforms.uOpacity,
      { value: 1.0, duration: 3.0, ease: "power2.out" },
      8.5,
    )
    .to(
      ringMat.uniforms.uOpacity,
      { value: 1.0, duration: 3.0, ease: "power2.out" },
      8.5,
    )
    .to(nebula.material.uniforms.uOpacity, { value: 1.0, duration: 4.0 }, 8.5)
    .to("#bar-top", { height: "0vh", duration: 4.0, ease: "power2.inOut" }, 9.5)
    .to(
      "#bar-bottom",
      { height: "0vh", duration: 4.0, ease: "power2.inOut" },
      9.5,
    )
    .to("#dive-vignette", { opacity: 0, duration: 3.0 }, 8.5)

    // FASE 5 — A ESPIRAL DE SUCÇÃO (Suck)
    // A lua inicia seu clareamento
    .to(
      celestialShader.uniforms.uProgress,
      { value: 1.0, duration: 8.0, ease: "sine.inOut" },
      10.0,
    )
    .to(
      atmosphere.material.uniforms.uProgress,
      { value: 1.0, duration: 8.0, ease: "sine.inOut" },
      10.0,
    )

    // AQUI ESTÁ A MÁGICA: Coroa e Anéis giram violentamente enquanto diminuem
    // A rotação acelerada cria a percepção exata do funil/espiral de sucção
    .to(
      webglCorona.rotation,
      { z: "+=15", duration: 4.5, ease: "power3.in" },
      12.0,
    )
    .to(
      moonRing.rotation,
      { y: "+=15", duration: 4.5, ease: "power3.in" },
      12.0,
    )

    // Eles são puxados para o centro (escala 0.01) de trás da lua
    .to(
      [webglCorona.scale, moonRing.scale],
      { x: 0.01, y: 0.01, z: 0.01, duration: 4.5, ease: "power3.in" },
      12.0,
    )

    // No exato milissegundo final da sucção, eles somem e a Lua "ignita" com um pulso de Bloom
    .to(
      [coronaShader.uniforms.uOpacity, ringMat.uniforms.uOpacity],
      { value: 0.0, duration: 0.1 },
      16.5,
    )
    .to(bloomPass, { strength: 4.0, duration: 0.3, ease: "power2.out" }, 16.5)
    .to(bloomPass, { strength: 1.5, duration: 2.5, ease: "power2.inOut" }, 16.8)

    // FASE 6 — Transição Final para o Login
    .to(camera.position, { z: 2.0, duration: 4.5, ease: "power4.in" }, 20.0)
    .to(bloomPass, { strength: 5.0, duration: 4.0, ease: "power2.in" }, 20.5)
    .to(
      "#void-transition",
      {
        opacity: 1,
        duration: 2.5,
        ease: "power2.inOut",
        onComplete: () => {
          window.location.href = "login.php";
        },
      },
      22.0,
    );
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
