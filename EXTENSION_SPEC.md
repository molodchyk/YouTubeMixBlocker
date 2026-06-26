# Extension Specification

This document records Chrome behavior that should stay stable across releases, especially when YouTube changes its DOM.

## Goals

- Hide YouTube Mix recommendations from supported YouTube surfaces.
- Clean Mix watch URLs so videos open as regular watch URLs.
- Avoid breaking YouTube's own lazy loading, navigation, or continuation state.
- Keep Chrome runtime and Chrome Web Store listing localization explicit and reviewable.
- Open only an optional, privacy-scoped post-uninstall feedback page for Chrome users.

## Supported Surfaces

- Search results pages: `/results`.
- Home and recommendation surfaces.
- Watch-page sidebar recommendations: `/watch`.
- Watch URL cleanup for URLs containing Mix playlist parameters.

## Mix Detection

- A Mix URL is currently detected by a `list=RD...` query parameter.
- The card/container around the matching link is selected by renderer-level containers when possible.
- The extension reports blocked Mixes to the background script for local counters.

## Home Grid Gap Handling

On YouTube's home grid, Mix cards must be soft-collapsed and the early grid rows must be visually compacted without moving DOM nodes.

Rules:

- Keep `ytd-rich-item-renderer` nodes in DOM order. Do not move lower cards upward with DOM insertion APIs.
- Avoid hard-removing normal rich-item Mix renderers on the home grid; YouTube may refill/re-render the same items and still leave row gaps.
- Remove only truly empty rich-item shells whose direct `#content` has no child elements, links, images, thumbnails, or text.
- Use bounded visual compaction with flex `order` only for the early visible home-feed rows where Mix gaps appear.
- Treat soft-blocked Mix items, unhydrated rich items, and ad-blocker hollow rich items as unavailable layout slots.
- Treat a rich item as usable only when its outer box and visible link/thumbnail area are present.
- Re-run bounded compaction on later grid mutations, because YouTube can hydrate replacement cards after the first removal pass.
- Do not apply whole-feed ordering or delayed broad compaction near the continuation loader; that can cause visible scroll jumps when the user reaches the bottom before YouTube finishes loading.
- Mark extension-applied ordering with a private attribute and update by diffing desired order values to minimize layout churn.

## Watch Sidebar Behavior

Chrome build output lives in `dist/`.

On watch pages, Mix sidebar renderers must be soft-collapsed instead of removed from the DOM:

- Set the renderer as hidden.
- Set `display: none !important`.
- Do not call `.remove()` for watch-sidebar recommendation renderers.

Key reason: YouTube's watch sidebar uses continuation items while loading more recommendations. Removing sidebar renderer nodes during continuation loading can leave YouTube's internal list state out of sync, causing an active `ytd-continuation-item-renderer[is-watch-page]` spinner to remain stuck between sidebar videos.

This was observed on:

`https://www.youtube.com/watch?v=vSyPzZ_wsgg`

## Localization Rules

- Chrome runtime locales live under `src/chrome/_locales/`.
- Chrome Web Store long descriptions live under `store-listing/chrome-web-store/listing/`.
- Chrome Web Store what's-new text lives in `store-listing/chrome-web-store/whats_new.json`.
- Run `npm run sync:chrome-locales` after changing generated locale text or store listing footer shape.

## Uninstall Feedback

- Chrome may open `https://molodchyk.com/youtube-mix-blocker/uninstall/` after uninstall.
- The uninstall feedback URL may include only `source=chrome`, the extension version, and the Chrome UI language.
- Do not include user identifiers, local counters, settings, tab URLs, YouTube URLs, or YouTube page content in the uninstall feedback URL.
- The feedback form must remain optional and must be disclosed in `PRIVACY.md` and Chrome Web Store privacy notes.

## Release Rules

- Chrome release packages are built from `dist/`.
- Build with `npm run package`.
- Validate with `npm run check`.
- Bump the manifest version when preparing a new Chrome Web Store release.
