<?php
session_start();
include "../config/conexao.php";
include "../config/crud.php";

$action = $_GET['action'] ?? 'listar';

// Lógica de Processamento 
if ($action === 'registrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_livro = $_POST['id_livro'];
    $id_usuario = $_POST['id_usuario'];
    $data_prevista = $_POST['data_devolucao_prevista'];

    if (registrarEmprestimo($mysqli, $id_livro, $id_usuario, $data_prevista)) {
        header("Location: emprestimos.php?msg=sucesso");
    } else {
        header("Location: emprestimos.php?msg=erro_estoque");
    }
    exit;
}

if ($action === 'devolver' && isset($_GET['id'])) {
    devolverLivro($mysqli, (int)$_GET['id']);
    header("Location: emprestimos.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>O Cofre Cósmico | Empréstimos</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500;600;700&family=Space+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/catalogo.css"> 
    <link rel="stylesheet" href="../assets/css/adm.css"> 
</head>

<body>
    <div id="grain"></div>
    <div id="canvas-dim" class="dimmed"></div>

    <div id="reticle" class="hide-on-mobile">
        <svg viewBox="0 0 100 100">
            <circle class="ret-ring" cx="50" cy="50" r="45"/>
            <line class="ret-cross" x1="50" y1="20" x2="50" y2="80"/>
            <line class="ret-cross" x1="20" y1="50" x2="80" y2="50"/>
        </svg>
    </div>
    <div id="reticle-dot" class="hide-on-mobile"></div>

    <?php if (isset($_GET['msg'])): ?>
        <div id="toast" class="cosmic-toast <?= $_GET['msg'] === 'erro_estoque' ? 'erro' : 'sucesso' ?>">
            <div class="toast-icon"><?= $_GET['msg'] === 'erro_estoque' ? '⚠️' : '✨' ?></div>
            <div class="toast-content">
                <?= $_GET['msg'] === 'erro_estoque' ? 'Anomalia detectada: Livro indisponível no estoque.' : 'Transação registrada no cofre com sucesso!' ?>
            </div>
        </div>
    <?php endif; ?>

    <nav id="nav">
        <div class="nav-logo">
            <span class="nav-logo-text">Andrômeda</span>
        </div>
        <div class="nav-sec">
            <a href="adm.php" class="nav-item">
                <i>📚</i>
                <span>Acervo</span>
            </a>
            <a href="emprestimos.php" class="nav-item <?= $action === 'listar' ? 'active' : '' ?>">
                <i>📜</i>
                <span>Empréstimos</span>
            </a>
            <a href="emprestimos.php?action=novo" class="nav-item <?= $action === 'novo' ? 'active' : '' ?>">
                <i>✨</i>
                <span>Novo Registro</span>
            </a>
            <a href="adm.php?action=add" class="nav-item <?= $action === 'add' ? 'active' : '' ?>">
                <i>✨</i>
                <span>Novo Tomo</span>
            </a>
        </div>
    </nav>

    <div id="editorial-view" class="open">
        <header class="ed-header animate-rise">
            <h1 class="ed-header-title">Registros <em>Cósmicos</em></h1>
            <p class="ed-header-desc">Gerenciamento dinâmico de transações, empréstimos e devoluções dos artefatos da biblioteca.</p>
        </header>

        <div class="ed-section" style="margin-top: 50px;">
            <?php if ($action === 'listar'): ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Empréstimos Ativos</h2>
                </div>
                
                <div class="table-wrapper animate-rise" style="animation-delay: 0.2s;">
                    <div class="table-responsive">
                        <table class="cosmic-table">
                            <thead>
                                <tr>
                                    <th>Livro</th>
                                    <th>Usuário</th>
                                    <th>Data Empréstimo</th>
                                    <th>Previsão Devolução</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php 
                                $emprestimos = listarEmprestimos($mysqli);
                                if (empty($emprestimos)): 
                                ?>
                                    <tr>
                                        <td colspan="6" class="empty-state">
                                            <i>📡</i>
                                            <p>Nenhum registro de transação encontrado no cofre no momento.</p>
                                        </td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($emprestimos as $index => $e): ?>
                                        <tr class="stagger-item" style="animation-delay: <?= 0.3 + ($index * 0.05) ?>s;">
                                            <td style="font-weight: 600; color: var(--am3);"><?= htmlspecialchars($e['titulo']) ?></td>
                                            <td><?= htmlspecialchars($e['usuario']) ?></td>
                                            <td class="t-mono"><?= date('d/m/Y', strtotime($e['data_emprestimo'])) ?></td>
                                            <td class="t-mono"><?= date('d/m/Y', strtotime($e['data_devolucao_prevista'])) ?></td>
                                            <td>
                                                <?php if ($e['status'] === 'Pendente'): ?>
                                                    <span class="sbadge s-empr">Pendente</span>
                                                <?php else: ?>
                                                    <span class="sbadge s-disp">Devolvido</span>
                                                <?php endif; ?>
                                            </td>
                                            <td style="text-align: right;">
                                                <?php if ($e['status'] === 'Pendente'): ?>
                                                    <a href="emprestimos.php?action=devolver&id=<?= $e['id_emprestimo'] ?>" onclick="return confirm('Confirmar o retorno deste artefato?')" class="btn-sec btn-sm">Dar Baixa</a>
                                                <?php else: ?>
                                                    <span class="t-dim t-mono" style="font-size: 0.7rem;">Em: <?= date('d/m/Y', strtotime($e['data_devolucao_real'])) ?></span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            <?php elseif ($action === 'novo'): ?>
                <div class="ed-section-header animate-rise" style="animation-delay: 0.1s;">
                    <h2 class="ed-section-title">Registrar Empréstimo</h2>
                </div>

                <form method="POST" action="emprestimos.php?action=registrar" class="cosmic-form animate-rise" style="animation-delay: 0.2s;">
                    
                    <div class="form-group stagger-item" style="animation-delay: 0.3s;">
                        <label>Livro Solicitado:</label>
                        <select name="id_livro" required class="cosmic-input">
                            <option value="">-- Selecione o Tomo --</option>
                            <?php
                            $livros = listarLivros($mysqli);

                            foreach ($livros as $l):
                                $livroNormalizado = array_change_key_case($l, CASE_LOWER);

                                $id   = $livroNormalizado['id_livro'] ?? 0;
                                $nome = $livroNormalizado['titulo']   ?? 'Sem título';
                                $qtd  = $livroNormalizado['quantidade'] ?? 0;
                            ?>
                                <option value="<?= $id ?>" <?= $qtd == 0 ? 'disabled' : '' ?>>
                                    <?= htmlspecialchars($nome) ?> <?= $qtd == 0 ? '(Esgotado)' : "— (Qtd: $qtd)" ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group stagger-item" style="animation-delay: 0.4s;">
                        <label>Usuário Explorador:</label>
                        <select name="id_usuario" required class="cosmic-input">
                            <option value="">-- Selecione o Explorador --</option>
                            <?php foreach (listarUsuarios($mysqli) as $u): ?>
                                <option value="<?= $u['id_usuario'] ?>"><?= $u['nome'] ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group stagger-item" style="animation-delay: 0.5s;">
                        <label>Data de Devolução Prevista:</label>
                        <input type="date" name="data_devolucao_prevista" required class="cosmic-input" min="<?= date('Y-m-d') ?>">
                    </div>

                    <div class="form-actions stagger-item" style="animation-delay: 0.6s;">
                        <button type="submit" class="btn-prim">Confirmar Empréstimo</button>
                    </div>
                </form>
            <?php endif; ?>
        </div>
    </div>

    <script>
        // Cursor Magnético
        const cursor = document.getElementById('reticle');
        const dot = document.getElementById('reticle-dot');
        
        if (window.matchMedia("(pointer: fine)").matches) {
            document.addEventListener('mousemove', (e) => {
                cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
                dot.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
            });

            document.querySelectorAll('a, button, select, input').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
            });
        }

        // Toasts Refinados
        const toast = document.getElementById('toast');
        if (toast) {
            // Animação de entrada
            setTimeout(() => toast.classList.add('show'), 100);
            
            // Animação de saída
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500); 
            }, 4500);
        }
    </script>
</body>
</html>