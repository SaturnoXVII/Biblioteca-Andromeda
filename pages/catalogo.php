session_start();

include_once (../config/conexao.php);
include_once (../config/dados.php)


<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda | Catálogo Estelar</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: 'Segoe UI', sans-serif; color: white; }
        #canvas { position: fixed; top: 0; left: 0; }
        
        /* Navbar Minimalista */
        .navbar {
            backdrop-filter: blur(15px);
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10;
        }

        /* Painel Lateral Glassmorphism */
        #panel {
            position: fixed;
            right: 0;
            top: 0;
            width: 400px;
            height: 100%;
            background: rgba(10, 10, 20, 0.7);
            backdrop-filter: blur(30px);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            padding: 40px;
            transform: translateX(100%);
            transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
            z-index: 20;
            display: flex;
            flex-direction: column;
        }

        #panel.active { transform: translateX(0); }

        .btn-close-custom {
            cursor: pointer;
            color: #aaa;
            align-self: flex-end;
            transition: 0.3s;
        }
        .btn-close-custom:hover { color: #fff; transform: rotate(90deg); }

        .book-title { font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 20px; color: #00d4ff; }
        .book-desc { line-height: 1.6; color: #ccc; margin-top: 20px; }
        
        #instructions {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem;
            color: rgba(255,255,255,0.4);
            pointer-events: none;
        }
    </style>
</head>
<body>

<canvas id="canvas"></canvas>

<nav class="navbar fixed-top px-4">
    <span class="navbar-brand text-white fw-light">ANDRÔMEDA <small style="font-size: 0.6rem; opacity: 0.5;">SISTEMA DE ARQUIVOS</small></span>
</nav>

<div id="panel">
    <div class="btn-close-custom" onclick="closePanel()">✕ FECHAR</div>
    <h1 id="title" class="book-title">Título do Livro</h1>
    <hr style="border-color: rgba(255,255,255,0.1)">
    <p id="desc" class="book-desc">Descrição do exemplar literário carregada dinamicamente...</p>
    <button class="btn btn-outline-info mt-auto">LER AGORA</button>
</div>

<div id="instructions">SCROLL PARA ZOOM • CLIQUE PARA EXPLORAR</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/examples/js/postprocessing/EffectComposer.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/examples/js/postprocessing/RenderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/examples/js/postprocessing/UnrealBloomPass.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

<script>
// ==========================================
// 1. CONFIGURAÇÃO DE DADOS (PRONTO PARA PHP)
// ==========================================
// No PHP, você usaria: const booksData = <?php echo json_encode($resultados_db); ?>;
const booksData = [
    { id: 1, title: "O Horizonte de Eventos", desc: "Uma exploração profunda sobre a física dos buracos negros e o destino da informação.", cover: "https://picsum.photos/400/600?1", x: -6 },
    { id: 2, title: "Arquivos de Andrômeda", desc: "Relatórios perdidos de uma civilização que habitou a galáxia vizinha há bilhões de anos.", cover: "https://picsum.photos/400/600?2", x: 0 },
    { id: 3, title: "Nébula de Orion", desc: "O berçário de estrelas visto por olhos humanos pela primeira vez em alta resolução.", cover: "https://picsum.photos/400/600?3", x: 6 }
];

// ==========================================
// 2. SETUP DA CENA
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const loader = new THREE.TextureLoader();
const books = [];

// ==========================================
// 3. SHADER DE FUNDO (NEBULOSA)
// ==========================================
const bgMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
        u_mouse: { value: new THREE.Vector2() }
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: `
        precision highp float;
        uniform vec2 u_resolution; uniform float u_time; uniform vec2 u_mouse;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){
            vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
            return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p){
            float v=0.0; float a=.5;
            for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.; a*=.5; }
            return v;
        }
        void main(){
            vec2 uv=gl_FragCoord.xy/u_resolution.xy;
            vec2 p=uv*2.-1.; p.x*=u_resolution.x/u_resolution.y;
            float t=u_time*.05;
            vec2 q=vec2(fbm(p+t), fbm(p+vec2(4)+t));
            vec2 r=vec2(fbm(p+4.*q+vec2(1.7,9.2)+t), fbm(p+4.*q+vec2(8.3,2.8)+t));
            float f=fbm(p+r);
            vec3 col=mix(vec3(.01,0.,.05), vec3(.1,0.,.3), f);
            col=mix(col, vec3(0.,.2,.4), length(q));
            col+=vec3(1.,.4,.1)*pow(f,3.);
            gl_FragColor=vec4(col,1.);
        }
    `
});
const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
scene.add(bgMesh);

// ==========================================
// 4. POEIRA ESTELAR (PARTÍCULAS)
// ==========================================
const starGeo = new THREE.BufferGeometry();
const starCount = 2000;
const posArray = new Float32Array(starCount * 3);
for(let i=0; i<starCount*3; i++) posArray[i] = (Math.random() - 0.5) * 20;
starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starMat = new THREE.PointsMaterial({ size: 0.02, color: 0xffffff, transparent: true, opacity: 0.5 });
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// ==========================================
// 5. CRIAÇÃO DO CATÁLOGO DINÂMICO
// ==========================================
const bookGroup = new THREE.Group();
scene.add(bookGroup);

booksData.forEach((data) => {
    const geo = new THREE.BoxGeometry(2.2, 3.2, 0.2);
    const mat = new THREE.MeshPhysicalMaterial({
        map: loader.load(data.cover),
        metalness: 0.6,
        roughness: 0.3,
        emissive: new THREE.Color(0x001122),
        emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(data.x, 0, 0);
    mesh.userData = { title: data.title, desc: data.desc }; // Armazena dados no objeto 3D
    bookGroup.add(mesh);
    books.push(mesh);
});

// Luzes para realçar os livros
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0x00d4ff, 2);
pointLight.position.set(0, 5, 5);
scene.add(pointLight);

// ==========================================
// 6. INTERAÇÃO E RAYCASTING
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", e => {
    // Não disparar se clicar no painel
    if(e.target.closest('#panel')) return;

    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(books);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        selectBook(obj);
    } else {
        closePanel();
    }
});

function selectBook(obj) {
    // Atualiza Conteúdo
    document.getElementById("title").innerText = obj.userData.title;
    document.getElementById("desc").innerText = obj.userData.desc;
    document.getElementById("panel").classList.add("active");

    // Animação Cinematográfica
    gsap.to(camera.position, { x: obj.position.x, y: 0, z: 5, duration: 1.5, ease: "expo.out" });
    gsap.to(obj.rotation, { y: Math.PI * 2, duration: 2, ease: "back.out(1.7)" });
    
    // Escurece os outros
    books.forEach(b => {
        if(b !== obj) gsap.to(b.material, { opacity: 0.3, transparent: true, duration: 1 });
        else gsap.to(b.material, { opacity: 1, duration: 1 });
    });
}

function closePanel() {
    document.getElementById("panel").classList.remove("active");
    gsap.to(camera.position, { x: 0, y: 0, z: 10, duration: 1.5, ease: "expo.out" });
    books.forEach(b => gsap.to(b.material, { opacity: 1, duration: 1 }));
}

// Zoom suave no scroll
window.addEventListener("wheel", e => {
    const targetZ = camera.position.z + e.deltaY * 0.005;
    gsap.to(camera.position, { z: THREE.MathUtils.clamp(targetZ, 3, 15), duration: 0.5 });
});

// Cursor interativo
window.addEventListener("mousemove", e => {
    bgMaterial.uniforms.u_mouse.value.set(e.clientX, innerHeight - e.clientY);
});

// ==========================================
// 7. PÓS-PROCESSAMENTO E LOOP
// ==========================================
const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.2, 0.4, 0.85);
composer.addPass(bloomPass);

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    
    bgMaterial.uniforms.u_time.value = time;
    
    // Animação sutil dos livros (flutuação)
    books.forEach((b, i) => {
        if(!document.getElementById("panel").classList.contains("active")) {
            b.rotation.y += 0.005;
            b.position.y = Math.sin(time + i) * 0.2;
        }
    });

    // Movimento sutil da poeira
    starField.rotation.y += 0.0005;

    composer.render();
}
animate();

// Resize
window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    bgMaterial.uniforms.u_resolution.value.set(innerWidth, innerHeight);
});
</script>
</body>
</html>