import OpenAI from "openai"

let openaiInstance: OpenAI | null = null
export function getOpenAI() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

export async function generateSlides(topic: string, prompt: string) {
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

  return response.choices[0].message.content
}

export async function enhanceSlides(markdown: string) {
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

  return response.choices[0].message.content
}

export async function translateSlides(markdown: string, targetLanguage: string) {
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

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 2000,
  })

  return response.choices[0].message.content
} 