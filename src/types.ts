export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type SolvedAnswer = {
  kind: 'solved'
  topic: string
  formula: string
  steps: string[]
  answer: string
  tip?: string
}

export type ClarifyAnswer = {
  kind: 'clarify'
  topic?: string
  question: string
  options?: string[]
}

export type UnsolvedAnswer = {
  kind: 'unsolved'
  topic?: string
  message: string
}

export type SolveOutcome = SolvedAnswer | ClarifyAnswer | UnsolvedAnswer

export type ChatRole = 'user' | 'assistant'

export type CodeBlock = {
  type: 'code'
  language: string
  code: string
}

export type TextBlock = {
  type: 'text'
  text: string
}

export type ContentBlock = TextBlock | CodeBlock

export type ChatMessage = {
  id: string
  role: ChatRole
  text?: string
  blocks?: ContentBlock[]
  outcome?: SolveOutcome
  interview?: InterviewTurn
  error?: string
}

export type McqQuestion = {
  id: string
  topic: string
  difficulty: Difficulty
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
  formula: string
  steps: string[]
  tip?: string
}

export type PracticeResult = {
  total: number
  correct: number
  wrong: number
  accuracy: number
  seconds: number
  weakTopics: string[]
  recommended: string[]
}

export type InterviewTrack =
  | 'HR'
  | 'Coding'
  | 'Technical'
  | 'AI/ML'
  | 'Python'
  | 'SQL'
  | 'Project-based'

export type InterviewQuestion = {
  id: string
  track: InterviewTrack
  prompt: string
  keywords: string[]
  followUp: string
  modelPoints: string[]
}

export type InterviewTurn = {
  prompt?: string
  score?: number
  feedback?: string
  followUp?: string
  done?: boolean
  summary?: string
}

export type CodingProblem = {
  id: string
  title: string
  language: 'Python' | 'Java' | 'C++' | 'Any'
  topic: string
  difficulty: Difficulty
  prompt: string
  examples: string[]
  hints: string[]
  solution: string
  complexity: string
}

export type SessionMode = 'idle' | 'interview' | 'practice' | 'coding'

export type CoachSession = {
  mode: SessionMode
  resumeText?: string
  interview?: {
    track: InterviewTrack
    qIndex: number
    phase: 'ask' | 'follow'
    scores: number[]
    notes: string[]
  }
  practice?: {
    quiz: McqQuestion[]
    idx: number
    answers: Array<number | null>
    started: number
  }
  coding?: {
    problem: CodingProblem
    hintsGiven: number
    revealed: boolean
  }
}
