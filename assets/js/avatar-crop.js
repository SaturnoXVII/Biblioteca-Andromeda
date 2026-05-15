/**
 * ═══════════════════════════════════════════════════════════════
 * ANDRÔMEDA · AVATAR CROP TOOL  v2
 * Máscara: quadrado arredondado (espelha border-radius: 16px do avatar)
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  "use strict";

  const OUTPUT_PX    = 480;
  const CANVAS_PX    = 320;
  const RADIUS_RATIO = 16 / 90;                         // mesma proporção do avatar
  const CANVAS_R     = Math.round(CANVAS_PX * RADIUS_RATIO); // ≈ 57px
  const OUTPUT_R     = Math.round(OUTPUT_PX * RADIUS_RATIO); // ≈ 85px
  const QUALITY      = 0.94;
  const ZOOM_STEP    = 0.08;
  const MAX_SCALE    = 5.0;

  let img = null, scale = 1, panX = 0, panY = 0;
  let isDrag = false, lastX = 0, lastY = 0, lastDist = 0, rafId = 0;
  let originalInput = null;
  let modal, canvas, ctx, sliderEl, zoomLabel;

  /* ── rounded-rect path helper ─────────────────────────────── */
  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x+r, y);
    c.lineTo(x+w-r, y);   c.quadraticCurveTo(x+w, y,   x+w, y+r);
    c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    c.lineTo(x+r, y+h);   c.quadraticCurveTo(x, y+h,   x, y+h-r);
    c.lineTo(x, y+r);     c.quadraticCurveTo(x, y,     x+r, y);
    c.closePath();
  }

  /* ════════════════════════════════════════════════════════════
     ESTILOS
  ════════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById("andro-crop-style")) return;
    const s = document.createElement("style");
    s.id = "andro-crop-style";
    s.textContent = `
      #andro-crop-backdrop {
        position:fixed;inset:0;z-index:14000;
        display:flex;align-items:center;justify-content:center;padding:18px;
        background:radial-gradient(circle at 50% 38%,rgba(42,162,246,.09),transparent 44%),rgba(1,2,5,.88);
        backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
        opacity:0;pointer-events:none;transition:opacity .3s ease;cursor:none;
      }
      #andro-crop-backdrop.open{opacity:1;pointer-events:auto;}

      #andro-crop-card {
        position:relative;width:min(460px,calc(100vw - 32px));overflow:hidden;
        border:1px solid rgba(224,240,255,.13);border-radius:24px;
        background:
          radial-gradient(circle at 0 0,rgba(42,162,246,.14),transparent 44%),
          radial-gradient(circle at 100% 100%,rgba(169,96,238,.10),transparent 42%),
          linear-gradient(145deg,rgba(224,240,255,.055),transparent 38%),rgba(3,7,14,.96);
        box-shadow:0 48px 180px rgba(0,0,0,.72),inset 0 1px 0 rgba(255,255,255,.055),0 0 0 1px rgba(42,162,246,.06);
        transform:translate3d(0,22px,0) scale(.97);
        transition:transform .38s cubic-bezier(.16,1,.3,1);cursor:none;
      }
      #andro-crop-backdrop.open #andro-crop-card{transform:translate3d(0,0,0) scale(1);}
      #andro-crop-card::before,#andro-crop-card::after{
        content:"";position:absolute;pointer-events:none;
        border-color:rgba(42,162,246,.32);border-style:solid;width:14px;height:14px;z-index:2;
      }
      #andro-crop-card::before{top:10px;left:10px;border-width:1px 0 0 1px;border-radius:3px 0 0 0;}
      #andro-crop-card::after{bottom:10px;right:10px;border-width:0 1px 1px 0;border-radius:0 0 3px 0;}

      #andro-crop-head{display:flex;align-items:center;gap:12px;padding:20px 22px 0;}
      #andro-crop-icon{
        width:38px;height:38px;display:grid;place-items:center;border-radius:13px;
        border:1px solid rgba(42,162,246,.28);
        background:radial-gradient(circle at 35% 25%,rgba(42,162,246,.22),rgba(169,96,238,.06) 60%,transparent);
        color:#7fd4ff;font-size:.9rem;box-shadow:0 0 20px rgba(42,162,246,.16);flex:0 0 auto;
      }
      #andro-crop-title-block{min-width:0;}
      #andro-crop-kicker{
        display:block;color:rgba(42,162,246,.88);font-family:"Space Mono",monospace;
        font-size:.52rem;letter-spacing:.2em;text-transform:uppercase;margin-bottom:3px;
      }
      #andro-crop-title{
        margin:0;color:#f7efe2;font-family:"Cormorant Garamond",serif;
        font-size:1.5rem;font-weight:500;line-height:.95;letter-spacing:-.02em;
      }
      #andro-crop-close{
        margin-left:auto;width:32px;height:32px;display:grid;place-items:center;
        border:1px solid rgba(224,240,255,.12);border-radius:50%;background:rgba(255,255,255,.03);
        color:rgba(224,240,255,.6);cursor:none;flex:0 0 auto;
        transition:transform .22s ease,border-color .22s ease,color .22s ease;
      }
      #andro-crop-close:hover{transform:rotate(90deg);border-color:rgba(255,107,138,.38);color:#ffd7e1;}

      /* ── Stage: QUADRADO ARREDONDADO idêntico ao avatar ── */
      #andro-crop-wrap{
        position:relative;margin:18px auto 0;
        width:${CANVAS_PX}px;height:${CANVAS_PX}px;
      }
      #andro-crop-stage{
        position:absolute;inset:0;
        border-radius:${CANVAS_R}px;
        overflow:hidden;
        box-shadow:
          0 0 0 2px rgba(42,162,246,.42),
          0 0 0 5px rgba(42,162,246,.09),
          0 28px 72px rgba(0,0,0,.58),
          0 0 64px rgba(42,162,246,.09);
        cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;
        transition:box-shadow .28s ease;
      }
      #andro-crop-stage:hover{
        box-shadow:0 0 0 2px rgba(42,162,246,.64),0 0 0 6px rgba(42,162,246,.13),
                   0 28px 72px rgba(0,0,0,.58),0 0 80px rgba(42,162,246,.14);
      }
      #andro-crop-stage.dragging{cursor:grabbing;}
      #andro-crop-canvas{display:block;width:100%;height:100%;border-radius:${CANVAS_R}px;}

      /* miniatura de referência ao vivo */
      #andro-crop-ref{
        position:absolute;bottom:-10px;right:-10px;
        width:46px;height:46px;
        border-radius:${Math.round(46*RADIUS_RATIO)}px;
        border:1.5px solid rgba(42,162,246,.42);
        background:rgba(2,5,12,.8);overflow:hidden;
        box-shadow:0 8px 24px rgba(0,0,0,.48);pointer-events:none;
      }
      #andro-crop-ref img{width:100%;height:100%;object-fit:cover;display:block;}

      #andro-crop-hint{
        text-align:center;margin:10px 0 0;color:rgba(224,240,255,.36);
        font-family:"Space Mono",monospace;font-size:.54rem;letter-spacing:.14em;text-transform:uppercase;
      }

      #andro-crop-zoom-row{
        display:grid;grid-template-columns:22px 1fr 22px;
        align-items:center;gap:10px;padding:14px 22px 0;
      }
      #andro-crop-zoom-row i{color:rgba(224,240,255,.42);font-size:.78rem;text-align:center;}
      #andro-crop-slider{
        -webkit-appearance:none;appearance:none;width:100%;height:3px;border-radius:999px;outline:none;cursor:none;
        background:linear-gradient(90deg,rgba(42,162,246,.78) var(--pct,0%),rgba(224,240,255,.12) var(--pct,0%));
      }
      #andro-crop-slider::-webkit-slider-thumb{
        -webkit-appearance:none;width:18px;height:18px;border-radius:50%;cursor:none;
        border:2px solid rgba(42,162,246,.72);
        background:radial-gradient(circle,#2aa2f6,#14599d);
        box-shadow:0 0 14px rgba(42,162,246,.48);
        transition:transform .18s ease,box-shadow .18s ease;
      }
      #andro-crop-slider::-webkit-slider-thumb:hover{transform:scale(1.22);box-shadow:0 0 22px rgba(42,162,246,.72);}
      #andro-crop-slider::-moz-range-thumb{
        width:16px;height:16px;border-radius:50%;cursor:none;
        border:2px solid rgba(42,162,246,.72);background:#2aa2f6;
      }
      #andro-crop-zoom-label{
        text-align:center;margin-top:5px;color:rgba(42,162,246,.78);
        font-family:"Space Mono",monospace;font-size:.54rem;letter-spacing:.16em;text-transform:uppercase;
      }

      #andro-crop-div{height:1px;margin:16px 22px 0;background:linear-gradient(90deg,transparent,rgba(224,240,255,.09),transparent);}

      #andro-crop-actions{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px 20px;}
      .andro-crop-btn{
        min-height:40px;padding:0 18px;border-radius:999px;
        border:1px solid rgba(224,240,255,.13);background:rgba(255,255,255,.03);
        color:rgba(224,240,255,.72);font-family:"Space Mono",monospace;font-size:.58rem;
        letter-spacing:.16em;text-transform:uppercase;cursor:none;
        display:inline-flex;align-items:center;gap:8px;
        transition:transform .22s ease,border-color .22s ease,color .22s ease,background .22s ease,box-shadow .22s ease;
      }
      .andro-crop-btn:hover{transform:translate3d(0,-1px,0);}
      .andro-crop-btn-cancel:hover{border-color:rgba(255,107,138,.26);color:#ffd7e1;}
      .andro-crop-btn-confirm{
        border-color:rgba(42,162,246,.36);
        background:linear-gradient(135deg,rgba(42,162,246,.96),rgba(88,109,210,.90) 54%,rgba(169,96,238,.92));
        color:#fff;box-shadow:0 12px 30px rgba(42,162,246,.22),inset 0 1px 0 rgba(255,255,255,.18);
      }
      .andro-crop-btn-confirm:hover{box-shadow:0 16px 40px rgba(42,162,246,.34),inset 0 1px 0 rgba(255,255,255,.22);}
      .andro-crop-btn-confirm.loading{opacity:.7;pointer-events:none;}
      .andro-crop-btn-confirm.loading i{animation:andro-spin .8s linear infinite;}
      @keyframes andro-spin{to{transform:rotate(360deg);}}

      @keyframes andro-avatar-pop{
        0%  {opacity:.7;transform:scale(.90);filter:brightness(1.6) blur(4px);}
        60% {opacity:1; transform:scale(1.06);filter:brightness(1.1) blur(0);}
        100%{opacity:1; transform:scale(1);   filter:none;}
      }
      .andro-avatar-pop{animation:andro-avatar-pop .65s cubic-bezier(.16,1,.3,1) forwards !important;}

      @media(max-width:520px){
        #andro-crop-wrap{width:260px !important;height:260px !important;}
        #andro-crop-stage,#andro-crop-canvas{border-radius:${Math.round(260*RADIUS_RATIO)}px !important;}
      }
    `;
    document.head.appendChild(s);
  }

  /* ════════════════════════════════════════════════════════════
     MODAL DOM
  ════════════════════════════════════════════════════════════ */
  function injectModal() {
    if (document.getElementById("andro-crop-backdrop")) return;
    const el = document.createElement("div");
    el.id = "andro-crop-backdrop";
    el.setAttribute("role","dialog");
    el.setAttribute("aria-modal","true");
    el.innerHTML = `
      <div id="andro-crop-card">
        <div id="andro-crop-head">
          <span id="andro-crop-icon" aria-hidden="true"><i class="fa-solid fa-camera-retro"></i></span>
          <div id="andro-crop-title-block">
            <span id="andro-crop-kicker">Foto de perfil</span>
            <h2 id="andro-crop-title">Ajustar imagem</h2>
          </div>
          <button id="andro-crop-close" type="button" aria-label="Fechar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div id="andro-crop-wrap">
          <div id="andro-crop-stage">
            <canvas id="andro-crop-canvas"></canvas>
          </div>
          <div id="andro-crop-ref" aria-hidden="true"></div>
        </div>

        <p id="andro-crop-hint">
          <i class="fa-solid fa-hand" style="margin-right:5px;opacity:.55"></i>
          Arraste · Role para zoom · Pinça para aproximar
        </p>

        <div id="andro-crop-zoom-row">
          <i class="fa-solid fa-magnifying-glass-minus"></i>
          <input id="andro-crop-slider" type="range" min="0" max="100" value="0" aria-label="Zoom">
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </div>
        <p id="andro-crop-zoom-label">Zoom · 1.00×</p>

        <div id="andro-crop-div"></div>
        <div id="andro-crop-actions">
          <button type="button" class="andro-crop-btn andro-crop-btn-cancel" id="andro-crop-cancel">
            <i class="fa-solid fa-xmark"></i> Cancelar
          </button>
          <button type="button" class="andro-crop-btn andro-crop-btn-confirm" id="andro-crop-confirm">
            <i class="fa-solid fa-check"></i> Usar esta foto
          </button>
        </div>
      </div>`;
    document.body.appendChild(el);

    modal     = el;
    canvas    = el.querySelector("#andro-crop-canvas");
    ctx       = canvas.getContext("2d");
    sliderEl  = el.querySelector("#andro-crop-slider");
    zoomLabel = el.querySelector("#andro-crop-zoom-label");

    setCanvasSize();

    el.querySelector("#andro-crop-close").addEventListener("click", closeModal);
    el.querySelector("#andro-crop-cancel").addEventListener("click", closeModal);
    el.querySelector("#andro-crop-confirm").addEventListener("click", confirmCrop);
    el.addEventListener("click", e => { if (e.target === el) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key==="Escape" && el.classList.contains("open")) closeModal(); });

    sliderEl.addEventListener("input", () => {
      const minS = getMinScale();
      scale = minS + (Number(sliderEl.value)/100) * (MAX_SCALE - minS);
      clampPan(); updateSliderUI(); scheduleRender();
    });

    const stage = el.querySelector("#andro-crop-stage");
    stage.addEventListener("mousedown",  onMouseDown);
    stage.addEventListener("wheel",      onWheel, {passive:false});
    stage.addEventListener("touchstart", onTouchStart, {passive:false});
    stage.addEventListener("touchmove",  onTouchMove,  {passive:false});
    stage.addEventListener("touchend",   onTouchEnd,   {passive:false});
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
  }

  function setCanvasSize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CANVAS_PX * dpr;
    canvas.height = CANVAS_PX * dpr;
    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }

  /* ════════════════════════════════════════════════════════════
     OPEN / CLOSE
  ════════════════════════════════════════════════════════════ */
  function openModal(file) {
    if (!modal) return;
    const fr = new FileReader();
    fr.onload = ev => {
      const i = new Image();
      i.onload = () => {
        img = i;
        fitImage();
        syncSlider();
        scheduleRender();
        liveRef();
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
      };
      i.src = ev.target.result;
    };
    fr.readAsDataURL(file);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ════════════════════════════════════════════════════════════
     SCALE / PAN
  ════════════════════════════════════════════════════════════ */
  function getMinScale() {
    if (!img) return 0.5;
    return Math.max(CANVAS_PX / img.naturalWidth, CANVAS_PX / img.naturalHeight);
  }

  function fitImage() {
    scale = getMinScale(); panX = 0; panY = 0;
  }

  function clampPan() {
    if (!img) return;
    const hw = img.naturalWidth  * scale / 2, hh = img.naturalHeight * scale / 2, hc = CANVAS_PX / 2;
    panX = Math.max(-(hw-hc), Math.min(hw-hc, panX));
    panY = Math.max(-(hh-hc), Math.min(hh-hc, panY));
  }

  function syncSlider() {
    if (!sliderEl || !img) return;
    const minS = getMinScale();
    sliderEl.value = Math.max(0, Math.min(100, ((scale-minS)/(MAX_SCALE-minS))*100));
    updateSliderUI();
  }

  function updateSliderUI() {
    if (!sliderEl) return;
    sliderEl.style.setProperty("--pct", sliderEl.value + "%");
    if (zoomLabel) zoomLabel.textContent = `Zoom · ${scale.toFixed(2)}×`;
  }

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  function scheduleRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => { rafId=0; render(); });
  }

  function render() {
    if (!img || !ctx) return;
    const cx = CANVAS_PX/2, cy = CANVAS_PX/2;
    ctx.clearRect(0,0,CANVAS_PX,CANVAS_PX);

    // fundo
    ctx.fillStyle = "#020305";
    ctx.fillRect(0,0,CANVAS_PX,CANVAS_PX);

    // imagem
    ctx.save();
    ctx.translate(cx+panX, cy+panY);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth/2, -img.naturalHeight/2);
    ctx.restore();

    // vinheta de borda
    const vig = ctx.createRadialGradient(cx,cy,cx*0.55,cx,cy,cx*0.98);
    vig.addColorStop(0,"rgba(0,0,0,0)");
    vig.addColorStop(1,"rgba(2,3,5,0.42)");
    ctx.fillStyle=vig; ctx.fillRect(0,0,CANVAS_PX,CANVAS_PX);

    // guia dos terços
    ctx.save();
    rrect(ctx,0,0,CANVAS_PX,CANVAS_PX,CANVAS_R); ctx.clip();
    ctx.strokeStyle="rgba(42,162,246,0.18)"; ctx.lineWidth=0.7;
    [1,2].forEach(i=>{
      const t=(CANVAS_PX/3)*i;
      ctx.beginPath();ctx.moveTo(t,0);ctx.lineTo(t,CANVAS_PX);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,t);ctx.lineTo(CANVAS_PX,t);ctx.stroke();
    });
    ctx.restore();

    // contorno do recorte
    rrect(ctx, 0.75, 0.75, CANVAS_PX-1.5, CANVAS_PX-1.5, CANVAS_R);
    ctx.strokeStyle="rgba(42,162,246,0.58)"; ctx.lineWidth=1.5; ctx.stroke();
  }

  /* ════════════════════════════════════════════════════════════
     ZOOM / PAN EVENTS
  ════════════════════════════════════════════════════════════ */
  function applyZoom(delta, px, py) {
    const prev=scale, minS=getMinScale();
    scale=Math.max(minS,Math.min(MAX_SCALE, scale*(1+delta)));
    const r=scale/prev, cx=CANVAS_PX/2, cy=CANVAS_PX/2;
    panX=px+(panX+cx-px)*r-cx; panY=py+(panY+cy-py)*r-cy;
    clampPan(); syncSlider(); scheduleRender(); liveRef();
  }

  function onMouseDown(e){isDrag=true;lastX=e.clientX;lastY=e.clientY;e.currentTarget.classList.add("dragging");e.preventDefault();}
  function onMouseMove(e){
    if(!isDrag)return;
    panX+=e.clientX-lastX;panY+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
    clampPan();scheduleRender();liveRef();
  }
  function onMouseUp(){
    if(!isDrag)return;isDrag=false;
    const s=document.getElementById("andro-crop-stage");if(s)s.classList.remove("dragging");
  }
  function onWheel(e){
    e.preventDefault();
    const r=canvas.getBoundingClientRect();
    applyZoom(e.deltaY<0?ZOOM_STEP:-ZOOM_STEP, e.clientX-r.left-CANVAS_PX/2, e.clientY-r.top-CANVAS_PX/2);
  }
  function d2(t){const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.sqrt(dx*dx+dy*dy);}
  function m2(t,r){return{x:(t[0].clientX+t[1].clientX)/2-r.left-CANVAS_PX/2,y:(t[0].clientY+t[1].clientY)/2-r.top-CANVAS_PX/2};}
  function onTouchStart(e){e.preventDefault();if(e.touches.length===1){isDrag=true;lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;}else{isDrag=false;lastDist=d2(e.touches);}}
  function onTouchMove(e){
    e.preventDefault();
    if(e.touches.length===1&&isDrag){panX+=e.touches[0].clientX-lastX;panY+=e.touches[0].clientY-lastY;lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;clampPan();scheduleRender();liveRef();}
    else if(e.touches.length===2){const d=d2(e.touches),m=m2(e.touches,canvas.getBoundingClientRect());applyZoom((d-lastDist)/lastDist*0.75,m.x,m.y);lastDist=d;}
  }
  function onTouchEnd(e){if(e.touches.length===0)isDrag=false;if(e.touches.length===1){isDrag=true;lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;}}

  /* ════════════════════════════════════════════════════════════
     MINIATURA AO VIVO
  ════════════════════════════════════════════════════════════ */
  function liveRef() {
    if (!img) return;
    const ref = document.getElementById("andro-crop-ref");
    if (!ref) return;
    const sz=46, oc=document.createElement("canvas");
    oc.width=sz;oc.height=sz;
    const c=oc.getContext("2d");
    const sx=(-CANVAS_PX/2-panX)/scale+img.naturalWidth /2;
    const sy=(-CANVAS_PX/2-panY)/scale+img.naturalHeight/2;
    const sw=CANVAS_PX/scale;
    c.drawImage(img,sx,sy,sw,sw,0,0,sz,sz);
    ref.innerHTML=`<img src="${oc.toDataURL()}" alt="">`;
  }

  /* ════════════════════════════════════════════════════════════
     CONFIRMAR
  ════════════════════════════════════════════════════════════ */
  function confirmCrop() {
    if (!img) return;
    const btn=document.getElementById("andro-crop-confirm");
    if(btn){btn.classList.add("loading");btn.innerHTML='<i class="fa-solid fa-circle-notch"></i> Processando…';}

    const out=document.createElement("canvas");
    out.width=OUTPUT_PX; out.height=OUTPUT_PX;
    const oc=out.getContext("2d");

    // Clip com o MESMO formato do avatar (quadrado arredondado)
    rrect(oc, 0, 0, OUTPUT_PX, OUTPUT_PX, OUTPUT_R);
    oc.clip();

    oc.fillStyle="#020305";
    oc.fillRect(0,0,OUTPUT_PX,OUTPUT_PX);

    // região de origem na imagem original
    const sx=(-CANVAS_PX/2-panX)/scale + img.naturalWidth /2;
    const sy=(-CANVAS_PX/2-panY)/scale + img.naturalHeight/2;
    const sw=CANVAS_PX/scale;
    oc.drawImage(img, sx, sy, sw, sw, 0, 0, OUTPUT_PX, OUTPUT_PX);

    out.toBlob(blob=>{
      if(!blob){
        if(btn){btn.classList.remove("loading");btn.innerHTML='<i class="fa-solid fa-check"></i> Usar esta foto';}
        return;
      }
      const file=new File([blob],"avatar.jpg",{type:"image/jpeg"});
      try{const dt=new DataTransfer();dt.items.add(file);if(originalInput)originalInput.files=dt.files;}
      catch(_){if(originalInput)originalInput._croppedBlob=blob;}

      const url=URL.createObjectURL(blob);
      updatePreviews(url);

      if(btn){btn.classList.remove("loading");btn.innerHTML='<i class="fa-solid fa-check"></i> Usar esta foto';}
      closeModal();
      if(window.showAndromedaNotice)window.showAndromedaNotice("Foto ajustada! Clique em Salvar Alterações para confirmar.","success");
    },"image/jpeg",QUALITY);
  }

  /* ════════════════════════════════════════════════════════════
     ATUALIZAR PREVIEWS NA PÁGINA
  ════════════════════════════════════════════════════════════ */
  function updatePreviews(url) {
    const prev=document.getElementById("perfil-avatar-preview");
    if(prev){prev.classList.add("has-photo");prev.innerHTML=`<img src="${url}" alt="Prévia">`;prev.classList.add("andro-avatar-pop");setTimeout(()=>prev.classList.remove("andro-avatar-pop"),700);}
    const hdr=document.querySelector(".perfil-user-avatar");
    if(hdr){hdr.classList.add("has-photo");hdr.innerHTML=`<img src="${url}" alt="Foto de perfil">`;hdr.classList.add("andro-avatar-pop");setTimeout(()=>hdr.classList.remove("andro-avatar-pop"),700);}
    const cp=document.querySelector(".perfil-avatar-copy p");
    if(cp)cp.textContent="Foto recortada — pronta para salvar ✓";
  }

  /* ════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════ */
  function init() {
    injectStyles();
    injectModal();
    const input=document.getElementById("avatar");
    if(!input)return;
    originalInput=input;
    input.addEventListener("change",function(){
      const file=this.files&&this.files[0];
      if(!file)return;
      if(!file.type.startsWith("image/")){if(window.showAndromedaNotice)window.showAndromedaNotice("Use JPG, PNG ou WEBP.","warning");return;}
      if(file.size>3*1024*1024){if(window.showAndromedaNotice)window.showAndromedaNotice("Máximo 3 MB.","warning");return;}
      openModal(file);
      this.value="";
    });
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();

})();