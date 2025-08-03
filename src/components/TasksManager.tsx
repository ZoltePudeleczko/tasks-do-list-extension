import React, { useState, useEffect, useRef } from 'react';
import { TaskItem } from './TaskItem';
import { GoogleTask, GoogleTaskList, UserAccount, ExtensionSettings } from '../types';
import { AuthService } from '../services/authService';
import { GoogleTasksAPIService } from '../services/googleTasksAPI';
import { useTranslation } from '../i18n/TranslationContext';
import { LanguageSelector } from './LanguageSelector';
import { getExternalLinks } from '../config/environment';

// Utility function for generating the "ALL" accounts avatar
const getAllAccountsAvatar = () => {
  return (
    <img src="icons/group.png" alt="All accounts" className="account-avatar-img" />
  );
};

const DEFAULT_SETTINGS: ExtensionSettings = {
  showCompletedTasks: true,
  completedTasksLimit: 10,
  sortBy: 'myOrder'
};

// Toast utility functions
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

const showSuccessToast = (message: string) => showToast(message, 'success');
const showErrorToast = (message: string) => showToast(message, 'error');

// Slider Menu Component
const SliderMenu: React.FC<{
  accounts: UserAccount[];
  currentAccountId: string | 'ALL' | undefined;
  onAccountSelect: (accountId: string | 'ALL') => void;
  onAddAccount: () => void;
  onRemoveAccount: (accountId: string) => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}> = ({ accounts, currentAccountId, onAccountSelect, onAddAccount, onRemoveAccount, isOpen, onToggle }) => {
  const { t } = useTranslation();

  const getAccountInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="slider-overlay"
          onClick={() => onToggle(false)}
        />
      )}
      
      {/* Slider Menu */}
      <div 
        className={`slider-menu ${isOpen ? 'open' : ''}`}
      >
        {/* Header */}
        <div className="slider-header">
                  <div className="slider-header-content">
            <h3 className="slider-title">
              {t('accounts.title')}
            </h3>
            <button
              className="slider-close-btn"
              onClick={() => onToggle(false)}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Accounts List */}
        <div className="slider-accounts-list">
          {accounts.length > 1 && (
            <button
              className={`account-item ${currentAccountId === 'ALL' ? 'selected' : ''}`}
              onClick={() => {
                onAccountSelect('ALL');
                onToggle(false);
              }}
            >
              <div className="account-avatar-lg">
                <img src="icons/group.png" alt="All accounts" className="account-avatar-img" />
              </div>
              <div className="account-info-container">
                <div className="account-name-lg">
                  {t('accounts.allAccounts')}
                </div>
                <div className="account-email">
                  {t('accounts.accountsCount', { count: accounts.length })}
                </div>
              </div>
            </button>
          )}
          
          {accounts.map((account) => (
            <div key={account.id}>
              <button
                className={`account-item ${currentAccountId === account.id ? 'selected' : ''}`}
                onClick={() => {
                  onAccountSelect(account.id);
                  onToggle(false);
                }}
              >
                <div className="account-avatar-lg">
                  {account.picture ? (
                    <img 
                      src={account.picture} 
                      alt="" 
                      className="account-avatar-img"
                    />
                  ) : (
                    getAccountInitials(account.name)
                  )}
                </div>
                <div className="account-info-container">
                  <div className="account-name-lg">
                    {account.name}
                  </div>
                  <div className="account-email">
                    {account.email}
                  </div>
                </div>
                {accounts.length > 1 && (
                  <button
                    className="remove-account-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to remove the account "${account.name}"? This will remove all associated task lists and tasks from this extension.`)) {
                        onRemoveAccount(account.id);
                      }
                    }}
                    title={`Remove ${account.name}`}
                  >
                    ✕
                  </button>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Add Account Button */}
        <div className="add-account-section">
          <button
            className="add-account-btn"
            onClick={() => {
              onAddAccount();
              onToggle(false);
            }}
          >
            <div className="add-account-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            {t('accounts.addGoogleAccount')}
          </button>
        </div>
      </div>

      {/* Account Avatar Button */}
      <button
        className="slider-toggle-btn"
        onClick={() => onToggle(!isOpen)}
        title={t('accounts.toggleAccountsMenu')}
      >
        {currentAccountId === 'ALL' ? (
          <div className="account-avatar-sm">
            {getAllAccountsAvatar()}
          </div>
        ) : currentAccountId && accounts.length > 0 ? (
          (() => {
            const account = accounts.find(acc => acc.id === currentAccountId);
            return account ? (
              <div className="account-avatar-sm">
                {account.picture ? (
                  <img src={account.picture} alt="" className="account-avatar-img" />
                ) : (
                  getAccountInitials(account.name)
                )}
              </div>
            ) : (
              <div className="account-avatar-sm">
                {accounts[0].picture ? (
                  <img src={accounts[0].picture} alt="" className="account-avatar-img" />
                ) : (
                  getAccountInitials(accounts[0].name)
                )}
              </div>
            );
          })()
        ) : accounts.length > 0 ? (
          <div className="account-avatar-sm">
            {accounts[0].picture ? (
              <img src={accounts[0].picture} alt="" className="account-avatar-img" />
            ) : (
              getAccountInitials(accounts[0].name)
            )}
          </div>
        ) : (
          <div className="account-avatar-sm">
            <span className="account-avatar-placeholder">?</span>
          </div>
        )}
      </button>
    </>
  );
};

export const TasksManager: React.FC = () => {
  const { t } = useTranslation();
  
  const getAccountInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | 'ALL' | undefined>(undefined);
  const [taskLists, setTaskLists] = useState<{ [accountId: string]: GoogleTaskList[] }>({});
  const [currentTaskListId, setCurrentTaskListId] = useState<string>('');
  const [tasks, setTasks] = useState<{ [listId: string]: GoogleTask[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [showCompletedTasks, setShowCompletedTasks] = useState(settings.showCompletedTasks);
  const [completedTasksLimit, setCompletedTasksLimit] = useState(settings.completedTasksLimit);
  const [recentlyCompletedTasks, setRecentlyCompletedTasks] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const taskListPickerRef = useRef<HTMLDivElement>(null);
  const [showTaskListDropdown, setShowTaskListDropdown] = useState(false);
  const [showMainKebabMenu, setShowMainKebabMenu] = useState(false);
  const [showTaskListKebabMenu, setShowTaskListKebabMenu] = useState(false);
  const [showSortingDropdown, setShowSortingDropdown] = useState(false);
  const [hasLoadedSavedSelections, setHasLoadedSavedSelections] = useState(false);
  // Add state for slider menu
  const [showSliderMenu, setShowSliderMenu] = useState(false);

  const externalLinks = getExternalLinks();

  // Centralized dropdown management - close other dropdowns when one opens
  const closeAllDropdowns = () => {
    setShowTaskListDropdown(false);
    setShowMainKebabMenu(false);
    setShowTaskListKebabMenu(false);
    setShowSortingDropdown(false);
  };
  
  const openTaskListDropdown = () => {
    closeAllDropdowns();
    setShowTaskListDropdown(true);
  };

  const openMainKebabMenu = () => {
    closeAllDropdowns();
    setShowMainKebabMenu(true);
  };

  const openTaskListKebabMenu = () => {
    closeAllDropdowns();
    setShowTaskListKebabMenu(true);
  };

  const openSortingDropdown = () => {
    closeAllDropdowns();
    setShowSortingDropdown(true);
  };

  // Helper: get current account or all
  const currentAccount = currentAccountId && currentAccountId !== 'ALL'
    ? accounts.find(acc => acc.id === currentAccountId)
    : undefined;

  // On mount, load settings and accounts
  useEffect(() => {
    loadSettings();
    loadAccounts();
  }, []);

  // Update showCompletedTasks when settings change
  useEffect(() => {
    setShowCompletedTasks(settings.showCompletedTasks);
  }, [settings.showCompletedTasks]);

  // Update completedTasksLimit when settings change
  useEffect(() => {
    setCompletedTasksLimit(settings.completedTasksLimit);
  }, [settings.completedTasksLimit]);

  // When accounts change, load saved selections or set defaults
  useEffect(() => {
    if (accounts.length === 0) return;
    
    // Load saved selections first
    loadSavedSelections().then((savedSelections) => {
      setHasLoadedSavedSelections(true);
      
      // Only set defaults if no saved selections exist or are invalid
      if (!savedSelections.savedAccountId || 
          (savedSelections.savedAccountId !== 'ALL' && !accounts.some(acc => acc.id === savedSelections.savedAccountId))) {
        if (accounts.length > 1) {
          setCurrentAccountId('ALL');
          saveSelections('ALL');
        } else if (accounts.length === 1) {
          setCurrentAccountId(accounts[0].id);
          saveSelections(accounts[0].id);
        }
      }
    });
  }, [accounts.length]);

  // When currentAccountId changes, reset currentTaskListId to the first available list
  useEffect(() => {
    // Don't auto-switch task lists if we haven't loaded saved selections yet
    if (!hasLoadedSavedSelections) return;
    
    let lists: GoogleTaskList[] = [];
    if (currentAccountId === 'ALL') {
      lists = accounts.flatMap(acc => (taskLists[acc.id] || [])).filter(list => list && list.id);
    } else if (currentAccountId) {
      lists = (taskLists[currentAccountId] || []).filter(list => list && list.id);
    }
    
    // If we have a current task list and it still exists in the available lists, keep it
    if (currentTaskListId && lists.some(list => list && list.id === currentTaskListId)) {
      // Keep the current task list
      return;
    }
    
    // Otherwise, switch to the first available list
    if (lists.length > 0 && lists[0] && lists[0].id) {
      setCurrentTaskListId(lists[0].id);
      saveSelections(undefined, lists[0].id);
    } else {
      setCurrentTaskListId('');
      saveSelections(undefined, '');
    }
  }, [currentAccountId, taskLists, accounts, currentTaskListId, hasLoadedSavedSelections]);

  // Load task lists for all accounts or current account
  useEffect(() => {
    if (currentAccountId === 'ALL') {
      accounts.forEach(acc => loadTaskLists(acc));
    } else if (currentAccount) {
      loadTaskLists(currentAccount);
    }
  }, [currentAccountId, accounts]);

  // Validate saved task list after task lists are loaded
  useEffect(() => {
    // Only validate after we've loaded saved selections
    if (!hasLoadedSavedSelections || !currentTaskListId) return;
    
    const allLists = currentAccountId === 'ALL' 
      ? accounts.flatMap(acc => (taskLists[acc.id] || [])).filter(list => list && list.id)
      : currentAccount ? (taskLists[currentAccount.id] || []).filter(list => list && list.id) : [];
    
    // Check if the saved task list still exists
    const listExists = allLists.some(list => list.id === currentTaskListId);
    if (!listExists && allLists.length > 0) {
      // If the saved list doesn't exist, switch to the first available list
      setCurrentTaskListId(allLists[0].id);
      saveSelections(undefined, allLists[0].id);
    }
  }, [taskLists, currentAccountId, accounts, currentTaskListId, hasLoadedSavedSelections]);

  // Load tasks for selected list
  useEffect(() => {
    if (currentTaskListId) {
      loadTasks(currentTaskListId);
      setRecentlyCompletedTasks(new Set()); // Clear recently completed tasks when switching lists
      setEditingTaskId(null); // Exit edit mode when switching lists
    }
  }, [currentTaskListId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Close task list dropdown when clicking outside
      if (taskListPickerRef.current && !taskListPickerRef.current.contains(e.target as Node)) {
        setShowTaskListDropdown(false);
      }
    }
    
    // Add event listener if any dropdown is open
    if (showTaskListDropdown || showMainKebabMenu || showTaskListKebabMenu || showSortingDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTaskListDropdown, showMainKebabMenu, showTaskListKebabMenu, showSortingDropdown]);

  const loadSettings = async () => {
    try {
      const stored = await chrome.storage.sync.get('settings') as { settings?: ExtensionSettings };
      if (stored.settings) {
        // Merge with default settings to ensure new properties are present
        setSettings({ ...DEFAULT_SETTINGS, ...stored.settings });
      } else {
        // Use default settings if none stored
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      // Use default settings on error
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const loadAccounts = async () => {
    try {
      const stored = await chrome.storage.sync.get('accounts') as { accounts?: UserAccount[] };
      const storedAccounts: UserAccount[] = stored.accounts || [];
      setAccounts(storedAccounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const saveAccounts = async (newAccounts: UserAccount[]) => {
    try {
      await chrome.storage.sync.set({ accounts: newAccounts });
      setAccounts(newAccounts);
    } catch (err) {
      console.error('Failed to save accounts:', err);
    }
  };

  const saveSettings = async (newSettings: ExtensionSettings) => {
    try {
      await chrome.storage.sync.set({ settings: newSettings });
      setSettings(newSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const loadSavedSelections = async () => {
    try {
      const stored = await chrome.storage.sync.get(['savedAccountId', 'savedTaskListId']) as {
        savedAccountId?: string | 'ALL';
        savedTaskListId?: string;
      };
      

      
      // Apply saved account if it exists and is valid
      if (stored.savedAccountId) {
        if (stored.savedAccountId === 'ALL' || accounts.some(acc => acc.id === stored.savedAccountId)) {
          setCurrentAccountId(stored.savedAccountId);

        } else {

        }
      }
      
      // Apply saved task list if it exists
      if (stored.savedTaskListId) {
        setCurrentTaskListId(stored.savedTaskListId);

      }
      
      return stored;
    } catch (err) {
      console.error('Failed to load saved selections:', err);
      return { savedAccountId: undefined, savedTaskListId: undefined };
    }
  };

  const saveSelections = async (accountId?: string | 'ALL', taskListId?: string) => {
    try {
      const data: { savedAccountId?: string | 'ALL'; savedTaskListId?: string } = {};
      if (accountId !== undefined) {
        data.savedAccountId = accountId;
      }
      if (taskListId !== undefined) {
        data.savedTaskListId = taskListId;
      }
      await chrome.storage.sync.set(data);

    } catch (err) {
      console.error('Failed to save selections:', err);
    }
  };

  // Debounced save function to avoid too many storage writes
  const debouncedSaveSettings = useRef<NodeJS.Timeout>();
  const saveSettingsDebounced = (newSettings: ExtensionSettings) => {
    if (debouncedSaveSettings.current) {
      clearTimeout(debouncedSaveSettings.current);
    }
    debouncedSaveSettings.current = setTimeout(() => {
      saveSettings(newSettings);
    }, 300);
  };

  // Load task lists for a given account
  const loadTaskLists = async (account: UserAccount) => {
    setLoading(true);
    setError(undefined);
    try {
      const api = new GoogleTasksAPIService(account);
      const lists = await api.getTaskLists();
      setTaskLists(prev => ({ ...prev, [account.id]: lists }));
      // Set default task list if not set
      if (!currentTaskListId && lists.length > 0) {
        setCurrentTaskListId(lists[0].id);
      }
    } catch (err: any) {
      if (err.requiresReauth) {
        // Handle re-authentication
        showErrorToast('Authentication expired. Re-authenticating...');
        try {
          // Remove the old account and re-authenticate
          await removeAccount(account.id);
          const newAccount = await AuthService.authenticateAccount();
          
          // Check if it's the same account (same email)
          if (newAccount.email === account.email) {
            // Update the account in the list
            const updatedAccounts = accounts.map(acc => 
              acc.id === account.id ? newAccount : acc
            );
            await saveAccounts(updatedAccounts);
            
            // Retry loading task lists with the new account
            const newApi = new GoogleTasksAPIService(newAccount);
            const lists = await newApi.getTaskLists();
            setTaskLists(prev => ({ ...prev, [newAccount.id]: lists }));
            
            showSuccessToast('Successfully re-authenticated!');
          } else {
            // Different account, add it as a new account
            const updatedAccounts = [...accounts.filter(acc => acc.id !== account.id), newAccount];
            await saveAccounts(updatedAccounts);
            showSuccessToast(`Re-authenticated as ${newAccount.name}`);
          }
        } catch (reauthErr) {
          if (reauthErr instanceof Error && reauthErr.message.includes('cancelled')) {
            // User cancelled re-authentication
            showErrorToast('Re-authentication was cancelled');
          } else {
            showErrorToast('Failed to re-authenticate. Please try again.');
            console.error('Re-authentication failed:', reauthErr);
          }
        }
      } else {
        showErrorToast(t('toasts.failedToLoadTaskLists'));
        console.error('Failed to load task lists:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load tasks for a given list (listId is unique across all accounts)
  const loadTasks = async (taskListId: string) => {
    const account = accounts.find(acc => (taskLists[acc.id] || []).some(list => list.id === taskListId));
    if (!account) return;
    
    try {
      setLoading(true);
      const api = new GoogleTasksAPIService(account);
      const tasksData = await api.getTasks(taskListId);
      

      
      setTasks(prev => ({
        ...prev,
        [taskListId]: tasksData
      }));
    } catch (err: any) {
      if (err.requiresReauth) {
        // Handle re-authentication
        showErrorToast('Authentication expired. Re-authenticating...');
        try {
          // Remove the old account and re-authenticate
          await removeAccount(account.id);
          const newAccount = await AuthService.authenticateAccount();
          
          // Check if it's the same account (same email)
          if (newAccount.email === account.email) {
            // Update the account in the list
            const updatedAccounts = accounts.map(acc => 
              acc.id === account.id ? newAccount : acc
            );
            await saveAccounts(updatedAccounts);
            
            // Retry loading tasks with the new account
            const newApi = new GoogleTasksAPIService(newAccount);
            const tasksData = await newApi.getTasks(taskListId);
            setTasks(prev => ({
              ...prev,
              [taskListId]: tasksData
            }));
            
            showSuccessToast('Successfully re-authenticated!');
          } else {
            // Different account, add it as a new account
            const updatedAccounts = [...accounts.filter(acc => acc.id !== account.id), newAccount];
            await saveAccounts(updatedAccounts);
            showSuccessToast(`Re-authenticated as ${newAccount.name}`);
          }
        } catch (reauthErr) {
          if (reauthErr instanceof Error && reauthErr.message.includes('cancelled')) {
            // User cancelled re-authentication
            showErrorToast('Re-authentication was cancelled');
          } else {
            showErrorToast('Failed to re-authenticate. Please try again.');
            console.error('Re-authentication failed:', reauthErr);
          }
        }
      } else {
        console.error('Failed to load tasks:', err);
        setError(t('toasts.failedToLoadTasks'));
      }
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async () => {
    try {
      const newAccount = await AuthService.authenticateAccount();
      
      // Check if account already exists
      const existingAccount = accounts.find(acc => acc.email === newAccount.email);
      if (existingAccount) {
        showErrorToast(t('accounts.accountAlreadyConnected'));
        return;
      }
      
      const updatedAccounts = [...accounts, newAccount];
      await saveAccounts(updatedAccounts);
      
      // Always switch to the newly added account
      setCurrentAccountId(newAccount.id);
      saveSelections(newAccount.id);
      
      showSuccessToast(t('accounts.accountAddedSuccess', { name: newAccount.name }));
    } catch (err) {
      if (err instanceof Error && err.message.includes('cancelled')) {
        // User cancelled the authentication, don't show error
        return;
      }
      
      // Handle specific permission errors
      if (err instanceof Error) {
        if (err.message.includes('Google Tasks API access denied')) {
          showErrorToast(t('accounts.permissionDenied'));
        } else if (err.message.includes('Authentication failed')) {
          showErrorToast(t('accounts.authenticationFailed'));
        } else if (err.message.includes('Google Tasks API error')) {
          showErrorToast(t('accounts.failedToVerifyAccess'));
        } else {
          showErrorToast(t('accounts.failedToAddAccount'));
        }
      } else {
        showErrorToast(t('accounts.failedToAddAccount'));
      }
      console.error('Failed to add account:', err);
    }
  };

  const removeAccount = async (accountId: string) => {
    try {
      const accountToRemove = accounts.find(acc => acc.id === accountId);
      await AuthService.removeAccount(accountId);
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      await saveAccounts(updatedAccounts);
      
      if (currentAccountId === accountId) {
        const newAccountId = updatedAccounts.length > 0 ? updatedAccounts[0].id : undefined;
        setCurrentAccountId(newAccountId);
        saveSelections(newAccountId);
      }
      
      if (accountToRemove) {
        showSuccessToast(t('accounts.accountRemovedSuccess', { name: accountToRemove.name }));
      }
    } catch (err) {
      showErrorToast(t('accounts.failedToRemoveAccount'));
      console.error('Failed to remove account:', err);
    }
  };

  const addTask = async () => {
    if (!currentTaskListId) return;
    // Find which account this list belongs to
    const account = accounts.find(acc => (taskLists[acc.id] || []).some(list => list.id === currentTaskListId));
    if (!account) return;
    try {
      const api = new GoogleTasksAPIService(account);
      const newTask = await api.createTask(currentTaskListId, {
        title: t('tasks.newTask')
        // Don't set any due date by default to avoid timezone issues
      });

      setTasks(prev => ({
        ...prev,
        [currentTaskListId]: [newTask, ...(prev[currentTaskListId] || [])]
      }));
      // Start editing the new task immediately
      setEditingTaskId(newTask.id);
    } catch (err) {
      showErrorToast(t('toasts.failedToCreateTask'));
      console.error('Failed to add task:', err);
    }
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    if (!currentTaskListId) return;
    const account = accounts.find(acc => (taskLists[acc.id] || []).some(list => list.id === currentTaskListId));
    if (!account) return;
    
    // Get task info for success message
    const taskToUpdate = tasks[currentTaskListId]?.find(task => task.id === taskId);
    
    try {
      const api = new GoogleTasksAPIService(account);
      const updates: Partial<GoogleTask> = {
        status: completed ? 'completed' : 'needsAction',
        completed: completed ? new Date().toISOString() : undefined
      };
      await api.updateTask(currentTaskListId, taskId, updates);
      setTasks(prev => ({
        ...prev,
        [currentTaskListId]: prev[currentTaskListId].map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      }));
      
      // If completing a task, add it to recently completed set
      if (completed) {
        setRecentlyCompletedTasks(prev => new Set(prev).add(taskId));
      } else {
        // If uncompleting a task, remove it from recently completed set
        setRecentlyCompletedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
      
    } catch (err) {
      showErrorToast('Failed to update task. Please try again.');
      console.error('Failed to update task:', err);
    }
  };

  const editTask = async (taskId: string, updates: Partial<GoogleTask>, closeEditView: boolean = true) => {
    if (!currentTaskListId) return;
    const account = accounts.find(acc => (taskLists[acc.id] || []).some(list => list.id === currentTaskListId));
    if (!account) return;
    
    
    
    try {
      const api = new GoogleTasksAPIService(account);
      const updatedTask = await api.updateTask(currentTaskListId, taskId, updates);
      
      
      
      setTasks(prev => ({
        ...prev,
        [currentTaskListId]: prev[currentTaskListId].map(task =>
          task.id === taskId ? { 
            ...task, 
            ...updatedTask,
            // Ensure due date is properly cleared if we sent an empty string
            due: updates.due === '' ? undefined : updatedTask.due
          } : task
        )
      }));
      
      if (closeEditView) {
        setEditingTaskId(null);
      }
      
      return updatedTask;
    } catch (err) {
      showErrorToast('Failed to update task. Please try again.');
      console.error('Failed to update task:', err);
      throw err; // Re-throw to let TaskItem handle the error
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentTaskListId) return;
    const account = accounts.find(acc => (taskLists[acc.id] || []).some(list => list.id === currentTaskListId));
    if (!account) return;
    
    // Get task info before deleting for the success message
    const taskToDelete = tasks[currentTaskListId]?.find(task => task.id === taskId);
    
    try {
      const api = new GoogleTasksAPIService(account);
      await api.deleteTask(currentTaskListId, taskId);
      
      // Immediately remove the task from local state
      setTasks(prev => ({
        ...prev,
        [currentTaskListId]: prev[currentTaskListId].filter(task => task.id !== taskId)
      }));
      
      // Also remove from recently completed tasks if it was there
      setRecentlyCompletedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (err) {
      showErrorToast('Failed to delete task. Please try again.');
      console.error('Failed to delete task:', err);
    }
  };

  const handleLoadMoreCompleted = () => {
    const newLimit = completedTasksLimit + 10;
    setCompletedTasksLimit(newLimit);
    saveSettingsDebounced({ ...settings, completedTasksLimit: newLimit });
  };

  const handleRefreshTasks = async () => {
    if (currentTaskListId) {
      setRecentlyCompletedTasks(new Set()); // Clear recently completed tasks
      await loadTasks(currentTaskListId); // Reload tasks
    }
  };

  const handleRefreshTaskLists = async () => {
    if (currentAccount) {
      await loadTaskLists(currentAccount);
    } else if (currentAccountId === 'ALL') {
      // Refresh all accounts
      for (const account of accounts) {
        await loadTaskLists(account);
      }
    }
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      // Refresh task lists first
      if (currentAccount) {
        await loadTaskLists(currentAccount);
      } else if (currentAccountId === 'ALL') {
        // Refresh all accounts
        for (const account of accounts) {
          await loadTaskLists(account);
        }
      }
      
      // Then refresh tasks if we have a current task list
      if (currentTaskListId) {
        setRecentlyCompletedTasks(new Set()); // Clear recently completed tasks
        await loadTasks(currentTaskListId);
      }
    } catch (err) {
      showErrorToast('Failed to refresh. Please try again.');
      console.error('Failed to refresh:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToTop = async (taskId: string) => {
    if (!currentTaskListId) return;
    const account = accounts.find(acc => (taskLists[acc.id] || []).some(list => list.id === currentTaskListId));
    if (!account) return;
    
    // Get task info for success message
    const taskToMove = tasks[currentTaskListId]?.find(task => task.id === taskId);
    
    // Immediately update local state to move task to top
    setTasks(prev => {
      const currentTasks = prev[currentTaskListId] || [];
      const taskToMove = currentTasks.find(task => task.id === taskId);
      if (!taskToMove) return prev;
      
      // Remove the task from its current position and add it to the top
      const otherTasks = currentTasks.filter(task => task.id !== taskId);
      const updatedTasks = [taskToMove, ...otherTasks];
      
      return {
        ...prev,
        [currentTaskListId]: updatedTasks
      };
    });
    
          // Make API call in the background
      try {
        const api = new GoogleTasksAPIService(account);
        await api.updateTask(currentTaskListId, taskId, { position: '0' });
      } catch (err) {
      // If API call fails, revert the local state change
      showErrorToast('Failed to move task to top. Please try again.');
      console.error('Failed to move task to top:', err);
      
      // Reload tasks to get the correct order from server
      await loadTasks(currentTaskListId);
    }
  };

  const handleCreateTaskList = async () => {
    // Don't allow creating lists when in "ALL" mode
    if (currentAccountId === 'ALL') {
      showErrorToast('Cannot create new lists when viewing all accounts. Please select a specific account first.');
      return;
    }
    
    if (!currentAccount) {
      showErrorToast('No account selected for creating task list');
      return;
    }
    
    const listName = prompt('Enter task list name:');
    if (!listName || !listName.trim()) return;

    try {
      const api = new GoogleTasksAPIService(currentAccount);
      const newList = await api.createTaskList(listName.trim());
      
      // Update local state
      setTaskLists(prev => ({
        ...prev,
        [currentAccount.id]: [...(prev[currentAccount.id] || []), newList]
      }));
      
      // Switch to the new list
      setCurrentTaskListId(newList.id);
      saveSelections(undefined, newList.id);
      
      showSuccessToast(`Task list "${newList.title}" created successfully!`);
    } catch (err) {
      showErrorToast('Failed to create task list. Please try again.');
      console.error('Failed to create task list:', err);
    }
  };

  const handleDeleteTaskList = async () => {
    if (!currentTaskListId) return;
    
    const currentList = visibleTaskLists.find(list => list.id === currentTaskListId);
    if (!currentList) return;

    // Check if this is a default list that shouldn't be deleted
    if (isDefaultTaskList(currentList)) {
      showErrorToast('Cannot delete the default task list. This is the primary list for this account and cannot be removed.');
      return;
    }

    // Find the account that owns this task list
    let accountForList: UserAccount | undefined;
    if (currentAccountId === 'ALL') {
      accountForList = accounts.find(a => (taskLists[a.id] || []).some(l => l.id === currentTaskListId));
    } else {
      accountForList = currentAccount;
    }

    if (!accountForList) {
      showErrorToast('Could not determine account for this task list');
      return;
    }

    const confirmMessage = `Are you sure you want to delete the task list "${currentList.title}"? All tasks from this list will be removed as well.`;
    if (!confirm(confirmMessage)) return;

    try {
      const api = new GoogleTasksAPIService(accountForList);
      await api.deleteTaskList(currentTaskListId);
      
      // Remove from local state
      setTaskLists(prev => ({
        ...prev,
        [accountForList!.id]: (prev[accountForList!.id] || []).filter(list => list.id !== currentTaskListId)
      }));
      
      // Clear tasks for this list
      setTasks(prev => {
        const newTasks = { ...prev };
        delete newTasks[currentTaskListId];
        return newTasks;
      });
      
      // Switch to first available list
      const remainingLists = (taskLists[accountForList!.id] || []).filter(list => list.id !== currentTaskListId);
      if (remainingLists.length > 0) {
        setCurrentTaskListId(remainingLists[0].id);
      } else {
        setCurrentTaskListId('');
      }
      
      showSuccessToast(`Task list "${currentList.title}" deleted successfully!`);
    } catch (err: any) {
      console.error('Failed to delete task list:', err);
      
      // Handle specific error cases
      if (err.message && err.message.includes('404')) {
        // List doesn't exist on server - remove from local state and refresh
        showErrorToast('Task list not found on server. It may have been deleted elsewhere. Refreshing...');
        
        // Remove from local state
        setTaskLists(prev => ({
          ...prev,
          [accountForList!.id]: (prev[accountForList!.id] || []).filter(list => list.id !== currentTaskListId)
        }));
        
        // Clear tasks for this list
        setTasks(prev => {
          const newTasks = { ...prev };
          delete newTasks[currentTaskListId];
          return newTasks;
        });
        
        // Switch to first available list
        const remainingLists = (taskLists[accountForList!.id] || []).filter(list => list.id !== currentTaskListId);
        if (remainingLists.length > 0) {
          setCurrentTaskListId(remainingLists[0].id);
        } else {
          setCurrentTaskListId('');
        }
        
        // Refresh task lists from server
        setTimeout(() => {
          loadTaskLists(accountForList!);
        }, 1000);
      } else {
        showErrorToast('Failed to delete task list. Please try again.');
      }
    }
  };

  const sortTasks = (tasks: GoogleTask[]): GoogleTask[] => {
    switch (settings.sortBy) {
      case 'myOrder':
        // Keep original order (position-based)
        return tasks;
      case 'date':
        // Sort by due date, tasks without due date go to the end
        return [...tasks].sort((a, b) => {
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return new Date(a.due).getTime() - new Date(b.due).getTime();
        });
      case 'title':
        // Sort alphabetically by title
        return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return tasks;
    }
  };

  // Group tasks by date for date sorting
  const groupTasksByDate = (tasks: GoogleTask[]) => {
    const groups: { [key: string]: GoogleTask[] } = {};
    
    // Helper function to format date
    const formatDateForGroup = (dueDate: string) => {
      const date = new Date(dueDate);
      const today = new Date();
      const nextYear = new Date(today.getFullYear() + 1, 0, 1); // January 1st of next year
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      // If the date is in the next year, include the year
      if (date >= nextYear) {
        return `${day}.${month}.${year}`;
      } else {
        return `${day}.${month}`;
      }
    };
    
    tasks.forEach(task => {
      let groupKey: string;
      let groupLabel: string;
      
      if (!task.due) {
        groupKey = 'no-date';
        groupLabel = t('dateGroups.noDate');
      } else {
        const dueDate = new Date(task.due);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Reset time for comparison
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        
        if (dueDateOnly.getTime() === todayOnly.getTime()) {
          groupKey = 'today';
          groupLabel = t('dateGroups.today');
        } else if (dueDateOnly.getTime() === tomorrowOnly.getTime()) {
          groupKey = 'tomorrow';
          groupLabel = t('dateGroups.tomorrow');
        } else if (dueDateOnly < todayOnly) {
          groupKey = 'overdue';
          groupLabel = t('dateGroups.overdue');
        } else {
          // Format as dd.MM or dd.MM.YYYY for specific dates
          const today = new Date();
          const nextYear = new Date(today.getFullYear() + 1, 0, 1); // January 1st of next year
          
          const day = String(dueDate.getDate()).padStart(2, '0');
          const month = String(dueDate.getMonth() + 1).padStart(2, '0');
          const year = dueDate.getFullYear();
          
          groupKey = dueDate.toISOString().split('T')[0]; // Use date as key for sorting
          
          // If the date is in the next year, include the year
          if (dueDate >= nextYear) {
            groupLabel = `${day}.${month}.${year}`;
          } else {
            groupLabel = `${day}.${month}`;
          }
        }
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    // Convert to array and sort by date
    const groupOrder = ['overdue', 'today', 'tomorrow'];
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      if (groupOrder.includes(a) && groupOrder.includes(b)) {
        return groupOrder.indexOf(a) - groupOrder.indexOf(b);
      }
      if (groupOrder.includes(a)) return -1;
      if (groupOrder.includes(b)) return 1;
      if (a === 'no-date') return 1;
      if (b === 'no-date') return -1;
      return a.localeCompare(b); // Sort dates chronologically
    });
    
    return sortedGroups.map(([key, tasks]) => ({
      key,
      label: key === 'overdue' ? t('dateGroups.overdue') : 
              key === 'today' ? t('dateGroups.today') : 
              key === 'tomorrow' ? t('dateGroups.tomorrow') : 
              key === 'no-date' ? t('dateGroups.noDate') : 
              groups[key][0] ? formatDateForGroup(groups[key][0].due!) : '',
      tasks
    }));
  };

  const handleRenameTaskList = async () => {
    if (!currentTaskListId) return;
    
    const currentList = visibleTaskLists.find(list => list.id === currentTaskListId);
    if (!currentList) return;

    // Find the account that owns this task list
    let accountForList: UserAccount | undefined;
    if (currentAccountId === 'ALL') {
      accountForList = accounts.find(a => (taskLists[a.id] || []).some(l => l.id === currentTaskListId));
    } else {
      accountForList = currentAccount;
    }

    if (!accountForList) {
      showErrorToast('Could not determine account for this task list');
      return;
    }

    const newName = prompt('Enter new task list name:', currentList.title);
    if (!newName || !newName.trim() || newName.trim() === currentList.title) return;

    try {
      const api = new GoogleTasksAPIService(accountForList);
      const updatedList = await api.updateTaskList(currentTaskListId, { title: newName.trim() });
      
      // Update local state
      setTaskLists(prev => ({
        ...prev,
        [accountForList!.id]: (prev[accountForList!.id] || []).map(list => 
          list.id === currentTaskListId ? updatedList : list
        )
      }));
      
      showSuccessToast(`Task list renamed to "${updatedList.title}" successfully!`);
    } catch (err) {
      showErrorToast('Failed to rename task list. Please try again.');
      console.error('Failed to rename task list:', err);
    }
  };



  // Helper function to check if a task list is a default/system list
  const isDefaultTaskList = (taskList: GoogleTaskList): boolean => {
    if (!taskList || !taskList.id) return false;
    
    // Find which account owns this task list
    const accountForList = accounts.find(a => (taskLists[a.id] || []).some(l => l && l.id === taskList.id));
    if (!accountForList) return false;
    
    // Get all lists for this account
    const accountLists = (taskLists[accountForList.id] || []).filter(list => list && list.id);
    if (accountLists.length === 0) return false;
    
    // The default list is always the first one returned by the API
    return accountLists[0] && accountLists[0].id === taskList.id;
  };

  // Helper: get all task lists for current view
  const visibleTaskLists = currentAccountId === 'ALL'
    ? accounts.flatMap(acc => (taskLists[acc.id] || [])).filter(list => list && list.id)
    : currentAccount ? (taskLists[currentAccount.id] || []).filter(list => list && list.id) : [];

  // Helper: get tasks for current list
  const currentTasks = tasks[currentTaskListId] || [];

  // Helper: get incomplete and completed tasks
  const incompleteTasks = sortTasks(currentTasks.filter(task => 
    task.status === 'needsAction' || recentlyCompletedTasks.has(task.id)
  ));
  const completedTasks = currentTasks.filter(task => 
    task.status === 'completed' && !recentlyCompletedTasks.has(task.id)
  ).sort((a, b) => {
    // Sort by completion date, most recent first
    if (!a.completed && !b.completed) return 0;
    if (!a.completed) return 1;
    if (!b.completed) return -1;
    return new Date(b.completed).getTime() - new Date(a.completed).getTime();
  });



  const completedTasksCount = completedTasks.length;
  const displayedCompletedTasks = completedTasks.slice(0, completedTasksLimit);
  const hasMoreCompletedTasks = completedTasksCount > completedTasksLimit;

  const handleLogoClick = () => {
    window.open(externalLinks.GITHUB.BASE, '_blank');
  };

  const handleRateExtension = () => {
    window.open(externalLinks.CHROME_WEB_STORE.REVIEWS, '_blank');
  };

  const handleReportIssue = () => {
    window.open(externalLinks.GITHUB.ISSUES, '_blank');
  };

  const handleBuyMeACoffee = () => {
    window.open(externalLinks.BUY_ME_A_COFFEE.BASE, '_blank');
  };



  if (accounts.length === 0) {
    return (
      <div className="app">
        <SliderMenu
          accounts={accounts}
          currentAccountId={currentAccountId}
          onAccountSelect={(accountId) => {
            setCurrentAccountId(accountId);
            saveSelections(accountId);
          }}
          onAddAccount={addAccount}
          onRemoveAccount={removeAccount}
          isOpen={showSliderMenu}
          onToggle={setShowSliderMenu}
        />
        <div className="header">
          <div className="header-top">
            <div className="header-left">
              <button
                onClick={handleLogoClick}
                className="extension-brand-btn"
              >
                <div className="extension-icon">📋</div>
                <h1 className="header-title">
                  <span className="title-tasks">Tasks</span>-Do-List
                </h1>
              </button>
            </div>
            <div className="header-controls-container">
              <button
                onClick={() => {}}
                className="refresh-tasks-btn"
                title={t('actions.refreshTasks')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
                          <KebabMenu 
              onAddAccount={addAccount} 
              onRefresh={() => {}} 
              onRemoveAccount={currentAccount ? removeAccount : undefined}
              currentAccount={currentAccount}
              hasRecentlyCompleted={false}
              onRateExtension={handleRateExtension}
              onReportIssue={handleReportIssue}
              onBuyMeACoffee={handleBuyMeACoffee}
              onOpen={openMainKebabMenu}
              open={showMainKebabMenu}
              onToggle={setShowMainKebabMenu}
            />
            </div>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">{t('emptyStates.noAccountsConnected')}</div>
          <div className="empty-state-message">
            {t('emptyStates.noAccountsMessage')}
          </div>
          <button onClick={addAccount} className="btn btn-primary">
            {t('accounts.addGoogleAccount')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <SliderMenu
        accounts={accounts}
        currentAccountId={currentAccountId}
        onAccountSelect={(accountId) => {
          setCurrentAccountId(accountId);
          saveSelections(accountId);
        }}
        onAddAccount={addAccount}
        onRemoveAccount={removeAccount}
        isOpen={showSliderMenu}
        onToggle={setShowSliderMenu}
      />
      <div className="header">
        <div className="header-top">
          <div className="header-left">
                                                      <button
                onClick={handleLogoClick}
                className="extension-brand-btn extension-brand-btn-styled"
              >
              <div className="extension-icon">
                <img src="icons/icon128.png" alt="Tasks-Do-List" className="extension-icon-img" />
              </div>
                              <h1 className="header-title header-title-no-select">
                <span className="title-tasks">Tasks</span>-Do-List
              </h1>
            </button>
          </div>
          <div className="header-controls-styled">
            <LanguageSelector className="header-language-selector" />
            <button
              onClick={handleRefreshAll}
              className="refresh-tasks-btn refresh-tasks-btn-styled"
              title={t('actions.refreshTasksAndLists')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
            </button>
            <KebabMenu 
              onAddAccount={addAccount} 
              onRefresh={handleRefreshAll} 
              onRemoveAccount={currentAccount ? removeAccount : undefined}
              currentAccount={currentAccount}
              hasRecentlyCompleted={false}
              onRateExtension={handleRateExtension}
              onReportIssue={handleReportIssue}
              onBuyMeACoffee={handleBuyMeACoffee}
              onOpen={openMainKebabMenu}
              open={showMainKebabMenu}
              onToggle={setShowMainKebabMenu}
            />
          </div>
        </div>
      </div>

      <div className="content">
        {error && (
          <div className="error">
            {error}
            <button onClick={() => setError(undefined)} className="error-close-btn">
              ×
            </button>
          </div>
        )}

        <div className="task-list-selector no-border task-list-selector-container">
          <div
            className="task-list-picker"
            ref={taskListPickerRef}
            onClick={() => showTaskListDropdown ? setShowTaskListDropdown(false) : openTaskListDropdown()}

          >
            <div className="task-list-picker-content">
              {currentAccountId === 'ALL' && (() => {
                const currentList = visibleTaskLists.find(list => list.id === currentTaskListId);
                if (!currentList) return null;
                const account = accounts.find(a => (taskLists[a.id] || []).some(l => l.id === currentList.id));
                if (!account) return null;
                
                return (
                  <div className="account-avatar-sm">
                    {account.picture ? (
                      <img src={account.picture} alt="" className="account-avatar-img" />
                    ) : (
                      getAccountInitials(account.name)
                    )}
                  </div>
                );
              })()}
              <div className="task-list-label">
                {(() => {
                  const currentList = visibleTaskLists.find(list => list.id === currentTaskListId);
                  if (!currentList) return t('tasks.loadingTaskLists');
                  
                  let label = currentList.title;
                  return label;
                })()}
              </div>
              <span className="task-list-dropdown-arrow">
                {showTaskListDropdown ? '▲' : '▼'}
              </span>
            </div>
            {showTaskListDropdown && (
              <div className="task-list-dropdown">
                {visibleTaskLists.map(list => {
                  const account = currentAccountId === 'ALL' 
                    ? accounts.find(a => (taskLists[a.id] || []).some(l => l.id === list.id))
                    : currentAccount;
                  
                  let label = list.title;
                  
                  return (
                    <button
                      key={list.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTaskListId(list.id);
                        saveSelections(undefined, list.id);
                        setShowTaskListDropdown(false);
                      }}
                      className="task-list-dropdown-item"
                    >
                      {currentAccountId === 'ALL' && account && (
                        <div className="account-avatar-sm">
                          {account.picture ? (
                            <img src={account.picture} alt="" className="account-avatar-img" />
                          ) : (
                            getAccountInitials(account.name)
                          )}
                        </div>
                      )}
                      <div className="task-list-dropdown-label">
                        {label}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <SortingDropdown
            sortBy={settings.sortBy}
            onSortChange={(sortBy) => saveSettingsDebounced({ ...settings, sortBy })}
            onOpen={openSortingDropdown}
            open={showSortingDropdown}
            onToggle={setShowSortingDropdown}
          />
          <TaskListKebabMenu
            onCreateList={handleCreateTaskList}
            onRenameList={handleRenameTaskList}
            onDeleteList={handleDeleteTaskList}
            canDelete={!!(currentTaskListId && !isDefaultTaskList(visibleTaskLists.find(list => list.id === currentTaskListId)!))}
            isDefaultList={!!(currentTaskListId && isDefaultTaskList(visibleTaskLists.find(list => list.id === currentTaskListId)!))}
            canCreate={currentAccountId !== 'ALL'}
            onOpen={openTaskListKebabMenu}
            open={showTaskListKebabMenu}
            onToggle={setShowTaskListKebabMenu}
          />
        </div>

        {/* Add Task Button */}
        <div className="add-task-container">
          <button
            onClick={addTask}
            className="add-task-button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t('tasks.addTask')}
          </button>
        </div>

        <div className="tasks-container">
          {loading ? (
            <div className="loading">{t('tasks.loadingTasks')}</div>
          ) : currentTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">{t('emptyStates.noTasksYet')}</div>
              <div className="empty-state-message">
                {t('emptyStates.noTasksMessage')}
              </div>
            </div>
          ) : (
            <div className="tasks-sections">
              {/* Incomplete Tasks Section */}
              {incompleteTasks.length > 0 && (
                <div className="tasks-section">
                  {settings.sortBy === 'date' ? (
                    // Render grouped tasks for date sorting
                    groupTasksByDate(incompleteTasks).map((group) => (
                      <div key={group.key} className="task-group" data-group-key={group.key}>
                        <div className="task-group-header">
                          <span className="task-group-label">{group.label}</span>
                        </div>
                        <ul className="tasks-list">
                          {group.tasks.map((task, index) => (
                            <li key={task.id}>
                              <TaskItem
                                key={task.id}
                                task={task}
                                onToggleComplete={toggleTaskComplete}
                                onEdit={editTask}
                                onDelete={deleteTask}
                                onMoveToTop={handleMoveToTop}
                                isRecentlyCompleted={recentlyCompletedTasks.has(task.id)}
                                isEditing={editingTaskId === task.id}
                                onStartEdit={() => setEditingTaskId(task.id)}
                                onCancelEdit={() => setEditingTaskId(null)}
                                isFirstTask={index === 0}
                                sortBy={settings.sortBy}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    // Render flat list for other sort options
                    <ul className="tasks-list">
                      {incompleteTasks.map((task, index) => (
                        <li key={task.id}>
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggleComplete={toggleTaskComplete}
                            onEdit={editTask}
                            onDelete={deleteTask}
                            onMoveToTop={handleMoveToTop}
                            isRecentlyCompleted={recentlyCompletedTasks.has(task.id)}
                            isEditing={editingTaskId === task.id}
                            onStartEdit={() => setEditingTaskId(task.id)}
                            onCancelEdit={() => setEditingTaskId(null)}
                            isFirstTask={index === 0}
                            sortBy={settings.sortBy}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Completed Tasks Section */}
              {completedTasksCount > 0 && (
                <div className="tasks-section completed-section">
                  <div 
                    className="completed-header"
                    onClick={() => {
                      const newShowCompleted = !showCompletedTasks;
                      setShowCompletedTasks(newShowCompleted);
                      saveSettingsDebounced({ ...settings, showCompletedTasks: newShowCompleted });
                    }}
                  >
                    <span className="completed-toggle">
                      {showCompletedTasks ? '▼' : '▶'}
                    </span>
                    <span className="completed-title">
                      {t('tasks.completedCount', { count: completedTasksCount })}
                    </span>
                  </div>
                  {showCompletedTasks && (
                    <ul className="tasks-list completed-tasks">
                      {displayedCompletedTasks.map(task => (
                        <li key={task.id}>
                          <TaskItem
                            task={task}
                            onToggleComplete={toggleTaskComplete}
                            onEdit={editTask}
                            onDelete={deleteTask}
                            onCancelEdit={() => setEditingTaskId(null)}
                          />
                        </li>
                      ))}
                      {hasMoreCompletedTasks && (
                        <li className="load-more-completed-tasks">
                          <button 
                            className="load-more-btn"
                            onClick={handleLoadMoreCompleted}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9v-9m0-9v9"/>
                            </svg>
                            {t('tasks.loadMore')}
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}; 

const SortingDropdown: React.FC<{
  sortBy: 'myOrder' | 'date' | 'title';
  onSortChange: (sortBy: 'myOrder' | 'date' | 'title') => void;
  onOpen?: () => void;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}> = ({ sortBy, onSortChange, onOpen, open: externalOpen, onToggle }) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  const sortOptions = [
    { value: 'myOrder', label: 'My order' },
    { value: 'date', label: 'Date' },
    { value: 'title', label: 'Title' }
  ] as const;

  return (
    <div className="sorting-dropdown-container">
      <button
        aria-label={t('sorting.sortingOptions')}
        onClick={(e) => {
          e.stopPropagation();
          if (!open && onOpen) {
            onOpen();
          }
          setOpen(!open);
        }}
        className="sorting-dropdown-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"/>
          <path d="M6 12h12"/>
          <path d="M9 18h6"/>
        </svg>
      </button>
      {open && (
        <div className="sorting-dropdown-menu">
          {/* Sort Options */}
          <div className="sorting-dropdown-header">
            <div className="sorting-dropdown-title">{t('sorting.sortBy')}</div>
            <div className="sorting-dropdown-options">
              <button
                onClick={() => {
                  onSortChange('myOrder');
                  setOpen(false);
                }}
                className={`sorting-dropdown-option ${sortBy === 'myOrder' ? 'selected' : ''}`}
              >
                {t('sorting.myOrder')}
              </button>
              <button
                onClick={() => {
                  onSortChange('date');
                  setOpen(false);
                }}
                className={`sorting-dropdown-option ${sortBy === 'date' ? 'selected' : ''}`}
              >
                {t('sorting.dueDate')}
              </button>
              <button
                onClick={() => {
                  onSortChange('title');
                  setOpen(false);
                }}
                className={`sorting-dropdown-option ${sortBy === 'title' ? 'selected' : ''}`}
              >
                {t('sorting.title')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskListKebabMenu: React.FC<{
  onCreateList: () => void;
  onRenameList: () => void;
  onDeleteList?: () => void;
  canDelete?: boolean;
  isDefaultList?: boolean;
  canCreate?: boolean;
  onOpen?: () => void;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}> = ({ onCreateList, onRenameList, onDeleteList, canDelete = false, isDefaultList = false, canCreate = true, onOpen, open: externalOpen, onToggle }) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="kebab-menu-container-relative">
      <button
        aria-label={t('taskLists.createNewList')}
        onClick={(e) => {
          e.stopPropagation();
          if (!open && onOpen) {
            onOpen();
          }
          setOpen(!open);
        }}
        className="kebab-menu-btn-complete"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div className="kebab-menu-dropdown improved-kebab kebab-menu-dropdown-positioned">
          {!canCreate ? (
            <button
              className="kebab-menu-item kebab-menu-item-disabled"
              disabled
              title={t('menu.cannotCreateInAllMode')}
            >
              <span className="kebab-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </span>
              {t('menu.createNewList')}
            </button>
          ) : (
            <button
              className="kebab-menu-item"
              onClick={() => {
                setOpen(false);
                onCreateList();
              }}
            >
              <span className="kebab-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </span>
              {t('menu.createNewList')}
            </button>
          )}
          <button
            className="kebab-menu-item"
            onClick={() => {
              setOpen(false);
              onRenameList();
            }}
          >
            <span className="kebab-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </span>
            {t('menu.renameList')}
          </button>
          {isDefaultList ? (
            <button
              className="kebab-menu-item kebab-menu-item-disabled"
              disabled
              title={t('menu.defaultListCannotBeDeleted')}
            >
              <span className="kebab-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </span>
              {t('menu.deleteList')}
            </button>
          ) : canDelete && onDeleteList ? (
            <button
              className="kebab-menu-item kebab-menu-item-danger"
              onClick={() => {
                setOpen(false);
                onDeleteList();
              }}
            >
              <span className="kebab-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </span>
              {t('menu.deleteList')}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

const KebabMenu: React.FC<{ 
  onAddAccount: () => void; 
  onRefresh: () => void; 
  onRemoveAccount?: (accountId: string) => void;
  currentAccount?: UserAccount;
  hasRecentlyCompleted?: boolean;
  onRateExtension?: () => void;
  onReportIssue?: () => void;
  onBuyMeACoffee?: () => void;
  onOpen?: () => void;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}> = ({ onAddAccount, onRefresh, onRemoveAccount, currentAccount, hasRecentlyCompleted = false, onRateExtension, onReportIssue, onBuyMeACoffee, onOpen, open: externalOpen, onToggle }) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="kebab-menu-container">
      <button
        aria-label={t('menu.createNewList')}
        className="kebab-menu-btn kebab-menu-btn-styled"
        onClick={(e) => {
          e.stopPropagation();
          if (!open && onOpen) {
            onOpen();
          }
          setOpen(!open);
        }}
      >
        {/* SVG 3-dots vertical icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      {open && (
        <div className="kebab-menu-dropdown improved-kebab">
          <button
            className="kebab-menu-item"
            onClick={() => {
              setOpen(false);
              onRateExtension?.();
            }}
          >
            <span className="kebab-menu-icon">
              {/* Star icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </span>
            {t('menu.rateExtension')}
          </button>
          <button
            className="kebab-menu-item"
            onClick={() => {
              setOpen(false);
              onReportIssue?.();
            }}
          >
            <span className="kebab-menu-icon">
              {/* Bug/Issue icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            {t('menu.reportIssue')}
          </button>
          <button
            className="kebab-menu-item"
            onClick={() => {
              setOpen(false);
              onBuyMeACoffee?.();
            }}
          >
            <span className="kebab-menu-icon">
              {/* Coffee icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v7a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            </span>
            {t('menu.buyMeACoffee')}
          </button>
        </div>
      )}
    </div>
  );
}; 