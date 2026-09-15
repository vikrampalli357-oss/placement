import React, { useState } from 'react'
import type { ContentBlock, SolveOutcome } from '../types'
import { OutcomeCard } from './OutcomeCard'

function CopyBtn({ code }: { code: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      className="copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code)
          setOk(true)
          window.setTimeout(() => setOk(false), 1200)
        } catch {
          setOk(false)
        }
      }}
    >
      {ok ? 'Copied' : 'Copy'}
    </button>
  )
}

/**
 * Parses inline formatting: **bold** and `code`
 */
function renderInline(str: string): React.ReactNode[] {
  // Regex to match **bold** or `code`
  const tokens = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="inline-code">
          {token.slice(1, -1)}
        </code>
      )
    }
    return token
  })
}

function TextBlockView({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="rich">
      {lines.map((rawLine, i) => {
        const line = rawLine.trim()
        if (!line) return <div key={i} className="sp" />

        // Headings
        if (line.startsWith('### ')) {
          return (
            <h4 key={i} className="h-sub">
              {renderInline(line.slice(4))}
            </h4>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="h-mid">
              {renderInline(line.slice(3))}
            </h3>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="h-top">
              {renderInline(line.slice(2))}
            </h2>
          )
        }

        // Score highlights
        const scoreMatch = line.match(/\bScore:\s*(\d+(?:\.\d+)?\s*\/\s*10)\b/i)
        if (scoreMatch) {
          return (
            <div key={i} className="score-badge-card">
              <span className="score-badge">⭐ Score: {scoreMatch[1]}</span>
            </div>
          )
        }

        // Structured section highlights
        if (
          /^(Topic:|Formula:|Solution:|Final Answer:|Quick Tip:|Strengths:|Weaknesses:|Improved Answer:|Next Question:|Question \d+:|Strong areas:|Weak areas:|Suggestions)/i.test(
            line
          ) &&
          line.length < 90
        ) {
          return (
            <p key={i} className="h-label">
              {renderInline(line)}
            </p>
          )
        }

        // Bullet lists
        if (/^[-*•]\s+/.test(line)) {
          return (
            <div key={i} className="bullet-line">
              <span className="bullet-dot">•</span>
              <span>{renderInline(line.replace(/^[-*•]\s+/, ''))}</span>
            </div>
          )
        }

        // Numbered list
        const numMatch = line.match(/^(\d+[\.\)])\s+(.*)$/)
        if (numMatch) {
          return (
            <div key={i} className="bullet-line">
              <span className="bullet-num">{numMatch[1]}</span>
              <span>{renderInline(numMatch[2]!)}</span>
            </div>
          )
        }

        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

export function MessageBody({
  text,
  blocks,
  outcome,
  error,
}: {
  text?: string
  blocks?: ContentBlock[]
  outcome?: SolveOutcome
  error?: string
}) {
  return (
    <>
      {error ? <p className="err">{error}</p> : null}
      {text ? <TextBlockView text={text} /> : null}
      {blocks?.map((b, i) =>
        b.type === 'code' ? (
          <div className="codewrap" key={i}>
            <div className="codehead">
              <span>{b.language || 'code'}</span>
              <CopyBtn code={b.code} />
            </div>
            <pre>
              <code>{b.code}</code>
            </pre>
          </div>
        ) : (
          <TextBlockView key={i} text={b.text} />
        )
      )}
      {outcome ? <OutcomeCard outcome={outcome} /> : null}
    </>
  )
}
