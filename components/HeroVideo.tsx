"use client";

import { useRef, useState } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/verdades-ocultas/diluvio.png"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/verdades-ocultas/video-livro1.mp4" type="video/mp4" />
      </video>

      <button
        onClick={toggleSound}
        className="absolute right-4 top-4 z-20 rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/70"
      >
        {muted ? "🔇 Ativar som" : "🔊 Silenciar"}
      </button>
    </>
  );
}
