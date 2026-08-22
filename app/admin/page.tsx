import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-admin";
import { toggleStatus, logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: ebooks } = await supabase
    .from("ebooks")
    .select("id, title, price_cents, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
          Painel Administrativo
        </h1>
        <form action={logout}>
          <button className="text-sm text-[var(--color-ink)]/60 hover:underline">Sair</button>
        </form>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/ebooks/novo"
          className="rounded-full bg-[var(--color-petrol)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Novo e-book
        </Link>
        <Link
          href="/admin/videos"
          className="rounded-full border border-[var(--color-petrol)] px-5 py-2.5 text-sm font-semibold text-[var(--color-petrol)]"
        >
          Catálogo de Vídeos
        </Link>
      </div>

      <div className="mt-8 divide-y divide-[var(--color-gold)]/20 rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)]">
        {!ebooks || ebooks.length === 0 ? (
          <p className="p-6 text-[var(--color-ink)]/70">Nenhum e-book cadastrado ainda.</p>
        ) : (
          ebooks.map((ebook) => (
            <div key={ebook.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-[var(--color-ink)]">{ebook.title}</p>
                <p className="text-sm text-[var(--color-ink)]/60">
                  {ebook.price_cents === 0 ? "Grátis" : `R$ ${(ebook.price_cents / 100).toFixed(2)}`}
                  {" · "}
                  <span
                    className={
                      ebook.status === "published" ? "text-green-700" : "text-[var(--color-leather)]"
                    }
                  >
                    {ebook.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </p>
              </div>
              <form action={toggleStatus}>
                <input type="hidden" name="id" value={ebook.id} />
                <input type="hidden" name="currentStatus" value={ebook.status} />
                <button className="rounded-full border border-[var(--color-gold)]/40 px-4 py-1.5 text-sm font-medium hover:border-[var(--color-petrol)]">
                  {ebook.status === "published" ? "Despublicar" : "Publicar"}
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
