# ![Tasks-Do-List Extension](icons/icon32.png) Tasks-Do-List Chrome Extension

**The one and only Google Tasks Chrome extension you'll ever need.** 

Created to provide a simple, intuitive to-do-list experience while maintaining the powerful synchronization features of Google Tasks. No more switching between tabs or apps - manage your tasks from many Google accounts directly from your browser with a clean, modern interface that feels like a native to-do app.



## ✨ Features

- 🔐 **Secure Google OAuth authentication**
- 📝 **Create, edit, and complete tasks** with ease
- 📅 **Set due dates**
- 🗂️ **Multi-account support** - manage tasks from different Google accounts
- 🌍 **Multi-language support** (English, Spanish, Polish)
- ⚡ **Real-time sync** with Google Tasks
- 🔒 **Privacy-first** - no data stored on external servers

## 🚀 Quick Start

### For Users
1. Install from [Chrome Web Store](#) (coming soon)
2. Click the extension icon
3. Sign in with your Google account
4. Start managing your tasks!


## 🤝 Contributing

We welcome contributions! If you encounter any problems or bugs, please report them on our [Issues page](https://github.com/ZoltePudeleczko/tasks-do-list-extension/issues). Feel free to also raise any feature requests there!

### 🌍 Internationalization

The extension supports multiple languages:
- English (en)
- Spanish (es)
- Polish (pl)

Language files are located in `src/i18n/translations/`.


**How to contribute translations:**

**Option 1: Create a Pull Request**
1. Clone repository `git clone https://github.com/ZoltePudeleczko/tasks-do-list-extension.git`
2. Create a new branch: `git checkout -b feature/translation-[language-code]`
3. Prepare translation
   - Create a new translation file in `src/i18n/translations/` (e.g., `fr.json` for French) and copy the structure from `en.json` and translate all values
   - Or identify the translation file for a language you've found a problem and fix it
5. Commit and push your changes
6. Create a pull request on [Pull Requests page](https://github.com/ZoltePudeleczko/tasks-do-list-extension/pulls)

**Option 2: Use Issues**
1. Take a look at the structure of English translation file `src/i18n/translations/en.json`
1. Create a new issue on [Issues page](https://github.com/ZoltePudeleczko/tasks-do-list-extension/issues) with the title "Translation: [Language Name]"
2. Attach the translated JSON file as a comment
3. Include any notes about cultural considerations or context

## 🛠️ Development

### Project Structure
```
├── src/
│   ├── components/        # React components
│   ├── services/          # API services
│   ├── i18n/              # Internationalization
│   ├── styles/            # CSS styles
│   └── config/            # Configuration
├── google-oauth-worker/   # Cloudflare Worker for OAuth
├── icons/                 # Extension icons
└── dist/                  # Built extension
```

### For Developers

**Feel free to use this code as a foundation for your own Chrome extensions! Just give credit when using this code as inspiration.**

#### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn
- Chrome browser for testing

#### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/ZoltePudeleczko/tasks-do-list-extension.git
   cd tasks-do-list-extension
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file (not tracked in git)
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:

3. **Deploy Cloudflare Worker:**
   ```bash
   cd google-oauth-worker
   npm install
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler deploy
   ```

4. **Build the extension:**
   ```bash
   npm run build
   ```

5. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## ⚠️ Known Issues

Due to limitations in the Google Tasks API, the following features are not supported:

- **Task starring** - The API doesn't support marking tasks as important
- **Time-specific due dates** - Only date (not time) can be set for task due dates

These limitations are imposed by Google's Tasks API and affect all third-party Google Tasks applications, not just this extension.


## 🔗 Links
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
- [Privacy Policy](PRIVACY_POLICY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)

---

**Made with ❤️ for better task management**