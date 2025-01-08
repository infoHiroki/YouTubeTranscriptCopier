const templates = {
en: {
  basic: {
    name: "Basic Summary",
    prompt: "Please summarize the following content."
  },
  detailed: {
    name: "Detailed Analysis",
    prompt: "For the following content:\n1. List 3 key points\n2. Show important quotes\n3. Summarize the overall message"
  },
  technical: {
    name: "Technical Review",
    prompt: "Analyze the following technical content:\n1. Key technical elements\n2. Implementation considerations\n3. Potential improvements"
  }
}
};

document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
  initializeCustomPrompt();
});

function loadTemplates() {
    const templateList = document.querySelector('.template-list');
    
    Object.entries(templates.en).forEach(([key, template]) => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.innerHTML = `
            <div class="item-title">${template.name}</div>
            <div class="item-preview">${template.prompt}</div>
        `;
        
        // クリックイベントを修正
        templateItem.addEventListener('click', () => {
            // 選択状態の視覚的な更新
            document.querySelectorAll('.template-item').forEach(item => {
                item.classList.remove('selected');
            });
            templateItem.classList.add('selected');
            
            // ストレージに保存
            chrome.storage.local.set({ 
                promptTemplate: template.prompt 
            }, () => {
                // 保存成功時の視覚的フィードバック
                templateItem.classList.add('saved');
                setTimeout(() => templateItem.classList.remove('saved'), 1000);
            });
        });
        
        templateList.appendChild(templateItem);
    });
}
function loadTemplates() {
    const templateList = document.querySelector('.template-list');
    const promptDisplay = document.getElementById('promptDisplay');
    
    Object.entries(templates.en).forEach(([key, template]) => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.innerHTML = `
            <div class="item-title">${template.name}</div>
            <div class="item-preview">${template.prompt}</div>
        `;
        
        templateItem.addEventListener('click', () => {
            // 選択状態の視覚的な更新
            document.querySelectorAll('.template-item').forEach(item => {
                item.classList.remove('selected');
            });
            templateItem.classList.add('selected');
            
            // プロンプトの表示
            promptDisplay.textContent = template.prompt;
            
            // ストレージに保存して視覚的フィードバック
            chrome.storage.local.set({ 
                promptTemplate: template.prompt 
            }, () => {
                templateItem.classList.add('saved');
                setTimeout(() => templateItem.classList.remove('saved'), 1000);
            });
        });
        
        templateList.appendChild(templateItem);
    });
}
function initializeCustomPrompt() {
  document.getElementById('saveCustom').addEventListener('click', () => {
      const customPrompt = document.getElementById('customPrompt').value;
      if (customPrompt.trim()) {
          chrome.storage.local.set({ promptTemplate: customPrompt });
      }
  });
}
function showStatus(message) {
    const status = document.createElement('div');
    status.className = 'status-message';
    status.textContent = message;
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 2000);
}

function quickReset() {
    const defaultLang = 'en';  // デフォルト言語を英語に固定
    switchLanguage(defaultLang);
}

function saveCustomTemplate() {
    const name = document.querySelector('.custom-template-name').value;
    const template = document.querySelector('#customPrompt').value;
    
    if (!name || !template) {
        showStatus('Please fill in both name and template');
        return;
    }

    chrome.storage.local.get(['customTemplates'], (result) => {
        const customTemplates = result.customTemplates || {};
        customTemplates[name] = template;
        
        chrome.storage.local.set({ customTemplates }, () => {
            showStatus('Custom template saved');
            updateCustomTemplatesList();
        });
    });
}

function updateCustomTemplatesList() {
    const customList = document.querySelector('.custom-templates-list');
    chrome.storage.local.get(['customTemplates'], (result) => {
        const templates = result.customTemplates || {};
        customList.innerHTML = Object.entries(templates)
            .map(([name, template]) => `
                <div class="template-item" data-custom="${name}">
                    <div class="item-title">${name}</div>
                    <div class="item-preview">${template.substring(0, 50)}...</div>
                </div>
            `).join('');
    });
}

// Add to your existing event listeners
document.querySelector('#saveCustom').addEventListener('click', saveCustomTemplate);
