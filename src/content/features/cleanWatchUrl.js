// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

/* ---------- URL NORMALISATION (watch page mixes) ---------- */

function reportMixURLCleaned() {
  try {
    sendRuntimeMessage({
      type: "mix-url-cleaned"
    });
  } catch (_error) {
    // The extension was reloaded while this content script was still alive.
  }
}

function getCleanMixURLValue(value) {
  if (!value) return value;

  try {
    const rawValue = String(value);
    const url = new URL(rawValue, window.location.href);
    const list = url.searchParams.get("list");

    if (!list || !list.startsWith("RD")) {
      return value;
    }

    url.searchParams.delete("list");
    url.searchParams.delete("start_radio");

    if (rawValue.startsWith("/") || rawValue.startsWith("?")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return url.toString();
  } catch (_error) {
    return value;
  }
}

function cleanMixURL() {
  const cleanedURL = getCleanMixURLValue(window.location.href);

  if (cleanedURL === window.location.href) return false;

  if (window.location.pathname === "/watch") {
    reportMixURLCleaned();
    console.log("Mix URL redirected:", cleanedURL);
    window.location.replace(cleanedURL);
    return true;
  }

  history.replaceState(history.state, "", cleanedURL);
  reportMixURLCleaned();

  console.log("Mix URL cleaned:", cleanedURL);
  return false;
}
