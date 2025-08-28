import { Component, EventEmitter, Input, Output, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-modal',
  imports: [LoadingSpinner],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class Modal implements OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() isWarning: boolean = false;
  @Input() modalTitle: string = '';
  @Input() isLoading: boolean = false;
  @Input() confirmDisabled: boolean = false;
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() autoCloseOnConfirm: boolean = false;
  @Input() fitToContent: boolean = false;

  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCloseModal = new EventEmitter<void>();

  isClosing = false;
  private closingTimeout: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && !changes['isOpen'].currentValue && !this.isClosing) {
      // Modal is being closed externally (e.g., from parent component)
      this.startClosingAnimation();
    }
  }

  // Method to be called by parent component after successful action
  closeAfterSuccess() {
    return this.startClosingAnimation();
  }

  handleCancel() {
    this.startClosingAnimation();
  }

  handleConfirm() {
    console.log('handleConfirm');
    if (this.autoCloseOnConfirm) {
      this.startClosingAnimation();
    }
    this.onConfirm.emit();
  }

  onModalContentClick(event: Event): void {
    event.stopPropagation();
  }

  onBackdropClick(event: Event): void {
    this.startClosingAnimation();
  }

  private startClosingAnimation() {
    if (this.isClosing) return;

    this.isClosing = true;

    // Wait for animation to complete before emitting cancel
    this.closingTimeout = setTimeout(() => {
      this.onCancel.emit();
      this.isClosing = false;
    }, 300); // Match the CSS animation duration
  }

  ngOnDestroy() {
    if (this.closingTimeout) {
      clearTimeout(this.closingTimeout);
    }
  }

}
