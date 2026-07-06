# E2E Test Infra: Management OS Capability Upgrade

## Test Philosophy
- **Opaque-box & Requirement-driven**: Tests are designed based on the functional requirements from the user specifications, interacting with the application via user-facing interfaces (UI elements, routing, and public APIs). They avoid dependencies on implementation-specific internal state or non-public methods.
- **Methodology**: 
  - **Category-Partition**: Segmenting the application into 5 logical capability domains and identifying key functionalities.
  - **Boundary Value Analysis (BVA)**: Exercising input limits, edge values, empty states, and system failures.
  - **Pairwise Combinatorial Testing**: Verifying interactions between different features to ensure they function correctly in tandem.
  - **Real-World Workload Testing**: Multi-step workflows mimicking actual practitioner and client actions in production-like scenarios.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) |
|---|---------|----------------------|:-----------------:|:-----------------:|:----------------------:|
| 1 | **F1: Offline PWA Support** | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ (Pairwise) |
| 2 | **F2: Advanced AI & RAG** | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ (Pairwise) |
| 3 | **F3: Deep Security & Transactions** | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ (Pairwise) |
| 4 | **F4: Analytics & Reporting** | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ (Pairwise) |
| 5 | **F5: Client Portal & Telehealth** | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ (Pairwise) |

## Test Architecture
- **Test Runner**: Playwright
- **Configuration**: `playwright.config.ts` runs the tests against the React app at `http://localhost:5173`.
- **Directory Layout**:
  - `e2e/pwa.spec.ts` - Offline PWA Support tests (F1)
  - `e2e/ai.spec.ts` - Advanced AI & RAG tests (F2)
  - `e2e/security.spec.ts` - Deep Security & Transactions tests (F3)
  - `e2e/analytics.spec.ts` - Analytics & Reporting tests (F4)
  - `e2e/client-portal.spec.ts` - Client Portal & Telehealth tests (F5)
  - `e2e/pairwise.spec.ts` - Cross-Feature Combinations (Tier 3)
  - `e2e/scenarios.spec.ts` - Real-World Application Scenarios (Tier 4)
- **Invocation**: `npx playwright test`

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature (Total: 25 tests)
- **Tier 2 (Boundary & Corner Cases)**: ≥5 test cases per feature (Total: 25 tests)
- **Tier 3 (Cross-Feature Combinations)**: 5 pairwise interaction tests covering major feature overlaps.
- **Tier 4 (Real-World Application Scenarios)**: 5 complete user workflow scenarios.
- **Total Minimum Test Cases**: 60 test cases.

---

## Detailed Test Cases

### F1: Offline PWA Support (e2e/pwa.spec.ts)
* **Tier 1 (Feature Coverage)**:
  1. *Service Worker Registration*: Verify that on first load, the browser successfully registers the PWA service worker.
  2. *Offline Shell Caching*: Simulate going offline, reload the page, and verify the main application shell/layout loads successfully.
  3. *Offline Status UI Indicator*: Verify that going offline displays a visual offline notification/banner in the UI.
  4. *Offline Write Queuing*: Simulate offline state, trigger a form submission (e.g. client note or incident), and verify it is queued locally without throwing a network error.
  5. *Reconnection Synchronization*: Restore online connection and verify that the locally queued actions sync back to the database automatically.
* **Tier 2 (Boundary & Corner Cases)**:
  1. *Rapid Connectivity Toggle*: Toggle online/offline states rapidly (e.g. 5 times in 2 seconds) and verify the sync queue does not duplicate requests.
  2. *Storage Quota Exceeded Handling*: Simulate IndexedDB storage failure / quota limit and verify PWA falls back gracefully with a warning instead of crashing.
  3. *Large Sync Queue Processing*: Queue 100+ offline operations and verify they sync in strict chronological sequence when coming online.
  4. *Uncached Route Offline Navigation*: Attempt to navigate to an uncached route while offline and verify a user-friendly offline fallback page is displayed.
  5. *Conflicting Updates Resolution*: Simulate concurrent modifications online and offline on the same entity, verifying that the app uses a safe merge strategy (last-write-wins or prompt to merge).

### F2: Advanced AI & RAG (e2e/ai.spec.ts)
* **Tier 1 (Feature Coverage)**:
  1. *Document Recursive Chunking*: Ingest a large policy document in the Knowledge Base and verify the system splits it into chunks of appropriate size.
  2. *Vector Embedding Generation*: Verify that uploaded document chunks trigger embedding generation via `text-embedding-004`.
  3. *Semantic Vector Search*: Query the Knowledge Base using natural language and verify relevant chunk results are retrieved.
  4. *Copilot Panel Integration*: Ask a question in the global Copilot panel and verify a contextually relevant Gemini response is returned.
  5. *Multi-Agent Report Workflow*: Trigger an automated report generation, verifying it transitions from initial draft to compliance checker to compiler.
* **Tier 2 (Boundary & Corner Cases)**:
  1. *Empty Document Ingestion*: Upload an empty document or a document containing only whitespace, verifying it is rejected gracefully.
  2. *Large File Limit Chunks*: Upload a massive document (exceeding single-transaction limits) and verify it chunks asynchronously without blocking the UI main thread.
  3. *Gibberish Query Search*: Query the vector search with meaningless characters, verifying it returns a clean empty-state message without failing.
  4. *Concurrent Report Generation*: Trigger multiple multi-agent reports simultaneously, verifying isolation between agents and no cross-talk of data.
  5. *AI API Outage Resilience*: Mock a Gemini API timeout or HTTP 503 error, verifying the UI shows a friendly retry warning rather than crashing.

### F3: Deep Security & Transactions (e2e/security.spec.ts)
* **Tier 1 (Feature Coverage)**:
  1. *Billing Ledger Transaction*: Perform a billing write (claim approval) and verify it executes inside a Firestore Transaction, updating the ledger atomically.
  2. *Plan Utilization Update*: Perform a write updating plan utilization, verifying atomic calculation to prevent over-utilization.
  3. *Custom Claims Auth Sync*: Change a user's role in Firestore and verify that a Cloud Function automatically triggers to sync claims to Firebase Auth.
  4. *Practitioner RBAC Enforcement*: Verify that a Practitioner role can view clients but is denied access to billing and admin audit logs.
  5. *Client RBAC Enforcement*: Verify that a Client role is restricted strictly to portal routes and cannot access practitioner directories or NDIS calculators.
* **Tier 2 (Boundary & Corner Cases)**:
  1. *Transaction Rollback on Fail*: Force a mid-transaction validation failure (e.g. invalid claims data) and verify that all related writes are rolled back.
  2. *Concurrent Transaction Contention*: Simulate two simultaneous writes targeting the same plan utilization record; verify that one transaction retries and both execute successfully.
  3. *Claims Sync Latency Handling*: Access the site during role changes and verify access remains restricted until auth claims are fully synchronized.
  4. *Direct API Security Breach Attempt*: Attempt direct API requests to restricted endpoints without the correct claims, verifying a strict HTTP 403 response.
  5. *Session Expiration / Revocation*: Mock an expired session token and verify immediate redirection to `/login` with clean local storage.

### F4: Analytics & Reporting (e2e/analytics.spec.ts)
* **Tier 1 (Feature Coverage)**:
  1. *Server-Side Metrics Aggregation*: Trigger metrics recalculation and verify it aggregates data via Cloud Functions rather than client-side logic.
  2. *Scheduled Metrics Aggregation*: Verify that the scheduled aggregator function correctly tallies daily/weekly system usage and NDIS burn rates.
  3. *CSV Export of Clients*: Click export on the clients directory and verify a valid CSV file downloads.
  4. *CSV Export of Claims*: Click export on the billing claims list and verify download of a sanitized, parsed CSV.
  5. *PDF Printable Export*: Click PDF print on a major report table, verifying that a printable CSS view renders.
* **Tier 2 (Boundary & Corner Cases)**:
  1. *Aggregation on Empty Database*: Run metrics aggregation on an empty database, verifying that charts display zeros instead of NaN.
  2. *Large Dataset CSV Stream*: Trigger CSV export on a table containing 10,000+ entries, verifying that it downloads without memory exhaustion.
  3. *CSV Injection Sanitization*: Insert formulas (e.g., `=1+1`, `@SUM`) in client names and verify that the exported CSV escapes them securely.
  4. *PDF Print CSS Wrapping*: Verify that large multi-column tables adjust their layout and do not crop off columns in PDF/print mode.
  5. *Invalid Analytics Date Ranges*: Query charts with invalid date ranges (e.g., end date before start date), verifying the app rejects the input and prompts the user.

### F5: Client Portal & Telehealth (e2e/client-portal.spec.ts)
* **Tier 1 (Feature Coverage)**:
  1. *Client Dashboard Render*: Log in as a Client and verify they land on a restricted dashboard showing secure messaging, telehealth, and calendar links.
  2. *Secure Client Messaging*: Send a message from the Client Portal and verify it appears in the practitioner's Smart Inbox.
  3. *Video Consult Link Exposure*: Access the client dashboard, find a scheduled telehealth session, and verify a valid video call link (Google Meet) is visible.
  4. *Client Intake Form Submission*: Submit a new client intake form and verify that the information is imported into the coordinator client list.
  5. *Client Shared Calendar*: Verify that clients can see their scheduled telehealth appointments on a restricted calendar page.
* **Tier 2 (Boundary & Corner Cases)**:
  1. *Client Privilege Escalation Attempt*: Attempt to navigate directly to practitioner routes (e.g., `/practitioners`, `/ndis`) as a Client, verifying a redirection with access warning.
  2. *Expired Telehealth Link*: Click a telehealth link after the scheduled meeting time, verifying that the link is disabled or displays an expired notice.
  3. *Large Messaging Payload*: Attempt to send a message with an oversized attachment (e.g., >20MB) or invalid format, verifying a clear validation error message.
  4. *Duplicate Client Intake Handling*: Submit the intake form twice with identical details, verifying that the system flags it as a duplicate rather than creating a new record.
  5. *Australian Timezone Mismatch*: Schedule an appointment between a practitioner in AEDT (Sydney) and a client in AWST (Perth) and verify the calendar displays correct localized times to both.

---

## Tier 3: Cross-Feature Combinations (e2e/pairwise.spec.ts)
1. *F1 + F3: Offline Secure Billing Transaction*:
   - Queue a billing claim write while offline.
   - Restore connection.
   - Verify that the queued operation is resolved inside a secure Firestore Transaction, enforcing security rules.
2. *F1 + F5: Offline Client Secure Messaging*:
   - Log in as a client and go offline.
   - Draft and send a message through the client portal messaging UI.
   - Verify it shows "pending sync" status.
   - Go online, verify it is delivered to the practitioner's Smart Inbox.
3. *F2 + F4: AI-driven Analytics Report Export*:
   - Ask Copilot to summarize the current operations hub metrics.
   - Trigger PDF/CSV export of the generated summary report.
   - Verify the downloaded file matches the AI content and is formatted correctly.
4. *F3 + F5: Client Portal RBAC & Security Rule enforcement*:
   - Verify that a Client role trying to access `/practitioners` or firestore collection for practitioners is blocked both on the UI route layer and the DB rules layer.
5. *F2 + F5: Client AI Intake Processing*:
   - Submit a raw text intake.
   - Trigger the AI assistant to parse the text, recursively chunk the intake details, run compliance checks, and automatically populate the client's file.

---

## Tier 4: Real-World Application Scenarios (e2e/scenarios.spec.ts)

### Scenario 1: Offline Field Intake and Sync
A practitioner travels to a remote clinic with no network access. They open the app, register a new client intake record, write a progress note, and update the participant's plan utilization balance. Later, the practitioner returns to base (network restored). The app automatically syncs the offline queue. The client profile is created, the note is saved, and the plan utilization balance is recalculated atomically via a Firestore transaction.

### Scenario 2: AI-Assisted NDIS Policy Verification & Report Compilation
An administrator uploads a new NDIS Pricing Guide PDF to the Knowledge Base. The system automatically chunks the text and updates the vector database. The admin launches a multi-agent report workflow. The compiler agent queries the database using semantic search, checks the active client list for billing anomalies against the pricing guidelines, compiles a compliance report, and exports the results as a printable PDF audit trail.

### Scenario 3: Complete Client Telehealth Lifecycle
A prospective participant submits a web-based intake form. A coordinator approves it. The system creates a new user, assigns the "Client" role, and triggers custom claims sync. The client logs in, views their self-service dashboard, schedules a video consult session, receives an automated email/SMS confirmation, joins the telehealth room via the Google Meet link, and receives a follow-up secure message.

### Scenario 4: Bulk Claims Auditing, Reconciliation, and Export
An operations manager reviews the dashboard. A scheduled Cloud Function triggers, aggregating all operational metrics. The manager visits the billing anomalies tab, flags duplicate claims, runs a Firestore Transaction to safely reverse the erroneous ledger entries, and downloads the complete sanitized billing history as a CSV file for financial reconciliation.

### Scenario 5: Client Portal Onboarding, Policy Inquiry, and Secure Messaging
A new client completes onboarding. They navigate to their dashboard and ask the NDIS Copilot (AI assistant) about service agreement policies. The Copilot retrieves relevant guidelines from the Knowledge Base and provides a summary. The client reviews their active service agreement, signs it, and writes a secure message to their coordinator to confirm start of service.
