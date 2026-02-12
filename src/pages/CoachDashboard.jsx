import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useGameDayDetection, formatGameForDisplay } from '../hooks/useGameDayDetection';
import {
  Users,
  TrendingUp,
  Award,
  Activity,
  Calendar,
  Target,
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  Trophy,
  FileText,
  Trash2,
  Play,
  Clock,
  AlertCircle,
  Dumbbell,
  Zap
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import EmptyState from '../components/EmptyState';
import HelpTooltip from '../components/tutorial/HelpTooltip';
import FirstTimeHint from '../components/tutorial/FirstTimeHint';
import TutorialPromptCard from '../components/tutorial/TutorialPromptCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const CoachDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { players, games, evaluations, attendance, teams, trainingPlans, loading: dataLoading } = useData();
  const { userProfile, currentUser, loading: authLoading } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [pendingDrafts, setPendingDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [gameDayDismissed, setGameDayDismissed] = useState(false);
  const [gameDayCheckComplete, setGameDayCheckComplete] = useState(false);

  // Game Day Detection
  const { isGameDay, todaysGames, primaryGame, hasMultipleGames, loading: gameDayLoading, dataReady } = useGameDayDetection();

  // Overall loading state
  const isLoading = authLoading || dataLoading || !dataReady;

  // Load drafts from localStorage
  const loadDrafts = useCallback(() => {
    if (!currentUser) {
      setLoadingDrafts(false);
      return;
    }

    try {
      const drafts = [];
      const uid = currentUser.uid;

      // Scan localStorage for assessment drafts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Skills assessment drafts
        if (key?.startsWith(`assessment_draft_${uid}_`)) {
          const data = JSON.parse(localStorage.getItem(key));
          drafts.push({
            id: key,
            type: 'skills',
            ...data
          });
        }

        // Match day drafts
        if (key?.startsWith(`match_draft_${uid}_`)) {
          const data = JSON.parse(localStorage.getItem(key));
          drafts.push({
            id: key,
            type: 'match',
            ...data
          });
        }
      }

      // Sort by most recent first
      drafts.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
      setPendingDrafts(drafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoadingDrafts(false);
    }
  }, [currentUser]);

  // Load drafts on mount and when user changes
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Auto-redirect to Match Day Assessment on game days
  useEffect(() => {
    // Wait until data is fully ready
    if (!dataReady || gameDayLoading) {
      return;
    }

    // Mark that the check is complete (for loading UI)
    setGameDayCheckComplete(true);

    // Check if we should auto-redirect
    const skipAutoRedirect = location.state?.skipGameDayRedirect;
    const hasSeenGameDayToday = sessionStorage.getItem('gameDayRedirectShown');

    if (
      isGameDay &&
      primaryGame &&
      !skipAutoRedirect &&
      !hasSeenGameDayToday &&
      !gameDayDismissed
    ) {
      // Mark that we've shown the redirect this session
      sessionStorage.setItem('gameDayRedirectShown', 'true');

      // Format game data for the Match Day Assessment page
      const gameData = formatGameForDisplay(primaryGame);

      // Auto-navigate to Match Day Assessment with game data
      navigate('/coach/match-assessment', {
        state: {
          isGameDay: true,
          gameData,
          allTodaysGames: todaysGames.map(formatGameForDisplay)
        }
      });
    }
  }, [dataReady, gameDayLoading, isGameDay, primaryGame, todaysGames, navigate, location.state, gameDayDismissed]);

  // Handle "Stay on Dashboard" click
  const handleStayOnDashboard = () => {
    setGameDayDismissed(true);
    sessionStorage.setItem('gameDayRedirectShown', 'true');
  };

  // Navigate to Match Day with game data
  const handleGoToMatchDay = (game = null) => {
    const targetGame = game || primaryGame;
    const gameData = formatGameForDisplay(targetGame);

    navigate('/coach/match-assessment', {
      state: {
        isGameDay: true,
        gameData,
        allTodaysGames: todaysGames.map(formatGameForDisplay)
      }
    });
  };

  // Handle resume draft
  const handleResumeDraft = (draft) => {
    if (draft.type === 'skills') {
      navigate(`/coach-assessment?draftId=${encodeURIComponent(draft.id)}`);
    } else if (draft.type === 'match') {
      navigate(`/coach/match-assessment?draftId=${encodeURIComponent(draft.id)}`);
    }
  };

  // Handle delete draft
  const handleDeleteDraft = (draftId) => {
    if (window.confirm('Delete this draft? This cannot be undone.')) {
      localStorage.removeItem(draftId);
      loadDrafts();
    }
  };

  // Get teams the coach manages - derive from Firestore teams collection
  const coachTeams = useMemo(() => {
    if (userProfile?.role === 'admin') {
      return [...new Set(players.map(p => p.team))].filter(Boolean);
    }
    // Derive from teams collection by matching coachId to current user
    if (teams && teams.length > 0 && currentUser) {
      const myTeamNames = teams
        .filter(t => t.coachId === currentUser.uid)
        .map(t => t.name || t.teamName)
        .filter(Boolean);
      if (myTeamNames.length > 0) return myTeamNames;
    }
    // Fallback: try userProfile.teams if set, otherwise show all
    return userProfile?.teams || [...new Set(players.map(p => p.team))].filter(Boolean);
  }, [players, userProfile, teams, currentUser]);

  // Get full team objects for the coach's teams (with player counts)
  const coachTeamObjects = useMemo(() => {
    if (userProfile?.role === 'admin') {
      const teamNames = [...new Set(players.map(p => p.team))].filter(Boolean);
      return teamNames.map(name => ({
        id: name,
        name,
        playerCount: players.filter(p => p.team === name).length
      }));
    }
    if (teams?.length > 0 && currentUser) {
      return teams
        .filter(t => t.coachId === currentUser.uid)
        .map(t => ({
          ...t,
          displayName: t.name || t.teamName,
          playerCount: players.filter(p => p.team === (t.name || t.teamName)).length
        }));
    }
    return [];
  }, [players, teams, userProfile, currentUser]);

  // Training plans for this coach
  const coachPlansData = useMemo(() => {
    const myPlans = currentUser
      ? trainingPlans.filter(p => p.coachId === currentUser.uid)
      : [];
    // For admins, show all plans
    const plans = userProfile?.role === 'admin' ? trainingPlans : myPlans;
    const activePlans = plans.filter(p => p.status === 'active');

    // Find next upcoming session from active plans
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextSession = null;
    activePlans.forEach(plan => {
      (plan.sessions || []).forEach(session => {
        const sessionDate = new Date(session.date);
        if (sessionDate >= today) {
          if (!nextSession || sessionDate < new Date(nextSession.date)) {
            nextSession = { ...session, planName: plan.name };
          }
        }
      });
    });

    return { total: plans.length, active: activePlans.length, nextSession };
  }, [trainingPlans, currentUser, userProfile]);

  // Filter players by selected team
  const filteredPlayers = useMemo(() => {
    if (selectedTeam === 'all') {
      return players.filter(p => coachTeams.includes(p.team));
    }
    return players.filter(p => p.team === selectedTeam);
  }, [players, selectedTeam, coachTeams]);

  // Calculate team metrics
  const teamMetrics = useMemo(() => {
    const teamGames = selectedTeam === 'all'
      ? games.filter(g => coachTeams.includes(g.team))
      : games.filter(g => g.team === selectedTeam);

    const wins = teamGames.filter(g => g.result === 'win').length;
    const total = teamGames.length;
    const winRate = total > 0 ? (wins / total * 100).toFixed(1) : 0;

    const teamAttendance = selectedTeam === 'all'
      ? attendance.filter(a => coachTeams.includes(a.team))
      : attendance.filter(a => a.team === selectedTeam);

    const avgAttendance = teamAttendance.length > 0
      ? (teamAttendance.reduce((sum, a) => sum + (a.present?.length || 0), 0) / teamAttendance.length).toFixed(1)
      : 0;

    const playerIds = filteredPlayers.map(p => p.id);
    const playerEvals = Object.values(evaluations).filter(e => playerIds.includes(e.playerId));
    const avgSkillLevel = playerEvals.length > 0
      ? (playerEvals.reduce((sum, e) => sum + (e.level || 0), 0) / playerEvals.length).toFixed(2)
      : 0;

    return {
      totalPlayers: filteredPlayers.length,
      gamesPlayed: total,
      winRate,
      avgAttendance,
      avgSkillLevel
    };
  }, [selectedTeam, games, attendance, evaluations, filteredPlayers, coachTeams]);

  // MVP Leaderboard
  const mvpLeaderboard = useMemo(() => {
    const mvpCounts = {};

    games.forEach(game => {
      if (game.mvp && (selectedTeam === 'all' || game.team === selectedTeam)) {
        mvpCounts[game.mvp] = (mvpCounts[game.mvp] || 0) + 1;
      }
    });

    return Object.entries(mvpCounts)
      .map(([playerId, count]) => {
        const player = players.find(p => p.id === playerId);
        return { player, count };
      })
      .filter(item => item.player)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [games, players, selectedTeam]);

  // Attendance trend chart
  const attendanceTrendData = useMemo(() => {
    const last10Sessions = attendance
      .filter(a => selectedTeam === 'all' || a.team === selectedTeam)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .reverse();

    return {
      labels: last10Sessions.map(a => new Date(a.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Attendance',
        data: last10Sessions.map(a => a.present?.length || 0),
        backgroundColor: 'rgba(0, 166, 81, 0.7)',
      }]
    };
  }, [attendance, selectedTeam]);

  // Show loading state while waiting for data
  if (isLoading || !gameDayCheckComplete) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-800 font-medium">Loading Dashboard...</p>
          <p className="text-gray-500 text-sm mt-1">
            {authLoading ? 'Checking authentication...' :
             dataLoading ? 'Loading data...' :
             !gameDayCheckComplete ? 'Checking for games today...' : 'Almost ready...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header — stays dark */}
      <div className="bg-[#005028] border-b border-[#003018] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Coach Dashboard' }
            ]}
            className="mb-3 [&_*]:text-green-200 [&_button]:!text-green-300 [&_button:hover]:!text-white [&_span.font-medium]:!text-white"
          />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Coach Dashboard</h1>
              <p className="text-sm text-green-300 mt-1">
                Welcome back, {userProfile?.displayName || 'Coach'}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
              {/* Training Plans Button */}
              <button
                onClick={() => navigate('/coach/training-plans')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
              >
                <Dumbbell className="w-5 h-5" />
                <span className="hidden sm:inline">Plans</span>
              </button>

              {/* Assess Skills Button */}
              <FirstTimeHint hintKey="coach_assess_skills">
                <button
                  onClick={() => navigate('/coach-assessment')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  <span className="hidden sm:inline">Skills</span>
                </button>
              </FirstTimeHint>

              {/* Match Day Assessment Button */}
              <HelpTooltip text="Record live game performance observations for your players during match day.">
                <button
                  onClick={() => navigate('/coach/match-assessment')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
                >
                  <Trophy className="w-5 h-5" />
                  <span className="hidden sm:inline">Match Day</span>
                </button>
              </HelpTooltip>

              {/* Rotation Tracker Button */}
              <HelpTooltip text="Track player rotations and playing time during live games.">
                <button
                  onClick={() => navigate('/coach/rotation-tracker')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  <span className="hidden sm:inline">Rotations</span>
                </button>
              </HelpTooltip>

              {/* Team Selector */}
              <HelpTooltip text="Filter dashboard data by a specific team or view all teams at once.">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                >
                  <option value="all">All Teams</option>
                  {coachTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </HelpTooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tutorial prompt for first-time coaches */}
        <TutorialPromptCard tutorialId="coach" />

        {/* Game Day Banner - Shows when there's a game today but user stayed on dashboard */}
        {isGameDay && gameDayDismissed && primaryGame && (
          <div className="bg-gradient-to-r from-[#00A651]/20 to-[#00A651]/10 border-2 border-[#00A651] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#005028] rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00A651] text-xs font-bold uppercase tracking-wide">🏀 Game Day!</span>
                  </div>
                  <h3 className="text-gray-800 font-bold text-lg">
                    {primaryGame.teamName || primaryGame.team} vs {primaryGame.opponent}
                  </h3>
                  <p className="text-[#00A651] text-sm">
                    @ {primaryGame.time} • {primaryGame.venue}
                    {hasMultipleGames && ` (+${todaysGames.length - 1} more game${todaysGames.length > 2 ? 's' : ''})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleGoToMatchDay()}
                className="flex items-center gap-2 px-5 py-3 bg-[#005028] hover:bg-[#00A651] text-white rounded-xl font-bold transition-colors"
              >
                <Trophy className="w-5 h-5" />
                Start Assessment
              </button>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <MetricCard icon={Users} label="Total Players" value={teamMetrics.totalPlayers} />
          <MetricCard icon={Activity} label="Games Played" value={teamMetrics.gamesPlayed} />
          <MetricCard icon={TrendingUp} label="Win Rate" value={`${teamMetrics.winRate}%`} />
          <MetricCard icon={Calendar} label="Avg Attendance" value={teamMetrics.avgAttendance} />
          <MetricCard icon={Target} label="Avg Skill Level" value={teamMetrics.avgSkillLevel} />
        </div>

        {/* Pending Drafts Section */}
        {pendingDrafts.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <HelpTooltip text="Draft assessments saved on this device. Resume them anytime before submission.">
                    <h2 className="text-lg font-bold text-gray-800">Pending Assessments</h2>
                  </HelpTooltip>
                  <p className="text-yellow-600 text-sm">
                    {pendingDrafts.length} draft{pendingDrafts.length !== 1 ? 's' : ''} awaiting completion
                  </p>
                </div>
              </div>
              <div className="bg-yellow-500 text-white text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">
                {pendingDrafts.length}
              </div>
            </div>

            <div className="space-y-3">
              {pendingDrafts.map((draft) => {
                const isSkillsDraft = draft.type === 'skills';
                const draftDate = draft.savedAt ? new Date(draft.savedAt) : null;

                // Calculate completion for skills drafts
                let completedSkills = 0;
                let totalSkills = 8;
                if (isSkillsDraft && draft.assessments) {
                  completedSkills = Object.values(draft.assessments).filter(v => v > 0).length;
                }

                return (
                  <div
                    key={draft.id}
                    className="bg-white border border-[#D4E4D4] rounded-lg p-4 hover:border-[#00A651] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSkillsDraft ? 'bg-[#F5F9F5]' : 'bg-[#F5F9F5]'
                        }`}>
                          {isSkillsDraft ? (
                            <ClipboardCheck className="w-5 h-5 text-[#005028]" />
                          ) : (
                            <Trophy className="w-5 h-5 text-[#00A651]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              isSkillsDraft
                                ? 'bg-[#F5F9F5] text-[#005028]'
                                : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#00A651]'
                            }`}>
                              {isSkillsDraft ? 'Skills Assessment' : 'Match Day'}
                            </span>
                            <span className="text-gray-400 text-xs">{draft.teamName || 'Unknown Team'}</span>
                          </div>
                          <h4 className="text-gray-800 font-semibold mt-1 truncate">
                            {isSkillsDraft ? draft.playerName : (draft.opponentName || 'vs TBD')}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            {draftDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {draftDate.toLocaleDateString('en-AU', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                            {isSkillsDraft && (
                              <span className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {completedSkills}/{totalSkills} skills rated
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleResumeDraft(draft)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          <span className="hidden sm:inline">Resume</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-2 bg-gray-100 hover:bg-red-50 border border-[#D4E4D4] hover:border-red-300 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Training Plans Quick Card */}
        <div
          onClick={() => navigate('/coach/training-plans')}
          className="bg-gradient-to-r from-[#005028] to-[#003018] border-2 border-[#005028] rounded-xl p-6 mb-6 cursor-pointer hover:border-[#00A651] transition-all group"
        >
          {coachPlansData.total === 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 border-2 border-white/20 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-7 h-7 text-green-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Training Plans</h2>
                  <p className="text-green-300 text-sm">No training plans yet</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/coach/training-plans/new');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Create Your First Plan
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 border-2 border-[#00A651] rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-7 h-7 text-green-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Training Plans</h2>
                  <p className="text-green-300 text-sm">
                    {coachPlansData.active} active plan{coachPlansData.active !== 1 ? 's' : ''}
                    {coachPlansData.nextSession && (
                      <> &bull; Next: {new Date(coachPlansData.nextSession.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/coach/training-plans/new');
                  }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  New Plan
                </button>
                <ChevronRight className="w-6 h-6 text-green-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* MVP Leaderboard */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-[#D4E4D4] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-[#00A651]" />
              <h2 className="text-lg font-bold text-gray-800">MVP Leaderboard</h2>
            </div>

            {mvpLeaderboard.length > 0 ? (
              <div className="space-y-3">
                {mvpLeaderboard.map((item, index) => (
                  <div
                    key={item.player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#F5F9F5] border border-[#D4E4D4]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-300 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{item.player.name}</p>
                        <p className="text-xs text-gray-400">{item.player.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">{item.count}</p>
                      <p className="text-xs text-gray-400">MVP{item.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No MVP votes yet</p>
            )}
          </div>

          {/* Attendance Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#D4E4D4] p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#00A651]" />
              <h2 className="text-lg font-bold text-gray-800">Attendance Trend</h2>
            </div>
            {attendanceTrendData.labels.length > 0 ? (
              <Bar
                data={attendanceTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: '#6B7C6B' },
                      grid: { color: 'rgba(212, 228, 212, 0.5)' }
                    },
                    x: {
                      ticks: { color: '#6B7C6B' },
                      grid: { color: 'rgba(212, 228, 212, 0.5)' }
                    }
                  }
                }}
                height={200}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No attendance data yet</p>
            )}
          </div>
        </div>

        {/* My Teams */}
        <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00A651]" />
              <h2 className="text-lg font-bold text-gray-800">My Teams</h2>
              <span className="text-sm text-gray-400">
                {coachTeamObjects.reduce((sum, t) => sum + t.playerCount, 0)} players
              </span>
            </div>
            <button
              onClick={() => navigate('/coach/players')}
              className="text-sm text-[#00A651] hover:text-[#005028] transition-colors flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {coachTeamObjects.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Teams Assigned"
              message="You haven't been assigned to any teams yet. Contact your administrator."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coachTeamObjects.map(team => (
                <div
                  key={team.id}
                  onClick={() => navigate(`/coach/players?team=${encodeURIComponent(team.id || team.name || team.displayName)}`)}
                  className="p-4 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg hover:border-[#00A651] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-[#005028] transition-colors">
                        {team.displayName || team.name}
                      </h3>
                      {team.ageGroup && (
                        <p className="text-xs text-gray-400">{team.ageGroup}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00A651] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">{team.playerCount} player{team.playerCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-xl border border-[#D4E4D4] p-6 hover:border-[#00A651] transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className="w-12 h-12 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#005028]" />
      </div>
    </div>
  </div>
);

export default CoachDashboard;
