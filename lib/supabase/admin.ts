import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ATENÇÃO: este client usa a chave de serviço (bypassa RLS). Só pode ser importado
// dentro de Server Actions / Route Handlers já protegidos por autenticação —
// nunca em um Client Component, e nunca exposto ao navegador.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
