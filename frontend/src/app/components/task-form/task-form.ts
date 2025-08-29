import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task.interface';
import { TaskService } from '../../services/task.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './task-form.html',
  styleUrls: ['./task-form.scss']
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;

  @Output() taskSaved = new EventEmitter<number | null>();
  @Output() formClosed = new EventEmitter<void>();

  isOpen = true;
  confirmText = 'Save';
  cancelText = 'Cancel';
  isLoading = false;
  minDate = new Date().toISOString().split('T')[0];

  formData: Task = {
    title: '',
    order: 0,
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  };

  error = '';

  constructor(private taskService: TaskService, private cdr: ChangeDetectorRef) {}

  @ViewChild(Modal) modalRef!: Modal;

  ngOnInit(): void {
    if (this.task) {
      this.formData = { ...this.task };
      if (this.formData.dueDate) {
        this.formData.dueDate = this.formatDateForInput(this.formData.dueDate);
      }
    }

    if (this.isEditMode) {
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  onConfirm(): void {
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.formData.title.trim()) {
      this.error = 'Title is required';
      return;
    }

    this.isLoading = true;
    this.error = '';


    if (this.isEditMode) {
      // Update existing task
      this.taskService.updateTask(this.task!.id!, this.formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.modalRef.closeAfterSuccess();
          // Delay the emit until after animation completes
          setTimeout(() => {
            this.taskSaved.emit(null); // No new task ID for updates
          }, 290); // Match modal animation duration
        },
        error: () => {
          this.isLoading = false;
          // Error is handled globally by ErrorHandlerService
        }
      });
    } else {
      // Create new task
      this.taskService.createTask(this.formData).subscribe({
        next: (newTask) => {
          this.isLoading = false;
          this.modalRef.closeAfterSuccess();
          // Delay the emit until after animation completes
          setTimeout(() => {
            this.taskSaved.emit(newTask.id || null);
          }, 290); // Match modal animation duration
        },
        error: () => {
          this.isLoading = false;
          // Error is handled globally by ErrorHandlerService
        }
      });
    }
  }

  onCancel(): void {
    this.formClosed.emit();
  }

  private formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  get isEditMode(): boolean {
    return this.task !== null && this.task.id !== undefined;
  }

  get modalTitle(): string {
    return this.isEditMode ? 'Edit Task' : 'Add New Task';
  }
}