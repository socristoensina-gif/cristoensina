import Link from "next/link";
import PixQrCode from "@/components/PixQrCode";

export default function OfertaPage() {
  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY ?? "";
  const merchantName = process.env.NEXT_PUBLIC_PIX_MERCHANT_NAME ?? "JESUS ENSINA";
  const merchantCity = process.env.NEXT_PUBLIC_PIX_MERCHANT_CITY ?? "RIO DE JANEIRO";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-gold)]">
          Oferta & Patrocínio
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-[var(--color-petrol)]">
          Seja um Patrocinador do nosso Projeto Evangelístico e ajude a salvar almas!
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-ink)]/75">
          Duas formas de ajudar, sem obrigação — escolha a que fizer sentido pra você.
        </p>
      </div>

      <div className="mt-10 rounded-2xl bg-[var(--color-petrol)] p-8 text-center text-[var(--color-cream-light)]">
        <p className="font-display text-xl font-semibold">Patrocínio Mensal</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-cream-light)]/85">
          A forma que mais sustenta o projeto a longo prazo — um valor fixo todo mês,
          direto no cartão. Cancele quando quiser, sem burocracia.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[5, 10, 20, 50, 100].map((value) => (
            <Link
              key={value}
              href={`/parceiro?valor=${value}`}
              className="rounded-full bg-[var(--color-gold)] px-5 py-2.5 text-sm font-semibold"
            >
              R$ {value}/mês
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-center font-display text-xl font-semibold text-[var(--color-petrol)]">
          Ou faça uma Oferta Única via Pix
        </p>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-[var(--color-ink)]/70">
          Sem cadastro, sem cartão — pague na hora, com o valor que quiser.
        </p>

        {!pixKey ? (
          <p className="mt-6 text-center text-[var(--color-ink)]/70">
            A chave Pix ainda não foi configurada.
          </p>
        ) : (
          <div className="mt-6">
            <PixQrCode pixKey={pixKey} merchantName={merchantName} merchantCity={merchantCity} />
          </div>
        )}
      </div>
    </div>
  );
}
