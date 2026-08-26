import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
)!;

const ASAAS_API_KEY = Deno.env.get(
  "ASAAS_API_KEY",
)!;

const ASAAS_URL =
  "https://api-sandbox.asaas.com/v3";

const SITE_URL =
  Deno.env.get("SITE_URL") ??
  "https://www.jesusensina.com.br";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}


Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }


  try {

    if (!ASAAS_API_KEY) {
      return jsonResponse(
        {
          error:
            "ASAAS_API_KEY não configurada",
        },
        500,
      );
    }


    const body =
      await req.json();


    const email =
      String(body.email ?? "")
        .trim();


    const name =
      String(body.name ?? "")
        .trim();


    const ebookIds =
      Array.isArray(body.ebook_ids)
        ? body.ebook_ids
        : body.ebook_id
          ? [String(body.ebook_id)]
          : [];


    if (!email || ebookIds.length === 0) {
      return jsonResponse(
        {
          error:
            "Dados incompletos",
        },
        400,
      );
    }


    const supabase =
      createClient(
        SUPABASE_URL,
        SERVICE_ROLE_KEY,
      );


    const {
      data: ebooks,
      error: ebooksError,
    } =
      await supabase
        .from("ebooks")
        .select(
          "id,title,price_cents,status",
        )
        .in("id", ebookIds)
        .eq(
          "status",
          "published",
        );


    if (ebooksError || !ebooks) {
      return jsonResponse(
        {
          error:
            "Erro buscando ebooks",
        },
        500,
      );
    }


    const paidEbooks =
      ebooks.filter(
        (ebook) =>
          Number(
            ebook.price_cents,
          ) > 0,
      );


    const totalCents =
      paidEbooks.reduce(
        (
          total,
          ebook,
        ) =>
          total +
          Number(
            ebook.price_cents,
          ),
        0,
      );


    const {
      data: contact,
      error: contactError,
    } =
      await supabase
        .from("contacts")
        .upsert(
          {
            email,
            name,
            source:
              "checkout-asaas",
          },
          {
            onConflict:
              "email",
          },
        )
        .select("id")
        .single();


    if (contactError || !contact) {
      return jsonResponse(
        {
          error:
            "Erro criando contato",
        },
        500,
      );
    }


    const {
      data: order,
      error: orderError,
    } =
      await supabase
        .from("orders")
        .insert({
          contact_id:
            contact.id,

          status:
            "pending",

          total_cents:
            totalCents,

          payment_provider:
            "asaas",
        })
        .select("id")
        .single();


    if (orderError || !order) {
      return jsonResponse(
        {
          error:
            "Erro criando pedido",
        },
        500,
      );
    }


    await supabase
      .from("order_items")
      .insert(
        paidEbooks.map(
          (ebook) => ({
            order_id:
              order.id,

            ebook_id:
              ebook.id,

            unit_price_cents:
              Number(
                ebook.price_cents,
              ),
          }),
        ),
      );



    const paymentResponse =
      await fetch(
        `${ASAAS_URL}/payments`,
        {
          method:
            "POST",

          headers:
            {
              "Content-Type":
                "application/json",

              access_token:
                ASAAS_API_KEY,
            },


          body:
            JSON.stringify(
              {
                customer:
                  null,

                billingType:
                  "UNDEFINED",

                value:
                  totalCents / 100,

                description:
                  `Pedido ${order.id}`,

                externalReference:
                  order.id,

                dueDate:
                  new Date()
                    .toISOString()
                    .split("T")[0],
              },
            ),
        },
      );


    const payment =
      await paymentResponse.json();


    console.log(
      "Resposta Asaas:",
      payment,
    );


    if (!paymentResponse.ok) {

      return jsonResponse(
        {
          error:
            "Erro criando cobrança Asaas",

          details:
            payment,
        },
        502,
      );
    }


    await supabase
      .from("orders")
      .update({
        payment_provider_id:
          payment.id,
      })
      .eq(
        "id",
        order.id,
      );


    return jsonResponse(
      {
        checkout_url:
          payment.invoiceUrl,

        order_id:
          order.id,

        provider:
          "asaas",
      },
    );


  } catch(error) {

    console.error(
      error,
    );


    return jsonResponse(
      {
        error:
          "Erro interno",
      },
      500,
    );
  }

});