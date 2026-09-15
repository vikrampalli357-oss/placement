import type { Difficulty, InterviewTrack } from '../types'
import { ALL_TOPICS } from './practice'

export type DetectedIntent =
  | { kind: 'stop' }
  | { kind: 'interview_start'; track?: InterviewTrack }
  | { kind: 'list_interview_questions'; track: InterviewTrack }
  | { kind: 'coding_problem'; language?: 'Python' | 'Java' | 'C++'; topic?: string; difficulty?: Difficulty }
  | { kind: 'coding_hint' }
  | { kind: 'coding_solution' }
  | { kind: 'coding_error' }
  | { kind: 'aptitude_generate'; count: number; difficulty: Difficulty; topic?: string }
  | { kind: 'aptitude_solve' }
  | { kind: 'mcq_choice'; index: number }
  | { kind: 'technical'; query: string }
  | { kind: 'resume' }
  | { kind: 'company'; company: string }
  | { kind: 'plan'; days?: number }
  | { kind: 'general'; query: string }
  | { kind: 'fallback' }

const TRACK_PATTERNS: Array<[RegExp, InterviewTrack]> = [
  [/ai\s*\/?\s*ml|machine learning|ml role/i, 'AI/ML'],
  [/python/i, 'Python'],
  [/\bsql\b|database interview/i, 'SQL'],
  [/project/i, 'Project-based'],
  [/coding|dsa|data structure/i, 'Coding'],
  [/hr\b|human resource/i, 'HR'],
  [/technical interview/i, 'Technical'],
]

export function detectTrack(q: string): InterviewTrack | undefined {
  for (const [re, t] of TRACK_PATTERNS) {
    if (re.test(q)) return t
  }
  return undefined
}

function parseCount(q: string, fallback = 5): number {
  const m = q.match(/\b(\d{1,2})\b/)
  if (!m) return fallback
  const n = Number(m[1])
  if (n === 5 || n === 10 || n === 20 || n === 30) return n
  if (n >= 1 && n <= 10) return n
  return fallback
}

function parseDifficulty(q: string): Difficulty {
  if (/\bhard|difficult|tough\b/i.test(q)) return 'Hard'
  if (/\bmedium|moderate\b/i.test(q)) return 'Medium'
  return 'Easy'
}

function parseTopic(q: string): string | undefined {
  const lower = q.toLowerCase()
  return ALL_TOPICS.find((t) => lower.includes(t.toLowerCase()))
}

export function looksLikeMathQuestion(q: string): boolean {
  const hasNum = /\d/.test(q)
  const ops = /[+\-×÷*/]|percent|%|speed|distance|train|work|interest|profit|loss|average|ratio|hcf|lcm|probability|permutation|age|pipe|boat|mixture|algebra|find|solve|how much|how many|simple interest|compound/i.test(
    q,
  )
  return hasNum && ops
}

export function detectIntent(raw: string): DetectedIntent {
  const q = raw.trim()
  const low = q.toLowerCase()

  const choice = q.match(/^\s*(?:option\s*)?([abcd]|[1-4])\s*[).:]?\s*$/i)
  if (choice) {
    const c = choice[1]!.toLowerCase()
    const index = 'abcd'.includes(c) ? c.charCodeAt(0) - 97 : Number(c) - 1
    return { kind: 'mcq_choice', index }
  }

  if (/^(stop|end|cancel|quit|exit)(\s+(the\s+)?(interview|practice|session))?\.?$/i.test(q) || /stop (the )?(mock )?interview|end interview/i.test(q)) {
    return { kind: 'stop' }
  }

  if (/hint/i.test(low) && !/give me a/.test(low)) {
    return { kind: 'coding_hint' }
  }
  if (/show (the )?(full )?solution|reveal (the )?answer|complete solution/i.test(low)) {
    return { kind: 'coding_solution' }
  }

  if (/error|traceback|bug|fix this code|find the error|explain this (python |java |c\+\+ )?code/i.test(low)) {
    return { kind: 'coding_error' }
  }

  const interviewStart =
    /start (a |my )?(mock )?interview|take my .*interview|interview me|give me an? \w+ interview|mock interview/i.test(q)
  const askMeQuestions = /ask me .*(interview )?questions/i.test(q)
  if (interviewStart || askMeQuestions) {
    return { kind: 'interview_start', track: detectTrack(q) }
  }

  if (/give me .*(interview )?questions/i.test(q) && detectTrack(q) && !/aptitude|coding problem|array problem/i.test(q)) {
    return { kind: 'list_interview_questions', track: detectTrack(q)! }
  }

  if (
    /coding (question|problem)|dsa|array problem|python coding|java coding|c\+\+ coding|linked list problem|give me an? \w+ problem/i.test(
      q,
    )
  ) {
    const language = /java/i.test(q) ? 'Java' : /c\+\+|cpp/i.test(q) ? 'C++' : /python/i.test(q) ? 'Python' : undefined
    const topicMatch = q.match(/\b(array|string|search|sort|hash|recursion|linked list|stack|queue|tree|dynamic programming|dp)\b/i)
    return {
      kind: 'coding_problem',
      language,
      topic: topicMatch?.[1],
      difficulty: parseDifficulty(q),
    }
  }

  if (/aptitude questions|practice aptitude|give me .*\d*.*aptitude|mcq/i.test(q)) {
    return {
      kind: 'aptitude_generate',
      count: parseCount(q, 5),
      difficulty: parseDifficulty(q),
      topic: parseTopic(q),
    }
  }

  if (/\b(days?|weeks?)\b/i.test(q) && /plan|prepar|placement|study/i.test(q)) {
    const d = q.match(/(\d+)\s*days?/i)
    const w = q.match(/(\d+)\s*weeks?/i)
    const days = d ? Number(d[1]) : w ? Number(w[1]) * 7 : undefined
    return { kind: 'plan', days }
  }
  if (/study plan|make a plan|timetable/i.test(q)) {
    return { kind: 'plan' }
  }

  if (/resume|cv\b|skills should i learn|describe my project/i.test(q)) {
    return { kind: 'resume' }
  }

  const company = q.match(
    /\b(tcs|infosys|accenture|wipro|cognizant|capgemini|amazon|google|microsoft|ibm|hcl|tech mahindra)\b/i,
  )
  if (company && /prepar|interview|placement|questions/i.test(q)) {
    return { kind: 'company', company: company[1]! }
  }

  if (
    /introduce myself|tell me about yourself|what should i wear|if i don't know|don't know an interview|communication|campus placements|how should i answer|explain my project|hr interview|hr round|strengths? and weaknesses?|why should we hire|where do you see yourself/i.test(
      q,
    ) &&
    !looksLikeMathQuestion(q)
  ) {
    return { kind: 'general', query: q }
  }

  if (
    /what is |explain |difference between |define |how does .* work|oop|normalization|dbms|operating system|computer network|generative ai|\bpython\b|write a (python )?program|coding interview|time complexity|big[- ]?o|data structures?/i.test(
      q,
    ) &&
    !looksLikeMathQuestion(q)
  ) {
    return { kind: 'technical', query: q }
  }

  if (looksLikeMathQuestion(q) || /solve this|find its|find the|what is \d/i.test(q)) {
    return { kind: 'aptitude_solve' }
  }

  return { kind: 'fallback' }
}
