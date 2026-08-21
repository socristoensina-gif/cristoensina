"use client";

import { useActionState } from "react";
import { createVideo, type NewVideoState } from "./actions";

const CATEGORIES = [
  { value: "pregacao", label: "Pregação" },
  { value: "estudo_biblico", label: "Estudo Bíblico (com PDF)" },
  { value: "infantil", label: "Infantil" },
];

const initialState: NewVideoState = {};

export default function NewVideoForm() {
  const [state, formAction, isPending] = useActionState(createVideo, initialState);

  const inputClass =
    "w-full rounded-lg border border-[var(--color-gold)]/40 bg-white px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Categoria</label>
        <select name="category" required className={inputClass}>
          <option value="">Selecione...</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Título do vídeo</label>
        <input type="text" name="title" required className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Pregador / Canal original (se não for o seu)
        </label>
        <input type="text" name="author_name" placeholder="Ex: Pr. Fulano de Tal" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Link do YouTube</label>
        <input
          type="url"
          name="video_url"
          required
          placeholder="https://youtube.com/watch?v=..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          PDF de estudo (opcional — usado na categoria "Estudo Bíblico")
        </label>
        <input type="file" name="pdf" accept="application/pdf" className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)] disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Adicionar ao catálogo"}
      </button>
    </form>
  );
}
