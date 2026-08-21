import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

const CATEGORIES = [
  { value: "pregacao", label: "Pregações", empty: "Nenhuma pregação publicada ainda." },
  { value: "estudo_biblico", label: "Estudos Bíblicos", empty: "Nenhum estudo publicado ainda." },
  { value: "infantil", label: "Infantil", empty: "Nenhum vídeo infantil publicado ainda." },
];

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const activeCategory = categoria && CATEGORIES.some((c) => c.value === categoria)
    ? categoria
    : "pregacao";

  const supabase = await createClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, author_name, video_id, video_url, pdf_url, thumbnail_url, source_platform")
    .eq("category", activeCategory)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const currentLabel = CATEGORIES.find((c) => c.value === activeCategory)!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Vídeos e Estudos
      </h1>
      <p className="mt-2 text-[var(--color-ink)]/75">
        Pregações, estudos bíblicos com material para baixar, e conteúdo para as crianças —
        do nosso canal e de outros pregadores que recomendamos.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/videos?categoria=${c.value}`}
            className={`rounded-full border px-5 py-2 text-sm font-semibold ${
              activeCategory === c.value
                ? "border-[var(--color-petrol)] bg-[var(--color-petrol)] text-white"
                : "border-[var(--color-gold)]/40 text-[var(--color-ink)]"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {!videos || videos.length === 0 ? (
        <p className="mt-12 text-[var(--color-ink)]/70">{currentLabel.empty}</p>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {videos.map((video) => (
            <div
              key={video.id}
              className="overflow-hidden rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] shadow-sm"
            >
              {video.source_platform === "youtube" && video.video_id ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.video_id}`}
                    title={video.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-video bg-[var(--color-cream)]"
                >
                  {video.thumbnail_url && (
                    <Image src={video.thumbnail_url} alt={video.title} fill className="object-cover" />
                  )}
                </a>
              )}

              <div className="p-4">
                <p className="font-display font-semibold text-[var(--color-petrol)]">{video.title}</p>
                {video.author_name && (
                  <p className="mt-1 text-sm text-[var(--color-ink)]/60">{video.author_name}</p>
                )}
                {video.pdf_url && (
                  <a
                    href={video.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-full bg-[var(--color-gold)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Baixar material em PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
