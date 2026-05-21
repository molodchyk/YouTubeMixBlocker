/*
 * YouTube Mix Blocker Extension
 *
 * file: content.js
 * 
 * This file is part of the YouTube Mix Blocker Extension.
 *
 * YouTube Mix Blocker Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * YouTube Mix Blocker Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with YouTube Mix Blocker Extension. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Oleksandr Molodchyk
 * Copyright (C) 2023-2026 Oleksandr Molodchyk
 */

console.log("MixBlocker active", window.location.href);

/* ---------- MIX DETECTION (from old stable logic) ---------- */

function isMixURL(url) {
  return /[?&]list=RD/.test(url);
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

/* ---------- RENDERER-LEVEL RESOLUTION (gap-safe) ---------- */

function findRendererContainer(element) {
  return element.closest(
    "ytd-rich-item-renderer, " +
    "ytd-video-renderer, " +
    "ytd-compact-video-renderer, " +
    "ytd-grid-video-renderer"
  );
}

function markAndRemove(el, debugURL) {
  if (!el || el.hasAttribute("data-mix-blocked")) return;

  el.setAttribute("data-mix-blocked", "true");
  el.remove();

  console.log("Mix removed:", debugURL);
}

/* ---------- CORE BLOCKING LOGIC ---------- */

function handleMixLink(link) {
  if (!isMixURL(link.href)) return false;

  /* Prefer renderer removal (prevents gaps) */
  const renderer = findRendererContainer(link);
  if (renderer) {
    markAndRemove(renderer, link.href);
    return true;
  }

  /* Fallback to heuristic container (old resilience) */
  const heuristic = findCardContainer(link);
  if (heuristic) {
    markAndRemove(heuristic, link.href);
    return true;
  }

  return false;
}

/* Scan any subtree (old SPA-safe behaviour retained) */
function scanForMixes(root = document) {
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
}

/* ---------- SPA OBSERVER (critical on YouTube) ---------- */

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        scanForMixes(node);
      }
    }
  }
});

/* ---------- URL NORMALISATION (watch page mixes) ---------- */

function cleanMixURL() {
  const url = new URL(window.location.href);
  const list = url.searchParams.get("list");

  if (list && list.startsWith("RD")) {
    url.searchParams.delete("list");
    url.searchParams.delete("start_radio");

    history.replaceState(null, "", url.toString());

    console.log("Mix URL cleaned:", url.toString());
  }
}

/* ---------- SPA NAVIGATION DETECTION ---------- */

function onNavigation() {
  cleanMixURL();
  scanForMixes();
}

/* Patch pushState (YouTube uses it internally) */
const originalPushState = history.pushState;
history.pushState = function () {
  originalPushState.apply(history, arguments);
  onNavigation();
};

/* Back/forward navigation */
window.addEventListener("popstate", onNavigation);

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

/* Initial execution */
onNavigation();