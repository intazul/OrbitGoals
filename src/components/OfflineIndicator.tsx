import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowSyncSuccess(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showSyncSuccess) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-lg transition-all animate-in fade-in">
      {!isOnline ? (
        <div className="flex items-center gap-2 bg-amber-500 text-amber-950 font-bold px-3 py-1.5 rounded-xl shadow-md border border-amber-600/30">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active — 100% saved locally</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl shadow-md">
          <Wifi className="w-4 h-4" />
          <span>Back Online — Progression Synced</span>
        </div>
      )}
    </div>
  );
};
