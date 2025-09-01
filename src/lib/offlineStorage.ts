import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface HRMSDatabase extends DBSchema {
  employees: {
    key: string;
    value: any;
  };
  attendance: {
    key: string;
    value: any;
  };
  payroll: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    value: any;
  };
  branches: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      table: string;
      data: any;
      timestamp: number;
    };
  };
}

type StoreNames = 'employees' | 'attendance' | 'payroll' | 'settings' | 'branches' | 'syncQueue';

class OfflineStorage {
  private db: IDBPDatabase<HRMSDatabase> | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<HRMSDatabase>('HRMS-Offline', 1, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('employees')) {
          db.createObjectStore('employees');
        }
        if (!db.objectStoreNames.contains('attendance')) {
          db.createObjectStore('attendance');
        }
        if (!db.objectStoreNames.contains('payroll')) {
          db.createObjectStore('payroll');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('branches')) {
          db.createObjectStore('branches');
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue');
        }
      },
    });

    return this.db;
  }

  async setData(store: StoreNames, key: string, data: any) {
    const db = await this.init();
    await db.put(store, data, key);
  }

  async getData(store: StoreNames, key: string) {
    const db = await this.init();
    return await db.get(store, key);
  }

  async getAllData(store: StoreNames) {
    const db = await this.init();
    return await db.getAll(store);
  }

  async deleteData(store: StoreNames, key: string) {
    const db = await this.init();
    await db.delete(store, key);
  }

  async addToSyncQueue(operation: 'create' | 'update' | 'delete', table: string, data: any) {
    const db = await this.init();
    const id = `${table}-${Date.now()}-${Math.random()}`;
    await db.put('syncQueue', {
      id,
      operation,
      table,
      data,
      timestamp: Date.now(),
    }, id);
  }

  async getSyncQueue() {
    const db = await this.init();
    return await db.getAll('syncQueue');
  }

  async clearSyncQueue() {
    const db = await this.init();
    await db.clear('syncQueue');
  }

  async isOnline() {
    return navigator.onLine;
  }
}

export const offlineStorage = new OfflineStorage();