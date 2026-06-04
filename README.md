<div align="center">

# 🌙 Hoyolab Auto Daily

**Automated HoYoLAB check-in and Genshin code redemption — powered by GitHub Actions**

No servers · No dependencies · Fork and run

<br>

[![License](https://img.shields.io/github/license/sglkc/hoyolab-auto-daily?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](.nvmrc)
[![Dependencies](https://img.shields.io/badge/dependencies-zero-success?style=flat-square)](package.json)

<br>

[![Daily check in](https://github.com/ishusinghse/hoyolab-auto-daily/actions/workflows/check-in.yml/badge.svg)](../../actions/workflows/check-in.yml)
[![Redeem codes](https://github.com/ishusinghse/hoyolab-auto-daily/actions/workflows/redeem.yml/badge.svg)](../../actions/workflows/redeem.yml)
[![Latest version](https://github.com/ishusinghse/hoyolab-auto-daily/actions/workflows/version.yml/badge.svg)](../../actions/workflows/version.yml)

<br>

[**Fork**](https://github.com/sglkc/hoyolab-auto-daily/fork) · [**Setup guide**](docs/setup.md) · [**Redeemed codes**](docs/redeem-codes.md)

</div>

---

## What it does

Two workflows run on a schedule (and on demand):


- Check in on [HoYoLAB](https://www.hoyolab.com/) for Genshin, ZZZ, HSR, HI3, and TOT
- Redeem new Genshin promo codes when `GIFT_COOKIE` is set
- Optionally notify [Discord](docs/discord.md)
- Track redeemed codes in [`redeem-state.json`](redeem-state.json) → [dashboard](docs/redeem-codes.md)

---

## Quick setup

| Step | Action |
| :--: | --- |
| 1 | [**Fork**](https://github.com/sglkc/hoyolab-auto-daily/fork) this repo |
| 2 | Add secret **`COOKIE`** (`ltuid_v2` + `ltoken_v2`) |
| 3 | Add variable **`GAMES`** (e.g. `gi zzz hsr`) |
| 4 | [**Run check-in**](../../actions/workflows/check-in.yml) and [**redeem**](../../actions/workflows/redeem.yml) once each (optional) |

Optional: `GIFT_COOKIE`, `DISCORD_WEBHOOK` — see [**setup guide**](docs/setup.md).

---

## Documentation

| Guide | Description |
| --- | --- |
| [Setup](docs/setup.md) | GitHub Actions, secrets, first run |
| [Cookies](docs/cookies.md) | `COOKIE` and `GIFT_COOKIE` |
| [Local development](docs/local-development.md) | `.env`, npm scripts, testing |
| [Discord](docs/discord.md) | Webhook notifications |
| [Redeemed codes](docs/redeem-codes.md) | Dashboard from `redeem-state.json` |

---

## Local development

```bash
cp .env.example .env
npm run validate && npm run validate-cookies
npm start          # full run
npm test           # unit tests
```

Details: [local-development.md](docs/local-development.md)

---

## Project layout

```text
src/              # core application
  index.js        # check-in + daily orchestration
  redeem.js       # Genshin code redemption
  daily-report.js # Discord report image (canvas)
  discord-notify.js
  logger.js
  check-in-status.js
  report-fonts.js

redeem-state.json # redemption history (committed by redeem workflow)
assets/           # report template + fonts (local)
scripts/          # CLI helpers (run-local, validate, preview)
docs/             # guides + redeem dashboard

.github/workflows/  # check-in.yml + redeem.yml + test.yml
test/             # unit tests
coverage/         # local test coverage + planning notes
```

---

<div align="center">

MIT © [sglkc](https://github.com/sglkc) · Not affiliated with HoYoverse

</div>
