import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { FileDown, Calendar, CreditCard, PlusCircle, Printer, FileText, X, Bot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  clientName: string;
  clientNdis: string;
  supportCode: string;
  supportName: string;
  hours: number;
  rate: number;
  total: number;
  date: string;
  status: "Draft" | "Dispatched" | "Paid" | "Rejected";
}

const SUPPORT_ITEMS = [
  { code: "15_102_0118_1_3", name: "Specialised Behaviour Support Training", rate: 193.99 },
  { code: "15_056_0128_1_3", name: "Individual Assessment And Therapy", rate: 193.99 },
  { code: "01_799_0115_1_1", name: "Individual Support - Self Care", rate: 65.47 },
  { code: "07_001_0106_2_2", name: "Support Connection", rate: 74.20 }
];

import { useClaimsQuery, useApproveClaimMutation, useRejectClaimMutation, useCreateClaimMutation } from "@/data/repositories/ClaimRepository";

export function Billing() {
  const { data: claims = [], isLoading } = useClaimsQuery();
  const approveMutation = useApproveClaimMutation();
  const rejectMutation = useRejectClaimMutation();
  const createMutation = useCreateClaimMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGenComplete, setAutoGenComplete] = useState(false);

  // New Invoice Form State
  const [clientName, setClientName] = useState("");
  const [clientNdis, setClientNdis] = useState("");
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [hours, setHours] = useState(1);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

  const handleUpdateStatus = (id: string, nextStatus: "Paid" | "Rejected" | "Dispatched") => {
    if (nextStatus === "Paid") approveMutation.mutate(id);
    else if (nextStatus === "Rejected") rejectMutation.mutate(id);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;

    const item = SUPPORT_ITEMS[selectedItemIdx];
    const total = hours * item.rate;
    
    createMutation.mutate({
      clientId: clientNdis || "unknown",
      amount: total,
      date: invoiceDate,
      status: "Pending",
      type: item.name,
      patient: clientName,
      practitionerId: "unknown",
      dateOfService: invoiceDate,
      supportItemNumber: item.code,
      hours: hours,
      rate: item.rate,
      totalAmount: total,
    });

    setIsCreating(false);
    setClientName("");
    setClientNdis("");
    setHours(1);
  };

  const getStatusColor = (s: string) => {
    if (s === "Approved" || s === "Paid") return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
    if (s === "Pending" || s === "Dispatched") return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900";
    if (s === "Rejected") return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900";
    return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800";
  };

  const handleAutoGenerate = () => {
    setIsAutoGenerating(true);
    setAutoGenComplete(false);
    setTimeout(() => {
      setIsAutoGenerating(false);
      setAutoGenComplete(true);
      setTimeout(() => setAutoGenComplete(false), 3000);
    }, 2000);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Invoice Form Overlay (only visible during printing) */}
      {activeInvoice && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-10 z-50">
          <div className="flex justify-between border-b pb-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">Tax Invoice</h1>
              <p className="text-sm font-semibold">Breakthrough Coaching & Consulting</p>
              <p className="text-xs">NDIS Registered Behaviour Support Provider</p>
              <p className="text-xs">ABN: 45 678 123 456</p>
              <p className="text-xs">Registration No: 4050012345</p>
              <p className="text-xs">Address: 123 Business Way, Melbourne VIC 3000</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-slate-800">{activeInvoice.id}</h2>
              <p className="text-xs">Date: {activeInvoice.date}</p>
              <p className="text-xs">Status: {activeInvoice.status}</p>
            </div>
          </div>

          <div className="my-8">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Participant Details</h3>
            <p className="text-sm font-semibold">{activeInvoice.clientName}</p>
            <p className="text-xs">NDIS Reference No: {activeInvoice.clientNdis}</p>
          </div>

          <table className="w-full text-left text-xs border-collapse mt-8">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="py-2">Support Line Item Code & Description</th>
                <th className="py-2 text-right">Qty / Hrs</th>
                <th className="py-2 text-right">Unit Rate</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4">
                  <span className="font-semibold block">{activeInvoice.supportCode}</span>
                  <span className="text-slate-600">{activeInvoice.supportName}</span>
                </td>
                <td className="py-4 text-right">{activeInvoice.hours} hrs</td>
                <td className="py-4 text-right">${activeInvoice.rate.toFixed(2)}</td>
                <td className="py-4 text-right font-semibold">${activeInvoice.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between border-t pt-6 mt-8">
            <div>
              <p className="text-[10px] text-slate-500 max-w-sm">Payment Term: 14 Days from date of invoice. Please include Invoice ID as reference for bank transfers.</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm">GST (Exempt): $0.00</p>
              <p className="text-lg font-bold">Total Due: ${activeInvoice.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen Interface */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing Ledger</h2>
          <p className="text-muted-foreground">Manage invoices, record client payment states, and run NDIS PRODA claim exports.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleAutoGenerate} 
            disabled={isAutoGenerating || autoGenComplete}
            className={cn("border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20", autoGenComplete && "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20")}
          >
            {isAutoGenerating ? (
              <><div className="h-4 w-4 mr-2 rounded-full border-2 border-purple-500/30 border-t-purple-700 animate-spin" /> Scanning Sessions...</>
            ) : autoGenComplete ? (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> 2 Generated</>
            ) : (
              <><Bot className="mr-2 h-4 w-4" /> Auto-Generate</>
            )}
          </Button>
          <Button onClick={() => setIsCreating(true)} className="bg-primary hover:opacity-90">
            <PlusCircle className="mr-2 h-4 w-4" /> Create NDIS Invoice
          </Button>
          <Button variant="outline" className="border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hidden md:flex">
            <FileDown className="mr-2 h-4 w-4" /> Export Bulk Claim
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Invoice List Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Ledger</CardTitle>
              <CardDescription>Direct interface mapping claim state compliance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Claim Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((inv) => (
                      <TableRow key={inv.id} className={cn("cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50", activeInvoice?.id === inv.id && "bg-slate-50 dark:bg-slate-900")} onClick={() => setActiveInvoice(inv)}>
                        <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                        <TableCell className="font-semibold">{inv.patient}</TableCell>
                        <TableCell>{inv.hours || 1} hrs</TableCell>
                        <TableCell className="font-semibold">${inv.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{inv.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(inv.status)}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {inv.status === "Pending" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(inv.id, "Paid")} className="text-emerald-700 border-emerald-200">Approve</Button>
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(inv.id, "Rejected")} className="text-red-700 border-red-200">Reject</Button>
                            </>
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

        {/* Dynamic Detail Panel or Create Panel */}
        <div className="space-y-6">
          {isCreating ? (
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>New NDIS Invoice</CardTitle>
                  <CardDescription>Draft claims against NDIS support units.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleCreateInvoice}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Participant Name</label>
                    <input 
                      type="text" 
                      required 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)} 
                      placeholder="e.g. Alice Vance" 
                      className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">NDIS Participant Number</label>
                    <input 
                      type="text" 
                      required 
                      value={clientNdis} 
                      onChange={(e) => setClientNdis(e.target.value)} 
                      placeholder="e.g. 430112233" 
                      className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">NDIS Support Item Category</label>
                    <select 
                      value={selectedItemIdx} 
                      onChange={(e) => setSelectedItemIdx(Number(e.target.value))} 
                      className="w-full text-sm bg-card rounded-lg border border-border px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    >
                      {SUPPORT_ITEMS.map((item, idx) => (
                        <option key={item.code} value={idx}>{item.name} (${item.rate}/hr)</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Hours Billed</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="40" 
                        required 
                        value={hours} 
                        onChange={(e) => setHours(Number(e.target.value))} 
                        className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Invoice Date</label>
                      <input 
                        type="date" 
                        required 
                        value={invoiceDate} 
                        onChange={(e) => setInvoiceDate(e.target.value)} 
                        className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 outline-none"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t border-border/40 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:opacity-90">Create Draft</Button>
                </CardFooter>
              </form>
            </Card>
          ) : activeInvoice ? (
            <Card className="relative overflow-hidden border-blue-500/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Active Preview</span>
                    <CardTitle className="mt-1">{activeInvoice.id}</CardTitle>
                    <CardDescription>{activeInvoice.clientName}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(activeInvoice.status)}>{activeInvoice.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-dashed rounded-lg p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NDIS Category:</span>
                    <span className="font-semibold text-right max-w-[150px] truncate">{activeInvoice.supportName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NDIS Code:</span>
                    <span className="font-mono">{activeInvoice.supportCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours:</span>
                    <span>{activeInvoice.hours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Rate:</span>
                    <span>${activeInvoice.rate.toFixed(2)}/hr</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                    <span>Total Cost:</span>
                    <span className="text-blue-600 dark:text-blue-400">${activeInvoice.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-muted-foreground">Provider Details:</p>
                  <p className="text-muted-foreground">Breakthrough Coaching & Consulting</p>
                  <p className="text-muted-foreground">ABN: 45 678 123 456</p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/40 pt-4 flex gap-2">
                <Button onClick={triggerPrint} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 hover:opacity-90">
                  <Printer className="mr-2 h-4 w-4" /> Print / Save NDIS PDF
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <FileText className="h-8 w-8 text-muted-foreground/60 mb-3" />
              <CardTitle className="text-sm">No Preview Selected</CardTitle>
              <CardDescription className="text-xs">Click on any invoice in the ledger to view details and export NDIS-compliant PDF files.</CardDescription>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
