/**
 * Componente: FocoProductivitySidebar (Vanilla JS)
 * Barra lateral derecha de productividad. Contiene el Cronómetro Pomodoro y el Tracker de Hábitos con historial.
 * Inicia replegada (w-16) mostrando solo un ícono rápido y se expande a (w-80) al hacer clic.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */

class FocoProductivitySidebar extends HTMLElement {
  constructor() {
    super();

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

    this.habitsData = this.habitsData.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, completed: !habit.completed };
      }
      return habit;
    });
    this.render();
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

      // Generar el HTML dinámico para el listado de hábitos
      const habitsHtml = currentHabits.map(habit => {
        const isToday = this.selectedOffset === 0;
        
        // Estilos e íconos SVG de checkbox según el mockup de F.O.C.O.
        const checkboxHtml = habit.completed
          ? `<div class="w-5 h-5 flex items-center justify-center rounded-md bg-foco-orange-accent text-white shadow-sm border border-foco-orange-accent transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
             </div>`
          : `<div class="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-foco-orange-accent transition-all bg-white"></div>`;

        // Textos del mockup: completados tienen color más oscuro, pendientes son normales
        const textClass = habit.completed 
          ? 'text-foco-blue-deep font-bold text-xs' 
          : 'text-slate-600 font-semibold text-xs';
        
        const hoverClass = isToday ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed opacity-75';

        return `
          <div 
            data-habit-id="${habit.id}"
            class="habit-row flex items-center justify-start gap-3 text-xs transition-all p-1.5 rounded-xl ${hoverClass}"
          >
            <div class="flex items-center select-none">
              ${checkboxHtml}
            </div>
            <span class="${textClass} flex-grow select-none text-left">
              ${habit.name}
            </span>
          </div>
        `;
      }).join('');

      const statusBadge = this.selectedOffset === 0
        ? '<span class="text-[9px] text-foco-orange-accent bg-orange-50 font-bold px-1.5 py-0.5 rounded border border-orange-100">Hoy</span>'
        : '<span class="text-[9px] text-slate-500 bg-slate-50 font-bold px-1.5 py-0.5 rounded border border-slate-200">Solo Lectura</span>';


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
          <div class="text-5xl font-mono font-black text-slate-800 tracking-tight my-2">
            25:00
          </div>

          <!-- Metadatos de Enfoque y Tiempos de descanso -->
          <div class="text-center space-y-0.5 mb-5">
            <p class="text-xs font-bold text-foco-blue-deep">Modo: Enfoque Integral</p>
            <p class="text-[10px] font-semibold text-slate-400">Ciclo 1 de 4 - Descanso: 5 Min</p>
          </div>

          <!-- Botones de Interacción del Temporizador -->
          <div class="flex w-full gap-3">
            <!-- Iniciar (Naranja Institucional de FOCO) -->
            <button class="flex-grow py-2.5 px-5 bg-foco-orange-accent hover:bg-foco-orange-light text-white text-xs font-extrabold rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-center">
              Iniciar
            </button>
            
            <!-- Configurar (Borde Gris/Slate) -->
            <button class="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-full active:scale-95 transition-all text-center">
              Configurar
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
        <div class="flex-grow overflow-y-auto p-4 flex flex-col items-center select-none text-slate-400 w-full pt-6 space-y-6">
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
      const habitRows = this.querySelectorAll('.habit-row');
      habitRows.forEach(row => {
        row.addEventListener('click', (e) => {
          const habitId = parseInt(row.getAttribute('data-habit-id'), 10);
          this.toggleHabit(habitId);
        });
      });
    }
  }

  toggleCollapse() {
    this.classList.toggle('w-16');
    this.classList.toggle('w-80');
    this.render();
  }
}

// Registro oficial en el DOM del navegador
customElements.define('foco-productivity-sidebar', FocoProductivitySidebar);
