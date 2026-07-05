import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Progress } from "@/presentation/components/ui/progress";
import { Button } from "@/presentation/components/ui/button";
import { CheckCircle2, XCircle, Sparkles, Plus, BookOpen } from "lucide-react";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";

interface TrainingRecord {
  courseName: string;
  category: "Compliance" | "Clinical" | "Safety";
  totalCompleted: number;
  totalRequired: number;
}

export function StaffTraining() {
  const [courses, setCourses] = useState<TrainingRecord[]>([
    { courseName: "NDIS Quality, Safeguards & Code of Conduct", category: "Compliance", totalCompleted: 3, totalRequired: 3 },
    { courseName: "Positive Behavior Support & Restrictive Practices", category: "Clinical", totalCompleted: 2, totalRequired: 3 },
    { courseName: "Infection Control & PPE Safety", category: "Safety", totalCompleted: 3, totalRequired: 3 },
    { courseName: "Cardiopulmonary Resuscitation (CPR) & First Aid", category: "Safety", totalCompleted: 1, totalRequired: 3 },
    { courseName: "Trauma-Informed Care Principles", category: "Clinical", totalCompleted: 2, totalRequired: 3 },
    { courseName: "Incident Reporting & WHS Procedures", category: "Safety", totalCompleted: 3, totalRequired: 3 },
    { courseName: "Manual Handling & Mobility Assistance", category: "Safety", totalCompleted: 2, totalRequired: 3 },
    { courseName: "Cultural Safety & Disability Awareness", category: "Compliance", totalCompleted: 1, totalRequired: 3 },
  ]);

  const [aiGapAnalysis, setAiGapAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Add new course form
  const [showAdd, setShowAdd] = useState(false);
  const [newCourse, setNewCourse] = useState("");
  const [newCategory, setNewCategory] = useState<"Compliance" | "Clinical" | "Safety">("Compliance");
  const [newRequired, setNewRequired] = useState("3");

  const handleAddCourse = () => {
    if (!newCourse) return;
    setCourses([...courses, {
      courseName: newCourse,
      category: newCategory,
      totalCompleted: 0,
      totalRequired: parseInt(newRequired) || 3,
    }]);
    setNewCourse("");
    setShowAdd(false);
  };

  const handleGapAnalysis = async () => {
    setAnalyzing(true);
    setAiGapAnalysis("");
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");

      const compliant = courses.filter(c => c.totalCompleted >= c.totalRequired).map(c => c.courseName);
      const gaps = courses.filter(c => c.totalCompleted < c.totalRequired).map(c => `${c.courseName} (${c.totalCompleted}/${c.totalRequired} staff, Category: ${c.category})`);

      const prompt = `You are an NDIS Quality & Compliance Training Manager. Analyse the following training compliance data and provide actionable recommendations.

Fully Compliant Courses:
${compliant.join("\n") || "None"}

Courses with Gaps:
${gaps.join("\n") || "All complete"}

Provide:
1. A risk assessment of the training gaps (which are high priority for NDIS audits?)
2. A recommended priority order for addressing the gaps
3. Estimated time and resources needed
4. Any regulatory deadlines or audit implications

Return as structured bullet points.`;

      const response = await generateGeminiContent({ prompt });
      const text = (response.data as any).text || "No analysis generated.";
      setAiGapAnalysis(text);
    } catch (err) {
      console.error(err);
      setAiGapAnalysis("Failed to generate gap analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const compliantCount = courses.filter(c => c.totalCompleted >= c.totalRequired).length;
  const overallPercent = Math.round((compliantCount / courses.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Induction & Training</h2>
          <p className="text-muted-foreground">Monitor mandatory clinical courses and code-of-conduct orientation compliance across all teams.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Course
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Total Courses</p>
          <p className="text-2xl font-bold">{courses.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Fully Compliant</p>
          <p className="text-2xl font-bold text-emerald-600">{compliantCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Gaps Identified</p>
          <p className="text-2xl font-bold text-red-600">{courses.length - compliantCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium">Overall Compliance</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{overallPercent}%</p>
            <Progress value={overallPercent} className="h-2 flex-1" />
          </div>
        </Card>
      </div>

      {/* Add Course Form */}
      {showAdd && (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Course Name</Label>
                <Input value={newCourse} onChange={(e) => setNewCourse(e.target.value)} placeholder="e.g. Medication Administration" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as typeof newCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Clinical">Clinical</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddCourse} disabled={!newCourse}>Add Course</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Mandatory NDIS Training Dashboard</CardTitle>
          <CardDescription>Real-time completion percentage of registered practitioners.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training Course</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Completion Ratio</TableHead>
                <TableHead className="w-[200px]">Progress</TableHead>
                <TableHead className="text-right">Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => {
                const percent = (c.totalCompleted / c.totalRequired) * 100;
                return (
                  <TableRow key={c.courseName}>
                    <TableCell className="font-semibold">{c.courseName}</TableCell>
                    <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{c.totalCompleted} / {c.totalRequired} staff</TableCell>
                    <TableCell><Progress value={percent} className="h-2" /></TableCell>
                    <TableCell className="text-right flex justify-end">
                      {percent === 100 ? (
                        <Badge className="bg-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Compliant</Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Action Required</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleGapAnalysis} disabled={analyzing} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Sparkles className="mr-2 h-4 w-4" />
            {analyzing ? "Analyzing..." : "AI Training Gap Analysis"}
          </Button>
        </CardFooter>
      </Card>

      {/* AI Gap Analysis */}
      {aiGapAnalysis && (
        <Card className="border-indigo-200 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Gemini Training Gap Analysis
            </CardTitle>
            <CardDescription>AI-powered compliance risk assessment and remediation plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {aiGapAnalysis}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
