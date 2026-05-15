function normalizarBusca(texto) {
    return (texto || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function setPanelVisibility(panel, open) {
    if (!panel) return;
    const shouldOpen = typeof open === 'boolean' ? open : panel.hidden;
    panel.hidden = !shouldOpen;
}

function toggleNovoAutor(open) {
    setPanelVisibility(document.getElementById('div_novo_autor'), open);
}

function toggleNovaEditora(open) {
    setPanelVisibility(document.getElementById('div_nova_editora'), open);
}

function toggleNovaCategoria(open) {
    setPanelVisibility(document.getElementById('div_nova_categoria'), open);
}

function setInlineFeedback(id, message, type = '') {
    const feedback = document.getElementById(id);
    if (!feedback) return;

    feedback.textContent = message || '';
    feedback.hidden = !message;
    feedback.classList.remove('ok', 'erro', 'loading');

    if (type) {
        feedback.classList.add(type);
    } else if (message) {
        feedback.classList.add('loading');
    }
}

function setButtonLoading(button, loading, originalText) {
    if (!button) return;
    button.disabled = loading;
    button.dataset.originalText = originalText || button.dataset.originalText || button.textContent;
    button.textContent = loading ? 'Salvando...' : button.dataset.originalText;
}

function adicionarOpcaoSelecionada(selectId, id, nome) {
    const select = document.getElementById(selectId);
    if (!select || !id) return;

    const value = String(id);
    let option = Array.from(select.options).find((item) => item.value === value);

    if (!option) {
        option = new Option(nome, value, true, true);
        select.add(option);
    }

    option.selected = true;
    select.dispatchEvent(new Event('change', { bubbles: true }));
}

function obterToastStack() {
    let stack = document.getElementById('adm-toast-stack');

    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'adm-toast-stack';
        stack.setAttribute('aria-live', 'polite');
        stack.setAttribute('aria-atomic', 'false');
        document.body.appendChild(stack);
    }

    return stack;
}

function iconeToast(type) {
    if (type === 'erro') return 'fa-solid fa-triangle-exclamation';
    if (type === 'alerta') return 'fa-solid fa-clock-rotate-left';
    return 'fa-solid fa-circle-check';
}

function ativarToast(toast, tempo = 4600) {
    if (!toast) return;

    const stack = obterToastStack();

    if (!stack.contains(toast)) {
        stack.appendChild(toast);
    }

    const antigos = Array.from(stack.querySelectorAll('.cosmic-toast'));
    antigos.slice(0, Math.max(0, antigos.length - 4)).forEach((item) => item.remove());

    const fechar = toast.querySelector('.toast-close');
    let timer = null;

    const remover = () => {
        clearTimeout(timer);
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 380);
    };

    if (fechar) {
        fechar.addEventListener('click', remover, { once: true });
    }

    requestAnimationFrame(() => toast.classList.add('show'));
    timer = setTimeout(remover, tempo);
}

function mostrarToastLocal(message, type = 'sucesso', title = '') {
    if (!message) return;

    const toastLocal = document.createElement('div');
    toastLocal.className = `cosmic-toast local-toast ${type}`;
    toastLocal.setAttribute('role', type === 'erro' ? 'alert' : 'status');
    toastLocal.setAttribute('aria-live', type === 'erro' ? 'assertive' : 'polite');
    toastLocal.setAttribute('aria-atomic', 'true');

    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.innerHTML = `<i class="${iconeToast(type)}"></i>`;

    const content = document.createElement('div');
    content.className = 'toast-content';

    if (title) {
        const strong = document.createElement('strong');
        strong.textContent = title;
        content.appendChild(strong);
    }

    const span = document.createElement('span');
    span.textContent = message;
    content.appendChild(span);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Fechar aviso');
    close.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    const progress = document.createElement('div');
    progress.className = 'toast-progress';

    toastLocal.append(icon, content, close, progress);
    ativarToast(toastLocal, type === 'erro' ? 6200 : 4200);
}

function getAdminEndpoint(action) {
    const script = document.currentScript || Array.from(document.scripts).find((item) => (item.src || '').includes('/assets/js/pgadm.js'));
    const scriptSrc = script?.src || '';
    const basePath = scriptSrc.includes('/assets/js/pgadm.js')
        ? scriptSrc.split('/assets/js/pgadm.js')[0]
        : `${window.location.origin}/Biblioteca-Andromeda`;

    const endpoint = new URL(`${basePath}/adm`, window.location.origin);
    endpoint.searchParams.set('action', action);
    return endpoint.toString();
}

async function postInlineEntity(action, payload) {
    const endpoint = new URL(getAdminEndpoint(action));
    endpoint.searchParams.set('ajax', '1');

    const response = await fetch(endpoint.toString(), {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams(payload)
    });

    const raw = await response.text();
    let data = null;

    try {
        data = JSON.parse(raw);
    } catch (error) {
        const inicioJson = raw.indexOf('{');
        const fimJson = raw.lastIndexOf('}');

        if (inicioJson !== -1 && fimJson !== -1 && fimJson > inicioJson) {
            try {
                data = JSON.parse(raw.slice(inicioJson, fimJson + 1));
            } catch (fallbackError) {
                console.error('Resposta AJAX não interpretável:', raw);
            }
        } else {
            console.error('Resposta inesperada:', raw);
        }

        if (!data) {
            if (raw.includes('<!DOCTYPE') || raw.includes('<html')) {
                throw new Error('Sua sessão pode ter expirado. Recarregue a página e tente novamente.');
            }
            throw new Error('Não foi possível concluir agora. Recarregue a página e tente novamente.');
        }
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Não foi possível concluir o cadastro.');
    }

    return data;
}

async function salvarNovoAutor(event) {
    const button = event?.currentTarget;
    const nome = document.getElementById('novo_autor_nome')?.value.trim() || '';
    const descricao = document.getElementById('novo_autor_descricao')?.value.trim() || '';
    const nacionalidade = document.getElementById('novo_autor_nacionalidade')?.value.trim() || '';

    if (!nome) {
        setInlineFeedback('novoAutorFeedback', 'Informe o nome do autor.', 'erro');
        return;
    }

    setInlineFeedback('novoAutorFeedback', 'Salvando autor...', '');
    setButtonLoading(button, true, 'Salvar autor');

    try {
        const data = await postInlineEntity('novo_autor', { nome, descricao, nacionalidade });
        adicionarOpcaoSelecionada('id_autor', data.id, data.nome);
        ['novo_autor_nome', 'novo_autor_descricao', 'novo_autor_nacionalidade'].forEach((id) => {
            const field = document.getElementById(id);
            if (field) field.value = '';
        });
        setInlineFeedback('novoAutorFeedback', data.message, 'ok');
        toggleNovoAutor(false);
        mostrarToastLocal(data.message || 'Autor adicionado com sucesso.', 'sucesso', 'Autor salvo');
    } catch (error) {
        setInlineFeedback('novoAutorFeedback', error.message, 'erro');
        mostrarToastLocal(error.message, 'erro', 'Ação não concluída');
    } finally {
        setButtonLoading(button, false, 'Salvar autor');
    }
}

async function salvarNovaEditora(event) {
    const button = event?.currentTarget;
    const nome = document.getElementById('nova_editora_nome')?.value.trim() || '';
    const descricao = document.getElementById('nova_editora_descricao')?.value.trim() || '';

    if (!nome) {
        setInlineFeedback('novaEditoraFeedback', 'Informe o nome da editora.', 'erro');
        return;
    }

    setInlineFeedback('novaEditoraFeedback', 'Salvando editora...', '');
    setButtonLoading(button, true, 'Salvar editora');

    try {
        const data = await postInlineEntity('nova_editora', { nome, descricao });
        adicionarOpcaoSelecionada('id_editora', data.id, data.nome);
        ['nova_editora_nome', 'nova_editora_descricao'].forEach((id) => {
            const field = document.getElementById(id);
            if (field) field.value = '';
        });
        setInlineFeedback('novaEditoraFeedback', data.message, 'ok');
        toggleNovaEditora(false);
        mostrarToastLocal(data.message || 'Editora adicionada com sucesso.', 'sucesso', 'Editora salva');
    } catch (error) {
        setInlineFeedback('novaEditoraFeedback', error.message, 'erro');
        mostrarToastLocal(error.message, 'erro', 'Ação não concluída');
    } finally {
        setButtonLoading(button, false, 'Salvar editora');
    }
}

async function salvarNovaCategoria(event) {
    const button = event?.currentTarget;
    const nome = document.getElementById('nova_categoria_nome')?.value.trim() || '';

    if (!nome) {
        setInlineFeedback('novaCategoriaFeedback', 'Informe o nome da categoria.', 'erro');
        return;
    }

    setInlineFeedback('novaCategoriaFeedback', 'Salvando categoria...', '');
    setButtonLoading(button, true, 'Salvar categoria');

    try {
        const data = await postInlineEntity('nova_categoria', { nome });
        adicionarOpcaoSelecionada('id_categoria', data.id, data.nome);
        const field = document.getElementById('nova_categoria_nome');
        if (field) field.value = '';
        setInlineFeedback('novaCategoriaFeedback', data.message, 'ok');
        toggleNovaCategoria(false);
        mostrarToastLocal(data.message || 'Categoria adicionada com sucesso.', 'sucesso', 'Categoria salva');
    } catch (error) {
        setInlineFeedback('novaCategoriaFeedback', error.message, 'erro');
        mostrarToastLocal(error.message, 'erro', 'Ação não concluída');
    } finally {
        setButtonLoading(button, false, 'Salvar categoria');
    }
}

function inicializarBuscaAcervo() {
    const acervoSearch = document.getElementById('acervoSearch');
    const clearAcervoSearch = document.getElementById('clearAcervoSearch');
    const acervoRows = Array.from(document.querySelectorAll('[data-acervo-row]'));
    const acervoNoResults = document.getElementById('acervoNoResults');
    const acervoSearchCount = document.getElementById('acervoSearchCount');

    if (!acervoSearch) return;

    const cacheBusca = new Map();

    acervoRows.forEach((row) => {
        const dataBusca = row.getAttribute('data-acervo-search') || '';
        const textoCelulas = Array.from(row.querySelectorAll('td'))
            .filter((cell) => !/ações|acao|ação/i.test(cell.getAttribute('data-label') || ''))
            .map((cell) => cell.textContent || '')
            .join(' ');

        cacheBusca.set(row, normalizarBusca(`${dataBusca} ${textoCelulas}`));
    });

    function alternarLinha(row, visivel) {
        if (row.hidden === !visivel) return;
        row.hidden = !visivel;
        row.classList.toggle('is-hidden-by-search', !visivel);
        row.setAttribute('aria-hidden', visivel ? 'false' : 'true');
    }

    let rafId = 0;

    function filtrarAcervo() {
        rafId = 0;
        const termo = normalizarBusca(acervoSearch.value);
        let totalVisivel = 0;

        acervoRows.forEach((row) => {
            const encontrou = termo === '' || (cacheBusca.get(row) || '').includes(termo);
            alternarLinha(row, encontrou);
            if (encontrou) totalVisivel++;
        });

        if (acervoSearchCount) acervoSearchCount.textContent = totalVisivel;
        if (acervoNoResults) acervoNoResults.hidden = totalVisivel !== 0 || acervoRows.length === 0;
        if (clearAcervoSearch) clearAcervoSearch.hidden = termo.length === 0;
    }

    function agendarFiltro() {
        if (rafId) return;
        rafId = requestAnimationFrame(filtrarAcervo);
    }

    ['input', 'keyup', 'change', 'search'].forEach((eventName) => {
        acervoSearch.addEventListener(eventName, agendarFiltro, { passive: true });
    });

    if (clearAcervoSearch) {
        clearAcervoSearch.addEventListener('click', () => {
            acervoSearch.value = '';
            acervoSearch.focus();
            agendarFiltro();
        });
    }

    filtrarAcervo();
}

function inicializarFiltrosMetadados() {
    document.querySelectorAll('[data-meta-search-input]').forEach((input) => {
        const card = input.closest('.metadata-card');
        const rows = Array.from(card?.querySelectorAll('[data-meta-row]') || []);
        const noResults = card?.querySelector('.metadata-no-results');
        const cacheBusca = new Map(rows.map((row) => [row, normalizarBusca(row.textContent)]));
        let rafId = 0;

        const filtrar = () => {
            rafId = 0;
            const termo = normalizarBusca(input.value);
            let visiveis = 0;

            rows.forEach((row) => {
                const encontrou = termo === '' || (cacheBusca.get(row) || '').includes(termo);
                if (row.hidden !== !encontrou) row.hidden = !encontrou;
                if (encontrou) visiveis++;
            });

            if (noResults) noResults.hidden = visiveis !== 0 || rows.length === 0;
        };

        const agendarFiltro = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(filtrar);
        };

        input.addEventListener('input', agendarFiltro, { passive: true });
        filtrar();
    });
}


function inicializarNavbarAdm() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 850;
    if (isTouch) return;

    let closeTimer = null;

    const abrir = () => {
        window.clearTimeout(closeTimer);
        nav.classList.add('is-expanded');
    };

    const fechar = () => {
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
            if (!nav.matches(':hover') && !nav.contains(document.activeElement)) {
                nav.classList.remove('is-expanded');
            }
        }, 90);
    };

    nav.addEventListener('mouseenter', abrir);
    nav.addEventListener('mouseleave', fechar);
    nav.addEventListener('focusin', abrir);
    nav.addEventListener('focusout', fechar);

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            nav.classList.remove('is-expanded');
        });
    });
}

function inicializarCursorMagnetico() {
    const reticle = document.getElementById('reticle');
    const dot = document.getElementById('reticle-dot');
    const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;

    if (!reticle || !dot || isTouch) {
        document.documentElement.classList.remove('admin-magnetic-cursor');
        return;
    }

    document.documentElement.classList.add('admin-magnetic-cursor');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let dotX = targetX;
    let dotY = targetY;
    let hovered = null;
    let rafId = 0;
    let active = true;
    let primeiroMovimento = true;

    const magneticSelector = 'a, button, input, textarea, select, label, .nav-item, .btn-action, .btn-sec, .btn-prim, .section-action, .metadata-row, .cosmic-input';

    function posicionar() {
        currentX += (targetX - currentX) * 0.88;
        currentY += (targetY - currentY) * 0.88;
        dotX = targetX;
        dotY = targetY;

        reticle.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
        dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;

        if (active) rafId = requestAnimationFrame(posicionar);
    }

    function iniciarLoop() {
        if (rafId) return;
        active = true;
        rafId = requestAnimationFrame(posicionar);
    }

    function pararLoop() {
        active = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
    }

    function setHover(element) {
        if (hovered === element) return;
        if (hovered) hovered.classList.remove('is-magnetic-hover');
        hovered = element;
        reticle.classList.toggle('is-hovering', !!element);
        dot.classList.toggle('is-hovering', !!element);
        if (hovered) hovered.classList.add('is-magnetic-hover');
    }

    window.addEventListener('pointermove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;

        if (primeiroMovimento) {
            primeiroMovimento = false;
            currentX = targetX;
            currentY = targetY;
            dotX = targetX;
            dotY = targetY;
        }
    }, { passive: true });

    document.addEventListener('pointerover', (event) => {
        setHover(event.target.closest(magneticSelector));
    }, { passive: true });

    document.addEventListener('pointerout', (event) => {
        if (!hovered) return;
        const next = event.relatedTarget;
        if (next && hovered.contains(next)) return;
        setHover(null);
    }, { passive: true });

    window.addEventListener('mousedown', () => {
        reticle.classList.add('is-pressing');
        dot.classList.add('is-pressing');
    });

    window.addEventListener('mouseup', () => {
        reticle.classList.remove('is-pressing');
        dot.classList.remove('is-pressing');
    });

    window.addEventListener('mouseleave', () => {
        reticle.classList.add('is-hidden');
        dot.classList.add('is-hidden');
        setHover(null);
    });

    window.addEventListener('mouseenter', () => {
        reticle.classList.remove('is-hidden');
        dot.classList.remove('is-hidden');
    });

    document.addEventListener('focusin', (event) => {
        setHover(event.target.closest(magneticSelector));
    });

    document.addEventListener('focusout', () => {
        setHover(null);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pararLoop();
        else iniciarLoop();
    });

    iniciarLoop();
}


function inicializarConfirmacoesAdm() {
    const overlay = document.getElementById('adm-confirm-overlay');
    if (!overlay) return;

    const dialog = overlay.querySelector('.adm-confirm-dialog');
    const titleEl = document.getElementById('adm-confirm-title');
    const messageEl = document.getElementById('adm-confirm-message');
    const orbEl = document.getElementById('adm-confirm-orb');
    const cancelBtn = overlay.querySelector('[data-confirm-cancel]');
    const okBtn = overlay.querySelector('[data-confirm-ok]');
    let onConfirm = null;
    let lastFocus = null;

    const icons = {
        danger: 'fa-trash-can',
        warning: 'fa-user-minus',
        success: 'fa-circle-check',
        info: 'fa-circle-info'
    };

    function abrirConfirmacao(opcoes, callback) {
        lastFocus = document.activeElement;
        onConfirm = callback;

        const variant = opcoes.variant || 'info';
        titleEl.textContent = opcoes.title || 'Confirmar ação';
        messageEl.textContent = opcoes.message || 'Deseja continuar?';
        okBtn.textContent = opcoes.ok || 'Confirmar';
        dialog.dataset.variant = variant;
        orbEl.innerHTML = `<i class="fa-solid ${icons[variant] || icons.info}" aria-hidden="true"></i>`;

        overlay.hidden = false;
        document.documentElement.classList.add('adm-confirm-lock');
        requestAnimationFrame(() => overlay.classList.add('is-open'));
        setTimeout(() => cancelBtn.focus({ preventScroll: true }), 80);
    }

    function fecharConfirmacao() {
        overlay.classList.remove('is-open');
        document.documentElement.classList.remove('adm-confirm-lock');
        const focoAnterior = lastFocus;
        onConfirm = null;
        setTimeout(() => {
            overlay.hidden = true;
            if (focoAnterior && typeof focoAnterior.focus === 'function') {
                focoAnterior.focus({ preventScroll: true });
            }
        }, 220);
    }

    function confirmar() {
        const callback = onConfirm;
        overlay.classList.remove('is-open');
        document.documentElement.classList.remove('adm-confirm-lock');
        onConfirm = null;
        setTimeout(() => {
            overlay.hidden = true;
            if (typeof callback === 'function') callback();
        }, 180);
    }

    function lerOpcoes(elemento) {
        return {
            title: elemento.dataset.confirmTitle,
            message: elemento.dataset.confirmMessage,
            ok: elemento.dataset.confirmOk,
            variant: elemento.dataset.confirmVariant
        };
    }

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-confirm-message]');
        if (!link) return;
        event.preventDefault();
        abrirConfirmacao(lerOpcoes(link), () => {
            window.location.href = link.href;
        });
    });

    document.addEventListener('submit', (event) => {
        const form = event.target.closest('form[data-confirm-message]');
        if (!form || form.dataset.confirmed === '1') return;
        event.preventDefault();
        abrirConfirmacao(lerOpcoes(form), () => {
            form.dataset.confirmed = '1';
            HTMLFormElement.prototype.submit.call(form);
        });
    });

    cancelBtn.addEventListener('click', fecharConfirmacao);
    okBtn.addEventListener('click', confirmar);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) fecharConfirmacao();
    });

    document.addEventListener('keydown', (event) => {
        if (overlay.hidden) return;
        if (event.key === 'Escape') fecharConfirmacao();
        if (event.key === 'Enter' && document.activeElement === okBtn) confirmar();
    });
}

function inicializarToast() {
    document.querySelectorAll('.cosmic-toast').forEach((toast) => {
        ativarToast(toast, toast.classList.contains('erro') ? 6200 : 4800);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarNavbarAdm();
    inicializarCursorMagnetico();
    inicializarBuscaAcervo();
    inicializarFiltrosMetadados();
    inicializarConfirmacoesAdm();
    inicializarToast();
});
