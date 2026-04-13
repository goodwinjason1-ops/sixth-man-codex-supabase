import React, { useState, useEffect, useMemo } from 'react';
import PageShell from '../../components/PageShell';
import { useData } from '../../contexts/DataContext';
import {
  assignScoutsToGame,
  fetchPotentialScouts,
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
  EVAL_METRICS
} from '../../services/tryoutService';
import {
  Users, Eye, Search, Filter, ChevronRight, Plus, X, Check, Loader2,
  Calendar, Clock, MapPin, ClipboardCheck, Trophy, BarChart3, Download
} from 'lucide-react';

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
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const fmtTime = (t) => {
  if (!t) return '';
  if (typeof t === 'string' && t.includes(':')) {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  }
  return t;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

const getRatingBg = (value) => {
  if (!value) return 'bg-[#D4E4D4]/30';
  const v = parseFloat(value);
  if (v >= 4.5) return 'bg-[#005028]/20';
  if (v >= 3.5) return 'bg-[#2563eb]/20';
  if (v >= 2.5) return 'bg-[#eab308]/20';
  if (v >= 1.5) return 'bg-[#f59e0b]/20';
  return 'bg-[#94a3b8]/20';
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

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'assign', label: 'Assign Scouts', icon: Users },
  { key: 'reports', label: 'Scouting Reports', icon: Eye },
  { key: 'selection', label: 'Team Selection', icon: Trophy },
];

// ---------------------------------------------------------------------------
// Scout Assignment Modal
// ---------------------------------------------------------------------------

const ScoutAssignmentModal = ({ game, teams, onClose }) => {
  const [potentialScouts, setPotentialScouts] = useState([]);
  const [selectedScouts, setSelectedScouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingScouts, setLoadingScouts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingScouts(true);
      const scouts = await fetchPotentialScouts();
      if (!cancelled) {
        setPotentialScouts(scouts);
        // Pre-select existing scouts
        const existing = (game.scouts || []).map(s =>
          typeof s === 'string' ? s : (s.email || s.userId || '')
        );
        setSelectedScouts(
          scouts.filter(sc =>
            existing.includes(sc.email) || existing.includes(sc.id)
          )
        );
        setLoadingScouts(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [game]);

  const toggleScout = (scout) => {
    setSelectedScouts(prev => {
      const exists = prev.find(s => s.id === scout.id);
      if (exists) return prev.filter(s => s.id !== scout.id);
      return [...prev, scout];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const scoutsPayload = selectedScouts.map(s => ({
      email: s.email,
      userId: s.id,
      displayName: s.displayName,
    }));
    await assignScoutsToGame(game.id, scoutsPayload);
    setSaving(false);
    onClose();
  };

  const filtered = potentialScouts.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (s.displayName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q)
    );
  });

  const teamName = teams?.find(t => t.id === game.teamId)?.name || game.teamName || 'Unknown Team';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#D4E4D4] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Manage Scouts</h3>
            <p className="text-sm text-[#6B7C6B]">
              {teamName} vs {game.opponent || 'TBD'} — {fmtDate(parseDate(game.date))}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#D4E4D4]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 bg-[#F5F9F5]"
            />
          </div>
          <p className="text-xs text-[#6B7C6B] mt-2">
            {selectedScouts.length} scout{selectedScouts.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loadingScouts ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-[#00A651]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[#6B7C6B] text-sm py-10">No users found.</p>
          ) : (
            filtered.map(scout => {
              const isSelected = selectedScouts.some(s => s.id === scout.id);
              return (
                <button
                  key={scout.id}
                  onClick={() => toggleScout(scout)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-[#00A651]/10 border border-[#00A651]/30'
                      : 'hover:bg-[#F5F9F5] border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected ? 'bg-[#00A651] text-white' : 'bg-[#D4E4D4] text-[#005028]'
                  }`}>
                    {isSelected ? <Check size={16} /> : (scout.displayName?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {scout.displayName || 'No Name'}
                    </p>
                    <p className="text-xs text-[#6B7C6B] truncate">{scout.email}</p>
                  </div>
                  {scout.role && (
                    <span className="text-xs bg-[#D4E4D4]/50 text-[#6B7C6B] px-2 py-0.5 rounded-full">
                      {scout.role}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D4E4D4] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-[#D4E4D4] text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 px-4 rounded-lg bg-[#005028] text-white text-sm font-medium hover:bg-[#003d1e] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 1: Assign Scouts
// ---------------------------------------------------------------------------

const AssignScoutsTab = ({ games, teams, loading }) => {
  const [modalGame, setModalGame] = useState(null);

  const today = todayStr();

  const upcomingGames = useMemo(() => {
    if (!games) return [];
    return games
      .filter(g => {
        // Only include games (not training etc.)
        if (g.type && g.type !== 'game') return false;
        // Future or today
        const dateStr = typeof g.date === 'string'
          ? g.date
          : parseDate(g.date)?.toISOString().split('T')[0];
        return dateStr >= today;
      })
      .sort((a, b) => {
        const dA = parseDate(a.date);
        const dB = parseDate(b.date);
        return (dA || 0) - (dB || 0);
      });
  }, [games, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-[#00A651]" />
      </div>
    );
  }

  return (
    <div>
      {upcomingGames.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={40} className="mx-auto text-[#D4E4D4] mb-3" />
          <p className="text-[#6B7C6B]">No upcoming games found.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingGames.map(game => {
            const teamName = teams?.find(t => t.id === game.teamId)?.name || game.teamName || 'Unknown';
            const date = parseDate(game.date);
            const scoutCount = (game.scouts || []).length;

            return (
              <div
                key={game.id}
                className="bg-white rounded-xl border border-[#D4E4D4] p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{teamName}</h4>
                    <p className="text-sm text-[#6B7C6B]">vs {game.opponent || 'TBD'}</p>
                  </div>
                  {scoutCount > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-[#00A651]/10 text-[#00A651] px-2 py-1 rounded-full">
                      <Users size={12} />
                      {scoutCount}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-[#6B7C6B]">
                    <Calendar size={14} />
                    <span>{fmtDate(date)}</span>
                  </div>
                  {game.time && (
                    <div className="flex items-center gap-2 text-sm text-[#6B7C6B]">
                      <Clock size={14} />
                      <span>{fmtTime(game.time)}</span>
                    </div>
                  )}
                  {game.venue && (
                    <div className="flex items-center gap-2 text-sm text-[#6B7C6B]">
                      <MapPin size={14} />
                      <span className="truncate">{game.venue}</span>
                    </div>
                  )}
                </div>

                {/* Assigned scouts */}
                {scoutCount > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {game.scouts.map((s, i) => {
                      const name = typeof s === 'string' ? s : (s.displayName || s.email || 'Scout');
                      return (
                        <span
                          key={i}
                          className="text-xs bg-[#D4E4D4]/50 text-[#005028] px-2 py-0.5 rounded-full"
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setModalGame(game)}
                  className="w-full py-2 rounded-lg border border-[#005028] text-[#005028] text-sm font-medium hover:bg-[#005028] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Users size={14} />
                  Manage Scouts
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modalGame && (
        <ScoutAssignmentModal
          game={modalGame}
          teams={teams}
          onClose={() => setModalGame(null)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 2: Scouting Reports
// ---------------------------------------------------------------------------

const ScoutingReportsTab = ({ games, teams }) => {
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

  // Build lookup maps
  const gameMap = useMemo(() => {
    const m = {};
    (games || []).forEach(g => { m[g.id] = g; });
    return m;
  }, [games]);

  const teamMap = useMemo(() => {
    const m = {};
    (teams || []).forEach(t => { m[t.id] = t; });
    return m;
  }, [teams]);

  // Unique scout names and teams for filters
  const scoutNames = useMemo(() => {
    const s = new Set();
    evaluations.forEach(e => { if (e.scoutName) s.add(e.scoutName); });
    return [...s].sort();
  }, [evaluations]);

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

  if (loadingEvals) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-[#00A651]" />
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7C6B]" />
          <input
            type="text"
            placeholder="Search by player or scout name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 bg-white"
          />
        </div>
        <select
          value={teamFilter}
          onChange={e => setTeamFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30"
        >
          <option value="all">All Teams</option>
          {(teams || []).map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#6B7C6B] mb-3">
        {filtered.length} evaluation{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Evaluations list */}
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
              <div
                key={ev.id}
                className="bg-white rounded-xl border border-[#D4E4D4] p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-800">
                        {ev.playerName || 'Unknown Player'}
                        {ev.playerNumber && (
                          <span className="text-[#6B7C6B] font-normal ml-1">#{ev.playerNumber}</span>
                        )}
                      </h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ev.status === 'submitted'
                          ? 'bg-[#00A651]/10 text-[#00A651]'
                          : 'bg-[#FFD700]/20 text-[#b8860b]'
                      }`}>
                        {ev.status === 'submitted' ? 'Submitted' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7C6B] mt-0.5">
                      Scout: {ev.scoutName || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7C6B]">
                      {game && (
                        <span>vs {game.opponent || 'TBD'}</span>
                      )}
                      {date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {fmtDate(date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Average badge */}
                  <div className="text-center flex-shrink-0">
                    {avg !== null ? (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getScoreBadgeColor(avg)}`}>
                        {avg}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 text-[#6B7C6B] text-xs">
                        N/A
                      </div>
                    )}
                    <p className="text-[10px] text-[#6B7C6B] mt-1">Avg</p>
                  </div>
                </div>

                {/* Metric breakdown */}
                {ev.ratings && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SCOUT_METRICS.map(m => {
                      const val = ev.ratings[m.id];
                      const color = val ? (TRYOUT_LEVEL_COLORS[val] || '#94a3b8') : '#D4E4D4';
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-1.5 text-xs"
                          title={m.name}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[#6B7C6B]">{m.name.split(' ')[0]}</span>
                          <span className="font-medium text-gray-800">{val || '-'}</span>
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
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 3: Team Selection (Combined View)
// ---------------------------------------------------------------------------

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
      <span className="text-xs text-[#D4E4D4] min-w-[2rem] text-right">-</span>
    )}
  </div>
);

const TeamSelectionTab = ({ players, games, teams, loading: dataLoading }) => {
  const [scoutEvals, setScoutEvals] = useState([]);
  const [tryoutEvals, setTryoutEvals] = useState([]);
  const [tryoutWeight, setTryoutWeight] = useState(60);
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [loadingTryouts, setLoadingTryouts] = useState(true);
  const [loadingScouts, setLoadingScouts] = useState(true);

  // Subscribe to scout evaluations
  useEffect(() => {
    setLoadingScouts(true);
    const unsub = subscribeAllScoutEvaluations((evals) => {
      setScoutEvals(evals.filter(e => e.status === 'submitted'));
      setLoadingScouts(false);
    });
    return unsub;
  }, []);

  // Fetch all tryout evaluations and remap player IDs
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingTryouts(true);
      try {
        const sessResult = await getAllTryoutSessions();
        if (!sessResult.success || !sessResult.data) {
          setLoadingTryouts(false);
          return;
        }

        const embeddedToMainId = {};
        for (const session of sessResult.data) {
          if (session.players) {
            for (const p of session.players) {
              if (p.linkedPlayerId) {
                embeddedToMainId[p.id] = p.linkedPlayerId;
              }
            }
          }
        }

        const allEvals = [];
        for (const session of sessResult.data) {
          const evalResult = await getSessionEvaluations(session.id);
          if (evalResult.success && evalResult.data) {
            allEvals.push(...evalResult.data);
          }
        }

        const remappedEvals = allEvals.map(e => ({
          ...e,
          playerId: embeddedToMainId[e.playerId] || e.playerId
        }));

        if (!cancelled) setTryoutEvals(remappedEvals);
      } catch (err) {
        console.error('Error loading tryout evaluations:', err);
      }
      if (!cancelled) setLoadingTryouts(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Build player score data with per-metric breakdowns
  const playerScores = useMemo(() => {
    if (!players) return [];
    const tw = tryoutWeight / 100;

    return players.map(player => {
      // Tryout per-metric averages
      const tryoutSummary = getPlayerSummary(tryoutEvals, player.id);
      const tryoutMetrics = {};
      let tryoutAvg = null;
      if (tryoutSummary) {
        EVAL_METRICS.forEach(m => {
          tryoutMetrics[m.id] = tryoutSummary.averages?.[m.id] ? parseFloat(tryoutSummary.averages[m.id]) : null;
        });
        const avgValues = Object.values(tryoutMetrics).filter(v => v !== null);
        if (avgValues.length > 0) {
          tryoutAvg = +(avgValues.reduce((a, b) => a + b, 0) / avgValues.length).toFixed(1);
        }
      }

      // Scout per-metric averages
      const playerScoutEvals = scoutEvals.filter(e => e.playerId === player.id);
      const scoutResult = calculatePlayerScoutAverage(playerScoutEvals);
      const scoutAvg = scoutResult?.overallAvg || null;
      const scoutMetrics = scoutResult?.averages || {};

      // Combined score
      const combined = calculateCombinedScore(tryoutAvg, scoutAvg, tw);

      return {
        ...player,
        tryoutAvg,
        scoutAvg,
        combined,
        tryoutMetrics,
        scoutMetrics,
        tryoutCount: tryoutSummary?.evaluationCount || 0,
        scoutCount: playerScoutEvals.length,
      };
    })
    .filter(p => {
      if (ageGroupFilter === 'all') return true;
      return (p.ageGroup || p.age_group) === ageGroupFilter;
    })
    .sort((a, b) => (b.combined || 0) - (a.combined || 0));
  }, [players, tryoutEvals, scoutEvals, tryoutWeight, ageGroupFilter]);

  const isLoading = dataLoading || loadingTryouts || loadingScouts;

  // Export report
  const handleExport = () => {
    const sw = 100 - tryoutWeight;
    let html = `<html><head><title>Team Selection Report</title><style>
      body{font-family:Arial,sans-serif;padding:20px;color:#333}
      h1{color:#005028;font-size:22px}
      h2{font-size:14px;color:#6B7C6B;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
      th{background:#F5F9F5;border:1px solid #D4E4D4;padding:8px;text-align:center;font-size:11px;text-transform:uppercase;color:#6B7C6B}
      th:first-child,th:nth-child(2){text-align:left}
      td{border:1px solid #D4E4D4;padding:8px;text-align:center}
      td:first-child,td:nth-child(2){text-align:left}
      .tier{font-weight:bold;padding:2px 8px;border-radius:4px;font-size:11px}
      .exceptional{background:#005028;color:#fff}
      .strong{background:#2563eb;color:#fff}
      .developing{background:#eab308;color:#fff}
      .foundational{background:#f59e0b;color:#fff}
      @media print{body{padding:0}h1{margin-top:0}}
    </style></head><body>`;
    html += `<h1>Emerald Lakers — Team Selection Report</h1>`;
    html += `<h2>Weighting: Tryout ${tryoutWeight}% / Scouting ${sw}%${ageGroupFilter !== 'all' ? ` | Age Group: ${ageGroupFilter}` : ''}</h2>`;
    html += `<table><thead><tr><th>#</th><th>Player</th><th>Age Group</th>`;
    EVAL_METRICS.forEach(m => { html += `<th>T: ${m.name.split(' ')[0]}</th>`; });
    html += `<th>Tryout Avg</th>`;
    SCOUT_METRICS.forEach(m => { html += `<th>S: ${m.name.split(' ')[0]}</th>`; });
    html += `<th>Scout Avg</th><th>Combined</th><th>Tier</th></tr></thead><tbody>`;

    playerScores.forEach((p, idx) => {
      const tier = getTierInfo(p.combined);
      const tierCls = tier.label.toLowerCase();
      html += `<tr><td>${idx + 1}</td>`;
      html += `<td>${p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown'}${p.number || p.jerseyNumber ? ` #${p.number || p.jerseyNumber}` : ''}</td>`;
      html += `<td>${p.ageGroup || p.age_group || '-'}</td>`;
      EVAL_METRICS.forEach(m => { html += `<td>${p.tryoutMetrics[m.id] ?? '-'}</td>`; });
      html += `<td><strong>${p.tryoutAvg ?? '-'}</strong></td>`;
      SCOUT_METRICS.forEach(m => { html += `<td>${p.scoutMetrics[m.id] ?? '-'}</td>`; });
      html += `<td><strong>${p.scoutAvg ?? '-'}</strong></td>`;
      html += `<td><strong>${p.combined ?? '-'}</strong></td>`;
      html += `<td><span class="tier ${tierCls}">${tier.label}</span></td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    html += `<p style="margin-top:16px;font-size:11px;color:#6B7C6B">Generated ${new Date().toLocaleDateString('en-AU')} — Emerald Lakers Sixth Man</p>`;
    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      w.onload = () => { URL.revokeObjectURL(url); w.print(); };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-[#00A651]" />
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-xl border border-[#D4E4D4] p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#6B7C6B]" />
            <select
              value={ageGroupFilter}
              onChange={e => setAgeGroupFilter(e.target.value)}
              className="px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30"
            >
              <option value="all">All Age Groups</option>
              {AGE_GROUPS.map(ag => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#005028]">Tryout {tryoutWeight}%</span>
              <span className="text-xs font-medium text-[#00A651]">Scouting {100 - tryoutWeight}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={tryoutWeight}
              onChange={e => setTryoutWeight(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#005028]"
              style={{
                background: `linear-gradient(to right, #005028 ${tryoutWeight}%, #00A651 ${tryoutWeight}%)`
              }}
            />
          </div>

          <button
            onClick={handleExport}
            disabled={playerScores.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#6B7C6B] mb-3">
        {playerScores.length} player{playerScores.length !== 1 ? 's' : ''}
      </p>

      {playerScores.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={40} className="mx-auto text-[#D4E4D4] mb-3" />
          <p className="text-[#6B7C6B]">No players found for the selected age group.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {playerScores.map((p, idx) => {
            const tier = getTierInfo(p.combined);
            const playerName = p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
            const tryoutPct = tryoutWeight;
            const scoutPct = 100 - tryoutWeight;

            return (
              <div key={p.id} className="bg-white rounded-xl border border-[#D4E4D4] overflow-hidden">
                {/* Section 1: Player Info */}
                <div className="flex items-center gap-3 p-4 border-b border-[#D4E4D4]/50">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-[#FFD700] text-[#005028]'
                    : idx === 1 ? 'bg-gray-300 text-gray-700'
                    : idx === 2 ? 'bg-[#cd7f32]/30 text-[#8b5e3c]'
                    : 'bg-[#F5F9F5] text-[#6B7C6B]'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm">
                      {playerName}
                      {(p.number || p.jerseyNumber) && (
                        <span className="text-[#6B7C6B] font-normal ml-1.5">#{p.number || p.jerseyNumber}</span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {(p.ageGroup || p.age_group) && (
                        <span className="text-xs bg-[#D4E4D4]/50 text-[#005028] px-2 py-0.5 rounded-full">
                          {p.ageGroup || p.age_group}
                        </span>
                      )}
                      {p.position && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {p.position}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Combined score badge */}
                  {p.combined !== null && (
                    <div className="text-center flex-shrink-0">
                      <span className={`inline-flex items-center justify-center w-14 h-12 rounded-xl font-bold text-lg ${getScoreBadgeColor(p.combined)}`}>
                        {p.combined}
                      </span>
                    </div>
                  )}
                </div>

                {/* Section 2: Data Sources */}
                <div className="grid grid-cols-2 divide-x divide-[#D4E4D4]/50">
                  {/* Tryout Assessment */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#005028] uppercase tracking-wide">Tryout</span>
                      {p.tryoutAvg !== null && (
                        <span className={`text-sm font-bold ${getRatingColor(p.tryoutAvg)}`}>{p.tryoutAvg}</span>
                      )}
                    </div>
                    {p.tryoutCount > 0 ? (
                      <>
                        {EVAL_METRICS.map(m => (
                          <MetricRow key={m.id} name={m.name} value={p.tryoutMetrics[m.id]} />
                        ))}
                        <p className="text-[10px] text-[#6B7C6B] mt-1">{p.tryoutCount} evaluation{p.tryoutCount !== 1 ? 's' : ''}</p>
                      </>
                    ) : (
                      <p className="text-xs text-[#6B7C6B] italic py-2">No tryout data</p>
                    )}
                  </div>

                  {/* Game Scouting */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#00A651] uppercase tracking-wide">Scouting</span>
                      {p.scoutAvg !== null && (
                        <span className={`text-sm font-bold ${getRatingColor(p.scoutAvg)}`}>{p.scoutAvg}</span>
                      )}
                    </div>
                    {p.scoutCount > 0 ? (
                      <>
                        {SCOUT_METRICS.map(m => (
                          <MetricRow key={m.id} name={m.name} value={p.scoutMetrics[m.id]} />
                        ))}
                        <p className="text-[10px] text-[#6B7C6B] mt-1">{p.scoutCount} game{p.scoutCount !== 1 ? 's' : ''} scouted</p>
                      </>
                    ) : (
                      <p className="text-xs text-[#6B7C6B] italic py-2">No scouting data</p>
                    )}
                  </div>
                </div>

                {/* Section 3: Combined */}
                <div className="p-3 bg-[#F5F9F5] border-t border-[#D4E4D4]/50">
                  <div className="flex items-center gap-3">
                    {/* Weight bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex h-3 rounded-full overflow-hidden">
                        {p.tryoutAvg !== null && (
                          <div
                            className="bg-[#005028] transition-all duration-300"
                            style={{ width: `${tryoutPct}%` }}
                            title={`Tryout ${tryoutPct}%: ${p.tryoutAvg}`}
                          />
                        )}
                        {p.scoutAvg !== null && (
                          <div
                            className="bg-[#00A651] transition-all duration-300"
                            style={{ width: `${scoutPct}%` }}
                            title={`Scout ${scoutPct}%: ${p.scoutAvg}`}
                          />
                        )}
                        {p.tryoutAvg === null && p.scoutAvg === null && (
                          <div className="bg-[#D4E4D4] w-full" />
                        )}
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-[#005028]">
                          {p.tryoutAvg !== null ? `T: ${p.tryoutAvg} × ${tryoutPct}%` : 'No tryout'}
                        </span>
                        <span className="text-[10px] text-[#00A651]">
                          {p.scoutAvg !== null ? `S: ${p.scoutAvg} × ${scoutPct}%` : 'No scout'}
                        </span>
                      </div>
                    </div>

                    {/* Tier badge */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${tier.bg} ${tier.color}`}>
                      {tier.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const ScoutManagementPage = () => {
  const { games, players, teams, loading } = useData();
  const [activeTab, setActiveTab] = useState('assign');

  return (
    <PageShell
      title="Game Scouts"
      subtitle="Assign scouts, review evaluations, and compare combined scores"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Assessments & Selection', url: '/admin/assessments-hub' },
        { label: 'Team Selection', url: '/admin/team-selection' },
        { label: 'Game Scouts' },
      ]}
      backTo="/admin/team-selection"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-[#D4E4D4] p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#005028] text-white shadow-sm'
                  : 'text-[#6B7C6B] hover:bg-[#F5F9F5] hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'assign' && (
        <AssignScoutsTab games={games} teams={teams} loading={loading} />
      )}
      {activeTab === 'reports' && (
        <ScoutingReportsTab games={games} teams={teams} />
      )}
      {activeTab === 'selection' && (
        <TeamSelectionTab players={players} games={games} teams={teams} loading={loading} />
      )}
    </PageShell>
  );
};

export default ScoutManagementPage;
