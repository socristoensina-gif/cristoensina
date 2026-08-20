// supabase/functions/confirm-payment/index.ts
//
// Webhook chamado pelo Mercado Pago quando o status de um pagamento muda.
// Fluxo: valida a notificação -> confirma o status real na API do MP (nunca confiar
// só no corpo do webhook) -> marca o pedido como pago -> gera o token de download
// -> envia o e-mail de entrega via Resend.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://jesusensina.com.br";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "contato@jesusensina.com.br";

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);

    // O Mercado Pago manda o id do pagamento tanto na query string quanto no corpo,
    // dependendo do tipo de notificação (webhook v2 x IPN antigo) — checamos os dois.
    const paymentId =
      body?.data?.id ?? url.searchParams.get("id") ?? url.searchParams.get("data.id");

    const topic = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

    if (!paymentId || topic !== "payment") {
      // Notificação que não é sobre pagamento (ex: teste do MP) — só confirma recebimento
      return new Response("ok", { status: 200 });
    }

    // 1. Busca o status REAL do pagamento direto na API do Mercado Pago
    //    (nunca confiar cegamente no conteúdo do webhook — ele pode ser forjado)
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();

    if (!mpRes.ok || !payment?.external_reference) {
      return new Response("payment not found", { status: 200 }); // 200 evita reenvio infinito do MP
    }

    const orderId = payment.external_reference;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 2. Idempotência: se esse pedido já está pago, não processa de novo
    //    (o índice único em payment_provider_id no banco também protege contra isso)
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, contact_id")
      .eq("id", orderId)
      .single();

    if (!order || order.status === "paid") {
      return new Response("ok", { status: 200 });
    }

    if (payment.status !== "approved") {
      // pagamento ainda pendente, rejeitado etc — não libera nada ainda
      await supabase
        .from("orders")
        .update({ status: payment.status === "rejected" ? "failed" : "pending" })
        .eq("id", orderId);
      return new Response("ok", { status: 200 });
    }

    // 3. Marca como pago
    await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId);

    // 4. Busca os itens do pedido (pode ser mais de 1 e-book no futuro)
    const { data: items } = await supabase
      .from("order_items")
      .select("ebook_id, ebooks(title, file_path)")
      .eq("order_id", orderId);

    const { data: contact } = await supabase
      .from("contacts")
      .select("email, name")
      .eq("id", order.contact_id)
      .single();

    if (!items || !contact) return new Response("ok", { status: 200 });

    // 5. Gera 1 token de download por e-book comprado + monta os links do e-mail
    const linksHtml: string[] = [];

    for (const item of items) {
      const { data: download } = await supabase
        .from("downloads")
        .insert({
          contact_id: order.contact_id,
          ebook_id: item.ebook_id,
          order_id: orderId,
        })
        .select("token")
        .single();

      if (download) {
        const ebookTitle = (item as any).ebooks?.title ?? "seu e-book";
        linksHtml.push(
          `<li><a href="${SITE_URL}/download/${download.token}">${ebookTitle}</a></li>`,
        );
      }

      // registra o evento no histórico do contato
      await supabase.from("contact_events").insert({
        contact_id: order.contact_id,
        event_type: "purchase",
        ebook_id: item.ebook_id,
        metadata: { order_id: orderId },
      });
    }

    // 6. Envia o e-mail de entrega via Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Jesus Ensina <${FROM_EMAIL}>`,
        to: contact.email,
        subject: "Sua oferta foi confirmada — aqui está seu material",
        html: `
          <p>Que a paz do Senhor esteja com você${contact.name ? ", " + contact.name : ""}!</p>
          <p>Recebemos sua oferta para o projeto e seu material já está liberado:</p>
          <ul>${linksHtml.join("")}</ul>
          <p>O link fica disponível por 7 dias. Se tiver qualquer dificuldade, é só responder este e-mail.</p>
          <p>Isso foi Jesus Ensina. Guarde esse aprendizado — e se ele te ajudou, ensine para alguém também.</p>
        `,
      }),
    });

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    // Sempre 200 para o Mercado Pago não ficar reenviando o mesmo webhook indefinidamente
    return new Response("erro processado", { status: 200 });
  }
});
