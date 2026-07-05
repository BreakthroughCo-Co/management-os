import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Progress } from "@/presentation/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockSystemData = [
  { name: "10:00", writes: 120, latency: 45 },
  { name: "11:00", writes: 340, latency: 89 },
  { name: "12:00", writes: 230, latency: 50 },
  { name: "13:00", writes: 450, latency: 120 },
  { name: "14:00", writes: 600, latency: 98 },
  { name: "15:00", writes: 280, latency: 40 }
];

export function ObservabilityDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Observability Console</h2>
        <p className="text-muted-foreground">Monitor system metrics, Firestore API loads, security audits, and latency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Firestore Read Load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">14,230 req / hr</div>
            <Progress value={45} className="h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">API Latency (Gemini / Auth)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">78ms</div>
            <Progress value={20} className="h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Database Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">48 concurrent</div>
            <Progress value={80} className="h-1.5 bg-slate-100" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Write API Call Load & Latency Trends</CardTitle>
          <CardDescription>Hourly analysis of database transactions.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockSystemData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="writes" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
              <Area type="monotone" dataKey="latency" stroke="#fb923c" fill="#ffedd5" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
