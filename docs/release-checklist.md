# Release Checklist

## Automated Checks

Run these commands before preparing a browser-store package:

```powershell
npm run sync:chrome-locales
npm run build:chrome
npm run build:firefox
npm run verify:locales
npm run verify:manifest
npm run verify:release
npm run check
npm run lint:firefox
```

## Chrome Package

- Build from `dist/`.
- Confirm `dist/_locales/` contains exactly the 66 Chrome Web Store visible locales tracked in `scripts/verify-locales.mjs`.
- Confirm Chrome-only locale additions are not copied into `dist-firefox/_locales/`.
- Confirm the Chrome Web Store detailed-description files live under `store-listing/chrome-web-store/listing/` and include the GPL-3.0 source footer.
- Upload `release/youtube-mix-blocker-chrome-1.5.3.zip` only after rebuilding it with `npm run package:chrome`.
- `npm run package:chrome` removes older `release/youtube-mix-blocker-chrome-*.zip` files before writing the latest CWS upload zip.

## Firefox Package

- Build from `dist-firefox/`.
- Keep Firefox runtime localization separate from Chrome Web Store listing localization.
- Upload `release/youtube-mix-blocker-firefox-1.5.1.zip` only after rebuilding it with `npm run package:firefox`.
- `npm run package:firefox` removes older AMO add-on upload zips before writing the latest AMO upload zip.
- Use the Firefox Add-ons notes under `store-listing/firefox-add-ons/` for AMO-specific metadata.

## Manual Browser Checks

- Load `dist/` unpacked in Chrome and confirm the popup opens, counters render, and Mix blocking still runs on YouTube.
- Confirm localized Chrome name, description, and popup strings with at least one Latin, one CJK, and one RTL locale.
- For `ar`, `fa`, `he`, and `ur`, confirm the popup root has the matching `lang` value and `dir="rtl"`.
- Load `dist-firefox/` as a temporary add-on in Firefox and confirm Firefox did not inherit Chrome-only locale folders.
