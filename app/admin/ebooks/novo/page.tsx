import NewEbookForm from "./NewEbookForm";

export default function NovoEbookPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Novo E-book
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]/70">
        Depois de publicar, o link para colar na descrição do vídeo do YouTube é:
        <br />
        <code className="text-[var(--color-leather)]">jesusensina.com.br/loja/[slug-gerado-do-titulo]</code>
      </p>
      <div className="mt-8">
        <NewEbookForm />
      </div>
    </div>
  );
}
