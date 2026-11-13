import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi } from 'lucide-react';

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

  return (
    <AnimatePresence>
      {(!isOnline || showSyncSuccess) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 text-xs font-semibold"
        >
          {!isOnline ? (
            <div className="flex items-center gap-2 bg-primary text-on-primary font-bold px-3.5 py-2 rounded-xl shadow-xl border border-outline-variant/40">
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode — Stored Locally</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-surface text-on-surface font-bold px-3.5 py-2 rounded-xl shadow-xl border border-outline/30">
              <Wifi className="w-4 h-4" />
              <span>Back Online — Synced</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
