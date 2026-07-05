import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Loader2, ClipboardCheck, AlertTriangle, UserPlus, Sparkles } from "lucide-react";
import { GoogleWorkspaceService, DriveFile } from "@/core/services/GoogleWorkspaceService";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { Badge } from "@/presentation/components/ui/badge";

export function IntakePipeline() {
  const { googleAccessToken } = useAuthStore();
  const [forms, setForms] = useState<DriveFile[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [responses, setResponses] = useState<any[]>([]);
  const [fetchingForms, setFetchingForms] = useState(false);
  const [fetchingResponses, setFetchingResponses] = useState(false);
  
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any>>({});

  useEffect(() => {
    if (googleAccessToken) {
      loadForms();
    }
  }, [googleAccessToken]);

  const loadForms = async () => {
    if (!googleAccessToken) return;
    setFetchingForms(true);
    try {
      const formFiles = await GoogleWorkspaceService.fetchForms(googleAccessToken);
      setForms(formFiles);
      if (formFiles.length > 0) {
        setSelectedFormId(formFiles[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingForms(false);
    }
  };

  useEffect(() => {
    if (selectedFormId && googleAccessToken) {
      loadResponses(selectedFormId);
    }
  }, [selectedFormId, googleAccessToken]);

  const loadResponses = async (formId: string) => {
    setFetchingResponses(true);
    try {
      const resp = await GoogleWorkspaceService.fetchFormResponses(googleAccessToken!, formId);
      setResponses(resp);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingResponses(false);
    }
  };

  const analyzeResponse = async (responseId: string, answers: any) => {
    setAnalyzing(prev => ({ ...prev, [responseId]: true }));
    try {
      const prompt = `Analyze this NDIS initial assessment form response. 
      Identify:
      1. Name of the participant.
      2. Any high-risk behaviors (e.g. self-harm, aggression, absconding).
      3. A short summary of their support needs.
      
      Form data: ${JSON.stringify(answers)}`;
      
      const responseSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          highRisk: { type: "boolean" },
          riskDetails: { type: "string" },
          summary: { type: "string" }
        },
        required: ["name", "highRisk", "riskDetails", "summary"]
      };

      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      
      const result = await generateGeminiContent({ 
        prompt, 
        responseSchema 
      });
      
      const parsed = JSON.parse((result.data as any).text);
      setAiAnalysis(prev => ({ ...prev, [responseId]: parsed }));
    } catch (err) {
      console.error(err);
      alert("Error analyzing with Gemini");
    } finally {
      setAnalyzing(prev => ({ ...prev, [responseId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Intake Pipeline</h2>
        <p className="text-muted-foreground">Monitor your Google Forms for new participants and use AI to automatically assess risk.</p>
      </div>

      {!googleAccessToken ? (
        <Card className="p-8 text-center text-muted-foreground">
          Please sign in with Google to view your intake forms.
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-sm">Select Intake Form</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {fetchingForms ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your forms...
                </div>
              ) : (
                <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Select a Google Form..." />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" /> Form Responses
            </h3>
            
            {fetchingResponses ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : responses.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No responses found for this form.</Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {responses.map((response) => (
                  <Card key={response.responseId} className="overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-card">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Response ID: {response.responseId.substring(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">Submitted: {new Date(response.createTime).toLocaleString()}</p>
                      </div>
                      {!aiAnalysis[response.responseId] ? (
                        <Button size="sm" onClick={() => analyzeResponse(response.responseId, response.answers)} disabled={analyzing[response.responseId]}>
                          {analyzing[response.responseId] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                          Analyze Risk
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                          <UserPlus className="h-4 w-4 mr-2" /> Add Client Profile
                        </Button>
                      )}
                    </div>
                    
                    {aiAnalysis[response.responseId] && (
                      <div className="p-4 bg-muted/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase font-bold text-muted-foreground mb-1">AI Extracted Name</p>
                          <p className="font-semibold text-foreground">{aiAnalysis[response.responseId].name || "Unknown"}</p>
                          
                          <p className="text-xs uppercase font-bold text-muted-foreground mt-4 mb-1">Support Needs Summary</p>
                          <p className="text-sm text-foreground">{aiAnalysis[response.responseId].summary}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Risk Assessment</p>
                          {aiAnalysis[response.responseId].highRisk ? (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                              <div className="flex items-center gap-2 mb-2 font-semibold">
                                <AlertTriangle className="h-4 w-4" /> High Risk Identified
                              </div>
                              <p className="text-xs">{aiAnalysis[response.responseId].riskDetails}</p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">No High Risk Behaviours Flagged</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
