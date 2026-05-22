# Project Status

This file tracks what the extension is currently supposed to do, what is implemented, what has been tested, and what still needs attention.

## Intended Functionality

The extension is intended to:

- Block YouTube Mix cards on YouTube search results pages.
- Block YouTube Mix cards on YouTube recommendation surfaces.
- Block YouTube Mix cards in the sidebar recommendation column on watch pages.
- Clean YouTube watch URLs by removing Mix playlist parameters.
- Show optional popup counters for blocked Mix cards and cleaned Mix URLs.
- Optionally show a per-page badge counter when the user enables it.
- Let the popup follow system theme by default, with optional light and dark modes.
- Keep Chrome Web Store listing text and extension metadata localizable.
- Keep the source tree ready for separate Chrome and Firefox extension builds.

## Feature Matrix

| Feature | Intended | Implemented | Tested | Notes |
|---|---:|---:|---:|---|
| Block Mix cards on search results | Yes | Yes | Needs retest | Detects links containing `list=RD`. |
| Block Mix cards on recommendations | Yes | Yes | Needs retest | Soft-collapses the outer `ytd-rich-item-renderer` on the home grid to avoid blank slots without triggering aggressive grid refills. |
| Block Mix cards in watch-page sidebar | Yes | Yes | Needs retest | Targets sidebar recommendation containers such as `yt-lockup-view-model`; broad fallback removal is disabled on `/watch`. |
| Remove empty recommendation grid slots | Yes | Yes | Needs retest | On the home page, removes empty `ytd-rich-item-renderer` slots left behind after Mix removal. |
| Block Mix cards added after page load | Yes | Yes | Needs retest | Uses a `MutationObserver` because YouTube is a SPA. |
| Clean watch URLs | Yes | Yes | Needs retest | Redirects direct Mix watch URLs to the plain video URL and sanitizes YouTube SPA history writes. |
| Popup all-time counters | Yes | Yes | Needs retest | Tracks total blocked Mix cards, surface breakdown, and cleaned Mix URLs; updates live while popup is open. |
| Optional current-page badge counter | Yes | Yes | Needs retest | Disabled by default; resets on full page loads and YouTube SPA navigation. |
| Popup theme mode | Yes | Yes | Needs retest | Supports system, light, and dark modes. |
| Handle YouTube SPA navigation | Yes | Yes | Needs retest | Hooks `history.pushState` and `popstate`. |
| Localized extension name and short description | Yes | Yes | JSON validated | English, German, and Ukrainian are present. |
| Localized Chrome Web Store long descriptions | Yes | Yes | Needs human review | Plain text files live in `store-listing/chrome-web-store/`. |
| Chrome build target | Yes | Yes | Syntax checked | `npm run build:chrome` outputs `dist/`. |
| Firefox build target | Yes | Scaffolded | Needs manual testing | `npm run build:firefox` outputs `dist-firefox/`; Firefox runtime compatibility still needs testing. |

## Confirmed Working

- Source modularization builds into `dist/content.js`.
- `dist/content.js`, `dist/background.js`, and `scripts/build-content.mjs` pass syntax checks.
- `dist/manifest.json` parses as valid JSON.
- `dist-firefox/manifest.json` parses as valid JSON.
- Locale `messages.json` files parse as valid JSON.
- `src/_locales/` is copied into `dist/_locales/` by the build script.
- `src/_locales/` is copied into `dist-firefox/_locales/` by the build script.

## Needs Manual Testing

- Search results page:
  - Direct load of `https://www.youtube.com/results?...`.
  - Infinite scroll / newly loaded search result items.
  - YouTube SPA navigation into and away from search results.

- Recommendations:
  - Home page recommendations.
  - Newly loaded recommendations after scrolling or navigating.
  - Confirm blocked Mixes do not leave empty rich-grid gaps.
  - Confirm non-Mix playlist/course cards with `list=PL...` are not blocked.

- Watch page sidebar recommendations:
  - Sidebar Mix cards rendered as `yt-lockup-view-model`.
  - Sidebar Mix cards rendered as older compact video renderer containers.
  - Confirm removing sidebar Mix cards does not remove the main video, player, description, comments, or playlist panel.

- Watch URL cleanup:
  - Direct load of a watch URL with `list=RD...`.
  - Direct load of a watch URL with both `list=RD...` and `start_radio`.
  - Confirm direct Mix watch URLs redirect to the plain video URL.
  - Confirm the main watch page content still loads after cleanup.
  - Clicking into a Mix watch URL through YouTube navigation.
  - Browser back/forward navigation after cleanup.

- Extension packaging:
  - Load `dist/` as an unpacked extension in Chrome.
  - Confirm localized name/description appear for supported browser locales.
  - Load `dist-firefox/` as a temporary add-on in Firefox desktop.
  - Confirm whether Firefox needs a `browser.*` compatibility layer for storage, tabs, action, and runtime APIs.
  - Confirm whether the same Firefox build can run on Firefox Android.

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

- Add a repeatable manual release checklist.
- Add a Firefox/AMO release checklist after the temporary add-on build is manually tested.
- Add automated tests for pure URL cleanup and Mix URL detection logic.
- Consider persisting per-tab current-page counters across background service worker restarts if needed.
- Consider splitting `dist/background.js` into `src/background/` if background logic grows.
- Human-review German and Ukrainian store listing translations before publishing.
- Keep `CHANGELOG.md` updated when behavior changes.

## Project Structure Notes

- Edit content-script source in `src/content/`.
- Edit extension locale metadata in `src/_locales/`.
- Run `npm run build:chrome` to regenerate the Chrome build in `dist/`.
- Run `npm run build:firefox` to regenerate the Firefox build in `dist-firefox/`.
- Load `dist/` in Chrome as the unpacked extension.
- Load `dist-firefox/` in Firefox as a temporary add-on.
- Keep Chrome Web Store long descriptions in `store-listing/chrome-web-store/` as paste-ready plain text.
- Keep observed YouTube DOM notes in `YOUTUBE_ELEMENTS.md`.
