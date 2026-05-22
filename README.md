# YouTube Mix Blocker

<p align="center">
  <a href="https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga">
    <img src="src/icons/icon-128.png" alt="YouTube Mix Blocker icon" width="96" height="96">
  </a>
</p>

A small browser extension that removes YouTube Mix recommendations from YouTube pages and cleans Mix watch URLs so videos open as regular video links.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hcjmmaealhemocjdjfajldoneaidkaga.svg?label=Chrome%20Web%20Store&color=blue)](https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE.txt)

## Features

- Blocks YouTube Mix cards in recommendations.
- Blocks YouTube Mix cards in search results.
- Blocks YouTube Mix cards in watch-page sidebar recommendations.
- Cleans Mix watch URLs by removing Mix playlist parameters.
- Includes an optional popup with counters for blocked Mixes and cleaned URLs.
- Keeps the badge counter disabled by default.
- Supports English, German, and Ukrainian.

## Install

### Chrome Web Store

Install the published extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga).

### From Source

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Build the Chrome extension:

   ```powershell
   npm run build:chrome
   ```

3. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist/` directory.

## Development

Source files live in `src/`. Build output is generated into `dist/` for Chrome and `dist-firefox/` for Firefox.

Useful commands:

```powershell
npm run build:chrome
npm run build:firefox
npm run build:all
npm run check
```

`npm run check` builds both targets and runs syntax checks on the generated JavaScript files.

The browser-specific manifest is generated during the build:

- Chrome uses a Manifest V3 service worker background.
- Firefox uses the shared background script as a Manifest V3 background script.

## Project Structure

- `src/` - extension source files.
- `src/content/` - YouTube page detection, blocking, URL cleanup, and SPA event handling.
- `src/popup/` - extension popup UI.
- `src/_locales/` - extension localization messages.
- `dist/` - generated Chrome build.
- `dist-firefox/` - generated Firefox build.
- `store-listing/` - Chrome Web Store listing text, screenshots, promo images, and review justifications.
- `release/` - locally generated upload packages.

## Privacy

YouTube Mix Blocker does not collect, transmit, sell, or share personal data or browsing data. Settings and counters are stored locally in the browser and are used only to provide the extension's features.

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

Licensed under GPL-3.0-or-later. See [LICENSE.txt](LICENSE.txt).
