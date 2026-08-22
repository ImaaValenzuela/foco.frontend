/**
 * Manager: PomodoroManager
 * Aísla la lógica de negocio y estado del temporizador Pomodoro.
 * Cumple con SRP desvinculando la gestión de intervalos y estado del ciclo de la capa de presentación (UI).
 */

import { loadPomodoroConfig, savePomodoroConfig, isValidPomodoroConfig } from '../components/productivity/pomodoroConfig.js';

export class PomodoroManager {
  constructor(onUpdateCallback = null) {
    this.onUpdate = onUpdateCallback;
    this.timerInterval = null;
    this.init();
  }

  init() {
    const config = loadPomodoroConfig();
    this.focusMinutes = config.focusMinutes;
    this.breakMinutes = config.breakMinutes;
    this.totalCycles = config.totalCycles;
    this.currentCycle = 1;
    this.phase = 'focus'; // 'focus' | 'break'
    this.timeLeft = this.focusMinutes * 60;
    this.isRunning = false;
    this.sessionComplete = false;
    this.showConfig = false;
  }

  getState() {
    return {
      focusMinutes: this.focusMinutes,
      breakMinutes: this.breakMinutes,
      totalCycles: this.totalCycles,
      currentCycle: this.currentCycle,
      phase: this.phase,
      timeLeft: this.timeLeft,
      formattedTime: this.formatTime(this.timeLeft),
      isRunning: this.isRunning,
      sessionComplete: this.sessionComplete,
      showConfig: this.showConfig,
      statusText: this.sessionComplete
        ? 'Sesión completada'
        : (this.isRunning ? 'Temporizador activo' : 'Temporizador pausado'),
      cycleText: `${this.currentCycle} de ${this.totalCycles}`
    };
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else if (!this.sessionComplete) {
      this.startTimer();
    }
    this.notify();
  }

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft -= 1;
      } else {
        this.handlePhaseEnd();
      }
      this.notify();
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handlePhaseEnd() {
    this.pauseTimer();
    if (this.phase === 'focus' && this.currentCycle < this.totalCycles) {
      this.phase = 'break';
      this.timeLeft = this.breakMinutes * 60;
    } else if (this.phase === 'break') {
      this.phase = 'focus';
      this.currentCycle += 1;
      this.timeLeft = this.focusMinutes * 60;
    } else {
      this.sessionComplete = true;
    }
  }

  resetTimer() {
    this.pauseTimer();
    this.sessionComplete = false;
    this.currentCycle = 1;
    this.phase = 'focus';
    this.timeLeft = this.focusMinutes * 60;
    this.notify();
  }

  updateConfig(config) {
    if (!isValidPomodoroConfig(config)) {
      return { success: false, error: 'Introduce valores dentro de los rangos indicados.' };
    }
    this.focusMinutes = config.focusMinutes;
    this.breakMinutes = config.breakMinutes;
    this.totalCycles = config.totalCycles;
    savePomodoroConfig(config);
    this.showConfig = false;
    this.resetTimer();
    return { success: true };
  }

  openConfig() {
    if (!this.isRunning) {
      this.showConfig = true;
      this.notify();
    }
  }

  closeConfig() {
    this.showConfig = false;
    this.notify();
  }

  destroy() {
    this.pauseTimer();
  }

  notify() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.getState());
    }
  }
}
