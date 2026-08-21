import Link from "next/link";

const SOCIAL_LINKS = [
  { label: "YouTube", href: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "#" },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "#" },
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "#" },
  { label: "TikTok", href: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "#" },
  { label: "Kwai", href: process.env.NEXT_PUBLIC_KWAI_URL ?? "#" },
  { label: "WhatsApp", href: process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "#" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-gold)]/30 bg-[var(--color-petrol)] text-[var(--color-cream-light)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold">Jesus Ensina</p>
            <p className="mt-2 text-sm text-[var(--color-cream-light)]/80">
              Ensino bíblico direto ao ponto, para quem não tem tempo, mas não abre mão da fé.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-gold)]">
              Navegue
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/loja" className="hover:underline">E-books</Link></li>
              <li><Link href="/gratis" className="hover:underline">Materiais Grátis</Link></li>
              <li><Link href="/contato" className="hover:underline">Fale Conosco</Link></li>
              <li><Link href="/oferta" className="hover:underline">Fazer uma Oferta</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-gold)]">
              Nossas Redes
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-gold)]">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/privacidade" className="hover:underline">Política de Privacidade</Link></li>
              <li><Link href="/termos" className="hover:underline">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-[var(--color-cream-light)]/60">
          Isso foi Jesus Ensina. Guarde esse aprendizado — e se ele te ajudou, ensine para alguém também.
        </p>
      </div>
    </footer>
  );
}
