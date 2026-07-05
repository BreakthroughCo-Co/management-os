import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { addDoc, collection } from "firebase/firestore";
import app, { db, auth } from "@/lib/firebase";
import { Button } from "@/presentation/components/ui/button";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Input } from "@/presentation/components/ui/input";
import { Badge } from "@/presentation/components/ui/badge";
import { Sparkles, Save, RotateCcw, UserCheck } from "lucide-react";

interface Competency {
  name: string;
  category: "Clinical" | "Compliance" | "Reporting";
  score: number;
}

export function CapabilityAssessment() {
  const [practitionerName, setPractitionerName] = useState("");
  const [competencies, setCompetencies] = useState<Competency[]>([
    { name: "Functional Behavior Assessment (FBA)", category: "Clinical", score: 4 },
    { name: "BSP Drafting & Submission", category: "Compliance", score: 3 },
    { name: "De-escalation & Restrictive Practices", category: "Clinical", score: 5 },
    { name: "NDIS Restrictive Practice Rules", category: "Compliance", score: 2 },
    { name: "Case Notes & Log Compliance", category: "Reporting", score: 4 },
    { name: "Risk Assessment & Safety Planning", category: "Clinical", score: 3 },
    { name: "Client Engagement & Rapport Building", category: "Clinical", score: 4 },
    { name: "Data Collection & ABC Charting", category: "Reporting", score: 3 },
  ]);
  const [saving, setSaving] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleScoreChange = (idx: number, score: number) => {
    const updated = [...competencies];
    updated[idx].score = score;
    setCompetencies(updated);
  };

  const handleReset = () => {
    setCompetencies(prev => prev.map(c => ({ ...c, score: 3 })));
    setPractitionerName("");
    setAiRecommendation("");
  };

  const avgScore = competencies.reduce((acc, c) => acc + c.score, 0) / competencies.length;

  const handleSave = async () => {
    if (!practitionerName) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "capabilityAudits"), {
        practitionerName,
        competencies,
        avgScore,
        auditorId: auth.currentUser?.uid || "mock-auditor",
        auditorEmail: auth.currentUser?.email || "auditor@example.com",
        date: new Date().toISOString(),
      });
      setPractitionerName("");
      setAiRecommendation("");
    } catch (err) {
      console.error("Failed to save audit:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateRecommendation = async () => {
    if (!practitionerName) return;
    setGenerating(true);
    setAiRecommendation("");
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");

      const scoreDetails = competencies.map(c => `${c.name} (${c.category}): ${c.score}/5`).join("\n");

      const prompt = `You are an NDIS clinical supervisor conducting a capability audit for a behaviour support practitioner.

Practitioner: ${practitionerName}
Average Competency Score: ${avgScore.toFixed(1)}/5.0

Individual Competency Scores:
${scoreDetails}

Based on these scores, provide:
1. **Strengths**: Top 2-3 areas where the practitioner excels
2. **Development Areas**: Areas scoring below 3 that need targeted support
3. **Recommended Training Plan**: Specific courses, mentoring activities, or supervision topics to address gaps
4. **NDIS Tier Recommendation**: Based on NDIS PBS Capability Framework, recommend whether this practitioner should operate at Core, Proficient, Advanced, or Specialist tier
5. **Supervision Frequency**: Recommended supervision frequency based on competency level

Return as structured bullet points with headers.`;

      const response = await generateGeminiContent({ prompt });
      const text = (response.data as any).text || "No recommendation generated.";
      setAiRecommendation(text);
    } catch (err) {
      console.error(err);
      setAiRecommendation("Failed to generate recommendation.");
    } finally {
      setGenerating(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 4) return "text-emerald-600";
    if (score >= 3) return "text-blue-600";
    if (score >= 2) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Capability Assessment</h2>
        <p className="text-muted-foreground">Audit practitioner competencies against NDIS clinical and compliance benchmarks.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Clinical Audit Checklist</CardTitle>
            <CardDescription>Assess skills from Level 1 (Beginner) to Level 5 (Subject Matter Expert).</CardDescription>
          </div>
          <Badge className={`text-md px-3 py-1 ${avgScore >= 4 ? "bg-emerald-600" : avgScore >= 3 ? "bg-indigo-600" : "bg-amber-600"}`}>
            Avg Index: {avgScore.toFixed(1)} / 5.0
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="practitioner">Practitioner to Audit</Label>
            <Input 
              id="practitioner" 
              value={practitionerName} 
              onChange={(e) => setPractitionerName(e.target.value)} 
              placeholder="e.g. Michael Chang" 
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competency Area</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[180px]">Score / Proficiency</TableHead>
                <TableHead className="w-[80px] text-center">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.map((comp, idx) => (
                <TableRow key={comp.name}>
                  <TableCell className="font-semibold">{comp.name}</TableCell>
                  <TableCell><Badge variant="outline">{comp.category}</Badge></TableCell>
                  <TableCell>
                    <Select 
                      value={comp.score.toString()} 
                      onValueChange={(val) => handleScoreChange(idx, parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Needs Development</SelectItem>
                        <SelectItem value="2">2 - Supervised Practice</SelectItem>
                        <SelectItem value="3">3 - Independent Practice</SelectItem>
                        <SelectItem value="4">4 - Advanced Competency</SelectItem>
                        <SelectItem value="5">5 - Lead/Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className={`text-center font-bold text-lg ${scoreColor(comp.score)}`}>
                    {comp.score}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Grid
            </Button>
            <Button variant="outline" onClick={handleGenerateRecommendation} disabled={generating || !practitionerName} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Generating..." : "AI Development Plan"}
            </Button>
          </div>
          <Button onClick={handleSave} disabled={!practitionerName || saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Audit Report"}
          </Button>
        </CardFooter>
      </Card>

      {/* AI Recommendation */}
      {aiRecommendation && (
        <Card className="border-indigo-200 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Gemini Development Plan for {practitionerName}
            </CardTitle>
            <CardDescription>AI-generated professional development recommendation aligned to the NDIS PBS Capability Framework</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {aiRecommendation}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
