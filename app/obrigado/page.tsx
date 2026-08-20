export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; status?: string }>;
}) {
  const { status } = await searchParams;
  const isPending = status === "pendente";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        {isPending ? "Pagamento em análise" : "Que Deus abençoe sua oferta!"}
      </h1>
      <p className="mt-4 text-[var(--color-ink)]/75">
        {isPending
          ? "Assim que a confirmação chegar, enviaremos o material para o seu e-mail."
          : "Assim que a confirmação do pagamento chegar (geralmente em poucos minutos), enviaremos o link de download para o seu e-mail."}
      </p>
      <p className="mt-6 text-sm text-[var(--color-ink)]/60">
        Isso foi Jesus Ensina. Guarde esse aprendizado — e se ele te ajudou, ensine para
        alguém também.
      </p>
    </div>
  );
}
