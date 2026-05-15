export default function HUD({
  page,
  total,
  nextPage
}) {

  return (

    <div
      style={{
        position: "absolute",
        bottom: 25,
        left: "50%",

        transform: "translateX(-50%)",

        display: "flex",
        alignItems: "center",
        gap: 30,

        zIndex: 999
      }}
    >

      <div
        style={{
          color: "#f6d58b",
          fontSize: 42,
          fontWeight: "bold",

          textShadow:
            "0 0 20px rgba(255,215,120,.5)"
        }}
      >
        {page + 1} / {total}
      </div>

      <button
        onClick={nextPage}

        style={{
          padding: "18px 42px",

          borderRadius: 999,

          border:
            "1px solid rgba(255,255,255,.2)",

          background:
            "linear-gradient(145deg,#2f145f,#160828)",

          color: "white",

          fontSize: 22,

          cursor: "pointer",

          boxShadow:
            "0 0 30px rgba(124,77,255,.5)"
        }}
      >
        Próxima Página →
      </button>

    </div>
  );
}