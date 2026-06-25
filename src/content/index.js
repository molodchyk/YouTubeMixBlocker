// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

console.log("MixBlocker active", window.location.href);

let lastPageURL = null;

function sendRuntimeMessage(message) {
  try {
    if (!globalThis.chrome || !chrome.runtime || !chrome.runtime.id) {
      return;
    }

    const response = chrome.runtime.sendMessage(message);

    if (response && typeof response.catch === "function") {
      response.catch(() => {});
    }
  } catch (_error) {
    // The extension context can be unavailable during reloads or page teardown.
  }
}

function reportPageChanged() {
  if (window.location.href === lastPageURL) return;

  lastPageURL = window.location.href;
  resetBlockedMixKeys();
  sendRuntimeMessage({
    type: "page-changed"
  });
}

function onNavigation() {
  if (cleanMixURL()) return;

  reportPageChanged();
  scanForMixes();
}

observePageChanges(scanForMixes);
watchNavigation(onNavigation, getCleanMixURLValue);

/* Initial execution */
onNavigation();
