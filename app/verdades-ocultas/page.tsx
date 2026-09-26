import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verdades Ocultas da Bíblia | Coleção de Pr. J.L. Silva",
  description:
    "O que a Bíblia realmente diz sobre o Éden, o Dilúvio e a queda das grandes civilizações? Descubra na coleção Verdades Ocultas da Bíblia, disponível na Amazon.",
};

const LIVRO_1 = {
  titulo: "Criação, Éden e a Ruptura",
  subtitulo: "Volume 1 — Origens, Humanidade, A Queda",
  hook: "Antes da queda, havia um propósito. O que realmente se perdeu no Éden — e por quê?",
  links: [
    { label: "Ler no Kindle", href: "https://www.amazon.com.br/dp/B0HL1YD54Y" },
    { label: "Comprar capa comum", href: "https://www.amazon.com/dp/B0HL4HGY4P" },
  ],
};

const LIVRO_2 = {
  titulo: "Caim, Vigilantes, Dilúvio e Babel",
  subtitulo: "Volume 2 — Juízo, Povos Antigos, Babel",
  hook: "Um dilúvio que apagou um mundo inteiro. Uma torre que desafiou os céus. O que ficou de fora da história que te contaram?",
  links: [
    { label: "Ler no Kindle", href: "https://www.amazon.com.br/dp/B0HKYPJRM5" },
    { label: "Comprar capa comum", href: "https://www.amazon.com/dp/B0HL1PPK15" },
    { label: "Comprar capa dura", href: "https://www.amazon.com/dp/B0HL21MQ1B" },
  ],
};

export default function VerdadesOcultasPage() {
  return (
    <div className="bg-[var(--color-ink)]">
      {/* HERO — imagem de impacto, sem menu competindo pela atenção */}
      <section className="relative flex min-h-[85vh] items-end overflow-hidden sm:min-h-screen">
        <Image
          src="/verdades-ocultas/diluvio.png"
          alt="O Dilúvio"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

        <div className="relative z-10 mx-auto max-w-3xl px-5 pb-16 text-center sm:px-6 sm:pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)] sm:text-sm">
            Coleção Verdades Ocultas da Bíblia
          </p>
          <h1 className="font-display mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl">
            O que a Bíblia diz de verdade — e ninguém te contou.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Origens, o Dilúvio, Babel, impérios que caíram por juízo — uma jornada pelas
            perguntas que a maioria tem medo de fazer, com respostas direto do texto.
          </p>
          <a
            href="#colecao"
            className="mt-8 inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-semibold text-white shadow-lg transition hover:opacity-90"
          >
            Ver os livros na Amazon ↓
          </a>
        </div>
      </section>

      {/* CAPAS — apresentação da coleção */}
      <section id="colecao" className="bg-[var(--color-cream)] py-16">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
          <div className="relative mx-auto aspect-[3/4] max-w-xs overflow-hidden rounded-2xl shadow-2xl sm:max-w-sm">
            <Image src="/verdades-ocultas/capas.png" alt="Coleção Verdades Ocultas da Bíblia" fill className="object-cover" priority />
          </div>
          <p className="font-display mt-8 text-2xl font-semibold text-[var(--color-petrol)] sm:text-3xl">
            Mais que livros. Uma jornada para mentes que buscam.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-ink)]/80">
            Escrita por Pr. J.L. Silva, a coleção percorre o Antigo e o Novo Testamento
            revelando o contexto histórico e espiritual por trás dos textos mais
            desafiadores da Bíblia — direto ao ponto, sem enrolação teológica.
          </p>
        </div>
      </section>

      {/* LIVRO 1 */}
      <section className="bg-[var(--color-petrol)] py-16 text-white">
        <div className="mx-auto grid max-w-4xl items-center gap-8 px-5 sm:grid-cols-2 sm:px-6">
          <div className="order-2 sm:order-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-gold)]">
              Volume 1
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">{LIVRO_1.titulo}</h2>
            <p className="mt-1 text-sm text-white/70">{LIVRO_1.subtitulo}</p>
            <p className="mt-4 text-white/90">{LIVRO_1.hook}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {LIVRO_1.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="relative order-1 aspect-[3/4] overflow-hidden rounded-2xl shadow-xl sm:order-2">
            <Image src="/verdades-ocultas/livro%201.png" alt="Capa do livro Criação, Éden e a Ruptura" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* LIVRO 2 */}
      <section className="bg-[var(--color-leather)] py-16 text-white">
        <div className="mx-auto grid max-w-4xl items-center gap-8 px-5 sm:grid-cols-2 sm:px-6">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
            <Image src="/verdades-ocultas/livro%202.png" alt="Capa do livro Caim, Vigilantes, Dilúvio e Babel" fill className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-gold)]">
              Volume 2
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">{LIVRO_2.titulo}</h2>
            <p className="mt-1 text-sm text-white/70">{LIVRO_2.subtitulo}</p>
            <p className="mt-4 text-white/90">{LIVRO_2.hook}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {LIVRO_2.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-semibold text-[var(--color-leather)] transition hover:opacity-90"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL — repete todos os links, é o que decide a conversão de quem rolou tudo */}
      <section className="bg-black py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-5 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Escolha seu formato e comece a leitura hoje
          </h2>

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-sm font-semibold text-[var(--color-gold)]">{LIVRO_1.titulo}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {LIVRO_1.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium transition hover:bg-white hover:text-black"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-gold)]">{LIVRO_2.titulo}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {LIVRO_2.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium transition hover:bg-white hover:text-black"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-10 text-xs text-white/50">
            Disponível na Amazon em e-book (Kindle) e livro físico.
          </p>
        </div>
      </section>
    </div>
  );
}
