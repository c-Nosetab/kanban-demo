import { Injectable, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Task } from '../models/task.interface';
import { TaskService } from './task.service';
import { ToastService } from './toast.service';
import { ColumnManagerService } from './column-manager.service';

@Injectable({
  providedIn: 'root'
})
export class BoardDragDropService {
  isDragging = false;
  hoveringColumn: string | null = null;
  draggedFromColumn: string | null = null;
  dragHoveringColumn: string | null = null;
  private isProcessingMove = false;

  constructor(
    private taskService: TaskService,
    private toastService: ToastService,
    private columnManager: ColumnManagerService
  ) {}

  onDragStart(): void {
    this.isDragging = true;
  }

  onDragEnd(cdr: ChangeDetectorRef): void {
    const targetColumn = this.dragHoveringColumn;
    this.isDragging = false;
    this.columnManager.clearExpandTimer();
    this.columnManager.clearScrollTimer();

    if (window.innerWidth < 768 && targetColumn) {
      ['todo', 'in-progress', 'done'].forEach(status => {
        this.columnManager.collapsedColumns.add(status);
      });

      this.columnManager.collapsedColumns.delete(targetColumn);
      this.columnManager.expandedColumn.pipe().subscribe(() => {
        // Handle expanded column
      });
    }

    setTimeout(() => {
      this.hoveringColumn = null;
      this.draggedFromColumn = null;
      this.dragHoveringColumn = null;

      if (window.innerWidth < 768 && targetColumn) {
        setTimeout(() => {
          this.columnManager.scrollToColumn(targetColumn);
        }, 400);
      }
    }, 100);
  }

  onDragMoved(columnStatus: string, event: any, cdr: ChangeDetectorRef): void {
    if (!this.isDragging) return;

    if (window.innerWidth >= 768) return;

    if (!this.draggedFromColumn) {
      this.draggedFromColumn = columnStatus;
    }

    const dragPosition = event.pointerPosition;

    const columnElement = document.querySelector(`[data-column="${columnStatus}"]`) as HTMLElement;
    if (columnElement && this.draggedFromColumn === columnStatus) {
      const rect = columnElement.getBoundingClientRect();
      const isOutsideColumn = dragPosition.x < rect.left ||
                             dragPosition.x > rect.right ||
                             dragPosition.y < rect.top ||
                             dragPosition.y > rect.bottom;

      if (isOutsideColumn) {
        if (this.columnManager.collapsedColumns.size === 0) {
          ['todo', 'in-progress', 'done'].forEach(status => {
            this.columnManager.collapsedColumns.add(status);
          });
        } else {
          const expandedColumns = new Set<string>();

          ['todo', 'in-progress', 'done'].forEach(status => {
            if (!this.columnManager.collapsedColumns.has(status)) {
              expandedColumns.add(status);
            }
          });

          ['todo', 'in-progress', 'done'].forEach(status => {
            this.columnManager.collapsedColumns.add(status);
          });

          expandedColumns.forEach(status => {
            this.columnManager.collapsedColumns.delete(status);
          });
        }
      }
    }

    this.checkColumnHover(dragPosition, cdr);
  }

  private checkColumnHover(dragPosition: { x: number, y: number }, cdr: ChangeDetectorRef): void {
    const columns = ['todo', 'in-progress', 'done'];
    let hoveredColumn: string | null = null;
    let bestMatch: { column: string; distance: number } | null = null;

    for (const status of columns) {
      const columnElement = document.querySelector(`[data-column="${status}"]`) as HTMLElement;
      if (columnElement) {
        const rect = columnElement.getBoundingClientRect();
        const padding = 20;

        const centerX = (rect.left + rect.right) / 2;
        const centerY = (rect.top + rect.bottom) / 2;

        let top = rect.top;
        let bottom = rect.bottom;

        if (this.isDragging) {
          if (this.columnManager.collapsedColumns.has(status)) {
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
            top = rect.top;
            bottom = rect.bottom;
          }
        }

        const isExpanded = !this.columnManager.collapsedColumns.has(status);
        const inBounds = dragPosition.x >= (rect.left - padding) &&
                        dragPosition.x <= (rect.right + padding) &&
                        dragPosition.y >= (top - padding) &&
                        dragPosition.y <= (bottom + padding);

        if (inBounds) {
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

    if (hoveredColumn !== this.dragHoveringColumn) {
      this.dragHoveringColumn = hoveredColumn;
    }

    if (hoveredColumn !== this.hoveringColumn) {
      this.columnManager.clearExpandTimer();

      const previousColumn = this.hoveringColumn;

      if (previousColumn && !this.columnManager.collapsedColumns.has(previousColumn) && hoveredColumn !== previousColumn) {
        const columnToCollapse = previousColumn;
        setTimeout(() => {
          if (this.hoveringColumn !== columnToCollapse && !this.columnManager.isScrolling) {
            this.columnManager.collapsedColumns.add(columnToCollapse);
          }
        }, this.columnManager.isScrolling ? 1500 : 300);
      }

      this.hoveringColumn = hoveredColumn;

      if (hoveredColumn && this.columnManager.collapsedColumns.has(hoveredColumn)) {
        this.columnManager.expandTimer = setTimeout(() => {
          ['todo', 'in-progress', 'done'].forEach(status => {
            if (status !== hoveredColumn) {
              this.columnManager.collapsedColumns.add(status);
            }
          });

          this.columnManager.collapsedColumns.delete(hoveredColumn!);

          cdr.detectChanges();
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

  onDragOver(columnStatus: string, cdr: ChangeDetectorRef): void {
    if (!this.isDragging) return;

    if (window.innerWidth >= 768) return;

    if (this.hoveringColumn !== columnStatus) {
      this.columnManager.clearExpandTimer();
      this.hoveringColumn = columnStatus;

      if (this.columnManager.collapsedColumns.has(columnStatus)) {
        this.columnManager.expandTimer = setTimeout(() => {
          ['todo', 'in-progress', 'done'].forEach(status => {
            if (status !== columnStatus) {
              this.columnManager.collapsedColumns.add(status);
            }
          });

          this.columnManager.collapsedColumns.delete(columnStatus);

          cdr.detectChanges();
          setTimeout(() => {
            this.refreshCdkDropZones();
          }, 50);
        }, 2000);
      }
    }
  }

  onDragLeave(columnStatus: string): void {
    if (!this.isDragging) return;

    if (window.innerWidth >= 768) return;

    if (this.hoveringColumn === columnStatus) {
      this.columnManager.clearExpandTimer();
      this.hoveringColumn = null;
      if (!this.columnManager.isScrolling) {
        setTimeout(() => {
          if (!this.columnManager.isScrolling) {
            this.columnManager.collapsedColumns.add(columnStatus);
          }
        }, 100);
      }
    }
  }

  private generateUpdatedTask(tasks: Task[], taskId: number, newStatus: string, newIndex: number): Task | undefined {
    if (this.isProcessingMove) {
      return;
    }

    const currentTasks = [...tasks];
    const taskToMove = currentTasks.find(task => task.id === taskId);

    if (taskToMove) {
      let actualNewStatus = newStatus;
      if (this.dragHoveringColumn && this.dragHoveringColumn !== newStatus) {
        actualNewStatus = this.dragHoveringColumn;
      }

      let finalIndex = newIndex;
      if (this.columnManager.collapsedColumns.has(actualNewStatus)) {
        const tasksInTargetColumn = currentTasks.filter(task => task.status === actualNewStatus);
        finalIndex = tasksInTargetColumn.length;
      }

      if (taskToMove.status === actualNewStatus && taskToMove.order === finalIndex) {
        console.log('Task dropped in same position - no API call needed');
        return;
      }

      const updatedTask = { ...taskToMove, status: actualNewStatus as 'todo' | 'in-progress' | 'done', order: finalIndex };
      return updatedTask;
    }

    return undefined;
  }

  private reorderTasks(tasks: Task[], updatedTask: Task, insertUpdated = false) {
    const clonedTasks = [...tasks];
    const updatedOrderedTasks: Task[] = [];
    const filteredTasks = clonedTasks.filter(task => task.id !== updatedTask.id);

    filteredTasks.forEach((task, i) => {
      const taskOrder = task.order;
      let newOrder = taskOrder;

      if (insertUpdated) {
        newOrder = i >= updatedTask.order ? i + 1 : i;
      } else {
        newOrder = i > updatedTask.order ? i - 1 : i;
      }

      updatedOrderedTasks.push({ ...task, order: newOrder });
    });

    if (insertUpdated) {
      updatedOrderedTasks.push(updatedTask);
    }

    return updatedOrderedTasks;
  }

  private generateNewTaskLists(updatedTask: Task, oldStatus: string, tasks: Task[]) {
    const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
    const newStatus = updatedTask.status;

    const tasksSeparatedByStatus = sortedTasks.reduce((acc, task) => {
      acc[task.status] = acc[task.status] || [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<(string), Task[]>);

    const finalTasks = new Map<string, Task[]>();

    const todoModified = newStatus === 'todo' || oldStatus === 'todo';
    const inProgressModified = newStatus === 'in-progress' || oldStatus === 'in-progress';
    const doneModified = newStatus === 'done' || oldStatus === 'done';

    if (todoModified) {
      const todoTasks = this.reorderTasks(tasksSeparatedByStatus['todo'] || [], updatedTask, newStatus === 'todo');
      finalTasks.set('todo', todoTasks);
    } else {
      finalTasks.set('todo', tasksSeparatedByStatus['todo'] || []);
    }

    if (inProgressModified) {
      const inProgressTasks = this.reorderTasks(tasksSeparatedByStatus['in-progress'] || [], updatedTask, newStatus === 'in-progress');
      finalTasks.set('in-progress', inProgressTasks);
    } else {
      finalTasks.set('in-progress', tasksSeparatedByStatus['in-progress'] || []);
    }

    if (doneModified) {
      const doneTasks = this.reorderTasks(tasksSeparatedByStatus['done'] || [], updatedTask, newStatus === 'done');
      finalTasks.set('done', doneTasks);
    } else {
      finalTasks.set('done', tasksSeparatedByStatus['done'] || []);
    }

    const finalTasksArray = Array.from(finalTasks.values());
    return finalTasksArray;
  }

  onTaskMoved(
    { taskId, newIndex, newStatus, oldStatus }:
    { taskId: number, newIndex: number, newStatus: string, oldIndex: number, oldStatus: string },
    tasks$: BehaviorSubject<Task[]>
  ): void {
    const tasks = [...tasks$.value];
    const originalTasks = [...tasks];

    const updatedTask = this.generateUpdatedTask(tasks, taskId, newStatus, newIndex);

    if (!updatedTask) return;

    const updatedTaskInOrder = this.generateNewTaskLists(updatedTask, oldStatus, tasks);
    const updatedTasks = updatedTaskInOrder.flat();

    tasks$.next(updatedTasks);

    this.isProcessingMove = true;

    this.taskService.moveTask(taskId, updatedTask.status, updatedTask.order).subscribe({
      next: (response: any) => {
        this.toastService.addToast({
          text: 'Task moved successfully into ' + updatedTask.status + '!',
          type: 'success',
          delayAdd: true,
        });

        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

        if (isProduction) {
          setTimeout(() => {
            tasks$.next(response.allTasks);
            this.isProcessingMove = false;
          }, 50);
        } else {
          tasks$.next(response.allTasks);
          this.isProcessingMove = false;
        }
      },
      error: (error) => {
        this.toastService.addToast({
          text: `Failed to move task: ${error.message}`,
          type: 'error',
          delayAdd: false,
        });
        tasks$.next(originalTasks);
        this.isProcessingMove = false;
      }
    });
  }

  private refreshCdkDropZones(): void {
    const dropLists = document.querySelectorAll('.cdk-drop-list');
    dropLists.forEach(list => {
      const element = list as HTMLElement;
      const height = element.offsetHeight;
      element.style.transform = 'translateZ(0)';

      setTimeout(() => {
        element.style.transform = '';
        const newHeight = element.offsetHeight;
      }, 10);
    });

    setTimeout(() => {
      const scrollEvent = new Event('scroll', { bubbles: true });
      window.dispatchEvent(scrollEvent);

      const boardContainer = document.querySelector('.board');
      if (boardContainer) {
        boardContainer.dispatchEvent(scrollEvent);
      }
    }, 60);
  }
}