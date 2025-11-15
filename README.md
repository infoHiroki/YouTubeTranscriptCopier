# YouTube Transcript Copier

A Chrome extension that copies YouTube transcripts with customizable AI analysis prompts. Features a retro cyberpunk design powered by Tailwind CSS.

🌐 **[Visit Website](https://infohiroki.github.io/YouTubeTranscriptCopier/)** | 📦 **[Chrome Web Store](https://chromewebstore.google.com/detail/youtube-transcript-copier/pjogfgkppdcjmgehjfecjdjfhpjapiph)** | 💬 **[Report Issues](https://github.com/infoHiroki/YouTubeTranscriptCopier/issues)**

## ✨ Features

- **One-Click Copy** - Instantly copy YouTube transcripts with timestamps
- **Custom Prompts** - Create and manage your own AI prompt templates
- **Prompt Manager** - Full CRUD operations for prompt templates
- **Cloud Sync** - Prompts sync across devices via Chrome Storage API
- **Retro Cyberpunk UI** - Immersive design with glitch effects and pixel fonts
- **Multilingual** - Supports English, Japanese, and Chinese interfaces

## 🚀 Tech Stack

- **Manifest V3** - Latest Chrome Extension API
- **Tailwind CSS** - Utility-first CSS framework with custom cyberpunk theme
- **ES6 Modules** - Modern JavaScript architecture
- **Chrome Storage API** - Sync storage for prompts across devices

## 📦 Installation

### From Chrome Web Store (Recommended)

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/youtube-transcript-copier/pjogfgkppdcjmgehjfecjdjfhpjapiph)

### For Developers

```bash
# Clone the repository
git clone https://github.com/infoHiroki/YouTubeTranscriptCopier.git
cd YouTubeTranscriptCopier

# Install dependencies
npm install

# Build Tailwind CSS
npm run build:css

# Load unpacked extension in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the project directory
```

## 🎯 Usage

1. **Open a YouTube video** with available transcripts
2. **Click the extension icon** in your browser toolbar
3. **Select or write a prompt** (or use default prompts)
4. **Click "COPY THAT!!"** button
5. **Paste into your AI assistant** (ChatGPT, Claude, etc.)

## ⚙️ Prompt Manager

Access the Prompt Manager by clicking the ⚙️ icon in the popup:

- **Add** new custom prompts
- **Edit** existing prompts
- **Delete** unwanted prompts
- **Reset** to default prompt templates

## 📁 Project Structure

```
YouTubeTranscriptCopier/
├── src/
│   ├── popup/              # Popup UI (HTML, JS, CSS)
│   ├── options/            # Prompt Manager interface
│   ├── js/                 # Shared JavaScript modules
│   ├── css/                # Tailwind CSS (input & output)
│   └── assets/             # Icons, default prompts JSON
├── _locales/               # i18n localization files
├── docs/                   # GitHub Pages website
├── manifest.json           # Extension configuration
├── package.json            # npm dependencies
└── tailwind.config.js      # Tailwind CSS configuration
```

## 🛠️ Development

### Available Scripts

```bash
# Install dependencies
npm install

# Build CSS (development)
npm run build:css

# Watch mode (auto-rebuild on changes)
npm run watch:css

# Production build (minified)
npm run build:prod

# Build all (CSS for both extension and docs site)
npm run build:all
```

### Customization

Edit `tailwind.config.js` to customize the cyberpunk theme colors, fonts, and effects.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 👤 Author

**info.HirokiTakamura**

- Website: [infohiroki.com](https://infohiroki.com/)
- Email: info.hirokitakamura@gmail.com

## 📝 Version History

### v1.1 - Tailwind CSS Refactor + Prompt Manager
- Migrated from vanilla CSS to Tailwind CSS
- Added customizable prompt templates
- Implemented Prompt Manager with full CRUD operations
- Enhanced cyberpunk design with glitch effects
- Improved modular architecture

### v1.0 - Initial Release
- Basic YouTube transcript copying
- Hardcoded prompt templates
- Simple popup interface

## 🙏 Acknowledgments

Built for the AI community with ❤️

Special thanks to:
- [Tailwind CSS](https://tailwindcss.com/) for the amazing CSS framework
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) font for the retro pixel aesthetic
