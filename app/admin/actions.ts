"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function toggleStatus(formData: FormData) {
  const id = formData.get("id")?.toString();
  const currentStatus = formData.get("currentStatus")?.toString();
  if (!id) return;

  const newStatus = currentStatus === "published" ? "draft" : "published";

  // usa o client admin (service role) pois a tabela ebooks só permite SELECT público via RLS —
  // escrever exige bypassar a RLS, e essa ação só é alcançável por quem já passou pelo login (middleware)
  const admin = createAdminClient();
  await admin.from("ebooks").update({ status: newStatus }).eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/loja");
}
