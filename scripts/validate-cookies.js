#!/usr/bin/env node

function parseCookiePairs(value) {
  const pairs = {}
  if (!value?.trim()) return pairs
  for (const part of value.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (key) pairs[key] = val
  }
  return pairs
}

function envCookieLines(name) {
  return process.env[name]?.split('\n').map(line => line.trim()).filter(Boolean) ?? []
}

function lineHasCookieKey(line, key) {
  return key in parseCookiePairs(line)
}

let failed = false

function pass(msg) {
  console.log(`✓ ${msg}`)
}

function fail(msg) {
  console.log(`✗ ${msg}`)
  failed = true
}

function checkCookieEnv(name, requiredKeys, optionalKeys = []) {
  const lines = envCookieLines(name)

  if (!lines.length) {
    fail(`${name} not configured`)
    return
  }

  pass(`${name} configured`)

  for (let i = 0; i < lines.length; i++) {
    const prefix = lines.length > 1 ? ` (account ${i + 1})` : ''

    for (const key of requiredKeys) {
      if (lineHasCookieKey(lines[i], key)) {
        pass(`${key} found${prefix}`)
      } else {
        fail(`${key} missing in ${name}${prefix}`)
      }
    }

    for (const key of optionalKeys) {
      if (lineHasCookieKey(lines[i], key)) {
        pass(`${key} found${prefix}`)
      }
    }
  }
}

console.log('Validating cookies...\n')

checkCookieEnv('COOKIE', ['ltuid_v2', 'ltoken_v2'])

console.log('')

if (process.env.GIFT_COOKIE?.trim()) {
  checkCookieEnv('GIFT_COOKIE', ['account_id_v2', 'cookie_token_v2'], ['account_mid_v2'])
} else {
  console.log('○ GIFT_COOKIE not configured (redemption will be skipped)')
}

console.log('')

if (failed) {
  console.log('Validation failed.')
  process.exit(1)
}

console.log('Validation successful.')
process.exit(0)
