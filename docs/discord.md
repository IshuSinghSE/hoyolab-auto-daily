# Discord Setup

Receive check-in and redemption summaries in a Discord channel.

## Create a webhook

1. Open your Discord channel → **Edit Channel**
2. **Integrations** → **Webhooks** → **Create Webhook**
3. Name and avatar (optional) → **Copy Webhook URL**

## Configure GitHub

1. Repository **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `DISCORD_WEBHOOK`
4. Value: your webhook URL (`https://discord.com/api/webhooks/...`)

### Optional: mention on notify

Add repository secret or variable:

- Name: `DISCORD_USER`
- Value: your Discord user ID

## Test locally

```bash
cp .env.example .env
# Set DISCORD_WEBHOOK in .env
# Set SKIP_DISCORD=0 (or remove SKIP_DISCORD)

npm run test-discord
```

Sends:

```text
(INFO) Test notification
(INFO) Discord integration working
(INFO) Hoyolab Auto Daily
```

## Production messages

Discord no longer receives console log dumps. Each run sends **one** message:

### Check-in only (no new codes)

```text
🎮 HoYoLAB Daily Check-In

✅ Genshin Impact: Checked in successfully

No new redemption codes found.
```

If you already checked in earlier today:

```text
✅ Genshin Impact: Already checked in today
```

### New codes redeemed

Short text plus a `daily-report.png` image (only codes and rewards from **this run**).

```text
🎁 New Genshin codes redeemed!

3 new code(s) were successfully redeemed.
```

Place `HYWenHei-Extended.ttf` in `assets/fonts/` for report typography — see [assets/fonts/README.md](../assets/fonts/README.md).

Preview a report locally:

```bash
npm run generate-report -- --codes NMI20MAJGIBP,YMYD76U85Z1U --primogems 80 --mora 10000 --lifetime 200
```

Use `SKIP_DISCORD=1` in `.env` for local runs without posting.

## GitHub Actions

- **Daily check-in** workflow: text-only Discord message (no `canvas` required).
- **Redeem codes** workflow: redemption only (check-in runs 30 minutes earlier). Posts Discord when new codes are redeemed; otherwise the daily check-in workflow sends the summary. Generates `daily-report.png` when new codes are redeemed.
- **Test** workflow: verifies unit tests and report generation on every push/PR.

Optional: copy `HYWenHei-Extended.ttf` into `assets/fonts/` on a self-hosted runner for exact in-game typography. GitHub-hosted runners use system font fallbacks.

## Screenshots

<details>
<summary>Discord webhook setup</summary>

![Channel settings](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/80f3b2f1-cc55-4316-9153-3fc5026b7da8)

![Create webhook](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/b4d0c07d-35a5-4382-99de-584c70c4d730)

![Copy URL](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/3df5b59c-edc9-4884-897c-9159e243598e)

</details>

[← Back to setup](setup.md)
