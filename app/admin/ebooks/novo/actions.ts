"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface NewEbookState {
  error?: string;
}

export async function createEbook(
  _prevState: NewEbookState,
  formData: FormData,
): Promise<NewEbookState> {
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const priceReais = formData.get("price")?.toString().trim() ?? "0";
  const pageCount = formData.get("page_count")?.toString().trim();
  const themeTitle = formData.get("theme")?.toString().trim();
  const pdfFile = formData.get("pdf") as File | null;
  const coverFile = formData.get("cover") as File | null;

  if (!title || !pdfFile || pdfFile.size === 0) {
    return { error: "Título e arquivo PDF são obrigatórios." };
  }

  const admin = createAdminClient();
  const slug = slugify(title);
  const priceCents = Math.round(parseFloat(priceReais.replace(",", ".")) * 100) || 0;

  // 1. Tema — cria se não existir ainda
  let themeId: string | null = null;
  if (themeTitle) {
    const themeSlug = slugify(themeTitle);
    const { data: existingTheme } = await admin
      .from("themes")
      .select("id")
      .eq("slug", themeSlug)
      .single();

    if (existingTheme) {
      themeId = existingTheme.id;
    } else {
      const { data: newTheme } = await admin
        .from("themes")
        .insert({ slug: themeSlug, title: themeTitle })
        .select("id")
        .single();
      themeId = newTheme?.id ?? null;
    }
  }

  // 2. Upload do PDF (bucket privado)
  const pdfPath = `${slug}/${Date.now()}-${pdfFile.name}`;
  const { error: pdfUploadError } = await admin.storage
    .from("ebooks-files")
    .upload(pdfPath, pdfFile, { contentType: "application/pdf" });

  if (pdfUploadError) {
    return { error: `Falha ao enviar o PDF: ${pdfUploadError.message}` };
  }

  // 3. Upload da capa (bucket público), se enviada
  let coverUrl: string | null = null;
  if (coverFile && coverFile.size > 0) {
    const coverPath = `${slug}/${Date.now()}-${coverFile.name}`;
    const { error: coverUploadError } = await admin.storage
      .from("ebooks-covers")
      .upload(coverPath, coverFile, { contentType: coverFile.type });

    if (!coverUploadError) {
      const { data: publicUrl } = admin.storage.from("ebooks-covers").getPublicUrl(coverPath);
      coverUrl = publicUrl.publicUrl;
    }
  }

  // 4. Cadastra o e-book
  const { error: insertError } = await admin.from("ebooks").insert({
    theme_id: themeId,
    slug,
    title,
    description: description || null,
    cover_image_url: coverUrl,
    file_path: pdfPath,
    page_count: pageCount ? parseInt(pageCount) : null,
    price_cents: priceCents,
      status: "published",
  });

  if (insertError) {
    return { error: `Falha ao cadastrar o e-book: ${insertError.message}` };
  }

  redirect("/admin");
}
