// Run with: node fix-team-assignments.js
// Fixes team coach assignments and assigns team manager to U10
const https = require('https');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'emerald-lakers---sixth-man';
const COACH_UID = 'BYdl6smeKUb3AbOfMKLZ74BU6YD3'; // coach@test.com

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
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
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

async function patchFields(collection, docId, fieldsObj, accessToken) {
  const fields = {};
  for (const [k, v] of Object.entries(fieldsObj)) {
    fields[k] = toFirestoreValue(v);
  }
  const fieldPaths = Object.keys(fieldsObj).map(k => `updateMask.fieldPaths=${k}`).join('&');
  return firestoreRequest('PATCH', `${collection}/${docId}?${fieldPaths}`, accessToken, { fields });
}

async function deleteField(collection, docId, fieldName, accessToken) {
  // To delete a field via REST, we use a special transform
  const fieldPaths = `updateMask.fieldPaths=${fieldName}`;
  // PATCH with the field in the mask but NOT in the body effectively deletes it
  return firestoreRequest('PATCH', `${collection}/${docId}?${fieldPaths}`, accessToken, { fields: {} });
}

async function listDocs(collection, accessToken) {
  let allDocs = [];
  let nextPageToken = null;
  do {
    let url = `${collection}?pageSize=300`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;
    const result = await firestoreRequest('GET', url, accessToken);
    if (result.documents) allDocs = allDocs.concat(result.documents);
    nextPageToken = result.nextPageToken;
  } while (nextPageToken);
  return allDocs;
}

function extractValue(field) {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.arrayValue) return (field.arrayValue.values || []).map(extractValue);
  if (field.nullValue !== undefined) return null;
  return null;
}

async function fix() {
  console.log('Getting access token...');
  const accessToken = await getAccessToken();
  console.log('Got access token.\n');

  // ========================================
  // STEP 1: Find all coach users (check for duplicates)
  // ========================================
  console.log('=== STEP 1: Check for duplicate coaches ===');
  const users = await listDocs('users', accessToken);
  const coaches = [];
  let managerUid = null;

  for (const doc of users) {
    const docId = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const role = extractValue(fields.role);
    const email = extractValue(fields.email);
    const displayName = extractValue(fields.displayName);

    if (role === 'coach') {
      coaches.push({ id: docId, email, displayName });
      console.log(`  Coach: ${docId} - ${email} - "${displayName}"`);
    }
    if (role === 'team_manager') {
      managerUid = docId;
      console.log(`  Team Manager: ${docId} - ${email} - "${displayName}"`);
    }
  }

  if (coaches.length > 1) {
    console.log(`\n  WARNING: ${coaches.length} coach accounts found!`);
    console.log('  Keeping all for now — admin should review if any are duplicates.\n');
  }

  // ========================================
  // STEP 2: Fix team coach assignments — only U10 and U12
  // ========================================
  console.log('\n=== STEP 2: Fix team coach assignments ===');

  // Set coach on U10 and U12
  await patchFields('teams', 'lakers-u10-boys', { coachId: COACH_UID }, accessToken);
  console.log('  lakers-u10-boys: coachId set to coach@test.com');

  await patchFields('teams', 'lakers-u12-boys', { coachId: COACH_UID }, accessToken);
  console.log('  lakers-u12-boys: coachId set to coach@test.com');

  // Remove coach from other teams (set to null)
  const otherTeams = ['lakers-u8-mixed', 'lakers-u14-girls', 'lakers-u16-boys', 'lakers-u19-boys'];
  for (const teamId of otherTeams) {
    await deleteField('teams', teamId, 'coachId', accessToken);
    await deleteField('teams', teamId, 'coachName', accessToken);
    console.log(`  ${teamId}: coachId removed`);
  }

  // ========================================
  // STEP 3: Fix coach's user document
  // ========================================
  console.log('\n=== STEP 3: Fix coach user document ===');
  await patchFields('users', COACH_UID, {
    assignedTeams: ['lakers-u10-boys', 'lakers-u12-boys'],
    teamIds: ['lakers-u10-boys', 'lakers-u12-boys']
  }, accessToken);
  console.log(`  Coach ${COACH_UID}: assignedTeams set to [u10, u12]`);

  // ========================================
  // STEP 4: Assign team manager to U10
  // ========================================
  console.log('\n=== STEP 4: Assign team manager ===');
  if (managerUid) {
    await patchFields('users', managerUid, {
      assignedTeams: ['lakers-u10-boys'],
      teamIds: ['lakers-u10-boys']
    }, accessToken);
    console.log(`  Manager ${managerUid}: assignedTeams set to [u10]`);

    await patchFields('teams', 'lakers-u10-boys', { managerId: managerUid }, accessToken);
    console.log(`  lakers-u10-boys: managerId set to ${managerUid}`);
  } else {
    console.log('  WARNING: No team_manager user found! Create one first.');
  }

  console.log('\n=== FIX COMPLETE ===');
  console.log('- Coach assigned to U10 + U12 only');
  console.log('- Other 4 teams have no coach');
  console.log('- Coach user doc updated with assignedTeams');
  if (managerUid) console.log('- Team manager assigned to U10');
}

fix().then(() => process.exit(0)).catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
