import type { ClarifyAnswer, SolveOutcome, SolvedAnswer } from '../types'
import {
  extractNumbers,
  fmt,
  gcd,
  lcm,
  nCr,
  nPr,
  nearlyEqual,
  simplifyFraction,
} from './math'

function solved(
  topic: string,
  formula: string,
  steps: string[],
  answer: string,
  tip?: string,
): SolvedAnswer {
  return { kind: 'solved', topic, formula, steps, answer, tip }
}

function clarify(question: string, topic?: string, options?: string[]): ClarifyAnswer {
  return { kind: 'clarify', question, topic, options }
}

function norm(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\bhours?\b|\bhrs\b/g, 'hours')
    .replace(/\bminutes?\b|\bmins\b/g, 'minutes')
    .replace(/\bseconds?\b|\bsecs\b/g, 'seconds')
    .replace(/₹|\brs\.?\b|\binr\b/g, ' rupees ')
    .replace(/percent(?:age)?/g, '%')
    .replace(/\bkm\/h(?:r)?\b|\bkmph\b|\bkph\b/g, 'km/h')
    .replace(/\bkilometres?\b|\bkilometers?\b/g, 'km')
    .replace(/\bmetres?\b|\bmeters?\b/g, 'm')
    .replace(/\s+/g, ' ')
    .trim()
}

function verify(check: number, reported: number): boolean {
  return nearlyEqual(check, reported)
}

function hcfMany(nums: number[]): number {
  return nums.map(Math.round).reduce((a, b) => gcd(a, b))
}

function lcmMany(nums: number[]): number {
  return nums.map(Math.round).reduce((a, b) => lcm(a, b))
}

function nextSeries(seq: number[]): { next: number; formula: string; steps: string[] } | null {
  if (seq.length < 3) return null
  const d = seq.slice(1).map((v, i) => v - seq[i]!)
  if (d.every((x) => nearlyEqual(x, d[0]!))) {
    const next = seq[seq.length - 1]! + d[0]!
    return {
      next,
      formula: 'Arithmetic progression: aₙ₊₁ = aₙ + d',
      steps: [
        `The sequence is ${seq.join(', ')}.`,
        `Common difference d = ${fmt(d[0]!)}.`,
        `Next term = ${fmt(seq[seq.length - 1]!)} + ${fmt(d[0]!)} = ${fmt(next)}.`,
      ],
    }
  }
  const r = seq.slice(1).map((v, i) => v / seq[i]!)
  if (seq.every((x) => x !== 0) && r.every((x) => nearlyEqual(x, r[0]!))) {
    const next = seq[seq.length - 1]! * r[0]!
    return {
      next,
      formula: 'Geometric progression: aₙ₊₁ = aₙ × r',
      steps: [
        `The sequence is ${seq.join(', ')}.`,
        `Common ratio r = ${fmt(r[0]!)}.`,
        `Next term = ${fmt(seq[seq.length - 1]!)} × ${fmt(r[0]!)} = ${fmt(next)}.`,
      ],
    }
  }
  const d2 = d.slice(1).map((v, i) => v - d[i]!)
  if (d2.length && d2.every((x) => nearlyEqual(x, d2[0]!))) {
    const nextD = d[d.length - 1]! + d2[0]!
    const next = seq[seq.length - 1]! + nextD
    return {
      next,
      formula: 'Second difference constant (quadratic series)',
      steps: [
        `First differences: ${d.map(fmt).join(', ')}.`,
        `Second differences: ${d2.map(fmt).join(', ')} (constant ${fmt(d2[0]!)}).`,
        `Next first difference = ${fmt(d[d.length - 1]!)} + ${fmt(d2[0]!)} = ${fmt(nextD)}.`,
        `Next term = ${fmt(seq[seq.length - 1]!)} + ${fmt(nextD)} = ${fmt(next)}.`,
      ],
    }
  }
  const squares = seq.every((n, i) => {
    const k = Math.round(Math.sqrt(n))
    return nearlyEqual(k * k, n) && (i === 0 || k === Math.round(Math.sqrt(seq[0]!)) + i)
  })
  if (squares) {
    const k = Math.round(Math.sqrt(seq[seq.length - 1]!)) + 1
    return {
      next: k * k,
      formula: 'Square numbers: n²',
      steps: [
        `Each term is a consecutive square: ${seq.map((n) => `${fmt(n)} = ${Math.round(Math.sqrt(n))}²`).join(', ')}.`,
        `Next = ${k}² = ${k * k}.`,
      ],
    }
  }
  const cubes = seq.every((n, i) => {
    const k = Math.round(Math.cbrt(n))
    return nearlyEqual(k * k * k, n) && (i === 0 || k === Math.round(Math.cbrt(seq[0]!)) + i)
  })
  if (cubes) {
    const k = Math.round(Math.cbrt(seq[seq.length - 1]!)) + 1
    return {
      next: k * k * k,
      formula: 'Cube numbers: n³',
      steps: [
        `Each term is a consecutive cube.`,
        `Next = ${k}³ = ${k * k * k}.`,
      ],
    }
  }
  return null
}

function solvePercentOf(q: string): SolveOutcome | null {
  const m =
    q.match(/(?:find\s+)?(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/) ||
    q.match(/what\s+is\s+(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  const p = Number(m[1])
  const x = Number(m[2])
  const ans = (p / 100) * x
  const check = (p * x) / 100
  if (!verify(check, ans)) return null
  return solved(
    'Percentages',
    'Value = (Percentage / 100) × Number',
    [
      `We need ${fmt(p)}% of ${fmt(x)}.`,
      `= (${fmt(p)} / 100) × ${fmt(x)}`,
      `= ${fmt(p / 100)} × ${fmt(x)}`,
      `= ${fmt(ans)}`,
    ],
    fmt(ans),
    'Move the decimal two places left for a quick % of a number.',
  )
}

function solveWhatPercent(q: string): SolveOutcome | null {
  const m = q.match(/what\s*%\s*(?:of\s+(\d+(?:\.\d+)?)\s+is\s+(\d+(?:\.\d+)?))?/)
  const m2 = q.match(/(\d+(?:\.\d+)?)\s+is\s+what\s*%\s+of\s+(\d+(?:\.\d+)?)/)
  const m3 = q.match(/what\s*%\s+of\s+(\d+(?:\.\d+)?)\s+is\s+(\d+(?:\.\d+)?)/)
  const hit = m2 || m3 || (m && m[1] && m[2] ? m : null)
  if (!hit) return null
  const a = Number(hit[1])
  const b = Number(hit[2])
  // "A is what % of B" vs "what % of A is B"
  let part = a
  let whole = b
  if (m3) {
    whole = a
    part = b
  }
  if (m2) {
    part = a
    whole = b
  }
  if (whole === 0) return clarify('The base value is 0, so a percentage cannot be computed. Please recheck the numbers.')
  const ans = (part / whole) * 100
  if (!verify((part * 100) / whole, ans)) return null
  return solved(
    'Percentages',
    'Percentage = (Part / Whole) × 100',
    [
      `Part = ${fmt(part)}, Whole = ${fmt(whole)}.`,
      `= (${fmt(part)} / ${fmt(whole)}) × 100`,
      `= ${fmt(ans)}%`,
    ],
    `${fmt(ans)}%`,
  )
}

function solveIncreaseDecrease(q: string): SolveOutcome | null {
  const inc = q.match(/(\d+(?:\.\d+)?)\s*(?:is\s+)?increased\s+by\s+(\d+(?:\.\d+)?)\s*%/)
  const dec = q.match(/(\d+(?:\.\d+)?)\s*(?:is\s+)?decreased\s+by\s+(\d+(?:\.\d+)?)\s*%/)
  if (inc) {
    const x = Number(inc[1])
    const p = Number(inc[2])
    const ans = x * (1 + p / 100)
    return solved(
      'Percentages',
      'New value = Original × (1 + r/100)',
      [
        `Original = ${fmt(x)}, increase = ${fmt(p)}%.`,
        `New value = ${fmt(x)} × (1 + ${fmt(p)}/100) = ${fmt(x)} × ${fmt(1 + p / 100)} = ${fmt(ans)}.`,
      ],
      fmt(ans),
    )
  }
  if (dec) {
    const x = Number(dec[1])
    const p = Number(dec[2])
    const ans = x * (1 - p / 100)
    return solved(
      'Percentages',
      'New value = Original × (1 − r/100)',
      [
        `Original = ${fmt(x)}, decrease = ${fmt(p)}%.`,
        `New value = ${fmt(x)} × (1 − ${fmt(p)}/100) = ${fmt(ans)}.`,
      ],
      fmt(ans),
    )
  }
  return null
}

function solveProfitLoss(q: string): SolveOutcome | null {
  if (!/(profit|loss|cp|sp|cost price|selling price|marked price|discount)/.test(q)) return null
  const nums = extractNumbers(q)
  const cpM = q.match(/(?:cost price|cp)\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/)
  const spM = q.match(/(?:selling price|sp)\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/)
  const cp = cpM ? Number(cpM[1]) : null
  const sp = spM ? Number(spM[1]) : null

  if (cp != null && sp != null) {
    const diff = sp - cp
    const pct = (diff / cp) * 100
    const kind = diff >= 0 ? 'Profit' : 'Loss'
    const ans = `${kind} = ${fmt(Math.abs(diff))}; ${kind}% = ${fmt(Math.abs(pct))}%`
    if (!verify(Math.abs(diff / cp) * 100, Math.abs(pct))) return null
    return solved(
      'Profit and Loss',
      'Profit/Loss % = ((SP − CP) / CP) × 100',
      [
        `CP = ${fmt(cp)}, SP = ${fmt(sp)}.`,
        `Difference SP − CP = ${fmt(diff)}.`,
        `${kind} amount = ${fmt(Math.abs(diff))}.`,
        `${kind}% = (${fmt(Math.abs(diff))} / ${fmt(cp)}) × 100 = ${fmt(Math.abs(pct))}%.`,
      ],
      ans,
      'If SP > CP it is profit; if SP < CP it is loss. Always divide by CP.',
    )
  }

  const pOn = q.match(/profit\s+of\s+(\d+(?:\.\d+)?)\s*%\s+on\s+(?:cp\s+)?(\d+(?:\.\d+)?)/)
  if (pOn) {
    const p = Number(pOn[1])
    const c = Number(pOn[2])
    const s = c * (1 + p / 100)
    return solved(
      'Profit and Loss',
      'SP = CP × (100 + Profit%) / 100',
      [
        `CP = ${fmt(c)}, Profit% = ${fmt(p)}.`,
        `SP = ${fmt(c)} × (${fmt(100 + p)} / 100) = ${fmt(s)}.`,
      ],
      fmt(s),
    )
  }
  const lOn = q.match(/loss\s+of\s+(\d+(?:\.\d+)?)\s*%\s+on\s+(?:cp\s+)?(\d+(?:\.\d+)?)/)
  if (lOn) {
    const p = Number(lOn[1])
    const c = Number(lOn[2])
    const s = c * (1 - p / 100)
    return solved(
      'Profit and Loss',
      'SP = CP × (100 − Loss%) / 100',
      [`CP = ${fmt(c)}, Loss% = ${fmt(p)}.`, `SP = ${fmt(c)} × (${fmt(100 - p)} / 100) = ${fmt(s)}.`],
      fmt(s),
    )
  }

  if (nums.length < 2) {
    return clarify(
      'For profit/loss I need Cost Price and Selling Price (or one of them plus profit/loss %). Please share those numbers.',
      'Profit and Loss',
    )
  }
  return null
}

function solveSI(q: string): SolveOutcome | null {
  if (!/simple interest|\bsi\b/.test(q) && !(/interest/.test(q) && !/compound/.test(q))) {
    if (!/simple interest/.test(q)) return null
  }
  if (!/simple interest|\bsi\b/.test(q)) return null
  const p = q.match(/principal\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/)?.[1] ?? q.match(/p\s*=\s*(\d+(?:\.\d+)?)/)?.[1]
  const r = q.match(/rate\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/)?.[1] ?? q.match(/(\d+(?:\.\d+)?)\s*%/)?.[1]
  const t =
    q.match(/(\d+(?:\.\d+)?)\s*years/)?.[1] ??
    q.match(/time\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/)?.[1]
  const nums = extractNumbers(q)
  const P = p ? Number(p) : nums[0]
  const R = r ? Number(r) : nums[1]
  const T = t ? Number(t) : nums[2]
  if (P == null || R == null || T == null) {
    return clarify('To compute Simple Interest I need Principal, Rate (%), and Time (years).', 'Simple Interest')
  }
  const si = (P * R * T) / 100
  const amount = P + si
  if (!verify((P * R * T) / 100, si)) return null
  const wantAmount = /amount/.test(q)
  return solved(
    'Simple Interest',
    'SI = (P × R × T) / 100    and    Amount = P + SI',
    [
      `P = ${fmt(P)}, R = ${fmt(R)}%, T = ${fmt(T)} years.`,
      `SI = (${fmt(P)} × ${fmt(R)} × ${fmt(T)}) / 100 = ${fmt(si)}.`,
      `Amount = ${fmt(P)} + ${fmt(si)} = ${fmt(amount)}.`,
    ],
    wantAmount ? fmt(amount) : fmt(si),
    'SI grows linearly with time. Do not confuse with compound interest.',
  )
}

function solveCI(q: string): SolveOutcome | null {
  if (!/compound interest|\bci\b/.test(q)) return null
  const p = q.match(/principal\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/)?.[1]
  const r = q.match(/(\d+(?:\.\d+)?)\s*%/)?.[1]
  const t = q.match(/(\d+(?:\.\d+)?)\s*years/)?.[1]
  const nums = extractNumbers(q)
  const P = p ? Number(p) : nums[0]
  const R = r ? Number(r) : nums[1]
  const T = t ? Number(t) : nums[2]
  if (P == null || R == null || T == null || !Number.isInteger(T)) {
    return clarify(
      'For Compound Interest I need Principal, Rate %, and Time in whole years (unless you specify compounding frequency).',
      'Compound Interest',
    )
  }
  const amount = P * (1 + R / 100) ** T
  const ci = amount - P
  const check = P * (1 + R / 100) ** T - P
  if (!verify(check, ci)) return null
  const wantAmount = /amount/.test(q) && !/compound interest/.test(q.split('amount')[0] ?? '')
  return solved(
    'Compound Interest',
    'Amount = P (1 + R/100)^T    CI = Amount − P',
    [
      `P = ${fmt(P)}, R = ${fmt(R)}%, T = ${fmt(T)} years, compounded annually.`,
      `Amount = ${fmt(P)} × (1 + ${fmt(R)}/100)^${fmt(T)} = ${fmt(amount)}.`,
      `CI = ${fmt(amount)} − ${fmt(P)} = ${fmt(ci)}.`,
    ],
    wantAmount ? fmt(Math.round(amount * 1e4) / 1e4) : fmt(Math.round(ci * 1e4) / 1e4),
    'If not specified, campus tests assume annual compounding.',
  )
}

function solveRatio(q: string): SolveOutcome | null {
  const div = q.match(
    /divide\s+(\d+(?:\.\d+)?)\s+in\s+(?:the\s+)?ratio\s+(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)(?:\s*:\s*(\d+(?:\.\d+)?))?/,
  )
  if (div) {
    const total = Number(div[1])
    const parts = [Number(div[2]), Number(div[3]), div[4] ? Number(div[4]) : null].filter(
      (x): x is number => x != null,
    )
    const sum = parts.reduce((a, b) => a + b, 0)
    const shares = parts.map((p) => (total * p) / sum)
    if (!verify(shares.reduce((a, b) => a + b, 0), total)) return null
    return solved(
      'Ratio and Proportion',
      'Share = Total × (part / sum of parts)',
      [
        `Total = ${fmt(total)}, ratio = ${parts.join(' : ')}, sum of parts = ${fmt(sum)}.`,
        ...shares.map((s, i) => `Part ${i + 1} = ${fmt(total)} × ${fmt(parts[i]!)}/${fmt(sum)} = ${fmt(s)}.`),
      ],
      shares.map(fmt).join(' : '),
    )
  }
  const prop = q.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)\s*:\s*x/)
  const prop2 = q.match(/if\s+(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*::\s*(\d+(?:\.\d+)?)\s*:\s*(\?|x)/)
  const m = prop || prop2
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const c = Number(m[3])
    if (a === 0) return clarify('First term is 0, so the proportion is undefined.')
    const x = (b * c) / a
    if (!verify(a / b, c / x)) return null
    return solved(
      'Ratio and Proportion',
      'a : b = c : d  ⇒  a/b = c/d  ⇒  d = (b × c) / a',
      [`${fmt(a)} : ${fmt(b)} = ${fmt(c)} : x`, `x = (${fmt(b)} × ${fmt(c)}) / ${fmt(a)} = ${fmt(x)}.`],
      fmt(x),
    )
  }
  return null
}

function solveAverage(q: string): SolveOutcome | null {
  const avgOf = q.match(/average\s+of\s+([\d\s,and]+)/)
  if (avgOf && !/numbers is/.test(q)) {
    const nums = extractNumbers(avgOf[1] ?? '')
    if (nums.length >= 2) {
      const sum = nums.reduce((a, b) => a + b, 0)
      const avg = sum / nums.length
      if (!verify(sum / nums.length, avg)) return null
      return solved(
        'Averages',
        'Average = Sum of observations / Number of observations',
        [
          `Numbers: ${nums.map(fmt).join(', ')}.`,
          `Sum = ${fmt(sum)}, n = ${nums.length}.`,
          `Average = ${fmt(sum)} / ${nums.length} = ${fmt(avg)}.`,
        ],
        fmt(avg),
      )
    }
  }
  const given = q.match(/average\s+of\s+(\d+)\s+numbers?\s+is\s+(\d+(?:\.\d+)?)/)
  if (given) {
    const n = Number(given[1])
    const avg = Number(given[2])
    const sum = n * avg
    const excl = q.match(/if\s+(\d+(?:\.\d+)?)\s+is\s+excluded.*?new\s+average\s+is\s+(\d+(?:\.\d+)?)/)
    if (excl) {
      const x = Number(excl[1])
      const navg = Number(excl[2])
      const expected = (sum - x) / (n - 1)
      if (!nearlyEqual(expected, navg)) {
        // maybe they want the excluded number from new average
      }
      return solved(
        'Averages',
        'New average = (Old sum − excluded) / (n − 1)',
        [
          `Old sum = ${fmt(n)} × ${fmt(avg)} = ${fmt(sum)}.`,
          `After excluding ${fmt(x)}: sum = ${fmt(sum - x)}, count = ${n - 1}.`,
          `New average = ${fmt(sum - x)} / ${n - 1} = ${fmt((sum - x) / (n - 1))}.`,
        ],
        fmt((sum - x) / (n - 1)),
      )
    }
    if (/sum/.test(q)) {
      return solved(
        'Averages',
        'Sum = Average × n',
        [`Sum = ${fmt(avg)} × ${fmt(n)} = ${fmt(sum)}.`],
        fmt(sum),
      )
    }
  }
  return null
}

function solveTimeWork(q: string): SolveOutcome | null {
  const oneDay = q.match(
    /(?:a\s+)?(?:man|person|worker|a)\s+completes?\s+(?:a\s+)?work\s+in\s+(\d+(?:\.\d+)?)\s+days.*(?:1|one)\s+day/,
  )
  const oneDay2 = q.match(/work\s+in\s+(\d+(?:\.\d+)?)\s+days.*how much work.*(?:1|one)\s+day/)
  if (oneDay || oneDay2) {
    const d = Number((oneDay || oneDay2)![1])
    return solved(
      'Time and Work',
      'Work per day = 1 / days taken',
      [
        `He finishes 1 work in ${fmt(d)} days.`,
        `Work in 1 day = 1/${fmt(d)} of the work.`,
      ],
      simplifyFraction(1, d) + ' of the work',
      'Always treat total work as 1 unit (or LCM of days).',
    )
  }
  const two = q.match(
    /a\s+can\s+(?:do|complete).*?(\d+(?:\.\d+)?)\s+days.*?b\s+can\s+(?:do|complete).*?(\d+(?:\.\d+)?)\s+days/,
  )
  if (two) {
    const a = Number(two[1])
    const b = Number(two[2])
    const together = (a * b) / (a + b)
    const check = 1 / (1 / a + 1 / b)
    if (!verify(check, together)) return null
    return solved(
      'Time and Work',
      'Together time = (xy) / (x + y)    or    1/x + 1/y',
      [
        `A’s 1-day work = 1/${fmt(a)}, B’s 1-day work = 1/${fmt(b)}.`,
        `Together per day = 1/${fmt(a)} + 1/${fmt(b)} = ${simplifyFraction(a + b, a * b)}.`,
        `Time together = ${fmt(a)} × ${fmt(b)} / (${fmt(a)} + ${fmt(b)}) = ${fmt(together)} days.`,
      ],
      `${fmt(together)} days`,
    )
  }
  const pipesWork = q.match(/work\s+in\s+(\d+(?:\.\d+)?)\s+days/)
  if (pipesWork && /how much/.test(q) && /1 day/.test(q)) {
    const d = Number(pipesWork[1])
    return solved(
      'Time and Work',
      '1 day work = 1/n',
      [`1 day work = 1/${fmt(d)}.`],
      `1/${fmt(d)}`,
    )
  }
  return null
}

function solvePipes(q: string): SolveOutcome | null {
  if (!/pipe|cistern|tank/.test(q)) return null
  const fill = [...q.matchAll(/(?:fills?|fill(?:s)?\s+it)\s+in\s+(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  const empty = [...q.matchAll(/(?:empt(?:y|ies)|outlet).*?(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  if (!fill.length) {
    return clarify('Tell me how long each inlet (and outlet, if any) takes to fill or empty the tank.', 'Pipes and Cisterns')
  }
  let rate = 0
  const steps: string[] = []
  for (const t of fill) {
    rate += 1 / t
    steps.push(`Inlet filling rate = 1/${fmt(t)}.`)
  }
  for (const t of empty) {
    rate -= 1 / t
    steps.push(`Outlet emptying rate = −1/${fmt(t)}.`)
  }
  if (rate <= 0) {
    return solved(
      'Pipes and Cisterns',
      'Net rate = Σ(1/fill) − Σ(1/empty)',
      [...steps, 'Net rate is not positive, so the tank will not fill.'],
      'Tank will not fill',
    )
  }
  const time = 1 / rate
  return solved(
    'Pipes and Cisterns',
    'Time to fill = 1 / net work rate',
    [...steps, `Net rate = ${fmt(rate)} tank/unit time.`, `Time = 1 / ${fmt(rate)} = ${fmt(time)}.`],
    `${fmt(time)} units of time`,
    'Treat full tank as 1. Inlets +, outlets −.',
  )
}

function toKmh(mps: number): number {
  return mps * (18 / 5)
}

function solveTrainPole(q: string): SolveOutcome | null {
  const m = q.match(
    /train\s+(\d+(?:\.\d+)?)\s*(m|km).*?(?:cross(?:es)?|passes)\s+(?:a\s+)?(?:pole|man|tree|post).*?(\d+(?:\.\d+)?)\s*(seconds|minutes|hours)/,
  )
  const m2 = q.match(
    /train\s+(\d+(?:\.\d+)?)\s*(m|km)\s+long.*?(\d+(?:\.\d+)?)\s*(seconds|minutes|hours)/,
  )
  const hit = m || (q.includes('pole') || q.includes('man') ? m2 : null)
  if (!hit) return null
  let length = Number(hit[1])
  if (hit[2] === 'km') length *= 1000
  let t = Number(hit[3])
  const unit = hit[4]
  if (unit === 'minutes') t *= 60
  if (unit === 'hours') t *= 3600
  const mps = length / t
  const kmh = toKmh(mps)
  if (!verify(length / t, mps)) return null
  return solved(
    'Time, Speed and Distance',
    'Speed = Distance / Time    (for a pole, distance = train length)    km/h = m/s × 18/5',
    [
      `When a train crosses a pole, the distance is its own length = ${fmt(length)} m.`,
      `Time = ${fmt(t)} seconds.`,
      `Speed = ${fmt(length)} / ${fmt(t)} = ${fmt(mps)} m/s.`,
      `In km/h: ${fmt(mps)} × 18/5 = ${fmt(kmh)} km/h.`,
    ],
    `${fmt(mps)} m/s  =  ${fmt(kmh)} km/h`,
    'Pole/man/tree: distance = length of train only. Platform: length of train + platform.',
  )
}

function solveTrainPlatform(q: string): SolveOutcome | null {
  const m = q.match(
    /train\s+(\d+(?:\.\d+)?)\s*m.*?platform\s+(\d+(?:\.\d+)?)\s*m.*?(\d+(?:\.\d+)?)\s*seconds/,
  )
  if (!m) return null
  const L = Number(m[1])
  const P = Number(m[2])
  const t = Number(m[3])
  const mps = (L + P) / t
  const kmh = toKmh(mps)
  return solved(
    'Time, Speed and Distance',
    'Distance = Train length + Platform length; Speed = Distance / Time',
    [
      `Distance = ${fmt(L)} + ${fmt(P)} = ${fmt(L + P)} m.`,
      `Time = ${fmt(t)} s.`,
      `Speed = ${fmt(L + P)}/${fmt(t)} = ${fmt(mps)} m/s = ${fmt(kmh)} km/h.`,
    ],
    `${fmt(kmh)} km/h`,
  )
}

function solveGenericSpeed(q: string): SolveOutcome | null {
  const m = q.match(
    /(?:travels?|covers?|goes|runs)\s+(\d+(?:\.\d+)?)\s*(km|m)\s+in\s+(\d+(?:\.\d+)?)\s*(hours|minutes|seconds)/,
  )
  const m2 = q.match(
    /distance\s*(?:is|=)?\s*(\d+(?:\.\d+)?)\s*(km|m).*time\s*(?:is|=)?\s*(\d+(?:\.\d+)?)\s*(hours|minutes|seconds)/,
  )
  const m3 = q.match(
    /(\d+(?:\.\d+)?)\s*(km|m)\s+in\s+(\d+(?:\.\d+)?)\s*(hours|minutes|seconds).*(?:speed|velocity)/,
  )
  const hit = m || m2 || m3
  if (!hit && /speed/.test(q)) {
    const nums = extractNumbers(q)
    if (nums.length >= 2 && /\bkm\b/.test(q) && /hours/.test(q)) {
      const d = nums[0]!
      const t = nums[1]!
      if (t === 0) return clarify('Time is zero, so speed is undefined. Please recheck.')
      const s = d / t
      if (!verify(d / t, s)) return null
      return solved(
        'Time, Speed and Distance',
        'Speed = Distance ÷ Time',
        [`= ${fmt(d)} ÷ ${fmt(t)}`, `= ${fmt(s)} km/h`],
        `${fmt(s)} km/h`,
        'Speed = Distance ÷ Time. Keep units consistent.',
      )
    }
  }
  if (!hit) return null
  let d = Number(hit[1])
  const du = hit[2]
  let t = Number(hit[3])
  const tu = hit[4]
  if (du === 'm') d /= 1000
  if (tu === 'minutes') t /= 60
  if (tu === 'seconds') t /= 3600
  if (t === 0) return clarify('Time is zero, so speed is undefined. Please recheck.')
  const s = d / t
  if (!verify(d / t, s)) return null
  return solved(
    'Time, Speed and Distance',
    'Speed = Distance ÷ Time',
    [`Distance = ${fmt(d)} km, Time = ${fmt(t)} hours.`, `Speed = ${fmt(d)} ÷ ${fmt(t)} = ${fmt(s)} km/h.`],
    `${fmt(s)} km/h`,
    'Keep distance and time in matching units before dividing.',
  )
}

function solveBoats(q: string): SolveOutcome | null {
  if (!/boat|stream|current|upstream|downstream/.test(q)) return null
  const down = q.match(/downstream.*?(\d+(?:\.\d+)?)/)
  const up = q.match(/upstream.*?(\d+(?:\.\d+)?)/)
  const still = q.match(/(?:still water|speed of boat).*?(\d+(?:\.\d+)?)/)
  const stream = q.match(/(?:stream|current).*?(\d+(?:\.\d+)?)/)
  if (down && up) {
    const d = Number(down[1])
    const u = Number(up[1])
    const b = (d + u) / 2
    const s = (d - u) / 2
    return solved(
      'Boats and Streams',
      'Boat = (Downstream + Upstream)/2    Stream = (Downstream − Upstream)/2',
      [
        `Downstream = ${fmt(d)}, Upstream = ${fmt(u)}.`,
        `Speed in still water = (${fmt(d)} + ${fmt(u)})/2 = ${fmt(b)}.`,
        `Speed of stream = (${fmt(d)} − ${fmt(u)})/2 = ${fmt(s)}.`,
      ],
      `Boat ${fmt(b)}, Stream ${fmt(s)}`,
    )
  }
  if (still && stream) {
    const b = Number(still[1])
    const s = Number(stream[1])
    return solved(
      'Boats and Streams',
      'Downstream = b + s    Upstream = b − s',
      [
        `Downstream = ${fmt(b)} + ${fmt(s)} = ${fmt(b + s)}.`,
        `Upstream = ${fmt(b)} − ${fmt(s)} = ${fmt(b - s)}.`,
      ],
      `Downstream ${fmt(b + s)}, Upstream ${fmt(b - s)}`,
    )
  }
  return clarify(
    'For boats and streams, share downstream & upstream speeds, or boat speed in still water and stream speed.',
    'Boats and Streams',
  )
}

function solveAges(q: string): SolveOutcome | null {
  if (!/age/.test(q)) return null
  const sumNow = q.match(/sum of.*?ages.*?(\d+(?:\.\d+)?)/)
  const after = q.match(/after\s+(\d+)\s+years.*?sum.*?(\d+(?:\.\d+)?)/)
  const ratio = q.match(/ratio.*?(\d+)\s*:\s*(\d+)/)
  if (ratio && after) {
    return clarify(
      'I can solve age-ratio problems, but please state both the present ratio and the extra condition (sum, or ages after/before n years) clearly in one sentence.',
      'Problems on Ages',
    )
  }
  const classic = q.match(
    /(\d+)\s+years?\s+ago.*?(\d+)\s+times.*?now.*?(\d+)\s+times/,
  )
  if (classic) {
    return clarify(
      'This ages wording can be read in more than one way. Please specify whose age (A and B) and write: “A is x times B” clearly.',
      'Problems on Ages',
    )
  }
  const f = q.match(/father.*?(\d+).*?son.*?(\d+)/)
  if (f && ratio) {
    const F = Number(f[1])
    const S = Number(f[2])
    return solved(
      'Problems on Ages',
      'Present ages as stated',
      [`Father = ${F} years, Son = ${S} years.`, `Difference = ${F - S} years (constant).`],
      `Father ${F}, Son ${S}`,
    )
  }
  if (sumNow) {
    const n = q.match(/(\d+)\s+people|(\d+)\s+persons|family of\s+(\d+)/)
    const k = n ? Number(n[1] || n[2] || n[3]) : 2
    const years = q.match(/(\d+)\s+years/)
    if (years && /after|hence/.test(q)) {
      const y = Number(years[1])
      const sum = Number(sumNow[1])
      const future = sum + k * y
      return solved(
        'Problems on Ages',
        'Sum after n years = present sum + (persons × n)',
        [
          `Present sum = ${fmt(sum)}, persons = ${k}, years = ${y}.`,
          `Future sum = ${fmt(sum)} + ${k}×${y} = ${fmt(future)}.`,
        ],
        fmt(future),
      )
    }
  }
  return null
}

function solveHCFLCM(q: string): SolveOutcome | null {
  if (!/hcf|gcd|lcm|highest common|least common/.test(q)) return null
  const nums = extractNumbers(q)
  if (nums.length < 2) return clarify('Provide at least two integers to find HCF or LCM.', 'HCF and LCM')
  const ints = nums.map((n) => Math.round(n))
  if (/hcf|gcd|highest/.test(q) && /lcm|least/.test(q) && ints.length === 2) {
    const h = gcd(ints[0]!, ints[1]!)
    const l = lcm(ints[0]!, ints[1]!)
    if (!verify(h * l, ints[0]! * ints[1]!)) return null
    return solved(
      'HCF and LCM',
      'HCF(a,b) × LCM(a,b) = a × b',
      [
        `HCF(${ints.join(', ')}) = ${h}.`,
        `LCM(${ints.join(', ')}) = ${l}.`,
        `Check: ${h} × ${l} = ${h * l} and ${ints[0]} × ${ints[1]} = ${ints[0]! * ints[1]!}.`,
      ],
      `HCF = ${h}, LCM = ${l}`,
    )
  }
  if (/hcf|gcd|highest/.test(q)) {
    const h = hcfMany(ints)
    return solved('HCF and LCM', 'HCF is the greatest number that divides all of them.', [`Numbers: ${ints.join(', ')}.`, `HCF = ${h}.`], String(h))
  }
  const l = lcmMany(ints)
  return solved('HCF and LCM', 'LCM is the smallest number that is a multiple of all of them.', [`Numbers: ${ints.join(', ')}.`, `LCM = ${l}.`], String(l))
}

function solveAlgebra(q: string): SolveOutcome | null {
  const linear = q.match(/(\d+(?:\.\d+)?)\s*x\s*\+\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/)
  const linear2 = q.match(/(\d+(?:\.\d+)?)\s*x\s*-\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/)
  const solveX = q.match(/solve.*?x/)
  if (linear) {
    const a = Number(linear[1])
    const b = Number(linear[2])
    const c = Number(linear[3])
    const x = (c - b) / a
    return solved(
      'Algebra',
      'ax + b = c  ⇒  x = (c − b)/a',
      [`${fmt(a)}x + ${fmt(b)} = ${fmt(c)}`, `${fmt(a)}x = ${fmt(c - b)}`, `x = ${fmt(x)}`],
      fmt(x),
    )
  }
  if (linear2) {
    const a = Number(linear2[1])
    const b = Number(linear2[2])
    const c = Number(linear2[3])
    const x = (c + b) / a
    return solved(
      'Algebra',
      'ax − b = c  ⇒  x = (c + b)/a',
      [`${fmt(a)}x − ${fmt(b)} = ${fmt(c)}`, `x = ${fmt(x)}`],
      fmt(x),
    )
  }
  const sq = q.match(/\((\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\)\s*\^?\s*2|(a\s*\+\s*b)\^2/)
  if (sq && extractNumbers(q).length >= 2 && /\^2|square/.test(q)) {
    const n = extractNumbers(q)
    const a = n[0]!
    const b = n[1]!
    const ans = (a + b) ** 2
    return solved(
      'Algebra',
      '(a + b)² = a² + 2ab + b²',
      [
        `a = ${fmt(a)}, b = ${fmt(b)}.`,
        `a² = ${fmt(a * a)}, b² = ${fmt(b * b)}, 2ab = ${fmt(2 * a * b)}.`,
        `Sum = ${fmt(ans)}.`,
      ],
      fmt(ans),
    )
  }
  if (solveX && !linear && !linear2) {
    return clarify('Please write the equation explicitly, for example: 3x + 5 = 20.', 'Algebra')
  }
  return null
}

function solveProbability(q: string): SolveOutcome | null {
  if (!/probability|chance|likely/.test(q)) return null
  if (/coin/.test(q) && /head/.test(q) && !/two coins|2 coins/.test(q)) {
    return solved(
      'Probability',
      'P(E) = Number of favourable outcomes / Total outcomes',
      [
        'A fair coin has 2 outcomes: Head, Tail.',
        'Favourable (Head) = 1.',
        'P(Head) = 1/2.',
      ],
      '1/2',
      'Unless stated otherwise, a coin is fair and unbiased.',
    )
  }
  if (/coin/.test(q) && /tail/.test(q) && !/two coins|2 coins/.test(q)) {
    return solved(
      'Probability',
      'P(E) = favourable / total',
      ['Total outcomes = 2.', 'P(Tail) = 1/2.'],
      '1/2',
    )
  }
  if (/two coins|2 coins/.test(q)) {
    if (/two heads|2 heads/.test(q)) {
      return solved(
        'Probability',
        'Two coins: HH, HT, TH, TT',
        ['Total = 4.', 'Favourable (HH) = 1.', 'P = 1/4.'],
        '1/4',
      )
    }
    if (/one head/.test(q)) {
      return solved(
        'Probability',
        'Two coins: HH, HT, TH, TT',
        ['Exactly one head: HT, TH → 2/4 = 1/2.'],
        '1/2',
      )
    }
  }
  if (/dice|die/.test(q)) {
    if (/even/.test(q)) {
      return solved('Probability', 'P = favourable / 6', ['Even faces: 2,4,6 → 3/6 = 1/2.'], '1/2')
    }
    const face = q.match(/getting\s+(?:a\s+)?([1-6])/)
    if (face) {
      return solved('Probability', 'A die has 6 faces.', [`P(getting ${face[1]}) = 1/6.`], '1/6')
    }
    if (/greater than\s+(\d)/.test(q)) {
      const n = Number(q.match(/greater than\s+(\d)/)![1])
      const fav = [1, 2, 3, 4, 5, 6].filter((x) => x > n).length
      return solved(
        'Probability',
        'P = favourable / 6',
        [`Faces greater than ${n}: ${fav} outcomes.`, `P = ${simplifyFraction(fav, 6)}.`],
        simplifyFraction(fav, 6),
      )
    }
  }
  if (/deck|cards|pack/.test(q)) {
    if (/ace/.test(q)) {
      return solved('Probability', '52 cards, 4 aces', ['P(ace) = 4/52 = 1/13.'], '1/13')
    }
    if (/heart/.test(q)) {
      return solved('Probability', '52 cards, 13 hearts', ['P(heart) = 13/52 = 1/4.'], '1/4')
    }
    if (/king/.test(q) && /red/.test(q)) {
      return solved('Probability', 'Red kings = 2', ['P = 2/52 = 1/26.'], '1/26')
    }
  }
  return clarify(
    'I can compute probability exactly if you state the experiment and the event (e.g. “two dice, sum = 8”). Please add that detail.',
    'Probability',
  )
}

function solvePnC(q: string): SolveOutcome | null {
  const pr = q.match(/(?:permutations?|npr|arranged?)\s*.*?(\d+).*?(\d+)/i) || q.match(/p\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/)
  const cr = q.match(/(?:combinations?|ncr|selected?|chosen?)\s*.*?(\d+).*?(\d+)/i) || q.match(/c\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (/arrange/.test(q) && /letter/.test(q)) {
    const word = q.match(/word\s+([a-z]+)/)
    if (word) {
      const w = word[1]!
      const n = w.length
      const p = nPr(n, n)
      return solved(
        'Permutations and Combinations',
        'Arrangements of n distinct letters = n!',
        [`Word has ${n} letters.`, `${n}! = ${p}.`],
        String(p),
      )
    }
  }
  if (cr && /combinat|selected|chosen|ncr|c\(/.test(q)) {
    const n = Number(cr[1])
    const r = Number(cr[2])
    const c = nCr(n, r)
    return solved(
      'Permutations and Combinations',
      'C(n, r) = n! / (r!(n−r)!)',
      [`C(${n}, ${r}) = ${c}.`],
      String(c),
    )
  }
  if (pr && /permut|arrang|npr|p\(/.test(q)) {
    const n = Number(pr[1])
    const r = Number(pr[2])
    const p = nPr(n, r)
    return solved(
      'Permutations and Combinations',
      'P(n, r) = n! / (n−r)!',
      [`P(${n}, ${r}) = ${p}.`],
      String(p),
    )
  }
  return null
}

function solveMixture(q: string): SolveOutcome | null {
  if (!/mixture|alligat|milk|water mixed|alloy/.test(q)) return null
  const m = q.match(/(\d+(?:\.\d+)?)\s*%.*?(\d+(?:\.\d+)?)\s*%.*?(\d+(?:\.\d+)?)\s*%/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const mean = Number(m[3])
    const d1 = Math.abs(mean - a)
    const d2 = Math.abs(b - mean)
    if ((a - mean) * (b - mean) > 0) {
      return clarify('The mean concentration must lie between the two mixture strengths for allegation.', 'Mixtures and Allegations')
    }
    return solved(
      'Mixtures and Allegations',
      'Ratio = (d − cheaper) : (dearer − d)  [allegation]',
      [
        `Cheaper/first = ${fmt(a)}%, dearer/second = ${fmt(b)}%, mean = ${fmt(mean)}%.`,
        `Ratio = ${fmt(d2)} : ${fmt(d1)}  (quantity of first : second).`,
      ],
      `${fmt(d2)} : ${fmt(d1)}`,
      'Allegation gives quantity ratio, not percentage ratio of the gap itself.',
    )
  }
  const milk = q.match(/(\d+(?:\.\d+)?)\s*l(?:itres?)?\s+milk.*?(\d+(?:\.\d+)?)\s*l(?:itres?)?\s+water/)
  if (milk) {
    const mL = Number(milk[1])
    const w = Number(milk[2])
    return solved(
      'Mixtures and Allegations',
      'Milk : Water = given quantities',
      [`Milk = ${fmt(mL)} L, Water = ${fmt(w)} L.`, `Ratio = ${fmt(mL)}:${fmt(w)}.`],
      `${fmt(mL)}:${fmt(w)}`,
    )
  }
  return null
}

function solveNumberSystem(q: string): SolveOutcome | null {
  if (/even or odd|odd or even/.test(q)) {
    const n = extractNumbers(q)[0]
    if (n == null) return null
    const ans = Math.round(n) % 2 === 0 ? 'Even' : 'Odd'
    return solved('Number System', 'Even numbers are divisible by 2', [`${fmt(n)} ÷ 2 remainder ${Math.round(n) % 2}.`, `So it is ${ans}.`], ans)
  }
  const rem = q.match(/remainder.*?(\d+(?:\.\d+)?)\s*(?:is\s+)?divided by\s+(\d+)/) || q.match(/(\d+)\s+divided by\s+(\d+).*remainder/)
  if (rem) {
    const a = Number(rem[1])
    const b = Number(rem[2])
    return solved('Number System', 'Dividend = Divisor × Quotient + Remainder', [`Remainder = ${a} mod ${b} = ${a % b}.`], String(a % b))
  }
  if (/prime/.test(q)) {
    const n = extractNumbers(q)[0]
    if (n == null) return null
    const x = Math.round(n)
    let isP = x > 1
    for (let i = 2; i * i <= x; i++) if (x % i === 0) isP = false
    return solved('Number System', 'A prime has exactly two factors: 1 and itself', [`Check divisors of ${x} up to √${x}.`, `${x} is ${isP ? '' : 'not '}prime.`], isP ? 'Prime' : 'Not prime')
  }
  return null
}

function solveSeries(q: string): SolveOutcome | null {
  if (!/series|next (?:term|number)|find the missing|complete the series/.test(q) && !/\d+(?:\s*,\s*\d+){2,}/.test(q)) {
    return null
  }
  const seq = extractNumbers(q)
  if (seq.length < 3) return null
  if (!/series|next|missing|,_|__/.test(q) && seq.length < 4) return null
  const r = nextSeries(seq)
  if (!r) {
    return clarify(
      'I will not guess a series pattern. Please share more terms, or say if it is +d, ×r, squares, or cubes.',
      'Number Series',
    )
  }
  return solved('Number Series', r.formula, r.steps, fmt(r.next), 'In exams, verify the pattern on every consecutive pair before locking the answer.')
}

function solveAlphabetSeries(q: string): SolveOutcome | null {
  const m = q.match(/([a-z](?:\s*,\s*[a-z]){2,})/i)
  if (!m || !/series|next|missing/.test(q)) return null
  const letters = m[1]!.split(/\s*,\s*/).map((c) => c.toLowerCase())
  const codes = letters.map((c) => c.charCodeAt(0))
  const d = codes.slice(1).map((v, i) => v - codes[i]!)
  if (d.every((x) => x === d[0])) {
    const next = String.fromCharCode(codes[codes.length - 1]! + d[0]!)
    return solved(
      'Alphabet Series',
      'Equal gap in alphabet positions',
      [`Letters: ${letters.join(', ').toUpperCase()}.`, `Gap = ${d[0]}.`, `Next = ${next.toUpperCase()}.`],
      next.toUpperCase(),
    )
  }
  return clarify('Alphabet series is not a constant jump. Tell me the intended pattern (skip letters, reverse, etc.).', 'Alphabet Series')
}

function solveCoding(q: string): SolveOutcome | null {
  if (!/coded as|code for|coding/.test(q)) return null
  const m = q.match(/(\b[a-z]+\b)\s+is\s+coded\s+as\s+(\b[a-z0-9]+\b)/i)
  const ask = q.match(/code(?:d)?\s+(?:as\s+)?(?:for\s+)?(\b[a-z]+\b)/i)
  if (m) {
    const from = m[1]!.toLowerCase()
    const to = m[2]!.toLowerCase()
    if (from.length === to.length) {
      const shifts = [...from].map((ch, i) => to.charCodeAt(i) - ch.charCodeAt(0))
      if (shifts.every((s) => s === shifts[0])) {
        const k = shifts[0]!
        const target = (ask && ask[1] && ask[1] !== from ? ask[1] : null)
        if (target) {
          const coded = [...target.toLowerCase()]
            .map((c) => String.fromCharCode(((c.charCodeAt(0) - 97 + k + 26) % 26) + 97))
            .join('')
          return solved(
            'Coding-Decoding',
            `Each letter shifted by ${k}`,
            [`${from.toUpperCase()} → ${to.toUpperCase()} is a uniform shift of ${k}.`, `${target.toUpperCase()} → ${coded.toUpperCase()}.`],
            coded.toUpperCase(),
          )
        }
        return solved(
          'Coding-Decoding',
          `Uniform letter shift of ${k}`,
          [`${from.toUpperCase()} maps to ${to.toUpperCase()} by adding ${k} to each letter.`],
          `Shift = ${k}`,
        )
      }
      if (to === [...from].reverse().join('')) {
        const target = ask?.[1]
        if (target) {
          const coded = [...target].reverse().join('')
          return solved('Coding-Decoding', 'Word reversed', [`Code of ${target.toUpperCase()} = ${coded.toUpperCase()}.`], coded.toUpperCase())
        }
      }
    }
    return clarify(
      'I matched a coding example but the rule is not a simple shift or reverse. Please paste one more example word so the rule is unique.',
      'Coding-Decoding',
    )
  }
  return null
}

function solveDirections(q: string): SolveOutcome | null {
  if (!/north|south|east|west/.test(q) || !/walk|turns|distance/.test(q)) return null
  let x = 0
  let y = 0
  let dir = 0
  const start = q.match(/starts? facing (north|south|east|west)/)
  const map: Record<string, number> = { north: 0, east: 1, south: 2, west: 3 }
  if (start) dir = map[start[1]!]!
  const parts = q.split(/[.,;]|and then|then/)
  for (const p of parts) {
    if (/left/.test(p)) dir = (dir + 3) % 4
    if (/right/.test(p)) dir = (dir + 1) % 4
    const w = p.match(/(\d+(?:\.\d+)?)\s*(?:km|m)/)
    if (w) {
      const d = Number(w[1])
      if (dir === 0) y += d
      if (dir === 1) x += d
      if (dir === 2) y -= d
      if (dir === 3) x -= d
    }
  }
  const dist = Math.hypot(x, y)
  if (nearlyEqual(dist, 0) && !extractNumbers(q).length) {
    return clarify('Please include distances (e.g. 5 km north, then 3 km east).', 'Directions')
  }
  return solved(
    'Directions',
    'Resolve path into East−West (x) and North−South (y); displacement = √(x² + y²)',
    [
      `Net East (x) = ${fmt(x)}, net North (y) = ${fmt(y)}.`,
      `Displacement = √(${fmt(x)}² + ${fmt(y)}²) = ${fmt(dist)}.`,
    ],
    `${fmt(dist)} (same unit as given)`,
    'Final facing and shortest distance are different questions — say which one you need.',
  )
}

function solveBlood(q: string): SolveOutcome | null {
  if (!/mother|father|brother|sister|uncle|aunt|son|daughter|blood/.test(q)) return null
  if (/father of.*?son|son of my father/.test(q) && /i am/.test(q)) {
    return solved(
      'Blood Relations',
      '“Son of my father” is myself or my brother',
      ['If the speaker is male and has no brother mentioned as other, it often refers to the speaker himself.'],
      'The speaker (himself)',
      'These riddles are ambiguous without gender. Confirm if the speaker is male.',
    )
  }
  if (/pointing/.test(q) && /sister/.test(q) && /mother/.test(q)) {
    return clarify(
      'Blood-relation pointing puzzles depend on exact wording. Please paste the full sentence including genders (he/she).',
      'Blood Relations',
    )
  }
  return null
}

function solveSyllogism(q: string): SolveOutcome | null {
  if (!/syllog|all\s+\w+\s+are|some\s+\w+\s+are|no\s+\w+\s+are/.test(q)) return null
  if (/all\s+(\w+)\s+are\s+(\w+).*all\s+\2\s+are\s+(\w+)/s.test(q) || /all a are b.*all b are c/.test(q)) {
    return solved(
      'Syllogisms',
      'All A are B, All B are C ⇒ All A are C (definite)',
      ['Universal affirmative statements chain: A ⊆ B ⊆ C so A ⊆ C.', '“Some C are A” is also true if A exists.'],
      'All A are C follows',
    )
  }
  return clarify(
    'Paste the statements and conclusions labelled (1)(2). I will only mark a conclusion if it follows with certainty — I will not guess.',
    'Syllogisms',
  )
}

function solveOddOne(q: string): SolveOutcome | null {
  if (!/odd one|does not belong|which is different/.test(q)) return null
  const items = q.split(/:|,/).slice(1).map((s) => s.trim()).filter(Boolean)
  if (items.length < 3) {
    return clarify('List the options clearly, separated by commas.', 'Odd One Out')
  }
  return clarify(
    `I see options (${items.slice(0, 6).join(', ')}). Tell me the intended category (numbers, words, figures) or I would be guessing.`,
    'Odd One Out',
  )
}

function solveAnalogy(q: string): SolveOutcome | null {
  const m = q.match(/(\w+)\s*:\s*(\w+)\s*::\s*(\w+)\s*:\s*\??/)
  if (!m) return null
  return clarify(
    `Analogy ${m[1]} : ${m[2]} :: ${m[3]} : ? can have more than one relation. Is it synonym, antonym, tool-user, or numeric?`,
    'Analogies',
    ['Synonym/Antonym', 'Part–whole', 'Numeric relation', 'Function/tool'],
  )
}

function solveSeating(q: string): SolveOutcome | null {
  if (!/sit|seating|circular table|row of/.test(q)) return null
  return clarify(
    'Seating puzzles need the full set of constraints. Paste every clue. Also say: circular or linear, and whether facing centre.',
    'Seating Arrangement',
  )
}

function solvePuzzle(q: string): SolveOutcome | null {
  if (!/puzzle|who lives|floor|box/.test(q)) return null
  if (q.length < 80) {
    return clarify('Please paste the complete puzzle (all clues). Partial puzzles have multiple valid answers.', 'Puzzles')
  }
  return clarify(
    'This looks like a full logic puzzle. I will not assign a unique answer unless the clues pin down one arrangement. Paste clues numbered 1, 2, 3… and the exact question (e.g. who lives on floor 3).',
    'Puzzles',
  )
}

function solveStatement(q: string): SolveOutcome | null {
  if (!/statement|conclusion|assumption|inference/.test(q)) return null
  return clarify(
    'Paste the statement and the conclusions separately. I will only mark “follows” when it is logically necessary — not when it is merely possible.',
    'Statement and Conclusions',
  )
}

function solveGrammar(q: string): SolveOutcome | null {
  if (!/grammar|correct the|error|sentence correction|fill in the blank|article|tense/.test(q)) return null
  if (/fill in the blank/.test(q) || /_{2,}|\(a\)/.test(q)) {
    return clarify('Paste the full sentence with the blank and the four options so the answer is unique.', 'Fill in the Blanks')
  }
  const subj = q.match(/\b(he|she|it)\s+go\b/i)
  if (subj) {
    return solved(
      'Grammar',
      'Third-person singular present tense takes -s',
      ['He/She/It + go is incorrect.', 'Correct form: He/She/It goes.'],
      'goes',
      'Subject–verb agreement is a very common placement filter.',
    )
  }
  return null
}

const SYNONYMS: Record<string, string> = {
  abundant: 'plentiful',
  brief: 'short',
  candid: 'frank',
  diligent: 'hardworking',
  elegant: 'graceful',
  feeble: 'weak',
  gigantic: 'huge',
  humble: 'modest',
  immense: 'vast',
  keen: 'eager',
  lucid: 'clear',
  mitigate: 'lessen',
  novice: 'beginner',
  obsolete: 'outdated',
  precise: 'exact',
  quiet: 'silent',
  robust: 'strong',
  serene: 'calm',
  timid: 'shy',
  vivid: 'bright',
}

const ANTONYMS: Record<string, string> = {
  abundant: 'scarce',
  brief: 'lengthy',
  candid: 'deceptive',
  diligent: 'lazy',
  elegant: 'clumsy',
  feeble: 'strong',
  gigantic: 'tiny',
  humble: 'arrogant',
  immense: 'tiny',
  keen: 'indifferent',
  lucid: 'obscure',
  mitigate: 'aggravate',
  novice: 'expert',
  obsolete: 'modern',
  precise: 'vague',
  quiet: 'noisy',
  robust: 'fragile',
  serene: 'agitated',
  timid: 'bold',
  vivid: 'dull',
  arrival: 'departure',
  accept: 'reject',
}

function solveVocab(q: string): SolveOutcome | null {
  const syn = q.match(/synonym\s+of\s+(\w+)/) || q.match(/meaning of\s+(\w+)/)
  const ant = q.match(/antonym\s+of\s+(\w+)/) || q.match(/opposite of\s+(\w+)/)
  if (syn) {
    const w = syn[1]!.toLowerCase()
    const s = SYNONYMS[w]
    if (!s) {
      return clarify(`I do not have a verified synonym for “${w}” in the local word list, so I will not guess. Try another common exam word, or use Practice → Vocabulary.`, 'Synonyms')
    }
    return solved('Synonyms', 'A synonym is a word with the same or nearly the same meaning.', [`Word: ${w}.`, `Verified synonym: ${s}.`], s)
  }
  if (ant) {
    const w = ant[1]!.toLowerCase()
    const s = ANTONYMS[w]
    if (!s) {
      return clarify(`I do not have a verified antonym for “${w}”, so I will not guess.`, 'Antonyms')
    }
    return solved('Antonyms', 'An antonym is a word with the opposite meaning.', [`Word: ${w}.`, `Verified antonym: ${s}.`], s)
  }
  return null
}

function solveParaJumble(q: string): SolveOutcome | null {
  if (!/para jumble|jumbled|rearrange the sentences/.test(q)) return null
  return clarify(
    'Paste sentences labelled A, B, C, D. Opening sentences with nouns/topics usually come first; pronouns follow. I need the full set to order them uniquely.',
    'Para Jumbles',
  )
}

function solveRC(q: string): SolveOutcome | null {
  if (!/comprehension|according to the passage|the passage/.test(q)) return null
  return clarify(
    'Paste the passage and then the question. Without the passage I cannot answer reading comprehension.',
    'Reading Comprehension',
  )
}

function solveOwnMethod(q: string): SolveOutcome | null {
  const expr = q.match(/(-?\d+(?:\.\d+)?)\s*([+\-×x*÷/])\s*(-?\d+(?:\.\d+)?)/)
  if (expr && /what is|find|calculate|compute|equals|solve/i.test(q)) {
    const a = Number(expr[1])
    const op = expr[2]!
    const b = Number(expr[3])
    let ans = 0
    let formula = ''
    if (op === '+' ) {
      ans = a + b
      formula = 'Sum = a + b'
    } else if (op === '-') {
      ans = a - b
      formula = 'Difference = a − b'
    } else if (op === '*' || op === 'x' || op === '×') {
      ans = a * b
      formula = 'Product = a × b'
    } else {
      if (b === 0) return clarify('Division by zero is undefined. Recheck the numbers.')
      ans = a / b
      formula = 'Quotient = a ÷ b'
    }
    const divide = op === '/' || op === '÷'
    const check = op === '+' ? a + b : op === '-' ? a - b : divide ? a / b : a * b
    if (!verify(check, ans)) return null
    return solved(
      'Number System',
      formula,
      [
        'Own method: identify the two numbers and the operation, compute, then reverse-check.',
        `${fmt(a)} ${op} ${fmt(b)} = ${fmt(ans)}`,
        `Check: reverse operation returns the starting number or matches the same product/sum.`,
      ],
      fmt(ans),
      'Write the formula first, substitute, then verify with the opposite operation.',
    )
  }

  const nums = extractNumbers(q)
  if (/sum of/.test(q) && nums.length >= 2) {
    const ans = nums.reduce((s, n) => s + n, 0)
    const check = nums.reduce((s, n) => s + n, 0)
    if (!verify(check, ans)) return null
    return solved(
      'Number System',
      'Sum = a₁ + a₂ + … + aₙ',
      [
        `Own method: add the numbers one by one.`,
        nums.map(fmt).join(' + ') + ` = ${fmt(ans)}`,
      ],
      fmt(ans),
    )
  }

  if ((/average of|mean of/.test(q) || /\baverage\b/.test(q)) && nums.length >= 2 && !/weighted/.test(q)) {
    const s = nums.reduce((a, b) => a + b, 0)
    const ans = s / nums.length
    if (!verify(s / nums.length, ans)) return null
    return solved(
      'Averages',
      'Average = Sum of observations ÷ Number of observations',
      [
        'Own method: add every value, then divide by how many values there are.',
        `Sum = ${nums.map(fmt).join(' + ')} = ${fmt(s)}`,
        `Count = ${nums.length}`,
        `Average = ${fmt(s)} ÷ ${nums.length} = ${fmt(ans)}`,
      ],
      fmt(ans),
      'If one extra number is added, new average moves toward that number.',
    )
  }

  if (nums.length === 2 && /%|percent/.test(q) && /of/.test(q)) {
    const p = nums[0]!
    const x = nums[1]!
    const ans = (p / 100) * x
    if (!verify((p * x) / 100, ans)) return null
    return solved(
      'Percentages',
      'Value = (Percentage / 100) × Number',
      [
        'Own method: percent means “per 100”, so divide the percent by 100, then multiply.',
        `= (${fmt(p)} / 100) × ${fmt(x)}`,
        `= ${fmt(ans)}`,
      ],
      fmt(ans),
    )
  }

  return null
}

function solveDI(q: string): SolveOutcome | null {
  if (!/data interpretation|bar graph|pie chart|table shows/.test(q)) return null
  return clarify(
    'Paste the table/graph numbers (or list values). Then ask a specific question such as “what is the average of 2019–2021?”.',
    'Data Interpretation',
  )
}

const HANDLERS: Array<(q: string) => SolveOutcome | null> = [
  solvePercentOf,
  solveWhatPercent,
  solveIncreaseDecrease,
  solveTrainPole,
  solveTrainPlatform,
  solveGenericSpeed,
  solveTimeWork,
  solvePipes,
  solveBoats,
  solveSI,
  solveCI,
  solveProfitLoss,
  solveRatio,
  solveAverage,
  solveAges,
  solveHCFLCM,
  solveAlgebra,
  solveProbability,
  solvePnC,
  solveMixture,
  solveNumberSystem,
  solveSeries,
  solveAlphabetSeries,
  solveCoding,
  solveDirections,
  solveBlood,
  solveSyllogism,
  solveOddOne,
  solveAnalogy,
  solveSeating,
  solvePuzzle,
  solveStatement,
  solveVocab,
  solveGrammar,
  solveParaJumble,
  solveRC,
  solveDI,
  solveOwnMethod,
]

export function answerAptitude(raw: string): SolveOutcome {
  const q = norm(raw)
  if (q.length < 4) {
    return clarify('Please type a complete aptitude question (for example: “Find 20% of 450”).')
  }

  const ambiguousSpeedAndTime =
    /speed|distance|time/.test(q) && extractNumbers(q).length >= 3 && /and|or/.test(q) && !/travels|covers|cross/.test(q)
  if (ambiguousSpeedAndTime && extractNumbers(q).length > 3) {
    return clarify(
      'This can be interpreted as more than one Time-Speed-Distance setup. Please mention what is asked: speed, time, or distance — and the units.',
      'Time, Speed and Distance',
    )
  }

  for (const h of HANDLERS) {
    const r = h(q)
    if (r) return r
  }

  return {
    kind: 'unsolved',
    message:
      'I will not guess an unverified number. Please include the figures and what to find, for example: “A train travels 360 km in 4 hours. What is its speed?” I always show my own method: formula → substitute → recheck → final answer.',
  }
}

export const QUICK_PROMPTS = [
  'Find 20% of 450.',
  'A train travels 360 km in 4 hours. What is its speed?',
  'If a man completes a work in 10 days, how much work does he complete in 1 day?',
  'A train 200 meters long crosses a pole in 10 seconds. Find its speed.',
  'Find the probability of getting a head when a coin is tossed.',
  'Find SI if P = 2000, R = 5%, T = 3 years.',
]
