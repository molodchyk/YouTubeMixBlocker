# AMO Source Code Build Instructions

These instructions are for Mozilla Add-ons reviewers.

## Add-on Package

Submitted add-on package:

```text
release/youtube-mix-blocker-firefox-1.5.1.zip
```

Generated output directory:

```text
dist-firefox/
```

## Build Environment

The submitted Firefox package was built on Windows with:

```text
Node.js v24.16.0
npm 10.5.0
```

Node.js can be installed from:

```text
https://nodejs.org/
```

The project uses npm and the checked-in `package-lock.json` file for dependency resolution.

## Build Steps

From the repository root:

```powershell
npm install
npm run package:firefox
```

This command runs the Firefox build and creates:

```text
release/youtube-mix-blocker-firefox-1.5.1.zip
```

Validation command:

```powershell
npm run lint:firefox
```

## Build Script

The relevant build script is:

```text
scripts/build-content.mjs
```

It performs these steps:

1. Reads the readable content-script source files in `src/content/`.
2. Combines them into `dist-firefox/content.js`.
3. Applies Firefox-specific compatibility adjustments.
4. Writes `dist-firefox/manifest.json`.
5. Copies static files from `src/background.js`, `src/popup/`, `src/icons/`, and `src/firefox/_locales/`.

The generated JavaScript is readable and is not minified or obfuscated.

## Source Package Contents

The source package intentionally includes the files needed to rebuild the Firefox add-on:

- `src/`
- `scripts/`
- `package.json`
- `package-lock.json`
- project documentation and license files
- Firefox listing/reviewer notes under `store-listing/firefox-add-ons/`

It intentionally excludes generated build output and installed dependencies:

- `node_modules/`
- `dist/`
- `dist-firefox/`
- `release/`
