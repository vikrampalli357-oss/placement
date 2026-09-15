const ARTICLES: Array<{ keys: RegExp; title: string; body: string }> = [
  {
    keys: /what is python|define python|about python|introduction to python|explain python\b|^python\??$/i,
    title: 'What is Python?',
    body: `Python is a high-level, interpreted programming language. You write readable English-like code, and the Python interpreter runs it line by line. It is widely used in campus coding rounds, data work, web backends, automation, and AI/ML.

Why companies like it
• Simple syntax, so you can show logic quickly in interviews
• Huge libraries (lists, dicts, pandas, NumPy, Flask)
• One language for scripts, DSA, and many intern projects

Hello, World
print("Hello, World")

Core ideas to remember
• Dynamic typing: x = 10 then x = "hi" is allowed
• Indentation defines blocks (no { } like C/Java)
• Everything useful lives in objects: list, dict, str, function

Campus interview extras
List vs tuple, dict lookup, *args/**kwargs, decorator, generator, GIL (one bytecode thread at a time in CPython).

If you want practice, say: “Give me a Python array coding problem” or “Ask me Python interview questions.”`,
  },
  {
    keys: /python (list|tuple|dict|dictionary|set|string|loop|function|class)|list vs tuple|decorator|gil|list comprehension/i,
    title: 'Python coding interview essentials',
    body: `List: mutable sequence — [1, 2, 3], you can append and change items.
Tuple: immutable — (1, 2, 3), can be a dict key if items are hashable.
Dict: key → value map, average O(1) lookup. Keys must be hashable.
Set: unique unordered values.

== compares values. is compares identity (use \`is None\`).

for i, x in enumerate(nums):  # index + value
[x*x for x in nums if x > 0]  # list comprehension

def greet(name, *args, **kwargs):
    return f"Hi {name}"

Decorator: a function that wraps another function (@staticmethod is a common example).
GIL: CPython runs one thread of Python bytecode at a time — use multiprocessing for CPU-heavy parallel work.

Write one small example in the interview. Clarity beats trivia.`,
  },
  {
    keys: /what is coding|what is programming|what is dsa|data structures and algorithms|how to prepare (for )?coding/i,
    title: 'Coding & DSA for placements',
    body: `Coding in placements means: read a problem, choose a data structure, write correct logic, then state time and space complexity.

DSA (Data Structures and Algorithms) is the toolkit:
• Arrays / strings — most first-round questions
• Hash maps — counting, two-sum, anagrams
• Stack / queue — brackets, BFS
• Linked list / tree — reverse list, tree depth
• Recursion / DP — Fibonacci-style overlapping subproblems

How to answer in your own way
1) Restate the problem in one line
2) Give a tiny example
3) Brute force, then the better idea
4) Code
5) Complexity (Big-O)
6) Edge cases (empty, duplicates, negatives)

Ask me: “Give me a Python coding problem” or paste your code and say “find the error”.`,
  },
  {
    keys: /time complexity|big[- ]?o|space complexity/i,
    title: 'Time complexity (Big-O)',
    body: `Big-O describes how runtime grows as input size n grows (worst typical case).

O(1) constant — dict lookup, array index
O(log n) — binary search
O(n) — one loop over the array
O(n log n) — efficient sort
O(n²) — nested loops over the same n
O(2ⁿ) — naive recursive subsets (usually too slow)

Interview habit: after code, say “Time O(n), extra space O(1)” and why.`,
  },
  {
    keys: /\bhr interview\b|hr round|human resource interview|tell me about yourself|strengths? and weaknesses?|why should we hire|where do you see yourself|conflict in (a )?team/i,
    title: 'HR interview — how to answer',
    body: `HR checks communication, honesty, and whether you prepared — not a trick exam.

Tell me about yourself (60–90 seconds)
Present: name, degree, one focus.
Past: one project/internship + a real result.
Future: the role you want.

Strength
Name it + one short story + result. Example: “I break problems into steps. In my attendance project I split API, DB, and UI so we shipped on time.”

Weakness
A real, non-fatal gap + what you are doing. Never “I work too hard.”

Why should we hire you
3 points: skill you can show, a project proof, willingness to learn their stack.

Conflict
STAR: Situation, Task, Action, Result. No blaming teammates.

If you do not know
Say so, then think aloud on a related idea. Do not invent experience.

Say “Start an HR mock interview” and I will ask one question at a time and score you /10 in this chat.`,
  },
  {
    keys: /normali[sz]ation|1nf|2nf|3nf|dbms/i,
    title: 'Normalization in DBMS',
    body: `Normalization organizes tables to reduce duplicate data and update anomalies.

1NF: each cell holds an atomic value (no lists in one column).
2NF: 1NF + no partial dependency on part of a composite key.
3NF: 2NF + no transitive dependency (non-key columns should not depend on other non-key columns).

Example: storing a student's city only in a City table referenced by city_id, instead of repeating the city name on every marks row.

This is general DBMS theory used in campus interviews — not a secret paper question.`,
  },
  {
    keys: /\boop\b|object[- ]oriented|encapsulation|polymorphism|inheritance/i,
    title: 'OOP in simple language',
    body: `Object-oriented programming models software as objects that hold data + behaviour.

Encapsulation: hide internal data; expose methods (a bank account does not let you edit balance directly).
Inheritance: a class reuses another (Car extends Vehicle).
Polymorphism: the same call, different behaviour (draw() on Circle vs Rectangle).
Abstraction: show the essential interface, hide details.

Java/Python interviews often ask for one real example from your project.`,
  },
  {
    keys: /operating system|\bos\b|process vs thread|deadlock/i,
    title: 'Operating systems (placement view)',
    body: `An OS manages CPU, memory, files, and devices.

Process: an independent program with its own memory.
Thread: a path of execution that can share memory with other threads of the same process.

Deadlock: four conditions (mutual exclusion, hold and wait, no preemption, circular wait). Mention at least one prevention idea (avoid circular wait / request resources in order).`,
  },
  {
    keys: /computer network|osi|tcp|http|dns/i,
    title: 'Computer networks (short)',
    body: `When you open a URL: DNS finds the IP, TCP (often with TLS) connects, HTTP requests the page, the browser renders HTML/CSS/JS.

OSI is a 7-layer teaching model; TCP/IP is what the internet actually uses. Know HTTP vs HTTPS and what a status 200 vs 404 means.`,
  },
  {
    keys: /data structure|array vs linked|stack vs queue/i,
    title: 'Data structures (core)',
    body: `Array: fast index access, costly insert in the middle.
Linked list: cheap insert/delete if you have the node, no random access.
Stack: LIFO (undo, DFS, brackets).
Queue: FIFO (BFS, scheduling).
Hash table: average O(1) lookup if you have a good hash; keys must be hashable.

Pick the structure from the operation you need most.`,
  },
  {
    keys: /machine learning|\bml\b|supervised|overfitting/i,
    title: 'Machine learning (campus)',
    body: `Supervised learning: learn from labelled examples (spam vs not spam).
Unsupervised: find structure without labels (clustering).

Train/validation/test split avoids fooling yourself.
Overfitting: great on train, weak on new data — use simpler models, more data, regularization, or dropout in neural nets.

I will not claim a company “always asks” a specific ML puzzle.`,
  },
  {
    keys: /generative ai|llm|transformer|prompt/i,
    title: 'Generative AI (simple)',
    body: `Generative AI models produce new text, images, or code from patterns in training data.

Large language models predict likely next tokens. Transformers use attention to weigh which words matter in context.

For interviews: mention data quality, hallucination (models can be confidently wrong), and that you verify important facts.`,
  },
  {
    keys: /\bsql\b|join|primary key|group by/i,
    title: 'SQL interview essentials',
    body: `INNER JOIN: only matching rows.
LEFT JOIN: all left rows; NULLs if no match.
PRIMARY KEY: unique identifier, not NULL.
FOREIGN KEY: refers to another table’s key.
WHERE filters rows; HAVING filters groups after GROUP BY.

Second highest salary (idea): use a subquery with MAX, or ORDER BY salary DESC with a skip — and say how you handle ties.`,
  },
  {
    keys: /\bjava\b|jvm|jdk|interface vs abstract/i,
    title: 'Java interview essentials',
    body: `JDK includes compiler + JRE; JVM runs bytecode.
Interface: contract (what); abstract class: shared base (what + some how).
equals vs == : == is reference for objects; override equals/hashCode together.
ArrayList vs LinkedList: random access vs cheaper insert in the middle.

Mention Big-O for the collection you pick.`,
  },
]

const PYTHON_SNIPPETS: Array<{ keys: RegExp; title: string; body: string; code?: string }> = [
  {
    keys: /hello world|print hello/i,
    title: 'Python program — Hello, World',
    body: 'This is the smallest Python program. print() sends text to the screen.',
    code: 'print("Hello, World")',
  },
  {
    keys: /factorial/i,
    title: 'Python program — factorial',
    body: 'n! = 1 × 2 × … × n. Multiply in a loop (or use math.factorial). Own method: start at 1, multiply every integer up to n.',
    code: `def factorial(n):
    if n < 0:
        raise ValueError("n must be >= 0")
    ans = 1
    for i in range(2, n + 1):
        ans *= i
    return ans

print(factorial(5))  # 120`,
  },
  {
    keys: /fibonacci/i,
    title: 'Python program — Fibonacci',
    body: 'Each term is the sum of the previous two. Own method: keep two running numbers a, b and walk n steps.',
    code: `def fibonacci(n):
    a, b = 0, 1
    out = []
    for _ in range(n):
        out.append(a)
        a, b = b, a + b
    return out

print(fibonacci(7))  # [0, 1, 1, 2, 3, 5, 8]`,
  },
  {
    keys: /palindrome/i,
    title: 'Python program — palindrome',
    body: 'A palindrome reads the same forwards and backwards. Own method: compare the string with its reverse.',
    code: `def is_palindrome(s):
    t = "".join(ch.lower() for ch in s if ch.isalnum())
    return t == t[::-1]

print(is_palindrome("Never odd or even"))  # True`,
  },
  {
    keys: /reverse (a )?string|string reverse/i,
    title: 'Python program — reverse a string',
    body: 'Slicing [::-1] copies the string backwards. You can also use a loop and prepend characters.',
    code: `def reverse_string(s):
    return s[::-1]

print(reverse_string("placement"))  # tnemecalp`,
  },
  {
    keys: /prime number|check prime/i,
    title: 'Python program — prime check',
    body: 'A prime has no divisor except 1 and itself. Own method: test divisors from 2 to sqrt(n).',
    code: `import math

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

print(is_prime(17))  # True`,
  },
  {
    keys: /even or odd|even\/odd/i,
    title: 'Python program — even or odd',
    body: 'If n is divisible by 2 it is even; otherwise odd. Use remainder n % 2.',
    code: `n = int(input("Enter a number: "))
print("Even" if n % 2 == 0 else "Odd")`,
  },
]

export function pythonProgramAnswer(query: string): { title: string; body: string; code?: string } | null {
  if (!/python|program|code|write a|function to/i.test(query)) return null
  for (const s of PYTHON_SNIPPETS) {
    if (s.keys.test(query)) return s
  }
  return null
}

export function technicalAnswer(query: string): { title: string; body: string } {
  const prog = pythonProgramAnswer(query)
  if (prog) {
    return {
      title: prog.title,
      body: prog.code ? `${prog.body}\n\n${prog.code}` : prog.body,
    }
  }
  for (const a of ARTICLES) {
    if (a.keys.test(query)) return { title: a.title, body: a.body }
  }
  if (/\bpython\b/i.test(query)) {
    const py = ARTICLES.find((a) => a.title === 'What is Python?')
    if (py) return { title: py.title, body: py.body }
  }
  if (/\bhr\b|interview answer|campus hr/i.test(query)) {
    const hr = ARTICLES.find((a) => a.title.startsWith('HR interview'))
    if (hr) return { title: hr.title, body: hr.body }
  }
  if (/cod(e|ing)|dsa|algorithm/i.test(query)) {
    const c = ARTICLES.find((a) => a.title.startsWith('Coding & DSA'))
    if (c) return { title: c.title, body: c.body }
  }
  return {
    title: 'Placement topic',
    body: `Here is a direct placement-oriented answer.

I can explain Python (what it is, lists, loops, programs), coding/DSA (complexity, how to solve a problem), HR answers (self-intro, strength, weakness), and aptitude (formula + steps + checked final answer).

Ask it in one line, for example:
• What is Python?
• Write a Python program for factorial
• How should I answer “Tell me about yourself”?
• A train travels 360 km in 4 hours. What is its speed?`,
  }
}

export function resumeAdvice(resumeText?: string): string {
  if (resumeText && resumeText.trim().length > 40) {
    const text = resumeText.trim()
    const hasNumbers = /\d/.test(text)
    const hasAction = /\b(built|developed|designed|implemented|led|improved|reduced|increased)\b/i.test(text)
    const lines = [
      'Feedback is based only on the resume text you shared — I will not invent internships, CGPA, or tools that are not there.',
      hasAction
        ? 'Good: you already use some action verbs. Keep each bullet as Action + Task + Result.'
        : 'Rewrite bullets as Action + Task + Result (example: “Implemented REST APIs in Flask for attendance tracking”).',
      hasNumbers
        ? 'You included numbers. Prefer impact (time saved, users, accuracy) when the resume already supports them.'
        : 'Where your resume already states a result, add a real number. Do not add metrics you cannot defend.',
      'Projects: 3–4 bullets max. Tech stack on one line. Your role vs the team’s role.',
      'Skills: only list what you can answer follow-up questions on.',
      'If you want project interview questions, paste one project paragraph and say “ask questions on this project.”',
    ]
    return lines.join('\n\n')
  }
  return `I do not have your resume yet, so I will not invent your experience.

Paste your resume text here, or attach a .txt file, then ask again.

Meanwhile, campus resume rules:
• One page if you are a student.
• Name, phone, email, GitHub/LinkedIn.
• Education: degree, college, year, CGPA only if you are comfortable.
• Projects before coursework.
• Each bullet: verb + what you built + tool + outcome you can prove.
• No photos, no tables that break ATS, no buzzwords you cannot explain.`
}

export function companyPrep(name: string): string {
  const c = name.replace(/\b\w/g, (ch) => ch.toUpperCase())
  return `General preparation for ${c}-style campus hiring (not leaked papers, not “guaranteed” questions).

Aptitude
Quantitative, logical reasoning, and verbal at moderate speed. Practise percentages, ratios, time-speed-distance, and puzzles.

Coding
Arrays, strings, hashing, and 1–2 easy/medium DSA problems in one language you know well (Python, Java, or C++).

Technical
Core CS: OOP, DBMS/SQL, OS, networks, plus your projects. Be ready to write a simple SQL join and explain one project end-to-end.

HR
Tell me about yourself, strengths/weakness, why this company, relocation, and a conflict story. Keep answers 60–90 seconds.

Study strategy
1) Daily: 45 min aptitude + 45 min coding.
2) Alternate days: technical flashcards.
3) Two mock interviews before the date.
4) Revise your resume line by line.

I will not claim any question is certain to appear in ${c}’s actual test.`
}

const ROTATION = [
  ['Python basics + debugging', 'Percentages & ratios'],
  ['SQL + DBMS', 'Logical reasoning (series, directions)'],
  ['DSA arrays & strings', 'OOP + OS short notes'],
  ['Time, speed, distance + work', 'One coding problem on paper'],
  ['HR answers (self-intro, project)', 'Networks + DBMS revision'],
  ['Mixed aptitude mock (20 Q)', 'Second coding problem + complexity'],
  ['Full mock interview (technical + HR)', 'Weak-topic revision only'],
]

export function studyPlan(days = 15, extra?: string): string {
  const n = Math.min(60, Math.max(3, days))
  const lines = [`Placement plan for ${n} days (practical, not overloaded).`, extra ? `Noted from you: ${extra}` : '']
  for (let d = 1; d <= n; d++) {
    const slot = ROTATION[(d - 1) % ROTATION.length]!
    const light = d % 7 === 0 ? 'Rest evening; review mistakes only.' : slot.join(' + ')
    lines.push(`Day ${d}: ${light}`)
  }
  lines.push('Daily minimum: 1 aptitude topic + 1 coding problem + 20 minutes of speaking your project out loud.')
  return lines.filter(Boolean).join('\n')
}

export function generalPlacement(query: string): string {
  if (/tell me about yourself|introduce myself/i.test(query)) {
    return `HR — Tell me about yourself (own structure, 60–90 seconds)

1) Present: name, degree, college, one focus (e.g. Python / SQL / projects).
2) Past: one project or internship + what you personally built + one result.
3) Future: the trainee/engineer role you want.

Sample (edit with your real facts only):
“I am a final-year student in CSE. I built a placement-prep chatbot in React and Python-style DSA practice. I enjoy breaking problems into formula → steps → check. I want to start as a software/analyst trainee and keep improving coding and communication.”

Do not recite your whole resume. Say “Start an HR mock interview” for scored practice.`
  }
  if (/strength|weakness/i.test(query)) {
    return `HR — Strength and weakness

Strength: name it, then a 20-second example, then a result.
“My strength is structured problem-solving. In aptitude I write the formula first, then substitute, then recheck. In projects I split work into API, UI, and tests.”

Weakness: honest + improvement plan. Not a humble-brag.
“I used to over-explain. I now time answers to 90 seconds and end with the result.”`
  }
  if (/why should we hire|why hire you/i.test(query)) {
    return `HR — Why should we hire you?

Three true pillars:
• Skill you can demo (Python/SQL/DSA)
• Proof (a project or internship line)
• Fit (you learn their stack and can join campus joining dates)

Close with: “I am ready to start, I know my resume in detail, and I practise aptitude plus coding daily.”`
  }
  if (/wear|dress|attire/i.test(query)) {
    return `Campus interview attire: formal shirt, well-fitted trousers, clean shoes, tidy hair. Avoid loud logos and heavy perfume. Comfort matters — you should look neat, not costumed.`
  }
  if (/don't know|dont know|do not know/i.test(query)) {
    return `If you do not know: pause, say so honestly, then think aloud on what you do know related to it. Example: “I have not implemented Redis, but I would use it as a cache in front of the database because…” Never invent APIs you have not used.`
  }
  if (/communication/i.test(query)) {
    return `Improve communication with short daily practice: record a 60-second project pitch, slow down, cut filler words, and use STAR (Situation, Task, Action, Result) for stories. Clarity beats fancy vocabulary.`
  }
  if (/introduce|tell me about yourself/i.test(query)) {
    return `Structure (60–90 seconds):
1) Present: name, degree, college, one focus area.
2) Past: 1 project or internship + one result.
3) Future: the role you want and why this company type.

Example shape: “I am a final-year CSE student. I built X using Y, where I did Z. I want to start as a software/analyst trainee and keep learning DSA and SQL.”
Do not recite your whole resume.`
  }
  if (/explain my project|describe my project/i.test(query)) {
    return `Project pitch:
• Problem (who suffered?)
• Your role (I, not only we)
• Tech stack (3–5 tools)
• One hard part and how you solved it
• Result (what works today)

Then expect follow-ups: scale, testing, what you would rebuild.`
  }
  if (/campus placement|prepare for campus/i.test(query)) {
    return `Campus prep loop: aptitude speed + one coding language + core CS (OOP, SQL, OS, networks) + resume stories + 2 mock interviews. Track weak aptitude topics. Sleep well the night before; know your resume cold.`
  }
  if (/\bhr\b|hr interview|hr round/i.test(query)) {
    const hr = ARTICLES.find((a) => a.title.startsWith('HR interview'))
    return hr ? hr.body : `HR round: self-intro, strength/weakness, why this company, a conflict story. Keep answers 60–90 seconds. Say “Start an HR mock interview” for a scored chat.`
  }
  return `I can help with introductions, dress, “I don’t know” answers, project explanation, communication, Python, coding, and aptitude. Ask one of those, or type the placement problem you have right now.`
}
