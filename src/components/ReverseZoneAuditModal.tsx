import React from 'react';
import { ReversePenaltyRecord } from '../types';
import { X, Flame, AlertTriangle, ShieldCheck, Clock, Trash2 } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/sound';

interface ReverseZoneAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  penalties: ReversePenaltyRecord[];
  onClearHistory: () => void;
}

export const ReverseZoneAuditModal: React.FC<ReverseZoneAuditModalProps> = ({
  isOpen,
  onClose,
  penalties,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const totalDeducted = penalties.reduce((sum, p) => sum + (p.xpDeducted || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] max-h-[85vh] bg-surface rounded-t-3xl sm:rounded-3xl border border-rose-500/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-on-surface">
                Reverse Habit Ledger
              </h2>
              <p className="text-[10px] text-on-surface-variant font-medium">
                Audit of uncompleted habits & 11:59 PM XP reductions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              sound.playPop();
            }}
            className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer active:scale-95 transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total Impact Summary Strip */}
        <div className="p-4 bg-gradient-to-r from-rose-950/40 via-rose-900/30 to-surface-container border-b border-rose-500/20 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Lifetime Reverse Reductions</span>
            </span>
            <span className="text-xl font-black font-mono text-on-surface">
              -{totalDeducted.toLocaleString()} XP
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-on-surface-variant font-medium block">
              Missed Habits Logged
            </span>
            <span className="text-sm font-bold text-on-surface font-mono">
              {penalties.length} events
            </span>
          </div>
        </div>

        {/* Scrollable Event List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px]">
          {penalties.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-on-surface">Pristine Habit Record!</h3>
                <p className="text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed">
                  No habits missed before 11:59 PM. All daily habits are either completed or current.
                </p>
              </div>
            </div>
          ) : (
            penalties.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-surface-container border border-rose-500/25 flex items-center justify-between gap-3 shadow-xs hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 font-bold text-xs">
                    ⚠️
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-on-surface truncate">
                      {item.habitTitle}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.date}</span>
                      <span>·</span>
                      <span className="truncate">{item.reason}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                    -{item.xpDeducted} XP
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface flex items-center justify-between gap-2 shrink-0">
          {penalties.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all logged reverse penalty history?')) {
                  onClearHistory();
                  sound.playPop();
                  triggerHaptic('medium');
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-rose-500 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              sound.playPop();
            }}
            className="ml-auto px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
