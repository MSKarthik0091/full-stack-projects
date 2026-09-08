import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();

  return (
    <div id="theme-toggle-container" className="flex items-center bg-slate-200/80 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-300 dark:border-slate-700/80 transition-colors shadow-inner">
      <button
        type="button"
        id="theme-toggle-light"
        onClick={() => setThemeMode('light')}
        title="Switch to Light Theme"
        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
          themeMode === 'light'
            ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Sun className={`w-3.5 h-3.5 ${themeMode === 'light' ? 'text-amber-500 fill-amber-500/20' : ''}`} />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        id="theme-toggle-dark"
        onClick={() => setThemeMode('dark')}
        title="Switch to Dark Theme"
        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
          themeMode === 'dark'
            ? 'bg-slate-900 text-cyan-300 shadow-sm border border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Moon className={`w-3.5 h-3.5 ${themeMode === 'dark' ? 'text-cyan-400 fill-cyan-400/20' : ''}`} />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        id="theme-toggle-system"
        onClick={() => setThemeMode('system')}
        title="Follow System OS Preference"
        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
          themeMode === 'system'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Auto</span>
      </button>
    </div>
  );
};
