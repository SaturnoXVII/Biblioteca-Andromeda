import libraryBg from "../assets/backgrounds/library.png";

export default function SceneBackground() {

  return (

    <>
      <div
        style={{
          position: "absolute",
          inset: 0,

          backgroundImage: `url(${libraryBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,

          background:
            "linear-gradient(to bottom, rgba(5,0,20,.55), rgba(0,0,0,.82))"
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,

          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,.7))"
        }}
      />

    </>
  );
}