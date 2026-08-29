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
      {/* HERO — os 3 caminhos possíveis, todos visíveis sem rolar */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-gold)]">
              Projeto Evangelístico Jesus Ensina — PROEJE
            </p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-tight text-[var(--color-petrol)] sm:text-5xl">
              Uma pausa diária com a Palavra.
            </h1>
            <p className="mt-5 text-lg text-[var(--color-ink)]/80">
              Ensino bíblico rápido, direto ao ponto — pra quem não tem tempo, mas não
              abre mão da fé. Com o Pastor João Luiz Silva.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/videos"
                className="rounded-full bg-[var(--color-petrol)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)]"
              >
                Assistir aos vídeos
              </Link>
              <Link
                href="/loja"
                className="rounded-full border-2 border-[var(--color-petrol)] px-5 py-3 font-semibold text-[var(--color-petrol)] transition hover:bg-[var(--color-petrol)] hover:text-white"
              >
                E-books
              </Link>
              <a
                href="#apoie"
                className="rounded-full bg-[var(--color-gold)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Doações
              </a>
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

      {/* BLOCO DE APOIO — âncora do botão "Doações" do hero */}
      <section id="apoie" className="bg-[var(--color-petrol)] py-16 text-[var(--color-cream-light)]">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-gold)]">
            Pregar o Evangelho custa dinheiro. E tudo bem falar disso.
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold sm:text-4xl">
            Seja um Patrocinador do nosso Projeto Evangelístico e ajude a salvar almas!
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--color-cream-light)]/85">
            Cada vídeo, cada e-book, cada estudo que chega até você tem um custo real.
            Você pode contribuir de duas formas — sem obrigação, sem cobrança, só quem
            quiser e puder:
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-6">
              <p className="font-display text-lg font-semibold">Patrocínio mensal</p>
              <p className="mt-1 text-sm text-[var(--color-cream-light)]/80">
                Um valor fixo todo mês, no cartão. Cancele quando quiser.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[5, 10, 20, 50, 100].map((value) => (
                  <Link
                    key={value}
                    href={`/parceiro?valor=${value}`}
                    className="rounded-full bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold"
                  >
                    R$ {value}
                  </Link>
                ))}
              </div>
              <Link href="/parceiro" className="mt-4 inline-block text-sm underline underline-offset-4">
                Ver todos os planos →
              </Link>
            </div>

            <div className="rounded-2xl bg-white/10 p-6">
              <p className="font-display text-lg font-semibold">Oferta única via Pix</p>
              <p className="mt-1 text-sm text-[var(--color-cream-light)]/80">
                Um valor avulso, na hora, sem cadastro nem cartão.
              </p>
              <Link
                href="/oferta"
                className="mt-6 inline-block rounded-full border-2 border-white px-6 py-2.5 text-sm font-semibold"
              >
                Fazer oferta via Pix
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPAMENTOS */}
      <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-[var(--color-petrol)]">
          Estamos montando nosso estúdio para fazer lives
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-ink)]/80">
          Microfone, placa de captura, iluminação, equipamento de gravação — cada peça
          nos aproxima de transmitir ao vivo e atender a comunidade em tempo real.
        </p>
        <Link
          href="/equipamentos"
          className="mt-6 inline-block rounded-full border-2 border-[var(--color-petrol)] px-6 py-3 font-semibold text-[var(--color-petrol)] transition hover:bg-[var(--color-petrol)] hover:text-white"
        >
          Ver o que precisamos
        </Link>
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

      {featuredEbooks && featuredEbooks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-petrol)]">
              E-books
            </h2>
            <Link href="/loja" className="text-sm font-semibold text-[var(--color-petrol)] hover:underline">
              Ver catálogo →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {featuredEbooks.map((ebook) => (
              <Link key={ebook.id} href={`/loja/${ebook.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--color-cream-light)] shadow-sm transition group-hover:shadow-lg">
                  {ebook.cover_image_url && (
                    <Image src={ebook.cover_image_url} alt={ebook.title} fill className="object-cover transition group-hover:scale-105" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h2 className="font-display text-xl font-semibold text-[var(--color-petrol)]">
          Ajude essa mensagem a chegar mais longe
        </h2>
        <div className="mt-5">
          <ShareButtons />
        </div>
      </section>
    </div>
  );
}
