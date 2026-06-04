import { readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { log } from './logger.js'

export function isDryRun() {
  return process.env.DRY_RUN === '1'
}

const __dirname = dirname(fileURLToPath(import.meta.url))

export function getRedeemStatePath() {
  return process.env.REDEEM_STATE_PATH
    ? join(process.cwd(), process.env.REDEEM_STATE_PATH)
    : join(__dirname, 'redeem-state.json')
}
const CODES_URL = 'https://hoyo-codes.seria.moe/codes?game=genshin'
const RECORD_CARD_URL = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard'
const REDEEM_URL = 'https://sg-hk4e-api.hoyolab.com/common/apicdkey/api/webExchangeCdkey'
const REDEEM_DELAY_MS = 10000
const GENSHIN_BIZ = 'hk4e_global'
const GENSHIN_GAME_ID = 2
const LOG_GAME = 'GENSHIN'
const GIFT_COOKIE_HELP = 'Visit https://genshin.hoyoverse.com/en/gift and copy the required cookies.'

const redeemSuccessCodes = new Set(['0', '-2017', '-2018', '-2007'])
const GIFT_COOKIE_KEYS = ['account_id_v2', 'account_mid_v2', 'cookie_token_v2']

const rewardLabels = {
  primogem: 'Primogems',
  mora: 'Mora',
  adventurersexperience: 'Adventurer Experience',
  fineenhancementore: 'Fine Enhancement Ore',
  heroswit: 'Hero\'s Wit',
  mysticenhancementore: 'Mystic Enhancement Ore',
}

export function mergeTotals(totals, rewards) {
  const merged = { ...totals }
  for (const [key, amount] of Object.entries(rewards)) {
    merged[key] = (merged[key] || 0) + amount
  }
  return merged
}

function normalizeRewardKey(name) {
  return name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '')
}

function wordToNumber(word) {
  const map = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  }
  return map[word.toLowerCase()] ?? Number(word)
}

export function parseRewards(rewardsStr) {
  const rewards = {}
  if (!rewardsStr) return rewards

  for (let part of rewardsStr.split(/[;,]/)) {
    part = part.trim()
    if (!part) continue

    let match = part.match(/^(.+?)\*(\d+)$/i)
    if (match) {
      const key = normalizeRewardKey(match[1])
      rewards[key] = (rewards[key] || 0) + Number(match[2])
      continue
    }

    match = part.match(/^(\d+(?:\.\d+)?)\s*([kK])?\s+(.+)$/i)
    if (match) {
      let amount = Number(match[1])
      if (match[2]) amount *= 1000
      const key = normalizeRewardKey(match[3])
      rewards[key] = (rewards[key] || 0) + amount
      continue
    }

    match = part.match(/^(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(.+)$/i)
    if (match) {
      const key = normalizeRewardKey(match[2])
      rewards[key] = (rewards[key] || 0) + wordToNumber(match[1])
    }
  }

  return rewards
}

function parseGiftCookieLine(line) {
  const pairs = {}

  for (const part of line.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (key) pairs[key] = value
  }

  if (!pairs.account_id_v2) {
    throw new Error(`GIFT_COOKIE is missing account_id_v2. ${GIFT_COOKIE_HELP}`)
  }

  if (!pairs.cookie_token_v2) {
    throw new Error(`GIFT_COOKIE is missing cookie_token_v2. ${GIFT_COOKIE_HELP}`)
  }

  const cookie = GIFT_COOKIE_KEYS
    .filter(key => pairs[key])
    .map(key => `${key}=${pairs[key]}`)
    .join('; ')

  return { cookie, accountIdV2: pairs.account_id_v2 }
}

export function parseGiftCookie() {
  const raw = process.env.GIFT_COOKIE?.trim()
  if (!raw) return null

  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(parseGiftCookieLine)
}

export function formatRewardLabel(key) {
  if (rewardLabels[key]) return rewardLabels[key]
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function formatStatsLabel(key) {
  if (key === 'primogem') return 'Primogem'
  if (key === 'mora') return 'Mora'
  return formatRewardLabel(key)
}

function formatLifetimeLabel(key, total) {
  return `Lifetime ${formatRewardLabel(key)}: ${total}`
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildHeaders(cookie, referer = 'https://genshin.hoyoverse.com/en/gift') {
  const headers = new Headers()
  headers.set('accept', 'application/json, text/plain, */*')
  headers.set('accept-language', 'en-US,en;q=0.6')
  headers.set('cookie', cookie)
  headers.set('origin', 'https://genshin.hoyoverse.com')
  headers.set('referer', referer)
  headers.set('x-rpc-client_type', '5')
  headers.set('user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
  return headers
}

function accountGamesList(gamesLine) {
  if (!gamesLine) return []
  return gamesLine.split(' ').map(g => g.trim().toLowerCase())
}

export async function loadRedeemState() {
  try {
    const raw = await readFile(getRedeemStatePath(), 'utf8')
    const state = JSON.parse(raw)
    if (!state.accounts) state.accounts = {}
    return state
  } catch (err) {
    if (err.code === 'ENOENT') return { accounts: {} }
    throw err
  }
}

async function saveState(state) {
  await writeFile(getRedeemStatePath(), JSON.stringify(state, null, 2) + '\n')
}

export async function fetchActiveCodes() {
  const res = await fetch(CODES_URL)
  if (!res.ok) throw new Error(`Failed to fetch codes (${res.status})`)
  const json = await res.json()
  return (json.codes || []).filter(entry => entry.status === 'OK')
}

async function getGenshinRoles(giftAccount) {
  const url = new URL(RECORD_CARD_URL)
  url.searchParams.set('uid', giftAccount.accountIdV2)

  const res = await fetch(url, { headers: buildHeaders(giftAccount.cookie, 'https://www.hoyolab.com/') })
  const json = await res.json()
  const code = String(json.retcode)

  if (code !== '0') {
    throw new Error(json.message || `Failed to load game accounts (${code})`)
  }

  return (json.data?.list || [])
    .filter(role => role.game_id === GENSHIN_GAME_ID)
    .filter(role => role.level >= 10)
    .map(role => ({
      game_uid: String(role.game_role_id),
      region: role.region,
      game_biz: GENSHIN_BIZ,
    }))
}

async function exchangeCdkey(giftCookie, role, cdkey) {
  const url = new URL(REDEEM_URL)
  url.searchParams.set('uid', role.game_uid)
  url.searchParams.set('region', role.region)
  url.searchParams.set('game_biz', role.game_biz || GENSHIN_BIZ)
  url.searchParams.set('cdkey', cdkey)
  url.searchParams.set('lang', 'en')
  url.searchParams.set('sLangKey', 'en-us')

  const res = await fetch(url, { method: 'GET', headers: buildHeaders(giftCookie) })
  return res.json()
}

function ensureAccount(state, accountKey) {
  if (!state.accounts[accountKey]) {
    state.accounts[accountKey] = { redeemedCodes: {}, totals: {} }
  }
  return state.accounts[accountKey]
}

async function redeemCodeForRoles(giftCookie, codeEntry, roles) {
  const results = []

  for (let i = 0; i < roles.length; i++) {
    if (i > 0) await sleep(REDEEM_DELAY_MS)
    const json = await exchangeCdkey(giftCookie, roles[i], codeEntry.code)
    results.push({
      retcode: String(json.retcode),
      message: json.message || `Error code ${json.retcode}`,
    })
    log('debug', LOG_GAME, `Redeem ${codeEntry.code} uid ${roles[i].game_uid}`, json)
  }

  return results
}

function shouldRecordCode(results) {
  if (!results.length) return false
  return results.every(result => redeemSuccessCodes.has(result.retcode))
}

function recordRedemption(account, codeEntry) {
  const rewards = parseRewards(codeEntry.rewards)
  account.redeemedCodes[codeEntry.code] = {
    redeemedAt: new Date().toISOString(),
    rewards,
  }
  account.totals = mergeTotals(account.totals, rewards)
  return rewards
}

function logLifetimeTotals(account, changedKeys) {
  for (const key of changedKeys) {
    log('info', LOG_GAME, formatLifetimeLabel(key, account.totals[key]))
  }
}

function dryRunRedeemForAccount(accountNum, account, pendingCodes) {
  if (!pendingCodes.length) {
    console.log(`[DRY RUN] Account ${accountNum}: no new codes to redeem`)
    return
  }

  console.log(`[DRY RUN] Account ${accountNum} — would redeem:`)
  for (const entry of pendingCodes) {
    console.log(entry.code)
  }

  const aggregated = {}
  for (const entry of pendingCodes) {
    mergeTotals(aggregated, parseRewards(entry.rewards))
  }

  if (Object.keys(aggregated).length) {
    console.log('[DRY RUN] Rewards:')
    for (const [key, amount] of Object.entries(aggregated)) {
      console.log(`+${amount} ${formatRewardLabel(key)}`)
    }
  }
}

export async function runRedeem({ games }) {
  const dryRun = isDryRun()
  log('debug', '\n----- GENSHIN CODE REDEMPTION -----')

  if (dryRun) {
    console.log('[DRY RUN] Redemption preview (no API redeem, no state changes)\n')
  }

  let giftAccounts = null
  try {
    giftAccounts = parseGiftCookie()
  } catch (err) {
    log('error', LOG_GAME, err.message)
    return false
  }

  const gamesList = games ?? []
  let latestGamesLine = ''
  const state = await loadRedeemState()
  let activeCodes

  try {
    activeCodes = await fetchActiveCodes()
  } catch (err) {
    log('error', LOG_GAME, `Failed to fetch active codes: ${err.message}`)
    return false
  }

  if (!giftAccounts?.length) {
    if (dryRun) {
      let latestGamesLine = ''
      for (const index in gamesList) {
        const line = gamesList[index]?.trim()
        if (line) latestGamesLine = line
        if (!accountGamesList(line || latestGamesLine).includes('gi')) continue
        const accountKey = `account_${Number(index) + 1}`
        const account = ensureAccount(state, accountKey)
        const pendingCodes = activeCodes.filter(entry => !(entry.code in account.redeemedCodes))
        dryRunRedeemForAccount(Number(index) + 1, account, pendingCodes)
      }
      return false
    }
    log('info', LOG_GAME, 'GIFT_COOKIE not configured. Skipping code redemption.')
    return false
  }

  let stateChanged = false

  for (const index in giftAccounts) {
    const accountNum = Number(index) + 1
    const accountKey = `account_${accountNum}`
    const line = games[index]?.trim()
    if (line) latestGamesLine = line
    const gamesLine = accountGamesList(line || latestGamesLine)

    if (!gamesLine.includes('gi')) {
      log('debug', LOG_GAME, `Skipping account ${accountNum} (gi not in GAMES)`)
      continue
    }

    const giftAccount = giftAccounts[index]
    const account = ensureAccount(state, accountKey)
    const changedKeys = new Set()

    for (const entry of activeCodes) {
      if (entry.code in account.redeemedCodes) {
        log('debug', LOG_GAME, `Skipping already redeemed code ${entry.code}`)
      }
    }

    let roles
    try {
      roles = await getGenshinRoles(giftAccount)
    } catch (err) {
      log('error', LOG_GAME, err.message)
      continue
    }

    if (!roles.length) {
      log('error', LOG_GAME, 'No Genshin accounts found (AR 10+ required)')
      continue
    }

    const pendingCodes = activeCodes.filter(entry => !(entry.code in account.redeemedCodes))

    if (!pendingCodes.length) {
      if (dryRun) {
        console.log(`[DRY RUN] Account ${accountNum}: no new redemption codes found`)
      } else {
        log('info', LOG_GAME, 'No new redemption codes found')
      }
      continue
    }

    if (dryRun) {
      dryRunRedeemForAccount(accountNum, account, pendingCodes)
      continue
    }

    for (let codeIndex = 0; codeIndex < pendingCodes.length; codeIndex++) {
      const codeEntry = pendingCodes[codeIndex]
      if (codeIndex > 0) await sleep(REDEEM_DELAY_MS)

      const results = await redeemCodeForRoles(giftAccount.cookie, codeEntry, roles)

      if (!shouldRecordCode(results)) {
        const last = results[results.length - 1]
        log('error', LOG_GAME, `Failed to redeem ${codeEntry.code}: ${last.message}`)
        continue
      }

      const rewards = recordRedemption(account, codeEntry)
      stateChanged = true

      log('info', LOG_GAME, `Redeemed ${codeEntry.code}`)
      for (const [key, amount] of Object.entries(rewards)) {
        log('info', LOG_GAME, `+${amount} ${formatRewardLabel(key)}`)
        changedKeys.add(key)
      }
    }

    if (changedKeys.size) {
      logLifetimeTotals(account, changedKeys)
    }
  }

  if (stateChanged && !dryRun) {
    await saveState(state)
  }

  return stateChanged
}
