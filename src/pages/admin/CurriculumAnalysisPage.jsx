import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import {
  BookOpen,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Info
} from 'lucide-react';
import PageShell from '../../components/PageShell';
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
    <PageShell
      title="Curriculum Analysis"
      subtitle="Skills development tracking"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Curriculum Analysis' }
      ]}
    >
      {/* Filters */}
      <div className="mb-4">
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
      </div>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-[#00A651]" size={18} />
              <span className="text-gray-500 text-sm">Strengths</span>
            </div>
            <p className="text-2xl font-bold">{analysis.strengths.length}</p>
            <p className="text-xs text-gray-400">skill areas</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-yellow-400" size={18} />
              <span className="text-gray-500 text-sm">Development Gaps</span>
            </div>
            <p className="text-2xl font-bold">{analysis.gaps.length}</p>
            <p className="text-xs text-gray-400">areas to improve</p>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BookOpen size={18} />
            Skill Category Overview
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysis.radarData}>
                <PolarGrid stroke="#D4E4D4" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#fff', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#fff', fontSize: 10 }} />
                <Radar
                  name="Average Level"
                  dataKey="level"
                  stroke="#00A651"
                  fill="#00A651"
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
              showGapsOnly ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-100 text-gray-600'
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
                className={`bg-white rounded-xl p-4 border-l-4 ${
                  category.isGap
                    ? 'border-yellow-500'
                    : category.avgLevel >= 3.5
                    ? 'border-[#00A651]'
                    : 'border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {category.isGap ? (
                      <AlertTriangle className="text-yellow-400" size={20} />
                    ) : category.avgLevel >= 3.5 ? (
                      <CheckCircle className="text-[#00A651]" size={20} />
                    ) : (
                      <Target className="text-gray-400" size={20} />
                    )}
                    <h4 className="font-bold">{category.category}</h4>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      category.isGap ? 'text-yellow-400' : 'text-[#00A651]'
                    }`}>
                      {category.avgLevel}
                    </p>
                    <p className="text-xs text-gray-400">avg level</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Coverage Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            category.coverageRate < 50 ? 'bg-yellow-500' : 'bg-[#005028]'
                          }`}
                          style={{ width: `${category.coverageRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{category.coverageRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Assessments</p>
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
        <div className="bg-white rounded-xl p-4">
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
                  <p className="text-xs text-gray-500">
                    {gap.avgLevel < 2.5
                      ? `Increase training time for ${gap.category.toLowerCase()} skills. Consider additional drills and exercises.`
                      : `Expand assessment coverage for ${gap.category.toLowerCase()}. Only ${gap.coverageRate}% of players assessed.`}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-[#005028]/10 border border-[#00A651]/30 rounded-lg">
                <p className="text-sm text-[#00A651]">
                  All skill areas are well covered with good progress!
                </p>
              </div>
            )}

            {analysis.strengths.length > 0 && (
              <div className="p-3 bg-[#005028]/10 border border-[#00A651]/30 rounded-lg">
                <p className="text-sm text-[#00A651] font-medium mb-1">
                  Club Strengths
                </p>
                <p className="text-xs text-gray-500">
                  Strong performance in: {analysis.strengths.map(s => s.category).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default CurriculumAnalysisPage;
