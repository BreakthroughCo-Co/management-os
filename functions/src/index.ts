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
      config: config
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
