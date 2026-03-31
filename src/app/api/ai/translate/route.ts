import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/openai"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check subscription status
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
      },
    })

    if (!user?.stripeSubscriptionId || !user?.stripeCurrentPeriodEnd) {
      return NextResponse.json(
        { error: "You need a Pro subscription to use AI features" },
        { status: 403 }
      )
    }

    const isSubscriptionActive = user.stripeCurrentPeriodEnd.getTime() > Date.now()

    if (!isSubscriptionActive) {
      return NextResponse.json(
        { error: "Your subscription has expired. Please renew to use AI features" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { markdown, targetLanguage } = body

    if (!markdown || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a professional translator that specializes in translating markdown presentations.
    Follow these guidelines:
    1. Translate the content to ${targetLanguage}
    2. Preserve all markdown formatting
    3. Keep code blocks unchanged
    4. Maintain slide separators (---)
    5. Keep speaker notes format (> note)
    6. Preserve emojis and special characters
    7. Keep any technical terms that shouldn't be translated
    8. Maintain the same structure and formatting
    9. Ensure natural and fluent translation
    10. Keep URLs and references unchanged`

    const userPrompt = `Translate the following markdown presentation to ${targetLanguage}:\n\n${markdown}`

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })

      if (!response.choices[0]?.message?.content) {
        return NextResponse.json(
          { error: "Failed to generate translation" },
          { status: 500 }
        )
      }

      const translatedMarkdown = response.choices[0].message.content
      return NextResponse.json({ markdown: translatedMarkdown })
    } catch (openaiError) {
      console.error("[OPENAI_ERROR]", openaiError)
      return NextResponse.json(
        { error: "Failed to process translation" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[API_ERROR]", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
