import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  Star,
  TrendingUp,
  Award,
  Filter,
  Search,
  User,
  ChevronDown,
  Target,
  Zap,
  Medal
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';

const RepTeamProspectsPage = () => {
  const navigate = useNavigate();
  const { players, evaluations } = useData();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('overall');
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  // Age groups
  const ageGroups = [
    { id: 'all', name: 'All Ages' },
    { id: 'u10', name: 'Under 10' },
    { id: 'u12', name: 'Under 12' },
    { id: 'u14', name: 'Under 14' },
    { id: 'u16', name: 'Under 16' },
    { id: 'u18', name: 'Under 18' }
  ];

  // Calculate player prospects
  const prospects = useMemo(() => {
    // Filter players by age group
    const filteredPlayers = selectedAgeGroup === 'all'
      ? players
      : players.filter(p => {
          const team = (p.team || '').toUpperCase();
          return team.includes(selectedAgeGroup.toUpperCase());
        });

    // Calculate metrics for each player
    const playerMetrics = filteredPlayers.map(player => {
      const playerEvals = Object.values(evaluations || {}).filter(e => e.playerId === player.id);

      // Calculate average level
      const levels = playerEvals.filter(e => e.level).map(e => e.level);
      const avgLevel = levels.length > 0
        ? levels.reduce((a, b) => a + b, 0) / levels.length
        : 0;

      // Calculate improvement (trend)
      let improvement = 0;
      if (playerEvals.length >= 2) {
        const sorted = [...playerEvals].sort((a, b) =>
          new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
        );
        const recentLevels = sorted.slice(-3).filter(e => e.level).map(e => e.level);
        const oldLevels = sorted.slice(0, 3).filter(e => e.level).map(e => e.level);

        if (recentLevels.length && oldLevels.length) {
          const recentAvg = recentLevels.reduce((a, b) => a + b, 0) / recentLevels.length;
          const oldAvg = oldLevels.reduce((a, b) => a + b, 0) / oldLevels.length;
          improvement = recentAvg - oldAvg;
        }
      }

      // Calculate consistency (standard deviation)
      let consistency = 1;
      if (levels.length >= 3) {
        const mean = avgLevel;
        const variance = levels.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / levels.length;
        const stdDev = Math.sqrt(variance);
        consistency = Math.max(0, 1 - (stdDev / 2)); // Normalize: lower stdDev = higher consistency
      }

      // Calculate skill breakdown by category
      const skillCategories = {
        'Ball Handling': ['dribbling', 'ball_control'],
        'Shooting': ['layups', 'free_throws', 'jump_shot'],
        'Defense': ['defensive_stance', 'footwork'],
        'Passing': ['chest_pass', 'bounce_pass'],
        'Basketball IQ': ['decision_making', 'court_vision']
      };

      const skillBreakdown = Object.entries(skillCategories).map(([category, skills]) => {
        const categoryEvals = playerEvals.filter(e =>
          skills.some(s => (e.skillId || '').toLowerCase().includes(s))
        );
        const categoryLevels = categoryEvals.filter(e => e.level).map(e => e.level);
        const avg = categoryLevels.length > 0
          ? categoryLevels.reduce((a, b) => a + b, 0) / categoryLevels.length
          : 0;
        return { category, avg };
      });

      // Overall prospect score (weighted)
      const prospectScore = (
        (avgLevel * 0.5) +
        (improvement * 0.25 * 5) + // Normalize improvement to 0-5 scale
        (consistency * 0.25 * 5) // Normalize consistency to 0-5 scale
      );

      return {
        ...player,
        avgLevel: parseFloat(avgLevel.toFixed(2)),
        improvement: parseFloat(improvement.toFixed(2)),
        consistency: parseFloat(consistency.toFixed(2)),
        prospectScore: parseFloat(prospectScore.toFixed(2)),
        assessmentCount: playerEvals.length,
        skillBreakdown
      };
    });

    // Filter by search term
    let filtered = playerMetrics.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.team || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    switch (sortBy) {
      case 'overall':
        filtered.sort((a, b) => b.prospectScore - a.prospectScore);
        break;
      case 'avgLevel':
        filtered.sort((a, b) => b.avgLevel - a.avgLevel);
        break;
      case 'improvement':
        filtered.sort((a, b) => b.improvement - a.improvement);
        break;
      case 'consistency':
        filtered.sort((a, b) => b.consistency - a.consistency);
        break;
      default:
        filtered.sort((a, b) => b.prospectScore - a.prospectScore);
    }

    // Only show players with assessments
    return filtered.filter(p => p.assessmentCount > 0);
  }, [players, evaluations, selectedAgeGroup, searchTerm, sortBy]);

  // Top prospects (top 5)
  const topProspects = prospects.slice(0, 5);

  const getRankBadge = (index) => {
    const badges = [
      { color: 'bg-yellow-500', icon: Medal },
      { color: 'bg-gray-400', icon: Medal },
      { color: 'bg-orange-600', icon: Medal }
    ];
    return badges[index] || null;
  };

  return (
    <PageShell
      title="Rep Team Prospects"
      subtitle="Top performers across age groups"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Rep Team Prospects' }
      ]}
    >
      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-white/20 rounded-lg pl-10 pr-4 py-2 text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651]"
          />
        </div>

        {/* Age Group Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {ageGroups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedAgeGroup(group.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                selectedAgeGroup === group.id
                  ? 'bg-[#005028] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-white/20 rounded-lg px-3 py-1 text-sm text-gray-800 focus:outline-none focus:border-[#00A651]"
          >
            <option value="overall">Prospect Score</option>
            <option value="avgLevel">Average Level</option>
            <option value="improvement">Improvement</option>
            <option value="consistency">Consistency</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Prospects Highlight */}
        {topProspects.length > 0 && (
          <div className="bg-gradient-to-br from-[#005028] to-[#00A651] rounded-xl p-4 border border-[#00A651]/30">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Star className="text-yellow-400" size={18} />
              Top Prospects
            </h3>
            <div className="space-y-3">
              {topProspects.slice(0, 3).map((player, index) => {
                const badge = getRankBadge(index);
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 bg-gray-100 rounded-lg p-3"
                  >
                    <div className={`w-8 h-8 ${badge?.color || 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                      {badge ? (
                        <badge.icon className="text-gray-800" size={16} />
                      ) : (
                        <span className="text-gray-800 font-bold text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      <p className="text-xs text-gray-400">{player.team || 'Unassigned'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#00A651]">{player.prospectScore}</p>
                      <p className="text-xs text-gray-400">score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Prospects */}
        <div>
          <h3 className="font-bold mb-4">All Prospects ({prospects.length})</h3>
          {prospects.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <User className="mx-auto mb-2 text-gray-800/30" size={32} />
              <p className="text-gray-400">No prospects found</p>
              <p className="text-sm text-gray-800/30">Adjust filters or add assessments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prospects.map((player, index) => {
                const isExpanded = expandedPlayer === player.id;

                return (
                  <div key={player.id} className="bg-white rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                      className="w-full p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-gray-400 text-sm">{index + 1}</span>
                        <div className="w-10 h-10 bg-[#005028]/20 rounded-full flex items-center justify-center">
                          <User className="text-[#00A651]" size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-gray-400">{player.team || 'Unassigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#00A651]">{player.prospectScore}</p>
                          <p className="text-xs text-gray-400">score</p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/10 pt-4">
                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-gray-100 rounded-lg p-3 text-center">
                            <Award className="mx-auto mb-1 text-[#00A651]" size={16} />
                            <p className="text-lg font-bold">{player.avgLevel}</p>
                            <p className="text-xs text-gray-400">Avg Level</p>
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3 text-center">
                            <TrendingUp className={`mx-auto mb-1 ${player.improvement > 0 ? 'text-[#00A651]' : 'text-yellow-400'}`} size={16} />
                            <p className="text-lg font-bold">
                              {player.improvement > 0 ? '+' : ''}{player.improvement}
                            </p>
                            <p className="text-xs text-gray-400">Improvement</p>
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3 text-center">
                            <Zap className="mx-auto mb-1 text-[#00A651]" size={16} />
                            <p className="text-lg font-bold">{Math.round(player.consistency * 100)}%</p>
                            <p className="text-xs text-gray-400">Consistency</p>
                          </div>
                        </div>

                        {/* Skill Radar */}
                        {player.skillBreakdown.some(s => s.avg > 0) && (
                          <div className="h-48 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={player.skillBreakdown}>
                                <PolarGrid stroke="#D4E4D4" />
                                <PolarAngleAxis dataKey="category" tick={{ fill: '#fff', fontSize: 9 }} />
                                <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#fff', fontSize: 10 }} />
                                <Radar
                                  dataKey="avg"
                                  stroke="#00A651"
                                  fill="#00A651"
                                  fillOpacity={0.5}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/player/${player.id}`)}
                            className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                          >
                            View Profile
                          </button>
                          <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">
                            Add to Watchlist
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default RepTeamProspectsPage;
