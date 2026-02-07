import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const CurriculumAnalysisPage = () => {
  const navigate = useNavigate();
  const { players, evaluations, skills: skillsData } = useData();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [showGapsOnly, setShowGapsOnly] = useState(false);

  // Define skill categories
  const skillCategories = [
    { id: 'ballHandling', name: 'Ball Handling', skills: ['dribbling', 'ball_control', 'crossover'] },
    { id: 'shooting', name: 'Shooting', skills: ['layups', 'free_throws', 'jump_shot', 'three_point'] },
    { id: 'passing', name: 'Passing', skills: ['chest_pass', 'bounce_pass', 'overhead_pass'] },
    { id: 'defense', name: 'Defense', skills: ['defensive_stance', 'footwork', 'help_defense'] },
    { id: 'rebounding', name: 'Rebounding', skills: ['boxing_out', 'positioning'] },
    { id: 'teamPlay', name: 'Team Play', skills: ['court_vision', 'spacing', 'communication'] },
    { id: 'athleticism', name: 'Athleticism', skills: ['speed', 'agility', 'vertical'] },
    { id: 'basketball_iq', name: 'Basketball IQ', skills: ['decision_making', 'play_reading'] }
  ];

  // Age groups
  const ageGroups = [
    { id: 'all', name: 'All Ages' },
    { id: 'u8', name: 'Under 8' },
    { id: 'u10', name: 'Under 10' },
    { id: 'u12', name: 'Under 12' },
    { id: 'u14', name: 'Under 14' },
    { id: 'u16', name: 'Under 16' },
    { id: 'u18', name: 'Under 18' }
  ];

  // Calculate curriculum analysis
  const analysis = useMemo(() => {
    // Filter players by age group
    const filteredPlayers = selectedAgeGroup === 'all'
      ? players
      : players.filter(p => {
          const team = (p.team || '').toUpperCase();
          return team.includes(selectedAgeGroup.toUpperCase());
        });

    // Get evaluations for filtered players
    const filteredEvals = Object.values(evaluations || {}).filter(e =>
      filteredPlayers.some(p => p.id === e.playerId)
    );

    // Calculate skill coverage
    const skillCoverage = {};
    const skillLevels = {};

    filteredEvals.forEach(e => {
      const skillId = e.skillId?.toLowerCase().replace(/\s+/g, '_');
      if (!skillId) return;

      if (!skillCoverage[skillId]) {
        skillCoverage[skillId] = new Set();
        skillLevels[skillId] = [];
      }

      skillCoverage[skillId].add(e.playerId);
      if (e.level) {
        skillLevels[skillId].push(e.level);
      }
    });

    // Calculate category averages
    const categoryStats = skillCategories.map(category => {
      let totalAssessments = 0;
      let totalLevels = 0;
      let levelCount = 0;

      category.skills.forEach(skill => {
        if (skillLevels[skill]) {
          totalAssessments += skillLevels[skill].length;
          skillLevels[skill].forEach(level => {
            totalLevels += level;
            levelCount++;
          });
        }
      });

      const avgLevel = levelCount > 0 ? totalLevels / levelCount : 0;
      const coverageRate = filteredPlayers.length > 0
        ? (new Set(category.skills.flatMap(s => Array.from(skillCoverage[s] || []))).size / filteredPlayers.length) * 100
        : 0;

      return {
        category: category.name,
        categoryId: category.id,
        avgLevel: parseFloat(avgLevel.toFixed(1)),
        assessments: totalAssessments,
        coverageRate: Math.round(coverageRate),
        isGap: avgLevel < 2.5 || coverageRate < 50
      };
    });

    // Identify gaps
    const gaps = categoryStats.filter(c => c.isGap);

    // Strengths
    const strengths = categoryStats.filter(c => c.avgLevel >= 3.5 && c.coverageRate >= 70);

    // Radar chart data
    const radarData = categoryStats.map(c => ({
      skill: c.category,
      level: c.avgLevel,
      fullMark: 5
    }));

    return {
      categoryStats,
      gaps,
      strengths,
      radarData,
      totalPlayers: filteredPlayers.length,
      totalAssessments: filteredEvals.length
    };
  }, [players, evaluations, selectedAgeGroup]);

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
            <h1 className="text-xl font-bold">Curriculum Analysis</h1>
            <p className="text-white/60 text-sm">Skills progression and gaps</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="text-white">Curriculum Analysis</span>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4">
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
      </div>

      <div className="px-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d5943] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-[#4ade80]" size={18} />
              <span className="text-white/60 text-sm">Strengths</span>
            </div>
            <p className="text-2xl font-bold">{analysis.strengths.length}</p>
            <p className="text-xs text-white/50">skill areas</p>
          </div>
          <div className="bg-[#0d5943] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-yellow-400" size={18} />
              <span className="text-white/60 text-sm">Development Gaps</span>
            </div>
            <p className="text-2xl font-bold">{analysis.gaps.length}</p>
            <p className="text-xs text-white/50">areas to improve</p>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BookOpen size={18} />
            Skill Category Overview
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysis.radarData}>
                <PolarGrid stroke="#1a8a68" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#fff', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#fff', fontSize: 10 }} />
                <Radar
                  name="Average Level"
                  dataKey="level"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Toggle for gaps only */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Skill Categories</h3>
          <button
            onClick={() => setShowGapsOnly(!showGapsOnly)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              showGapsOnly ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/70'
            }`}
          >
            {showGapsOnly ? 'Showing Gaps Only' : 'Show All'}
          </button>
        </div>

        {/* Category Details */}
        <div className="space-y-3">
          {analysis.categoryStats
            .filter(cat => !showGapsOnly || cat.isGap)
            .map(category => (
              <div
                key={category.categoryId}
                className={`bg-[#0d5943] rounded-xl p-4 border-l-4 ${
                  category.isGap
                    ? 'border-yellow-500'
                    : category.avgLevel >= 3.5
                    ? 'border-[#22c55e]'
                    : 'border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {category.isGap ? (
                      <AlertTriangle className="text-yellow-400" size={20} />
                    ) : category.avgLevel >= 3.5 ? (
                      <CheckCircle className="text-[#4ade80]" size={20} />
                    ) : (
                      <Target className="text-white/50" size={20} />
                    )}
                    <h4 className="font-bold">{category.category}</h4>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      category.isGap ? 'text-yellow-400' : 'text-[#4ade80]'
                    }`}>
                      {category.avgLevel}
                    </p>
                    <p className="text-xs text-white/50">avg level</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-white/50 mb-1">Coverage Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            category.coverageRate < 50 ? 'bg-yellow-500' : 'bg-[#22c55e]'
                          }`}
                          style={{ width: `${category.coverageRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{category.coverageRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-1">Assessments</p>
                    <p className="text-sm font-medium">{category.assessments}</p>
                  </div>
                </div>

                {category.isGap && (
                  <div className="bg-yellow-500/10 rounded-lg p-3 mt-3">
                    <p className="text-xs text-yellow-400">
                      <Info size={12} className="inline mr-1" />
                      {category.avgLevel < 2.5
                        ? 'Low average level indicates need for focused training'
                        : 'Low coverage - more players need assessment in this area'}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Recommendations */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4">Curriculum Recommendations</h3>
          <div className="space-y-3">
            {analysis.gaps.length > 0 ? (
              analysis.gaps.map(gap => (
                <div
                  key={gap.categoryId}
                  className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                >
                  <p className="text-sm text-yellow-400 font-medium mb-1">
                    Focus Area: {gap.category}
                  </p>
                  <p className="text-xs text-white/60">
                    {gap.avgLevel < 2.5
                      ? `Increase training time for ${gap.category.toLowerCase()} skills. Consider additional drills and exercises.`
                      : `Expand assessment coverage for ${gap.category.toLowerCase()}. Only ${gap.coverageRate}% of players assessed.`}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
                <p className="text-sm text-[#4ade80]">
                  All skill areas are well covered with good progress!
                </p>
              </div>
            )}

            {analysis.strengths.length > 0 && (
              <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
                <p className="text-sm text-[#4ade80] font-medium mb-1">
                  Club Strengths
                </p>
                <p className="text-xs text-white/60">
                  Strong performance in: {analysis.strengths.map(s => s.category).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumAnalysisPage;
