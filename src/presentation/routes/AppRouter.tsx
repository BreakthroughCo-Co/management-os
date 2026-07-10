import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// Layout
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Login } from '../features/auth/Login';

// Lazy load all feature modules
const Dashboard = React.lazy(() => import('../pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ClientList = React.lazy(() => import('../features/clients/ClientList').then(m => ({ default: m.ClientList })));
const ClientIntake = React.lazy(() => import('../features/clients/ClientIntake').then(m => ({ default: m.ClientIntake })));
const IntakePipeline = React.lazy(() => import('../features/clients/IntakePipeline').then(m => ({ default: m.IntakePipeline })));
const ClientCommunications = React.lazy(() => import('../features/clients/ClientCommunications').then(m => ({ default: m.ClientCommunications })));
const DocumentLibrary = React.lazy(() => import('../features/knowledge-base/DocumentLibrary').then(m => ({ default: m.DocumentLibrary })));
const SecureMessaging = React.lazy(() => import('../features/clients/SecureMessaging').then(m => ({ default: m.SecureMessaging })));
const SharedCalendar = React.lazy(() => import('../features/clients/SharedCalendar').then(m => ({ default: m.SharedCalendar })));

const PractitionerDirectory = React.lazy(() => import('../features/practitioners/PractitionerDirectory').then(m => ({ default: m.PractitionerDirectory })));
const CapabilityAssessment = React.lazy(() => import('../features/practitioners/CapabilityAssessment').then(m => ({ default: m.CapabilityAssessment })));
const WorkerScreening = React.lazy(() => import('../features/practitioners/WorkerScreening').then(m => ({ default: m.WorkerScreening })));
const MentorshipProgram = React.lazy(() => import('../features/practitioners/MentorshipProgram').then(m => ({ default: m.MentorshipProgram })));
const StaffTraining = React.lazy(() => import('../features/practitioners/StaffTraining').then(m => ({ default: m.StaffTraining })));
const StaffInduction = React.lazy(() => import('../features/practitioners/StaffInduction').then(m => ({ default: m.StaffInduction })));

const PlanManagement = React.lazy(() => import('../features/ndis/PlanManagement').then(m => ({ default: m.PlanManagement })));
const PlanUtilisation = React.lazy(() => import('../features/ndis/PlanUtilisation').then(m => ({ default: m.PlanUtilisation })));
const NDISCalculator = React.lazy(() => import('../features/ndis/NDISCalculator').then(m => ({ default: m.NDISCalculator })));
const NDISClaimValidator = React.lazy(() => import('../features/ndis/NDISClaimValidator').then(m => ({ default: m.NDISClaimValidator })));
const ServiceAgreements = React.lazy(() => import('../features/ndis/ServiceAgreements').then(m => ({ default: m.ServiceAgreements })));
const Billing = React.lazy(() => import('../features/ndis/Billing').then(m => ({ default: m.Billing })));

const FBAAssessments = React.lazy(() => import('../features/clinical/FBAAssessments').then(m => ({ default: m.FBAAssessments })));
const BIPQualityAudit = React.lazy(() => import('../features/clinical/BIPQualityAudit').then(m => ({ default: m.BIPQualityAudit })));
const ABCAnalyser = React.lazy(() => import('../features/clinical/ABCAnalyser').then(m => ({ default: m.ABCAnalyser })));
const BSPCreator = React.lazy(() => import('../features/clinical/BSPCreator').then(m => ({ default: m.BSPCreator })));
const RootCauseAnalysis = React.lazy(() => import('../features/clinical/RootCauseAnalysis').then(m => ({ default: m.RootCauseAnalysis })));
const Telehealth = React.lazy(() => import('../features/clinical/Telehealth').then(m => ({ default: m.Telehealth })));

const SocialStories = React.lazy(() => import('../features/interventions/SocialStories').then(m => ({ default: m.SocialStories })));
const LegoPlay = React.lazy(() => import('../features/interventions/LegoPlay').then(m => ({ default: m.LegoPlay })));

const CaseNotes = React.lazy(() => import('../features/operations/CaseNotes').then(m => ({ default: m.CaseNotes })));
const Incidents = React.lazy(() => import('../features/compliance/Incidents').then(m => ({ default: m.Incidents })));
const IncidentAnalysis = React.lazy(() => import('../features/operations/IncidentAnalysis').then(m => ({ default: m.IncidentAnalysis })));
const RestrictivePractices = React.lazy(() => import('../features/compliance/RestrictivePractices').then(m => ({ default: m.RestrictivePractices })));
const RiskAssessment = React.lazy(() => import('../features/operations/RiskAssessment').then(m => ({ default: m.RiskAssessment })));
const CommandCenter = React.lazy(() => import('../pages/CommandCenter').then(m => ({ default: m.CommandCenter })));
const ObservabilityDashboard = React.lazy(() => import('../pages/ObservabilityDashboard').then(m => ({ default: m.ObservabilityDashboard })));
const AnalyticsEngine = React.lazy(() => import('../features/operations/AnalyticsEngine').then(m => ({ default: m.AnalyticsEngine })));
const Reports = React.lazy(() => import('../pages/Reports').then(m => ({ default: m.Reports })));
const BillingAnomalies = React.lazy(() => import('../features/operations/BillingAnomalies').then(m => ({ default: m.BillingAnomalies })));

const AIAssistant = React.lazy(() => import('../features/ai/AIAssistant').then(m => ({ default: m.AIAssistant })));
const AgentManagement = React.lazy(() => import('../features/ai/AgentManagement').then(m => ({ default: m.AgentManagement })));
const AuditTrail = React.lazy(() => import('../features/auth/AuditTrail').then(m => ({ default: m.AuditTrail })));
const SettingsPage = React.lazy(() => import('../pages/Settings').then(m => ({ default: m.SettingsPage })));
const OperationsHub = React.lazy(() => import('../pages/OperationsHub').then(m => ({ default: m.OperationsHub })));

// Loading Fallback
const LoadingFallback = () => (
  <div className="flex h-[400px] items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// RBAC Route Guard using Zustand
// Restored 2026-07 after being found completely disabled (a prior commit's
// message literally read "RBAC bypass") — every route was rendering for any
// authenticated user regardless of role. Firestore rules remained the real
// data boundary throughout, so this wasn't a data-exposure bug on its own,
// but it meant no route was actually gated in the UI, which matters even
// more now that a restricted-by-design Client role exists.
const RoleRoute = ({ children, allowed }: { children: React.ReactNode, allowed: string[] }) => {
  const { role, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingFallback />;
  }

  // Fail closed: an unresolved role defaults to the lowest-privilege role,
  // not a mid-tier one. (The previous restored version of this file
  // defaulted to "Practitioner", which is fail-open — worth fixing while
  // restoring this.) In practice this branch is rare: useAuthStore resolves
  // role to 'Viewer' synchronously on auth state change, before the real
  // role loads from Firestore, so role is essentially never null here.
  const activeRole = role || "Viewer";

  if (!allowed.includes(activeRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-4">
        <div className="h-12 w-12 bg-red-100 dark:bg-red-950/20 text-red-600 rounded-full flex items-center justify-center">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-md">Your active role ({activeRole}) does not have permission to access this resource.</p>
        <button
          onClick={() => window.location.href = "/dashboard"}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  return <>{children}</>;
};

export const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Core Workspace */}
            <Route path="clients" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><ClientList /></RoleRoute>} />
            <Route path="clients/new" element={<RoleRoute allowed={["Admin", "Coordinator"]}><ClientIntake /></RoleRoute>} />
            <Route path="clients/intake" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><IntakePipeline /></RoleRoute>} />
            <Route path="communications" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><ClientCommunications /></RoleRoute>} />
            <Route path="knowledge-base" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><DocumentLibrary /></RoleRoute>} />
            
            {/* Participant Portal */}
            <Route path="portal/messaging" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner", "Viewer"]}><SecureMessaging /></RoleRoute>} />
            <Route path="portal/calendar" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner", "Viewer"]}><SharedCalendar /></RoleRoute>} />
            
            {/* Practitioner & HR Modules */}
            <Route path="practitioners" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><PractitionerDirectory /></RoleRoute>} />
            <Route path="practitioners/assess" element={<RoleRoute allowed={["Admin", "Coordinator"]}><CapabilityAssessment /></RoleRoute>} />
            <Route path="practitioners/screening" element={<RoleRoute allowed={["Admin", "Coordinator"]}><WorkerScreening /></RoleRoute>} />
            <Route path="practitioners/mentorship" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><MentorshipProgram /></RoleRoute>} />
            <Route path="practitioners/training" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><StaffTraining /></RoleRoute>} />
            <Route path="practitioners/induction" element={<RoleRoute allowed={["Admin", "Coordinator"]}><StaffInduction /></RoleRoute>} />
            
            {/* NDIS & Finance */}
            <Route path="ndis" element={<RoleRoute allowed={["Admin", "Coordinator"]}><PlanManagement /></RoleRoute>} />
            <Route path="ndis/utilisation" element={<RoleRoute allowed={["Admin", "Coordinator"]}><PlanUtilisation /></RoleRoute>} />
            <Route path="ndis-calculator" element={<RoleRoute allowed={["Admin", "Coordinator"]}><NDISCalculator /></RoleRoute>} />
            <Route path="ndis/claim-validator" element={<RoleRoute allowed={["Admin", "Coordinator"]}><NDISClaimValidator /></RoleRoute>} />
            <Route path="ndis/agreements" element={<RoleRoute allowed={["Admin", "Coordinator"]}><ServiceAgreements /></RoleRoute>} />
            <Route path="billing" element={<RoleRoute allowed={["Admin", "Coordinator"]}><Billing /></RoleRoute>} />
            <Route path="billing/anomalies" element={<RoleRoute allowed={["Admin", "Coordinator"]}><BillingAnomalies /></RoleRoute>} />
            
            {/* Clinical Tools */}
            <Route path="clinical/fba" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><FBAAssessments /></RoleRoute>} />
            <Route path="clinical/bip-audit" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><BIPQualityAudit /></RoleRoute>} />
            <Route path="abc-analyser" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><ABCAnalyser /></RoleRoute>} />
            <Route path="bsp-creator" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><BSPCreator /></RoleRoute>} />
            <Route path="clinical/root-cause" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><RootCauseAnalysis /></RoleRoute>} />
            <Route path="telehealth" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><Telehealth /></RoleRoute>} />
            
            {/* Specialized Interventions */}
            <Route path="social-stories" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><SocialStories /></RoleRoute>} />
            <Route path="lego-play" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><LegoPlay /></RoleRoute>} />
            
            {/* Operations & Risk */}
            <Route path="case-notes" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><CaseNotes /></RoleRoute>} />
            <Route path="incidents" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><Incidents /></RoleRoute>} />
            <Route path="incidents/analysis" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><IncidentAnalysis /></RoleRoute>} />
            <Route path="compliance/restrictive-practices" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><RestrictivePractices /></RoleRoute>} />
            <Route path="risk-assessment" element={<RoleRoute allowed={["Admin", "Coordinator"]}><RiskAssessment /></RoleRoute>} />
            <Route path="command-center" element={<RoleRoute allowed={["Admin", "Coordinator"]}><CommandCenter /></RoleRoute>} />
            <Route path="observability" element={<RoleRoute allowed={["Admin"]}><ObservabilityDashboard /></RoleRoute>} />
            <Route path="analytics-engine" element={<RoleRoute allowed={["Admin", "Coordinator"]}><AnalyticsEngine /></RoleRoute>} />
            <Route path="reports" element={<RoleRoute allowed={["Admin", "Coordinator"]}><Reports /></RoleRoute>} />
            
            {/* AI Features */}
            <Route path="ai-assistant" element={<RoleRoute allowed={["Admin", "Coordinator", "Practitioner"]}><AIAssistant /></RoleRoute>} />
            <Route path="agents" element={<RoleRoute allowed={["Admin"]}><AgentManagement /></RoleRoute>} />

            {/* Security & Audit */}
            <Route path="audit" element={<RoleRoute allowed={["Admin"]}><AuditTrail /></RoleRoute>} />

            {/* Operations Hub */}
            <Route path="operations-hub" element={<RoleRoute allowed={["Admin", "Coordinator", "Practice Manager", "Practitioner"]}><OperationsHub /></RoleRoute>} />

            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
