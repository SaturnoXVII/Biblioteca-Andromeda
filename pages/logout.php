<?php
require_once __DIR__ . "/../config/sessao.php";

encerrarSessao();

header("Location: /Biblioteca-Andromeda/login");
exit;
?>