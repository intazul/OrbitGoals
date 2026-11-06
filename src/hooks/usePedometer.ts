/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { pedometer } from '../utils/pedometer';
import { PedometerState } from '../types';

export function usePedometer(): {
  state: PedometerState;
  isSimulating: boolean;
  toggleTracking: () => void;
  toggleWalkingMode: () => void;
  setWalkingMode: (enabled: boolean) => void;
  simulateStep: () => void;
  toggleAutoWalk: () => void;
  setSensitivity: (sens: 'high' | 'normal' | 'low') => void;
  setDailyGoal: (goal: number) => void;
  setStrideLength: (cm: number) => void;
  setBodyWeight: (kg: number) => void;
  getWeeklyHistory: () => { date: string; day: string; steps: number; goal: number; completed: boolean }[];
  requestPermission: () => Promise<boolean>;
  resetTodaySteps: () => void;
} {
  const [state, setState] = useState<PedometerState>(() => pedometer.getState());
  const [isSimulating, setIsSimulating] = useState<boolean>(() => pedometer.isSimulating());

  useEffect(() => {
    const unsubscribe = pedometer.subscribe((newState) => {
      setState(newState);
      setIsSimulating(pedometer.isSimulating());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const toggleTracking = () => {
    pedometer.toggleWalkingMode();
  };

  const toggleWalkingMode = () => {
    pedometer.toggleWalkingMode();
  };

  const setWalkingMode = (enabled: boolean) => {
    pedometer.setWalkingMode(enabled);
  };

  const simulateStep = () => {
    pedometer.simulateStep();
  };

  const toggleAutoWalk = () => {
    pedometer.toggleAutoWalkSimulation();
    setIsSimulating(pedometer.isSimulating());
  };

  const setSensitivity = (sens: 'high' | 'normal' | 'low') => {
    pedometer.setSensitivity(sens);
  };

  const setDailyGoal = (goal: number) => {
    pedometer.setDailyGoal(goal);
  };

  const setStrideLength = (cm: number) => {
    pedometer.setStrideLength(cm);
  };

  const setBodyWeight = (kg: number) => {
    pedometer.setBodyWeight(kg);
  };

  const getWeeklyHistory = () => {
    return pedometer.getWeeklyHistory();
  };

  const requestPermission = () => {
    return pedometer.requestSensorPermission();
  };

  const resetTodaySteps = () => {
    pedometer.resetTodaySteps();
  };

  return {
    state,
    isSimulating,
    toggleTracking,
    toggleWalkingMode,
    setWalkingMode,
    simulateStep,
    toggleAutoWalk,
    setSensitivity,
    setDailyGoal,
    setStrideLength,
    setBodyWeight,
    getWeeklyHistory,
    requestPermission,
    resetTodaySteps,
  };
}
