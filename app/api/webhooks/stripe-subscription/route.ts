import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Endpoint EXCLUSIVO da assinatura mensal — precisa de um "Signing secret" próprio,
// diferente do STRIPE_WEBHOOK_SECRET já usado pelo webhook de compra de e-books.
// Motivo: cada endpoint cadastrado no painel do Stripe recebe uma assinatura única.
const WEBHOOK_SECRET = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature inválida:', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    switch (event.type) {
      // Confirma a primeira cobrança da assinatura
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const partnerId = session.client_reference_id
        if (!partnerId) break

        await supabase
          .from('partners')
          .update({
            status: 'active',
            stripe_customer_id: session.customer?.toString() ?? null,
            stripe_subscription_id: session.subscription?.toString() ?? null,
            started_at: new Date().toISOString(),
          })
          .eq('id', partnerId)
        break
      }

      // Cobrança mensal seguinte falhou (cartão recusado, sem saldo, etc.)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription?.toString()
        if (!subscriptionId) break

        await supabase
          .from('partners')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)
        break
      }

      // Parceiro cancelou (pelo painel do Stripe/portal do cliente, ou inadimplência)
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('partners')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      // Voltou a pagar normalmente depois de um past_due
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.status === 'active') {
          await supabase
            .from('partners')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', subscription.id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro processando webhook de assinatura:', error)
    // 200 mesmo em erro interno — evita o Stripe reenviar o mesmo evento indefinidamente
    return NextResponse.json({ received: true })
  }
}
