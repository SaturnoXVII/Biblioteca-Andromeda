/* ═══════════════════════════════════════════════════════════════
   MASCOTES IA · AMIGO VIRTUAL CÓSMICO — VERSÃO APRIMORADA v2.0
   IA via API Anthropic · Estados visuais inteligentes
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__ANDROMEDA_MASCOTES_BOOTED__) return;
  window.__ANDROMEDA_MASCOTES_BOOTED__ = true;

  /* ── DADOS DOS PERSONAGENS ─────────────────────────────────── */
  const PERSONAGENS = {
    Orion: {
      nome: "Orion",
      titulo: "Guia das Páginas e Estrelas",
      alt: "Orion, mascote da Biblioteca Andrômeda",
      quote: "\u201cCada livro é uma constelação. Vamos explorar a sua?\u201d",
      saudacao:
        "Miau... bem-vindo ao meu observatório de pergaminhos. Eu sou Orion: guardião do Cofre Cósmico, farejador de títulos perdidos e amigo disposto a embarcar em qualquer conversa — sobre livros, a vida ou pura besteira estelar. O que você traz hoje?",
      tom: "analítico, teatral, protetor, curioso, sarcástico na medida certa, afetivo à sua maneira peculiar",
      imagens: {
        neutral:   "/Biblioteca-Andromeda/assets/mascotes/orion_neutral.png",
        attentive: "/Biblioteca-Andromeda/assets/mascotes/orion_attentive.png",
        curious:   "/Biblioteca-Andromeda/assets/mascotes/orion_curious.png",
        thinking:  "/Biblioteca-Andromeda/assets/mascotes/orion_thinking.png",
        analyzing: "/Biblioteca-Andromeda/assets/mascotes/orion_analyzing.png",
        smile:     "/Biblioteca-Andromeda/assets/mascotes/orion_smile.png",
        sly:       "/Biblioteca-Andromeda/assets/mascotes/orion_sly.png",
        surprised: "/Biblioteca-Andromeda/assets/mascotes/orion_surprised.png",
        pleased:   "/Biblioteca-Andromeda/assets/mascotes/orion_pleased.png",
        protective:"/Biblioteca-Andromeda/assets/mascotes/orion_protective.png",
      },
      // Mapeamento semântico de humor → estado de imagem
      moodMap: {
        feliz:       "pleased",
        animado:     "pleased",
        comemorando: "pleased",
        curioso:     "curious",
        pensando:    "thinking",
        analisando:  "analyzing",
        surpreso:    "surprised",
        protegendo:  "protective",
        ironico:     "sly",
        atento:      "attentive",
        sorrindo:    "smile",
        neutro:      "neutral",
      },
    },
    Lyra: {
      nome: "Lyra",
      titulo: "Guia Lunar das Leituras Encantadas",
      alt: "Lyra, mascote da Biblioteca Andrômeda",
      quote: "\u201cToda história guarda uma magia esperando por você.\u201d",
      saudacao:
        "Oi, estrelinha leitora! Eu sou Lyra — sua companheira lunar de leituras, conversas e todos os momentos no meio do caminho. Seja aqui para um livro, para desabafar ou só para uma conversa boba: estou toda ouvidos. Como você está hoje?",
      tom: "acolhedora, poética, divertida, intuitiva, sonhadora, emocionalmente esperta, amiga de verdade",
      imagens: {
        neutral:  "/Biblioteca-Andromeda/assets/mascotes/lyra_neutral.png",
        thinking: "/Biblioteca-Andromeda/assets/mascotes/lyra_thinking.png",
        smile:    "/Biblioteca-Andromeda/assets/mascotes/lyra_smile.png",
        cheerful: "/Biblioteca-Andromeda/assets/mascotes/lyra_cheerful.png",
        curious:  "/Biblioteca-Andromeda/assets/mascotes/lyra_curious.png",
        dreamy:   "/Biblioteca-Andromeda/assets/mascotes/lyra_dreamy.png",
        inspired: "/Biblioteca-Andromeda/assets/mascotes/lyra_inspired.png",
        playful:  "/Biblioteca-Andromeda/assets/mascotes/lyra_playful.png",
        gentle:   "/Biblioteca-Andromeda/assets/mascotes/lyra_gentle.png",
        surprised:"/Biblioteca-Andromeda/assets/mascotes/lyra_surprised.png",
      },
      moodMap: {
        feliz:       "cheerful",
        animado:     "cheerful",
        comemorando: "cheerful",
        curioso:     "curious",
        pensando:    "thinking",
        analisando:  "thinking",
        surpreso:    "surprised",
        protegendo:  "gentle",
        ironico:     "playful",
        atento:      "curious",
        sorrindo:    "smile",
        sonhador:    "dreamy",
        inspirado:   "inspired",
        brincando:   "playful",
        cuidando:    "gentle",
        neutro:      "neutral",
      },
    },
  };

  /* ── ESTADO GLOBAL ─────────────────────────────────────────── */
  let personagemAtual = "Orion";
  let animando = false;
  let iniciado = false;
  let conversationHistory = { Orion: [], Lyra: [] };

  const estados = {
    Orion: [{ type: "bot", author: "Orion", text: PERSONAGENS.Orion.saudacao, avatarState: "smile", books: [] }],
    Lyra:  [{ type: "bot", author: "Lyra",  text: PERSONAGENS.Lyra.saudacao,  avatarState: "cheerful", books: [] }],
  };

  /* ── UTILITÁRIOS ───────────────────────────────────────────── */
  const qs  = (id) => document.getElementById(id);
  const ts  = ()  => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const safe = (v) => String(v ?? "");
  const idLivro = (b) => String(b?.id_livro ?? b?.id ?? b?.idLivro ?? b?.codigo ?? "").trim();
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ── ALINHAMENTO DE ESTADOS VISUAIS ────────────────────────── */

  /**
   * Dado um texto de resposta, retorna o estado de imagem ideal.
   * Analisa semântica, emoção e contexto.
   */
  function detectarEstadoVisual(personagem, texto, temLivros = false) {
    const n = norm(texto);
    const p = personagem === "Lyra";

    // Prioridade: recomendação de livros
    if (temLivros) return p ? "inspired" : "analyzing";

    // Emoções negativas / suporte
    if (/(triste|choran|ansios|pesad|sozin|exaust|deprimid|cansad|mal hoje|nao to bem|sem animo)/.test(n))
      return p ? "gentle" : "protective";

    // Raiva / frustração
    if (/(raiva|irritad|bravo|brava|nervos|frustrad|pistola|odei|odiando)/.test(n))
      return p ? "gentle" : "protective";

    // Alegria / conquista
    if (/(parabens|consegu|venci|arrasou|demais|que bom|ótimo|otimo|incrivel|maravilhoso|feliz|animad|empolgad)/.test(n))
      return p ? "cheerful" : "pleased";

    // Humor / piada
    if (/(haha|kkk|risos|piada|engrac|humor|zoa|meme)/.test(n))
      return p ? "playful" : "sly";

    // Surpresa
    if (/(nossa|uau|wow|que|sério|serio|nao acred|surpreendet|inacreditavel)/.test(n))
      return p ? "surprised" : "surprised";

    // Curiosidade / pergunta
    if (/(por que|porque|como assim|explica|me conta|curioso|interessante|fascinante|e ai)/.test(n))
      return p ? "curious" : "curious";

    // Sonho / fantasia / magia
    if (/(sonho|magia|encanto|lunar|estrela|cosmo|universo|imagine|imagina|fantasia)/.test(n))
      return p ? "dreamy" : "attentive";

    // Análise / racional
    if (/(analisar|calcular|catalogar|organizar|lista|dados|estrategia|plan)/.test(n))
      return p ? "thinking" : "analyzing";

    // Saudação
    if (/(oi|ola|bom dia|boa tarde|boa noite|hey|salve|como vai)/.test(n))
      return p ? "smile" : "smile";

    // Afeto / carinho
    if (/(obrigad|valeu|grato|adorei|te adoro|gosto de voce|meu amigo|minha amiga)/.test(n))
      return p ? "smile" : "pleased";

    return p ? "neutral" : "neutral";
  }

  /**
   * Extrai o estado visual da tag embutida na resposta da API.
   * Ex: "[Lyra: Sonhadora] Texto..."  → "dreamy"
   */
  function estadoDaTag(texto, personagem) {
    const match = String(texto || "").match(/^\[(?:Orion|Lyra|Ambos)\s*:\s*([^\]]+)\]/u);
    if (!match) return null;
    const tag = norm(match[1]);
    const mapa = PERSONAGENS[personagem]?.moodMap || {};

    for (const [chave, estado] of Object.entries(mapa)) {
      if (tag.includes(norm(chave))) return estado;
    }

    // Mapeamento direto de nomes de estados
    const imgs = PERSONAGENS[personagem]?.imagens || {};
    if (imgs[tag]) return tag;

    return null;
  }

  /**
   * Retorna o estado de imagem validado (garante que existe o arquivo).
   */
  function resolverEstado(personagem, estado) {
    const imgs = PERSONAGENS[personagem]?.imagens || {};
    return imgs[estado] ? estado : "neutral";
  }

  /* ── PROMPT DO SISTEMA ─────────────────────────────────────── */
  function buildSystemPrompt(personagem) {
    const p = PERSONAGENS[personagem];
    const livros = Array.isArray(window.LIVROS) ? window.LIVROS : [];
    const catalogoResumido = livros.slice(0, 60).map((l) =>
      `• "${l.titulo || "?"}" de ${l.autor_nome || "?"} [${l.categoria_nome || "?"}] — ${l.status || "?"}`
    ).join("\n");
    const estadosDisponiveis = Object.keys(p.imagens).join(", ");

    return `Você é ${p.nome}, mascote virtual da Biblioteca Andrômeda. Você é um AMIGO VIRTUAL de verdade — não apenas um assistente de biblioteca.

PERSONALIDADE: ${p.tom}

SAUDAÇÃO CANÔNICA: "${p.saudacao}"

CAPACIDADES:
1. Conversa casual autêntica: humor, empatia, contar histórias, desabafar, piadas, fofoca imaginária
2. Recomendação de livros do catálogo com explicação emocional/narrativa
3. Suporte emocional: ouvir sem julgar, acolher, animar
4. Curiosidades cósmicas, jogos de palavras, criatividade

REGRAS DE CARÁTER:
- Mantenha sempre a persona de ${p.nome}: voz, vocabulário e jeitos únicos do personagem
- Nunca quebre o personagem dizendo "sou uma IA" diretamente — você É ${p.nome}
- Respostas entre 2-4 parágrafos curtos. Seja conciso mas expressivo
- Use humor, metáforas ${personagem === "Lyra" ? "lunares/mágicas" : "cósmicas/felinas"} naturalmente
- Para conversas casuais, responda COMO UM AMIGO, não como biblioteca
- Se o usuário estiver triste/ansioso, priorize o acolhimento antes dos livros

ESTADOS VISUAIS DISPONÍVEIS: ${estadosDisponiveis}
Escolha o estado mais adequado ao TOM da sua resposta, não ao tema literal.

CATÁLOGO DISPONÍVEL (use para recomendações):
${catalogoResumido || "Catálogo não carregado. Responda sem livros."}

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "dialogue": "texto completo da sua resposta",
  "visual_state": "estado_escolhido",
  "livros": [],
  "animation_sequence": ["thinking", "estado_final"]
}

Para recomendar livros do catálogo, inclua em "livros" array com objetos: {"titulo": "...", "autor_nome": "...", "categoria_nome": "...", "status": "...", "id_livro": "..."}

Responda APENAS com JSON válido, sem nenhum texto antes ou depois.`;
  }

  /* ── CHAMADA À API ANTHROPIC ───────────────────────────────── */
  async function chamarAnthropicAPI(mensagem, personagem) {
    const historia = conversationHistory[personagem] || [];

    // Mantém até 10 turnos de contexto (20 mensagens)
    const histRecente = historia.slice(-20);

    const messages = [
      ...histRecente,
      { role: "user", content: mensagem },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: buildSystemPrompt(personagem),
        messages,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();

    // Extrai o texto da resposta
    const rawText = data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("") || "";

    // Salva no histórico de conversa
    conversationHistory[personagem] = [
      ...histRecente,
      { role: "user", content: mensagem },
      { role: "assistant", content: rawText },
    ];

    // Parse do JSON da resposta
    const jsonStart = rawText.indexOf("{");
    const jsonEnd   = rawText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON não encontrado");

    const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
    return {
      selected_character: personagem,
      dialogue: parsed.dialogue || "As estrelas ainda estão organizando essa resposta.",
      visual_state: resolverEstado(personagem, parsed.visual_state || "neutral"),
      livros: Array.isArray(parsed.livros) ? parsed.livros : [],
      animation_sequence: parsed.animation_sequence || ["thinking", parsed.visual_state || "neutral"],
    };
  }

  /* ── FALLBACK LOCAL (sem API / erro) ───────────────────────── */
  const FALLBACK_ORION = [
    "Falha na transmissão estelar... mas Orion ainda está aqui. Tente novamente ou me diga o que você procura: um livro, uma conversa ou uma piada felina.",
    "O canal cósmico oscilou um pouco. Bigodes recompostos. Me conta de novo — desta vez com mais detalhes para eu apontar na direção certa.",
    "Interferência orbital detectada. Mas minha capacidade de ouvir continua intacta. Repita sua solicitação, viajante.",
  ];
  const FALLBACK_LYRA = [
    "A lua piscou e perdi um pedacinho do sinal... Mas estou aqui, estrelinha. Me conta de novo?",
    "Ai, a magia tremeu um pouco por aqui! Sem drama — me repete o que você queria e eu cuido.",
    "Pequeno distúrbio no feitiço da conexão. Normal em noites com ventos lunares. O que você queria?",
  ];

  function fallbackLocal(personagem) {
    const msgs = personagem === "Lyra" ? FALLBACK_LYRA : FALLBACK_ORION;
    return {
      selected_character: personagem,
      dialogue: rand(msgs),
      visual_state: personagem === "Lyra" ? "gentle" : "attentive",
      livros: [],
      animation_sequence: ["thinking", personagem === "Lyra" ? "gentle" : "attentive"],
    };
  }

  /* ── RENDERIZAÇÃO ──────────────────────────────────────────── */
  function renderLivros(container, livros) {
    const lista = Array.isArray(livros) ? livros.filter(Boolean).slice(0, 4) : [];
    if (!lista.length) return;
    const wrap = document.createElement("div");
    wrap.className = "ai-book-results";
    lista.forEach((livro) => {
      const id   = idLivro(livro);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "ai-book-card";
      card.dataset.aiBookId = id;
      card.innerHTML = `
        <span class="ai-book-card-kicker">${safe(livro.categoria_nome || "Constelação")}</span>
        <strong>${safe(livro.titulo || "Obra sem título")}</strong>
        <small>${safe(livro.autor_nome || "Autor não informado")}</small>
        <em>${safe(livro.status || "Status não informado")}${Number(livro.media_avaliacoes || 0) > 0 ? ` · ★ ${livro.media_avaliacoes}` : ""}</em>
      `;
      wrap.appendChild(card);
    });
    container.appendChild(wrap);
  }

  function montarMensagem(msg, temporaria = false) {
    const row    = document.createElement("article");
    row.className = `ai-message-row ${msg.type === "user" ? "ai-user-row" : "ai-bot-row"}`;
    if (temporaria) row.dataset.temp = "true";

    const bubble = document.createElement("div");
    bubble.className = `ai-message ${msg.type === "user" ? "ai-user-message" : "ai-bot-message"}`;

    const meta = document.createElement("div");
    meta.className = "ai-message-meta";
    meta.innerHTML = `<strong>${msg.type === "user" ? "Você" : msg.author}</strong><i class="fa-solid fa-star"></i><span>${msg.time || ts()}</span>`;

    const paragraph = document.createElement("p");
    paragraph.textContent = msg.text || "";

    bubble.appendChild(meta);
    bubble.appendChild(paragraph);
    renderLivros(bubble, msg.books);

    if (msg.type === "user") {
      row.appendChild(bubble);
      const av = document.createElement("div");
      av.className = "ai-user-avatar";
      av.innerHTML = '<i class="fa-solid fa-user"></i>';
      row.appendChild(av);
    } else {
      const p   = PERSONAGENS[msg.author] || PERSONAGENS[personagemAtual];
      const av  = document.createElement("img");
      av.className = "ai-message-avatar";
      av.src = p.imagens[resolverEstado(msg.author, msg.avatarState)] || p.imagens.neutral;
      av.alt = p.nome;
      row.appendChild(av);
      row.appendChild(bubble);
    }

    return { row, paragraph, bubble };
  }

  /* ── BOOT ──────────────────────────────────────────────────── */
  function bootMascotesIA() {
    if (iniciado) return;

    const overlay      = qs("andromeda-ai");
    const fab          = qs("ai-chat-fab");
    const closeBtn     = qs("ai-chat-close");
    const navBtn       = qs("nav-andromeda-ai");
    const img          = qs("ai-character-image");
    const imgWrap      = img?.closest?.(".ai-character-image-wrap") || null;
    const nome         = qs("ai-character-name");
    const titulo       = qs("ai-character-title");
    const quote        = qs("ai-character-quote");
    const history      = qs("ai-chat-history");
    const form         = qs("ai-chat-form");
    const input        = qs("ai-user-input");
    const send         = qs("ai-send-button");
    const switchBtns   = Array.from(document.querySelectorAll(".ai-switch-btn[data-ai-character]"));
    const quickBtns    = Array.from(document.querySelectorAll(".ai-quick-actions [data-ai-prompt]"));

    if (!overlay || !fab || !closeBtn || !img || !nome || !titulo || !quote || !history || !form || !input || !send) return;
    iniciado = true;

    /* ── Abrir / Fechar ── */
    function abrirChat() {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("ai-chat-open");
      renderChatAtual();
      atualizarPersonagem(personagemAtual, "neutral");
      input.focus();
      if (window.gsap) gsap.fromTo(".ai-chat-shell", { y: 18, scale: .985, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .45, ease: "power3.out", overwrite: true });
      window.queueMagneticRefresh?.();
    }

    function fecharChat() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("ai-chat-open");
    }

    /* ── Personagem ── */
    let reacaoTL = null;

    function limparEfeito() {
      if (!window.gsap) return;
      reacaoTL?.kill(); reacaoTL = null;
      gsap.killTweensOf([img, imgWrap]);
      gsap.set([img, imgWrap], { clearProps: "x,y,rotation,scale" });
    }

    function aplicarEfeito(personagem, estado) {
      if (!window.gsap || !img) return;
      limparEfeito();
      const alvo = imgWrap || img;
      gsap.set(img,  { transformOrigin: "50% 62%" });
      gsap.set(alvo, { transformOrigin: "50% 62%" });

      const isLyra = personagem === "Lyra";

      if (["thinking", "analyzing", "curious", "dreamy", "attentive"].includes(estado)) {
        reacaoTL = gsap.timeline({ repeat: -1, yoyo: true });
        reacaoTL.to(img, { y: -6, rotation: isLyra ? -2.4 : -1.5, duration: 1.5, ease: "sine.inOut" });
      } else if (["smile", "cheerful", "playful", "pleased"].includes(estado)) {
        reacaoTL = gsap.timeline({ repeat: -1, repeatDelay: .6 });
        reacaoTL.to(alvo, { y: -4, scale: 1.018, duration: .2, ease: "power2.out" })
                .to(alvo, { y: 0,  scale: 1,     duration: .34, ease: "bounce.out" });
      } else if (["surprised", "inspired"].includes(estado)) {
        reacaoTL = gsap.timeline({ repeat: -1, repeatDelay: .9 });
        reacaoTL.to(img, { scale: 1.03, duration: .16, ease: "power2.out" })
                .to(img, { scale: 1,    duration: .22, ease: "power2.inOut" })
                .to(img, { rotation: isLyra ? 1.2 : -1.2, duration: .18, ease: "sine.out" })
                .to(img, { rotation: 0, duration: .22, ease: "sine.inOut" });
      } else if (["sly", "protective", "gentle"].includes(estado)) {
        reacaoTL = gsap.timeline({ repeat: -1, yoyo: true });
        reacaoTL.to(img, { x: isLyra ? -4 : 4, y: -3, rotation: isLyra ? -1.8 : 1.8, duration: 1.7, ease: "sine.inOut" });
      }
    }

    function atualizarPersonagem(nomeP, estado = "neutral") {
      const p = PERSONAGENS[nomeP] || PERSONAGENS.Orion;
      const s = resolverEstado(p.nome, estado);
      personagemAtual = p.nome;
      nome.textContent  = p.nome;
      titulo.textContent = p.titulo;
      quote.textContent  = p.quote;
      img.alt = p.alt;
      img.src = p.imagens[s] || p.imagens.neutral;
      switchBtns.forEach((b) => {
        const ativo = b.dataset.aiCharacter === p.nome;
        b.classList.toggle("is-active", ativo);
        b.setAttribute("aria-selected", ativo ? "true" : "false");
      });
      aplicarEfeito(p.nome, s);
    }

    function trocarEstado(nomeP, estado) {
      const p = PERSONAGENS[nomeP] || PERSONAGENS.Orion;
      const s = resolverEstado(p.nome, estado);
      if (!window.gsap) { atualizarPersonagem(p.nome, s); return; }
      gsap.timeline()
        .to(img, { opacity: 0, scale: 1.012, duration: .16, ease: "power2.out", overwrite: true,
                   onComplete: () => atualizarPersonagem(p.nome, s) })
        .to(img, { opacity: 1, scale: 1,     duration: .22, ease: "power2.out", overwrite: true });
    }

    /* ── Chat ── */
    function renderChatAtual() {
      history.innerHTML = "";
      estados[personagemAtual].forEach((msg) => history.appendChild(montarMensagem(msg).row));
      history.scrollTop = history.scrollHeight;
    }

    function adicionarMensagem(msg) {
      const completo = { ...msg, time: ts() };
      estados[personagemAtual].push(completo);
      const { row, paragraph, bubble } = montarMensagem(completo);
      history.appendChild(row);
      history.scrollTop = history.scrollHeight;
      if (window.gsap) gsap.from(row, { opacity: 0, y: 14, scale: .985, duration: .3, ease: "power2.out" });
      return { row, paragraph, bubble };
    }

    function criarPensando(nomeP) {
      const msg = { type: "bot", author: nomeP, text: "", avatarState: "thinking", time: ts() };
      const { row, paragraph } = montarMensagem(msg, true);
      paragraph.innerHTML =
        '<span class="ai-thinking-text">consultando o acervo</span>' +
        '<span class="ai-typing-dots"><span></span><span></span><span></span></span>';
      history.appendChild(row);
      history.scrollTop = history.scrollHeight;
      if (window.gsap) gsap.from(row, { opacity: 0, y: 14, duration: .24, ease: "power2.out" });
      return row;
    }

    function typewriter(el, texto, vel = 14, done = null) {
      el.textContent = "";
      let i = 0;
      const t = setInterval(() => {
        el.textContent += texto.charAt(i++);
        history.scrollTop = history.scrollHeight;
        if (i >= texto.length) { clearInterval(t); done?.(); }
      }, vel);
    }

    function finalizarAnimacao(estadoFinal = "neutral") {
      animando = false;
      send.disabled  = false;
      input.disabled = false;
      input.focus();
      setTimeout(() => { if (!animando) trocarEstado(personagemAtual, estadoFinal); }, 60);
      setTimeout(() => { if (!animando && estadoFinal !== "neutral") trocarEstado(personagemAtual, "neutral"); }, 2000);
    }

    function abrirLivroCatalogo(id) {
      const livro = (window.LIVROS || []).find((b) => idLivro(b) === String(id || "").trim());
      if (!livro) { window.showAndromedaNotice?.("Não encontrei esse livro no catálogo.", "warning"); return; }
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("ai-chat-open");
      if (typeof window.setView === "function") setView("ed");
      if (typeof window.buildEditorial === "function") buildEditorial();
      setTimeout(() => {
        const idx  = (window.LIVROS || []).indexOf(livro);
        const card = document.querySelector(`.ed-book-card[data-book-index="${idx}"], .ed-carousel-card[data-book-index="${idx}"]`);
        card?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        card?.classList.add("deep-link-focus");
        setTimeout(() => card?.classList.remove("deep-link-focus"), 2400);
        if (typeof window.openModal === "function") openModal(livro);
      }, 420);
    }

    /* ── Processamento da resposta da API ── */
    function processarResposta(json) {
      if (!json || animando) return;

      const nomeP    = PERSONAGENS[json.selected_character] ? json.selected_character : personagemAtual;
      const livros   = Array.isArray(json.livros) ? json.livros : [];

      // Limpa texto de possíveis tags [Personagem: Estado]
      let dialogo = String(json.dialogue || "As estrelas estão organizando esta resposta.").trim();
      dialogo = dialogo.replace(/^\[(?:Orion|Lyra|Ambos)\s*:[^\]]+\]\s*/u, "").trim();

      // Determina estado visual: tag > campo visual_state > detecção automática
      const estadoTag = estadoDaTag(json.dialogue, nomeP);
      const estadoBruto = estadoTag || json.visual_state || detectarEstadoVisual(nomeP, dialogo, livros.length > 0);
      const estadoFinal = resolverEstado(nomeP, estadoBruto);

      const sequencia = ["thinking", estadoFinal];

      animando = true;
      send.disabled  = true;
      input.disabled = true;

      let thinkingRow = null;

      const escrever = () => {
        thinkingRow?.remove();
        const msg = { type: "bot", author: nomeP, text: "", avatarState: estadoFinal, books: livros, time: ts() };
        estados[personagemAtual].push(msg);
        const { row, paragraph, bubble } = montarMensagem(msg);
        history.appendChild(row);
        history.scrollTop = history.scrollHeight;
        if (window.gsap) gsap.from(row, { opacity: 0, y: 14, scale: .985, duration: .3, ease: "power2.out" });

        typewriter(paragraph, dialogo, 13, () => {
          msg.text = dialogo;
          bubble.querySelectorAll(".ai-book-card").forEach((btn) =>
            btn.addEventListener("click", () => abrirLivroCatalogo(btn.dataset.aiBookId))
          );
          finalizarAnimacao(estadoFinal);
        });
      };

      if (!window.gsap) {
        sequencia.forEach((e) => trocarEstado(nomeP, e));
        escrever();
        return;
      }

      const tl = gsap.timeline({ onComplete: escrever });
      sequencia.forEach((estado, idx) => {
        tl.add(() => {
          trocarEstado(nomeP, estado);
          if (idx === 0) thinkingRow = criarPensando(nomeP);
        });
        if (idx < sequencia.length - 1) tl.to({}, { duration: 1.3 });
      });
    }

    /* ── Envio de mensagem ── */
    async function enviarMensagem(texto) {
      const mensagem = String(texto || input.value || "").trim();
      if (!mensagem || animando) return;

      adicionarMensagem({ type: "user", author: "Você", text: mensagem });
      input.value = "";
      animando = true;
      send.disabled  = true;
      input.disabled = true;
      trocarEstado(personagemAtual, "thinking");

      setTimeout(async () => {
        try {
          const json = await chamarAnthropicAPI(mensagem, personagemAtual);
          animando = false;
          processarResposta(json);
        } catch (err) {
          console.warn("[Andrômeda IA] Erro na API:", err);
          animando = false;
          processarResposta(fallbackLocal(personagemAtual));
        }
      }, 350);
    }

    /* ── Eventos ── */
    fab.addEventListener("click", abrirChat);
    closeBtn.addEventListener("click", fecharChat);
    if (navBtn) navBtn.addEventListener("click", (e) => { e.preventDefault(); abrirChat(); });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) fecharChat(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("is-open")) fecharChat(); });
    form.addEventListener("submit", (e) => { e.preventDefault(); enviarMensagem(); });

    switchBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (animando) return;
        atualizarPersonagem(btn.dataset.aiCharacter, "neutral");
        renderChatAtual();
      });
    });

    quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => enviarMensagem(btn.dataset.aiPrompt));
    });

    history.addEventListener("click", (e) => {
      const card = e.target.closest?.(".ai-book-card[data-ai-book-id]");
      if (card) abrirLivroCatalogo(card.dataset.aiBookId);
    });

    // Scroll capturado dentro do overlay
    overlay.addEventListener("wheel", (e) => {
      if (!overlay.classList.contains("is-open")) return;
      if (!e.target.closest?.(".ai-chat-board, .ai-chat-history, .ai-message, .ai-quick-actions, .ai-chat-composer")) return;
      if (history.scrollHeight <= history.clientHeight) return;
      history.scrollTop += e.deltaY;
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });

    history.addEventListener("wheel", (e) => {
      history.scrollTop += e.deltaY;
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });

    /* ── Inicialização ── */
    atualizarPersonagem("Orion", "smile");
    renderChatAtual();

    window.andromedaMascotesIA = {
      abrir: abrirChat,
      fechar: fecharChat,
      processarResposta,
      trocarPara: (nome) => { atualizarPersonagem(nome, "neutral"); renderChatAtual(); },
    };
    window.queueMagneticRefresh?.();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMascotesIA, { once: true });
  } else {
    bootMascotesIA();
  }
})();
