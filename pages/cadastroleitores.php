<?php
if (!isset($_SESSION)) {
    session_start();
}
include "../config/conexao.php";

if (isset($_POST['email'])) {

 if (isset($_POST['email'])) {
    $nome       = $mysqli->real_escape_string($_POST['nome']);
    $sobrenome  = $mysqli->real_escape_string($_POST['sobrenome']);
    $email      = $mysqli->real_escape_string($_POST['email']);
    $nascimento = date("Y-m-d", strtotime($_POST['data_nascimento']));
    $telefone   = $mysqli->real_escape_string($_POST['telefone']);
    $endereco   = $mysqli->real_escape_string($_POST['endereco']);
    $senha      = password_hash($_POST['senha'], PASSWORD_DEFAULT);
    
    // Antes de inserir o novo usuário, vamos verificar se já existe um usuário com o mesmo email no banco de dados. Isso é importante para evitar que haja dois usuários com o mesmo email, o que poderia causar problemas de login e segurança. O código abaixo prepara uma consulta SQL para selecionar o id dos usuários que tenham o email igual ao email digitado no formulário, depois ele executa a consulta e armazena o resultado. Se o número de linhas do resultado for maior que 0, significa que já existe um usuário com esse email, então ele define a variável $erro com a mensagem de erro. Caso contrário, ele insere o novo usuário no banco de dados e redireciona para a página de login.

    $check = $mysqli->prepare("SELECT id_usuario FROM usuarios WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        $erro = "Este e-mail já está em uso!";
    } else {
        $mysqli->query("INSERT INTO usuarios (nome, sobrenome, email, data_nascimento, telefone, endereco, senha) VALUES ('$nome', '$sobrenome', '$email', '$nascimento', '$telefone', '$endereco', '$senha')");
        header("Location: login.php");
        exit;
    }
}
}


?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda · Cadastro</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    
    <link rel="stylesheet" href="../assets/css/cadleitores.css">
</head>

<body>
    <div id="grain"></div>
    <div id="webgl"></div>

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

    <main class="auth-wrapper">

        <!-- ── Título flutuante cinematográfico ── -->
        <div class="auth-float-title">
            <h1 class="auth-brand">Andrômeda</h1>
            <span class="auth-brand-line"></span>
            <div class="auth-subtitle">Cadastre-se para explorar o acervo</div>
        </div>

        <div class="auth-card" id="Cadastro">
            <div class="auth-header">
                <h1 class="auth-brand">Andrômeda</h1>
                <div class="auth-subtitle">Cadastre-se para explorar o acervo</div>
            </div>

            <form method="POST" action="">
                
                <div class="form-section-label">Identificação</div>
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <input type="text" name="nome" class="form-control interactable" placeholder="Nome" required>
                    </div>
                    <div class="col-md-6">
                        <input type="text" name="sobrenome" class="form-control interactable" placeholder="Sobrenome">
                    </div>
                </div>

                <div class="form-section-label">Contato</div>
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <input type="email" name="email" class="form-control interactable" placeholder="E-mail" required>
                    </div>
                    <div class="col-md-6">
                        <input type="date" name="data_nascimento" class="form-control interactable" title="Data de Nascimento">
                    </div>
                </div>

                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <input type="text" name="telefone" class="form-control interactable" placeholder="Telefone">
                    </div>
                    <div class="col-md-6">
                        <input type="text" name="endereco" class="form-control interactable" placeholder="Endereço">
                    </div>
                </div>            

                <div class="form-section-label">Segurança</div>
                <div class="pass-wrap mb-4">
                    <input type="password" name="senha" class="form-control interactable" placeholder="Senha" required>
                    <button type="button" class="pass-toggle" tabindex="-1">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                
                <button type="submit" class="btn-prim interactable">Iniciar Jornada</button>
                
                <?php if (!empty($erro)): ?>
                    <div class="auth-error">
                        <i class="fa-solid fa-triangle-exclamation"></i> <?= $erro ?>
                    </div>
                <?php endif; ?>

                <div class="auth-links">
                    <a href="login.php" class="interactable">Já possui uma conta? Acessar</a>
                </div>
            </form>
        </div>
    </main>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>

    <script src="../assets/js/cadleitores.js"></script>
</body>
</html>