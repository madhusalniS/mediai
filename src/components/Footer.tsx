import React from 'react';
import { ShieldCheck, HeartHandshake, Lock } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  theme: 'dark' | 'light';
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, theme }) => {
  const isDark = theme === 'dark';

  return (
    <footer
      className={`mt-16 border-t transition-colors ${
        isDark
          ? 'bg-slate-950/70 border-slate-900 text-slate-400'
          : 'bg-white border-slate-200 text-slate-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                MediGuard AI
              </span>
            </div>

            <span className="hidden sm:inline text-slate-600">·</span>

            <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
              Biometric Surveillance System · <strong className="text-teal-500 font-semibold">RK Hospital</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
            <button
              onClick={onOpenPrivacy}
              className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>All face processing happens in your browser. No images are uploaded to any server.</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>&copy; {new Date().getFullYear()} RK Hospital. All rights reserved.</span>
          <span>Department of Hospital Security &amp; Clinical Safety</span>
        </div>
      </div>
    </footer>
  );
};
