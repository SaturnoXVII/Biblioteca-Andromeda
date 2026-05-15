<?php
// ═══════════════════════════════════════════════════════════════
// BLOCO 1 — INICIALIZAÇÃO
// Inicia a sessão (obrigatório para ler/gravar $_SESSION)
// e carrega a conexão com o banco que já existe no projeto.
// ═══════════════════════════════════════════════════════════════
session_start();
require_once __DIR__ . "/../config/conexao.php"; // cria o $mysqli
require_once __DIR__ . "/../config/sessao.php";
protegerPagina();

// ── Proteção de rota ─────────────────────────────────────────
// Se não há id_usuario na sessão, o usuário não está logado.
// Redireciona para o login e encerra o script imediatamente.
if (empty($_SESSION['id_usuario'])) {
    header('Location: /Biblioteca-Andromeda/login');
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
                data_nascimento, telefone, endereco, nivel_acesso, senha,
                avatar, foto
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



function atualizarFotoPerfil(mysqli $db, int $id, string $avatar): bool
{
    $stmt = $db->prepare("UPDATE usuarios SET avatar = ?, foto = ? WHERE id_usuario = ?");
    $stmt->bind_param('ssi', $avatar, $avatar, $id);
    $stmt->execute();
    $ok = $stmt->affected_rows >= 0;
    $stmt->close();
    return $ok;
}

function salvarArquivoAvatar(array $arquivo): array
{
    if (empty($arquivo['name'])) return [null, null];
    if (($arquivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return [null, 'Não foi possível enviar a imagem.'];
    if (($arquivo['size'] ?? 0) > 3145728) return [null, 'A imagem deve ter no máximo 3MB.'];

    $tmp = $arquivo['tmp_name'] ?? '';
    if (!$tmp || !is_uploaded_file($tmp)) return [null, 'Arquivo inválido.'];

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmp);
    $extensoes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];

    if (!isset($extensoes[$mime])) return [null, 'Use uma imagem JPG, PNG ou WEBP.'];

    $dirFisico = dirname(__DIR__) . '/uploads/avatars';
    if (!is_dir($dirFisico)) mkdir($dirFisico, 0775, true);

    $nomeArquivo = 'avatar_' . bin2hex(random_bytes(8)) . '.' . $extensoes[$mime];
    $destino = $dirFisico . '/' . $nomeArquivo;

    if (!move_uploaded_file($tmp, $destino)) return [null, 'Não foi possível salvar a foto.'];

    return ['uploads/avatars/' . $nomeArquivo, null];
}

function caminhoAvatarPerfil(?string $avatar): string
{
    $avatar = trim((string)$avatar);
    if ($avatar === '') return '';

    $avatar = str_replace('\\', '/', $avatar);

    if (preg_match('/^(https?:)?\/\//i', $avatar) || preg_match('/^data:image\//i', $avatar)) {
        return $avatar;
    }

    $lower = strtolower($avatar);
    $uploadsPos = strrpos($lower, '/uploads/');
    if ($uploadsPos !== false) {
        $avatar = substr($avatar, $uploadsPos + 1);
    }

    $avatar = preg_replace('#^\./+#', '', $avatar);

    if (strpos($avatar, '../') === 0) {
        $publicPath = $avatar;
        $relativePath = preg_replace('#^\.\./#', '', $avatar);
    } elseif (strpos($avatar, '/uploads/') === 0) {
        $publicPath = '..' . $avatar;
        $relativePath = ltrim($avatar, '/');
    } elseif (strpos($avatar, 'uploads/') === 0) {
        $publicPath = '../' . $avatar;
        $relativePath = $avatar;
    } elseif (preg_match('/\.(jpe?g|png|webp|gif)$/i', $avatar) && strpos($avatar, '/') === false) {
        $relativePath = 'uploads/avatars/' . $avatar;
        $publicPath = '../' . $relativePath;
    } else {
        $relativePath = ltrim($avatar, '/');
        $publicPath = '../' . $relativePath;
    }

    $relativePath = ltrim(str_replace(['../', './'], '', $relativePath), '/');
    if (strpos($relativePath, 'uploads/') === 0) {
        $fisico = dirname(__DIR__) . '/' . $relativePath;
        if (!is_file($fisico)) return '';
    }

    $publicPath = str_replace('\\', '/', $publicPath);
    if (strpos($publicPath, '../') === 0) {
        $publicPath = '/Biblioteca-Andromeda/' . ltrim(substr($publicPath, 3), '/');
    } elseif (strpos($publicPath, './') === 0) {
        $publicPath = '/Biblioteca-Andromeda/' . ltrim(substr($publicPath, 2), '/');
    } elseif (strpos($publicPath, 'uploads/') === 0) {
        $publicPath = '/Biblioteca-Andromeda/' . $publicPath;
    }
    return $publicPath;
}

function perfilIniciaisUsuario(?string $nome, ?string $sobrenome = ''): string
{
    $nome = trim((string)$nome);
    $sobrenome = trim((string)$sobrenome);
    $base = trim($nome . ' ' . $sobrenome);
    if ($base === '') return 'A';

    $partes = preg_split('/\s+/', $base) ?: [];
    $primeira = $partes[0] ?? 'A';
    $ultima = count($partes) > 1 ? end($partes) : '';

    $i1 = function_exists('mb_substr') ? mb_substr($primeira, 0, 1, 'UTF-8') : substr($primeira, 0, 1);
    $i2 = $ultima !== '' ? (function_exists('mb_substr') ? mb_substr($ultima, 0, 1, 'UTF-8') : substr($ultima, 0, 1)) : '';
    $iniciais = $i1 . $i2;

    return function_exists('mb_strtoupper') ? mb_strtoupper($iniciais, 'UTF-8') : strtoupper($iniciais);
}

function buscarReservasPerfil(mysqli $db, int $idUsuario): array
{
    try {
        $stmt = $db->prepare(
            "SELECT R.id_reserva,
                    R.data_reserva,
                    R.reserva_status,
                    L.titulo,
                    L.status AS status_livro,
                    COALESCE(A.nome, 'Autor não informado') AS nome_autor,
                    COALESCE(C.nome, 'Acervo') AS categoria_nome
             FROM reservas R
             INNER JOIN Livros L ON L.id_livro = R.id_livro
             LEFT JOIN autores A ON A.id_autor = L.id_autor
             LEFT JOIN Categorias C ON C.id_categoria = L.id_categoria
             WHERE R.id_usuario = ?
               AND R.reserva_status IN ('Aguardando', 'Notificado')
             ORDER BY R.data_reserva DESC"
        );
        if (!$stmt) return [];
        $stmt->bind_param('i', $idUsuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $lista = [];
        while ($row = $res->fetch_assoc()) $lista[] = $row;
        $stmt->close();
        return $lista;
    } catch (mysqli_sql_exception $e) {
        return [];
    }
}

function buscarRankingLeitoresPerfil(mysqli $db, int $limite = 8): array
{
    $inicioMes = date('Y-m-01 00:00:00');
    $sql = "
        SELECT
            U.id_usuario,
            U.nome,
            U.sobrenome,
            COALESCE(NULLIF(U.avatar, ''), NULLIF(U.foto, ''), '') AS avatar_usuario,
            COUNT(DISTINCT CASE
                WHEN E.status_emprestimo = 'Devolvido'
                 AND COALESCE(NULLIF(E.data_devolucao, '0000-00-00'), E.data_emprestimo) >= ?
                THEN E.id_emprestimo END
            ) AS leituras_mes,
            COUNT(DISTINCT CASE
                WHEN A.status = 'ativo'
                 AND COALESCE(A.data_atualizacao, A.data_avaliacao) >= ?
                THEN A.id_avaliacao END
            ) AS avaliacoes_mes,
            COUNT(DISTINCT CASE
                WHEN R.reserva_status IN ('Aguardando', 'Notificado')
                 AND R.data_reserva >= ?
                THEN R.id_reserva END
            ) AS reservas_mes,
            (
                COUNT(DISTINCT CASE
                    WHEN E.status_emprestimo = 'Devolvido'
                     AND COALESCE(NULLIF(E.data_devolucao, '0000-00-00'), E.data_emprestimo) >= ?
                    THEN E.id_emprestimo END
                ) * 5
                + COUNT(DISTINCT CASE
                    WHEN A.status = 'ativo'
                     AND COALESCE(A.data_atualizacao, A.data_avaliacao) >= ?
                    THEN A.id_avaliacao END
                ) * 2
                + COUNT(DISTINCT CASE
                    WHEN R.reserva_status IN ('Aguardando', 'Notificado')
                     AND R.data_reserva >= ?
                    THEN R.id_reserva END
                )
            ) AS pontuacao
        FROM usuarios U
        LEFT JOIN emprestimos E ON E.id_usuario = U.id_usuario
        LEFT JOIN avaliacoes A ON A.id_usuario = U.id_usuario
        LEFT JOIN reservas R ON R.id_usuario = U.id_usuario
        GROUP BY U.id_usuario, U.nome, U.sobrenome, U.avatar, U.foto
        HAVING pontuacao > 0
        ORDER BY pontuacao DESC, leituras_mes DESC, avaliacoes_mes DESC, reservas_mes DESC, U.nome ASC
        LIMIT ?
    ";

    try {
        $stmt = $db->prepare($sql);
        if (!$stmt) return [];
        $stmt->bind_param('ssssssi', $inicioMes, $inicioMes, $inicioMes, $inicioMes, $inicioMes, $inicioMes, $limite);
        $stmt->execute();
        $res = $stmt->get_result();
        $lista = [];
        while ($row = $res->fetch_assoc()) {
            $row['leituras_mes'] = (int)($row['leituras_mes'] ?? 0);
            $row['avaliacoes_mes'] = (int)($row['avaliacoes_mes'] ?? 0);
            $row['reservas_mes'] = (int)($row['reservas_mes'] ?? 0);
            $row['pontuacao'] = (int)($row['pontuacao'] ?? 0);
            $lista[] = $row;
        }
        $stmt->close();
        return $lista;
    } catch (mysqli_sql_exception $e) {
        return [];
    }
}

function perfilColunaDisponivel(mysqli $db, string $tabela, array $colunas): ?string
{
    static $cache = [];
    $tabelaSegura = preg_replace('/[^a-zA-Z0-9_]/', '', $tabela);
    if ($tabelaSegura === '') return null;

    if (!array_key_exists($tabelaSegura, $cache)) {
        $cache[$tabelaSegura] = [];
        try {
            $res = $db->query("SHOW COLUMNS FROM `{$tabelaSegura}`");
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $cache[$tabelaSegura][strtolower((string)$row['Field'])] = (string)$row['Field'];
                }
            }
        } catch (mysqli_sql_exception $e) {
            $cache[$tabelaSegura] = [];
        }
    }

    foreach ($colunas as $coluna) {
        $key = strtolower((string)$coluna);
        if (isset($cache[$tabelaSegura][$key])) return $cache[$tabelaSegura][$key];
    }

    return null;
}

/**
 * Retorna todas as avaliações feitas pelo usuário com os dados principais do livro.
 */
function buscarAvaliacoesUsuario(mysqli $db, int $idUsuario): array
{
    $autorColuna = perfilColunaDisponivel($db, 'autores', ['nome', 'nome_autor', 'autor_nome', 'nome_completo', 'autor']);
    $categoriaColuna = perfilColunaDisponivel($db, 'Categorias', ['nome', 'categoria_nome', 'nome_categoria', 'categoria']);

    $autorSelect = $autorColuna
        ? "COALESCE(NULLIF(AU.`{$autorColuna}`, ''), 'Autor não informado')"
        : "'Autor não informado'";
    $categoriaSelect = $categoriaColuna
        ? "COALESCE(NULLIF(C.`{$categoriaColuna}`, ''), 'Acervo')"
        : "'Acervo'";
    $autorJoin = $autorColuna ? "LEFT JOIN autores AU ON AU.id_autor = L.id_autor" : "";
    $categoriaJoin = $categoriaColuna ? "LEFT JOIN Categorias C ON C.id_categoria = L.id_categoria" : "";

    try {
        $stmt = $db->prepare(
        "SELECT A.id_avaliacao,
                A.id_livro,
                A.nota,
                A.comentario,
                A.data_avaliacao,
                A.data_atualizacao,
                L.titulo,
                U.nome AS usuario_nome,
                U.sobrenome AS usuario_sobrenome,
                COALESCE(NULLIF(U.avatar, ''), NULLIF(U.foto, ''), '') AS avatar_usuario,
                {$autorSelect} AS nome_autor,
                {$categoriaSelect} AS categoria_nome
         FROM avaliacoes A
         INNER JOIN Livros L ON L.id_livro = A.id_livro
         INNER JOIN usuarios U ON U.id_usuario = A.id_usuario
         {$autorJoin}
         {$categoriaJoin}
         WHERE A.id_usuario = ?
           AND A.status = 'ativo'
         ORDER BY A.data_atualizacao DESC"
        );
    } catch (mysqli_sql_exception $e) {
        return [];
    }

    if (!$stmt) {
        return [];
    }

    $stmt->bind_param('i', $idUsuario);
    try {
        $stmt->execute();
        $res = $stmt->get_result();
    } catch (mysqli_sql_exception $e) {
        $stmt->close();
        return [];
    }

    $lista = [];
    while ($row = $res->fetch_assoc()) {
        $lista[] = $row;
    }

    $stmt->close();
    return $lista;
}


function atualizarAvaliacaoUsuario(mysqli $db, int $idUsuario, int $idAvaliacao, float $nota, string $comentario): ?string
{
    if ($idAvaliacao <= 0) {
        return 'Avaliação inválida.';
    }

    $nota = round($nota * 2) / 2;

    if ($nota < 0.5 || $nota > 5) {
        return 'Escolha uma nota entre 0,5 e 5 estrelas.';
    }

    $comentario = trim($comentario);
    if (function_exists('mb_substr')) {
        $comentario = mb_substr($comentario, 0, 1000, 'UTF-8');
    } else {
        $comentario = substr($comentario, 0, 1000);
    }

    try {
        $stmt = $db->prepare(
            "UPDATE avaliacoes
             SET nota = ?, comentario = ?, status = 'ativo', data_atualizacao = CURRENT_TIMESTAMP
             WHERE id_avaliacao = ? AND id_usuario = ?"
        );
        if (!$stmt) {
            return 'Não foi possível preparar a edição da avaliação.';
        }
        $stmt->bind_param('dsii', $nota, $comentario, $idAvaliacao, $idUsuario);
        $stmt->execute();
        $ok = $stmt->affected_rows >= 0;
        $stmt->close();
        return $ok ? null : 'Não foi possível atualizar esta avaliação.';
    } catch (mysqli_sql_exception $e) {
        return 'Não foi possível atualizar esta avaliação.';
    }
}

function excluirAvaliacaoUsuario(mysqli $db, int $idUsuario, int $idAvaliacao): ?string
{
    if ($idAvaliacao <= 0) {
        return 'Avaliação inválida.';
    }

    try {
        $stmt = $db->prepare("DELETE FROM avaliacoes WHERE id_avaliacao = ? AND id_usuario = ? LIMIT 1");
        if (!$stmt) {
            return 'Não foi possível preparar a exclusão da avaliação.';
        }
        $stmt->bind_param('ii', $idAvaliacao, $idUsuario);
        $stmt->execute();
        $apagou = $stmt->affected_rows > 0;
        $stmt->close();
        return $apagou ? null : 'Não foi possível excluir esta avaliação.';
    } catch (mysqli_sql_exception $e) {
        return 'Não foi possível excluir esta avaliação.';
    }
}

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
            $avatarAtualizado = null;
            if (!empty($_FILES['avatar']['name'])) {
                [$avatarNovo, $erroAvatar] = salvarArquivoAvatar($_FILES['avatar']);
                if ($erroAvatar) {
                    $erro = $erroAvatar;
                } else {
                    $avatarAtualizado = $avatarNovo;
                }
            }

            if (!$erro) {
                atualizarPerfil($mysqli, $idUsuario, $dados);
                if ($avatarAtualizado) {
                    atualizarFotoPerfil($mysqli, $idUsuario, $avatarAtualizado);
                    $_SESSION['avatar'] = $avatarAtualizado;
                    $_SESSION['foto'] = $avatarAtualizado;
                }
                $sucesso = 'Perfil atualizado com sucesso!';
            }
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

    if ($action === 'editar_avaliacao') {
        $idAvaliacao = (int)($_POST['id_avaliacao'] ?? 0);
        $nota = (float) str_replace(',', '.', (string)($_POST['nota'] ?? 0));
        $comentario = (string)($_POST['comentario'] ?? '');
        $erroAvaliacao = atualizarAvaliacaoUsuario($mysqli, $idUsuario, $idAvaliacao, $nota, $comentario);

        if ($erroAvaliacao) {
            $erro = $erroAvaliacao;
        } else {
            $sucesso = 'Avaliação atualizada com sucesso!';
        }
    }

    if ($action === 'excluir_avaliacao') {
        $idAvaliacao = (int)($_POST['id_avaliacao'] ?? 0);
        $erroAvaliacao = excluirAvaliacaoUsuario($mysqli, $idUsuario, $idAvaliacao);

        if ($erroAvaliacao) {
            $erro = $erroAvaliacao;
        } else {
            $sucesso = 'Avaliação excluída com sucesso!';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// BLOCO 4 — LEITURA DOS DADOS PARA EXIBIÇÃO
// ═══════════════════════════════════════════════════════════════
$usuario           = buscarUsuario($mysqli, $idUsuario);
$emprestimos       = buscarEmprestimos($mysqli, $idUsuario);
$avaliacoesUsuario = buscarAvaliacoesUsuario($mysqli, $idUsuario);
$reservasUsuario   = buscarReservasPerfil($mysqli, $idUsuario);
$rankingLeitores   = buscarRankingLeitoresPerfil($mysqli, 8);

if (!$usuario) {
    session_destroy();
    header('Location: /Biblioteca-Andromeda/login');
    exit;
}

$h = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
$renderStars = function ($nota): string {
    $valor = max(0, min(5, round(((float)$nota) * 2) / 2));
    $html = '';
    for ($i = 1; $i <= 5; $i++) {
        $fill = max(0, min(1, $valor - ($i - 1))) * 100;
        $html .= '<span class="rating-view-star" style="--fill:' . $fill . '%"><span>★</span><i>★</i></span>';
    }
    return $html;
};
$avatarPerfilSrc = caminhoAvatarPerfil($usuario['avatar'] ?: ($usuario['foto'] ?? ''));

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
    
    <link rel="stylesheet" href="/Biblioteca-Andromeda/assets/css/andro.css?v=avatar-avaliacoes-20260508">
    <link rel="stylesheet" href="/Biblioteca-Andromeda/assets/css/user.css?v=avatar-avaliacoes-20260508">
</head>
<body class="perfil-page">

<div id="webgl"></div>
<div id="grain"></div>
<div id="reticle"></div>
<div id="reticle-dot"></div>

<nav id="nav">
    <div class="nav-logo">
        <span class="nav-logo-text">Andrômeda</span>
    </div>
    <div class="nav-sec">
        <a href="/Biblioteca-Andromeda/catalogo"   class="nav-item"><i class="fa-solid fa-layer-group"></i><span>Catálogo</span></a>
        <a href="/Biblioteca-Andromeda/perfil"     class="nav-item active"><i class="fa-solid fa-user-astronaut"></i><span>Meu Perfil</span></a>
        <a href="#tab-reservas" class="nav-item" id="perfil-nav-reservas"><i class="fa-solid fa-clock-rotate-left"></i><span>Reservas</span></a>
        <?php if (isset($_SESSION['nivel_acesso']) && $_SESSION['nivel_acesso'] === 'admin'): ?>
        <a href="/Biblioteca-Andromeda/adm" class="nav-item">
            <i class="fa-solid fa-user-shield"></i><span>Painel Admin</span>
        </a>
<?php endif; ?>
    </div>
    <div class="nav-foot">
        <a href="/Biblioteca-Andromeda/"  class="nav-item"><i class="fa-solid fa-rocket"></i><span>Início</span></a>
        <a href="/Biblioteca-Andromeda/logout" class="nav-item" data-confirm="Encerrar sua sessão na Biblioteca Andrômeda?" data-confirm-title="Sair da órbita" data-confirm-ok="Sair" data-confirm-cancel="Ficar"><i class="fa-solid fa-right-from-bracket"></i><span>Sair</span></a>
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
    <section class="perfil-header w-100 perfil-header-editorial">
        <div class="perfil-identity-block">
            <div class="perfil-user-avatar <?= $avatarPerfilSrc ? 'has-photo' : '' ?>">
                <?php if ($avatarPerfilSrc): ?>
                    <img src="<?= $h($avatarPerfilSrc) ?>" alt="Foto de perfil de <?= $h($usuario['nome']) ?>">
                <?php else: ?>
                    <i class="fa-solid fa-user-astronaut"></i>
                <?php endif; ?>
            </div>
            <div class="perfil-user-details">
                <span class="perfil-kicker">Meu espaço</span>
                <h2><?= $h($usuario['nome']) ?> <?= $h($usuario['sobrenome']) ?></h2>
                <div class="perfil-user-meta">
                    @<?= $h($usuario['username']) ?> <span><?= $h($usuario['nivel_acesso']) ?></span>
                </div>
            </div>
        </div>
        <div class="perfil-orbit-stats" aria-label="Resumo do perfil">
            <span><strong><?= count($emprestimos) ?></strong> empréstimos</span>
            <span><strong><?= count($reservasUsuario) ?></strong> reservas</span>
            <span><strong><?= count($avaliacoesUsuario) ?></strong> avaliações</span>
        </div>
    </section>

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
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-reservas" type="button">
                <i class="fa-solid fa-clock-rotate-left me-2"></i> Reservas
                <span class="badge bg-secondary ms-2"><?= count($reservasUsuario) ?></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="avaliacoes" data-bs-toggle="tab" data-bs-target="#tab-avaliacoes" type="button">
                <i class="fa-solid fa-star-half-stroke me-2"></i> Minhas Avaliações
                <span class="badge bg-secondary ms-2"><?= count($avaliacoesUsuario) ?></span>
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-ranking" type="button">
                <i class="fa-solid fa-ranking-star me-2"></i> Ranking
            </button>
        </li>
    </ul>

    <div class="tab-content pb-5 w-100">
        <div class="tab-pane fade show active w-100" id="tab-dados">
            <div class="form-card">
                <form action="/Biblioteca-Andromeda/perfil" method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="editar_perfil">

                    <div class="row g-4">
                        <div class="col-12">
                            <div class="perfil-avatar-editor">
                                <div class="perfil-avatar-preview <?= $avatarPerfilSrc ? 'has-photo' : '' ?>" id="perfil-avatar-preview">
                                    <?php if ($avatarPerfilSrc): ?>
                                        <img src="<?= $h($avatarPerfilSrc) ?>" alt="Foto atual">
                                    <?php else: ?>
                                        <i class="fa-solid fa-user-astronaut"></i>
                                    <?php endif; ?>
                                </div>
                                <div class="perfil-avatar-copy">
                                    <label class="form-label">Foto de Perfil</label>
                                    <p>Escolha uma imagem para personalizar sua identidade no catálogo.</p>
                                    <label class="perfil-avatar-button">
                                        <i class="fa-solid fa-camera-retro"></i> Escolher imagem
                                        <input type="file" name="avatar" id="avatar" accept="image/jpeg,image/png,image/webp">
                                    </label>
                                </div>
                            </div>
                        </div>
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
                <form action="/Biblioteca-Andromeda/perfil" method="POST">
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



        <div class="tab-pane fade w-100" id="tab-reservas">
            <?php if (empty($reservasUsuario)): ?>
                <div class="form-card text-center py-5">
                    <div class="empty-state-icon mx-auto mb-4">
                        <i class="fa-solid fa-moon"></i>
                    </div>
                    <p class="text-muted text-uppercase" style="font-family: var(--font-mono); letter-spacing: 1.5px; margin-bottom: 0;">
                        Nenhuma reserva ativa no momento.
                    </p>
                    <a href="/Biblioteca-Andromeda/catalogo" class="btn btn-primary btn-glow mt-4">
                        <i class="fa-solid fa-layer-group me-2"></i> Explorar catálogo
                    </a>
                </div>
            <?php else: ?>
                <div class="perfil-reservas-grid">
                    <?php foreach ($reservasUsuario as $reserva): ?>
                        <article class="perfil-reserva-card">
                            <div class="perfil-reserva-icon"><i class="fa-solid fa-bookmark"></i></div>
                            <div>
                                <span class="perfil-reserva-cat"><?= $h($reserva['categoria_nome']) ?></span>
                                <h3><?= $h($reserva['titulo']) ?></h3>
                                <p><?= $h($reserva['nome_autor']) ?></p>
                                <div class="perfil-reserva-foot">
                                    <span><i class="fa-regular fa-calendar"></i> <?= date('d/m/Y', strtotime($reserva['data_reserva'])) ?></span>
                                    <strong><?= $h($reserva['reserva_status']) ?></strong>
                                </div>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <div class="tab-pane fade w-100" id="tab-avaliacoes">
            <?php if (empty($avaliacoesUsuario)): ?>
                <div class="form-card text-center py-5">
                    <div class="empty-state-icon mx-auto mb-4">
                        <i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <p class="text-muted text-uppercase" style="font-family: var(--font-mono); letter-spacing: 1.5px; margin-bottom: 0;">
                        Você ainda não avaliou nenhuma obra.
                    </p>
                    <a href="/Biblioteca-Andromeda/catalogo" class="btn btn-primary btn-glow mt-4">
                        <i class="fa-solid fa-layer-group me-2"></i> Explorar catálogo
                    </a>
                </div>
            <?php else: ?>
                <div class="perfil-avaliacoes-grid">
                    <?php foreach ($avaliacoesUsuario as $av): ?>
                        <?php
                            $nota = max(0.5, min(5, round(((float) $av['nota']) * 2) / 2));
                            $estrelas = $renderStars($nota);
                            $avaliadorNome = trim((string)($av['usuario_nome'] ?? $usuario['nome'] ?? '') . ' ' . (string)($av['usuario_sobrenome'] ?? $usuario['sobrenome'] ?? ''));
                            if ($avaliadorNome === '') $avaliadorNome = 'Leitor Andrômeda';
                            $avaliadorAvatar = caminhoAvatarPerfil($av['avatar_usuario'] ?? '');
                            if ($avaliadorAvatar === '') $avaliadorAvatar = $avatarPerfilSrc;
                            $avaliadorIniciais = perfilIniciaisUsuario($avaliadorNome);
                        ?>
                        <article class="perfil-avaliacao-card">
                            <div class="perfil-avaliacao-top">
                                <span class="perfil-avaliacao-cat"><?= $h($av['categoria_nome'] ?? 'Acervo') ?></span>
                                <span class="perfil-avaliacao-date">
                                    <?= date('d/m/Y', strtotime($av['data_atualizacao'] ?: $av['data_avaliacao'])) ?>
                                </span>
                            </div>

                            <div class="perfil-avaliacao-leitor">
                                <div class="perfil-avaliacao-avatar <?= $avaliadorAvatar ? 'has-photo' : '' ?>">
                                    <?php if ($avaliadorAvatar): ?>
                                        <img src="<?= $h($avaliadorAvatar) ?>" alt="Foto de <?= $h($avaliadorNome) ?>" loading="lazy" onerror="this.closest('.perfil-avaliacao-avatar').classList.remove('has-photo'); this.remove();">
                                    <?php else: ?>
                                        <span><?= $h($avaliadorIniciais) ?></span>
                                    <?php endif; ?>
                                </div>
                                <div class="perfil-avaliacao-leitor-copy">
                                    <span>Avaliação de</span>
                                    <strong><?= $h($avaliadorNome) ?></strong>
                                </div>
                            </div>

                            <h3><?= $h($av['titulo']) ?></h3>
                            <p class="perfil-avaliacao-author"><?= $h($av['nome_autor']) ?></p>

                            <div class="perfil-avaliacao-stars" aria-label="Nota <?= $nota ?> de 5">
                                <?= $estrelas ?>
                            </div>

                            <?php if (!empty($av['comentario'])): ?>
                                <p class="perfil-avaliacao-comment">
                                    <?= nl2br($h($av['comentario'])) ?>
                                </p>
                            <?php else: ?>
                                <p class="perfil-avaliacao-comment perfil-avaliacao-muted">
                                    Você avaliou esta obra sem deixar comentário.
                                </p>
                            <?php endif; ?>

                            <div class="perfil-avaliacao-actions">
                                <a href="/Biblioteca-Andromeda/catalogo?livro=<?= (int)$av['id_livro'] ?>" class="perfil-avaliacao-link" data-catalog-book-id="<?= (int)$av['id_livro'] ?>">
                                    Ver no catálogo <i class="fa-solid fa-arrow-right-long"></i>
                                </a>
                                <form action="/Biblioteca-Andromeda/perfil#tab-avaliacoes" method="POST" class="perfil-avaliacao-delete" onsubmit="return confirm('Excluir esta avaliação?');">
                                    <input type="hidden" name="action" value="excluir_avaliacao">
                                    <input type="hidden" name="id_avaliacao" value="<?= (int)$av['id_avaliacao'] ?>">
                                    <button type="submit" class="perfil-avaliacao-delete-btn">
                                        <i class="fa-solid fa-trash-can"></i> Excluir
                                    </button>
                                </form>
                            </div>

                            <details class="perfil-avaliacao-editor">
                                <summary><i class="fa-solid fa-pen-nib"></i> Editar avaliação</summary>
                                <form action="/Biblioteca-Andromeda/perfil#tab-avaliacoes" method="POST" class="perfil-avaliacao-form">
                                    <input type="hidden" name="action" value="editar_avaliacao">
                                    <input type="hidden" name="id_avaliacao" value="<?= (int)$av['id_avaliacao'] ?>">
                                    <div class="perfil-avaliacao-fields">
                                        <label class="is-compact perfil-rating-field">
                                            <span>Nota</span>
                                            <div class="rating-half-widget perfil-rating-widget" data-rating-widget data-value="<?= $h(number_format($nota, 1, '.', '')) ?>">
                                                <input type="hidden" name="nota" value="<?= $h(number_format($nota, 1, '.', '')) ?>" required>
                                                <div class="rating-half-stars" role="radiogroup" aria-label="Nota da avaliação">
                                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                                        <button type="button" class="rating-star-unit" data-star="<?= $i ?>" aria-label="Até <?= $i ?> estrela<?= $i > 1 ? 's' : '' ?>"><span class="star-base">★</span><span class="star-fill">★</span></button>
                                                    <?php endfor; ?>
                                                </div>
                                                <output class="rating-half-output"></output>
                                            </div>
                                        </label>
                                        <label class="is-comment">
                                            <span>Comentário</span>
                                            <textarea name="comentario" class="form-control" rows="4" maxlength="1000" placeholder="Atualize sua percepção sobre a obra..."><?= $h($av['comentario'] ?? '') ?></textarea>
                                        </label>
                                    </div>
                                    <div class="perfil-avaliacao-form-actions">
                                        <button type="submit" class="btn btn-primary btn-glow">
                                            <i class="fa-solid fa-floppy-disk"></i> Salvar alterações
                                        </button>
                                    </div>
                                </form>
                            </details>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>


        <div class="tab-pane fade w-100" id="tab-ranking">
            <div class="perfil-ranking-shell">
                <div class="perfil-ranking-head">
                    <span>Constelação de leitores</span>
                    <h2>Ranking do mês</h2>
                </div>
                <?php if (empty($rankingLeitores)): ?>
                    <div class="form-card text-center py-5">
                        <div class="empty-state-icon mx-auto mb-4">
                            <i class="fa-solid fa-ranking-star"></i>
                        </div>
                        <p class="text-muted text-uppercase" style="font-family: var(--font-mono); letter-spacing: 1.5px; margin-bottom: 0;">
                            O ranking aparecerá conforme os leitores movimentarem o acervo.
                        </p>
                    </div>
                <?php else: ?>
                    <div class="perfil-ranking-list">
                        <?php foreach ($rankingLeitores as $pos => $leitor): ?>
                            <?php
                                $avatar = caminhoAvatarPerfil($leitor['avatar_usuario'] ?? '');
                                $nomeRanking = trim(($leitor['nome'] ?? '') . ' ' . ($leitor['sobrenome'] ?? '')) ?: 'Leitor Andrômeda';
                            ?>
                            <article class="perfil-ranking-card <?= $pos === 0 ? 'is-first' : '' ?>">
                                <div class="perfil-ranking-pos">#<?= $pos + 1 ?></div>
                                <div class="perfil-ranking-avatar <?= $avatar ? 'has-photo' : '' ?>">
                                    <?php if ($avatar): ?>
                                        <img src="<?= $h($avatar) ?>" alt="<?= $h($nomeRanking) ?>">
                                    <?php else: ?>
                                        <i class="fa-solid fa-user-astronaut"></i>
                                    <?php endif; ?>
                                </div>
                                <div class="perfil-ranking-info">
                                    <h3><?= $h($nomeRanking) ?></h3>
                                    <p><?= (int)$leitor['pontuacao'] ?> pontos</p>
                                </div>
                                <div class="perfil-ranking-metrics">
                                    <span><strong><?= (int)$leitor['leituras_mes'] ?></strong> leituras</span>
                                    <span><strong><?= (int)$leitor['avaliacoes_mes'] ?></strong> avaliações</span>
                                    <span><strong><?= (int)$leitor['reservas_mes'] ?></strong> reservas</span>
                                </div>
                            </article>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

    </div>
</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
(function () {
    const QUALITY_KEY = 'andromeda_perfil_modo_visual';
    const ECO_STORAGE_KEY = 'andromeda_perfil_eco_mode';
    const MODE_SCHEMA_KEY = 'andromeda_perfil_modes_schema';
    const aliases = {
        cinema: 'cinema', cinematic: 'cinema', cinematica: 'cinema', cinematografico: 'cinema', 'cinematográfico': 'cinema',
        equilibrio: 'equilibrio', equilibrado: 'equilibrio', balanced: 'equilibrio', medio: 'equilibrio',
        eco: 'eco', economico: 'eco', 'econômico': 'eco', low: 'eco'
    };
    const normalizeMode = value => aliases[String(value || '').toLowerCase().trim()] || null;
    if (localStorage.getItem(MODE_SCHEMA_KEY) !== 'v2') {
        const antigo = normalizeMode(localStorage.getItem(QUALITY_KEY));
        if (!antigo || antigo === 'eco' || localStorage.getItem(ECO_STORAGE_KEY) === '1') {
            localStorage.setItem(QUALITY_KEY, 'cinema');
            localStorage.setItem(ECO_STORAGE_KEY, '0');
        }
        localStorage.setItem(MODE_SCHEMA_KEY, 'v2');
    }
    const legacyEco = localStorage.getItem(ECO_STORAGE_KEY) === '1';
    const mode = normalizeMode(localStorage.getItem(QUALITY_KEY)) || (legacyEco ? 'eco' : 'cinema');
    const eco = mode === 'eco';

    localStorage.setItem(QUALITY_KEY, mode);
    localStorage.setItem(ECO_STORAGE_KEY, eco ? '1' : '0');
    document.documentElement.dataset.andromedaMode = mode;
    document.body.classList.remove('perfil-mode-cinema', 'perfil-mode-equilibrio', 'perfil-mode-eco');
    document.body.classList.add('perfil-mode-' + mode);
    document.body.classList.toggle('perfil-eco-mode', eco);
    document.body.classList.toggle('perfil-animations-active', !eco);
    window.ANDROMEDA_PROFILE_MODE = mode;
    window.ANDROMEDA_PROFILE_ECO = eco;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    function ratingLabelPT(value) {
        const nota = Math.max(0, Math.min(5, Math.round((Number(value) || 0) * 2) / 2));
        if (!nota) return 'Selecione sua nota';
        return `${nota.toLocaleString('pt-BR', { minimumFractionDigits: nota % 1 ? 1 : 0, maximumFractionDigits: 1 })} estrela${nota === 1 ? '' : 's'}`;
    }

    function setRatingWidgetValue(widget, value, updateInput = true) {
        if (!widget) return;
        const nota = Math.max(0, Math.min(5, Math.round((Number(value) || 0) * 2) / 2));
        widget.dataset.value = String(nota);
        widget.querySelectorAll('.rating-star-unit').forEach((star, index) => {
            const fill = Math.max(0, Math.min(1, nota - index));
            star.style.setProperty('--fill', `${fill * 100}%`);
            star.classList.toggle('is-active', fill > 0);
        });
        const output = widget.querySelector('.rating-half-output');
        if (output) output.textContent = ratingLabelPT(nota);
        const input = widget.querySelector('input[name="nota"]');
        if (input && updateInput) input.value = nota ? String(nota) : '';
    }

    function valueFromPointer(star, event) {
        const index = Number(star?.dataset.star || 1);
        const rect = star.getBoundingClientRect();
        const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 1;
        return Math.max(0.5, Math.min(5, (index - 1) + (ratio <= 0.5 ? 0.5 : 1)));
    }

    document.querySelectorAll('[data-rating-widget]').forEach(widget => {
        const input = widget.querySelector('input[name="nota"]');
        setRatingWidgetValue(widget, Number(input?.value || widget.dataset.value || 0), false);
        widget.querySelectorAll('.rating-star-unit').forEach(star => {
            star.addEventListener('pointermove', event => setRatingWidgetValue(widget, valueFromPointer(star, event), false));
            star.addEventListener('pointerleave', () => setRatingWidgetValue(widget, Number(input?.value || 0), false));
            star.addEventListener('click', event => setRatingWidgetValue(widget, valueFromPointer(star, event), true));
        });
    });

    const heavyScripts = [
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js',
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js'
    ];

    const boot = eco
        ? Promise.resolve()
        : heavyScripts.reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve());

    boot.catch(() => {
        localStorage.setItem(QUALITY_KEY, 'eco');
        localStorage.setItem(ECO_STORAGE_KEY, '1');
        document.body.classList.remove('perfil-mode-cinema', 'perfil-mode-equilibrio');
        document.body.classList.add('perfil-mode-eco', 'perfil-eco-mode');
        document.body.classList.remove('perfil-animations-active');
        window.ANDROMEDA_PROFILE_MODE = 'eco';
        window.ANDROMEDA_PROFILE_ECO = true;
    }).then(() => loadScript('/Biblioteca-Andromeda/assets/js/user.js?v=avatar-avaliacoes-20260508')).catch(() => {});
})();
</script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        if (!window.bootstrap || !window.location.hash) return;
        const alvo = document.querySelector(`[data-bs-target="${window.location.hash}"]`);
        if (alvo) new bootstrap.Tab(alvo).show();
    });
</script>

</body>
</html>