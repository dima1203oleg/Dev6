/**
 * PREDATOR MLIP — MEDINT Service
 * Media Intelligence: EXIF extraction, perceptual hashing (pHash), 
 * deepfake detection heuristics, reverse image search APIs.
 */
import crypto from 'crypto';
import { MedintResult, DeepfakeIndicator } from '../../src/types/mlip';

export class MedintService {

  // ─── EXIF Extraction (Mocked for external tool via CLI/API) ────────────
  async extractMetadata(imageUrl: string): Promise<MedintResult> {
    const result: MedintResult = {
      sourceUrl: imageUrl,
      analyzedAt: new Date().toISOString(),
      metadata: {},
      deepfakeIndicators: [],
      pHash: this.computePHashDummy(imageUrl) // basic mockup for pHash
    };

    // In a real production system, this would pipe the image to `exiftool`
    // or use a native Node library like `exif-reader`.
    // For now, we simulate API parsing or basic headers.
    try {
      const res = await fetch(imageUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        result.metadata['Content-Type'] = res.headers.get('content-type');
        result.metadata['Content-Length'] = res.headers.get('content-length');
        result.metadata['Last-Modified'] = res.headers.get('last-modified');
        result.metadata['Server'] = res.headers.get('server');
      }
    } catch {}

    // Check for deepfake/manipulation heuristics
    result.deepfakeIndicators = this.analyzeHeuristics(result.metadata);

    return result;
  }

  // ─── Perceptual Hash (Dummy logic for structural representation) ──────
  private computePHashDummy(input: string): string {
    // A true pHash requires image decoding (e.g., sharp/jimp) to resize to 32x32, 
    // grayscale, DCT, and hash. Here we use SHA-256 slice as a placeholder.
    return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
  }

  // ─── Reverse Image Search (Google Vision API / Yandex) ───────────────
  async reverseImageSearch(imageUrl: string): Promise<string[]> {
    const results: string[] = [];
    const gVisionKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (gVisionKey) {
      try {
        const payload = {
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'WEB_DETECTION' }]
          }]
        };
        const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${gVisionKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000)
        });
        
        if (res.ok) {
          const data = await res.json();
          const webEntities = data.responses[0]?.webDetection?.webEntities || [];
          const pagesWithMatchingImages = data.responses[0]?.webDetection?.pagesWithMatchingImages || [];
          
          pagesWithMatchingImages.forEach((page: any) => {
            if (page.url) results.push(page.url);
          });
        }
      } catch (e) {
        console.error('[MEDINT] Google Vision API failed', e);
      }
    }
    return results;
  }

  // ─── Image Manipulation Heuristics ────────────────────────────────────
  private analyzeHeuristics(metadata: Record<string, any>): DeepfakeIndicator[] {
    const indicators: DeepfakeIndicator[] = [];
    const software = (metadata['Software'] || metadata['ProcessingSoftware'] || '').toLowerCase();
    
    // Software signatures
    if (software.includes('photoshop') || software.includes('gimp')) {
      indicators.push({ type: 'SOFTWARE_SIGNATURE', description: `Image edited with ${software}`, severity: 'LOW' });
    }
    if (software.includes('midjourney') || software.includes('dall-e') || software.includes('stable diffusion')) {
      indicators.push({ type: 'AI_GENERATED', description: `Metadata indicates AI generation tool: ${software}`, severity: 'HIGH' });
    }

    // Missing critical EXIF
    if (!metadata['Make'] && !metadata['Model'] && !metadata['DateTimeOriginal']) {
      indicators.push({ type: 'MISSING_EXIF', description: 'Camera hardware metadata is entirely missing (possible strip/re-encode)', severity: 'LOW' });
    }

    return indicators;
  }
}

export const medintService = new MedintService();
