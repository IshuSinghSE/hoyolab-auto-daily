#!/usr/bin/env node

import { loadRedeemState, formatStatsLabel, getRedeemStatePath } from '../redeem.js'

function sortTotals(totals) {
  return Object.entries(totals).sort((a, b) => b[1] - a[1])
}

const state = await loadRedeemState()
const accounts = Object.entries(state.accounts ?? {})

if (!accounts.length) {
  console.log(`No redemption data in ${getRedeemStatePath()}`)
  process.exit(0)
}

for (const [accountKey, account] of accounts) {
  const codeCount = Object.keys(account.redeemedCodes ?? {}).length
  const totals = account.totals ?? {}
  const sorted = sortTotals(totals)

  console.log(`Account: ${accountKey}\n`)
  console.log(`Codes redeemed: ${codeCount}\n`)

  if (!sorted.length) {
    console.log('Lifetime rewards: none recorded\n')
    continue
  }

  console.log('Lifetime rewards:\n')
  for (const [key, amount] of sorted) {
    console.log(`${formatStatsLabel(key)}: ${amount}`)
  }
  console.log('')
}
