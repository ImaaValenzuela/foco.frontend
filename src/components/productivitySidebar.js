/**
 * Componente: FocoProductivitySidebar (Vanilla JS)
 * Barra lateral derecha de productividad. Contiene el Cronómetro Pomodoro y el Tracker de Hábitos con historial.
 * Inicia replegada (w-16) mostrando solo un ícono rápido y se expande a (w-80) al hacer clic.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */

class FocoProductivitySidebar extends HTMLElement {
  constructor() {
    super();

    const saved = JSON.parse(localStorage.getItem('foco-pomodoro-config') || '{}');
    this.focusMinutes = saved.focusMinutes || 25;
    this.breakMinutes = saved.breakMinutes || 5;
    this.totalCycles = saved.totalCycles || 4;
    this.currentCycle = 1;
    this.phase = 'focus';
    this.timeLeft = this.focusMinutes * 60;
    this.isRunning = false;
    this.timerInterval = null;
    this.sessionComplete = false;

    // 1. ESTADO: Día seleccionado (0 = Hoy, 1 a 7 = Días anteriores)
    this.selectedOffset = 0;

    // 2. ESTADO: Datos de hábitos que simulan los registros de habit_logs en Supabase.
    this.habitsData = {
      0: [ // Hoy
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: true },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: false },
        { id: 4, name: 'Ocio planificado', completed: false },
      ],
      1: [ // Ayer
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: true },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: true },
        { id: 4, name: 'Ocio planificado', completed: true },
      ],
      2: [ // Hace 2 días
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: false },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: false },
        { id: 4, name: 'Ocio planificado', completed: true },
      ],
      3: [ // Hace 3 días
        { id: 1, name: 'Estudiar programación (1,5 hs)', completed: true },
        { id: 2, name: 'Leer un capítulo de un libro', completed: true },
        { id: 3, name: 'Actividad física', completed: false },
        { id: 4, name: 'Ocio planificado', completed: false },
      ]
    };
  }

  connectedCallback() {
    // Inicializar el estado replegado por defecto (w-16)
    this.className = "bg-white border-l border-slate-200 shadow-xl transition-all duration-300 flex flex-col relative z-10 w-16";
    this.render();
  }


  // 3. LÓGICA DE TIEMPO: Genera los últimos 8 días calendario (Hoy + 7 días anteriores)
  getPastDays() {
    const list = [];
    const weekdayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push({
        offset: i, // 0 = Hoy, 1 = Ayer, 2 = Hace 2 días, etc.
        dayName: weekdayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
        formattedDate: `${d.getDate()}/${d.getMonth() + 1}`,
      });
    }
    return list;
  }

  // 4. MANEJADOR DE CAMBIOS: Permite checkear/uncheckear hábitos únicamente si es hoy (offset 0)
  toggleHabit(habitId) {
    if (this.selectedOffset !== 0) return; // Bloqueo de seguridad para evitar manipular el historial

    this.habitsData[this.selectedOffset] = this.habitsData[this.selectedOffset].map(habit => {
      if (habit.id === habitId) {
        return { ...habit, completed: !habit.completed };
      }
      return habit;
    });
    this.render();
  }

  // Añadir un nuevo hábito (habilitado únicamente para el día de la fecha)
  addHabit(name) {
    if (this.selectedOffset !== 0 || !name.trim()) return; // Bloqueo de seguridad si no es hoy

    const currentHabits = this.habitsData[this.selectedOffset];

    // Genera un ID único e incremental mayor que los existentes en el día actual
    const newId = currentHabits.length > 0 
      ? Math.max(...currentHabits.map(h => h.id)) + 1 
      : 1;

    const newHabit = {
      id: newId,
      name: name.trim(),
      completed: false
    };

    currentHabits.push(newHabit);
    this.render(); // Redibujar la interfaz para reflejar los cambios
  }

  // Eliminar un hábito (habilitado únicamente para el día de la fecha)
  deleteHabit(habitId) {
    if (this.selectedOffset !== 0) return; // Bloqueo de seguridad si no es hoy

    this.habitsData[this.selectedOffset] = this.habitsData[this.selectedOffset].filter(habit => habit.id !== habitId);
    this.render(); // Redibujar la interfaz para reflejar los cambios
  }

  render() {
    const isExpanded = this.classList.contains('w-80');

    if (isExpanded) {
      const pastDays = this.getPastDays();
      const currentHabits = this.habitsData[this.selectedOffset] || [];

      // Generar el HTML dinámico para el selector horizontal de días
      const daysHtml = pastDays.map(day => {
        const isSelected = this.selectedOffset === day.offset;
        const btnClass = isSelected
          ? 'bg-foco-orange-accent text-white shadow-md font-bold scale-105'
          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800';
        const textClass = isSelected ? 'text-orange-100' : 'text-slate-400';

        return `
          <button
            data-offset="${day.offset}"
            class="day-selector-btn flex flex-col items-center justify-center flex-grow py-1 px-1.5 rounded-lg transition-all text-center select-none"
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

// Generar el HTML dinámico para el listado de hábitos (reemplazar esta sección)
      const habitsHtml = currentHabits.map(habit => {
        const isToday = this.selectedOffset === 0;
        const textClass = habit.completed ? 'line-through text-slate-400 font-normal' : 'font-semibold text-slate-700';
        const isDisabled = !isToday ? 'disabled' : '';
        const hoverClass = isToday ? 'cursor-pointer hover:bg-white/70' : 'cursor-not-allowed opacity-75';

        // Botón de eliminar, visible únicamente si es Hoy
        const deleteButtonHtml = isToday
          ? `
            <button 
              class="delete-habit-btn text-slate-400 hover:text-red-500 p-1 rounded transition-colors ml-2 focus:outline-none" 
              data-habit-id="${habit.id}"
              title="Eliminar hábito"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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

      // Formulario para ingresar nuevos hábitos, renderizado únicamente si es Hoy
      const isToday = this.selectedOffset === 0;
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
              class="bg-foco-orange-accent text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm hover:bg-orange-600 transition-all flex items-center justify-center focus:outline-none"
              title="Añadir hábito"
            >
              +
            </button>
          </div>
        `
        : '';
        
      const statusBadge = this.selectedOffset === 0
        ? '<span class="text-[9px] text-foco-orange-accent bg-orange-50 font-bold px-1.5 py-0.5 rounded border border-orange-100">Hoy</span>'
        : '<span class="text-[9px] text-slate-500 bg-slate-50 font-bold px-1.5 py-0.5 rounded border border-slate-200">Historial</span>';


      this.innerHTML = `

      <!-- ENCABEZADO PANEL EXPANDIDO -->
      <div class="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <button id="toggle-sidebar" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-foco-blue-deep text-slate-500 transition-all border border-slate-200/50 shadow-sm" title="Expandir Productividad">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left-open-icon lucide-panel-left-open"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </button>
      </div>

      <!-- Cuerpo de la Sidebar (Contenedor de widgets) -->
      <div class="flex-1 p-4 space-y-4 overflow-y-auto foco-scrollbar">
        
        <!-- TARJETA DEL CRONÓMETRO POMODORO -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center relative overflow-hidden">
          
          <!-- Header del Widget (Icono reloj + Título + Botón de minimizar widget) -->
          <div class="w-full flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <div class="flex items-center space-x-2 text-foco-blue-deep">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check-icon lucide-alarm-clock-check"><circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="m9 13 2 2 4-4"/></svg>                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-xs font-bold uppercase tracking-wide">Cronómetro Pomodoro</span>
            </div>
            <button class="text-slate-300 hover:text-slate-500 text-xs">
            </button>
          </div>

          <!-- Tiempo Principal (Estilo Monospace de alta visibilidad) -->
          <div id="pomodoro-display" class="text-5xl font-mono font-black text-slate-800 tracking-tight my-2">
            ${this.formatTime(this.timeLeft)}
          </div>

          <!-- Metadatos de Enfoque y Tiempos de descanso -->
          <div class="text-center space-y-0.5 mb-5">
            <p class="text-xs font-bold text-foco-blue-deep">${this.sessionComplete ? 'Sesión completada' : (this.isRunning ? 'Temporizador activo' : 'Temporizador pausado')}</p>
            <p class="text-[10px] font-semibold text-slate-400">Ciclo ${this.currentCycle} de ${this.totalCycles} - Descanso: ${this.breakMinutes} Min</p>
          </div>

          <!-- Botones de Interacción del Temporizador -->
          <div class="flex w-full gap-3">
            <!-- Iniciar (Naranja Institucional de FOCO) -->
              <button id="start-pomodoro" class="flex-grow py-2.5 px-5 bg-foco-orange-accent hover:bg-foco-orange-light text-white text-xs font-extrabold rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-center">
                ${this.isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            
            <!-- Configurar (Borde Gris/Slate) -->
              <button id="reset-pomodoro" class="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-full active:scale-95 transition-all text-center">
                Reiniciar
            </button>
          </div>

        </div>


            <!-- TARJETA DE TRACKER DE HÁBITOS DIARIOS -->
            <div class="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300 space-y-3">
              
              <!-- Header del Widget -->
              <div class="w-full flex justify-between items-center border-b border-slate-100 pb-2">
                <div class="flex items-center space-x-2 text-foco-blue-deep">
                  <!-- Clipboard Check SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check-icon lucide-calendar-check"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m9 15 2 2 4-4"/></svg>
                  <span class="text-xs font-bold uppercase tracking-wide">Hábitos diarios</span>
                </div>
                ${statusBadge}
              </div>

              <!-- Selector horizontal de los últimos 8 días -->
              <div class="flex justify-between items-center bg-slate-50 border border-slate-200/80 rounded-xl p-1 w-full overflow-hidden gap-0.5">
                ${daysHtml}
              </div>

              <!-- Contenedor de la lista de hábitos -->
                <div class="space-y-1.5">
                  ${habitsHtml}
                </div>
                ${addHabitFormHtml}
              </div>

            </div>
        </div>
      `;
    } else {
      this.innerHTML = `
        <!-- ENCABEZADO PANEL REPLEGADO -->
        <div class="h-14 flex items-center justify-center border-b border-slate-100 w-full">
          <!-- Botón de expandido -->
          <button id="toggle-sidebar" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-foco-blue-deep text-slate-500 transition-all border border-slate-200/50 shadow-sm" title="Expandir Productividad">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left-close-icon lucide-panel-left-close"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>
          </button>
        </div>

        <!-- CUERPO REPLEGADO -->
        <div class="flex-grow p-4 flex flex-col items-center select-none text-slate-400 w-full pt-6 space-y-6">
          <div id="quick-pomodoro" class="flex flex-col items-center cursor-pointer text-slate-400 hover:text-foco-blue-deep transition-all group" title="Abrir Pomodoro">
            <!-- SVG de Reloj -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check-icon lucide-alarm-clock-check"><circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="m9 13 2 2 4-4"/></svg>
            <span class="text-[8px] font-black mt-1 uppercase tracking-wider group-hover:text-foco-blue-deep">Foco</span>
          </div>

        <div id="quick-habits" class="flex flex-col items-center cursor-pointer text-slate-400 hover:text-foco-blue-deep transition-all group" title="Abrir Tracker de Hábitos">
            <!-- SVG de Habits -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check-icon lucide-calendar-check"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m9 15 2 2 4-4"/></svg>
            <span class="text-[8px] font-bold mt-1.5 uppercase tracking-wider group-hover:text-foco-blue-deep">Hábitos</span>
          </div>
        </div>
      `;
    }

    this.bindEvents();
  }

  // 5. EVENT LISTENERS: Captura manual de interacciones DOM en Vanilla JS
  bindEvents() {
    // Control del plegado/desplegado de la barra
    const toggleBtn = this.querySelector('#toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCollapse());
    }

    this.querySelector('#start-pomodoro')?.addEventListener('click', () => this.toggleTimer());
    this.querySelector('#reset-pomodoro')?.addEventListener('click', () => this.resetTimer());

    const quickIconPomodoro = this.querySelector('#quick-pomodoro');
    if (quickIconPomodoro) {
      quickIconPomodoro.addEventListener('click', () => this.toggleCollapse());
    }

    const quickIconHabits = this.querySelector('#quick-habits');
    if (quickIconHabits) {
      quickIconHabits.addEventListener('click', () => {
        this.selectedOffset = 0; // Al abrir por el acceso rápido, lo setea en Hoy automáticamente
        this.toggleCollapse();
      });
    }

    // Interacción con los botones de selección de día (offset)
    const dayButtons = this.querySelectorAll('.day-selector-btn');
    dayButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const offset = parseInt(e.currentTarget.getAttribute('data-offset'), 10);
        this.selectedOffset = offset;
        this.render();
      });
    });

    // Interacción con la lista de hábitos (Habilitada únicamente si es Hoy - selectedOffset === 0)
    if (this.selectedOffset === 0) {
      // EVENT LISTENERS PARA AÑADIR UN NUEVO HÁBITO
      const addBtn = this.querySelector('#add-habit-btn');
      const input = this.querySelector('#new-habit-input');

      const handleAdd = () => {
        if (input && input.value.trim()) {
          this.addHabit(input.value);
        }
      };

      if (addBtn && input) {
        addBtn.addEventListener('click', handleAdd);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') handleAdd();
        });
      }

      // EVENT LISTENERS PARA ELIMINAR HÁBITOS
      const deleteButtons = this.querySelectorAll('.delete-habit-btn');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); // Evita que el evento se propague a la fila y marque/desmarque el hábito
          const habitId = parseInt(btn.getAttribute('data-habit-id'), 10);
          this.deleteHabit(habitId);
        });
      });

      // EVENT LISTENERS ORIGINALES DE LA FILA (Modificados para evitar conflictos de clicks)
      const habitRows = this.querySelectorAll('.habit-row');
      habitRows.forEach(row => {
        row.addEventListener('click', (e) => {
          // Previene que se dispare si el usuario hace clic en la casilla de verificación o en el botón de eliminar
          if (e.target.tagName === 'INPUT' || e.target.closest('.delete-habit-btn')) return;
          
          const habitId = parseInt(row.getAttribute('data-habit-id'), 10);
          this.toggleHabit(habitId);
        });

        // Asegurar que cambiar el checkbox directo también dispare el re-renderizado
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.addEventListener('change', () => {
            const habitId = parseInt(row.getAttribute('data-habit-id'), 10);
            this.toggleHabit(habitId);
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

  formatTime(seconds) {
    return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  toggleTimer() {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    } else if (!this.sessionComplete) {
      this.isRunning = true;
      this.timerInterval = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft -= 1;
          const display = this.querySelector('#pomodoro-display');
          if (display) display.textContent = this.formatTime(this.timeLeft);
        } else {
          this.isRunning = false;
          clearInterval(this.timerInterval);
          this.timerInterval = null;
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
          this.render();
        }
      }, 1000);
    }
    this.render();
  }

  resetTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.isRunning = false;
    this.sessionComplete = false;
    this.currentCycle = 1;
    this.phase = 'focus';
    this.timeLeft = this.focusMinutes * 60;
    this.render();
  }
}

// Registro oficial en el DOM del navegador
customElements.define('foco-productivity-sidebar', FocoProductivitySidebar);
