import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Task } from '../models/task.interface';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task).pipe(
      tap(() => {
        this.toastService.addToast({
          text: 'Task created successfully!',
          type: 'success',
          delayAdd: true,
        });
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
      })
    );
  }

  moveTask(id: number, newStatus: string): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}/move`, { status: newStatus });
  }

  resetTasks(): Observable<Task[]> {
    return this.http.post<Task[]>(`${this.apiUrl}/tasks/reset`, {});
  }
}