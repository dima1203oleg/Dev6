import crypto from 'crypto';
import fs from 'fs';

export class ChecksumUtil {
  public static calculateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  public static calculateStringHash(content: string): string {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(content);
    return hashSum.digest('hex');
  }
}
