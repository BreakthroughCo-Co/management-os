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
  private static mockDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

  public static async executePrompt(request: AIRequest): Promise<AIResponse> {
    await this.mockDelay(1500); // Simulate API latency

    // Scrub PII before processing
    const scrubbedPrompt = AnonymizerService.scrub(request.prompt);
    const scrubbedContext = AnonymizerService.scrub(request.context);
    console.log(`[AIService] Processing anonymized request for agent ${request.agentId}`);

    if (request.agentId === 'clinical-copilot') {
      return {
        content: `Based on the session context provided, here is a draft for the clinical note: \n\nThe participant engaged in 45 minutes of Lego Therapy. Demonstrated improved turn-taking skills compared to previous session. Continued difficulty with transitions.`,
        confidenceScore: 0.92,
        tokensUsed: 154,
      };
    }

    if (request.agentId === 'compliance-bot') {
      return {
        content: `WARNING: The uploaded incident report lacks a required signature from the Guardian. Please flag this for immediate review under NDIS Practice Standard 4.1.`,
        confidenceScore: 0.98,
        tokensUsed: 89,
      };
    }

    return {
      content: `I am the generic AI assistant. I have processed your request regarding: ${request.prompt.substring(0, 50)}...`,
      confidenceScore: 0.85,
      tokensUsed: 42,
    };
  }
}
