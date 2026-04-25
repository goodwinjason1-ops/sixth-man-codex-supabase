import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ADMIN_ROLES, STAFF_ROLES, TRYOUT_ASSESSOR_ROLES, TRYOUT_RESULTS_ROLES } from './constants/roles';
import { DRILL_VIEW_ROLES, DRILL_EDIT_ROLES } from './constants/drills';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import Layout from './components/Layout';
import MobileBottomNav from './components/MobileBottomNav';
import FeedbackButton from './components/FeedbackButton';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialOverlay from './components/tutorial/TutorialOverlay';
import './index.css';

// ============================================
// Lazy-loaded page components (code-split)
// ============================================

// Core pages (small, loaded early)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const ParentSignupPage = lazy(() => import('./pages/ParentSignupPage'));

// Coach chunk
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const CoachAssessmentPage = lazy(() => import('./pages/CoachAssessmentPage'));
const MatchDayAssessmentPage = lazy(() => import('./pages/MatchDayAssessmentPage'));
const RotationTrackerPage = lazy(() => import('./pages/RotationTrackerPage'));
const CoachProfilePage = lazy(() => import('./pages/CoachProfilePage'));
const CoachPlayerOverviewPage = lazy(() => import('./pages/CoachPlayerOverviewPage'));
const TrainingPlansListPage = lazy(() => import('./pages/TrainingPlansListPage'));
const TrainingPlanBuilderPage = lazy(() => import('./pages/TrainingPlanBuilderPage'));
const TrainingHistoryPage = lazy(() => import('./pages/TrainingHistoryPage'));
const MatchHistoryPage = lazy(() => import('./pages/MatchHistoryPage'));

// Drill chunk
const DrillLibraryPage = lazy(() => import('./pages/DrillLibraryPage'));
const DrillDetailPage = lazy(() => import('./pages/DrillDetailPage'));
const CreateDrillPage = lazy(() => import('./pages/CreateDrillPage'));
const EditDrillPage = lazy(() => import('./pages/EditDrillPage'));

// IDP chunk
const PlayerIDPPage = lazy(() => import('./pages/PlayerIDPPage'));
const CreateIDPPage = lazy(() => import('./pages/CreateIDPPage'));
const IDPReviewPage = lazy(() => import('./pages/IDPReviewPage'));

// Player/shared chunk
const PlayerPortal = lazy(() => import('./pages/PlayerPortal'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const SkillsPassportPage = lazy(() => import('./pages/SkillsPassportPage'));
const BenchmarkAdminPage = lazy(() => import('./pages/BenchmarkAdminPage'));

// Notifications chunk
const NotificationsInboxPage = lazy(() => import('./pages/NotificationsInboxPage'));
const NotificationPreferencesPage = lazy(() => import('./pages/NotificationPreferencesPage'));

// Admin chunk
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProfilePage = lazy(() => import('./pages/AdminProfilePage'));
const RosterManagementPage = lazy(() => import('./pages/admin/RosterManagementPage'));
const ScheduleManagementPage = lazy(() => import('./pages/admin/ScheduleManagementPage'));
const PlayerHQIntegrationPage = lazy(() => import('./pages/admin/PlayerHQIntegrationPage'));
const ClubAnalyticsPage = lazy(() => import('./pages/admin/ClubAnalyticsPage'));
const AgeGroupReportsPage = lazy(() => import('./pages/admin/AgeGroupReportsPage'));
const AgeGroupDetailReportPage = lazy(() => import('./pages/admin/AgeGroupDetailReportPage'));
const CoachingEffectivenessPage = lazy(() => import('./pages/admin/CoachingEffectivenessPage'));
const CurriculumAnalysisPage = lazy(() => import('./pages/admin/CurriculumAnalysisPage'));
const RepTeamProspectsPage = lazy(() => import('./pages/admin/RepTeamProspectsPage'));
const DataExplorerPage = lazy(() => import('./pages/admin/DataExplorerPage'));
const ReportsExportPage = lazy(() => import('./pages/admin/ReportsExportPage'));
const SystemManagementPage = lazy(() => import('./pages/admin/SystemManagementPage'));
const TrainingPlansLibraryPage = lazy(() => import('./pages/admin/TrainingPlansLibraryPage'));
const GameResultsPage = lazy(() => import('./pages/admin/GameResultsPage'));
const NotificationsAdminPage = lazy(() => import('./pages/admin/NotificationsPage'));
const SampleDataPage = lazy(() => import('./pages/admin/SampleDataPage'));
const ParentInvitationsPage = lazy(() => import('./pages/admin/ParentInvitationsPage'));
const DataCleanupPage = lazy(() => import('./pages/admin/DataCleanupPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const TeamManagementPage = lazy(() => import('./pages/admin/TeamManagementPage'));
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage'));
const AssessmentMetricsPage = lazy(() => import('./pages/admin/AssessmentMetricsPage'));
const CoachCompliancePage = lazy(() => import('./pages/admin/CoachCompliancePage'));
const AdminMatchAssessmentsPage = lazy(() => import('./pages/admin/AdminMatchAssessmentsPage'));
const AdminTrainingRecordsPage = lazy(() => import('./pages/admin/AdminTrainingRecordsPage'));
const AssessmentsHubPage = lazy(() => import('./pages/admin/AssessmentsHubPage'));
const AnalyticsHubPage = lazy(() => import('./pages/admin/AnalyticsHubPage'));

// Tryout chunk
const TryoutSessionsPage = lazy(() => import('./pages/admin/TryoutSessionsPage'));
const TryoutResultsPage = lazy(() => import('./pages/admin/TryoutResultsPage'));
const TryoutAssessorPage = lazy(() => import('./pages/TryoutAssessorPage'));
const AssessorDashboard = lazy(() => import('./pages/AssessorDashboard'));

// Team Selection (unified tryout + scouting)
const TeamSelectionPage = lazy(() => import('./pages/admin/TeamSelectionPage'));

// Scouting chunk
const ScoutManagementPage = lazy(() => import('./pages/admin/ScoutManagementPage'));
const ScoutAssessmentPage = lazy(() => import('./pages/ScoutAssessmentPage'));
const ScoutDashboard = lazy(() => import('./pages/ScoutDashboard'));

// Youth chunk
const YouthProgramsPage = lazy(() => import('./pages/admin/YouthProgramsPage'));
const YouthCoachPage = lazy(() => import('./pages/YouthCoachPage'));
const SessionSummaryForm = lazy(() => import('./pages/youth/SessionSummaryForm'));
const SessionSummaryHistory = lazy(() => import('./pages/youth/SessionSummaryHistory'));

// Coach schedule (read-only) + training recording
const CoachSchedulePage = lazy(() => import('./pages/CoachSchedulePage'));
const CoachMySchedulePage = lazy(() => import('./pages/CoachMySchedulePage'));
const RecordTrainingPage = lazy(() => import('./pages/coach/RecordTrainingPage'));
const RecordTrainingSelectionPage = lazy(() => import('./pages/coach/RecordTrainingSelectionPage'));
const RotationAnalyticsPage = lazy(() => import('./pages/coach/RotationAnalyticsPage'));

// Admin rotation analytics
const AdminRotationAnalyticsPage = lazy(() => import('./pages/admin/AdminRotationAnalyticsPage'));

// Beta feedback
const BetaFeedbackPage = lazy(() => import('./pages/admin/BetaFeedbackPage'));

// Parent chunk
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ParentTeamViewPage = lazy(() => import('./pages/ParentTeamViewPage'));
const ParentSchedulePage = lazy(() => import('./pages/ParentSchedulePage'));

// Manager chunk
const ManagerTeamPage = lazy(() => import('./pages/ManagerTeamPage'));
const ScoringRosterPage = lazy(() => import('./pages/ScoringRosterPage'));

// Help chunk
const HelpHome = lazy(() => import('./pages/help/HelpHome'));
const AdminHelp = lazy(() => import('./pages/help/AdminHelp'));
const LeadershipHelp = lazy(() => import('./pages/help/LeadershipHelp'));
const CoordinatorHelp = lazy(() => import('./pages/help/CoordinatorHelp'));
const CoachHelp = lazy(() => import('./pages/help/CoachHelp'));
const YouthCoachHelp = lazy(() => import('./pages/help/YouthCoachHelp'));
const AssessorHelp = lazy(() => import('./pages/help/AssessorHelp'));
const ParentHelp = lazy(() => import('./pages/help/ParentHelp'));
const PlayerHelp = lazy(() => import('./pages/help/PlayerHelp'));

// ============================================
// Loading fallback
// ============================================
const PageLoader = () => (
  <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
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
              <ErrorBoundary fallbackMessage="Unable to load welcome page.">
                <WelcomePage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary fallbackMessage="Unable to load dashboard.">
                  {ADMIN_ROLES.includes(userProfile?.role) ? <AdminDashboard /> :
                   ['girls_coordinator', 'boys_coordinator', 'youth_head_coach'].includes(userProfile?.role) ? <AdminDashboard /> :
                   userProfile?.role === 'coach' ? <CoachDashboard /> :
                   userProfile?.role === 'youth_coach' ? <CoachDashboard /> :
                   userProfile?.role === 'player' ? <PlayerPortal /> :
                   userProfile?.role === 'parent' ? <ParentDashboard /> :
                   userProfile?.role === 'team_manager' ? <PlayerPortal /> :
                   userProfile?.role === 'tryout_assessor' ? <Navigate to="/assessor" replace /> :
                   <Navigate to="/welcome" replace />}
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach"
          element={
            <ProtectedRoute allowedRoles={['coach']}>
              <Layout>
                <ErrorBoundary fallbackMessage="Unable to load coach dashboard.">
                  <CoachDashboard />
                </ErrorBoundary>
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
          path="/coach/schedule"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load schedule.">
                <CoachSchedulePage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach/my-schedule"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load schedule.">
                <CoachMySchedulePage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach/record-training"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load record training.">
                <RecordTrainingSelectionPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach/training-session/:gameId"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load training session.">
                <RecordTrainingPage />
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

        {/* Individual Development Plan Routes */}
        <Route
          path="/players/:playerId/development-plan"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES, 'parent']}>
              <ErrorBoundary fallbackMessage="Unable to load development plan.">
                <PlayerIDPPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/players/:playerId/development-plan/new"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load plan builder.">
                <CreateIDPPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/development-plans/:planId/review"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load plan review.">
                <IDPReviewPage />
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

        {/* Training History Routes */}
        <Route
          path="/coach/training-history"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load training history.">
                <TrainingHistoryPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/training-history/:sessionId"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load training session.">
                <TrainingHistoryPage />
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
                <ErrorBoundary fallbackMessage="Unable to load drill library.">
                  <DrillLibraryPage />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drills/new"
          element={
            <ProtectedRoute allowedRoles={DRILL_EDIT_ROLES}>
              <ErrorBoundary fallbackMessage="Unable to load drill creator.">
                <CreateDrillPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drills/:id"
          element={
            <ProtectedRoute allowedRoles={DRILL_VIEW_ROLES}>
              <ErrorBoundary fallbackMessage="Unable to load drill details.">
                <DrillDetailPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drills/:id/edit"
          element={
            <ProtectedRoute allowedRoles={DRILL_EDIT_ROLES}>
              <ErrorBoundary fallbackMessage="Unable to load drill editor.">
                <EditDrillPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <Layout>
                <ErrorBoundary fallbackMessage="Unable to load admin dashboard.">
                  <AdminDashboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/player"
          element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary fallbackMessage="Unable to load player portal.">
                  <PlayerPortal />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackMessage="Unable to load team page.">
                <TeamPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackMessage="Unable to load training page.">
                <TrainingPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackMessage="Unable to load stats page.">
                <StatsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/skills-passport/:playerId?"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackMessage="Unable to load skills passport.">
                <SkillsPassportPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackMessage="Unable to load messages.">
                <MessagesPage />
              </ErrorBoundary>
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
              <ErrorBoundary fallbackMessage="Unable to load assessment page.">
                <CoachAssessmentPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach/match-assessment"
          element={
            <ProtectedRoute allowedRoles={['coach']}>
              <ErrorBoundary fallbackMessage="Unable to load match day assessment.">
                <MatchDayAssessmentPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach/match-history"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load match history.">
                <MatchHistoryPage />
              </ErrorBoundary>
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
          path="/coach/rotation-analytics"
          element={
            <ProtectedRoute allowedRoles={['coach']}>
              <ErrorBoundary fallbackMessage="Unable to load rotation analytics.">
                <RotationAnalyticsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/rotation-analytics"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load rotation analytics.">
                <AdminRotationAnalyticsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/benchmarks"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load benchmarks.">
                <BenchmarkAdminPage />
              </ErrorBoundary>
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
            <ProtectedRoute allowedRoles={[...STAFF_ROLES, 'team_manager']}>
              <ErrorBoundary fallbackMessage="Unable to load scoring roster.">
                <ScoringRosterPage />
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

        <Route
          path="/youth-programs/:programId/session-summary"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES, 'youth_coach', 'youth_head_coach']}>
              <ErrorBoundary fallbackMessage="Unable to load session summary form.">
                <SessionSummaryForm />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/youth-programs/:programId/session-history"
          element={
            <ProtectedRoute allowedRoles={[...STAFF_ROLES, 'youth_coach', 'youth_head_coach']}>
              <ErrorBoundary fallbackMessage="Unable to load session history.">
                <SessionSummaryHistory />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Team Selection (unified) */}
        <Route
          path="/admin/team-selection"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'girls_coordinator', 'boys_coordinator']}>
              <ErrorBoundary fallbackMessage="Unable to load team selection.">
                <TeamSelectionPage />
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
            <ProtectedRoute allowedRoles={TRYOUT_ASSESSOR_ROLES}>
              <ErrorBoundary fallbackMessage="Unable to load assessor view.">
                <TryoutAssessorPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Scouting Routes */}
        <Route
          path="/admin/game-scouts"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'girls_coordinator', 'boys_coordinator']}>
              <ErrorBoundary fallbackMessage="Unable to load scout management.">
                <ScoutManagementPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scout-dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackMessage="Unable to load scout dashboard.">
                <ScoutDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scout/:gameId"
          element={
            <ProtectedRoute>
              <ErrorBoundary fallbackMessage="Unable to load scout assessment.">
                <ScoutAssessmentPage />
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
          path="/parent/team"
          element={
            <ProtectedRoute allowedRoles={['parent', ...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load team view.">
                <ParentTeamViewPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/schedule"
          element={
            <ProtectedRoute allowedRoles={['parent', ...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load schedule.">
                <ParentSchedulePage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/team"
          element={
            <ProtectedRoute allowedRoles={['team_manager', ...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load team view.">
                <ManagerTeamPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/scoring"
          element={
            <ProtectedRoute allowedRoles={['team_manager', ...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load scoring roster.">
                <ScoringRosterPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assessor"
          element={
            <ProtectedRoute allowedRoles={TRYOUT_ASSESSOR_ROLES}>
              <ErrorBoundary fallbackMessage="Unable to load assessor dashboard.">
                <AssessorDashboard />
              </ErrorBoundary>
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
          path="/admin/beta-feedback"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load beta feedback.">
                <BetaFeedbackPage />
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
          path="/admin/match-assessments"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load match assessments.">
                <AdminMatchAssessmentsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/training-records"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load training records.">
                <AdminTrainingRecordsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/assessments-hub"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load assessments hub.">
                <AssessmentsHubPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics-hub"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <ErrorBoundary fallbackMessage="Unable to load analytics hub.">
                <AnalyticsHubPage />
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
        <Route path="/help" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><HelpHome /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/admin" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><AdminHelp /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/leadership" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><LeadershipHelp /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/coordinators" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><CoordinatorHelp /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/coaches" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><CoachHelp /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/youth-coaches" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><YouthCoachHelp /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/assessors" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><AssessorHelp /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/parents" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><ParentHelp /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/help/players" element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to load help."><PlayerHelp /></ErrorBoundary></ProtectedRoute>} />
        {/* Backward-compat redirects */}
        <Route path="/help/assessor-guide" element={<Navigate to="/help/assessors" replace />} />
        <Route path="/help/little-lakers-guide" element={<Navigate to="/help/youth-coaches" replace />} />

        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </Suspense>
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
              <div className="safe-bottom">
                <AppRoutes />
              </div>
              <FeedbackButton />
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
