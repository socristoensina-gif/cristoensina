"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function toggleStatus(formData: FormData) {
  await requireAdmin(); // trava real — sem sessão válida, a ação para aqui, mesmo se chamada diretamente

  const id = formData.get("id")?.toString();
  const currentStatus = formData.get("currentStatus")?.toString();
  if (!id) return;

  const newStatus = currentStatus === "published" ? "draft" : "published";

  const admin = createAdminClient();
  await admin.from("ebooks").update({ status: newStatus }).eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/loja");
}
