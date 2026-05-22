// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2023-2026 Oleksandr Molodchyk

const DEFAULT_STATS = {
  totalBlocked: 0,
  blockedBySurface: {
    recommendations: 0,
    search: 0,
    watchSidebar: 0
  },
  urlsCleaned: 0
};

const DEFAULT_SETTINGS = {
  showBadge: false,
  showDetailedCounters: true,
  theme: "system"
};

const tabBlockedCounts = new Map();
let statsWriteQueue = Promise.resolve();

function cloneStats(stats) {
  return {
    ...DEFAULT_STATS,
    ...stats,
    blockedBySurface: {
      ...DEFAULT_STATS.blockedBySurface,
      ...(stats && stats.blockedBySurface)
    }
  };
}

async function getStoredState() {
  const stored = await chrome.storage.local.get(["stats", "settings"]);

  return {
    stats: cloneStats(stored.stats),
    settings: {
      ...DEFAULT_SETTINGS,
      ...stored.settings
    }
  };
}

async function updateStats(updater) {
  statsWriteQueue = statsWriteQueue.then(async () => {
    const { stats } = await getStoredState();
    const nextStats = updater(stats);
    await chrome.storage.local.set({ stats: nextStats });
    return nextStats;
  });

  return statsWriteQueue;
}

async function updateBadge(tabId) {
  if (!tabId) return;

  const { settings } = await getStoredState();
  const count = tabBlockedCounts.get(tabId) || 0;

  if (!settings.showBadge || count === 0) {
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  await chrome.action.setBadgeBackgroundColor({ tabId, color: "#cc0000" });
  await chrome.action.setBadgeText({ tabId, text: String(count) });
}

async function getPopupState(tabId) {
  const { stats, settings } = await getStoredState();
  const currentPageBlocked = tabId ? tabBlockedCounts.get(tabId) || 0 : 0;
  return { stats, settings, currentPageBlocked };
}

async function broadcastStatsChanged(tabId) {
  try {
    const state = await getPopupState(tabId);
    await chrome.runtime.sendMessage({
      type: "stats-changed",
      ...state
    });
  } catch (_error) {
    // No popup is open to receive the update.
  }
}

async function recordBlockedMix(tabId, surface) {
  const nextCount = (tabBlockedCounts.get(tabId) || 0) + 1;
  tabBlockedCounts.set(tabId, nextCount);

  await updateStats(stats => {
    const nextStats = cloneStats(stats);
    const safeSurface = Object.prototype.hasOwnProperty.call(nextStats.blockedBySurface, surface)
      ? surface
      : "recommendations";

    nextStats.totalBlocked += 1;
    nextStats.blockedBySurface[safeSurface] += 1;

    return nextStats;
  });

  await updateBadge(tabId);
  await broadcastStatsChanged(tabId);
}

async function recordCleanedURL() {
  await updateStats(stats => {
    const nextStats = cloneStats(stats);
    nextStats.urlsCleaned += 1;
    return nextStats;
  });
  await broadcastStatsChanged();
}

async function resetStats() {
  const tabIds = Array.from(tabBlockedCounts.keys());
  tabBlockedCounts.clear();
  await updateStats(() => cloneStats());

  await Promise.all(tabIds.map(tabId => chrome.action.setBadgeText({ tabId, text: "" })));
}

chrome.runtime.onInstalled.addListener(async () => {
  const { stats, settings } = await getStoredState();
  await chrome.storage.local.set({ stats, settings });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab && sender.tab.id;

  (async () => {
    if (message.type === "mix-blocked" && tabId) {
      await recordBlockedMix(tabId, message.surface);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "mix-url-cleaned") {
      await recordCleanedURL();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "page-changed" && tabId) {
      tabBlockedCounts.set(tabId, 0);
      await updateBadge(tabId);
      await broadcastStatsChanged(tabId);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "get-stats") {
      sendResponse({
        ok: true,
        ...(await getPopupState(message.tabId))
      });
      return;
    }

    if (message.type === "update-settings") {
      const { settings } = await getStoredState();
      const nextSettings = {
        ...settings,
        ...message.settings
      };

      await chrome.storage.local.set({ settings: nextSettings });

      if (message.tabId) {
        await updateBadge(message.tabId);
      }

      sendResponse({
        ok: true,
        ...(await getPopupState(message.tabId))
      });
      return;
    }

    if (message.type === "reset-stats") {
      await resetStats();
      sendResponse({
        ok: true,
        ...(await getPopupState(message.tabId))
      });
    }
  })();

  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  tabBlockedCounts.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    tabBlockedCounts.set(tabId, 0);
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});
