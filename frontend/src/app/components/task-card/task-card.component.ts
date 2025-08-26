import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent {
  @Input() task!: Task;
  
  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<void>();

  onEdit(): void {
    this.taskEdit.emit(this.task);
  }

  onDelete(): void {
    // TODO: Implement delete confirmation
    this.taskDelete.emit();
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