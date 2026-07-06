import { useState, useEffect } from "react";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import app, { db, auth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/presentation/components/ui/button";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Sparkles, Save, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Badge } from "@/presentation/components/ui/badge";

interface CaseNote {
  id: string;
  clientName: string;
  date: string;
  practitionerName: string;
  rawNote: string;
  summary: string;
  risks: string[];
}

export function CaseNotes() {
  const [clientName, setClientName] = useState("");
  const [rawNote, setRawNote] = useState("");
  const [summary, setSummary] = useState("");
  const [risks, setRisks] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<CaseNote[]>([]);

  useEffect(() => {
    const q = query(collection(db, "caseNotes"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CaseNote[];
      setNotes(loaded);
    });
    return () => unsubscribe();
  }, []);

  const handleAnalyze = async () => {
    if (!rawNote) return;
    setAnalyzing(true);
    setSummary("");
    setRisks([]);

    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      
      const prompt = `You are a clinical supervisor. Summarize the following case note/shift note into a few concise bullet points. Also, explicitly extract any clinical or operational risks (e.g., mentions of injury, absconding, restrictive practices, behavioral escalation). 
      Return ONLY a JSON object with this structure: 
      {
        "summary": "bullet points here",
        "risks": ["risk 1", "risk 2"] 
      }
      If no risks are present, return an empty array for risks.
      
      Case Note:
      ${rawNote}`;
      
      const response = await generateGeminiContent({ prompt });
      const text = (response.data as any).text?.replace(/```json|```/g, "").trim() || "{}";
      const parsed = JSON.parse(text);
      
      setSummary(parsed.summary || "No summary generated.");
      setRisks(parsed.risks || []);
    } catch (err) {
      console.error(err);
      setSummary("Failed to analyze note.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!clientName || !rawNote) return;
    setSaving(true);

    const isOffline = !navigator.onLine || useAppStore.getState().isOffline;
    if (isOffline) {
      useAppStore.getState().incrementPendingSync();
    }

    try {
      await addDoc(collection(db, "caseNotes"), {
        clientName,
        rawNote,
        summary,
        risks,
        practitionerName: auth.currentUser?.email || "Practitioner",
        practitionerId: auth.currentUser?.uid || "mock-id",
        date: new Date().toISOString()
      });
      setRawNote("");
      setSummary("");
      setRisks([]);
      setClientName("");
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Case Notes</h2>
        <p className="text-muted-foreground">Log daily shift notes with AI-powered summarization and risk detection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Note */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Log Shift Note</CardTitle>
            <CardDescription>Enter raw notes from your shift or session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label>Participant</Label>
              <Select value={clientName} onValueChange={setClientName}>
                <SelectTrigger><SelectValue placeholder="Select Participant..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Charlie Davis">Charlie Davis</SelectItem>
                  <SelectItem value="Alice Smith">Alice Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <Label>Raw Shift Note</Label>
              <textarea 
                value={rawNote} 
                onChange={(e) => setRawNote(e.target.value)}
                placeholder="Type your detailed observations here..."
                className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 min-h-[200px] flex-1 outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={handleAnalyze} disabled={analyzing || !rawNote} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <Sparkles className="mr-2 h-4 w-4" />
              {analyzing ? "Analyzing..." : "AI Summarize & Detect Risks"}
            </Button>
            <Button onClick={handleSave} disabled={saving || !rawNote || !clientName}>
              <Save className="mr-2 h-4 w-4" /> Save Note
            </Button>
          </CardFooter>
        </Card>

        {/* AI Insight & History */}
        <div className="space-y-6">
          {(summary || risks.length > 0) && (
            <Card className="border-indigo-200 bg-indigo-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Gemini Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-700 uppercase tracking-wider font-bold">Summary</Label>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">{summary}</div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-700 uppercase tracking-wider font-bold">Detected Risks</Label>
                  {risks.length > 0 ? (
                    <ul className="space-y-1">
                      {risks.map((risk, i) => (
                        <li key={i} className="flex gap-2 items-start text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100">
                          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex gap-2 items-center text-sm text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>No immediate risks detected in this note.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{note.clientName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(note.date).toLocaleString()} • by {note.practitionerName}</p>
                      </div>
                      {note.risks?.length > 0 && (
                        <Badge variant="destructive" className="flex gap-1 items-center">
                          <ShieldAlert className="h-3 w-3" /> {note.risks.length} Risk(s)
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{note.summary || note.rawNote}</p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No notes recorded yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
