<?php
session_start();
include "../config/conexao.php";
include "../config/crud.php";

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
                header("Location: painel.php");
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
