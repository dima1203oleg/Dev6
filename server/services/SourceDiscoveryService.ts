import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as yaml from 'js-yaml';
import { IdentifierType } from '../validation/RnokppValidator';

export interface SourceDefinition {
  id: string;
  name: string;
  supports_person: boolean;
  supports_fop: boolean;
  supports_rnokpp: boolean;
  legal_automation: boolean;
  free: boolean;
  live_endpoint: boolean;
}

export class SourceDiscoveryService {
  private sources: SourceDefinition[] = [];

  constructor() {
    this.loadMatrix();
  }

  private loadMatrix() {
    try {
      const filePath = path.join(__dirname, '../config/sourceMatrix.yaml');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContents) as any;
      if (data && data.sources) {
        this.sources = data.sources;
      }
    } catch (e) {
      console.error("Failed to load sourceMatrix.yaml", e);
    }
  }

  public discoverSources(identifierType: IdentifierType, options = { onlyFree: true }): SourceDefinition[] {
    return this.sources.filter(source => {
      if (options.onlyFree && !source.free) return false;
      if (!source.legal_automation) return false;
      
      if (identifierType === 'RNOKPP' && !source.supports_rnokpp) return false;
      if (identifierType === 'RNOKPP' && !source.supports_person && !source.supports_fop) return false;
      
      return true;
    });
  }

  public getAllSources(): SourceDefinition[] {
    return this.sources;
  }
}

export const sourceDiscoveryService = new SourceDiscoveryService();
