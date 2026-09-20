import type { IncomingMessage, ServerResponse } from 'node:http'
import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import { insertChatHistory, fetchChatHistory } from './supabase.js'

// System Prompt for PlaceMate AI Placement Coach
export const PLACEMENT_COACH_SYSTEM_PROMPT = `You are PlaceMate AI – an intelligent AI Placement Coach and mentor for college students preparing for campus placements, technical interviews, coding rounds, and job recruitment.

You possess deep expertise across all aspects of college placements:
- Quantitative Aptitude, Logical Reasoning, and Verbal Ability
- Coding, DSA (Data Structures & Algorithms), Time and Space Complexity
- Programming Languages: Python, Java, C++, C, SQL, JavaScript
- Core CS Technical Subjects: DBMS, Operating Systems, Computer Networks, OOP, System Design, AI/ML, Generative AI
- Mock Interviews: Interactive HR, Technical, Python, SQL, AI/ML, DSA, and Project-based rounds
- Resume & Project preparation: ATS compliance, STAR method, project defense, role explanation
- Company-specific preparation: TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, Deloitte, IBM, Amazon, Microsoft, Google, etc.
- Custom Study Plans: 7-day, 15-day, 30-day schedules, roadmap for beginners or students weak in coding
- General placement guidance: Self-introduction ("Tell me about yourself"), attire, body language, interview anxiety, answering difficult questions.

==================================================
CRITICAL BEHAVIOR GUIDELINES
==================================================
1. TONE & STYLE:
   - Use clear, professional, friendly, and encouraging English suitable for college students.
   - Be accurate, structured, and direct. Avoid rambling.
   - Format responses using clean markdown (bold headers, bullet points, numbered lists, tables when useful).

2. APTITUDE QUESTIONS:
   Whenever the user asks an aptitude question (math, numbers, speeds, percentages, profit/loss, time/work, etc.):
   Follow these 8 steps strictly:
   1. Identify the topic.
   2. Understand the question.
   3. Select the correct formula.
   4. Calculate carefully.
   5. Verify the calculation.
   6. Explain step-by-step.
   7. Give the final answer clearly.
   8. Give a shortcut/quick tip when useful.

   Always format the aptitude response exactly like this:
   Topic: [Topic Name]

   Formula:
   [Formula]

   Solution:
   [Clear step-by-step calculation]

   Final Answer:
   [Final answer with units highlighted]

   Quick Tip:
   [Shortcut, intuition, or speed trick]

   NEVER guess mathematical answers. Double-check all arithmetic.

3. CODING & DSA:
   - When asked for a coding question, provide a realistic placement-level problem with clear problem statement, sample inputs/outputs, constraints, and hints.
   - When asked to teach or explain code, explain concepts clearly and provide well-commented code.
   - For user-submitted code or errors, identify the root cause, explain why the error occurs, and provide the clean corrected code.
   - If the user asks for a hint, provide a guided hint first instead of immediately revealing the entire solution.
   - Always analyze and state Time Complexity and Space Complexity using Big-O notation.

4. MOCK INTERVIEW MODE:
   When the user asks to "Start a mock interview", "Ask me interview questions", or practice HR/Technical/Python/SQL/AI/ML/DSA/Project interviews:
   - Conduct an interactive 1-on-1 interview.
   - Ask ONE question at a time.
   - Wait for the user's answer.
   - When the user answers, evaluate their response:
     * Give an honest score out of 10 (Format: "Score: X/10")
     * Strengths: What was good in their answer
     * Weaknesses: What was missing or could be improved
     * Improved Answer: How a top candidate would phrase it
     * Next Question: Ask the next relevant follow-up or next question in the track.
   - Maintain the interview flow until the user says "stop", "end", or completes the session.

5. RESUME & PROJECT HELP:
   - Give actionable feedback on resume bullets (Action Verb + Task + Quantifiable Impact/Result).
   - Help explain projects using the STAR framework (Situation, Task, Action, Result).
   - NEVER invent or hallucinate false experiences, grades, or projects that the user did not provide.

6. COMPANY PREPARATION:
   - Provide realistic, structured preparation roadmaps for companies (TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, Amazon, etc.).
   - Cover Aptitude patterns, Technical expectations, Coding level, HR rounds, and strategy.
   - Do NOT claim that any question is guaranteed or leaked from actual company papers.

7. STUDY PLANS:
   - Create practical, day-by-day schedules (7 days, 15 days, 30 days, etc.) balancing Aptitude + Coding + Core CS + Interview Practice.

8. OFF-TOPIC QUESTIONS:
   - If the user asks something completely unrelated to college placements, career, or computer science (e.g., cooking recipes, movies, sports gossip):
     Politely reply:
     "I'm your Placement Preparation Assistant. I can help with aptitude, coding, DSA, interviews, technical subjects, resumes, company preparation, study plans, and other placement-related questions."
   - If a question is even indirectly relevant to placements or tech (e.g., "What is Python?", "Explain cloud computing", "What is an API?"), always answer it thoroughly in a placement-relevant context.

9. CONVERSATION CONTEXT & MEMORY:
   - Always track prior messages in the conversation.
   - When user says "Give me questions" after discussing Python, understand they want Python placement questions.
   - When user says "Make them harder" or "Give me a hint", apply it directly to the active topic without making them repeat context.
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
        return val.trim()
      }
    } catch {
      // ignore
    }
  }

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
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
]

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
): Promise<{ text: string; error?: string; status?: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

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

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorText = await res.text()
    return {
      text: '',
      error: `Gemini API returned status ${res.status}: ${errorText}`,
      status: res.status,
    }
  }

  const data = (await res.json()) as any
  const candidate = data.candidates?.[0]
  if (!candidate) {
    return { text: '', error: 'No response candidate returned by Gemini.' }
  }

  const textPart = candidate.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || ''
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

  try {
    const parsed: ChatRequestBody = await parseRequestBody(req)
    const { messages, resumeText } = parsed || {}

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Messages array is required in request body.' }))
      return
    }

    const apiKey = getApiKey()
    if (!apiKey) {
      console.error('[Gemini API Error] GEMINI_API_KEY environment variable is missing!')
      res.statusCode = 401
      res.end(
        JSON.stringify({
          error:
            'Gemini API key is not configured in environment variables. On Vercel, please add GEMINI_API_KEY in Project Settings -> Environment Variables.',
          missingKey: true,
        })
      )
      return
    }

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
      res.end(JSON.stringify({ error: 'No user messages provided in conversation.' }))
      return
    }

    // Try candidate models
    let lastError = ''
    let finalResponseText = ''

    for (const model of CANDIDATE_MODELS) {
      try {
        const result = await callGemini(apiKey, model, systemPrompt, history)
        if (result.text) {
          finalResponseText = result.text
          break
        }
        if (result.status === 429) {
          lastError = 'Gemini API rate limit reached. Please wait a moment and try again.'
          continue
        }
        if (result.status === 503) {
          lastError = 'Gemini model temporarily at high demand. Trying alternate model...'
          await new Promise((resolve) => setTimeout(resolve, 600))
          continue
        }
        lastError = result.error || 'Unknown error calling model ' + model
      } catch (err: any) {
        lastError = err?.message || String(err)
      }
    }

    if (!finalResponseText) {
      console.error('[Gemini API Error] Candidate models failed:', lastError)
      res.statusCode = 502
      res.end(
        JSON.stringify({
          error: lastError || 'Failed to get response from Gemini API. Please check GEMINI_API_KEY in Vercel.',
        })
      )
      return
    }

    // Save to Supabase public.chat_history table before responding
    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content || ''

    if (latestUserMessage && finalResponseText) {
      try {
        const insertRes = await insertChatHistory(latestUserMessage, finalResponseText)
        if (insertRes.success) {
          console.log('[Supabase] Successfully committed to public.chat_history before response')
        } else {
          console.warn('[Supabase] Warning during insert:', insertRes.error)
        }
      } catch (dbErr: any) {
        console.error('[Supabase] Failed to insert chat history:', dbErr?.message || dbErr)
      }
    }

    res.statusCode = 200
    res.end(JSON.stringify({ response: finalResponseText }))
  } catch (e: any) {
    console.error('[Chat API Internal Error]:', e?.message || e)
    res.statusCode = 500
    res.end(JSON.stringify({ error: `Internal server error: ${e?.message || e}` }))
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


