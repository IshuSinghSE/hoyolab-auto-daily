#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { resolve } from 'path'
import {
  GI_CHECKIN,
  mergeGenshinCheckInStatus,
} from './check-in-status.js'
import { log, hasErrors } from './logger.js'
import { sendDiscordDailySummary } from './discord-notify.js'
import { runRedeem, isDryRun } from './redeem.js'

const FETCH_TIMEOUT_MS = 30_000

const endpoints = {
  zzz: 'https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/sign?act_id=e202406031448091',
  gi:  'https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=e202102251931481',
  hsr: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202303301540311',
  hi3: 'https://sg-public-api.hoyolab.com/event/mani/sign?act_id=e202110291205111',
  tot: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202202281857121',
}

let latestGames = []

function accountGamesList(gamesLine) {
  if (!gamesLine) return []
  return gamesLine.split(' ').map(g => g.trim().toLowerCase()).filter(Boolean)
}

function dryRunCheckIn(cookies, games) {
  let latestLine = ''

  for (const index in cookies) {
    const line = games[index]?.trim()
    if (line) latestLine = line
    const gameList = accountGamesList(line || latestLine).filter(g => g in endpoints)

    if (cookies.length > 1) {
      console.log(`[DRY RUN] Account ${Number(index) + 1} — would check in:`)
    } else {
      console.log('[DRY RUN] Would check in:')
    }

    if (!gameList.length) {
      console.log('  (no valid games in GAMES)')
      continue
    }

    for (const game of gameList) {
      console.log(`- ${game.toUpperCase()}`)
    }
  }
}

async function runCheckIn(cookie, gamesLine) {
  let games = gamesLine
  if (!games) {
    games = latestGames
  } else {
    games = games.split(' ')
    latestGames = games
  }

  const gameList = games.map(g => g.toLowerCase())
  if (!gameList.includes('gi')) {
    return GI_CHECKIN.SKIPPED
  }

  let genshinStatus = GI_CHECKIN.FAILED

  for (let game of games) {
    game = game.toLowerCase()

    log('debug', `\n----- CHECKING IN FOR ${game} -----`)

    if (!(game in endpoints)) {
      log('error', `Game ${game} is invalid. Available games are: zzz, gi, hsr, hi3, and tot`)
      continue
    }

    const endpoint = endpoints[game]
    const url = new URL(endpoint)
    const actId = url.searchParams.get('act_id')

    url.searchParams.set('lang', 'en-us')

    const body = JSON.stringify({
      lang: 'en-us',
      act_id: actId,
    })

    const headers = new Headers()

    headers.set('accept', 'application/json, text/plain, */*')
    headers.set('accept-encoding', 'gzip, deflate, br, zstd')
    headers.set('accept-language', 'en-US,en;q=0.6')
    headers.set('connection', 'keep-alive')
    headers.set('origin', 'https://act.hoyolab.com')
    headers.set('referrer', 'https://act.hoyolab.com')
    headers.set('content-type', 'application.json;charset=UTF-8')
    headers.set('cookie', cookie)
    headers.set('sec-ch-ua', '"Not/A)Brand";v="8", "Chromium";v="126", "Brave";v="126"')
    headers.set('sec-ch-ua-mobile', '?0')
    headers.set('sec-ch-ua-platform', '"Linux"')
    headers.set('sec-fetch-dest', 'empty')
    headers.set('sec-fech-mode', 'cors')
    headers.set('sec-fetch-site', 'same-site')
    headers.set('sec-gpc', '1')
    headers.set('x-rpc-signgame', game)
    headers.set('user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    const json = await res.json()
    const code = String(json.retcode)
    const successCodes = {
      '0': 'Successfully checked in!',
      '-5003': 'Already checked in for today',
    }

    if (code in successCodes) {
      log('info', game, `${successCodes[code]}`)
      if (game === 'gi') {
        genshinStatus = code === '0' ? GI_CHECKIN.NOW : GI_CHECKIN.ALREADY
      }
      continue
    }

    const errorCodes = {
      '-100': 'Error not logged in. Your cookie is invalid, try setting up again',
      '-10002': 'Error not found. You haven\'t played this game',
    }

    log('debug', game, `Headers`, Object.fromEntries(res.headers))
    log('debug', game, `Response`, json)

    if (code in errorCodes) {
      log('error', game, `${errorCodes[code]}`)
      continue
    }

    log('error', game, `Error undocumented, report to Issues page if this persists`)
  }

  return genshinStatus
}

export async function runDaily(options = {}) {
  const dryRun = isDryRun()
  const skipCheckIn = options.skipCheckIn ?? false
  const skipRedeem = options.skipRedeem ?? false
  const skipDiscord = options.skipDiscord ?? (process.env.SKIP_DISCORD === '1' || dryRun)

  const cookies = process.env.COOKIE?.split('\n').map(s => s.trim()).filter(Boolean) ?? []
  const games = process.env.GAMES?.split('\n').map(s => s.trim()).filter(Boolean)
    ?? (skipCheckIn ? ['gi'] : [])

  if (dryRun) {
    console.log('[DRY RUN] Mode enabled — no check-in API calls, redemptions, state changes, or Discord.\n')
  }

  let genshinCheckInStatus = GI_CHECKIN.SKIPPED
  let redeemSummary = { newlyRedeemed: [], lifetimePrimogems: 0 }

  if (!skipCheckIn) {
    if (!cookies.length) {
      throw new Error('COOKIE environment variable not set!')
    }
    if (!games.length) {
      throw new Error('GAMES environment variable not set!')
    }

    if (dryRun) {
      dryRunCheckIn(cookies, games)
      console.log('')
    } else {
      for (const index in cookies) {
        log('info', `-- CHECKING IN FOR ACCOUNT ${Number(index) + 1} --`)
        const status = await runCheckIn(cookies[index], games[index])
        genshinCheckInStatus = mergeGenshinCheckInStatus(genshinCheckInStatus, status)
      }
    }
  }

  if (!skipRedeem) {
    redeemSummary = await runRedeem({ games })
  }

  const discordWebhook = process.env.DISCORD_WEBHOOK
  const notifyDiscord = !skipDiscord && discordWebhook && URL.canParse(discordWebhook)
    && (!skipCheckIn || redeemSummary.newlyRedeemed.length > 0)

  if (notifyDiscord) {
    try {
      await sendDiscordDailySummary({
        genshinCheckInStatus,
        newlyRedeemed: redeemSummary.newlyRedeemed,
        lifetimePrimogems: redeemSummary.lifetimePrimogems,
      })
    } catch (err) {
      log('error', err.message)
    }
  }

  if (hasErrors && !dryRun) {
    console.log('')
    throw new Error('Error(s) occured.')
  }
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  runDaily().catch(err => {
    console.error(err.message || err)
    process.exit(1)
  })
}
