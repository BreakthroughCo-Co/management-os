import { useState, useRef } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Badge } from "@/presentation/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/presentation/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/presentation/components/ui/tabs";
import { Sparkles, Copy, CheckCheck, FileText, Bot, MessageSquare, Database, Paperclip, X, File as FileIcon, ListTodo, DownloadCloud, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { knowledgeRetrieval } from "@/core/services/KnowledgeRetrievalService";
import { useDocumentsQuery, searchSimilarDocuments } from "@/data/repositories/DocumentRepository";
import { GoogleWorkspaceService, DriveFile } from "@/core/services/GoogleWorkspaceService";

const SESSION_TYPES = [
  "Behaviour Support Session",
  "Occupational Therapy",
  "Speech Pathology",
  "Community Access",
  "Social Skills Group",
  "Positive Behaviour Support Review",
  "Functional Behaviour Assessment",
  "NDIS Plan Check-In",
];

const OUTCOMES = [
  "Goal achieved this session",
  "Progress made toward goal",
  "No change observed",
  "Regression noted",
  "New behaviour emerged",
  "Generalisation of skills observed",
];

interface SavedNote {
  id: string;
  client: string;
  type: string;
  date: string;
  content: string;
}

const noteSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  sessionType: z.string().min(1, "Session type is required"),
  duration: z.string().min(1, "Duration is required"),
  goals: z.string().optional(),
  observation: z.string().min(10, "Please provide more detail in observation"),
  outcome: z.string().optional(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export function AIAssistant() {
  const [mode, setMode] = useState<"notes" | "chat">("notes");

  // Progress Note generator state
  const [generating, setGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

  // Integrations state
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [exportingDoc, setExportingDoc] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      clientName: "",
      sessionType: "",
      duration: "60",
      goals: "",
      observation: "",
      outcome: "",
    }
  });

  // Chat state
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your NDIS clinical AI assistant. I can help you with BSP strategies, NDIS pricing, compliance questions, and participant support planning. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const { role: userRole, googleAccessToken } = useAuthStore();

  // Document Attachment State
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ name: string; url?: string; driveId?: string; mimeType: string } | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [fetchingDrive, setFetchingDrive] = useState(false);
  
  const { data: vaultDocuments = [] } = useDocumentsQuery();

  const loadDriveFiles = async () => {
    if (!googleAccessToken) return;
    setFetchingDrive(true);
    try {
      const files = await GoogleWorkspaceService.fetchDriveFiles(googleAccessToken);
      setDriveFiles(files);
    } catch (err) {
      console.error("Failed to load drive files for AI", err);
    } finally {
      setFetchingDrive(false);
    }
  };

  const importFieldNotes = async () => {
    if (!googleAccessToken) {
      alert("Please sign in with Google first.");
      return;
    }
    setFetchingTasks(true);
    try {
      // @default gets the default task list
      const tasks = await GoogleWorkspaceService.fetchTasks(googleAccessToken, '@default');
      if (tasks && tasks.length > 0) {
        // Just grab all task titles and notes and dump into observation
        const notesStr = tasks.map((t: any) => `- ${t.title}${t.notes ? `: ${t.notes}` : ''}`).join('\n');
        form.setValue('observation', notesStr);
      } else {
        alert("No recent field notes found in Google Tasks.");
      }
    } catch (err) {
      console.error("Failed to import tasks", err);
      alert("Error importing field notes. Please verify scopes.");
    } finally {
      setFetchingTasks(false);
    }
  };

  const generateEndOfPlanReport = async () => {
    if (!googleAccessToken) {
      alert("Please sign in with Google to export to Docs.");
      return;
    }
    setExportingDoc(true);
    try {
      // Usually we would pull all actual notes, but here we synthesize what we have
      const allNotesContext = savedNotes.map(n => `[${n.date} - ${n.type}] ${n.content}`).join('\n\n');
      
      const prompt = `Synthesize these progress notes into a formal NDIS End of Plan Report. \n\n${allNotesContext || "(No notes provided, generate a template report for Alice Johnson)"}`;
      
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const resp = await generateGeminiContent({ prompt });
      const reportText = (resp.data as any).text || "Report generated.";

      // 1. Get or create folder
      const folderId = await GoogleWorkspaceService.getOrCreateExportFolder(googleAccessToken, "Management OS Exports");
      // 2. Create Doc
      await GoogleWorkspaceService.createDocument(googleAccessToken, `End of Plan Report - ${new Date().toLocaleDateString()}`, reportText, folderId);
      
      alert("Report successfully exported to Google Docs (Management OS Exports folder)!");
    } catch (err) {
      console.error("Failed to generate and export report", err);
      alert("Error exporting report to Google Docs.");
    } finally {
      setExportingDoc(false);
    }
  };

  const getBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const fetchDocumentForAI = async () => {
    if (!selectedDocument) return null;
    
    try {
      let base64Data = "";
      if (selectedDocument.driveId && googleAccessToken) {
        const blob = await GoogleWorkspaceService.downloadDriveFile(googleAccessToken, selectedDocument.driveId);
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else if (selectedDocument.url) {
        base64Data = await getBase64(selectedDocument.url);
      }
  
      if (!base64Data) return null;
  
      return {
        inlineData: {
          data: base64Data,
          mimeType: selectedDocument.mimeType,
        }
      };
    } catch (error) {
      console.error("Failed to prepare document for AI", error);
      return null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          setAudioBase64(base64data);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioBase64(null); // Clear previous
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const onSubmitNote = async (data: NoteFormValues) => {
    setGenerating(true);
    setGeneratedNote("");

    const promptText = `You are an NDIS certified clinical note writer. Generate a professional, evidence-based progress note for the following session:

Client: ${data.clientName}
Session Type: ${data.sessionType}
Duration: ${data.duration} minutes
Goals Addressed: ${data.goals || "General support goals"}
Practitioner Observation: ${data.observation}
Session Outcome: ${data.outcome || "Progress noted"}

Write a formal progress note with these sections:
1. Session Overview (1-2 sentences)
2. Participant Presentation & Engagement (how the participant presented, level of engagement, mood, affect)
3. Activities & Interventions (specific strategies used)
4. Goal Progress Update (measurable language, reference to outcomes)
5. Practitioner Observations & Analysis (clinical insight)
6. Recommendations & Next Steps (concrete actions for next session)

Use formal, third-person clinical language. Keep under 350 words. NDIS PRODA compliant.`;

    try {
      const parts: any[] = [];
      if (audioBase64) {
        parts.push({ inlineData: { data: audioBase64, mimeType: "audio/webm" } });
        parts.push({ text: "Please use the provided audio recording as the primary source of observations for this note. " + promptText });
      } else {
        parts.push({ text: promptText });
      }

      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const response = await generateGeminiContent({ prompt: parts });
      setGeneratedNote((response.data as any).text || "Failed to generate note.");
    } catch {
      setGeneratedNote("Error: Could not connect to Gemini.");
    } finally {
      setGenerating(false);
      setAudioBase64(null);
    }
  };

  const handleSaveNote = () => {
    if (!generatedNote) return;
    setSavedNotes(prev => [{
      id: Date.now().toString(),
      client: form.getValues().clientName,
      type: form.getValues().sessionType,
      date: new Date().toLocaleDateString("en-AU"),
      content: generatedNote
    }, ...prev]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      let contextStr = "";
      if (useKnowledgeBase) {
        // 1. Static KB rules
        const kbResponse = await knowledgeRetrieval.queryKnowledgeBase(userMsg, userRole || 'Admin');
        contextStr = `\nKnowledge Base Rules:\n${kbResponse}\n`;

        // 2. Dynamic Vault Semantic Search
        const relevantDocs = await searchSimilarDocuments(userMsg, vaultDocuments, 2);
        if (relevantDocs.length > 0) {
          const docsText = relevantDocs.map(d => `--- Document: ${d.name} ---\n${d.textContent || "No text"}`).join("\n\n");
          contextStr += `\nRelevant Vault Documents:\n${docsText}\n`;
        }
      }

      const conversationHistory = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
      
      const docPart = await fetchDocumentForAI();
      const promptText = `You are an NDIS clinical support AI for Breakthrough Coaching & Consulting. You have expert knowledge of: NDIS practice standards, Behaviour Support Plans, positive behaviour support strategies, NDIS pricing catalogue, PRODA, funding categories, and participant-centred care.
${contextStr}
Conversation so far:
${conversationHistory}

User: ${userMsg}

Respond helpfully, accurately, and concisely. Use Australian spelling. If asked about pricing, note rates may change and to verify on the NDIS website.`;

      const parts: any[] = [];
      if (docPart) parts.push(docPart);
      parts.push({ text: promptText });

      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const resp = await generateGeminiContent({ prompt: parts });
      
      setMessages(prev => [...prev, { role: "assistant", content: (resp.data as any).text || "I couldn't generate a response. Please try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to Gemini." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Clinical Assistant</h2>
        <p className="text-muted-foreground">Generate NDIS-compliant progress notes and get instant clinical support from Gemini AI.</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setMode("notes")}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", mode === "notes" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <FileText className="h-4 w-4" /> Progress Notes
        </button>
        <button
          onClick={() => setMode("chat")}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", mode === "chat" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <MessageSquare className="h-4 w-4" /> Clinical Chat
        </button>
      </div>

      {mode === "notes" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-1 flex flex-col h-full">
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <div className="space-y-1">
                <CardTitle>Session Details</CardTitle>
                <CardDescription>Enter session information to auto-generate a clinical progress note.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={importFieldNotes} disabled={fetchingTasks} className="shrink-0 ml-2" title="Import Field Notes from Google Tasks">
                <ListTodo className="mr-2 h-4 w-4" />
                {fetchingTasks ? "Importing..." : "Sync Notes"}
              </Button>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmitNote)} className="flex-1 flex flex-col">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input id="clientName" {...form.register("clientName")} placeholder="e.g. Alice Johnson" />
                  {form.formState.errors.clientName && <p className="text-xs text-red-500">{form.formState.errors.clientName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <Controller
                    name="sessionType"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        <SelectContent>
                          {SESSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.sessionType && <p className="text-xs text-red-500">{form.formState.errors.sessionType.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" min="15" max="480" step="15" {...form.register("duration")} />
                  {form.formState.errors.duration && <p className="text-xs text-red-500">{form.formState.errors.duration.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goals">Goals Addressed</Label>
                  <textarea id="goals" {...form.register("goals")} placeholder="Which NDIS goals were targeted?" className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 min-h-[60px] outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="observation">Practitioner Observation *</Label>
                    <div className="flex gap-2">
                      {isRecording ? (
                        <Button type="button" variant="destructive" size="sm" onClick={stopRecording} className="h-7 text-xs">
                          <Square className="mr-1 h-3 w-3 fill-current" /> Stop
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={startRecording} className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50">
                          <Mic className="mr-1 h-3 w-3" /> Record Audio Note
                        </Button>
                      )}
                    </div>
                  </div>
                  {audioBase64 && !isRecording && (
                    <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-md border border-emerald-100 flex items-center gap-2">
                      <CheckCheck className="h-3 w-3" /> Audio recorded successfully and ready for analysis.
                      <button type="button" onClick={() => setAudioBase64(null)} className="ml-auto text-emerald-800 hover:underline">Clear</button>
                    </div>
                  )}
                  {isRecording && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100 flex items-center gap-2 animate-pulse">
                      <Mic className="h-3 w-3" /> Recording in progress... speak clearly.
                    </div>
                  )}
                  <textarea id="observation" {...form.register("observation")} placeholder="What did you observe during the session? Key moments, strategies used, participant response..." className="w-full text-sm bg-transparent rounded-lg border border-border px-3 py-2 min-h-[100px] outline-none focus:ring-1 focus:ring-primary" />
                  {form.formState.errors.observation && <p className="text-xs text-red-500">{form.formState.errors.observation.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Session Outcome</Label>
                  <Controller
                    name="outcome"
                    control={form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select outcome..." /></SelectTrigger>
                        <SelectContent>
                          {OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={generating}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generating ? "Generating Note..." : "Generate Progress Note"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Generated Note */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-500" />Generated Progress Note</CardTitle>
                    <CardDescription>NDIS PRODA-compliant format. Review before submission.</CardDescription>
                  </div>
                  {generatedNote && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                      <Button size="sm" onClick={handleSaveNote}>Save Note</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generating ? (
                  <div className="space-y-3 animate-pulse">
                    {[90, 70, 80, 60, 85, 75, 65].map((w, i) => (
                      <div key={i} className="h-3 bg-muted rounded" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : generatedNote ? (
                  <div className="max-h-[420px] overflow-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{generatedNote}</pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Your progress note will appear here.<br />Fill in the session details and click Generate.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Notes */}
            {savedNotes.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-semibold">Saved Notes This Session</CardTitle>
                  <Button variant="outline" size="sm" onClick={generateEndOfPlanReport} disabled={exportingDoc} className="h-8">
                    <DownloadCloud className="mr-2 h-3.5 w-3.5" />
                    {exportingDoc ? "Exporting..." : "Export to Google Docs"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedNotes.map(note => (
                    <div key={note.id} className="p-3 border rounded-lg space-y-1 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{note.client}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{note.type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{note.date}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Chat Mode */
        <Card className="flex flex-col" style={{ height: "600px" }}>
          <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-500" />NDIS Clinical Chat</CardTitle>
              <CardDescription>Ask anything about NDIS practice, BSP strategies, funding, or compliance.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed", msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm")}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <div className="p-4 border-t border-border/40 space-y-3">
            {selectedDocument && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-md text-xs w-fit">
                <FileIcon className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{selectedDocument.name}</span>
                <button type="button" onClick={() => setSelectedDocument(null)} className="hover:text-red-500 ml-2">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <form onSubmit={handleChat} className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsAttachModalOpen(true); loadDriveFiles(); }}
                disabled={chatLoading}
                title="Attach Document for AI Analysis"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about NDIS, BSP strategies, billing codes..."
                className="flex-1"
                disabled={chatLoading}
              />
              <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
                <Sparkles className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center gap-2 px-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useKnowledgeBase} 
                  onChange={e => setUseKnowledgeBase(e.target.checked)}
                  className="rounded border-border text-indigo-600 focus:ring-indigo-500 bg-transparent"
                />
                <Database className="h-3 w-3" />
                Include General Knowledge Base Context
              </label>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={isAttachModalOpen} onOpenChange={setIsAttachModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Attach Document</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="vault" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start border-b rounded-none pb-0 bg-transparent h-auto p-0">
              <TabsTrigger value="vault" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3">NDIS Vault</TabsTrigger>
              <TabsTrigger value="drive" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3">Google Drive</TabsTrigger>
            </TabsList>
            
            <TabsContent value="vault" className="flex-1 overflow-auto p-4 m-0 outline-none">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vaultDocuments.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-8 text-sm">No documents found in the vault.</p>
                ) : (
                  vaultDocuments.map(doc => (
                    <div 
                      key={doc.id} 
                      onClick={() => {
                        setSelectedDocument({ name: doc.name, url: doc.url, mimeType: doc.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain' });
                        setIsAttachModalOpen(false);
                      }}
                      className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer flex flex-col items-center text-center gap-2 transition-colors"
                    >
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs font-medium line-clamp-2 break-all">{doc.name}</span>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="drive" className="flex-1 overflow-auto p-4 m-0 outline-none">
              {!googleAccessToken ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">Sign in with Google to access your Drive files.</p>
                </div>
              ) : fetchingDrive ? (
                <div className="flex justify-center items-center py-12">
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {driveFiles.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground py-8 text-sm">No recent documents found in Google Drive.</p>
                  ) : (
                    driveFiles.map(file => (
                      <div 
                        key={file.id} 
                        onClick={() => {
                          setSelectedDocument({ name: file.name, driveId: file.id, mimeType: file.mimeType });
                          setIsAttachModalOpen(false);
                        }}
                        className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer flex flex-col items-center text-center gap-2 transition-colors"
                      >
                        {file.iconLink ? (
                          <img src={file.iconLink} alt="" className="h-8 w-8" />
                        ) : (
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium line-clamp-2 break-all">{file.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
