import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download, Users, BarChart3, Filter, Star,
  ChevronDown, ChevronUp, User, Eye, X, Clock, CheckCircle,
  AlertCircle, ArrowUpCircle, Timer, Zap, Lock, FileText,
  Send, Search, Printer, ChevronRight, AlertTriangle,
  TrendingUp, Target, Shuffle, Award, Info, Copy, Check
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, BarChart, Bar, Cell, ResponsiveContainer,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import PageShell from '../../components/PageShell';
import {
  getTryoutSession,
  updateTryoutSession,
  subscribeSessionEvaluations,
  getPlayerSummary,
  getEnhancedPlayerSummary,
  getAssessorConsistency,
  getSessionCompletionStats,
  detectOutlierRatings,
  closeSession,
  exportToCSV,
  exportTeamRosterCSV,
  downloadCSV,
  formatTime24to12,
  stdDev,
  EVAL_METRICS,
  TEAM_OPTIONS,
  EVAL_STATUSES
} from '../../services/tryoutService';

// ============================================
// HELPERS
// ============================================

const getRatingColor = (value) => {
  if (!value) return 'text-[#1a8a68]';
  const v = parseFloat(value);
  if (v >= 4) return 'text-green-400';
  if (v >= 3) return 'text-yellow-400';
  if (v >= 2) return 'text-orange-400';
  return 'text-red-400';
};

const getRatingBg = (value) => {
  if (!value) return 'bg-[#1a8a68]/30';
  const v = parseFloat(value);
  if (v >= 4) return 'bg-green-500/30';
  if (v >= 3) return 'bg-yellow-500/30';
  if (v >= 2) return 'bg-orange-500/30';
  return 'bg-red-500/30';
};

const getHeatmapColor = (value) => {
  if (!value || value === '-') return '#1a3a2e';
  const v = parseFloat(value);
  if (v >= 4.5) return '#15803d';
  if (v >= 4.0) return '#22c55e';
  if (v >= 3.5) return '#4ade80';
  if (v >= 3.0) return '#eab308';
  if (v >= 2.5) return '#f59e0b';
  if (v >= 2.0) return '#f97316';
  if (v >= 1.5) return '#ef4444';
  return '#dc2626';
};

const TIER_CONFIG = [
  { name: 'High (4.0+)', min: 4.0, max: 5.01, color: '#22c55e' },
  { name: 'Mid (2.5-3.9)', min: 2.5, max: 4.0, color: '#eab308' },
  { name: 'Dev (<2.5)', min: 0, max: 2.5, color: '#ef4444' }
];

// Hour 1 (Development): assign to development squads 3-8
const HOUR1_ASSIGN_OPTIONS = [
  { value: 'squad-3', label: 'Squad 3', shortLabel: 'S3', color: 'bg-violet-500 text-white', borderColor: 'border-violet-500', columnColor: 'violet' },
  { value: 'squad-4', label: 'Squad 4', shortLabel: 'S4', color: 'bg-indigo-500 text-white', borderColor: 'border-indigo-500', columnColor: 'indigo' },
  { value: 'squad-5', label: 'Squad 5', shortLabel: 'S5', color: 'bg-cyan-500 text-white', borderColor: 'border-cyan-500', columnColor: 'cyan' },
  { value: 'squad-6', label: 'Squad 6', shortLabel: 'S6', color: 'bg-teal-500 text-white', borderColor: 'border-teal-500', columnColor: 'teal' },
  { value: 'squad-7', label: 'Squad 7', shortLabel: 'S7', color: 'bg-amber-500 text-white', borderColor: 'border-amber-500', columnColor: 'amber' },
  { value: 'squad-8', label: 'Squad 8', shortLabel: 'S8', color: 'bg-rose-500 text-white', borderColor: 'border-rose-500', columnColor: 'rose' },
];

// Hour 2 (Advanced): assign to competitive teams T1, T2, T3
const HOUR2_ASSIGN_OPTIONS = [
  { value: 'team-1', label: 'Team 1', shortLabel: 'T1', color: 'bg-green-500 text-white', borderColor: 'border-green-500', columnColor: 'green' },
  { value: 'team-2', label: 'Team 2', shortLabel: 'T2', color: 'bg-blue-500 text-white', borderColor: 'border-blue-500', columnColor: 'blue' },
  { value: 'team-3', label: 'Team 3', shortLabel: 'T3', color: 'bg-yellow-500 text-black', borderColor: 'border-yellow-500', columnColor: 'yellow' },
];

const ALL_ASSIGN_OPTIONS = [...HOUR1_ASSIGN_OPTIONS, ...HOUR2_ASSIGN_OPTIONS];

const getTeamAssignOptions = (sessionType) =>
  sessionType === 'hour-1' ? HOUR1_ASSIGN_OPTIONS : HOUR2_ASSIGN_OPTIONS;

const getAssignmentBadgeColor = (value) => {
  const opt = ALL_ASSIGN_OPTIONS.find(o => o.value === value);
  return opt ? opt.color.split(' ')[0] : 'bg-[#1a8a68]';
};

// ============================================
// MAIN COMPONENT
// ============================================

const TryoutResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [playerDetailId, setPlayerDetailId] = useState(null);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [assignmentsDirty, setAssignmentsDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterAssessor, setFilterAssessor] = useState('all');
  const [filterScoreMin, setFilterScoreMin] = useState('');
  const [filterScoreMax, setFilterScoreMax] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [sortBy, setSortBy] = useState('overall');
  const [sortOrder, setSortOrder] = useState('desc');

  // Team assignments (local state, saved on demand)
  const [teamAssignments, setTeamAssignments] = useState({});

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      const result = await getTryoutSession(sessionId);
      if (result.success) {
        setSession(result.data);
        // Initialize team assignments from session data
        const assignments = {};
        (result.data.players || []).forEach(p => {
          if (p.teamAssignment) assignments[p.id] = p.teamAssignment;
        });
        setTeamAssignments(assignments);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    loadSession();
  }, [sessionId]);

  // Subscribe to evaluations
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeSessionEvaluations(sessionId, setEvaluations);
    return () => unsubscribe();
  }, [sessionId]);

  // Unique assessors
  const assessors = useMemo(() => {
    const unique = new Map();
    evaluations.forEach(e => {
      if (e.assessorId && !unique.has(e.assessorId)) {
        unique.set(e.assessorId, { id: e.assessorId, name: e.assessorName });
      }
    });
    return Array.from(unique.values());
  }, [evaluations]);

  // Enhanced player summaries
  const playerSummaries = useMemo(() => {
    if (!session?.players) return [];
    return session.players.map(player => {
      const summary = getEnhancedPlayerSummary(evaluations, player.id);
      return {
        ...(summary || {
          playerId: player.id,
          playerName: player.name,
          playerNumber: player.number,
          evaluationCount: 0,
          averages: {},
          avgOverall: null,
          compositeAvg: null,
          topRecommendation: null,
          overallStdDev: 0,
          metricStdDevs: {},
          recPercentages: {},
          flags: ['not-assessed'],
          evaluations: []
        }),
        playerAgeGroup: player.playerAgeGroup || player.ageGroup || session.ageGroup || '',
        promotedFromHour1: player.promotedFromHour1 || false,
        linkedPlayerId: player.linkedPlayerId || null,
        teamAssignment: teamAssignments[player.id] || ''
      };
    });
  }, [session, evaluations, teamAssignments]);

  // Filtered and sorted summaries
  const filteredSummaries = useMemo(() => {
    let result = [...playerSummaries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.playerName?.toLowerCase().includes(q) ||
        s.playerNumber?.toString().includes(q)
      );
    }
    if (filterTeam !== 'all') {
      result = result.filter(s => s.topRecommendation === filterTeam);
    }
    if (filterAssignment !== 'all') {
      if (filterAssignment === 'unassigned') {
        result = result.filter(s => !s.teamAssignment);
      } else {
        result = result.filter(s => s.teamAssignment === filterAssignment);
      }
    }
    if (filterAssessor !== 'all') {
      result = result.filter(s =>
        s.evaluations?.some(e => e.assessorId === filterAssessor || e.assessorName === filterAssessor)
      );
    }
    if (filterScoreMin) {
      result = result.filter(s => parseFloat(s.compositeAvg || s.avgOverall || 0) >= parseFloat(filterScoreMin));
    }
    if (filterScoreMax) {
      result = result.filter(s => parseFloat(s.compositeAvg || s.avgOverall || 0) <= parseFloat(filterScoreMax));
    }

    result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'overall') {
        aVal = parseFloat(a.compositeAvg || a.avgOverall) || 0;
        bVal = parseFloat(b.compositeAvg || b.avgOverall) || 0;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? (a.playerName || '').localeCompare(b.playerName || '')
          : (b.playerName || '').localeCompare(a.playerName || '');
      } else if (sortBy === 'evaluations') {
        aVal = a.evaluationCount; bVal = b.evaluationCount;
      } else if (sortBy === 'stddev') {
        aVal = a.overallStdDev || 0; bVal = b.overallStdDev || 0;
      } else {
        aVal = parseFloat(a.averages?.[sortBy]) || 0;
        bVal = parseFloat(b.averages?.[sortBy]) || 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [playerSummaries, searchQuery, filterTeam, filterAssignment, filterAssessor, filterScoreMin, filterScoreMax, sortBy, sortOrder]);

  // Stats summary
  const stats = useMemo(() => {
    const total = session?.players?.length || 0;
    const evaluated = playerSummaries.filter(s => s.evaluationCount > 0).length;
    const notAssessed = total - evaluated;
    const promotedCount = session?.players?.filter(p => p.promotedFromHour1).length || 0;
    const assignOptions = getTeamAssignOptions(session?.sessionType);
    const assignmentCounts = {};
    assignOptions.forEach(opt => {
      assignmentCounts[opt.value] = playerSummaries.filter(s => s.teamAssignment === opt.value).length;
    });
    const assigned = Object.values(assignmentCounts).reduce((a, b) => a + b, 0);
    const unassigned = total - assigned;
    const avgScore = playerSummaries.filter(s => s.compositeAvg).length > 0
      ? (playerSummaries.reduce((sum, s) => sum + (parseFloat(s.compositeAvg) || 0), 0) /
        playerSummaries.filter(s => s.compositeAvg).length).toFixed(1)
      : '-';
    const inconsistent = playerSummaries.filter(s => s.flags?.includes('inconsistent')).length;
    const needsMoreEvals = playerSummaries.filter(s => s.flags?.includes('needs-more-evals')).length;
    return { total, evaluated, notAssessed, promotedCount, assignmentCounts, unassigned, avgScore, inconsistent, needsMoreEvals };
  }, [session, playerSummaries]);

  // Completion stats
  const completionStats = useMemo(() => getSessionCompletionStats(evaluations, session), [evaluations, session]);

  // Assign team
  const assignTeam = useCallback((playerId, team) => {
    setTeamAssignments(prev => {
      const next = { ...prev };
      if (team) {
        next[playerId] = team;
      } else {
        delete next[playerId];
      }
      return next;
    });
    setAssignmentsDirty(true);
  }, []);

  // Save assignments to Firestore
  const saveAssignments = async () => {
    if (!session?.players) return;
    setSavingAssignments(true);
    const updatedPlayers = session.players.map(p => ({
      ...p,
      teamAssignment: teamAssignments[p.id] || ''
    }));
    const result = await updateTryoutSession(sessionId, { players: updatedPlayers });
    if (result.success) {
      setAssignmentsDirty(false);
      const refreshed = await getTryoutSession(sessionId);
      if (refreshed.success) setSession(refreshed.data);
    } else {
      setError(result.error);
    }
    setSavingAssignments(false);
  };

  // Close session
  const handleCloseSession = async () => {
    if (!window.confirm('Close this session? All evaluations will be locked as finalized. This cannot be undone.')) return;
    const result = await closeSession(sessionId);
    if (result.success) {
      const refreshed = await getTryoutSession(sessionId);
      if (refreshed.success) setSession(refreshed.data);
    } else {
      setError(result.error);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = exportToCSV(evaluations, session);
    downloadCSV(csv, `tryout_${session?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportTeamRoster = () => {
    const csv = exportTeamRosterCSV(playerSummaries, session);
    downloadCSV(csv, `team_roster_${session?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrint = () => window.print();

  const handleCopySummary = () => {
    const assignOptions = getTeamAssignOptions(session?.sessionType);
    const formatList = (list) => list.map(s => `  - ${s.playerName} (#${s.playerNumber || '?'}) - Avg: ${s.compositeAvg || s.avgOverall || 'N/A'}`).join('\n');
    let text = `TRYOUT RESULTS: ${session?.name || ''}\nAge Group: ${session?.ageGroup || ''}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    assignOptions.forEach(opt => {
      const players = playerSummaries.filter(s => s.teamAssignment === opt.value);
      text += `${opt.label.toUpperCase()} (${players.length} players):\n${formatList(players) || '  (none assigned)'}\n\n`;
    });
    navigator.clipboard.writeText(text.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Get team badge
  const getTeamBadge = (teamId) => {
    const team = TEAM_OPTIONS.find(t => t.id === teamId);
    if (!team) return null;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${team.color} text-white`}>{team.label}</span>;
  };

  // ---- RENDER ----

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a8a68] border-t-[#22c55e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center p-4">
        <div className="bg-[#0d5943] border border-red-500 rounded-xl p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-lg mb-2">Error</h2>
          <p className="text-red-300 mb-4">{error || 'Session not found'}</p>
          <button onClick={() => navigate('/admin/tryouts')} className="px-4 py-2 bg-[#1a8a68] hover:bg-[#22c55e] text-white rounded-lg">
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'teambuilder', label: 'Team Builder', icon: Shuffle },
    { id: 'calibration', label: 'Calibration', icon: Target }
  ];

  const subtitleText = `${evaluations.length} evaluations from ${assessors.length} assessors` +
    (session.startTime ? ` · ${formatTime24to12(session.startTime)}` : '') +
    (session.endTime ? ` - ${formatTime24to12(session.endTime)}` : '');

  return (
    <PageShell
      title={session.name || 'Tryout Results'}
      subtitle={subtitleText}
      backTo="/admin/tryouts"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Tryouts', url: '/admin/tryouts' },
        { label: 'Results' }
      ]}
      maxWidth="6xl"
      noPadding
      headerActions={
        <div className="flex flex-wrap gap-2">
          {assignmentsDirty && (
            <button onClick={saveAssignments} disabled={savingAssignments}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg font-medium transition-colors animate-pulse">
              {savingAssignments ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save Assignments
            </button>
          )}
          {(session.status === 'active' || session.status === 'completed') && (
            <button onClick={handleCloseSession} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium">
              <Lock className="w-4 h-4" /> Close
            </button>
          )}
          <button onClick={handleCopySummary} className="flex items-center gap-2 px-3 py-2 bg-[#1a8a68] hover:bg-[#22c55e] text-white rounded-lg text-sm font-medium">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-[#1a8a68] hover:bg-[#22c55e] text-white rounded-lg text-sm font-medium">
            <Printer className="w-4 h-4" /> Print
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-[#22c55e] hover:bg-[#4ade80] text-[#0a3d2e] rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 mt-1 bg-[#0d5943] border border-[#1a8a68] rounded-lg shadow-xl z-30 hidden group-hover:block min-w-[180px]">
              <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-white text-sm hover:bg-white/10">Raw Evaluations CSV</button>
              <button onClick={handleExportTeamRoster} className="w-full text-left px-4 py-2 text-white text-sm hover:bg-white/10">Team Roster CSV</button>
            </div>
          </div>
        </div>
      }
    >

      {/* Tab Navigation */}
      <div className="bg-[#0d5943]/50 border-b border-[#1a8a68] no-print sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#22c55e] text-[#4ade80]'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block p-6 border-b">
        <h1 className="text-2xl font-bold">{session.name} - Tryout Results</h1>
        <p className="text-gray-600">{session.ageGroup} · {evaluations.length} evaluations · {new Date().toLocaleDateString()}</p>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats} playerSummaries={playerSummaries} filteredSummaries={filteredSummaries}
            evaluations={evaluations} session={session} assessors={assessors}
            completionStats={completionStats}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            filterTeam={filterTeam} setFilterTeam={setFilterTeam}
            filterAssessor={filterAssessor} setFilterAssessor={setFilterAssessor}
            filterScoreMin={filterScoreMin} setFilterScoreMin={setFilterScoreMin}
            filterScoreMax={filterScoreMax} setFilterScoreMax={setFilterScoreMax}
            filterAssignment={filterAssignment} setFilterAssignment={setFilterAssignment}
            sortBy={sortBy} setSortBy={setSortBy}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
            expandedPlayer={expandedPlayer} setExpandedPlayer={setExpandedPlayer}
            assignTeam={assignTeam} getTeamBadge={getTeamBadge}
            onPlayerDetail={setPlayerDetailId}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsTab playerSummaries={playerSummaries} evaluations={evaluations} />
        )}
        {activeTab === 'teambuilder' && (
          <TeamBuilderTab
            playerSummaries={playerSummaries} assignTeam={assignTeam}
            teamAssignments={teamAssignments} session={session}
            onSave={saveAssignments} saving={savingAssignments} dirty={assignmentsDirty}
          />
        )}
        {activeTab === 'calibration' && (
          <CalibrationTab evaluations={evaluations} session={session} assessors={assessors} />
        )}
      </div>

      {/* Player Detail Modal */}
      {playerDetailId && (
        <PlayerDetailModal
          summary={playerSummaries.find(s => s.playerId === playerDetailId)}
          evaluations={evaluations}
          session={session}
          getTeamBadge={getTeamBadge}
          onClose={() => setPlayerDetailId(null)}
          assignTeam={assignTeam}
        />
      )}
    </PageShell>
  );
};

// ============================================
// OVERVIEW TAB
// ============================================

const OverviewTab = ({
  stats, playerSummaries, filteredSummaries, evaluations, session, assessors,
  completionStats, searchQuery, setSearchQuery, filterTeam, setFilterTeam,
  filterAssessor, setFilterAssessor, filterScoreMin, setFilterScoreMin,
  filterScoreMax, setFilterScoreMax, filterAssignment, setFilterAssignment,
  sortBy, setSortBy, sortOrder, setSortOrder,
  expandedPlayer, setExpandedPlayer, assignTeam, getTeamBadge, onPlayerDetail
}) => (
  <>
    {/* Stats Cards */}
    {(() => {
      const assignOptions = getTeamAssignOptions(session.sessionType);
      const statColorMap = { green: 'text-green-400', blue: 'text-blue-400', yellow: 'text-yellow-400', violet: 'text-violet-400', indigo: 'text-indigo-400', cyan: 'text-cyan-400', teal: 'text-teal-400', amber: 'text-amber-400', rose: 'text-rose-400' };
      return (
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 print:grid-cols-6 ${assignOptions.length <= 3 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
          <StatCard label="Total Players" value={stats.total} icon={Users} />
          <StatCard label="Evaluated" value={`${stats.evaluated}/${stats.total}`} icon={CheckCircle} color="text-green-400" />
          <StatCard label="Avg Score" value={stats.avgScore} icon={Star} color="text-yellow-400" />
          {assignOptions.length <= 3 ? assignOptions.map(opt => (
            <StatCard key={opt.value} label={opt.label} value={stats.assignmentCounts[opt.value] || 0} color={statColorMap[opt.columnColor] || 'text-white'} />
          )) : (
            <StatCard label="Assigned" value={stats.total - stats.unassigned} color="text-violet-400" />
          )}
          <StatCard label="Unassigned" value={stats.unassigned} color="text-white/40" />
        </div>
      );
    })()}

    {/* Flags Banner */}
    {(stats.notAssessed > 0 || stats.inconsistent > 0 || stats.needsMoreEvals > 0) && (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-6 flex flex-wrap gap-4 text-sm no-print">
        {stats.notAssessed > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle className="w-4 h-4" /> {stats.notAssessed} not assessed
          </span>
        )}
        {stats.needsMoreEvals > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle className="w-4 h-4" /> {stats.needsMoreEvals} with only 1 assessor
          </span>
        )}
        {stats.inconsistent > 0 && (
          <span className="flex items-center gap-1 text-orange-400">
            <AlertTriangle className="w-4 h-4" /> {stats.inconsistent} with inconsistent ratings
          </span>
        )}
      </div>
    )}

    {/* Filters */}
    <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 mb-6 no-print">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#1a8a68]" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search player name..." className="bg-transparent text-white text-sm placeholder-[#1a8a68] focus:outline-none flex-1" />
        </div>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none">
          <option value="all">All Recommendations</option>
          {TEAM_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={filterAssignment} onChange={e => setFilterAssignment(e.target.value)}
          className="px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none">
          <option value="all">All Assignments</option>
          <option value="unassigned">Unassigned</option>
          {getTeamAssignOptions(session.sessionType).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {assessors.length > 1 && (
          <select value={filterAssessor} onChange={e => setFilterAssessor(e.target.value)}
            className="px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none">
            <option value="all">All Assessors</option>
            {assessors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-1">
          <input type="number" value={filterScoreMin} onChange={e => setFilterScoreMin(e.target.value)}
            placeholder="Min" min="1" max="5" step="0.1"
            className="w-16 px-2 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm focus:outline-none text-center" />
          <span className="text-[#1a8a68]">-</span>
          <input type="number" value={filterScoreMax} onChange={e => setFilterScoreMax(e.target.value)}
            placeholder="Max" min="1" max="5" step="0.1"
            className="w-16 px-2 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm focus:outline-none text-center" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none">
          <option value="overall">Sort: Overall</option>
          <option value="name">Sort: Name</option>
          <option value="evaluations">Sort: # Evals</option>
          <option value="stddev">Sort: Std Dev</option>
          {EVAL_METRICS.map(m => <option key={m.id} value={m.id}>Sort: {m.name}</option>)}
        </select>
        <button onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')}
          className="p-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white hover:border-[#22c55e]">
          {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-white/30 text-xs mt-2">{filteredSummaries.length} of {playerSummaries.length} players shown</p>
    </div>

    {/* Results Table */}
    <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden mb-6 print:border-gray-300">
      {/* Header */}
      <div className="hidden lg:grid grid-cols-[2.5fr_repeat(5,1fr)_0.8fr_0.7fr_0.7fr_1.5fr_1.5fr] gap-1 px-4 py-2 bg-[#0a3d2e] border-b border-[#1a8a68] text-xs font-medium text-[#4ade80] print:bg-gray-100 print:text-gray-700">
        <div>Player</div>
        {EVAL_METRICS.map(m => <div key={m.id} className="text-center cursor-pointer hover:text-white" onClick={() => { setSortBy(m.id); setSortOrder('desc'); }}>{m.name.slice(0, 6)}</div>)}
        <div className="text-center cursor-pointer hover:text-white" onClick={() => { setSortBy('overall'); setSortOrder('desc'); }}>Avg</div>
        <div className="text-center">SD</div>
        <div className="text-center">Evals</div>
        <div className="text-center">Rec</div>
        <div className="text-center no-print">Assign</div>
      </div>

      {filteredSummaries.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
          <p className="text-white font-medium">No results match your filters</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1a8a68] print:divide-gray-200">
          {filteredSummaries.map(summary => (
            <div key={summary.playerId}>
              <div className="lg:grid lg:grid-cols-[2.5fr_repeat(5,1fr)_0.8fr_0.7fr_0.7fr_1.5fr_1.5fr] gap-1 px-4 py-2.5 hover:bg-[#0a3d2e] items-center cursor-pointer print:hover:bg-transparent"
                onClick={() => setExpandedPlayer(expandedPlayer === summary.playerId ? null : summary.playerId)}>
                {/* Player name */}
                <div className="flex items-center gap-2 min-w-0 mb-1 lg:mb-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    summary.teamAssignment ? getAssignmentBadgeColor(summary.teamAssignment) :
                    summary.promotedFromHour1 ? 'bg-orange-500' : 'bg-[#1a8a68]'
                  }`}>
                    {summary.playerNumber || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-medium text-sm truncate">{summary.playerName}</span>
                      {summary.promotedFromHour1 && <ArrowUpCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                      {summary.linkedPlayerId && <span className="text-blue-400 text-[10px] flex-shrink-0">(linked)</span>}
                    </div>
                    {/* Flags */}
                    {summary.flags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {summary.flags.includes('not-assessed') && <span className="text-[10px] text-red-400 bg-red-500/20 px-1 rounded">No evals</span>}
                        {summary.flags.includes('needs-more-evals') && <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1 rounded">1 eval</span>}
                        {summary.flags.includes('inconsistent') && <span className="text-[10px] text-orange-400 bg-orange-500/20 px-1 rounded">Inconsistent</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={e => { e.stopPropagation(); onPlayerDetail(summary.playerId); }}
                    className="p-1 text-[#1a8a68] hover:text-white lg:hidden" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                {/* Metrics */}
                {EVAL_METRICS.map(m => (
                  <div key={m.id} className="hidden lg:block text-center">
                    <span className={`font-bold text-sm ${getRatingColor(summary.averages?.[m.id])}`}>
                      {summary.averages?.[m.id] || '-'}
                    </span>
                  </div>
                ))}
                {/* Overall avg */}
                <div className="hidden lg:block text-center">
                  <span className={`text-base font-bold ${getRatingColor(summary.compositeAvg || summary.avgOverall)}`}>
                    {summary.compositeAvg || summary.avgOverall || '-'}
                  </span>
                </div>
                {/* Std dev */}
                <div className="hidden lg:block text-center">
                  <span className={`text-xs ${summary.overallStdDev > 1.0 ? 'text-orange-400 font-bold' : 'text-white/40'}`}>
                    {summary.evaluationCount >= 2 ? summary.overallStdDev.toFixed(1) : '-'}
                  </span>
                </div>
                {/* Eval count */}
                <div className="hidden lg:block text-center">
                  <span className={`text-sm ${summary.evaluationCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {summary.evaluationCount}
                  </span>
                </div>
                {/* Recommendation */}
                <div className="hidden lg:block text-center">
                  {getTeamBadge(summary.topRecommendation)}
                  {summary.recPercentages && Object.keys(summary.recPercentages).length > 1 && (
                    <div className="text-[10px] text-white/30 mt-0.5">
                      {Object.entries(summary.recPercentages).map(([k, v]) => {
                        const t = TEAM_OPTIONS.find(o => o.id === k);
                        return t ? `${t.label.replace('Team ', 'T')}: ${v}%` : '';
                      }).filter(Boolean).join(' ')}
                    </div>
                  )}
                </div>
                {/* Quick Assign */}
                <div className="hidden lg:flex gap-0.5 justify-center no-print" onClick={e => e.stopPropagation()}>
                  {getTeamAssignOptions(session.sessionType).map(opt => (
                    <button key={opt.value} onClick={() => assignTeam(summary.playerId, summary.teamAssignment === opt.value ? '' : opt.value)}
                      className={`w-6 h-6 rounded text-[10px] font-bold border transition-all ${
                        summary.teamAssignment === opt.value
                          ? `${opt.color} ${opt.borderColor} scale-110`
                          : 'bg-transparent border-[#1a8a68] text-[#1a8a68] hover:border-white/50 hover:text-white/50'
                      }`}
                      title={opt.label}>
                      {opt.shortLabel}
                    </button>
                  ))}
                  <button onClick={e => { e.stopPropagation(); onPlayerDetail(summary.playerId); }}
                    className="p-0.5 text-[#1a8a68] hover:text-white" title="Details">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                {/* Mobile metrics row */}
                <div className="flex items-center gap-3 lg:hidden mt-1 flex-wrap">
                  <span className={`text-lg font-bold ${getRatingColor(summary.compositeAvg || summary.avgOverall)}`}>
                    {summary.compositeAvg || summary.avgOverall || '-'}★
                  </span>
                  <span className="text-xs text-white/40">{summary.evaluationCount} eval{summary.evaluationCount !== 1 ? 's' : ''}</span>
                  {getTeamBadge(summary.topRecommendation)}
                  <div className="flex gap-0.5 ml-auto no-print flex-wrap">
                    {getTeamAssignOptions(session.sessionType).map(opt => (
                      <button key={opt.value} onClick={e => { e.stopPropagation(); assignTeam(summary.playerId, summary.teamAssignment === opt.value ? '' : opt.value); }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          summary.teamAssignment === opt.value ? `${opt.color} ${opt.borderColor}` : 'border-[#1a8a68] text-[#1a8a68]'
                        }`}>
                        {opt.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expanded evaluations */}
              {expandedPlayer === summary.playerId && summary.evaluations?.length > 0 && (
                <div className="bg-[#0a3d2e] px-4 py-3 border-t border-[#1a8a68]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[#4ade80] text-sm font-medium">Individual Evaluations ({summary.evaluationCount})</h4>
                    <button onClick={e => { e.stopPropagation(); onPlayerDetail(summary.playerId); }}
                      className="text-xs text-[#4ade80] hover:text-white flex items-center gap-1">
                      Full Detail <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {summary.evaluations.map((ev, idx) => (
                      <div key={idx} className="bg-[#0d5943] border border-[#1a8a68] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{ev.assessorName}</span>
                            <EvalStatusBadge status={ev.evalStatus} />
                          </div>
                          {getTeamBadge(ev.teamRecommendation)}
                        </div>
                        <div className="grid grid-cols-6 gap-2 text-xs">
                          {EVAL_METRICS.map(m => (
                            <div key={m.id} className="text-center">
                              <p className="text-[#1a8a68]">{m.name.slice(0, 3)}</p>
                              <p className={`font-bold ${getRatingColor(ev.ratings?.[m.id])}`}>{ev.ratings?.[m.id] || '-'}</p>
                            </div>
                          ))}
                          <div className="text-center">
                            <p className="text-[#1a8a68]">★</p>
                            <p className={`font-bold ${getRatingColor(ev.overallImpression)}`}>{ev.overallImpression || '-'}</p>
                          </div>
                        </div>
                        {ev.notes && <p className="text-[#4ade80] text-xs mt-2 bg-[#0a3d2e] rounded p-2">"{ev.notes}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Assessor Completion */}
    {session.assessors?.length > 0 && (
      <AssessorCompletionSection completionStats={completionStats} session={session} evaluations={evaluations} />
    )}
  </>
);

const AssessorCompletionSection = ({ completionStats, session, evaluations }) => {
  const [expandedAssessorId, setExpandedAssessorId] = useState(null);

  const getPendingPlayers = (assessor) => {
    if (!session?.players) return [];
    const assessorEvals = evaluations.filter(
      e => e.assessorId === assessor.id || e.assessorName === assessor.name
    );
    const evaluatedPlayerIds = new Set(assessorEvals.map(e => e.playerId));
    return session.players.filter(p => !evaluatedPlayerIds.has(p.id));
  };

  return (
    <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden print:border-gray-300">
      <div className="px-4 py-3 border-b border-[#1a8a68]">
        <h3 className="text-white font-bold flex items-center gap-2 print:text-black">
          <Users className="w-5 h-5 text-[#4ade80] print:text-gray-500" /> Assessor Completion
        </h3>
        <p className="text-white/40 text-xs mt-1">{completionStats.totalCompleted} of {completionStats.totalExpected} evaluations</p>
      </div>
      <div className="divide-y divide-[#1a8a68]">
        {completionStats.assessors.map(a => {
          const isExpanded = expandedAssessorId === a.id;
          const pendingPlayers = isExpanded ? getPendingPlayers(a) : [];
          return (
            <div key={a.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm print:text-black">{a.name}</span>
                  {a.role && <span className={`px-1.5 py-0.5 text-xs rounded ${
                    a.role === 'coach' ? 'bg-green-500/20 text-green-300' :
                    a.role === 'tryout_assessor' ? 'bg-violet-500/20 text-violet-300' :
                    a.role === 'team_manager' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-[#1a8a68]/50 text-white/70'
                  }`}>{a.role === 'team_manager' ? 'Team Mgr' : a.role}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {a.submitted > 0 && <span className="text-blue-400">{a.submitted} submitted</span>}
                  {a.drafts > 0 && <span className="text-amber-400">{a.drafts} drafts</span>}
                  {a.notStarted > 0 && (
                    <button
                      onClick={() => setExpandedAssessorId(isExpanded ? null : a.id)}
                      className="text-red-400 hover:text-red-300 underline underline-offset-2 cursor-pointer font-medium"
                      title="Click to see pending players"
                    >
                      {a.notStarted} pending {isExpanded ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>
              <div className="h-2 bg-[#0a3d2e] rounded-full overflow-hidden flex">
                {a.submitted > 0 && <div className="h-full bg-blue-500" style={{ width: `${(a.submitted / a.total) * 100}%` }} />}
                {a.drafts > 0 && <div className="h-full bg-amber-500" style={{ width: `${(a.drafts / a.total) * 100}%` }} />}
              </div>
              {isExpanded && pendingPlayers.length > 0 && (
                <div className="mt-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg p-2">
                  <p className="text-white/40 text-xs mb-1.5 font-medium">Pending evaluations for {a.name}:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {pendingPlayers.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 text-xs">
                        <span className="w-5 h-5 bg-[#1a8a68] rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {p.number || '?'}
                        </span>
                        <span className="text-white/70 truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// INSIGHTS TAB
// ============================================

const InsightsTab = ({ playerSummaries, evaluations }) => {
  const evaluated = playerSummaries.filter(s => s.evaluationCount > 0);

  // Scatter data: Overall vs Athleticism
  const scatterData = evaluated.map(s => ({
    name: s.playerName,
    overall: parseFloat(s.compositeAvg || s.avgOverall) || 0,
    athleticism: parseFloat(s.averages?.athleticism) || 0,
    number: s.playerNumber
  })).filter(d => d.overall > 0 && d.athleticism > 0);

  // Tier distribution
  const tierData = TIER_CONFIG.map(tier => ({
    name: tier.name,
    count: evaluated.filter(s => {
      const v = parseFloat(s.compositeAvg || s.avgOverall) || 0;
      return v >= tier.min && v < tier.max;
    }).length,
    color: tier.color
  }));

  // Heatmap data
  const heatmapPlayers = [...evaluated]
    .sort((a, b) => (parseFloat(b.compositeAvg || b.avgOverall) || 0) - (parseFloat(a.compositeAvg || a.avgOverall) || 0))
    .slice(0, 30);

  return (
    <div className="space-y-6">
      {evaluated.length === 0 ? (
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
          <p className="text-white font-medium">No evaluation data yet</p>
          <p className="text-[#4ade80] text-sm">Charts will appear once players have been evaluated</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scatter Plot: Overall vs Athleticism */}
            <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#4ade80]" /> Overall vs Athleticism
              </h3>
              <p className="text-white/40 text-xs mb-3">Identify athletic high-performers (top-right quadrant)</p>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a8a68" />
                  <XAxis type="number" dataKey="athleticism" name="Athleticism" domain={[0.5, 5.5]}
                    tick={{ fill: '#4ade80', fontSize: 12 }} label={{ value: 'Athleticism', position: 'bottom', fill: '#4ade80', fontSize: 12 }} />
                  <YAxis type="number" dataKey="overall" name="Overall" domain={[0.5, 5.5]}
                    tick={{ fill: '#4ade80', fontSize: 12 }} label={{ value: 'Overall', angle: -90, position: 'insideLeft', fill: '#4ade80', fontSize: 12 }} />
                  <RTooltip cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-lg p-2 text-xs shadow-xl">
                          <p className="text-white font-bold">{d.name} #{d.number}</p>
                          <p className="text-[#4ade80]">Overall: {d.overall} | Ath: {d.athleticism}</p>
                        </div>
                      );
                    }} />
                  <Scatter data={scatterData} fill="#22c55e">
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={entry.overall >= 4 ? '#22c55e' : entry.overall >= 2.5 ? '#eab308' : '#ef4444'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Tier Distribution */}
            <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
              <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#4ade80]" /> Talent Distribution
              </h3>
              <p className="text-white/40 text-xs mb-3">Natural ability tiers based on composite average</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tierData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a8a68" />
                  <XAxis dataKey="name" tick={{ fill: '#4ade80', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#4ade80', fontSize: 12 }} allowDecimals={false} />
                  <RTooltip content={({ payload }) => {
                    if (!payload?.length) return null;
                    return (
                      <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-lg p-2 text-xs shadow-xl">
                        <p className="text-white font-bold">{payload[0].payload.name}</p>
                        <p className="text-[#4ade80]">{payload[0].value} players</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {tierData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 overflow-x-auto">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4ade80]" /> Player × Metric Heatmap
            </h3>
            <p className="text-white/40 text-xs mb-3">Spot individual strengths and weaknesses at a glance</p>
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '160px repeat(5, 1fr) 80px' }}>
                <div className="text-xs text-[#4ade80] font-medium px-1">Player</div>
                {EVAL_METRICS.map(m => (
                  <div key={m.id} className="text-xs text-[#4ade80] font-medium text-center">{m.name.slice(0, 8)}</div>
                ))}
                <div className="text-xs text-[#4ade80] font-medium text-center">Avg</div>
              </div>
              {/* Rows */}
              {heatmapPlayers.map(player => (
                <div key={player.playerId} className="grid gap-1 mb-0.5" style={{ gridTemplateColumns: '160px repeat(5, 1fr) 80px' }}>
                  <div className="text-xs text-white truncate px-1 flex items-center">
                    <span className="font-medium truncate">{player.playerName}</span>
                    <span className="text-white/30 ml-1 flex-shrink-0">#{player.playerNumber || '?'}</span>
                  </div>
                  {EVAL_METRICS.map(m => {
                    const val = player.averages?.[m.id];
                    return (
                      <div key={m.id} className="rounded text-center py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: getHeatmapColor(val) }}>
                        {val || '-'}
                      </div>
                    );
                  })}
                  <div className="rounded text-center py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: getHeatmapColor(player.compositeAvg || player.avgOverall) }}>
                    {player.compositeAvg || player.avgOverall || '-'}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
                <span>Low</span>
                <div className="flex gap-0.5">
                  {['#dc2626', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#4ade80', '#22c55e', '#15803d'].map(c => (
                    <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span>High</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// TEAM BUILDER TAB
// ============================================

const TeamBuilderTab = ({ playerSummaries, assignTeam, teamAssignments, session, onSave, saving, dirty }) => {
  const [builderSort, setBuilderSort] = useState('overall');
  const assignOptions = getTeamAssignOptions(session.sessionType);

  const getTeamPlayers = (teamKey) =>
    playerSummaries.filter(s => s.teamAssignment === teamKey)
      .sort((a, b) => (parseFloat(b.compositeAvg || b.avgOverall) || 0) - (parseFloat(a.compositeAvg || a.avgOverall) || 0));

  const unassigned = playerSummaries.filter(s => !s.teamAssignment)
    .sort((a, b) => {
      if (builderSort === 'overall') return (parseFloat(b.compositeAvg || b.avgOverall) || 0) - (parseFloat(a.compositeAvg || a.avgOverall) || 0);
      if (builderSort === 'name') return (a.playerName || '').localeCompare(b.playerName || '');
      return (parseFloat(b.averages?.[builderSort]) || 0) - (parseFloat(a.averages?.[builderSort]) || 0);
    });

  const teamGroups = assignOptions.map(opt => ({
    ...opt,
    players: getTeamPlayers(opt.value)
  }));

  const teamAvg = (players) => {
    const vals = players.map(s => parseFloat(s.compositeAvg || s.avgOverall) || 0).filter(v => v > 0);
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '-';
  };

  // Balance: compare first two teams (only meaningful for hour-2 with 3 teams)
  const showRadar = assignOptions.length <= 3 && teamGroups[0]?.players.length > 0 && teamGroups[1]?.players.length > 0;
  const t1Avg = teamAvg(teamGroups[0]?.players || []);
  const t2Avg = teamAvg(teamGroups[1]?.players || []);
  const gap = (t1Avg !== '-' && t2Avg !== '-') ? Math.abs(parseFloat(t1Avg) - parseFloat(t2Avg)) : null;
  const balanceScore = (assignOptions.length <= 3 && gap != null) ? Math.max(0, Math.round(100 - gap * 33.3)) : null;

  // Per-metric averages for radar
  const metricAvgs = (players) => {
    return EVAL_METRICS.map(m => {
      const vals = players.map(s => parseFloat(s.averages?.[m.id]) || 0).filter(v => v > 0);
      return vals.length > 0 ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    });
  };

  const radarData = showRadar ? EVAL_METRICS.map((m, i) => ({
    metric: m.name.slice(0, 6),
    [assignOptions[0].label]: metricAvgs(teamGroups[0].players)[i],
    [assignOptions[1].label]: metricAvgs(teamGroups[1].players)[i]
  })) : [];

  return (
    <div className="space-y-6">
      {/* Balance Header */}
      <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
        {(() => {
          const statColorMap = { green: 'text-green-400', blue: 'text-blue-400', yellow: 'text-yellow-400', violet: 'text-violet-400', indigo: 'text-indigo-400', cyan: 'text-cyan-400', teal: 'text-teal-400', amber: 'text-amber-400', rose: 'text-rose-400' };
          return (
            <div className={`grid gap-4 items-center ${assignOptions.length <= 3 ? `grid-cols-2 lg:grid-cols-${assignOptions.length + 2}` : 'grid-cols-3 lg:grid-cols-4'}`}>
              {assignOptions.length <= 3 ? teamGroups.map(g => (
                <div key={g.value} className="text-center">
                  <p className={`${statColorMap[g.columnColor] || 'text-white'} text-sm font-medium`}>{g.label}</p>
                  <p className="text-white text-2xl font-bold">{g.players.length} <span className="text-sm font-normal text-white/40">players</span></p>
                  <p className={`${statColorMap[g.columnColor] || 'text-white'} text-lg font-bold`}>{teamAvg(g.players)}★</p>
                </div>
              )) : (
                <>
                  {teamGroups.map(g => (
                    <div key={g.value} className="text-center">
                      <p className={`${statColorMap[g.columnColor] || 'text-white'} text-xs font-medium`}>{g.shortLabel}</p>
                      <p className="text-white text-lg font-bold">{g.players.length}</p>
                    </div>
                  ))}
                </>
              )}
              {balanceScore != null && (
                <div className="text-center">
                  <p className="text-white/40 text-sm">Balance</p>
                  <p className={`text-3xl font-bold ${balanceScore >= 90 ? 'text-green-400' : balanceScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {balanceScore}%
                  </p>
                  <p className="text-white/30 text-xs">Gap: {gap?.toFixed(2)}★</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-white/40 text-sm">Unassigned</p>
                <p className="text-white text-2xl font-bold">{unassigned.length}</p>
              </div>
            </div>
          );
        })()}
        {dirty && (
          <div className="flex justify-center mt-4">
            <button onClick={onSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg font-medium">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save Team Assignments
            </button>
          </div>
        )}
      </div>

      {/* Radar Chart: Team Comparison (hour-2 with ≤3 teams) */}
      {showRadar && (
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#4ade80]" /> Skill Profile Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1a8a68" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#4ade80', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#4ade80', fontSize: 10 }} />
              <Radar name={assignOptions[0].label} dataKey={assignOptions[0].label} stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
              <Radar name={assignOptions[1].label} dataKey={assignOptions[1].label} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              <Legend wrapperStyle={{ color: '#fff', fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Unassigned Pool + Team Columns */}
      <div className={`grid grid-cols-1 gap-4 ${assignOptions.length <= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-3'}`}>
        {/* Unassigned */}
        <div className={assignOptions.length <= 3 ? 'lg:col-span-3' : 'lg:col-span-3'}>
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold">Unassigned ({unassigned.length})</h3>
              <select value={builderSort} onChange={e => setBuilderSort(e.target.value)}
                className="px-2 py-1 bg-[#0a3d2e] border border-[#1a8a68] rounded text-white text-xs focus:outline-none">
                <option value="overall">By Overall</option>
                <option value="name">By Name</option>
                {EVAL_METRICS.map(m => <option key={m.id} value={m.id}>By {m.name}</option>)}
              </select>
            </div>
            {unassigned.length === 0 ? (
              <p className="text-[#1a8a68] text-sm text-center py-4">All players assigned</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {unassigned.map(s => (
                  <TeamBuilderCard key={s.playerId} summary={s} assignTeam={assignTeam} assignOptions={assignOptions} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Team Columns */}
        {teamGroups.map(g => (
          <TeamColumn key={g.value} title={g.label} players={g.players} color={g.columnColor}
            assignTeam={assignTeam} teamKey={g.value} avg={teamAvg(g.players)} assignOptions={assignOptions} />
        ))}
      </div>
    </div>
  );
};

const TeamColumn = ({ title, players, color, assignTeam, teamKey, avg, assignOptions }) => {
  const colorMap = {
    green: { border: 'border-green-500/50', header: 'bg-green-500/20 text-green-400' },
    blue: { border: 'border-blue-500/50', header: 'bg-blue-500/20 text-blue-400' },
    yellow: { border: 'border-yellow-500/50', header: 'bg-yellow-500/20 text-yellow-400' },
    violet: { border: 'border-violet-500/50', header: 'bg-violet-500/20 text-violet-400' },
    indigo: { border: 'border-indigo-500/50', header: 'bg-indigo-500/20 text-indigo-400' },
    cyan: { border: 'border-cyan-500/50', header: 'bg-cyan-500/20 text-cyan-400' },
    teal: { border: 'border-teal-500/50', header: 'bg-teal-500/20 text-teal-400' },
    amber: { border: 'border-amber-500/50', header: 'bg-amber-500/20 text-amber-400' },
    rose: { border: 'border-rose-500/50', header: 'bg-rose-500/20 text-rose-400' },
  };
  const c = colorMap[color] || colorMap.green;

  return (
    <div className={`bg-[#0d5943] border ${c.border} rounded-xl overflow-hidden`}>
      <div className={`px-4 py-3 ${c.header} flex items-center justify-between`}>
        <span className="font-bold">{title} ({players.length})</span>
        <span className="text-sm font-bold">{avg}★</span>
      </div>
      <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
        {players.length === 0 ? (
          <p className="text-[#1a8a68] text-sm text-center py-4">No players assigned</p>
        ) : (
          players.map(s => (
            <TeamBuilderCard key={s.playerId} summary={s} assignTeam={assignTeam} assignOptions={assignOptions} compact />
          ))
        )}
      </div>
    </div>
  );
};

const TeamBuilderCard = ({ summary, assignTeam, assignOptions, compact }) => {
  const score = parseFloat(summary.compositeAvg || summary.avgOverall) || 0;
  const opts = assignOptions || HOUR2_ASSIGN_OPTIONS;
  return (
    <div className={`bg-[#0a3d2e] border border-[#1a8a68] rounded-lg p-2.5 ${compact ? '' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
          summary.teamAssignment ? getAssignmentBadgeColor(summary.teamAssignment) : 'bg-[#1a8a68]'
        }`}>
          {summary.playerNumber || '?'}
        </div>
        <span className="text-white text-sm font-medium truncate flex-1">{summary.playerName}</span>
        <span className={`text-sm font-bold ${getRatingColor(score)}`}>{score > 0 ? score.toFixed(1) : '-'}★</span>
      </div>
      {!compact && (
        <div className="flex gap-1 text-[10px] text-white/40 mb-1.5 flex-wrap">
          {EVAL_METRICS.map(m => (
            <span key={m.id}>{m.name.slice(0, 3)}: <span className={getRatingColor(summary.averages?.[m.id])}>{summary.averages?.[m.id] || '-'}</span></span>
          ))}
        </div>
      )}
      <div className={`grid gap-0.5 ${opts.length <= 3 ? 'grid-cols-3' : 'grid-cols-3'}`}>
        {opts.map(opt => (
          <button key={opt.value}
            onClick={() => assignTeam(summary.playerId, summary.teamAssignment === opt.value ? '' : opt.value)}
            className={`py-1 text-[10px] font-bold rounded border transition-all ${
              summary.teamAssignment === opt.value
                ? `${opt.color} ${opt.borderColor}`
                : 'bg-transparent border-[#1a8a68] text-[#1a8a68] hover:border-white/50 hover:text-white/50'
            }`}>
            {opt.shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// CALIBRATION TAB
// ============================================

const CalibrationTab = ({ evaluations, session, assessors }) => {
  const consistency = useMemo(() => getAssessorConsistency(evaluations), [evaluations]);
  const outliers = useMemo(() => detectOutlierRatings(evaluations, session?.players), [evaluations, session]);

  // Per-assessor per-metric averages
  const assessorMetrics = useMemo(() => {
    const map = {};
    evaluations.forEach(ev => {
      const key = ev.assessorId || ev.assessorName;
      if (!map[key]) map[key] = { name: ev.assessorName, metrics: {}, count: 0 };
      map[key].count++;
      EVAL_METRICS.forEach(m => {
        const val = ev.ratings?.[m.id];
        if (val != null) {
          if (!map[key].metrics[m.id]) map[key].metrics[m.id] = [];
          map[key].metrics[m.id].push(val);
        }
      });
    });
    // Compute averages
    return Object.entries(map).map(([id, data]) => {
      const avgs = {};
      EVAL_METRICS.forEach(m => {
        const vals = data.metrics[m.id] || [];
        avgs[m.id] = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-';
      });
      return { id, name: data.name, count: data.count, metricAvgs: avgs };
    });
  }, [evaluations]);

  if (evaluations.length === 0) {
    return (
      <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-12 text-center">
        <Target className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
        <p className="text-white font-medium">No evaluation data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assessor Deviation Overview */}
      <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a8a68]">
          <h3 className="text-white font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4ade80]" /> Rating Patterns
          </h3>
          {consistency.length > 0 && (
            <p className="text-white/40 text-xs mt-1">Session average: {consistency[0]?.globalAvg}★</p>
          )}
        </div>
        <div className="divide-y divide-[#1a8a68]">
          {consistency.sort((a, b) => b.deviation - a.deviation).map(a => {
            const sessionAssessor = session?.assessors?.find(sa => sa.name === a.assessorName);
            const deviationLabel = a.deviation > 0.3 ? 'Lenient' : a.deviation < -0.3 ? 'Strict' : 'Balanced';
            return (
              <div key={a.assessorId} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{a.assessorName}</span>
                    {sessionAssessor?.role && (
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        sessionAssessor.role === 'coach' ? 'bg-green-500/20 text-green-300' :
                        sessionAssessor.role === 'tryout_assessor' ? 'bg-violet-500/20 text-violet-300' :
                        'bg-[#1a8a68]/50 text-white/70'
                      }`}>{sessionAssessor.role}</span>
                    )}
                    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                      a.deviation > 0.3 ? 'bg-green-500/20 text-green-400' :
                      a.deviation < -0.3 ? 'bg-red-500/20 text-red-400' :
                      'bg-[#1a8a68]/50 text-white/40'
                    }`}>{deviationLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-bold">{a.avgOverall}★</span>
                    <span className={`font-medium ${a.deviation > 0.3 ? 'text-green-400' : a.deviation < -0.3 ? 'text-red-400' : 'text-white/40'}`}>
                      ({a.deviation > 0 ? '+' : ''}{a.deviation})
                    </span>
                    <span className="text-white/30 text-xs">{a.evaluationCount} evals</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-[#0a3d2e] rounded-full overflow-hidden relative">
                    {/* Reference line at global average */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10" style={{ left: `${(a.globalAvg / 5) * 100}%` }} />
                    <div className={`h-full rounded-full ${
                      a.deviation > 0.3 ? 'bg-green-500' : a.deviation < -0.3 ? 'bg-red-500' : 'bg-[#22c55e]'
                    }`} style={{ width: `${Math.min(100, (a.avgOverall / 5) * 100)}%` }} />
                  </div>
                  <span className="text-white/20 text-xs w-8 flex-shrink-0">/ 5.0</span>
                </div>
                {Math.abs(a.deviation) > 0.3 && (
                  <p className="text-white/30 text-xs mt-1">
                    {a.assessorName} averages {Math.abs(a.deviation)} stars {a.deviation > 0 ? 'higher' : 'lower'} than session average
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Metric Breakdown */}
      {assessorMetrics.length > 1 && (
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden overflow-x-auto">
          <div className="px-4 py-3 border-b border-[#1a8a68]">
            <h3 className="text-white font-bold">Per-Metric Averages by Assessor</h3>
          </div>
          <div className="min-w-[600px]">
            <div className="grid gap-1 px-4 py-2 bg-[#0a3d2e]" style={{ gridTemplateColumns: '150px repeat(5, 1fr) 60px' }}>
              <div className="text-xs text-[#4ade80] font-medium">Assessor</div>
              {EVAL_METRICS.map(m => <div key={m.id} className="text-xs text-[#4ade80] text-center">{m.name.slice(0, 6)}</div>)}
              <div className="text-xs text-[#4ade80] text-center">Count</div>
            </div>
            {assessorMetrics.map(a => (
              <div key={a.id} className="grid gap-1 px-4 py-2 border-t border-[#1a8a68]" style={{ gridTemplateColumns: '150px repeat(5, 1fr) 60px' }}>
                <div className="text-sm text-white truncate">{a.name}</div>
                {EVAL_METRICS.map(m => (
                  <div key={m.id} className={`text-sm text-center font-bold ${getRatingColor(a.metricAvgs[m.id])}`}>
                    {a.metricAvgs[m.id]}
                  </div>
                ))}
                <div className="text-sm text-white/40 text-center">{a.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outlier Ratings */}
      {outliers.length > 0 && (
        <div className="bg-[#0d5943] border border-orange-500/30 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1a8a68]">
            <h3 className="text-white font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" /> Outlier Ratings ({outliers.length})
            </h3>
            <p className="text-white/40 text-xs mt-1">Individual ratings that differ significantly from the player average</p>
          </div>
          <div className="divide-y divide-[#1a8a68] max-h-96 overflow-y-auto">
            {outliers.map((o, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-white text-sm font-medium">{o.assessorName}</span>
                  <span className="text-white/40 mx-2">→</span>
                  <span className="text-white text-sm">{o.playerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${o.direction === 'high' ? 'text-green-400' : 'text-red-400'}`}>
                    Rated {o.rating}/5
                  </span>
                  <span className="text-white/30 text-xs">avg: {o.playerMean}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    o.direction === 'high' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {o.deviation > 0 ? '+' : ''}{o.deviation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PLAYER DETAIL MODAL
// ============================================

const PlayerDetailModal = ({ summary, evaluations, session, getTeamBadge, onClose, assignTeam }) => {
  if (!summary) return null;

  const radarData = EVAL_METRICS.map(m => ({
    metric: m.name.slice(0, 6),
    score: parseFloat(summary.averages?.[m.id]) || 0
  }));

  const recEntries = Object.entries(summary.recPercentages || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0d5943] border-b border-[#1a8a68] p-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                summary.teamAssignment ? getAssignmentBadgeColor(summary.teamAssignment) : 'bg-[#1a8a68]'
              }`}>{summary.playerNumber || '?'}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{summary.playerName}</h2>
                <div className="flex items-center gap-2 text-sm">
                  {summary.playerAgeGroup && <span className="text-[#4ade80]">{summary.playerAgeGroup}</span>}
                  <span className="text-white/40">{summary.evaluationCount} evaluation{summary.evaluationCount !== 1 ? 's' : ''}</span>
                  {summary.linkedPlayerId && <span className="text-blue-400 text-xs">(Existing player)</span>}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0a3d2e] rounded-lg p-3 text-center">
              <p className="text-white/40 text-xs">Composite Avg</p>
              <p className={`text-2xl font-bold ${getRatingColor(summary.compositeAvg || summary.avgOverall)}`}>
                {summary.compositeAvg || summary.avgOverall || '-'}
              </p>
            </div>
            <div className="bg-[#0a3d2e] rounded-lg p-3 text-center">
              <p className="text-white/40 text-xs">Rating Spread (SD)</p>
              <p className={`text-2xl font-bold ${summary.overallStdDev > 1.0 ? 'text-orange-400' : 'text-white'}`}>
                {summary.evaluationCount >= 2 ? summary.overallStdDev.toFixed(2) : '-'}
              </p>
            </div>
            <div className="bg-[#0a3d2e] rounded-lg p-3 text-center">
              <p className="text-white/40 text-xs">Top Recommendation</p>
              <div className="mt-1">{getTeamBadge(summary.topRecommendation) || <span className="text-white/30">-</span>}</div>
            </div>
          </div>

          {/* Team Assignment */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/40 text-sm">Assign to:</span>
            {getTeamAssignOptions(session.sessionType).map(opt => (
              <button key={opt.value}
                onClick={() => assignTeam(summary.playerId, summary.teamAssignment === opt.value ? '' : opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  summary.teamAssignment === opt.value ? `${opt.color} ${opt.borderColor}` : 'border-[#1a8a68] text-[#1a8a68] hover:text-white hover:border-white/50'
                }`}>{opt.label}</button>
            ))}
          </div>

          {/* Radar Chart */}
          {summary.evaluationCount > 0 && (
            <div className="bg-[#0a3d2e] rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-2">Skill Profile</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1a8a68" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#4ade80', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#4ade80', fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recommendation Breakdown */}
          {recEntries.length > 0 && (
            <div className="bg-[#0a3d2e] rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-2">Team Recommendation Breakdown</h3>
              <div className="space-y-2">
                {recEntries.map(([teamId, pct]) => {
                  const team = TEAM_OPTIONS.find(t => t.id === teamId);
                  return (
                    <div key={teamId} className="flex items-center gap-3">
                      <span className="text-white text-sm w-16">{team?.label || teamId}</span>
                      <div className="flex-1 h-4 bg-[#0d5943] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${team?.color || 'bg-[#22c55e]'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-white text-sm font-bold w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metric Breakdown with per-assessor details */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3">Metric Breakdown by Assessor</h3>
            {EVAL_METRICS.map(m => {
              const metricVals = (summary.evaluations || []).map(e => ({
                assessor: e.assessorName,
                rating: e.ratings?.[m.id],
                note: e.metricNotes?.[m.id]
              })).filter(v => v.rating != null);

              return (
                <div key={m.id} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#4ade80] text-sm font-medium">{m.name}</span>
                    <span className={`text-sm font-bold ${getRatingColor(summary.averages?.[m.id])}`}>
                      {summary.averages?.[m.id] || '-'} avg
                    </span>
                  </div>
                  <div className="space-y-1 pl-4">
                    {metricVals.map((v, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-white/40 w-24 flex-shrink-0">{v.assessor}:</span>
                        <span className={`font-bold ${getRatingColor(v.rating)}`}>{v.rating}/5</span>
                        {v.note && <span className="text-white/50 italic">- {v.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Notes Compilation */}
          {summary.evaluations?.some(e => e.notes) && (
            <div className="bg-[#0a3d2e] rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-2">All Notes</h3>
              <div className="space-y-2">
                {summary.evaluations.filter(e => e.notes).map((e, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-[#4ade80] font-medium">{e.assessorName}:</span>{' '}
                    <span className="text-white/70 italic">"{e.notes}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SMALL HELPER COMPONENTS
// ============================================

const StatCard = ({ label, value, icon: Icon, color = 'text-white' }) => (
  <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-3 print:border-gray-300 print:bg-gray-50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#4ade80] text-xs print:text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${color} print:text-black`}>{value}</p>
      </div>
      {Icon && <Icon className="w-7 h-7 text-[#1a8a68] print:text-gray-300" />}
    </div>
  </div>
);

const EvalStatusBadge = ({ status }) => {
  if (status === 'finalized') return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/50">
      <Lock className="w-3 h-3" /> Finalized
    </span>
  );
  if (status === 'submitted') return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/50">
      <Send className="w-3 h-3" /> Submitted
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded border border-amber-500/50">
      <FileText className="w-3 h-3" /> Draft
    </span>
  );
};

export default TryoutResultsPage;
