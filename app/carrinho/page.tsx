"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function CarrinhoPage() {
  const { items, removeItem, total_cents } = useCart();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-asaas-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          ebook_ids: items.map((i) => i.ebook_id),
          email,
          name,
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
      setError("Não foi possível conectar. Verifique sua internet e tente de novo.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
          Seu carrinho está vazio
        </h1>
        <Link
          href="/loja"
          className="mt-6 inline-block rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white"
        >
          Ver e-books
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Seu carrinho
      </h1>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.ebook_id}
            className="flex items-center gap-4 rounded-xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] p-4"
          >
            <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-cream)]">
              {item.cover_image_url && (
                <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-[var(--color-petrol)]">{item.title}</p>
              <p className="text-sm text-[var(--color-leather)]">
                R$ {(item.price_cents / 100).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => removeItem(item.ebook_id)}
              className="text-sm text-red-700 hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[var(--color-gold)]/30 pt-4">
        <span className="font-display text-lg font-semibold text-[var(--color-petrol)]">Total</span>
        <span className="font-display text-lg font-semibold text-[var(--color-petrol)]">
          R$ {(total_cents / 100).toFixed(2)}
        </span>
      </div>

      <form onSubmit={handleCheckout} className="mt-8 space-y-3">
        <input
          type="text"
          placeholder="Seu nome"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]"
        />
        <input
          type="email"
          placeholder="Seu e-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] px-4 py-2.5 outline-none focus:border-[var(--color-petrol)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)] disabled:opacity-60"
        >
          {status === "loading" ? "Processando..." : "Finalizar oferta e pagar"}
        </button>
        {status === "error" && <p className="text-sm text-red-700">{error}</p>}
      </form>
    </div>
  );
}
