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
