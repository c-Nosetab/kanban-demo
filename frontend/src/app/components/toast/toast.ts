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
  toastTimeout: any = null;

  left = 24;
  bottom = 24;
  gap = 10;
  animationDuration = 1;
  toastHoldDuration = 2;
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

        this.toasts = this.toasts ? [...this.toasts, toast] : [toast];

        setTimeout(() => {
          this.addToast();
        }, 0);
      })

    // NOTE - uncomment this to test toasts
    this.testToast();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  clearTimeout() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  setToastTimeout() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }

    const date = new Date();
    this.toastTimeout = setTimeout(() => {
      this.removeToast();
      const diff = new Date().getTime() - date.getTime();
      const diffInSeconds = diff / 1000;
      console.log('🚀 - diffInSeconds:', diffInSeconds);
    }, this.toastHoldDuration * 1000);
  }

  private getToastAttrs() {
    const toastEls = Array.from(document.querySelectorAll('.toast'));

    return this.toasts.map((toast, i) => {
      const id = toast._!.id!;
      const el = toastEls.find(el => el.id === id);

      if (!el) return null;

      return {
        index: i,
        id: id,
        el: el,
        height: el.clientHeight,
        width: el.clientWidth,
        y: Number(gsap.getProperty(el, 'y')),
      }
    });
  }


  addToast() {
    const toasts = this.getToastAttrs();
    const newToast = toasts?.[this.toasts.length - 1];
    if (!newToast) return;

    this.clearTimeout();

    const topToast = toasts[toasts.length - 2];
    const topGsapY = Math.abs(topToast?.y || 0);

    const newToastHeight = newToast.height!;
    const newToastWidth = newToast.width!;

    const yTarget = topToast ? topGsapY + newToastHeight + this.gap : 0;

    gsap.set(newToast.el, {
      y: -yTarget,
      x: -newToastWidth - this.left - 50,
    });

    gsap.to(newToast.el, {
      x: 0,
      duration: this.animationDuration,
      ease: this.easeType,
      onComplete: () => {
        this.setToastTimeout();
      }
    });
  }

  removeToast() {
    this.clearTimeout();

    const toasts = this.getToastAttrs();

    const bottomToast = toasts[0]!;
    const secondToast = toasts[1];
    const otherToastEl = toasts.filter((el, i) => i !== 0).map(el => el?.el);


    gsap.to(bottomToast.el, {
      y: bottomToast.height + this.gap + 100,
      duration: this.animationDuration,
      ease: this.easeType,
      onComplete: () => {
        if (!otherToastEl.length) {
          this.toasts = [];
          return;
        }
      }
    })


    if (!secondToast) return;

    const secondY = secondToast.y;

    gsap.to(otherToastEl, {
      y: `+=${-secondY}`,
      duration: this.animationDuration,
      ease: this.easeType,
      stagger: 0.1,
      onComplete: () => {
        this.toasts.shift();

        if (this.toasts.length > 0) {
          this.setToastTimeout();
        }
      }
    })
  }

  testToast() {
    const delay = 1000;
    const startingIndex = 0
    setTimeout(() => {
      this.toastService.addToast({
        text: 'Loading ... 1',
        type: 'success',
        icon: true,
      })
    }, delay * startingIndex)


    setTimeout(() => {
      this.toastService.addToast({
        text: 'Loading ... 2',
        type: 'info',
        icon: true,
        outline: true,
      })
    }, delay * (startingIndex + 1))
    setTimeout(() => {
      this.toastService.addToast({
        text: 'Loading ... 3', type: 'warn', icon: true,
      })
    }, delay * (startingIndex + 2))
    setTimeout(() => {
      this.toastService.addToast({
        text: 'Loading... 4', type: 'error', icon: true,
      })
    }, delay * (startingIndex + 3))
  }

  // @ViewChild('elementToCheck') set elementToCheck(elementToCheck: any) {
  //   this.addToast();
  // }
}
