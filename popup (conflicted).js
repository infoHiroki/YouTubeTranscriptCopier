// デバッグ用のログ出力を追加
console.log('popup.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    const button = document.getElementById('copyTranscript');
    const promptTemplate = document.getElementById('promptTemplate');
    
    // ボタンのテキストを設定
    button.textContent = 'COPY TRANSCRIPT';
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    const button = document.getElementById('copyTranscript');
    const promptTemplate = document.getElementById('promptTemplate');
    
    button.textContent = 'COPY TRANSCRIPT';

    chrome.storage.sync.get(['defaultPrompt'], (result) => {
        if (result.defaultPrompt) {
            promptTemplate.value = result.defaultPrompt;
        }
    });
});
    // Keep the existing copy functionality
    button.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "getTranscript"}, (response) => {
                if (response && response.transcript) {
                    const finalText = promptTemplate.value + response.transcript;
                    navigator.clipboard.writeText(finalText).then(() => {
                        // Show success animation/message
                        createParticles();
                        showCustomAlert("COPY COMPLETE!", "success");
                    });
                }
            });
        });
    });
});    function createParticles() {
        const container = document.querySelector('.container');
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const colors = [
            '#0ff',  '#f0f',  '#ff0',  '#0f0', 
            '#f00',  '#00f',  '#fff',  '#ff8800',
            '#8ff',  '#f8f',  '#ff8',  '#8f8'
        ];

        // 背景の星を生成（より多く、長く）
        for (let i = 0; i < 200; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const size = Math.random() * 3 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            star.style.left = `${Math.random() * window.innerWidth}px`;
            star.style.top = `${Math.random() * window.innerHeight}px`;
            
            const delay = Math.random() * 4;
            star.style.animation = `twinkle 2.5s infinite ${delay}s`;
            
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 6000);
        }

        // ゆっくりと打ち上がる花火（時間を延長）
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 300;
                const offsetY = (Math.random() - 0.5) * 300;
                createFirework(centerX + offsetX, centerY + offsetY, colors);
            }, i * 900); // 打ち上げ間隔をさらに延長
        }

        // 余韻の光の粒子
        setTimeout(() => {
            for (let i = 0; i < 120; i++) {
                const afterglow = document.createElement('div');
                afterglow.className = 'afterglow';
                
                const size = Math.random() * 2 + 1;
                afterglow.style.width = `${size}px`;
                afterglow.style.height = `${size}px`;
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * window.innerWidth * 0.8;
                
                afterglow.style.left = `${centerX + Math.cos(angle) * distance}px`;
                afterglow.style.top = `${centerY + Math.sin(angle) * distance}px`;
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                afterglow.style.backgroundColor = color;
                afterglow.style.boxShadow = `0 0 ${size * 2}px ${color}`;
                
                document.body.appendChild(afterglow);
                setTimeout(() => afterglow.remove(), 5000);
            }
        }, 1500);

        // containerDisappearアニメーションの開始タイミングと時間を調整
        setTimeout(() => {
            const container = document.querySelector('.container');
            container.style.animation = 'containerDisappear 5s ease-out forwards';
            setTimeout(() => window.close(), 13000); // 全体の表示時間を1秒延長
        }, 8000); // フェードアウト開始も1秒遅く
    }

    function createFirework(x, y, colors) {
        const particleCount = 150;
        const trails = 5;

        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            for (let j = 0; j < trails; j++) {
                const particle = document.createElement('div');
                particle.className = 'firework-particle';
                
                const size = (j === 0) ? Math.random() * 6 + 3 : Math.random() * 4 + 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                
                particle.style.backgroundColor = color;
                particle.style.boxShadow = `0 0 ${size * 3}px ${color}`;
                
                const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
                const velocity = 8 + Math.random() * 8;
                
                const distance = 200 + Math.random() * 400;
                const delay = Math.random() * 0.3 + j * 0.1;
                
                const tx = Math.cos(angle) * distance * velocity / 10;
                const ty = Math.sin(angle) * distance * velocity / 10;
                
                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                particle.style.setProperty('--delay', `${delay}s`);
                
                // アニメーション時間を5秒に延長
                particle.style.animation = `
                    firework 5s cubic-bezier(0.15, 0.85, 0.35, 1) ${delay}s forwards
                `;
                
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 7000); // パーティクルの表示時間も延長
            }
        }
    }

    // アラート表示用の関数
    function showCustomAlert(message, isSuccess = true) {
        const alert = document.createElement('div');
        alert.className = `custom-alert ${isSuccess ? 'success' : 'error'}`;
        
        // メッセージを英語に統一
        const messages = {
            'errorNoActiveTab': 'No active tab found',
            'errorNoTranscript': 'No transcript found',
            'errorNoTranscriptButton': 'Transcript button not found',
            'errorEmptyTranscript': 'Transcript is empty',
            'errorCopyFailed': 'Failed to copy transcript',
            'copyComplete': 'COPY COMPLETE!'
        };

        alert.textContent = messages[message] || message;
        document.body.appendChild(alert);

        if (isSuccess) {
            createParticles();
            const container = document.querySelector('.container');
            container.style.animation = 'containerDisappear 0.5s forwards';
            setTimeout(() => window.close(), 800);
        } else {
            setTimeout(() => alert.remove(), 2000);
        }
    }

    button.addEventListener('click', async () => {
        console.log('Button clicked');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                showCustomAlert('errorNoActiveTab', false);
                return;
            }

            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: async () => {
                    try {
                        console.log('スクリプト実行開始');
                        
                        const transcriptButton = document.querySelector('button[aria-label="文字起こしを表示"]') || 
                                               document.querySelector('button[aria-label="字幕を表示"]') ||
                                               document.querySelector('button[aria-label="Show transcript"]');
                        
                        if (!transcriptButton) {
                            throw new Error('errorNoTranscriptButton');
                        }
                        
                        console.log('文字起こしボタン発見');
                        transcriptButton.click();
                        
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
                        console.log('Found segments:', segments.length);
                        
                        if (segments.length === 0) {
                            throw new Error('errorNoTranscript');
                        }

                        let text = '';
                        segments.forEach(segment => {
                            const timestamp = segment.querySelector('.segment-timestamp')?.textContent?.trim() || '';
                            const content = segment.querySelector('.segment-text')?.textContent?.trim() || '';
                            if (timestamp && content) {
                                text += `${timestamp} ${content}\n`;
                            }
                        });

                        if (!text.trim()) {
                            throw new Error('errorEmptyTranscript');
                        }

                        return text;
                    } catch (error) {
                        console.error('Content script error:', error);
                        throw error;
                    }
                }
            });

            if (result?.[0]?.result) {
                const finalText = promptTemplate.value + result[0].result;
                await navigator.clipboard.writeText(finalText);
                showCustomAlert('copyComplete', true);
            } else {
                throw new Error('errorCopyFailed');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showCustomAlert(error.message || 'errorCopyFailed', false);
        }
    });

    // 設定ページを開くコード
    const optionsLink = document.getElementById('openOptions');
    if (optionsLink) {
        optionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
        });
    }

    // 言語設定の変更メッセージをシンプルに
    function showLanguageChangeMessage() {
        const message = chrome.i18n.getMessage("languageChanged");
        showCustomAlert(message, true);
    }

    function showLanguageChangeError() {
        showCustomAlert("Failed to change language.", false);
    }

    // プロンプト設定以外のメッセージを英語に
    function showSettingsUpdatedMessage() {
        showCustomAlert("Settings have been updated", true);
    }

    function showSettingsError() {
        showCustomAlert("Failed to update settings", false);
    }

    function showApiKeyUpdatedMessage() {
        showCustomAlert("API Key has been updated", true);
    }

    function showApiKeyError() {
        showCustomAlert("Failed to update API Key", false);
    }

    function showClearHistoryMessage() {
        showCustomAlert("Chat history has been cleared", true);
    }

    function showClearHistoryError() {
        showCustomAlert("Failed to clear chat history", false);
    }
});

chrome.storage.sync.get(null, (items) => {
    console.log('保存されている全データ:', items);
});
