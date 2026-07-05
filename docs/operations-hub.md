# Operations Hub — Module Documentation

## Overview
The **Operations Hub** (`/operations-hub`) is a centralised executive dashboard for the Practice & Business Manager at Breakthrough Coaching & Consulting. It surfaces the most critical operational metrics across four domains in a single view, with Gemini AI integration for intelligent morning briefings and compliance risk scoring.

## Access Control
| Role | Access |
|------|--------|
| Admin | ✅ Full access |
| Coordinator | ✅ Full access |
| Practice Manager | ✅ Full access |
| Practitioner | ❌ No access |
| Viewer | ❌ No access |

## Page Layout
```
┌──────────────────────────────────────────────────┐
│  Operations Hub Header + Date + Role Badge        │
├─────────────────┬────────────────────────────────┤
│  Compliance     │  Gemini Morning Briefing        │
│  Risk Score     │  (AI executive summary)         │
│  (0-100 RAG)    │                                 │
├────────┬────────┬────────┬───────────────────────┤
│  NDIS  │Finance │  HR &  │  LEGO®               │
│Compli- │Report- │Workfor-│  Therapy             │
│ance    │  ing   │   ce   │  Growth              │
├────────┴────────┴────────┴───────────────────────┤
│  Quick Links: Plan Utilisation | Screening | ...  │
└──────────────────────────────────────────────────┘
```

## Components

### `ComplianceRiskScore`
A circular SVG gauge displaying a 0–100 score with RAG rating.

**Score Formula:**
```
rawRisk = auditRisk + credentialRisk + checklistRisk + rpRisk + correctiveActionsRisk
score = 100 - min(rawRisk, 100)
```

| Factor | Weight |
|--------|--------|
| Audit < 7 days | +30 |
| Audit 7–30 days | +15 |
| Expired credentials | +10 per credential |
| Expiring credentials | +3 per credential |
| Checklist < 50% | +25 |
| Checklist 50–80% | +12 |
| Active restrictive practices | +4 each |
| Open corrective actions | +5 each |

**RAG Thresholds:**
- 🟢 Green (Low Risk): ≥ 75
- 🟡 Amber (Moderate Risk): 50–74
- 🔴 Red (High Risk): < 50

### `MorningBriefing`
Calls the `generateGeminiContent` Firebase Cloud Function with a structured prompt built from live metrics. Returns 3–5 bullet points covering priorities, risks, and recommended actions.

**Prompt Structure:** Combines COMPLIANCE, FINANCE, HR, and LEGO metrics into a single prompt for holistic briefing.

### Summary Cards (×4)
Each card uses the `SummaryCard` wrapper which provides:
- Domain icon + colour-coded badge
- Alert count badge (red)
- Metric rows with `MetricRow` (icon + label + value + RAG status)
- Progress bars for percentage metrics
- "View full detail" link to the relevant module

## Data Sources
Currently uses **mock data constants** defined at the top of `OperationsHub.tsx`. In production, replace these with Firestore hooks:

```ts
// Replace mock data with:
const { data: complianceMetrics } = useComplianceMetrics();
const { data: financeMetrics } = useFinanceMetrics();
const { data: hrMetrics } = useHRMetrics();
const { data: legoMetrics } = useLegoMetrics();
```

## File Location
`src/presentation/pages/OperationsHub.tsx`

## Route
`/operations-hub` — registered in `src/presentation/routes/AppRouter.tsx`

## Tests
`src/presentation/pages/__tests__/OperationsHub.test.tsx`
- Rendering tests for all four cards
- ComplianceRiskScore calculation unit tests
- Gemini briefing generation (mocked)
