// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

// Generated from src/content/. Do not edit dist/content.js directly.

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
  const tagName = element.tagName.toLowerCase();

  if (window.location.pathname === "/" && tagName === "ytd-rich-item-renderer") {
    return true;
  }

  return isWatchPage() && [
    "ytd-compact-video-renderer",
    "ytd-video-renderer",
    "yt-lockup-view-model",
    "ytd-compact-radio-renderer"
  ].includes(tagName);
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

function getHomeGridItemsPerRow(gridContents) {
  const richItem = gridContents.querySelector("ytd-rich-item-renderer[items-per-row]");
  const renderer = gridContents.closest("ytd-rich-grid-renderer");
  const itemValue = richItem && Number.parseInt(richItem.getAttribute("items-per-row"), 10);
  const cssValue = renderer &&
    Number.parseInt(getComputedStyle(renderer).getPropertyValue("--ytd-rich-grid-items-per-row"), 10);

  return Math.max(1, itemValue || cssValue || 1);
}

function isSoftBlockedHomeGridItem(element) {
  return element.tagName.toLowerCase() === "ytd-rich-item-renderer" &&
    element.getAttribute("data-mix-blocked") === "true";
}

function isVisibleBox(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0";
}

function isReadyHomeGridItem(element) {
  if (element.tagName.toLowerCase() !== "ytd-rich-item-renderer") {
    return true;
  }

  if (!isVisibleBox(element)) {
    return false;
  }

  const thumbnail = element.querySelector(
    "a#thumbnail, ytd-thumbnail, yt-image, yt-img-shadow, img"
  );
  const titleLink = element.querySelector(
    "a#video-title-link, a#video-title, h3 a[href], a[href]"
  );

  return Boolean(
    titleLink &&
    isVisibleBox(titleLink) &&
    (!thumbnail || isVisibleBox(thumbnail))
  );
}

function isUnavailableHomeGridItem(element) {
  return element.tagName.toLowerCase() === "ytd-rich-item-renderer" &&
    (isSoftBlockedHomeGridItem(element) || !isReadyHomeGridItem(element));
}

function clearHomeGridOrder(gridContents) {
  gridContents.querySelectorAll("[data-ymb-grid-order]").forEach(child => {
    child.style.removeProperty("order");
    child.removeAttribute("data-ymb-grid-order");
  });
}

function setHomeGridOrder(element, order) {
  const orderValue = String(order);

  if (element.style.getPropertyValue("order") === orderValue) {
    element.setAttribute("data-ymb-grid-order", "true");
    return;
  }

  element.style.setProperty("order", orderValue);
  element.setAttribute("data-ymb-grid-order", "true");
}

function compactHomeGridContents(gridContents) {
  if (!gridContents) return;

  const children = Array.from(gridContents.children);
  const itemsPerRow = getHomeGridItemsPerRow(gridContents);
  const maxCompactedRichItems = itemsPerRow * 3;
  const topChildren = [];
  let topRichItemCount = 0;

  for (const child of children) {
    topChildren.push(child);

    if (
      child.tagName.toLowerCase() === "ytd-rich-item-renderer" &&
      !isUnavailableHomeGridItem(child)
    ) {
      topRichItemCount++;
    }

    if (topRichItemCount >= maxCompactedRichItems) {
      break;
    }
  }

  const hasUnavailableItem = topChildren.some(isUnavailableHomeGridItem);

  if (!hasUnavailableItem) {
    clearHomeGridOrder(gridContents);
    return;
  }

  let visibleRichItemCount = 0;
  const baseOrder = -10000;
  const desiredOrders = new Map();

  topChildren.forEach(child => {
    const tagName = child.tagName.toLowerCase();

    if (isUnavailableHomeGridItem(child)) {
      return;
    }

    if (tagName === "ytd-rich-item-renderer") {
      desiredOrders.set(child, baseOrder + (visibleRichItemCount * 2));
      visibleRichItemCount++;
      return;
    }

    if (tagName === "ytd-continuation-item-renderer") {
      return;
    }

    const nextRowBoundary = Math.max(
      itemsPerRow,
      Math.ceil(visibleRichItemCount / itemsPerRow) * itemsPerRow
    );
    desiredOrders.set(child, baseOrder + ((nextRowBoundary * 2) - 1));
  });

  gridContents.querySelectorAll("[data-ymb-grid-order]").forEach(child => {
    if (!desiredOrders.has(child)) {
      child.style.removeProperty("order");
      child.removeAttribute("data-ymb-grid-order");
    }
  });

  desiredOrders.forEach((order, child) => {
    setHomeGridOrder(child, order);
  });
}

function compactHomeGrids(root = document) {
  if (window.location.pathname !== "/") return;

  const nearestGrid = root.closest && root.closest("ytd-rich-grid-renderer #contents");
  const grids = nearestGrid
    ? [nearestGrid]
    : root.matches && root.matches("ytd-rich-grid-renderer #contents")
      ? [root]
      : Array.from(root.querySelectorAll ? root.querySelectorAll("ytd-rich-grid-renderer #contents") : []);

  grids.forEach(compactHomeGridContents);
}

function compactHomeGridAround(element) {
  if (window.location.pathname !== "/") return;

  const gridContents = element && element.closest("ytd-rich-grid-renderer #contents");
  const root = gridContents || document;

  removeEmptyRichGridSlots(root);
  compactHomeGrids(root);
  window.requestAnimationFrame(() => {
    removeEmptyRichGridSlots(root);
    compactHomeGrids(root);
  });
}

function markAndRemove(el, debugURL, surface, mixKey) {
  if (!el || el.hasAttribute("data-mix-blocked")) return false;

  el.setAttribute("data-mix-blocked", "true");
  const isNewMix = !blockedMixKeys.has(mixKey);

  if (shouldSoftCollapse(el)) {
    el.hidden = true;
    el.style.setProperty("display", "none", "important");
  } else {
    el.remove();
  }

  if (isNewMix) {
    blockedMixKeys.add(mixKey);
    reportMixBlocked(surface);
  }

  compactHomeGridAround(el);

  console.log(isNewMix ? "Mix removed and reported:" : "Mix removed again:", debugURL);
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
    compactHomeGrids(root);
  }
}

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

/* ---------- SPA OBSERVER (critical on YouTube) ---------- */

function observePageChanges(onElementAdded) {
  const pendingRoots = new Set();
  let scanScheduled = false;

  function scheduleScan(root) {
    pendingRoots.add(root);

    if (scanScheduled) return;

    scanScheduled = true;
    window.setTimeout(() => {
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      scanScheduled = false;

      roots.forEach(onElementAdded);
    }, 100);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          scheduleScan(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  return observer;
}

/* ---------- SPA NAVIGATION DETECTION ---------- */

function watchNavigation(onNavigation, cleanURLValue) {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  function cleanHistoryArgs(args) {
    if (args.length < 3 || !cleanURLValue) {
      return args;
    }

    const cleanedURL = cleanURLValue(args[2]);

    if (cleanedURL !== args[2]) {
      const nextArgs = Array.from(args);
      nextArgs[2] = cleanedURL;
      try {
        sendRuntimeMessage({ type: "mix-url-cleaned" });
      } catch (_error) {
        // The extension was reloaded while this content script was still alive.
      }
      console.log("Mix URL cleaned:", cleanedURL);
      return nextArgs;
    }

    return args;
  }

  history.pushState = function () {
    const result = originalPushState.apply(this, cleanHistoryArgs(arguments));
    onNavigation();
    return result;
  };

  history.replaceState = function () {
    const result = originalReplaceState.apply(this, cleanHistoryArgs(arguments));
    onNavigation();
    return result;
  };

  window.addEventListener("popstate", onNavigation);
}

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
