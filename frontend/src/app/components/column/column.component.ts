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

  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<Task>();
  @Output() taskMove = new EventEmitter<{task: Task, status: string}>();

  onTaskEdit(task: Task): void {
    this.taskEdit.emit(task);
  }

  onTaskDelete(): void {
    this.taskDelete.emit();
  }

  onTaskDrop(event: any): void {
    console.log(event);
    // TODO: Implement drag and drop logic
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }
}