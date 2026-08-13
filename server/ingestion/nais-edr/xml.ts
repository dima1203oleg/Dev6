export type NAISEDRRawRecord = Record<string, string>;

export interface NAISEDRSubjectParserOptions {
  onRecord: (record: NAISEDRRawRecord) => Promise<void>;
  maxSubjectBytes?: number;
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_match, decimal: string) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function appendField(record: NAISEDRRawRecord, key: string, value: string): void {
  const normalized = decodeXml(value.replace(/\s+/g, ' ').trim());
  if (!normalized) return;
  record[key] = record[key] ? `${record[key]} | ${normalized}` : normalized;
}

/**
 * Extracts direct and nested text nodes from one known NAIS <SUBJECT> node.
 * It deliberately does not attempt to parse arbitrary XML documents; the
 * surrounding stream splitter guarantees a single complete subject fragment.
 */
export function parseSubject(subjectXml: string): NAISEDRRawRecord {
  const record: NAISEDRRawRecord = {};
  const tag = /<\/?([A-Za-z_][A-Za-z0-9_.:-]*)(?:\s[^<>]*)?\s*\/?>/g;
  const stack: string[] = [];
  let previousEnd = 0;
  let match: RegExpExecArray | null;

  while ((match = tag.exec(subjectXml)) !== null) {
    const text = subjectXml.slice(previousEnd, match.index);
    if (stack.length > 1) {
      appendField(record, stack.slice(1).join('.'), text);
    }

    const token = match[0];
    const name = match[1] || '';
    const isClosing = token.startsWith('</');
    const isSelfClosing = /\/>$/.test(token);
    if (isClosing) {
      const current = stack.pop();
      if (current !== name) {
        throw new Error(`Malformed SUBJECT XML: expected closing tag for ${current || 'none'}, got ${name}.`);
      }
    } else if (!isSelfClosing) {
      stack.push(name);
    }
    previousEnd = tag.lastIndex;
  }

  if (stack.length !== 0) {
    throw new Error(`Malformed SUBJECT XML: ${stack.length} tag(s) left open.`);
  }
  return record;
}

/**
 * Converts WINDOWS-1251 bytes while retaining decoder state between chunks,
 * then yields individual records.  A 5 GiB XML file therefore retains only a
 * bounded subject fragment in memory.
 */
export class NAISEDRSubjectParser {
  private readonly decoder = new TextDecoder('windows-1251', { fatal: true });
  private readonly onRecord: (record: NAISEDRRawRecord) => Promise<void>;
  private readonly maxSubjectBytes: number;
  private pending = '';

  constructor(options: NAISEDRSubjectParserOptions) {
    this.onRecord = options.onRecord;
    this.maxSubjectBytes = options.maxSubjectBytes ?? 16 * 1024 * 1024;
  }

  async write(chunk: Uint8Array): Promise<void> {
    this.pending += this.decoder.decode(chunk, { stream: true });
    await this.drainSubjects();
  }

  async end(): Promise<void> {
    this.pending += this.decoder.decode();
    await this.drainSubjects();
    if (/<\/?SUBJECT\b/i.test(this.pending)) {
      throw new Error('The XML payload ended with an incomplete SUBJECT record.');
    }
  }

  private async drainSubjects(): Promise<void> {
    while (true) {
      const start = this.pending.search(/<SUBJECT\b[^>]*>/i);
      if (start < 0) {
        if (this.pending.length > this.maxSubjectBytes) {
          this.pending = this.pending.slice(-1024);
        }
        return;
      }

      if (start > 0) this.pending = this.pending.slice(start);
      const endMatch = /<\/SUBJECT\s*>/i.exec(this.pending);
      if (!endMatch || endMatch.index === undefined) {
        if (this.pending.length > this.maxSubjectBytes) {
          throw new Error(`A NAIS SUBJECT record exceeds the ${this.maxSubjectBytes} byte safety limit.`);
        }
        return;
      }

      const end = endMatch.index + endMatch[0].length;
      const subject = this.pending.slice(0, end);
      this.pending = this.pending.slice(end);
      await this.onRecord(parseSubject(subject));
    }
  }
}
