import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Chame no topo de TODA página dentro de /admin (Server Component) e no início
 * de TODA Server Action administrativa. Isso é a segunda camada de proteção —
 * o middleware.ts já deveria bloquear o acesso antes de chegar aqui, mas essa
 * checagem não depende do middleware estar funcionando corretamente.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
