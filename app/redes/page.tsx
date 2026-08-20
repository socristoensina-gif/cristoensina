const SOCIALS = [
  { label: "YouTube", desc: "Vídeos completos de ensino e pregação", envKey: "NEXT_PUBLIC_YOUTUBE_URL" },
  { label: "Facebook", desc: "Nossa comunidade principal", envKey: "NEXT_PUBLIC_FACEBOOK_URL" },
  { label: "Instagram", desc: "Reflexões diárias em formato rápido", envKey: "NEXT_PUBLIC_INSTAGRAM_URL" },
  { label: "TikTok", desc: "Ensino em 1 minuto", envKey: "NEXT_PUBLIC_TIKTOK_URL" },
  { label: "Kwai", desc: "Ensino em 1 minuto", envKey: "NEXT_PUBLIC_KWAI_URL" },
  { label: "WhatsApp", desc: "Fale diretamente conosco", envKey: "NEXT_PUBLIC_WHATSAPP_URL" },
];

export default function RedesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-center text-3xl font-semibold text-[var(--color-petrol)]">
        Nossas Redes
      </h1>
      <p className="mt-2 text-center text-[var(--color-ink)]/75">
        Nos encontre em todas as plataformas — mesmo nome, mesma mensagem.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        {SOCIALS.map((social) => {
          const href = process.env[social.envKey] ?? "#";
          return (
            <a
              key={social.label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] px-6 py-4 shadow-sm transition hover:shadow-md"
            >
              <div>
                <p className="font-display font-semibold text-[var(--color-petrol)]">{social.label}</p>
                <p className="text-sm text-[var(--color-ink)]/70">{social.desc}</p>
              </div>
              <span className="text-[var(--color-gold)]">→</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
