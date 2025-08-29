import { LoremIpsum } from 'lorem-ipsum';
import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService, SetToastObject } from '../../services/toast.service';
import { BehaviorSubject, debounceTime, distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import gsap from 'gsap';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toast',
  imports: [NgClass, MatIconModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss']
})
export class Toast implements OnInit, OnDestroy {
  toasts: SetToastObject[] = [];
  toastTimeout: any = null;

  buttonSubject = new Subject<boolean>();
  buttonPresent$ = new BehaviorSubject<boolean>(false);
  get buttonPresent() {
    return this.buttonPresent$.getValue();
  }

  left = 24;
  bottom = 24;
  gap = 10;

  lorem = new LoremIpsum({
    wordsPerSentence: {
      max: 10,
      min: 5
    }
  })

  animationInDuration = 1.5;
  animationOutDuration = 1;
  toastHoldDuration = 2;
  delay = 2;
  stagger = 0.05;
  easeType = 'power3.inOut';

  removalRunning = false;

  button: HTMLElement | null = null;
  toastContainer: HTMLElement | null = null;

  private destroy$ = new Subject<void>();
  private subscription: Subscription = new Subscription();
  private showToastsSubscription: Subscription = new Subscription();

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

    this.showToastsSubscription = this.toastService.showToasts$.subscribe((showToasts) => {
      if (showToasts) {
        this.testToast();
      }
    })

    this.buttonSubject.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((present) => {
      if (!this.button) {
        this.button = document.querySelector('.remove-all-toasts') as HTMLElement;
      }
      this.buttonPresent$.next(present);
    })

    this.buttonPresent$.subscribe((present) => {
      if (present) this.enterButton();
      else this.exitButton();
    })
  }

  ngAfterViewInit() {
    this.button = document.querySelector('.remove-all-toasts') as HTMLElement;
    this.toastContainer = document.querySelector('.toast-container-inner') as HTMLElement;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // #region Timeout Handlers

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

    this.toastTimeout = setTimeout(() => {
      this.removeToast();
    }, this.toastHoldDuration * 1000);
  }

  // #endregion Timeout Handlers

  // #region Toast Handlers

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
        bottom: el.getBoundingClientRect().bottom,
        top: el.getBoundingClientRect().top,
        y: Number(gsap.getProperty(el, 'y')),
      }
    });
  }

  private getMaxY() {
    const toasts = this.getToastAttrs();
    const filteredToasts = toasts.filter(t => t?.el)

    const highestY = Math.max(...filteredToasts.map((toast, i) => {
      const height = toast?.height || 0;

      const y = Math.abs(toast?.y || 0) + height + (this.gap * i) + 100 + this.bottom;
      return y;
    }));

    return Math.floor(highestY);
  }

  private getNextY() {
    const toasts = this.getToastAttrs();
    const filteredToasts = toasts.filter(t => t?.el)

    if (filteredToasts.length === 1) return 0;

    return filteredToasts.reduce((acc, toast, i) => {
      if (i === filteredToasts.length - 1) return acc;
      return acc + (toast?.height || 0) + this.gap;
    }, 0)
  }

  private finishTweens() {
    const tweens = gsap.getTweensOf(document.querySelectorAll('.toast'));
    tweens.forEach(tween => {
      tween.progress(1);
    })
    this.clearTimeout();
  }


  async addToast() {
    const toasts = this.getToastAttrs();
    const newToast = toasts?.[this.toasts.length - 1];
    if (!newToast) return;

    this.clearTimeout();

    const topGsapY = this.getNextY();

    const newToastWidth = newToast.width!;

    const yTarget = toasts.length === 1 ? 0 : topGsapY;

    gsap.set(newToast.el, {
      y: -yTarget,
      x: -newToastWidth - this.left - 50,
      display: 'flex',
    });

    gsap.to(newToast.el, {
      x: 0,
      duration: this.animationInDuration,
      ease: this.easeType,
      onComplete: () => {
        this.setToastTimeout();
      }
    });

    if (this.toasts.length > 1) this.buttonSubject.next(true);
  }

  removeToast() {
    this.finishTweens();

    const toasts = this.getToastAttrs();

    const bottomToast = toasts[0]!;
    const secondToast = toasts[1];
    const otherToastEl = toasts.filter((el, i) => i !== 0).map(el => el?.el);


    gsap.to(bottomToast.el, {
      y: bottomToast.height + this.gap + 100,
      duration: this.animationOutDuration,
      ease: this.easeType,
      onComplete: () => {
        if (!otherToastEl.length) {
          this.toasts = [];
          return;
        }
      }
    })

    if (!secondToast) {
      return
    };

    if (toasts.length <= 2) {
      this.buttonSubject.next(false);
    }

    const secondY = secondToast.y;

    gsap.to(otherToastEl, {
      y: `+=${-secondY}`,
      duration: this.animationOutDuration,
      ease: this.easeType,
      stagger: this.stagger,
      onComplete: () => {
        this.toasts.shift();

        if (this.toasts.length > 0) {
          this.setToastTimeout();
        }
      }
    })
  }

  enterButton() {
    if (!(this.button instanceof HTMLElement)) return;

    gsap.set(this.button, {
      y: 100,
      display: 'block',
    })

    if (this.toastContainer instanceof HTMLElement) {
      gsap.to(this.toastContainer, {
        y: "-=30",
        duration: 1,
        ease: 'back.inOut',
        delay: 0,
      })
    }

    gsap.to(this.button, {
      y: 0,
      duration: 0.8,
      ease: 'back.out',
      delay: 0.12,
    })

    this.buttonSubject.next(true);
  }

  exitButton() {
    if (this.toastContainer instanceof HTMLElement) {
      gsap.to(this.toastContainer, {
        y: 0,
        duration: 1.4,
        ease: 'back.inOut',
      })
    }

    if (this.buttonPresent$.getValue() || !(this.button instanceof HTMLElement)) return;

    gsap.to(this.button, {
      y: 100,
      duration: 0.8,
      ease: 'back.inOut',
      onComplete: () => {
      }
    })
  }

  removeAllToasts() {
    const toasts = this.getToastAttrs();

    this.finishTweens();

    const filteredToasts = toasts.filter(t => t?.el)
    const toastElements = filteredToasts.map(t => t?.el)

    const highestToast = this.getMaxY() + 10;

    gsap.to(toastElements, {
      y: highestToast,
      duration: this.animationOutDuration*1.5,
      ease: this.easeType,
      stagger: 0.06,
      // delay: 0.2,
      onComplete: () => {
        this.toasts = [];
      }
    })

    this.buttonSubject.next(false);
  }



  // #endregion Toast Handlers

  // #region Test Toast

  testToast() {
    this.finishTweens();

    const delay = 500;
    const startingIndex = 0;
    const howMany = Math.floor(Math.random() * 4) + 1; // 1-4

    const type = ['success', 'warn', 'error', 'info'] as ('success' | 'warn' | 'error' | 'info')[];


    for (let i = 0; i < howMany; i++) {
      const modInd = i % 4;
      const shuffledType = [...type].sort(() => Math.random() - 0.5);
      setTimeout(() => {
        this.toastService.addToast({
          text: this.lorem.generateSentences(1),
          type: shuffledType[modInd],
          icon: true,
        })
      }, delay * (startingIndex + i))
    }
  }

  // #endregion Test Toast
}
