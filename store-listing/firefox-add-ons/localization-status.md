# Firefox Localization Status

Last updated: 2026-06-25

## Runtime Extension UI

Status: localized.

Firefox runtime locale source:

```text
src/firefox/_locales/
```

Current Firefox runtime UI locale count: 50.

Locales:

```text
ar, bg, bn, ca, cs, da, de, el, en, es, es_419, et, fi, fil, fr, gu,
he, hi, hr, hu, id, it, ja, kn, ko, lt, lv, ml, mr, ms, nl, no, pl,
pt_BR, pt_PT, ro, ru, sk, sl, sr, sv, sw, ta, te, th, tr, uk, vi,
zh_CN, zh_TW
```

Verification command:

```powershell
npm run verify:locales
```

## AMO Listing Metadata

Status: English source structured; description localization paused until English formatting is approved.

AMO listing source:

```text
store-listing/firefox-add-ons/amo-listing/
```

Current source locales:

```text
en-US
```

English source files:

```text
store-listing/firefox-add-ons/amo-listing/en-US/metadata.json
store-listing/firefox-add-ons/amo-listing/en-US/description.md
```

Generated preview payload:

```text
store-listing/firefox-add-ons/amo-listing.generated.json
```

Preview/build commands:

```powershell
npm run amo:listing:preview
npm run amo:listing:build
```

Formatting reference:

```text
store-listing/firefox-add-ons/amo-listing/AMO_MARKDOWN_REFERENCE.md
```

Use only AMO's limited Markdown subset for descriptions: bold, italic, links, abbreviations, blockquotes, code blocks, unordered lists, and ordered lists.

## Live AMO State

Source: AMO public API for `youtube-mix-blocker`, checked on 2026-06-25.

Default locale:

```text
en-US
```

Live name locales: 27.

```text
cs, de, el, en-US, es-ES, fi, fr, he, hr, hu, it, ja, ko, nl, pl,
pt-BR, pt-PT, ro, ru, sk, sl, sv-SE, tr, uk, vi, zh-CN, zh-TW
```

Live summary locales: 27.

```text
cs, de, el, en-US, es-ES, fi, fr, he, hr, hu, it, ja, ko, nl, pl,
pt-BR, pt-PT, ro, ru, sk, sl, sv-SE, tr, uk, vi, zh-CN, zh-TW
```

Live description locales: 1.

```text
en-US
```

Runtime UI locales not currently present in live AMO name/summary metadata: 23.

```text
ar, bg, bn, ca, da, es-419, et, fil, gu, hi, id, kn, lt, lv, ml, mr,
ms, no, sr, sw, ta, te, th
```

These locales exist in `src/firefox/_locales/`, but they are not currently stored as AMO listing `name` or `summary` locales. AMO listing metadata is separate from the installed extension's runtime UI localization.

## Next Steps

1. Approve the English AMO description formatting in `amo-listing/en-US/description.md`.
2. Add translated AMO listing source directories only after approval.
3. Build and review the generated payload before adding any publishing command.
4. Publish only after loading local credentials from `secret/amo-env.ps1`.

Do not upload generated localized AMO descriptions until the English source is approved.
