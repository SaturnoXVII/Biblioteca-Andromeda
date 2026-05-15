<?php
require_once __DIR__ . "/../config/conexao.php";
require_once __DIR__ . "/../config/sessao.php";

iniciarSessaoSegura();

if (usuarioEstaLogado()) {
    header("Location: /Biblioteca-Andromeda/catalogo");
    exit;
}

$erro = "";
$nome = "";
$sobrenome = "";
$email = "";
$data_nascimento = "";
$telefone = "";
$endereco = "";
$google_sub = "";
$foto = "";

function limparCampoCadastro($campo) {
    return trim($_POST[$campo] ?? '');
}

function gerarUsernameCadastro($email, $nome) {
    $base = strstr($email, '@', true);

    if (!$base) {
        $base = $nome ?: 'leitor';
    }

    $normalizado = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base);
    $normalizado = $normalizado !== false ? $normalizado : $base;
    $normalizado = strtolower(preg_replace('/[^a-zA-Z0-9._-]/', '', $normalizado));
    $normalizado = trim($normalizado, '._-');

    if ($normalizado === '') {
        $normalizado = 'leitor';
    }

    return substr($normalizado, 0, 38) . '_' . random_int(1000, 9999);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $nome            = limparCampoCadastro('nome');
    $sobrenome       = limparCampoCadastro('sobrenome');
    $email           = limparCampoCadastro('email');
    $data_nascimento = limparCampoCadastro('data_nascimento');
    $telefone        = limparCampoCadastro('telefone');
    $endereco        = limparCampoCadastro('endereco');
    $google_sub      = limparCampoCadastro('google_sub');
    $foto            = limparCampoCadastro('foto');
    $senha_raw       = $_POST['senha'] ?? '';

    $camposObrigatorios = [
        'nome' => 'Preencha seu nome.',
        'sobrenome' => 'Preencha seu sobrenome.',
        'email' => 'Preencha seu e-mail.',
        'data_nascimento' => 'Informe sua data de nascimento.',
        'telefone' => 'Informe seu telefone.',
        'endereco' => 'Informe seu endereço.'
    ];

    foreach ($camposObrigatorios as $campo => $mensagem) {
        if (trim($_POST[$campo] ?? '') === '') {
            $erro = $mensagem;
            break;
        }
    }

    if ($erro === "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erro = "Informe um e-mail válido.";
    }

    if ($erro === "") {
        $dataValida = DateTime::createFromFormat('Y-m-d', $data_nascimento);
        $errosData = DateTime::getLastErrors();

        if (!$dataValida || $dataValida->format('Y-m-d') !== $data_nascimento || ($errosData && ($errosData['warning_count'] > 0 || $errosData['error_count'] > 0))) {
            $erro = "Informe uma data de nascimento válida.";
        }
    }

    if ($erro === "" && empty($google_sub) && trim($senha_raw) === '') {
        $erro = "Preencha uma senha.";
    }

    if ($erro === "" && empty($google_sub) && strlen($senha_raw) < 6) {
        $erro = "A senha precisa ter pelo menos 6 caracteres.";
    }

    if ($erro === "") {
        try {
            $check = $mysqli->prepare("SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1");

            if (!$check) {
                throw new Exception("Falha ao preparar verificação de e-mail.");
            }

            $check->bind_param("s", $email);
            $check->execute();
            $check->store_result();

            if ($check->num_rows > 0) {
                $erro = "Este e-mail já está em uso!";
            } else {
                $senha_hash = !empty($senha_raw)
                    ? password_hash($senha_raw, PASSWORD_DEFAULT)
                    : password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);

                $username = gerarUsernameCadastro($email, $nome);
                $nivel_acesso = 'leitor';
                $tipo_login = !empty($google_sub) ? 'google' : 'local';
                $google_sub_db = !empty($google_sub) ? $google_sub : null;
                $google_id_db = !empty($google_sub) ? $google_sub : null;
                $foto_db = !empty($foto) ? $foto : null;

                $ins = $mysqli->prepare("
                    INSERT INTO usuarios
                        (username, nome, sobrenome, email, data_nascimento, telefone, endereco,
                         senha, google_sub, google_id, foto, nivel_acesso, tipo_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                if (!$ins) {
                    throw new Exception("Falha ao preparar cadastro.");
                }

                $ins->bind_param(
                    "sssssssssssss",
                    $username,
                    $nome,
                    $sobrenome,
                    $email,
                    $data_nascimento,
                    $telefone,
                    $endereco,
                    $senha_hash,
                    $google_sub_db,
                    $google_id_db,
                    $foto_db,
                    $nivel_acesso,
                    $tipo_login
                );

                if ($ins->execute()) {
                    $sel = $mysqli->prepare("
                        SELECT id_usuario, username, email, senha, nivel_acesso,
                               nome, sobrenome, avatar, foto, tipo_login, google_sub
                        FROM usuarios WHERE id_usuario = ? LIMIT 1
                    ");

                    if (!$sel) {
                        throw new Exception("Falha ao preparar sessão do novo usuário.");
                    }

                    $novoId = $mysqli->insert_id;
                    $sel->bind_param("i", $novoId);
                    $sel->execute();
                    $usuario = $sel->get_result()->fetch_assoc();

                    criarSessaoUsuario($usuario);
                    header("Location: /Biblioteca-Andromeda/catalogo");
                    exit;
                }

                $erro = "Erro ao criar conta. Tente novamente.";
            }
        } catch (Throwable $e) {
            error_log("Erro no cadastro de leitor: " . $e->getMessage());
            $erro = "Não foi possível concluir seu cadastro agora. Revise os dados e tente novamente.";
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
    <link rel="stylesheet" href="/Biblioteca-Andromeda/assets/css/pgcadleitores.css">
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <div id="grain"></div>
    <div id="webgl"></div>

    <div id="reticle">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="14" class="ret-ring" stroke-dasharray="88" stroke-dashoffset="0">
                <animateTransform attributeName="transform" type="rotate" values="0 18 18;360 18 18" dur="18s" repeatCount="indefinite"/>
            </circle>
            <line x1="18" y1="4"  x2="18" y2="10" class="ret-cross"/>
            <line x1="18" y1="26" x2="18" y2="32" class="ret-cross"/>
            <line x1="4"  y1="18" x2="10" y2="18" class="ret-cross"/>
            <line x1="26" y1="18" x2="32" y2="18" class="ret-cross"/>
            <circle cx="18" cy="18" r="1.5" fill="rgba(42,162,246,0.6)"/>
        </svg>
    </div>
    <div id="reticle-dot"></div>

    <main class="auth-wrapper">
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

            <form method="POST" action="/Biblioteca-Andromeda/cadastro-leitores" novalidate>

                <?php if (!empty($erro)): ?>
                    <div class="auth-error reveal-error">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span><?= htmlspecialchars($erro, ENT_QUOTES, 'UTF-8') ?></span>
                    </div>
                <?php endif; ?>

                <div class="form-section-label">Identificação</div>
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <input type="text" name="nome" id="campo_nome" class="form-control interactable" placeholder="Nome" value="<?= htmlspecialchars($nome, ENT_QUOTES, 'UTF-8') ?>" required>
                    </div>
                    <div class="col-md-6">
                        <input type="text" name="sobrenome" id="campo_sobrenome" class="form-control interactable" placeholder="Sobrenome" value="<?= htmlspecialchars($sobrenome, ENT_QUOTES, 'UTF-8') ?>" required>
                    </div>
                </div>

                <div class="form-section-label">Contato</div>
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <input type="email" name="email" id="campo_email" class="form-control interactable" placeholder="E-mail" value="<?= htmlspecialchars($email, ENT_QUOTES, 'UTF-8') ?>" required>
                    </div>
                    <div class="col-md-6">
                        <input type="date" name="data_nascimento" id="campo_data_nascimento" class="form-control interactable" title="Data de Nascimento" value="<?= htmlspecialchars($data_nascimento, ENT_QUOTES, 'UTF-8') ?>" required>
                    </div>
                </div>

                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <input type="text" name="telefone" id="campo_telefone" class="form-control interactable" placeholder="Telefone" value="<?= htmlspecialchars($telefone, ENT_QUOTES, 'UTF-8') ?>" required>
                    </div>
                    <div class="col-md-6">
                        <input type="text" name="endereco" id="campo_endereco" class="form-control interactable" placeholder="Endereço" value="<?= htmlspecialchars($endereco, ENT_QUOTES, 'UTF-8') ?>" required>
                    </div>
                </div>

                <div class="form-section-label">Segurança</div>
                <div class="pass-wrap mb-4">
                    <input type="password" name="senha" id="campo_senha" class="form-control interactable" placeholder="Senha" required>
                    <button type="button" class="pass-toggle" tabindex="-1">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>

                <input type="hidden" name="google_sub" id="google_sub_field" value="<?= htmlspecialchars($google_sub, ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="foto" id="foto_field" value="<?= htmlspecialchars($foto, ENT_QUOTES, 'UTF-8') ?>">

                <button type="submit" class="btn-prim interactable">Iniciar Jornada</button>

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
                    <a href="/Biblioteca-Andromeda/login" class="interactable">Já possui uma conta? Acessar</a>
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
    <script src="/Biblioteca-Andromeda/assets/js/animecadleitores.js"></script>

    <script>
    function andromedaNotify(message, type = "success") {
        let layer = document.querySelector(".andromeda-alert-layer");

        if (!layer) {
            layer = document.createElement("div");
            layer.className = "andromeda-alert-layer";
            document.body.appendChild(layer);
        }

        layer.innerHTML = "";

        const alertBox = document.createElement("div");
        alertBox.className = `andromeda-alert ${type}`;

        const icon = type === "error" ? "fa-triangle-exclamation" : "fa-circle-check";

        alertBox.innerHTML = `
            <span class="andromeda-alert-icon"><i class="fa-solid ${icon}"></i></span>
            <span class="andromeda-alert-message">${message}</span>
        `;

        layer.appendChild(alertBox);

        window.clearTimeout(window.__andromedaAlertTimer);
        window.__andromedaAlertTimer = window.setTimeout(() => {
            alertBox.classList.add("leaving");
            window.setTimeout(() => alertBox.remove(), 460);
        }, 4200);
    }

    function limparEstadoCampos() {
        document.querySelectorAll(".is-invalid-cosmic").forEach(campo => {
            campo.classList.remove("is-invalid-cosmic");
        });
    }

    function marcarCampoInvalido(campo, mensagem) {
        limparEstadoCampos();
        campo.classList.add("is-invalid-cosmic");
        campo.focus({ preventScroll: false });
        andromedaNotify(mensagem, "error");
    }

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.querySelector(".auth-card form");

        if (!form) return;

        form.addEventListener("submit", (event) => {
            const googleSub = document.getElementById("google_sub_field")?.value.trim() || "";
            const campos = [
                ["campo_nome", "Preencha seu nome para iniciar a jornada."],
                ["campo_sobrenome", "Preencha seu sobrenome para continuar."],
                ["campo_email", "Informe seu e-mail para criar sua conta."],
                ["campo_data_nascimento", "Informe sua data de nascimento."],
                ["campo_telefone", "Informe seu telefone."],
                ["campo_endereco", "Informe seu endereço."]
            ];

            for (const [id, mensagem] of campos) {
                const campo = document.getElementById(id);

                if (campo && campo.value.trim() === "") {
                    event.preventDefault();
                    marcarCampoInvalido(campo, mensagem);
                    return;
                }
            }

            const email = document.getElementById("campo_email");
            const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());

            if (!emailValido) {
                event.preventDefault();
                marcarCampoInvalido(email, "Informe um e-mail válido.");
                return;
            }

            const senha = document.getElementById("campo_senha");

            if (!googleSub && senha.value.trim() === "") {
                event.preventDefault();
                marcarCampoInvalido(senha, "Crie uma senha para proteger sua conta.");
                return;
            }

            if (!googleSub && senha.value.length < 6) {
                event.preventDefault();
                marcarCampoInvalido(senha, "A senha precisa ter pelo menos 6 caracteres.");
                return;
            }

            limparEstadoCampos();
        });
    });

    function handleCredentialResponse(response) {
        fetch("/Biblioteca-Andromeda/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential, modo: "cadastro" })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ja_cadastrado") {
                andromedaNotify("Conta encontrada. Redirecionando para o acervo...", "success");
                window.setTimeout(() => {
                    window.location.href = data.nivel_acesso === "admin" ? "/Biblioteca-Andromeda/adm" : "/Biblioteca-Andromeda/catalogo";
                }, 900);

            } else if (data.status === "novo_usuario") {
                document.getElementById("campo_nome").value = data.nome || "";
                document.getElementById("campo_sobrenome").value = data.sobrenome || "";
                document.getElementById("campo_email").value = data.email || "";
                document.getElementById("google_sub_field").value = data.google_sub || "";
                document.getElementById("foto_field").value = data.foto || "";

                const campoSenha = document.getElementById("campo_senha");
                campoSenha.removeAttribute("required");
                campoSenha.placeholder = "Senha opcional para login local";

                andromedaNotify("Dados do Google recebidos. Complete os campos restantes e inicie sua jornada.", "success");

            } else {
                andromedaNotify("Erro ao conectar com o Google. Tente novamente.", "error");
            }
        })
        .catch(() => {
            andromedaNotify("Falha de conexão. Verifique sua internet e tente novamente.", "error");
        });
    }
    </script>
</body>
</html>
