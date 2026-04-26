import { spawnSync } from 'node:child_process';

const deployedDefaults = {
  LIVE_BASE_URL: 'https://goodwinjason1-ops.github.io',
  LIVE_BASE_PATH: '/sixth-man-codex-supabase'
};

const args = process.argv.slice(2);
const useDeployedDefaults = args.includes('--deployed');
const showHelp = args.includes('--help') || args.includes('-h');
const forwardedArgs = args.filter((arg) => arg !== '--deployed' && arg !== '--help' && arg !== '-h');

if (showHelp) {
  console.log(`
Run live Supabase Playwright smoke tests.

Usage:
  npm run qa:live
  npm run qa:live:deployed
  npm run qa:live -- --project=chromium

Required:
  LIVE_QA_PASSWORD

For deployed GitHub Pages QA, qa:live:deployed supplies:
  LIVE_BASE_URL=${deployedDefaults.LIVE_BASE_URL}
  LIVE_BASE_PATH=${deployedDefaults.LIVE_BASE_PATH}

For local/live-server QA without LIVE_BASE_URL, also set:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
`);
  process.exit(0);
}

const env = { ...process.env };

if (useDeployedDefaults) {
  env.LIVE_BASE_URL ||= deployedDefaults.LIVE_BASE_URL;
  env.LIVE_BASE_PATH ||= deployedDefaults.LIVE_BASE_PATH;
}

const missing = [];

if (!env.LIVE_QA_PASSWORD) {
  missing.push('LIVE_QA_PASSWORD');
}

if (!env.LIVE_BASE_URL) {
  if (!env.VITE_SUPABASE_URL) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!env.VITE_SUPABASE_ANON_KEY) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }
}

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('');
  console.error('Deployed GitHub Pages QA:');
  console.error('  $env:LIVE_QA_PASSWORD="<shared-qa-password>"');
  console.error('  npm run qa:live:deployed');
  console.error('');
  console.error('Custom live QA:');
  console.error('  $env:LIVE_BASE_URL="https://example.com"');
  console.error('  $env:LIVE_BASE_PATH="/optional-base-path"');
  console.error('  $env:LIVE_QA_PASSWORD="<shared-qa-password>"');
  console.error('  npm run qa:live');
  console.error('');
  console.error('Local dev-server QA with real Supabase config:');
  console.error('  $env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"');
  console.error('  $env:VITE_SUPABASE_ANON_KEY="<anon-key>"');
  console.error('  $env:LIVE_QA_PASSWORD="<shared-qa-password>"');
  console.error('  npm run qa:live');
  process.exit(1);
}

const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npx';
const commandArgs = [
  ...(process.platform === 'win32' ? ['/d', '/s', '/c', 'npx'] : []),
  'playwright',
  'test',
  '--config=playwright.live.config.js',
  'tests/live-supabase.spec.js',
  ...forwardedArgs
];

const result = spawnSync(
  command,
  commandArgs,
  {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    shell: false
  }
);

if (result.error) {
  console.error(`Unable to start live QA command: ${result.error.message}`);
}

process.exit(result.status ?? 1);
