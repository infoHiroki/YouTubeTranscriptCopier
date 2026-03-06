// i18n.js - User-selectable internationalization module
const LANG_KEY = 'userLanguage';
let currentStrings = {};
let currentLang = 'en';

function detectDefaultLang() {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

export async function initI18n() {
  return new Promise((resolve) => {
    chrome.storage.local.get([LANG_KEY], async (result) => {
      currentLang = result[LANG_KEY] || detectDefaultLang();
      await loadStrings(currentLang);
      resolve(currentLang);
    });
  });
}

async function loadStrings(lang) {
  try {
    const url = chrome.runtime.getURL(`src/strings/${lang}.json`);
    const response = await fetch(url);
    currentStrings = await response.json();
  } catch (e) {
    console.error(`Failed to load strings for ${lang}, falling back to en`);
    if (lang !== 'en') {
      const url = chrome.runtime.getURL('src/strings/en.json');
      const response = await fetch(url);
      currentStrings = await response.json();
      currentLang = 'en';
    }
  }
}

export function t(key) {
  return currentStrings[key] || key;
}

export function getLang() {
  return currentLang;
}

export async function setLang(lang) {
  currentLang = lang;
  chrome.storage.local.set({ [LANG_KEY]: lang });
  await loadStrings(lang);
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });
}
