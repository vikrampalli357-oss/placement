import type {
  ChatMessage,
  CoachSession,
  ContentBlock,
  Difficulty,
  InterviewTrack,
  SolveOutcome,
} from '../types'
import { answerAptitude } from './aptitude'
import { explainCodeIssue, pickCodingProblem } from './coding'
import { detectIntent, looksLikeMathQuestion } from './intent'
import { INTERVIEW_BANK, evaluateAnswer, overallInterviewScore } from './interview'
import { companyPrep, generalPlacement, resumeAdvice, studyPlan, technicalAnswer, pythonProgramAnswer } from './knowledge'
import { parseResponseBlocks, tryExtractAptitudeCard } from './parseBlocks'
import { ALL_TOPICS, buildQuiz, summarizePractice } from './practice'

function uid() {
  return crypto.randomUUID()
}

function text(s: string): ContentBlock[] {
  return [{ type: 'text', text: s }]
}

function assistant(partial: Omit<ChatMessage, 'id' | 'role'>): ChatMessage {
  return { id: uid(), role: 'assistant', ...partial }
}

function formatMcq(q: { prompt: string; options: string[]; topic: string; difficulty: string }, index: number, total: number) {
  const opts = q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')
  return `Question ${index + 1} of ${total} · ${q.topic} · ${q.difficulty}\n\n${q.prompt}\n\n${opts}\n\nReply with A, B, C, or D.`
}

function wrapInterview(track: InterviewTrack, session: CoachSession): { session: CoachSession; msg: ChatMessage } {
  const bank = INTERVIEW_BANK[track]
  const first = bank[0]!
  const next: CoachSession = {
    ...session,
    mode: 'interview',
    interview: { track, qIndex: 0, phase: 'ask', scores: [], notes: [] },
  }
  return {
    session: next,
    msg: assistant({
      interview: {
        prompt: `Starting a ${track} mock interview in this chat. I will ask one question at a time, score your answer out of 10, then follow up.\n\nSay “stop interview” anytime.\n\nQuestion 1:\n${first.prompt}`,
      },
    }),
  }
}

function interviewWrapUp(scores: number[], notes: string[], track: string): string {
  const overall = overallInterviewScore(scores)
  const strong = notes.filter((n) => n.startsWith('strong:')).map((n) => n.slice(7))
  const weak = notes.filter((n) => n.startsWith('weak:')).map((n) => n.slice(5))
  return `Interview complete (${track})

Overall Score: ${overall}/10

Strong areas:
${strong.length ? strong.map((s) => `• ${s}`).join('\n') : '• Keep building fuller, example-based answers.'}

Weak areas:
${weak.length ? [...new Set(weak)].slice(0, 6).map((s) => `• ${s}`).join('\n') : '• None flagged beyond completeness.'}

Suggestions for improvement:
• Use definition → example → result.
• Quantify project impact when it is real.
• Practise the follow-up out loud for 60 seconds.

Scores stay in this chat.`
}

function continueInterview(session: CoachSession, answer: string): { session: CoachSession; msg: ChatMessage } {
  const iv = session.interview!
  const bank = INTERVIEW_BANK[iv.track]
  const q = bank[iv.qIndex]
  if (!q) {
    return { session: { ...session, mode: 'idle', interview: undefined }, msg: assistant({ text: 'The interview has ended. Ask anything else about placements.' }) }
  }

  if (iv.phase === 'ask') {
    const ev = evaluateAnswer(q, answer)
    const notes = [...iv.notes]
    if (ev.score >= 7) notes.push(`strong: ${iv.track} / ${q.prompt.slice(0, 48)}`)
    else notes.push(`weak: ${q.modelPoints[0] ?? q.prompt.slice(0, 40)}`)
    const next: CoachSession = {
      ...session,
      interview: { ...iv, phase: 'follow', scores: [...iv.scores, ev.score], notes },
    }
    return {
      session: next,
      msg: assistant({
        interview: {
          score: ev.score,
          feedback: ev.feedback,
          followUp: `Follow-up:\n${ev.followUp}`,
        },
      }),
    }
  }

  const ev = evaluateAnswer({ ...q, prompt: q.followUp, followUp: '', keywords: q.keywords, modelPoints: q.modelPoints }, answer)
  const scores = [...iv.scores, ev.score]
  const notes = [...iv.notes, ev.score < 6 ? `weak: follow-up on ${iv.track}` : `strong: follow-up`]
  const nextIdx = iv.qIndex + 1
  if (nextIdx >= bank.length) {
    return {
      session: { ...session, mode: 'idle', interview: undefined },
      msg: assistant({
        interview: {
          score: ev.score,
          feedback: ev.feedback,
          done: true,
          summary: interviewWrapUp(scores, notes, iv.track),
        },
      }),
    }
  }
  const nxt = bank[nextIdx]!
  return {
    session: {
      ...session,
      interview: { ...iv, qIndex: nextIdx, phase: 'ask', scores, notes },
    },
    msg: assistant({
      interview: {
        score: ev.score,
        feedback: ev.feedback,
        prompt: `Next question (${nextIdx + 1}/${bank.length}):\n${nxt.prompt}`,
      },
    }),
  }
}

function startPractice(session: CoachSession, count: number, difficulty: Difficulty, topic?: string) {
  const t = topic && (ALL_TOPICS as readonly string[]).includes(topic) ? topic : 'Percentages'
  const quiz = []
  const per = Math.max(1, Math.ceil(count / 3))
  const topics = topic ? [t] : ['Percentages', 'Time, Speed and Distance', 'Time and Work', 'Probability', 'Simple Interest']
  for (const tp of topics) {
    quiz.push(...buildQuiz(tp, difficulty, per))
  }
  const items = quiz.slice(0, count)
  const next: CoachSession = {
    ...session,
    mode: 'practice',
    practice: { quiz: items, idx: 0, answers: Array.from({ length: items.length }, () => null), started: Date.now() },
  }
  const q0 = items[0]!
  return {
    session: next,
    msg: assistant({
      blocks: text(
        `Here are ${items.length} ${difficulty.toLowerCase()} aptitude MCQs in this chat (${topic ?? 'mixed placement topics'}).\n\n${formatMcq(q0, 0, items.length)}`,
      ),
    }),
  }
}

function gradeMcq(session: CoachSession, index: number) {
  const p = session.practice!
  const q = p.quiz[p.idx]
  if (!q) {
    return { session: { ...session, mode: 'idle' as const, practice: undefined }, msg: assistant({ text: 'No active question. Ask for aptitude questions anytime.' }) }
  }
  if (index < 0 || index > 3) {
    return { session, msg: assistant({ text: 'Please reply with A, B, C, or D.' }) }
  }
  const answers = [...p.answers]
  answers[p.idx] = index
  const ok = index === q.correctIndex
  const explain = `${ok ? 'Correct' : 'Incorrect'}.\n\nCorrect answer: ${q.options[q.correctIndex]}\n\nFormula:\n${q.formula}\n\nSolution:\n${q.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}${q.tip ? `\n\nQuick Tip:\n${q.tip}` : ''}`
  if (p.idx + 1 >= p.quiz.length) {
    const seconds = Math.max(1, Math.floor((Date.now() - startedSeconds(p.started)) / 1000))
    const r = summarizePractice(p.quiz, answers, seconds)
    return {
      session: { ...session, mode: 'idle' as const, practice: undefined },
      msg: assistant({
        blocks: text(
          `${explain}\n\nPractice report\n• Total questions: ${r.total}\n• Correct: ${r.correct}\n• Wrong: ${r.wrong}\n• Accuracy: ${r.accuracy}%\n• Time taken: ${r.seconds}s\n• Weak topics: ${r.weakTopics.join(', ') || 'None'}\n• Recommended next: ${r.recommended.join(', ') || q.topic}`,
        ),
      }),
    }
  }
  const nextIdx = p.idx + 1
  const nq = p.quiz[nextIdx]!
  return {
    session: { ...session, practice: { ...p, idx: nextIdx, answers } },
    msg: assistant({
      blocks: text(`${explain}\n\n${formatMcq(nq, nextIdx, p.quiz.length)}`),
    }),
  }
}

function startedSeconds(started: number) {
  return started || Date.now()
}

function codingCard(problem: ReturnType<typeof pickCodingProblem>, extra = '') {
  const examples = problem.examples.map((e) => `• ${e}`).join('\n')
  return assistant({
    blocks: [
      {
        type: 'text',
        text: `${extra}Coding problem\n\nTitle: ${problem.title}\nLanguage: ${problem.language}\nTopic: ${problem.topic}\nDifficulty: ${problem.difficulty}\n\nProblem:\n${problem.prompt}\n\nExamples:\n${examples}\n\nTry it first. Ask for a hint, paste your attempt, or say “show solution” only when you want the full code.`,
      },
    ],
  })
}

// Local offline fallback engine
function runLocalFallback(
  q: string,
  session: CoachSession,
): { session: CoachSession; messages: ChatMessage[] } | null {
  const intent = detectIntent(q)

  if (intent.kind === 'stop') {
    return {
      session: { ...session, mode: 'idle', interview: undefined, practice: undefined, coding: undefined },
      messages: [assistant({ text: 'Stopped. I am still here as your placement coach — ask an aptitude question, a coding problem, or anything else.' })],
    }
  }

  if (session.mode === 'interview' && session.interview && intent.kind !== 'interview_start' && !looksLikeMathQuestion(q)) {
    const r = continueInterview(session, q)
    return { session: r.session, messages: [r.msg] }
  }

  if (session.mode === 'practice' && session.practice && intent.kind === 'mcq_choice') {
    const r = gradeMcq(session, intent.index)
    return { session: r.session, messages: [r.msg] }
  }

  switch (intent.kind) {
    case 'interview_start': {
      const track = intent.track ?? 'HR'
      const r = wrapInterview(track, session)
      return { session: r.session, messages: [r.msg] }
    }
    case 'coding_problem': {
      const problem = pickCodingProblem(intent)
      return {
        session: { ...session, mode: 'coding', coding: { problem, hintsGiven: 0, revealed: false } },
        messages: [codingCard(problem)],
      }
    }
    case 'coding_error': {
      const ex = explainCodeIssue(q)
      const blocks: ContentBlock[] = [{ type: 'text', text: `${ex.heading}\n\n${ex.body}` }]
      if (ex.code) blocks.push({ type: 'code', language: 'text', code: ex.code })
      return { session, messages: [assistant({ blocks })] }
    }
    case 'aptitude_generate': {
      const r = startPractice(session, intent.count, intent.difficulty, intent.topic)
      return { session: r.session, messages: [r.msg] }
    }
    case 'aptitude_solve': {
      const outcome: SolveOutcome = answerAptitude(q)
      return { session, messages: [assistant({ outcome })] }
    }
    case 'technical': {
      const prog = pythonProgramAnswer(intent.query)
      if (prog) {
        const blocks: ContentBlock[] = [{ type: 'text', text: `${prog.title}\n\n${prog.body}` }]
        if (prog.code) blocks.push({ type: 'code', language: 'python', code: prog.code })
        return { session, messages: [assistant({ blocks })] }
      }
      const a = technicalAnswer(intent.query)
      return { session, messages: [assistant({ blocks: text(`${a.title}\n\n${a.body}`) })] }
    }
    case 'resume':
      return { session, messages: [assistant({ blocks: text(`Resume / career help\n\n${resumeAdvice(session.resumeText)}`) })] }
    case 'company':
      return { session, messages: [assistant({ blocks: text(companyPrep(intent.company)) })] }
    case 'plan':
      return { session, messages: [assistant({ blocks: text(studyPlan(intent.days, q)) })] }
    case 'general':
      return { session, messages: [assistant({ blocks: text(generalPlacement(intent.query)) })] }
    default: {
      const outcome = answerAptitude(q)
      if (outcome.kind === 'solved') {
        return { session, messages: [assistant({ outcome })] }
      }
      const tech = technicalAnswer(q)
      if (tech && tech.title !== 'Placement topic') {
        return { session, messages: [assistant({ blocks: text(`${tech.title}\n\n${tech.body}`) })] }
      }
      return {
        session,
        messages: [assistant({ blocks: text(generalPlacement(q)) })],
      }
    }
  }
}

/**
 * Main turn handler for PlaceMate AI.
 * Communicates with the backend Gemini AI endpoint /api/chat.
 * Seamlessly tracks conversation context, evaluates interviews, solves aptitude step-by-step,
 * explains code & DSA with Big-O, and falls back to local engine if offline.
 */
export async function handleTurn(
  raw: string,
  session: CoachSession,
  allMessages: ChatMessage[] = [],
): Promise<{ session: CoachSession; messages: ChatMessage[] }> {
  const q = raw.trim()
  if (!q) {
    return { session, messages: [] }
  }

  // Handle explicit stop command
  if (/^(stop|end|cancel|quit|exit)(\s+(the\s+)?(interview|practice|session))?\.?$/i.test(q) || /stop (the )?(mock )?interview|end interview/i.test(q)) {
    return {
      session: { ...session, mode: 'idle', interview: undefined, practice: undefined, coding: undefined },
      messages: [
        assistant({
          text: 'Session stopped. I am here as your AI Placement Coach! Ask me any aptitude question, coding challenge, technical concept, resume tip, or company prep guide whenever you are ready.',
        }),
      ],
    }
  }

  // Prepare full history for the API
  const historyPayload = allMessages
    .filter((m) => !m.error && (m.text || m.blocks?.length || m.outcome || m.interview?.prompt))
    .map((m) => {
      let content = m.text || ''
      if (!content && m.blocks) {
        content = m.blocks
          .map((b) => (b.type === 'code' ? `\`\`\`${b.language}\n${b.code}\n\`\`\`` : b.text))
          .join('\n\n')
      }
      if (!content && m.outcome && m.outcome.kind === 'solved') {
        content = `Topic: ${m.outcome.topic}\nFormula: ${m.outcome.formula}\nSolution:\n${m.outcome.steps.join('\n')}\nFinal Answer: ${m.outcome.answer}${m.outcome.tip ? `\nQuick Tip: ${m.outcome.tip}` : ''}`
      }
      if (!content && m.interview?.prompt) {
        content = m.interview.prompt
      }
      return {
        role: m.role,
        content: content.trim(),
      }
    })
    .filter((m) => m.content.length > 0)

  // Ensure current user message is included in history if not already at the end
  if (
    historyPayload.length === 0 ||
    historyPayload[historyPayload.length - 1]!.content !== q ||
    historyPayload[historyPayload.length - 1]!.role !== 'user'
  ) {
    historyPayload.push({ role: 'user', content: q })
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: historyPayload,
        resumeText: session.resumeText,
        sessionMode: session.mode,
      }),
    })

    const data = await res.json()

    if (res.ok && data.response) {
      const responseText = data.response.trim()
      const blocks = parseResponseBlocks(responseText)
      const outcome = tryExtractAptitudeCard(responseText)

      let nextMode = session.mode
      if (/start.*interview|mock interview|ask me .*questions|take my .*interview/i.test(q)) {
        nextMode = 'interview'
      }

      return {
        session: { ...session, mode: nextMode },
        messages: [
          assistant({
            text: blocks.length === 1 && blocks[0]?.type === 'text' ? responseText : undefined,
            blocks: blocks.length > 1 || (blocks.length === 1 && blocks[0]?.type === 'code') ? blocks : undefined,
            outcome: outcome ?? undefined,
          }),
        ],
      }
    }

    // If server responded with an error (e.g. 401, 429, 502)
    const errText = data?.error || `Server responded with HTTP ${res.status}`
    console.error('[PlaceMate AI Error] Backend API error details:', { status: res.status, data })
    throw new Error(errText)
  } catch (err: any) {
    console.error('[PlaceMate AI Error] Failed to call Gemini API via /api/chat:', err.message || err)

    // Attempt local fallback
    const fallback = runLocalFallback(q, session)
    if (fallback) {
      // Save fallback Q&A to Supabase so offline answers are also saved
      const fallbackText = fallback.messages
        .map((m) => {
          if (m.text) return m.text
          if (m.outcome && m.outcome.kind === 'solved') {
            return `Topic: ${m.outcome.topic}\nFormula: ${m.outcome.formula}\nSolution:\n${m.outcome.steps.join('\n')}\nFinal Answer: ${m.outcome.answer}`
          }
          if (m.interview?.prompt) return m.interview.prompt
          if (m.blocks) {
            return m.blocks.map((b) => (b.type === 'code' ? `\`\`\`${b.language}\n${b.code}\n\`\`\`` : b.text)).join('\n\n')
          }
          return ''
        })
        .filter(Boolean)
        .join('\n\n')

      if (fallbackText) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, answer: fallbackText }),
        }).catch((e) => console.warn('[Supabase Fallback Save] Error:', e))
      }

      return fallback
    }

    return {
      session,
      messages: [
        assistant({
          error: `AI Coach Notification: ${err.message || 'Unable to connect to AI placement service'}. Please ensure your GEMINI_API_KEY is configured in .env and check your internet connection.`,
        }),
      ],
    }
  }
}

export const SUGGESTIONS = [
  'What is aptitude?',
  'Solve 20% of 450',
  'Give me a Python coding question',
  'Start a mock interview',
  '15-day placement plan',
  'How do I prepare for TCS?',
  'How can I improve my resume?',
  'What is DBMS normalization?',
]

export const SUGGESTION_TEXT: Record<string, string> = {
  'What is aptitude?': 'What is aptitude and how should I prepare for campus tests?',
  'Solve 20% of 450': 'Solve 20% of 450 step by step.',
  'Give me a Python coding question': 'Give me a difficult Python coding question with examples and hints.',
  'Start a mock interview': 'Start a mock interview. Ask me one question at a time and score my answers out of 10.',
  '15-day placement plan': 'I have 15 days for placement preparation. Make an actionable study plan for me.',
  'How do I prepare for TCS?': 'How do I prepare for TCS campus recruitment?',
  'How can I improve my resume?': 'How can I improve my resume for software developer placement drives?',
  'What is DBMS normalization?': 'What is DBMS normalization? Explain 1NF, 2NF, and 3NF with examples.',
}

export function applyResume(session: CoachSession, resumeText: string): CoachSession {
  return { ...session, resumeText }
}
