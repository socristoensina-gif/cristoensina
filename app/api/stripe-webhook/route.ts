import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    { error: message },
    { status },
  )
}

export async function POST(
  request: Request,
) {
  // ============================================================
  // 1. VALIDAR CONFIGURAÇÃO
  // ============================================================

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

  // ============================================================
  // 2. VALIDAR ASSINATURA DO STRIPE
  // ============================================================

  const signature =
    request.headers.get('stripe-signature')

  if (!signature) {
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

  // ============================================================
  // 3. PROCESSAR SOMENTE PAGAMENTOS RELEVANTES
  // ============================================================

  const acceptedEvents = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
  ]

  if (
    !acceptedEvents.includes(
      event.type,
    )
  ) {
    return NextResponse.json({
      received: true,
      ignored: true,
      type: event.type,
    })
  }

  const session =
    event.data
      .object as Stripe.Checkout.Session

  // checkout.session.completed também pode acontecer
  // antes da confirmação final em alguns meios assíncronos.
  if (
    session.payment_status !== 'paid'
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

  // ============================================================
  // 4. IDENTIFICAR O PEDIDO
  // ============================================================

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

  const supabase =
    createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    )

  // ============================================================
  // 5. BUSCAR PEDIDO E CONTATO
  // ============================================================

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
    .eq('id', orderId)
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

  // ============================================================
  // 6. IDEMPOTÊNCIA
  // ============================================================

  if (order.status === 'paid') {
    console.log(
      'Pedido já processado:',
      order.id,
    )

    return NextResponse.json({
      received: true,
      paid: true,
      already_processed: true,
      order_id: order.id,
    })
  }

  // ============================================================
  // 7. VALIDAR PROVIDER
  // ============================================================

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

  // ============================================================
  // 8. VALIDAR VALOR PAGO
  // ============================================================

  const stripeAmount =
    Number(session.amount_total ?? 0)

  const orderAmount =
    Number(order.total_cents ?? 0)

  if (
    stripeAmount !== orderAmount
  ) {
    console.error(
      'Valor Stripe diferente do pedido:',
      {
        order_id: order.id,
        stripeAmount,
        orderAmount,
      },
    )

    return errorResponse(
      'Valor do pagamento não corresponde ao pedido.',
      400,
    )
  }

  // ============================================================
  // 9. BUSCAR E-BOOKS DO PEDIDO
  // ============================================================

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

  // ============================================================
  // 10. GERAR TOKENS DE DOWNLOAD
  // ============================================================

  const downloadsToCreate: {
  contact_id: string
  ebook_id: string
}[] = orderItems
  .map((item: any) => {
    const ebook =
      Array.isArray(item.ebooks)
        ? item.ebooks[0]
        : item.ebooks

    if (!ebook?.id) {
      return null
    }

    return {
      contact_id: String(contact.id),
      ebook_id: String(ebook.id),
    }
  })
  .filter(
    (
      item,
    ): item is {
      contact_id: string
      ebook_id: string
    } => item !== null,
  )

  if (
    downloadsToCreate.length === 0
  ) {
    return errorResponse(
      'Nenhum download pôde ser criado.',
      500,
    )
  }

  const {
    data: downloads,
    error: downloadsError,
  } = await supabase
    .from('downloads')
    .insert(downloadsToCreate)
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

  // ============================================================
  // 11. PREPARAR LINKS PARA O RESEND
  // ============================================================

  const downloadLinks =
    downloads
      .map((download: any) => {
        const item: any =
          orderItems.find(
            (orderItem: any) =>
              orderItem.ebook_id ===
              download.ebook_id,
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
          <li style="margin-bottom:16px;">
            <strong>
              ${ebook.title}
            </strong>
            <br />
            <a href="${url}">
              Baixar e-book
            </a>
          </li>
        `
      })
      .filter(Boolean)
      .join('')

  // ============================================================
  // 12. MARCAR PEDIDO COMO PAGO
  // ============================================================

  const {
    error: updateError,
  } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_provider:
        'stripe',
      payment_provider_id:
        session.id,
    })
    .eq('id', order.id)

  if (updateError) {
    console.error(
      'Erro ao marcar pedido como pago:',
      updateError,
    )

    // Evita deixar tokens válidos se o pedido
    // não conseguiu ser confirmado.
    const downloadIds =
      downloads.map(
        (download: any) =>
          download.id,
      )

    if (
      downloadIds.length > 0
    ) {
      await supabase
        .from('downloads')
        .delete()
        .in(
          'id',
          downloadIds,
        )
    }

    return errorResponse(
      'Falha ao confirmar o pedido.',
      500,
    )
  }

  // ============================================================
  // 13. ENVIAR E-MAIL VIA RESEND
  // ============================================================

  if (!RESEND_API_KEY) {
    console.error(
      'RESEND_API_KEY não configurada.',
    )

    return errorResponse(
      'Pagamento confirmado, mas o serviço de e-mail não está configurado.',
      500,
    )
  }

  const firstName =
    contact.name
      ? ` ${contact.name}`
      : ''

  const emailHtml = `
    <div style="
      font-family:Arial,sans-serif;
      max-width:600px;
      margin:auto;
      line-height:1.6;
    ">
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

      <ul>
        ${downloadLinks}
      </ul>

      <p>
        Os links ficam disponíveis conforme
        as regras de download do Jesus Ensina.
      </p>

      <p>
        Obrigado por apoiar o projeto
        Jesus Ensina.
      </p>
    </div>
  `

  const resendResponse =
    await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${RESEND_API_KEY}`,
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
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

  if (!resendResponse.ok) {
    const resendData =
      await resendResponse.text()

    console.error(
      'Resend rejeitou o e-mail:',
      resendResponse.status,
      resendData,
    )

    return errorResponse(
      'Pagamento confirmado, mas houve falha no envio do e-mail.',
      500,
    )
  }

  // ============================================================
  // 14. FINAL
  // ============================================================

  console.log(
    'Pedido Stripe processado:',
    {
      order_id:
        order.id,
      session_id:
        session.id,
      email:
        contact.email,
      ebooks:
        downloads.length,
    },
  )

  return NextResponse.json({
    received: true,
    paid: true,
    order_id:
      order.id,
    downloads:
      downloads.length,
  })
}