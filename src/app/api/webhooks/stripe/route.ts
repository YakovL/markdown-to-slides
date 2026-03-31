import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const stripe = getStripe()
  const body = await req.text()
  const signature = req.headers.get("Stripe-Signature")

  if (!signature) {
    return new NextResponse("No signature", { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("[WEBHOOK_ERROR]", error)
    return new NextResponse("Invalid signature", { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription as string)

      await prisma.user.update({
        where: {
          id: subscription.metadata.userId,
        },
        data: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

        await prisma.user.update({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
      }
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("[WEBHOOK_ERROR]", error)
    return new NextResponse("Webhook handler failed", { status: 500 })
  }
}
