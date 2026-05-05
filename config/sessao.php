<?php
// config/sessao.php

function iniciarSessaoSegura()
{
    if (session_status() === PHP_SESSION_NONE) {
        $seguro = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $seguro,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        session_start();
    }
}

function criarSessaoUsuario($usuario)
{
    iniciarSessaoSegura();

    session_regenerate_id(true);

    $_SESSION['usuario_logado'] = true;
    $_SESSION['id_usuario'] = $usuario['id_usuario'];
    $_SESSION['username'] = $usuario['username'];
    $_SESSION['email'] = $usuario['email'];
    $_SESSION['nome'] = $usuario['nome'];
    $_SESSION['sobrenome'] = $usuario['sobrenome'];
    $_SESSION['nivel_acesso'] = $usuario['nivel_acesso'];
    $_SESSION['avatar'] = $usuario['avatar'] ?? null;
    $_SESSION['foto'] = $usuario['foto'] ?? null;
    $_SESSION['tipo_login'] = $usuario['tipo_login'] ?? 'normal';
    $_SESSION['ultimo_acesso'] = time();
}

function usuarioEstaLogado()
{
    iniciarSessaoSegura();

    return isset($_SESSION['usuario_logado']) && $_SESSION['usuario_logado'] === true;
}

function verificarTempoSessao()
{
    iniciarSessaoSegura();

    $tempoLimite = 1800; // 30 minutos

    if (isset($_SESSION['ultimo_acesso'])) {
        $tempoInativo = time() - $_SESSION['ultimo_acesso'];

        if ($tempoInativo > $tempoLimite) {
            encerrarSessao();
            header("Location: login.php?sessao=expirada");
            exit;
        }
    }

    $_SESSION['ultimo_acesso'] = time();
}

function protegerPagina()
{
    iniciarSessaoSegura();

    if (!usuarioEstaLogado()) {
        header("Location: login.php");
        exit;
    }

    verificarTempoSessao();
}

function protegerAdmin()
{
    protegerPagina();

    if ($_SESSION['nivel_acesso'] !== 'admin') {
        header("Location: catalogo.php");
        exit;
    }
}

function encerrarSessao()
{
    iniciarSessaoSegura();

    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}
?>