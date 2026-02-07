import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
  Users,
  TrendingUp,
  Award,
  Target,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const AgeGroupReportsPage = () => {
  const navigate = useNavigate();
  const { players, evaluations } = useData();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Define age groups
  const ageGroups = [
    { id: 'u8', name: 'Under 8', minAge: 5, maxAge: 8 },
    { id: 'u10', name: 'Under 10', minAge: 8, maxAge: 10 },
    { id: 'u12', name: 'Under 12', minAge: 10, maxAge: 12 },
    { id: 'u14', name: 'Under 14', minAge: 12, maxAge: 14 },
    { id: 'u16', name: 'Under 16', minAge: 14, maxAge: 16 },
    { id: 'u18', name: 'Under 18', minAge: 16, maxAge: 18 }
  ];

  // Calculate age group statistics
  const ageGroupStats = useMemo(() => {
    const stats = {};

    ageGroups.forEach(group => {
      // Get players in age group (based on team name pattern)
      const groupPlayers = players.filter(p => {
        const team = (p.team || '').toUpperCase();
        return team.includes(group.id.toUpperCase()) ||
               team.includes(group.name.toUpperCase().replace(' ', ''));
      });

      // Get evaluations for these players
      const groupEvals = Object.values(evaluations || {}).filter(e =>
        groupPlayers.some(p => p.id === e.playerId)
      );

      // Calculate skill breakdown
      const skillLevels = {};
      groupEvals.forEach(e => {
        if (!skillLevels[e.skillId]) {
          skillLevels[e.skillId] = [];
        }
        if (e.level) {
          skillLevels[e.skillId].push(e.level);
        }
      });

      const skillAverages = Object.entries(skillLevels).map(([skillId, levels]) => ({
        skill: skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        avg: levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 0
      }));

      // Calculate overall average
      const allLevels = Object.values(skillLevels).flat();
      const avgLevel = allLevels.length > 0
        ? allLevels.reduce((a, b) => a + b, 0) / allLevels.length
        : 0;

      // Level distribution
      const levelDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      groupEvals.forEach(e => {
        if (e.level >= 1 && e.level <= 5) {
          levelDist[Math.round(e.level)]++;
        }
      });

      stats[group.id] = {
        ...group,
        playerCount: groupPlayers.length,
        assessmentCount: groupEvals.length,
        avgLevel: avgLevel.toFixed(1),
        skillAverages,
        levelDistribution: levelDist,
        playersAssessed: new Set(groupEvals.map(e => e.playerId)).size
      };
    });

    return stats;
  }, [players, evaluations]);

  // Comparison chart data
  const comparisonData = useMemo(() => {
    return ageGroups.map(group => ({
      name: group.name,
      avgLevel: parseFloat(ageGroupStats[group.id]?.avgLevel || 0),
      players: ageGroupStats[group.id]?.playerCount || 0,
      assessments: ageGroupStats[group.id]?.assessmentCount || 0
    }));
  }, [ageGroupStats]);

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
            <h1 className="text-xl font-bold">Age Group Reports</h1>
            <p className="text-white/60 text-sm">Performance by age group</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="text-white">Age Group Reports</span>
      </div>

      <div className="px-4 space-y-6">
        {/* Comparison Chart */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            Age Group Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a8a68" />
                <XAxis dataKey="name" stroke="#fff" fontSize={10} />
                <YAxis stroke="#fff" fontSize={12} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d5943', border: '1px solid #1a8a68', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="avgLevel" name="Avg Level" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Group Cards */}
        <div className="space-y-3">
          {ageGroups.map(group => {
            const stats = ageGroupStats[group.id];
            const isExpanded = expandedGroup === group.id;

            return (
              <div key={group.id} className="bg-[#0d5943] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#22c55e]/20 rounded-xl flex items-center justify-center">
                      <span className="font-bold text-[#4ade80]">{group.id.toUpperCase()}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold">{group.name}</h3>
                      <p className="text-sm text-white/60">{stats.playerCount} players</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#4ade80]">{stats.avgLevel}</p>
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
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Users className="mx-auto mb-1 text-[#4ade80]" size={18} />
                        <p className="text-lg font-bold">{stats.playersAssessed}</p>
                        <p className="text-xs text-white/50">Assessed</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Target className="mx-auto mb-1 text-[#4ade80]" size={18} />
                        <p className="text-lg font-bold">{stats.assessmentCount}</p>
                        <p className="text-xs text-white/50">Assessments</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <Award className="mx-auto mb-1 text-[#4ade80]" size={18} />
                        <p className="text-lg font-bold">{stats.avgLevel}</p>
                        <p className="text-xs text-white/50">Avg Level</p>
                      </div>
                    </div>

                    {/* Level Distribution */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Level Distribution</h4>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(level => {
                          const count = stats.levelDistribution[level];
                          const total = Object.values(stats.levelDistribution).reduce((a, b) => a + b, 0);
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          const colors = {
                            1: 'bg-red-500',
                            2: 'bg-orange-500',
                            3: 'bg-yellow-500',
                            4: 'bg-[#22c55e]',
                            5: 'bg-[#86efac]'
                          };

                          return (
                            <div key={level} className="flex-1">
                              <div className="h-16 bg-white/5 rounded-lg relative overflow-hidden">
                                <div
                                  className={`absolute bottom-0 left-0 right-0 ${colors[level]} transition-all`}
                                  style={{ height: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-center text-xs mt-1 text-white/50">L{level}</p>
                              <p className="text-center text-xs text-white/70">{count}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Skill Averages */}
                    {stats.skillAverages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Skill Breakdown</h4>
                        <div className="space-y-2">
                          {stats.skillAverages.slice(0, 8).map(skill => (
                            <div key={skill.skill} className="flex items-center gap-2">
                              <span className="text-xs text-white/60 w-24 truncate">{skill.skill}</span>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] rounded-full"
                                  style={{ width: `${(skill.avg / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-8 text-right">{skill.avg.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/admin/age-groups/${group.id}`)}
                      className="w-full mt-4 py-2 bg-[#22c55e] hover:bg-[#1a8a68] rounded-lg font-medium text-sm transition-colors"
                    >
                      View Full Report
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgeGroupReportsPage;
