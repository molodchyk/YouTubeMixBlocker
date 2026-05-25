# Firefox Add-ons Submission Checklist

Upload package:

`release/youtube-mix-blocker-firefox-1.5.1.zip`

AMO path:

https://addons.mozilla.org/en-US/developers/addon/submit/distribution

Recommended choices:

- Distribution: On this site.
- Platforms: Firefox Desktop. Android can be left disabled unless you want to test and support it explicitly.
- License: GPL-3.0-or-later.
- Source code required: No, unless AMO asks for it. The submitted JavaScript is readable and not minified or obfuscated.
- Privacy policy: Use `PRIVACY.md`.
- Support email: `molodchykr@gmail.com`.
- Category: Productivity or Search Tools.

Validation commands already configured:

```powershell
npm run check
npm run lint:firefox
npm run package:firefox
```

First-submission notes:

- Manifest V3 Firefox submissions need a stable `browser_specific_settings.gecko.id`.
- New Firefox extensions submitted after November 3, 2025 need `browser_specific_settings.gecko.data_collection_permissions`.
- This package uses `required: ["none"]` because the extension does not collect or transmit data.
