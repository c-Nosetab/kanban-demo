import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { TaskCardComponent } from '../task-card/task-card.component';
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, CdkDropList, CdkDrag],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.scss']
})
export class ColumnComponent {
  @Input() title!: string;
  @Input() status!: string;
  @Input() tasks: Task[] = [];
  @Input() isNewTask: (task: Task) => boolean = () => false;

  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<Task>();
  @Output() taskMove = new EventEmitter<{ taskId: number, oldIndex: number, newIndex: number, oldStatus: string, newStatus: string }>();
  @Output() taskView = new EventEmitter<Task>();

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

    // Extract task ID from the dragged item
    const taskId = parseInt(event.item.element.nativeElement.id, 10);

    // Get the status from the container data (now it's the status string)
    const oldStatus = event.previousContainer.data;
    const newStatus = event.container.data;

    console.log('Drop event details:', {
      taskId,
      oldStatus,
      newStatus,
      oldIndex: event.previousIndex,
      newIndex: event.currentIndex,
      previousContainer: event.previousContainer,
      container: event.container
    });

    this.taskMove.emit({
      taskId: taskId,
      oldIndex: event.previousIndex,
      newIndex: event.currentIndex,
      oldStatus: oldStatus,
      newStatus: newStatus,
    });
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }
}