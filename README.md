# YouTube Transcript Copier

YouTubeの字幕をAI分析用プロンプト付きでコピーするChrome拡張機能。日本語/英語UI、テーマ切替対応。

A Chrome extension that copies YouTube transcripts with customizable AI analysis prompts. Supports English/Japanese UI and multiple themes.

🌐 **[Website](https://infohiroki.github.io/YouTubeTranscriptCopier/)** | 📦 **[Chrome Web Store](https://chromewebstore.google.com/detail/youtube-transcript-copier/pjogfgkppdcjmgehjfecjdjfhpjapiph)** | 💬 **[Issues](https://github.com/infoHiroki/YouTubeTranscriptCopier/issues)**

## Features

- **One-Click Copy** - YouTube字幕をタイムスタンプ付きでワンクリックコピー
- **Custom Prompts** - AIプロンプトテンプレートの作成・管理（CRUD）
- **Free Edit Mode** - 自由編集モード（メモ・下書き用、自動保存）
- **Multi-language UI** - English / 日本語 切替（設定画面で変更）
- **Multi-theme** - Clean Modern / Cyberpunk テーマ切替
- **Cloud Sync** - プロンプトはChrome Storage APIで端末間同期
- **4-Method Transcript Fetch** - YouTube 2026年UI変更対応の4段階フォールバック

## Installation

### Chrome Web Store

[Chrome Web Store](https://chromewebstore.google.com/detail/youtube-transcript-copier/pjogfgkppdcjmgehjfecjdjfhpjapiph) からインストール

### For Developers

```bash
git clone https://github.com/infoHiroki/YouTubeTranscriptCopier.git
cd YouTubeTranscriptCopier

# Load unpacked extension in Chrome
# 1. chrome://extensions を開く
# 2. 「デベロッパーモード」を有効化
# 3. 「パッケージ化されていない拡張機能を読み込む」でプロジェクトディレクトリを選択
```

> v2.0からTailwindは不要です。ビルドステップなしでそのまま動作します。

## Usage

1. YouTubeの動画ページを開く
2. 拡張機能のアイコンをクリック
3. プロンプトを選択（または自由編集モード）
4. 「コピー」ボタンをクリック
5. ChatGPT、Claude、Geminiなどに貼り付け

## Claude Code Skill — 画面なしで字幕を取る

`skill/youtube-transcript/` は、同じことをブラウザなしでやる [Claude Code](https://claude.com/claude-code) のスキルです。
拡張は YouTube の画面の「文字起こし」パネルを読みますが、スキルは [yt-dlp](https://github.com/yt-dlp/yt-dlp) で字幕だけを取ります。

- 出力は `[mm:ss] 文` の時刻付きテキスト。先頭に題・チャンネル・長さ・URL・取得日・字幕の種類(手動/自動)、チャプターは見出し
- 元の言語の字幕を選ぶ(手動 > 自動)。自動翻訳の字幕は使わない
- 自動の字幕は、画面の「文字起こし」と同じ言葉になる(2026-11-23 に 3 本で確認)
- 必要な物: `yt-dlp`(`brew install yt-dlp`)と `python3`。追加のライブラリは不要

```bash
# Claude Code から使えるようにする(1 回だけ)
ln -s "$(pwd)/skill/youtube-transcript" ~/.claude/skills/youtube-transcript

# そのまま使う(保存先を省くと ./transcripts/)
python3 -I skill/youtube-transcript/yt_transcript.py "https://www.youtube.com/watch?v=VIDEO_ID" --out ~/transcripts
```

Claude Code では「この動画の字幕を取って要約して」+ URL で動きます。詳しくは [`skill/youtube-transcript/SKILL.md`](skill/youtube-transcript/SKILL.md)。

## Project Structure

```
YouTubeTranscriptCopier/
├── manifest.json
├── _locales/                 # Store listing (name, description)
│   ├── en/messages.json
│   └── ja/messages.json
├── src/
│   ├── popup/                # Popup UI
│   │   ├── popup.html
│   │   └── popup.js
│   ├── options/              # Settings + Prompt Manager
│   │   ├── options.html
│   │   └── options.js
│   ├── js/
│   │   ├── promptManager.js  # Prompt CRUD + default loading
│   │   ├── i18n.js           # User-selectable i18n
│   │   └── themeManager.js   # Theme switching
│   ├── css/
│   │   ├── common.css        # Layout (CSS custom properties)
│   │   └── themes/
│   │       ├── clean.css     # Clean Modern theme (default)
│   │       └── cyberpunk.css # Cyberpunk theme
│   ├── strings/
│   │   ├── en.json           # UI strings (English)
│   │   └── ja.json           # UI strings (Japanese)
│   └── assets/
│       ├── icons/
│       ├── defaultPrompts/
│       │   ├── en.json
│       │   └── ja.json
│       └── logo.svg
├── skill/
│   └── youtube-transcript/   # Claude Code skill (no browser, uses yt-dlp)
│       ├── SKILL.md
│       └── yt_transcript.py
├── docs/                     # GitHub Pages website
├── privacy-policy.html
└── LICENSE
```

## Version History

### v2.0.1 - YouTube 2026年2月DOM変更対応
- 文字起こしパネルの新target-id（`PAmodern_transcript_view`）に対応
- `transcript-segment-view-model`のクラスセレクタによる直接抽出に改善
- a11yラベル（分/minutes表記）のcleanup修正

### v2.0 - Multi-language & Multi-theme Integration
- [YoutubeMojiCopy](https://github.com/infoHiroki/YoutubeMojiCopy)（日本語版）を統合
- Tailwind CSSを廃止、CSS Custom Propertiesベースに移行
- 日本語/英語UI切替機能を追加
- Clean Modern / Cyberpunkテーマ切替を追加
- 自由編集モードを追加
- 4段階フォールバック字幕取得（2026年YouTube UI変更対応）
- 言語別デフォルトプロンプト

### v1.1 - Tailwind CSS Refactor + Prompt Manager
- Tailwind CSSに移行
- プロンプトテンプレートのCRUD管理
- サイバーパンクデザインの強化

### v1.0 - Initial Release
- 基本的なYouTube字幕コピー機能

## Migration from YoutubeMojiCopy

YoutubeMojiCopyユーザーの方へ：

- 全機能はこの拡張機能に統合されています
- 初回起動時にブラウザの言語設定を自動検出します（日本語ブラウザなら日本語UIになります）
- テーマは設定画面からClean Modern（YoutubeMojiCopyと同じデザイン）を選択できます
- カスタムプロンプトは再設定が必要です（ストレージが異なるため）

## License

MIT License

## Author

**info.HirokiTakamura** - [infohiroki.com](https://infohiroki.com/)
