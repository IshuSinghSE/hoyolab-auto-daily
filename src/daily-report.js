import { createCanvas, loadImage } from 'canvas'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fontWeight, setupReportFonts } from './report-fonts.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_TEMPLATE = resolve(ROOT, 'assets/template.png')
const DEFAULT_OUTPUT = resolve(ROOT, 'daily-report.png')

const TEMPLATE = { width: 1684, height: 2528 }

const COLORS = {
  date: '#D1D1D1',
  checkIn: '#A5FF00',
  code: '#B57EDC',
  primogem: '#4DA6FF',
  mora: '#F5E52B',
}

const LAYOUT = {
  date: { x: 420, y: 420, font: fontWeight(400, 32), color: COLORS.date, iconSize: 30, iconGap: 14 },
  status: { x: 420, y: 750, font: fontWeight(700, 36), color: COLORS.checkIn, align: 'left' },
  codes: {
    x: 490,
    y: 1040,
    lineHeight: 113,
    max: 5,
    maxWidth: 640,
    font: fontWeight(600, 48),
    color: COLORS.code,
    align: 'left',
  },
  primogemToday: {
    x: 350,
    y: 1880,
    font: fontWeight(700, 56),
    color: COLORS.primogem,
    align: 'left',
    prefix: '+',
    shadow: true,
  },
  moraToday: {
    x: 1100,
    y: 1880,
    font: fontWeight(700, 56),
    color: COLORS.mora,
    align: 'left',
    prefix: '+',
    shadow: true,
  },
  lifetimePrimogem: {
    x: 480,
    y: 2200,
    font: fontWeight(800, 120),
    color: '#FFEB99',
    align: 'left',
    shadow: true,
  },
}

function scaleCoord(value, templateSize, imageSize) {
  return Math.round(value * (imageSize / templateSize))
}

function scaledFont(font, scale) {
  const match = font.match(/^(\d+)\s+(\d+(?:\.\d+)?)px\s+(.+)$/)
  if (!match) {
    const simple = font.match(/^(\d+(?:\.\d+)?)px\s+(.+)$/)
    if (!simple) return font
    return `${Math.round(Number(simple[1]) * scale)}px ${simple[2]}`
  }
  return `${match[1]} ${Math.round(Number(match[2]) * scale)}px ${match[3]}`
}

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let trimmed = text
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }
  return `${trimmed}…`
}

function formatNumber(n) {
  return Number(n).toLocaleString('en-US')
}

export function formatReportDate(date = new Date(), timeZone = 'Asia/Shanghai') {
  const datePart = date.toLocaleDateString('en-CA', { timeZone })
  const timePart = date.toLocaleTimeString('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${datePart} • ${timePart} (UTC+8)`
}

function drawCalendarIcon(ctx, x, y, sizePx, color) {
  const w = sizePx
  const h = sizePx * 1.05
  const line = Math.max(1.5, sizePx / 12)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = line
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeRect(x, y + h * 0.22, w, h * 0.76)
  ctx.beginPath()
  ctx.moveTo(x, y + h * 0.38)
  ctx.lineTo(x + w, y + h * 0.38)
  ctx.stroke()
  const ringTop = y + h * 0.1
  for (const rx of [w * 0.28, w * 0.72]) {
    ctx.beginPath()
    ctx.moveTo(x + rx, ringTop)
    ctx.lineTo(x + rx, y + h * 0.26)
    ctx.stroke()
  }
  const dotR = sizePx * 0.055
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = x + w * (0.22 + col * 0.28)
      const cy = y + h * (0.52 + row * 0.2)
      ctx.beginPath()
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawReportDate(ctx, spec, imageWidth, scale) {
  const text = formatReportDate()
  const y = scaleCoord(spec.y, TEMPLATE.height, ctx.canvas.height)
  const iconSize = spec.iconSize ?? 28
  const iconGap = spec.iconGap ?? 12
  ctx.save()
  ctx.font = scaledFont(spec.font, scale)
  ctx.fillStyle = spec.color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const iconPx = scaleCoord(iconSize, TEMPLATE.width, imageWidth)
  const gap = scaleCoord(iconGap, TEMPLATE.width, imageWidth)
  const startX = scaleCoord(spec.x ?? 0, TEMPLATE.width, imageWidth)
  const centerY = y + iconPx / 2
  drawCalendarIcon(ctx, startX, centerY - iconPx / 2, iconPx, spec.color)
  ctx.fillText(text, startX + iconPx + gap, centerY)
  ctx.restore()
}

function drawField(ctx, spec, text, imageWidth, scale) {
  const x = spec.x != null ? scaleCoord(spec.x, TEMPLATE.width, imageWidth) : imageWidth / 2
  const y = scaleCoord(spec.y, TEMPLATE.height, ctx.canvas.height)
  const maxWidth = spec.maxWidth
    ? scaleCoord(spec.maxWidth, TEMPLATE.width, imageWidth)
    : undefined
  ctx.save()
  ctx.font = scaledFont(spec.font, scale)
  ctx.fillStyle = spec.color
  ctx.textBaseline = 'top'
  ctx.textAlign = spec.align ?? 'left'
  if (spec.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 2
  }
  let line = text
  if (maxWidth) line = truncateToWidth(ctx, line, maxWidth)
  ctx.fillText(line, x, y)
  ctx.restore()
}

function resolveReportFields(data) {
  if (Array.isArray(data.codes)) {
    return {
      codes: data.codes,
      totals: {
        primogem: data.totals?.primogem ?? 0,
        mora: data.totals?.mora ?? 0,
      },
      lifetime: data.lifetimePrimogems ?? 0,
    }
  }

  return {
    codes: Object.keys(data.redeemedCodes ?? {}),
    totals: {
      primogem: data.totals?.primogem ?? 0,
      mora: data.totals?.mora ?? 0,
    },
    lifetime: data.lifetimePrimogems ?? data.totals?.primogem ?? 0,
  }
}

/**
 * @param {object} data — run payload (`codes` array) or legacy account state
 * @param {object} options
 */
export async function generateReport(data, options = {}) {
  const {
    templatePath = DEFAULT_TEMPLATE,
    outputPath = DEFAULT_OUTPUT,
    status = 'Checked-In',
    lifetimePrimogem = null,
    calibrate = false,
    fontPath,
  } = options

  setupReportFonts({ fontPath })

  const { codes, totals, lifetime } = resolveReportFields(data)
  const primogemToday = totals.primogem
  const moraToday = totals.mora
  const lifetimeValue = lifetimePrimogem ?? lifetime

  const image = await loadImage(templatePath)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  const scale = Math.min(image.width / TEMPLATE.width, image.height / TEMPLATE.height)

  ctx.drawImage(image, 0, 0)

  drawReportDate(ctx, LAYOUT.date, image.width, scale)
  drawField(ctx, LAYOUT.status, `✓ ${status}`, image.width, scale)

  const codesSpec = LAYOUT.codes
  const codeX = scaleCoord(codesSpec.x, TEMPLATE.width, image.width)
  const codeStartY = scaleCoord(codesSpec.y, TEMPLATE.height, image.height)
  const codeLineHeight = scaleCoord(codesSpec.lineHeight, TEMPLATE.height, image.height)
  const codeMaxWidth = scaleCoord(codesSpec.maxWidth, TEMPLATE.width, image.width)

  ctx.save()
  ctx.font = scaledFont(codesSpec.font, scale)
  ctx.fillStyle = codesSpec.color
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  codes.slice(0, codesSpec.max).forEach((code, i) => {
    ctx.fillText(truncateToWidth(ctx, code, codeMaxWidth), codeX, codeStartY + i * codeLineHeight)
  })
  ctx.restore()

  drawField(
    ctx,
    LAYOUT.primogemToday,
    `${LAYOUT.primogemToday.prefix ?? ''}${formatNumber(primogemToday)}`,
    image.width,
    scale,
  )
  drawField(
    ctx,
    LAYOUT.moraToday,
    `${LAYOUT.moraToday.prefix ?? ''}${formatNumber(moraToday)}`,
    image.width,
    scale,
  )
  drawField(ctx, LAYOUT.lifetimePrimogem, formatNumber(lifetimeValue), image.width, scale)

  writeFileSync(outputPath, canvas.toBuffer('image/png'))
  return outputPath
}

/** Generate PNG for codes redeemed in the current run only. */
export async function generateDailyReport({
  codes,
  totals,
  lifetimePrimogems,
  outputPath = DEFAULT_OUTPUT,
  templatePath = DEFAULT_TEMPLATE,
  status = 'Checked-In',
  fontPath,
} = {}) {
  return generateReport(
    { codes, totals, lifetimePrimogems },
    { outputPath, templatePath, status, fontPath },
  )
}
