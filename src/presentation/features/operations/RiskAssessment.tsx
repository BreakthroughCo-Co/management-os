import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Badge } from "@/presentation/components/ui/badge";
import { useIncidentsQuery } from "@/data/repositories/IncidentRepository";

interface RiskItem {
  id: string;
  name: string;
  likelihood: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain";
  consequence: "Insignificant" | "Minor" | "Moderate" | "Major" | "Catastrophic";
  score: "Low" | "Medium" | "High" | "Extreme";
  mitigation: string;
  mappedIncidentId?: string;
}

export function RiskAssessment() {
  const { data: incidents = [] } = useIncidentsQuery();
  const [risks, setRisks] = useState<RiskItem[]>([
    { id: "1", name: "Choking during meals (dysphagia)", likelihood: "Possible", consequence: "Major", score: "High", mitigation: "Speech pathologist review, texture modified food, staff trained in choking first aid." }
  ]);

  const [name, setName] = useState("");
  const [likelihood, setLikelihood] = useState<RiskItem["likelihood"]>("Possible");
  const [consequence, setConsequence] = useState<RiskItem["consequence"]>("Moderate");
  const [mitigation, setMitigation] = useState("");
  const [mappedIncidentId, setMappedIncidentId] = useState<string>("none");

  // standard risk scoring logic
  const getRiskScore = (like: RiskItem["likelihood"], cons: RiskItem["consequence"]): RiskItem["score"] => {
    if (cons === "Catastrophic" || (cons === "Major" && like !== "Rare")) return "Extreme";
    if (cons === "Major" || (cons === "Moderate" && (like === "Likely" || like === "Almost Certain"))) return "High";
    if (cons === "Insignificant") return "Low";
    return "Medium";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const score = getRiskScore(likelihood, consequence);
    const newRisk: RiskItem = {
      id: Date.now().toString(),
      name,
      likelihood,
      consequence,
      score,
      mitigation,
      mappedIncidentId: mappedIncidentId === "none" ? undefined : mappedIncidentId
    };

    setRisks([newRisk, ...risks]);
    setName("");
    setMitigation("");
    setMappedIncidentId("none");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Risk Assessment Matrix</h2>
        <p className="text-muted-foreground">Identify hazards, score risk levels dynamically, and draft environmental mitigation procedures.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Assess Risk Hazard</CardTitle>
            <CardDescription>Determine risk score using standard matrix.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hazard Description</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Slips in bathroom during transfer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Likelihood</Label>
                  <Select value={likelihood} onValueChange={(val: any) => setLikelihood(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rare">Rare</SelectItem>
                      <SelectItem value="Unlikely">Unlikely</SelectItem>
                      <SelectItem value="Possible">Possible</SelectItem>
                      <SelectItem value="Likely">Likely</SelectItem>
                      <SelectItem value="Almost Certain">Almost Certain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Consequence</Label>
                  <Select value={consequence} onValueChange={(val: any) => setConsequence(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Insignificant">Insignificant</SelectItem>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Catastrophic">Catastrophic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Map to Incident</Label>
                <Select value={mappedIncidentId} onValueChange={setMappedIncidentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Incident" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Incident</SelectItem>
                    {incidents.map(inc => (
                      <SelectItem key={inc.id} value={inc.id}>{inc.title} ({inc.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mitigation">Mitigation Strategy</Label>
                <textarea
                  id="mitigation"
                  value={mitigation}
                  onChange={(e) => setMitigation(e.target.value)}
                  placeholder="How will this risk be reduced?"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Log Risk Profile</Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hazard Registry</CardTitle>
            <CardDescription>Track all flagged hazards and their controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hazard</TableHead>
                  <TableHead>Matrix Scores</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Mitigation Control</TableHead>
                  <TableHead>Mapped Incident</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>L: {r.likelihood}</div>
                      <div>C: {r.consequence}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.score === "Extreme" ? "destructive" : r.score === "High" ? "secondary" : "outline"}>
                        {r.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed max-w-[200px]">{r.mitigation}</TableCell>
                    <TableCell className="text-xs">
                      {r.mappedIncidentId ? (
                        <Badge variant="outline">{r.mappedIncidentId}</Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
