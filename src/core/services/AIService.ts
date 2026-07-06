import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../../lib/firebase";
import { AnonymizerService } from './AnonymizerService';

export interface AIRequest {
  prompt: string;
  context: string;
  agentId: 'clinical-copilot' | 'compliance-bot' | 'finance-assistant';
}

export interface AIResponse {
  content: string;
  confidenceScore: number;
  tokensUsed: number;
}

export class AIService {
  public static async executePrompt(request: AIRequest): Promise<AIResponse> {
    // Scrub PII before processing
    const scrubbedPrompt = AnonymizerService.scrub(request.prompt);
    const scrubbedContext = AnonymizerService.scrub(request.context);
    console.log(`[AIService] Processing anonymized request for agent ${request.agentId}`);

    const functions = getFunctions(app);
    const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
    
    const combinedPrompt = scrubbedContext 
      ? `Context:\n${scrubbedContext}\n\nPrompt:\n${scrubbedPrompt}` 
      : scrubbedPrompt;

    try {
      const result = await generateGeminiContent({ prompt: combinedPrompt });
      const content = (result.data as any).text || "";
      const confidenceScore = 0.96; // High confidence representation
      const tokensUsed = Math.floor(combinedPrompt.length / 4) + Math.floor(content.length / 4) + 15;

      return {
        content,
        confidenceScore,
        tokensUsed
      };
    } catch (error) {
      console.error("[AIService] Error calling generateGeminiContent:", error);
      throw error;
    }
  }
}

