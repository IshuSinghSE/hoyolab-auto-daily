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

After each workflow run, messages may include:

```text
(INFO) GI: Successfully checked in!
(INFO) GENSHIN: Redeemed PSCA8NL4ZSPD
(INFO) GENSHIN: +60 Primogems
```

Use `SKIP_DISCORD=1` in `.env` for local runs without posting.

## Screenshots

<details>
<summary>Discord webhook setup</summary>

![Channel settings](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/80f3b2f1-cc55-4316-9153-3fc5026b7da8)

![Create webhook](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/b4d0c07d-35a5-4382-99de-584c70c4d730)

![Copy URL](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/3df5b59c-edc9-4884-897c-9159e243598e)

</details>

[← Back to setup](setup.md)
