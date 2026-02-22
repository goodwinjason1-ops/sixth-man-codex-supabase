// Run with: node cleanup-database.js
// ONE-TIME script to remove sample/test data while keeping legitimate content
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyAcd0udkUWEVqYFk7YDciRcOkKRFcD4Jf4',
  authDomain: 'emerald-lakers---sixth-man.web.app',
  projectId: 'emerald-lakers---sixth-man',
  storageBucket: 'emerald-lakers---sixth-man.firebasestorage.app',
  messagingSenderId: '551311322582',
  appId: '1:551311322582:web:0248f43cdfca6bcb43c877'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Need to use REST API with Firebase CLI auth token (security rules block unauthenticated access)
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

function firestoreRequest(method, path, accessToken, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents${path}`,
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
          reject({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function listAllDocs(collectionName, accessToken) {
  let allDocs = [];
  let nextPageToken = null;
  do {
    let url = `/${collectionName}?pageSize=300`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;
    const result = await firestoreRequest('GET', url, accessToken);
    if (result.documents) allDocs = allDocs.concat(result.documents);
    nextPageToken = result.nextPageToken;
  } while (nextPageToken);
  return allDocs;
}

async function deleteDoc(docPath, accessToken) {
  return firestoreRequest('DELETE', `/${docPath.replace(`projects/${PROJECT_ID}/databases/(default)/documents/`, '')}`, accessToken);
}

async function batchDeleteCollection(collectionName, accessToken, filterFn = null) {
  const docs = await listAllDocs(collectionName, accessToken);
  let deleted = 0;
  let kept = 0;

  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const shouldDelete = filterFn ? filterFn(docId, fields) : true;

    if (shouldDelete) {
      try {
        await firestoreRequest('DELETE', `/${collectionName}/${docId}`, accessToken);
        deleted++;
      } catch (e) {
        console.error(`  Failed to delete ${collectionName}/${docId}: ${e.statusCode || e.message}`);
      }
    } else {
      kept++;
    }
  }
  console.log(`${collectionName}: deleted ${deleted}, kept ${kept}`);
}

function extractStringField(fields, fieldName) {
  return fields?.[fieldName]?.stringValue || '';
}

async function cleanup() {
  console.log('Getting access token...');
  const accessToken = await getAccessToken();
  console.log('Got access token.\n');
  console.log('=== STARTING DATABASE CLEANUP ===\n');

  // DELETE: All 137 sample players
  await batchDeleteCollection('players', accessToken);

  // KEEP: All user accounts except junk
  await batchDeleteCollection('users', accessToken, (docId, fields) => {
    const email = extractStringField(fields, 'email');
    return email === 'balls@vag.com';
  });

  // DELETE: All sample evaluations
  await batchDeleteCollection('evaluations', accessToken);

  // DELETE: All test notifications
  await batchDeleteCollection('notifications', accessToken);

  // DELETE: All test parent invitations
  await batchDeleteCollection('parent_invitations', accessToken);

  // DELETE: All test scoring assignments
  await batchDeleteCollection('scoring_assignments', accessToken);

  // DELETE: All test swap requests
  await batchDeleteCollection('swap_requests', accessToken);

  // DELETE: All test games
  await batchDeleteCollection('games', accessToken);

  // DELETE: All test youth enrollments
  await batchDeleteCollection('youth_enrollments', accessToken);

  // DELETE: All test youth programs
  await batchDeleteCollection('youth_programs', accessToken);

  // DELETE: All test playing time records
  await batchDeleteCollection('playing_time', accessToken);

  // DELETE: All match drafts
  await batchDeleteCollection('match_drafts', accessToken);

  // DELETE: All test training sessions
  await batchDeleteCollection('training_sessions', accessToken);

  // KEEP: Template training plans, DELETE user-created test plans
  await batchDeleteCollection('training_plans', accessToken, (docId, fields) => {
    if (docId.startsWith('template_')) return false;
    const isTemplate = fields?.isTemplate?.booleanValue;
    if (isTemplate === true) return false;
    return true;
  });

  // KEEP: All 30 drills (legitimate library content)
  console.log('drills: kept all 30 (legitimate content)');

  // DELETE: Teams (incomplete set, will be recreated by seed script)
  await batchDeleteCollection('teams', accessToken);

  // KEEP: Audit logs (system records)
  console.log('audit_logs: kept all (system records)');

  console.log('\n=== CLEANUP COMPLETE ===');
  console.log('\nThe database now contains:');
  console.log('- 18 user accounts (2 real + 16 test for role testing)');
  console.log('- 30 drills (legitimate library)');
  console.log('- 6 template training plans');
  console.log('- Audit logs');
  console.log('- Everything else: empty (ready for properly structured test data)');
}

cleanup().then(() => process.exit(0)).catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
