<?php
if (!isset($_SESSION)) {
    session_start();
}
include "../config/conexao.php";

if (isset($_POST['email'])) {
    $nome       = $mysqli->real_escape_string($_POST['nome']);
    $sobrenome  = $mysqli->real_escape_string($_POST['sobrenome']);
    $email      = $mysqli->real_escape_string($_POST['email']);
    $nascimento = !empty($_POST['data_nascimento']) ? date("Y-m-d", strtotime($_POST['data_nascimento'])) : null;
    $telefone   = $mysqli->real_escape_string($_POST['telefone']);
    $endereco   = $mysqli->real_escape_string($_POST['endereco']);
    $google_id  = $mysqli->real_escape_string($_POST['google_id'] ?? '');
    $foto       = $mysqli->real_escape_string($_POST['foto'] ?? '');

    // Senha é opcional se veio do Google
    $senha = !empty($_POST['senha']) ? password_hash($_POST['senha'], PASSWORD_DEFAULT) : null;

    $check = $mysqli->prepare("SELECT id_usuario FROM usuarios WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        $erro = "Este e-mail já está em uso!";
    } else {
        $mysqli->query("INSERT INTO usuarios 
            (nome, sobrenome, email, data_nascimento, telefone, endereco, senha, google_id, foto) 
            VALUES 
            ('$nome', '$sobrenome', '$email', '$nascimento', '$telefone', '$endereco', '$senha', '$google_id', '$foto')");

        $_SESSION['user'] = ['nome' => $nome, 'email' => $email, 'foto' => $foto];
        header("Location: dashboard.php");
        exit;
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

    <link rel="stylesheet" href="../assets/css/pgcadleitores.css">
    <script src="https://accounts.google.com/gsi/client" async defer></script>


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
                <input type="hidden" name="google_id" id="google_id_field">
<input type="hidden" name="foto"      id="foto_field">

                <!-- Botão oficial do Google (renderizado automaticamente) -->
              

                <button type="submit" class="btn-prim interactable">Iniciar Jornada</button>

                <?php if (!empty($erro)): ?>
                    <div class="auth-error">
                        <i class="fa-solid fa-triangle-exclamation"></i> <?= $erro ?>
                    </div>
                <?php endif; ?>
                
                 <div id="g_id_onload"
                    data-client_id="1080679226381-9jbho9u4m814nm8g3lavhf7qsofd70d3.apps.googleusercontent.com"
                    data-callback="handleCredentialResponse"
                    data-auto_prompt="false">
                </div>

                <div class="google-button-frame">
                    <div class="g_id_signin"
                        data-type="standard"
                        data-theme="outline"
                        data-size="large"
                        data-text="continue_with"
                        data-shape="pill"
                        data-logo_alignment="left"
                        data-width="320">
                    </div>
                </div>

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

    <script src="../assets/js/animecadleitores.js"></script>

 <script>function handleCredentialResponse(response) {
    fetch("callback.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "ja_cadastrado") {
            // Já tem conta → vai pro dashboard
            window.location.href = "dashboard.php";

        } else if (data.status === "novo_usuario") {
            // Preenche o formulário automaticamente
            document.querySelector('input[name="nome"]').value      = data.nome;
            document.querySelector('input[name="email"]').value     = data.email;

            // Separa nome e sobrenome
            const partes = data.nome.split(" ");
            document.querySelector('input[name="nome"]').value      = partes[0];
            document.querySelector('input[name="sobrenome"]').value = partes.slice(1).join(" ");

            // Campos ocultos
            document.getElementById("google_id_field").value = data.google_id;
            document.getElementById("foto_field").value      = data.foto;

            // Senha não é obrigatória quando vem do Google
            document.querySelector('input[name="senha"]').removeAttribute("required");

            alert("Dados preenchidos! Complete o cadastro e clique em Iniciar Jornada.");
        } else {
            alert("Erro no login com Google.");
        }
    });
}
</script>
</body>

</html>