import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, combineLatest, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { Task } from '../models/task.interface';

export interface BoardFilters {
  search: string;
  priorities: string[];
  sortBy: keyof Task;
  sortDirection: 'asc' | 'desc';
}

export interface Column {
  title: string;
  status: string;
  tasks: Task[];
}

@Injectable({
  providedIn: 'root'
})
export class BoardFilterService {
  private filters$ = new BehaviorSubject<BoardFilters>({
    search: '',
    priorities: ['low', 'medium', 'high'],
    sortBy: 'order',
    sortDirection: 'asc'
  });

  private searchSubject = new Subject<string>();
  
  sortOptions: { id: keyof Task, label: string }[] = [
    { id: 'order', label: 'Order' },
    { id: 'priority', label: 'Priority' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'title', label: 'Title' },
  ];

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

  setupSearchDebounce(destroy$: Subject<void>): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(destroy$)
    ).subscribe((value: string) => {
      this.filters$.next({
        ...this.filters$.value,
        search: value
      });
    });
  }

  createColumnsObservable(tasks$: BehaviorSubject<Task[]>, newTaskIds: Set<number>) {
    return combineLatest([tasks$, this.filters$]).pipe(
      map(([tasks, filters]) => {
        newTaskIds.clear();
        return this.computeColumns(tasks, filters);
      })
    );
  }

  private computeColumns(tasks: Task[], filters: BoardFilters): Column[] {
    const filtered = this.applyFilters(tasks, filters);
    const sorted = this.sortTasks(filtered, filters.sortBy, filters.sortDirection);

    const tasksByStatus = sorted.reduce((acc, task) => {
      acc[task.status] = acc[task.status] || [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    const todoTasks = tasksByStatus['todo'] || [];
    const inProgressTasks = tasksByStatus['in-progress'] || [];
    const doneTasks = tasksByStatus['done'] || [];

    return [
      {
        title: 'To Do',
        status: 'todo',
        tasks: todoTasks
      },
      {
        title: 'In Progress',
        status: 'in-progress',
        tasks: inProgressTasks
      },
      {
        title: 'Done',
        status: 'done',
        tasks: doneTasks
      },
    ];
  }

  private applyFilters(tasks: Task[], filters: BoardFilters): Task[] {
    let filtered = [...tasks];

    const { search, priorities } = filters;

    if (search) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (priorities && priorities.length > 0) {
      filtered = filtered.filter(task =>
        priorities.includes(task.priority)
      );
    }

    return filtered;
  }

  sortTasks(tasks: Task[], sortBy: keyof Task, sortDirection: 'asc' | 'desc'): Task[] {
    const clonedTasks = [...tasks];
    if (sortBy === 'priority') {
      const order = ['high', 'medium', 'low'];
      return clonedTasks.sort((a, b) => {
        const aIndex = order.indexOf(a.priority);
        const bIndex = order.indexOf(b.priority);
        return sortDirection === 'asc' ? aIndex - bIndex : bIndex - aIndex;
      });
    }

    if (sortBy === 'dueDate') {
      return clonedTasks.sort((a, b) => {
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
      return clonedTasks.sort((a, b) => {
        const aOrder = a.order;
        const bOrder = b.order;
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      });
    }

    if (sortBy === 'title') {
      return clonedTasks.sort((a, b) => {
        const aTitle = a.title;
        const bTitle = b.title;
        return sortDirection === 'asc' ? aTitle.localeCompare(bTitle) : bTitle.localeCompare(aTitle);
      });
    }

    return clonedTasks;
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  onPrioritySelected({ option, isSelected }: { option: string, isSelected: boolean }): void {
    if (isSelected) {
      this.filters$.next({
        ...this.filters$.value,
        priorities: this.filters$.value.priorities.filter(opt => opt !== option)
      });
    } else {
      this.filters$.next({
        ...this.filters$.value,
        priorities: [...this.filters$.value.priorities, option]
      });
    }
  }

  selectSortOption(optionId: keyof Task): void {
    this.filters$.next({
      ...this.filters$.value,
      sortBy: optionId
    });
  }

  toggleSortDirection(): void {
    const newDirection = this.selectedSortDirection === 'asc' ? 'desc' : 'asc';
    this.filters$.next({
      ...this.filters$.value,
      sortDirection: newDirection,
    });
  }

  resetFilters(): void {
    this.filters$.next({
      ...this.filters$.value,
      sortBy: 'order',
      sortDirection: 'asc',
    });
  }
}