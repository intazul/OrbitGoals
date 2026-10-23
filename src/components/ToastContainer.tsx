import React, { useSyncExternalStore } from 'react';
import { notificationManager } from '../utils/notifications';
import { X, Flame, Award, Bell, Zap } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useSyncExternalStore(
    (onStoreChange) => notificationManager.subscribeToasts(onStoreChange),
    () => notificationManager.getToasts(),
    () => []
  );

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-[380px] w-[90%] pointer-events-none">
      {toasts.map((toast) => {
        const getIcon = () => {
          if (toast.type === 'streak') return <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />;
          if (toast.type === 'milestone') return <Award className="w-5 h-5 text-primary" />;
          if (toast.type === 'xp') return <Zap className="w-5 h-5 text-yellow-400" />;
          return <Bell className="w-5 h-5 text-secondary" />;
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-surface-container-highest text-on-surface rounded-2xl p-3.5 shadow-xl border border-outline-variant/40 flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
          >
            <div className="p-2 rounded-xl bg-surface-container-lowest shrink-0 shadow-2xs">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-on-surface">{toast.title}</h4>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{toast.body}</p>
            </div>
            <button
              onClick={() => notificationManager.dismissToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
