import React, { ReactNode } from 'react';
import { AuthProvider, useAuth } from './modules/AuthContext';
import { SettingsProvider, useSettings } from './modules/SettingsContext';
import { ClientProvider, useClients } from './modules/ClientContext';
import { LoanProvider, useLoans } from './modules/LoanContext';
import { AccountingProvider, useAccounting } from './modules/AccountingContext';
import { InventoryProvider, useInventory } from './modules/InventoryContext';
import { MerchantProvider, useMerchants } from './modules/MerchantContext';
import { LegalProvider, useLegal } from './modules/LegalContext';
import { VaultProvider, useVault } from './modules/VaultContext';

export { useAuth, useSettings, useClients, useLoans, useAccounting, useInventory, useMerchants, useLegal, useVault };

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ClientProvider>
          <LoanProvider>
            <AccountingProvider>
              <InventoryProvider>
                <MerchantProvider>
                  <LegalProvider>
                    <VaultProvider>
                      {children}
                    </VaultProvider>
                  </LegalProvider>
                </MerchantProvider>
              </InventoryProvider>
            </AccountingProvider>
          </LoanProvider>
        </ClientProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

// Deprecated: Legacy hook for backwards compatibility.
// For better performance, use specific hooks: useAuth, useSettings, useClients, useLoans, useAccounting, useInventory
export const useStore = () => {
  const auth = useAuth();
  const settings = useSettings();
  const clients = useClients();
  const loans = useLoans();
  const accounting = useAccounting();
  const inventory = useInventory();

  return {
    ...auth,
    ...settings,
    ...clients,
    ...loans,
    ...accounting,
    ...inventory
  };
};