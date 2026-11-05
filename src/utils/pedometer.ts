/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PedometerState } from '../types';

type PedometerListener = (state: PedometerState) => void;

const STORAGE_PREFIX = 'orbitgoals_pedometer_v1_';
const SENSITIVITY_THRESHOLDS = {
  high: 1.35,   // Sensitive / light stride or pocket
  normal: 1.85, // Standard human walking stride
  low: 2.45,    // Vigorous walking / running
};

class RealStepCounterService {
  private stepsToday: number = 0;
  private dailyGoal: number = 10000;
  private sensitivity: 'high' | 'normal' | 'low' = 'normal';
  private isTracking: boolean = true;
  private isSensorSupported: boolean = false;
  private sensorPermission: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';

  // Real-time sensor filtering variables
  private gravityBaseline: number = 9.80665;
  private isAbovePeak: boolean = false;
  private lastStepTime: number = 0;
  private stepTimestamps: number[] = []; // Used for cadence (steps per minute)
  private cadence: number = 0;

  // Simulator for desktop / non-accelerometer environments
  private autoWalkInterval: number | null = null;

  // Subscription listeners
  private listeners: Set<PedometerListener> = new Set();
  private motionHandler: ((event: DeviceMotionEvent) => void) | null = null;

  constructor() {
    this.loadTodaySteps();
    this.checkSensorSupport();
  }

  private getTodayKey(): string {
    return `${STORAGE_PREFIX}${new Date().toISOString().split('T')[0]}`;
  }

  private loadTodaySteps() {
    if (typeof window === 'undefined') return;
    try {
      const key = this.getTodayKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          this.stepsToday = parsed;
        }
      }

      const savedGoal = localStorage.getItem('orbitgoals_pedometer_goal');
      if (savedGoal) {
        const parsedGoal = parseInt(savedGoal, 10);
        if (!isNaN(parsedGoal) && parsedGoal > 0) {
          this.dailyGoal = parsedGoal;
        }
      }

      const savedSens = localStorage.getItem('orbitgoals_pedometer_sensitivity') as 'high' | 'normal' | 'low';
      if (savedSens && ['high', 'normal', 'low'].includes(savedSens)) {
        this.sensitivity = savedSens;
      }
    } catch {
      // Fallback
    }
  }

  private persistTodaySteps() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getTodayKey(), String(this.stepsToday));
    } catch {
      // Ignore storage errors
    }
  }

  private checkSensorSupport() {
    if (typeof window === 'undefined') return;

    if ('DeviceMotionEvent' in window) {
      this.isSensorSupported = true;
      // Auto-start motion sensor listener
      this.startSensor();
    } else {
      this.isSensorSupported = false;
      this.sensorPermission = 'unsupported';
    }
  }

  /**
   * Request device motion permission on iOS 13+ devices
   */
  public async requestSensorPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const dme = window.DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof dme?.requestPermission === 'function') {
        const response = await dme.requestPermission();
        if (response === 'granted') {
          this.sensorPermission = 'granted';
          this.startSensor();
          this.notify();
          return true;
        } else {
          this.sensorPermission = 'denied';
          this.notify();
          return false;
        }
      } else {
        // Android and standard browsers without explicit requestPermission
        this.sensorPermission = 'granted';
        this.startSensor();
        this.notify();
        return true;
      }
    } catch {
      this.sensorPermission = 'denied';
      this.notify();
      return false;
    }
  }

  /**
   * Start listening to real hardware accelerometer
   */
  public startSensor() {
    if (typeof window === 'undefined') return;
    if (this.motionHandler) return; // Already listening

    this.motionHandler = (event: DeviceMotionEvent) => {
      if (!this.isTracking) return;

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const x = acc.x;
      const y = acc.y;
      const z = acc.z;

      // 3D acceleration vector magnitude
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // Low-pass exponential moving average to filter out continuous gravity
      this.gravityBaseline = 0.88 * this.gravityBaseline + 0.12 * magnitude;

      // Dynamic acceleration spike caused by footstep impact
      const delta = Math.abs(magnitude - this.gravityBaseline);
      const threshold = SENSITIVITY_THRESHOLDS[this.sensitivity];

      const now = performance.now();

      // Peak detection with refractory debounce (min 280ms between human steps)
      if (delta > threshold && !this.isAbovePeak && now - this.lastStepTime > 280) {
        this.isAbovePeak = true;
        this.lastStepTime = now;
        this.registerStep(now);
      } else if (delta < threshold * 0.55) {
        this.isAbovePeak = false;
      }
    };

    window.addEventListener('devicemotion', this.motionHandler, { passive: true });
    this.sensorPermission = 'granted';
  }

  /**
   * Stop motion listener
   */
  public stopSensor() {
    if (typeof window !== 'undefined' && this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.motionHandler = null;
    }
  }

  /**
   * Register a verified physical or simulated step
   */
  private registerStep(timestamp: number) {
    this.stepsToday += 1;
    this.persistTodaySteps();

    // Track step timestamp for cadence calculation (last 10 seconds)
    this.stepTimestamps.push(timestamp);
    const tenSecondsAgo = timestamp - 10000;
    this.stepTimestamps = this.stepTimestamps.filter((t) => t > tenSecondsAgo);

    if (this.stepTimestamps.length >= 2) {
      // Calculate steps per minute
      const durationSec = (timestamp - this.stepTimestamps[0]) / 1000;
      if (durationSec > 0.5) {
        this.cadence = Math.round(((this.stepTimestamps.length - 1) / durationSec) * 60);
      }
    } else {
      this.cadence = 0;
    }

    this.notify();
  }

  /**
   * Manually simulate a step (for testing, calibration, or desktop browsers without motion sensors)
   */
  public simulateStep() {
    this.registerStep(performance.now());
  }

  /**
   * Toggle automated walking simulation (ideal for desktop testers to see live steps)
   */
  public toggleAutoWalkSimulation(): boolean {
    if (this.autoWalkInterval) {
      clearInterval(this.autoWalkInterval);
      this.autoWalkInterval = null;
      this.cadence = 0;
      this.notify();
      return false;
    } else {
      this.isTracking = true;
      // 1.8 steps per second ~ 108 steps per minute (natural brisk walking cadence)
      this.autoWalkInterval = window.setInterval(() => {
        this.simulateStep();
      }, 550);
      this.notify();
      return true;
    }
  }

  public isSimulating(): boolean {
    return this.autoWalkInterval !== null;
  }

  public setTracking(active: boolean) {
    this.isTracking = active;
    if (!active && this.autoWalkInterval) {
      clearInterval(this.autoWalkInterval);
      this.autoWalkInterval = null;
    }
    this.notify();
  }

  public setSensitivity(level: 'high' | 'normal' | 'low') {
    this.sensitivity = level;
    try {
      localStorage.setItem('orbitgoals_pedometer_sensitivity', level);
    } catch {
      // Ignore
    }
    this.notify();
  }

  public setDailyGoal(goal: number) {
    if (goal > 0) {
      this.dailyGoal = goal;
      try {
        localStorage.setItem('orbitgoals_pedometer_goal', String(goal));
      } catch {
        // Ignore
      }
      this.notify();
    }
  }

  public resetTodaySteps() {
    this.stepsToday = 0;
    this.persistTodaySteps();
    this.stepTimestamps = [];
    this.cadence = 0;
    this.notify();
  }

  public getState(): PedometerState {
    // 0.762 meters (30 inches) average stride length
    const distanceKm = parseFloat(((this.stepsToday * 0.762) / 1000).toFixed(2));
    // Approximately 0.04 calories burned per step
    const caloriesBurned = Math.round(this.stepsToday * 0.04);

    return {
      stepsToday: this.stepsToday,
      dailyGoal: this.dailyGoal,
      distanceKm,
      caloriesBurned,
      cadence: this.cadence,
      isTracking: this.isTracking,
      isSensorSupported: this.isSensorSupported,
      sensorPermission: this.sensorPermission,
      sensitivity: this.sensitivity,
      lastStepTimestamp: this.lastStepTime,
    };
  }

  public subscribe(listener: PedometerListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Pedometer listener error:', err);
      }
    });
  }
}

export const pedometer = new RealStepCounterService();
