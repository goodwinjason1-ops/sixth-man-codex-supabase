import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Trophy,
  Star,
  Download,
  FileText,
  BarChart3,
  AlertCircle
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
  Radar,
  Legend,
  LineChart,
  Line
} from 'recharts';

// Age group definitions
const AGE_GROUP_CONFIG = {
  u8: { name: 'Under 8', minAge: 5, maxAge: 8 },
  u10: { name: 'Under 10', minAge: 8, maxAge: 10 },
  u12: { name: 'Under 12', minAge: 10, maxAge: 12 },
  u14: { name: 'Under 14', minAge: 12, maxAge: 14 },
  u16: { name: 'Under 16', minAge: 14, maxAge: 16 },
  u18: { name: 'Under 18', minAge: 16, maxAge: 18 }
};

const AgeGroupDetailReportPage = () => {
  const navigate = useNavigate();
  const { ageGroupId } = useParams();
  const { players, evaluations, teams } = useData();
  const [exporting, setExporting] = useState(false);

  const ageGroupConfig = AGE_GROUP_CONFIG[ageGroupId] || { name: ageGroupId?.toUpperCase() || 'Unknown' };

  // Get players in this age group
  const ageGroupPlayers = useMemo(() => {
    return (players || []).filter(p => {
      const team = (p.team || '').toUpperCase();
      return team.includes(ageGroupId?.toUpperCase() || '');
    });
  }, [players, ageGroupId]);

  // Get teams in this age group
  const ageGroupTeams = useMemo(() => {
    const teamNames = [...new Set(ageGroupPlayers.map(p => p.team))].filter(Boolean);
    return teamNames.map(teamName => {
      const teamPlayers = ageGroupPlayers.filter(p => p.team === teamName);
      const teamEvals = Object.values(evaluations || {}).filter(e =>
        teamPlayers.some(p => p.id === e.playerId)
      );
      const avgLevel = teamEvals.length > 0
        ? teamEvals.reduce((sum, e) => sum + (e.level || 0), 0) / teamEvals.length
        : 0;

      return {
        name: teamName,
        playerCount: teamPlayers.length,
        assessmentCount: teamEvals.length,
        avgLevel: avgLevel.toFixed(1)
      };
    });
  }, [ageGroupPlayers, evaluations]);

  // Get evaluations for this age group
  const ageGroupEvals = useMemo(() => {
    return Object.values(evaluations || {}).filter(e =>
      ageGroupPlayers.some(p => p.id === e.playerId)
    );
  }, [ageGroupPlayers, evaluations]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const skillLevels = {};
    ageGroupEvals.forEach(e => {
      if (!skillLevels[e.skillId]) {
        skillLevels[e.skillId] = [];
      }
      if (e.level) {
        skillLevels[e.skillId].push(e.level);
      }
    });

    const skillAverages = Object.entries(skillLevels).map(([skillId, levels]) => ({
      skill: skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      skillId,
      avg: levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 0,
      count: levels.length
    })).sort((a, b) => b.avg - a.avg);

    const allLevels = Object.values(skillLevels).flat();
    const avgLevel = allLevels.length > 0
      ? allLevels.reduce((a, b) => a + b, 0) / allLevels.length
      : 0;

    // Level distribution
    const levelDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ageGroupEvals.forEach(e => {
      if (e.level >= 1 && e.level <= 5) {
        levelDist[Math.round(e.level)]++;
      }
    });

    return {
      playerCount: ageGroupPlayers.length,
      teamCount: ageGroupTeams.length,
      assessmentCount: ageGroupEvals.length,
      playersAssessed: new Set(ageGroupEvals.map(e => e.playerId)).size,
      avgLevel: avgLevel.toFixed(1),
      skillAverages,
      levelDistribution: levelDist
    };
  }, [ageGroupPlayers, ageGroupTeams, ageGroupEvals]);

  // Top performers
  const topPerformers = useMemo(() => {
    const playerStats = {};
    ageGroupEvals.forEach(e => {
      if (!playerStats[e.playerId]) {
        playerStats[e.playerId] = { levels: [], count: 0 };
      }
      if (e.level) {
        playerStats[e.playerId].levels.push(e.level);
        playerStats[e.playerId].count++;
      }
    });

    return Object.entries(playerStats)
      .map(([playerId, data]) => {
        const player = ageGroupPlayers.find(p => p.id === playerId);
        const avgLevel = data.levels.length > 0
          ? data.levels.reduce((a, b) => a + b, 0) / data.levels.length
          : 0;
        return {
          playerId,
          name: player?.name || 'Unknown',
          team: player?.team || '',
          avgLevel: avgLevel.toFixed(1),
          assessments: data.count
        };
      })
      .sort((a, b) => parseFloat(b.avgLevel) - parseFloat(a.avgLevel))
      .slice(0, 10);
  }, [ageGroupEvals, ageGroupPlayers]);

  // Skills gaps analysis
  const skillsGaps = useMemo(() => {
    const gaps = stats.skillAverages
      .filter(s => s.avg < 3.0)
      .map(s => ({
        ...s,
        gap: 3.0 - s.avg,
        recommendation: s.avg < 2.0
          ? 'Critical - Requires immediate focus'
          : 'Moderate - Include in training plans'
      }));
    return gaps;
  }, [stats.skillAverages]);

  // Team comparison data for chart
  const teamComparisonData = useMemo(() => {
    return ageGroupTeams.map(team => ({
      name: team.name,
      avgLevel: parseFloat(team.avgLevel),
      players: team.playerCount,
      assessments: team.assessmentCount
    }));
  }, [ageGroupTeams]);

  // Radar chart data for skills
  const radarData = useMemo(() => {
    return stats.skillAverages.slice(0, 8).map(s => ({
      skill: s.skill.length > 10 ? s.skill.substring(0, 10) + '...' : s.skill,
      level: parseFloat(s.avg.toFixed(1)),
      fullMark: 5
    }));
  }, [stats.skillAverages]);

  // Export to CSV
  const exportToCSV = () => {
    setExporting(true);

    // Build CSV content
    const headers = ['Category', 'Metric', 'Value'];
    const rows = [
      ['Overview', 'Age Group', ageGroupConfig.name],
      ['Overview', 'Total Players', stats.playerCount],
      ['Overview', 'Total Teams', stats.teamCount],
      ['Overview', 'Total Assessments', stats.assessmentCount],
      ['Overview', 'Players Assessed', stats.playersAssessed],
      ['Overview', 'Average Level', stats.avgLevel],
      '',
      ['Teams', 'Team Name', 'Players', 'Assessments', 'Avg Level'].join(','),
      ...ageGroupTeams.map(t => ['', t.name, t.playerCount, t.assessmentCount, t.avgLevel].join(',')),
      '',
      ['Top Performers', 'Name', 'Team', 'Avg Level', 'Assessments'].join(','),
      ...topPerformers.map(p => ['', p.name, p.team, p.avgLevel, p.assessments].join(',')),
      '',
      ['Skills', 'Skill Name', 'Average Level', 'Assessment Count'].join(','),
      ...stats.skillAverages.map(s => ['', s.skill, s.avg.toFixed(1), s.count].join(','))
    ];

    const csvContent = rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ageGroupId}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setExporting(false), 1000);
  };

  // Print report (PDF via browser)
  const printReport = () => {
    window.print();
  };

  if (!ageGroupId || !AGE_GROUP_CONFIG[ageGroupId]) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-yellow-400" size={48} />
          <h2 className="text-xl font-bold mb-2">Age Group Not Found</h2>
          <p className="text-white/60 mb-4">The requested age group report does not exist.</p>
          <button
            onClick={() => navigate('/admin/age-groups')}
            className="px-4 py-2 bg-[#22c55e] rounded-lg font-medium"
          >
            Back to Age Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a3d2e] text-white pb-20 print:bg-white print:text-black">
      {/* Header */}
      <div className="bg-[#0d5943] px-4 py-4 sticky top-0 z-10 print:bg-white print:border-b print:border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/age-groups')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors print:hidden"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold print:text-2xl print:text-black">{ageGroupConfig.name} Report</h1>
              <p className="text-white/60 text-sm print:text-gray-600">Comprehensive age group analysis</p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={exportToCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'CSV'}
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-3 py-2 bg-[#22c55e] hover:bg-[#1a8a68] rounded-lg text-sm transition-colors"
            >
              <FileText size={16} />
              Print/PDF
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2 print:hidden">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin/age-groups')}>Age Groups</span>
        <ChevronRight size={14} />
        <span className="text-white">{ageGroupConfig.name}</span>
      </div>

      <div className="px-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#0d5943] rounded-xl p-4 text-center print:border print:border-gray-300 print:bg-white">
            <Users className="mx-auto mb-2 text-blue-400 print:text-blue-600" size={24} />
            <p className="text-2xl font-bold">{stats.playerCount}</p>
            <p className="text-xs text-white/60 print:text-gray-600">Total Players</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center print:border print:border-gray-300 print:bg-white">
            <Trophy className="mx-auto mb-2 text-purple-400 print:text-purple-600" size={24} />
            <p className="text-2xl font-bold">{stats.teamCount}</p>
            <p className="text-xs text-white/60 print:text-gray-600">Teams</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center print:border print:border-gray-300 print:bg-white">
            <Target className="mx-auto mb-2 text-green-400 print:text-green-600" size={24} />
            <p className="text-2xl font-bold">{stats.assessmentCount}</p>
            <p className="text-xs text-white/60 print:text-gray-600">Assessments</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center print:border print:border-gray-300 print:bg-white">
            <Users className="mx-auto mb-2 text-yellow-400 print:text-yellow-600" size={24} />
            <p className="text-2xl font-bold">{stats.playersAssessed}</p>
            <p className="text-xs text-white/60 print:text-gray-600">Players Assessed</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center print:border print:border-gray-300 print:bg-white">
            <Award className="mx-auto mb-2 text-[#4ade80] print:text-green-600" size={24} />
            <p className="text-2xl font-bold text-[#4ade80] print:text-green-600">{stats.avgLevel}</p>
            <p className="text-xs text-white/60 print:text-gray-600">Avg Level</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4 text-center print:border print:border-gray-300 print:bg-white">
            <BarChart3 className="mx-auto mb-2 text-orange-400 print:text-orange-600" size={24} />
            <p className="text-2xl font-bold">{stats.skillAverages.length}</p>
            <p className="text-xs text-white/60 print:text-gray-600">Skills Tracked</p>
          </div>
        </div>

        {/* Team Comparison */}
        <div className="bg-[#0d5943] rounded-xl p-4 print:border print:border-gray-300 print:bg-white">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-[#4ade80] print:text-green-600" />
            Team Comparison
          </h3>
          {teamComparisonData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a8a68" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fill: '#fff', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#fff', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d5943', border: '1px solid #1a8a68', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="avgLevel" name="Avg Level" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-white/60 text-center py-8">No team data available</p>
          )}

          {/* Teams Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20 print:border-gray-300">
                  <th className="text-left py-2 text-white/60 print:text-gray-600">Team</th>
                  <th className="text-center py-2 text-white/60 print:text-gray-600">Players</th>
                  <th className="text-center py-2 text-white/60 print:text-gray-600">Assessments</th>
                  <th className="text-center py-2 text-white/60 print:text-gray-600">Avg Level</th>
                </tr>
              </thead>
              <tbody>
                {ageGroupTeams.map(team => (
                  <tr key={team.name} className="border-b border-white/10 print:border-gray-200">
                    <td className="py-2 font-medium">{team.name}</td>
                    <td className="py-2 text-center">{team.playerCount}</td>
                    <td className="py-2 text-center">{team.assessmentCount}</td>
                    <td className="py-2 text-center text-[#4ade80] print:text-green-600 font-bold">{team.avgLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skills Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Skills Radar */}
          <div className="bg-[#0d5943] rounded-xl p-4 print:border print:border-gray-300 print:bg-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Target size={18} className="text-[#4ade80] print:text-green-600" />
              Skills Overview
            </h3>
            {radarData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1a8a68" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#fff', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#fff', fontSize: 10 }} />
                    <Radar
                      name="Avg Level"
                      dataKey="level"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d5943', border: '1px solid #1a8a68', borderRadius: '8px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-white/60 text-center py-8">No skills data available</p>
            )}
          </div>

          {/* Skills Gaps */}
          <div className="bg-[#0d5943] rounded-xl p-4 print:border print:border-gray-300 print:bg-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingDown size={18} className="text-red-400 print:text-red-600" />
              Skills Gaps Analysis
            </h3>
            {skillsGaps.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {skillsGaps.map(gap => (
                  <div key={gap.skillId} className="bg-white/5 rounded-lg p-3 print:border print:border-gray-200 print:bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{gap.skill}</span>
                      <span className={`text-sm font-bold ${gap.avg < 2 ? 'text-red-400' : 'text-yellow-400'} print:text-red-600`}>
                        {gap.avg.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden print:bg-gray-200">
                      <div
                        className={`h-full rounded-full ${gap.avg < 2 ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${(gap.avg / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1 print:text-gray-600">{gap.recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto mb-2 text-[#4ade80]" size={32} />
                <p className="text-[#4ade80] font-medium">No significant skill gaps!</p>
                <p className="text-white/60 text-sm">All skills are at or above target levels.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-[#0d5943] rounded-xl p-4 print:border print:border-gray-300 print:bg-white">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Star size={18} className="text-yellow-400 print:text-yellow-600" />
            Top Performers
          </h3>
          {topPerformers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20 print:border-gray-300">
                    <th className="text-left py-2 text-white/60 print:text-gray-600">Rank</th>
                    <th className="text-left py-2 text-white/60 print:text-gray-600">Player</th>
                    <th className="text-left py-2 text-white/60 print:text-gray-600">Team</th>
                    <th className="text-center py-2 text-white/60 print:text-gray-600">Avg Level</th>
                    <th className="text-center py-2 text-white/60 print:text-gray-600">Assessments</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((player, index) => (
                    <tr key={player.playerId} className="border-b border-white/10 print:border-gray-200">
                      <td className="py-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-white/10 text-white/70'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-2 font-medium">{player.name}</td>
                      <td className="py-2 text-white/70 print:text-gray-600">{player.team}</td>
                      <td className="py-2 text-center text-[#4ade80] print:text-green-600 font-bold">{player.avgLevel}</td>
                      <td className="py-2 text-center">{player.assessments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-white/60 text-center py-8">No performer data available</p>
          )}
        </div>

        {/* Level Distribution */}
        <div className="bg-[#0d5943] rounded-xl p-4 print:border print:border-gray-300 print:bg-white">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#4ade80] print:text-green-600" />
            Level Distribution
          </h3>
          <div className="flex gap-4 items-end h-32">
            {[1, 2, 3, 4, 5].map(level => {
              const count = stats.levelDistribution[level] || 0;
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
                <div key={level} className="flex-1 flex flex-col items-center">
                  <span className="text-sm font-bold mb-1">{count}</span>
                  <div className="w-full bg-white/10 rounded-t-lg relative print:bg-gray-200" style={{ height: '80px' }}>
                    <div
                      className={`absolute bottom-0 left-0 right-0 ${colors[level]} rounded-t-lg transition-all`}
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs mt-2 text-white/60 print:text-gray-600">Level {level}</span>
                  <span className="text-xs text-white/40 print:text-gray-500">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center print:hidden">
          <button
            onClick={() => navigate('/admin/age-groups')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
          >
            Back to Age Group Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeGroupDetailReportPage;
