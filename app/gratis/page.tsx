import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function GratisPage() {
  const supabase = await createClient();

  const { data: ebooks } = await supabase
    .from("ebooks")
    .select("id, slug, title, cover_image_url, description")
    .eq("status", "published")
    .eq("price_cents", 0)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Materiais Gratuitos
      </h1>
      <p className="mt-2 text-[var(--color-ink)]/75">
        Nosso presente para você — sem custo nenhum, com todo carinho.
      </p>

      {!ebooks || ebooks.length === 0 ? (
        <p className="mt-12 text-[var(--color-ink)]/70">
          Nenhum material gratuito publicado no momento. Volte em breve.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="font-display font-semibold text-[var(--color-petrol)]">{ebook.title}</p>
                {ebook.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-ink)]/70">
                    {ebook.description}
                  </p>
                )}
                <span className="mt-2 inline-block text-sm font-semibold text-[var(--color-gold)]">
                  Baixar grátis →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
