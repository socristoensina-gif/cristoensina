import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// Mesmo padrão de leitura de variáveis usado em app/api/stripe-checkout/route.ts —
// mantém consistência com o que já está em produção.
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Valor mínimo aceito, para evitar assinatura de R$0 ou negativa por engano/abuso
const MIN_AMOUNT_CENTS = 500 // R$ 5,00

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const email = String(body.email ?? '').trim()
    const name = body.name ? String(body.name).trim() : null
    const amountCents = Math.round(Number(body.amount_cents))

    if (!email || !amountCents || amountCents < MIN_AMOUNT_CENTS) {
      return NextResponse.json(
        { error: `E-mail e um valor de ao menos R$ ${(MIN_AMOUNT_CENTS / 100).toFixed(2)} são obrigatórios.` },
        { status: 400 },
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Cria/atualiza o contato (mesma tabela usada pelo checkout de e-books)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert(
        { email, name, source: 'parceiro-mensal' },
        { onConflict: 'email', ignoreDuplicates: false },
      )
      .select('id')
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Falha ao registrar contato.' }, { status: 500 })
    }

    // 2. Cria o registro do parceiro (status pending até o webhook confirmar)
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert({
        contact_id: contact.id,
        email,
        name,
        amount_cents: amountCents,
        status: 'pending',
      })
      .select('id')
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Falha ao criar registro de parceria.' }, { status: 500 })
    }

    const origin = new URL(request.url).origin

    // 3. Cria a sessão de checkout do Stripe em modo assinatura
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      client_reference_id: partner.id,
      metadata: {
        partner_id: partner.id,
      },
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Parceria mensal — Jesus Ensina',
              description: 'Contribuição voluntária e recorrente para sustento do projeto. Cancele quando quiser.',
            },
            unit_amount: amountCents,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/parceiro/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/parceiro?cancelado=1`,
    })

    // 4. Guarda o ID da sessão para reconciliar depois
    await supabase
      .from('partners')
      .update({ stripe_subscription_id: session.subscription?.toString() ?? null })
      .eq('id', partner.id)

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
      partner_id: partner.id,
    })
  } catch (error) {
    console.error('Erro Stripe Subscription:', error)
    return NextResponse.json(
      {
        error: 'Erro criando assinatura no Stripe',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
