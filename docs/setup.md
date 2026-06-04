# Setup Guide

Everything you need to run Hoyolab Auto Daily on GitHub Actions or locally.

## Documentation

| Guide | Description |
| --- | --- |
| [Cookies](cookies.md) | `COOKIE` and `GIFT_COOKIE` |
| [Discord](discord.md) | Webhook notifications |
| [Local development](local-development.md) | `.env`, npm scripts, `DRY_RUN` |
| [Redeemed codes](redeem-codes.md) | Dashboard from `redeem-state.json` |

---

## GitHub Actions setup

### Prerequisites

- A [GitHub](https://github.com) account
- A [HoYoLAB](https://www.hoyolab.com/home) account with games linked
- Cookies from your browser — see [cookie guide](cookies.md)

### 1. Fork the repository

[Fork this repo](https://github.com/sglkc/hoyolab-auto-daily/fork) to your account.

### 2. Add `COOKIE` secret

1. Fork → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `COOKIE`
4. Value: `ltuid_v2=...; ltoken_v2=...` — [how to get cookies](cookies.md)

One line per account for multiple accounts.

### 3. Add `GAMES` variable

1. **Variables** tab → **New repository variable**
2. Name: `GAMES`
3. Value: space-separated codes, e.g. `gi zzz hsr`

| Code | Game |
| --- | --- |
| `gi` | Genshin Impact |
| `zzz` | Zenless Zone Zero |
| `hsr` | Honkai: Star Rail |
| `hi3` | Honkai Impact 3rd |
| `tot` | Tears of Themis |

Include `gi` if you want automatic Genshin code redemption.

### 4. Run the workflows

1. [Actions → Daily check in](../.github/workflows/check-in.yml) → **Run workflow**
2. [Actions → Redeem codes](../.github/workflows/redeem.yml) → **Run workflow** (needs `GIFT_COOKIE` for redemption)
3. Wait ~15–25 seconds per run

The README workflow badges should pass.

### Optional secrets

| Name | Purpose |
| --- | --- |
| `GIFT_COOKIE` | Auto-redeem Genshin codes — [cookie guide](cookies.md#gift_cookie) |
| `DISCORD_WEBHOOK` | Post results to Discord — [Discord setup](discord.md) |
| `DISCORD_USER` | Mention your Discord user ID |

### Multiple accounts

Use one line per account in each secret/variable, in the **same order**:

```text
COOKIE line 1 / line 2
GAMES line 1 / line 2
GIFT_COOKIE line 1 / line 2   # optional
```

### Sync upstream

On your fork: **Sync fork** → **Update branch**.

<p align="center">
  <img src="https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/08c10262-8a97-433b-b499-143cc116184d" alt="Sync fork" width="500" />
</p>

---

## Local development

See [local-development.md](local-development.md) for `.env` setup, all npm commands, `DRY_RUN`, and local state files.

Quick start:

```bash
cp .env.example .env
npm run validate && npm run validate-cookies && npm test
```

---

## Redeemed codes

After redemptions, see [redeem-codes.md](redeem-codes.md). Regenerate with `npm run docs:generate`.
