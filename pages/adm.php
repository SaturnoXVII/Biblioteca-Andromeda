<?php
ob_start();
session_start();
require_once __DIR__ . "/../config/conexao.php";
require_once __DIR__ . "/../config/crud.php";
require_once __DIR__ . "/../includes/notificacoes.php";
require_once __DIR__ . "/../config/sessao.php";
protegerAdmin();


$msg = '';
$busca = '';


$action = $_GET['action'] ?? 'listar';


function admRequestJson(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';

    return isset($_GET['ajax'])
        || stripos($accept, 'application/json') !== false
        || strtolower($requestedWith) === 'xmlhttprequest';
}

function admJsonResponse(array $payload, int $statusCode = 200): void
{

    if (ob_get_length() !== false) {
        ob_clean();
    }

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function admPostText(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

function admPostIntOrNull(string $key): ?int
{
    if (!isset($_POST[$key]) || $_POST[$key] === '') {
        return null;
    }

    return (int) $_POST[$key];
}

function admToastPayload(?string $key): ?array
{
    $toasts = [
        'sucesso'             => ['type' => 'sucesso', 'icon' => 'fa-solid fa-circle-check', 'title' => 'Empréstimo registrado', 'text' => 'Registro salvo com sucesso.'],
        'livro_salvo'         => ['type' => 'sucesso', 'icon' => 'fa-solid fa-book-open', 'title' => 'Livro adicionado', 'text' => 'Obra adicionada ao acervo.'],
        'livro_editado'       => ['type' => 'sucesso', 'icon' => 'fa-solid fa-pen-nib', 'title' => 'Livro atualizado', 'text' => 'Alterações salvas com sucesso.'],
        'livro_excluido'      => ['type' => 'alerta',  'icon' => 'fa-solid fa-trash-can', 'title' => 'Livro removido', 'text' => 'Registro removido do painel.'],
        'devolvido'           => ['type' => 'sucesso', 'icon' => 'fa-solid fa-rotate-left', 'title' => 'Devolução registrada', 'text' => 'Estoque atualizado.'],
        'autor_salvo'         => ['type' => 'sucesso', 'icon' => 'fa-solid fa-feather-pointed', 'title' => 'Autor adicionado', 'text' => 'Autor pronto para uso.'],
        'editora_salva'       => ['type' => 'sucesso', 'icon' => 'fa-solid fa-building-columns', 'title' => 'Editora adicionada', 'text' => 'Editora pronta para uso.'],
        'categoria_salva'     => ['type' => 'sucesso', 'icon' => 'fa-solid fa-tags', 'title' => 'Categoria adicionada', 'text' => 'Categoria pronta para uso.'],
        'autor_excluido'      => ['type' => 'alerta',  'icon' => 'fa-solid fa-user-minus', 'title' => 'Autor removido', 'text' => 'Lista de autores atualizada.'],
        'editora_excluida'    => ['type' => 'alerta',  'icon' => 'fa-solid fa-building-circle-xmark', 'title' => 'Editora removida', 'text' => 'Lista de editoras atualizada.'],
        'categoria_excluida'  => ['type' => 'alerta',  'icon' => 'fa-solid fa-tag', 'title' => 'Categoria removida', 'text' => 'Lista de categorias atualizada.'],
        'erro_estoque'        => ['type' => 'erro',    'icon' => 'fa-solid fa-triangle-exclamation', 'title' => 'Sem estoque', 'text' => 'Escolha outro livro disponível.'],
        'erro_autor'          => ['type' => 'erro',    'icon' => 'fa-solid fa-circle-exclamation', 'title' => 'Revise o autor', 'text' => 'Preencha o nome antes de salvar.'],
        'erro_editora'        => ['type' => 'erro',    'icon' => 'fa-solid fa-circle-exclamation', 'title' => 'Revise a editora', 'text' => 'Preencha o nome antes de salvar.'],
        'erro_categoria'      => ['type' => 'erro',    'icon' => 'fa-solid fa-circle-exclamation', 'title' => 'Revise a categoria', 'text' => 'Preencha o nome antes de salvar.'],
        'erro_excluir'        => ['type' => 'erro',    'icon' => 'fa-solid fa-circle-xmark', 'title' => 'Ação não concluída', 'text' => 'Tente novamente em alguns instantes.'],
    ];

    return $key && isset($toasts[$key]) ? $toasts[$key] : null;
}

function admSalvarEstadoLivroNaSessao(): void
{
    $_SESSION['form_livro'] = [
        'titulo'         => $_POST['titulo']         ?? '',
        'id_autor'       => $_POST['id_autor']       ?? '',
        'id_categoria'   => $_POST['id_categoria']   ?? '',
        'id_editora'     => $_POST['id_editora']     ?? '',
        'ano_publicacao' => $_POST['ano_publicacao'] ?? '',
        'numero_paginas' => $_POST['numero_paginas'] ?? '',
        'origem_idioma'  => $_POST['origem_idioma']  ?? '',
        'status'         => $_POST['status']         ?? '',
        'quantidade'     => $_POST['quantidade']     ?? '',
        'sinopse'        => $_POST['sinopse']        ?? '',
    ];
}


if ($action === 'novo_autor' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome          = admPostText('nome');
    $descricao     = admPostText('descricao');
    $nacionalidade = admPostText('nacionalidade');

    if ($nome === '') {
        if (admRequestJson()) {
            admJsonResponse(['success' => false, 'message' => 'Informe o nome do autor.'], 422);
        }

        admSalvarEstadoLivroNaSessao();
        header('Location: /Biblioteca-Andromeda/adm?action=add&msg=erro_autor');
        exit;
    }

    if ($nacionalidade === '') {
        $nacionalidade = 'Não informada';
    }

    $novo_id = adicionarAutor($mysqli, $nome, $descricao, $nacionalidade);

    if (admRequestJson()) {
        admJsonResponse([
            'success' => true,
            'id'      => (int) $novo_id,
            'nome'    => $nome,
            'message' => 'Autor adicionado e selecionado sem reiniciar a página.'
        ]);
    }

    admSalvarEstadoLivroNaSessao();
    header('Location: /Biblioteca-Andromeda/adm?action=add&autor_id=' . $novo_id . '&msg=autor_salvo');
    exit;
}


if ($action === 'nova_editora' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome      = admPostText('nome');
    $descricao = admPostText('descricao');

    if ($nome === '') {
        if (admRequestJson()) {
            admJsonResponse(['success' => false, 'message' => 'Informe o nome da editora.'], 422);
        }

        admSalvarEstadoLivroNaSessao();
        header('Location: /Biblioteca-Andromeda/adm?action=add&msg=erro_editora');
        exit;
    }

    $novo_id = adicionarEditora($mysqli, $nome, $descricao);

    if (admRequestJson()) {
        admJsonResponse([
            'success' => true,
            'id'      => (int) $novo_id,
            'nome'    => $nome,
            'message' => 'Editora adicionada e selecionada sem reiniciar a página.'
        ]);
    }

    admSalvarEstadoLivroNaSessao();
    header('Location: /Biblioteca-Andromeda/adm?action=add&editora_id=' . $novo_id . '&msg=editora_salva');
    exit;
}


if ($action === 'nova_categoria' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = admPostText('nome');

    if ($nome === '') {
        if (admRequestJson()) {
            admJsonResponse(['success' => false, 'message' => 'Informe o nome da categoria.'], 422);
        }

        admSalvarEstadoLivroNaSessao();
        header('Location: /Biblioteca-Andromeda/adm?action=add&msg=erro_categoria');
        exit;
    }

    $novo_id = adicionarCategoria($mysqli, $nome);

    if (admRequestJson()) {
        admJsonResponse([
            'success' => true,
            'id'      => (int) $novo_id,
            'nome'    => $nome,
            'message' => 'Categoria adicionada e selecionada sem reiniciar a página.'
        ]);
    }

    admSalvarEstadoLivroNaSessao();
    header('Location: /Biblioteca-Andromeda/adm?action=add&categoria_id=' . $novo_id . '&msg=categoria_salva');
    exit;
}


if ($action === 'excluir_autor' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_autor = (int)($_POST['id_autor'] ?? 0);
    $ok = $id_autor > 0 && excluirAutor($mysqli, $id_autor);
    header('Location: /Biblioteca-Andromeda/adm?action=metadados&msg=' . ($ok ? 'autor_excluido' : 'erro_excluir'));
    exit;
}

if ($action === 'excluir_editora' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_editora = (int)($_POST['id_editora'] ?? 0);
    $ok = $id_editora > 0 && excluirEditora($mysqli, $id_editora);
    header('Location: /Biblioteca-Andromeda/adm?action=metadados&msg=' . ($ok ? 'editora_excluida' : 'erro_excluir'));
    exit;
}

if ($action === 'excluir_categoria' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_categoria = (int)($_POST['id_categoria'] ?? 0);
    $ok = $id_categoria > 0 && excluirCategoria($mysqli, $id_categoria);
    header('Location: /Biblioteca-Andromeda/adm?action=metadados&msg=' . ($ok ? 'categoria_excluida' : 'erro_excluir'));
    exit;
}


if ($action === 'registrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_livro      = (int) $_POST['id_livro'];
    $id_usuario    = (int) $_POST['id_usuario'];
    $data_prevista = $_POST['data_devolucao'];
    if (!DateTime::createFromFormat('Y-m-d', $data_prevista)) {
        header("Location: /Biblioteca-Andromeda/adm?action=emprestimos&msg=erro_data");
        exit;
    }

    if (registrarEmprestimo($mysqli, $id_livro, $id_usuario, $data_prevista)) {
        header("Location: /Biblioteca-Andromeda/adm?action=emprestimos&msg=sucesso");
        exit;
    } else {
        header("Location: /Biblioteca-Andromeda/adm?action=emprestimos&msg=erro_estoque");
        exit;
    }
}


if ($action === 'devolver' && isset($_GET['id'])) {
    devolverLivro($mysqli, (int) $_GET['id']);
    header("Location: /Biblioteca-Andromeda/adm?action=emprestimos&msg=devolvido");
    exit;
}


if (in_array($action, ['add', 'edit']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $titulo         = admPostText('titulo');
    $id_autor       = admPostIntOrNull('id_autor');
    $ano_publicacao = admPostIntOrNull('ano_publicacao');
    $id_categoria   = admPostIntOrNull('id_categoria');
    $id_editora     = admPostIntOrNull('id_editora');
    $numero_paginas = admPostIntOrNull('numero_paginas');
    $origem_idioma  = admPostText('origem_idioma');
    $quantidade     = max(0, (int)($_POST['quantidade'] ?? 0));
    $sinopse        = admPostText('sinopse');
    $status         = $quantidade > 0 ? 'Disponível' : 'Indisponível';

    $capa = $_POST['capa_atual'] ?? 'uploads/capas/default.jpg';

    if (!empty($_FILES['capa']['name'])) {
        $tipos_permitidos = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];

        $mime = null;
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = $finfo ? finfo_file($finfo, $_FILES['capa']['tmp_name']) : null;
            if ($finfo) finfo_close($finfo);
        }

        if ($mime === null) {
            $mime = $_FILES['capa']['type'] ?? '';
        }

        if (isset($tipos_permitidos[$mime]) && $_FILES['capa']['size'] <= 2097152) {
            $nome_arquivo = uniqid('capa_', true) . '.' . $tipos_permitidos[$mime];
            $destino      = '../uploads/capas/' . $nome_arquivo;

            if (move_uploaded_file($_FILES['capa']['tmp_name'], $destino)) {
                $capa = 'uploads/capas/' . $nome_arquivo;
            }
        }
    }

    if ($action === 'add') {
        adicionarLivro($mysqli, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa, $sinopse);
    } elseif ($action === 'edit') {
        $id_livro = (int) $_POST['id_livro'];
        if ($quantidade == 0) $status = 'Indisponível';
        editarLivro($mysqli, $id_livro, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa, $sinopse);
    }

    header('Location: /Biblioteca-Andromeda/adm?msg=' . ($action === 'add' ? 'livro_salvo' : 'livro_editado'));
    exit;
}


if ($action === 'delete' && isset($_GET['id'])) {
    excluirLivro($mysqli, (int) $_GET['id']);
    header("Location: /Biblioteca-Andromeda/adm?msg=livro_excluido");
    exit;
}


if ($action === 'perfis' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = $_POST['acao'] ?? '';
    $uid  = (int)($_POST['uid'] ?? 0);

    if ($uid === (int)$_SESSION['id_usuario']) {
        $msg = 'Você não pode alterar seu próprio perfil.';
    } else {
        if ($acao === 'excluir') {
            $stmt = $mysqli->prepare("DELETE FROM usuarios WHERE id_usuario = ? AND nivel_acesso != 'admin'");
            $stmt->bind_param('i', $uid);
            $stmt->execute();
            $msg = $stmt->affected_rows
                ? 'Leitor removido do sistema com sucesso.'
                : 'Não foi possível remover (é admin ou não existe).';
            $stmt->close();
        } elseif ($acao === 'promover') {
            $stmt = $mysqli->prepare("UPDATE usuarios SET nivel_acesso='admin' WHERE id_usuario = ? AND nivel_acesso = 'leitor'");
            $stmt->bind_param('i', $uid);
            $stmt->execute();
            $msg = $stmt->affected_rows
                ? 'Leitor promovido a Guardião com sucesso!'
                : 'Leitor já é Guardião ou não existe.';
            $stmt->close();
        } elseif ($acao === 'rebaixar') {
            $stmt = $mysqli->prepare("UPDATE usuarios SET nivel_acesso='leitor' WHERE id_usuario = ? AND nivel_acesso = 'admin'");
            $stmt->bind_param('i', $uid);
            $stmt->execute();
            $msg = $stmt->affected_rows
                ? 'Guardião rebaixado a leitor com sucesso.'
                : 'Usuário já é leitor ou não existe.';
            $stmt->close();
        }
    }
}

?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>O Cofre Cósmico | Acervo</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500;600;700&family=Space+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="/Biblioteca-Andromeda/assets/css/andro.css">
    <link rel="stylesheet" href="/Biblioteca-Andromeda/assets/css/adm.css">
</head>

<body>

    <div id="grain"></div>
    <div id="canvas-dim" class="dimmed"></div>


    <?php $toast = admToastPayload($_GET['msg'] ?? null); ?>
    <?php if ($toast): ?>
        <div id="toast" class="cosmic-toast <?= htmlspecialchars($toast['type']) ?>" role="status" aria-live="polite" aria-atomic="true">
            <div class="toast-icon"><i class="<?= htmlspecialchars($toast['icon']) ?>"></i></div>
            <div class="toast-content">
                <strong><?= htmlspecialchars($toast['title']) ?></strong>
                <span><?= htmlspecialchars($toast['text']) ?></span>
            </div>
            <button type="button" class="toast-close" aria-label="Fechar aviso"><i class="fa-solid fa-xmark"></i></button>
            <div class="toast-progress"></div>
        </div>
    <?php endif; ?>

    <div id="reticle" class="hide-on-mobile">
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
    <div id="reticle-dot" class="hide-on-mobile"></div>


    <nav id="nav">
        <div class="nav-logo">
            <span class="nav-logo-text">Andrômeda</span>
        </div>

        <div class="nav-sec">
            <a href="/Biblioteca-Andromeda/adm" class="nav-item <?= ($action === 'listar' || $action === 'edit') ? 'active' : '' ?>">
                <i class="fa-solid fa-book-open" aria-hidden="true"></i>
                <span>Acervo</span>
            </a>
            <a href="/Biblioteca-Andromeda/adm?action=emprestimos" class="nav-item <?= $action === 'emprestimos' ? 'active' : '' ?>">
                <i class="fa-solid fa-scroll" aria-hidden="true"></i>
                <span>Empréstimos</span>
            </a>
            <a href="/Biblioteca-Andromeda/adm?action=novo_emprestimo" class="nav-item <?= $action === 'novo_emprestimo' ? 'active' : '' ?>">
                <i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i>
                <span>Registrar</span>
            </a>
            <a href="/Biblioteca-Andromeda/adm?action=add" class="nav-item <?= $action === 'add' ? 'active' : '' ?>">
                <i class="fa-solid fa-circle-plus" aria-hidden="true"></i>
                <span>Novo Livro</span>
            </a>
            <a href="/Biblioteca-Andromeda/adm?action=metadados" class="nav-item <?= $action === 'metadados' ? 'active' : '' ?>">
                <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
                <span>Dados</span>
            </a>
            <a href="/Biblioteca-Andromeda/adm?action=reservas" class="nav-item <?= $action === 'reservas' ? 'active' : '' ?>">
                <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
                <span>Reservas</span>
            </a>
            <a href="/Biblioteca-Andromeda/adm?action=perfis" class="nav-item <?= $action === 'perfis' ? 'active' : '' ?>">
                <i class="fa-solid fa-users-gear" aria-hidden="true"></i>
                <span>Perfis</span>
            </a>
        </div>

        <div class="nav-foot">
            <a href="/Biblioteca-Andromeda/catalogo" class="nav-item">
                <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
                <span>Catálogo</span>
            </a>
            <a href="/Biblioteca-Andromeda/logout" class="nav-item">
                <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
                <span>Sair</span>
            </a>
        </div>
    </nav>

    <div id="editorial-view" class="open">
        <h1 class="ed-header-title">
            <?php if (in_array($action, ['emprestimos', 'novo_emprestimo', 'registrar'])): ?>
                Registros <em>Cósmicos</em>
            <?php elseif ($action === 'perfis'): ?>
                Usuários & <em>Permissões</em>
            <?php elseif ($action === 'metadados'): ?>
                Dados do <em>Acervo</em>
            <?php else: ?>
                Controle do <em>Acervo</em>
            <?php endif; ?>
        </h1>
        <p class="ed-header-desc">
            <?php if (in_array($action, ['emprestimos', 'novo_emprestimo'])): ?>
                Acompanhe empréstimos, devoluções e prazos de leitura em uma visão simples.
            <?php elseif ($action === 'perfis'): ?>
                Acompanhe leitores e permissões do painel administrativo.
            <?php elseif ($action === 'metadados'): ?>
                Organize autores, editoras e categorias para deixar os cadastros mais rápidos.
            <?php else: ?>
                Cadastre, edite e acompanhe os livros da biblioteca em um só lugar.
            <?php endif; ?>
        </p>

        <div class="ed-section admin-section">


            <?php if ($action === 'listar'):
                $lista = listarLivros($mysqli);
                $total_livros = count($lista);
                $total_exemplares = array_sum(array_map(fn($item) => (int)($item['quantidade'] ?? 0), $lista));
                $total_disponiveis = count(array_filter($lista, fn($item) => (int)($item['quantidade'] ?? 0) > 0));
                $total_indisponiveis = $total_livros - $total_disponiveis;
            ?>
                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Visão geral</span>
                        <h2 class="ed-section-title">Acervo Cadastrado</h2>
                        <p>Pesquise, edite ou remova livros já cadastrados.</p>
                    </div>
                    <a href="/Biblioteca-Andromeda/adm?action=add" class="btn-prim section-action"><i class="fa-solid fa-plus" aria-hidden="true"></i> Novo livro</a>
                </div>

                <div class="admin-stats-grid animate-rise" style="animation-delay: 0.13s;">
                    <article class="admin-stat-card">
                        <i class="fa-solid fa-book-open" aria-hidden="true"></i>
                        <strong><?= $total_livros ?></strong>
                        <span>livros cadastrados</span>
                    </article>
                    <article class="admin-stat-card">
                        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                        <strong><?= $total_disponiveis ?></strong>
                        <span>com estoque</span>
                    </article>
                    <article class="admin-stat-card">
                        <i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i>
                        <strong><?= $total_exemplares ?></strong>
                        <span>exemplares disponíveis</span>
                    </article>
                    <article class="admin-stat-card">
                        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                        <strong><?= $total_indisponiveis ?></strong>
                        <span>sem estoque</span>
                    </article>
                </div>

                <div class="acervo-toolbar animate-rise" style="animation-delay: 0.16s;">
                    <div class="acervo-search-wrap">
                        <span class="acervo-search-icon" aria-hidden="true">⌕</span>
                        <input
                            type="search"
                            id="acervoSearch"
                            class="cosmic-input acervo-search-input"
                            placeholder="Pesquisar no acervo por título, autor, categoria, editora, ano ou status..."
                            autocomplete="off"
                            aria-label="Pesquisar no acervo">
                        <button type="button" id="clearAcervoSearch" class="acervo-search-clear" aria-label="Limpar pesquisa" hidden>×</button>
                    </div>

                    <div class="acervo-search-status" aria-live="polite">
                        <span id="acervoSearchCount">0</span>
                        <span>registros encontrados</span>
                    </div>
                </div>

                <div class="table-wrapper animate-rise" style="animation-delay: 0.24s;">
                    <div class="table-responsive">
                        <table class="cosmic-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Autor</th>
                                    <th>Categoria</th>
                                    <th>Editora</th>
                                    <th>Ano</th>
                                    <th>Status</th>
                                    <th>Qtd</th>
                                    <th style="text-align: right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                if (empty($lista)):
                                ?>
                                    <tr>
                                        <td colspan="8" class="empty-state">
                                            <i class="fa-solid fa-book-open" aria-hidden="true"></i>
                                            <p>Nenhum livro cadastrado ainda.</p>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($lista as $index => $livro):
                                        $statusBusca = ((int)($livro['quantidade'] ?? 0) > 0) ? 'Disponível disponivel com estoque' : 'Indisponível indisponivel sem estoque';
                                        $textoBuscaAcervo = trim(
                                            ($livro['titulo'] ?? '') . ' ' .
                                                ($livro['autor'] ?? '') . ' ' .
                                                ($livro['categoria'] ?? '') . ' ' .
                                                ($livro['editora'] ?? '') . ' ' .
                                                ($livro['ano_publicacao'] ?? '') . ' ' .
                                                ($livro['quantidade'] ?? '') . ' ' .
                                                $statusBusca
                                        );
                                    ?>
                                        <tr class="stagger-item" data-acervo-row data-acervo-search="<?= htmlspecialchars($textoBuscaAcervo, ENT_QUOTES, 'UTF-8') ?>" style="animation-delay: <?= 0.3 + ($index * 0.05) ?>s;">
                                            <td data-label="Título" style="font-weight: 600; color: var(--am3);"><?= htmlspecialchars($livro['titulo'] ?? '') ?></td>
                                            <td data-label="Autor"><?= htmlspecialchars($livro['autor'] ?? '') ?></td>
                                            <td data-label="Categoria"><?= htmlspecialchars($livro['categoria'] ?? '') ?></td>
                                            <td data-label="Editora" class="t-dim"><?= htmlspecialchars($livro['editora'] ?? '') ?></td>
                                            <td data-label="Ano" class="t-mono"><?= htmlspecialchars($livro['ano_publicacao'] ?? '') ?></td>
                                            <td data-label="Status">
                                                <?php if (($livro['quantidade'] ?? 0) > 0): ?>
                                                    <span class="sbadge s-disp">Disponível</span>
                                                <?php else: ?>
                                                    <span class="sbadge s-unk">Indisponível</span>
                                                <?php endif; ?>
                                            </td>
                                            <td data-label="Qtd" class="t-mono" style="color: var(--am);"><?= $livro['quantidade'] ?></td>
                                            <td data-label="Ações">
                                                <div class="action-group">
                                                    <a href="/Biblioteca-Andromeda/adm?action=edit&id=<?= $livro['id_livro'] ?>" class="btn-action btn-edit">
                                                        <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Editar
                                                    </a>
                                                    <a href="/Biblioteca-Andromeda/adm?action=delete&id=<?= $livro['id_livro'] ?>" class="btn-action btn-delete" data-confirm-title="Excluir livro" data-confirm-message="Remover este livro do acervo?" data-confirm-ok="Excluir" data-confirm-variant="danger">
                                                        <i class="fa-solid fa-trash-can" aria-hidden="true"></i> Excluir
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                    <tr id="acervoNoResults" class="acervo-no-results" hidden>
                                        <td colspan="8" class="empty-state">
                                            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                                            <p>Nenhum livro encontrado para essa busca.</p>
                                        </td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>


            <?php elseif ($action === 'add'):
                $salvo = $_SESSION['form_livro'] ?? [];
                unset($_SESSION['form_livro']);
            ?>
                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Novo cadastro</span>
                        <h2 class="ed-section-title">Adicionar Livro</h2>
                        <p>Preencha as informações principais e salve o livro no acervo.</p>
                    </div>
                    <a href="/Biblioteca-Andromeda/adm" class="btn-action btn-cancel section-action"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar</a>
                </div>

                <div class="form-intro-grid animate-rise" style="animation-delay: 0.16s;">
                    <article><span>01</span><strong>Identifique o livro</strong>
                        <p>Título, capa e sinopse ajudam o leitor a reconhecer a obra.</p>
                    </article>
                    <article><span>02</span><strong>Organize o acervo</strong>
                        <p>Autor, categoria e editora podem ser criados sem sair da página.</p>
                    </article>
                    <article><span>03</span><strong>Defina o estoque</strong>
                        <p>A quantidade controla se o livro aparece como disponível.</p>
                    </article>
                </div>

                <div class="cosmic-form form-wide animate-rise" style="animation-delay: 0.2s;">
                    <form method="POST" action="/Biblioteca-Andromeda/adm?action=add" enctype="multipart/form-data" id="formLivro" data-livro-form>

                        <div class="form-block-title"><i class="fa-solid fa-book" aria-hidden="true"></i><span>Informações principais</span></div>

                        <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                            <label>Título do livro</label>
                            <input type="text" name="titulo" class="cosmic-input" placeholder="Ex: Dom Casmurro" value="<?= htmlspecialchars($salvo['titulo'] ?? '') ?>" required>
                        </div>
                        <div class="form-group stagger-item" style="animation-delay: 0.32s;">
                            <label>Capa do livro</label>
                            <input type="file" name="capa" accept="image/jpeg, image/png, image/webp" class="cosmic-input">
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">Imagem em JPG, PNG ou WEBP, com até 2MB</p>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.34s;">
                            <label>Sinopse</label>
                            <textarea name="sinopse" class="cosmic-input cosmic-textarea" rows="6" placeholder="Escreva uma sinopse breve para aparecer no catálogo e nos detalhes do livro..."><?= htmlspecialchars($salvo['sinopse'] ?? '') ?></textarea>
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">✦ Aparece nos detalhes do livro para ajudar o leitor a escolher a próxima leitura.</p>
                        </div>

                        <div class="form-block-title"><i class="fa-solid fa-tags" aria-hidden="true"></i><span>Dados</span></div>

                        <div class="form-group stagger-item" style="animation-delay: 0.35s;">
                            <label>Autor</label>
                            <div class="field-with-action">
                                <select name="id_autor" id="id_autor" class="cosmic-input">
                                    <option value="">-- Selecione o Autor --</option>
                                    <?php foreach (listarAutores($mysqli) as $a): ?>
                                        <option value="<?= $a['id_autor'] ?>"
                                            <?= ($a['id_autor'] == ($_GET['autor_id'] ?? $_GET['id_autor'] ?? $salvo['id_autor'] ?? '')) ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($a['nome']) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" class="btn-sec btn-sm" onclick="toggleNovoAutor()">+ Novo Autor</button>
                            </div>

                            <div id="div_novo_autor" class="inline-create-panel" hidden>
                                <h4>Novo autor</h4>
                                <div class="form-group"><input type="text" id="novo_autor_nome" class="cosmic-input" placeholder="Nome do autor"></div>
                                <div class="form-group"><textarea id="novo_autor_descricao" class="cosmic-input cosmic-textarea" placeholder="Descrição" rows="3"></textarea></div>
                                <div class="form-group"><input type="text" id="novo_autor_nacionalidade" class="cosmic-input" placeholder="Nacionalidade"></div>
                                <div class="inline-create-actions">
                                    <button type="button" class="btn-sec btn-sm" style="color: var(--am); border-color: var(--am);" onclick="salvarNovoAutor(event)">Salvar autor</button>
                                    <button type="button" class="btn-sec btn-sm" onclick="toggleNovoAutor(false)">Cancelar</button>
                                </div>
                                <p id="novoAutorFeedback" class="inline-feedback" aria-live="polite"></p>
                            </div>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.4s;">
                            <label>Categoria</label>
                            <div class="field-with-action">
                                <select name="id_categoria" id="id_categoria" class="cosmic-input">
                                    <option value="">-- Selecione a Categoria --</option>
                                    <?php foreach (listarCategorias($mysqli) as $c): ?>
                                        <option value="<?= $c['id_categoria'] ?>"
                                            <?= ($c['id_categoria'] == ($_GET['categoria_id'] ?? $_GET['id_categoria'] ?? $salvo['id_categoria'] ?? '')) ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($c['nome']) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" class="btn-sec btn-sm" onclick="toggleNovaCategoria()">+ Nova Categoria</button>
                            </div>

                            <div id="div_nova_categoria" class="inline-create-panel" hidden>
                                <h4>Nova categoria</h4>
                                <div class="form-group"><input type="text" id="nova_categoria_nome" class="cosmic-input" placeholder="Nome da categoria"></div>
                                <div class="inline-create-actions">
                                    <button type="button" class="btn-sec btn-sm" style="color: var(--am); border-color: var(--am);" onclick="salvarNovaCategoria(event)">Salvar categoria</button>
                                    <button type="button" class="btn-sec btn-sm" onclick="toggleNovaCategoria(false)">Cancelar</button>
                                </div>
                                <p id="novaCategoriaFeedback" class="inline-feedback" aria-live="polite"></p>
                            </div>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.45s;">
                            <label>Editora</label>
                            <div class="field-with-action">
                                <select name="id_editora" id="id_editora" class="cosmic-input">
                                    <option value="">-- Selecione a Editora --</option>
                                    <?php foreach (listarEditoras($mysqli) as $e): ?>
                                        <option value="<?= $e['id_editora'] ?>"
                                            <?= ($e['id_editora'] == ($_GET['editora_id'] ?? $_GET['id_editora'] ?? $salvo['id_editora'] ?? '')) ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($e['nome']) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" class="btn-sec btn-sm" onclick="toggleNovaEditora()">+ Nova Editora</button>
                            </div>

                            <div id="div_nova_editora" class="inline-create-panel" hidden>
                                <h4>Nova editora</h4>
                                <div class="form-group"><input type="text" id="nova_editora_nome" class="cosmic-input" placeholder="Nome da editora"></div>
                                <div class="form-group"><textarea id="nova_editora_descricao" class="cosmic-input cosmic-textarea" placeholder="Descrição" rows="3"></textarea></div>
                                <div class="inline-create-actions">
                                    <button type="button" class="btn-sec btn-sm" style="color: var(--am); border-color: var(--am);" onclick="salvarNovaEditora(event)">Salvar editora</button>
                                    <button type="button" class="btn-sec btn-sm" onclick="toggleNovaEditora(false)">Cancelar</button>
                                </div>
                                <p id="novaEditoraFeedback" class="inline-feedback" aria-live="polite"></p>
                            </div>
                        </div>

                        <div class="form-block-title"><i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i><span>Publicação e estoque</span></div>

                        <div class="form-grid-two">
                            <div class="form-group stagger-item" style="animation-delay: 0.5s;">
                                <label>Ano de publicação</label>
                                <input type="number" name="ano_publicacao" class="cosmic-input" placeholder="Ex: 1899" value="<?= $salvo['ano_publicacao'] ?? '' ?>">
                            </div>
                            <div class="form-group stagger-item" style="animation-delay: 0.55s;">
                                <label>Número de páginas</label>
                                <input type="number" name="numero_paginas" class="cosmic-input" placeholder="Ex: 256" value="<?= $salvo['numero_paginas'] ?? '' ?>">
                            </div>
                        </div>

                        <div class="form-grid-two compact-grid">
                            <div class="form-group stagger-item" style="animation-delay: 0.6s;">
                                <label>Idioma de origem</label>
                                <input type="text" name="origem_idioma" class="cosmic-input" placeholder="Ex: Português" value="<?= htmlspecialchars($salvo['origem_idioma'] ?? '') ?>">
                            </div>

                            <div class="form-group stagger-item" style="animation-delay: 0.65s;">
                                <label>Quantidade</label>
                                <input type="number" name="quantidade" class="cosmic-input" placeholder="Ex: 3" value="<?= $salvo['quantidade'] ?? '' ?>" min="0">
                                <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">Se a quantidade for zero, o livro aparece como indisponível</p>
                            </div>
                        </div>

                        <div class="form-actions stagger-item" style="animation-delay: 0.8s; gap: 16px;">
                            <a href="/Biblioteca-Andromeda/adm" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                            <button type="submit" class="btn-prim">Salvar Livro</button>
                        </div>
                    </form>
                </div>


            <?php elseif ($action === 'edit' && isset($_GET['id'])):
                $id    = (int) $_GET['id'];
                $livro = buscarLivroPorId($mysqli, $id);
            ?>
                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Edição</span>
                        <h2 class="ed-section-title">Editar Livro: <span style="color: var(--am3); font-weight: 400;"><?= htmlspecialchars($livro['titulo']) ?></span></h2>
                        <p>Revise os dados do livro e salve apenas quando tudo estiver correto.</p>
                    </div>
                    <a href="/Biblioteca-Andromeda/adm" class="btn-action btn-cancel section-action"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar</a>
                </div>

                <div class="form-intro-grid animate-rise" style="animation-delay: 0.16s;">
                    <article><span>01</span><strong>Conteúdo</strong>
                        <p>Atualize título, capa e sinopse quando necessário.</p>
                    </article>
                    <article><span>02</span><strong>Classificação</strong>
                        <p>Confira autor, categoria, editora e dados da publicação.</p>
                    </article>
                    <article><span>03</span><strong>Disponibilidade</strong>
                        <p>A quantidade define a disponibilidade exibida no acervo.</p>
                    </article>
                </div>

                <div class="cosmic-form form-wide animate-rise" style="animation-delay: 0.2s;">
                    <form method="POST" action="/Biblioteca-Andromeda/adm?action=edit" enctype="multipart/form-data" id="formLivro" data-livro-form>

                        <input type="hidden" name="id_livro" value="<?= $id ?>">

                        <div class="form-block-title"><i class="fa-solid fa-book" aria-hidden="true"></i><span>Informações principais</span></div>

                        <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                            <label>Título do livro</label>
                            <input type="text" name="titulo" class="cosmic-input" placeholder="Ex: Dom Casmurro" value="<?= htmlspecialchars($livro['titulo']) ?>" required>
                        </div>
                        <div class="form-group stagger-item" style="animation-delay: 0.32s;">
                            <label>Capa do livro</label>
                            <?php if (!empty($livro['capa'])): ?>
                                <img src="/Biblioteca-Andromeda/<?= htmlspecialchars($livro['capa']) ?>"
                                    alt="Capa atual"
                                    loading="lazy"
                                    decoding="async"
                                    style="width: 80px; border-radius: 6px; margin-bottom: 10px; display: block;">
                            <?php endif; ?>
                            <input type="hidden" name="capa_atual" value="<?= htmlspecialchars($livro['capa'] ?? '') ?>">
                            <input type="file" name="capa" accept="image/jpeg, image/png, image/webp" class="cosmic-input">
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">Deixe vazio para manter a capa atual</p>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.34s;">
                            <label>Sinopse</label>
                            <textarea name="sinopse" class="cosmic-input cosmic-textarea" rows="6" placeholder="Atualize a sinopse do livro..."><?= htmlspecialchars($livro['sinopse'] ?? '') ?></textarea>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.35s;">
                            <label>Autor</label>
                            <select name="id_autor" class="cosmic-input">
                                <?php foreach (listarAutores($mysqli) as $a): ?>
                                    <option value="<?= $a['id_autor'] ?>"
                                        <?= $a['id_autor'] == $livro['id_autor'] ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($a['nome']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.4s;">
                            <label>Categoria</label>
                            <select name="id_categoria" class="cosmic-input">
                                <?php foreach (listarCategorias($mysqli) as $c): ?>
                                    <option value="<?= $c['id_categoria'] ?>"
                                        <?= $c['id_categoria'] == $livro['id_categoria'] ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($c['nome']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.45s;">
                            <label>Editora</label>
                            <select name="id_editora" class="cosmic-input">
                                <?php foreach (listarEditoras($mysqli) as $e): ?>
                                    <option value="<?= $e['id_editora'] ?>"
                                        <?= $e['id_editora'] == $livro['id_editora'] ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($e['nome']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div class="form-group stagger-item" style="animation-delay: 0.5s;">
                                <label>Ano de publicação</label>
                                <input type="number" name="ano_publicacao" class="cosmic-input" value="<?= $livro['ano_publicacao'] ?>">
                            </div>
                            <div class="form-group stagger-item" style="animation-delay: 0.55s;">
                                <label>Número de páginas</label>
                                <input type="number" name="numero_paginas" class="cosmic-input" value="<?= $livro['numero_paginas'] ?>">
                            </div>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.6s;">
                            <label>Idioma de origem</label>
                            <input type="text" name="origem_idioma" class="cosmic-input" value="<?= htmlspecialchars($livro['origem_idioma']) ?>">
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.65s;">
                            <label>Quantidade</label>
                            <input type="number" name="quantidade" class="cosmic-input" value="<?= $livro['quantidade'] ?>" min="0">
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">Se a quantidade for zero, o livro aparece como indisponível</p>
                        </div>

                        <div class="form-actions stagger-item" style="animation-delay: 0.8s; gap: 16px;">
                            <a href="/Biblioteca-Andromeda/adm" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                            <button type="submit" class="btn-prim">Salvar Alterações</button>
                        </div>
                    </form>
                </div>


            <?php elseif ($action === 'emprestimos'):  verificarENotificarAtrasos($mysqli); ?>
                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Movimentação</span>
                        <h2 class="ed-section-title">Empréstimos Ativos</h2>
                        <p>Acompanhe quem está com cada livro e registre devoluções.</p>
                    </div>
                    <a href="/Biblioteca-Andromeda/adm?action=novo_emprestimo" class="btn-prim section-action"><i class="fa-solid fa-plus" aria-hidden="true"></i> Novo empréstimo</a>
                </div>

                <div class="table-wrapper animate-rise" style="animation-delay: 0.2s;">
                    <div class="table-responsive">
                        <table class="cosmic-table">
                            <thead>
                                <tr>
                                    <th>Livro</th>
                                    <th>Leitor</th>
                                    <th>Data Empréstimo</th>
                                    <th>Previsão Devolução</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $emprestimos = listarEmprestimos($mysqli);
                                if (empty($emprestimos)):
                                ?>
                                    <tr>
                                        <td colspan="6" class="empty-state">
                                            <i class="fa-solid fa-scroll" aria-hidden="true"></i>
                                            <p>Nenhum empréstimo registrado no momento.</p>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($emprestimos as $index => $e): ?>
                                        <tr class="stagger-item" style="animation-delay: <?= 0.3 + ($index * 0.05) ?>s;">
                                            <td data-label="Livro" style="font-weight: 600; color: var(--am3);"><?= htmlspecialchars($e['titulo']) ?></td>
                                            <td data-label="Leitor"><?= htmlspecialchars($e['usuario']) ?></td>
                                            <td data-label="Empréstimo" class="t-mono"><?= date('d/m/Y', strtotime($e['data_emprestimo'])) ?></td>
                                            <td data-label="Devolução" class="t-mono"><?= date('d/m/Y', strtotime($e['data_devolucao'])) ?></td>
                                            <td data-label="Status">
                                                <?php if ($e['status_emprestimo'] === 'Pendente'): ?>
                                                    <span class="sbadge s-empr">Pendente</span>
                                                <?php elseif ($e['status_emprestimo'] === 'Atrasado'): ?>
                                                    <span class="sbadge s-atrasado">Atrasado</span>
                                                <?php else: ?>
                                                    <span class="sbadge s-disp">Devolvido</span>
                                                <?php endif; ?>
                                            </td>
                                            <td data-label="Ação" style="text-align: right;">
                                                <?php if ($e['status_emprestimo'] === 'Pendente' || $e['status_emprestimo'] === 'Atrasado'): ?>
                                                    <a href="/Biblioteca-Andromeda/adm?action=devolver&id=<?= $e['id_emprestimo'] ?>" class="btn-sec btn-sm" data-confirm-title="Confirmar devolução" data-confirm-message="Registrar a devolução deste livro?" data-confirm-ok="Dar baixa" data-confirm-variant="success">Dar Baixa</a>
                                                <?php else: ?>
                                                    <span class="t-dim t-mono" style="font-size: 0.7rem;">Em: <?= date('d/m/Y', strtotime($e['data_devolucao'])) ?></span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>


            <?php elseif ($action === 'novo_emprestimo'): ?>
                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Novo empréstimo</span>
                        <h2 class="ed-section-title">Registrar Empréstimo</h2>
                        <p>Escolha o livro, o leitor e a data prevista para devolução.</p>
                    </div>
                    <a href="/Biblioteca-Andromeda/adm?action=emprestimos" class="btn-action btn-cancel section-action"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar</a>
                </div>

                <form method="POST" action="/Biblioteca-Andromeda/adm?action=registrar" class="cosmic-form form-wide animate-rise" style="animation-delay: 0.2s;">

                    <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                        <label>Livro solicitado</label>
                        <select name="id_livro" required class="cosmic-input">
                            <option value="">-- Selecione o livro --</option>
                            <?php foreach (listarLivros($mysqli) as $l):
                                $id   = $l['id_livro']    ?? 0;
                                $nome = $l['titulo']      ?? 'Sem título';
                                $qtd  = $l['quantidade']  ?? 0;
                            ?>
                                <option value="<?= $id ?>" <?= $qtd == 0 ? 'disabled' : '' ?>>
                                    <?= htmlspecialchars($nome) ?> <?= $qtd == 0 ? '(Esgotado)' : "— (Qtd: $qtd)" ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group stagger-item" style="animation-delay: 0.4s;">
                        <label>Leitor</label>
                        <select name="id_usuario" required class="cosmic-input">
                            <option value="">-- Selecione o Leitor --</option>
                            <?php foreach (listarUsuarios($mysqli) as $u): ?>
                                <option value="<?= $u['id_usuario'] ?>"><?= htmlspecialchars($u['nome']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group stagger-item" style="animation-delay: 0.5s;">
                        <label>Data prevista para devolução</label>
                        <input type="date" name="data_devolucao" required class="cosmic-input" min="<?= date('Y-m-d') ?>">
                    </div>

                    <div class="form-actions stagger-item" style="animation-delay: 0.6s;">
                        <a href="/Biblioteca-Andromeda/adm?action=emprestimos" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                        <button type="submit" class="btn-prim">Confirmar Empréstimo</button>
                    </div>
                </form>

            <?php elseif ($action === 'reservas'):
                $livros_indisponiveis = $mysqli->query("SELECT * FROM Livros WHERE quantidade = 0 ORDER BY titulo ASC")->fetch_all(MYSQLI_ASSOC) ?? [];
            ?>
                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Reservas</span>
                        <h2 class="ed-section-title">Fila de Espera</h2>
                        <p>Acompanhe livros sem estoque e leitores aguardando uma nova unidade.</p>
                    </div>
                </div>

                <?php if (empty($livros_indisponiveis)): ?>
                    <div class="cosmic-empty-card animate-rise">
                        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                        <strong>Todos os livros estão disponíveis</strong>
                        <span>Nenhuma fila de espera no momento.</span>
                    </div>
                <?php else: ?>
                    <?php foreach ($livros_indisponiveis as $livro):
                        $reservas = listarReservasPorLivro($mysqli, $livro['id_livro']);
                        $emprestimos = listarEmprestimosPorLivro($mysqli, $livro['id_livro']);
                    ?>
                        <div class="cosmic-card animate-rise" style="margin-bottom: 20px; padding: 20px; border: 1px solid var(--border-hairline); border-radius: 8px;">
                            <div style="margin-bottom: 16px;">
                                <h3 style="margin: 0 0 8px 0; color: var(--text);"><?= htmlspecialchars($livro['titulo']) ?></h3>
                                <p style="margin: 0; color: var(--text-dim); font-size: 0.9rem;">
                                    <i class="fa-solid fa-book"></i> <?= htmlspecialchars($livro['autor'] ?? '—') ?>
                                </p>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

                                <div style="padding: 12px; background: rgba(255,107,107,0.1); border-radius: 6px; border-left: 3px solid #ff6b6b;">
                                    <div style="color: #ff6b6b; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">
                                        <i class="fa-solid fa-clock-rotate-left"></i> FILA DE ESPERA (<?= count($reservas) ?>)
                                    </div>
                                    <?php if (empty($reservas)): ?>
                                        <p style="color: var(--text-dim); font-size: 0.85rem; margin: 0;">Nenhuma reserva</p>
                                    <?php else: ?>
                                        <ul style="list-style: none; padding: 0; margin: 0;">
                                            <?php foreach ($reservas as $r): ?>
                                                <li style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
                                                    <strong><?= htmlspecialchars($r['usuario']) ?></strong>
                                                    <br><span style="color: var(--text-dim); font-size: 0.8rem;">Desde: <?= date('d/m/Y', strtotime($r['data_reserva'])) ?></span>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    <?php endif; ?>
                                </div>


                                <div style="padding: 12px; background: rgba(74,144,226,0.1); border-radius: 6px; border-left: 3px solid #4a90e2;">
                                    <div style="color: #4a90e2; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">
                                        <i class="fa-solid fa-hand-holding-heart"></i> EM EMPRÉSTIMO (<?= count($emprestimos) ?>)
                                    </div>
                                    <?php if (empty($emprestimos)): ?>
                                        <p style="color: var(--text-dim); font-size: 0.85rem; margin: 0;">Nenhuma unidade emprestada</p>
                                    <?php else: ?>
                                        <ul style="list-style: none; padding: 0; margin: 0;">
                                            <?php foreach ($emprestimos as $e):
                                                $status_class = $e['status_emprestimo'] === 'Atrasado' ? '#ff6b6b' : '#4a90e2';
                                            ?>
                                                <li style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;">
                                                    <strong><?= htmlspecialchars($e['usuario']) ?></strong>
                                                    <br><span style="color: var(--text-dim); font-size: 0.8rem;">Desde: <?= date('d/m/Y', strtotime($e['data_emprestimo'])) ?></span>
                                                    <br><span style="color: <?= $status_class ?>; font-size: 0.8rem; font-weight: 600;">→ Devolução: <?= date('d/m/Y', strtotime($e['data_devolucao'])) ?> (<?= $e['status_emprestimo'] ?>)</span>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>


            <?php elseif ($action === 'metadados'):
                $autores_meta = $mysqli->query("SELECT a.id_autor, a.nome, a.nacionalidade, COUNT(l.id_livro) AS total_livros FROM autores a LEFT JOIN Livros l ON l.id_autor = a.id_autor GROUP BY a.id_autor, a.nome, a.nacionalidade ORDER BY a.nome ASC")->fetch_all(MYSQLI_ASSOC) ?? [];
                $editoras_meta = $mysqli->query("SELECT e.id_editora, e.nome, COUNT(l.id_livro) AS total_livros FROM editoras e LEFT JOIN Livros l ON l.id_editora = e.id_editora GROUP BY e.id_editora, e.nome ORDER BY e.nome ASC")->fetch_all(MYSQLI_ASSOC) ?? [];
                $categorias_meta = $mysqli->query("SELECT c.id_categoria, c.nome, COUNT(l.id_livro) AS total_livros FROM Categorias c LEFT JOIN Livros l ON l.id_categoria = c.id_categoria GROUP BY c.id_categoria, c.nome ORDER BY c.nome ASC")->fetch_all(MYSQLI_ASSOC) ?? [];
            ?>
                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Dados do acervo</span>
                        <h2 class="ed-section-title">Autores, Editoras e Categorias</h2>
                        <p>Organize os dados usados no cadastro dos livros.</p>
                    </div>
                    <a href="/Biblioteca-Andromeda/adm?action=add" class="btn-prim section-action"><i class="fa-solid fa-plus" aria-hidden="true"></i> Novo livro</a>
                </div>

                <div class="metadata-summary-grid animate-rise" style="animation-delay: 0.14s;">
                    <article>
                        <i class="fa-solid fa-user-pen" aria-hidden="true"></i>
                        <strong><?= count($autores_meta) ?></strong>
                        <span>autores</span>
                    </article>
                    <article>
                        <i class="fa-solid fa-building-columns" aria-hidden="true"></i>
                        <strong><?= count($editoras_meta) ?></strong>
                        <span>editoras</span>
                    </article>
                    <article>
                        <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
                        <strong><?= count($categorias_meta) ?></strong>
                        <span>categorias</span>
                    </article>
                </div>

                <div class="metadata-grid animate-rise" style="animation-delay: 0.18s;">
                    <section class="metadata-card">
                        <div class="metadata-card-head">
                            <span class="metadata-orb"><i class="fa-solid fa-user-pen" aria-hidden="true"></i></span>
                            <div>
                                <h3>Autores</h3>
                                <p><?= count($autores_meta) ?> cadastrados</p>
                            </div>
                        </div>

                        <div class="metadata-search-wrap">
                            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <input type="search" class="cosmic-input metadata-search-input" placeholder="Buscar autor..." data-meta-search-input>
                        </div>

                        <?php if (empty($autores_meta)): ?>
                            <div class="metadata-empty">Nenhum autor cadastrado.</div>
                        <?php else: ?>
                            <div class="metadata-list">
                                <?php foreach ($autores_meta as $a): ?>
                                    <div class="metadata-row" data-meta-row>
                                        <div>
                                            <strong><?= htmlspecialchars($a['nome']) ?></strong>
                                            <span><?= htmlspecialchars($a['nacionalidade'] ?: 'Nacionalidade não informada') ?> • <?= (int)$a['total_livros'] ?> livro(s)</span>
                                        </div>
                                        <form method="POST" action="/Biblioteca-Andromeda/adm?action=excluir_autor" data-confirm-title="Remover autor" data-confirm-message="Remover este autor da organização do acervo?" data-confirm-ok="Remover" data-confirm-variant="danger">
                                            <input type="hidden" name="id_autor" value="<?= (int)$a['id_autor'] ?>">
                                            <button type="submit" class="btn-action btn-delete metadata-delete"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Remover</button>
                                        </form>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            <div class="metadata-empty metadata-no-results" hidden>Nenhum autor encontrado.</div>
                        <?php endif; ?>
                    </section>

                    <section class="metadata-card">
                        <div class="metadata-card-head">
                            <span class="metadata-orb"><i class="fa-solid fa-building-columns" aria-hidden="true"></i></span>
                            <div>
                                <h3>Editoras</h3>
                                <p><?= count($editoras_meta) ?> cadastradas</p>
                            </div>
                        </div>

                        <div class="metadata-search-wrap">
                            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <input type="search" class="cosmic-input metadata-search-input" placeholder="Buscar editora..." data-meta-search-input>
                        </div>

                        <?php if (empty($editoras_meta)): ?>
                            <div class="metadata-empty">Nenhuma editora cadastrada.</div>
                        <?php else: ?>
                            <div class="metadata-list">
                                <?php foreach ($editoras_meta as $e): ?>
                                    <div class="metadata-row" data-meta-row>
                                        <div>
                                            <strong><?= htmlspecialchars($e['nome']) ?></strong>
                                            <span><?= (int)$e['total_livros'] ?> livro(s)</span>
                                        </div>
                                        <form method="POST" action="/Biblioteca-Andromeda/adm?action=excluir_editora" data-confirm-title="Remover editora" data-confirm-message="Remover esta editora da organização do acervo?" data-confirm-ok="Remover" data-confirm-variant="danger">
                                            <input type="hidden" name="id_editora" value="<?= (int)$e['id_editora'] ?>">
                                            <button type="submit" class="btn-action btn-delete metadata-delete"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Remover</button>
                                        </form>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            <div class="metadata-empty metadata-no-results" hidden>Nenhuma editora encontrada.</div>
                        <?php endif; ?>
                    </section>

                    <section class="metadata-card">
                        <div class="metadata-card-head">
                            <span class="metadata-orb"><i class="fa-solid fa-layer-group" aria-hidden="true"></i></span>
                            <div>
                                <h3>Categorias</h3>
                                <p><?= count($categorias_meta) ?> cadastradas</p>
                            </div>
                        </div>

                        <div class="metadata-search-wrap">
                            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                            <input type="search" class="cosmic-input metadata-search-input" placeholder="Buscar categoria..." data-meta-search-input>
                        </div>

                        <?php if (empty($categorias_meta)): ?>
                            <div class="metadata-empty">Nenhuma categoria cadastrada.</div>
                        <?php else: ?>
                            <div class="metadata-list">
                                <?php foreach ($categorias_meta as $c): ?>
                                    <div class="metadata-row" data-meta-row>
                                        <div>
                                            <strong><?= htmlspecialchars($c['nome']) ?></strong>
                                            <span><?= (int)$c['total_livros'] ?> livro(s)</span>
                                        </div>
                                        <form method="POST" action="/Biblioteca-Andromeda/adm?action=excluir_categoria" data-confirm-title="Remover categoria" data-confirm-message="Remover esta categoria da organização do acervo?" data-confirm-ok="Remover" data-confirm-variant="danger">
                                            <input type="hidden" name="id_categoria" value="<?= (int)$c['id_categoria'] ?>">
                                            <button type="submit" class="btn-action btn-delete metadata-delete"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Remover</button>
                                        </form>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                            <div class="metadata-empty metadata-no-results" hidden>Nenhuma categoria encontrada.</div>
                        <?php endif; ?>
                    </section>
                </div>

            <?php elseif ($action === 'perfis'):
                $busca_perfis = trim($_GET['busca'] ?? $_POST['busca'] ?? '');
                $param_perfis = "%$busca_perfis%";
                $stmt = $mysqli->prepare(
                    "SELECT id_usuario, nome, email, nivel_acesso
         FROM usuarios
         WHERE nome LIKE ? OR email LIKE ?
         ORDER BY nome ASC"
                );
                $stmt->bind_param('ss', $param_perfis, $param_perfis);
                $stmt->execute();
                $usuarios = $stmt->get_result();
                $stmt->close();
            ?>

                <div class="section-headline animate-rise" style="animation-delay: 0.1s;">
                    <div>
                        <span class="eyebrow">Acesso</span>
                        <h2 class="ed-section-title">Usuários & <em>Permissões</em></h2>
                        <p>Pesquise leitores e controle quem pode acessar o painel administrativo.</p>
                    </div>
                </div>

                <?php if ($msg): ?>
                    <div class="cosmic-notice sucesso animate-rise" role="status" aria-live="polite" aria-atomic="true">
                        <div class="notice-orb"><i class="fa-solid fa-user-check"></i></div>
                        <div class="notice-content">
                            <strong>Perfil atualizado</strong>
                            <span><?= htmlspecialchars($msg) ?></span>
                        </div>
                    </div>
                <?php endif; ?>


                <form method="GET" action="/Biblioteca-Andromeda/adm" class="admin-search-form profile-search-form animate-rise" style="animation-delay:0.15s;">
                    <input type="hidden" name="action" value="perfis">
                    <input
                        type="text"
                        name="busca"
                        class="cosmic-input profile-search-input"
                        placeholder="Pesquisar por nome ou e-mail..."
                        value="<?= htmlspecialchars($busca_perfis) ?>">
                    <button type="submit" class="btn-sec profile-search-button"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Buscar</button>
                    <?php if ($busca_perfis): ?>
                        <a href="/Biblioteca-Andromeda/adm?action=perfis" class="btn-action btn-cancel profile-search-clear"><i class="fa-solid fa-xmark" aria-hidden="true"></i> Limpar</a>
                    <?php endif; ?>
                </form>


                <div class="table-wrapper animate-rise" style="animation-delay: 0.2s;">
                    <div class="table-responsive">
                        <table class="cosmic-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Tipo</th>

                                    <th style="text-align:right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $total = 0;
                                while ($u = $usuarios->fetch_assoc()):
                                    $total++;
                                ?>
                                    <tr class="stagger-item" style="animation-delay: <?= 0.25 + ($total * 0.05) ?>s;">
                                        <td data-label="Nome" style="font-weight:600; color:var(--am3);"><?= htmlspecialchars($u['nome']) ?></td>
                                        <td data-label="E-mail" class="t-dim"><?= htmlspecialchars($u['email']) ?></td>
                                        <td data-label="Tipo">
                                            <?php if ($u['nivel_acesso'] === 'admin'): ?>
                                                <span class="sbadge s-empr">Guardião</span>
                                            <?php else: ?>
                                                <span class="sbadge s-disp">Leitor</span>
                                            <?php endif; ?>
                                        </td>

                                        <td data-label="Ações">
                                            <div class="action-group" style="justify-content:flex-end;">
                                                <?php if ((int)$u['id_usuario'] === (int)$_SESSION['id_usuario']): ?>
                                                    <span class="t-dim t-mono" style="font-size:0.75rem;">(você)</span>

                                                <?php elseif ($u['nivel_acesso'] === 'leitor'): ?>

                                                    <form method="POST" action="/Biblioteca-Andromeda/adm?action=perfis" style="display:inline"
                                                        data-confirm-title="Promover perfil"
                                                        data-confirm-message="Promover <?= htmlspecialchars($u['nome'], ENT_QUOTES, 'UTF-8') ?> a Guardião?"
                                                        data-confirm-ok="Promover"
                                                        data-confirm-variant="success">
                                                        <input type="hidden" name="acao" value="promover">
                                                        <input type="hidden" name="uid" value="<?= $u['id_usuario'] ?>">
                                                        <?php if ($busca_perfis): ?>
                                                            <input type="hidden" name="busca" value="<?= htmlspecialchars($busca_perfis) ?>">
                                                        <?php endif; ?>
                                                        <button class="btn-action btn-edit"><i class="fa-solid fa-user-shield" aria-hidden="true"></i> Promover</button>
                                                    </form>

                                                    <form method="POST" action="/Biblioteca-Andromeda/adm?action=perfis" style="display:inline"
                                                        data-confirm-title="Remover perfil"
                                                        data-confirm-message="Remover <?= htmlspecialchars($u['nome'], ENT_QUOTES, 'UTF-8') ?> do sistema?"
                                                        data-confirm-ok="Remover"
                                                        data-confirm-variant="danger">
                                                        <input type="hidden" name="acao" value="excluir">
                                                        <input type="hidden" name="uid" value="<?= $u['id_usuario'] ?>">
                                                        <?php if ($busca_perfis): ?>
                                                            <input type="hidden" name="busca" value="<?= htmlspecialchars($busca_perfis) ?>">
                                                        <?php endif; ?>
                                                        <button class="btn-action btn-delete"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Remover</button>
                                                    </form>

                                                <?php else: ?>
                                                    <form method="POST" action="/Biblioteca-Andromeda/adm?action=perfis" style="display:inline"
                                                        data-confirm-title="Rebaixar perfil"
                                                        data-confirm-message="Rebaixar <?= htmlspecialchars($u['nome'], ENT_QUOTES, 'UTF-8') ?> para leitor?"
                                                        data-confirm-ok="Rebaixar"
                                                        data-confirm-variant="warning">
                                                        <input type="hidden" name="acao" value="rebaixar">
                                                        <input type="hidden" name="uid" value="<?= $u['id_usuario'] ?>">
                                                        <?php if ($busca_perfis): ?>
                                                            <input type="hidden" name="busca" value="<?= htmlspecialchars($busca_perfis) ?>">
                                                        <?php endif; ?>
                                                        <button class="btn-action btn-demote"><i class="fa-solid fa-user-minus" aria-hidden="true"></i> Rebaixar</button>
                                                    </form>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endwhile; ?>

                                <?php if ($total === 0): ?>
                                    <tr>
                                        <td colspan="4" class="empty-state">
                                            <i class="fa-solid fa-user-magnifying-glass" aria-hidden="true"></i>
                                            <p>Nenhum leitor encontrado com essa busca.</p>
                                        </td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>


            <?php endif; ?>

        </div>
    </div>


    <div id="adm-confirm-overlay" class="adm-confirm-overlay" hidden>
        <div class="adm-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="adm-confirm-title" aria-describedby="adm-confirm-message">
            <div class="adm-confirm-orb" id="adm-confirm-orb">
                <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            </div>
            <div class="adm-confirm-copy">
                <span class="adm-confirm-kicker">Confirmação</span>
                <h3 id="adm-confirm-title">Confirmar ação</h3>
                <p id="adm-confirm-message">Deseja continuar?</p>
            </div>
            <div class="adm-confirm-actions">
                <button type="button" class="adm-confirm-cancel" data-confirm-cancel>Cancelar</button>
                <button type="button" class="adm-confirm-ok" data-confirm-ok>Confirmar</button>
            </div>
        </div>
    </div>

    <script src="/Biblioteca-Andromeda/assets/js/pgadm.js"></script>

</body>

</html>