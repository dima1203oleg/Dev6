/**
 * PREDATOR ANALYTICS — Live Registry Truth Test
 * 
 * Напряму викликає кожне реальне джерело даних для контрольного РНОКПП 3111724753,
 * щоб перевірити, які реєстри повертають реальні дані, а які — помилки або порожні відповіді.
 * 
 * Використання: npx tsx server/tests/e2e/LiveRegistryTest.ts
 */

import crypto from 'crypto';

const CONTROL_ID = '3111724753';

interface TestResult {
  registry: string;
  url: string;
  httpStatus: number | string;
  success: boolean;
  recordsFound: number;
  sampleData: any;
  error?: string;
  responseTimeMs: number;
  rawResponseSnippet?: string;
}

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// ═══════════════════════════════════════════════
// 1. data.gov.ua CKAN API — ЄДР (Юридичні особи)
// ═══════════════════════════════════════════════
async function testEdrCkan(): Promise<TestResult> {
  const url = `https://data.gov.ua/api/3/action/datastore_search?resource_id=1c7f3815-3259-45e0-bdf1-64dca07ddc10&q=${CONTROL_ID}&limit=5`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url);
    const elapsed = Date.now() - start;
    const body = await res.json();
    const records = body?.result?.records || [];
    return {
      registry: 'ЄДР (data.gov.ua CKAN — юридичні особи)',
      url,
      httpStatus: res.status,
      success: body.success === true && records.length > 0,
      recordsFound: records.length,
      sampleData: records[0] || null,
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'ЄДР (data.gov.ua CKAN — юридичні особи)',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 2. data.gov.ua CKAN API — ЄДР (ФОП)
// ═══════════════════════════════════════════════
async function testFopCkan(): Promise<TestResult> {
  const url = `https://data.gov.ua/api/3/action/datastore_search?resource_id=1c7f3815-3259-45e0-bdf1-64dca07ddc10&q=${CONTROL_ID}&limit=5`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url);
    const elapsed = Date.now() - start;
    const body = await res.json();
    const records = body?.result?.records || [];
    return {
      registry: 'ЄДР (data.gov.ua CKAN — ФОП)',
      url,
      httpStatus: res.status,
      success: body.success === true && records.length > 0,
      recordsFound: records.length,
      sampleData: records[0] || null,
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'ЄДР (data.gov.ua CKAN — ФОП)',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 3. USR / Opendatabot-like public search
// ═══════════════════════════════════════════════
async function testOpenDataBotPublic(): Promise<TestResult> {
  // Using the public USR search form API endpoint (real resource IDs from data.gov.ua)
  const url = `https://data.gov.ua/api/3/action/package_search?q=${CONTROL_ID}&rows=5`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url);
    const elapsed = Date.now() - start;
    const body = await res.json();
    const results = body?.result?.results || [];
    return {
      registry: 'data.gov.ua package_search (загальний пошук)',
      url,
      httpStatus: res.status,
      success: body.success === true,
      recordsFound: results.length,
      sampleData: results.length > 0 ? { title: results[0].title, name: results[0].name, org: results[0].organization?.title } : null,
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'data.gov.ua package_search',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 4. ЄДРСР (Court decisions registry) reyestr.court.gov.ua
// ═══════════════════════════════════════════════
async function testCourtRegistry(): Promise<TestResult> {
  // Реєстр судових рішень — публічна пошукова сторінка (HTML scrape test)
  const url = `https://reyestr.court.gov.ua/`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url, 8000);
    const elapsed = Date.now() - start;
    return {
      registry: 'ЄДРСР (reyestr.court.gov.ua) — перевірка доступності',
      url,
      httpStatus: res.status,
      success: res.ok,
      recordsFound: 0,
      sampleData: { note: 'ЄДРСР не має публічного JSON API. Потрібен пошук через HTML форму або OpenData ресурс.' },
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'ЄДРСР (reyestr.court.gov.ua)',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 5. Sanctions — sanctions-t.rnbo.gov.ua
// ═══════════════════════════════════════════════
async function testSanctionsRnbo(): Promise<TestResult> {
  const url = `https://sanctions-t.rnbo.gov.ua/`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url, 8000);
    const elapsed = Date.now() - start;
    return {
      registry: 'Санкції РНБО (sanctions-t.rnbo.gov.ua) — перевірка доступності',
      url,
      httpStatus: res.status,
      success: res.ok,
      recordsFound: 0,
      sampleData: { note: 'Потрібна перевірка API-ендпоінтів або data.gov.ua ресурсу.' },
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'Санкції РНБО (sanctions-t.rnbo.gov.ua)',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 6. DPS Tax Debt — data.gov.ua real resource IDs
// ═══════════════════════════════════════════════
async function testTaxDebt(): Promise<TestResult> {
  // Реальний ресурс податкового боргу на data.gov.ua
  const url = `https://data.gov.ua/api/3/action/datastore_search?resource_id=eeb01cbe-68f2-44ca-b584-1a4a6afff5e3&q=${CONTROL_ID}&limit=5`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url);
    const elapsed = Date.now() - start;
    const body = await res.json();
    const records = body?.result?.records || [];
    return {
      registry: 'Податковий борг (ДПС, data.gov.ua)',
      url,
      httpStatus: res.status,
      success: body.success === true,
      recordsFound: records.length,
      sampleData: records[0] || null,
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'Податковий борг (ДПС, data.gov.ua)',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 7. Виконавчі провадження (ERB) — data.gov.ua
// ═══════════════════════════════════════════════
async function testEnforcementProceedings(): Promise<TestResult> {
  const url = `https://data.gov.ua/api/3/action/datastore_search?resource_id=04be0f02-5ab5-4d82-86e5-b0635b8e92c5&q=${CONTROL_ID}&limit=5`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url);
    const elapsed = Date.now() - start;
    const body = await res.json();
    const records = body?.result?.records || [];
    return {
      registry: "Виконавчі провадження (Мін\u2019юст, data.gov.ua)",
      url,
      httpStatus: res.status,
      success: body.success === true,
      recordsFound: records.length,
      sampleData: records[0] || null,
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: "Виконавчі провадження (Мін'юст, data.gov.ua)",
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 8. Дія.City Residents — data.gov.ua
// ═══════════════════════════════════════════════
async function testDiiaCity(): Promise<TestResult> {
  const url = `https://data.gov.ua/api/3/action/datastore_search?resource_id=6c90e5e6-2a0a-4cd6-8f91-3eb8abe3cfab&q=${CONTROL_ID}&limit=5`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url);
    const elapsed = Date.now() - start;
    const body = await res.json();
    const records = body?.result?.records || [];
    return {
      registry: 'Дія.City (Мінцифри, data.gov.ua)',
      url,
      httpStatus: res.status,
      success: body.success === true,
      recordsFound: records.length,
      sampleData: records[0] || null,
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'Дія.City (Мінцифри, data.gov.ua)',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// 9. Discover Real Resource IDs from data.gov.ua
// ═══════════════════════════════════════════════
async function discoverDataGovUaResources(): Promise<TestResult> {
  const queries = ['єдиний державний реєстр', 'фоп реєстр', 'юридичні особи реєстр'];
  const url = `https://data.gov.ua/api/3/action/package_search?q=${encodeURIComponent(queries[0])}&rows=5`;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url);
    const elapsed = Date.now() - start;
    const body = await res.json();
    const results = body?.result?.results || [];

    const datasets = results.map((pkg: any) => ({
      title: pkg.title,
      name: pkg.name,
      org: pkg.organization?.title,
      resources: (pkg.resources || []).slice(0, 3).map((r: any) => ({
        id: r.id,
        name: r.name,
        format: r.format,
        datastore_active: r.datastore_active
      }))
    }));

    return {
      registry: 'data.gov.ua Discovery — пошук реєстрів',
      url,
      httpStatus: res.status,
      success: true,
      recordsFound: datasets.length,
      sampleData: datasets,
      responseTimeMs: elapsed,
    };
  } catch (e: any) {
    return {
      registry: 'data.gov.ua Discovery',
      url,
      httpStatus: 'ERROR',
      success: false,
      recordsFound: 0,
      sampleData: null,
      error: e.message,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ═══════════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════════
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  PREDATOR ANALYTICS — Live Registry Truth Test');
  console.log(`  Control ID: ${CONTROL_ID}`);
  console.log(`  Timestamp:  ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const tests = [
    testEdrCkan,
    testFopCkan,
    testOpenDataBotPublic,
    testCourtRegistry,
    testSanctionsRnbo,
    testTaxDebt,
    testEnforcementProceedings,
    testDiiaCity,
    discoverDataGovUaResources,
  ];

  const results: TestResult[] = [];

  for (const testFn of tests) {
    console.log(`▶ Тестуємо: ${testFn.name}...`);
    const result = await testFn();
    results.push(result);
    
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`  ${statusIcon} ${result.registry}`);
    console.log(`     HTTP: ${result.httpStatus} | Records: ${result.recordsFound} | Time: ${result.responseTimeMs}ms`);
    if (result.error) console.log(`     ⚠️  Error: ${result.error}`);
    if (result.sampleData && result.recordsFound > 0) {
      console.log(`     📄 Sample: ${JSON.stringify(result.sampleData).substring(0, 200)}...`);
    }
    console.log('');
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ПІДСУМОК ТЕСТУ');
  console.log('═══════════════════════════════════════════════════════');
  
  const live = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const withData = results.filter(r => r.recordsFound > 0);
  
  console.log(`  Всього перевірено:   ${results.length}`);
  console.log(`  Доступні (HTTP OK):  ${live.length}`);
  console.log(`  Недоступні/Помилка:  ${failed.length}`);
  console.log(`  З реальними даними:  ${withData.length}`);
  console.log('');
  
  console.log('  ДЕТАЛІ:');
  for (const r of results) {
    const icon = r.success ? '🟢' : '🔴';
    console.log(`  ${icon} ${r.registry.padEnd(55)} | HTTP ${String(r.httpStatus).padEnd(4)} | Rec: ${String(r.recordsFound).padStart(3)} | ${r.responseTimeMs}ms`);
  }
  console.log('');
  
  if (failed.length > 0) {
    console.log('  ⚠️  НЕДОСТУПНІ РЕЄСТРИ:');
    for (const r of failed) {
      console.log(`     ❌ ${r.registry}: ${r.error || 'HTTP ' + r.httpStatus}`);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(console.error);
