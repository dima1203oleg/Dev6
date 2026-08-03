import crypto from "crypto";

export interface MediaJob {
  jobId: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  uploadUrl: string;
  storageObjectId: string;
  status: "PENDING_UPLOAD" | "SCANNING" | "PROCESSING" | "COMPLETED" | "FAILED";
  extractedMetadata?: {
    ocrText?: string;
    transcript?: string;
    detectedFaces?: number;
    anomaliesScore?: number;
    evidenceId?: string;
  };
  createdAt: string;
}

const mediaJobsMap = new Map<string, MediaJob>();

export class MediaPipelineService {
  /**
   * Generates a presigned upload session (Object Storage / MinIO simulation)
   */
  public createPresignedUpload(filename: string, mimeType: string, sizeBytes: number): MediaJob {
    const jobId = `media-job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const storageObjectId = `obj-store/${Date.now()}/${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // Calculate synthetic hash template
    const rawHash = crypto.createHash("sha256").update(`${filename}-${Date.now()}`).digest("hex");

    const job: MediaJob = {
      jobId,
      filename,
      mimeType,
      fileSizeBytes: sizeBytes,
      sha256Hash: rawHash,
      uploadUrl: `/api/v1/media/upload/${jobId}`,
      storageObjectId,
      status: "PENDING_UPLOAD",
      createdAt: new Date().toISOString(),
    };

    mediaJobsMap.set(jobId, job);
    return job;
  }

  /**
   * Simulates async media processing pipeline (Malware scan -> OCR/Whisper/Vision -> Indexing)
   */
  public async processMediaAsync(jobId: string, base64Data?: string): Promise<MediaJob> {
    const job = mediaJobsMap.get(jobId);
    if (!job) {
      throw new Error(`Media Job '${jobId}' not found`);
    }

    job.status = "SCANNING";

    // Simulate async pipeline
    setTimeout(() => {
      job.status = "PROCESSING";
      setTimeout(() => {
        job.status = "COMPLETED";
        job.extractedMetadata = {
          ocrText: "ОФІЦІЙНИЙ ДОКУМЕНТ: АКТ ПРИЙОМУ-ПЕРЕДАЧІ №482. Верифіковано ШІ PREDATOR.",
          transcript: "Розшифровка аудіофайлу виконана успішно. Мова: Українська.",
          detectedFaces: 1,
          anomaliesScore: 3,
          evidenceId: `ev-media-${Date.now()}`,
        };
      }, 1500);
    }, 1000);

    return job;
  }

  public getJob(jobId: string): MediaJob | undefined {
    return mediaJobsMap.get(jobId);
  }
}

export const mediaPipeline = new MediaPipelineService();
