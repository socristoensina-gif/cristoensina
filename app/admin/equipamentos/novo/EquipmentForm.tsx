"use client";

import { useActionState } from "react";
import { createEquipmentNeed, type NewEquipmentState } from "./actions";

const initialState: NewEquipmentState = {};

export default function EquipmentForm() {
  const [state, formAction, isPending] = useActionState(createEquipmentNeed, initialState);
  const inputClass =
    "w-full rounded-lg border border-[var(--color-gold)]/40 bg-white px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Nome do item</label>
        <input type="text" name="item_name" required placeholder="Ex: Microfone condensador" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Descrição (opcional)</label>
        <textarea name="description" rows={3} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Prioridade</label>
        <select name="priority" className={inputClass} defaultValue="media">
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa (ajudaria bastante)</option>
        </select>
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Salvando..." : "Adicionar à lista"}
      </button>
    </form>
  );
}
