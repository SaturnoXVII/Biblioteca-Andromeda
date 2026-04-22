<?php
session_start();
include "../config/conexao.php";
include "../config/crud.php";

$action = $_GET['action'] ?? 'listar';

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
    $novo_id = adicionarAutor($mysqli, $_POST['nome_autor'], $_POST['descricao_autor'], $_POST['nacionalidade_autor']);
    header("Location: adm.php?action=add&autor_id=" . $novo_id);
    exit;
}

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
    $novo_id = adicionarEditora($mysqli, $_POST['nome_editora'], $_POST['descricao_editora']);
    header("Location: adm.php?action=add&editora_id=" . $novo_id);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $titulo         = $_POST['titulo'];
    $id_autor       = (int) $_POST['id_autor'];
    $ano_publicacao = (int) $_POST['ano_publicacao'];
    $id_categoria   = (int) $_POST['id_categoria'];
    $id_editora     = (int) $_POST['id_editora'];
    $numero_paginas = (int) $_POST['numero_paginas'];
    $origem_idioma  = $_POST['origem_idioma'];
    $status         = $_POST['status'];
    $quantidade     = (int) $_POST['quantidade'];

    if ($action === 'add') {
        adicionarLivro($mysqli, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade);
    } elseif ($action === 'edit') {
        $id_livro = (int) $_POST['id_livro'];
        editarLivro($mysqli, $id_livro, $titulo, $id_autor, $ano_publicacao, $id_categoria, $id_editora, $numero_paginas, $origem_idioma, $status, $quantidade);
    }

    header("Location: adm.php");
    exit;
}

if ($action === 'delete' && isset($_GET['id'])) {
    excluirLivro($mysqli, (int) $_GET['id']);
    header("Location: adm.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>O Cofre Cósmico | Acervo</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500;600;700&family=Space+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/catalogo.css"> 
    <link rel="stylesheet" href="../assets/css/adm.css"> 
</head>
<body>

    <div id="grain"></div>
    <div id="canvas-dim" class="dimmed"></div>

    <div id="reticle" class="hide-on-mobile">
        <svg viewBox="0 0 100 100">
            <circle class="ret-ring" cx="50" cy="50" r="45"/>
            <line class="ret-cross" x1="50" y1="20" x2="50" y2="80"/>
            <line class="ret-cross" x1="20" y1="50" x2="80" y2="50"/>
        </svg>
    </div>
    <div id="reticle-dot" class="hide-on-mobile"></div>

    <nav id="nav">
        <div class="nav-logo">
            <span class="nav-logo-text">Andrômeda</span>
        </div>
        <div class="nav-sec">
            <a href="adm.php" class="nav-item <?= ($action === 'listar' || $action === 'edit') ? 'active' : '' ?>">
                <i>📚</i>
                <span>Acervo</span>
            </a>
            <a href="emprestimos.php" class="nav-item">
                <i>📜</i>
                <span>Empréstimos</span>
            </a>
             <a href="emprestimos.php?action=novo" class="nav-item <?= $action === 'novo' ? 'active' : '' ?>">
                <i>✨</i>
                <span>Novo Registro</span>
            </a>
            <a href="adm.php?action=add" class="nav-item <?= $action === 'add' ? 'active' : '' ?>">
                <i>✨</i>
                <span>Novo Tomo</span>
            </a>
        </div>
    </nav>

    <div id="editorial-view" class="open">
        <header class="ed-header animate-rise">
            <h1 class="ed-header-title">Controle do <em>Acervo</em></h1>
            <p class="ed-header-desc">Painel principal do bibliotecário para catalogação, edição e expurgo de artefatos da matriz central.</p>
        </header>

        <div class="ed-section" style="margin-top: 50px;">
            
            <?php if ($action === 'listar'): ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Livros Cadastrados</h2>
                </div>

                <div class="table-wrapper animate-rise" style="animation-delay: 0.2s;">
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
                                if(empty($lista)): 
                                ?>
                                    <tr>
                                        <td colspan="8" class="empty-state">
                                            <i>🌌</i>
                                            <p>O cofre está completamente vazio.</p>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($lista as $index => $livro): ?>
                                    <tr class="stagger-item" style="animation-delay: <?= 0.3 + ($index * 0.05) ?>s;">
                                        <td style="font-weight: 600; color: var(--am3);"><?= htmlspecialchars($livro['titulo']) ?></td>
                                        <td><?= htmlspecialchars($livro['autor']) ?></td>
                                        <td><?= htmlspecialchars($livro['categoria']) ?></td>
                                        <td class="t-dim"><?= htmlspecialchars($livro['editora']) ?></td>
                                        <td class="t-mono"><?= $livro['ano_publicacao'] ?></td>
                                        <td>
                                            <?php if ($livro['status'] === 'Disponível'): ?>
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
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            <?php elseif ($action === 'add'):
                $salvo = $_SESSION['form_livro'] ?? [];
                unset($_SESSION['form_livro']);
            ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Adicionar Novo Livro</h2>
                </div>

                <div class="cosmic-form animate-rise" style="animation-delay: 0.2s;">
                    <form method="POST" action="adm.php?action=add">

                        <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                            <label>Título:</label>
                            <input type="text" name="titulo" class="cosmic-input" value="<?= htmlspecialchars($salvo['titulo'] ?? '') ?>" required>
                        </div>

                        <div class="form-group stagger-item" style="animation-delay: 0.35s;">
                            <label>Autor:</label>
                            <div style="display: flex; gap: 10px;">
                                <select name="id_autor" class="cosmic-input" style="flex: 1;">
                                    <option value="">-- Selecione o Autor --</option>
                                    <?php foreach (listarAutores($mysqli) as $a): ?>
                                        <option value="<?= $a['id_autor'] ?>"
                                            <?= ($a['id_autor'] == ($_GET['autor_id'] ?? $salvo['id_autor'] ?? '')) ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($a['nome']) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" class="btn-sec btn-sm" onclick="toggleNovoAutor()">+ Novo Autor</button>
                            </div>

                            <div id="div_novo_autor" style="display:none; margin-top:16px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-hairline); border-radius: 8px;">
                                <h4 style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--am); margin-bottom: 12px; text-transform: uppercase;">Registrar Nova Identidade</h4>
                                <form method="POST" action="adm.php?action=novo_autor">
                                    <div class="form-group"><input type="text" name="nome_autor" class="cosmic-input" placeholder="Nome do autor" required></div>
                                    <div class="form-group"><textarea name="descricao_autor" class="cosmic-input" placeholder="Descrição" rows="3"></textarea></div>
                                    <div class="form-group"><input type="text" name="nacionalidade_autor" class="cosmic-input" placeholder="Nacionalidade"></div>
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
                                            <?= ($e['id_editora'] == ($_GET['editora_id'] ?? $salvo['id_editora'] ?? '')) ? 'selected' : '' ?>>
                                            <?= htmlspecialchars($e['nome']) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <button type="button" class="btn-sec btn-sm" onclick="toggleNovaEditora()">+ Nova Editora</button>
                            </div>

                            <div id="div_nova_editora" style="display:none; margin-top:16px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-hairline); border-radius: 8px;">
                                <h4 style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--am); margin-bottom: 12px; text-transform: uppercase;">Registrar Entidade Editora</h4>
                                <form method="POST" action="adm.php?action=nova_editora">
                                    <div class="form-group"><input type="text" name="nome_editora" class="cosmic-input" placeholder="Nome da editora" required></div>
                                    <div class="form-group"><textarea name="descricao_editora" class="cosmic-input" placeholder="Descrição" rows="3"></textarea></div>
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

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div class="form-group stagger-item" style="animation-delay: 0.65s;">
                                <label>Status:</label>
                                <select name="status" class="cosmic-input">
                                    <option value="Disponível"   <?= ($salvo['status'] ?? '') === 'Disponível'   ? 'selected' : '' ?>>Disponível</option>
                                    <option value="Indisponível" <?= ($salvo['status'] ?? '') === 'Indisponível' ? 'selected' : '' ?>>Indisponível</option>
                                </select>
                            </div>
                            <div class="form-group stagger-item" style="animation-delay: 0.7s;">
                                <label>Quantidade:</label>
                                <input type="number" name="quantidade" class="cosmic-input" value="<?= $salvo['quantidade'] ?? '' ?>" min="0">
                            </div>
                        </div>

                        <div class="form-actions stagger-item" style="animation-delay: 0.8s; gap: 16px;">
                            <a href="adm.php" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                            <button type="submit" class="btn-prim">Salvar Registro</button>
                        </div>
                    </form>
                </div>

            <?php elseif ($action === 'edit' && isset($_GET['id'])):
                $id    = (int) $_GET['id'];
                $livro = buscarLivroPorId($mysqli, $id);
            ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Editar Arquivo: <span style="color: var(--am3); font-weight: 400;"><?= htmlspecialchars($livro['titulo']) ?></span></h2>
                </div>

                <div class="cosmic-form animate-rise" style="animation-delay: 0.2s;">
                    <form method="POST" action="adm.php?action=edit">

                        <input type="hidden" name="id_livro" value="<?= $id ?>">

                        <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                            <label>Título:</label>
                            <input type="text" name="titulo" class="cosmic-input" value="<?= htmlspecialchars($livro['titulo']) ?>" required>
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

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div class="form-group stagger-item" style="animation-delay: 0.65s;">
                                <label>Status:</label>
                                <select name="status" class="cosmic-input">
                                    <option value="Disponível"   <?= $livro['status'] === 'Disponível'   ? 'selected' : '' ?>>Disponível</option>
                                    <option value="Indisponível" <?= $livro['status'] === 'Indisponível' ? 'selected' : '' ?>>Indisponível</option>
                                </select>
                            </div>
                            <div class="form-group stagger-item" style="animation-delay: 0.7s;">
                                <label>Quantidade:</label>
                                <input type="number" name="quantidade" class="cosmic-input" value="<?= $livro['quantidade'] ?>" min="0">
                            </div>
                        </div>

                        <div class="form-actions stagger-item" style="animation-delay: 0.8s; gap: 16px;">
                            <a href="adm.php" class="btn-action btn-cancel" style="flex: 0.3;">Cancelar</a>
                            <button type="submit" class="btn-prim">Salvar Modificações</button>
                        </div>
                    </form>
                </div>

            <?php endif; ?>

        </div>
    </div>

    <script src="../assets/js/adm.js"></script>
    <script>
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
    </script>
</body>
</html>