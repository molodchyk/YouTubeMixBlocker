# Firefox Add-ons Listing Fields

Paste-ready values for the Firefox Add-ons Developer Hub listing form.

## Add-on

Name:

```text
YouTube Mix Blocker
```

Add-on URL:

```text
https://addons.mozilla.org/addon/youtube-mix-blocker/
```

Summary:

```text
Blocks YouTube Mixes and cleans Mix watch URLs.
```

Description:

```markdown
YouTube Mix Blocker removes YouTube Mix recommendations from YouTube pages and cleans Mix watch URLs so videos open as regular video links.

It is designed to stay quiet and minimal: no feed replacement, no recommendations of its own, and no attention-grabbing UI unless you choose to open the popup.

Features

- Blocks YouTube Mix cards in recommendations.
- Blocks YouTube Mix cards in search results.
- Blocks YouTube Mix cards in watch-page sidebar recommendations.
- Cleans Mix watch URLs by removing Mix playlist parameters.
- Includes optional counters for blocked Mixes and cleaned URLs.
- Keeps the badge counter disabled by default.

Privacy

This extension only runs on YouTube pages. It does not collect, sell, or transmit your browsing data. Settings and counters stay locally in the browser.

Open source

Open source under the GPL-3.0 license:
https://github.com/molodchyk/YouTubeMixBlocker
```

Experimental:

```text
No
```

Requires payment, non-free services or software, or additional hardware:

```text
No
```

Categories:

```text
Photos, Music & Videos
Search Tools
Privacy & Security
```

## Screenshots

Caption 1:

```text
YouTube home page with Mix recommendations removed from the feed.
```

Caption 2:

```text
Extension popup showing local counters for blocked Mix cards and cleaned Mix URLs.
```

Caption 3:

```text
Example of a YouTube Mix card that the extension detects and blocks.
```

Screenshot requirements:

```text
Use PNG if possible. Maximum and recommended screenshot size: 2400 x 1800 pixels.
```

Support email:

```text
molodchykr@gmail.com
```

Support website:

```text
https://github.com/molodchyk/YouTubeMixBlocker/issues
```

License:

```text
GNU General Public License v3.0 only
```

Privacy Policy:

```text
YouTube Mix Blocker does not collect, transmit, sell, or share personal data or browsing data.

The extension runs only on YouTube pages. It uses local browser storage only for extension settings and optional counters, such as blocked Mix cards and cleaned Mix URLs. This data stays on your device and is not sent to the developer or to any external server.

The extension does not use analytics, tracking, advertising, remote code, or external services.

Full privacy policy:
https://github.com/molodchyk/YouTubeMixBlocker/blob/main/PRIVACY.md
```

Notes to Reviewer:

```text
YouTube Mix Blocker only runs on https://www.youtube.com/.

It removes YouTube Mix cards from YouTube home recommendations, search results, and watch-page sidebar recommendations. It also removes Mix playlist parameters from YouTube watch URLs so videos open as normal watch links.

The extension uses the storage permission only for local settings and optional counters shown in the popup. The activeTab permission is used by the popup to read the current tab id for the current-page counter. The YouTube host permission is needed so the content script can run on YouTube pages.

The extension does not collect, transmit, sell, or share personal data or browsing data. It has no analytics, tracking, remote code, or external server calls. The Firefox manifest declares data_collection_permissions.required as none.

Suggested review checks:

Install the submitted package temporarily in Firefox. Open YouTube home, search results, or a watch page that has YouTube Mix recommendations. Mix cards with URLs containing list=RD should be removed while normal video cards remain. Open a Mix watch URL such as https://www.youtube.com/watch?v=VIDEO_ID&list=RD...&start_radio=1 and confirm it is cleaned to a normal watch URL without list or start_radio. Open the extension popup and confirm the counters and settings render.

Build instructions:

Install dependencies with npm install, then run npm run package:firefox. The Firefox package is generated at release/youtube-mix-blocker-firefox-1.5.1.zip.
```

## What's New

Version:

```text
1.5.1
```

Release notes:

```text
- Added 50-language extension UI localization.
- Improved Firefox home-page Mix blocking for Mix URLs that use list=RD{videoId}.
- Fixed Firefox current-page badge counts across YouTube navigation.
- Fixed a Firefox watch-sidebar issue where YouTube's loading spinner could remain stuck after scrolling newly loaded sidebar recommendations.
- Includes all reliability improvements from version 1.5: Mix URL cleanup, watch-sidebar blocking, and optional counters.
```

## Upload Package

```text
release/youtube-mix-blocker-firefox-1.5.1.zip
```

Upload source code:

```text
release/youtube-mix-blocker-firefox-1.5.1-source.zip
```

GitHub release:

```text
https://github.com/molodchyk/YouTubeMixBlocker/releases/tag/firefox-v1.5.1
```

## Additional Details

Tags:

```text
youtube
music
content blocker
privacy
search
streaming
```

Contributions URL:

```text
https://buymeacoffee.com/molodchyk
```

Alternative contributions URL:

```text
https://www.patreon.com/OMolodchyk
```

Default Locale:

```text
English (US)
```

Homepage:

```text
https://github.com/molodchyk/YouTubeMixBlocker
```

## Technical Details

Developer Comments:

```text
YouTube Mix Blocker is open source and intentionally minimal. It only runs on YouTube pages, does not use remote code, and does not collect or transmit browsing data.

The Firefox build uses scripts/build-content.mjs to combine readable source files from src/content/ into dist-firefox/content.js, apply Firefox-specific compatibility adjustments, and copy Firefox runtime locales from src/firefox/_locales/. The generated JavaScript is not minified or obfuscated.
```

UUID:

```text
youtube-mix-blocker@molodchyk.dev
```

Whiteboard:

```text

```

## Source Code Question

Do you use any code generators, minifiers, bundlers, template engines, or other tools that process source files into files included in the extension?

Answer:

```text
Yes
```

Reason:

```text
The extension does not use minification or obfuscation, but it does use scripts/build-content.mjs to generate the submitted Firefox build. That script combines the readable source files in src/content/ into dist-firefox/content.js, applies Firefox-specific compatibility adjustments, and copies static files such as the manifest, popup, icons, background script, and Firefox runtime locale files from src/firefox/_locales/ into dist-firefox.
```

Source code / build instructions to provide if AMO asks:

```text
The source code is available at https://github.com/molodchyk/YouTubeMixBlocker.

To reproduce the Firefox package:

Use Node.js v24.16.0 and npm 10.5.0.

Install Node.js from https://nodejs.org/.

From the repository root, run:

npm install
npm run package:firefox

This generates release/youtube-mix-blocker-firefox-1.5.1.zip from the source tree.

The relevant build script is scripts/build-content.mjs. The generated JavaScript is readable and not minified or obfuscated.

The source package includes AMO_SOURCE_README.md with the same build instructions.
```
