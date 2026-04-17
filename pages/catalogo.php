<?php
session_start();
require_once "../config/conexao.php";
require_once "../config/dados.php";
$mysqli->set_charset("utf8mb4");

$repo = new \App\Repository\LivroRepository($mysqli);
try {
    $livros = $repo->listarTodos();
} catch (Exception $e) {
    die("Erro: " . htmlspecialchars($e->getMessage()));
}

$livros    = $livros ?? [];
$livrosJson = json_encode($livros, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?: '[]';
$totalLivros = count($livros);
$categorias  = array_values(array_filter(array_unique(array_column($livros, 'categoria_nome'))));
$totalCats   = count($categorias);
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biblioteca Andrômeda · Catálogo Cósmico</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://unpkg.com/aos@2.3.4/dist/aos.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* ══════════════════════════════════════════════
           VARIÁVEIS & RESET (MODERNO ESPACIAL)
        ══════════════════════════════════════════════ */
        :root {
            /* Cores de Destaque - Neon Cyan & Eletric Violet */
            --mg: #00E5FF; 
            --mg2: #8A2BE2; 
            --mg-glow: rgba(0, 229, 255, 0.45);
            --mg-glow2: rgba(138, 43, 226, 0.35);
            --mg-dim: rgba(0, 229, 255, 0.15);
            
            /* Fundo - Deep Space / Vantablack */
            --void: #020108; 
            --glass: rgba(6, 4, 16, 0.65);
            --glass-b: rgba(255, 255, 255, 0.04);
            
            /* Tipografia - Starlight White */
            --text: #F8F9FA;
            --text-dim: rgba(255, 255, 255, 0.45);
            --nav-w: 64px;
            --nav-we: 236px;
            --nav-dur: 0.42s;
            
            /* Editorial Palette - Cyber/Sci-Fi Focus */
            --ed-bg: #03020A;
            --ed-surface: #090714;
            --ed-border: rgba(255, 255, 255, 0.03);
            --ed-cream: #E2E8F0; 
            --ed-gold: #00E5FF; /* Substituindo ouro por ciano no modo editorial */
        }

        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html,
        body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: var(--void);
            font-family: 'DM Sans', sans-serif;
            color: #fff;
        }

        * {
            cursor: none !important;
        }

        /* ══════════════════════════════════════════════
   CANVAS & GRAIN
══════════════════════════════════════════════ */
        #webgl {
            position: fixed;
            inset: 0;
            z-index: 1;
        }

        #grain {
            position: fixed;
            inset: 0;
            z-index: 7;
            pointer-events: none;
            /* SVG Noise gerado nativamente, infinitamente mais leve que Canvas JS */
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.05;
            mix-blend-mode: overlay;
        }

        #canvas-dim {
            position: fixed;
            inset: 0;
            z-index: 2;
            pointer-events: none;
            background: rgba(0, 0, 5, 0);
            transition: background 0.8s;
        }

        #canvas-dim.dimmed {
            background: rgba(0, 0, 8, 0.82);
        }

        /* ══════════════════════════════════════════════
   CURSOR PERSONALIZADO
══════════════════════════════════════════════ */
        #ring {
            position: fixed;
            pointer-events: none;
            z-index: 9000;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            transform: translate(-50%, -50%);
            transition: width .3s cubic-bezier(.23, 1, .32, 1), height .3s cubic-bezier(.23, 1, .32, 1), border-color .3s, opacity .25s, background .3s;
            opacity: .7;
            mix-blend-mode: screen;
        }

        #ring-inner {
            position: fixed;
            pointer-events: none;
            z-index: 9001;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            transform: translate(-50%, -50%);
            transition: width .15s, height .15s, opacity .15s, background-color .3s;
            opacity: .9;
        }

        #ring.hover {
            width: 56px;
            height: 56px;
            border-color: rgba(0, 229, 255, 0.9);
            box-shadow: 0 0 24px rgba(0, 229, 255, 0.35);
        }

        #ring-inner.hover {
            width: 3px;
            height: 3px;
        }

        #ring.click {
            width: 20px;
            height: 20px;
            border-color: rgba(255, 255, 255, 0.8);
        }

        /* ══════════════════════════════════════════════
   TOOLTIP
══════════════════════════════════════════════ */
        #tip {
            position: fixed;
            z-index: 8500;
            pointer-events: none;
            background: rgba(3, 0, 12, 0.96);
            border: 1px solid rgba(0, 229, 255, 0.35);
            border-radius: 10px;
            padding: 7px 14px;
            font-size: 0.7rem;
            font-family: 'Cinzel', serif;
            color: rgba(255, 255, 255, 0.88);
            letter-spacing: 0.06em;
            opacity: 0;
            transition: opacity .18s;
            white-space: nowrap;
            max-width: 260px;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 4px 28px rgba(0, 0, 0, 0.6), 0 0 18px rgba(0, 229, 255, 0.12);
        }

        #tip.show {
            opacity: 1;
        }

        #tip .tip-cat {
            display: block;
            font-size: 0.55rem;
            color: rgba(255, 255, 255, 0.35);
            letter-spacing: 0.14em;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        #tip .tip-title {
            display: block;
            font-size: 0.74rem;
            color: #fff;
        }

        #tip .tip-author {
            display: block;
            font-size: 0.6rem;
            color: rgba(255, 255, 255, 0.4);
            font-family: 'DM Sans', sans-serif;
            font-style: italic;
            margin-top: 2px;
        }

        /* ══════════════════════════════════════════════
   NAVBAR LATERAL
══════════════════════════════════════════════ */
        #nav {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: var(--nav-w);
            z-index: 200;
            background: rgba(2, 0, 9, 0.68);
            backdrop-filter: blur(36px) saturate(1.9);
            -webkit-backdrop-filter: blur(36px) saturate(1.9);
            border-right: 1px solid var(--glass-b);
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 20px 0;
            transition: width var(--nav-dur) cubic-bezier(.23, 1, .32, 1);
            overflow: hidden;
        }

        #nav:hover {
            width: var(--nav-we);
        }

        #nav::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0, 229, 255, 0.05) 0%, transparent 40%, rgba(138, 43, 226, 0.05) 100%);
            pointer-events: none;
        }

        .nav-logo {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 4px 16px 24px;
        }

        .nav-logo-orb {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            flex-shrink: 0;
            background: radial-gradient(circle at 38% 36%, #fff 0%, var(--mg) 60%, var(--mg2) 100%);
            box-shadow: 0 0 28px var(--mg-glow), 0 0 56px var(--mg-glow2);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: orbPulse 4s ease-in-out infinite;
        }

        @keyframes orbPulse {

            0%,
            100% {
                box-shadow: 0 0 28px var(--mg-glow), 0 0 56px var(--mg-glow2);
            }

            50% {
                box-shadow: 0 0 48px var(--mg-glow), 0 0 96px var(--mg-glow2);
            }
        }

        .nav-logo-orb i {
            font-size: .78rem;
            color: rgba(255, 255, 255, .9);
        }

        .nav-logo-text {
            font-family: 'Cinzel', serif;
            font-size: .68rem;
            font-weight: 700;
            letter-spacing: .18em;
            white-space: nowrap;
            text-transform: uppercase;
            background: linear-gradient(90deg, #fff 0%, var(--mg) 55%, var(--mg2) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            opacity: 0;
            transition: opacity .2s .1s;
        }

        #nav:hover .nav-logo-text {
            opacity: 1;
        }

        .nav-div {
            width: calc(100% - 28px);
            margin: 0 14px 8px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
            flex-shrink: 0;
        }

        .nav-sec {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 0 8px;
            flex: 1;
        }

        .nav-foot {
            width: 100%;
            padding: 8px 8px 0;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 11px 10px;
            border-radius: 12px;
            cursor: pointer !important;
            text-decoration: none !important;
            white-space: nowrap;
            position: relative;
            transition: background .25s, transform .22s;
            color: inherit;
        }

        .nav-item:hover {
            background: var(--mg-dim);
            transform: translateX(3px);
        }

        .nav-item.active {
            background: rgba(0, 229, 255, 0.22);
        }

        .nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 22%;
            height: 56%;
            width: 3px;
            border-radius: 0 4px 4px 0;
            background: linear-gradient(180deg, var(--mg), var(--mg2));
            box-shadow: 0 0 14px var(--mg-glow);
        }

        .nav-item i {
            width: 28px;
            text-align: center;
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.5);
            flex-shrink: 0;
            transition: color .25s;
        }

        .nav-item:hover i,
        .nav-item.active i {
            color: rgba(255, 255, 255, 0.92);
        }

        .nav-item span {
            font-size: .7rem;
            font-weight: 500;
            letter-spacing: .09em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .65);
            opacity: 0;
            transition: opacity .18s .07s;
        }

        #nav:hover .nav-item span {
            opacity: 1;
        }

        /* ══════════════════════════════════════════════
   HUD TOPO
══════════════════════════════════════════════ */
        #hud {
            position: fixed;
            top: 0;
            left: var(--nav-w);
            right: 0;
            z-index: 150;
            padding: 14px 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(to bottom, rgba(0, 0, 8, .84) 0%, transparent 100%);
            pointer-events: auto;
        }

        .hud-search {
            display: flex;
            align-items: center;
            gap: 9px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 100px;
            padding: 8px 18px;
            backdrop-filter: blur(20px);
            min-width: 220px;
            max-width: 300px;
            position: relative;
            overflow: hidden;
            transition: border-color .3s, box-shadow .3s, background .3s;
        }

        .hud-search::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(0, 229, 255, 0.06), rgba(138, 43, 226, 0.06));
            opacity: 0;
            transition: opacity .3s;
        }

        .hud-search:focus-within::before {
            opacity: 1;
        }

        .hud-search:focus-within {
            border-color: rgba(0, 229, 255, 0.55);
            box-shadow: 0 0 32px rgba(0, 229, 255, 0.2), 0 0 0 1px rgba(138, 43, 226, 0.12) inset;
        }

        .hud-search i {
            color: var(--text-dim);
            font-size: .82rem;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
        }

        .hud-search input {
            background: none;
            border: none;
            outline: none;
            color: #fff;
            font-family: 'DM Sans', sans-serif;
            font-size: .82rem;
            font-weight: 400;
            letter-spacing: .04em;
            width: 100%;
            position: relative;
            z-index: 1;
        }

        .hud-search input::placeholder {
            color: rgba(255, 255, 255, 0.22);
        }

        .search-count {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            font-size: .6rem;
            font-family: 'Space Mono', monospace;
            color: rgba(255, 255, 255, 0.35);
            background: rgba(255, 255, 255, 0.06);
            padding: 2px 7px;
            border-radius: 100px;
            opacity: 0;
            transition: opacity .2s;
            z-index: 2;
        }

        .search-count.show {
            opacity: 1;
        }

        #pills {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            flex: 1;
            scrollbar-width: none;
        }

        #pills::-webkit-scrollbar {
            display: none;
        }

        .pill {
            background: rgba(255, 255, 255, 0.032);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 100px;
            padding: 5px 14px;
            font-size: .65rem;
            font-family: 'DM Sans', sans-serif;
            font-weight: 500;
            letter-spacing: .07em;
            text-transform: uppercase;
            color: var(--text-dim);
            cursor: pointer !important;
            white-space: nowrap;
            transition: all .28s cubic-bezier(.23, 1, .32, 1);
            position: relative;
            overflow: hidden;
        }

        .pill::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, var(--mg), var(--mg2));
            opacity: 0;
            transition: opacity .28s;
            border-radius: inherit;
        }

        .pill span {
            position: relative;
            z-index: 1;
        }

        .pill:hover,
        .pill.on {
            border-color: rgba(0, 229, 255, 0.5);
            color: #fff;
            box-shadow: 0 0 20px rgba(0, 229, 255, 0.18);
        }

        .pill.on::after {
            opacity: 0.24;
        }

        .view-tog {
            display: flex;
            gap: 3px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--glass-b);
            border-radius: 12px;
            padding: 3px;
            flex-shrink: 0;
        }

        .view-tog button {
            background: none;
            border: none;
            color: var(--text-dim);
            padding: 6px 10px;
            border-radius: 8px;
            cursor: pointer !important;
            font-size: .9rem;
            transition: all .25s;
        }

        .view-tog button.on {
            background: linear-gradient(135deg, rgba(0, 229, 255, .3), rgba(138, 43, 226, .2));
            color: #fff;
            box-shadow: 0 0 14px rgba(0, 229, 255, .22);
        }

        .view-tog button:hover {
            color: rgba(255, 255, 255, 0.7);
        }

        /* ══════════════════════════════════════════════
   HUD INFERIOR
══════════════════════════════════════════════ */
        #hud-bot {
            position: fixed;
            bottom: 20px;
            left: calc(var(--nav-w) + 22px);
            z-index: 150;
            display: flex;
            gap: 18px;
            font-size: .65rem;
            font-family: 'Space Mono', monospace;
            letter-spacing: .06em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .25);
            pointer-events: none;
            transition: opacity .4s;
        }

        #hud-bot span {
            display: flex;
            align-items: center;
            gap: 7px;
        }

        #hud-bot strong {
            color: rgba(255, 255, 255, .55);
        }

        #depth {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 150;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            pointer-events: none;
            transition: opacity .4s;
        }

        .depth-lbl {
            font-size: .52rem;
            letter-spacing: .14em;
            text-transform: uppercase;
            font-family: 'Cinzel', serif;
            color: rgba(255, 255, 255, .18);
            writing-mode: vertical-rl;
        }

        .depth-track {
            width: 2px;
            height: 110px;
            background: linear-gradient(to bottom, rgba(0, 229, 255, .25), rgba(138, 43, 226, .25));
            border-radius: 4px;
            position: relative;
        }

        .depth-dot {
            position: absolute;
            left: 50%;
            top: 0%;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--mg), var(--mg2));
            box-shadow: 0 0 14px var(--mg-glow), 0 0 7px var(--mg-glow2);
            transform: translate(-50%, 0);
            transition: top .4s cubic-bezier(.23, 1, .32, 1);
        }

        /* ══════════════════════════════════════════════
   CAT LABEL & SEARCH LABEL
══════════════════════════════════════════════ */
        #cat-label {
            position: fixed;
            left: 50%;
            top: 90px;
            transform: translateX(-50%);
            z-index: 160;
            pointer-events: none;
            font-family: 'Cinzel', serif;
            font-size: .78rem;
            letter-spacing: .3em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .82);
            text-shadow: 0 0 28px var(--mg-glow);
            opacity: 0;
            transition: opacity .5s;
            background: rgba(0, 0, 0, 0.55);
            padding: 7px 20px;
            border-radius: 100px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            backdrop-filter: blur(14px);
        }

        #fly-label {
            position: fixed;
            left: 50%;
            top: 128px;
            transform: translateX(-50%);
            z-index: 160;
            pointer-events: none;
            font-family: 'DM Sans', sans-serif;
            font-size: .68rem;
            letter-spacing: .14em;
            color: rgba(255, 255, 255, .5);
            opacity: 0;
            transition: opacity .4s;
        }

        /* ══════════════════════════════════════════════
   PAINEL LATERAL DE LIVRO (LIQUID GLASS)
══════════════════════════════════════════════ */
        #book-panel {
            position: fixed;
            right: -440px;
            top: 50%;
            transform: translateY(-50%);
            width: 400px;
            z-index: 300;
            background: linear-gradient(145deg, rgba(8, 4, 20, 0.72) 0%, rgba(3, 0, 14, 0.9) 100%);
            backdrop-filter: blur(48px) brightness(1.12) saturate(1.3);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-right: none;
            border-radius: 28px 0 0 28px;
            padding: 0;
            transition: right .7s cubic-bezier(0.16, 1, 0.3, 1);
            overflow: hidden;
            box-shadow: -24px 0 72px rgba(0, 0, 0, 0.8), inset 1px 1px 0 rgba(255, 255, 255, 0.1);
        }

        #book-panel.open {
            right: 0;
        }

        #book-panel::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(ellipse at 0% 0%, rgba(0, 229, 255, 0.18) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(138, 43, 226, 0.12) 0%, transparent 55%);
            pointer-events: none;
        }

        .bp-art {
            width: 100%;
            height: 180px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .bp-art canvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        .bp-art-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 80px;
            background: linear-gradient(to top, rgba(8, 4, 20, 0.92), transparent);
        }

        .bp-close {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer !important;
            color: rgba(255, 255, 255, 0.55);
            font-size: .85rem;
            transition: all .22s;
        }

        .bp-close:hover {
            background: var(--mg-dim);
            color: #fff;
            border-color: rgba(0, 229, 255, 0.4);
        }

        .bp-body {
            padding: 20px 24px 24px;
            position: relative;
            z-index: 1;
        }

        .bp-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 14px;
        }

        .bp-cat {
            display: inline-block;
            font-size: .58rem;
            letter-spacing: .14em;
            text-transform: uppercase;
            font-family: 'Cinzel', serif;
            padding: 4px 12px;
            border-radius: 100px;
            background: rgba(0, 229, 255, 0.14);
            border: 1px solid rgba(0, 229, 255, 0.3);
            color: rgba(255, 255, 255, 0.65);
        }

        .bp-title {
            font-family: 'Cinzel', serif;
            font-size: 1.15rem;
            font-weight: 700;
            line-height: 1.32;
            margin-bottom: 6px;
            color: #fff;
        }

        .bp-author {
            font-size: .82rem;
            color: var(--text-dim);
            margin-bottom: 20px;
            font-weight: 300;
            font-style: italic;
        }

        .bp-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 22px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.035);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .bp-field label {
            display: block;
            font-size: .58rem;
            letter-spacing: .14em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .3);
            margin-bottom: 4px;
            font-family: 'Space Mono', monospace;
        }

        .bp-field .val {
            font-size: .84rem;
            color: rgba(255, 255, 255, .85);
            font-weight: 500;
        }

        .bp-actions {
            display: flex;
            gap: 10px;
        }

        /* ══════════════════════════════════════════════
   BADGES DE STATUS
══════════════════════════════════════════════ */
        .sbadge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 100px;
            font-size: .62rem;
            font-weight: 600;
            letter-spacing: .07em;
            text-transform: uppercase;
        }

        .sbadge::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .sbadge.s-disp {
            background: rgba(34, 197, 94, 0.12);
            color: #4ade80;
            border: 1px solid rgba(34, 197, 94, 0.28);
        }

        .sbadge.s-disp::before {
            background: #4ade80;
            box-shadow: 0 0 8px #4ade80;
            animation: dotPulse 2s ease-in-out infinite;
        }

        .sbadge.s-empr {
            background: rgba(239, 68, 68, 0.12);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.28);
        }

        .sbadge.s-empr::before {
            background: #f87171;
        }

        .sbadge.s-res {
            background: rgba(251, 146, 60, 0.12);
            color: #fb923c;
            border: 1px solid rgba(251, 146, 60, 0.28);
        }

        .sbadge.s-res::before {
            background: #fb923c;
        }

        .sbadge.s-unk {
            background: rgba(148, 163, 184, 0.08);
            color: rgba(255, 255, 255, .38);
            border: 1px solid rgba(255, 255, 255, .08);
        }

        .sbadge.s-unk::before {
            background: rgba(255, 255, 255, .3);
        }

        @keyframes dotPulse {

            0%,
            100% {
                opacity: 1;
            }

            50% {
                opacity: .35;
            }
        }

        /* ══════════════════════════════════════════════
   BOTÕES
══════════════════════════════════════════════ */
        .btn-prim {
            flex: 1;
            padding: 12px;
            cursor: pointer !important;
            background: linear-gradient(135deg, var(--mg) 0%, var(--mg2) 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-family: 'Cinzel', serif;
            font-size: .72rem;
            letter-spacing: .18em;
            text-transform: uppercase;
            transition: all .32s;
            position: relative;
            overflow: hidden;
        }

        .btn-prim::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, .15), transparent);
            opacity: 0;
            transition: opacity .3s;
        }

        .btn-prim:hover::after {
            opacity: 1;
        }

        .btn-prim:hover {
            box-shadow: 0 0 32px var(--mg-glow), 0 0 16px var(--mg-glow2);
            letter-spacing: .22em;
        }

        .btn-prim:active {
            transform: scale(0.97);
        }

        .btn-sec {
            padding: 12px 16px;
            background: rgba(255, 255, 255, .04);
            border: 1px solid rgba(255, 255, 255, .08);
            border-radius: 12px;
            color: rgba(255, 255, 255, .55);
            cursor: pointer !important;
            font-size: 1rem;
            transition: all .25s;
        }

        .btn-sec:hover {
            background: rgba(255, 255, 255, .09);
            color: #fff;
        }

        /* ══════════════════════════════════════════════
   MODAL REDESENHADO — DRAWER IMERSIVO
══════════════════════════════════════════════ */
        #modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 500;
            background: rgba(0, 0, 10, .88);
            backdrop-filter: blur(32px) saturate(1.4);
            opacity: 0;
            pointer-events: none;
            transition: opacity .42s;
            display: flex;
            align-items: stretch;
            justify-content: flex-end;
        }

        #modal-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }

        #modal-drawer {
            width: min(580px, 95vw);
            height: 100%;
            background: linear-gradient(160deg, rgba(10, 4, 24, .98) 0%, rgba(4, 0, 16, .99) 100%);
            border-left: 1px solid rgba(255, 255, 255, .07);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: translateX(100%);
            transition: transform .75s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: -40px 0 100px rgba(0, 0, 0, .9);
        }

        #modal-overlay.open #modal-drawer {
            transform: translateX(0);
        }

        .md-cover {
            width: 100%;
            height: 260px;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
        }

        .md-cover canvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        .md-cover-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0, 0, 0, .1) 0%, rgba(10, 4, 24, .65) 60%, rgba(10, 4, 24, 1) 100%);
        }

        .md-cover-badge {
            position: absolute;
            top: 16px;
            left: 20px;
            font-family: 'Space Mono', monospace;
            font-size: .6rem;
            letter-spacing: .14em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .55);
            background: rgba(0, 0, 0, .45);
            padding: 5px 12px;
            border-radius: 100px;
            border: 1px solid rgba(255, 255, 255, .1);
            backdrop-filter: blur(8px);
        }

        .md-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            border-radius: 12px;
            background: rgba(0, 0, 0, .5);
            border: 1px solid rgba(255, 255, 255, .12);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer !important;
            color: rgba(255, 255, 255, .55);
            font-size: .9rem;
            transition: all .22s;
            z-index: 10;
        }

        .md-close:hover {
            background: var(--mg-dim);
            color: #fff;
            border-color: rgba(0, 229, 255, .45);
        }

        .md-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 0 28px 32px;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 229, 255, .3) transparent;
        }

        .md-scroll::-webkit-scrollbar {
            width: 3px;
        }

        .md-scroll::-webkit-scrollbar-thumb {
            background: rgba(0, 229, 255, .3);
            border-radius: 3px;
        }

        .md-title-block {
            padding: 24px 0 20px;
            border-bottom: 1px solid rgba(255, 255, 255, .06);
            margin-bottom: 24px;
        }

        .md-status-row {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 14px;
            flex-wrap: wrap;
        }

        .md-title {
            font-family: 'Cinzel', serif;
            font-size: 1.6rem;
            font-weight: 700;
            line-height: 1.28;
            margin-bottom: 8px;
            color: #fff;
        }

        .md-author {
            font-size: .95rem;
            color: var(--text-dim);
            font-weight: 300;
            font-style: italic;
        }

        .md-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 28px;
        }

        .md-field {
            background: rgba(255, 255, 255, .03);
            border: 1px solid rgba(255, 255, 255, .06);
            border-radius: 14px;
            padding: 14px 16px;
        }

        .md-field label {
            display: block;
            font-size: .58rem;
            font-family: 'Space Mono', monospace;
            letter-spacing: .14em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .28);
            margin-bottom: 6px;
        }

        .md-field .v {
            font-size: .9rem;
            color: rgba(255, 255, 255, .82);
            font-weight: 500;
        }

        .md-related-title {
            font-family: 'Cinzel', serif;
            font-size: .75rem;
            letter-spacing: .18em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .38);
            margin-bottom: 14px;
        }

        .md-related-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .md-related-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, .03);
            border: 1px solid rgba(255, 255, 255, .06);
            border-radius: 12px;
            cursor: pointer !important;
            transition: all .22s;
        }

        .md-related-item:hover {
            background: rgba(0, 229, 255, .12);
            border-color: rgba(0, 229, 255, .3);
        }

        .md-related-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .md-related-info {
            flex: 1;
            min-width: 0;
        }

        .md-related-info strong {
            display: block;
            font-size: .8rem;
            font-weight: 500;
            color: rgba(255, 255, 255, .8);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .md-related-info span {
            font-size: .7rem;
            color: rgba(255, 255, 255, .35);
            font-style: italic;
        }

        .md-actions {
            padding: 20px 28px;
            border-top: 1px solid rgba(255, 255, 255, .06);
            display: flex;
            gap: 12px;
            flex-shrink: 0;
            background: rgba(4, 0, 16, .95);
        }

        .md-btn-main {
            flex: 1;
            padding: 14px;
            cursor: pointer !important;
            background: linear-gradient(135deg, var(--mg) 0%, var(--mg2) 100%);
            border: none;
            border-radius: 14px;
            color: #fff;
            font-family: 'Cinzel', serif;
            font-size: .78rem;
            letter-spacing: .2em;
            text-transform: uppercase;
            transition: all .32s;
            position: relative;
            overflow: hidden;
        }

        .md-btn-main::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, .12);
            opacity: 0;
            transition: opacity .3s;
        }

        .md-btn-main:hover::after {
            opacity: 1;
        }

        .md-btn-main:hover {
            box-shadow: 0 0 40px var(--mg-glow), 0 0 20px var(--mg-glow2);
            letter-spacing: .25em;
        }

        .md-btn-sec {
            padding: 14px 18px;
            background: rgba(255, 255, 255, .05);
            border: 1px solid rgba(255, 255, 255, .09);
            border-radius: 14px;
            color: rgba(255, 255, 255, .55);
            cursor: pointer !important;
            font-size: 1rem;
            transition: all .25s;
        }

        .md-btn-sec:hover {
            background: rgba(255, 255, 255, .1);
            color: #fff;
        }

        /* ══════════════════════════════════════════════
   VISTA EDITORIAL — MODO MAGAZINE
══════════════════════════════════════════════ */
        #editorial-view {
            position: fixed;
            top: 0;
            bottom: 0;
            left: var(--nav-w);
            right: 0;
            z-index: 100;
            overflow-y: auto;
            opacity: 0;
            pointer-events: none;
            transition: opacity .6s;
            background: var(--ed-bg);
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 229, 255, .28) transparent;
        }

        #editorial-view.open {
            opacity: 1;
            pointer-events: auto;
        }

        #editorial-view::-webkit-scrollbar {
            width: 4px;
        }

        #editorial-view::-webkit-scrollbar-thumb {
            background: rgba(0, 229, 255, .28);
            border-radius: 4px;
        }

        /* Editorial Header */
        .ed-header {
            padding: 80px 60px 56px;
            background: linear-gradient(180deg, rgba(0, 229, 255, .08) 0%, transparent 100%);
            border-bottom: 1px solid rgba(255, 255, 255, .05);
            position: relative;
            overflow: hidden;
        }

        .ed-header::before {
            content: 'ANDRÔMEDA';
            position: absolute;
            top: -20px;
            right: -20px;
            font-family: 'Playfair Display', serif;
            font-size: 18vw;
            font-weight: 900;
            color: rgba(255, 255, 255, .018);
            line-height: 1;
            pointer-events: none;
            user-select: none;
            white-space: nowrap;
        }

        .ed-header-label {
            font-family: 'Space Mono', monospace;
            font-size: .65rem;
            letter-spacing: .22em;
            text-transform: uppercase;
            color: var(--ed-gold);
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .ed-header-label::before {
            content: '';
            width: 28px;
            height: 1px;
            background: var(--ed-gold);
        }

        .ed-header-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.4rem, 5vw, 4.2rem);
            font-weight: 700;
            line-height: 1.1;
            color: #fff;
            margin-bottom: 8px;
        }

        .ed-header-title em {
            font-style: italic;
            color: var(--ed-gold);
        }

        .ed-header-meta {
            display: flex;
            gap: 28px;
            margin-top: 24px;
            flex-wrap: wrap;
        }

        .ed-stat {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .ed-stat-num {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            font-weight: 700;
            color: #fff;
            line-height: 1;
        }

        .ed-stat-lbl {
            font-size: .65rem;
            font-family: 'Space Mono', monospace;
            letter-spacing: .14em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .35);
        }

        /* Hero Book (destaque editorial) */
        .ed-hero {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            border-bottom: 1px solid rgba(255, 255, 255, .05);
            min-height: 420px;
        }

        @media(max-width:768px) {
            .ed-hero {
                grid-template-columns: 1fr;
            }
        }

        .ed-hero-art {
            position: relative;
            overflow: hidden;
            background: rgba(255, 255, 255, .03);
            min-height: 320px;
        }

        .ed-hero-art canvas {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
        }

        .ed-hero-art-label {
            position: absolute;
            bottom: 20px;
            left: 20px;
            font-family: 'Space Mono', monospace;
            font-size: .58rem;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .42);
            background: rgba(0, 0, 0, .5);
            padding: 5px 11px;
            border-radius: 8px;
        }

        .ed-hero-content {
            padding: 52px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: linear-gradient(135deg, rgba(0, 229, 255, .06) 0%, transparent 50%);
        }

        .ed-hero-label {
            font-family: 'Space Mono', monospace;
            font-size: .6rem;
            letter-spacing: .22em;
            text-transform: uppercase;
            color: var(--ed-gold);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .ed-hero-label::before {
            content: '';
            width: 24px;
            height: 1px;
            background: var(--ed-gold);
        }

        .ed-hero-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(1.8rem, 3.5vw, 2.8rem);
            font-weight: 700;
            line-height: 1.2;
            color: #fff;
            margin-bottom: 10px;
        }

        .ed-hero-author {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 1rem;
            color: rgba(255, 255, 255, .5);
            margin-bottom: 28px;
        }

        .ed-hero-meta {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 32px;
        }

        .ed-hero-pill {
            padding: 6px 16px;
            border-radius: 100px;
            font-size: .65rem;
            font-family: 'DM Sans', sans-serif;
            letter-spacing: .08em;
            text-transform: uppercase;
            font-weight: 500;
            background: rgba(255, 255, 255, .06);
            border: 1px solid rgba(255, 255, 255, .1);
            color: rgba(255, 255, 255, .65);
        }

        .ed-hero-btn {
            align-self: flex-start;
            padding: 13px 28px;
            background: linear-gradient(135deg, var(--mg) 0%, var(--mg2) 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-family: 'Cinzel', serif;
            font-size: .72rem;
            letter-spacing: .18em;
            text-transform: uppercase;
            cursor: pointer !important;
            transition: all .32s;
            position: relative;
            overflow: hidden;
        }

        .ed-hero-btn:hover {
            box-shadow: 0 0 36px var(--mg-glow), 0 0 18px var(--mg-glow2);
            letter-spacing: .24em;
        }

        /* Divisor Editorial */
        .ed-divider {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 20px 60px;
            border-bottom: 1px solid rgba(255, 255, 255, .04);
        }

        .ed-divider-line {
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, .06);
        }

        .ed-divider-text {
            font-family: 'Space Mono', monospace;
            font-size: .58rem;
            letter-spacing: .22em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .22);
            white-space: nowrap;
        }

        /* Seções por Categoria */
        .ed-section {
            padding: 0 0 48px;
        }

        .ed-section-header {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 16px;
            padding: 32px 60px 20px;
        }

        .ed-section-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.55rem;
            font-weight: 700;
            color: #fff;
        }

        .ed-section-count {
            font-family: 'Space Mono', monospace;
            font-size: .68rem;
            letter-spacing: .1em;
            color: rgba(255, 255, 255, .28);
        }

        .ed-scroll-wrapper {
            overflow-x: auto;
            padding: 8px 60px 20px;
            scrollbar-width: none;
            display: flex;
            gap: 16px;
        }

        .ed-scroll-wrapper::-webkit-scrollbar {
            display: none;
        }

        .ed-book-card {
            flex-shrink: 0;
            width: 200px;
            background: rgba(255, 255, 255, .028);
            border: 1px solid rgba(255, 255, 255, .06);
            border-radius: 18px;
            overflow: hidden;
            cursor: pointer !important;
            transition: all .35s cubic-bezier(.23, 1, .32, 1);
            position: relative;
        }

        .ed-book-card:hover {
            transform: translateY(-6px);
            border-color: rgba(255, 255, 255, .14);
            box-shadow: 0 16px 48px rgba(0, 0, 0, .5);
        }

        .ed-book-art {
            width: 100%;
            height: 130px;
            position: relative;
            overflow: hidden;
        }

        .ed-book-art canvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        .ed-book-info {
            padding: 14px 14px 16px;
        }

        .ed-book-info h4 {
            font-family: 'Cinzel', serif;
            font-size: .78rem;
            font-weight: 700;
            color: #fff;
            line-height: 1.3;
            margin-bottom: 5px;
            display: -webkit-box;
            --webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .ed-book-info p {
            font-size: .68rem;
            color: rgba(255, 255, 255, .38);
            font-style: italic;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .ed-book-status {
            position: absolute;
            top: 10px;
            right: 10px;
        }

        /* Filter bar editorial */
        .ed-filter-bar {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 0 60px 24px;
            scrollbar-width: none;
        }

        .ed-filter-bar::-webkit-scrollbar {
            display: none;
        }

        .ed-pill {
            flex-shrink: 0;
            background: rgba(255, 255, 255, .04);
            border: 1px solid rgba(255, 255, 255, .07);
            border-radius: 100px;
            padding: 6px 16px;
            font-size: .64rem;
            font-family: 'DM Sans', sans-serif;
            font-weight: 500;
            letter-spacing: .07em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .45);
            cursor: pointer !important;
            white-space: nowrap;
            transition: all .25s;
        }

        .ed-pill:hover,
        .ed-pill.on {
            background: rgba(0, 229, 255, .14);
            border-color: rgba(0, 229, 255, .4);
            color: #fff;
        }

        /* ══════════════════════════════════════════════
   SPLASH
══════════════════════════════════════════════ */
        #splash {
            position: fixed;
            inset: 0;
            z-index: 900;
            background: var(--void);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 12px;
            animation: splashOut 1s ease 2.8s forwards;
            pointer-events: none;
        }

        @keyframes splashOut {
            to {
                opacity: 0;
            }
        }

        .splash-orb {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            margin-bottom: 16px;
            background: radial-gradient(circle at 38% 36%, #fff 0%, var(--mg) 55%, var(--mg2) 90%, transparent 100%);
            box-shadow: 0 0 80px var(--mg-glow), 0 0 160px var(--mg-glow2);
            animation: splashOrbIn 2.4s ease-in-out forwards;
        }

        @keyframes splashOrbIn {
            0% {
                transform: scale(.5);
                opacity: 0;
                box-shadow: none;
            }

            40% {
                opacity: 1;
                transform: scale(1.08);
            }

            70% {
                transform: scale(.96);
            }

            100% {
                transform: scale(1);
                opacity: 0;
            }
        }

        .splash-title {
            font-family: 'Cinzel', serif;
            font-size: clamp(2rem, 5vw, 3.8rem);
            font-weight: 700;
            letter-spacing: .3em;
            text-transform: uppercase;
            color: transparent;
            background: linear-gradient(180deg, #fff 0%, var(--mg) 60%, var(--mg2) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            animation: splashPulse 2.4s ease-in-out forwards;
        }

        .splash-sub {
            font-size: .72rem;
            letter-spacing: .5em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, .3);
            font-weight: 300;
            animation: splashPulse 2.4s ease-in-out .2s forwards;
        }

        @keyframes splashPulse {
            0% {
                opacity: 0;
                transform: translateY(18px);
            }

            30% {
                opacity: 1;
                transform: translateY(0);
            }

            80% {
                opacity: 1;
            }

            100% {
                opacity: 0;
            }
        }
    </style>
</head>

<body>

    <div id="splash">
        <div class="splash-orb"></div>
        <p class="splash-title">Andrômeda</p>
        <p class="splash-sub">Catálogo Cósmico</p>
    </div>

    <div id="grain"></div>
    <div id="canvas-dim"></div>
    <div id="webgl"></div>
    <div id="tip"><span class="tip-cat" id="tip-cat"></span><span class="tip-title" id="tip-title"></span><span class="tip-author" id="tip-author"></span></div>
    <div id="ring"></div>
    <div id="ring-inner"></div>
    <div id="cat-label"></div>
    <div id="fly-label"></div>

    <nav id="nav">
        <div class="nav-logo">
            <div class="nav-logo-orb"><i class="fa-solid fa-atom"></i></div>
            <span class="nav-logo-text">Andrômeda</span>
        </div>
        <div class="nav-div"></div>
        <div class="nav-sec">
            <a href="catalogo.php" class="nav-item active"><i class="fa-solid fa-book-open"></i><span>Catálogo</span></a>
            <a href="perfil.php" class="nav-item"><i class="fa-solid fa-user-astronaut"></i><span>Meu Perfil</span></a>
            <a href="emprestimos.php" class="nav-item"><i class="fa-solid fa-bookmark"></i><span>Empréstimos</span></a>
            <a href="reservas.php" class="nav-item"><i class="fa-solid fa-clock-rotate-left"></i><span>Reservas</span></a>
            <a href="dashboard.php" class="nav-item"><i class="fa-solid fa-chart-line"></i><span>Painel</span></a>
        </div>
        <div class="nav-div"></div>
        <div class="nav-foot">
            <a href="index.php" class="nav-item"><i class="fa-solid fa-rocket"></i><span>Início</span></a>
            <a href="logout.php" class="nav-item"><i class="fa-solid fa-right-from-bracket"></i><span>Sair</span></a>
        </div>
    </nav>

    <div id="hud">
        <div class="hud-search" style="position:relative;">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input id="q" type="text" placeholder="Explorar o cosmos…" autocomplete="off">
            <span class="search-count" id="search-count"></span>
        </div>
        <div id="pills">
            <button class="pill on" data-c="all"><span>Todos</span></button>
        </div>
        <div class="view-tog">
            <button id="btn-gal" class="on" title="Galáxia 3D"><i class="fa-solid fa-circle-nodes"></i></button>
            <button id="btn-ed" title="Modo Editorial"><i class="fa-solid fa-newspaper"></i></button>
        </div>
    </div>

    <div id="hud-bot">
        <span><i class="fa-solid fa-book"></i>&nbsp;<strong><?= $totalLivros ?></strong>&nbsp;obras</span>
        <span><i class="fa-solid fa-layer-group"></i>&nbsp;<strong><?= $totalCats ?></strong>&nbsp;categorias</span>
        <span id="scroll-hint"><i class="fa-solid fa-scroll"></i>&nbsp;Scroll para zoom</span>
    </div>
    <div id="depth">
        <span class="depth-lbl">Orbital</span>
        <div class="depth-track">
            <div class="depth-dot" id="ddot"></div>
        </div>
        <span class="depth-lbl">Galáxia</span>
    </div>

    <div id="book-panel">
        <div class="bp-art"><canvas id="bp-art-canvas"></canvas>
            <div class="bp-art-overlay"></div>
            <button class="bp-close" id="bp-close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="bp-body">
            <div class="bp-header"><span class="bp-cat" id="bp-cat">—</span><span class="sbadge s-unk" id="bp-status">—</span></div>
            <h2 class="bp-title" id="bp-title">—</h2>
            <p class="bp-author" id="bp-author">—</p>
            <div class="bp-meta">
                <div class="bp-field"><label>Ano</label><span class="val" id="bp-year">—</span></div>
                <div class="bp-field"><label>Editora</label><span class="val" id="bp-pub">—</span></div>
            </div>
            <div class="bp-actions">
                <button class="btn-prim" id="bp-reserve">Reservar</button>
                <button class="btn-sec" id="bp-expand"><i class="fa-solid fa-expand"></i></button>
            </div>
        </div>
    </div>

    <div id="modal-overlay">
        <div id="modal-drawer">
            <div class="md-cover">
                <canvas id="md-art-canvas"></canvas>
                <div class="md-cover-overlay"></div>
                <span class="md-cover-badge" id="md-cat-badge">—</span>
                <button class="md-close" id="modal-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="md-scroll">
                <div class="md-title-block">
                    <div class="md-status-row">
                        <span class="sbadge s-unk" id="md-status">—</span>
                    </div>
                    <h2 class="md-title" id="md-title">—</h2>
                    <p class="md-author" id="md-author">—</p>
                </div>
                <div class="md-grid">
                    <div class="md-field"><label>Ano de Publicação</label><span class="v" id="md-year">—</span></div>
                    <div class="md-field"><label>Editora</label><span class="v" id="md-pub">—</span></div>
                    <div class="md-field"><label>Categoria</label><span class="v" id="md-catv">—</span></div>
                    <div class="md-field"><label>Disponibilidade</label><span class="v" id="md-sv">—</span></div>
                </div>
                <p class="md-related-title">Obras Relacionadas</p>
                <div class="md-related-list" id="md-related"></div>
            </div>
            <div class="md-actions">
                <button class="md-btn-main" id="md-reserve">Reservar esta Obra</button>
                <button class="md-btn-sec" id="md-wishlist" title="Salvar"><i class="fa-regular fa-bookmark"></i></button>
            </div>
        </div>
    </div>

    <div id="editorial-view">
        <div class="ed-header">
            <div class="ed-header-label">Biblioteca Andrômeda · Catálogo</div>
            <h1 class="ed-header-title">Universo <em>Literário</em></h1>
            <div class="ed-header-meta">
                <div class="ed-stat"><span class="ed-stat-num" id="ed-total"><?= $totalLivros ?></span><span class="ed-stat-lbl">Obras</span></div>
                <div class="ed-stat"><span class="ed-stat-num" id="ed-cats"><?= $totalCats ?></span><span class="ed-stat-lbl">Categorias</span></div>
                <div class="ed-stat"><span class="ed-stat-num" id="ed-avail">—</span><span class="ed-stat-lbl">Disponíveis</span></div>
            </div>
        </div>
        <div class="ed-hero" id="ed-hero">
            <div class="ed-hero-art"><canvas id="ed-hero-canvas"></canvas><span class="ed-hero-art-label">Destaque Editorial</span></div>
            <div class="ed-hero-content">
                <div class="ed-hero-label">Destaque da Semana</div>
                <h2 class="ed-hero-title" id="ed-hero-title">—</h2>
                <p class="ed-hero-author" id="ed-hero-author">—</p>
                <div class="ed-hero-meta">
                    <span class="ed-hero-pill" id="ed-hero-cat">—</span>
                    <span class="ed-hero-pill" id="ed-hero-year">—</span>
                    <span class="sbadge s-unk" id="ed-hero-status">—</span>
                </div>
                <button class="ed-hero-btn" id="ed-hero-btn">Ver Detalhes</button>
            </div>
        </div>
        <div class="ed-filter-bar" id="ed-filter-bar">
            <button class="ed-pill on" data-c="all">Todas</button>
        </div>
        <div id="ed-sections"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
    <script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>

    <script>
        /* ═══════════════════════════════════════════════════════
   0. DADOS PHP → JS
═══════════════════════════════════════════════════════ */
        const LIVROS = <?php echo $livrosJson; ?>;

        /* ═══════════════════════════════════════════════════════
           1. UTILITÁRIOS
        ═══════════════════════════════════════════════════════ */
        AOS.init({
            duration: 700,
            easing: 'ease-out-cubic',
            once: true
        });

        function hexToRgb(h) {
            return {
                r: (h >> 16) & 255,
                g: (h >> 8) & 255,
                b: h & 255
            };
        }

        function statusClass(s) {
            const n = (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (n.includes('disp')) return 's-disp';
            if (n.includes('empr')) return 's-empr';
            if (n.includes('res')) return 's-res';
            return 's-unk';
        }

        // Nova Paleta Sci-Fi (Cianos, Azuis Profundos, Violetas e Verdes Estelares)
        const PALETTE = [
            0x00E5FF, // Neon Cyan
            0x8A2BE2, // Blue Violet
            0x0055FF, // Deep Blue
            0xBD00FF, // Electric Purple
            0x00FFCC, // Aqua
            0x4B0082, // Indigo
            0x1E90FF, // Dodger Blue
            0x9D4EDD  // Light Purple
        ];

        function catColor(name) {
            if (!name) return PALETTE[0];
            let h = 0;
            for (const c of name) {
                h = ((h << 5) - h) + c.charCodeAt(0);
                h |= 0;
            }
            return PALETTE[Math.abs(h) % PALETTE.length];
        }

        function catHex(name) {
            return '#' + catColor(name).toString(16).padStart(6, '0');
        }

        /* ═══════════════════════════════════════════════════════
           2. ARTE GENERATIVA DE LIVRO
        ═══════════════════════════════════════════════════════ */
        function drawBookArt(canvas, title, category, w, h) {
            if (!canvas) return;
            canvas.width = w || canvas.clientWidth || 400;
            canvas.height = h || canvas.clientHeight || 240;
            const ctx = canvas.getContext('2d');
            const W = canvas.width,
                H = canvas.height;

            let seed = 0;
            for (const c of (title || 'X')) {
                seed = ((seed << 5) - seed) + c.charCodeAt(0);
                seed |= 0;
            }
            const rnd = (() => {
                let s = Math.abs(seed);
                return () => {
                    s = (s * 1664525 + 1013904223) & 0xffffffff;
                    return (s >>> 0) / 0xffffffff;
                };
            })();

            const col = catColor(category);
            const {
                r: cr,
                g: cg,
                b: cb
            } = hexToRgb(col);
            const col2 = catColor((category || '') + '2');
            const {
                r: r2,
                g: g2,
                b: b2
            } = hexToRgb(col2);

            const bg = ctx.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, `rgb(${Math.round(cr*.18)},${Math.round(cg*.12)},${Math.round(cb*.22)})`);
            bg.addColorStop(1, `rgb(${Math.round(r2*.14)},${Math.round(g2*.10)},${Math.round(b2*.20)})`);
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < 6; i++) {
                const x = rnd() * W,
                    y = rnd() * H,
                    r = 30 + rnd() * 90;
                const gc = ctx.createRadialGradient(x, y, 0, x, y, r);
                gc.addColorStop(0, `rgba(${cr},${cg},${cb},${0.08+rnd()*0.14})`);
                gc.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = gc;
                ctx.fill();
            }

            ctx.strokeStyle = `rgba(255,255,255,0.04)`;
            ctx.lineWidth = 1;
            for (let i = 0; i < W; i += 28) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, H);
                ctx.stroke();
            }
            for (let i = 0; i < H; i += 28) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(W, i);
                ctx.stroke();
            }

            const shapes = Math.floor(rnd() * 3) + 2;
            for (let i = 0; i < shapes; i++) {
                const x = rnd() * W,
                    y = rnd() * H,
                    sz = 20 + rnd() * 50;
                const type = Math.floor(rnd() * 3);
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.2+rnd()*0.2})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                if (type === 0) {
                    ctx.rect(x - sz / 2, y - sz / 2, sz, sz);
                } else if (type === 1) {
                    ctx.arc(x, y, sz / 2, 0, Math.PI * 2);
                } else {
                    ctx.moveTo(x, y - sz / 2);
                    ctx.lineTo(x + sz / 2, y + sz / 2);
                    ctx.lineTo(x - sz / 2, y + sz / 2);
                    ctx.closePath();
                }
                ctx.stroke();
            }

            ctx.font = `bold ${Math.min(H*0.12,22)}px 'Cinzel', serif`;
            ctx.fillStyle = `rgba(255,255,255,0.07)`;
            ctx.textAlign = 'center';
            const words = (title || '').split(' ');
            let line = '';
            let lineY = H * 0.55;
            words.forEach(word => {
                const test = line + word + ' ';
                if (ctx.measureText(test).width > W * 0.9 && line !== '') {
                    ctx.fillText(line.trim(), W / 2, lineY);
                    line = word + ' ';
                    lineY += H * 0.13;
                } else {
                    line = test;
                }
            });
            if (line) ctx.fillText(line.trim(), W / 2, lineY);
        }

        /* ═══════════════════════════════════════════════════════
           3. THREE.JS — RENDERER & CAMERA & COMPOSER
        ═══════════════════════════════════════════════════════ */
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 3000);
        camera.position.set(0, 22, 130);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        document.getElementById('webgl').appendChild(renderer.domElement);

        const cam = {
            tx: 0,
            ty: 18,
            tz: 96
        };
        const camLook = {
            x: 0,
            y: 0,
            z: 0
        };
        const camLookDst = {
            x: 0,
            y: 0,
            z: 0
        };

        const rPass = new THREE.RenderPass(scene, camera);
        const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.4, 0.6, 0.78);

        const ChromaShader = {
            uniforms: {
                tDiffuse: {
                    value: null
                },
                uS: {
                    value: 0.005
                }
            },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader: `uniform sampler2D tDiffuse; uniform float uS; varying vec2 vUv; void main(){ vec2 c=vUv-0.5; float d=length(c); vec2 o=c*d*uS; gl_FragColor=vec4(texture2D(tDiffuse,vUv-o*1.3).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv+o*1.1).b,1.0); }`
        };
        const chroma = new THREE.ShaderPass(ChromaShader);

        const LensShader = {
            uniforms: {
                tDiffuse: {
                    value: null
                },
                uBHPos: {
                    value: new THREE.Vector2(0.5, 0.5)
                },
                uBHR: {
                    value: 0.045
                },
                uStr: {
                    value: 0.022
                }
            },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uBHPos; uniform float uBHR,uStr; varying vec2 vUv; void main(){ vec2 delta=vUv-uBHPos; float dist=length(delta); float r=dist/max(uBHR,0.001); float falloff=1.0-smoothstep(0.0,uBHR*5.0,dist); float strength=uStr/(r*r*0.5+0.18)*falloff; strength=clamp(strength,0.0,0.1); vec2 offset=normalize(delta+vec2(0.0001))*strength; vec4 col=texture2D(tDiffuse,vUv-offset); float eh=smoothstep(uBHR*0.55,0.0,dist); col.rgb*=(1.0-eh*0.98); float ring=smoothstep(uBHR*0.85,uBHR*1.0,dist)*smoothstep(uBHR*1.55,uBHR*1.1,dist); col.rgb+=vec3(1.0,0.65,0.25)*ring*0.6; gl_FragColor=col; }`
        };
        const lensPass = new THREE.ShaderPass(LensShader);

        const composer = new THREE.EffectComposer(renderer);
        composer.addPass(rPass);
        composer.addPass(bloom);
        composer.addPass(lensPass);
        composer.addPass(chroma);

        /* ═══════════════════════════════════════════════════════
           4. CAMPO ESTELAR
        ═══════════════════════════════════════════════════════ */
        let bgMat;
        (function() {
            const starVS = `attribute float aR; uniform float uT,uMin,uMax; varying float vR; varying vec3 vC; void main(){ vR=aR; vC=color; float tw=0.4+0.6*sin(uT*1.2+aR*77.0); vec4 vp=viewMatrix*modelMatrix*vec4(position,1.0); gl_Position=projectionMatrix*vp; gl_PointSize=(8.0/-vp.z)*(uMin+aR*(uMax-uMin))*tw; }`;
            const starFS = `varying float vR; varying vec3 vC; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.8); gl_FragColor=vec4(vC*s,s*0.85); }`;

            function mkLayer(N, spread, min, max, cA, cB) {
                const g = new THREE.BufferGeometry(),
                    p = new Float32Array(N * 3),
                    r = new Float32Array(N),
                    c = new Float32Array(N * 3);
                for (let i = 0; i < N; i++) {
                    p[i * 3] = (Math.random() - .5) * spread;
                    p[i * 3 + 1] = (Math.random() - .5) * spread;
                    p[i * 3 + 2] = (Math.random() - .5) * spread;
                    r[i] = Math.random();
                    const t = Math.random();
                    c[i * 3] = cA[0] * (1 - t) + cB[0] * t;
                    c[i * 3 + 1] = cA[1] * (1 - t) + cB[1] * t;
                    c[i * 3 + 2] = cA[2] * (1 - t) + cB[2] * t;
                }
                g.setAttribute('position', new THREE.BufferAttribute(p, 3));
                g.setAttribute('aR', new THREE.BufferAttribute(r, 1));
                g.setAttribute('color', new THREE.BufferAttribute(c, 3));
                return g;
            }
            const m = u => new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
                uniforms: u,
                vertexShader: starVS,
                fragmentShader: starFS
            });
            scene.add(new THREE.Points(mkLayer(5500, 1800, .3, 1, [.72, .88, 1], [1, 1, 1]), m({
                uT: {
                    value: 0
                },
                uMin: {
                    value: .3
                },
                uMax: {
                    value: 1
                }
            })));
            scene.add(new THREE.Points(mkLayer(3000, 1400, .25, .7, [1, .92, .75], [1, .78, .55]), m({
                uT: {
                    value: 0
                },
                uMin: {
                    value: .2
                },
                uMax: {
                    value: .7
                }
            })));
            bgMat = m({
                uT: {
                    value: 0
                },
                uMin: {
                    value: .35
                },
                uMax: {
                    value: 1.1
                }
            });
            scene.add(new THREE.Points(mkLayer(1500, 900, .4, 1.2, [1, .55, .42], [.9, .38, .55]), bgMat));
        })();

        /* ═══════════════════════════════════════════════════════
           5. GALÁXIA ESPIRAL
        ═══════════════════════════════════════════════════════ */
        let galMat, galDustMat;
        (function() {
            const ARMS = 4,
                N = 85000;
            const geom = new THREE.BufferGeometry(),
                pos = new Float32Array(N * 3),
                col = new Float32Array(N * 3),
                aR = new Float32Array(N);
            for (let i = 0; i < N; i++) {
                const i3 = i * 3,
                    rng = Math.random(),
                    r = Math.pow(rng, 1.6) * 72 + (rng < .12 ? 0 : 2);
                const armIdx = Math.floor(Math.random() * ARMS),
                    armAng = (armIdx / ARMS) * Math.PI * 2;
                const spiral = r * .52 + armAng,
                    spread = Math.pow(Math.random(), 1.8) * Math.max(0, (72 - r) * .20);
                pos[i3] = Math.cos(spiral) * r + (Math.random() - .5) * spread;
                pos[i3 + 1] = (Math.random() - .5) * (r < 10 ? 3.5 : r < 25 ? 1.2 : .55);
                pos[i3 + 2] = Math.sin(spiral) * r + (Math.random() - .5) * spread;
                if (r < 8) {
                    col[i3] = 1;
                    col[i3 + 1] = .92;
                    col[i3 + 2] = .72;
                } else if (r < 25) {
                    const t = (r - 8) / 17;
                    col[i3] = 1 - t * .5;
                    col[i3 + 1] = .88 - t * .2;
                    col[i3 + 2] = .65 + t * .35;
                } else {
                    const t = (r - 25) / 47;
                    col[i3] = .5 - t * .28;
                    col[i3 + 1] = .68 - t * .42;
                    col[i3 + 2] = 1 - t * .3;
                }
                aR[i3] = Math.random();
            }
            geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
            geom.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
            galMat = new THREE.ShaderMaterial({
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
                transparent: true,
                uniforms: {
                    uT: {
                        value: 0
                    }
                },
                vertexShader: `attribute float aR; uniform float uT; varying vec3 vC; void main(){ vC=color; float dist=length(position.xz); float omega=0.075/(dist*0.055+0.6); float ang=atan(position.z,position.x)+uT*omega; vec3 p=vec3(cos(ang)*dist,position.y,sin(ang)*dist); vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0); gl_Position=projectionMatrix*vp; float tw=0.65+0.35*sin(uT*0.9+aR*55.0); gl_PointSize=(22.0/-vp.z)*(0.18+aR*0.52)*tw; }`,
                fragmentShader: `varying vec3 vC; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),3.2); gl_FragColor=vec4(vC*s,s*0.7); }`
            });
            const gal = new THREE.Points(geom, galMat);
            gal.rotation.x = 1.12;
            gal.rotation.z = .1;
            scene.add(gal);

            const ND = 12000,
                dg = new THREE.BufferGeometry(),
                dp = new Float32Array(ND * 3),
                dc = new Float32Array(ND * 3);
            for (let i = 0; i < ND; i++) {
                const i3 = i * 3,
                    r = 10 + Math.random() * 55,
                    armIdx = Math.floor(Math.random() * ARMS),
                    ang = (armIdx + .5) / ARMS * Math.PI * 2 + Math.PI * .15;
                const spiral = r * .52 + ang,
                    spread = Math.random() * (r * .18);
                dp[i3] = Math.cos(spiral) * r + (Math.random() - .5) * spread;
                dp[i3 + 1] = (Math.random() - .5) * .35;
                dp[i3 + 2] = Math.sin(spiral) * r + (Math.random() - .5) * spread;
                const b = Math.random() * .06;
                dc[i3] = .12 + b;
                dc[i3 + 1] = .06 + b * .5;
                dc[i3 + 2] = .06;
            }
            dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
            dg.setAttribute('color', new THREE.BufferAttribute(dc, 3));
            galDustMat = new THREE.ShaderMaterial({
                depthWrite: false,
                blending: THREE.NormalBlending,
                vertexColors: true,
                transparent: true,
                uniforms: {
                    uT: {
                        value: 0
                    }
                },
                vertexShader: `uniform float uT; varying vec3 vC; void main(){ vC=color; float dist=length(position.xz); float omega=0.06/(dist*0.05+0.6); float ang=atan(position.z,position.x)+uT*omega; vec3 p=vec3(cos(ang)*dist,position.y,sin(ang)*dist); vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0); gl_Position=projectionMatrix*vp; gl_PointSize=(30.0/-vp.z)*(0.6+0.4*fract(sin(dist*17.3)*43758.5)); }`,
                fragmentShader: `varying vec3 vC; void main(){ float s=1.0-smoothstep(0.3,0.5,distance(gl_PointCoord,vec2(0.5))); gl_FragColor=vec4(vC,s*0.55); }`
            });
            const dust = new THREE.Points(dg, galDustMat);
            dust.rotation.x = 1.12;
            dust.rotation.z = .1;
            scene.add(dust);
        })();

        /* ═══════════════════════════════════════════════════════
           6. BURACO NEGRO
        ═══════════════════════════════════════════════════════ */
        let diskMat;
        (function() {
            scene.add(new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 32), new THREE.MeshBasicMaterial({
                color: 0x000000
            })));
            for (let i = 0; i < 3; i++) {
                const rm = new THREE.Mesh(new THREE.TorusGeometry(2.15 + i * .18, .08 - i * .015, 8, 120), new THREE.MeshBasicMaterial({
                    color: i === 0 ? 0xffd580 : i === 1 ? 0xff8833 : 0xffffff,
                    transparent: true,
                    opacity: .75 - i * .22
                }));
                rm.rotation.x = Math.PI / 2;
                scene.add(rm);
            }
            const NA = 28000,
                ag = new THREE.BufferGeometry(),
                ap = new Float32Array(NA * 3),
                ac = new Float32Array(NA * 3),
                aAng = new Float32Array(NA),
                aRad = new Float32Array(NA);
            for (let i = 0; i < NA; i++) {
                const i3 = i * 3,
                    r = 2.55 + Math.pow(Math.random(), .6) * 10.5,
                    a = Math.random() * Math.PI * 2;
                aAng[i] = a;
                aRad[i] = r;
                ap[i3] = Math.cos(a) * r;
                ap[i3 + 1] = (Math.random() - .5) * .12 * (1 / (r * .12 + .8));
                ap[i3 + 2] = Math.sin(a) * r;
                const t = (r - 2.55) / 10.5,
                    tt = Math.pow(t, .7);
                ac[i3] = 1;
                ac[i3 + 1] = 1 - tt * .62;
                ac[i3 + 2] = .95 - tt * .88;
            }
            ag.setAttribute('position', new THREE.BufferAttribute(ap, 3));
            ag.setAttribute('color', new THREE.BufferAttribute(ac, 3));
            ag.setAttribute('aAng', new THREE.BufferAttribute(aAng, 1));
            ag.setAttribute('aRad', new THREE.BufferAttribute(aRad, 1));
            diskMat = new THREE.ShaderMaterial({
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
                transparent: true,
                uniforms: {
                    uT: {
                        value: 0
                    }
                },
                vertexShader: `attribute float aAng,aRad; uniform float uT; varying vec3 vC; varying float vBright; void main(){ vC=color; float omega=0.65/sqrt(aRad*aRad*aRad*0.01+aRad); float ang=aAng+uT*omega; vec3 p=vec3(cos(ang)*aRad,position.y,sin(ang)*aRad); vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0); gl_Position=projectionMatrix*vp; float szFac=1.0-(aRad-2.55)/10.5; gl_PointSize=(14.0/-vp.z)*(0.2+szFac*0.55); vBright=szFac; }`,
                fragmentShader: `varying vec3 vC; varying float vBright; void main(){ float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.5); gl_FragColor=vec4(vC*s,s*(0.55+vBright*0.45)); }`
            });
            scene.add(new THREE.Points(ag, diskMat));
            const NJ = 2500,
                jg = new THREE.BufferGeometry(),
                jp = new Float32Array(NJ * 3),
                jc = new Float32Array(NJ * 3);
            for (let i = 0; i < NJ; i++) {
                const i3 = i * 3,
                    h = (Math.random() - .5) * 28,
                    r = Math.abs(h) * .04 * (Math.random() * .8 + .2),
                    a = Math.random() * Math.PI * 2;
                jp[i3] = Math.cos(a) * r;
                jp[i3 + 1] = h;
                jp[i3 + 2] = Math.sin(a) * r;
                const t = Math.abs(h) / 14;
                jc[i3] = .4 + t * .1;
                jc[i3 + 1] = .5 + t * .2;
                jc[i3 + 2] = 1;
            }
            jg.setAttribute('position', new THREE.BufferAttribute(jp, 3));
            jg.setAttribute('color', new THREE.BufferAttribute(jc, 3));
            scene.add(new THREE.Points(jg, new THREE.PointsMaterial({
                vertexColors: true,
                size: .15,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true,
                opacity: .42
            })));
        })();

        /* ═══════════════════════════════════════════════════════
           7. GLOW HELPER (COM CACHE)
        ═══════════════════════════════════════════════════════ */
        const _glowCache = new Map();

        function mkGlow(hex, sz) {
            if (!_glowCache.has(hex)) {
                const {
                    r,
                    g,
                    b
                } = hexToRgb(hex), cv = document.createElement('canvas');
                cv.width = cv.height = 128;
                const cx = cv.getContext('2d'),
                    gr = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
                gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
                gr.addColorStop(.15, `rgba(${r},${g},${b},.6)`);
                gr.addColorStop(.45, `rgba(${r},${g},${b},.15)`);
                gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
                cx.fillStyle = gr;
                cx.fillRect(0, 0, 128, 128);
                _glowCache.set(hex, new THREE.CanvasTexture(cv));
            }
            const mat = new THREE.SpriteMaterial({
                map: _glowCache.get(hex),
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false
            });
            const sp = new THREE.Sprite(mat);
            sp.scale.set(sz, sz, 1);
            return sp;
        }

        /* ═══════════════════════════════════════════════════════
           8. SISTEMAS DE CATEGORIA + LINHAS DE CONSTELAÇÃO
        ═══════════════════════════════════════════════════════ */
        const catMap = new Map();
        const catStars = []; // Array usado para o raycast dos sistemas (estrelas de categoria)
        const uniqCats = [...new Set(LIVROS.map(l => l.categoria_nome).filter(Boolean))];

        uniqCats.forEach((name, idx) => {
            const t = (idx + .5) / uniqCats.length,
                br = idx % 4,
                ang = (br / 4) * Math.PI * 2 + t * Math.PI * 6.2,
                rad = 14 + t * 46;
            const x = Math.cos(ang) * rad + (Math.random() - .5) * 3,
                y = (Math.random() - .5) * 5,
                z = Math.sin(ang) * rad + (Math.random() - .5) * 3;
            const col = catColor(name);
            const star = new THREE.Mesh(new THREE.SphereGeometry(.6, 16, 16), new THREE.MeshBasicMaterial({
                color: col
            }));
            star.position.set(x, y, z);
            // Armazenar os dados na mesh para identificar no raycaster
            star.userData = { isCategory: true, name: name }; 
            scene.add(star);
            catStars.push(star);

            const glow = mkGlow(col, 14),
                glow2 = mkGlow(col, 32),
                neb = mkGlow(col, 60);
            glow.position.set(x, y, z);
            glow.material.opacity = .85;
            glow2.position.set(x, y, z);
            glow2.material.opacity = .22;
            neb.position.set(x, y, z);
            neb.material.opacity = .07;
            scene.add(glow);
            scene.add(glow2);
            scene.add(neb);
            catMap.set(name, {
                name,
                col,
                star,
                glow,
                glow2,
                neb,
                pos: new THREE.Vector3(x, y, z),
                books: []
            });
        });

        // Linhas de constelação
        const MAX_CONST = 200;
        const constPositions = new Float32Array(MAX_CONST * 2 * 3);
        const constGeom = new THREE.BufferGeometry();
        constGeom.setAttribute('position', new THREE.BufferAttribute(constPositions, 3));
        constGeom.setDrawRange(0, 0);
        const constMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: .12,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const constLines = new THREE.LineSegments(constGeom, constMat);
        scene.add(constLines);

        function updateConstellationLines() {
            if (activeFilter === 'all') {
                constGeom.setDrawRange(0, 0);
                return;
            }
            const cd = catMap.get(activeFilter);
            if (!cd) return;
            let i = 0;
            cd.books.forEach(b => {
                if (!b.filtered || !b.searched) return;
                const cp = cd.pos;
                constPositions[i * 6 + 0] = cp.x;
                constPositions[i * 6 + 1] = cp.y;
                constPositions[i * 6 + 2] = cp.z;
                constPositions[i * 6 + 3] = b._px || cp.x;
                constPositions[i * 6 + 4] = b._py || cp.y;
                constPositions[i * 6 + 5] = b._pz || cp.z;
                i++;
                if (i >= MAX_CONST) return;
            });
            constGeom.attributes.position.needsUpdate = true;
            constGeom.setDrawRange(0, i * 2);
            constMat.color.setHex(cd.col);
        }

        /* ═══════════════════════════════════════════════════════
           9. PLANETAS (LIVROS)
        ═══════════════════════════════════════════════════════ */
        const bookObjs = [];
        let HOVER = null,
            selBook = null;
        const planetGeo = new THREE.SphereGeometry(1, 16, 16);
        const planetMat = new THREE.MeshBasicMaterial();
        const planetMesh = new THREE.InstancedMesh(planetGeo, planetMat, LIVROS.length);
        planetMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(planetMesh);
        const dummy = new THREE.Object3D(),
            tmpColor = new THREE.Color();

        LIVROS.forEach((livro, idx) => {
            const cd = catMap.get(livro.categoria_nome);
            if (!cd) return;
            const oIdx = cd.books.length,
                oRad = 3.4 + (oIdx % 8) * .88 + Math.random() * .5;
            const oSpd = (.12 + Math.random() * .28) * (Math.random() > .5 ? 1 : -1);
            const oAng = (idx * 2.399960438) % (Math.PI * 2);
            const tiltX = (Math.random() - .5) * Math.PI * .5,
                tiltZ = (Math.random() - .5) * Math.PI * .25;
            const sz = .13 + Math.random() * .12;
            const st = (livro.status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            let pcol;
            if (st.includes('disp')) pcol = 0x22dd88;
            else if (st.includes('empr')) pcol = 0xff4444;
            else if (st.includes('res')) pcol = 0xffaa22;
            else pcol = 0x8899ff;
            tmpColor.setHex(pcol);
            planetMesh.setColorAt(idx, tmpColor);
            const glow = mkGlow(pcol, sz * 22);
            glow.material.opacity = .7;
            scene.add(glow);

            const OP = 128;
            const oPts = [];
            for (let i = 0; i <= OP; i++) {
                const a = (i / OP) * Math.PI * 2;
                oPts.push(Math.cos(a) * oRad * Math.cos(tiltX), Math.sin(a) * oRad * Math.sin(tiltZ) * .38, Math.sin(a) * oRad * Math.cos(tiltX));
            }
            const oGeom = new THREE.BufferGeometry();
            oGeom.setAttribute('position', new THREE.Float32BufferAttribute(oPts, 3));
            const oMat = new THREE.LineBasicMaterial({
                color: pcol,
                transparent: true,
                opacity: .12,
                depthWrite: false
            });
            const oLine = new THREE.LineLoop(oGeom, oMat);
            oLine.position.copy(cd.pos);
            scene.add(oLine);

            const obj = {
                data: livro,
                cd,
                glow,
                orbitLine: oLine,
                oRad,
                oSpd,
                oAng,
                tiltX,
                tiltZ,
                sz,
                pcol,
                idx,
                filtered: true,
                searched: true,
                currentScale: 1,
                hoverScale: 1,
                isHovered: false,
                _px: cd.pos.x,
                _py: cd.pos.y,
                _pz: cd.pos.z
            };
            cd.books.push(obj);
            bookObjs.push(obj);
        });

        /* ═══════════════════════════════════════════════════════
           10. ESTADO & VARIÁVEIS DE CONTROLE
        ═══════════════════════════════════════════════════════ */
        let mX = 0,
            mY = 0;
        let activeView = 'gal'; // 'gal' | 'ed'
        let is3DActive = true;
        let activeFilter = 'all',
            queryStr = '';
        let searchDebounce = null;

        const ray = new THREE.Raycaster();
        const mVec = new THREE.Vector2();

        /* ═══════════════════════════════════════════════════════
           11. CURSOR PERSONALIZADO
        ═══════════════════════════════════════════════════════ */
        const ringEl = document.getElementById('ring'),
            innerEl = document.getElementById('ring-inner'),
            tipEl = document.getElementById('tip');
        let ringX = 0,
            ringY = 0,
            targetX = 0,
            targetY = 0;

        document.addEventListener('mousemove', e => {
            targetX = e.clientX;
            targetY = e.clientY;
            mX = (e.clientX / innerWidth - .5) * 2;
            mY = (e.clientY / innerHeight - .5) * 2;
            tipEl.style.left = (e.clientX + 22) + 'px';
            tipEl.style.top = (e.clientY - 8) + 'px';
            if (activeView === 'gal' && activeFilter === 'all') {
                cam.tx = mX * 14;
                cam.ty = 18 - mY * 8;
            }
            if (activeView === 'gal') handleRaycast(e);
        });

        (function animCursor() {
            ringX += (targetX - ringX) * .06;
            ringY += (targetY - ringY) * .06;
            ringEl.style.left = ringX + 'px';
            ringEl.style.top = ringY + 'px';
            innerEl.style.left = targetX + 'px';
            innerEl.style.top = targetY + 'px';
            requestAnimationFrame(animCursor);
        })();

        document.addEventListener('mousedown', () => ringEl.classList.add('click'));
        document.addEventListener('mouseup', () => ringEl.classList.remove('click'));

        /* ═══════════════════════════════════════════════════════
           12. RAYCASTING (LIVROS E CATEGORIAS) & HOVER
        ═══════════════════════════════════════════════════════ */
        let HOVER_CAT = null;

        function handleRaycast(e) {
            if (activeView !== 'gal') return;
            mVec.x = (e.clientX / innerWidth) * 2 - 1;
            mVec.y = -(e.clientY / innerHeight) * 2 + 1;
            ray.setFromCamera(mVec, camera);

            // Reseta ambos
            if (HOVER) {
                HOVER.isHovered = false;
                HOVER = null;
            }
            HOVER_CAT = null;

            // Busca interseções em Livros e em Sistemas de Categoria (Estrelas)
            const catHits = ray.intersectObjects(catStars);
            const hits = ray.intersectObject(planetMesh);

            // Determinar o que está mais próximo, ou se encontrou apenas livro
            if (hits.length && (!catHits.length || hits[0].distance < catHits[0].distance)) {
                const bo = bookObjs.find(b => b.idx === hits[0].instanceId);
                if (bo && bo.filtered && bo.searched) {
                    HOVER = bo;
                    bo.isHovered = true;
                    showPanel(bo);
                    document.getElementById('tip-cat').textContent = bo.data.categoria_nome || '';
                    document.getElementById('tip-title').textContent = bo.data.titulo || '';
                    document.getElementById('tip-author').textContent = bo.data.autor_nome || '';
                    tipEl.classList.add('show');
                    ringEl.classList.add('hover');
                    innerEl.classList.add('hover');
                    innerEl.style.backgroundColor = '#' + bo.pcol.toString(16).padStart(6, '0');
                    return;
                }
            } 
            // Se bateu na Categoria
            else if (catHits.length) {
                const catName = catHits[0].object.userData.name;
                const cd = catMap.get(catName);
                if (cd) {
                    HOVER_CAT = catName;
                    hidePanel(); // Oculta painel de livro caso estivesse aberto
                    document.getElementById('tip-cat').textContent = 'Sistema Solar';
                    document.getElementById('tip-title').textContent = catName;
                    document.getElementById('tip-author').textContent = cd.books.length + ' obras';
                    tipEl.classList.add('show');
                    ringEl.classList.add('hover');
                    innerEl.classList.add('hover');
                    innerEl.style.backgroundColor = catHex(catName);
                    return;
                }
            }

            // Se não bateu em nada
            if (selBook) hidePanel();
            tipEl.classList.remove('show');
            ringEl.classList.remove('hover');
            innerEl.classList.remove('hover');
            innerEl.style.backgroundColor = '';
        }

        renderer.domElement.addEventListener('click', () => {
            if (HOVER) {
                openModal(HOVER.data);
            } else if (HOVER_CAT) {
                flyToCategory(HOVER_CAT);
            }
        });

        /* ═══════════════════════════════════════════════════════
           13. PAINEL LATERAL
        ═══════════════════════════════════════════════════════ */
        function showPanel(bo) {
            const d = bo.data;
            selBook = bo;
            const c = document.getElementById('bp-art-canvas');
            c.width = c.parentElement.clientWidth;
            c.height = c.parentElement.clientHeight || 180;
            drawBookArt(c, d.titulo, d.categoria_nome, c.width, c.height);
            document.getElementById('bp-cat').textContent = d.categoria_nome || '—';
            document.getElementById('bp-title').textContent = d.titulo || '—';
            document.getElementById('bp-author').textContent = d.autor_nome || 'Desconhecido';
            document.getElementById('bp-year').textContent = d.ano_publicacao || '—';
            document.getElementById('bp-pub').textContent = d.editora_nome || '—';
            const bsel = document.getElementById('bp-status');
            bsel.className = 'sbadge ' + statusClass(d.status);
            bsel.textContent = d.status || '—';
            document.getElementById('book-panel').classList.add('open');
        }

        function hidePanel() {
            document.getElementById('book-panel').classList.remove('open');
            selBook = null;
        }
        document.getElementById('bp-close').addEventListener('click', hidePanel);
        document.getElementById('bp-reserve').addEventListener('click', () => {
            if (selBook) openModal(selBook.data);
        });
        document.getElementById('bp-expand').addEventListener('click', () => {
            if (selBook) openModal(selBook.data);
        });

        /* ═══════════════════════════════════════════════════════
           14. MODAL DRAWER REDESENHADO
        ═══════════════════════════════════════════════════════ */
        let currentModalData = null;

        function openModal(d) {
            currentModalData = d;
            const mc = document.getElementById('md-art-canvas');
            mc.width = mc.parentElement.clientWidth || 580;
            mc.height = 260;
            drawBookArt(mc, d.titulo, d.categoria_nome, mc.width, 260);

            document.getElementById('md-cat-badge').textContent = d.categoria_nome || '—';
            document.getElementById('md-title').textContent = d.titulo || '—';
            document.getElementById('md-author').textContent = d.autor_nome || '—';
            document.getElementById('md-year').textContent = d.ano_publicacao || '—';
            document.getElementById('md-pub').textContent = d.editora_nome || '—';
            document.getElementById('md-catv').textContent = d.categoria_nome || '—';
            document.getElementById('md-sv').textContent = d.status || '—';
            const ms = document.getElementById('md-status');
            ms.className = 'sbadge ' + statusClass(d.status);
            ms.textContent = d.status || '—';

            const related = LIVROS.filter(l => l.categoria_nome === d.categoria_nome && l.titulo !== d.titulo).slice(0, 4);
            const relEl = document.getElementById('md-related');
            relEl.innerHTML = related.length === 0 ? '<p style="font-size:.78rem;color:rgba(255,255,255,.28);font-style:italic;">Nenhuma obra relacionada</p>' : related.map(r => `
    <div class="md-related-item" onclick="openModal(LIVROS[${LIVROS.indexOf(r)}])">
      <div class="md-related-dot" style="background:${catHex(r.categoria_nome)};box-shadow:0 0 8px ${catHex(r.categoria_nome)}66;"></div>
      <div class="md-related-info">
        <strong>${r.titulo||'—'}</strong>
        <span>${r.autor_nome||'—'}</span>
      </div>
      <span class="sbadge ${statusClass(r.status)}" style="font-size:.55rem;padding:3px 8px;">${r.status||'—'}</span>
    </div>`).join('');

            document.getElementById('modal-overlay').classList.add('open');
            document.querySelector('.md-scroll').scrollTop = 0;
        }

        function closeModal() {
            document.getElementById('modal-overlay').classList.remove('open');
        }

        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('modal-overlay').addEventListener('click', e => {
            if (e.target === document.getElementById('modal-overlay')) closeModal();
        });
        document.getElementById('md-reserve').addEventListener('click', () => {
            const btn = document.getElementById('md-reserve');
            btn.textContent = '✓ Reservado!';
            setTimeout(() => btn.textContent = 'Reservar esta Obra', 2200);
        });
        document.getElementById('md-wishlist').addEventListener('click', e => {
            const btn = e.currentTarget;
            const icon = btn.querySelector('i');
            icon.className = icon.className.includes('regular') ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
        });

        /* ═══════════════════════════════════════════════════════
           15. LÓGICA REUTILIZÁVEL: VOAR PARA CATEGORIA
        ═══════════════════════════════════════════════════════ */
        function flyToCategory(catName) {
            activeFilter = catName;

            // Atualiza botões superiores (pills)
            document.querySelectorAll('#pills .pill').forEach(p => {
                p.classList.toggle('on', p.dataset.c === catName);
            });

            // Atualiza sistema de filtragem de dados e estado visual das partículas
            bookObjs.forEach(b => {
                b.filtered = (activeFilter === 'all' || b.data.categoria_nome === activeFilter);
                if (!b.filtered) {
                    b.currentScale = 0;
                    b.glow.material.opacity = 0;
                    b.orbitLine.material.opacity = 0;
                }
            });

            // Voo da câmera
            if (activeFilter !== 'all' && activeView === 'gal') {
                const cd = catMap.get(activeFilter);
                if (!cd) return;
                const sp = cd.pos,
                    dir = sp.clone().normalize();
                if (dir.length() < .01) dir.set(0, 0, 1);
                const dist = 32,
                    cp = sp.clone().add(dir.clone().multiplyScalar(dist));
                cp.y += 18;
                cp.x += 8;

                const lbl = document.getElementById('cat-label');
                lbl.textContent = activeFilter;
                gsap.to(lbl, { opacity: 1, duration: .4 });
                setTimeout(() => gsap.to(lbl, { opacity: 0, duration: 1.2 }), 3000);

                gsap.to(cd.star.scale, { x: 2.8, y: 2.8, z: 2.8, duration: 1.2, ease: 'back.out(1.2)' });
                gsap.to(cd.glow.material, { opacity: 1, duration: .6 });
                gsap.to(camLookDst, { x: sp.x, y: sp.y, z: sp.z, duration: 3.5, ease: 'power3.inOut' });
                gsap.to(camera, {
                    fov: 34,
                    duration: 3.5,
                    ease: 'power3.inOut',
                    onUpdate: () => camera.updateProjectionMatrix()
                });
                gsap.to(cam, {
                    tx: cp.x, ty: cp.y, tz: cp.z,
                    duration: 3.5,
                    ease: 'power3.inOut',
                    onComplete: () => {
                        let n = 0;
                        bookObjs.forEach(b => {
                            if (b.filtered && b.searched) {
                                b.glow.visible = true;
                                b.orbitLine.material.opacity = 0;
                                const d = n * .04;
                                n++;
                                gsap.to(b, { currentScale: 1, duration: 1.0, ease: 'back.out(1.2)', delay: d });
                                gsap.to(b.glow.material, { opacity: .7, duration: .8, delay: d });
                                gsap.to(b.orbitLine.material, { opacity: .2, duration: 1.5, ease: 'power2.out', delay: d });
                            }
                        });
                    }
                });
            } else if (activeFilter === 'all' && activeView === 'gal') {
                gsap.to(cam, { tx: 0, ty: 18, tz: 96, duration: 3.8, ease: 'power3.inOut' });
                gsap.to(camLookDst, { x: 0, y: 0, z: 0, duration: 3.8, ease: 'power3.inOut' });
                gsap.to(camera, {
                    fov: 48,
                    duration: 3.8,
                    ease: 'power3.inOut',
                    onUpdate: () => camera.updateProjectionMatrix()
                });
                catMap.forEach(cd => gsap.to(cd.star.scale, { x: 1, y: 1, z: 1, duration: .8 }));
                bookObjs.forEach(b => {
                    if (b.searched) {
                        b.glow.visible = true;
                        b.orbitLine.material.opacity = 0;
                        gsap.to(b, { currentScale: 1, duration: .8, ease: 'back.out(1.5)' });
                        gsap.to(b.glow.material, { opacity: .7, duration: .8 });
                        gsap.to(b.orbitLine.material, { opacity: .12, duration: .8 });
                    }
                });
            }

            if (activeView === 'ed') buildEditorial();
        }

        // Listener dos Pills de categoria no HUD
        document.getElementById('pills').addEventListener('click', e => {
            const btn = e.target.closest('.pill');
            if (!btn) return;
            flyToCategory(btn.dataset.c);
        });

        /* ═══════════════════════════════════════════════════════
           16. BUSCA COM FLY-TO DE CÂMERA
        ═══════════════════════════════════════════════════════ */
        document.getElementById('q').addEventListener('input', e => {
            queryStr = e.target.value.toLowerCase().trim();
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => doSearch(queryStr), 280);
        });

        function getFiltered() {
            return LIVROS.filter(l => {
                const catOk = activeFilter === 'all' || l.categoria_nome === activeFilter;
                const qOk = !queryStr || (l.titulo || '').toLowerCase().includes(queryStr) || (l.autor_nome || '').toLowerCase().includes(queryStr) || (l.categoria_nome || '').toLowerCase().includes(queryStr);
                return catOk && qOk;
            });
        }

        function doSearch(q) {
            const matches = [];
            bookObjs.forEach(b => {
                const ok = !q ||
                    (b.data.titulo || '').toLowerCase().includes(q) ||
                    (b.data.autor_nome || '').toLowerCase().includes(q) ||
                    (b.data.categoria_nome || '').toLowerCase().includes(q);
                b.searched = ok;
                const vis = ok && b.filtered;
                if (!vis) {
                    b.currentScale = 0;
                    gsap.to(b.glow.material, { opacity: 0, duration: .3 });
                    b.orbitLine.material.opacity = 0;
                } else {
                    if (!b.glow.visible) {
                        b.glow.visible = true;
                        b.orbitLine.material.opacity = .12;
                    }
                    gsap.to(b, { currentScale: 1, duration: .5, ease: 'back.out(1.5)' });
                    gsap.to(b.glow.material, { opacity: .7, duration: .4 });
                    if (q) matches.push(b);
                }
            });

            const cnt = bookObjs.filter(b => b.searched && b.filtered).length;
            const cntEl = document.getElementById('search-count');
            if (q) {
                cntEl.textContent = cnt;
                cntEl.classList.add('show');
            } else {
                cntEl.classList.remove('show');
            }

            if (q && matches.length && activeView === 'gal') {
                let cx = 0,
                    cy = 0,
                    cz = 0;
                matches.forEach(b => {
                    cx += b._px || b.cd.pos.x;
                    cy += b._py || b.cd.pos.y;
                    cz += b._pz || b.cd.pos.z;
                });
                cx /= matches.length;
                cy /= matches.length;
                cz /= matches.length;

                const flyLbl = document.getElementById('fly-label');
                flyLbl.textContent = `${cnt} obra${cnt!==1?'s':''} encontrada${cnt!==1?'s':''}`;
                gsap.to(flyLbl, { opacity: 1, duration: .35 });
                setTimeout(() => gsap.to(flyLbl, { opacity: 0, duration: .8 }), 2400);

                gsap.to(cam, { tx: cx + 12, ty: cy + 10, tz: cz + 32, duration: 2.0, ease: 'power3.inOut' });
                gsap.to(camLookDst, { x: cx, y: cy, z: cz, duration: 2.0, ease: 'power3.inOut' });
                matches.slice(0, 6).forEach((b, i) => {
                    setTimeout(() => {
                        gsap.to(b, {
                            currentScale: 3.5,
                            duration: .25,
                            ease: 'back.out(2)',
                            onComplete: () => gsap.to(b, { currentScale: 1, duration: .35 })
                        });
                    }, i * 60);
                });
            } else if (!q && activeView === 'gal') {
                gsap.to(cam, { tx: 0, ty: 18, tz: 96, duration: 2.2, ease: 'power3.out' });
                gsap.to(camLookDst, { x: 0, y: 0, z: 0, duration: 2.2, ease: 'power3.out' });
            }

            if (activeView === 'ed') buildEditorial();
        }

        /* ═══════════════════════════════════════════════════════
           17. TOGGLE DE VISTAS (Galáxia ou Editorial)
        ═══════════════════════════════════════════════════════ */
        document.getElementById('btn-gal').addEventListener('click', () => setView('gal'));
        document.getElementById('btn-ed').addEventListener('click', () => setView('ed'));

        function setView(v) {
            activeView = v;
            is3DActive = (v === 'gal');
            document.getElementById('btn-gal').classList.toggle('on', v === 'gal');
            document.getElementById('btn-ed').classList.toggle('on', v === 'ed');
            document.getElementById('editorial-view').classList.toggle('open', v === 'ed');
            document.getElementById('canvas-dim').classList.toggle('dimmed', v !== 'gal');
            document.getElementById('depth').style.opacity = v === 'gal' ? '1' : '0';
            document.getElementById('hud-bot').style.opacity = v === 'gal' ? '1' : '0.35';
            
            if (v === 'ed') {
                buildEditorial();
                hidePanel();
                gsap.to(bloom, { strength: .18, duration: .8 });
            } else {
                gsap.to(bloom, { strength: 1.4, duration: .8 });
            }
        }

        /* ═══════════════════════════════════════════════════════
           18. BUILDER: MODO EDITORIAL
        ═══════════════════════════════════════════════════════ */
        function buildEditorial() {
            const filtered = getFiltered();
            const avail = LIVROS.filter(l => {
                const n = (l.status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return n.includes('disp');
            }).length;
            document.getElementById('ed-avail').textContent = avail;

            if (filtered.length) {
                const hero = filtered[0];
                const hc = document.getElementById('ed-hero-canvas');
                hc.width = hc.parentElement.clientWidth || 600;
                hc.height = hc.parentElement.clientHeight || 420;
                drawBookArt(hc, hero.titulo, hero.categoria_nome, hc.width, hc.height);
                document.getElementById('ed-hero-title').textContent = hero.titulo || '—';
                document.getElementById('ed-hero-author').textContent = hero.autor_nome || '—';
                document.getElementById('ed-hero-cat').textContent = hero.categoria_nome || '—';
                document.getElementById('ed-hero-year').textContent = hero.ano_publicacao || '—';
                const hs = document.getElementById('ed-hero-status');
                hs.className = 'sbadge ' + statusClass(hero.status);
                hs.textContent = hero.status || '—';
                document.getElementById('ed-hero-btn').onclick = () => openModal(hero);
            }

            const filterBar = document.getElementById('ed-filter-bar');
            if (filterBar.children.length <= 1) {
                uniqCats.forEach(name => {
                    const btn = document.createElement('button');
                    btn.className = 'ed-pill';
                    btn.dataset.c = name;
                    btn.textContent = name;
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.ed-pill').forEach(p => p.classList.remove('on'));
                        btn.classList.add('on');
                        buildEdSections(filtered, name);
                    });
                    filterBar.appendChild(btn);
                });
            }

            buildEdSections(filtered, 'all');
        }

        function buildEdSections(filtered, catFilter) {
            const secs = document.getElementById('ed-sections');
            const cats = catFilter === 'all' ? uniqCats : [catFilter];
            secs.innerHTML = cats.map(cat => {
                const books = filtered.filter(l => l.categoria_nome === cat);
                if (!books.length) return '';
                return `<div class="ed-section">
      <div class="ed-section-header">
        <h2 class="ed-section-title">${cat}</h2>
        <span class="ed-section-count">${books.length} obra${books.length!==1?'s':''}</span>
      </div>
      <div class="ed-scroll-wrapper">
        ${books.map((b,i)=>`
          <div class="ed-book-card" onclick="openModal(LIVROS[${LIVROS.indexOf(b)}])">
            <div class="ed-book-art"><canvas class="ed-card-canvas" data-title="${b.titulo||''}" data-cat="${b.categoria_nome||''}" width="200" height="130"></canvas></div>
            <div class="ed-book-status"><span class="sbadge ${statusClass(b.status)}" style="font-size:.52rem;padding:3px 8px;">${b.status||'—'}</span></div>
            <div class="ed-book-info"><h4>${b.titulo||'—'}</h4><p>${b.autor_nome||'—'}</p></div>
          </div>`).join('')}
      </div>
      <div style="height:1px;background:rgba(255,255,255,0.04);margin:0 60px;"></div>
    </div>`;
            }).join('');

            setTimeout(() => {
                document.querySelectorAll('.ed-card-canvas').forEach(c => {
                    drawBookArt(c, c.dataset.title, c.dataset.cat, 200, 130);
                });
            }, 10);
        }

        /* ═══════════════════════════════════════════════════════
           19. SCROLL PARA ZOOM + PROFUNDIDADE
        ═══════════════════════════════════════════════════════ */
        window.addEventListener('wheel', e => {
            if (activeView !== 'gal') return;
            cam.tz = Math.max(4, Math.min(115, cam.tz + e.deltaY * .034));
            const frac = 1 - (cam.tz - 4) / (115 - 4);
            document.getElementById('ddot').style.top = (frac * 92) + '%';
        }, {
            passive: true
        });

        /* ═══════════════════════════════════════════════════════
           20. LOOP PRINCIPAL DE ANIMAÇÃO
        ═══════════════════════════════════════════════════════ */
        const clock = new THREE.Clock(),
            bhNDC = new THREE.Vector3();

        (function animate() {
            requestAnimationFrame(animate);
            if (!is3DActive) {
                composer.render();
                return;
            }

            const t = clock.getElapsedTime();
            if (bgMat) bgMat.uniforms.uT.value = t;
            if (galMat) galMat.uniforms.uT.value = t;
            if (galDustMat) galDustMat.uniforms.uT.value = t;
            if (diskMat) diskMat.uniforms.uT.value = t;

            camera.position.x += (cam.tx - camera.position.x) * .018;
            camera.position.y += (cam.ty - camera.position.y) * .018;
            camera.position.z += (cam.tz - camera.position.z) * .022;
            camLook.x += (camLookDst.x - camLook.x) * .02;
            camLook.y += (camLookDst.y - camLook.y) * .02;
            camLook.z += (camLookDst.z - camLook.z) * .02;
            camera.lookAt(camLook.x, camLook.y, camLook.z);

            bhNDC.set(0, 0, 0).project(camera);
            lensPass.uniforms.uBHPos.value.set((bhNDC.x + 1) / 2, (bhNDC.y + 1) / 2);
            const bhDist = camera.position.length();
            lensPass.uniforms.uBHR.value = Math.min(.1, 5.5 / bhDist);
            lensPass.uniforms.uStr.value = Math.min(.05, 3.5 / bhDist);

            bookObjs.forEach(b => {
                b.oAng += b.oSpd * .006;
                const cp = b.cd.pos,
                    r = b.oRad,
                    a = b.oAng;
                const px = cp.x + Math.cos(a) * r * Math.cos(b.tiltX);
                const py = cp.y + Math.sin(a) * r * Math.sin(b.tiltZ) * .38;
                const pz = cp.z + Math.sin(a) * r * Math.cos(b.tiltX);
                b._px = px;
                b._py = py;
                b._pz = pz;

                if (b.filtered && b.searched) {
                    const targetHover = b.isHovered ? 3.5 : 1;
                    b.hoverScale += (targetHover - b.hoverScale) * .13;
                    const fs = b.sz * b.currentScale * b.hoverScale;
                    dummy.position.set(px, py, pz);
                    dummy.scale.set(fs, fs, fs);
                    dummy.rotation.set(0, 0, 0);
                    if (b.isHovered) {
                        dummy.rotation.y += .05;
                        dummy.rotation.x += .02;
                    }
                    dummy.updateMatrix();
                    planetMesh.setMatrixAt(b.idx, dummy.matrix);
                } else {
                    dummy.position.set(px, py, pz);
                    dummy.scale.set(0, 0, 0);
                    dummy.updateMatrix();
                    planetMesh.setMatrixAt(b.idx, dummy.matrix);
                }

                if (b.glow.visible) {
                    b.glow.position.set(px, py, pz);
                    const tg = b.isHovered ? 1.1 : (b.currentScale > 0 ? .68 : 0);
                    b.glow.material.opacity += (tg - b.glow.material.opacity) * .12;
                }
            });
            planetMesh.instanceMatrix.needsUpdate = true;

            catMap.forEach(cd => {
                const p = .7 + .3 * Math.sin(t * 1.3 + cd.pos.x * .1);
                cd.glow.material.opacity = p * .9;
                cd.glow2.material.opacity = p * .22;
                cd.neb.material.opacity = .065 + .03 * Math.sin(t * .6 + cd.pos.z * .08);
                cd.star.rotation.y = t * .25;
                const s = .94 + .06 * Math.sin(t * 2.2 + cd.pos.x * .16);
                cd.star.scale.setScalar(s);
            });

            updateConstellationLines();

            const zFrac = (cam.tz - 4) / (115 - 4);
            bloom.strength = 1.4 + .65 * (1 - zFrac);

            composer.render();
        })();

        /* ═══════════════════════════════════════════════════════
           21. PILLS DE CATEGORIA (INICIALIZAÇÃO)
        ═══════════════════════════════════════════════════════ */
        const pillsEl = document.getElementById('pills');
        uniqCats.forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'pill';
            btn.dataset.c = name;
            btn.innerHTML = `<span>${name}</span>`;
            pillsEl.appendChild(btn);
        });

        /* ═══════════════════════════════════════════════════════
           22. INTRO ANIMAÇÃO
        ═══════════════════════════════════════════════════════ */
        camera.position.set(0, 55, 210);
        gsap.to(camera.position, { y: 22, z: 96, duration: 3.8, ease: 'power3.out', delay: 2.8 });
        gsap.from('#hud', { opacity: 0, y: -20, duration: 1.5, ease: 'power2.out', delay: 3.4 });
        gsap.from('#nav', { opacity: 0, x: -32, duration: 1.5, ease: 'power2.out', delay: 3.2 });
        gsap.from('#hud-bot', { opacity: 0, y: 18, duration: 1.5, ease: 'power2.out', delay: 3.7 });
        gsap.from('#depth', { opacity: 0, x: 18, duration: 1.5, ease: 'power2.out', delay: 3.7 });
        gsap.from('#scroll-hint', {
            opacity: 0, duration: 1.2, delay: 5,
            onComplete: () => gsap.to('#scroll-hint', { opacity: 0, delay: 3.5, duration: 1.8 })
        });
        setTimeout(() => {
            const sp = document.getElementById('splash');
            if (sp) sp.style.display = 'none';
        }, 3900);

        /* ═══════════════════════════════════════════════════════
           23. RESIZE
        ═══════════════════════════════════════════════════════ */
        window.addEventListener('resize', () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
            composer.setSize(innerWidth, innerHeight);
            if (activeView === 'ed') buildEditorial();
        });
    </script>
</body>
</html>