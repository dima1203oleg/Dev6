# Provenance Model

Provenance tracks the complete lifecycle of a Fact from its origin to the Entity Card.

## The Chain
1. **Source Discovery**: When and how the registry was discovered.
2. **Ingestion Run**: The specific job ID that pulled the data.
3. **Extraction Rule**: The exact regex or JSONPath used to extract the field.
4. **Normalization**: The standardizer applied (e.g., lowercase names, standard date formats).
5. **Entity Binding**: When the fact was bound to the Entity.

In the UI, clicking any field opens the Provenance Drawer detailing this exact chain.
