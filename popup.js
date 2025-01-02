// デバッグ用のログ出力を追加
console.log('popup.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  const button = document.getElementById('copyTranscript');
  const promptTemplate = document.getElementById('promptTemplate');
  
  // プロンプトをローカルストレージから読み込む
  chrome.storage.local.get(['promptTemplate'], (result) => {
    if (result.promptTemplate) {
      promptTemplate.value = result.promptTemplate;
    }
  });

  // プロンプトの変更を保存
  promptTemplate.addEventListener('input', () => {
    chrome.storage.local.set({ promptTemplate: promptTemplate.value });
  });

  // パーティクルを作成する関数
  function createParticles() {
    const container = document.querySelector('.container');
    const rect = container.getBoundingClientRect();
    const colors = ['#ff00ff', '#00ffff', '#00ff00', '#ffff00'];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      
      // パーティクルの初期位置をコンテナ内のランダムな位置に
      const startX = rect.left + Math.random() * rect.width;
      const startY = rect.top + Math.random() * rect.height;
      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';

      // より派手な動きのためのランダムな方向と距離
      const angle = (Math.random() * Math.PI * 2);
      const distance = 100 + Math.random() * 200;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);

      // アニメーションを適用
      particle.style.animation = 'particle 0.8s cubic-bezier(0.25, .8, .25, 1) forwards';

      document.body.appendChild(particle);

      // アニメーション終了後にパーティクルを削除
      setTimeout(() => {
        particle.remove();
      }, 800);
    }
  }

  // アラート表示用の関数
  function showCustomAlert(message, isSuccess = true) {
    const alert = document.getElementById('customAlert');
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    alert.classList.add('show');

    if (isSuccess) {
      // メインウィンドウを非表示にしてパーティクルエフェクトを実行
      const container = document.querySelector('.container');
      createParticles();
      container.style.animation = 'containerDisappear 0.5s forwards';
      
      // 少し遅れてウィンドウを閉じる
      setTimeout(() => {
        window.close();
      }, 800);
    }

    // エラー時はアラートを自動で消去
    if (!isSuccess) {
      setTimeout(() => {
        alert.classList.remove('show');
      }, 1300);
    }
  }

  button.addEventListener('click', async () => {
    console.log('Button clicked');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        showCustomAlert('ERROR: No active tab', false);
        return;
      }

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          try {
            console.log('スクリプト実行開始');
            
            // 文字起こしボタンを探して自動クリック
            const transcriptButton = document.querySelector('button[aria-label="文字起こしを表示"]') || 
                                   document.querySelector('button[aria-label="字幕を表示"]') ||
                                   document.querySelector('button[aria-label="Show transcript"]');
            
            if (!transcriptButton) {
              throw new Error('文字起こしボタンが見つかりません');
            }
            
            console.log('文字起こしボタン発見');
            transcriptButton.click();
            
            // 文字起こしパネルが開くのを待つ
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 文字起こしセグメントの取得
            const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
            console.log('Found segments:', segments.length);
            
            if (segments.length === 0) {
              throw new Error('文字起こしが見つかりませんでした');
            }

            let text = "";
            segments.forEach((segment) => {
              const timestamp = segment.querySelector('.segment-timestamp')?.textContent?.trim() || '';
              const content = segment.querySelector('.segment-text')?.textContent?.trim() || '';
              if (timestamp && content) {
                text += `${timestamp} ${content}\n`;
              }
            });

            if (!text.trim()) {
              throw new Error('文字起こしの内容が空です');
            }

            return text;
          } catch (error) {
            console.error('Content script error:', error);
            throw error;
          }
        }
      });

      if (result && result[0] && result[0].result) {
        const finalText = promptTemplate.value + result[0].result;
        await navigator.clipboard.writeText(finalText);
        showCustomAlert("COPY COMPLETE!");
      } else {
        throw new Error('文字起こしの取得に失敗しました');
      }
      
    } catch (error) {
      console.error('Error:', error);
      showCustomAlert('ERROR: ' + error.message, false);
    }
  });
});
