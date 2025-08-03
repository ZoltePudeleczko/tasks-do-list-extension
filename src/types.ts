export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  parent?: string;
  position?: string;
  links?: Array<{
    type: string;
    description: string;
    link: string;
  }>;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}

export interface ExtensionSettings {
  showCompletedTasks: boolean; // New setting to remember completed tasks section state
  completedTasksLimit: number; // New setting to remember completed tasks limit
  sortBy: 'myOrder' | 'date' | 'title'; // New setting for task sorting
}



export interface GoogleTasksAPI {
  getTaskLists(): Promise<GoogleTaskList[]>;
  getTasks(taskListId: string): Promise<GoogleTask[]>;
  createTask(taskListId: string, task: Partial<GoogleTask>): Promise<GoogleTask>;
  updateTask(taskListId: string, taskId: string, updates: Partial<GoogleTask>): Promise<GoogleTask>;
  deleteTask(taskListId: string, taskId: string): Promise<void>;
  createTaskList(title: string): Promise<GoogleTaskList>;
  updateTaskList(taskListId: string, updates: Partial<GoogleTaskList>): Promise<GoogleTaskList>;
  deleteTaskList(taskListId: string): Promise<void>;
} 