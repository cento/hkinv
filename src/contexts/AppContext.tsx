import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { hasSettings } from '../database/settings';
import { stopBackupTimer, startBackupTimer } from '../database/backup';

export interface AppState {
  dbPath: string | null;
  isDbOpen: boolean;
  isSettingsComplete: boolean;
  language: string;
  isDarkMode: boolean;
}

interface AppContextType {
  state: AppState;
  setDbPath: (path: string | null) => void;
  setDbOpen: (open: boolean) => void;
  setSettingsComplete: (complete: boolean) => void;
  setLanguage: (lang: string) => void;
  toggleDarkMode: () => void;
  resetState: () => void;
}

const initialState: AppState = {
  dbPath: null,
  isDbOpen: false,
  isSettingsComplete: false,
  language: localStorage.getItem('app-language') || navigator.language.split('-')[0] || 'it',
  isDarkMode: localStorage.getItem('app-dark-mode') === 'true',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    return () => { stopBackupTimer(); };
  }, []);

  const setDbPath = useCallback((path: string | null) => {
    setState(prev => ({ ...prev, dbPath: path }));
  }, []);

  const setDbOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isDbOpen: open }));
  }, []);

  const setSettingsComplete = useCallback((complete: boolean) => {
    setState(prev => ({ ...prev, isSettingsComplete: complete }));
    if (complete) {
      startBackupTimer();
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    localStorage.setItem('app-language', lang);
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(prev => {
      const newMode = !prev.isDarkMode;
      localStorage.setItem('app-dark-mode', String(newMode));
      return { ...prev, isDarkMode: newMode };
    });
  }, []);

  const resetState = useCallback(() => {
    setState({ ...initialState });
  }, []);

  return (
    <AppContext.Provider value={{ state, setDbPath, setDbOpen, setSettingsComplete, setLanguage, toggleDarkMode, resetState }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
