// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const failures = [];
const latestChromeZip = "youtube-mix-blocker-chrome-1.5.3.zip";
const latestFirefoxZip = "youtube-mix-blocker-firefox-1.5.1.zip";
const latestFirefoxSourceZip = "youtube-mix-blocker-firefox-1.5.1-source.zip";

function fail(message) {
  failures.push(message);
}

function runNodeScript(scriptName) {
  execFileSync(process.execPath, [path.join(root, "scripts", scriptName)], {
    cwd: root,
    stdio: "inherit"
  });
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(relativePath, expected) {
  const content = readText(relativePath);

  if (!content.includes(expected)) {
    fail(`${relativePath} must include: ${expected}`);
  }
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter(name => statSync(path.join(directory, name)).isFile())
    .sort();
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];

  const results = [];

  for (const name of readdirSync(directory)) {
    const filePath = path.join(directory, name);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      results.push(...walkFiles(filePath));
    } else if (stats.isFile()) {
      results.push(filePath);
    }
  }

  return results.sort();
}

function listZipEntryNames(zipPath) {
  const buffer = readFileSync(zipPath);
  const entries = [];

  for (let offset = 0; offset <= buffer.length - 46; offset += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) continue;

    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;

    if (fileNameEnd > buffer.length) break;

    entries.push(buffer.toString("utf8", fileNameStart, fileNameEnd));
    offset = fileNameEnd + extraFieldLength + fileCommentLength - 1;
  }

  return entries;
}

function isSecretPath(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, "/");

  return normalizedPath === "secret" ||
    normalizedPath.startsWith("secret/") ||
    normalizedPath.endsWith("/secret") ||
    normalizedPath.includes("/secret/") ||
    normalizedPath.endsWith("/amo-env.ps1") ||
    normalizedPath === "amo-env.ps1";
}

function verifyReleaseZips() {
  const releaseDirectory = path.join(root, "release");
  if (!existsSync(releaseDirectory)) return;

  for (const fileName of listFiles(releaseDirectory)) {
    if (/^youtube-mix-blocker-chrome-.*\.zip$/.test(fileName) && fileName !== latestChromeZip) {
      fail(`release/${fileName} is stale; latest CWS package is ${latestChromeZip}`);
    }

    if (/^youtube-mix-blocker-firefox-[0-9]+(\.[0-9]+)*\.zip$/.test(fileName) && fileName !== latestFirefoxZip) {
      fail(`release/${fileName} is stale; latest AMO package is ${latestFirefoxZip}`);
    }

    if (/^youtube-mix-blocker-firefox-[0-9]+(\.[0-9]+)*-source\.zip$/.test(fileName) && fileName !== latestFirefoxSourceZip) {
      fail(`release/${fileName} is stale; latest AMO source package is ${latestFirefoxSourceZip}`);
    }
  }
}

function verifyNoSecretArtifacts() {
  for (const outputDirectory of ["dist", "dist-firefox"]) {
    for (const filePath of walkFiles(path.join(root, outputDirectory))) {
      const relativePath = path.relative(path.join(root, outputDirectory), filePath);

      if (isSecretPath(relativePath)) {
        fail(`${outputDirectory}/${relativePath} must not be included in build output`);
      }
    }
  }

  const releaseDirectory = path.join(root, "release");
  for (const fileName of listFiles(releaseDirectory).filter(name => name.endsWith(".zip"))) {
    for (const entryName of listZipEntryNames(path.join(releaseDirectory, fileName))) {
      if (isSecretPath(entryName)) {
        fail(`release/${fileName} must not include secret file: ${entryName}`);
      }
    }
  }
}

runNodeScript("verify-locales.mjs");
runNodeScript("verify-manifest.mjs");
verifyReleaseZips();
verifyNoSecretArtifacts();

const packageJSON = JSON.parse(readText("package.json"));
if (packageJSON.license !== "GPL-3.0-only") {
  fail("package.json license must be GPL-3.0-only");
}

if (!existsSync(path.join(root, "LICENSE"))) {
  fail("LICENSE file is required");
}

assertIncludes("README.md", "GPL-3.0-only");
assertIncludes("README.md", "src/chrome/_locales");
assertIncludes("README.md", "src/firefox/_locales");
assertIncludes("README.md", "66 localized Chrome extension UI languages");
assertIncludes("PRIVACY.md", "activeTab");
assertIncludes("PRIVACY.md", "storage");
assertIncludes("PRIVACY.md", "https://www.youtube.com/*");
assertIncludes("PRIVACY.md", "does not make network requests");

for (const fileName of listFiles(path.join(root, "store-listing/chrome-web-store/listing")).filter(name => name.endsWith(".txt"))) {
  const relativePath = `store-listing/chrome-web-store/listing/${fileName}`;
  const content = readText(relativePath);

  if (!content.includes("Open source under the GPL-3.0 license:")) {
    fail(`${relativePath} must include the GPL-3.0 store listing footer`);
  }

  if (!content.includes("https://github.com/molodchyk/YouTubeMixBlocker")) {
    fail(`${relativePath} must include the GitHub source URL`);
  }
}

for (const relativePath of [
  "docs/chrome-web-store-additional-fields.md",
  "docs/chrome-web-store-category.md",
  "docs/chrome-web-store-privacy-form.md",
  "docs/release-checklist.md"
]) {
  if (!existsSync(path.join(root, relativePath))) {
    fail(`${relativePath} is required`);
  }
}

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("Release verification passed.");
