import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-admin";
import { toggleFulfilled } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminEquipamentosPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("equipment_needs")
    .select("id, item_name, priority, is_fulfilled")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
          Lista de Equipamentos
        </h1>
        <Link href="/admin/equipamentos/novo" className="rounded-full bg-[var(--color-petrol)] px-5 py-2.5 text-sm font-semibold text-white">
          + Novo item
        </Link>
      </div>

      <div className="mt-8 divide-y divide-[var(--color-gold)]/20 rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)]">
        {!items || items.length === 0 ? (
          <p className="p-6 text-[var(--color-ink)]/70">Nenhum item cadastrado.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4">
              <p className={item.is_fulfilled ? "text-[var(--color-ink)]/50 line-through" : ""}>{item.item_name}</p>
              <form action={toggleFulfilled}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="currentFulfilled" value={String(item.is_fulfilled)} />
                <button className="rounded-full border border-[var(--color-gold)]/40 px-4 py-1.5 text-sm">
                  {item.is_fulfilled ? "Reabrir" : "Marcar como conseguido"}
                </button>
              </form>
            </div>
          ))
        )}
      </div>
      <Link href="/admin" className="mt-6 inline-block text-sm text-[var(--color-petrol)] hover:underline">← Voltar</Link>
    </div>
  );
}
