import { createReadStream } from 'fs';
import { open, stat } from 'fs/promises';
import { basename } from 'path';
import { PassThrough } from 'stream';
import { createInflateRaw } from 'zlib';

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP64_END_OF_CENTRAL_DIRECTORY = 0x06064b50;
const ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR = 0x07064b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;

export interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  flags: number;
}

function readUInt64LE(buffer: Buffer, offset: number): number {
  const value = buffer.readBigUInt64LE(offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`ZIP value at offset ${offset} exceeds JavaScript's safe integer range.`);
  }
  return Number(value);
}

async function readAt(path: string, position: number, length: number): Promise<Buffer> {
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, position);
    if (bytesRead !== length) {
      throw new Error(`Unexpected end of ZIP archive while reading ${basename(path)}.`);
    }
    return buffer;
  } finally {
    await handle.close();
  }
}

function findSignature(buffer: Buffer, signature: number): number {
  for (let offset = buffer.length - 4; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  return -1;
}

interface CentralDirectoryLocation {
  offset: number;
  size: number;
  entries: number;
}

async function readCentralDirectoryLocation(path: string): Promise<CentralDirectoryLocation> {
  const archive = await stat(path);
  const tailLength = Math.min(archive.size, 65_557);
  const tailStart = archive.size - tailLength;
  const tail = await readAt(path, tailStart, tailLength);
  const eocdOffset = findSignature(tail, END_OF_CENTRAL_DIRECTORY);

  if (eocdOffset < 0) {
    throw new Error(`Could not locate the ZIP central directory in ${basename(path)}.`);
  }

  const standardEntries = tail.readUInt16LE(eocdOffset + 10);
  const standardSize = tail.readUInt32LE(eocdOffset + 12);
  const standardOffset = tail.readUInt32LE(eocdOffset + 16);
  const usesZip64 = standardEntries === 0xffff || standardSize === 0xffffffff || standardOffset === 0xffffffff;

  if (!usesZip64) {
    return { entries: standardEntries, size: standardSize, offset: standardOffset };
  }

  const locatorPosition = tailStart + eocdOffset - 20;
  const locator = await readAt(path, locatorPosition, 20);
  if (locator.readUInt32LE(0) !== ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR) {
    throw new Error(`ZIP64 locator is missing from ${basename(path)}.`);
  }

  const zip64EocdOffset = readUInt64LE(locator, 8);
  const zip64Eocd = await readAt(path, zip64EocdOffset, 56);
  if (zip64Eocd.readUInt32LE(0) !== ZIP64_END_OF_CENTRAL_DIRECTORY) {
    throw new Error(`ZIP64 end-of-central-directory record is invalid in ${basename(path)}.`);
  }

  return {
    entries: readUInt64LE(zip64Eocd, 32),
    size: readUInt64LE(zip64Eocd, 40),
    offset: readUInt64LE(zip64Eocd, 48),
  };
}

function parseZip64Extra(
  extra: Buffer,
  uncompressedSize: number,
  compressedSize: number,
  localHeaderOffset: number,
): Pick<ZipEntry, 'uncompressedSize' | 'compressedSize' | 'localHeaderOffset'> {
  const needsZip64 = uncompressedSize === 0xffffffff
    || compressedSize === 0xffffffff
    || localHeaderOffset === 0xffffffff;
  if (!needsZip64) {
    return { uncompressedSize, compressedSize, localHeaderOffset };
  }

  let cursor = 0;
  while (cursor + 4 <= extra.length) {
    const headerId = extra.readUInt16LE(cursor);
    const size = extra.readUInt16LE(cursor + 2);
    const dataStart = cursor + 4;
    const dataEnd = dataStart + size;
    if (dataEnd > extra.length) break;

    if (headerId === 0x0001) {
      let zip64Cursor = dataStart;
      let parsedUncompressedSize = uncompressedSize;
      let parsedCompressedSize = compressedSize;
      let parsedLocalHeaderOffset = localHeaderOffset;

      if (uncompressedSize === 0xffffffff) {
        parsedUncompressedSize = readUInt64LE(extra, zip64Cursor);
        zip64Cursor += 8;
      }
      if (compressedSize === 0xffffffff) {
        parsedCompressedSize = readUInt64LE(extra, zip64Cursor);
        zip64Cursor += 8;
      }
      if (localHeaderOffset === 0xffffffff) {
        parsedLocalHeaderOffset = readUInt64LE(extra, zip64Cursor);
      }
      return {
        uncompressedSize: parsedUncompressedSize,
        compressedSize: parsedCompressedSize,
        localHeaderOffset: parsedLocalHeaderOffset,
      };
    }
    cursor = dataEnd;
  }

  throw new Error('A ZIP64 entry is missing its extended-information field.');
}

/**
 * Finds the single XML payload without extracting the archive.  It supports
 * ZIP64 because the NAIS FOP XML is larger than the regular ZIP 4 GiB limit.
 */
export async function findXmlEntry(archivePath: string): Promise<ZipEntry> {
  const centralDirectory = await readCentralDirectoryLocation(archivePath);
  const directory = await readAt(archivePath, centralDirectory.offset, centralDirectory.size);
  let cursor = 0;

  for (let index = 0; index < centralDirectory.entries; index += 1) {
    if (cursor + 46 > directory.length || directory.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_HEADER) {
      throw new Error(`Malformed ZIP central-directory entry ${index} in ${basename(archivePath)}.`);
    }

    const flags = directory.readUInt16LE(cursor + 8);
    const compressionMethod = directory.readUInt16LE(cursor + 10);
    const uncompressedSize = directory.readUInt32LE(cursor + 24);
    const compressedSize = directory.readUInt32LE(cursor + 20);
    const nameLength = directory.readUInt16LE(cursor + 28);
    const extraLength = directory.readUInt16LE(cursor + 30);
    const commentLength = directory.readUInt16LE(cursor + 32);
    const localHeaderOffset = directory.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;
    const extraStart = nameStart + nameLength;
    const next = extraStart + extraLength + commentLength;

    if (next > directory.length) {
      throw new Error(`Truncated ZIP entry ${index} in ${basename(archivePath)}.`);
    }

    const name = directory.subarray(nameStart, extraStart).toString('utf8');
    const extra = directory.subarray(extraStart, extraStart + extraLength);
    const sizes = parseZip64Extra(extra, uncompressedSize, compressedSize, localHeaderOffset);

    if (/\.xml$/i.test(name) && !name.endsWith('/')) {
      if ((flags & 0x0001) !== 0) {
        throw new Error(`Encrypted XML entry '${name}' cannot be ingested.`);
      }
      return { name, flags, compressionMethod, ...sizes };
    }
    cursor = next;
  }

  throw new Error(`No XML payload was found in ${basename(archivePath)}.`);
}

/**
 * Returns the XML payload as a stream.  Only the compressed data window is
 * opened, so archive size does not determine process memory usage.
 */
export async function openZipEntryStream(archivePath: string, entry: ZipEntry): Promise<NodeJS.ReadableStream> {
  const localHeader = await readAt(archivePath, entry.localHeaderOffset, 30);
  if (localHeader.readUInt32LE(0) !== LOCAL_FILE_HEADER) {
    throw new Error(`Invalid local ZIP header for entry '${entry.name}'.`);
  }

  const fileNameLength = localHeader.readUInt16LE(26);
  const extraLength = localHeader.readUInt16LE(28);
  const dataStart = entry.localHeaderOffset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize - 1;
  const input = createReadStream(archivePath, { start: dataStart, end: dataEnd });

  if (entry.compressionMethod === 0) return input;
  if (entry.compressionMethod !== 8) {
    input.destroy();
    throw new Error(`ZIP compression method ${entry.compressionMethod} is not supported for '${entry.name}'.`);
  }

  const output = new PassThrough();
  input.on('error', (error: Error) => output.destroy(error));
  const inflater = createInflateRaw();
  inflater.on('error', (error: Error) => output.destroy(error));
  input.pipe(inflater).pipe(output);
  return output;
}
