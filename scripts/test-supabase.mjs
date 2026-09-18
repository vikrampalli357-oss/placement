import { getSupabaseCredentials, insertChatHistory } from '../server/supabase.ts';

console.log('=== Supabase Connection Test ===\n');

const creds = getSupabaseCredentials();
console.log('Checking environment configuration:');
console.log('SUPABASE_URL:', creds.url ? `${creds.url.slice(0, 20)}...` : '[NOT SET]');
console.log('SUPABASE_KEY:', creds.key ? `${creds.key.slice(0, 10)}...` : '[NOT SET]');

async function run() {
  const sampleQuestion = 'What is the difference between a process and a thread?';
  const sampleAnswer = 'A process is an independent executing program with its own memory space, whereas a thread is a lightweight unit of execution within a process that shares memory with other threads.';

  console.log(`\nAttempting to insert sample question: "${sampleQuestion}"`);
  const result = await insertChatHistory(sampleQuestion, sampleAnswer);

  console.log('\nResult:', result);
  if (result.success) {
    console.log('✅ Successfully inserted into public.chat_history!');
  } else {
    console.log('⚠️ Database insert was handled gracefully:');
    console.log(`  Reason: ${result.error}`);
    console.log('  Notice: The chatbot continues functioning smoothly without crashing.');
  }
}

run();
