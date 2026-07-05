import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { LayoutDashboard, ShieldAlert, FileWarning, Clock, Play } from "lucide-react";

export function CommandCenter() {
  const stats = [
    { name: "Active Participants", value: "142", sub: "18 in intake phase", icon: LayoutDashboard },
    { name: "Clinical Safety Flags", value: "3", sub: "Needs urgent review", icon: ShieldAlert, alert: true },
    { name: "Plan Rollovers Needed", value: "12", sub: "Expiring in 30 days", icon: FileWarning },
    { name: "Scheduled Hours Today", value: "32.5 hrs", sub: "8 appointments", icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
        <p className="text-muted-foreground">Unified real-time clinical operations board and administrative task scheduler.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className={stat.alert ? "border-red-200 bg-red-50/50" : ""}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.alert ? "text-red-500 animate-bounce" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.alert ? "text-red-900" : ""}`}>{stat.value}</div>
              <p className={`text-xs mt-1 ${stat.alert ? "text-red-700" : "text-muted-foreground"}`}>{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Board */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Operational Task queue</CardTitle>
            <CardDescription>Actions requiring practitioner or coordinator triggers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3.5 border rounded-lg bg-slate-50/50">
              <div>
                <h4 className="font-semibold text-sm">Review safety flag: Charlie Davis</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned following an incident on 2026-07-03.</p>
              </div>
              <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">Resolve</Button>
            </div>
            <div className="flex justify-between items-center p-3.5 border rounded-lg bg-slate-50/50">
              <div>
                <h4 className="font-semibold text-sm">Approve BSP draft: Bob Smith</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Clinical lead signature required.</p>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Approve BSP</Button>
            </div>
          </CardContent>
        </Card>

        {/* Live System Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Safety Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg border-red-100 bg-red-50/30">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-red-950">Choking risk flagged</h4>
                <p className="text-xs text-red-900 leading-relaxed">Charlie Davis was flagged with moderate choking hazard.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
