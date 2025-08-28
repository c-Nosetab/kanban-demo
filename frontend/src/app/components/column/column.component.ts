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

  onTaskEdit(task: Task): void {
    this.taskEdit.emit(task);
  }

  onTaskDelete(): void {
    this.taskDelete.emit();
  }

  onTaskDrop(event: any): void {
    const id = event.item.element.nativeElement.id;
    this.taskMove.emit({
      taskId: id,
      oldIndex: event.previousIndex,
      newIndex: event.currentIndex,
      oldStatus: event.previousContainer.data,
      newStatus: event.container.data,
    });
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }
}