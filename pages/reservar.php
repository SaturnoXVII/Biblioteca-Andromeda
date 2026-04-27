<?php
session_start();
require_once "../config/conexao.php";
require_once "../config/crud.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_SESSION['id_usuario'])) {
    header('Location: catalogo.php');
    exit;
}

$id_livro = (int) ($_POST['id_livro'] ?? 0);
$id_usuario = (int) $_SESSION['id_usuario'];

if ($id_livro <= 0) {
    header('Location: catalogo.php?reserva=erro');
    exit;
}

$result = criarReserva($mysqli, $id_livro, $id_usuario);
if ($result) {
    header('Location: catalogo.php?reserva=sucesso');
} else {
    header('Location: catalogo.php?reserva=erro');
}
exit;
