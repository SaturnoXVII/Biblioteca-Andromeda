<?php
session_start();
require_once __DIR__ . "/../config/conexao.php";
require_once __DIR__ . "/../config/dados.php";
require_once __DIR__ . "/../config/crud.php";
require_once __DIR__ . "/../config/sessao.php";
protegerPagina();
$mysqli->set_charset("utf8mb4");
$reservaMessage = null;
$reservaType = 'success';


// ═══════════════════════════════════════════════════════════════
// AVALIAÇÕES — nota de 1 a 5 + comentário por leitor/livro
// ═══════════════════════════════════════════════════════════════
function salvarAvaliacaoCatalogo(mysqli $db, int $idLivro, int $idUsuario, float $nota, string $comentario): array
{
    if ($idLivro <= 0 || $idUsuario <= 0) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Livro ou usuário inválido para avaliação.'];
    }

    $nota = round($nota * 2) / 2;

    if ($nota < 0.5 || $nota > 5) {
        return ['sucesso' => false, 'tipo' => 'warning', 'mensagem' => 'Escolha uma nota entre 0,5 e 5 estrelas.'];
    }

    $comentario = trim($comentario);
    if (function_exists('mb_substr')) {
        $comentario = mb_substr($comentario, 0, 1000, 'UTF-8');
    } else {
        $comentario = substr($comentario, 0, 1000);
    }

    $sql = "
        INSERT INTO avaliacoes (id_livro, id_usuario, nota, comentario)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            nota = VALUES(nota),
            comentario = VALUES(comentario),
            status = 'ativo',
            data_atualizacao = CURRENT_TIMESTAMP
    ";

    try {
        $stmt = $db->prepare($sql);
    } catch (mysqli_sql_exception $e) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Erro ao preparar avaliação: ' . $e->getMessage()];
    }

    if (!$stmt) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Erro ao preparar avaliação: ' . $db->error];
    }

    $stmt->bind_param('iids', $idLivro, $idUsuario, $nota, $comentario);
    try {
        $ok = $stmt->execute();
        $erro = $stmt->error;
    } catch (mysqli_sql_exception $e) {
        $ok = false;
        $erro = $e->getMessage();
    }
    $stmt->close();

    if (!$ok) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Não foi possível salvar sua avaliação: ' . $erro];
    }

    return ['sucesso' => true, 'tipo' => 'success', 'mensagem' => 'Avaliação salva com sucesso!'];
}

function catalogoCaminhoAvatar(?string $avatar): string
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

function catalogoIniciaisUsuario(?string $nome, ?string $sobrenome = ''): string
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

function carregarAvaliacoesCatalogo(mysqli $db, int $idUsuarioLogado = 0): array
{
    $sql = "
        SELECT
            A.id_avaliacao,
            A.id_livro,
            A.id_usuario,
            A.nota,
            A.comentario,
            A.data_avaliacao,
            A.data_atualizacao,
            U.nome,
            U.sobrenome,
            COALESCE(NULLIF(U.avatar, ''), NULLIF(U.foto, ''), '') AS avatar_usuario
        FROM avaliacoes A
        INNER JOIN usuarios U ON U.id_usuario = A.id_usuario
        WHERE A.status = 'ativo'
        ORDER BY A.data_atualizacao DESC
    ";

    try {
        $res = $db->query($sql);
    } catch (mysqli_sql_exception $e) {
        return [];
    }

    if (!$res) {
        return [];
    }

    $porLivro = [];

    while ($row = $res->fetch_assoc()) {
        $idLivro = (int) $row['id_livro'];
        $nota = (float) $row['nota'];

        if (!isset($porLivro[$idLivro])) {
            $porLivro[$idLivro] = [
                'media' => 0,
                'total' => 0,
                'soma' => 0,
                'minha' => null,
                'comentarios' => []
            ];
        }

        $comentarioData = [
            'id_avaliacao' => (int) $row['id_avaliacao'],
            'id_usuario' => (int) $row['id_usuario'],
            'nota' => $nota,
            'comentario' => $row['comentario'] ?? '',
            'data_avaliacao' => $row['data_avaliacao'],
            'data_atualizacao' => $row['data_atualizacao'],
            'nome' => $row['nome'] ?? '',
            'sobrenome' => $row['sobrenome'] ?? '',
            'avatar_usuario' => catalogoCaminhoAvatar($row['avatar_usuario'] ?? ''),
            'iniciais_usuario' => catalogoIniciaisUsuario($row['nome'] ?? '', $row['sobrenome'] ?? '')
        ];

        $porLivro[$idLivro]['total']++;
        $porLivro[$idLivro]['soma'] += $nota;
        $porLivro[$idLivro]['comentarios'][] = $comentarioData;

        if ($idUsuarioLogado > 0 && (int) $row['id_usuario'] === $idUsuarioLogado) {
            $porLivro[$idLivro]['minha'] = $comentarioData;
        }
    }

    foreach ($porLivro as $idLivro => $dados) {
        $porLivro[$idLivro]['media'] = $dados['total'] > 0 ? round($dados['soma'] / $dados['total'], 1) : 0;
        unset($porLivro[$idLivro]['soma']);
    }

    return $porLivro;
}



function carregarRankingLeitoresAndromeda(mysqli $db, int $limite = 5): array
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
        $ranking = [];
        while ($row = $res->fetch_assoc()) {
            $row['leituras_mes'] = (int)($row['leituras_mes'] ?? 0);
            $row['avaliacoes_mes'] = (int)($row['avaliacoes_mes'] ?? 0);
            $row['reservas_mes'] = (int)($row['reservas_mes'] ?? 0);
            $row['pontuacao'] = (int)($row['pontuacao'] ?? 0);
            $ranking[] = $row;
        }
        $stmt->close();
        return $ranking;
    } catch (mysqli_sql_exception $e) {
        return [];
    }
}


function catalogoEhAjax(): bool
{
    $xrw = strtolower((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''));
    $accept = strtolower((string)($_SERVER['HTTP_ACCEPT'] ?? ''));
    return $xrw === 'xmlhttprequest' || strpos($accept, 'application/json') !== false;
}

function catalogoResponderJson(array $payload): void
{
    if (ob_get_length()) {
        ob_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
    exit;
}

function processarReservaCatalogo(mysqli $db, int $idUsuario, int $idLivro): array
{
    if ($idUsuario <= 0) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Faça login para reservar obras.', 'livro_id' => $idLivro];
    }

    $livro = buscarLivroPorId($db, $idLivro);

    if (!$livro) {
        return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Livro não encontrado.', 'livro_id' => $idLivro];
    }

    if ((int)($livro['quantidade'] ?? 0) > 0) {
        return ['sucesso' => false, 'tipo' => 'warning', 'mensagem' => 'Este livro está disponível para empréstimo.', 'livro_id' => $idLivro];
    }

    if (jaReservado($db, $idLivro, $idUsuario)) {
        return ['sucesso' => false, 'tipo' => 'warning', 'mensagem' => 'Você já está na fila desta obra.', 'livro_id' => $idLivro];
    }

    if (criarReserva($db, $idLivro, $idUsuario)) {
        return ['sucesso' => true, 'tipo' => 'success', 'mensagem' => 'Reserva registrada. Avisaremos quando a obra retornar.', 'livro_id' => $idLivro];
    }

    return ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Não foi possível completar a reserva agora.', 'livro_id' => $idLivro];
}

function catalogoAiLimparTexto(string $texto): string
{
    $texto = trim($texto);
    if ($texto === '') return '';
    $texto = preg_replace('/\s+/', ' ', $texto);
    return function_exists('mb_substr') ? mb_substr($texto, 0, 420, 'UTF-8') : substr($texto, 0, 420);
}

function catalogoAiPareceBuscaCatalogo(string $normalizada): bool
{
    $normalizada = catalogoAiExpandirAbreviacoes($normalizada);
    return preg_match('/\b(livro|livros|obra|obras|autor|autora|categoria|genero|g[eê]nero|catalogo|cat[aá]logo|acervo|prateleira|recom|recomend|indica|indicacao|indica[cç][aã]o|disponivel|dispon[ií]vel|indisponivel|indispon[ií]vel|reserva|reservar|emprest|avali|avaliacao|avalia[cç][aã]o|estrela|coment|sinopse|romance|fantasia|terror|poesia|aventura|misterio|mist[eé]rio|drama|ficcao|fic[cç][aã]o|suspense|conto|cronica|cr[oô]nica)\b/i', $normalizada) === 1;
}

function catalogoAiPareceConversaCotidiana(string $normalizada): bool
{
    $normalizada = catalogoAiExpandirAbreviacoes($normalizada);
    return preg_match('/^(oi|ola|ol[aá]|e ai|e a[ií]|eae|opa|salve|bom dia|boa tarde|boa noite)\b|\b(vc|vcs|td|tdb|blz|beleza|suave|oq|porque|hj|vlw|obg)\b|como foi seu dia|como foi o seu dia|o que fez hoje|oque fez hoje|que fez hoje|como voce esta|como voc[eê] est[aá]|como vc esta|tudo bem|tudo bom|como vai|quem e voce|quem [eé] voc[eê]|quem e vc|sua historia|sua hist[oó]ria|historia de voce|hist[oó]ria de voc[eê]|background|origem|cor favorita|comida favorita|doce favorito|bebida favorita|filme favorito|musica favorita|m[uú]sica favorita|hobbie|hobby|desenho favorito|jogo favorito|animal favorito|idade|aniversario|anivers[aá]rio|onde mora|voce dorme|voc[eê] dorme|voce sonha|voc[eê] sonha|medo|sonho|gosta de mim|me abraca|me abra[cç]a|abra[cç]o|carinho|fofo|fofa|lindo|linda|triste|cansad|ansios|ansios[ao]|mal|desanimad|sozinh|estressad|chatead|raiva|irritad|feliz|animad|empolgad|consegui|boa noticia|boa not[ií]cia|piada|brincadeira|me fa[cç]a rir|obrigad|obg|valeu|vlw|tchau|ate mais|at[eé] mais|orion|lyra|segredo|curiosidade|me surpreenda|surpreenda|surpresa|aleatorio|aleat[oó]rio|t[eé]dio|tedio|conversa comigo|fala comigo|o que voce gosta|oq voce gosta|do que vc gosta|seu favorito|qual sua|qual e sua|qual [eé] sua/i', $normalizada) === 1;
}

function catalogoAiParecePerguntaPersonagem(string $normalizada): bool
{
    $normalizada = catalogoAiExpandirAbreviacoes($normalizada);
    return preg_match('/\b(quem e voce|quem e vc|sua historia|sua origem|background|me conta sobre voce|qual sua historia|cor favorita|comida favorita|doce favorito|bebida favorita|filme favorito|musica favorita|hobby|hobbie|idade|aniversario|onde mora|voce dorme|voce sonha|seu medo|seu sonho|gosta de mim|me abraca|me abraca|abra[cç]o|fala de voce|orion|lyra)\b/i', $normalizada) === 1;
}

function catalogoAiEscolher(array $opcoes): string
{
    if (!$opcoes) return '';
    try {
        return $opcoes[random_int(0, count($opcoes) - 1)];
    } catch (Throwable $e) {
        return $opcoes[array_rand($opcoes)];
    }
}

function catalogoAiEstadoVisual(string $personagem, string $normalizada, bool $temLivros = false): string
{
    $normalizada = catalogoAiExpandirAbreviacoes($normalizada);

    if ($temLivros) return $personagem === 'Lyra' ? 'Ideia Brilhante' : 'Analisando';

    if (preg_match('/triste|cansad|ansios|mal|desanimad|sozinh|exaust|estressad|ruim|pesado|chatead|deprimid|carente|vazio/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Acolhendo' : 'Protegendo';
    }

    if (preg_match('/raiva|irritad|odio|pistola|bravo|brava|nervoso|nervosa|frustrad/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Cuidando' : 'Protegendo';
    }

    if (preg_match('/feliz|animad|empolgad|consegui|boa noticia|deu certo|venci|arrasou|orgulho|amei/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Alegre' : 'Satisfeito';
    }

    if (preg_match('/piada|rir|engrac|humor|zoa|zoeira|meme|surpreenda|surpresa|aleatorio|curiosidade|segredo/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Brincalhona' : 'Sorriso Irônico';
    }

    if (preg_match('/abraco|abraço|carinho|fofo|fofa|gosta de mim|me ama|sdds|saudades/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Acolhendo' : 'Protegendo';
    }

    if (preg_match('/cor favorita|comida|bebida|doce|idade|aniversario|onde mora|sonho|medo|quem e voce|historia|background|origem|hobby|hobbie|o que fez hoje|que fez hoje/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Sonhadora' : 'Atento';
    }

    if (preg_match('/oi|ola|salve|bom dia|boa tarde|boa noite|tudo bem|como vai/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Sorrindo' : 'Neutro';
    }

    if (preg_match('/por que|porque|como|o que|qual|curios|explica|conte/i', $normalizada)) {
        return $personagem === 'Lyra' ? 'Curiosa' : 'Curioso';
    }

    return $personagem === 'Lyra' ? 'Pensativa' : 'Pensativo';
}

function catalogoAiEstadoSprite(string $personagem, string $estado): string
{
    $personagem = $personagem === 'Lyra' ? 'Lyra' : 'Orion';
    $estado = function_exists('iconv') ? (iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $estado) ?: $estado) : $estado;
    $estado = strtolower(trim($estado));

    if ($personagem === 'Lyra') {
        $mapa = [
            'acolhendo' => 'gentle', 'cuidando' => 'gentle', 'sorrindo' => 'smile',
            'alegre' => 'cheerful', 'curiosa' => 'curious', 'pensativa' => 'thinking',
            'sonhadora' => 'dreamy', 'brincalhona' => 'playful', 'ideia brilhante' => 'inspired',
            'surpresa' => 'surprised', 'surpreendida' => 'surprised', 'neutra' => 'neutral',
            'gentle' => 'gentle', 'thinking' => 'thinking', 'smile' => 'smile', 'cheerful' => 'cheerful',
            'curious' => 'curious', 'dreamy' => 'dreamy', 'inspired' => 'inspired', 'playful' => 'playful',
            'surprised' => 'surprised', 'neutral' => 'neutral'
        ];
        return $mapa[$estado] ?? 'neutral';
    }

    $mapa = [
        'protegendo' => 'protective', 'sorrindo' => 'smile', 'sorriso ironico' => 'sly',
        'satisfeito' => 'pleased', 'curioso' => 'curious', 'atento' => 'attentive',
        'analisando' => 'analyzing', 'pensativo' => 'thinking', 'surpreso' => 'surprised',
        'neutro' => 'neutral', 'protective' => 'protective', 'smile' => 'smile', 'sly' => 'sly',
        'pleased' => 'pleased', 'curious' => 'curious', 'attentive' => 'attentive',
        'analyzing' => 'analyzing', 'thinking' => 'thinking', 'surprised' => 'surprised',
        'neutral' => 'neutral'
    ];
    return $mapa[$estado] ?? 'neutral';
}

function catalogoAiComTag(string $personagem, string $estado, string $texto): string
{
    $personagem = $personagem === 'Lyra' ? 'Lyra' : 'Orion';
    $texto = trim($texto);

    if (preg_match('/^\[(Orion|Lyra|Ambos)\s*:/u', $texto)) {
        return $texto;
    }

    return '[' . $personagem . ': ' . $estado . '] ' . $texto;
}

function catalogoAiSequenciaVisual(string $estado): array
{
    $estadoNormalizado = strtolower($estado);
    if (preg_match('/acolh|cuid|proteg|pens|atent|analis|curios/i', $estadoNormalizado)) {
        return ['thinking', 'neutral'];
    }
    if (preg_match('/brincalh|brilhante|alegre|sorr|satisfeit|surpres|sonh/i', $estadoNormalizado)) {
        return ['thinking', 'smile'];
    }
    return ['thinking', 'neutral'];
}

function catalogoAiExpandirAbreviacoes(string $texto): string
{
    $mapa = [
        'vc' => 'voce', 'vcs' => 'voces', 'tb' => 'tambem', 'tbm' => 'tambem',
        'td' => 'tudo', 'tdb' => 'tudo bem', 'blz' => 'beleza', 'bele' => 'beleza',
        'pq' => 'porque', 'q' => 'que', 'oq' => 'o que', 'hj' => 'hoje',
        'agr' => 'agora', 'dps' => 'depois', 'pfv' => 'por favor', 'pff' => 'por favor',
        'vlw' => 'valeu', 'obg' => 'obrigado', 'n' => 'nao', 'nn' => 'nao',
        'mto' => 'muito', 'mt' => 'muito', 'mta' => 'muita', 'muitao' => 'muito', 'recom' => 'recomendacao', 'ind' => 'indicacao', 'cmg' => 'comigo', 'qnd' => 'quando', 'kd' => 'cade', 'sdds' => 'saudades', 'fds' => 'fim de semana', 'msg' => 'mensagem'
    ];

    $texto = preg_replace('/[^a-z0-9áàãâéêíóôõúç\s]/iu', ' ', $texto);
    $partes = preg_split('/\s+/', trim($texto)) ?: [];
    $saida = [];
    foreach ($partes as $parte) {
        $saida[] = $mapa[$parte] ?? $parte;
    }
    return implode(' ', $saida);
}

function catalogoAiResposta(mysqli $db, int $idUsuario, string $personagem, string $mensagem): array
{
    $personagem = $personagem === 'Lyra' ? 'Lyra' : 'Orion';
    $mensagem = catalogoAiLimparTexto($mensagem);
    $mensagemAscii = function_exists('iconv') ? (iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $mensagem) ?: $mensagem) : $mensagem;
    $normalizada = strtolower($mensagemAscii);
    $reservas = $idUsuario > 0 ? listarReservasUsuario($db, $idUsuario) : [];
    $pareceCatalogo = catalogoAiPareceBuscaCatalogo($normalizada);
    $pareceCotidiano = catalogoAiPareceConversaCotidiana($normalizada);

    if ($pareceCotidiano && (!$pareceCatalogo || catalogoAiParecePerguntaPersonagem($normalizada))) {
        $estadoVisual = catalogoAiEstadoVisual($personagem, $normalizada, false);
        return [
            'sucesso' => true,
            'selected_character' => $personagem,
            'animation_sequence' => catalogoAiSequenciaVisual($estadoVisual),
            'dialogue' => catalogoAiComTag($personagem, $estadoVisual, catalogoAiRespostaCotidiana($personagem, $normalizada)),
            'livros' => [],
            'reservas' => $reservas,
            'visual_state' => catalogoAiEstadoSprite($personagem, $estadoVisual),
            'source' => 'database-local-router'
        ];
    }

    $livros = catalogoAiBuscarLivros($db, $mensagem, 5);

    if (preg_match('/minhas reservas|minha reserva|reservei|fila/', $normalizada)) {
        if (!$idUsuario) {
            $dialogo = 'Para ver suas reservas, preciso que voc� esteja logado na Biblioteca Andr�meda.';
        } elseif (!$reservas) {
            $dialogo = $personagem === 'Lyra'
                ? 'Eu consultei seu grim�rio lunar e n�o encontrei reservas aguardando no momento. Seu caminho est� livre para novas descobertas.'
                : 'Verifiquei sua fila no banco de dados: voc� n�o possui reservas aguardando agora.';
        } else {
            $nomes = array_slice(array_map(fn($r) => $r['titulo'] ?? 'obra sem t�tulo', $reservas), 0, 3);
            $dialogo = $personagem === 'Lyra'
                ? 'Encontrei suas reservas brilhando na �rbita lunar: ' . implode(', ', $nomes) . '. Quando uma delas retornar, a biblioteca poder� te avisar.'
                : 'Consultei suas reservas ativas: ' . implode(', ', $nomes) . '. Todas ainda est�o marcadas como aguardando.';
        }

        $estadoVisual = catalogoAiEstadoVisual($personagem, $normalizada, false);
        return [
            'sucesso' => true,
            'selected_character' => $personagem,
            'animation_sequence' => catalogoAiSequenciaVisual($estadoVisual),
            'dialogue' => catalogoAiComTag($personagem, $estadoVisual, $dialogo),
            'livros' => [],
            'reservas' => $reservas,
            'visual_state' => catalogoAiEstadoSprite($personagem, $estadoVisual),
            'source' => 'database-local-router'
        ];
    }

    if ($livros) {
        $principal = $livros[0];
        $status = ($principal['quantidade'] ?? 0) > 0 || ($principal['status'] ?? '') === 'Dispon�vel' ? 'dispon�vel' : 'indispon�vel para empr�stimo direto';
        if ($personagem === 'Lyra') {
            $dialogo = 'Eu consultei o cat�logo e encontrei uma leitura com aura perfeita: ' . ($principal['titulo'] ?? 'obra sem t�tulo') . ', de ' . ($principal['autor_nome'] ?? 'autor n�o informado') . '. Ela pertence � constela��o ' . ($principal['categoria_nome'] ?? 'sem categoria') . ' e est� ' . $status . '. Separei abaixo os portais mais pr�ximos para voc� abrir.';
        } else {
            $dialogo = 'Consulta realizada no banco de dados do cat�logo. Melhor correspond�ncia: ' . ($principal['titulo'] ?? 'obra sem t�tulo') . ', autor: ' . ($principal['autor_nome'] ?? 'n�o informado') . ', categoria: ' . ($principal['categoria_nome'] ?? 'n�o informada') . ', status: ' . ($principal['status'] ?? 'n�o informado') . '. Voc� pode abrir o dossi� diretamente pelos cards abaixo.';
        }
    } elseif (preg_match('/reserva|reservar|indisponivel|disponivel|emprest/', $normalizada)) {
        $dialogo = $personagem === 'Lyra'
            ? 'As reservas funcionam como uma promessa lunar: quando uma obra est� indispon�vel, voc� entra na fila e aguarda o retorno dela ao acervo.'
            : 'Para reservar, abra uma obra indispon�vel no cat�logo e use o bot�o de reserva. Se estiver dispon�vel, o caminho correto � o empr�stimo direto.';
    } elseif (preg_match('/avali|estrela|coment/', $normalizada)) {
        $dialogo = $personagem === 'Lyra'
            ? 'As avalia��es s�o pequenos feiti�os de leitura: escolha as estrelas, escreva seu coment�rio e ajude outros leitores a encontrar bons caminhos.'
            : 'As avalia��es ficam no dossi� do livro. A nota e o coment�rio s�o salvos ligados ao usu�rio e � obra no banco.';
    } else {
        $dialogo = catalogoAiRespostaCotidiana($personagem, $normalizada);
    }

    $estadoVisual = catalogoAiEstadoVisual($personagem, $normalizada, !empty($livros));

    return [
        'sucesso' => true,
        'selected_character' => $personagem,
        'animation_sequence' => catalogoAiSequenciaVisual($estadoVisual),
        'dialogue' => catalogoAiComTag($personagem, $estadoVisual, $dialogo),
        'livros' => $livros,
        'reservas' => $reservas,
        'visual_state' => catalogoAiEstadoSprite($personagem, $estadoVisual),
        'source' => 'database-local-router'
    ];
}

function catalogoAiBuscarLivros(mysqli $db, string $mensagem, int $limite = 5): array
{
    $mensagemOriginal = catalogoAiLimparTexto($mensagem);
    $mensagemAscii = function_exists('iconv') ? (iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $mensagemOriginal) ?: $mensagemOriginal) : $mensagemOriginal;
    $mensagemBusca = strtolower($mensagemAscii);
    $pedidoGenerico = preg_match('/surpreenda|surpresa|indicacao|indica[cç][aã]o|recomende|recomendacao|algo leve|leve para ler|qualquer livro|me indique|sugestao|sugestão/i', $mensagemBusca) === 1;
    $querDisponivel = preg_match('/disponivel|disponiveis|emprest|pegar|levar/', $mensagemBusca) === 1;
    $querIndisponivel = preg_match('/indisponivel|reserv|fila|aguard/', $mensagemBusca) === 1;

    $tokens = preg_split('/[^a-z0-9]+/i', $mensagemBusca) ?: [];
    $stop = array_flip(['quero','queria','livro','livros','obra','obras','para','sobre','com','uma','umas','uns','por','favor','voce','voces','mim','hoje','algo','leve','recomende','recomendacao','indicacao','indique','indicar','surpreenda','surpresa','sugestao','sugestão','cosmica','cosmico','catalogo','biblioteca','andromeda','orion','lyra','gosto','mais','menos','tem','existe','qual','quais']);
    $tokens = array_values(array_filter($tokens, fn($t) => strlen($t) >= 3 && !isset($stop[$t])));
    usort($tokens, fn($a, $b) => strlen($b) <=> strlen($a));
    $termo = implode(' ', array_slice($tokens, 0, 4));
    if ($pedidoGenerico && count($tokens) <= 2) {
        $termo = '';
    }

    $where = [];
    $params = [];
    $types = '';

    if ($termo !== '') {
        $like = '%' . $termo . '%';
        $where[] = '(L.titulo LIKE ? OR L.sinopse LIKE ? OR A.nome LIKE ? OR C.nome LIKE ? OR E.nome LIKE ?)';
        $types .= 'sssss';
        array_push($params, $like, $like, $like, $like, $like);
    }

    if ($querDisponivel && !$querIndisponivel) {
        $where[] = "(L.quantidade > 0 OR L.status = 'Disponível')";
    }

    if ($querIndisponivel) {
        $where[] = "(L.quantidade <= 0 OR L.status = 'Indisponível')";
    }

    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $sql = "
        SELECT
            L.id_livro,
            L.titulo,
            L.ano_publicacao,
            L.numero_paginas,
            L.origem_idioma,
            L.status,
            L.quantidade,
            L.capa,
            L.sinopse,
            A.nome AS autor_nome,
            C.nome AS categoria_nome,
            E.nome AS editora_nome,
            COALESCE(ROUND(AVG(AV.nota), 1), 0) AS media_avaliacoes,
            COUNT(AV.id_avaliacao) AS total_avaliacoes
        FROM Livros L
        LEFT JOIN autores A ON L.id_autor = A.id_autor
        LEFT JOIN Categorias C ON L.id_categoria = C.id_categoria
        LEFT JOIN editoras E ON L.id_editora = E.id_editora
        LEFT JOIN avaliacoes AV ON AV.id_livro = L.id_livro AND AV.status = 'ativo'
        $whereSql
        GROUP BY L.id_livro, L.titulo, L.ano_publicacao, L.numero_paginas, L.origem_idioma, L.status, L.quantidade, L.capa, L.sinopse, A.nome, C.nome, E.nome
        ORDER BY
            CASE WHEN L.quantidade > 0 OR L.status = 'Disponível' THEN 0 ELSE 1 END,
            total_avaliacoes DESC,
            media_avaliacoes DESC,
            L.titulo ASC
        LIMIT ?
    ";

    $types .= 'i';
    $params[] = $limite;

    try {
        $stmt = $db->prepare($sql);
        if (!$stmt) return [];
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $res = $stmt->get_result();
        $livros = [];
        while ($row = $res->fetch_assoc()) {
            $row['id_livro'] = (int)($row['id_livro'] ?? 0);
            $row['quantidade'] = (int)($row['quantidade'] ?? 0);
            $row['media_avaliacoes'] = (float)($row['media_avaliacoes'] ?? 0);
            $row['total_avaliacoes'] = (int)($row['total_avaliacoes'] ?? 0);
            $livros[] = $row;
        }
        $stmt->close();
        return $livros;
    } catch (Throwable $e) {
        return [];
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'ai_chat_query') {
    $resultadoIA = catalogoAiResposta(
        $mysqli,
        (int)($_SESSION['id_usuario'] ?? 0),
        (string)($_POST['personagem'] ?? 'Orion'),
        (string)($_POST['mensagem'] ?? '')
    );
    catalogoResponderJson($resultadoIA);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'reservar_livro') {
    $idLivro = (int) ($_POST['livro_id'] ?? 0);
    $resultadoReserva = processarReservaCatalogo($mysqli, (int)($_SESSION['id_usuario'] ?? 0), $idLivro);

    if (catalogoEhAjax()) {
        $resultadoReserva['reservas'] = !empty($_SESSION['id_usuario'])
            ? listarReservasUsuario($mysqli, (int) $_SESSION['id_usuario'])
            : [];
        catalogoResponderJson($resultadoReserva);
    }

    $reservaMessage = $resultadoReserva['mensagem'];
    $reservaType = $resultadoReserva['tipo'];
}


// Processa avaliação/comentário do leitor
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'avaliar_livro') {
    if (empty($_SESSION['id_usuario'])) {
        $resultadoAvaliacao = ['sucesso' => false, 'tipo' => 'danger', 'mensagem' => 'Faça login para avaliar uma obra.'];
        $idLivroAvaliado = (int) ($_POST['id_livro'] ?? 0);
    } else {
        $idLivroAvaliado = (int) ($_POST['id_livro'] ?? 0);
        $notaAvaliacao = (float) str_replace(',', '.', (string)($_POST['nota'] ?? 0));
        $comentarioAvaliacao = (string) ($_POST['comentario'] ?? '');

        $resultadoAvaliacao = salvarAvaliacaoCatalogo(
            $mysqli,
            $idLivroAvaliado,
            (int) $_SESSION['id_usuario'],
            $notaAvaliacao,
            $comentarioAvaliacao
        );
    }

    if (catalogoEhAjax()) {
        $avaliacoesAtualizadas = carregarAvaliacoesCatalogo($mysqli, (int) ($_SESSION['id_usuario'] ?? 0));
        catalogoResponderJson([
            'sucesso' => (bool)($resultadoAvaliacao['sucesso'] ?? false),
            'tipo' => $resultadoAvaliacao['tipo'] ?? 'danger',
            'mensagem' => $resultadoAvaliacao['mensagem'] ?? 'Não foi possível processar sua avaliação.',
            'id_livro' => $idLivroAvaliado,
            'avaliacoes_livro' => $avaliacoesAtualizadas[$idLivroAvaliado] ?? [
                'media' => 0,
                'total' => 0,
                'minha' => null,
                'comentarios' => []
            ]
        ]);
    }

    $reservaMessage = $resultadoAvaliacao['mensagem'];
    $reservaType = $resultadoAvaliacao['tipo'];
}

// Carrega reservas do usuário se estiver logado
$minhasReservas = [];
if (!empty($_SESSION['id_usuario'])) {
    $minhasReservas = listarReservasUsuario($mysqli, (int) $_SESSION['id_usuario']);
}
$minhasReservasJson = json_encode($minhasReservas, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '[]';

$repo = new \App\Repository\LivroRepository($mysqli);
try {
    $livros = $repo->listarTodos();
} catch (Exception $e) {
    die("Erro: " . htmlspecialchars($e->getMessage()));
}

$livros    = $livros ?? [];
$avaliacoesPorLivro = carregarAvaliacoesCatalogo($mysqli, (int) ($_SESSION['id_usuario'] ?? 0));

// Injeta resumo de avaliações dentro de cada livro para o JS do catálogo também conseguir usar.
foreach ($livros as &$livroItem) {
    $idLivroItem = (int) ($livroItem['id_livro'] ?? $livroItem['id'] ?? 0);
    $dadosAvaliacao = $avaliacoesPorLivro[$idLivroItem] ?? [
        'media' => 0,
        'total' => 0,
        'minha' => null,
        'comentarios' => []
    ];

    $livroItem['media_avaliacoes'] = $dadosAvaliacao['media'];
    $livroItem['total_avaliacoes'] = $dadosAvaliacao['total'];
    $livroItem['minha_avaliacao'] = $dadosAvaliacao['minha'];
    $livroItem['comentarios_avaliacoes'] = $dadosAvaliacao['comentarios'];
}
unset($livroItem);

$livrosJson = json_encode($livros, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '[]';
$avaliacoesJson = json_encode($avaliacoesPorLivro, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '{}';
$totalLivros = count($livros);
$categorias  = array_values(array_filter(array_unique(array_column($livros, 'categoria_nome'))));
$totalCats   = count($categorias);
$rankingLeitores = carregarRankingLeitoresAndromeda($mysqli, 5);
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda · ORBITAL LITERÁRIO</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/Biblioteca-Andromeda/assets/css/andro.css?v=orion-lyra-design-20260509-fab-context">
</head>

<body>

    <div id="intro-cinematic" aria-hidden="true">
        <div class="intro-cosmos" aria-hidden="true">
            <span class="intro-star intro-star-a"></span>
            <span class="intro-star intro-star-b"></span>
            <span class="intro-star intro-star-c"></span>
            <span class="intro-orbit intro-orbit-a"></span>
            <span class="intro-orbit intro-orbit-b"></span>
            <span class="intro-orbit intro-orbit-c"></span>
            <span class="intro-core"></span>
        </div>

        <div class="intro-mask">
            <div class="intro-copy">
                <span class="intro-kicker">Inicializando Atlas</span>
                <div class="intro-brand-orbit">
                    <h1 class="intro-brand" id="i-brand">ANDRÔMEDA</h1>
                    <span class="intro-letter-blackhole" aria-hidden="true">
                        <span class="intro-letter-star intro-letter-star-a"></span>
                        <span class="intro-letter-star intro-letter-star-b"></span>
                    </span>
                </div>
                <p class="intro-tagline" id="i-tag">Catálogo Cósmico</p>
            </div>
            <div class="intro-progress" aria-hidden="true">
                <span class="intro-progress-fill"></span>
            </div>
        </div>
    </div>

    <div id="grain"></div>
    <div id="canvas-dim"></div>
    <div id="webgl"></div>
    <?php if ($reservaMessage): ?>
        <div class="andromeda-page-toast andromeda-page-toast-<?= htmlspecialchars($reservaType, ENT_QUOTES, 'UTF-8') ?>" role="alert">
            <i class="fa-solid <?= $reservaType === 'success' ? 'fa-circle-check' : ($reservaType === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark') ?>"></i>
            <span><?= htmlspecialchars($reservaMessage, ENT_QUOTES, 'UTF-8') ?></span>
        </div>
    <?php endif; ?>

    <div id="reticle">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="14" class="ret-ring" stroke-dasharray="88" stroke-dashoffset="0">
                <animateTransform attributeName="transform" type="rotate" values="0 18 18;360 18 18" dur="18s" repeatCount="indefinite" />
            </circle>
            <line x1="18" y1="4" x2="18" y2="10" class="ret-cross" />
            <line x1="18" y1="26" x2="18" y2="32" class="ret-cross" />
            <line x1="4" y1="18" x2="10" y2="18" class="ret-cross" />
            <line x1="26" y1="18" x2="32" y2="18" class="ret-cross" />
            <circle cx="18" cy="18" r="1.5" fill="rgba(42, 162, 246, 0.6)" />
        </svg>
    </div>
    <div id="reticle-dot"></div>

    <div id="tip"><span class="tip-cat" id="tip-cat"></span><span class="tip-title" id="tip-title"></span><span class="tip-author" id="tip-author"></span></div>
    <div id="cat-label"></div>
    <div id="fly-label"></div>

    <nav id="nav">
        <div class="nav-logo">
            <span class="nav-logo-text">Andrômeda</span>
        </div>
        <div class="nav-sec">
            <a href="/Biblioteca-Andromeda/catalogo" class="nav-item active"><i class="fa-solid fa-layer-group"></i><span>Catálogo</span></a>
            <a href="/Biblioteca-Andromeda/perfil" class="nav-item"><i class="fa-solid fa-user-astronaut"></i><span>Meu Perfil</span></a>
            <a href="#" class="nav-item" id="nav-reservas" onclick="event.preventDefault(); abrirPainelReservas();"><i class="fa-solid fa-clock-rotate-left"></i><span>Reservas</span></a>
            <a href="#ranking-leitores" class="nav-item" onclick="event.preventDefault(); irParaRankingLeitores();"><i class="fa-solid fa-ranking-star"></i><span>Ranking</span></a>
            <a href="#andromeda-ai" class="nav-item" id="nav-andromeda-ai"><i class="fa-solid fa-wand-magic-sparkles"></i><span>Orion &amp; Lyra</span></a>
            <a href="/Biblioteca-Andromeda/pages/lore.php" class="nav-item"><i class="fa-solid fa-book-open"></i><span>Nossa História</span></a>
            <?php if (isset($_SESSION['nivel_acesso']) && $_SESSION['nivel_acesso'] === 'admin'): ?>
                <a href="/Biblioteca-Andromeda/adm" class="nav-item">
                    <i class="fa-solid fa-user-shield"></i><span>Painel Admin</span>
                </a>
            <?php endif; ?>
        </div>
        <div class="nav-foot">
            <a href="/Biblioteca-Andromeda/" class="nav-item"><i class="fa-solid fa-rocket"></i><span>Início</span></a>
            <a href="/Biblioteca-Andromeda/logout" class="nav-item" data-confirm="Encerrar sua sessão na Biblioteca Andrômeda?" data-confirm-title="Sair da órbita" data-confirm-ok="Sair" data-confirm-cancel="Ficar"><i class="fa-solid fa-right-from-bracket"></i><span>Sair</span></a>
        </div>
    </nav>

    <div id="hud">
        <div class="hud-search">
            <i class="fa-solid fa-search" style="color: var(--text-dim)"></i>
            <input id="q" type="text" placeholder="Buscar no cosmos..." autocomplete="off">
            <span class="search-count" id="search-count"></span>
        </div>

        <button class="hud-btn" id="btn-systems">
            <i class="fa-solid fa-bars-staggered"></i> <span id="sys-active-label">Todas Constelações</span>
        </button>

        <div class="view-tog">
            <button id="btn-gal" class="on" title="Visão Galáctica 3D"><i class="fa-solid fa-vr-cardboard"></i> 3D</button>
            <button id="btn-ed" title="Catálogo Editorial"><i class="fa-solid fa-border-all"></i> Catálogo</button>
            <span style="width: 1px; background: var(--border-hairline); margin: 0 4px;"></span>
            <button id="btn-eco" title="Desliga 3D para leitura fluida"><i class="fa-solid fa-leaf"></i> Modo Eco</button>
        </div>
    </div>

    <div id="systems-menu">
        <div class="sys-item on" data-c="all">
            <div class="sys-dot" style="color: var(--am3)"></div>Todas Constelações
        </div>
    </div>

    <div id="hud-bot">
        <span><i class="fa-solid fa-book" style="color:var(--am)"></i> <strong><?= $totalLivros ?></strong> obras</span>
        <span><i class="fa-solid fa-layer-group" style="color:var(--am)"></i> <strong><?= $totalCats ?></strong> sistemas</span>
        <span id="scroll-hint"><i class="fa-solid fa-computer-mouse"></i> Scroll &middot; Zoom &middot; Arraste para rotacionar</span>
    </div>

    <div id="depth" aria-label="Controle de zoom da galáxia">
        <span class="depth-lbl">Orbital</span>
        <div class="depth-readout" id="depth-readout">24%</div>
        <div class="depth-track" id="depth-track" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="24" tabindex="0">
            <div class="depth-fill" id="depth-fill"></div>
            <div class="depth-dot" id="ddot"></div>
        </div>
        <button class="depth-reset" id="depth-reset" type="button" title="Resetar órbita e zoom">
            <i class="fa-solid fa-rotate-left"></i>
        </button>
        <span class="depth-lbl">Galáxia</span>
    </div>

    <!-- BOOK PANEL com sinopse -->
    <div id="book-panel">
        <div class="bp-art">
            <canvas id="bp-art-canvas"></canvas>
            <div class="bp-art-overlay"></div>
            <button class="bp-close" id="bp-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="bp-body">
            <div class="bp-header">
                <span class="bp-cat" id="bp-cat">—</span>
                <span class="sbadge s-unk" id="bp-status">—</span>
            </div>
            <h2 class="bp-title" id="bp-title">—</h2>
            <p class="bp-author" id="bp-author">—</p>
            <div class="bp-meta">
                <div class="bp-field"><label>Ano</label><span class="val" id="bp-year">—</span></div>
                <div class="bp-field"><label>Editora</label><span class="val" id="bp-pub">—</span></div>
            </div>

            <!-- AVALIAÇÕES NO PAINEL LATERAL -->
            <div class="bp-rating-mini" id="bp-rating-mini">
                <div class="bp-rating-stars" id="bp-rating-stars">☆☆☆☆☆</div>
                <span id="bp-rating-copy">Sem avaliações ainda</span>
            </div>

            <!-- SINOPSE NO PAINEL LATERAL -->
            <div class="bp-synopsis-wrap" id="bp-synopsis-wrap" style="display:none;">
                <p class="bp-synopsis-label"><i class="fa-solid fa-book-open"></i> Sinopse</p>
                <p class="bp-synopsis-text" id="bp-synopsis-text">—</p>
                <button class="bp-synopsis-toggle" id="bp-synopsis-toggle">
                    <i class="fa-solid fa-chevron-down"></i> Ler mais
                </button>
            </div>

            <div class="bp-actions">
                <button class="btn-prim" id="bp-reserve">Abrir Arquivo</button>
                <button class="btn-sec" id="bp-expand"><i class="fa-solid fa-expand"></i></button>
            </div>
        </div>
    </div>

    <!-- MODAL com sinopse -->
    <div id="modal-overlay">
        <div id="modal-drawer">
            <div class="md-cover">
                <canvas id="md-art-canvas"></canvas>
                <div class="md-cover-overlay"></div>
                <span class="md-cat-badge" id="md-cat-badge">—</span>
                <button class="md-close" id="modal-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="md-scroll">
                <div class="md-title-block">
                    <div class="md-status-row"><span class="sbadge s-unk" id="md-status">—</span></div>
                    <h2 class="md-title" id="md-title">—</h2>
                    <p class="md-author" id="md-author">—</p>
                </div>

                <!-- SINOPSE NO MODAL -->
                <div class="md-synopsis-section">
                    <p class="md-synopsis-label">
                        <i class="fa-solid fa-feather-pointed"></i> Sinopse
                    </p>
                    <p class="md-synopsis-text" id="md-synopsis-text">—</p>
                </div>

                <div class="md-grid">
                    <div class="md-field"><label>Ano</label><span class="v" id="md-year">—</span></div>
                    <div class="md-field"><label>Editora</label><span class="v" id="md-pub">—</span></div>
                    <div class="md-field"><label>Categoria</label><span class="v" id="md-catv">—</span></div>
                    <div class="md-field"><label>Disponibilidade</label><span class="v" id="md-sv">—</span></div>
                </div>

                <!-- AVALIAÇÕES E COMENTÁRIOS -->
                <section class="md-rating-section" id="md-rating-section">
                    <div class="md-rating-head">
                        <div>
                            <p class="md-rating-kicker"><i class="fa-solid fa-star-half-stroke"></i> Experiência dos leitores</p>
                            <h3>Avaliações e comentários</h3>
                        </div>
                        <div class="md-rating-score">
                            <span class="md-rating-stars" id="md-rating-stars">☆☆☆☆☆</span>
                            <strong id="md-rating-media">0,0</strong>
                            <small id="md-rating-total">Nenhuma avaliação</small>
                        </div>
                    </div>

                    <form action="/Biblioteca-Andromeda/catalogo" method="POST" class="md-rating-form" id="avaliacao-form">
                        <input type="hidden" name="action" value="avaliar_livro">
                        <input type="hidden" name="id_livro" id="avaliacao-id-livro" value="">

                        <div class="md-rating-current" id="avaliacao-current-livro">
                            Selecione uma obra no catálogo para avaliar.
                        </div>

                        <div class="rating-half-widget md-stars-input" data-rating-widget data-value="0" aria-label="Escolha sua nota">
                            <input type="hidden" name="nota" id="avaliacao-nota" value="" required>
                            <div class="rating-half-stars" role="radiogroup" aria-label="Nota da avaliação">
                                <button type="button" class="rating-star-unit" data-star="1" aria-label="Até 1 estrela"><span class="star-base">★</span><span class="star-fill">★</span></button>
                                <button type="button" class="rating-star-unit" data-star="2" aria-label="Até 2 estrelas"><span class="star-base">★</span><span class="star-fill">★</span></button>
                                <button type="button" class="rating-star-unit" data-star="3" aria-label="Até 3 estrelas"><span class="star-base">★</span><span class="star-fill">★</span></button>
                                <button type="button" class="rating-star-unit" data-star="4" aria-label="Até 4 estrelas"><span class="star-base">★</span><span class="star-fill">★</span></button>
                                <button type="button" class="rating-star-unit" data-star="5" aria-label="Até 5 estrelas"><span class="star-base">★</span><span class="star-fill">★</span></button>
                            </div>
                            <output class="rating-half-output">Selecione sua nota</output>
                        </div>

                        <textarea name="comentario" id="avaliacao-comentario" maxlength="1000" rows="4" placeholder="Conte o que você achou desta leitura..."></textarea>

                        <button type="submit" class="btn-prim md-rating-submit" id="avaliacao-submit">
                            <i class="fa-solid fa-paper-plane"></i> Enviar avaliação
                        </button>
                    </form>

                    <div class="md-comments-list" id="avaliacoes-comments">
                        <p class="md-comments-empty">Os comentários aparecerão aqui.</p>
                    </div>
                </section>
                <p class="md-related-title">Obras Relacionadas</p>
                <div class="md-related-list" id="md-related"></div>
            </div>
            <div class="md-actions">
                <button class="btn-prim" id="md-reserve">Reservar Obra</button>
                <button class="btn-sec" id="md-wishlist" title="Salvar"><i class="fa-regular fa-bookmark"></i></button>
            </div>
        </div>
    </div>

    <!-- EDITORIAL VIEW com sinopse no hero -->
    <div id="editorial-view" tabindex="-1">
        <div class="ed-header ed-header-refined">
            <div class="ed-header-copy">
                <span class="ed-kicker">Atlas Andrômeda</span>
                <h1 class="ed-header-title">Entre nas <em>Constelações</em></h1>
                <p class="ed-header-desc">
                    Entre névoas, arquivos e órbitas silenciosas, cada obra repousa como um astro à espera de ser descoberto.
                </p>
            </div>
            <div class="ed-header-metrics" aria-label="Resumo do acervo">
                <span><strong><?= $totalLivros ?></strong> obras</span>
                <span><strong><?= $totalCats ?></strong> constelações</span>
                <span><strong id="ed-avail">—</strong> disponíveis</span>
            </div>
        </div>

        <section class="ed-carousel-section ed-highlight-shell" id="ed-carousel-section" aria-label="Destaque da semana">
            <div class="ed-carousel-head">
                <div>
                    <span class="ed-carousel-kicker">Seleção da Órbita</span>
                    <h2 class="ed-carousel-title">A Luz da Semana</h2>
                </div>
                <div class="ed-carousel-controls">
                    <button class="ed-carousel-btn" id="ed-car-prev" type="button" aria-label="Destaque anterior"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="ed-carousel-btn" id="ed-car-next" type="button" aria-label="Próximo destaque"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </div>
            <div class="ed-carousel-shell">
                <div class="ed-carousel-track" id="ed-carousel-track"></div>
            </div>
            <div class="ed-carousel-dots" id="ed-carousel-dots"></div>
        </section>

        <div class="ed-catalog-divider" aria-hidden="true"></div>
        <div id="ed-sections"></div>


        <section class="ranking-leitores-shell" id="ranking-leitores" aria-label="Ranking de leitores do mês">
            <div class="ranking-leitores-head">
                <span class="ranking-kicker">Firmamento dos leitores</span>
                <h2>Leitores em Ascensão</h2>
            </div>
            <?php if (empty($rankingLeitores)): ?>
                <div class="ranking-empty">
                    <i class="fa-solid fa-star-half-stroke"></i>
                    <span>As primeiras estrelas surgirão quando novas leituras deixarem rastro.</span>
                </div>
            <?php else: ?>
                <div class="ranking-leitores-grid">
                    <?php foreach ($rankingLeitores as $pos => $leitor): ?>
                        <?php
                            $avatarSrc = catalogoCaminhoAvatar($leitor['avatar_usuario'] ?? '');
                            $iniciaisRanking = catalogoIniciaisUsuario($leitor['nome'] ?? '', $leitor['sobrenome'] ?? '');
                            $nomeRanking = trim(($leitor['nome'] ?? '') . ' ' . ($leitor['sobrenome'] ?? '')) ?: 'Leitor Andrômeda';
                        ?>
                        <article class="ranking-leitor-card <?= $pos === 0 ? 'is-first' : '' ?>">
                            <div class="ranking-position">#<?= $pos + 1 ?></div>
                            <div class="ranking-avatar <?= $avatarSrc ? 'has-photo' : '' ?>">
                                <?php if ($avatarSrc): ?>
                                    <img src="<?= htmlspecialchars($avatarSrc, ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($nomeRanking, ENT_QUOTES, 'UTF-8') ?>" loading="lazy" onerror="this.closest('.ranking-avatar').classList.remove('has-photo'); this.remove();">
                                <?php else: ?>
                                    <span><?= htmlspecialchars($iniciaisRanking, ENT_QUOTES, 'UTF-8') ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="ranking-info">
                                <h3><?= htmlspecialchars($nomeRanking, ENT_QUOTES, 'UTF-8') ?></h3>
                                <p><?= (int)$leitor['pontuacao'] ?> pontos</p>
                            </div>
                            <div class="ranking-stats">
                                <span><strong><?= (int)$leitor['leituras_mes'] ?></strong> leituras</span>
                                <span><strong><?= (int)$leitor['avaliacoes_mes'] ?></strong> avaliações</span>
                                <span><strong><?= (int)$leitor['reservas_mes'] ?></strong> reservas</span>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </section>

        <footer class="ed-footer" aria-label="Créditos do projeto">
            <div class="ed-footer-line"></div>
            <p>Desenvolvido por <strong>Gabriel Maia</strong> e <strong>Marianne Feliciano</strong></p>
        </footer>

    </div>

    <form id="reserva-form" method="post" style="display:none;">
        <input type="hidden" name="action" value="reservar_livro">
        <input type="hidden" name="livro_id" id="reserva-livro-id" value="">
    </form>

    <div id="reservas-panel" class="reservas-panel" aria-hidden="true">
        <div class="reservas-dialog" role="dialog" aria-modal="true" aria-labelledby="reservas-title">
            <div class="reservas-dialog-head">
                <div>
                    <span class="reservas-kicker">Fila pessoal</span>
                    <h2 id="reservas-title">Minhas Reservas</h2>
                </div>
                <button type="button" class="reservas-close" onclick="fecharPainelReservas()" aria-label="Fechar reservas"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="reservas-lista-container" class="reservas-lista-container"></div>
        </div>
    </div>



    <button type="button" id="ai-chat-fab" class="ai-chat-fab" aria-label="Abrir chat com Orion e Lyra">
        <span class="ai-fab-portraits" aria-hidden="true">
            <img src="/Biblioteca-Andromeda/assets/mascotes/orion_smile.png" alt="">
            <img src="/Biblioteca-Andromeda/assets/mascotes/lyra_smile.png" alt="">
        </span>
        <span class="ai-fab-copy">
            <strong>Orion &amp; Lyra</strong>
            <small>Guardi�es do acervo</small>
        </span>
        <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
    </button>

    <section id="andromeda-ai" class="ai-chat-overlay" aria-hidden="true">
        <div class="ai-chat-shell" role="dialog" aria-modal="true" aria-labelledby="ai-chat-title">
            <div class="ai-chat-ornament ai-ornament-tl"></div>
            <div class="ai-chat-ornament ai-ornament-tr"></div>
            <div class="ai-chat-ornament ai-ornament-bl"></div>
            <div class="ai-chat-ornament ai-ornament-br"></div>

            <button type="button" class="ai-chat-close" id="ai-chat-close" aria-label="Fechar chat de Orion e Lyra">
                <i class="fa-solid fa-xmark"></i>
            </button>

            <aside class="ai-character-stage" aria-label="Painel do personagem">
                <div class="ai-character-image-wrap">
                    <img id="ai-character-image" class="ai-character-image" src="/Biblioteca-Andromeda/assets/mascotes/orion_neutral.png" alt="Orion, mascote da Biblioteca Andrômeda">
                </div>

                <div class="ai-character-card">
                    <div>
                        <h2 id="ai-character-name">Orion</h2>
                        <p id="ai-character-title">Guia das Páginas e Estrelas</p>
                    </div>
                    <button type="button" class="ai-audio-btn" aria-label="Voz do personagem"><i class="fa-solid fa-volume-high"></i></button>
                    <blockquote id="ai-character-quote">“Cada livro é uma constelação. Vamos explorar a sua?”</blockquote>
                </div>
            </aside>

            <section class="ai-chat-board" aria-label="Chat cósmico">
                <header class="ai-chat-topbar">
                    <div class="ai-chat-titlebox">
                        <span>Orion &amp; Lyra</span>
                        <h2 id="ai-chat-title">Guardiões da Biblioteca Andrômeda</h2>
                    </div>

                    <button type="button" class="ai-top-icon" aria-label="Painel mágico">
                        <i class="fa-solid fa-wand-sparkles"></i>
                    </button>
                </header>

                <div class="ai-character-switch" role="tablist" aria-label="Escolha entre Orion e Lyra">
                    <button type="button" class="ai-switch-btn is-active" data-ai-character="Orion" role="tab" aria-selected="true">
                        <i class="fa-solid fa-star-of-life"></i> Orion
                    </button>
                    <button type="button" class="ai-switch-btn" data-ai-character="Lyra" role="tab" aria-selected="false">
                        <i class="fa-solid fa-moon"></i> Lyra
                    </button>
                </div>

                <div class="ai-chat-history" id="ai-chat-history">
                    <article class="ai-message-row ai-bot-row">
                        <img class="ai-message-avatar" src="/Biblioteca-Andromeda/assets/mascotes/orion_smile.png" alt="Orion">
                        <div class="ai-message ai-bot-message">
                            <div class="ai-message-meta"><strong>Orion</strong><i class="fa-solid fa-star"></i><span>Agora</span></div>
                            <p>Bem-vindo ao Cofre Cósmico. Eu e Lyra podemos te ajudar a explorar livros, reservas, avaliações e recomendações do catálogo.</p>
                        </div>
                    </article>
                </div>

                <form class="ai-chat-composer" id="ai-chat-form">
                    <div class="ai-input-shell">
                        <input type="text" id="ai-user-input" placeholder="Converse com Orion &amp; Lyra..." autocomplete="off">
                        <i class="fa-regular fa-star"></i>
                    </div>
                    <button type="submit" id="ai-send-button" class="ai-send-button" aria-label="Enviar mensagem">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </form>

                <div class="ai-quick-actions" aria-label="Sugestões rápidas">
                    <button type="button" data-ai-prompt="Me conte sobre Orion e Lyra."><i class="fa-solid fa-user-astronaut"></i> Conhecer os dois</button>
                    <button type="button" data-ai-prompt="Quero algo leve para ler hoje."><i class="fa-solid fa-moon"></i> Algo leve</button>
                    <button type="button" data-ai-prompt="Me conte uma fofoca da Biblioteca Andrômeda."><i class="fa-solid fa-wand-magic-sparkles"></i> Fofoca cósmica</button>
                    <button type="button" data-ai-prompt="Me recomende um livro pelo gosto de vocês."><i class="fa-solid fa-book-open-reader"></i> Gosto deles</button>
                </div>
            </section>
        </div>
    </section>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        const LIVROS = <?php echo $livrosJson; ?>;
        window.LIVROS = LIVROS;
        const MINHAS_RESERVAS = <?php echo $minhasReservasJson; ?>;
        window.MINHAS_RESERVAS = MINHAS_RESERVAS;
        const AVALIACOES_LIVROS = <?php echo $avaliacoesJson; ?>;
        window.AVALIACOES_LIVROS = AVALIACOES_LIVROS;
        const USUARIO_LOGADO_ID = <?php echo (int) ($_SESSION['id_usuario'] ?? 0); ?>;

        // ═══════════════════════════════════════════════════════
        // AVALIAÇÕES — renderização segura sem depender do andro.js
        // ═══════════════════════════════════════════════════════
        let avUltimoLivroRenderizado = null;
        let avFormularioEmUso = false;

        function avEscapeHTML(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }


        function avAvatarUrl(value) {
            let avatar = String(value ?? '').trim().replace(/\\/g, '/');
            if (!avatar) return '';
            if (/^(https?:)?\/\//i.test(avatar) || /^data:image\//i.test(avatar)) return avatar;
            const lower = avatar.toLowerCase();
            const uploadsIndex = lower.lastIndexOf('/uploads/');
            if (uploadsIndex >= 0) avatar = avatar.slice(uploadsIndex + 1);
            avatar = avatar.replace(/^\.\/+/, '');
            const base = '/Biblioteca-Andromeda/';
            if (avatar.startsWith('../')) return base + avatar.replace(/^\.\.\/+/g, '');
            if (avatar.startsWith('./')) return base + avatar.replace(/^\.\/+/g, '');
            if (avatar.startsWith('/uploads/')) return base + avatar.replace(/^\/+/g, '');
            if (avatar.startsWith('uploads/')) return base + avatar;
            if (/^[^/]+\.(jpe?g|png|webp|gif)$/i.test(avatar)) return base + 'uploads/avatars/' + avatar;
            return base + avatar.replace(/^\/+/g, '');
        }

        function avInitials(nome, sobrenome = '') {
            const base = `${nome ?? ''} ${sobrenome ?? ''}`.trim().replace(/\s+/g, ' ');
            if (!base) return 'A';
            const partes = base.split(' ');
            const primeira = partes[0]?.[0] || 'A';
            const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0] || '' : '';
            return `${primeira}${ultima}`.toUpperCase();
        }

        function avAvatarMarkup(item, nome) {
            const avatar = avAvatarUrl(item.avatar_usuario || item.avatar_usuario_url || item.avatar || item.foto || '');
            const iniciais = avEscapeHTML(item.iniciais_usuario || avInitials(item.nome, item.sobrenome || nome));
            if (!avatar) {
                return `<div class="md-comment-avatar"><span>${iniciais}</span></div>`;
            }
            return `<div class="md-comment-avatar has-photo"><img src="${avEscapeHTML(avatar)}" alt="Foto de ${avEscapeHTML(nome)}" loading="lazy" onerror="this.closest('.md-comment-avatar').classList.remove('has-photo'); this.remove();"></div>`;
        }
        function andromedaNotify(message, type = 'success') {
            const safeType = ['success', 'warning', 'danger', 'info'].includes(type) ? type : 'success';

            if (typeof window.showAndromedaNotice === 'function') {
                window.showAndromedaNotice(message, safeType);
                return;
            }

            let stack = document.querySelector('.andromeda-toast-stack');
            if (!stack) {
                stack = document.createElement('div');
                stack.className = 'andromeda-toast-stack';
                document.body.appendChild(stack);
            }

            const item = document.createElement('div');
            item.className = `andromeda-ux-toast andromeda-ux-toast-${safeType}`;
            item.innerHTML = `
                <i class="fa-solid ${safeType === 'success' ? 'fa-circle-check' : safeType === 'warning' ? 'fa-circle-info' : 'fa-triangle-exclamation'}"></i>
                <span>${avEscapeHTML(message)}</span>
                <button type="button" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
            `;
            stack.appendChild(item);

            const close = () => {
                item.classList.add('leaving');
                setTimeout(() => item.remove(), 280);
            };

            item.querySelector('button')?.addEventListener('click', close);
            requestAnimationFrame(() => item.classList.add('show'));
            setTimeout(close, safeType === 'danger' ? 6200 : 4600);
        }

        function sincronizarReservas(lista) {
            if (!Array.isArray(lista) || !Array.isArray(MINHAS_RESERVAS)) return;
            MINHAS_RESERVAS.splice(0, MINHAS_RESERVAS.length, ...lista);
        }

        function livroParaReserva() {
            const hidden = document.getElementById('reserva-livro-id');
            const hiddenId = Number(hidden?.value || 0);
            if (hiddenId > 0) return hiddenId;
            const livro = avLivroAtualPeloModal();
            return avLivroId(livro);
        }

        async function reservarLivroAndromeda(idLivro, button = null) {
            const id = Number(idLivro || 0);
            if (!id) {
                andromedaNotify('Abra uma obra antes de reservar.', 'warning');
                return;
            }

            const formData = new FormData();
            formData.append('action', 'reservar_livro');
            formData.append('livro_id', String(id));

            const oldText = button?.innerHTML;
            if (button) {
                button.disabled = true;
                button.classList.add('is-loading');
                button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Reservando';
            }

            try {
                const response = await fetch('/Biblioteca-Andromeda/catalogo', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });
                const text = await response.text();
                const jsonStart = text.indexOf('{');
                const payload = JSON.parse(jsonStart >= 0 ? text.slice(jsonStart) : text);

                sincronizarReservas(payload.reservas || []);
                andromedaNotify(payload.mensagem || 'Solicitação processada.', payload.tipo || (payload.sucesso ? 'success' : 'warning'));

                if (payload.sucesso) {
                    button?.classList.add('is-done');
                    setTimeout(() => {
                        if (typeof abrirPainelReservas === 'function') abrirPainelReservas();
                    }, 520);
                }
            } catch (error) {
                andromedaNotify('Não foi possível reservar agora. Tente novamente.', 'danger');
            } finally {
                if (button) {
                    setTimeout(() => {
                        button.disabled = false;
                        button.classList.remove('is-loading');
                        button.innerHTML = oldText;
                    }, 500);
                }
            }
        }

        function prepararReservasAjax() {
            const reservaForm = document.getElementById('reserva-form');
            const modalReserve = document.getElementById('md-reserve');

            if (reservaForm) {
                reservaForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    reservarLivroAndromeda(document.getElementById('reserva-livro-id')?.value || livroParaReserva(), modalReserve);
                }, true);
            }

            if (modalReserve) {
                modalReserve.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    reservarLivroAndromeda(livroParaReserva(), modalReserve);
                }, true);
            }
        }

        async function enviarAvaliacaoAjax(form) {
            const idLivro = document.getElementById('avaliacao-id-livro')?.value;
            const notaInput = form.querySelector('input[name="nota"]');
            const nota = Number(String(notaInput?.value || '').replace(',', '.'));

            if (!idLivro) {
                andromedaNotify('Abra uma obra antes de avaliar.', 'warning');
                return;
            }

            if (!nota || nota < 0.5 || nota > 5) {
                andromedaNotify('Escolha uma nota entre 0,5 e 5 estrelas.', 'warning');
                return;
            }

            const submit = document.getElementById('avaliacao-submit');
            const oldText = submit?.innerHTML;
            if (submit) {
                submit.disabled = true;
                submit.classList.add('is-loading');
                submit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando';
            }

            try {
                const response = await fetch('/Biblioteca-Andromeda/catalogo', {
                    method: 'POST',
                    body: new FormData(form),
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });
                const text = await response.text();
                const jsonStart = text.indexOf('{');
                const payload = JSON.parse(jsonStart >= 0 ? text.slice(jsonStart) : text);

                if (payload.id_livro && payload.avaliacoes_livro) {
                    AVALIACOES_LIVROS[String(payload.id_livro)] = payload.avaliacoes_livro;
                    AVALIACOES_LIVROS[payload.id_livro] = payload.avaliacoes_livro;
                }

                avUltimoLivroRenderizado = null;
                avFormularioEmUso = false;
                renderAvaliacoesAndromeda();
                andromedaNotify(payload.mensagem || 'Avaliação salva.', payload.tipo || (payload.sucesso ? 'success' : 'warning'));
            } catch (error) {
                andromedaNotify('Não foi possível salvar sua avaliação agora.', 'danger');
            } finally {
                if (submit) {
                    setTimeout(() => {
                        submit.disabled = false;
                        submit.classList.remove('is-loading');
                        submit.innerHTML = oldText;
                    }, 420);
                }
            }
        }


        function avNormalize(value) {
            return String(value ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        }

        function avLivroId(livro) {
            return Number(livro?.id_livro ?? livro?.id ?? livro?.livro_id ?? 0);
        }

        function avStars(nota) {
            const value = Math.max(0, Math.min(5, Math.round((Number(nota) || 0) * 2) / 2));
            let html = '';
            for (let i = 1; i <= 5; i++) {
                const fill = Math.max(0, Math.min(1, value - (i - 1)));
                html += `<span class="rating-view-star" style="--fill:${fill * 100}%"><span>★</span><i>★</i></span>`;
            }
            return html;
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
                star.setAttribute('aria-checked', fill > 0 && nota <= index + 1 ? 'true' : 'false');
            });
            const output = widget.querySelector('.rating-half-output');
            if (output) output.textContent = ratingLabelPT(nota);
            const input = widget.querySelector('input[name="nota"]');
            if (input && updateInput) input.value = nota ? String(nota) : '';
        }

        function ratingValueFromPointer(widget, event, star) {
            const index = Number(star?.dataset.star || 1);
            const rect = star.getBoundingClientRect();
            const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 1;
            return Math.max(0.5, Math.min(5, (index - 1) + (ratio <= 0.5 ? 0.5 : 1)));
        }

        function avPintarEstrelas(valor) {
            setRatingWidgetValue(document.querySelector('#avaliacao-form [data-rating-widget]'), valor);
        }

        function avNotaSelecionada() {
            const input = document.querySelector('#avaliacao-form input[name="nota"]');
            return input ? Number(String(input.value || '0').replace(',', '.')) : 0;
        }

        function avDataPT(value) {
            if (!value) return 'Agora';
            const data = new Date(String(value).replace(' ', 'T'));
            if (Number.isNaN(data.getTime())) return 'Agora';
            return data.toLocaleDateString('pt-BR');
        }

        function avPossivelLivroGlobal() {
            const candidatos = [
                window.livroAtual,
                window.currentLivro,
                window.currentBook,
                window.selectedLivro,
                window.selectedBook,
                window.activeLivro,
                window.activeBook
            ];

            for (const candidato of candidatos) {
                const id = avLivroId(candidato);
                if (id) {
                    const encontrado = LIVROS.find(l => avLivroId(l) === id);
                    if (encontrado) return encontrado;
                }
            }
            return null;
        }

        function avLivroAtualPeloModal() {
            const global = avPossivelLivroGlobal();
            if (global) return global;

            const tituloModal = avNormalize(document.getElementById('md-title')?.textContent);
            const autorModal = avNormalize(document.getElementById('md-author')?.textContent);
            const tituloPainel = avNormalize(document.getElementById('bp-title')?.textContent);
            const autorPainel = avNormalize(document.getElementById('bp-author')?.textContent);

            const titulo = tituloModal && tituloModal !== '—' ? tituloModal : tituloPainel;
            const autor = autorModal && autorModal !== '—' ? autorModal : autorPainel;

            if (!titulo || titulo === '—') return null;

            return LIVROS.find(livro => {
                const lt = avNormalize(livro.titulo ?? livro.nome ?? livro.title);
                const la = avNormalize(livro.autor_nome ?? livro.autor ?? livro.nome_autor ?? livro.author);
                return lt === titulo && (!autor || !la || autor.includes(la) || la.includes(autor));
            }) || LIVROS.find(livro => avNormalize(livro.titulo ?? livro.nome ?? livro.title) === titulo) || null;
        }

        function avDadosLivro(idLivro) {
            return AVALIACOES_LIVROS[String(idLivro)] || AVALIACOES_LIVROS[idLivro] || {
                media: 0,
                total: 0,
                minha: null,
                comentarios: []
            };
        }

        function renderAvaliacoesAndromeda() {
            const livro = avLivroAtualPeloModal();
            const idLivro = avLivroId(livro);
            const dados = idLivro ? avDadosLivro(idLivro) : { media: 0, total: 0, minha: null, comentarios: [] };
            const media = Number(dados.media || 0);
            const total = Number(dados.total || 0);

            const bpStars = document.getElementById('bp-rating-stars');
            const bpCopy = document.getElementById('bp-rating-copy');
            if (bpStars) bpStars.innerHTML = avStars(media);
            if (bpCopy) {
                bpCopy.textContent = total > 0
                    ? `${media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} de 5 · ${total} avaliação${total > 1 ? 'es' : ''}`
                    : 'Sem avaliações ainda';
            }

            const mdStars = document.getElementById('md-rating-stars');
            const mdMedia = document.getElementById('md-rating-media');
            const mdTotal = document.getElementById('md-rating-total');
            const currentLivro = document.getElementById('avaliacao-current-livro');
            const hiddenId = document.getElementById('avaliacao-id-livro');
            const comentario = document.getElementById('avaliacao-comentario');
            const submit = document.getElementById('avaliacao-submit');
            const comments = document.getElementById('avaliacoes-comments');

            if (mdStars) mdStars.innerHTML = avStars(media);
            if (mdMedia) mdMedia.textContent = media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            if (mdTotal) mdTotal.textContent = total > 0 ? `${total} avaliação${total > 1 ? 'es' : ''}` : 'Nenhuma avaliação';
            if (hiddenId) hiddenId.value = idLivro || '';
            if (currentLivro) currentLivro.textContent = livro ? `Você está avaliando: ${livro.titulo ?? livro.nome ?? 'obra selecionada'}` : 'Selecione uma obra no catálogo para avaliar.';
            if (submit) submit.disabled = !idLivro;

            const livroRenderKey = idLivro ? String(idLivro) : '';
            const form = document.getElementById('avaliacao-form');
            const focoDentroDoForm = form ? form.contains(document.activeElement) : false;
            const podeSincronizarFormulario = livroRenderKey !== avUltimoLivroRenderizado || (!focoDentroDoForm && !avFormularioEmUso);

            if (podeSincronizarFormulario) {
                if (comentario) {
                    comentario.value = dados.minha?.comentario ?? '';
                }

                avPintarEstrelas(dados.minha ? Number(dados.minha.nota) : 0);
                avUltimoLivroRenderizado = livroRenderKey;
            } else {
                avPintarEstrelas(avNotaSelecionada());
            }

            if (comments) {
                const lista = Array.isArray(dados.comentarios) ? dados.comentarios : [];

                if (!lista.length) {
                    comments.innerHTML = '<p class="md-comments-empty">Este livro ainda não possui comentários. Seja o primeiro a avaliar.</p>';
                } else {
                    comments.innerHTML = lista.map(item => {
                        const nome = `${item.nome ?? ''} ${item.sobrenome ?? ''}`.trim() || 'Leitor Andrômeda';
                        const texto = String(item.comentario ?? '').trim();
                        return `
                            <article class="md-comment-card">
                                ${avAvatarMarkup(item, nome)}
                                <div class="md-comment-content">
                                    <div class="md-comment-top">
                                        <div>
                                            <strong>${avEscapeHTML(nome)}</strong>
                                            <span class="md-comment-stars">${avStars(item.nota)}</span>
                                        </div>
                                        <small>${avDataPT(item.data_atualizacao || item.data_avaliacao)}</small>
                                    </div>
                                    ${texto ? `<p>${avEscapeHTML(texto).replace(/\n/g, '<br>')}</p>` : '<p class="md-comment-muted">Este leitor avaliou sem comentário.</p>'}
                                </div>
                            </article>
                        `;
                    }).join('');
                }
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('avaliacao-form');
            if (form) {
                ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(evento => {
                    form.addEventListener(evento, function(e) {
                        e.stopPropagation();
                    });
                });

                form.addEventListener('focusin', function() {
                    avFormularioEmUso = true;
                });

                form.addEventListener('focusout', function() {
                    setTimeout(() => {
                        if (!form.contains(document.activeElement)) {
                            avFormularioEmUso = false;
                        }
                    }, 80);
                });

                const widget = form.querySelector('[data-rating-widget]');
                if (widget) {
                    setRatingWidgetValue(widget, avNotaSelecionada(), false);
                    widget.querySelectorAll('.rating-star-unit').forEach(star => {
                        star.addEventListener('pointermove', function(event) {
                            setRatingWidgetValue(widget, ratingValueFromPointer(widget, event, star), false);
                        });
                        star.addEventListener('pointerleave', function() {
                            setRatingWidgetValue(widget, avNotaSelecionada(), false);
                        });
                        star.addEventListener('click', function(event) {
                            setRatingWidgetValue(widget, ratingValueFromPointer(widget, event, star), true);
                        });
                    });
                }

                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    enviarAvaliacaoAjax(form);
                }, true);
            }

            const tituloModal = document.getElementById('md-title');
            const autorModal = document.getElementById('md-author');
            const tituloPainel = document.getElementById('bp-title');
            const autorPainel = document.getElementById('bp-author');

            [tituloModal, autorModal, tituloPainel, autorPainel].filter(Boolean).forEach(el => {
                new MutationObserver(() => setTimeout(renderAvaliacoesAndromeda, 60))
                    .observe(el, { childList: true, characterData: true, subtree: true });
            });

            prepararReservasAjax();

            // Não renderize no clique global: isso reiniciava as estrelas e o textarea enquanto o leitor interagia.
            setTimeout(renderAvaliacoesAndromeda, 300);
        });



        function irParaRankingLeitores() {
            const btnEditorial = document.getElementById('btn-ed');
            const ranking = document.getElementById('ranking-leitores');
            if (btnEditorial && !btnEditorial.classList.contains('on')) btnEditorial.click();
            setTimeout(() => {
                if (ranking) ranking.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
        }

        function abrirPainelReservas() {
            const panel = document.getElementById('reservas-panel');
            const container = document.getElementById('reservas-lista-container');
            if (!panel || !container) return;

            if (!Array.isArray(MINHAS_RESERVAS) || MINHAS_RESERVAS.length === 0) {
                container.innerHTML = `
                    <div class="reserva-empty-state">
                        <i class="fa-solid fa-moon"></i>
                        <h3>Nenhuma reserva ativa</h3>
                        <p>Quando uma obra indisponível chamar por você, a fila aparecerá aqui.</p>
                    </div>
                `;
            } else {
                container.innerHTML = MINHAS_RESERVAS.map((r, index) => {
                    const data = r.data_reserva ? new Date(String(r.data_reserva).replace(' ', 'T')).toLocaleDateString('pt-BR') : '—';
                    return `
                        <article class="reserva-card" style="--delay:${index * 40}ms">
                            <div class="reserva-card-orbit"><i class="fa-solid fa-bookmark"></i></div>
                            <div class="reserva-card-main">
                                <span class="reserva-card-cat">${avEscapeHTML(r.categoria || 'Constelação')}</span>
                                <h3>${avEscapeHTML(r.titulo || 'Obra reservada')}</h3>
                                <p>${avEscapeHTML(r.autor || 'Autor não informado')}</p>
                                <div class="reserva-card-foot">
                                    <span><i class="fa-regular fa-calendar"></i> ${data}</span>
                                    <strong>${avEscapeHTML(r.status_livro || r.reserva_status || 'Na fila')}</strong>
                                </div>
                            </div>
                        </article>
                    `;
                }).join('');
            }

            panel.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open', 'reservas-open');
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(panel.querySelector('.reservas-dialog'), { y: 28, scale: .985, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .52, ease: 'expo.out', overwrite: true });
                gsap.fromTo(panel.querySelectorAll('.reserva-card, .reserva-empty-state'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .42, stagger: .045, ease: 'power2.out', delay: .08, overwrite: true });
            }
        }

        function fecharPainelReservas() {
            const panel = document.getElementById('reservas-panel');
            if (!panel || !panel.classList.contains('open')) return;
            const finalizar = () => {
                panel.classList.remove('open');
                panel.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('reservas-open');
                if (!document.getElementById('modal-overlay')?.classList.contains('open')) {
                    document.body.classList.remove('modal-open');
                }
            };
            if (typeof gsap !== 'undefined') {
                gsap.to(panel.querySelector('.reservas-dialog'), { y: 18, scale: .985, opacity: 0, duration: .24, ease: 'power2.in', overwrite: true, onComplete: finalizar });
            } else {
                finalizar();
            }
        }

        const reservasPanel = document.getElementById('reservas-panel');
        if (reservasPanel) {
            reservasPanel.addEventListener('click', function(e) {
                if (e.target === this) fecharPainelReservas();
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('reservas-panel')?.classList.contains('open')) fecharPainelReservas();
        });
    </script>
    <script>
        (function () {
            const intro = document.getElementById('intro-cinematic');
            const brand = document.getElementById('i-brand');
            const tag = document.getElementById('i-tag');
            const fill = intro?.querySelector('.intro-progress-fill');
            const coreSrc = '/Biblioteca-Andromeda/assets/js/andromeda.js?v=mascotes-ia-20260509-fab-context';
            const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
            let coreStarted = false;
            let coreFinished = false;
            let canClose = false;
            let introClosed = false;
            let introStart = performance.now();

            window.ANDROMEDA_CORE_INTRO_DELAY = 0.65;

            function loadCore() {
                if (coreStarted) return;
                coreStarted = true;

                const script = document.createElement('script');
                script.src = coreSrc;
                script.async = true;
                script.onload = () => {
                    coreFinished = true;
                    maybeCloseIntro();
                };
                script.onerror = () => {
                    coreFinished = true;
                    maybeCloseIntro();
                };
                document.body.appendChild(script);
            }

            function finishIntro() {
                if (introClosed) return;
                introClosed = true;
                document.body.classList.remove('catalog-intro-active');

                if (!intro) return;

                const remove = () => {
                    intro.classList.add('intro-done');
                    intro.style.display = 'none';
                };

                if (typeof gsap !== 'undefined' && !reduceMotion) {
                    gsap.to(intro, { autoAlpha: 0, duration: 0.38, ease: 'power2.inOut', onComplete: remove, overwrite: true });
                } else {
                    intro.style.opacity = '0';
                    window.setTimeout(remove, 260);
                }
            }

            function maybeCloseIntro() {
                if (introClosed) return;
                const elapsed = performance.now() - introStart;
                if ((coreFinished && canClose) || elapsed > 2400) finishIntro();
            }

            function playIntro() {
                introStart = performance.now();
                document.body.classList.add('catalog-intro-active');

                if (brand) brand.setAttribute('aria-label', 'ANDRÔMEDA');
                if (tag) tag.style.opacity = '1';

                window.setTimeout(loadCore, reduceMotion ? 40 : 220);
                window.setTimeout(() => {
                    canClose = true;
                    maybeCloseIntro();
                }, reduceMotion ? 360 : 1050);
                window.setTimeout(finishIntro, reduceMotion ? 900 : 2600);

                if (!intro) return;

                if (typeof gsap === 'undefined' || reduceMotion) {
                    if (fill) fill.style.transform = 'scaleX(1)';
                    return;
                }

                gsap.killTweensOf([intro, '.intro-cosmos', '.intro-core', '.intro-orbit', '.intro-mask', fill, brand, tag]);

                gsap.timeline({ defaults: { ease: 'power3.out' } })
                    .set(intro, { autoAlpha: 1 })
                    .fromTo('.intro-cosmos', { scale: 0.985, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.24 }, 0)
                    .fromTo('.intro-core', { scale: 0.82, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.26 }, 0.04)
                    .fromTo('.intro-orbit', { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.28, stagger: 0.025 }, 0.09)
                    .fromTo('.intro-mask', { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28 }, 0.11)
                    .to(fill, { scaleX: 1, duration: 0.78, ease: 'power2.inOut' }, 0.16)
                    .to('.intro-mask', { y: -4, autoAlpha: 0.9, duration: 0.2, ease: 'power1.inOut' }, 0.86);
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', playIntro, { once: true });
            } else {
                playIntro();
            }
        })();
    </script>
</body>

</html>