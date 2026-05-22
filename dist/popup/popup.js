// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2023-2026 Oleksandr Molodchyk

const elements = {
  status: document.getElementById("status"),
  totalBlocked: document.getElementById("totalBlocked"),
  urlsCleaned: document.getElementById("urlsCleaned"),
  currentPageBlocked: document.getElementById("currentPageBlocked"),
  recommendationsBlocked: document.getElementById("recommendationsBlocked"),
  searchBlocked: document.getElementById("searchBlocked"),
  watchSidebarBlocked: document.getElementById("watchSidebarBlocked"),
  details: document.getElementById("details"),
  theme: document.getElementById("theme"),
  showBadge: document.getElementById("showBadge"),
  showDetailedCounters: document.getElementById("showDetailedCounters"),
  resetCounters: document.getElementById("resetCounters")
};

let activeTabId = null;

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

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0] && tabs[0].id;
}

function render(state) {
  const stats = state.stats || {};
  const settings = state.settings || {};
  const blockedBySurface = stats.blockedBySurface || {};

  elements.totalBlocked.textContent = formatNumber(stats.totalBlocked);
  elements.urlsCleaned.textContent = formatNumber(stats.urlsCleaned);
  elements.currentPageBlocked.textContent = formatNumber(state.currentPageBlocked);
  elements.recommendationsBlocked.textContent = formatNumber(blockedBySurface.recommendations);
  elements.searchBlocked.textContent = formatNumber(blockedBySurface.search);
  elements.watchSidebarBlocked.textContent = formatNumber(blockedBySurface.watchSidebar);

  elements.showBadge.checked = Boolean(settings.showBadge);
  elements.showDetailedCounters.checked = Boolean(settings.showDetailedCounters);
  elements.theme.value = settings.theme || "system";
  applyTheme(settings.theme);
  elements.details.classList.toggle("hidden", !settings.showDetailedCounters);
}

async function refresh() {
  activeTabId = await getActiveTabId();
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

localizePopup();
refresh();
