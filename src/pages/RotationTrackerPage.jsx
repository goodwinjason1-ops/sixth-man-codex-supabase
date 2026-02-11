import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useGameDayDetection, formatGameForDisplay } from '../hooks/useGameDayDetection';
import {
  Timer,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  ArrowLeft,
  Users,
  Wifi,
  WifiOff,
  RotateCcw,
  Save,
  ArrowRightLeft,
  Info,
  X,
  Clock,
  BarChart3,
  Trophy,
  Sparkles,
  ListOrdered
} from 'lucide-react';
import PageShell from '../components/PageShell';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

// ─── Constants ───────────────────────────────────────────────────────
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const COURT_SIZE = 5;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY_PREFIX = 'rotation_tracker_';
const QUARTER_LENGTH_OPTIONS = [6, 8, 10];

// ─── Helper: format seconds to mm:ss ─────────────────────────────────
const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ─── Helper: fairness classification ─────────────────────────────────
const getFairnessStatus = (deviation) => {
  if (deviation < 0.15) return { label: 'Good', color: 'bg-green-500', textColor: 'text-green-400' };
  if (deviation < 0.30) return { label: 'Warning', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
  return { label: 'Poor', color: 'bg-red-500', textColor: 'text-red-400' };
};

const getOverallFairness = (players) => {
  const times = Object.values(players).map(p => p.totalSeconds);
  if (times.length === 0) return { label: 'N/A', score: 0 };
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  if (avg === 0) return { label: 'N/A', score: 0 };
  const deviations = times.map(t => Math.abs(t - avg) / avg);
  const hasPoor = deviations.some(d => d >= 0.30);
  const allGood = deviations.every(d => d < 0.15);
  if (allGood) return { label: 'Excellent', score: 95 };
  if (!hasPoor) return { label: 'Good', score: 75 };
  return { label: 'Needs Improvement', score: 40 };
};

// ─── Plan generation algorithm ───────────────────────────────────────
function generateRotationPlan(rosterIds, firstHalfIds, secondHalfIds, quarterLengthSec, numQuarters, playerInfo) {
  const N = rosterIds.length;
  const totalCourtSec = quarterLengthSec * numQuarters * COURT_SIZE;
  const fairShareSec = totalCourtSec / N;

  const plannedTime = {};
  rosterIds.forEach(id => { plannedTime[id] = 0; });

  const quarters = {};

  for (let qi = 0; qi < numQuarters; qi++) {
    const qLabel = `Q${qi + 1}`;
    const isFirstHalf = qi < Math.ceil(numQuarters / 2);
    const halfStarters = isFirstHalf ? [...firstHalfIds] : [...secondHalfIds];
    const benchIds = rosterIds.filter(id => !halfStarters.includes(id));

    if (benchIds.length === 0) {
      quarters[qLabel] = { starters: halfStarters, subs: [] };
      halfStarters.forEach(id => { plannedTime[id] += quarterLengthSec; });
      continue;
    }

    const sortedBench = [...benchIds].sort((a, b) => plannedTime[a] - plannedTime[b]);
    const numSubs = sortedBench.length;
    const interval = Math.floor(quarterLengthSec / (numSubs + 1));

    const subs = [];
    let currentCourt = [...halfStarters];
    let currentBench = [...sortedBench];
    const entryTime = {};
    currentCourt.forEach(id => { entryTime[id] = 0; });

    for (let s = 0; s < numSubs; s++) {
      const subTime = interval * (s + 1);

      // Out: court player with most cumulative + current stint time
      let outId = currentCourt[0];
      let outScore = -1;
      currentCourt.forEach(id => {
        const score = plannedTime[id] + (subTime - (entryTime[id] || 0));
        if (score > outScore) { outScore = score; outId = id; }
      });

      // In: bench player with least cumulative time
      const inId = currentBench[0];

      subs.push({
        time: subTime,
        outId, inId,
        outName: playerInfo[outId]?.name || '?',
        inName: playerInfo[inId]?.name || '?',
        outNumber: playerInfo[outId]?.number || '?',
        inNumber: playerInfo[inId]?.number || '?'
      });

      plannedTime[outId] += subTime - (entryTime[outId] || 0);
      delete entryTime[outId];
      entryTime[inId] = subTime;

      currentCourt = currentCourt.map(id => id === outId ? inId : id);
      currentBench = currentBench.filter(id => id !== inId);
      currentBench.push(outId);
      currentBench.sort((a, b) => plannedTime[a] - plannedTime[b]);
    }

    currentCourt.forEach(id => {
      plannedTime[id] += quarterLengthSec - (entryTime[id] || 0);
    });

    quarters[qLabel] = { starters: halfStarters, subs };
  }

  return { quarters, fairShareSeconds: Math.round(fairShareSec), plannedTime: { ...plannedTime }, quarterLengthSec, numQuarters };
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
const RotationTrackerPage = () => {
  const navigate = useNavigate();
  const { players, teams, loading: dataLoading, addDocument } = useData();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { todaysGames, primaryGame, dataReady } = useGameDayDetection();

  // ── Phase: 'setup' | 'live' | 'summary' ──
  const [phase, setPhase] = useState('setup');

  // ── Setup state ──
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [opponent, setOpponent] = useState('');
  const [roster, setRoster] = useState([]); // full player list for selected team
  const [starters, setStarters] = useState(new Set()); // first-half starting 5
  const [quarterLengthMins, setQuarterLengthMins] = useState(8);
  const [secondHalfStarters, setSecondHalfStarters] = useState(new Set());
  const [secondHalfAutoSuggested, setSecondHalfAutoSuggested] = useState(false);
  const [rotationPlan, setRotationPlan] = useState(null);

  // ── Live plan tracking ──
  const [planSubStatus, setPlanSubStatus] = useState({}); // { Q1: { 0: 'done' } }
  const [showPlanPanel, setShowPlanPanel] = useState(false);

  // ── Live state ──
  const [isRunning, setIsRunning] = useState(false);
  const [currentQuarter, setCurrentQuarter] = useState(0); // index into allQuarters
  const [allQuarters, setAllQuarters] = useState([...QUARTERS]); // may gain 'OT'
  const [quarterSeconds, setQuarterSeconds] = useState(0);
  const [totalGameSeconds, setTotalGameSeconds] = useState(0);
  const [onCourt, setOnCourt] = useState([]); // player IDs
  const [bench, setBench] = useState([]); // player IDs
  const [playerStats, setPlayerStats] = useState({}); // { [id]: { totalSeconds, quarterSeconds: {}, subs: [], stintStart } }
  const [subsLog, setSubsLog] = useState([]);
  const [selectedCourtPlayer, setSelectedCourtPlayer] = useState(null);
  const [completedQuarters, setCompletedQuarters] = useState({}); // { Q1: { duration } }
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showNextQConfirm, setShowNextQConfirm] = useState(false);

  // ── Summary state ──
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Refs ──
  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // ═══ Derived ═══
  const coachTeams = useMemo(() => {
    if (!teams || !currentUser) return [];
    return teams.filter(t => t.coachId === currentUser.uid);
  }, [teams, currentUser]);

  const selectedTeam = useMemo(() => {
    return coachTeams.find(t => t.id === selectedTeamId) || null;
  }, [coachTeams, selectedTeamId]);

  // Online/offline listener
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ═══ Auto-detect today's game ═══
  useEffect(() => {
    if (dataReady && primaryGame && !opponent) {
      setOpponent(primaryGame.opponent || '');
    }
  }, [dataReady, primaryGame, opponent]);

  // ═══ Load roster when team selected ═══
  useEffect(() => {
    if (!selectedTeamId || !players) {
      setRoster([]);
      return;
    }
    const teamObj = coachTeams.find(t => t.id === selectedTeamId);
    const teamName = teamObj?.name || teamObj?.teamName || '';
    const teamPlayers = players.filter(p =>
      p.team === teamName ||
      p.teamId === selectedTeamId ||
      (teamObj?.playerIds && teamObj.playerIds.includes(p.id))
    );
    setRoster(teamPlayers);
    setStarters(new Set());
    setSecondHalfStarters(new Set());
    setSecondHalfAutoSuggested(false);
    setRotationPlan(null);
  }, [selectedTeamId, players, coachTeams]);

  // ═══ Auto-suggest second-half starters ═══
  useEffect(() => {
    if (starters.size === COURT_SIZE && roster.length > COURT_SIZE && !secondHalfAutoSuggested) {
      const bench = roster.filter(p => !starters.has(p.id));
      const auto = new Set();
      bench.slice(0, COURT_SIZE).forEach(p => auto.add(p.id));
      if (auto.size < COURT_SIZE) {
        [...starters].forEach(id => { if (auto.size < COURT_SIZE) auto.add(id); });
      }
      setSecondHalfStarters(auto);
      setSecondHalfAutoSuggested(true);
    }
  }, [starters, roster, secondHalfAutoSuggested]);

  // ═══ Beforeunload guard (live phase) ═══
  useEffect(() => {
    if (phase !== 'live') return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  // ═══ localStorage auto-save ═══
  const saveToLocalStorage = useCallback(() => {
    if (phase !== 'live') return;
    try {
      const key = `${STORAGE_KEY_PREFIX}${currentUser?.uid}_${selectedTeamId}`;
      const data = {
        selectedTeamId,
        opponent,
        onCourt,
        bench,
        playerStats,
        subsLog,
        currentQuarter,
        allQuarters,
        quarterSeconds,
        totalGameSeconds,
        completedQuarters,
        isRunning,
        savedAt: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [phase, currentUser, selectedTeamId, opponent, onCourt, bench, playerStats, subsLog, currentQuarter, allQuarters, quarterSeconds, totalGameSeconds, completedQuarters, isRunning]);

  useEffect(() => {
    if (phase !== 'live') return;
    autoSaveTimerRef.current = setInterval(saveToLocalStorage, AUTO_SAVE_INTERVAL);
    return () => clearInterval(autoSaveTimerRef.current);
  }, [phase, saveToLocalStorage]);

  // ═══════════════════════════════════════════════════════════════════
  // CLOCK LOGIC
  // ═══════════════════════════════════════════════════════════════════
  const startClock = useCallback(() => {
    if (intervalRef.current) return;
    lastTickRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setQuarterSeconds(prev => prev + elapsed);
      setTotalGameSeconds(prev => prev + elapsed);

      // Update on-court players' times
      setPlayerStats(prev => {
        const updated = { ...prev };
        // We use a functional ref approach to get current onCourt
        return updated;
      });
    }, 1000);
  }, []);

  const stopClock = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // More accurate: update player stats inside the interval via a ref
  const onCourtRef = useRef(onCourt);
  const currentQuarterRef = useRef(currentQuarter);
  const allQuartersRef = useRef(allQuarters);
  useEffect(() => { onCourtRef.current = onCourt; }, [onCourt]);
  useEffect(() => { currentQuarterRef.current = currentQuarter; }, [currentQuarter]);
  useEffect(() => { allQuartersRef.current = allQuarters; }, [allQuarters]);

  // Replace the interval with one that updates player stats
  const startClockFull = useCallback(() => {
    if (intervalRef.current) return;
    lastTickRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setQuarterSeconds(prev => prev + elapsed);
      setTotalGameSeconds(prev => prev + elapsed);

      const qLabel = allQuartersRef.current[currentQuarterRef.current];
      const courtPlayers = onCourtRef.current;

      setPlayerStats(prev => {
        const updated = { ...prev };
        courtPlayers.forEach(pid => {
          if (updated[pid]) {
            updated[pid] = {
              ...updated[pid],
              totalSeconds: (updated[pid].totalSeconds || 0) + elapsed,
              quarterSeconds: {
                ...updated[pid].quarterSeconds,
                [qLabel]: (updated[pid].quarterSeconds?.[qLabel] || 0) + elapsed
              }
            };
          }
        });
        return updated;
      });
    }, 1000);
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // SETUP ACTIONS
  // ═══════════════════════════════════════════════════════════════════
  const toggleStarter = (playerId) => {
    setStarters(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else if (next.size < COURT_SIZE) {
        next.add(playerId);
      }
      return next;
    });
    setRotationPlan(null);
  };

  const toggleSecondHalfStarter = (playerId) => {
    setSecondHalfStarters(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else if (next.size < COURT_SIZE) next.add(playerId);
      return next;
    });
    setRotationPlan(null);
  };

  // ── Plan generation ──
  const handleGeneratePlan = () => {
    const playerInfo = {};
    roster.forEach(p => {
      playerInfo[p.id] = {
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        number: p.jerseyNumber || p.number || '—'
      };
    });
    const plan = generateRotationPlan(
      roster.map(p => p.id),
      [...starters],
      [...secondHalfStarters],
      quarterLengthMins * 60,
      4,
      playerInfo
    );
    setRotationPlan(plan);
  };

  const canGeneratePlan = roster.length > COURT_SIZE &&
    starters.size === COURT_SIZE &&
    secondHalfStarters.size === COURT_SIZE;

  const handleStartGame = (withPlan = false) => {
    if (starters.size !== COURT_SIZE && starters.size < roster.length) return;

    const courtIds = [...starters];
    const benchIds = roster.filter(p => !starters.has(p.id)).map(p => p.id);

    const stats = {};
    roster.forEach(p => {
      stats[p.id] = {
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        number: p.jerseyNumber || p.number || '—',
        totalSeconds: 0,
        quarterSeconds: {},
        subs: [],
        isOnCourt: courtIds.includes(p.id)
      };
    });

    setOnCourt(courtIds);
    setBench(benchIds);
    setPlayerStats(stats);
    setCurrentQuarter(0);
    setAllQuarters([...QUARTERS]);
    setQuarterSeconds(0);
    setTotalGameSeconds(0);
    setSubsLog([]);
    setCompletedQuarters({});

    if (withPlan && rotationPlan) {
      const status = {};
      Object.entries(rotationPlan.quarters).forEach(([q, data]) => {
        status[q] = {};
        data.subs.forEach((_, i) => { status[q][i] = 'pending'; });
      });
      setPlanSubStatus(status);
      setShowPlanPanel(true);
    } else {
      setRotationPlan(null);
      setPlanSubStatus({});
      setShowPlanPanel(false);
    }

    setPhase('live');
  };

  // Allow starting with fewer than 5 if the roster is small
  const canStart = roster.length > 0 && (
    starters.size === COURT_SIZE ||
    (roster.length < COURT_SIZE && starters.size === roster.length)
  );

  // ═══════════════════════════════════════════════════════════════════
  // LIVE ACTIONS
  // ═══════════════════════════════════════════════════════════════════
  const handleToggleClock = () => {
    if (isRunning) {
      stopClock();
    } else {
      startClockFull();
    }
  };

  const handleSubstitution = (benchPlayerId, explicitCourtPlayerId = null) => {
    const qLabel = allQuarters[currentQuarter];
    let courtPlayerId = explicitCourtPlayerId || selectedCourtPlayer;

    // Auto-pick: swap with most-played court player if none selected
    if (!courtPlayerId) {
      let maxTime = -1;
      onCourt.forEach(pid => {
        const t = playerStats[pid]?.totalSeconds || 0;
        if (t > maxTime) {
          maxTime = t;
          courtPlayerId = pid;
        }
      });
    }
    if (!courtPlayerId) return;

    // Record sub events
    const gameTime = quarterSeconds;
    const subOut = { type: 'off', quarter: qLabel, gameTime: Math.floor(gameTime), playerId: courtPlayerId, playerName: playerStats[courtPlayerId]?.name };
    const subIn = { type: 'on', quarter: qLabel, gameTime: Math.floor(gameTime), playerId: benchPlayerId, playerName: playerStats[benchPlayerId]?.name };

    setSubsLog(prev => [...prev, subOut, subIn]);

    // Update player stats subs array
    setPlayerStats(prev => ({
      ...prev,
      [courtPlayerId]: {
        ...prev[courtPlayerId],
        subs: [...(prev[courtPlayerId]?.subs || []), { type: 'off', quarter: qLabel, gameTime: Math.floor(gameTime) }],
        isOnCourt: false
      },
      [benchPlayerId]: {
        ...prev[benchPlayerId],
        subs: [...(prev[benchPlayerId]?.subs || []), { type: 'on', quarter: qLabel, gameTime: Math.floor(gameTime) }],
        isOnCourt: true
      }
    }));

    // Swap arrays
    setOnCourt(prev => prev.map(pid => pid === courtPlayerId ? benchPlayerId : pid));
    setBench(prev => prev.map(pid => pid === benchPlayerId ? courtPlayerId : pid));
    setSelectedCourtPlayer(null);
  };

  const handleNextQuarter = () => {
    stopClock();
    // Save completed quarter duration
    const qLabel = allQuarters[currentQuarter];
    setCompletedQuarters(prev => ({ ...prev, [qLabel]: { duration: Math.floor(quarterSeconds) } }));
    setCurrentQuarter(prev => prev + 1);
    setQuarterSeconds(0);
    setShowNextQConfirm(false);
  };

  const handleAddOvertime = () => {
    setAllQuarters(prev => [...prev, 'OT']);
  };

  const handleEndGame = () => {
    stopClock();
    // Save last quarter
    const qLabel = allQuarters[currentQuarter];
    setCompletedQuarters(prev => ({ ...prev, [qLabel]: { duration: Math.floor(quarterSeconds) } }));
    // Clean up localStorage
    try {
      const key = `${STORAGE_KEY_PREFIX}${currentUser?.uid}_${selectedTeamId}`;
      localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
    setPhase('summary');
    setShowEndConfirm(false);
  };

  // ── Sub suggestions ──
  const subSuggestion = useMemo(() => {
    if (onCourt.length === 0 || bench.length === 0) return null;
    const courtTimes = onCourt.map(pid => ({ pid, t: playerStats[pid]?.totalSeconds || 0 }));
    const benchTimes = bench.map(pid => ({ pid, t: playerStats[pid]?.totalSeconds || 0 }));
    const mostPlayed = courtTimes.reduce((a, b) => a.t > b.t ? a : b);
    const leastPlayed = benchTimes.reduce((a, b) => a.t < b.t ? a : b);
    const diff = mostPlayed.t - leastPlayed.t;
    if (diff > 120) { // 2 minutes
      return {
        outId: mostPlayed.pid,
        inId: leastPlayed.pid,
        diff
      };
    }
    return null;
  }, [onCourt, bench, playerStats]);

  // Most-played on court and least-played on bench (for highlights)
  const mostPlayedOnCourt = useMemo(() => {
    if (onCourt.length === 0) return null;
    return onCourt.reduce((a, b) =>
      (playerStats[a]?.totalSeconds || 0) >= (playerStats[b]?.totalSeconds || 0) ? a : b
    );
  }, [onCourt, playerStats]);

  const leastPlayedOnBench = useMemo(() => {
    if (bench.length === 0) return null;
    return bench.reduce((a, b) =>
      (playerStats[a]?.totalSeconds || 0) <= (playerStats[b]?.totalSeconds || 0) ? a : b
    );
  }, [bench, playerStats]);

  // ── Plan alert: find next due sub ──
  const currentPlanAlert = useMemo(() => {
    if (!rotationPlan) return null;
    const qLabel = allQuarters[currentQuarter];
    const qPlan = rotationPlan.quarters[qLabel];
    if (!qPlan) return null;
    const qStatus = planSubStatus[qLabel] || {};
    for (let i = 0; i < qPlan.subs.length; i++) {
      if (qStatus[i] !== 'pending') continue;
      if (quarterSeconds >= qPlan.subs[i].time) {
        return { ...qPlan.subs[i], index: i, quarter: qLabel };
      }
    }
    return null;
  }, [rotationPlan, currentQuarter, allQuarters, planSubStatus, quarterSeconds]);

  const nextPlannedSub = useMemo(() => {
    if (!rotationPlan) return null;
    const qLabel = allQuarters[currentQuarter];
    const qPlan = rotationPlan.quarters[qLabel];
    if (!qPlan) return null;
    const qStatus = planSubStatus[qLabel] || {};
    for (let i = 0; i < qPlan.subs.length; i++) {
      if (qStatus[i] === 'pending') return { ...qPlan.subs[i], index: i, quarter: qLabel };
    }
    return null;
  }, [rotationPlan, currentQuarter, allQuarters, planSubStatus]);

  const isBehindSchedule = currentPlanAlert && (quarterSeconds - currentPlanAlert.time) > 30;

  const handlePlanSubNow = (alert) => {
    const { outId, inId, index, quarter } = alert;
    if (onCourt.includes(outId) && bench.includes(inId)) {
      handleSubstitution(inId, outId);
    }
    setPlanSubStatus(prev => ({
      ...prev,
      [quarter]: { ...prev[quarter], [index]: 'done' }
    }));
  };

  const handlePlanSubDismiss = (alert) => {
    const { index, quarter } = alert;
    setPlanSubStatus(prev => ({
      ...prev,
      [quarter]: { ...prev[quarter], [index]: 'dismissed' }
    }));
  };

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY ACTIONS
  // ═══════════════════════════════════════════════════════════════════
  const handleSaveToFirestore = async () => {
    setSaving(true);
    try {
      const teamObj = selectedTeam;
      const doc = {
        teamId: selectedTeamId,
        teamName: teamObj?.name || teamObj?.teamName || '',
        coachId: currentUser.uid,
        coachName: userProfile?.displayName || '',
        date: new Date().toISOString().split('T')[0],
        opponent,
        quarters: completedQuarters,
        totalGameSeconds: Math.floor(totalGameSeconds),
        quartersPlayed: Object.keys(completedQuarters).length,
        playerStats: Object.fromEntries(
          Object.entries(playerStats).map(([pid, ps]) => [
            pid,
            {
              name: ps.name,
              number: ps.number,
              totalSeconds: Math.floor(ps.totalSeconds),
              quarterSeconds: Object.fromEntries(
                Object.entries(ps.quarterSeconds || {}).map(([q, s]) => [q, Math.floor(s)])
              ),
              subs: ps.subs || []
            }
          ])
        ),
        fairnessScore: getOverallFairness(playerStats).label,
        status: 'completed',
        createdAt: new Date().toISOString(),
        savedOffline: !navigator.onLine
      };

      if (primaryGame?.id) {
        doc.gameId = primaryGame.id;
      }
      if (rotationPlan) {
        doc.rotationPlan = {
          quarterLengthSec: rotationPlan.quarterLengthSec,
          numQuarters: rotationPlan.numQuarters,
          fairShareSeconds: rotationPlan.fairShareSeconds,
          plannedTime: rotationPlan.plannedTime
        };
      }

      await addDocument('playing_time', doc);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save rotation data:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNewGame = () => {
    setPhase('setup');
    setSelectedTeamId('');
    setOpponent('');
    setRoster([]);
    setStarters(new Set());
    setSecondHalfStarters(new Set());
    setSecondHalfAutoSuggested(false);
    setRotationPlan(null);
    setPlanSubStatus({});
    setShowPlanPanel(false);
    setQuarterLengthMins(8);
    setOnCourt([]);
    setBench([]);
    setPlayerStats({});
    setSubsLog([]);
    setCompletedQuarters({});
    setQuarterSeconds(0);
    setTotalGameSeconds(0);
    setCurrentQuarter(0);
    setAllQuarters([...QUARTERS]);
    setSaved(false);
    setIsRunning(false);
    setSelectedCourtPlayer(null);
  };

  // ═══════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════
  if (authLoading || dataLoading) {
    return <LoadingState message="Loading Rotation Tracker..." />;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE: SETUP
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    const showSecondHalf = roster.length > COURT_SIZE && starters.size === COURT_SIZE;
    const showPlanSection = showSecondHalf && secondHalfStarters.size === COURT_SIZE;

    return (
      <PageShell backTo="/coach" title="Rotation Tracker" subtitle="Track player rotations during games">
        <div className="space-y-6">
          {/* Team Selector */}
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
            <label className="block text-sm font-medium text-white/80 mb-2">Select Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
            >
              <option value="">Choose a team...</option>
              {coachTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name || t.teamName}</option>
              ))}
            </select>
          </div>

          {/* Opponent + Game Settings */}
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
            <label className="block text-sm font-medium text-white/80 mb-2">Opponent</label>
            {primaryGame && (
              <p className="text-xs text-[#4ade80] mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Auto-detected from today's schedule
              </p>
            )}
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Enter opponent name..."
              className="w-full px-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg focus:ring-2 focus:ring-[#22c55e] focus:border-transparent placeholder:text-white/30 mb-4"
            />
            <label className="block text-sm font-medium text-white/80 mb-2">Quarter Length</label>
            <div className="flex gap-2">
              {QUARTER_LENGTH_OPTIONS.map(mins => (
                <button
                  key={mins}
                  onClick={() => { setQuarterLengthMins(mins); setRotationPlan(null); }}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                    quarterLengthMins === mins
                      ? 'bg-[#22c55e] text-[#0a3d2e]'
                      : 'bg-[#0a3d2e] text-white/60 border border-[#1a8a68] hover:border-[#22c55e]/50'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* First Half Starting 5 */}
          {selectedTeamId && (
            <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">
                  {roster.length > COURT_SIZE ? 'First Half Starting 5' : 'Select Starting 5'}
                </h3>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  starters.size === COURT_SIZE
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : 'bg-[#0a3d2e] text-white/60 border border-[#1a8a68]'
                }`}>
                  {starters.size}/{Math.min(COURT_SIZE, roster.length)}
                </span>
              </div>
              {roster.length === 0 ? (
                <EmptyState icon={Users} title="No Players Found" message="No players are assigned to this team yet." />
              ) : (
                <>
                  {roster.length < COURT_SIZE && (
                    <div className="flex items-center gap-2 p-3 mb-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-sm text-yellow-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Only {roster.length} player{roster.length !== 1 ? 's' : ''} on roster.</span>
                    </div>
                  )}
                  <RosterGrid roster={roster} selected={starters} onToggle={toggleStarter} maxSelect={COURT_SIZE} />
                </>
              )}
            </div>
          )}

          {/* Second Half Starting 5 */}
          {showSecondHalf && (
            <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Second Half Starting 5</h3>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  secondHalfStarters.size === COURT_SIZE
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : 'bg-[#0a3d2e] text-white/60 border border-[#1a8a68]'
                }`}>
                  {secondHalfStarters.size}/{COURT_SIZE}
                </span>
              </div>
              <p className="text-xs text-white/40 mb-3">
                Auto-suggested: bench players from first half. Tap to adjust.
              </p>
              <RosterGrid roster={roster} selected={secondHalfStarters} onToggle={toggleSecondHalfStarter} maxSelect={COURT_SIZE} />
            </div>
          )}

          {/* Plan Generation */}
          {showPlanSection && (
            <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#4ade80]" />
                <h3 className="font-semibold text-white">Auto-Rotation Plan</h3>
              </div>
              <p className="text-xs text-white/50 mb-4">
                Generate a fair rotation schedule. This is a suggestion — you can always make manual changes during the game.
              </p>

              {!rotationPlan ? (
                <button
                  onClick={handleGeneratePlan}
                  disabled={!canGeneratePlan}
                  className="w-full py-3 bg-[#22c55e]/20 border-2 border-dashed border-[#22c55e] text-[#4ade80] rounded-xl font-bold hover:bg-[#22c55e]/30 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Rotation Plan
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Fair share info */}
                  <div className="flex items-center gap-2 p-3 bg-[#0a3d2e] border border-[#1a8a68]/50 rounded-lg text-sm">
                    <Clock className="w-4 h-4 text-[#4ade80]" />
                    <span className="text-white/80">
                      Fair share: <span className="text-[#4ade80] font-bold">{formatTime(rotationPlan.fairShareSeconds)}</span> per player
                      <span className="text-white/40 ml-1">({roster.length} players, {quarterLengthMins * 4} min game)</span>
                    </span>
                  </div>

                  {/* Quarter cards */}
                  {Object.entries(rotationPlan.quarters).map(([qLabel, qData]) => (
                    <PlanQuarterCard key={qLabel} qLabel={qLabel} qData={qData} quarterLengthSec={quarterLengthMins * 60} />
                  ))}

                  <button
                    onClick={() => setRotationPlan(null)}
                    className="w-full py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
                  >
                    Regenerate Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Start Buttons */}
          <div className="space-y-3">
            {rotationPlan && (
              <button
                onClick={() => handleStartGame(true)}
                disabled={!canStart || !opponent.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  canStart && opponent.trim()
                    ? 'bg-[#22c55e] text-[#0a3d2e] hover:bg-[#4ade80] active:scale-[0.98]'
                    : 'bg-[#1a8a68]/30 text-white/30 cursor-not-allowed'
                }`}
              >
                <ListOrdered className="w-5 h-5" />
                Start Game with Plan
              </button>
            )}
            <button
              onClick={() => handleStartGame(false)}
              disabled={!canStart || !opponent.trim()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canStart && opponent.trim()
                  ? rotationPlan
                    ? 'bg-[#0d5943] border-2 border-[#1a8a68] text-white hover:border-[#22c55e]'
                    : 'bg-[#22c55e] text-[#0a3d2e] hover:bg-[#4ade80] active:scale-[0.98]'
                  : 'bg-[#1a8a68]/30 text-white/30 cursor-not-allowed'
              }`}
            >
              {rotationPlan ? 'Start Game (Manual)' : 'Start Game'}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE: LIVE TRACKING
  // ═══════════════════════════════════════════════════════════════════
  if (phase === 'live') {
    const qLabel = allQuarters[currentQuarter] || 'Q1';
    const isLastQuarter = currentQuarter >= allQuarters.length - 1;
    const hasOT = allQuarters.includes('OT');
    const isQ4Done = currentQuarter >= 3; // after Q4

    return (
      <div className="min-h-screen bg-[#0a3d2e] text-white flex flex-col">
        {/* ── Header Bar ── */}
        <div className="bg-[#0d5943] border-b border-[#1a8a68] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#22c55e] text-[#0a3d2e] font-bold text-sm px-3 py-1 rounded-full">
              {qLabel}
            </span>
            <span className="text-white/80 text-sm truncate">vs {opponent}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {isOnline ? (
              <><Wifi className="w-3 h-3 text-[#4ade80]" /><span className="text-[#4ade80]">Online</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-yellow-400" /><span className="text-yellow-400">Offline</span></>
            )}
          </div>
        </div>

        {/* ── Game Clock ── */}
        <div className="text-center py-6 px-4">
          <div className="text-6xl font-mono font-bold text-white tracking-wider mb-4">
            {formatTime(quarterSeconds)}
          </div>
          <div className="text-sm text-white/50 mb-4">
            Game Total: {formatTime(totalGameSeconds)}
          </div>
          <button
            onClick={handleToggleClock}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all active:scale-95 ${
              isRunning
                ? 'bg-yellow-500 hover:bg-yellow-400'
                : 'bg-[#22c55e] hover:bg-[#4ade80]'
            }`}
          >
            {isRunning ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </button>
        </div>

        {/* ── Quarter Nav ── */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {allQuarters.map((q, i) => (
              <span
                key={q}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  i === currentQuarter
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : i < currentQuarter
                      ? 'bg-[#1a8a68]/40 text-white/40'
                      : 'bg-[#0a3d2e] text-white/20 border border-[#1a8a68]/30'
                }`}
              >
                {q}
              </span>
            ))}

            {/* Next Quarter / End Game buttons */}
            <div className="flex gap-2 ml-2">
              {!isLastQuarter && (
                <button
                  onClick={() => setShowNextQConfirm(true)}
                  className="px-3 py-1.5 bg-[#1a8a68] hover:bg-[#22c55e] text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {isLastQuarter && isQ4Done && !hasOT && (
                <button
                  onClick={handleAddOvertime}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  +OT
                </button>
              )}
              <button
                onClick={() => { stopClock(); setShowEndConfirm(true); }}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors"
              >
                End
              </button>
            </div>
          </div>
        </div>

        {/* ── Plan Sub Due Alert ── */}
        {currentPlanAlert && (
          <div className={`mx-4 mb-3 p-3 rounded-xl flex items-center gap-3 ${
            isBehindSchedule
              ? 'bg-orange-900/40 border-2 border-orange-500 animate-pulse'
              : 'bg-blue-900/30 border-2 border-blue-500'
          }`}>
            <ListOrdered className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <span className={`font-bold ${isBehindSchedule ? 'text-orange-400' : 'text-blue-400'}`}>
                SUB DUE{isBehindSchedule ? ' (overdue)' : ''}:
              </span>{' '}
              <span className="text-white">{currentPlanAlert.outName} OFF → {currentPlanAlert.inName} ON</span>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => handlePlanSubNow(currentPlanAlert)}
                className="px-3 py-1.5 bg-[#22c55e] text-[#0a3d2e] rounded-lg text-xs font-bold"
              >
                Sub Now
              </button>
              <button
                onClick={() => handlePlanSubDismiss(currentPlanAlert)}
                className="px-3 py-1.5 bg-white/10 text-white/60 rounded-lg text-xs font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── Sub Suggestion Banner (only if no plan alert showing) ── */}
        {!currentPlanAlert && subSuggestion && (
          <div className="mx-4 mb-3 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-xl flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <span className="text-yellow-400 font-medium">Sub suggestion: </span>
              <span className="text-white/80">
                {playerStats[subSuggestion.outId]?.name} OUT → {playerStats[subSuggestion.inId]?.name} IN
              </span>
              <span className="text-white/40 ml-1">({formatTime(subSuggestion.diff)} gap)</span>
            </div>
          </div>
        )}

        {/* ── Court Area (2-1-2 formation) ── */}
        <div className="px-4 mb-4">
          <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 text-center">On Court</h3>
          <div className="flex flex-col items-center gap-3">
            {/* Row 1: 2 players */}
            <div className="flex gap-3 justify-center">
              {onCourt.slice(0, 2).map(pid => (
                <CourtPlayerCard
                  key={pid}
                  player={playerStats[pid]}
                  playerId={pid}
                  isSelected={selectedCourtPlayer === pid}
                  isMostPlayed={pid === mostPlayedOnCourt}
                  onTap={() => setSelectedCourtPlayer(prev => prev === pid ? null : pid)}
                  quarterSeconds={quarterSeconds}
                />
              ))}
            </div>
            {/* Row 2: 1 player (center) */}
            <div className="flex gap-3 justify-center">
              {onCourt.slice(2, 3).map(pid => (
                <CourtPlayerCard
                  key={pid}
                  player={playerStats[pid]}
                  playerId={pid}
                  isSelected={selectedCourtPlayer === pid}
                  isMostPlayed={pid === mostPlayedOnCourt}
                  onTap={() => setSelectedCourtPlayer(prev => prev === pid ? null : pid)}
                  quarterSeconds={quarterSeconds}
                />
              ))}
            </div>
            {/* Row 3: 2 players */}
            <div className="flex gap-3 justify-center">
              {onCourt.slice(3, 5).map(pid => (
                <CourtPlayerCard
                  key={pid}
                  player={playerStats[pid]}
                  playerId={pid}
                  isSelected={selectedCourtPlayer === pid}
                  isMostPlayed={pid === mostPlayedOnCourt}
                  onTap={() => setSelectedCourtPlayer(prev => prev === pid ? null : pid)}
                  quarterSeconds={quarterSeconds}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Bench Area ── */}
        {bench.length > 0 && (
          <div className="px-4 pb-6 flex-1">
            <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">Bench</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {bench.map(pid => (
                <BenchPlayerChip
                  key={pid}
                  player={playerStats[pid]}
                  playerId={pid}
                  isLeastPlayed={pid === leastPlayedOnBench}
                  onTap={() => handleSubstitution(pid)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Collapsible Rotation Plan Panel ── */}
        {rotationPlan && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowPlanPanel(prev => !prev)}
              className="w-full flex items-center justify-between p-3 bg-[#0d5943] border border-[#1a8a68] rounded-xl text-sm"
            >
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-[#4ade80]" />
                <span className="text-white font-medium">Rotation Plan</span>
                {nextPlannedSub && !currentPlanAlert && (
                  <span className="text-white/40 text-xs">
                    Next: {formatTime(nextPlannedSub.time)} — {nextPlannedSub.outName} → {nextPlannedSub.inName}
                  </span>
                )}
              </div>
              {showPlanPanel ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>
            {showPlanPanel && (
              <div className="mt-2 bg-[#0d5943] border border-[#1a8a68] rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                <p className="text-[10px] text-white/30 mb-1">Suggested rotation — tap to make manual changes anytime</p>
                {rotationPlan.quarters[qLabel]?.subs.map((sub, i) => {
                  const status = planSubStatus[qLabel]?.[i] || 'pending';
                  const isDue = quarterSeconds >= sub.time && status === 'pending';
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg transition-all ${
                        status === 'done' ? 'bg-green-900/20 opacity-50' :
                        status === 'dismissed' ? 'opacity-20 line-through' :
                        isDue ? 'bg-blue-900/30 border border-blue-500/50' :
                        'bg-[#0a3d2e]/50'
                      }`}
                    >
                      {status === 'done' && <Check className="w-3 h-3 text-green-400 flex-shrink-0" />}
                      <span className="text-[#4ade80] font-mono w-10 flex-shrink-0">{formatTime(sub.time)}</span>
                      <span className="text-white/80">{sub.outName} OFF → {sub.inName} ON</span>
                    </div>
                  );
                })}
                {(!rotationPlan.quarters[qLabel]?.subs || rotationPlan.quarters[qLabel].subs.length === 0) && (
                  <p className="text-white/30 text-xs">No subs planned for this quarter</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Confirmation Dialogs ── */}
        {showNextQConfirm && (
          <ConfirmDialog
            title={`End ${qLabel}?`}
            message={`Move to ${allQuarters[currentQuarter + 1]}? The clock will reset for the new quarter.`}
            onConfirm={handleNextQuarter}
            onCancel={() => setShowNextQConfirm(false)}
          />
        )}
        {showEndConfirm && (
          <ConfirmDialog
            title="End Game?"
            message="This will end the game and show the summary. Make sure all substitutions are recorded."
            confirmLabel="End Game"
            confirmColor="bg-red-600 hover:bg-red-500"
            onConfirm={handleEndGame}
            onCancel={() => setShowEndConfirm(false)}
          />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE: SUMMARY
  // ═══════════════════════════════════════════════════════════════════
  const fairness = getOverallFairness(playerStats);
  const sortedPlayers = Object.entries(playerStats).sort((a, b) => b[1].totalSeconds - a[1].totalSeconds);
  const maxPlayerTime = sortedPlayers.length > 0 ? sortedPlayers[0][1].totalSeconds : 1;
  const avgTime = sortedPlayers.length > 0
    ? sortedPlayers.reduce((s, [, p]) => s + p.totalSeconds, 0) / sortedPlayers.length
    : 0;

  return (
    <PageShell backTo="/coach" title="Game Summary" subtitle={`vs ${opponent}`}>
      <div className="space-y-6">
        {/* Game Info Card */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/50">Team</span>
              <p className="text-white font-medium">{selectedTeam?.name || selectedTeam?.teamName || '—'}</p>
            </div>
            <div>
              <span className="text-white/50">Opponent</span>
              <p className="text-white font-medium">{opponent}</p>
            </div>
            <div>
              <span className="text-white/50">Date</span>
              <p className="text-white font-medium">{new Date().toLocaleDateString('en-AU')}</p>
            </div>
            <div>
              <span className="text-white/50">Total Time</span>
              <p className="text-white font-medium">{formatTime(totalGameSeconds)}</p>
            </div>
            <div>
              <span className="text-white/50">Quarters</span>
              <p className="text-white font-medium">{Object.keys(completedQuarters).length}</p>
            </div>
            <div>
              <span className="text-white/50">Fairness</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                fairness.label === 'Excellent' ? 'bg-green-600 text-white' :
                fairness.label === 'Good' ? 'bg-yellow-600 text-white' :
                'bg-red-600 text-white'
              }`}>
                {fairness.label}
              </span>
            </div>
          </div>
        </div>

        {/* Player Breakdown */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4ade80]" />
            Player Playing Time
          </h3>
          <div className="space-y-3">
            {sortedPlayers.map(([pid, ps]) => {
              const pct = totalGameSeconds > 0 ? (ps.totalSeconds / totalGameSeconds * 100) : 0;
              const deviation = avgTime > 0 ? Math.abs(ps.totalSeconds - avgTime) / avgTime : 0;
              const status = getFairnessStatus(deviation);
              return (
                <div key={pid} className="bg-[#0a3d2e] border border-[#1a8a68]/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4ade80] font-bold text-xs">#{ps.number}</span>
                      <span className="text-white font-medium text-sm">{ps.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-mono">{formatTime(ps.totalSeconds)}</span>
                      <span className="text-white/40 text-xs">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                  {/* Fairness bar */}
                  <div className="h-3 bg-[#0d5943] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        deviation < 0.15 ? 'bg-green-500' :
                        deviation < 0.30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, (ps.totalSeconds / maxPlayerTime) * 100)}%` }}
                    />
                  </div>
                  {/* Quarter breakdown */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {allQuarters.map(q => (
                      <span key={q} className="text-xs text-white/40">
                        {q}: {formatTime(ps.quarterSeconds?.[q] || 0)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Planned vs Actual */}
        {rotationPlan && (
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-[#4ade80]" />
              Planned vs Actual
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-[10px] text-white/40 uppercase tracking-wider px-1 mb-1">
                <span>Player</span><span className="text-right">Planned</span><span className="text-right">Actual</span><span className="text-right">Delta</span>
              </div>
              {sortedPlayers.map(([pid, ps]) => {
                const planned = rotationPlan.plannedTime[pid] || 0;
                const actual = Math.floor(ps.totalSeconds);
                const delta = actual - planned;
                const absDelta = Math.abs(delta);
                return (
                  <div key={pid} className="grid grid-cols-4 gap-2 items-center text-sm bg-[#0a3d2e] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[#4ade80] font-bold text-xs">#{ps.number}</span>
                      <span className="text-white truncate text-xs">{ps.name}</span>
                    </div>
                    <span className="text-white/50 text-right font-mono text-xs">{formatTime(planned)}</span>
                    <span className="text-white text-right font-mono text-xs">{formatTime(actual)}</span>
                    <span className={`text-right font-mono text-xs font-bold ${
                      absDelta < 60 ? 'text-green-400' : absDelta < 120 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {delta >= 0 ? '+' : '-'}{formatTime(absDelta)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Substitution Log */}
        {subsLog.length > 0 && (
          <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#4ade80]" />
              Substitution Log
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {subsLog.map((sub, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-[#1a8a68]/30 last:border-0">
                  <span className="text-[#4ade80] font-mono text-xs w-16 flex-shrink-0">
                    {sub.quarter} {formatTime(sub.gameTime)}
                  </span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    sub.type === 'on' ? 'bg-green-700 text-green-200' : 'bg-red-900 text-red-300'
                  }`}>
                    {sub.type === 'on' ? 'IN' : 'OUT'}
                  </span>
                  <span className="text-white/80">{sub.playerName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!saved ? (
            <button
              onClick={handleSaveToFirestore}
              disabled={saving}
              className="w-full py-4 bg-[#22c55e] text-[#0a3d2e] rounded-xl font-bold text-lg hover:bg-[#4ade80] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0a3d2e] border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save to Firestore
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-4 bg-green-800 border-2 border-[#22c55e] rounded-xl font-bold text-lg text-[#4ade80] text-center flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Saved Successfully
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/coach')}
              className="flex-1 py-3 bg-[#0d5943] border border-[#1a8a68] text-white rounded-xl font-medium hover:bg-[#1a8a68] transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleNewGame}
              className="flex-1 py-3 bg-[#0d5943] border border-[#1a8a68] text-white rounded-xl font-medium hover:bg-[#1a8a68] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              New Game
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

const CourtPlayerCard = ({ player, playerId, isSelected, isMostPlayed, onTap }) => {
  if (!player) return null;
  return (
    <button
      onClick={onTap}
      className={`w-36 p-3 rounded-xl border-2 text-center transition-all active:scale-95 ${
        isSelected
          ? 'border-[#22c55e] bg-[#22c55e]/15 shadow-lg shadow-[#22c55e]/20'
          : isMostPlayed
            ? 'border-amber-500/60 bg-amber-900/15'
            : 'border-[#1a8a68] bg-[#0d5943]'
      }`}
    >
      <div className="text-[#4ade80] font-bold text-xs">#{player.number}</div>
      <div className="text-white font-semibold text-sm truncate mt-0.5">{player.name}</div>
      <div className="text-white/80 font-mono text-lg mt-1">{formatTime(player.totalSeconds || 0)}</div>
      {isMostPlayed && !isSelected && (
        <div className="text-amber-400 text-[10px] mt-1 font-medium">Most time</div>
      )}
    </button>
  );
};

const BenchPlayerChip = ({ player, playerId, isLeastPlayed, onTap }) => {
  if (!player) return null;
  return (
    <button
      onClick={onTap}
      className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all active:scale-95 ${
        isLeastPlayed
          ? 'border-[#22c55e]/60 bg-[#22c55e]/10 ring-2 ring-[#22c55e]/30'
          : 'border-[#1a8a68] bg-[#0d5943]'
      }`}
    >
      <div className="text-[#4ade80] font-bold text-xs">#{player.number}</div>
      <div className="text-white font-medium text-sm whitespace-nowrap">{player.name}</div>
      <div className="text-white/60 font-mono text-xs mt-0.5">{formatTime(player.totalSeconds || 0)}</div>
      {isLeastPlayed && (
        <div className="text-[#4ade80] text-[10px] mt-0.5 font-medium">Sub in</div>
      )}
    </button>
  );
};

const RosterGrid = ({ roster, selected, onToggle, maxSelect }) => (
  <div className="grid grid-cols-2 gap-3">
    {roster.map(player => {
      const isSelected = selected.has(player.id);
      const playerName = player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim();
      return (
        <button
          key={player.id}
          onClick={() => onToggle(player.id)}
          disabled={!isSelected && selected.size >= maxSelect}
          className={`p-3 rounded-lg border-2 text-left transition-all ${
            isSelected
              ? 'border-[#22c55e] bg-[#22c55e]/10'
              : selected.size >= maxSelect
                ? 'border-[#1a8a68]/30 bg-[#0a3d2e]/50 opacity-50'
                : 'border-[#1a8a68] bg-[#0a3d2e] hover:border-[#22c55e]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {(player.jerseyNumber || player.number) && (
                  <span className="text-[#4ade80] font-bold text-sm">#{player.jerseyNumber || player.number}</span>
                )}
                <span className="text-white font-medium text-sm truncate">{playerName}</span>
              </div>
              {player.position && <span className="text-white/40 text-xs">{player.position}</span>}
            </div>
            {isSelected && (
              <div className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#0a3d2e]" />
              </div>
            )}
          </div>
        </button>
      );
    })}
  </div>
);

const PlanQuarterCard = ({ qLabel, qData, quarterLengthSec }) => {
  // Build starter names from the first sub's outName entries + remaining starters
  const starterNames = [];
  const starterIds = qData.starters || [];
  starterIds.forEach(id => {
    const asSub = qData.subs.find(s => s.outId === id);
    if (asSub) starterNames.push(asSub.outName);
    else {
      const asIn = qData.subs.find(s => s.inId === id);
      starterNames.push(asIn ? asIn.inName : id.slice(0, 8));
    }
  });

  return (
    <div className="bg-[#0a3d2e] border border-[#1a8a68]/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#4ade80] font-bold text-sm">{qLabel}</span>
        <span className="text-white/40 text-xs">{formatTime(quarterLengthSec)}</span>
      </div>
      <div className="text-xs text-white/60 mb-2">
        Start: <span className="text-white/80">{starterNames.join(', ')}</span>
      </div>
      {qData.subs.length > 0 ? (
        <div className="space-y-1">
          {qData.subs.map((sub, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 bg-[#0d5943]/50 rounded">
              <span className="text-[#4ade80] font-mono w-10">{formatTime(sub.time)}</span>
              <span className="text-white/70">{sub.outName} OFF → {sub.inName} ON</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/30 text-xs">No subs — all players on court</p>
      )}
    </div>
  );
};

const ConfirmDialog = ({ title, message, confirmLabel = 'Confirm', confirmColor = 'bg-[#22c55e] hover:bg-[#4ade80]', onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
    <div className="bg-[#0d5943] border border-[#1a8a68] rounded-2xl p-6 max-w-sm w-full">
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/60 text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-xl font-medium hover:bg-[#1a8a68] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 py-3 ${confirmColor} text-white rounded-xl font-bold transition-colors`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default RotationTrackerPage;
