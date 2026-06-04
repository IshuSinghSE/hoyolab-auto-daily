# Local Development

Run and debug automation on your machine before using GitHub Actions.

**Requirements:** [Node.js 20+](../.nvmrc)

## Quick start

```bash
cp .env.example .env
# Edit .env with your cookies

npm run validate
npm run validate-cookies
npm test
```

## Environment file

| Variable | Purpose |
| --- | --- |
| `COOKIE` | Check-in cookies |
| `GAMES` | Games to check in |
| `GIFT_COOKIE` | Optional redemption cookies |
| `DISCORD_WEBHOOK` | Optional notifications |
| `SKIP_DISCORD=1` | Skip Discord while testing |
| `REDEEM_STATE_PATH` | Local state file (default: `redeem-state.local.json`) |
| `DRY_RUN=1` | Preview without API calls or state changes |

`.env` is gitignored.

## Commands

```bash
npm start                 # Full run (check-in + redeem + Discord)
npm run check-in          # Check-in only
npm run redeem            # Redemption only
npm run validate          # Check env vars
npm run validate-cookies  # Validate cookie fields
npm run codes             # List active Genshin codes
npm run stats             # Redemption totals from state file
npm run test-discord      # Send test webhook
npm run docs:generate     # Regenerate docs/redeem-codes.md
npm test                  # Unit tests
npm run test:smoke-report # Generate sample daily-report.png (CI smoke test)
npm run generate-report   # Preview report layout locally
```

## GitHub Actions

| Workflow | What it runs |
| --- | --- |
| [test.yml](../.github/workflows/test.yml) | `npm test` + report image smoke test on every push/PR |
| [check-in.yml](../.github/workflows/check-in.yml) | Check-in + simple Discord text |
| [redeem.yml](../.github/workflows/redeem.yml) | Check-in + redeem + Discord report image when new codes are redeemed |

The redeem job installs `canvas` system libraries and runs `node scripts/run-local.js all` so check-in status on the report image is accurate.

## DRY_RUN

Preview actions without side effects:

```bash
DRY_RUN=1 npm start
```

- Prints games that would check in
- Lists codes that would redeem + rewards
- No state file updates
- No Discord

## Separate local state

In `.env`:

```text
REDEEM_STATE_PATH=redeem-state.local.json
```

Keeps `redeem-state.json` (used by Actions) unchanged on your machine.

## Generate documentation

After local redemptions:

```bash
npm run docs:generate
```

Updates [redeem-codes.md](redeem-codes.md) from `redeem-state.json`.

## Coverage

Test coverage output is written under `coverage/` when you run coverage locally. That folder is gitignored except for [coverage/todo.md](../coverage/todo.md) planning notes.

[← Back to setup](setup.md)
