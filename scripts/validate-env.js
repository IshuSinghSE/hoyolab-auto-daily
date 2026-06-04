#!/usr/bin/env node

const errors = []
const warnings = []

function requireEnv(name) {
  if (!process.env[name]?.trim()) {
    errors.push(`Missing ${name}`)
    return false
  }
  return true
}

function checkCookie(name, pattern, label) {
  const value = process.env[name]
  if (!value?.trim()) return
  if (!pattern.test(value)) {
    warnings.push(`${name} may be missing ${label}`)
  }
}

console.log('Validating environment...\n')

if (requireEnv('COOKIE')) {
  checkCookie('COOKIE', /ltoken_v2=/i, 'ltoken_v2')
  checkCookie('COOKIE', /ltuid_v2=/i, 'ltuid_v2')
}

if (!process.env.GAMES?.trim()) {
  warnings.push('Missing GAMES (defaults to gi for redeem-only runs)')
} else if (!/\bgi\b/i.test(process.env.GAMES)) {
  warnings.push('GAMES has no gi — Genshin redemption will be skipped')
}

if (process.env.GIFT_COOKIE?.trim()) {
  checkCookie('GIFT_COOKIE', /cookie_token_v2=/i, 'cookie_token_v2')
  checkCookie('GIFT_COOKIE', /account_id_v2=/i, 'account_id_v2')
} else {
  warnings.push('GIFT_COOKIE not set — redemption will be skipped')
}

if (process.env.DISCORD_WEBHOOK?.trim() && process.env.SKIP_DISCORD !== '1') {
  console.log('  Discord webhook configured (will send on run unless SKIP_DISCORD=1)')
}

if (process.env.REDEEM_STATE_PATH) {
  console.log(`  Redeem state: ${process.env.REDEEM_STATE_PATH}`)
}

for (const msg of warnings) console.log(`  warn: ${msg}`)
for (const msg of errors) console.log(`  error: ${msg}`)

if (errors.length) {
  console.log('\nCopy .env.example to .env and fill in required values.')
  process.exit(1)
}

console.log('\nOK — ready for local runs (npm run start / check-in / redeem)')
process.exit(0)
