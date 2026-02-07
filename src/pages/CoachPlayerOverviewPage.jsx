import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  Search,
  Filter,
  SortAsc,
  Users,
  User,
  Calendar,
  TrendingUp,
  ChevronRight,
  X,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Edit3,
  Plus,
  CircleDot,
  Target,
  Crosshair,
  Footprints,
  Shield,
  Move,
  Brain
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import PageShell from '../components/PageShell';
import { SKILL_CATEGORIES, LEVEL_LABELS } from '../data/skillBenchmarks';

// Skill icons mapping
const SKILL_ICONS = {
  'ball-handling': CircleDot,
  'passing-receiving': Target,
  'shooting': Crosshair,
  'footwork': Footprints,
  'defense': Shield,
  'off-ball-movement': Move,
  'team-play': Users,
  'basketball-iq': Brain
};

// Sample player data for demonstration
const samplePlayers = [
  {
    id: 'p1',
    name: 'Emma Wilson',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    photoURL: null,
    skills: {
      'ball-handling': { level: 3, lastAssessed: '2026-02-01' },
      'passing-receiving': { level: 3, lastAssessed: '2026-02-01' },
      'shooting': { level: 2, lastAssessed: '2026-01-28' },
      'footwork': { level: 3, lastAssessed: '2026-01-28' },
      'defense': { level: 4, lastAssessed: '2026-02-03' },
      'off-ball-movement': { level: 2, lastAssessed: '2026-01-15' },
      'team-play': { level: 3, lastAssessed: '2026-02-01' },
      'basketball-iq': { level: 3, lastAssessed: '2026-02-01' }
    },
    assessmentHistory: [
      { date: '2026-02-03', skillId: 'defense', level: 4, previousLevel: 3, coach: 'Coach Mike', notes: 'Outstanding defensive awareness. Ready for level 4!' },
      { date: '2026-02-01', skillId: 'ball-handling', level: 3, previousLevel: 3, coach: 'Coach Mike', notes: 'Maintaining strong ball handling skills.' },
      { date: '2026-01-28', skillId: 'shooting', level: 2, previousLevel: 2, coach: 'Coach Sarah', notes: 'Form is improving. Focus on follow-through.' },
      { date: '2026-01-15', skillId: 'off-ball-movement', level: 2, previousLevel: 1, coach: 'Coach Mike', notes: 'Great improvement in cutting and spacing!' }
    ],
    seasonProgress: 2.5,
    joinDate: '2024-09-01'
  },
  {
    id: 'p2',
    name: 'Liam Johnson',
    teamId: 't2',
    teamName: 'U12 Emerald',
    ageGroup: 'U12',
    photoURL: null,
    skills: {
      'ball-handling': { level: 2, lastAssessed: '2026-02-02' },
      'passing-receiving': { level: 3, lastAssessed: '2026-02-02' },
      'shooting': { level: 2, lastAssessed: '2026-01-30' },
      'footwork': { level: 2, lastAssessed: '2026-01-25' },
      'defense': { level: 2, lastAssessed: '2026-01-30' },
      'off-ball-movement': { level: 1, lastAssessed: '2026-01-10' },
      'team-play': { level: 2, lastAssessed: '2026-02-02' },
      'basketball-iq': { level: 2, lastAssessed: '2026-01-25' }
    },
    assessmentHistory: [
      { date: '2026-02-02', skillId: 'passing-receiving', level: 3, previousLevel: 2, coach: 'Coach Sarah', notes: 'Excellent court vision developing!' },
      { date: '2026-01-30', skillId: 'shooting', level: 2, previousLevel: 1, coach: 'Coach Mike', notes: 'Form much improved. Keep practicing!' }
    ],
    seasonProgress: 2.3,
    joinDate: '2025-02-01'
  },
  {
    id: 'p3',
    name: 'Sophia Garcia',
    teamId: 't2',
    teamName: 'U12 Emerald',
    ageGroup: 'U12',
    photoURL: null,
    skills: {
      'ball-handling': { level: 2, lastAssessed: '2026-01-28' },
      'passing-receiving': { level: 2, lastAssessed: '2026-01-28' },
      'shooting': { level: 3, lastAssessed: '2026-02-04' },
      'footwork': { level: 2, lastAssessed: '2026-01-20' },
      'defense': { level: 2, lastAssessed: '2026-01-28' },
      'off-ball-movement': { level: 2, lastAssessed: '2026-01-28' },
      'team-play': { level: 2, lastAssessed: '2026-01-15' },
      'basketball-iq': { level: 3, lastAssessed: '2026-02-04' }
    },
    assessmentHistory: [
      { date: '2026-02-04', skillId: 'shooting', level: 3, previousLevel: 2, coach: 'Coach Mike', notes: 'Great shooting progress! Very consistent form.' },
      { date: '2026-02-04', skillId: 'basketball-iq', level: 3, previousLevel: 2, coach: 'Coach Mike', notes: 'Reads the game really well now.' }
    ],
    seasonProgress: 2.1,
    joinDate: '2025-01-15'
  },
  {
    id: 'p4',
    name: 'Noah Davis',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    photoURL: null,
    skills: {
      'ball-handling': { level: 2, lastAssessed: '2026-01-25' },
      'passing-receiving': { level: 2, lastAssessed: '2026-01-25' },
      'shooting': { level: 1, lastAssessed: '2026-01-20' },
      'footwork': { level: 2, lastAssessed: '2026-01-25' },
      'defense': { level: 3, lastAssessed: '2026-02-01' },
      'off-ball-movement': null,
      'team-play': { level: 2, lastAssessed: '2026-01-25' },
      'basketball-iq': null
    },
    assessmentHistory: [
      { date: '2026-02-01', skillId: 'defense', level: 3, previousLevel: 2, coach: 'Coach Sarah', notes: 'Great defensive effort!' }
    ],
    seasonProgress: 1.0,
    joinDate: '2025-09-01'
  },
  {
    id: 'p5',
    name: 'Olivia Martinez',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    photoURL: null,
    skills: {
      'ball-handling': { level: 4, lastAssessed: '2026-02-03' },
      'passing-receiving': { level: 4, lastAssessed: '2026-02-03' },
      'shooting': { level: 3, lastAssessed: '2026-01-30' },
      'footwork': { level: 3, lastAssessed: '2026-01-30' },
      'defense': { level: 3, lastAssessed: '2026-01-25' },
      'off-ball-movement': { level: 3, lastAssessed: '2026-01-25' },
      'team-play': { level: 4, lastAssessed: '2026-02-03' },
      'basketball-iq': { level: 4, lastAssessed: '2026-02-03' }
    },
    assessmentHistory: [
      { date: '2026-02-03', skillId: 'ball-handling', level: 4, previousLevel: 3, coach: 'Coach Mike', notes: 'Elite ball handler! Can teach others.' },
      { date: '2026-02-03', skillId: 'passing-receiving', level: 4, previousLevel: 3, coach: 'Coach Mike', notes: 'Excellent court vision and passing.' },
      { date: '2026-02-03', skillId: 'team-play', level: 4, previousLevel: 3, coach: 'Coach Mike', notes: 'True team leader on the court.' },
      { date: '2026-02-03', skillId: 'basketball-iq', level: 4, previousLevel: 3, coach: 'Coach Mike', notes: 'Outstanding game sense.' }
    ],
    seasonProgress: 3.5,
    joinDate: '2023-09-01'
  },
  {
    id: 'p6',
    name: 'Ethan Brown',
    teamId: 't2',
    teamName: 'U12 Emerald',
    ageGroup: 'U12',
    photoURL: null,
    skills: {
      'ball-handling': { level: 1, lastAssessed: '2025-12-15' },
      'passing-receiving': { level: 1, lastAssessed: '2025-12-15' },
      'shooting': { level: 1, lastAssessed: '2025-12-15' },
      'footwork': { level: 1, lastAssessed: '2025-12-10' },
      'defense': { level: 1, lastAssessed: '2025-12-10' },
      'off-ball-movement': null,
      'team-play': null,
      'basketball-iq': null
    },
    assessmentHistory: [
      { date: '2025-12-15', skillId: 'ball-handling', level: 1, previousLevel: null, coach: 'Coach Sarah', notes: 'Initial assessment. Good potential!' }
    ],
    seasonProgress: 0,
    joinDate: '2025-12-01'
  },
  {
    id: 'p7',
    name: 'Ava Thompson',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    photoURL: null,
    skills: {
      'ball-handling': { level: 2, lastAssessed: '2026-01-10' },
      'passing-receiving': { level: 2, lastAssessed: '2026-01-10' },
      'shooting': { level: 2, lastAssessed: '2026-01-05' },
      'footwork': { level: 2, lastAssessed: '2026-01-05' },
      'defense': { level: 2, lastAssessed: '2026-01-10' },
      'off-ball-movement': { level: 1, lastAssessed: '2025-12-20' },
      'team-play': { level: 2, lastAssessed: '2026-01-10' },
      'basketball-iq': { level: 2, lastAssessed: '2026-01-10' }
    },
    assessmentHistory: [],
    seasonProgress: 0.8,
    joinDate: '2024-09-01'
  },
  {
    id: 'p8',
    name: 'Mason Lee',
    teamId: 't2',
    teamName: 'U12 Emerald',
    ageGroup: 'U12',
    photoURL: null,
    skills: {
      'ball-handling': null,
      'passing-receiving': null,
      'shooting': null,
      'footwork': null,
      'defense': null,
      'off-ball-movement': null,
      'team-play': null,
      'basketball-iq': null
    },
    assessmentHistory: [],
    seasonProgress: 0,
    joinDate: '2026-01-15'
  }
];

// Sample teams for the coach
const sampleTeams = [
  { id: 't1', name: 'U14 Lakers', ageGroup: 'U14' },
  { id: 't2', name: 'U12 Emerald', ageGroup: 'U12' }
];

const CoachPlayerOverviewPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile, currentUser } = useAuth();
  const { players: firestorePlayers, evaluations, teams: firestoreTeams, loading: dataLoading } = useData();

  // Read query params for deep-linking
  const teamParam = searchParams.get('team');
  const playerParam = searchParams.get('player');

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(teamParam || 'all');
  const [filterType, setFilterType] = useState('all'); // all, recently-assessed, needs-assessment
  const [sortBy, setSortBy] = useState('name'); // name, last-assessment, progress
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  // Use sample data if no real data exists
  const players = useMemo(() => {
    if (firestorePlayers && firestorePlayers.length > 0) {
      // Transform Firestore players to match our expected structure
      return firestorePlayers.map(player => {
        const playerSkills = {};
        SKILL_CATEGORIES.forEach(skill => {
          const evalKey = `${player.id}_${skill.id}`;
          const evaluation = evaluations[evalKey];
          if (evaluation) {
            playerSkills[skill.id] = {
              level: evaluation.level,
              lastAssessed: evaluation.date
            };
          } else {
            playerSkills[skill.id] = null;
          }
        });
        return {
          ...player,
          skills: playerSkills,
          assessmentHistory: player.assessmentHistory || []
        };
      });
    }
    return samplePlayers;
  }, [firestorePlayers, evaluations]);

  const teams = useMemo(() => {
    if (firestoreTeams && firestoreTeams.length > 0) {
      return firestoreTeams.map(t => ({
        id: t.id,
        name: t.name || t.teamName || 'Unknown Team',
        ageGroup: t.ageGroup || ''
      }));
    }
    return sampleTeams;
  }, [firestoreTeams]);

  // Auto-open player detail modal from ?player= query param
  useEffect(() => {
    if (playerParam && players.length > 0) {
      const player = players.find(p => p.id === playerParam);
      if (player) {
        setSelectedPlayer(player);
        setShowPlayerModal(true);
      }
    }
  }, [playerParam, players]);

  // Calculate player stats
  const getPlayerStats = (player) => {
    const skills = player.skills || {};
    const assessedSkills = Object.values(skills).filter(s => s !== null);
    const totalSkills = SKILL_CATEGORIES.length;
    const assessedCount = assessedSkills.length;

    const totalLevels = assessedSkills.reduce((sum, s) => sum + (s?.level || 0), 0);
    const avgLevel = assessedCount > 0 ? (totalLevels / assessedCount).toFixed(1) : 0;

    // Get last assessment date
    const dates = assessedSkills
      .map(s => s?.lastAssessed)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a));
    const lastAssessment = dates[0] || null;

    // Check if needs assessment (more than 30 days since last assessment or not fully assessed)
    const needsAssessment = !lastAssessment ||
      (new Date() - new Date(lastAssessment)) > 30 * 24 * 60 * 60 * 1000 ||
      assessedCount < totalSkills;

    return {
      assessedCount,
      totalSkills,
      avgLevel: parseFloat(avgLevel),
      lastAssessment,
      needsAssessment,
      seasonProgress: player.seasonProgress || 0
    };
  };

  // Get skill level dot color
  const getSkillDotColor = (skill) => {
    if (!skill) return 'bg-gray-400'; // Not assessed
    if (skill.level >= 3) return 'bg-[#22c55e]'; // Green - Level 3-4
    if (skill.level === 2) return 'bg-yellow-400'; // Yellow - Level 2
    return 'bg-red-400'; // Red - Level 1
  };

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Filter by team (match by teamId or team name)
    if (selectedTeam !== 'all') {
      result = result.filter(p =>
        p.teamId === selectedTeam ||
        p.teamName === selectedTeam ||
        p.team === selectedTeam
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.teamName?.toLowerCase().includes(query)
      );
    }

    // Filter by assessment status
    if (filterType === 'recently-assessed') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(p => {
        const stats = getPlayerStats(p);
        return stats.lastAssessment && new Date(stats.lastAssessment) > thirtyDaysAgo;
      });
    } else if (filterType === 'needs-assessment') {
      result = result.filter(p => {
        const stats = getPlayerStats(p);
        return stats.needsAssessment;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'last-assessment':
          const aDate = getPlayerStats(a).lastAssessment;
          const bDate = getPlayerStats(b).lastAssessment;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(bDate) - new Date(aDate);
        case 'progress':
          return (b.seasonProgress || 0) - (a.seasonProgress || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [players, selectedTeam, searchQuery, filterType, sortBy]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format relative date
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'Never assessed';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  // Handle player card click
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowPlayerModal(false);
    setSelectedPlayer(null);
  };

  // Navigate to assessment page for player
  const handleAssessPlayer = (playerId) => {
    navigate(`/coach-assessment?playerId=${playerId}`);
  };

  if (dataLoading) {
    return (
      <PageShell
        title="Player Overview"
        subtitle="Loading..."
        backTo="/dashboard"
        breadcrumbs={[
          { label: 'Home', url: '/welcome' },
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'My Players' }
        ]}
        maxWidth="4xl"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a8a68] border-t-[#22c55e] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Loading players...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Player Overview"
      subtitle={`${filteredPlayers.length} players \u2022 ${teams.length} teams`}
      backTo="/dashboard"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/dashboard' },
        { label: 'My Players' }
      ]}
      maxWidth="4xl"
    >
        {/* Team Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedTeam('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedTeam === 'all'
                ? 'bg-[#22c55e] text-[#0a3d2e]'
                : 'bg-[#0d5943] border border-[#1a8a68] text-white hover:border-[#22c55e]'
            }`}
          >
            All Teams
          </button>
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTeam === team.id
                  ? 'bg-[#22c55e] text-[#0a3d2e]'
                  : 'bg-[#0d5943] border border-[#1a8a68] text-white hover:border-[#22c55e]'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-4 mb-6">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a8a68]" />
            <input
              type="text"
              placeholder="Search players by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a8a68] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[#4ade80] text-sm hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#1a8a68] grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Filter By */}
              <div>
                <label className="block text-[#1a8a68] text-xs font-medium mb-2">Filter By</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All Players' },
                    { value: 'recently-assessed', label: 'Recently Assessed' },
                    { value: 'needs-assessment', label: 'Needs Assessment' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilterType(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filterType === option.value
                          ? 'bg-[#22c55e] text-[#0a3d2e]'
                          : 'bg-[#0a3d2e] border border-[#1a8a68] text-white hover:border-[#22c55e]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[#1a8a68] text-xs font-medium mb-2">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'name', label: 'Name' },
                    { value: 'last-assessment', label: 'Last Assessed' },
                    { value: 'progress', label: 'Progress' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        sortBy === option.value
                          ? 'bg-[#22c55e] text-[#0a3d2e]'
                          : 'bg-[#0a3d2e] border border-[#1a8a68] text-white hover:border-[#22c55e]'
                      }`}
                    >
                      <SortAsc className="w-3 h-3" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Player Grid */}
        {filteredPlayers.length === 0 ? (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">No Players Found</h3>
            <p className="text-[#1a8a68] text-sm">
              {searchQuery ? 'Try a different search term' : 'No players match the current filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPlayers.map(player => {
              const stats = getPlayerStats(player);
              return (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className="group bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-4 text-left transition-all duration-200 hover:border-[#22c55e] hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {/* Player Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-full flex items-center justify-center flex-shrink-0 group-hover:border-[#22c55e] transition-colors">
                      {player.photoURL ? (
                        <img
                          src={player.photoURL}
                          alt={player.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[#4ade80]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate group-hover:text-[#4ade80] transition-colors">
                        {player.name}
                      </h3>
                      <p className="text-[#1a8a68] text-xs">
                        {player.teamName} • {player.ageGroup}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#1a8a68] group-hover:text-[#4ade80] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  {/* Overall Progress */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#4ade80]" />
                      <span className="text-white text-sm font-medium">
                        Avg Level: {stats.avgLevel || '-'}
                      </span>
                    </div>
                    {stats.seasonProgress > 0 && (
                      <span className="text-[#22c55e] text-xs font-medium bg-[#22c55e]/20 px-2 py-0.5 rounded-full">
                        +{stats.seasonProgress} this season
                      </span>
                    )}
                  </div>

                  {/* Skill Dots */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {SKILL_CATEGORIES.map(skill => (
                      <div
                        key={skill.id}
                        className={`w-6 h-6 rounded-full ${getSkillDotColor(player.skills?.[skill.id])} flex items-center justify-center transition-transform group-hover:scale-110`}
                        title={`${skill.name}: Level ${player.skills?.[skill.id]?.level || 'Not assessed'}`}
                      >
                        <span className="text-[8px] font-bold text-white">
                          {player.skills?.[skill.id]?.level || '?'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Stats Footer */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1a8a68]">
                      {stats.assessedCount}/{stats.totalSkills} skills assessed
                    </span>
                    <span className={`flex items-center gap-1 ${stats.needsAssessment ? 'text-yellow-400' : 'text-[#4ade80]'}`}>
                      <Clock className="w-3 h-3" />
                      {formatRelativeDate(stats.lastAssessment)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/coach-assessment')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#22c55e] text-[#0a3d2e] font-semibold rounded-xl hover:bg-[#4ade80] transition-colors active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            New Assessment
          </button>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
          <h3 className="text-white font-medium text-sm mb-3">Skill Level Colors</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#22c55e]" />
              <span className="text-white">Level 3-4 (Competent+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400" />
              <span className="text-white">Level 2 (Developing)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-400" />
              <span className="text-white">Level 1 (Emerging)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <span className="text-white">Not Assessed</span>
            </div>
          </div>
        </div>
      {/* Player Detail Modal */}
      {showPlayerModal && selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={handleCloseModal}
          onAssess={() => handleAssessPlayer(selectedPlayer.id)}
        />
      )}
    </PageShell>
  );
};

// Player Detail Modal Component
const PlayerDetailModal = ({ player, onClose, onAssess }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('skills'); // skills, history, notes

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Get skill level color
  const getLevelColor = (level) => {
    if (!level) return 'bg-gray-400';
    switch (level) {
      case 1: return 'bg-[#1a8a68]';
      case 2: return 'bg-[#22c55e]';
      case 3: return 'bg-[#4ade80]';
      case 4: return 'bg-[#86efac]';
      default: return 'bg-gray-400';
    }
  };

  const getLevelTextColor = (level) => {
    if (!level) return 'text-gray-400';
    switch (level) {
      case 1: return 'text-[#1a8a68]';
      case 2: return 'text-[#22c55e]';
      case 3: return 'text-[#4ade80]';
      case 4: return 'text-[#86efac]';
      default: return 'text-gray-400';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculate stats
  const skills = player.skills || {};
  const assessedSkills = Object.entries(skills).filter(([, s]) => s !== null);
  const totalLevels = assessedSkills.reduce((sum, [, s]) => sum + (s?.level || 0), 0);
  const avgLevel = assessedSkills.length > 0 ? (totalLevels / assessedSkills.length).toFixed(1) : 0;

  // Prepare progression chart data
  const progressionData = useMemo(() => {
    if (!player.assessmentHistory || player.assessmentHistory.length === 0) return [];

    // Group by month and calculate average level
    const monthlyData = {};
    player.assessmentHistory.forEach(assessment => {
      const date = new Date(assessment.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { levels: [], date: monthKey };
      }
      monthlyData[monthKey].levels.push(assessment.level);
    });

    return Object.values(monthlyData)
      .map(m => ({
        month: new Date(m.date + '-01').toLocaleDateString('en-AU', { month: 'short' }),
        avgLevel: (m.levels.reduce((a, b) => a + b, 0) / m.levels.length).toFixed(1)
      }))
      .sort((a, b) => a.date - b.date);
  }, [player.assessmentHistory]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" />

      {/* Modal Content */}
      <div
        className="relative w-full sm:max-w-2xl max-h-[95vh] bg-[#0d5943] border-2 border-[#1a8a68] rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slideUp sm:animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0a3d2e] border-b border-[#1a8a68] p-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-[#0d5943] border-2 border-[#1a8a68] rounded-full flex items-center justify-center">
              {player.photoURL ? (
                <img
                  src={player.photoURL}
                  alt={player.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-[#4ade80]" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{player.name}</h2>
              <p className="text-[#4ade80] text-sm">
                {player.teamName} • {player.ageGroup}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-[#0d5943] border border-[#1a8a68] rounded-full flex items-center justify-center hover:bg-[#1a8a68] hover:border-[#22c55e] transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Stats Summary */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-[#0d5943] border border-[#1a8a68] rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{avgLevel}</p>
              <p className="text-[10px] text-[#1a8a68]">Avg Level</p>
            </div>
            <div className="flex-1 bg-[#0d5943] border border-[#1a8a68] rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{assessedSkills.length}/8</p>
              <p className="text-[10px] text-[#1a8a68]">Skills Assessed</p>
            </div>
            <div className="flex-1 bg-[#0d5943] border border-[#1a8a68] rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-[#22c55e]">+{player.seasonProgress || 0}</p>
              <p className="text-[10px] text-[#1a8a68]">Season Progress</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'skills', label: 'Skills', icon: Award },
              { id: 'history', label: 'History', icon: Calendar },
              { id: 'notes', label: 'Notes', icon: MessageSquare }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : 'bg-[#0d5943] border border-[#1a8a68] text-white hover:border-[#22c55e]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-280px)] p-4 space-y-4">
          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-3">
              {SKILL_CATEGORIES.map(skillCat => {
                const skill = player.skills?.[skillCat.id];
                const Icon = SKILL_ICONS[skillCat.id] || Award;
                return (
                  <div
                    key={skillCat.id}
                    className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${skill ? getLevelColor(skill.level) + '/20' : 'bg-gray-500/20'} border ${skill ? 'border-' + getLevelColor(skill.level).replace('bg-', '') : 'border-gray-500'}`}>
                        <Icon className={`w-5 h-5 ${skill ? getLevelTextColor(skill.level) : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{skillCat.name}</h4>
                        <p className={`text-xs ${skill ? getLevelTextColor(skill.level) : 'text-gray-400'}`}>
                          {skill ? `Level ${skill.level}: ${LEVEL_LABELS[skill.level]}` : 'Not assessed yet'}
                        </p>
                      </div>
                      {skill && (
                        <div className="text-right">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map(lvl => (
                              <div
                                key={lvl}
                                className={`w-2 h-6 rounded-full ${lvl <= skill.level ? getLevelColor(lvl) : 'bg-[#0d5943] border border-[#1a8a68]'}`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-[#1a8a68] mt-1">
                            {formatDate(skill.lastAssessed)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Progression Chart */}
              {progressionData.length > 1 && (
                <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#4ade80]" />
                    Progression Over Time
                  </h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressionData}>
                        <XAxis dataKey="month" tick={{ fill: '#4ade80', fontSize: 10 }} />
                        <YAxis domain={[0, 4]} tick={{ fill: '#4ade80', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0d5943',
                            border: '1px solid #1a8a68',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgLevel"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: '#22c55e', strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Assessment Timeline */}
              <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#4ade80]" />
                  Assessment Timeline
                </h3>
                {player.assessmentHistory && player.assessmentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {player.assessmentHistory.map((assessment, index) => {
                      const skillCat = SKILL_CATEGORIES.find(s => s.id === assessment.skillId);
                      const levelChange = assessment.previousLevel !== null
                        ? assessment.level - assessment.previousLevel
                        : null;
                      return (
                        <div
                          key={index}
                          className="flex gap-3 pb-3 border-b border-[#1a8a68] last:border-0 last:pb-0"
                        >
                          <div className={`w-8 h-8 rounded-full ${getLevelColor(assessment.level)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-xs font-bold text-white">{assessment.level}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">
                                {skillCat?.name || assessment.skillId}
                              </span>
                              {levelChange !== null && levelChange > 0 && (
                                <span className="text-[10px] bg-[#22c55e]/20 text-[#22c55e] px-1.5 py-0.5 rounded-full font-medium">
                                  +{levelChange} level
                                </span>
                              )}
                            </div>
                            <p className="text-[#1a8a68] text-xs">
                              {formatDate(assessment.date)} • {assessment.coach}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[#1a8a68] text-sm text-center py-4">No assessment history yet</p>
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#4ade80]" />
                Coach Notes
              </h3>
              {player.assessmentHistory && player.assessmentHistory.filter(a => a.notes).length > 0 ? (
                <div className="space-y-3">
                  {player.assessmentHistory.filter(a => a.notes).map((assessment, index) => {
                    const skillCat = SKILL_CATEGORIES.find(s => s.id === assessment.skillId);
                    return (
                      <div
                        key={index}
                        className="p-3 bg-[#0d5943] rounded-lg border border-[#1a8a68]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#4ade80] text-xs font-medium">{skillCat?.name}</span>
                          <span className="text-[10px] text-[#1a8a68]">{formatDate(assessment.date)}</span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{assessment.notes}</p>
                        <p className="text-[10px] text-[#1a8a68] mt-2">— {assessment.coach}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#1a8a68] text-sm text-center py-4">No coach notes yet</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 p-4 bg-[#0a3d2e] border-t border-[#1a8a68] flex gap-3">
          <button
            onClick={onAssess}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#22c55e] text-[#0a3d2e] font-semibold rounded-xl hover:bg-[#4ade80] transition-colors active:scale-[0.98]"
          >
            <Edit3 className="w-5 h-5" />
            Assess Player
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-transparent border border-[#1a8a68] text-white font-medium rounded-xl hover:bg-[#1a8a68] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachPlayerOverviewPage;
