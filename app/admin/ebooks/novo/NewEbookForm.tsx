"use client";

import { useActionState } from "react";
import { createEbook, type NewEbookState } from "./actions";

const initialState: NewEbookState = {};

export default function NewEbookForm() {
  const [state, formAction, isPending] = useActionState(createEbook, initialState);

  const inputClass =
    "w-full rounded-lg border border-[var(--color-gold)]/40 bg-white px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Título</label>
        <input type="text" name="title" required className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tema (opcional — cria automaticamente se for novo)</label>
        <input type="text" name="theme" placeholder="Ex: Perdão dentro de casa" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descrição</label>
        <textarea name="description" rows={4} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Preço em R$ (0 para gratuito)
          </label>
          <input type="text" name="price" defaultValue="10,00" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Número de páginas</label>
          <input type="number" name="page_count" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Arquivo PDF do e-book</label>
        <input type="file" name="pdf" accept="application/pdf" required className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Capa (imagem)</label>
        <input type="file" name="cover" accept="image/*" className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)] disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Publicar e-book"}
      </button>
    </form>
  );
}
