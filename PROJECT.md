# Project: Management OS Audit and Cleanup Analysis

## Architecture
Management OS is a React SPA built with Vite, TypeScript, TailwindCSS, and Radix UI.
It leverages:
- **Routing**: `react-router-dom` defined in `src/presentation/routes/AppRouter.tsx`
- **State Management**: Zustand in `src/store/`
- **Core Services**: AI, Google Workspace, knowledge base, and business workflows in `src/core/services/`
- **Features**: Modular features under `src/presentation/features/` (AI, Auth, Clients, Clinical, Compliance, Interventions, Knowledge Base, NDIS, Operations, Practitioners)
- **Pages**: Top-level page views under `src/presentation/pages/` (Command Center, Dashboard, Observability, Reports, Settings)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration | Trace and list all active features, pages, components, and routes | None | IN_PROGRESS (Remediation Conv IDs: 117f3e1f-9ce1-403a-be30-248d46c2f4e2, b8121aec-a7de-4a4c-9c92-99e457c17c98, 59e5401e-0b33-4d0f-bdf0-6f1a6aeb2bdf) |
| 2 | Feature Mapping | Generate `feature_map.md` listing core features and file paths | M1 | PLANNED |
| 3 | Static Analysis Audit | Run `tsc` and `eslint` static analysis to locate dead code and compile `audit_report.md` | M1 | PLANNED |
| 4 | Final Verification | Verify reports and deliver handoff | M2, M3 | PLANNED |

## Code Layout
- `src/main.tsx` - App entry point
- `src/App.tsx` - App layout and provider setup
- `src/core/` - Domain model and business logic (services, API clients)
- `src/presentation/` - UI layer
  - `components/` - Shared UI components (Radix primitives, common buttons, tables)
  - `features/` - Feature-specific logic and UI modules
  - `pages/` - Top-level page components
  - `routes/` - Routing configuration
  - `hooks/` - UI-specific hooks
- `src/store/` - Global stores
- `src/lib/` - Shared utility functions/clients
- `tests/` - Test files (Playwright, Vitest)
