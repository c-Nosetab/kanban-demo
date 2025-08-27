import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task.interface';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;

  @Output() taskSaved = new EventEmitter<void>();
  @Output() formClosed = new EventEmitter<void>();

  formData: Task = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  };

  isLoading = false;
  error = '';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    if (this.task) {
      this.formData = { ...this.task };
      if (this.formData.dueDate) {
        this.formData.dueDate = this.formatDateForInput(this.formData.dueDate);
      }
    }
  }

  onSubmit(): void {
    if (!this.formData.title.trim()) {
      this.error = 'Title is required';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // TODO: Implement save logic
    setTimeout(() => {
      this.isLoading = false;
      this.taskSaved.emit();
    }, 500);
  }

  onCancel(): void {
    this.formClosed.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  private formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  get isEditMode(): boolean {
    return this.task !== null;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Task' : 'Add New Task';
  }
}