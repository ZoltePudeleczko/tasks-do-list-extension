import { UserAccount } from '../types';
import { ENV_CONFIG } from '../config/environment';

const CLIENT_ID = ENV_CONFIG.GOOGLE_CLIENT_ID;
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;
const SCOPE = 'https://www.googleapis.com/auth/tasks profile email';
const OAUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent&include_granted_scopes=true`;
const WORKER_BASE = ENV_CONFIG.WORKER_BASE_URL;

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

export class AuthService {
  static async authenticateAccount(): Promise<UserAccount> {
    // Step 1: Launch OAuth flow
    const code = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: OAUTH_URL,
        interactive: true
      }, (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          console.error('[OAuth] No redirect URL or runtime error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError || 'No redirect URL');
          return;
        }
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        if (code) {
          resolve(code);
        } else {
          console.error('[OAuth] No code found in redirect URL:', redirectUrl);
          reject('No code found in redirect URL');
        }
      });
    });

    // Step 2: Exchange code for tokens via Cloudflare Worker
    const tokenRes = await fetch(`${WORKER_BASE}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[OAuth] Token exchange failed:', errText);
      throw new Error('Token exchange failed: ' + errText);
    }
    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, id_token } = tokenData;

    // Step 3: Get user info from id_token or Google People API
    let userInfo: { email: string; name: string; picture?: string } = { email: '', name: '' };
    if (id_token) {
      // Parse JWT for basic profile info
      const payload = JSON.parse(atob(id_token.split('.')[1]));
      userInfo = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } else {
      // Fallback: fetch from Google People API
      const peopleRes = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const people = await peopleRes.json();
      userInfo = {
        email: people.emailAddresses?.[0]?.value || '',
        name: people.names?.[0]?.displayName || '',
        picture: people.photos?.[0]?.url
      };
    }

    // Step 4: Verify Google Tasks API access
    try {
      const testResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!testResponse.ok) {
        if (testResponse.status === 403) {
          throw new Error('Google Tasks API access denied. Please ensure you grant permission to manage your Google Tasks when prompted.');
        } else if (testResponse.status === 401) {
          throw new Error('Authentication failed. Please try again.');
        } else {
          throw new Error(`Google Tasks API error: ${testResponse.status} ${testResponse.statusText}`);
        }
      }
    } catch (error) {
      console.error('Google Tasks API verification failed:', error);
      throw error;
    }

    // Step 5: Build UserAccount object
    const account: UserAccount = {
      id: userInfo.email,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: access_token,
      refreshToken: refresh_token
    };

    // Step 6: Store tokens in chrome.storage.sync
    const stored = await chrome.storage.sync.get('accounts') as { accounts?: UserAccount[] };
    const accounts = stored.accounts || [];
    const updatedAccounts = [...accounts.filter(acc => acc.email !== account.email), account];
    await chrome.storage.sync.set({ accounts: updatedAccounts });

    return account;
  }

  static async removeAccount(accountId: string): Promise<void> {
    const stored = await chrome.storage.sync.get('accounts') as { accounts?: UserAccount[] };
    const accounts = stored.accounts || [];
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    await chrome.storage.sync.set({ accounts: updatedAccounts });
  }

  static async refreshToken(account: UserAccount): Promise<string> {
    if (!account.refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${WORKER_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: account.refreshToken })
    });
    if (!res.ok) throw new Error('Token refresh failed');
    const data = await res.json();
    // Update account with new access token
    account.accessToken = data.access_token;
    // Optionally update refresh token if provided
    if (data.refresh_token) account.refreshToken = data.refresh_token;
    // Save updated account
    const stored = await chrome.storage.sync.get('accounts') as { accounts?: UserAccount[] };
    const accounts = stored.accounts || [];
    const updatedAccounts = accounts.map(acc => acc.id === account.id ? account : acc);
    await chrome.storage.sync.set({ accounts: updatedAccounts });
    return data.access_token;
  }

  static async testAuthentication(account: UserAccount): Promise<boolean> {
    try {
      // Make a simple API call to test if the token is still valid
      const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1', {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        // Token is invalid, try to refresh
        try {
          await this.refreshToken(account);
          return true; // Refresh successful
        } catch (refreshErr) {
          return false; // Refresh failed
        }
      }
      
      return response.ok; // Return true if the API call was successful
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }
} 