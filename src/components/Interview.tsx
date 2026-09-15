import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  INTERVIEW_BANK,
  TRACKS,
  evaluateAnswer,
  overallInterviewScore,
} from '../engine/interview'
import type { ChatMessage, InterviewTrack } from '../types'

function uid() {
  return crypto.randomUUID()
}

export function Interview() {
  const [track, setTrack] = useState<InterviewTrack | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [phase, setPhase] = useState<'ask' | 'follow'>('ask')
  const [scores, setScores] = useState<number[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [done, setDone] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function begin(t: InterviewTrack) {
    const first = INTERVIEW_BANK[t][0]
    setTrack(t)
    setQIndex(0)
    setPhase('ask')
    setScores([])
    setDone(false)
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        interview: {
          prompt: `This is a ${t} mock interview. I will ask one question at a time, score your answer out of 10 in this chat, then follow up. There is no separate results website — your scores stay in the conversation.\n\n${first?.prompt}`,
        },
      },
    ])
  }

  function send(raw: string) {
    if (!track || done) return
    const text = raw.trim()
    if (!text) return
    const bank = INTERVIEW_BANK[track]
    const q = bank[qIndex]
    if (!q) return

    setMessages((m) => [...m, { id: uid(), role: 'user', text }])
    setInput('')

    if (phase === 'ask') {
      const ev = evaluateAnswer(q, text)
      setScores((s) => [...s, ev.score])
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          interview: {
            score: ev.score,
            feedback: ev.feedback,
            followUp: `Follow-up: ${ev.followUp}`,
          },
        },
      ])
      setPhase('follow')
      return
    }

    const ev = evaluateAnswer(
      { ...q, keywords: q.keywords, modelPoints: q.modelPoints, prompt: q.followUp, followUp: '' },
      text,
    )
    const allScores = [...scores, ev.score]
    setScores(allScores)
    const next = qIndex + 1
    if (next >= bank.length) {
      const overall = overallInterviewScore(allScores)
      setDone(true)
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          interview: {
            score: ev.score,
            feedback: ev.feedback,
            done: true,
            summary: `Interview complete. Average score: ${overall}/10 across ${allScores.length} graded answers. Review the chat above — that is your full feedback transcript.`,
          },
        },
      ])
      return
    }
    const nxt = bank[next]
    setQIndex(next)
    setPhase('ask')
    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: 'assistant',
        interview: {
          score: ev.score,
          feedback: ev.feedback,
          prompt: `Next question:\n${nxt?.prompt}`,
        },
      },
    ])
  }

  if (!track) {
    return (
      <div className="pane">
        <header className="pane-head">
          <h1>AI mock interview</h1>
          <p>Chat only. Pick HR, Coding, or another track — I ask, you answer, I score out of 10 and follow up.</p>
        </header>
        <ul className="tracks">
          {TRACKS.map((t) => (
            <li key={t}>
              <button type="button" onClick={() => begin(t)}>
                <strong>{t}</strong>
                <span>{INTERVIEW_BANK[t].length} questions · live scoring in chat</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="pane">
      <header className="pane-head">
        <h1>{track} interview</h1>
        <p>Question {Math.min(qIndex + 1, INTERVIEW_BANK[track].length)} of {INTERVIEW_BANK[track].length} · scores appear in the chat</p>
      </header>
      <div className="thread" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`bubble-row ${m.role}`}>
            <div className={`bubble ${m.role}`}>
              {m.text ? <p className="pre">{m.text}</p> : null}
              {m.interview?.prompt ? <p className="pre">{m.interview.prompt}</p> : null}
              {m.interview?.score != null ? (
                <p className="score">Score: {m.interview.score}/10</p>
              ) : null}
              {m.interview?.feedback ? <p className="pre">{m.interview.feedback}</p> : null}
              {m.interview?.followUp ? <p className="pre follow">{m.interview.followUp}</p> : null}
              {m.interview?.summary ? <p className="final">{m.interview.summary}</p> : null}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="composer">
        {done ? (
          <button type="button" className="go" onClick={() => setTrack(null)}>
            New interview
          </button>
        ) : (
          <form
            className="bar"
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              send(input)
            }}
          >
            <label className="sr" htmlFor="ans">
              Your answer
            </label>
            <textarea
              id="ans"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your interview answer…"
              rows={3}
              autoComplete="off"
            />
            <button type="submit" className="go">
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
