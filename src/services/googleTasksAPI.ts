import { GoogleTask, GoogleTaskList, GoogleTasksAPI, UserAccount } from '../types';
import { AuthService } from './authService';

const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

export class GoogleTasksAPIService implements GoogleTasksAPI {
  private account: UserAccount;

  constructor(account: UserAccount) {
    this.account = account;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const response = await fetch(`${TASKS_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.account.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401 && retry) {
      // Try to refresh token and retry once
      try {
        const newAccessToken = await AuthService.refreshToken(this.account);
        this.account.accessToken = newAccessToken;
        // Update chrome.storage.sync with new token
        const stored = await chrome.storage.sync.get('accounts') as { accounts?: UserAccount[] };
        const accounts = stored.accounts || [];
        const updatedAccounts = accounts.map(acc => acc.id === this.account.id ? this.account : acc);
        await chrome.storage.sync.set({ accounts: updatedAccounts });
        // Retry the request with new token
        return this.makeRequest<T>(endpoint, options, false);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        // Create a custom error that indicates re-authentication is needed
        const authError = new Error('Authentication expired. Please re-authenticate your Google account.');
        (authError as any).requiresReauth = true;
        throw authError;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // For DELETE requests, don't try to parse JSON since there's no content
    if (options.method === 'DELETE') {
      return {} as T;
    }

    return response.json();
  }

  async getTaskLists(): Promise<GoogleTaskList[]> {
    const response = await this.makeRequest<{ items: GoogleTaskList[] }>('/users/@me/lists');
    return response.items || [];
  }



  async getTasks(taskListId: string): Promise<GoogleTask[]> {
    let allTasks: GoogleTask[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;
    
    do {
      pageCount++;
      const params = new URLSearchParams({
        maxResults: '100', // Get maximum results per page
        showCompleted: 'true', // Include completed tasks
        showHidden: 'true' // Include hidden tasks
      });
      
      if (pageToken) {
        params.append('pageToken', pageToken);
      }
      
      const response = await this.makeRequest<{ 
        items: GoogleTask[], 
        nextPageToken?: string 
      }>(`/lists/${taskListId}/tasks?${params.toString()}`);
      
      if (response.items) {
        allTasks = allTasks.concat(response.items);
      }
      
      pageToken = response.nextPageToken;
    } while (pageToken);
    
    return allTasks;
  }

  async createTask(taskListId: string, task: Partial<GoogleTask>): Promise<GoogleTask> {
    return this.makeRequest<GoogleTask>(`/lists/${taskListId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(taskListId: string, taskId: string, updates: Partial<GoogleTask>): Promise<GoogleTask> {
    return this.makeRequest<GoogleTask>(`/lists/${taskListId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    await this.makeRequest(`/lists/${taskListId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async createTaskList(title: string): Promise<GoogleTaskList> {
    return this.makeRequest<GoogleTaskList>('/users/@me/lists', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async deleteTaskList(taskListId: string): Promise<void> {
    await this.makeRequest(`/users/@me/lists/${taskListId}`, {
      method: 'DELETE',
    });
  }

  async updateTaskList(taskListId: string, updates: Partial<GoogleTaskList>): Promise<GoogleTaskList> {
    return this.makeRequest<GoogleTaskList>(`/users/@me/lists/${taskListId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }
} 