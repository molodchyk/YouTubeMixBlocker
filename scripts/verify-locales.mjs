// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromeLocales } from "./chrome-locales.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

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

function verifyMessages(localeDirectory, expectedLocales) {
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
    assertSameSet(`Chrome ${locale} message keys`, keys, baseKeys);

    for (const key of baseKeys) {
      if (!messages[key]) continue;

      const placeholders = getPlaceholderNames(messages[key]);
      assertSameSet(`Chrome ${locale}.${key} placeholders`, placeholders, basePlaceholders[key]);

      if (typeof messages[key].message !== "string" || messages[key].message.trim() === "") {
        fail(`Chrome ${locale}.${key} has an empty message`);
      }
    }
  }
}

const chromeLocaleDirectory = path.join(root, "src/chrome/_locales");
const listingDirectory = path.join(root, "store-listing/chrome-web-store/listing");
const whatsNewPath = path.join(root, "store-listing/chrome-web-store/whats_new.json");

if (existsSync(path.join(root, "src/_locales"))) {
  fail("src/_locales must not exist; use src/chrome/_locales");
}

if (existsSync(path.join(root, "src/firefox"))) {
  fail("src/firefox must not exist in the Chrome-only project");
}

if (existsSync(path.join(root, "store-listing/firefox-add-ons"))) {
  fail("store-listing/firefox-add-ons must not exist in the Chrome-only project");
}

assertSameSet("Chrome runtime locales", listDirectories(chromeLocaleDirectory), chromeLocales);
assertSameSet("Chrome store listing locales", listTextBasenames(listingDirectory), chromeLocales);

if (existsSync(path.join(listingDirectory, "iw.txt"))) {
  fail("Chrome store listing must use he.txt, not legacy iw.txt");
}

for (const locale of listDirectories(chromeLocaleDirectory)) {
  if (locale.includes("-")) {
    fail(`_locales folder must use underscores, not hyphens: ${locale}`);
  }
}

verifyMessages(chromeLocaleDirectory, chromeLocales);

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

console.log(`Locale verification passed for ${chromeLocales.length} Chrome locales.`);
