import 'server-only'
import Stripe from 'stripe'

export const stripe = new Stripe(
  process.env.JesusEnsina_STRIPE_SECRET_KEY!
)