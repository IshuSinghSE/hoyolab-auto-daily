#!/usr/bin/env node

import { runDaily } from '../index.js'

const mode = process.argv[2] || 'all'

const modes = {
  all: {},
  'check-in': { skipRedeem: true },
  redeem: { skipCheckIn: true },
}

if (!(mode in modes)) {
  console.error(`Usage: npm run <script>  (modes: all, check-in, redeem)`)
  console.error(`  node --env-file=.env scripts/run-local.js [all|check-in|redeem]`)
  process.exit(1)
}

runDaily(modes[mode]).catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
