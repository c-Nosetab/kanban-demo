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
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, Subject, switchMap, takeUntil } from 'rxjs';


@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ColumnComponent, TaskFormComponent, TaskViewComponent, Search, CheckboxGroup, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrls: ['./board.scss']
})
export class BoardComponent implements OnInit, AfterViewInit {
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
    map(([tasks, filters]) => {
      // Clear new task animations whenever filters change
      this.newTaskIds.clear();
      return this.computeColumns(tasks, filters);
    })
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

  // Mobile drag-and-drop state
  isDragging = false;
  collapsedColumns: Set<string> = new Set();
  expandTimer: any = null;
  hoveringColumn: string | null = null;
  draggedFromColumn: string | null = null;
  dragHoveringColumn: string | null = null;

  // Manual column collapse state (separate from drag-induced collapse)
  manuallyCollapsedColumns: Set<string> = new Set();

  // Track mobile view state for responsive behavior
  wasMobileView: boolean = window.innerWidth < 768;

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
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
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

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    const currentlyMobile = window.innerWidth < 768;
    const wasMobile = this.wasMobileView;

    // Update mobile state
    this.wasMobileView = currentlyMobile;

    // If switching from mobile to desktop, clear all collapse states
    if (wasMobile && !currentlyMobile) {
      this.manuallyCollapsedColumns.clear();
      this.collapsedColumns.clear();
      this.cdr.detectChanges();
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
    this.isDragging = true;

    // On mobile, ensure all columns start collapsed when drag begins
    if (window.innerWidth < 768) {
      this.initializeMobileColumnState();
    }
  }

  onDragEnd(): void {
    // Don't immediately clear drag state - delay to allow drop detection to use it
    const targetColumn = this.dragHoveringColumn;
    this.isDragging = false;
    this.clearExpandTimer();

    // On mobile, ensure only the target column is expanded
    if (window.innerWidth < 768 && targetColumn) {
      // Collapse all columns first
      ['todo', 'in-progress', 'done'].forEach(status => {
        this.collapsedColumns.add(status);
      });

      // Then expand only the target column
      this.collapsedColumns.delete(targetColumn);
    }

    // Clear state after a short delay to allow drop handlers to complete
    setTimeout(() => {
      this.hoveringColumn = null;
      this.draggedFromColumn = null;
      this.dragHoveringColumn = null;

      // On mobile, scroll to the target column after drop
      // Wait for column expansion animations to complete (300ms) + extra buffer
      if (window.innerWidth < 768 && targetColumn) {
        setTimeout(() => {
          this.scrollToColumn(targetColumn);
        }, 400); // 300ms for CSS transitions + 100ms buffer
      }
    }, 100);
  }

  onDragMoved(columnStatus: string, event: any): void {
    if (!this.isDragging) return;

    // Only on mobile (below 768px)
    if (window.innerWidth >= 768) return;

    // Store which column the drag started from
    if (!this.draggedFromColumn) {
      this.draggedFromColumn = columnStatus;
    }

    // Get the current position of the drag
    const dragPosition = event.pointerPosition;

    // Check if drag is outside the original column bounds
    const columnElement = document.querySelector(`[data-column="${columnStatus}"]`) as HTMLElement;
    if (columnElement && this.draggedFromColumn === columnStatus) {
      const rect = columnElement.getBoundingClientRect();
      const isOutsideColumn = dragPosition.x < rect.left ||
                             dragPosition.x > rect.right ||
                             dragPosition.y < rect.top ||
                             dragPosition.y > rect.bottom;

      if (isOutsideColumn) {
        // On mobile, collapse all columns when leaving original column
        // This ensures only one column can be expanded at a time
        ['todo', 'in-progress', 'done'].forEach(status => {
          this.collapsedColumns.add(status);
        });
      }
    }

    // Check which column we're currently over for expansion
    this.checkColumnHover(dragPosition);
  }

  private checkColumnHover(dragPosition: { x: number, y: number }): void {
    const columns = ['todo', 'in-progress', 'done'];
    let hoveredColumn: string | null = null;

    // Find which column the drag is currently over - use distance-based detection to avoid overlaps
    let bestMatch: { column: string; distance: number } | null = null;

    for (const status of columns) {
      const columnElement = document.querySelector(`[data-column="${status}"]`) as HTMLElement;
      if (columnElement) {
        const rect = columnElement.getBoundingClientRect();
        const padding = 20;

        // Calculate center of column for distance measurement
        const centerX = (rect.left + rect.right) / 2;
        const centerY = (rect.top + rect.bottom) / 2;

        // For all columns during drag, use actual bounds for expanded columns, extended bounds for collapsed
        let top = rect.top;
        let bottom = rect.bottom;

        if (this.isDragging) {
          if (this.collapsedColumns.has(status)) {
            // For collapsed columns, extend bounds for easier targeting
            const columnIndex = columns.indexOf(status);
            const nextColumn = columns[columnIndex + 1];

            if (nextColumn) {
              const nextElement = document.querySelector(`[data-column="${nextColumn}"]`) as HTMLElement;
              if (nextElement) {
                const nextRect = nextElement.getBoundingClientRect();
                bottom = Math.min(rect.bottom + 120, (rect.bottom + nextRect.top) / 2);
              }
            } else {
              bottom = rect.bottom + 120;
            }
          } else {
            // For expanded columns, use actual bounds with minimal padding
            // This prevents the 140px gap issue
            top = rect.top;
            bottom = rect.bottom;
            // Only add small padding for stability
          }
        }

        // Debug logging for expanded columns
        const isExpanded = !this.collapsedColumns.has(status);
        const inBounds = dragPosition.x >= (rect.left - padding) &&
                        dragPosition.x <= (rect.right + padding) &&
                        dragPosition.y >= (top - padding) &&
                        dragPosition.y <= (bottom + padding);


        // Check if point is within extended bounds
        if (inBounds) {
          // Calculate distance to column center for tie-breaking
          const distance = Math.sqrt(
            Math.pow(dragPosition.x - centerX, 2) +
            Math.pow(dragPosition.y - centerY, 2)
          );

          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { column: status, distance };
          }
        }
      }
    }

    hoveredColumn = bestMatch ? bestMatch.column : null;

    // Update drag hover state for visual feedback
    if (hoveredColumn !== this.dragHoveringColumn) {
      this.dragHoveringColumn = hoveredColumn;
    }

    // Handle hover changes for expansion logic
    if (hoveredColumn !== this.hoveringColumn) {
      // Only clear timer when actually changing columns
      this.clearExpandTimer();

      // Store the previous column before updating
      const previousColumn = this.hoveringColumn;

      // If we're moving away from an expanded column, collapse it after a delay
      if (previousColumn && !this.collapsedColumns.has(previousColumn) && hoveredColumn !== previousColumn) {
        // Collapse the previously hovered expanded column after a short delay
        const columnToCollapse = previousColumn;
        setTimeout(() => {
          // Only collapse if we're still not hovering over it
          if (this.hoveringColumn !== columnToCollapse) {
            this.collapsedColumns.add(columnToCollapse);
          }
        }, 300);
      }

      this.hoveringColumn = hoveredColumn;

      if (hoveredColumn && this.collapsedColumns.has(hoveredColumn)) {
        this.expandTimer = setTimeout(() => {
          this.collapsedColumns.delete(hoveredColumn!);

          // Force CDK to recalculate drop zones after expansion
          this.cdr.detectChanges();
          setTimeout(() => {
            this.refreshCdkDropZones();
          }, 50);
        }, 500);
      }
    }
  }

  isDragHoveringOverColumn(columnStatus: string): boolean {
    return this.isDragging && this.dragHoveringColumn === columnStatus;
  }

  onDragOver(columnStatus: string): void {
    if (!this.isDragging) return;

    // Only on mobile (below 768px)
    if (window.innerWidth >= 768) return;

    if (this.hoveringColumn !== columnStatus) {
      this.clearExpandTimer();
      this.hoveringColumn = columnStatus;

      // Start timer to expand this column (only one at a time)
      this.expandTimer = setTimeout(() => {
        // Collapse all other columns first
        ['todo', 'in-progress', 'done'].forEach(status => {
          if (status !== columnStatus) {
            this.collapsedColumns.add(status);
          }
        });

        // Then expand the target column
        this.collapsedColumns.delete(columnStatus);
        console.log('Expanded column:', columnStatus);

        // Force CDK to recalculate drop zones after expansion
        this.cdr.detectChanges();
        setTimeout(() => {
          this.refreshCdkDropZones();
        }, 50);
      }, 1000); // Reduced from 2000ms to 1000ms for better responsiveness
    }
  }

  onDragLeave(columnStatus: string): void {
    if (!this.isDragging) return;

    // Only on mobile (below 768px)
    if (window.innerWidth >= 768) return;

    // Re-collapse this column when drag leaves (unless it was expanded)
    if (this.hoveringColumn === columnStatus) {
      this.clearExpandTimer();
      this.hoveringColumn = null;
      // Re-collapse if it wasn't permanently expanded
      this.collapsedColumns.add(columnStatus);
    }
  }

  private clearExpandTimer(): void {
    if (this.expandTimer) {
      clearTimeout(this.expandTimer);
      this.expandTimer = null;
    }
  }

  isColumnCollapsed(columnStatus: string): boolean {
    return this.collapsedColumns.has(columnStatus) || this.manuallyCollapsedColumns.has(columnStatus);
  }

  onTaskMoved({ taskId, newIndex, newStatus, oldIndex }: { taskId: number, newIndex: number, newStatus: string, oldIndex: number }): void {

    // Perform optimistic update to prevent visual jump
    const currentTasks = [...this.tasks$.value];
    const taskToMove = currentTasks.find(task => task.id === taskId);

    if (taskToMove) {
      // Override drop target if we detected a different hover column (for collapsed columns)
      let actualNewStatus = newStatus;
      if (this.dragHoveringColumn && this.dragHoveringColumn !== newStatus) {
        actualNewStatus = this.dragHoveringColumn;
      }

      // If dropping on collapsed column, place at end of that column's tasks
      let finalIndex = newIndex;
      if (this.collapsedColumns.has(actualNewStatus)) {
        const tasksInTargetColumn = currentTasks.filter(task => task.status === actualNewStatus);
        finalIndex = tasksInTargetColumn.length; // Place at end
      }

      // Update the task's status and position optimistically
      const updatedTask = { ...taskToMove, status: actualNewStatus as 'todo' | 'in-progress' | 'done', order: finalIndex };
      const updatedTasks = currentTasks.map(task =>
        task.id === taskId ? updatedTask : task
      );

      // Update the UI immediately
      this.tasks$.next(updatedTasks);

      // Then make the API call
      this.taskService.moveTask(taskId, actualNewStatus, finalIndex).subscribe({
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

  private refreshCdkDropZones(): void {
    // Force CDK to recalculate by triggering scroll events and reflows
    const dropLists = document.querySelectorAll('.cdk-drop-list');
    dropLists.forEach(list => {
      const element = list as HTMLElement;
      // Force a reflow by accessing offsetHeight and applying transform
      const height = element.offsetHeight;
      element.style.transform = 'translateZ(0)';

      // Reset transform after brief delay to complete the refresh
      setTimeout(() => {
        element.style.transform = '';
        // Trigger another reflow
        const newHeight = element.offsetHeight;
      }, 10);
    });

    // Force a scroll event to trigger CDK recalculation
    // This mimics what happens when the user scrolls
    setTimeout(() => {
      const scrollEvent = new Event('scroll', { bubbles: true });
      window.dispatchEvent(scrollEvent);

      // Also trigger on the board container
      const boardContainer = document.querySelector('.board');
      if (boardContainer) {
        boardContainer.dispatchEvent(scrollEvent);
      }
    }, 60);
  }

  private scrollToColumn(columnStatus: string): void {
    console.log('Scrolling to column:', columnStatus);
    // Force a DOM update by triggering change detection
    this.cdr.detectChanges();

    if (this.manuallyCollapsedColumns.has(columnStatus)) {
      this.manuallyCollapsedColumns.delete(columnStatus);
    }

    // Find the target column element
    const columnElement = document.querySelector(`[data-column="${columnStatus}"]`) as HTMLElement;
    if (columnElement) {
      // Force a reflow to ensure we get the current position
      const height = columnElement.offsetHeight;

      // Smooth scroll to bring the column to the top of the viewport
      const rect = columnElement.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - 20; // 20px padding from top

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }

  toggleColumnCollapse(columnStatus: string): void {
    // On mobile, implement "only one column expanded at a time" behavior
    if (window.innerWidth < 768) {
      if (this.collapsedColumns.has(columnStatus)) {
        // Expanding this column - collapse all others first
        ['todo', 'in-progress', 'done'].forEach(status => {
          if (status !== columnStatus) {
            this.collapsedColumns.add(status);
          }
        });
        // Then expand the target column
        this.collapsedColumns.delete(columnStatus);
      } else {
        // Collapsing this column - just add it to collapsed set
        this.collapsedColumns.add(columnStatus);
      }
    } else {
      // Desktop behavior - use manual collapse state
      if (this.manuallyCollapsedColumns.has(columnStatus)) {
        this.manuallyCollapsedColumns.delete(columnStatus);
      } else {
        this.manuallyCollapsedColumns.add(columnStatus);
      }
    }
    this.cdr.detectChanges();
  }

  isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  // Initialize mobile state tracking on component init
  ngAfterViewInit(): void {
    this.wasMobileView = this.isMobileView();

    // On mobile, start with all columns collapsed
    if (this.isMobileView()) {
      this.initializeMobileColumnState();
    }
  }

  private initializeMobileColumnState(): void {
    // Collapse all columns on mobile
    ['todo', 'in-progress', 'done'].forEach(status => {
      this.collapsedColumns.add(status);
    });
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearExpandTimer();
  }
}