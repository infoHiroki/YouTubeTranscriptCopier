import { loadPrompts } from '../js/promptManager.js';
import { initTheme } from '../js/themeManager.js';
import { initI18n, t, applyI18n, getLang } from '../js/i18n.js';

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize theme and i18n
  await initTheme();
  await initI18n();
  applyI18n();

  const templateSelect = document.getElementById("templateSelect");
  const promptTemplate = document.getElementById("promptTemplate");
  const button = document.getElementById("copyTranscript");
  const manageButton = document.getElementById("manageTemplates");
  const alertElement = document.getElementById("customAlert");
  const alertMessageElement = document.getElementById("alertMessage");
  const loadingOverlay = document.querySelector(".loading-overlay");

  // Navigate to options page
  manageButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Update placeholder based on selection
  function updateUIState() {
    if (templateSelect.value === "__free__") {
      promptTemplate.placeholder = t('popup.textareaFreeModePlaceholder');
      promptTemplate.classList.add("free-input-mode");
    } else if (templateSelect.value === "") {
      promptTemplate.placeholder = t('popup.textareaNoSelection');
      promptTemplate.classList.remove("free-input-mode");
    } else {
      promptTemplate.placeholder = t('popup.textareaPlaceholder');
      promptTemplate.classList.remove("free-input-mode");
    }
  }

  // Load prompts and populate select
  try {
    const prompts = await loadPrompts(getLang());

    templateSelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t('popup.selectPlaceholder');
    templateSelect.appendChild(placeholder);

    // Free edit option
    const freeOption = document.createElement("option");
    freeOption.value = "__free__";
    freeOption.textContent = t('popup.freeEdit');
    templateSelect.appendChild(freeOption);

    prompts.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.text;
      option.textContent = p.name;
      templateSelect.appendChild(option);
    });

    // Restore previous selection
    chrome.storage.local.get(["selectedPromptName", "freeInputPrompt"], (result) => {
      if (result.selectedPromptName === t('popup.freeEdit') ||
          result.selectedPromptName === "Free Edit" ||
          result.selectedPromptName === "自由編集" ||
          result.selectedPromptName === "フリー入力") {
        templateSelect.value = "__free__";
        promptTemplate.value = result.freeInputPrompt || "";
      } else if (result.selectedPromptName) {
        const options = templateSelect.options;
        for (let i = 0; i < options.length; i++) {
          if (options[i].textContent === result.selectedPromptName) {
            templateSelect.selectedIndex = i;
            promptTemplate.value = options[i].value;
            break;
          }
        }
      }
      updateUIState();
    });
  } catch (err) {
    console.error("Failed to load prompts:", err);
  }

  // Template selection handler
  templateSelect.addEventListener("change", () => {
    if (templateSelect.value === "") {
      promptTemplate.value = "";
      promptTemplate.focus();
      chrome.storage.local.set({ selectedPromptName: "" });
    } else if (templateSelect.value === "__free__") {
      chrome.storage.local.get(["freeInputPrompt"], (result) => {
        promptTemplate.value = result.freeInputPrompt || "";
        chrome.storage.local.set({ selectedPromptName: t('popup.freeEdit') });
      });
    } else {
      promptTemplate.value = templateSelect.value;
      const selectedOption = templateSelect.options[templateSelect.selectedIndex];
      chrome.storage.local.set({
        promptTemplate: templateSelect.value,
        selectedPromptName: selectedOption.textContent
      });
    }
    updateUIState();
  });

  // Load saved prompt text
  chrome.storage.local.get(["promptTemplate"], (result) => {
    if (result.promptTemplate && templateSelect.value !== "__free__") {
      promptTemplate.value = result.promptTemplate;
    }
  });

  // Save prompt changes
  promptTemplate.addEventListener("input", () => {
    if (templateSelect.value === "__free__") {
      chrome.storage.local.set({ freeInputPrompt: promptTemplate.value });
    } else {
      chrome.storage.local.set({ promptTemplate: promptTemplate.value });
    }
  });

  // Show alert
  function showAlert(message, isSuccess = true) {
    alertMessageElement.textContent = message;
    alertElement.classList.add("show");

    if (isSuccess) {
      setTimeout(() => {
        window.close();
      }, 1300);
    } else {
      setTimeout(() => {
        alertElement.classList.remove("show");
      }, 1300);
    }
  }

  // Copy transcript button
  button.addEventListener("click", async () => {
    loadingOverlay.classList.add("show");
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) {
        showAlert(t('alert.errorNoTab'), false);
        return;
      }

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          try {
            // Check if transcript panel is already open
            const existingPanel =
              document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="PAmodern_transcript_view"]') ||
              document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
            const panelAlreadyOpen = existingPanel &&
              existingPanel.getAttribute('visibility') === 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED';

            if (!panelAlreadyOpen) {
              // Try multiple selectors to find the transcript button
              const transcriptButton =
                document.querySelector('ytd-video-description-transcript-section-renderer button') ||
                document.querySelector('button[aria-label="文字起こしを表示"]') ||
                document.querySelector('button[aria-label="字幕を表示"]') ||
                document.querySelector('button[aria-label="Show transcript"]') ||
                document.querySelector('button[aria-label*="transcript" i]') ||
                document.querySelector('ytd-menu-service-item-renderer[role="menuitem"]');

              if (!transcriptButton) {
                throw new Error("TRANSCRIPT_BUTTON_NOT_FOUND");
              }
              transcriptButton.click();
            }

            // Wait for transcript panel to open (supports multiple formats)
            await new Promise((resolve, reject) => {
              const intervalId = setInterval(() => {
                if (
                  document.querySelector("ytd-transcript-segment-renderer") ||
                  document.querySelector("transcript-segment-view-model") ||
                  document.querySelector('#segments-container') ||
                  document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="PAmodern_transcript_view"] .segment-text') ||
                  document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] .segment-text')
                ) {
                  clearInterval(intervalId);
                  resolve();
                }
              }, 100);

              setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error("TRANSCRIPT_TIMEOUT"));
              }, 10000);
            });

            let text = "";

            // Method 1: ytd-transcript-segment-renderer (legacy format)
            const oldSegments = document.querySelectorAll("ytd-transcript-segment-renderer");
            if (oldSegments.length > 0) {
              oldSegments.forEach((segment) => {
                const timestamp = segment.querySelector(".segment-timestamp")?.textContent?.trim() || "";
                const content = segment.querySelector(".segment-text")?.textContent?.trim() || "";
                if (timestamp && content) {
                  text += `${timestamp} ${content}\n`;
                }
              });
            }

            // Method 2: transcript-segment-view-model (2026 new format)
            if (!text.trim()) {
              const newSegments = document.querySelectorAll("transcript-segment-view-model");
              if (newSegments.length > 0) {
                newSegments.forEach((segment) => {
                  // Try direct class selectors first
                  const timestampEl = segment.querySelector('.ytwTranscriptSegmentViewModelTimestamp');
                  const contentEl = segment.querySelector('.yt-core-attributed-string[role="text"]');
                  if (timestampEl && contentEl) {
                    const timestamp = timestampEl.textContent?.trim() || "";
                    const content = contentEl.textContent?.trim() || "";
                    if (timestamp && content) {
                      text += `${timestamp} ${content}\n`;
                    }
                    return;
                  }
                  // Fallback: parse from textContent
                  const fullText = segment.textContent?.trim() || "";
                  const timestampMatch = fullText.match(/^(\d+:\d{2})/);
                  if (timestampMatch) {
                    const timestamp = timestampMatch[1];
                    let content = fullText.substring(timestamp.length);
                    content = content.replace(/^\d[\d 分秒]*(?:秒|分|seconds?|minutes?)\s*/, '');
                    if (content.trim()) {
                      text += `${timestamp} ${content.trim()}\n`;
                    }
                  }
                });
              }
            }

            // Method 3: engagement panel .segment-text
            if (!text.trim()) {
              const panel =
                document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="PAmodern_transcript_view"]') ||
                document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
              if (panel) {
                const segments = panel.querySelectorAll('.segment-text');
                segments.forEach((seg) => {
                  const content = seg.textContent?.trim();
                  if (content) {
                    text += `${content}\n`;
                  }
                });
              }
            }

            // Method 4: #segments-container yt-formatted-string
            if (!text.trim()) {
              const container = document.querySelector('#segments-container');
              if (container) {
                const segments = container.querySelectorAll('yt-formatted-string');
                segments.forEach((segment) => {
                  const content = segment.textContent?.trim();
                  if (content) {
                    text += `${content}\n`;
                  }
                });
              }
            }

            if (!text.trim()) {
              throw new Error("TRANSCRIPT_NOT_FOUND");
            }

            return text;
          } catch (error) {
            throw error;
          }
        },
      });

      if (result && result[0] && result[0].result) {
        const finalText = promptTemplate.value
          ? promptTemplate.value + "\n\n" + result[0].result
          : result[0].result;
        await navigator.clipboard.writeText(finalText);
        showAlert(t('alert.copied'));
      } else {
        showAlert(t('alert.errorNoTranscript'), false);
      }
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('TRANSCRIPT_BUTTON_NOT_FOUND')) {
        showAlert(t('alert.errorPrefix') + t('transcript.buttonNotFound'), false);
      } else if (msg.includes('TRANSCRIPT_TIMEOUT')) {
        showAlert(t('alert.errorPrefix') + t('transcript.timeout'), false);
      } else if (msg.includes('TRANSCRIPT_NOT_FOUND')) {
        showAlert(t('alert.errorPrefix') + t('transcript.notFound'), false);
      } else {
        showAlert(t('alert.errorPrefix') + msg, false);
      }
    } finally {
      loadingOverlay.classList.remove("show");
    }
  });

  // Auto focus textarea
  promptTemplate.focus();
});
