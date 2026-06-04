#!/usr/bin/env node

import { writeFile } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { loadRedeemState, formatRewardLabel } from '../redeem.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docsDir = join(__dirname, '..', 'docs')
const GIFT_PAGE = 'https://genshin.hoyoverse.com/en/gift'
const REDEEMED = '✅ Redeemed'

function formatRewards(rewards) {
  if (!rewards || !Object.keys(rewards).length) return '—'
  return Object.entries(rewards)
    .map(([key, amount]) => `${amount} ${formatRewardLabel(key)}`)
    .join(', ')
}

function codesFromState(state) {
  const byCode = new Map()

  for (const account of Object.values(state.accounts ?? {})) {
    for (const [code, entry] of Object.entries(account.redeemedCodes ?? {})) {
      if (!byCode.has(code)) {
        byCode.set(code, entry.rewards ?? {})
      }
    }
  }

  return [...byCode.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function buildRedeemCodesMd(state) {
  const codes = codesFromState(state)
  const lines = [
    '# Redeemed Genshin Codes',
    '',
    'Automatically generated from redeem-state.json.',
    '',
  ]

  if (!codes.length) {
    lines.push('No redeemed codes yet.', '')
    return lines.join('\n')
  }

  lines.push('| Code | Rewards | Status |', '| --- | --- | --- |')

  for (const [code, rewards] of codes) {
    const codeLink = `[${code}](${GIFT_PAGE})`
    lines.push(`| ${codeLink} | ${formatRewards(rewards)} | ${REDEEMED} |`)
  }

  lines.push('')
  return lines.join('\n')
}

export async function generateDocs() {
  const state = await loadRedeemState()
  await writeFile(join(docsDir, 'redeem-codes.md'), buildRedeemCodesMd(state))
}

const isMain = process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  generateDocs()
    .then(() => console.log('Generated docs/redeem-codes.md'))
    .catch(err => {
      console.error(err.message || err)
      process.exit(1)
    })
}
