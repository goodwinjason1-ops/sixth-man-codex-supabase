import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import PageShell from '../../components/PageShell';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  ArrowLeft,
  ChevronRight,
  Send,
  Calendar,
  Shirt,
  Megaphone,
  Trophy,
  Clock,
  PartyPopper,
  Users,
  User,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Link2,
  X,
  Bell,
  Mail,
  Loader2,
  FileText,
  Check,
  CheckSquare,
  Square,
  ArrowRightLeft,
  Phone,
  Smartphone,
  Database,
  Trash2,
  AlertCircle,
  Info,
  Copy,
  LogIn,
  UserCheck,
  Inbox,
  ToggleLeft,
  ToggleRight,
  MapPin
} from 'lucide-react';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_CONFIG,
  PRIORITY_LEVELS,
  AUDIENCE_TYPES,
  NOTIFICATION_TEMPLATES,
  SWAP_STATUS,
  createNotification,
  createScoringAssignment,
  createSwapRequest,
  parseTemplate,
  sendMultiChannelNotification,
  getNotificationRecipients
} from '../../services/notificationService';
import {
  formatDateAU,
  formatDateMediumAU,
  formatDateLongAU,
  formatTimeStringAU,
  formatGameDateTime,
  formatDateForStorage,
  getNextSaturday
} from '../../utils/dateUtils';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { players, teams, games, addDocument, updateDocument, setDocument } = useData();

  // State
  const [activeTab, setActiveTab] = useState('create');
  const [notificationType, setNotificationType] = useState('');
  const [audienceType, setAudienceType] = useState(AUDIENCE_TYPES.ALL);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState(PRIORITY_LEVELS.NORMAL);

  // Template state - preserve custom edits per notification type
  const [customEdits, setCustomEdits] = useState({}); // { [type]: { subject, message } }
  const [hasEditedCurrent, setHasEditedCurrent] = useState(false);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');

  // Individual search state
  const [individualSearch, setIndividualSearch] = useState('');
  const [showIndividualDropdown, setShowIndividualDropdown] = useState(false);

  // Age group specific players toggle
  const [selectSpecificPlayers, setSelectSpecificPlayers] = useState(false);
  const [selectedAgeGroupPlayers, setSelectedAgeGroupPlayers] = useState([]);

  // Scoring wizard state (5 steps)
  const [scoringStep, setScoringStep] = useState(1);
  const [selectedScoringTeam, setSelectedScoringTeam] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedParent, setSelectedParent] = useState('');
  const [scoringMessage, setScoringMessage] = useState('');
  const [scoringSubject, setScoringSubject] = useState('');

  // History state
  const [notifications, setNotifications] = useState([]);
  const [historyFilter, setHistoryFilter] = useState({ type: 'all', status: 'all' });
  const [historySearch, setHistorySearch] = useState('');

  // Scoring roster state
  const [scoringAssignments, setScoringAssignments] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSwapAssignment, setSelectedSwapAssignment] = useState(null);
  const [swapTargetParent, setSwapTargetParent] = useState('');
  const [swapReason, setSwapReason] = useState('');

  // Enhanced scoring roster management state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignmentTarget, setReassignmentTarget] = useState('');
  const [reassignmentReason, setReassignmentReason] = useState('');
  const [scoringRosterView, setScoringRosterView] = useState('all'); // 'all', 'pending', 'confirmed', 'swap_requested'
  const [scoringRosterTeamFilter, setScoringRosterTeamFilter] = useState('all');
  const [showSwapRequestsModal, setShowSwapRequestsModal] = useState(false);
  const [selectedSwapRequest, setSelectedSwapRequest] = useState(null);
  const [isProcessingSwap, setIsProcessingSwap] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [autoAssignTeam, setAutoAssignTeam] = useState('');
  const [parentAvailability, setParentAvailability] = useState({});

  // Manual game entry state
  const [showManualGameEntry, setShowManualGameEntry] = useState(false);
  const [manualGameDate, setManualGameDate] = useState('');
  const [manualGameTime, setManualGameTime] = useState('09:00');
  const [manualGameOpponent, setManualGameOpponent] = useState('');
  const [manualGameVenue, setManualGameVenue] = useState('');

  // Debug mode state
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Delivery stats state
  const [deliveryStats, setDeliveryStats] = useState(null);
  const [detailedDeliveryRecipients, setDetailedDeliveryRecipients] = useState([]);

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPopulatingData, setIsPopulatingData] = useState(false);
  const [dataPopulationMessage, setDataPopulationMessage] = useState('');

  // Preview state
  const [previewUser, setPreviewUser] = useState('');
  const [previewNotifications, setPreviewNotifications] = useState([]);

  // Test users state
  const [testUsers, setTestUsers] = useState([]);
  const [copiedCredentials, setCopiedCredentials] = useState('');

  // Recipient data state
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Age groups
  const ageGroups = ['U8', 'U10', 'U12', 'U14', 'U16', 'U19'];

  // Fetch users from Firestore for recipient counting
  const fetchAllUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      console.log('[NotificationsPage] Fetching users...');
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('[NotificationsPage] Users fetched:', users.length);
      setAllUsers(users);

      // Set test users (those with test- prefix or known test emails)
      const testUsersList = users.filter(u =>
        u.email?.includes('test') ||
        u.email?.includes('@email.com') ||
        u.isTestUser
      );
      setTestUsers(testUsersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Get teams from Firestore with proper player counting
  const availableTeams = useMemo(() => {
    console.log('[NotificationsPage] Building availableTeams');
    console.log('[NotificationsPage] Teams from context:', teams?.length || 0);
    console.log('[NotificationsPage] Players from context:', players?.length || 0);

    // Log all players for debugging
    if (players?.length > 0) {
      console.log('[NotificationsPage] Sample player data:', {
        team: players[0].team,
        teamId: players[0].teamId,
        ageGroup: players[0].ageGroup
      });
    }

    if (teams && teams.length > 0) {
      return teams.map(t => {
        // Count players by matching teamId OR team name (multiple matching strategies)
        const teamPlayers = players?.filter(p => {
          const matchById = p.teamId === t.id;
          const matchByName = p.team === t.name || p.team === (t.name || t.teamName);
          const matchByDerivedId = p.team?.toLowerCase().replace(/\s+/g, '-') === t.id;
          return matchById || matchByName || matchByDerivedId;
        }) || [];

        console.log(`[NotificationsPage] Team "${t.name}" (id: ${t.id}): ${teamPlayers.length} players`);

        return {
          id: t.id,
          name: t.name || t.teamName,
          ageGroup: t.ageGroup || t.name?.match(/U\d+/i)?.[0]?.toUpperCase() || 'Other',
          playerCount: teamPlayers.length,
          players: teamPlayers
        };
      });
    }

    // Fallback: derive teams from player data
    const uniqueTeams = [...new Set(players?.map(p => p.team))].filter(Boolean).sort();
    console.log('[NotificationsPage] Falling back to player-derived teams:', uniqueTeams);

    return uniqueTeams.map(t => {
      const ageGroup = t.match(/U\d+/i)?.[0]?.toUpperCase() || 'Other';
      const teamPlayers = players?.filter(p => p.team === t) || [];
      return {
        id: t.toLowerCase().replace(/\s+/g, '-'),
        name: t,
        ageGroup,
        playerCount: teamPlayers.length,
        players: teamPlayers
      };
    });
  }, [teams, players]);

  // Filter teams by age group
  const filteredTeams = useMemo(() => {
    if (ageGroupFilter === 'all') return availableTeams;
    return availableTeams.filter(t => t.ageGroup === ageGroupFilter);
  }, [availableTeams, ageGroupFilter]);

  // Store raw games data for debugging
  const [rawGamesDebug, setRawGamesDebug] = useState({ total: 0, sample: null, allTeamIds: [] });

  // Get games from context or use sample data
  const availableGames = useMemo(() => {
    console.log('=== GAMES DATA DEBUG ===');
    console.log('Raw games from context:', games?.length || 0);

    if (games && games.length > 0) {
      // Log raw data structure for debugging
      console.log('Sample raw game document:', games[0]);
      console.log('All field names in first game:', Object.keys(games[0] || {}));

      // Extract all unique team identifiers from games
      const teamIdVariants = new Set();
      games.forEach(g => {
        if (g.teamId) teamIdVariants.add(`teamId: ${g.teamId}`);
        if (g.team_id) teamIdVariants.add(`team_id: ${g.team_id}`);
        if (g.teamID) teamIdVariants.add(`teamID: ${g.teamID}`);
        if (g.team) teamIdVariants.add(`team: ${g.team}`);
        if (g.teamName) teamIdVariants.add(`teamName: ${g.teamName}`);
      });
      console.log('Team ID variants found in games:', Array.from(teamIdVariants));

      // Store debug info
      setRawGamesDebug({
        total: games.length,
        sample: games[0],
        allTeamIds: Array.from(teamIdVariants),
        fieldNames: Object.keys(games[0] || {})
      });

      // Helper to parse dates from various formats
      const parseGameDate = (dateValue) => {
        if (!dateValue) return null;
        // Handle Firestore Timestamp
        if (dateValue?.toDate) {
          return dateValue.toDate();
        }
        // Handle seconds timestamp
        if (dateValue?.seconds) {
          return new Date(dateValue.seconds * 1000);
        }
        // Handle string or Date
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const futureGames = games.filter(g => {
        const gameDate = parseGameDate(g.date);
        if (!gameDate) {
          console.log(`Game ${g.id} has invalid date:`, g.date);
          return false;
        }
        const isFuture = gameDate >= today;
        console.log(`Game ${g.id} date: ${gameDate.toISOString()}, isFuture: ${isFuture}`);
        return isFuture;
      });

      console.log('Future games found:', futureGames.length, 'of', games.length, 'total');

      return futureGames.map(g => {
        // Normalize date to YYYY-MM-DD string format
        const gameDate = parseGameDate(g.date);
        const normalizedDate = gameDate ? formatDateForStorage(gameDate) : g.date;

        return {
          id: g.id,
          date: normalizedDate,
          rawDate: g.date, // Keep original for debugging
          time: g.time || '9:00 AM',
          // Try multiple field names for teamId
          teamId: g.teamId || g.team_id || g.teamID || null,
          // Store original team identifiers for flexible matching
          originalTeamId: g.teamId,
          originalTeamIdAlt: g.team_id,
          originalTeamName: g.teamName,
          originalTeam: g.team,
          team: g.teamName || g.team,
          opponent: g.opponent,
          venue: g.venue || 'TBD',
          // Keep raw data for debugging
          _raw: g
        };
      });
    }

    // Use dynamic future dates (next 4 Saturdays) - sample data
    console.log('Using sample game data (no games in context)');
    const getNextSaturday = (weeksFromNow) => {
      const today = new Date();
      const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
      const nextSat = new Date(today);
      nextSat.setDate(today.getDate() + daysUntilSat + (weeksFromNow * 7));
      return nextSat.toISOString().split('T')[0];
    };

    setRawGamesDebug({ total: 0, sample: null, allTeamIds: [], fieldNames: [], usingSampleData: true });

    return [
      { id: 'g1', date: getNextSaturday(0), time: '9:00 AM', teamId: 'lakers-u12', team: 'Lakers U12', opponent: 'Hills Hawks', venue: 'Emerald Indoor Courts' },
      { id: 'g2', date: getNextSaturday(0), time: '11:00 AM', teamId: 'lakers-u14', team: 'Lakers U14', opponent: 'North Stars', venue: 'Emerald Indoor Courts' },
      { id: 'g3', date: getNextSaturday(1), time: '10:00 AM', teamId: 'lakers-u10', team: 'Lakers U10', opponent: 'Western Warriors', venue: 'Sports Centre' },
      { id: 'g4', date: getNextSaturday(1), time: '2:00 PM', teamId: 'lakers-u8', team: 'Lakers U8', opponent: 'South Side', venue: 'Emerald Indoor Courts' },
      { id: 'g5', date: getNextSaturday(2), time: '9:00 AM', teamId: 'lakers-u16', team: 'Lakers U16', opponent: 'Eastern Eagles', venue: 'Sports Centre' },
      { id: 'g6', date: getNextSaturday(2), time: '11:00 AM', teamId: 'lakers-u12', team: 'Lakers U12', opponent: 'North Stars', venue: 'Sports Centre' },
      { id: 'g7', date: getNextSaturday(3), time: '9:00 AM', teamId: 'lakers-u14', team: 'Lakers U14', opponent: 'Western Warriors', venue: 'Emerald Indoor Courts' }
    ];
  }, [games]);

  // Searchable individuals list
  const searchableIndividuals = useMemo(() => {
    const individuals = [];

    // Add players with parent info
    players?.forEach(p => {
      if (p.parentName || p.parentEmail) {
        individuals.push({
          id: p.id,
          type: 'parent',
          name: p.parentName || `Parent of ${p.name}`,
          email: p.parentEmail || p.parent1Email,
          phone: p.parentPhone || p.parent1Phone,
          playerName: p.name,
          team: p.team
        });
      }
    });

    // Add users
    allUsers.forEach(u => {
      if (u.role === 'parent' || u.role === 'player') {
        const exists = individuals.some(i => i.email === u.email);
        if (!exists) {
          individuals.push({
            id: u.id,
            type: u.role,
            name: u.name || u.displayName || u.email,
            email: u.email,
            phone: u.phone
          });
        }
      }
    });

    return individuals;
  }, [players, allUsers]);

  // Filtered individuals based on search
  const filteredIndividuals = useMemo(() => {
    if (!individualSearch.trim()) return searchableIndividuals.slice(0, 10);

    const search = individualSearch.toLowerCase();
    return searchableIndividuals.filter(i =>
      i.name?.toLowerCase().includes(search) ||
      i.email?.toLowerCase().includes(search) ||
      i.playerName?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [searchableIndividuals, individualSearch]);

  // Players in selected age groups
  const ageGroupPlayers = useMemo(() => {
    if (selectedAgeGroups.length === 0) return [];

    return players?.filter(p => {
      const playerAgeGroup = p.ageGroup || p.team?.match(/U\d+/i)?.[0]?.toUpperCase();
      return selectedAgeGroups.includes(playerAgeGroup);
    }).map(p => ({
      id: p.id,
      name: p.name,
      parentName: p.parentName || p.parent1Name,
      parentEmail: p.parentEmail || p.parent1Email,
      team: p.team,
      ageGroup: p.ageGroup || p.team?.match(/U\d+/i)?.[0]?.toUpperCase()
    })) || [];
  }, [selectedAgeGroups, players]);

  // Sample notification history
  useEffect(() => {
    setNotifications([
      {
        id: 'n1',
        type: 'announcement',
        subject: 'Club Photos This Saturday',
        message: 'Reminder that team photos will be taken this Saturday...',
        priority: 'normal',
        targetAudience: { type: 'all' },
        sentAt: '2024-02-01T10:00:00Z',
        status: 'sent',
        readCount: 45,
        totalRecipients: 60,
        deliveryStats: { inApp: 60, email: 45, sms: 0 },
        recipients: [
          { name: 'John Smith', email: 'john@test.com', inApp: 'delivered', emailStatus: 'sent', readAt: '2024-02-01T12:00:00Z' },
          { name: 'Sarah Jones', email: 'sarah@test.com', inApp: 'delivered', emailStatus: 'sent', readAt: null }
        ]
      },
      {
        id: 'n2',
        type: 'scoring',
        subject: 'Scoring Duty - Lakers U12 vs Hawks',
        message: 'You are scheduled to score...',
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: ['parent1'] },
        sentAt: '2024-02-05T08:00:00Z',
        status: 'sent',
        readCount: 1,
        totalRecipients: 1,
        deliveryStats: { inApp: 1, email: 1, sms: 0 }
      }
    ]);

    // Dynamic dates for sample scoring assignments using imported utility
    setScoringAssignments([
      { id: 'sample-sa1', gameId: 'g1', game: 'Lakers U12 vs Hawks', date: formatDateForStorage(getNextSaturday(0)), time: '9:00 AM', parentId: 'p1', parentName: 'John Smith', status: 'confirmed', teamId: 'lakers-u12', teamName: 'Lakers U12', venue: 'Emerald Indoor Courts' },
      { id: 'sample-sa2', gameId: 'g2', game: 'Lakers U14 vs Stars', date: formatDateForStorage(getNextSaturday(0)), time: '11:00 AM', parentId: 'p2', parentName: 'Sarah Jones', status: 'pending', teamId: 'lakers-u14', teamName: 'Lakers U14', venue: 'Emerald Indoor Courts' },
      { id: 'sample-sa3', gameId: 'g3', game: 'Lakers U10 vs Warriors', date: formatDateForStorage(getNextSaturday(1)), time: '10:00 AM', parentId: 'p3', parentName: 'Mike Brown', status: 'pending', teamId: 'lakers-u10', teamName: 'Lakers U10', venue: 'Sports Centre' }
    ]);

    setSwapRequests([
      { id: 'sample-sr1', gameId: 'g3', gameName: 'Lakers U10 vs Warriors', gameDate: formatDateForStorage(getNextSaturday(1)), assignmentId: 'sample-sa3', requestingParentId: 'p3', requestingParentName: 'Mike Brown', targetParentId: 'p4', targetParentName: 'Lisa Wilson', reason: 'Can you cover for me? I have a work conflict.', status: 'pending', createdAt: new Date().toISOString() }
    ]);
  }, []);

  // Fetch scoring_assignments and swap_requests from Firestore
  useEffect(() => {
    // Subscribe to scoring_assignments collection
    const assignmentsQuery = query(collection(db, 'scoring_assignments'));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
      // Always replace sample data — use real Firestore data (even if empty)
      const firestoreAssignments = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id  // Must come AFTER spread to use real Firestore doc ID
      }));
      console.log('[ScoringRoster] Loaded scoring_assignments:', firestoreAssignments.length, firestoreAssignments.map(a => ({ id: a.id, game: a.game, status: a.status })));
      if (firestoreAssignments.length > 0) {
        setScoringAssignments(firestoreAssignments);
      }
    }, (error) => {
      console.error('[ScoringRoster] Error loading scoring_assignments:', error?.code, error?.message);
    });

    // Subscribe to swap_requests collection
    const swapsQuery = query(collection(db, 'swap_requests'));
    const unsubscribeSwaps = onSnapshot(swapsQuery, (snapshot) => {
      const firestoreSwaps = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id  // Must come AFTER spread to use real Firestore doc ID
      }));
      console.log('[ScoringRoster] Loaded swap_requests:', firestoreSwaps.length, firestoreSwaps.map(s => ({ id: s.id, status: s.status })));
      if (firestoreSwaps.length > 0) {
        setSwapRequests(firestoreSwaps);
      }
    }, (error) => {
      console.error('[ScoringRoster] Error loading swap_requests:', error?.code, error?.message);
    });

    return () => {
      unsubscribeAssignments();
      unsubscribeSwaps();
    };
  }, []);

  // Get parents for selected team with enhanced matching and debugging
  const teamParents = useMemo(() => {
    console.log('[NotificationsPage] Building teamParents for:', selectedScoringTeam);
    if (!selectedScoringTeam) return [];

    const team = availableTeams.find(t => t.id === selectedScoringTeam || t.name === selectedScoringTeam);
    console.log('[NotificationsPage] Found team:', team?.name, 'with', team?.players?.length || 0, 'cached players');

    if (!team) {
      console.log('[NotificationsPage] No matching team found for:', selectedScoringTeam);
      return [];
    }

    // Use players from team object if available, otherwise query from players array
    let teamPlayers = team.players || [];

    // If no cached players, query fresh
    if (teamPlayers.length === 0) {
      console.log('[NotificationsPage] No cached players, querying fresh...');
      teamPlayers = players?.filter(p => {
        const matchById = p.teamId === team.id;
        const matchByName = p.team === team.name;
        const matchByDerivedId = p.team?.toLowerCase().replace(/\s+/g, '-') === team.id;
        return matchById || matchByName || matchByDerivedId;
      }) || [];
      console.log('[NotificationsPage] Fresh query found:', teamPlayers.length, 'players');
    }

    const parents = teamPlayers.map(p => ({
      id: p.id,
      playerId: p.id,
      name: p.parentName || p.parent1Name || `Parent of ${p.name}`,
      email: p.parentEmail || p.parent1Email || '',
      phone: p.parentPhone || p.parent1Phone || '',
      playerName: p.name,
      playerAgeGroup: p.ageGroup
    })).filter(p => p.name && p.name !== 'Parent of undefined');

    console.log('[NotificationsPage] Final parents list:', parents.length, parents.map(p => p.name));
    return parents;
  }, [selectedScoringTeam, availableTeams, players]);

  // Store team games debug info
  const [teamGamesDebug, setTeamGamesDebug] = useState({
    searchedFor: null,
    matchAttempts: [],
    foundCount: 0
  });

  // Filter games for selected team with comprehensive flexible matching
  const teamGames = useMemo(() => {
    console.log('=== TEAM GAMES QUERY DEBUG ===');
    console.log('Selected Team ID:', selectedScoringTeam);

    if (!selectedScoringTeam) {
      setTeamGamesDebug({ searchedFor: null, matchAttempts: [], foundCount: 0 });
      return [];
    }

    const team = availableTeams.find(t => t.id === selectedScoringTeam || t.name === selectedScoringTeam);
    console.log('Found Team Object:', team);
    console.log('Team ID:', team?.id);
    console.log('Team Name:', team?.name);

    if (!team) {
      console.log('WARNING: No team found for selection:', selectedScoringTeam);
      setTeamGamesDebug({
        searchedFor: selectedScoringTeam,
        matchAttempts: ['No team object found'],
        foundCount: 0
      });
      return availableGames;
    }

    console.log('Available Games Count:', availableGames.length);
    console.log('Available Games teamIds:', availableGames.map(g => ({
      id: g.id,
      teamId: g.teamId,
      originalTeamId: g.originalTeamId,
      originalTeamIdAlt: g.originalTeamIdAlt,
      team: g.team,
      originalTeamName: g.originalTeamName
    })));

    // Build search criteria
    const searchCriteria = {
      teamId: team.id,
      teamIdLower: team.id?.toLowerCase(),
      teamName: team.name,
      teamNameLower: team.name?.toLowerCase(),
      selectedId: selectedScoringTeam,
      selectedIdLower: selectedScoringTeam?.toLowerCase()
    };
    console.log('Search Criteria:', searchCriteria);

    const matchAttempts = [];

    const filtered = availableGames.filter(g => {
      // Try all possible matching strategies
      const strategies = [
        { name: 'teamId === team.id', match: g.teamId === team.id },
        { name: 'teamId === selectedScoringTeam', match: g.teamId === selectedScoringTeam },
        { name: 'teamId.toLowerCase() === team.id.toLowerCase()', match: g.teamId?.toLowerCase() === team.id?.toLowerCase() },
        { name: 'originalTeamId === team.id', match: g.originalTeamId === team.id },
        { name: 'originalTeamIdAlt === team.id', match: g.originalTeamIdAlt === team.id },
        { name: 'team === team.name', match: g.team === team.name },
        { name: 'team.toLowerCase().includes(team.name.toLowerCase())', match: g.team?.toLowerCase().includes(team.name?.toLowerCase()) },
        { name: 'originalTeamName === team.name', match: g.originalTeamName === team.name },
        { name: 'originalTeam === team.name', match: g.originalTeam === team.name },
        { name: 'teamId === team.name (mismatched storage)', match: g.teamId === team.name },
        { name: 'team === team.id (mismatched storage)', match: g.team === team.id }
      ];

      const matchedStrategy = strategies.find(s => s.match);
      const matches = matchedStrategy !== undefined;

      if (matches) {
        console.log(`✓ Game "${g.team} vs ${g.opponent}" matched via: ${matchedStrategy.name}`);
      } else {
        console.log(`✗ Game "${g.team}" (teamId: ${g.teamId}) did NOT match team "${team.name}" (id: ${team.id})`);
      }

      return matches;
    });

    // Build debug summary
    const uniqueTeamIds = [...new Set(availableGames.map(g => g.teamId))];
    const uniqueTeamNames = [...new Set(availableGames.map(g => g.team))];

    const debugInfo = {
      searchedFor: {
        teamId: team.id,
        teamName: team.name,
        selectedId: selectedScoringTeam
      },
      matchAttempts: [
        `Searched for teamId: "${team.id}"`,
        `Searched for teamName: "${team.name}"`,
        `Total games checked: ${availableGames.length}`,
        `Games matched: ${filtered.length}`,
        `Unique teamIds in games: ${uniqueTeamIds.join(', ') || 'none'}`,
        `Unique teamNames in games: ${uniqueTeamNames.join(', ') || 'none'}`
      ],
      foundCount: filtered.length,
      uniqueTeamIds,
      uniqueTeamNames,
      mismatchHint: filtered.length === 0 && availableGames.length > 0 ?
        `MISMATCH DETECTED: You're searching for "${team.id}" but games have teamIds: [${uniqueTeamIds.join(', ')}]` : null
    };

    setTeamGamesDebug(debugInfo);

    console.log(`RESULT: ${filtered.length} games found for ${team.name}`);
    if (filtered.length === 0 && availableGames.length > 0) {
      console.log('!!! MISMATCH DETECTED !!!');
      console.log('Searching for:', team.id, 'or', team.name);
      console.log('But games have teamIds:', uniqueTeamIds);
      console.log('And team names:', uniqueTeamNames);
    }

    return filtered;
  }, [selectedScoringTeam, availableTeams, availableGames]);

  // Calculate recipient count with detailed breakdown
  const recipientInfo = useMemo(() => {
    let recipients = [];
    let parentSet = new Set();

    switch (audienceType) {
      case AUDIENCE_TYPES.ALL:
        const eligibleUsers = allUsers.filter(u =>
          u.role === 'player' || u.role === 'parent'
        );

        players?.forEach(p => {
          if (p.parentEmail) parentSet.add(p.parentEmail);
          if (p.parent1Email) parentSet.add(p.parent1Email);
        });

        recipients = eligibleUsers.length > 0 ? eligibleUsers : Array.from(parentSet).map(email => ({ email }));
        break;

      case AUDIENCE_TYPES.AGE_GROUP:
        if (selectedAgeGroups.length === 0) {
          recipients = [];
          break;
        }

        if (selectSpecificPlayers && selectedAgeGroupPlayers.length > 0) {
          // Use only selected specific players
          recipients = selectedAgeGroupPlayers.map(id => {
            const player = ageGroupPlayers.find(p => p.id === id);
            return player ? {
              id: player.id,
              email: player.parentEmail,
              name: player.parentName,
              playerName: player.name
            } : null;
          }).filter(Boolean);
        } else {
          // Use all players in age groups
          ageGroupPlayers.forEach(p => {
            if (p.parentEmail) parentSet.add(p.parentEmail);
          });

          recipients = ageGroupPlayers.map(p => ({
            id: p.id,
            email: p.parentEmail,
            name: p.parentName,
            playerName: p.name
          })).filter(r => r.email);
        }
        break;

      case AUDIENCE_TYPES.TEAM:
        if (selectedTeams.length === 0) {
          recipients = [];
          break;
        }

        const teamPlayers = players?.filter(p => {
          const playerTeamId = p.team?.toLowerCase().replace(/\s+/g, '-');
          return selectedTeams.includes(playerTeamId) ||
            selectedTeams.includes(p.teamId) ||
            selectedTeams.some(t => {
              const team = availableTeams.find(at => at.id === t);
              return team && (p.team === team.name || p.teamId === team.id);
            });
        }) || [];

        teamPlayers.forEach(p => {
          if (p.parentEmail) parentSet.add(p.parentEmail);
          if (p.parent1Email) parentSet.add(p.parent1Email);
        });

        recipients = teamPlayers.map(p => ({
          id: p.id,
          email: p.parentEmail || p.parent1Email,
          phone: p.parentPhone || p.parent1Phone,
          name: p.parentName || p.parent1Name,
          playerName: p.name
        })).filter(r => r.email);
        break;

      case AUDIENCE_TYPES.INDIVIDUAL:
        recipients = selectedUsers.map(userId => {
          const individual = searchableIndividuals.find(i => i.id === userId);
          return individual || null;
        }).filter(Boolean);
        break;

      default:
        recipients = [];
    }

    const withEmail = recipients.filter(r => r?.email).length;
    const withPhone = recipients.filter(r => r?.phone).length;
    const uniqueParentCount = parentSet.size > 0 ? parentSet.size : recipients.length;

    return {
      total: uniqueParentCount || recipients.length,
      withEmail,
      withPhone,
      inApp: uniqueParentCount || recipients.length,
      recipients: recipients.slice(0, 5),
      allRecipients: recipients,
      hasMore: recipients.length > 5
    };
  }, [audienceType, selectedAgeGroups, selectedTeams, selectedUsers, players, allUsers, availableTeams, selectSpecificPlayers, selectedAgeGroupPlayers, ageGroupPlayers, searchableIndividuals]);

  // Type icons
  const getTypeIcon = (type) => {
    const icons = {
      scoring: Calendar,
      uniform: Shirt,
      announcement: Megaphone,
      game_day: Trophy,
      training_change: Clock,
      event: PartyPopper
    };
    return icons[type] || Bell;
  };

  // Handle type selection with template preservation
  const handleTypeSelect = (type) => {
    // Save current edits if user has made changes
    if (notificationType && hasEditedCurrent) {
      setCustomEdits(prev => ({
        ...prev,
        [notificationType]: { subject, message }
      }));
    }

    setNotificationType(type);
    setHasEditedCurrent(false);

    // Check if we have saved custom edits for this type
    if (customEdits[type]) {
      setSubject(customEdits[type].subject);
      setMessage(customEdits[type].message);
    } else {
      // Use default template
      const template = NOTIFICATION_TEMPLATES[type];
      if (template) {
        setSubject(template.subject);
        setMessage(template.message);
      } else {
        // Clear if no template
        setSubject('');
        setMessage('');
      }
    }

    if (type === 'scoring') {
      setScoringStep(1);
      setSelectedScoringTeam('');
      setSelectedGame(null);
      setSelectedParent('');
      setScoringSubject('');
      setScoringMessage('');
    }
  };

  // Track when user edits the subject or message
  const handleSubjectChange = (value) => {
    setSubject(value);
    setHasEditedCurrent(true);
  };

  const handleMessageChange = (value) => {
    setMessage(value);
    setHasEditedCurrent(true);
  };

  // Reset to default template
  const handleResetTemplate = () => {
    const template = NOTIFICATION_TEMPLATES[notificationType];
    if (template) {
      setSubject(template.subject);
      setMessage(template.message);
      setHasEditedCurrent(false);
      // Also clear saved custom edits for this type
      setCustomEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[notificationType];
        return newEdits;
      });
    }
  };

  // Handle age group toggle with Select All support
  const handleAgeGroupToggle = (ag) => {
    setSelectedAgeGroups(prev =>
      prev.includes(ag) ? prev.filter(a => a !== ag) : [...prev, ag]
    );
    setSelectedAgeGroupPlayers([]);
  };

  const handleSelectAllAgeGroups = () => {
    if (selectedAgeGroups.length === ageGroups.length) {
      setSelectedAgeGroups([]);
    } else {
      setSelectedAgeGroups([...ageGroups]);
    }
    setSelectedAgeGroupPlayers([]);
  };

  // Handle team toggle
  const handleTeamToggle = (teamId) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  };

  const handleSelectAllTeams = () => {
    const allTeamIds = filteredTeams.map(t => t.id);
    if (selectedTeams.length === allTeamIds.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(allTeamIds);
    }
  };

  // Handle individual selection
  const handleSelectIndividual = (individual) => {
    if (!selectedUsers.includes(individual.id)) {
      setSelectedUsers(prev => [...prev, individual.id]);
    }
    setIndividualSearch('');
    setShowIndividualDropdown(false);
  };

  const handleRemoveIndividual = (userId) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  // Handle age group player toggle
  const handleAgeGroupPlayerToggle = (playerId) => {
    setSelectedAgeGroupPlayers(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSelectAllAgeGroupPlayers = () => {
    if (selectedAgeGroupPlayers.length === ageGroupPlayers.length) {
      setSelectedAgeGroupPlayers([]);
    } else {
      setSelectedAgeGroupPlayers(ageGroupPlayers.map(p => p.id));
    }
  };

  // Add attachment
  const handleAddAttachment = () => {
    if (newAttachmentUrl && newAttachmentName) {
      setAttachments(prev => [...prev, { url: newAttachmentUrl, name: newAttachmentName }]);
      setNewAttachmentUrl('');
      setNewAttachmentName('');
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const canSend = useMemo(() => {
    if (!notificationType) return false;

    if (notificationType === 'scoring') {
      return selectedScoringTeam && selectedGame && selectedParent && scoringMessage.trim();
    }

    if (!subject.trim()) return false;
    if (!message.trim()) return false;

    if (recipientInfo.total === 0) return false;

    if (audienceType === AUDIENCE_TYPES.AGE_GROUP && selectedAgeGroups.length === 0) return false;
    if (audienceType === AUDIENCE_TYPES.TEAM && selectedTeams.length === 0) return false;
    if (audienceType === AUDIENCE_TYPES.INDIVIDUAL && selectedUsers.length === 0) return false;

    return true;
  }, [notificationType, subject, message, audienceType, selectedAgeGroups, selectedTeams, selectedUsers, selectedScoringTeam, selectedGame, selectedParent, scoringMessage, recipientInfo.total]);

  // Handle send
  const handleSend = async () => {
    setShowConfirmModal(false);
    setIsSending(true);

    try {
      let notificationData;
      let recipients = [];

      if (notificationType === 'scoring') {
        const parent = teamParents.find(p => p.id === selectedParent);
        const parsedSubject = parseTemplate(scoringSubject || NOTIFICATION_TEMPLATES.scoring.subject, {
          teamName: selectedGame.team,
          opponent: selectedGame.opponent,
          parentName: parent?.name
        });
        const parsedMessage = parseTemplate(scoringMessage, {
          teamName: selectedGame.team,
          opponent: selectedGame.opponent,
          parentName: parent?.name,
          gameDate: new Date(selectedGame.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }),
          gameTime: selectedGame.time,
          venue: selectedGame.venue
        });

        notificationData = createNotification({
          type: 'scoring',
          subject: parsedSubject,
          message: parsedMessage,
          priority,
          audienceType: AUDIENCE_TYPES.INDIVIDUAL,
          userIds: [selectedParent],
          attachments,
          sendImmediately: true,
          createdBy: currentUser?.uid
        });

        const assignment = createScoringAssignment({
          gameId: selectedGame.id,
          teamId: selectedGame.teamId,
          parentId: selectedParent,
          parentName: parent?.name,
          parentEmail: parent?.email,
          gameDate: selectedGame.date,
          opponent: selectedGame.opponent,
          venue: selectedGame.venue
        });

        console.log('[ScoringRoster] Creating scoring_assignment:', assignment);
        const assignmentRef = await addDocument('scoring_assignments', assignment);
        console.log('[ScoringRoster] scoring_assignment created, docRef:', assignmentRef?.id);

        recipients = [{
          id: selectedParent,
          email: parent?.email,
          phone: parent?.phone,
          name: parent?.name,
          preferences: { notifications: { inApp: true, email: true, sms: false } }
        }];
      } else {
        notificationData = createNotification({
          type: notificationType,
          subject,
          message,
          priority,
          audienceType,
          ageGroups: selectedAgeGroups,
          teamIds: selectedTeams,
          userIds: selectedUsers,
          attachments,
          scheduledFor: !sendImmediately && scheduledDate ? `${scheduledDate}T${scheduledTime || '09:00'}` : null,
          sendImmediately,
          createdBy: currentUser?.uid
        });

        recipients = recipientInfo.allRecipients.map(r => ({
          id: r.id,
          email: r.email,
          phone: r.phone,
          name: r.name || r.parentName,
          preferences: { notifications: { inApp: true, email: true, sms: false } }
        }));
      }

      const stats = await sendMultiChannelNotification(notificationData, recipients);
      setDeliveryStats(stats);

      // Create detailed delivery tracking
      const detailedRecipients = recipients.map(r => ({
        userId: r.id,
        name: r.name,
        email: r.email,
        channels: {
          inApp: 'delivered',
          email: r.email ? 'sent' : 'skipped',
          sms: r.phone ? 'sent' : 'skipped'
        },
        readAt: null
      }));
      setDetailedDeliveryRecipients(detailedRecipients);

      await addDocument('notifications', {
        ...notificationData,
        deliveryStats: {
          inApp: stats.inApp,
          email: stats.email,
          sms: stats.sms
        },
        recipients: detailedRecipients
      });

      setNotifications(prev => [{
        ...notificationData,
        readCount: 0,
        totalRecipients: recipientInfo.total,
        deliveryStats: {
          inApp: stats.inApp,
          email: stats.email,
          sms: stats.sms
        },
        recipients: detailedRecipients
      }, ...prev]);

      setShowSuccessModal(true);

      setTimeout(() => {
        setNotificationType('');
        setSubject('');
        setMessage('');
        setPriority(PRIORITY_LEVELS.NORMAL);
        setAudienceType(AUDIENCE_TYPES.ALL);
        setSelectedAgeGroups([]);
        setSelectedTeams([]);
        setSelectedUsers([]);
        setAttachments([]);
        setSendImmediately(true);
        setScheduledDate('');
        setScheduledTime('');
        setScoringStep(1);
        setSelectedScoringTeam('');
        setSelectedGame(null);
        setSelectedParent('');
        setScoringSubject('');
        setScoringMessage('');
        setSelectSpecificPlayers(false);
        setSelectedAgeGroupPlayers([]);
      }, 2000);

    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle swap request
  const handleCreateSwapRequest = async () => {
    if (!selectedSwapAssignment || !swapTargetParent) return;

    const targetParent = teamParents.find(p => p.id === swapTargetParent);
    const swapRequest = createSwapRequest({
      assignmentId: selectedSwapAssignment.id,
      gameId: selectedSwapAssignment.gameId,
      gameName: selectedSwapAssignment.game,
      gameDate: selectedSwapAssignment.date,
      requestingParentId: selectedSwapAssignment.parentId,
      requestingParentName: selectedSwapAssignment.parentName,
      targetParentId: swapTargetParent,
      targetParentName: targetParent?.name,
      reason: swapReason
    });

    console.log('[ScoringRoster] Creating swap_request:', swapRequest);
    const docRef = await addDocument('swap_requests', swapRequest);
    console.log('[ScoringRoster] swap_request created, docRef:', docRef?.id);

    setSwapRequests(prev => [...prev, {
      ...swapRequest,
      id: docRef?.id || swapRequest.id
    }]);

    setShowSwapModal(false);
    setSelectedSwapAssignment(null);
    setSwapTargetParent('');
    setSwapReason('');
  };

  // Handle swap response
  const handleSwapResponse = async (swapId, response) => {
    const swap = swapRequests.find(s => s.id === swapId);
    if (!swap) return;

    if (response === 'accepted') {
      setScoringAssignments(prev => prev.map(a => {
        if (a.id === swap.assignmentId) {
          return {
            ...a,
            parentId: swap.targetParentId,
            parentName: swap.targetParentName,
            status: 'pending'
          };
        }
        return a;
      }));
    }

    setSwapRequests(prev => prev.map(s => {
      if (s.id === swapId) {
        return { ...s, status: response };
      }
      return s;
    }));
  };

  // Handle reassign
  const handleReassignScoring = (assignmentId, newParentId) => {
    const newParent = teamParents.find(p => p.id === newParentId);
    setScoringAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          parentId: newParentId,
          parentName: newParent?.name,
          status: 'pending'
        };
      }
      return a;
    }));
    setEditingAssignment(null);
  };

  // Enhanced reassignment with notification
  const handleReassignWithNotification = async () => {
    if (!editingAssignment || !reassignmentTarget) return;
    setIsProcessingSwap(true);
    console.log('[ScoringRoster] REASSIGN:', { assignmentId: editingAssignment.id, isSample: editingAssignment.id?.startsWith('sample-'), newParent: reassignmentTarget });

    try {
      const oldParent = editingAssignment.parentName;
      const newParent = allParentsForTeam.find(p => p.id === reassignmentTarget);
      if (!newParent) {
        console.log('[ScoringRoster] newParent not found in allParentsForTeam for:', reassignmentTarget);
        return;
      }

      // Update assignment — strip id from spread to avoid overwriting doc ID
      const { id: _assignmentId, ...assignmentData } = editingAssignment;
      const updatedAssignment = {
        ...assignmentData,
        parentId: reassignmentTarget,
        parentName: newParent.name,
        previousParentId: editingAssignment.parentId,
        previousParentName: oldParent,
        reassignedAt: new Date().toISOString(),
        reassignmentReason: reassignmentReason,
        status: 'pending'
      };

      // Update in Firestore if exists
      if (editingAssignment.id && !editingAssignment.id.startsWith('sample-')) {
        console.log('[ScoringRoster] Updating scoring_assignments doc:', editingAssignment.id);
        await updateDocument('scoring_assignments', editingAssignment.id, updatedAssignment);
        console.log('[ScoringRoster] scoring_assignments reassign SUCCESS');
      } else {
        console.log('[ScoringRoster] Skipping Firestore update for sample assignment:', editingAssignment.id);
      }

      // Update local state
      setScoringAssignments(prev => prev.map(a =>
        a.id === editingAssignment.id ? { ...updatedAssignment, id: editingAssignment.id } : a
      ));

      // Send notification to new parent
      const notifData = {
        type: 'scoring',
        subject: `Scoring Duty Assignment - ${editingAssignment.game}`,
        message: `You have been assigned scoring duty for ${editingAssignment.game} on ${new Date(editingAssignment.date).toLocaleDateString('en-AU')} at ${editingAssignment.time}.\n\nPlease confirm your availability.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [reassignmentTarget] },
        gameData: {
          gameId: editingAssignment.gameId,
          teamId: editingAssignment.teamId,
          team: editingAssignment.teamName,
          date: editingAssignment.date,
          time: editingAssignment.time
        }
      };

      await addDocument('notifications', {
        ...notifData,
        sentAt: new Date().toISOString(),
        status: 'sent',
        createdBy: currentUser?.uid
      });

      // Send courtesy notification to old parent if needed
      if (oldParent && editingAssignment.parentId) {
        await addDocument('notifications', {
          type: 'info',
          subject: `Scoring Duty Reassigned - ${editingAssignment.game}`,
          message: `Your scoring duty for ${editingAssignment.game} has been reassigned to ${newParent.name}. No action is needed from you.`,
          priority: 'normal',
          targetAudience: { type: 'individual', userIds: [editingAssignment.parentId] },
          sentAt: new Date().toISOString(),
          status: 'sent'
        });
      }

      setShowReassignModal(false);
      setEditingAssignment(null);
      setReassignmentTarget('');
      setReassignmentReason('');
      alert('Assignment updated and notifications sent!');

    } catch (error) {
      console.error('Reassignment error:', error);
      alert('Failed to reassign. Please try again.');
    } finally {
      setIsProcessingSwap(false);
    }
  };

  // Approve swap request
  const handleApproveSwapRequest = async (swap) => {
    setIsProcessingSwap(true);
    console.log('[ScoringRoster] APPROVE swap:', { swapId: swap.id, isSample: swap.id?.startsWith('sample-') });

    try {
      // Update swap request status — strip id from data to avoid overwriting doc ID
      const { id: _swapId, ...swapData } = swap;
      const updatedSwap = {
        ...swapData,
        status: 'accepted',
        respondedAt: new Date().toISOString(),
        respondedBy: currentUser?.uid
      };

      if (swap.id && !swap.id.startsWith('sample-')) {
        console.log('[ScoringRoster] Updating swap_requests doc:', swap.id);
        await updateDocument('swap_requests', swap.id, updatedSwap);
        console.log('[ScoringRoster] swap_requests update SUCCESS');
      } else {
        console.log('[ScoringRoster] Skipping Firestore update for sample swap:', swap.id);
      }

      // Update the assignment
      setScoringAssignments(prev => prev.map(a => {
        if (a.id === swap.assignmentId) {
          return {
            ...a,
            parentId: swap.targetParentId,
            parentName: swap.targetParentName,
            previousParentId: swap.requestingParentId,
            previousParentName: swap.requestingParentName,
            status: 'pending',
            swappedAt: new Date().toISOString()
          };
        }
        return a;
      }));

      // Update swap requests list
      setSwapRequests(prev => prev.map(s =>
        s.id === swap.id ? { ...updatedSwap, id: swap.id } : s
      ));

      // Send notifications to both parents
      await addDocument('notifications', {
        type: 'scoring',
        subject: 'Swap Request Approved',
        message: `Your swap request for ${swap.gameName || 'the game'} has been approved. ${swap.targetParentName} will now handle scoring duty.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [swap.requestingParentId] },
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      await addDocument('notifications', {
        type: 'scoring',
        subject: `Scoring Duty Assigned - ${swap.gameName || 'Game'}`,
        message: `You have accepted a swap request. You are now assigned to score for ${swap.gameName || 'the game'} on ${swap.gameDate ? new Date(swap.gameDate).toLocaleDateString('en-AU') : 'the scheduled date'}.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [swap.targetParentId] },
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      setShowSwapRequestsModal(false);
      setSelectedSwapRequest(null);
      alert('Swap approved and notifications sent!');

    } catch (error) {
      console.error('Approve swap error:', error);
      alert('Failed to approve swap. Please try again.');
    } finally {
      setIsProcessingSwap(false);
    }
  };

  // Decline swap request
  const handleDeclineSwapRequest = async (swap) => {
    setIsProcessingSwap(true);
    console.log('[ScoringRoster] DECLINE swap:', { swapId: swap.id, isSample: swap.id?.startsWith('sample-') });

    try {
      const { id: _swapId, ...swapData } = swap;
      const updatedSwap = {
        ...swapData,
        status: 'declined',
        respondedAt: new Date().toISOString(),
        respondedBy: currentUser?.uid
      };

      if (swap.id && !swap.id.startsWith('sample-')) {
        console.log('[ScoringRoster] Updating swap_requests doc:', swap.id);
        await updateDocument('swap_requests', swap.id, updatedSwap);
        console.log('[ScoringRoster] swap_requests decline SUCCESS');
      } else {
        console.log('[ScoringRoster] Skipping Firestore update for sample swap:', swap.id);
      }

      setSwapRequests(prev => prev.map(s =>
        s.id === swap.id ? { ...updatedSwap, id: swap.id } : s
      ));

      // Notify requesting parent
      await addDocument('notifications', {
        type: 'info',
        subject: 'Swap Request Declined',
        message: `Your swap request for ${swap.gameName || 'the game'} was declined. You are still assigned to this scoring duty.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [swap.requestingParentId] },
        sentAt: new Date().toISOString(),
        status: 'sent'
      });

      setShowSwapRequestsModal(false);
      setSelectedSwapRequest(null);
      alert('Swap declined and notification sent.');

    } catch (error) {
      console.error('Decline swap error:', error);
      alert('Failed to decline swap. Please try again.');
    } finally {
      setIsProcessingSwap(false);
    }
  };

  // Mark assignment as confirmed
  const [isMarkingConfirmed, setIsMarkingConfirmed] = useState(null);

  const handleMarkConfirmed = async (assignment) => {
    setIsMarkingConfirmed(assignment.id);
    console.log('[ScoringRoster] CONFIRM:', { assignmentId: assignment.id, isSample: assignment.id?.startsWith('sample-') });

    try {
      const { id: _aId, ...assignmentData } = assignment;
      const updatedAssignment = {
        ...assignmentData,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUser?.uid
      };

      if (assignment.id && !assignment.id.startsWith('sample-')) {
        console.log('[ScoringRoster] Updating scoring_assignments doc:', assignment.id);
        await updateDocument('scoring_assignments', assignment.id, updatedAssignment);
        console.log('[ScoringRoster] scoring_assignments confirm SUCCESS');
      } else {
        console.log('[ScoringRoster] Skipping Firestore update for sample:', assignment.id);
      }

      setScoringAssignments(prev => prev.map(a =>
        a.id === assignment.id ? { ...updatedAssignment, id: assignment.id } : a
      ));

      // Show success feedback
      alert(`✓ Marked as confirmed: ${assignment.parentName} for ${assignment.game}`);
    } catch (error) {
      console.error('Error marking confirmed:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsMarkingConfirmed(null);
    }
  };

  // Send reminder for assignment
  const handleSendReminder = async (assignment) => {
    setIsSending(true);

    try {
      await addDocument('notifications', {
        type: 'scoring',
        subject: `Reminder: Scoring Duty - ${assignment.game}`,
        message: `This is a reminder that you are scheduled to score for ${assignment.game} on ${new Date(assignment.date).toLocaleDateString('en-AU')} at ${assignment.time}.\n\nPlease confirm your availability if you haven't already.`,
        priority: 'normal',
        targetAudience: { type: 'individual', userIds: [assignment.parentId] },
        gameData: {
          gameId: assignment.gameId,
          teamId: assignment.teamId,
          date: assignment.date,
          time: assignment.time
        },
        sentAt: new Date().toISOString(),
        status: 'sent',
        isReminder: true
      });

      alert('Reminder sent successfully!');
    } catch (error) {
      console.error('Send reminder error:', error);
      alert('Failed to send reminder.');
    } finally {
      setIsSending(false);
    }
  };

  // Auto-assign scoring for a team
  const handleAutoAssign = async () => {
    if (!autoAssignTeam) return;
    setIsProcessingSwap(true);

    try {
      const team = availableTeams.find(t => t.id === autoAssignTeam);
      if (!team) return;

      // Get team's games that don't have assignments
      const teamUpcomingGames = availableGames.filter(g =>
        (g.teamId === team.id || g.team === team.name) &&
        !scoringAssignments.some(a => a.gameId === g.id)
      );

      // Get parents for this team
      const parentsForTeam = team.players?.map(p => ({
        id: p.id,
        name: p.parentName || `Parent of ${p.name}`,
        recentAssignments: scoringAssignments.filter(a => a.parentId === p.id).length
      })) || [];

      if (parentsForTeam.length === 0) {
        alert('No parents found for this team.');
        return;
      }

      // Assign games evenly among parents (round-robin)
      const newAssignments = [];
      teamUpcomingGames.forEach((game, index) => {
        const parentIndex = index % parentsForTeam.length;
        const parent = parentsForTeam[parentIndex];

        const assignment = {
          id: `auto-${Date.now()}-${index}`,
          gameId: game.id,
          game: `${team.name} vs ${game.opponent}`,
          teamId: team.id,
          teamName: team.name,
          date: game.date,
          time: game.time,
          venue: game.venue,
          parentId: parent.id,
          parentName: parent.name,
          status: 'pending',
          autoAssigned: true,
          assignedAt: new Date().toISOString()
        };

        newAssignments.push(assignment);
      });

      // Add to state
      setScoringAssignments(prev => [...prev, ...newAssignments]);

      // Send notifications to all assigned parents
      const uniqueParentIds = [...new Set(newAssignments.map(a => a.parentId))];
      for (const parentId of uniqueParentIds) {
        const parentAssignments = newAssignments.filter(a => a.parentId === parentId);
        await addDocument('notifications', {
          type: 'scoring',
          subject: `Scoring Duty Assignments - ${team.name}`,
          message: `You have been assigned scoring duty for the following games:\n\n${parentAssignments.map(a =>
            `• ${a.game} on ${new Date(a.date).toLocaleDateString('en-AU')} at ${a.time}`
          ).join('\n')}\n\nPlease confirm your availability.`,
          priority: 'normal',
          targetAudience: { type: 'individual', userIds: [parentId] },
          sentAt: new Date().toISOString(),
          status: 'sent'
        });
      }

      setShowAutoAssignModal(false);
      setAutoAssignTeam('');
      alert(`Auto-assigned ${newAssignments.length} games to ${uniqueParentIds.length} parents!`);

    } catch (error) {
      console.error('Auto-assign error:', error);
      alert('Failed to auto-assign. Please try again.');
    } finally {
      setIsProcessingSwap(false);
    }
  };

  // Get all parents for the team being edited (for reassignment)
  const allParentsForTeam = useMemo(() => {
    if (!editingAssignment) return [];
    const team = availableTeams.find(t =>
      t.id === editingAssignment.teamId || t.name === editingAssignment.teamName
    );

    // Use team.players if available, fallback to fresh query from players array
    let teamPlayers = team?.players || [];
    if (teamPlayers.length === 0 && team) {
      teamPlayers = players?.filter(p => {
        const matchById = p.teamId === team.id;
        const matchByName = p.team === team.name;
        const matchByDerivedId = p.team?.toLowerCase().replace(/\s+/g, '-') === team.id;
        return matchById || matchByName || matchByDerivedId;
      }) || [];
    }

    if (teamPlayers.length === 0) return [];

    return teamPlayers.map(p => ({
      id: p.id,
      name: p.parentName || p.parent1Name || `Parent of ${p.name}`,
      email: p.parentEmail || p.parent1Email,
      playerName: p.name
    })).filter(p => p.name && p.id !== editingAssignment.parentId);
  }, [editingAssignment, availableTeams, players]);

  // Filtered scoring assignments based on view and team filter
  const filteredScoringAssignments = useMemo(() => {
    let filtered = scoringAssignments;

    if (scoringRosterView !== 'all') {
      filtered = filtered.filter(a => a.status === scoringRosterView);
    }

    if (scoringRosterTeamFilter !== 'all') {
      filtered = filtered.filter(a => a.teamId === scoringRosterTeamFilter);
    }

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [scoringAssignments, scoringRosterView, scoringRosterTeamFilter]);

  // Pending swap requests count
  const pendingSwapCount = swapRequests.filter(s => s.status === 'pending').length;

  // Handle preview user selection
  const handlePreviewUserChange = (userId) => {
    setPreviewUser(userId);
    if (userId) {
      // Filter notifications for this user
      const userNotifs = notifications.filter(n => {
        if (n.targetAudience?.type === 'all') return true;
        if (n.targetAudience?.userIds?.includes(userId)) return true;
        return false;
      });
      setPreviewNotifications(userNotifs);
    } else {
      setPreviewNotifications([]);
    }
  };

  // Copy credentials
  const handleCopyCredentials = (user) => {
    const creds = `Email: ${user.email}\nPassword: Test123!`;
    navigator.clipboard.writeText(creds);
    setCopiedCredentials(user.id);
    setTimeout(() => setCopiedCredentials(''), 2000);
  };

  // Populate sample data with test users
  const handlePopulateSampleData = async () => {
    setIsPopulatingData(true);
    setDataPopulationMessage('Creating sample data...');

    try {
      const batch = writeBatch(db);

      // Note: getNextSaturday and formatDateForStorage are imported from dateUtils

      // Sample teams
      const sampleTeams = [
        { id: 'lakers-u8', name: 'Lakers U8', ageGroup: 'U8', coachName: 'Coach Mike', active: true, players: [] },
        { id: 'lakers-u10', name: 'Lakers U10', ageGroup: 'U10', coachName: 'Coach Sarah', active: true, players: [] },
        { id: 'lakers-u12', name: 'Lakers U12', ageGroup: 'U12', coachName: 'Coach Tom', active: true, players: [] },
        { id: 'lakers-u14', name: 'Lakers U14', ageGroup: 'U14', coachName: 'Coach Lisa', active: true, players: [] },
        { id: 'lakers-u16', name: 'Lakers U16', ageGroup: 'U16', coachName: 'Coach Dave', active: true, players: [] },
        { id: 'lakers-u19', name: 'Lakers U19', ageGroup: 'U19', coachName: 'Coach Kim', active: true, players: [] }
      ];

      setDataPopulationMessage('Creating teams...');
      for (const team of sampleTeams) {
        const teamRef = doc(db, 'teams', team.id);
        batch.set(teamRef, team);
      }

      // Sample players with parent info
      const samplePlayers = [
        { name: 'Ethan Smith', team: 'Lakers U8', teamId: 'lakers-u8', ageGroup: 'U8', parentName: 'John Smith', parentEmail: 'john.smith@testparent.com', parentPhone: '0412345678' },
        { name: 'Olivia Jones', team: 'Lakers U8', teamId: 'lakers-u8', ageGroup: 'U8', parentName: 'Sarah Jones', parentEmail: 'sarah.jones@testparent.com', parentPhone: '0423456789' },
        { name: 'Liam Brown', team: 'Lakers U8', teamId: 'lakers-u8', ageGroup: 'U8', parentName: 'Mike Brown', parentEmail: 'mike.brown@testparent.com', parentPhone: '0434567890' },
        { name: 'Emma Wilson', team: 'Lakers U10', teamId: 'lakers-u10', ageGroup: 'U10', parentName: 'Lisa Wilson', parentEmail: 'lisa.wilson@testparent.com', parentPhone: '0445678901' },
        { name: 'Noah Davis', team: 'Lakers U10', teamId: 'lakers-u10', ageGroup: 'U10', parentName: 'Tom Davis', parentEmail: 'tom.davis@testparent.com', parentPhone: '0456789012' },
        { name: 'Ava Miller', team: 'Lakers U10', teamId: 'lakers-u10', ageGroup: 'U10', parentName: 'Jane Miller', parentEmail: 'jane.miller@testparent.com', parentPhone: '0467890123' },
        { name: 'James Taylor', team: 'Lakers U10', teamId: 'lakers-u10', ageGroup: 'U10', parentName: 'Bob Taylor', parentEmail: 'bob.taylor@testparent.com', parentPhone: '0478901234' },
        { name: 'Sophie Anderson', team: 'Lakers U12', teamId: 'lakers-u12', ageGroup: 'U12', parentName: 'Kate Anderson', parentEmail: 'kate.anderson@testparent.com', parentPhone: '0489012345' },
        { name: 'Jack Thomas', team: 'Lakers U12', teamId: 'lakers-u12', ageGroup: 'U12', parentName: 'Steve Thomas', parentEmail: 'steve.thomas@testparent.com', parentPhone: '0490123456' },
        { name: 'Mia Jackson', team: 'Lakers U12', teamId: 'lakers-u12', ageGroup: 'U12', parentName: 'Amy Jackson', parentEmail: 'amy.jackson@testparent.com', parentPhone: '0401234567' },
        { name: 'Charlie White', team: 'Lakers U12', teamId: 'lakers-u12', ageGroup: 'U12', parentName: 'Dan White', parentEmail: 'dan.white@testparent.com', parentPhone: '0412345670' },
        { name: 'Emily Harris', team: 'Lakers U12', teamId: 'lakers-u12', ageGroup: 'U12', parentName: 'Sue Harris', parentEmail: 'sue.harris@testparent.com', parentPhone: '0423456780' },
        { name: 'William Martin', team: 'Lakers U14', teamId: 'lakers-u14', ageGroup: 'U14', parentName: 'Paul Martin', parentEmail: 'paul.martin@testparent.com', parentPhone: '0434567801' },
        { name: 'Grace Thompson', team: 'Lakers U14', teamId: 'lakers-u14', ageGroup: 'U14', parentName: 'Nancy Thompson', parentEmail: 'nancy.thompson@testparent.com', parentPhone: '0445678012' },
        { name: 'Henry Garcia', team: 'Lakers U14', teamId: 'lakers-u14', ageGroup: 'U14', parentName: 'Maria Garcia', parentEmail: 'maria.garcia@testparent.com', parentPhone: '0456780123' },
        { name: 'Ella Martinez', team: 'Lakers U14', teamId: 'lakers-u14', ageGroup: 'U14', parentName: 'Carlos Martinez', parentEmail: 'carlos.martinez@testparent.com', parentPhone: '0467801234' },
        { name: 'Lucas Robinson', team: 'Lakers U16', teamId: 'lakers-u16', ageGroup: 'U16', parentName: 'Chris Robinson', parentEmail: 'chris.robinson@testparent.com', parentPhone: '0478012345' },
        { name: 'Chloe Clark', team: 'Lakers U16', teamId: 'lakers-u16', ageGroup: 'U16', parentName: 'Linda Clark', parentEmail: 'linda.clark@testparent.com', parentPhone: '0489123456' },
        { name: 'Benjamin Lewis', team: 'Lakers U16', teamId: 'lakers-u16', ageGroup: 'U16', parentName: 'Frank Lewis', parentEmail: 'frank.lewis@testparent.com', parentPhone: '0490234567' },
        { name: 'Amelia Walker', team: 'Lakers U19', teamId: 'lakers-u19', ageGroup: 'U19', parentName: 'Helen Walker', parentEmail: 'helen.walker@testparent.com', parentPhone: '0401345678' },
        { name: 'Mason Hall', team: 'Lakers U19', teamId: 'lakers-u19', ageGroup: 'U19', parentName: 'Rick Hall', parentEmail: 'rick.hall@testparent.com', parentPhone: '0412456789' }
      ];

      setDataPopulationMessage('Creating players...');
      for (const player of samplePlayers) {
        const playerRef = doc(collection(db, 'players'));
        batch.set(playerRef, {
          ...player,
          createdAt: new Date().toISOString(),
          active: true,
          isSampleData: true
        });
      }

      // Create test parent users with varied preferences
      const testParentUsers = [
        {
          email: 'john.smith@testparent.com',
          name: 'John Smith',
          role: 'parent',
          phone: '0412345678',
          isTestUser: true,
          preferences: { notifications: { inApp: true, email: true, sms: true, types: { scoring: true, gameDay: true, uniform: true, announcements: true, training: true, events: true } } }
        },
        {
          email: 'sarah.jones@testparent.com',
          name: 'Sarah Jones',
          role: 'parent',
          phone: '0423456789',
          isTestUser: true,
          preferences: { notifications: { inApp: true, email: true, sms: false, types: { scoring: true, gameDay: true, uniform: true, announcements: true, training: true, events: true } } }
        },
        {
          email: 'kate.anderson@testparent.com',
          name: 'Kate Anderson',
          role: 'parent',
          phone: '0489012345',
          isTestUser: true,
          preferences: { notifications: { inApp: true, email: false, sms: false, types: { scoring: true, gameDay: true, uniform: false, announcements: false, training: true, events: false } } }
        },
        {
          email: 'paul.martin@testparent.com',
          name: 'Paul Martin',
          role: 'parent',
          phone: '0434567801',
          isTestUser: true,
          preferences: { notifications: { inApp: true, email: true, sms: true, types: { scoring: true, gameDay: true, uniform: true, announcements: true, training: true, events: true } } }
        },
        {
          email: 'chris.robinson@testparent.com',
          name: 'Chris Robinson',
          role: 'parent',
          phone: '0478012345',
          isTestUser: true,
          preferences: { notifications: { inApp: true, email: true, sms: false, types: { scoring: true, gameDay: true, uniform: true, announcements: false, training: true, events: false } } }
        }
      ];

      setDataPopulationMessage('Creating test parent users...');
      for (const user of testParentUsers) {
        const userRef = doc(collection(db, 'users'));
        batch.set(userRef, {
          ...user,
          createdAt: new Date().toISOString()
        });
      }

      // Sample games with dynamic future dates
      const sampleGames = [
        { teamId: 'lakers-u8', teamName: 'Lakers U8', opponent: 'Tigers U8', date: formatDateForStorage(getNextSaturday(0)), time: '9:00 AM', venue: 'Emerald Courts', type: 'game' },
        { teamId: 'lakers-u10', teamName: 'Lakers U10', opponent: 'Eagles U10', date: formatDateForStorage(getNextSaturday(0)), time: '11:00 AM', venue: 'Emerald Courts', type: 'game' },
        { teamId: 'lakers-u12', teamName: 'Lakers U12', opponent: 'Hawks U12', date: formatDateForStorage(getNextSaturday(1)), time: '10:00 AM', venue: 'Sports Centre', type: 'game' },
        { teamId: 'lakers-u14', teamName: 'Lakers U14', opponent: 'Stars U14', date: formatDateForStorage(getNextSaturday(1)), time: '2:00 PM', venue: 'Emerald Courts', type: 'game' },
        { teamId: 'lakers-u16', teamName: 'Lakers U16', opponent: 'Warriors U16', date: formatDateForStorage(getNextSaturday(2)), time: '9:00 AM', venue: 'Sports Centre', type: 'game' },
        { teamId: 'lakers-u19', teamName: 'Lakers U19', opponent: 'Blazers U19', date: formatDateForStorage(getNextSaturday(2)), time: '3:00 PM', venue: 'Emerald Courts', type: 'game' },
        { teamId: 'lakers-u8', teamName: 'Lakers U8', opponent: 'Panthers U8', date: formatDateForStorage(getNextSaturday(3)), time: '9:00 AM', venue: 'Sports Centre', type: 'game' },
        { teamId: 'lakers-u12', teamName: 'Lakers U12', opponent: 'Rockets U12', date: formatDateForStorage(getNextSaturday(3)), time: '1:00 PM', venue: 'Emerald Courts', type: 'game' }
      ];

      const gameIds = [];
      setDataPopulationMessage('Creating games...');
      for (const game of sampleGames) {
        const gameRef = doc(collection(db, 'games'));
        gameIds.push({ id: gameRef.id, ...game });
        batch.set(gameRef, {
          ...game,
          createdAt: new Date().toISOString(),
          isSampleData: true
        });
      }

      // Create scoring assignments for some games
      setDataPopulationMessage('Creating scoring assignments...');
      const scoringAssignments = [
        {
          gameId: gameIds[0]?.id, // Lakers U8 game
          teamId: 'lakers-u8',
          gameDate: gameIds[0]?.date,
          gameTime: gameIds[0]?.time,
          opponent: gameIds[0]?.opponent,
          venue: gameIds[0]?.venue,
          assignedParentId: null,
          assignedParentName: null,
          assignedParentEmail: null,
          playerId: null,
          playerName: null,
          status: 'unassigned',
          notificationSent: false,
          confirmedAt: null,
          createdAt: new Date().toISOString(),
          isSampleData: true
        },
        {
          gameId: gameIds[1]?.id, // Lakers U10 game
          teamId: 'lakers-u10',
          gameDate: gameIds[1]?.date,
          gameTime: gameIds[1]?.time,
          opponent: gameIds[1]?.opponent,
          venue: gameIds[1]?.venue,
          assignedParentId: null,
          assignedParentName: 'Lisa Wilson',
          assignedParentEmail: 'lisa.wilson@testparent.com',
          playerId: null,
          playerName: 'Emma Wilson',
          status: 'pending',
          notificationSent: true,
          notificationSentAt: new Date().toISOString(),
          confirmedAt: null,
          createdAt: new Date().toISOString(),
          isSampleData: true
        },
        {
          gameId: gameIds[2]?.id, // Lakers U12 game
          teamId: 'lakers-u12',
          gameDate: gameIds[2]?.date,
          gameTime: gameIds[2]?.time,
          opponent: gameIds[2]?.opponent,
          venue: gameIds[2]?.venue,
          assignedParentId: null,
          assignedParentName: 'Kate Anderson',
          assignedParentEmail: 'kate.anderson@testparent.com',
          playerId: null,
          playerName: 'Sophie Anderson',
          status: 'confirmed',
          notificationSent: true,
          notificationSentAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isSampleData: true
        }
      ];

      for (const assignment of scoringAssignments) {
        if (assignment.gameId) {
          const assignmentRef = doc(collection(db, 'scoring_assignments'));
          batch.set(assignmentRef, assignment);
        }
      }

      await batch.commit();

      setDataPopulationMessage('Sample data created successfully!');
      setTimeout(() => {
        setDataPopulationMessage('');
        fetchAllUsers();
      }, 2000);

    } catch (error) {
      console.error('Error populating sample data:', error);
      setDataPopulationMessage(`Error: ${error.message}`);
    } finally {
      setIsPopulatingData(false);
    }
  };

  // Clear sample data
  const handleClearSampleData = async () => {
    if (!confirm('Are you sure you want to clear all sample data? This cannot be undone.')) {
      return;
    }

    setIsPopulatingData(true);
    setDataPopulationMessage('Clearing sample data...');

    try {
      // Clear teams
      setDataPopulationMessage('Clearing teams...');
      const teamsSnapshot = await getDocs(collection(db, 'teams'));
      for (const docSnap of teamsSnapshot.docs) {
        if (docSnap.id.startsWith('lakers-')) {
          await docSnap.ref.delete();
        }
      }

      // Clear players with isSampleData flag or matching teamIds
      setDataPopulationMessage('Clearing players...');
      const playersSnapshot = await getDocs(collection(db, 'players'));
      for (const docSnap of playersSnapshot.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-') || data.team?.startsWith('Lakers')) {
          await docSnap.ref.delete();
        }
      }

      // Clear games with isSampleData flag or matching teamIds
      setDataPopulationMessage('Clearing games...');
      const gamesSnapshot = await getDocs(collection(db, 'games'));
      for (const docSnap of gamesSnapshot.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-') || data.teamName?.startsWith('Lakers')) {
          await docSnap.ref.delete();
        }
      }

      // Clear test users
      setDataPopulationMessage('Clearing test users...');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      for (const docSnap of usersSnapshot.docs) {
        const data = docSnap.data();
        if (data.isTestUser || data.email?.includes('@testparent.com')) {
          await docSnap.ref.delete();
        }
      }

      // Clear scoring assignments with isSampleData flag
      setDataPopulationMessage('Clearing scoring assignments...');
      const assignmentsSnapshot = await getDocs(collection(db, 'scoring_assignments'));
      for (const docSnap of assignmentsSnapshot.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-')) {
          await docSnap.ref.delete();
        }
      }

      // Clear swap requests related to sample data
      setDataPopulationMessage('Clearing swap requests...');
      const swapSnapshot = await getDocs(collection(db, 'swap_requests'));
      for (const docSnap of swapSnapshot.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-')) {
          await docSnap.ref.delete();
        }
      }

      setDataPopulationMessage('Sample data cleared successfully!');
      setTimeout(() => {
        setDataPopulationMessage('');
        fetchAllUsers();
      }, 2000);

    } catch (error) {
      console.error('Error clearing sample data:', error);
      setDataPopulationMessage(`Error: ${error.message}`);
    } finally {
      setIsPopulatingData(false);
    }
  };

  // Filter history
  const filteredHistory = useMemo(() => {
    return notifications.filter(n => {
      if (historyFilter.type !== 'all' && n.type !== historyFilter.type) return false;
      if (historyFilter.status !== 'all' && n.status !== historyFilter.status) return false;
      if (historySearch && !n.subject.toLowerCase().includes(historySearch.toLowerCase())) return false;
      return true;
    });
  }, [notifications, historyFilter, historySearch]);

  const tabs = [
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'scoring', label: 'Scoring', icon: Calendar },
    { id: 'history', label: 'History', icon: FileText },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'settings', label: 'Data Tools', icon: Database }
  ];

  // Custom dropdown styles to fix visibility
  const dropdownStyles = "bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent";
  const dropdownOptionStyles = "bg-white text-gray-900";

  return (
    <PageShell
      title="Notifications Management"
      subtitle="Send announcements and alerts"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Notifications' }
      ]}
    >
      {/* Tab Navigation */}
      <div className="py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#005028] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {/* Create Notification Tab */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {/* Notification Type */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-bold mb-3">Notification Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(NOTIFICATION_TYPE_CONFIG).map(([type, config]) => {
                  const Icon = getTypeIcon(type);
                  const isSelected = notificationType === type;

                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-[#005028] text-white'
                          : 'bg-gray-100 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-xs text-center leading-tight">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {notificationType && notificationType !== 'scoring' && (
              <>
                {/* Target Audience */}
                <div className="bg-white rounded-xl p-4">
                  <h3 className="font-bold mb-3">Target Audience</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { type: AUDIENCE_TYPES.ALL, label: 'All Club', icon: Users },
                      { type: AUDIENCE_TYPES.AGE_GROUP, label: 'Age Groups', icon: Users },
                      { type: AUDIENCE_TYPES.TEAM, label: 'Teams', icon: Users },
                      { type: AUDIENCE_TYPES.INDIVIDUAL, label: 'Individual', icon: User }
                    ].map(opt => (
                      <button
                        key={opt.type}
                        onClick={() => {
                          setAudienceType(opt.type);
                          setSelectedUsers([]);
                          setSelectSpecificPlayers(false);
                          setSelectedAgeGroupPlayers([]);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          audienceType === opt.type
                            ? 'bg-[#005028] text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <opt.icon size={16} />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Individual Selection with Search */}
                  {audienceType === AUDIENCE_TYPES.INDIVIDUAL && (
                    <div className="space-y-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                          type="text"
                          value={individualSearch}
                          onChange={(e) => {
                            setIndividualSearch(e.target.value);
                            setShowIndividualDropdown(true);
                          }}
                          onFocus={() => setShowIndividualDropdown(true)}
                          placeholder="Search for player or parent..."
                          className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
                        />

                        {/* Dropdown Results */}
                        {showIndividualDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                            {filteredIndividuals.length > 0 ? (
                              filteredIndividuals.map(individual => (
                                <button
                                  key={individual.id}
                                  onClick={() => handleSelectIndividual(individual)}
                                  disabled={selectedUsers.includes(individual.id)}
                                  className={`w-full px-4 py-3 text-left hover:bg-[#00A651]/10 border-b border-gray-100 last:border-b-0 ${
                                    selectedUsers.includes(individual.id) ? 'bg-gray-100 opacity-50' : ''
                                  }`}
                                >
                                  <p className="font-medium text-gray-900">{individual.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {individual.email}
                                    {individual.playerName && ` • Parent of ${individual.playerName}`}
                                  </p>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-center">
                                No matching users found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Individuals as Chips */}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map(userId => {
                            const individual = searchableIndividuals.find(i => i.id === userId);
                            return (
                              <span
                                key={userId}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#005028]/20 text-[#00A651] rounded-full text-sm"
                              >
                                {individual?.name || 'Unknown'}
                                <button
                                  onClick={() => handleRemoveIndividual(userId)}
                                  className="hover:text-gray-800"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Click outside handler */}
                      {showIndividualDropdown && (
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowIndividualDropdown(false)}
                        />
                      )}
                    </div>
                  )}

                  {/* Age Group Selection */}
                  {audienceType === AUDIENCE_TYPES.AGE_GROUP && (
                    <div className="space-y-3">
                      <button
                        onClick={handleSelectAllAgeGroups}
                        className={`w-full px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          selectedAgeGroups.length === ageGroups.length
                            ? 'bg-[#005028] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {selectedAgeGroups.length === ageGroups.length ? <CheckSquare size={16} /> : <Square size={16} />}
                        Select All Age Groups
                        <span className="ml-auto text-xs opacity-70">
                          {selectedAgeGroups.length}/{ageGroups.length}
                        </span>
                      </button>
                      <div className="flex flex-wrap gap-2">
                        {ageGroups.map(ag => (
                          <button
                            key={ag}
                            onClick={() => handleAgeGroupToggle(ag)}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                              selectedAgeGroups.includes(ag)
                                ? 'bg-[#005028] text-white'
                                : 'bg-gray-100 hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            {selectedAgeGroups.includes(ag) ? <CheckSquare size={14} /> : <Square size={14} />}
                            {ag}
                          </button>
                        ))}
                      </div>

                      {/* Specific Players Toggle */}
                      {selectedAgeGroups.length > 0 && ageGroupPlayers.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <button
                            onClick={() => {
                              setSelectSpecificPlayers(!selectSpecificPlayers);
                              setSelectedAgeGroupPlayers([]);
                            }}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                          >
                            {selectSpecificPlayers ? (
                              <ToggleRight size={20} className="text-[#00A651]" />
                            ) : (
                              <ToggleLeft size={20} />
                            )}
                            Select specific players
                          </button>

                          {selectSpecificPlayers && (
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">
                                  {ageGroupPlayers.length} players in selected age groups
                                </span>
                                <button
                                  onClick={handleSelectAllAgeGroupPlayers}
                                  className="text-xs text-[#00A651] hover:underline"
                                >
                                  {selectedAgeGroupPlayers.length === ageGroupPlayers.length ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {ageGroupPlayers.map(player => (
                                  <button
                                    key={player.id}
                                    onClick={() => handleAgeGroupPlayerToggle(player.id)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center gap-2 ${
                                      selectedAgeGroupPlayers.includes(player.id)
                                        ? 'bg-[#005028] text-white'
                                        : 'bg-gray-100 hover:bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {selectedAgeGroupPlayers.includes(player.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                                    <span className="truncate">{player.name}</span>
                                    <span className="text-xs opacity-60 ml-auto">{player.team}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedAgeGroups.length > 0 && ageGroupPlayers.length === 0 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-400 flex items-center gap-2">
                            <AlertCircle size={16} />
                            No players found in selected age groups
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Team Selection */}
                  {audienceType === AUDIENCE_TYPES.TEAM && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Filter by age:</span>
                        <select
                          value={ageGroupFilter}
                          onChange={(e) => setAgeGroupFilter(e.target.value)}
                          className="bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                        >
                          <option value="all">All Age Groups</option>
                          {ageGroups.map(ag => (
                            <option key={ag} value={ag}>{ag}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleSelectAllTeams}
                        className={`w-full px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          selectedTeams.length === filteredTeams.length && filteredTeams.length > 0
                            ? 'bg-[#005028] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {selectedTeams.length === filteredTeams.length && filteredTeams.length > 0
                          ? <CheckSquare size={16} />
                          : <Square size={16} />
                        }
                        Select All Teams {ageGroupFilter !== 'all' && `(${ageGroupFilter})`}
                        <span className="ml-auto text-xs opacity-70">
                          {selectedTeams.length}/{filteredTeams.length} selected
                        </span>
                      </button>

                      {filteredTeams.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                          {filteredTeams.map(team => (
                            <button
                              key={team.id}
                              onClick={() => handleTeamToggle(team.id)}
                              className={`px-3 py-2 rounded-lg text-sm transition-colors text-left flex items-center gap-2 ${
                                selectedTeams.includes(team.id)
                                  ? 'bg-[#005028] text-white'
                                  : 'bg-gray-100 hover:bg-gray-100 text-gray-600'
                              }`}
                            >
                              {selectedTeams.includes(team.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                              <div className="min-w-0">
                                <span className="truncate block">{team.name}</span>
                                <span className="text-xs opacity-60">{team.playerCount} players</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-sm text-yellow-400 flex items-center gap-2">
                            <AlertCircle size={16} />
                            No teams found. Use "Data Tools" tab to create sample teams.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recipient Count Preview */}
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Users size={16} />
                      <span className="font-medium">
                        {isLoadingUsers ? 'Loading...' : `This will notify ${recipientInfo.total} ${recipientInfo.total === 1 ? 'person' : 'people'}`}
                      </span>
                    </div>
                    {recipientInfo.total > 0 && (
                      <>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Bell size={12} /> {recipientInfo.inApp} in-app
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail size={12} /> {recipientInfo.withEmail} email
                          </span>
                          <span className="flex items-center gap-1">
                            <Smartphone size={12} /> {recipientInfo.withPhone} SMS
                          </span>
                        </div>
                        {recipientInfo.recipients.length > 0 && (
                          <div className="text-xs text-gray-400 border-t border-white/10 pt-2 mt-2">
                            <span>Recipients: </span>
                            {recipientInfo.recipients.map((r, i) => (
                              <span key={i}>
                                {r.name || r.parentName || r.playerName || r.email}
                                {i < recipientInfo.recipients.length - 1 && ', '}
                              </span>
                            ))}
                            {recipientInfo.hasMore && ` and ${recipientInfo.total - 5} more`}
                          </div>
                        )}
                      </>
                    )}
                    {recipientInfo.total === 0 && !isLoadingUsers && (
                      <div className="text-xs text-yellow-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        No recipients selected. Please select teams, age groups, or individuals.
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Composer */}
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Message</h3>
                    {notificationType && NOTIFICATION_TEMPLATES[notificationType] && hasEditedCurrent && (
                      <button
                        onClick={handleResetTemplate}
                        className="text-xs text-[#00A651] hover:text-gray-800 flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        Reset to Template
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Enter subject line..."
                        className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        placeholder="Enter your message..."
                        rows={6}
                        className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651] resize-none"
                      />
                      {notificationType && NOTIFICATION_TEMPLATES[notificationType] && (
                        <p className="text-xs text-gray-400 mt-1">
                          Template variables: {'{parentName}'}, {'{teamName}'}, {'{gameDate}'}, etc.
                        </p>
                      )}
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Priority</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPriority(PRIORITY_LEVELS.NORMAL)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                            priority === PRIORITY_LEVELS.NORMAL
                              ? 'bg-[#005028] text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => setPriority(PRIORITY_LEVELS.URGENT)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                            priority === PRIORITY_LEVELS.URGENT
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Urgent
                        </button>
                      </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Attachments / Links</label>
                      {attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                              <Link2 size={14} className="text-[#00A651]" />
                              <span className="flex-1 text-sm truncate">{att.name}</span>
                              <button
                                onClick={() => handleRemoveAttachment(i)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAttachmentName}
                          onChange={(e) => setNewAttachmentName(e.target.value)}
                          placeholder="Link name"
                          className="w-1/3 bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651]"
                        />
                        <input
                          type="url"
                          value={newAttachmentUrl}
                          onChange={(e) => setNewAttachmentUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651]"
                        />
                        <button
                          onClick={handleAddAttachment}
                          disabled={!newAttachmentUrl || !newAttachmentName}
                          className="px-3 py-2 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">When to Send</label>
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setSendImmediately(true)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                            sendImmediately
                              ? 'bg-[#005028] text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Send Immediately
                        </button>
                        <button
                          onClick={() => setSendImmediately(false)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                            !sendImmediately
                              ? 'bg-[#005028] text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Schedule
                        </button>
                      </div>
                      {!sendImmediately && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
                          />
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!canSend || isSending}
                  className="w-full py-4 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Notification
                    </>
                  )}
                </button>
                {!canSend && recipientInfo.total === 0 && (
                  <p className="text-center text-sm text-red-400 mt-2">
                    Cannot send: No recipients selected
                  </p>
                )}
              </>
            )}

            {/* 5-Step Scoring Wizard */}
            {notificationType === 'scoring' && (
              <div className="bg-white rounded-xl p-4">
                <h3 className="font-bold mb-4">Scoring Roster Reminder</h3>

                {/* Progress Steps */}
                <div className="flex items-center gap-1 mb-6">
                  {[
                    { num: 1, label: 'Team' },
                    { num: 2, label: 'Game' },
                    { num: 3, label: 'Parent' },
                    { num: 4, label: 'Message' },
                    { num: 5, label: 'Send' }
                  ].map((step, idx) => (
                    <React.Fragment key={step.num}>
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          scoringStep >= step.num ? 'bg-[#005028] text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {scoringStep > step.num ? <Check size={16} /> : step.num}
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{step.label}</span>
                      </div>
                      {idx < 4 && (
                        <div className={`flex-1 h-1 rounded mt-[-16px] ${
                          scoringStep > step.num ? 'bg-[#005028]' : 'bg-gray-100'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1: Select Team - FIXED DROPDOWN */}
                {scoringStep === 1 && (
                  <div>
                    <h4 className="text-sm text-gray-600 mb-3">Step 1: Select Team</h4>

                    {availableTeams.length > 0 ? (
                      <>
                        <select
                          value={selectedScoringTeam}
                          onChange={(e) => setSelectedScoringTeam(e.target.value)}
                          className={dropdownStyles}
                          style={{ color: '#111827', backgroundColor: '#f9fafb' }}
                        >
                          <option value="" style={{ color: '#6b7280' }}>-- Select a team --</option>
                          {availableTeams.map(team => (
                            <option key={team.id} value={team.id} style={{ color: '#111827' }}>
                              {team.name} ({team.playerCount} players)
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            if (selectedScoringTeam) {
                              setScoringStep(2);
                            }
                          }}
                          disabled={!selectedScoringTeam}
                          className="w-full mt-4 py-3 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold transition-colors"
                        >
                          Next: Select Game
                        </button>
                      </>
                    ) : (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 flex items-center gap-2 mb-2">
                          <AlertCircle size={18} />
                          No teams found in database
                        </p>
                        <p className="text-sm text-gray-500">
                          Go to "Data Tools" tab to create sample teams for testing.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Select Game */}
                {scoringStep === 2 && (
                  <div>
                    <h4 className="text-sm text-gray-600 mb-3">Step 2: Select Game</h4>
                    <button
                      onClick={() => {
                        setScoringStep(1);
                        setSelectedScoringTeam('');
                      }}
                      className="text-sm text-[#00A651] mb-3 flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Back to team selection
                    </button>

                    <div className="bg-gray-100 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600">Selected Team:</p>
                      <p className="font-medium">
                        {availableTeams.find(t => t.id === selectedScoringTeam)?.name || selectedScoringTeam}
                      </p>
                    </div>

                    {teamGames.length > 0 ? (
                      <div className="space-y-2">
                        {teamGames.map(game => (
                          <button
                            key={game.id}
                            onClick={() => {
                              setSelectedGame(game);
                              setScoringStep(3);
                            }}
                            className="w-full p-3 bg-gray-100 hover:bg-gray-100 rounded-lg text-left transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">vs {game.opponent}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(game.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at {formatTimeStringAU(game.time)}
                                </p>
                                <p className="text-xs text-gray-400">{game.venue}</p>
                              </div>
                              <ChevronRight size={18} className="text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="text-center mb-4">
                          <Calendar className="mx-auto mb-2 text-gray-800/30" size={32} />
                          <p className="text-gray-600 font-medium">No upcoming games found</p>
                          <p className="text-gray-400 text-sm mt-1">
                            for {availableTeams.find(t => t.id === selectedScoringTeam)?.name || selectedScoringTeam}
                          </p>
                        </div>

                        {/* Mismatch Warning */}
                        {teamGamesDebug.mismatchHint && (
                          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                              <AlertTriangle size={16} />
                              Data Mismatch Detected
                            </p>
                            <p className="text-red-300 text-xs mt-1">{teamGamesDebug.mismatchHint}</p>
                          </div>
                        )}

                        {/* Debug info toggle */}
                        <button
                          onClick={() => setShowDebugInfo(!showDebugInfo)}
                          className="w-full text-xs text-gray-400 hover:text-gray-500 py-1 flex items-center justify-center gap-1"
                        >
                          <Info size={12} />
                          {showDebugInfo ? '▼ Hide debug info' : '▶ Show debug info (for troubleshooting)'}
                        </button>

                        {showDebugInfo && (
                          <div className="mt-2 p-3 bg-black/30 rounded-lg text-xs space-y-2 border border-white/10">
                            <p className="text-gray-600 font-medium border-b border-white/10 pb-1">Query Debug Info</p>

                            <div className="space-y-1 text-gray-400 font-mono">
                              <p><span className="text-blue-400">Searching for:</span></p>
                              <p className="pl-2">teamId = "{selectedScoringTeam}"</p>
                              <p className="pl-2">teamName = "{availableTeams.find(t => t.id === selectedScoringTeam)?.name}"</p>

                              <p className="mt-2"><span className="text-blue-400">Games in database:</span> {rawGamesDebug.total} total</p>

                              {rawGamesDebug.usingSampleData && (
                                <p className="text-yellow-400">⚠ Using sample data (no games in Firestore)</p>
                              )}

                              <p className="mt-2"><span className="text-blue-400">TeamIds found in games:</span></p>
                              <p className="pl-2 break-all">{teamGamesDebug.uniqueTeamIds?.join(', ') || 'none'}</p>

                              <p className="mt-2"><span className="text-blue-400">Team names in games:</span></p>
                              <p className="pl-2 break-all">{teamGamesDebug.uniqueTeamNames?.join(', ') || 'none'}</p>

                              {rawGamesDebug.fieldNames?.length > 0 && (
                                <>
                                  <p className="mt-2"><span className="text-blue-400">Fields in game documents:</span></p>
                                  <p className="pl-2 break-all">{rawGamesDebug.fieldNames.join(', ')}</p>
                                </>
                              )}
                            </div>

                            <p className="text-gray-400 mt-3 text-center">See browser console for detailed logs</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-2 mt-4">
                          <button
                            onClick={() => navigate('/admin/schedule')}
                            className="w-full py-2 bg-[#005028]/20 text-[#00A651] rounded-lg text-sm font-medium hover:bg-[#00A651]/30 flex items-center justify-center gap-2"
                          >
                            <Plus size={14} />
                            Add Games via Schedule Management
                          </button>

                          <button
                            onClick={() => setShowManualGameEntry(!showManualGameEntry)}
                            className="w-full py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                          >
                            <Edit size={14} />
                            {showManualGameEntry ? 'Cancel Manual Entry' : 'Enter Game Manually'}
                          </button>

                          {/* View all games for debugging */}
                          {availableGames.length > 0 && (
                            <button
                              onClick={() => {
                                console.log('=== ALL AVAILABLE GAMES ===');
                                availableGames.forEach((g, i) => {
                                  console.log(`Game ${i + 1}:`, g);
                                });
                                alert(`Logged ${availableGames.length} games to console. Check browser dev tools.`);
                              }}
                              className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-100"
                            >
                              Log all games to console ({availableGames.length} games)
                            </button>
                          )}
                        </div>

                        {/* Manual Game Entry Form */}
                        {showManualGameEntry && (
                          <div className="mt-4 p-3 bg-gray-100 rounded-lg space-y-3">
                            <h5 className="font-medium text-sm">Manual Game Entry</h5>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Date</label>
                              <input
                                type="date"
                                value={manualGameDate}
                                onChange={(e) => setManualGameDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Time</label>
                              <input
                                type="time"
                                value={manualGameTime}
                                onChange={(e) => setManualGameTime(e.target.value)}
                                className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Opponent</label>
                              <input
                                type="text"
                                value={manualGameOpponent}
                                onChange={(e) => setManualGameOpponent(e.target.value)}
                                placeholder="e.g., Hills Hawks"
                                className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 text-sm placeholder-white/40"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Venue</label>
                              <input
                                type="text"
                                value={manualGameVenue}
                                onChange={(e) => setManualGameVenue(e.target.value)}
                                placeholder="e.g., Emerald Indoor Courts"
                                className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 text-sm placeholder-white/40"
                              />
                            </div>

                            <button
                              onClick={() => {
                                if (!manualGameDate || !manualGameOpponent) {
                                  alert('Please enter at least a date and opponent.');
                                  return;
                                }
                                const team = availableTeams.find(t => t.id === selectedScoringTeam);
                                const manualGame = {
                                  id: `manual-${Date.now()}`,
                                  date: manualGameDate,
                                  time: manualGameTime,
                                  teamId: selectedScoringTeam,
                                  team: team?.name || selectedScoringTeam,
                                  opponent: manualGameOpponent,
                                  venue: manualGameVenue || 'TBD'
                                };
                                setSelectedGame(manualGame);
                                setScoringStep(3);
                                setShowManualGameEntry(false);
                              }}
                              disabled={!manualGameDate || !manualGameOpponent}
                              className="w-full py-2 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-lg text-sm font-medium"
                            >
                              Use This Game
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Select Parent */}
                {scoringStep === 3 && (
                  <div>
                    <h4 className="text-sm text-gray-600 mb-3">Step 3: Select Parent to Score</h4>
                    <button
                      onClick={() => setScoringStep(2)}
                      className="text-sm text-[#00A651] mb-3 flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Back to games
                    </button>

                    <div className="bg-gray-100 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600">Selected Game:</p>
                      <p className="font-medium">{selectedGame?.team} vs {selectedGame?.opponent}</p>
                      <p className="text-sm text-gray-500">
                        {selectedGame && new Date(selectedGame.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} at {formatTimeStringAU(selectedGame?.time)}
                      </p>
                    </div>

                    {teamParents.length > 0 ? (
                      <div className="space-y-2">
                        {teamParents.map(parent => (
                          <button
                            key={parent.id}
                            onClick={() => {
                              setSelectedParent(parent.id);
                              const template = NOTIFICATION_TEMPLATES.scoring;
                              setScoringSubject(parseTemplate(template.subject, {
                                teamName: selectedGame.team,
                                opponent: selectedGame.opponent
                              }));
                              setScoringMessage(parseTemplate(template.message, {
                                teamName: selectedGame.team,
                                opponent: selectedGame.opponent,
                                parentName: parent.name,
                                gameDate: new Date(selectedGame.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }),
                                gameTime: selectedGame.time,
                                venue: selectedGame.venue
                              }));
                              setScoringStep(4);
                            }}
                            className="w-full p-3 bg-gray-100 hover:bg-gray-100 rounded-lg text-left transition-colors"
                          >
                            <p className="font-medium">{parent.name}</p>
                            <p className="text-sm text-gray-500">Parent of {parent.playerName}</p>
                            {parent.email && <p className="text-xs text-gray-400">{parent.email}</p>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 flex items-center gap-2">
                          <AlertCircle size={18} />
                          No parents found for this team
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Players need parent information (parentName, parentEmail) in their records.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Customize Message */}
                {scoringStep === 4 && (
                  <div>
                    <h4 className="text-sm text-gray-600 mb-3">Step 4: Customize Message</h4>
                    <button
                      onClick={() => setScoringStep(3)}
                      className="text-sm text-[#00A651] mb-3 flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Back to parent selection
                    </button>

                    <div className="bg-gray-100 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600">Sending to:</p>
                      <p className="font-medium">{teamParents.find(p => p.id === selectedParent)?.name}</p>
                      <p className="text-xs text-gray-400">{teamParents.find(p => p.id === selectedParent)?.email}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Subject</label>
                        <input
                          type="text"
                          value={scoringSubject}
                          onChange={(e) => setScoringSubject(e.target.value)}
                          className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#00A651]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Message</label>
                        <textarea
                          value={scoringMessage}
                          onChange={(e) => setScoringMessage(e.target.value)}
                          rows={8}
                          className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-[#00A651] resize-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setScoringStep(5)}
                      disabled={!scoringMessage.trim()}
                      className="w-full mt-4 py-3 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-xl font-bold transition-colors"
                    >
                      Preview & Send
                    </button>
                  </div>
                )}

                {/* Step 5: Confirm & Send */}
                {scoringStep === 5 && (
                  <div>
                    <h4 className="text-sm text-gray-600 mb-3">Step 5: Review & Send</h4>
                    <button
                      onClick={() => setScoringStep(4)}
                      className="text-sm text-[#00A651] mb-3 flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Back to edit message
                    </button>

                    <div className="space-y-3">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-[#005028]/20 rounded-full flex items-center justify-center">
                            <Calendar className="text-[#00A651]" size={20} />
                          </div>
                          <div>
                            <p className="font-medium">{selectedGame?.team} vs {selectedGame?.opponent}</p>
                            <p className="text-sm text-gray-500">
                              {selectedGame && new Date(selectedGame.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at {formatTimeStringAU(selectedGame?.time)}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-white/10 pt-3 mt-3">
                          <p className="text-sm text-gray-600 mb-1">Recipient:</p>
                          <p className="font-medium">{teamParents.find(p => p.id === selectedParent)?.name}</p>
                        </div>

                        <div className="border-t border-white/10 pt-3 mt-3">
                          <p className="text-sm text-gray-600 mb-1">Subject:</p>
                          <p className="text-sm">{scoringSubject}</p>
                        </div>

                        <div className="border-t border-white/10 pt-3 mt-3">
                          <p className="text-sm text-gray-600 mb-1">Message Preview:</p>
                          <p className="text-sm whitespace-pre-wrap bg-gray-100 rounded p-2 max-h-40 overflow-y-auto">{scoringMessage}</p>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-sm text-blue-300">
                          <Bell size={14} className="inline mr-1" />
                          Will be sent via: In-App, Email
                        </p>
                      </div>

                      <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isSending}
                        className="w-full py-4 bg-[#005028] hover:bg-gray-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            Send Scoring Reminder
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scoring Roster Tab */}
        {activeTab === 'scoring' && (
          <div className="space-y-4">
            {/* Header with actions */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Calendar size={18} className="text-[#00A651]" />
                  Scoring Roster Management
                </h3>
                <div className="flex gap-2">
                  {pendingSwapCount > 0 && (
                    <button
                      onClick={() => setShowSwapRequestsModal(true)}
                      className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <ArrowRightLeft size={14} />
                      {pendingSwapCount} Swap Request{pendingSwapCount > 1 ? 's' : ''}
                    </button>
                  )}
                  <button
                    onClick={() => setShowAutoAssignModal(true)}
                    className="px-3 py-1.5 bg-[#005028]/20 text-[#00A651] rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    <RefreshCw size={14} />
                    Auto-Assign
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <select
                  value={scoringRosterView}
                  onChange={(e) => setScoringRosterView(e.target.value)}
                  className={dropdownStyles}
                  style={{ color: '#111827', backgroundColor: '#f9fafb' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="swap_requested">Swap Requested</option>
                </select>
                <select
                  value={scoringRosterTeamFilter}
                  onChange={(e) => setScoringRosterTeamFilter(e.target.value)}
                  className={dropdownStyles}
                  style={{ color: '#111827', backgroundColor: '#f9fafb' }}
                >
                  <option value="all">All Teams</option>
                  {availableTeams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-100 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-gray-800">{scoringAssignments.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-[#005028]/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-[#00A651]">
                    {scoringAssignments.filter(a => a.status === 'confirmed').length}
                  </p>
                  <p className="text-xs text-gray-500">Confirmed</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-yellow-400">
                    {scoringAssignments.filter(a => a.status === 'pending').length}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-400">{pendingSwapCount}</p>
                  <p className="text-xs text-gray-500">Swaps</p>
                </div>
              </div>
            </div>

            {/* Assignments list */}
            <div className="space-y-3">
              {filteredScoringAssignments.length > 0 ? (
                filteredScoringAssignments.map(assignment => (
                  <div key={assignment.id} className="bg-white rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium">{assignment.game}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(assignment.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at {formatTimeStringAU(assignment.time)}
                        </p>
                        {assignment.venue && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin size={10} /> {assignment.venue}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        assignment.status === 'confirmed'
                          ? 'bg-[#005028]/20 text-[#00A651]'
                          : assignment.status === 'swap_requested'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {assignment.status === 'confirmed' && <Check size={12} />}
                        {assignment.status === 'pending' && <Clock size={12} />}
                        {assignment.status === 'swap_requested' && <ArrowRightLeft size={12} />}
                        {assignment.status === 'confirmed' ? 'Confirmed' :
                         assignment.status === 'swap_requested' ? 'Swap Requested' :
                         assignment.status === 'pending' ? 'Pending' : assignment.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm">{assignment.parentName || 'Unassigned'}</span>
                        {assignment.parentEmail && (
                          <span className="text-xs text-gray-400">({assignment.parentEmail})</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setShowReassignModal(true);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Edit size={12} />
                        Reassign
                      </button>

                      {swapRequests.some(s => s.assignmentId === assignment.id && s.status === 'pending') && (
                        <button
                          onClick={() => {
                            const swap = swapRequests.find(s => s.assignmentId === assignment.id && s.status === 'pending');
                            setSelectedSwapRequest(swap);
                            setShowSwapRequestsModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <ArrowRightLeft size={12} />
                          View Swap
                        </button>
                      )}

                      {assignment.status !== 'confirmed' && (
                        <button
                          onClick={() => handleMarkConfirmed(assignment)}
                          disabled={isMarkingConfirmed === assignment.id}
                          className="px-3 py-1.5 bg-[#005028]/20 text-[#00A651] hover:bg-[#00A651]/30 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          {isMarkingConfirmed === assignment.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <Check size={12} />
                              Mark Confirmed
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleSendReminder(assignment)}
                        disabled={isSending}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Bell size={12} />
                        Send Reminder
                      </button>

                      {assignment.status !== 'swap_requested' && (
                        <button
                          onClick={() => {
                            setSelectedSwapAssignment(assignment);
                            setSelectedScoringTeam(assignment.teamId || assignment.teamName);
                            setShowSwapModal(true);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <ArrowRightLeft size={12} />
                          Request Swap
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <Calendar className="mx-auto mb-2 text-gray-800/30" size={32} />
                  <p className="text-gray-400">No scoring assignments found</p>
                  <p className="text-sm text-gray-800/30 mt-1">
                    Use the "Create" tab to send scoring notifications, or "Auto-Assign" to assign games automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Pending Swap Requests Section */}
            {swapRequests.filter(s => s.status === 'pending').length > 0 && (
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-blue-400" />
                  Pending Swap Requests
                </h4>
                <div className="space-y-2">
                  {swapRequests.filter(s => s.status === 'pending').map(swap => (
                    <div key={swap.id} className="bg-gray-100 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{swap.gameName || swap.gameId}</p>
                          <p className="text-xs text-gray-500">
                            {swap.requestingParentName} → {swap.targetParentName}
                          </p>
                          {swap.reason && (
                            <p className="text-xs text-gray-400 mt-1">"{swap.reason}"</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveSwapRequest(swap)}
                            disabled={isProcessingSwap}
                            className="p-1.5 bg-[#005028]/20 text-[#00A651] hover:bg-[#00A651]/30 rounded-lg"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleDeclineSwapRequest(swap)}
                            disabled={isProcessingSwap}
                            className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full bg-gray-100 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-gray-800 placeholder-white/40 focus:outline-none focus:border-[#00A651]"
                  />
                </div>
                <select
                  value={historyFilter.type}
                  onChange={(e) => setHistoryFilter(prev => ({ ...prev, type: e.target.value }))}
                  className="bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Types</option>
                  {Object.entries(NOTIFICATION_TYPE_CONFIG).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredHistory.length > 0 ? (
                filteredHistory.map(notif => {
                  const Icon = getTypeIcon(notif.type);

                  return (
                    <div key={notif.id} className="bg-white rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                          <Icon className="text-[#00A651]" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{notif.subject}</h4>
                            {notif.priority === 'urgent' && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">Urgent</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{notif.message}</p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{new Date(notif.sentAt).toLocaleDateString('en-AU')}</span>
                            <span className="flex items-center gap-1">
                              <Eye size={12} /> {notif.readCount}/{notif.totalRecipients}
                            </span>
                            {notif.deliveryStats && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Bell size={12} /> {notif.deliveryStats.inApp} in-app
                                </span>
                                <span className="flex items-center gap-1">
                                  <Mail size={12} /> {notif.deliveryStats.email} email
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <Bell className="mx-auto mb-2 text-gray-800/30" size={32} />
                  <p className="text-gray-400">No notifications found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Eye size={18} className="text-[#00A651]" />
                View Notifications as Parent
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Select a parent to see their notification inbox.
              </p>

              <select
                value={previewUser}
                onChange={(e) => handlePreviewUserChange(e.target.value)}
                className={dropdownStyles}
                style={{ color: '#111827', backgroundColor: '#f9fafb' }}
              >
                <option value="">-- Select a parent to preview --</option>
                {searchableIndividuals.filter(i => i.type === 'parent').map(individual => (
                  <option key={individual.id} value={individual.id}>
                    {individual.name} ({individual.email})
                  </option>
                ))}
              </select>
            </div>

            {previewUser && (
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Inbox size={18} className="text-[#00A651]" />
                  <span className="font-medium">
                    Inbox for {searchableIndividuals.find(i => i.id === previewUser)?.name}
                  </span>
                </div>

                {previewNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {previewNotifications.map(notif => (
                      <div key={notif.id} className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#005028]/20">
                            {React.createElement(getTypeIcon(notif.type), { size: 16, className: 'text-[#00A651]' })}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notif.subject}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notif.sentAt).toLocaleString('en-AU')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Inbox className="mx-auto mb-2 text-gray-800/30" size={32} />
                    <p className="text-gray-400">No notifications for this user</p>
                  </div>
                )}
              </div>
            )}

            {/* Test Users Credentials */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <UserCheck size={18} className="text-[#00A651]" />
                Test User Credentials
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Use these credentials to login and test notifications from the parent's perspective.
              </p>

              {testUsers.length > 0 ? (
                <div className="space-y-2">
                  {testUsers.slice(0, 5).map(user => (
                    <div key={user.id} className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">Role: {user.role} • Password: Test123!</p>
                      </div>
                      <button
                        onClick={() => handleCopyCredentials(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          copiedCredentials === user.id
                            ? 'bg-[#005028] text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {copiedCredentials === user.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No test users found. Create sample data first.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Tools Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Database size={18} className="text-[#00A651]" />
                Sample Data Tools
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Create or clear sample data for testing notifications.
              </p>

              {dataPopulationMessage && (
                <div className={`p-3 rounded-lg mb-4 ${
                  dataPopulationMessage.includes('Error')
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : dataPopulationMessage.includes('success')
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                }`}>
                  <p className="text-sm flex items-center gap-2">
                    {isPopulatingData && <Loader2 className="animate-spin" size={16} />}
                    {dataPopulationMessage}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePopulateSampleData}
                  disabled={isPopulatingData}
                  className="py-3 px-4 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Create Sample Data
                </button>
                <button
                  onClick={handleClearSampleData}
                  disabled={isPopulatingData}
                  className="py-3 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Clear Sample Data
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4">
              <h3 className="font-bold mb-2">Current Data Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-600">Teams in database:</span>
                  <span className="font-medium">{teams?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-600">Players in database:</span>
                  <span className="font-medium">{players?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-600">Users in database:</span>
                  <span className="font-medium">{allUsers?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-600">Test users:</span>
                  <span className="font-medium">{testUsers?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-600">Games in database:</span>
                  <span className="font-medium">{games?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-600">Scoring assignments:</span>
                  <span className="font-medium">{scoringAssignments?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="text-[#00A651] flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Sample Data includes:</strong>
                  </p>
                  <ul className="text-sm text-gray-500 mt-2 list-disc list-inside space-y-1">
                    <li>6 teams (Lakers U8, U10, U12, U14, U16, U19)</li>
                    <li>21 sample players across all age groups</li>
                    <li>5 test parent accounts with varied notification preferences</li>
                    <li>Test credentials: email + password "Test123!"</li>
                    <li>8 upcoming games (dynamic dates starting next Saturday)</li>
                    <li>3 sample scoring assignments (unassigned, pending, confirmed)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Send</h3>
            <p className="text-gray-600 mb-4">
              Send this {NOTIFICATION_TYPE_CONFIG[notificationType]?.label || 'notification'} to {
                notificationType === 'scoring'
                  ? '1 parent'
                  : `${recipientInfo.total} ${recipientInfo.total === 1 ? 'person' : 'people'}`
              }?
            </p>

            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-2">Will be delivered via:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded flex items-center gap-1">
                  <Bell size={12} /> In-App
                </span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded flex items-center gap-1">
                  <Mail size={12} /> Email
                </span>
              </div>
            </div>

            {priority === PRIORITY_LEVELS.URGENT && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-400">
                  <AlertTriangle size={14} className="inline mr-1" />
                  This is marked as URGENT
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with Detailed Delivery Status */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="w-16 h-16 bg-[#005028] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-gray-800" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Notification Sent!</h3>

            {deliveryStats && (
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-3">Delivery Summary:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Users size={14} className="text-gray-400" /> Total Recipients
                    </span>
                    <span className="font-medium">{recipientInfo.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Bell size={14} className="text-blue-400" /> In-App Delivered
                    </span>
                    <span className="font-medium text-blue-400">{deliveryStats.inApp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="text-purple-400" /> Email Queued
                    </span>
                    <span className="font-medium text-purple-400">{deliveryStats.email}</span>
                  </div>
                  {deliveryStats.sms > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-green-400" /> SMS Queued
                      </span>
                      <span className="font-medium text-green-400">{deliveryStats.sms}</span>
                    </div>
                  )}
                </div>

                {/* Expandable Recipients List */}
                {detailedDeliveryRecipients.length > 0 && (
                  <details className="mt-3 pt-3 border-t border-white/10">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-800">
                      View recipient details ({detailedDeliveryRecipients.length})
                    </summary>
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                      {detailedDeliveryRecipients.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1 bg-gray-100 rounded">
                          <span className="truncate">{r.name || r.email}</span>
                          <span className="text-[#00A651]">{r.channels.inApp}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setDeliveryStats(null);
                setDetailedDeliveryRecipients([]);
              }}
              className="w-full py-2 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Request Scoring Swap</h3>

            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">Current Assignment:</p>
              <p className="font-medium">{selectedSwapAssignment?.game}</p>
              <p className="text-sm text-gray-500">{selectedSwapAssignment?.parentName}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Swap with:</label>
              <select
                value={swapTargetParent}
                onChange={(e) => setSwapTargetParent(e.target.value)}
                className={dropdownStyles}
                style={{ color: '#111827', backgroundColor: '#f9fafb' }}
              >
                <option value="">Select a parent...</option>
                {teamParents.filter(p => p.id !== selectedSwapAssignment?.parentId).map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Parent of {p.playerName})</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Reason (optional):</label>
              <textarea
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                placeholder="Why is the swap needed?"
                rows={3}
                className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 placeholder-white/40 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSelectedSwapAssignment(null);
                  setSwapTargetParent('');
                  setSwapReason('');
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSwapRequest}
                disabled={!swapTargetParent}
                className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {showReassignModal && editingAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Edit size={18} className="text-[#00A651]" />
              Reassign Scoring Duty
            </h3>

            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">Current Assignment:</p>
              <p className="font-medium">{editingAssignment.game}</p>
              <p className="text-sm text-gray-500">
                {new Date(editingAssignment.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} at {formatTimeStringAU(editingAssignment.time)}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                <User size={14} className="text-gray-400" />
                <span className="text-sm">Currently: {editingAssignment.parentName || 'Unassigned'}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Reassign to:</label>
              <select
                value={reassignmentTarget}
                onChange={(e) => setReassignmentTarget(e.target.value)}
                className={dropdownStyles}
                style={{ color: '#111827', backgroundColor: '#f9fafb' }}
              >
                <option value="">Select a parent...</option>
                {allParentsForTeam.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.playerName ? `(Parent of ${p.playerName})` : ''}
                  </option>
                ))}
              </select>
              {allParentsForTeam.length === 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  No other parents found for this team. Make sure team data is populated.
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Reason for change (optional):</label>
              <textarea
                value={reassignmentReason}
                onChange={(e) => setReassignmentReason(e.target.value)}
                placeholder="e.g., Parent requested change, scheduling conflict..."
                rows={3}
                className="w-full bg-gray-100 border border-white/20 rounded-lg px-3 py-2 text-gray-800 placeholder-white/40 resize-none"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-300">
                <Info size={14} className="inline mr-1" />
                This will send a notification to the new parent and (if applicable) a courtesy notice to the previous assignee.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setEditingAssignment(null);
                  setReassignmentTarget('');
                  setReassignmentReason('');
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignWithNotification}
                disabled={!reassignmentTarget || isProcessingSwap}
                className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isProcessingSwap ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Reassign & Notify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Assign Modal */}
      {showAutoAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <RefreshCw size={18} className="text-[#00A651]" />
              Auto-Assign Scoring Duties
            </h3>

            <p className="text-gray-500 text-sm mb-4">
              Automatically distribute scoring duties evenly among parents for all unassigned upcoming games.
            </p>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Select Team:</label>
              <select
                value={autoAssignTeam}
                onChange={(e) => setAutoAssignTeam(e.target.value)}
                className={dropdownStyles}
                style={{ color: '#111827', backgroundColor: '#f9fafb' }}
              >
                <option value="">Select a team...</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.playerCount} players)
                  </option>
                ))}
              </select>
            </div>

            {autoAssignTeam && (
              <div className="bg-gray-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                {(() => {
                  const team = availableTeams.find(t => t.id === autoAssignTeam);
                  const unassignedGames = availableGames.filter(g =>
                    (g.teamId === team?.id || g.team === team?.name) &&
                    !scoringAssignments.some(a => a.gameId === g.id)
                  );
                  return (
                    <div className="text-sm">
                      <p className="text-gray-800">{unassignedGames.length} unassigned game{unassignedGames.length !== 1 ? 's' : ''}</p>
                      <p className="text-gray-500">{team?.playerCount || 0} parents available</p>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-300">
                <AlertTriangle size={14} className="inline mr-1" />
                This will send notifications to all assigned parents.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAutoAssignModal(false);
                  setAutoAssignTeam('');
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoAssign}
                disabled={!autoAssignTeam || isProcessingSwap}
                className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isProcessingSwap ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Assigning...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Auto-Assign All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Swap Requests Modal */}
      {showSwapRequestsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-400" />
              Pending Swap Requests ({swapRequests.filter(s => s.status === 'pending').length})
            </h3>

            {selectedSwapRequest ? (
              <div>
                <button
                  onClick={() => setSelectedSwapRequest(null)}
                  className="text-sm text-[#00A651] mb-3 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back to all requests
                </button>

                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="font-medium">{selectedSwapRequest.gameName || 'Game'}</p>
                  <p className="text-sm text-gray-500">
                    {selectedSwapRequest.gameDate && new Date(selectedSwapRequest.gameDate).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">From:</span>
                      <span className="font-medium">{selectedSwapRequest.requestingParentName}</span>
                    </div>
                    <div className="flex items-center justify-center my-2">
                      <ArrowRightLeft size={16} className="text-blue-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">To:</span>
                      <span className="font-medium">{selectedSwapRequest.targetParentName}</span>
                    </div>
                  </div>

                  {selectedSwapRequest.reason && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-gray-600">Reason:</p>
                      <p className="text-sm italic">"{selectedSwapRequest.reason}"</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-4">
                    Requested: {selectedSwapRequest.createdAt && new Date(selectedSwapRequest.createdAt).toLocaleString('en-AU')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeclineSwapRequest(selectedSwapRequest)}
                    disabled={isProcessingSwap}
                    className="flex-1 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    Decline
                  </button>
                  <button
                    onClick={() => handleApproveSwapRequest(selectedSwapRequest)}
                    disabled={isProcessingSwap}
                    className="flex-1 py-2 bg-[#005028] hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessingSwap ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Check size={16} />
                        Approve Swap
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {swapRequests.filter(s => s.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {swapRequests.filter(s => s.status === 'pending').map(swap => (
                      <button
                        key={swap.id}
                        onClick={() => setSelectedSwapRequest(swap)}
                        className="w-full bg-gray-100 hover:bg-gray-100 rounded-lg p-4 text-left transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{swap.gameName || swap.gameId}</p>
                            <p className="text-sm text-gray-500">
                              {swap.requestingParentName} → {swap.targetParentName}
                            </p>
                            {swap.reason && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">"{swap.reason}"</p>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ArrowRightLeft className="mx-auto mb-2 text-gray-800/30" size={32} />
                    <p className="text-gray-400">No pending swap requests</p>
                  </div>
                )}

                <button
                  onClick={() => setShowSwapRequestsModal(false)}
                  className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default NotificationsPage;
