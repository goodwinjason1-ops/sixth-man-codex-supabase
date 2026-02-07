import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';

const ClubAnalyticsPage = () => {
  const navigate = useNavigate();
  const { players, evaluations, teams } = useData();
  const [timeRange, setTimeRange] = useState('month');

  // Calculate comprehensive club analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };
    const daysBack = ranges[timeRange];
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Filter evaluations by time range
    const recentEvals = Object.values(evaluations || {}).filter(e =>
      new Date(e.date || e.createdAt) > cutoffDate
    );

    // Previous period for comparison
    const prevCutoff = new Date(cutoffDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const prevEvals = Object.values(evaluations || {}).filter(e => {
      const date = new Date(e.date || e.createdAt);
      return date > prevCutoff && date <= cutoffDate;
    });

    // Assessment trend data
    const trendData = [];
    const dayGroups = timeRange === 'week' ? 7 : timeRange === 'month' ? 4 : 6;
    const dayInterval = Math.floor(daysBack / dayGroups);

    for (let i = dayGroups - 1; i >= 0; i--) {
      const periodStart = new Date(now.getTime() - (i + 1) * dayInterval * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() - i * dayInterval * 24 * 60 * 60 * 1000);

      const periodEvals = Object.values(evaluations || {}).filter(e => {
        const date = new Date(e.date || e.createdAt);
        return date > periodStart && date <= periodEnd;
      });

      const label = timeRange === 'week'
        ? periodEnd.toLocaleDateString('en-AU', { weekday: 'short' })
        : timeRange === 'month'
        ? `Week ${dayGroups - i}`
        : periodEnd.toLocaleDateString('en-AU', { month: 'short' });

      trendData.push({
        period: label,
        assessments: periodEvals.length,
        avgLevel: periodEvals.length > 0
          ? (periodEvals.reduce((sum, e) => sum + (e.level || 0), 0) / periodEvals.length).toFixed(1)
          : 0
      });
    }

    // Skill distribution
    const skillCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    recentEvals.forEach(e => {
      if (e.level >= 1 && e.level <= 5) {
        skillCounts[Math.round(e.level)]++;
      }
    });

    const skillDistribution = [
      { name: 'Emerging', value: skillCounts[1], color: '#ef4444' },
      { name: 'Developing', value: skillCounts[2], color: '#f97316' },
      { name: 'Competent', value: skillCounts[3], color: '#eab308' },
      { name: 'Proficient', value: skillCounts[4], color: '#22c55e' },
      { name: 'Elite', value: skillCounts[5], color: '#86efac' }
    ];

    // Team comparison
    const teamStats = {};
    const teamList = teams?.length ? teams : [...new Set(players.map(p => p.team))].filter(Boolean);

    teamList.forEach(team => {
      const teamName = team.name || team;
      const teamPlayers = players.filter(p => p.team === teamName);
      const teamEvals = recentEvals.filter(e =>
        teamPlayers.some(p => p.id === e.playerId)
      );

      teamStats[teamName] = {
        players: teamPlayers.length,
        assessments: teamEvals.length,
        avgLevel: teamEvals.length > 0
          ? (teamEvals.reduce((sum, e) => sum + (e.level || 0), 0) / teamEvals.length).toFixed(1)
          : 0
      };
    });

    const teamComparison = Object.entries(teamStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => parseFloat(b.avgLevel) - parseFloat(a.avgLevel));

    // Calculate changes
    const currentAvg = recentEvals.length > 0
      ? recentEvals.reduce((sum, e) => sum + (e.level || 0), 0) / recentEvals.length
      : 0;
    const prevAvg = prevEvals.length > 0
      ? prevEvals.reduce((sum, e) => sum + (e.level || 0), 0) / prevEvals.length
      : 0;

    return {
      totalPlayers: players?.length || 0,
      totalAssessments: recentEvals.length,
      prevAssessments: prevEvals.length,
      avgLevel: currentAvg.toFixed(1),
      prevAvgLevel: prevAvg.toFixed(1),
      levelChange: (currentAvg - prevAvg).toFixed(2),
      assessmentChange: recentEvals.length - prevEvals.length,
      trendData,
      skillDistribution,
      teamComparison,
      uniquePlayersAssessed: new Set(recentEvals.map(e => e.playerId)).size
    };
  }, [players, evaluations, teams, timeRange]);

  const getChangeIndicator = (change) => {
    const num = parseFloat(change);
    if (num > 0) return { icon: ArrowUpRight, color: 'text-[#4ade80]', text: `+${change}` };
    if (num < 0) return { icon: ArrowDownRight, color: 'text-red-400', text: change };
    return { icon: Minus, color: 'text-white/50', text: '0' };
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
            <h1 className="text-xl font-bold">Club Analytics</h1>
            <p className="text-white/60 text-sm">Performance metrics and insights</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 text-sm text-white/60 flex items-center gap-2">
        <span className="hover:text-white cursor-pointer" onClick={() => navigate('/admin')}>Admin</span>
        <ChevronRight size={14} />
        <span className="text-white">Club Analytics</span>
      </div>

      {/* Time Range Selector */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {[
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'quarter', label: 'Quarter' },
            { id: 'year', label: 'Year' }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range.id
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon={Target}
            label="Assessments"
            value={analytics.totalAssessments}
            change={getChangeIndicator(analytics.assessmentChange)}
            subtext={`vs previous ${timeRange}`}
          />
          <MetricCard
            icon={Award}
            label="Avg Skill Level"
            value={analytics.avgLevel}
            change={getChangeIndicator(analytics.levelChange)}
            subtext="out of 5"
          />
          <MetricCard
            icon={Users}
            label="Players Assessed"
            value={analytics.uniquePlayersAssessed}
            subtext={`of ${analytics.totalPlayers} total`}
          />
          <MetricCard
            icon={Activity}
            label="Assessment Rate"
            value={`${analytics.totalPlayers > 0 ? Math.round((analytics.uniquePlayersAssessed / analytics.totalPlayers) * 100) : 0}%`}
            subtext="player coverage"
          />
        </div>

        {/* Assessment Trend Chart */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            Assessment Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a8a68" />
                <XAxis dataKey="period" stroke="#fff" fontSize={12} />
                <YAxis stroke="#fff" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d5943', border: '1px solid #1a8a68', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="assessments" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Level Distribution */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <PieChart size={18} />
            Skill Level Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={analytics.skillDistribution.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.skillDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d5943', border: '1px solid #1a8a68', borderRadius: '8px' }}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Comparison */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Users size={18} />
            Team Performance Comparison
          </h3>
          {analytics.teamComparison.length > 0 ? (
            <div className="space-y-3">
              {analytics.teamComparison.slice(0, 8).map((team, index) => (
                <div key={team.name} className="flex items-center gap-3">
                  <span className="w-6 text-center text-white/50 text-sm">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{team.name}</span>
                      <span className="text-[#4ade80] font-bold">{team.avgLevel}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] rounded-full"
                        style={{ width: `${(parseFloat(team.avgLevel) / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>{team.players} players</span>
                      <span>{team.assessments} assessments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-white/50 py-8">No team data available</p>
          )}
        </div>

        {/* Quick Insights */}
        <div className="bg-[#0d5943] rounded-xl p-4">
          <h3 className="font-bold mb-4">Quick Insights</h3>
          <div className="space-y-3">
            <InsightItem
              type="positive"
              text={`${analytics.uniquePlayersAssessed} players assessed this ${timeRange}`}
            />
            {parseFloat(analytics.levelChange) > 0 && (
              <InsightItem
                type="positive"
                text={`Average skill level improved by ${analytics.levelChange}`}
              />
            )}
            {parseFloat(analytics.levelChange) < 0 && (
              <InsightItem
                type="warning"
                text={`Average skill level decreased by ${Math.abs(parseFloat(analytics.levelChange))}`}
              />
            )}
            {analytics.totalPlayers - analytics.uniquePlayersAssessed > 0 && (
              <InsightItem
                type="info"
                text={`${analytics.totalPlayers - analytics.uniquePlayersAssessed} players haven't been assessed recently`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, change, subtext }) => (
  <div className="bg-[#0d5943] rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="text-[#4ade80]" size={18} />
      <span className="text-white/60 text-sm">{label}</span>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold">{value}</span>
      {change && (
        <div className={`flex items-center gap-1 ${change.color}`}>
          <change.icon size={14} />
          <span className="text-xs">{change.text}</span>
        </div>
      )}
    </div>
    {subtext && <p className="text-xs text-white/40 mt-1">{subtext}</p>}
  </div>
);

// Insight Item Component
const InsightItem = ({ type, text }) => {
  const styles = {
    positive: 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };

  return (
    <div className={`p-3 rounded-lg border ${styles[type]}`}>
      <p className="text-sm">{text}</p>
    </div>
  );
};

export default ClubAnalyticsPage;
