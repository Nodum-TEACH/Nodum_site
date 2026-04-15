import type { Request, Response } from 'express'

// ---- Types ----
interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface SessionMeta {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  referrer?: string | null
  device_type?: string
  language?: string
  session_duration_sec?: number
  messages_count?: number
  selected_plan?: string | null
}

interface LeadArgs {
  field: string
  contact: string
  business_size?: string
  pain_points?: string
  bot_interests?: string
}

// ---- Tool definition (OpenAI format) ----
const SAVE_LEAD_TOOL = {
  type: 'function',
  function: {
    name: 'save_lead',
    description:
      'Сохрани заявку клиента, когда получил сферу деятельности и контакт. ' +
      'Также укажи что удалось узнать о его бизнесе.',
    parameters: {
      type: 'object',
      properties: {
        field: { type: 'string', description: 'Сфера деятельности' },
        contact: { type: 'string', description: 'Телефон или Telegram' },
        business_size: {
          type: 'string',
          description: 'Размер бизнеса (3 мастера, стартап, 50 сотрудников...)',
        },
        pain_points: {
          type: 'string',
          description: 'Основные проблемы/боли клиента из разговора',
        },
        bot_interests: {
          type: 'string',
          description: 'Что заинтересовало: запись, уведомления, автоответы...',
        },
      },
      required: ['field', 'contact'],
    },
  },
}

// ---- LM Studio (OpenAI-compatible) ----
async function callLMStudio(
  messages: ChatMessage[],
): Promise<{ text: string | null; toolCall: ToolCall | null }> {
  const res = await fetch(`${process.env.LM_STUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LM_STUDIO_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LM_STUDIO_MODEL ?? 'google/gemma-4-e4b',
      messages,
      tools: [SAVE_LEAD_TOOL],
      tool_choice: 'auto',
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`LM Studio ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const msg = data.choices[0].message
  if (msg.tool_calls?.length) {
    return { text: null, toolCall: msg.tool_calls[0] as ToolCall }
  }
  return { text: msg.content as string, toolCall: null }
}

// ---- Gemini (fallback) ----
async function callGemini(
  messages: ChatMessage[],
): Promise<{ text: string | null; toolCall: ToolCall | null }> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const contents = messages
    .filter((m) => m.role !== 'system' && m.role !== 'tool')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content ?? '' }],
    }))

  const geminiTools = [
    { functionDeclarations: [SAVE_LEAD_TOOL.function] },
  ]

  const body: Record<string, unknown> = { contents, tools: geminiTools }
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const part = data.candidates?.[0]?.content?.parts?.[0]
  if (part?.functionCall) {
    return {
      text: null,
      toolCall: {
        id: 'gemini-call',
        type: 'function',
        function: {
          name: part.functionCall.name as string,
          arguments: JSON.stringify(part.functionCall.args),
        },
      },
    }
  }
  return { text: (part?.text as string) ?? '', toolCall: null }
}

// ---- Call AI with LM Studio → Gemini fallback ----
async function callAI(
  messages: ChatMessage[],
): Promise<{ text: string | null; toolCall: ToolCall | null }> {
  try {
    return await callLMStudio(messages)
  } catch (err) {
    console.warn('LM Studio failed, falling back to Gemini:', (err as Error).message)
    return await callGemini(messages)
  }
}

// ---- Insert lead via Hasura Admin API ----
async function insertLead(data: Record<string, unknown>): Promise<void> {
  const mutation = `
    mutation InsertLead($obj: leads_insert_input!) {
      insert_leads_one(object: $obj) { id }
    }
  `
  const res = await fetch(process.env.NHOST_GRAPHQL_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
    },
    body: JSON.stringify({ query: mutation, variables: { obj: data } }),
  })
  const result = await res.json()
  if (result.errors) throw new Error(JSON.stringify(result.errors))
}

// ---- Telegram notification ----
async function sendTelegramNotification(lead: Record<string, unknown>): Promise<void> {
  const text = [
    `🔔 *Новая заявка* (${lead.source})`,
    `👤 *Сфера:* ${lead.field ?? '—'}`,
    `📱 *Контакт:* ${lead.contact ?? '—'}`,
    `🏢 *Бизнес:* ${lead.business_size ?? '—'}`,
    `💡 *Интересы:* ${lead.bot_interests ?? '—'}`,
    `😤 *Боли:* ${lead.pain_points ?? '—'}`,
    `📦 *Тариф смотрел:* ${lead.selected_plan ?? '—'}`,
    `⏱ *На сайте:* ${lead.session_duration_sec ? `${lead.session_duration_sec}с` : '—'} | 💬 ${lead.messages_count ?? '—'} сообщ.`,
    `🌍 *Источник:* ${lead.utm_source ?? lead.referrer ?? 'прямой переход'}`,
    `🕐 ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n')

  const payload: Record<string, unknown> = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'Markdown',
  }
  if (process.env.TELEGRAM_THREAD_ID) {
    payload.message_thread_id = Number(process.env.TELEGRAM_THREAD_ID)
  }

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// ---- Main handler ----
export default async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { message, chatHistory = [], sessionMeta = {} } = (req.body ?? {}) as {
    message?: string
    chatHistory?: ChatMessage[]
    sessionMeta?: SessionMeta
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' })
  }

  const systemPrompt = process.env.VITYA_SYSTEM_PROMPT
  if (!systemPrompt) {
    return res.status(500).json({ error: 'VITYA_SYSTEM_PROMPT not configured' })
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: message },
  ]

  try {
    const result = await callAI(messages)

    if (result.toolCall?.function.name === 'save_lead') {
      const args = JSON.parse(result.toolCall.function.arguments) as LeadArgs
      const leadData: Record<string, unknown> = {
        source: 'chat',
        field: args.field,
        contact: args.contact,
        business_size: args.business_size ?? null,
        pain_points: args.pain_points ?? null,
        bot_interests: args.bot_interests ?? null,
        chat_history: chatHistory,
        ...sessionMeta,
      }

      await insertLead(leadData)

      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        await sendTelegramNotification(leadData).catch((err: unknown) =>
          console.error('Telegram notification failed:', err),
        )
      }

      // Continue conversation with tool result so AI generates the farewell message
      const continuedMessages: ChatMessage[] = [
        ...messages,
        { role: 'assistant', content: null, tool_calls: [result.toolCall] },
        {
          role: 'tool',
          tool_call_id: result.toolCall.id,
          name: 'save_lead',
          content: 'Заявка сохранена',
        },
      ]
      const finalResult = await callAI(continuedMessages)
      return res.json({ reply: finalResult.text ?? '', leadSaved: true })
    }

    return res.json({ reply: result.text ?? '', leadSaved: false })
  } catch (err) {
    console.error('chat-proxy error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
