export interface Task {
  id: number;
  order: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface CreateTaskRequest {
  title: string;
  order?: number;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface MoveTaskRequest {
  status: TaskStatus;
}

export interface CronStatus {
  status: 'active' | 'inactive';
  schedule: string;
  nextRun: string;
  lastReset: string;
  timezone: string;
}

export interface SecurityStatus {
  cors: {
    enabled: boolean;
    allowedOrigin: string;
    credentials: boolean;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    windowMinutes: number;
  };
  environment: string;
}

export interface ApiError {
  error: string;
  retryAfter?: number;
}
