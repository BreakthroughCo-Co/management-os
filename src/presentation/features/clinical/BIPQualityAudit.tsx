import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../../lib/firebase';
import { 
  FileCheck, 
  Upload,
  AlertTriangle,
  Loader2,
  CheckCircle,
  BarChart
} from 'lucide-react';
import { cn } from "../../../lib/utils";

export const BIPQualityAudit = () => {
  const [bspContent, setBspContent] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  const handleAudit = async () => {
    if (!bspContent.trim()) return;
    
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      
      const prompt = `You are an expert NDIS Behaviour Support Practitioner and Auditor. Evaluate the following Behaviour Support Plan (BSP) against the Behavior Intervention Plan Quality Evaluation II (BIP-QEII) tool. 
      Score it out of 24 across the 12 domains (each 0, 1, or 2). 
      Provide a structured Markdown report with:
      1. Overall Score out of 24.
      2. Domain by Domain breakdown with justification.
      3. Key areas for improvement before NDIS submission.
      
      BSP Content:
      ${bspContent}`;
      
      const response = await generateGeminiContent({ prompt });
      setAuditResult((response.data as any).text);
    } catch (err) {
      console.error(err);
      setAuditResult("Error generating AI audit. Please check your connection or try a shorter plan.");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-primary" />
            BIP Quality Audit
          </h1>
          <p className="text-muted-foreground mt-1">Automated evaluation against the BIP-QEII standards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col h-[600px]">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-muted-foreground" />
              Input Behaviour Support Plan
            </h2>
            <textarea
              className="flex-1 w-full p-4 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm"
              placeholder="Paste the draft Behaviour Support Plan (BSP) here..."
              value={bspContent}
              onChange={(e) => setBspContent(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAudit}
                disabled={isAuditing || !bspContent.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart className="w-4 h-4" />}
                {isAuditing ? 'Auditing...' : 'Run BIP-QEII Audit'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-border bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle className="w-5 h-5" />
              <h2 className="font-semibold">Audit Results & Recommendations</h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {isAuditing ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm">Gemini is evaluating 12 clinical domains...</p>
                </div>
              ) : auditResult ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {auditResult}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center px-4 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm">Submit a plan to see quality scoring and clinical recommendations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
