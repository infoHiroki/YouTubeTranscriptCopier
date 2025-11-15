# YouTubeTranscriptCopier v1.1 アップグレード計画

## 概要
YouTubeTranscriptCopierをYoutubeMojiCopy v1.1の機能を取り入れてアップグレードします。
サイバーパンクデザインを維持しつつ、便利な機能を追加し、独自性を保ちます。

## 現状分析

### 現在の機能（v1.0）
- YouTube字幕のコピー機能
- 9個のプロンプトテンプレート（HTMLにハードコード）
  - 英語: Basic, Detailed, Debate
  - 日本語: 基本, 詳細, 討論
  - 中国語: 基础, 详细, 辩论
- サイバーパンクデザイン（黒背景、マゼンタ/グリーン、グリッチエフェクト）
- プロンプトの自動保存

### 現在の課題
- プロンプト管理画面が存在しない（manifest.jsonに記載はあるが未実装）
- プロンプトをカスタマイズできない
- プロンプト選択を記憶しない
- フリー入力モードがない

## 追加する機能（YoutubeMojiCopy v1.1ベース）

### 1. プロンプト管理画面
- プロンプトの追加・編集・削除
- 2カラムのカードレイアウト
- サイバーパンクデザインで統一
- 自動保存機能（デバウンス500ms）
- すべて削除・初期化ボタン
- カスタム確認ダイアログ

### 2. プロンプト選択記憶
- 前回選択したプロンプトを記憶
- ポップアップ起動時に自動復元

### 3. フリー入力モード
- メモ・下書き用の専用モード
- 専用のストレージキーで保存
- 視覚的フィードバック（ボーダーの色変更など）

### 4. カスタム確認ダイアログ
- ブラウザのconfirm()を置き換え
- サイバーパンクデザインのモーダル
- カスタムタイトルとメッセージ

## 新規作成するファイル

### `promptManager.js`
プロンプトの読み込み・保存を管理するモジュール
```javascript
// 機能:
// - loadPrompts(): プロンプトをstorage.syncから読み込み
// - savePrompts(prompts): プロンプトをstorage.syncに保存
// - 初回起動時はdefaultPrompts.jsonから読み込み
```

### `defaultPrompts.json`
デフォルトプロンプト定義（既存の9個を移行）
```json
[
  {
    "id": "basic_en",
    "name": "Basic (English)",
    "text": "Please summarize the following YouTube video transcript..."
  },
  // ... 全9個
]
```

### `options.html`
プロンプト管理画面のHTML
- サイバーパンクデザイン
- ヘッダー（タイトル + 3つのボタン）
- 2カラムのカードグリッド
- カスタム確認ダイアログ

### `options.js`
プロンプト管理画面のロジック
- カードの追加・削除
- 自動保存（デバウンス）
- すべて削除・初期化
- カスタムダイアログ表示

## 修正するファイル

### `manifest.json`
```json
{
  "version": "1.1",
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}
```

### `popup.html`
- 設定ボタンを追加（歯車アイコン、サイバーパンクスタイル）
- フリー入力オプションを追加
- プレースホルダーを動的に変更

### `popup.js`
- プロンプト選択記憶機能を実装
- フリー入力モードを実装
- updateUIState()関数を追加
- promptManager.jsを利用してプロンプトを動的に読み込み

### `style.css`
サイバーパンクデザインを維持しつつ、新機能用のスタイルを追加
- options page用のスタイル
- カードレイアウト
- カスタムダイアログ
- フリー入力モード用のスタイル
- 設定ボタンのスタイル

## デザインガイドライン（サイバーパンク維持）

### カラースキーム
- 背景: `#000` (黒)
- コンテナ背景: `#1a1a1a`
- プライマリ: `#ff00ff` (マゼンタ)
- セカンダリ: `#00ff00` (グリーン)
- アクセント: `#00ffff` (シアン)
- テキスト: `#fff` (白)

### フォント
- タイトル: `'Press Start 2P', cursive`
- 本文: `'Courier New', monospace`

### エフェクト
- グロー: `box-shadow: 0 0 10px color, inset 0 0 10px color`
- テキストシャドウ: `text-shadow: 0 0 15px color`
- グリッチエフェクト（コピー成功時）
- スキャンライン（背景エフェクト）
- ノイズ（背景エフェクト）

### ボタンスタイル
```css
button {
  background: #000;
  color: #00ff00;
  border: 2px solid #00ff00;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 0 10px #00ff00;
}

button:hover {
  background: #00ff00;
  color: #000;
  box-shadow: 0 0 20px #00ff00;
}
```

### カード（プロンプト管理画面）
```css
.template-row {
  background: #1a1a1a;
  border: 2px solid #ff00ff;
  box-shadow: 0 0 10px #ff00ff;
}

.template-row:hover {
  box-shadow: 0 0 20px #ff00ff;
  border-color: #00ffff;
}
```

## 実装手順

### フェーズ1: 基盤構築
1. `promptManager.js` を作成
2. `defaultPrompts.json` を作成（既存の9個のプロンプトを移行）
3. 動作確認

### フェーズ2: プロンプト管理画面
4. `options.html` を作成（サイバーパンクデザイン）
5. `options.js` を作成（管理ロジック）
6. `style.css` にoptions page用スタイルを追加
7. 動作確認

### フェーズ3: ポップアップ機能強化
8. `popup.html` に設定ボタンとフリー入力オプションを追加
9. `popup.js` を修正（選択記憶、フリー入力モード）
10. `style.css` にフリー入力モード用スタイルを追加
11. 動作確認

### フェーズ4: 仕上げ
12. `manifest.json` を更新（バージョン1.1、options_ui追加）
13. 全体的な動作確認
14. バグ修正
15. コミット・プッシュ

## 期待される成果

### ユーザーエクスペリエンスの向上
- プロンプトを自由にカスタマイズできる
- 前回の選択が保存されるので、毎回選び直す必要がない
- フリー入力モードでメモや下書きができる
- サイバーパンクデザインが統一され、没入感が増す

### 技術的な改善
- プロンプトがハードコードではなく、動的に管理される
- storage.syncを使用し、複数デバイス間で同期可能
- モジュール化されたコード構成
- 自動保存により、データ損失のリスクが減る

### ブランディング
- サイバーパンクデザインによる強い個性
- YoutubeMojiCopyとは異なる独自の世界観
- ターゲット: レトロゲーム好き、サイバーパンク愛好者、開発者

## 注意事項

### 互換性
- Chrome Manifest V3対応を維持
- 既存ユーザーのプロンプトデータは失われない（初回起動時にdefaultPrompts.jsonから読み込み）

### パフォーマンス
- デバウンス処理により、過度な保存処理を防ぐ
- グリッチエフェクトは短時間（800ms）で終了

### セキュリティ
- ユーザー入力のサニタイゼーションは不要（Chrome拡張機能内で完結）
- storage.syncの使用量制限に注意（QUOTA_BYTES: 102,400バイト）

## 参考資料

### YoutubeMojiCopy v1.1の実装
- `C:\dev\YoutubeMojiCopy\`
- 特に以下のファイルを参考:
  - `promptManager.js`
  - `defaultPrompts.json`
  - `options.html` / `options.js`
  - `popup.html` / `popup.js`

### デザインリファレンス
- 既存の `style.css` のサイバーパンクデザイン
- グリッチエフェクト、スキャンライン、ノイズエフェクト

---

**作成日**: 2025-01-14
**バージョン**: 1.0
**ステータス**: Planning
