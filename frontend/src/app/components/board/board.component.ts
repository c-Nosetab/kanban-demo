import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { TaskService } from '../../services/task.service';
import { ColumnComponent } from '../column/column.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { ToastService } from '../../services/toast.service';
import { Search } from '../search/search';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, TaskFormComponent, Search],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  showTaskForm = false;
  editingTask: Task | null = null;
  newTaskIds: Set<number> = new Set();
  isSortDropdownOpen = false;
  curSortDirection: 'asc' | 'desc' = 'asc';
  searchValue: string = '';

  sortOptions: { id: keyof Task, label: string }[] = [
    { id: 'order', label: 'Order' },
    { id: 'priority', label: 'Priority' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'title', label: 'Title' },
  ];
  curSortOption: keyof Task = 'order';

  constructor(
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks(this.curSortOption, this.curSortDirection)
      .subscribe((tasks) => {

        this.tasks = tasks;
        this.filteredTasks = [...this.tasks];
    });
  }

  getTasksByStatus(status: string): Task[] {
    return this.filteredTasks.filter(task => task.status === status);
  }

  toggleSortDropdown(): void {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  getSelectedOptionLabel(): string {
    const selectedOption = this.sortOptions.find(option => option.id === this.curSortOption);
    return selectedOption ? selectedOption.label : 'Order';
  }

  selectSortOption(optionId: keyof Task): void {
    this.curSortOption = optionId;
    this.isSortDropdownOpen = false;
    this.loadTasks();
  }

  toggleSortDirection(): void {
    this.curSortDirection = this.curSortDirection === 'asc' ? 'desc' : 'asc';
    this.loadTasks();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.isSortDropdownOpen = false;
    }
  }

  onSortChange(event: Event): void {
    const selectedOption = (event.target as HTMLSelectElement).value;
    this.curSortOption = selectedOption as keyof Task;
    this.loadTasks();
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

  onTaskMoved({ taskId, oldIndex, newIndex, oldStatus, newStatus }: { taskId: number, oldIndex: number, newIndex: number, oldStatus: string, newStatus: string }): void {
    const task = this.tasks.find(task => {
      return Number(task?.id) === Number(taskId);
    });
    if (!task) {
      return;
    }

    const updatedTask: Task = {
      ...task,
      // status: ,

    }
    console.log('🚀 - task:', task);
    console.log('Old status:', oldStatus);
    console.log('New status:', newStatus);
    console.log('Old index:', oldIndex);
    console.log('New index:', newIndex);
    console.log('--------------------------------');

    // TODO: Implement task move functionality
    // this.taskService.moveTask(task.id!, newStatus).subscribe(() => {
    //   this.loadTasks();
    // });
  }

  onResetTasks(): void {
    this.newTaskIds.clear();

    this.curSortOption = 'order';
    this.curSortDirection = 'asc';

    this.taskService.resetTasks().subscribe(() => {
      this.loadTasks();
    });
  }

  onSearch(value: string): void {
    this.searchValue = value;

    this.filteredTasks = [...this.tasks].filter((task: Task) => {
      const { title, description, priority } = task;
      const searchValue = new RegExp(value, 'gi');

      const titleMatch = searchValue.test(title);
      const descriptionMatch = description ? searchValue.test(description) : false;
      const priorityMatch = priority ? searchValue.test(priority) : false;

      return titleMatch || descriptionMatch || priorityMatch;
    });
  }
}