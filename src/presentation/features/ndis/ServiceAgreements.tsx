import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { FileText, Plus, Trash2, Printer, Sparkles } from "lucide-react";

interface Agreement {
  id: string;
  clientName: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: "Draft" | "Sent" | "Signed";
  items: string[];
}

export function ServiceAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([
    { id: "SA-1002", clientName: "Charlie Davis", startDate: "2026-07-01", endDate: "2027-07-01", totalValue: 15480, status: "Signed", items: ["Therapy - Speech Pathology (24 hrs)", "Community Access Support (120 hrs)"] }
  ]);

  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [itemsList, setItemsList] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  const [activeTab, setActiveTab] = useState<"list" | "create" | "view">("list");
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);

  const [rawText, setRawText] = useState("");
  const [extracting, setExtracting] = useState(false);

  const handleExtract = async () => {
    if (!rawText) return;
    setExtracting(true);
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      
      const prompt = `Extract service agreement details from the following raw text and return a JSON object with these exact keys: clientName (string), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), totalValue (number), items (array of strings for support items). Raw text:\n${rawText}`;
      
      const response = await generateGeminiContent({ prompt });
      const text = (response.data as any).text?.replace(/```json|```/g, "").trim() || "{}";
      const parsed = JSON.parse(text);
      
      if (parsed.clientName) setClientName(parsed.clientName);
      if (parsed.startDate) setStartDate(parsed.startDate);
      if (parsed.endDate) setEndDate(parsed.endDate);
      if (parsed.totalValue) setTotalValue(parsed.totalValue.toString());
      if (parsed.items && Array.isArray(parsed.items)) setItemsList(parsed.items);
      
      setRawText("");
    } catch (err) {
      console.error("Failed to extract details", err);
    } finally {
      setExtracting(false);
    }
  };

  const handleAddItem = () => {
    if (newItem) {
      setItemsList([...itemsList, newItem]);
      setNewItem("");
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !startDate || !endDate) return;

    const newAgreement: Agreement = {
      id: `SA-${1000 + agreements.length + 2}`,
      clientName,
      startDate,
      endDate,
      totalValue: parseFloat(totalValue) || 0,
      status: "Draft",
      items: itemsList
    };

    setAgreements([newAgreement, ...agreements]);
    setClientName("");
    setStartDate("");
    setEndDate("");
    setTotalValue("");
    setItemsList([]);
    setActiveTab("list");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service Agreements</h2>
          <p className="text-muted-foreground">Draft, authorize, and print legal participant service contracts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "list" ? "default" : "outline"} onClick={() => { setActiveTab("list"); setSelectedAgreement(null); }}>List Agreements</Button>
          <Button variant={activeTab === "create" ? "default" : "outline"} onClick={() => setActiveTab("create")}>New Agreement</Button>
        </div>
      </div>

      {activeTab === "list" && !selectedAgreement && (
        <Card>
          <CardHeader>
            <CardTitle>Agreement Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Valid Dates</TableHead>
                  <TableHead>Estimated Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="font-semibold">{a.clientName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.startDate} to {a.endDate}</TableCell>
                    <TableCell>${a.totalValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "Signed" ? "default" : "outline"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedAgreement(a); setActiveTab("view"); }}>View & Print</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "view" && selectedAgreement && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">NDIS Service Agreement</CardTitle>
                <CardDescription className="text-sm font-mono mt-1">Contract ID: {selectedAgreement.id}</CardDescription>
              </div>
              <Button onClick={() => window.print()} className="print:hidden">
                <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs mt-4 pt-4 border-t print:border-t-0">
              <div>Participant: <strong>{selectedAgreement.clientName}</strong></div>
              <div className="text-right">Contract Period: {selectedAgreement.startDate} to {selectedAgreement.endDate}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-bold border-b pb-1 text-slate-800">1. Agreed Support Items & Budgets</h3>
              <ul className="list-disc pl-5 space-y-1">
                {selectedAgreement.items.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
              <p className="font-semibold text-slate-900 mt-4">Total Contract Value Allocation: ${selectedAgreement.totalValue.toLocaleString()}</p>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-bold border-b pb-1 text-slate-800">2. NDIS Pricing Rules Compliance</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All prices charged under this agreement are in alignment with the NDIS Support Catalogue hourly rates. If price caps increase during the contract period, pricing will rollover automatically to match the new regulatory caps.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-10 mt-10 border-t">
              <div className="space-y-4">
                <div className="border-b h-10 w-[200px]" />
                <p className="text-xs font-semibold">Participant / Representative Signature</p>
              </div>
              <div className="space-y-4 text-right flex flex-col items-end">
                <div className="border-b h-10 w-[200px]" />
                <p className="text-xs font-semibold">Authorized Provider Signature</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="print:hidden">
            <Button variant="outline" onClick={() => { setActiveTab("list"); setSelectedAgreement(null); }}>Back to List</Button>
          </CardFooter>
        </Card>
      )}

      {activeTab === "create" && (
        <form onSubmit={handleCreate}>
          <Card>
            <CardHeader>
              <CardTitle>Draft NDIS Service Agreement</CardTitle>
              <CardDescription>Setup contract items and period limits manually or extract from text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <Label htmlFor="rawText" className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Smart Extraction
                </Label>
                <div className="flex gap-2">
                  <textarea 
                    id="rawText"
                    value={rawText} 
                    onChange={(e) => setRawText(e.target.value)} 
                    placeholder="Paste raw service agreement or email text here to auto-fill the form..." 
                    className="w-full text-sm bg-white dark:bg-background rounded-md border border-indigo-200 dark:border-indigo-800 px-3 py-2 min-h-[60px]"
                  />
                  <Button type="button" onClick={handleExtract} disabled={extracting || !rawText} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white">
                    {extracting ? "Extracting..." : "Auto-Fill"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Charlie Davis" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Date</Label>
                  <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Total Plan Budget Value ($)</Label>
                <Input id="value" type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} required placeholder="e.g. 15000" />
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <Label>Include Support Schedule Items</Label>
                <div className="flex gap-2">
                  <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="e.g. Therapeutic Support (48 hours)" />
                  <Button type="button" onClick={handleAddItem}>Add</Button>
                </div>
                <ul className="list-disc pl-5 text-sm space-y-1 text-slate-600">
                  {itemsList.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                      <span>{item}</span>
                      <Button variant="ghost" size="icon" onClick={() => setItemsList(itemsList.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
              <Button type="submit">Draft Agreement</Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}
