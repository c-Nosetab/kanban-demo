import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PWAService } from '../../services/pwa.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install.html',
  styleUrls: ['./pwa-install.scss']
})
export class PWAInstallComponent implements OnInit, OnDestroy {
  showInstallPrompt = false;
  showOfflineStatus = true;
  isOnline = navigator.onLine;
  isStandalone = false;
  offlineStatusFadeOut = false;

  private destroy$ = new Subject<void>();
  private offlineTimeout: any;

  constructor(private pwaService: PWAService) {}

  ngOnInit(): void {
    // Check if can show install prompt
    setTimeout(() => {
      this.showInstallPrompt = this.pwaService.canInstall() && !this.isInstallDismissed();
    }, 3000); // Show after 3 seconds

    // Check if running as PWA
    this.isStandalone = this.pwaService.isRunningStandalone();

    // Listen to online/offline status
    this.pwaService.online$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOnline) => {
        this.isOnline = isOnline;
        
        // When going offline, show status and set auto-hide timer
        if (!isOnline) {
          this.showOfflineStatus = true;
          this.offlineStatusFadeOut = false;
          this.clearOfflineTimeout();
          this.offlineTimeout = setTimeout(() => {
            this.hideOfflineStatus();
          }, 3000); // Hide after 3 seconds
        } else {
          // When back online, hide immediately
          this.clearOfflineTimeout();
          this.hideOfflineStatus();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearOfflineTimeout();
  }

  private clearOfflineTimeout(): void {
    if (this.offlineTimeout) {
      clearTimeout(this.offlineTimeout);
      this.offlineTimeout = null;
    }
  }

  hideOfflineStatus(): void {
    this.offlineStatusFadeOut = true;
    // Wait for animation to complete before hiding
    setTimeout(() => {
      this.showOfflineStatus = false;
      this.offlineStatusFadeOut = false;
    }, 300); // Match CSS animation duration
  }

  async installApp(): Promise<void> {
    const installed = await this.pwaService.showInstallPrompt();
    if (installed) {
      this.showInstallPrompt = false;
      this.setInstallDismissed(true);
    }
  }

  dismissPrompt(): void {
    this.showInstallPrompt = false;
    this.setInstallDismissed(true);
  }

  private isInstallDismissed(): boolean {
    return localStorage.getItem('kanban-install-dismissed') === 'true';
  }

  private setInstallDismissed(dismissed: boolean): void {
    localStorage.setItem('kanban-install-dismissed', dismissed.toString());
  }
}