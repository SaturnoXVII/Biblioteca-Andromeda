<!doctype html>
<html lang="pt-br">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/sidebar.css">
</head>

<body>
  <canvas id="starfield"></canvas>
  <nav id="sidebar">

    <div id="sidebar_content">
      <ul id="side_items">
        <li class="side-item active">
          <a href="#">

            <i class="fa-solid fa-book-open"></i>
            <span class="item-description">Cátalogo

            </span>
          </a>
        </li>

        <li class="side-item">
          <a href="#">

            <i class="fa-solid fa-book"></i>

            <span class="item-description">Gerenciar estrelas</span>
          </a>
        </li>

        <li class="side-item">
          <a href="#">

           <i class="fa-solid fa-users"></i>
            <span class="item-description">Gerenciar <br> exploradores</span>
          </a>
        </li>

        <li class="side-item">
          <a href="#">

            <i class="fa-solid fa-box-archive"></i>
            <span class="item-description">Gerenciar galáxias</span>
          </a>
        </li>

      

      </ul>

      <button id="open_btn">
       <i class="fa-solid fa-angles-right" id="open_btn_icon"></i>
      </button>

    </div>

    <div id="logout">
      <button id="logout_btn">
        <i class="fa-solid fa-right-from-bracket"></i>
        <span id="item-description">Sair</span>
      </button>
    </div>



  </nav>

  <main>
    <div class="nebula nebula-1"></div>
    <div class="nebula nebula-2"></div>

    <div class="section-tag">Sistema Estelar · Setor Alpha</div>
    <div class="main-title">
      <h1>Bem vindo, <span class="highlight">Guardião</span>!
      </h1>

    </div>
    <div class="divider"></div>
    <div class="subtitulo">Aqui você pode gerenciar o catálogo de livros, autores e categorias. Além dos exploradores do acervo.</div>
  </main>



  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
  <script src="../assets/js/sidebar.js"></script>
</body>

</html>