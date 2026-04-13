import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import { useData } from '../../contexts/DataContext';
import {
  subscribeAllScoutEvaluations,
  SCOUT_METRICS,
  calculatePlayerScoutAverage,
  calculateCombinedScore,
  TRYOUT_LEVEL_COLORS
} from '../../services/scoutService';
import {
  getSessionEvaluations,
  getPlayerSummary,
  AGE_GROUPS,
  getAllTryoutSessions,
  subscribeTryoutSessions,
  EVAL_METRICS,
  TEAM_OPTIONS,
  formatTime24to12
} from '../../services/tryoutService';
import {
  Users, Eye, Search, Filter, ChevronRight, ChevronDown, ChevronUp, Loader2,
  Calendar, Clock, MapPin, ClipboardCheck, Trophy, BarChart3, Target,
  Download, UserCheck, Plus, Minus, Settings, X, Pencil, Trash2, Check
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, BarChart, Bar, Cell, ResponsiveContainer
} from 'recharts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseDate = (d) => {
  if (!d) return null;
  if (d.toDate) return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const fmtDate = (d) => {
  if (!d) return '';
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const getRatingColor = (value) => {
  if (!value) return 'text-[#6B7C6B]';
  const v = parseFloat(value);
  if (v >= 4.5) return 'text-[#005028]';
  if (v >= 3.5) return 'text-[#2563eb]';
  if (v >= 2.5) return 'text-[#eab308]';
  if (v >= 1.5) return 'text-[#f59e0b]';
  return 'text-[#94a3b8]';
};

const getScoreBadgeColor = (value) => {
  if (!value) return 'bg-gray-100 text-[#6B7C6B]';
  const v = parseFloat(value);
  if (v >= 4.5) return 'bg-[#005028] text-white';
  if (v >= 3.5) return 'bg-[#2563eb] text-white';
  if (v >= 2.5) return 'bg-[#eab308] text-white';
  if (v >= 1.5) return 'bg-[#f59e0b] text-white';
  return 'bg-[#94a3b8] text-white';
};

const getTierInfo = (score) => {
  if (!score) return { label: 'No Data', color: 'text-[#6B7C6B]', bg: 'bg-gray-100' };
  const v = parseFloat(score);
  if (v >= 4.5) return { label: 'Exceptional', color: 'text-[#005028]', bg: 'bg-[#005028]/10' };
  if (v >= 3.5) return { label: 'Strong', color: 'text-[#2563eb]', bg: 'bg-[#2563eb]/10' };
  if (v >= 2.5) return { label: 'Developing', color: 'text-[#eab308]', bg: 'bg-[#eab308]/10' };
  return { label: 'Foundational', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' };
};

const MetricRow = ({ name, value }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-[#6B7C6B] truncate mr-2">{name}</span>
    {value !== null && value !== undefined ? (
      <span className={`text-xs font-semibold min-w-[2rem] text-right ${getRatingColor(value)}`}>{value}</span>
    ) : (
      <span className="text-xs text-[#D4E4D4] min-w-[2rem] text-right">—</span>
    )}
  </div>
);

const TIER_CONFIG = [
  { name: 'High (4.0+)', min: 4.0, max: 5.01, color: '#005028' },
  { name: 'Mid (2.5-3.9)', min: 2.5, max: 4.0, color: '#2563eb' },
  { name: 'Dev (<2.5)', min: 0, max: 2.5, color: '#f59e0b' }
];

const getHeatmapColor = (value) => {
  if (!value || value === '-') return '#1a3a2e';
  const v = parseFloat(value);
  if (v >= 4.5) return '#005028';
  if (v >= 3.5) return '#2563eb';
  if (v >= 2.5) return '#eab308';
  if (v >= 1.5) return '#f59e0b';
  return '#94a3b8';
};

const InsightsCharts = ({ playerData, metrics, metricLabel }) => {
  if (!playerData || playerData.length === 0) return null;

  // Scatter: Overall vs Athleticism
  const scatterData = playerData.map(p => ({
    name: p.name,
    overall: p.overall || 0,
    athleticism: p.athleticism || 0,
    number: p.number
  })).filter(d => d.overall > 0 && d.athleticism > 0);

  // Tier distribution
  const tierData = TIER_CONFIG.map(tier => ({
    name: tier.name,
    count: playerData.filter(p => {
      const v = p.overall || 0;
      return v >= tier.min && v < tier.max;
    }).length,
    color: tier.color
  }));

  // Heatmap (top 30)
  const heatmapPlayers = [...playerData]
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .slice(0, 30);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-sm font-bold text-gray-800">Insights</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scatter */}
        {scatterData.length > 0 && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Overall vs Athleticism</h4>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
                <XAxis type="number" dataKey="athleticism" name="Athleticism" domain={[0.5, 5.5]}
                  tick={{ fill: '#00A651', fontSize: 11 }} label={{ value: 'Athleticism', position: 'bottom', fill: '#00A651', fontSize: 11 }} />
                <YAxis type="number" dataKey="overall" name="Overall" domain={[0.5, 5.5]}
                  tick={{ fill: '#00A651', fontSize: 11 }} label={{ value: 'Overall', angle: -90, position: 'insideLeft', fill: '#00A651', fontSize: 11 }} />
                <RTooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-2 text-xs shadow-xl">
                      <p className="text-gray-800 font-bold">{d.name} {d.number ? `#${d.number}` : ''}</p>
                      <p className="text-[#00A651]">Overall: {d.overall} | Ath: {d.athleticism}</p>
                    </div>
                  );
                }} />
                <Scatter data={scatterData} fill="#00A651">
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={entry.overall >= 4 ? '#005028' : entry.overall >= 2.5 ? '#2563eb' : '#f59e0b'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tier Distribution */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-700 mb-2">Talent Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tierData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D4E4D4" />
              <XAxis dataKey="name" tick={{ fill: '#00A651', fontSize: 11 }} />
              <YAxis tick={{ fill: '#00A651', fontSize: 11 }} allowDecimals={false} />
              <RTooltip content={({ payload }) => {
                if (!payload?.length) return null;
                return (
                  <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-2 text-xs shadow-xl">
                    <p className="text-gray-800 font-bold">{payload[0].payload.name}</p>
                    <p className="text-[#00A651]">{payload[0].value} players</p>
                  </div>
                );
              }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {tierData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      {heatmapPlayers.length > 0 && (
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4 overflow-x-auto">
          <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00A651]" /> Player × Metric Heatmap
          </h4>
          <div className="min-w-[600px]">
            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `160px repeat(${metrics.length}, 1fr) 80px` }}>
              <div className="text-xs text-[#00A651] font-medium px-1">Player</div>
              {metrics.map(m => (
                <div key={m.id} className="text-xs text-[#00A651] font-medium text-center">{(m.name || m.label || m.id).slice(0, 8)}</div>
              ))}
              <div className="text-xs text-[#00A651] font-medium text-center">Avg</div>
            </div>
            {heatmapPlayers.map(player => (
              <div key={player.id} className="grid gap-1 mb-0.5" style={{ gridTemplateColumns: `160px repeat(${metrics.length}, 1fr) 80px` }}>
                <div className="text-xs text-gray-800 truncate px-1 flex items-center">
                  <span className="font-medium truncate">{player.name}</span>
                  {player.number && <span className="text-gray-800/30 ml-1 flex-shrink-0">#{player.number}</span>}
                </div>
                {metrics.map(m => {
                  const val = player.metrics?.[m.id];
                  return (
                    <div key={m.id} className="rounded text-center py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: getHeatmapColor(val) }}>
                      {val ? parseFloat(val).toFixed(1) : '—'}
                    </div>
                  );
                })}
                <div className="rounded text-center py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: getHeatmapColor(player.overall) }}>
                  {player.overall || '—'}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
              <span>Low</span>
              <div className="flex gap-0.5">
                {['#94a3b8', '#f59e0b', '#eab308', '#2563eb', '#005028'].map(c => (
                  <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span>High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'tryouts', label: 'Tryout Results', icon: ClipboardCheck },
  { key: 'scouting', label: 'Game Scouting', icon: Eye },
  { key: 'combined', label: 'Combined Profiles', icon: BarChart3 },
  { key: 'assignment', label: 'Team Assignment', icon: UserCheck },
];

// ---------------------------------------------------------------------------
// Tab 1: Tryout Results (session list with links to results pages)
// ---------------------------------------------------------------------------

const TryoutResultsTab = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeTryoutSessions((data) => {
      setSessions(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-[#00A651]" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <ClipboardCheck size={40} className="mx-auto text-[#D4E4D4] mb-3" />
        <p className="text-[#6B7C6B]">No tryout sessions found.</p>
        <button
          onClick={() => navigate('/admin/tryouts')}
          className="mt-4 px-4 py-2 bg-[#005028] text-white rounded-lg text-sm font-medium hover:bg-[#00A651]"
        >
          Go to Tryout Sessions
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7C6B]">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => navigate('/admin/tryouts')}
          className="text-sm text-[#00A651] hover:text-[#005028] font-medium flex items-center gap-1"
        >
          Manage Sessions <ChevronRight size={14} />
        </button>
      </div>
      <div className="space-y-3">
        {sessions.map(session => {
          const date = parseDate(session.date);
          const statusColors = {
            active: 'bg-green-500/20 text-green-600 border-green-500',
            completed: 'bg-blue-500/20 text-blue-600 border-blue-500',
            closed: 'bg-red-500/20 text-red-600 border-red-500',
            draft: 'bg-gray-200 text-gray-600 border-gray-400'
          };
          return (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-[#D4E4D4] p-4 hover:border-[#00A651] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-gray-800">{session.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[session.status] || 'bg-gray-200 text-gray-600 border-gray-400'}`}>
                      {session.status || 'draft'}
                    </span>
                    {session.sessionType === 'hour-1' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#005028]/10 text-[#005028] border border-[#005028]/40">Hour 1</span>
                    )}
                    {session.sessionType === 'hour-2' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00A651]/10 text-[#005028] border border-[#00A651]/40">Hour 2</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[#6B7C6B]">
                    {session.ageGroup && (
                      <span className="px-2 py-0.5 bg-[#D4E4D4]/50 text-gray-800 text-xs rounded">{session.ageGroup}</span>
                    )}
                    {date && (
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar size={12} /> {fmtDate(date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs">
                      <Users size={12} /> {session.players?.length || 0} players
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/tryout/${session.id}`)}
                    className="px-3 py-1.5 bg-[#00A651] text-white rounded-lg text-xs font-medium hover:bg-[#005028]"
                  >
                    Assess
                  </button>
                  <button
                    onClick={() => navigate(`/admin/tryouts/${session.id}/results`)}
                    className="px-3 py-1.5 bg-[#D4E4D4] text-gray-700 rounded-lg text-xs font-medium hover:bg-[#00A651] hover:text-white"
                  >
                    Results
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 2: Game Scouting (reused from ScoutManagementPage)
// ---------------------------------------------------------------------------

const GameScoutingTab = ({ games, teams }) => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  useEffect(() => {
    setLoadingEvals(true);
    const unsub = subscribeAllScoutEvaluations((evals) => {
      setEvaluations(evals);
      setLoadingEvals(false);
    });
    return unsub;
  }, []);

  const gameMap = useMemo(() => {
    const m = {};
    (games || []).forEach(g => { m[g.id] = g; });
    return m;
  }, [games]);

  const filtered = useMemo(() => {
    return evaluations.filter(ev => {
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
      if (teamFilter !== 'all' && ev.teamId !== teamFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const playerName = (ev.playerName || '').toLowerCase();
        const scoutName = (ev.scoutName || '').toLowerCase();
        if (!playerName.includes(q) && !scoutName.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const dA = parseDate(a.updatedAt || a.createdAt);
      const dB = parseDate(b.updatedAt || b.createdAt);
      return (dB || 0) - (dA || 0);
    });
  }, [evaluations, statusFilter, teamFilter, searchTerm]);

  const calcAvg = (ratings) => {
    if (!ratings) return null;
    const vals = SCOUT_METRICS.map(m => ratings[m.id]).filter(v => typeof v === 'number' && v > 0);
    if (vals.length === 0) return null;
    return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  // Aggregate per-player data for charts
  const chartData = useMemo(() => {
    const playerMap = {};
    evaluations.forEach(ev => {
      const pid = ev.playerId;
      if (!playerMap[pid]) {
        playerMap[pid] = { id: pid, name: ev.playerName || 'Unknown', number: ev.playerNumber, ratings: [] };
      }
      if (ev.ratings) playerMap[pid].ratings.push(ev.ratings);
    });
    return Object.values(playerMap).map(p => {
      const avgMetrics = {};
      SCOUT_METRICS.forEach(m => {
        const vals = p.ratings.map(r => r[m.id]).filter(v => typeof v === 'number' && v > 0);
        avgMetrics[m.id] = vals.length > 0 ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
      });
      const allVals = Object.values(avgMetrics).filter(v => v !== null);
      const overall = allVals.length > 0 ? +(allVals.reduce((a, b) => a + b, 0) / allVals.length).toFixed(1) : 0;
      return { id: p.id, name: p.name, number: p.number, overall, athleticism: avgMetrics.athleticism || 0, metrics: avgMetrics };
    }).filter(p => p.overall > 0);
  }, [evaluations]);

  if (loadingEvals) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-[#00A651]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7C6B]">{filtered.length} evaluation{filtered.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => navigate('/admin/game-scouts')}
          className="text-sm text-[#00A651] hover:text-[#005028] font-medium flex items-center gap-1"
        >
          Manage Scouts <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7C6B]" />
          <input type="text" placeholder="Search player or scout..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 bg-white" />
        </div>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none">
          <option value="all">All Teams</option>
          {(teams || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck size={40} className="mx-auto text-[#D4E4D4] mb-3" />
          <p className="text-[#6B7C6B]">No evaluations match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => {
            const game = gameMap[ev.gameId];
            const avg = calcAvg(ev.ratings);
            const date = parseDate(ev.updatedAt || ev.createdAt);
            return (
              <div key={ev.id} className="bg-white rounded-xl border border-[#D4E4D4] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-800">
                        {ev.playerName || 'Unknown'}
                        {ev.playerNumber && <span className="text-[#6B7C6B] font-normal ml-1">#{ev.playerNumber}</span>}
                      </h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ev.status === 'submitted' ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#FFD700]/20 text-[#b8860b]'}`}>
                        {ev.status === 'submitted' ? 'Submitted' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7C6B] mt-0.5">Scout: {ev.scoutName || 'Unknown'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7C6B]">
                      {game && <span>vs {game.opponent || 'TBD'}</span>}
                      {date && <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(date)}</span>}
                    </div>
                  </div>
                  {avg !== null && (
                    <div className="text-center flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getScoreBadgeColor(avg)}`}>{avg}</div>
                      <p className="text-[10px] text-[#6B7C6B] mt-1">Avg</p>
                    </div>
                  )}
                </div>
                {ev.ratings && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SCOUT_METRICS.map(m => {
                      const val = ev.ratings[m.id];
                      const color = val ? (TRYOUT_LEVEL_COLORS[val] || '#94a3b8') : '#D4E4D4';
                      return (
                        <div key={m.id} className="flex items-center gap-1.5 text-xs" title={m.name}>
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                          <span className="text-[#6B7C6B]">{m.name.split(' ')[0]}</span>
                          <span className="font-medium text-gray-800">{val || '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Insights Charts */}
      <InsightsCharts playerData={chartData} metrics={SCOUT_METRICS} metricLabel="Scouting" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 3: Combined Player Profiles
// ---------------------------------------------------------------------------

const CombinedProfilesTab = ({ players, loading: dataLoading }) => {
  const [scoutEvals, setScoutEvals] = useState([]);
  const [tryoutEvals, setTryoutEvals] = useState([]);
  const [tryoutWeight, setTryoutWeight] = useState(60);
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [loadingTryouts, setLoadingTryouts] = useState(true);
  const [loadingScouts, setLoadingScouts] = useState(true);

  useEffect(() => {
    setLoadingScouts(true);
    const unsub = subscribeAllScoutEvaluations((evals) => {
      setScoutEvals(evals.filter(e => e.status === 'submitted'));
      setLoadingScouts(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingTryouts(true);
      try {
        const sessResult = await getAllTryoutSessions();
        if (!sessResult.success || !sessResult.data) { setLoadingTryouts(false); return; }
        const embeddedToMainId = {};
        for (const session of sessResult.data) {
          if (session.players) {
            for (const p of session.players) {
              if (p.linkedPlayerId) embeddedToMainId[p.id] = p.linkedPlayerId;
            }
          }
        }
        const allEvals = [];
        for (const session of sessResult.data) {
          const evalResult = await getSessionEvaluations(session.id);
          if (evalResult.success && evalResult.data) allEvals.push(...evalResult.data);
        }
        const remappedEvals = allEvals.map(e => ({
          ...e,
          playerId: embeddedToMainId[e.playerId] || e.playerId
        }));
        if (!cancelled) setTryoutEvals(remappedEvals);
      } catch (err) { console.error('Error loading tryout evaluations:', err); }
      if (!cancelled) setLoadingTryouts(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const playerScores = useMemo(() => {
    if (!players) return [];
    const tw = tryoutWeight / 100;
    return players.map(player => {
      const tryoutSummary = getPlayerSummary(tryoutEvals, player.id);
      const tryoutMetrics = {};
      let tryoutAvg = null;
      if (tryoutSummary) {
        EVAL_METRICS.forEach(m => {
          tryoutMetrics[m.id] = tryoutSummary.averages?.[m.id] ? parseFloat(tryoutSummary.averages[m.id]) : null;
        });
        const avgValues = Object.values(tryoutMetrics).filter(v => v !== null);
        if (avgValues.length > 0) tryoutAvg = +(avgValues.reduce((a, b) => a + b, 0) / avgValues.length).toFixed(1);
      }
      const playerScoutEvals = scoutEvals.filter(e => e.playerId === player.id);
      const scoutResult = calculatePlayerScoutAverage(playerScoutEvals);
      const scoutAvg = scoutResult?.overallAvg || null;
      const scoutMetrics = scoutResult?.averages || {};

      // If only tryout data, use 100% tryout; if only scout data, use 100% scout
      let combined = null;
      if (tryoutAvg !== null && scoutAvg !== null) {
        combined = calculateCombinedScore(tryoutAvg, scoutAvg, tw);
      } else if (tryoutAvg !== null) {
        combined = tryoutAvg;
      } else if (scoutAvg !== null) {
        combined = scoutAvg;
      }

      return {
        ...player,
        tryoutAvg, scoutAvg, combined,
        tryoutMetrics, scoutMetrics,
        tryoutCount: tryoutSummary?.evaluationCount || 0,
        scoutCount: playerScoutEvals.length,
      };
    })
    .filter(p => {
      if (ageGroupFilter === 'all') return true;
      return (p.ageGroup || p.age_group) === ageGroupFilter;
    })
    .filter(p => p.combined !== null)
    .sort((a, b) => (b.combined || 0) - (a.combined || 0));
  }, [players, tryoutEvals, scoutEvals, tryoutWeight, ageGroupFilter]);

  // Chart data for combined profiles — use combined metrics
  const combinedMetrics = [...EVAL_METRICS, ...SCOUT_METRICS.filter(s => !EVAL_METRICS.find(e => e.id === s.id))];
  const combinedChartData = useMemo(() => {
    return playerScores.map(p => {
      const allMetrics = {};
      EVAL_METRICS.forEach(m => { if (p.tryoutMetrics[m.id]) allMetrics[m.id] = p.tryoutMetrics[m.id]; });
      SCOUT_METRICS.forEach(m => {
        const existing = allMetrics[m.id];
        const scoutVal = p.scoutMetrics[m.id] ? parseFloat(p.scoutMetrics[m.id]) : null;
        if (existing && scoutVal) allMetrics[m.id] = +((existing + scoutVal) / 2).toFixed(1);
        else if (scoutVal) allMetrics[m.id] = scoutVal;
      });
      const playerName = p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
      return {
        id: p.id, name: playerName, number: p.number || p.jerseyNumber,
        overall: p.combined, athleticism: allMetrics.athleticism || 0,
        metrics: allMetrics
      };
    }).filter(p => p.overall > 0);
  }, [playerScores]);

  const isLoading = dataLoading || loadingTryouts || loadingScouts;

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-[#00A651]" /></div>;
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#6B7C6B]" />
            <select value={ageGroupFilter} onChange={e => setAgeGroupFilter(e.target.value)}
              className="px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30">
              <option value="all">All Age Groups</option>
              {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#005028]">Tryout {tryoutWeight}%</span>
              <span className="text-xs font-medium text-[#00A651]">Scouting {100 - tryoutWeight}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={tryoutWeight}
              onChange={e => setTryoutWeight(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#005028]"
              style={{ background: `linear-gradient(to right, #005028 ${tryoutWeight}%, #00A651 ${tryoutWeight}%)` }} />
          </div>
        </div>
      </div>

      <p className="text-sm text-[#6B7C6B] mb-3">{playerScores.length} player{playerScores.length !== 1 ? 's' : ''} with data</p>

      {playerScores.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={40} className="mx-auto text-[#D4E4D4] mb-3" />
          <p className="text-[#6B7C6B]">No players with evaluation data found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {playerScores.map((p, idx) => {
            const tier = getTierInfo(p.combined);
            const playerName = p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
            return (
              <div key={p.id} className="bg-white rounded-xl border border-[#D4E4D4] overflow-hidden">
                {/* Player Info */}
                <div className="flex items-center gap-3 p-4 border-b border-[#D4E4D4]/50">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-[#FFD700] text-[#005028]' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-[#cd7f32]/30 text-[#8b5e3c]' : 'bg-[#F5F9F5] text-[#6B7C6B]'
                  }`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm">
                      {playerName}
                      {(p.number || p.jerseyNumber) && <span className="text-[#6B7C6B] font-normal ml-1.5">#{p.number || p.jerseyNumber}</span>}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {(p.ageGroup || p.age_group) && <span className="text-xs bg-[#D4E4D4]/50 text-[#005028] px-2 py-0.5 rounded-full">{p.ageGroup || p.age_group}</span>}
                      {p.position && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.position}</span>}
                    </div>
                  </div>
                  {p.combined !== null && (
                    <span className={`inline-flex items-center justify-center w-14 h-12 rounded-xl font-bold text-lg flex-shrink-0 ${getScoreBadgeColor(p.combined)}`}>{p.combined}</span>
                  )}
                </div>

                {/* Data Sources */}
                <div className="grid grid-cols-2 divide-x divide-[#D4E4D4]/50">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#005028] uppercase tracking-wide">Tryout</span>
                      {p.tryoutAvg !== null && <span className={`text-sm font-bold ${getRatingColor(p.tryoutAvg)}`}>{p.tryoutAvg}</span>}
                    </div>
                    {p.tryoutCount > 0 ? (
                      <>
                        {EVAL_METRICS.map(m => <MetricRow key={m.id} name={m.name} value={p.tryoutMetrics[m.id]} />)}
                        <p className="text-[10px] text-[#6B7C6B] mt-1">{p.tryoutCount} eval{p.tryoutCount !== 1 ? 's' : ''}</p>
                      </>
                    ) : (
                      <p className="text-xs text-[#6B7C6B] italic py-2">No tryout data</p>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#00A651] uppercase tracking-wide">Scouting</span>
                      {p.scoutAvg !== null && <span className={`text-sm font-bold ${getRatingColor(p.scoutAvg)}`}>{p.scoutAvg}</span>}
                    </div>
                    {p.scoutCount > 0 ? (
                      <>
                        {SCOUT_METRICS.map(m => <MetricRow key={m.id} name={m.name} value={p.scoutMetrics[m.id]} />)}
                        <p className="text-[10px] text-[#6B7C6B] mt-1">{p.scoutCount} game{p.scoutCount !== 1 ? 's' : ''}</p>
                      </>
                    ) : (
                      <p className="text-xs text-[#6B7C6B] italic py-2">No scouting data</p>
                    )}
                  </div>
                </div>

                {/* Combined */}
                <div className="p-3 bg-[#F5F9F5] border-t border-[#D4E4D4]/50">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex h-3 rounded-full overflow-hidden">
                        {p.tryoutAvg !== null && <div className="bg-[#005028] transition-all" style={{ width: `${p.scoutAvg !== null ? tryoutWeight : 100}%` }} />}
                        {p.scoutAvg !== null && <div className="bg-[#00A651] transition-all" style={{ width: `${p.tryoutAvg !== null ? (100 - tryoutWeight) : 100}%` }} />}
                        {p.tryoutAvg === null && p.scoutAvg === null && <div className="bg-[#D4E4D4] w-full" />}
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-[#005028]">
                          {p.tryoutAvg !== null ? `T: ${p.tryoutAvg}${p.scoutAvg !== null ? ` × ${tryoutWeight}%` : ' (100%)'}` : 'No tryout'}
                        </span>
                        <span className="text-[10px] text-[#00A651]">
                          {p.scoutAvg !== null ? `S: ${p.scoutAvg}${p.tryoutAvg !== null ? ` × ${100 - tryoutWeight}%` : ' (100%)'}` : 'No scout'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${tier.bg} ${tier.color}`}>{tier.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Insights Charts — Combined data */}
      <InsightsCharts playerData={combinedChartData} metrics={EVAL_METRICS} metricLabel="Combined" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 4: Team Assignment
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Dynamic team colors (up to 8 teams)
// ---------------------------------------------------------------------------
const TEAM_COLOR_PALETTE = [
  { border: 'border-green-500 bg-green-50', text: 'text-green-700', btn: 'bg-green-500 text-white' },
  { border: 'border-blue-500 bg-blue-50', text: 'text-blue-700', btn: 'bg-blue-500 text-white' },
  { border: 'border-yellow-500 bg-yellow-50', text: 'text-yellow-700', btn: 'bg-yellow-500 text-white' },
  { border: 'border-purple-500 bg-purple-50', text: 'text-purple-700', btn: 'bg-purple-500 text-white' },
  { border: 'border-red-500 bg-red-50', text: 'text-red-700', btn: 'bg-red-500 text-white' },
  { border: 'border-cyan-500 bg-cyan-50', text: 'text-cyan-700', btn: 'bg-cyan-500 text-white' },
  { border: 'border-orange-500 bg-orange-50', text: 'text-orange-700', btn: 'bg-orange-500 text-white' },
  { border: 'border-pink-500 bg-pink-50', text: 'text-pink-700', btn: 'bg-pink-500 text-white' },
];

// ---------------------------------------------------------------------------
// Manage Teams Modal
// ---------------------------------------------------------------------------
const ManageTeamsModal = ({ ageGroup, teams, onSave, onClose }) => {
  const [localTeams, setLocalTeams] = useState(teams.map(t => ({ ...t })));
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const addTeam = () => {
    if (localTeams.length >= 8) return;
    const idx = localTeams.length + 1;
    setLocalTeams(prev => [...prev, { id: `team-${Date.now()}`, label: `Team ${idx}` }]);
  };

  const removeTeam = (teamId) => {
    if (localTeams.length <= 1) return;
    const team = localTeams.find(t => t.id === teamId);
    if (!window.confirm(`Remove "${team?.label}"? Players assigned to this team will become unassigned.`)) return;
    setLocalTeams(prev => prev.filter(t => t.id !== teamId));
  };

  const startEdit = (team) => {
    setEditingId(team.id);
    setEditName(team.label);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    setLocalTeams(prev => prev.map(t => t.id === editingId ? { ...t, label: editName.trim() } : t));
    setEditingId(null);
    setEditName('');
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(localTeams);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#D4E4D4]">
          <div>
            <h3 className="font-bold text-gray-800">Manage Teams</h3>
            <p className="text-xs text-[#6B7C6B]">{ageGroup === 'all' ? 'All Age Groups' : ageGroup} — {localTeams.length}/8 teams</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {localTeams.map((team, idx) => (
            <div key={team.id} className={`flex items-center gap-2 p-3 rounded-lg border ${TEAM_COLOR_PALETTE[idx % TEAM_COLOR_PALETTE.length].border}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${TEAM_COLOR_PALETTE[idx % TEAM_COLOR_PALETTE.length].btn}`}>{idx + 1}</span>
              {editingId === team.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    className="flex-1 px-2 py-1 border border-[#D4E4D4] rounded text-sm focus:outline-none focus:border-[#00A651]" autoFocus />
                  <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-800">{team.label}</span>
                  <button onClick={() => startEdit(team)} className="p-1 text-[#6B7C6B] hover:text-[#005028] hover:bg-[#F5F9F5] rounded" title="Rename"><Pencil size={14} /></button>
                  {localTeams.length > 1 && (
                    <button onClick={() => removeTeam(team.id)} className="p-1 text-[#6B7C6B] hover:text-red-500 hover:bg-red-50 rounded" title="Remove"><Trash2 size={14} /></button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[#D4E4D4] flex items-center justify-between">
          <button onClick={addTeam} disabled={localTeams.length >= 8}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#005028] hover:bg-[#F5F9F5] rounded-lg disabled:opacity-40">
            <Plus size={14} /> Add Team
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B7C6B] hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-[#005028] text-white rounded-lg hover:bg-[#00A651] disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Teams'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 4: Team Assignment
// ---------------------------------------------------------------------------

const TeamAssignmentTab = ({ players, teams: dbTeams, loading: dataLoading }) => {
  const [scoutEvals, setScoutEvals] = useState([]);
  const [tryoutEvals, setTryoutEvals] = useState([]);
  const [tryoutWeight, setTryoutWeight] = useState(60);
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [loadingTryouts, setLoadingTryouts] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [loadingScouts, setLoadingScouts] = useState(true);
  const [assignments, setAssignments] = useState({}); // playerId -> teamId
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [selectionTeamsMap, setSelectionTeamsMap] = useState({}); // ageGroup -> [{ id, label }]
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Subscribe to selection_teams collection from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'selection_teams'), (snap) => {
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[d.id] = (data.teams || []).map(t => ({ id: t.id, label: t.label }));
      });
      setSelectionTeamsMap(map);
      setLoadingTeams(false);
    }, () => setLoadingTeams(false));
    return unsub;
  }, []);

  // Get active team options for current age group filter
  const activeTeamOptions = useMemo(() => {
    const ag = ageGroupFilter;
    if (ag !== 'all' && selectionTeamsMap[ag]?.length > 0) return selectionTeamsMap[ag];
    // Fallback: check if there's a default config or use TEAM_OPTIONS
    if (selectionTeamsMap['default']?.length > 0) return selectionTeamsMap['default'];
    // If nothing saved yet, use static defaults
    return TEAM_OPTIONS;
  }, [ageGroupFilter, selectionTeamsMap]);

  // Build color maps for active teams
  const teamColorMap = useMemo(() => {
    const colors = {};
    const textColors = {};
    const btnColors = {};
    activeTeamOptions.forEach((t, i) => {
      const c = TEAM_COLOR_PALETTE[i % TEAM_COLOR_PALETTE.length];
      colors[t.id] = c.border;
      textColors[t.id] = c.text;
      btnColors[t.id] = c.btn;
    });
    return { colors, textColors, btnColors };
  }, [activeTeamOptions]);

  const handleSaveTeams = async (teams) => {
    const ag = ageGroupFilter === 'all' ? 'default' : ageGroupFilter;
    await setDoc(doc(db, 'selection_teams', ag), { teams, updatedAt: new Date().toISOString() });
    // Unassign players from removed teams
    const validIds = new Set(teams.map(t => t.id));
    setAssignments(prev => {
      const next = { ...prev };
      Object.entries(next).forEach(([pid, tid]) => {
        if (!validIds.has(tid)) delete next[pid];
      });
      return next;
    });
  };

  useEffect(() => {
    setLoadingScouts(true);
    const unsub = subscribeAllScoutEvaluations((evals) => {
      setScoutEvals(evals.filter(e => e.status === 'submitted'));
      setLoadingScouts(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingTryouts(true);
      try {
        const sessResult = await getAllTryoutSessions();
        if (!sessResult.success || !sessResult.data) { setLoadingTryouts(false); return; }
        const embeddedToMainId = {};
        for (const session of sessResult.data) {
          if (session.players) {
            for (const p of session.players) {
              if (p.linkedPlayerId) embeddedToMainId[p.id] = p.linkedPlayerId;
            }
          }
        }
        const allEvals = [];
        for (const session of sessResult.data) {
          const evalResult = await getSessionEvaluations(session.id);
          if (evalResult.success && evalResult.data) allEvals.push(...evalResult.data);
        }
        if (!cancelled) setTryoutEvals(allEvals.map(e => ({ ...e, playerId: embeddedToMainId[e.playerId] || e.playerId })));
      } catch (err) { console.error(err); }
      if (!cancelled) setLoadingTryouts(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const playerScores = useMemo(() => {
    if (!players) return [];
    const tw = tryoutWeight / 100;
    return players.map(player => {
      const tryoutSummary = getPlayerSummary(tryoutEvals, player.id);
      const tryoutMetrics = {};
      let tryoutAvg = null;
      if (tryoutSummary) {
        EVAL_METRICS.forEach(m => { tryoutMetrics[m.id] = tryoutSummary.averages?.[m.id] ? parseFloat(tryoutSummary.averages[m.id]) : null; });
        const avgValues = Object.values(tryoutMetrics).filter(v => v !== null);
        if (avgValues.length > 0) tryoutAvg = +(avgValues.reduce((a, b) => a + b, 0) / avgValues.length).toFixed(1);
      }
      const playerScoutEvals = scoutEvals.filter(e => e.playerId === player.id);
      const scoutResult = calculatePlayerScoutAverage(playerScoutEvals);
      const scoutAvg = scoutResult?.overallAvg || null;
      const scoutMetrics = scoutResult?.averages || {};
      let combined = null;
      if (tryoutAvg !== null && scoutAvg !== null) combined = calculateCombinedScore(tryoutAvg, scoutAvg, tw);
      else if (tryoutAvg !== null) combined = tryoutAvg;
      else if (scoutAvg !== null) combined = scoutAvg;
      return { ...player, tryoutAvg, scoutAvg, combined, tryoutMetrics, scoutMetrics, tryoutCount: tryoutSummary?.evaluationCount || 0, scoutCount: playerScoutEvals.length };
    })
    .filter(p => {
      if (ageGroupFilter === 'all') return true;
      return (p.ageGroup || p.age_group) === ageGroupFilter;
    })
    .filter(p => p.combined !== null)
    .sort((a, b) => (b.combined || 0) - (a.combined || 0));
  }, [players, tryoutEvals, scoutEvals, tryoutWeight, ageGroupFilter]);

  // Age group averages for comparison
  const ageGroupAvgs = useMemo(() => {
    const groups = {};
    playerScores.forEach(p => {
      const ag = p.ageGroup || p.age_group || 'Unknown';
      if (!groups[ag]) groups[ag] = { tryoutMetrics: {}, scoutMetrics: {}, combinedScores: [], counts: {} };
      EVAL_METRICS.forEach(m => {
        if (p.tryoutMetrics[m.id]) {
          if (!groups[ag].tryoutMetrics[m.id]) groups[ag].tryoutMetrics[m.id] = [];
          groups[ag].tryoutMetrics[m.id].push(p.tryoutMetrics[m.id]);
        }
      });
      SCOUT_METRICS.forEach(m => {
        const v = p.scoutMetrics[m.id] ? parseFloat(p.scoutMetrics[m.id]) : null;
        if (v) {
          if (!groups[ag].scoutMetrics[m.id]) groups[ag].scoutMetrics[m.id] = [];
          groups[ag].scoutMetrics[m.id].push(v);
        }
      });
      if (p.combined) groups[ag].combinedScores.push(p.combined);
    });
    const result = {};
    Object.entries(groups).forEach(([ag, data]) => {
      const tryoutAvgs = {};
      Object.entries(data.tryoutMetrics).forEach(([k, vals]) => { tryoutAvgs[k] = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1); });
      const scoutAvgs = {};
      Object.entries(data.scoutMetrics).forEach(([k, vals]) => { scoutAvgs[k] = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1); });
      const combinedAvg = data.combinedScores.length > 0 ? +(data.combinedScores.reduce((a, b) => a + b, 0) / data.combinedScores.length).toFixed(1) : null;
      result[ag] = { tryoutAvgs, scoutAvgs, combinedAvg };
    });
    return result;
  }, [playerScores]);

  const assignPlayer = (playerId, teamId) => {
    setAssignments(prev => {
      if (prev[playerId] === teamId) {
        const next = { ...prev };
        delete next[playerId];
        return next;
      }
      return { ...prev, [playerId]: teamId };
    });
  };

  const teamStats = useMemo(() => {
    const stats = {};
    activeTeamOptions.forEach(t => { stats[t.id] = { count: 0, totalScore: 0 }; });
    Object.entries(assignments).forEach(([playerId, teamId]) => {
      const player = playerScores.find(p => p.id === playerId);
      if (player && stats[teamId]) {
        stats[teamId].count++;
        stats[teamId].totalScore += player.combined || 0;
      }
    });
    return stats;
  }, [assignments, playerScores, activeTeamOptions]);

  const handleExport = () => {
    const sw = 100 - tryoutWeight;
    let html = `<html><head><title>Team Assignment Report</title><style>
      body{font-family:Arial,sans-serif;padding:20px;color:#333}
      h1{color:#005028;font-size:22px} h2{font-size:16px;color:#005028;margin-top:20px;border-bottom:2px solid #D4E4D4;padding-bottom:4px}
      h3{font-size:13px;color:#6B7C6B;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
      th{background:#F5F9F5;border:1px solid #D4E4D4;padding:6px;text-align:center;font-size:10px;text-transform:uppercase;color:#6B7C6B}
      th:first-child{text-align:left}
      td{border:1px solid #D4E4D4;padding:6px;text-align:center}
      td:first-child{text-align:left}
      .summary{margin-top:8px;padding:8px;background:#F5F9F5;border-radius:4px;font-size:12px}
      @media print{body{padding:0}h1{margin-top:0}}
    </style></head><body>`;
    html += `<h1>Emerald Lakers — Team Assignment Report</h1>`;
    html += `<h3>Weighting: Tryout ${tryoutWeight}% / Scouting ${sw}%${ageGroupFilter !== 'all' ? ` | Age Group: ${ageGroupFilter}` : ''}</h3>`;

    activeTeamOptions.forEach(team => {
      const teamPlayers = playerScores.filter(p => assignments[p.id] === team.id);
      const stats = teamStats[team.id];
      html += `<h2>${team.label} (${stats.count} players)</h2>`;
      if (teamPlayers.length === 0) {
        html += `<p style="color:#6B7C6B;font-style:italic">No players assigned</p>`;
        return;
      }
      html += `<div class="summary">Team Average: <strong>${stats.count > 0 ? (stats.totalScore / stats.count).toFixed(1) : '—'}</strong></div>`;
      html += `<table><thead><tr><th>Player</th><th>Age Group</th><th>Tryout Avg</th><th>Scout Avg</th><th>Combined</th><th>Tier</th></tr></thead><tbody>`;
      teamPlayers.forEach(p => {
        const tier = getTierInfo(p.combined);
        const name = p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
        html += `<tr><td>${name}${p.number || p.jerseyNumber ? ` #${p.number || p.jerseyNumber}` : ''}</td>`;
        html += `<td>${p.ageGroup || p.age_group || '—'}</td>`;
        html += `<td>${p.tryoutAvg ?? '—'}</td><td>${p.scoutAvg ?? '—'}</td>`;
        html += `<td><strong>${p.combined ?? '—'}</strong></td><td>${tier.label}</td></tr>`;
      });
      html += `</tbody></table>`;
    });

    // Unassigned
    const unassigned = playerScores.filter(p => !assignments[p.id]);
    if (unassigned.length > 0) {
      html += `<h2>Unassigned (${unassigned.length} players)</h2>`;
      html += `<table><thead><tr><th>Player</th><th>Age Group</th><th>Combined</th><th>Tier</th></tr></thead><tbody>`;
      unassigned.forEach(p => {
        const tier = getTierInfo(p.combined);
        const name = p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
        html += `<tr><td>${name}</td><td>${p.ageGroup || p.age_group || '—'}</td><td>${p.combined ?? '—'}</td><td>${tier.label}</td></tr>`;
      });
      html += `</tbody></table>`;
    }

    html += `<p style="margin-top:16px;font-size:11px;color:#6B7C6B">Generated ${new Date().toLocaleDateString('en-AU')} — Emerald Lakers Sixth Man</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) { w.onload = () => { URL.revokeObjectURL(url); w.print(); }; }
  };

  const isLoading = dataLoading || loadingTryouts || loadingScouts || loadingTeams;
  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-[#00A651]" /></div>;

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#6B7C6B]" />
            <select value={ageGroupFilter} onChange={e => setAgeGroupFilter(e.target.value)}
              className="px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none">
              <option value="all">All Age Groups</option>
              {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowManageTeams(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#D4E4D4] text-[#005028] rounded-lg text-sm font-medium hover:bg-[#F5F9F5] transition-colors">
            <Settings size={14} /> Manage Teams ({activeTeamOptions.length})
          </button>
          <button onClick={handleExport} disabled={Object.keys(assignments).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
            <Download size={14} /> Export Selection Report
          </button>
        </div>
      </div>

      {/* Team composition summary */}
      <div className={`grid gap-3 mb-4`} style={{ gridTemplateColumns: `repeat(${Math.min(activeTeamOptions.length, 4)}, 1fr)` }}>
        {activeTeamOptions.map((team, idx) => {
          const stats = teamStats[team.id] || { count: 0, totalScore: 0 };
          const avg = stats.count > 0 ? (stats.totalScore / stats.count).toFixed(1) : '—';
          return (
            <div key={team.id} className={`rounded-xl border-2 p-3 ${teamColorMap.colors[team.id]}`}>
              <h4 className={`font-bold text-sm ${teamColorMap.textColors[team.id]}`}>{team.label}</h4>
              <p className="text-xs text-[#6B7C6B] mt-1">{stats.count} player{stats.count !== 1 ? 's' : ''}</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{avg}</p>
              <p className="text-[10px] text-[#6B7C6B]">avg score</p>
            </div>
          );
        })}
      </div>

      {/* Player list with assignment buttons */}
      <p className="text-sm text-[#6B7C6B] mb-3">{playerScores.length} player{playerScores.length !== 1 ? 's' : ''}</p>

      <div className="space-y-2">
        {playerScores.map((p, idx) => {
          const playerName = p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
          const tier = getTierInfo(p.combined);
          const currentTeam = assignments[p.id];
          const isExpanded = expandedPlayer === p.id;
          const ag = p.ageGroup || p.age_group || 'Unknown';
          const agAvg = ageGroupAvgs[ag];

          return (
            <div key={p.id} className={`bg-white rounded-xl border overflow-hidden transition-colors ${currentTeam ? `${teamColorMap.colors[currentTeam]} border-2` : 'border-[#D4E4D4]'}`}>
              {/* Collapsed row */}
              <div className="flex items-center gap-3 p-3">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                  idx === 0 ? 'bg-[#FFD700] text-[#005028]' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-[#cd7f32]/30 text-[#8b5e3c]' : 'bg-[#F5F9F5] text-[#6B7C6B]'
                }`}>{idx + 1}</span>
                <button onClick={() => setExpandedPlayer(isExpanded ? null : p.id)} className="flex-1 min-w-0 text-left">
                  <h4 className="font-semibold text-gray-800 text-sm truncate">
                    {playerName}
                    {(p.number || p.jerseyNumber) && <span className="text-[#6B7C6B] font-normal ml-1">#{p.number || p.jerseyNumber}</span>}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#6B7C6B]">
                    {ag !== 'Unknown' && <span>{ag}</span>}
                    <span className="font-semibold">Combined Score: <span className={getRatingColor(p.combined)}>{p.combined}</span></span>
                    <span className={tier.color}>{tier.label}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                </button>
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end" style={{ maxWidth: activeTeamOptions.length > 4 ? '160px' : undefined }}>
                  {activeTeamOptions.map((team, tIdx) => (
                    <button
                      key={team.id}
                      onClick={() => assignPlayer(p.id, team.id)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                        currentTeam === team.id
                          ? `${teamColorMap.btnColors[team.id]} ring-2 ring-offset-1 ring-gray-300`
                          : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] hover:border-gray-400'
                      }`}
                      title={`Assign to ${team.label}`}
                    >
                      {tIdx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-[#D4E4D4]/50 p-4 space-y-4 bg-[#F5F9F5]/50">
                  {/* Tryout Data */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold text-[#005028] uppercase tracking-wide">Tryout Data</h5>
                      <span className="text-[10px] text-[#6B7C6B]">{p.tryoutCount} eval{p.tryoutCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {EVAL_METRICS.map(m => {
                        const val = p.tryoutMetrics[m.id];
                        const avg = agAvg?.tryoutAvgs?.[m.id];
                        const diff = val && avg ? (val - avg).toFixed(1) : null;
                        return (
                          <div key={m.id} className="bg-white rounded-lg p-2 text-center border border-[#D4E4D4]/30">
                            <p className="text-[10px] text-[#6B7C6B] truncate">{m.name}</p>
                            <p className={`text-sm font-bold ${val ? getRatingColor(val) : 'text-[#D4E4D4]'}`}>{val ?? '—'}</p>
                            {avg && <p className="text-[9px] text-[#6B7C6B]">avg {avg}{diff && <span className={parseFloat(diff) >= 0 ? 'text-green-600' : 'text-red-500'}> {parseFloat(diff) >= 0 ? '↑' : '↓'}</span>}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scouting Data */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold text-[#00A651] uppercase tracking-wide">Scouting Data</h5>
                      <span className="text-[10px] text-[#6B7C6B]">{p.scoutCount} game{p.scoutCount !== 1 ? 's' : ''} scouted</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {SCOUT_METRICS.map(m => {
                        const val = p.scoutMetrics[m.id] ? parseFloat(p.scoutMetrics[m.id]) : null;
                        const avg = agAvg?.scoutAvgs?.[m.id];
                        const diff = val && avg ? (val - avg).toFixed(1) : null;
                        return (
                          <div key={m.id} className="bg-white rounded-lg p-2 text-center border border-[#D4E4D4]/30">
                            <p className="text-[10px] text-[#6B7C6B] truncate">{m.name}</p>
                            <p className={`text-sm font-bold ${val ? getRatingColor(val) : 'text-[#D4E4D4]'}`}>{val ? val.toFixed(1) : '—'}</p>
                            {avg && <p className="text-[9px] text-[#6B7C6B]">avg {avg}{diff && <span className={parseFloat(diff) >= 0 ? 'text-green-600' : 'text-red-500'}> {parseFloat(diff) >= 0 ? '↑' : '↓'}</span>}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Combined Summary */}
                  <div className="bg-white rounded-lg p-3 border border-[#D4E4D4]/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-700">Combined Score: </span>
                        <span className={`text-lg font-bold ${getRatingColor(p.combined)}`}>{p.combined}</span>
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
                      </div>
                      <div className="text-right text-[10px] text-[#6B7C6B]">
                        <p>Tryout: {p.tryoutAvg ?? '—'} × {p.scoutAvg !== null && p.tryoutAvg !== null ? `${tryoutWeight}%` : p.tryoutAvg !== null ? '100%' : '—'}</p>
                        <p>Scout: {p.scoutAvg ?? '—'} × {p.tryoutAvg !== null && p.scoutAvg !== null ? `${100 - tryoutWeight}%` : p.scoutAvg !== null ? '100%' : '—'}</p>
                      </div>
                    </div>
                    {agAvg?.combinedAvg && (
                      <p className="text-[10px] text-[#6B7C6B] mt-1">
                        Age group average: {agAvg.combinedAvg}
                        {p.combined && <span className={p.combined >= agAvg.combinedAvg ? ' text-green-600' : ' text-red-500'}> ({p.combined >= agAvg.combinedAvg ? '+' : ''}{(p.combined - agAvg.combinedAvg).toFixed(1)})</span>}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manage Teams Modal */}
      {showManageTeams && (
        <ManageTeamsModal
          ageGroup={ageGroupFilter}
          teams={activeTeamOptions}
          onSave={handleSaveTeams}
          onClose={() => setShowManageTeams(false)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const TeamSelectionPage = () => {
  const { games, players, teams, loading } = useData();
  const [activeTab, setActiveTab] = useState('tryouts');

  return (
    <PageShell
      title="Team Selection"
      subtitle="Tryout results, scouting data, and team assignment"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Assessments & Selection', url: '/admin/assessments-hub' },
        { label: 'Team Selection' },
      ]}
      backTo="/admin/assessments-hub"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-[#D4E4D4] p-1 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#005028] text-white shadow-sm'
                  : 'text-[#6B7C6B] hover:bg-[#F5F9F5] hover:text-gray-800'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'tryouts' && <TryoutResultsTab />}
      {activeTab === 'scouting' && <GameScoutingTab games={games} teams={teams} />}
      {activeTab === 'combined' && <CombinedProfilesTab players={players} loading={loading} />}
      {activeTab === 'assignment' && <TeamAssignmentTab players={players} teams={teams} loading={loading} />}
    </PageShell>
  );
};

export default TeamSelectionPage;
