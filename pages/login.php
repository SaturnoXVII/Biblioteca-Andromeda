<<?php
require_once "../config/conexao.php";
require_once "../config/sessao.php";

iniciarSessaoSegura();

$erro_msg = "";

if (isset($_GET['sessao']) && $_GET['sessao'] === 'expirada') {
    $erro_msg = "Sua sessão expirou. Faça login novamente.";
}

if (usuarioEstaLogado()) {
    header("Location: catalogo.php");
    exit;
}

// verifica se as informações foram enviadas
if (isset($_POST['email']) && isset($_POST['senha'])) {

    if (empty($_POST['email'])) {
        $erro_msg = "Preencha seu e-mail";
    } else if (empty($_POST['senha'])) {
        $erro_msg = "Preencha sua senha";
    } else {
        $email = trim($_POST['email']);
        $senha = $_POST['senha'];

        $sql = "SELECT 
                    id_usuario,
                    username,
                    email,
                    senha,
                    nivel_acesso,
                    nome,
                    sobrenome,
                    avatar,
                    foto,
                    tipo_login
                FROM usuarios 
                WHERE email = ?
                LIMIT 1";

        $stmt = $mysqli->prepare($sql);

        if (!$stmt) {
            $erro_msg = "Erro interno ao preparar login.";
        } else {
            $stmt->bind_param("s", $email);
            $stmt->execute();

            $result = $stmt->get_result();

            if ($result->num_rows === 1) {
                $usuario = $result->fetch_assoc();

                if (password_verify($senha, $usuario['senha'])) {

                    criarSessaoUsuario($usuario);

                    if ($usuario['nivel_acesso'] === 'admin') {
                        header("Location: adm.php");
                        exit;
                    }

                    header("Location: catalogo.php");
                    exit;

                } else {
                    $erro_msg = "Acesso Negado: Credenciais inválidas.";
                }
            } else {
                $erro_msg = "Acesso Negado: Credenciais inválidas.";
            }

            $stmt->close();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda · Acesso</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/pglogin.css">
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

        <div class="auth-float-title">
            <h1 class="auth-brand">Andrômeda</h1>
            <span class="auth-brand-line"></span>
            <div class="auth-subtitle">Identifique-se para acessar o acervo</div>
        </div>

        <div class="auth-card" id="Cadastro">
            <div class="auth-header">
                <h1 class="auth-brand">Andrômeda</h1>
                <div class="auth-subtitle">Identifique-se para acessar o acervo</div>
            </div>

            <form method="POST" action="">

                <?php if (!empty($erro_msg)): ?>
                    <div class="auth-error reveal-error">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span><?php echo htmlspecialchars($erro_msg); ?></span>
                    </div>
                <?php endif; ?>

                <div class="form-group">
                    <input type="text" name="email" placeholder="E-mail" required class="form-control interactable">
                </div>

                <div class="form-group pass-wrap">
                    <input type="password" name="senha" placeholder="Senha" required class="form-control interactable">
                    <button type="button" class="pass-toggle" tabindex="-1">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>

                <button value="Entrar" type="submit" class="btn-prim interactable">Explorar o Universo</button>

                <!-- Botão oficial do Google (renderizado automaticamente) -->
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
                <div class="auth-links" id="adicionais">
                    <a href="cadastroleitores.php" class="interactable">Não tem uma conta?</a>
                </div>
            </form>
        </div>
    </main>

    </div>



    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>

    <script src="../assets/js/animelogin.js"></script>

    <script>
        function handleCredentialResponse(response) {



            fetch("callback.php", {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        token: response.credential

                    })

                })

                .then(res => res.json())

                .then(data => {

                    if (data.status === "success") {

                        window.location.href = "dashboard.php";

                    } else {

                        alert("Erro no login");

                    }

                });



        }
    </script>
</body>

</html>