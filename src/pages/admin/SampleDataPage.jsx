import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  updateDoc,
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import {
  Database,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  Trophy,
  UserCheck,
  ClipboardList,
  RefreshCw,
  Shield,
  Info,
  Copy,
  Check,
  CalendarClock,
  Wrench
} from 'lucide-react';
import {
  getNextSaturday,
  formatDateForStorage,
  formatDateAU,
  formatTimeStringAU,
  formatGameDateTime
} from '../../utils/dateUtils';

// Sample Teams Data
const SAMPLE_TEAMS = [
  {
    id: 'lakers-u8',
    teamId: 'lakers-u8',
    name: 'Lakers U8',
    ageGroup: 'U8',
    ageGroupRange: 'u8-u10',
    coachId: 'coach1',
    coachName: 'Test Coach',
    season: '2025',
    active: true,
    players: [],
    isSampleData: true
  },
  {
    id: 'lakers-u10',
    teamId: 'lakers-u10',
    name: 'Lakers U10',
    ageGroup: 'U10',
    ageGroupRange: 'u8-u10',
    coachId: 'coach1',
    coachName: 'Test Coach',
    season: '2025',
    active: true,
    players: [],
    isSampleData: true
  },
  {
    id: 'lakers-u12',
    teamId: 'lakers-u12',
    name: 'Lakers U12',
    ageGroup: 'U12',
    ageGroupRange: 'u12-u14',
    coachId: 'coach1',
    coachName: 'Test Coach',
    season: '2025',
    active: true,
    players: [],
    isSampleData: true
  },
  {
    id: 'lakers-u14',
    teamId: 'lakers-u14',
    name: 'Lakers U14',
    ageGroup: 'U14',
    ageGroupRange: 'u12-u14',
    coachId: 'coach1',
    coachName: 'Test Coach',
    season: '2025',
    active: true,
    players: [],
    isSampleData: true
  },
  {
    id: 'lakers-u16',
    teamId: 'lakers-u16',
    name: 'Lakers U16',
    ageGroup: 'U16',
    ageGroupRange: 'u14-u16',
    coachId: 'coach1',
    coachName: 'Test Coach',
    season: '2025',
    active: true,
    players: [],
    isSampleData: true
  }
];

// Sample Players Data - Australian names
const SAMPLE_PLAYERS = [
  // Lakers U8 (5 players)
  { name: 'Liam Cooper', teamId: 'lakers-u8', teamName: 'Lakers U8', ageGroup: 'U8', playerNumber: 5, age: 7, position: 'Guard', parentName: 'Sarah Cooper', parentEmail: 'sarah.cooper@testparent.com', parentPhone: '0412345001' },
  { name: 'Noah Mitchell', teamId: 'lakers-u8', teamName: 'Lakers U8', ageGroup: 'U8', playerNumber: 7, age: 8, position: 'Forward', parentName: 'James Mitchell', parentEmail: 'james.mitchell@testparent.com', parentPhone: '0412345002' },
  { name: 'Oliver Martin', teamId: 'lakers-u8', teamName: 'Lakers U8', ageGroup: 'U8', playerNumber: 10, age: 7, position: 'Center', parentName: 'Emma Martin', parentEmail: 'emma.martin@testparent.com', parentPhone: '0412345003' },
  { name: 'William Taylor', teamId: 'lakers-u8', teamName: 'Lakers U8', ageGroup: 'U8', playerNumber: 12, age: 8, position: 'Guard', parentName: 'Michael Taylor', parentEmail: 'michael.taylor@testparent.com', parentPhone: '0412345004' },
  { name: 'Jack Anderson', teamId: 'lakers-u8', teamName: 'Lakers U8', ageGroup: 'U8', playerNumber: 15, age: 7, position: 'Forward', parentName: 'Jessica Anderson', parentEmail: 'jessica.anderson@testparent.com', parentPhone: '0412345005' },

  // Lakers U10 (5 players)
  { name: 'Thomas Wilson', teamId: 'lakers-u10', teamName: 'Lakers U10', ageGroup: 'U10', playerNumber: 3, age: 9, position: 'Point Guard', parentName: 'David Wilson', parentEmail: 'david.wilson@testparent.com', parentPhone: '0412345006' },
  { name: 'James Thompson', teamId: 'lakers-u10', teamName: 'Lakers U10', ageGroup: 'U10', playerNumber: 8, age: 10, position: 'Shooting Guard', parentName: 'Lisa Thompson', parentEmail: 'lisa.thompson@testparent.com', parentPhone: '0412345007' },
  { name: 'Lucas Brown', teamId: 'lakers-u10', teamName: 'Lakers U10', ageGroup: 'U10', playerNumber: 11, age: 9, position: 'Small Forward', parentName: 'Andrew Brown', parentEmail: 'andrew.brown@testparent.com', parentPhone: '0412345008' },
  { name: 'Henry White', teamId: 'lakers-u10', teamName: 'Lakers U10', ageGroup: 'U10', playerNumber: 14, age: 10, position: 'Power Forward', parentName: 'Rachel White', parentEmail: 'rachel.white@testparent.com', parentPhone: '0412345009' },
  { name: 'Alexander Harris', teamId: 'lakers-u10', teamName: 'Lakers U10', ageGroup: 'U10', playerNumber: 21, age: 9, position: 'Center', parentName: 'Chris Harris', parentEmail: 'chris.harris@testparent.com', parentPhone: '0412345010' },

  // Lakers U12 (6 players)
  { name: 'Benjamin Clarke', teamId: 'lakers-u12', teamName: 'Lakers U12', ageGroup: 'U12', playerNumber: 4, age: 11, position: 'Point Guard', parentName: 'Sophie Clarke', parentEmail: 'sophie.clarke@testparent.com', parentPhone: '0412345011' },
  { name: 'Mason Roberts', teamId: 'lakers-u12', teamName: 'Lakers U12', ageGroup: 'U12', playerNumber: 9, age: 12, position: 'Shooting Guard', parentName: 'Daniel Roberts', parentEmail: 'daniel.roberts@testparent.com', parentPhone: '0412345012' },
  { name: 'Ethan Lewis', teamId: 'lakers-u12', teamName: 'Lakers U12', ageGroup: 'U12', playerNumber: 13, age: 11, position: 'Small Forward', parentName: 'Kate Lewis', parentEmail: 'kate.lewis@testparent.com', parentPhone: '0412345013' },
  { name: 'Sebastian Walker', teamId: 'lakers-u12', teamName: 'Lakers U12', ageGroup: 'U12', playerNumber: 17, age: 12, position: 'Power Forward', parentName: 'Mark Walker', parentEmail: 'mark.walker@testparent.com', parentPhone: '0412345014' },
  { name: 'Jacob Hall', teamId: 'lakers-u12', teamName: 'Lakers U12', ageGroup: 'U12', playerNumber: 22, age: 11, position: 'Center', parentName: 'Amy Hall', parentEmail: 'amy.hall@testparent.com', parentPhone: '0412345015' },
  { name: 'Ryan Green', teamId: 'lakers-u12', teamName: 'Lakers U12', ageGroup: 'U12', playerNumber: 25, age: 12, position: 'Guard', parentName: 'Steve Green', parentEmail: 'steve.green@testparent.com', parentPhone: '0412345016' },

  // Lakers U14 (5 players)
  { name: 'Daniel King', teamId: 'lakers-u14', teamName: 'Lakers U14', ageGroup: 'U14', playerNumber: 2, age: 13, position: 'Point Guard', parentName: 'Michelle King', parentEmail: 'michelle.king@testparent.com', parentPhone: '0412345017' },
  { name: 'Matthew Scott', teamId: 'lakers-u14', teamName: 'Lakers U14', ageGroup: 'U14', playerNumber: 6, age: 14, position: 'Shooting Guard', parentName: 'Peter Scott', parentEmail: 'peter.scott@testparent.com', parentPhone: '0412345018' },
  { name: 'Samuel Adams', teamId: 'lakers-u14', teamName: 'Lakers U14', ageGroup: 'U14', playerNumber: 16, age: 13, position: 'Small Forward', parentName: 'Jennifer Adams', parentEmail: 'jennifer.adams@testparent.com', parentPhone: '0412345019' },
  { name: 'Joshua Baker', teamId: 'lakers-u14', teamName: 'Lakers U14', ageGroup: 'U14', playerNumber: 19, age: 14, position: 'Power Forward', parentName: 'Robert Baker', parentEmail: 'robert.baker@testparent.com', parentPhone: '0412345020' },
  { name: 'Patrick Nelson', teamId: 'lakers-u14', teamName: 'Lakers U14', ageGroup: 'U14', playerNumber: 23, age: 13, position: 'Center', parentName: 'Laura Nelson', parentEmail: 'laura.nelson@testparent.com', parentPhone: '0412345021' },

  // Lakers U16 (5 players)
  { name: 'Dylan Campbell', teamId: 'lakers-u16', teamName: 'Lakers U16', ageGroup: 'U16', playerNumber: 1, age: 15, position: 'Point Guard', parentName: 'Karen Campbell', parentEmail: 'karen.campbell@testparent.com', parentPhone: '0412345022' },
  { name: 'Nathan Evans', teamId: 'lakers-u16', teamName: 'Lakers U16', ageGroup: 'U16', playerNumber: 18, age: 16, position: 'Shooting Guard', parentName: 'Brian Evans', parentEmail: 'brian.evans@testparent.com', parentPhone: '0412345023' },
  { name: 'Cooper Morris', teamId: 'lakers-u16', teamName: 'Lakers U16', ageGroup: 'U16', playerNumber: 20, age: 15, position: 'Small Forward', parentName: 'Helen Morris', parentEmail: 'helen.morris@testparent.com', parentPhone: '0412345024' },
  { name: 'Riley Turner', teamId: 'lakers-u16', teamName: 'Lakers U16', ageGroup: 'U16', playerNumber: 24, age: 16, position: 'Power Forward', parentName: 'Gary Turner', parentEmail: 'gary.turner@testparent.com', parentPhone: '0412345025' },
  { name: 'Blake Phillips', teamId: 'lakers-u16', teamName: 'Lakers U16', ageGroup: 'U16', playerNumber: 30, age: 15, position: 'Center', parentName: 'Susan Phillips', parentEmail: 'susan.phillips@testparent.com', parentPhone: '0412345026' }
];

// Opponent teams for games
const OPPONENTS = {
  U8: ['Hornets U8', 'Eagles U8', 'Tigers U8', 'Bears U8'],
  U10: ['Hornets U10', 'Eagles U10', 'Tigers U10', 'Bears U10'],
  U12: ['Hornets U12', 'Eagles U12', 'Tigers U12', 'Bears U12'],
  U14: ['Hornets U14', 'Eagles U14', 'Tigers U14', 'Bears U14'],
  U16: ['Hornets U16', 'Eagles U16', 'Tigers U16', 'Bears U16']
};

// Venues
const VENUES = [
  'Emerald Stadium Court 1',
  'Emerald Stadium Court 2',
  'Hills Sports Centre',
  'Community Centre Gym',
  'Westside Arena'
];

// Game times in 12-hour format
const GAME_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'];

// Generate sample games
const generateSampleGames = () => {
  const games = [];
  let roundCounter = 1;
  const currentYear = new Date().getFullYear();

  console.log('[SampleData] Generating sample games...');

  SAMPLE_TEAMS.forEach((team, teamIndex) => {
    const teamOpponents = OPPONENTS[team.ageGroup];

    // 3 games per team
    for (let i = 0; i < 3; i++) {
      const gameDate = getNextSaturday(i + 1);
      const opponent = teamOpponents[i % teamOpponents.length];
      const isHome = i % 2 === 0;
      const gameTime = GAME_TIMES[teamIndex % GAME_TIMES.length];

      const game = {
        gameId: `game-${team.teamId}-r${i + 1}`,
        teamId: team.teamId,
        teamName: team.name,
        opponent: opponent,
        // Store as both Timestamp and string for compatibility
        date: Timestamp.fromDate(gameDate),
        dateString: formatDateForStorage(gameDate),
        time: gameTime,
        venue: isHome ? VENUES[0] : VENUES[Math.floor(Math.random() * VENUES.length)],
        homeAway: isHome ? 'home' : 'away',
        season: String(currentYear),
        round: roundCounter + i,
        status: 'scheduled',
        result: null,
        type: 'game',
        createdAt: Timestamp.now(),
        isSampleData: true
      };

      console.log(`[SampleData] Created game: ${team.name} vs ${opponent} on ${formatDateForStorage(gameDate)}`);
      games.push(game);
    }
  });

  console.log(`[SampleData] Generated ${games.length} games total`);
  return games;
};

// Generate parent users from player data
const generateParentUsers = () => {
  const parentMap = new Map();

  SAMPLE_PLAYERS.forEach(player => {
    if (!parentMap.has(player.parentEmail)) {
      parentMap.set(player.parentEmail, {
        email: player.parentEmail,
        displayName: player.parentName,
        name: player.parentName,
        role: 'parent',
        phone: player.parentPhone,
        preferences: {
          notifications: {
            inApp: true,
            email: true,
            sms: Math.random() > 0.5, // Random SMS preference
            types: {
              scoring: true,
              gameDay: true,
              uniform: true,
              announcements: true,
              training: true,
              events: true
            }
          }
        },
        children: [],
        isTestUser: true,
        createdAt: null // Will be set to Timestamp.now() when written to Firestore
      });
    }
  });

  return Array.from(parentMap.values());
};

const SampleDataPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // info, success, error
  const [dataStats, setDataStats] = useState({
    teams: 0,
    players: 0,
    games: 0,
    parents: 0,
    assignments: 0
  });
  const [validationResults, setValidationResults] = useState([]);
  const [copiedCredential, setCopiedCredential] = useState(null);

  // Fetch current data stats
  const fetchDataStats = async () => {
    try {
      const [teamsSnap, playersSnap, gamesSnap, usersSnap, assignmentsSnap] = await Promise.all([
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'players')),
        getDocs(collection(db, 'games')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'parent'))),
        getDocs(collection(db, 'scoring_assignments'))
      ]);

      setDataStats({
        teams: teamsSnap.size,
        players: playersSnap.size,
        games: gamesSnap.size,
        parents: usersSnap.size,
        assignments: assignmentsSnap.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchDataStats();
  }, []);

  // Populate all sample data
  const handlePopulateData = async () => {
    setIsLoading(true);
    setStatusMessage('Starting data population...');
    setStatusType('info');
    setValidationResults([]);

    console.log('=== STARTING SAMPLE DATA POPULATION ===');

    try {
      const batch = writeBatch(db);
      const playerIdMap = new Map(); // Map player email to playerId
      const parentIdMap = new Map(); // Map parent email to parentId

      // 1. Create Teams
      console.log('[SampleData] Step 1: Creating teams...');
      setStatusMessage('Creating teams...');
      for (const team of SAMPLE_TEAMS) {
        const teamRef = doc(db, 'teams', team.id);
        console.log(`[SampleData] Adding team: ${team.name} (${team.id})`);
        batch.set(teamRef, {
          ...team,
          createdAt: Timestamp.now(),
          isSampleData: true
        });
      }

      // 2. Create Players
      console.log('[SampleData] Step 2: Creating players...');
      setStatusMessage('Creating players...');
      for (const player of SAMPLE_PLAYERS) {
        const playerRef = doc(collection(db, 'players'));
        const playerId = playerRef.id;
        playerIdMap.set(player.parentEmail, playerId);

        const birthYear = new Date().getFullYear() - player.age;
        const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

        console.log(`[SampleData] Adding player: ${player.name} (${playerId})`);
        batch.set(playerRef, {
          ...player,
          playerId: playerId,
          dateOfBirth: Timestamp.fromDate(dateOfBirth),
          active: true,
          medicalNotes: '',
          createdAt: Timestamp.now(),
          isSampleData: true
        });
      }

      // Commit first batch (teams and players)
      console.log('[SampleData] Committing batch 1 (teams + players)...');
      await batch.commit();
      console.log('[SampleData] Batch 1 committed successfully!');
      setStatusMessage('Teams and players created. Creating parent users...');

      // 3. Create Parent Users (new batch)
      console.log('[SampleData] Step 3: Creating parent users...');
      const parentBatch = writeBatch(db);
      const parentUsers = generateParentUsers();

      for (const parent of parentUsers) {
        const userRef = doc(collection(db, 'users'));
        const parentId = userRef.id;
        parentIdMap.set(parent.email, parentId);

        // Find children for this parent
        const children = SAMPLE_PLAYERS
          .filter(p => p.parentEmail === parent.email)
          .map(p => playerIdMap.get(p.parentEmail));

        console.log(`[SampleData] Adding parent: ${parent.displayName} (${parent.email})`);
        parentBatch.set(userRef, {
          ...parent,
          uid: parentId,
          children: children,
          createdAt: Timestamp.now()
        });
      }

      console.log('[SampleData] Committing batch 2 (parent users)...');
      await parentBatch.commit();
      console.log('[SampleData] Batch 2 committed successfully!');
      setStatusMessage('Parent users created. Creating games...');

      // 4. Create Games (new batch)
      console.log('[SampleData] Step 4: Creating games...');
      const gamesBatch = writeBatch(db);
      const sampleGames = generateSampleGames();
      const gameIdMap = new Map();

      console.log(`[SampleData] Generated ${sampleGames.length} games to create`);

      for (const game of sampleGames) {
        const gameRef = doc(collection(db, 'games'));
        const firestoreId = gameRef.id;
        gameIdMap.set(game.gameId, firestoreId);
        console.log(`[SampleData] Adding game to batch: ${game.teamName} vs ${game.opponent} (Firestore ID: ${firestoreId})`);
        gamesBatch.set(gameRef, {
          ...game,
          id: firestoreId
        });
      }

      console.log('[SampleData] Committing batch 3 (games)...');
      try {
        await gamesBatch.commit();
        console.log('[SampleData] Batch 3 (games) committed successfully!');
        console.log(`[SampleData] Created ${sampleGames.length} games in Firestore`);
      } catch (gameError) {
        console.error('[SampleData] ERROR committing games batch:', gameError);
        throw new Error(`Failed to create games: ${gameError.message}`);
      }
      setStatusMessage('Games created. Creating scoring assignments...');

      // 5. Create Scoring Assignments (new batch)
      console.log('[SampleData] Step 5: Creating scoring assignments...');
      const assignmentsBatch = writeBatch(db);
      const assignments = [];

      // Create 1 assignment per game for the first 8 games
      const gamesToAssign = sampleGames.slice(0, 8);
      let parentIndex = 0;
      const parentList = Array.from(parentIdMap.entries());

      console.log(`[SampleData] Creating ${gamesToAssign.length} scoring assignments...`);

      for (const game of gamesToAssign) {
        const [parentEmail, parentId] = parentList[parentIndex % parentList.length];
        const parent = parentUsers.find(p => p.email === parentEmail);

        const assignmentRef = doc(collection(db, 'scoring_assignments'));
        const status = parentIndex < 2 ? 'confirmed' : parentIndex < 5 ? 'pending' : 'unassigned';

        const assignment = {
          assignmentId: assignmentRef.id,
          gameId: gameIdMap.get(game.gameId),
          teamId: game.teamId,
          teamName: game.teamName,
          parentId: status !== 'unassigned' ? parentId : null,
          parentName: status !== 'unassigned' ? parent?.displayName : null,
          parentEmail: status !== 'unassigned' ? parentEmail : null,
          gameDate: game.date, // Already a Timestamp from the game
          gameDateString: game.dateString, // Keep string version for queries
          gameTime: game.time,
          opponent: game.opponent,
          venue: game.venue,
          gameDetails: `vs ${game.opponent} @ ${game.venue}`,
          status: status,
          notificationSentAt: status !== 'unassigned' ? Timestamp.now() : null,
          confirmedAt: status === 'confirmed' ? Timestamp.now() : null,
          assignedBy: status !== 'unassigned' ? 'admin' : null,
          createdAt: Timestamp.now(),
          isSampleData: true
        };

        console.log(`[SampleData] Adding assignment: ${game.teamName} - ${status} (${assignmentRef.id})`);
        assignmentsBatch.set(assignmentRef, assignment);
        assignments.push(assignment);
        parentIndex++;
      }

      console.log('[SampleData] Committing batch 4 (scoring assignments)...');
      try {
        await assignmentsBatch.commit();
        console.log('[SampleData] Batch 4 (scoring assignments) committed successfully!');
        console.log(`[SampleData] Created ${assignments.length} scoring assignments`);
      } catch (assignmentError) {
        console.error('[SampleData] ERROR committing assignments batch:', assignmentError);
        throw new Error(`Failed to create scoring assignments: ${assignmentError.message}`);
      }
      setStatusMessage('Scoring assignments created. Updating coach user...');

      // 6. Update existing coach user with teams
      try {
        const coachQuery = query(collection(db, 'users'), where('email', '==', 'coach@test.com'));
        const coachSnap = await getDocs(coachQuery);

        if (!coachSnap.empty) {
          const coachDoc = coachSnap.docs[0];
          await updateDoc(coachDoc.ref, {
            teams: ['lakers-u12', 'lakers-u14'],
            teamNames: ['Lakers U12', 'Lakers U14']
          });
          setStatusMessage('Coach user updated.');
        }
      } catch (e) {
        console.log('Coach user not found or update failed:', e);
      }

      // 7. Validate data
      setStatusMessage('Validating data integrity...');
      const validationIssues = await validateData();
      setValidationResults(validationIssues);

      // Refresh stats
      await fetchDataStats();

      console.log('=== SAMPLE DATA POPULATION COMPLETE ===');
      console.log(`Summary: ${SAMPLE_TEAMS.length} teams, ${SAMPLE_PLAYERS.length} players, ${sampleGames.length} games, ${parentUsers.length} parents, ${assignments.length} assignments`);

      setStatusMessage(validationIssues.length > 0
        ? `Sample data created with ${validationIssues.length} warnings.`
        : 'All sample data created successfully!');
      setStatusType(validationIssues.length > 0 ? 'warning' : 'success');

    } catch (error) {
      console.error('Error populating data:', error);
      setStatusMessage(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate data integrity
  const validateData = async () => {
    const issues = [];

    try {
      // Get all data
      const [teamsSnap, playersSnap, gamesSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'players')),
        getDocs(collection(db, 'games')),
        getDocs(collection(db, 'users'))
      ]);

      const teamIds = new Set(teamsSnap.docs.map(d => d.id));
      const userIds = new Set(usersSnap.docs.map(d => d.id));
      const today = new Date();

      // Validate games
      gamesSnap.docs.forEach(gameDoc => {
        const game = gameDoc.data();
        if (game.isSampleData) {
          if (!teamIds.has(game.teamId)) {
            issues.push(`Game ${gameDoc.id}: teamId "${game.teamId}" doesn't match any team`);
          }
          const gameDate = new Date(game.date);
          if (gameDate < today) {
            issues.push(`Game ${gameDoc.id}: date ${game.date} is in the past`);
          }
        }
      });

      // Validate players
      playersSnap.docs.forEach(playerDoc => {
        const player = playerDoc.data();
        if (player.isSampleData) {
          if (!teamIds.has(player.teamId)) {
            issues.push(`Player ${player.name}: teamId "${player.teamId}" doesn't match any team`);
          }
        }
      });

    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
    }

    return issues;
  };

  // Clear all sample data
  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear ALL sample data? This cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setStatusMessage('Clearing sample data...');
    setStatusType('info');

    try {
      // Clear teams
      setStatusMessage('Clearing teams...');
      const teamsSnap = await getDocs(collection(db, 'teams'));
      for (const docSnap of teamsSnap.docs) {
        const data = docSnap.data();
        if (data.isSampleData || docSnap.id.startsWith('lakers-')) {
          await deleteDoc(docSnap.ref);
        }
      }

      // Clear players
      setStatusMessage('Clearing players...');
      const playersSnap = await getDocs(collection(db, 'players'));
      for (const docSnap of playersSnap.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-')) {
          await deleteDoc(docSnap.ref);
        }
      }

      // Clear games
      setStatusMessage('Clearing games...');
      const gamesSnap = await getDocs(collection(db, 'games'));
      for (const docSnap of gamesSnap.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-')) {
          await deleteDoc(docSnap.ref);
        }
      }

      // Clear test users (parents)
      setStatusMessage('Clearing test users...');
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const docSnap of usersSnap.docs) {
        const data = docSnap.data();
        if (data.isTestUser || data.email?.includes('@testparent.com')) {
          await deleteDoc(docSnap.ref);
        }
      }

      // Clear scoring assignments
      setStatusMessage('Clearing scoring assignments...');
      const assignmentsSnap = await getDocs(collection(db, 'scoring_assignments'));
      for (const docSnap of assignmentsSnap.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-')) {
          await deleteDoc(docSnap.ref);
        }
      }

      // Clear swap requests
      setStatusMessage('Clearing swap requests...');
      const swapsSnap = await getDocs(collection(db, 'swap_requests'));
      for (const docSnap of swapsSnap.docs) {
        const data = docSnap.data();
        if (data.isSampleData || data.teamId?.startsWith('lakers-')) {
          await deleteDoc(docSnap.ref);
        }
      }

      await fetchDataStats();
      setStatusMessage('All sample data cleared successfully!');
      setStatusType('success');
      setValidationResults([]);

    } catch (error) {
      console.error('Error clearing data:', error);
      setStatusMessage(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fix game dates - convert string dates to Firestore Timestamps
  const handleFixGameDates = async () => {
    setIsLoading(true);
    setStatusMessage('Converting dates to Timestamps...');
    setStatusType('info');

    console.log('=== STARTING DATE CONVERSION TO TIMESTAMPS ===');

    try {
      const gamesSnap = await getDocs(collection(db, 'games'));
      let convertedCount = 0;
      let skippedCount = 0;
      let cleanedDateStringCount = 0;

      console.log(`[FixDates] Found ${gamesSnap.size} games to check`);

      for (const gameDoc of gamesSnap.docs) {
        const game = gameDoc.data();
        const gameId = gameDoc.id;
        const updateData = {};

        // Check if date is already a Timestamp (has toDate method)
        const isAlreadyTimestamp = game.date && typeof game.date.toDate === 'function';

        if (isAlreadyTimestamp) {
          console.log(`[FixDates] Game ${gameId}: date is already a Timestamp, skipping conversion`);
          skippedCount++;
        } else if (game.date) {
          // Date is a string, convert to Timestamp
          const dateStr = game.date;
          const jsDate = new Date(dateStr);

          if (!isNaN(jsDate.getTime())) {
            updateData.date = Timestamp.fromDate(jsDate);
            console.log(`[FixDates] Game ${gameId}: Converting "${dateStr}" -> Timestamp(${jsDate.toISOString()})`);
            convertedCount++;
          } else {
            console.warn(`[FixDates] Game ${gameId}: Invalid date string "${dateStr}", skipping`);
            skippedCount++;
          }
        } else {
          console.warn(`[FixDates] Game ${gameId}: No date field found`);
          skippedCount++;
        }

        // Remove dateString field if it exists
        if (game.dateString !== undefined) {
          updateData.dateString = deleteField();
          console.log(`[FixDates] Game ${gameId}: Removing dateString field`);
          cleanedDateStringCount++;
        }

        // Apply updates if any
        if (Object.keys(updateData).length > 0) {
          await updateDoc(gameDoc.ref, updateData);
        }
      }

      // Also fix scoring assignments
      console.log('[FixDates] Now checking scoring assignments...');
      const assignmentsSnap = await getDocs(collection(db, 'scoring_assignments'));
      let assignmentsConverted = 0;
      let assignmentsSkipped = 0;
      let assignmentsCleanedDateString = 0;

      console.log(`[FixDates] Found ${assignmentsSnap.size} assignments to check`);

      for (const assignDoc of assignmentsSnap.docs) {
        const assignment = assignDoc.data();
        const assignId = assignDoc.id;
        const updateData = {};

        // Check if gameDate is already a Timestamp
        const isAlreadyTimestamp = assignment.gameDate && typeof assignment.gameDate.toDate === 'function';

        if (isAlreadyTimestamp) {
          console.log(`[FixDates] Assignment ${assignId}: gameDate is already a Timestamp, skipping`);
          assignmentsSkipped++;
        } else if (assignment.gameDate) {
          // gameDate is a string, convert to Timestamp
          const dateStr = assignment.gameDate;
          const jsDate = new Date(dateStr);

          if (!isNaN(jsDate.getTime())) {
            updateData.gameDate = Timestamp.fromDate(jsDate);
            console.log(`[FixDates] Assignment ${assignId}: Converting "${dateStr}" -> Timestamp`);
            assignmentsConverted++;
          } else {
            console.warn(`[FixDates] Assignment ${assignId}: Invalid date string "${dateStr}", skipping`);
            assignmentsSkipped++;
          }
        } else {
          assignmentsSkipped++;
        }

        // Remove gameDateString field if it exists
        if (assignment.gameDateString !== undefined) {
          updateData.gameDateString = deleteField();
          console.log(`[FixDates] Assignment ${assignId}: Removing gameDateString field`);
          assignmentsCleanedDateString++;
        }

        // Apply updates if any
        if (Object.keys(updateData).length > 0) {
          await updateDoc(assignDoc.ref, updateData);
        }
      }

      console.log('=== DATE CONVERSION COMPLETE ===');
      console.log(`Games: ${convertedCount} converted, ${skippedCount} skipped, ${cleanedDateStringCount} dateString fields removed`);
      console.log(`Assignments: ${assignmentsConverted} converted, ${assignmentsSkipped} skipped, ${assignmentsCleanedDateString} gameDateString fields removed`);

      await fetchDataStats();
      setStatusMessage(
        `Converted ${convertedCount} game dates to Timestamps (${skippedCount} already OK). ` +
        `Removed ${cleanedDateStringCount} dateString fields. ` +
        `Assignments: ${assignmentsConverted} converted, ${assignmentsCleanedDateString} cleaned.`
      );
      setStatusType('success');

    } catch (error) {
      console.error('[FixDates] Error:', error);
      setStatusMessage(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = (email) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: Parent123!`);
    setCopiedCredential(email);
    setTimeout(() => setCopiedCredential(null), 2000);
  };

  // Test parent credentials
  const testCredentials = generateParentUsers().slice(0, 8).map(p => ({
    email: p.email,
    name: p.displayName
  }));

  return (
    <PageShell
      title="Sample Data Manager"
      subtitle="Generate and manage test data"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Sample Data' }
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Message */}
        {statusMessage && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            statusType === 'error' ? 'bg-red-500/10 border border-red-500/30' :
            statusType === 'success' ? 'bg-green-500/10 border border-green-500/30' :
            statusType === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
            'bg-blue-500/10 border border-blue-500/30'
          }`}>
            {isLoading ? (
              <Loader2 className="animate-spin flex-shrink-0" size={20} />
            ) : statusType === 'error' ? (
              <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            ) : statusType === 'success' ? (
              <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
            ) : (
              <Info className="text-blue-400 flex-shrink-0" size={20} />
            )}
            <span className={
              statusType === 'error' ? 'text-red-300' :
              statusType === 'success' ? 'text-green-300' :
              statusType === 'warning' ? 'text-yellow-300' :
              'text-blue-300'
            }>{statusMessage}</span>
          </div>
        )}

        {/* Data Statistics */}
        <div className="bg-[#0d5943] rounded-xl p-6 border border-[#1a8a68]/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="text-[#4ade80]" size={20} />
              Current Data Status
            </h2>
            <button
              onClick={fetchDataStats}
              disabled={isLoading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard icon={Users} label="Teams" value={dataStats.teams} color="text-blue-400" />
            <StatCard icon={UserCheck} label="Players" value={dataStats.players} color="text-green-400" />
            <StatCard icon={Calendar} label="Games" value={dataStats.games} color="text-purple-400" />
            <StatCard icon={Users} label="Parents" value={dataStats.parents} color="text-yellow-400" />
            <StatCard icon={ClipboardList} label="Assignments" value={dataStats.assignments} color="text-pink-400" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handlePopulateData}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 p-5 bg-gradient-to-br from-[#22c55e] to-[#1a8a68] hover:from-[#1a8a68] hover:to-[#0d5943] disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-bold transition-all shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <Plus size={22} />
            )}
            Populate Data
          </button>

          <button
            onClick={handleFixGameDates}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 p-5 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-600 border border-blue-500/30 rounded-xl font-bold text-blue-400 transition-all"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <CalendarClock size={22} />
            )}
            Fix Date Formats
          </button>

          <button
            onClick={handleClearData}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 p-5 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-600 border border-red-500/30 rounded-xl font-bold text-red-400 transition-all"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <Trash2 size={22} />
            )}
            Clear Data
          </button>
        </div>

        {/* Validation Results */}
        {validationResults.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              Validation Warnings ({validationResults.length})
            </h3>
            <ul className="text-sm text-yellow-300 space-y-1">
              {validationResults.map((issue, idx) => (
                <li key={idx}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* What Gets Created */}
        <div className="bg-[#0d5943] rounded-xl p-6 border border-[#1a8a68]/30">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Info className="text-[#4ade80]" size={20} />
            What Gets Created
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold text-[#4ade80] mb-2">Teams (5)</h3>
              <ul className="text-white/70 space-y-1">
                <li>• Lakers U8 (u8-u10 age group)</li>
                <li>• Lakers U10 (u8-u10 age group)</li>
                <li>• Lakers U12 (u12-u14 age group)</li>
                <li>• Lakers U14 (u12-u14 age group)</li>
                <li>• Lakers U16 (u14-u16 age group)</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold text-[#4ade80] mb-2">Players (26)</h3>
              <ul className="text-white/70 space-y-1">
                <li>• 5 players per team (6 for U12)</li>
                <li>• Australian names</li>
                <li>• Proper positions and numbers</li>
                <li>• Parent contact info linked</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold text-[#4ade80] mb-2">Games (15)</h3>
              <ul className="text-white/70 space-y-1">
                <li>• 3 games per team</li>
                <li>• Future dates (next 4 weeks)</li>
                <li>• Realistic opponents</li>
                <li>• Home/away rotation</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold text-[#4ade80] mb-2">Scoring Assignments (8)</h3>
              <ul className="text-white/70 space-y-1">
                <li>• 2 confirmed assignments</li>
                <li>• 3 pending assignments</li>
                <li>• 3 unassigned slots</li>
                <li>• Ready for testing swaps</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="bg-[#0d5943] rounded-xl p-6 border border-[#1a8a68]/30">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <UserCheck className="text-[#4ade80]" size={20} />
            Test Parent Credentials
          </h2>
          <p className="text-white/60 text-sm mb-4">
            Use these credentials to log in as a parent and test notifications, scoring duties, and swap requests.
            <br />
            <strong className="text-white">Default password for all: Parent123!</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {testCredentials.map((cred, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{cred.name}</p>
                  <p className="text-xs text-white/60">{cred.email}</p>
                </div>
                <button
                  onClick={() => handleCopyCredentials(cred.email)}
                  className={`p-2 rounded-lg transition-colors ${
                    copiedCredential === cred.email
                      ? 'bg-[#22c55e] text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {copiedCredential === cred.email ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Note:</strong> These are Firestore user documents only. To actually log in, you'll need to create matching Firebase Auth accounts using the Firebase Console or Auth emulator.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-[#0d5943] rounded-xl p-6 border border-[#1a8a68]/30">
          <h2 className="text-lg font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/admin/notifications')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Notifications
            </button>
            <button
              onClick={() => navigate('/admin/schedule')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Schedule
            </button>
            <button
              onClick={() => navigate('/admin/rosters')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Rosters
            </button>
            <button
              onClick={() => navigate('/admin/game-results')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Game Results
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white/5 rounded-lg p-3 text-center">
    <Icon className={`${color} mx-auto mb-1`} size={20} />
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-white/60">{label}</p>
  </div>
);

export default SampleDataPage;
