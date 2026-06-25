# AMO Listing Localization Source

This directory is the source of truth for localized Mozilla Add-ons listing metadata.

Each locale lives in its own directory:

```text
amo-listing/
  en-US/
    metadata.json
    description.md
```

`metadata.json` contains short fields:

```json
{
  "name": "YouTube Mix Blocker",
  "summary": "Blocks YouTube Mixes and cleans Mix watch URLs."
}
```

`description.md` contains the AMO long description in Markdown. Keep this source human-readable; AMO may return rendered HTML through the public API.

Use `AMO_MARKDOWN_REFERENCE.md` when formatting descriptions. AMO supports only a limited Markdown subset.

Do not add translated locale directories until the English formatting has been reviewed and approved.
