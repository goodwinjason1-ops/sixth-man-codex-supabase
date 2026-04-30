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

After installing, close and reopen PowerShell and Codex, then run:

```powershell
deno --version
```

If that prints a Deno version, run the Edge Function tests:

```powershell
deno test --allow-net=deno.land,esm.sh `
  .\supabase\functions\video-job-worker\index.test.ts `
  .\supabase\functions\voice-transcription\index.test.ts
```

PowerShell line continuations must use a backtick as the final character on the line. Do not put a space after the backtick.

One-line alternative:

```powershell
deno test --allow-net=deno.land,esm.sh .\supabase\functions\video-job-worker\index.test.ts .\supabase\functions\voice-transcription\index.test.ts
```

## Windows Troubleshooting

If `winget` says Deno is already installed but `deno --version` still fails:

1. Close every PowerShell window and reopen PowerShell.
2. Close and reopen Codex so its integrated terminal receives the updated PATH.
3. Run:

```powershell
Get-Command deno
where.exe deno
```

If neither command finds Deno, check common install locations:

```powershell
Test-Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\DenoLand.Deno_Microsoft.Winget.Source_8wekyb3d8bbwe\deno.exe"
Test-Path "$env:USERPROFILE\.deno\bin\deno.exe"
```

If one of those returns `True`, add that folder to the user PATH from Windows Settings, or use the full executable path temporarily:

```powershell
& "$env:USERPROFILE\.deno\bin\deno.exe" --version
```

If the command still fails after Deno is visible on PATH, copy the exact PowerShell error into this thread. The most common remaining cause is command formatting, especially a trailing space after a PowerShell backtick.

## Verification Source Of Truth

Until local Deno works on this machine, GitHub Actions is the authoritative verification for these Edge Function tests. The `Edge Function Tests` workflow installs Deno in a clean runner and executes the same test files, so a passing workflow means the repo-level Deno test path is healthy even if this Windows shell still needs PATH repair.

Installing software is a local machine change, so Codex should ask for explicit approval before doing it.
