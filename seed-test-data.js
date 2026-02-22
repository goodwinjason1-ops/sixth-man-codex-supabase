// Run with: node seed-test-data.js
// Seeds properly structured test data after database cleanup
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'emerald-lakers---sixth-man';

async function getAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI config not found. Run: firebase login');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) throw new Error('No refresh token found');

  const tokenData = await new Promise((resolve, reject) => {
    const postData = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}&client_id=563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com&client_secret=j9iVZfS8kkCEFUPaAeJV0sAi`;
    const opts = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
  return tokenData.access_token;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(val);
  }
  return { fields };
}

function firestoreRequest(method, docPath, accessToken, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`,
      method,
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject({ statusCode: res.statusCode, body: data, path: docPath });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function setDoc(collectionName, docId, data, accessToken) {
  const docBody = toFirestoreDoc(data);
  // PATCH with updateMask to create or overwrite
  const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
  return firestoreRequest('PATCH', `${collectionName}/${docId}?${fieldPaths}`, accessToken, docBody);
}

async function mergeDoc(collectionName, docId, data, accessToken) {
  const docBody = toFirestoreDoc(data);
  const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
  return firestoreRequest('PATCH', `${collectionName}/${docId}?${fieldPaths}`, accessToken, docBody);
}

async function seed() {
  console.log('Getting access token...');
  const accessToken = await getAccessToken();
  console.log('Got access token.\n');
  console.log('=== SEEDING TEST DATA ===\n');

  // Correct UIDs from the audit (verified from Firestore)
  const COACH_UID = 'BYdl6smeKUb3AbOfMKLZ74BU6YD3';  // coach@test.com
  const PARENT_UID = 'TUfVvbWnBqMUUSZb0poq43AhAvU2';  // parent@test.com
  const ADMIN_UID = 'GQRSZA4ueVPQGFjPMPCHXq4eEZu1';   // admin@test.com

  // ========================================
  // TEAMS (6 teams)
  // ========================================
  const teams = [
    { id: 'lakers-u8-mixed', name: 'Lakers U8', displayName: 'Lakers U8 Mixed', ageGroup: 'u8', gender: 'mixed', program: 'competitive', coachId: COACH_UID, season: '2025' },
    { id: 'lakers-u10-boys', name: 'Lakers U10', displayName: 'Lakers U10 Boys', ageGroup: 'u10', gender: 'boys', program: 'competitive', coachId: COACH_UID, season: '2025' },
    { id: 'lakers-u12-boys', name: 'Lakers U12', displayName: 'Lakers U12 Boys', ageGroup: 'u12', gender: 'boys', program: 'competitive', coachId: COACH_UID, season: '2025' },
    { id: 'lakers-u14-girls', name: 'Lakers U14 Girls', displayName: 'Lakers U14 Girls', ageGroup: 'u14', gender: 'girls', program: 'competitive', coachId: COACH_UID, season: '2025' },
    { id: 'lakers-u16-boys', name: 'Lakers U16', displayName: 'Lakers U16 Boys', ageGroup: 'u16', gender: 'boys', program: 'competitive', coachId: COACH_UID, season: '2025' },
    { id: 'lakers-u19-boys', name: 'Lakers U19', displayName: 'Lakers U19 Boys', ageGroup: 'u19', gender: 'boys', program: 'competitive', coachId: COACH_UID, season: '2025' },
  ];

  for (const team of teams) {
    const { id, ...data } = team;
    await setDoc('teams', id, { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, accessToken);
  }
  console.log(`Created ${teams.length} teams`);

  // ========================================
  // PLAYERS (10 per team = 60 total, realistic Australian names)
  // ========================================
  const playersByTeam = {
    'lakers-u8-mixed': [
      'Zoe Murphy', 'Ruby Cook', 'Ella Morgan', 'Mateo Bell', 'Aiden Howard',
      'Lily Ward', 'Owen Cox', 'Levi Richardson', 'Harper Wood', 'Aria James'
    ],
    'lakers-u10-boys': [
      'Liam Mitchell', 'Noah Cooper', 'Oliver Singh', 'Jack Williams', 'Thomas Brown',
      'Henry Davis', 'James Wilson', 'William Taylor', 'Lucas Anderson', 'Ethan Clarke'
    ],
    'lakers-u12-boys': [
      'Charlie Martin', 'Leo Thompson', 'Oscar White', 'Archie Harris', 'George Lewis',
      'Harry Robinson', 'Alexander Walker', 'Daniel Hall', 'Sebastian Young', 'Max Allen'
    ],
    'lakers-u14-girls': [
      'Charlotte Green', 'Amelia King', 'Isla Wright', 'Mia Scott', 'Olivia Adams',
      'Ava Baker', 'Grace Nelson', 'Chloe Hill', 'Sophie Moore', 'Emily Clark'
    ],
    'lakers-u16-boys': [
      'Mason Turner', 'Logan Phillips', 'Jayden Campbell', 'Riley Parker', 'Cooper Evans',
      'Kai Edwards', 'Hunter Collins', 'Finn Stewart', 'Ashton Morris', 'Blake Rogers'
    ],
    'lakers-u19-boys': [
      'Dylan Brooks', 'Jaxon Gray', 'Caleb Hughes', 'Nate Price', 'Tyler Bennett',
      'Ryan Foster', 'Jordan Russell', 'Lachlan Henderson', 'Mitchell Coleman', 'Angus Patterson'
    ],
  };

  let totalPlayers = 0;
  for (const [teamId, names] of Object.entries(playersByTeam)) {
    const team = teams.find(t => t.id === teamId);
    for (const fullName of names) {
      const parts = fullName.split(' ');
      const firstName = parts[0];
      const lastName = parts[1];
      const playerId = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${teamId}`;

      await setDoc('players', playerId, {
        name: fullName,
        firstName,
        lastName,
        teamId: teamId,
        ageGroup: team.ageGroup,
        gender: team.gender,
        teamIds: [teamId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'seed-script'
      }, accessToken);
      totalPlayers++;
    }
  }
  console.log(`Created ${totalPlayers} players`);

  // ========================================
  // LINK TEST PARENT TO A PLAYER
  // ========================================
  const parentChildId = 'liam-mitchell-lakers-u10-boys';
  await mergeDoc('users', PARENT_UID, {
    children: [parentChildId]
  }, accessToken);
  console.log(`Linked parent@test.com (${PARENT_UID}) to player: Liam Mitchell (U10)`);

  // ========================================
  // UPDATE COACH TEST ACCOUNT WITH TEAM ASSIGNMENTS
  // ========================================
  await mergeDoc('users', COACH_UID, {
    teamIds: ['lakers-u10-boys', 'lakers-u12-boys'],
    assignedTeams: ['lakers-u10-boys', 'lakers-u12-boys']
  }, accessToken);
  console.log(`Assigned coach@test.com (${COACH_UID}) to: U10 Boys, U12 Boys`);

  // ========================================
  // SCHEDULE (upcoming games and training for U10 and U12)
  // ========================================
  const now = new Date();
  const scheduleItems = [
    {
      id: 'game-u10-1',
      teamId: 'lakers-u10-boys',
      type: 'game',
      date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      time: '9:00 AM',
      venue: 'Emerald Community Stadium',
      opponent: 'Western Warriors',
      notes: 'Round 3'
    },
    {
      id: 'training-u10-1',
      teamId: 'lakers-u10-boys',
      type: 'training',
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      time: '5:00 PM',
      venue: 'Emerald Community Stadium',
      notes: 'Focus on ball handling'
    },
    {
      id: 'game-u12-1',
      teamId: 'lakers-u12-boys',
      type: 'game',
      date: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      time: '10:30 AM',
      venue: 'Emerald Community Stadium',
      opponent: 'Eastern Eagles',
      notes: 'Round 3'
    },
    {
      id: 'training-u12-1',
      teamId: 'lakers-u12-boys',
      type: 'training',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      time: '5:30 PM',
      venue: 'Emerald Community Stadium',
      notes: 'Defense drills'
    },
  ];

  for (const item of scheduleItems) {
    const { id, ...data } = item;
    await setDoc('schedule', id, { ...data, createdAt: new Date().toISOString(), createdBy: 'seed-script' }, accessToken);
  }
  console.log(`Created ${scheduleItems.length} schedule items`);

  console.log('\n=== SEED COMPLETE ===');
  console.log('\nDatabase now has:');
  console.log('- 6 teams (U8 mixed, U10 boys, U12 boys, U14 girls, U16 boys, U19 boys)');
  console.log('- 60 players (10 per team, realistic Australian names)');
  console.log('- 4 schedule items (2 games, 2 training sessions)');
  console.log('- Parent linked to Liam Mitchell (U10)');
  console.log('- Coach assigned to U10 + U12');
  console.log('- 30 drills (kept from before)');
  console.log('- 6 template training plans (kept from before)');
}

seed().then(() => process.exit(0)).catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
