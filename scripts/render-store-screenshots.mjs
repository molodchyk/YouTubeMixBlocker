// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromeLocales } from "./chrome-locales.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const screenshotsDirectory = path.join(root, "store-listing/chrome-web-store/media/screenshots");
const manifestPath = path.join(screenshotsDirectory, "manifest.json");
const messagesDirectory = path.join(root, "src/chrome/_locales");
const popupCSSPath = path.join(root, "src/popup/popup.css");
const iconPath = path.join(root, "src/icons/icon-128.png");
const windowsFontsDirectory = process.env.WINDIR ? path.join(process.env.WINDIR, "Fonts") : null;
const rtlLocales = new Set(["ar", "fa", "he", "ur"]);
const defaultChromePaths = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "google-chrome",
  "chrome",
  "chromium",
  "msedge"
].filter(Boolean);

function parseArgs(argv) {
  const args = {
    allLocales: false,
    allowCopyFallback: false,
    auditLayoutOnly: false,
    chromePath: null,
    keepHtml: false,
    layoutAudit: true,
    locales: ["en"],
    output: screenshotsDirectory,
    overwriteReferenceSlots: false,
    slots: null
  };

  for (const arg of argv) {
    if (arg === "--all-locales") {
      args.allLocales = true;
    } else if (arg === "--audit-layout-only") {
      args.auditLayoutOnly = true;
    } else if (arg === "--allow-copy-fallback") {
      args.allowCopyFallback = true;
    } else if (arg === "--keep-html") {
      args.keepHtml = true;
    } else if (arg === "--overwrite-reference-slots") {
      args.overwriteReferenceSlots = true;
    } else if (arg === "--skip-layout-audit") {
      args.layoutAudit = false;
    } else if (arg.startsWith("--chrome=")) {
      args.chromePath = arg.slice("--chrome=".length);
    } else if (arg.startsWith("--locales=")) {
      args.locales = arg.slice("--locales=".length).split(",").filter(Boolean);
    } else if (arg.startsWith("--output=")) {
      args.output = path.resolve(arg.slice("--output=".length));
    } else if (arg.startsWith("--slots=")) {
      args.slots = arg.slice("--slots=".length).split(",").filter(Boolean);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (args.allLocales) {
    args.locales = chromeLocales;
  }

  return args;
}

function findChrome(explicitPath) {
  const candidates = explicitPath ? [explicitPath] : defaultChromePaths;

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && existsSync(candidate)) return candidate;

    try {
      execFileSync(candidate, ["--version"], { stdio: "ignore" });
      return candidate;
    } catch {
      // Keep checking candidates.
    }
  }

  throw new Error("Chrome or Edge was not found. Pass --chrome=<path> or set CHROME_PATH.");
}

function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const slotCopyCache = new Map();

function readSlotCopyDocument(slot) {
  if (!slot.copy) {
    throw new Error(`Screenshot slot ${slot.id} must define copy for template ${slot.template}.`);
  }

  const copyPath = path.resolve(screenshotsDirectory, slot.copy);
  if (slotCopyCache.has(copyPath)) return slotCopyCache.get(copyPath);
  if (!existsSync(copyPath)) {
    throw new Error(`Missing screenshot copy file for slot ${slot.id}: ${path.relative(root, copyPath)}`);
  }

  const copyDocument = readJSON(copyPath);
  slotCopyCache.set(copyPath, copyDocument);
  return copyDocument;
}

function readMessages(locale) {
  const fallback = readJSON(path.join(messagesDirectory, "en/messages.json"));
  const localePath = path.join(messagesDirectory, locale, "messages.json");
  const localized = existsSync(localePath) ? readJSON(localePath) : fallback;

  return new Proxy(localized, {
    get(target, key) {
      if (typeof key !== "string") return target[key];
      return target[key]?.message || fallback[key]?.message || key;
    }
  });
}

function readSlotCopy(slot, locale, fallbackLocale, allowFallback) {
  const copyDocument = readSlotCopyDocument(slot);
  const localeCopy = copyDocument.locales?.[locale];
  const fallbackCopy = copyDocument.locales?.[fallbackLocale];
  const slotCopy = localeCopy || (allowFallback && locale !== fallbackLocale ? fallbackCopy : null);

  if (!slotCopy) {
    throw new Error(`Missing screenshot copy for locale ${locale}, slot ${slot.id}.`);
  }

  const requiredStrings = requiredCopyStrings(slot);
  for (const key of requiredStrings) {
    if (typeof slotCopy[key] !== "string" || slotCopy[key].trim() === "") {
      throw new Error(`Screenshot copy ${locale}.${slot.id}.${key} must be a non-empty string.`);
    }
  }

  if (!Array.isArray(slotCopy.bullets) || slotCopy.bullets.length === 0) {
    throw new Error(`Screenshot copy ${locale}.${slot.id}.bullets must be a non-empty array.`);
  }

  return slotCopy;
}

function requiredCopyStrings(slot) {
  if (slot.template === "popup-current-page-counters") {
    return ["title", "body"];
  }

  return ["title", "body", "noteTitle", "noteBody"];
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fileURL(filePath) {
  return pathToFileURL(filePath).href;
}

function localFontFace(weight, fileName) {
  if (!windowsFontsDirectory) return "";

  const fontPath = path.join(windowsFontsDirectory, fileName);
  if (!existsSync(fontPath)) return "";

  return `
    @font-face {
      font-family: "YmbScreenshotSans";
      src: url("${fileURL(fontPath)}") format("truetype");
      font-weight: ${weight};
      font-style: normal;
      font-display: block;
    }
  `;
}

function baseCSS(width, height, direction) {
  return `
    ${localFontFace(400, "NotoSans-Regular.ttf")}
    ${localFontFace(700, "NotoSans-Bold.ttf")}

    :root {
      color-scheme: dark;
      font-family: "Segoe UI", Arial, "YmbScreenshotSans", "Noto Sans", sans-serif;
      line-height: 1.25;
      text-rendering: geometricPrecision;
    }

    * { box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      margin: 0;
      overflow: hidden;
      background: #101114;
      color: #f8fafc;
    }

    body {
      direction: ${direction};
    }
  `;
}

function htmlLanguage(locale) {
  return locale.replace("_", "-");
}

function htmlDocument({ body, direction, height, htmlAttributes = "", locale, title, width }) {
  return `<!doctype html>
<html lang="${escapeHTML(htmlLanguage(locale))}" dir="${direction}"${htmlAttributes}>
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(title)}</title>
  <style>${baseCSS(width, height, direction)}</style>
</head>
<body>${body}${layoutAuditScript()}</body>
</html>`;
}

function layoutAuditScript() {
  return `<script>
    (() => {
      const failures = [];
      const checkedElements = [...document.querySelectorAll("[data-layout-check]")];

      for (const element of checkedElements) {
        const mode = element.getAttribute("data-layout-check") || "both";
        const overflowX = mode !== "vertical" && element.scrollWidth > element.clientWidth + 1;
        const overflowY = mode !== "horizontal" && element.scrollHeight > element.clientHeight + 1;

        if (!overflowX && !overflowY) continue;

        failures.push({
          name: element.getAttribute("data-layout-name") || element.className || element.tagName,
          mode,
          overflowX,
          overflowY,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          text: element.textContent.trim().replace(/\\s+/g, " ").slice(0, 160)
        });
      }

      document.documentElement.setAttribute("data-layout-audit", encodeURIComponent(JSON.stringify({ failures })));
    })();
  </script>`;
}

function textScore(value) {
  return [...String(value)].reduce((score, char) => {
    if (/[\u0900-\u0d7f]/u.test(char)) return score + 1.7;
    if (/[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/u.test(char)) return score + 1.35;
    return score + 1;
  }, 0);
}

function slotOneLayout(copy) {
  const titleScore = textScore(copy.title);
  const bodyScore = textScore(copy.body);
  const bulletScore = Math.max(...copy.bullets.map(textScore));
  const noteBodyScore = textScore(copy.noteBody);

  return {
    titleSize: titleScore > 62 ? 34 : titleScore > 48 ? 38 : titleScore > 36 ? 41 : 45,
    bodySize: bodyScore > 128 ? 19 : bodyScore > 104 ? 21 : 24,
    bulletSize: bulletScore > 42 ? 17 : bulletScore > 32 ? 19 : 21,
    noteBodySize: noteBodyScore > 68 ? 17 : noteBodyScore > 54 ? 18 : 20,
    noteTitleSize: textScore(copy.noteTitle) > 32 ? 18 : 20
  };
}

function renderHideMixCardsShot(copy, direction, locale, referenceImagePath) {
  const layout = slotOneLayout(copy);

  return htmlDocument({
    title: copy.title,
    width: 1280,
    height: 800,
    direction,
    locale,
    body: `
      <main class="frame" style="--title-size: ${layout.titleSize}px; --body-size: ${layout.bodySize}px; --bullet-size: ${layout.bulletSize}px; --note-title-size: ${layout.noteTitleSize}px; --note-body-size: ${layout.noteBodySize}px;">
        <section class="copy-panel" data-layout-check="both" data-layout-name="slot01-copy-panel">
          <img class="icon" src="${fileURL(iconPath)}" alt="">
          <h1>${escapeHTML(copy.title)}</h1>
          <p class="body-copy">${escapeHTML(copy.body)}</p>
          <ul class="bullet-list">
            ${copy.bullets.map(item => `
              <li>
                <span class="dot"></span>
                <span>${escapeHTML(item)}</span>
              </li>
            `).join("")}
          </ul>
        </section>

        <section class="visual-panel">
          <div class="reference-crop" aria-hidden="true">
            <img src="${fileURL(referenceImagePath)}" alt="">
          </div>
          <div class="note-card" data-layout-check="both" data-layout-name="slot01-note-card">
            <span class="dot"></span>
            <div>
              <strong>${escapeHTML(copy.noteTitle)}</strong>
              <p>${escapeHTML(copy.noteBody)}</p>
            </div>
          </div>
        </section>
      </main>
      <style>
        .frame {
          width: 1280px;
          height: 800px;
          padding: 50px 46px;
          background: #101114;
          display: grid;
          grid-template-columns: 473px 668px;
          gap: 47px;
          direction: ltr;
        }

        .copy-panel,
        .visual-panel {
          height: 700px;
          border: 2px solid #2e3440;
          border-radius: 24px;
        }

        .copy-panel {
          background: #171a20;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          direction: ${direction};
        }

        .icon {
          width: 58px;
          height: 58px;
          margin-bottom: 62px;
        }

        h1 {
          margin: 0 0 45px;
          max-width: 370px;
          font-size: var(--title-size);
          line-height: 1.34;
          letter-spacing: 0;
          font-weight: 700;
          text-wrap: balance;
        }

        .body-copy {
          margin: 0;
          max-width: 350px;
          color: #f8fafc;
          font-size: var(--body-size);
          line-height: 1.28;
          overflow-wrap: anywhere;
        }

        .bullet-list {
          margin: auto 0 14px;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 18px;
          font-size: var(--bullet-size);
          font-weight: 700;
        }

        .bullet-list li {
          min-height: 28px;
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .dot {
          width: 19px;
          height: 19px;
          border-radius: 999px;
          background: #22c55e;
          flex: 0 0 auto;
        }

        .visual-panel {
          position: relative;
          background: #0b0d10;
          direction: ltr;
        }

        .reference-crop {
          position: absolute;
          left: 45px;
          top: 52px;
          width: 577px;
          height: 348px;
          overflow: hidden;
        }

        .reference-crop img {
          display: block;
          width: 1280px;
          height: 800px;
          transform: translate(-612px, -104px);
          transform-origin: top left;
        }

        .note-card {
          position: absolute;
          left: 45px;
          right: 45px;
          bottom: 116px;
          min-height: 128px;
          padding: 30px 32px;
          border: 2px solid #2e3440;
          border-radius: 22px;
          background: #121820;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          direction: ${direction};
        }

        .note-card .dot {
          margin-top: 12px;
          width: 22px;
          height: 22px;
        }

        .note-card strong {
          display: block;
          margin-bottom: 10px;
          color: #5eead4;
          font-size: var(--note-title-size);
          line-height: 1.2;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .note-card p {
          margin: 0;
          color: #f8fafc;
          font-size: var(--note-body-size);
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        [dir="rtl"] .copy-panel,
        [dir="rtl"] .note-card {
          text-align: start;
        }
      </style>
    `
  });
}

function slotTwoCopyLayout(copy) {
  const titleScore = textScore(copy.title);
  const bodyScore = textScore(copy.body);
  const bulletScore = Math.max(...copy.bullets.map(textScore));

  return {
    titleSize: titleScore > 54 ? 36 : titleScore > 42 ? 40 : 45,
    bodySize: bodyScore > 150 ? 18 : bodyScore > 116 ? 21 : 24,
    bulletSize: bulletScore > 52 ? 17 : bulletScore > 40 ? 19 : 21,
    bulletGap: bulletScore > 52 ? 14 : 18
  };
}

function popupScreenshotLayout(messages) {
  const textValues = [
    messages.popupTitle,
    messages.popupStatus,
    messages.popupCurrentPage,
    messages.popupThisPage,
    messages.popupBlockedPlacements,
    messages.popupWatchSidebar,
    messages.popupEndScreen,
    messages.popupPageEvidence,
    messages.popupAllTime,
    messages.popupMixCardsBlocked,
    messages.popupMixUrlsCleaned,
    messages.popupAllTimeByArea,
    messages.popupRecommendations,
    messages.popupSearchResults,
    messages.popupTheme,
    messages.popupThemeSystem,
    messages.popupShowBadge,
    messages.popupShowDetails,
    messages.popupResetCounters
  ];
  const totalScore = textValues.reduce((total, value) => total + textScore(value), 0);
  const longestScore = Math.max(...textValues.map(textScore));
  const density = longestScore > 66 || totalScore > 640 ? 3 :
    longestScore > 54 || totalScore > 540 ? 2 :
      longestScore > 42 || totalScore > 440 ? 1 : 0;

  return {
    scale: [0.88, 0.84, 0.79, 0.74][density],
    fontSize: [14, 13.3, 12.5, 11.8][density],
    headingSize: [19, 18, 17, 16][density],
    sectionSize: [12, 11.5, 11, 10.5][density],
    primaryLabelSize: [15, 14.2, 13.4, 12.6][density],
    primaryValueSize: [42, 40, 37, 34][density],
    rowMinHeight: [26, 25, 24, 23][density],
    chipSize: [12, 11.5, 11, 10.5][density],
    panelPadding: [14, 13, 12, 11][density],
    mainPadding: [16, 15, 14, 13][density]
  };
}

function renderPopupShot(copy, messages, direction, locale) {
  const copyLayout = slotTwoCopyLayout(copy);
  const popupLayout = popupScreenshotLayout(messages);
  const popupCSS = readFileSync(popupCSSPath, "utf8");

  return htmlDocument({
    title: copy.title,
    width: 1280,
    height: 800,
    direction,
    htmlAttributes: " data-theme=\"dark\"",
    locale,
    body: `
      <main class="stage" style="--copy-title-size: ${copyLayout.titleSize}px; --copy-body-size: ${copyLayout.bodySize}px; --copy-bullet-size: ${copyLayout.bulletSize}px; --copy-bullet-gap: ${copyLayout.bulletGap}px; --popup-scale: ${popupLayout.scale}; --popup-font-size: ${popupLayout.fontSize}px; --popup-heading-size: ${popupLayout.headingSize}px; --popup-section-size: ${popupLayout.sectionSize}px; --popup-primary-label-size: ${popupLayout.primaryLabelSize}px; --popup-primary-value-size: ${popupLayout.primaryValueSize}px; --popup-row-min-height: ${popupLayout.rowMinHeight}px; --popup-chip-size: ${popupLayout.chipSize}px; --popup-panel-padding: ${popupLayout.panelPadding}px; --popup-main-padding: ${popupLayout.mainPadding}px;">
        <section class="copy-panel" data-layout-check="both" data-layout-name="slot02-copy-panel">
          <img class="icon" src="${fileURL(iconPath)}" alt="">
          <h1>${escapeHTML(copy.title)}</h1>
          <p class="body-copy">${escapeHTML(copy.body)}</p>
          <ul class="bullet-list">
            ${copy.bullets.map(item => `
              <li>
                <span class="dot"></span>
                <span>${escapeHTML(item)}</span>
              </li>
            `).join("")}
          </ul>
        </section>

        <section class="popup-panel" data-layout-check="both" data-layout-name="slot02-popup-panel">
          <div class="popup-canvas" dir="${direction}" data-layout-check="both" data-layout-name="slot02-popup-canvas">
            <main>
              <header>
                <h1>${escapeHTML(messages.popupTitle)}</h1>
                <p id="status">${escapeHTML(messages.popupStatus)}</p>
              </header>

              <section class="page-panel" aria-labelledby="currentPageHeading">
                <div class="section-label" id="currentPageHeading">${escapeHTML(messages.popupCurrentPage)}</div>
                <div class="page-primary">
                  <span>${escapeHTML(messages.popupThisPage)}</span>
                  <strong class="ltr-stable">5</strong>
                </div>
                <div class="page-secondary">
                  <span>${escapeHTML(messages.popupBlockedPlacements)}</span>
                  <strong class="ltr-stable">7</strong>
                </div>
                <div class="surface-chips">
                  <span class="surface-chip"><span>${escapeHTML(messages.popupWatchSidebar)}</span><strong class="ltr-stable">4</strong></span>
                  <span class="surface-chip"><span>${escapeHTML(messages.popupEndScreen)}</span><strong class="ltr-stable">3</strong></span>
                </div>
                <details class="page-debug">
                  <summary>${escapeHTML(messages.popupPageEvidence)}</summary>
                </details>
              </section>

              <section class="summary" aria-label="Summary">
                <div class="section-label">${escapeHTML(messages.popupAllTime)}</div>
                <div>
                  <span class="label">${escapeHTML(messages.popupMixCardsBlocked)}</span>
                  <strong class="ltr-stable">111</strong>
                </div>
                <div>
                  <span class="label">${escapeHTML(messages.popupMixUrlsCleaned)}</span>
                  <strong class="ltr-stable">2</strong>
                </div>
              </section>

              <section class="details" aria-label="Breakdown">
                <div class="section-label">${escapeHTML(messages.popupAllTimeByArea)}</div>
                <div>
                  <span>${escapeHTML(messages.popupRecommendations)}</span>
                  <strong class="ltr-stable">62</strong>
                </div>
                <div>
                  <span>${escapeHTML(messages.popupWatchSidebar)}</span>
                  <strong class="ltr-stable">38</strong>
                </div>
                <div>
                  <span>${escapeHTML(messages.popupEndScreen)}</span>
                  <strong class="ltr-stable">3</strong>
                </div>
                <div>
                  <span>${escapeHTML(messages.popupSearchResults)}</span>
                  <strong class="ltr-stable">8</strong>
                </div>
              </section>

              <section class="settings" aria-label="Settings">
                <label class="select-row">
                  <span>${escapeHTML(messages.popupTheme)}</span>
                  <select>
                    <option selected>${escapeHTML(messages.popupThemeSystem)}</option>
                  </select>
                </label>
                <label>
                  <input type="checkbox">
                  <span>${escapeHTML(messages.popupShowBadge)}</span>
                </label>
                <label>
                  <input type="checkbox" checked>
                  <span>${escapeHTML(messages.popupShowDetails)}</span>
                </label>
              </section>

              <button type="button">${escapeHTML(messages.popupResetCounters)}</button>
            </main>
          </div>
        </section>
      </main>
      <style>
${popupCSS}

        html,
        body {
          width: 1280px;
          height: 800px;
          margin: 0;
          overflow: hidden;
          background: #101114;
          color: #f4f7fa;
          font-family: "Segoe UI", Arial, "YmbScreenshotSans", "Noto Sans", sans-serif;
        }

        .stage {
          width: 1280px;
          height: 800px;
          padding: 50px 46px;
          display: grid;
          grid-template-columns: 473px 668px;
          gap: 47px;
          background: #101114;
          direction: ltr;
        }

        .copy-panel,
        .popup-panel {
          height: 700px;
          border: 2px solid #2e3440;
          border-radius: 24px;
        }

        .copy-panel {
          padding: 48px 40px;
          background: #171a20;
          display: flex;
          flex-direction: column;
          direction: ${direction};
        }

        .copy-panel .icon {
          width: 58px;
          height: 58px;
          margin-bottom: 62px;
        }

        .copy-panel h1 {
          margin: 0 0 42px;
          max-width: 385px;
          color: #f8fafc;
          font-size: var(--copy-title-size);
          line-height: 1.34;
          letter-spacing: 0;
          font-weight: 700;
          text-wrap: balance;
          overflow-wrap: anywhere;
        }

        .copy-panel .body-copy {
          max-width: 360px;
          margin: 0;
          color: #f8fafc;
          font-size: var(--copy-body-size);
          line-height: 1.28;
          overflow-wrap: anywhere;
        }

        .copy-panel .bullet-list {
          margin: auto 0 14px;
          padding: 0;
          list-style: none;
          display: grid;
          gap: var(--copy-bullet-gap);
          color: #f8fafc;
          font-size: var(--copy-bullet-size);
          font-weight: 700;
        }

        .copy-panel li {
          display: flex;
          align-items: center;
          gap: 22px;
          min-height: 28px;
        }

        .dot {
          width: 19px;
          height: 19px;
          border-radius: 999px;
          background: #22c55e;
          flex: 0 0 auto;
        }

        .popup-panel {
          background: #0b0d10;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .popup-canvas {
          width: 400px;
          overflow: visible;
          border: 1px solid #303946;
          border-radius: 9px;
          background: var(--background);
          box-shadow: 0 18px 54px rgba(0, 0, 0, 0.45);
          color: var(--text-primary);
          font-size: var(--popup-font-size);
          transform: scale(var(--popup-scale));
          transform-origin: center;
        }

        .popup-canvas main {
          width: 100%;
          padding: var(--popup-main-padding);
        }

        .popup-canvas header {
          margin-bottom: 12px;
        }

        .popup-canvas h1 {
          font-size: var(--popup-heading-size);
        }

        .popup-canvas .section-label {
          font-size: var(--popup-section-size);
        }

        .popup-canvas .page-panel {
          padding: var(--popup-panel-padding);
        }

        .popup-canvas .page-primary span {
          font-size: var(--popup-primary-label-size);
        }

        .popup-canvas .page-primary strong {
          font-size: var(--popup-primary-value-size);
        }

        .popup-canvas .page-secondary,
        .popup-canvas .summary > div:not(.section-label),
        .popup-canvas .details > div:not(.section-label) {
          min-height: var(--popup-row-min-height);
        }

        .popup-canvas .surface-chip {
          font-size: var(--popup-chip-size);
        }

        .popup-canvas button {
          margin-top: 10px;
        }

        .ltr-stable {
          direction: ltr;
          unicode-bidi: isolate;
        }
      </style>
    `
  });
}

function createHTML(slot, renderData) {
  if (slot.template === "hide-youtube-mix-cards") {
    return renderHideMixCardsShot(renderData.copy, renderData.direction, renderData.locale, renderData.referenceImagePath);
  }

  if (slot.template === "popup-current-page-counters") {
    return renderPopupShot(renderData.copy, renderData.messages, renderData.direction, renderData.locale);
  }

  throw new Error(`No renderer exists for screenshot template ${slot.template || slot.id}.`);
}

function parsePngHeader(filePath) {
  const buffer = readFileSync(filePath);
  if (buffer.length < 26 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;

  return {
    bitDepth: buffer.readUInt8(24),
    colorType: buffer.readUInt8(25)
  };
}

function ensure24BitPng(filePath) {
  const png = parsePngHeader(filePath);
  if (!png || (png.bitDepth === 8 && png.colorType === 2)) return;

  const command = [
    "$path = Resolve-Path -LiteralPath $env:PNG_PATH;",
    "Add-Type -AssemblyName System.Drawing;",
    "$source = [System.Drawing.Image]::FromFile($path);",
    "$bitmap = New-Object System.Drawing.Bitmap $source.Width, $source.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb);",
    "$graphics = [System.Drawing.Graphics]::FromImage($bitmap);",
    "$graphics.Clear([System.Drawing.Color]::Black);",
    "$graphics.DrawImage($source, 0, 0, $source.Width, $source.Height);",
    "$source.Dispose();",
    "$graphics.Dispose();",
    "$temp = \"$path.tmp.png\";",
    "$bitmap.Save($temp, [System.Drawing.Imaging.ImageFormat]::Png);",
    "$bitmap.Dispose();",
    "Move-Item -LiteralPath $temp -Destination $path -Force;"
  ].join(" ");

  execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
    env: { ...process.env, PNG_PATH: filePath },
    stdio: "pipe"
  });
}

function renderWithChrome(chromePath, htmlPath, outputPath, width, height) {
  execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    `--screenshot=${outputPath}`,
    pathToFileURL(htmlPath).href
  ], {
    stdio: "pipe"
  });
}

function decodeAttribute(value) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function auditLayout(chromePath, htmlPath, locale, slot) {
  const output = execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=1000",
    "--dump-dom",
    pathToFileURL(htmlPath).href
  ], {
    encoding: "utf8",
    stdio: "pipe"
  });
  const match = output.match(/data-layout-audit="([^"]*)"/);

  if (!match) {
    throw new Error(`Layout audit report was not produced for ${locale} slot ${slot.id}.`);
  }

  const report = JSON.parse(decodeURIComponent(decodeAttribute(match[1])));
  if (report.failures?.length > 0) {
    const details = report.failures.map(failure => {
      return `${failure.name}: overflowX=${failure.overflowX}, overflowY=${failure.overflowY}, ` +
        `client=${failure.clientWidth}x${failure.clientHeight}, scroll=${failure.scrollWidth}x${failure.scrollHeight}, ` +
        `text="${failure.text}"`;
    }).join("; ");

    throw new Error(`Layout overflow in ${locale} slot ${slot.id} (${slot.file}): ${details}`);
  }
}

function validateRequestedLocales(locales) {
  const unknown = locales.filter(locale => !chromeLocales.includes(locale));
  if (unknown.length > 0) {
    throw new Error(`Unknown Chrome locale(s): ${unknown.join(", ")}`);
  }
}

function copyReferenceSlot(slot, locale, manifest, outputDirectory, overwriteReferenceSlots) {
  const sourcePath = path.join(screenshotsDirectory, manifest.fallbackLocale, slot.file);
  const outputPath = path.join(outputDirectory, slot.file);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing reference screenshot for slot ${slot.id}: ${path.relative(root, sourcePath)}`);
  }

  if (path.resolve(sourcePath) === path.resolve(outputPath)) {
    return "skipped";
  }

  if (existsSync(outputPath) && locale !== manifest.fallbackLocale && !overwriteReferenceSlots) {
    return "skipped";
  }

  copyFileSync(sourcePath, outputPath);
  ensure24BitPng(outputPath);
  return "copied";
}

const args = parseArgs(process.argv.slice(2));
const manifest = readJSON(manifestPath);
const selectedSlots = manifest.slots.filter(slot => !args.slots || args.slots.includes(slot.id));
const missingSlots = (args.slots || []).filter(slotId => !manifest.slots.some(slot => slot.id === slotId));

if (missingSlots.length > 0) {
  throw new Error(`Unknown screenshot slot(s): ${missingSlots.join(", ")}`);
}

validateRequestedLocales(args.locales);

const renderedSlots = selectedSlots.filter(slot => slot.mode === "render-template");
const chromePath = renderedSlots.length > 0 ? findChrome(args.chromePath) : null;
const tempDirectory = mkdtempSync(path.join(tmpdir(), "ymb-screenshots-"));
const referenceCopies = new Map();
let copiedCount = 0;
let auditedCount = 0;
let renderedCount = 0;
let skippedCount = 0;

function getReferenceImage(slot) {
  const sourcePath = path.join(screenshotsDirectory, manifest.fallbackLocale, slot.file);
  if (referenceCopies.has(slot.id)) return referenceCopies.get(slot.id);
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing reference screenshot for slot ${slot.id}: ${path.relative(root, sourcePath)}`);
  }

  const copyPath = path.join(tempDirectory, `reference-${slot.id}.png`);
  copyFileSync(sourcePath, copyPath);
  referenceCopies.set(slot.id, copyPath);
  return copyPath;
}

try {
  for (const locale of args.locales) {
    const direction = rtlLocales.has(locale) ? "rtl" : "ltr";
    const outputDirectory = path.join(args.output, locale);
    let messages = null;

    if (!args.auditLayoutOnly) {
      mkdirSync(outputDirectory, { recursive: true });
    }

    for (const slot of selectedSlots) {
      if (slot.mode === "copy-reference") {
        if (args.auditLayoutOnly) {
          skippedCount += 1;
          continue;
        }

        mkdirSync(outputDirectory, { recursive: true });
        const result = copyReferenceSlot(slot, locale, manifest, outputDirectory, args.overwriteReferenceSlots);
        if (result === "copied") copiedCount += 1;
        if (result === "skipped") skippedCount += 1;
        continue;
      }

      if (slot.mode !== "render-template") {
        throw new Error(`Unknown screenshot slot mode for ${slot.id}: ${slot.mode}`);
      }

      const renderData = { direction, locale };
      if (slot.template === "hide-youtube-mix-cards") {
        renderData.copy = readSlotCopy(slot, locale, manifest.fallbackLocale, args.allowCopyFallback);
        renderData.referenceImagePath = getReferenceImage(slot);
      } else if (slot.template === "popup-current-page-counters") {
        renderData.copy = readSlotCopy(slot, locale, manifest.fallbackLocale, args.allowCopyFallback);
        messages ||= readMessages(locale);
        renderData.messages = messages;
      }

      const html = createHTML(slot, renderData);
      const htmlPath = path.join(tempDirectory, `${locale}-${slot.id}.html`);
      const outputPath = path.join(outputDirectory, slot.file);

      writeFileSync(htmlPath, html, "utf8");
      if (args.layoutAudit) {
        auditLayout(chromePath, htmlPath, locale, slot);
        auditedCount += 1;
      }

      if (!args.auditLayoutOnly) {
        mkdirSync(outputDirectory, { recursive: true });
        renderWithChrome(chromePath, htmlPath, outputPath, slot.width, slot.height);
        ensure24BitPng(outputPath);
        renderedCount += 1;
      }
    }
  }
} finally {
  if (!args.keepHtml) {
    rmSync(tempDirectory, { recursive: true, force: true });
  } else {
    console.log(`Kept generated HTML in ${tempDirectory}`);
  }
}

console.log(
  `Processed Chrome Web Store screenshots in ${args.output}: audited=${auditedCount}, rendered=${renderedCount}, copied=${copiedCount}, skipped=${skippedCount}.`
);
