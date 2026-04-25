<?php
session_start();
require_once "../config/conexao.php";
require_once "../config/dados.php";
require_once "../config/crud.php";
$mysqli->set_charset("utf8mb4");

$reservaMessage = null;
$reservaType = 'success';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'reservar_livro') {
    if (empty($_SESSION['id_usuario'])) {
        $reservaMessage = 'Faça login para reservar obras.';
        $reservaType = 'danger';
    } else {
        $idLivro = (int) ($_POST['livro_id'] ?? 0);
        $livro = buscarLivroPorId($mysqli, $idLivro);

        if (!$livro) {
            $reservaMessage = 'Livro não encontrado.';
            $reservaType = 'danger';
        } elseif ($livro['quantidade'] > 0) {
            $reservaMessage = 'Este livro está disponível. Faça o empréstimo em vez de reservar.';
            $reservaType = 'warning';
        } elseif (jaReservado($mysqli, $idLivro, (int) $_SESSION['id_usuario'])) {
            $reservaMessage = 'Você já possui uma reserva ativa para este livro.';
            $reservaType = 'warning';
        } elseif (criarReserva($mysqli, $idLivro, (int) $_SESSION['id_usuario'])) {
            $reservaMessage = 'Reserva registrada com sucesso! Assim que o livro retornar, você poderá retirá-lo.';
            $reservaType = 'success';
        } else {
            $reservaMessage = 'Não foi possível completar a reserva. Tente novamente mais tarde.';
            $reservaType = 'danger';
        }
    }
}

$repo = new \App\Repository\LivroRepository($mysqli);
try {
    $livros = $repo->listarTodos();
   
} catch (Exception $e) {
    die("Erro: " . htmlspecialchars($e->getMessage()));
}

$livros    = $livros ?? [];
$livrosJson = json_encode($livros, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '[]';
$totalLivros = count($livros);
$categorias  = array_values(array_filter(array_unique(array_column($livros, 'categoria_nome'))));
$totalCats   = count($categorias);

// Carrega reservas do usuário se estiver logado
$minhasReservas = [];
if (!empty($_SESSION['id_usuario'])) {
    $minhasReservas = listarReservasUsuario($mysqli, (int) $_SESSION['id_usuario']);
}
$minhasReservasJson = json_encode($minhasReservas, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '[]';
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda · Catálogo Cósmico</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../assets/css/catalogo.css">
</head>

<body>

    <div id="intro-cinematic">
        <div class="intro-mask">
            <h1 class="intro-brand" id="i-brand">ANDRÔMEDA</h1>
        </div>
        <p class="intro-tagline" id="i-tag">Catálogo Cósmico</p>
    </div>

    <div id="grain"></div>
    <div id="canvas-dim"></div>
    <div id="webgl"></div>
    <?php if ($reservaMessage): ?>
    <div class="alert alert-<?= htmlspecialchars($reservaType, ENT_QUOTES, 'UTF-8') ?>" role="alert" style="position:fixed;top:80px;right:20px;z-index:2000;min-width:260px;padding:12px 16px;border-radius:4px;">
        <?= htmlspecialchars($reservaMessage, ENT_QUOTES, 'UTF-8') ?>
    </div>
    <?php endif; ?>

    <div id="reticle">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="14" class="ret-ring" stroke-dasharray="88" stroke-dashoffset="0">
                <animateTransform attributeName="transform" type="rotate" values="0 18 18;360 18 18" dur="18s" repeatCount="indefinite" />
            </circle>
            <line x1="18" y1="4" x2="18" y2="10" class="ret-cross" />
            <line x1="18" y1="26" x2="18" y2="32" class="ret-cross" />
            <line x1="4" y1="18" x2="10" y2="18" class="ret-cross" />
            <line x1="26" y1="18" x2="32" y2="18" class="ret-cross" />
            <circle cx="18" cy="18" r="1.5" fill="rgba(42, 162, 246, 0.6)" />
        </svg>
    </div>
    <div id="reticle-dot"></div>

    <div id="tip"><span class="tip-cat" id="tip-cat"></span><span class="tip-title" id="tip-title"></span><span class="tip-author" id="tip-author"></span></div>
    <div id="cat-label"></div>
    <div id="fly-label"></div>

    <nav id="nav">
        <div class="nav-logo">
            <span class="nav-logo-text">Andrômeda</span>
        </div>
        <div class="nav-sec">
            <a href="catalogo.php" class="nav-item active"><i class="fa-solid fa-layer-group"></i><span>Catálogo</span></a>
            <a href="perfil.php" class="nav-item"><i class="fa-solid fa-user-astronaut"></i><span>Meu Perfil</span></a>
            <a href="emprestimos.php" class="nav-item"><i class="fa-solid fa-bookmark"></i><span>Empréstimos</span></a>
            <a href="#" class="nav-item" id="nav-reservas" onclick="event.preventDefault(); abrirPainelReservas();"><i class="fa-solid fa-clock-rotate-left"></i><span>Reservas</span></a>
        </div>
        <div class="nav-foot">
            <a href="index.php" class="nav-item"><i class="fa-solid fa-rocket"></i><span>Início</span></a>
            <a href="logout.php" class="nav-item"><i class="fa-solid fa-right-from-bracket"></i><span>Sair</span></a>
        </div>
    </nav>

    <div id="hud">
        <div class="hud-search">
            <i class="fa-solid fa-search" style="color: var(--text-dim)"></i>
            <input id="q" type="text" placeholder="Buscar no cosmos..." autocomplete="off">
            <span class="search-count" id="search-count"></span>
        </div>

        <button class="hud-btn" id="btn-systems">
            <i class="fa-solid fa-bars-staggered"></i> <span id="sys-active-label">Todas Constelações</span>
        </button>

        <div class="view-tog">
            <button id="btn-gal" class="on" title="Visão Galáctica 3D"><i class="fa-solid fa-vr-cardboard"></i> 3D</button>
            <button id="btn-ed" title="Catálogo Editorial"><i class="fa-solid fa-border-all"></i> Catálogo</button>
            <span style="width: 1px; background: var(--border-hairline); margin: 0 4px;"></span>
            <button id="btn-eco" title="Desliga 3D para leitura fluida"><i class="fa-solid fa-leaf"></i> Modo Eco</button>
        </div>
    </div>

    <div id="systems-menu">
        <div class="sys-item on" data-c="all">
            <div class="sys-dot" style="color: var(--am3)"></div>Todas Constelações
        </div>
    </div>

    <div id="hud-bot">
        <span><i class="fa-solid fa-book" style="color:var(--am)"></i> <strong><?= $totalLivros ?></strong> obras</span>
        <span><i class="fa-solid fa-layer-group" style="color:var(--am)"></i> <strong><?= $totalCats ?></strong> sistemas</span>
        <span id="scroll-hint"><i class="fa-solid fa-computer-mouse"></i> Scroll &middot; Zoom</span>
    </div>

    <div id="depth">
        <span class="depth-lbl">Orbital</span>
        <div class="depth-track">
            <div class="depth-dot" id="ddot"></div>
        </div>
        <span class="depth-lbl">Galáxia</span>
    </div>

    <div id="book-panel">
        <div class="bp-art">
            <canvas id="bp-art-canvas"></canvas>
            <div class="bp-art-overlay"></div>
            <button class="bp-close" id="bp-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="bp-body">
            <div class="bp-header">
                <span class="bp-cat" id="bp-cat">—</span>
                <span class="sbadge s-unk" id="bp-status">—</span>
            </div>
            <h2 class="bp-title" id="bp-title">—</h2>
            <p class="bp-author" id="bp-author">—</p>
            <div class="bp-meta">
                <div class="bp-field"><label>Ano</label><span class="val" id="bp-year">—</span></div>
                <div class="bp-field"><label>Editora</label><span class="val" id="bp-pub">—</span></div>
            </div>
            <div class="bp-actions">
                <button class="btn-prim" id="bp-reserve">Abrir Arquivo</button>
                <button class="btn-sec" id="bp-expand"><i class="fa-solid fa-expand"></i></button>
            </div>
        </div>
    </div>

    <div id="modal-overlay">
        <div id="modal-drawer">
            <div class="md-cover">
                <canvas id="md-art-canvas"></canvas>
                <div class="md-cover-overlay"></div>
                <span class="md-cat-badge" id="md-cat-badge">—</span>
                <button class="md-close" id="modal-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="md-scroll">
                <div class="md-title-block">
                    <div class="md-status-row"><span class="sbadge s-unk" id="md-status">—</span></div>
                    <h2 class="md-title" id="md-title">—</h2>
                    <p class="md-author" id="md-author">—</p>
                </div>
                <div class="md-grid">
                    <div class="md-field"><label>Ano</label><span class="v" id="md-year">—</span></div>
                    <div class="md-field"><label>Editora</label><span class="v" id="md-pub">—</span></div>
                    <div class="md-field"><label>Categoria</label><span class="v" id="md-catv">—</span></div>
                    <div class="md-field"><label>Disponibilidade</label><span class="v" id="md-sv">—</span></div>
                </div>
                <p class="md-related-title">Obras Relacionadas</p>
                <div class="md-related-list" id="md-related"></div>
            </div>
            <div class="md-actions">
                <button class="btn-prim" id="md-reserve">Reservar Obra</button>
                <button class="btn-sec" id="md-wishlist" title="Salvar"><i class="fa-regular fa-bookmark"></i></button>
            </div>
        </div>
    </div>

    <div id="editorial-view">
        <div class="ed-header">
            <h1 class="ed-header-title">Universo <em>Literário</em></h1>
            <p class="ed-header-desc">
                Navegue pelo acervo completo. Mais de <?= $totalLivros ?> obras divididas em <?= $totalCats ?> constelações de conhecimento. <span id="ed-avail" style="color:var(--am); font-weight:bold;">—</span> disponíveis agora.
            </p>
        </div>

        <div class="ed-hero" id="ed-hero">
            <div class="ed-hero-art">
                <canvas id="ed-hero-canvas"></canvas>
                <span class="ed-hero-art-label">Destaque Editorial</span>
            </div>
            <div class="ed-hero-content">
                <div class="ed-hero-label">Destaque da Semana</div>
                <h2 class="ed-hero-title" id="ed-hero-title">—</h2>
                <p class="ed-hero-author" id="ed-hero-author">—</p>
                <div class="ed-hero-meta">
                    <span class="ed-hero-pill" id="ed-hero-cat">—</span>
                    <span class="ed-hero-pill" id="ed-hero-year">—</span>
                    <span class="sbadge s-unk" id="ed-hero-status">—</span>
                </div>
                <button class="btn-prim" style="max-width:200px" id="ed-hero-btn">Ver Detalhes</button>
            </div>
        </div>

        <div class="ed-filter-bar" id="ed-filter-bar">
            <button class="pill on" data-c="all" style="padding: 8px 16px; border-radius: 20px; font-size:.75rem; font-weight:600; background:var(--void-glass); border:1px solid var(--border-hairline); color:var(--text-dim); transition:.3s; cursor:none!important; text-transform:uppercase; letter-spacing:0.05em;">Todas as Constelações</button>
        </div>
        <div id="ed-sections"></div>
    </div>

    <form id="reserva-form" method="post" style="display:none;">
        <input type="hidden" name="action" value="reservar_livro">
        <input type="hidden" name="livro_id" id="reserva-livro-id" value="">
    </form>
    <div id="reservas-panel" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1999; overflow-y:auto;">
        <div style="max-width:600px; margin:80px auto; background:var(--void-glass); border:1px solid var(--border-hairline); border-radius:8px; padding:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0; color:var(--text); font-size:1.5rem;">Minhas Reservas</h2>
                <button onclick="fecharPainelReservas()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-dim);"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="reservas-lista-container" style="max-height:400px; overflow-y:auto;">
                <!-- Será preenchido por JavaScript -->
            </div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>

    <script>
        const LIVROS = <?php echo $livrosJson; ?>;
        const MINHAS_RESERVAS = <?php echo $minhasReservasJson; ?>;
        
        function abrirPainelReservas() {
            const panel = document.getElementById('reservas-panel');
            const container = document.getElementById('reservas-lista-container');
            
            if (MINHAS_RESERVAS.length === 0) {
                container.innerHTML = '<p style="color:var(--text-dim); text-align:center; padding:20px;">Você não possui reservas ativas.</p>';
            } else {
                container.innerHTML = MINHAS_RESERVAS.map(r => `
                    <div style="padding:12px; border-bottom:1px solid var(--border-hairline); margin-bottom:8px;">
                        <div style="color:var(--am); font-size:0.85rem; font-weight:600; margin-bottom:4px;">${r.categoria || '—'}</div>
                        <div style="color:var(--text); font-weight:600; margin-bottom:4px;">${r.titulo || '—'}</div>
                        <div style="color:var(--text-dim); font-size:0.85rem; margin-bottom:8px;">${r.autor || '—'}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                            <span style="color:var(--text-dim);">Reservado em: ${new Date(r.data_reserva).toLocaleDateString('pt-BR')}</span>
                            <span style="color:var(--am); font-weight:600;">${r.status_livro || '—'}</span>
                        </div>
                    </div>
                `).join('');
            }
            panel.style.display = 'block';
        }
        
        function fecharPainelReservas() {
            document.getElementById('reservas-panel').style.display = 'none';
        }
        
        document.getElementById('reservas-panel').addEventListener('click', function(e) {
            if (e.target === this) fecharPainelReservas();
        });
    </script>
    <script src="../assets/js/catalogo.js"></script>
</body>

</html>