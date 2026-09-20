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

  // --- Deep diagnostic for GEMINI_API_KEY specifically ---
  // Reveals WHY the check failed, without showing the actual value
  const rawVal = process.env['GEMINI_API_KEY']
  const geminiKeyDiagnostic = {
    exists: rawVal !== undefined,
    rawLength: rawVal !== undefined ? rawVal.length : null,
    trimmedLength: rawVal !== undefined ? rawVal.trim().length : null,
    isEmpty: rawVal === '',
    isUndefined: rawVal === undefined,
    containsPlaceholder: rawVal ? rawVal.includes('your_gemini') : false,
    // First 4 chars only — safe to confirm it starts with AIza
    startsWithAIza: rawVal ? rawVal.trim().startsWith('AIza') : false,
    firstFourChars: rawVal && rawVal.trim().length >= 4 ? rawVal.trim().slice(0, 4) : null,
  }

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
      relatedEnvVarNamesFound: relatedKeyNames,

      // --- Total env vars visible to this function ---
      totalEnvVarsVisible: totalEnvCount,

      // --- WHY the GEMINI_API_KEY check failed ---
      geminiKeyDiagnostic,
    })
  )
}

