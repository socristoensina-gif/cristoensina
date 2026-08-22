import NewVideoForm from "./NewVideoForm";
import { requireAdmin } from "@/lib/auth-admin";

export default async function NovoVideoPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Novo Vídeo no Catálogo
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink)]/70">
        Cole o link de qualquer vídeo público do YouTube — seu ou de outro pregador/canal.
        O vídeo será exibido incorporado direto no site, na categoria escolhida.
      </p>
      <div className="mt-8">
        <NewVideoForm />
      </div>
    </div>
  );
}
