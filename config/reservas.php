<?php
session_start();
include "../config/conexao.php";
include "../config/crud.php";

if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

$id_usuario = (int)$_SESSION['user']['id_usuario'];

// Cancelar reserva
if (isset($_GET['cancelar'])) {
    cancelarReserva($mysqli, (int)$_GET['cancelar']);
    header("Location: reservas.php?msg=cancelado");
    exit;
}

$reservas = listarReservasUsuario($mysqli, $id_usuario);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Andrômeda · Minhas Reservas</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/catalogo.css">
    <link rel="stylesheet" href="../assets/css/adm.css">
</head>
<body>
<div id="grain"></div>

<nav id="nav">
    <div class="nav-logo"><span class="nav-logo-text">Andrômeda</span></div>
    <div class="nav-sec">
        <a href="catalogo.php" class="nav-item"><i>📚</i><span>Catálogo</span></a>
        <a href="perfil.php" class="nav-item"><i>👤</i><span>Meu Perfil</span></a>
        <a href="emprestimos.php" class="nav-item"><i>📖</i><span>Empréstimos</span></a>
        <a href="reservas.php" class="nav-item active"><i>⏳</i><span>Reservas</span></a>
    </div>
    <div class="nav-foot">
        <a href="logout.php" class="nav-item"><i>🚀</i><span>Sair</span></a>
    </div>
</nav>

<div id="editorial-view" class="open">
    <header class="ed-header animate-rise">
        <h1 class="ed-header-title">Fila de <em>Espera</em></h1>
        <p class="ed-header-desc">Obras reservadas que aguardam sua vez no cosmos.</p>
    </header>

    <?php if (isset($_GET['msg'])): ?>
        <div id="toast" class="cosmic-toast <?= $_GET['msg'] === 'cancelado' ? 'erro' : 'sucesso' ?>">
            <div class="toast-icon"><?= $_GET['msg'] === 'cancelado' ? '🗑️' : '✨' ?></div>
            <div class="toast-content">
                <?= $_GET['msg'] === 'reserva_ok'
                    ? 'Você entrou na fila de espera com sucesso!'
                    : 'Reserva cancelada.' ?>
            </div>
        </div>
    <?php endif; ?>

    <div class="ed-section" style="margin-top: 50px;">
        <div class="table-wrapper animate-rise">
            <div class="table-responsive">
                <table class="cosmic-table">
                    <thead>
                        <tr>
                            <th>Obra</th>
                            <th>Autor</th>
                            <th>Categoria</th>
                            <th>Status do Livro</th>
                            <th>Reservado em</th>
                            <th style="text-align:right;">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($reservas)): ?>
                            <tr>
                                <td colspan="6" class="empty-state">
                                    <i>🌌</i>
                                    <p>Nenhuma reserva ativa no momento.</p>
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($reservas as $i => $r): ?>
                            <tr class="stagger-item" style="animation-delay: <?= 0.1 + $i * 0.05 ?>s;">
                                <td style="font-weight:600; color:var(--am3);">
                                    <?= htmlspecialchars($r['titulo']) ?>
                                </td>
                                <td><?= htmlspecialchars($r['autor']) ?></td>
                                <td><?= htmlspecialchars($r['categoria']) ?></td>
                                <td>
                                    <?php if ($r['status_livro'] === 'Disponível'): ?>
                                        <span class="sbadge s-disp">Disponível</span>
                                    <?php else: ?>
                                        <span class="sbadge s-unk">Indisponível</span>
                                    <?php endif; ?>
                                </td>
                                <td class="t-mono">
                                    <?= date('d/m/Y', strtotime($r['data_reserva'])) ?>
                                </td>
                                <td style="text-align:right;">
                                    <a href="reservas.php?cancelar=<?= $r['id_reserva'] ?>"
                                       onclick="return confirm('Cancelar esta reserva?')"
                                       class="btn-action btn-delete">
                                        Cancelar
                                    </a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>
    const toast = document.getElementById('toast');
    if (toast) {
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { toast.classList.remove('show'); }, 4500);
    }
</script>
</body>
</html>