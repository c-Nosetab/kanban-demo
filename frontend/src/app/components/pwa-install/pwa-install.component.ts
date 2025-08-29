import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PWAService } from '../../services/pwa.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-install.component.html',
  styleUrls: ['./pwa-install.component.scss']
})
export class PWAInstallComponent implements OnInit, OnDestroy {
  showInstallPrompt = false;
  showOfflineStatus = true;
  isOnline = navigator.onLine;
  isStandalone = false;

  private destroy$ = new Subject<void>();

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
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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