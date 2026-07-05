import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import app, { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Button } from "@/presentation/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

export function PlanUtilisation() {
  const [clientId, setClientId] = useState("");
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Mock data for burn rate chart
  const data = [
    { month: 'Jan', spent: 1200, budget: 10000 },
    { month: 'Feb', spent: 2500, budget: 10000 },
    { month: 'Mar', spent: 3900, budget: 10000 },
    { month: 'Apr', spent: 5100, budget: 10000 },
    { month: 'May', spent: 7000, budget: 10000 }, // Over-pacing
  ];

  const handleGenerateInsight = async () => {
    if (!clientId) return;
    setLoadingInsight(true);
    setAiInsight(null);
    try {
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      
      const prompt = `You are an NDIS financial analyst. Analyze this participant's spending velocity and remaining budget to project potential overspend or underspend by their plan end date. Generate actionable recommendations (e.g. increase therapy hours).
      
      Budget: $10,000
      Months passed: 5
      Total Spent: $7,000
      Current trajectory: On track to spend $16,800 by month 12.
      
      Provide a short, punchy summary and 2-3 specific recommendations.`;
      
      const response = await generateGeminiContent({ prompt });
      setAiInsight((response.data as any).text);
    } catch (error) {
      console.error(error);
      setAiInsight("Failed to generate AI insight. Please try again.");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Plan Utilisation</h2>
        <p className="text-muted-foreground">Track NDIS participant budget allocations, expenditure, and burn rates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Participant</CardTitle>
            <CardDescription>View utilisation and AI projections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Participant</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a participant..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_1">Charlie Davis (NDIS: 430...)</SelectItem>
                  <SelectItem value="client_2">Alice Smith (NDIS: 552...)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {clientId && (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                    <p className="text-lg font-bold">$10,000</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-lg font-bold text-amber-600">$7,000</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Utilisation Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[70%]" />
                    </div>
                    <span className="text-xs font-medium">70%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Spending is tracking higher than expected.</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={handleGenerateInsight} 
              disabled={!clientId || loadingInsight}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loadingInsight ? "Analyzing Velocity..." : "Generate AI Projection"}
            </Button>
          </CardFooter>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {aiInsight && (
            <Card className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" /> 
                  Gemini Predictive Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-indigo-950 dark:text-indigo-200">
                  {aiInsight}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Burn Rate Projection</CardTitle>
              <CardDescription>Cumulative expenditure vs total budget across the plan period.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {clientId ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(val) => `$${val}`} />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <ReferenceLine y={10000} label="Total Budget" stroke="red" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="spent" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Cumulative Spend" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a participant to view burn rate.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
