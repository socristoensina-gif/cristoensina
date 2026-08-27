"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const TIERS = [5, 10, 20, 50, 100];

function ParceiroForm() {
  const searchParams = useSearchParams();
  const valorInicial = Number(searchParams.get("valor")) || 20;

  const [selected, setSelected] = useState<number | null>(
    TIERS.includes(valorInicial) ? valorInicial : null,
  );
  const [customAmount, setCustomAmount] = useState(
    TIERS.includes(valorInicial) ? "" : String(valorInicial),
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

    const effectiveAmount = selected ?? (parseFloat(customAmount.replace(",", ".")) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/stripe-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          amount_cents: Math.round(effectiveAmount * 100),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Algo deu errado. Tente novamente.");
        return;
      }

      window.location.href = data.checkout_url;
    } catch {
      setStatus("error");
      setError("Não foi possível conectar. Verifique sua internet.");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-display text-center text-3xl font-semibold text-[var(--color-petrol)]">
        Seja um Parceiro do Jesus Ensina
      </h1>
      <p className="mt-3 text-center text-[var(--color-ink)]/80">
        Uma contribuição mensal, voluntária, no valor que você escolher. Você pode
        cancelar quando quiser, sem burocracia — não há contrapartida obrigatória,
        só o compromisso de ajudar essa mensagem a continuar chegando em mais gente.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-gold)]">
            Escolha um valor mensal
          </p>
          <div className="flex flex-wrap gap-2">
            {TIERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelected(value);
                  setCustomAmount("");
                }}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold ${
                  selected === value
                    ? "border-[var(--color-petrol)] bg-[var(--color-petrol)] text-white"
                    : "border-[var(--color-gold)]/40 text-[var(--color-ink)]"
                }`}
              >
                R$ {value}/mês
              </button>
            ))}
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ou digite outro valor mensal"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelected(null);
            }}
            className="mt-3 w-full rounded-lg border border-[var(--color-gold)]/40 bg-white px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]"
          />
        </div>

        <input
          type="text"
          placeholder="Seu nome"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-gold)]/40 bg-white px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]"
        />
        <input
          type="email"
          placeholder="Seu e-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-gold)]/40 bg-white px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]"
        />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading" || effectiveAmount < 5}
          className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)] disabled:opacity-60"
        >
          {status === "loading"
            ? "Processando..."
            : `Ser parceiro com R$ ${effectiveAmount > 0 ? effectiveAmount.toFixed(2) : "0,00"}/mês`}
        </button>

        <p className="text-center text-xs text-[var(--color-ink)]/60">
          Cobrança via cartão, processada com segurança pelo Stripe. Você recebe um
          e-mail de confirmação e pode cancelar a qualquer momento pelo link enviado
          nele — sem letras miúdas.
        </p>
      </form>
    </div>
  );
}

export default function ParceiroPage() {
  return (
    <Suspense>
      <ParceiroForm />
    </Suspense>
  );
}
