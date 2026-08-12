/**
 * Componente: ProductivitySidebar
 * Barra lateral derecha de productividad. Contiene únicamente el Cronómetro Pomodoro.
 * Inicia replegada (w-16) mostrando solo un ícono rápido y se expande a (w-80) al hacer clic.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */
class FocoProductivitySidebar extends HTMLElement {
  connectedCallback() {
    // Inicializar el estado replegado por defecto (w-16)
    this.className = "bg-white border-l border-slate-200 shadow-xl transition-all duration-300 flex flex-col relative z-10 w-16";
    this.render();
  }

  render() {
    const isExpanded = this.classList.contains('w-80');

    if (isExpanded) {
      this.innerHTML = `

       <!-- Encabezado de la Sidebar con botón de contraer -->
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

  bindEvents() {
    const toggleBtn = this.querySelector('#toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCollapse());
    }

    const quickIcon = this.querySelector('#quick-pomodoro');
    if (quickIcon) {
      quickIcon.addEventListener('click', () => this.toggleCollapse());
    }
  }

  toggleCollapse() {
    this.classList.toggle('w-16');
    this.classList.toggle('w-80');
    this.render();
  }
}

// Registro en el navegador
customElements.define('foco-productivity-sidebar', FocoProductivitySidebar);
