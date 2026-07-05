import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Calendar, Award } from "lucide-react";

interface MentorshipSession {
  id: string;
  mentor: string;
  mentee: string;
  date: string;
  notes: string;
}

export function MentorshipProgram() {
  const [sessions, setSessions] = useState<MentorshipSession[]>([
    { id: "1", mentor: "Dr. Sarah Jenkins", mentee: "Michael Chang", date: "2026-06-28", notes: "Discussed sensory room strategies for overstimulated child clients, and methods for reducing self-injurious behavior safely." }
  ]);

  const [mentor, setMentor] = useState("");
  const [mentee, setMentee] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor || !mentee || !notes) return;

    const newSession: MentorshipSession = {
      id: Date.now().toString(),
      mentor,
      mentee,
      notes,
      date: new Date().toISOString().split('T')[0]
    };

    setSessions([newSession, ...sessions]);
    setMentor("");
    setMentee("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Clinical Mentorship & Supervision</h2>
        <p className="text-muted-foreground">Pair senior clinical leaders with junior therapists and log mandatory supervision meetings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log Supervision Session</CardTitle>
            <CardDescription>Document clinical discussions and feedback.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mentor">Supervisor / Mentor</Label>
                <Input id="mentor" value={mentor} onChange={(e) => setMentor(e.target.value)} required placeholder="e.g. Dr. Sarah Jenkins" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentee">Supervised Practitioner</Label>
                <Input id="mentee" value={mentee} onChange={(e) => setMentee(e.target.value)} required placeholder="e.g. Michael Chang" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Clinical Notes / Discussion Points</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  placeholder="Key behaviors analyzed, client support strategies discussed, etc."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Log Supervision</Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Supervision Log History</CardTitle>
            <CardDescription>Track historical records of practitioner professional support.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Practitioner</TableHead>
                  <TableHead>Topics Discussed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {s.date}</Badge></TableCell>
                    <TableCell className="font-semibold">{s.mentor}</TableCell>
                    <TableCell className="font-semibold text-primary">{s.mentee}</TableCell>
                    <TableCell className="text-xs leading-relaxed text-slate-600 max-w-[300px]">{s.notes}</TableCell>
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
