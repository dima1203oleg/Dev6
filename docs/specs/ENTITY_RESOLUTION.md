# Entity Resolution Specification

## Core Logic
Multiple registries might return records for the same physical person or company. The Entity Resolution Engine merges these raw `Claims` into a unified `Entity`.

## Rules
1. **Strong Identifiers**: IPN and EDRPOU provide 100% resolution confidence. If two records share an IPN, they are the same entity.
2. **Weak Identifiers**: Name + Address matching requires cross-referencing and provides lower confidence (e.g., 70-85%).
3. **Conflict Handling**: If Source A says "Active" and Source B says "Bankrupt", the conflict is preserved on the Entity. The UI must explicitly show `CONFLICT DETECTED`.
4. **AI Role**: AI does not create facts. It may be used to calculate a fuzzy match score between weak identifiers, but its output must be flagged as `INFERRED`.
