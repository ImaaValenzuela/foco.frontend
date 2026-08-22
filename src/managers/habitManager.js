/**
 * Manager: HabitManager
 * Encapsula la gestión de datos, historial y reglas de negocio del Tracker de Hábitos.
 * Cumple con SRP desvinculando la manipulación de hábitos del componente de interfaz gráfica (UI).
 */

import { emitCustomEvent, FOCO_EVENTS } from '../utils/events.js';

export class HabitManager {
  constructor(onUpdateCallback = null) {
    this.onUpdate = onUpdateCallback;
    this.selectedOffset = 0; // 0 = Hoy, 1..7 = Historial
    this.habitsData = {
      0: [
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: true },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: false },
        { id: 4, name: 'Ocio planificado', completed: false },
      ],
      1: [
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: true },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: true },
        { id: 4, name: 'Ocio planificado', completed: true },
      ],
      2: [
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: false },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: false },
        { id: 4, name: 'Ocio planificado', completed: true },
      ],
      3: [
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: true },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: false },
        { id: 4, name: 'Ocio planificado', completed: false },
      ]
    };
  }

  getPastDays() {
    const list = [];
    const weekdayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push({
        offset: i,
        dayName: weekdayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
        formattedDate: `${d.getDate()}/${d.getMonth() + 1}`,
      });
    }
    return list;
  }

  setSelectedOffset(offset) {
    this.selectedOffset = offset;
    this.notify();
  }

  getCurrentHabits() {
    return this.habitsData[this.selectedOffset] || [];
  }

  toggleHabit(habitId) {
    if (this.selectedOffset !== 0) return;

    this.habitsData[0] = this.getCurrentHabits().map(habit => {
      if (habit.id === habitId) {
        const updated = { ...habit, completed: !habit.completed };
        if (typeof window !== 'undefined') emitCustomEvent(window, FOCO_EVENTS.HABIT_TOGGLED, updated);
        return updated;
      }
      return habit;
    });
    this.notify();
  }

  addHabit(name) {
    if (this.selectedOffset !== 0 || !name || !name.trim()) return;

    const current = this.getCurrentHabits();
    const newId = current.length > 0 ? Math.max(...current.map(h => h.id)) + 1 : 1;
    const newHabit = { id: newId, name: name.trim(), completed: false };

    current.push(newHabit);
    if (typeof window !== 'undefined') emitCustomEvent(window, FOCO_EVENTS.HABIT_ADDED, newHabit);
    this.notify();
  }

  deleteHabit(habitId) {
    if (this.selectedOffset !== 0) return;

    this.habitsData[0] = this.getCurrentHabits().filter(habit => habit.id !== habitId);
    if (typeof window !== 'undefined') emitCustomEvent(window, FOCO_EVENTS.HABIT_DELETED, { habitId });
    this.notify();
  }

  notify() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }
}
