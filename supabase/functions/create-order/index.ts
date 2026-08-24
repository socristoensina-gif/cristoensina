// supabase/functions/create-order/index.ts
//
// Recebe: { ebook_ids: string[], email, name? }
// Faz: cria/atualiza o contato, cria o pedido (status=pending) + 1 item por e-book,
//      gera um Checkout Redirecionado no PagSeguro com TODOS os itens e devolve o link.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGSEGURO_TOKEN = Deno.env.get("PAGSEGURO_TOKEN")!;
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
    const ebookIds: string[] = body.ebook_ids ?? (body.ebook_id ? [body.ebook_id] : []);

    if (!email || ebookIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "email e ao menos 1 ebook_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Busca todos os e-books de uma vez no banco
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

    // 2. Cria ou atualiza o contato no banco de dados
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

    // 3. Cria o pedido inicial na tabela 'orders' com status 'pending'
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        contact_id: contact.id,
        total_cents: totalCents,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Falha ao gerar pedido no banco" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Vincula os itens do carrinho ao pedido gerado na tabela 'order_items'
    const orderItemsPayload = paidEbooks.map((ebook) => ({
      order_id: order.id,
      ebook_id: ebook.id,
      price_cents: ebook.price_cents,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      return new Response(JSON.stringify({ error: "Falha ao vincular itens ao pedido" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Monta os itens formatados exigidos pela API do PagSeguro v4
    // O PagSeguro pede o valor unitário (unit_amount) em centavos inteiros
    const pagSeguroItems = paidEbooks.map((ebook) => ({
      reference_id: ebook.id,
      name: ebook.title,
      quantity: 1,
      unit_amount: ebook.price_cents,
    }));

    // 6. Faz a chamada HTTP para gerar a sessão de checkout no PagSeguro
    const pagSeguroPayload = {
      reference_id: order.id, // ID do pedido para bater com o webhook depois
      customer: {
        name: name || "Cliente Cristo Ensina",
        email: email,
      },
      items: pagSeguroItems,
      payment_methods: [
        { type: "PIX" },
        { type: "CREDIT_CARD" },
        { type: "BOLETO" }
      ],
      redirect_url: `${SITE_URL}/sucesso?order_id=${order.id}`,
    };

    const pagSeguroRes = await fetch("https://pagseguro.com", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAGSEGURO_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pagSeguroPayload),
    });

    // Nota: Se for usar ambiente de testes, mude a URL acima para: https://pagseguro.com

    const pagSeguroData = await pagSeguroRes.json();

    if (!pagSeguroRes.ok) {
      console.error("Erro PagSeguro:", pagSeguroData);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar link de pagamento no PagSeguro" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Procura o link correto de redirecionamento retornado pelo PagSeguro
    const checkoutUrl = pagSeguroData.links?.find((l: any) => l.rel === "PAY")?.href;

    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ error: "Link de pagamento não retornado pelo provedor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Salva a URL e identificador externo no pedido para controle
    await supabase
      .from("orders")
      .update({ payment_provider_id: pagSeguroData.id })
      .eq("id", order.id);

    // Retorna a URL para o seu front-end (carrinho/page.tsx) fazer o redirecionamento imediato
    return new Response(
      JSON.stringify({ checkout_url: checkoutUrl, order_id: order.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("Erro interno na função:", err);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
