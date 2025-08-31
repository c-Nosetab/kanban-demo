import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { TaskCardComponent } from '../task-card/task-card';
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, CdkDropList, CdkDrag, MatIconModule],
  templateUrl: './column.html',
  styleUrls: ['./column.scss']
})
export class ColumnComponent {
  @Input() title!: string;
  @Input() status!: string;
  @Input() tasks: Task[] = [];
  @Input() isNewTask: (task: Task) => boolean = () => false;
  @Input() isCollapsed: boolean = false;
  @Input() isDragHovering: boolean = false;
  @Input() showMobileToggle: boolean = false;
  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<Task>();
  @Output() taskMove = new EventEmitter<{ taskId: number, oldIndex: number, newIndex: number, oldStatus: string, newStatus: string }>();
  @Output() taskView = new EventEmitter<Task>();
  @Output() dragStart = new EventEmitter<void>();
  @Output() dragEnd = new EventEmitter<void>();
  @Output() dragOver = new EventEmitter<any>();
  @Output() dragLeave = new EventEmitter<void>();
  @Output() dragMoved = new EventEmitter<any>();
  @Output() toggleCollapse = new EventEmitter<void>();

  onTaskEdit(task: Task): void {
    this.taskEdit.emit(task);
  }

  onTaskDelete(): void {
    this.taskDelete.emit();
  }

  onTaskView(task: Task): void {
    this.taskView.emit(task);
  }

  onTaskDrop(event: any): void {
    this.dragEnd.emit();

    // Extract task ID from the dragged item
    const taskId = parseInt(event.item.element.nativeElement.id, 10);

    // Get the status from the container data
    const oldStatus = event.previousContainer.data;
    const newStatus = event.container.data;

    // Emit the move event for server synchronization
    this.taskMove.emit({
      taskId: taskId,
      oldIndex: event.previousIndex,
      newIndex: event.currentIndex,
      oldStatus: oldStatus,
      newStatus: newStatus,
    });
  }

  onDragStart(): void {
    this.dragStart.emit();
  }

  onDragEnd(): void {
    this.dragEnd.emit();
  }

  onDragOver(event: any): void {
    this.dragOver.emit(event);
  }

  onDragLeave(): void {
    this.dragLeave.emit();
  }

  onDragMoved(event: any): void {
    this.dragMoved.emit(event);
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }

  isMobile(): boolean {
    return 'ontouchstart' in window && window.innerWidth <= 768;
  }
}