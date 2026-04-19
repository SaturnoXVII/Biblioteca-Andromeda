<?php
session_start();
include "../config/conexao.php";


// http://10.68.49.32/Biblioteca-Andromeda/

// Mudanças que fiz no banco:
// - Mudei o tipo da coluna senha para varchar(255) para poder armazenar as senhas criptografadas usando password_hash, que gera uma string mais longa do que 6 caracteres.



// verifica se as informações foram enviadas
if (isset($_POST['email']) && isset($_POST['senha'])) {
    // se as informações enviadas estiverem vazias, mostra essa mensagem
    if (empty($_POST['email'])) {
        echo "Preencha seu e-mail";
    } else if (empty($_POST['senha'])) {
        echo "Preencha sua senha";
    }
    // senão, ele armazena as informações em variáveis e continua o processo de login
    else {
        $email = $_POST['email'];
        $senha = $_POST['senha'];

        // Aqui substitui o código que jogava o email direto na query, agora ele vai guardar um espaço para o email usando o "?" e depois ele vai substituir esse espaço pelo valor da variável $email, usando o bind_param. Isso é importante para evitar ataques de SQL Injection

        $sql = "SELECT * FROM usuarios WHERE email = ?";
        $stmt = $mysqli->prepare($sql);

        // "s" indica que o parâmetro, no caso o email, é uma string (texto)
        $stmt->bind_param("s", $email);
        $stmt->execute();
        // Vai executar a consulta usando o email digitado no banco
        $result = $stmt->get_result();

        //    Se a consulta encontrar um usuário com esse email, ele pega os dados dele para verificar a senha
        if ($result->num_rows == 1) {
            $usuario = $result->fetch_assoc();

            //    A função do PHP password_verify compara a senha digitada pelo usuário com a senha criptofrafada do banco, se forem iguais ele conecta o usuário, se não, ele mostra a mensagem de erro. Isso é mais seguro do que armazenar as senhas em texto puro no banco, igual eu estava fazendo, porque mesmo que alguém consiga acessar o banco, ele não vai conseguir ver as senhas dos usuários
            // Ela é usada em conjunto com a função password_hash, sem ela não é possivel decodificar a senha, porque o password_hash gera uma string diferente a cada vez que é executada, mesmo que a senha seja a mesma, por isso é necessário usar o password_verify para comparar a senha digitada com a senha criptofrafada do banco
            if (password_verify($senha, $usuario['senha'])) {

                // Inicia a sessão para "lembrar" do usuário nas outras páginas
                if (!isset($_SESSION)) {
                    session_start();
                }
                // Guarda as informações do usuário na sessão, para que elas possam ser acessadas em outras páginas
                $_SESSION['id'] = $usuario['id'];
                $_SESSION['nome'] = $usuario['nome'];
                $_SESSION['tipo'] = $usuario['tipo'];

                // Redireciona para o catalogo ou painel, dependendo do tipo do usuário
                header("Location: catalogo.php");
                exit;
            } else {
                // Se a senha estiver incorreta
                echo "Falha ao logar! E-mail ou senha incorretos";
            }
        } else {
            // Se o e-mail não for encontrado
            echo "Falha ao logar! E-mail ou senha incorretos";
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
    
    <link rel="stylesheet" href="../assets/css/login.css">
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
        <div class="auth-card" id="Cadastro">
            <div class="auth-header">
                <h1 class="auth-brand">Andrômeda</h1>
                <div class="auth-subtitle">Identifique-se para acessar o acervo</div>
            </div>

            <form method="POST" action="">
                <div class="form-group">
                    <input type="text" name="email" placeholder="E-mail" required class="form-control">
                </div>
                <div class="form-group">
                    <input type="password" name="senha" placeholder="Senha" required class="form-control">
                </div>
                
                <button value="Entrar" type="submit" class="btn-prim interactable">Explorar o Universo</button>
                
                <div class="auth-links" id="adicionais">
                    <a href="recuperarsenha.php" class="interactable">Esqueceu sua senha?</a>
                    <a href="cadastroleitores.php" class="interactable">Não tem uma conta?</a>
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

    <script src="../assets/js/login.js">
     
    </script>
</body>
</html>