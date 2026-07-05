import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutDashboard, Users, Activity, Settings, BrainCircuit, FileEdit, Bot, ShieldAlert, FileText, CheckCircle2, ShieldCheck, UserCheck, MessageSquare, Star, BarChart3, Radio, Coins, FileSignature, Send, Shield, Video, FileSearch, Calendar, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "Core Workspace" },
  { title: "Command Center", href: "/command-center", icon: Radio, section: "Core Workspace" },
  { title: "Clients", href: "/clients", icon: Users, section: "Core Workspace" },
  { title: "Communications", href: "/communications", icon: MessageSquare, section: "Core Workspace" },
  { title: "Secure Messaging", href: "/portal/messaging", icon: MessageSquare, section: "Participant Portal" },
  { title: "Shared Calendar", href: "/portal/calendar", icon: Calendar, section: "Participant Portal" },
  { title: "Practitioner Directory", href: "/practitioners", icon: Users, section: "Practitioner Hub" },
  { title: "Capability Audits", href: "/practitioners/assess", icon: UserCheck, section: "Practitioner Hub" },
  { title: "Worker Screening", href: "/practitioners/screening", icon: ShieldCheck, section: "Practitioner Hub" },
  { title: "Mentorship Logs", href: "/practitioners/mentorship", icon: CheckCircle2, section: "Practitioner Hub" },
  { title: "Staff Training", href: "/practitioners/training", icon: Activity, section: "Practitioner Hub" },
  { title: "NDIS Plan Overview", href: "/ndis", icon: FileText, section: "NDIS & Finance" },
  { title: "Dynamic Calculator", href: "/ndis-calculator", icon: Activity, section: "NDIS & Finance" },
  { title: "Service Agreements", href: "/ndis/agreements", icon: FileSignature, section: "NDIS & Finance" },
  { title: "Claim Validator", href: "/ndis/claim-validator", icon: FileSearch, section: "NDIS & Finance" },
  { title: "Billing Ledger", href: "/billing", icon: Coins, section: "NDIS & Finance" },
  { title: "ABC Analyser", href: "/abc-analyser", icon: Activity, section: "Clinical Tools" },
  { title: "BSP Creator", href: "/bsp-creator", icon: FileEdit, section: "Clinical Tools" },
  { title: "Telehealth Rooms", href: "/telehealth", icon: Video, section: "Clinical Tools" },
  { title: "Social Stories", href: "/social-stories", icon: BrainCircuit, section: "Clinical Tools" },
  { title: "LEGO Play Therapy", href: "/lego-play", icon: Bot, section: "Clinical Tools" },
  { title: "Incident Log", href: "/incidents", icon: ShieldAlert, section: "Operations & Risk" },
  { title: "Risk Assessment", href: "/risk-assessment", icon: Settings, section: "Operations & Risk" },
  { title: "Analytics Engine", href: "/analytics-engine", icon: PieChart, section: "Operations & Risk" },
  { title: "Reports Distribution", href: "/reports", icon: Send, section: "Operations & Risk" },
  { title: "Observability Console", href: "/observability", icon: BarChart3, section: "Operations & Risk" },
  { title: "Audit Trail", href: "/audit", icon: Shield, section: "Operations & Risk" },
  { title: "AI Assistant", href: "/ai-assistant", icon: BrainCircuit, section: "Operations & Risk" },
  { title: "AI Agents", href: "/agents", icon: Bot, section: "Operations & Risk" },
  { title: "Settings", href: "/settings", icon: Settings, section: "System" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim() === ""
    ? ALL_ITEMS.slice(0, 8)
    : ALL_ITEMS.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[selectedIdx]) handleSelect(filtered[selectedIdx].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, tools, and features..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.href}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                  idx === selectedIdx
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50"
                )}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => handleSelect(item.href)}
              >
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium block truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.section}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 font-mono">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border px-1 font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
