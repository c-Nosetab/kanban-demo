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

  // Track which tasks have drag enabled (for mobile)
  private dragEnabledTasks = new Set<number>();

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

    // Get the status from the container data (now it's the status string)
    const oldStatus = event.previousContainer.data;
    const newStatus = event.container.data;

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
    // console.log(`Drag over in ${this.status}: `, event);
    this.dragOver.emit(event);
  }

  onDragLeave(): void {
    // console.log(`Drag leave in ${this.status}: `);
    this.dragLeave.emit();
  }

  onDragMoved(event: any): void {
    // console.log(`Drag moved in ${this.status}: `, event);
    this.dragMoved.emit(event);
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }

  isDragEnabledForTask(task: Task): boolean {
    // On desktop, drag is always enabled
    if (!this.isMobile()) {
      return true;
    }
    // On mobile, check if this specific task has drag enabled
    return this.dragEnabledTasks.has(task.id!);
  }

  onTaskDragEnabledChange(taskId: number, isEnabled: boolean): void {
    console.log('Task drag enabled change:', taskId, isEnabled);
    if (isEnabled) {
      this.dragEnabledTasks.add(taskId);
    } else {
      this.dragEnabledTasks.delete(taskId);
    }
  }

  private isMobile(): boolean {
    return 'ontouchstart' in window && window.innerWidth <= 768;
  }
}