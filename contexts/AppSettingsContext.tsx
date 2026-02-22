import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../i18n/translations';

export type ThemeMode = 'light' | 'dark';

interface AppSettings {
  theme: ThemeMode;
  language: Language;
  sidebarCompact: boolean;
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  t: (key: keyof typeof translations['pt-BR']) => string;
}

const STORAGE_KEY = 'app_settings_v1';

const defaultSettings: AppSettings = {
  // ✅ padrão agora é CLARO (branco)
  theme: 'light',
  language: 'pt-BR',
  sidebarCompact: false,
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // ✅ migração segura: qualquer valor desconhecido vira "light"
        const migratedTheme: ThemeMode = parsed?.theme === 'dark' ? 'dark' : 'light';

        return {
          ...defaultSettings,
          ...parsed,
          theme: migratedTheme,
        };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  useEffect(() => {
    const root = window.document.documentElement;

    // ✅ aplica somente light/dark (sem system)
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const t = (key: keyof typeof translations['pt-BR']): string => {
    const dict = translations[settings.language] || translations['pt-BR'];
    return (dict as any)[key] || key;
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, t }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return context;
};