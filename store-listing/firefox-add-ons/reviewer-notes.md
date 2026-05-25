# Firefox Add-ons Reviewer Notes

YouTube Mix Blocker runs only on `https://www.youtube.com/*`. It removes YouTube Mix cards from YouTube surfaces and removes Mix playlist parameters from YouTube watch URLs.

## Permissions

- `storage`: stores local-only settings and counters for the popup.
- `activeTab`: lets the popup read the current active tab id so it can show the current-page counter.
- `host_permissions` for `https://www.youtube.com/*`: lets the content script run on YouTube pages only.

## Privacy

The extension does not collect, transmit, sell, or share personal data or browsing data. It has no analytics, tracking, remote code, or external server calls. The Firefox manifest declares `browser_specific_settings.gecko.data_collection_permissions.required` as `["none"]`.

## Testing

1. Install the submitted package temporarily in Firefox.
2. Open YouTube home, search results, or a watch page with YouTube Mix recommendations.
3. Confirm Mix cards with URLs containing `list=RD...` are removed while regular video cards remain.
4. Open a Mix watch URL such as `https://www.youtube.com/watch?v=VIDEO_ID&list=RD...&start_radio=1`.
5. Confirm the URL is cleaned to a regular watch URL without `list` or `start_radio`.
6. Open the extension popup and confirm counters/settings render and remain local.

## Build

Install dependencies with `npm install`, then run:

```powershell
npm run package:firefox
```

The Firefox package is generated at `release/youtube-mix-blocker-firefox-1.5.1.zip`.
