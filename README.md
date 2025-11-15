
# YouTube Transcript Copier

A Chrome extension that copies YouTube transcripts with AI analysis prompts.
YouTubeの字幕をAI分析用プロンプト付きでコピーできるChrome拡張機能です。
一个可以复制YouTube字幕并添加AI分析提示的Chrome扩展程序。

🌐 **[Visit Website](https://yourusername.github.io/YouTubeTranscriptCopier/)** | 📦 **[Chrome Web Store](#)** | 💬 **[Report Issues](https://github.com/yourusername/YouTubeTranscriptCopier/issues)**

## Features / 機能 / 功能
- Easy copying of YouTube transcripts
- Customizable prompt templates
- Prompt manager with CRUD operations
- Retro cyberpunk design (Tailwind CSS)

- YouTubeの字幕を簡単にコピー
- カスタマイズ可能なプロンプトテンプレート
- プロンプト管理画面（追加・編集・削除）
- レトロなサイバーパンクデザイン（Tailwind CSS）

- 轻松复制YouTube字幕
- 可自定义提示模板
- 提示管理界面（增删改查）
- 复古赛博朋克设计（Tailwind CSS）

## Tech Stack / 技術スタック / 技术栈
- **Manifest V3** - Chrome Extension API
- **Tailwind CSS** - Utility-first CSS framework
- **ES6 Modules** - Modern JavaScript
- **Chrome Storage API** - Sync storage for prompts

## Development / 開発 / 开发

### Prerequisites / 必要条件 / 先决条件
- Node.js (for Tailwind CSS build)
- Chrome browser

### Build / ビルド / 构建
```bash
# Install dependencies / 依存関係をインストール / 安装依赖
npm install

# Build CSS / CSSをビルド / 构建CSS
npm run build:css

# Watch mode (auto-rebuild) / ウォッチモード（自動再ビルド） / 监视模式（自动重建）
npm run watch:css

# Production build (minified) / 本番ビルド（圧縮） / 生产构建（压缩）
npm run build:prod
```

### Directory Structure / ディレクトリ構造 / 目录结构
```
YouTubeTranscriptCopier/
├── src/
│   ├── popup/              # Popup UI
│   ├── options/            # Prompt manager
│   ├── js/                 # Common modules
│   ├── css/                # Tailwind CSS
│   └── assets/             # Icons & JSON
├── _locales/               # i18n
├── manifest.json           # Extension config
├── package.json            # npm config
└── tailwind.config.js      # Tailwind config
```

## Installation / インストール方法 / 安装方法

### From Chrome Web Store
1. Install "YouTube Transcript Copier" from Chrome Web Store
   Chrome Web Storeから「YouTube Transcript Copier」をインストール
   从Chrome网上应用店安装"YouTube Transcript Copier"

### For Developers / 開発者向け / 开发者
1. Clone this repository / このリポジトリをクローン / 克隆此仓库
2. Run `npm install && npm run build:css` / `npm install && npm run build:css`を実行 / 运行`npm install && npm run build:css`
3. Open Chrome Extensions page (`chrome://extensions`)
4. Enable "Developer mode" / 「デベロッパーモード」を有効化 / 启用"开发者模式"
5. Click "Load unpacked" and select this directory / 「パッケージ化されていない拡張機能を読み込む」でこのディレクトリを選択 / 点击"加载已解压的扩展程序"并选择此目录

## Usage / 使い方 / 使用方法
1. Play a YouTube video / YouTubeの動画を再生 / 播放YouTube视频
2. Click the extension icon / 拡張機能のアイコンをクリック / 点击扩展程序图标
3. Select or input prompt / プロンプトを選択または入力 / 选择或输入提示
4. Click "COPY TEXT" button / 「COPY TEXT」ボタンをクリック / 点击"COPY TEXT"按钮
5. Paste into AI chat (ChatGPT, Claude, etc.) / AIチャット（ChatGPT、Claudeなど）に貼り付け / 粘贴到AI聊天（ChatGPT、Claude等）

## Prompt Manager / プロンプト管理 / 提示管理
- Click ⚙️ icon to open Prompt Manager / ⚙️アイコンでプロンプト管理画面を開く / 点击⚙️图标打开提示管理界面
- Add, edit, delete custom prompts / カスタムプロンプトの追加・編集・削除 / 添加、编辑、删除自定义提示
- Reset to default prompts / デフォルトプロンプトにリセット / 重置为默认提示

## License / ライセンス / 许可证
MIT License

## Author / 作者 / 作者
info.HirokiTakamura

## Version / バージョン / 版本
v1.1 - Tailwind CSS refactor + Prompt Manager
- Migrated to Tailwind CSS
- Refactored to modular architecture
- Added prompt management UI

v1.0 - Initial release
- Basic transcript copying
- Hardcoded prompt templates
