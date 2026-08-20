import Image from "next/image";
import { getLatestVideos } from "@/lib/youtube";

export const revalidate = 3600;

export default async function VideosPage() {
  const videos = await getLatestVideos(15);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Nossos vídeos
      </h1>
      <p className="mt-2 text-[var(--color-ink)]/75">
        Ensino, pregação e oração — direto do nosso canal no YouTube.
      </p>

      {videos.length === 0 ? (
        <p className="mt-10 text-[var(--color-ink)]/70">
          Nenhum vídeo encontrado no momento. Confira nosso canal diretamente no YouTube.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
}
