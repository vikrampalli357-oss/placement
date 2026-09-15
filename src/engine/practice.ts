import type { Difficulty, McqQuestion, PracticeResult } from '../types'
import { fmt, mulberry32, nCr, pick, shuffle } from './math'

export const QUANT_TOPICS = [
  'Percentages',
  'Profit and Loss',
  'Simple Interest',
  'Compound Interest',
  'Ratio and Proportion',
  'Averages',
  'Time and Work',
  'Pipes and Cisterns',
  'Time, Speed and Distance',
  'Boats and Streams',
  'Problems on Ages',
  'Number System',
  'HCF and LCM',
  'Algebra',
  'Probability',
  'Permutations and Combinations',
  'Mixtures and Allegations',
  'Data Interpretation',
] as const

export const LR_TOPICS = [
  'Number Series',
  'Alphabet Series',
  'Coding-Decoding',
  'Blood Relations',
  'Directions',
  'Seating Arrangement',
  'Syllogisms',
  'Analogies',
  'Odd One Out',
  'Puzzles',
  'Statement and Conclusions',
] as const

export const VA_TOPICS = [
  'Grammar',
  'Vocabulary',
  'Synonyms',
  'Antonyms',
  'Sentence Correction',
  'Reading Comprehension',
  'Fill in the Blanks',
  'Para Jumbles',
] as const

export const ALL_TOPICS = [...QUANT_TOPICS, ...LR_TOPICS, ...VA_TOPICS]

export const RELATED: Record<string, string[]> = {
  Percentages: ['Profit and Loss', 'Simple Interest', 'Mixtures and Allegations'],
  'Profit and Loss': ['Percentages', 'Ratio and Proportion'],
  'Simple Interest': ['Compound Interest', 'Percentages'],
  'Compound Interest': ['Simple Interest', 'Percentages'],
  'Ratio and Proportion': ['Mixtures and Allegations', 'Averages'],
  Averages: ['Percentages', 'Data Interpretation'],
  'Time and Work': ['Pipes and Cisterns', 'Ratio and Proportion'],
  'Pipes and Cisterns': ['Time and Work'],
  'Time, Speed and Distance': ['Boats and Streams', 'Percentages'],
  'Boats and Streams': ['Time, Speed and Distance'],
  'Problems on Ages': ['Ratio and Proportion', 'Algebra'],
  'Number System': ['HCF and LCM', 'Algebra'],
  'HCF and LCM': ['Number System', 'Time and Work'],
  Algebra: ['Number System', 'Problems on Ages'],
  Probability: ['Permutations and Combinations'],
  'Permutations and Combinations': ['Probability'],
  'Mixtures and Allegations': ['Ratio and Proportion', 'Percentages'],
  'Data Interpretation': ['Averages', 'Percentages'],
  'Number Series': ['Alphabet Series', 'Odd One Out'],
  'Alphabet Series': ['Coding-Decoding', 'Number Series'],
  'Coding-Decoding': ['Alphabet Series', 'Analogies'],
  'Blood Relations': ['Puzzles', 'Directions'],
  Directions: ['Puzzles', 'Blood Relations'],
  'Seating Arrangement': ['Puzzles', 'Directions'],
  Syllogisms: ['Statement and Conclusions'],
  Analogies: ['Odd One Out', 'Vocabulary'],
  'Odd One Out': ['Analogies', 'Number Series'],
  Puzzles: ['Seating Arrangement', 'Blood Relations'],
  'Statement and Conclusions': ['Syllogisms'],
  Grammar: ['Sentence Correction', 'Fill in the Blanks'],
  Vocabulary: ['Synonyms', 'Antonyms'],
  Synonyms: ['Antonyms', 'Vocabulary'],
  Antonyms: ['Synonyms', 'Vocabulary'],
  'Sentence Correction': ['Grammar', 'Fill in the Blanks'],
  'Reading Comprehension': ['Vocabulary', 'Para Jumbles'],
  'Fill in the Blanks': ['Grammar', 'Vocabulary'],
  'Para Jumbles': ['Reading Comprehension', 'Grammar'],
}

function mcq(
  topic: string,
  difficulty: Difficulty,
  prompt: string,
  correct: string,
  wrong: string[],
  formula: string,
  steps: string[],
  rng: () => number,
  tip?: string,
): McqQuestion {
  const uniq = [correct, ...wrong.filter((w) => w !== correct)]
  while (uniq.length < 4) uniq.push(`${correct}′${uniq.length}`)
  const options = shuffle(rng, uniq.slice(0, 4)) as [string, string, string, string]
  return {
    id: `${topic}-${Math.floor(rng() * 1e9)}`,
    topic,
    difficulty,
    prompt,
    options,
    correctIndex: options.indexOf(correct),
    formula,
    steps,
    tip,
  }
}

function nearby(rng: () => number, correct: number, scale = 0.25): string[] {
  const set = new Set<string>()
  while (set.size < 3) {
    const jitter = 1 + (rng() * 2 - 1) * scale
    let v = Number.isInteger(correct) ? Math.round(correct * jitter) : Math.round(correct * jitter * 100) / 100
    if (v === correct || v <= 0) v = correct + set.size + 2
    set.add(String(v))
  }
  return [...set]
}

type Gen = (d: Difficulty, rng: () => number) => McqQuestion

const gens: Record<string, Gen> = {
  Percentages: (d, rng) => {
    const x = d === 'Easy' ? 50 + Math.floor(rng() * 10) * 10 : 120 + Math.floor(rng() * 80)
    const p = d === 'Easy' ? [10, 20, 25, 50][Math.floor(rng() * 4)]! : 12 + Math.floor(rng() * 30)
    const ans = (p / 100) * x
    const a = Number.isInteger(ans) ? String(ans) : fmt(ans)
    return mcq(
      'Percentages',
      d,
      `Find ${p}% of ${x}.`,
      a,
      nearby(rng, ans),
      'Value = (P/100) × N',
      [`${p}% of ${x} = (${p}/100) × ${x} = ${a}.`],
      rng,
      'Shift the decimal two places left, then multiply.',
    )
  },
  'Profit and Loss': (d, rng) => {
    const cp = 100 * (1 + Math.floor(rng() * 8))
    const p = d === 'Hard' ? 12 + Math.floor(rng() * 18) : [10, 20, 25][Math.floor(rng() * 3)]!
    const sp = cp * (1 + p / 100)
    return mcq(
      'Profit and Loss',
      d,
      `An article is bought for ₹${cp} and sold at ${p}% profit. Find the selling price.`,
      String(sp),
      nearby(rng, sp),
      'SP = CP × (100 + Profit%)/100',
      [`SP = ${cp} × ${100 + p}/100 = ${sp}.`],
      rng,
    )
  },
  'Simple Interest': (d, rng) => {
    const P = d === 'Easy' ? 1000 : 2500 + Math.floor(rng() * 5) * 500
    const R = [4, 5, 6, 8, 10][Math.floor(rng() * 5)]!
    const T = 1 + Math.floor(rng() * 4)
    const si = (P * R * T) / 100
    return mcq(
      'Simple Interest',
      d,
      `Find SI on ₹${P} at ${R}% per annum for ${T} years.`,
      String(si),
      nearby(rng, si),
      'SI = PRT/100',
      [`SI = (${P}×${R}×${T})/100 = ${si}.`],
      rng,
    )
  },
  'Compound Interest': (d, rng) => {
    const P = 1000 * (1 + Math.floor(rng() * 5))
    const R = [5, 10][Math.floor(rng() * 2)]!
    const T = d === 'Hard' ? 3 : 2
    const A = P * (1 + R / 100) ** T
    const ci = Math.round((A - P) * 100) / 100
    return mcq(
      'Compound Interest',
      d,
      `Find CI on ₹${P} at ${R}% p.a. for ${T} years, compounded annually.`,
      String(ci),
      nearby(rng, ci),
      'CI = P(1+R/100)^T − P',
      [`Amount = ${P}(1+${R}/100)^${T} = ${fmt(A)}.`, `CI = ${fmt(A)} − ${P} = ${ci}.`],
      rng,
    )
  },
  'Ratio and Proportion': (d, rng) => {
    const a = 2 + Math.floor(rng() * 5)
    const b = a + 1 + Math.floor(rng() * 4)
    const total = (a + b) * (d === 'Easy' ? 10 : 15)
    const s1 = (total * a) / (a + b)
    return mcq(
      'Ratio and Proportion',
      d,
      `Divide ${total} in the ratio ${a}:${b}. What is the first share?`,
      String(s1),
      nearby(rng, s1),
      'Share = Total × part/sum',
      [`First share = ${total} × ${a}/${a + b} = ${s1}.`],
      rng,
    )
  },
  Averages: (d, rng) => {
    const n = d === 'Easy' ? 5 : 6
    const nums = Array.from({ length: n }, () => 10 + Math.floor(rng() * 20))
    const avg = nums.reduce((x, y) => x + y, 0) / n
    const a = Number.isInteger(avg) ? String(avg) : fmt(avg)
    return mcq(
      'Averages',
      d,
      `Find the average of ${nums.join(', ')}.`,
      a,
      nearby(rng, avg),
      'Average = Sum / n',
      [`Sum = ${nums.reduce((x, y) => x + y, 0)}, n = ${n}, average = ${a}.`],
      rng,
    )
  },
  'Time and Work': (d, rng) => {
    const x = 8 + Math.floor(rng() * 8)
    const y = x + 2 + Math.floor(rng() * 6)
    const t = (x * y) / (x + y)
    const a = Number.isInteger(t) ? String(t) : fmt(t)
    return mcq(
      'Time and Work',
      d,
      `A can do a work in ${x} days and B in ${y} days. How many days will they take together?`,
      a,
      nearby(rng, t),
      'Together = xy/(x+y)',
      [`Time = ${x}×${y}/(${x}+${y}) = ${a} days.`],
      rng,
      'Take LCM of days as total work units.',
    )
  },
  'Pipes and Cisterns': (d, rng) => {
    const a = 10 + Math.floor(rng() * 6)
    const b = a + 6
    const t = (a * b) / (b - a)
    return mcq(
      'Pipes and Cisterns',
      d,
      `Pipe A fills a tank in ${a} hours and pipe B empties it in ${b} hours. If both are opened, time to fill is:`,
      fmt(t),
      nearby(rng, t),
      'Net rate = 1/A − 1/B',
      [`Net = 1/${a} − 1/${b}.`, `Time = ${a * b}/${b - a} = ${fmt(t)} hours.`],
      rng,
    )
  },
  'Time, Speed and Distance': (d, rng) => {
    if (rng() > 0.45) {
      const dist = d === 'Easy' ? 240 : 360
      const t = d === 'Easy' ? 4 : 5
      const s = dist / t
      return mcq(
        'Time, Speed and Distance',
        d,
        `A train travels ${dist} km in ${t} hours. What is its speed?`,
        `${s} km/h`,
        nearby(rng, s).map((x) => `${x} km/h`),
        'Speed = Distance ÷ Time',
        [`${dist} ÷ ${t} = ${s} km/h.`],
        rng,
      )
    }
    const L = 100 + Math.floor(rng() * 5) * 20
    const t = 8 + Math.floor(rng() * 5)
    const mps = L / t
    const kmh = mps * (18 / 5)
    return mcq(
      'Time, Speed and Distance',
      d,
      `A train ${L} meters long crosses a pole in ${t} seconds. Find its speed in km/h.`,
      fmt(kmh),
      nearby(rng, kmh),
      'Speed = L/t m/s; km/h = m/s × 18/5',
      [`${L}/${t} = ${fmt(mps)} m/s.`, `${fmt(mps)} × 18/5 = ${fmt(kmh)} km/h.`],
      rng,
    )
  },
  'Boats and Streams': (d, rng) => {
    const b = 10 + Math.floor(rng() * 8)
    const s = 2 + Math.floor(rng() * 4)
    return mcq(
      'Boats and Streams',
      d,
      `Speed of a boat in still water is ${b} km/h and stream is ${s} km/h. Downstream speed is:`,
      `${b + s} km/h`,
      nearby(rng, b + s).map((x) => `${x} km/h`),
      'Downstream = boat + stream',
      [`${b} + ${s} = ${b + s} km/h.`],
      rng,
    )
  },
  'Problems on Ages': (d, rng) => {
    const son = 8 + Math.floor(rng() * 8)
    const k = 3 + Math.floor(rng() * 3)
    const father = son * k
    return mcq(
      'Problems on Ages',
      d,
      `A father is ${k} times as old as his son. If the son is ${son} years old, father's age is:`,
      `${father} years`,
      nearby(rng, father).map((x) => `${x} years`),
      'Father = k × son',
      [`${k} × ${son} = ${father} years.`],
      rng,
    )
  },
  'Number System': (d, rng) => {
    const n = 21 + Math.floor(rng() * 80)
    const odd = n % 2 ? 'Odd' : 'Even'
    const other = odd === 'Odd' ? 'Even' : 'Odd'
    return mcq(
      'Number System',
      d,
      `The number ${n} is:`,
      odd,
      [other, 'Prime', 'Negative'],
      'Even iff divisible by 2',
      [`${n} ÷ 2 remainder ${n % 2}, so it is ${odd}.`],
      rng,
    )
  },
  'HCF and LCM': (d, rng) => {
    const g = 2 + Math.floor(rng() * 6)
    const a = g * (2 + Math.floor(rng() * 4))
    const b = g * (3 + Math.floor(rng() * 5))
    const h = (function gcd(x: number, y: number): number {
      return y ? gcd(y, x % y) : x
    })(a, b)
    return mcq(
      'HCF and LCM',
      d,
      `Find HCF of ${a} and ${b}.`,
      String(h),
      nearby(rng, h, 0.6),
      'HCF is the greatest common divisor',
      [`HCF(${a}, ${b}) = ${h}.`],
      rng,
    )
  },
  Algebra: (d, rng) => {
    const a = 2 + Math.floor(rng() * 5)
    const b = 3 + Math.floor(rng() * 8)
    const x = 2 + Math.floor(rng() * 9)
    const c = a * x + b
    return mcq(
      'Algebra',
      d,
      `Solve for x: ${a}x + ${b} = ${c}`,
      String(x),
      nearby(rng, x, 0.8),
      'x = (c − b)/a',
      [`${a}x = ${c - b}`, `x = ${x}.`],
      rng,
    )
  },
  Probability: (d, rng) => {
    if (d === 'Easy' || rng() > 0.5) {
      return mcq(
        'Probability',
        d,
        'Find the probability of getting a head when a fair coin is tossed.',
        '1/2',
        ['1/3', '1/4', '1'],
        'P = favourable/total',
        ['Total outcomes = 2.', 'P(H) = 1/2.'],
        rng,
      )
    }
    return mcq(
      'Probability',
      d,
      'A fair die is thrown. Probability of getting an even number is:',
      '1/2',
      ['1/3', '1/6', '2/3'],
      'Even faces: 2, 4, 6 → 3/6 = 1/2',
      ['Favourable = 3, total = 6, P = 1/2.'],
      rng,
    )
  },
  'Permutations and Combinations': (d, rng) => {
    const n = d === 'Easy' ? 5 : 6
    const r = 2
    const c = nCr(n, r)
    return mcq(
      'Permutations and Combinations',
      d,
      `Find C(${n}, ${r}).`,
      String(c),
      nearby(rng, c, 0.4),
      'C(n,r) = n! / (r!(n−r)!)',
      [`C(${n},${r}) = ${c}.`],
      rng,
    )
  },
  'Mixtures and Allegations': (d, rng) => {
    const a = 10 + Math.floor(rng() * 15)
    const b = a + 10 + Math.floor(rng() * 15)
    const mean = (a + b) / 2
    return mcq(
      'Mixtures and Allegations',
      d,
      `In what ratio must ${a}% and ${b}% solutions be mixed to get ${mean}%?`,
      '1 : 1',
      ['2 : 1', '1 : 2', '3 : 1'],
      'Allegation: (b − mean) : (mean − a)',
      [`(${b}−${mean}) : (${mean}−${a}) = 1 : 1.`],
      rng,
    )
  },
  'Data Interpretation': (d, rng) => {
    const a = 20 + Math.floor(rng() * 20)
    const b = 20 + Math.floor(rng() * 20)
    const c = 20 + Math.floor(rng() * 20)
    const avg = (a + b + c) / 3
    return mcq(
      'Data Interpretation',
      d,
      `Sales (in thousands): Jan ${a}, Feb ${b}, Mar ${c}. Average monthly sales?`,
      fmt(avg),
      nearby(rng, avg),
      'Average = Sum / 3',
      [`(${a}+${b}+${c})/3 = ${fmt(avg)}.`],
      rng,
    )
  },
  'Number Series': (d, rng) => {
    const d0 = 2 + Math.floor(rng() * 5)
    const a0 = 3 + Math.floor(rng() * 8)
    const seq = [a0, a0 + d0, a0 + 2 * d0, a0 + 3 * d0]
    const next = a0 + 4 * d0
    return mcq(
      'Number Series',
      d,
      `Find the next term: ${seq.join(', ')}, ?`,
      String(next),
      nearby(rng, next, 0.35),
      'AP: next = last + d',
      [`Common difference = ${d0}.`, `Next = ${seq[3]} + ${d0} = ${next}.`],
      rng,
    )
  },
  'Alphabet Series': (d, rng) => {
    const start = 65 + Math.floor(rng() * 8)
    const jump = 2
    const letters = [0, 1, 2, 3].map((i) => String.fromCharCode(start + i * jump))
    const next = String.fromCharCode(start + 4 * jump)
    const wr = [1, 2, 3].map((k) => String.fromCharCode(((start + 4 * jump - 65 + k) % 26) + 65))
    return mcq(
      'Alphabet Series',
      d,
      `Find the next letter: ${letters.join(', ')}, ?`,
      next,
      wr,
      'Equal skip in the alphabet',
      [`Each letter jumps +${jump}.`, `Next = ${next}.`],
      rng,
    )
  },
  'Coding-Decoding': (d, rng) => {
    const words = ['CAT', 'DOG', 'BAT', 'SUN', 'PEN', 'RAT', 'MAP', 'NET', 'CUP', 'BOX', 'FAN', 'HAT', 'JAM', 'KEY', 'LID', 'MUG', 'OWL', 'PIG', 'RUG', 'VAN']
    const w = pick(rng, words)
    const k = d === 'Hard' ? 2 + Math.floor(rng() * 3) : 1
    const shift = (s: string) =>
      [...s].map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26) + 65)).join('')
    const sample = pick(rng, words.filter((x) => x !== w))
    const coded = shift(w)
    const ask = shift(sample)
    const wrong = [1, 2, 3].map((j) =>
      [...sample].map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k + j) % 26) + 65)).join(''),
    )
    return mcq(
      'Coding-Decoding',
      d,
      `If ${w} is coded as ${coded}, how is ${sample} coded?`,
      ask,
      wrong,
      `Each letter +${k}`,
      [`${w} → ${coded} (shift ${k}).`, `${sample} → ${ask}.`],
      rng,
    )
  },
  'Blood Relations': (d, rng) => {
    return mcq(
      'Blood Relations',
      d,
      "Pointing to a boy, Rina says, “He is the son of my grandfather's only son.” How is the boy related to Rina?",
      'Brother',
      ['Uncle', 'Cousin', 'Father'],
      "Grandfather's only son = Rina's father",
      ["The boy is the son of Rina's father, so he is Rina's brother."],
      rng,
    )
  },
  Directions: (d, rng) => {
    return mcq(
      'Directions',
      d,
      'A man walks 3 km north, then 4 km east. How far is he from the start?',
      '5 km',
      ['7 km', '1 km', '12 km'],
      'Displacement = √(x² + y²)',
      ['√(3² + 4²) = √25 = 5 km.'],
      rng,
      '3-4-5 is a standard right triangle.',
    )
  },
  'Seating Arrangement': (d, rng) => {
    return mcq(
      'Seating Arrangement',
      d,
      'Five people A, B, C, D, E sit in a row facing north. A is at the left end, E at the right end, C is immediate right of A, D is not next to E. Who sits in the middle?',
      'D',
      ['B', 'C', 'A'],
      'Fix the ends, then apply remaining constraints',
      [
        'Left to right: A, C, _, _, E.',
        'D is not next to E, so D is not in seat 4.',
        'Therefore D is seat 3 (middle) and B is seat 4: A C D B E.',
      ],
      rng,
    )
  },
  Syllogisms: (d, rng) => {
    return mcq(
      'Syllogisms',
      d,
      'Statements: All cats are animals. All animals are living. Conclusion: All cats are living. The conclusion:',
      'Follows',
      ['Does not follow', 'Either follows', 'Data inadequate'],
      'All A are B and All B are C ⇒ All A are C',
      ['Cats ⊆ Animals ⊆ Living, so Cats ⊆ Living.'],
      rng,
    )
  },
  Analogies: (d, rng) => {
    const item = pick(rng, [
      { p: 'Pen : Write :: Knife : ?', a: 'Cut', w: ['Sharp', 'Kitchen', 'Blade'], f: 'Tool : primary function', s: ['A pen is used to write; a knife is used to cut.'] },
      { p: 'Bird : Nest :: Bee : ?', a: 'Hive', w: ['Honey', 'Flower', 'Wing'], f: 'Animal : dwelling', s: ['A bird lives in a nest; a bee lives in a hive.'] },
      { p: 'Doctor : Hospital :: Teacher : ?', a: 'School', w: ['Student', 'Book', 'Chalk'], f: 'Profession : workplace', s: ['A doctor works in a hospital; a teacher works in a school.'] },
      { p: 'Hour : Minute :: Minute : ?', a: 'Second', w: ['Day', 'Clock', 'Time'], f: 'Larger unit : next smaller unit', s: ['60 minutes in an hour; 60 seconds in a minute.'] },
    ])
    return mcq('Analogies', d, item.p, item.a, item.w, item.f, item.s, rng)
  },
  'Odd One Out': (d, rng) => {
    return mcq(
      'Odd One Out',
      d,
      'Find the odd one out: 2, 3, 5, 9, 11',
      '9',
      ['2', '5', '11'],
      'Prime numbers vs composite',
      ['2, 3, 5, 11 are prime; 9 = 3×3 is not.'],
      rng,
    )
  },
  Puzzles: (d, rng) => {
    return mcq(
      'Puzzles',
      d,
      'A is taller than B. C is taller than A. D is shorter than B. Who is the tallest?',
      'C',
      ['A', 'B', 'D'],
      'Chain the inequalities',
      ['C > A > B > D, so C is tallest.'],
      rng,
    )
  },
  'Statement and Conclusions': (d, rng) => {
    return mcq(
      'Statement and Conclusions',
      d,
      'Statement: All skilled players practice daily. Conclusion: Some people who practice daily are skilled players. The conclusion:',
      'Follows',
      ['Does not follow', 'Probably follows', 'Cannot say'],
      'All A are B ⇒ Some B are A (if A exists)',
      ['Skilled players ⊆ daily practicers, so some daily practicers are skilled.'],
      rng,
    )
  },
  Grammar: (d, rng) => {
    return mcq(
      'Grammar',
      d,
      'Choose the correct sentence.',
      'She goes to college every day.',
      ['She go to college every day.', 'She going to college every day.', 'She gone to college every day.'],
      'Third-person singular present takes -s',
      ['She (singular) + goes.'],
      rng,
    )
  },
  Vocabulary: (d, rng) => {
    return mcq(
      'Vocabulary',
      d,
      'A person who speaks many languages is a:',
      'Polyglot',
      ['Bilingual', 'Linguist only', 'Orator'],
      'Root: poly- (many) + glot (tongue)',
      ['Polyglot = speaker of several languages.'],
      rng,
    )
  },
  Synonyms: (d, rng) => {
    const item = pick(rng, [
      { p: 'Synonym of DILIGENT:', a: 'Hardworking', w: ['Lazy', 'Proud', 'Careless'] },
      { p: 'Synonym of BRIEF:', a: 'Concise', w: ['Lengthy', 'Slow', 'Loud'] },
      { p: 'Synonym of CANDID:', a: 'Frank', w: ['Secretive', 'Angry', 'Rude'] },
      { p: 'Synonym of ADVERSE:', a: 'Unfavourable', w: ['Helpful', 'Friendly', 'Lucky'] },
      { p: 'Synonym of METICULOUS:', a: 'Careful', w: ['Hasty', 'Messy', 'Bold'] },
    ])
    return mcq('Synonyms', d, item.p, item.a, item.w, 'Closest meaning in exam English', [`Closest meaning: ${item.a.toLowerCase()}.`], rng)
  },
  Antonyms: (d, rng) => {
    const item = pick(rng, [
      { p: 'Antonym of ABUNDANT:', a: 'Scarce', w: ['Plentiful', 'Ample', 'Copious'] },
      { p: 'Antonym of OPTIMIST:', a: 'Pessimist', w: ['Realist only', 'Idealist', 'Activist'] },
      { p: 'Antonym of TRANSPARENT:', a: 'Opaque', w: ['Clear', 'Lucid', 'Open'] },
      { p: 'Antonym of EXPAND:', a: 'Contract', w: ['Enlarge', 'Widen', 'Increase'] },
      { p: 'Antonym of GENUINE:', a: 'Fake', w: ['Real', 'True', 'Sincere'] },
    ])
    return mcq('Antonyms', d, item.p, item.a, item.w, 'Opposite meaning', [`Opposite: ${item.a.toLowerCase()}.`], rng)
  },
  'Sentence Correction': (d, rng) => {
    return mcq(
      'Sentence Correction',
      d,
      'Neither of the students _____ present.',
      'was',
      ['were', 'are', 'have'],
      'Neither is singular',
      ['Neither of + plural noun still takes a singular verb: was.'],
      rng,
    )
  },
  'Reading Comprehension': (d, rng) => {
    return mcq(
      'Reading Comprehension',
      d,
      'Passage: “Campus placements reward consistent practice more than last-minute cramming.” The author mainly suggests that:',
      'Regular practice is more effective',
      ['Cramming is enough', 'Practice is useless', 'Luck decides placements'],
      'Main idea is the central claim of the passage',
      ['The contrast “more than last-minute cramming” highlights consistent practice.'],
      rng,
    )
  },
  'Fill in the Blanks': (d, rng) => {
    const item = pick(rng, [
      { p: 'She has been working here _____ 2021.', a: 'since', w: ['for', 'from', 'at'], s: '2021 is a point in time → since.' },
      { p: 'They have lived in Pune _____ five years.', a: 'for', w: ['since', 'from', 'at'], s: 'Five years is a period → for.' },
      { p: 'I prefer tea _____ coffee.', a: 'to', w: ['than', 'over than', 'from'], s: 'prefer X to Y.' },
      { p: 'He is good _____ mathematics.', a: 'at', w: ['in', 'on', 'with'], s: 'Standard collocation: good at.' },
    ])
    return mcq('Fill in the Blanks', d, item.p, item.a, item.w, 'since + point; for + period; prefer to; good at', [item.s], rng)
  },
  'Para Jumbles': (d, rng) => {
    return mcq(
      'Para Jumbles',
      d,
      'Arrange: (A) Therefore he practised daily. (B) Rohan wanted a campus offer. (C) Soon his aptitude improved. Best order:',
      'B A C',
      ['A B C', 'C A B', 'B C A'],
      'Cause → action → result; pronouns follow nouns',
      ['B introduces Rohan, A is the action, C is the result.'],
      rng,
    )
  },
}

export function buildQuiz(topic: string, difficulty: Difficulty, count: number, seed = Date.now()): McqQuestion[] {
  const gen = gens[topic]
  if (!gen) throw new Error('Unknown topic')
  const rng = mulberry32(seed)
  const items: McqQuestion[] = []
  const seen = new Set<string>()
  let guard = 0
  while (items.length < count && guard < count * 40) {
    guard++
    const q = gen(difficulty, rng)
    if (seen.has(q.prompt)) continue
    seen.add(q.prompt)
    items.push(q)
  }
  while (items.length < count) {
    const q = gen(difficulty, rng)
    q.id = `${q.id}-${items.length}`
    items.push(q)
  }
  return items
}

export function summarizePractice(
  questions: McqQuestion[],
  answers: Array<number | null>,
  seconds: number,
): PracticeResult {
  let correct = 0
  const missed: string[] = []
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct++
    else missed.push(q.topic)
  })
  const total = questions.length
  const wrong = total - correct
  const accuracy = total ? Math.round((correct / total) * 1000) / 10 : 0
  const weakTopics = [...new Set(missed)]
  const recommended = [...new Set(weakTopics.flatMap((t) => RELATED[t] ?? []))]
    .filter((t) => t !== questions[0]?.topic)
    .slice(0, 4)
  if (!recommended.length && questions[0]) {
    recommended.push(...(RELATED[questions[0].topic] ?? []).slice(0, 3))
  }
  return { total, correct, wrong, accuracy, seconds, weakTopics, recommended }
}
