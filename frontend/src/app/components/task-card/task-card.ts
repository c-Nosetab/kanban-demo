import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewContainerRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interface';
import { ToastService } from '../../services/toast.service';
import { TaskService } from '../../services/task.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, Modal],
  templateUrl: './task-card.html',
  styleUrls: ['./task-card.scss']
})
export class TaskCardComponent implements OnInit {
  @Input() task!: Task;
  @Input() isNew: boolean = false;
  @Input() isDeleteModalOpen: boolean = false;

  deleteIsLoading: boolean = false;
  deleteModalInput: string = '';
  
  // Long press properties for mobile drag confirmation
  private longPressTimer: number | null = null;
  private longPressDuration = 800; // milliseconds
  isDragEnabled = false;
  isLongPressing = false;
  isMobile = false;

  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<void>();
  @Output() taskView = new EventEmitter<Task>();
  @Output() dragEnabledChange = new EventEmitter<boolean>();

  @ViewChild(Modal) modalRef!: Modal;

  constructor(
    private taskService: TaskService,
    private elementRef: ElementRef,
  ) { }

  ngOnInit() {
    if (this.isNew) {
      this.animateIn();
    }
    this.checkIfMobile();
    // On desktop, drag is always enabled
    if (!this.isMobile) {
      this.isDragEnabled = true;
    }
  }

  handleTaskClick(): void {
    // Don't handle click if drag is enabled or we're in the middle of a long press
    if (this.isDragEnabled || this.isLongPressing) {
      return;
    }
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

  private checkIfMobile(): void {
    // Check if device is likely mobile based on touch support and screen size
    this.isMobile = 'ontouchstart' in window && window.innerWidth <= 768;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.isMobile) return;
    
    // Don't start long press if touching buttons
    const target = event.target as HTMLElement;
    if (target.closest('.task-actions') || target.closest('button')) {
      return;
    }

    // Prevent default behavior that might interfere with dragging
    event.preventDefault();
    this.startLongPress();
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    if (!this.isMobile) return;
    this.cancelLongPress();
  }

  @HostListener('touchmove')
  onTouchMove(): void {
    if (!this.isMobile) return;
    // Cancel long press if user moves finger (indicating scroll/navigation)
    this.cancelLongPress();
  }

  @HostListener('touchcancel')
  onTouchCancel(): void {
    if (!this.isMobile) return;
    this.cancelLongPress();
  }

  private startLongPress(): void {
    this.isLongPressing = true;
    
    this.longPressTimer = window.setTimeout(() => {
      // Long press detected - enable drag immediately
      this.isDragEnabled = true;
      this.dragEnabledChange.emit(true);
      
      // Visual feedback for successful long press
      this.elementRef.nativeElement.classList.add('drag-ready');
      
      console.log('Long press detected - drag enabled for task:', this.task.id);
      
      // Trigger drag immediately by simulating the drag start
      this.triggerDragStart();
      
      // Auto-disable drag after 8 seconds if drag hasn't completed
      setTimeout(() => {
        if (this.isDragEnabled) {
          this.disableDrag();
        }
      }, 8000);
    }, this.longPressDuration);
  }

  private triggerDragStart(): void {
    // Add a small delay to ensure the drag is properly enabled first
    setTimeout(() => {
      const cardElement = this.elementRef.nativeElement.querySelector('.task-card');
      if (cardElement) {
        // Create and dispatch a mouse event to start dragging
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: cardElement.getBoundingClientRect().left + cardElement.offsetWidth / 2,
          clientY: cardElement.getBoundingClientRect().top + cardElement.offsetHeight / 2
        });
        cardElement.dispatchEvent(mouseDownEvent);
        
        // Immediately follow with mouse move to initiate drag
        setTimeout(() => {
          const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: cardElement.getBoundingClientRect().left + cardElement.offsetWidth / 2,
            clientY: cardElement.getBoundingClientRect().top + cardElement.offsetHeight / 2 + 5
          });
          document.dispatchEvent(mouseMoveEvent);
        }, 50);
      }
    }, 100);
  }

  private cancelLongPress(): void {
    this.isLongPressing = false;
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private disableDrag(): void {
    this.isDragEnabled = false;
    this.dragEnabledChange.emit(false);
    this.elementRef.nativeElement.classList.remove('drag-ready');
  }

  // Called when drag actually starts
  onDragStart(): void {
    // Keep drag enabled during drag operation
  }

  // Called when drag ends
  onDragEnd(): void {
    if (this.isMobile) {
      // Disable drag after drag operation completes on mobile
      setTimeout(() => {
        this.disableDrag();
      }, 100);
    }
  }
}