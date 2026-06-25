// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const chromeLocales = [
  "de", "en", "en_AU", "en_GB", "en_US", "fa", "fil", "id", "sw", "ms", "nl", "vi", "tr", "az",
  "ca", "da", "et", "es", "es_419", "eu", "fr", "hr", "it", "lv", "lt", "hu", "no", "uz", "pl",
  "pt_BR", "pt_PT", "ro", "sq", "sk", "sl", "fi", "sv", "cs", "el", "bg", "mk", "ru", "sr", "uk",
  "hy", "he", "ur", "ar", "ne", "mr", "hi", "bn", "pa", "gu", "ta", "te", "kn", "ml", "si", "th",
  "ka", "am", "zh_CN", "zh_TW", "ja", "ko"
];

const firefoxLocales = [
  "ar", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "es", "es_419", "et", "fi", "fil", "fr",
  "gu", "he", "hi", "hr", "hu", "id", "it", "ja", "kn", "ko", "lt", "lv", "ml", "mr", "ms", "nl",
  "no", "pl", "pt_BR", "pt_PT", "ro", "ru", "sk", "sl", "sr", "sv", "sw", "ta", "te", "th", "tr",
  "uk", "vi", "zh_CN", "zh_TW"
];

const chromeOnlyLocales = chromeLocales.filter(locale => !firefoxLocales.includes(locale));

const failures = [];

function fail(message) {
  failures.push(message);
}

function listDirectories(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter(name => statSync(path.join(directory, name)).isDirectory())
    .sort();
}

function listTextBasenames(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter(name => name.endsWith(".txt"))
    .map(name => path.basename(name, ".txt"))
    .sort();
}

function parseJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${filePath}: ${error.message}`);
    return null;
  }
}

function assertSameSet(label, actual, expected) {
  const extra = actual.filter(item => !expected.includes(item));
  const missing = expected.filter(item => !actual.includes(item));

  if (missing.length > 0) fail(`${label} missing: ${missing.join(", ")}`);
  if (extra.length > 0) fail(`${label} extra: ${extra.join(", ")}`);
}

function getPlaceholderNames(message) {
  return Object.keys(message.placeholders || {}).sort();
}

function verifyMessages(localeDirectory, expectedLocales, label) {
  const base = parseJSON(path.join(localeDirectory, "en/messages.json"));
  if (!base) return;

  const baseKeys = Object.keys(base).sort();
  const basePlaceholders = Object.fromEntries(
    baseKeys.map(key => [key, getPlaceholderNames(base[key])])
  );

  for (const locale of expectedLocales) {
    const filePath = path.join(localeDirectory, locale, "messages.json");
    const messages = parseJSON(filePath);
    if (!messages) continue;

    const keys = Object.keys(messages).sort();
    assertSameSet(`${label} ${locale} message keys`, keys, baseKeys);

    for (const key of baseKeys) {
      if (!messages[key]) continue;

      const placeholders = getPlaceholderNames(messages[key]);
      assertSameSet(`${label} ${locale}.${key} placeholders`, placeholders, basePlaceholders[key]);

      if (typeof messages[key].message !== "string" || messages[key].message.trim() === "") {
        fail(`${label} ${locale}.${key} has an empty message`);
      }
    }
  }
}

const chromeLocaleDirectory = path.join(root, "src/chrome/_locales");
const firefoxLocaleDirectory = path.join(root, "src/firefox/_locales");
const listingDirectory = path.join(root, "store-listing/chrome-web-store/listing");
const whatsNewPath = path.join(root, "store-listing/chrome-web-store/whats_new.json");

if (existsSync(path.join(root, "src/_locales"))) {
  fail("src/_locales must not exist; use src/chrome/_locales and src/firefox/_locales");
}

assertSameSet("Chrome runtime locales", listDirectories(chromeLocaleDirectory), chromeLocales);
assertSameSet("Firefox runtime locales", listDirectories(firefoxLocaleDirectory), firefoxLocales);
assertSameSet("Chrome store listing locales", listTextBasenames(listingDirectory), chromeLocales);

if (existsSync(path.join(listingDirectory, "iw.txt"))) {
  fail("Chrome store listing must use he.txt, not legacy iw.txt");
}

for (const locale of chromeOnlyLocales) {
  if (existsSync(path.join(firefoxLocaleDirectory, locale))) {
    fail(`Chrome-only locale ${locale} must not be present in Firefox runtime locales`);
  }
}

for (const locale of [...listDirectories(chromeLocaleDirectory), ...listDirectories(firefoxLocaleDirectory)]) {
  if (locale.includes("-")) {
    fail(`_locales folder must use underscores, not hyphens: ${locale}`);
  }
}

verifyMessages(chromeLocaleDirectory, chromeLocales, "Chrome");
verifyMessages(firefoxLocaleDirectory, firefoxLocales, "Firefox");

const whatsNew = parseJSON(whatsNewPath);
if (whatsNew) {
  assertSameSet("Chrome what's-new locales", Object.keys(whatsNew).sort(), chromeLocales);

  for (const locale of chromeLocales) {
    for (const field of ["heading", "bullet1", "bullet2"]) {
      if (!whatsNew[locale] || typeof whatsNew[locale][field] !== "string" || whatsNew[locale][field].trim() === "") {
        fail(`whats_new.json ${locale}.${field} is missing or empty`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log(`Locale verification passed for ${chromeLocales.length} Chrome locales and ${firefoxLocales.length} Firefox locales.`);
