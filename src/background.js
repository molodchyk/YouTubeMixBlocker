// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

const DEFAULT_STATS = {
  totalBlocked: 0,
  blockedBySurface: {
    recommendations: 0,
    search: 0,
    watchSidebar: 0,
    endScreen: 0
  },
  urlsCleaned: 0
};

const DEFAULT_PAGE_DETAILS = {
  count: 0,
  placements: 0,
  bySurface: {
    recommendations: 0,
    search: 0,
    watchSidebar: 0,
    endScreen: 0
  },
  byListId: {},
  items: []
};

const DEFAULT_SETTINGS = {
  showBadge: false,
  showDetailedCounters: true,
  theme: "system"
};

const UNINSTALL_FEEDBACK_URL = "https://molodchyk.com/youtube-mix-blocker/uninstall/";
const TAB_BLOCKED_COUNTS_KEY = "tabBlockedCounts";
const TAB_BLOCKED_DETAILS_KEY = "tabBlockedDetails";
const MAX_PAGE_BLOCKED_ITEMS = 12;

const tabBlockedCounts = new Map();
const tabBlockedDetails = new Map();
let statsWriteQueue = Promise.resolve();

function getUninstallFeedbackUrl() {
  const url = new URL(UNINSTALL_FEEDBACK_URL);
  url.searchParams.set("source", "chrome");
  url.searchParams.set("version", chrome.runtime.getManifest().version);
  url.searchParams.set("lang", chrome.i18n.getUILanguage());
  return url.toString();
}

async function configureUninstallFeedback() {
  await chrome.runtime.setUninstallURL(getUninstallFeedbackUrl());
}

configureUninstallFeedback().catch(() => {});

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

function clonePageDetails(details) {
  return {
    ...DEFAULT_PAGE_DETAILS,
    ...details,
    bySurface: {
      ...DEFAULT_PAGE_DETAILS.bySurface,
      ...(details && details.bySurface)
    },
    byListId: {
      ...DEFAULT_PAGE_DETAILS.byListId,
      ...(details && details.byListId)
    },
    items: Array.isArray(details && details.items) ? details.items : []
  };
}

function sanitizeBlockedItem(surface, details = {}) {
  return {
    surface,
    label: String(details.label || "").slice(0, 160),
    url: String(details.url || "").slice(0, 500),
    observedAt: String(details.observedAt || "").slice(0, 40),
    pageUrl: String(details.pageUrl || "").slice(0, 500),
    pageTitle: String(details.pageTitle || "").slice(0, 200),
    listId: String(details.listId || "").slice(0, 120),
    videoId: String(details.videoId || "").slice(0, 80),
    position: details.position && typeof details.position === "object"
      ? {
          slot: Number.parseInt(details.position.slot, 10) || 0,
          totalSlots: Number.parseInt(details.position.totalSlots, 10) || 0,
          visibleSlot: Number.parseInt(details.position.visibleSlot, 10) || 0,
          totalVisibleSlots: Number.parseInt(details.position.totalVisibleSlots, 10) || 0,
          mixSlot: Number.parseInt(details.position.mixSlot, 10) || 0,
          totalMixSlots: Number.parseInt(details.position.totalMixSlots, 10) || 0,
          visibleMixSlot: Number.parseInt(details.position.visibleMixSlot, 10) || 0,
          totalVisibleMixSlots: Number.parseInt(details.position.totalVisibleMixSlots, 10) || 0,
          slotVisible: Boolean(details.position.slotVisible),
          containerVisible: Boolean(details.position.containerVisible),
          gridVisible: Boolean(details.position.gridVisible),
          moviePlayerClasses: String(details.position.moviePlayerClasses || "").slice(0, 300)
        }
      : null,
    signals: Array.isArray(details.signals)
      ? details.signals.map(signal => String(signal).slice(0, 80)).slice(0, 8)
      : []
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

async function getSessionTabCounts() {
  if (!chrome.storage.session) return {};

  const stored = await chrome.storage.session.get(TAB_BLOCKED_COUNTS_KEY);
  return stored[TAB_BLOCKED_COUNTS_KEY] || {};
}

async function getSessionTabDetails() {
  if (!chrome.storage.session) return {};

  const stored = await chrome.storage.session.get(TAB_BLOCKED_DETAILS_KEY);
  return stored[TAB_BLOCKED_DETAILS_KEY] || {};
}

async function setSessionTabCount(tabId, count) {
  if (!chrome.storage.session || !tabId) return;

  const counts = await getSessionTabCounts();
  const key = String(tabId);

  if (count > 0) {
    counts[key] = count;
  } else {
    delete counts[key];
  }

  await chrome.storage.session.set({
    [TAB_BLOCKED_COUNTS_KEY]: counts
  });
}

async function setSessionTabDetails(tabId, details) {
  if (!chrome.storage.session || !tabId) return;

  const allDetails = await getSessionTabDetails();
  const key = String(tabId);
  const normalizedDetails = clonePageDetails(details);

  if (normalizedDetails.count > 0) {
    allDetails[key] = normalizedDetails;
  } else {
    delete allDetails[key];
  }

  await chrome.storage.session.set({
    [TAB_BLOCKED_DETAILS_KEY]: allDetails
  });
}

async function clearSessionTabCounts() {
  if (chrome.storage.session) {
    await chrome.storage.session.remove([
      TAB_BLOCKED_COUNTS_KEY,
      TAB_BLOCKED_DETAILS_KEY
    ]);
  }
}

async function getBadgeCount(tabId) {
  if (!tabId) return 0;

  try {
    const badgeText = await chrome.action.getBadgeText({ tabId });
    const count = Number.parseInt(badgeText, 10);
    return Number.isSafeInteger(count) && count > 0 ? count : 0;
  } catch (_error) {
    return 0;
  }
}

async function getTabBlockedCount(tabId) {
  if (!tabId) return 0;

  if (tabBlockedCounts.has(tabId)) {
    return tabBlockedCounts.get(tabId) || 0;
  }

  const counts = await getSessionTabCounts();
  const storedCount = Number.parseInt(counts[String(tabId)], 10);

  if (Number.isSafeInteger(storedCount) && storedCount > 0) {
    tabBlockedCounts.set(tabId, storedCount);
    return storedCount;
  }

  const badgeCount = await getBadgeCount(tabId);

  if (badgeCount > 0) {
    tabBlockedCounts.set(tabId, badgeCount);
    await setSessionTabCount(tabId, badgeCount);
  }

  return badgeCount;
}

async function getTabBlockedDetails(tabId) {
  if (!tabId) return clonePageDetails();

  if (tabBlockedDetails.has(tabId)) {
    return clonePageDetails(tabBlockedDetails.get(tabId));
  }

  const allDetails = await getSessionTabDetails();
  const details = clonePageDetails(allDetails[String(tabId)]);

  if (details.count > 0) {
    tabBlockedDetails.set(tabId, details);
  }

  return details;
}

async function setTabBlockedCount(tabId, count) {
  if (!tabId) return;

  tabBlockedCounts.set(tabId, count);
  await setSessionTabCount(tabId, count);
}

async function setTabBlockedDetails(tabId, details) {
  if (!tabId) return;

  const normalizedDetails = clonePageDetails(details);
  tabBlockedDetails.set(tabId, normalizedDetails);
  await setSessionTabDetails(tabId, normalizedDetails);
}

async function clearTabBlockedCount(tabId) {
  if (!tabId) return;

  tabBlockedCounts.set(tabId, 0);
  tabBlockedDetails.set(tabId, clonePageDetails());
  await setSessionTabCount(tabId, 0);
  await setSessionTabDetails(tabId, clonePageDetails());
}

async function forgetTabBlockedCount(tabId) {
  if (!tabId) return;

  tabBlockedCounts.delete(tabId);
  tabBlockedDetails.delete(tabId);
  await setSessionTabCount(tabId, 0);
  await setSessionTabDetails(tabId, clonePageDetails());
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
  const count = await getTabBlockedCount(tabId);

  if (!settings.showBadge || count === 0) {
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  await chrome.action.setBadgeBackgroundColor({ tabId, color: "#cc0000" });
  await chrome.action.setBadgeText({ tabId, text: String(count) });
}

async function getPopupState(tabId) {
  const { stats, settings } = await getStoredState();
  const currentPageBlocked = await getTabBlockedCount(tabId);
  const currentPageDetails = await getTabBlockedDetails(tabId);

  return {
    stats,
    settings,
    currentPageBlocked: currentPageDetails.count || currentPageBlocked,
    currentPageBlockedPlacements: currentPageDetails.placements || 0,
    currentPageBlockedBySurface: currentPageDetails.bySurface,
    currentPageBlockedByListId: currentPageDetails.byListId,
    currentPageBlockedItems: currentPageDetails.items
  };
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

async function recordBlockedMix(tabId, surface, details) {
  const safeSurface = Object.prototype.hasOwnProperty.call(DEFAULT_PAGE_DETAILS.bySurface, surface)
    ? surface
    : "recommendations";
  const sanitizedItem = sanitizeBlockedItem(safeSurface, details);
  const listKey = sanitizedItem.listId || sanitizedItem.url || "unknown";
  const pageDetails = await getTabBlockedDetails(tabId);
  const previousListDetails = pageDetails.byListId[listKey] || {
    count: 0,
    surfaces: {},
    labels: []
  };
  const nextPageDetails = clonePageDetails({
    ...pageDetails,
    bySurface: {
      ...pageDetails.bySurface,
      [safeSurface]: (pageDetails.bySurface[safeSurface] || 0) + 1
    },
    byListId: {
      ...pageDetails.byListId,
      [listKey]: {
        count: previousListDetails.count + 1,
        surfaces: {
          ...previousListDetails.surfaces,
          [safeSurface]: (previousListDetails.surfaces[safeSurface] || 0) + 1
        },
        labels: sanitizedItem.label && !previousListDetails.labels.includes(sanitizedItem.label)
          ? [...previousListDetails.labels, sanitizedItem.label].slice(0, 5)
          : previousListDetails.labels
      }
    },
    items: [
      sanitizedItem,
      ...pageDetails.items
    ].slice(0, MAX_PAGE_BLOCKED_ITEMS)
  });
  nextPageDetails.placements = (pageDetails.placements || 0) + 1;
  nextPageDetails.count = Object.keys(nextPageDetails.byListId).length;

  await setTabBlockedCount(tabId, nextPageDetails.count);
  await setTabBlockedDetails(tabId, nextPageDetails);

  await updateStats(stats => {
    const nextStats = cloneStats(stats);
    const statsSurface = Object.prototype.hasOwnProperty.call(nextStats.blockedBySurface, safeSurface)
      ? safeSurface
      : "recommendations";

    nextStats.totalBlocked += 1;
    nextStats.blockedBySurface[statsSurface] += 1;

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

async function resetStats(tabId) {
  const tabIds = Array.from(tabBlockedCounts.keys());
  if (tabId && !tabIds.includes(tabId)) {
    tabIds.push(tabId);
  }

  tabBlockedCounts.clear();
  tabBlockedDetails.clear();
  await clearSessionTabCounts();
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
      await recordBlockedMix(tabId, message.surface, message.details);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "mix-url-cleaned") {
      await recordCleanedURL();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "page-changed" && tabId) {
      await clearTabBlockedCount(tabId);
      await chrome.action.setBadgeText({ tabId, text: "" });
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
      await resetStats(message.tabId);
      sendResponse({
        ok: true,
        ...(await getPopupState(message.tabId))
      });
    }
  })();

  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  forgetTabBlockedCount(tabId).catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    clearTabBlockedCount(tabId).catch(() => {});
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});
