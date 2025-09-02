import { Component, OnInit, HostListener, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { BehaviorSubject, Subject, takeUntil, Observable } from 'rxjs';
import { BoardFilterService } from '../../services/board-filter.service';
import { ColumnManagerService } from '../../services/column-manager.service';
import { BoardDragDropService } from '../../services/board-drag-drop.service';


@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, TaskFormComponent, TaskViewComponent, Search, CheckboxGroup, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrls: ['./board.scss']
})
export class BoardComponent implements OnInit, AfterViewInit {
  private tasks$ = new BehaviorSubject<Task[]>([]);
  columns$: Observable<any[]>;

  private destroy$ = new Subject<void>();

  showTaskForm = false;
  showTaskView = false;
  editingTask: Task = {} as Task;
  viewingTask: Task = {} as Task;
  newTaskIds: Set<number> = new Set();
  isSortDropdownOpen = false;
  isFilteringExpanded = false;
  curSortDirection: 'asc' | 'desc' = 'asc';
  curSortOption: keyof Task = 'order';
  expandedColumn: any;

  get selectedPriorityOptions(): string[] {
    return this.boardFilter.selectedPriorityOptions;
  }

  get searchValue(): string {
    return this.boardFilter.searchValue;
  }

  get selectedSortOption(): keyof Task {
    return this.boardFilter.selectedSortOption;
  }

  get selectedSortDirection(): 'asc' | 'desc' {
    return this.boardFilter.selectedSortDirection;
  }

  get selectedSortLabel(): string {
    return this.boardFilter.selectedSortLabel;
  }

  get sortOptions() {
    return this.boardFilter.sortOptions;
  }

  get priorityOptions() {
    return this.boardFilter.priorityOptions;
  }

  constructor(
    private taskService: TaskService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private boardFilter: BoardFilterService,
    private columnManager: ColumnManagerService,
    private dragDropService: BoardDragDropService
  ) {
    this.columns$ = this.boardFilter.createColumnsObservable(this.tasks$, this.newTaskIds);
    this.expandedColumn = this.columnManager.expandedColumn;
  }

  ngOnInit(): void {
    this.loadTasks();
    this.boardFilter.setupSearchDebounce(this.destroy$);
    this.columnManager.setupExpandedColumnSubscription(this.cdr, this.destroy$);
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe((tasks) => {
      this.tasks$.next(tasks);
    });
  }

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

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    this.columnManager.onWindowResize(this.cdr);

    if (this.dragDropService.isDragging) {
      setTimeout(() => {
        // Force recalculation handled in drag service
      }, 100);
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

  onDragStart(): void {
    this.dragDropService.onDragStart();
  }

  onDragEnd(): void {
    this.dragDropService.onDragEnd(this.cdr);
  }

  onDragMoved(columnStatus: string, event: any): void {
    this.dragDropService.onDragMoved(columnStatus, event, this.cdr);
  }


  isDragHoveringOverColumn(columnStatus: string): boolean {
    return this.dragDropService.isDragHoveringOverColumn(columnStatus);
  }

  onDragOver(columnStatus: string): void {
    this.dragDropService.onDragOver(columnStatus, this.cdr);
  }

  onDragLeave(columnStatus: string): void {
    this.dragDropService.onDragLeave(columnStatus);
  }

  isColumnCollapsed(columnStatus: string): boolean {
    return this.columnManager.isColumnCollapsed(columnStatus);
  }




  onTaskMoved(
    { taskId, newIndex, newStatus, oldStatus }:
    {
      taskId: number, newIndex: number, newStatus: string, oldIndex: number, oldStatus: string
    }
  ): void {
    this.dragDropService.onTaskMoved({ taskId, newIndex, newStatus, oldIndex: 0, oldStatus }, this.tasks$);
  }

  onResetTasks(): void {
    this.newTaskIds.clear();
    this.boardFilter.resetFilters();
    this.taskService.resetTasks().subscribe((tasks) => {
      this.tasks$.next(tasks);
    });
  }

  onSearch(value: string): void {
    this.boardFilter.onSearch(value);
  }

  onPrioritySelected({ option, isSelected }: { option: string, isSelected: boolean }): void {
    this.boardFilter.onPrioritySelected({ option, isSelected });
  }

  selectSortOption(optionId: keyof Task): void {
    this.curSortOption = optionId;
    this.boardFilter.selectSortOption(optionId);
    this.isSortDropdownOpen = false;
  }

  toggleSortDirection(): void {
    this.boardFilter.toggleSortDirection();
  }

  showToasts(): void {
    this.toastService.showToasts();
  }





  toggleColumnCollapse(columnStatus: string): void {
    this.columnManager.toggleColumnCollapse(columnStatus, this.cdr);
  }

  isMobileView(): boolean {
    return this.columnManager.isMobileView();
  }

  ngAfterViewInit(): void {
    this.columnManager.wasMobileView = this.columnManager.isMobileView();

    if (this.columnManager.isMobileView()) {
      this.columnManager.initializeMobileColumnState(this.cdr);
    }
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.columnManager.cleanup();
  }
}