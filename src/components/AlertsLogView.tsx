import React from 'react';
import { SecurityAlert } from '../types';
import { ShieldAlert, CheckCircle, Trash2, Clock, MapPin, UserPlus } from 'lucide-react';

interface AlertsLogViewProps {
  alerts: SecurityAlert[];
  onAcknowledge: (id: string) => void;
  onClearAll: () => void;
  onRegisterFace: (thumbnail?: string) => void;
  theme: 'dark' | 'light';
}

export const AlertsLogView: React.FC<AlertsLogViewProps> = ({
  alerts,
  onAcknowledge,
  onClearAll,
  onRegisterFace,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Hospital Security Incident Log
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perimeter incursion logs and restricted ward unauthorized face detections
            </p>
          </div>

          {alerts.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-slate-800 bg-slate-900/30">
          <CheckCircle className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200 mb-1">
            Zero Active Security Alerts
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All scanned personnel in restricted zones (ICU, Operation Theatre, Pharmacy) have valid credentials.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                alert.acknowledged
                  ? isDark
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-rose-950/30 border-rose-500/60 shadow-lg text-rose-50 alert-visual-pulse'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {alert.faceThumbnail ? (
                  <img
                    src={alert.faceThumbnail}
                    alt="Detected Face"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-rose-500 shrink-0 bg-slate-900"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                        alert.acknowledged
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {alert.acknowledged ? 'RESOLVED' : 'UNVERIFIED INTRUDER'}
                    </span>
                    <span className="text-xs font-semibold flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {alert.zoneName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-200">
                    {alert.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {!alert.acknowledged && (
                  <button
                    onClick={() => onRegisterFace(alert.faceThumbnail)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-rose-600" />
                    <span>Register Person</span>
                  </button>
                )}

                {!alert.acknowledged ? (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">
                    Acknowledged
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
