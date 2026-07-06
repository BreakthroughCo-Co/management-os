import { useState } from "react";
import { AIService } from "@/core/services/AIService";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { useClaimsQuery } from "@/data/repositories/ClaimRepository";
import { AlertTriangle, Bot, Loader2 } from "lucide-react";

interface Anomaly {
  claimId: string;
  issue: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
}

export function BillingAnomalies() {
  const { data: claims = [], isLoading: isLoadingClaims } = useClaimsQuery();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (claims.length === 0) return;
    setIsAnalyzing(true);
    setError("");

    try {
      const prompt = `Analyze the following billing claims for anomalies, such as mismatched rates, overlapping service dates, or unusual hours. 
Return ONLY a JSON array of objects with this exact structure: 
[{ "claimId": "string", "issue": "string", "severity": "High" | "Medium" | "Low", "recommendation": "string" }]
If no anomalies are found, return an empty array [].

Claims Data:
${JSON.stringify(claims, null, 2)}`;

      const response = await AIService.executePrompt({
        prompt,
        context: "",
        agentId: "finance-assistant"
      });
      
      const text = response.content?.replace(/```json|```/g, "").trim() || "[]";
      const parsed = JSON.parse(text);
      setAnomalies(parsed);
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      setError("Failed to run anomaly detection. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing Anomaly Detection</h2>
          <p className="text-muted-foreground">Use AI to automatically flag suspicious NDIS claims before dispatch.</p>
        </div>
        <Button onClick={handleAnalyze} disabled={isAnalyzing || isLoadingClaims || claims.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {isAnalyzing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Bot className="mr-2 h-4 w-4" />}
          Run AI Audit
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detected Anomalies</CardTitle>
          <CardDescription>Review flagged claims and apply recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          {anomalies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anom, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{anom.claimId}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        anom.severity === 'High' ? 'bg-red-100 text-red-800' :
                        anom.severity === 'Medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {anom.severity}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{anom.issue}</TableCell>
                    <TableCell className="text-sm italic text-muted-foreground">{anom.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
              <p>Analyzing {claims.length} claims for compliance issues...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50">
              <AlertTriangle className="h-8 w-8 text-slate-400 mb-4" />
              <p>No anomalies detected or audit hasn't been run yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
