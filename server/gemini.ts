import type { IncomingMessage, ServerResponse } from 'http'
import * as fs from 'fs'
import * as path from 'path'

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
  // Check process.env first
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    return process.env.GEMINI_API_KEY.trim()
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim() !== '') {
    return process.env.GOOGLE_API_KEY.trim()
  }

  // Check .env in current directory or project root
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
  ]

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8')
        const match = content.match(/^(?:GEMINI_API_KEY|GOOGLE_API_KEY)\s*=\s*(.+)$/m)
        if (match && match[1]) {
          const key = match[1].trim().replace(/^["']|["']$/g, '')
          if (key && key !== 'your_gemini_api_key_here') {
            return key
          }
        }
      } catch {
        // ignore read errors
      }
    }
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
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
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

export async function handleChatApi(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')

  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })

  req.on('end', async () => {
    try {
      if (!body.trim()) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Request body is empty.' }))
        return
      }

      const parsed: ChatRequestBody = JSON.parse(body)
      const { messages, resumeText } = parsed

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Messages array is required.' }))
        return
      }

      const apiKey = getApiKey()
      if (!apiKey) {
        res.statusCode = 401
        res.end(
          JSON.stringify({
            error:
              'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file or set it as an environment variable.',
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
      // Group consecutive turns and map 'assistant' to 'model'
      const history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
      
      for (const m of messages) {
        if (!m.content || !m.content.trim()) continue
        const role = m.role === 'assistant' ? 'model' : 'user'
        // Skip system role in contents as it's passed via systemInstruction
        if (m.role === 'system') continue

        // Ensure alternating roles or combine if needed
        if (history.length > 0 && history[history.length - 1]!.role === role) {
          history[history.length - 1]!.parts.push({ text: m.content })
        } else {
          history.push({
            role,
            parts: [{ text: m.content }],
          })
        }
      }

      // Ensure the first message is from 'user'
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
            // try next model
            continue
          }
          if (result.status === 503) {
            lastError = 'Gemini model temporarily at high demand. Trying alternate model...'
            // wait 600ms then try next model
            await new Promise((resolve) => setTimeout(resolve, 600))
            continue
          }
          lastError = result.error || 'Unknown error calling model ' + model
        } catch (err: any) {
          lastError = err?.message || String(err)
        }
      }

      if (!finalResponseText) {
        res.statusCode = 502
        res.end(
          JSON.stringify({
            error: lastError || 'Failed to get response from Gemini API. Please verify your connection and key.',
          })
        )
        return
      }

      res.statusCode = 200
      res.end(JSON.stringify({ response: finalResponseText }))
    } catch (e: any) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: `Internal server error: ${e?.message || e}` }))
    }
  })
}

export function handleHealthApi(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')
  const apiKey = getApiKey()
  res.statusCode = 200
  res.end(
    JSON.stringify({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
    })
  )
}
