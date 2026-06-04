#!/usr/bin/env node

import { sendDiscordContent } from '../logger.js'

const lines = [
  '(INFO) Test notification',
  '(INFO) Discord integration working',
  '(INFO) Hoyolab Auto Daily',
]

try {
  const discordUser = process.env.DISCORD_USER?.trim()
  let content = lines.join('\n')
  if (discordUser) {
    content = `<@${discordUser}>\n${content}`
  }

  await sendDiscordContent(content)
  console.log('✓ Discord test message sent successfully.')
} catch (err) {
  console.error(`✗ ${err.message}`)
  process.exit(1)
}
