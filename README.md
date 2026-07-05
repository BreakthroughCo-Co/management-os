# Management OS — Project README

## Overview
**Management OS** is a comprehensive NDIS practice management system for **Breakthrough Coaching & Consulting**. It is a React Single Page Application (SPA) built with Vite, TypeScript, TailwindCSS, Firebase, and Gemini AI.

## Live URL
🌐 **https://breakthrough-administration.web.app**

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | TailwindCSS 3, Radix UI, framer-motion |
| State | Zustand |
| Data | Firebase Firestore, Firebase Auth, Firebase Storage |
| AI | Gemini AI via Firebase Cloud Functions |
| Testing | Vitest, Testing Library, Playwright (E2E) |
| CI/CD | GitHub Actions → Firebase Hosting |

## Feature Modules

| Module | Route | Roles |
|--------|-------|-------|
| **Operations Hub** | `/operations-hub` | Admin, Coordinator, Practice Manager |
| Dashboard | `/dashboard` | All |
| Command Center | `/command-center` | Admin, Coordinator |
| Clients | `/clients` | Admin, Coordinator, Practitioner |
| NDIS Plan Management | `/ndis` | Admin, Coordinator |
| Plan Utilisation | `/ndis/utilisation` | Admin, Coordinator, Practice Manager |
| Billing Ledger | `/billing` | Admin, Coordinator |
| Staff Directory | `/practitioners` | Admin, Coordinator, Practitioner |
| Staff Training | `/practitioners/training` | All clinical |
| Staff Induction | `/practitioners/induction` | Admin, Coordinator |
| Worker Screening | `/practitioners/screening` | Admin, Coordinator |
| Capability Audits | `/practitioners/assess` | Admin, Coordinator |
| Case Notes | `/case-notes` | Clinical staff |
| Incident Log | `/incidents` | Clinical staff |
| Restrictive Practices | `/compliance/restrictive-practices` | Clinical staff |
| FBA Assessments | `/clinical/fba` | Clinical staff |
| BIP Quality Audit | `/clinical/bip-audit` | Clinical staff |
| ABC Analyser | `/abc-analyser` | Clinical staff |
| BSP Creator | `/bsp-creator` | Clinical staff |
| LEGO® Play Therapy | `/lego-play` | Clinical staff |
| Social Stories | `/social-stories` | Clinical staff |
| AI Assistant | `/ai-assistant` | Clinical staff |
| Analytics Engine | `/analytics-engine` | Admin, Coordinator |
| Reports Distribution | `/reports` | Admin, Coordinator |
| Audit Trail | `/audit` | Admin only |
| Settings | `/settings` | All |

## RBAC Roles
Defined in [`src/shared/constants/roles.ts`](./src/shared/constants/roles.ts):

| Role | Description |
|------|-------------|
| `Admin` | Full system access |
| `Coordinator` | Operational access (clients, finance, HR) |
| `Practice Manager` | Operations Hub, Finance, HR, Compliance |
| `Practitioner` | Clinical tools, case notes, sessions |
| `Viewer` | Read-only dashboard access |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type-check
npx tsc --noEmit

# Build for production
npm run build

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Format code
npm run format
```

## Deployment
The app auto-deploys to Firebase Hosting via GitHub Actions:
- **Push to `main`** → production deploy to `breakthrough-administration.web.app`
- **Pull Request** → preview channel deploy

### Manual deploy
```bash
npm run build
npx firebase-tools deploy --only hosting
```

## Firestore Security Rules
Located at [`firestore.rules`](./firestore.rules). Rules are role-based using Firebase Auth custom claims:
- Default-deny on all unmatched paths
- Per-collection access control aligned to RBAC roles
- Audit logs are append-only (write disabled from client)

## Module Docs
- [Operations Hub](./docs/operations-hub.md)

## Firebase Project
- **Project ID:** `breakthrough-administration`
- **Hosting:** `breakthrough-administration.web.app`
- **Region:** `australia-southeast1` (Cloud Functions)
