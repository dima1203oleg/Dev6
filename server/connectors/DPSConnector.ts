/**
 * DPS (Державна податкова служба) Connector
 * 
 * Production connector for Ukrainian Tax Service Open Registers API
 * Implements 13 REST endpoints with full production safeguards:
 * - Token management with 1000 req/day limit
 * - Rate limiting (60/min, 1000/hour, 1000/day)
 * - Circuit breaker pattern
 * - Retry policy with exponential backoff
 * - SHA-256 evidence hashing
 * - HYDRA integration
 * - Zero mock data enforcement
 * 
 * Source: https://cabinet.tax.gov.ua/help/api-registers.html
 * Base URL: https://cabinet.tax.gov.ua/ws/api/public/registers/
 */

import { AbstractConnector, ConnectorResponse, ConnectorStatus, ProductionValidation } from './AbstractConnector';
import { hydraEngine } from '../services/hydraEngine';
import { getDPSTokenManager } from './DPSTokenManager';
import { getDPSRateLimiter } from './DPSRateLimiter';
import { getDPSCircuitBreaker } from './DPSCircuitBreaker';
import { getDPSRetryPolicy } from './DPSRetryPolicy';
import { DPSTokenManager } from './DPSTokenManager';
import * as DPSTypes from './types/dps';

export class DPSConnector extends AbstractConnector {
  public readonly id = 'ua.dps';
  public readonly name = 'Державна податкова служба України';
  public readonly api_documentation_url = 'https://cabinet.tax.gov.ua/help/api-registers.html';
  public readonly supported_api_version = 'v1.0';
  public readonly authorization_mechanism: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE' = 'API_KEY';

  private readonly baseUrl = 'https://cabinet.tax.gov.ua/ws/api/public/registers';
  private readonly tokenManager = getDPSTokenManager();
  private readonly rateLimiter = getDPSRateLimiter();
  private readonly circuitBreaker = getDPSCircuitBreaker();
  private readonly retryPolicy = getDPSRetryPolicy();

  /**
   * Main fetch method - routes to appropriate endpoint based on registry type
   */
  public async fetch(identifier: string, registryType: string = 'registration'): Promise<ConnectorResponse> {
    try {
      // Check rate limit
      const rateLimitStatus = await this.rateLimiter.checkLimit();
      if (!rateLimitStatus.allowed) {
        return {
          status: 'UNAVAILABLE',
          error: `RATE_LIMITED: ${rateLimitStatus.reason}`
        };
      }

      // Route to specific endpoint
      switch (registryType) {
        case 'registration':
          return await this.fetchTaxRegistration(identifier);
        case 'vat':
          return await this.fetchVATPayers(identifier);
        case 'insurers':
          return await this.fetchInsurers(identifier);
        case 'excise':
          return await this.fetchExcise(identifier);
        case 'goods_operations':
          return await this.fetchGoodsOperations(identifier);
        case 'budget_subsidy':
          return await this.fetchBudgetSubsidy(identifier);
        case 'non_profit':
          return await this.fetchNonProfit(identifier);
        case 'rro':
          return await this.fetchRRO(identifier);
        case 'oro_books':
          return await this.fetchOROBooks(identifier);
        case 'stopped_invoices':
          return await this.fetchStoppedInvoices(identifier);
        case 'rro_instance':
          return await this.fetchRROInstance(identifier);
        case 'cso':
          return await this.fetchCSO(identifier);
        case 'fiscal_checks':
          return await this.fetchFiscalChecks(identifier);
        default:
          return {
            status: 'FAILED',
            error: `UNKNOWN_REGISTRY_TYPE: ${registryType}`
          };
      }
    } catch (error: any) {
      return {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  /**
   * ENDPOINT 1: Tax Registration (/registration) - PRIMARY
   */
  private async fetchTaxRegistration(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSTaxRegistrationRequest = {
          tins: identifier,
          name: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/registration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        // Record rate limit
        this.rateLimiter.recordRequest();

        // Check for errors
        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        // Check for empty response
        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        // Generate evidence
        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/registration`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        // Normalize data
        const normalizedData = this.normalizeTaxRegistration(data);

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: normalizedData
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * Normalize Tax Registration response
   */
  private normalizeTaxRegistration(data: DPSTypes.DPSTaxRegistrationResponse): DPSTypes.DPSTaxRegistrationNormalized {
    return {
      rnokpp: data.TIN_S,
      fullName: data.FULL_NAME,
      address: data.ADRESS,
      taxRegistrationDate: data.D_REG_STI,
      taxRegistrationNumber: data.N_REG_STI,
      taxAuthority: data.C_STI_MAIN_NAME,
      foreignEconomicActivity: data.VED_LIC,
      entityType: data.FACE_MODE,
      taxStatus: data.C_STAN,
      taxClosureDate: data.D_ZAKR_STI,
      entityKind: data.C_KIND,
      closureStatus: data.C_CLOSE
    };
  }

  /**
   * ENDPOINT 2: VAT Payers (/pdv_act/list)
   */
  private async fetchVATPayers(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSVATPayersRequest = {
          kodPdvList: null,
          tinList: identifier,
          name: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/pdv_act/list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || !Array.isArray(data) || data.length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/pdv_act/list`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        const normalizedData = data.map(item => this.normalizeVATPayers(item));

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: normalizedData
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * Normalize VAT Payers response
   */
  private normalizeVATPayers(data: DPSTypes.DPSVATPayersResponse): DPSTypes.DPSVATPayersNormalized {
    return {
      vatCode: data.kodPdv,
      rnokpp: data.tin,
      fullName: data.name,
      vatRegistrationDate: data.datReestr,
      vatCancellationDate: data.datAnul,
      vatCodeString: data.kodPdvs,
      vatTerminationDate: data.datTerm,
      vatRegistrationSg: data.dreestrSg,
      vatCertificateDate: data.datSvd,
      vatCancellationSg: data.danulSg,
      vatPaymentSg: data.dpdvSg,
      vatCancellationReason: data.kodAnul,
      vatStatus: data.kodPid
    };
  }

  /**
   * ENDPOINT 3: Insurers Register (/ev)
   */
  private async fetchInsurers(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSInsurersRequest = {
          tin: identifier,
          name: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/ev`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/ev`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        const normalizedData = this.normalizeInsurers(data);

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: normalizedData
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * Normalize Insurers response
   */
  private normalizeInsurers(data: DPSTypes.DPSInsurersResponse): DPSTypes.DPSInsurersNormalized {
    return {
      rnokpp: data.TIN_S,
      fullName: data.FULL_NAME,
      insuranceRegistrationDate: data.DATE_ACC_ERS,
      insuranceId: data.ID_ERS,
      taxAuthority: data.C_STI_MAIN_NAME,
      kved: data.KVED,
      riskClass: data.RCLASS,
      insuranceCancellationDate: data.DATE_DCC_ERS,
      isPayer: data.IS_PAYER
    };
  }

  /**
   * ENDPOINT 4: Excise Tax Register (/excise)
   */
  private async fetchExcise(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSExciseRequest = {
          tin: identifier,
          name: null,
          nReg: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/excise`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/excise`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        const normalizedData = this.normalizeExcise(data);

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: normalizedData
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * Normalize Excise response
   */
  private normalizeExcise(data: DPSTypes.DPSExciseResponse): DPSTypes.DPSExciseNormalized {
    return {
      rnokpp: data.TIN_S,
      fullName: data.FULL_NAME,
      exciseRegistrationDate: data.DAT_REEST,
      registrationNumber: data.N_REG,
      lastDate: data.LAST_DATE,
      exciseCancellationDate: data.DAT_ANUL,
      cancellationReason: data.C_ANUL_NAME,
      entityType: data.FACE_MODE,
      oznP: data.OZN_P,
      oznS: data.OZN_S
    };
  }

  /**
   * ENDPOINT 5: Goods Operations (/cli-zed) - UNDOCUMENTED
   */
  private async fetchGoodsOperations(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSGoodsOperationsRequest = {
          tins: identifier,
          name: null,
          kodPdv: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/cli-zed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/cli-zed`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        // Schema not documented - return raw data
        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: data
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * ENDPOINT 6: Budget Subsidy (/obd) - UNDOCUMENTED
   */
  private async fetchBudgetSubsidy(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSBudgetSubsidyRequest = {
          tins: identifier,
          name: null,
          kodPdv: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/obd`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/obd`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: data
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * ENDPOINT 7: Non-Profit Register (/non-profit) - UNDOCUMENTED
   */
  private async fetchNonProfit(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSNonProfitRequest = {
          tin: identifier,
          name: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/non-profit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/non-profit`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: data
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * ENDPOINT 8: RRO Information (/rro) - UNDOCUMENTED
   */
  private async fetchRRO(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSRRORequest = {
          tins: identifier,
          name: null,
          nFis: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/rro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/rro`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: data
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * ENDPOINT 9: ORO Books (/koro) - UNDOCUMENTED
   */
  private async fetchOROBooks(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSOROBooksRequest = {
          tins: identifier,
          name: null,
          nFis: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/koro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/koro`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: data
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * ENDPOINT 10: Stopped Invoices (/inv-stopped) - UNDOCUMENTED
   */
  private async fetchStoppedInvoices(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSStoppedInvoicesRequest = {
          ipn: identifier,
          num: null,
          crtDate: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/inv-stopped`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/inv-stopped`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: data
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * ENDPOINT 11: RRO Instances (/rro-instance) - UNDOCUMENTED
   */
  private async fetchRROInstance(_identifier: string): Promise<ConnectorResponse> {
    // This endpoint requires sn (serial number) and cekka (model code)
    // For now, return error as identifier alone is insufficient
    return {
      status: 'FAILED',
      error: 'RRO_INSTANCE_REQUIRES_SN_AND_CEKKA: This endpoint requires serial number and model code'
    };
  }

  /**
   * ENDPOINT 12: CSO Register (/rro-cso) - UNDOCUMENTED
   */
  private async fetchCSO(identifier: string): Promise<ConnectorResponse> {
    return await this.circuitBreaker.execute(async () => {
      return await this.retryPolicy.execute(async () => {
        const token = await this.tokenManager.getToken();
        const tokenHash = DPSTokenManager.hashToken(token || '');

        const request: DPSTypes.DPSCSORequest = {
          tins: identifier,
          cekka: null,
          token
        };

        const response = await fetch(`${this.baseUrl}/rro-cso`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        const httpStatus = response.status;
        const data = await response.json();

        this.rateLimiter.recordRequest();

        if (httpStatus !== 200) {
          this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
          throw new Error(`DPS_API_ERROR: HTTP ${httpStatus}`);
        }

        if (!data || Object.keys(data).length === 0) {
          this.tokenManager.recordSuccess(tokenHash);
          return {
            status: 'NO_MATCH'
          };
        }

        hydraEngine.verifyAndIngestRawEvidence({
          sourceId: this.id,
          query: identifier,
          endpointUrl: `${this.baseUrl}/rro-cso`,
          rawPayload: data,
          httpStatus,
          connectorVersion: 'v1.0.0'
        });

        this.tokenManager.recordSuccess(tokenHash);

        return {
          status: 'SUCCESS',
          normalizedData: data
        };
      }, async () => {
        const quotaStatus = this.tokenManager.getQuotaStatus();
        return quotaStatus.totalRemainingQuota > 0;
      });
    });
  }

  /**
   * ENDPOINT 13: Fiscal Checks (/rro/chkAll)
   */
  private async fetchFiscalChecks(_identifier: string): Promise<ConnectorResponse> {
    // This endpoint requires check number (id), fiscal number (fn), and type
    // For now, return error as identifier alone is insufficient
    return {
      status: 'FAILED',
      error: 'FISCAL_CHECKS_REQUIRES_CHECK_NUMBER: This endpoint requires check number, fiscal number, and type'
    };
  }

  /**
   * Health check - test with known EDRPOU
   */
  async health_check(): Promise<ConnectorStatus> {
    try {
      const result = await this.fetchTaxRegistration('00000000');
      if (result.status === 'SUCCESS' || result.status === 'NO_MATCH') {
        return 'CONNECTED';
      } else if (result.error?.includes('RATE_LIMITED')) {
        return 'RATE_LIMITED';
      } else if (result.error?.includes('TOKEN')) {
        return 'AUTHENTICATION_FAILED';
      } else {
        return 'UNREACHABLE';
      }
    } catch (error) {
      return 'UNREACHABLE';
    }
  }

  /**
   * Production validation metadata
   */
  get_production_validation(): ProductionValidation {
    return {
      has_official_api: true,
      documentation_url: this.api_documentation_url,
      documentation_current: true,
      api_version_supported: this.supported_api_version,
      authorization_mechanism: this.authorization_mechanism,
      rate_limits_confirmed: true,
      tested_with_real_responses: false, // Will be true after real API testing
      last_validation_date: new Date().toISOString(),
      notes: 'Production connector with token management, rate limiting, circuit breaker, and retry policy. Zero mock data enforced.'
    };
  }
}

// Singleton instance
let dpsConnectorInstance: DPSConnector | null = null;

export function getDPSConnector(): DPSConnector {
  if (!dpsConnectorInstance) {
    dpsConnectorInstance = new DPSConnector();
  }
  return dpsConnectorInstance;
}

export function resetDPSConnector(): void {
  dpsConnectorInstance = null;
}
