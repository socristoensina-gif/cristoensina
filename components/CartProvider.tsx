"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  ebook_id: string;
  slug: string;
  title: string;
  price_cents: number;
  cover_image_url?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (ebookId: string) => void;
  clearCart: () => void;
  total_cents: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "jesus-ensina-carrinho";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // dado corrompido no localStorage — ignora e começa com carrinho vazio
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      if (prev.some((i) => i.ebook_id === item.ebook_id)) return prev; // já está no carrinho
      return [...prev, item];
    });
  }

  function removeItem(ebookId: string) {
    setItems((prev) => prev.filter((i) => i.ebook_id !== ebookId));
  }

  function clearCart() {
    setItems([]);
  }

  const total_cents = items.reduce((sum, i) => sum + i.price_cents, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total_cents }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de um CartProvider");
  return ctx;
}
