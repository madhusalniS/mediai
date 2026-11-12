import React from 'react';
import { LiveCounters } from '../types';
import { UserCheck, Users, UserX, AlertTriangle, RotateCcw, Database } from 'lucide-react';

interface CountersRibbonProps {
  counters: LiveCounters;
  onResetSession?: () => void;
  theme: 'dark' | 'light';
}

export const CountersRibbon: React.FC<CountersRibbonProps> = ({
  counters,
  onResetSession,
  theme,
}) => {
  const isDark = theme === 'dark';

  const cards = [
    {
      label: 'Authorized Staff',
      value: counters.authorizedStaff,
      icon: UserCheck,
      color: 'teal',
      accent: isDark ? 'text-teal-400' : 'text-teal-600',
      bgIcon: isDark ? 'bg-teal-500/10' : 'bg-teal-50',
      subtext: 'Active in Hospital Registry',
      badge: 'Database Verified',
    },
    {
      label: 'Approved Visitors',
      value: counters.approvedVisitors,
      icon: Users,
      color: 'blue',
      accent: isDark ? 'text-sky-400' : 'text-sky-600',
      bgIcon: isDark ? 'bg-sky-500/10' : 'bg-sky-50',
      subtext: 'Registered Visitor Passes',
      badge: 'Active Passes',
    },
    {
      label: 'Unknown Detections',
      value: counters.unknownDetections,
      icon: UserX,
      color: 'coral',
      accent: isDark ? 'text-amber-400' : 'text-amber-600',
      bgIcon: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      subtext: 'Detected in Current Session',
      badge: 'Live Scanner',
    },
    {
      label: 'Security Alerts',
      value: counters.alertsToday,
      icon: AlertTriangle,
      color: 'rose',
      accent: isDark ? 'text-rose-400' : 'text-rose-600',
      bgIcon: isDark ? 'bg-rose-500/10' : 'bg-rose-50',
      subtext: 'Restricted Perimeter Incursions',
      badge: 'ICU / OT / Pharmacy',
    },
  ];

  return (
    <div className="space-y-2">
      {/* Top micro-bar explaining that metrics are 100% real */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-1.5 font-medium">
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span>Real-time Metrics (Synchronized with Hospital Database &amp; Scanner)</span>
        </div>

        {onResetSession && counters.unknownDetections > 0 && (
          <button
            onClick={onResetSession}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-teal-400 cursor-pointer transition-colors"
            title="Reset session detection counter for demo"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Session Count</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isDark ? 'glass-panel-dark' : 'glass-panel-light'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.bgIcon} ${card.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${card.accent}`}>
                  {card.value.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium font-mono">
                  {card.badge}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
