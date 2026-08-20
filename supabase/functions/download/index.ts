// supabase/functions/download/index.ts
//
// Chamada como: GET /functions/v1/download?token=xxxxx
// Valida o token (existe, não expirou, não passou do limite de downloads),
// gera uma Signed URL temporária do Supabase Storage (bucket privado) e redireciona.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Link inválido.", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: download, error } = await supabase
      .from("downloads")
      .select("id, ebook_id, expires_at, download_count, max_downloads, ebooks(file_path, title)")
      .eq("token", token)
      .single();

    if (error || !download) {
      return new Response("Link não encontrado ou inválido.", { status: 404 });
    }

    if (new Date(download.expires_at) < new Date()) {
      return new Response(
        "Este link expirou (validade de 7 dias). Entre em contato para receber um novo.",
        { status: 410 },
      );
    }

    if (download.download_count >= download.max_downloads) {
      return new Response(
        "Limite de downloads atingido para este link. Entre em contato para receber um novo.",
        { status: 429 },
      );
    }

    const filePath = (download as any).ebooks?.file_path;
    if (!filePath) {
      return new Response("Arquivo não encontrado.", { status: 404 });
    }

    // Gera um link assinado do bucket privado, válido por 5 minutos
    // (tempo suficiente para o navegador iniciar o download)
    const { data: signed, error: signError } = await supabase.storage
      .from("ebooks-files")
      .createSignedUrl(filePath, 300);

    if (signError || !signed) {
      return new Response("Falha ao gerar o link de download.", { status: 500 });
    }

    // Incrementa o contador de downloads
    await supabase
      .from("downloads")
      .update({ download_count: download.download_count + 1 })
      .eq("id", download.id);

    // Redireciona direto para o arquivo
    return Response.redirect(signed.signedUrl, 302);
  } catch (err) {
    console.error(err);
    return new Response("Erro inesperado ao processar o download.", { status: 500 });
  }
});
