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
  Info,
  Users,
  Shield,
  Crosshair,
  Brain,
  Award
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

// Actual skill categories used in CoachAssessmentPage evaluations
const SKILL_CATEGORIES = [
  { id: 'ball-handling', name: 'Ball Handling', icon: Target },
  { id: 'passing-receiving', name: 'Passing & Receiving', icon: Users },
  { id: 'shooting', name: 'Shooting', icon: Crosshair },
  { id: 'footwork', name: 'Footwork', icon: TrendingUp },
  { id: 'defense', name: 'Defense', icon: Shield },
  { id: 'off-ball-movement', name: 'Off-Ball Movement', icon: Target },
  { id: 'team-play', name: 'Team Play', icon: Users },
  { id: 'basketball-iq', name: 'Basketball IQ', icon: Brain }
];

// Match assessment team-level metrics
const MATCH_METRICS = [
  { id: 'teamWork', name: 'Team Work' },
  { id: 'defense', name: 'Defense' },
  { id: 'ballMovement', name: 'Ball Movement' },
  { id: 'offense', name: 'Offense' },
  { id: 'shotSelection', name: 'Shot Selection' },
  { id: 'sportsmanship', name: 'Sportsmanship' }
];

const CurriculumAnalysisPage = () => {
  const { players, evaluations, matchAssessments } = useData();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'match'

  // Derive age groups from actual player data
  const ageGroups = useMemo(() => {
    const groups = new Set();
    players.forEach(p => {
      const ag = p.ageGroup || p.age_group;
      if (ag) groups.add(ag);
    });
    const sorted = Array.from(groups).sort();
    return [{ id: 'all', name: 'All Ages' }, ...sorted.map(g => ({ id: g, name: g }))];
  }, [players]);

  // Filter players by age group
  const filteredPlayers = useMemo(() => {
    if (selectedAgeGroup === 'all') return players;
    return players.filter(p => {
      const ag = p.ageGroup || p.age_group || '';
      return ag === selectedAgeGroup;
    });
  }, [players, selectedAgeGroup]);

  const filteredPlayerIds = useMemo(() => new Set(filteredPlayers.map(p => p.id)), [filteredPlayers]);

  // Calculate skill evaluation analysis
  const skillAnalysis = useMemo(() => {
    const evalValues = Object.values(evaluations || {});
    const filteredEvals = evalValues.filter(e => filteredPlayerIds.has(e.playerId));

    // Group by skillId
    const skillData = {};
    filteredEvals.forEach(e => {
      const sid = e.skillId;
      if (!sid) return;
      if (!skillData[sid]) {
        skillData[sid] = { players: new Set(), levels: [] };
      }
      skillData[sid].players.add(e.playerId);
      if (e.level && typeof e.level === 'number') {
        skillData[sid].levels.push(e.level);
      }
    });

    // Calculate per-category stats
    const categoryStats = SKILL_CATEGORIES.map(cat => {
      const data = skillData[cat.id];
      const avgLevel = data && data.levels.length > 0
        ? data.levels.reduce((a, b) => a + b, 0) / data.levels.length
        : 0;
      const coverageRate = filteredPlayers.length > 0 && data
        ? (data.players.size / filteredPlayers.length) * 100
        : 0;

      return {
        category: cat.name,
        categoryId: cat.id,
        icon: cat.icon,
        avgLevel: parseFloat(avgLevel.toFixed(1)),
        assessments: data ? data.levels.length : 0,
        playersAssessed: data ? data.players.size : 0,
        coverageRate: Math.round(coverageRate),
        isGap: avgLevel < 2.0 || coverageRate < 40,
        isStrength: avgLevel >= 3.0 && coverageRate >= 60
      };
    });

    const gaps = categoryStats.filter(c => c.isGap && c.assessments > 0);
    const strengths = categoryStats.filter(c => c.isStrength);
    const noData = categoryStats.every(c => c.assessments === 0);

    const radarData = categoryStats.map(c => ({
      skill: c.category.length > 12 ? c.category.slice(0, 10) + '...' : c.category,
      level: c.avgLevel,
      fullMark: 4
    }));

    return { categoryStats, gaps, strengths, radarData, totalEvals: filteredEvals.length, noData };
  }, [evaluations, filteredPlayers, filteredPlayerIds]);

  // Calculate match assessment analysis
  const matchAnalysis = useMemo(() => {
    if (!matchAssessments || matchAssessments.length === 0) {
      return { metricStats: [], noData: true };
    }

    // Filter by players in selected age group via the assessment's team/players
    const relevantAssessments = selectedAgeGroup === 'all'
      ? matchAssessments
      : matchAssessments.filter(ma => {
          // Check if any player in this assessment belongs to the age group
          if (ma.teamAgeGroup === selectedAgeGroup) return true;
          if (ma.ageGroup === selectedAgeGroup) return true;
          return false;
        });

    const metricStats = MATCH_METRICS.map(metric => {
      const values = [];
      relevantAssessments.forEach(ma => {
        const val = ma.teamMetrics?.[metric.id];
        if (val && typeof val === 'number') values.push(val);
      });
      const avg = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
      return {
        metric: metric.name,
        metricId: metric.id,
        avgScore: parseFloat(avg.toFixed(1)),
        assessments: values.length,
        isGap: avg > 0 && avg < 2.5,
        isStrength: avg >= 4.0
      };
    });

    const noData = metricStats.every(m => m.assessments === 0);

    return { metricStats, noData, totalAssessments: relevantAssessments.length };
  }, [matchAssessments, selectedAgeGroup]);

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

      {/* Tabs: Skills vs Match */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'skills'
              ? 'bg-[#005028] text-white'
              : 'bg-white text-gray-600 border border-[#D4E4D4] hover:bg-gray-50'
          }`}
        >
          Skill Evaluations
        </button>
        <button
          onClick={() => setActiveTab('match')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'match'
              ? 'bg-[#005028] text-white'
              : 'bg-white text-gray-600 border border-[#D4E4D4] hover:bg-gray-50'
          }`}
        >
          Match Assessments
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'skills' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 border border-[#D4E4D4]">
                <p className="text-2xl font-bold text-gray-800">{filteredPlayers.length}</p>
                <p className="text-xs text-[#6B7C6B]">Players</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#D4E4D4]">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="text-[#00A651]" size={14} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{skillAnalysis.strengths.length}</p>
                <p className="text-xs text-[#6B7C6B]">Strengths</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#D4E4D4]">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="text-yellow-500" size={14} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{skillAnalysis.gaps.length}</p>
                <p className="text-xs text-[#6B7C6B]">Gaps</p>
              </div>
            </div>

            {skillAnalysis.noData ? (
              <div className="bg-white rounded-xl p-8 text-center border border-[#D4E4D4]">
                <Info size={40} className="mx-auto mb-3 text-[#6B7C6B]" />
                <h3 className="font-bold text-gray-800 mb-2">No Evaluation Data</h3>
                <p className="text-sm text-[#6B7C6B]">
                  No skill evaluations found{selectedAgeGroup !== 'all' ? ` for ${selectedAgeGroup}` : ''}.
                  Coaches can submit evaluations from the Assess Skills page.
                </p>
              </div>
            ) : (
              <>
                {/* Radar Chart */}
                <div className="bg-white rounded-xl p-4 border border-[#D4E4D4]">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <BookOpen size={18} className="text-[#005028]" />
                    Skill Category Overview
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillAnalysis.radarData}>
                        <PolarGrid stroke="#D4E4D4" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#333', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#6B7C6B', fontSize: 10 }} />
                        <Radar
                          name="Average Level"
                          dataKey="level"
                          stroke="#00A651"
                          fill="#00A651"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2 text-xs text-[#6B7C6B]">
                    <span>1 = Emerging</span>
                    <span>2 = Developing</span>
                    <span>3 = Competent</span>
                    <span>4 = Leader</span>
                  </div>
                </div>

                {/* Toggle for gaps only */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Skill Categories</h3>
                  <button
                    onClick={() => setShowGapsOnly(!showGapsOnly)}
                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                      showGapsOnly ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {showGapsOnly ? 'Showing Gaps Only' : 'Show All'}
                  </button>
                </div>

                {/* Category Details */}
                <div className="space-y-3">
                  {skillAnalysis.categoryStats
                    .filter(cat => !showGapsOnly || cat.isGap)
                    .map(category => (
                      <div
                        key={category.categoryId}
                        className={`bg-white rounded-xl p-4 border border-[#D4E4D4] border-l-4 ${
                          category.isGap
                            ? 'border-l-yellow-500'
                            : category.isStrength
                            ? 'border-l-[#00A651]'
                            : 'border-l-[#D4E4D4]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {category.isGap ? (
                              <AlertTriangle className="text-yellow-500" size={20} />
                            ) : category.isStrength ? (
                              <CheckCircle className="text-[#00A651]" size={20} />
                            ) : (
                              <Target className="text-[#6B7C6B]" size={20} />
                            )}
                            <h4 className="font-bold text-gray-800">{category.category}</h4>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              category.isGap ? 'text-yellow-500' : category.isStrength ? 'text-[#00A651]' : 'text-gray-800'
                            }`}>
                              {category.assessments > 0 ? category.avgLevel : '—'}
                            </p>
                            <p className="text-xs text-[#6B7C6B]">avg level</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-[#6B7C6B] mb-1">Coverage Rate</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    category.coverageRate < 40 ? 'bg-yellow-500' : 'bg-[#005028]'
                                  }`}
                                  style={{ width: `${category.coverageRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-800">{category.coverageRate}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B7C6B] mb-1">Players Assessed</p>
                            <p className="text-sm font-medium text-gray-800">
                              {category.playersAssessed} / {filteredPlayers.length}
                            </p>
                          </div>
                        </div>

                        {category.isGap && category.assessments > 0 && (
                          <div className="bg-yellow-50 rounded-lg p-3 mt-3 border border-yellow-200">
                            <p className="text-xs text-yellow-700">
                              <Info size={12} className="inline mr-1" />
                              {category.avgLevel < 2.0
                                ? 'Low average level indicates need for focused training'
                                : 'Low coverage — more players need assessment in this area'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl p-4 border border-[#D4E4D4]">
                  <h3 className="font-bold mb-4 text-gray-800">Curriculum Recommendations</h3>
                  <div className="space-y-3">
                    {skillAnalysis.gaps.length > 0 ? (
                      skillAnalysis.gaps.map(gap => (
                        <div
                          key={gap.categoryId}
                          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <p className="text-sm text-yellow-700 font-medium mb-1">
                            Focus Area: {gap.category}
                          </p>
                          <p className="text-xs text-[#6B7C6B]">
                            {gap.avgLevel < 2.0
                              ? `Increase training time for ${gap.category.toLowerCase()} skills. Consider additional drills and exercises.`
                              : `Expand assessment coverage for ${gap.category.toLowerCase()}. Only ${gap.coverageRate}% of players assessed.`}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg">
                        <p className="text-sm text-[#00A651]">
                          All skill areas are well covered with good progress!
                        </p>
                      </div>
                    )}

                    {skillAnalysis.strengths.length > 0 && (
                      <div className="p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg">
                        <p className="text-sm text-[#00A651] font-medium mb-1">
                          Club Strengths
                        </p>
                        <p className="text-xs text-[#6B7C6B]">
                          Strong performance in: {skillAnalysis.strengths.map(s => s.category).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          /* Match Assessments Tab */
          <>
            {matchAnalysis.noData ? (
              <div className="bg-white rounded-xl p-8 text-center border border-[#D4E4D4]">
                <Info size={40} className="mx-auto mb-3 text-[#6B7C6B]" />
                <h3 className="font-bold text-gray-800 mb-2">No Match Assessment Data</h3>
                <p className="text-sm text-[#6B7C6B]">
                  No match day assessments found{selectedAgeGroup !== 'all' ? ` for ${selectedAgeGroup}` : ''}.
                  Coaches submit these during Match Day.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl p-4 border border-[#D4E4D4]">
                  <p className="text-sm text-[#6B7C6B] mb-1">Total Match Assessments</p>
                  <p className="text-2xl font-bold text-gray-800">{matchAnalysis.totalAssessments}</p>
                </div>

                {/* Match Metrics Bar Chart */}
                <div className="bg-white rounded-xl p-4 border border-[#D4E4D4]">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Award size={18} className="text-[#005028]" />
                    Team Performance Metrics
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={matchAnalysis.metricStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                        <XAxis type="number" domain={[0, 5]} tick={{ fill: '#6B7C6B', fontSize: 11 }} />
                        <YAxis dataKey="metric" type="category" width={100} tick={{ fill: '#333', fontSize: 11 }} />
                        <Tooltip
                          formatter={(value) => [`${value} / 5`, 'Avg Score']}
                          contentStyle={{ borderColor: '#D4E4D4', borderRadius: '8px' }}
                        />
                        <Bar dataKey="avgScore" fill="#00A651" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Match Metric Cards */}
                <div className="space-y-3">
                  {matchAnalysis.metricStats.map(m => (
                    <div
                      key={m.metricId}
                      className={`bg-white rounded-xl p-4 border border-[#D4E4D4] border-l-4 ${
                        m.isGap ? 'border-l-yellow-500'
                          : m.isStrength ? 'border-l-[#00A651]'
                          : 'border-l-[#D4E4D4]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {m.isGap ? (
                            <AlertTriangle className="text-yellow-500" size={18} />
                          ) : m.isStrength ? (
                            <CheckCircle className="text-[#00A651]" size={18} />
                          ) : (
                            <Target className="text-[#6B7C6B]" size={18} />
                          )}
                          <div>
                            <h4 className="font-bold text-gray-800">{m.metric}</h4>
                            <p className="text-xs text-[#6B7C6B]">{m.assessments} assessments</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            m.isGap ? 'text-yellow-500' : m.isStrength ? 'text-[#00A651]' : 'text-gray-800'
                          }`}>
                            {m.assessments > 0 ? m.avgScore : '—'}
                          </p>
                          <p className="text-xs text-[#6B7C6B]">/ 5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
};

export default CurriculumAnalysisPage;
