import { useState } from "react";
import { useIncidentsQuery, useResolveIncidentMutation, Incident } from "@/data/repositories/IncidentRepository";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { AIService } from "@/core/services/AIService";

export function Incidents() {
  const { data: incidents = [], isLoading, error } = useIncidentsQuery();
  const resolveMutation = useResolveIncidentMutation();
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<Record<string, string>>({});

  const handleScan = async (incident: Incident) => {
    setScanningId(incident.id);
    const prompt = `Perform an NDIS compliance audit scan on this incident:
Title: ${incident.title}
Type: ${incident.type}
Severity: ${incident.severity}
Status: ${incident.status}
Date Logged: ${incident.dateLogged}`;

    try {
      const res = await AIService.executePrompt({
        prompt,
        context: "",
        agentId: "compliance-bot",
      });
      setScanResults(prev => ({ ...prev, [incident.id]: res.content }));
    } catch (err) {
      setScanResults(prev => ({ ...prev, [incident.id]: "Error: Failed to perform AI compliance scan." }));
    } finally {
      setScanningId(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading incidents...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading incidents.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compliance & Incidents</h2>
        <p className="text-muted-foreground">Manage and track incidents.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.map(incident => (
              <div key={incident.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{incident.title}</h3>
                    <p className="text-sm text-muted-foreground">Type: {incident.type} | Date: {incident.dateLogged}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={incident.severity === "Critical" ? "destructive" : "default"}>{incident.severity}</Badge>
                    <Badge variant="outline">{incident.status}</Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleScan(incident)} 
                      disabled={scanningId === incident.id}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
                    >
                      {scanningId === incident.id ? "Scanning..." : "AI Compliance Scan"}
                    </Button>
                    {incident.status !== "Resolved" && (
                      <Button variant="outline" size="sm" onClick={() => resolveMutation.mutate(incident.id)} disabled={resolveMutation.isPending}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
                {scanResults[incident.id] && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border rounded text-xs space-y-2 relative">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>AI Compliance Scan Report</span>
                      <button 
                        onClick={() => {
                          const copy = { ...scanResults };
                          delete copy[incident.id];
                          setScanResults(copy);
                        }}
                        className="text-muted-foreground hover:text-foreground text-sm font-bold"
                      >
                        &times;
                      </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{scanResults[incident.id]}</p>
                  </div>
                )}
              </div>
            ))}
            {incidents.length === 0 && <p className="text-sm text-muted-foreground">No incidents found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
