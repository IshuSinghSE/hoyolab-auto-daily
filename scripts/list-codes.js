#!/usr/bin/env node

import { fetchActiveCodes } from '../redeem.js'

const codes = await fetchActiveCodes()

if (!codes.length) {
  console.log('No active Genshin codes returned from API.')
  process.exit(0)
}

console.log(`Active codes (${codes.length}):\n`)
for (const entry of codes) {
  console.log(`  ${entry.code}`)
  console.log(`    ${entry.rewards}\n`)
}
