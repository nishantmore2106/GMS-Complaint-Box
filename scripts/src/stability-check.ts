import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const supabaseUrl = 'https://fhrlkydgmmrnrjbnabng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmxreWRnbW1ybnJqYm5hYm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzQxMTcsImV4cCI6MjA4OTY1MDExN30.7hveTRBv5_AgxsrSA7vSPtN7i-XT_4HABuntiLJL57g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CONCURRENCY = 20;
const ITERATIONS = 5; // Each VU performs 5 complete cycles

async function simulateUser(id: number) {
  const stats = {
    id,
    success: 0,
    fail: 0,
    latencies: [] as number[],
  };

  for (let i = 0; i < ITERATIONS; i++) {
    const start = Date.now();
    try {
      // Step 1: Profile Fetch
      await supabase.from('users').select('*').limit(1).single();
      
      // Step 2: Dashboard Fetch (Simulate App's fetchAllData)
      await Promise.all([
        supabase.from('sites').select('*').limit(50),
        supabase.from('complaints').select('*').limit(50)
      ]);

      // Step 3: Write Action (Simulate Interaction)
      await supabase.from('system_logs').insert([{
        event_type: 'STABILITY_TEST',
        description: `[LOAD_TEST] Concurrent test user ${id} iteration ${i}`,
        created_at: new Date().toISOString()
      }]);

      stats.success++;
      stats.latencies.push(Date.now() - start);
    } catch (e) {
      console.error(`VU ${id} Iteration ${i} FAILED:`, e);
      stats.fail++;
    }
  }
  return stats;
}

async function run() {
  console.log(`🚀 Starting Stability Test: ${CONCURRENCY} VUs, ${ITERATIONS} iterations each...`);
  const startTime = Date.now();

  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }).map((_, i) => simulateUser(i))
  );

  const totalTime = Date.now() - startTime;
  const flatLatencies = results.flatMap(r => r.latencies);
  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalFail = results.reduce((sum, r) => sum + r.fail, 0);

  const avgLatency = flatLatencies.reduce((a, b) => a + b, 0) / flatLatencies.length;
  const maxLatency = Math.max(...flatLatencies);
  const minLatency = Math.min(...flatLatencies);

  console.log('\n📊 --- STABILITY TEST REPORT ---');
  console.log(`Total Virtual Users:  ${CONCURRENCY}`);
  console.log(`Total Transactions:   ${totalSuccess + totalFail}`);
  console.log(`Success Rate:         ${((totalSuccess / (totalSuccess + totalFail)) * 100).toFixed(2)}%`);
  console.log(`Average Latency:      ${avgLatency.toFixed(2)}ms`);
  console.log(`Min Latency:          ${minLatency}ms`);
  console.log(`Max Latency:          ${maxLatency}ms`);
  console.log(`Total Test Time:      ${(totalTime / 1000).toFixed(2)}s`);
  console.log('-------------------------------\n');
}

run().catch(console.error);
