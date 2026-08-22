import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-admin";
import { toggleVideoActive } from "./actions";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  pregacao: "Pregação",
  estudo_biblico: "Estudo Bíblico",
  infantil: "Infantil",
};

export default async function AdminVideosPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, author_name, category, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
          Catálogo de Vídeos
        </h1>
        <Link
          href="/admin/videos/novo"
          className="rounded-full bg-[var(--color-petrol)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Novo vídeo
        </Link>
      </div>

      <div className="mt-8 divide-y divide-[var(--color-gold)]/20 rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)]">
        {!videos || videos.length === 0 ? (
          <p className="p-6 text-[var(--color-ink)]/70">Nenhum vídeo cadastrado ainda.</p>
        ) : (
          videos.map((video) => (
            <div key={video.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-[var(--color-ink)]">{video.title}</p>
                <p className="text-sm text-[var(--color-ink)]/60">
                  {CATEGORY_LABELS[video.category]}
                  {video.author_name && ` · ${video.author_name}`}
                  {" · "}
                  <span className={video.is_active ? "text-green-700" : "text-[var(--color-leather)]"}>
                    {video.is_active ? "Ativo" : "Oculto"}
                  </span>
                </p>
              </div>
              <form action={toggleVideoActive}>
                <input type="hidden" name="id" value={video.id} />
                <input type="hidden" name="currentActive" value={String(video.is_active)} />
                <button className="rounded-full border border-[var(--color-gold)]/40 px-4 py-1.5 text-sm font-medium hover:border-[var(--color-petrol)]">
                  {video.is_active ? "Ocultar" : "Ativar"}
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      <Link href="/admin" className="mt-6 inline-block text-sm text-[var(--color-petrol)] hover:underline">
        ← Voltar ao painel
      </Link>
    </div>
  );
}
