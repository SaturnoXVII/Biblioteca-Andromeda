<!-- Página para o código PHP de administração -->
 <!-- Editar Catalogo -->
  <!-- Adicionar livros, autores e categorias -->



  <!-- Esse direcionamento podemos usar pro leitor tbm, mas adaptado com as funções dele -->
<?php
$pagina = $_GET['pagina'] ?? 'home';

include 'header.php';

switch ($pagina) {
    case 'catalogo':
        include 'pages/catalogo.php';
        break;
    case 'cadastro':
        include 'pages/cadastroadmin.php';
        break;
    default:
        include 'pages/index.php';
}

include 'footer.php';
?>


<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Guardião Board</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
  </head>
  <body>
    <h1>Bem vindo, Guardião!</h1>
    <div class="subtitulo">Aqui você pode gerenciar o catálogo de livros, autores e categorias. Além dos exploradores do acervo.</div>

    
    
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
  </body>
</html>