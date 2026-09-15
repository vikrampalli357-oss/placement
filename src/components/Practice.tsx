import { useEffect, useMemo, useState } from 'react'
import {
  ALL_TOPICS,
  LR_TOPICS,
  QUANT_TOPICS,
  VA_TOPICS,
  buildQuiz,
  summarizePractice,
} from '../engine/practice'
import type { Difficulty, McqQuestion, PracticeResult } from '../types'

const COUNTS = [5, 10, 20, 30] as const
const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard']

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return m ? `${m}m ${r}s` : `${r}s`
}

export function Practice() {
  const [topic, setTopic] = useState<string>(ALL_TOPICS[0])
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy')
  const [count, setCount] = useState<(typeof COUNTS)[number]>(5)
  const [quiz, setQuiz] = useState<McqQuestion[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Array<number | null>>([])
  const [started, setStarted] = useState(0)
  const [now, setNow] = useState(0)
  const [result, setResult] = useState<PracticeResult | null>(null)

  useEffect(() => {
    if (!quiz || result) return
    const t = window.setInterval(() => setNow(Math.floor((Date.now() - started) / 1000)), 500)
    return () => window.clearInterval(t)
  }, [quiz, result, started])

  const q = quiz?.[idx]

  function start() {
    const items = buildQuiz(topic, difficulty, count)
    setQuiz(items)
    setIdx(0)
    setPicked(null)
    setAnswers(Array.from({ length: items.length }, () => null))
    setResult(null)
    const ts = Date.now()
    setStarted(ts)
    setNow(0)
  }

  function lock(i: number) {
    if (picked != null) return
    setPicked(i)
    setAnswers((a) => {
      const n = [...a]
      n[idx] = i
      return n
    })
  }

  function next() {
    if (!quiz) return
    if (idx + 1 >= quiz.length) {
      const seconds = Math.max(1, Math.floor((Date.now() - started) / 1000))
      setResult(summarizePractice(quiz, answers.map((a, i) => (i === idx ? picked : a)), seconds))
      return
    }
    setIdx((n) => n + 1)
    setPicked(null)
  }

  const groups = useMemo(
    () => [
      { label: 'Quantitative', items: QUANT_TOPICS },
      { label: 'Logical reasoning', items: LR_TOPICS },
      { label: 'Verbal ability', items: VA_TOPICS },
    ],
    [],
  )

  if (result && quiz) {
    return (
      <div className="pane practice">
        <header className="pane-head">
          <h1>Practice report</h1>
          <p>
            {topic} · {difficulty} · {quiz.length} questions
          </p>
        </header>
        <div className="report">
          <dl>
            <div>
              <dt>Total questions</dt>
              <dd>{result.total}</dd>
            </div>
            <div>
              <dt>Correct</dt>
              <dd>{result.correct}</dd>
            </div>
            <div>
              <dt>Wrong</dt>
              <dd>{result.wrong}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>{result.accuracy}%</dd>
            </div>
            <div>
              <dt>Time taken</dt>
              <dd>{fmtTime(result.seconds)}</dd>
            </div>
          </dl>
          <section>
            <h3>Weak topics</h3>
            <p>{result.weakTopics.length ? result.weakTopics.join(', ') : 'None — solid set.'}</p>
          </section>
          <section>
            <h3>Recommended next</h3>
            <p>{result.recommended.length ? result.recommended.join(', ') : topic}</p>
          </section>
          <button type="button" className="go" onClick={() => setQuiz(null)}>
            New practice set
          </button>
        </div>
      </div>
    )
  }

  if (quiz && q) {
    const revealed = picked != null
    const correct = picked === q.correctIndex
    return (
      <div className="pane practice">
        <header className="pane-head">
          <h1>Practice aptitude</h1>
          <p>
            {q.topic} · {q.difficulty} · Question {idx + 1} of {quiz.length} · {fmtTime(now)}
          </p>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${((idx + (revealed ? 1 : 0)) / quiz.length) * 100}%` }} />
          </div>
        </header>
        <article className="quiz-card">
          <p className="prompt">{q.prompt}</p>
          <ul className="options">
            {q.options.map((opt, i) => {
              let cls = ''
              if (revealed && i === q.correctIndex) cls = 'right'
              else if (revealed && i === picked && !correct) cls = 'wrong'
              return (
                <li key={opt}>
                  <button type="button" className={cls} disabled={revealed} onClick={() => lock(i)}>
                    <span>{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                </li>
              )
            })}
          </ul>
          {revealed ? (
            <div className="explain">
              <p className={correct ? 'ok' : 'bad'}>
                {correct ? 'Correct' : 'Incorrect'} — answer is {q.options[q.correctIndex]}
              </p>
              <p className="formula">{q.formula}</p>
              <ol>
                {q.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {q.tip ? <p className="tip">{q.tip}</p> : null}
              <button type="button" className="go" onClick={next}>
                {idx + 1 >= quiz.length ? 'See report' : 'Next question'}
              </button>
            </div>
          ) : (
            <p className="muted">Select an option to lock your answer.</p>
          )}
        </article>
      </div>
    )
  }

  return (
    <div className="pane practice">
      <header className="pane-head">
        <h1>Practice aptitude</h1>
        <p>Pick a topic, difficulty, and length. You will see one MCQ at a time with a full solution.</p>
      </header>
      <form
        className="setup"
        onSubmit={(e) => {
          e.preventDefault()
          start()
        }}
      >
        <label>
          Topic
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Difficulty</legend>
          {DIFFS.map((d) => (
            <label key={d} className="radio">
              <input type="radio" name="diff" checked={difficulty === d} onChange={() => setDifficulty(d)} />
              {d}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Number of questions</legend>
          {COUNTS.map((c) => (
            <label key={c} className="radio">
              <input type="radio" name="n" checked={count === c} onChange={() => setCount(c)} />
              {c}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="go">
          Start practice
        </button>
      </form>
    </div>
  )
}
