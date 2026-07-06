import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../../lib/firebase";
import { DocumentMetadata } from "../models/Document";
import { AnonymizerService } from "./AnonymizerService";

export class GeminiService {
  private history: any[] = [];
  private systemInstruction: string = "";
  
  startCopilotChat(documents: DocumentMetadata[]) {
    this.history = [];
    
    let sys = "You are an AI Copilot for Breakthrough Management OS.\n";
    sys += "You assist clinic staff with inquiries based on the organization's document library.\n";
    sys += "IMPORTANT INSTRUCTION: Always explicitly cite the document name (e.g., 'According to [Filename]') when using information from the provided documents.\n\n";
    sys += "--- AVAILABLE DOCUMENTS ---\n";
    
    documents.forEach(doc => {
      if (doc.textContent) {
        sys += `\nDocument Name: ${doc.name}\nContent:\n${doc.textContent}\n`;
      }
    });

    this.systemInstruction = sys;
  }

  async sendMessage(msg: string): Promise<string> {
    const scrubbedMsg = AnonymizerService.scrub(msg);
    const functions = getFunctions(app);
    const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
    
    try {
      const result = await generateGeminiContent({
        prompt: scrubbedMsg,
        systemInstruction: this.systemInstruction,
        temperature: 0.2,
        history: this.history,
      });

      const responseText = (result.data as any).text || "";
      
      // Update history
      this.history.push({ role: "user", parts: [{ text: scrubbedMsg }] });
      this.history.push({ role: "model", parts: [{ text: responseText }] });
      
      return responseText;
    } catch (error) {
      console.error("Error generating content via Firebase Function:", error);
      throw error;
    }
  }
}

export const copilotService = new GeminiService();
