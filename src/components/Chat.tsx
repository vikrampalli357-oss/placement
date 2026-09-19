import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { SUGGESTIONS, SUGGESTION_TEXT, applyResume, handleTurn } from '../engine/coach'
import type { ChatMessage, CoachSession } from '../types'
import { MessageBody } from './MessageBody'

function uid() {
  return crypto.randomUUID()
}

interface HistoryItem {
  id: number
  question: string
  answer: string
  created_at: string
}

const INTRO: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  text: `👋 Welcome to **PlaceMate AI** – your intelligent AI Placement Coach!

You can ask me **ANY question** related to campus placements without needing to pick a category:
• **Quantitative Aptitude & Logical Reasoning**: "Solve this: A train travels 360 km in 4 hours", "Solve 20% of 450", "Explain percentage shortcuts"
• **Coding & DSA**: "Give me a Python coding question", "Teach me arrays", "Why am I getting this Python error?", "What is DSA?"
• **Interactive Mock Interviews**: "Start a mock interview", "Ask me HR interview questions", "Ask me Python interview questions"
• **Technical Subjects**: "What is DBMS normalization?", "Explain inheritance with an example", "What is supervised learning?"
• **Resume & Project Prep**: "How can I improve my resume?", "How should I explain my project in an interview?"
• **Company Preparation**: "How do I prepare for TCS?", "Infosys placement tips", "Amazon technical round"
• **Custom Study Schedules**: "I have 15 days for placement preparation. Give me a plan."
• **General Career Strategy**: "What should I prepare for campus placements?", "How do I introduce myself in HR?"

Type your question below or click a suggestion to begin!`,
}

function formatHistoryDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

const MAX_TEXTAREA_HEIGHT = 160

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState<CoachSession>({ mode: 'idle' })
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat')
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  // Dark Theme State with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('pm_theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pm_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Supabase Chat History state
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyTotal, setHistoryTotal] = useState<number>(0)
  const [historyPage, setHistoryPage] = useState<number>(1)
  const [historyHasMore, setHistoryHasMore] = useState<boolean>(false)
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [historyLoadedOnce, setHistoryLoadedOnce] = useState<boolean>(false)

  const sessionRef = useRef(session)
  const threadRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Track whether user is manually scrolled up (don't hijack scroll)
  const isAtBottomRef = useRef(true)
  const userScrolledUpRef = useRef(false)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  // Auto-resize textarea upward
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    // Reset height to auto first so shrinking works
    ta.style.height = 'auto'
    const newHeight = Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)
    ta.style.height = `${Math.max(40, newHeight)}px`
    ta.style.overflowY = ta.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden'
  }, [input])

  // Scroll position tracker to decide whether to auto-scroll
  const handleThreadScroll = useCallback(() => {
    const el = threadRef.current
    if (!el) return
    const threshold = 80
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distFromBottom < threshold
    userScrolledUpRef.current = distFromBottom > threshold
    setShowScrollBottom(distFromBottom > threshold)
  }, [])

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.addEventListener('scroll', handleThreadScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleThreadScroll)
  }, [handleThreadScroll])

  // Smart auto-scroll: only scroll if user is at or near the bottom
  useEffect(() => {
    if (activeTab !== 'chat') return
    if (isAtBottomRef.current || !userScrolledUpRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, busy, activeTab])

  function scrollToBottom() {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
    isAtBottomRef.current = true
    userScrolledUpRef.current = false
    setShowScrollBottom(false)
  }

  // Initial load: Fetch total count from Supabase
  useEffect(() => {
    fetch('/api/history?page=1&pageSize=1')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === 'number') {
          setHistoryTotal(data.total)
        }
      })
      .catch(() => {})
  }, [])

  async function loadHistory(page = 1, append = false) {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/history?page=${page}&pageSize=10`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.records) {
        setHistory((prev) => (append ? [...prev, ...data.records] : data.records))
        setHistoryTotal(data.total || 0)
        setHistoryHasMore(Boolean(data.hasMore))
        setHistoryPage(page)
        setHistoryLoadedOnce(true)
      }
    } catch (err) {
      console.error('[Supabase History] Fetch error:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  function onSwitchToHistory() {
    setActiveTab('history')
    if (!historyLoadedOnce) {
      void loadHistory(1, false)
    }
  }

  function handleFollowUp(questionText: string) {
    setActiveTab('chat')
    const promptText = `Follow-up regarding "${questionText.length > 60 ? questionText.slice(0, 60) + '...' : questionText}": `
    setInput(promptText)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  async function ask(q: string) {
    const text = q.trim()
    if (!text || busy) return
    const user: ChatMessage = { id: uid(), role: 'user', text }
    const nextMessages = [...messages, user]
    setMessages(nextMessages)
    setInput('')
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '40px'
      inputRef.current.style.overflowY = 'hidden'
    }
    setBusy(true)
    // Force scroll to bottom when user sends message
    isAtBottomRef.current = true
    userScrolledUpRef.current = false
    setShowScrollBottom(false)

    try {
      const result = await handleTurn(text, sessionRef.current, nextMessages)
      sessionRef.current = result.session
      setSession(result.session)
      setMessages((m) => [...m, ...result.messages])
      setHistoryTotal((prev) => prev + 1)
      if (historyLoadedOnce) {
        void loadHistory(1, false)
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          error: `Error answering: ${err?.message || 'Please check your connection and try again.'}`,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void ask(input)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void ask(input)
    }
  }

  async function onResumeFile(file: File | undefined) {
    if (!file) return
    if (!file.name.endsWith('.txt') && file.type && !file.type.startsWith('text/')) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: 'Please upload a plain text (.txt) resume file, or paste your resume content directly into the chat.',
        },
      ])
      return
    }
    const resumeText = await file.text()
    const next = applyResume(sessionRef.current, resumeText)
    sessionRef.current = next
    setSession(next)
    setMessages((m) => [
      ...m,
      { id: uid(), role: 'user', text: `Uploaded resume: ${file.name}` },
      {
        id: uid(),
        role: 'assistant',
        text: `📄 **Resume saved for this session!**\n\nI will use this context whenever you ask for resume feedback, bullet improvements, or project interview defense questions. Ask: *"How can I improve my resume?"* or *"Ask me questions based on my project."*`,
      },
    ])
  }

  const ph =
    session.mode === 'interview'
      ? 'Type your interview answer (or "stop" to finish)…'
      : 'Ask anything about placement preparation...'

  const hasInput = input.trim().length > 0

  return (
    <div className="pane">
      {/* ── Fixed Header ── */}
      <header className="pane-head">
        <div className="brand-inline">
          <span className="mark" aria-hidden="true">🤖</span>
          <div className="brand-text">
            <div className="head-title-row">
              <h1>PlaceMate AI</h1>
              <span className="ai-badge">AI Placement Coach</span>
            </div>
            <p>Your AI Placement Preparation Coach</p>
          </div>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <div className="tab-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Active Chat
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={onSwitchToHistory}
        >
          📜 Chat History
          {historyTotal > 0 ? (
            <span className="tab-count-badge" title={`${historyTotal} total chats saved in Supabase`}>
              {historyTotal}
            </span>
          ) : null}
        </button>
      </div>

      {activeTab === 'history' ? (
        /* ── Supabase Chat History View (scrollable) ── */
        <div className="history-container">
          <div className="history-toolbar">
            <div className="history-toolbar-info">
              Showing <strong>{history.length}</strong> of <strong>{historyTotal}</strong> saved questions &amp; answers
            </div>
            <button
              type="button"
              className="history-refresh-btn"
              onClick={() => void loadHistory(1, false)}
              disabled={historyLoading}
              title="Refresh history from Supabase"
            >
              🔄 {historyLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {historyLoading && history.length === 0 ? (
            <div className="history-loading">⏳ Loading chat history from Supabase...</div>
          ) : null}

          {!historyLoading && history.length === 0 ? (
            <div className="history-empty">
              No chat history records found. Ask a question in Active Chat to save your first conversation!
            </div>
          ) : null}

          {history.map((record) => (
            <div key={record.id} className="history-card">
              <div className="history-card-head">
                <span className="history-q-badge">Student Question</span>
                <time className="history-time">{formatHistoryDate(record.created_at)}</time>
              </div>
              <div className="history-q-content">{record.question}</div>
              <div className="history-a-divider">
                <span>🤖 PlaceMate AI Answer</span>
              </div>
              <div className="history-a-content">
                <MessageBody text={record.answer} />
              </div>
              <div className="history-card-footer">
                <button
                  type="button"
                  className="history-reuse-btn"
                  onClick={() => handleFollowUp(record.question)}
                  title="Ask a follow-up about this topic in the active chat"
                >
                  💬 Continue in Chat
                </button>
              </div>
            </div>
          ))}

          {historyHasMore ? (
            <div className="load-more-container">
              <button
                type="button"
                className="load-more-btn"
                onClick={() => void loadHistory(historyPage + 1, true)}
                disabled={historyLoading}
              >
                {historyLoading ? '⏳ Loading more...' : '⬇️ Load More History'}
              </button>
            </div>
          ) : null}

          {!historyHasMore && history.length > 0 ? (
            <div className="history-end-note">
              ✓ All {historyTotal} saved records loaded. Sorted newest first.
            </div>
          ) : null}
        </div>
      ) : (
        /* ── Active Chat View ── */
        <>
          {/* Scrollable messages area – ONLY this scrolls */}
          <div
            className="thread"
            ref={threadRef}
            role="log"
            aria-live="polite"
          >
            {messages.map((m) => (
              <div key={m.id} className={`bubble-row ${m.role}`}>
                {m.role === 'assistant' ? (
                  <div className="avatar assistant-avatar" title="PlaceMate AI">🤖</div>
                ) : null}
                <div className={`bubble ${m.role}`}>
                  {m.role === 'assistant' ? (
                    <div className="ai-message-header">
                      <span className="ai-name">PlaceMate AI</span>
                    </div>
                  ) : null}
                  <MessageBody text={m.text} blocks={m.blocks} outcome={m.outcome} error={m.error} />
                  {m.interview?.prompt ? <p className="pre">{m.interview.prompt}</p> : null}
                  {m.interview?.score != null ? <p className="score">⭐ Score: {m.interview.score}/10</p> : null}
                  {m.interview?.feedback ? <p className="pre">{m.interview.feedback}</p> : null}
                  {m.interview?.followUp ? <p className="pre follow">{m.interview.followUp}</p> : null}
                  {m.interview?.summary ? <p className="pre final-plain">{m.interview.summary}</p> : null}
                </div>
              </div>
            ))}

            {busy ? (
              <div className="bubble-row assistant">
                <div className="avatar assistant-avatar">🤖</div>
                <div className="bubble assistant typing" aria-label="Thinking">
                  <span /><span /><span />
                </div>
              </div>
            ) : null}
            <div ref={endRef} style={{ height: '1px' }} />
          </div>

          {/* Floating scroll-to-bottom button */}
          {showScrollBottom ? (
            <button
              type="button"
              className="scroll-to-bottom-btn"
              onClick={scrollToBottom}
              title="Scroll to latest message"
              aria-label="Scroll to latest message"
            >
              ↓
            </button>
          ) : null}

          {/* ── Fixed Bottom Composer – NEVER scrolls ── */}
          <div className="composer">
            {session.resumeText ? (
              <div className="active-context-bar">
                <span>📄 Resume text loaded ({session.resumeText.length} chars)</span>
                <button
                  type="button"
                  className="clear-resume"
                  onClick={() => {
                    const next = { ...session, resumeText: undefined }
                    sessionRef.current = next
                    setSession(next)
                  }}
                  title="Clear loaded resume"
                >
                  × Clear
                </button>
              </div>
            ) : null}

            {/* Suggestion chips – horizontal scroll on mobile */}
            <ul className="chips" aria-label="Quick suggestions">
              {SUGGESTIONS.map((p) => (
                <li key={p}>
                  <button type="button" onClick={() => void ask(SUGGESTION_TEXT[p] ?? p)} disabled={busy}>
                    {p}
                  </button>
                </li>
              ))}
            </ul>

            {/* ChatGPT-style input box */}
            <form onSubmit={onSubmit}>
              <div className="chatgpt-input-box">
                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="sr"
                  onChange={(e) => {
                    void onResumeFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />

                {/* Resume attach button */}
                <button
                  type="button"
                  className="chatgpt-attach-btn"
                  onClick={() => fileRef.current?.click()}
                  title="Upload resume (.txt)"
                  disabled={busy}
                  aria-label="Attach resume file"
                >
                  📎
                </button>

                {/* Auto-expanding textarea */}
                <label className="sr" htmlFor="ask">Message</label>
                <textarea
                  id="ask"
                  ref={inputRef}
                  className="chatgpt-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={ph}
                  rows={1}
                  autoComplete="off"
                  disabled={busy}
                  style={{ height: '40px', overflowY: 'hidden' }}
                />

                {/* Send button – grey when empty, vibrant when has text */}
                <button
                  type="submit"
                  className={`chatgpt-send-btn${hasInput && !busy ? ' active' : ''}`}
                  disabled={!hasInput || busy}
                  aria-label="Send message"
                  title="Send (Enter)"
                >
                  ↑
                </button>
              </div>

              <p className="chatgpt-disclaimer">
                PlaceMate AI may occasionally make mistakes. Verify important information.
              </p>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
