<?php
// config/mailer.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

function criarMailer(): PHPMailer
{
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'bibliotecacosmicaandromeda@gmail.com';   // seu Gmail
    $mail->Password   = 'fxqb usxb aobu bjay';  // senha de app (16 caracteres)
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom('bibliotecacosmicaandromeda@gmail.com', 'Biblioteca Andrômeda');

    return $mail;
}