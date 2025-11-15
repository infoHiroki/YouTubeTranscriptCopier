# YouTube Transcript Copier - Documentation Site

This directory contains the GitHub Pages website for YouTube Transcript Copier.

## Live Site
- **GitHub Pages**: https://yourusername.github.io/YouTubeTranscriptCopier/
- **Custom Domain**: (Add your CNAME if applicable)

## Setup GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select:
   - **Branch**: `main` (or your default branch)
   - **Folder**: `/docs`
4. Click **Save**
5. Wait a few minutes for the site to build
6. Your site will be available at `https://yourusername.github.io/YouTubeTranscriptCopier/`

## Development

### Build CSS
```bash
# Build docs CSS
npm run build:docs

# Watch for changes
npm run watch:docs
```

### Local Preview
You can preview the site locally by:
1. Using a simple HTTP server:
   ```bash
   cd docs
   python -m http.server 8000
   # or
   npx serve
   ```
2. Open `http://localhost:8000` in your browser

### Update Content
- Edit `index.html` to modify the landing page
- Edit `js/main.js` to add interactive features
- Add screenshots to `images/screenshots/`
- Rebuild CSS after any Tailwind class changes: `npm run build:docs`

## Custom Domain (Optional)

1. Add your domain to `CNAME` file
2. Configure DNS settings with your domain provider:
   - Add a CNAME record pointing to `yourusername.github.io`
3. Enable HTTPS in GitHub Pages settings

## Files

- `index.html` - Main landing page
- `css/output.css` - Tailwind compiled CSS (auto-generated)
- `js/main.js` - Interactive JavaScript
- `images/` - Screenshots and assets
- `.nojekyll` - Prevents Jekyll processing
- `CNAME` - Custom domain configuration (optional)
