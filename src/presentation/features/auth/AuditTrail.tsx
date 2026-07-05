import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Shield, Search, Download, Filter, User, FileText, Settings, LogIn, AlertTriangle } from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: "success" | "warning" | "blocked";
}

const MOCK_AUDIT_LOG: AuditEntry[] = [
  { id: "a1", timestamp: "2026-07-05 02:30:14", user: "admin@breakthroughconsult.com.au", role: "Admin", action: "LOGIN", resource: "Authentication", ipAddress: "203.12.48.91", status: "success" },
  { id: "a2", timestamp: "2026-07-05 02:31:02", user: "admin@breakthroughconsult.com.au", role: "Admin", action: "VIEW", resource: "Client Record — Charlie Davis", ipAddress: "203.12.48.91", status: "success" },
  { id: "a3", timestamp: "2026-07-05 02:31:45", user: "admin@breakthroughconsult.com.au", role: "Admin", action: "GENERATE_INVOICE", resource: "Billing Ledger — INV-2026-004", ipAddress: "203.12.48.91", status: "success" },
  { id: "a4", timestamp: "2026-07-05 01:58:20", user: "mchang@breakthroughconsult.com.au", role: "Practitioner", action: "SUBMIT_INCIDENT", resource: "Incident Log — Charlie Davis", ipAddress: "101.33.21.4", status: "success" },
  { id: "a5", timestamp: "2026-07-05 01:55:11", user: "mchang@breakthroughconsult.com.au", role: "Practitioner", action: "ACCESS_BLOCKED", resource: "Billing Ledger", ipAddress: "101.33.21.4", status: "blocked" },
  { id: "a6", timestamp: "2026-07-04 23:41:08", user: "sjohnson@breakthroughconsult.com.au", role: "Admin", action: "EXPORT_REPORT", resource: "Reports — Q3 Executive Summary", ipAddress: "203.12.48.91", status: "success" },
  { id: "a7", timestamp: "2026-07-04 22:14:33", user: "unknown@external.net", role: "—", action: "LOGIN_FAILED", resource: "Authentication", ipAddress: "45.89.213.7", status: "warning" },
  { id: "a8", timestamp: "2026-07-04 21:30:00", user: "admin@breakthroughconsult.com.au", role: "Admin", action: "SETTINGS_UPDATE", resource: "Settings — Notification Preferences", ipAddress: "203.12.48.91", status: "success" },
  { id: "a9", timestamp: "2026-07-04 20:05:17", user: "ewilson@breakthroughconsult.com.au", role: "Practitioner", action: "AI_GENERATE", resource: "BSP Creator — Alice Johnson", ipAddress: "192.168.1.5", status: "success" },
  { id: "a10", timestamp: "2026-07-04 19:48:52", user: "unknown@external.net", role: "—", action: "LOGIN_FAILED", resource: "Authentication", ipAddress: "45.89.213.7", status: "warning" },
];

const ACTION_ICONS: Record<string, React.ReactNode> = {
  LOGIN: <LogIn className="h-3.5 w-3.5" />,
  ACCESS_BLOCKED: <AlertTriangle className="h-3.5 w-3.5" />,
  LOGIN_FAILED: <AlertTriangle className="h-3.5 w-3.5" />,
  SETTINGS_UPDATE: <Settings className="h-3.5 w-3.5" />,
  VIEW: <User className="h-3.5 w-3.5" />,
  AI_GENERATE: <FileText className="h-3.5 w-3.5" />,
  GENERATE_INVOICE: <FileText className="h-3.5 w-3.5" />,
  EXPORT_REPORT: <Download className="h-3.5 w-3.5" />,
  SUBMIT_INCIDENT: <Shield className="h-3.5 w-3.5" />,
};

export function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>(MOCK_AUDIT_LOG);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Add a new live entry every 30 seconds to simulate real activity
  useEffect(() => {
    const actions = ["VIEW", "AI_GENERATE", "EXPORT_REPORT", "SETTINGS_UPDATE"];
    const users = ["admin@breakthroughconsult.com.au", "sjohnson@breakthroughconsult.com.au"];
    const resources = ["Client Record — Alice Johnson", "Reports Hub", "AI Assistant — Progress Note", "BSP Creator"];

    const interval = setInterval(() => {
      const newEntry: AuditEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString("sv-SE").replace("T", " "),
        user: users[Math.floor(Math.random() * users.length)],
        role: "Admin",
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: resources[Math.floor(Math.random() * resources.length)],
        ipAddress: "203.12.48.91",
        status: "success",
      };
      setEntries(prev => [newEntry, ...prev].slice(0, 50));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filtered = entries.filter(e => {
    const matchSearch = e.user.includes(search) || e.action.includes(search.toUpperCase()) || e.resource.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const warnings = entries.filter(e => e.status === "warning" || e.status === "blocked").length;

  const exportCSV = () => {
    const csv = ["Timestamp,User,Role,Action,Resource,IP,Status",
      ...entries.map(e => `"${e.timestamp}","${e.user}","${e.role}","${e.action}","${e.resource}","${e.ipAddress}","${e.status}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit-trail.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Trail</h2>
          <p className="text-muted-foreground">Immutable log of all user actions, data access events, and security incidents.</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-emerald-500">{entries.filter(e => e.status === "success").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Successful</p>
          </CardContent>
        </Card>
        <Card className={warnings > 0 ? "border-amber-200 dark:border-amber-800" : ""}>
          <CardContent className="pt-6">
            <p className={`text-2xl font-bold ${warnings > 0 ? "text-amber-500" : ""}`}>{warnings}</p>
            <p className="text-xs text-muted-foreground mt-1">Warnings / Blocked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{new Set(entries.map(e => e.user)).size}</p>
            <p className="text-xs text-muted-foreground mt-1">Unique Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, action, or resource..." className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{entry.timestamp}</TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">{entry.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{entry.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                        {ACTION_ICONS[entry.action] || <Shield className="h-3.5 w-3.5" />}
                        {entry.action}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{entry.resource}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{entry.ipAddress}</TableCell>
                    <TableCell>
                      <Badge
                        className={entry.status === "success" ? "bg-emerald-600 text-white" : entry.status === "blocked" ? "bg-red-600 text-white" : "bg-amber-500 text-white"}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
