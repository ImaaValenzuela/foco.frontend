class FocoProductivitySidebar extends HTMLElement {
  constructor() {
    super();
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('foco-pomodoro-config') || '{}'); } catch { /* Use defaults when stored data is invalid. */ }
    this.focusMinutes = saved.focusMinutes || 25;
    this.breakMinutes = saved.breakMinutes || 5;
    this.totalCycles = saved.totalCycles || 4;
    this.currentCycle = 1;
    this.phase = 'focus';
    this.timeLeft = this.focusMinutes * 60;
    this.isRunning = false;
    this.timerInterval = null;
    this.showConfig = false;
    this.sessionComplete = false;
  }

  connectedCallback() {
    this.className = 'bg-white border-l border-slate-200 shadow-xl transition-all duration-300 flex flex-col relative z-10 w-16';
    this.render();
  }

  render() {
    const expanded = this.classList.contains('w-80');
    this.innerHTML = expanded ? `
      <div class="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <button id="open-config" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500" title="Configurar tiempos" aria-label="Configurar tiempos">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button id="toggle-sidebar" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500" title="Contraer Productividad" aria-label="Contraer Productividad"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-right-close"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m8 9 3 3-3 3"/></svg></button>
      </div>
      <div class="flex-1 p-4 overflow-y-auto foco-scrollbar">
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center">
          <div class="w-full flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <span class="text-xs font-bold uppercase tracking-wide text-foco-blue-deep">Cronometro Pomodoro</span>
            <span class="text-[10px] font-semibold text-slate-400">${this.phase === 'focus' ? 'Enfoque' : 'Descanso'}</span>
          </div>
          <div id="pomodoro-display" class="text-5xl font-mono font-black text-slate-800 tracking-tight my-2">${this.formatTime(this.timeLeft)}</div>
          <div class="text-center space-y-0.5 mb-5">
            <p class="text-xs font-bold text-foco-blue-deep">${this.sessionComplete ? 'Sesion completada' : (this.isRunning ? 'Temporizador activo' : 'Temporizador pausado')}</p>
            <p class="text-[10px] font-semibold text-slate-400">Ciclo ${this.currentCycle} de ${this.totalCycles} - Descanso: ${this.breakMinutes} min</p>
          </div>
          <div class="flex w-full gap-3">
            <button id="start-pomodoro" class="flex-grow py-2.5 px-5 bg-foco-orange-accent text-white text-xs font-extrabold rounded-full">${this.isRunning ? 'Pausar' : 'Iniciar'}</button>
            <button id="reset-pomodoro" class="py-2.5 px-4 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded-full">Reiniciar</button>
          </div>
          <button id="open-config-card" class="mt-3 w-full py-2.5 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded-full">Configurar</button>
        </div>
      </div>
      ${this.showConfig ? this.renderConfigModal() : ''}
    ` : `
      <div class="h-14 flex items-center justify-center border-b border-slate-100 w-full"><button id="toggle-sidebar" class="p-2 rounded-xl bg-slate-50 text-slate-500" title="Expandir Productividad" aria-label="Expandir Productividad"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left-open"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg></button></div>
      <div id="quick-pomodoro" class="flex-1 p-4 flex flex-col items-center pt-6 text-slate-400 cursor-pointer" title="Abrir Pomodoro"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="12" y1="14" y2="12"/><path d="M4.93 4.93 6.34 6.34"/><path d="M19.07 4.93 17.66 6.34"/><circle cx="12" cy="14" r="8"/></svg><span class="text-[8px] font-bold mt-1.5 uppercase">Foco</span></div>
    `;
    this.bindEvents();
  }

  renderConfigModal() {
    return `<div id="config-overlay" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div class="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 border border-slate-200"><div class="flex justify-between mb-4"><h3 class="text-sm font-extrabold text-foco-blue-deep uppercase">Configurar tiempos</h3><button id="close-config" aria-label="Cerrar" class="text-slate-400 hover:text-slate-700"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div><div class="space-y-4"><label class="text-[11px] font-bold text-slate-500 block">Enfoque (1-180 min)<input id="input-focus" type="number" min="1" max="180" value="${this.focusMinutes}" class="w-full border rounded-xl px-3 py-2 text-sm" /></label><label class="text-[11px] font-bold text-slate-500 block">Descanso (1-60 min)<input id="input-break" type="number" min="1" max="60" value="${this.breakMinutes}" class="w-full border rounded-xl px-3 py-2 text-sm" /></label><label class="text-[11px] font-bold text-slate-500 block">Ciclos (1-12)<input id="input-cycles" type="number" min="1" max="12" value="${this.totalCycles}" class="w-full border rounded-xl px-3 py-2 text-sm" /></label></div><p id="config-error" class="text-xs text-red-600 mt-3 hidden"></p><div class="flex gap-3 mt-6"><button id="save-config" class="flex-grow py-2.5 bg-foco-orange-accent text-white text-xs font-bold rounded-full">Guardar</button><button id="cancel-config" class="py-2.5 bg-white text-slate-600 border rounded-full px-4 text-xs font-bold">Cancelar</button></div></div></div>`;
  }

  bindEvents() {
    this.querySelector('#toggle-sidebar')?.addEventListener('click', () => this.toggleCollapse());
    this.querySelector('#quick-pomodoro')?.addEventListener('click', () => this.toggleCollapse());
    this.querySelector('#start-pomodoro')?.addEventListener('click', () => this.toggleTimer());
    this.querySelector('#reset-pomodoro')?.addEventListener('click', () => this.resetTimer());
    this.querySelector('#open-config')?.addEventListener('click', () => this.openConfig());
    this.querySelector('#open-config-card')?.addEventListener('click', () => this.openConfig());
    this.querySelector('#close-config')?.addEventListener('click', () => this.closeConfig());
    this.querySelector('#cancel-config')?.addEventListener('click', () => this.closeConfig());
    this.querySelector('#save-config')?.addEventListener('click', () => this.saveConfig());
    this.querySelector('#config-overlay')?.addEventListener('click', (event) => { if (event.target.id === 'config-overlay') this.closeConfig(); });
  }

  toggleTimer() { this.isRunning ? this.pauseTimer() : this.startTimer(); this.render(); }
  startTimer() { if (this.isRunning || this.sessionComplete) return; this.isRunning = true; this.timerInterval = setInterval(() => { if (this.timeLeft > 0) { this.timeLeft--; this.querySelector('#pomodoro-display')?.replaceChildren(this.formatTime(this.timeLeft)); } else { this.advancePhase(); } }, 1000); }
  pauseTimer() { this.isRunning = false; clearInterval(this.timerInterval); this.timerInterval = null; }
  advancePhase() { this.pauseTimer(); if (this.phase === 'focus') { if (this.currentCycle >= this.totalCycles) { this.sessionComplete = true; this.render(); return; } this.phase = 'break'; this.timeLeft = this.breakMinutes * 60; } else { this.phase = 'focus'; this.currentCycle++; this.timeLeft = this.focusMinutes * 60; } this.render(); }
  resetTimer() { this.pauseTimer(); this.currentCycle = 1; this.phase = 'focus'; this.sessionComplete = false; this.timeLeft = this.focusMinutes * 60; this.render(); }
  formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }
  toggleCollapse() { this.classList.toggle('w-16'); this.classList.toggle('w-80'); this.render(); }
  openConfig() { if (this.isRunning) return; this.showConfig = true; this.render(); }
  closeConfig() { this.showConfig = false; this.render(); }

  saveConfig() {
    const values = ['focus', 'break', 'cycles'].map((name) => Number(this.querySelector(`#input-${name}`)?.value));
    if (!Number.isInteger(values[0]) || values[0] < 1 || values[0] > 180 || !Number.isInteger(values[1]) || values[1] < 1 || values[1] > 60 || !Number.isInteger(values[2]) || values[2] < 1 || values[2] > 12) {
      const error = this.querySelector('#config-error'); if (error) { error.textContent = 'Introduce valores dentro de los rangos indicados.'; error.classList.remove('hidden'); } return;
    }
    [this.focusMinutes, this.breakMinutes, this.totalCycles] = values;
    localStorage.setItem('foco-pomodoro-config', JSON.stringify({ focusMinutes: this.focusMinutes, breakMinutes: this.breakMinutes, totalCycles: this.totalCycles }));
    this.showConfig = false;
    this.resetTimer();
  }
}

customElements.define('foco-productivity-sidebar', FocoProductivitySidebar);
