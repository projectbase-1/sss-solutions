import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineStorage } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';

type SyncOperation = {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: 'employees' | 'attendance' | 'payroll' | 'branches' | 'settings';
  data: any;
  timestamp: number;
};

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingOperations = async () => {
    try {
      const queue = await offlineStorage.getSyncQueue() as SyncOperation[];
      
      for (const item of queue) {
        try {
          // Type-safe table operations
          const tableMap = {
            employees: 'employees',
            attendance: 'attendance', 
            payroll: 'payroll',
            branches: 'branches',
            settings: 'general_settings'
          } as const;
          
          const tableName = tableMap[item.table];
          if (!tableName) continue;

          if (item.operation === 'create') {
            await supabase.from(tableName as any).insert(item.data);
          } else if (item.operation === 'update') {
            await supabase.from(tableName as any).update(item.data).eq('id', item.data.id);
          } else if (item.operation === 'delete') {
            await supabase.from(tableName as any).delete().eq('id', item.data.id);
          }
        } catch (error) {
          console.error('Sync error for item:', item, error);
        }
      }

      await offlineStorage.clearSyncQueue();
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const cacheData = async (key: string, data: any, store: 'employees' | 'attendance' | 'payroll' | 'settings' | 'branches' = 'employees') => {
    await offlineStorage.setData(store, key, data);
  };

  const getCachedData = async (key: string, store: 'employees' | 'attendance' | 'payroll' | 'settings' | 'branches' = 'employees') => {
    return await offlineStorage.getData(store, key);
  };

  return {
    isOnline,
    cacheData,
    getCachedData,
    syncPendingOperations,
  };
};