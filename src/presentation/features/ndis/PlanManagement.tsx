import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Progress } from "@/presentation/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { AlertCircle, FileText, Download, TrendingUp, AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientPlan {
  id: string;
  client: string;
  agreementId: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  spent: number;
  status: "Active" | "Expiring" | "Expired";
}

const PLANS: ClientPlan[] = [
  { id: "1", client: "Alice Johnson", agreementId: "SA-2026-401", startDate: "2025-10-01", endDate: "2026-10-01", totalBudget: 48000, spent: 38400, status: "Active" },
  { id: "2", client: "Bob Smith", agreementId: "SA-2026-402", startDate: "2026-01-15", endDate: "2026-07-15", totalBudget: 32000, spent: 30720, status: "Expiring" },
  { id: "3", client: "Charlie Davis", agreementId: "SA-2026-403", startDate: "2025-11-01", endDate: "2026-11-01", totalBudget: 60000, spent: 42000, status: "Active" },
  { id: "4", client: "Diana Nguyen", agreementId: "SA-2026-404", startDate: "2026-03-01", endDate: "2027-03-01", totalBudget: 24000, spent: 5000, status: "Active" },
  { id: "5", client: "Edward Park", agreementId: "SA-2026-405", startDate: "2025-07-01", endDate: "2026-07-01", totalBudget: 55000, spent: 54000, status: "Expiring" },
];

function BudgetAlert({ plan }: { plan: ClientPlan }) {
  const pct = (plan.spent / plan.totalBudget) * 100;
  if (pct < 80) return null;
  return (
    <div className={cn("flex items-start gap-2 p-3 rounded-lg text-xs border", pct >= 95 ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300")}>
      {pct >= 95 ? <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
      <div>
        <p className="font-bold">{plan.client} — {Math.round(pct)}% utilised</p>
        <p className="mt-0.5">{pct >= 95 ? `Only $${(plan.totalBudget - plan.spent).toLocaleString()} remaining. Urgent review needed.` : `Approaching budget limit. Coordinate with participant re: plan review.`}</p>
      </div>
    </div>
  );
}

export function PlanManagement() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const totalFunds = PLANS.reduce((a, p) => a + p.totalBudget, 0);
  const avgUtil = Math.round(PLANS.reduce((a, p) => a + (p.spent / p.totalBudget * 100), 0) / PLANS.length);
  const expiring = PLANS.filter(p => p.status === "Expiring").length;
  const alerts = PLANS.filter(p => (p.spent / p.totalBudget) >= 0.80 && !dismissed.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">NDIS Plan Management</h2>
          <p className="text-muted-foreground">Track plan utilisation, budgets, and compliance across your organisation.</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" /> Generate Batch Invoice
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Total Managed Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Average Utilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtil}%</div>
            <Progress value={avgUtil} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className={cn("border-orange-200 dark:border-orange-800", expiring > 0 ? "bg-orange-50 dark:bg-orange-950/20" : "")}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-medium flex items-center gap-2", expiring > 0 ? "text-orange-800 dark:text-orange-300" : "text-muted-foreground")}>
              <AlertCircle className="h-4 w-4" />Plans Expiring (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", expiring > 0 ? "text-orange-900 dark:text-orange-300" : "")}>{expiring}</div>
            <p className={cn("text-xs mt-1", expiring > 0 ? "text-orange-700 dark:text-orange-400" : "text-muted-foreground")}>Action required for rollover</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Threshold Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Bell className="h-4 w-4" /> Budget Threshold Alerts
            </CardTitle>
            <CardDescription>Clients approaching or exceeding their plan budget limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map(plan => <BudgetAlert key={plan.id} plan={plan} />)}
          </CardContent>
        </Card>
      )}

      {/* Plan Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Service Agreements</CardTitle>
          <CardDescription>Live budget utilisation across all managed NDIS plans.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Agreement ID</TableHead>
                  <TableHead>Plan Period</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLANS.map((plan) => {
                  const pct = Math.round((plan.spent / plan.totalBudget) * 100);
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.client}</TableCell>
                      <TableCell className="text-xs font-mono">{plan.agreementId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{plan.startDate} → {plan.endDate}</TableCell>
                      <TableCell className="text-sm">${plan.totalBudget.toLocaleString()}</TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">${plan.spent.toLocaleString()}</span>
                            <span className={cn("font-semibold", pct >= 95 ? "text-red-500" : pct >= 80 ? "text-amber-500" : "text-emerald-500")}>{pct}%</span>
                          </div>
                          <Progress value={pct} className={cn("h-1.5", pct >= 95 ? "[&>div]:bg-red-500" : pct >= 80 ? "[&>div]:bg-amber-500" : "")} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.status === "Expiring" ? "destructive" : plan.status === "Expired" ? "secondary" : "default"}>
                          {plan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
