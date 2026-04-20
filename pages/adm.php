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
    <title>Painel — Biblioteca</title>
</head>
<body>

<h1>Painel do Bibliotecário</h1>

<nav>
    <a href="adm.php">Lista de livros</a> |
    <a href="adm.php?action=add">Adicionar livro</a>
    <a href="emprestimos.php">Gerenciar Empréstimos</a>
</nav>
<hr>

<?php if ($action === 'listar'): ?>

    <h2>Livros cadastrados</h2>
    <table border="1">
        <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Categoria</th>
            <th>Editora</th>
            <th>Ano</th>
            <th>Status</th>
            <th>Qtd</th>
            <th>Ações</th>
        </tr>
        <?php foreach (listarLivros($mysqli) as $livro): ?>
        <tr>
            <td><?= htmlspecialchars($livro['titulo']) ?></td>
            <td><?= htmlspecialchars($livro['autor']) ?></td>
            <td><?= htmlspecialchars($livro['categoria']) ?></td>
            <td><?= htmlspecialchars($livro['editora']) ?></td>
            <td><?= $livro['ano_publicacao'] ?></td>
            <td><?= $livro['status'] ?></td>
            <td><?= $livro['quantidade'] ?></td>
            <td>
                <a href="adm.php?action=edit&id=<?= $livro['id_livro'] ?>">Editar</a>
                <a href="adm.php?action=delete&id=<?= $livro['id_livro'] ?>"
                   onclick="return confirm('Tem certeza?')">Excluir</a>
            </td>
        </tr>
        <?php endforeach; ?>
    </table>

<?php elseif ($action === 'add'):
    $salvo = $_SESSION['form_livro'] ?? [];
    unset($_SESSION['form_livro']);
?>

    <h2>Adicionar novo livro</h2>
    <form method="POST" action="adm.php?action=add">

        <label>Título:</label><br>
        <input type="text" name="titulo" value="<?= htmlspecialchars($salvo['titulo'] ?? '') ?>" required><br><br>

        <label>Autor:</label><br>
        <select name="id_autor">
            <?php foreach (listarAutores($mysqli) as $a): ?>
                <option value="<?= $a['id_autor'] ?>"
                    <?= ($a['id_autor'] == ($_GET['autor_id'] ?? $salvo['id_autor'] ?? '')) ? 'selected' : '' ?>>
                    <?= htmlspecialchars($a['nome']) ?>
                </option>
            <?php endforeach; ?>
        </select>
        <button type="button" onclick="toggleNovoAutor()">+ Novo autor</button>

        <div id="div_novo_autor" style="display:none; margin-top:8px;">
            <form method="POST" action="adm.php?action=novo_autor">
                <input type="text" name="nome_autor" placeholder="Nome do autor" required><br><br>
                <textarea name="descricao_autor" placeholder="Descrição" rows="3"></textarea><br><br>
                <input type="text" name="nacionalidade_autor" placeholder="Nacionalidade"><br><br>
                <button type="submit">Salvar autor</button>
                <button type="button" onclick="toggleNovoAutor()">Cancelar</button>
            </form>
        </div><br><br>

        <label>Categoria:</label><br>
        <select name="id_categoria">
            <?php foreach (listarCategorias($mysqli) as $c): ?>
                <option value="<?= $c['id_categoria'] ?>"
                    <?= $c['id_categoria'] == ($salvo['id_categoria'] ?? '') ? 'selected' : '' ?>>
                    <?= htmlspecialchars($c['nome']) ?>
                </option>
            <?php endforeach; ?>
        </select><br><br>

        <label>Editora:</label><br>
        <select name="id_editora">
            <?php foreach (listarEditoras($mysqli) as $e): ?>
                <option value="<?= $e['id_editora'] ?>"
                    <?= ($e['id_editora'] == ($_GET['editora_id'] ?? $salvo['id_editora'] ?? '')) ? 'selected' : '' ?>>
                    <?= htmlspecialchars($e['nome']) ?>
                </option>
            <?php endforeach; ?>
        </select>
        <button type="button" onclick="toggleNovaEditora()">+ Nova editora</button>

        <div id="div_nova_editora" style="display:none; margin-top:8px;">
            <form method="POST" action="adm.php?action=nova_editora">
                <input type="text" name="nome_editora" placeholder="Nome da editora" required><br><br>
                <textarea name="descricao_editora" placeholder="Descrição" rows="3"></textarea><br><br>
                <button type="submit">Salvar editora</button>
                <button type="button" onclick="toggleNovaEditora()">Cancelar</button>
            </form>
        </div><br><br>

        <label>Ano de publicação:</label><br>
        <input type="number" name="ano_publicacao" value="<?= $salvo['ano_publicacao'] ?? '' ?>"><br><br>

        <label>Número de páginas:</label><br>
        <input type="number" name="numero_paginas" value="<?= $salvo['numero_paginas'] ?? '' ?>"><br><br>

        <label>Idioma de origem:</label><br>
        <input type="text" name="origem_idioma" value="<?= htmlspecialchars($salvo['origem_idioma'] ?? '') ?>"><br><br>

        <label>Status:</label><br>
        <select name="status">
            <option value="Disponível"   <?= ($salvo['status'] ?? '') === 'Disponível'   ? 'selected' : '' ?>>Disponível</option>
            <option value="Indisponível" <?= ($salvo['status'] ?? '') === 'Indisponível' ? 'selected' : '' ?>>Indisponível</option>
        </select><br><br>

        <label>Quantidade:</label><br>
        <input type="number" name="quantidade" value="<?= $salvo['quantidade'] ?? '' ?>" min="0"><br><br>

        <button type="submit">Salvar livro</button>
        <a href="adm.php">Cancelar</a>
    </form>

<?php elseif ($action === 'edit' && isset($_GET['id'])):
    $id    = (int) $_GET['id'];
    $livro = buscarLivroPorId($mysqli, $id);
?>

    <h2>Editar livro</h2>
    <form method="POST" action="adm.php?action=edit">

        <input type="hidden" name="id_livro" value="<?= $id ?>">

        <label>Título:</label><br>
        <input type="text" name="titulo" value="<?= htmlspecialchars($livro['titulo']) ?>" required><br><br>

        <label>Autor:</label><br>
        <select name="id_autor">
            <?php foreach (listarAutores($mysqli) as $a): ?>
                <option value="<?= $a['id_autor'] ?>"
                    <?= $a['id_autor'] == $livro['id_autor'] ? 'selected' : '' ?>>
                    <?= htmlspecialchars($a['nome']) ?>
                </option>
            <?php endforeach; ?>
        </select><br><br>

        <label>Categoria:</label><br>
        <select name="id_categoria">
            <?php foreach (listarCategorias($mysqli) as $c): ?>
                <option value="<?= $c['id_categoria'] ?>"
                    <?= $c['id_categoria'] == $livro['id_categoria'] ? 'selected' : '' ?>>
                    <?= htmlspecialchars($c['nome']) ?>
                </option>
            <?php endforeach; ?>
        </select><br><br>

        <label>Editora:</label><br>
        <select name="id_editora">
            <?php foreach (listarEditoras($mysqli) as $e): ?>
                <option value="<?= $e['id_editora'] ?>"
                    <?= $e['id_editora'] == $livro['id_editora'] ? 'selected' : '' ?>>
                    <?= htmlspecialchars($e['nome']) ?>
                </option>
            <?php endforeach; ?>
        </select><br><br>

        <label>Ano de publicação:</label><br>
        <input type="number" name="ano_publicacao" value="<?= $livro['ano_publicacao'] ?>"><br><br>

        <label>Número de páginas:</label><br>
        <input type="number" name="numero_paginas" value="<?= $livro['numero_paginas'] ?>"><br><br>

        <label>Idioma de origem:</label><br>
        <input type="text" name="origem_idioma" value="<?= htmlspecialchars($livro['origem_idioma']) ?>"><br><br>

        <label>Status:</label><br>
        <select name="status">
            <option value="Disponível"   <?= $livro['status'] === 'Disponível'   ? 'selected' : '' ?>>Disponível</option>
            <option value="Indisponível" <?= $livro['status'] === 'Indisponível' ? 'selected' : '' ?>>Indisponível</option>
        </select><br><br>

        <label>Quantidade:</label><br>
        <input type="number" name="quantidade" value="<?= $livro['quantidade'] ?>"><br><br>

        <button type="submit">Salvar alterações</button>
        <a href="adm.php">Cancelar</a>
    </form>

<?php endif; ?>



<script src="../assets/js/adm.js"></script>
</body>
</html>

