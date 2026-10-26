import React, { useState } from 'react';
import { AVATAR_PRESETS, AvatarPreset, getAvatarPreset } from '../utils/avatars';
import { sound, triggerHaptic } from '../utils/sound';
import { Check, X, Sparkles, Image as ImageIcon } from 'lucide-react';

interface AvatarPickerModalProps {
  currentAvatarId?: string;
  onSelectAvatar: (avatarId: string) => void;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  currentAvatarId,
  onSelectAvatar,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentAvatarId || AVATAR_PRESETS[0].id);
  const activePreset = getAvatarPreset(selectedId);

  const handleConfirm = () => {
    onSelectAvatar(selectedId);
    sound.playSuccessChime();
    triggerHaptic('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-surface border-t sm:border border-outline-variant/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-on-surface">Choose Your Avatar</h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Personalize your profile picture
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Hero Preview */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3.5 shrink-0">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-3 ring-primary/40 border border-surface shadow-md shrink-0">
            <img
              src={activePreset.url}
              alt={activePreset.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
              Active Selection
            </span>
            <h4 className="text-sm font-black text-on-surface truncate">{activePreset.name}</h4>
            <p className="text-xs text-on-surface-variant">{activePreset.subtitle}</p>
          </div>
        </div>

        {/* Avatars Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
          <span className="text-xs font-bold text-on-surface-variant block px-1">
            Select an Avatar Style
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {AVATAR_PRESETS.map((preset: AvatarPreset) => {
              const isSelected = preset.id === selectedId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(preset.id);
                    sound.playPop();
                    triggerHaptic('light');
                  }}
                  className={`group relative p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-xs'
                      : 'bg-surface-container border-outline-variant/25 hover:bg-surface-container-high'
                  }`}
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container-highest shadow-xs">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <span className="text-[11px] font-black text-on-surface block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-on-surface-variant font-medium block truncate">
                      {preset.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-black text-xs active:scale-95 transition-all cursor-pointer shadow-sm hover:brightness-105 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
