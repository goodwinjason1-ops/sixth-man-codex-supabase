// Parent rotation data is available via the playing_time collection
// Query: where('teamId', '==', parentChildTeamId) to get team games
// Then filter playerStats[childPlayerId] for the specific child's data
// This enables future parent-facing rotation analytics

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, ReferenceLine, Legend
} from 'recharts';
import {
  Clock, Users, TrendingUp, BarChart3, AlertTriangle, Shield,
  ChevronDown, Filter, Activity
} from 'lucide-react';

const DATE_RANGE_OPTIONS = [
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 60 Days', value: 60 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time', value: 0 },
];

const FAIRNESS_COLORS = {
  Excellent: '#00A651',
  Good: '#FFD700',
  'Needs Improvement': '#EF4444',
};

const EQUITY_THRESHOLD = 0.4; // 40% of average

export default function AdminRotationAnalyticsPage() {
  const { players, teams } = useData();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState('all');
  const [coachFilter, setCoachFilter] = useState('all');
  const [dateRange, setDateRange] = useState(30);

  // Subscribe to ALL playing_time records
  useEffect(() => {
    const q = query(collection(db, 'playing_time'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('Error fetching playing_time:', err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Derive unique coaches and teams from records
  const coachOptions = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      if (r.coachId && r.coachName) map.set(r.coachId, r.coachName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [records]);

  const teamOptions = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      if (r.teamId && r.teamName) map.set(r.teamId, r.teamName);
    });
    // Also include teams from DataContext
    (teams || []).forEach((t) => {
      if (t.id && t.name && !map.has(t.id)) map.set(t.id, t.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [records, teams]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      if (teamFilter !== 'all' && r.teamId !== teamFilter) return false;
      if (coachFilter !== 'all' && r.coachId !== coachFilter) return false;
      if (dateRange > 0 && r.date) {
        const recordDate = new Date(r.date);
        const cutoff = new Date(now.getTime() - dateRange * 24 * 60 * 60 * 1000);
        if (recordDate < cutoff) return false;
      }
      return true;
    });
  }, [records, teamFilter, coachFilter, dateRange]);

  // === Overview Stats ===
  const overviewStats = useMemo(() => {
    const totalGames = filteredRecords.length;
    const playerIds = new Set();
    filteredRecords.forEach((r) => {
      if (r.playerStats) {
        Object.keys(r.playerStats).forEach((pid) => playerIds.add(pid));
      }
    });
    const totalPlayers = playerIds.size;

    const fairGames = filteredRecords.filter(
      (r) => r.fairnessScore === 'Excellent' || r.fairnessScore === 'Good'
    ).length;
    const avgFairness = totalGames > 0 ? Math.round((fairGames / totalGames) * 100) : 0;

    // Equity alerts: players below 40% of their team average
    const equityAlerts = computeEquityAlerts(filteredRecords).length;

    return { totalGames, totalPlayers, avgFairness, equityAlerts };
  }, [filteredRecords]);

  // === Coach Fairness Comparison ===
  const coachFairnessData = useMemo(() => {
    const coachMap = {};
    filteredRecords.forEach((r) => {
      if (!r.coachId) return;
      if (!coachMap[r.coachId]) {
        coachMap[r.coachId] = { name: r.coachName || 'Unknown', total: 0, fair: 0 };
      }
      coachMap[r.coachId].total += 1;
      if (r.fairnessScore === 'Excellent' || r.fairnessScore === 'Good') {
        coachMap[r.coachId].fair += 1;
      }
    });
    return Object.entries(coachMap)
      .map(([id, d]) => ({
        coachId: id,
        name: d.name,
        percentage: d.total > 0 ? Math.round((d.fair / d.total) * 100) : 0,
        totalGames: d.total,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [filteredRecords]);

  // === Playing Time Distribution by Team ===
  const teamDistributions = useMemo(() => {
    // Aggregate total seconds per player per team
    const teamMap = {};
    filteredRecords.forEach((r) => {
      if (!r.teamId || !r.playerStats) return;
      if (!teamMap[r.teamId]) {
        teamMap[r.teamId] = { teamName: r.teamName || 'Unknown', players: {} };
      }
      Object.entries(r.playerStats).forEach(([pid, ps]) => {
        if (!teamMap[r.teamId].players[pid]) {
          teamMap[r.teamId].players[pid] = {
            name: ps.name || pid,
            number: ps.number || '',
            totalSeconds: 0,
            gameCount: 0,
          };
        }
        teamMap[r.teamId].players[pid].totalSeconds += ps.totalSeconds || 0;
        teamMap[r.teamId].players[pid].gameCount += 1;
      });
    });

    return Object.entries(teamMap).map(([teamId, data]) => {
      const playerList = Object.entries(data.players).map(([pid, p]) => ({
        playerId: pid,
        name: p.name,
        number: p.number,
        avgMinutes: p.gameCount > 0 ? (p.totalSeconds / p.gameCount / 60) : 0,
        totalMinutes: p.totalSeconds / 60,
        gameCount: p.gameCount,
      }));
      const teamAvg =
        playerList.length > 0
          ? playerList.reduce((s, p) => s + p.avgMinutes, 0) / playerList.length
          : 0;
      const threshold = teamAvg * EQUITY_THRESHOLD;
      return {
        teamId,
        teamName: data.teamName,
        players: playerList.sort((a, b) => b.avgMinutes - a.avgMinutes),
        teamAvg,
        threshold,
      };
    }).sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [filteredRecords]);

  // === Equity Alerts ===
  const equityAlerts = useMemo(() => computeEquityAlerts(filteredRecords), [filteredRecords]);

  // === Season Trends ===
  const seasonTrendData = useMemo(() => {
    // Group records by date and coach, compute rolling fairness
    const dateCoachMap = {};
    filteredRecords.forEach((r) => {
      if (!r.date || !r.coachId) return;
      const dateKey = r.date.substring(0, 10); // YYYY-MM-DD
      if (!dateCoachMap[dateKey]) dateCoachMap[dateKey] = {};
      if (!dateCoachMap[dateKey][r.coachId]) {
        dateCoachMap[dateKey][r.coachId] = { name: r.coachName || 'Unknown', total: 0, fair: 0 };
      }
      dateCoachMap[dateKey][r.coachId].total += 1;
      if (r.fairnessScore === 'Excellent' || r.fairnessScore === 'Good') {
        dateCoachMap[dateKey][r.coachId].fair += 1;
      }
    });

    const sortedDates = Object.keys(dateCoachMap).sort();
    const allCoachIds = new Set();
    sortedDates.forEach((d) => Object.keys(dateCoachMap[d]).forEach((c) => allCoachIds.add(c)));

    // Compute cumulative fairness per coach
    const cumulative = {};
    return sortedDates.map((dateKey) => {
      const point = { date: dateKey };
      allCoachIds.forEach((cid) => {
        if (!cumulative[cid]) cumulative[cid] = { total: 0, fair: 0, name: '' };
        if (dateCoachMap[dateKey]?.[cid]) {
          cumulative[cid].total += dateCoachMap[dateKey][cid].total;
          cumulative[cid].fair += dateCoachMap[dateKey][cid].fair;
          cumulative[cid].name = dateCoachMap[dateKey][cid].name;
        }
        point[cid] =
          cumulative[cid].total > 0
            ? Math.round((cumulative[cid].fair / cumulative[cid].total) * 100)
            : null;
      });
      return point;
    });
  }, [filteredRecords]);

  const trendCoaches = useMemo(() => {
    const map = {};
    filteredRecords.forEach((r) => {
      if (r.coachId && r.coachName) map[r.coachId] = r.coachName;
    });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [filteredRecords]);

  const TREND_COLORS = ['#005028', '#00A651', '#FFD700', '#3B82F6', '#8B5CF6', '#EF4444', '#F97316'];

  if (loading) {
    return (
      <PageShell
        title="Rotation Analytics"
        subtitle="Club-wide playing time analysis"
        breadcrumbs={[
          { label: 'Home', url: '/welcome' },
          { label: 'Analytics & Reports', url: '/admin/analytics-hub' },
          { label: 'Rotation Analytics' },
        ]}
        backTo="/admin/analytics-hub"
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005028]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Rotation Analytics"
      subtitle="Club-wide playing time analysis"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Analytics & Reports', url: '/admin/analytics-hub' },
        { label: 'Rotation Analytics' },
      ]}
      backTo="/admin/analytics-hub"
    >
      <div className="space-y-6 px-4 py-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#D4E4D4] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} className="text-[#005028]" />
            <h3 className="font-semibold text-gray-800">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[#6B7C6B] mb-1">Team</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full rounded-lg border border-[#D4E4D4] bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
              >
                <option value="all">All Teams</option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6B7C6B] mb-1">Coach</label>
              <select
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
                className="w-full rounded-lg border border-[#D4E4D4] bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
              >
                <option value="all">All Coaches</option>
                {coachOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6B7C6B] mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="w-full rounded-lg border border-[#D4E4D4] bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 size={22} />}
            label="Total Games Tracked"
            value={overviewStats.totalGames}
            color="#005028"
          />
          <StatCard
            icon={<Users size={22} />}
            label="Total Players Tracked"
            value={overviewStats.totalPlayers}
            color="#00A651"
          />
          <StatCard
            icon={<Shield size={22} />}
            label="Avg Fairness Score"
            value={`${overviewStats.avgFairness}%`}
            subtitle="Games rated Excellent/Good"
            color="#FFD700"
          />
          <StatCard
            icon={<AlertTriangle size={22} />}
            label="Equity Alerts"
            value={overviewStats.equityAlerts}
            subtitle="Players below 40% avg"
            color={overviewStats.equityAlerts > 0 ? '#EF4444' : '#00A651'}
          />
        </div>

        {/* Empty state */}
        {filteredRecords.length === 0 && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-8 text-center">
            <Activity size={40} className="mx-auto mb-3 text-[#6B7C6B]" />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No Rotation Data</h3>
            <p className="text-[#6B7C6B] text-sm">
              No playing time records found for the selected filters. Records will appear here once coaches track game rotations.
            </p>
          </div>
        )}

        {filteredRecords.length > 0 && (
          <>
            {/* Coach Fairness Comparison */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] p-4">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#005028]" />
                Coach Fairness Comparison
              </h3>
              <p className="text-sm text-[#6B7C6B] mb-4">
                Percentage of games rated "Excellent" or "Good" fairness
              </p>
              {coachFairnessData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, coachFairnessData.length * 50)}>
                  <BarChart
                    data={coachFairnessData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, 'Fairness']}
                      labelFormatter={(label) => label}
                      contentStyle={{ borderColor: '#D4E4D4', borderRadius: 8 }}
                    />
                    <Bar dataKey="percentage" radius={[0, 6, 6, 0]} maxBarSize={32}>
                      {coachFairnessData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.percentage > 80
                              ? '#00A651'
                              : entry.percentage >= 50
                              ? '#FFD700'
                              : '#EF4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[#6B7C6B] text-center py-8">No coach data available</p>
              )}
            </div>

            {/* Playing Time Distribution by Team */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] p-4">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <Clock size={18} className="text-[#005028]" />
                Playing Time Distribution by Team
              </h3>
              <p className="text-sm text-[#6B7C6B] mb-4">
                Average minutes per game per player. Red line marks 40% equity threshold.
              </p>
              {teamDistributions.length > 0 ? (
                <div className="space-y-6">
                  {teamDistributions.map((team) => (
                    <div key={team.teamId}>
                      <h4 className="text-sm font-semibold text-[#005028] mb-2">
                        {team.teamName}
                        <span className="text-[#6B7C6B] font-normal ml-2">
                          (Avg: {team.teamAvg.toFixed(1)} min)
                        </span>
                      </h4>
                      <ResponsiveContainer width="100%" height={Math.max(150, team.players.length * 36)}>
                        <BarChart
                          data={team.players}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                          <XAxis
                            type="number"
                            tickFormatter={(v) => `${v.toFixed(0)}m`}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value) => [`${value.toFixed(1)} min`, 'Avg Minutes']}
                            contentStyle={{ borderColor: '#D4E4D4', borderRadius: 8 }}
                          />
                          <ReferenceLine
                            x={team.threshold}
                            stroke="#EF4444"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            label={{ value: '40%', position: 'top', fill: '#EF4444', fontSize: 11 }}
                          />
                          <Bar dataKey="avgMinutes" radius={[0, 6, 6, 0]} maxBarSize={24}>
                            {team.players.map((p, i) => (
                              <Cell
                                key={i}
                                fill={p.avgMinutes < team.threshold ? '#EF4444' : '#00A651'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B7C6B] text-center py-8">No team data available</p>
              )}
            </div>

            {/* Equity Alerts */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] p-4">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                Equity Alerts
              </h3>
              <p className="text-sm text-[#6B7C6B] mb-4">
                Players receiving less than 40% of their team's average court time
              </p>
              {equityAlerts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#D4E4D4]">
                        <th className="text-left py-2 px-3 text-[#6B7C6B] font-medium">Player</th>
                        <th className="text-left py-2 px-3 text-[#6B7C6B] font-medium">Team</th>
                        <th className="text-right py-2 px-3 text-[#6B7C6B] font-medium">Their Avg</th>
                        <th className="text-right py-2 px-3 text-[#6B7C6B] font-medium">Team Avg</th>
                        <th className="text-right py-2 px-3 text-[#6B7C6B] font-medium">% of Avg</th>
                        <th className="text-center py-2 px-3 text-[#6B7C6B] font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equityAlerts.map((alert, i) => (
                        <tr key={i} className="border-b border-[#D4E4D4] last:border-b-0">
                          <td className="py-2 px-3 font-medium text-gray-800">{alert.playerName}</td>
                          <td className="py-2 px-3 text-gray-800">{alert.teamName}</td>
                          <td className="py-2 px-3 text-right text-gray-800">
                            {alert.playerAvgMinutes.toFixed(1)}m
                          </td>
                          <td className="py-2 px-3 text-right text-gray-800">
                            {alert.teamAvgMinutes.toFixed(1)}m
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-red-600">
                            {alert.percentOfAvg.toFixed(0)}%
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                alert.percentOfAvg < 20
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {alert.percentOfAvg < 20 ? 'Critical' : 'Warning'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield size={32} className="mx-auto mb-2 text-[#00A651]" />
                  <p className="text-sm text-[#6B7C6B]">
                    No equity alerts. All players are receiving fair playing time.
                  </p>
                </div>
              )}
            </div>

            {/* Season Trends */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] p-4">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <Activity size={18} className="text-[#005028]" />
                Season Fairness Trends
              </h3>
              <p className="text-sm text-[#6B7C6B] mb-4">
                Cumulative fairness score over time by coach
              </p>
              {seasonTrendData.length > 1 && trendCoaches.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={seasonTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d) => {
                        const dt = new Date(d);
                        return `${dt.getMonth() + 1}/${dt.getDate()}`;
                      }}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      labelFormatter={(d) => new Date(d).toLocaleDateString()}
                      formatter={(value, name) => {
                        const coach = trendCoaches.find((c) => c.id === name);
                        return [`${value}%`, coach ? coach.name : name];
                      }}
                      contentStyle={{ borderColor: '#D4E4D4', borderRadius: 8 }}
                    />
                    <Legend
                      formatter={(value) => {
                        const coach = trendCoaches.find((c) => c.id === value);
                        return coach ? coach.name : value;
                      }}
                    />
                    {trendCoaches.map((coach, i) => (
                      <Line
                        key={coach.id}
                        type="monotone"
                        dataKey={coach.id}
                        stroke={TREND_COLORS[i % TREND_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[#6B7C6B] text-center py-8">
                  Need at least two data points to show trends
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

// === Helper: Stat Card ===
function StatCard({ icon, label, value, subtitle, color }) {
  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-[#6B7C6B] mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-[#6B7C6B] mt-0.5">{subtitle}</p>}
    </div>
  );
}

// === Helper: Compute equity alerts across all teams ===
function computeEquityAlerts(records) {
  const teamMap = {};
  records.forEach((r) => {
    if (!r.teamId || !r.playerStats) return;
    if (!teamMap[r.teamId]) {
      teamMap[r.teamId] = { teamName: r.teamName || 'Unknown', players: {} };
    }
    Object.entries(r.playerStats).forEach(([pid, ps]) => {
      if (!teamMap[r.teamId].players[pid]) {
        teamMap[r.teamId].players[pid] = {
          name: ps.name || pid,
          totalSeconds: 0,
          gameCount: 0,
        };
      }
      teamMap[r.teamId].players[pid].totalSeconds += ps.totalSeconds || 0;
      teamMap[r.teamId].players[pid].gameCount += 1;
    });
  });

  const alerts = [];
  Object.entries(teamMap).forEach(([teamId, data]) => {
    const playerList = Object.entries(data.players).map(([pid, p]) => ({
      playerId: pid,
      name: p.name,
      avgMinutes: p.gameCount > 0 ? p.totalSeconds / p.gameCount / 60 : 0,
    }));
    if (playerList.length === 0) return;
    const teamAvg = playerList.reduce((s, p) => s + p.avgMinutes, 0) / playerList.length;
    const threshold = teamAvg * EQUITY_THRESHOLD;

    playerList.forEach((p) => {
      if (p.avgMinutes < threshold && teamAvg > 0) {
        alerts.push({
          playerId: p.playerId,
          playerName: p.name,
          teamId,
          teamName: data.teamName,
          playerAvgMinutes: p.avgMinutes,
          teamAvgMinutes: teamAvg,
          percentOfAvg: (p.avgMinutes / teamAvg) * 100,
        });
      }
    });
  });

  return alerts.sort((a, b) => a.percentOfAvg - b.percentOfAvg);
}
