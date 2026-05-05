<?php
session_start();
include "../config/conexao.php";
include "../config/crud.php";
require_once "../config/sessao.php";
protegerAdmin();



$msg = '';
$busca = '';


$action = $_GET['action'] ?? 'listar';

// ─── NOVO AUTOR ───────────────────────────────────────────────────────────────
if ($action === 'novo_autor' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION['form_livro'] = [
        'titulo'         => $_POST['titulo']         ?? '',
        'id_categoria'   => $_POST['id_categoria']   ?? '',
        'id_editora'     => $_POST['id_editora']     ?? '',
        'ano_publicacao' => $_POST['ano_publicacao'] ?? '',
        'numero_paginas' => $_POST['numero_paginas'] ?? '',
        'origem_idioma'  => $_POST['origem_idioma']  ?? '',
        'status'         => $_POST['status']         ?? '',
        'quantidade'     => $_POST['quantidade']     ?? '',
    ];
    $novo_id = adicionarAutor($mysqli, $_POST['nome'], $_POST['descricao'], $_POST['nacionalidade']);
    header("Location: adm.php?action=add&autor_id=" . $novo_id);
    exit;
}

// ─── NOVA EDITORA ─────────────────────────────────────────────────────────────
if ($action === 'nova_editora' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION['form_livro'] = [
        'titulo'         => $_POST['titulo']         ?? '',
        'id_autor'       => $_POST['id_autor']       ?? '',
        'id_categoria'   => $_POST['id_categoria']   ?? '',
        'ano_publicacao' => $_POST['ano_publicacao'] ?? '',
        'numero_paginas' => $_POST['numero_paginas'] ?? '',
        'origem_idioma'  => $_POST['origem_idioma']  ?? '',
        'status'         => $_POST['status']         ?? '',
        'quantidade'     => $_POST['quantidade']     ?? '',
    ];
    $novo_id = adicionarEditora($mysqli, $_POST['nome'], $_POST['descricao']);
    header("Location: adm.php?action=add&editora_id=" . $novo_id);
    exit;
}

// ─── REGISTRAR EMPRÉSTIMO ─────────────────────────────────────────────────────
if ($action === 'registrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_livro      = $_POST['id_livro'];
    $id_usuario    = $_POST['id_usuario'];
    $data_prevista = $_POST['data_devolucao'];

    if (registrarEmprestimo($mysqli, $id_livro, $id_usuario, $data_prevista)) {
        header("Location: adm.php?action=emprestimos&msg=sucesso");
    } else {
        header("Location: adm.php?action=emprestimos&msg=erro_estoque");
    }
    exit;
}

// ─── DEVOLVER LIVRO ───────────────────────────────────────────────────────────
if ($action === 'devolver' && isset($_GET['id'])) {
    devolverLivro($mysqli, (int) $_GET['id']);
    header("Location: adm.php?action=emprestimos");
    exit;
}



if (in_array($action, ['add', 'edit']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $titulo         = $_POST['titulo'];
    $id_autor       = (int) $_POST['id_autor'];
    $ano_publicacao = (int) $_POST['ano_publicacao'];
    $id_categoria   = (int) $_POST['id_categoria'];
    $id_editora     = (int) $_POST['id_editora'];
    $numero_paginas = (int) $_POST['numero_paginas'];
    $origem_idioma  = $_POST['origem_idioma'];
    $quantidade     = (int) $_POST['quantidade'];
    $status         = $quantidade > 0 ? 'Disponível' : 'Indisponível';



    $capa = $_POST['capa_atual'] ?? 'uploads/capas/default.jpg';

    if (!empty($_FILES['capa']['name'])) {
        $ext              = pathinfo($_FILES['capa']['name'], PATHINFO_EXTENSION);
        $nome_arquivo     = uniqid('capa_') . '.' . $ext;
        $destino          = '../uploads/capas/' . $nome_arquivo; // caminho físico no servidor
        $tipos_permitidos = ['image/jpeg', 'image/png', 'image/webp'];

        if (in_array($_FILES['capa']['type'], $tipos_permitidos) && $_FILES['capa']['size'] <= 2097152) {
            if (move_uploaded_file($_FILES['capa']['tmp_name'], $destino)) {
                $capa = 'uploads/capas/' . $nome_arquivo; // caminho salvo no banco
            }
        }
    }

    if ($action === 'add') {
        adicionarLivro($mysqli, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa);
    } elseif ($action === 'edit') {
        $id_livro = (int) $_POST['id_livro'];
        if ($quantidade == 0) $status = 'Indisponível';
        editarLivro($mysqli, $id_livro, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade, $capa);
    }

    header("Location: adm.php");
    exit;
}

// ─── DELETE LIVRO ─────────────────────────────────────────────────────────────
if ($action === 'delete' && isset($_GET['id'])) {
    excluirLivro($mysqli, (int) $_GET['id']);
    header("Location: adm.php");
    exit;
}

// ─── GERENCIAR PERFIS ─────────────────────────────────────────────────────────
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
                ? 'Explorador removido do sistema com sucesso.'
                : 'Não foi possível remover (é admin ou não existe).';
            $stmt->close();
        } elseif ($acao === 'promover') {
            $stmt = $mysqli->prepare("UPDATE usuarios SET nivel_acesso='admin' WHERE id_usuario = ? AND nivel_acesso = 'leitor'");
            $stmt->bind_param('i', $uid);
            $stmt->execute();
            $msg = $stmt->affected_rows
                ? 'Explorador promovido a Guardião com sucesso!'
                : 'Usuário já é Guardião ou não existe.';
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
    <link rel="stylesheet" href="../assets/css/andro.css">
    <link rel="stylesheet" href="../assets/css/pgadm.css">
</head>

<body>

    <div id="grain"></div>
    <div id="canvas-dim" class="dimmed"></div>

    <!-- ─── TOAST DE FEEDBACK ──────────────────────────────────────────────── -->
    <?php if (isset($_GET['msg'])): ?>
        <div id="toast" class="cosmic-toast <?= $_GET['msg'] === 'erro_estoque' ? 'erro' : 'sucesso' ?>">
            <div class="toast-icon"><?= $_GET['msg'] === 'erro_estoque' ? '⚠️' : '✨' ?></div>
            <div class="toast-content">
                <?= $_GET['msg'] === 'erro_estoque'
                    ? 'Anomalia detectada: Livro indisponível no estoque.'
                    : 'Transação registrada no cofre com sucesso!' ?>
            </div>
        </div>
    <?php endif; ?>

    <div id="reticle" class="hide-on-mobile">
        <svg viewBox="0 0 100 100">
            <circle class="ret-ring" cx="50" cy="50" r="45" />
            <line class="ret-cross" x1="50" y1="20" x2="50" y2="80" />
            <line class="ret-cross" x1="20" y1="50" x2="80" y2="50" />
        </svg>
    </div>
    <div id="reticle-dot" class="hide-on-mobile"></div>

    <!-- ─── NAVBAR ────────────────────────────────────────────────────────── -->
    <nav id="nav">
        <div class="nav-logo">
            <span class="nav-logo-text">Andrômeda</span>
        </div>


        <div class="nav-sec">
            <a href="catalogo.php" class="nav-item">
                <i>🌌</i>
                <span>Catalogo</span>
            </a>
            <a href="adm.php" class="nav-item <?= ($action === 'listar' || $action === 'edit') ? 'active' : '' ?>">
                <i>📚</i>
                <span>Acervo</span>
            </a>
            <a href="adm.php?action=emprestimos" class="nav-item <?= $action === 'emprestimos' ? 'active' : '' ?>">
                <i>📜</i>
                <span>Empréstimos</span>
            </a>
            <a href="adm.php?action=novo_emprestimo" class="nav-item <?= $action === 'novo_emprestimo' ? 'active' : '' ?>">
                <i>✨</i>
                <span>Novo Registro</span>
            </a>
            <a href="adm.php?action=add" class="nav-item <?= $action === 'add' ? 'active' : '' ?>">
                <i>➕</i>
                <span>Novo Livro</span>
            </a>
            <a href="adm.php?action=reservas" class="nav-item <?= $action === 'reservas' ? 'active' : '' ?>">
                <i>⏳</i>
                <span>Fila de Espera</span>
            </a>
            <a href="adm.php?action=perfis" class="nav-item <?= $action === 'perfis' ? 'active' : '' ?>">
                <i>👤</i>
                <span>Perfis</span>
            </a>
            <a href="logout.php" class="nav-item">
                <i>🚪</i>
                <span>Sair</span>
            </a>
        </div>
    </nav>

    <div id="editorial-view" class="open">
        <h1 class="ed-header-title">
            <?php if (in_array($action, ['emprestimos', 'novo_emprestimo', 'registrar'])): ?>
                Registros <em>Cósmicos</em>
            <?php elseif ($action === 'perfis'): ?>
                Guardiões & <em>Exploradores</em>
            <?php else: ?>
                Controle do <em>Acervo</em>
            <?php endif; ?>
        </h1>
        <p class="ed-header-desc">
            <?php if (in_array($action, ['emprestimos', 'novo_emprestimo'])): ?>
                Gerenciamento dinâmico de transações, empréstimos e devoluções dos artefatos da biblioteca.
            <?php elseif ($action === 'perfis'): ?>
                Gerencie os membros da biblioteca — promova exploradores a guardiões ou remova perfis do sistema.
            <?php else: ?>
                Painel principal do bibliotecário para catalogação, edição e expurgo de artefatos da matriz central.
            <?php endif; ?>
        </p>

        <div class="ed-section" style="margin-top: 50px;">


            <!-- LISTAR LIVROS                                               -->

            <?php if ($action === 'listar'): ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Livros Cadastrados</h2>
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
                                $lista = listarLivros($mysqli);
                                if (empty($lista)):
                                ?>
                                    <tr>
                                        <td colspan="8" class="empty-state">
                                            <i>🌌</i>
                                            <p>O cofre está completamente vazio.</p>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($lista as $index => $livro): ?>
                                        <tr class="stagger-item" data-acervo-row style="animation-delay: <?= 0.3 + ($index * 0.05) ?>s;">
                                            <td style="font-weight: 600; color: var(--am3);"><?= htmlspecialchars($livro['titulo']) ?></td>
                                            <td><?= htmlspecialchars($livro['autor']) ?></td>
                                            <td><?= htmlspecialchars($livro['categoria']) ?></td>
                                            <td class="t-dim"><?= htmlspecialchars($livro['editora']) ?></td>
                                            <td class="t-mono"><?= $livro['ano_publicacao'] ?></td>
                                            <td>
                                                <?php if ($livro['quantidade'] > 0): ?>
                                                    <span class="sbadge s-disp">Disponível</span>
                                                <?php else: ?>
                                                    <span class="sbadge s-unk">Indisponível</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="t-mono" style="color: var(--am);"><?= $livro['quantidade'] ?></td>
                                            <td>
                                                <div class="action-group">
                                                    <a href="adm.php?action=edit&id=<?= $livro['id_livro'] ?>" class="btn-action btn-edit">
                                                        <i>⚙️</i> Editar
                                                    </a>
                                                    <a href="adm.php?action=delete&id=<?= $livro['id_livro'] ?>" class="btn-action btn-delete" onclick="return confirm('Tem certeza que deseja expurgar este registro do cofre?')">
                                                        <i>🗑️</i> Excluir
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                    <tr id="acervoNoResults" class="acervo-no-results" hidden>
                                        <td colspan="8" class="empty-state">
                                            <i>🔭</i>
                                            <p>Nenhum artefato encontrado para essa busca.</p>
                                        </td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>


                <!-- ADICIONAR LIVRO                                             -->

            <?php elseif ($action === 'add'):
                $salvo = $_SESSION['form_livro'] ?? [];
                unset($_SESSION['form_livro']);
            ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Adicionar Novo Livro</h2>
                </div>

                <div class="cosmic-form animate-rise" style="animation-delay: 0.2s;">
                    <form method="POST" action="adm.php?action=add" enctype="multipart/form-data">

                        <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                            <label>Título:</label>
                            <input type="text" name="titulo" class="cosmic-input" value="<?= htmlspecialchars($salvo['titulo'] ?? '') ?>" required>
                        </div>
                        <div class="form-group stagger-item" style="animation-delay: 0.32s;">
                            <label>Capa do Livro:</label>
                            <input type="file" name="capa" accept="image/jpeg, image/png, image/webp" class="cosmic-input">
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">📸 JPG, PNG ou WEBP • Máx. 2MB</p>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.35s;">
                            <label>Autor:</label>
                            <div style="display: flex; gap: 10px;">
                                <select name="id_autor" class="cosmic-input" style="flex: 1;">
                                    <option value="">-- Selecione o Autor --</option>
                                    <?php foreach (listarAutores($mysqli) as $a): ?>
                                        <option value="<?= $a['id_autor'] ?>"
                                            <?= ($a['id_autor'] == ($_GET['id_autor'] ?? $salvo['id_autor'] ?? '')) ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($a['nome']) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" class="btn-sec btn-sm" onclick="toggleNovoAutor()">+ Novo Autor</button>
                            </div>

                            <div id="div_novo_autor" style="display:none; margin-top:16px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-hairline); border-radius: 8px;">
                                <h4 style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--am); margin-bottom: 12px; text-transform: uppercase;">Registrar Nova Identidade</h4>
                                <form method="POST" action="adm.php?action=novo_autor">
                                    <div class="form-group"><input type="text" name="nome" class="cosmic-input" placeholder="Nome do autor" required></div>
                                    <div class="form-group"><textarea name="descricao" class="cosmic-input" placeholder="Descrição" rows="3"></textarea></div>
                                    <div class="form-group"><input type="text" name="nacionalidade" class="cosmic-input" placeholder="Nacionalidade"></div>
                                    <div style="display: flex; gap: 10px;">
                                        <button type="submit" class="btn-sec btn-sm" style="color: var(--am); border-color: var(--am);">Salvar autor</button>
                                        <button type="button" class="btn-sec btn-sm" onclick="toggleNovoAutor()">Cancelar</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.4s;">
                            <label>Categoria:</label>
                            <select name="id_categoria" class="cosmic-input">
                                <option value="">-- Selecione a Categoria --</option>
                                <?php foreach (listarCategorias($mysqli) as $c): ?>
                                    <option value="<?= $c['id_categoria'] ?>"
                                        <?= $c['id_categoria'] == ($salvo['id_categoria'] ?? '') ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($c['nome']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.45s;">
                            <label>Editora:</label>
                            <div style="display: flex; gap: 10px;">
                                <select name="id_editora" class="cosmic-input" style="flex: 1;">
                                    <option value="">-- Selecione a Editora --</option>
                                    <?php foreach (listarEditoras($mysqli) as $e): ?>
                                        <option value="<?= $e['id_editora'] ?>"
                                            <?= ($e['id_editora'] == ($_GET['id_editora'] ?? $salvo['id_editora'] ?? '')) ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($e['nome']) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" class="btn-sec btn-sm" onclick="toggleNovaEditora()">+ Nova Editora</button>
                            </div>

                            <div id="div_nova_editora" style="display:none; margin-top:16px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-hairline); border-radius: 8px;">
                                <h4 style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--am); margin-bottom: 12px; text-transform: uppercase;">Registrar Entidade Editora</h4>
                                <form method="POST" action="adm.php?action=nova_editora">
                                    <div class="form-group"><input type="text" name="nome" class="cosmic-input" placeholder="Nome da editora" required></div>
                                    <div class="form-group"><textarea name="descricao" class="cosmic-input" placeholder="Descrição" rows="3"></textarea></div>
                                    <div style="display: flex; gap: 10px;">
                                        <button type="submit" class="btn-sec btn-sm" style="color: var(--am); border-color: var(--am);">Salvar editora</button>
                                        <button type="button" class="btn-sec btn-sm" onclick="toggleNovaEditora()">Cancelar</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div class="form-group stagger-item" style="animation-delay: 0.5s;">
                                <label>Ano de publicação:</label>
                                <input type="number" name="ano_publicacao" class="cosmic-input" value="<?= $salvo['ano_publicacao'] ?? '' ?>">
                            </div>
                            <div class="form-group stagger-item" style="animation-delay: 0.55s;">
                                <label>Número de páginas:</label>
                                <input type="number" name="numero_paginas" class="cosmic-input" value="<?= $salvo['numero_paginas'] ?? '' ?>">
                            </div>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.6s;">
                            <label>Idioma de origem:</label>
                            <input type="text" name="origem_idioma" class="cosmic-input" value="<?= htmlspecialchars($salvo['origem_idioma'] ?? '') ?>">
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.65s;">
                            <label>Quantidade:</label>
                            <input type="number" name="quantidade" class="cosmic-input" value="<?= $salvo['quantidade'] ?? '' ?>" min="0">
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">💫 O status será ajustado automaticamente conforme a quantidade</p>
                        </div>

                        <div class="form-actions stagger-item" style="animation-delay: 0.8s; gap: 16px;">
                            <a href="adm.php" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                            <button type="submit" class="btn-prim">Salvar Registro</button>
                        </div>
                    </form>
                </div>


                <!-- EDITAR LIVRO                                                -->

            <?php elseif ($action === 'edit' && isset($_GET['id'])):
                $id    = (int) $_GET['id'];
                $livro = buscarLivroPorId($mysqli, $id);
            ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Editar Arquivo: <span style="color: var(--am3); font-weight: 400;"><?= htmlspecialchars($livro['titulo']) ?></span></h2>
                </div>

                <div class="cosmic-form animate-rise" style="animation-delay: 0.2s;">
                    <form method="POST" action="adm.php?action=edit" enctype="multipart/form-data">

                        <input type="hidden" name="id_livro" value="<?= $id ?>">

                        <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                            <label>Título:</label>
                            <input type="text" name="titulo" class="cosmic-input" value="<?= htmlspecialchars($livro['titulo']) ?>" required>
                        </div>
                        <div class="form-group stagger-item" style="animation-delay: 0.32s;">
                            <label>Capa do Livro:</label>
                            <?php if (!empty($livro['capa'])): ?>
                                <img src="../<?= htmlspecialchars($livro['capa']) ?>"
                                    alt="Capa atual"
                                    style="width: 80px; border-radius: 6px; margin-bottom: 10px; display: block;">
                            <?php endif; ?>
                            <input type="hidden" name="capa_atual" value="<?= htmlspecialchars($livro['capa'] ?? '') ?>">
                            <input type="file" name="capa" accept="image/jpeg, image/png, image/webp" class="cosmic-input">
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">📸 Deixe vazio para manter a capa atual</p>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.35s;">
                            <label>Autor:</label>
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
                            <label>Categoria:</label>
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
                            <label>Editora:</label>
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
                                <label>Ano de publicação:</label>
                                <input type="number" name="ano_publicacao" class="cosmic-input" value="<?= $livro['ano_publicacao'] ?>">
                            </div>
                            <div class="form-group stagger-item" style="animation-delay: 0.55s;">
                                <label>Número de páginas:</label>
                                <input type="number" name="numero_paginas" class="cosmic-input" value="<?= $livro['numero_paginas'] ?>">
                            </div>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.6s;">
                            <label>Idioma de origem:</label>
                            <input type="text" name="origem_idioma" class="cosmic-input" value="<?= htmlspecialchars($livro['origem_idioma']) ?>">
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.65s;">
                            <label>Quantidade:</label>
                            <input type="number" name="quantidade" class="cosmic-input" value="<?= $livro['quantidade'] ?>" min="0">
                            <p style="font-size: 0.8rem; color: var(--am); margin-top: 8px;">💫 O status será ajustado automaticamente conforme a quantidade</p>
                        </div>

                        <div class="form-actions stagger-item" style="animation-delay: 0.8s; gap: 16px;">
                            <a href="adm.php" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                            <button type="submit" class="btn-prim">Salvar Modificações</button>
                        </div>
                    </form>
                </div>


                <!-- LISTAR EMPRÉSTIMOS                                          -->

            <?php elseif ($action === 'emprestimos'): ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Empréstimos Ativos</h2>
                </div>

                <div class="table-wrapper animate-rise" style="animation-delay: 0.2s;">
                    <div class="table-responsive">
                        <table class="cosmic-table">
                            <thead>
                                <tr>
                                    <th>Livro</th>
                                    <th>Usuário</th>
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
                                            <i>📡</i>
                                            <p>Nenhum registro de transação encontrado no cofre no momento.</p>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($emprestimos as $index => $e): ?>
                                        <tr class="stagger-item" style="animation-delay: <?= 0.3 + ($index * 0.05) ?>s;">
                                            <td style="font-weight: 600; color: var(--am3);"><?= htmlspecialchars($e['titulo']) ?></td>
                                            <td><?= htmlspecialchars($e['usuario']) ?></td>
                                            <td class="t-mono"><?= date('d/m/Y', strtotime($e['data_emprestimo'])) ?></td>
                                            <td class="t-mono"><?= date('d/m/Y', strtotime($e['data_devolucao'])) ?></td>
                                            <td>
                                                <?php if ($e['status_emprestimo'] === 'Pendente'): ?>
                                                    <span class="sbadge s-empr">Pendente</span>
                                                <?php elseif ($e['status_emprestimo'] === 'Atrasado'): ?>
                                                    <span class="sbadge s-atrasado">Atrasado</span>
                                                <?php else: ?>
                                                    <span class="sbadge s-disp">Devolvido</span>
                                                <?php endif; ?>
                                            </td>
                                            <td style="text-align: right;">
                                                <?php if ($e['status_emprestimo'] === 'Pendente' || $e['status_emprestimo'] === 'Atrasado'): ?>
                                                    <a href="adm.php?action=devolver&id=<?= $e['id_emprestimo'] ?>" onclick="return confirm('Confirmar o retorno deste artefato?')" class="btn-sec btn-sm">Dar Baixa</a>
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


                <!-- NOVO EMPRÉSTIMO                                             -->

            <?php elseif ($action === 'novo_emprestimo'): ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Registrar Empréstimo</h2>
                </div>

                <form method="POST" action="adm.php?action=registrar" class="cosmic-form animate-rise" style="animation-delay: 0.2s;">

                    <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                        <label>Livro Solicitado:</label>
                        <select name="id_livro" required class="cosmic-input">
                            <option value="">-- Selecione o Tomo --</option>
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
                        <label>Usuário Explorador:</label>
                        <select name="id_usuario" required class="cosmic-input">
                            <option value="">-- Selecione o Explorador --</option>
                            <?php foreach (listarUsuarios($mysqli) as $u): ?>
                                <option value="<?= $u['id_usuario'] ?>"><?= htmlspecialchars($u['nome']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group stagger-item" style="animation-delay: 0.5s;">
                        <label>Data de Devolução Prevista:</label>
                        <input type="date" name="data_devolucao" required class="cosmic-input" min="<?= date('Y-m-d') ?>">
                    </div>

                    <div class="form-actions stagger-item" style="animation-delay: 0.6s;">
                        <a href="adm.php?action=emprestimos" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                        <button type="submit" class="btn-prim">Confirmar Empréstimo</button>
                    </div>
                </form>

            <?php elseif ($action === 'reservas'):
                $livros_indisponiveis = $mysqli->query("SELECT * FROM Livros WHERE quantidade = 0 ORDER BY titulo ASC")->fetch_all(MYSQLI_ASSOC) ?? [];
            ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Fila de Espera & Distribuição</h2>
                    <p style="color: var(--text-dim); font-size: 0.95rem; margin-top: 8px;">Livros indisponíveis: usuários na fila de espera e unidades em empréstimo</p>
                </div>

                <?php if (empty($livros_indisponiveis)): ?>
                    <div style="padding: 40px; text-align: center; color: var(--text-dim);">
                        <p style="font-size: 1.1rem;">✨ Todos os livros estão disponíveis!</p>
                        <p>Nenhuma fila de espera no momento.</p>
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
                                <!-- RESERVAS -->
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

                                <!-- EMPRÉSTIMOS -->
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

            <?php elseif ($action === 'perfis'):
                $busca_perfis = trim($_GET['busca'] ?? '');
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

                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Guardiões & <em>Exploradores</em></h2>
                </div>

                <?php if ($msg): ?>
                    <div class="cosmic-toast sucesso show" style="position:static; margin-bottom:20px; opacity:1;">
                        <div class="toast-icon">✨</div>
                        <div class="toast-content"><?= htmlspecialchars($msg) ?></div>
                    </div>
                <?php endif; ?>

                <!-- Barra de busca -->
                <form method="GET" action="adm.php" class="animate-rise" style="animation-delay:0.15s; display:flex; gap:10px; margin-bottom:24px;">
                    <input type="hidden" name="action" value="perfis">
                    <input
                        type="text"
                        name="busca"
                        class="cosmic-input"
                        placeholder="Pesquisar por nome ou e-mail..."
                        value="<?= htmlspecialchars($busca_perfis) ?>"
                        style="flex:1;">
                    <button type="submit" class="btn-sec">Buscar</button>
                    <?php if ($busca_perfis): ?>
                        <a href="adm.php?action=perfis" class="btn-action btn-cancel">Limpar</a>
                    <?php endif; ?>
                </form>

                <!-- Tabela de usuários -->
                <div class="table-wrapper animate-rise" style="animation-delay: 0.2s;">
                    <div class="table-responsive">
                        <table class="cosmic-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Tipo</th>
                                    <th>Membro desde</th>
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
                                        <td style="font-weight:600; color:var(--am3);"><?= htmlspecialchars($u['nome']) ?></td>
                                        <td class="t-dim"><?= htmlspecialchars($u['email']) ?></td>
                                        <td>
                                            <?php if ($u['nivel_acesso'] === 'admin'): ?>
                                                <span class="sbadge s-empr">Guardião</span>
                                            <?php else: ?>
                                                <span class="sbadge s-disp">Explorador</span>
                                            <?php endif; ?>
                                        </td>
                                        
                                        <td>
                                            <div class="action-group" style="justify-content:flex-end;">
                                                <?php if ($u['id_usuario'] === (int)$_SESSION['id_usuario']): ?>
                                                    <span class="t-dim t-mono" style="font-size:0.75rem;">(você)</span>

                                                <?php elseif ($u['nivel_acesso'] === 'leitor'): ?>
                                                    <!-- Promover -->
                                                    <form method="POST" action="adm.php?action=perfis" style="display:inline"
                                                        onsubmit="return confirm('Promover <?= htmlspecialchars(addslashes($u['nome'])) ?> a Guardião?')">
                                                        <input type="hidden" name="acao" value="promover">
                                                        <input type="hidden" name="uid" value="<?= $u['id_usuario'] ?>">
                                                        <?php if ($busca_perfis): ?>
                                                            <input type="hidden" name="busca" value="<?= htmlspecialchars($busca_perfis) ?>">
                                                        <?php endif; ?>
                                                        <button class="btn-action btn-edit">⬆️ Promover</button>
                                                    </form>
                                                    <!-- Excluir -->
                                                    <form method="POST" action="adm.php?action=perfis" style="display:inline"
                                                        onsubmit="return confirm('Remover <?= htmlspecialchars(addslashes($u['nome'])) ?> do sistema? Esta ação não pode ser desfeita.')">
                                                        <input type="hidden" name="acao" value="excluir">
                                                        <input type="hidden" name="uid" value="<?= $u['id_usuario'] ?>">
                                                        <?php if ($busca_perfis): ?>
                                                            <input type="hidden" name="busca" value="<?= htmlspecialchars($busca_perfis) ?>">
                                                        <?php endif; ?>
                                                        <button class="btn-action btn-delete">🗑️ Remover</button>
                                                    </form>

                                                <?php else: ?>
                                                    <span class="t-dim t-mono" style="font-size:0.75rem;">— guardião —</span>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endwhile; ?>

                                <?php if ($total === 0): ?>
                                    <tr>
                                        <td colspan="5" class="empty-state">
                                            <i>🌌</i>
                                            <p>Nenhum explorador encontrado com essa busca.</p>
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

    <script src="../assets/js/adm.js"></script>
    <script>
        // ─── Cursor Magnético ─────────────────────────────────────────────────
        const cursor = document.getElementById('reticle');
        const dot = document.getElementById('reticle-dot');

        if (window.matchMedia("(pointer: fine)").matches) {
            document.addEventListener('mousemove', (e) => {
                cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
                dot.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
            });

            document.querySelectorAll('a, button, select, input, textarea').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
            });
        }

        // ─── Pesquisa do Acervo ───────────────────────────────────────────────
        const acervoSearch = document.getElementById('acervoSearch');
        const clearAcervoSearch = document.getElementById('clearAcervoSearch');
        const acervoRows = Array.from(document.querySelectorAll('[data-acervo-row]'));
        const acervoNoResults = document.getElementById('acervoNoResults');
        const acervoSearchCount = document.getElementById('acervoSearchCount');

        function normalizarBusca(texto) {
            return (texto || '')
                .toString()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();
        }

        function textoPesquisavelDaLinha(row) {
            return Array.from(row.children)
                .slice(0, -1) // ignora a coluna de ações para "Editar" e "Excluir" não aparecerem em todas as buscas
                .map((cell) => cell.textContent)
                .join(' ');
        }

        function filtrarAcervo() {
            if (!acervoSearch) return;

            const termo = normalizarBusca(acervoSearch.value);
            let totalVisivel = 0;

            acervoRows.forEach((row) => {
                const baseBusca = normalizarBusca(textoPesquisavelDaLinha(row));
                const encontrou = termo === '' || baseBusca.includes(termo);

                row.hidden = !encontrou;
                if (encontrou) totalVisivel++;
            });

            if (acervoSearchCount) {
                acervoSearchCount.textContent = totalVisivel;
            }

            if (acervoNoResults) {
                acervoNoResults.hidden = totalVisivel !== 0 || acervoRows.length === 0;
            }

            if (clearAcervoSearch) {
                clearAcervoSearch.hidden = termo.length === 0;
            }
        }

        if (acervoSearch) {
            acervoSearch.addEventListener('input', filtrarAcervo);
            filtrarAcervo();
        }

        if (clearAcervoSearch) {
            clearAcervoSearch.addEventListener('click', () => {
                acervoSearch.value = '';
                acervoSearch.focus();
                filtrarAcervo();
            });
        }

        // ─── Toast de Feedback ────────────────────────────────────────────────
        const toast = document.getElementById('toast');
        if (toast) {
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 4500);
        }

        // ─── Toggle Novo Autor ────────────────────────────────────────────────
        function toggleNovoAutor() {
            const div = document.getElementById('div_novo_autor');
            div.style.display = div.style.display === 'none' ? 'block' : 'none';
        }

        // ─── Toggle Nova Editora ──────────────────────────────────────────────
        function toggleNovaEditora() {
            const div = document.getElementById('div_nova_editora');
            div.style.display = div.style.display === 'none' ? 'block' : 'none';
        }
    </script>
</body>

</html>