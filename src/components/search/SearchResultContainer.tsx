import React, { useState } from 'react';
import { SummaryBlock } from './blocks/SummaryBlock';
import { IdentityCardBlock } from './blocks/IdentityCardBlock';
import { SourcesBlock } from './blocks/SourcesBlock';
import { TimelineBlock } from './blocks/TimelineBlock';
import { EvidenceModal } from '../EvidenceModal';
import { Fact } from '../../types/search';
import { EntityType, VerificationStatus } from '../../types';

import { TaxSignalsCard } from './cards/TaxSignalsCard';
import { PropertyCard } from './cards/PropertyCard';
import { SanctionsCard } from './cards/SanctionsCard';
import { CourtCasesCard } from './cards/CourtCasesCard';
import { AIAnalyticsCard } from './cards/AIAnalyticsCard';

// Mock data builder for demonstration, in real usage this will be passed down from props
export const SearchResultContainer: React.FC<any> = ({ dossier }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<Fact | null>(null);

  // Derive Summary Data
  const summaryData = {
    entityType: dossier?.entity?.type || EntityType.PERSON,
    keyStatus: dossier?.verification?.status || VerificationStatus.UNVERIFIED,
    hasMatches: true,
    hasConfirmedLinks: true,
    hasConflicts: false,
    hasRisks: dossier?.risk?.drivers?.length > 0,
    hasUnavailableSources: true
  };

  const identityData = {
    fullName: dossier?.entity?.fullName || dossier?.entity?.name || 'Невiдомо',
    identifier: dossier?.entity?.identifiers?.rnokpp || dossier?.entity?.identifiers?.edrpou || 'N/A',
    entityType: dossier?.entity?.type || EntityType.PERSON,
    status: dossier?.verification?.status || VerificationStatus.UNVERIFIED,
    lastConfirmedAt: dossier?.verification?.lastChecked || new Date().toISOString(),
    trustLevel: dossier?.quality?.confidence || 85,
    sourcesCount: dossier?.sources?.length || 5
  };

  const sourcesData = (dossier?.sources || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status === 'MATCH' ? 'CHECKED_MATCH' : 
            s.status === 'NO_MATCH' ? 'CHECKED_NO_MATCH' : 
            s.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'NEEDS_VERIFICATION'
  }));

  const timelineData = (dossier?.timeline || []).map((t: any) => ({
    date: t.date,
    event: t.event,
    source: t.source,
    status: 'NEW'
  }));

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      
      <SummaryBlock data={summaryData} />
      
      <IdentityCardBlock data={identityData} />

      <SourcesBlock sources={sourcesData} />

      <TimelineBlock events={timelineData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TaxSignalsCard entity={dossier.entity} taxData={dossier.modules?.tax?.[0]} />
          <PropertyCard entity={dossier.entity} propertyData={dossier.modules?.property?.[0]} />
          <CourtCasesCard entity={dossier.entity} courtData={dossier.modules?.courts?.[0]} />
        </div>
        <div className="space-y-6">
          <SanctionsCard entity={dossier.entity} sanctionsData={dossier.modules?.sanctions?.[0]} />
          <AIAnalyticsCard entity={dossier.entity} riskData={dossier.risk} />
        </div>
      </div>

      {selectedEvidence && (
        <EvidenceModal fact={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
      )}
    </div>
  );
};
