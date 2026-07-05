import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Button } from "@/presentation/components/ui/button";
import { Activity, ShieldAlert, FileSearch, RefreshCw } from "lucide-react";

export function AgentManagement() {
  const agents = [
    { name: "RiskSentinel", role: "Real-time client risk analyzer", status: "Active", logs: "Scanning incident logs...", type: "Safety" },
    { name: "ComplianceAuditBot", role: "NDIS Plan utilization auditor", status: "Active", logs: "Audit of SA-2026-403 complete.", type: "Audit" },
    { name: "ClinicalScheduler", role: "AI caseload scheduling optimizer", status: "Idle", logs: "Waiting for calendar mutations...", type: "Operations" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Management</h2>
          <p className="text-muted-foreground">Monitor and manage background autonomous clinical and compliance agents.</p>
        </div>
        <Button size="sm" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin-slow" /> Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 / 3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Risk Flags Raised
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-blue-500" /> Compliance Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Autonomous Agent Registry</CardTitle>
          <CardDescription>Status and latest execution logs of background AI subagents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Focus Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latest Log Message</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.name}>
                  <TableCell className="font-semibold">{agent.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.type}</Badge>
                  </TableCell>
                  <TableCell>{agent.role}</TableCell>
                  <TableCell>
                    <Badge variant={agent.status === "Active" ? "default" : "secondary"}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{agent.logs}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Configure</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
