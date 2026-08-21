import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getLatestVideos } from "@/lib/youtube";
import ShareButtons from "@/components/ShareButtons";

export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: announcements }, { data: featuredEbooks }, videos] = await Promise.all([
    supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .limit(3),
    supabase
      .from("ebooks")
      .select("id, slug, title, cover_image_url, price_cents")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(3),
    getLatestVideos(3),
  ]);

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-gold)]">
              Igreja para quem não tem tempo
            </p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-tight text-[var(--color-petrol)] sm:text-5xl">
              Uma pausa diária com a Palavra.
            </h1>
            <p className="mt-5 text-lg text-[var(--color-ink)]/80">
              Ensino bíblico rápido, direto ao ponto — pra quem não tem tempo, mas não
              abre mão da fé. Com o Pastor João Luiz Silva.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/videos"
                className="rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)]"
              >
                Assistir aos vídeos
              </Link>
              <Link
                href="/gratis"
                className="rounded-full border-2 border-[var(--color-petrol)] px-6 py-3 font-semibold text-[var(--color-petrol)] transition hover:bg-[var(--color-petrol)] hover:text-white"
              >
                Baixar e-book grátis
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative h-80 w-80 overflow-hidden rounded-full border-4 border-[var(--color-gold)]/40 shadow-xl sm:h-96 sm:w-96">
              <Image
                src="/pastor.jpg"
                alt="Pastor João Luiz Silva"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="book-divider"><span>❧</span></div>

      {/* AVISO — ÁREA DE MEMBROS EM BREVE */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border-2 border-dashed border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-leather)]">
            Em breve
          </p>
          <p className="font-display mt-1 text-xl font-semibold text-[var(--color-petrol)]">
            Área de Membros com Culto e Escola Dominical ao vivo
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink)]/75">
            Estamos preparando um espaço só para nossa comunidade se reunir aos domingos,
            direto aqui no site. Fique de olho!
          </p>
        </div>
      </section>

      {/* ANÚNCIOS DINÂMICOS — lives e campanhas */}
      {announcements && announcements.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-petrol)]">
            Ao vivo e em campanha
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {announcements.map((item) => (
              <a
                key={item.id}
                href={item.link_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] p-5 shadow-sm transition hover:shadow-md"
              >
                <span className="inline-block rounded-full bg-[var(--color-gold)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-leather)]">
                  {item.type === "live" ? "Ao vivo" : item.type === "campanha" ? "Campanha" : "Aviso"}
                </span>
                <h3 className="font-display mt-3 text-lg font-semibold text-[var(--color-petrol)]">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-2 text-sm text-[var(--color-ink)]/75">{item.description}</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* VÍDEOS RECENTES */}
      {videos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-petrol)]">
              Últimos ensinos
            </h2>
            <Link href="/videos" className="text-sm font-semibold text-[var(--color-petrol)] hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <p className="p-4 text-sm font-medium text-[var(--color-ink)]">{video.title}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="book-divider"><span>❧</span></div>

      {/* LOJA EM DESTAQUE */}
      {featuredEbooks && featuredEbooks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-petrol)]">
              Aprofunde-se com nossos e-books
            </h2>
            <Link href="/loja" className="text-sm font-semibold text-[var(--color-petrol)] hover:underline">
              Ver catálogo →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {featuredEbooks.map((ebook) => (
              <Link
                key={ebook.id}
                href={`/loja/${ebook.slug}`}
                className="overflow-hidden rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[3/4] bg-[var(--color-cream)]">
                  {ebook.cover_image_url && (
                    <Image src={ebook.cover_image_url} alt={ebook.title} fill className="object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-display font-semibold text-[var(--color-petrol)]">{ebook.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-leather)]">
                    {ebook.price_cents === 0 ? "Grátis" : `R$ ${(ebook.price_cents / 100).toFixed(2)}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* COMPARTILHAR */}
      <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
          Ajude essa mensagem a chegar mais longe
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink)]/70">
          Compartilhe o Jesus Ensina com alguém que precisa ouvir isso hoje.
        </p>
        <div className="mt-5">
          <ShareButtons />
        </div>
      </section>

      {/* CTA FINAL — OFERTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-petrol)]">
          Esse trabalho vive de quem acredita nele
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-ink)]/80">
          Se esse ensino tem feito diferença na sua vida, considere fazer uma oferta para
          o projeto continuar alcançando mais gente.
        </p>
        <Link
          href="/oferta"
          className="mt-6 inline-block rounded-full bg-[var(--color-gold)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Fazer uma oferta via Pix
        </Link>
      </section>
    </div>
  );
}
