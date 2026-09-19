import { fetchChatHistory, insertChatHistory } from '../server/supabase.ts';

async function test() {
  console.log('--- Testing fetchChatHistory ---');
  const initial = await fetchChatHistory({ page: 1, pageSize: 10 });
  console.log('Initial fetch result:');
  console.log('Success:', initial.success);
  console.log('Total in DB:', initial.total);
  console.log('Records returned:', initial.records.length);
  console.log('hasMore:', initial.hasMore);

  // Let's insert 2 more records so we have more than 4 records (proves no 4-record limit)
  console.log('\n--- Inserting test records to exceed 4 records ---');
  await insertChatHistory(
    'Explain the difference between TCP and UDP for placement interviews.',
    'TCP is connection-oriented and reliable with error checking and ordered delivery, whereas UDP is connectionless and faster without delivery guarantees, often used in video streaming and gaming.'
  );
  await insertChatHistory(
    'What is a binary search tree (BST) and its average search time complexity?',
    'A Binary Search Tree is a node-based binary tree where each node has at most two children, with left children holding smaller values and right children holding greater values. Its average search time complexity is O(log n).'
  );

  console.log('\n--- Fetching page 1 with pageSize 3 ---');
  const page1 = await fetchChatHistory({ page: 1, pageSize: 3 });
  console.log(`Page 1 returned ${page1.records.length} records. Total: ${page1.total}, hasMore: ${page1.hasMore}`);
  console.log('Top record question:', page1.records[0]?.question);
  console.log('Top record created_at:', page1.records[0]?.created_at);

  console.log('\n--- Fetching page 2 with pageSize 3 ---');
  const page2 = await fetchChatHistory({ page: 2, pageSize: 3 });
  console.log(`Page 2 returned ${page2.records.length} records. Total: ${page2.total}, hasMore: ${page2.hasMore}`);
  console.log('Page 2 first question:', page2.records[0]?.question);

  console.log('\n--- Fetching all records without 4-record limit ---');
  const all = await fetchChatHistory({ page: 1, pageSize: 100 });
  console.log(`All records count: ${all.records.length} / ${all.total}`);
  all.records.forEach((r, idx) => {
    console.log(`  [${idx + 1}] (${r.created_at}) ${r.question.slice(0, 45)}...`);
  });
}

test().catch(console.error);
