import { EdrCompany } from './registries/edr';
import { TaxStatus } from './registries/tax';
import { LegalProfile } from './registries/court';
import { ComplianceSanctionsProfile } from './registries/sanctions';
import { StateRegistriesProfile } from './registries/licenses';
import { RiskScoringResult, RiskSignalItem, AggregateStatsMeta, Provenance } from './types';

export function calculateDeterministicRiskScore(
  edrpou: string,
  edr?: EdrCompany,
  tax?: TaxStatus,
  legal?: LegalProfile,
  sanctions?: ComplianceSanctionsProfile,
  licenses?: StateRegistriesProfile
): RiskScoringResult {
  const signals: RiskSignalItem[] = [];
  let scorePoints = 0;
  let evaluatedRecords = 0;

  // Rule 1: Direct RNBO Sanctions (+100 CRITICAL)
  if (sanctions?.isSanctionedRnbo) {
    scorePoints += 100;
    evaluatedRecords += sanctions.rnboSanctions.length || 1;
    signals.push({
      code: 'RISK_SANCTIONS_DIRECT',
      severity: 'CRITICAL',
      weight: 100,
      title: 'Прямі санкції РНБО України',
      explanation: 'Компанія включена до списку суб\'єктів, підданих персональним спеціальним економічним та іншим обмежувальним заходам (санкціям) РНБО.',
      sourceRefs: ['https://sanctions-t.rnbo.gov.ua/'],
      timestamps: new Date().toISOString(),
      recordScope: `Реєстр санкцій РНБО (${sanctions.rnboSanctions.length} записів)`,
    });
  }

  // Rule 2: High-Risk Country Connection (+70 HIGH)
  if (sanctions?.hasRuByIranConnection) {
    scorePoints += 70;
    evaluatedRecords += 1;
    signals.push({
      code: 'RISK_HIGH_RISK_COUNTRY',
      severity: 'HIGH',
      weight: 70,
      title: 'Зв\'язок із РФ/РБ або юрисдикціями високого ризику',
      explanation: sanctions.ruConnectionDetails || 'Виявлено бенефіціарів, засновників або афілійованих осіб із країн-агресорів.',
      sourceRefs: ['https://data.gov.ua/dataset/edr'],
      timestamps: new Date().toISOString(),
      recordScope: 'Аналітика засновників та бенефіціарів ЄДР',
    });
  }

  // Rule 3: Active Bankruptcy Proceedings (+60 HIGH)
  if (legal?.isBankrupt) {
    scorePoints += 60;
    evaluatedRecords += 1;
    signals.push({
      code: 'RISK_BANKRUPT_ACTIVE',
      severity: 'HIGH',
      weight: 60,
      title: 'Провадження у справі про банкрутство',
      explanation: legal.bankruptcyStage || 'Щодо суб\'єкта відкрито провадження про визнання банкрутом.',
      sourceRefs: ['https://reyestr.court.gov.ua/'],
      timestamps: new Date().toISOString(),
      recordScope: 'Реєстр справ про банкрутство',
    });
  }

  // Rule 4: Active Tax Debt (+40 MEDIUM)
  if (tax?.hasTaxDebt) {
    scorePoints += 40;
    evaluatedRecords += 1;
    signals.push({
      code: 'RISK_TAX_DEBT_ACTIVE',
      severity: 'MEDIUM',
      weight: 40,
      title: 'Наявність податкового боргу',
      explanation: `Сума заборгованості перед бюджетом становить ${tax.debtAmountUah.toLocaleString('uk-UA')} UAH (${tax.taxInspectionOffice}).`,
      sourceRefs: ['https://cabinet.tax.gov.ua/'],
      timestamps: new Date().toISOString(),
      recordScope: `ДПС України (Борг: ${tax.debtAmountUah} UAH)`,
    });
  }

  // Rule 5: Active Enforcement Proceedings (+30 MEDIUM)
  if (legal && legal.activeEnforcementsCount > 0) {
    scorePoints += 30;
    evaluatedRecords += legal.activeEnforcementsCount;
    signals.push({
      code: 'RISK_ACTIVE_ENFORCEMENT',
      severity: 'MEDIUM',
      weight: 30,
      title: 'Відкриті виконавчі провадження',
      explanation: `У реєстрі боржників виявлено ${legal.activeEnforcementsCount} відкритих виконавчих проваджень.`,
      sourceRefs: ['https://erb.minjust.gov.ua/'],
      timestamps: new Date().toISOString(),
      recordScope: `Єдиний реєстр боржників (${legal.activeEnforcementsCount} проваджень)`,
    });
  }

  // Rule 6: Mass Registration Address (+20 LOW)
  if (sanctions?.isMassAddress) {
    scorePoints += 20;
    evaluatedRecords += 1;
    signals.push({
      code: 'RISK_MASS_ADDRESS',
      severity: 'LOW',
      weight: 20,
      title: 'Адреса масової реєстрації',
      explanation: `За адресою компанії зареєстровано ${sanctions.massAddressCount || 'понад 10'} інших юридичних осіб.`,
      sourceRefs: ['https://cabinet.tax.gov.ua/ws/registry/public'],
      timestamps: new Date().toISOString(),
      recordScope: 'Реєстр масових адрес ДПС',
    });
  }

  // Rule 7: AMCU Banning Decisions (+50 HIGH)
  if (licenses && licenses.amcuViolationsCount > 0) {
    scorePoints += 50;
    evaluatedRecords += licenses.amcuViolationsCount;
    signals.push({
      code: 'RISK_AMCU_VIOLATION',
      severity: 'HIGH',
      weight: 50,
      title: 'Рішення АМКУ про порушення конкуренції',
      explanation: 'Суб\'єкт включений до переліку осіб, які вчинили антиконкурентні узгоджені дії (спотворення результатів торгів).',
      sourceRefs: ['https://amcu.gov.ua/'],
      timestamps: new Date().toISOString(),
      recordScope: `Реєстр АМКУ (${licenses.amcuViolationsCount} рішень)`,
    });
  }

  // Rule 8: Terminated EDR Status (+80 HIGH)
  if (edr && edr.status === 'TERMINATED') {
    scorePoints += 80;
    evaluatedRecords += 1;
    signals.push({
      code: 'RISK_EDR_TERMINATED',
      severity: 'HIGH',
      weight: 80,
      title: 'Суб\'єкт припинено в ЄДР',
      explanation: 'Діяльність юридичної особи припинено або перебуває у стані припинення.',
      sourceRefs: ['https://data.gov.ua/dataset/edr'],
      timestamps: new Date().toISOString(),
      recordScope: 'ЄДРПОУ',
    });
  }

  const normalizedScore = Math.min(100, scorePoints);

  let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERIFIED' = 'VERIFIED';
  if (normalizedScore >= 80) riskLevel = 'CRITICAL';
  else if (normalizedScore >= 50) riskLevel = 'HIGH';
  else if (normalizedScore >= 30) riskLevel = 'MODERATE';
  else if (normalizedScore > 0) riskLevel = 'LOW';

  const meta: AggregateStatsMeta = {
    basedOnRecords: evaluatedRecords,
    coverage: 100,
    sourceScope: 'ЄДР + ДПС + ЄДРСР + ЕРБ + РНБО + АМКУ',
    asOf: new Date().toISOString(),
    status: evaluatedRecords > 0 ? 'saturated' : 'empty',
  };

  const provenance: Provenance = {
    source: 'PREDATOR Risk Evaluation Engine v6.0',
    sourceUrl: `https://predator-analytics.ua/api/risk/${edrpou}`,
    fetchedAt: new Date().toISOString(),
    cached: false,
    stale: false,
  };

  return {
    totalScore: normalizedScore,
    riskLevel,
    signals,
    meta,
    provenance,
  };
}
