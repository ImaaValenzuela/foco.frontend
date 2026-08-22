const DEFAULT_CONFIG = { focusMinutes: 25, breakMinutes: 5, totalCycles: 4 };

export function loadPomodoroConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem('foco-pomodoro-config') || '{}') };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function savePomodoroConfig(config) {
  localStorage.setItem('foco-pomodoro-config', JSON.stringify(config));
}

export function isValidPomodoroConfig(values) {
  return Number.isInteger(values.focusMinutes) && values.focusMinutes >= 1 && values.focusMinutes <= 180
    && Number.isInteger(values.breakMinutes) && values.breakMinutes >= 1 && values.breakMinutes <= 60
    && Number.isInteger(values.totalCycles) && values.totalCycles >= 1 && values.totalCycles <= 12;
}
