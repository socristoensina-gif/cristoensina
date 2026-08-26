import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================
// VARIÁVEIS DE AMBIENTE
// ============================================================

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL!

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY!

const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET!

const RESEND_API_KEY =
  process.env.RESEND_API_KEY

const SITE_URL =
  process.env.SITE_URL ||
  'https://www.jesusensina.com.br'

const FROM_EMAIL =
  process.env.FROM_EMAIL ||
  'contato@jesusensina.com.br'

// ============================================================
// RESPOSTA DE ERRO
// ============================================================

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    },
  )
}

// ============================================================
// WEBHOOK STRIPE
// ============================================================

export async function POST(
  request: Request,
) {
  // ==========================================================
  // 1. VALIDAR CONFIGURAÇÃO
  // ==========================================================

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error(
      'Supabase não configurado no webhook Stripe.',
    )

    return errorResponse(
      'Configuração Supabase incompleta.',
      500,
    )
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error(
      'STRIPE_WEBHOOK_SECRET não configurado.',
    )

    return errorResponse(
      'Webhook Stripe não configurado.',
      500,
    )
  }

  // ==========================================================
  // 2. VALIDAR ASSINATURA STRIPE
  // ==========================================================

  const signature =
    request.headers.get(
      'stripe-signature',
    )

  if (!signature) {
    console.error(
      'Webhook recebido sem assinatura Stripe.',
    )

    return errorResponse(
      'Assinatura Stripe ausente.',
      400,
    )
  }

  const rawBody =
    await request.text()

  let event: Stripe.Event

  try {
    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET,
      )
  } catch (error) {
    console.error(
      'Assinatura inválida do webhook Stripe:',
      error,
    )

    return errorResponse(
      'Assinatura Stripe inválida.',
      400,
    )
  }

  console.log(
    'Evento Stripe recebido:',
    event.type,
    event.id,
  )

  // ==========================================================
  // 3. EVENTOS ACEITOS
  // ==========================================================

  const acceptedEvents = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
  ]

  if (
    !acceptedEvents.includes(
      event.type,
    )
  ) {
    console.log(
      'Evento Stripe ignorado:',
      event.type,
    )

    return NextResponse.json({
      received: true,
      ignored: true,
      type: event.type,
    })
  }

  const session =
    event.data
      .object as Stripe.Checkout.Session

  // ==========================================================
  // 4. CONFIRMAR QUE O PAGAMENTO ESTÁ PAGO
  // ==========================================================

  if (
    session.payment_status !==
    'paid'
  ) {
    console.log(
      'Sessão ainda não paga:',
      session.id,
      session.payment_status,
    )

    return NextResponse.json({
      received: true,
      paid: false,
      payment_status:
        session.payment_status,
    })
  }

  // ==========================================================
  // 5. IDENTIFICAR PEDIDO
  // ==========================================================

  const orderId =
    session.metadata?.order_id ||
    session.client_reference_id

  if (!orderId) {
    console.error(
      'Stripe Session sem order_id:',
      session.id,
    )

    return errorResponse(
      'Pedido não identificado.',
      400,
    )
  }

  console.log(
    'Pedido identificado:',
    orderId,
  )

  // ==========================================================
  // 6. CLIENTE SUPABASE
  // ==========================================================

  const supabase =
    createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

  // ==========================================================
  // 7. BUSCAR PEDIDO + CONTATO
  // ==========================================================

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from('orders')
    .select(`
      id,
      contact_id,
      status,
      total_cents,
      payment_provider,
      payment_provider_id,
      contacts (
        id,
        email,
        name
      )
    `)
    .eq(
      'id',
      orderId,
    )
    .single()

  if (
    orderError ||
    !order
  ) {
    console.error(
      'Pedido Stripe não encontrado:',
      orderId,
      orderError,
    )

    return errorResponse(
      'Pedido não encontrado.',
      404,
    )
  }

  // ==========================================================
  // 8. IDEMPOTÊNCIA
  //
  // IMPORTANTE:
  //
  // Nesta nova versão, o pedido só é marcado como "paid"
  // DEPOIS que o Resend aceita o e-mail.
  //
  // Portanto, se encontramos status paid aqui, podemos
  // considerar que o fluxo já foi concluído.
  // ==========================================================

  if (
    order.status === 'paid'
  ) {
    console.log(
      'Pedido já processado anteriormente:',
      order.id,
    )

    return NextResponse.json({
      received: true,
      paid: true,
      already_processed: true,
      order_id: order.id,
    })
  }

  // ==========================================================
  // 9. VALIDAR GATEWAY
  // ==========================================================

  if (
    order.payment_provider !==
    'stripe'
  ) {
    console.error(
      'Pedido não pertence ao Stripe:',
      order.id,
      order.payment_provider,
    )

    return errorResponse(
      'Gateway do pedido inválido.',
      400,
    )
  }

  // ==========================================================
  // 10. VALIDAR VALOR
  // ==========================================================

  const stripeAmount =
    Number(
      session.amount_total ?? 0,
    )

  const orderAmount =
    Number(
      order.total_cents ?? 0,
    )

  if (
    stripeAmount !==
    orderAmount
  ) {
    console.error(
      'Valor Stripe diferente do pedido:',
      {
        order_id:
          order.id,

        stripeAmount,

        orderAmount,
      },
    )

    return errorResponse(
      'Valor do pagamento não corresponde ao pedido.',
      400,
    )
  }

  // ==========================================================
  // 11. BUSCAR ITENS / E-BOOKS DO PEDIDO
  // ==========================================================

  const {
    data: orderItems,
    error: itemsError,
  } = await supabase
    .from('order_items')
    .select(`
      ebook_id,
      unit_price_cents,
      ebooks (
        id,
        title,
        slug,
        file_path
      )
    `)
    .eq(
      'order_id',
      order.id,
    )

  if (
    itemsError ||
    !orderItems ||
    orderItems.length === 0
  ) {
    console.error(
      'Itens do pedido não encontrados:',
      order.id,
      itemsError,
    )

    return errorResponse(
      'Itens do pedido não encontrados.',
      500,
    )
  }

  // ==========================================================
  // 12. IDENTIFICAR CONTATO
  // ==========================================================

  const contact: any =
    Array.isArray(
      order.contacts,
    )
      ? order.contacts[0]
      : order.contacts

  if (
    !contact?.id ||
    !contact?.email
  ) {
    console.error(
      'Contato do pedido inválido:',
      order.id,
    )

    return errorResponse(
      'Contato do comprador não encontrado.',
      500,
    )
  }

  console.log(
    'Comprador identificado:',
    {
      order_id:
        order.id,

      contact_id:
        contact.id,

      email:
        contact.email,
    },
  )

  // ==========================================================
  // 13. VALIDAR RESEND ANTES DE ALTERAR O PEDIDO
  // ==========================================================

  if (!RESEND_API_KEY) {
    console.error(
      'RESEND_API_KEY não configurada.',
    )

    return errorResponse(
      'Pagamento recebido, mas o serviço de e-mail não está configurado.',
      500,
    )
  }

  // ==========================================================
  // 14. PREPARAR DOWNLOADS
  // ==========================================================

  const downloadsToCreate: {
    contact_id: string
    ebook_id: string
  }[] = orderItems
    .map(
      (
        item: any,
      ) => {
        const ebook =
          Array.isArray(
            item.ebooks,
          )
            ? item.ebooks[0]
            : item.ebooks

        if (!ebook?.id) {
          return null
        }

        return {
          contact_id:
            String(
              contact.id,
            ),

          ebook_id:
            String(
              ebook.id,
            ),
        }
      },
    )
    .filter(
      (
        item,
      ): item is {
        contact_id: string
        ebook_id: string
      } =>
        item !== null,
    )

  if (
    downloadsToCreate.length ===
    0
  ) {
    console.error(
      'Nenhum download válido encontrado para o pedido:',
      order.id,
    )

    return errorResponse(
      'Nenhum download pôde ser criado.',
      500,
    )
  }

  // ==========================================================
  // 15. CRIAR TOKENS DE DOWNLOAD
  // ==========================================================

  const {
    data: downloads,
    error: downloadsError,
  } = await supabase
    .from('downloads')
    .insert(
      downloadsToCreate,
    )
    .select(
      'id, token, ebook_id',
    )

  if (
    downloadsError ||
    !downloads ||
    downloads.length === 0
  ) {
    console.error(
      'Erro ao gerar downloads:',
      downloadsError,
    )

    return errorResponse(
      'Falha ao gerar os links de download.',
      500,
    )
  }

  console.log(
    'Downloads criados:',
    {
      order_id:
        order.id,

      quantidade:
        downloads.length,
    },
  )

  // ==========================================================
  // FUNÇÃO DE LIMPEZA
  //
  // Se o Resend falhar, apagamos SOMENTE os tokens criados
  // nesta tentativa.
  //
  // O pedido permanece pendente e o Stripe poderá tentar
  // entregar novamente o webhook.
  // ==========================================================

  const cleanupDownloads =
    async () => {
      const downloadIds =
        downloads
          .map(
            (
              download: any,
            ) =>
              download.id,
          )
          .filter(Boolean)

      if (
        downloadIds.length ===
        0
      ) {
        return
      }

      const {
        error:
          cleanupError,
      } = await supabase
        .from('downloads')
        .delete()
        .in(
          'id',
          downloadIds,
        )

      if (cleanupError) {
        console.error(
          'Falha ao remover downloads temporários:',
          cleanupError,
        )
      } else {
        console.log(
          'Downloads temporários removidos após falha.',
        )
      }
    }

  // ==========================================================
  // 16. MONTAR LINKS
  // ==========================================================

  const downloadLinks =
    downloads
      .map(
        (
          download: any,
        ) => {
          const item: any =
            orderItems.find(
              (
                orderItem: any,
              ) =>
                String(
                  orderItem.ebook_id,
                ) ===
                String(
                  download.ebook_id,
                ),
            )

          const ebook =
            Array.isArray(
              item?.ebooks,
            )
              ? item.ebooks[0]
              : item?.ebooks

          if (
            !ebook ||
            !download.token
          ) {
            return ''
          }

          const url =
            `${SITE_URL}/download/${download.token}`

          return `
            <li style="margin-bottom:20px;">
              <strong style="font-size:16px;">
                ${ebook.title}
              </strong>

              <br />

              <a
                href="${url}"
                style="
                  display:inline-block;
                  margin-top:8px;
                  padding:10px 16px;
                  background:#111827;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:6px;
                  font-weight:bold;
                "
              >
                Baixar e-book
              </a>
            </li>
          `
        },
      )
      .filter(Boolean)
      .join('')

  if (!downloadLinks) {
    console.error(
      'Não foi possível montar os links dos e-books.',
    )

    await cleanupDownloads()

    return errorResponse(
      'Falha ao preparar links de download.',
      500,
    )
  }

  // ==========================================================
  // 17. PREPARAR E-MAIL
  // ==========================================================

  const firstName =
    contact.name
      ? ` ${contact.name}`
      : ''

  const emailHtml = `
    <div
      style="
        font-family:Arial,Helvetica,sans-serif;
        max-width:600px;
        margin:0 auto;
        line-height:1.6;
        color:#222222;
      "
    >
      <h2>
        Pagamento confirmado — Jesus Ensina
      </h2>

      <p>
        Que a paz do Senhor esteja com você${firstName}!
      </p>

      <p>
        Seu pagamento foi confirmado com sucesso.
      </p>

      <p>
        <strong>Pedido:</strong>
        ${order.id}
      </p>

      <h3>
        Seus e-books
      </h3>

      <ul style="padding-left:20px;">
        ${downloadLinks}
      </ul>

      <p>
        Clique no botão correspondente para acessar
        o seu material.
      </p>

      <p>
        Os links ficam disponíveis conforme as regras
        de download do Jesus Ensina.
      </p>

      <p>
        Obrigado por apoiar o projeto Jesus Ensina.
      </p>
    </div>
  `

  // ==========================================================
  // 18. ENVIAR PELO RESEND
  // ==========================================================

  let resendResponse: Response

  try {
    resendResponse =
      await fetch(
        'https://api.resend.com/emails',
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${RESEND_API_KEY}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              from:
                `Jesus Ensina <${FROM_EMAIL}>`,

              to: [
                contact.email,
              ],

              subject:
                'Pagamento confirmado — seus e-books',

              html:
                emailHtml,
            }),
        },
      )
  } catch (error) {
    console.error(
      'Erro de comunicação com o Resend:',
      error,
    )

    await cleanupDownloads()

    return errorResponse(
      'Pagamento confirmado pelo Stripe, mas não foi possível contactar o serviço de e-mail.',
      500,
    )
  }

  // ==========================================================
  // 19. VERIFICAR RESPOSTA DO RESEND
  // ==========================================================

  if (
    !resendResponse.ok
  ) {
    const resendData =
      await resendResponse
        .text()

    console.error(
      'Resend rejeitou o e-mail:',
      {
        status:
          resendResponse.status,

        resposta:
          resendData,

        email:
          contact.email,

        order_id:
          order.id,
      },
    )

    // MUITO IMPORTANTE:
    //
    // Não deixamos os downloads desta tentativa acumularem
    // e NÃO marcamos o pedido como paid.
    //
    // Assim o Stripe pode tentar novamente.

    await cleanupDownloads()

    return errorResponse(
      'Pagamento confirmado, mas houve falha no envio do e-mail.',
      500,
    )
  }

  // ==========================================================
  // 20. RESEND ACEITOU O E-MAIL
  // ==========================================================

  let resendResult: any = null

  try {
    resendResult =
      await resendResponse
        .json()
  } catch {
    // Não interromper o fluxo se a resposta não puder
    // ser convertida para JSON.
  }

  console.log(
    'E-mail aceito pelo Resend:',
    {
      order_id:
        order.id,

      email:
        contact.email,

      resend_id:
        resendResult?.id ??
        null,
    },
  )

  // ==========================================================
  // 21. SOMENTE AGORA MARCAR PEDIDO COMO PAGO
  //
  // ESTA É A CORREÇÃO PRINCIPAL.
  //
  // O pedido NÃO fica "paid" antes do Resend aceitar
  // o e-mail.
  // ==========================================================

  const {
    error: updateError,
  } = await supabase
    .from('orders')
    .update({
      status:
        'paid',

      payment_provider:
        'stripe',

      payment_provider_id:
        session.id,
    })
    .eq(
      'id',
      order.id,
    )

  if (updateError) {
    console.error(
      'ATENÇÃO: E-mail enviado, mas houve erro ao marcar pedido como pago:',
      {
        order_id:
          order.id,

        session_id:
          session.id,

        error:
          updateError,
      },
    )

    /*
      NÃO removemos os tokens aqui.

      Motivo:
      neste ponto o Resend JÁ aceitou o e-mail
      e o cliente recebeu links que dependem
      desses tokens.

      Apagá-los faria o cliente receber links
      inválidos.
    */

    return errorResponse(
      'E-mail enviado, mas houve falha ao atualizar o pedido.',
      500,
    )
  }

  // ==========================================================
  // 22. SUCESSO FINAL
  // ==========================================================

  console.log(
    'Pedido Stripe processado com sucesso:',
    {
      order_id:
        order.id,

      session_id:
        session.id,

      email:
        contact.email,

      ebooks:
        downloads.length,

      resend_id:
        resendResult?.id ??
        null,
    },
  )

  return NextResponse.json({
    received:
      true,

    paid:
      true,

    email_sent:
      true,

    order_id:
      order.id,

    downloads:
      downloads.length,

    resend_id:
      resendResult?.id ??
      null,
  })
}