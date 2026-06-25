// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDirectory = "dist";
const failures = [];

function fail(message) {
  failures.push(message);
}

function readManifest() {
  const manifestPath = path.join(root, outputDirectory, "manifest.json");

  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`${manifestPath}: ${error.message}`);
    return null;
  }
}

function assertFile(relativePath, label) {
  const filePath = path.join(root, outputDirectory, relativePath);

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    fail(`${label} missing: ${outputDirectory}/${relativePath}`);
  }
}

function assertDirectory(relativePath, label) {
  const directoryPath = path.join(root, outputDirectory, relativePath);

  if (!existsSync(directoryPath) || !statSync(directoryPath).isDirectory()) {
    fail(`${label} missing: ${outputDirectory}/${relativePath}`);
  }
}

const manifest = readManifest();

if (manifest) {
  assertDirectory(`_locales/${manifest.default_locale}`, "Chrome default locale");

  for (const [size, iconPath] of Object.entries(manifest.icons || {})) {
    assertFile(iconPath, `Chrome ${size}px icon`);
  }

  if (manifest.action && manifest.action.default_popup) {
    assertFile(manifest.action.default_popup, "Chrome popup");
  } else {
    fail("Chrome manifest is missing action.default_popup");
  }

  for (const [index, contentScript] of (manifest.content_scripts || []).entries()) {
    for (const scriptPath of contentScript.js || []) {
      assertFile(scriptPath, `Chrome content script ${index}`);
    }
  }

  if (!manifest.background || !manifest.background.service_worker) {
    fail("Chrome manifest must use background.service_worker");
  } else {
    assertFile(manifest.background.service_worker, "Chrome service worker");
  }

  if (manifest.browser_specific_settings) {
    fail("Chrome manifest must not include browser_specific_settings");
  }
}

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("Manifest verification passed for Chrome build output.");
