import { registerFont } from 'canvas'
import { existsSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Registered family when HYWenHei (or --font) is loaded */
export const GENSHIN_FAMILY = 'GenshinUI'

/**
 * Canvas font stack: uses GenshinUI when registered, else system UI substitutes.
 * Matches Genshin’s sans-serif weight (HYWenHei-85W ≈ heavy UI face).
 */
export const UI_FONT = [
  GENSHIN_FAMILY,
  '"Microsoft YaHei"',
  '"PingFang SC"',
  '"Noto Sans CJK SC"',
  '"Source Han Sans SC"',
  '"Helvetica Neue"',
  'Helvetica',
  'Arial',
  'sans-serif',
].join(', ')

/** Repo + game install filenames, highest priority first */
const FONT_FILENAMES = [
  'HYWenHei-Extended.ttf',
  'HYWenHei-85W.ttf',
  'hywenhei-85w.ttf',
  'HYWenHei_85W.ttf',
  'zh-cn.ttf',
  'zh_cn.ttf',
]

const REPO_FONTS_DIR = resolve(ROOT, 'assets', 'fonts')

let registeredPath = null

function genshinInstallCandidates() {
  const home = homedir()
  const dirs = []

  if (process.env.GENSHIN_IMPACT_PATH) {
    dirs.push(process.env.GENSHIN_IMPACT_PATH)
  }

  const fontSub = join(
    'GenshinImpact_Data',
    'StreamingAssets',
    'MiHoYoSDKRes',
    'HttpServerResources',
    'font',
  )

  if (platform() === 'win32') {
    const drives = ['C:', 'D:', 'E:']
    for (const drive of drives) {
      dirs.push(join(drive, 'Program Files', 'Genshin Impact'))
      dirs.push(join(drive, 'Genshin Impact'))
    }
  } else {
    dirs.push(
      join(home, '.local', 'share', 'Steam', 'steamapps', 'common', 'Genshin Impact'),
      join(home, '.var', 'app', 'com.mihoyo.GenshinImpact', 'data', 'GenshinImpact'),
      '/mnt/c/Program Files/Genshin Impact',
    )
  }

  return dirs.map(dir => join(dir, fontSub))
}

export function fontCandidates(customPath) {
  const paths = []

  if (customPath) paths.push(resolve(customPath))

  if (process.env.GENSHIN_FONT) paths.push(resolve(process.env.GENSHIN_FONT))

  for (const name of FONT_FILENAMES) {
    paths.push(join(REPO_FONTS_DIR, name))
  }

  for (const dir of genshinInstallCandidates()) {
    for (const name of FONT_FILENAMES) {
      paths.push(join(dir, name))
    }
  }

  return paths
}

export function findFontFile(customPath) {
  return fontCandidates(customPath).find(p => existsSync(p)) ?? null
}

/**
 * Register HYWenHei (or custom TTF). Safe to call once per process.
 * @returns {{ family: string, path: string | null, registered: boolean }}
 */
export function setupReportFonts(options = {}) {
  if (registeredPath) {
    return { family: GENSHIN_FAMILY, path: registeredPath, registered: true }
  }

  const path = findFontFile(options.fontPath)
  if (!path) {
    return { family: UI_FONT, path: null, registered: false }
  }

  registerFont(path, { family: GENSHIN_FAMILY })
  registeredPath = path
  return { family: UI_FONT, path, registered: true }
}

/** Build canvas font string, e.g. fontWeight(700, 40) */
export function fontWeight(weight, sizePx) {
  return `${weight} ${sizePx}px ${UI_FONT}`
}

export function logFontStatus(result, { quiet = false } = {}) {
  if (quiet) return
  if (result.registered) {
    console.log(`Font: ${GENSHIN_FAMILY} ← ${result.path}`)
    return
  }
  console.warn(
    `Font: using system fallback (HYWenHei not found).\n`
    + `  Place HYWenHei-Extended.ttf in assets/fonts/ or set GENSHIN_FONT=/path/to/file.ttf\n`
    + `  See assets/fonts/README.md`,
  )
}
