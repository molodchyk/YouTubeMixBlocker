# Extension Specification

This document records behavior that should stay stable across releases, especially when YouTube changes its DOM.

## Goals

- Hide YouTube Mix recommendations from supported YouTube surfaces.
- Clean Mix watch URLs so videos open as regular watch URLs.
- Keep browser-specific behavior isolated between Chrome and Firefox builds.
- Avoid breaking YouTube's own lazy loading, navigation, or continuation state.

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

## Chrome Behavior

Chrome build output lives in `dist/`.

On watch pages, Chrome must soft-collapse Mix sidebar renderers instead of removing them from the DOM:

- Set the renderer as hidden.
- Set `display: none !important`.
- Do not call `.remove()` for watch-sidebar recommendation renderers.

Key reason: YouTube's watch sidebar uses continuation items while loading more recommendations. Removing sidebar renderer nodes during continuation loading can leave YouTube's internal list state out of sync, causing an active `ytd-continuation-item-renderer[is-watch-page]` spinner to remain stuck between sidebar videos.

This was observed on:

`https://www.youtube.com/watch?v=vSyPzZ_wsgg`

Chrome-only fix: the Chrome build changes `shouldSoftCollapse()` so watch sidebar renderer tags are hidden rather than removed.

## Firefox Behavior

Firefox build output lives in `dist-firefox/`.

Firefox has a separate search-results guard for normal video results whose URLs use `list=RD` plus the same video id, such as:

`/watch?v=nD6SKgwXRVo&list=RDnD6SKgwXRVo&start_radio=1`

Those are treated as normal video/radio links rather than Mix collection cards in Firefox search results.

## Browser Isolation Rules

- Chrome-only fixes must be applied only to the Chrome build output.
- Firefox-only fixes must be applied only to the Firefox build output.
- Shared `src/` changes are allowed only when the intended behavior is the same in both browsers.
- Before changing shared detection/removal behavior, test both `dist/` and `dist-firefox/`.

## Release Rules

- Chrome release packages are built from `dist/`.
- Firefox release packages are built from `dist-firefox/`.
- Bump the browser-specific manifest version only for the browser being released when the change is browser-specific.
