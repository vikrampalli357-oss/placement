import type { IncomingMessage, ServerResponse } from 'http'

// The exact env var names the code checks, in priority order.
// The first one that is non-empty and valid is used.
const CHECKED_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'VITE_GEMINI_API_KEY',
  'GEMINI_KEY',
  'GOOGLE_GEMINI_API_KEY',
  'NEXT_PUBLIC_GEMINI_API_KEY',
] as const

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  // Find which key (if any) is configured — NEVER log the value itself
  let foundKey: string | null = null
  let keyLength = 0
  const checkedResults: Record<string, string> = {}

  for (const k of CHECKED_KEYS) {
    const val = process.env[k]
    if (val && val.trim() && !val.includes('your_gemini')) {
      if (!foundKey) {
        foundKey = k
        keyLength = val.trim().length
      }
      checkedResults[k] = 'SET'
    } else {
      checkedResults[k] = 'NOT SET'
    }
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      // Safe: says YES or NO, never the key value
      geminiApiKeyConfigured: foundKey !== null ? 'YES' : 'NO',
      // Which var name was found first (safe — just the name, not the value)
      activeKeyName: foundKey ?? null,
      // How many chars long the key is (safe — lets you verify it isn't empty/truncated)
      activeKeyLength: keyLength > 0 ? keyLength : null,
      // Status of every checked var name (safe — SET or NOT SET only)
      checkedVariables: checkedResults,
    })
  )
}
