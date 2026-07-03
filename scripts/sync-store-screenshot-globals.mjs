// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const screenshotsDirectory = path.join(root, "store-listing/chrome-web-store/media/screenshots");
const manifestPath = path.join(screenshotsDirectory, "manifest.json");

function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function relativePath(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

const manifest = readJSON(manifestPath);
const fallbackDirectory = path.join(screenshotsDirectory, manifest.fallbackLocale);
let copiedCount = 0;

if (!existsSync(fallbackDirectory)) {
  throw new Error(`Fallback screenshot folder is missing: ${relativePath(fallbackDirectory)}`);
}

mkdirSync(screenshotsDirectory, { recursive: true });

for (const slot of manifest.slots) {
  const sourcePath = path.join(fallbackDirectory, slot.file);
  const outputPath = path.join(screenshotsDirectory, slot.file);

  if (!existsSync(sourcePath)) {
    throw new Error(`Fallback screenshot is missing: ${relativePath(sourcePath)}`);
  }

  copyFileSync(sourcePath, outputPath);
  copiedCount += 1;
}

console.log(`Synced ${copiedCount} global Chrome Web Store screenshot(s) from ${manifest.fallbackLocale}.`);
