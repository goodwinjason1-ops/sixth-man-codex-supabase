import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, ReferenceLine, Legend
} from 'recharts';
import {
  Clock, Users, TrendingUp, BarChart3, Activity, ChevronDown,
  AlertCircle, Play, Shield, Calendar, Filter
} from 'lucide-react';

const COLORS = {
  primary: '#005028',
  accent: '#00A651',
  gold: '#FFD700',
  red: '#EF4444',
  blue: '#3B82F6',
  muted: '#6B7C6B',
  border: '#D4E4D4',
  cardBg: '#FFFFFF',
  pageBg: '#F5F9F5',
};

const PLAYER_LINE_COLORS = [
  '#005028', '#00A651', '#3B82F6', '#EF4444', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
  '#10B981', '#E11D48', '#0EA5E9', '#84CC16', '#A855F7',
];

const formatSeconds = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatMinutes = (seconds) => {
  return (seconds / 60).toFixed(1);
};

const didPlayerStart = (playerStat) => {
  const q1Seconds = playerStat.quarterSeconds?.Q1 || 0;
  const hasQ1OnSub = (playerStat.subs || []).some(s => s.type === 'on' && s.quarter === 'Q1');
  return q1Seconds > 0 && !hasQ1OnSub;
};

const getFairnessColor = (score) => {
  if (score === 'Excellent') return COLORS.accent;
  if (score === 'Good') return COLORS.gold;
  return COLORS.red;
};

const getBarColor = (playerSeconds, avgSeconds) => {
  if (avgSeconds === 0) return COLORS.accent;
  const deviation = Math.abs(playerSeconds - avgSeconds) / avgSeconds;
  if (deviation <= 0.15) return COLORS.accent;
  if (deviation <= 0.3) return COLORS.gold;
  return COLORS.red;
};

const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-[#D4E4D4] rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800">#{data.number} {data.name}</p>
      <p className="text-[#6B7C6B]">Time: {formatSeconds(data.totalSeconds)}</p>
      <p className="text-[#6B7C6B]">Minutes: {formatMinutes(data.totalSeconds)}</p>
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-[#D4E4D4] rounded-lg shadow-lg p-3 text-sm max-h-48 overflow-y-auto">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {entry.value?.toFixed(1)} min
        </p>
      ))}
    </div>
  );
};

// ─── Game View Components ────────────────────────────────────────────────

const MinutesBarChart = ({ record }) => {
  const data = useMemo(() => {
    if (!record?.playerStats) return [];
    const entries = Object.entries(record.playerStats).map(([id, stat]) => ({
      playerId: id,
      name: stat.name || 'Unknown',
      number: stat.number || '?',
      totalSeconds: stat.totalSeconds || 0,
      minutes: parseFloat(formatMinutes(stat.totalSeconds || 0)),
    }));
    entries.sort((a, b) => b.totalSeconds - a.totalSeconds);
    return entries;
  }, [record]);

  const avgSeconds = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((sum, d) => sum + d.totalSeconds, 0) / data.length;
  }, [data]);

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <BarChart3 size={20} className="text-[#005028]" />
        Minutes Played
      </h3>
      <p className="text-sm text-[#6B7C6B] mb-4">
        Average: {formatSeconds(Math.round(avgSeconds))} per player
      </p>
      <div style={{ height: Math.max(250, data.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}m`}
              tick={{ fill: '#6B7C6B', fontSize: 12 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fill: '#333', fontSize: 12 }}
              tickFormatter={(name) => {
                const player = data.find(d => d.name === name);
                return player ? `#${player.number} ${name}` : name;
              }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="minutes" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.totalSeconds, avgSeconds)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#6B7C6B]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.accent }} />
          Within 15% of avg
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.gold }} />
          15-30% deviation
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.red }} />
          &gt;30% deviation
        </span>
      </div>
    </div>
  );
};

const SubstitutionTimeline = ({ record }) => {
  const quarters = useMemo(() => {
    if (!record?.quarters) return [];
    return Object.entries(record.quarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ key, duration: val.duration || 0 }));
  }, [record]);

  const totalDuration = useMemo(() => {
    return quarters.reduce((sum, q) => sum + q.duration, 0);
  }, [quarters]);

  const players = useMemo(() => {
    if (!record?.playerStats) return [];
    return Object.entries(record.playerStats)
      .map(([id, stat]) => ({
        id,
        name: stat.name || 'Unknown',
        number: stat.number || '?',
        quarterSeconds: stat.quarterSeconds || {},
      }))
      .sort((a, b) => {
        const aTotal = Object.values(a.quarterSeconds).reduce((s, v) => s + v, 0);
        const bTotal = Object.values(b.quarterSeconds).reduce((s, v) => s + v, 0);
        return bTotal - aTotal;
      });
  }, [record]);

  if (!quarters.length || !players.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Activity size={20} className="text-[#005028]" />
        Substitution Timeline
      </h3>
      <p className="text-sm text-[#6B7C6B] mb-4">Green = on court, Gray = on bench</p>

      {/* Quarter headers */}
      <div className="flex mb-2">
        <div className="w-24 sm:w-32 flex-shrink-0" />
        <div className="flex flex-1 gap-px">
          {quarters.map((q) => (
            <div
              key={q.key}
              className="text-center text-xs font-medium text-[#6B7C6B]"
              style={{ width: totalDuration > 0 ? `${(q.duration / totalDuration) * 100}%` : `${100 / quarters.length}%` }}
            >
              {q.key}
            </div>
          ))}
        </div>
      </div>

      {/* Player rows */}
      <div className="space-y-1">
        {players.map((player) => (
          <div key={player.id} className="flex items-center">
            <div className="w-24 sm:w-32 flex-shrink-0 text-xs text-gray-800 truncate pr-2">
              #{player.number} {player.name}
            </div>
            <div className="flex flex-1 gap-px h-6 rounded overflow-hidden">
              {quarters.map((q) => {
                const qSec = player.quarterSeconds[q.key] || 0;
                const wasPlaying = qSec > 0;
                const fillPct = q.duration > 0 ? Math.min((qSec / q.duration) * 100, 100) : 0;
                const widthPct = totalDuration > 0
                  ? `${(q.duration / totalDuration) * 100}%`
                  : `${100 / quarters.length}%`;

                return (
                  <div
                    key={q.key}
                    className="relative h-full"
                    style={{ width: widthPct }}
                    title={`${q.key}: ${formatSeconds(qSec)} of ${formatSeconds(q.duration)}`}
                  >
                    <div className="absolute inset-0 bg-gray-200 rounded-sm" />
                    {wasPlaying && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm"
                        style={{
                          width: `${fillPct}%`,
                          backgroundColor: COLORS.accent,
                          opacity: 0.85,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FairPlayIndicator = ({ record }) => {
  const stats = useMemo(() => {
    if (!record?.playerStats) return null;
    const entries = Object.values(record.playerStats);
    if (!entries.length) return null;

    const times = entries.map(e => e.totalSeconds || 0);
    const total = times.reduce((s, v) => s + v, 0);
    const avg = total / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const target = (record.totalGameSeconds || total / times.length);
    const targetPerPlayer = target / times.length * times.length / times.length;
    const equalShare = total / times.length;
    const maxDeviation = avg > 0 ? ((max - min) / avg) * 100 : 0;

    return {
      fairnessScore: record.fairnessScore || 'N/A',
      avg,
      min,
      max,
      equalShare,
      maxDeviation: Math.round(maxDeviation),
      playerCount: times.length,
    };
  }, [record]);

  if (!stats) return null;

  const color = getFairnessColor(stats.fairnessScore);
  const circumference = 2 * Math.PI * 40;
  const scorePct = stats.fairnessScore === 'Excellent' ? 95 : stats.fairnessScore === 'Good' ? 70 : 40;
  const dashOffset = circumference - (scorePct / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Shield size={20} className="text-[#005028]" />
        Fair Play Indicator
      </h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular indicator */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-gray-800" style={{ color }}>
              {stats.fairnessScore}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2 text-sm w-full">
          <div className="flex justify-between">
            <span className="text-[#6B7C6B]">Target per player</span>
            <span className="font-medium text-gray-800">{formatSeconds(Math.round(stats.equalShare))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7C6B]">Actual range</span>
            <span className="font-medium text-gray-800">
              {formatSeconds(Math.round(stats.min))} - {formatSeconds(Math.round(stats.max))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7C6B]">Max deviation from avg</span>
            <span className="font-medium text-gray-800">{stats.maxDeviation}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7C6B]">Players tracked</span>
            <span className="font-medium text-gray-800">{stats.playerCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Season View Components ──────────────────────────────────────────────

const AverageMinutesChart = ({ playerAggregates }) => {
  const data = useMemo(() => {
    return playerAggregates
      .map(p => ({
        name: p.name,
        number: p.number,
        avgMinutes: p.gamesPlayed > 0 ? parseFloat((p.totalSeconds / 60 / p.gamesPlayed).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.avgMinutes - a.avgMinutes);
  }, [playerAggregates]);

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Clock size={20} className="text-[#005028]" />
        Average Minutes Per Game
      </h3>
      <div style={{ height: Math.max(250, data.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
            <XAxis type="number" tickFormatter={(v) => `${v}m`} tick={{ fill: '#6B7C6B', fontSize: 12 }} />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fill: '#333', fontSize: 12 }}
              tickFormatter={(name) => {
                const p = data.find(d => d.name === name);
                return p ? `#${p.number} ${name}` : name;
              }}
            />
            <Tooltip
              formatter={(value) => [`${value} min`, 'Avg Minutes']}
              contentStyle={{ borderColor: '#D4E4D4', borderRadius: 8 }}
            />
            <Bar dataKey="avgMinutes" fill={COLORS.accent} radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TotalMinutesTable = ({ playerAggregates }) => {
  const sorted = useMemo(() => {
    return [...playerAggregates].sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [playerAggregates]);

  if (!sorted.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Users size={20} className="text-[#005028]" />
        Total Season Minutes
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#D4E4D4]">
              <th className="text-left py-2 px-2 text-[#6B7C6B] font-medium">Player</th>
              <th className="text-right py-2 px-2 text-[#6B7C6B] font-medium">Games</th>
              <th className="text-right py-2 px-2 text-[#6B7C6B] font-medium">Total</th>
              <th className="text-right py-2 px-2 text-[#6B7C6B] font-medium">Avg/Game</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.playerId} className="border-b border-[#D4E4D4] last:border-0">
                <td className="py-2 px-2 text-gray-800 font-medium">
                  #{p.number} {p.name}
                </td>
                <td className="py-2 px-2 text-right text-gray-800">{p.gamesPlayed}</td>
                <td className="py-2 px-2 text-right text-gray-800">{formatSeconds(Math.round(p.totalSeconds))}</td>
                <td className="py-2 px-2 text-right text-gray-800">
                  {p.gamesPlayed > 0 ? formatSeconds(Math.round(p.totalSeconds / p.gamesPlayed)) : '0:00'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StartedVsBenchChart = ({ playerAggregates }) => {
  const data = useMemo(() => {
    return playerAggregates
      .map(p => ({
        name: `#${p.number} ${p.name}`,
        started: p.gamesStarted,
        bench: p.gamesPlayed - p.gamesStarted,
      }))
      .sort((a, b) => (b.started + b.bench) - (a.started + a.bench));
  }, [playerAggregates]);

  if (!data.length) return null;

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Play size={20} className="text-[#005028]" />
        Started vs Bench
      </h3>
      <div style={{ height: Math.max(250, data.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
            <XAxis type="number" tick={{ fill: '#6B7C6B', fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#333', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderColor: '#D4E4D4', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="started" stackId="a" fill={COLORS.accent} name="Started" barSize={22} />
            <Bar dataKey="bench" stackId="a" fill={COLORS.blue} name="Bench" radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const PlayingTimeDistribution = ({ playerAggregates, filteredRecords }) => {
  const data = useMemo(() => {
    if (!filteredRecords.length || !playerAggregates.length) return [];
    const totalMinutesAll = playerAggregates.reduce((s, p) => s + p.totalSeconds / 60, 0);
    const fairShare = totalMinutesAll / playerAggregates.length;

    return playerAggregates
      .map(p => ({
        name: `#${p.number} ${p.name}`,
        totalMinutes: parseFloat((p.totalSeconds / 60).toFixed(1)),
        fairShare: parseFloat(fairShare.toFixed(1)),
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [playerAggregates, filteredRecords]);

  if (!data.length) return null;

  const fairShareValue = data[0]?.fairShare || 0;

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <BarChart3 size={20} className="text-[#005028]" />
        Playing Time Distribution
      </h3>
      <div style={{ height: Math.max(250, data.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
            <XAxis type="number" tickFormatter={(v) => `${v}m`} tick={{ fill: '#6B7C6B', fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#333', fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [`${value} min`, name === 'totalMinutes' ? 'Total Minutes' : 'Fair Share']}
              contentStyle={{ borderColor: '#D4E4D4', borderRadius: 8 }}
            />
            <ReferenceLine x={fairShareValue} stroke={COLORS.gold} strokeDasharray="5 5" label={{ value: 'Fair Share', fill: COLORS.muted, fontSize: 11 }} />
            <Bar dataKey="totalMinutes" fill={COLORS.primary} radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TrendChart = ({ playerAggregates, filteredRecords }) => {
  const [selectedPlayer, setSelectedPlayer] = useState('all');

  const { chartData, playerNames } = useMemo(() => {
    if (!filteredRecords.length) return { chartData: [], playerNames: [] };

    const allPlayerIds = new Set();
    filteredRecords.forEach(r => {
      Object.keys(r.playerStats || {}).forEach(id => allPlayerIds.add(id));
    });

    const playerMap = {};
    playerAggregates.forEach(p => {
      playerMap[p.playerId] = `#${p.number} ${p.name}`;
    });

    const sorted = [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date));

    const chartData = sorted.map(r => {
      const dateStr = new Date(r.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      const point = { date: dateStr, opponent: r.opponent || dateStr };
      allPlayerIds.forEach(id => {
        const stat = r.playerStats?.[id];
        point[id] = stat ? parseFloat((stat.totalSeconds / 60).toFixed(1)) : null;
      });
      return point;
    });

    const playerNames = [...allPlayerIds].map(id => ({
      id,
      name: playerMap[id] || id,
    }));

    return { chartData, playerNames };
  }, [filteredRecords, playerAggregates]);

  if (!chartData.length) return null;

  const visiblePlayers = selectedPlayer === 'all'
    ? playerNames
    : playerNames.filter(p => p.id === selectedPlayer);

  return (
    <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-[#005028]" />
          Minutes Per Game Trend
        </h3>
        <div className="relative">
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="appearance-none bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          >
            <option value="all">All Players</option>
            {playerNames.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7C6B] pointer-events-none" />
        </div>
      </div>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
            <XAxis dataKey="date" tick={{ fill: '#6B7C6B', fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${v}m`} tick={{ fill: '#6B7C6B', fontSize: 12 }} />
            <Tooltip content={<CustomLineTooltip />} />
            {visiblePlayers.map((p, i) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={p.name}
                stroke={PLAYER_LINE_COLORS[i % PLAYER_LINE_COLORS.length]}
                strokeWidth={selectedPlayer === 'all' ? 1.5 : 2.5}
                dot={selectedPlayer !== 'all'}
                connectNulls
                opacity={selectedPlayer === 'all' ? 0.7 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────

const RotationAnalyticsPage = () => {
  const { currentUser } = useAuth();
  const { teams } = useFilteredData();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('game');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Subscribe to playing_time records
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'playing_time'),
      where('coachId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching playing_time records:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // Auto-select first game when records load
  useEffect(() => {
    if (records.length > 0 && !selectedGameId) {
      setSelectedGameId(records[0].id);
    }
  }, [records, selectedGameId]);

  const selectedRecord = useMemo(() => {
    return records.find(r => r.id === selectedGameId) || null;
  }, [records, selectedGameId]);

  // Season view: filter records by team and date range
  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (selectedTeamId !== 'all') {
      filtered = filtered.filter(r => r.teamId === selectedTeamId);
    }

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(r => new Date(r.date) >= cutoff);
    }

    return filtered;
  }, [records, selectedTeamId, dateRange]);

  // Aggregate player stats across filtered records for season view
  const playerAggregates = useMemo(() => {
    const map = {};

    filteredRecords.forEach(record => {
      Object.entries(record.playerStats || {}).forEach(([playerId, stat]) => {
        if (!map[playerId]) {
          map[playerId] = {
            playerId,
            name: stat.name || 'Unknown',
            number: stat.number || '?',
            totalSeconds: 0,
            gamesPlayed: 0,
            gamesStarted: 0,
          };
        }
        map[playerId].totalSeconds += stat.totalSeconds || 0;
        map[playerId].gamesPlayed += 1;
        if (didPlayerStart(stat)) {
          map[playerId].gamesStarted += 1;
        }
        // Update name/number to latest
        if (stat.name) map[playerId].name = stat.name;
        if (stat.number) map[playerId].number = stat.number;
      });
    });

    return Object.values(map);
  }, [filteredRecords]);

  // Team options for season filter
  const teamOptions = useMemo(() => {
    const teamMap = {};
    records.forEach(r => {
      if (r.teamId && r.teamName) {
        teamMap[r.teamId] = r.teamName;
      }
    });
    return Object.entries(teamMap).map(([id, name]) => ({ id, name }));
  }, [records]);

  if (loading) {
    return (
      <PageShell
        title="Rotation Analytics"
        subtitle="Playing time analysis and fairness tracking"
        breadcrumbs={[
          { label: 'Home', url: '/welcome' },
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Rotation Analytics' },
        ]}
        backTo="/dashboard"
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005028]" />
        </div>
      </PageShell>
    );
  }

  if (!records.length) {
    return (
      <PageShell
        title="Rotation Analytics"
        subtitle="Playing time analysis and fairness tracking"
        breadcrumbs={[
          { label: 'Home', url: '/welcome' },
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Rotation Analytics' },
        ]}
        backTo="/dashboard"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-8 max-w-md">
            <BarChart3 size={48} className="mx-auto mb-4 text-[#D4E4D4]" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Rotation Data Yet</h3>
            <p className="text-sm text-[#6B7C6B]">
              Rotation analytics will appear here once you record playing time during games.
              Use the Playing Time Tracker during your next game to get started.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Rotation Analytics"
      subtitle="Playing time analysis and fairness tracking"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/dashboard' },
        { label: 'Rotation Analytics' },
      ]}
      backTo="/dashboard"
    >
      {/* Tab Selector */}
      <div className="flex gap-1 bg-white rounded-xl border border-[#D4E4D4] p-1 mb-6">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'game'
              ? 'bg-[#005028] text-white'
              : 'text-[#6B7C6B] hover:bg-[#F5F9F5]'
          }`}
        >
          <Play size={16} />
          Game View
        </button>
        <button
          onClick={() => setActiveTab('season')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'season'
              ? 'bg-[#005028] text-white'
              : 'text-[#6B7C6B] hover:bg-[#F5F9F5]'
          }`}
        >
          <TrendingUp size={16} />
          Season View
        </button>
      </div>

      {/* Game View */}
      {activeTab === 'game' && (
        <div className="space-y-6">
          {/* Game Selector */}
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-4">
            <label className="block text-sm font-medium text-[#6B7C6B] mb-2">Select Game</label>
            <div className="relative">
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className="w-full appearance-none bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
              >
                {records.map((r) => {
                  const dateStr = new Date(r.date).toLocaleDateString('en-AU', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  });
                  return (
                    <option key={r.id} value={r.id}>
                      {dateStr} — vs {r.opponent || 'Unknown'} ({r.teamName || 'Team'})
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7C6B] pointer-events-none" />
            </div>
          </div>

          {selectedRecord && (
            <>
              {/* Game summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Total Game Time</p>
                  <p className="text-lg font-bold text-gray-800">
                    {formatSeconds(selectedRecord.totalGameSeconds || 0)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Quarters</p>
                  <p className="text-lg font-bold text-gray-800">
                    {selectedRecord.quartersPlayed || Object.keys(selectedRecord.quarters || {}).length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Players</p>
                  <p className="text-lg font-bold text-gray-800">
                    {Object.keys(selectedRecord.playerStats || {}).length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Fairness</p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: getFairnessColor(selectedRecord.fairnessScore) }}
                  >
                    {selectedRecord.fairnessScore || 'N/A'}
                  </p>
                </div>
              </div>

              <MinutesBarChart record={selectedRecord} />
              <SubstitutionTimeline record={selectedRecord} />
              <FairPlayIndicator record={selectedRecord} />
            </>
          )}
        </div>
      )}

      {/* Season View */}
      {activeTab === 'season' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#6B7C6B] mb-2">
                  <Filter size={14} className="inline mr-1" />
                  Team
                </label>
                <div className="relative">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full appearance-none bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
                  >
                    <option value="all">All Teams</option>
                    {teamOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7C6B] pointer-events-none" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#6B7C6B] mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Date Range
                </label>
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full appearance-none bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
                  >
                    <option value="30">Last 30 Days</option>
                    <option value="60">Last 60 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7C6B] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#D4E4D4] p-8 text-center">
              <AlertCircle size={36} className="mx-auto mb-3 text-[#D4E4D4]" />
              <p className="text-sm text-[#6B7C6B]">
                No rotation records found for the selected filters. Try changing the team or date range.
              </p>
            </div>
          ) : (
            <>
              {/* Season summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Games Tracked</p>
                  <p className="text-lg font-bold text-gray-800">{filteredRecords.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Players</p>
                  <p className="text-lg font-bold text-gray-800">{playerAggregates.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Excellent Fairness</p>
                  <p className="text-lg font-bold text-[#00A651]">
                    {filteredRecords.filter(r => r.fairnessScore === 'Excellent').length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-[#D4E4D4] p-3 text-center">
                  <p className="text-xs text-[#6B7C6B] mb-1">Needs Improvement</p>
                  <p className="text-lg font-bold text-[#EF4444]">
                    {filteredRecords.filter(r => r.fairnessScore === 'Needs Improvement').length}
                  </p>
                </div>
              </div>

              <AverageMinutesChart playerAggregates={playerAggregates} />
              <TotalMinutesTable playerAggregates={playerAggregates} />
              <StartedVsBenchChart playerAggregates={playerAggregates} />
              <PlayingTimeDistribution playerAggregates={playerAggregates} filteredRecords={filteredRecords} />
              <TrendChart playerAggregates={playerAggregates} filteredRecords={filteredRecords} />
            </>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default RotationAnalyticsPage;
