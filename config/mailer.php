<?php
// config/mailer.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php'; // ✅ barra adicionada

function criarMailer(): PHPMailer
{
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = 'sandbox.smtp.mailtrap.io';
    $mail->SMTPAuth   = true;                              // ✅ era o texto errado
    $mail->Username   = '207bdb14eab4d9';
    $mail->Password   = 'a459319156791c';         // ✅ coloca a senha real
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;    // ✅ constante segura
    $mail->Port       = 587;                               // ✅ par correto com TLS
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom('noreply@andromeda.com', 'Biblioteca Andrômeda');

    return $mail;
}