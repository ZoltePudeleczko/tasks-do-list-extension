// Environment configuration
export const ENV_CONFIG = {
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
  
  // Cloudflare Worker Configuration
  WORKER_BASE_URL: process.env.WORKER_BASE_URL || 'https://your-worker-name.your-subdomain.workers.dev',
  
  // External Links Configuration
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || 'your-github-username',
  BUY_ME_A_COFFEE_USERNAME: process.env.BUY_ME_A_COFFEE_USERNAME || 'your-buymeacoffee-username',
  CHROME_WEB_STORE_EXTENSION_ID: process.env.CHROME_WEB_STORE_EXTENSION_ID || 'your-extension-id',
} as const;

// Helper function to get external links with environment variables
export const getExternalLinks = () => ({
  CHROME_WEB_STORE: {
    REVIEWS: `https://chrome.google.com/webstore/detail/${ENV_CONFIG.CHROME_WEB_STORE_EXTENSION_ID}/reviews`,
  },
  GITHUB: {
    BASE: `https://github.com/${ENV_CONFIG.GITHUB_USERNAME}/tasks-do-list-extension`,
    ISSUES: `https://github.com/${ENV_CONFIG.GITHUB_USERNAME}/tasks-do-list-extension/issues`,
  },
  BUY_ME_A_COFFEE: {
    BASE: `https://www.buymeacoffee.com/${ENV_CONFIG.BUY_ME_A_COFFEE_USERNAME}`,
  },
}); 