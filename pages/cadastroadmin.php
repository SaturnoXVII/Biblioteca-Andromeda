<?php
if (!isset($_SESSION)) {
    session_start();
}
include "../config/conexao.php";

if (isset($_POST['email'])) {

    // O real_escape_string é uma função do mysqli que escapa caracteres especiais em uma string, para evitar ataques de SQL Injection.
    // $username   = $mysqli->real_escape_string($_POST['Username']);
    $nome       = $mysqli->real_escape_string($_POST['nome']);
    $sobrenome  = $mysqli->real_escape_string($_POST['sobrenome']);
    $email      = $mysqli->real_escape_string($_POST['email']);
    $nascimento = $mysqli->real_escape_string($_POST['data_nascimento']);
    $telefone   = $mysqli->real_escape_string($_POST['telefone']);
    $endereco   = $mysqli->real_escape_string($_POST['endereco']);
    $nivel_acesso = $mysqli->real_escape_string($_POST['nivel_acesso']);

    $nascimento = date("Y-m-d", strtotime($_POST['data_nascimento']));

    $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);

    $mysqli->query("INSERT INTO  usuarios (nome, sobrenome, email, data_nascimento, telefone, endereco, nivel_acesso, senha) VALUES ('$nome', '$sobrenome', '$email', '$nascimento', '$telefone', '$endereco', '$nivel_acesso', '$senha')");
}


?>

<!doctype html>
<html lang="pt-br">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cadastro — Andromeda</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <!-- Bootstrap Icons para o olho de senha -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!-- Google Fonts — sistema Avalon -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/admcad.css">
</head>

<body>

    <!-- ── Cursor magnético ── -->
    <div id="reticle">
        <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" class="ret-ring"/>
            <line x1="15" y1="4"  x2="15" y2="8"  class="ret-cross"/>
            <line x1="15" y1="22" x2="15" y2="26" class="ret-cross"/>
            <line x1="4"  y1="15" x2="8"  y2="15" class="ret-cross"/>
            <line x1="22" y1="15" x2="26" y2="15" class="ret-cross"/>
        </svg>
    </div>
    <div id="reticle-dot"></div>

   
    

    <!-- ── Fundo cósmico ── -->
    <div id="estrelas"></div>
    <div class="nebula nebula-1"></div>
    <div class="nebula nebula-2"></div>
    <div class="nebula nebula-3"></div>

    <section class="text-center my-4" id="Cadastro">

        <h2>Bem-vindo à Andromeda</h2>
        <div class="subtitulo">Cadastre-se para explorar o acervo.</div>

        <div class="formulario card border rounded-4 m-4 mt-3 mx-auto">

            <form method="POST" action="">

                <!-- Dados pessoais -->
                <div class="form-section-label">Dados Pessoais</div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <input type="text" name="nome" class="form-control" placeholder="Nome" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <input type="text" name="sobrenome" class="form-control" placeholder="Sobrenome">
                    </div>
                </div>

                <!-- Contato -->
                <div class="form-section-label">Contato</div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <input type="text" name="email" class="form-control" placeholder="E-mail" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <input type="date" name="data_nascimento" class="form-control">
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <input type="text" name="telefone" class="form-control" placeholder="Telefone">
                    </div>
                    <div class="col-md-6 mb-3">
                        <input type="text" name="endereco" class="form-control" placeholder="Endereço">
                    </div>
                </div>

                <!-- Nível de acesso — cards visuais -->
                <div class="form-section-label">Nível de Acesso</div>

                <div class="nivel-selector mb-3">
                    <div class="nivel-card explorador">
                        <input type="radio" name="_nivel_ui" id="nivel-explorador" value="leitor">
                        <label class="nivel-label" for="nivel-explorador">
                            <span class="nivel-icon">🔭</span>
                            <span class="nivel-title">Explorador</span>
                            <span class="nivel-desc">Lê e descobre o acervo</span>
                        </label>
                    </div>
                    <div class="nivel-card guardiao">
                        <input type="radio" name="_nivel_ui" id="nivel-guardiao" value="admin">
                        <label class="nivel-label" for="nivel-guardiao">
                            <span class="nivel-icon">🛡️</span>
                            <span class="nivel-title">Guardião</span>
                            <span class="nivel-desc">Gerencia o acervo</span>
                        </label>
                    </div>
                </div>

                <!-- hidden select preservado para o PHP -->
                <select name="nivel_acesso" class="form-control mb-3" required style="display:none;">
                    <option value="" selected disabled hidden>Explorador ou Guardião?</option>
                    <option value="admin">Guardião</option>
                    <option value="leitor">Explorador</option>
                </select>

                <!-- Senha -->
                <div class="form-section-label">Segurança</div>
                <div class="pass-wrap mb-3">
                    <input type="password" name="senha" class="form-control" placeholder="Senha" required>
                    <button type="button" class="pass-toggle" tabindex="-1">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>

                <!--  <input type="text" name="Username" class="form-control" placeholder="Username"> --> 
                <button type="submit" class="btn">Cadastrar</button>

            </form>

        </div>

        <div class="painel-link mt-3">
            <a href="adm.php" class="btn-link">Voltar para o painel</a>
        </div>

    </section>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="../assets/js/animecadadm.js"></script>
      
    
</body>

</html>