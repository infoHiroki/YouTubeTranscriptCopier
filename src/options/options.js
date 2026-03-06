import { loadPrompts, loadDefaultPrompts, savePrompts } from '../js/promptManager.js';
import { initTheme, setTheme, getTheme } from '../js/themeManager.js';
import { initI18n, t, applyI18n, getLang, setLang } from '../js/i18n.js';

let saveTimeout = null;
let domElements = null;

function getDOMElements() {
  return {
    container: document.getElementById('templatesContainer'),
    addBtn: document.getElementById('addTemplate'),
    deleteAllBtn: document.getElementById('deleteAll'),
    resetBtn: document.getElementById('resetToDefault'),
    langSelect: document.getElementById('langSelect'),
    themeSelect: document.getElementById('themeSelect'),
    dialog: {
      overlay: document.getElementById('confirmDialog'),
      title: document.getElementById('dialogTitle'),
      message: document.getElementById('dialogMessage'),
      okBtn: document.getElementById('dialogOk'),
      cancelBtn: document.getElementById('dialogCancel'),
    },
  };
}

function showConfirmDialog(title, message) {
  const { dialog } = domElements;
  return new Promise((resolve) => {
    dialog.title.textContent = title;
    dialog.message.textContent = message;
    dialog.overlay.classList.add('show');

    const cleanup = () => {
      dialog.overlay.classList.remove('show');
      dialog.okBtn.removeEventListener('click', handleOk);
      dialog.cancelBtn.removeEventListener('click', handleCancel);
    };
    const handleOk = () => { cleanup(); resolve(true); };
    const handleCancel = () => { cleanup(); resolve(false); };

    dialog.okBtn.addEventListener('click', handleOk);
    dialog.cancelBtn.addEventListener('click', handleCancel);
  });
}

async function saveToStorage() {
  try {
    const cards = domElements.container.querySelectorAll('.prompt-card');
    const prompts = Array.from(cards)
      .map((card, idx) => {
        const name = card.querySelector('.prompt-name').value.trim();
        const text = card.querySelector('.prompt-text').value.trim();
        if (name && text) return { id: `${Date.now()}_${idx}`, name, text };
        return null;
      })
      .filter(Boolean);
    await savePrompts(prompts);
  } catch (error) {
    console.error('Failed to save prompts:', error);
  }
}

function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToStorage, 500);
}

function createPromptCard(prompt = { id: '', name: '', text: '' }) {
  const card = document.createElement('div');
  card.className = 'prompt-card';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = t('options.promptNamePlaceholder');
  nameInput.value = prompt.name;
  nameInput.className = 'prompt-name';
  nameInput.addEventListener('input', autoSave);

  const textarea = document.createElement('textarea');
  textarea.placeholder = t('options.promptTextPlaceholder');
  textarea.value = prompt.text;
  textarea.className = 'prompt-text';
  textarea.addEventListener('input', autoSave);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = t('options.deleteButton');
  deleteBtn.className = 'btn-delete';
  deleteBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      t('dialog.deleteTitle'),
      t('dialog.deleteMessage')
    );
    if (confirmed) {
      domElements.container.removeChild(card);
      await saveToStorage();
    }
  });

  card.appendChild(nameInput);
  card.appendChild(textarea);
  card.appendChild(deleteBtn);
  return card;
}

async function handleAddPrompt() {
  const card = createPromptCard();
  domElements.container.appendChild(card);
  await saveToStorage();
  card.querySelector('.prompt-name').focus();
}

async function handleDeleteAll() {
  const confirmed = await showConfirmDialog(
    t('dialog.deleteAllTitle'),
    t('dialog.deleteAllMessage')
  );
  if (confirmed) {
    domElements.container.innerHTML = '';
    await saveToStorage();
  }
}

async function handleReset() {
  const confirmed = await showConfirmDialog(
    t('dialog.resetTitle'),
    t('dialog.resetMessage')
  );
  if (!confirmed) return;

  try {
    const defaultPrompts = await loadDefaultPrompts(getLang());
    domElements.container.innerHTML = '';
    defaultPrompts.forEach((prompt) => {
      const card = createPromptCard(prompt);
      domElements.container.appendChild(card);
    });
    await saveToStorage();
  } catch (error) {
    console.error('Failed to reset prompts:', error);
    alert(t('dialog.resetFailed'));
  }
}

async function loadAndRenderPrompts() {
  try {
    const prompts = await loadPrompts(getLang());
    prompts.forEach((prompt) => {
      const card = createPromptCard(prompt);
      domElements.container.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load prompts:', error);
  }
}

async function init() {
  await initTheme();
  await initI18n();
  applyI18n();

  domElements = getDOMElements();

  // Set current values in settings selectors
  domElements.langSelect.value = getLang();
  domElements.themeSelect.value = getTheme();

  // Language change handler
  domElements.langSelect.addEventListener('change', async () => {
    await setLang(domElements.langSelect.value);
    applyI18n();
    // Update theme option labels
    const cleanOpt = domElements.themeSelect.querySelector('option[value="clean"]');
    const cyberOpt = domElements.themeSelect.querySelector('option[value="cyberpunk"]');
    if (cleanOpt) cleanOpt.textContent = t('options.themeClean');
    if (cyberOpt) cyberOpt.textContent = t('options.themeCyberpunk');
  });

  // Theme change handler
  domElements.themeSelect.addEventListener('change', () => {
    setTheme(domElements.themeSelect.value);
  });

  // Load and render prompts
  await loadAndRenderPrompts();

  // Set up event listeners
  domElements.addBtn.addEventListener('click', handleAddPrompt);
  domElements.deleteAllBtn.addEventListener('click', handleDeleteAll);
  domElements.resetBtn.addEventListener('click', handleReset);
}

document.addEventListener('DOMContentLoaded', init);
