import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { TaskService } from '../../services/task.service';
import { ColumnComponent } from '../column/column.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, TaskFormComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  tasks: Task[] = [];
  showTaskForm = false;
  editingTask: Task | null = null;
  newTaskIds: Set<number> = new Set();

  constructor(
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe((tasks) => {
      this.tasks = tasks;
    });
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks.filter(task => task.status === status);
  }

  onAddTask(): void {
    this.editingTask = null;
    this.showTaskForm = true;
  }

  onEditTask(task: Task): void {
    this.editingTask = task;
    this.showTaskForm = true;
  }

  onTaskFormClose(): void {
    this.showTaskForm = false;
    this.editingTask = null;
  }

  onTaskSaved(newTaskId: number | null): void {
    this.showTaskForm = false;
    this.editingTask = null;

    if (newTaskId) {
      // Mark this task as new for animation
      this.newTaskIds.add(newTaskId);
    }

    this.loadTasks();
  }

  isNewTask(task: Task): boolean {
    return this.newTaskIds.has(task.id!);
  }

  onTaskDeleted(): void {
    this.loadTasks();
  }

  onTaskMoved(task: Task, newStatus: string): void {
    // TODO: Implement task move functionality
    this.taskService.moveTask(task.id!, newStatus).subscribe(() => {
      this.loadTasks();
    });
  }

  onResetTasks(): void {
    this.taskService.resetTasks().subscribe(() => {
      this.loadTasks();
    });
  }
}