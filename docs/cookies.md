# Cookie Guide

Two separate cookie sets power this project.

| Secret | Used for |
| --- | --- |
| `COOKIE` | Daily HoYoLAB check-in |
| `GIFT_COOKIE` | Genshin code redemption (optional) |

Do not mix them. Check-in only needs `ltuid_v2` and `ltoken_v2`.

---

## COOKIE (check-in)

### Steps

1. Open [HoYoLAB](https://www.hoyolab.com/home) and sign in
2. Open DevTools — `Ctrl+Shift+I` (or right-click → Inspect)
3. **Application** → **Cookies** → `https://www.hoyolab.com` (Firefox: **Storage** → Cookies)
4. Filter for `v2`
5. Copy **`ltuid_v2`** and **`ltoken_v2`**

### Format

```text
ltuid_v2=249806310; ltoken_v2=v2_CAISDG...
```

Use semicolons (`;`), not colons.

Paste into GitHub secret **`COOKIE`** or your local `.env`.

### Screenshots

<details>
<summary>DevTools and cookie locations</summary>

![DevTools](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/81a57cfa-9f2e-48d7-bec6-5ef4edc3b857)

![Application tab](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/ea4bb233-367c-4c41-8c66-30c2bc2f3150)

![Filter v2](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/bf1eec5f-bb1e-4af2-b37b-3c3c252328db)

![ltoken and ltuid](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/3ce70d90-6d5d-4353-ab35-8476c44124a1)

![Cookie string format](https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/4309fcd9-3d6b-43f3-96f2-d8276bea6280)

</details>

---

## GIFT_COOKIE

Used only for automatic Genshin redemption. Check-in does **not** need these values.

### Steps

1. Visit [genshin.hoyoverse.com/en/gift](https://genshin.hoyoverse.com/en/gift)
2. Sign in
3. DevTools → **Application** → Cookies
4. Copy:
   - `account_id_v2`
   - `account_mid_v2`
   - `cookie_token_v2`

### Format

```text
account_id_v2=302545430; account_mid_v2=1v1wthd297_hy; cookie_token_v2=v2_xxxxxxxx
```

Only these three values are required. Ignore tracking cookies (`_HYVUUID`, `DEVICEFP`, `HYV_LOGIN_PLATFORM_*`, etc.).

Add GitHub secret **`GIFT_COOKIE`**. One line per account (same order as `COOKIE` / `GAMES`).

Include **`gi`** in `GAMES` for accounts that should redeem.

If `GIFT_COOKIE` is unset, check-in still runs; redemption is skipped.

Validate locally:

```bash
npm run validate-cookies
```

---

## Troubleshooting

### Error not logged in

Cookies may be wrong or expired. Re-copy from HoYoLAB after a fresh login.

Alternative method (full cookie string):

https://gist.github.com/torikushiii/59eff33fc8ea89dbc0b2e7652db9d3fd

Paste the result into `COOKIE`.

### Redemption fails

- Refresh gift-page cookies (`cookie_token_v2` expires periodically)
- Visit the gift page and attempt any redemption once before copying cookies
- Run `npm run validate-cookies`

---

Keep cookies private. Never commit them or share them publicly.

[← Back to setup](setup.md)
