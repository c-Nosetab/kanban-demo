import { Component, OnInit, HostListener, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { TaskService } from '../../services/task.service';
import { ColumnComponent } from '../column/column';
import { TaskFormComponent } from '../task-form/task-form';
import { TaskViewComponent } from '../task-view/task-view';
import { ToastService } from '../../services/toast.service';
import { Search } from '../search/search';
import { CheckboxGroup } from '../checkbox-group/checkbox-group';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, Subject, switchMap, takeUntil } from 'rxjs';


@Component({
  selector: 'app-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ColumnComponent, TaskFormComponent, TaskViewComponent, Search, CheckboxGroup, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrls: ['./board.scss']
})
export class BoardComponent implements OnInit {
  private tasks$ = new BehaviorSubject<Task[]>([]);
  private filters$ = new BehaviorSubject<{
    search: string;
    priorities: string[];
    sortBy: keyof Task;
    sortDirection: 'asc' | 'desc';
  }>({
    search: '',
    priorities: ['low', 'medium', 'high'],
    sortBy: 'order',
    sortDirection: 'asc'
  });

  columns$ = combineLatest([
    this.tasks$,
    this.filters$
  ]).pipe(
    map(([tasks, filters]) => this.computeColumns(tasks, filters))
  );

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  showTaskForm = false;
  showTaskView = false;
  editingTask: Task = {} as Task;
  viewingTask: Task = {} as Task;
  newTaskIds: Set<number> = new Set();
  isSortDropdownOpen = false;
  isFilteringExpanded = false;
  curSortDirection: 'asc' | 'desc' = 'asc';

  sortOptions: { id: keyof Task, label: string }[] = [
    { id: 'order', label: 'Order' },
    { id: 'priority', label: 'Priority' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'title', label: 'Title' },
  ];
  curSortOption: keyof Task = 'order';

  priorityOptions: { label: string; value: string }[] = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  get selectedPriorityOptions(): string[] {
    return this.filters$.value.priorities;
  }

  get searchValue(): string {
    return this.filters$.value.search;
  }

  get selectedSortOption(): keyof Task {
    return this.filters$.value.sortBy;
  }

  get selectedSortDirection(): 'asc' | 'desc' {
    return this.filters$.value.sortDirection;
  }

  get selectedSortLabel(): string {
    const selectedOption = this.sortOptions.find(option => option.id === this.filters$.value.sortBy);
    return selectedOption?.label || 'Order';
  }

  constructor(
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTasks();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((value: string) => {
      this.filters$.next({
        ...this.filters$.value,
        search: value
      })
    });
  }

  // #region Load and Process Tasks
  loadTasks(): void {
    // Load all tasks with default parameters to get everything
    this.taskService.getTasks().subscribe((tasks) => {
      this.tasks$.next(tasks);
    });
  }

  private computeColumns(tasks: Task[], filters: {
    search: string;
    priorities: string[];
    sortBy: keyof Task;
    sortDirection: 'asc' | 'desc';
  }): any[] {
    const filtered = this.applyFilters(tasks, filters);
    return [
      {
        title: 'To Do',
        status: 'todo',
        tasks: filtered.filter(task => task.status === 'todo')
      },
      {
        title: 'In Progress',
        status: 'in-progress',
        tasks: filtered.filter(task => task.status === 'in-progress')
      },
      {
        title: 'Done',
        status: 'done',
        tasks: filtered.filter(task => task.status === 'done')
      },
    ];
  }

  private applyFilters(tasks: Task[], filters: {
    search: string;
    priorities: string[];
    sortBy: keyof Task;
    sortDirection: 'asc' | 'desc';
  }): Task[] {
    let filtered = [...tasks];

    const { search, priorities, sortBy, sortDirection } = filters;

    if (search) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (priorities && priorities.length > 0) {
      filtered = filtered.filter(task =>
        priorities.includes(task.priority)
      );
    }

    filtered = this.sortTasks(filtered, sortBy, sortDirection);

    return filtered;
  }

  sortTasks(tasks: Task[], sortBy: keyof Task, sortDirection: 'asc' | 'desc'): Task[] {
    if (sortBy === 'priority') {
      const order = ['high', 'medium', 'low'];
      return tasks.sort((a, b) => {
        const aIndex = order.indexOf(a.priority);
        const bIndex = order.indexOf(b.priority);
        return sortDirection === 'asc' ? aIndex - bIndex : bIndex - aIndex;
      });
    }

    if (sortBy === 'dueDate') {
      return tasks.sort((a, b) => {
        const aOption = a?.dueDate || '';
        const bOption = b.dueDate || '';

        if (!aOption || !bOption) {
          return 0;
        }

        const aDate = new Date(aOption);
        const bDate = new Date(bOption);
        return sortDirection === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      });
    }

    if (sortBy === 'order') {
      return tasks.sort((a, b) => {
        const aOrder = a.order;
        const bOrder = b.order;
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      });
    }

    if (sortBy === 'title') {
      return tasks.sort((a, b) => {
        const aTitle = a.title;
        const bTitle = b.title;
        return sortDirection === 'asc' ? aTitle.localeCompare(bTitle) : bTitle.localeCompare(aTitle);
      });
    }

    return tasks;
  }

  // #endregion Load and ProcessTasks

  toggleSortDropdown(): void {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  toggleFilteringExpanded(): void {
    this.isFilteringExpanded = !this.isFilteringExpanded;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.isSortDropdownOpen = false;
    }
  }

  // #region Task Events
  onAddTask(): void {
    this.editingTask = null as any;
    this.showTaskForm = true;
  }

  onEditTask(task: Task): void {
    this.editingTask = { ...task };
    this.showTaskForm = true;
  }

  onViewTask(task: Task): void {
    this.viewingTask = { ...task };
    this.showTaskView = true;
  }

  onTaskFormClose(): void {
    this.showTaskForm = false;
    this.editingTask = null as any;
  }

  onTaskViewClose(): void {
    this.showTaskView = false;
    this.viewingTask = {} as Task;
  }

  onTaskSaved(newTaskId: number | null): void {
    this.showTaskForm = false;
    const currentEditingTask = this.editingTask;
    this.editingTask = null as any;

    if (newTaskId) {
      this.taskService.getTaskById(newTaskId).subscribe((task) => {
        this.tasks$.next([...this.tasks$.value, task]);
      });
      // Mark this task as new for animation
      this.newTaskIds.add(newTaskId);
    } else {
      if (currentEditingTask?.id !== undefined) {
        this.taskService.getTaskById(currentEditingTask.id).subscribe((task) => {
          const currentTasks = this.tasks$.value;
          const index = currentTasks.findIndex(t => t.id === currentEditingTask.id);

          if (index !== -1) {
            const updatedTasks = [...currentTasks];
            updatedTasks[index] = task;
            this.tasks$.next(updatedTasks);
          }
        });
      }
    }
  }

  onTaskViewEdit(task: Task): void {
    this.showTaskView = false;
    this.viewingTask = {} as Task;
    this.editingTask = { ...task };
    this.showTaskForm = true;
  }

  isNewTask(task: Task): boolean {
    return this.newTaskIds.has(task.id!);
  }

  onTaskDeleted(deletedTaskId?: number): void {
    if (deletedTaskId) {
      const currentTasks = this.tasks$.value;
      this.tasks$.next(currentTasks.filter(task => task.id !== deletedTaskId));
    } else {
      this.loadTasks();
    }
  }

  onTaskMoved({ taskId, newIndex, newStatus, oldIndex }: { taskId: number, newIndex: number, newStatus: string, oldIndex: number }): void {
    // Perform optimistic update to prevent visual jump
    const currentTasks = [...this.tasks$.value];
    const taskToMove = currentTasks.find(task => task.id === taskId);
    
    if (taskToMove) {
      // Update the task's status and position optimistically
      const updatedTask = { ...taskToMove, status: newStatus as 'todo' | 'in-progress' | 'done', order: newIndex };
      const updatedTasks = currentTasks.map(task => 
        task.id === taskId ? updatedTask : task
      );
      
      // Update the UI immediately
      this.tasks$.next(updatedTasks);
      
      // Then make the API call
      this.taskService.moveTask(taskId, newStatus, newIndex).subscribe({
        next: () => {
          this.toastService.addToast({
            text: 'Task moved successfully!',
            type: 'success',
            delayAdd: true,
          });
          // Refresh from server to get correct order values, but don't show loading
          this.taskService.getTasks().subscribe((tasks) => {
            this.tasks$.next(tasks);
          });
        },
        error: (error) => {
          this.toastService.addToast({
            text: `Failed to move task: ${error.message}`,
            type: 'error',
            delayAdd: false,
          });
          // Revert to original state by reloading
          this.loadTasks();
        }
      });
    }
  }

  onResetTasks(): void {
    this.newTaskIds.clear();

    this.filters$.next({
      ...this.filters$.value,
      sortBy: 'order',
      sortDirection: 'asc',
    });

    this.taskService.resetTasks().subscribe((tasks) => {
      this.tasks$.next(tasks);
    });
  }

  // #endregion Task Events

  // #region Search and Filter Events
  onSearch(value: string): void {
    this.filters$.next({
      ...this.filters$.value,
      search: value
    })
  }

  onPrioritySelected({ option, isSelected }: { option: string, isSelected: boolean }): void {
    if (isSelected) {
      this.filters$.next({
        ...this.filters$.value,
        priorities: this.filters$.value.priorities.filter(opt => opt !== option)
      })
    } else {
      this.filters$.next({
        ...this.filters$.value,
        priorities: [...this.filters$.value.priorities, option]
      })
    }
  }

  selectSortOption(optionId: keyof Task): void {
    this.curSortOption = optionId;

    this.filters$.next({
      ...this.filters$.value,
      sortBy: optionId
    });
    this.isSortDropdownOpen = false;
  }

  toggleSortDirection(): void {
    const newDirection = this.selectedSortDirection === 'asc' ? 'desc' : 'asc';
    this.filters$.next({
      ...this.filters$.value,
      sortDirection: newDirection,
    });
  }
  // #endregion Search and Filter Events

  showToasts(): void {
    this.toastService.showToasts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}