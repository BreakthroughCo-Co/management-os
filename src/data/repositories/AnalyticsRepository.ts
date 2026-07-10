import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, app } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface DashboardStats {
  activeClients: { value: string; change: string };
  pendingApprovals: { value: string; change: string };
  sessionsToday: { value: string; change: string };
  complianceRate: { value: string; change: string };
}

export interface ClaimDataPoint {
  week: string;
  claims: number;
  value: number;
}

export interface HeatmapDataPoint {
  week: number;
  day: number;
  count: number;
}

export interface BurnRateGauge {
  percentage: number;
  utilized: number;
  budget: number;
  target: number;
}

export interface MonthlyBurnRate {
  month: string;
  budget: number;
  actual: number;
}

export interface ClinicalOutcome {
  metric: string;
  pre: number;
  post: number;
}

// Fallback Mock Data
const MOCK_STATS: DashboardStats = {
  activeClients: { value: "142", change: "+4.75%" },
  pendingApprovals: { value: "12", change: "-1.39%" },
  sessionsToday: { value: "28", change: "+10.18%" },
  complianceRate: { value: "98.5%", change: "+0.11%" },
};

const MOCK_CLAIM_DATA: ClaimDataPoint[] = [
  { week: "Week 1", claims: 4500, value: 3800 },
  { week: "Week 2", claims: 5200, value: 4900 },
  { week: "Week 3", claims: 6100, value: 5800 },
  { week: "Week 4", claims: 5800, value: 5400 },
  { week: "Week 5", claims: 7200, value: 6800 },
  { week: "Week 6", claims: 8100, value: 7600 },
];

const generateHeatmap = () => {
  const data: HeatmapDataPoint[] = [];
  for (let week = 0; week < 12; week++) {
    for (let day = 0; day < 7; day++) {
      const base = day === 0 || day === 6 ? 0 : Math.floor(Math.random() * 8);
      data.push({ week, day, count: base });
    }
  }
  return data;
};

const MOCK_HEATMAP = generateHeatmap();

const MOCK_BURN_GAUGE: BurnRateGauge = {
  percentage: 71,
  utilized: 85200,
  budget: 120000,
  target: 65,
};

const MOCK_MONTHLY_BURN: MonthlyBurnRate[] = [
  { month: "Jan", budget: 10000, actual: 8000 },
  { month: "Feb", budget: 10000, actual: 9500 },
  { month: "Mar", budget: 10000, actual: 11200 },
  { month: "Apr", budget: 10000, actual: 10500 },
  { month: "May", budget: 10000, actual: 9000 },
  { month: "Jun", budget: 10000, actual: 12000 },
];

const MOCK_OUTCOMES: ClinicalOutcome[] = [
  { metric: "Communication", pre: 40, post: 75 },
  { metric: "Self-Regulation", pre: 30, post: 65 },
  { metric: "Social Skills", pre: 50, post: 80 },
  { metric: "Daily Living", pre: 45, post: 70 },
];

export const useDashboardStatsQuery = () => {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      try {
        const docRef = doc(db, 'analytics', 'dashboard_stats');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return snapshot.data() as {
            stats: DashboardStats;
            claims: ClaimDataPoint[];
            heatmap: HeatmapDataPoint[];
            burnGauge: BurnRateGauge;
          };
        }
        return {
          stats: MOCK_STATS,
          claims: MOCK_CLAIM_DATA,
          heatmap: MOCK_HEATMAP,
          burnGauge: MOCK_BURN_GAUGE
        };
      } catch (error) {
        console.warn("Firestore access failed, returning mock dashboard stats:", error);
        return {
          stats: MOCK_STATS,
          claims: MOCK_CLAIM_DATA,
          heatmap: MOCK_HEATMAP,
          burnGauge: MOCK_BURN_GAUGE
        };
      }
    },
  });
};

export const useRefreshDashboardMetricsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const functions = getFunctions(app);
      const refreshDashboardMetrics = httpsCallable(functions, 'refreshDashboardMetrics');
      const result = await refreshDashboardMetrics();
      return result.data as { success: boolean; stats: DashboardStats; claims: ClaimDataPoint[]; burnGauge: BurnRateGauge };
    },
    onSuccess: () => {
      // Server has just written fresh analytics/dashboard_stats — refetch
      // rather than trusting the callable's return shape to exactly match
      // what useDashboardStatsQuery expects (it's close, but they're
      // independently maintained and could drift).
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
};

export const useAnalyticsChartsQuery = () => {
  return useQuery({
    queryKey: ['analytics_charts'],
    queryFn: async () => {
      try {
        const docRef = doc(db, 'analytics', 'engine_charts');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return snapshot.data() as {
            monthlyBurn: MonthlyBurnRate[];
            outcomes: ClinicalOutcome[];
          };
        }
        return {
          monthlyBurn: MOCK_MONTHLY_BURN,
          outcomes: MOCK_OUTCOMES
        };
      } catch (error) {
        console.warn("Firestore access failed, returning mock analytics charts:", error);
        return {
          monthlyBurn: MOCK_MONTHLY_BURN,
          outcomes: MOCK_OUTCOMES
        };
      }
    },
  });
};
