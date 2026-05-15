import {
  useState,
  useEffect,
  useRef
} from "react";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { Howl } from "howler";
import useSound from "use-sound";

import story from "./data/story1.json";



import MagicParticles from "./components/MagicParticles";

import bookImg from "./assets/books/book-open.png";

import pageFlipSfx from "./assets/sounds/page-flip.mp3";
import music from "./assets/sounds/library.mp3";

import orionHappy from "./assets/mascots/orion-happy.png";
import orionThinking from "./assets/mascots/orion-thinking.png";

import lyraHappy from "./assets/mascots/lyra-happy.png";
import lyraThinking from "./assets/mascots/lyra-thinking.png";

import Library from "./assets/backgrounds/library.png";
import cosmicLibrary from "./assets/backgrounds/cosmic-library.png";

const backgrounds = {
  library: Library,
  "cosmic-library": cosmicLibrary
};

const characterImages = {
  Orion: {
    happy: orionHappy,
    thinking: orionThinking,
    neutral: orionHappy
  },

  Lyra: {
    happy: lyraHappy,
    thinking: lyraThinking,
    neutral: lyraHappy
  }
};

export default function App() {

  const [isTransitioning, setIsTransitioning] =
    useState(false);

  const [currentId, setCurrentId] = useState(() => {

    const save =
      localStorage.getItem("andromeda-save");

    return save ? Number(save) : 0;

  });

  useEffect(() => {

    localStorage.setItem(
      "andromeda-save",
      currentId
    );

  }, [currentId]);

  const [playPageFlip] = useSound(pageFlipSfx, {
    volume: 0.6
  });

  const current =
    story.find(scene => scene.id === currentId);

  const [musicEnabled, setMusicEnabled] =
    useState(true);
const bgMusic = useRef(null);

useEffect(() => {

  bgMusic.current = new Howl({
    src: [music],
    loop: true,
    volume: 0.35
  });

  bgMusic.current.play();

  return () => {

    if (bgMusic.current) {
      bgMusic.current.stop();
    }

  };

}, []);

  // =====================================
  // LIGA / DESLIGA SOM
  // =====================================

 function toggleMusic() {

  if (!bgMusic.current) return;

  if (musicEnabled) {

    bgMusic.current.pause();

  } else {

    bgMusic.current.play();

  }

  setMusicEnabled(!musicEnabled);

}


  // =====================================
  // VOLTAR AO CATÁLOGO
  // =====================================

  function backToCatalog() {

    // redireciona para a página principal
    window.location.href = "/Biblioteca-Andromeda/pages/catalogo.php";

  }

  function nextPage() {

    if (current.next === null) return;

    playPageFlip();

    setIsTransitioning(true);

    setTimeout(() => {

      setCurrentId(current.next);

      setTimeout(() => {

        setIsTransitioning(false);

      }, 250);

    }, 450);

  }

  function prevPage() {

    if (currentId === 0) return;

    playPageFlip();

    setCurrentId(currentId - 1);

  }

  return (

    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",

        position: "relative",

        userSelect: "none",

        backgroundImage:
          `url(${backgrounds[current.background]})`,

        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >

      {/* OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,

          background:
            `
        radial-gradient(
          circle,
          rgba(255,215,120,.10),
          rgba(120,70,255,.08),
          rgba(0,0,0,.45) 88%
        )
      `,

          zIndex: 1
        }}
      />

      {/* PARTÍCULAS */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2
        }}
      >
        <MagicParticles />
      </div>

      {/* TOPO */}
      {/* TOPO */}

<motion.button

  whileHover={{
    scale: 1.08
  }}

  whileTap={{
    scale: 0.94
  }}

  onClick={backToCatalog}

  style={{
    position: "absolute",

    top: 22,
    left: 22,

    width: 44,
    height: 44,

    borderRadius: "50%",

    border:
      "1px solid rgba(140,90,255,.45)",

    background:
      "rgba(15,8,30,.52)",

    backdropFilter: "blur(10px)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "#f4e6ff",

    fontSize: 14,

    cursor: "pointer",

    zIndex: 999,

    boxShadow:
      `
      0 0 14px rgba(140,90,255,.25),
      inset 0 0 10px rgba(255,255,255,.04)
      `
  }}
>

  <i className="fa-solid fa-arrow-left"></i>

</motion.button>

<motion.button

  whileHover={{
    scale: 1.08
  }}

  whileTap={{
    scale: 0.94
  }}

  onClick={toggleMusic}

  style={{
    position: "absolute",

    top: 22,
    right: 22,

    width: 44,
    height: 44,

    borderRadius: "50%",

    border:
      "1px solid rgba(140,90,255,.45)",

    background:
      "rgba(15,8,30,.52)",

    backdropFilter: "blur(10px)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "#f4e6ff",

    fontSize: 14,

    cursor: "pointer",

    zIndex: 999,

    boxShadow:
      `
      0 0 14px rgba(140,90,255,.25),
      inset 0 0 10px rgba(255,255,255,.04)
      `
  }}
>

  <i
    className={
      musicEnabled
        ? "fa-solid fa-volume-high"
        : "fa-solid fa-volume-xmark"
    }
  />

</motion.button>
      <div
        style={{
          position: "absolute",
          top: 25,
          width: "100%",

          textAlign: "center",

          zIndex: 50
        }}
      >

        <h1
          style={{
            fontSize: 70,
            color: "#f1c97a",

            fontFamily: "serif",

            textShadow:
              "0 0 25px rgba(255,215,120,.45)",

            marginBottom: 8
          }}
        >
          Biblioteca Andrômeda
        </h1>

        <p
          style={{
            fontSize: 24,
            color: "#f5e6c8"
          }}
        >
          Onde o conhecimento viaja entre estrelas
        </p>

        {/* linha decorativa */}
        <div
          style={{
            marginTop: 16,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            gap: 18
          }}
        >

          <div
            style={{
              width: 180,
              height: 1,

              background:
                "linear-gradient(to right, transparent, rgba(255,215,120,.75), transparent)"
            }}
          />

          <div
            style={{
              color: "#f1c97a",
              fontSize: 24
            }}
          >
            ✦
          </div>

          <div
            style={{
              width: 180,
              height: 1,

              background:
                "linear-gradient(to left, transparent, #f1c97a)"
            }}
          />

        </div>

      </div>

      {/* LIVRO */}
      <div
        style={{
          position: "absolute",

          left: "50%",
          top: "55%",

          transform: "translate(-50%, -50%)",

          zIndex: 5
        }}
      >

        <motion.img
          src={bookImg}

          animate={{
            y: [0, -10, 0]
          }}

          transition={{
            duration: 4,
            repeat: Infinity
          }}

          style={{
            width: 1200,
            maxWidth: "70vw",

            objectFit: "contain",

            filter:
              "drop-shadow(0 0 50px rgba(255,215,130,.35))"
          }}
        />

      </div>

      {/* ESQUERDA */}
      {current.side === "left" && (

        <>

          {/* BALÃO */}
          <motion.div

            key={`dialog-left-${currentId}`}

            initial={{
              opacity: 0,
              x: -40
            }}

            animate={{
              opacity: 1,
              x: 0
            }}

            transition={{
              duration: 0.5
            }}

            style={{
              position: "absolute",

              left: 70,
              top: 90,

              width: 360,

              padding: "28px 28px 24px",

              borderRadius: 40,

              background:
                "rgba(255,255,255,.88)",

              border:
                "2px solid rgba(255,255,255,.4)",

              backdropFilter: "blur(12px)",

              zIndex: 30,
              margin: 10,
              boxShadow:
                "0 0 40px rgba(255,255,255,.18)"
            }}
          >

            {/* NOME */}
            <div
              style={{
                position: "absolute",

                top: -18,
                left: 25,

                padding: "6px 18px",

                borderRadius: 999,

                background:
                  "linear-gradient(145deg,#5926b5,#2d0d63)",

                color: "white",

                fontSize: 20,
                fontWeight: "bold",

                boxShadow:
                  "0 0 20px rgba(124,77,255,.45)"
              }}
            >
              ✦ {current.speaker}
            </div>

            <TypeAnimation
              key={currentId}
              sequence={[current.text]}
              speed={65}
              cursor={false}

              style={{
                fontSize: 21,
                lineHeight: 1.7,
                color: "#222"
              }}
            />

            {/* RABO */}
            <div
              style={{
                position: "absolute",

                bottom: -22,
                left: 65,

                width: 0,
                height: 0,

                borderLeft: "22px solid transparent",
                borderRight: "22px solid transparent",

                borderTop:
                  "40px solid rgba(255,255,255,.88)",

                transform: "rotate(12deg)"
              }}
            />

          </motion.div>

          {/* GATO */}
          <motion.img

            key={`left-${currentId}`}

            initial={{
              opacity: 0,
              x: -40
            }}

            animate={{
              opacity: 1,
              x: 0,
              y: [0, -10, 0]
            }}

            transition={{
              duration: 0.7,

              y: {
                duration: 3,
                repeat: Infinity
              }
            }}

            src={
              characterImages[current.speaker][current.expression]
            }

            style={{
              position: "absolute",

              left: 0,
              bottom: 0,

              width: 360,

              zIndex: 15,

              objectFit: "contain",

              filter:
                "drop-shadow(0 0 30px rgba(124,77,255,.5))"
            }}
          />

        </>

      )}

      {/* DIREITA */}
      {current.side === "right" && (

        <>

          {/* BALÃO */}
          <motion.div

            key={`dialog-right-${currentId}`}

            initial={{
              opacity: 0,
              x: 40
            }}

            animate={{
              opacity: 1,
              x: 0
            }}

            transition={{
              duration: 0.5
            }}

            style={{
              position: "absolute",

              right: 70,
              top: 160,

              width: 360,

              padding: "28px 28px 24px",

              borderRadius: 40,

              background:
                "rgba(255,255,255,.88)",

              border:
                "2px solid rgba(255,255,255,.4)",

              backdropFilter: "blur(12px)",

              zIndex: 30,

              boxShadow:
                "0 0 40px rgba(255,255,255,.18)"
            }}
          >

            {/* NOME */}
            <div
              style={{
                position: "absolute",

                top: -18,
                right: 25,

                padding: "6px 18px",

                borderRadius: 999,

                background:
                  "linear-gradient(145deg,#5926b5,#2d0d63)",

                color: "white",

                fontSize: 20,
                fontWeight: "bold",

                boxShadow:
                  "0 0 20px rgba(124,77,255,.45)"
              }}
            >
              ✦ {current.speaker}
            </div>

            <TypeAnimation
              key={currentId}
              sequence={[current.text]}
              speed={65}
              cursor={false}

              style={{
                fontSize: 21,
                lineHeight: 1.7,
                color: "#222"
              }}
            />

            {/* RABO */}
            <div
              style={{
                position: "absolute",

                bottom: -22,
                right: 65,

                width: 0,
                height: 0,

                borderLeft: "22px solid transparent",
                borderRight: "22px solid transparent",

                borderTop:
                  "40px solid rgba(255,255,255,.88)",

                transform: "rotate(-12deg)"
              }}
            />

          </motion.div>

          {/* GATO */}
          <motion.img

            key={`right-${currentId}`}

            initial={{
              opacity: 0,
              x: 40
            }}

            animate={{
              opacity: 1,
              x: 0,
              y: [0, -10, 0]
            }}

            transition={{
              duration: 0.7,

              y: {
                duration: 3,
                repeat: Infinity
              }
            }}

            src={
              characterImages[current.speaker][current.expression]
            }

            style={{
              position: "absolute",

              right: 0,
              bottom: 0,

              width: 360,

              zIndex: 15,

              objectFit: "contain",

              filter:
                "drop-shadow(0 0 30px rgba(255,77,242,.45))"
            }}
          />

        </>

      )}
      <div
        style={{
          position: "absolute",
          bottom: -30,
          left: "50%",

          transform: "translateX(-50%)",

          width: 900,
          height: 180,

          borderRadius: "50%",

          background:
            "radial-gradient(circle, rgba(255,215,120,.22), transparent 70%)",

          filter: "blur(40px)",

          zIndex: 20
        }}
      />
      {/* HUD INFERIOR */}
      <div
        style={{
          position: "absolute",

          bottom: -20,
          left: "50%",

          transform: "translateX(-50%)",

          zIndex: 999,

          display: "flex",
          flexDirection: "column",
          alignItems: "center",

          gap: 14
        }}
      >

        {/* CONTROLES */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30
          }}
        >

          {/* BOTÃO ANTERIOR */}
          <motion.button
            onClick={prevPage}
            animate={{
              boxShadow: [
                "0 0 15px rgba(255,215,120,.15)",
                "0 0 35px rgba(255,215,120,.35)",
                "0 0 15px rgba(255,215,120,.15)"
              ]
            }}

            transition={{
              duration: 2.5,
              repeat: Infinity
            }}
            style={{
              width: 230,
              height: 60,

              borderRadius: 999,

              border:
                "1px solid rgba(255,215,120,.35)",

              boxShadow:
                `
    inset 0 0 12px rgba(255,255,255,.05),
    0 0 15px rgba(255,215,120,.12),
    0 0 35px rgba(255,180,60,.10)
  `,


              background:
                "linear-gradient(180deg, rgba(18, 8, 40, 0.7), rgba(6, 2, 20, 0.72))",



              color: "#faefd4",

              fontSize: 20,
              fontFamily: "serif",

              cursor: "pointer",

              boxShadow:
                `
                  inset 0 0 12px rgba(255,255,255,.05),
                  0 0 25px rgba(255,215,120,.12)
                `
            }}
          >
            ← &nbsp; Anterior
          </motion.button>

          {/* PAGINA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20
            }}
          >

            <div
              style={{
                color: "#f1c97a",
                fontSize: 22
              }}
            >
              ✦
            </div>

            <div
              style={{
                color: "#f6d58b",
                background:
                  "linear-gradient(to bottom, #fff2c2, #f3c76a)",

                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: 34,
                whiteSpace: "nowrap",
                lineHeight: 1,
                fontFamily: "serif",

                textShadow:
                  "0 0 20px rgba(255,215,120,.4)"
              }}
            >
              {currentId + 1} / {story.length}
            </div>

            <div
              style={{
                color: "#f1c97a",
                fontSize: 22
              }}
            >
              ✦
            </div>

          </div>

          {/* BOTÃO PRÓXIMO */}
          <motion.button
            onClick={nextPage}
            animate={{
              boxShadow: [
                "0 0 15px rgba(255,215,120,.15)",
                "0 0 35px rgba(255,215,120,.35)",
                "0 0 15px rgba(255,215,120,.15)"
              ]
            }}

            transition={{
              duration: 2.5,
              repeat: Infinity
            }}
            style={{
              width: 230,
              height: 60,

              borderRadius: 999,
              border:
                "1px solid rgba(255,215,120,.35)",

              boxShadow:
                `
    inset 0 0 12px rgba(255,255,255,.05),
    0 0 15px rgba(255,215,120,.12),
    0 0 35px rgba(255,180,60,.10)
  `,


              background:
                "linear-gradient(180deg, rgba(18, 8, 40, 0.7), rgba(6, 2, 20, 0.72))",



              color: "#faefd4",

              fontSize: 20,
              fontFamily: "serif",

              cursor: "pointer",

              boxShadow:
                `
                  inset 0 0 12px rgba(255,255,255,.05),
                  0 0 25px rgba(255,215,120,.12)
                `
            }}
          >
            Próxima Página &nbsp; →
          </motion.button>

        </div>

        {/* TEXTO */}
        <div
          style={{
            color: "#e7d3aa",

            fontSize: 18,
            fontFamily: "serif",

            opacity: .9,

            textShadow:
              "0 0 10px rgba(255,215,120,.25)"
          }}
        >
          Clique ou pressione → para virar a página
        </div>

      </div>

      {/* TRANSIÇÃO */}
      <motion.div

        animate={{
          opacity: isTransitioning ? 1 : 0
        }}

        transition={{
          duration: 0.4
        }}

        style={{
          position: "fixed",
          inset: 0,

          background:
            "radial-gradient(circle, rgba(255,215,120,.12), black 72%)",

          zIndex: 99999,

          pointerEvents: "none"
        }}
      />

    </div>
  );
}