# Project Status

This file tracks what the Chrome extension is currently supposed to do, what is implemented, what has been tested, and what still needs attention.

## Intended Functionality

The extension is intended to:

- Block YouTube Mix cards on YouTube search results pages.
- Block YouTube Mix cards on YouTube recommendation surfaces.
- Block YouTube Mix cards in the sidebar recommendation column on watch pages.
- Clean YouTube watch URLs by removing Mix playlist parameters.
- Show optional popup counters for blocked Mix cards and cleaned Mix URLs.
- Optionally show a per-page badge counter when the user enables it.
- Let the popup follow system theme by default, with optional light and dark modes.
- Keep Chrome Web Store listing text and extension metadata localized for the tracked 66 Chrome visible locales.

## Feature Matrix

| Feature | Intended | Implemented | Tested | Notes |
|---|---:|---:|---:|---|
| Block Mix cards on search results | Yes | Yes | Needs retest | Detects links containing `list=RD`. |
| Block Mix cards on recommendations | Yes | Yes | Chrome manually verified | Soft-collapses the outer `ytd-rich-item-renderer` on the home grid and visually compacts the early feed rows without DOM reordering. |
| Block Mix cards in watch-page sidebar | Yes | Yes | Chrome manually verified | Soft-collapses sidebar Mix renderers instead of removing them so YouTube continuation loading does not leave stuck spinners. |
| Remove empty recommendation grid slots | Yes | Yes | Chrome manually verified | On the home page, removes truly empty `ytd-rich-item-renderer` shells and skips hidden/hollow rich items left by Mix blocking or ad blockers during early-row compaction. |
| Block Mix cards added after page load | Yes | Yes | Needs retest | Uses a `MutationObserver` because YouTube is a SPA. |
| Clean watch URLs | Yes | Yes | Needs retest | Redirects direct Mix watch URLs to the plain video URL and sanitizes YouTube SPA history writes. |
| Popup all-time counters | Yes | Yes | Needs retest | Tracks total blocked Mix cards, surface breakdown, and cleaned Mix URLs; updates live while popup is open. |
| Optional current-page badge counter | Yes | Yes | Needs retest | Disabled by default; resets on full page loads and YouTube SPA navigation. |
| Popup theme mode | Yes | Yes | Needs retest | Supports system, light, and dark modes. |
| Localized extension name and short description | Yes | Yes | JSON validated | Chrome has 66 runtime locales. |
| Localized Chrome Web Store long descriptions | Yes | Yes | Needs human review | Plain text files live in `store-listing/chrome-web-store/listing/` for all 66 Chrome locales. |
| Chrome build target | Yes | Yes | Syntax checked | `npm run build` outputs `dist/`. |

## Confirmed Working

- Chrome home grid no longer leaves first rows with empty spaces after Mix cards are blocked.
- Chrome home-grid compaction remains smooth when scrolling by limiting visual `order` changes to the early feed rows and avoiding DOM reordering.
- Chrome home-grid compaction handles AdGuard-style hollow rich-item shells by treating non-visible or not-yet-hydrated rich items as unavailable backfill candidates.
- Chrome watch-page sidebar Mix blocking no longer leaves a stuck continuation spinner after scrolling newly loaded sidebar videos.
- Source modularization builds into `dist/content.js`.
- `dist/content.js`, `dist/background.js`, and `scripts/build-content.mjs` pass syntax checks.
- `dist/manifest.json` parses as valid JSON.
- Locale `messages.json` files parse as valid JSON.
- `src/chrome/_locales/` is copied into `dist/_locales/` by the build script.
- `npm run verify:locales` checks Chrome 66-locale coverage, Chrome listing coverage, and `whats_new.json` coverage.

## Needs Manual Testing

- Search results page:
  - Direct load of `https://www.youtube.com/results?...`.
  - Infinite scroll / newly loaded search result items.
  - YouTube SPA navigation into and away from search results.

- Recommendations:
  - Home page recommendations.
  - Newly loaded recommendations after scrolling or navigating.
  - Confirm blocked Mixes do not leave empty rich-grid gaps in the first three visible rows.
  - Confirm aggressive scrolling to the feed bottom does not cause visible up/down scroll jumps while YouTube loads more items.
  - Confirm behavior with and without common ad blockers such as AdGuard.
  - Confirm non-Mix playlist/course cards with `list=PL...` are not blocked.

- Watch page sidebar recommendations:
  - Sidebar Mix cards rendered as `yt-lockup-view-model`.
  - Sidebar Mix cards rendered as older compact video renderer containers.
  - Confirm collapsing sidebar Mix cards does not affect the main video, player, description, comments, or playlist panel.

- Watch URL cleanup:
  - Direct load of a watch URL with `list=RD...`.
  - Direct load of a watch URL with both `list=RD...` and `start_radio`.
  - Confirm direct Mix watch URLs redirect to the plain video URL.
  - Confirm the main watch page content still loads after cleanup.
  - Browser back/forward navigation after cleanup.

- Extension packaging:
  - Load `dist/` as an unpacked extension in Chrome.
  - Confirm localized name/description appear for supported Chrome browser locales.
  - Confirm Arabic, Persian, Hebrew, and Urdu popup UI gets `dir="rtl"`.

- Popup and badge:
  - Confirm the popup opens from the extension action.
  - Confirm all-time counters increase when Mix cards are removed.
  - Confirm counters update live while the popup is open and the page scrolls.
  - Confirm cleaned URL counter increases when a Mix watch URL is cleaned.
  - Confirm detailed breakdown can be hidden and shown again.
  - Confirm badge counter is hidden by default.
  - Confirm badge counter appears only after enabling it and only when current-page blocked count is greater than 0.
  - Confirm system, light, and dark popup theme modes render correctly.
  - Confirm reset counters asks for confirmation and clears totals.

## Known Bugs

- None currently documented.

## Missing / Planned

- Add automated tests for pure URL cleanup and Mix URL detection logic.
- Consider persisting per-tab current-page counters across background service worker restarts if needed.
- Consider splitting `dist/background.js` into `src/background/` if background logic grows.
- Human-review first-pass Chrome Web Store translations before publishing.
- Keep `CHANGELOG.md` updated when behavior changes.

## Project Structure Notes

- Edit content-script source in `src/content/`.
- Edit Chrome extension locale metadata in `src/chrome/_locales/`.
- Run `npm run sync:chrome-locales` after changing generated Chrome locale additions or Chrome store listing footer shape.
- Run `npm run build` to regenerate the Chrome build in `dist/`.
- Load `dist/` in Chrome as the unpacked extension.
- Keep Chrome Web Store long descriptions in `store-listing/chrome-web-store/` as paste-ready plain text.
- Keep observed YouTube DOM notes in `YOUTUBE_ELEMENTS.md`.
