import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  alta: { label: "Prioridade alta", color: "bg-red-100 text-red-800" },
  media: { label: "Prioridade média", color: "bg-[var(--color-gold)]/20 text-[var(--color-leather)]" },
  baixa: { label: "Ajudaria bastante", color: "bg-green-100 text-green-800" },
};

export default async function EquipamentosPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("equipment_needs")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-center text-3xl font-semibold text-[var(--color-petrol)]">
        O que precisamos para montar o estúdio
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-[var(--color-ink)]/80">
        Estamos construindo a estrutura para fazer lives e atender a comunidade em
        tempo real. Se você tem algum desses itens parado em casa, ou quer ajudar a
        comprar um deles, é só entrar em contato — toda ajuda conta, novo ou usado.
      </p>

      {!items || items.length === 0 ? (
        <p className="mt-12 text-center text-[var(--color-ink)]/70">
          Nenhum item cadastrado no momento.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {items.map((item) => {
            const priority = PRIORITY_LABELS[item.priority];
            return (
              <div
                key={item.id}
                className={`rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] p-5 ${
                  item.is_fulfilled ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-[var(--color-petrol)]">
                      {item.item_name}
                      {item.is_fulfilled && (
                        <span className="ml-2 text-sm font-normal text-green-700">
                          ✓ Já conseguimos, obrigado!
                        </span>
                      )}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-[var(--color-ink)]/70">{item.description}</p>
                    )}
                  </div>
                  {!item.is_fulfilled && (
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${priority.color}`}>
                      {priority.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-[var(--color-petrol)] p-6 text-center text-[var(--color-cream-light)]">
        <p className="font-display text-lg font-semibold">Quer doar algum desses itens?</p>
        <p className="mt-2 text-sm text-[var(--color-cream-light)]/85">
          Fale com a gente pelo formulário de contato, categoria "Oferta de ajuda" —
          combinamos os detalhes diretamente com você.
        </p>
        <a
          href="/contato"
          className="mt-4 inline-block rounded-full bg-[var(--color-gold)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Falar sobre uma doação
        </a>
      </div>
    </div>
  );
}
