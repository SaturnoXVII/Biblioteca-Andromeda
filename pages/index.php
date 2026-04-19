<?php
// session_start();
// include ("../config/conexao.php");
// include ("../config/crud.php");
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Andrômeda</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../assets/css/intro.css">
</head>
<body>

    <canvas id="grain-canvas"></canvas>
    <div class="letterbox" id="bar-top"></div>
    <div class="letterbox" id="bar-bottom"></div>
    <div id="dive-vignette"></div>
    <div id="ui-fade-overlay"></div>
    <div id="webgl-container"></div>

    <div class="cinematic-vignette" id="ui-layer">
        <div class="intro-content" id="intro-block">
            <div class="title-wrap">
                <h1 class="title" id="title-text">Andrômeda</h1>
            </div>
            <div class="subtitle-wrap">
                <p class="subtitle" id="subtitle-text">Catálogo Cósmico</p>
            </div>
            <div class="btn-wrap">
                <a href="#" class="btn-entrar" id="btn-despertar">Acessar Portal</a>
            </div>
        </div>
    </div>

    <div id="void-transition"></div>

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