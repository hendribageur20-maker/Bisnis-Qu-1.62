import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor, ShieldCheck } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
  onHomePress?: () => void;
  onBackPress?: () => void;
  canGoBack?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  bottomBar,
  onHomePress,
  onBackPress,
  canGoBack
}) => {
  const [isMobileMode, setIsMobileMode] = useState<boolean>(true);
  const [isSafeAreaEnabled, setIsSafeAreaEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-800 flex flex-col items-center justify-start p-0 md:py-6 md:px-4">
      {/* Top control bar outside phone frame (for preview customization) */}
      <div className="w-full max-w-5xl mb-3 hidden md:flex items-center justify-between px-4 py-2 bg-white shadow-xs rounded-2xl border border-slate-200 text-slate-600 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-900 tracking-wide">Bengkel Qu 1.60</span>
          <span className="text-slate-400 hidden sm:inline">| UI Flutter / Android Modern</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Safe Area Mode Status & Toggle */}
          <button
            onClick={() => setIsSafeAreaEnabled(!isSafeAreaEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              isSafeAreaEnabled
                ? 'bg-emerald-50 text-[#008952] border border-emerald-200 shadow-xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Aktifkan/Nonaktifkan Proteksi Safe Area Status Bar & Navigation Bar"
          >
            <ShieldCheck className="w-4 h-4 text-[#008952]" />
            <span>Safe Area: {isSafeAreaEnabled ? 'Aktif' : 'Nonaktif'}</span>
          </button>

          {/* Frame mode toggle */}
          <button
            onClick={() => setIsMobileMode(!isMobileMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            {isMobileMode ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Mode Lebar</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mode HP (412px)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 flex flex-col ${
          isMobileMode
            ? 'max-w-[425px] h-[100dvh] md:h-[750px] md:max-h-[88vh] rounded-none md:rounded-[40px] shadow-none md:shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-0 md:border-2 md:border-slate-300/80 overflow-hidden bg-white my-auto'
            : 'max-w-4xl h-[100dvh] md:h-[750px] md:max-h-[88vh] rounded-none md:rounded-2xl shadow-none md:shadow-xl border-0 md:border md:border-slate-200 bg-white overflow-hidden my-auto'
        }`}
      >
        {/* Android Status Bar (Fixed Top dengan Proteksi Safe Area) */}
        <div
          className={`shrink-0 bg-[#008952] text-white px-6 pb-2 flex items-center justify-between text-xs font-semibold select-none border-b border-emerald-600/30 z-30 transition-all ${
            isSafeAreaEnabled
              ? 'pt-[max(env(safe-area-inset-top,0px),0.875rem)] md:pt-3'
              : 'pt-2'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{currentTime}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-200/80" />
            <span className="text-[10px] text-emerald-100 font-normal">Bengkel Qu</span>
          </div>

          {/* Speaker / Camera Notch Mockup jika dalam mode frame HP */}
          {isMobileMode && isSafeAreaEnabled && (
            <div className="w-24 h-3.5 bg-black/15 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black/30 border border-emerald-400/20" />
            </div>
          )}

          <div className="flex items-center gap-2 text-white/90">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold">98%</span>
              <BatteryMedium className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Application Viewport Container */}
        <div className="relative flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Scrollable Viewport - Terisolasi agar konten tidak pernah menembus status bar maupun navigation bar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-slate-50 scrollbar-none pb-6">
            {children}
          </div>

          {/* Navigasi Menu Cepat Bawah - Terkunci Permanen di Bawah */}
          {bottomBar && (
            <div className="shrink-0 w-full z-40 bg-white sticky bottom-0">
              {bottomBar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
