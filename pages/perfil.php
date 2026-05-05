<?php
// ═══════════════════════════════════════════════════════════════
// BLOCO 1 — INICIALIZAÇÃO
// Inicia a sessão (obrigatório para ler/gravar $_SESSION)
// e carrega a conexão com o banco que já existe no projeto.
// ═══════════════════════════════════════════════════════════════
session_start();
require_once "../config/conexao.php"; // cria o $mysqli
require_once "../config/sessao.php";
protegerPagina();

// ── Proteção de rota ─────────────────────────────────────────
// Se não há id_usuario na sessão, o usuário não está logado.
// Redireciona para o login e encerra o script imediatamente.
if (empty($_SESSION['id_usuario'])) {
    header('Location: login.php');
    exit;
}

// ID do usuário logado, convertido para inteiro por segurança
$idUsuario = (int) $_SESSION['id_usuario'];

// ═══════════════════════════════════════════════════════════════
// BLOCO 2 — FUNÇÕES INTERNAS
// ═══════════════════════════════════════════════════════════════

/**
 * Busca todos os campos do usuário pelo id.
 */
function buscarUsuario(mysqli $db, int $id): ?array
{
    $stmt = $db->prepare(
        "SELECT id_usuario, username, email, nome, sobrenome,
                data_nascimento, telefone, endereco, nivel_acesso, senha
         FROM usuarios
         WHERE id_usuario = ?
         LIMIT 1"
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $usuario = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $usuario ?: null;
}

/**
 * Atualiza os campos editáveis do perfil.
 */
function atualizarPerfil(mysqli $db, int $id, array $d): bool
{
    $stmt = $db->prepare(
        "UPDATE usuarios
         SET nome = ?, sobrenome = ?, email = ?,
             telefone = ?, endereco = ?, data_nascimento = ?
         WHERE id_usuario = ?"
    );
    $stmt->bind_param(
        'ssssssi',
        $d['nome'], $d['sobrenome'], $d['email'],
        $d['telefone'], $d['endereco'], $d['data_nascimento'],
        $id
    );
    $stmt->execute();
    $ok = $stmt->affected_rows >= 0;
    $stmt->close();
    return $ok;
}

/**
 * Verifica se o email já pertence a OUTRO usuário.
 */
function emailDuplicado(mysqli $db, string $email, int $idAtual): bool
{
    $stmt = $db->prepare(
        "SELECT id_usuario FROM usuarios
         WHERE email = ? AND id_usuario != ? LIMIT 1"
    );
    $stmt->bind_param('si', $email, $idAtual);
    $stmt->execute();
    $stmt->store_result();
    $existe = $stmt->num_rows > 0;
    $stmt->close();
    return $existe;
}

/**
 * Troca a senha do usuário.
 */
function trocarSenha(mysqli $db, int $id, string $hashAtual, string $atual, string $nova, string $conf): ?string
{
    if (!password_verify($atual, $hashAtual)) {
        return 'Senha atual incorreta.';
    }
    if (strlen($nova) < 6) {
        return 'A nova senha deve ter pelo menos 6 caracteres.';
    }
    if ($nova !== $conf) {
        return 'A confirmação não coincide com a nova senha.';
    }

    $hash = password_hash($nova, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE usuarios SET senha = ? WHERE id_usuario = ?");
    $stmt->bind_param('si', $hash, $id);
    $stmt->execute();
    $stmt->close();
    return null;
}

/**
 * Retorna todos os empréstimos do usuário com título e autor do livro.
 */
function buscarEmprestimos(mysqli $db, int $idUsuario): array
{
    $stmt = $db->prepare(
        "SELECT e.id_emprestimo,
                e.data_emprestimo,
                e.data_devolucao,
                e.status_emprestimo,
                l.titulo,
                a.nome as nome_autor
         FROM emprestimos e
         INNER JOIN Livros l ON l.id_livro = e.id_livro
         INNER JOIN autores a ON a.id_autor = l.id_autor
         WHERE e.id_usuario = ?
         ORDER BY e.data_emprestimo DESC"
    );
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $res = $stmt->get_result();
    $lista = [];
    while ($row = $res->fetch_assoc()) {
        $lista[] = $row;
    }
    $stmt->close();
    return $lista;
}

// ═══════════════════════════════════════════════════════════════
// BLOCO 3 — PROCESSAMENTO DAS ACTIONS (POST)
// ═══════════════════════════════════════════════════════════════
$erro    = null;
$sucesso = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'editar_perfil') {
        $dados = [
            'nome'            => trim($_POST['nome']            ?? ''),
            'sobrenome'       => trim($_POST['sobrenome']       ?? ''),
            'email'           => trim($_POST['email']           ?? ''),
            'telefone'        => trim($_POST['telefone']        ?? ''),
            'endereco'        => trim($_POST['endereco']        ?? ''),
            'data_nascimento' => trim($_POST['data_nascimento'] ?? ''),
        ];

        if (empty($dados['nome']) || empty($dados['email'])) {
            $erro = 'Nome e e-mail são obrigatórios.';
        } elseif (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
            $erro = 'E-mail inválido.';
        } elseif (emailDuplicado($mysqli, $dados['email'], $idUsuario)) {
            $erro = 'Este e-mail já está em uso por outra conta.';
        } else {
            atualizarPerfil($mysqli, $idUsuario, $dados);
            $sucesso = 'Perfil atualizado com sucesso!';
        }
    }

    if ($action === 'trocar_senha') {
        $usuarioTemp = buscarUsuario($mysqli, $idUsuario);
        $erroSenha   = trocarSenha(
            $mysqli,
            $idUsuario,
            $usuarioTemp['senha'],
            $_POST['senha_atual']   ?? '',
            $_POST['senha_nova']    ?? '',
            $_POST['senha_conf']    ?? ''
        );

        if ($erroSenha) {
            $erro = $erroSenha;
        } else {
            $sucesso = 'Senha alterada com sucesso!';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// BLOCO 4 — LEITURA DOS DADOS PARA EXIBIÇÃO
// ═══════════════════════════════════════════════════════════════
$usuario     = buscarUsuario($mysqli, $idUsuario);
$emprestimos = buscarEmprestimos($mysqli, $idUsuario);

if (!$usuario) {
    session_destroy();
    header('Location: login.php');
    exit;
}

$h = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');

$statusMap = [
    'Pendente'  => ['label' => 'Pendente',  'class' => 'text-info'],
    'Devolvido' => ['label' => 'Devolvido', 'class' => 'text-success'],
    'Atrasado'  => ['label' => 'Atrasado',  'class' => 'text-danger'],
];
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda · Meu Perfil</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="../assets/css/andro.css">
    <link rel="stylesheet" href="../assets/css/perfil.css">
</head>
<body>

<div id="webgl"></div>
<div id="grain"></div>
<div id="reticle"></div>
<div id="reticle-dot"></div>

<nav id="nav">
    <div class="nav-logo">
        <span class="nav-logo-text">Andrômeda</span>
    </div>
    <div class="nav-sec">
        <a href="catalogo.php"   class="nav-item"><i class="fa-solid fa-layer-group"></i><span>Catálogo</span></a>
        <a href="perfil.php"     class="nav-item active"><i class="fa-solid fa-user-astronaut"></i><span>Meu Perfil</span></a>
        <a href="emprestimos.php" class="nav-item"><i class="fa-solid fa-bookmark"></i><span>Empréstimos</span></a>
        <a href="reservas.php"   class="nav-item"><i class="fa-solid fa-clock-rotate-left"></i><span>Reservas</span></a>
    </div>
    <div class="nav-foot">
        <a href="index.php"  class="nav-item"><i class="fa-solid fa-rocket"></i><span>Início</span></a>
        <a href="logout.php" class="nav-item"><i class="fa-solid fa-right-from-bracket"></i><span>Sair</span></a>
    </div>
</nav>

<main class="main-wrapper py-5">

    <?php if ($sucesso): ?>
        <div class="alert alert-success alert-dismissible fade show align-items-center w-100" role="alert" style="max-width: 1100px;">
            <i class="fa-solid fa-circle-check fs-5 me-3 text-info"></i> 
            <div><?= $h($sucesso) ?></div>
            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>
    <?php if ($erro): ?>
        <div class="alert alert-danger alert-dismissible fade show align-items-center w-100" role="alert" style="max-width: 1100px;">
            <i class="fa-solid fa-triangle-exclamation fs-5 me-3 text-danger"></i>
            <div><?= $h($erro) ?></div>
            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <div class="perfil-header w-100">
        <div class="perfil-user-info d-flex align-items-center w-100">
            <div class="perfil-user-avatar">
                <i class="fa-solid fa-user-astronaut"></i>
            </div>
            <div class="perfil-user-details ms-3">
                <h2><?= $h($usuario['nome']) ?> <?= $h($usuario['sobrenome']) ?></h2>
                <div class="perfil-user-meta">
                    @<?= $h($usuario['username']) ?> <span class="mx-2 text-secondary">·</span> <?= $h($usuario['nivel_acesso']) ?>
                </div>
            </div>
        </div>
    </div>

    <ul class="nav nav-tabs mb-4 w-100" id="perfilTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                <i class="fa-solid fa-id-card me-2"></i> Dados Pessoais
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-senha" type="button">
                <i class="fa-solid fa-lock me-2"></i> Alterar Senha
            </button>
        </li>
        <li class="nav-item" role="presentation" >
            <button class="nav-link" id="emprestimos" data-bs-toggle="tab" data-bs-target="#tab-emprestimos" type="button">
                <i class="fa-solid fa-bookmark me-2"></i> Meus Empréstimos
                <span class="badge bg-secondary ms-2"><?= count($emprestimos) ?></span>
            </button>
        </li>
    </ul>

    <div class="tab-content pb-5 w-100">
        <div class="tab-pane fade show active w-100" id="tab-dados">
            <div class="form-card">
                <form action="perfil.php" method="POST">
                    <input type="hidden" name="action" value="editar_perfil">

                    <div class="row g-4">
                        <div class="col-md-6">
                            <label class="form-label">Nome</label>
                            <input type="text" name="nome" class="form-control" value="<?= $h($usuario['nome']) ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Sobrenome</label>
                            <input type="text" name="sobrenome" class="form-control" value="<?= $h($usuario['sobrenome']) ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">E-mail</label>
                            <input type="email" name="email" class="form-control" value="<?= $h($usuario['email']) ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Telefone</label>
                            <input type="text" name="telefone" class="form-control" value="<?= $h($usuario['telefone']) ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Data de Nascimento</label>
                            <input type="date" name="data_nascimento" class="form-control" value="<?= $h($usuario['data_nascimento']) ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Endereço</label>
                            <input type="text" name="endereco" class="form-control" value="<?= $h($usuario['endereco']) ?>">
                        </div>
                        <div class="col-12 mt-4 pt-4 border-top border-secondary border-opacity-25">
                            <button type="submit" class="btn btn-primary btn-glow">
                                <i class="fa-solid fa-floppy-disk me-2"></i> Salvar Alterações
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div class="tab-pane fade w-100" id="tab-senha">
            <div class="form-card" style="max-width: 550px;">
                <form action="perfil.php" method="POST">
                    <input type="hidden" name="action" value="trocar_senha">

                    <div class="mb-4">
                        <label class="form-label">Senha Atual</label>
                        <input type="password" name="senha_atual" class="form-control" autocomplete="current-password" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Nova Senha</label>
                        <input type="password" name="senha_nova" class="form-control" autocomplete="new-password" minlength="6" required>
                        <div class="form-text mt-2"><i class="fa-solid fa-circle-info me-1"></i> Mínimo de 6 caracteres.</div>
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Confirmar Nova Senha</label>
                        <input type="password" name="senha_conf" class="form-control" autocomplete="new-password" minlength="6" required>
                    </div>
                    <div class="mt-4 pt-4 border-top border-secondary border-opacity-25">
                        <button type="submit" class="btn btn-warning btn-glow w-100">
                            <i class="fa-solid fa-shield-halved me-2"></i> Atualizar Credenciais
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="tab-pane fade w-100" id="tab-emprestimos">
            <?php if (empty($emprestimos)): ?>
                <div class="form-card text-center py-5">
                    <div class="empty-state-icon mx-auto mb-4">
                        <i class="fa-solid fa-satellite-dish"></i>
                    </div>
                    <p class="text-muted text-uppercase" style="font-family: var(--font-mono); letter-spacing: 1.5px; margin-bottom: 0;">
                        Nenhum registro de exploração no acervo.
                    </p>
                </div>
            <?php else: ?>
                <div class="form-card p-0 overflow-hidden">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead style="background: rgba(42, 162, 246, 0.05);">
                                <tr>
                                    <th class="ps-4"># ID</th>
                                    <th>Título / Obra</th>
                                    <th>Autor</th>
                                    <th>Retirada</th>
                                    <th>Devolução</th>
                                    <th class="pe-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($emprestimos as $emp): ?>
                                    <?php
                                        $statusReal = $emp['status_emprestimo'];
                                        if (empty($statusReal)) {
                                            $statusReal = ($emp['data_devolucao'] && $emp['data_devolucao'] != '0000-00-00') ? 'Devolvido' : 'Pendente';
                                        }
                                        $st = $statusMap[$statusReal] ?? ['label' => $statusReal, 'class' => 'text-secondary'];
                                    ?>
                                    <tr>
                                        <td class="ps-4"><span style="color: var(--text-dim); font-family: var(--font-mono);"><?= $h($emp['id_emprestimo']) ?></span></td>
                                        <td class="fw-bold" style="color: var(--am3); font-size: 1.05rem;"><?= $h($emp['titulo']) ?></td>
                                        <td style="color: var(--text-dim);"><?= $h($emp['nome_autor']) ?></td>
                                        <td style="font-family: var(--font-mono); font-size: 0.85rem;"><i class="fa-regular fa-calendar me-2 text-muted"></i><?= date('d/m/Y', strtotime($emp['data_emprestimo'])) ?></td>
                                        <td style="font-family: var(--font-mono); font-size: 0.85rem;">
                                            <?php if ($emp['data_devolucao'] && $emp['data_devolucao'] != '0000-00-00'): ?>
                                                <i class="fa-solid fa-check text-success me-2"></i><?= date('d/m/Y', strtotime($emp['data_devolucao'])) ?>
                                            <?php else: ?>
                                                <span class="text-muted">—</span>
                                            <?php endif; ?>
                                        </td>
                                        <td class="pe-4">
                                            <span class="<?= $st['class'] ?> fw-semibold badge-status">
                                                <i class="fa-solid fa-circle" style="font-size: .4rem; margin-right: 6px; vertical-align: middle;"></i>
                                                <?= $h($st['label']) ?>
                                            </span>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
<script src="../assets/js/perfil.js"></script>

</body>
</html>