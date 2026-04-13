<?php 

$host = "andromeda.mysql.dbaas.com.br";
$user = "andromeda";
$password = "OrionLira#07";
$database = "andromeda";


// Oii gab, aqui adicionei os códigos que criam um objeto mysqli para conectar ao banco de dado, e se a conexão falhar, ele mostra uma mensagem de erro e encerra o script.

$mysqli = new mysqli($host, $user, $password, $database);

if($mysqli->error) {
    die("Falha ao conectar ao banco de dados: " . $mysqli->error);
}

?>