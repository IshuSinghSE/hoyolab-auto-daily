export const messages = []
export let hasErrors = false

const msgDelimiter = ':'
const gameLogPrefixes = new Set(['zzz', 'gi', 'hsr', 'hi3', 'tot', 'genshin', 'GENSHIN'])

export function log(type, ...data) {
  console[type](...data)

  switch (type) {
    case 'debug': return
    case 'warn': break
    case 'error': hasErrors = true
  }

  if (gameLogPrefixes.has(data[0])) {
    data[0] = data[0].toUpperCase() + msgDelimiter
  }

  const string = data
    .map(value => {
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2).replace(/^"|"$/, '')
      }

      return value
    })
    .join(' ')

  messages.push({ type, string })
}

export function getDiscordWebhookUrl() {
  const discordWebhook = process.env.DISCORD_WEBHOOK?.trim()

  if (!discordWebhook) {
    throw new Error('DISCORD_WEBHOOK missing. Add it to .env or GitHub Secrets.')
  }

  if (!discordWebhook.toLowerCase().startsWith('https://discord.com/api/webhooks/')) {
    throw new Error('DISCORD_WEBHOOK is not a valid Discord webhook URL. Must start with https://discord.com/api/webhooks/')
  }

  if (!URL.canParse(discordWebhook)) {
    throw new Error('DISCORD_WEBHOOK is invalid.')
  }

  return discordWebhook
}

export async function sendDiscordContent(content) {
  const discordWebhook = getDiscordWebhookUrl()

  const res = await fetch(discordWebhook, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (res.status === 204) return

  throw new Error(`Discord webhook request failed (HTTP ${res.status}). Check URL and permissions.`)
}

export async function discordWebhookSend() {
  log('debug', '\n----- DISCORD WEBHOOK -----')

  try {
    const discordUser = process.env.DISCORD_USER
    let discordMsg = ''
    if (discordUser) {
      discordMsg = `<@${discordUser}>\n`
    }
    discordMsg += messages.map(msg => `(${msg.type.toUpperCase()}) ${msg.string}`).join('\n')

    await sendDiscordContent(discordMsg)
    log('info', 'Successfully sent message to Discord webhook!')
  } catch (err) {
    log('error', err.message)
  }
}
