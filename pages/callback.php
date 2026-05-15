<?php
require_once "../config/conexao.php";
require_once "../config/sessao.php";
 
header("Content-Type: application/json");
 
iniciarSessaoSegura();
 
$input = json_decode(file_get_contents("php://input"), true);
 
if (!isset($input['token']) || empty($input['token'])) {
    echo json_encode(["status" => "error", "message" => "Token não enviado."]);
    exit;
}
 
$token         = $input['token'];
$modo          = $input['modo'] ?? 'login'; // 'login' ou 'cadastro'
$googleClientId = "1080679226381-9jbho9u4m814nm8g3lavhf7qsofd70d3.apps.googleusercontent.com";
 
// ── 1. Valida o token com o Google ──────────────────────────────────────────
$verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($token);
$response  = file_get_contents($verifyUrl);
 
if ($response === false) {
    echo json_encode(["status" => "error", "message" => "Não foi possível validar o token Google."]);
    exit;
}
 
$googleData = json_decode($response, true);
 
if (!$googleData || !isset($googleData['aud']) || $googleData['aud'] !== $googleClientId) {
    echo json_encode(["status" => "error", "message" => "Token Google inválido."]);
    exit;
}
 
$googleSub    = $googleData['sub']     ?? null;
$email        = $googleData['email']   ?? null;
$nomeCompleto = $googleData['name']    ?? "";
$fotoGoogle   = $googleData['picture'] ?? null;
 
if (!$googleSub || !$email) {
    echo json_encode(["status" => "error", "message" => "Dados do Google incompletos."]);
    exit;
}
 
// ── 2. Busca o usuário no banco ──────────────────────────────────────────────
$sql = "SELECT 
            id_usuario, username, email, senha, nivel_acesso,
            nome, sobrenome, avatar, foto, tipo_login, google_sub
        FROM usuarios
        WHERE google_sub = ? OR email = ?
        LIMIT 1";
 
$stmt = $mysqli->prepare($sql);
$stmt->bind_param("ss", $googleSub, $email);
$stmt->execute();
$result  = $stmt->get_result();
$usuario = $result->fetch_assoc();
 
// ── 3. MODO CADASTRO ─────────────────────────────────────────────────────────
if ($modo === 'cadastro') {
    if ($usuario) {
        // Já tem conta: faz login direto
        _atualizarDadosGoogle($mysqli, $usuario, $googleSub, $fotoGoogle);
        criarSessaoUsuario($usuario);
        echo json_encode([
            "status"       => "ja_cadastrado",
            "nivel_acesso" => $usuario['nivel_acesso']
        ]);
    } else {
        // Novo usuário: devolve os dados para preencher o formulário
        $partes    = explode(" ", trim($nomeCompleto), 2);
        $nome      = $partes[0] ?? "";
        $sobrenome = $partes[1] ?? "";
        echo json_encode([
            "status"     => "novo_usuario",
            "nome"       => $nome,
            "sobrenome"  => $sobrenome,
            "email"      => $email,
            "google_sub" => $googleSub,
            "foto"       => $fotoGoogle
        ]);
    }
    exit;
}
 
// ── 4. MODO LOGIN (padrão) ───────────────────────────────────────────────────
if (!$usuario) {
    echo json_encode(["status" => "not_registered", "message" => "Usuário não cadastrado."]);
    exit;
}
 
_atualizarDadosGoogle($mysqli, $usuario, $googleSub, $fotoGoogle);
criarSessaoUsuario($usuario);
 
echo json_encode([
    "status"       => "success",
    "nivel_acesso" => $usuario['nivel_acesso']
]);
exit;
 
// ── Função auxiliar ──────────────────────────────────────────────────────────
function _atualizarDadosGoogle(mysqli $mysqli, array &$usuario, string $googleSub, ?string $fotoGoogle): void
{
    $upd = $mysqli->prepare("
        UPDATE usuarios
        SET google_sub  = ?,
            google_id   = ?,
            foto        = COALESCE(foto, ?),
            tipo_login  = 'google'
        WHERE id_usuario = ?
    ");
    $upd->bind_param("sssi", $googleSub, $googleSub, $fotoGoogle, $usuario['id_usuario']);
    $upd->execute();
 
    $usuario['google_sub'] = $googleSub;
    $usuario['tipo_login'] = 'google';
    if (empty($usuario['foto']) && !empty($fotoGoogle)) {
        $usuario['foto'] = $fotoGoogle;
    }
}
 