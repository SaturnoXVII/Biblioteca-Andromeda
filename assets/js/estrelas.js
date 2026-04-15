(function () {
    const container = document.getElementById('estrelas');
    if (!container) return;

    const QUANTIDADE = 100;

    for (let i = 0; i < QUANTIDADE; i++) {
        const estrela = document.createElement('div');
        estrela.className = 'estrela';

        const tamanho  = Math.random() * 2.5 + 0.5;
        const x        = Math.random() * 100;
        const y        = Math.random() * 100;
        const duracao  = (Math.random() * 1 + 2).toFixed(1);
        const delay    = (Math.random() * 6).toFixed(1);
        const opacidade = (Math.random() * 0.6 + 0.2).toFixed(2);

        estrela.style.cssText = `
            width: ${tamanho}px;
            height: ${tamanho}px;
            top: ${y}%;
            left: ${x}%;
            --d: ${duracao}s;
            --delay: ${delay}s;
            --o: ${opacidade};
        `;

        container.appendChild(estrela);
    }
})();