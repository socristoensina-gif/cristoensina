"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-admin";

export interface NewEquipmentState {
  error?: string;
}

export async function createEquipmentNeed(
  _prevState: NewEquipmentState,
  formData: FormData,
): Promise<NewEquipmentState> {
  await requireAdmin();

  const item_name = formData.get("item_name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() || null;
  const priority = formData.get("priority")?.toString() ?? "media";

  if (!item_name) {
    return { error: "Nome do item é obrigatório." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("equipment_needs").insert({
    item_name,
    description,
    priority,
    is_active: true,
  });

  if (error) {
    return { error: `Falha ao cadastrar: ${error.message}` };
  }

  redirect("/admin/equipamentos");
}
