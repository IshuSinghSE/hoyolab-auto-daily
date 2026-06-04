import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatDiscordCheckInLine,
  formatReportCheckInStatus,
  GI_CHECKIN,
} from '../src/check-in-status.js'
import { summarizeTodayTotals } from '../src/discord-notify.js'
import { formatReportDate } from '../src/daily-report.js'

describe('summarizeTodayTotals', () => {
  it('sums only primogem and mora from run rewards', () => {
    assert.deepEqual(
      summarizeTodayTotals([
        { primogem: 60, adventurersexperience: 5 },
        { mora: 10000, fineenhancementore: 5 },
        { primogem: 20 },
      ]),
      { primogem: 80, mora: 10000 },
    )
  })

  it('accepts legacy primogems key', () => {
    assert.deepEqual(summarizeTodayTotals([{ primogems: 60 }]), { primogem: 60, mora: 0 })
  })
})

describe('check-in status labels', () => {
  it('maps API outcomes to report and Discord copy', () => {
    assert.equal(formatReportCheckInStatus(GI_CHECKIN.NOW), 'Checked-In Now')
    assert.equal(formatReportCheckInStatus(GI_CHECKIN.ALREADY), 'Already Checked-In Today')
    assert.equal(
      formatDiscordCheckInLine(GI_CHECKIN.ALREADY),
      '✅ Genshin Impact: Already checked in today',
    )
  })
})

describe('formatReportDate', () => {
  it('uses ISO date, bullet separator, and UTC+8 label', () => {
    const text = formatReportDate(new Date('2026-06-04T10:37:00Z'), 'Asia/Shanghai')
    assert.match(text, /^2026-06-04 • \d{2}:\d{2} \(UTC\+8\)$/)
  })
})
