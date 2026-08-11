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

  // Map an error code from the injected function to a localized message
  function describeTranscriptError(msg) {
    if (msg.includes('TRANSCRIPT_BUTTON_NOT_FOUND')) return t('transcript.buttonNotFound');
    if (msg.includes('TRANSCRIPT_TIMEOUT')) return t('transcript.timeout');
    if (msg.includes('TRANSCRIPT_NOT_FOUND')) return t('transcript.notFound');
    return msg;
  }

  function loadMetadataSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['metadataSettings'], (result) => {
        resolve({
          includeTitle: true,
          includeUrl: true,
          includeChannel: true,
          includeDescription: false,
          ...(result.metadataSettings || {}),
        });
      });
    });
  }

  // Copy transcript button
  button.addEventListener("click", async () => {
    loadingOverlay.classList.add("show");
    try {
      const [[tab], metaSettings] = await Promise.all([
        chrome.tabs.query({ active: true, currentWindow: true }),
        loadMetadataSettings(),
      ]);
      if (!tab) {
        showAlert(t('alert.errorNoTab'), false);
        return;
      }

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          // Collect metadata from page
          const title = document.title.replace(/ - YouTube$/, '').trim();
          const url = window.location.href;

          const channel =
            document.querySelector('#owner ytd-channel-name a')?.textContent?.trim() ||
            document.querySelector('ytd-channel-name yt-formatted-string a')?.textContent?.trim() ||
            document.querySelector('#channel-name a')?.textContent?.trim() ||
            '';

          let description = '';
          try {
            const results = window.ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
            if (Array.isArray(results)) {
              for (const item of results) {
                const content = item?.videoSecondaryInfoRenderer?.attributedDescription?.content;
                if (content) { description = content; break; }
              }
            }
          } catch(e) {}
          if (!description) {
            const expandBtn =
              document.querySelector('#description-inline-expander tp-yt-paper-button#expand') ||
              document.querySelector('ytd-text-inline-expander tp-yt-paper-button#expand') ||
              document.querySelector('tp-yt-paper-button#expand');
            if (expandBtn) {
              expandBtn.click();
              await new Promise(r => setTimeout(r, 300));
            }
            const expander =
              document.querySelector('#description-inline-expander') ||
              document.querySelector('ytd-text-inline-expander');
            if (expander) {
              const inner =
                expander.querySelector('yt-attributed-string') ||
                expander.querySelector('#attributed-snippet-text') ||
                expander.querySelector('yt-formatted-string');
              description = (inner || expander).textContent?.trim() || '';
            }
          }

          try {
            // YouTube keeps several transcript panels in the DOM at once: an empty
            // PAmodern_transcript_view plus two engagement-panel-searchable-transcript
            // panels holding identical segments (one EXPANDED, one HIDDEN). Scope every
            // lookup to the visible one, otherwise the transcript is collected twice.
            const transcriptPanels = () =>
              [...document.querySelectorAll('ytd-engagement-panel-section-list-renderer')]
                .filter((p) => /transcript/i.test(p.getAttribute('target-id') || ''));

            const hasSegments = (panel) =>
              !!panel.querySelector('ytd-transcript-segment-renderer, transcript-segment-view-model, .segment-text');

            const findTranscriptRoot = () => {
              const panels = transcriptPanels();
              return (
                panels.find((p) => p.getAttribute('visibility') === 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED' && hasSegments(p)) ||
                panels.find((p) => p.offsetParent && hasSegments(p)) ||
                panels.find(hasSegments) ||
                document
              );
            };

            // Wait for actual segments, not just the container: an empty
            // #segments-container exists before the transcript is loaded, and
            // resolving on it alone yields TRANSCRIPT_NOT_FOUND.
            const segmentsPresent = () =>
              !!document.querySelector('ytd-transcript-segment-renderer, transcript-segment-view-model, .segment-text');

            const waitForSegments = (timeoutMs) =>
              new Promise((resolve, reject) => {
                if (segmentsPresent()) {
                  resolve();
                  return;
                }
                const intervalId = setInterval(() => {
                  if (segmentsPresent()) {
                    clearInterval(intervalId);
                    resolve();
                  }
                }, 100);

                setTimeout(() => {
                  clearInterval(intervalId);
                  reject(new Error("TRANSCRIPT_TIMEOUT"));
                }, timeoutMs);
              });

            const openTranscriptPanel = () => {
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
            };

            if (!segmentsPresent()) {
              // Check if any transcript panel is already open
              const panelAlreadyOpen = transcriptPanels().some(
                (p) => p.getAttribute('visibility') === 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED'
              );

              if (!panelAlreadyOpen) {
                openTranscriptPanel();
              }

              try {
                await waitForSegments(10000);
              } catch (e) {
                // The panel looked open but stayed empty: try opening it once more.
                if (!panelAlreadyOpen) throw e;
                openTranscriptPanel();
                await waitForSegments(10000);
              }
            }

            const root = findTranscriptRoot();

            let text = "";
            const seenSegments = new Set();
            // Safety net in case YouTube ever renders two visible panels: identical
            // (timestamp, content) pairs are kept only once. Lines without a timestamp
            // pass through untouched so legitimate repeats are preserved.
            const appendLine = (timestamp, content) => {
              if (!timestamp) {
                text += `${content}\n`;
                return;
              }
              const key = `${timestamp} ${content}`;
              if (seenSegments.has(key)) return;
              seenSegments.add(key);
              text += `${timestamp} ${content}\n`;
            };

            // Method 1: ytd-transcript-segment-renderer (legacy format)
            const oldSegments = root.querySelectorAll("ytd-transcript-segment-renderer");
            if (oldSegments.length > 0) {
              oldSegments.forEach((segment) => {
                const timestamp = segment.querySelector(".segment-timestamp")?.textContent?.trim() || "";
                const content = segment.querySelector(".segment-text")?.textContent?.trim() || "";
                if (timestamp && content) {
                  appendLine(timestamp, content);
                }
              });
            }

            // Method 2: transcript-segment-view-model (2026 new format)
            if (!text.trim()) {
              const newSegments = root.querySelectorAll("transcript-segment-view-model");
              if (newSegments.length > 0) {
                newSegments.forEach((segment) => {
                  // Try direct class selectors first
                  const timestampEl = segment.querySelector('.ytwTranscriptSegmentViewModelTimestamp');
                  const contentEl = segment.querySelector('.yt-core-attributed-string[role="text"]');
                  if (timestampEl && contentEl) {
                    const timestamp = timestampEl.textContent?.trim() || "";
                    const content = contentEl.textContent?.trim() || "";
                    if (timestamp && content) {
                      appendLine(timestamp, content);
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
                      appendLine(timestamp, content.trim());
                    }
                  }
                });
              }
            }

            // Method 3: engagement panel .segment-text
            if (!text.trim()) {
              const segments = root.querySelectorAll('.segment-text');
              segments.forEach((seg) => {
                const content = seg.textContent?.trim();
                if (content) {
                  appendLine("", content);
                }
              });
            }

            // Method 4: #segments-container yt-formatted-string
            if (!text.trim()) {
              const container = root.querySelector('#segments-container');
              if (container) {
                const segments = container.querySelectorAll('yt-formatted-string');
                segments.forEach((segment) => {
                  const content = segment.textContent?.trim();
                  if (content) {
                    appendLine("", content);
                  }
                });
              }
            }

            if (!text.trim()) {
              throw new Error("TRANSCRIPT_NOT_FOUND");
            }

            return { transcript: text, title, url, channel, description };
          } catch (error) {
            // Return the code instead of throwing: an exception inside an injected
            // function reaches the popup as an undefined result, losing the reason.
            return { error: error?.message || String(error) };
          }
        },
      });

      const payload = result && result[0] ? result[0].result : null;

      if (payload && payload.error) {
        showAlert(t('alert.errorPrefix') + describeTranscriptError(payload.error), false);
      } else if (payload && payload.transcript) {
        const { transcript, title, url, channel, description } = payload;

        const metaParts = [];
        if (metaSettings.includeTitle && title) metaParts.push(`${t('metadata.titleLabel')}: ${title}`);
        if (metaSettings.includeUrl && url) metaParts.push(`${t('metadata.urlLabel')}: ${url}`);
        if (metaSettings.includeChannel && channel) metaParts.push(`${t('metadata.channelLabel')}: ${channel}`);
        if (metaSettings.includeDescription && description) metaParts.push(`${t('metadata.descriptionLabel')}:\n${description}`);

        const parts = [];
        if (promptTemplate.value) parts.push(promptTemplate.value);
        if (metaParts.length > 0) parts.push(metaParts.join('\n'));
        parts.push(transcript);
        const finalText = parts.join('\n\n');

        await navigator.clipboard.writeText(finalText);
        showAlert(t('alert.copied'));
      } else {
        showAlert(t('alert.errorNoTranscript'), false);
      }
    } catch (error) {
      showAlert(t('alert.errorPrefix') + describeTranscriptError(error?.message || ''), false);
    } finally {
      loadingOverlay.classList.remove("show");
    }
  });

  // Auto focus textarea
  promptTemplate.focus();
});
