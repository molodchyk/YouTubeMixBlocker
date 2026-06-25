// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceDirectory = path.join(root, "store-listing/firefox-add-ons/amo-listing");
const defaultOutputPath = path.join(root, "store-listing/firefox-add-ons/amo-listing.generated.json");
const args = process.argv.slice(2);

function getArgValue(name) {
  const prefix = `${name}=`;
  const inline = args.find(arg => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index !== -1) return args[index + 1];

  return null;
}

const shouldWrite = args.includes("--write");
const requestedLocale = getArgValue("--locale");
const outputPath = getArgValue("--output") || defaultOutputPath;

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function readJSON(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    fail(`${path.relative(root, filePath)}: ${error.message}`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

async function listLocaleDirectories() {
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(locale => !requestedLocale || locale === requestedLocale)
    .sort();
}

async function buildPayload() {
  const localeDirectories = await listLocaleDirectories();

  if (requestedLocale && localeDirectories.length === 0) {
    fail(`No AMO listing source found for locale ${requestedLocale}.`);
  }

  if (localeDirectories.length === 0) {
    fail("No AMO listing locale sources found.");
  }

  const payload = {
    name: {},
    summary: {},
    description: {}
  };

  for (const locale of localeDirectories) {
    const localeDirectory = path.join(sourceDirectory, locale);
    const metadataPath = path.join(localeDirectory, "metadata.json");
    const descriptionPath = path.join(localeDirectory, "description.md");

    if (!existsSync(metadataPath)) {
      fail(`${path.relative(root, metadataPath)} is required.`);
    }

    if (!existsSync(descriptionPath)) {
      fail(`${path.relative(root, descriptionPath)} is required.`);
    }

    const metadata = await readJSON(metadataPath);
    const description = assertString(
      await readFile(descriptionPath, "utf8"),
      `${path.relative(root, descriptionPath)}`
    );

    payload.name[locale] = assertString(metadata.name, `${path.relative(root, metadataPath)} name`);
    payload.summary[locale] = assertString(metadata.summary, `${path.relative(root, metadataPath)} summary`);
    payload.description[locale] = description;
  }

  return payload;
}

const payload = await buildPayload();
const output = `${JSON.stringify(payload, null, 2)}\n`;

if (shouldWrite) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
  console.log(`Wrote ${path.relative(root, outputPath)} with ${Object.keys(payload.description).length} locale(s).`);
} else {
  process.stdout.write(output);
}
