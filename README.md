# YouTubeMixBlocker

A simple Chrome extension to block YouTube Mixes and clean Mix watch URLs.

Works on recommendation pages, YouTube search results, and watch-page sidebar recommendations. The popup shows optional counters for blocked Mix cards and cleaned Mix watch URLs, while the badge counter stays off by default.

## Get it on Chrome Web Store
[![Get it on Chrome Store](https://img.shields.io/chrome-web-store/v/hcjmmaealhemocjdjfajldoneaidkaga.svg?label=Chrome%20Web%20Store&color=blue)](https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga)

## Development
Edit source files in `src/`, then run `npm run build`.

- `npm run build:chrome` generates `dist/` for Chrome and Chrome Web Store.
- `npm run build:firefox` generates `dist-firefox/` as the Firefox/AMO build target.
- `npm run build:all` generates both browser targets.

The browser-specific manifest is generated during the build. Chrome uses a Manifest V3 service worker background; Firefox uses the shared background script as a Manifest V3 background script.

Chrome Web Store listing text is kept in `store-listing/chrome-web-store/` as paste-ready plain text files, one per locale.

## Feedback
Any feedback is welcomed! Leave a review on the [Chrome Web Store](https://chromewebstore.google.com/detail/youtube-mix-blocker/hcjmmaealhemocjdjfajldoneaidkaga), or open an issue here, or write me an email at [molodchykr@gmail.com](mailto:molodchykr@gmail.com).

## Support
If this extension saves you time and you want to support its development, you can [buy me a coffee](https://buymeacoffee.com/molodchyk) or support me on [Patreon](https://www.patreon.com/OMolodchyk).

## License
Licensed under GPL-3.0-or-later. See [LICENSE.txt](LICENSE.txt).
