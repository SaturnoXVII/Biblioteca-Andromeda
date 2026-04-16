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
if ($livrosJson === false) {
    echo "<script>console.error('Erro no PHP: " . json_last_error_msg() . "');</script>";
    $livrosJson = '[]';
}

$totalLivros = count($livros);
$categorias  = array_values(array_filter(array_unique(array_column($livros, 'categoria_nome'))));
$totalCats   = count($categorias);
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
    --mg2:       #7B2FF7;
    --mg-glow:   rgba(166,28,92,0.45);
    --mg-glow2:  rgba(123,47,247,0.35);
    --mg-dim:    rgba(166,28,92,0.18);
    --void:      #000005;
    --glass:     rgba(3,0,12,0.72);
    --glass-b:   rgba(255,255,255,0.06);
    --text:      rgba(255,255,255,0.85);
    --text-dim:  rgba(255,255,255,0.35);
    --nav-w:     64px;
    --nav-we:    230px;
    --nav-dur:   0.45s;
    --scan-size: 3px;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
html,body { width:100%; height:100%; overflow:hidden; background:var(--void); font-family:'Montserrat',sans-serif; color:#fff; }

* { cursor: none !important; }

/* ══════════════════════════════════════════════════════
   CANVAS & GRAIN
══════════════════════════════════════════════════════ */
#webgl { position:fixed; inset:0; z-index:1; }
#grain {
    position:fixed; inset:0; z-index:7; pointer-events:none;
    opacity:0.032; image-rendering:pixelated; mix-blend-mode:screen;
}
#canvas-dim {
    position:fixed; inset:0; z-index:2; pointer-events:none;
    background:rgba(0,0,5,0.0); transition:background 0.7s;
}
#canvas-dim.dimmed { background:rgba(0,0,5,0.78); }

/* ══════════════════════════════════════════════════════
   NAVBAR LATERAL
══════════════════════════════════════════════════════ */
#nav {
    position:fixed; left:0; top:0; bottom:0;
    width:var(--nav-w); z-index:100;
    background:rgba(2,0,9,0.65);
    backdrop-filter:blur(32px) saturate(1.8);
    -webkit-backdrop-filter:blur(32px) saturate(1.8);
    border-right:1px solid var(--glass-b);
    display:flex; flex-direction:column;
    align-items:flex-start; padding:20px 0;
    transition:width var(--nav-dur) cubic-bezier(0.23,1,0.32,1);
    overflow:hidden;
}
#nav:hover { width:var(--nav-we); }
#nav::before {
    content:''; position:absolute; top:0; left:0; right:0; bottom:0;
    background:linear-gradient(180deg, rgba(166,28,92,0.04) 0%, transparent 40%, rgba(123,47,247,0.04) 100%);
    pointer-events:none;
}

.nav-logo { width:100%; display:flex; align-items:center; gap:14px; padding:4px 16px 24px; }
.nav-logo-orb {
    width:32px; height:32px; border-radius:50%; flex-shrink:0;
    background:radial-gradient(circle at 38% 36%, #fff 0%, var(--mg) 60%, var(--mg2) 100%);
    box-shadow:0 0 28px var(--mg-glow), 0 0 56px var(--mg-glow2);
    display:flex; align-items:center; justify-content:center;
    animation: orbPulse 4s ease-in-out infinite;
}
@keyframes orbPulse {
    0%,100% { box-shadow:0 0 28px var(--mg-glow), 0 0 56px var(--mg-glow2); }
    50% { box-shadow:0 0 44px var(--mg-glow), 0 0 88px var(--mg-glow2); }
}
.nav-logo-orb i { font-size:0.78rem; color:rgba(255,255,255,0.9); }
.nav-logo-text {
    font-family:'Cinzel',serif; font-size:0.68rem; font-weight:700;
    letter-spacing:0.18em; white-space:nowrap; text-transform:uppercase;
    background:linear-gradient(90deg,#fff 0%,var(--mg) 55%, var(--mg2) 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    opacity:0; transition:opacity 0.2s 0.1s;
}
#nav:hover .nav-logo-text { opacity:1; }

.nav-div { width:calc(100% - 28px); margin:0 14px 8px; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); flex-shrink:0; }
.nav-sec { width:100%; display:flex; flex-direction:column; gap:2px; padding:0 8px; flex:1; }
.nav-foot { width:100%; padding:8px 8px 0; }

.nav-item {
    display:flex; align-items:center; gap:16px; padding:11px 10px; border-radius:12px;
    cursor:pointer !important; text-decoration:none !important; white-space:nowrap; position:relative;
    transition:background 0.25s, transform 0.22s; color:inherit;
}
.nav-item:hover { background:var(--mg-dim); transform:translateX(3px); }
.nav-item.active { background:rgba(166,28,92,0.22); }
.nav-item.active::before {
    content:''; position:absolute; left:0; top:22%; height:56%; width:3px; border-radius:0 4px 4px 0;
    background:linear-gradient(180deg, var(--mg), var(--mg2)); box-shadow:0 0 14px var(--mg-glow);
}
.nav-item i { width:28px; text-align:center; font-size:1rem; color:rgba(255,255,255,0.5); flex-shrink:0; transition:color 0.25s; }
.nav-item:hover i, .nav-item.active i { color:rgba(255,255,255,0.92); }
.nav-item span {
    font-size:0.7rem; font-weight:500; letter-spacing:0.09em; text-transform:uppercase; 
    color:rgba(255,255,255,0.65); opacity:0; transition:opacity 0.18s 0.07s;
}
#nav:hover .nav-item span { opacity:1; }

/* ══════════════════════════════════════════════════════
   HUD TOPO
══════════════════════════════════════════════════════ */
#hud {
    position:fixed; top:0; left:var(--nav-w); right:0; z-index:50;
    padding:14px 24px; display:flex; align-items:center; gap:14px;
    background:linear-gradient(to bottom,rgba(0,0,5,0.82) 0%,transparent 100%); pointer-events:auto;
}
#hud::after {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:repeating-linear-gradient(0deg, transparent, transparent calc(var(--scan-size) - 1px), rgba(0,0,0,0.08) var(--scan-size));
    z-index:1;
}

.hud-search {
    display:flex; align-items:center; gap:9px; background:rgba(255,255,255,0.042);
    border:1px solid rgba(255,255,255,0.08); border-radius:100px; padding:8px 18px;
    backdrop-filter:blur(20px); min-width:240px; max-width:320px; transition:border-color 0.3s, box-shadow 0.3s, background 0.3s;
    position:relative; overflow:hidden;
}
.hud-search::before {
    content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(166,28,92,0.05), rgba(123,47,247,0.05));
    opacity:0; transition:opacity 0.3s;
}
.hud-search:focus-within::before { opacity:1; }
.hud-search:focus-within { border-color:rgba(166,28,92,0.5); box-shadow:0 0 28px rgba(166,28,92,0.18), 0 0 0 1px rgba(123,47,247,0.1) inset; }
.hud-search i { color:var(--text-dim); font-size:0.82rem; flex-shrink:0; position:relative; z-index:1; }
.hud-search input {
    background:none; border:none; outline:none; color:#fff; font-family:'Montserrat',sans-serif; 
    font-size:0.8rem; font-weight:400; letter-spacing:0.04em; width:100%; position:relative; z-index:1;
}
.hud-search input::placeholder { color:rgba(255,255,255,0.25); }

#pills { display:flex; gap:6px; overflow-x:auto; flex:1; scrollbar-width:none; }
#pills::-webkit-scrollbar { display:none; }
.pill {
    background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.08);
    border-radius:100px; padding:5px 13px; font-size:0.66rem; font-family:'Montserrat',sans-serif; 
    font-weight:500; letter-spacing:0.07em; text-transform:uppercase; color:var(--text-dim); 
    cursor:pointer !important; white-space:nowrap; transition:all 0.28s cubic-bezier(0.23,1,0.32,1);
    position:relative; overflow:hidden;
}
.pill::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg, var(--mg), var(--mg2)); opacity:0; transition:opacity 0.28s; border-radius:inherit; }
.pill span { position:relative; z-index:1; }
.pill:hover,.pill.on { border-color:rgba(166,28,92,0.45); color:#fff; box-shadow:0 0 18px rgba(166,28,92,0.15); }
.pill.on::after { opacity:0.22; }

.view-tog { display:flex; gap:3px; background:rgba(255,255,255,0.04); border:1px solid var(--glass-b); border-radius:11px; padding:3px; }
.view-tog button { background:none; border:none; color:var(--text-dim); padding:6px 10px; border-radius:8px; cursor:pointer !important; font-size:0.88rem; transition:all 0.25s; }
.view-tog button.on { background:linear-gradient(135deg, rgba(166,28,92,0.3), rgba(123,47,247,0.2)); color:#fff; box-shadow:0 0 12px rgba(166,28,92,0.2); }

/* ══════════════════════════════════════════════════════
   PAINEL DE LIVRO (LIQUID GLASS)
══════════════════════════════════════════════════════ */
#book-panel {
    position:fixed; right:-420px; top:50%; transform:translateY(-50%); width:380px; z-index:80;
    /* Efeito Liquid Glass */
    background: linear-gradient(145deg, rgba(10,5,25,0.65) 0%, rgba(3,0,14,0.85) 100%);
    backdrop-filter: blur(40px) brightness(1.1);
    border: 1px solid rgba(255,255,255,0.06);
    border-right: none; 
    border-radius: 32px 0 0 32px; 
    padding: 32px 28px; 
    transition: right 0.6s cubic-bezier(0.25, 1, 0.5, 1); 
    overflow: hidden;
    box-shadow: -20px 0 60px rgba(0,0,0,0.7), inset 1px 1px 0 rgba(255,255,255,0.1);
}
#book-panel::after {
    content:''; position:absolute; top:0; left:0; bottom:0; right:0;
    background:radial-gradient(ellipse at 0% 0%, rgba(166,28,92,0.15) 0%, transparent 60%), 
               radial-gradient(ellipse at 100% 100%, rgba(123,47,247,0.1) 0%, transparent 60%); pointer-events:none;
}
#book-panel.open { right:0; }

.bp-cat {
    display:inline-block; font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase; 
    font-family:'Cinzel',serif; padding:4px 12px; border-radius:100px; margin-bottom:16px; 
    background:rgba(166,28,92,0.15); border:1px solid rgba(166,28,92,0.3); color:rgba(255,255,255,0.7);
}
.bp-title { font-family:'Cinzel',serif; font-size:1.2rem; font-weight:700; line-height:1.35; margin-bottom:8px; color:#fff; position:relative; z-index:1; }
.bp-author { font-size:0.85rem; color:var(--text-dim); margin-bottom:24px; font-weight:300; font-style:italic; position:relative; z-index:1; }
.bp-meta { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; position:relative; z-index:1; }
.bp-field label { display:block; font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-bottom:4px; }
.bp-field .val { font-size:0.85rem; color:rgba(255,255,255,0.85); font-weight:500; }
.bp-actions { display:flex; gap:12px; position:relative; z-index:1; }

.sbadge {
    display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:100px; 
    font-size:0.65rem; font-weight:600; letter-spacing:0.07em; text-transform:uppercase;
}
.sbadge::before { content:''; width:6px; height:6px; border-radius:50%; }
.sbadge.s-disp { background:rgba(34,197,94,0.12); color:#4ade80; border:1px solid rgba(34,197,94,0.26); }
.sbadge.s-disp::before { background:#4ade80; box-shadow:0 0 8px #4ade80; animation:dotPulse 2s ease-in-out infinite; }
.sbadge.s-empr { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.26); }
.sbadge.s-empr::before { background:#f87171; }
.sbadge.s-res  { background:rgba(251,146,60,0.12); color:#fb923c; border:1px solid rgba(251,146,60,0.26); }
.sbadge.s-res::before  { background:#fb923c; }
.sbadge.s-unk  { background:rgba(148,163,184,0.08); color:rgba(255,255,255,0.38); border:1px solid rgba(255,255,255,0.07); }
.sbadge.s-unk::before  { background:rgba(255,255,255,0.3); }
@keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

.btn-prim {
    flex:1; padding:12px; cursor:pointer !important; background:linear-gradient(135deg, var(--mg) 0%, var(--mg2) 100%);
    border:none; border-radius:12px; color:#fff; font-family:'Cinzel',serif; font-size:0.75rem; 
    letter-spacing:0.18em; text-transform:uppercase; transition:all 0.3s; position:relative; overflow:hidden;
}
.btn-prim::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent); opacity:0; transition:opacity 0.3s; }
.btn-prim:hover::after { opacity:1; }
.btn-prim:hover { box-shadow:0 0 28px var(--mg-glow), 0 0 14px var(--mg-glow2); letter-spacing:0.22em; }
.btn-sec {
    padding:12px 16px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); 
    border-radius:12px; color:rgba(255,255,255,0.55); cursor:pointer !important; font-size:1rem; transition:all 0.25s;
}
.btn-sec:hover { background:rgba(255,255,255,0.09); color:#fff; }

/* ══════════════════════════════════════════════════════
   MODAL 
══════════════════════════════════════════════════════ */
#modal {
    position:fixed; inset:0; z-index:200; background:rgba(0,0,8,0.86); backdrop-filter:blur(28px) saturate(1.4); 
    display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity 0.4s;
}
#modal.open { opacity:1; pointer-events:auto; }
.modal-card {
    background:rgba(4,0,16,0.97); border:1px solid rgba(166,28,92,0.28); border-radius:32px; padding:48px; 
    max-width:560px; width:92%; position:relative; overflow:hidden; box-shadow:0 0 120px rgba(166,28,92,0.1), 0 40px 80px rgba(0,0,0,0.7);
    animation:cardIn 0.45s cubic-bezier(0.23,1,0.32,1) both;
}
@keyframes cardIn { from { transform:scale(0.9) translateY(28px); opacity:0; } to { transform:scale(1) translateY(0); opacity:1; } }
.modal-x {
    position:absolute; top:20px; right:20px; z-index:2; width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; cursor:pointer !important; 
    color:rgba(255,255,255,0.4); font-size:1rem; transition:all 0.25s;
}
.modal-x:hover { background:var(--mg-dim); color:#fff; border-color:rgba(166,28,92,0.4); }
.modal-title { font-family:'Cinzel',serif; font-size:1.6rem; font-weight:700; margin-bottom:8px; position:relative; z-index:1; }
.modal-author { color:var(--text-dim); font-size:0.9rem; font-weight:300; font-style:italic; margin-bottom:32px; position:relative; z-index:1; }
.modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:36px; position:relative; z-index:1; }
.modal-field label { font-size:0.6rem; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.25); display:block; margin-bottom:6px; }
.modal-field .v { font-size:0.95rem; color:rgba(255,255,255,0.85); font-weight:500; }
.modal-btn {
    width:100%; padding:16px; cursor:pointer !important; background:linear-gradient(135deg, var(--mg) 0%, var(--mg2) 100%);
    border:none; border-radius:16px; color:#fff; font-family:'Cinzel',serif; font-size:0.85rem; letter-spacing:0.32em; 
    text-transform:uppercase; position:relative; overflow:hidden; z-index:1; transition:all 0.35s;
}
.modal-btn:hover { box-shadow:0 0 55px var(--mg-glow), 0 0 28px var(--mg-glow2); letter-spacing:0.4em; }

/* ══════════════════════════════════════════════════════
   VISÃO EM LISTA (BENTO GRID & LIQUID GLASS)
══════════════════════════════════════════════════════ */
#list-view {
    position:fixed; top:68px; bottom:0; left:var(--nav-w); right:0; z-index:40;
    overflow-y:auto; padding:32px 48px 64px; opacity:0; pointer-events:none; transition:opacity 0.5s;
    scrollbar-width:thin; scrollbar-color:rgba(166,28,92,0.35) transparent;
}
#list-view.open { opacity:1; pointer-events:auto; }
#list-view::-webkit-scrollbar { width:4px; }
#list-view::-webkit-scrollbar-thumb { background:rgba(166,28,92,0.35); border-radius:4px; }

/* Bento Grid Nativo */
.bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-auto-rows: 200px;
    grid-auto-flow: dense;
    gap: 24px;
    max-width: 1400px;
    margin: 0 auto;
}

@media (max-width: 768px) {
    .bento-grid { display: flex; flex-direction: column; }
    #list-view { padding: 24px 16px 48px; }
}

/* Liquid Glass Cards */
.book-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
    backdrop-filter: blur(24px) saturate(1.2);
    -webkit-backdrop-filter: blur(24px) saturate(1.2);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 28px;
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    cursor: pointer !important;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3);
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

/* Brilho de categoria no fundo do card */
.book-card::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%; right: -50%; bottom: -50%;
    background: radial-gradient(circle at 70% 30%, var(--c), transparent 45%);
    opacity: 0.12;
    transition: opacity 0.5s;
    pointer-events: none;
    z-index: 0;
}

.book-card:hover {
    transform: translateY(-6px) scale(1.01);
    border-color: rgba(255,255,255,0.15);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.2), 0 16px 48px rgba(0,0,0,0.5), 0 0 60px var(--c-glow);
}
.book-card:hover::before { opacity: 0.25; }

/* Bento Sizing Classes */
@media (min-width: 992px) {
    .bento-large { grid-column: span 2; grid-row: span 2; padding: 36px; }
    .bento-tall  { grid-row: span 2; }
    .bento-wide  { grid-column: span 2; }
}

.book-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:14px; position:relative; z-index:1; }
.bc-content { flex: 1; display: flex; flex-direction: column; justify-content: center; position:relative; z-index:1; }

.cat-tag {
    font-size:0.55rem; letter-spacing:0.12em; text-transform:uppercase; font-family:'Cinzel',serif; padding:4px 12px; border-radius:100px; 
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); white-space:nowrap; 
}
.bc-title { font-family:'Cinzel',serif; font-size:1.05rem; font-weight:700; margin-bottom:6px; color:#fff; }
.bento-large .bc-title { font-size: 1.8rem; margin-bottom: 12px; }
.bento-tall .bc-title { font-size: 1.4rem; }
.bento-wide .bc-title { font-size: 1.4rem; }

.bc-author { font-size:0.8rem; color:var(--text-dim); margin-bottom:0; font-weight:300; font-style:italic; }
.bento-large .bc-author { font-size: 1rem; }

.bc-meta { display:flex; gap:16px; font-size:0.7rem; color:rgba(255,255,255,0.4); margin-top:16px; position:relative; z-index:1; }
.bento-large .bc-meta { font-size: 0.8rem; margin-top: 24px; }
.bc-meta span { display: flex; align-items: center; gap: 6px; }

/* ══════════════════════════════════════════════════════
   RESTANTE DO ESTILO
══════════════════════════════════════════════════════ */
#hud-bot {
    position:fixed; bottom:20px; left:calc(var(--nav-w) + 22px); z-index:50;
    display:flex; gap:18px; font-size:0.66rem; font-family:'Montserrat',sans-serif;
    letter-spacing:0.09em; text-transform:uppercase; color:rgba(255,255,255,0.28); pointer-events:none;
}
#hud-bot span { display:flex; align-items:center; gap:7px; }
#hud-bot strong { color:rgba(255,255,255,0.62); }

#depth {
    position:fixed; right:20px; top:50%; transform:translateY(-50%); z-index:50; 
    display:flex; flex-direction:column; align-items:center; gap:8px; pointer-events:none;
}
.depth-lbl { font-size:0.55rem; letter-spacing:0.14em; text-transform:uppercase; font-family:'Cinzel',serif; color:rgba(255,255,255,0.18); writing-mode:vertical-rl; }
.depth-track { width:2px; height:110px; background:linear-gradient(to bottom, rgba(166,28,92,0.25), rgba(123,47,247,0.25)); border-radius:4px; position:relative; }
.depth-dot {
    position:absolute; left:50%; top:0%; width:8px; height:8px; border-radius:50%;
    background:linear-gradient(135deg, var(--mg), var(--mg2)); box-shadow:0 0 14px var(--mg-glow), 0 0 7px var(--mg-glow2);
    transform:translate(-50%,0); transition:top 0.4s cubic-bezier(0.23,1,0.32,1);
}

#tip {
    position:fixed; z-index:75; pointer-events:none; background:rgba(3,0,12,0.95); border:1px solid rgba(166,28,92,0.3); border-radius:8px; padding:5px 12px;
    font-size:0.7rem; font-family:'Cinzel',serif; color:rgba(255,255,255,0.85); letter-spacing:0.05em; opacity:0; transition:opacity 0.18s; white-space:nowrap; 
    max-width:240px; overflow:hidden; text-overflow:ellipsis; box-shadow:0 4px 24px rgba(0,0,0,0.5), 0 0 16px rgba(166,28,92,0.1);
}
#tip.show { opacity:1; }

#ring {
    position:fixed; pointer-events:none; z-index:60; width:28px; height:28px; border-radius:50%; border:1px solid rgba(255,255,255,0.2); 
    transform:translate(-50%,-50%); transition:width 0.3s, height 0.3s, border-color 0.3s, opacity 0.25s; opacity:0.65;
}
#ring-inner {
    position:fixed; pointer-events:none; z-index:60; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,0.9); 
    transform:translate(-50%,-50%); transition:width 0.15s, height 0.15s, opacity 0.15s, background-color 0.3s; opacity:0.9;
}
#ring.on { width:52px; height:52px; border-color:rgba(166,28,92,0.9); box-shadow:0 0 22px rgba(166,28,92,0.35); }
#ring-inner.on { width:3px; height:3px; }

#cat-label {
    position:fixed; left:50%; top:calc(var(--nav-w)/2 + 80px); transform:translateX(-50%); z-index:55; pointer-events:none; 
    font-family:'Cinzel',serif; font-size:0.75rem; letter-spacing:0.28em; text-transform:uppercase; color:rgba(255,255,255,0.75);
    text-shadow:0 0 28px var(--mg-glow); opacity:0; transition:opacity 0.5s; background:rgba(0,0,0,0.5); padding:6px 18px; 
    border-radius:100px; border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(12px);
}

#splash {
    position:fixed; inset:0; z-index:300; background:var(--void); display:flex; align-items:center; justify-content:center; 
    flex-direction:column; gap:12px; animation:splashOut 1.1s ease 2.5s forwards; pointer-events:none;
}
@keyframes splashOut { to { opacity:0; } }
.splash-orb {
    width:80px; height:80px; border-radius:50%; margin-bottom:18px; background:radial-gradient(circle at 38% 36%, #fff 0%, var(--mg) 55%, var(--mg2) 90%, transparent 100%);
    box-shadow:0 0 80px var(--mg-glow), 0 0 160px var(--mg-glow2); animation:splashOrbIn 2.2s ease-in-out forwards;
}
@keyframes splashOrbIn { 0% { transform:scale(0.5); opacity:0; box-shadow:none; } 40% { opacity:1; transform:scale(1.08); } 70% { transform:scale(0.96); } 100% { transform:scale(1); opacity:0; } }
.splash-title {
    font-family:'Cinzel',serif; font-size:clamp(2rem,5vw,4rem); font-weight:700; letter-spacing:0.3em; text-transform:uppercase; color:transparent; 
    background:linear-gradient(180deg,#fff 0%,var(--mg) 60%,var(--mg2) 100%); -webkit-background-clip:text; background-clip:text; animation:splashPulse 2.2s ease-in-out forwards;
}
.splash-sub { font-size:0.75rem; letter-spacing:0.5em; text-transform:uppercase; color:rgba(255,255,255,0.32); font-weight:300; animation:splashPulse 2.2s ease-in-out 0.18s forwards; }
@keyframes splashPulse { 0% { opacity:0; transform:translateY(18px); } 30% { opacity:1; transform:translateY(0); } 80% { opacity:1; } 100% { opacity:0; } }
</style>
</head>
<body>
<div id="splash"><div class="splash-orb"></div><p class="splash-title">Andrômeda</p><p class="splash-sub">Catálogo Cósmico</p></div>
<canvas id="grain"></canvas>
<div id="canvas-dim"></div>
<div id="webgl"></div>
<div id="tip"></div>
<div id="ring"></div>
<div id="ring-inner"></div>
<div id="cat-label"></div>

<nav id="nav">
    <div class="nav-logo"><div class="nav-logo-orb"><i class="fa-solid fa-atom"></i></div><span class="nav-logo-text">Andrômeda</span></div>
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
    <div class="hud-search"><i class="fa-solid fa-magnifying-glass"></i><input id="q" type="text" placeholder="Explorar o cosmos…"></div>
    <div id="pills"><button class="pill on" data-c="all"><span>Todos</span></button></div>
    <div class="view-tog">
        <button id="btn-gal" class="on" title="Galáxia"><i class="fa-solid fa-circle-nodes"></i></button>
        <button id="btn-lst" title="Lista Editorial"><i class="fa-solid fa-grip"></i></button>
    </div>
</div>

<div id="hud-bot">
    <span><i class="fa-solid fa-book"></i> <strong><?= $totalLivros ?></strong>&nbsp;obras</span>
    <span><i class="fa-solid fa-layer-group"></i> <strong><?= $totalCats ?></strong>&nbsp;categorias</span>
    <span id="scroll-hint"><i class="fa-solid fa-scroll"></i> Rolar para aproximar</span>
</div>

<div id="depth">
    <span class="depth-lbl">Orbital</span>
    <div class="depth-track"><div class="depth-dot" id="ddot"></div></div>
    <span class="depth-lbl">Galáxia</span>
</div>

<div id="book-panel">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <span class="bp-cat" id="bp-cat">—</span><span class="sbadge s-unk" id="bp-status">—</span>
    </div>
    <h2 class="bp-title" id="bp-title">—</h2><p class="bp-author" id="bp-author">—</p>
    <div class="bp-meta">
        <div class="bp-field"><label>Ano</label><span class="val" id="bp-year">—</span></div>
        <div class="bp-field"><label>Editora</label><span class="val" id="bp-pub">—</span></div>
    </div>
    <div class="bp-actions"><button class="btn-prim" id="bp-reserve">Reservar</button><button class="btn-sec" id="bp-expand"><i class="fa-solid fa-expand"></i></button></div>
</div>

<div id="modal">
    <div class="modal-card">
        <button class="modal-x" id="modal-x"><i class="fa-solid fa-xmark"></i></button>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:24px;position:relative;z-index:1">
            <span class="bp-cat" id="m-cat">—</span><span class="sbadge s-unk" id="m-status">—</span>
        </div>
        <h2 class="modal-title" id="m-title">—</h2><p class="modal-author" id="m-author">—</p>
        <div class="modal-grid">
            <div class="modal-field"><label>Ano de Pub.</label><span class="v" id="m-year">—</span></div>
            <div class="modal-field"><label>Editora</label><span class="v" id="m-pub">—</span></div>
            <div class="modal-field"><label>Categoria</label><span class="v" id="m-catv">—</span></div>
            <div class="modal-field"><label>Status</label><span class="v" id="m-sv">—</span></div>
        </div>
        <button class="modal-btn" id="m-res">Reservar esta obra</button>
    </div>
</div>

<div id="list-view"><div class="bento-grid" id="grid"></div></div>

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
// 0. DADOS PHP → JS
// ═══════════════════════════════════════════════════════════
const LIVROS = <?php echo !empty($livrosJson) ? $livrosJson : '[]'; ?>;

(function(){
    const c = document.getElementById('grain'); c.width = c.height = 256; const x = c.getContext('2d');
    setInterval(() => {
        const d = x.createImageData(256,256);
        for (let i=0;i<d.data.length;i+=4){ const v=Math.random()*255; d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255; }
        x.putImageData(d,0,0);
    }, 80);
})();

AOS.init({ duration:650, easing:'ease-out-cubic', once:true });

// ═══════════════════════════════════════════════════════════
// 2. THREE.JS — RENDERER & CAMERA & COMPOSER
// ═══════════════════════════════════════════════════════════
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.1, 3000);
camera.position.set(0, 22, 130);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.getElementById('webgl').appendChild(renderer.domElement);

const cam        = { tx:0, ty:18, tz:96 };
const camLook    = { x:0, y:0, z:0 };        
const camLookDst = { x:0, y:0, z:0 };        

const rPass = new THREE.RenderPass(scene, camera);
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.4, 0.6, 0.80);

const ChromaShader = {
    uniforms: { tDiffuse:{value:null}, uS:{value:0.006} },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uS; varying vec2 vUv; void main(){ vec2 c=vUv-0.5; float d=length(c); vec2 o=c*d*uS; gl_FragColor=vec4(texture2D(tDiffuse,vUv-o*1.3).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv+o*1.1).b, 1.0); }`
};
const chroma = new THREE.ShaderPass(ChromaShader);

const LensShader = {
    uniforms: { tDiffuse: { value: null }, uBHPos: { value: new THREE.Vector2(0.5, 0.5) }, uBHR: { value: 0.045 }, uStr: { value: 0.022 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uBHPos; uniform float uBHR, uStr; varying vec2 vUv; void main(){ vec2 delta = vUv - uBHPos; float dist = length(delta); float r = dist / max(uBHR, 0.001); float falloff = 1.0 - smoothstep(0.0, uBHR * 5.0, dist); float strength = uStr / (r * r * 0.5 + 0.18) * falloff; strength = clamp(strength, 0.0, 0.12); vec2 offset  = normalize(delta + vec2(0.0001)) * strength; vec4 col = texture2D(tDiffuse, vUv - offset); float eh = smoothstep(uBHR * 0.55, 0.0, dist); col.rgb *= (1.0 - eh * 0.98); float ring = smoothstep(uBHR * 0.85, uBHR * 1.0, dist) * smoothstep(uBHR * 1.55, uBHR * 1.1, dist); col.rgb += vec3(1.0, 0.65, 0.25) * ring * 0.6; gl_FragColor = col; }`
};
const lensPass = new THREE.ShaderPass(LensShader);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(rPass); composer.addPass(bloom); composer.addPass(lensPass); composer.addPass(chroma);

// ═══════════════════════════════════════════════════════════
// 3. CAMPO ESTELAR TRIDIMENSIONAL
// ═══════════════════════════════════════════════════════════
let bgMat;
(function(){
    function makeStarLayer(N, spread, minSz, maxSz, colorA, colorB){
        const geom = new THREE.BufferGeometry();
        const pos  = new Float32Array(N*3); const rnd  = new Float32Array(N); const col  = new Float32Array(N*3);
        for(let i=0;i<N;i++){
            pos[i*3]  =(Math.random()-0.5)*spread; pos[i*3+1]=(Math.random()-0.5)*spread; pos[i*3+2]=(Math.random()-0.5)*spread;
            rnd[i] = Math.random(); const t = Math.random();
            col[i*3]   = colorA[0]*(1-t)+colorB[0]*t; col[i*3+1] = colorA[1]*(1-t)+colorB[1]*t; col[i*3+2] = colorA[2]*(1-t)+colorB[2]*t;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos,3)); geom.setAttribute('aR', new THREE.BufferAttribute(rnd,1)); geom.setAttribute('color', new THREE.BufferAttribute(col,3));
        return geom;
    }
    const starVS = `attribute float aR; uniform float uT,uMin,uMax; varying float vR; varying vec3 vC; void main(){ vR=aR; vC=color; float tw = 0.4+0.6*sin(uT*1.2+aR*77.0); vec4 vp = viewMatrix*modelMatrix*vec4(position,1.0); gl_Position = projectionMatrix*vp; gl_PointSize = (8.0/-vp.z)*(uMin+aR*(uMax-uMin))*tw; }`;
    const starFS = `varying float vR; varying vec3 vC; void main(){ float s = pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.8); gl_FragColor = vec4(vC*s, s*0.85); }`;

    const g1 = makeStarLayer(6000,1800,0.3,1.0,[0.72,0.88,1.0],[1.0,1.0,1.0]); const m1 = new THREE.ShaderMaterial({ transparent:true,depthWrite:false,blending:THREE.AdditiveBlending, vertexColors:true,uniforms:{uT:{value:0},uMin:{value:0.3},uMax:{value:1.0}}, vertexShader:starVS,fragmentShader:starFS }); scene.add(new THREE.Points(g1,m1));
    const g2 = makeStarLayer(3500,1400,0.25,0.7,[1.0,0.92,0.75],[1.0,0.78,0.55]); const m2 = new THREE.ShaderMaterial({ transparent:true,depthWrite:false,blending:THREE.AdditiveBlending, vertexColors:true,uniforms:{uT:{value:0},uMin:{value:0.2},uMax:{value:0.7}}, vertexShader:starVS,fragmentShader:starFS }); scene.add(new THREE.Points(g2,m2));
    const g3 = makeStarLayer(1800,900,0.4,1.2,[1.0,0.55,0.42],[0.9,0.38,0.55]); bgMat = new THREE.ShaderMaterial({ transparent:true,depthWrite:false,blending:THREE.AdditiveBlending, vertexColors:true,uniforms:{uT:{value:0},uMin:{value:0.35},uMax:{value:1.1}}, vertexShader:starVS,fragmentShader:starFS }); scene.add(new THREE.Points(g3,bgMat));
})();

// ═══════════════════════════════════════════════════════════
// 4. GALÁXIA ESPIRAL E FAIXAS DE POEIRA
// ═══════════════════════════════════════════════════════════
let galMat, galDustMat;
(function(){
    const ARMS = 4; const N = 90000;
    const geom = new THREE.BufferGeometry(); const pos = new Float32Array(N*3); const col = new Float32Array(N*3); const aR = new Float32Array(N);
    for(let i=0;i<N;i++){
        const i3 = i*3; const rng = Math.random(); const r = Math.pow(rng, 1.6) * 72 + (rng < 0.12 ? 0 : 2);
        const armIdx = Math.floor(Math.random()*ARMS); const armAng = (armIdx/ARMS)*Math.PI*2;
        const spiral = r * 0.52 + armAng; const spread = Math.pow(Math.random(), 1.8) * Math.max(0,(72-r)*0.20);
        pos[i3]   = Math.cos(spiral)*r + (Math.random()-0.5)*spread; pos[i3+1] = (Math.random()-0.5) * (r < 10 ? 3.5 : r < 25 ? 1.2 : 0.55); pos[i3+2] = Math.sin(spiral)*r + (Math.random()-0.5)*spread;
        if(r < 8) { col[i3] = 1.0; col[i3+1] = 0.92; col[i3+2] = 0.72; } else if(r < 25) { const t = (r-8)/17; col[i3] = 1.0-t*0.5; col[i3+1] = 0.88-t*0.2; col[i3+2] = 0.65+t*0.35; } else { const t = (r-25)/47; col[i3] = 0.5-t*0.28; col[i3+1] = 0.68-t*0.42; col[i3+2] = 1.0-t*0.3; }
        aR[i3] = Math.random();
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos,3)); geom.setAttribute('color', new THREE.BufferAttribute(col,3)); geom.setAttribute('aR', new THREE.BufferAttribute(aR,1));
    galMat = new THREE.ShaderMaterial({ depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true, transparent:true, uniforms:{ uT:{value:0} }, vertexShader:`attribute float aR; uniform float uT; varying vec3 vC; void main(){ vC = color; float dist = length(position.xz); float omega = 0.075 / (dist * 0.055 + 0.6); float ang = atan(position.z, position.x) + uT * omega; vec3 p = vec3(cos(ang)*dist, position.y, sin(ang)*dist); vec4 vp = viewMatrix*modelMatrix*vec4(p,1.0); gl_Position = projectionMatrix*vp; float tw = 0.65 + 0.35*sin(uT*0.9+aR*55.0); gl_PointSize = (22.0/-vp.z)*(0.18+aR*0.52)*tw; }`, fragmentShader:`varying vec3 vC; void main(){ float s = pow(1.0-distance(gl_PointCoord,vec2(0.5)),3.2); gl_FragColor = vec4(vC*s, s*0.7); }` });
    const gal = new THREE.Points(geom, galMat); gal.rotation.x = 1.12; gal.rotation.z = 0.1; scene.add(gal);

    const ND = 15000; const dg = new THREE.BufferGeometry(); const dp = new Float32Array(ND*3); const dc = new Float32Array(ND*3);
    for(let i=0;i<ND;i++){
        const i3 = i*3; const r = 10 + Math.random() * 55; const armIdx = Math.floor(Math.random()*ARMS); const angOffset = (armIdx + 0.5)/ARMS * Math.PI*2; const spiral = r * 0.52 + angOffset + Math.PI*0.15; const spread = Math.random() * (r * 0.18);
        dp[i3] = Math.cos(spiral)*r + (Math.random()-0.5)*spread; dp[i3+1]= (Math.random()-0.5) * 0.35; dp[i3+2]= Math.sin(spiral)*r + (Math.random()-0.5)*spread;
        const b = Math.random()*0.06; dc[i3]=0.12+b; dc[i3+1]=0.06+b*0.5; dc[i3+2]=0.06;
    }
    dg.setAttribute('position', new THREE.BufferAttribute(dp,3)); dg.setAttribute('color', new THREE.BufferAttribute(dc,3));
    galDustMat = new THREE.ShaderMaterial({ depthWrite:false, blending:THREE.NormalBlending, vertexColors:true, transparent:true, uniforms:{ uT:{value:0} }, vertexShader:`uniform float uT; varying vec3 vC; void main(){ vC = color; float dist = length(position.xz); float omega = 0.06 / (dist*0.05+0.6); float ang = atan(position.z, position.x) + uT*omega; vec3 p = vec3(cos(ang)*dist, position.y, sin(ang)*dist); vec4 vp = viewMatrix*modelMatrix*vec4(p,1.0); gl_Position = projectionMatrix*vp; gl_PointSize = (30.0/-vp.z)*(0.6+0.4*fract(sin(dist*17.3)*43758.5)); }`, fragmentShader:`varying vec3 vC; void main(){ float s = 1.0-smoothstep(0.3,0.5,distance(gl_PointCoord,vec2(0.5))); gl_FragColor = vec4(vC, s*0.55); }` });
    const dust = new THREE.Points(dg, galDustMat); dust.rotation.x = 1.12; dust.rotation.z = 0.1; scene.add(dust);
})();

// ═══════════════════════════════════════════════════════════
// 5. BURACO NEGRO
// ═══════════════════════════════════════════════════════════
let diskMat;
(function(){
    const bhGeom = new THREE.SphereGeometry(2.1, 32, 32); const bhMat  = new THREE.MeshBasicMaterial({ color:0x000000 });
    const bh = new THREE.Mesh(bhGeom, bhMat); scene.add(bh);

    for(let i=0;i<3;i++){
        const rg = new THREE.TorusGeometry(2.15+i*0.18, 0.08-i*0.015, 8, 120);
        const rm = new THREE.MeshBasicMaterial({ color: i===0 ? 0xffd580 : i===1 ? 0xff8833 : 0xffffff, transparent:true, opacity: 0.75-i*0.22 });
        const ring = new THREE.Mesh(rg, rm); ring.rotation.x = Math.PI/2; scene.add(ring);
    }

    const NA = 28000; const ag = new THREE.BufferGeometry(); const ap = new Float32Array(NA*3); const ac = new Float32Array(NA*3);
    const aAng = new Float32Array(NA); const aRad = new Float32Array(NA);
    for(let i=0;i<NA;i++){
        const i3 = i*3; const r = 2.55 + Math.pow(Math.random(), 0.6) * 10.5; const a = Math.random() * Math.PI*2;
        aAng[i] = a; aRad[i] = r;
        ap[i3]   = Math.cos(a)*r; ap[i3+1] = (Math.random()-0.5)*0.12*(1/(r*0.12+0.8)); ap[i3+2] = Math.sin(a)*r;
        const t = (r-2.55)/10.5; const tt = Math.pow(t, 0.7); ac[i3] = 1.0; ac[i3+1] = 1.0 - tt*0.62; ac[i3+2] = 0.95 - tt*0.88;
    }
    ag.setAttribute('position', new THREE.BufferAttribute(ap,3)); ag.setAttribute('color', new THREE.BufferAttribute(ac,3)); ag.setAttribute('aAng', new THREE.BufferAttribute(aAng,1)); ag.setAttribute('aRad', new THREE.BufferAttribute(aRad,1));
    diskMat = new THREE.ShaderMaterial({ depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true, transparent:true, uniforms:{ uT:{value:0} }, vertexShader:`attribute float aAng, aRad; uniform float uT; varying vec3 vC; varying float vBright; void main(){ vC = color; float omega = 0.65 / sqrt(aRad*aRad*aRad*0.01+aRad); float ang = aAng + uT * omega; vec3 p = vec3(cos(ang)*aRad, position.y, sin(ang)*aRad); vec4 vp = viewMatrix*modelMatrix*vec4(p,1.0); gl_Position = projectionMatrix*vp; float szFac = 1.0 - (aRad-2.55)/10.5; gl_PointSize = (14.0/-vp.z)*(0.2+szFac*0.55); vBright = szFac; }`, fragmentShader:`varying vec3 vC; varying float vBright; void main(){ float s = pow(1.0-distance(gl_PointCoord,vec2(0.5)),2.5); gl_FragColor = vec4(vC*s, s*(0.55+vBright*0.45)); }` });
    scene.add(new THREE.Points(ag, diskMat));

    const NJ = 3000; const jg = new THREE.BufferGeometry(); const jp = new Float32Array(NJ*3); const jc = new Float32Array(NJ*3);
    for(let i=0;i<NJ;i++){
        const i3 = i*3; const h = (Math.random()-0.5) * 28; const r = Math.abs(h)*0.04*(Math.random()*0.8+0.2); const a = Math.random()*Math.PI*2;
        jp[i3] = Math.cos(a)*r; jp[i3+1] = h; jp[i3+2] = Math.sin(a)*r; const t = Math.abs(h)/14; jc[i3] = 0.4+t*0.1; jc[i3+1] = 0.5+t*0.2; jc[i3+2] = 1.0;
    }
    jg.setAttribute('position', new THREE.BufferAttribute(jp,3)); jg.setAttribute('color', new THREE.BufferAttribute(jc,3));
    const jetMat = new THREE.PointsMaterial({ vertexColors:true, size:0.15, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:0.45 }); scene.add(new THREE.Points(jg, jetMat));
})();

// ═══════════════════════════════════════════════════════════
// 6. HELPERS DE GLOW
// ═══════════════════════════════════════════════════════════
const _glowCache = new Map();
function hexToRgb(h){ return { r:(h>>16)&255, g:(h>>8)&255, b:h&255 }; }
function mkGlow(hex, sz) {
    if(!_glowCache.has(hex)){
        const {r,g,b}=hexToRgb(hex); const cv=document.createElement('canvas'); cv.width=cv.height=128; const cx=cv.getContext('2d');
        const gr=cx.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,`rgba(${r},${g},${b},1)`); gr.addColorStop(0.3,`rgba(${r},${g},${b},0.42)`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
        cx.fillStyle=gr; cx.fillRect(0,0,128,128); _glowCache.set(hex, new THREE.CanvasTexture(cv));
    }
    const mat=new THREE.SpriteMaterial({ map:_glowCache.get(hex), blending:THREE.AdditiveBlending, transparent:true, depthWrite:false });
    const sp=new THREE.Sprite(mat); sp.scale.set(sz,sz,1); return sp;
}

// ═══════════════════════════════════════════════════════════
// 7. PALETA DE CATEGORIAS
// ═══════════════════════════════════════════════════════════
const PALETTE = [0x4488ff, 0xff3377, 0x33ffcc, 0xffaa11, 0xaa33ff, 0x33ff88, 0xff6633, 0x11ccff, 0xff33aa, 0x88ff44, 0xffcc33, 0x3355ff];
function catColor(name){
    if(!name) return PALETTE[0]; let h=0; for(const c of name){ h=((h<<5)-h)+c.charCodeAt(0); h|=0; } return PALETTE[Math.abs(h)%PALETTE.length];
}

// ═══════════════════════════════════════════════════════════
// 8. SISTEMAS ESTELARES (CATEGORIAS)
// ═══════════════════════════════════════════════════════════
const catMap    = new Map();
const uniqCats  = [...new Set(LIVROS.map(l=>l.categoria_nome).filter(Boolean))];

uniqCats.forEach((name, idx) => {
    const t    = (idx+0.5)/uniqCats.length; const br   = idx%4; const ang  = (br/4)*Math.PI*2 + t*Math.PI*6.2; const rad  = 14 + t*46;
    const x = Math.cos(ang)*rad + (Math.random()-0.5)*3; const y = (Math.random()-0.5)*5; const z = Math.sin(ang)*rad + (Math.random()-0.5)*3; const col   = catColor(name);
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.6,16,16), new THREE.MeshBasicMaterial({ color:col })); star.position.set(x,y,z); scene.add(star);
    const glow  = mkGlow(col, 12); const glow2 = mkGlow(col, 28); const neb   = mkGlow(col, 55);
    glow.position.set(x,y,z);  glow.material.opacity=0.82; glow2.position.set(x,y,z); glow2.material.opacity=0.22; neb.position.set(x,y,z);   neb.material.opacity=0.07;
    scene.add(glow); scene.add(glow2); scene.add(neb);
    catMap.set(name, { name, col, star, glow, glow2, neb, pos: new THREE.Vector3(x,y,z), books: [] });
});

// ═══════════════════════════════════════════════════════════
// 9. PLANETAS (LIVROS) EM INSTANCED MESH
// ═══════════════════════════════════════════════════════════
const bookObjs = []; let HOVER = null, selBook = null;
const planetGeo = new THREE.SphereGeometry(1, 16, 16); const planetMat = new THREE.MeshBasicMaterial();
const planetasInstanciados = new THREE.InstancedMesh(planetGeo, planetMat, LIVROS.length);
planetasInstanciados.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(planetasInstanciados);
const dummy = new THREE.Object3D(); const tmpColor = new THREE.Color();

LIVROS.forEach((livro, idx) => {
    const cd = catMap.get(livro.categoria_nome); if(!cd) return;
    const oIdx  = cd.books.length; const oRad  = 3.4 + (oIdx%8)*0.88 + Math.random()*0.5; const oSpd  = (0.12+Math.random()*0.28)*(Math.random()>0.5?1:-1); const oAng  = (idx*2.399960438)%(Math.PI*2);
    const tiltX = (Math.random()-0.5)*Math.PI*0.5; const tiltZ = (Math.random()-0.5)*Math.PI*0.25; const sz    = 0.13+Math.random()*0.12;

    const st = (livro.status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); let pcol;
    if(st.includes('disp')) pcol=0x22dd88; else if(st.includes('empr')) pcol=0xff4444; else if(st.includes('res')) pcol=0xffaa22; else pcol=0x8899ff;

    tmpColor.setHex(pcol); planetasInstanciados.setColorAt(idx, tmpColor);
    const glow = mkGlow(pcol, sz*22); glow.material.opacity = 0.7; scene.add(glow);

    const ORBIT_PTS = 128; const orbitPts  = [];
    for(let i=0;i<=ORBIT_PTS;i++){ const a = (i/ORBIT_PTS)*Math.PI*2; orbitPts.push( Math.cos(a)*oRad*Math.cos(tiltX), Math.sin(a)*oRad*Math.sin(tiltZ)*0.38, Math.sin(a)*oRad*Math.cos(tiltX) ); }
    const orbitGeom = new THREE.BufferGeometry(); orbitGeom.setAttribute('position', new THREE.Float32BufferAttribute(orbitPts, 3));
    const orbitMat  = new THREE.LineBasicMaterial({ color: pcol, transparent:true, opacity:0.14, depthWrite:false });
    const orbitLine = new THREE.LineLoop(orbitGeom, orbitMat); orbitLine.position.copy(cd.pos); scene.add(orbitLine);

    const obj = { data:livro, cd, glow, orbitLine, oRad, oSpd, oAng, tiltX, tiltZ, sz, pcol, idx, filtered:true, searched:true, currentScale: 1, hoverScale: 1.0, isHovered: false };
    cd.books.push(obj); bookObjs.push(obj);
});

// ═══════════════════════════════════════════════════════════
// 10. CONTROLES DE CÂMERA & RAYCASTING
// ═══════════════════════════════════════════════════════════
let mX=0, mY=0, isListView=false, is3DActive=true;
let activeFilter='all', queryStr='';
const ray  = new THREE.Raycaster(); const mVec = new THREE.Vector2(); ray.params.Points = { threshold: 0.3 };

window.addEventListener('wheel', e => {
    if(isListView) return;
    cam.tz = Math.max(4, Math.min(115, cam.tz + e.deltaY*0.036));
    const frac = 1-(cam.tz-4)/(115-4); document.getElementById('ddot').style.top = (frac*92)+'%';
}, { passive:true });

document.addEventListener('mousemove', e => {
    mX=(e.clientX/innerWidth-0.5)*2; mY=(e.clientY/innerHeight-0.5)*2;
    if(!isListView && activeFilter==='all'){ cam.tx=mX*14; cam.ty=18-mY*8; }

    const ring  = document.getElementById('ring'); const inner = document.getElementById('ring-inner'); const tip   = document.getElementById('tip');
    ring.style.left = e.clientX+'px'; ring.style.top = e.clientY+'px'; inner.style.left = e.clientX+'px'; inner.style.top = e.clientY+'px';
    tip.style.left = (e.clientX+20)+'px'; tip.style.top = (e.clientY-10)+'px';
    handleRaycast(e);
});

function handleRaycast(e){
    if(isListView) return;
    mVec.x=(e.clientX/innerWidth)*2-1; mVec.y=-(e.clientY/innerHeight)*2+1; ray.setFromCamera(mVec, camera);
    const hits = ray.intersectObject(planetasInstanciados);
    const tip   = document.getElementById('tip'); const ring  = document.getElementById('ring'); const inner = document.getElementById('ring-inner');

    if(HOVER) HOVER.isHovered = false;

    if(hits.length>0){
        const instanceId = hits[0].instanceId; const bo = bookObjs.find(b => b.idx === instanceId);
        if(bo && bo.filtered && bo.searched){
            HOVER=bo; selBook=bo; bo.isHovered = true;
            showPanel(bo); tip.textContent=bo.data.titulo||''; tip.classList.add('show'); ring.classList.add('on'); inner.classList.add('on');
            inner.style.backgroundColor = '#' + bo.pcol.toString(16).padStart(6, '0');
        }
    } else {
        if(HOVER){ HOVER.isHovered = false; HOVER=null; hidePanel(); }
        tip.classList.remove('show'); ring.classList.remove('on'); inner.classList.remove('on'); inner.style.backgroundColor = '';
    }
}
renderer.domElement.addEventListener('click', ()=>{ if(HOVER) openModal(HOVER.data); });

// ═══════════════════════════════════════════════════════════
// 12. PAINEL DE LIVRO & MODAL
// ═══════════════════════════════════════════════════════════
function statusClass(s){
    const n=(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(n.includes('disp')) return 's-disp'; if(n.includes('empr')) return 's-empr'; if(n.includes('res'))  return 's-res'; return 's-unk';
}
function showPanel(bo){
    const d=bo.data;
    document.getElementById('bp-cat').textContent    = d.categoria_nome||'—';
    document.getElementById('bp-title').textContent  = d.titulo||'—';
    document.getElementById('bp-author').textContent = d.autor_nome||'Desconhecido';
    document.getElementById('bp-year').textContent   = d.ano_publicacao||'—';
    document.getElementById('bp-pub').textContent    = d.editora_nome||'—';
    const sel=document.getElementById('bp-status'); sel.className='sbadge '+statusClass(d.status); sel.textContent=d.status||'—';
    document.getElementById('book-panel').classList.add('open');
}
function hidePanel(){ document.getElementById('book-panel').classList.remove('open'); }

document.getElementById('bp-reserve').addEventListener('click',()=>{ if(selBook) openModal(selBook.data); });
document.getElementById('bp-expand').addEventListener('click', ()=>{ if(selBook) openModal(selBook.data); });

function openModal(d){
    document.getElementById('m-title').textContent  = d.titulo||'—'; document.getElementById('m-author').textContent = d.autor_nome||'—';
    document.getElementById('m-year').textContent   = d.ano_publicacao||'—'; document.getElementById('m-pub').textContent    = d.editora_nome||'—';
    document.getElementById('m-cat').textContent    = d.categoria_nome||'—'; document.getElementById('m-catv').textContent   = d.categoria_nome||'—';
    document.getElementById('m-sv').textContent     = d.status||'—';
    const ms=document.getElementById('m-status'); ms.className='sbadge '+statusClass(d.status); ms.textContent=d.status||'—';
    document.getElementById('modal').classList.add('open');
}
document.getElementById('modal-x').addEventListener('click', ()=>document.getElementById('modal').classList.remove('open'));
document.getElementById('modal').addEventListener('click', e=>{ if(e.target===document.getElementById('modal')) document.getElementById('modal').classList.remove('open'); });
document.getElementById('m-res').addEventListener('click', ()=>{ alert('Reserva registrada!'); });

// ═══════════════════════════════════════════════════════════
// 14. TOGGLE DE VISTA & BUILD LIST BENTO GRID (ETAPA 3)
// ═══════════════════════════════════════════════════════════
document.getElementById('btn-gal').addEventListener('click',()=>setView('gal'));
document.getElementById('btn-lst').addEventListener('click',()=>setView('lst'));

function setView(v){
    isListView=(v==='lst'); is3DActive=!isListView;
    document.getElementById('btn-gal').classList.toggle('on',!isListView);
    document.getElementById('btn-lst').classList.toggle('on',isListView);
    document.getElementById('list-view').classList.toggle('open',isListView);
    document.getElementById('canvas-dim').classList.toggle('dimmed',isListView);
    document.getElementById('depth').style.opacity=isListView?'0':'1';
    document.getElementById('hud-bot').style.opacity=isListView?'0.4':'1';
    if(isListView){
        buildList(); hidePanel(); gsap.to(bloom,{strength:0.28,duration:0.8});
    } else {
        gsap.to(bloom,{strength:1.4,duration:0.8}); AOS.refresh();
    }
}

function buildList(){
    const grid=document.getElementById('grid');
    
    const filtered=LIVROS.filter(l=>{
        const catOk = activeFilter==='all' || l.categoria_nome===activeFilter;
        const qOk = !queryStr || (l.titulo||'').toLowerCase().includes(queryStr) || (l.autor_nome||'').toLowerCase().includes(queryStr) || (l.categoria_nome||'').toLowerCase().includes(queryStr);
        return catOk && qOk;
    });

    grid.innerHTML = filtered.map((livro, i) => {
        const cidx = LIVROS.indexOf(livro);
        const rgb  = hexToRgb(catColor(livro.categoria_nome));
        const cHex = '#' + catColor(livro.categoria_nome).toString(16).padStart(6,'0');
        const rgbaGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
        const sc   = statusClass(livro.status); 
        const del  = Math.min(i*50, 600);
        
        // Bento Grid Logic
        let bentoClass = '';
        if (i === 0) bentoClass = 'bento-large';
        else if (i === 3 || i === 7) bentoClass = 'bento-tall';
        else if (i === 5 || i === 10) bentoClass = 'bento-wide';

        return `
            <div class="book-card ${bentoClass}" style="--c:${cHex}; --c-glow:${rgbaGlow}" data-aos="fade-up" data-aos-delay="${del}" onclick="openModal(LIVROS[${cidx}])">
                <div class="book-card-top">
                    <span class="cat-tag">${livro.categoria_nome||'—'}</span>
                    <span class="sbadge ${sc}">${livro.status||'—'}</span>
                </div>
                <div class="bc-content">
                    <h3 class="bc-title">${livro.titulo||'—'}</h3>
                    <p class="bc-author">${livro.autor_nome||'Desconhecido'}</p>
                </div>
                <div class="bc-meta">
                    <span><i class="fa-solid fa-calendar"></i>${livro.ano_publicacao||'—'}</span>
                    <span><i class="fa-solid fa-building"></i>${(livro.editora_nome||'—').substring(0,18)}</span>
                </div>
            </div>
        `;
    }).join('');
    setTimeout(()=>AOS.refresh(),10);
}

// ═══════════════════════════════════════════════════════════
// 16. PROGRESSIVE DISCLOSURE (ZOOM NO SISTEMA)
// ═══════════════════════════════════════════════════════════
const pillsEl=document.getElementById('pills');
uniqCats.forEach(name=>{
    const btn=document.createElement('button'); btn.className='pill'; btn.dataset.c=name;
    btn.innerHTML=`<span>${name}</span>`; pillsEl.appendChild(btn);
});

pillsEl.addEventListener('click', e => {
    const btn = e.target.closest('.pill'); if(!btn) return;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('on')); btn.classList.add('on');
    activeFilter = btn.dataset.c;

    bookObjs.forEach(b => {
        b.filtered = (activeFilter === 'all' || b.data.categoria_nome === activeFilter);
        if (activeFilter !== 'all') { b.currentScale = 0; b.glow.material.opacity = 0; b.orbitLine.material.opacity = 0; b.glow.visible = false; b.orbitLine.visible = false; }
    });

    if(activeFilter !== 'all'){
        const cd = catMap.get(activeFilter);
        if(cd){
            const sysPos = cd.pos; const dir = sysPos.clone().normalize(); if(dir.length() < 0.01) dir.set(0,0,1);
            const distance = 35; const camTarget = sysPos.clone().add(dir.clone().multiplyScalar(distance)); camTarget.y += 18; camTarget.x += 8;

            const lbl = document.getElementById('cat-label'); lbl.textContent = activeFilter;
            gsap.to(lbl, {opacity: 1, duration: 0.4}); setTimeout(() => gsap.to(lbl, {opacity: 0, duration: 1.2}), 2800);

            gsap.to(cd.star.scale, {x: 2.8, y: 2.8, z: 2.8, duration: 0.8, ease: 'elastic.out(1, 0.4)'}); gsap.to(cd.glow.material, {opacity: 1.0, duration: 0.6});

            gsap.to(camLookDst, { x: sysPos.x, y: sysPos.y, z: sysPos.z, duration: 3.2, ease: 'expo.inOut' });
            gsap.to(camera, { fov: 35, duration: 3.2, ease: 'expo.inOut', onUpdate: () => camera.updateProjectionMatrix() });
            
            gsap.to(cam, {
                tx: camTarget.x, ty: camTarget.y, tz: camTarget.z, duration: 3.2, ease: 'expo.inOut',
                onComplete: () => {
                    let delayCount = 0;
                    bookObjs.forEach(b => {
                        if (b.filtered && b.searched !== false) {
                            b.glow.visible = true; b.orbitLine.visible = true; const staggerDelay = delayCount * 0.05; 
                            gsap.to(b, { currentScale: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)', delay: staggerDelay });
                            gsap.to(b.glow.material, { opacity: 0.7, duration: 0.8, delay: staggerDelay });
                            gsap.to(b.orbitLine.material, { opacity: 0.22, duration: 1.5, ease: 'power2.out', delay: staggerDelay });
                            delayCount++;
                        }
                    });
                }
            });
        }
    } else {
        gsap.to(cam, { tx: 0, ty: 18, tz: 96, duration: 3.6, ease: 'expo.inOut' }); gsap.to(camLookDst, { x: 0, y: 0, z: 0, duration: 3.6, ease: 'expo.inOut' });
        gsap.to(camera, { fov: 48, duration: 3.6, ease: 'expo.inOut', onUpdate: () => camera.updateProjectionMatrix() });
        
        catMap.forEach(cd => { gsap.to(cd.star.scale, {x: 1, y: 1, z: 1, duration: 0.8, ease: 'power2.out'}); });
        bookObjs.forEach(b => {
            if (b.searched !== false) {
                b.glow.visible = true; b.orbitLine.visible = true;
                gsap.to(b, { currentScale: 1, duration: 0.8, ease: 'back.out(1.5)' });
                gsap.to(b.glow.material, { opacity: 0.7, duration: 0.8 }); gsap.to(b.orbitLine.material, { opacity: 0.14, duration: 0.8 });
            }
        });
    }
    if(isListView) buildList();
});

// ═══════════════════════════════════════════════════════════
// 17. BUSCA
// ═══════════════════════════════════════════════════════════
document.getElementById('q').addEventListener('input',e=>{
    queryStr=e.target.value.toLowerCase().trim();
    bookObjs.forEach(b=>{
        const ok=!queryStr||(b.data.titulo||'').toLowerCase().includes(queryStr)||(b.data.autor_nome||'').toLowerCase().includes(queryStr)||(b.data.categoria_nome||'').toLowerCase().includes(queryStr);
        b.searched=ok; const vis=ok&&b.filtered;
        
        if(!vis) { b.currentScale = 0; b.glow.visible = false; b.orbitLine.visible = false; } 
        else {
            b.glow.visible = true; b.orbitLine.visible = true;
            if(ok&&queryStr){
                gsap.to(b, {currentScale: 3, duration: 0.35, ease: 'back.out(2)', yoyo: true, repeat: 1, onComplete: () => { if(b.searched && b.filtered) gsap.to(b, {currentScale: 1, duration: 0.2}); }});
            } else if(ok) { b.currentScale = 1; }
        }
    });
    if(isListView) buildList();
});

// ═══════════════════════════════════════════════════════════
// 18. LOOP PRINCIPAL DE ANIMAÇÃO
// ═══════════════════════════════════════════════════════════
const clock = new THREE.Clock(); const bhNDC = new THREE.Vector3();

(function animate(){
    requestAnimationFrame(animate); if(!is3DActive){ composer.render(); return; }

    const t = clock.getElapsedTime();
    if(bgMat) bgMat.uniforms.uT.value = t; if(galMat) galMat.uniforms.uT.value = t; if(galDustMat) galDustMat.uniforms.uT.value = t; if(diskMat) diskMat.uniforms.uT.value = t;

    camera.position.x += (cam.tx - camera.position.x)*0.036; camera.position.y += (cam.ty - camera.position.y)*0.036; camera.position.z += (cam.tz - camera.position.z)*0.056;
    camLook.x += (camLookDst.x - camLook.x)*0.04; camLook.y += (camLookDst.y - camLook.y)*0.04; camLook.z += (camLookDst.z - camLook.z)*0.04;
    camera.lookAt(camLook.x, camLook.y, camLook.z); camera.updateProjectionMatrix();

    bhNDC.set(0,0,0).project(camera); lensPass.uniforms.uBHPos.value.set((bhNDC.x+1)/2, (bhNDC.y+1)/2);
    const bhDist = camera.position.length(); lensPass.uniforms.uBHR.value  = Math.min(0.1, 5.5/bhDist); lensPass.uniforms.uStr.value  = Math.min(0.05, 3.5/bhDist);

    bookObjs.forEach(b=>{
        b.oAng += b.oSpd * 0.006; const cp = b.cd.pos, r = b.oRad, a = b.oAng;
        const px = cp.x + Math.cos(a)*r*Math.cos(b.tiltX); const py = cp.y + Math.sin(a)*r*Math.sin(b.tiltZ)*0.38; const pz = cp.z + Math.sin(a)*r*Math.cos(b.tiltX);

        if(b.filtered && b.searched) {
            const targetHover = b.isHovered ? 3.5 : 1.0; b.hoverScale += (targetHover - b.hoverScale) * 0.13;
            const finalScale = b.sz * b.currentScale * b.hoverScale;
            dummy.position.set(px, py, pz); dummy.scale.set(finalScale, finalScale, finalScale);
            if (b.isHovered) { dummy.rotation.y += 0.06; dummy.rotation.x += 0.025; } else { dummy.rotation.set(0,0,0); }
            dummy.updateMatrix(); planetasInstanciados.setMatrixAt(b.idx, dummy.matrix);
        } else {
            dummy.position.set(px, py, pz); dummy.scale.set(0,0,0); dummy.updateMatrix(); planetasInstanciados.setMatrixAt(b.idx, dummy.matrix);
        }

        if (b.glow.visible) {
            b.glow.position.set(px, py, pz); const tg = b.isHovered ? 1.1 : (b.currentScale > 0 ? 0.68 : 0);
            b.glow.material.opacity += (tg - b.glow.material.opacity) * 0.13;
        }
    });
    planetasInstanciados.instanceMatrix.needsUpdate = true;

    catMap.forEach((cd)=>{
        const p = 0.7+0.3*Math.sin(t*1.3+cd.pos.x*0.1); cd.glow.material.opacity  = p*0.88; cd.glow2.material.opacity = p*0.20;
        cd.neb.material.opacity   = 0.065+0.03*Math.sin(t*0.6+cd.pos.z*0.08); cd.star.rotation.y = t*0.25;
        const s = 0.94+0.06*Math.sin(t*2.2+cd.pos.x*0.16); cd.star.scale.setScalar(s);
    });

    const zFrac=(cam.tz-4)/(115-4); bloom.strength=1.4+0.65*(1-zFrac); composer.render();
})();

// ═══════════════════════════════════════════════════════════
// 19. INTRO
// ═══════════════════════════════════════════════════════════
camera.position.set(0, 55, 210);
gsap.to(camera.position, { y:22, z:96, duration:3.8, ease:'power3.out', delay:2.5 });
gsap.from('#hud',      { opacity:0, y:-20, duration:1.5, ease:'power2.out', delay:3.3 });
gsap.from('#nav',      { opacity:0, x:-32, duration:1.5, ease:'power2.out', delay:3.1 });
gsap.from('#hud-bot',  { opacity:0, y:18,  duration:1.5, ease:'power2.out', delay:3.6 });
gsap.from('#depth',    { opacity:0, x:18,  duration:1.5, ease:'power2.out', delay:3.6 });
gsap.from('#scroll-hint', { opacity:0, duration:1.2, delay:4.8, onComplete:()=>{ gsap.to('#scroll-hint',{opacity:0,delay:3.5,duration:1.8}); }});
setTimeout(()=>document.getElementById('splash').style.display='none', 3700);

window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
});
</script>
</body>
</html>