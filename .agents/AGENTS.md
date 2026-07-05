## Project Implementation Cadence
- **Phased Approach**: Do not begin feature implementation immediately. Phase 0 must be a formal "Architecture & Product Discovery" milestone with explicit exit criteria. Development into feature work proceeds ONLY when Phase 0 artifacts are approved.
- **Cadence Order**:
  1. Architecture & Discovery (design the target system)
  2. Core Platform (build the reusable foundation)
  3. Domain Modules (client, practitioner, finance, compliance, etc.)
  4. AI & Automation (layer intelligence on top of stable workflows)
  5. Enterprise Scale (multi-tenancy, integrations, marketplace, ecosystem)

## Data Layer Constraints
- **No Mock Data**: Do not use dummy information, mock APIs, or simulated data layers (e.g., `MockApiClient`). All features must be built against the live Firebase (Firestore/Storage) backend infrastructure.
