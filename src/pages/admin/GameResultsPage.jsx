import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  ChevronRight,
  Trophy,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  ChevronDown,
  Edit3,
  Plus,
  BarChart3,
  Target,
  Clock,
  Award
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

/**
 * Convert Firestore Timestamp or string to JavaScript Date
 */
const toJsDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return isNaN(dateValue.getTime()) ? null : dateValue;
  if (typeof dateValue.toDate === 'function') return dateValue.toDate();
  if (dateValue.seconds !== undefined) return new Date(dateValue.seconds * 1000);
  if (typeof dateValue === 'string') {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// Sample game results data
const sampleGames = [
  {
    id: 'g1',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    opponent: 'Hills Hawks',
    date: '2026-02-08',
    time: '14:00',
    venue: 'Emerald Indoor Courts',
    homeScore: 48,
    awayScore: 42,
    result: 'win',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    scorers: [
      { name: 'Emma Wilson', points: 18 },
      { name: 'Liam Johnson', points: 14 },
      { name: 'Noah Davis', points: 10 }
    ],
    notes: 'Great defensive effort in 4th quarter'
  },
  {
    id: 'g2',
    teamId: 't2',
    teamName: 'U12 Emerald',
    ageGroup: 'U12',
    opponent: 'North Stars',
    date: '2026-02-08',
    time: '10:00',
    venue: 'Emerald Indoor Courts',
    homeScore: 32,
    awayScore: 38,
    result: 'loss',
    coachId: 'coach-2',
    coachName: 'Mike Thompson',
    scorers: [
      { name: 'Sophia Garcia', points: 12 },
      { name: 'Oliver Brown', points: 10 }
    ],
    notes: 'Need to work on free throws'
  },
  {
    id: 'g3',
    teamId: 't3',
    teamName: 'U10 Green',
    ageGroup: 'U10',
    opponent: 'Western Warriors',
    date: '2026-02-01',
    time: '09:00',
    venue: 'Sports Centre',
    homeScore: 24,
    awayScore: 24,
    result: 'draw',
    coachId: 'coach-3',
    coachName: 'James Wilson',
    scorers: [
      { name: 'Ava Chen', points: 8 },
      { name: 'Jack Miller', points: 8 }
    ],
    notes: 'Close game, good teamwork'
  },
  {
    id: 'g4',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    opponent: 'Thunder',
    date: '2026-02-01',
    time: '16:00',
    venue: 'Thunder Arena',
    homeScore: 52,
    awayScore: 45,
    result: 'win',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    scorers: [
      { name: 'Emma Wilson', points: 22 },
      { name: 'Noah Davis', points: 15 }
    ],
    notes: 'Strong start set the tone'
  },
  {
    id: 'g5',
    teamId: 't4',
    teamName: 'U16 Dragons',
    ageGroup: 'U16',
    opponent: 'City Blazers',
    date: '2026-01-25',
    time: '18:00',
    venue: 'City Arena',
    homeScore: 58,
    awayScore: 62,
    result: 'loss',
    coachId: 'coach-2',
    coachName: 'Mike Thompson',
    scorers: [
      { name: 'James Lee', points: 20 },
      { name: 'Sarah Kim', points: 18 }
    ],
    notes: 'Lost momentum in final minutes'
  },
  {
    id: 'g6',
    teamId: 't5',
    teamName: 'U14 Gold',
    ageGroup: 'U14',
    opponent: 'Eagles',
    date: '2026-01-25',
    time: '12:00',
    venue: 'Emerald Indoor Courts',
    homeScore: 44,
    awayScore: 36,
    result: 'win',
    coachId: 'coach-4',
    coachName: 'Lisa Chen',
    scorers: [
      { name: 'Mia Roberts', points: 16 },
      { name: 'Ethan Park', points: 14 }
    ],
    notes: 'Dominant second half performance'
  }
];

// Chart colors
const CHART_COLORS = ['#22c55e', '#ef4444', '#eab308'];

const GameResultsPage = () => {
  const navigate = useNavigate();
  const { players } = useData();

  // State
  const [games, setGames] = useState(sampleGames);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showAddResultModal, setShowAddResultModal] = useState(false);

  const ageGroups = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'];
  const teams = [...new Set(games.map(g => g.teamName))].sort();

  // Filter games
  const filteredGames = useMemo(() => {
    let result = [...games];

    if (selectedTeam !== 'all') {
      result = result.filter(g => g.teamName === selectedTeam);
    }

    if (selectedAgeGroup !== 'all') {
      result = result.filter(g => g.ageGroup === selectedAgeGroup);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.teamName.toLowerCase().includes(query) ||
        g.opponent.toLowerCase().includes(query) ||
        g.venue.toLowerCase().includes(query)
      );
    }

    // Sort by date (most recent first)
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    return result;
  }, [games, selectedTeam, selectedAgeGroup, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const wins = games.filter(g => g.result === 'win').length;
    const losses = games.filter(g => g.result === 'loss').length;
    const draws = games.filter(g => g.result === 'draw').length;
    const totalGames = games.length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    const totalPointsFor = games.reduce((sum, g) => sum + g.homeScore, 0);
    const totalPointsAgainst = games.reduce((sum, g) => sum + g.awayScore, 0);
    const avgPointsFor = totalGames > 0 ? Math.round(totalPointsFor / totalGames) : 0;
    const avgPointsAgainst = totalGames > 0 ? Math.round(totalPointsAgainst / totalGames) : 0;

    // Team performance
    const teamStats = {};
    games.forEach(g => {
      if (!teamStats[g.teamName]) {
        teamStats[g.teamName] = { wins: 0, losses: 0, draws: 0, games: 0 };
      }
      teamStats[g.teamName].games++;
      if (g.result === 'win') teamStats[g.teamName].wins++;
      if (g.result === 'loss') teamStats[g.teamName].losses++;
      if (g.result === 'draw') teamStats[g.teamName].draws++;
    });

    const teamPerformance = Object.entries(teamStats).map(([team, data]) => ({
      team,
      ...data,
      winRate: Math.round((data.wins / data.games) * 100)
    })).sort((a, b) => b.winRate - a.winRate);

    return {
      wins,
      losses,
      draws,
      totalGames,
      winRate,
      avgPointsFor,
      avgPointsAgainst,
      pointsDiff: avgPointsFor - avgPointsAgainst,
      teamPerformance
    };
  }, [games]);

  // Pie chart data
  const recordPieData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
    { name: 'Draws', value: stats.draws }
  ].filter(d => d.value > 0);

  // Format date (handles Firestore Timestamps and strings)
  const formatDate = (dateValue) => {
    const jsDate = toJsDate(dateValue);
    if (!jsDate) return '-';
    return jsDate.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Get result icon
  const getResultIcon = (result) => {
    switch (result) {
      case 'win':
        return <TrendingUp className="w-5 h-5 text-[#22c55e]" />;
      case 'loss':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-400" />;
    }
  };

  // Get result color
  const getResultColor = (result) => {
    switch (result) {
      case 'win':
        return 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]';
      case 'loss':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    }
  };

  return (
    <PageShell
      title="Game Results"
      subtitle={`${stats.totalGames} games • ${stats.winRate}% win rate`}
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Game Results' }
      ]}
      maxWidth="6xl"
      headerActions={
        <button
          onClick={() => setShowAddResultModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#22c55e] text-[#0a3d2e] rounded-xl font-semibold hover:bg-[#4ade80] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Result</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
            <p className="text-[#1a8a68] text-xs">Total Games</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-[#22c55e]/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#22c55e]">{stats.wins}</p>
            <p className="text-[#1a8a68] text-xs">Wins</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
            <p className="text-[#1a8a68] text-xs">Losses</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
            <p className="text-[#1a8a68] text-xs">Draws</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.avgPointsFor}</p>
            <p className="text-[#1a8a68] text-xs">Avg Points For</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stats.pointsDiff >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
              {stats.pointsDiff >= 0 ? '+' : ''}{stats.pointsDiff}
            </p>
            <p className="text-[#1a8a68] text-xs">Point Diff</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Win/Loss Pie Chart */}
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4">Overall Record</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recordPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {recordPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d5943',
                      border: '1px solid #1a8a68',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#4ade80', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4">Team Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.teamPerformance} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#4ade80', fontSize: 12 }} />
                  <YAxis dataKey="team" type="category" tick={{ fill: '#4ade80', fontSize: 10 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d5943',
                      border: '1px solid #1a8a68',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value, name) => [`${value}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" fill="#22c55e" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a8a68]" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[#4ade80] text-sm hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#1a8a68] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#1a8a68] text-xs font-medium mb-2">Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-[#0a3d2e] border border-[#1a8a68] rounded-lg px-3 py-2 text-white focus:border-[#22c55e] focus:outline-none"
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#1a8a68] text-xs font-medium mb-2">Age Group</label>
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="w-full bg-[#0a3d2e] border border-[#1a8a68] rounded-lg px-3 py-2 text-white focus:border-[#22c55e] focus:outline-none"
                >
                  <option value="all">All Age Groups</option>
                  {ageGroups.map(ag => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Games List */}
        <div className="space-y-4">
          <h3 className="text-white font-bold">Recent Games</h3>

          {filteredGames.length === 0 ? (
            <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center">
              <Trophy className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">No Games Found</h3>
              <p className="text-[#1a8a68] text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5 hover:border-[#22c55e] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getResultIcon(game.result)}
                    <div>
                      <h4 className="text-white font-bold">{game.teamName} vs {game.opponent}</h4>
                      <div className="flex items-center gap-3 text-[#1a8a68] text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(game.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {game.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-white">{game.homeScore}</span>
                      <span className="text-[#1a8a68]">-</span>
                      <span className="text-2xl font-bold text-white/70">{game.awayScore}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border uppercase ${getResultColor(game.result)}`}>
                      {game.result}
                    </span>
                  </div>
                </div>

                {/* Top Scorers Preview */}
                {game.scorers && game.scorers.length > 0 && (
                  <div className="flex items-center gap-4 pt-3 border-t border-[#1a8a68]/50">
                    <span className="text-[#1a8a68] text-xs">Top Scorers:</span>
                    {game.scorers.slice(0, 3).map((scorer, idx) => (
                      <span key={idx} className="text-white/70 text-xs">
                        {scorer.name} ({scorer.points})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Game Detail Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedGame(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Score Header */}
            <div className="text-center mb-6">
              <p className="text-[#1a8a68] text-sm mb-2">{formatDate(selectedGame.date)} • {selectedGame.venue}</p>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{selectedGame.teamName}</p>
                  <p className="text-4xl font-bold text-white">{selectedGame.homeScore}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg font-bold uppercase ${getResultColor(selectedGame.result)}`}>
                  {selectedGame.result}
                </span>
                <div className="text-center">
                  <p className="text-white/70 font-bold text-lg">{selectedGame.opponent}</p>
                  <p className="text-4xl font-bold text-white/70">{selectedGame.awayScore}</p>
                </div>
              </div>
            </div>

            {/* Game Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#1a8a68] text-xs mb-1">Age Group</p>
                  <p className="text-white">{selectedGame.ageGroup}</p>
                </div>
                <div>
                  <p className="text-[#1a8a68] text-xs mb-1">Coach</p>
                  <p className="text-white">{selectedGame.coachName}</p>
                </div>
              </div>

              {/* Scorers */}
              {selectedGame.scorers && selectedGame.scorers.length > 0 && (
                <div>
                  <p className="text-[#1a8a68] text-xs mb-2">Top Scorers</p>
                  <div className="space-y-2">
                    {selectedGame.scorers.map((scorer, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#0a3d2e] rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-500 text-[#0a3d2e]' :
                            idx === 1 ? 'bg-gray-400 text-[#0a3d2e]' :
                            'bg-orange-600 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-white">{scorer.name}</span>
                        </div>
                        <span className="text-[#4ade80] font-bold">{scorer.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedGame.notes && (
                <div>
                  <p className="text-[#1a8a68] text-xs mb-1">Coach Notes</p>
                  <p className="text-white bg-[#0a3d2e] rounded-lg px-3 py-2">{selectedGame.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedGame(null)}
              className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Result Modal (Placeholder) */}
      {showAddResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddResultModal(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Add Game Result</h3>
            <p className="text-white/70 text-sm mb-4">
              To add a new game result, please go to the Schedule Management page and update the game with the final score.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddResultModal(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/admin/schedule')}
                className="flex-1 py-3 bg-[#22c55e] hover:bg-[#1a8a68] rounded-xl text-white font-medium transition-colors"
              >
                Go to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default GameResultsPage;
