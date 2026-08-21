"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { generatePixPayload } from "@/lib/pix";

interface Props {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
}

const SUGGESTED_AMOUNTS = [10, 25, 50, 100];

export default function PixQrCode({ pixKey, merchantName, merchantCity }: Props) {
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [payload, setPayload] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const effectiveAmount = useCustom
    ? parseFloat(customAmount.replace(",", ".")) || undefined
    : (amount ?? undefined);

  useEffect(() => {
    const pixPayload = generatePixPayload({
      pixKey,
      merchantName,
      merchantCity,
      amount: effectiveAmount,
      description: "Oferta Jesus Ensina",
    });
    setPayload(pixPayload);
    QRCode.toDataURL(pixPayload, { width: 280, margin: 1 }).then(setQrDataUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAmount, pixKey, merchantName, merchantCity]);

  async function handleCopy() {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] p-6 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-gold)]">
        Valor da oferta (opcional)
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {SUGGESTED_AMOUNTS.map((value) => (
          <button
            key={value}
            onClick={() => {
              setAmount(value);
              setUseCustom(false);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              !useCustom && amount === value
                ? "border-[var(--color-petrol)] bg-[var(--color-petrol)] text-white"
                : "border-[var(--color-gold)]/40 text-[var(--color-ink)]"
            }`}
          >
            R$ {value}
          </button>
        ))}
        <button
          onClick={() => {
            setAmount(null);
            setUseCustom(false);
          }}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
            !useCustom && amount === null
              ? "border-[var(--color-petrol)] bg-[var(--color-petrol)] text-white"
              : "border-[var(--color-gold)]/40 text-[var(--color-ink)]"
          }`}
        >
          Sem valor definido
        </button>
      </div>

      <div className="mt-3">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Ou digite outro valor (ex: 37,50)"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setUseCustom(true);
          }}
          onFocus={() => setUseCustom(true)}
          className="w-full rounded-lg border border-[var(--color-gold)]/40 bg-white px-4 py-2 text-center outline-none focus:border-[var(--color-petrol)]"
        />
      </div>

      <p className="mt-2 text-xs text-[var(--color-ink)]/60">
        "Sem valor definido" gera um QR Code onde você digita o valor direto no app do
        seu banco na hora de pagar.
      </p>

      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrDataUrl}
          alt="QR Code Pix para oferta"
          className="mx-auto mt-6 rounded-xl border border-[var(--color-gold)]/30"
          width={280}
          height={280}
        />
      )}

      <button
        onClick={handleCopy}
        className="mt-5 w-full rounded-full bg-[var(--color-petrol)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-petrol-dark)]"
      >
        {copied ? "Código copiado!" : "Copiar código Pix"}
      </button>

      <p className="mt-3 text-xs text-[var(--color-ink)]/60">
        Abra o app do seu banco, escolha "Pix Copia e Cola" ou aponte a câmera para o
        QR Code acima.
      </p>
    </div>
  );
}
