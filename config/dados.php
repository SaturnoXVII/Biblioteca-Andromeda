
async function loadCatalog() {
    try {
        const response = await fetch('dados.php'); // Chama o seu arquivo PHP
        const booksData = await response.json();

        if (booksData.error) {
            console.error("Erro no banco:", booksData.error);
            return;
        }

        // Chama a função de criação de livros passando os dados do banco
        initCatalog(booksData);
        
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

function initCatalog(data) {
    data.forEach((item) => {
        const geo = new THREE.BoxGeometry(2.2, 3.2, 0.2);
        const mat = new THREE.MeshPhysicalMaterial({
            map: loader.load(item.cover),
            metalness: 0.6,
            roughness: 0.3,
            emissive: new THREE.Color(0x001122),
            emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(parseFloat(item.x), 0, 0);
        mesh.userData = { title: item.title, desc: item.desc }; 
        
        bookGroup.add(mesh);
        books.push(mesh);
    });
}

// Chame a função de carregar no lugar de onde criava os livros antes
loadCatalog();