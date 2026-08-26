export default async function PagamentoSucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-cream-light)] p-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
          Pagamento realizado!
        </h1>

        <p className="mt-4 text-lg">
          Recebemos o retorno do Stripe.
        </p>

        <p className="mt-2 text-sm opacity-70">
          Estamos confirmando seu pagamento e preparando seu e-book.
        </p>

        {session_id && (
          <p className="mt-6 break-all text-xs opacity-50">
            Sessão: {session_id}
          </p>
        )}
      </div>
    </main>
  )
}