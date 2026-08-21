"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleVideoActive(formData: FormData) {
  const id = formData.get("id")?.toString();
  const currentActive = formData.get("currentActive")?.toString() === "true";
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("videos").update({ is_active: !currentActive }).eq("id", id);

  revalidatePath("/admin/videos");
  revalidatePath("/videos");
}
