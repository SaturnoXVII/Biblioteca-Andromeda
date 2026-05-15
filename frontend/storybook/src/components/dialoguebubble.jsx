import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

export default function DialogueBubble({
  speaker,
  expression,
  text,
  side,
  page
}) {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 20
      }}

      animate={{
        opacity: 1,
        y: 0
      }}

      style={{
        width: 420,

        padding: 35,

        borderRadius: 35,

        background:
          "rgba(255,255,255,.88)",

        border:
          "2px solid rgba(255,255,255,.35)",

        backdropFilter: "blur(14px)",

        position: "relative",

        marginBottom: 30,

        boxShadow:
          "0 0 40px rgba(255,255,255,.2)"
      }}
    >

      <h2
        style={{
          fontSize: 32,
          marginBottom: 20,
          color: "#222"
        }}
      >
        {speaker} {expression}
      </h2>

      <TypeAnimation
        key={page}
        sequence={[text]}
        speed={65}
        cursor={false}

        style={{
          fontSize: 28,
          lineHeight: 1.6,
          color: "#222"
        }}
      />

      {/* rabinho */}
      <div
        style={{
          position: "absolute",

          bottom: -20,

          [side === "left" ? "left" : "right"]: 70,

          width: 45,
          height: 45,

          background:
            "rgba(255,255,255,.88)",

          transform: "rotate(45deg)",

          borderRadius: 10
        }}
      />

    </motion.div>
  );
}