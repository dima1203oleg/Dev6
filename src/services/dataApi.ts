import { DataSourceResult } from '../types/dataSources';
import { useAuth } from '../lib/AuthContext';

export class DataApiService {
  private static async fetchJson<T>(url: string): Promise<DataSourceResult<T>> {
    try {
      // Get auth token from localStorage or use default production token
      const token = localStorage.getItem('authToken') || 'prod-test-token-123456789012345678901234567890';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(url, { headers });
      if (res.status === 204) {
        return {
          ok: false,
          error: {
            code: 'NO_RECORDS',
            message: 'Записів не знайдено в даному реєстрі.',
            attemptedAt: new Date().toISOString(),
          },
        };
      }

      const json = await res.json();
      if (!res.ok && !json.ok) {
        return {
          ok: false,
          error: json.error || {
            code: res.status === 401 ? 'CREDENTIALS_MISSING' : res.status === 503 ? 'UPSTREAM_FAILURE' : 'SERVER_ERROR',
            message: json.message || `Помилка запиту (${res.status})`,
            attemptedAt: new Date().toISOString(),
          },
        };
      }

      return json as DataSourceResult<T>;
    } catch (err: any) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM_FAILURE',
          message: err.message || 'Не вдалося з\'єднатися із сервером першоджерела.',
          attemptedAt: new Date().toISOString(),
        },
      };
    }
  }

  public static async getEdrFull(code: string): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/data/edr/full?code=${encodeURIComponent(code)}`);
  }

  public static async getTaxStatus(code: string): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/data/tax/status?code=${encodeURIComponent(code)}`);
  }

  public static async getCourtProfile(code: string): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/data/court/profile?code=${encodeURIComponent(code)}`);
  }

  public static async getSanctionsCompliance(code: string): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/data/sanctions/compliance?code=${encodeURIComponent(code)}`);
  }

  public static async getLicensesRegistries(code: string): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/data/licenses/registries?code=${encodeURIComponent(code)}`);
  }

  public static async getCompanyDossier(code: string): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/data/company/dossier?code=${encodeURIComponent(code)}`);
  }

  public static async getSystemSources(): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/system/sources`);
  }

  public static async getMasterRegistrySources(params?: { contour?: string; category?: string; search?: string }): Promise<DataSourceResult<any>> {
    const query = new URLSearchParams();
    if (params?.contour) query.set('contour', params.contour);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    return this.fetchJson(`/api/v1/system/sources${queryString ? `?${queryString}` : ''}`);
  }

  public static async getPriorityMatrix(): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/system/priority-matrix`);
  }

  public static async getContoursSummary(): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/system/contours`);
  }

  public static async getPreflightChecklist(): Promise<DataSourceResult<any>> {
    return this.fetchJson(`/api/v1/system/preflight-checklist`);
  }
}
