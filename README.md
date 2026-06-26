# YouTube Mix Blocker

<p align="center">
  <a href="https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga">
    <img src="src/icons/icon-128.png" alt="YouTube Mix Blocker icon" width="96" height="96">
  </a>
</p>

A small Chrome extension that removes YouTube Mix recommendations from YouTube pages and cleans Mix watch URLs so videos open as regular video links.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hcjmmaealhemocjdjfajldoneaidkaga.svg?label=Chrome%20Web%20Store&color=blue)](https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga)
[![License: GPL-3.0-only](https://img.shields.io/badge/License-GPL--3.0--only-blue.svg)](LICENSE)

## Features

- Blocks YouTube Mix cards in recommendations.
- Blocks YouTube Mix cards in search results.
- Blocks YouTube Mix cards in watch-page sidebar recommendations.
- Removes empty home-grid spaces left behind after Mix cards are blocked.
- Cleans Mix watch URLs by removing Mix playlist parameters.
- Includes an optional popup with counters for blocked Mixes and cleaned URLs.
- Keeps the badge counter disabled by default.
- Supports 66 localized Chrome extension UI languages.

## Install

Install the published extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga).

## From Source

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Build the Chrome extension:

   ```powershell
   npm run build
   ```

3. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist/` directory.

## Development

Source files live in `src/`. Build output is generated into `dist/`.

Useful commands:

```powershell
npm run build
npm run sync:chrome-locales
npm run verify:locales
npm run verify:manifest
npm run verify:release
npm run package
npm run check
```

`npm run check` builds the Chrome extension, runs verification, and syntax-checks generated JavaScript files.
`npm run verify:locales` confirms Chrome has exactly 66 supported locale folders and matching Chrome Web Store listing files.
`npm run verify:manifest` checks generated manifest paths.
`npm run verify:release` runs release-facing metadata, privacy, and package-shape checks.

## Project Structure

- `src/` - extension source files.
- `src/content/` - YouTube page detection, blocking, URL cleanup, and SPA event handling.
- `src/popup/` - extension popup UI.
- `src/chrome/_locales/` - Chrome runtime localization messages.
- `docs/` - Chrome Web Store automation fields, privacy form answers, and release checks.
- `dist/` - generated Chrome build.
- `EXTENSION_SPEC.md` - Chrome behavior notes and release rules.
- `store-listing/chrome-web-store/` - Chrome Web Store listing text, screenshots, promo images, and review notes.
- `release/` - locally generated upload packages.

## Related Project

The Firefox version now lives in its own repository:

```text
https://github.com/molodchyk/YouTubeMixBlockerFirefox
```

## Privacy

YouTube Mix Blocker does not collect, transmit, sell, or share personal data or browsing data while installed. Settings and counters are stored locally in the browser and are used only to provide the extension's features.

The extension uses `activeTab`, `storage`, and the `https://www.youtube.com/*` host permission. It does not make network requests while installed and does not use analytics, ads, tracking, content scripts on non-YouTube sites, or remote code.

After uninstalling the Chrome version, Chrome may open an optional feedback page at `https://molodchyk.com/youtube-mix-blocker/uninstall/`. The extension passes only generic `source`, `version`, and UI-language parameters to that page.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md).

## Feedback

Feedback is welcome. You can leave a review on the [Chrome Web Store](https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga), open an issue on GitHub, or write to [molodchykr@gmail.com](mailto:molodchykr@gmail.com).

## Support

If this extension saves you time and you want to support its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-FFDD00?logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/molodchyk)
[![Patreon](https://img.shields.io/badge/Patreon-support-F96854?logo=patreon&logoColor=fff)](https://www.patreon.com/OMolodchyk)

## License

Licensed under GPL-3.0-only. See [LICENSE](LICENSE).
