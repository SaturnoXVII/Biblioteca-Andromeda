<?php
session_start();
require_once "../config/conexao.php";
require_once "../config/dados.php";
require_once "../config/crud.php";
require_once "../config/sessao.php";
protegerPagina();
$mysqli->set_charset("utf8mb4");
$reservaMessage = null;
$reservaType = 'success';


// ═══════════════════════════════════════════════════════════════
// AVALIAÇÕES — nota de 1 a 5 + comentário por leitor/livro
// ═══════════════════════════════════════════════════════════════
function salvarAvaliacaoCatalogo(mysqli $db, int $idLivro, int $idUsuario, int $nota, string $comentario): array
{
    if ($idLivro <= 0 || $idUsuario <= 0) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Livro ou usuário inválido para avaliação.'];
    }

    if ($nota < 1 || $nota > 5) {
        return ['sucesso' => false, 'tipo' => 'warning', 'mensagem' => 'Escolha uma nota entre 1 e 5 estrelas.'];
    }

    $comentario = trim($comentario);
    if (function_exists('mb_substr')) {
        $comentario = mb_substr($comentario, 0, 1000, 'UTF-8');
    } else {
        $comentario = substr($comentario, 0, 1000);
    }

    $sql = "
        INSERT INTO avaliacoes (id_livro, id_usuario, nota, comentario)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            nota = VALUES(nota),
            comentario = VALUES(comentario),
            status = 'ativo',
            data_atualizacao = CURRENT_TIMESTAMP
    ";

    try {
        $stmt = $db->prepare($sql);
    } catch (mysqli_sql_exception $e) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Erro ao preparar avaliação: ' . $e->getMessage()];
    }

    if (!$stmt) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Erro ao preparar avaliação: ' . $db->error];
    }

    $stmt->bind_param('iiis', $idLivro, $idUsuario, $nota, $comentario);
    try {
        $ok = $stmt->execute();
        $erro = $stmt->error;
    } catch (mysqli_sql_exception $e) {
        $ok = false;
        $erro = $e->getMessage();
    }
    $stmt->close();

    if (!$ok) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Não foi possível salvar sua avaliação: ' . $erro];
    }

    return ['sucesso' => true, 'tipo' => 'success', 'mensagem' => 'Avaliação salva com sucesso!'];
}

function carregarAvaliacoesCatalogo(mysqli $db, int $idUsuarioLogado = 0): array
{
    $sql = "
        SELECT
            A.id_avaliacao,
            A.id_livro,
            A.id_usuario,
            A.nota,
            A.comentario,
            A.data_avaliacao,
            A.data_atualizacao,
            U.nome,
            U.sobrenome,
            COALESCE(NULLIF(U.avatar, ''), NULLIF(U.foto, ''), '') AS avatar_usuario
        FROM avaliacoes A
        INNER JOIN usuarios U ON U.id_usuario = A.id_usuario
        WHERE A.status = 'ativo'
        ORDER BY A.data_atualizacao DESC
    ";

    try {
        $res = $db->query($sql);
    } catch (mysqli_sql_exception $e) {
        return [];
    }

    if (!$res) {
        return [];
    }

    $porLivro = [];

    while ($row = $res->fetch_assoc()) {
        $idLivro = (int) $row['id_livro'];
        $nota = (int) $row['nota'];

        if (!isset($porLivro[$idLivro])) {
            $porLivro[$idLivro] = [
                'media' => 0,
                'total' => 0,
                'soma' => 0,
                'minha' => null,
                'comentarios' => []
            ];
        }

        $comentarioData = [
            'id_avaliacao' => (int) $row['id_avaliacao'],
            'id_usuario' => (int) $row['id_usuario'],
            'nota' => $nota,
            'comentario' => $row['comentario'] ?? '',
            'data_avaliacao' => $row['data_avaliacao'],
            'data_atualizacao' => $row['data_atualizacao'],
            'nome' => $row['nome'] ?? '',
            'sobrenome' => $row['sobrenome'] ?? '',
            'avatar_usuario' => $row['avatar_usuario'] ?? ''
        ];

        $porLivro[$idLivro]['total']++;
        $porLivro[$idLivro]['soma'] += $nota;
        $porLivro[$idLivro]['comentarios'][] = $comentarioData;

        if ($idUsuarioLogado > 0 && (int) $row['id_usuario'] === $idUsuarioLogado) {
            $porLivro[$idLivro]['minha'] = $comentarioData;
        }
    }

    foreach ($porLivro as $idLivro => $dados) {
        $porLivro[$idLivro]['media'] = $dados['total'] > 0 ? round($dados['soma'] / $dados['total'], 1) : 0;
        unset($porLivro[$idLivro]['soma']);
    }

    return $porLivro;
}


// Processa a criação de reserva
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
            $reservaMessage = 'Reserva registrada com sucesso! Assim que o livro retornar, você será notificado.';
            $reservaType = 'success';
        } else {
            $reservaMessage = 'Não foi possível completar a reserva. Tente novamente mais tarde.';
            $reservaType = 'danger';
        }
    }
}


// Processa avaliação/comentário do leitor
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'avaliar_livro') {
    if (empty($_SESSION['id_usuario'])) {
        $reservaMessage = 'Faça login para avaliar uma obra.';
        $reservaType = 'danger';
    } else {
        $idLivroAvaliado = (int) ($_POST['id_livro'] ?? 0);
        $notaAvaliacao = (int) ($_POST['nota'] ?? 0);
        $comentarioAvaliacao = (string) ($_POST['comentario'] ?? '');

        $resultadoAvaliacao = salvarAvaliacaoCatalogo(
            $mysqli,
            $idLivroAvaliado,
            (int) $_SESSION['id_usuario'],
            $notaAvaliacao,
            $comentarioAvaliacao
        );

        $reservaMessage = $resultadoAvaliacao['mensagem'];
        $reservaType = $resultadoAvaliacao['tipo'];
    }
}

// Carrega reservas do usuário se estiver logado
$minhasReservas = [];
if (!empty($_SESSION['id_usuario'])) {
    $minhasReservas = listarReservasUsuario($mysqli, (int) $_SESSION['id_usuario']);
}
$minhasReservasJson = json_encode($minhasReservas, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '[]';

$repo = new \App\Repository\LivroRepository($mysqli);
try {
    $livros = $repo->listarTodos();
} catch (Exception $e) {
    die("Erro: " . htmlspecialchars($e->getMessage()));
}

$livros    = $livros ?? [];
$avaliacoesPorLivro = carregarAvaliacoesCatalogo($mysqli, (int) ($_SESSION['id_usuario'] ?? 0));

// Injeta resumo de avaliações dentro de cada livro para o JS do catálogo também conseguir usar.
foreach ($livros as &$livroItem) {
    $idLivroItem = (int) ($livroItem['id_livro'] ?? $livroItem['id'] ?? 0);
    $dadosAvaliacao = $avaliacoesPorLivro[$idLivroItem] ?? [
        'media' => 0,
        'total' => 0,
        'minha' => null,
        'comentarios' => []
    ];

    $livroItem['media_avaliacoes'] = $dadosAvaliacao['media'];
    $livroItem['total_avaliacoes'] = $dadosAvaliacao['total'];
    $livroItem['minha_avaliacao'] = $dadosAvaliacao['minha'];
    $livroItem['comentarios_avaliacoes'] = $dadosAvaliacao['comentarios'];
}
unset($livroItem);

$livrosJson = json_encode($livros, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '[]';
$avaliacoesJson = json_encode($avaliacoesPorLivro, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '{}';
$totalLivros = count($livros);
$categorias  = array_values(array_filter(array_unique(array_column($livros, 'categoria_nome'))));
$totalCats   = count($categorias);
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
    <link rel="stylesheet" href="../assets/css/andromeda.css">
</head>

<body>



    </div>

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
            <a href="#" class="nav-item" id="nav-reservas" onclick="event.preventDefault(); abrirPainelReservas();"><i class="fa-solid fa-clock-rotate-left"></i><span>Reservas</span></a>
            <?php if (isset($_SESSION['nivel_acesso']) && $_SESSION['nivel_acesso'] === 'admin'): ?>
                <a href="adm.php" class="nav-item">
                    <i class="fa-solid fa-user-shield"></i>
                    Painel Admin
                </a>
                </li>
            <?php endif; ?>
        </div>
        <div class="nav-foot">
            <a href="intro.php" class="nav-item"><i class="fa-solid fa-rocket"></i><span>Início</span></a>
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
        <span id="scroll-hint"><i class="fa-solid fa-computer-mouse"></i> Scroll &middot; Zoom &middot; Arraste para rotacionar</span>
    </div>

    <div id="depth" aria-label="Controle de zoom da galáxia">
        <span class="depth-lbl">Orbital</span>
        <div class="depth-readout" id="depth-readout">24%</div>
        <div class="depth-track" id="depth-track" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="24" tabindex="0">
            <div class="depth-fill" id="depth-fill"></div>
            <div class="depth-dot" id="ddot"></div>
        </div>
        <button class="depth-reset" id="depth-reset" type="button" title="Resetar órbita e zoom">
            <i class="fa-solid fa-rotate-left"></i>
        </button>
        <span class="depth-lbl">Galáxia</span>
    </div>

    <!-- BOOK PANEL com sinopse -->
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

            <!-- AVALIAÇÕES NO PAINEL LATERAL -->
            <div class="bp-rating-mini" id="bp-rating-mini">
                <div class="bp-rating-stars" id="bp-rating-stars">☆☆☆☆☆</div>
                <span id="bp-rating-copy">Sem avaliações ainda</span>
            </div>

            <!-- SINOPSE NO PAINEL LATERAL -->
            <div class="bp-synopsis-wrap" id="bp-synopsis-wrap" style="display:none;">
                <p class="bp-synopsis-label"><i class="fa-solid fa-book-open"></i> Sinopse</p>
                <p class="bp-synopsis-text" id="bp-synopsis-text">—</p>
                <button class="bp-synopsis-toggle" id="bp-synopsis-toggle">
                    <i class="fa-solid fa-chevron-down"></i> Ler mais
                </button>
            </div>

            <div class="bp-actions">
                <button class="btn-prim" id="bp-reserve">Abrir Arquivo</button>
                <button class="btn-sec" id="bp-expand"><i class="fa-solid fa-expand"></i></button>
            </div>
        </div>
    </div>

    <!-- MODAL com sinopse -->
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

                <!-- SINOPSE NO MODAL -->
                <div class="md-synopsis-section">
                    <p class="md-synopsis-label">
                        <i class="fa-solid fa-feather-pointed"></i> Sinopse
                    </p>
                    <p class="md-synopsis-text" id="md-synopsis-text">—</p>
                </div>

                <div class="md-grid">
                    <div class="md-field"><label>Ano</label><span class="v" id="md-year">—</span></div>
                    <div class="md-field"><label>Editora</label><span class="v" id="md-pub">—</span></div>
                    <div class="md-field"><label>Categoria</label><span class="v" id="md-catv">—</span></div>
                    <div class="md-field"><label>Disponibilidade</label><span class="v" id="md-sv">—</span></div>
                </div>

                <!-- AVALIAÇÕES E COMENTÁRIOS -->
                <section class="md-rating-section" id="md-rating-section">
                    <div class="md-rating-head">
                        <div>
                            <p class="md-rating-kicker"><i class="fa-solid fa-star-half-stroke"></i> Experiência dos leitores</p>
                            <h3>Avaliações e comentários</h3>
                        </div>
                        <div class="md-rating-score">
                            <span class="md-rating-stars" id="md-rating-stars">☆☆☆☆☆</span>
                            <strong id="md-rating-media">0,0</strong>
                            <small id="md-rating-total">Nenhuma avaliação</small>
                        </div>
                    </div>

                    <form action="catalogo.php" method="POST" class="md-rating-form" id="avaliacao-form">
                        <input type="hidden" name="action" value="avaliar_livro">
                        <input type="hidden" name="id_livro" id="avaliacao-id-livro" value="">

                        <div class="md-rating-current" id="avaliacao-current-livro">
                            Selecione uma obra no catálogo para avaliar.
                        </div>

                        <div class="estrelas-select md-stars-input" aria-label="Escolha sua nota">
                            <label data-rating="1" title="1 estrela"><input type="radio" name="nota" value="1" required><span>★</span></label>
                            <label data-rating="2" title="2 estrelas"><input type="radio" name="nota" value="2"><span>★</span></label>
                            <label data-rating="3" title="3 estrelas"><input type="radio" name="nota" value="3"><span>★</span></label>
                            <label data-rating="4" title="4 estrelas"><input type="radio" name="nota" value="4"><span>★</span></label>
                            <label data-rating="5" title="5 estrelas"><input type="radio" name="nota" value="5"><span>★</span></label>
                        </div>

                        <textarea name="comentario" id="avaliacao-comentario" maxlength="1000" rows="4" placeholder="Conte o que você achou desta leitura..."></textarea>

                        <button type="submit" class="btn-prim md-rating-submit" id="avaliacao-submit">
                            <i class="fa-solid fa-paper-plane"></i> Enviar avaliação
                        </button>
                    </form>

                    <div class="md-comments-list" id="avaliacoes-comments">
                        <p class="md-comments-empty">Os comentários aparecerão aqui.</p>
                    </div>
                </section>
                <p class="md-related-title">Obras Relacionadas</p>
                <div class="md-related-list" id="md-related"></div>
            </div>
            <div class="md-actions">
                <button class="btn-prim" id="md-reserve">Reservar Obra</button>
                <button class="btn-sec" id="md-wishlist" title="Salvar"><i class="fa-regular fa-bookmark"></i></button>
            </div>
        </div>
    </div>

    <!-- EDITORIAL VIEW com sinopse no hero -->
    <div id="editorial-view">
        <div class="ed-header">
            <h1 class="ed-header-title">Universo <em>Literário</em></h1>
            <p class="ed-header-desc">
                Navegue pelo acervo completo. Mais de <?= $totalLivros ?> obras divididas em <?= $totalCats ?> constelações de conhecimento. <span id="ed-avail" style="color:var(--am); font-weight:bold;">—</span> disponíveis agora.
            </p>
        </div>
        <section class="ed-carousel-section ed-highlight-shell" id="ed-carousel-section" aria-label="Destaque da semana">
            <div class="ed-carousel-head">
                <div>
                    <span class="ed-carousel-kicker">Radar Andrômeda</span>
                    <h2 class="ed-carousel-title">Destaque da Semana</h2>
                </div>
                <div class="ed-carousel-controls">
                    <button class="ed-carousel-btn" id="ed-car-prev" type="button" aria-label="Destaque anterior"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="ed-carousel-btn" id="ed-car-next" type="button" aria-label="Próximo destaque"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </div>
            <div class="ed-carousel-shell">
                <div class="ed-carousel-track" id="ed-carousel-track"></div>
            </div>
            <div class="ed-carousel-dots" id="ed-carousel-dots"></div>
        </section>

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
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        const LIVROS = <?php echo $livrosJson; ?>;
        const MINHAS_RESERVAS = <?php echo $minhasReservasJson; ?>;
        const AVALIACOES_LIVROS = <?php echo $avaliacoesJson; ?>;
        const USUARIO_LOGADO_ID = <?php echo (int) ($_SESSION['id_usuario'] ?? 0); ?>;

        // ═══════════════════════════════════════════════════════
        // AVALIAÇÕES — renderização segura sem depender do andro.js
        // ═══════════════════════════════════════════════════════
        let avUltimoLivroRenderizado = null;
        let avFormularioEmUso = false;

        function avEscapeHTML(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function avNormalize(value) {
            return String(value ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        }

        function avLivroId(livro) {
            return Number(livro?.id_livro ?? livro?.id ?? livro?.livro_id ?? 0);
        }

        function avStars(nota) {
            const filled = Math.max(0, Math.min(5, Math.round(Number(nota) || 0)));
            return '★'.repeat(filled) + '☆'.repeat(5 - filled);
        }

        function avPintarEstrelas(valor) {
            const nota = Math.max(0, Math.min(5, Number(valor) || 0));
            document.querySelectorAll('#avaliacao-form .estrelas-select label').forEach(label => {
                const input = label.querySelector('input[name="nota"]');
                const itemValor = Number(input?.value || label.dataset.rating || 0);
                label.classList.toggle('is-lit', itemValor <= nota);
                label.classList.toggle('is-selected', itemValor === nota && nota > 0);
            });
        }

        function avNotaSelecionada() {
            const checked = document.querySelector('#avaliacao-form input[name="nota"]:checked');
            return checked ? Number(checked.value) : 0;
        }

        function avDataPT(value) {
            if (!value) return 'Agora';
            const data = new Date(String(value).replace(' ', 'T'));
            if (Number.isNaN(data.getTime())) return 'Agora';
            return data.toLocaleDateString('pt-BR');
        }

        function avPossivelLivroGlobal() {
            const candidatos = [
                window.livroAtual,
                window.currentLivro,
                window.currentBook,
                window.selectedLivro,
                window.selectedBook,
                window.activeLivro,
                window.activeBook
            ];

            for (const candidato of candidatos) {
                const id = avLivroId(candidato);
                if (id) {
                    const encontrado = LIVROS.find(l => avLivroId(l) === id);
                    if (encontrado) return encontrado;
                }
            }
            return null;
        }

        function avLivroAtualPeloModal() {
            const global = avPossivelLivroGlobal();
            if (global) return global;

            const tituloModal = avNormalize(document.getElementById('md-title')?.textContent);
            const autorModal = avNormalize(document.getElementById('md-author')?.textContent);
            const tituloPainel = avNormalize(document.getElementById('bp-title')?.textContent);
            const autorPainel = avNormalize(document.getElementById('bp-author')?.textContent);

            const titulo = tituloModal && tituloModal !== '—' ? tituloModal : tituloPainel;
            const autor = autorModal && autorModal !== '—' ? autorModal : autorPainel;

            if (!titulo || titulo === '—') return null;

            return LIVROS.find(livro => {
                const lt = avNormalize(livro.titulo ?? livro.nome ?? livro.title);
                const la = avNormalize(livro.autor_nome ?? livro.autor ?? livro.nome_autor ?? livro.author);
                return lt === titulo && (!autor || !la || autor.includes(la) || la.includes(autor));
            }) || LIVROS.find(livro => avNormalize(livro.titulo ?? livro.nome ?? livro.title) === titulo) || null;
        }

        function avDadosLivro(idLivro) {
            return AVALIACOES_LIVROS[String(idLivro)] || AVALIACOES_LIVROS[idLivro] || {
                media: 0,
                total: 0,
                minha: null,
                comentarios: []
            };
        }

        function renderAvaliacoesAndromeda() {
            const livro = avLivroAtualPeloModal();
            const idLivro = avLivroId(livro);
            const dados = idLivro ? avDadosLivro(idLivro) : { media: 0, total: 0, minha: null, comentarios: [] };
            const media = Number(dados.media || 0);
            const total = Number(dados.total || 0);

            const bpStars = document.getElementById('bp-rating-stars');
            const bpCopy = document.getElementById('bp-rating-copy');
            if (bpStars) bpStars.textContent = avStars(media);
            if (bpCopy) {
                bpCopy.textContent = total > 0
                    ? `${media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} de 5 · ${total} avaliação${total > 1 ? 'es' : ''}`
                    : 'Sem avaliações ainda';
            }

            const mdStars = document.getElementById('md-rating-stars');
            const mdMedia = document.getElementById('md-rating-media');
            const mdTotal = document.getElementById('md-rating-total');
            const currentLivro = document.getElementById('avaliacao-current-livro');
            const hiddenId = document.getElementById('avaliacao-id-livro');
            const comentario = document.getElementById('avaliacao-comentario');
            const submit = document.getElementById('avaliacao-submit');
            const comments = document.getElementById('avaliacoes-comments');

            if (mdStars) mdStars.textContent = avStars(media);
            if (mdMedia) mdMedia.textContent = media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            if (mdTotal) mdTotal.textContent = total > 0 ? `${total} avaliação${total > 1 ? 'es' : ''}` : 'Nenhuma avaliação';
            if (hiddenId) hiddenId.value = idLivro || '';
            if (currentLivro) currentLivro.textContent = livro ? `Você está avaliando: ${livro.titulo ?? livro.nome ?? 'obra selecionada'}` : 'Selecione uma obra no catálogo para avaliar.';
            if (submit) submit.disabled = !idLivro;

            const livroRenderKey = idLivro ? String(idLivro) : '';
            const form = document.getElementById('avaliacao-form');
            const focoDentroDoForm = form ? form.contains(document.activeElement) : false;
            const podeSincronizarFormulario = livroRenderKey !== avUltimoLivroRenderizado || (!focoDentroDoForm && !avFormularioEmUso);

            if (podeSincronizarFormulario) {
                document.querySelectorAll('#avaliacao-form input[name="nota"]').forEach(input => {
                    input.checked = dados.minha ? Number(input.value) === Number(dados.minha.nota) : false;
                });

                if (comentario) {
                    comentario.value = dados.minha?.comentario ?? '';
                }

                avPintarEstrelas(dados.minha ? Number(dados.minha.nota) : 0);
                avUltimoLivroRenderizado = livroRenderKey;
            } else {
                avPintarEstrelas(avNotaSelecionada());
            }

            if (comments) {
                const lista = Array.isArray(dados.comentarios) ? dados.comentarios : [];

                if (!lista.length) {
                    comments.innerHTML = '<p class="md-comments-empty">Este livro ainda não possui comentários. Seja o primeiro a avaliar.</p>';
                } else {
                    comments.innerHTML = lista.map(item => {
                        const nome = `${item.nome ?? ''} ${item.sobrenome ?? ''}`.trim() || 'Leitor Andrômeda';
                        const texto = String(item.comentario ?? '').trim();
                        return `
                            <article class="md-comment-card">
                                <div class="md-comment-top">
                                    <div>
                                        <strong>${avEscapeHTML(nome)}</strong>
                                        <span>${avStars(item.nota)}</span>
                                    </div>
                                    <small>${avDataPT(item.data_atualizacao || item.data_avaliacao)}</small>
                                </div>
                                ${texto ? `<p>${avEscapeHTML(texto).replace(/\n/g, '<br>')}</p>` : '<p class="md-comment-muted">Este leitor avaliou sem comentário.</p>'}
                            </article>
                        `;
                    }).join('');
                }
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('avaliacao-form');
            if (form) {
                ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(evento => {
                    form.addEventListener(evento, function(e) {
                        e.stopPropagation();
                    });
                });

                form.addEventListener('focusin', function() {
                    avFormularioEmUso = true;
                });

                form.addEventListener('focusout', function() {
                    setTimeout(() => {
                        if (!form.contains(document.activeElement)) {
                            avFormularioEmUso = false;
                        }
                    }, 80);
                });

                form.querySelectorAll('.estrelas-select label').forEach(label => {
                    const input = label.querySelector('input[name="nota"]');
                    const valor = Number(input?.value || label.dataset.rating || 0);

                    label.addEventListener('mouseenter', function() {
                        avPintarEstrelas(valor);
                    });

                    label.addEventListener('mouseleave', function() {
                        avPintarEstrelas(avNotaSelecionada());
                    });

                    label.addEventListener('click', function() {
                        if (!input) return;
                        input.checked = true;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        avPintarEstrelas(valor);
                    });
                });

                form.querySelectorAll('input[name="nota"]').forEach(input => {
                    input.addEventListener('change', function() {
                        avPintarEstrelas(Number(this.value));
                    });
                });

                form.addEventListener('submit', function(e) {
                    const idLivro = document.getElementById('avaliacao-id-livro')?.value;
                    const nota = form.querySelector('input[name="nota"]:checked');

                    if (!idLivro) {
                        e.preventDefault();
                        alert('Abra uma obra do catálogo antes de enviar a avaliação.');
                        return;
                    }

                    if (!nota) {
                        e.preventDefault();
                        alert('Escolha uma nota de 1 a 5 estrelas antes de enviar.');
                    }
                });
            }

            const tituloModal = document.getElementById('md-title');
            const autorModal = document.getElementById('md-author');
            const tituloPainel = document.getElementById('bp-title');
            const autorPainel = document.getElementById('bp-author');

            [tituloModal, autorModal, tituloPainel, autorPainel].filter(Boolean).forEach(el => {
                new MutationObserver(() => setTimeout(renderAvaliacoesAndromeda, 60))
                    .observe(el, { childList: true, characterData: true, subtree: true });
            });

            // Não renderize no clique global: isso reiniciava as estrelas e o textarea enquanto o leitor interagia.
            setTimeout(renderAvaliacoesAndromeda, 300);
        });


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
    <script src="../assets/js/andro.js"></script>
</body>

</html>