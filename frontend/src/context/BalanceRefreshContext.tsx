/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface BalanceRefreshContextValue {
  refreshKey: number;
  triggerRefresh: () => void;
}

const BalanceRefreshContext = createContext<BalanceRefreshContextValue | undefined>(undefined);

export function BalanceRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <BalanceRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </BalanceRefreshContext.Provider>
  );
}

export function useBalanceRefresh() {
  const context = useContext(BalanceRefreshContext);
  if (!context) {
    throw new Error('useBalanceRefresh must be used within a BalanceRefreshProvider');
  }
  return context;
}

