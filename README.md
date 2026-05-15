# 🌌 Biblioteca Andrômeda — O Cofre Cósmico

> Uma biblioteca web interativa com visual cósmico, catálogo tradicional, catálogo 3D em Three.js, animações cinematográficas com GSAP, área administrativa em PHP/MySQL e mascotes conversacionais Orion \\\\\\\\\\\\\\\& Lyra.

\---

## 📌 Sumário

* [1. Visão geral](#1-visão-geral)
* [2. Objetivo do projeto](#2-objetivo-do-projeto)
* [3. Principais funcionalidades](#3-principais-funcionalidades)
* [4. Tecnologias utilizadas](#4-tecnologias-utilizadas)
* [5. Estrutura de pastas](#5-estrutura-de-pastas)
* [6. Como instalar no XAMPP](#6-como-instalar-no-xampp)
* [7. Banco de dados](#7-banco-de-dados)
* [8. Como o PHP alimenta o JavaScript](#8-como-o-php-alimenta-o-javascript)
* [9. Como os livros viram planetas no Three.js](#9-como-os-livros-viram-planetas-no-threejs)
* [10. Intro cinematográfica](#10-intro-cinematográfica)
* [11. Catálogo tradicional e catálogo 3D](#11-catálogo-tradicional-e-catálogo-3d)
* [12. IA Orion \& Lyra](#12-ia-orion--lyra)
* [13. Área administrativa](#13-área-administrativa)
* [14. Perfil do leitor](#14-perfil-do-leitor)
* [15. Sistema de avaliações e reservas](#15-sistema-de-avaliações-e-reservas)
* [16. Design, Bootstrap e CSS](#16-design-bootstrap-e-css)
* [17. Performance e modo eco](#17-performance-e-modo-eco)
* [18. Rotas, caminhos e .htaccess](#18-rotas-caminhos-e-htaccess)
* [19. Erros comuns e soluções](#19-erros-comuns-e-soluções)
* [20. Checklist de testes](#20-checklist-de-testes)
* [21. Próximas melhorias](#21-próximas-melhorias)
* [22. Roteiro rápido para apresentar o projeto](#22-roteiro-rápido-para-apresentar-o-projeto)

\---

## 1\. Visão geral

A **Biblioteca Andrômeda** é um sistema web de biblioteca criado para transformar a navegação por livros em uma experiência visual e interativa.

Em vez de ser apenas uma tela comum com cards e tabelas, o projeto mistura:

* biblioteca digital;
* catálogo com busca e categorias;
* modo 3D com sistemas solares e planetas;
* intro cinematográfica com buraco negro, galáxia e partículas;
* mascotes interativos com lógica própria de conversa;
* área administrativa para gerenciar o acervo;
* perfil do leitor com avaliações, reservas e histórico.

A proposta central é:

> Fazer a exploração do conhecimento parecer uma viagem por uma galáxia.

\---

## 2\. Objetivo do projeto

O projeto tem dois objetivos principais:

### Objetivo funcional

Criar uma plataforma de biblioteca capaz de:

* cadastrar leitores;
* autenticar usuários;
* controlar acesso de administradores;
* listar livros;
* cadastrar livros, autores, editoras e categorias;
* permitir reservas;
* permitir avaliações;
* exibir informações completas das obras;
* manter dados persistidos em banco MySQL/MariaDB.

### Objetivo de experiência

Criar uma interface memorável, com:

* visual cósmico;
* animações suaves;
* navegação imersiva;
* mascotes com personalidade;
* catálogo orbital em 3D;
* sensação cinematográfica.

\---

## 3\. Principais funcionalidades

### Para leitores

* Criar conta.
* Fazer login.
* Acessar o catálogo.
* Buscar livros.
* Filtrar por categoria.
* Ver ficha completa da obra.
* Reservar livros disponíveis.
* Avaliar livros com estrelas e comentário.
* Ver informações no perfil.
* Conversar com Orion e Lyra.
* Explorar o catálogo em modo 3D.

### Para administradores

* Acessar painel administrativo.
* Cadastrar livros.
* Editar livros.
* Excluir livros.
* Cadastrar autores.
* Cadastrar categorias.
* Cadastrar editoras.
* Controlar status e quantidade dos livros.
* Gerenciar reservas.
* Acompanhar avaliações.
* Organizar o acervo.

### Funcionalidades visuais

* Intro com Three.js e GSAP.
* Galáxia interativa.
* Buraco negro central.
* Sistemas orbitais.
* Planetas baseados nos livros do banco.
* Carrosséis de destaque e categorias.
* Modal de livro.
* Cursor magnético.
* Notificações customizadas.
* Modos de performance.

\---

## 4\. Tecnologias utilizadas

|Tecnologia|Função no projeto|
|-|-|
|**HTML5**|Estrutura das páginas.|
|**CSS3**|Estilo visual, glassmorphism, responsividade e animações visuais.|
|**Bootstrap 5**|Grid, componentes e responsividade.|
|**JavaScript**|Interações, IA dos mascotes, carrosséis, modais e controle do 3D.|
|**Three.js**|Criação das cenas 3D, galáxias, planetas, estrelas e câmera.|
|**GSAP**|Timelines, transições cinematográficas e animações coreografadas.|
|**PHP**|Backend, login, sessões, CRUD, reservas e avaliações.|
|**MySQL/MariaDB**|Banco de dados da biblioteca.|
|**XAMPP**|Ambiente local com Apache, PHP e MySQL.|
|**Composer**|Dependências PHP, como bibliotecas de envio de e-mail.|

\---

## 5\. Estrutura de pastas

A estrutura principal do projeto segue esta lógica:

```txt
Biblioteca-Andromeda/
│
├── assets/
│   ├── audio/
│   │   └── Gravity\\\\\\\\\\\\\\\_s\\\\\\\\\\\\\\\_Maw.mp3
│   │
│   ├── css/
│   │   ├── adm.css
│   │   ├── andro.css
│   │   ├── introducao.css
│   │   ├── pgcadleitores.css
│   │   ├── pglogin.css
│   │   └── user.css
│   │
│   ├── js/
│   │   ├── andromeda.js
│   │   ├── animecadleitores.js
│   │   ├── animelogin.js
│   │   ├── intro.js
│   │   ├── pgadm.js
│   │   └── user.js
│   │
│   └── mascotes/
│       ├── orion\\\\\\\\\\\\\\\_neutral.png
│       ├── orion\\\\\\\\\\\\\\\_thinking.png
│       ├── orion\\\\\\\\\\\\\\\_smile.png
│       ├── lyra\\\\\\\\\\\\\\\_neutral.png
│       ├── lyra\\\\\\\\\\\\\\\_thinking.png
│       └── lyra\\\\\\\\\\\\\\\_smile.png
│
├── config/
│   ├── conexao.php
│   ├── crud.php
│   ├── dados.php
│   ├── mailer.php
│   └── sessao.php
│
├── includes/
│   └── notificacoes.php
│
├── pages/
│   ├── adm.php
│   ├── cadastroleitores.php
│   ├── catalogo.php
│   ├── intro.php
│   ├── login.php
│   ├── logout.php
│   └── perfil.php
│
├── uploads/
│   ├── capas/
│   └── avatars/
│
├── vendor/
│   └── dependências do Composer
│
├── .htaccess
├── composer.json
└── README.md
```

> Observação: algumas versões empacotadas podem conter apenas `pages/` e `assets/`. Para rodar o projeto completo, os arquivos `config/`, `includes/`, `uploads/`, `.htaccess`, `composer.json` e `vendor/` também precisam existir no projeto local.

\---

## 6\. Como instalar no XAMPP

### 6.1. Pré-requisitos

Instale:

* XAMPP;
* PHP compatível com o projeto;
* MySQL/MariaDB;
* Composer;
* navegador moderno, como Chrome, Edge ou Firefox.

### 6.2. Colocar o projeto na pasta correta

Copie a pasta do projeto para:

```txt
C:\\\\\\\\\\\\\\\\xampp\\\\\\\\\\\\\\\\htdocs\\\\\\\\\\\\\\\\Biblioteca-Andromeda
```

O caminho final deve ficar assim:

```txt
C:\\\\\\\\\\\\\\\\xampp\\\\\\\\\\\\\\\\htdocs\\\\\\\\\\\\\\\\Biblioteca-Andromeda\\\\\\\\\\\\\\\\pages\\\\\\\\\\\\\\\\catalogo.php
```

### 6.3. Iniciar serviços no XAMPP

No painel do XAMPP, inicie:

* Apache;
* MySQL.

### 6.4. Acessar pelo navegador

Use:

```txt
http://localhost/Biblioteca-Andromeda/
```

ou, dependendo das rotas:

```txt
http://localhost/Biblioteca-Andromeda/intro
http://localhost/Biblioteca-Andromeda/login
http://localhost/Biblioteca-Andromeda/catalogo
```

### 6.5. Instalar dependências PHP

No PowerShell:

```powershell
cd C:\\\\\\\\\\\\\\\\xampp\\\\\\\\\\\\\\\\htdocs\\\\\\\\\\\\\\\\Biblioteca-Andromeda
composer install
composer dump-autoload
```

Se o comando `composer` não funcionar, instale o Composer no Windows e selecione o PHP do XAMPP:

```txt
C:\\\\\\\\\\\\\\\\xampp\\\\\\\\\\\\\\\\php\\\\\\\\\\\\\\\\php.exe
```

\---

## 7\. Banco de dados

O banco de dados é o coração do projeto. Ele guarda usuários, livros, autores, categorias, editoras, reservas e avaliações.

### 7.1. Tabelas principais

#### `usuarios`

Guarda os leitores e administradores.

Campos importantes:

* `id\\\\\\\\\\\\\\\_usuario`;
* `username`;
* `email`;
* `senha`;
* `nivel\\\\\\\\\\\\\\\_acesso`;
* `nome`;
* `sobrenome`;
* `avatar`;
* `foto`.

O campo mais importante para controle de permissão é:

```sql
nivel\\\\\\\\\\\\\\\_acesso ENUM('admin', 'leitor')
```

Se o usuário for `admin`, ele pode acessar o painel administrativo. Se for `leitor`, acessa apenas as áreas normais do site.

#### `Livros`

Guarda o acervo.

Campos importantes:

* `id\\\\\\\\\\\\\\\_livro`;
* `titulo`;
* `id\\\\\\\\\\\\\\\_autor`;
* `ano\\\\\\\\\\\\\\\_publicacao`;
* `id\\\\\\\\\\\\\\\_categoria`;
* `id\\\\\\\\\\\\\\\_editora`;
* `numero\\\\\\\\\\\\\\\_paginas`;
* `origem\\\\\\\\\\\\\\\_idioma`;
* `quantidade`;
* `status`;
* `capa`;
* `sinopse`.

Exemplo simplificado:

```sql
CREATE TABLE Livros (
  id\\\\\\\\\\\\\\\_livro INT AUTO\\\\\\\\\\\\\\\_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  id\\\\\\\\\\\\\\\_autor INT,
  id\\\\\\\\\\\\\\\_categoria INT,
  id\\\\\\\\\\\\\\\_editora INT,
  quantidade INT NOT NULL,
  status ENUM('Disponível', 'Indisponível') DEFAULT 'Disponível',
  capa VARCHAR(500) DEFAULT 'uploads/capas/default.jpg',
  sinopse TEXT
);
```

#### `reservas`

Guarda as reservas dos leitores.

Campos importantes:

* `id\\\\\\\\\\\\\\\_reserva`;
* `id\\\\\\\\\\\\\\\_livro`;
* `id\\\\\\\\\\\\\\\_usuario`;
* `reserva\\\\\\\\\\\\\\\_status`;
* `data\\\\\\\\\\\\\\\_reserva`.

#### `avaliacoes`

Guarda notas e comentários dos usuários.

Campos importantes:

* `id\\\\\\\\\\\\\\\_livro`;
* `id\\\\\\\\\\\\\\\_usuario`;
* `nota`;
* `comentario`;
* `status`;
* `data\\\\\\\\\\\\\\\_atualizacao`.

\---

## 8\. Como o PHP alimenta o JavaScript

O PHP busca os livros no banco e entrega esses dados para o HTML/JavaScript.

O fluxo é:

```txt
MySQL
  ↓
PHP consulta os livros
  ↓
PHP monta arrays com livros, autores, categorias e avaliações
  ↓
PHP imprime esses dados na página
  ↓
JavaScript lê os dados
  ↓
Three.js transforma os dados em sistemas e planetas
```

Um exemplo conceitual:

```php
$livros = listarLivros($mysqli);
```

Depois o PHP pode disponibilizar isso para o JavaScript:

```php
<script>
  window.LIVROS = <?= json\\\\\\\\\\\\\\\_encode($livros, JSON\\\\\\\\\\\\\\\_UNESCAPED\\\\\\\\\\\\\\\_UNICODE); ?>;
</script>
```

No JavaScript:

```js
const livros = window.LIVROS || \\\\\\\\\\\\\\\[];
```

A partir daí, o JS consegue usar os dados reais do banco.

\---

## 9\. Como os livros viram planetas no Three.js

Esta é uma das partes mais importantes do projeto.

### 9.1. Ideia principal

No catálogo 3D:

* categoria literária vira um **sistema orbital**;
* livro vira um **planeta**;
* autor, status, avaliação e capa influenciam informações visuais e modais;
* o buraco negro fica no centro da galáxia;
* os sistemas orbitam ao redor do centro.

### 9.2. Exemplo prático

Imagine estes livros no banco:

|Título|Categoria|
|-|-|
|Dom Casmurro|Romance|
|Frankenstein|Terror|
|O Hobbit|Fantasia|
|A Máquina do Tempo|Ficção Científica|

O JavaScript pode transformar isso assim:

```txt
Categoria Romance → Sistema Romance
  └── Dom Casmurro → Planeta

Categoria Terror → Sistema Terror
  └── Frankenstein → Planeta

Categoria Fantasia → Sistema Fantasia
  └── O Hobbit → Planeta

Categoria Ficção Científica → Sistema Ficção Científica
  └── A Máquina do Tempo → Planeta
```

### 9.3. Agrupamento por categoria

O JS agrupa os livros por categoria:

```js
const grupos = {};

livros.forEach((livro) => {
  const categoria = livro.categoria || 'Sem categoria';

  if (!grupos\\\\\\\\\\\\\\\[categoria]) {
    grupos\\\\\\\\\\\\\\\[categoria] = \\\\\\\\\\\\\\\[];
  }

  grupos\\\\\\\\\\\\\\\[categoria].push(livro);
});
```

### 9.4. Criação dos sistemas

Para cada categoria, o Three.js cria um grupo:

```js
const sistema = new THREE.Group();
sistema.name = categoria;
scene.add(sistema);
```

Esse `Group` funciona como um container 3D.

Tudo que for adicionado dentro dele se move junto.

### 9.5. Criação dos planetas

Cada livro vira uma esfera:

```js
const geometry = new THREE.SphereGeometry(raio, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: cor });
const planeta = new THREE.Mesh(geometry, material);

planeta.userData.livro = livro;
sistema.add(planeta);
```

O `userData` é muito importante porque guarda o livro dentro do objeto 3D.

Quando o usuário clica no planeta, o sistema sabe qual livro abrir:

```js
const livro = planeta.userData.livro;
abrirModalDoLivro(livro);
```

### 9.6. Correção das órbitas

Para evitar que os sistemas se choquem, a versão atual usa uma lógica de órbitas seguras:

* cada sistema recebe uma faixa orbital;
* sistemas com mais planetas recebem mais espaço;
* existe distância mínima do buraco negro;
* a velocidade orbital é controlada;
* o movimento vertical é suavizado.

Função importante:

```js
buildSafeSystemOrbitLayout()
```

Ela calcula posições mais seguras para os sistemas na galáxia.

\---

## 10\. Intro cinematográfica

A intro é a abertura visual do projeto.

Ela usa:

* `pages/intro.php` para a estrutura HTML;
* `assets/css/introducao.css` para o visual;
* `assets/js/intro.js` para a cena 3D e animações;
* `assets/audio/Gravity\\\\\\\\\\\\\\\_s\\\\\\\\\\\\\\\_Maw.mp3` para trilha sonora.

### 10.1. Elementos da página

A página tem:

* container WebGL;
* áudio da intro;
* letterbox cinematográfico;
* HUD superior;
* título Andrômeda;
* botão de despertar;
* botão de pular intro;
* overlay de fade;
* grain visual.

### 10.2. Funções principais da intro

Algumas funções importantes de `intro.js`:

|Função|Para que serve|
|-|-|
|`resize()`|Ajusta a cena ao tamanho da tela.|
|`tick()`|Loop principal de animação.|
|`startSoundtrack()`|Inicia a música.|
|`startIntro()`|Dispara a sequência principal.|
|`finishIntroAndGoToLogin()`|Finaliza a intro e leva para login.|
|`buildBgStars()`|Cria estrelas de fundo.|
|`buildHostGalaxy()`|Cria a galáxia principal.|
|`buildBlackHole()`|Cria o buraco negro.|
|`buildTunnel()`|Cria o mergulho/túnel cósmico.|
|`buildRebirthGalaxy()`|Cria o ato final da galáxia renascendo.|
|`camTo()`|Anima a câmera entre posições.|
|`syncTimelineToSoundtrack()`|Sincroniza timeline e música.|

### 10.3. Como a intro funciona por atos

#### Ato 1 — Contemplação

O usuário vê a ambientação inicial, título, HUD e fundo espacial.

Objetivo:

> Apresentar a atmosfera do site.

#### Ato 2 — Aproximação

A câmera começa a se mover pelo espaço.

Objetivo:

> Criar sensação de viagem.

#### Ato 3 — Buraco negro

O buraco negro aparece como centro dramático da experiência.

Objetivo:

> Criar tensão visual e preparar o mergulho.

#### Ato 4 — Mergulho

A câmera entra no túnel cósmico.

Objetivo:

> Transformar a cena em uma travessia visual.

#### Ato 5 — Renascimento da galáxia

A galáxia final surge de forma contemplativa.

Objetivo:

> Encerrar com sensação de grandeza.

### 10.4. Como criar uma intro parecida do zero

Passo básico:

```js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

document.body.appendChild(renderer.domElement);
```

Depois crie estrelas:

```js
const geometry = new THREE.BufferGeometry();
const positions = \\\\\\\\\\\\\\\[];

for (let i = 0; i < 3000; i++) {
  positions.push(
    (Math.random() - 0.5) \\\\\\\\\\\\\\\* 2000,
    (Math.random() - 0.5) \\\\\\\\\\\\\\\* 2000,
    (Math.random() - 0.5) \\\\\\\\\\\\\\\* 2000
  );
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
const stars = new THREE.Points(geometry, material);
scene.add(stars);
```

E anime a câmera com GSAP:

```js
gsap.to(camera.position, {
  z: 40,
  duration: 6,
  ease: 'power2.inOut'
});
```

\---

## 11\. Catálogo tradicional e catálogo 3D

O site possui duas formas principais de navegar pelo acervo.

### 11.1. Catálogo tradicional

É a área com:

* cards de livros;
* carrossel de destaque;
* categorias;
* busca;
* modal com detalhes;
* botão de reserva;
* avaliação.

Essa versão é mais direta para o usuário comum.

### 11.2. Catálogo 3D

É a versão imersiva.

Nela:

* o usuário vê a galáxia;
* escolhe categorias como sistemas;
* clica em planetas para ver livros;
* usa zoom e rotação;
* visualiza o acervo como um mapa cósmico.

### 11.3. Raycaster

O Three.js usa o `Raycaster` para detectar cliques nos planetas.

Funciona assim:

```txt
Usuário clica na tela
  ↓
JS converte posição do mouse para coordenada 3D
  ↓
Raycaster lança um raio invisível
  ↓
Se o raio bater em um planeta, pega o livro daquele planeta
  ↓
Abre o modal
```

\---

## 12\. IA Orion \& Lyra

Orion e Lyra são mascotes conversacionais do projeto.

### 12.1. Personalidades

#### Orion

* Brincalhão;
* irônico;
* protetor;
* engraçado;
* analítico quando precisa;
* sabe ficar sério em momentos emocionais.

#### Lyra

* carinhosa;
* sábia;
* acolhedora;
* inteligente;
* gentil;
* boa em apoio emocional e conversas profundas.

### 12.2. Como a IA funciona

A IA funciona com:

* normalização de texto;
* intents;
* variações de pergunta;
* filtros de prioridade;
* repertórios de resposta;
* estados emocionais;
* sequência de imagens;
* recomendação baseada no catálogo.

Fluxo:

```txt
Usuário digita mensagem
  ↓
Texto é normalizado
  ↓
Sistema identifica intenção
  ↓
Sistema escolhe resposta de Orion/Lyra
  ↓
Sistema define emoção e imagem
  ↓
Resposta aparece no chat
```

### 12.3. O que são intents

`Intent` é a intenção do usuário.

Exemplos:

|Frase do usuário|Intent correta|
|-|-|
|“qual sua cor favorita?”|pergunta de gosto pessoal|
|“me recomenda um livro?”|recomendação|
|“me conte sua história”|história dos personagens|
|“me conte uma história”|história inventada|
|“estou triste”|apoio emocional|
|“o que é buraco negro?”|ciência/cosmos|

### 12.4. Por que isso é importante

Sem intents, a IA confundiria frases parecidas.

Exemplo:

```txt
“me conte sua história”
```

Não é a mesma coisa que:

```txt
“me recomenda um livro de história”
```

A palavra “história” aparece nas duas, mas o objetivo é diferente.

### 12.5. Recomendações

A recomendação só deve acontecer quando o usuário pedir claramente livro, leitura ou indicação.

Perguntas como:

```txt
“qual sua cor favorita?”
“o que você gosta de comer?”
“o que fez ontem?”
```

não devem puxar livros.

\---

## 13\. Área administrativa

A página administrativa fica em:

```txt
pages/adm.php
```

Ela usa:

* `adm.css` para visual;
* `pgadm.js` para interações;
* PHP para salvar dados no banco.

### 13.1. Funções do admin

O administrador pode:

* cadastrar livros;
* editar livros;
* remover livros;
* cadastrar autores;
* cadastrar editoras;
* cadastrar categorias;
* alterar estoque;
* controlar status;
* visualizar reservas;
* gerenciar informações do acervo.

### 13.2. Cadastro de autor, categoria e editora

O `pgadm.js` envia dados via AJAX para a própria rota do admin.

Exemplo conceitual:

```js
fetch('/Biblioteca-Andromeda/adm?action=novo\\\\\\\\\\\\\\\_autor\\\\\\\\\\\\\\\&ajax=1', {
  method: 'POST',
  credentials: 'same-origin',
  body: formData
});
```

`credentials: 'same-origin'` garante que a sessão do admin vá junto na requisição.

Isso evita o erro falso de sessão expirada quando o usuário ainda está logado.

\---

## 14\. Perfil do leitor

A página de perfil fica em:

```txt
pages/perfil.php
```

Ela mostra dados do leitor, avaliações, histórico e interações.

Arquivos relacionados:

```txt
assets/css/user.css
assets/js/user.js
```

Funções visuais:

* animações de entrada;
* modo eco/equilibrado/cinema;
* notificações customizadas;
* confirmação de ações;
* avatar do usuário;
* avaliações feitas pelo leitor.

\---

## 15\. Sistema de avaliações e reservas

### 15.1. Avaliações

O usuário pode avaliar um livro com nota e comentário.

O PHP salva no banco:

```sql
INSERT INTO avaliacoes (id\\\\\\\\\\\\\\\_livro, id\\\\\\\\\\\\\\\_usuario, nota, comentario)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  nota = VALUES(nota),
  comentario = VALUES(comentario),
  status = 'ativo',
  data\\\\\\\\\\\\\\\_atualizacao = CURRENT\\\\\\\\\\\\\\\_TIMESTAMP
```

Isso significa:

* se o usuário nunca avaliou o livro, cria avaliação;
* se já avaliou, atualiza a avaliação existente.

### 15.2. Reservas

O usuário pode reservar livros disponíveis.

A reserva guarda:

* qual usuário reservou;
* qual livro foi reservado;
* status da reserva;
* data da reserva.

\---

## 16\. Design, Bootstrap e CSS

### 16.1. Bootstrap

Bootstrap ajuda com:

* grid responsivo;
* containers;
* cards;
* botões;
* formulários;
* modais;
* navbar;
* organização do layout.

### 16.2. CSS próprio

O CSS customizado cria a identidade visual:

* fundo escuro;
* tons azulados e roxos;
* glassmorphism;
* blur;
* bordas translúcidas;
* brilho interno;
* cursor magnético;
* cards cósmicos;
* HUD sci-fi.

### 16.3. Glassmorphism

Exemplo:

```css
.card-cosmico {
  background: rgba(5, 12, 26, 0.72);
  border: 1px solid rgba(120, 190, 255, 0.22);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
}
```

Isso cria o efeito de vidro escuro translúcido.

\---

## 17\. Performance e modo eco

O projeto tem muitas animações, então precisa cuidar da performance.

Estratégias usadas:

* reduzir partículas no modo eco;
* diminuir pixel ratio;
* pausar animações quando não visíveis;
* evitar loops duplicados;
* usar `requestAnimationFrame`;
* controlar intensidade de bloom e blur;
* evitar objetos 3D desnecessários.

### Modos

|Modo|Uso|
|-|-|
|Eco|Máquinas fracas, menos animação.|
|Equilibrado|Visual bonito e performance boa.|
|Cinema|Máximo impacto visual.|

\---

## 18\. Rotas, caminhos e .htaccess

O projeto usa caminhos bonitos como:

```txt
/Biblioteca-Andromeda/catalogo
/Biblioteca-Andromeda/login
/Biblioteca-Andromeda/adm
```

Mas os arquivos reais estão em:

```txt
pages/catalogo.php
pages/login.php
pages/adm.php
```

O `.htaccess` ajuda a transformar uma URL bonita em um arquivo real.

### Atenção

Se o `.htaccess` estiver errado, podem acontecer problemas como:

* CSS não carregar;
* JS não carregar;
* imagens sumirem;
* AJAX cair em rota errada;
* login redirecionar errado.

\---

## 19\. Erros comuns e soluções

### 19.1. Composer não é reconhecido

Erro:

```txt
composer : O termo 'composer' não é reconhecido
```

Solução:

1. Instale o Composer.
2. Escolha o PHP do XAMPP.
3. Feche e abra o PowerShell.
4. Teste:

```powershell
composer -V
```

### 19.2. Dependência faltando em vendor

Erro:

```txt
Failed opening required vendor/ralouphie/getallheaders/src/getallheaders.php
```

Solução:

```powershell
cd C:\\\\\\\\\\\\\\\\xampp\\\\\\\\\\\\\\\\htdocs\\\\\\\\\\\\\\\\Biblioteca-Andromeda
Remove-Item -Recurse -Force vendor
composer install
composer dump-autoload
```

### 19.3. Sessão expirada no admin

Pode acontecer quando o JS envia requisição para a rota errada ou sem sessão.

Solução aplicada:

```js
credentials: 'same-origin'
```

E rota correta:

```txt
/Biblioteca-Andromeda/adm?action=novo\\\\\\\\\\\\\\\_autor\\\\\\\\\\\\\\\&ajax=1
```

### 19.4. Galáxia sumiu

Possíveis causas:

* erro JS no console;
* dados `window.LIVROS` vazios;
* câmera fora da posição;
* renderer não inicializou;
* container WebGL com tamanho zero;
* conflito com modo eco.

### 19.5. Sistemas se chocando

Correção aplicada:

* órbitas seguras;
* distância mínima do buraco negro;
* cálculo de espaço por quantidade de livros;
* faixas orbitais separadas.

\---

## 20\. Checklist de testes

Antes de apresentar ou entregar, teste:

### Login e cadastro

* \[ ] Cadastro funciona.
* \[ ] Login funciona.
* \[ ] Logout funciona.
* \[ ] Usuário comum não entra no admin.
* \[ ] Admin entra no painel.

### Catálogo

* \[ ] Livros aparecem.
* \[ ] Capas carregam.
* \[ ] Busca funciona.
* \[ ] Categorias funcionam.
* \[ ] Modal abre.
* \[ ] Reserva funciona.
* \[ ] Avaliação funciona.

### Modo 3D

* \[ ] Galáxia aparece.
* \[ ] Sistemas não colidem.
* \[ ] Planetas aparecem.
* \[ ] Clique no planeta abre livro correto.
* \[ ] Zoom funciona.
* \[ ] Voltar para catálogo funciona.

### Admin

* \[ ] Cadastrar livro.
* \[ ] Editar livro.
* \[ ] Excluir livro.
* \[ ] Cadastrar autor.
* \[ ] Cadastrar categoria.
* \[ ] Cadastrar editora.
* \[ ] Upload de capa.

### IA

* \[ ] “Tudo bem?” responde como personagem.
* \[ ] “Qual sua cor favorita?” não recomenda livro.
* \[ ] “Me recomenda um livro” recomenda livro.
* \[ ] “Me conte sua história” fala da origem deles.
* \[ ] “Me conte uma história” inventa uma história.
* \[ ] “Estou triste” ativa resposta acolhedora.

\---

## 21\. Próximas melhorias

Ideias para versões futuras:

* histórico de leitura;
* recomendações com pesos mais avançados;
* painel de estatísticas para admin;
* filtro por autor, nota e disponibilidade;
* notificações por e-mail;
* sistema de empréstimo completo;
* favoritos do leitor;
* ranking de livros mais avaliados;
* melhoria de acessibilidade;
* versão mobile ainda mais otimizada;
* integração opcional com modelos de IA externos.

\---

## Créditos do projeto

Projeto desenvolvido como uma experiência web de biblioteca interativa, com foco em:

* desenvolvimento frontend;
* backend PHP/MySQL;
* design de interface;
* animações criativas;
* Three.js;
* GSAP;
* IA conversacional baseada em intents;
* experiência do usuário.



Projeto desenvolvido por Gabriel Maia e Marianne Feliciano.

## Licença



Projeto acadêmico desenvolvido para fins de estudo e demonstração técnica.



