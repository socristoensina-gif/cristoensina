import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string }>;
}) {
  const { tema } = await searchParams;
  const supabase = await createClient();

  const { data: themes } = await supabase.from("themes").select("id, slug, title");

  let query = supabase
    .from("ebooks")
    .select("id, slug, title, cover_image_url, price_cents, theme_id, themes(slug, title)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (tema) {
    const selectedTheme = themes?.find((t) => t.slug === tema);
    if (selectedTheme) query = query.eq("theme_id", selectedTheme.id);
  }

  const { data: ebooks } = await query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Nossos E-books
      </h1>
      <p className="mt-2 text-[var(--color-ink)]/75">
        Alguns materiais gratuitos, outros como oferta para o projeto — R$ 10,00.
      </p>

      {themes && themes.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/loja"
            className={`rounded-full border px-4 py-1.5 text-sm ${
              !tema
                ? "border-[var(--color-petrol)] bg-[var(--color-petrol)] text-white"
                : "border-[var(--color-gold)]/40 text-[var(--color-ink)]"
            }`}
          >
            Todos
          </Link>
          {themes.map((t) => (
            <Link
              key={t.id}
              href={`/loja?tema=${t.slug}`}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                tema === t.slug
                  ? "border-[var(--color-petrol)] bg-[var(--color-petrol)] text-white"
                  : "border-[var(--color-gold)]/40 text-[var(--color-ink)]"
              }`}
            >
              {t.title}
            </Link>
          ))}
        </div>
      )}

      {!ebooks || ebooks.length === 0 ? (
        <p className="mt-12 text-[var(--color-ink)]/70">
          Nenhum e-book publicado ainda neste filtro. Volte em breve.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ebooks.map((ebook) => (
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
                <p className="font-display font-semibold leading-snug text-[var(--color-petrol)]">
                  {ebook.title}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-leather)]">
                  {ebook.price_cents === 0 ? "Grátis" : `R$ ${(ebook.price_cents / 100).toFixed(2)}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
