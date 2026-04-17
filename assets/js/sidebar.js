document.getElementById('open_btn').addEventListener('click', function() {document.getElementById('sidebar').classList.toggle('open_sidebar');});

// Configuração do Starfield
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

// Ajusta o tamanho do canvas para o tamanho da janela
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Cria uma lista de estrelas com posições e velocidades aleatórias
function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.5, // Estrelas um pouco maiores (0.5 a 2.0)
            speed: Math.random() * 0.8 + 0.2, // Velocidades variadas para não piscarem juntas
            phase: Math.random() * Math.PI * 2,
            minOp: 0.1, // Opacidade mínima fixa para ficarem sempre visíveis
        });
    }
}

// Desenha e anima as estrelas
function drawStars(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o frame anterior
    
    stars.forEach(s => {
        // Calcula a opacidade atual para criar o efeito de "piscar"
     const op = s.minOp + (1 - s.minOp) * (0.5 + 0.5 * Math.sin(t * 0.01 * s.speed + s.phase));
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${op})`;
        ctx.fill();
    });
    
    requestAnimationFrame(drawStars);
}

// Inicialização
window.addEventListener('resize', () => {
    resize();
    createStars(160);
});

resize();
createStars(160); // 160 estrelas na tela
requestAnimationFrame(drawStars);