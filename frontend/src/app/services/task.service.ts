import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, from, of, switchMap, map } from 'rxjs';
import { Task } from '../models/task.interface';
import { ToastService } from './toast.service';
import { ErrorHandlerService } from './error-handler.service';
import { PWAService } from './pwa.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService,
    private pwaService: PWAService
  ) { }

  getTasks(): Observable<Task[]> {
    // Check if online first
    return this.pwaService.online$.pipe(
      switchMap(isOnline => {
        if (isOnline) {
          // If online, fetch from API
          const httpParams = new HttpParams()
            .set('sortBy', 'order')
            .set('sortDirection', 'asc')
            .set('priority', 'low').append('priority', 'medium').append('priority', 'high')
            .set('filterString', '');

          return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params: httpParams }).pipe(
            tap(tasks => {
              // Cache tasks for offline use
              this.pwaService.cacheTasksForOffline(tasks);
            }),
            catchError(error => {
              // If API fails, try to return cached data
              return from(this.pwaService.getOfflineTasks()).pipe(
                catchError(() => {
                  this.errorHandler.handleError(error, 'Loading tasks');
                  return throwError(() => error);
                })
              );
            })
          );
        } else {
          // If offline, return cached tasks
          return from(this.pwaService.getOfflineTasks());
        }
      })
    );
  }

  getTaskById(id: number): Observable<Task> {
    return this.pwaService.online$.pipe(
      switchMap(isOnline => {
        if (isOnline) {
          // Online: fetch from API
          return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`).pipe(
            catchError(error => {
              this.errorHandler.handleError(error, `Loading task ${id}`);
              return throwError(() => error);
            })
          );
        } else {
          // Offline: get from cached tasks
          return from(this.pwaService.getOfflineTasks()).pipe(
            map((tasks: Task[]) => {
              const task = tasks.find((t: Task) => t.id === id);
              if (!task) {
                throw new Error(`Task ${id} not found in offline cache`);
              }
              return task;
            }),
            catchError(error => {
              this.errorHandler.handleError(error, `Loading task ${id} from cache`);
              return throwError(() => error);
            })
          );
        }
      })
    );
  }

  createTask(task: Task): Observable<Task> {
    // Capture online status at the time of the call
    const isCurrentlyOnline = navigator.onLine;
    
    if (isCurrentlyOnline) {
      // Online: make API call
      return this.http.post<Task>(`${this.apiUrl}/tasks`, task).pipe(
        tap(() => {
          this.toastService.addToast({
            text: 'Task created successfully!',
            type: 'success',
            delayAdd: true,
          });
        }),
        catchError(error => {
          // If API fails, try offline fallback
          console.warn('Online API call failed, falling back to offline mode');
          return this.createTaskOffline(task);
        })
      );
    } else {
      // Offline: queue action and return optimistic update
      return this.createTaskOffline(task);
    }
  }

  private createTaskOffline(task: Task): Observable<Task> {
    const offlineTask = {
      ...task,
      id: Date.now(), // Temporary ID
      createdAt: new Date().toISOString()
    };
    
    this.pwaService.queueOfflineAction('CREATE', offlineTask);
    
    this.toastService.addToast({
      text: 'Task queued for sync when online',
      type: 'info',
      delayAdd: true,
    });
    
    return of(offlineTask);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    // Capture online status at the time of the call
    const isCurrentlyOnline = navigator.onLine;
    
    if (isCurrentlyOnline) {
      // Online: make API call
      return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task).pipe(
        tap(() => {
          this.toastService.addToast({
            text: 'Task updated successfully!',
            type: 'success',
            delayAdd: true,
          });
        }),
        catchError(error => {
          // If API fails, try offline fallback
          console.warn('Online API call failed, falling back to offline mode');
          return this.updateTaskOffline(id, task);
        })
      );
    } else {
      // Offline: queue action and return optimistic update
      return this.updateTaskOffline(id, task);
    }
  }

  private updateTaskOffline(id: number, task: Partial<Task>): Observable<Task> {
    const updatedTask = { ...task, id };
    
    this.pwaService.queueOfflineAction('UPDATE', updatedTask as Task);
    
    this.toastService.addToast({
      text: 'Task update queued for sync when online',
      type: 'info',
      delayAdd: true,
    });
    
    return of(updatedTask as Task);
  }

  deleteTask(id: number): Observable<void> {
    // Capture online status at the time of the call
    const isCurrentlyOnline = navigator.onLine;
    
    if (isCurrentlyOnline) {
      // Online: make API call
      return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`).pipe(
        tap(() => {
          this.toastService.addToast({
            text: 'Task deleted successfully!',
            type: 'success',
            delayAdd: true,
          });
        }),
        catchError(error => {
          // If API fails, try offline fallback
          console.warn('Online API call failed, falling back to offline mode');
          return this.deleteTaskOffline(id);
        })
      );
    } else {
      // Offline: queue action and return success
      return this.deleteTaskOffline(id);
    }
  }

  private deleteTaskOffline(id: number): Observable<void> {
    const taskToDelete = { id } as Task;
    
    this.pwaService.queueOfflineAction('DELETE', taskToDelete);
    
    this.toastService.addToast({
      text: 'Task deletion queued for sync when online',
      type: 'info',
      delayAdd: true,
    });
    
    return of(undefined);
  }

  moveTask(id: number, newStatus: string, newIndex: number): Observable<Task> {
    // Capture online status at the time of the call
    const isCurrentlyOnline = navigator.onLine;
    
    if (isCurrentlyOnline) {
      // Online: make API call
      return this.http.put<Task>(`${this.apiUrl}/tasks/${id}/move`, { status: newStatus, order: newIndex }).pipe(
        catchError(error => {
          // If API fails, try offline fallback
          console.warn('Online API call failed, falling back to offline mode');
          return this.moveTaskOffline(id, newStatus, newIndex);
        })
      );
    } else {
      // Offline: get the full task from cache, update it, and queue action
      return this.moveTaskOffline(id, newStatus, newIndex);
    }
  }

  private moveTaskOffline(id: number, newStatus: string, newIndex: number): Observable<Task> {
    return from(this.pwaService.getOfflineTasks()).pipe(
      map((tasks: Task[]) => {
        const originalTask = tasks.find((t: Task) => t.id === id);
        if (!originalTask) {
          throw new Error(`Task ${id} not found in offline cache`);
        }
        
        // Create updated task with new position
        const movedTask = { ...originalTask, status: newStatus as Task['status'], order: newIndex };
        
        // Queue the move action (this will also update the cache)
        this.pwaService.queueOfflineAction('MOVE', movedTask);
        
        this.toastService.addToast({
          text: 'Task move queued for sync when online',
          type: 'info',
          delayAdd: true,
        });
        
        return movedTask;
      }),
      catchError(error => {
        this.errorHandler.handleError(error, `Moving task ${id} offline`);
        return throwError(() => error);
      })
    );
  }

  resetTasks(): Observable<Task[]> {
    return this.http.post<Task[]>(`${this.apiUrl}/tasks/reset`, {}).pipe(
      catchError(error => {
        this.errorHandler.handleError(error, 'Resetting tasks');
        return throwError(() => error);
      })
    );
  }
}