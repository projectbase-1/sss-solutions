import React, { createContext, useContext, ReactNode } from 'react';
import { useGeneralSettings, useNotificationSettings, useSecuritySettings } from '@/hooks/useSettings';
import { usePayrollSettings } from '@/hooks/usePayrollSettings';

interface SettingsContextType {
  generalSettings: any;
  notificationSettings: any;
  securitySettings: any;
  payrollSettings: any;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: generalSettings, isLoading: generalLoading } = useGeneralSettings();
  const { data: notificationSettings, isLoading: notificationLoading } = useNotificationSettings();
  const { data: securitySettings, isLoading: securityLoading } = useSecuritySettings();
  const { data: payrollSettings, isLoading: payrollLoading } = usePayrollSettings();

  const isLoading = generalLoading || notificationLoading || securityLoading || payrollLoading;

  return (
    <SettingsContext.Provider
      value={{
        generalSettings,
        notificationSettings,
        securitySettings,
        payrollSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};