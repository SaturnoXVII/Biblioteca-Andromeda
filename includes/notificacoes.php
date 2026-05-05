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
    return "
    <div style='font-family: Georgia, serif; max-width: 580px; margin: auto;
                background: #0d0d2b; color: #e0e0ff; padding: 40px; border-radius: 14px;'>

        <h2 style='color: #a78bfa; margin-bottom: 4px;'>🌌 Biblioteca Andrômeda</h2>
        <p style='color: #6b6b9a; margin-top: 0;'>Sistema Galáctico de Gestão de Livros</p>

        <hr style='border-color: #2a2a5a; margin: 24px 0;'>

        <p>Olá, <strong>{$nome}</strong>!</p>
        <p>O livro que você reservou está disponível para retirada:</p>

        <div style='background: #1a1a3e; padding: 20px 24px;
                    border-left: 4px solid #a78bfa; border-radius: 8px; margin: 24px 0;'>
            <span style='font-size: 20px;'>📚</span>
            <strong style='font-size: 17px; margin-left: 8px;'>{$titulo}</strong>
        </div>

        <p>Acesse o sistema e confirme seu empréstimo. 
           <strong>Sua reserva pode expirar se não for retirada em breve.</strong></p>

        <a href='http://localhost/biblioteca/'
           style='display: inline-block; margin-top: 8px; padding: 12px 28px;
                  background: #7c3aed; color: white; text-decoration: none;
                  border-radius: 8px; font-weight: bold;'>
            Acessar a Biblioteca →
        </a>

        <p style='color: #444477; font-size: 12px; margin-top: 36px;'>
            Você recebeu este email porque fez uma reserva na Biblioteca Andrômeda.
        </p>
    </div>
    ";
}