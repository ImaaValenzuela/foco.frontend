/**
 * Manager: PomodoroManager
 * Aísla la lógica de negocio y estado del temporizador Pomodoro.
 * Cumple con SRP desvinculando la gestión de intervalos y estado del ciclo de la capa de presentación (UI).
 * Integra sincronización asíncrona con el Backend y Motor de Inferencia IA.
 */

import { loadPomodoroConfig, savePomodoroConfig, isValidPomodoroConfig } from '../components/productivity/pomodoroConfig.js';
import { emitCustomEvent, FOCO_EVENTS } from '../utils/events.js';
import { authService } from '../services/auth.service.js';

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
    
    // 1. CAPTURA DE ÉXITO: El ciclo de enfoque llegó a cero naturalmente.
    if (this.phase === 'focus') {
      this.saveSessionToBackend(true);
    }

    if (this.phase === 'focus' && this.currentCycle < this.totalCycles) {
      this.phase = 'break';
      this.timeLeft = this.breakMinutes * 60;
      if (typeof window !== 'undefined') emitCustomEvent(window, FOCO_EVENTS.POMODORO_PHASE_CHANGE, { phase: 'break', cycle: this.currentCycle });
    } else if (this.phase === 'break') {
      this.phase = 'focus';
      this.currentCycle += 1;
      this.timeLeft = this.focusMinutes * 60;
      if (typeof window !== 'undefined') emitCustomEvent(window, FOCO_EVENTS.POMODORO_PHASE_CHANGE, { phase: 'focus', cycle: this.currentCycle });
    } else {
      this.sessionComplete = true;
      if (typeof window !== 'undefined') emitCustomEvent(window, FOCO_EVENTS.POMODORO_COMPLETE, { totalCycles: this.totalCycles });
    }
  }

  resetTimer() {
    this.pauseTimer();
    
    // 2. CAPTURA DE ABANDONO: Si reinicia mientras estaba en 'focus' y el tiempo bajó, lo consideramos una interrupción.
    if (this.phase === 'focus' && this.timeLeft < (this.focusMinutes * 60)) {
        this.saveSessionToBackend(false);
    }

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

  // --- NUEVA LÓGICA DE PERSISTENCIA ---
  /**
   * Envía la telemetría de la sesión al backend.
   * Ejecutado bajo el patrón Fire-and-Forget para no bloquear la UI.
   * @param {boolean} isCompleted Indica si el Pomodoro se completó exitosamente o se interrumpió.
   */
async saveSessionToBackend(isCompleted) {
    try {
      // 1. Obtener la sesión real a través de tu servicio de autenticación
      const session = await authService.getSession();
      
      // Dependiendo de tu implementación exacta en auth.service.js, 
      // el token suele estar en session.access_token
      const token = session?.access_token; 

      if (!token) {
        console.error('❌ Pomodoro: No hay usuario autenticado (Token nulo).');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const payload = {
        focus_duration: this.focusMinutes,
        break_duration: this.breakMinutes,
        is_completed: isCompleted
      };

      const response = await fetch(`${API_URL}/pomodoros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // 2. Validación estricta de la respuesta HTTP
      if (!response.ok) {
        // Intentamos parsear el mensaje de error del backend
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Sesión Pomodoro persistida en Supabase y evaluada:', data);

    } catch (error) {
      // Ahora capturará y mostrará explícitamente errores 401, 404 o caídas de red
      console.error('❌ Error crítico al guardar el Pomodoro:', error.message);
    }
  }
}