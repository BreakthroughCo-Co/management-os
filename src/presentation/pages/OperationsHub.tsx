import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, TrendingUp, Users, Blocks, ArrowRight, Sparkles,
  AlertTriangle, CheckCircle2, Clock, FileWarning, Activity,
  DollarSign, BarChart2, FileSignature, XCircle, Layers,
  UserCheck, GraduationCap, Briefcase, Flame, Target,
  RefreshCw, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Progress } from "@/presentation/components/ui/progress";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ComplianceMetrics {
  auditDaysRemaining: number;
  checklistPct: number;
  expiredCredentials: number;
  expiringCredentials: number;
  incidentsMtd: number;
  activeRPs: number;
  openCorrectiveActions: number;
}

interface FinanceMetrics {
  utilisationPct: number;
  revenueActual: number;
  revenueTarget: number;
  arAging: number;
  burnRatePct: number;
  expiringAgreements: number;
  claimRejectionPct: number;
  coreMarginPct: number;
  capBuildMarginPct: number;
}

interface HRMetrics {
  headcount: number;
  vacancies: number;
  trainingCompliancePct: number;
  inductionInProgress: number;
  inductionComplete: number;
  supervisionHrsMtd: number;
  supervisionTarget: number;
  credentialExpiring: number;
  turnoverPct: number;
  tierDistribution: { core: number; proficient: number; advanced: number; specialist: number };
}

interface LegoMetrics {
  sessionsMtd: number;
  sessionsPriorMonth: number;
  individualSessions: number;
  groupSessions: number;
  activeParticipants: number;
  retentionPct: number;
  facilitatorCapacityPct: number;
  waitlistCount: number;
  programRevenuePct: number;
}

// ─── Mock Data (replace with Firestore hooks in production) ──────────────────

const COMPLIANCE: ComplianceMetrics = {
  auditDaysRemaining: 14,
  checklistPct: 72,
  expiredCredentials: 2,
  expiringCredentials: 5,
  incidentsMtd: 3,
  activeRPs: 4,
  openCorrectiveActions: 2,
};

const FINANCE: FinanceMetrics = {
  utilisationPct: 78,
  revenueActual: 124800,
  revenueTarget: 150000,
  arAging: 18400,
  burnRatePct: 81,
  expiringAgreements: 3,
  claimRejectionPct: 4.2,
  coreMarginPct: 31,
  capBuildMarginPct: 44,
};

const HR: HRMetrics = {
  headcount: 14,
  vacancies: 2,
  trainingCompliancePct: 68,
  inductionInProgress: 3,
  inductionComplete: 11,
  supervisionHrsMtd: 28,
  supervisionTarget: 40,
  credentialExpiring: 4,
  turnoverPct: 14,
  tierDistribution: { core: 5, proficient: 5, advanced: 3, specialist: 1 },
};

const LEGO: LegoMetrics = {
  sessionsMtd: 34,
  sessionsPriorMonth: 28,
  individualSessions: 22,
  groupSessions: 12,
  activeParticipants: 18,
  retentionPct: 89,
  facilitatorCapacityPct: 74,
  waitlistCount: 7,
  programRevenuePct: 22,
};

// ─── Compliance Risk Score ───────────────────────────────────────────────────

function ComplianceRiskScore({ metrics }: { metrics: ComplianceMetrics }) {
  // Weighted scoring: lower raw = better compliance
  const auditRisk   = metrics.auditDaysRemaining < 7  ? 30 : metrics.auditDaysRemaining < 30 ? 15 : 0;
  const credRisk    = (metrics.expiredCredentials * 10) + (metrics.expiringCredentials * 3);
  const checkRisk   = metrics.checklistPct < 50 ? 25 : metrics.checklistPct < 80 ? 12 : 0;
  const rpRisk      = metrics.activeRPs * 4;
  const caRisk      = metrics.openCorrectiveActions * 5;
  const rawRisk     = Math.min(auditRisk + credRisk + checkRisk + rpRisk + caRisk, 100);
  const score       = 100 - rawRisk; // Invert: 100 = fully compliant

  const rag = score >= 75 ? { label: "Low Risk", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", ring: "ring-emerald-500/30", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" }
             : score >= 50 ? { label: "Moderate Risk", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", ring: "ring-amber-500/30", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" }
             : { label: "High Risk", color: "text-red-600 dark:text-red-400", bg: "bg-red-500", ring: "ring-red-500/30", badge: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" };

  const circumference = 2 * Math.PI * 40;
  const dash = (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-3 p-5 rounded-xl border ring-2 ${rag.ring} bg-card`}>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Compliance Risk Score</p>
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="currentColor" strokeWidth="10"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            className={`${rag.color} transition-all duration-700`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${rag.color}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${rag.badge}`}>{rag.label}</span>
    </div>
  );
}

// ─── Morning Briefing ────────────────────────────────────────────────────────

function MorningBriefing() {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const fns = getFunctions(app);
      const call = httpsCallable<{ prompt: string }, { text: string }>(fns, "generateGeminiContent");
      const prompt = `You are an expert NDIS Practice Manager assistant. Given the following operational snapshot for Breakthrough Coaching & Consulting, produce a concise executive morning briefing (3-5 bullet points) covering today's top priorities, risks, and recommended actions:

COMPLIANCE: Audit in ${COMPLIANCE.auditDaysRemaining} days, checklist at ${COMPLIANCE.checklistPct}%, ${COMPLIANCE.expiredCredentials} expired credentials, ${COMPLIANCE.openCorrectiveActions} open corrective actions.
FINANCE: Plan utilisation at ${FINANCE.utilisationPct}%, revenue $${FINANCE.revenueActual.toLocaleString()} vs target $${FINANCE.revenueTarget.toLocaleString()}, AR aging $${FINANCE.arAging.toLocaleString()}, ${FINANCE.expiringAgreements} service agreements expiring, claim rejection rate ${FINANCE.claimRejectionPct}%.
HR: ${HR.vacancies} vacancies, training compliance ${HR.trainingCompliancePct}%, ${HR.inductionInProgress} staff in induction, supervision ${HR.supervisionHrsMtd}/${HR.supervisionTarget} hours, ${HR.credentialExpiring} credentials expiring soon.
LEGO THERAPY: ${LEGO.sessionsMtd} sessions this month (${LEGO.sessionsMtd - LEGO.sessionsPriorMonth > 0 ? '+' : ''}${LEGO.sessionsMtd - LEGO.sessionsPriorMonth} vs last month), ${LEGO.waitlistCount} on waitlist, retention ${LEGO.retentionPct}%.

Format as plain bullet points. Be specific, direct, and action-oriented. No intro or outro sentences.`;
      const res = await call({ prompt });
      setBriefing(res.data.text);
    } catch (e: any) {
      setError("Unable to generate briefing. Check your Firebase connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Gemini Morning Briefing</p>
            <p className="text-[11px] text-muted-foreground">AI-generated daily executive summary</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 text-xs rounded-full gap-1.5"
        >
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? "Generating…" : briefing ? "Refresh" : "Generate Briefing"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {briefing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <ul className="space-y-2 mt-2">
            {briefing.split("\n").filter(l => l.trim().length > 0).map((line, i) => (
              <li key={i} className="flex gap-2 text-xs text-foreground/90 leading-relaxed">
                <ChevronRight className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>{line.replace(/^[-•*]\s*/, "")}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      {!briefing && !loading && (
        <p className="text-xs text-muted-foreground italic mt-1">Click "Generate Briefing" to get your AI-powered daily summary.</p>
      )}
    </div>
  );
}

// ─── Metric Row ──────────────────────────────────────────────────────────────

function MetricRow({ icon: Icon, label, value, status }: { icon: React.ElementType; label: string; value: string; status?: "ok" | "warn" | "alert" }) {
  const color = status === "alert" ? "text-red-500" : status === "warn" ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{label}</span>
      </div>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({
  title, description, icon: Icon, iconBg, href, children, alertCount,
}: {
  title: string; description: string; icon: React.ElementType; iconBg: string; href: string; children: React.ReactNode; alertCount?: number;
}) {
  return (
    <Card className="flex flex-col h-full border-border/60 hover:border-border hover:shadow-md transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {alertCount !== undefined && alertCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 px-2">{alertCount} alerts</Badge>
          )}
        </div>
        <CardTitle className="text-base mt-3">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {children}
      </CardContent>
      <CardFooter className="pt-4">
        <Button asChild variant="ghost" className="w-full justify-between text-xs h-8 text-muted-foreground hover:text-foreground group-hover:bg-accent/50">
          <Link to={href}>
            View full detail
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function OperationsHub() {
  const today = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sessionGrowthPct = Math.round(((LEGO.sessionsMtd - LEGO.sessionsPriorMonth) / LEGO.sessionsPriorMonth) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Operations Hub</h1>
          </div>
          <p className="text-sm text-muted-foreground">Breakthrough Coaching & Consulting · {today}</p>
        </div>
        <Badge className="text-xs self-start sm:self-auto bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
          Practice & Business Manager View
        </Badge>
      </div>

      {/* Top Row: Risk Score + Morning Briefing */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
        <ComplianceRiskScore metrics={COMPLIANCE} />
        <MorningBriefing />
      </div>

      {/* Four Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* ── Card 1: NDIS Compliance ── */}
        <SummaryCard
          title="NDIS Compliance"
          description="Audit readiness, credentials & corrective actions"
          icon={ShieldCheck}
          iconBg="bg-red-500"
          href="/risk-assessment"
          alertCount={COMPLIANCE.expiredCredentials + COMPLIANCE.openCorrectiveActions}
        >
          <div className="space-y-1">
            {/* Audit countdown */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-2 ${COMPLIANCE.auditDaysRemaining < 30 ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900" : "bg-muted/50"}`}>
              <Clock className="h-4 w-4 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">{COMPLIANCE.auditDaysRemaining} days to next audit</p>
                <p className="text-[10px] text-muted-foreground">NDIS Commission annual review</p>
              </div>
            </div>
            {/* Checklist */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">Staff compliance checklist</span>
                <span className="font-bold">{COMPLIANCE.checklistPct}%</span>
              </div>
              <Progress value={COMPLIANCE.checklistPct} className="h-1.5" />
            </div>
            <MetricRow icon={FileWarning} label="Expired credentials" value={String(COMPLIANCE.expiredCredentials)} status={COMPLIANCE.expiredCredentials > 0 ? "alert" : "ok"} />
            <MetricRow icon={AlertTriangle} label="Expiring within 90 days" value={String(COMPLIANCE.expiringCredentials)} status={COMPLIANCE.expiringCredentials > 3 ? "warn" : "ok"} />
            <MetricRow icon={Activity} label="Incidents this month" value={String(COMPLIANCE.incidentsMtd)} status={COMPLIANCE.incidentsMtd > 2 ? "warn" : "ok"} />
            <MetricRow icon={ShieldCheck} label="Active restrictive practices" value={String(COMPLIANCE.activeRPs)} status="warn" />
            <MetricRow icon={XCircle} label="Open corrective actions" value={String(COMPLIANCE.openCorrectiveActions)} status={COMPLIANCE.openCorrectiveActions > 0 ? "alert" : "ok"} />
          </div>
        </SummaryCard>

        {/* ── Card 2: Financial Reporting ── */}
        <SummaryCard
          title="Financial Reporting"
          description="Revenue, utilisation & NDIS billing health"
          icon={TrendingUp}
          iconBg="bg-emerald-600"
          href="/ndis/utilisation"
          alertCount={FINANCE.expiringAgreements}
        >
          <div className="space-y-1">
            {/* Revenue progress */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">Revenue vs target</span>
                <span className="font-bold text-emerald-600">${(FINANCE.revenueActual / 1000).toFixed(1)}k / ${(FINANCE.revenueTarget / 1000).toFixed(0)}k</span>
              </div>
              <Progress value={(FINANCE.revenueActual / FINANCE.revenueTarget) * 100} className="h-1.5" />
            </div>
            <MetricRow icon={BarChart2} label="Plan utilisation (all participants)" value={`${FINANCE.utilisationPct}%`} status={FINANCE.utilisationPct > 90 ? "alert" : FINANCE.utilisationPct > 75 ? "warn" : "ok"} />
            <MetricRow icon={DollarSign} label="AR aging (outstanding)" value={`$${FINANCE.arAging.toLocaleString()}`} status={FINANCE.arAging > 15000 ? "warn" : "ok"} />
            <MetricRow icon={Flame} label="Burn rate vs budget" value={`${FINANCE.burnRatePct}%`} status={FINANCE.burnRatePct > 85 ? "alert" : FINANCE.burnRatePct > 70 ? "warn" : "ok"} />
            <MetricRow icon={FileSignature} label="Agreements expiring soon" value={String(FINANCE.expiringAgreements)} status={FINANCE.expiringAgreements > 0 ? "warn" : "ok"} />
            <MetricRow icon={XCircle} label="Claim rejection rate" value={`${FINANCE.claimRejectionPct}%`} status={FINANCE.claimRejectionPct > 5 ? "alert" : FINANCE.claimRejectionPct > 2 ? "warn" : "ok"} />
            <MetricRow icon={Layers} label="Core support margin" value={`${FINANCE.coreMarginPct}%`} status="ok" />
          </div>
        </SummaryCard>

        {/* ── Card 3: HR ── */}
        <SummaryCard
          title="HR & Workforce"
          description="Staff compliance, induction & capability tiers"
          icon={Users}
          iconBg="bg-blue-600"
          href="/practitioners"
          alertCount={HR.vacancies + (HR.credentialExpiring)}
        >
          <div className="space-y-1">
            {/* Headcount */}
            <div className={`flex items-center justify-between rounded-lg px-3 py-2 mb-2 bg-muted/50`}>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Headcount</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">{HR.headcount}</span>
                {HR.vacancies > 0 && <span className="text-[10px] text-red-500 ml-1">({HR.vacancies} vacant)</span>}
              </div>
            </div>
            {/* Training compliance */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">Training compliance</span>
                <span className="font-bold">{HR.trainingCompliancePct}%</span>
              </div>
              <Progress value={HR.trainingCompliancePct} className="h-1.5" />
            </div>
            <MetricRow icon={GraduationCap} label="In induction pipeline" value={`${HR.inductionInProgress} of ${HR.headcount}`} status={HR.inductionInProgress > 0 ? "warn" : "ok"} />
            <MetricRow icon={Activity} label="Supervision hours MTD" value={`${HR.supervisionHrsMtd}/${HR.supervisionTarget}h`} status={HR.supervisionHrsMtd < HR.supervisionTarget * 0.6 ? "alert" : "warn"} />
            <MetricRow icon={AlertTriangle} label="Credentials expiring" value={String(HR.credentialExpiring)} status={HR.credentialExpiring > 0 ? "warn" : "ok"} />
            <MetricRow icon={UserCheck} label="Turnover rate (annualised)" value={`${HR.turnoverPct}%`} status={HR.turnoverPct > 20 ? "alert" : HR.turnoverPct > 12 ? "warn" : "ok"} />
            <div className="pt-1 flex gap-1 flex-wrap">
              {[
                { label: `${HR.tierDistribution.core} Core`, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
                { label: `${HR.tierDistribution.proficient} Proficient`, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300" },
                { label: `${HR.tierDistribution.advanced} Advanced`, color: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" },
                { label: `${HR.tierDistribution.specialist} Specialist`, color: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300" },
              ].map(t => <span key={t.label} className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${t.color}`}>{t.label}</span>)}
            </div>
          </div>
        </SummaryCard>

        {/* ── Card 4: LEGO® Therapy Growth ── */}
        <SummaryCard
          title="LEGO® Therapy Growth"
          description="Session trends, participant retention & program viability"
          icon={Blocks}
          iconBg="bg-amber-500"
          href="/lego-play"
          alertCount={LEGO.waitlistCount > 5 ? 1 : 0}
        >
          <div className="space-y-1">
            {/* Session growth */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2 mb-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Sessions this month</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{LEGO.sessionsMtd}</span>
                <span className={`text-[10px] ml-1 font-semibold ${sessionGrowthPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {sessionGrowthPct >= 0 ? "+" : ""}{sessionGrowthPct}% vs last month
                </span>
              </div>
            </div>
            {/* Facilitator capacity */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">Facilitator capacity used</span>
                <span className="font-bold">{LEGO.facilitatorCapacityPct}%</span>
              </div>
              <Progress value={LEGO.facilitatorCapacityPct} className="h-1.5" />
            </div>
            <MetricRow icon={Users} label="Active participants" value={String(LEGO.activeParticipants)} status="ok" />
            <MetricRow icon={Target} label="Participant retention" value={`${LEGO.retentionPct}%`} status={LEGO.retentionPct > 85 ? "ok" : "warn"} />
            <MetricRow icon={Activity} label="Individual / Group split" value={`${LEGO.individualSessions} / ${LEGO.groupSessions}`} status="ok" />
            <MetricRow icon={CheckCircle2} label="Waitlist pipeline" value={`${LEGO.waitlistCount} referrals`} status={LEGO.waitlistCount > 5 ? "warn" : "ok"} />
            <MetricRow icon={DollarSign} label="Program revenue share" value={`${LEGO.programRevenuePct}%`} status="ok" />
          </div>
        </SummaryCard>
      </div>

      {/* Quick Links Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Plan Utilisation", href: "/ndis/utilisation", icon: BarChart2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Worker Screening", href: "/practitioners/screening", icon: UserCheck, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
          { label: "Incident Log", href: "/incidents", icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-950/20" },
          { label: "Staff Training", href: "/practitioners/training", icon: GraduationCap, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} to={href}
            className={`flex items-center gap-3 rounded-xl p-3 border border-border/50 hover:border-border hover:shadow-sm transition-all group ${color}`}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-semibold">{label}</span>
            <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
