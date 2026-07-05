import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Calendar, Users } from "lucide-react";

interface LegoSession {
  id: string;
  clientName: string;
  engineer: string;
  builder: string;
  supplier: string;
  objective: string;
  milestones: string;
  date: string;
}

export function LegoPlay() {
  const [sessions, setSessions] = useState<LegoSession[]>([
    { id: "1", clientName: "Charlie Davis", engineer: "Charlie", builder: "Sam", supplier: "Emma (OT)", objective: "Build a Lego house cooperatively", milestones: "Shared pieces, took turns with instruction, self-regulated when piece was missing", date: "2026-07-02" }
  ]);

  const [clientName, setClientName] = useState("");
  const [engineer, setEngineer] = useState("");
  const [builder, setBuilder] = useState("");
  const [supplier, setSupplier] = useState("");
  const [objective, setObjective] = useState("");
  const [milestones, setMilestones] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !engineer || !builder || !supplier) return;

    const newSession: LegoSession = {
      id: Date.now().toString(),
      clientName,
      engineer,
      builder,
      supplier,
      objective,
      milestones,
      date: new Date().toISOString().split('T')[0]
    };

    setSessions([newSession, ...sessions]);
    setClientName("");
    setEngineer("");
    setBuilder("");
    setSupplier("");
    setObjective("");
    setMilestones("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">LEGO® Play Therapy</h2>
        <p className="text-muted-foreground">Track roles, objectives, and social milestones during collaborative LEGO building sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log LEGO Session</CardTitle>
            <CardDescription>Record roles and social milestones.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Charlie Davis" />
              </div>
              <div className="space-y-2">
                <Label>Role Assignments</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Engineer</Label>
                    <Input value={engineer} onChange={(e) => setEngineer(e.target.value)} placeholder="Name" required />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Builder</Label>
                    <Input value={builder} onChange={(e) => setBuilder(e.target.value)} placeholder="Name" required />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Supplier</Label>
                    <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Name" required />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Session Build Objective</Label>
                <Input id="objective" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="e.g. Build a small castle together" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestones">Social Milestones Achieved</Label>
                <Input id="milestones" value={milestones} onChange={(e) => setMilestones(e.target.value)} placeholder="e.g. Turn-taking, asking for pieces" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Log Session</Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>LEGO Session Logs</CardTitle>
            <CardDescription>Overview of past sessions and cooperative milestones.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Objective</TableHead>
                  <TableHead>Social Milestones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {s.date}</Badge></TableCell>
                    <TableCell className="font-semibold">{s.clientName}</TableCell>
                    <TableCell className="text-xs space-y-1">
                      <div>👷 **Eng:** {s.engineer}</div>
                      <div>🔨 **Bld:** {s.builder}</div>
                      <div>📦 **Spl:** {s.supplier}</div>
                    </TableCell>
                    <TableCell>{s.objective}</TableCell>
                    <TableCell className="text-xs text-slate-600 font-mono">{s.milestones}</TableCell>
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
