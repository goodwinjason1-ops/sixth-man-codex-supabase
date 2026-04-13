import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useFilteredData } from '../hooks/useFilteredData';
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Users,
  Shield,
  Target,
  Move,
  Crosshair,
  Heart,
  Award,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  User,
  Eye,
  EyeOff,
  Zap,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  CloudOff,
  RefreshCw,
  Home,
  FileText,
  Trash2,
  Download,
  X,
  Info,
  Brain,
  MapPin,
  Clock as ClockIcon,
  ChevronUp
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { logActivity } from '../services/auditService';
import { useAutoSave } from '../hooks/useAutoSave';
import {
  MATCH_METRICS,
  MATCH_LEVEL_LABELS,
  MATCH_LEVEL_COLORS,
  getMatchBenchmark,
  getMatchAgeGroupFromTeam
} from '../data/matchBenchmarks';
import { getMetricsWithFallback } from '../services/metricsService';
import { useGameDayDetection, formatGameForDisplay } from '../hooks/useGameDayDetection';

// Default icon mapping for metrics
const DEFAULT_METRIC_ICONS = {
  teamWork: Users,
  defense: Shield,
  ballMovement: Target,
  offense: Crosshair,
  shotSelection: Brain,
  sportsmanship: Award
};

// Level labels from benchmarks
const levelLabels = MATCH_LEVEL_LABELS;

// Level colors (using benchmark colors)
const levelColors = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-[#005028]',
  5: 'bg-[#86efac]'
};

// Team-level scoring criteria (for team info bubbles)
const TEAM_SCORING_CRITERIA = {
  teamWork: {
    1: 'Poor team communication, players isolated, no cooperation',
    2: 'Occasional communication, inconsistent support between players',
    3: 'Reasonable teamwork, players generally aware of each other',
    4: 'Good communication and cooperation, players actively support each other',
    5: 'Excellent team chemistry, constant communication, seamless cooperation'
  },
  defense: {
    1: 'No defensive structure, players out of position, no help defense',
    2: 'Basic defensive effort but poor rotations and positioning',
    3: 'Solid team defense, reasonable help defense and rotations',
    4: 'Strong defensive unit, good rotations, effective help defense',
    5: 'Exceptional team defense, dominant rotations, forced turnovers consistently'
  },
  ballMovement: {
    1: 'Stagnant offense, no passing, one player dominates the ball',
    2: 'Limited ball movement, predictable passing, easy to defend',
    3: 'Reasonable ball sharing, some offensive flow',
    4: 'Good ball movement, multiple passes per possession, hard to defend',
    5: 'Outstanding ball movement, unselfish play, created open shots consistently'
  },
  offense: {
    1: 'No offensive structure, no scoring opportunities created',
    2: 'Limited offensive output, few quality looks at the basket',
    3: 'Reasonable offensive production, some play execution',
    4: 'Strong offensive performance, good execution, multiple scoring options',
    5: 'Dominant offense, excellent play execution, consistent quality scoring'
  },
  shotSelection: {
    1: 'Rushed, poor quality shots, no patience in the offense',
    2: 'Some poor shot choices, limited patience',
    3: 'Generally reasonable shot selection, some patience',
    4: 'Good shot discipline, patient offense, quality looks',
    5: 'Excellent shot selection, very patient, only took high-percentage shots'
  },
  sportsmanship: {
    1: 'Poor attitude, complaints to referees, disrespectful to opponents',
    2: 'Some negative behaviour, occasional complaints',
    3: 'Acceptable sportsmanship, generally respectful',
    4: 'Good sportsmanship, positive attitude, respectful',
    5: 'Excellent sportsmanship, encouraging, gracious in both winning and losing'
  }
};

// Individual player scoring criteria (for player info bubbles)
const PLAYER_SCORING_CRITERIA = {
  teamWork: {
    1: 'Does not communicate, plays in isolation, unaware of teammates',
    2: 'Limited communication, occasionally looks for teammates',
    3: 'Communicates and cooperates, generally supportive of teammates',
    4: 'Active communicator, encourages others, plays cooperatively',
    5: 'Outstanding communicator, vocal leader, lifts teammates\' performance'
  },
  defense: {
    1: 'No defensive effort, poor positioning, easily beaten',
    2: 'Some effort but poor stance, slow to react, loses assignment',
    3: 'Reliable defensive effort, holds position, contests shots',
    4: 'Strong defender, good positioning, active hands, helps teammates',
    5: 'Elite defender, shuts down opponent, forces turnovers, anchors the defense'
  },
  ballMovement: {
    1: 'Holds the ball too long, does not pass, poor decisions with the ball',
    2: 'Limited passing, occasionally shares, turnovers under pressure',
    3: 'Passes when open teammates available, reasonable ball handling',
    4: 'Good passer, finds open teammates, handles pressure well',
    5: 'Exceptional vision, creative passing, makes teammates better'
  },
  offense: {
    1: 'No scoring threat, avoids the ball, does not create opportunities',
    2: 'Limited offensive contribution, occasional attempts',
    3: 'Takes reasonable shots, contributes to scoring',
    4: 'Strong offensive player, creates own shot, finishes well',
    5: 'Dominant scorer, creates for self and others, hard to stop'
  },
  shotSelection: {
    1: 'Forces bad shots, no patience, shoots from poor positions',
    2: 'Some rushed shots, inconsistent decision-making',
    3: 'Generally takes appropriate shots, reasonable patience',
    4: 'Good shot selection, patient, takes shots within ability',
    5: 'Excellent decision-maker, only takes high-quality shots, very disciplined'
  },
  sportsmanship: {
    1: 'Argues with refs/opponents, poor body language, negative influence',
    2: 'Occasional complaints, inconsistent attitude',
    3: 'Generally respectful, accepts decisions',
    4: 'Positive attitude, respectful to all, good role model',
    5: 'Exceptional sportsmanship, encourages everyone, gracious always'
  }
};

const resultOptions = [
  { id: 'win', label: 'Win', color: 'bg-[#005028]' },
  { id: 'loss', label: 'Loss', color: 'bg-red-500' },
  { id: 'draw', label: 'Draw', color: 'bg-yellow-500' }
];

// MVP Vote Options
const mvpVoteOptions = [
  { id: 'vote3', label: '3 Votes', description: 'Best on Ground', points: 3 },
  { id: 'vote2', label: '2 Votes', description: 'Second Best', points: 2 },
  { id: 'vote1', label: '1 Vote', description: 'Third Best', points: 1 }
];

const MatchDayAssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { players: firestorePlayers, teams: firestoreTeams, games: firestoreGames, matchAssessments: existingAssessments, addDocument, updateDocument, isOnline, pendingSync, loading, errors, currentUser, userProfile } = useFilteredData();
  const tabsContainerRef = useRef(null);
  const draftIdFromUrl = searchParams.get('draftId');
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Game Day state — use hook directly so game list is always fresh
  const gameDayState = location.state;
  const { isGameDay: hookIsGameDay, todaysGames: hookTodaysGames, primaryGame: hookPrimaryGame, loading: gameDayHookLoading } = useGameDayDetection();
  const [isGameDayMode, setIsGameDayMode] = useState(false);
  const [gameDayData, setGameDayData] = useState(null);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [gameDayLoaded, setGameDayLoaded] = useState(false);

  // All today's games — always sourced from hook, not navigation state
  const allTodaysGames = useMemo(() => {
    if (hookTodaysGames && hookTodaysGames.length > 0) {
      return hookTodaysGames.map(formatGameForDisplay);
    }
    return [];
  }, [hookTodaysGames]);

  // Get coach's teams - pre-filtered by useFilteredData
  const coachTeams = useMemo(() => {
    if (!firestoreTeams || firestoreTeams.length === 0) return [];
    return firestoreTeams.map(t => ({
      id: t.id,
      name: t.name || t.teamName || 'Unknown Team',
      ageGroup: t.ageGroup || ''
    }));
  }, [firestoreTeams]);

  // Build players grouped by team from Firestore
  const playersByTeam = useMemo(() => {
    if (!firestorePlayers || firestorePlayers.length === 0) return {};
    const grouped = {};
    coachTeams.forEach(team => {
      grouped[team.id] = firestorePlayers
        .filter(p => p.teamId === team.id || p.team === team.name || p.teamName === team.name)
        .map(p => ({ id: p.id, name: p.name || p.displayName || 'Unknown', number: p.number || p.jerseyNumber || 0 }));
    });
    return grouped;
  }, [firestorePlayers, coachTeams]);

  const hasMultipleTeams = coachTeams.length > 1;

  // State
  const [activeTeamId, setActiveTeamId] = useState(coachTeams[0]?.id || '');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [opponentName, setOpponentName] = useState('');
  const [gameResult, setGameResult] = useState('');
  const [teamRatings, setTeamRatings] = useState({});
  const [teamRatingNotes, setTeamRatingNotes] = useState('');
  const [teamMetricNotes, setTeamMetricNotes] = useState({});
  const [teamMetricNotesPrivacy, setTeamMetricNotesPrivacy] = useState({}); // { metricId: true = private }
  const [teamRatingNotesPrivate, setTeamRatingNotesPrivate] = useState(false);
  const [gameNotes, setGameNotes] = useState('');
  const [gameNotesPrivate, setGameNotesPrivate] = useState(false);
  const [showGeneralNotes, setShowGeneralNotes] = useState(false);
  const [mvpVotes, setMvpVotes] = useState({ vote3: '', vote2: '', vote1: '' });
  const [mvpNotes, setMvpNotes] = useState({ vote3: '', vote2: '', vote1: '' });
  const [expandedMvpNotes, setExpandedMvpNotes] = useState({});

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  // Draft states
  const [existingDraft, setExistingDraft] = useState(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // MVP Voting (3-2-1 system)
  const [openMvpDropdown, setOpenMvpDropdown] = useState(null);

  // Individual Player Assessments
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [expandedPlayerNotes, setExpandedPlayerNotes] = useState({});
  const [expandedMetricNotes, setExpandedMetricNotes] = useState({}); // { "playerId-metricId": true }
  const [expandedTeamMetricNotes, setExpandedTeamMetricNotes] = useState({}); // { "metricId": true }
  const [playerAssessments, setPlayerAssessments] = useState({});
  const [showTeamNotes, setShowTeamNotes] = useState(false);

  // FIX B: Update activeTeamId when coachTeams loads (it's '' on first render)
  useEffect(() => {
    if (coachTeams.length > 0 && !activeTeamId) {
      setActiveTeamId(coachTeams[0].id);
    }
  }, [coachTeams, activeTeamId]);

  // Auto-save form data every 30 seconds as safety net
  const autoSaveFormData = useMemo(() => ({
    teamId: activeTeamId, matchDate, opponentName, gameResult,
    teamRatings, teamRatingNotes, teamRatingNotesPrivate, teamMetricNotes, teamMetricNotesPrivacy,
    mvpVotes, mvpNotes, gameNotes, gameNotesPrivate, playerAssessments
  }), [activeTeamId, matchDate, opponentName, gameResult, teamRatings, teamRatingNotes, teamRatingNotesPrivate, teamMetricNotes, teamMetricNotesPrivacy, mvpVotes, mvpNotes, gameNotes, gameNotesPrivate, playerAssessments]);

  const { savedData: autoSavedData, clearSaved: clearAutoSave, hasSavedData: hasAutoSave } = useAutoSave('match-assessment', autoSaveFormData);

  const handleLoadAutoSave = () => {
    if (!autoSavedData) return;
    if (autoSavedData.teamId) setActiveTeamId(autoSavedData.teamId);
    if (autoSavedData.matchDate) setMatchDate(autoSavedData.matchDate);
    setOpponentName(autoSavedData.opponentName || '');
    setGameResult(autoSavedData.gameResult || '');
    setTeamRatings(autoSavedData.teamRatings || {});
    setTeamRatingNotes(autoSavedData.teamRatingNotes || '');
    setTeamRatingNotesPrivate(autoSavedData.teamRatingNotesPrivate || false);
    setTeamMetricNotes(autoSavedData.teamMetricNotes || {});
    setTeamMetricNotesPrivacy(autoSavedData.teamMetricNotesPrivacy || {});
    setMvpVotes(autoSavedData.mvpVotes || { vote3: '', vote2: '', vote1: '' });
    setMvpNotes(autoSavedData.mvpNotes || { vote3: '', vote2: '', vote1: '' });
    setGameNotes(autoSavedData.gameNotes || '');
    setGameNotesPrivate(autoSavedData.gameNotesPrivate || false);
    setPlayerAssessments(autoSavedData.playerAssessments || {});
    clearAutoSave();
  };

  // Get players for active team
  const teamPlayers = useMemo(() => {
    return playersByTeam[activeTeamId] || [];
  }, [activeTeamId, playersByTeam]);

  // Get active team info
  const activeTeam = useMemo(() => {
    return coachTeams.find(t => t.id === activeTeamId);
  }, [coachTeams, activeTeamId]);

  // Get appropriate age group for benchmarks based on team
  const matchAgeGroup = useMemo(() => {
    return getMatchAgeGroupFromTeam(activeTeam?.ageGroup);
  }, [activeTeam]);

  // Dynamic metrics from Firestore
  const [dynamicMetrics, setDynamicMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    if (!matchAgeGroup?.id) return;
    setMetricsLoading(true);
    getMetricsWithFallback(matchAgeGroup.id)
      .then(m => { setDynamicMetrics(m); setMetricsLoading(false); })
      .catch(() => { setDynamicMetrics(null); setMetricsLoading(false); });
  }, [matchAgeGroup?.id]);

  // Compute team and player metrics from dynamic data or defaults
  const teamMetrics = useMemo(() => {
    const source = dynamicMetrics || MATCH_METRICS;
    return source.map(metric => ({
      id: metric.id,
      name: metric.name,
      icon: DEFAULT_METRIC_ICONS[metric.id] || Target,
      description: metric.description
    }));
  }, [dynamicMetrics]);

  const playerMetrics = useMemo(() => {
    const source = dynamicMetrics || MATCH_METRICS;
    return source.map(metric => ({
      id: metric.id,
      name: metric.name
    }));
  }, [dynamicMetrics]);

  // State for showing criteria tooltip
  const [showCriteriaTooltip, setShowCriteriaTooltip] = useState(null);

  // Generate draft key based on team and date
  const getDraftKey = useCallback((teamId, date) => {
    return `match_draft_${currentUser?.uid}_${teamId}_${date}`;
  }, [currentUser]);

  // Check for existing draft when team or date changes
  const checkForDraft = useCallback(() => {
    if (!currentUser) return;

    try {
      const draftKey = getDraftKey(activeTeamId, matchDate);
      const savedDraft = localStorage.getItem(draftKey);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setExistingDraft(draft);
        setShowDraftBanner(true);
      } else {
        setExistingDraft(null);
        setShowDraftBanner(false);
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  }, [currentUser, activeTeamId, matchDate, getDraftKey]);

  // Check for draft on mount and when team/date changes
  useEffect(() => {
    checkForDraft();
  }, [checkForDraft]);

  // Get available players for each MVP vote (exclude already selected)
  const getAvailablePlayersForVote = (voteId) => {
    const selectedIds = Object.entries(mvpVotes)
      .filter(([key, value]) => key !== voteId && value !== '')
      .map(([, value]) => value);
    return teamPlayers.filter(p => !selectedIds.includes(p.id));
  };

  // Reset form for new assessment
  const resetForm = () => {
    setOpponentName('');
    setGameResult('');
    setTeamRatings({});
    setTeamRatingNotes('');
    setTeamRatingNotesPrivate(false);
    setTeamMetricNotes({});
    setTeamMetricNotesPrivacy({});
    setMvpVotes({ vote3: '', vote2: '', vote1: '' });
    setMvpNotes({ vote3: '', vote2: '', vote1: '' });
    setExpandedMvpNotes({});
    setGameNotes('');
    setGameNotesPrivate(false);
    setExpandedPlayers({});
    setExpandedMetricNotes({});
    setExpandedTeamMetricNotes({});
    setPlayerAssessments({});
    setMatchDate(new Date().toISOString().split('T')[0]);
    setSaveError(null);
    setExistingDraft(null);
    setShowDraftBanner(false);
    setSavedOffline(false);
    setShowTeamNotes(false);
  };

  // Handle team tab click
  const handleTeamChange = (teamId) => {
    setActiveTeamId(teamId);
    setTeamRatings({});
    setTeamRatingNotes('');
    setTeamRatingNotesPrivate(false);
    setTeamMetricNotes({});
    setTeamMetricNotesPrivacy({});
    setMvpVotes({ vote3: '', vote2: '', vote1: '' });
    setMvpNotes({ vote3: '', vote2: '', vote1: '' });
    setExpandedMvpNotes({});
    setGameNotes('');
    setOpponentName('');
    setGameResult('');
    setExpandedPlayers({});
    setExpandedMetricNotes({});
    setExpandedTeamMetricNotes({});
    setPlayerAssessments({});
    setExistingDraft(null);
    setShowDraftBanner(false);
    setShowTeamNotes(false);
  };

  // Load draft into form
  const handleLoadDraft = () => {
    if (!existingDraft) return;

    setOpponentName(existingDraft.opponentName || '');
    setGameResult(existingDraft.gameResult || '');
    setTeamRatings(existingDraft.teamRatings || {});
    setTeamRatingNotes(existingDraft.teamRatingNotes || '');
    setTeamRatingNotesPrivate(existingDraft.teamRatingNotesPrivate || false);
    setTeamMetricNotes(existingDraft.teamMetricNotes || {});
    setTeamMetricNotesPrivacy(existingDraft.teamMetricNotesPrivacy || {});
    setMvpVotes(existingDraft.mvpVotes || { vote3: '', vote2: '', vote1: '' });
    setMvpNotes(existingDraft.mvpNotes || { vote3: '', vote2: '', vote1: '' });
    setGameNotes(existingDraft.gameNotes || '');
    setGameNotesPrivate(existingDraft.gameNotesPrivate || false);
    setPlayerAssessments(existingDraft.playerAssessments || {});
    setShowDraftBanner(false);
  };

  // Discard draft
  const handleDiscardDraft = () => {
    if (!currentUser) return;

    const draftKey = getDraftKey(activeTeamId, matchDate);
    localStorage.removeItem(draftKey);
    setExistingDraft(null);
    setShowDraftBanner(false);
  };

  // Handle team metric change
  const handleTeamMetricChange = (metricId, level) => {
    setTeamRatings(prev => ({
      ...prev,
      [metricId]: level
    }));
  };

  // Handle MVP vote change
  const handleMvpVoteChange = (voteId, playerId) => {
    setMvpVotes(prev => ({
      ...prev,
      [voteId]: playerId
    }));
    setOpenMvpDropdown(null);
  };

  // Toggle player expansion
  const togglePlayerExpansion = (playerId) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  // Handle player metric change
  const handlePlayerMetricChange = (playerId, metricId, level) => {
    setPlayerAssessments(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        metrics: {
          ...(prev[playerId]?.metrics || {}),
          [metricId]: level
        }
      }
    }));
  };

  // Handle player notes change (public)
  const handlePlayerNotesChange = (playerId, notes) => {
    setPlayerAssessments(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        notes: notes
      }
    }));
  };

  // Handle player private notes change
  const handlePlayerPrivateNotesChange = (playerId, notes) => {
    setPlayerAssessments(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        privateNotes: notes
      }
    }));
  };

  // Handle per-metric note change for a player
  const handlePlayerMetricNoteChange = (playerId, metricId, note) => {
    setPlayerAssessments(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        metricNotes: {
          ...(prev[playerId]?.metricNotes || {}),
          [metricId]: note
        }
      }
    }));
  };

  const togglePlayerMetricNotePrivacy = (playerId, metricId) => {
    setPlayerAssessments(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        metricNotesPrivacy: {
          ...(prev[playerId]?.metricNotesPrivacy || {}),
          [metricId]: !(prev[playerId]?.metricNotesPrivacy?.[metricId])
        }
      }
    }));
  };

  // Toggle metric note expansion
  const toggleMetricNote = (playerId, metricId) => {
    const key = `${playerId}-${metricId}`;
    setExpandedMetricNotes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle player notes visibility
  const togglePlayerNotesVisibility = (playerId) => {
    if (!playerId) return; // Guard against undefined playerId

    setPlayerAssessments(prev => {
      const existingAssessment = prev[playerId] || { metrics: {}, notes: '', notesPrivate: true };
      return {
        ...prev,
        [playerId]: {
          ...existingAssessment,
          notesPrivate: !existingAssessment.notesPrivate
        }
      };
    });
  };

  // Get player assessment data
  const getPlayerAssessment = (playerId) => {
    return playerAssessments[playerId] || { metrics: {}, notes: '', privateNotes: '', notesPrivate: true, metricNotes: {}, metricNotesPrivacy: {} };
  };

  // Count assessed metrics for a player
  const getPlayerAssessedCount = (playerId) => {
    const assessment = getPlayerAssessment(playerId);
    return Object.keys(assessment.metrics || {}).length;
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!currentUser) return;

    setIsSavingDraft(true);
    setSaveError(null);

    try {
      const draftData = {
        teamId: activeTeamId,
        teamName: activeTeam?.name,
        coachId: currentUser.uid,
        matchDate,
        opponentName,
        gameResult,
        teamRatings,
        teamRatingNotes,
        teamRatingNotesPrivate,
        teamMetricNotes,
        teamMetricNotesPrivacy,
        mvpVotes,
        mvpNotes,
        gameNotes,
        gameNotesPrivate,
        playerAssessments,
        savedAt: new Date().toISOString(),
        lastModified: Date.now()
      };

      // Save to localStorage (works offline)
      const draftKey = getDraftKey(activeTeamId, matchDate);
      localStorage.setItem(draftKey, JSON.stringify(draftData));

      // Also save to Firestore if online (for cross-device access)
      if (isOnline) {
        await addDocument('match_drafts', {
          ...draftData,
          createdAt: new Date()
        });
      }

      setExistingDraft(draftData);

      // Show brief confirmation
      setSavedOffline(true);
      setTimeout(() => setSavedOffline(false), 2000);

    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveError('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle save assessment
  const handleSaveAssessment = async () => {
    if (!currentUser || !canSave) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Build MVP data structures BEFORE the assessment object
      // to avoid any variable scoping confusion with property names
      const mvpVotesById = {};
      if (mvpVotes.vote3) mvpVotesById[mvpVotes.vote3] = { votes: 3, note: mvpNotes.vote3 || '' };
      if (mvpVotes.vote2) mvpVotesById[mvpVotes.vote2] = { votes: 2, note: mvpNotes.vote2 || '' };
      if (mvpVotes.vote1) mvpVotesById[mvpVotes.vote1] = { votes: 1, note: mvpNotes.vote1 || '' };

      const mvpVotingData = {
        type: '3-2-1',
        votes: {
          3: mvpVotes.vote3 || null,
          2: mvpVotes.vote2 || null,
          1: mvpVotes.vote1 || null
        },
        notes: {
          3: mvpNotes.vote3 || '',
          2: mvpNotes.vote2 || '',
          1: mvpNotes.vote1 || ''
        }
      };

      console.log('[MatchDay] MVP state before save:', JSON.stringify(mvpVotes));
      console.log('[MatchDay] MVP votesById:', JSON.stringify(mvpVotesById));
      console.log('[MatchDay] MVP votingData:', JSON.stringify(mvpVotingData));

      // Resolve gameId — never save with null
      const resolvedGameId = gameDayData?.id || (() => {
        const assessmentDate = new Date(matchDate);
        const match = (firestoreGames || []).find(g => {
          if (g.teamId !== activeTeamId) return false;
          const gDate = g.date?.toDate ? g.date.toDate() : new Date(g.date);
          return gDate.toDateString() === assessmentDate.toDateString();
        });
        return match?.id || null;
      })();

      if (!resolvedGameId) {
        setSaveError('Cannot save: no game found for this team and date. Please ensure a game exists in the schedule.');
        setIsSaving(false);
        return;
      }

      // Check for existing assessment with same gameId + teamId to prevent duplicates
      const existingDoc = (existingAssessments || []).find(
        a => a.gameId === resolvedGameId && a.teamId === activeTeamId
      );

      // Build the match assessment data structure
      const assessmentData = {
        gameId: resolvedGameId,
        teamId: activeTeamId,
        teamName: activeTeam?.name,
        ageGroup: activeTeam?.ageGroup,
        coachId: currentUser.uid,
        coachName: userProfile?.displayName || 'Unknown Coach',
        date: new Date(matchDate),
        opponent: opponentName,
        result: gameResult,
        teamMetrics: teamRatings,
        teamMetricNotes: Object.entries(teamMetricNotes).reduce((acc, [metricId, note]) => {
          acc[metricId] = { note: note || '', private: !!teamMetricNotesPrivacy[metricId] };
          return acc;
        }, {}),
        teamPerformanceNotes: { note: teamRatingNotes || '', private: !!teamRatingNotesPrivate },
        generalMatchNotes: { note: gameNotes || '', private: !!gameNotesPrivate },
        playerAssessments: Object.entries(playerAssessments).reduce((acc, [playerId, data]) => {
          const player = teamPlayers.find(p => p.id === playerId);
          acc[playerId] = {
            playerName: player?.name || 'Unknown',
            playerNumber: player?.number || 0,
            metrics: data.metrics || {},
            metricNotes: Object.entries(data.metricNotes || {}).reduce((mn, [metricId, note]) => {
              mn[metricId] = { note: note || '', private: !!(data.metricNotesPrivacy || {})[metricId] };
              return mn;
            }, {}),
            publicNotes: data.notes || '',
            privateNotes: data.privateNotes || '',
            notes: data.notes || '',
            notesPrivate: data.notesPrivate !== false
          };
          return acc;
        }, {}),
        mvpVotes: mvpVotesById,
        mvpVoting: mvpVotingData,
        createdAt: new Date(),
        savedOffline: !isOnline
      };

      // Save to Firestore — update existing or create new
      if (existingDoc) {
        console.log('[MatchDay] Updating existing assessment:', existingDoc.id);
        await updateDocument('match_assessments', existingDoc.id, assessmentData);
      } else {
        console.log('[MatchDay] Creating new assessment for gameId:', resolvedGameId);
        await addDocument('match_assessments', assessmentData);
      }

      // Sync result back to the games document
      if (resolvedGameId && gameResult) {
        try {
          // Direct Firestore call — bypass DataContext updateDocument
          await updateDoc(doc(db, 'games', resolvedGameId), {
            result: gameResult,
            hasAssessment: true,
            status: 'completed'
          });
        } catch (err) {
          console.error('Game result sync failed:', err.message);
        }
      }

      // Audit log
      logActivity(
        { uid: currentUser.uid, displayName: userProfile?.displayName, role: userProfile?.role },
        'assessment.match',
        `Match assessment saved: ${activeTeam?.name || 'Unknown'} vs ${opponentName || 'Unknown'}`,
        { gameId: resolvedGameId, teamId: activeTeamId }
      );

      // Delete draft if exists
      const draftKey = getDraftKey(activeTeamId, matchDate);
      localStorage.removeItem(draftKey);
      clearAutoSave();

      // Track if saved offline
      setSavedOffline(!isOnline);

      // Show post-save modal
      setShowPostSaveModal(true);

    } catch (error) {
      console.error('Error saving game assessment:', error);
      setSaveError(error.message || 'Failed to save assessment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle post-save actions
  const handleSaveAndNew = () => {
    setShowPostSaveModal(false);
    resetForm();
    window.scrollTo(0, 0);
  };

  const handleReturnToDashboard = () => {
    setShowPostSaveModal(false);
    navigate('/dashboard');
  };

  // Calculate if form is complete enough to save
  const canSave = opponentName.trim() !== '' && gameResult !== '';

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabsContainerRef.current && activeTeamId) {
      const activeTab = tabsContainerRef.current.querySelector(`[data-team-id="${activeTeamId}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTeamId]);

  // Close MVP dropdown and game selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMvpDropdown && !e.target.closest('.mvp-dropdown-container')) {
        setOpenMvpDropdown(null);
      }
      if (showGameSelector && !e.target.closest('.game-selector-container')) {
        setShowGameSelector(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMvpDropdown, showGameSelector]);

  // Handle Game Day Mode - from navigation state OR hook detection
  useEffect(() => {
    if (gameDayLoaded) return;

    // Option A: navigated with explicit game data from dashboard
    if (gameDayState?.isGameDay && gameDayState?.gameData) {
      setIsGameDayMode(true);
      setGameDayData(gameDayState.gameData);

      if (gameDayState.gameData.opponent) {
        setOpponentName(gameDayState.gameData.opponent);
      }
      if (gameDayState.gameData.teamId) {
        const matchingTeam = coachTeams.find(t =>
          t.id === gameDayState.gameData.teamId ||
          t.name?.toLowerCase().includes(gameDayState.gameData.teamName?.toLowerCase()) ||
          gameDayState.gameData.teamName?.toLowerCase().includes(t.name?.toLowerCase())
        );
        if (matchingTeam) {
          setActiveTeamId(matchingTeam.id);
        }
      }
      setGameDayLoaded(true);
      // Clear nav state to prevent re-triggering on re-render
      window.history.replaceState({}, document.title);
      return;
    }

    // Option B: navigated directly (e.g. "Match Day" button) — detect via hook
    if (!gameDayHookLoading && hookIsGameDay && hookPrimaryGame) {
      const formatted = formatGameForDisplay(hookPrimaryGame);
      setIsGameDayMode(true);
      setGameDayData(formatted);
      if (formatted.opponent) {
        setOpponentName(formatted.opponent);
      }
      if (formatted.teamId) {
        const matchingTeam = coachTeams.find(t =>
          t.id === formatted.teamId ||
          t.name?.toLowerCase().includes(formatted.teamName?.toLowerCase()) ||
          formatted.teamName?.toLowerCase().includes(t.name?.toLowerCase())
        );
        if (matchingTeam) {
          setActiveTeamId(matchingTeam.id);
        }
      }
      setGameDayLoaded(true);
    }
  }, [gameDayState, gameDayLoaded, coachTeams, gameDayHookLoading, hookIsGameDay, hookPrimaryGame]);

  // Handle switching to a different game today
  const handleSwitchGame = (game) => {
    setGameDayData(game);
    setOpponentName(game.opponent || '');

    // Find matching team
    const matchingTeam = coachTeams.find(t =>
      t.id === game.teamId ||
      t.name?.toLowerCase().includes(game.teamName?.toLowerCase()) ||
      game.teamName?.toLowerCase().includes(t.name?.toLowerCase())
    );
    if (matchingTeam) {
      setActiveTeamId(matchingTeam.id);
      // Reset ratings when switching teams
      setTeamRatings({});
      setMvpVotes({ vote3: '', vote2: '', vote1: '' });
      setMvpNotes({ vote3: '', vote2: '', vote1: '' });
      setPlayerAssessments({});
    }

    setShowGameSelector(false);
  };

  // Load draft from URL parameter
  useEffect(() => {
    if (draftIdFromUrl && currentUser && !draftLoaded) {
      try {
        const draftData = localStorage.getItem(draftIdFromUrl);
        if (draftData) {
          const draft = JSON.parse(draftData);

          // Set the team
          if (draft.teamId) {
            setActiveTeamId(draft.teamId);
          }

          // Set the match date
          if (draft.matchDate) {
            setMatchDate(draft.matchDate);
          }

          // Load all draft data into form
          setOpponentName(draft.opponentName || '');
          setGameResult(draft.gameResult || '');
          setTeamRatings(draft.teamRatings || {});
          setTeamRatingNotes(draft.teamRatingNotes || '');
          setMvpVotes(draft.mvpVotes || { vote3: '', vote2: '', vote1: '' });
          setMvpNotes(draft.mvpNotes || { vote3: '', vote2: '', vote1: '' });
          setGameNotes(draft.gameNotes || '');
          setPlayerAssessments(draft.playerAssessments || {});

          // Hide the draft banner since we're auto-loading
          setShowDraftBanner(false);
          setExistingDraft(draft);
          setDraftLoaded(true);

          // Clear the URL parameter to prevent reloading
          navigate('/coach/match-assessment', { replace: true });
        }
      } catch (error) {
        console.error('Error loading draft from URL:', error);
      }
    }
  }, [draftIdFromUrl, currentUser, draftLoaded, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading match day assessment...</p>
        </div>
      </div>
    );
  }

  if (coachTeams.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center px-6">
          <Trophy className="w-12 h-12 text-[#D4E4D4] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">No Teams Assigned</h2>
          <p className="text-gray-500 text-sm">Contact your administrator to be assigned to a team.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-[#005028] text-white rounded-lg text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#D4E4D4] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Dashboard', url: '/dashboard' },
              { label: 'Match Day Assessment' }
            ]}
            className="mb-3"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#00A651]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Match Day Assessment</h1>
                <p className="text-[#00A651] text-sm">
                  {userProfile?.displayName || 'Coach'}
                </p>
              </div>
            </div>

            {/* Online/Offline Indicator with Sync Status */}
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isOnline
                  ? 'bg-[#005028] text-[#00A651] border border-[#00A651]'
                  : 'bg-yellow-900/50 text-yellow-400 border border-yellow-600'
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>
              {pendingSync > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                  <CloudOff className="w-3 h-3" />
                  <span>{pendingSync} pending sync</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Tabs - Only show if multiple teams */}
        {hasMultipleTeams ? (
          <div className="border-t border-[#D4E4D4]">
            <div
              ref={tabsContainerRef}
              className="flex overflow-x-auto hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {coachTeams.map((team) => (
                <button
                  key={team.id}
                  data-team-id={team.id}
                  onClick={() => handleTeamChange(team.id)}
                  className={`flex-shrink-0 px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTeamId === team.id
                      ? 'bg-[#005028] text-white border-[#00A651]'
                      : 'bg-white text-[#00A651] border-transparent hover:bg-[#0a4a38] hover:text-gray-800'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-[#D4E4D4] px-4 py-3 bg-[#005028]">
            <p className="text-gray-800 font-medium">{activeTeam?.name || 'Team'}</p>
            <p className="text-[#00A651] text-xs">{activeTeam?.ageGroup} Division</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Game Day Banner */}
        {isGameDayMode && gameDayData && (
          <div className="bg-gradient-to-r from-[#00A651]/30 to-[#00A651]/20 border-2 border-[#00A651] rounded-xl p-4 mb-6 relative overflow-hidden">
            {/* Animated background pulse */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              style={{
                animation: 'shimmer 2s infinite',
                backgroundSize: '200% 100%'
              }}
            />
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-[#005028] rounded-xl flex items-center justify-center shadow-lg shadow-[#00A651]/30">
                    <Zap className="w-7 h-7 text-gray-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#00A651] text-xs font-bold uppercase tracking-wider">🏀 Game Day Mode</span>
                    </div>
                    <h3 className="text-gray-800 font-bold text-lg">
                      {gameDayData.teamName} vs {gameDayData.opponent}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-[#00A651] mt-1">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {gameDayData.timeString || gameDayData.time}
                      </span>
                      {gameDayData.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {gameDayData.venue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multiple Games Selector */}
                {allTodaysGames.length > 1 && (
                  <div className="relative game-selector-container">
                    <button
                      onClick={() => setShowGameSelector(!showGameSelector)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 text-sm font-medium transition-colors"
                    >
                      <span className="hidden sm:inline">Switch Game</span>
                      <span className="bg-[#005028] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {allTodaysGames.length}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showGameSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Game Selector Dropdown */}
                    {showGameSelector && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#D4E4D4] rounded-xl shadow-xl z-30 overflow-hidden">
                        <div className="p-2 border-b border-[#D4E4D4]">
                          <p className="text-[#00A651] text-xs font-medium">Today's Games</p>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {allTodaysGames.map((game, index) => {
                            const isActive = game.id === gameDayData.id;
                            return (
                              <button
                                key={game.id || index}
                                onClick={() => handleSwitchGame(game)}
                                className={`w-full px-3 py-3 text-left hover:bg-[#F5F9F5] transition-colors ${
                                  isActive ? 'bg-[#005028]/20 border-l-4 border-[#00A651]' : ''
                                }`}
                              >
                                <p className={`font-medium text-sm ${isActive ? 'text-[#00A651]' : 'text-gray-800'}`}>
                                  {game.teamName} vs {game.opponent}
                                </p>
                                <p className="text-xs text-[#6B7C6B] mt-0.5">
                                  {game.timeString || game.time} • {game.venue || 'TBD'}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exit Game Day Mode link */}
              <div className="mt-3 pt-3 border-t border-[#00A651]/30">
                <button
                  onClick={() => navigate('/dashboard', { state: { skipGameDayRedirect: true } })}
                  className="text-xs text-[#00A651]/70 hover:text-[#00A651] transition-colors"
                >
                  ← Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Draft Banner */}
        {showDraftBanner && existingDraft && (
          <div className="bg-yellow-900/30 border-2 border-yellow-600 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-yellow-400 font-semibold text-sm">Unfinished Assessment Found</h3>
                <p className="text-yellow-300/80 text-xs mt-1">
                  You have a draft from {new Date(existingDraft.savedAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {existingDraft.opponentName && ` vs ${existingDraft.opponentName}`}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleLoadDraft}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Load Draft
                  </button>
                  <button
                    onClick={handleDiscardDraft}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-yellow-600 hover:bg-yellow-600/20 text-yellow-400 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowDraftBanner(false)}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Auto-save Recovery Banner */}
        {hasAutoSave && !showDraftBanner && !existingDraft && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-blue-700 font-semibold text-sm">Auto-saved Data Recovered</h3>
                <p className="text-blue-600 text-xs mt-1">
                  We recovered unsaved assessment data from your last session.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleLoadAutoSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={clearAutoSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-blue-300 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Details Section */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 mb-6">
          <h2 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00A651]" />
            Match Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-[#00A651] text-xs font-medium mb-2">Match Date</label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
              />
            </div>

            {/* Opponent Name */}
            <div>
              <label className="block text-[#00A651] text-xs font-medium mb-2">Opponent</label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Enter opponent team name"
                className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
              />
            </div>
          </div>

          {/* Game Result */}
          <div className="mt-4">
            <label className="block text-[#00A651] text-xs font-medium mb-2">Result</label>
            <div className="flex gap-3">
              {resultOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setGameResult(option.id)}
                  className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    gameResult === option.id
                      ? `${option.color} text-gray-800`
                      : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Performance Section */}
        <div className="mb-6">
          <h2 className="text-gray-800 font-semibold mb-1">Team Performance</h2>
          <p className="text-[#6B7C6B] text-sm mb-4">Rate each area (1-5) - Tap info icon to see criteria</p>

          <div className="space-y-3">
            {teamMetrics.map((metric) => {
              const Icon = metric.icon;
              const currentLevel = teamRatings[metric.id] || 0;
              const tooltipKey = `team-${metric.id}`;
              const isTooltipOpen = showCriteriaTooltip === tooltipKey;

              return (
                <div
                  key={metric.id}
                  className="bg-white border border-[#D4E4D4] rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#00A651]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-gray-800 font-medium text-sm">{metric.name}</h4>
                        <button
                          onClick={() => setShowCriteriaTooltip(isTooltipOpen ? null : tooltipKey)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Info className="w-4 h-4 text-[#00A651]" />
                        </button>
                      </div>
                      <p className="text-[#6B7C6B] text-xs">{metric.description}</p>
                    </div>
                    {currentLevel > 0 && (
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        currentLevel <= 2 ? 'text-orange-400 bg-orange-500/20' :
                        currentLevel === 3 ? 'text-yellow-400 bg-yellow-500/20' :
                        'text-[#00A651] bg-[#005028]/20'
                      }`}>
                        {levelLabels[currentLevel]}
                      </span>
                    )}
                  </div>

                  {/* Team Scoring Criteria Tooltip */}
                  {isTooltipOpen && TEAM_SCORING_CRITERIA[metric.id] && (
                    <div className="mb-3 bg-gray-900 rounded-lg p-3 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[#00A651] text-xs font-medium">
                          {metric.name} — Team Scoring
                        </h5>
                        <button
                          onClick={() => setShowCriteriaTooltip(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div key={level} className="flex gap-2">
                            <span className={`w-5 h-5 flex-shrink-0 rounded text-[10px] font-bold flex items-center justify-center ${levelColors[level]} text-white`}>
                              {level}
                            </span>
                            <div className="flex-1">
                              <span className="text-white text-[10px] font-medium">{levelLabels[level]}: </span>
                              <span className="text-gray-300 text-[10px]">{TEAM_SCORING_CRITERIA[metric.id][level]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Level Buttons (1-5) */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleTeamMetricChange(metric.id, level)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          currentLevel === level
                            ? `${levelColors[level]} text-white`
                            : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* Per-metric note toggle */}
                  <button
                    onClick={() => setExpandedTeamMetricNotes(prev => ({ ...prev, [metric.id]: !prev[metric.id] }))}
                    className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      teamMetricNotes[metric.id]
                        ? 'bg-[#F5F9F5] border border-[#00A651] text-[#00A651]'
                        : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{expandedTeamMetricNotes[metric.id] ? 'Hide Note' : teamMetricNotes[metric.id] ? 'Edit Note' : 'Add Note'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedTeamMetricNotes[metric.id] ? 'rotate-180' : ''}`} />
                  </button>
                  {/* Per-metric note textarea with public/private toggle */}
                  <div className={`overflow-hidden transition-all duration-200 ${expandedTeamMetricNotes[metric.id] ? 'max-h-[160px] mt-2' : 'max-h-0'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {teamMetricNotesPrivacy[metric.id] ? (
                          <>
                            <EyeOff className="w-3 h-3 text-[#6B7C6B]" />
                            <span className="text-xs font-medium text-[#6B7C6B]">Private</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-[#00A651]" />
                            <span className="text-xs font-medium text-[#00A651]">Public</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setTeamMetricNotesPrivacy(prev => ({ ...prev, [metric.id]: !prev[metric.id] }))}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          teamMetricNotesPrivacy[metric.id]
                            ? 'bg-gray-100 text-[#6B7C6B] hover:bg-gray-200'
                            : 'bg-[#005028]/10 text-[#00A651] hover:bg-[#005028]/20'
                        }`}
                      >
                        {teamMetricNotesPrivacy[metric.id] ? <><Eye className="w-3 h-3" /> Make Public</> : <><EyeOff className="w-3 h-3" /> Make Private</>}
                      </button>
                    </div>
                    <textarea
                      value={teamMetricNotes[metric.id] || ''}
                      onChange={(e) => setTeamMetricNotes(prev => ({ ...prev, [metric.id]: e.target.value }))}
                      placeholder={teamMetricNotesPrivacy[metric.id] ? `${metric.name} private notes (coach & admin only)...` : `${metric.name} notes...`}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg text-gray-800 text-xs placeholder-gray-400 focus:outline-none resize-none ${
                        teamMetricNotesPrivacy[metric.id]
                          ? 'bg-gray-50 border border-gray-200 focus:border-[#6B7C6B]'
                          : 'bg-[#F5F9F5] border border-[#D4E4D4] focus:border-[#00A651]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team Performance Notes - Collapsible */}
          <div className="mt-4">
            <button
              onClick={() => setShowTeamNotes(!showTeamNotes)}
              className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 flex items-center justify-between hover:border-[#00A651] transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00A651]" />
                <span className="text-gray-800 text-sm font-medium">Team Performance Notes</span>
                {teamRatingNotes && <span className="text-xs text-[#00A651] bg-[#005028]/20 px-2 py-0.5 rounded">Has notes</span>}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#6B7C6B] transition-transform duration-200 ${showTeamNotes ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${showTeamNotes ? 'max-h-[250px] mt-2' : 'max-h-0'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {teamRatingNotesPrivate ? (
                    <><EyeOff className="w-3 h-3 text-[#6B7C6B]" /><span className="text-xs font-medium text-[#6B7C6B]">Private</span></>
                  ) : (
                    <><Eye className="w-3 h-3 text-[#00A651]" /><span className="text-xs font-medium text-[#00A651]">Public</span></>
                  )}
                </div>
                <button
                  onClick={() => setTeamRatingNotesPrivate(prev => !prev)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    teamRatingNotesPrivate ? 'bg-gray-100 text-[#6B7C6B] hover:bg-gray-200' : 'bg-[#005028]/10 text-[#00A651] hover:bg-[#005028]/20'
                  }`}
                >
                  {teamRatingNotesPrivate ? <><Eye className="w-3 h-3" /> Make Public</> : <><EyeOff className="w-3 h-3" /> Make Private</>}
                </button>
              </div>
              <textarea
                value={teamRatingNotes}
                onChange={(e) => setTeamRatingNotes(e.target.value)}
                placeholder={teamRatingNotesPrivate ? "Private team performance notes (coach & admin only)..." : "Notes about overall team performance... (optional)"}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none resize-none ${
                  teamRatingNotesPrivate ? 'bg-gray-50 border border-gray-200 focus:border-[#6B7C6B]' : 'bg-[#F5F9F5] border border-[#D4E4D4] focus:border-[#00A651]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* General Match Notes - Collapsible */}
        <div className="mb-6">
          <button
            onClick={() => setShowGeneralNotes(!showGeneralNotes)}
            className="w-full bg-white border border-[#D4E4D4] rounded-xl p-4 flex items-center justify-between hover:border-[#00A651] transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00A651]" />
              <span className="text-gray-800 font-semibold">General Match Notes</span>
              {gameNotes && <span className="text-xs text-[#00A651] bg-[#005028]/20 px-2 py-0.5 rounded">Has notes</span>}
            </div>
            <ChevronDown className={`w-5 h-5 text-[#6B7C6B] transition-transform duration-200 ${showGeneralNotes ? 'rotate-180' : ''}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ${showGeneralNotes ? 'max-h-[350px] mt-2' : 'max-h-0'}`}>
            <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {gameNotesPrivate ? (
                    <><EyeOff className="w-3 h-3 text-[#6B7C6B]" /><span className="text-xs font-medium text-[#6B7C6B]">Private</span></>
                  ) : (
                    <><Eye className="w-3 h-3 text-[#00A651]" /><span className="text-xs font-medium text-[#00A651]">Public</span></>
                  )}
                </div>
                <button
                  onClick={() => setGameNotesPrivate(prev => !prev)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    gameNotesPrivate ? 'bg-gray-100 text-[#6B7C6B] hover:bg-gray-200' : 'bg-[#005028]/10 text-[#00A651] hover:bg-[#005028]/20'
                  }`}
                >
                  {gameNotesPrivate ? <><Eye className="w-3 h-3" /> Make Public</> : <><EyeOff className="w-3 h-3" /> Make Private</>}
                </button>
              </div>
              <textarea
                value={gameNotes}
                onChange={(e) => setGameNotes(e.target.value)}
                placeholder={gameNotesPrivate ? "Private match notes (coach & admin only)..." : "Add general notes about the game... (optional)"}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none resize-none ${
                  gameNotesPrivate ? 'bg-gray-50 border border-gray-200 focus:border-[#6B7C6B]' : 'bg-[#F5F9F5] border border-[#D4E4D4] focus:border-[#00A651]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Individual Player Assessments */}
        <div className="mb-6">
          <h2 className="text-gray-800 font-semibold mb-1 flex items-center gap-2">
            <User className="w-5 h-5 text-[#00A651]" />
            Individual Player Assessments
          </h2>
          <p className="text-[#6B7C6B] text-sm mb-4">Expand to rate each player (optional)</p>

          <div className="space-y-2">
            {teamPlayers.map((player) => {
              const isExpanded = expandedPlayers[player.id] || false;
              const assessment = getPlayerAssessment(player.id);
              const assessedCount = getPlayerAssessedCount(player.id);
              const hasNotes = assessment.notes?.length > 0;

              return (
                <div
                  key={player.id}
                  className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden"
                >
                  {/* Player Header - Collapsible */}
                  <button
                    onClick={() => togglePlayerExpansion(player.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#0a4a38] transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center">
                      <span className="text-gray-800 font-bold text-sm">#{player.number}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-gray-800 font-medium text-sm">{player.name}</h4>
                      <p className="text-[#6B7C6B] text-xs">
                        {assessedCount > 0 ? `${assessedCount}/${playerMetrics.length} rated` : 'Not assessed'}
                        {hasNotes && ' + notes'}
                        {Object.keys(assessment.metricNotes || {}).filter(k => assessment.metricNotes[k]).length > 0 &&
                          ` + ${Object.keys(assessment.metricNotes).filter(k => assessment.metricNotes[k]).length} metric notes`}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-[#6B7C6B] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Expanded Content */}
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
                    <div className="px-4 pb-4 pt-2 border-t border-[#D4E4D4]">
                      {/* Player Metrics */}
                      <div className="space-y-3 mb-4">
                        {playerMetrics.map((metric) => {
                          const currentLevel = assessment.metrics[metric.id] || 0;
                          const metricNoteKey = `${player.id}-${metric.id}`;
                          const isMetricNoteOpen = expandedMetricNotes[metricNoteKey] || false;
                          const metricNote = assessment.metricNotes?.[metric.id] || '';

                          const playerTooltipKey = `player-${player.id}-${metric.id}`;
                          const isPlayerTooltipOpen = showCriteriaTooltip === playerTooltipKey;

                          return (
                            <div key={metric.id}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-800 text-xs font-medium">{metric.name}</span>
                                  <button
                                    onClick={() => setShowCriteriaTooltip(isPlayerTooltipOpen ? null : playerTooltipKey)}
                                    className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                                  >
                                    <Info className="w-3 h-3 text-[#00A651]" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2">
                                  {metricNote && !isMetricNoteOpen && (
                                    <span className="text-[10px] text-[#00A651] bg-[#005028]/20 px-1.5 py-0.5 rounded">notes</span>
                                  )}
                                  {currentLevel > 0 && (
                                    <span className="text-[#00A651] text-xs">
                                      {levelLabels[currentLevel]}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Player Scoring Criteria Tooltip */}
                              {isPlayerTooltipOpen && PLAYER_SCORING_CRITERIA[metric.id] && (
                                <div className="mb-2 bg-gray-900 rounded-lg p-3 shadow-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-[#00A651] text-[10px] font-medium">
                                      {metric.name} — Individual Scoring
                                    </h5>
                                    <button onClick={() => setShowCriteriaTooltip(null)} className="text-gray-400 hover:text-white">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="space-y-1.5">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                      <div key={level} className="flex gap-2">
                                        <span className={`w-5 h-5 flex-shrink-0 rounded text-[10px] font-bold flex items-center justify-center ${levelColors[level]} text-white`}>
                                          {level}
                                        </span>
                                        <div className="flex-1">
                                          <span className="text-white text-[10px] font-medium">{levelLabels[level]}: </span>
                                          <span className="text-gray-300 text-[10px]">{PLAYER_SCORING_CRITERIA[metric.id][level]}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <button
                                    key={level}
                                    onClick={() => handlePlayerMetricChange(player.id, metric.id, level)}
                                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                      currentLevel === level
                                        ? `${levelColors[level]} text-white`
                                        : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651]'
                                    }`}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                              {/* Per-metric note toggle */}
                              <button
                                onClick={() => toggleMetricNote(player.id, metric.id)}
                                className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  metricNote
                                    ? 'bg-[#F5F9F5] border border-[#00A651] text-[#00A651]'
                                    : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                                }`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{isMetricNoteOpen ? 'Hide Note' : metricNote ? 'Edit Note' : 'Add Note'}</span>
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMetricNoteOpen ? 'rotate-180' : ''}`} />
                              </button>
                              {/* Per-metric note textarea with public/private toggle */}
                              <div className={`overflow-hidden transition-all duration-200 ${isMetricNoteOpen ? 'max-h-[160px] mt-2' : 'max-h-0'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1">
                                    {assessment.metricNotesPrivacy?.[metric.id] ? (
                                      <><EyeOff className="w-3 h-3 text-[#6B7C6B]" /><span className="text-[10px] font-medium text-[#6B7C6B]">Private</span></>
                                    ) : (
                                      <><Eye className="w-3 h-3 text-[#00A651]" /><span className="text-[10px] font-medium text-[#00A651]">Public</span></>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => togglePlayerMetricNotePrivacy(player.id, metric.id)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                      assessment.metricNotesPrivacy?.[metric.id] ? 'bg-gray-100 text-[#6B7C6B]' : 'bg-[#005028]/10 text-[#00A651]'
                                    }`}
                                  >
                                    {assessment.metricNotesPrivacy?.[metric.id] ? <><Eye className="w-3 h-3" /> Public</> : <><EyeOff className="w-3 h-3" /> Private</>}
                                  </button>
                                </div>
                                <textarea
                                  value={metricNote}
                                  onChange={(e) => handlePlayerMetricNoteChange(player.id, metric.id, e.target.value)}
                                  placeholder={assessment.metricNotesPrivacy?.[metric.id] ? `${metric.name} private notes (coach & admin only)...` : `${metric.name} notes for ${player.name}...`}
                                  rows={2}
                                  className={`w-full px-3 py-2 rounded-lg text-gray-800 text-xs placeholder-gray-400 focus:outline-none resize-none ${
                                    assessment.metricNotesPrivacy?.[metric.id] ? 'bg-gray-50 border border-gray-200 focus:border-[#6B7C6B]' : 'bg-[#F5F9F5] border border-[#D4E4D4] focus:border-[#00A651]'
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Player Notes - Collapsible with Public & Private */}
                      <div className="border-t border-[#D4E4D4] pt-3">
                        <button
                          onClick={() => setExpandedPlayerNotes(prev => ({ ...prev, [player.id]: !prev[player.id] }))}
                          className="w-full flex items-center justify-between py-2 hover:bg-[#F5F9F5]/50 rounded transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800 text-xs font-medium">Notes</span>
                            {(assessment.notes?.length > 0 || assessment.privateNotes?.length > 0) && (
                              <span className="text-[10px] text-[#00A651] bg-[#005028]/20 px-1.5 py-0.5 rounded">Has notes</span>
                            )}
                          </div>
                          <ChevronDown className={`w-4 h-4 text-[#6B7C6B] transition-transform duration-200 ${expandedPlayerNotes[player.id] ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`overflow-hidden transition-all duration-200 ${expandedPlayerNotes[player.id] ? 'max-h-[400px] mt-2' : 'max-h-0'}`}>
                          {/* Public Notes */}
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Eye className="w-3 h-3 text-[#00A651]" />
                              <span className="text-xs font-medium text-[#00A651]">Public Notes</span>
                            </div>
                            <textarea
                              value={assessment.notes || ''}
                              onChange={(e) => handlePlayerNotesChange(player.id, e.target.value)}
                              placeholder={`Public notes for ${player.name} (visible to player/parent)...`}
                              rows={2}
                              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:border-[#00A651] focus:outline-none resize-none"
                            />
                            <p className="text-[10px] text-[#6B7C6B] mt-0.5">Visible to player and parent in skills passport</p>
                          </div>

                          {/* Private Notes */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <EyeOff className="w-3 h-3 text-[#6B7C6B]" />
                              <span className="text-xs font-medium text-[#6B7C6B]">Private Notes 🔒</span>
                            </div>
                            <textarea
                              value={assessment.privateNotes || ''}
                              onChange={(e) => handlePlayerPrivateNotesChange(player.id, e.target.value)}
                              placeholder={`Private notes (coach & admin only)...`}
                              rows={2}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:border-[#6B7C6B] focus:outline-none resize-none"
                            />
                            <p className="text-[10px] text-[#6B7C6B] mt-0.5">Only visible to coaches and admin</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MVP Voting (3-2-1 System) */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 mb-6">
          <h2 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#00A651]" />
            MVP Voting (3-2-1)
          </h2>
          <p className="text-[#6B7C6B] text-xs mb-4">Award votes to top 3 performers</p>

          <div className="space-y-3">
            {mvpVoteOptions.map((vote) => {
              const selectedPlayer = teamPlayers.find(p => p.id === mvpVotes[vote.id]);
              const availablePlayers = getAvailablePlayersForVote(vote.id);

              return (
                <div key={vote.id} className="mvp-dropdown-container relative">
                  <label className="block text-[#00A651] text-xs font-medium mb-2">
                    {vote.label} - {vote.description}
                  </label>
                  <button
                    onClick={() => setOpenMvpDropdown(openMvpDropdown === vote.id ? null : vote.id)}
                    className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-left flex items-center justify-between hover:border-[#00A651] transition-colors"
                  >
                    <span className={selectedPlayer ? 'text-gray-800' : 'text-[#6B7C6B]'}>
                      {selectedPlayer ? (
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-[#D4E4D4] rounded-full flex items-center justify-center text-xs font-bold text-gray-800">
                            #{selectedPlayer.number}
                          </span>
                          {selectedPlayer.name}
                        </span>
                      ) : (
                        `Select player for ${vote.points} vote${vote.points > 1 ? 's' : ''}...`
                      )}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-[#6B7C6B] transition-transform ${openMvpDropdown === vote.id ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {openMvpDropdown === vote.id && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D4E4D4] rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto">
                      {/* Clear Option */}
                      {mvpVotes[vote.id] && (
                        <button
                          onClick={() => handleMvpVoteChange(vote.id, '')}
                          className="w-full px-4 py-2 text-left text-[#6B7C6B] hover:bg-[#F5F9F5] transition-colors border-b border-[#D4E4D4] text-sm"
                        >
                          Clear selection
                        </button>
                      )}

                      {/* Player Options */}
                      {availablePlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handleMvpVoteChange(vote.id, player.id)}
                          className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[#F5F9F5] transition-colors ${
                            mvpVotes[vote.id] === player.id ? 'bg-[#F5F9F5]' : ''
                          }`}
                        >
                          <span className="w-7 h-7 bg-[#D4E4D4] rounded-full flex items-center justify-center text-xs font-bold text-gray-800">
                            #{player.number}
                          </span>
                          <span className={mvpVotes[vote.id] === player.id ? 'text-[#00A651] font-medium' : 'text-gray-800'}>
                            {player.name}
                          </span>
                        </button>
                      ))}

                      {availablePlayers.length === 0 && (
                        <p className="px-4 py-3 text-[#6B7C6B] text-sm">No players available</p>
                      )}
                    </div>
                  )}

                  {/* MVP Note — expandable accordion under selected player */}
                  {selectedPlayer && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedMvpNotes(prev => ({ ...prev, [vote.id]: !prev[vote.id] }))}
                        className="flex items-center gap-1 text-xs text-[#6B7C6B] hover:text-[#00A651] transition-colors"
                      >
                        {expandedMvpNotes[vote.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {mvpNotes[vote.id] ? 'Edit Note' : 'Add Note'}
                        {mvpNotes[vote.id] && <span className="text-[#00A651] ml-1">✓</span>}
                      </button>
                      {expandedMvpNotes[vote.id] && (
                        <textarea
                          value={mvpNotes[vote.id]}
                          onChange={(e) => setMvpNotes(prev => ({ ...prev, [vote.id]: e.target.value }))}
                          placeholder={`Why was ${selectedPlayer.name} voted ${vote.description}?`}
                          className="w-full mt-1 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-sm text-gray-800 placeholder-[#6B7C6B] focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none resize-none"
                          rows={2}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium text-sm">Error Saving Assessment</p>
              <p className="text-red-300 text-xs mt-1">{saveError}</p>
            </div>
          </div>
        )}

        {/* Save Buttons */}
        <div className="space-y-3">
          {/* Save Assessment Button */}
          <button
            onClick={handleSaveAssessment}
            disabled={!canSave || isSaving}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              isSaving
                ? 'bg-[#D4E4D4] text-gray-800 cursor-wait'
                : canSave
                  ? 'bg-[#D4E4D4] hover:bg-[#00A651] text-white active:scale-[0.98]'
                  : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Save Game Assessment
              </>
            )}
          </button>

          {/* Save as Draft Button */}
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              isSavingDraft
                ? 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] cursor-not-allowed'
                : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651] hover:text-[#00A651] active:scale-[0.98]'
            }`}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Draft...
              </>
            ) : savedOffline && !showPostSaveModal ? (
              <>
                <Check className="w-4 h-4 text-[#00A651]" />
                Draft Saved!
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Save as Draft
              </>
            )}
          </button>
        </div>

        {!canSave && !isSaving && (
          <p className="text-center text-[#6B7C6B] text-xs mt-2">
            Please enter opponent name and select result to save
          </p>
        )}

        {!isOnline && (
          <p className="text-center text-yellow-400 text-xs mt-3">
            You're offline. Assessment will sync when connection is restored.
          </p>
        )}

        {/* Level Legend */}
        <div className="mt-6 bg-white border border-[#D4E4D4] rounded-xl p-4">
          <h4 className="text-gray-800 font-medium text-sm mb-3">Rating Guide ({matchAgeGroup.name})</h4>
          <div className="grid grid-cols-5 gap-1 text-xs">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded ${levelColors[level]} flex items-center justify-center text-white font-bold`}>
                  {level}
                </div>
                <span className="text-gray-800 text-center text-[10px] leading-tight">{levelLabels[level]}</span>
              </div>
            ))}
          </div>
          <p className="text-[#6B7C6B] text-[10px] mt-3 text-center">
            Tap the info icon next to each metric to see age-specific criteria
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#D4E4D4]">
        <p className="text-[#6B7C6B] text-xs">Emerald Lakers Match Day Assessment</p>
      </footer>

      {/* Post-Save Success Modal */}
      {showPostSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="bg-white border-2 border-[#D4E4D4] rounded-2xl w-full max-w-md p-6 shadow-2xl"
            style={{ animation: 'fadeIn 0.2s ease-out, scaleIn 0.2s ease-out' }}
          >
            {/* Success Icon */}
            <div className="w-16 h-16 bg-[#005028] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-gray-800" />
            </div>

            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
              Assessment Saved!
            </h2>
            <p className="text-[#00A651] text-center text-sm mb-2">
              {activeTeam?.name} vs {opponentName} has been recorded.
            </p>
            {savedOffline && (
              <p className="text-yellow-400 text-center text-xs mb-4">
                Saved locally. Will sync when online.
              </p>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <button
                onClick={handleSaveAndNew}
                className="w-full py-3 bg-[#D4E4D4] hover:bg-[#00A651] text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Save & Start New Assessment
              </button>
              <button
                onClick={handleReturnToDashboard}
                className="w-full py-3 bg-[#F5F9F5] border border-[#D4E4D4] hover:border-[#00A651] text-gray-800 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDayAssessmentPage;
