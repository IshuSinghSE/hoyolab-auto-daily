/** Genshin (gi) check-in result for this run */
export const GI_CHECKIN = {
  NOW: 'checked-in-now',
  ALREADY: 'already-checked-in',
  FAILED: 'failed',
  SKIPPED: 'skipped',
}

const RANK = {
  [GI_CHECKIN.NOW]: 4,
  [GI_CHECKIN.ALREADY]: 3,
  [GI_CHECKIN.FAILED]: 2,
  [GI_CHECKIN.SKIPPED]: 1,
}

export function mergeGenshinCheckInStatus(current, next) {
  if (!next) return current
  if (!current) return next
  return RANK[next] >= RANK[current] ? next : current
}

/** Text drawn on the report image (after ✓) */
export function formatReportCheckInStatus(status) {
  switch (status) {
    case GI_CHECKIN.NOW:
      return 'Checked-In Now'
    case GI_CHECKIN.ALREADY:
      return 'Already Checked-In Today'
    case GI_CHECKIN.FAILED:
      return 'Check-In Failed'
    default:
      return 'Check-In Skipped'
  }
}

/** Discord check-in-only message line */
export function formatDiscordCheckInLine(status) {
  switch (status) {
    case GI_CHECKIN.NOW:
      return '✅ Genshin Impact: Checked in successfully'
    case GI_CHECKIN.ALREADY:
      return '✅ Genshin Impact: Already checked in today'
    case GI_CHECKIN.SKIPPED:
      return 'ℹ️ Genshin Impact: Check-in skipped'
    default:
      return '⚠️ Genshin Impact: Check-in not completed'
  }
}
