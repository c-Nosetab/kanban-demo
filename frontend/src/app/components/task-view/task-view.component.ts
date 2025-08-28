import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { Modal } from '../modal/modal';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-task-view',
  standalone: true,
  imports: [CommonModule, Modal, MatIcon],
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent {
  @Input() task!: Task;
  @Input() isOpen: boolean = false;

  @Output() editTask = new EventEmitter<Task>();
  @Output() closeView = new EventEmitter<void>();

  getPriorityIcon(): string {
    if (!this.task) return '⚪';

    switch (this.task.priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  getPriorityClass(): string {
    if (!this.task) return '';
    return `priority-${this.task.priority}`;
  }

  getStatusClass(): string {
    if (!this.task) return '';
    return `status-${this.task.status}`;
  }

  getStatusLabel(): string {
    if (!this.task) return '';

    switch (this.task.status) {
      case 'todo': return 'Todo';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Done';
      default: return this.task.status;
    }
  }

  isOverdue(): boolean {
    if (!this.task?.dueDate) return false;
    return new Date(this.task.dueDate) < new Date() && this.task.status !== 'done';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCreatedDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onEdit(): void {
    if (this.task) {
      this.editTask.emit(this.task);
    }
  }

  onClose(): void {
    this.closeView.emit();
  }
}
