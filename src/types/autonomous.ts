export interface AgentStatus {
  id: string;
  name: string;
  status: "idle" | "busy" | "error";
  task?: string;
  progress?: number;
  [key: string]: any;
}

export interface DiscoveredSource {
  id: string;
  url: string;
  type: string;
  relevance: number;
  name?: string;
  protocol?: string;
  authMethod?: string;
  [key: string]: any;
}

export interface GeneratedConnectorArtifact {
  id: string;
  name: string;
  language: string;
  [key: string]: any;
}

export interface SchemaDriftEvent {
  id: string;
  field?: string;
  oldType?: string;
  newType?: string;
  sourceId?: string;
  sourceName?: string;
  detectedAt?: string;
  driftType?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details?: string;
  autoPatchStatus?: string;
  [key: string]: any;
}

export interface FunctionalEngine {
  id: string;
  name: string;
  status: "online" | "offline";
  [key: string]: any;
}

export interface PolyglotStorageNode {
  id: string;
  type: string;
  capacity: string;
  [key: string]: any;
}

export interface AIMemoryLog {
  id: string;
  timestamp: string;
  message: string;
  [key: string]: any;
}
