import React from 'react';
import { ShieldAlert, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { SecurityAlert } from '../types';

interface AlertBannerProps {
  alert: SecurityAlert | null;
  onAcknowledge: (alertId: string) => void;
  onRegisterUnknown: (thumbnail?: string) => void;
  theme: 'dark' | 'light';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alert,
  onAcknowledge,
  onRegisterUnknown,
  theme,
}) => {
  if (!alert || alert.acknowledged) return null;

  return (
    <div
      role="alert"
      className="rounded-2xl border-2 border-rose-500/80 bg-rose-950/90 text-rose-50 p-4 sm:p-5 alert-visual-pulse relative overflow-hidden backdrop-blur-xl shadow-2xl transition-all"
    >
      {/* Visual pulse glow indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 animate-pulse" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {alert.faceThumbnail ? (
            <div className="relative shrink-0">
              <img
                src={alert.faceThumbnail}
                alt="Unverified individual"
                className="w-14 h-14 rounded-xl object-cover border-2 border-rose-400 shadow-md bg-slate-900"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-rose-600 text-white">
                <ShieldAlert className="w-3.5 h-3.5" />
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-300 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white font-mono">
                SECURITY ALERT
              </span>
              <span className="text-xs font-semibold text-rose-200">
                {alert.zoneName}
              </span>
              <span className="text-xs text-rose-300/80 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <p className="text-sm font-semibold text-white">
              Unverified person detected in restricted perimeter
            </p>
            <p className="text-xs text-rose-200/90 mt-0.5 max-w-2xl">
              {alert.reason} — Mandatory biometric clearance required for this sector.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-rose-800/50">
          <button
            onClick={() => onRegisterUnknown(alert.faceThumbnail)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-rose-950 hover:bg-rose-50 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-rose-600" />
            <span>Register This Person</span>
          </button>

          <button
            onClick={() => onAcknowledge(alert.id)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-rose-900/60 hover:bg-rose-800/70 text-rose-200 border border-rose-700/60 transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-rose-300" />
            <span>Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
