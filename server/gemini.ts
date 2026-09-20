import type { IncomingMessage, ServerResponse } from 'http'
import * as fs from 'fs'
import * as path from 'path'
import { insertChatHistory, fetchChatHistory } from './supabase.js'

// System Prompt for PlaceMate AI Placement Coach
export const PLACEMENT_COACH_SYSTEM_PROMPT = `You are a Placement Preparation Assistant. Help students prepare for jobs and campus placements. Answer questions about aptitude, reasoning, coding, programming, technical interviews, HR interviews, communication, resumes, job applications, company recruitment processes, mock interviews, career preparation, and related topics. Understand the user's intent rather than relying on exact keywords. If a question is reasonably connected to placement preparation, provide a useful answer. Use the conversation context for follow-up questions. If a question is clearly unrelated to placement preparation, politely explain that you focus on placement preparation.

Detailed Behavioral Guidelines:
1. TONE & STYLE:
   - Use clear, professional, friendly, and encouraging English suitable for college students.
   - Be accurate, structured, and direct. Avoid rambling.
   - Format responses using clean markdown (bold headers, bullet points, numbered lists, code blocks, tables when useful).

2. APTITUDE QUESTIONS:
   - Whenever asked an aptitude or math problem, calculate carefully.
   - Provide Topic Name, Formula, Step-by-Step Solution, Final Answer clearly highlighted, and a Quick Tip/Shortcut.

3. CODING & TECHNICAL QUESTIONS:
   - When asked for coding or technical topics, provide clear explanations, well-commented code, and Big-O Time & Space Complexity analysis.

4. MOCK INTERVIEWS & HR:
   - Conduct structured mock interviews or answer HR questions ("Tell me about yourself", communication skills, salary expectations).

5. RESUMES & COMPANY PREPARATION:
   - Give actionable feedback on resume bullets, project explanations (STAR framework), and company preparation strategies (TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, Amazon, Google, Microsoft, IBM, etc.).
   - For factual or company-specific information (e.g. eligibility criteria, CTC packages, hiring workflow) that may change over time, state clearly when candidates should verify the latest official information from the company's current career portal or recruitment notification.

6. OFF-TOPIC BOUNDARY:
   - Only refuse when the question is completely unrelated to placement preparation, jobs, career, or computer science (e.g. cooking recipes, sports gossip). Politely explain that you focus on placement preparation.
`

function getApiKey(): string {
  const envKeys = [
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'VITE_GEMINI_API_KEY',
    'GEMINI_KEY',
    'GOOGLE_GEMINI_API_KEY',
    'NEXT_PUBLIC_GEMINI_API_KEY',
  ]

  // 1. Check process.env first
  for (const k of envKeys) {
    try {
      const val = process.env[k]
      if (val && typeof val === 'string' && val.trim() !== '' && !val.includes('your_gemini_api_key')) {
        console.log(`[Gemini] API key found — env var name: ${k}, length: ${val.trim().length} chars`)
        return val.trim()
      }
    } catch {
      // ignore
    }
  }

  // Log which names were checked and not found
  console.warn('[Gemini] API key NOT FOUND. Checked:', envKeys.join(', '))

  // 2. Check .env and .env.local in process.cwd() safely
  try {
    const cwd = process.cwd()
    const envPaths = [
      path.resolve(cwd, '.env'),
      path.resolve(cwd, '.env.local'),
    ]

    for (const envPath of envPaths) {
      if (fs.existsSync && fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        for (const k of envKeys) {
          const match = content.match(new RegExp(`^(?:${k})\\s*=\\s*(.+)$`, 'm'))
          if (match && match[1]) {
            const key = match[1].trim().replace(/^["']|["']$/g, '')
            if (key && !key.includes('your_gemini_api_key')) {
              console.log(`[Gemini] API key loaded from .env file — var: ${k}, length: ${key.length} chars`)
              return key
            }
          }
        }
      }
    }
  } catch {
    // ignore read errors
  }

  return ''
}

export interface ChatTurnMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequestBody {
  messages: ChatTurnMessage[]
  resumeText?: string
  sessionMode?: string
}

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
]

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
): Promise<{ text: string; error?: string; status?: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  console.log(`[Gemini] Gemini API request STARTED — model: ${model}, history length: ${history.length}`)

  const payload: any = {
    contents: history,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (fetchErr: any) {
    console.error(`[Gemini] Network error calling Gemini (model: ${model}):`, fetchErr?.message || fetchErr)
    return { text: '', error: `Network error: ${fetchErr?.message || fetchErr}` }
  }

  console.log(`[Gemini] Gemini API response RECEIVED — model: ${model}, HTTP status: ${res.status}`)

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`[Gemini] Gemini API error — model: ${model}, status: ${res.status}, body: ${errorText.slice(0, 500)}`)
    return {
      text: '',
      error: `Gemini API returned status ${res.status}: ${errorText}`,
      status: res.status,
    }
  }

  const data = (await res.json()) as any
  const candidate = data.candidates?.[0]
  if (!candidate) {
    console.error(`[Gemini] No candidate returned by model: ${model}. Full response: ${JSON.stringify(data).slice(0, 500)}`)
    return { text: '', error: 'No response candidate returned by Gemini.' }
  }

  const textPart = candidate.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || ''
  console.log(`[Gemini] SUCCESS — model: ${model}, response length: ${textPart.length} chars`)
  return { text: textPart.trim() }
}

export function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export async function parseRequestBody<T = any>(req: any): Promise<T> {
  // 1. If Vercel or Express pre-parsed req.body
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') {
      return req.body as T
    }
    if (typeof req.body === 'string' && req.body.trim()) {
      try {
        return JSON.parse(req.body) as T
      } catch {
        // Fallback to stream reading below
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf-8')) as T
      } catch {
        // Fallback to stream reading below
      }
    }
  }

  // 2. If request stream has already completed (common in serverless wrappers)
  if (req.complete || req.readableEnded) {
    return {} as T
  }

  // 3. Otherwise read stream data (for Vite dev server) with a 2.5s timeout safeguard
  return new Promise<T>((resolve) => {
    let body = ''
    let finished = false

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true
        try {
          resolve(body.trim() ? JSON.parse(body) : ({} as T))
        } catch {
          resolve({} as T)
        }
      }
    }, 2500)

    req.on('data', (chunk: any) => {
      body += chunk
    })

    req.on('end', () => {
      if (!finished) {
        finished = true
        clearTimeout(timeout)
        try {
          resolve(body.trim() ? JSON.parse(body) : ({} as T))
        } catch {
          resolve({} as T)
        }
      }
    })

    req.on('error', () => {
      if (!finished) {
        finished = true
        clearTimeout(timeout)
        resolve({} as T)
      }
    })
  })
}

export async function handleChatApi(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  res.setHeader('Content-Type', 'application/json')
  const stages: string[] = []

  // STAGE 1: REQUEST_RECEIVED
  stages.push('REQUEST_RECEIVED')
  console.log('[Chat API Stage] 1. REQUEST_RECEIVED')

  try {
    const parsed: ChatRequestBody = await parseRequestBody(req)
    const { messages, resumeText } = parsed || {}

    // STAGE 2: QUESTION_RECEIVED
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          error: 'Messages array is required in request body.',
          stageFailed: 'QUESTION_RECEIVED',
          stagesCompleted: stages,
        })
      )
      return
    }

    const latestUserQuestion = [...messages]
      .reverse()
      .find((m) => m.role === 'user' && m.content && m.content.trim())?.content?.trim()

    if (!latestUserQuestion) {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          error: 'No user question found in request messages.',
          stageFailed: 'QUESTION_RECEIVED',
          stagesCompleted: stages,
        })
      )
      return
    }

    stages.push('QUESTION_RECEIVED')
    console.log(`[Chat API Stage] 2. QUESTION_RECEIVED: "${latestUserQuestion.slice(0, 60)}..."`)

    // STAGE 3: API_KEY_FOUND
    const apiKey = getApiKey()
    if (!apiKey) {
      console.error('[Chat API Stage Error] STAGE API_KEY_FOUND failed: Key missing or empty in process.env')
      res.statusCode = 401
      res.end(
        JSON.stringify({
          error:
            'Gemini API key is not configured in environment variables. On Vercel, please add GEMINI_API_KEY in Project Settings -> Environment Variables.',
          stageFailed: 'API_KEY_FOUND',
          stagesCompleted: stages,
          missingKey: true,
        })
      )
      return
    }

    stages.push('API_KEY_FOUND')
    console.log('[Chat API Stage] 3. API_KEY_FOUND')

    // Build context including resume text if available
    let systemPrompt = PLACEMENT_COACH_SYSTEM_PROMPT
    if (resumeText && resumeText.trim().length > 20) {
      systemPrompt += `\n\n[USER RESUME CONTEXT (Uploaded by user)]:\n${resumeText.trim()}\n(Use this real resume data when the user asks questions about their resume or projects; do not invent credentials).`
    }

    // Format history into Gemini format
    const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

    for (const m of messages) {
      if (!m.content || !m.content.trim()) continue
      const role = m.role === 'assistant' ? 'model' : 'user'
      if (m.role === 'system') continue

      if (history.length > 0 && history[history.length - 1]!.role === role) {
        history[history.length - 1]!.parts.push({ text: m.content })
      } else {
        history.push({
          role,
          parts: [{ text: m.content }],
        })
      }
    }

    while (history.length > 0 && history[0]!.role !== 'user') {
      history.shift()
    }

    if (history.length === 0) {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          error: 'No valid user messages provided in conversation.',
          stageFailed: 'QUESTION_RECEIVED',
          stagesCompleted: stages,
        })
      )
      return
    }

    // STAGE 4 & 5: GEMINI_REQUEST_SENT & GEMINI_RESPONSE_RECEIVED
    let lastError = ''
    let finalResponseText = ''
    let sentStageAdded = false

    for (const model of CANDIDATE_MODELS) {
      if (!sentStageAdded) {
        stages.push('GEMINI_REQUEST_SENT')
        console.log(`[Chat API Stage] 4. GEMINI_REQUEST_SENT (model: ${model})`)
        sentStageAdded = true
      }

      try {
        const result = await callGemini(apiKey, model, systemPrompt, history)
        if (result.text) {
          finalResponseText = result.text
          stages.push('GEMINI_RESPONSE_RECEIVED')
          console.log(`[Chat API Stage] 5. GEMINI_RESPONSE_RECEIVED (model: ${model})`)
          break
        }
        if (result.status === 429) {
          lastError = `Gemini API rate limit (429) reached on ${model}.`
          continue
        }
        if (result.status === 503) {
          lastError = `Gemini model ${model} temporarily busy (503).`
          await new Promise((resolve) => setTimeout(resolve, 600))
          continue
        }
        lastError = result.error || 'Unknown error calling model ' + model
      } catch (err: any) {
        lastError = err?.message || String(err)
      }
    }

    if (!finalResponseText) {
      console.error('[Chat API Stage Error] STAGE GEMINI_RESPONSE_RECEIVED failed:', lastError)
      res.statusCode = 502
      res.end(
        JSON.stringify({
          error: lastError || 'Failed to get response from Gemini API. Please check GEMINI_API_KEY in Vercel.',
          stageFailed: 'GEMINI_RESPONSE_RECEIVED',
          stagesCompleted: stages,
        })
      )
      return
    }

    // STAGE 6: RESPONSE_RETURNED
    stages.push('RESPONSE_RETURNED')
    console.log('[Chat API Stage] 6. RESPONSE_RETURNED')

    // Optional non-blocking insert into chat_history table
    if (latestUserQuestion && finalResponseText) {
      try {
        await insertChatHistory(latestUserQuestion, finalResponseText)
      } catch (dbErr: any) {
        console.warn('[Supabase non-blocking warning]:', dbErr?.message || dbErr)
      }
    }

    res.statusCode = 200
    res.end(
      JSON.stringify({
        response: finalResponseText,
        stagesCompleted: stages,
      })
    )
  } catch (e: any) {
    console.error('[Chat API Internal Exception]:', e?.message || e)
    res.statusCode = 500
    res.end(
      JSON.stringify({
        error: `Internal server error: ${e?.message || e}`,
        stageFailed: 'INTERNAL_EXCEPTION',
        stagesCompleted: stages,
      })
    )
  }
}

export function handleHealthApi(req: IncomingMessage, res: ServerResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  res.setHeader('Content-Type', 'application/json')
  const apiKey = getApiKey()
  res.statusCode = 200
  res.end(
    JSON.stringify({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    })
  )
}

export async function handleHistoryApi(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

  if (req.method === 'POST') {
    try {
      const parsed = await parseRequestBody(req)
      const { question, answer } = parsed || {}
      if (!question) {
        res.statusCode = 400
        res.end(JSON.stringify({ success: false, error: 'Question is required' }))
        return
      }
      const insertRes = await insertChatHistory(question, answer || '')
      res.statusCode = insertRes.success ? 200 : 500
      res.end(JSON.stringify(insertRes))
    } catch (err: any) {
      console.error('[History API Error]:', err?.message || err)
      res.statusCode = 500
      res.end(JSON.stringify({ success: false, error: err?.message || String(err) }))
    }
    return
  }

  // GET handling
  try {
    const urlObj = new URL(req.url || '', 'https://placemate.app')
    const pageParam = urlObj.searchParams.get('page')
    const pageSizeParam = urlObj.searchParams.get('pageSize')

    const page = pageParam ? parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 20

    const result = await fetchChatHistory({ page, pageSize })

    res.statusCode = result.success ? 200 : 500
    res.end(JSON.stringify(result))
  } catch (err: any) {
    console.error('[History GET Error]:', err?.message || err)
    res.statusCode = 500
    res.end(
      JSON.stringify({
        success: false,
        records: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasMore: false,
        error: err?.message || String(err),
      })
    )
  }
}


