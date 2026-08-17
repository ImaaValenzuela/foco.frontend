/**
 * Componente: ProductivitySidebar
 * Barra lateral derecha de productividad. Contiene únicamente el Cronómetro Pomodoro.
 * Inicia replegada (w-16) mostrando solo un ícono rápido y se expande a (w-80) al hacer clic.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */
class FocoProductivitySidebar extends HTMLElement {
  constructor() {
    super();
    this.timeLeft = 25 * 60; // 25 minutos en segundos
    this.isRunning = false;
    this.timerInterval = null;
  }

  connectedCallback() {
    // Inicializar el estado replegado por defecto (w-16)
    this.className = "bg-white border-l border-slate-200 shadow-xl transition-all duration-300 flex flex-col relative z-10 w-16 flex-shrink-0";
    this.render();
  }

  disconnectedCallback() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  render() {
    const isExpanded = this.classList.contains('w-80');

    if (isExpanded) {
      this.innerHTML = `
       <!-- Encabezado de la Sidebar con botón de contraer -->
      <div class="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <button id="toggle-sidebar" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-foco-blue-deep text-slate-500 transition-all border border-slate-200/50 shadow-sm" title="Contraer Productividad">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-right-close">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M15 3v18"/>
            <path d="m8 9 3 3-3 3"/>
          </svg>
        </button>
      </div>

      <!-- Cuerpo de la Sidebar (Contenedor de widgets) -->
      <div class="flex-1 p-4 space-y-4 overflow-y-auto foco-scrollbar">
        
        <!-- TARJETA DEL CRONÓMETRO POMODORO -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center relative overflow-hidden">
          
          <!-- Header del Widget -->
          <div class="w-full flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <div class="flex items-center space-x-2 text-foco-blue-deep">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check">
                <circle cx="12" cy="13" r="8"/>
                <path d="M5 3 2 6"/>
                <path d="m22 6-3-3"/>
                <path d="M6.38 18.7 4 21"/>
                <path d="M17.64 18.67 20 21"/>
                <path d="m9 13 2 2 4-4"/>
              </svg>
              <span class="text-xs font-bold uppercase tracking-wide">Cronómetro Pomodoro</span>
            </div>
          </div>

          <!-- Tiempo Principal (Estilo Monospace de alta visibilidad) -->
          <div id="pomodoro-display" class="text-5xl font-mono font-black text-slate-800 tracking-tight my-2 ${this.isRunning ? 'animate-pulse-soft text-foco-orange-accent' : ''}">
            ${this.formatTime(this.timeLeft)}
          </div>

          <!-- Metadatos de Enfoque y Tiempos de descanso -->
          <div class="text-center space-y-0.5 mb-5">
            <p class="text-xs font-bold text-foco-blue-deep">Modo: ${this.isRunning ? '🔥 Enfoque Activo' : 'Modo Enfoque'}</p>
            <p class="text-[10px] font-semibold text-slate-400">Ciclo 1 de 4 - Descanso: 5 Min</p>
          </div>

          <!-- Botones de Interacción del Temporizador -->
          <div class="flex w-full gap-3">
            <!-- Iniciar / Pausar -->
            <button id="start-pomodoro" class="flex-grow py-2.5 px-5 ${this.isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-foco-orange-accent hover:bg-foco-orange-light'} text-white text-xs font-extrabold rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-center">
              ${this.isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            
            <!-- Reiniciar -->
            <button id="reset-pomodoro" class="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-full active:scale-95 transition-all text-center">
              Reiniciar
            </button>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left-open">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M9 3v18"/>
              <path d="m14 9 3 3-3 3"/>
            </svg>
          </button>
        </div>

        <!-- CUERPO REPLEGADO -->
        <div class="flex-1 overflow-y-auto p-4 flex flex-col items-center select-none text-slate-400 w-full pt-6">
          <div id="quick-pomodoro" class="flex flex-col items-center cursor-pointer hover:text-foco-blue-deep transition-all group" title="Abrir Pomodoro">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check">
              <circle cx="12" cy="13" r="8"/>
              <path d="M5 3 2 6"/>
              <path d="m22 6-3-3"/>
              <path d="M6.38 18.7 4 21"/>
              <path d="M17.64 18.67 20 21"/>
              <path d="m9 13 2 2 4-4"/>
            </svg>
            <span class="text-[8px] font-bold mt-1.5 uppercase tracking-wider text-slate-400 group-hover:text-foco-blue-deep">Foco</span>
          </div>
        </div>
      `;
    }

    this.bindEvents();
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
        alert('¡Tiempo de enfoque Pomodoro completado!');
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

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = 25 * 60;
    this.render();
  }

  toggleCollapse() {
    this.classList.toggle('w-16');
    this.classList.toggle('w-80');
    this.render();
  }
}

// Registro en el navegador
customElements.define('foco-productivity-sidebar', FocoProductivitySidebar);

