import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject, fromEvent, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { OfflineStorageService } from './offline-storage.service';
import { TaskService } from './task.service';
import { ToastService } from './toast.service';
import { Task } from '../models/task.interface';

@Injectable({ providedIn: 'root' })
export class PWAService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private deferredPrompt: any;
  private syncInProgress = false;

  public online$ = this.onlineSubject.asObservable();

  constructor(
    private swUpdate: SwUpdate,
    private offlineStorage: OfflineStorageService,
    private taskService: TaskService,
    private toastService: ToastService
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
        this.toastService.addToast({
          text: 'Back online! Syncing data...',
          type: 'success',
          delayAdd: false
        });
        this.syncOfflineData();
      } else {
        this.toastService.addToast({
          text: 'You are offline. Changes will sync when reconnected.',
          type: 'warn',
          delayAdd: false
        });
      }
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
        setTimeout(() => this.syncOfflineData(), 1000);
      }
    });
  }

  // Public methods
  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.onlineSubject.value) return;
    
    this.syncInProgress = true;
    
    try {
      // Get pending actions
      const pendingActions = await this.offlineStorage.getPendingActions();
      
      if (pendingActions.length === 0) {
        this.syncInProgress = false;
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each action
      for (const action of pendingActions) {
        try {
          switch (action.type) {
            case 'CREATE':
              await this.taskService.createTask(action.task).toPromise();
              break;
            case 'UPDATE':
              await this.taskService.updateTask(action.task.id!, action.task).toPromise();
              break;
            case 'DELETE':
              await this.taskService.deleteTask(action.task.id!).toPromise();
              break;
            case 'MOVE':
              await this.taskService.moveTask(action.task.id!, action.task.status, action.task.order).toPromise();
              break;
          }
          
          await this.offlineStorage.markActionSynced(action.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          errorCount++;
        }
      }

      // Clean up synced actions
      await this.offlineStorage.clearSyncedActions();
      
      // Update last sync time
      await this.offlineStorage.setLastSyncTime(Date.now());

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
        case 'UPDATE':
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