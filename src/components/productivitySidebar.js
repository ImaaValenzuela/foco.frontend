import { renderPomodoro } from './productivity/pomodoro.js';
import { renderHabitTracker } from './productivity/habitTracker.js';
import { renderCalendarWidget } from './CalendarWidget.jsx';
import { PomodoroManager } from '../managers/pomodoroManager.js';
import { HabitManager } from '../managers/habitManager.js';
import { CalendarManager } from '../managers/calendarManager.js';
import { aplicarPaleta, obtenerPaletaActual, escucharCambiosDePaleta } from '../managers/paletteManager.js';
import { authService } from '../services/auth.service.js'; // Importamos el servicio de auth

/**
 * Componente: FocoProductivitySidebar (Vanilla JS)
 * Barra lateral derecha de productividad. Contiene el Cronómetro Pomodoro, Agenda Google Calendar y Tracker de Hábitos.
 * Refactorizado bajo el principio SRP (Single Responsibility Principle) delegando la lógica de negocio a Managers.
 */

class FocoProductivitySidebar extends HTMLElement {
  constructor() {
    super();
    this.pomodoroManager = new PomodoroManager(() => this.render());
    this.habitManager = new HabitManager(() => this.render());
    this.calendarManager = new CalendarManager(() => this.render());
  }

  // Modificamos a async para manejar la validación de sesión y carga de datos
  async connectedCallback() {
    this.className = "bg-[--color-prod-bg,white] border-l border-[--color-prod-bg,theme(colors.slate.200)] shadow-xl transition-all duration-300 flex flex-col relative z-10 w-16";
    this.aplicarVisibilidad(localStorage.getItem('foco-productivity-sidebar') !== 'false');
    this.onVisibilityChanged = (event) => this.aplicarVisibilidad(event.detail);
    window.addEventListener('foco:productivity-visibility-changed', this.onVisibilityChanged);
    this.onFullscreenChange = () => this.handleFullscreenChange();
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    escucharCambiosDePaleta((nombrePaleta) => aplicarPaleta(nombrePaleta));
    
    // 1. Render inicial (Muestra la interfaz de inmediato)
    this.render();

    // 2. Disparamos la carga asíncrona desde Supabase
    try {
      const session = await authService.getSession();
      if (session || authService.isGuest()) {
        await this.habitManager.loadInitialData(); 
        // loadInitialData() llamará internamente a notify() -> this.render()
        await this.calendarManager.init();
      }
    } catch (error) {
      console.error("Error al verificar sesión en el sidebar de productividad:", error);
    }
  }

  aplicarVisibilidad(visible) {
    this.classList.toggle('hidden', !visible);
  }

  disconnectedCallback() {
    // Limpieza de recursos al desmontar del DOM (previene fugas de memoria - LSP)
    this.pomodoroManager.destroy();
    this.calendarManager.destroy();
  }

  render() {
      const pomodoroState = this.pomodoroManager.getState();

      // Actualización selectiva del DOM cuando está en pantalla completa
      if (document.fullscreenElement && document.fullscreenElement.id === 'pomodoro-container') {
            const container = document.fullscreenElement;
            
            const displayEl = container.querySelector('#pomodoro-display');
            if (displayEl) {
              displayEl.textContent = pomodoroState.formattedTime;
            }

            const startBtn = container.querySelector('#start-pomodoro');
            if (startBtn) {
              startBtn.textContent = pomodoroState.isRunning ? 'Pausar' : 'Iniciar';
            }

            const statusEl = container.querySelector('#pomodoro-status');
            if (statusEl) {
              statusEl.textContent = pomodoroState.statusText;
            }

            const cycleEl = container.querySelector('#pomodoro-cycle');
            if (cycleEl) {
              cycleEl.textContent = `Ciclo ${pomodoroState.cycleText} - Descanso: ${pomodoroState.breakMinutes} Min`;
            }

            // Gestión del modal de configuración en pantalla completa
            let modalOverlay = container.querySelector('#config-overlay');

            if (pomodoroState.showConfig) {
              if (!modalOverlay) {
                container.insertAdjacentHTML('beforeend', this.renderConfigModal(pomodoroState));
                
                // Re-vincular eventos a los nuevos botones del modal inyectado
                container.querySelector('#close-config')?.addEventListener('click', () => this.pomodoroManager.closeConfig());
                container.querySelector('#cancel-config')?.addEventListener('click', () => this.pomodoroManager.closeConfig());
                container.querySelector('#save-config')?.addEventListener('click', () => this.handleSaveConfig());
              }
            } else if (modalOverlay) {
              modalOverlay.remove();
            }
            aplicarPaleta(obtenerPaletaActual());
            return;
          }

    const isExpanded = this.classList.contains('w-80');

    if (isExpanded) {
      const pastDays = this.habitManager.getPastDays();
      const currentHabits = this.habitManager.getCurrentHabits();

      // HTML del selector horizontal de días
      const daysHtml = pastDays.map(day => {
        const isSelected = this.habitManager.selectedOffset === day.offset;
        const textClass = isSelected ? 'text-orange-100' : 'text-slate-400';

        return `
          <button
            data-offset="${day.offset}"
            class="day-selector-btn flex flex-col items-center justify-center flex-grow py-1 px-1.5 rounded-lg transition-all text-center select-none ${isSelected ? 'bg-[--color-dia-sel-bg,#FC7206] text-[--color-dia-sel-texto,white] shadow-md font-bold scale-105' : 'hover:bg-slate-50 text-[--color-dia-texto,theme(colors.slate.500)] hover:text-slate-800'}"
            title="${day.isToday ? 'Hoy' : `Ver registro del ${day.formattedDate}`}"
          >
            <span class="text-[8px] uppercase tracking-tighter ${textClass}">
              ${day.dayName}
            </span>
            <span class="text-xs font-bold mt-0.5">
              ${day.dayNum}
            </span>
          </button>
        `;
      }).join('');

      // HTML del listado de hábitos
      const isToday = this.habitManager.selectedOffset === 0;
      const habitsHtml = currentHabits.map(habit => {
        const textClass = habit.completed ? 'line-through text-slate-400 font-normal' : 'font-semibold text-[--color-habito-texto,theme(colors.slate.700)]';
        const isDisabled = !isToday ? 'disabled' : '';
        const hoverClass = isToday ? 'cursor-pointer hover:bg-white/70' : 'cursor-not-allowed opacity-75';

        const deleteButtonHtml = isToday
          ? `
            <button 
              class="delete-habit-btn text-slate-400 hover:text-red-500 p-1 rounded transition-colors ml-2 focus:outline-none" 
              data-habit-id="${habit.id}"
              title="Eliminar hábito"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          `
          : '';

        return `
          <div 
            data-habit-id="${habit.id}"
            class="habit-row flex items-center justify-between text-xs transition-all p-1.5 rounded-xl ${hoverClass}"
          >
            <span class="${textClass} flex-grow select-none">
              ${habit.name}
            </span>
            <div class="flex items-center ml-2">
              <input 
                type="checkbox" 
                ${habit.completed ? 'checked' : ''} 
                ${isDisabled}
                class="rounded border-slate-300 text-foco-orange-accent focus:ring-foco-orange-accent h-4 w-4 ${isToday ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}" 
              />
              ${deleteButtonHtml}
            </div>
          </div>
        `;
      }).join('');

      // Formulario para ingresar nuevos hábitos (solo Hoy)
      const addHabitFormHtml = isToday
        ? `
          <div class="flex gap-2 pt-2 border-t border-slate-200/60 mt-2 w-full">
            <input 
              id="new-habit-input" 
              type="text" 
              placeholder="Nuevo hábito..." 
              class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-foco-orange-accent focus:border-foco-orange-accent text-slate-700 bg-white"
            />
            <button 
              id="add-habit-btn" 
              class="bg-[--color-btn-agregar,#FC7206] text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm hover:bg-orange-600 transition-all flex items-center justify-center focus:outline-none"
              title="Añadir hábito"
            >
              +
            </button>
          </div>
        `
        : '';
        
      const statusBadge = isToday
        ? '<span class="text-[9px] text-white bg-[--color-tag-hoy,#FC7206] font-bold px-1.5 py-0.5 rounded border border-orange-100">Hoy</span>'
        : '<span class="text-[9px] text-slate-500 bg-slate-50 font-bold px-1.5 py-0.5 rounded border border-slate-200">Historial</span>';
        
      this.innerHTML = `
      <div class="h-14 flex items-center justify-between px-4 border-b border-[--color-header-borde,theme(colors.slate.200)] bg-[--color-prod-bg,white]">
        <button id="toggle-sidebar" class="p-2 rounded-xl bg-[--color-prod-toggle-bg,theme(colors.slate.50)] hover:bg-slate-100 hover:text-[--color-btn-iniciar,#22298A] text-[--color-prod-icono,theme(colors.slate.500)] transition-all border border-[--color-header-borde,theme(colors.slate.200)] shadow-sm" title="Expandir Productividad">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left-open"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
        </button>
      </div>

      <div class="flex-1 p-4 space-y-4 overflow-y-auto foco-scrollbar">
        ${renderPomodoro({
          showConfig: pomodoroState.showConfig,
          configModal: this.renderConfigModal(pomodoroState),
          display: pomodoroState.formattedTime,
          status: pomodoroState.statusText,
          cycle: pomodoroState.cycleText,
          breakMinutes: pomodoroState.breakMinutes,
          isRunning: pomodoroState.isRunning,
        })}
        ${renderCalendarWidget(this.calendarManager.getState())}
        ${renderHabitTracker({ daysHtml, habitsHtml, addHabitFormHtml, statusBadge })}
      </div>
      `;
    } else {
      this.innerHTML = `
        <div class="h-14 flex items-center justify-center border-b border-[--color-header-borde,theme(colors.slate.100)] w-full bg-[--color-prod-bg,white]">
          <button id="toggle-sidebar" class="p-2 rounded-xl bg-[--color-prod-toggle-bg,theme(colors.slate.50)] hover:bg-slate-100 hover:text-[--color-btn-iniciar,#22298A] text-[--color-prod-icono,theme(colors.slate.500)] transition-all border border-[--color-header-borde,theme(colors.slate.200)] shadow-sm" title="Expandir Productividad">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left-close"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>
          </button>
        </div>

        <div class="flex-grow p-4 flex flex-col items-center select-none text-slate-400 w-full pt-6 space-y-6">
          <div id="quick-pomodoro" class="flex flex-col items-center cursor-pointer text-slate-400 hover:text-[--color-prod-icono,#22298A] transition-all group" title="Abrir Pomodoro">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check"><circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="m9 13 2 2 4-4"/></svg>
            <span class="text-[8px] font-black mt-1 uppercase tracking-wider group-hover:text-[--color-prod-icono,#22298A]">Foco</span>
          </div>

          <div id="quick-calendar" class="flex flex-col items-center cursor-pointer text-slate-400 hover:text-[--color-prod-icono,#22298A] transition-all group" title="Abrir Google Calendar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span class="text-[8px] font-bold mt-1.5 uppercase tracking-wider group-hover:text-[--color-prod-icono,#22298A]">Agenda</span>
          </div>

          <div id="quick-habits" class="flex flex-col items-center cursor-pointer text-slate-400 hover:text-[--color-prod-icono,#22298A] transition-all group" title="Abrir Tracker de Hábitos">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m9 15 2 2 4-4"/></svg>
            <span class="text-[8px] font-bold mt-1.5 uppercase tracking-wider group-hover:text-[--color-prod-icono,#22298A]">Hábitos</span>
          </div>
        </div>
      `;
    }

    this.bindEvents();
    aplicarPaleta(obtenerPaletaActual());
  }

  bindEvents() {
    const toggleBtn = this.querySelector('#toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCollapse());
    }

    this.querySelector('#start-pomodoro')?.addEventListener('click', () => this.pomodoroManager.toggleTimer());
    this.querySelector('#reset-pomodoro')?.addEventListener('click', () => this.pomodoroManager.resetTimer());
    this.querySelector('#open-config')?.addEventListener('click', () => this.pomodoroManager.openConfig());
    this.querySelector('#expand-pomodoro')?.addEventListener('click', () => this.togglePomodoroFullscreen());
    this.querySelector('#close-config')?.addEventListener('click', () => this.pomodoroManager.closeConfig());
    this.querySelector('#cancel-config')?.addEventListener('click', () => this.pomodoroManager.closeConfig());
    this.querySelector('#save-config')?.addEventListener('click', () => this.handleSaveConfig());

    this.querySelector('#quick-pomodoro')?.addEventListener('click', () => this.toggleCollapse());
    this.querySelector('#quick-calendar')?.addEventListener('click', () => this.toggleCollapse());
    this.querySelector('#quick-habits')?.addEventListener('click', () => {
      this.habitManager.setSelectedOffset(0);
      this.toggleCollapse();
    });

    // Google Calendar: Conexión y Actualización
    this.querySelector('#btn-connect-calendar')?.addEventListener('click', () => this.calendarManager.connectGoogleCalendar());
    this.querySelector('#btn-refresh-calendar')?.addEventListener('click', () => this.calendarManager.loadEvents(false));

    // Modal de agendamiento Drag & Drop
    this.querySelector('#modal-close-btn')?.addEventListener('click', () => this.calendarManager.closeScheduleModal());
    this.querySelector('#modal-cancel-btn')?.addEventListener('click', () => this.calendarManager.closeScheduleModal());
    this.querySelector('#modal-confirm-schedule-btn')?.addEventListener('click', async () => {
      const titleInput = this.querySelector('#modal-event-title');
      const dateInput = this.querySelector('#modal-event-date');
      const timeInput = this.querySelector('#modal-event-time');

      const title = titleInput?.value.trim() || 'Tarea de FOCO';
      const dateVal = dateInput?.value || new Date().toISOString().split('T')[0];
      const timeVal = timeInput?.value || '10:00';

      const startDateTime = new Date(`${dateVal}T${timeVal}:00`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

      try {
        await this.calendarManager.scheduleCard(
          { ...this.calendarManager.draggedCardData, title },
          startDateTime,
          endDateTime
        );
      } catch (err) {
        alert('Error al agendar en Google Calendar: ' + err.message);
      }
    });

    // Zona de caída (Drop Zone) para tarjetas desde el lienzo
    const dropZone = this.querySelector('.foco-calendar-dropzone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-orange-500', 'bg-orange-50/50');
        const hint = dropZone.querySelector('.drop-zone-hint');
        if (hint) hint.classList.remove('hidden');
      });

      dropZone.addEventListener('dragleave', (e) => {
        if (!dropZone.contains(e.relatedTarget)) {
          dropZone.classList.remove('border-orange-500', 'bg-orange-50/50');
          const hint = dropZone.querySelector('.drop-zone-hint');
          if (hint) hint.classList.add('hidden');
        }
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-orange-500', 'bg-orange-50/50');
        const hint = dropZone.querySelector('.drop-zone-hint');
        if (hint) hint.classList.add('hidden');

        let cardData = null;
        const jsonStr = e.dataTransfer.getData('application/json');
        if (jsonStr) {
          try {
            cardData = JSON.parse(jsonStr);
          } catch (parseErr) {
            console.warn('Error parseando JSON en drop de tarjeta:', parseErr);
          }
        }
        if (!cardData) {
          const plainText = e.dataTransfer.getData('text/plain');
          if (plainText) {
            cardData = { title: plainText, text: plainText };
          }
        }

        if (cardData) {
          this.calendarManager.openScheduleModal(cardData);
        }
      });
    }

    const dayButtons = this.querySelectorAll('.day-selector-btn');
    dayButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const offset = parseInt(e.currentTarget.getAttribute('data-offset'), 10);
        this.habitManager.setSelectedOffset(offset);
      });
    });

    if (this.habitManager.selectedOffset === 0) {
      const addBtn = this.querySelector('#add-habit-btn');
      const input = this.querySelector('#new-habit-input');

      const handleAdd = () => {
        if (input && input.value.trim()) {
          this.habitManager.addHabit(input.value);
        }
      };

      if (addBtn && input) {
        addBtn.addEventListener('click', handleAdd);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') handleAdd();
        });
      }

      const deleteButtons = this.querySelectorAll('.delete-habit-btn');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          // UUID CORRECCIÓN: Tratamos el habitId como un string, sin aplicar parseInt()
          const habitId = btn.getAttribute('data-habit-id');
          this.habitManager.deleteHabit(habitId);
        });
      });

      const habitRows = this.querySelectorAll('.habit-row');
      habitRows.forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.tagName === 'INPUT' || e.target.closest('.delete-habit-btn')) return;
          // UUID CORRECCIÓN
          const habitId = row.getAttribute('data-habit-id');
          this.habitManager.toggleHabit(habitId);
        });

        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.addEventListener('change', () => {
            // UUID CORRECCIÓN
            const habitId = row.getAttribute('data-habit-id');
            this.habitManager.toggleHabit(habitId);
          });
        }
      });
    }
  }

  toggleCollapse() {
    this.classList.toggle('w-16');
    this.classList.toggle('w-80');
    this.render();
  }

  togglePomodoroFullscreen() {
    var contenedorPomodoro = this.querySelector('#pomodoro-container');
    if (!contenedorPomodoro) return;

    if (!document.fullscreenElement) {
      contenedorPomodoro.requestFullscreen();
      contenedorPomodoro.classList.add('justify-center', 'h-screen');
      
      var displayEl = contenedorPomodoro.querySelector('#pomodoro-display');
      if (displayEl) {
        displayEl.classList.remove('text-5xl');
        displayEl.classList.add('text-9xl');
      }

var botonesEl = contenedorPomodoro.querySelector('#pomodoro-buttons');
      if (botonesEl) {
        botonesEl.classList.remove('w-full');
        botonesEl.classList.add('w-64', 'mx-auto', 'justify-center');
        var botonIniciar = botonesEl.querySelector('#start-pomodoro');
        if (botonIniciar) {
          botonIniciar.classList.remove('flex-grow');
        }
      

      var headerEl = contenedorPomodoro.querySelector('#pomodoro-header');
      if (headerEl) {
        headerEl.classList.add('absolute', 'top-0', 'left-0', 'right-0', 'px-6', 'pt-4');
      }

      }
    } else {
      document.exitFullscreen();
    }
  }

  handleFullscreenChange() {
    if (document.fullscreenElement) return;

    var contenedorPomodoro = this.querySelector('#pomodoro-container');
    if (!contenedorPomodoro) return;

    contenedorPomodoro.classList.remove('justify-center', 'h-screen');
    
    var displayEl = contenedorPomodoro.querySelector('#pomodoro-display');
    if (displayEl) {
      displayEl.classList.remove('text-9xl');
      displayEl.classList.add('text-5xl');
    }

    var botonesEl = contenedorPomodoro.querySelector('#pomodoro-buttons');
    if (botonesEl) {
      botonesEl.classList.remove('w-64', 'mx-auto', 'justify-center');
      botonesEl.classList.add('w-full');
      var botonIniciar = botonesEl.querySelector('#start-pomodoro');
      if (botonIniciar) {
        botonIniciar.classList.add('flex-grow');
      }
    }

    var headerEl = contenedorPomodoro.querySelector('#pomodoro-header');
    if (headerEl) {
      headerEl.classList.remove('absolute', 'top-0', 'left-0', 'right-0', 'px-6', 'pt-4');
    }
  }

    renderConfigModal(state) {
    return `<div id="config-overlay" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"><div class="bg-[--color-pomodoro-bg,white] rounded-2xl shadow-xl w-full max-w-xs p-6"><div class="flex justify-between mb-4"><h3 class="text-sm font-bold text-[--color-pomodoro-titulo,#1e293b]">Configurar tiempos</h3><button id="close-config" type="button" aria-label="Cerrar" class="text-[--color-pomodoro-titulo,#1e293b]">X</button></div><div class="space-y-3"><label class="text-xs text-[--color-pomodoro-titulo,#1e293b]">Enfoque<input id="input-focus" type="number" min="1" max="180" value="${state.focusMinutes}" class="w-full border rounded px-2 py-1 text-slate-800 bg-white" /></label><label class="text-xs text-[--color-pomodoro-titulo,#1e293b]">Descanso<input id="input-break" type="number" min="1" max="60" value="${state.breakMinutes}" class="w-full border rounded px-2 py-1 text-slate-800 bg-white" /></label><label class="text-xs text-[--color-pomodoro-titulo,#1e293b]">Ciclos<input id="input-cycles" type="number" min="1" max="12" value="${state.totalCycles}" class="w-full border rounded px-2 py-1 text-slate-800 bg-white" /></label></div><p id="config-error" class="text-xs text-red-600"></p><div class="flex gap-2 mt-4"><button id="save-config" type="button" class="flex-grow bg-[--color-btn-iniciar,#FC7206] text-white rounded py-2">Guardar</button><button id="cancel-config" type="button" class="border rounded px-3 text-[--color-pomodoro-titulo,#1e293b]">Cancelar</button></div></div></div>`;
  }

  handleSaveConfig() {
    const focus = Number(this.querySelector('#input-focus')?.value);
    const breakMin = Number(this.querySelector('#input-break')?.value);
    const cycles = Number(this.querySelector('#input-cycles')?.value);

    const res = this.pomodoroManager.updateConfig({
      focusMinutes: focus,
      breakMinutes: breakMin,
      totalCycles: cycles
    });

    if (!res.success) {
      const errEl = this.querySelector('#config-error');
      if (errEl) errEl.textContent = res.error;
    }
  }
}

customElements.define('foco-productivity-sidebar', FocoProductivitySidebar);