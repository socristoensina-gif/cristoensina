import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGSEGURO_TOKEN = Deno.env.get("PAGSEGURO_TOKEN")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.jesusensina.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Método não permitido" },
      405,
    );
  }

  try {
    if (!PAGSEGURO_TOKEN) {
      console.error("PAGSEGURO_TOKEN não configurado");

      return jsonResponse(
        { error: "Gateway de pagamento não configurado" },
        500,
      );
    }

    const body = await req.json();

    const email = String(body.email ?? "").trim();
    const name = body.name
      ? String(body.name).trim()
      : null;

    const ebookIds: string[] = Array.isArray(body.ebook_ids)
      ? body.ebook_ids
      : body.ebook_id
        ? [String(body.ebook_id)]
        : [];

    if (!email || ebookIds.length === 0) {
      return jsonResponse(
        {
          error:
            "E-mail e ao menos 1 e-book são obrigatórios.",
        },
        400,
      );
    }

    const supabase = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
    );

    // ============================================================
    // 1. BUSCAR E-BOOKS PUBLICADOS
    // ============================================================

    const { data: ebooks, error: ebooksError } =
      await supabase
        .from("ebooks")
        .select(
          "id, title, price_cents, status",
        )
        .in("id", ebookIds)
        .eq("status", "published");

    if (ebooksError) {
      console.error(
        "Erro ao buscar ebooks:",
        ebooksError,
      );

      return jsonResponse(
        { error: "Erro ao consultar os e-books." },
        500,
      );
    }

    if (!ebooks || ebooks.length === 0) {
      return jsonResponse(
        {
          error:
            "Nenhum e-book válido encontrado.",
        },
        404,
      );
    }

    // ============================================================
    // 2. SOMENTE E-BOOKS PAGOS
    // ============================================================

    const paidEbooks = ebooks.filter(
      (ebook) =>
        Number(ebook.price_cents) > 0,
    );

    if (paidEbooks.length === 0) {
      return jsonResponse(
        {
          error:
            "Os itens selecionados são gratuitos. Utilize o fluxo de material grátis.",
        },
        400,
      );
    }

    const totalCents = paidEbooks.reduce(
      (total, ebook) =>
        total + Number(ebook.price_cents),
      0,
    );

    // ============================================================
    // 3. CRIAR / ATUALIZAR CONTATO
    // ============================================================

    const { data: contact, error: contactError } =
      await supabase
        .from("contacts")
        .upsert(
          {
            email,
            name,
            source: "checkout-pagbank",
          },
          {
            onConflict: "email",
            ignoreDuplicates: false,
          },
        )
        .select("id")
        .single();

    if (contactError || !contact) {
      console.error(
        "Erro ao criar contato:",
        contactError,
      );

      return jsonResponse(
        {
          error:
            "Falha ao registrar os dados do comprador.",
        },
        500,
      );
    }

    // ============================================================
    // 4. CRIAR PEDIDO LOCAL
    // ============================================================

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .insert({
          contact_id: contact.id,
          status: "pending",
          total_cents: totalCents,
          payment_provider: "pagbank",
        })
        .select("id")
        .single();

    if (orderError || !order) {
      console.error(
        "Erro ao criar pedido:",
        orderError,
      );

      return jsonResponse(
        {
          error:
            "Falha ao criar o pedido.",
        },
        500,
      );
    }

    // ============================================================
    // 5. CRIAR ITENS DO PEDIDO
    // ============================================================

    const orderItems = paidEbooks.map(
      (ebook) => ({
        order_id: order.id,
        ebook_id: ebook.id,
        unit_price_cents:
          Number(ebook.price_cents),
      }),
    );

    const {
      error: orderItemsError,
    } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error(
        "Erro ao criar itens do pedido:",
        orderItemsError,
      );

      // Evita deixar pedido órfão.
      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      return jsonResponse(
        {
          error:
            "Falha ao registrar os itens do pedido.",
        },
        500,
      );
    }

    // ============================================================
    // 6. CRIAR CHECKOUT PAGBANK
    // ============================================================

    const checkoutPayload = {
      reference_id: order.id,

      items: paidEbooks.map(
        (ebook) => ({
          name: ebook.title,
          quantity: 1,
          unit_amount:
            Number(ebook.price_cents),
        }),
      ),

      customer_modifiable: true,

      redirect_url:
        `${SITE_URL}/obrigado?order=${order.id}`,

      return_url:
        `${SITE_URL}/carrinho`,

      notification_urls: [
        `${SUPABASE_URL}/functions/v1/confirm-payment`,
      ],

      payment_notification_urls: [
        `${SUPABASE_URL}/functions/v1/confirm-payment`,
      ],
    };

    console.log(
      "Criando checkout PagBank para pedido:",
      order.id,
    );

    const pagbankResponse = await fetch(
      "https://api.pagseguro.com/checkouts",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${PAGSEGURO_TOKEN}`,
          "Content-Type":
            "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify(
          checkoutPayload,
        ),
      },
    );

    const pagbankData =
      await pagbankResponse.json();

    console.log(
      "Resposta PagBank:",
      JSON.stringify(
        pagbankData,
      ),
    );

    if (!pagbankResponse.ok) {
      console.error(
        "Erro PagBank:",
        pagbankData,
      );

      return jsonResponse(
        {
          error:
            "Falha ao criar checkout no PagBank.",
          details: pagbankData,
          order_id: order.id,
        },
        502,
      );
    }

    // ============================================================
    // 7. ENCONTRAR LINK PAY
    // ============================================================

    const payLink =
      Array.isArray(pagbankData.links)
        ? pagbankData.links.find(
            (link: {
              rel?: string;
              href?: string;
            }) =>
              link.rel === "PAY" &&
              typeof link.href ===
                "string",
          )
        : null;

    if (!payLink?.href) {
      console.error(
        "PagBank não retornou link PAY:",
        pagbankData,
      );

      return jsonResponse(
        {
          error:
            "PagBank não retornou o link de pagamento.",
          details: pagbankData,
          order_id: order.id,
        },
        502,
      );
    }

    // ============================================================
    // 8. SALVAR ID DO CHECKOUT
    // ============================================================

    await supabase
      .from("orders")
      .update({
        payment_provider_id:
          pagbankData.id ?? null,
      })
      .eq("id", order.id);

    // ============================================================
    // 9. DEVOLVER PARA O FRONTEND
    // ============================================================

    return jsonResponse({
      checkout_url: payLink.href,
      order_id: order.id,
      provider: "pagbank",
    });
  } catch (error) {
    console.error(
      "Erro inesperado create-order:",
      error,
    );

    return jsonResponse(
      {
        error:
          "Erro interno ao criar o checkout.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500,
    );
  }
});