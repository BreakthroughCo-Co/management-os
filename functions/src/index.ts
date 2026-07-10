import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

admin.initializeApp();

// We require the GEMINI_API_KEY to be available in the environment.
// For production, you would set this via Firebase Secret Manager.
const apiKey = process.env.GEMINI_API_KEY || "AIzaSy_MOCK_FALLBACK_KEY";
const ai = new GoogleGenAI({ apiKey });

export const generateGeminiContent = functions.https.onCall(async (data, context) => {
  // 1. Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in to use the AI assistant."
    );
  }

  try {
    const { prompt, systemInstruction, temperature, responseSchema, history } = data;

    // We can extract system instruction if provided, otherwise default to a simple assistant.
    const config: any = {
      temperature: temperature || 0.7,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (responseSchema) {
      config.responseMimeType = "application/json";
      config.responseSchema = responseSchema;
    }

    const request: any = {
      model: "gemini-2.5-flash",
      config: config,
    };

    const userParts = Array.isArray(prompt) ? prompt : [{ text: prompt }];

    if (history && Array.isArray(history)) {
      request.contents = [...history, { role: "user", parts: userParts }];
    } else {
      request.contents = userParts;
    }

    const response = await ai.models.generateContent(request);

    return { text: response.text };
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to generate AI content.");
  }
});

export const generateGeminiEmbedding = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in to generate embeddings."
    );
  }

  try {
    const { text } = data;
    if (!text) throw new Error("No text provided for embedding.");

    // We use text-embedding-004 model
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });

    return { embedding: response.embeddings?.[0]?.values || [] };
  } catch (error: any) {
    console.error("Gemini Embedding Error:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to generate embedding.");
  }
});

export const writeAuditLog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in to write audit logs."
    );
  }

  try {
    const logEntry = data;
    const docRef = await admin.firestore().collection("auditLogs").add(logEntry);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Write Audit Log Error:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to write audit log."
    );
  }
});

// ── Role-change auditing ──────────────────────────────────────────────────
// Roles are stored on /users/{userId}.role and read live by firestore.rules
// for every permission check (see PROJECT.md M4 decision note), which makes
// this field unusually sensitive — a single write can change what a user
// can do system-wide. This trigger runs with trusted admin privileges
// (bypassing firestore.rules) and cannot be spoofed or skipped by the
// client, unlike the writeAuditLog callable above which trusts whatever
// the caller sends it.
//
// Settings.tsx's admin-only role-management panel writes `roleChangedBy`
// (the acting Admin's uid) alongside `role` in the same setDoc call, so we
// can attribute who made the change; if that field is missing (e.g. a
// direct API/console edit) we log 'unknown' rather than fail the write.
export const logRoleChange = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.role === after.role) {
      return null; // no role change — nothing to log
    }

    try {
      await admin.firestore().collection("auditLogs").add({
        type: "role_change",
        userId: context.params.userId,
        previousRole: before.role ?? null,
        newRole: after.role ?? null,
        changedBy: after.roleChangedBy ?? "unknown",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      // Never let audit-log failures block or retry the underlying role
      // change — log the failure server-side instead.
      console.error("Failed to write role-change audit log:", error);
    }
    return null;
  });

// ── M5: Dashboard metrics aggregation ──────────────────────────────────────
// AnalyticsRepository.ts reads pre-computed metrics from analytics/dashboard_stats
// and analytics/engine_charts rather than aggregating client-side, both to keep
// the dashboard fast (no client ever pulls every client/claim/session document
// just to render a KPI card) and because the underlying collections are
// restricted to clinical/management roles in firestore.rules — a Viewer can
// see the resulting stats without needing read access to raw client records.
//
// This function is the only writer of those two documents (see the
// analytics/{docId} rule: client writes are denied outright). It runs on a
// schedule so the dashboard is never more than ~30 minutes stale, and is also
// exposed as a callable so a Practice Manager+ can force an immediate refresh
// from the UI (e.g. right after approving a batch of claims).
//
// Fields aggregated from real data: activeClients, pendingApprovals,
// sessionsToday, complianceRate, burnGauge, and the 6-week claims trend.
// The `heatmap` field is intentionally left as-is from whatever was
// previously stored (or omitted on first run) — there isn't yet a
// session-attendance data model detailed enough (which client, which day,
// attended vs no-show) to honestly back a per-day heatmap; wiring that up
// belongs with whatever session/attendance tracking feature builds that data
// model, not invented here from data that doesn't capture it.

interface ClaimDoc {
  status?: string;
  dateOfService?: string;
  totalAmount?: number;
}

interface ClientDoc {
  status?: string;
  flags?: string[];
  nextReview?: string;
  funding?: { totalBudget?: number; utilized?: number };
}

interface CalendarEventDoc {
  date?: string;
  type?: string;
}

function isoWeekLabel(date: Date): string {
  // Simple Mon-start week bucketing for a 6-week trend — doesn't need to be
  // a true ISO week number, just a stable, sortable bucket per calendar week.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1); // back up to Monday
  return d.toISOString().slice(0, 10);
}

async function computeDashboardMetrics() {
  const db = admin.firestore();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [clientsSnap, claimsSnap, eventsSnap, prevStatsSnap] = await Promise.all([
    db.collection("clients").get(),
    db.collection("claims").get(),
    db.collection("calendar_events").get(),
    db.doc("analytics/dashboard_stats").get(),
  ]);

  const clients = clientsSnap.docs.map((d) => d.data() as ClientDoc);
  const claims = claimsSnap.docs.map((d) => d.data() as ClaimDoc);
  const events = eventsSnap.docs.map((d) => d.data() as CalendarEventDoc);

  // ── Active clients ────────────────────────────────────────────────────
  const activeClients = clients.filter((c) => c.status === "Active").length;

  // ── Pending approvals (claims awaiting sign-off) ─────────────────────
  const pendingApprovals = claims.filter(
    (c) => c.status === "Pending" || c.status === "Pending Validation"
  ).length;

  // ── Sessions today (client-facing calendar entries, not internal meetings)
  const sessionsToday = events.filter(
    (e) => e.date === todayStr && e.type !== "meeting"
  ).length;

  // ── Compliance rate: share of active clients with no open risk flags and
  // a review date that isn't overdue. This is a defined proxy, not an NDIS
  // regulatory calculation — documented here so it isn't mistaken for one.
  const activeClientDocs = clients.filter((c) => c.status === "Active");
  const compliantClients = activeClientDocs.filter((c) => {
    const noFlags = !c.flags || c.flags.length === 0;
    const reviewOk = !c.nextReview || c.nextReview >= todayStr;
    return noFlags && reviewOk;
  }).length;
  const complianceRate = activeClientDocs.length > 0 ?
    (compliantClients / activeClientDocs.length) * 100 :
    100;

  // ── Funding burn gauge: aggregate budget/utilization across active clients
  const budget = activeClientDocs.reduce((sum, c) => sum + (c.funding?.totalBudget ?? 0), 0);
  const utilized = activeClientDocs.reduce((sum, c) => sum + (c.funding?.utilized ?? 0), 0);
  const burnPercentage = budget > 0 ? Math.round((utilized / budget) * 100) : 0;

  // ── Percentage change vs the previous run, for the KPI card deltas ─────
  const prev = prevStatsSnap.exists ? prevStatsSnap.data() : null;
  const prevRaw = prev?.rawStats as
    | { activeClients: number; pendingApprovals: number; sessionsToday: number; complianceRate: number }
    | undefined;
  const pctChange = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === 0) return "—";
    const delta = ((current - previous) / previous) * 100;
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
  };

  const stats = {
    activeClients: {
      value: String(activeClients),
      change: pctChange(activeClients, prevRaw?.activeClients),
    },
    pendingApprovals: {
      value: String(pendingApprovals),
      change: pctChange(pendingApprovals, prevRaw?.pendingApprovals),
    },
    sessionsToday: {
      value: String(sessionsToday),
      change: pctChange(sessionsToday, prevRaw?.sessionsToday),
    },
    complianceRate: {
      value: `${complianceRate.toFixed(1)}%`,
      change: pctChange(complianceRate, prevRaw?.complianceRate),
    },
  };

  // ── 6-week claims trend (count + $ value per week, most recent last) ──
  const weekBuckets = new Map<string, { claims: number; value: number }>();
  for (const claim of claims) {
    if (!claim.dateOfService) continue;
    const parsed = new Date(claim.dateOfService);
    if (isNaN(parsed.getTime())) continue;
    const label = isoWeekLabel(parsed);
    const bucket = weekBuckets.get(label) ?? { claims: 0, value: 0 };
    bucket.claims += 1;
    bucket.value += claim.totalAmount ?? 0;
    weekBuckets.set(label, bucket);
  }
  const sortedWeeks = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, v], idx, arr) => ({
      week: `Week ${idx + 1 + (6 - arr.length)}`,
      claims: v.claims,
      value: Math.round(v.value),
    }));

  const burnGauge = {
    percentage: burnPercentage,
    utilized: Math.round(utilized),
    budget: Math.round(budget),
    target: (prev?.burnGauge?.target as number | undefined) ?? 65,
  };

  await db.doc("analytics/dashboard_stats").set({
    stats,
    claims: sortedWeeks,
    burnGauge,
    heatmap: prev?.heatmap ?? [],
    rawStats: { activeClients, pendingApprovals, sessionsToday, complianceRate },
    computedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { stats, claims: sortedWeeks, burnGauge };
}

export const aggregateDashboardMetricsScheduled = functions.pubsub
  .schedule("every 30 minutes")
  .onRun(async () => {
    try {
      await computeDashboardMetrics();
    } catch (error) {
      console.error("Scheduled dashboard metrics aggregation failed:", error);
    }
    return null;
  });

export const refreshDashboardMetrics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in to refresh dashboard metrics."
    );
  }

  // Mirror isPracticeManager() from firestore.rules — Admin, Coordinator, or
  // Practice Manager may force a refresh; anyone else gets the scheduled
  // 30-minute cadence only.
  const callerRoleDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  const callerRole = callerRoleDoc.exists ? callerRoleDoc.data()?.role : "Viewer";
  if (!["Admin", "Coordinator", "Practice Manager"].includes(callerRole)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only Practice Managers, Coordinators, or Admins can force a metrics refresh."
    );
  }

  try {
    const result = await computeDashboardMetrics();
    return { success: true, ...result };
  } catch (error: any) {
    console.error("On-demand dashboard metrics aggregation failed:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to refresh dashboard metrics.");
  }
});
