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
    

    $senha = password_hash($_POST['senha'], PASSWORD_DEFAULT);

    $mysqli->query("INSERT INTO  usuarios (nome, sobrenome, email, data_nascimento, telefone, endereco, senha) VALUES ('$nome', '$sobrenome', '$email', '$nascimento', '$telefone', '$endereco', '$senha')");
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
    <section class="text-center my-4 " id="Cadastro">

        <h1>Bem vindo a Andromeda, se identifique para explorar o acervo!</h1>
        <div class="formulario card border rounded-4 m-4 mt-3 mx-auto">
          
            <form class="" method="POST" action="">
                <div class="row ">

                  <div class="col-md-6 mb-3"><input type="text" name="nome" class="form-control" placeholder="Nome" required></div>
                    <div class="col-md-6 "><input type="text" name="sobrenome" class="form-control" placeholder="Sobrenome"></div>
                    
                </div>

                <div class="row">

                   <div class="col-md-6 mb-3"> <input type="text" name="email" class="form-control" placeholder="E-mail" required></div>
                    <div class="col-md-6"><input type="text" name="data_nascimento" class="form-control" placeholder="Data de nascimento"></div>
                    
                </div>

                <div class="row ">

                    <div class="col-md-6"><input type="text" name="telefone" class="form-control" placeholder="Telefone"></div>
                    <div class="col-md-6 mb-3"><input type="text" name="endereco" class="form-control" placeholder="Endereço"></div>
                    
                </div>            

                <!-- <input type="text" name="Username" class="form-control" placeholder="Username"> -->
                <input type="password" name="senha" class="form-control mb-3" placeholder="Senha" required>
               
                <button type="submit" class="btn">Cadastrar</button>
            </form>

        </div>
    </section>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</body>

</html>