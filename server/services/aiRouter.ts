import { AiTaskType, AiTaskConfig } from "../../src/types/predator";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const AI_TASK_REGISTRY: Record<AiTaskType, AiTaskConfig> = {
  CLASSIFICATION: {
    task: "CLASSIFICATION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 512,
    temperature: 0.1,
    timeoutMs: 5000,
    costLimitUsd: 0.001,
    privacyLevel: "STRICT"
  },
  ENTITY_EXTRACTION: {
    task: "ENTITY_EXTRACTION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 2048,
    temperature: 0.2,
    timeoutMs: 10000,
    costLimitUsd: 0.005,
    privacyLevel: "INTERNAL"
  },
  ENTITY_RESOLUTION: {
    task: "ENTITY_RESOLUTION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 12000,
    costLimitUsd: 0.01,
    privacyLevel: "STRICT"
  },
  SUMMARIZATION: {
    task: "SUMMARIZATION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 2048,
    temperature: 0.3,
    timeoutMs: 10000,
    costLimitUsd: 0.003,
    privacyLevel: "INTERNAL"
  },
  RISK_ANALYSIS: {
    task: "RISK_ANALYSIS",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 4096,
    temperature: 0.2,
    timeoutMs: 15000,
    costLimitUsd: 0.01,
    privacyLevel: "STRICT"
  },
  INVESTIGATION: {
    task: "INVESTIGATION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 8192,
    temperature: 0.2,
    timeoutMs: 20000,
    costLimitUsd: 0.02,
    privacyLevel: "STRICT"
  },
  RAG: {
    task: "RAG",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 4096,
    temperature: 0.3,
    timeoutMs: 15000,
    costLimitUsd: 0.008,
    privacyLevel: "INTERNAL"
  },
  OCR: {
    task: "OCR",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 15000,
    costLimitUsd: 0.01,
    privacyLevel: "STRICT"
  },
  VISION: {
    task: "VISION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 4096,
    temperature: 0.2,
    timeoutMs: 15000,
    costLimitUsd: 0.01,
    privacyLevel: "STRICT"
  },
  TRANSCRIPTION: {
    task: "TRANSCRIPTION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 4096,
    temperature: 0.1,
    timeoutMs: 15000,
    costLimitUsd: 0.01,
    privacyLevel: "STRICT"
  },
  TRANSLATION: {
    task: "TRANSLATION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 2048,
    temperature: 0.1,
    timeoutMs: 8000,
    costLimitUsd: 0.002,
    privacyLevel: "PUBLIC"
  },
  REPORT_GENERATION: {
    task: "REPORT_GENERATION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 8192,
    temperature: 0.3,
    timeoutMs: 25000,
    costLimitUsd: 0.02,
    privacyLevel: "STRICT"
  },
  SQL_GENERATION: {
    task: "SQL_GENERATION",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 1024,
    temperature: 0.0,
    timeoutMs: 8000,
    costLimitUsd: 0.003,
    privacyLevel: "STRICT"
  },
  QUERY_PLANNING: {
    task: "QUERY_PLANNING",
    preferredModel: "gemini-3.6-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    maxTokens: 2048,
    temperature: 0.1,
    timeoutMs: 10000,
    costLimitUsd: 0.005,
    privacyLevel: "INTERNAL"
  }
};

export class AiRouterService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
  }

  public getTaskConfig(task: AiTaskType): AiTaskConfig {
    return AI_TASK_REGISTRY[task] || AI_TASK_REGISTRY.CLASSIFICATION;
  }

  /**
   * Tool Gateway - Verifies permission before AI tool calls.
   */
  public verifyToolPermission(toolName: string, userRole: string): boolean {
    const restrictedTools = ["SQL_EXECUTE", "SYSTEM_FILE_READ", "SECRET_GET", "USER_ADMIN"];
    if (restrictedTools.includes(toolName) && !["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      console.warn(`[AI TOOL GATEWAY] Blocked unauthorized tool attempt: ${toolName} for role ${userRole}`);
      return false;
    }
    return true;
  }

  public async executeTask(
    task: AiTaskType,
    prompt: string | any[],
    systemInstruction?: string
  ) {
    const config = this.getTaskConfig(task);
    
    if (!this.ai) {
      return {
        text: `[AI Router Fallback] Executed ${task} in offline mode. No API Key present.`,
        modelUsed: "offline-fallback",
        task: task,
        latencyMs: 15
      };
    }

    const startTime = Date.now();
    const modelsToTry = [config.preferredModel, config.fallbackModel];
    let lastErr: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || "You are the PREDATOR Analytics AI Router.",
            temperature: config.temperature,
            thinkingConfig: (modelName === "gemini-3.1-flash-lite") ? { thinkingLevel: ThinkingLevel.MINIMAL } : undefined
          }
        });

        const latencyMs = Date.now() - startTime;
        return {
          text: response.text,
          modelUsed: modelName,
          task: task,
          latencyMs
        };
      } catch (err: any) {
        lastErr = err;
        console.warn(`[AI ROUTER] Model ${modelName} failed for task ${task}:`, err.message || err);
      }
    }

    throw new Error(`AI Router Task Execution failed: ${lastErr?.message || "All fallback models exhausted"}`);
  }
}

export const aiRouter = new AiRouterService();
