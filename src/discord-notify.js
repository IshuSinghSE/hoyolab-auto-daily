import { readFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatDiscordCheckInLine, formatReportCheckInStatus } from './check-in-status.js'
import { getDiscordWebhookUrl, log } from './logger.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function mentionPrefix() {
  const user = process.env.DISCORD_USER?.trim()
  return user ? `<@${user}>\n` : ''
}

async function postWebhook(content, imagePath) {
  const webhook = getDiscordWebhookUrl()

  if (!imagePath) {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.status === 204) return
    const body = await res.text()
    throw new Error(`Discord webhook failed (HTTP ${res.status})${body ? `: ${body}` : ''}`)
  }

  const absolutePath = resolve(imagePath)
  const fileBuffer = readFileSync(absolutePath)
  const filename = basename(absolutePath)
  const form = new FormData()
  form.append('payload_json', JSON.stringify({ content }))
  form.append('files[0]', new Blob([fileBuffer]), filename)

  const res = await fetch(webhook, { method: 'POST', body: form })
  if (res.status === 200 || res.status === 204) return
  const body = await res.text()
  throw new Error(`Discord webhook failed (HTTP ${res.status})${body ? `: ${body}` : ''}`)
}

export function summarizeTodayTotals(rewardsList) {
  const totals = { primogem: 0, mora: 0 }
  for (const rewards of rewardsList) {
    if (!rewards) continue
    if (rewards.primogem) totals.primogem += rewards.primogem
    if (rewards.mora) totals.mora += rewards.mora
  }
  return totals
}

/**
 * @param {object} options
 * @param {string} options.genshinCheckInStatus — see GI_CHECKIN in check-in-status.js
 * @param {Array<{ code: string, rewards: object }>} options.newlyRedeemed
 * @param {number} options.lifetimePrimogems
 */
export async function sendDiscordDailySummary(options = {}) {
  const {
    genshinCheckInStatus = 'skipped',
    newlyRedeemed = [],
    lifetimePrimogems = 0,
    reportOutputPath = resolve(ROOT, 'daily-report.png'),
  } = options

  const reportStatus = formatReportCheckInStatus(genshinCheckInStatus)

  const prefix = mentionPrefix()
  const count = newlyRedeemed.length

  if (count > 0) {
    const { generateDailyReport } = await import('./daily-report.js')
    const content = `${prefix}🎁 New Genshin codes redeemed!\n\n${count} new code(s) were successfully redeemed.`
    const imagePath = await generateDailyReport({
      codes: newlyRedeemed.map(entry => entry.code),
      totals: summarizeTodayTotals(newlyRedeemed.map(entry => entry.rewards)),
      lifetimePrimogems,
      status: reportStatus,
      outputPath: reportOutputPath,
    })
    await postWebhook(content, imagePath)
    log('info', `Discord report sent (${count} new code(s))`)
    return { mode: 'report', imagePath, count }
  }

  const checkInLine = formatDiscordCheckInLine(genshinCheckInStatus)

  const content = `${prefix}🎮 HoYoLAB Daily Check-In\n\n${checkInLine}\n\nNo new redemption codes found.`
  await postWebhook(content)
  log('info', 'Discord check-in summary sent')
  return { mode: 'check-in' }
}
