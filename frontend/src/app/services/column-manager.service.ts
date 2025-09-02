import { Injectable, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, distinctUntilChanged, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ColumnManagerService {
  private expandedColumnSubject = new Subject<string | null>();
  
  collapsedColumns: Set<string> = new Set();
  manuallyCollapsedColumns: Set<string> = new Set();
  wasMobileView: boolean = window.innerWidth < 768;
  expandTimer: any = null;
  scrollTimer: any = null;
  isScrolling = false;

  get expandedColumn(): Observable<string | null> {
    return this.expandedColumnSubject.asObservable();
  }

  setupExpandedColumnSubscription(cdr: ChangeDetectorRef, destroy$: Subject<void>): void {
    this.expandedColumnSubject.pipe(
      distinctUntilChanged(),
      takeUntil(destroy$)
    ).subscribe((value: string | null) => {
      this.setExpandedColumn(value);
    });
  }

  onWindowResize(cdr: ChangeDetectorRef): void {
    const currentlyMobile = window.innerWidth < 768;
    const wasMobile = this.wasMobileView;

    this.wasMobileView = currentlyMobile;

    if (wasMobile && !currentlyMobile) {
      this.manuallyCollapsedColumns.clear();
      this.collapsedColumns.clear();
      cdr.detectChanges();
    } else if (!wasMobile && currentlyMobile) {
      this.initializeMobileColumnState(cdr);
    }
  }

  isColumnCollapsed(columnStatus: string): boolean {
    return this.collapsedColumns.has(columnStatus) || this.manuallyCollapsedColumns.has(columnStatus);
  }

  toggleColumnCollapse(columnStatus: string, cdr: ChangeDetectorRef): void {
    if (window.innerWidth < 768) {
      if (this.collapsedColumns.has(columnStatus)) {
        ['todo', 'in-progress', 'done'].forEach(status => {
          if (status !== columnStatus) {
            this.collapsedColumns.add(status);
          }
        });
        this.collapsedColumns.delete(columnStatus);
        this.expandedColumnSubject.next(columnStatus);
      } else {
        this.collapsedColumns.add(columnStatus);
        this.expandedColumnSubject.next(null);
      }
    } else {
      if (this.manuallyCollapsedColumns.has(columnStatus)) {
        this.manuallyCollapsedColumns.delete(columnStatus);
      } else {
        this.manuallyCollapsedColumns.add(columnStatus);
      }
    }
    cdr.detectChanges();
  }

  isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  initializeMobileColumnState(cdr: ChangeDetectorRef): void {
    ['todo', 'in-progress', 'done'].forEach(status => {
      this.collapsedColumns.add(status);
    });
    this.expandedColumnSubject.next(null);
    cdr.detectChanges();
  }

  private setExpandedColumn(columnStatus: string | null): void {
    if (columnStatus) {
      this.scrollToExpandedColumn(columnStatus);
    }
  }

  private scrollToExpandedColumn(columnStatus: string): void {
    this.isScrolling = true;

    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }

    const columnElement = document.querySelector(`[data-column="${columnStatus}"]`) as HTMLElement;

    if (columnElement) {
      setTimeout(() => {
        const rect = columnElement.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - 20;

        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });

        this.scrollTimer = setTimeout(() => {
          this.isScrolling = false;
        }, 1000);
      }, 200);
    } else {
      this.isScrolling = false;
    }
  }

  scrollToColumn(columnStatus: string): void {
    const columnElement = document.querySelector(`[data-column="${columnStatus}"]`) as HTMLElement;
    if (columnElement) {
      const rect = columnElement.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - 20;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }

  clearExpandTimer(): void {
    if (this.expandTimer) {
      clearTimeout(this.expandTimer);
      this.expandTimer = null;
    }
  }

  clearScrollTimer(): void {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    this.isScrolling = false;
  }

  cleanup(): void {
    this.clearExpandTimer();
    this.clearScrollTimer();
  }
}