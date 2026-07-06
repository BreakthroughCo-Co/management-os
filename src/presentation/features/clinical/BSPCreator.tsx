import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import app, { db, auth } from "@/lib/firebase";
import { AIService } from "@/core/services/AIService";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Badge } from "@/presentation/components/ui/badge";
import { Sparkles, FileEdit, Copy, CheckCheck, AlertCircle, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const BSP_DOMAINS = [
  "Communication & Language",
  "Sensory Processing",
  "Emotional Regulation",
  "Social Skills & Interaction",
  "Daily Living Skills",
  "Safety & Risk Behaviour",
  "Transition & Routine Changes",
];

export function BSPCreator() {
  const [clientName, setClientName] = useState("");
  const [domain, setDomain] = useState("");
  const [antecedent, setAntecedent] = useState("");
  const [behaviour, setBehaviour] = useState("");
  const [consequence, setConsequence] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [auditResult, setAuditResult] = useState<{ score: number; issues: string[]; } | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !domain || !behaviour) return;
    setLoading(true);
    setGeneratedPlan("");
    setAuditResult(null);

    const prompt = `You are an NDIS-certified Behaviour Support Specialist. Create a comprehensive, evidence-based Behaviour Support Plan (BSP) for the following:

Client: ${clientName}
Primary Domain: ${domain}
Antecedent (trigger): ${antecedent || "Unknown/multiple triggers"}
Target Behaviour: ${behaviour}
Consequence (what happens after): ${consequence || "Not specified"}

Generate a structured BSP with these exact sections:
1. Background & Purpose
2. Target Behaviour Definition (observable & measurable)
3. Identified Antecedents & Setting Events
4. Hypothesis Statement (function of behaviour)
5. Proactive Strategies (minimum 4 strategies)
6. Teaching Strategies (replacement behaviours)
7. Reactive Strategies & De-escalation
8. Restrictive Practice Reduction Pathway (NDIS compliant)
9. Data Collection Method
10. Review Timeline & Success Indicators

Format each section with a bold heading and clear, professional content suitable for submission to the NDIS Commission.`;

    try {
      const response = await AIService.executePrompt({
        prompt,
        context: "",
        agentId: "clinical-copilot"
      });
      setGeneratedPlan(response.content || "Failed to generate plan.");
    } catch (err) {
      setGeneratedPlan("Error: Could not connect to Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!generatedPlan) return;
    setAuditing(true);
    setAuditResult(null);

    const auditPrompt = `You are an NDIS compliance auditor. Audit the following Behaviour Support Plan for compliance with NDIS practice standards and the Behaviour Support and Restrictive Practices rules.

BSP Content:
${generatedPlan}

Return ONLY a JSON object with exactly this structure (no other text):
{
  "score": <number 0-100>,
  "issues": ["<issue 1>", "<issue 2>", "<issue 3>"]
}

Score 85-100 if fully compliant. 60-84 for minor issues. Below 60 for major gaps. List 3 specific compliance observations (can be positives or issues).`;

    try {
      const response = await AIService.executePrompt({
        prompt: auditPrompt,
        context: "",
        agentId: "clinical-copilot"
      });
      
      const text = response.content?.replace(/```json|```/g, "").trim() || "{}";
      const parsed = JSON.parse(text);
      setAuditResult({ score: parsed.score ?? 0, issues: parsed.issues ?? [] });
    } catch (err) {
      setAuditResult({ score: 0, issues: ["Could not complete audit. Check your connection."] });
    } finally {
      setAuditing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPlan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToFirestore = async () => {
    if (!generatedPlan || !clientName) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "behaviourSupportPlans"), {
        clientName,
        domain,
        antecedent,
        targetBehaviour: behaviour,
        consequence,
        planContent: generatedPlan,
        auditScore: auditResult?.score || null,
        practitionerId: auth.currentUser?.uid || "mock-practitioner",
        createdAt: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save BSP:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">BSP Creator & Compliance Auditor</h2>
        <p className="text-muted-foreground">Generate NDIS-compliant Behaviour Support Plans using AI and audit them for NDIS Commission standards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Plan Parameters</CardTitle>
            <CardDescription>Enter client details to generate a tailored BSP.</CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bsp-client">Client Name</Label>
                <Input id="bsp-client" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Charlie Davis" required />
              </div>
              <div className="space-y-2">
                <Label>Primary Support Domain</Label>
                <Select value={domain} onValueChange={setDomain} required>
                  <SelectTrigger><SelectValue placeholder="Select domain..." /></SelectTrigger>
                  <SelectContent>
                    {BSP_DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bsp-antecedent">Antecedent / Trigger</Label>
                <textarea id="bsp-antecedent" value={antecedent} onChange={e => setAntecedent(e.target.value)} placeholder="What typically precedes the behaviour?" className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 min-h-[60px] outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bsp-behaviour">Target Behaviour *</Label>
                <textarea id="bsp-behaviour" value={behaviour} onChange={e => setBehaviour(e.target.value)} placeholder="Describe the target behaviour in observable terms..." className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 min-h-[80px] outline-none focus:ring-1 focus:ring-primary" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bsp-consequence">Consequence</Label>
                <textarea id="bsp-consequence" value={consequence} onChange={e => setConsequence(e.target.value)} placeholder="What happens after the behaviour?" className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 min-h-[60px] outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "Generating BSP..." : "Generate BSP"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Generated BSP Output */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><FileEdit className="h-5 w-5 text-indigo-500" />Generated Plan</CardTitle>
                <CardDescription>AI-generated NDIS-compliant content. Review before submission.</CardDescription>
              </div>
              {generatedPlan && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAudit} disabled={auditing} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {auditing ? "Auditing..." : "Run Compliance Audit"}
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSaveToFirestore} disabled={saving || saved}>
                    {saved ? <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                    {saved ? "Saved" : "Save to Vault"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Audit Result */}
            {auditResult && (
              <div className={cn("mb-4 p-4 rounded-xl border space-y-3", auditResult.score >= 85 ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200" : auditResult.score >= 60 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200" : "bg-red-50 dark:bg-red-950/20 border-red-200")}>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    NDIS Compliance Audit Result
                  </h4>
                  <Badge className={cn("text-white text-sm px-3", auditResult.score >= 85 ? "bg-emerald-600" : auditResult.score >= 60 ? "bg-amber-500" : "bg-red-600")}>
                    {auditResult.score}/100
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {auditResult.issues.map((issue, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-current" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[80, 90, 70, 85, 60, 75].map((w, i) => (
                  <div key={i} className="h-3 bg-muted rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : generatedPlan ? (
              <div className="prose prose-sm dark:prose-invert max-w-none max-h-[520px] overflow-auto pr-2">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{generatedPlan}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                <FileEdit className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Your generated BSP will appear here.<br />Fill in the form and click Generate.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
