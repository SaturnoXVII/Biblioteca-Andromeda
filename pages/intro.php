<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Andrômeda — Catálogo Cósmico</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="preload" href="../assets/audio/Gravity_s_Maw.mp3" as="audio" type="audio/mpeg">
  <link rel="stylesheet" href="../assets/css/introducao.css">
</head>
<body>

  <!-- Música da intro -->
  <audio
    id="intro-music"
    src="../assets/audio/Gravity_s_Maw.mp3"
    preload="auto"
    playsinline
  ></audio>

  <!-- WebGL -->
  <div id="webgl-container" aria-hidden="true"></div>

  <!-- Grain -->
  <div id="grain" aria-hidden="true"></div>

  <!-- Letterbox -->
  <div class="letterbox" id="bar-top"    aria-hidden="true"></div>
  <div class="letterbox" id="bar-bottom" aria-hidden="true"></div>

  <!-- Overlays -->
  <div id="dive-vignette"   aria-hidden="true"></div>
  <div id="ui-fade-overlay" aria-hidden="true"></div>

  <!-- Scan line -->
  <div class="hud-scanline" aria-hidden="true"></div>

  <!-- HUD topo -->
  <header id="hud-top" aria-hidden="true">
    <div class="hud-pill">
      <span class="status-dot"></span>
      <span>NGC</span>
      <span class="val">224</span>
    </div>

    <div class="hud-pill">
      <span>RA</span>
      <span class="val">00h 42m 44s</span>
      &nbsp;·&nbsp;
      <span>DEC</span>
      <span class="val">+41° 16′ 09″</span>
    </div>
  </header>

  <!-- Conteúdo principal -->
  <main id="ui-layer">
    <section
      class="intro-content"
      id="intro-block"
      aria-label="Entrada do Catálogo Cósmico Andrômeda"
    >
      <!-- Pré-título -->
      <div class="pre-title-row" id="pre-title-row">
        <span class="pre-title-tick" aria-hidden="true"></span>
        <span class="pre-title-text">Catálogo Cósmico</span>
        <span class="pre-title-tick" aria-hidden="true"></span>
      </div>

      <!-- Título -->
      <h1 class="intro-title" id="title-text" data-title="Andrômeda">
        Andrômeda
      </h1>

      <!-- Subtítulo -->
      <p class="intro-sub" id="subtitle-text">
        Além do limiar do horizonte de eventos
      </p>

      <!-- Botão -->
      <a
        href="login.php"
        class="btn-entrar"
        id="btn-despertar"
        role="button"
        data-next="login.php"
        data-audio="../assets/audio/Gravity_s_Maw.mp3"
        aria-label="Despertar o portal de Andrômeda"
      >
        <span class="btn-sweep" aria-hidden="true"></span>
        <span class="btn-label">Despertar</span>
      </a>

      <!-- Dados astronômicos -->
      <div class="mag-info" id="mag-info">
        <span class="mag-item">
          <span>MV</span>
          <span class="mag-val">3.44</span>
        </span>
        <span class="mag-sep" aria-hidden="true">·</span>
        <span class="mag-item">
          <span>MB</span>
          <span class="mag-val">−21.5</span>
        </span>
        <span class="mag-sep" aria-hidden="true">·</span>
        <span class="mag-item">
          <span>1 Trilhão</span>
          <span class="mag-val">M☉</span>
        </span>
      </div>
    </section>
  </main>

  <!-- HUD inferior -->
  <footer id="hud-bot" aria-hidden="true">
    <span><strong>DIST</strong> 2.537 Mlpc</span>
    <span><strong>CLASS</strong> SA(s)b</span>
    <span><strong>MAG</strong> 3.44</span>
  </footer>

  <!-- Skip -->
  <a
    href="login.php"
    class="skip-btn"
    id="btn-skip-intro"
    aria-label="Pular introdução e ir para o login"
  >
    Pular <span aria-hidden="true">›</span>
  </a>

  <!-- Void transition -->
  <div id="void-transition" aria-hidden="true"></div>

  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>

  <script src="../assets/js/intro.js"></script>

</body>
</html>