"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "jesus-ensina-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "aceito");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--color-gold)]/40 bg-[var(--color-petrol)] px-4 py-4 text-[var(--color-cream-light)] sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm">
          Usamos cookies essenciais para o funcionamento do site e do carrinho de compras.
          Saiba mais na nossa{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="whitespace-nowrap rounded-full bg-[var(--color-gold)] px-5 py-2 text-sm font-semibold text-white"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
