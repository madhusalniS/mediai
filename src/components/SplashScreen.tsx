import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface SplashScreenProps {
  progressText: string;
  isReady: boolean;
  onEnter: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  progressText,
  isReady,
  onEnter,
  error,
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden p-6">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-xl w-full text-center flex flex-col items-center">
        {/* RK Hospital Endorsement */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-teal-500/30 text-teal-300 text-xs tracking-wider uppercase font-semibold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          RK Hospital &amp; Medical Centre
        </div>

        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
            MediGuard AI
          </h1>
        </div>

        <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mb-8">
          Hospital Visitor &amp; Staff Verification System
          <span className="block text-xs text-slate-500 mt-1">Autonomous Biometric Surveillance &amp; Restricted Zone Safety</span>
        </p>

        {/* ECG Heartbeat oscilloscope line */}
        <div className="w-full max-w-md bg-slate-900/90 rounded-2xl border border-slate-800 p-5 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 text-teal-400 font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>NEURAL ENGINE INITIALIZATION</span>
            </div>
            <span className="text-slate-500 font-mono">72 BPM · VITAL OK</span>
          </div>

          {/* ECG SVG */}
          <div className="relative h-20 w-full flex items-center overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
            
            <svg
              viewBox="0 0 500 80"
              className="w-full h-full stroke-teal-400 fill-none animate-ecg-glow"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 40 L 70 40 L 85 40 L 95 32 L 105 48 L 115 40 L 140 40 L 150 10 L 160 70 L 170 30 L 180 44 L 190 40 L 260 40 L 275 40 L 285 32 L 295 48 L 305 40 L 330 40 L 340 10 L 350 70 L 360 30 L 370 44 L 380 40 L 500 40"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-ecg-trace"
              />
            </svg>
          </div>

          {/* Progress Status */}
          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 truncate max-w-[260px] text-left">
              {error ? (
                <span className="text-rose-400 font-semibold">{error}</span>
              ) : (
                progressText || 'Loading neural networks...'
              )}
            </span>
            <span className="text-teal-400 font-semibold shrink-0">
              {isReady ? '100% READY' : 'ON-DEVICE AI'}
            </span>
          </div>

          {/* Minimal progress line */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isReady
                  ? 'w-full bg-emerald-400 shadow-sm shadow-emerald-400/50'
                  : 'w-3/4 bg-teal-500 animate-pulse'
              }`}
            />
          </div>
        </div>

        {/* Action Button */}
        {error ? (
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
          >
            Retry Neural Model Initialization
          </button>
        ) : (
          <button
            onClick={onEnter}
            disabled={!isReady}
            className={`px-8 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isReady
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 shadow-lg shadow-teal-500/25 transform hover:-translate-y-0.5'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isReady ? 'Launch MediGuard Security Console' : 'Initializing Face Recognition Models...'}
          </button>
        )}

        {/* Privacy badge */}
        <div className="mt-8 text-xs text-slate-500 flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>All face processing happens in your browser. No images are uploaded to any server.</span>
        </div>
      </div>
    </div>
  );
};
