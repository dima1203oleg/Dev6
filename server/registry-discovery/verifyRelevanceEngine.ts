/**
 * Registry Discovery Platform (RDP)
 * Relevance Engine Verification Test
 * 
 * This script verifies the RelevanceEngine scoring and priority queue creation
 * by testing against real datasets from data.gov.ua
 */

import { CatalogConfig } from './types.js';
import { CKANAdapter } from './adapters/CKANAdapter.js';
import { RelevanceEngine } from './RelevanceEngine.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class RelevanceEngineVerification {
  private catalogConfig: CatalogConfig;
  private adapter: CKANAdapter;
  private relevanceEngine: RelevanceEngine;
  private executionDir: string;

  constructor() {
    this.catalogConfig = {
      id: 'data-gov-ua',
      name: 'data.gov.ua',
      type: 'CKAN',
      baseUrl: 'https://data.gov.ua',
      enabled: true,
    };

    this.adapter = new CKANAdapter(this.catalogConfig);
    this.relevanceEngine = new RelevanceEngine();
    this.executionDir = path.join(__dirname, '../../../execution');
  }

  async verifyRelevanceEngine(): Promise<{
    success: boolean;
    results: any[];
    summary: any;
  }> {
    console.log('\n========================================');
    console.log('RELEVANCE ENGINE VERIFICATION');
    console.log('Source: https://data.gov.ua');
    console.log('========================================\n');

    const results = [];
    const summary = {
      totalTested: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      averageScore: 0,
      scoringErrors: 0,
      queueErrors: 0,
    };

    try {
      // Search for sample datasets
      console.log('Searching for sample datasets...');
      const searchResult = await this.adapter.searchPackages({
        rows: 50,
      });

      console.log(`Found ${searchResult.results.length} datasets for testing`);

      // Test scoring on individual datasets
      console.log('\n--- Testing Dataset Scoring ---');
      for (let i = 0; i < Math.min(20, searchResult.results.length); i++) {
        const pkg = searchResult.results[i];
        if (!pkg) continue;
        summary.totalTested++;

        console.log(`\nTest ${i + 1}: ${pkg.title?.substring(0, 50)}...`);

        try {
          const relevanceScore = this.relevanceEngine.scoreDataset(pkg as any);
          const score = relevanceScore.score;

          console.log(`   Score: ${score.toFixed(2)}`);
          console.log(`   Priority: ${relevanceScore.priority}`);
          console.log(`   Reasons: ${relevanceScore.reasons.join(', ')}`);

          results.push({
            test: i + 1,
            datasetId: pkg.id || 'unknown',
            datasetTitle: pkg.title || 'unknown',
            score,
            priority: relevanceScore.priority,
            reasons: relevanceScore.reasons,
            tags: pkg.tags?.map((t: any) => t.name) || [],
            organization: pkg.owner_org,
            format: pkg.resources?.[0]?.format,
            status: 'SUCCESS',
          });

        } catch (error) {
          summary.scoringErrors++;
          console.error(`   Scoring failed: ${error}`);

          results.push({
            test: i + 1,
            datasetId: pkg?.id || 'unknown',
            datasetTitle: pkg?.title || 'unknown',
            score: null,
            error: String(error),
            status: 'ERROR',
          });
        }
      }

      // Test priority queue creation
      console.log('\n--- Testing Priority Queue Creation ---');
      try {
        const datasets = searchResult.results as any[];
        const priorityQueue = this.relevanceEngine.createPriorityQueue(datasets);
        
        console.log(`Priority queue created with ${datasets.length} datasets`);
        console.log(`   HIGH priority: ${priorityQueue.high.length}`);
        console.log(`   MEDIUM priority: ${priorityQueue.medium.length}`);
        console.log(`   LOW priority: ${priorityQueue.low.length}`);
        
        summary.highPriority = priorityQueue.high.length;
        summary.mediumPriority = priorityQueue.medium.length;
        summary.lowPriority = priorityQueue.low.length;

        // Show sample high priority datasets
        console.log('\nSample HIGH priority datasets:');
        priorityQueue.high.slice(0, 3).forEach((score: any, idx: number) => {
          console.log(`   ${idx + 1}. ${score.dataset.title.substring(0, 60)}... (score: ${score.score.toFixed(2)})`);
        });

        results.push({
          test: 'PRIORITY_QUEUE',
          totalDatasets: datasets.length,
          highPriority: priorityQueue.high.length,
          mediumPriority: priorityQueue.medium.length,
          lowPriority: priorityQueue.low.length,
          status: 'SUCCESS',
        });

      } catch (error) {
        summary.queueErrors++;
        console.error(`Priority queue creation failed: ${error}`);
        
        results.push({
          test: 'PRIORITY_QUEUE',
          error: String(error),
          status: 'ERROR',
        });
      }

      // Calculate average score
      const scores = results
        .filter(r => r.score !== null && r.score !== undefined)
        .map(r => r.score);
      if (scores.length > 0) {
        summary.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      // Save results
      const report = {
        timestamp: new Date().toISOString(),
        source: 'https://data.gov.ua',
        summary,
        results,
      };

      fs.writeFileSync(
        path.join(this.executionDir, 'relevance_engine_verification.json'),
        JSON.stringify(report, null, 2)
      );

      console.log('\n========================================');
      console.log('VERIFICATION SUMMARY');
      console.log('========================================');
      console.log(`Total tested: ${summary.totalTested}`);
      console.log(`HIGH priority: ${summary.highPriority}`);
      console.log(`MEDIUM priority: ${summary.mediumPriority}`);
      console.log(`LOW priority: ${summary.lowPriority}`);
      console.log(`Average score: ${summary.averageScore.toFixed(2)}`);
      console.log(`Scoring errors: ${summary.scoringErrors}`);
      console.log(`Queue errors: ${summary.queueErrors}`);
      console.log(`Report saved: relevance_engine_verification.json`);

      return {
        success: summary.scoringErrors === 0 && summary.queueErrors === 0,
        results,
        summary,
      };

    } catch (error) {
      console.error('\n❌ Verification failed:', error);
      throw error;
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verification = new RelevanceEngineVerification();
  verification.verifyRelevanceEngine()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { RelevanceEngineVerification };
