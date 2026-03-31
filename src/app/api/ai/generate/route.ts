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

    const { topic, prompt } = await req.json()

    if (!topic || !prompt) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const systemPrompt = `You are a presentation expert that creates well-structured markdown content for slides.
    Follow these guidelines:
    1. Use # for slide titles (one # per slide)
    2. Keep each slide focused and concise
    3. Use bullet points (- or *) for lists
    4. Include code blocks with proper language tags when showing code
    5. Use --- to separate slides
    6. Include speaker notes after each slide using > for blockquotes
    7. Aim for 5-8 slides total
    8. Start with an introduction slide and end with a summary/conclusion slide
    9. Use bold (**) and italic (*) for emphasis where appropriate
    10. Include examples and practical applications where relevant`

    const userPrompt = `Create a presentation on: ${topic}\n\nAdditional instructions: ${prompt}\n\nGenerate markdown content formatted as slides.`

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const markdown = response.choices[0].message.content

    return NextResponse.json({ markdown })
  } catch (error) {
    console.error("[AI_GENERATE_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
