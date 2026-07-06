import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { workflowEngine } from "@/core/services/WorkflowEngine";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Badge } from "@/presentation/components/ui/badge";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Sparkles, Calendar, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const trendData = [
  { month: "Jan", aggression: 4, property: 2, selfInjury: 1, elopement: 0 },
  { month: "Feb", aggression: 6, property: 3, selfInjury: 2, elopement: 1 },
  { month: "Mar", aggression: 3, property: 1, selfInjury: 3, elopement: 2 },
  { month: "Apr", aggression: 7, property: 4, selfInjury: 2, elopement: 1 },
  { month: "May", aggression: 5, property: 2, selfInjury: 1, elopement: 3 },
  { month: "Jun", aggression: 4, property: 3, selfInjury: 2, elopement: 1 },
  { month: "Jul", aggression: 2, property: 1, selfInjury: 1, elopement: 0 },
];

interface Incident {
  id: string;
  clientName: string;
  date: string;
  description: string;
  severity: "Minor" | "Moderate" | "Major" | "Critical";
  restrictivePractices: string;
  aiAnalysis?: string;
}

export function IncidentAnalysis() {
  const [incidents, setIncidents] = useState<Incident[]>([
    { id: "1", clientName: "Charlie Davis", date: "2026-07-03", description: "Client became agitated during clean-up time, threw a plastic chair at the wall, and screamed. Handled by redirecting to quiet zone.", severity: "Moderate", restrictivePractices: "None", aiAnalysis: "Antecedent: Clean-up transition was unannounced. Root Cause: Sensory overload/difficulty with transitions. Action: Recommend adding a visual schedule and a 5-minute transition warning to BSP." }
  ]);

  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"Minor" | "Moderate" | "Major" | "Critical">("Minor");
  const [restrictive, setRestrictive] = useState("None");
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !description) return;

    const newIncident: Incident = {
      id: Date.now().toString(),
      clientName,
      date: new Date().toISOString().split('T')[0],
      description,
      severity,
      restrictivePractices: restrictive
    };

    setIncidents([newIncident, ...incidents]);
    workflowEngine.emit('incident:created', newIncident);
    setClientName("");
    setDescription("");
    setSeverity("Minor");
    setRestrictive("None");
  };

  const handleAIAnalysis = async (incident: Incident) => {
    setLoading(incident.id);

    const prompt = `Perform a clinical Root Cause Analysis (RCA) and behavior mitigation suggestion for the following incident:
Client: ${incident.clientName}
Incident: ${incident.description}
Severity: ${incident.severity}
Restrictive Practices used: ${incident.restrictivePractices}

Format your output as two short sections:
1. Identified Antecedents & Root Cause (Analyze the environment and transition factors).
2. BSP / Support Plan Modification (Specific strategies to prevent a recurrence).`;

    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const response = await generateGeminiContent({ prompt });

      setIncidents(prev => prev.map(inc => {
        if (inc.id === incident.id) {
          return { ...inc, aiAnalysis: (response.data as any).text || "Failed to analyze." };
        }
        return inc;
      }));
    } catch (err) {
      console.error(err);
      alert("AI analysis failed to execute.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incident Detection & Analysis</h2>
        <p className="text-muted-foreground">Log critical incidents and run AI-assisted root-cause analyses to feed back into support plans.</p>
      </div>

      {/* Incident Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Incident Trend Analysis</CardTitle>
          <CardDescription>Month-over-month incident counts by category across all clients.</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
              <Legend />
              <Line type="monotone" dataKey="aggression" stroke="#ef4444" strokeWidth={2} dot={false} name="Physical Aggression" />
              <Line type="monotone" dataKey="property" stroke="#f97316" strokeWidth={2} dot={false} name="Property Damage" />
              <Line type="monotone" dataKey="selfInjury" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Self-Injury" />
              <Line type="monotone" dataKey="elopement" stroke="#3b82f6" strokeWidth={2} dot={false} name="Elopement" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log Critical Incident</CardTitle>
            <CardDescription>Enter details immediately following an event.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Charlie Davis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Event Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="What happened? Include antecedent clues if known."
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(val: any) => setSeverity(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minor">Minor (No injuries, minimal property damage)</SelectItem>
                    <SelectItem value="Moderate">Moderate (Minor injury, disruption)</SelectItem>
                    <SelectItem value="Major">Major (Medical attention, severe behavior)</SelectItem>
                    <SelectItem value="Critical">Critical (Restrictive practices, emergency services)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="restrictive">Restrictive Practices Used?</Label>
                <Input id="restrictive" value={restrictive} onChange={(e) => setRestrictive(e.target.value)} placeholder="e.g. Physical Restraint, or None" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Submit Report</Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Logged Incident Reports</CardTitle>
            <CardDescription>View, analyze, and update behaviour management protocols.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-4 border rounded-lg bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{inc.clientName}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Calendar className="h-3.5 w-3.5" /> {inc.date}</p>
                  </div>
                  <Badge variant={inc.severity === "Critical" ? "destructive" : inc.severity === "Major" ? "secondary" : "outline"}>
                    {inc.severity}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-700 leading-relaxed">{inc.description}</p>
                
                <div className="text-xs text-slate-500 bg-white p-2 border rounded">
                  <strong>Restrictive Practices:</strong> {inc.restrictivePractices}
                </div>

                {inc.aiAnalysis ? (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-indigo-500" /> Root Cause AI Analysis</h4>
                    <p className="text-xs text-indigo-950 font-serif leading-relaxed whitespace-pre-wrap">{inc.aiAnalysis}</p>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => handleAIAnalysis(inc)}
                    disabled={loading === inc.id}
                  >
                    <Sparkles className="mr-2 h-3.5 w-3.5" /> {loading === inc.id ? "Analyzing..." : "Analyze Incident"}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
