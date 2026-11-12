import React from 'react';
import { HOSPITAL_ZONES } from '../constants/zones';
import { ZoneId, ZoneInfo } from '../types';
import { ShieldAlert, ShieldCheck, MapPin } from 'lucide-react';

interface ZoneSelectorProps {
  selectedZone: ZoneId;
  onSelectZone: (zoneId: ZoneId) => void;
  theme: 'dark' | 'light';
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  selectedZone,
  onSelectZone,
  theme,
}) => {
  const isDark = theme === 'dark';
  const currentZone = HOSPITAL_ZONES.find((z) => z.id === selectedZone) || HOSPITAL_ZONES[0];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        isDark ? 'glass-panel-dark' : 'glass-panel-light'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400">
              Active Security Zone
            </h2>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {currentZone.name}
            </p>
          </div>
        </div>

        {/* Restricted Zone Warning / Status Badge */}
        <div className="flex items-center gap-2">
          {currentZone.isRestricted ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Restricted Security Zone · Unknown faces trigger immediate alert</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Standard Monitoring Zone · Visitors &amp; Attendants Permitted</span>
            </div>
          )}
        </div>
      </div>

      {/* Segmented Button Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {HOSPITAL_ZONES.map((zone: ZoneInfo) => {
          const isActive = zone.id === selectedZone;
          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer relative overflow-hidden ${
                isActive
                  ? isDark
                    ? 'bg-slate-800/90 border-teal-500/60 shadow-md shadow-teal-950/40 text-white'
                    : 'bg-teal-50 border-teal-400 shadow-sm text-slate-900'
                  : isDark
                  ? 'bg-slate-900/40 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold truncate">{zone.name}</span>
                {zone.isRestricted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Restricted Zone" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {zone.isRestricted ? 'Restricted Access' : 'General Access'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
