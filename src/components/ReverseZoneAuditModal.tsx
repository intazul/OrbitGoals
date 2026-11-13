import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  const totalDeducted = penalties.reduce((sum, p) => sum + (p.xpDeducted || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 36, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] max-h-[85vh] bg-surface rounded-t-3xl sm:rounded-3xl border border-outline-variant/40 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3.5 border-b border-outline-variant/25 flex items-center justify-between shrink-0 bg-surface">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
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
                className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high cursor-pointer active:scale-95 transition-all border border-outline-variant/30"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Impact Summary Strip */}
            <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Lifetime Reverse Reductions</span>
                </span>
                <span className="text-xl font-black font-mono tabular-nums">
                  -{totalDeducted.toLocaleString()} XP
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] opacity-75 font-medium block">
                  Missed Habits Logged
                </span>
                <span className="text-sm font-black font-mono tabular-nums">
                  {penalties.length} events
                </span>
              </div>
            </div>

            {/* Scrollable Event List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px]">
              {penalties.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container text-on-surface mx-auto flex items-center justify-center border border-outline-variant/40">
                    <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-on-surface">Pristine Habit Record</h3>
                    <p className="text-xs text-on-surface-variant max-w-[260px] mx-auto leading-relaxed">
                      No habits missed before 11:59 PM. All daily habits are either completed or current.
                    </p>
                  </div>
                </div>
              ) : (
                penalties.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-on-surface truncate">
                          {item.habitTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.date}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.reason}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-xs text-on-surface tabular-nums">
                        -{item.xpDeducted} XP
                      </span>
                    </div>
                  </motion.div>
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
                  className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="ml-auto px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
