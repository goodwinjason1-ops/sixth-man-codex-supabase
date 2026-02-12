import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import CoachDashboard from './pages/CoachDashboard';
import PlayerPortal from './pages/PlayerPortal';
import AdminDashboard from './pages/AdminDashboard';
import TeamPage from './pages/TeamPage';
import TrainingPage from './pages/TrainingPage';
import StatsPage from './pages/StatsPage';
import MessagesPage from './pages/MessagesPage';
import SkillsPassportPage from './pages/SkillsPassportPage';
import CoachAssessmentPage from './pages/CoachAssessmentPage';
import MatchDayAssessmentPage from './pages/MatchDayAssessmentPage';
import RotationTrackerPage from './pages/RotationTrackerPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import BenchmarkAdminPage from './pages/BenchmarkAdminPage';
import CoachProfilePage from './pages/CoachProfilePage';
import AdminProfilePage from './pages/AdminProfilePage';
import CoachPlayerOverviewPage from './pages/CoachPlayerOverviewPage';
import TrainingPlansListPage from './pages/TrainingPlansListPage';
import TrainingPlanBuilderPage from './pages/TrainingPlanBuilderPage';
// Admin Pages
import RosterManagementPage from './pages/admin/RosterManagementPage';
import ScheduleManagementPage from './pages/admin/ScheduleManagementPage';
import PlayerHQIntegrationPage from './pages/admin/PlayerHQIntegrationPage';
import ClubAnalyticsPage from './pages/admin/ClubAnalyticsPage';
import AgeGroupReportsPage from './pages/admin/AgeGroupReportsPage';
import AgeGroupDetailReportPage from './pages/admin/AgeGroupDetailReportPage';
import CoachingEffectivenessPage from './pages/admin/CoachingEffectivenessPage';
import CurriculumAnalysisPage from './pages/admin/CurriculumAnalysisPage';
import RepTeamProspectsPage from './pages/admin/RepTeamProspectsPage';
import DataExplorerPage from './pages/admin/DataExplorerPage';
import ReportsExportPage from './pages/admin/ReportsExportPage';
import SystemManagementPage from './pages/admin/SystemManagementPage';
import TrainingPlansLibraryPage from './pages/admin/TrainingPlansLibraryPage';
import GameResultsPage from './pages/admin/GameResultsPage';
import NotificationsAdminPage from './pages/admin/NotificationsPage';
import SampleDataPage from './pages/admin/SampleDataPage';
import ParentInvitationsPage from './pages/admin/ParentInvitationsPage';
import DataCleanupPage from './pages/admin/DataCleanupPage';
import TryoutSessionsPage from './pages/admin/TryoutSessionsPage';
import TryoutResultsPage from './pages/admin/TryoutResultsPage';
import TryoutAssessorPage from './pages/TryoutAssessorPage';
import YouthProgramsPage from './pages/admin/YouthProgramsPage';
import YouthCoachPage from './pages/YouthCoachPage';
import ParentSignupPage from './pages/ParentSignupPage';
import ParentDashboard from './pages/ParentDashboard';
// User Pages
import NotificationsInboxPage from './pages/NotificationsInboxPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import AssessorDashboard from './pages/AssessorDashboard';
import UserCreationPage from './pages/admin/UserCreationPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import TeamManagementPage from './pages/admin/TeamManagementPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import AssessmentMetricsPage from './pages/admin/AssessmentMetricsPage';
import CoachCompliancePage from './pages/admin/CoachCompliancePage';
import HelpHome from './pages/help/HelpHome';
import AdminHelp from './pages/help/AdminHelp';
import LeadershipHelp from './pages/help/LeadershipHelp';
import CoordinatorHelp from './pages/help/CoordinatorHelp';
import CoachHelp from './pages/help/CoachHelp';
import YouthCoachHelp from './pages/help/YouthCoachHelp';
import AssessorHelp from './pages/help/AssessorHelp';
import ParentHelp from './pages/help/ParentHelp';
import PlayerHelp from './pages/help/PlayerHelp';
import { ADMIN_ROLES, STAFF_ROLES, TRYOUT_ASSESSOR_ROLES, TRYOUT_RESULTS_ROLES } from './constants/roles';
import { DRILL_VIEW_ROLES, DRILL_EDIT_ROLES } from './constants/drills';
import DrillLibraryPage from './pages/DrillLibraryPage';
import DrillDetailPage from './pages/DrillDetailPage';
import CreateDrillPage from './pages/CreateDrillPage';
import EditDrillPage from './pages/EditDrillPage';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import Layout from './components/Layout';
import MobileBottomNav from './components/MobileBottomNav';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialOverlay from './components/tutorial/TutorialOverlay';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-800">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Routes
const AppRoutes = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <Routes>
      <Route path="/signup/:invitationCode" element={<ParentSignupPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      <Route
        path="/login"
        element={currentUser ? <Navigate to="/welcome" replace /> : <LoginPage />}
      />

      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <WelcomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              {ADMIN_ROLES.includes(userProfile?.role) ? <AdminDashboard /> :
               ['girls_coordinator', 'boys_coordinator', 'youth_head_coach'].includes(userProfile?.role) ? <AdminDashboard /> :
               userProfile?.role === 'coach' ? <CoachDashboard /> :
               userProfile?.role === 'youth_coach' ? <CoachDashboard /> :
               userProfile?.role === 'player' ? <PlayerPortal /> :
               userProfile?.role === 'parent' ? <ParentDashboard /> :
               userProfile?.role === 'team_manager' ? <PlayerPortal /> :
               userProfile?.role === 'tryout_assessor' ? <Navigate to="/assessor" replace /> :
               <Navigate to="/welcome" replace />}
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach"
        element={
          <ProtectedRoute allowedRoles={['coach']}>
            <Layout>
              <CoachDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/profile"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load coach profile. Please try again.">
              <CoachProfilePage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load admin profile. Please try again.">
              <AdminProfilePage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/players"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load player overview. Please try again.">
              <CoachPlayerOverviewPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/training-plans"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load training plans. Please try again.">
              <TrainingPlansListPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/training-plans/new"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load plan builder. Please try again.">
              <TrainingPlanBuilderPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/training-plans/:id"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load plan. Please try again.">
              <TrainingPlanBuilderPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Drill Library Routes */}
      <Route
        path="/drills"
        element={
          <ProtectedRoute allowedRoles={DRILL_VIEW_ROLES}>
            <Layout>
              <DrillLibraryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/drills/new"
        element={
          <ProtectedRoute allowedRoles={DRILL_EDIT_ROLES}>
            <CreateDrillPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drills/:id"
        element={
          <ProtectedRoute allowedRoles={DRILL_VIEW_ROLES}>
            <DrillDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drills/:id/edit"
        element={
          <ProtectedRoute allowedRoles={DRILL_EDIT_ROLES}>
            <EditDrillPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/player"
        element={
          <ProtectedRoute>
            <Layout>
              <PlayerPortal />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/training"
        element={
          <ProtectedRoute>
            <TrainingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/skills-passport"
        element={
          <ProtectedRoute>
            <SkillsPassportPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Unable to load notifications.">
              <NotificationsInboxPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications/settings"
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Unable to load notification settings.">
              <NotificationPreferencesPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach-assessment"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <CoachAssessmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/match-assessment"
        element={
          <ProtectedRoute allowedRoles={['coach']}>
            <MatchDayAssessmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/rotation-tracker"
        element={
          <ProtectedRoute allowedRoles={['coach']}>
            <ErrorBoundary fallbackMessage="Unable to load rotation tracker.">
              <RotationTrackerPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/benchmarks"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <BenchmarkAdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/rosters"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load roster management.">
              <RosterManagementPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/schedule"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load schedule management.">
              <ScheduleManagementPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/playerhq"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load PlayerHQ integration.">
              <PlayerHQIntegrationPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load club analytics.">
              <ClubAnalyticsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/age-groups"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load age group reports.">
              <AgeGroupReportsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/age-groups/:ageGroupId"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load age group report.">
              <AgeGroupDetailReportPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/coaching"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load coaching effectiveness.">
              <CoachingEffectivenessPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/curriculum"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load curriculum analysis.">
              <CurriculumAnalysisPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/rep-prospects"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load rep team prospects.">
              <RepTeamProspectsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/data-explorer"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load data explorer.">
              <DataExplorerPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load reports.">
              <ReportsExportPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/system"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load system management.">
              <SystemManagementPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/training-plans"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load training plans library.">
              <TrainingPlansLibraryPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/game-results"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load game results.">
              <GameResultsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load notifications management.">
              <NotificationsAdminPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/scoring-roster"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load scoring roster.">
              <NotificationsAdminPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/sample-data"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load sample data tools.">
              <SampleDataPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/parent-invitations"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load parent invitations.">
              <ParentInvitationsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/data-cleanup"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load data cleanup.">
              <DataCleanupPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Youth Programs Routes */}
      <Route
        path="/admin/youth-programs"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'youth_head_coach', 'youth_coach']}>
            <ErrorBoundary fallbackMessage="Unable to load youth programs.">
              <YouthProgramsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/youth-programs/:programId"
        element={
          <ProtectedRoute allowedRoles={[...STAFF_ROLES, 'youth_coach', 'youth_head_coach']}>
            <ErrorBoundary fallbackMessage="Unable to load youth session.">
              <YouthCoachPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Tryout Evaluation Routes */}
      <Route
        path="/admin/tryouts"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'girls_coordinator', 'boys_coordinator']}>
            <ErrorBoundary fallbackMessage="Unable to load tryout sessions.">
              <TryoutSessionsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tryouts/:sessionId/results"
        element={
          <ProtectedRoute allowedRoles={[...TRYOUT_RESULTS_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load tryout results.">
              <TryoutResultsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tryout/:sessionId"
        element={
          <ProtectedRoute allowedRoles={[...TRYOUT_ASSESSOR_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load assessor view.">
              <TryoutAssessorPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/parent/scoring-swap/:requestId"
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackMessage="Unable to load swap request.">
              <NotificationsInboxPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/assessor"
        element={
          <ProtectedRoute allowedRoles={['tryout_assessor']}>
            <AssessorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin', 'president', 'vice_president']}>
            <ErrorBoundary fallbackMessage="Unable to load user management.">
              <UserManagementPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/users/create" element={<Navigate to="/admin/users" replace />} />

      <Route
        path="/admin/teams"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'girls_coordinator', 'boys_coordinator']}>
            <ErrorBoundary fallbackMessage="Unable to load team management.">
              <TeamManagementPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/activity"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load activity log.">
              <ActivityLogPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/assessment-metrics"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load assessment metrics.">
              <AssessmentMetricsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/coach-compliance"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <ErrorBoundary fallbackMessage="Unable to load coach compliance.">
              <CoachCompliancePage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Help System */}
      <Route path="/help" element={<ProtectedRoute><HelpHome /></ProtectedRoute>} />
      <Route path="/help/admin" element={<ProtectedRoute><AdminHelp /></ProtectedRoute>} />
      <Route path="/help/leadership" element={<ProtectedRoute><LeadershipHelp /></ProtectedRoute>} />
      <Route path="/help/coordinators" element={<ProtectedRoute><CoordinatorHelp /></ProtectedRoute>} />
      <Route path="/help/coaches" element={<ProtectedRoute><CoachHelp /></ProtectedRoute>} />
      <Route path="/help/youth-coaches" element={<ProtectedRoute><YouthCoachHelp /></ProtectedRoute>} />
      <Route path="/help/assessors" element={<ProtectedRoute><AssessorHelp /></ProtectedRoute>} />
      <Route path="/help/parents" element={<ProtectedRoute><ParentHelp /></ProtectedRoute>} />
      <Route path="/help/players" element={<ProtectedRoute><PlayerHelp /></ProtectedRoute>} />
      {/* Backward-compat redirects */}
      <Route path="/help/assessor-guide" element={<Navigate to="/help/assessors" replace />} />
      <Route path="/help/little-lakers-guide" element={<Navigate to="/help/youth-coaches" replace />} />

      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <DataProvider>
            <TutorialProvider>
              <OfflineIndicator />
              <AppRoutes />
              <MobileBottomNav />
              <TutorialOverlay />
            </TutorialProvider>
          </DataProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
