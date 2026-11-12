import React from 'react';
import { X, Lock, ShieldCheck, HardDrive, WifiOff, FileText } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'glass-panel-dark text-white' : 'glass-panel-light text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">
                Hospital Biometric Privacy Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Client-Side Edge AI Architecture
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-medium">
              <strong className="block text-sm text-emerald-200 mb-0.5">
                Zero Cloud Upload Guarantee
              </strong>
              All face processing happens in your browser. No images are uploaded to any server.
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 font-semibold">Local Neural Inference:</strong> Model weights are fetched directly from CDN into browser memory (WebGL/Wasm) using face-api.js.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 font-semibold">Local Storage Only:</strong> Face descriptors and registered personnel profiles are strictly saved in browser <code className="text-teal-300 font-mono">localStorage</code>.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 font-semibold">RK Hospital Safety Compliance:</strong> Engineered for RK Hospital clinical facilities under strict patient and visitor biometric data confidentiality standards.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-900/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
