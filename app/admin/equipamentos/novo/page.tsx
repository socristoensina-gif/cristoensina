import EquipmentForm from "./EquipmentForm";
import { requireAdmin } from "@/lib/auth-admin";

export default async function NovoEquipamentoPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-petrol)]">
        Novo Item na Lista de Equipamentos
      </h1>
      <div className="mt-8">
        <EquipmentForm />
      </div>
    </div>
  );
}
