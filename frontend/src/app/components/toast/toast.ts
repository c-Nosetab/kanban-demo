import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService, SetToastObject } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toast',
  imports: [NgClass, MatIconModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class Toast implements OnInit, OnDestroy {
  toasts: SetToastObject[] = [];
  autoRemoveRunning = false;
  toastAdded = false;
  prevTimeline: gsap.core.Timeline | null = null;

  left = 24;
  bottom = 24;
  gap = 10;
  duration = 1;
  delay = 2;
  easeType = 'power3.inOut';

  removalRunning = false;

  private subscription: Subscription = new Subscription();

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.newToast
      .subscribe((toast: SetToastObject | undefined) => {
        if (toast === undefined) return

        const id = Math.random().toString(36).substring(2, 11);
        toast._ = {};
        toast._.id = id;
        toast._.displayText = toast.text.length > 30 ? `${toast.text.slice(0, 30)}...` : toast.text;

        this.toasts = this.toasts ? [ ...this.toasts, toast ] : [ toast ];
      })

    // NOTE - uncomment this to test toasts
    this.testToast();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  animateToastArr(forceAnimation = false, noDelay = false) {
    if (this.removalRunning && !forceAnimation) return;

    if (this.prevTimeline) {
      this.prevTimeline.progress(1);
      this.prevTimeline.kill();
    }

    let toastEls = Array.from(document.querySelectorAll('.toast'));

    toastEls = toastEls.filter((el) => {
      const id = el.getAttribute('id');
      const inArray = this.toasts.some((toast) => toast?._?.id === id);
      const wasRemoved = el.classList.contains('removing');
      return inArray && !wasRemoved; // Exclude removing toasts
    });

    if (toastEls.length === 0) return;

    const timeline = gsap.timeline({
      onComplete: () => {
        this.scanForAutoDismiss();
      }
    });

    const newEl = toastEls.find(el => !el.classList.contains('has-appeared')) as HTMLDivElement;

    // Set initial position for new toast only if there is one
    if (newEl) {
      const otherEls = toastEls.filter(el => el !== newEl);
      const sum = otherEls.reduce((acc, el) => acc + el.clientHeight + this.gap, 0) * -1;

      timeline.set(newEl, {
        x: -newEl.clientWidth - 24,
        y: sum,
      }, 0);
    }

    let curHeightDelta = 0;

    toastEls.forEach((toastEl, i) => {
      const targetY = -curHeightDelta;
      const delay = noDelay ? 0 : 0.05 * i;

      if (toastEl === newEl) {
        // New toast - animate it in
        timeline.to(toastEl, {
          x: 0,
          y: targetY,
          duration: 1,
          ease: 'power1.inOut',
          onComplete: () => {
            toastEl.classList.add('has-appeared');
          }
        }, delay);
      } else if (!toastEl.classList.contains('has-appeared')) {
        // Position other toasts instantly
        timeline.set(toastEl, {
          x: 0,
          y: targetY,
          onComplete: () => {
            toastEl.classList.add('has-appeared');
          }
        }, delay);
      } else {
        // Existing toasts - only reposition if needed
        const currentY = gsap.getProperty(toastEl, 'y');
        if (currentY !== targetY) {
          timeline.to(toastEl, {
            x: 0,
            y: targetY,
            duration: this.duration,
            ease: 'power1.inOut',
          }, delay);
        }
      }
      curHeightDelta += toastEl.clientHeight + this.gap;
    });

    this.prevTimeline = timeline;
  }

  dismissToast(toast: Element, bottomToast = false) {
    toast.classList.add('removing');

    return new Promise((resolve) => {
      this.removalRunning = true;

      if (bottomToast) {
        gsap.to(toast, {
          x: 0,
          y: toast.clientHeight + 100,
          duration: 0.6,
          ease: 'power1.inOut',
        });
      } else {
        gsap.to(toast, {
          x: (toast.clientWidth + 24) * -1,
          duration: 0.6,
          ease: 'power1.inOut',
        });
      }

      setTimeout(() => {
        this.autoRemoveRunning = false;
        resolve(true);
      }, 550)
    });
  }

  async removeToast($event: Event, toast: SetToastObject) {
    $event.stopPropagation();

    const toastEls = Array.from(document.querySelectorAll('.toast'));
    const target = toastEls.find((el) => el.getAttribute('id') === toast?._?.id);

    if (!target) return;

    let lastToast = false;
    const targetY = gsap.getProperty(target, 'y');
    if (toastEls.length === 1 || targetY === 0) {
      lastToast = true;
    }

    // Remove from array and dismiss toast
    this.toasts = this.toasts.filter((t) => t?._?.id !== toast?._?.id);

    await this.dismissToast(target, lastToast);

    // After dismiss is complete, animate remaining toasts
    if (this.toasts.length > 0) {
      this.animateToastArr(true, true);
    }

    this.removalRunning = false;
  }

  scanForAutoDismiss() {
    const toastEls = Array.from(document.querySelectorAll('.toast'));
    const toasts = this.toasts;

    if (toasts.length === 0) return;

    const lastAutoRemovableToast = toasts.find((toast) => toast.dismissible === false);

    if (lastAutoRemovableToast && !this.autoRemoveRunning) {
      this.autoRemoveRunning = true;
      setTimeout(() => {
        this.removeToast(new Event('click'), lastAutoRemovableToast);
      }, 1000 * 3);
    }
  }

  testToast() {
    this.toastService.addToast({
      text: 'Loading ... 1',
      type: 'success',
      icon: true,
      dismissible: false,
    })

    setTimeout(() => {
      this.toastService.addToast({
        text: 'Loading ... 2',
        type: 'info',
        icon: true,
        dismissible: false,
      })
    }, 1000 * 1)
    // setTimeout(() => {
    //   this.toastService.addToast({
    //     text: 'Loading ... 3', type: 'warn', icon: true, dismissible: false,
    //   })
    // }, 1000 * 1.8)
    // setTimeout(() => {
    //   this.toastService.addToast({
    //     text: 'Loading... 4', type: 'error', icon: true, dismissible: false,
    //   })
    // }, 1000 * 4)
  }

  @ViewChild('elementToCheck') set elementToCheck(elementToCheck: any) {
    this.animateToastArr();
  }


}
