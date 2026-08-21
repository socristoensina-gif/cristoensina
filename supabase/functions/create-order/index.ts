// supabase/functions/create-order/index.ts
//
// Recebe: { ebook_ids: string[], email, name? }  (compatível também com o formato antigo { ebook_id })
// Faz: cria/atualiza o contato, cria o pedido (status=pending) + 1 item por e-book,
//      gera uma preferência de checkout no Mercado Pago com TODOS os itens e devolve o link.

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
    const body = await req.json();
    const email: string = body.email;
    const name: string | undefined = body.name;
    // aceita tanto o formato novo (carrinho) quanto o antigo (1 e-book só), para não quebrar nada
    const ebookIds: string[] = body.ebook_ids ?? (body.ebook_id ? [body.ebook_id] : []);

    if (!email || ebookIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "email e ao menos 1 ebook_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Busca todos os e-books de uma vez (garante que existem, publicados, com preço real do banco)
    const { data: ebooks, error: ebooksError } = await supabase
      .from("ebooks")
      .select("id, title, price_cents, status")
      .in("id", ebookIds)
      .eq("status", "published");

    if (ebooksError || !ebooks || ebooks.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum e-book válido encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paidEbooks = ebooks.filter((e) => e.price_cents > 0);
    if (paidEbooks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Os itens selecionados são gratuitos, use a função capture-lead" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const totalCents = paidEbooks.reduce((sum, e) => sum + e.price_cents, 0);

    // 2. Cria ou atualiza o contato
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .upsert(
        { email, name: name ?? null, source: "checkout-carrinho" },
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

    // 3. Cria o pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        contact_id: contact.id,
        status: "pending",
        total_cents: totalCents,
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

    // 4. Cria 1 item do pedido por e-book pago
    await supabase.from("order_items").insert(
      paidEbooks.map((e) => ({
        order_id: order.id,
        ebook_id: e.id,
        unit_price_cents: e.price_cents,
      })),
    );

    // 5. Cria a preferência de checkout no Mercado Pago, com todos os itens
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: paidEbooks.map((e) => ({
          title: `${e.title} — Oferta para o Projeto Jesus Ensina`,
          quantity: 1,
          unit_price: e.price_cents / 100,
          currency_id: "BRL",
        })),
        payer: { email },
        external_reference: order.id,
        back_urls: {
          success: `${SITE_URL}/obrigado?order=${order.id}`,
          failure: `${SITE_URL}/carrinho?erro=pagamento`,
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

    await supabase.from("orders").update({ payment_provider_id: mpData.id }).eq("id", order.id);

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
