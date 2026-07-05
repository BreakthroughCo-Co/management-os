import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Badge } from "@/presentation/components/ui/badge";
import { Progress } from "@/presentation/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { CheckCircle2, Circle, Sparkles, UserPlus, BookOpen, ShieldCheck, ClipboardList, Save } from "lucide-react";

interface InductionChecklist {
  id: string;
  label: string;
  category: "Orientation" | "Safety" | "Clinical" | "Compliance";
  completed: boolean;
  notes: string;
}

const DEFAULT_CHECKLIST: InductionChecklist[] = [
  { id: "org-overview", label: "Organisation overview, vision & values briefing", category: "Orientation", completed: false, notes: "" },
  { id: "policies", label: "Reviewed all workplace policies & Code of Conduct", category: "Orientation", completed: false, notes: "" },
  { id: "ndis-code", label: "NDIS Code of Conduct orientation completed", category: "Compliance", completed: false, notes: "" },
  { id: "privacy-act", label: "Privacy Act & confidentiality agreement signed", category: "Compliance", completed: false, notes: "" },
  { id: "incident-report", label: "Incident reporting procedures walkthrough", category: "Safety", completed: false, notes: "" },
  { id: "restrictive-aware", label: "Restrictive Practices awareness & de-escalation", category: "Clinical", completed: false, notes: "" },
  { id: "manual-handling", label: "Manual handling & WHS induction", category: "Safety", completed: false, notes: "" },
  { id: "fire-evac", label: "Fire & evacuation procedure walk-through", category: "Safety", completed: false, notes: "" },
  { id: "shadowing", label: "Minimum 2 supervised shadowing shifts completed", category: "Clinical", completed: false, notes: "" },
  { id: "first-aid", label: "Current First Aid & CPR certificate sighted", category: "Safety", completed: false, notes: "" },
  { id: "tech-systems", label: "Systems access granted (email, CRM, scheduling)", category: "Orientation", completed: false, notes: "" },
  { id: "wwcc-check", label: "WWCC & NDIS Worker Screening clearance sighted", category: "Compliance", completed: false, notes: "" },
];

export function StaffInduction() {
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [checklist, setChecklist] = useState<InductionChecklist[]>(DEFAULT_CHECKLIST);
  const [aiSummary, setAiSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = checklist.filter(i => i.completed).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  const filteredChecklist = filterCategory === "All"
    ? checklist
    : checklist.filter(i => i.category === filterCategory);

  const handleGenerateSummary = async () => {
    if (!staffName) return;
    setGenerating(true);
    setAiSummary("");
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");

      const completedItems = checklist.filter(i => i.completed).map(i => i.label);
      const outstandingItems = checklist.filter(i => !i.completed).map(i => `${i.label} (${i.category})`);

      const prompt = `You are an NDIS HR compliance officer. A new staff member named "${staffName}" (Role: ${staffRole || "Support Worker"}) started on ${startDate}. 
      
Their induction progress:
- Completed: ${completedItems.join(", ") || "None"}
- Outstanding: ${outstandingItems.join(", ") || "All complete"}

Generate a brief, professional induction status report (3-5 bullet points) that:
1. Summarises progress to date
2. Highlights any critical outstanding items that block unsupervised service delivery
3. Recommends a timeline to complete remaining items
4. Notes any compliance risks

Return the report as plain text with bullet points.`;

      const response = await generateGeminiContent({ prompt });
      const text = (response.data as any).text || "No summary generated.";
      setAiSummary(text);
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate AI summary. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const categoryColors: Record<string, string> = {
    Orientation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Safety: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Clinical: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    Compliance: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Staff Induction</h2>
        <p className="text-muted-foreground">Structured onboarding checklist for new practitioners aligned with NDIS Quality & Safeguarding requirements.</p>
      </div>

      {/* Staff Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> New Staff Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Staff Name</Label>
              <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="e.g. Jordan Lee" />
            </div>
            <div className="space-y-2">
              <Label>Role / Position</Label>
              <Input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} placeholder="e.g. Behaviour Support Practitioner" />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Induction Progress</CardTitle>
            <Badge className={progressPercent === 100 ? "bg-emerald-600" : "bg-indigo-600"}>
              {completedCount} / {checklist.length} Complete ({progressPercent}%)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-3" />

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">Filter:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Orientation">Orientation</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="Clinical">Clinical</SelectItem>
                <SelectItem value="Compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredChecklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  item.completed
                    ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800"
                    : "bg-background border-border hover:border-primary/40 hover:bg-accent/30"
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className={`flex-1 text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                  {item.label}
                </span>
                <Badge variant="outline" className={`text-[10px] ${categoryColors[item.category]}`}>
                  {item.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={handleGenerateSummary} disabled={generating || !staffName} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? "Generating..." : "AI Induction Report"}
          </Button>
          <Button disabled={!staffName}>
            <Save className="mr-2 h-4 w-4" /> Save Induction Record
          </Button>
        </CardFooter>
      </Card>

      {/* AI Summary */}
      {aiSummary && (
        <Card className="border-indigo-200 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Gemini Induction Status Report
            </CardTitle>
            <CardDescription>AI-generated compliance assessment for {staffName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {aiSummary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
