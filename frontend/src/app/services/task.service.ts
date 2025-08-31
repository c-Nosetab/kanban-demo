import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Task } from '../models/task.interface';
import { ToastService } from './toast.service';
import { ErrorHandlerService } from './error-handler.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) { }

  getTasks(): Observable<Task[]> {
    // Get ALL tasks without any filtering - let frontend handle filtering/sorting
    const httpParams = new HttpParams()
      .set('sortBy', 'order')
      .set('sortDirection', 'asc')
      .set('priority', 'low').append('priority', 'medium').append('priority', 'high')
      .set('filterString', '');

    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params: httpParams }).pipe(
      catchError(error => {
        this.errorHandler.handleError(error, 'Loading tasks');
        return throwError(() => error);
      })
    );
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`).pipe(
      catchError(error => {
        this.errorHandler.handleError(error, `Loading task ${id}`);
        return throwError(() => error);
      })
    );
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task).pipe(
      tap(() => {
        this.toastService.addToast({
          text: 'Task created successfully!',
          type: 'success',
          delayAdd: true,
        });
      }),
      catchError(error => {
        this.errorHandler.handleError(error, 'Creating task');
        return throwError(() => error);
      })
    );
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task).pipe(
      tap(() => {
        this.toastService.addToast({
          text: 'Task updated successfully!',
          type: 'success',
          delayAdd: true,
        });
      }),
      catchError(error => {
        this.errorHandler.handleError(error, `Updating task ${id}`);
        return throwError(() => error);
      })
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`).pipe(
      tap(() => {
        this.toastService.addToast({
          text: 'Task deleted successfully!',
          type: 'success',
          delayAdd: true,
        });
      }),
      catchError(error => {
        this.errorHandler.handleError(error, `Deleting task ${id}`);
        return throwError(() => error);
      })
    );
  }

  moveTask(id: number, newStatus: string, newIndex: number): Observable<{ movedTask: Task, allTasks: Task[] }> {
    return this.http.put<{ movedTask: Task, allTasks: Task[] }>(`${this.apiUrl}/tasks/${id}/move`, { status: newStatus, order: newIndex }).pipe(
      catchError(error => {
        this.errorHandler.handleError(error, `Moving task ${id}`);
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