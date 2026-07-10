import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { FileText, Send, Download, BarChart3, Users, TrendingUp, CheckCircle2, Printer, FileSpreadsheet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useReportsQuery, useCreateReportMutation, useSendReportMutation, Report } from "@/data/repositories/ReportRepository";
import jsPDF from "jspdf";

const workloadData = [
  { name: "Dr. Jenkins", caseload: 14, capacity: 18 },
  { name: "M. Chang", caseload: 17, capacity: 18 },
  { name: "E. Wilson", caseload: 9, capacity: 15 },
  { name: "R. Patel", caseload: 12, capacity: 15 },
  { name: "C. Lee", caseload: 6, capacity: 12 },
];

// ── CSV export ────────────────────────────────────────────────────────────
// Escapes per RFC 4180: wrap in quotes and double up any embedded quotes.
// Report names/recipients are free text, so this matters (a comma or quote
// in a report title shouldn't silently corrupt the column count).
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadReportsCsv(reports: Report[]) {
  const header = ["Report Title", "Type", "Creation Date", "Authorized Recipient", "Status"];
  const rows = reports.map((r) => [r.name, r.type, r.date, r.recipient, r.status]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `report-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Single-report PDF export ────────────────────────────────────────────
// Report Repository currently stores metadata only (title, type, date,
// recipient, status) — there's no rich report body/content model yet, so
// this generates a one-page metadata summary rather than pretending to
// reproduce a full clinical report it doesn't have the content for.
function downloadReportPdf(report: Report) {
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text("Breakthrough Coaching & Consulting", 14, 20);
  pdf.setFontSize(11);
  pdf.setTextColor(100);
  pdf.text("NDIS Registered Behaviour Support Provider", 14, 27);

  pdf.setDrawColor(220);
  pdf.line(14, 32, 196, 32);

  pdf.setFontSize(14);
  pdf.setTextColor(0);
  pdf.text(report.name, 14, 44);

  const fields: [string, string][] = [
    ["Type", report.type],
    ["Creation Date", report.date],
    ["Authorized Recipient", report.recipient],
    ["Status", report.status],
  ];

  let y = 58;
  pdf.setFontSize(11);
  for (const [label, value] of fields) {
    pdf.setTextColor(120);
    pdf.text(`${label}:`, 14, y);
    pdf.setTextColor(0);
    pdf.text(value, 60, y);
    y += 9;
  }

  pdf.setFontSize(9);
  pdf.setTextColor(150);
  pdf.text(
    `Generated ${new Date().toLocaleString()} — metadata summary only; full report content is managed separately.`,
    14,
    280
  );

  pdf.save(`${report.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}

export function Reports() {
  const { data: reports = [], isLoading } = useReportsQuery();
  const createReport = useCreateReportMutation();
  const sendReport = useSendReportMutation();

  const [compilingStep, setCompilingStep] = useState<null | "Drafting" | "Compliance Auditing" | "Compiling">(null);

  const kpis = [
    { label: "Active Clients", value: "142", icon: Users, color: "text-blue-500" },
    { label: "Compliance Rate", value: "98.5%", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Sessions This Month", value: "312", icon: BarChart3, color: "text-purple-500" },
    { label: "Claims Processed", value: "$128,490", icon: TrendingUp, color: "text-amber-500" },
  ];

  const printReport = () => window.print();

  const startMultiAgentCompilation = () => {
    setCompilingStep("Drafting");
    
    setTimeout(() => {
      setCompilingStep("Compliance Auditing");
      
      setTimeout(() => {
        setCompilingStep("Compiling");
        
        setTimeout(() => {
          setCompilingStep(null);
          createReport.mutate({
            name: "AI Compiled Therapy Report - Charlie Davis",
            type: "Clinical",
            date: new Date().toISOString().split('T')[0],
            recipient: "NDIS Commission (Portal Upload)",
            status: "Approved"
          });
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports Distribution Hub</h2>
          <p className="text-muted-foreground">Compile, audit, and distribute mandatory compliance and progress reports.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={startMultiAgentCompilation} 
            disabled={compilingStep !== null}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
          >
            Compile NDIS Progress Report (Multi-Agent)
          </Button>
          <Button onClick={printReport} variant="outline" className="border-border">
            <Printer className="mr-2 h-4 w-4" /> Print Executive Summary
          </Button>
          <Button
            onClick={() => downloadReportsCsv(reports)}
            disabled={reports.length === 0}
            variant="outline"
            className="border-border"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {compilingStep && (
        <Card className="border-indigo-500/20 bg-indigo-50/10 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-200">NDIS Multi-Agent Report Compiler</h4>
              <Badge variant="outline" className="animate-pulse bg-indigo-100 text-indigo-800 border-indigo-200">
                {compilingStep}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-xs font-medium">
              <div className={`flex items-center gap-2 ${compilingStep === 'Drafting' ? 'text-indigo-600 font-bold' : 'text-muted-foreground'}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${compilingStep === 'Drafting' ? 'bg-indigo-600 animate-ping' : 'bg-slate-300'}`} />
                Drafting
              </div>
              <div className="text-muted-foreground">&rarr;</div>
              <div className={`flex items-center gap-2 ${compilingStep === 'Compliance Auditing' ? 'text-indigo-600 font-bold' : 'text-muted-foreground'}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${compilingStep === 'Compliance Auditing' ? 'bg-indigo-600 animate-ping' : 'bg-slate-300'}`} />
                Compliance Auditing
              </div>
              <div className="text-muted-foreground">&rarr;</div>
              <div className={`flex items-center gap-2 ${compilingStep === 'Compiling' ? 'text-indigo-600 font-bold' : 'text-muted-foreground'}`}>
                <div className={`h-2.5 w-2.5 rounded-full ${compilingStep === 'Compiling' ? 'bg-indigo-600 animate-ping' : 'bg-slate-300'}`} />
                Compiling
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Executive Summary Section (print-friendly) */}
      <Card className="border-2 border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Executive Summary — FY2026 Q3</CardTitle>
          </div>
          <CardDescription>Breakthrough Coaching & Consulting · NDIS Registered Behaviour Support Provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="p-4 rounded-xl bg-card border shadow-sm text-center space-y-1">
                <kpi.icon className={`h-6 w-6 mx-auto ${kpi.color}`} />
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-4 border-b border-border/40">
              <h4 className="font-semibold text-sm">Practitioner Workload vs Capacity</h4>
              <p className="text-xs text-muted-foreground">Active caseload distribution across the clinical team.</p>
            </div>
            <div className="p-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="capacity" fill="#e2e8f0" name="Capacity" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="caseload" fill="#3b82f6" name="Caseload" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle>Report Ledger</CardTitle>
          <CardDescription>Registry of drafted documents and verified dispatches.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead>Authorized Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      Loading reports…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && reports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No reports yet.
                    </TableCell>
                  </TableRow>
                )}
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold">{r.name}</TableCell>
                    <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                    <TableCell className="text-xs font-mono">{r.recipient}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "Approved" ? "default" : r.status === "Sent" ? "secondary" : "outline"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => downloadReportPdf(r)}>
                        <Download className="h-4 w-4 mr-1" />PDF
                      </Button>
                      {r.status === "Draft" && (
                        <Button
                          size="sm"
                          onClick={() => sendReport.mutate(r.id)}
                          disabled={sendReport.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />Send
                        </Button>
                      )}
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
