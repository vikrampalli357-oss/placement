import { answerAptitude } from '../src/engine/aptitude.ts'

const qs = [
  'A train travels 360 km in 4 hours. What is its speed?',
  'Find 20% of 450.',
  'If a man completes a work in 10 days, how much work does he complete in 1 day?',
  'A train 200 meters long crosses a pole in 10 seconds. Find its speed.',
  'Find the probability of getting a head when a coin is tossed.',
  'Find SI if P = 2000, R = 5%, T = 3 years.',
]

for (const q of qs) {
  const r = answerAptitude(q)
  console.log(q, '=>', r.kind === 'solved' ? `${r.topic} | ${r.answer}` : r)
}
