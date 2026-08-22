/**
 * Componente: ProductivitySidebar
 * Barra lateral derecha de productividad. Contiene únicamente el Cronómetro Pomodoro.
 * Inicia replegada (w-16) mostrando solo un ícono rápido y se expande a (w-80) al hacer clic.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 *
 * US 4.1.1: Iniciar, pausar y reiniciar ciclos de enfoque.
 * US 4.1.2: Modal de configuración para personalizar tiempos de enfoque, descanso y cantidad de ciclos.
 */
class FocoProductivitySidebar extends HTMLElement {
  constructor() {
    super();

    // --- Configuración personalizable (US 4.1.2) ---
    this.focusMinutes = 25;   // Duración del bloque de enfoque
    this.breakMinutes = 5;    // Duración del descanso corto
    this.totalCycles = 4;     // Cantidad de ciclos de enfoque

    // --- Estado del temporizador ---
    this.currentCycle = 1;
    this.timeLeft = this.focusMinutes * 60; // en segundos
    this.isRunning = false;
    this.timerInterval = null;

    // --- Estado del modal de configuración ---
    this.showConfig = false;
  }

  connectedCallback() {
    // Inicializar el estado replegado por defecto (w-16)
    this.className = "bg-white border-l border-slate-200 shadow-xl transition-all duration-300 flex flex-col relative z-10 w-16";
    this.render();
  }

  render() {
    const isExpanded = this.classList.contains('w-80');

    if (isExpanded) {
      this.innerHTML = `
       <!-- Encabezado de la Sidebar con botón de config y contraer -->
      <div class="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <button id="open-config" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-foco-blue-deep text-slate-500 transition-all border border-slate-200/50 shadow-sm" title="Configurar tiempos">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button id="toggle-sidebar" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-foco-blue-deep text-slate-500 transition-all border border-slate-200/50 shadow-sm" title="Contraer Productividad">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-right-close">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M15 3v18"/>
            <path d="m8 9 3 3-3 3"/>
          </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6" />
              </svg>
            </button>
          </div>

          <!-- Tiempo Principal (Estilo Monospace de alta visibilidad) -->
          <div id="pomodoro-display" class="text-5xl font-mono font-black text-slate-800 tracking-tight my-2">
            ${this.formatTime(this.timeLeft)}
          </div>

          <!-- Metadatos de Enfoque y Tiempos de descanso -->
          <div class="text-center space-y-0.5 mb-5">
            <p class="text-xs font-bold text-foco-blue-deep">Modo: ${this.isRunning ? '🔥 Enfoque Activo' : 'Modo Enfoque'}</p>
            <p class="text-[10px] font-semibold text-slate-400">Ciclo ${this.currentCycle} de ${this.totalCycles} - Descanso: ${this.breakMinutes} Min</p>
          </div>

          <!-- Botones de Interacción del Temporizador -->
          <div class="flex w-full gap-3">
            <!-- Iniciar (Naranja Institucional de FOCO) -->
            <button id="start-pomodoro" class="flex-grow py-2.5 px-5 bg-foco-orange-accent hover:bg-foco-orange-light text-white text-xs font-extrabold rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-center">
              ${this.isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            
            <!-- Configurar (Borde Gris/Slate) -->
            <button id="open-config" class="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-full active:scale-95 transition-all text-center">
              Configurar
            </button>
          </div>

        </div>

      </div>

      ${this.showConfig ? this.renderConfigModal() : ''}
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
        <div class="flex-1 overflow-y-auto p-4 flex flex-col items-center select-none text-slate-400 w-full pt-6">
          <div id="quick-pomodoro" class="flex flex-col items-center cursor-pointer hover:text-foco-blue-deep transition-all group" title="Abrir Pomodoro">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check-icon lucide-alarm-clock-check"><circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="m9 13 2 2 4-4"/></svg><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            <span class="text-[8px] font-bold mt-1.5 uppercase tracking-wider text-slate-400 group-hover:text-foco-blue-deep">Foco</span>
          </div>
        </div>
      `;
    }

    this.bindEvents();
  }

  /**
   * Modal de configuración (US 4.1.2)
   * Permite personalizar minutos de enfoque, minutos de descanso y cantidad de ciclos.
   */
  renderConfigModal() {
    return `
      <div id="config-overlay" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 border border-slate-200">
          
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-extrabold text-foco-blue-deep uppercase tracking-wide">Configurar Tiempos</h3>
            <button id="close-config" class="text-slate-400 hover:text-slate-600 transition-all" title="Cerrar">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Minutos de enfoque</label>
              <input id="input-focus" type="number" min="1" max="180" value="${this.focusMinutes}"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-foco-orange-accent" />
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Minutos de descanso</label>
              <input id="input-break" type="number" min="1" max="60" value="${this.breakMinutes}"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-foco-orange-accent" />
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Cantidad de ciclos</label>
              <input id="input-cycles" type="number" min="1" max="12" value="${this.totalCycles}"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-foco-orange-accent" />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button id="save-config" class="flex-grow py-2.5 px-5 bg-foco-orange-accent hover:bg-foco-orange-light text-white text-xs font-extrabold rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-center">
              Guardar
            </button>
            <button id="cancel-config" class="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-full active:scale-95 transition-all text-center">
              Cancelar
            </button>
          </div>

        </div>
      </div>
    `;
  }

  bindEvents() {
    const toggleBtn = this.querySelector('#toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCollapse());
    }

    const quickIcon = this.querySelector('#quick-pomodoro');
    if (quickIcon) {
      quickIcon.addEventListener('click', () => this.toggleCollapse());
    }
    const startBtn = this.querySelector('#start-pomodoro');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.toggleTimer());
    }

    const resetBtn = this.querySelector('#reset-pomodoro');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetTimer());
    }

    // --- Eventos del modal de configuración (US 4.1.2) ---
    const openConfigBtn = this.querySelector('#open-config');
    if (openConfigBtn) {
      openConfigBtn.addEventListener('click', () => this.openConfig());
    }

    const closeConfigBtn = this.querySelector('#close-config');
    if (closeConfigBtn) {
      closeConfigBtn.addEventListener('click', () => this.closeConfig());
    }

    const cancelConfigBtn = this.querySelector('#cancel-config');
    if (cancelConfigBtn) {
      cancelConfigBtn.addEventListener('click', () => this.closeConfig());
    }

    const saveConfigBtn = this.querySelector('#save-config');
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => this.saveConfig());
    }

    // Cerrar el modal al hacer clic fuera de la tarjeta
    const overlay = this.querySelector('#config-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeConfig();
      });
    }
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
    this.render();
  }

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        const display = this.querySelector('#pomodoro-display');
        if (display) {
          display.textContent = this.formatTime(this.timeLeft);
        }
      } else {
        this.pauseTimer();
        this.handleCycleComplete();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.focusMinutes * 60;
    this.render();
  }

  /**
   * Se ejecuta cuando un ciclo de enfoque llega a cero.
   * Avanza el contador de ciclos y reinicia el tiempo de enfoque.
   */
  handleCycleComplete() {
    alert('¡Tiempo de enfoque Pomodoro completado!');
    if (this.currentCycle < this.totalCycles) {
      this.currentCycle++;
    } else {
      this.currentCycle = 1;
    }
    this.timeLeft = this.focusMinutes * 60;
    this.render();
  }

  toggleCollapse() {
    this.classList.toggle('w-16');
    this.classList.toggle('w-80');
    this.render();
  }

  // --- Métodos del modal de configuración (US 4.1.2) ---

  openConfig() {
    this.showConfig = true;
    this.render();
  }

  closeConfig() {
    this.showConfig = false;
    this.render();
  }

  saveConfig() {
    const focusInput = this.querySelector('#input-focus');
    const breakInput = this.querySelector('#input-break');
    const cyclesInput = this.querySelector('#input-cycles');

    const newFocus = parseInt(focusInput?.value, 10);
    const newBreak = parseInt(breakInput?.value, 10);
    const newCycles = parseInt(cyclesInput?.value, 10);

    // Validación básica: se ignoran valores inválidos y se mantiene el anterior
    if (!isNaN(newFocus) && newFocus > 0) this.focusMinutes = newFocus;
    if (!isNaN(newBreak) && newBreak > 0) this.breakMinutes = newBreak;
    if (!isNaN(newCycles) && newCycles > 0) this.totalCycles = newCycles;

    // Si el temporizador no está corriendo, se aplica el nuevo tiempo de enfoque de inmediato
    if (!this.isRunning) {
      this.timeLeft = this.focusMinutes * 60;
      this.currentCycle = 1;
    }

    this.showConfig = false;
    this.render();
  }
}

// Registro en el navegador
customElements.define('foco-productivity-sidebar', FocoProductivitySidebar);
