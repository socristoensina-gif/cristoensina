"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractYoutubeId } from "@/lib/youtube-url";

export interface NewVideoState {
  error?: string;
}

export async function createVideo(
  _prevState: NewVideoState,
  formData: FormData,
): Promise<NewVideoState> {
  const title = formData.get("title")?.toString().trim() ?? "";
  const authorName = formData.get("author_name")?.toString().trim() || null;
  const category = formData.get("category")?.toString() ?? "";
  const videoUrl = formData.get("video_url")?.toString().trim() ?? "";
  const pdfFile = formData.get("pdf") as File | null;

  if (!title || !videoUrl) {
    return { error: "Título e link do vídeo são obrigatórios." };
  }

  const validCategories = ["pregacao", "estudo_biblico", "infantil"];
  if (!validCategories.includes(category)) {
    return { error: "Selecione uma categoria válida." };
  }

  const videoId = extractYoutubeId(videoUrl);
  const admin = createAdminClient();

  let pdfUrl: string | null = null;
  if (pdfFile && pdfFile.size > 0) {
    const pdfPath = `estudos/${Date.now()}-${pdfFile.name}`;
    const { error: pdfError } = await admin.storage
      .from("estudos-pdfs")
      .upload(pdfPath, pdfFile, { contentType: "application/pdf" });

    if (pdfError) {
      return { error: `Falha ao enviar o PDF: ${pdfError.message}` };
    }

    const { data: publicUrl } = admin.storage.from("estudos-pdfs").getPublicUrl(pdfPath);
    pdfUrl = publicUrl.publicUrl;
  }

  const { error: insertError } = await admin.from("videos").insert({
    category,
    title,
    author_name: authorName,
    source_platform: videoId ? "youtube" : "outro",
    video_id: videoId,
    video_url: videoUrl,
    pdf_url: pdfUrl,
    thumbnail_url: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
    is_active: true,
  });

  if (insertError) {
    return { error: `Falha ao cadastrar o vídeo: ${insertError.message}` };
  }

  redirect("/admin/videos");
}
