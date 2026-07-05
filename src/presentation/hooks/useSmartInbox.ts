import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleWorkspaceService } from '@/core/services/GoogleWorkspaceService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/lib/firebase';

export function useSmartInbox() {
  const { googleAccessToken } = useAuthStore();
  
  const [emails, setEmails] = useState<any[]>([]);
  const [activeEmail, setActiveEmail] = useState<any>(null);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [gmailConnected, setGmailConnected] = useState(false);

  const connectGmail = useCallback(async () => {
    if (!googleAccessToken) {
      alert("Please sign in with Google first.");
      return;
    }
    setFetchingEmails(true);
    try {
      const fetched = await GoogleWorkspaceService.fetchEmails(googleAccessToken, 5);
      setEmails(fetched);
      setGmailConnected(true);
    } catch (err) {
      console.error(err);
      alert("Error fetching Gmails. Check console.");
    } finally {
      setFetchingEmails(false);
    }
  }, [googleAccessToken]);

  const draftReply = useCallback(async () => {
    if (!activeEmail) return;
    setDrafting(true);
    try {
      const snippet = activeEmail.snippet || "No snippet available.";
      const prompt = `You are an AI assistant for a clinical NDIS practice. Draft a professional, empathetic email reply to this incoming message:\n\nIncoming message snippet: "${snippet}"\n\nDraft a concise response acknowledging the email and offering assistance.`;
      
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const resp = await generateGeminiContent({ prompt });
      setAiDraft((resp.data as any).text || "Draft generated.");
    } catch (err) {
      console.error(err);
      alert("Error drafting reply.");
    } finally {
      setDrafting(false);
    }
  }, [activeEmail]);

  return {
    emails,
    activeEmail,
    setActiveEmail,
    fetchingEmails,
    drafting,
    aiDraft,
    setAiDraft,
    gmailConnected,
    connectGmail,
    draftReply
  };
}
