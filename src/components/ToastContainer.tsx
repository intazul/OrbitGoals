import React, { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationManager } from '../utils/notifications';
import { X, Flame, Award, Bell, Zap, Target } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useSyncExternalStore(
    (onStoreChange) => notificationManager.subscribeToasts(onStoreChange),
    () => notificationManager.getToasts(),
    () => []
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 max-w-[380px] w-[90%] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const getIcon = () => {
            if (toast.type === 'streak') return <Flame className="w-4 h-4 text-on-primary fill-current" />;
            if (toast.type === 'milestone') return <Award className="w-4 h-4 text-on-primary" />;
            if (toast.type === 'xp') return <Zap className="w-4 h-4 text-on-primary fill-current" />;
            if (toast.type === 'goal') return <Target className="w-4 h-4 text-on-primary" />;
            return <Bell className="w-4 h-4 text-on-primary" />;
          };

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="pointer-events-auto bg-surface text-on-surface rounded-2xl p-3.5 shadow-2xl border border-outline/25 flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-primary text-on-primary shrink-0 shadow-xs">
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-on-surface tracking-tight">{toast.title}</h4>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{toast.body}</p>
              </div>
              <button
                type="button"
                onClick={() => notificationManager.dismissToast(toast.id)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer shrink-0 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
