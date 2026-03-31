import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
      typescript: true,
    })
  }

  return stripeInstance
}

export async function createStripeCustomer(email: string, userId: string) {
  return getStripe().customers.create({
    email,
    metadata: {
      userId,
    },
  })
}

export async function createCheckoutSession(customerId: string, userId: string) {
  return getStripe().checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: {
      userId,
    },
  })
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl?: string
) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })
}
