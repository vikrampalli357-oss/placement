import type { IncomingMessage, ServerResponse } from 'http'

// The exact env var names the Gemini server code checks, in priority order.
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

  // --- Check the exact names the code uses ---
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

  // --- Scan ALL env var NAMES for anything Gemini/Google related ---
  // SAFE: only reports the KEY NAMES, never the values
  const allEnvKeys = Object.keys(process.env)
  const relatedKeyNames = allEnvKeys.filter((k) =>
    /gemini|google|api_key/i.test(k)
  )

  // Count total env vars so we know Vercel is injecting them at all
  const totalEnvCount = allEnvKeys.length

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),

      // --- Primary result ---
      geminiApiKeyConfigured: foundKey !== null ? 'YES' : 'NO',
      activeKeyName: foundKey ?? null,
      activeKeyLength: keyLength > 0 ? keyLength : null,

      // --- Exact names the code checks ---
      checkedVariables: checkedResults,

      // --- DIAGNOSTIC: all env var NAMES that mention gemini/google/api_key ---
      // This reveals the exact name Vercel has stored (without the value)
      relatedEnvVarNamesFound: relatedKeyNames,

      // --- Total env vars visible to this function ---
      totalEnvVarsVisible: totalEnvCount,
    })
  )
}
