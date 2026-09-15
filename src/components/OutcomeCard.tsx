import type { SolveOutcome } from '../types'

export function OutcomeCard({ outcome }: { outcome: SolveOutcome }) {
  if (outcome.kind === 'clarify') {
    return (
      <article className="card card-warn">
        {outcome.topic ? <p className="kicker">Topic: {outcome.topic}</p> : null}
        <h3>I need a clarification</h3>
        <p>{outcome.question}</p>
        {outcome.options?.length ? (
          <ul className="chips static">
            {outcome.options.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        ) : null}
        <p className="muted">PlaceMate will not guess when more than one interpretation is valid.</p>
      </article>
    )
  }

  if (outcome.kind === 'unsolved') {
    return (
      <article className="card card-warn">
        <h3>Cannot verify a unique answer</h3>
        <p>{outcome.message}</p>
      </article>
    )
  }

  return (
    <article className="card card-ok">
      <p className="kicker">Topic: {outcome.topic}</p>
      <section>
        <h4>Formula</h4>
        <p className="formula">{outcome.formula}</p>
      </section>
      <section>
        <h4>Solution</h4>
        <ol>
          {outcome.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
      <p className="final">
        <span>Final Answer</span> ✅ {outcome.answer}
      </p>
      {outcome.tip ? (
        <p className="tip">
          <strong>Quick tip:</strong> {outcome.tip}
        </p>
      ) : null}
    </article>
  )
}
