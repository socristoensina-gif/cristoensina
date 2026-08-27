// supabase/functions/create-order/index.ts
//
// Versão sem gateway de pagamento — cria o pedido no banco e devolve o ID.
// O pagamento em si é feito via Pix direto (QR Code gerado no navegador) e
// confirmado manualmente pelo administrador no painel /admin/pedidos.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const ebookIds: string[] = body.ebook_ids ?? (body.ebook_id ? [body.ebook_id] : []);

    if (!email || ebookIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "email e ao menos 1 ebook_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        contact_id: contact.id,
        status: "pending",
        total_cents: totalCents,
        payment_provider: "pix_manual",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Falha ao criar pedido" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("order_items").insert(
      paidEbooks.map((e) => ({
        order_id: order.id,
        ebook_id: e.id,
        unit_price_cents: e.price_cents,
      })),
    );

    return new Response(
      JSON.stringify({ order_id: order.id, total_cents: totalCents }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
