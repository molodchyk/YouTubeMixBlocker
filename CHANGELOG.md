# Changelog

## Version 1.5.4

- Adds an optional Chrome post-uninstall feedback page for voluntary issue and feature feedback.
- Documents the feedback flow in the privacy policy and Chrome Web Store privacy notes.
- Keeps uninstall feedback URL parameters limited to source, version, and Chrome UI language.

## Version 1.5.3

- Expands Chrome runtime and Chrome Web Store localization coverage to the tracked 66 Chrome visible locales.
- Splits Firefox development into the separate `YouTubeMixBlockerFirefox` repository.
- Adds locale, manifest, and release verification scripts.
- Normalizes project license metadata to GPL-3.0-only.

## Version 1.5.2

- Removes empty spaces left in the YouTube home grid after Mix cards are blocked.
- Fixes a Chrome watch-sidebar issue where YouTube's loading spinner could remain stuck after scrolling sidebar recommendations.
- Changes Chrome watch-sidebar Mix blocking to soft-collapse Mix renderers instead of removing them, preserving YouTube's continuation loading state.

## Version 1.5.1

- Adds 50-language extension UI localization.
- Improves popup layout resilience for longer localized labels.

## Version 1.5

- Adds automatic cleanup of YouTube Mix watch URLs.
- Improves blocking of YouTube Mix cards in watch-page sidebar recommendations.
- Adds an optional popup with all-time counters and a disabled-by-default current-page badge counter.
- Adds English, German, and Ukrainian localization support.
- Reworks the extension internals for easier maintenance.

## Version 1.4

- Blocks YouTube Mixes on the recommended page.
- Blocks YouTube Mixes on YouTube search results pages.

## Version 1.0

- Blocks YouTube Mixes from the search "youtube.com/results" page.
