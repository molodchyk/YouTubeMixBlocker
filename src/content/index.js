// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2023-2026 Oleksandr Molodchyk

console.log("MixBlocker active", window.location.href);

let lastPageURL = null;
let runtimeMessagingDisabled = false;

function sendRuntimeMessage(message) {
  if (runtimeMessagingDisabled) return;

  try {
    if (!globalThis.chrome || !chrome.runtime || !chrome.runtime.id) {
      runtimeMessagingDisabled = true;
      return;
    }

    const response = chrome.runtime.sendMessage(message);

    if (response && typeof response.catch === "function") {
      response.catch(() => {
        runtimeMessagingDisabled = true;
      });
    }
  } catch (_error) {
    runtimeMessagingDisabled = true;
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
