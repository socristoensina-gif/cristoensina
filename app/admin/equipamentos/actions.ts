"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function toggleFulfilled(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const current = formData.get("currentFulfilled")?.toString() === "true";
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("equipment_needs").update({ is_fulfilled: !current }).eq("id", id);

  revalidatePath("/admin/equipamentos");
  revalidatePath("/equipamentos");
}
