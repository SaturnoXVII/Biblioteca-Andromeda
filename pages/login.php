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
<!-- Adicionar toast que avise que o email já está em uso -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/cadastro.css">

</head>

<body>
    <!-- Fundo cósmico -->
    <div id="estrelas"></div>
    <div class="nebula nebula-1"></div>
    <div class="nebula nebula-2"></div>
    <div class="nebula nebula-3"></div>
<section class="text-center my-4 " id="Cadastro">

    <h2>Olá!!</h2>
    <div class="subtitulo">Se identifique para ter acesso ao acervo.</div>
<div class="formulario card border rounded-4 m-4 mt-3 mx-auto">

    <form method="POST" action="">
        <input type="text" name="email" placeholder="E-mail" required class="form-control"><br>
        <input type="password" name="senha" placeholder="Senha" required class="form-control"><br>
        
        <button value="Entrar" type="submit" class="btn" class="form-control">Explorar</button>
        <div class="row g-2 mt-2" id="adicionais" >
            <div class="col-auto"><a href="recuperarsenha.php" class="">Esqueceu sua senha?</a></div>
            <div class="col-auto"><a href="cadastroleitores.php" class="">Não tem uma conta?</a></div>
        </div>
      
    </form>

</div>
</section>
 <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
     <script src="../assets/js/estrelas.js"></script>
</body>

</html>