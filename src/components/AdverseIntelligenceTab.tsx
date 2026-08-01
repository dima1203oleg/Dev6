import React from 'react';
import AdverseIntelligencePanel from "./AdverseIntelligencePanel";

interface AdverseIntelligenceTabProps {
  personName: string;
}

export default function AdverseIntelligenceTab({ personName }: AdverseIntelligenceTabProps) {
  return (
    <div className="space-y-6">
      <AdverseIntelligencePanel personName={personName} />
    </div>
  );
}
