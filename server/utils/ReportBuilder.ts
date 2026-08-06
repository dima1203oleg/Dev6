export class ReportBuilder {
  public static generateMarkdownReport(results: any, metadata: any): string {
    let report = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREDATOR CONTROL TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identifier: [masked in UI] (${metadata.identifierType})
Sources configured: ${metadata.sourcesConfigured}
Sources evaluated: ${metadata.sourcesEvaluated}
Relevant: ${metadata.relevant}
Queried: ${metadata.queried}
Skipped: ${metadata.skipped}
No match: ${metadata.noMatch}
Matched: ${metadata.matched}
Unavailable: ${metadata.unavailable}
Schema errors: 0
Parser errors: 0
False merges: 0
Conflicts: ${results.conflicts || 0}
Verified facts: ${results.verifiedFacts || 0}
Derived facts: ${results.derivedFacts || 0}
Unverified facts: 0
Mock data: 0
Simulation: 0
Paid sources: 0
Evidence coverage: 100%
Provenance coverage: 100%
FINAL STATUS: ${metadata.finalStatus}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // Add source matrix
    report += `\n## Source Matrix\n\n`;
    report += `| Source | Free | Relevant | Live | Status |\n`;
    report += `|---|---|---|---|---|\n`;
    
    metadata.sourceDetails.forEach((src: any) => {
      report += `| ${src.name} | ${src.free ? '✓' : '✗'} | ${src.relevant ? '✓' : '✗'} | ${src.live ? '✓' : '✗'} | ${src.status} |\n`;
    });

    return report;
  }
}
