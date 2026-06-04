import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mergeTotals, parseRewards, parseGiftCookie } from '../src/redeem.js'

describe('mergeTotals', () => {
  it('sums known and new reward keys', () => {
    assert.deepEqual(
      mergeTotals({ primogem: 120 }, { primogem: 60, mora: 20000 }),
      { primogem: 180, mora: 20000 },
    )
  })
})

describe('parseRewards', () => {
  it('parses semicolon star format', () => {
    assert.deepEqual(
      parseRewards('Primogem*60;Mora*20000'),
      { primogem: 60, mora: 20000 },
    )
  })

  it('parses natural language amounts', () => {
    const rewards = parseRewards('60 primogems, 10k mora')
    assert.equal(rewards.primogems, 60)
    assert.equal(rewards.mora, 10000)
  })
})

describe('parseGiftCookie', () => {
  it('returns null when env unset', () => {
    const prev = process.env.GIFT_COOKIE
    delete process.env.GIFT_COOKIE
    assert.equal(parseGiftCookie(), null)
    process.env.GIFT_COOKIE = prev
  })

  it('parses required gift cookie fields', () => {
    const prev = process.env.GIFT_COOKIE
    process.env.GIFT_COOKIE = 'account_id_v2=1; account_mid_v2=mid; cookie_token_v2=v2_x'
    const accounts = parseGiftCookie()
    assert.equal(accounts.length, 1)
    assert.match(accounts[0].cookie, /cookie_token_v2=v2_x/)
    assert.equal(accounts[0].accountIdV2, '1')
    process.env.GIFT_COOKIE = prev
  })

  it('throws when cookie_token_v2 missing', () => {
    const prev = process.env.GIFT_COOKIE
    process.env.GIFT_COOKIE = 'account_id_v2=1'
    assert.throws(() => parseGiftCookie(), /cookie_token_v2/)
    process.env.GIFT_COOKIE = prev
  })
})
