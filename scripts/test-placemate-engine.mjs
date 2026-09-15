import http from 'http';
import { handleChatApi } from '../server/gemini.ts';

// Create test server on port 5174
const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0];
  if (url === '/api/chat' && req.method === 'POST') {
    handleChatApi(req, res);
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(5174, async () => {
  console.log('Test PlaceMate Server listening on port 5174');

  async function askCoach(query, history = []) {
    const messages = [...history, { role: 'user', content: query }];
    try {
      const res = await fetch('http://localhost:5174/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      return data.response || `ERROR: ${data.error}`;
    } catch (e) {
      return `FETCH ERROR: ${e.message}`;
    }
  }

  const queries = [
    'A train travels 360 km in 4 hours. What is its speed?',
    'Solve 20% of 450.',
    'Give me a Python coding question.',
    'What is DBMS normalization?',
    'Start a mock interview.',
    'I have 15 days for placements. Make a study plan.',
    'How do I prepare for TCS?',
    'Who won the 2022 FIFA World Cup?', // off-topic test
  ];

  for (const q of queries) {
    console.log(`\n========================================`);
    console.log(`USER: "${q}"`);
    console.log(`========================================`);
    const ans = await askCoach(q);
    console.log(ans.slice(0, 400) + (ans.length > 400 ? '...\n[truncated for display]' : ''));
    // 2-second pause between queries
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Multi-turn context test
  console.log(`\n========================================`);
  console.log(`MULTI-TURN CONVERSATION TEST`);
  console.log(`========================================`);
  const t1 = 'I want to prepare for Python.';
  console.log(`User: "${t1}"`);
  const a1 = await askCoach(t1);
  console.log(`Bot: ${a1.slice(0, 150)}...`);

  await new Promise((r) => setTimeout(r, 2000));
  const t2 = 'Give me questions.';
  console.log(`\nUser: "${t2}"`);
  const a2 = await askCoach(t2, [
    { role: 'user', content: t1 },
    { role: 'assistant', content: a1 },
  ]);
  console.log(`Bot: ${a2.slice(0, 200)}...`);
  console.log(`Context check (retains Python): ${/python/i.test(a2) ? 'PASS' : 'FAIL'}`);

  await new Promise((r) => setTimeout(r, 2000));
  const t3 = 'Make them difficult.';
  console.log(`\nUser: "${t3}"`);
  const a3 = await askCoach(t3, [
    { role: 'user', content: t1 },
    { role: 'assistant', content: a1 },
    { role: 'user', content: t2 },
    { role: 'assistant', content: a2 },
  ]);
  console.log(`Bot: ${a3.slice(0, 200)}...`);
  console.log(`Context check (retains Python + difficult): ${/difficult|hard|advanced|decorator|gil|metaclass/i.test(a3) ? 'PASS' : 'FAIL'}`);

  server.close();
  console.log('\nAll tests completed!');
  process.exit(0);
});
