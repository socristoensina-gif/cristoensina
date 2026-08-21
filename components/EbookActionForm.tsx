"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/components/CartProvider";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface Props {
  ebook: CartItem;
  isFree: boolean;
  priceLabel: string;
}

export default function EbookActionForm({ ebook, isFree, priceLabel }: Props) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const alreadyInCart = items.some((i) => i.ebook_id === ebook.ebook_id);

  async function handleFreeDownload(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/capture-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ebook_id: ebook.ebook_id, email, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Algo deu errado. Tente novamente em instantes.");
        return;
      }

      setStatus("done");
      setMessage("Enviamos o link de download para o seu e-mail!");
    } catch {
      setStatus("error");
      setMessage("Não foi possível conectar. Verifique sua internet e tente de novo.");
    }
  }

  function handleAddToCart() {
    addItem(ebook);
    router.push("/carrinho");
  }

  if (isFree) {
    if (status === "done") {
      return (
        <div className="rounded-xl bg-[var(--color-petrol)]/10 p-4 text-[var(--color-petrol)]">
          {message}
        </div>
      );
    }

    return (
      <form onSubmit={handleFreeDownload} className="space-y-3">
        <input
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] px-4 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-petrol)]"
        />
        <input
          type="email"
          required
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-cream-light)] px-4 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-petrol)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)] disabled:opacity-60"
        >
          {status === "loading" ? "Processando..." : "Baixar grátis"}
        </button>
        {status === "error" && <p className="text-sm text-red-700">{message}</p>}
      </form>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      className="w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)]"
    >
      {alreadyInCart ? "Já está no carrinho — ver carrinho" : `Adicionar ao carrinho — ${priceLabel}`}
    </button>
  );
}
