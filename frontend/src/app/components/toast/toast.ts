import { LoremIpsum } from 'lorem-ipsum';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, SetToastObject } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toast',
  imports: [CommonModule, MatIconModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss']
})
export class Toast implements OnInit, OnDestroy {
  toasts: SetToastObject[] = [];
  private bottomToastTimeout: any = null;
  private isHovered = false;
  private remainingTime = 4000;

  lorem = new LoremIpsum({
    wordsPerSentence: {
      max: 10,
      min: 5
    }
  });

  private subscription: Subscription = new Subscription();
  private showToastsSubscription: Subscription = new Subscription();

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.newToast.subscribe((toast: SetToastObject | undefined) => {
      if (toast === undefined) return;

      const id = Math.random().toString(36).substring(2, 11);
      toast._ = {};
      toast._.id = id;
      toast._.displayText = toast.text.length > 30 ? `${toast.text.slice(0, 30)}...` : toast.text;

      this.addToast(toast);
    });

    this.showToastsSubscription = this.toastService.showToasts$.subscribe((showToasts) => {
      if (showToasts) {
        this.testToast();
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.showToastsSubscription.unsubscribe();

    // Clear timeout
    if (this.bottomToastTimeout) {
      clearTimeout(this.bottomToastTimeout);
    }
  }

  // #region Toast Methods

  addToast(toast: SetToastObject) {
    this.toasts.push(toast);

    // Show toast with CSS class after a tiny delay to ensure DOM update
    setTimeout(() => {
      const element = document.getElementById(toast._!.id!);
      if (element) {
        element.classList.add('show');
      }

      // If this is the first toast, start the auto-remove timer
      if (this.toasts.length === 1) {
        this.startBottomToastTimer();
      }
    }, 10);
  }

  removeToast(toastId: string, isBottomToast = false) {
    const toastIndex = this.toasts.findIndex(t => t._?.id === toastId);
    if (toastIndex === -1) return;

    const element = document.getElementById(toastId);
    if (element) {
      // Clear any existing translateY transforms before animating
      if (!isBottomToast) {
        element.style.transform = '';
        element.style.transition = '';
      }
      
      // Use downward animation for bottom toast, regular hide for clicked toasts
      element.classList.add(isBottomToast ? 'hide-down' : 'hide');

      if (isBottomToast) {
        // Get the height of the toast being removed
        const toastHeight = element.offsetHeight;
        const gap = 10; // Match the CSS gap
        const moveDistance = toastHeight + gap;

        // Move all remaining toasts down by the same amount
        const remainingToasts = this.toasts.slice(1); // Skip the bottom toast
        remainingToasts.forEach((toast) => {
          const otherElement = document.getElementById(toast._!.id!);
          if (otherElement) {
            otherElement.style.transform = `translateY(${moveDistance}px)`;
            otherElement.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          }
        });

        // Wait for remaining toast animations to complete
        setTimeout(() => {
          // Reset remaining toasts to their natural positions
          remainingToasts.forEach(toast => {
            const otherElement = document.getElementById(toast._!.id!);
            if (otherElement) {
              // Make the reset instant (0s transition)
              otherElement.style.transition = 'transform 0s';
              otherElement.style.transform = 'translateY(0)';

              // Restore normal transition after reset
              setTimeout(() => {
                otherElement.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              }, 10);
            }
          });

          // Remove from array immediately after resetting positions
          this.toasts.splice(toastIndex, 1);

          // Start timer for new bottom toast
          if (this.toasts.length > 0) {
            this.startBottomToastTimer();
          }
        }, 450); // Wait for translateY animations to complete

        // Remove bottom toast from DOM after its slide-down animation completes
        setTimeout(() => {
          // The element should be cleaned up automatically by Angular when removed from array
          // But we can force cleanup if needed
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        }, 500); // Give extra time for slide-down animation
      } else {
        // For clicked toasts, remove normally
        setTimeout(() => {
          this.toasts.splice(toastIndex, 1);

          // If we removed the bottom toast, start timer for new bottom toast
          if (toastIndex === 0 && this.toasts.length > 0) {
            this.startBottomToastTimer();
          }
        }, 400);
      }
    }
  }

  removeAllToasts() {
    // Clear timeout
    if (this.bottomToastTimeout) {
      clearTimeout(this.bottomToastTimeout);
      this.bottomToastTimeout = null;
    }

    // Animate all toasts down with staggered timing
    this.toasts.forEach((toast, index) => {
      setTimeout(() => {
        const element = document.getElementById(toast._!.id!);
        if (element) {
          element.classList.add('hide-down');
        }
      }, index * 50); // 100ms stagger between each toast
    });

    // Clear array after all animations complete
    const totalAnimationTime = (this.toasts.length - 1) * 100 + 500; // stagger time + animation duration
    setTimeout(() => {
      this.toasts = [];
    }, totalAnimationTime);
  }

  private startBottomToastTimer() {
    // Clear existing timeout
    if (this.bottomToastTimeout) {
      clearTimeout(this.bottomToastTimeout);
    }

    // Reset remaining time when starting new timer
    this.remainingTime = 4000;

    // Set timer for bottom toast (first in array due to reverse flex)
    if (this.toasts.length > 0) {
      const bottomToast = this.toasts[0];
      
      this.bottomToastTimeout = setTimeout(() => {
        if (!this.isHovered) {
          this.removeToast(bottomToast._!.id!, true); // true = isBottomToast
        }
      }, this.remainingTime);
    }
  }

  onToastHover(isHovered: boolean) {
    if (this.toasts.length === 0) return;

    if (isHovered && !this.isHovered) {
      // Mouse entered - pause timer
      this.isHovered = true;
      if (this.bottomToastTimeout) {
        clearTimeout(this.bottomToastTimeout);
        this.bottomToastTimeout = null;
      }
    } else if (!isHovered && this.isHovered) {
      // Mouse left - resume timer
      this.isHovered = false;
      if (this.toasts.length > 0) {
        const bottomToast = this.toasts[0];
        this.bottomToastTimeout = setTimeout(() => {
          this.removeToast(bottomToast._!.id!, true); // true = isBottomToast
        }, this.remainingTime);
      }
    }
  }

  getToastClasses(toast: SetToastObject): string {
    const classes = ['toast', toast.type];
    if (toast.style) classes.push(toast.style);
    if (toast.outline) classes.push('outline');
    if (toast.dark) classes.push('dark');
    return classes.join(' ');
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      default: return 'notifications';
    }
  }

  // #endregion Toast Methods

  // #region Test Toast

  testToast() {
    const howMany = Math.floor(Math.random() * 4) + 1; // 1-4
    const types = ['success', 'warn', 'error', 'info'] as const;

    for (let i = 0; i < howMany; i++) {
      const randomType = types[Math.floor(Math.random() * types.length)];

      setTimeout(() => {
        this.toastService.addToast({
          text: this.lorem.generateSentences(1),
          type: randomType,
          icon: true,
        });
      }, i * 200); // Stagger by 200ms
    }
  }

  // #endregion Test Toast
}
