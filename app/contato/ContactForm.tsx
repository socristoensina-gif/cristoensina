"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactFormState } from "./actions";

const CATEGORIES = [
  { value: "convite_pregar", label: "Convite para pregar" },
  { value: "pedido_oracao", label: "Pedido de oração" },
  { value: "aconselhamento", label: "Aconselhamento" },
  { value: "oferta_ajuda", label: "Oferta de ajuda / voluntariado" },
  { value: "doacao", label: "Doação" },
  { value: "outro", label: "Outro assunto" },
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const initialState: ContactFormState = { success: false };

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] p-8 text-center">
        <p className="font-display text-xl font-semibold text-[var(--color-petrol)]">
          Mensagem recebida!
        </p>
        <p className="mt-2 text-[var(--color-ink)]/75">
          Vamos ler com atenção e entrar em contato assim que possível.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] px-4 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-petrol)]";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
          Assunto
        </label>
        <select name="category" required className={inputClass}>
          <option value="">Selecione...</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Nome</label>
          <input type="text" name="name" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">E-mail</label>
          <input type="email" name="email" required className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Telefone</label>
          <input type="tel" name="phone" placeholder="(21) 99999-9999" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Cidade</label>
          <input type="text" name="city" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Estado</label>
          <select name="state" className={inputClass}>
            <option value="">--</option>
            {STATES.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
          Sua mensagem
        </label>
        <textarea name="message" required rows={5} className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)] disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
