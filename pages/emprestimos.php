<?php
session_start();
include "../config/conexao.php";
include "../config/crud.php";

$action = $_GET['action'] ?? 'listar';

// Lógica de Processamento
if ($action === 'registrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_livro = $_POST['id_livro'];
    $id_usuario = $_POST['id_usuario'];
    $data_prevista = $_POST['data_devolucao_prevista'];

    if (registrarEmprestimo($mysqli, $id_livro, $id_usuario, $data_prevista)) {
        header("Location: emprestimos.php?msg=sucesso");
    } else {
        header("Location: emprestimos.php?msg=erro_estoque");
    }
    exit;
}

if ($action === 'devolver' && isset($_GET['id'])) {
    devolverLivro($mysqli, (int)$_GET['id']);
    header("Location: emprestimos.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <title>Gerenciar Empréstimos</title>
</head>

<body>
    <h1>Gerenciamento de Empréstimos</h1>
    <nav>
        <a href="adm.php">Livros</a> |
        <a href="emprestimos.php">Listar Empréstimos</a> |
        <a href="emprestimos.php?action=novo">Novo Empréstimo</a>
    </nav>
    <hr>

    <?php if ($action === 'listar'): ?>
        <h2>Empréstimos Ativos</h2>
        <table border="1">
            <tr>
                <th>Livro</th>
                <th>Usuário</th>
                <th>Data Empréstimo</th>
                <th>Previsão Devolução</th>
                <th>Status</th>
                <th>Ação</th>
            </tr>
            <?php foreach (listarEmprestimos($mysqli) as $e): ?>
                <tr>
                    <td><?= htmlspecialchars($e['titulo']) ?></td>
                    <td><?= htmlspecialchars($e['usuario']) ?></td>
                    <td><?= date('d/m/Y', strtotime($e['data_emprestimo'])) ?></td>
                    <td><?= date('d/m/Y', strtotime($e['data_devolucao_prevista'])) ?></td>
                    <td><strong><?= $e['status'] ?></strong></td>
                    <td>
                        <?php if ($e['status'] === 'Pendente'): ?>
                            <a href="emprestimos.php?action=devolver&id=<?= $e['id_emprestimo'] ?>" onclick="return confirm('Confirmar devolução?')">Dar Baixa (Devolver)</a>
                        <?php else: ?>
                            Devolvido em: <?= date('d/m/Y', strtotime($e['data_devolucao_real'])) ?>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>

    <?php elseif ($action === 'novo'): ?>
        <h2>Registrar Empréstimo</h2>
        <form method="POST" action="emprestimos.php?action=registrar">
            
            <label>Livro:</label><br>
            <select name="id_livro" required>
                <option value="">-- Selecione o Livro --</option>
                <?php
                $livros = listarLivros($mysqli);

                foreach ($livros as $l):
                    // Isso normaliza todas as chaves para minúsculo para evitar erro de digitação
                    $livroNormalizado = array_change_key_case($l, CASE_LOWER);

                    $id   = $livroNormalizado['id_livro'] ?? 0;
                    $nome = $livroNormalizado['titulo']   ?? 'Sem título';
                    $qtd  = $livroNormalizado['quantidade'] ?? 0;
                ?>
                    <option value="<?= $id ?>">
                        <?= htmlspecialchars($nome) ?> — (Qtd: <?= $qtd ?>)
                    </option>
                <?php endforeach; ?>
            </select><br><br>

            <label>Usuário:</label><br>
            <select name="id_usuario" required>
                <?php foreach (listarUsuarios($mysqli) as $u): ?>
                    <option value="<?= $u['id_usuario'] ?>"><?= $u['nome'] ?></option>
                <?php endforeach; ?>
            </select><br><br>

            <label>Data de Devolução Prevista:</label><br>
            <input type="date" name="data_devolucao_prevista" required><br><br>

            <button type="submit">Confirmar Empréstimo</button>
        </form>
    <?php endif; ?>
</body>

</html>