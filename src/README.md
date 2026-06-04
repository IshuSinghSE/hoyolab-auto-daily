# Source

Core application modules for HoYoLAB check-in, Genshin redemption, and Discord reports.

| Module | Role |
| --- | --- |
| `index.js` | Daily orchestration (check-in → redeem → Discord) |
| `redeem.js` | Code fetch, redemption API, `redeem-state.json` |
| `daily-report.js` | Canvas report image from `assets/template.png` |
| `discord-notify.js` | Discord webhook (text or image) |
| `check-in-status.js` | Check-in status labels for report + Discord |
| `report-fonts.js` | HYWenHei registration and font stack |
| `logger.js` | Console logging |

Entry points: `npm start` or `node scripts/run-local.js`.
