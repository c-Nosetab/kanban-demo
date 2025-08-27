import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { ToastService } from '../../services/toast.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input() task!: Task;

  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<void>();

  constructor(
    private toastService: ToastService,
    private taskService: TaskService
  ) { }

  onEdit(): void {
    this.taskEdit.emit(this.task);
  }

  onDelete(): void {
    console.log('onDelete');
    // TODO: Implement delete confirmation
    const response = window.confirm('Delete task?');

    if (response) {
      this.taskService.deleteTask(this.task.id!).subscribe({
        next: () => {
          this.taskDelete.emit();
        }
      });
    }

  }

  getPriorityClass(): string {
    return `priority-${this.task.priority}`;
  }

  getPriorityIcon(): string {
    switch (this.task.priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return new Date(this.task.dueDate) < new Date();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}