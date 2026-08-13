import { resolve } from 'path';
import { NAISEDRIngestion } from './NAISEDRIngestion';
import { NAISEDRSourceType } from '../../database/repositories/NAISEDRRepository';

function sourceTypeFromArgument(value: string | undefined): NAISEDRSourceType {
  const normalized = value?.toUpperCase();
  if (normalized === 'FOP' || normalized === 'UO') return normalized;
  throw new Error('Usage: tsx server/ingestion/nais-edr/cli.ts <fop|uo> <archive.zip> [source-url]');
}

async function main(): Promise<void> {
  const sourceType = sourceTypeFromArgument(process.argv[2]);
  const archiveArgument = process.argv[3];
  if (!archiveArgument) {
    throw new Error('Usage: tsx server/ingestion/nais-edr/cli.ts <fop|uo> <archive.zip> [source-url]');
  }

  const sourceUrl = process.argv[4] || NAISEDRIngestion.sourceUrlFor(sourceType);
  const result = await new NAISEDRIngestion().ingest({
    sourceType,
    archivePath: resolve(archiveArgument),
    sourceUrl,
  });
  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
