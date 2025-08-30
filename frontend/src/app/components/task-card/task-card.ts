import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { TaskService } from '../../services/task.service';
import { Modal } from '../modal/modal';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, Modal],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.scss']
})
export class TaskCardComponent implements OnInit, OnDestroy {
  @Input() task!: Task;
  @Input() isNew: boolean = false;
  @Input() isDeleteModalOpen: boolean = false;

  deleteIsLoading: boolean = false;
  deleteModalInput: string = '';

  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<void>();
  @Output() taskView = new EventEmitter<Task>();

  @ViewChild(Modal) modalRef!: Modal;
  @ViewChild(CdkDrag) cdkDrag!: CdkDrag;

  constructor(
    private taskService: TaskService,
    private elementRef: ElementRef,
  ) { }

  ngOnInit() {
    if (this.isNew) {
      this.animateIn();
    }
  }

  ngOnDestroy() {
    // No cleanup needed
  }

  handleTaskClick(): void {
    this.taskView.emit(this.task);
  }

  onEdit(): void {
    this.taskEdit.emit(this.task);
  }

  openDeleteModal(): void {
    this.isDeleteModalOpen = true;
  }

  onDeleteModalInputChange(event: Event): void {
    this.deleteModalInput = (event.target as HTMLInputElement).value;
  }

  onDeleteModalConfirm(): void {
    this.onDelete();
  }

  onDeleteModalCancel(): void {
    this.isDeleteModalOpen = false;
  }

  onDelete(): void {
    this.deleteIsLoading = true;

    this.taskService.deleteTask(this.task.id!).subscribe({
      next: () => {
        this.deleteIsLoading = false;
        this.modalRef.closeAfterSuccess();
        setTimeout(() => {
          this.taskDelete.emit();
        }, 290);
      },
      error: () => {
        this.deleteIsLoading = false;
      }
    });
  }

  getPriorityClass(): string {
    return `priority-${this.task.priority}`;
  }

  getPriorityIcon(): string {
    switch (this.task.priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return new Date(this.task.dueDate) < new Date() && this.task.status !== 'done';
  }

  isDone(): boolean {
    return this.task.status === 'done';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  private animateIn() {
    const element = this.elementRef.nativeElement;

    // Set initial state
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';

    // Trigger animation after a small delay to ensure DOM is ready
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      element.style.opacity = '';
      element.style.transform = '';
      element.style.transition = '';
    }, 300);
  }

  // Called when drag actually starts
  onDragStart(): void {
    // Drag started - no action needed
  }

  // Called when drag ends
  onDragEnd(): void {
    // Drag ended - no action needed
  }
}