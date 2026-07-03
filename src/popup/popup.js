// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

const rtlLanguageCodes = new Set(["ar", "fa", "he", "iw", "ur"]);

const elements = {
  status: document.getElementById("status"),
  totalBlocked: document.getElementById("totalBlocked"),
  urlsCleaned: document.getElementById("urlsCleaned"),
  currentPageBlocked: document.getElementById("currentPageBlocked"),
  currentPageDetails: document.getElementById("currentPageDetails"),
  currentPageItems: document.getElementById("currentPageItems"),
  pageBlockedPlacements: document.getElementById("pageBlockedPlacements"),
  pageSurfaceBreakdown: document.getElementById("pageSurfaceBreakdown"),
  copyPageLog: document.getElementById("copyPageLog"),
  recommendationsBlocked: document.getElementById("recommendationsBlocked"),
  searchBlocked: document.getElementById("searchBlocked"),
  watchSidebarBlocked: document.getElementById("watchSidebarBlocked"),
  endScreenBlocked: document.getElementById("endScreenBlocked"),
  details: document.getElementById("details"),
  theme: document.getElementById("theme"),
  showBadge: document.getElementById("showBadge"),
  showDetailedCounters: document.getElementById("showDetailedCounters"),
  resetCounters: document.getElementById("resetCounters")
};

let activeTabId = null;
let activeTab = null;
let latestState = null;
let copyButtonResetTimer = null;
let copyPageLogLabel = "Copy page log";

const surfaceOrder = ["watchSidebar", "endScreen", "recommendations", "search"];

function applyDocumentLanguageDirection() {
  const uiLanguage = chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : "en";
  const normalizedLanguage = uiLanguage.replace(/_/g, "-");
  const baseLanguage = normalizedLanguage.split("-")[0].toLowerCase();

  document.documentElement.lang = normalizedLanguage || "en";
  document.documentElement.dir = rtlLanguageCodes.has(baseLanguage) ? "rtl" : "ltr";
}

function localizePopup() {
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const message = chrome.i18n.getMessage(element.dataset.i18n);

    if (message) {
      element.textContent = message;
    }
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme || "system";
}

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function getSurfaceLabel(surface) {
  const messageKeyBySurface = {
    recommendations: "popupRecommendations",
    search: "popupSearchResults",
    watchSidebar: "popupWatchSidebar",
    endScreen: "popupEndScreen"
  };
  const messageKey = messageKeyBySurface[surface];

  return messageKey ? chrome.i18n.getMessage(messageKey) || surface : surface;
}

function normalizeLabel(label) {
  return String(label || "").trim();
}

function isGenericMixLabel(label) {
  const normalizedLabel = normalizeLabel(label).toLowerCase();

  return !normalizedLabel || normalizedLabel === "mix" || normalizedLabel === "watch mix";
}

function chooseGroupTitle(currentTitle, item) {
  const nextTitle = normalizeLabel(item.label);

  if (!currentTitle) {
    return nextTitle || item.listId || item.url || "Mix";
  }

  if (isGenericMixLabel(currentTitle) && !isGenericMixLabel(nextTitle)) {
    return nextTitle;
  }

  return currentTitle;
}

function groupCurrentPageItems(items) {
  const groups = new Map();

  items.forEach(item => {
    const key = item.listId || item.url || `${item.surface || "unknown"}:${item.label || "Mix"}`;
    const existing = groups.get(key) || {
      key,
      title: "",
      listId: item.listId || "",
      videoIds: new Set(),
      placements: 0,
      items: []
    };

    existing.title = chooseGroupTitle(existing.title, item);
    existing.listId = existing.listId || item.listId || "";
    if (item.videoId) existing.videoIds.add(item.videoId);
    existing.placements += 1;
    existing.items.push(item);
    groups.set(key, existing);
  });

  return Array.from(groups.values());
}

function getPositionText(position) {
  if (!position || !position.slot) return "";

  return `slot ${position.slot}/${position.totalSlots || "?"}`;
}

function getGroupSurfaceText(group) {
  const placements = [];

  group.items.forEach(item => {
    const surfaceLabel = getSurfaceLabel(item.surface);
    const positionText = getPositionText(item.position);
    const placement = positionText ? `${surfaceLabel} ${positionText}` : surfaceLabel;

    if (!placements.includes(placement)) {
      placements.push(placement);
    }
  });

  return placements.join(", ");
}

function getGroupMeta(group) {
  const parts = [];
  const surfaceText = getGroupSurfaceText(group);
  const videoIds = Array.from(group.videoIds).slice(0, 2);

  if (group.placements > 1) {
    const placementsLabel = chrome.i18n.getMessage("popupBlockedPlacements") || "Mix cards hidden";
    parts.push(`${placementsLabel}: ${formatNumber(group.placements)}`);
  }

  if (group.listId) parts.push(group.listId);
  if (videoIds.length) parts.push(videoIds.join(", "));
  if (surfaceText) parts.push(surfaceText);

  return parts.join(" · ");
}

function renderCurrentPageItems(items) {
  elements.currentPageItems.replaceChildren();

  groupCurrentPageItems(items).slice(0, 4).forEach(group => {
    const listItem = document.createElement("li");
    const header = document.createElement("div");
    const title = document.createElement("span");
    const meta = document.createElement("span");

    header.className = "page-item-heading";
    title.className = "page-item-title";
    title.textContent = group.title || group.listId || "Mix";
    header.append(title);

    listItem.append(header);

    const metaText = getGroupMeta(group);
    if (metaText) {
      meta.className = "page-item-meta";
      meta.textContent = metaText;
      listItem.append(meta);
    }

    elements.currentPageItems.append(listItem);
  });
}

function renderSurfaceBreakdown(bySurface) {
  elements.pageSurfaceBreakdown.replaceChildren();

  surfaceOrder
    .map(surface => [surface, bySurface[surface] || 0])
    .filter(([, count]) => count > 0)
    .forEach(([surface, count]) => {
      const chip = document.createElement("span");
      const label = document.createElement("span");
      const value = document.createElement("strong");

      chip.className = "surface-chip";
      label.textContent = getSurfaceLabel(surface);
      value.textContent = formatNumber(count);
      chip.append(label, value);
      elements.pageSurfaceBreakdown.append(chip);
    });

  elements.pageSurfaceBreakdown.classList.toggle(
    "hidden",
    !elements.pageSurfaceBreakdown.childElementCount
  );
}

function createPageLogSummary(currentPageBlockedPlacements, bySurface, byListId) {
  const duplicatePlacements = Object.fromEntries(
    Object.entries(byListId).filter(([, value]) => value.count > 1)
  );

  return {
    blockedPlacements: currentPageBlockedPlacements || 0,
    uniqueMixLists: Object.keys(byListId).length,
    blockedPlacementsBySurface: bySurface,
    blockedPlacementsByListId: byListId,
    duplicatePlacements
  };
}

function createPageLog(state) {
  const safeState = state || {};
  const items = Array.isArray(safeState.currentPageBlockedItems)
    ? safeState.currentPageBlockedItems
    : [];
  const bySurface = safeState.currentPageBlockedBySurface || {};
  const byListId = safeState.currentPageBlockedByListId || {};

  return {
    createdAt: new Date().toISOString(),
    extensionVersion: chrome.runtime.getManifest().version,
    activeTab: activeTab
      ? {
          id: activeTab.id,
          title: activeTab.title || "",
          url: activeTab.url || ""
      }
      : null,
    summary: createPageLogSummary(safeState.currentPageBlockedPlacements, bySurface, byListId),
    currentPageBlocked: safeState.currentPageBlocked || 0,
    currentPageUniqueMixLists: safeState.currentPageBlocked || 0,
    currentPageBlockedPlacements: safeState.currentPageBlockedPlacements || 0,
    currentPageBlockedBySurface: bySurface,
    currentPageBlockedByListId: byListId,
    currentPageBlockedItems: items,
    lifetimeStats: safeState.stats || {}
  };
}

async function copyPageLog() {
  const logText = JSON.stringify(createPageLog(latestState), null, 2);

  await navigator.clipboard.writeText(logText);
  elements.copyPageLog.textContent = chrome.i18n.getMessage("popupCopied") || "Copied";

  window.clearTimeout(copyButtonResetTimer);
  copyButtonResetTimer = window.setTimeout(() => {
    elements.copyPageLog.textContent = copyPageLogLabel;
  }, 1400);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0] || null;
}

function render(state) {
  latestState = state;

  const stats = state.stats || {};
  const settings = state.settings || {};
  const blockedBySurface = stats.blockedBySurface || {};
  const currentPageBlockedBySurface = state.currentPageBlockedBySurface || {};
  const currentPageBlockedPlacements = state.currentPageBlockedPlacements || 0;
  const currentPageItems = Array.isArray(state.currentPageBlockedItems)
    ? state.currentPageBlockedItems
    : [];

  elements.totalBlocked.textContent = formatNumber(stats.totalBlocked);
  elements.urlsCleaned.textContent = formatNumber(stats.urlsCleaned);
  elements.currentPageBlocked.textContent = formatNumber(state.currentPageBlocked);
  elements.pageBlockedPlacements.textContent = formatNumber(currentPageBlockedPlacements);
  elements.recommendationsBlocked.textContent = formatNumber(blockedBySurface.recommendations);
  elements.searchBlocked.textContent = formatNumber(blockedBySurface.search);
  elements.watchSidebarBlocked.textContent = formatNumber(blockedBySurface.watchSidebar);
  elements.endScreenBlocked.textContent = formatNumber(blockedBySurface.endScreen);

  elements.showBadge.checked = Boolean(settings.showBadge);
  elements.showDetailedCounters.checked = Boolean(settings.showDetailedCounters);
  elements.theme.value = settings.theme || "system";
  applyTheme(settings.theme);
  elements.details.classList.toggle("hidden", !settings.showDetailedCounters);
  elements.currentPageDetails.classList.toggle(
    "hidden",
    !currentPageItems.length
  );
  renderSurfaceBreakdown(currentPageBlockedBySurface);
  renderCurrentPageItems(currentPageItems);
}

async function refresh() {
  activeTab = await getActiveTab();
  activeTabId = activeTab && activeTab.id;
  const state = await sendMessage({
    type: "get-stats",
    tabId: activeTabId
  });

  if (!state || !state.ok) {
    elements.status.textContent = chrome.i18n.getMessage("popupStatsUnavailable") || "Stats unavailable";
    return;
  }

  render(state);
}

async function updateSettings(settings) {
  const state = await sendMessage({
    type: "update-settings",
    tabId: activeTabId,
    settings
  });

  if (state && state.ok) {
    render(state);
  }
}

elements.showBadge.addEventListener("change", () => {
  updateSettings({ showBadge: elements.showBadge.checked });
});

elements.theme.addEventListener("change", () => {
  applyTheme(elements.theme.value);
  updateSettings({ theme: elements.theme.value });
});

elements.showDetailedCounters.addEventListener("change", () => {
  updateSettings({ showDetailedCounters: elements.showDetailedCounters.checked });
});

elements.copyPageLog.addEventListener("click", () => {
  copyPageLog().catch(() => {
    elements.copyPageLog.textContent = chrome.i18n.getMessage("popupCopyFailed") || "Copy failed";
  });
});

elements.resetCounters.addEventListener("click", async () => {
  const confirmMessage = chrome.i18n.getMessage("popupResetConfirm") ||
    "Reset all YouTube Mix Blocker counters?";

  if (!window.confirm(confirmMessage)) {
    return;
  }

  const state = await sendMessage({
    type: "reset-stats",
    tabId: activeTabId
  });

  if (state && state.ok) {
    render(state);
  }
});

chrome.runtime.onMessage.addListener(message => {
  if (message.type !== "stats-changed") return;

  render(message);
});

applyDocumentLanguageDirection();
localizePopup();
copyPageLogLabel = elements.copyPageLog.textContent;
refresh();
