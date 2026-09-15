import type { ContentBlock, SolveOutcome, SolvedAnswer } from '../types'

export function parseResponseBlocks(rawText: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  // Matches ```lang\ncode``` or ```code```
  const codeBlockRegex = /```([a-zA-Z0-9_\-+#.]*)\r?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    const textBefore = rawText.slice(lastIndex, match.index).trim()
    if (textBefore) {
      blocks.push({ type: 'text', text: textBefore })
    }
    const language = match[1]?.trim() || 'code'
    const code = match[2]?.replace(/\r?\n$/, '') || ''
    blocks.push({ type: 'code', language, code })
    lastIndex = match.index + match[0].length
  }

  const remaining = rawText.slice(lastIndex).trim()
  if (remaining) {
    blocks.push({ type: 'text', text: remaining })
  }

  if (blocks.length === 0 && rawText.trim()) {
    blocks.push({ type: 'text', text: rawText.trim() })
  }

  return blocks
}

export function tryExtractAptitudeCard(text: string): SolveOutcome | null {
  // Check if text follows the strict aptitude format:
  // Topic: ...
  // Formula: ...
  // Solution: ...
  // Final Answer: ...
  // Quick Tip: ...
  const topicMatch = text.match(/\bTopic:\s*([^\n\r]+)/i)
  const formulaMatch = text.match(/\bFormula:\s*([\s\S]*?)(?=\bSolution:|$)/i)
  const solutionMatch = text.match(/\bSolution:\s*([\s\S]*?)(?=\bFinal Answer:|$)/i)
  const finalAnswerMatch = text.match(/\bFinal Answer:\s*([^\n\r]+)/i)
  const tipMatch = text.match(/\bQuick Tip:\s*([\s\S]*?)$/i)

  if (topicMatch && finalAnswerMatch && (formulaMatch || solutionMatch)) {
    const topic = topicMatch[1]!.trim()
    const formula = formulaMatch ? formulaMatch[1]!.trim() : ''
    const rawSolution = solutionMatch ? solutionMatch[1]!.trim() : ''
    const steps = rawSolution
      .split('\n')
      .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((s) => s.length > 0)
    const answer = finalAnswerMatch[1]!.trim()
    const tip = tipMatch ? tipMatch[1]!.trim() : undefined

    const outcome: SolvedAnswer = {
      kind: 'solved',
      topic,
      formula: formula || 'Standard mathematical formula',
      steps: steps.length > 0 ? steps : [rawSolution || 'Calculated step-by-step.'],
      answer,
      tip,
    }
    return outcome
  }

  return null
}
