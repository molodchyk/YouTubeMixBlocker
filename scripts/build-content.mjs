// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const target = process.argv[2] || "chrome";

if (!["chrome", "firefox"].includes(target)) {
  throw new Error(`Unknown build target: ${target}`);
}

const outputDirectory = target === "firefox" ? "dist-firefox" : "dist";
const versions = {
  chrome: "1.5.2",
  firefox: "1.5.1"
};

const entryFile = "src/content/index.js";
const featureFiles = [
  "src/content/features/blockMixCards.js",
  "src/content/features/cleanWatchUrl.js",
  "src/content/features/spaEvents.js"
];

const copyrightHeader = [
  "// SPDX-License-Identifier: GPL-3.0-or-later",
  "// Copyright (C) 2023-2026 Oleksandr Molodchyk"
].join("\n");

function stripSourceHeader(source) {
  return source
    .replace(/^\/\/ SPDX-License-Identifier: GPL-3\.0-or-later\r?\n/, "")
    .replace(/^\/\/ Copyright \(C\) 2023-2026 Oleksandr Molodchyk\r?\n/, "")
    .trim();
}

const entry = await readFile(path.join(root, entryFile), "utf8");
const entryBody = stripSourceHeader(entry);

const features = await Promise.all(
  featureFiles.map(file => readFile(path.join(root, file), "utf8"))
);

function applyFirefoxContentFixes(source) {
  const singleVideoRadioGuard = [
    "function isSingleVideoRadioURL(url) {",
    "  try {",
    "    const parsedURL = new URL(url, window.location.href);",
    "    const videoId = parsedURL.searchParams.get(\"v\");",
    "    const listId = parsedURL.searchParams.get(\"list\");",
    "",
    "    return Boolean(videoId && listId === `RD${videoId}`);",
    "  } catch (_error) {",
    "    return false;",
    "  }",
    "}",
    ""
  ].join("\n");

  return source
    .replace(
      "function getMixKey(url) {",
      `${singleVideoRadioGuard}function getMixKey(url) {`
    )
    .replace(
      /function handleMixLink\(link\) \{\r?\n  if \(!isMixURL\(link\.href\)\) return false;\r?\n/,
      "function handleMixLink(link) {\n  if (!isMixURL(link.href)) return false;\n  if (isSingleVideoRadioURL(link.href)) return false;\n"
    );
}

function applyChromeContentFixes(source) {
  return source
    .replace(
      /function shouldSoftCollapse\(element\) \{\r?\n  return window\.location\.pathname === "\/" &&\r?\n    element\.tagName\.toLowerCase\(\) === "ytd-rich-item-renderer";\r?\n\}/,
      [
        "function shouldSoftCollapse(element) {",
        "  const tagName = element.tagName.toLowerCase();",
        "",
        "  if (window.location.pathname === \"/\" && tagName === \"ytd-rich-item-renderer\") {",
        "    return true;",
        "  }",
        "",
        "  return isWatchPage() && [",
        "    \"ytd-compact-video-renderer\",",
        "    \"ytd-video-renderer\",",
        "    \"yt-lockup-view-model\",",
        "    \"ytd-compact-radio-renderer\"",
        "  ].includes(tagName);",
        "}"
      ].join("\n")
    );
}

const generatedNotice = "// Generated from src/content/. Do not edit dist/content.js directly.";
const outputParts = [
  copyrightHeader,
  generatedNotice,
  ...features.map(stripSourceHeader),
  entryBody
].filter(Boolean);
const sharedOutput = outputParts.join("\n\n");
const contentOutput = target === "firefox"
  ? applyFirefoxContentFixes(sharedOutput)
  : applyChromeContentFixes(sharedOutput);
const output = `${contentOutput}\n`;

function createManifest(buildTarget) {
  const icon48 = buildTarget === "firefox" ? "icon-48.png" : "icon-64.png";
  const manifest = {
    manifest_version: 3,
    name: "__MSG_appName__",
    version: versions[buildTarget],
    default_locale: "en",
    permissions: [
      "activeTab",
      "storage"
    ],
    host_permissions: [
      "https://www.youtube.com/*"
    ],
    background: buildTarget === "firefox"
      ? { scripts: ["background.js"] }
      : { service_worker: "background.js" },
    action: {
      default_title: "__MSG_appName__",
      default_popup: "popup/popup.html"
    },
    content_scripts: [
      {
        matches: ["*://www.youtube.com/*"],
        js: ["content.js"]
      }
    ],
    description: "__MSG_appDescription__",
    icons: {
      16: "icon-16.png",
      48: icon48,
      128: "icon-128.png"
    }
  };

  if (buildTarget === "firefox") {
    manifest.browser_specific_settings = {
      gecko: {
        id: "youtube-mix-blocker@molodchyk.dev",
        data_collection_permissions: {
          required: ["none"]
        },
        strict_min_version: "140.0"
      },
      gecko_android: {
        strict_min_version: "142.0"
      }
    };
  }

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

const outputPath = path.join(root, outputDirectory);

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });
await writeFile(path.join(outputPath, "content.js"), output);
await writeFile(path.join(outputPath, "manifest.json"), createManifest(target));
await cp(path.join(root, "src/background.js"), path.join(outputPath, "background.js"));
await cp(path.join(root, "src/icons"), outputPath, {
  recursive: true
});
if (target === "chrome") {
  await rm(path.join(outputPath, "icon-48.png"), { force: true });
}
await cp(path.join(root, "src/popup"), path.join(outputPath, "popup"), {
  recursive: true
});
await cp(path.join(root, "src/_locales"), path.join(outputPath, "_locales"), {
  recursive: true
});

console.log(`Built ${outputDirectory}/ for ${target} from ${featureFiles.length + 1} content source files.`);
