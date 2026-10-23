import React from 'react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center items-start sm:py-4 select-none transition-colors duration-300">
      {/* Android Device Outer Wrapper */}
      <div className="w-full max-w-[430px] min-h-screen sm:min-h-[880px] bg-surface text-on-surface flex flex-col relative sm:rounded-[36px] sm:border-[8px] sm:border-slate-300 dark:sm:border-slate-800 sm:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] dark:sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all">
        {/* Device Content Canvas */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>

        {/* Android Gesture Bar */}
        <div className="sticky bottom-0 z-50 bg-surface/90 backdrop-blur-md pt-1.5 pb-2 flex justify-center pointer-events-none shrink-0 border-t border-outline-variant/15">
          <div className="w-32 h-1 bg-on-surface/30 rounded-full" />
        </div>
      </div>
    </div>
  );
};
