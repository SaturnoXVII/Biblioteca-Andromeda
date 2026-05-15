import { motion } from "framer-motion";

import bookImg from "../assets/books/book-open.png";

export default function Book() {

  return (

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        position: "relative",

        transform: "translateY(-20px)"
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
          width: "150%",
          maxWidth: 1550,

          objectFit: "contain",

          zIndex: 5,

          pointerEvents: "none",

          filter:
            "drop-shadow(0 0 50px rgba(255,215,130,.35))"
        }}
      />

    </div>
  );
}