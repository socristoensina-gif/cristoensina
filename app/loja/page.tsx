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

  let query = supabase
    .from("ebooks")
    .select("id, slug, title, cover_image_url, price_cents, theme_id")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const { data: ebooks } = await query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-[var(--color-petrol)] sm:text-3xl">
        E-books
      </h1>


      {!ebooks || ebooks.length === 0 ? (
        <p className="mt-12 text-[var(--color-ink)]/70">
          Nenhum e-book publicado ainda neste filtro. Volte em breve.
        </p>
      ) : (
        // Grade só de capas — sem sinopse, sem descrição. O clique é que leva ao detalhe.
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ebooks.map((ebook) => (
            <Link key={ebook.id} href={`/loja/${ebook.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--color-cream-light)] shadow-sm transition group-hover:shadow-lg">
                {ebook.cover_image_url && (
                  <Image
                    src={ebook.cover_image_url}
                    alt={ebook.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="text-xs font-semibold text-white">
                    {ebook.price_cents === 0 ? "Grátis" : `R$ ${(ebook.price_cents / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
