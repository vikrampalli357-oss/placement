import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

let cachedClient: SupabaseClient | null = null
let hasLoggedConfig = false

function getEnvValue(keys: string[]): string {
  // 1. Check process.env first
  for (const key of keys) {
    try {
      const val = process.env[key]
      if (val && typeof val === 'string' && val.trim() !== '') {
        return val.trim()
      }
    } catch {
      // ignore
    }
  }

  // 2. Check .env and .env.local files safely
  try {
    const cwd = process.cwd()
    const envPaths = [
      path.resolve(cwd, '.env'),
      path.resolve(cwd, '.env.local'),
    ]

    for (const envPath of envPaths) {
      if (fs.existsSync && fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        for (const key of keys) {
          const match = content.match(new RegExp(`^(?:${key})\\s*=\\s*(.+)$`, 'm'))
          if (match && match[1]) {
            const parsed = match[1].trim().replace(/^["']|["']$/g, '')
            if (parsed && !parsed.includes('your_supabase_') && !parsed.includes('your-project')) {
              return parsed
            }
          }
        }
      }
    }
  } catch {
    // ignore read error
  }

  return ''
}

export function getSupabaseCredentials(): { url: string; key: string } {
  const rawUrl = getEnvValue([
    'SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
  ])

  // Normalize URL by removing /rest/v1/ or trailing slash if passed
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')

  const key = getEnvValue([
    'SUPABASE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ])

  return { url, key }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient
  }

  const { url, key } = getSupabaseCredentials()

  if (!url || !key) {
    if (!hasLoggedConfig) {
      console.warn(
        '[Supabase] Notice: Supabase URL or Key not found in environment or .env. Chat history logging is currently inactive.'
      )
      hasLoggedConfig = true
    }
    return null
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    console.log(`[Supabase] Client initialized successfully for ${url}`)
    return cachedClient
  } catch (err: any) {
    console.error('[Supabase] Initialization error:', err?.message || err)
    return null
  }
}

/**
 * Inserts question, answer, and created_at into public.chat_history table.
 * Contains thorough error handling so any database error is gracefully logged
 * without interrupting the chatbot user experience.
 */
export async function insertChatHistory(
  question: string,
  answer: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const client = getSupabaseClient()
    if (!client) {
      return {
        success: false,
        error: 'Supabase credentials not configured in environment or .env',
      }
    }

    const payload = {
      question: question.trim(),
      answer: answer.trim(),
      created_at: new Date().toISOString(),
    }

    const { data, error } = await client
      .from('chat_history')
      .insert([payload])
      .select()

    if (error) {
      console.error('[Supabase] Insert to public.chat_history failed:', error.message)
      return { success: false, error: error.message }
    }

    console.log('[Supabase] Successfully saved chat to public.chat_history')
    return { success: true, data }
  } catch (err: any) {
    console.error('[Supabase] Exception during insert:', err?.message || err)
    return { success: false, error: err?.message || String(err) }
  }
}

export interface ChatHistoryRecord {
  id: number
  question: string
  answer: string
  created_at: string
}

export interface FetchChatHistoryOptions {
  page?: number
  pageSize?: number
}

export interface FetchChatHistoryResult {
  success: boolean
  records: ChatHistoryRecord[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  error?: string
}

/**
 * Fetches all saved chat history from public.chat_history table.
 * - Sorts by created_at DESC (newest first).
 * - No .limit(4) or fixed 4-record limit.
 * - Supports pagination (page, pageSize) or fetching larger batches with 'Load More'.
 */
export async function fetchChatHistory(
  options: FetchChatHistoryOptions = {}
): Promise<FetchChatHistoryResult> {
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.max(1, Number(options.pageSize) || 20)

  try {
    const client = getSupabaseClient()
    if (!client) {
      return {
        success: false,
        records: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
        error: 'Supabase credentials not configured in environment or .env',
      }
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await client
      .from('chat_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('[Supabase] Fetch from public.chat_history failed:', error.message)
      return {
        success: false,
        records: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
        error: error.message,
      }
    }

    const total = count ?? (data?.length || 0)
    const records = (data as ChatHistoryRecord[]) || []
    const hasMore = total > to + 1

    return {
      success: true,
      records,
      total,
      page,
      pageSize,
      hasMore,
    }
  } catch (err: any) {
    console.error('[Supabase] Exception during fetchChatHistory:', err?.message || err)
    return {
      success: false,
      records: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
      error: err?.message || String(err),
    }
  }
}

