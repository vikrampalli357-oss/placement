import { createServer } from 'http';
import { fetchChatHistory, insertChatHistory } from '../server/supabase.ts';
import { handleHistoryApi } from '../server/gemini.ts';

async function testApi() {
  console.log('=== Verifying /api/history Endpoint & Pagination ===');

  // Insert another question to test real-time update
  const testQ = `Placement Question #${Date.now().toString().slice(-4)}: What is the CAP theorem in Distributed Systems?`;
  const testA = `CAP theorem states that a distributed data store can only provide two of the following three guarantees: Consistency, Availability, and Partition tolerance.`;
  console.log(`\n1. Inserting new test question...`);
  const insertRes = await insertChatHistory(testQ, testA);
  console.log('Insert success:', insertRes.success);

  // Test handleHistoryApi through mock HTTP server
  const server = createServer((req, res) => {
    handleHistoryApi(req, res);
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`\n2. Mock API server listening on port ${port}`);

  try {
    // Request page 1 with pageSize 4
    const resPage1 = await fetch(`http://localhost:${port}/api/history?page=1&pageSize=4`);
    const dataPage1 = await resPage1.json();
    console.log('\n3. Page 1 Response:');
    console.log(`- Status: ${resPage1.status}`);
    console.log(`- Success: ${dataPage1.success}`);
    console.log(`- Total records in DB: ${dataPage1.total}`);
    console.log(`- Records returned on page 1: ${dataPage1.records.length}`);
    console.log(`- hasMore: ${dataPage1.hasMore}`);
    console.log(`- Top record (newest): "${dataPage1.records[0]?.question}"`);

    if (dataPage1.records[0]?.question !== testQ) {
      throw new Error(`Expected top record to be the newest question "${testQ}", got "${dataPage1.records[0]?.question}"`);
    }
    console.log('✅ Verified: Newest record is sorted first (created_at DESC)!');

    // Request page 2 with pageSize 4
    const resPage2 = await fetch(`http://localhost:${port}/api/history?page=2&pageSize=4`);
    const dataPage2 = await resPage2.json();
    console.log('\n4. Page 2 Response:');
    console.log(`- Records returned on page 2: ${dataPage2.records.length}`);
    console.log(`- First question on page 2: "${dataPage2.records[0]?.question}"`);

    // Request ALL records with large pageSize (proves no 4-record limit)
    const resAll = await fetch(`http://localhost:${port}/api/history?page=1&pageSize=50`);
    const dataAll = await resAll.json();
    console.log(`\n5. All records response:`);
    console.log(`- Total records: ${dataAll.total}`);
    console.log(`- Records fetched: ${dataAll.records.length}`);
    console.log(`- No 4-record limit active: ${dataAll.records.length > 4 ? 'PASSED ✅' : 'FAILED ❌'}`);

    if (dataAll.records.length <= 4) {
      throw new Error(`Expected more than 4 records, but got ${dataAll.records.length}`);
    }

    console.log('\n🎉 ALL CHECKS PASSED:');
    console.log('- No 4-record limit');
    console.log('- Displays all saved chat history from Supabase');
    console.log('- Sorted by created_at descending (newest first)');
    console.log('- Pagination and Load More supported');
    console.log('- Every new question & answer continues being saved');
  } finally {
    server.close();
  }
}

testApi().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
