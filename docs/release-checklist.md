# Release Checklist

## Automated Checks

Run these commands before preparing a Chrome Web Store package:

```powershell
npm run sync:chrome-locales
npm run build
npm run verify:locales
npm run verify:manifest
npm run verify:release
npm run check
```

## Chrome Package

- Build from `dist/`.
- Confirm `dist/_locales/` contains exactly the 66 Chrome Web Store visible locales tracked in `scripts/verify-locales.mjs`.
- Confirm the Chrome Web Store detailed-description files live under `store-listing/chrome-web-store/listing/` and include the GPL-3.0 source footer.
- Confirm the optional uninstall feedback page at `https://molodchyk.com/youtube-mix-blocker/uninstall/` is deployed and posts to the intended Formspree endpoint before publishing a build that opens it.
- Upload `release/youtube-mix-blocker-chrome-1.5.4.zip` only after rebuilding it with `npm run package`.
- `npm run package` removes older `release/youtube-mix-blocker-chrome-*.zip` files before writing the latest CWS upload zip.

## Manual Chrome Checks

- Load `dist/` unpacked in Chrome and confirm the popup opens, counters render, and Mix blocking still runs on YouTube.
- Confirm localized Chrome name, description, and popup strings with at least one Latin, one CJK, and one RTL locale.
- For `ar`, `fa`, `he`, and `ur`, confirm the popup root has the matching `lang` value and `dir="rtl"`.
