# Chrome Web Store Justifications

## Single Purpose

YouTube Mix Blocker has one purpose: to remove YouTube Mix recommendations from YouTube pages and clean YouTube Mix watch URLs so videos open as regular video links. It does not replace the feed, add recommendations, or change unrelated YouTube content.

## Permission Justifications

### activeTab

The activeTab permission is used only when the user opens the extension popup for the current YouTube tab. It lets the extension show page-specific counters and status for the active page.

### storage

The storage permission is used to save local extension settings and counters, such as whether the badge counter and detailed breakdown are enabled. This data stays in the browser and is not transmitted.

### Host Permission: https://www.youtube.com/*

The extension needs access to https://www.youtube.com/* because its single purpose is to work on YouTube pages. It detects YouTube Mix recommendations, removes those Mix cards from the page, and cleans Mix playlist parameters from YouTube watch URLs. It does not access any non-YouTube websites.

## Privacy / Data Use

The extension only runs on YouTube pages. It does not collect, sell, or transmit browsing data. Settings and counters are stored locally in the browser.

## Privacy Policy URL

https://github.com/molodchyk/YouTubeMixBlocker/blob/main/PRIVACY.md
