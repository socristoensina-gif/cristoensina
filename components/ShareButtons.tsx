"use client";

import { useEffect, useState } from "react";

const SHARE_ICONS = [
  {
    label: "WhatsApp",
    build: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    emoji: "📱",
  },
  {
    label: "Facebook",
    build: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    emoji: "👍",
  },
  {
    label: "X",
    build: (url: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    emoji: "✖️",
  },
];

interface Props {
  url?: string;
  text?: string;
  compact?: boolean; // versão pequena para caber no header
}

export default function ShareButtons({
  url = "https://jesusensina.com.br",
  text = "Conheça o Jesus Ensina — ensino bíblico rápido para quem não tem tempo:",
  compact = false,
}: Props) {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function handleNativeShare() {
    try {
      await navigator.share({ title: "Jesus Ensina", text, url });
    } catch {
      // usuário cancelou — sem ação necessária
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(url);
    alert("Link copiado! Cole nos Stories do Instagram ou onde quiser compartilhar.");
  }

  const size = compact ? "h-8 w-8 text-sm" : "h-11 w-11 text-lg";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {canShare && (
        <button
          onClick={handleNativeShare}
          className={`flex items-center justify-center rounded-full bg-[var(--color-petrol)] text-white transition hover:bg-[var(--color-petrol-dark)] ${
            compact ? "h-8 w-8 text-sm" : "px-5 py-2.5 text-sm font-semibold"
          }`}
          aria-label="Compartilhar"
          title="Compartilhar"
        >
          {compact ? "↗" : "Compartilhar"}
        </button>
      )}

      {SHARE_ICONS.map((icon) => (
        <a
          key={icon.label}
          href={icon.build(url, text)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartilhar no ${icon.label}`}
          title={icon.label}
          className={`flex items-center justify-center rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] transition hover:border-[var(--color-petrol)] ${size}`}
        >
          {icon.emoji}
        </a>
      ))}

      <button
        onClick={handleCopyLink}
        aria-label="Compartilhar no Instagram (copia o link)"
        title="Instagram (copia o link)"
        className={`flex items-center justify-center rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] transition hover:border-[var(--color-petrol)] ${size}`}
      >
        📸
      </button>
    </div>
  );
}
