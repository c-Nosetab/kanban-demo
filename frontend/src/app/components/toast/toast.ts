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

        const id = Math.random().toString(36).substr(2, 9);
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

  animateToastArr(
    forceAnimation = false, setDurToZero = false, addedElement?: Element, noDelay = false,
  ) {
    console.log("HERE")
    if ((this.removalRunning) && !forceAnimation) return;
    // set all active tweens to completed state
    gsap.killTweensOf('.toast');

    let toastEls = Array.from(document.querySelectorAll('.toast'));

    toastEls = toastEls.filter((el) => {
      const id = el.getAttribute('id');
      const inArray = this.toasts.some((toast) => toast?._?.id === id);
      const wasRemoved = el.classList.contains('removing');
      return inArray && !wasRemoved;
    });

    if (toastEls.length === 0) return;


    const newEl = toastEls[0] as HTMLDivElement;
    const hasAppeared = newEl.classList.contains('has-appeared');

    if (!hasAppeared) {
      const otherEls = toastEls.slice(1);
      const sum = otherEls.reduce((acc, el) => acc + el.clientHeight + this.gap, 0) * -1;

      gsap.set(newEl, {
        x: -newEl.clientWidth - 24,
        y: sum,
      })
    }

    let curHeightDelta = 0;

    // Calculate positions for all toasts, but only animate the new one
    toastEls.forEach((toastEl, i) => {
      const targetY = -curHeightDelta;
      const toastItem = this.toasts.find((toast) => toast?._?.id === toastEl.getAttribute('id'));

      if (toastEl === newEl && !hasAppeared) {

        // New toast - animate it in from the left
        gsap.to(toastEl, {
          x: 0,
          y: targetY === -0 ? 0 : targetY,
          duration: 1,
          delay: 0,
          ease: 'power1.inOut',
        });
      } else if (!toastEl.classList.contains('has-appeared')) {
        // Position other toasts that haven't been positioned yet
        gsap.set(toastEl, {
          x: 0,
          y: targetY,
        });
        toastEl.classList.add('has-appeared');
      } else {
        gsap.to(toastEl, {
          x: 0,
          y: targetY === -0 ? 0 : targetY,
          duration: this.duration,
          delay: noDelay ? 0 : 0.05 * i,
          ease: 'power1.inOut',
        });
      }
      curHeightDelta += toastEl.clientHeight + this.gap;
    });
    newEl.classList.add('has-appeared')

    this.scanForAutoDismiss();
  }

  dismissToast(toast: Element, bottomToast = false) {
    toast.classList.add('removing');

    return new Promise((resolve) => {
      console.log('dismissToast');
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

      this.animateToastArr(false, false, undefined, true);
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

    await this.dismissToast(target, lastToast);

    const filteredToasts = this.toasts.filter((t) => t?._?.id !== toast?._?.id);
    this.toasts = filteredToasts;
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
    this.animateToastArr(
      false, false, elementToCheck,
    );
  }


}
