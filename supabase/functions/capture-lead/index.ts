// supabase/functions/capture-lead/index.ts
//
// Recebe: { ebook_id, email, name?, whatsapp? }
// Faz: cria/atualiza o contato (isso é a lista própria — o ativo mais importante do projeto),
//      gera um token de download para o e-book gratuito, envia por e-mail via Resend.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://jesusensina.com.br";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "contato@jesusensina.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ebook_id, email, name, whatsapp } = await req.json();

    if (!ebook_id || !email) {
      return new Response(JSON.stringify({ error: "ebook_id e email são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select("id, title, price_cents, status")
      .eq("id", ebook_id)
      .eq("status", "published")
      .single();

    if (ebookError || !ebook) {
      return new Response(JSON.stringify({ error: "E-book não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ebook.price_cents > 0) {
      return new Response(
        JSON.stringify({ error: "Este e-book é pago, use a função create-order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cria/atualiza o contato — aqui nasce a lista própria
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .upsert(
        { email, name: name ?? null, whatsapp: whatsapp ?? null, source: `gratis-${ebook.id}` },
        { onConflict: "email", ignoreDuplicates: false },
      )
      .select("id")
      .single();

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: "Falha ao registrar contato" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gera o token de download (sem order_id, é grátis)
    const { data: download, error: downloadError } = await supabase
      .from("downloads")
      .insert({ contact_id: contact.id, ebook_id: ebook.id })
      .select("token")
      .single();

    if (downloadError || !download) {
      return new Response(JSON.stringify({ error: "Falha ao gerar o link de download" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("contact_events").insert({
      contact_id: contact.id,
      event_type: "ebook_download",
      ebook_id: ebook.id,
    });

    const downloadLink = `${SITE_URL}/download/${download.token}`;

    // Envia por e-mail (reforça que o e-mail informado é válido e real)
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Jesus Ensina <${FROM_EMAIL}>`,
        to: email,
        subject: `Seu material gratuito: ${ebook.title}`,
        html: `
          <p>Que a paz do Senhor esteja com você${name ? ", " + name : ""}!</p>
          <p>Aqui está o seu e-book gratuito:</p>
          <p><a href="${downloadLink}">Baixar "${ebook.title}"</a></p>
          <p>O link fica disponível por 7 dias.</p>
          <p>Isso foi Jesus Ensina. Guarde esse aprendizado — e se ele te ajudou, ensine para alguém também.</p>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true, download_url: downloadLink }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
