export interface OsintEntity {
  id: string;
  type: "company" | "person" | "cryptowallet" | "auto";
  name: string;
  code: string;
  status: "ACTIVE" | "LIQUIDATED" | "SANCTIONED" | "SUSPICIOUS";
  riskScore: number;
  address: string;
  phone?: string;
  email?: string;
  founders?: { name: string; share: string; role: string; riskLevel: "HIGH" | "MEDIUM" | "LOW" }[];
  taxes?: { year: string; paid: string; debt: string; status: string };
  courts?: { totalCases: number; criminalCases: number; lastCaseTitle: string; lastCaseDate: string };
  description: string;
  relationships: { targetId: string; targetName: string; type: string; risk: "HIGH" | "MEDIUM" | "LOW" }[];
  aiRecommendations: string;
  isOffshoreFlag?: boolean;
  isPepFlag?: boolean;
  relations?: {
    targetName: string;
    targetType: string;
    relationType: string;
    sharePercent?: number;
    riskScore?: number;
  }[];
  lastActivityDate?: string;
  rawContext?: {
    wikipedia?: unknown[];
    nacp?: unknown[];
    prozorro?: unknown[];
    dataGovUa?: unknown[];
    nbu?: unknown[];
  };
}

export const OSINT_ENTITIES: OsintEntity[] = [];

export function getOrCreateEntityForQuery(rawQuery: string, existingList: OsintEntity[] = OSINT_ENTITIES): OsintEntity {
  const existing = existingList.find(
    (entity) => entity.name.toLowerCase() === rawQuery.trim().toLowerCase() || entity.code === rawQuery.trim(),
  );
  if (!existing) {
    throw new Error("Реальний запис для цього запиту недоступний");
  }
  return existing;
}

export function generateDynamicEntity(_rawQuery: string): never {
  throw new Error("Генерація синтетичних сутностей вимкнена");
}
