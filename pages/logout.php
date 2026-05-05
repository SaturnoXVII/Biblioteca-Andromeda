<?php
require_once "../config/sessao.php";

encerrarSessao();

header("Location: login.php");
exit;
?>