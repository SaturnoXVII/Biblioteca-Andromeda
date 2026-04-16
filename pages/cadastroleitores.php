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
    $check = $mysqli->prepare("SELECT id FROM usuarios WHERE email = ?");
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

<!doctype html>
<html lang="pt-br">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cadastro</title>
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

        <h2>Bem vindo a Andromeda!</h3>
        <div class="subtitulo">Cadastre-se para explorar o acervo.</div>
       
        <div class="formulario card border rounded-4 m-4 mt-3 mx-auto">
          
            <form class="" method="POST" action="">
                <div class="row ">

                  <div class="col-md-6 mb-3"><input type="text" name="nome" class="form-control" placeholder="Nome" required></div>
                    <div class="col-md-6 "><input type="text" name="sobrenome" class="form-control" placeholder="Sobrenome"></div>
                    
                </div>

                <div class="row">

                   <div class="col-md-6 mb-3"> <input type="text" name="email" class="form-control" placeholder="E-mail" required></div>
                    <div class="col-md-6"><input type="date" name="data_nascimento" class="form-control" placeholder=""></div>
                    
                </div>

                <div class="row ">

                    <div class="col-md-6"><input type="text" name="telefone" class="form-control" placeholder="Telefone"></div>
                    <div class="col-md-6 mb-3"><input type="text" name="endereco" class="form-control" placeholder="Endereço"></div>
                    
                </div>            

                <!-- <input type="text" name="Username" class="form-control" placeholder="Username"> -->
                <input type="password" name="senha" class="form-control mb-3" placeholder="Senha" required>
               
                <button type="submit" class="btn">Cadastrar</button>
                <?php if (!empty($erro)): ?>
    <div class="alert alert-danger mt-3 rounded-3">
        ⚠️ <?= $erro ?>
    </div>
<?php endif; ?>

            </form>

        </div>
    </section>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
     <script src="../assets/js/estrelas.js"></script>
</body>

</html>