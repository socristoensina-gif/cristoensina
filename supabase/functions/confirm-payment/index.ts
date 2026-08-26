import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PAGSEGURO_TOKEN =
  Deno.env.get("PAGSEGURO_TOKEN")!;

const PAGBANK_API_URL =
  Deno.env.get("PAGBANK_API_URL") ??
  "https://api.pagseguro.com";

const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY");

const RESEND_FROM =
  Deno.env.get("RESEND_FROM") ??
  "Jesus Ensina <noreply@jesusensina.com.br>";

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
  body: unknown,
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

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Método não permitido" },
      405,
    );
  }

  try {
    if (!PAGSEGURO_TOKEN) {
      console.error(
        "PAGSEGURO_TOKEN não configurado.",
      );

      return jsonResponse(
        {
          error:
            "Gateway de pagamento não configurado.",
        },
        500,
      );
    }

    const body =
      await req.json();

    /*
     * O Checkout PagBank normalmente envia
     * o ID do checkout no campo "id".
     *
     * Mantemos notificationCode para
     * compatibilidade com fluxos antigos.
     */
    const notificationId =
      body?.id ??
      body?.notificationCode;

    /*
     * Se o próprio webhook já trouxer
     * reference_id, podemos aproveitá-lo.
     */
    let referenceId =
      body?.reference_id ??
      body?.referenceId ??
      null;

    let checkoutData: any = body;

    // --------------------------------------------------
    // 1. Consultar checkout no PagBank
    // --------------------------------------------------

    if (
      notificationId &&
      String(notificationId).startsWith("CHEC_")
    ) {
      const checkoutResponse =
        await fetch(
          `${PAGBANK_API_URL}/checkouts/${encodeURIComponent(
            notificationId,
          )}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${PAGSEGURO_TOKEN}`,
              Accept:
                "application/json",
            },
          },
        );

      checkoutData =
        await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        console.error(
          "Falha ao consultar checkout PagBank:",
          checkoutResponse.status,
          checkoutData,
        );

        return jsonResponse(
          {
            error:
              "Falha ao consultar checkout PagBank.",
          },
          502,
        );
      }

      referenceId =
        checkoutData.reference_id ??
        referenceId;
    }

    // --------------------------------------------------
    // 2. Descobrir status do pagamento
    // --------------------------------------------------

    let paymentStatus =
      checkoutData?.status ??
      null;

    /*
     * Alguns payloads de Checkout possuem
     * pagamentos associados.
     */
    if (
      Array.isArray(
        checkoutData?.charges,
      )
    ) {
      const paidCharge =
        checkoutData.charges.find(
          (charge: any) =>
            charge?.status === "PAID",
        );

      if (paidCharge) {
        paymentStatus = "PAID";
      } else if (
        checkoutData.charges.some(
          (charge: any) =>
            charge?.status ===
            "IN_ANALYSIS",
        )
      ) {
        paymentStatus =
          "IN_ANALYSIS";
      }
    }

    console.log(
      "Webhook PagBank:",
      {
        notificationId,
        referenceId,
        paymentStatus,
      },
    );

    if (!referenceId) {
      return jsonResponse(
        {
          error:
            "Não foi possível identificar o pedido.",
        },
        400,
      );
    }

    // --------------------------------------------------
    // 3. Somente PAID libera o pedido
    // --------------------------------------------------

    if (paymentStatus !== "PAID") {
      return jsonResponse({
        received: true,
        paid: false,
        status: paymentStatus,
        reference_id: referenceId,
      });
    }

    const supabase =
      createClient(
        SUPABASE_URL,
        SERVICE_ROLE_KEY,
      );

    // --------------------------------------------------
    // 4. Buscar pedido
    // --------------------------------------------------

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select(
        `
          id,
          contact_id,
          status,
          total_cents,
          contacts (
            id,
            email,
            name
          )
        `,
      )
      .eq("id", referenceId)
      .single();

    if (orderError || !order) {
      console.error(
        "Pedido não encontrado:",
        referenceId,
        orderError,
      );

      return jsonResponse(
        {
          error:
            "Pedido não encontrado.",
        },
        404,
      );
    }

    // --------------------------------------------------
    // 5. Idempotência
    // --------------------------------------------------

    if (order.status === "paid") {
      return jsonResponse({
        received: true,
        paid: true,
        already_processed: true,
        order_id: order.id,
      });
    }

    // --------------------------------------------------
    // 6. Marcar pedido como pago
    // --------------------------------------------------

    const {
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        status: "paid",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error(
        "Erro ao atualizar pedido:",
        updateError,
      );

      return jsonResponse(
        {
          error:
            "Falha ao atualizar pedido.",
        },
        500,
      );
    }

    // --------------------------------------------------
    // 7. Buscar e-books comprados
    // --------------------------------------------------

    const {
      data: orderItems,
      error: itemsError,
    } = await supabase
      .from("order_items")
      .select(
        `
          ebook_id,
          ebooks (
            id,
            title,
            slug,
            file_path
          )
        `,
      )
      .eq(
        "order_id",
        order.id,
      );

    if (itemsError) {
      console.error(
        "Erro ao buscar itens:",
        itemsError,
      );
    }

    const contact =
      Array.isArray(order.contacts)
        ? order.contacts[0]
        : order.contacts;

    // --------------------------------------------------
    // 8. Enviar e-mail pelo Resend
    // --------------------------------------------------

    if (
      RESEND_API_KEY &&
      contact?.email
    ) {
      const downloadLinks =
        (orderItems ?? [])
          .map((item: any) => {
            const ebook =
              Array.isArray(item.ebooks)
                ? item.ebooks[0]
                : item.ebooks;

            if (!ebook?.id) {
              return "";
            }

            /*
             * O endpoint /download/[token]
             * deverá continuar usando a
             * lógica de token existente.
             *
             * Aqui deixamos o identificador
             * do pedido/e-book para a camada
             * existente gerar o acesso.
             */
            return `
              <li>
                <strong>${ebook.title}</strong>
              </li>
            `;
          })
          .filter(Boolean)
          .join("");

      const emailHtml = `
        <div style="font-family:Arial,sans-serif">
          <h2>Pagamento confirmado — Jesus Ensina</h2>

          <p>
            Olá${contact.name ? ` ${contact.name}` : ""}!
          </p>

          <p>
            Seu pagamento foi confirmado com sucesso.
          </p>

          <p>
            <strong>Pedido:</strong> ${order.id}
          </p>

          <h3>Seus e-books</h3>

          <ul>
            ${downloadLinks}
          </ul>

          <p>
            Acesse:
            <a href="${SITE_URL}">
              ${SITE_URL}
            </a>
          </p>

          <p>
            Obrigado por apoiar o projeto Jesus Ensina.
          </p>
        </div>
      `;

      const resendResponse =
        await fetch(
          "https://api.resend.com/emails",
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${RESEND_API_KEY}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              from: RESEND_FROM,
              to: [
                contact.email,
              ],
              subject:
                "Pagamento confirmado — Jesus Ensina",
              html: emailHtml,
            }),
          },
        );

      if (!resendResponse.ok) {
        const resendData =
          await resendResponse.text();

        console.error(
          "Resend rejeitou e-mail:",
          resendResponse.status,
          resendData,
        );
      }
    } else {
      console.warn(
        "RESEND_API_KEY ou e-mail do contato não configurado.",
      );
    }

    return jsonResponse({
      received: true,
      paid: true,
      order_id: order.id,
    });
  } catch (error) {
    console.error(
      "Erro confirm-payment:",
      error,
    );

    return jsonResponse(
      {
        error:
          "Erro interno no webhook.",
      },
      500,
    );
  }
});