<?php
// includes/notificacoes.php
// Aqui ficam as FUNÇÕES de envio de email do sistema.
// Cada tipo de email é uma função separada.

require_once __DIR__ . '/../config/mailer.php';

/**
 * Envia email avisando que o livro está disponível.
 * 
 * $emailDestino  → para quem vai o email
 * $nomeLeitor    → para personalizar a mensagem ("Olá, Maria!")
 * $tituloLivro   → nome do livro que ficou disponível
 */
function notificarLivroDisponivel(string $emailDestino, string $nomeLeitor, string $tituloLivro): bool {
    try {
        $mail = criarMailer(); // pega a "máquina" configurada

        // Destinatário
        $mail->addAddress($emailDestino, $nomeLeitor);

        // Conteúdo
        $mail->isHTML(true); // permite HTML no corpo do email
        $mail->Subject = '⭐ Seu livro reservado está disponível! — Andrômeda';
        $mail->Body    = templateDisponibilidade($nomeLeitor, $tituloLivro);

        $mail->send();
        return true; // deu certo

    } catch (Exception $e) {
        // Não deixa o erro quebrar o sistema — só registra no log
        error_log('[Andrômeda] Falha ao enviar email para ' . $emailDestino . ': ' . $e->getMessage());
        return false; // deu errado, mas o sistema continua
    }
}

/**
 * O HTML do email.
 * Separado da lógica de envio para facilitar edição visual.
 */
function templateDisponibilidade(string $nome, string $titulo): string {
    $nomeSeguro = htmlspecialchars($nome, ENT_QUOTES, 'UTF-8');
    $tituloSeguro = htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');

    return "
    <div style='margin:0; padding:0; background:#020305; font-family:Montserrat, Arial, sans-serif; color:#e0f0ff;'>
        <div style='max-width:620px; margin:0 auto; padding:34px 18px;'>

            <div style='
                background:
                    radial-gradient(circle at 18% 0%, rgba(42,162,246,0.22), transparent 34%),
                    radial-gradient(circle at 86% 12%, rgba(169,96,238,0.18), transparent 34%),
                    linear-gradient(180deg, rgba(7,12,22,0.98), rgba(2,3,5,0.98));
                border:1px solid rgba(42,162,246,0.22);
                border-radius:22px;
                overflow:hidden;
                box-shadow:0 24px 70px rgba(0,0,0,0.65);
            '>

                <div style='padding:34px 36px 22px; border-bottom:1px solid rgba(42,162,246,0.16);'>
                    <div style='
                        display:inline-block;
                        padding:7px 12px;
                        border:1px solid rgba(42,162,246,0.28);
                        border-radius:999px;
                        background:rgba(42,162,246,0.08);
                        color:#2aa2f6;
                        font-family:Space Mono, Consolas, monospace;
                        font-size:10px;
                        letter-spacing:0.22em;
                        text-transform:uppercase;
                        margin-bottom:18px;
                    '>Notificação de Reserva</div>

                    <h1 style='
                        margin:0;
                        color:#fdfcf0;
                        font-family:Georgia, Cormorant Garamond, serif;
                        font-weight:400;
                        font-size:38px;
                        line-height:1;
                        letter-spacing:0.06em;
                    '>Biblioteca <span style='color:#2aa2f6; font-style:italic;'>Andrômeda</span></h1>

                    <p style='
                        margin:12px 0 0;
                        color:rgba(224,240,255,0.55);
                        font-size:13px;
                        letter-spacing:0.08em;
                        text-transform:uppercase;
                    '>Sistema Galáctico de Gestão de Livros</p>
                </div>

                <div style='padding:34px 36px 38px;'>
                    <p style='
                        margin:0 0 16px;
                        color:rgba(253,252,240,0.82);
                        font-size:15px;
                        line-height:1.8;
                    '>Olá, <strong style='color:#e0f0ff;'>{$nomeSeguro}</strong>.</p>

                    <p style='
                        margin:0;
                        color:rgba(253,252,240,0.68);
                        font-size:15px;
                        line-height:1.8;
                    '>Uma obra que estava reservada em seu nome voltou a ficar disponível para retirada.</p>

                    <div style='
                        margin:28px 0;
                        padding:24px 26px;
                        border-radius:16px;
                        background:
                            linear-gradient(135deg, rgba(42,162,246,0.14), rgba(169,96,238,0.08)),
                            rgba(255,255,255,0.025);
                        border:1px solid rgba(42,162,246,0.24);
                        border-left:4px solid #2aa2f6;
                    '>
                        <div style='
                            color:#2aa2f6;
                            font-family:Space Mono, Consolas, monospace;
                            font-size:10px;
                            letter-spacing:0.2em;
                            text-transform:uppercase;
                            margin-bottom:10px;
                        '>Obra disponível</div>

                        <div style='
                            color:#fdfcf0;
                            font-family:Georgia, Cormorant Garamond, serif;
                            font-size:24px;
                            line-height:1.25;
                            font-weight:400;
                        '>{$tituloSeguro}</div>
                    </div>

                    <p style='
                        margin:0;
                        color:rgba(253,252,240,0.68);
                        font-size:15px;
                        line-height:1.8;
                    '>Procure a biblioteca para confirmar a retirada. A disponibilidade pode mudar conforme a fila de reservas.</p>

                    <div style='
                        margin-top:32px;
                        padding-top:22px;
                        border-top:1px solid rgba(42,162,246,0.14);
                    '>
                        <p style='
                            margin:0;
                            color:rgba(224,240,255,0.38);
                            font-size:12px;
                            line-height:1.7;
                        '>Você recebeu este e-mail porque fez uma reserva na Biblioteca Andrômeda.</p>
                    </div>
                </div>
            </div>

            <p style='
                margin:18px 0 0;
                text-align:center;
                color:rgba(224,240,255,0.26);
                font-size:11px;
                letter-spacing:0.12em;
                text-transform:uppercase;
            '>Andrômeda · O Cofre Cósmico</p>
        </div>
    </div>
    ";
}


function verificarENotificarAtrasos(mysqli $db): void
{
    // Busca todos os empréstimos que já passaram da data de devolução
    $stmt = $db->prepare("
        SELECT
            e.id_emprestimo,
            e.data_devolucao,
            ABS(DATEDIFF(e.data_devolucao, CURDATE())) AS dias_atraso,
            l.titulo,
            u.nome  AS usuario,
            u.email
        FROM emprestimos e
        INNER JOIN Livros   l ON l.id_livro   = e.id_livro
        INNER JOIN usuarios u ON u.id_usuario = e.id_usuario
        WHERE
            e.status_emprestimo IN ('Pendente', 'Atrasado')
            AND e.data_devolucao < CURDATE()
            AND u.email IS NOT NULL
            AND u.email != ''
        ORDER BY e.data_devolucao ASC
    ");
 
    $stmt->execute();
    $atrasados = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
 
    foreach ($atrasados as $e) {
        // Não reenvia se já foi notificado hoje
        if (_jaNotificadoHoje($db, (int) $e['id_emprestimo'])) {
            continue;
        }
 
        $enviado = notificarDevolucaoAtrasada(
            $e['email'],
            $e['usuario'],
            $e['titulo'],
            $e['data_devolucao'],
            (int) $e['dias_atraso']
        );
 
        if ($enviado) {
            _registrarNotificacaoAtraso($db, (int) $e['id_emprestimo']);
        }
    }
}
 
function _jaNotificadoHoje(mysqli $db, int $idEmprestimo): bool
{
    $stmt = $db->prepare("
        SELECT 1 FROM log_notificacoes
        WHERE id_emprestimo = ? AND DATE(enviado_em) = CURDATE()
        LIMIT 1
    ");
    $stmt->bind_param('i', $idEmprestimo);
    $stmt->execute();
    $stmt->store_result();
    $existe = $stmt->num_rows > 0;
    $stmt->close();
    return $existe;
}
 
function _registrarNotificacaoAtraso(mysqli $db, int $idEmprestimo): void
{
    $stmt = $db->prepare("
        INSERT INTO log_notificacoes (id_emprestimo, enviado_em)
        VALUES (?, NOW())
    ");
    $stmt->bind_param('i', $idEmprestimo);
    $stmt->execute();
    $stmt->close();
}
 
// ──────────────────────────────────────────────────────────────────
// 2. FUNÇÃO DE ENVIO (já segue o padrão do seu notificacoes.php)
// ──────────────────────────────────────────────────────────────────
 
function notificarDevolucaoAtrasada(
    string $emailDestino,
    string $nomeLeitor,
    string $tituloLivro,
    string $dataDevolucao,
    int    $diasAtraso
): bool {
    try {
        $mail = criarMailer();
        $mail->addAddress($emailDestino, $nomeLeitor);
        $mail->isHTML(true);
        $mail->Subject = '⚠️ Devolução em atraso — Andrômeda';
        $mail->Body    = _templateAtraso($nomeLeitor, $tituloLivro, $dataDevolucao, $diasAtraso);
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log('[Andrômeda] Falha ao notificar atraso para ' . $emailDestino . ': ' . $e->getMessage());
        return false;
    }
}

 
function _templateAtraso(string $nome, string $titulo, string $dataISO, int $diasAtraso): string
{
    $n      = htmlspecialchars($nome,   ENT_QUOTES, 'UTF-8');
    $t      = htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');
    $dt     = date('d/m/Y', strtotime($dataISO));
    $plural = $diasAtraso === 1 ? 'dia' : 'dias';
 
    return "
    <div style='margin:0;padding:0;background:#020305;font-family:Montserrat,Arial,sans-serif;color:#e0f0ff;'>
      <div style='max-width:620px;margin:0 auto;padding:34px 18px;'>
        <div style='
            background:
                radial-gradient(circle at 18% 0%, rgba(255,107,107,.2), transparent 34%),
                radial-gradient(circle at 86% 12%, rgba(169,96,238,.14), transparent 34%),
                linear-gradient(180deg, rgba(7,12,22,.98), rgba(2,3,5,.98));
            border:1px solid rgba(255,107,107,.3);
            border-radius:22px;
            overflow:hidden;
            box-shadow:0 24px 70px rgba(0,0,0,.65);'>
 
          <div style='padding:34px 36px 22px;border-bottom:1px solid rgba(255,107,107,.2);'>
            <div style='display:inline-block;padding:7px 12px;border:1px solid rgba(255,107,107,.4);
                border-radius:999px;background:rgba(255,107,107,.1);color:#ff6b6b;
                font-size:10px;letter-spacing:.22em;text-transform:uppercase;margin-bottom:18px;'>
              ⚠ Devolução em Atraso
            </div>
            <h1 style='margin:0;color:#fdfcf0;font-family:Georgia,serif;font-weight:400;font-size:38px;line-height:1;'>
              Biblioteca <span style='color:#ff6b6b;font-style:italic;'>Andrômeda</span>
            </h1>
          </div>
 
          <div style='padding:34px 36px 38px;'>
            <p style='margin:0 0 16px;color:rgba(253,252,240,.82);font-size:15px;line-height:1.8;'>
              Olá, <strong style='color:#e0f0ff;'>{$n}</strong>.
            </p>
            <p style='margin:0 0 24px;color:rgba(253,252,240,.68);font-size:15px;line-height:1.8;'>
              O prazo de devolução do livro abaixo venceu há
              <strong style='color:#ff6b6b;'>{$diasAtraso} {$plural}</strong>.
              Por favor, devolva o quanto antes para que outros leitores também possam aproveitar a obra.
            </p>
 
            <div style='padding:24px 26px;border-radius:16px;
                background:linear-gradient(135deg,rgba(255,107,107,.12),rgba(169,96,238,.06));
                border:1px solid rgba(255,107,107,.3);border-left:4px solid #ff6b6b;margin-bottom:24px;'>
              <div style='color:#ff6b6b;font-size:10px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px;'>
                Devolução pendente
              </div>
              <div style='color:#fdfcf0;font-family:Georgia,serif;font-size:22px;line-height:1.3;'>{$t}</div>
              <div style='margin-top:12px;color:rgba(224,240,255,.6);font-size:13px;'>
                📅 Deveria ter sido devolvido em: <strong style='color:#ff6b6b;'>{$dt}</strong>
              </div>
            </div>
 
            <p style='margin:0;color:rgba(253,252,240,.68);font-size:15px;line-height:1.8;'>
              Se tiver alguma dificuldade, entre em contato com a biblioteca.
            </p>
 
            <div style='margin-top:32px;padding-top:22px;border-top:1px solid rgba(255,107,107,.14);'>
              <p style='margin:0;color:rgba(224,240,255,.38);font-size:12px;line-height:1.7;'>
                Você recebeu este e-mail porque possui um empréstimo com atraso na Biblioteca Andrômeda.
              </p>
            </div>
          </div>
        </div>
        <p style='margin:18px 0 0;text-align:center;color:rgba(224,240,255,.26);font-size:11px;letter-spacing:.12em;text-transform:uppercase;'>
          Andrômeda · O Cofre Cósmico
        </p>
      </div>
    </div>";
}
 
 
