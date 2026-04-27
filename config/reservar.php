<?php
session_start();
include "../config/conexao.php";
include "../config/crud.php";

if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

$id_livro  = (int)($_POST['id_livro'] ?? 0);
$id_usuario = (int)($_SESSION['user']['id_usuario']);

if (!$id_livro) {
    header("Location: catalogo.php?msg=erro");
    exit;
}

$livro = buscarLivroPorId($mysqli, $id_livro);

if ($livro['quantidade'] > 0) {
    // Disponível → empréstimo direto
    $data_devolucao = date("Y-m-d", strtotime("+14 days"));
    registrarEmprestimo($mysqli, $id_livro, $id_usuario, $data_devolucao);
    header("Location: emprestimos.php?msg=emprestimo_ok");
} else {
    // Indisponível → entra na fila
    $resultado = criarReserva($mysqli, $id_livro, $id_usuario);
    if ($resultado === false && jaReservado($mysqli, $id_livro, $id_usuario)) {
        header("Location: catalogo.php?msg=ja_reservado");
    } else {
        header("Location: reservas.php?msg=reserva_ok");
    }
}
exit;