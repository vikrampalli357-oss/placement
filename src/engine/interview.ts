import type { InterviewQuestion, InterviewTrack } from '../types'

export const TRACKS: InterviewTrack[] = [
  'HR',
  'Coding',
  'Technical',
  'AI/ML',
  'Python',
  'SQL',
  'Project-based',
]

export const INTERVIEW_BANK: Record<InterviewTrack, InterviewQuestion[]> = {
  HR: [
    {
      id: 'hr1',
      track: 'HR',
      prompt: 'Tell me about yourself — in 60 to 90 seconds, as you would in a campus HR round.',
      keywords: ['student', 'project', 'skill', 'intern', 'college', 'placement', 'interest', 'strength'],
      followUp: 'Why should we hire you instead of another candidate with a similar CGPA?',
      modelPoints: [
        'Present–past–future structure',
        'One concrete achievement',
        'Role you want and why this company type',
      ],
    },
    {
      id: 'hr2',
      track: 'HR',
      prompt: 'What is your greatest strength, and how did you use it recently?',
      keywords: ['example', 'team', 'result', 'impact', 'project', 'deadline'],
      followUp: 'Now tell me a genuine weakness and what you are doing to improve it.',
      modelPoints: ['Named strength', 'STAR example', 'Measurable result'],
    },
    {
      id: 'hr3',
      track: 'HR',
      prompt: 'Describe a conflict in a team project and how you handled it.',
      keywords: ['listen', 'team', 'communicate', 'compromise', 'deadline', 'resolve'],
      followUp: 'If the same teammate missed a deadline again, what would you do differently?',
      modelPoints: ['Situation', 'Your action', 'Outcome without blaming'],
    },
    {
      id: 'hr4',
      track: 'HR',
      prompt: 'Where do you see yourself in 3 years?',
      keywords: ['learn', 'engineer', 'grow', 'skill', 'responsibility', 'company'],
      followUp: 'How does this role help that plan?',
      modelPoints: ['Realistic growth', 'Skills to build', 'Not just “manager”'],
    },
    {
      id: 'hr5',
      track: 'HR',
      prompt: 'Why this company / this role?',
      keywords: ['product', 'learn', 'culture', 'technology', 'growth', 'values', 'domain'],
      followUp: 'What did you read about us before this interview?',
      modelPoints: ['Specific company detail', 'Fit with skills', 'Enthusiasm'],
    },
    {
      id: 'hr6',
      track: 'HR',
      prompt: 'Walk me through a time you failed or got negative feedback. What did you do next?',
      keywords: ['fail', 'learn', 'feedback', 'improve', 'mistake', 'next', 'result'],
      followUp: 'How would you handle the same situation in a 6-month probation period?',
      modelPoints: ['Own the mistake', 'Action taken', 'What changed'],
    },
    {
      id: 'hr7',
      track: 'HR',
      prompt: 'Are you willing to relocate or work night shifts / client locations? Explain your constraints honestly.',
      keywords: ['relocate', 'flexible', 'family', 'notice', 'yes', 'constraint', 'willing'],
      followUp: 'If the offer needs you to join in 15 days, what is your notice-period plan?',
      modelPoints: ['Clear yes/no with reason', 'Constraints', 'Professional tone'],
    },
    {
      id: 'hr8',
      track: 'HR',
      prompt: 'What are your salary expectations for this campus role?',
      keywords: ['package', 'market', 'stipend', 'flexible', 'learn', 'band', 'ctc'],
      followUp: 'If we cannot match that number, what else would make the offer attractive?',
      modelPoints: ['Range not a single demand', 'Learning/role value', 'Flexibility'],
    },
    {
      id: 'hr9',
      track: 'HR',
      prompt: 'Tell me about a time you led without a title — in a club, project, or hostel team.',
      keywords: ['lead', 'team', 'coordinate', 'decision', 'motivate', 'result', 'volunteer'],
      followUp: 'How did you handle someone who disagreed with your plan?',
      modelPoints: ['Initiative', 'People skill', 'Outcome'],
    },
    {
      id: 'hr10',
      track: 'HR',
      prompt: 'Do you have any questions for me as the HR interviewer?',
      keywords: ['team', 'training', 'growth', 'role', 'culture', 'project', 'onboarding'],
      followUp: 'Ask one question about the first 90 days in this role.',
      modelPoints: ['Not only salary', 'Shows research', 'Role/growth focus'],
    },
  ],
  Coding: [
    {
      id: 'cd1',
      track: 'Coding',
      prompt:
        'Reverse a linked list. Explain the approach, then walk through time and space complexity. You may describe code in words or write a short snippet.',
      keywords: ['prev', 'next', 'current', 'pointer', 'o(n)', 'in-place', 'iterative', 'recursive'],
      followUp: 'How would you reverse only nodes from position L to R?',
      modelPoints: ['Three pointers / recursion', 'O(n) time', 'O(1) extra space iterative'],
    },
    {
      id: 'cd2',
      track: 'Coding',
      prompt:
        'Given an array of integers, find two numbers that add up to a target. What is the best approach you would code in an interview?',
      keywords: ['hash', 'map', 'two', 'pointer', 'o(n)', 'complement', 'sort', 'target'],
      followUp: 'What if the interviewer forbids extra memory — how does the approach change?',
      modelPoints: ['Hash map complement', 'O(n) average', 'Sort + two pointers tradeoff'],
    },
    {
      id: 'cd3',
      track: 'Coding',
      prompt:
        'Detect a cycle in a linked list. Which algorithm would you use and why is it correct?',
      keywords: ['floyd', 'slow', 'fast', 'tortoise', 'hare', 'cycle', 'pointer'],
      followUp: 'Once a cycle is found, how do you find the node where the cycle begins?',
      modelPoints: ['Fast/slow pointers', 'Why they meet', 'Reset to find start'],
    },
    {
      id: 'cd4',
      track: 'Coding',
      prompt:
        'Write or describe an algorithm to check if a string of brackets ()[]{} is valid / balanced.',
      keywords: ['stack', 'push', 'pop', 'match', 'o(n)', 'bracket', 'pair'],
      followUp: 'What is the space complexity in the worst case, and when does it happen?',
      modelPoints: ['Stack of opens', 'Match on close', 'O(n) time'],
    },
    {
      id: 'cd5',
      track: 'Coding',
      prompt:
        'You have an array with one duplicate in 1..n. How do you find the duplicate? Discuss at least two methods.',
      keywords: ['hash', 'set', 'floyd', 'sort', 'xor', 'index', 'cycle'],
      followUp: 'Can you do it in O(n) time and O(1) extra space without modifying the array?',
      modelPoints: ['Set / sort', 'Floyd cycle on indices', 'Constraints matter'],
    },
    {
      id: 'cd6',
      track: 'Coding',
      prompt:
        'Explain binary search and code the loop condition carefully. What bugs do candidates usually hit?',
      keywords: ['mid', 'sorted', 'low', 'high', 'overflow', 'o(log', 'while'],
      followUp: 'How do you adapt binary search to find the first occurrence of a target?',
      modelPoints: ['Halve search space', 'mid overflow', 'Loop invariant'],
    },
    {
      id: 'cd7',
      track: 'Coding',
      prompt:
        'BFS vs DFS: when would you pick each in a graph coding round? Give one problem for each.',
      keywords: ['queue', 'stack', 'level', 'shortest', 'visited', 'recursion', 'graph'],
      followUp: 'How do you avoid infinite loops in an undirected graph?',
      modelPoints: ['BFS shortest unweighted', 'DFS path/components', 'Visited set'],
    },
    {
      id: 'cd8',
      track: 'Coding',
      prompt:
        'Design the coding solution for “longest substring without repeating characters.” Talk sliding window.',
      keywords: ['window', 'set', 'map', 'left', 'right', 'unique', 'o(n)'],
      followUp: 'What is the time complexity if you use a last-seen index map?',
      modelPoints: ['Two pointers', 'Shrink when duplicate', 'O(n)'],
    },
  ],
  Technical: [
    {
      id: 'te1',
      track: 'Technical',
      prompt: 'What happens when you type a URL in the browser and press Enter?',
      keywords: ['dns', 'tcp', 'http', 'https', 'ip', 'server', 'html', 'tls', 'cache'],
      followUp: 'Where does DNS caching happen, and what is a typical HTTP status for a successful page load?',
      modelPoints: ['DNS lookup', 'TCP/TLS', 'HTTP request/response', 'Rendering'],
    },
    {
      id: 'te2',
      track: 'Technical',
      prompt: 'Explain the difference between an array and a linked list. When would you pick each?',
      keywords: ['index', 'o(1)', 'pointer', 'insert', 'contiguous', 'cache', 'memory'],
      followUp: 'What is the time complexity of inserting at the head of a singly linked list vs an array?',
      modelPoints: ['Random access', 'Insertion cost', 'Memory layout'],
    },
    {
      id: 'te3',
      track: 'Technical',
      prompt: 'What is the difference between process and thread?',
      keywords: ['memory', 'shared', 'os', 'stack', 'context', 'parallel', 'isolation'],
      followUp: 'Can two threads of the same process crash each other? Why?',
      modelPoints: ['Address space', 'Shared vs isolated', 'Context switch'],
    },
    {
      id: 'te4',
      track: 'Technical',
      prompt: 'Explain OOP in simple terms with one real example.',
      keywords: ['class', 'object', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction'],
      followUp: 'Give one example of polymorphism from your project or from Java/Python.',
      modelPoints: ['Four pillars', 'Concrete example', 'Why it helps'],
    },
    {
      id: 'te5',
      track: 'Technical',
      prompt: 'What is time complexity? Compare linear search and binary search.',
      keywords: ['o(n)', 'o(log', 'sorted', 'big o', 'worst', 'average'],
      followUp: 'Why can we not binary-search an unsorted array as-is?',
      modelPoints: ['Definition of Big-O', 'O(n) vs O(log n)', 'Sorted precondition'],
    },
  ],
  'AI/ML': [
    {
      id: 'ml1',
      track: 'AI/ML',
      prompt: 'Explain supervised vs unsupervised learning with one example each.',
      keywords: ['label', 'classification', 'regression', 'cluster', 'unlabeled', 'training'],
      followUp: 'Is customer segmentation supervised or unsupervised, and why?',
      modelPoints: ['Labels vs no labels', 'Examples', 'Typical algorithms'],
    },
    {
      id: 'ml2',
      track: 'AI/ML',
      prompt: 'What is overfitting, and how do you detect or reduce it?',
      keywords: ['train', 'test', 'regularization', 'dropout', 'cross', 'variance', 'generalize'],
      followUp: 'What does a large gap between training accuracy and validation accuracy suggest?',
      modelPoints: ['Memorizing train set', 'Validation gap', 'Regularization/data'],
    },
    {
      id: 'ml3',
      track: 'AI/ML',
      prompt: 'What is the bias–variance tradeoff?',
      keywords: ['bias', 'variance', 'underfit', 'overfit', 'complexity', 'error'],
      followUp: 'If a model is too simple, which error dominates — bias or variance?',
      modelPoints: ['High bias underfitting', 'High variance overfitting', 'Balance'],
    },
    {
      id: 'ml4',
      track: 'AI/ML',
      prompt: 'Explain precision and recall. When would you optimize recall over precision?',
      keywords: ['true positive', 'false positive', 'false negative', 'precision', 'recall', 'medical', 'fraud'],
      followUp: 'Write the formulas for precision and recall.',
      modelPoints: ['TP/FP/FN', 'Formulas', 'Domain example'],
    },
    {
      id: 'ml5',
      track: 'AI/ML',
      prompt: 'What is a neural network in one minute, without jargon overload?',
      keywords: ['layer', 'weight', 'activation', 'neuron', 'loss', 'backprop', 'feature'],
      followUp: 'What does the activation function add that a stack of linear layers would miss?',
      modelPoints: ['Weighted sum', 'Nonlinearity', 'Learned features'],
    },
  ],
  Python: [
    {
      id: 'py1',
      track: 'Python',
      prompt: 'What are lists and tuples in Python? When do you use a tuple?',
      keywords: ['mutable', 'immutable', 'list', 'tuple', 'hash', 'dict', 'ordered'],
      followUp: 'Can a tuple be a dictionary key? Can a list? Why?',
      modelPoints: ['Mutability', 'Use cases', 'Hashability'],
    },
    {
      id: 'py2',
      track: 'Python',
      prompt: 'Explain list comprehension with a short example.',
      keywords: ['for', 'if', 'comprehension', 'list', 'pythonic', 'map'],
      followUp: 'Write a comprehension that squares even numbers from 1 to 10.',
      modelPoints: ['Syntax', 'Filter', 'Readability'],
    },
    {
      id: 'py3',
      track: 'Python',
      prompt: 'What is the difference between `==` and `is` in Python?',
      keywords: ['equality', 'identity', 'none', 'is', '==', 'memory', 'object'],
      followUp: 'Why do we write `if x is None` instead of `if x == None`?',
      modelPoints: ['Value vs identity', 'None singleton', 'Interning caveat'],
    },
    {
      id: 'py4',
      track: 'Python',
      prompt: 'How does a Python dictionary work at a high level?',
      keywords: ['hash', 'key', 'average', 'o(1)', 'collision', 'mutable'],
      followUp: 'What happens if you use a mutable list as a dict key?',
      modelPoints: ['Hash table', 'Average O(1)', 'Keys must be hashable'],
    },
    {
      id: 'py5',
      track: 'Python',
      prompt: 'What are `*args` and `**kwargs`?',
      keywords: ['args', 'kwargs', 'parameter', 'unpack', 'function', 'variable'],
      followUp: 'Show a tiny function signature that accepts both.',
      modelPoints: ['Variable positional', 'Variable keyword', 'Example'],
    },
  ],
  SQL: [
    {
      id: 'sq1',
      track: 'SQL',
      prompt: 'What is the difference between INNER JOIN and LEFT JOIN?',
      keywords: ['match', 'null', 'left', 'inner', 'table', 'row', 'on'],
      followUp: 'If table A has 10 rows and none match B, how many rows does LEFT JOIN return?',
      modelPoints: ['Matching rows', 'Unmatched left rows kept', 'NULLs'],
    },
    {
      id: 'sq2',
      track: 'SQL',
      prompt: 'Explain PRIMARY KEY vs FOREIGN KEY.',
      keywords: ['unique', 'null', 'reference', 'integrity', 'table', 'constraint'],
      followUp: 'Can a table have more than one primary key? What about unique keys?',
      modelPoints: ['Uniqueness', 'Referential integrity', 'One PK'],
    },
    {
      id: 'sq3',
      track: 'SQL',
      prompt: 'What does GROUP BY do, and when do you use HAVING?',
      keywords: ['aggregate', 'group', 'having', 'where', 'count', 'sum'],
      followUp: 'Why can we not put an aggregate condition in WHERE?',
      modelPoints: ['Collapse groups', 'HAVING after aggregation', 'WHERE before'],
    },
    {
      id: 'sq4',
      track: 'SQL',
      prompt: 'Write a query idea: find the second highest salary from an Employee table.',
      keywords: ['max', 'subquery', 'distinct', 'salary', 'order', 'limit', 'offset'],
      followUp: 'How would you handle ties (two people with the same top salary)?',
      modelPoints: ['Subquery or ORDER BY', 'DISTINCT', 'Ties'],
    },
    {
      id: 'sq5',
      track: 'SQL',
      prompt: 'What is normalization? Name 1NF, 2NF, 3NF in one line each.',
      keywords: ['atomic', 'partial', 'transitive', 'redundancy', 'normal', 'key'],
      followUp: 'Give one problem caused by not normalizing.',
      modelPoints: ['1NF atomic', '2NF no partial dependency', '3NF no transitive'],
    },
  ],
  'Project-based': [
    {
      id: 'pr1',
      track: 'Project-based',
      prompt: 'Walk me through one project on your resume: problem, your role, tech stack, and outcome.',
      keywords: ['problem', 'i', 'we', 'stack', 'result', 'user', 'feature'],
      followUp: 'What part did you personally implement, not just the team?',
      modelPoints: ['Problem statement', 'Your contribution', 'Impact'],
    },
    {
      id: 'pr2',
      track: 'Project-based',
      prompt: 'What was the hardest bug or blocker in that project, and how did you debug it?',
      keywords: ['debug', 'log', 'error', 'test', 'root', 'fix', 'reproduce'],
      followUp: 'What would you add next time to catch that bug earlier?',
      modelPoints: ['Reproduce', 'Root cause', 'Fix + learning'],
    },
    {
      id: 'pr3',
      track: 'Project-based',
      prompt: 'If 10× users hit your project tomorrow, what would break first and how would you scale?',
      keywords: ['database', 'cache', 'load', 'api', 'server', 'bottleneck', 'index'],
      followUp: 'Would you scale vertically or horizontally first, and why?',
      modelPoints: ['Bottleneck', 'Caching/DB', 'Tradeoff'],
    },
    {
      id: 'pr4',
      track: 'Project-based',
      prompt: 'How did you test this project? Unit, integration, or manual?',
      keywords: ['test', 'unit', 'edge', 'qa', 'assert', 'manual', 'case'],
      followUp: 'Name one edge case you missed at first.',
      modelPoints: ['Test types', 'Edge cases', 'Honesty'],
    },
    {
      id: 'pr5',
      track: 'Project-based',
      prompt: 'If you rebuilt the project in 2 weeks, what would you change in the architecture?',
      keywords: ['refactor', 'module', 'api', 'database', 'auth', 'structure', 'simple'],
      followUp: 'What would you deliberately keep the same?',
      modelPoints: ['Clearer modules', 'One concrete change', 'Pragmatism'],
    },
  ],
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

export function evaluateAnswer(q: InterviewQuestion, answer: string): {
  score: number
  feedback: string
  followUp: string
  hits: string[]
} {
  const text = answer.trim()
  if (text.length < 12) {
    return {
      score: 2,
      feedback:
        'Too short for a campus interview. Expand with a definition, one example, and a closing line. Score reflects completeness, not just keywords.',
      followUp: q.followUp,
      hits: [],
    }
  }

  const tokens = new Set(tokenize(text))
  const hits = q.keywords.filter((k) => {
    const parts = k.toLowerCase().split(/\s+/)
    return parts.every((p) => tokens.has(p) || text.toLowerCase().includes(k.toLowerCase()))
  })

  const coverage = hits.length / q.keywords.length
  const lengthBonus = text.length > 80 ? 1 : text.length > 40 ? 0.5 : 0
  const structureBonus = /for example|because|therefore|in my project|i implemented/i.test(text) ? 1 : 0

  let score = Math.round((coverage * 7 + lengthBonus + structureBonus + 1) * 10) / 10
  if (score > 10) score = 10
  if (score < 1) score = 1
  score = Math.round(score)
  if (score > 10) score = 10

  const missing = q.keywords.filter((k) => !hits.includes(k)).slice(0, 4)
  const points = q.modelPoints.map((p) => `• ${p}`).join('\n')

  const feedback =
    score >= 8
      ? `Strong answer. You covered: ${hits.join(', ') || 'the core idea'}.\nExpected points:\n${points}`
      : score >= 5
        ? `Decent start, but incomplete. You hit: ${hits.join(', ') || 'few keywords'}. Strengthen: ${missing.join(', ')}.\nExpected points:\n${points}`
        : `Needs structure. Mention: ${missing.join(', ')}.\nExpected points:\n${points}\nUse: definition → example → result.`

  return { score, feedback, followUp: q.followUp, hits }
}

export function overallInterviewScore(scores: number[]): number {
  if (!scores.length) return 0
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}
