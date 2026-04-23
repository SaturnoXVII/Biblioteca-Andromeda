<!-- Perfil do leitor, não podemos se esquecer de colocar a parte de emprestimos aqui, depois podemos linkala na parte do menu do catalogo que  mostra os emprestimos -->


<?php
// ═══════════════════════════════════════════════════════════════
// BLOCO 1 — INICIALIZAÇÃO
// Inicia a sessão (obrigatório para ler/gravar $_SESSION)
// e carrega a conexão com o banco que já existe no projeto.
// ═══════════════════════════════════════════════════════════════
session_start();
require_once "../config/conexao.php"; // cria o $mysqli

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
// Ficam aqui em vez de num Repository separado, já que tudo
// está numa única página conforme solicitado.
// ═══════════════════════════════════════════════════════════════

/**
 * Busca todos os campos do usuário pelo id.
 * Retorna array associativo ou null se não encontrar.
 */
function buscarUsuario(mysqli $db, int $id): ?array
{
    // Prepared statement: o ? é preenchido com $id de forma segura,
    // impedindo SQL Injection mesmo que o valor fosse manipulado.
    $stmt = $db->prepare(
        "SELECT id_usuario, username, email, nome, sobrenome,
                data_nascimento, telefone, endereco, nivel_acesso, senha
         FROM usuarios
         WHERE id_usuario = ?
         LIMIT 1"
    );
    $stmt->bind_param('i', $id); // 'i' = integer
    $stmt->execute();
    $usuario = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $usuario ?: null;
}

/**
 * Atualiza os campos editáveis do perfil (sem a senha).
 * Retorna true se alguma linha foi modificada no banco.
 */
function atualizarPerfil(mysqli $db, int $id, array $d): bool
{
    $stmt = $db->prepare(
        "UPDATE usuarios
         SET nome = ?, sobrenome = ?, email = ?,
             telefone = ?, endereco = ?, data_nascimento = ?
         WHERE id_usuario = ?"
    );
    // 'ssssss' = 6 strings, 'i' = 1 inteiro, na mesma ordem dos ?
    $stmt->bind_param(
        'ssssssi',
        $d['nome'], $d['sobrenome'], $d['email'],
        $d['telefone'], $d['endereco'], $d['data_nascimento'],
        $id
    );
    $stmt->execute();
    $ok = $stmt->affected_rows >= 0; // >= 0 pois 0 afetadas ainda é sucesso
    $stmt->close();
    return $ok;
}

/**
 * Verifica se o email já pertence a OUTRO usuário.
 * Evita duplicatas ao editar o perfil.
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
 * Valida a senha atual antes de salvar a nova (com hash bcrypt).
 * Retorna uma string de erro ou null em caso de sucesso.
 */
function trocarSenha(mysqli $db, int $id, string $hashAtual, string $atual, string $nova, string $conf): ?string
{
    // password_verify compara a senha digitada com o hash salvo no banco
    if (!password_verify($atual, $hashAtual)) {
        return 'Senha atual incorreta.';
    }
    if (strlen($nova) < 6) {
        return 'A nova senha deve ter pelo menos 6 caracteres.';
    }
    if ($nova !== $conf) {
        return 'A confirmação não coincide com a nova senha.';
    }

    // password_hash aplica bcrypt — NUNCA salve senha em texto puro
    $hash = password_hash($nova, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE usuarios SET senha = ? WHERE id_usuario = ?");
    $stmt->bind_param('si', $hash, $id);
    $stmt->execute();
    $stmt->close();
    return null; // null = sem erro = sucesso
}

/**
 * Retorna todos os empréstimos do usuário com título e autor do livro.
 * O INNER JOIN conecta emprestimos → livros pelo id_livro.
 */
function buscarEmprestimos(mysqli $db, int $idUsuario): array
{
    $stmt = $db->prepare(
        "SELECT e.id_emprestimo,
                e.data_emprestimo,
                e.data_devolucao,
                e.status_emprestimo,
                l.titulo,
                l.id_autor
         FROM emprestimos e
         INNER JOIN Livros l ON l.id_livro = e.id_livro
         WHERE e.id_usuario = ?
         ORDER BY e.data_emprestimo DESC"
    );
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();
    $res = $stmt->get_result();
    $lista = [];
    // Cada chamada a fetch_assoc() retorna uma linha; null indica fim do resultado
    while ($row = $res->fetch_assoc()) {
        $lista[] = $row;
    }
    $stmt->close();
    return $lista;
}

// ═══════════════════════════════════════════════════════════════
// BLOCO 3 — PROCESSAMENTO DAS ACTIONS (POST)
// A página envia formulários para si mesma (action="perfil.php").
// O campo oculto <input name="action"> diz qual operação executar.
// Todo processamento acontece ANTES do HTML para poder redirecionar.
// ═══════════════════════════════════════════════════════════════
$erro    = null;  // mensagem de erro a exibir
$sucesso = null;  // mensagem de sucesso a exibir

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Qual botão/formulário foi submetido?
    $action = $_POST['action'] ?? '';

    // ── Action: editar perfil ────────────────────────────────
    if ($action === 'editar_perfil') {

        // trim() remove espaços extras; filter_var valida o e-mail
        $dados = [
            'nome'            => trim($_POST['nome']            ?? ''),
            'sobrenome'       => trim($_POST['sobrenome']       ?? ''),
            'email'           => trim($_POST['email']           ?? ''),
            'telefone'        => trim($_POST['telefone']        ?? ''),
            'endereco'        => trim($_POST['endereco']        ?? ''),
            'data_nascimento' => trim($_POST['data_nascimento'] ?? ''),
        ];

        // Validações básicas antes de tocar no banco
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

    // ── Action: trocar senha ─────────────────────────────────
    if ($action === 'trocar_senha') {

        // Busca o hash atual do banco para validar a senha digitada
        $usuarioTemp = buscarUsuario($mysqli, $idUsuario);
        $erroSenha   = trocarSenha(
            $mysqli,
            $idUsuario,
            $usuarioTemp['senha'],          // hash salvo no banco
            $_POST['senha_atual']   ?? '',  // digitada pelo usuário
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
// Feito APÓS o processamento para refletir qualquer atualização
// que acabou de acontecer na mesma requisição.
// ═══════════════════════════════════════════════════════════════
$usuario     = buscarUsuario($mysqli, $idUsuario);
$emprestimos = buscarEmprestimos($mysqli, $idUsuario);

// Segurança extra: sessão inválida
if (!$usuario) {
    session_destroy();
    header('Location: login.php');
    exit;
}

// Helper: htmlspecialchars() escapa caracteres especiais para evitar XSS
// ao imprimir dados do banco diretamente no HTML.
$h = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');

// Mapa de cores/labels para o status do empréstimo
$statusMap = [
    'Em andamento' => ['label' => 'Em andamento', 'class' => 'text-warning'],
    'Devolvido'    => ['label' => 'Devolvido',    'class' => 'text-success'],
    'Atrasado'     => ['label' => 'Atrasado',     'class' => 'text-danger'],
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
    <link rel="stylesheet" href="../assets/css/catalogo.css">
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════
     NAVEGAÇÃO LATERAL — mesma do catálogo.php
════════════════════════════════════════════════════════════ -->
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

<!-- ═══════════════════════════════════════════════════════════
     CONTEÚDO PRINCIPAL
════════════════════════════════════════════════════════════ -->
<div class="container py-5" style="margin-left: 80px;">

    <!-- Mensagens de feedback (sucesso ou erro) -->
    <?php if ($sucesso): ?>
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fa-solid fa-circle-check me-2"></i><?= $h($sucesso) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>
    <?php if ($erro): ?>
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fa-solid fa-triangle-exclamation me-2"></i><?= $h($erro) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <!-- ── Cabeçalho do perfil ─────────────────────────────── -->
    <div class="mb-4">
        <h2 class="fw-bold mb-0">
            <i class="fa-solid fa-user-astronaut me-2"></i>
            <?= $h($usuario['nome']) ?> <?= $h($usuario['sobrenome']) ?>
        </h2>
        <small class="text-muted">@<?= $h($usuario['username']) ?> · <?= $h($usuario['nivel_acesso']) ?></small>
    </div>

    <!-- ── Abas de navegação interna ──────────────────────── -->
    <!--
        As abas usam o sistema de tabs do Bootstrap.
        Cada <a data-bs-target="#..."> mostra um painel <div id="...">.
        Não há redirecionamento — tudo ocorre no cliente via JS do Bootstrap.
    -->
    <ul class="nav nav-tabs mb-4" id="perfilTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                <i class="fa-solid fa-id-card me-1"></i> Dados Pessoais
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-senha" type="button">
                <i class="fa-solid fa-lock me-1"></i> Alterar Senha
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-emprestimos" type="button">
                <i class="fa-solid fa-bookmark me-1"></i> Meus Empréstimos
                <!-- Badge com total de empréstimos -->
                <span class="badge bg-secondary ms-1"><?= count($emprestimos) ?></span>
            </button>
        </li>
    </ul>

    <div class="tab-content">

        <!-- ════════════════════════════════════════════════════
             ABA 1 — DADOS PESSOAIS
             Formulário que envia POST para perfil.php
             com action="editar_perfil"
        ═════════════════════════════════════════════════════ -->
        <div class="tab-pane fade show active" id="tab-dados">
            <!--
                action="perfil.php" → envia para a própria página
                method="POST"       → dados vão no corpo da requisição (não na URL)
            -->
            <form action="perfil.php" method="POST">
                <!-- Campo oculto que identifica qual action processar no PHP -->
                <input type="hidden" name="action" value="editar_perfil">

                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Nome</label>
                        <!-- value= preenche o campo com o dado atual do banco -->
                        <input type="text" name="nome" class="form-control"
                               value="<?= $h($usuario['nome']) ?>" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Sobrenome</label>
                        <input type="text" name="sobrenome" class="form-control"
                               value="<?= $h($usuario['sobrenome']) ?>">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">E-mail</label>
                        <input type="email" name="email" class="form-control"
                               value="<?= $h($usuario['email']) ?>" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Telefone</label>
                        <input type="text" name="telefone" class="form-control"
                               value="<?= $h($usuario['telefone']) ?>">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Data de Nascimento</label>
                        <input type="date" name="data_nascimento" class="form-control"
                               value="<?= $h($usuario['data_nascimento']) ?>">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Endereço</label>
                        <input type="text" name="endereco" class="form-control"
                               value="<?= $h($usuario['endereco']) ?>">
                    </div>
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-floppy-disk me-1"></i> Salvar Alterações
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <!-- ════════════════════════════════════════════════════
             ABA 2 — ALTERAR SENHA
             Formulário separado com action="trocar_senha"
        ═════════════════════════════════════════════════════ -->
        <div class="tab-pane fade" id="tab-senha">
            <form action="perfil.php" method="POST" style="max-width: 420px;">
                <input type="hidden" name="action" value="trocar_senha">

                <div class="mb-3">
                    <label class="form-label">Senha Atual</label>
                    <!--
                        type="password" → o browser não mostra o texto digitado
                        autocomplete="current-password" → hint para gerenciadores de senha
                    -->
                    <input type="password" name="senha_atual" class="form-control"
                           autocomplete="current-password" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Nova Senha</label>
                    <input type="password" name="senha_nova" class="form-control"
                           autocomplete="new-password" minlength="6" required>
                    <div class="form-text">Mínimo de 6 caracteres.</div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Confirmar Nova Senha</label>
                    <input type="password" name="senha_conf" class="form-control"
                           autocomplete="new-password" minlength="6" required>
                </div>
                <button type="submit" class="btn btn-warning">
                    <i class="fa-solid fa-key me-1"></i> Alterar Senha
                </button>
            </form>
        </div>

        <!-- ════════════════════════════════════════════════════
             ABA 3 — EMPRÉSTIMOS
             Apenas leitura: tabela com os dados do banco
        ═════════════════════════════════════════════════════ -->
        <div class="tab-pane fade" id="tab-emprestimos">

            <?php if (empty($emprestimos)): ?>
                <!-- Exibido quando o array de empréstimos está vazio -->
                <p class="text-muted">
                    <i class="fa-solid fa-inbox me-1"></i>
                    Você ainda não possui empréstimos registrados.
                </p>

            <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Título</th>
                                <th>Autor</th>
                                <th>Retirada</th>
                                <th>Devolução</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($emprestimos as $emp): ?>
                                <?php
                                    // Pega o label e a classe CSS do status atual
                                    $st = $statusMap[$emp['status']] ?? ['label' => $emp['status'], 'class' => 'text-secondary'];
                                ?>
                                <tr>
                                    <td><?= $h($emp['id_emprestimo']) ?></td>
                                    <td><?= $h($emp['titulo']) ?></td>
                                    <td><?= $h($emp['autor']) ?></td>
                                    <!-- date() reformata a data do MySQL (Y-m-d) para o padrão BR (d/m/Y) -->
                                    <td><?= date('d/m/Y', strtotime($emp['data_emprestimo'])) ?></td>
                                    <td>
                                        <?php if ($emp['data_devolucao']): ?>
                                            <?= date('d/m/Y', strtotime($emp['data_devolucao'])) ?>
                                        <?php else: ?>
                                            <span class="text-muted">—</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <span class="<?= $st['class'] ?> fw-semibold">
                                            <?= $h($st['label']) ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>

        </div><!-- /tab-emprestimos -->

    </div><!-- /tab-content -->
</div><!-- /container -->

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
// ═══════════════════════════════════════════════════════════════
// BLOCO JS — Reabre a aba correta após submit do formulário
//
// Problema: após o POST, a página recarrega e sempre abre a aba 1.
// Solução: antes de enviar, salva qual aba está ativa no localStorage.
//          Ao carregar, verifica e reabre a aba salva.
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const CHAVE = 'perfil_aba_ativa';

    // Reabre a aba salva (se houver)
    const abaSalva = localStorage.getItem(CHAVE);
    if (abaSalva) {
        const btn = document.querySelector(`[data-bs-target="${abaSalva}"]`);
        if (btn) new bootstrap.Tab(btn).show();
        localStorage.removeItem(CHAVE); // limpa após usar
    }

    // Antes de qualquer submit, salva qual aba está aberta
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
            const abaAtiva = document.querySelector('.nav-link.active[data-bs-target]');
            if (abaAtiva) localStorage.setItem(CHAVE, abaAtiva.dataset.bsTarget);
        });
    });
});
</script>

</body>
</html>