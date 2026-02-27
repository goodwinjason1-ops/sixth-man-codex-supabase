import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import PageShell from '../../components/PageShell';
import {
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
  const { players, evaluations, teams } = useData();
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

    // Debug: log all teams and players for diagnosis
    console.log('[AgeGroups] teams:', (teams || []).map(t => ({ id: t.id, name: t.name, ageGroup: t.ageGroup })));
    console.log('[AgeGroups] players sample:', (players || []).slice(0, 5).map(p => ({ id: p.id, name: p.name || p.displayName, teamId: p.teamId, teamIds: p.teamIds, ageGroup: p.ageGroup })));

    ageGroups.forEach(group => {
      // Get players in age group — match via teamId/teamIds against team objects
      const ageGroupTeamIds = (teams || [])
        .filter(t => {
          const teamName = (t.name || '').toUpperCase();
          const teamAgeGroup = (t.ageGroup || '').toUpperCase();
          return teamName.includes(group.id.toUpperCase()) ||
                 teamName.includes(group.name.toUpperCase().replace(' ', '')) ||
                 teamAgeGroup === group.id.toUpperCase();
        })
        .map(t => t.id);

      // Primary: match via team assignment
      let groupPlayers = players.filter(p => {
        const pTeams = p.teamIds || (p.teamId ? [p.teamId] : []);
        return pTeams.some(tid => ageGroupTeamIds.includes(tid));
      });

      // Fallback: if no players found via team matching, try player's own ageGroup field
      if (groupPlayers.length === 0) {
        groupPlayers = players.filter(p => {
          const pAgeGroup = (p.ageGroup || '').toUpperCase();
          return pAgeGroup === group.id.toUpperCase() ||
                 pAgeGroup === group.name.toUpperCase().replace(' ', '');
        });
        if (groupPlayers.length > 0) {
          console.log(`[AgeGroups] ${group.id}: used ageGroup fallback, found ${groupPlayers.length} players`);
        }
      }

      console.log(`[AgeGroups] ${group.id}: teamIds=${JSON.stringify(ageGroupTeamIds)}, players=${groupPlayers.length}`);

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
  }, [players, evaluations, teams]);

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
    <PageShell
      title="Age Group Reports"
      subtitle="Performance analysis by age group"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Age Group Reports' }
      ]}
    >
      <div className="space-y-6">
        {/* Comparison Chart */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            Age Group Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                <XAxis dataKey="name" stroke="#fff" fontSize={10} />
                <YAxis stroke="#fff" fontSize={12} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D4E4D4', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="avgLevel" name="Avg Level" fill="#00A651" radius={[4, 4, 0, 0]} />
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
              <div key={group.id} className="bg-white rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#005028]/20 rounded-xl flex items-center justify-center">
                      <span className="font-bold text-[#00A651]">{group.id.toUpperCase()}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold">{group.name}</h3>
                      <p className="text-sm text-gray-500">{stats.playerCount} players</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#00A651]">{stats.avgLevel}</p>
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
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <Users className="mx-auto mb-1 text-[#00A651]" size={18} />
                        <p className="text-lg font-bold">{stats.playersAssessed}</p>
                        <p className="text-xs text-gray-400">Assessed</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <Target className="mx-auto mb-1 text-[#00A651]" size={18} />
                        <p className="text-lg font-bold">{stats.assessmentCount}</p>
                        <p className="text-xs text-gray-400">Assessments</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 text-center">
                        <Award className="mx-auto mb-1 text-[#00A651]" size={18} />
                        <p className="text-lg font-bold">{stats.avgLevel}</p>
                        <p className="text-xs text-gray-400">Avg Level</p>
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
                            4: 'bg-[#005028]',
                            5: 'bg-[#86efac]'
                          };

                          return (
                            <div key={level} className="flex-1">
                              <div className="h-16 bg-gray-100 rounded-lg relative overflow-hidden">
                                <div
                                  className={`absolute bottom-0 left-0 right-0 ${colors[level]} transition-all`}
                                  style={{ height: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-center text-xs mt-1 text-gray-400">L{level}</p>
                              <p className="text-center text-xs text-gray-600">{count}</p>
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
                              <span className="text-xs text-gray-500 w-24 truncate">{skill.skill}</span>
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#00A651] to-[#00A651] rounded-full"
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
                      className="w-full mt-4 py-2 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
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
    </PageShell>
  );
};

export default AgeGroupReportsPage;
