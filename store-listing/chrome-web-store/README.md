# Chrome Web Store Listing Assets

This folder stores paste-ready listing text, review notes, and upload assets for the Chrome Web Store.

## Locale Listings

- `listing/<locale>.txt` - flat paste-ready listing text for manual Chrome Web Store copy/paste work.

Use `listing/` when updating the dashboard by hand, so all locale text files are in one folder.

## Media

- `media/screenshots/en/*.png` - default English screenshots.
- `media/screenshots/de/*.png` - German localized screenshots.
- `media/screenshots/uk/*.png` - Ukrainian localized screenshots.
- `media/promo/` - global small and marquee promo tiles.

Chrome Web Store screenshots can be localized per listing language. Only English, German, and Ukrainian screenshots are included for now.

Note: the extension source uses Chrome's current Hebrew locale code `he` under `src/_locales/`, while the Chrome Web Store dashboard may label Hebrew as `iw`. The store listing folder uses `iw/` to match the dashboard.

Chrome Web Store promo tiles are global only. The small promo tile and marquee promo tile cannot be localized separately.

## Review Copy

- `justifications.md` - permission, privacy, and review justification copy.
- `review-responses.md` - paste-ready developer replies for store reviews.
