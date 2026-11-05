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
  simulateStep: () => void;
  toggleAutoWalk: () => void;
  setSensitivity: (sens: 'high' | 'normal' | 'low') => void;
  setDailyGoal: (goal: number) => void;
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
    pedometer.setTracking(!state.isTracking);
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
    simulateStep,
    toggleAutoWalk,
    setSensitivity,
    setDailyGoal,
    requestPermission,
    resetTodaySteps,
  };
}
