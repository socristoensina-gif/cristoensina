import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EbookActionForm from "@/components/EbookActionForm";
import ShareButtons from "@/components/ShareButtons";

export const revalidate = 300;

export default async function EbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: ebook } = await supabase
    .from("ebooks")
    .select("id, slug, title, description, cover_image_url, price_cents, page_count, status")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!ebook) notFound();

  const isFree = ebook.price_cents === 0;
  const priceLabel = isFree ? "Grátis" : `R$ ${(ebook.price_cents / 100).toFixed(2)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[var(--color-cream-light)] shadow-md">
          {ebook.cover_image_url && (
            <Image src={ebook.cover_image_url} alt={ebook.title} fill className="object-cover" />
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
            {ebook.title}
          </h1>
          <p className="mt-2 text-lg font-semibold text-[var(--color-leather)]">{priceLabel}</p>
          {ebook.page_count && (
            <p className="mt-1 text-sm text-[var(--color-ink)]/60">{ebook.page_count} páginas</p>
          )}

          {ebook.description && (
            <p className="mt-4 text-[var(--color-ink)]/85">{ebook.description}</p>
          )}

          <div className="mt-8">
            <EbookActionForm
              ebook={{
                ebook_id: ebook.id,
                slug: ebook.slug,
                title: ebook.title,
                price_cents: ebook.price_cents,
                cover_image_url: ebook.cover_image_url,
              }}
              isFree={isFree}
              priceLabel={priceLabel}
            />
          </div>

          {!isFree && (
            <p className="mt-3 text-xs text-[var(--color-ink)]/60">
              Pagamento processado com segurança via Mercado Pago. O material chega no
              seu e-mail assim que a oferta for confirmada.
            </p>
          )}

          <div className="mt-6">
            <ShareButtons
              url={`https://jesusensina.com.br/loja/${ebook.slug}`}
              text={`Dá uma olhada em "${ebook.title}" no Jesus Ensina:`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
