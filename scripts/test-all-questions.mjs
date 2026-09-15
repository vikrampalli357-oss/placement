import fs from 'fs';
import path from 'path';

// Read API key from .env
const envPath = path.resolve(process.cwd(), '.env');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

console.log('Testing with API key loaded:', apiKey ? `${apiKey.slice(0, 7)}... (${apiKey.length} chars)` : 'NO KEY');

const PLACEMENT_COACH_SYSTEM_PROMPT = `You are PlaceMate AI – an intelligent AI Placement Coach and mentor for college students preparing for campus placements, technical interviews, coding rounds, and job recruitment.

You possess deep expertise across all aspects of college placements:
- Quantitative Aptitude, Logical Reasoning, and Verbal Ability
- Coding, DSA (Data Structures & Algorithms), Time and Space Complexity
- Programming Languages: Python, Java, C++, C, SQL, JavaScript
- Core CS Technical Subjects: DBMS, Operating Systems, Computer Networks, OOP, System Design, AI/ML, Generative AI
- Mock Interviews: Interactive HR, Technical, Python, SQL, AI/ML, DSA, and Project-based rounds
- Resume & Project preparation: ATS compliance, STAR method, project defense, role explanation
- Company-specific preparation: TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, Deloitte, IBM, Amazon, Microsoft, Google, etc.
- Custom Study Plans: 7-day, 15-day, 30-day schedules, roadmap for beginners or students weak in coding
- General placement guidance: Self-introduction ("Tell me about yourself"), attire, body language, interview anxiety, answering difficult questions.

CRITICAL BEHAVIOR GUIDELINES:
1. TONE & STYLE: Clear, professional, friendly, and encouraging English suitable for college students.
2. APTITUDE:
   Topic: [Topic Name]
   Formula:
   [Formula]
   Solution:
   [Step-by-step calculation]
   Final Answer:
   [Final answer with units highlighted]
   Quick Tip:
   [Shortcut, intuition, or speed trick]
   NEVER guess mathematical answers.
3. CODING & DSA: Include Time & Space Complexity (Big-O). Support Python, Java, C++.
4. MOCK INTERVIEW: Ask ONE question at a time. Evaluate: Score: X/10, Strengths, Weaknesses, Improved Answer, Next Question.
5. RESUME: Never invent credentials.
6. OFF-TOPIC: Politely reply: "I'm your Placement Preparation Assistant. I can help with aptitude, coding, DSA, interviews, technical subjects, resumes, company preparation, study plans, and other placement-related questions."
`;

const CANDIDATE_MODELS = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

async function askQuestion(query, history = []) {
  const contents = [...history, { role: 'user', parts: [{ text: query }] }];
  let lastErr = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: PLACEMENT_COACH_SYSTEM_PROMPT }] },
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastErr = new Error(`HTTP ${res.status}: ${errText.slice(0, 150)}`);
        if (res.status === 503 || res.status === 429) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || '';
      if (text) return text;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('All candidate models failed');
}

const TEST_QUESTIONS = [
  '1. What is aptitude?',
  '2. Solve 20% of 450.',
  '3. Give me 5 hard aptitude questions.',
  '4. Give me a Python coding question.',
  '5. Explain arrays.',
  '6. Start a mock interview.',
  '7. Ask me HR interview questions.',
  '8. What is DBMS normalization?',
  '9. Explain supervised learning.',
  '10. How should I explain my project?',
  '11. I have 15 days for placements. Make a study plan.',
  '12. How do I prepare for TCS?',
  '13. How can I improve my resume?',
  '14. What should I say in tell me about yourself?',
  '15. What skills should I learn for AI/ML placements?',
  '16. I don\'t know anything about placements. How should I start?',
  '17. Give me today\'s placement practice.',
  '18. I am weak in coding. What should I do?',
];

async function runTests() {
  console.log('\n--- TESTING ALL 18 PLACEMENT QUESTIONS ---');
  let passed = 0;

  for (const item of TEST_QUESTIONS) {
    const q = item.replace(/^\d+\.\s*/, '');
    process.stdout.write(`Testing: "${q}"... `);
    try {
      const ans = await askQuestion(q);
      if (ans && ans.length > 20) {
        console.log(`[PASS] (${ans.length} chars)`);
        console.log(`Response preview: ${ans.slice(0, 130).replace(/\n/g, ' ')}...\n`);
        passed++;
      } else {
        console.log(`[FAIL - empty response]`);
      }
    } catch (e) {
      console.log(`[ERROR: ${e.message}]`);
    }
    // brief delay between calls to avoid rapid rate spikes
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n--- MULTI-TURN CONTEXT MEMORY TEST ---`);
  try {
    const t1 = 'I want to prepare for Python.';
    console.log(`User: "${t1}"`);
    const a1 = await askQuestion(t1);
    console.log(`Bot: ${a1.slice(0, 90).replace(/\n/g, ' ')}...`);

    const hist = [
      { role: 'user', parts: [{ text: t1 }] },
      { role: 'model', parts: [{ text: a1 }] },
    ];

    await new Promise((r) => setTimeout(r, 500));
    const t2 = 'Give me questions.';
    console.log(`User: "${t2}"`);
    const a2 = await askQuestion(t2, hist);
    console.log(`Bot: ${a2.slice(0, 110).replace(/\n/g, ' ')}...`);
    const understoodPython = /python/i.test(a2);
    console.log(`Context check (retains Python): ${understoodPython ? 'YES [PASS]' : 'NO [FAIL]'}`);

    hist.push({ role: 'user', parts: [{ text: t2 }] });
    hist.push({ role: 'model', parts: [{ text: a2 }] });

    await new Promise((r) => setTimeout(r, 500));
    const t3 = 'Make them difficult.';
    console.log(`User: "${t3}"`);
    const a3 = await askQuestion(t3, hist);
    console.log(`Bot: ${a3.slice(0, 110).replace(/\n/g, ' ')}...`);
    const understoodHard = /difficult|hard|advanced|decorator|gil|concurrency|metaclass/i.test(a3);
    console.log(`Context check (makes difficult): ${understoodHard ? 'YES [PASS]' : 'NO [FAIL]'}`);
  } catch (e) {
    console.log('Context test error:', e.message);
  }

  console.log(`\n--- OFF-TOPIC REDIRECTION TEST ---`);
  try {
    await new Promise((r) => setTimeout(r, 500));
    const off = 'Who won the 2022 FIFA World Cup?';
    console.log(`User: "${off}"`);
    const aOff = await askQuestion(off);
    console.log(`Bot: ${aOff.slice(0, 180).replace(/\n/g, ' ')}...`);
    const redirected = /placement|assistant/i.test(aOff);
    console.log(`Redirection check: ${redirected ? 'YES [PASS]' : 'NO [FAIL]'}`);
  } catch (e) {
    console.log('Off-topic test error:', e.message);
  }

  console.log(`\n========================================`);
  console.log(`TOTAL QUESTIONS PASSED: ${passed}/${TEST_QUESTIONS.length}`);
  console.log(`========================================`);
}

runTests();
