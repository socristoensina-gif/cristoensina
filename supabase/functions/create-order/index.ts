// supabase/functions/create-order/index.ts
//
// Recebe: { ebook_id, email, name? }
// Faz: cria/atualiza o contato, cria o pedido (status=pending) + item do pedido,
//      gera uma preferência de checkout no Mercado Pago e devolve o link (init_point)
//      para o front-end redirecionar o comprador.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://jesusensina.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ebook_id, email, name } = await req.json();

    if (!ebook_id || !email) {
      return new Response(
        JSON.stringify({ error: "ebook_id e email são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Busca o e-book (garante que existe, está publicado e pega o preço real do banco
    //    — nunca confiar em preço vindo do front-end)
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

    if (ebook.price_cents === 0) {
      return new Response(
        JSON.stringify({ error: "Este e-book é gratuito, use a função capture-lead" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Cria ou atualiza o contato (upsert pelo e-mail)
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .upsert(
        { email, name: name ?? null, source: `checkout-${ebook.id}` },
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

    // 3. Cria o pedido (pending)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        contact_id: contact.id,
        status: "pending",
        total_cents: ebook.price_cents,
        payment_provider: "mercadopago",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Falha ao criar pedido" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Cria o item do pedido
    await supabase.from("order_items").insert({
      order_id: order.id,
      ebook_id: ebook.id,
      unit_price_cents: ebook.price_cents,
    });

    // 5. Cria a preferência de checkout no Mercado Pago (Checkout Pro)
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `${ebook.title} — Oferta para o Projeto Jesus Ensina`,
            quantity: 1,
            unit_price: ebook.price_cents / 100,
            currency_id: "BRL",
          },
        ],
        payer: { email },
        external_reference: order.id,
        back_urls: {
          success: `${SITE_URL}/obrigado?order=${order.id}`,
          failure: `${SITE_URL}/loja/${ebook.id}?erro=pagamento`,
          pending: `${SITE_URL}/obrigado?order=${order.id}&status=pendente`,
        },
        auto_return: "approved",
        notification_url: `${SUPABASE_URL}/functions/v1/confirm-payment`,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Falha ao criar checkout no Mercado Pago", details: mpData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Guarda o ID da preferência para reconciliar depois, se quiser
    await supabase
      .from("orders")
      .update({ payment_provider_id: mpData.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ checkout_url: mpData.init_point, order_id: order.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
