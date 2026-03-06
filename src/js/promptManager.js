// promptManager.js - Handles loading and saving prompt templates
const STORAGE_KEY = 'customPrompts';

/**
 * Load prompts from sync storage; fall back to language-specific defaults if none saved.
 * @param {string} lang - Language code for default prompts fallback
 * @returns {Promise<Array<{id: string, name: string, text: string}>>}
 */
export async function loadPrompts(lang = 'en') {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const prompts = result[STORAGE_KEY];
      if (Array.isArray(prompts)) {
        resolve(prompts);
      } else {
        loadDefaultPrompts(lang).then(resolve).catch(reject);
      }
    });
  });
}

/**
 * Load default prompts for the given language.
 * @param {string} lang
 * @returns {Promise<Array>}
 */
export async function loadDefaultPrompts(lang = 'en') {
  const url = chrome.runtime.getURL(`src/assets/defaultPrompts/${lang}.json`);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch default prompts');
  return response.json();
}

/**
 * Save prompts array to sync storage.
 * @param {Array<{id: string, name: string, text: string}>} prompts
 * @returns {Promise<void>}
 */
export function savePrompts(prompts) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: prompts }, resolve);
  });
}
