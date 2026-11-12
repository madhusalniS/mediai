import React from 'react';
import { Shield, Moon, Sun, Lock, UserPlus, Users, History, ScanFace } from 'lucide-react';

export type ActiveTab = 'scanner' | 'register' | 'directory' | 'alerts';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenPrivacy: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  onOpenPrivacy,
  alertCount,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-slate-950/80 border-slate-800/80 text-white'
          : 'bg-white/85 border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text element wordmark + subtle RK Hospital tag */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-tight">
                  MediGuard<span className="text-teal-500">.AI</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                    isDark ? 'bg-slate-800 text-teal-400' : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  RK HOSPITAL
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
                RK Hospital &amp; Medical Centre
              </span>
            </div>
          </div>

          {/* Zone 2: 4 single-line navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onTabChange('scanner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-white dark:bg-teal-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ScanFace className="w-4 h-4" />
              <span>Face Scanner</span>
            </button>

            <button
              onClick={() => onTabChange('register')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-teal-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Person</span>
            </button>

            <button
              onClick={() => onTabChange('directory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-teal-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personnel &amp; Visitors</span>
            </button>

            <button
              onClick={() => onTabChange('alerts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                activeTab === 'alerts'
                  ? 'bg-white dark:bg-teal-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Security Logs</span>
              {alertCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Zone 3: Actions (Theme toggle & Privacy info) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenPrivacy}
              title="On-device Privacy Guarantee"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isDark
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'
                  : 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">100% In-Browser</span>
            </button>

            <button
              onClick={onToggleTheme}
              aria-label="Toggle dark and light theme"
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between gap-1 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('scanner')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
          <button
            onClick={() => onTabChange('register')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'register'
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
          <button
            onClick={() => onTabChange('directory')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People</span>
          </button>
          <button
            onClick={() => onTabChange('alerts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Alerts</span>
          </button>
        </div>
      </div>
    </header>
  );
};
