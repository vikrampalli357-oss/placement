import { useEffect, useRef, useState, type FormEvent } from 'react'
import { SUGGESTIONS, SUGGESTION_TEXT, applyResume, handleTurn } from '../engine/coach'
import type { ChatMessage, CoachSession } from '../types'
import { MessageBody } from './MessageBody'

function uid() {
  return crypto.randomUUID()
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

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState<CoachSession>({ mode: 'idle' })
  const sessionRef = useRef(session)
  const end = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function ask(q: string) {
    const text = q.trim()
    if (!text || busy) return
    const user: ChatMessage = { id: uid(), role: 'user', text }
    const nextMessages = [...messages, user]
    setMessages(nextMessages)
    setInput('')
    setBusy(true)

    try {
      const result = await handleTurn(text, sessionRef.current, nextMessages)
      sessionRef.current = result.session
      setSession(result.session)
      setMessages((m) => [...m, ...result.messages])
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

  return (
    <div className="pane">
      <header className="pane-head">
        <div className="brand-inline">
          <span className="mark" aria-hidden="true">
            PM
          </span>
          <div>
            <div className="head-title-row">
              <h1>PlaceMate AI</h1>
              <span className="ai-badge">AI Placement Coach Active</span>
            </div>
            <p>Your 24/7 intelligent coach for aptitude, coding, technical rounds, mock interviews, and career plans</p>
          </div>
        </div>
      </header>

      <div className="thread" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`bubble-row ${m.role}`}>
            <div className={`bubble ${m.role}`}>
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
            <div className="bubble assistant typing" aria-label="Thinking">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
        <div ref={end} />
      </div>

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

        <ul className="chips">
          {SUGGESTIONS.map((p) => (
            <li key={p}>
              <button type="button" onClick={() => void ask(SUGGESTION_TEXT[p] ?? p)} disabled={busy}>
                {p}
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={onSubmit} className="bar">
          <label className="sr" htmlFor="ask">
            Message
          </label>
          <button
            type="button"
            className="attach"
            onClick={() => fileRef.current?.click()}
            title="Upload resume text (.txt)"
            disabled={busy}
          >
            📎 Resume
          </button>
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
          <textarea
            id="ask"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void ask(input)
              }
            }}
            placeholder={ph}
            rows={2}
            autoComplete="off"
            disabled={busy}
          />
          <button type="submit" className="go" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
