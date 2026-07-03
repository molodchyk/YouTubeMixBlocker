// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromeLocales } from "./chrome-locales.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const screenshotsDirectory = path.join(root, "store-listing/chrome-web-store/media/screenshots");
const manifestPath = path.join(screenshotsDirectory, "manifest.json");
const writeReport = process.argv.includes("--write-report");
const failures = [];
const reportRows = [];

const englishLocales = new Set(["en", "en_AU", "en_GB", "en_US"]);

const commonFieldsToReview = [
  ["title", "headline"],
  ["body", "body"]
];

function fieldsToReview(slot) {
  if (slot.template === "popup-current-page-counters") {
    return commonFieldsToReview;
  }

  return [
    ...commonFieldsToReview,
    ["noteTitle", "callout heading"],
    ["noteBody", "callout body"]
  ];
}

const forbiddenEnglishFragments = [
  "Everything else is still YouTube",
  "Everything else stays YouTube",
  "Mix cards hidden",
  "No custom recommendations",
  "Local on YouTube pages"
];

const forbiddenLiteralYouTubePredicates = [
  /stays YouTube/i,
  /still YouTube/i,
  /remains YouTube/i,
  /bleibt YouTube/i,
  /blijft YouTube/i,
  /forbliver YouTube/i,
  /forblir YouTube/i,
  /continua (?:sent|sendo|a ser) YouTube/i,
  /sigue siendo YouTube/i,
  /reste YouTube/i,
  /resta YouTube/i,
  /ostaje YouTube/i,
  /ostane YouTube/i,
  /pozostaje YouTube/i,
  /rămâne YouTube/i,
  /jääb YouTube/i,
  /paliek YouTube/i,
  /lieka YouTube/i,
  /marad YouTube/i,
  /pysyy YouTubena/i,
  /mbetet YouTube/i,
  /mbeten YouTube/i,
  /оста[вн][а-яёіїє]* YouTube/i,
  /остан[а-яёіїє]* YouTube/i,
  /παραμέν\p{L}* YouTube/iu,
  /μέν\p{L}* YouTube/iu,
  /մնում է YouTube/i,
  /נשאר YouTube/i,
  /YouTube (?:ही )?रह/i,
  /YouTube .*?रह/i,
  /YouTube .*?ਰਹ/i,
  /YouTube .*?રહ/i,
  /YouTube .*? থাকে/i,
  /YouTube .*?رہ/i,
  /يبقى .*?YouTube/i,
  /YouTube ලෙසම පවතී/i,
  /YouTube እንደሆነ ይቆያል/i
];

function fail(message) {
  failures.push(message);
}

function relativePath(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function parseJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${relativePath(filePath)}: ${error.message}`);
    return null;
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function reviewString({ filePath, slot, locale, key, label, value }) {
  const normalized = normalizeWhitespace(value);
  reportRows.push({ slot: slot.id, locale, key, label, value: normalized });

  if (normalized.length === 0) {
    fail(`${relativePath(filePath)} ${locale}.${key} must not be empty`);
    return;
  }

  if (!englishLocales.has(locale)) {
    for (const fragment of forbiddenEnglishFragments) {
      if (normalized.includes(fragment)) {
        fail(`${relativePath(filePath)} ${locale}.${key} contains untranslated English fragment: "${fragment}"`);
      }
    }
  }

  for (const pattern of forbiddenLiteralYouTubePredicates) {
    if (pattern.test(normalized)) {
      fail(`${relativePath(filePath)} ${locale}.${key} uses YouTube as a literal predicate; say that the rest of YouTube is unchanged instead`);
    }
  }

  if (slot.id === "01" && key === "title" && !englishLocales.has(locale) && /YouTube[\s-]+Mix/i.test(normalized)) {
    fail(`${relativePath(filePath)} ${locale}.title should say Mix cards on YouTube, not "YouTube Mix"`);
  }
}

function reviewBullets({ filePath, slot, locale, bullets }) {
  if (!Array.isArray(bullets) || bullets.length === 0) {
    fail(`${relativePath(filePath)} ${locale}.bullets must be a non-empty array`);
    return;
  }

  for (const [index, bullet] of bullets.entries()) {
    if (typeof bullet !== "string") {
      fail(`${relativePath(filePath)} ${locale}.bullets[${index}] must be a string`);
      continue;
    }

    reviewString({
      filePath,
      slot,
      locale,
      key: `bullets[${index}]`,
      label: `bullet ${index + 1}`,
      value: bullet
    });
  }
}

function reviewCopyFile(slot) {
  const copyPath = path.resolve(screenshotsDirectory, slot.copy);
  const document = parseJSON(copyPath);
  if (!document) return;

  if (!document.locales || typeof document.locales !== "object" || Array.isArray(document.locales)) {
    fail(`${relativePath(copyPath)} must define a locales object`);
    return;
  }

  const locales = Object.keys(document.locales).sort();
  const missing = chromeLocales.filter(locale => !locales.includes(locale));
  const extra = locales.filter(locale => !chromeLocales.includes(locale));
  if (missing.length > 0) fail(`${relativePath(copyPath)} missing locales: ${missing.join(", ")}`);
  if (extra.length > 0) fail(`${relativePath(copyPath)} extra locales: ${extra.join(", ")}`);

  for (const locale of locales) {
    const copy = document.locales[locale];
    if (!copy || typeof copy !== "object" || Array.isArray(copy)) {
      fail(`${relativePath(copyPath)} ${locale} must be an object`);
      continue;
    }

    for (const [key, label] of fieldsToReview(slot)) {
      if (typeof copy[key] !== "string") {
        fail(`${relativePath(copyPath)} ${locale}.${key} must be a string`);
        continue;
      }

      reviewString({ filePath: copyPath, slot, locale, key, label, value: copy[key] });
    }

    reviewBullets({ filePath: copyPath, slot, locale, bullets: copy.bullets });
  }
}

function writeReviewReport() {
  const reportPath = path.join(screenshotsDirectory, "source/screenshot-copy-review.md");
  mkdirSync(path.dirname(reportPath), { recursive: true });
  const lines = [
    "# Chrome Web Store Screenshot Copy Review",
    "",
    "Generated by `npm run qa:store-screenshot-copy -- --write-report`.",
    "",
    "| Slot | Locale | Field | Text |",
    "| --- | --- | --- | --- |"
  ];

  for (const row of reportRows) {
    const safeValue = row.value.replace(/\|/g, "\\|");
    lines.push(`| ${row.slot} | ${row.locale} | ${row.label} | ${safeValue} |`);
  }

  writeFileSync(reportPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${relativePath(reportPath)}`);
}

const manifest = parseJSON(manifestPath);
if (manifest?.slots) {
  for (const slot of manifest.slots) {
    if (slot.mode === "render-template" && typeof slot.copy === "string") {
      reviewCopyFile(slot);
    }
  }
}

if (writeReport) writeReviewReport();

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("Chrome Web Store screenshot copy QA passed.");
