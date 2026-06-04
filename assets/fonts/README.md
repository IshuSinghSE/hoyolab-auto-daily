# Report fonts

Daily report images use **HYWenHei** (Genshin Impact UI typeface).

## Setup (recommended)

Place your font in this folder. The script prefers:

1. **`HYWenHei-Extended.ttf`** (default for this repo)
2. `HYWenHei-85W.ttf` from a game install:

   `GenshinImpact_Data/StreamingAssets/MiHoYoSDKRes/HttpServerResources/font/HYWenHei-85W.ttf`

3. Regenerate:

   ```bash
   npm run generate-report
   ```

The font is proprietary — do **not** commit `.ttf` files to git.

## Alternatives

| Method | Example |
|--------|---------|
| Env var | `GENSHIN_FONT=/path/to/HYWenHei-85W.ttf npm run generate-report` |
| CLI | `node scripts/generate-report.js --font /path/to/HYWenHei-85W.ttf` |
| Game path | `GENSHIN_IMPACT_PATH="/path/to/Genshin Impact"` (script scans `.../font/`) |

If no file is found, the script falls back to **Microsoft YaHei**, **PingFang SC**, **Noto Sans CJK SC**, then **Helvetica Neue** / Arial.
