import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Badge } from "@/presentation/components/ui/badge";
import { Calendar, PhoneCall, Mail, MessageSquare } from "lucide-react";

interface CommsRecord {
  id: string;
  clientName: string;
  type: "Email" | "Phone Call" | "SMS";
  notes: string;
  date: string;
  author: string;
}

export function ClientCommunications() {
  const [logs, setLogs] = useState<CommsRecord[]>([
    { id: "1", clientName: "Charlie Davis", type: "Email", notes: "Dispatched updated NDIS calculator budget for confirmation ahead of invoice rollover.", date: "2026-07-04", author: "Jane Admin" }
  ]);

  const [clientName, setClientName] = useState("");
  const [type, setType] = useState<CommsRecord["type"]>("Email");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !notes) return;

    const newLog: CommsRecord = {
      id: Date.now().toString(),
      clientName,
      type,
      notes,
      date: new Date().toISOString().split('T')[0],
      author: "Supervised Practitioner"
    };

    setLogs([newLog, ...logs]);
    setClientName("");
    setNotes("");
  };

  const getIcon = (t: CommsRecord["type"]) => {
    if (t === "Email") return <Mail className="h-4 w-4 text-blue-500" />;
    if (t === "Phone Call") return <PhoneCall className="h-4 w-4 text-emerald-500" />;
    return <MessageSquare className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Client Communications Hub</h2>
        <p className="text-muted-foreground">Log clinical outreach, phone consults, and email dispatches to participants.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log Client Contact</CardTitle>
            <CardDescription>Document communications instantly.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Charlie Davis" />
              </div>
              <div className="space-y-2">
                <Label>Communication Type</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email Dispatch</SelectItem>
                    <SelectItem value="Phone Call">Phone Consult</SelectItem>
                    <SelectItem value="SMS">SMS Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Summary</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  placeholder="Summarize discussion points, follow-ups required..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Log Contact Record</Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Communication Logs</CardTitle>
            <CardDescription>Historical review of participant outreach and touchpoints.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Log Notes</TableHead>
                  <TableHead>Logged By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {l.date}</Badge></TableCell>
                    <TableCell className="font-semibold">{l.clientName}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm font-medium">{getIcon(l.type)} {l.type}</span>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed text-slate-600 max-w-[250px]">{l.notes}</TableCell>
                    <TableCell className="text-xs">{l.author}</TableCell>
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
