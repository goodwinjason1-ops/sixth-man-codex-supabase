import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Users,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Star,
  ChevronDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const CoachingEffectivenessPage = () => {
  const navigate = useNavigate();
  const { players, evaluations } = useData();
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [expandedCoach, setExpandedCoach] = useState(null);

  // Sample coach data (in real app, this would come from database)
  const coaches = useMemo(() => {
    // Extract coaches from players with coach role
    const coachPlayers = players.filter(p => p.role === 'coach');

    // If no coaches found, use sample data
    if (coachPlayers.length === 0) {
      return [
        { id: 'coach1', name: 'Michael Chen', teams: ['U12 Boys', 'U14 Boys'] },
        { id: 'coach2', name: 'Sarah Williams', teams: ['U10 Girls', 'U12 Girls'] },
        { id: 'coach3', name: 'David Thompson', teams: ['U14 Girls', 'U16 Girls'] },
        { id: 'coach4', name: 'Emma Davis', teams: ['U8 Mixed', 'U10 Boys'] }
      ];
    }

    return coachPlayers.map(c => ({
      id: c.id,
      name: c.name,
      teams: [c.team].filter(Boolean)
    }));
  }, [players]);

  // Calculate coach statistics
  const coachStats = useMemo(() => {
    const stats = {};

    coaches.forEach(coach => {
      // Get players coached by this coach (based on team assignment)
      const coachedPlayers = players.filter(p =>
        coach.teams.some(team =>
          (p.team || '').toLowerCase().includes(team.toLowerCase().replace(/\s+/g, ''))
        )
      );

      // Get evaluations for coached players
      const coachEvals = Object.values(evaluations || {}).filter(e =>
        coachedPlayers.some(p => p.id === e.playerId)
      );

      // Calculate average skill improvement
      const playerProgress = {};
      coachEvals.forEach(e => {
        if (!playerProgress[e.playerId]) {
          playerProgress[e.playerId] = [];
        }
        playerProgress[e.playerId].push({
          date: new Date(e.date || e.createdAt),
          level: e.level || 0
        });
      });

      // Calculate improvement for each player
      let totalImprovement = 0;
      let playersWithProgress = 0;

      Object.values(playerProgress).forEach(evals => {
        if (evals.length >= 2) {
          evals.sort((a, b) => a.date - b.date);
          const improvement = evals[evals.length - 1].level - evals[0].level;
          totalImprovement += improvement;
          playersWithProgress++;
        }
      });

      const avgImprovement = playersWithProgress > 0
        ? totalImprovement / playersWithProgress
        : 0;

      // Calculate overall average level
      const allLevels = coachEvals.filter(e => e.level).map(e => e.level);
      const avgLevel = allLevels.length > 0
        ? allLevels.reduce((a, b) => a + b, 0) / allLevels.length
        : 0;

      // Assessment frequency (per player per month)
      const assessmentFrequency = coachedPlayers.length > 0
        ? (coachEvals.length / coachedPlayers.length / 3).toFixed(1) // Assuming 3 months of data
        : 0;

      // Monthly trend data
      const monthlyTrend = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthEvals = coachEvals.filter(e => {
          const date = new Date(e.date || e.createdAt);
          return date >= monthStart && date <= monthEnd;
        });

        const monthAvg = monthEvals.length > 0
          ? monthEvals.reduce((sum, e) => sum + (e.level || 0), 0) / monthEvals.length
          : null;

        monthlyTrend.push({
          month: monthStart.toLocaleDateString('en-AU', { month: 'short' }),
          avgLevel: monthAvg,
          assessments: monthEvals.length
        });
      }

      stats[coach.id] = {
        ...coach,
        playerCount: coachedPlayers.length,
        assessmentCount: coachEvals.length,
        avgLevel: avgLevel.toFixed(1),
        avgImprovement: avgImprovement.toFixed(2),
        assessmentFrequency,
        monthlyTrend,
        playersWithProgress
      };
    });

    return stats;
  }, [coaches, players, evaluations]);

  // Coach comparison data
  const comparisonData = useMemo(() => {
    return coaches.map(coach => ({
      name: coach.name.split(' ')[0], // First name only for chart
      avgLevel: parseFloat(coachStats[coach.id]?.avgLevel || 0),
      improvement: parseFloat(coachStats[coach.id]?.avgImprovement || 0),
      assessments: coachStats[coach.id]?.assessmentCount || 0
    }));
  }, [coaches, coachStats]);

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
            <h1 className="text-xl font-bold">Coaching Effectiveness</h1>
            <p className="text-white/60 text-sm">Coach performance analysis</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="text-white">Coaching Effectiveness</span>
      </div>

      <div className="px-4 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d5943] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="text-[#4ade80]" size={18} />
              <span className="text-white/60 text-sm">Total Coaches</span>
            </div>
            <p className="text-2xl font-bold">{coaches.length}</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-[#4ade80]" size={18} />
              <span className="text-white/60 text-sm">Avg Improvement</span>
            </div>
            <p className="text-2xl font-bold">
              {(Object.values(coachStats).reduce((sum, c) => sum + parseFloat(c.avgImprovement), 0) / coaches.length || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Coach Comparison Chart */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4">Coach Comparison - Average Player Level</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a8a68" />
                <XAxis dataKey="name" stroke="#fff" fontSize={12} />
                <YAxis stroke="#fff" fontSize={12} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d5943', border: '1px solid #1a8a68', borderRadius: '8px' }}
                />
                <Bar dataKey="avgLevel" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Individual Coach Cards */}
        <div className="space-y-3">
          <h3 className="font-bold">Coach Details</h3>
          {coaches.map(coach => {
            const stats = coachStats[coach.id];
            const isExpanded = expandedCoach === coach.id;

            return (
              <div key={coach.id} className="bg-[#0d5943] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCoach(isExpanded ? null : coach.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#22c55e]/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="text-[#4ade80]" size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold">{coach.name}</h3>
                      <p className="text-sm text-white/60">{coach.teams.join(', ') || 'No teams assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#4ade80]">{stats.avgLevel}</p>
                      <p className="text-xs text-white/50">avg level</p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Users className="mx-auto mb-1 text-[#4ade80]" size={16} />
                        <p className="text-lg font-bold">{stats.playerCount}</p>
                        <p className="text-xs text-white/50">Players</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Target className="mx-auto mb-1 text-[#4ade80]" size={16} />
                        <p className="text-lg font-bold">{stats.assessmentCount}</p>
                        <p className="text-xs text-white/50">Assessments</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <TrendingUp className="mx-auto mb-1 text-[#4ade80]" size={16} />
                        <p className="text-lg font-bold">{stats.avgImprovement > 0 ? '+' : ''}{stats.avgImprovement}</p>
                        <p className="text-xs text-white/50">Improvement</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Clock className="mx-auto mb-1 text-[#4ade80]" size={16} />
                        <p className="text-lg font-bold">{stats.assessmentFrequency}</p>
                        <p className="text-xs text-white/50">Freq/mo</p>
                      </div>
                    </div>

                    {/* Monthly Trend */}
                    {stats.monthlyTrend.some(m => m.avgLevel !== null) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Monthly Trend</h4>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.monthlyTrend.filter(m => m.avgLevel !== null)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1a8a68" />
                              <XAxis dataKey="month" stroke="#fff" fontSize={10} />
                              <YAxis stroke="#fff" fontSize={10} domain={[0, 5]} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0d5943', border: '1px solid #1a8a68', borderRadius: '8px' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="avgLevel"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ fill: '#22c55e' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Teams */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Assigned Teams</h4>
                      <div className="flex flex-wrap gap-2">
                        {coach.teams.map(team => (
                          <span
                            key={team}
                            className="px-3 py-1 bg-[#22c55e]/20 text-[#4ade80] rounded-full text-sm"
                          >
                            {team}
                          </span>
                        ))}
                        {coach.teams.length === 0 && (
                          <span className="text-white/50 text-sm">No teams assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Insights */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4">Coaching Insights</h3>
          <div className="space-y-3">
            <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
              <p className="text-sm text-[#4ade80]">
                Top performer: {coaches.length > 0 && Object.values(coachStats).sort((a, b) => parseFloat(b.avgLevel) - parseFloat(a.avgLevel))[0]?.name || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                Most assessments: {coaches.length > 0 && Object.values(coachStats).sort((a, b) => b.assessmentCount - a.assessmentCount)[0]?.name || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                Best improvement: {coaches.length > 0 && Object.values(coachStats).sort((a, b) => parseFloat(b.avgImprovement) - parseFloat(a.avgImprovement))[0]?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachingEffectivenessPage;
