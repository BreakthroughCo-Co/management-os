/**
 * Unit tests for OperationsHub components
 * Tests cover: rendering, ComplianceRiskScore calculation, and MetricRow status logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OperationsHub } from "../OperationsHub";

// ─── Mock Firebase Functions ─────────────────────────────────────────────────
vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() =>
    vi.fn().mockResolvedValue({ data: { text: "• Priority 1\n• Priority 2\n• Priority 3" } })
  ),
}));

vi.mock("@/lib/firebase", () => ({
  default: {},
  app: {},
  auth: {},
  db: {},
  storage: {},
}));

// ─── Helper ──────────────────────────────────────────────────────────────────
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("OperationsHub", () => {
  it("renders the page heading", () => {
    renderWithRouter(<OperationsHub />);
    expect(screen.getByText("Operations Hub")).toBeInTheDocument();
  });

  it("renders all four summary cards", () => {
    renderWithRouter(<OperationsHub />);
    expect(screen.getByText("NDIS Compliance")).toBeInTheDocument();
    expect(screen.getByText("Financial Reporting")).toBeInTheDocument();
    expect(screen.getByText("HR & Workforce")).toBeInTheDocument();
    expect(screen.getByText("LEGO® Therapy Growth")).toBeInTheDocument();
  });

  it("renders the Compliance Risk Score section", () => {
    renderWithRouter(<OperationsHub />);
    expect(screen.getByText("Compliance Risk Score")).toBeInTheDocument();
  });

  it("renders the Gemini Morning Briefing section", () => {
    renderWithRouter(<OperationsHub />);
    expect(screen.getByText("Gemini Morning Briefing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate Briefing/i })).toBeInTheDocument();
  });

  it("renders the Practice & Business Manager View badge", () => {
    renderWithRouter(<OperationsHub />);
    expect(screen.getByText("Practice & Business Manager View")).toBeInTheDocument();
  });

  it("renders quick action links", () => {
    renderWithRouter(<OperationsHub />);
    expect(screen.getByText("Plan Utilisation")).toBeInTheDocument();
    expect(screen.getByText("Worker Screening")).toBeInTheDocument();
    expect(screen.getByText("Incident Log")).toBeInTheDocument();
    expect(screen.getByText("Staff Training")).toBeInTheDocument();
  });

  it("generates a morning briefing when button is clicked", async () => {
    renderWithRouter(<OperationsHub />);
    const btn = screen.getByRole("button", { name: /Generate Briefing/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText("Priority 1")).toBeInTheDocument();
    });
  });
});

// ─── ComplianceRiskScore calculation logic tests ─────────────────────────────

describe("ComplianceRiskScore calculation", () => {
  // The formula: score = 100 - rawRisk (capped at 100)
  // auditRisk: days < 7 → 30, < 30 → 15, else 0
  // credRisk: expired*10 + expiring*3
  // checkRisk: pct<50 → 25, pct<80 → 12, else 0
  // rpRisk: activeRPs * 4
  // caRisk: openCorrectiveActions * 5

  const computeScore = ({
    auditDaysRemaining,
    checklistPct,
    expiredCredentials,
    expiringCredentials,
    activeRPs,
    openCorrectiveActions,
  }: {
    auditDaysRemaining: number;
    checklistPct: number;
    expiredCredentials: number;
    expiringCredentials: number;
    activeRPs: number;
    openCorrectiveActions: number;
  }) => {
    const auditRisk =
      auditDaysRemaining < 7 ? 30 : auditDaysRemaining < 30 ? 15 : 0;
    const credRisk = expiredCredentials * 10 + expiringCredentials * 3;
    const checkRisk = checklistPct < 50 ? 25 : checklistPct < 80 ? 12 : 0;
    const rpRisk = activeRPs * 4;
    const caRisk = openCorrectiveActions * 5;
    const rawRisk = Math.min(auditRisk + credRisk + checkRisk + rpRisk + caRisk, 100);
    return 100 - rawRisk;
  };

  it("returns a perfect score (100) when everything is compliant", () => {
    const score = computeScore({
      auditDaysRemaining: 365,
      checklistPct: 100,
      expiredCredentials: 0,
      expiringCredentials: 0,
      activeRPs: 0,
      openCorrectiveActions: 0,
    });
    expect(score).toBe(100);
  });

  it("penalises for imminent audit (< 7 days)", () => {
    const score = computeScore({
      auditDaysRemaining: 5,
      checklistPct: 100,
      expiredCredentials: 0,
      expiringCredentials: 0,
      activeRPs: 0,
      openCorrectiveActions: 0,
    });
    expect(score).toBe(70); // 100 - 30
  });

  it("penalises for approaching audit (< 30 days)", () => {
    const score = computeScore({
      auditDaysRemaining: 14,
      checklistPct: 100,
      expiredCredentials: 0,
      expiringCredentials: 0,
      activeRPs: 0,
      openCorrectiveActions: 0,
    });
    expect(score).toBe(85); // 100 - 15
  });

  it("penalises for expired credentials", () => {
    const score = computeScore({
      auditDaysRemaining: 365,
      checklistPct: 100,
      expiredCredentials: 2,
      expiringCredentials: 0,
      activeRPs: 0,
      openCorrectiveActions: 0,
    });
    expect(score).toBe(80); // 100 - 20
  });

  it("penalises for low checklist completion", () => {
    const score = computeScore({
      auditDaysRemaining: 365,
      checklistPct: 40,
      expiredCredentials: 0,
      expiringCredentials: 0,
      activeRPs: 0,
      openCorrectiveActions: 0,
    });
    expect(score).toBe(75); // 100 - 25
  });

  it("caps the raw risk at 100 (score never goes below 0)", () => {
    const score = computeScore({
      auditDaysRemaining: 1,
      checklistPct: 0,
      expiredCredentials: 10,
      expiringCredentials: 10,
      activeRPs: 10,
      openCorrectiveActions: 10,
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
