import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL!

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const email = String(body.email ?? '').trim()
    const name = body.name
      ? String(body.name).trim()
      : null

    const ebookIds: string[] =
      Array.isArray(body.ebook_ids)
        ? body.ebook_ids.map(String)
        : []

    if (!email || ebookIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'E-mail e ao menos 1 e-book são obrigatórios.',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error(
        'Variáveis do Supabase não configuradas.',
      )

      return NextResponse.json(
        {
          error:
            'Configuração do servidor incompleta.',
        },
        {
          status: 500,
        },
      )
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    )

    // ============================================================
    // 1. BUSCAR E-BOOKS DIRETAMENTE NO BANCO
    // ============================================================

    const {
      data: ebooks,
      error: ebooksError,
    } = await supabase
      .from('ebooks')
      .select(
        'id, title, price_cents, status',
      )
      .in('id', ebookIds)
      .eq('status', 'published')

    if (ebooksError) {
      console.error(
        'Erro ao buscar e-books:',
        ebooksError,
      )

      return NextResponse.json(
        {
          error:
            'Erro ao consultar os e-books.',
        },
        {
          status: 500,
        },
      )
    }

    if (
      !ebooks ||
      ebooks.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Nenhum e-book válido encontrado.',
        },
        {
          status: 404,
        },
      )
    }

    // ============================================================
    // 2. SOMENTE E-BOOKS PAGOS
    // ============================================================

    const paidEbooks =
      ebooks.filter(
        (ebook) =>
          Number(ebook.price_cents) > 0,
      )

    if (paidEbooks.length === 0) {
      return NextResponse.json(
        {
          error:
            'Os itens selecionados são gratuitos.',
        },
        {
          status: 400,
        },
      )
    }

    const totalCents =
      paidEbooks.reduce(
        (total, ebook) =>
          total +
          Number(ebook.price_cents),
        0,
      )

    // ============================================================
    // 3. CRIAR / ATUALIZAR CONTATO
    // ============================================================

    const {
      data: contact,
      error: contactError,
    } = await supabase
      .from('contacts')
      .upsert(
        {
          email,
          name,
          source: 'checkout-stripe',
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        },
      )
      .select('id')
      .single()

    if (
      contactError ||
      !contact
    ) {
      console.error(
        'Erro ao criar contato:',
        contactError,
      )

      return NextResponse.json(
        {
          error:
            'Falha ao registrar o comprador.',
        },
        {
          status: 500,
        },
      )
    }

    // ============================================================
    // 4. CRIAR PEDIDO
    // ============================================================

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from('orders')
      .insert({
        contact_id: contact.id,
        status: 'pending',
        total_cents: totalCents,
        payment_provider: 'stripe',
      })
      .select('id')
      .single()

    if (
      orderError ||
      !order
    ) {
      console.error(
        'Erro ao criar pedido:',
        orderError,
      )

      return NextResponse.json(
        {
          error:
            'Falha ao criar o pedido.',
        },
        {
          status: 500,
        },
      )
    }

    // ============================================================
    // 5. CRIAR ITENS DO PEDIDO
    // ============================================================

    const orderItems =
      paidEbooks.map(
        (ebook) => ({
          order_id: order.id,
          ebook_id: ebook.id,
          unit_price_cents:
            Number(
              ebook.price_cents,
            ),
        }),
      )

    const {
      error: orderItemsError,
    } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      console.error(
        'Erro ao criar itens:',
        orderItemsError,
      )

      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)

      return NextResponse.json(
        {
          error:
            'Falha ao registrar os itens do pedido.',
        },
        {
          status: 500,
        },
      )
    }

    // ============================================================
    // 6. CRIAR CHECKOUT STRIPE
    // ============================================================

    const origin =
      new URL(request.url).origin

    const session =
      await stripe.checkout.sessions.create({
        mode: 'payment',

        customer_email: email,

        client_reference_id:
          order.id,

        metadata: {
          order_id: order.id,
        },

        line_items:
          paidEbooks.map(
            (ebook) => ({
              price_data: {
                currency: 'brl',

                product_data: {
                  name: ebook.title,
                },

                unit_amount:
                  Number(
                    ebook.price_cents,
                  ),
              },

              quantity: 1,
            }),
          ),

        success_url:
          `${origin}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${origin}/carrinho?stripe=cancel`,
      })

    // ============================================================
    // 7. SALVAR SESSION ID DO STRIPE
    // ============================================================

    const {
      error: paymentIdError,
    } = await supabase
      .from('orders')
      .update({
        payment_provider_id:
          session.id,
      })
      .eq('id', order.id)

    if (paymentIdError) {
      console.error(
        'Erro ao salvar Stripe Session ID:',
        paymentIdError,
      )
    }

    // ============================================================
    // 8. RETORNAR CHECKOUT
    // ============================================================

    return NextResponse.json({
      checkout_url:
        session.url,
      session_id:
        session.id,
      order_id:
        order.id,
      provider:
        'stripe',
    })
  } catch (error) {
    console.error(
      'Erro Stripe Checkout:',
      error,
    )

    return NextResponse.json(
      {
        error:
          'Erro criando checkout Stripe',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      },
    )
  }
}