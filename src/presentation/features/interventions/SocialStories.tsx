import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, addDoc } from "firebase/firestore";
import app, { db, auth } from "@/lib/firebase";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Sparkles, Printer, FileText, Save, CheckCheck } from "lucide-react";

export function SocialStories() {
  const [clientName, setClientName] = useState("");
  const [scenario, setScenario] = useState("");
  const [readingLevel, setReadingLevel] = useState("simple");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !scenario) return;

    setError("");
    setLoading(true);

    const prompt = `Write a Carol Gray style Social Story for a client named ${clientName}.
Target Scenario: ${scenario}
Reading Level: ${readingLevel} (make it appropriate for this level).

Structure the story with clear sections:
1. Title
2. Descriptive sentences (setting the scene)
3. Perspective sentences (describing others' feelings/reactions)
4. Directive sentences (positive actions the client can take)
5. Control sentences (mnemonic/helpful reminders).

Make it encouraging and positive.`;

    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const response = await generateGeminiContent({ prompt });

      setStory((response.data as any).text || "Failed to generate story.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to communicate with Gemini API.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveToFirestore = async () => {
    if (!story || !clientName) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "socialStories"), {
        clientName,
        scenario,
        readingLevel,
        storyContent: story,
        practitionerId: auth.currentUser?.uid || "mock-practitioner",
        createdAt: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save story:", err);
      setError("Failed to save story to vault.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Social Stories Generator</h2>
        <p className="text-muted-foreground">AI-powered creation of Carol Gray style social narratives to support social learning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 print:hidden">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Specify scenario details to generate a story.</CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-xs text-red-600 bg-red-50 rounded-md border border-red-100">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="e.g. Charlie" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenario">Target Scenario / Event</Label>
                <Input id="scenario" value={scenario} onChange={(e) => setScenario(e.target.value)} required placeholder="e.g. Going to the dentist" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readingLevel">Reading Level</Label>
                <Select value={readingLevel} onValueChange={setReadingLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple / Visual (Under 6 yrs)</SelectItem>
                    <SelectItem value="moderate">Moderate (7-12 yrs)</SelectItem>
                    <SelectItem value="advanced">Advanced / Teen (13+ yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Generating..." : "Generate Story"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="md:col-span-2 print:shadow-none print:border-none">
          <CardHeader className="pb-3 border-b flex flex-row justify-between items-center print:border-none">
            <div>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-500" /> Story Preview</CardTitle>
              <CardDescription className="print:hidden">Interactive print-ready story sheet.</CardDescription>
            </div>
            {story && (
              <div className="flex gap-2">
                <Button onClick={handlePrint} size="sm" variant="outline" className="print:hidden">
                  <Printer className="mr-2 h-4 w-4" /> Print Story
                </Button>
                <Button onClick={handleSaveToFirestore} size="sm" variant="default" className="print:hidden" disabled={saving || saved}>
                  {saved ? <CheckCheck className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {saved ? "Saved" : "Save to Vault"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {story ? (
              <div className="prose max-w-none whitespace-pre-wrap leading-relaxed font-serif text-slate-800 text-lg">
                {story}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm space-y-2">
                <Sparkles className="h-8 w-8 text-slate-300 animate-pulse" />
                <p>Enter details on the left and click Generate.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
