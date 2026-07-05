import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { Download, FileLineChart, TrendingUp, Users, Activity, Filter, GripVertical, AlertTriangle, FileSpreadsheet, Presentation } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { GoogleWorkspaceService } from "@/core/services/GoogleWorkspaceService";

import { useIncidentsQuery } from "@/data/repositories/IncidentRepository";
import { useAnalyticsChartsQuery } from "@/data/repositories/AnalyticsRepository";

const COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#64748b"];

// Fallback for Incident Data if repository returns empty
const FALLBACK_INCIDENT_DATA = [
  { name: "Behavioural", count: 45 },
  { name: "Medical", count: 12 },
  { name: "Environmental", count: 8 },
  { name: "Other", count: 5 },
];

export function AnalyticsEngine() {
  const [reportType, setReportType] = useState("burn-rate");
  const { data: incidents = [] } = useIncidentsQuery();
  const { data: chartsData, isLoading } = useAnalyticsChartsQuery();
  const { googleAccessToken } = useAuthStore();
  
  const [exportingSheet, setExportingSheet] = useState(false);
  const [exportingSlides, setExportingSlides] = useState(false);

  const handleExportSheet = async () => {
    if (!googleAccessToken) return alert("Please sign in with Google to export to Sheets.");
    setExportingSheet(true);
    try {
      // 1. Generate Forecast Summary via Gemini
      const functions = getFunctions(app);
      const generateGeminiContent = httpsCallable(functions, "generateGeminiContent");
      const prompt = `Analyze this monthly burn rate data for an NDIS participant: ${JSON.stringify(chartsData?.monthlyBurn)}. Provide a 2-sentence financial forecast and predict if/when funds will run out.`;
      
      const resp = await generateGeminiContent({ prompt });
      const forecastText = (resp.data as any).text || "Forecast unavailable.";

      // 2. Prepare Data for Sheets
      const rows = [
        ["Month", "Budget", "Actual Spend"],
        ...(chartsData?.monthlyBurn || []).map((m: any) => [m.month, m.budget, m.actual]),
        [],
        ["Gemini AI Forecast", forecastText]
      ];

      // 3. Export
      const folderId = await GoogleWorkspaceService.getOrCreateExportFolder(googleAccessToken);
      await GoogleWorkspaceService.createSpreadsheet(googleAccessToken, `Financial Forecast - ${new Date().toLocaleDateString()}`, rows, folderId);
      alert("Successfully exported to Google Sheets!");
    } catch (err) {
      console.error(err);
      alert("Error exporting to Google Sheets.");
    } finally {
      setExportingSheet(false);
    }
  };

  const handleExportSlides = async () => {
    if (!googleAccessToken) return alert("Please sign in with Google to export to Slides.");
    setExportingSlides(true);
    try {
      const folderId = await GoogleWorkspaceService.getOrCreateExportFolder(googleAccessToken);
      await GoogleWorkspaceService.createPresentation(googleAccessToken, `NDIS Review Deck - ${new Date().toLocaleDateString()}`, [], folderId);
      alert("Successfully generated blank slide deck in Google Drive (Management OS Exports folder)!");
    } catch (err) {
      console.error(err);
      alert("Error exporting to Google Slides.");
    } finally {
      setExportingSlides(false);
    }
  };

  const dynamicIncidentData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(inc => {
      counts[inc.type] = (counts[inc.type] || 0) + 1;
    });
    const result = Object.entries(counts).map(([name, count]) => ({ name, count }));
    if (result.length === 0) return FALLBACK_INCIDENT_DATA; 
    return result;
  }, [incidents]);

  if (isLoading || !chartsData) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading analytics data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Analytics & Reporting</h2>
          <p className="text-muted-foreground">Custom report builder and advanced visualizations for compliance and management.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSheet} disabled={exportingSheet} className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
            <FileSpreadsheet className="h-4 w-4" /> {exportingSheet ? "Exporting..." : "Financial Forecast"}
          </Button>
          <Button variant="outline" onClick={handleExportSlides} disabled={exportingSlides} className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
            <Presentation className="h-4 w-4" /> {exportingSlides ? "Exporting..." : "Review Presentation"}
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Download className="h-4 w-4" /> Export Raw PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Report Builder Sidebar */}
        <Card className="md:col-span-1 border-dashed border-2">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-sm flex items-center gap-2"><FileLineChart className="h-4 w-4 text-indigo-500" /> Report Builder</CardTitle>
            <CardDescription className="text-xs">Select metrics to compile your custom report.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Primary Metric</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="burn-rate">Funding Burn Rate</SelectItem>
                  <SelectItem value="incidents">Incident Trends</SelectItem>
                  <SelectItem value="outcomes">Clinical Outcomes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <label className="text-xs font-semibold text-muted-foreground">Drag to Reorder Sections</label>
              <div className="space-y-2">
                {["Executive Summary", "Visualizations", "Raw Data Table"].map((item) => (
                  <div key={item} className="flex items-center gap-2 p-2 bg-accent rounded-lg border text-xs cursor-move">
                    <GripVertical className="h-4 w-4 text-muted-foreground" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Display */}
        <div className="md:col-span-3 space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Burn Rate</p>
                  <p className="text-xl font-bold">104%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Goal Attainment</p>
                  <p className="text-xl font-bold">+32%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Open Incidents</p>
                  <p className="text-xl font-bold">{dynamicIncidentData.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart Area */}
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle>
                {reportType === "burn-rate" && "Participant Funding Burn Rate (YTD)"}
                {reportType === "incidents" && "Incident Breakdown by Category"}
                {reportType === "outcomes" && "Pre vs Post Intervention Outcomes"}
              </CardTitle>
              <CardDescription>Live data aggregation from all connected client plans.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {reportType === "burn-rate" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartsData.monthlyBurn} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dx={-10} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #334155' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Area type="monotone" dataKey="budget" name="Allocated Budget" stroke="#94a3b8" fillOpacity={1} fill="url(#colorBudget)" />
                    <Area type="monotone" dataKey="actual" name="Actual Spend" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              
              {reportType === "incidents" && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicIncidentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {dynamicIncidentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {reportType === "outcomes" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.outcomes} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="metric" axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="pre" name="Baseline Score" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="post" name="Current Score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
