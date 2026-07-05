import { useState, useEffect } from "react";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "@/lib/firebase";
import app from "@/lib/firebase";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { ABCObservation } from "@/lib/db-schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ABCAnalyser() {
  const [logs, setLogs] = useState<ABCObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Form states
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [antecedent, setAntecedent] = useState("");
  const [behavior, setBehavior] = useState("");
  const [consequence, setConsequence] = useState("");

  useEffect(() => {
    // Listen to Firebase collection 'abcLogs'
    const q = query(collection(db, "abcLogs"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ABCObservation[];
      setLogs(loadedLogs);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore error, using local fallback: ", error);
      // Fallback local storage for demo/offline robustness
      const local = localStorage.getItem("abcLogs");
      if (local) setLogs(JSON.parse(local));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !antecedent || !behavior || !consequence) return;

    const newLog: ABCObservation = {
      clientId: "1", // Mock client ID
      clientName,
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().split(' ')[0].slice(0, 5),
      antecedent,
      behavior,
      consequence,
      practitionerId: auth.currentUser?.uid || "mock-practitioner",
      practitionerName: auth.currentUser?.email || "Staff Member"
    };

    try {
      await addDoc(collection(db, "abcLogs"), newLog);
    } catch (error) {
      console.warn("Failed to write to firestore, writing to localStorage", error);
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("abcLogs", JSON.stringify(updatedLogs));
    }

    // Reset form
    setAntecedent("");
    setBehavior("");
    setConsequence("");
  };

  // Process data for charts (group behaviors)
  const behaviorCounts = logs.reduce((acc: any, log) => {
    acc[log.behavior] = (acc[log.behavior] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(behaviorCounts).map(key => ({
    name: key,
    count: behaviorCounts[key]
  }));

  const handleGenerateInsight = async () => {
    if (logs.length === 0) return;
    setLoadingInsight(true);
    setAiInsight(null);
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const logsSummary = logs.slice(0, 20).map(l => `A: ${l.antecedent} | B: ${l.behavior} | C: ${l.consequence}`).join('\\n');
      
      const prompt = `You are a clinical behavior analyst. Analyze these ABC (Antecedent-Behavior-Consequence) logs and provide a short summary hypothesis of the likely function of the behavior (Attention, Escape, Tangible, Sensory) and a recommended proactive strategy.\\n\\nLogs:\\n${logsSummary}`;
      
      const response = await generateGeminiContent({ prompt });
      setAiInsight((response.data as any).text);
    } catch (error) {
      console.error(error);
      setAiInsight("Failed to generate AI insight.");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ABC Analyser</h2>
        <p className="text-muted-foreground">Antecedent-Behavior-Consequence tracker for functional behavior assessment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log ABC Observation</CardTitle>
            <CardDescription>Record a behavioral event in real-time.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Charlie Davis" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="antecedent">Antecedent (A)</Label>
                <Input id="antecedent" placeholder="What happened right before?" value={antecedent} onChange={(e) => setAntecedent(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="behavior">Behavior (B)</Label>
                <Input id="behavior" placeholder="What did the client do?" value={behavior} onChange={(e) => setBehavior(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consequence">Consequence (C)</Label>
                <Input id="consequence" placeholder="What happened right after?" value={consequence} onChange={(e) => setConsequence(e.target.value)} required />
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button type="submit" className="w-full">Save Observation</Button>
            </CardContent>
          </form>
        </Card>

        {/* Analytics & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Frequency</CardTitle>
              <CardDescription>Aggregated count of logged behaviors.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Log behaviors to generate chart.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle>Observation Log</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateInsight} 
                disabled={loadingInsight || logs.length === 0}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200"
              >
                {loadingInsight ? "Analyzing..." : "Generate AI Insight"}
              </Button>
            </CardHeader>
            <CardContent>
              {aiInsight && (
                <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">Gemini Clinical Insight</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-indigo-800 dark:text-indigo-300">
                    {aiInsight}
                  </div>
                </div>
              )}
              {loading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Loading observations...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">No observations logged yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Antecedent</TableHead>
                      <TableHead>Behavior</TableHead>
                      <TableHead>Consequence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, idx) => (
                      <TableRow key={log.id || idx}>
                        <TableCell className="whitespace-nowrap">{log.date} {log.time}</TableCell>
                        <TableCell className="font-medium">{log.clientName}</TableCell>
                        <TableCell>{log.antecedent}</TableCell>
                        <TableCell className="font-semibold text-primary">{log.behavior}</TableCell>
                        <TableCell>{log.consequence}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
