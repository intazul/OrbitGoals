import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isReverseZone?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, isReverseZone }) => {
  return (
    <div
      className={`min-h-screen flex justify-center items-start sm:py-4 select-none transition-colors duration-300 ${
        isReverseZone
          ? 'bg-rose-100/70 dark:bg-[#0a0204]'
          : 'bg-zinc-100 dark:bg-[#050811]'
      }`}
    >
      {/* Android Device Outer Wrapper with clean micro-jitter animation (no lines) */}
      <div
        className={`w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:max-h-[94vh] bg-surface text-on-surface flex flex-col relative sm:rounded-[36px] sm:border-[8px] overflow-hidden transition-all duration-300 screen-glitch ${
          isReverseZone
            ? 'sm:border-rose-300 dark:sm:border-rose-950/90 shadow-[0_0_35px_rgba(225,29,72,0.25)]'
            : 'sm:border-zinc-950/85 dark:sm:border-slate-800/80 sm:shadow-2xl'
        }`}
      >
        {/* Device Content Canvas */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative min-h-0 bg-surface text-on-surface">
          {children}
        </div>

        {/* Android Gesture Bar */}
        <div className="sticky bottom-0 z-50 bg-surface/95 backdrop-blur-md pt-1.5 pb-2 flex justify-center pointer-events-none shrink-0 border-t border-outline-variant/20">
          <div className="w-32 h-1 bg-on-surface/25 rounded-full" />
        </div>
      </div>
    </div>
  );
};
