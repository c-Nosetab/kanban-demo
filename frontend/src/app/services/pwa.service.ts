import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, fromEvent, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { OfflineStorageService } from './offline-storage.service';
import { ToastService } from './toast.service';
import { Task } from '../models/task.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PWAService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private deferredPrompt: any;
  private syncInProgress = false;
  private apiUrl = environment.apiUrl;

  public online$ = this.onlineSubject.asObservable();

  constructor(
    private swUpdate: SwUpdate,
    private offlineStorage: OfflineStorageService,
    private http: HttpClient,
    private toastService: ToastService,
  ) {
    this.initializeOfflineStorage();
    this.setupOnlineOfflineDetection();
    this.setupServiceWorkerUpdates();
    this.setupInstallPrompt();
    this.setupBackgroundSync();
  }

  private async initializeOfflineStorage(): Promise<void> {
    try {
      await this.offlineStorage.initialize();
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  private setupOnlineOfflineDetection(): void {
    // Listen to online/offline events
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe((isOnline) => {
      this.onlineSubject.next(isOnline);

      if (isOnline) {
        // Only show sync toast if there are pending actions
        this.checkAndSyncOfflineData();
      }
      // Offline notification is now handled by the PWA install component's orange banner
    });
  }

  private setupServiceWorkerUpdates(): void {
    if (this.swUpdate.isEnabled) {
      // Check for updates every 30 seconds
      this.swUpdate.checkForUpdate();

      // Handle available updates
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.toastService.addToast({
            text: 'New version available! Refresh to update.',
            type: 'info',
            delayAdd: false
          });
        }
      });

      // Auto-update when new version is available
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_DETECTED') {
          console.log('Downloading new app version:', event.version.hash);
        }
      });
    }
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  }

  private setupBackgroundSync(): void {
    // Sync when coming back online
    this.online$.subscribe((isOnline) => {
      if (isOnline && !this.syncInProgress) {
        setTimeout(() => this.checkAndSyncOfflineData(), 1000);
      }
    });
  }

  // Public methods
  async checkAndSyncOfflineData(): Promise<void> {
    try {
      const pendingActions = await this.offlineStorage.getPendingActions();
      if (pendingActions.length > 0) {
        this.toastService.addToast({
          text: 'Back online! Syncing data...',
          type: 'success',
          delayAdd: false
        });
        this.syncOfflineData();
      }
    } catch (error) {
      console.error('Failed to check pending actions:', error);
      // Fall back to syncing anyway in case of error
      this.syncOfflineData();
    }
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.onlineSubject.value) return;

    this.syncInProgress = true;

    try {
      // Get pending actions
      const pendingActions = await this.offlineStorage.getPendingActions();

      console.log(`[PWA Sync] Found ${pendingActions.length} pending actions to sync`);

      if (pendingActions.length === 0) {
        this.syncInProgress = false;
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each action with a delay to prevent rate limiting
      for (let i = 0; i < pendingActions.length; i++) {
        const action = pendingActions[i];

        try {
          // Add a small delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
          }

          switch (action.type) {
            case 'CREATE':
              await this.http.post<Task>(`${this.apiUrl}/tasks`, action.task).toPromise();
              break;
            case 'UPDATE':
              await this.http.put<Task>(`${this.apiUrl}/tasks/${action.task.id}`, action.task).toPromise();
              break;
            case 'DELETE':
              await this.http.delete<void>(`${this.apiUrl}/tasks/${action.task.id}`).toPromise();
              break;
            case 'MOVE':
              await this.http.put<Task>(`${this.apiUrl}/tasks/${action.task.id}/move`, {
                status: action.task.status,
                order: action.task.order
              }).toPromise();
              break;
          }

          await this.offlineStorage.markActionSynced(action.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          errorCount++;

          // If we hit rate limiting, increase delay for subsequent requests
          if (error && (error as any).status === 429) {
            console.log('Rate limit hit, increasing delay for remaining requests');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay after rate limit
          }
        }
      }

      // Clean up synced actions
      console.log(`[PWA Sync] Clearing ${successCount} synced actions from storage`);
      await this.offlineStorage.clearSyncedActions();

      // Update last sync time
      await this.offlineStorage.setLastSyncTime(Date.now());

      console.log(`[PWA Sync] Sync completed. Success: ${successCount}, Errors: ${errorCount}`);

      // Show sync results
      if (successCount > 0) {
        this.toastService.addToast({
          text: `Synced ${successCount} changes successfully!`,
          type: 'success',
          delayAdd: false
        });
      }

      if (errorCount > 0) {
        this.toastService.addToast({
          text: `Failed to sync ${errorCount} changes. Will retry later.`,
          type: 'error',
          delayAdd: false
        });
      }

    } catch (error) {
      console.error('Sync failed:', error);
      this.toastService.addToast({
        text: 'Sync failed. Will retry when connection improves.',
        type: 'error',
        delayAdd: false
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  async cacheTasksForOffline(tasks: Task[]): Promise<void> {
    try {
      await this.offlineStorage.storeTasks(tasks);
    } catch (error) {
      console.error('Failed to cache tasks:', error);
    }
  }

  async getOfflineTasks(): Promise<Task[]> {
    try {
      return await this.offlineStorage.getTasks();
    } catch (error) {
      console.error('Failed to get offline tasks:', error);
      return [];
    }
  }

  async queueOfflineAction(type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE', task: Task): Promise<void> {
    try {
      await this.offlineStorage.queueAction({ type, task });

      // Update offline cache immediately for better UX
      switch (type) {
        case 'CREATE':
          await this.offlineStorage.storeTask(task);
          break;
        case 'UPDATE':
          this.offlineStorage.storeTask(task);
          break;
        case 'MOVE':
          await this.offlineStorage.storeTask(task);
          break;
        case 'DELETE':
          await this.offlineStorage.deleteTask(task.id!);
          break;
      }
    } catch (error) {
      console.error('Failed to queue offline action:', error);
    }
  }

  async updateCachedTask(task: Task): Promise<void> {
    try {
      await this.offlineStorage.storeTask(task);
    } catch (error) {
      console.error('Failed to update cached task:', error);
    }
  }

  async clearAllPendingActions(): Promise<void> {
    try {
      await this.offlineStorage.clearAllActions();
      console.log('[PWA Service] Cleared all pending offline actions');
    } catch (error) {
      console.error('Failed to clear pending actions:', error);
    }
  }

  async refreshOfflineCache(tasks: Task[]): Promise<void> {
    try {
      // Clear existing cached tasks and replace with new ones
      await this.offlineStorage.clearAllTasks();
      await this.offlineStorage.storeTasks(tasks);
      console.log(`[PWA Service] Refreshed offline cache with ${tasks.length} tasks`);
    } catch (error) {
      console.error('Failed to refresh offline cache:', error);
    }
  }

  // PWA Install methods
  canInstall(): boolean {
    return !!this.deferredPrompt;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;

    return outcome === 'accepted';
  }

  // Check if running as PWA
  isRunningStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  // Force service worker update
  async forceUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    }
  }
}