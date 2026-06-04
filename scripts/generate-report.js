#!/usr/bin/env node

/**
 * Standalone daily report image generator (dev / preview).
 *
 * Usage:
 *   npm run generate-report
 *   node scripts/generate-report.js --codes CODE1,CODE2 --primogems 120 --mora 10000 --lifetime 200
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatReportCheckInStatus, GI_CHECKIN } from '../src/check-in-status.js'
import { generateReport } from '../src/daily-report.js'
import { logFontStatus, setupReportFonts } from '../src/report-fonts.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function usage() {
  console.log(`Usage: generate-report.js [options]

Options:
  --data <path>         JSON accounts file (legacy preview; uses all codes in account)
  --account <key>       Account key (default: first)
  --codes <a,b,c>       Codes redeemed this run only
  --primogems <n>       Today's primogems (with --codes)
  --mora <n>            Today's mora (with --codes)
  --lifetime <n>        Lifetime primogems from state
  --template <path>     Template PNG
  --output <path>       Output PNG (default: daily-report.png)
  --status <text>       Check-in label override (or: now, already, failed, skipped)
  --font <path>         Custom TTF path
  --help
`)
}

function parseArgs(argv) {
  const options = {
    data: '',
    account: '',
    codes: [],
    primogems: null,
    mora: null,
    lifetime: null,
    template: resolve(ROOT, 'assets/template.png'),
    output: resolve(ROOT, 'daily-report.png'),
    status: formatReportCheckInStatus(GI_CHECKIN.NOW),
    fontPath: '',
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]
    switch (arg) {
      case '--help':
      case '-h':
        usage()
        process.exit(0)
      case '--data':
        options.data = resolve(next)
        i++
        break
      case '--account':
        options.account = next?.trim() || ''
        i++
        break
      case '--codes':
        options.codes = next.split(',').map(s => s.trim()).filter(Boolean)
        i++
        break
      case '--primogems':
        options.primogems = Number(next)
        i++
        break
      case '--mora':
        options.mora = Number(next)
        i++
        break
      case '--lifetime':
        options.lifetime = Number(next)
        i++
        break
      case '--template':
        options.template = resolve(next)
        i++
        break
      case '--output':
      case '-o':
        options.output = resolve(next)
        i++
        break
      case '--status': {
        const preset = { now: GI_CHECKIN.NOW, already: GI_CHECKIN.ALREADY, failed: GI_CHECKIN.FAILED, skipped: GI_CHECKIN.SKIPPED }
        const key = next?.toLowerCase()
        options.status = preset[key] ? formatReportCheckInStatus(preset[key]) : (next ?? options.status)
        i++
        break
      }
      case '--font':
        options.fontPath = next?.trim() || ''
        i++
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function loadAccountData(dataPath, accountKey) {
  const raw = readFileSync(dataPath, 'utf8')
  const data = JSON.parse(raw)
  const accounts = data.accounts ?? data
  const keys = Object.keys(accounts)
  const key = accountKey || keys[0]
  const account = accounts[key]
  if (!account) throw new Error(`Account "${key}" not found`)
  return { account, accountKey: key }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  try {
    const cli = parseArgs(process.argv.slice(2))
    logFontStatus(setupReportFonts({ fontPath: cli.fontPath || undefined }))

    let payload
    if (cli.codes.length) {
      payload = {
        codes: cli.codes,
        totals: {
          primogem: cli.primogems ?? 0,
          mora: cli.mora ?? 0,
        },
        lifetimePrimogems: cli.lifetime ?? 0,
      }
    } else {
      const dataPath = cli.data || resolve(ROOT, 'redeem-state.json')
      const { account, accountKey } = loadAccountData(dataPath, cli.account)
      payload = {
        ...account,
        lifetimePrimogems: cli.lifetime ?? account.totals?.primogem ?? 0,
      }
      console.warn(`Preview mode: showing all codes in ${accountKey} (not run-only)`)
    }

    const outputPath = await generateReport(payload, {
      templatePath: cli.template,
      outputPath: cli.output,
      status: cli.status,
      fontPath: cli.fontPath || undefined,
    })

    console.log(`✓ Report → ${outputPath}`)
  } catch (err) {
    console.error(`✗ ${err.message}`)
    process.exit(1)
  }
}
