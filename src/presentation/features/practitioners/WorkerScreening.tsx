import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Progress } from "@/presentation/components/ui/progress";
import { ShieldCheck, AlertCircle, AlertTriangle, Upload, X, Sparkles } from "lucide-react";

interface ScreeningRecord {
  name: string;
  role: string;
  ndisCheck: "Valid" | "Expired" | "Pending";
  ndisExpiry: string;
  policeCheck: "Valid" | "Expired" | "Missing";
  wwcc: "Valid" | "Expired" | "Missing";
  supervisionHours: number;
  supervisionTarget: number;
  tier: "Core" | "Proficient" | "Advanced" | "Specialist";
}

const TIER_COLORS: Record<string, string> = {
  Core: "bg-slate-500",
  Proficient: "bg-blue-500",
  Advanced: "bg-purple-500",
  Specialist: "bg-amber-500",
};

export function WorkerScreening() {
  const [records, setRecords] = useState<ScreeningRecord[]>([
    { name: "Dr. Sarah Jenkins", role: "Behaviour Support Specialist", ndisCheck: "Valid", ndisExpiry: "2028-04-12", policeCheck: "Valid", wwcc: "Valid", supervisionHours: 42, supervisionTarget: 50, tier: "Specialist" },
    { name: "Michael Chang", role: "Behaviour Support Practitioner", ndisCheck: "Expired", ndisExpiry: "2026-06-01", policeCheck: "Valid", wwcc: "Valid", supervisionHours: 28, supervisionTarget: 40, tier: "Advanced" },
    { name: "Emma Wilson", role: "Support Worker", ndisCheck: "Valid", ndisExpiry: "2027-11-20", policeCheck: "Missing", wwcc: "Valid", supervisionHours: 12, supervisionTarget: 20, tier: "Core" },
    { name: "Rohan Patel", role: "Occupational Therapist", ndisCheck: "Valid", ndisExpiry: "2027-08-05", policeCheck: "Valid", wwcc: "Valid", supervisionHours: 35, supervisionTarget: 40, tier: "Proficient" },
  ]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState<{ name: string; field: string } | null>(null);

  // Gemini compliance summary
  const [aiSummary, setAiSummary] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const getStatusBadge = (status: "Valid" | "Expired" | "Pending" | "Missing") => {
    if (status === "Valid") return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 flex items-center w-fit gap-1 text-xs"><ShieldCheck className="h-3 w-3" />Valid</Badge>;
    if (status === "Pending") return <Badge variant="secondary" className="flex items-center w-fit gap-1 text-xs"><AlertTriangle className="h-3 w-3" />Pending</Badge>;
    return <Badge variant="destructive" className="flex items-center w-fit gap-1 text-xs"><AlertCircle className="h-3 w-3" />{status}</Badge>;
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUpload || !uploadFile) return;
    setRecords(prev => prev.map(r => {
      if (r.name !== showUpload.name) return r;
      const field = showUpload.field as keyof ScreeningRecord;
      return { ...r, [field]: "Valid" };
    }));
    setShowUpload(null);
    setUploadFile(null);
  };

  const issueCount = records.filter(r => r.ndisCheck !== "Valid" || r.policeCheck !== "Valid" || r.wwcc !== "Valid").length;

  const handleComplianceSummary = async () => {
    setAnalyzing(true);
    setAiSummary("");
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");

      const staffData = records.map(r => ({
        name: r.name,
        role: r.role,
        tier: r.tier,
        ndisCheck: r.ndisCheck,
        ndisExpiry: r.ndisExpiry,
        policeCheck: r.policeCheck,
        wwcc: r.wwcc,
        supervisionProgress: `${r.supervisionHours}/${r.supervisionTarget}`,
      }));

      const prompt = `You are an NDIS Worker Screening compliance officer reviewing the following team's compliance data:

${JSON.stringify(staffData, null, 2)}

Today's date: ${new Date().toLocaleDateString()}.

Provide:
1. **Overall Team Compliance Status**: A brief summary
2. **Critical Actions Required**: Any staff who cannot deliver services due to expired/missing checks
3. **Expiry Warnings**: Staff whose credentials expire within the next 90 days
4. **Supervision Gaps**: Staff significantly behind on supervision hour targets
5. **Tier Advancement Readiness**: Anyone close to meeting criteria for the next PBS tier

Return as structured bullet points with clear headers.`;

      const response = await generateGeminiContent({ prompt });
      const text = (response.data as any).text || "No summary generated.";
      setAiSummary(text);
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate compliance summary.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Worker Screening & Compliance</h2>
          <p className="text-muted-foreground">Monitor mandatory credentials, working checks, and supervision milestones.</p>
        </div>
        {issueCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">{issueCount} compliance issue{issueCount > 1 ? "s" : ""} require attention</span>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card border rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Upload Document</h3>
              <button onClick={() => setShowUpload(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground">Uploading <strong>{showUpload.field.replace(/([A-Z])/g, " $1")}</strong> for <strong>{showUpload.name}</strong>.</p>
            <form onSubmit={handleUpload} className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-2 cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">Click to select or drag & drop</p>
                <input type="file" accept=".pdf,.jpg,.png" className="hidden" id="upload-input" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                <label htmlFor="upload-input" className="text-xs text-primary font-semibold cursor-pointer underline">Browse files</label>
                {uploadFile && <p className="text-xs font-semibold text-foreground mt-1">{uploadFile.name}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={!uploadFile}>Confirm Upload & Verify</Button>
            </form>
          </div>
        </div>
      )}

      {/* Compliance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Document Matrix</CardTitle>
          <CardDescription>Critical NDIS verification checks required before service delivery.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>NDIS Worker Check</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Police Check</TableHead>
                  <TableHead>WWCC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-semibold">{r.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.role}</TableCell>
                    <TableCell>
                      <Badge className={`${TIER_COLORS[r.tier]} text-white text-[10px]`}>{r.tier}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(r.ndisCheck)}</TableCell>
                    <TableCell className={r.ndisCheck === "Expired" ? "text-red-600 font-bold text-xs" : "text-xs text-muted-foreground"}>{r.ndisExpiry}</TableCell>
                    <TableCell>{getStatusBadge(r.policeCheck)}</TableCell>
                    <TableCell>{getStatusBadge(r.wwcc)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setShowUpload({ name: r.name, field: "ndisCheck" })}>
                        <Upload className="h-3.5 w-3.5 mr-1" />Upload
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleComplianceSummary} disabled={analyzing} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Sparkles className="mr-2 h-4 w-4" />
            {analyzing ? "Analyzing..." : "AI Compliance Summary"}
          </Button>
        </CardFooter>
      </Card>

      {/* AI Compliance Summary */}
      {aiSummary && (
        <Card className="border-indigo-200 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Gemini Compliance Summary
            </CardTitle>
            <CardDescription>AI-powered team screening compliance assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {aiSummary}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supervision Hour Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Supervision Hour Tracker</CardTitle>
          <CardDescription>Track actual vs. required supervision hours per NDIS practitioner tier milestone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {records.map((r) => {
            const pct = Math.round((r.supervisionHours / r.supervisionTarget) * 100);
            return (
              <div key={r.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`${TIER_COLORS[r.tier]} text-white text-[10px]`}>{r.tier}</Badge>
                      <span className="text-xs text-muted-foreground">{r.supervisionHours}/{r.supervisionTarget} hours completed</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${pct >= 100 ? "text-emerald-500" : pct >= 70 ? "text-blue-500" : "text-amber-500"}`}>{pct}%</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
