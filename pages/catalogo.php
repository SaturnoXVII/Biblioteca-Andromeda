


<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda</title>
    <link rel="stylesheet" href="../assets/css/catalogo.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
</head>
<body>
    <section class="container text-center my-4" id="Catalogo">
        <h1>Catálogo de Livros</h1>
        <div class="row row-cols-1 row-cols-md-3 g-4">
            <?php
            include "../config/conexao.php";
            $result = $mysqli->query("SELECT * FROM livros");
            while ($livro = $result->fetch_assoc()) {
                echo '<div class="col">';
                echo '  <div class="card h-100 shadow border-0 rounded-4">';
                echo '      <img src="../assets/img/' . $livro['capa'] . '" class="card-img-top" alt="' . $livro['titulo'] . '">';
                echo '      <div class="card-body">';
                echo '          <h5 class="card-title">' . $livro['titulo'] . '</h5>';
                echo '          <p class="card-text">Autor: ' . $livro['autor'] . '</p>';
                echo '          <p class="card-text">Gênero: ' . $livro['genero'] . '</p>';
                echo '          <p class="card-text">Ano: ' . $livro['ano'] . '</p>';
                echo '      </div>';
                echo '  </div>';
                echo '</div>';
            }
            ?>
        </div>
    </section>
    
</body>
</html>