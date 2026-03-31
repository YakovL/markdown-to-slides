import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/openai"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
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
      return new NextResponse(
        "You need a Pro subscription to use AI features",
        { status: 403 }
      )
    }

    const isSubscriptionActive = user.stripeCurrentPeriodEnd.getTime() > Date.now()

    if (!isSubscriptionActive) {
      return new NextResponse(
        "Your subscription has expired. Please renew to use AI features",
        { status: 403 }
      )
    }

    const { markdown } = await req.json()

    if (!markdown) {
      return new NextResponse("Missing markdown content", { status: 400 })
    }

    const systemPrompt = `You are a presentation expert that enhances markdown slides.
    Follow these guidelines:
    1. Improve clarity and conciseness of content
    2. Add engaging examples and analogies
    3. Enhance formatting using markdown features
    4. Ensure consistent styling across slides
    5. Add or improve speaker notes
    6. Keep the same basic structure and number of slides
    7. Maintain all existing code blocks and examples
    8. Use bold (**) and italic (*) for emphasis
    9. Add relevant emojis where appropriate
    10. Keep the content professional and focused`

    const userPrompt = `Enhance the following markdown slides while maintaining their structure:\n\n${markdown}\n\nMake the content more engaging and professional while keeping the same basic format.`

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const enhancedMarkdown = response.choices[0].message.content

    return NextResponse.json({ markdown: enhancedMarkdown })
  } catch (error) {
    console.error("[AI_ENHANCE_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
