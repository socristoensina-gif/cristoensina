import PixQrCode from "@/components/PixQrCode";

export default function OfertaPage() {
  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY ?? "";
  const merchantName = process.env.NEXT_PUBLIC_PIX_MERCHANT_NAME ?? "JESUS ENSINA";
  const merchantCity = process.env.NEXT_PUBLIC_PIX_MERCHANT_CITY ?? "RIO DE JANEIRO";

  if (!pixKey) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
          Fazer uma Oferta
        </h1>
        <p className="mt-4 text-[var(--color-ink)]/75">
          A chave Pix ainda não foi configurada. Assim que estiver pronta, o QR Code
          aparece automaticamente aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
          Fazer uma Oferta
        </h1>
        <p className="mt-3 text-[var(--color-ink)]/75">
          Esse trabalho vive de quem acredita nele. Toda oferta ajuda a levar a Palavra
          para mais gente que não teria tempo de buscar sozinha.
        </p>
      </div>

      <div className="mt-8">
        <PixQrCode pixKey={pixKey} merchantName={merchantName} merchantCity={merchantCity} />
      </div>
    </div>
  );
}
