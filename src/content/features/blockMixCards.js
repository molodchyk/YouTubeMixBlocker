// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2023-2026 Oleksandr Molodchyk

/* ---------- MIX DETECTION ---------- */

const blockedMixKeys = new Set();

function isMixURL(url) {
  return /[?&]list=RD/.test(url);
}

function getMixKey(url) {
  try {
    const parsedURL = new URL(url, window.location.href);
    const videoId = parsedURL.searchParams.get("v") || "";
    const listId = parsedURL.searchParams.get("list") || "";

    return `${videoId}|${listId}`;
  } catch (_error) {
    return url;
  }
}

function resetBlockedMixKeys() {
  blockedMixKeys.clear();
}

function isWatchPage() {
  return window.location.pathname === "/watch";
}

function getCurrentSurface() {
  if (window.location.pathname === "/results") {
    return "search";
  }

  if (isWatchPage()) {
    return "watchSidebar";
  }

  return "recommendations";
}

function reportMixBlocked(surface) {
  try {
    sendRuntimeMessage({
      type: "mix-blocked",
      surface
    });
  } catch (_error) {
    // The extension was reloaded while this content script was still alive.
  }
}

/* Structural heuristic fallback (old behaviour retained) */
function findCardContainer(link) {
  let el = link;

  while (el && el !== document.body) {
    const hasImage = el.querySelector && el.querySelector("img");
    const linkCount = el.querySelectorAll ? el.querySelectorAll("a[href]").length : 0;

    if (hasImage && linkCount > 1) {
      return el;
    }

    el = el.parentElement;
  }

  return null;
}

/* ---------- RENDERER-LEVEL RESOLUTION ---------- */

function findRendererContainer(element) {
  const richGridItem = element.closest("ytd-rich-item-renderer");

  if (richGridItem && !isWatchPage()) {
    return richGridItem;
  }

  return element.closest(
    "yt-lockup-view-model, " +
    "ytd-video-renderer, " +
    "ytd-compact-video-renderer, " +
    "ytd-grid-video-renderer"
  );
}

function shouldSoftCollapse(element) {
  return window.location.pathname === "/" &&
    element.tagName.toLowerCase() === "ytd-rich-item-renderer";
}

function isEmptyRichGridSlot(element) {
  if (!element || element.tagName.toLowerCase() !== "ytd-rich-item-renderer") {
    return false;
  }

  const content = element.querySelector(":scope > #content");

  return Boolean(
    content &&
    content.children.length === 0 &&
    content.querySelectorAll("a[href], img, yt-img-shadow, ytd-thumbnail").length === 0 &&
    content.textContent.trim() === ""
  );
}

function removeEmptyRichGridSlots(root = document) {
  if (window.location.pathname !== "/") return 0;

  const slots = root.matches && root.matches("ytd-rich-item-renderer")
    ? [root]
    : Array.from(root.querySelectorAll ? root.querySelectorAll("ytd-rich-item-renderer") : []);

  let removed = 0;

  slots.forEach(slot => {
    if (isEmptyRichGridSlot(slot)) {
      slot.remove();
      removed++;
    }
  });

  if (removed) {
    console.log("Empty Mix slots removed:", removed);
  }

  return removed;
}

function markAndRemove(el, debugURL, surface, mixKey) {
  if (!el || el.hasAttribute("data-mix-blocked")) return false;

  el.setAttribute("data-mix-blocked", "true");

  if (shouldSoftCollapse(el)) {
    el.hidden = true;
    el.style.setProperty("display", "none", "important");
  } else {
    el.remove();
  }

  if (!blockedMixKeys.has(mixKey)) {
    blockedMixKeys.add(mixKey);
    reportMixBlocked(surface);
  }

  console.log("Mix removed:", debugURL);
  return true;
}

function handleMixLink(link) {
  if (!isMixURL(link.href)) return false;

  const mixKey = getMixKey(link.href);

  /* Prefer renderer removal (prevents gaps) */
  const renderer = findRendererContainer(link);
  if (renderer) {
    return markAndRemove(renderer, link.href, getCurrentSurface(), mixKey);
  }

  if (isWatchPage()) {
    return false;
  }

  /* Fallback to heuristic container (old resilience) */
  const heuristic = findCardContainer(link);
  if (heuristic) {
    return markAndRemove(heuristic, link.href, getCurrentSurface(), mixKey);
  }

  return false;
}

function scanForMixes(root = document) {
  if (!root.querySelectorAll) return;

  const links = root.querySelectorAll("a[href]");
  let removed = 0;

  links.forEach(link => {
    if (handleMixLink(link)) {
      removed++;
    }
  });

  if (removed) {
    console.log("Mixes removed in pass:", removed);
  }
  if (!removed) {
    removeEmptyRichGridSlots(root);
  }
}
