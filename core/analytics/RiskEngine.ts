// core/analytics/RiskEngine.ts

export interface RiskFactor {
  risk_id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  evidence: string;
}

export class RiskEngine {
  async analyze(facts: any[]): Promise<RiskFactor[]> {
    console.log(`[RISK ENGINE] Аналіз ${facts.length} фактів на ризики`);
    
    const riskFactors: RiskFactor[] = [];
    
    for (const fact of facts) {
      // Analyze for sanctions
      if (fact.type === 'sanction' || fact.sanctioned === true) {
        riskFactors.push({
          risk_id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Sanction Match',
          severity: 'critical',
          score: 95,
          evidence: `Entity appears in sanctions list: ${fact.source || 'unknown'}`
        });
      }
      
      // Analyze for debts
      if (fact.type === 'debt' || fact.debt_amount > 0) {
        riskFactors.push({
          risk_id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Outstanding Debt',
          severity: fact.debt_amount > 100000 ? 'high' : 'medium',
          score: Math.min(80, fact.debt_amount / 1000),
          evidence: `Entity has outstanding debt: ${fact.debt_amount} ${fact.currency || 'UAH'}`
        });
      }
      
      // Analyze for court cases
      if (fact.type === 'court_case' || fact.court_cases > 0) {
        riskFactors.push({
          risk_id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Legal Proceedings',
          severity: 'medium',
          score: 60,
          evidence: `Entity involved in court proceedings: ${fact.case_count || 1} cases`
        });
      }
      
      // Analyze for mass addresses
      if (fact.type === 'address' && fact.entity_count > 10) {
        riskFactors.push({
          risk_id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Mass Address',
          severity: 'medium',
          score: 50,
          evidence: `Address used by ${fact.entity_count} different entities`
        });
      }
    }
    
    return riskFactors;
  }
}
