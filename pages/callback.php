<?php
if (!isset($_SESSION)) session_start();
require '../vendor/autoload.php';
require '../config/conexao.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents("php://input"));

if (!isset($input->token)) {
    echo json_encode(["status" => "error"]);
    exit;
}

$client = new Google_Client([
    'client_id' => '1080679226381-9jbho9u4m814nm8g3lavhf7qsofd70d3.apps.googleusercontent.com'
]);

$payload = $client->verifyIdToken($input->token);

if (!$payload) {
    echo json_encode(["status" => "error"]);
    exit;
}

$google_id = $payload['sub'];
$nome      = $payload['name'];
$email     = $payload['email'];
$foto      = $payload['picture'];

// Verifica se já existe
$check = $mysqli->prepare("SELECT * FROM usuarios WHERE google_id = ? OR email = ?");
$check->bind_param("ss", $google_id, $email);
$check->execute();
$result = $check->get_result();
$usuario = $result->fetch_assoc();

if ($usuario) {
    // Já cadastrado → faz login
    $_SESSION['user'] = $usuario;
    echo json_encode(["status" => "ja_cadastrado"]);
} else {
    // Novo → devolve dados pro frontend preencher o form
    echo json_encode([
        "status"    => "novo_usuario",
        "google_id" => $google_id,
        "nome"      => $nome,
        "email"     => $email,
        "foto"      => $foto
    ]);
}