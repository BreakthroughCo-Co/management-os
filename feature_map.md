# Feature Map — Management Operating System

This document maps the active features of the Management Operating System application to their corresponding route paths, page components, feature components, repositories, models, and helper files.

## 1. Core Workspace Features

### Clients / Participant Directory
- **Route Path**: `/clients`
- **Active Files**:
  - `src/presentation/features/clients/ClientList.tsx` (Main UI Component)
  - `src/data/repositories/ClientRepository.ts` (Data Repository / Queries & Mutations)
  - `src/core/models/Client.ts` (Data Model)
- **Description**: Allows administrators, coordinators, and practitioners to search, view details, filter risk levels, track plan usage, and register new NDIS participants.

### Client Intake / Intake Pipeline
- **Route Path**: `/clients/intake`
- **Active Files**:
  - `src/presentation/features/clients/IntakePipeline.tsx` (Main UI Component)
  - `src/core/services/GoogleWorkspaceService.ts` (API connection to Google Forms & Drive)
- **Description**: Connects to Google Forms via Google Workspace APIs to fetch, parse, and synchronize participant intake responses to the client list.

### Client Communications
- **Route Path**: `/communications`
- **Active Files**:
  - `src/presentation/features/clients/ClientCommunications.tsx` (Main UI Component)
- **Description**: Consolidates secure multi-channel communications (email, SMS history) with NDIS participants.

### Knowledge Base / Document Library
- **Route Path**: `/knowledge-base`
- **Active Files**:
  - `src/presentation/features/knowledge-base/DocumentLibrary.tsx` (Main UI Component)
  - `src/data/repositories/DocumentRepository.ts` (Data Repository)
  - `src/core/models/Document.ts` (Data Model)
- **Description**: Document storage mapping policies, forms, and clinical files to ensure audit readiness. Supports document uploads and deletions synced with Google Drive.

---

## 2. Participant Portal Features

### Secure Messaging & Smart Inbox
- **Route Path**: `/portal/messaging`
- **Active Files**:
  - `src/presentation/features/clients/SecureMessaging.tsx` (Main UI Component)
  - `src/presentation/hooks/useSmartInbox.ts` (Custom Hook for smart inbox integration)
  - `src/data/repositories/MessageRepository.ts` (Data Repository)
  - `src/core/models/Message.ts` (Data Model)
- **Description**: Real-time messaging portal connecting coordinators and participants. Uses a custom hook (`useSmartInbox`) to fetch and automatically prioritize/categorize emails and messages.

### Shared Calendar
- **Route Path**: `/portal/calendar`
- **Active Files**:
  - `src/presentation/features/clients/SharedCalendar.tsx` (Main UI Component)
  - `src/data/repositories/CalendarEventRepository.ts` (Data Repository)
  - `src/core/models/CalendarEvent.ts` (Data Model)
- **Description**: Displaying and scheduling client-related events. Integrates with Google Calendar API to manage appointments.

---

## 3. Practitioner & HR Modules

### Practitioner Directory
- **Route Path**: `/practitioners`
- **Active Files**:
  - `src/presentation/features/practitioners/PractitionerDirectory.tsx` (Main UI Component)
  - `src/data/repositories/PractitionerRepository.ts` (Data Repository)
  - `src/core/models/Practitioner.ts` (Data Model)
- **Description**: Management board for practitioners, detailing their specialties, location, email, and task assignments.

### Capability Assessment
- **Route Path**: `/practitioners/assess`
- **Active Files**:
  - `src/presentation/features/practitioners/CapabilityAssessment.tsx` (Main UI Component)
- **Description**: Interactive self-assessment for practitioners to map and grade their competence level against NDIS standards.

### Worker Screening
- **Route Path**: `/practitioners/screening`
- **Active Files**:
  - `src/presentation/features/practitioners/WorkerScreening.tsx` (Main UI Component)
- **Description**: Logs and tracks compliance statuses of practitioners (NDIS screening status, Working With Children Checks, Police Checks).

### Mentorship Program
- **Route Path**: `/practitioners/mentorship`
- **Active Files**:
  - `src/presentation/features/practitioners/MentorshipProgram.tsx` (Main UI Component)
- **Description**: Facilitates pairing senior practitioners with juniors, logging training logs, and tracking professional progression.

### Staff Training
- **Route Path**: `/practitioners/training`
- **Active Files**:
  - `src/presentation/features/practitioners/StaffTraining.tsx` (Main UI Component)
- **Description**: Coordinates mandatory professional training modules, tracking completion logs, and renewals.

---

## 4. NDIS & Finance Features

### Plan Management
- **Route Path**: `/ndis`
- **Active Files**:
  - `src/presentation/features/ndis/PlanManagement.tsx` (Main UI Component)
- **Description**: Monitors overall participant plan status, budgets, and average utilization rates.

### NDIS Calculator
- **Route Path**: `/ndis-calculator`
- **Active Files**:
  - `src/presentation/features/ndis/NDISCalculator.tsx` (Main UI Component)
  - `src/presentation/features/ndis/utils.ts` (Calculation Helper)
  - `src/presentation/features/ndis/calculator.test.ts` (Unit Tests)
- **Description**: NDIS budget calculation helper tool. Allows item modeling and displays totals for weekly, fortnightly, monthly, and one-off expense items.

### NDIS Claim Validator
- **Route Path**: `/ndis/claim-validator`
- **Active Files**:
  - `src/presentation/features/ndis/NDISClaimValidator.tsx` (Main UI Component)
- **Description**: Validates bulk NDIS claims exports, checking format, client credentials, rates, and missing codes.

### Service Agreements
- **Route Path**: `/ndis/agreements`
- **Active Files**:
  - `src/presentation/features/ndis/ServiceAgreements.tsx` (Main UI Component)
- **Description**: Manages, drafts, and tracks signatures for digital NDIS Service Agreements.

### Billing & Claims Management
- **Route Path**: `/billing`
- **Active Files**:
  - `src/presentation/features/ndis/Billing.tsx` (Main UI Component)
  - `src/data/repositories/ClaimRepository.ts` (Data Repository)
  - `src/core/models/Claim.ts` (Data Model)
- **Description**: Financial dashboard for managing, editing, rejecting, and bulk-submitting claims/invoices.

### Billing Anomalies (Fraud & Compliance)
- **Route Path**: `/billing/anomalies`
- **Active Files**:
  - `src/presentation/features/operations/BillingAnomalies.tsx` (Main UI Component)
  - `src/data/repositories/ClaimRepository.ts` (Data Repository)
- **Description**: Uses rule-based checks to scan claims database and flag potential compliance violations (duplicate claims, rate code mismatches, overlapping hours).

---

## 5. Clinical Tools

### ABC Behaviour Analyser
- **Route Path**: `/abc-analyser`
- **Active Files**:
  - `src/presentation/features/clinical/ABCAnalyser.tsx` (Main UI Component)
  - `src/lib/db-schema.ts` (Shared interfaces)
- **Description**: Logs and visualizes Antecedent-Behaviour-Consequence observations to support behavioural intervention strategies.

### Behaviour Support Plan (BSP) Creator
- **Route Path**: `/bsp-creator`
- **Active Files**:
  - `src/presentation/features/clinical/BSPCreator.tsx` (Main UI Component)
- **Description**: Drafts NDIS-compliant Behavior Support Plans including proactive, active, and reactive clinical intervention strategies.

### Telehealth
- **Route Path**: `/telehealth`
- **Active Files**:
  - `src/presentation/features/clinical/Telehealth.tsx` (Main UI Component)
  - `src/core/services/GoogleWorkspaceService.ts` (Google Meet Integration)
- **Description**: Schedules, launches, and manages virtual telehealth sessions integrated directly with Google Meet.

---

## 6. Specialized Interventions

### Social Stories
- **Route Path**: `/social-stories`
- **Active Files**:
  - `src/presentation/features/interventions/SocialStories.tsx` (Main UI Component)
- **Description**: Visual helper editor to create custom behavior narratives for participants with ASD.

### Lego Play Therapy
- **Route Path**: `/lego-play`
- **Active Files**:
  - `src/presentation/features/interventions/LegoPlay.tsx` (Main UI Component)
- **Description**: Tracks participant roles (Engineer, Builder, Supplier), session ratings, and social skill growth during group Lego therapy.

---

## 7. Operations, Compliance & Observability

### Incident Management
- **Route Path**: `/incidents`
- **Active Files**:
  - `src/presentation/features/compliance/Incidents.tsx` (Main UI Component)
  - `src/data/repositories/IncidentRepository.ts` (Data Repository)
  - `src/core/models/Incident.ts` (Data Model)
- **Description**: Tracks client incidents, severity, actions taken, and reporting status to comply with NDIS safeguards.

### Risk Assessment
- **Route Path**: `/risk-assessment`
- **Active Files**:
  - `src/presentation/features/operations/RiskAssessment.tsx` (Main UI Component)
- **Description**: Evaluates clinical and operational risk levels using risk-scoring matrices.

### Command Center
- **Route Path**: `/command-center`
- **Active Files**:
  - `src/presentation/pages/CommandCenter.tsx` (Main Page Component)
- **Description**: Operational dashboard displaying metrics such as intake backlog, compliance warnings, and system health status.

### Observability & Telemetry
- **Route Path**: `/observability`
- **Active Files**:
  - `src/presentation/pages/ObservabilityDashboard.tsx` (Main Page Component)
- **Description**: Real-time metrics tracking client-side memory load, background sync queues, and active connection status.

### Analytics Engine
- **Route Path**: `/analytics-engine`
- **Active Files**:
  - `src/presentation/features/operations/AnalyticsEngine.tsx` (Main UI Component)
  - `src/data/repositories/AnalyticsRepository.ts` (Data Repository)
- **Description**: Forecasts, data charts, and direct exports of financial spreadsheets and NDIS review presentations to Google Workspace.

### Reports
- **Route Path**: `/reports`
- **Active Files**:
  - `src/presentation/pages/Reports.tsx` (Main Page Component)
- **Description**: Custom report generator for exporting activity summaries and audit logs.

---

## 8. AI Features

### AI Assistant (NDIS Copilot)
- **Route Path**: `/ai-assistant`
- **Active Files**:
  - `src/presentation/features/ai/AIAssistant.tsx` (Main UI Component)
  - `src/core/services/KnowledgeRetrievalService.ts` (Gemini-powered semantic search service)
- **Description**: Full-screen assistant using Gemini to query local documentation, ingest policy files, and generate end-of-plan draft summaries.

### Agent Management
- **Route Path**: `/agents`
- **Active Files**:
  - `src/presentation/features/ai/AgentManagement.tsx` (Main UI Component)
- **Description**: Interface to monitor, provision, and assign autonomous agents to NDIS policy verification tasks.

### Copilot Panel (Global Side Panel)
- **Active Files**:
  - `src/presentation/components/layout/CopilotPanel.tsx` (Layout Component)
  - `src/core/services/GeminiService.ts` (Copilot Service Engine)
- **Description**: Global sidebar rendering contextual suggestions and answers based on currently active files/features.

---

## 9. Security, Authentication & Base Layout

### Login
- **Route Path**: `/login`
- **Active Files**:
  - `src/presentation/features/auth/Login.tsx` (Main UI Component)
  - `src/store/useAuthStore.ts` (Zustand Auth Store)
- **Description**: Handles Google OAuth authentication and Role-Based Access Control (RBAC) assignments.

### Main Dashboard
- **Route Path**: `/dashboard`
- **Active Files**:
  - `src/presentation/pages/Dashboard.tsx` (Main Page Component)
- **Description**: Provides unified operational overview, featuring NDIS budget burn rate, pipeline tracking, and incident compliance heatmap.

### Settings
- **Route Path**: `/settings`
- **Active Files**:
  - `src/presentation/pages/Settings.tsx` (Main Page Component)
- **Description**: Profile management and API key settings.

### Audit Trail
- **Route Path**: `/audit`
- **Active Files**:
  - `src/presentation/features/auth/AuditTrail.tsx` (Main UI Component)
- **Description**: Read-only log viewer interface of system operations, user activities, and data access events (Admin only).

### Global Components & Infrastructure
- **Command Palette**: `src/presentation/components/CommandPalette.tsx` (Interactive global command menu)
- **Offline Sync Manager**: `src/presentation/components/OfflineSyncManager.tsx` (Network queue manager for offline edits)
- **Error Boundary**: `src/presentation/components/ErrorBoundary.tsx` (Global UI error handling wrapper)
- **Dashboard Layout**: `src/presentation/components/layout/DashboardLayout.tsx` (Standard app chrome with navigation sidebar)
- **API Client**: `src/core/services/ApiClient.ts` (Axios API connection client - *currently dead*)
