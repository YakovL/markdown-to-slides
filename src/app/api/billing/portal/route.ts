import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    })

    if (!user?.stripeCustomerId) {
      return new NextResponse("No customer ID found", { status: 400 })
    }

    const stripe = getStripe()
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.NEXT_PUBLIC_APP_URL
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("[BILLING_PORTAL]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
