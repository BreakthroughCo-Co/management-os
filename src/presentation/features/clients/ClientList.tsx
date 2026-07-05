import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, Search, MoreHorizontal, AlertTriangle, Flag, TrendingUp } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Progress } from "@/presentation/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/presentation/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useClientsInfiniteQuery, useCreateClientMutation } from "@/data/repositories/ClientRepository";
import { Client } from "@/core/models/Client";

const RISK_COLORS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400",
  Critical: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400",
};

const FLAG_LABELS: Record<string, { label: string; color: string }> = {
  "budget-warning": { label: "Budget Warning", color: "border-amber-400 text-amber-600 dark:text-amber-400" },
  "upcoming-review": { label: "Plan Review Due", color: "border-blue-400 text-blue-600 dark:text-blue-400" },
  "incident-logged": { label: "Incident Logged", color: "border-red-400 text-red-600 dark:text-red-400" },
  "critical-risk": { label: "Critical Risk", color: "border-red-600 text-red-700 dark:text-red-500" },
};

export function ClientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useClientsInfiniteQuery(20);
  
  const clients = data ? data.pages.flatMap(page => page.clients) : [];

  const filtered = clients.filter(c => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const matchSearch = fullName.includes(searchTerm.toLowerCase()) || c.ndisNumber.includes(searchTerm);
    const matchRisk = riskFilter === "all" || c.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Approximate row height
    overscan: 5,
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  const flagClient = (id: string, flag: string) => {
    // In a real app, this would be a mutation hook
    console.log(`Toggled flag ${flag} for client ${id}`);
  };

  const criticalCount = clients.filter(c => c.risk === "Critical" || c.risk === "High").length;
  const budgetAlerts = clients.filter(c => c.flags.includes("budget-warning")).length;
  
  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading clients database...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading clients.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage your participant roster, intake status, risk flags, and funding.</p>
        </div>
        <Button asChild>
          <Link to="/clients/intake"><Plus className="mr-2 h-4 w-4" />New Client</Link>
        </Button>
      </div>

      {/* Risk Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: clients.length, color: "text-foreground" },
          { label: "Active Plans", value: clients.filter(c => c.status === "Active").length, color: "text-emerald-500" },
          { label: "High/Critical Risk", value: criticalCount, color: criticalCount > 0 ? "text-red-500" : "text-foreground" },
          { label: "Budget Alerts", value: budgetAlerts, color: budgetAlerts > 0 ? "text-amber-500" : "text-foreground" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-5">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <CardTitle>Client Roster</CardTitle>
            <div className="ml-auto flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search clients..." className="pl-8 w-52" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="text-sm border border-border rounded-lg px-3 py-2 bg-card outline-none"
              >
                <option value="all">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={parentRef} className="overflow-x-auto h-[500px]" onScroll={handleScroll}>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>NDIS Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Funding Utilisation</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Next Review</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const client = filtered[virtualRow.index];
                  const utilPct = client.funding.totalBudget > 0 ? Math.round((client.funding.utilized / client.funding.totalBudget) * 100) : 0;
                  return (
                    <TableRow 
                      key={client.id} 
                      className={client.risk === "Critical" ? "bg-red-50/50 dark:bg-red-950/10 absolute w-full" : "absolute w-full"}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold">{client.firstName} {client.lastName}</p>
                          <p className="text-xs text-muted-foreground">{client.practitioner}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{client.ndisNumber}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", RISK_COLORS[client.risk])}>
                          {(client.risk === "High" || client.risk === "Critical") && <AlertTriangle className="h-3 w-3" />}
                          {client.risk}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[130px]">
                        {client.funding.totalBudget > 0 ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{utilPct}%</span>
                              <span className="text-muted-foreground">\${(client.funding.remaining).toLocaleString()} left</span>
                            </div>
                            <Progress
                              value={utilPct}
                              className={cn("h-1.5", utilPct >= 95 ? "[&>div]:bg-red-500" : utilPct >= 80 ? "[&>div]:bg-amber-500" : "")}
                            />
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {client.flags.map(flag => (
                            <span key={flag} className={cn("border rounded-full px-2 py-0.5 text-[10px] font-semibold", FLAG_LABELS[flag]?.color)}>
                              {FLAG_LABELS[flag]?.label}
                            </span>
                          ))}
                          {client.flags.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className={cn("text-sm", client.nextReview !== "N/A" && new Date(client.nextReview) <= new Date(Date.now() + 7 * 86400000) ? "text-red-500 font-semibold" : "")}>
                        {client.nextReview}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Update Plan</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => flagClient(client.id, "incident-logged")} className="text-amber-600">
                              <Flag className="mr-2 h-3.5 w-3.5" />Toggle Incident Flag
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => flagClient(client.id, "budget-warning")} className="text-amber-600">
                              <TrendingUp className="mr-2 h-3.5 w-3.5" />Toggle Budget Flag
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Archive Client</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {isFetchingNextPage && <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading more clients...</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
