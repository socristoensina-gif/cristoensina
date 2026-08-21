import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/videos", label: "Vídeos" },
  { href: "/loja", label: "E-books" },
  { href: "/gratis", label: "Materiais Grátis" },
  { href: "/redes", label: "Redes Sociais" },
  { href: "/oferta", label: "Oferta" },
  { href: "/contato", label: "Contato" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-gold)]/30 bg-[var(--color-cream-light)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Jesus Ensina"
            width={44}
            height={44}
            className="rounded-full"
            priority
          />
          <span className="font-display text-xl font-semibold text-[var(--color-petrol)]">
            Jesus Ensina
          </span>
        </Link>

        <nav className="hidden gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-ink)] transition hover:text-[var(--color-petrol)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/carrinho"
          className="hidden items-center gap-1 text-sm font-medium text-[var(--color-petrol)] md:flex"
          aria-label="Ver carrinho"
        >
          🛒 Carrinho
        </Link>

        <Link
          href="/oferta"
          className="rounded-full bg-[var(--color-petrol)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-petrol-dark)] md:hidden"
        >
          Oferta
        </Link>
      </div>

      {/* menu simplificado para celular — links visíveis sempre, sem esconder atrás de hambúrguer */}
      <div className="flex gap-4 overflow-x-auto border-t border-[var(--color-gold)]/20 px-4 py-2 text-sm md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-[var(--color-ink)] hover:text-[var(--color-petrol)]"
          >
            {link.label}
          </Link>
        ))}
        <Link href="/carrinho" className="whitespace-nowrap text-[var(--color-petrol)]">
          🛒 Carrinho
        </Link>
      </div>
    </header>
  );
}
