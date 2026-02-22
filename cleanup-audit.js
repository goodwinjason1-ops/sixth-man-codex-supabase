// Run with: node cleanup-audit.js
// Uses Firebase REST API with Firebase CLI auth token to bypass security rules
const { execSync } = require('child_process');
const https = require('https');

const PROJECT_ID = 'emerald-lakers---sixth-man';

// Get auth token from Firebase CLI
function getAccessToken() {
  try {
    const token = execSync('firebase login:ci --no-localhost 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
    // Actually, let's use the simpler approach - get token via firebase CLI
    const result = execSync('npx firebase-tools login:use 2>&1', { encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    return null;
  }
}

function fetchCollection(collectionId, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionId}?pageSize=300`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function extractValue(valueObj) {
  if (!valueObj) return '';
  if (valueObj.stringValue !== undefined) return valueObj.stringValue;
  if (valueObj.integerValue !== undefined) return valueObj.integerValue;
  if (valueObj.doubleValue !== undefined) return valueObj.doubleValue;
  if (valueObj.booleanValue !== undefined) return valueObj.booleanValue;
  if (valueObj.timestampValue !== undefined) return valueObj.timestampValue;
  if (valueObj.arrayValue) return JSON.stringify(valueObj.arrayValue.values?.map(extractValue) || []);
  if (valueObj.mapValue) return '{map}';
  if (valueObj.nullValue !== undefined) return null;
  return JSON.stringify(valueObj);
}

async function audit() {
  // Get access token from gcloud or firebase
  console.log('Getting access token...');
  let accessToken;
  try {
    accessToken = execSync('gcloud auth print-access-token 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch (e) {
    // Try firebase approach - use the token from firebase CLI config
    try {
      // On Windows, Firebase CLI stores tokens in the user's config
      const os = require('os');
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const refreshToken = config.tokens?.refresh_token;
        if (refreshToken) {
          // Exchange refresh token for access token
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
          accessToken = tokenData.access_token;
        }
      }
    } catch (e2) {
      console.error('Could not get access token:', e2.message);
      process.exit(1);
    }
  }

  if (!accessToken) {
    console.error('No access token available. Run: firebase login');
    process.exit(1);
  }
  console.log('Got access token, querying Firestore...\n');

  const collections = [
    'players', 'teams', 'users', 'evaluations', 'match_assessments',
    'tryout_assessments', 'training_plans', 'drills', 'training_sessions',
    'development_plans', 'notifications', 'parent_invitations',
    'scoring_assignments', 'swap_requests', 'schedule', 'games',
    'youth_programs', 'youth_enrollments', 'player_achievements',
    'playing_time', 'match_drafts', 'audit_logs'
  ];

  for (const col of collections) {
    try {
      const result = await fetchCollection(col, accessToken);
      const docs = result.documents || [];
      console.log(`\n=== ${col}: ${docs.length} documents ===`);
      for (const doc of docs) {
        const docId = doc.name.split('/').pop();
        const fields = doc.fields || {};
        const summary = {
          id: docId,
          name: extractValue(fields.name) || extractValue(fields.displayName) || extractValue(fields.playerName) || extractValue(fields.title) || '',
          email: extractValue(fields.email) || '',
          role: extractValue(fields.role) || '',
          teamId: extractValue(fields.teamId) || '',
          createdBy: extractValue(fields.createdBy) || extractValue(fields.coachId) || '',
          status: extractValue(fields.status) || '',
        };
        console.log(`  ${docId}: ${JSON.stringify(summary)}`);
      }
    } catch (e) {
      if (e.statusCode === 404) {
        console.log(`\n=== ${col}: 0 documents (collection doesn't exist) ===`);
      } else {
        console.log(`\n=== ${col}: ERROR (${e.statusCode || e.message}) ===`);
      }
    }
  }
}

audit().then(() => process.exit(0));
