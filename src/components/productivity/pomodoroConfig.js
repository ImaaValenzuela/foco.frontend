import { localStore } from '../../services/storage.service.js';

const DEFAULT_CONFIG = { focusMinutes: 25, breakMinutes: 5, totalCycles: 4 };
const STORAGE_KEY = 'foco-pomodoro-config';

export function loadPomodoroConfig() {
  const saved = localStore.getItem(STORAGE_KEY);
  if (saved && typeof saved === 'object') {
    return { ...DEFAULT_CONFIG, ...saved };
  }
  return DEFAULT_CONFIG;
}

export function savePomodoroConfig(config) {
  localStore.setItem(STORAGE_KEY, config);
}

export function isValidPomodoroConfig(values) {
  return Number.isInteger(values.focusMinutes) && values.focusMinutes >= 1 && values.focusMinutes <= 180
    && Number.isInteger(values.breakMinutes) && values.breakMinutes >= 1 && values.breakMinutes <= 60
    && Number.isInteger(values.totalCycles) && values.totalCycles >= 1 && values.totalCycles <= 12;
}
