#!/usr/bin/env node

/** CI smoke test: generate a report PNG without Discord or live API calls. */

import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatReportCheckInStatus, GI_CHECKIN } from '../src/check-in-status.js'
import { generateDailyReport } from '../src/daily-report.js'
import { setupReportFonts } from '../src/report-fonts.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(ROOT, 'daily-report.png')

setupReportFonts()
const path = await generateDailyReport({
  codes: ['SMOKECODE1', 'SMOKECODE2'],
  totals: { primogem: 120, mora: 10000 },
  lifetimePrimogems: 500,
  status: formatReportCheckInStatus(GI_CHECKIN.ALREADY),
  outputPath,
})

if (!existsSync(path)) {
  console.error('Smoke test failed: report file not created')
  process.exit(1)
}

console.log(`Smoke test OK: ${path}`)
