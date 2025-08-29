import { Injectable } from '@angular/core';
import { Task } from '../models/task.interface';

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE';
  task: Task;
  timestamp: number;
  synced: boolean;
}

@Injectable({ providedIn: 'root' })
export class OfflineStorageService {
  private dbName = 'KanbanDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('status', 'status', { unique: false });
          tasksStore.createIndex('priority', 'priority', { unique: false });
        }

        // Offline actions queue
        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
          actionsStore.createIndex('synced', 'synced', { unique: false });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Task storage methods
  async storeTasks(tasks: Task[]): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    // Clear existing tasks
    await store.clear();
    
    // Store new tasks
    for (const task of tasks) {
      await store.add(task);
    }
  }

  async getTasks(): Promise<Task[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async storeTask(task: Task): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    await store.put(task);
  }

  async deleteTask(taskId: number): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    await store.delete(taskId);
  }

  // Offline actions queue
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    if (!this.db) await this.initialize();
    
    const offlineAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false
    };

    const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    await store.add(offlineAction);
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineActions'], 'readonly');
      const store = transaction.objectStore('offlineActions');
      
      const request = store.getAll();
      request.onsuccess = () => {
        const allActions = request.result;
        const pendingActions = allActions.filter(action => !action.synced);
        console.log(`[Offline Storage] Total actions: ${allActions.length}, Pending: ${pendingActions.length}`);
        resolve(pendingActions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markActionSynced(actionId: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    const getRequest = store.get(actionId);
    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.synced = true;
        store.put(action);
      }
    };
  }

  async clearSyncedActions(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      
      // Get all actions first
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const allActions = getAllRequest.result;
        let deleteCount = 0;
        let totalDeletes = 0;
        
        // Count actions to delete
        allActions.forEach(action => {
          if (action.synced === true) {
            totalDeletes++;
          }
        });
        
        if (totalDeletes === 0) {
          resolve();
          return;
        }
        
        // Delete synced actions
        allActions.forEach(action => {
          if (action.synced === true) {
            const deleteRequest = store.delete(action.id);
            deleteRequest.onsuccess = () => {
              deleteCount++;
              if (deleteCount === totalDeletes) {
                resolve();
              }
            };
            deleteRequest.onerror = () => reject(deleteRequest.error);
          }
        });
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  async clearAllActions(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
      const store = transaction.objectStore('offlineActions');
      
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  async clearAllTasks(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  // Utility methods
  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async getLastSyncTime(): Promise<number> {
    const syncTime = localStorage.getItem('kanban-last-sync');
    return syncTime ? parseInt(syncTime, 10) : 0;
  }

  async setLastSyncTime(timestamp: number): Promise<void> {
    localStorage.setItem('kanban-last-sync', timestamp.toString());
  }
}