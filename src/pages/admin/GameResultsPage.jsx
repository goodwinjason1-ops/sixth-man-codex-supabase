import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilteredData } from '../../hooks/useFilteredData';
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


// Chart colors
const CHART_COLORS = ['#00A651', '#ef4444', '#eab308'];

const GameResultsPage = () => {
  const navigate = useNavigate();
  const { games: firestoreGames, players, teams: firestoreTeams, loading } = useFilteredData();

  // Derive completed games from Firestore (only games that have a result)
  const games = useMemo(() => {
    if (!firestoreGames) return [];
    return firestoreGames
      .filter(g => g.result && (g.type || 'game') === 'game')
      .map(g => ({
        ...g,
        homeScore: g.finalScore?.home ?? g.homeScore ?? 0,
        awayScore: g.finalScore?.away ?? g.awayScore ?? 0,
        ageGroup: g.ageGroup || (firestoreTeams || []).find(t => t.id === g.teamId)?.ageGroup || '',
        coachName: g.coachName || '',
        scorers: g.scorers || [],
        notes: g.notes || ''
      }));
  }, [firestoreGames, firestoreTeams]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showAddResultModal, setShowAddResultModal] = useState(false);

  const ageGroups = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'];
  const teamNames = [...new Set(games.map(g => g.teamName).filter(Boolean))].sort();

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
        (g.teamName || '').toLowerCase().includes(query) ||
        (g.opponent || '').toLowerCase().includes(query) ||
        (g.venue || '').toLowerCase().includes(query)
      );
    }

    // Sort by date (most recent first)
    result.sort((a, b) => {
      const dateA = toJsDate(a.date);
      const dateB = toJsDate(b.date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });

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
        return <TrendingUp className="w-5 h-5 text-[#00A651]" />;
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
        return 'bg-[#005028]/20 text-[#00A651] border-[#00A651]';
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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005028] text-white rounded-xl font-semibold hover:bg-[#00A651] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Result</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Loading State */}
        {loading && games.length === 0 && (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full mx-auto mb-4" />
            <p className="text-[#6B7C6B]">Loading game results...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && games.length === 0 && (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-2">No Match Results Yet</h3>
            <p className="text-[#6B7C6B] text-sm">
              No match results recorded yet. Complete a match day assessment to see results here.
            </p>
          </div>
        )}

        {/* Stats Overview */}
        {games.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.totalGames}</p>
            <p className="text-[#6B7C6B] text-xs">Total Games</p>
          </div>
          <div className="bg-white border-2 border-[#00A651]/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#00A651]">{stats.wins}</p>
            <p className="text-[#6B7C6B] text-xs">Wins</p>
          </div>
          <div className="bg-white border-2 border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
            <p className="text-[#6B7C6B] text-xs">Losses</p>
          </div>
          <div className="bg-white border-2 border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.draws}</p>
            <p className="text-[#6B7C6B] text-xs">Draws</p>
          </div>
          <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.avgPointsFor}</p>
            <p className="text-[#6B7C6B] text-xs">Avg Points For</p>
          </div>
          <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stats.pointsDiff >= 0 ? 'text-[#00A651]' : 'text-red-400'}`}>
              {stats.pointsDiff >= 0 ? '+' : ''}{stats.pointsDiff}
            </p>
            <p className="text-[#6B7C6B] text-xs">Point Diff</p>
          </div>
        </div>}

        {/* Charts */}
        {games.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Win/Loss Pie Chart */}
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
            <h3 className="text-gray-800 font-bold mb-4">Overall Record</h3>
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
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D4E4D4',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#6B7C6B', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
            <h3 className="text-gray-800 font-bold mb-4">Team Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.teamPerformance} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#00A651', fontSize: 12 }} />
                  <YAxis dataKey="team" type="category" tick={{ fill: '#00A651', fontSize: 10 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D4E4D4',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value, name) => [`${value}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" fill="#00A651" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>}

        {/* Search and Filters */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[#00A651] text-sm hover:text-gray-800 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#D4E4D4] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-2">Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2 text-gray-800 focus:border-[#00A651] focus:outline-none"
                >
                  <option value="all">All Teams</option>
                  {teamNames.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-2">Age Group</label>
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2 text-gray-800 focus:border-[#00A651] focus:outline-none"
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
          <h3 className="text-gray-800 font-bold">Recent Games</h3>

          {filteredGames.length === 0 ? (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
              <Trophy className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
              <h3 className="text-gray-800 font-semibold mb-2">No Games Found</h3>
              <p className="text-[#6B7C6B] text-sm">
                {searchQuery || selectedTeam !== 'all' || selectedAgeGroup !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No match results recorded yet. Complete a match day assessment to see results here.'}
              </p>
            </div>
          ) : (
            filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5 hover:border-[#00A651] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getResultIcon(game.result)}
                    <div>
                      <h4 className="text-gray-800 font-bold">{game.teamName} vs {game.opponent}</h4>
                      <div className="flex items-center gap-3 text-[#6B7C6B] text-sm">
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
                      <span className="text-2xl font-bold text-gray-800">{game.homeScore}</span>
                      <span className="text-[#6B7C6B]">-</span>
                      <span className="text-2xl font-bold text-gray-600">{game.awayScore}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border uppercase ${getResultColor(game.result)}`}>
                      {game.result}
                    </span>
                  </div>
                </div>

                {/* Top Scorers Preview */}
                {game.scorers && game.scorers.length > 0 && (
                  <div className="flex items-center gap-4 pt-3 border-t border-[#D4E4D4]/50">
                    <span className="text-[#6B7C6B] text-xs">Top Scorers:</span>
                    {game.scorers.slice(0, 3).map((scorer, idx) => (
                      <span key={idx} className="text-gray-600 text-xs">
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
            className="relative bg-white border-2 border-[#D4E4D4] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Score Header */}
            <div className="text-center mb-6">
              <p className="text-[#6B7C6B] text-sm mb-2">{formatDate(selectedGame.date)} • {selectedGame.venue}</p>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-lg">{selectedGame.teamName}</p>
                  <p className="text-4xl font-bold text-gray-800">{selectedGame.homeScore}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg font-bold uppercase ${getResultColor(selectedGame.result)}`}>
                  {selectedGame.result}
                </span>
                <div className="text-center">
                  <p className="text-gray-600 font-bold text-lg">{selectedGame.opponent}</p>
                  <p className="text-4xl font-bold text-gray-600">{selectedGame.awayScore}</p>
                </div>
              </div>
            </div>

            {/* Game Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#6B7C6B] text-xs mb-1">Age Group</p>
                  <p className="text-gray-800">{selectedGame.ageGroup}</p>
                </div>
                <div>
                  <p className="text-[#6B7C6B] text-xs mb-1">Coach</p>
                  <p className="text-gray-800">{selectedGame.coachName}</p>
                </div>
              </div>

              {/* Scorers */}
              {selectedGame.scorers && selectedGame.scorers.length > 0 && (
                <div>
                  <p className="text-[#6B7C6B] text-xs mb-2">Top Scorers</p>
                  <div className="space-y-2">
                    {selectedGame.scorers.map((scorer, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#F5F9F5] rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-500 text-white' :
                            idx === 1 ? 'bg-gray-400 text-white' :
                            'bg-orange-600 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-gray-800">{scorer.name}</span>
                        </div>
                        <span className="text-[#00A651] font-bold">{scorer.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedGame.notes && (
                <div>
                  <p className="text-[#6B7C6B] text-xs mb-1">Coach Notes</p>
                  <p className="text-gray-800 bg-[#F5F9F5] rounded-lg px-3 py-2">{selectedGame.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedGame(null)}
              className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-800 font-medium transition-colors"
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
            className="relative bg-white border-2 border-[#D4E4D4] rounded-2xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Game Result</h3>
            <p className="text-gray-600 text-sm mb-4">
              To add a new game result, please go to the Schedule Management page and update the game with the final score.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddResultModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/admin/schedule')}
                className="flex-1 py-3 bg-[#005028] hover:bg-gray-100 rounded-xl text-white font-medium transition-colors"
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
