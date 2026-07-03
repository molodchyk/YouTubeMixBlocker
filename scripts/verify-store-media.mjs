// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromeLocales } from "./chrome-locales.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const mediaDirectory = path.join(root, "store-listing/chrome-web-store/media");
const screenshotsDirectory = path.join(mediaDirectory, "screenshots");
const promoVideosDirectory = path.join(mediaDirectory, "promo-videos");
const manifestPath = path.join(screenshotsDirectory, "manifest.json");
const requireAllScreenshotLocales = process.argv.includes("--require-all-screenshot-locales");
const failures = [];
const notes = [];
const youtubeVideoUrlPattern = /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/;

function fail(message) {
  failures.push(message);
}

function parseJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${path.relative(root, filePath)}: ${error.message}`);
    return null;
  }
}

function listDirectories(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter(name => statSync(path.join(directory, name)).isDirectory())
    .sort();
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter(name => statSync(path.join(directory, name)).isFile())
    .sort();
}

function listTextFiles(directory) {
  return listFiles(directory).filter(name => path.extname(name).toLowerCase() === ".txt");
}

function relativePath(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function assertSetEquals(label, actual, expected) {
  const extra = actual.filter(item => !expected.includes(item));
  const missing = expected.filter(item => !actual.includes(item));

  if (missing.length > 0) fail(`${label} missing: ${missing.join(", ")}`);
  if (extra.length > 0) fail(`${label} extra: ${extra.join(", ")}`);
}

function parsePng(filePath) {
  const buffer = readFileSync(filePath);
  const signature = "89504e470d0a1a0a";

  if (buffer.length < 33 || buffer.subarray(0, 8).toString("hex") !== signature) {
    fail(`${relativePath(filePath)} is not a valid PNG`);
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);
  if (chunkType !== "IHDR") {
    fail(`${relativePath(filePath)} is missing the PNG IHDR chunk`);
    return null;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer.readUInt8(24);
  const colorType = buffer.readUInt8(25);
  let offset = 8;
  let hasTransparencyChunk = false;

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "tRNS") hasTransparencyChunk = true;
    offset += 12 + length;
  }

  return {
    width,
    height,
    extension: ".png",
    bitDepth,
    colorType,
    hasAlpha: colorType === 4 || colorType === 6 || hasTransparencyChunk,
    is24BitNoAlpha: bitDepth === 8 && colorType === 2 && !hasTransparencyChunk
  };
}

function parseJpeg(filePath) {
  const buffer = readFileSync(filePath);

  if (buffer.length < 4 || buffer.readUInt16BE(0) !== 0xffd8) {
    fail(`${relativePath(filePath)} is not a valid JPEG`);
    return null;
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3;

    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
        extension: path.extname(filePath).toLowerCase()
      };
    }

    offset += 2 + length;
  }

  fail(`${relativePath(filePath)} is missing a JPEG size marker`);
  return null;
}

function readImageInfo(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".png") return parsePng(filePath);
  if (extension === ".jpg" || extension === ".jpeg") return parseJpeg(filePath);

  fail(`${relativePath(filePath)} has unsupported extension ${extension}`);
  return null;
}

function verifyImageDimensions(filePath, info, expectedWidth, expectedHeight) {
  if (!info) return;

  if (info.width !== expectedWidth || info.height !== expectedHeight) {
    fail(`${relativePath(filePath)} must be ${expectedWidth}x${expectedHeight}; found ${info.width}x${info.height}`);
  }
}

function verifyScreenshotFile(filePath, slot, manifest) {
  const extension = path.extname(filePath).toLowerCase();
  const info = readImageInfo(filePath);

  if (!manifest.policy.allowedExtensions.includes(extension)) {
    fail(`${relativePath(filePath)} must use one of: ${manifest.policy.allowedExtensions.join(", ")}`);
  }

  verifyImageDimensions(filePath, info, slot.width, slot.height);

  if (extension === ".png" && manifest.policy.pngScreenshotsMustBe24BitNoAlpha && info && !info.is24BitNoAlpha) {
    fail(`${relativePath(filePath)} must be a 24-bit PNG without alpha; found bitDepth=${info.bitDepth}, colorType=${info.colorType}`);
  }
}

function verifyStoreIcon(manifest) {
  const storeIcon = manifest.storeIcon;
  if (!storeIcon || typeof storeIcon.path !== "string") {
    fail("screenshots/manifest.json must define storeIcon.path");
    return;
  }

  const iconPath = path.resolve(screenshotsDirectory, storeIcon.path);
  if (!existsSync(iconPath)) {
    fail(`${relativePath(iconPath)} is missing`);
    return;
  }

  verifyImageDimensions(iconPath, readImageInfo(iconPath), storeIcon.width, storeIcon.height);
}

function verifyManifest(manifest) {
  if (!manifest) return;

  if (manifest.fallbackLocale !== "en") {
    fail("screenshots/manifest.json fallbackLocale must be en");
  }

  if (!Array.isArray(manifest.slots) || manifest.slots.length === 0) {
    fail("screenshots/manifest.json must define at least one screenshot slot");
    return;
  }

  if (manifest.slots.length > manifest.policy.maxScreenshotsPerLocale) {
    fail(`Chrome Web Store allows at most ${manifest.policy.maxScreenshotsPerLocale} screenshots per locale`);
  }

  const slotIds = manifest.slots.map(slot => slot.id);
  assertSetEquals("screenshot slot ids", [...new Set(slotIds)], slotIds);

  for (const slot of manifest.slots) {
    if (!/^\d{2}$/.test(slot.id)) fail(`screenshot slot id must be two digits: ${slot.id}`);
    if (!slot.file.startsWith(`${slot.id}-`)) fail(`${slot.file} must start with ${slot.id}-`);

    if (slot.mode === "render-template" && ["hide-youtube-mix-cards", "popup-current-page-counters"].includes(slot.template) && typeof slot.copy !== "string") {
      fail(`${slot.file} must define a copy file for localized screenshot text`);
    }
  }
}

function requiredCopyStrings(slot) {
  if (slot.template === "popup-current-page-counters") {
    return ["title", "body"];
  }

  return ["title", "body", "noteTitle", "noteBody"];
}

function verifyScreenshotCopy(manifest) {
  if (!manifest) return;

  const renderSlotsWithCopy = manifest.slots.filter(slot => slot.mode === "render-template" && slot.copy);

  for (const slot of renderSlotsWithCopy) {
    const requiredStrings = requiredCopyStrings(slot);
    const copyPath = path.resolve(screenshotsDirectory, slot.copy);
    const copyDocument = parseJSON(copyPath);
    if (!copyDocument) continue;

    if (copyDocument.slot !== slot.id) {
      fail(`${relativePath(copyPath)} must declare slot "${slot.id}"`);
    }

    if (!copyDocument.locales || typeof copyDocument.locales !== "object" || Array.isArray(copyDocument.locales)) {
      fail(`${relativePath(copyPath)} must define a locales object`);
      continue;
    }

    const copyLocales = Object.keys(copyDocument.locales).sort();
    assertSetEquals(`${relativePath(copyPath)} locales`, copyLocales, chromeLocales);

    for (const locale of copyLocales) {
      const localeCopy = copyDocument.locales[locale];
      for (const key of requiredStrings) {
        if (typeof localeCopy?.[key] !== "string" || localeCopy[key].trim() === "") {
          fail(`${relativePath(copyPath)} ${locale}.${key} must be a non-empty string`);
        }
      }

      if (slot.id === "01" && !locale.startsWith("en") && /YouTube[\s-]+Mix/i.test(localeCopy.title)) {
        fail(`${relativePath(copyPath)} ${locale}.title should localize the phrase as Mix cards on YouTube, not "YouTube Mix"`);
      }

      if (!Array.isArray(localeCopy?.bullets) || localeCopy.bullets.length === 0) {
        fail(`${relativePath(copyPath)} ${locale}.bullets must be a non-empty array`);
      } else if (localeCopy.bullets.some(item => typeof item !== "string" || item.trim() === "")) {
        fail(`${relativePath(copyPath)} ${locale}.bullets must contain only non-empty strings`);
      }
    }
  }
}

function verifyGlobalScreenshots(manifest) {
  if (!manifest) return;

  const expectedFiles = manifest.slots.map(slot => slot.file).sort();
  const globalScreenshotFiles = listFiles(screenshotsDirectory)
    .filter(name => manifest.policy.allowedExtensions.includes(path.extname(name).toLowerCase()))
    .sort();

  assertSetEquals("global screenshot files", globalScreenshotFiles, expectedFiles);

  for (const slot of manifest.slots) {
    const filePath = path.join(screenshotsDirectory, slot.file);
    if (existsSync(filePath)) verifyScreenshotFile(filePath, slot, manifest);
  }
}

function verifyScreenshotLocales(manifest) {
  if (!manifest) return;

  const nonLocaleDirectories = new Set(["copy", "source", "templates"]);
  const localeDirectories = listDirectories(screenshotsDirectory).filter(name => !nonLocaleDirectories.has(name));
  const extraLocales = localeDirectories.filter(locale => !chromeLocales.includes(locale));
  const missingLocales = chromeLocales.filter(locale => !localeDirectories.includes(locale));
  const expectedFiles = manifest.slots.map(slot => slot.file).sort();

  if (extraLocales.length > 0) fail(`screenshot locale folders are not tracked Chrome locales: ${extraLocales.join(", ")}`);
  if (!localeDirectories.includes(manifest.fallbackLocale)) fail(`fallback screenshot locale is missing: ${manifest.fallbackLocale}`);

  if (requireAllScreenshotLocales && missingLocales.length > 0) {
    fail(`localized screenshot folders missing: ${missingLocales.join(", ")}`);
  } else if (missingLocales.length > 0) {
    notes.push(`Localized screenshot folders present for ${localeDirectories.length}/${chromeLocales.length} Chrome locales.`);
    notes.push(`Missing localized screenshot folders: ${missingLocales.join(", ")}`);
  }

  for (const locale of localeDirectories) {
    const localeDirectory = path.join(screenshotsDirectory, locale);
    const files = listFiles(localeDirectory);

    if (files.length === 0) fail(`${relativePath(localeDirectory)} must contain at least one screenshot`);
    if (files.length > manifest.policy.maxScreenshotsPerLocale) {
      fail(`${relativePath(localeDirectory)} has ${files.length} screenshots; Chrome Web Store allows at most ${manifest.policy.maxScreenshotsPerLocale}`);
    }

    if (manifest.policy.localeFoldersMustMatchFallback || locale === manifest.fallbackLocale) {
      assertSetEquals(`${locale} screenshot files`, files, expectedFiles);
    }

    for (const slot of manifest.slots) {
      const filePath = path.join(localeDirectory, slot.file);
      if (existsSync(filePath)) verifyScreenshotFile(filePath, slot, manifest);
    }
  }
}

function readNonEmptyLines(filePath) {
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function verifyPromoVideoUrlFile(filePath) {
  const lines = readNonEmptyLines(filePath);

  if (lines.length !== 1) {
    fail(`${relativePath(filePath)} must contain exactly one non-empty YouTube watch URL`);
    return;
  }

  if (!youtubeVideoUrlPattern.test(lines[0])) {
    fail(`${relativePath(filePath)} must contain a URL shaped like https://www.youtube.com/watch?v=VIDEO_ID`);
  }
}

function verifyPromoVideos() {
  const localizedDirectory = path.join(promoVideosDirectory, "localized");
  const globalVideoPath = path.join(promoVideosDirectory, "global.txt");
  const expectedLocalizedFiles = chromeLocales.map(locale => `${locale}.txt`).sort();

  if (!existsSync(promoVideosDirectory)) {
    fail("store-listing/chrome-web-store/media/promo-videos is missing");
    return;
  }

  const directTextFiles = listTextFiles(promoVideosDirectory);
  assertSetEquals("promo video root text files", directTextFiles, ["global.txt"]);

  const directories = listDirectories(promoVideosDirectory);
  assertSetEquals("promo video directories", directories, ["localized"]);

  if (!existsSync(globalVideoPath)) {
    fail(`${relativePath(globalVideoPath)} is missing`);
  } else {
    verifyPromoVideoUrlFile(globalVideoPath);
  }

  if (!existsSync(localizedDirectory)) {
    fail(`${relativePath(localizedDirectory)} is missing`);
    return;
  }

  const localizedFiles = listTextFiles(localizedDirectory);
  assertSetEquals("localized promo video URL files", localizedFiles, expectedLocalizedFiles);

  for (const fileName of localizedFiles) {
    verifyPromoVideoUrlFile(path.join(localizedDirectory, fileName));
  }
}

const manifest = parseJSON(manifestPath);
verifyManifest(manifest);
verifyStoreIcon(manifest);
verifyScreenshotCopy(manifest);
verifyGlobalScreenshots(manifest);
verifyScreenshotLocales(manifest);
verifyPromoVideos();

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join("\n"));
  process.exit(1);
}

for (const note of notes) {
  console.log(note);
}
console.log("Chrome Web Store media verification passed.");
