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
}

export default function ShareButtons({
  url = "https://jesusensina.com.br",
  text = "Conheça o Jesus Ensina — ensino bíblico rápido para quem não tem tempo:",
}: Props) {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function handleNativeShare() {
    try {
      await navigator.share({ title: "Jesus Ensina", text, url });
    } catch {
      // usuário cancelou o compartilhamento nativo — sem ação necessária
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(url);
    alert("Link copiado!");
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {canShare && (
        <button
          onClick={handleNativeShare}
          className="rounded-full bg-[var(--color-petrol)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-petrol-dark)]"
        >
          Compartilhar
        </button>
      )}

      {SHARE_ICONS.map((icon) => (
        <a
          key={icon.label}
          href={icon.build(url, text)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartilhar no ${icon.label}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] text-lg transition hover:border-[var(--color-petrol)]"
        >
          {icon.emoji}
        </a>
      ))}

      <button
        onClick={handleCopyLink}
        aria-label="Copiar link"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] text-lg transition hover:border-[var(--color-petrol)]"
      >
        🔗
      </button>
    </div>
  );
}
