/**
 * Utility: EventBus / Custom Events
 * Nombres y despacho estandarizado de eventos personalizados de HTML5.
 * Cumple con ISP (Interface Segregation Principle) y OCP al desacoplar emisores y receptores.
 */

export const FOCO_EVENTS = {
  BLOCK_SAVED: 'foco:block-saved',
  HABIT_TOGGLED: 'foco:habit-toggled',
  HABIT_ADDED: 'foco:habit-added',
  HABIT_DELETED: 'foco:habit-deleted',
  POMODORO_TICK: 'foco:pomodoro-tick',
  POMODORO_PHASE_CHANGE: 'foco:pomodoro-phase-change',
  POMODORO_COMPLETE: 'foco:pomodoro-complete',
  AUTH_STATE_CHANGE: 'foco:auth-state-change',
};

export function emitCustomEvent(element, eventName, detail = {}) {
  if (!element) return;
  const customEvent = new CustomEvent(eventName, {
    bubbles: true,
    composed: true,
    detail
  });
  element.dispatchEvent(customEvent);
}
