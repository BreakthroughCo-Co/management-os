import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../../lib/firebase';
import { 
  ClipboardCheck, 
  BrainCircuit, 
  Activity,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from "../../../lib/utils";

// Types
type AssessmentType = 'FAST' | 'QABF' | 'MAS';

interface AssessmentFormProps {
  onSubmit: (data: any) => void;
}

// Subcomponents for each form type
const FASTForm = ({ onSubmit }: AssessmentFormProps) => {
  const questions = [
    "Does the behaviour usually occur when the person is not receiving attention?",
    "Does the behaviour usually occur when the person is asked to do something?",
    "Does the behaviour usually occur when the person is left alone?",
    "Does the behaviour usually occur when preferred items/activities are taken away?"
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300">Functional Analysis Screening Tool (FAST)</h3>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          Designed to identify factors that may influence the occurrence of problem behaviours.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit({}); }} className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="flex flex-col gap-2 pb-4 border-b border-border">
            <label className="text-sm font-medium">{i + 1}. {q}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name={`q${i}`} value="yes" className="accent-primary" /> Yes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name={`q${i}`} value="no" className="accent-primary" /> No
              </label>
            </div>
          </div>
        ))}
        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save & Analyze
        </button>
      </form>
    </div>
  );
};

const QABFForm = ({ onSubmit }: AssessmentFormProps) => {
  const questions = [
    "Engages in the behaviour to get attention.",
    "Engages in the behaviour to escape work or learning situations.",
    "Engages in the behaviour when there is nothing else to do.",
    "Engages in the behaviour to get access to items they like.",
    "Engages in the behaviour because they are in pain or physically uncomfortable."
  ];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-800 dark:text-purple-300">Questions About Behavioural Function (QABF)</h3>
        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
          A rating scale to guide comprehensive analysis of the functions of behaviours of concern.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit({}); }} className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="flex flex-col gap-2 pb-4 border-b border-border">
            <label className="text-sm font-medium">{i + 1}. {q}</label>
            <select name={`q${i}`} className="p-2 text-sm border border-input rounded-md bg-background w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="0">0 - Never</option>
              <option value="1">1 - Rarely</option>
              <option value="2">2 - Some</option>
              <option value="3">3 - Often</option>
            </select>
          </div>
        ))}
        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save & Analyze
        </button>
      </form>
    </div>
  );
};

const MASForm = ({ onSubmit }: AssessmentFormProps) => {
  const questions = [
    "Would the behaviour occur continuously if the person was left alone?",
    "Does the behaviour occur following a request to perform a difficult task?",
    "Does the behaviour seem to occur in response to your talking to other persons?",
    "Does the behaviour ever occur to get a toy, food, or activity that they were told they couldn't have?"
  ];

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Motivation Assessment Scale (MAS)</h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
          Assesses the functions of behaviours (Sensory, Escape, Attention, Tangible).
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit({}); }} className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="flex flex-col gap-2 pb-4 border-b border-border">
            <label className="text-sm font-medium">{i + 1}. {q}</label>
            <select name={`q${i}`} className="p-2 text-sm border border-input rounded-md bg-background w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="0">0 - Never</option>
              <option value="1">1 - Almost Never</option>
              <option value="2">2 - Seldom</option>
              <option value="3">3 - Half the Time</option>
              <option value="4">4 - Usually</option>
              <option value="5">5 - Almost Always</option>
              <option value="6">6 - Always</option>
            </select>
          </div>
        ))}
        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save & Analyze
        </button>
      </form>
    </div>
  );
};

export const FBAAssessments = () => {
  const [activeTab, setActiveTab] = useState<AssessmentType>('FAST');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      
      const prompt = `Analyze this simulated ${activeTab} assessment data and generate a clinical hypothesis for the behaviour's function (e.g. Attention, Escape, Tangible, Sensory). Format as a short Markdown report.`;
      
      const response = await generateGeminiContent({ prompt });
      setAiAnalysis((response.data as any).text);
    } catch (err) {
      console.error(err);
      setAiAnalysis("Error generating AI analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Digitised FBAs</h1>
          <p className="text-muted-foreground mt-1">Functional Behaviour Assessments (FAST, QABF, MAS)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Selector & Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex">
            {(['FAST', 'QABF', 'MAS'] as AssessmentType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab 
                    ? "border-primary text-primary bg-primary/5" 
                    : "border-transparent text-muted-foreground hover:bg-muted/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            {activeTab === 'FAST' && <FASTForm onSubmit={handleSubmit} />}
            {activeTab === 'QABF' && <QABFForm onSubmit={handleSubmit} />}
            {activeTab === 'MAS' && <MASForm onSubmit={handleSubmit} />}
          </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px] sticky top-8">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold">AI Hypothesis Generator</h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Scoring assessment and generating hypothesis...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center px-4 space-y-2">
                  <Activity className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm">Submit an assessment to generate a clinical hypothesis of the behaviour's function.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
