/**
 * Prompt Manager - Options Page
 * Manages prompt templates with CRUD operations
 */

import { loadPrompts, savePrompts } from '../js/promptManager.js';

// ==================== State Management ====================
let saveTimeout = null;
let domElements = null;

// ==================== DOM Element Getters ====================
/**
 * Get all required DOM elements
 * @returns {Object} DOM elements object
 */
function getDOMElements() {
  return {
    container: document.getElementById('templatesContainer'),
    addBtn: document.getElementById('addTemplate'),
    deleteAllBtn: document.getElementById('deleteAll'),
    resetBtn: document.getElementById('resetToDefault'),
    dialog: {
      overlay: document.getElementById('confirmDialog'),
      title: document.getElementById('dialogTitle'),
      message: document.getElementById('dialogMessage'),
      okBtn: document.getElementById('dialogOk'),
      cancelBtn: document.getElementById('dialogCancel'),
    },
  };
}

// ==================== Dialog Functions ====================
/**
 * Show custom confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @returns {Promise<boolean>} User's choice
 */
function showConfirmDialog(title, message) {
  const { dialog } = domElements;

  return new Promise((resolve) => {
    dialog.title.textContent = title;
    dialog.message.textContent = message;
    dialog.overlay.classList.remove('hidden');
    dialog.overlay.classList.add('flex');

    const cleanup = () => {
      dialog.overlay.classList.add('hidden');
      dialog.overlay.classList.remove('flex');
      dialog.okBtn.removeEventListener('click', handleOk);
      dialog.cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleOk = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    dialog.okBtn.addEventListener('click', handleOk);
    dialog.cancelBtn.addEventListener('click', handleCancel);
  });
}

// ==================== Storage Functions ====================
/**
 * Collect prompts from DOM and save to storage
 */
async function saveToStorage() {
  try {
    const cards = domElements.container.querySelectorAll('.prompt-card');
    const prompts = Array.from(cards)
      .map((card, idx) => {
        const name = card.querySelector('.prompt-name').value.trim();
        const text = card.querySelector('.prompt-text').value.trim();

        if (name && text) {
          return {
            id: `${Date.now()}_${idx}`,
            name,
            text
          };
        }
        return null;
      })
      .filter(Boolean);

    await savePrompts(prompts);
  } catch (error) {
    console.error('Failed to save prompts:', error);
  }
}

/**
 * Debounced auto-save function
 */
function autoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToStorage, 500);
}

// ==================== Card Creation Functions ====================
/**
 * Create name input element
 * @param {string} name - Prompt name
 * @returns {HTMLInputElement}
 */
function createNameInput(name = '') {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'PROMPT NAME';
  input.value = name;
  input.className = 'prompt-name input-cyber mb-3';
  input.addEventListener('input', autoSave);
  return input;
}

/**
 * Create textarea element
 * @param {string} text - Prompt text
 * @returns {HTMLTextAreaElement}
 */
function createTextArea(text = '') {
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'PROMPT CONTENT...';
  textarea.value = text;
  textarea.className = 'prompt-text input-cyber mb-3 min-h-[200px] resize-y';
  textarea.addEventListener('input', autoSave);
  return textarea;
}

/**
 * Create delete button
 * @param {HTMLElement} card - Parent card element
 * @returns {HTMLButtonElement}
 */
function createDeleteButton(card) {
  const button = document.createElement('button');
  button.textContent = 'DELETE';
  button.className = 'btn-cyber-red px-4 py-2 self-end mt-2';

  button.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog(
      'DELETE CONFIRM',
      'Delete this prompt?'
    );

    if (confirmed) {
      domElements.container.removeChild(card);
      await saveToStorage();
    }
  });

  return button;
}

/**
 * Create a prompt card element
 * @param {Object} prompt - Prompt data {id, name, text}
 * @returns {HTMLDivElement}
 */
function createPromptCard(prompt = { id: '', name: '', text: '' }) {
  const card = document.createElement('div');
  card.className = 'prompt-card card-cyber flex flex-col';

  const nameInput = createNameInput(prompt.name);
  const textarea = createTextArea(prompt.text);
  const deleteBtn = createDeleteButton(card);

  card.appendChild(nameInput);
  card.appendChild(textarea);
  card.appendChild(deleteBtn);

  return card;
}

// ==================== Event Handlers ====================
/**
 * Handle adding a new prompt
 */
async function handleAddPrompt() {
  const card = createPromptCard();
  domElements.container.appendChild(card);
  await saveToStorage();

  // Focus on the name input of the new card
  card.querySelector('.prompt-name').focus();
}

/**
 * Handle deleting all prompts
 */
async function handleDeleteAll() {
  const confirmed = await showConfirmDialog(
    'DELETE ALL',
    'Really delete all prompts?'
  );

  if (confirmed) {
    domElements.container.innerHTML = '';
    await saveToStorage();
  }
}

/**
 * Handle resetting to default prompts
 */
async function handleReset() {
  const confirmed = await showConfirmDialog(
    'RESET CONFIRM',
    'Reset to default prompts?\nAll current prompts will be deleted.'
  );

  if (!confirmed) return;

  try {
    // Load default prompts
    const response = await fetch(
      chrome.runtime.getURL('src/assets/defaultPrompts.json')
    );

    if (!response.ok) {
      throw new Error('Failed to fetch default prompts');
    }

    const defaultPrompts = await response.json();

    // Clear current display
    domElements.container.innerHTML = '';

    // Render default prompts
    defaultPrompts.forEach((prompt) => {
      const card = createPromptCard(prompt);
      domElements.container.appendChild(card);
    });

    // Save to storage
    await saveToStorage();
  } catch (error) {
    console.error('Failed to reset prompts:', error);
    alert('Failed to load default prompts. Please try again.');
  }
}

/**
 * Load and render existing prompts
 */
async function loadAndRenderPrompts() {
  try {
    const prompts = await loadPrompts();

    prompts.forEach((prompt) => {
      const card = createPromptCard(prompt);
      domElements.container.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load prompts:', error);
  }
}

// ==================== Initialization ====================
/**
 * Initialize the options page
 */
function init() {
  domElements = getDOMElements();

  // Load and render existing prompts
  loadAndRenderPrompts();

  // Set up event listeners
  domElements.addBtn.addEventListener('click', handleAddPrompt);
  domElements.deleteAllBtn.addEventListener('click', handleDeleteAll);
  domElements.resetBtn.addEventListener('click', handleReset);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
