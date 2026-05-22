// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2023-2026 Oleksandr Molodchyk

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
