<?php
require_once "../config/conexao.php";
require_once "../config/dados.php";
$mysqli->set_charset("utf8mb4");

$repo = new \App\Repository\LivroRepository($mysqli);
try {
    $livros = $repo->listarTodos();
} catch (Exception $e) {
    die("Erro: " . htmlspecialchars($e->getMessage()));
}

$livros = $livros ?? [];
$livrosJson = json_encode($livros, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);

// TRAVA DE SEGURANÇA: Se o json_encode falhar (ex: erro de acentuação UTF-8 vindo do banco)
if ($livrosJson === false) {
    echo "<script>console.error('Erro no PHP ao converter JSON: " . json_last_error_msg() . "');</script>";
    $livrosJson = '[]'; // Força um array vazio para o JS não quebrar
}

$totalLivros    = count($livros);
$categorias     = array_values(array_filter(array_unique(array_column($livros, 'categoria_nome'))));
$totalCats      = count($categorias);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Catálogo Cósmico · Biblioteca Andrômeda</title>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<link href="https://unpkg.com/aos@2.3.4/dist/aos.css" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap" rel="stylesheet">

<style>
/* ══════════════════════════════════════════════════════
   VARIÁVEIS & RESET
══════════════════════════════════════════════════════ */
:root {
    --mg:        #A61C5C;
    --mg-glow:   rgba(166,28,92,0.42);
    --mg-dim:    rgba(166,28,92,0.18);
    --void:      #000005;
    --glass:     rgba(3,0,12,0.72);
    --glass-b:   rgba(255,255,255,0.06);
    --text:      rgba(255,255,255,0.85);
    --text-dim:  rgba(255,255,255,0.35);
    --nav-w:     64px;
    --nav-we:    230px;
    --nav-dur:   0.45s;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
html,body { width:100%; height:100%; overflow:hidden; background:var(--void); font-family:'Montserrat',sans-serif; color:#fff; }

/* ══════════════════════════════════════════════════════
   CANVAS & GRAIN
══════════════════════════════════════════════════════ */
#webgl { position:fixed; inset:0; z-index:1; }
#grain {
    position:fixed; inset:0; z-index:7; pointer-events:none;
    opacity:0.038; image-rendering:pixelated; mix-blend-mode:screen;
}
#canvas-dim {
    position:fixed; inset:0; z-index:2; pointer-events:none;
    background:rgba(0,0,5,0.0); transition:background 0.7s;
}
#canvas-dim.dimmed { background:rgba(0,0,5,0.72); }

/* ══════════════════════════════════════════════════════
   NAVBAR LATERAL
══════════════════════════════════════════════════════ */
#nav {
    position:fixed; left:0; top:0; bottom:0;
    width:var(--nav-w); z-index:100;
    background:rgba(2,0,9,0.7);
    backdrop-filter:blur(28px) saturate(1.6);
    -webkit-backdrop-filter:blur(28px) saturate(1.6);
    border-right:1px solid var(--glass-b);
    display:flex; flex-direction:column;
    align-items:flex-start; padding:20px 0;
    transition:width var(--nav-dur) cubic-bezier(0.23,1,0.32,1);
    overflow:hidden;
}
#nav:hover { width:var(--nav-we); }

/* Logo */
.nav-logo {
    width:100%; display:flex; align-items:center; gap:14px;
    padding:4px 16px 24px;
}
.nav-logo-orb {
    width:32px; height:32px; border-radius:50%; flex-shrink:0;
    background:radial-gradient(circle at 38% 36%, #fff 0%, var(--mg) 70%);
    box-shadow:0 0 22px var(--mg-glow);
    display:flex; align-items:center; justify-content:center;
}
.nav-logo-orb i { font-size:0.78rem; color:rgba(255,255,255,0.9); }
.nav-logo-text {
    font-family:'Cinzel',serif; font-size:0.68rem; font-weight:700;
    letter-spacing:0.18em; white-space:nowrap; text-transform:uppercase;
    background:linear-gradient(90deg,#fff 0%,var(--mg) 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
    opacity:0; transition:opacity 0.2s 0.1s;
}
#nav:hover .nav-logo-text { opacity:1; }

/* Divisor */
.nav-div {
    width:calc(100% - 28px); margin:0 14px 8px;
    height:1px; background:var(--glass-b); flex-shrink:0;
}

/* Seção */
.nav-sec { width:100%; display:flex; flex-direction:column; gap:2px; padding:0 8px; flex:1; }
.nav-foot { width:100%; padding:8px 8px 0; }

/* Item */
.nav-item {
    display:flex; align-items:center; gap:16px;
    padding:11px 10px; border-radius:12px;
    cursor:pointer; text-decoration:none !important;
    white-space:nowrap; position:relative;
    transition:background 0.25s, transform 0.22s;
    color:inherit;
}
.nav-item:hover { background:var(--mg-dim); transform:translateX(3px); }
.nav-item.active { background:rgba(166,28,92,0.22); }
.nav-item.active::before {
    content:''; position:absolute; left:0; top:22%; height:56%;
    width:3px; border-radius:0 4px 4px 0;
    background:var(--mg); box-shadow:0 0 12px var(--mg-glow);
}
.nav-item i {
    width:28px; text-align:center; font-size:1rem;
    color:rgba(255,255,255,0.5); flex-shrink:0;
    transition:color 0.25s;
}
.nav-item:hover i, .nav-item.active i { color:rgba(255,255,255,0.92); }
.nav-item span {
    font-size:0.7rem; font-weight:500; letter-spacing:0.09em;
    text-transform:uppercase; color:rgba(255,255,255,0.65);
    opacity:0; transition:opacity 0.18s 0.07s;
}
#nav:hover .nav-item span { opacity:1; }

/* ══════════════════════════════════════════════════════
   HUD TOPO
══════════════════════════════════════════════════════ */
#hud {
    position:fixed; top:0;
    left:var(--nav-w); right:0; z-index:50;
    padding:14px 24px; display:flex; align-items:center; gap:14px;
    background:linear-gradient(to bottom,rgba(0,0,5,0.78) 0%,transparent 100%);
    pointer-events:none;
}
#hud > * { pointer-events:auto; }

/* Busca */
.hud-search {
    display:flex; align-items:center; gap:9px;
    background:rgba(255,255,255,0.055);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:100px; padding:8px 18px;
    backdrop-filter:blur(14px); min-width:240px; max-width:320px;
    transition:border-color 0.3s, box-shadow 0.3s;
}
.hud-search:focus-within {
    border-color:rgba(166,28,92,0.55);
    box-shadow:0 0 24px rgba(166,28,92,0.22);
}
.hud-search i { color:var(--text-dim); font-size:0.82rem; flex-shrink:0; }
.hud-search input {
    background:none; border:none; outline:none;
    color:#fff; font-family:'Montserrat',sans-serif;
    font-size:0.8rem; font-weight:400; letter-spacing:0.04em; width:100%;
}
.hud-search input::placeholder { color:rgba(255,255,255,0.28); }

/* Pills filtro */
#pills {
    display:flex; gap:6px; overflow-x:auto; flex:1;
    scrollbar-width:none;
}
#pills::-webkit-scrollbar { display:none; }
.pill {
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:100px; padding:5px 13px;
    font-size:0.66rem; font-family:'Montserrat',sans-serif;
    font-weight:500; letter-spacing:0.07em; text-transform:uppercase;
    color:var(--text-dim); cursor:pointer; white-space:nowrap;
    transition:all 0.25s;
}
.pill:hover,.pill.on {
    background:rgba(166,28,92,0.22);
    border-color:rgba(166,28,92,0.5); color:#fff;
}

/* Toggle view */
.view-tog {
    display:flex; gap:3px;
    background:rgba(255,255,255,0.04);
    border:1px solid var(--glass-b); border-radius:11px; padding:3px;
}
.view-tog button {
    background:none; border:none; color:var(--text-dim);
    padding:6px 10px; border-radius:8px; cursor:pointer;
    font-size:0.88rem; transition:all 0.25s;
}
.view-tog button.on { background:var(--mg-dim); color:#fff; }

/* ══════════════════════════════════════════════════════
   PAINEL DE LIVRO (DIREITA)
══════════════════════════════════════════════════════ */
#book-panel {
    position:fixed; right:-380px; top:50%;
    transform:translateY(-50%);
    width:340px; z-index:80;
    background:rgba(3,0,12,0.9);
    backdrop-filter:blur(30px);
    border:1px solid rgba(166,28,92,0.28);
    border-right:none; border-radius:20px 0 0 20px;
    padding:26px 22px;
    transition:right 0.52s cubic-bezier(0.23,1,0.32,1);
}
#book-panel.open { right:0; }

.bp-cat {
    display:inline-block; font-size:0.6rem;
    letter-spacing:0.14em; text-transform:uppercase;
    font-family:'Cinzel',serif; padding:3px 11px;
    border-radius:100px; margin-bottom:12px;
    background:rgba(166,28,92,0.15);
    border:1px solid rgba(166,28,92,0.28);
    color:rgba(255,255,255,0.65);
}
.bp-title {
    font-family:'Cinzel',serif; font-size:1.08rem;
    font-weight:700; line-height:1.35; margin-bottom:6px; color:#fff;
}
.bp-author {
    font-size:0.78rem; color:var(--text-dim);
    margin-bottom:18px; font-weight:300; font-style:italic;
}
.bp-meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
.bp-field label {
    display:block; font-size:0.57rem; letter-spacing:0.14em;
    text-transform:uppercase; color:rgba(255,255,255,0.28); margin-bottom:3px;
}
.bp-field .val { font-size:0.78rem; color:rgba(255,255,255,0.78); font-weight:500; }
.bp-actions { display:flex; gap:8px; }

/* Badges de status */
.sbadge {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 11px; border-radius:100px;
    font-size:0.63rem; font-weight:600; letter-spacing:0.07em; text-transform:uppercase;
}
.sbadge::before { content:''; width:5px; height:5px; border-radius:50%; }
.sbadge.s-disp { background:rgba(34,197,94,0.13); color:#4ade80; border:1px solid rgba(34,197,94,0.28); }
.sbadge.s-disp::before { background:#4ade80; box-shadow:0 0 6px #4ade80; }
.sbadge.s-empr { background:rgba(239,68,68,0.13); color:#f87171; border:1px solid rgba(239,68,68,0.28); }
.sbadge.s-empr::before { background:#f87171; }
.sbadge.s-res  { background:rgba(251,146,60,0.13); color:#fb923c; border:1px solid rgba(251,146,60,0.28); }
.sbadge.s-res::before  { background:#fb923c; }
.sbadge.s-unk  { background:rgba(148,163,184,0.1); color:rgba(255,255,255,0.4); border:1px solid rgba(255,255,255,0.08); }
.sbadge.s-unk::before  { background:rgba(255,255,255,0.3); }

.btn-prim {
    flex:1; padding:9px; background:var(--mg);
    border:none; border-radius:10px; color:#fff;
    font-family:'Cinzel',serif; font-size:0.68rem;
    letter-spacing:0.18em; text-transform:uppercase; cursor:pointer;
    transition:background 0.3s, box-shadow 0.3s;
}
.btn-prim:hover { background:#c42070; box-shadow:0 0 22px var(--mg-glow); }
.btn-sec {
    padding:9px 13px; background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.09); border-radius:10px;
    color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.9rem;
    transition:all 0.25s;
}
.btn-sec:hover { background:rgba(255,255,255,0.09); color:#fff; }

/* ══════════════════════════════════════════════════════
   MODAL DETALHES
══════════════════════════════════════════════════════ */
#modal {
    position:fixed; inset:0; z-index:200;
    background:rgba(0,0,8,0.88);
    backdrop-filter:blur(22px);
    display:flex; align-items:center; justify-content:center;
    opacity:0; pointer-events:none; transition:opacity 0.4s;
}
#modal.open { opacity:1; pointer-events:auto; }
.modal-card {
    background:rgba(4,0,14,0.96);
    border:1px solid rgba(166,28,92,0.32);
    border-radius:24px; padding:40px;
    max-width:520px; width:92%;
    position:relative;
    box-shadow:0 0 100px rgba(166,28,92,0.12), 0 40px 80px rgba(0,0,0,0.6);
    animation:cardIn 0.4s cubic-bezier(0.23,1,0.32,1) both;
}
@keyframes cardIn {
    from { transform:scale(0.92) translateY(24px); opacity:0; }
    to   { transform:scale(1)    translateY(0);    opacity:1; }
}
.modal-x {
    position:absolute; top:14px; right:14px;
    width:34px; height:34px; border-radius:10px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:rgba(255,255,255,0.45); font-size:0.85rem;
    transition:all 0.25s;
}
.modal-x:hover { background:var(--mg-dim); color:#fff; border-color:rgba(166,28,92,0.4); }
.modal-title { font-family:'Cinzel',serif; font-size:1.45rem; font-weight:700; line-height:1.3; margin-bottom:5px; }
.modal-author { color:var(--text-dim); font-size:0.85rem; font-weight:300; font-style:italic; margin-bottom:26px; }
.modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:28px; }
.modal-field label { font-size:0.58rem; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.28); display:block; margin-bottom:4px; }
.modal-field .v { font-size:0.88rem; color:rgba(255,255,255,0.82); font-weight:500; }
.modal-btn {
    width:100%; padding:14px; background:var(--mg); border:none;
    border-radius:14px; color:#fff; font-family:'Cinzel',serif;
    font-size:0.82rem; letter-spacing:0.32em; text-transform:uppercase;
    cursor:pointer; box-shadow:0 0 32px rgba(166,28,92,0.28);
    transition:all 0.35s;
}
.modal-btn:hover { box-shadow:0 0 55px rgba(166,28,92,0.5); letter-spacing:0.4em; }

/* ══════════════════════════════════════════════════════
   VISTA LISTA
══════════════════════════════════════════════════════ */
#list-view {
    position:fixed; top:68px; bottom:0;
    left:var(--nav-w); right:0; z-index:40;
    overflow-y:auto; padding:24px 32px 48px;
    opacity:0; pointer-events:none; transition:opacity 0.5s;
    scrollbar-width:thin; scrollbar-color:rgba(166,28,92,0.35) transparent;
}
#list-view.open { opacity:1; pointer-events:auto; }
#list-view::-webkit-scrollbar { width:4px; }
#list-view::-webkit-scrollbar-thumb { background:rgba(166,28,92,0.35); border-radius:4px; }

.book-card {
    background:rgba(4,0,14,0.7);
    border:1px solid rgba(255,255,255,0.055);
    border-radius:18px; padding:22px; height:100%;
    position:relative; overflow:hidden; cursor:pointer;
    transition:border-color 0.35s, box-shadow 0.35s, transform 0.35s;
}
.book-card::after {
    content:''; position:absolute; top:0; left:0; right:0;
    height:2px; background:var(--c, var(--mg)); opacity:0; transition:opacity 0.35s;
}
.book-card:hover {
    border-color:rgba(166,28,92,0.32);
    box-shadow:0 0 44px rgba(166,28,92,0.1), 0 10px 40px rgba(0,0,0,0.45);
    transform:translateY(-5px);
}
.book-card:hover::after { opacity:1; }
.book-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:14px; }
.cat-tag {
    font-size:0.58rem; letter-spacing:0.1em; text-transform:uppercase;
    font-family:'Cinzel',serif; padding:3px 10px; border-radius:100px;
    background:rgba(255,255,255,0.055); border:1px solid rgba(255,255,255,0.09);
    color:rgba(255,255,255,0.5); white-space:nowrap; max-width:140px;
    overflow:hidden; text-overflow:ellipsis;
}
.bc-title { font-family:'Cinzel',serif; font-size:0.93rem; font-weight:700; line-height:1.32; margin-bottom:4px; color:#fff; }
.bc-author { font-size:0.73rem; color:var(--text-dim); margin-bottom:14px; font-weight:300; font-style:italic; }
.bc-meta { display:flex; gap:14px; font-size:0.68rem; color:rgba(255,255,255,0.3); margin-bottom:14px; }
.bc-meta span { display:flex; align-items:center; gap:5px; }

/* ══════════════════════════════════════════════════════
   HUD INFERIOR (stats + profundidade)
══════════════════════════════════════════════════════ */
#hud-bot {
    position:fixed; bottom:20px;
    left:calc(var(--nav-w) + 22px); z-index:50;
    display:flex; gap:18px;
    font-size:0.66rem; font-family:'Montserrat',sans-serif;
    letter-spacing:0.09em; text-transform:uppercase;
    color:rgba(255,255,255,0.3); pointer-events:none;
}
#hud-bot span { display:flex; align-items:center; gap:7px; }
#hud-bot strong { color:rgba(255,255,255,0.65); }

/* Indicador de profundidade (direita) */
#depth {
    position:fixed; right:20px; top:50%; transform:translateY(-50%);
    z-index:50; display:flex; flex-direction:column;
    align-items:center; gap:8px; pointer-events:none;
}
.depth-lbl {
    font-size:0.55rem; letter-spacing:0.14em; text-transform:uppercase;
    font-family:'Cinzel',serif; color:rgba(255,255,255,0.2);
    writing-mode:vertical-rl;
}
.depth-track {
    width:2px; height:110px; background:rgba(255,255,255,0.07);
    border-radius:4px; position:relative;
}
.depth-dot {
    position:absolute; left:50%; top:0%; width:8px; height:8px;
    border-radius:50%; background:var(--mg);
    box-shadow:0 0 12px var(--mg-glow);
    transform:translate(-50%,0); transition:top 0.4s cubic-bezier(0.23,1,0.32,1);
}

/* Tooltip */
#tip {
    position:fixed; z-index:75; pointer-events:none;
    background:rgba(3,0,12,0.92); border:1px solid rgba(166,28,92,0.28);
    border-radius:8px; padding:5px 12px;
    font-size:0.7rem; font-family:'Cinzel',serif;
    color:rgba(255,255,255,0.82); letter-spacing:0.05em;
    opacity:0; transition:opacity 0.18s; white-space:nowrap;
    max-width:240px; overflow:hidden; text-overflow:ellipsis;
}
#tip.show { opacity:1; }

/* Cursor ring */
#ring {
    position:fixed; pointer-events:none; z-index:60;
    width:36px; height:36px; border-radius:50%;
    border:1px solid rgba(166,28,92,0.45);
    transform:translate(-50%,-50%);
    transition:width 0.25s, height 0.25s, border-color 0.25s, opacity 0.25s;
    opacity:0;
}
#ring.on { width:56px; height:56px; border-color:rgba(166,28,92,0.85); opacity:1; }

/* Indicador de categoria ao voar */
#cat-label {
    position:fixed; left:50%; top:calc(var(--nav-w)/2 + 80px);
    transform:translateX(-50%);
    z-index:55; pointer-events:none;
    font-family:'Cinzel',serif; font-size:0.75rem;
    letter-spacing:0.22em; text-transform:uppercase;
    color:rgba(255,255,255,0.7);
    text-shadow:0 0 20px var(--mg-glow);
    opacity:0; transition:opacity 0.5s;
}

/* ══════════════════════════════════════════════════════
   INTRO — Fade-in inicial
══════════════════════════════════════════════════════ */
#splash {
    position:fixed; inset:0; z-index:300;
    background:var(--void);
    display:flex; align-items:center; justify-content:center;
    flex-direction:column; gap:12px;
    animation:splashOut 0.9s ease 2.4s forwards;
    pointer-events:none;
}
@keyframes splashOut { to { opacity:0; } }
.splash-title {
    font-family:'Cinzel',serif; font-size:clamp(2rem,5vw,4rem);
    font-weight:700; letter-spacing:0.3em; text-transform:uppercase;
    color:transparent;
    background:linear-gradient(180deg,#fff 0%,var(--mg) 100%);
    -webkit-background-clip:text; background-clip:text;
    animation:splashPulse 2.2s ease-in-out forwards;
}
.splash-sub {
    font-size:0.75rem; letter-spacing:0.5em; text-transform:uppercase;
    color:rgba(255,255,255,0.35); font-weight:300;
    animation:splashPulse 2.2s ease-in-out 0.2s forwards;
}
@keyframes splashPulse {
    0%   { opacity:0; transform:translateY(18px); }
    30%  { opacity:1; transform:translateY(0); }
    80%  { opacity:1; }
    100% { opacity:0; }
}
</style>
</head>
<body>

<div id="splash">
    <p class="splash-title">Andrômeda</p>
    <p class="splash-sub">Catálogo Cósmico</p>
</div>

<canvas id="grain"></canvas>
<div id="canvas-dim"></div>
<div id="webgl"></div>
<div id="tip"></div>
<div id="ring"></div>
<div id="cat-label"></div>

<nav id="nav">
    <div class="nav-logo">
        <div class="nav-logo-orb"><i class="fa-solid fa-atom"></i></div>
        <span class="nav-logo-text">Andrômeda</span>
    </div>
    <div class="nav-div"></div>
    <div class="nav-sec">
        <a href="catalogo.php" class="nav-item active">
            <i class="fa-solid fa-book-open"></i><span>Catálogo</span>
        </a>
        <a href="perfil.php" class="nav-item">
            <i class="fa-solid fa-user-astronaut"></i><span>Meu Perfil</span>
        </a>
        <a href="emprestimos.php" class="nav-item">
            <i class="fa-solid fa-bookmark"></i><span>Empréstimos</span>
        </a>
        <a href="reservas.php" class="nav-item">
            <i class="fa-solid fa-clock-rotate-left"></i><span>Reservas</span>
        </a>
        <a href="dashboard.php" class="nav-item">
            <i class="fa-solid fa-chart-line"></i><span>Painel</span>
        </a>
    </div>
    <div class="nav-div"></div>
    <div class="nav-foot">
        <a href="index.php" class="nav-item">
            <i class="fa-solid fa-rocket"></i><span>Início</span>
        </a>
        <a href="logout.php" class="nav-item">
            <i class="fa-solid fa-right-from-bracket"></i><span>Sair</span>
        </a>
    </div>
</nav>

<div id="hud">
    <div class="hud-search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="q" type="text" placeholder="Explorar o cosmos…">
    </div>
    <div id="pills">
        <button class="pill on" data-c="all">Todos</button>
    </div>
    <div class="view-tog">
        <button id="btn-gal" class="on" title="Galáxia"><i class="fa-solid fa-circle-nodes"></i></button>
        <button id="btn-lst" title="Lista"><i class="fa-solid fa-grip"></i></button>
    </div>
</div>

<div id="hud-bot">
    <span><i class="fa-solid fa-book"></i> <strong><?= $totalLivros ?></strong>&nbsp;obras</span>
    <span><i class="fa-solid fa-layer-group"></i> <strong><?= $totalCats ?></strong>&nbsp;categorias</span>
    <span id="scroll-hint"><i class="fa-solid fa-scroll"></i> Rolar para explorar</span>
</div>

<div id="depth">
    <span class="depth-lbl">Orbital</span>
    <div class="depth-track"><div class="depth-dot" id="ddot"></div></div>
    <span class="depth-lbl">Galáxia</span>
</div>

<div id="book-panel">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <span class="bp-cat" id="bp-cat">—</span>
        <span class="sbadge s-unk" id="bp-status">—</span>
    </div>
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

<div id="modal">
    <div class="modal-card">
        <button class="modal-x" id="modal-x"><i class="fa-solid fa-xmark"></i></button>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px">
            <span class="bp-cat" id="m-cat">—</span>
            <span class="sbadge s-unk" id="m-status">—</span>
        </div>
        <h2 class="modal-title" id="m-title">—</h2>
        <p class="modal-author" id="m-author">—</p>
        <div class="modal-grid">
            <div class="modal-field"><label>Ano de Publicação</label><span class="v" id="m-year">—</span></div>
            <div class="modal-field"><label>Editora</label><span class="v" id="m-pub">—</span></div>
            <div class="modal-field"><label>Categoria</label><span class="v" id="m-catv">—</span></div>
            <div class="modal-field"><label>Status</label><span class="v" id="m-sv">—</span></div>
        </div>
        <button class="modal-btn" id="m-res">Reservar esta obra</button>
    </div>
</div>

<div id="list-view">
    <div class="row g-4" id="grid"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
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
// ═══════════════════════════════════════════════════════════
// 0. DADOS PHP → JS (COM PROTEÇÃO CONTRA ERRO DE PARSE)
// ═══════════════════════════════════════════════════════════
const LIVROS = <?php echo !empty($livrosJson) ? $livrosJson : '[]'; ?>;

// ═══════════════════════════════════════════════════════════
// 1. GRAIN
// ═══════════════════════════════════════════════════════════
(function(){
    const c = document.getElementById('grain');
    c.width = c.height = 200;
    const x = c.getContext('2d');
    setInterval(() => {
        const d = x.createImageData(200,200);
        for (let i=0;i<d.data.length;i+=4){
            const v=Math.random()*255;
            d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255;
        }
        x.putImageData(d,0,0);
    }, 85);
})();

AOS.init({ duration:650, easing:'ease-out-cubic', once:true });

// ═══════════════════════════════════════════════════════════
// 2. THREE.JS — SETUP & POST
// ═══════════════════════════════════════════════════════════
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(0, 22, 130);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.getElementById('webgl').appendChild(renderer.domElement);

// Post-processing
const rPass = new THREE.RenderPass(scene, camera);

const bloom  = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.3, 0.55, 0.82);
bloom.threshold = 0.04; bloom.strength = 1.3; bloom.radius = 0.8;

const ChromaShader = {
    uniforms: { tDiffuse:{value:null}, uS:{value:0.006} },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
        uniform sampler2D tDiffuse; uniform float uS; varying vec2 vUv;
        void main(){
            vec2 c=vUv-0.5; float d=length(c); vec2 o=c*d*uS;
            gl_FragColor=vec4(
                texture2D(tDiffuse,vUv-o*1.2).r,
                texture2D(tDiffuse,vUv).g,
                texture2D(tDiffuse,vUv+o).b, 1.0
            );
        }`
};
const chroma = new THREE.ShaderPass(ChromaShader);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(rPass); composer.addPass(bloom); composer.addPass(chroma);

// ═══════════════════════════════════════════════════════════
// 3. CAMPO ESTELAR DE FUNDO
// ═══════════════════════════════════════════════════════════
let bgMat;
(function(){
    const N=7500, geom=new THREE.BufferGeometry();
    const pos=new Float32Array(N*3), rnd=new Float32Array(N);
    for(let i=0;i<N;i++){
        pos[i*3]=(Math.random()-0.5)*1600;
        pos[i*3+1]=(Math.random()-0.5)*1600;
        pos[i*3+2]=(Math.random()-0.5)*1600;
        rnd[i]=Math.random();
    }
    geom.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geom.setAttribute('aR',new THREE.BufferAttribute(rnd,1));
    bgMat=new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
        uniforms:{uT:{value:0}},
        vertexShader:`
            attribute float aR; uniform float uT; varying float vR;
            void main(){
                vR=aR; float tw=0.5+0.5*sin(uT*1.5+aR*93.0);
                vec4 vp=viewMatrix*modelMatrix*vec4(position,1.0);
                gl_Position=projectionMatrix*vp;
                gl_PointSize=(5.0/-vp.z)*(0.35+aR*0.65)*tw;
            }`,
        fragmentShader:`
            varying float vR;
            void main(){
                float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.4);
                vec3 col=mix(vec3(0.72,0.86,1.0),vec3(1.0,0.93,0.82),vR);
                gl_FragColor=vec4(col*s,s*0.88);
            }`
    });
    scene.add(new THREE.Points(geom,bgMat));
})();

// ═══════════════════════════════════════════════════════════
// 4. GALÁXIA ESPIRAL
// ═══════════════════════════════════════════════════════════
let galMat;
(function(){
    const N=55000, geom=new THREE.BufferGeometry();
    const pos=new Float32Array(N*3), col=new Float32Array(N*3), aR=new Float32Array(N*3);
    for(let i=0;i<N;i++){
        const i3=i*3;
        const r=Math.pow(Math.random(),2.2)*68+3;
        const br=i%3, ang=(br/3)*Math.PI*2+r*0.58;
        const sp=Math.pow(Math.random(),2)*Math.max(0,(68-r)*0.22);
        pos[i3]  =Math.cos(ang)*r+(Math.random()-0.5)*sp;
        pos[i3+1]=(Math.random()-0.5)*(r<14?2.8:0.65);
        pos[i3+2]=Math.sin(ang)*r+(Math.random()-0.5)*sp;
        const mx=r/68;
        col[i3]=1-mx*0.85; col[i3+1]=0.87-mx*0.74; col[i3+2]=0.58+mx*0.42;
        aR[i3]=Math.random(); aR[i3+1]=Math.random(); aR[i3+2]=Math.random();
    }
    geom.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geom.setAttribute('color',new THREE.BufferAttribute(col,3));
    geom.setAttribute('aR',new THREE.BufferAttribute(aR,3));
    galMat=new THREE.ShaderMaterial({
        depthWrite:false, blending:THREE.AdditiveBlending,
        vertexColors:true, transparent:true,
        uniforms:{ uT:{value:0}, uTilt:{value:0.0} },
        vertexShader:`
            attribute vec3 aR; uniform float uT,uTilt; varying vec3 vC;
            void main(){
                vC=color;
                float dist=length(position.xz);
                float ang=atan(position.z,position.x)+uT*0.07/(dist*0.35+1.0);
                vec3 p=vec3(cos(ang)*dist, position.y, sin(ang)*dist);
                vec4 vp=viewMatrix*modelMatrix*vec4(p,1.0);
                gl_Position=projectionMatrix*vp;
                gl_PointSize=(20.0/-vp.z)*(0.22+aR.x*0.48);
            }`,
        fragmentShader:`
            varying vec3 vC;
            void main(){
                float s=pow(1.0-distance(gl_PointCoord,vec2(0.5)),3.0);
                gl_FragColor=vec4(vC*s,s*0.72);
            }`
    });
    const gal = new THREE.Points(geom,galMat);
    gal.rotation.x = 1.1; gal.rotation.z = 0.12;
    scene.add(gal);
})();

// ═══════════════════════════════════════════════════════════
// 5. HELPERS DE GLOW
// ═══════════════════════════════════════════════════════════
const _glowCache = new Map();
function hexToRgb(h){ return { r:(h>>16)&255, g:(h>>8)&255, b:h&255 }; }

function mkGlow(hex, sz) {
    if(!_glowCache.has(hex)){
        const {r,g,b}=hexToRgb(hex);
        const cv=document.createElement('canvas');
        cv.width=cv.height=64;
        const cx=cv.getContext('2d');
        const gr=cx.createRadialGradient(32,32,0,32,32,32);
        gr.addColorStop(0,`rgba(${r},${g},${b},1)`);
        gr.addColorStop(0.38,`rgba(${r},${g},${b},0.32)`);
        gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
        cx.fillStyle=gr; cx.fillRect(0,0,64,64);
        _glowCache.set(hex, new THREE.CanvasTexture(cv));
    }
    const mat=new THREE.SpriteMaterial({
        map:_glowCache.get(hex), blending:THREE.AdditiveBlending,
        transparent:true, depthWrite:false
    });
    const sp=new THREE.Sprite(mat);
    sp.scale.set(sz,sz,1);
    return sp;
}

// ═══════════════════════════════════════════════════════════
// 6. PALETA DE CATEGORIAS
// ═══════════════════════════════════════════════════════════
const PALETTE = [
    0x4488ff, 0xff3377, 0x33ffcc, 0xffaa11,
    0xaa33ff, 0x33ff88, 0xff6633, 0x11ccff,
    0xff33aa, 0x88ff44, 0xffcc33, 0x3355ff
];

function catColor(name){
    if(!name) return PALETTE[0];
    let h=0;
    for(const c of name){ h=((h<<5)-h)+c.charCodeAt(0); h|=0; }
    return PALETTE[Math.abs(h)%PALETTE.length];
}

// ═══════════════════════════════════════════════════════════
// 7. SISTEMAS ESTELARES (CATEGORIAS)
// ═══════════════════════════════════════════════════════════
const catMap = new Map();
const uniqCats = [...new Set(LIVROS.map(l=>l.categoria_nome).filter(Boolean))];

uniqCats.forEach((name, idx) => {
    const t    = (idx+0.5)/uniqCats.length;
    const br   = idx%3;
    const ang  = (br/3)*Math.PI*2 + t*Math.PI*5.5;
    const rad  = 12 + t*44;
    const jX   = (Math.random()-0.5)*3.5;
    const jY   = (Math.random()-0.5)*6;
    const jZ   = (Math.random()-0.5)*3.5;

    const x = Math.cos(ang)*rad + jX;
    const y = jY;
    const z = Math.sin(ang)*rad + jZ;

    const col   = catColor(name);
    const {r,g,b} = hexToRgb(col);

    // Estrela central
    const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.55,14,14),
        new THREE.MeshBasicMaterial({ color:col })
    );
    star.position.set(x,y,z);
    scene.add(star);

    // Glow principal
    const glow = mkGlow(col,11);
    glow.position.set(x,y,z); glow.material.opacity=0.82;
    scene.add(glow);

    // Nébula ambiental
    const neb = mkGlow(col,32);
    neb.position.set(x,y,z); neb.material.opacity=0.10;
    scene.add(neb);

    catMap.set(name, {
        name, col, star, glow, neb,
        pos: new THREE.Vector3(x,y,z),
        books: []
    });
});

// ═══════════════════════════════════════════════════════════
// 8. PLANETAS (LIVROS)
// ═══════════════════════════════════════════════════════════
const bookObjs = [], bookMeshes = [];
let HOVER = null, selBook = null;

LIVROS.forEach((livro, idx) => {
    const cd = catMap.get(livro.categoria_nome);
    if(!cd) return;

    const oIdx   = cd.books.length;
    const oRad   = 3.2 + (oIdx%7)*0.95 + Math.random()*0.55;
    const oSpd   = (0.13+Math.random()*0.30)*(Math.random()>0.5?1:-1);
    const oAng   = (idx*2.399960438)%(Math.PI*2); // golden angle → distribuição uniforme
    const tiltX  = (Math.random()-0.5)*Math.PI*0.55;
    const tiltZ  = (Math.random()-0.5)*Math.PI*0.28;
    const sz     = 0.13+Math.random()*0.11;

    // Cor por status
    const st  = (livro.status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let pcol;
    if(st.includes('disp'))       pcol=0x22dd88;
    else if(st.includes('empr'))  pcol=0xff4444;
    else if(st.includes('res'))   pcol=0xffaa22;
    else                          pcol=0x8899ff;

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(sz,10,10),
        new THREE.MeshBasicMaterial({ color:pcol })
    );
    mesh.userData.idx = idx;
    scene.add(mesh);

    const glow = mkGlow(pcol, 2.2);
    glow.material.opacity = 0.72;
    scene.add(glow);

    const obj = {
        mesh, glow, data:livro, cd,
        oRad, oSpd, oAng, tiltX, tiltZ, sz, pcol, idx,
        filtered: true
    };
    cd.books.push(obj);
    bookObjs.push(obj);
    bookMeshes.push(mesh);
});

// ═══════════════════════════════════════════════════════════
// 9. CÂMERA — ESTADO & CONTROLES
// ═══════════════════════════════════════════════════════════
const cam = { tx:0, ty:18, tz:96 };
let mX=0, mY=0, isListView=false, is3DActive=true, activeFilter='all', queryStr='';

window.addEventListener('wheel', e => {
    if(isListView) return;
    cam.tz = Math.max(5, Math.min(110, cam.tz + e.deltaY*0.038));
    // Atualizar depth dot
    const frac = 1-(cam.tz-5)/(110-5);
    document.getElementById('ddot').style.top = (frac*92)+'%';
}, { passive:true });

document.addEventListener('mousemove', e => {
    mX=(e.clientX/innerWidth-0.5)*2;
    mY=(e.clientY/innerHeight-0.5)*2;
    if(!isListView){ cam.tx=mX*16; cam.ty=18-mY*9; }
    // Mover ring e tooltip
    const ring=document.getElementById('ring');
    const tip =document.getElementById('tip');
    ring.style.left=e.clientX+'px'; ring.style.top=e.clientY+'px';
    tip.style.left=(e.clientX+18)+'px'; tip.style.top=(e.clientY-12)+'px';
    handleRaycast(e);
});

// ═══════════════════════════════════════════════════════════
// 10. RAYCASTING
// ═══════════════════════════════════════════════════════════
const ray  = new THREE.Raycaster();
const mVec = new THREE.Vector2();

function handleRaycast(e){
    if(isListView) return;
    mVec.x=(e.clientX/innerWidth)*2-1;
    mVec.y=-(e.clientY/innerHeight)*2+1;
    ray.setFromCamera(mVec, camera);

    const visible = bookMeshes.filter(m=>m.visible);
    const hits = ray.intersectObjects(visible);

    const tip  = document.getElementById('tip');
    const ring = document.getElementById('ring');

    if(hits.length>0){
        const hit = hits[0].object;
        const bo  = bookObjs.find(b=>b.mesh===hit);
        if(bo && bo!==HOVER){
            HOVER=bo; selBook=bo;
            showPanel(bo);
            tip.textContent=bo.data.titulo||'';
            tip.classList.add('show');
            ring.classList.add('on');
            document.body.style.cursor='pointer';
        }
    } else {
        if(HOVER){ HOVER=null; hidePanel(); }
        tip.classList.remove('show');
        ring.classList.remove('on');
        document.body.style.cursor='default';
    }
}

renderer.domElement.addEventListener('click', () => {
    if(HOVER) openModal(HOVER.data);
});

// ═══════════════════════════════════════════════════════════
// 11. PAINEL LATERAL
// ═══════════════════════════════════════════════════════════
function statusClass(s){
    const n=(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(n.includes('disp')) return 's-disp';
    if(n.includes('empr')) return 's-empr';
    if(n.includes('res'))  return 's-res';
    return 's-unk';
}

function showPanel(bo){
    const d=bo.data;
    document.getElementById('bp-cat').textContent    = d.categoria_nome||'—';
    document.getElementById('bp-title').textContent  = d.titulo||'—';
    document.getElementById('bp-author').textContent = d.autor_nome||'Desconhecido';
    document.getElementById('bp-year').textContent   = d.ano_publicacao||'—';
    document.getElementById('bp-pub').textContent    = d.editora_nome||'—';
    const sel=document.getElementById('bp-status');
    sel.className='sbadge '+statusClass(d.status);
    sel.textContent=d.status||'—';
    document.getElementById('book-panel').classList.add('open');
}
function hidePanel(){
    document.getElementById('book-panel').classList.remove('open');
}

document.getElementById('bp-reserve').addEventListener('click',()=>{ if(selBook) openModal(selBook.data); });
document.getElementById('bp-expand').addEventListener('click', ()=>{ if(selBook) openModal(selBook.data); });

// ═══════════════════════════════════════════════════════════
// 12. MODAL
// ═══════════════════════════════════════════════════════════
function openModal(d){
    document.getElementById('m-title').textContent  = d.titulo||'—';
    document.getElementById('m-author').textContent = d.autor_nome||'—';
    document.getElementById('m-year').textContent   = d.ano_publicacao||'—';
    document.getElementById('m-pub').textContent    = d.editora_nome||'—';
    document.getElementById('m-cat').textContent    = d.categoria_nome||'—';
    document.getElementById('m-catv').textContent   = d.categoria_nome||'—';
    document.getElementById('m-sv').textContent     = d.status||'—';
    const ms=document.getElementById('m-status');
    ms.className='sbadge '+statusClass(d.status);
    ms.textContent=d.status||'—';
    document.getElementById('modal').classList.add('open');
}

document.getElementById('modal-x').addEventListener('click',()=>document.getElementById('modal').classList.remove('open'));
document.getElementById('modal').addEventListener('click',e=>{ if(e.target===document.getElementById('modal')) document.getElementById('modal').classList.remove('open'); });
document.getElementById('m-res').addEventListener('click',()=>{
    // reservar: window.location.href = 'reservar.php?id=' + currentBookId;
    alert('Reserva registrada!');
});

// ═══════════════════════════════════════════════════════════
// 13. TOGGLE DE VISTA
// ═══════════════════════════════════════════════════════════
document.getElementById('btn-gal').addEventListener('click',()=>setView('gal'));
document.getElementById('btn-lst').addEventListener('click',()=>setView('lst'));

function setView(v){
    isListView=(v==='lst');
    is3DActive = !isListView; // Pausa o 3D se for lista
    document.getElementById('btn-gal').classList.toggle('on',!isListView);
    document.getElementById('btn-lst').classList.toggle('on',isListView);
    document.getElementById('list-view').classList.toggle('open',isListView);
    document.getElementById('canvas-dim').classList.toggle('dimmed',isListView);
    document.getElementById('depth').style.opacity=isListView?'0':'1';
    document.getElementById('hud-bot').style.opacity=isListView?'0.4':'1';

    if(isListView){
        buildList(); hidePanel();
        gsap.to(bloom,{strength:0.35,duration:0.8});
    } else {
        gsap.to(bloom,{strength:1.3,duration:0.8});
        AOS.refresh();
    }
}

// ═══════════════════════════════════════════════════════════
// 14. VISTA LISTA
// ═══════════════════════════════════════════════════════════
let listBuilt=false;

function buildList(){
    const grid=document.getElementById('grid');
    const filtered=LIVROS.filter(l=>{
        const catOk = activeFilter==='all' || l.categoria_nome===activeFilter;
        const qOk   = !queryStr ||
            (l.titulo||'').toLowerCase().includes(queryStr) ||
            (l.autor_nome||'').toLowerCase().includes(queryStr) ||
            (l.categoria_nome||'').toLowerCase().includes(queryStr);
        return catOk && qOk;
    });

    grid.innerHTML = filtered.map((livro, i) => {
        const cidx = LIVROS.indexOf(livro);
        const cHex = '#'+catColor(livro.categoria_nome).toString(16).padStart(6,'0');
        const sc   = statusClass(livro.status);
        const del  = Math.min(i*55,700);
        return `<div class="col-12 col-md-6 col-xl-4" data-aos="fade-up" data-aos-delay="${del}">
            <div class="book-card" style="--c:${cHex}" onclick="openModal(LIVROS[${cidx}])">
                <div class="book-card-top">
                    <span class="cat-tag">${livro.categoria_nome||'—'}</span>
                    <span class="sbadge ${sc}">${livro.status||'—'}</span>
                </div>
                <h3 class="bc-title">${livro.titulo||'—'}</h3>
                <p class="bc-author">${livro.autor_nome||'Desconhecido'}</p>
                <div class="bc-meta">
                    <span><i class="fa-solid fa-calendar"></i>${livro.ano_publicacao||'—'}</span>
                    <span><i class="fa-solid fa-building"></i>${(livro.editora_nome||'—').substring(0,18)}</span>
                </div>
            </div>
        </div>`;
    }).join('');
    setTimeout(()=>AOS.refresh(),10);
}

// ═══════════════════════════════════════════════════════════
// 15. FILTRO DE CATEGORIA
// ═══════════════════════════════════════════════════════════
const pillsEl = document.getElementById('pills');
uniqCats.forEach(name=>{
    const btn=document.createElement('button');
    btn.className='pill'; btn.dataset.c=name; btn.textContent=name;
    pillsEl.appendChild(btn);
});

pillsEl.addEventListener('click',e=>{
    const btn=e.target.closest('.pill');
    if(!btn) return;
    document.querySelectorAll('.pill').forEach(p=>p.classList.remove('on'));
    btn.classList.add('on');
    activeFilter=btn.dataset.c;

    // Visibilidade dos planetas
    bookObjs.forEach(b=>{
        const ok=activeFilter==='all'||b.data.categoria_nome===activeFilter;
        b.filtered=ok;
        b.mesh.visible=ok&&b.searched!==false;
        b.glow.visible=b.mesh.visible;
    });

    // Voar para a categoria
    if(activeFilter!=='all'){
        const cd=catMap.get(activeFilter);
        if(cd){
            const lbl=document.getElementById('cat-label');
            lbl.textContent=activeFilter;
            lbl.style.opacity='1';
            setTimeout(()=>lbl.style.opacity='0',2500);
            // ANIMAÇÃO CINEMATOGRÁFICA DE APROXIMAÇÃO
            gsap.to(cam,{ tx:cd.pos.x, ty:cd.pos.y+10, tz:cd.pos.z+28, duration:3.2, ease:'expo.inOut' });
        }
    } else {
        // ANIMAÇÃO CINEMATOGRÁFICA DE RETORNO
        gsap.to(cam,{ tx:0, ty:18, tz:96, duration:3.5, ease:'expo.inOut' });
    }

    if(isListView){ buildList(); }
});

// ═══════════════════════════════════════════════════════════
// 16. BUSCA
// ═══════════════════════════════════════════════════════════
document.getElementById('q').addEventListener('input',e=>{
    queryStr=e.target.value.toLowerCase().trim();
    bookObjs.forEach(b=>{
        const ok=!queryStr||
            (b.data.titulo||'').toLowerCase().includes(queryStr)||
            (b.data.autor_nome||'').toLowerCase().includes(queryStr)||
            (b.data.categoria_nome||'').toLowerCase().includes(queryStr);
        b.searched=ok;
        b.mesh.visible=ok&&b.filtered;
        b.glow.visible=b.mesh.visible;
        if(ok&&queryStr){
            gsap.to(b.mesh.scale,{x:2.5,y:2.5,z:2.5,duration:0.4,ease:'back.out(2)',yoyo:true,repeat:1});
        }
    });
    if(isListView){ buildList(); }
});

// ═══════════════════════════════════════════════════════════
// 17. LOOP DE ANIMAÇÃO
// ═══════════════════════════════════════════════════════════
const clock = new THREE.Clock();

(function animate(){
    requestAnimationFrame(animate);

    if(!is3DActive) return; // ECONOMIA DE GPU QUANDO A LISTA ESTÁ ABERTA

    const t = clock.getElapsedTime();

    if(bgMat)  bgMat.uniforms.uT.value=t;
    if(galMat) galMat.uniforms.uT.value=t;

    // Camera smooth follow
    camera.position.x += (cam.tx - camera.position.x)*0.038;
    camera.position.y += (cam.ty - camera.position.y)*0.038;
    camera.position.z += (cam.tz - camera.position.z)*0.058;
    camera.lookAt(cam.tx*0.22, cam.ty*0.22, 0);
    camera.updateProjectionMatrix();

    // Planetas em órbita
    bookObjs.forEach(b=>{
        if(!b.mesh.visible) return;
        b.oAng += b.oSpd * 0.006;
        const cp=b.cd.pos, r=b.oRad, a=b.oAng;
        const px=cp.x + Math.cos(a)*r*Math.cos(b.tiltX);
        const py=cp.y + Math.sin(a)*r*Math.sin(b.tiltZ)*0.38;
        const pz=cp.z + Math.sin(a)*r*Math.cos(b.tiltX);
        b.mesh.position.set(px,py,pz);
        b.glow.position.set(px,py,pz);

        // Hover scale, glow e ROTAÇÃO
        const isHovered = (b === HOVER);
        const ts = isHovered ? 3.2 : 1.0;
        const tg = isHovered ? 1.1 : 0.68;
        
        b.mesh.scale.x += (ts - b.mesh.scale.x) * 0.14;
        b.mesh.scale.y = b.mesh.scale.z = b.mesh.scale.x;
        b.glow.material.opacity += (tg - b.glow.material.opacity) * 0.14;

        if (isHovered) {
            b.mesh.rotation.y += 0.05;
            b.mesh.rotation.x += 0.02;
        }
    });

    // Pulso das estrelas
    catMap.forEach((cd,_)=>{
        const p=0.72+0.28*Math.sin(t*1.25+cd.pos.x*0.09);
        cd.glow.material.opacity=p*0.85;
        cd.neb.material.opacity =0.075+0.04*Math.sin(t*0.55+cd.pos.z*0.07);
        cd.star.rotation.y=t*0.22;
        // Mini-pulso de escala
        const s=0.95+0.05*Math.sin(t*2.0+cd.pos.x*0.15);
        cd.star.scale.setScalar(s);
    });

    // Bloom reage ao zoom
    const zoomFrac=(cam.tz-5)/(110-5);
    bloom.strength=1.3+0.7*(1-zoomFrac);

    composer.render();
})();

// ═══════════════════════════════════════════════════════════
// 18. ENTRADA CINEMATOGRÁFICA
// ═══════════════════════════════════════════════════════════
camera.position.set(0, 50, 200);
gsap.to(camera.position, { y:22, z:96, duration:3.5, ease:'power3.out', delay:2.4 });
gsap.from('#hud',      { opacity:0, y:-18, duration:1.4, ease:'power2.out', delay:3.2 });
gsap.from('#nav',      { opacity:0, x:-28, duration:1.4, ease:'power2.out', delay:3.0 });
gsap.from('#hud-bot',  { opacity:0, y:16,  duration:1.4, ease:'power2.out', delay:3.5 });
gsap.from('#depth',    { opacity:0, x:16,  duration:1.4, ease:'power2.out', delay:3.5 });
gsap.from('#scroll-hint', { opacity:0, duration:1, delay:4.5, onComplete:()=>{
    gsap.to('#scroll-hint',{opacity:0,delay:3,duration:1.5});
}});

// Remove splash pointer-events após fade
setTimeout(()=>document.getElementById('splash').style.display='none', 3400);

// ═══════════════════════════════════════════════════════════
// 19. RESIZE
// ═══════════════════════════════════════════════════════════
window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    composer.setSize(innerWidth,innerHeight);
});
</script>
</body>
</html>