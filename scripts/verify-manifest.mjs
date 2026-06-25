// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function readManifest(outputDirectory) {
  const manifestPath = path.join(root, outputDirectory, "manifest.json");

  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`${manifestPath}: ${error.message}`);
    return null;
  }
}

function assertFile(outputDirectory, relativePath, label) {
  const filePath = path.join(root, outputDirectory, relativePath);

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    fail(`${label} missing: ${outputDirectory}/${relativePath}`);
  }
}

function assertDirectory(outputDirectory, relativePath, label) {
  const directoryPath = path.join(root, outputDirectory, relativePath);

  if (!existsSync(directoryPath) || !statSync(directoryPath).isDirectory()) {
    fail(`${label} missing: ${outputDirectory}/${relativePath}`);
  }
}

function verifyTarget(target, outputDirectory) {
  const manifest = readManifest(outputDirectory);
  if (!manifest) return;

  assertDirectory(outputDirectory, `_locales/${manifest.default_locale}`, `${target} default locale`);

  for (const [size, iconPath] of Object.entries(manifest.icons || {})) {
    assertFile(outputDirectory, iconPath, `${target} ${size}px icon`);
  }

  if (manifest.action && manifest.action.default_popup) {
    assertFile(outputDirectory, manifest.action.default_popup, `${target} popup`);
  } else {
    fail(`${target} manifest is missing action.default_popup`);
  }

  for (const [index, contentScript] of (manifest.content_scripts || []).entries()) {
    for (const scriptPath of contentScript.js || []) {
      assertFile(outputDirectory, scriptPath, `${target} content script ${index}`);
    }
  }

  if (target === "chrome") {
    if (!manifest.background || !manifest.background.service_worker) {
      fail("Chrome manifest must use background.service_worker");
    } else {
      assertFile(outputDirectory, manifest.background.service_worker, "Chrome service worker");
    }

    if (manifest.browser_specific_settings) {
      fail("Chrome manifest must not include browser_specific_settings");
    }
  }

  if (target === "firefox") {
    if (!manifest.background || !Array.isArray(manifest.background.scripts)) {
      fail("Firefox manifest must use background.scripts");
    } else {
      for (const scriptPath of manifest.background.scripts) {
        assertFile(outputDirectory, scriptPath, "Firefox background script");
      }
    }

    if (!manifest.browser_specific_settings?.gecko?.id) {
      fail("Firefox manifest must include browser_specific_settings.gecko.id");
    }
  }
}

verifyTarget("chrome", "dist");
verifyTarget("firefox", "dist-firefox");

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("Manifest verification passed for Chrome and Firefox build outputs.");
