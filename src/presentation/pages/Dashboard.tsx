import { Activity, Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardStatsQuery, HeatmapDataPoint, BurnRateGauge } from "@/data/repositories/AnalyticsRepository";
import { GoogleCalendarWidget } from "../components/workspace/GoogleCalendarWidget";
import { GoogleDriveWidget } from "../components/workspace/GoogleDriveWidget";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HeatCell({ count }: { count: number }) {
  const intensity =
    count === 0 ? "bg-slate-100 dark:bg-slate-800"
    : count <= 2 ? "bg-blue-100 dark:bg-blue-950"
    : count <= 4 ? "bg-blue-300 dark:bg-blue-700"
    : count <= 6 ? "bg-blue-500 dark:bg-blue-500"
    : "bg-blue-700 dark:bg-blue-300";

  return (
    <div
      title={`${count} sessions`}
      className={`h-4 w-4 rounded-sm ${intensity} transition-colors cursor-pointer hover:ring-2 hover:ring-blue-400`}
    />
  );
}

function SessionHeatmap({ data }: { data: HeatmapDataPoint[] }) {
  const weeks = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-[10px] text-muted-foreground ml-8">
        {weeks.map(w => (
          <div key={w} className="w-4 text-center">{w === 0 ? "Now" : w === 11 ? "-12w" : ""}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
          {DAY_LABELS.map(d => (
            <div key={d} className="h-4 flex items-center">{d}</div>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map(week => (
            <div key={week} className="flex flex-col gap-1">
              {Array.from({ length: 7 }, (_, day) => {
                const cell = data.find(c => c.week === week && c.day === day);
                return <HeatCell key={day} count={cell?.count ?? 0} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-8 mt-2">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[0, 2, 4, 6, 8].map(v => <HeatCell key={v} count={v} />)}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}

function FundingBurnRateGauge({ data }: { data: BurnRateGauge }) {
  const percentage = data.percentage;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
      <div className="relative h-32 w-32 flex items-center justify-center">
        <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} className="stroke-blue-500 fill-none transition-all duration-1000 ease-out" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
        </svg>
        <div className="flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{percentage}%</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Utilized</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">${data.utilized.toLocaleString()} utilized</p>
        <p className="text-xs text-muted-foreground">of ${data.budget.toLocaleString()} NDIS plan budget</p>
      </div>
      <div className="flex justify-between w-full text-[10px] text-muted-foreground pt-2 border-t border-border/40">
        <span>Start: Oct 2025</span>
        <span className="text-amber-500 font-semibold flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> Target: {data.target}%</span>
        <span>End: Oct 2026</span>
      </div>
    </div>
  );
}

// Skeleton shimmer components
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-row items-center justify-between animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-7 w-16 bg-muted rounded" />
      </div>
      <div className="h-10 w-10 bg-muted rounded-full" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm animate-pulse">
      <div className="p-6 border-b border-border/40 space-y-2">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-3 w-56 bg-muted rounded" />
      </div>
      <div className="p-6 h-[320px] flex items-end gap-2">
        {[60, 80, 50, 90, 70, 85].map((h, i) => (
          <div key={i} className="flex-1 bg-muted rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading } = useDashboardStatsQuery();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  const stats = [
    { name: "Active Clients", value: data.stats.activeClients.value, icon: Users, change: data.stats.activeClients.change },
    { name: "Pending Approvals", value: data.stats.pendingApprovals.value, icon: FileText, change: data.stats.pendingApprovals.change },
    { name: "Sessions Today", value: data.stats.sessionsToday.value, icon: Activity, change: data.stats.sessionsToday.change },
    { name: "Compliance Rate", value: data.stats.complianceRate.value, icon: CheckCircle2, change: data.stats.complianceRate.change },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <stat.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Claims Chart + Burn Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
            <h3 className="font-semibold leading-none tracking-tight">NDIS Claim Velocity</h3>
            <p className="text-sm text-muted-foreground">Weekly claims vs actual paid values.</p>
          </div>
          <div className="p-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.claims} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="week" className="text-xs fill-slate-500" />
                <YAxis className="text-xs fill-slate-500" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Area type="monotone" dataKey="claims" stroke="#10b981" fillOpacity={1} fill="url(#colorClaims)" name="Claims Submitted ($)" />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" name="Claims Paid ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
            <h3 className="font-semibold leading-none tracking-tight">Active Plan Burn Rate</h3>
            <p className="text-sm text-muted-foreground">Cumulative NDIS funding utilisation rate.</p>
          </div>
          <div className="p-6">
            <FundingBurnRateGauge data={data.burnGauge} />
          </div>
        </div>
      </div>

      {/* Google Workspace Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoogleCalendarWidget />
        <GoogleDriveWidget />
      </div>

      {/* Session Heatmap + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
            <h3 className="font-semibold leading-none tracking-tight">Session Frequency Heatmap</h3>
            <p className="text-sm text-muted-foreground">Support session delivery intensity over 12 weeks.</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <SessionHeatmap data={data.heatmap} />
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
            <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Latest updates across your workspace.</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[
                { text: "New Service Agreement created", sub: "2 hours ago · Jane Doe", color: "bg-emerald-500" },
                { text: "Incident report submitted", sub: "4 hours ago · Mark Chen", color: "bg-red-500" },
                { text: "Plan review completed", sub: "Yesterday · Sarah Kim", color: "bg-blue-500" },
                { text: "Staff training milestone reached", sub: "2 days ago · HR Team", color: "bg-amber-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 text-sm">
                  <div className={`h-2 w-2 mt-1.5 rounded-full ${item.color}`} />
                  <div className="grid gap-1">
                    <p className="font-medium leading-none">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
