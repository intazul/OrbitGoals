// Push Notification and In-App Reminder System
import { sound } from './sound';

export interface InAppToast {
  id: string;
  title: string;
  body: string;
  type: 'streak' | 'milestone' | 'reminder' | 'xp';
  timestamp: number;
}

type ToastListener = () => void;

class NotificationManager {
  private activeToasts: InAppToast[] = [];
  private listeners: ToastListener[] = [];

  constructor() {
    this.checkPermissionStatus();
  }

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
    // Schedule listener notification in microtask to avoid any render-phase setState conflicts
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

  sendNotification(title: string, body: string, type: 'streak' | 'milestone' | 'reminder' | 'xp' = 'reminder') {
    // 1. In-app toast banner
    const toast: InAppToast = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      type,
      timestamp: Date.now(),
    };

    this.activeToasts = [toast, ...this.activeToasts.slice(0, 3)];
    this.notifyListeners();

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 4000);

    // 2. Play sound
    try {
      if (type === 'milestone') {
        sound.playLevelUp();
      } else if (type === 'streak') {
        sound.playStreakFlame();
      } else {
        sound.playPop();
      }
    } catch {
      // ignore audio errors
    }

    // 3. Native browser Push Notification if granted
    try {
      if (this.hasNativeSupport && this.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'orbitgoals-alert',
        });
      }
    } catch {
      // Fallback
    }
  }

  private checkPermissionStatus() {
    // initialize
  }
}

export const notificationManager = new NotificationManager();
