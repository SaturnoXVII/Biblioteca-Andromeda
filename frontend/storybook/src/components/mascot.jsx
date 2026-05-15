import { motion } from "framer-motion";

export default function Mascot({
  image,
  side
}) {

  return (

    <motion.img

      initial={{
        opacity: 0,
        x: side === "left" ? -50 : 50
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

      src={image}

      style={{
        width: 300,

        transform: "translateY(40px)",

        objectFit: "contain",

        filter:
          side === "left"
            ? "drop-shadow(0 0 30px rgba(124,77,255,.5))"
            : "drop-shadow(0 0 30px rgba(255,77,242,.5))"
      }}
    />
  );
}