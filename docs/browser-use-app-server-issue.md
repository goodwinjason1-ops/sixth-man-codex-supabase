# Browser Use App-Server Issue

Date: 2026-04-30

Browser Use still initializes through the Node REPL, but browser navigation fails when it tries to start the local app-server.

## Observed Error

```text
failed to start codex app-server: The system cannot find the path specified. (os error 3)
```

## Diagnostics Run

- Browser Use plugin cache folder exists:
  - `C:\Users\Kidsg\.codex\plugins\cache\openai-bundled\browser-use\0.1.0-alpha1`
- Required visible Browser client entry point exists:
  - `scripts\browser-client.mjs`
- The Browser Use Node REPL bootstrap succeeds.
- Failure happens on the first real browser operation, such as `tab.goto(...)`.
- Rechecked this on 2026-04-30 by bootstrapping the `iab` backend and navigating to `https://example.com/`; the same app-server path error still occurs.
- The installed Codex app package checked at:
  - `C:\Program Files\WindowsApps\OpenAI.Codex_26.422.9565.0_x64__2p2nqsd0c76g0`
- No file matching `*app-server*` was found in that installed Codex app package.

## Current Root-Cause Hypothesis

The Browser Use plugin cache itself is present, but the Codex desktop app package currently available to this Windows session does not contain the app-server executable/path that Browser Use expects to launch.

This looks like a Codex desktop/plugin packaging or install-state issue rather than a project-code issue.

## Recommended Next Steps

1. Restart Codex after the latest update completes.
2. If still failing, refresh only the Browser Use plugin cache folder again:

   ```powershell
   Rename-Item `
     -LiteralPath "C:\Users\Kidsg\.codex\plugins\cache\openai-bundled\browser-use\0.1.0-alpha1" `
     -NewName "0.1.0-alpha1.backup-$(Get-Date -Format yyyyMMddHHmmss)"
   ```

3. Reopen Codex and trigger `@browser-use health check`.
4. If it still fails, reinstall or repair the Codex desktop app because the app package appears to be missing the app-server component.

## Workaround

Until Browser Use is healthy, use:

- Local shell commands for builds/tests.
- Playwright CLI/tests for app browser QA where possible.
- Google Drive/Gmail connectors for account-backed Docs/Sheets/drafts.

Do not rely on Browser Use for critical deployment verification until a `tab.goto(...)` smoke test succeeds.
