// themeManager.js - Theme switching module
const THEME_KEY = 'userTheme';
const DEFAULT_THEME = 'clean';

export async function initTheme() {
  return new Promise((resolve) => {
    chrome.storage.local.get([THEME_KEY], (result) => {
      const theme = result[THEME_KEY] || DEFAULT_THEME;
      applyTheme(theme);
      resolve(theme);
    });
  });
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function setTheme(theme) {
  applyTheme(theme);
  chrome.storage.local.set({ [THEME_KEY]: theme });
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}
