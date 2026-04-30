# Deno Edge Test Verification

Date: 2026-04-30

The local shell still does not have `deno` on PATH, so the Edge Function tests cannot be run locally from this Codex session.

## Local Check

`Get-Command deno` and `where.exe deno` returned no executable path.

## Repo Fix

A GitHub Actions workflow now runs the Supabase Edge Function tests with Deno:

- `.github/workflows/edge-function-tests.yml`

The workflow installs Deno with `denoland/setup-deno@v2` and runs:

```bash
deno test --allow-net=deno.land,esm.sh \
  supabase/functions/video-job-worker/index.test.ts \
  supabase/functions/voice-transcription/index.test.ts
```

The repo also includes a minimal `deno.json` with `nodeModulesDir` set to `auto` so Deno 2 can resolve npm type shims needed by the Supabase Edge Function test graph in GitHub Actions.

## Optional Local Fix

Install Deno locally if you want Codex to run these tests directly on this machine:

```powershell
winget install DenoLand.Deno
```

After installing, reopen the shell or Codex terminal and run:

```powershell
deno --version
deno test --allow-net=deno.land,esm.sh `
  .\supabase\functions\video-job-worker\index.test.ts `
  .\supabase\functions\voice-transcription\index.test.ts
```

Installing software is a local machine change, so Codex should ask for explicit approval before doing it.
