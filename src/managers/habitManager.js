/**
 * Manager: HabitManager
 * Encapsula la gestión de datos, historial y reglas de negocio del Tracker de Hábitos.
 * Cumple con SRP desvinculando la manipulación de hábitos del componente de interfaz gráfica (UI).
 */

import { emitCustomEvent, FOCO_EVENTS } from '../utils/events.js';
import { habitService } from '../services/habit.service.js';
import { authService } from '../services/auth.service.js';

export class HabitManager {
  constructor(onUpdateCallback = null) {
    this.onUpdate = onUpdateCallback;
    this.selectedOffset = 0; 
    this.habitsData = {}; // Estructura local optimista
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

  // [FIX 1: Timezone] Genera la fecha YYYY-MM-DD usando los valores locales 
  // del dispositivo del usuario, evitando saltos de día por la conversión UTC.
  _getDateStringForOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // [FIX 2: Transformación de Datos] 
  async loadInitialData() {
    if (authService.isGuest()) {
        // Aquí puedes cargar desde localStorage si es invitado
        return; 
    }
    
    try {
      const dbHabits = await habitService.fetchHabits();
      if (!dbHabits) return;
      
      // Inicializamos los arrays vacíos para los 8 días de vista (0 a 7)
      for (let i = 0; i <= 7; i++) {
        this.habitsData[i] = [];
      }

      // Cruzamos los hábitos de la BBDD con los 8 días del frontend
      dbHabits.forEach(dbHabit => {
        const baseHabit = { id: dbHabit.id, name: dbHabit.name };

        for (let offset = 0; offset <= 7; offset++) {
          const targetDate = this._getDateStringForOffset(offset);
          
          // Buscamos si existe un log completado para esta fecha específica
          const logForDay = dbHabit.habit_logs.find(log => log.logged_date === targetDate);

          this.habitsData[offset].push({
            ...baseHabit,
            completed: logForDay ? logForDay.is_completed : false
          });
        }
      });
      
      this.notify();
    } catch (error) {
      console.error("Error cargando hábitos desde Supabase:", error);
    }
  }

  async toggleHabit(habitId) {
    const currentHabits = this.getCurrentHabits();
    const habitIndex = currentHabits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;

    const habit = currentHabits[habitIndex];
    const newStatus = !habit.completed;
    
    // 1. Actualización Optimista Local
    currentHabits[habitIndex] = { ...habit, completed: newStatus };
    this.habitsData[this.selectedOffset] = currentHabits;
    
    if (typeof window !== 'undefined') {
      emitCustomEvent(window, FOCO_EVENTS.HABIT_TOGGLED, currentHabits[habitIndex]);
    }
    this.notify();

    // 2. Persistencia en Supabase
    if (!authService.isGuest()) {
      try {
        const loggedDate = this._getDateStringForOffset(this.selectedOffset);
        await habitService.upsertLog(habitId, loggedDate, newStatus);
      } catch (error) {
        console.error("Fallo al persistir toggle, revirtiendo estado:", error);
        currentHabits[habitIndex] = { ...habit, completed: !newStatus };
        this.habitsData[this.selectedOffset] = currentHabits;
        this.notify();
      }
    }
  }

  async addHabit(name) {
    if (this.selectedOffset !== 0 || !name || !name.trim()) return;
    const trimmedName = name.trim();

    // [FIX 3: UUID Nativo] Creamos un identificador alfanumérico temporal 
    // en lugar de un entero para evitar conflictos de renderizado previo a la respuesta.
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `temp-${Date.now()}`; 

    const optimisticHabit = { id: tempId, name: trimmedName, completed: false };
    
    if (!this.habitsData[0]) this.habitsData[0] = [];
    this.habitsData[0].push(optimisticHabit);
    
    if (typeof window !== 'undefined') {
      emitCustomEvent(window, FOCO_EVENTS.HABIT_ADDED, optimisticHabit);
    }
    this.notify();

    if (!authService.isGuest()) {
      try {
        const savedHabit = await habitService.insertHabit(trimmedName);
        
        // Reemplazar el ID temporal con el UUID real devuelto por la base de datos
        // Iteramos sobre todos los offsets por si el usuario cambió de día rápido
        for (let offset in this.habitsData) {
            const index = this.habitsData[offset].findIndex(h => h.id === tempId);
            if (index !== -1) {
              this.habitsData[offset][index].id = savedHabit.id;
            }
        }
      } catch (error) {
        console.error("Fallo al crear hábito, revirtiendo UI:", error);
        this.habitsData[0] = this.habitsData[0].filter(h => h.id !== tempId);
        this.notify();
      }
    }
  }

  async deleteHabit(habitId) {
    if (this.selectedOffset !== 0) return;

    const backupHabits = [...this.habitsData[0]];

    // Actualización Optimista
    this.habitsData[0] = this.getCurrentHabits().filter(habit => habit.id !== habitId);
    if (typeof window !== 'undefined') {
      emitCustomEvent(window, FOCO_EVENTS.HABIT_DELETED, { habitId });
    }
    this.notify();

    if (!authService.isGuest()) {
      try {
        await habitService.deleteHabit(habitId);
        // Opcional: Limpiar el hábito de los otros offsets (1 a 7) para consistencia en memoria
        for (let i = 1; i <= 7; i++) {
            if (this.habitsData[i]) {
                this.habitsData[i] = this.habitsData[i].filter(h => h.id !== habitId);
            }
        }
      } catch (error) {
        console.error("Fallo al eliminar en DB, restaurando:", error);
        this.habitsData[0] = backupHabits;
        this.notify();
      }
    }
  }

  notify() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate();
    }
  }
}