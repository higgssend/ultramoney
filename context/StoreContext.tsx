import React, { ReactNode } from 'react';
import { AuthProvider, useAuth } from './modules/AuthContext';
import { SettingsProvider, useSettings } from './modules/SettingsContext';
import { ClientProvider, useClients } from './modules/ClientContext';
import { LoanProvider, useLoans } from './modules/LoanContext';
import { AccountingProvider, useAccounting } from './modules/AccountingContext';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ClientProvider>
          <LoanProvider>
            <AccountingProvider>
              {children}
            </AccountingProvider>
          </LoanProvider>
        </ClientProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

// Deprecated: Legacy hook for backwards compatibility.
// For better performance, use specific hooks: useAuth, useSettings, useClients, useLoans, useAccounting
export const useStore = () => {
  const auth = useAuth();
  const settings = useSettings();
  const clients = useClients();
  const loans = useLoans();
  const accounting = useAccounting();

  return {
    ...auth,
    ...settings,
    ...clients,
    ...loans,
    ...accounting
  };
};

export { useAuth } from './modules/AuthContext';
export { useSettings } from './modules/SettingsContext';
export { useClients } from './modules/ClientContext';
export { useLoans } from './modules/LoanContext';
export { useAccounting } from './modules/AccountingContext';