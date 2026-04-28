<?php
session_start();
include '../config/conexao.php';
include '../config/crud.php';

header('Content-Type: application/json');


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $acao = $_POST['acao'] ?? '';
    
    if ($acao === 'reservar') {
        $id_livro = $_POST['id_livro'] ?? 0;
        $id_usuario = $_SESSION['id_usuario'] ?? 0;
        
        if ($id_usuario == 0) {
           
           echo json_encode(['status' => 'error', 'mensagem' => 'Acesso negado. Faça login.']);
            exit;
        
        }

        $resultado = reservarLivro($mysqli, $id_livro, $id_usuario);
        
        // Se a função retornar uma string de sucesso ou erro
        echo json_encode(['status' => 'success', 'mensagem' => $resultado]);
        exit;
    }
}

