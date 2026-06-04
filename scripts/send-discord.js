#!/usr/bin/env node

/**
 * Standalone Discord webhook tester — tweak messages/images locally without running the app.
 *
 * Usage:
 *   node --env-file=.env scripts/send-discord.js --message "Hello"
 *   node --env-file=.env scripts/send-discord.js --message "Check this" --image ./screenshot.png
 *   node scripts/send-discord.js --webhook URL --user 123 --message "test"
 *
 * Env (optional): DISCORD_WEBHOOK, DISCORD_USER
 */

import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

function usage() {
  console.log(`Usage: send-discord.js [options]

Options:
  --webhook <url>   Discord webhook URL (or set DISCORD_WEBHOOK)
  --user <id>       Discord user ID to mention (or set DISCORD_USER)
  --message <text>  Message body (supports Discord markdown)
  --image <path>    Image file to attach (png, jpg, gif, webp)
  --help            Show this help

Examples:
  node --env-file=.env scripts/send-discord.js --message "Test notification"
  node --env-file=.env scripts/send-discord.js --message "Reward summary" --image ./reward.png
`)
}

function parseArgs(argv) {
  const options = {
    webhook: process.env.DISCORD_WEBHOOK?.trim() || '',
    user: process.env.DISCORD_USER?.trim() || '',
    message: '',
    image: '',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]

    switch (arg) {
      case '--help':
      case '-h':
        usage()
        process.exit(0)
      case '--webhook':
        options.webhook = next?.trim() || ''
        i++
        break
      case '--user':
        options.user = next?.trim() || ''
        i++
        break
      case '--message':
      case '-m':
        options.message = next ?? ''
        i++
        break
      case '--image':
      case '-i':
        options.image = next?.trim() || ''
        i++
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function validateWebhook(url) {
  if (!url) {
    throw new Error('Missing webhook URL. Pass --webhook or set DISCORD_WEBHOOK in .env')
  }

  if (!url.toLowerCase().startsWith('https://discord.com/api/webhooks/')) {
    throw new Error('Webhook URL must start with https://discord.com/api/webhooks/')
  }

  if (!URL.canParse(url)) {
    throw new Error('Webhook URL is invalid')
  }
}

function buildContent(message, userId) {
  const text = message.trim()
  if (!userId) return text
  if (!text) return `<@${userId}>`
  return `<@${userId}>\n${text}`
}

async function sendText(webhook, content) {
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (res.status === 204) return

  const body = await res.text()
  throw new Error(`Discord webhook failed (HTTP ${res.status})${body ? `: ${body}` : ''}`)
}

async function sendWithImage(webhook, content, imagePath) {
  const absolutePath = resolve(imagePath)
  const fileBuffer = readFileSync(absolutePath)
  const filename = basename(absolutePath)

  const form = new FormData()
  const payload = {}
  if (content) payload.content = content
  form.append('payload_json', JSON.stringify(payload))
  form.append('files[0]', new Blob([fileBuffer]), filename)

  const res = await fetch(webhook, {
    method: 'POST',
    body: form,
  })

  if (res.status === 200 || res.status === 204) return

  const body = await res.text()
  throw new Error(`Discord webhook failed (HTTP ${res.status})${body ? `: ${body}` : ''}`)
}

try {
  const options = parseArgs(process.argv.slice(2))

  validateWebhook(options.webhook)

  if (!options.message && !options.image) {
    usage()
    throw new Error('Provide at least one of --message or --image')
  }

  const content = buildContent(options.message, options.user)

  if (options.image) {
    await sendWithImage(options.webhook, content, options.image)
    console.log(`✓ Sent to Discord${options.image ? ` with image ${options.image}` : ''}`)
  } else {
    await sendText(options.webhook, content)
    console.log('✓ Sent message to Discord')
  }
} catch (err) {
  console.error(`✗ ${err.message}`)
  process.exit(1)
}
