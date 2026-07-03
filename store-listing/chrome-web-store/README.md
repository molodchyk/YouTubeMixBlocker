# Chrome Web Store Listing Assets

This folder stores paste-ready listing text, review notes, and upload assets for the Chrome Web Store.

## Locale Listings

- `listing/<locale>.txt` - flat paste-ready listing text for manual Chrome Web Store copy/paste work.

Use `listing/` when updating the dashboard by hand, so all locale text files are in one folder. The folder is expected to contain one `.txt` file for each of the 66 Chrome Web Store visible locales tracked by `npm run verify:locales`.

## Media

- `media/screenshots/manifest.json` - canonical screenshot slots, store icon reference, and Chrome Web Store image rules.
- `media/screenshots/*.png` - global/default screenshots copied from the English fallback.
- `media/screenshots/<locale>/*.png` - localized screenshots for the 66 Chrome Web Store visible locales.
- `media/screenshots/copy/*.json` - slot-specific screenshot copy for generated localized text.
- `media/screenshots/source/` - inspectable generated previews and source-only files.
- `media/promo/` - global small and marquee promo tiles.
- `media/promo-videos/global.txt` - global Chrome Web Store promo video URL.
- `media/promo-videos/localized/<locale>.txt` - localized Chrome Web Store promo video URL for one locale.

Chrome Web Store screenshots can be localized per listing language. This project keeps localized screenshot folders for all 66 Chrome Web Store visible locales and root-level global screenshots for fallback/manual upload use.

Screenshot localization is slot-based. The English folder is canonical, and every localized screenshot folder should use the same filenames and order:

```text
media/screenshots/<locale>/
  01-hide-youtube-mix-cards-1280x800.png
  02-popup-current-page-counters-1280x800.png
  03-mix-badge-example-1280x800.png
```

After updating the English fallback screenshot files, run:

```powershell
npm run sync:store-screenshot-globals
```

Run `npm run qa:store-screenshot-copy` after changing screenshot text. It validates locale coverage, required text fields, untranslated English fragments in non-English copy, known bad literal phrasing, and suspicious `YouTube Mix` title wording in localized slot `01` copy. This is copy QA, not a replacement for human language review.

Use `npm run qa:store-screenshot-copy -- --write-report` to write a review table to `media/screenshots/source/screenshot-copy-review.md` for manual locale review.

Run `npm run verify:store-media` after changing screenshots. It validates known locale folders, Chrome Web Store dimensions, file count, filename parity, and 24-bit PNG/no-alpha requirements. Use `npm run verify:store-media:all-locales` only when intentionally checking whether all 66 Chrome locales have localized screenshot folders.

Run `npm run verify:store-screenshot-layout` after changing generated screenshot templates or screenshot copy. It renders the generated HTML in headless Chrome and fails on marked text containers that overflow before screenshots are written.

Screenshot rendering is split by slot. Slot `01` is the first screenshot template and uses explicit screenshot copy from `media/screenshots/copy/01-hide-youtube-mix-cards.json`, with the current English screenshot as the visual reference. Slot `02` renders the current-page popup counters from `media/screenshots/copy/02-popup-current-page-counters.json` plus the localized extension popup strings. Slot `03` is an actual Mix-card reference screenshot and is copied rather than recreated.

To regenerate the inspectable English slot `01` preview inside the project:

```powershell
npm run render:store-screenshots:preview
```

The preview is written to `media/screenshots/source/render-preview/en/` and is not an upload locale folder.

To regenerate the inspectable English slot `02` popup-counter preview:

```powershell
npm run render:store-screenshots:popup-preview
```

The preview is written to `media/screenshots/source/render-preview/en/` and is not an upload locale folder.

To render a full 66-locale preview batch without touching upload folders:

```powershell
npm run render:store-screenshots:preview-all
```

Screenshots can be rendered with:

```powershell
npm run render:store-screenshots -- --locales=en,de,uk
npm run render:store-screenshots:all
```

The renderer uses Chrome or Edge headless mode. Set `CHROME_PATH` or pass `--chrome=C:\Path\To\chrome.exe` if the browser is not installed in a default location. It applies right-to-left direction for Arabic, Persian, Hebrew, and Urdu, writes the canonical screenshot filenames into each locale folder, and converts PNG output to 24-bit/no-alpha when needed. For a true all-locale screenshot batch, add screenshot copy files before running `render:store-screenshots:all`; use `--allow-copy-fallback` only for layout testing.

`npm run verify:store-media` validates the slot-copy locale coverage before rendering. It should fail if a rendered screenshot slot is missing copy for any Chrome Web Store locale.

The extension source and Chrome Web Store listing files use Chrome's current Hebrew locale code `he`. Do not add a parallel legacy `iw.txt` listing file.

Chrome Web Store promo tiles are global only. The small promo tile and marquee promo tile cannot be localized separately.

Chrome Web Store promo video URLs are stored as plain text metadata files, not downloaded video assets. Each file must contain exactly one YouTube watch URL on the first non-empty line, for example:

```text
https://www.youtube.com/watch?v=nFYpu2wlTmg
```

The checked-in promo video URLs are deterministic placeholders so StorePilot can see the complete global and 66-locale field structure before real videos exist. Replace only the URL values when real promo videos are produced. The global promo video and localized promo videos are independent Chrome Web Store fields; `media/promo-videos/localized/en.txt` is the English localized promo video, not the global fallback.

## Review Copy

- `justifications.md` - permission, privacy, and review justification copy.
- `review-responses.md` - paste-ready developer replies for store reviews.
