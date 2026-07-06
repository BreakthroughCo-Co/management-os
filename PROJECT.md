# Project: Management OS Architectural and Feature Upgrade

## Architecture
Management OS is a React SPA built with Vite, TypeScript, TailwindCSS, and Radix UI, integrated with Firebase (Firestore, Auth, Cloud Functions).
- **Frontend Layer**: React, TailwindCSS, Radix UI. Uses Zustand for global client state.
- **Service Layer**: Core business services in `src/core/services/` (AI, RAG, API Clients, Google Workspace, Workflow, Audit Logs, Anonymization).
- **Repository Layer**: Data access repositories in `src/data/repositories/` (Claims, Clients, Practitioners, Calendar).
- **Backend Layer**: Firebase Auth (Roles via Custom Claims), Firestore database, Cloud Functions (for AI content/embedding, metrics aggregation, user roles sync).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Codebase Remediation | Wire and reactivate the 10 dead/unused files (ApiClient, useAppStore, IncidentAnalysis, ClientIntake, AIService, AnonymizerService, AuditLoggerService, WorkflowEngine, textarea) | None | DONE (Conv IDs: fff00af2-bde4-4612-8b24-cde53d0eeee5, 86572a54-d57d-46f4-bec0-13bedae3c11c, 2512155c-067b-4e72-a267-e57ec1564dfb, 868346e6-f259-4281-959c-bc8e990baff2) |
| 2 | M2: PWA & Offline Support | Setup service worker with `vite-plugin-pwa`, enable Firestore persistence, wire status notifications, and push messages | M1 | DONE (Conv ID: a96ad873-58b7-42e4-a14d-aadb859f8391) |
| 3 | M3: Advanced AI & RAG | Implement document recursive chunking, embedding generation (`text-embedding-004`), vector search, and assistant integration | M1 | DONE (Conv ID: 15fd4bcf-378c-47ff-960f-03f4a37f5c22) |
| 4 | M4: Deep Security & Transactions | Migrate writes to Firestore Transactions, sync auth Custom Claims with user roles, secure Firestore rules | M1 | PLANNED |
| 5 | M5: Analytics & Reporting | Server-side metrics aggregation via Cloud Functions, CSV/PDF printable export tables | M1 | PLANNED |
| 6 | M6: Telehealth & Client Portal | Implement secure Client role, restricted dashboard views/messaging, expose consult links, integrate client intake | M1, M2, M4 | PLANNED |
| 7 | M7: E2E Integration & Verification | Pass 100% of E2E tests (Tiers 1-4) and perform Adversarial Coverage Hardening (Tier 5) | M1-M6 | PLANNED |

## Code Layout
- `src/main.tsx` - App entry point with Service Worker registration and PWA initialization.
- `src/App.tsx` - App layout and provider setup.
- `src/core/` - Domain model and business logic (services, API client interface).
- `src/data/repositories/` - Data access repositories.
- `src/presentation/` - UI layer:
  - `components/` - Shared UI components (Radix primitives, offline manager, layout).
  - `features/` - Feature-specific logic and UI modules (clinical, compliance, operations, clients).
  - `pages/` - Top-level page components (OperationsHub, Portal, Dashboard).
  - `routes/` - Routing configuration (`AppRouter.tsx`).
- `src/store/` - Global stores (`useAppStore.ts`, `useAuthStore.ts`).
- `functions/src/` - Cloud Functions (Custom Claims, Operations Aggregation, Document Chunking/Embedding).
- `tests/` - Test files (Playwright, Vitest).
