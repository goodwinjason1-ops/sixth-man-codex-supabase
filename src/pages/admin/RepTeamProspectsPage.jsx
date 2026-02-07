import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
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
    <div className="min-h-screen bg-[#0a3d2e] text-white pb-20">
      {/* Header */}
      <div className="bg-[#0d5943] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Rep Team Prospects</h1>
            <p className="text-white/60 text-sm">Identify standout players</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="text-white">Rep Team Prospects</span>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d5943] border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#22c55e]"
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
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/50" />
          <span className="text-sm text-white/50">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0d5943] border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-[#22c55e]"
          >
            <option value="overall">Prospect Score</option>
            <option value="avgLevel">Average Level</option>
            <option value="improvement">Improvement</option>
            <option value="consistency">Consistency</option>
          </select>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Top Prospects Highlight */}
        {topProspects.length > 0 && (
          <div className="bg-gradient-to-br from-[#0d5943] to-[#1a8a68] rounded-xl p-4 border border-[#22c55e]/30">
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
                    className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                  >
                    <div className={`w-8 h-8 ${badge?.color || 'bg-white/20'} rounded-full flex items-center justify-center`}>
                      {badge ? (
                        <badge.icon className="text-white" size={16} />
                      ) : (
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      <p className="text-xs text-white/50">{player.team || 'Unassigned'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#4ade80]">{player.prospectScore}</p>
                      <p className="text-xs text-white/50">score</p>
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
            <div className="bg-[#0d5943] rounded-xl p-8 text-center">
              <User className="mx-auto mb-2 text-white/30" size={32} />
              <p className="text-white/50">No prospects found</p>
              <p className="text-sm text-white/30">Adjust filters or add assessments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prospects.map((player, index) => {
                const isExpanded = expandedPlayer === player.id;

                return (
                  <div key={player.id} className="bg-[#0d5943] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                      className="w-full p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-white/50 text-sm">{index + 1}</span>
                        <div className="w-10 h-10 bg-[#22c55e]/20 rounded-full flex items-center justify-center">
                          <User className="text-[#4ade80]" size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-white/50">{player.team || 'Unassigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#4ade80]">{player.prospectScore}</p>
                          <p className="text-xs text-white/50">score</p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/10 pt-4">
                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <Award className="mx-auto mb-1 text-[#4ade80]" size={16} />
                            <p className="text-lg font-bold">{player.avgLevel}</p>
                            <p className="text-xs text-white/50">Avg Level</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <TrendingUp className={`mx-auto mb-1 ${player.improvement > 0 ? 'text-[#4ade80]' : 'text-yellow-400'}`} size={16} />
                            <p className="text-lg font-bold">
                              {player.improvement > 0 ? '+' : ''}{player.improvement}
                            </p>
                            <p className="text-xs text-white/50">Improvement</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <Zap className="mx-auto mb-1 text-[#4ade80]" size={16} />
                            <p className="text-lg font-bold">{Math.round(player.consistency * 100)}%</p>
                            <p className="text-xs text-white/50">Consistency</p>
                          </div>
                        </div>

                        {/* Skill Radar */}
                        {player.skillBreakdown.some(s => s.avg > 0) && (
                          <div className="h-48 mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={player.skillBreakdown}>
                                <PolarGrid stroke="#1a8a68" />
                                <PolarAngleAxis dataKey="category" tick={{ fill: '#fff', fontSize: 9 }} />
                                <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#fff', fontSize: 10 }} />
                                <Radar
                                  dataKey="avg"
                                  stroke="#22c55e"
                                  fill="#22c55e"
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
                            className="flex-1 py-2 bg-[#22c55e] hover:bg-[#1a8a68] rounded-lg font-medium text-sm transition-colors"
                          >
                            View Profile
                          </button>
                          <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm transition-colors">
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
    </div>
  );
};

export default RepTeamProspectsPage;
