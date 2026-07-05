import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Users, Activity, Settings, LogOut, 
  BrainCircuit, FileEdit, Bot, ShieldAlert, FileText, CheckCircle2, ShieldCheck, UserCheck, MessageSquare, Star, BarChart3, Radio, Coins, FileSignature, Send, Menu, Sun, Moon, Shield, Bell, Search, X, AlertTriangle, Calendar, TrendingUp, Video, FileSearch, PieChart, MapPin, Sparkles, GitBranch, ClipboardList, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/presentation/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/presentation/components/ui/sheet";
import { CommandPalette } from "@/presentation/components/CommandPalette";
import { OfflineSyncManager } from "@/presentation/components/OfflineSyncManager";
import { CopilotPanel } from "@/presentation/components/layout/CopilotPanel";

const sections = [
  {
    title: "Core Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Coordinator", "Practitioner", "Viewer"] },
      { title: "Operations Hub", href: "/operations-hub", icon: Briefcase, roles: ["Admin", "Coordinator", "Practice Manager"] },
      { title: "Command Center", href: "/command-center", icon: Radio, roles: ["Admin", "Coordinator"] },
      { title: "Clients", href: "/clients", icon: Users, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Communications", href: "/communications", icon: MessageSquare, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Knowledge Base", href: "/knowledge-base", icon: FileText, roles: ["Admin", "Coordinator", "Practitioner", "Viewer"] },
    ]
  },
  {
    title: "Participant Portal",
    items: [
      { title: "Secure Messaging", href: "/portal/messaging", icon: MessageSquare, roles: ["Admin", "Coordinator", "Practitioner", "Viewer"] },
      { title: "Shared Calendar", href: "/portal/calendar", icon: Calendar, roles: ["Admin", "Coordinator", "Practitioner", "Viewer"] },
    ]
  },
  {
    title: "Practitioner Hub",
    items: [
      { title: "Directory", href: "/practitioners", icon: Users, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Capability Audits", href: "/practitioners/assess", icon: UserCheck, roles: ["Admin", "Coordinator"] },
      { title: "Worker Screening", href: "/practitioners/screening", icon: ShieldCheck, roles: ["Admin", "Coordinator"] },
      { title: "Mentorship Logs", href: "/practitioners/mentorship", icon: CheckCircle2, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Staff Training", href: "/practitioners/training", icon: Activity, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Staff Induction", href: "/practitioners/induction", icon: ClipboardList, roles: ["Admin", "Coordinator"] },
    ]
  },
  {
    title: "NDIS & Finance",
    items: [
      { title: "Plan Overview", href: "/ndis", icon: FileText, roles: ["Admin", "Coordinator"] },
      { title: "Plan Utilisation", href: "/ndis/utilisation", icon: Activity, roles: ["Admin", "Coordinator"] },
      { title: "Dynamic Calculator", href: "/ndis-calculator", icon: Activity, roles: ["Admin", "Coordinator"] },
      { title: "Service Agreements", href: "/ndis/agreements", icon: FileSignature, roles: ["Admin", "Coordinator"] },
      { title: "Claim Validator", href: "/ndis/claim-validator", icon: FileSearch, roles: ["Admin", "Coordinator"] },
      { title: "Billing Ledger", href: "/billing", icon: Coins, roles: ["Admin", "Coordinator"] },
      { title: "Billing Anomalies", href: "/billing/anomalies", icon: AlertTriangle, roles: ["Admin", "Coordinator"] },
    ]
  },
  {
    title: "Clinical Tools",
    items: [
      { title: "Digitised FBAs", href: "/clinical/fba", icon: FileEdit, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "BIP Quality Audit", href: "/clinical/bip-audit", icon: CheckCircle2, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "ABC Analyser", href: "/abc-analyser", icon: Activity, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "BSP Creator", href: "/bsp-creator", icon: FileEdit, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Telehealth Rooms", href: "/telehealth", icon: Video, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Social Stories", href: "/social-stories", icon: BrainCircuit, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "LEGO Play Therapy", href: "/lego-play", icon: Bot, roles: ["Admin", "Coordinator", "Practitioner"] },
    ]
  },
  {
    title: "Operations & Risk",
    items: [
      { title: "Case Notes", href: "/case-notes", icon: FileEdit, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Incident Log", href: "/incidents", icon: ShieldAlert, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Root Cause (5 Whys)", href: "/clinical/root-cause", icon: GitBranch, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Restrictive Practices", href: "/compliance/restrictive-practices", icon: ShieldAlert, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "Risk Assessment", href: "/risk-assessment", icon: Settings, roles: ["Admin", "Coordinator"] },
      { title: "Analytics Engine", href: "/analytics-engine", icon: PieChart, roles: ["Admin", "Coordinator"] },
      { title: "Reports Distribution", href: "/reports", icon: Send, roles: ["Admin", "Coordinator"] },
      { title: "Observability Console", href: "/observability", icon: BarChart3, roles: ["Admin"] },
      { title: "Audit Trail", href: "/audit", icon: Shield, roles: ["Admin"] },
      { title: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, roles: ["Admin", "Coordinator", "Practitioner"] },
      { title: "AI Agents", href: "/agents", icon: Bot, roles: ["Admin"] },
    ]
  }
];

const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "warning", title: "Compliance Deadline Approaching", body: "NDIS Commission annual audit due in 14 days.", time: "2h ago", read: false },
  { id: "n2", type: "alert", title: "Plan Review Required", body: "Charlie Davis's NDIS plan expires in 30 days.", time: "5h ago", read: false },
  { id: "n3", type: "warning", title: "Funding Utilisation Warning", body: "Bob Smith has utilized 92% of plan budget.", time: "1d ago", read: false },
  { id: "n4", type: "info", title: "New Service Agreement Signed", body: "Alice Vance has signed her FY26 agreement.", time: "2d ago", read: true },
];

interface SidebarContentProps {
  pathname: string;
  userRole: string;
}

function SidebarContent({ pathname, userRole }: SidebarContentProps) {
  const filteredSections = sections.map(section => {
    const items = section.items.filter(item => item.roles.includes(userRole));
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="h-14 flex items-center px-4 border-b border-border/40">
        <span className="font-bold text-lg text-foreground tracking-tight">Management OS</span>
      </div>
      <div className="flex-1 overflow-auto py-4 px-2 space-y-6">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{section.title}</h4>
            <nav className="grid gap-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border/40 mt-auto">
        <nav className="grid gap-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

  const iconFor = (type: string) => {
    if (type === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (type === "alert") return <Calendar className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-blue-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-[11px] text-blue-500 hover:underline">Mark all read</button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-auto divide-y divide-border/40">
        {notifications.map(n => (
          <div key={n.id} className={cn("px-4 py-3 flex gap-3 items-start transition-colors hover:bg-accent/40", !n.read && "bg-blue-500/5")}>
            <div className="mt-0.5 flex-shrink-0">{iconFor(n.type)}</div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-semibold", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
            </div>
            {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function DashboardLayout() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || "Admin");
  const [showNotifications, setShowNotifications] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Global Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    localStorage.setItem("userRole", newRole);
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950 text-foreground transition-colors duration-200">
      {/* Command Palette */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Sidebar - Desktop */}
      <aside className="w-64 flex-col hidden sm:flex border-r border-border/40 bg-card h-screen sticky top-0">
        <SidebarContent pathname={location.pathname} userRole={role} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center px-4 md:px-6 border-b border-border/40 bg-card text-card-foreground sticky top-0 z-10 gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <SidebarContent pathname={location.pathname} userRole={role} />
            </SheetContent>
          </Sheet>

          <h1 className="text-sm font-medium capitalize">
            {location.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard"}
          </h1>

          <div className="ml-auto flex items-center space-x-2">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setCommandOpen(true)}
              aria-label="Open command palette (⌘K)"
              className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted hover:bg-accent border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="flex items-center gap-0.5 text-[10px] font-mono border border-border rounded px-1">
                ⌘K
              </kbd>
            </button>

            {/* Offline Sync Indicator */}
            <OfflineSyncManager />

            {/* Franchise / Location Selector */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 border border-border rounded-lg px-2 py-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Main Branch - Melbourne</span>
            </div>

            {/* RBAC Role Selector */}
            <div
              role="group"
              aria-label="Switch active role"
              className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 border border-border rounded-lg px-2 py-1"
            >
              <Shield className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                aria-label="Active role"
                className="text-xs bg-transparent outline-none font-semibold text-slate-700 dark:text-slate-300 border-none cursor-pointer pr-1"
              >
                <option value="Admin" className="bg-card">Admin</option>
                <option value="Coordinator" className="bg-card">Coordinator</option>
                <option value="Practice Manager" className="bg-card">Practice Manager</option>
                <option value="Practitioner" className="bg-card">Practitioner</option>
                <option value="Viewer" className="bg-card">Viewer</option>
              </select>
            </div>

            {/* Copilot Toggle */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setCopilotOpen(true)}
              className="hidden md:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-3 h-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Copilot</span>
            </Button>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                aria-expanded={showNotifications}
                aria-haspopup="dialog"
                onClick={() => setShowNotifications(p => !p)}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700" aria-hidden="true" />
              )}
              <span className="sr-only">Toggle Theme</span>
            </Button>

            <div
              className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800"
              role="img"
              aria-label="User avatar"
            />
          </div>
        </header>

        {/* Animated Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      
      {/* Copilot Side Panel */}
      <CopilotPanel isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
