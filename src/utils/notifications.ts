// Push Notification and In-App Reminder System
import { sound, triggerHaptic } from './sound';
import { Habit, Goal } from '../types';

export interface InAppToast {
  id: string;
  title: string;
  body: string;
  type: 'streak' | 'milestone' | 'reminder' | 'xp' | 'goal' | 'habit';
  timestamp: number;
}

type ToastListener = () => void;

class NotificationManager {
  private activeToasts: InAppToast[] = [];
  private listeners: ToastListener[] = [];
  // Keep track of triggered reminders: key = `${id}-${dateStr}-${timeStr}`
  private triggeredReminders: Set<string> = new Set();

  get hasNativeSupport(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      return typeof Notification.permission === 'string';
    } catch {
      return false;
    }
  }

  get permission(): NotificationPermission {
    if (!this.hasNativeSupport) return 'default';
    try {
      return Notification.permission;
    } catch {
      return 'default';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.hasNativeSupport) return false;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }

  subscribeToasts(fn: ToastListener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  getToasts(): InAppToast[] {
    return this.activeToasts;
  }

  private notifyListeners() {
    queueMicrotask(() => {
      this.listeners.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
    });
  }

  dismissToast(id: string) {
    this.activeToasts = this.activeToasts.filter((t) => t.id !== id);
    this.notifyListeners();
  }

  playAlertSound(soundType: 'chime' | 'bell' | 'melody' | 'silent' = 'chime') {
    if (soundType === 'silent') return;
    try {
      if (soundType === 'bell') {
        sound.playFocusBell();
      } else if (soundType === 'melody') {
        sound.playLevelUp();
      } else {
        sound.playSuccessChime();
      }
    } catch {
      // Audio autoplay restrictions
    }
  }

  sendNotification(
    title: string,
    body: string,
    type: 'streak' | 'milestone' | 'reminder' | 'xp' | 'goal' | 'habit' = 'reminder',
    soundType: 'chime' | 'bell' | 'melody' | 'silent' = 'chime'
  ) {
    // 1. In-app toast popup at the bottom of the screen
    const toast: InAppToast = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      type,
      timestamp: Date.now(),
    };

    this.activeToasts = [toast, ...this.activeToasts.slice(0, 2)];
    this.notifyListeners();

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 5000);

    // 2. Play audible alert chime & haptics
    this.playAlertSound(soundType);
    triggerHaptic('medium');

    // 3. Native browser Web Push Notification if granted
    try {
      if (this.hasNativeSupport && this.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `orbitgoals-${Date.now()}`,
        });
      }
    } catch {
      // Fallback
    }
  }

  // Send a test alert so the user can verify their notification sound & popup
  testAlert(
    title: string,
    body: string,
    soundType: 'chime' | 'bell' | 'melody' | 'silent' = 'chime',
    type: 'habit' | 'goal' | 'reminder' = 'reminder'
  ) {
    this.sendNotification(
      `🔔 Alert Test: ${title}`,
      body || `Custom reminder test for "${title}". Your alerts are active!`,
      type,
      soundType
    );
  }

  // Inspects all active habits and goals and fires alerts when time matches
  checkScheduledReminders(habits: Habit[], goals: Goal[]) {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;
    const todayIso = now.toISOString().split('T')[0];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[now.getDay()];

    // 1. Check Habits
    habits.forEach((habit) => {
      if (!habit.reminderEnabled || !habit.reminderTime) return;

      // Check time match
      if (habit.reminderTime !== currentTimeStr) return;

      // Check repeat day match (if specified)
      if (habit.reminderDays && habit.reminderDays.length > 0) {
        if (!habit.reminderDays.includes(currentDayName)) return;
      }

      const dedupeKey = `habit-${habit.id}-${todayIso}-${currentTimeStr}`;
      if (this.triggeredReminders.has(dedupeKey)) return;

      this.triggeredReminders.add(dedupeKey);

      const msg =
        habit.reminderMessage ||
        `Time to check in on "${habit.title}"! Keep your streak strong 🔥`;

      this.sendNotification(
        `Habit Reminder: ${habit.title}`,
        msg,
        'habit',
        habit.reminderSound || 'chime'
      );
    });

    // 2. Check Goals
    goals.forEach((goal) => {
      if (!goal.reminderEnabled || !goal.reminderTime) return;

      // Check time match
      if (goal.reminderTime !== currentTimeStr) return;

      // Check repeat day match (if specified)
      if (goal.reminderDays && goal.reminderDays.length > 0) {
        if (!goal.reminderDays.includes(currentDayName)) return;
      }

      const dedupeKey = `goal-${goal.id}-${todayIso}-${currentTimeStr}`;
      if (this.triggeredReminders.has(dedupeKey)) return;

      this.triggeredReminders.add(dedupeKey);

      const msg =
        goal.reminderMessage ||
        `Target reminder: "${goal.title}" (${goal.currentValue}/${goal.targetValue} ${goal.unit}). Log your progress! 🎯`;

      this.sendNotification(
        `Goal Alert: ${goal.title}`,
        msg,
        'goal',
        goal.reminderSound || 'chime'
      );
    });

    // Clean up old dedupe keys to prevent memory growth
    if (this.triggeredReminders.size > 200) {
      this.triggeredReminders.clear();
    }
  }
}

export const notificationManager = new NotificationManager();
