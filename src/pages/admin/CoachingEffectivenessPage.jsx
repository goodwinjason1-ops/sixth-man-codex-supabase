import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import {
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
  const { players, evaluations, teams, matchAssessments, trainingRecords } = useData();
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [expandedCoach, setExpandedCoach] = useState(null);
  const [users, setUsers] = useState([]);

  // Fetch users from Firestore (coaches are in users collection, not players)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Users subscription error:', err);
    });
    return () => unsub();
  }, []);

  // Get coaches from users collection
  const coaches = useMemo(() => {
    if (!users || users.length === 0) return [];
    return users
      .filter(u => u.role === 'coach' || u.role === 'youth_coach' || u.role === 'youth_head_coach')
      .map(coach => ({
        id: coach.id,
        name: coach.displayName || coach.name || coach.email,
        teams: (teams || []).filter(t => t.coachId === coach.id).map(t => t.name || t.teamName),
        assignedTeams: coach.assignedTeams || []
      }));
  }, [users, teams]);

  // Build teamId-to-coachId map for consistent player counting
  const coachTeamIds = useMemo(() => {
    const map = {};
    coaches.forEach(coach => {
      map[coach.id] = (teams || []).filter(t => t.coachId === coach.id).map(t => t.id);
    });
    return map;
  }, [coaches, teams]);

  // Calculate coach statistics
  const coachStats = useMemo(() => {
    const stats = {};

    coaches.forEach(coach => {
      // Get players coached by this coach — consistent: use teamId matching
      const teamIds = coachTeamIds[coach.id] || [];
      const coachedPlayers = (players || []).filter(p => {
        const pTeams = p.teamIds || (p.teamId ? [p.teamId] : []);
        return pTeams.some(tid => teamIds.includes(tid));
      });

      // Get skill evaluations for coached players
      const coachEvals = Object.values(evaluations || {}).filter(e =>
        coachedPlayers.some(p => p.id === e.playerId)
      );

      // Match assessments by this coach
      const coachMatchAssessments = (matchAssessments || []).filter(a => a.coachId === coach.id);

      // Training records by this coach
      const coachTrainingRecords = (trainingRecords || []).filter(r => r.coachId === coach.id);

      const matchCount = coachMatchAssessments.length;
      const trainingCount = coachTrainingRecords.length;
      const totalAssessments = matchCount + trainingCount;

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
        ? (totalAssessments / coachedPlayers.length / 3).toFixed(1) // Assuming 3 months of data
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
        assessmentCount: totalAssessments,
        matchCount,
        trainingCount,
        avgLevel: avgLevel.toFixed(1),
        avgImprovement: avgImprovement.toFixed(2),
        assessmentFrequency,
        monthlyTrend,
        playersWithProgress
      };
    });

    return stats;
  }, [coaches, players, evaluations, matchAssessments, trainingRecords, coachTeamIds]);

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
    <PageShell
      title="Coaching Effectiveness"
      subtitle="Coach performance analysis"
      backTo="/admin/analytics-hub"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Analytics & Reports', url: '/admin/analytics-hub' },
        { label: 'Coaching Effectiveness' }
      ]}
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="text-[#00A651]" size={18} />
              <span className="text-gray-500 text-sm">Total Coaches</span>
            </div>
            <p className="text-2xl font-bold">{coaches.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-[#00A651]" size={18} />
              <span className="text-gray-500 text-sm">Avg Improvement</span>
            </div>
            <p className="text-2xl font-bold">
              {coaches.length > 0 ? (Object.values(coachStats).reduce((sum, c) => sum + parseFloat(c.avgImprovement), 0) / coaches.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Coach Comparison Chart */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4">Coach Comparison - Average Player Level</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                <XAxis dataKey="name" stroke="#fff" fontSize={12} />
                <YAxis stroke="#fff" fontSize={12} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D4E4D4', borderRadius: '8px' }}
                />
                <Bar dataKey="avgLevel" fill="#00A651" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Individual Coach Cards */}
        <div className="space-y-3">
          <h3 className="font-bold">Coach Details</h3>
          {coaches.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <GraduationCap className="w-10 h-10 text-[#6B7C6B] mx-auto mb-2" />
              <p className="text-gray-800 font-medium text-sm">No coaches found</p>
              <p className="text-[#6B7C6B] text-xs mt-1">
                Assign coaches to teams in Team Management to see effectiveness data.
              </p>
            </div>
          ) : coaches.map(coach => {
            const stats = coachStats[coach.id];
            const isExpanded = expandedCoach === coach.id;

            return (
              <div key={coach.id} className="bg-white rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCoach(isExpanded ? null : coach.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#005028]/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="text-[#00A651]" size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold">{coach.name}</h3>
                      <p className="text-sm text-gray-500">{coach.teams.join(', ') || 'No teams assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#00A651]">{stats.avgLevel}</p>
                      <p className="text-xs text-gray-400">avg level</p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <Users className="mx-auto mb-1 text-[#00A651]" size={16} />
                        <p className="text-lg font-bold">{stats.playerCount}</p>
                        <p className="text-xs text-gray-400">Players</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <Target className="mx-auto mb-1 text-[#00A651]" size={16} />
                        <p className="text-lg font-bold">{stats.assessmentCount}</p>
                        <p className="text-[10px] text-gray-400">Match: {stats.matchCount} | Training: {stats.trainingCount}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <TrendingUp className="mx-auto mb-1 text-[#00A651]" size={16} />
                        <p className="text-lg font-bold">{stats.avgImprovement > 0 ? '+' : ''}{stats.avgImprovement}</p>
                        <p className="text-xs text-gray-400">Improvement</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <Clock className="mx-auto mb-1 text-[#00A651]" size={16} />
                        <p className="text-lg font-bold">{stats.assessmentFrequency}</p>
                        <p className="text-xs text-gray-400">Freq/mo</p>
                      </div>
                    </div>

                    {/* Monthly Trend */}
                    {stats.monthlyTrend.some(m => m.avgLevel !== null) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Monthly Trend</h4>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.monthlyTrend.filter(m => m.avgLevel !== null)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                              <XAxis dataKey="month" stroke="#fff" fontSize={10} />
                              <YAxis stroke="#fff" fontSize={10} domain={[0, 5]} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D4E4D4', borderRadius: '8px' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="avgLevel"
                                stroke="#00A651"
                                strokeWidth={2}
                                dot={{ fill: '#00A651' }}
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
                            className="px-3 py-1 bg-[#005028]/20 text-[#00A651] rounded-full text-sm"
                          >
                            {team}
                          </span>
                        ))}
                        {coach.teams.length === 0 && (
                          <span className="text-gray-400 text-sm">No teams assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
          }
        </div>

        {/* Insights */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4">Coaching Insights</h3>
          <div className="space-y-3">
            <div className="p-3 bg-[#005028]/10 border border-[#00A651]/30 rounded-lg">
              <p className="text-sm text-[#00A651]">
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
    </PageShell>
  );
};

export default CoachingEffectivenessPage;
