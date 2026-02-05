/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { colocationApi } from '../api';
import type { Colocation, ColocationWithMembers } from '../types';
import { useAuth } from './AuthContext';

interface ColocationContextType {
  colocations: Colocation[];
  currentColocation: ColocationWithMembers | null;
  isLoading: boolean;
  error: string | null;
  setCurrentColocation: (coloc: ColocationWithMembers | null) => void;
  selectColocation: (id: string) => Promise<void>;
  refreshColocations: () => Promise<void>;
  refreshCurrentColocation: () => Promise<void>;
}

const ColocationContext = createContext<ColocationContextType | undefined>(undefined);

const CURRENT_COLOC_KEY = 'current_colocation_id';

export function ColocationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [colocations, setColocations] = useState<Colocation[]>([]);
  const [currentColocation, setCurrentColocation] = useState<ColocationWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSelected = useRef(false);

  const refreshColocations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await colocationApi.list();
      setColocations(data);

      // Auto-select saved colocation or first one (only once)
      if (!hasAutoSelected.current && data.length > 0) {
        hasAutoSelected.current = true;
        const savedId = localStorage.getItem(CURRENT_COLOC_KEY);
        const targetId = savedId && data.some((c) => c.id === savedId) ? savedId : data[0].id;
        const full = await colocationApi.get(targetId);
        setCurrentColocation(full);
        localStorage.setItem(CURRENT_COLOC_KEY, targetId);
      }
    } catch (err) {
      setError('Erreur lors du chargement des colocations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const selectColocation = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const full = await colocationApi.get(id);
      setCurrentColocation(full);
      localStorage.setItem(CURRENT_COLOC_KEY, id);
    } catch (err) {
      setError('Erreur lors de la sélection de la colocation');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCurrentColocation = useCallback(async () => {
    if (!currentColocation) return;
    try {
      const full = await colocationApi.get(currentColocation.id);
      setCurrentColocation(full);
    } catch (err) {
      console.error(err);
    }
  }, [currentColocation]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshColocations();
    } else {
      setColocations([]);
      setCurrentColocation(null);
      hasAutoSelected.current = false;
    }
  }, [isAuthenticated, refreshColocations]);

  return (
    <ColocationContext.Provider
      value={{
        colocations,
        currentColocation,
        isLoading,
        error,
        setCurrentColocation,
        selectColocation,
        refreshColocations,
        refreshCurrentColocation,
      }}
    >
      {children}
    </ColocationContext.Provider>
  );
}

export function useColocation() {
  const context = useContext(ColocationContext);
  if (context === undefined) {
    throw new Error('useColocation must be used within a ColocationProvider');
  }
  return context;
}
