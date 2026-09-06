export function renderPomodoro({ showConfig, configModal, display, status, cycle, breakMinutes, isRunning }) {
  return `
    <div id="pomodoro-container" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center relative overflow-hidden">
      <div id="pomodoro-header" class="w-full flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
        <div class="flex items-center space-x-2 text-foco-blue-deep">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alarm-clock-check-icon lucide-alarm-clock-check"><circle cx="12" cy="13" r="8"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/><path d="m9 13 2 2 4-4"/></svg>
            <span class="text-xs font-bold uppercase tracking-wide">Cronómetro Pomodoro</span>
          </div>
          <div class="flex items-center space-x-2">
            <button id="open-config" class="text-slate-400 hover:text-slate-600 text-xs" type="button">Configurar</button>
            <button id="expand-pomodoro" class="text-slate-400 hover:text-slate-600 text-xs" type="button" title="Pantalla completa">⛶</button>
            </div>
        </div>
      ${showConfig ? configModal : ''}
      <div id="pomodoro-display" class="text-5xl font-mono font-black text-slate-800 tracking-tight my-2">${display}</div>
      <div class="text-center space-y-0.5 mb-5">git 
        <p class="text-xs font-bold text-foco-blue-deep">${status}</p>
        <p class="text-[10px] font-semibold text-slate-400">Ciclo ${cycle} - Descanso: ${breakMinutes} Min</p>
      </div>
      <div id="pomodoro-buttons" class="flex w-full gap-3">
        <button id="start-pomodoro" class="flex-grow py-2.5 px-5 bg-foco-orange-accent hover:bg-foco-orange-light text-white text-xs font-extrabold rounded-full shadow-sm hover:shadow active:scale-95 transition-all text-center">${isRunning ? 'Pausar' : 'Iniciar'}</button>
        <button id="reset-pomodoro" class="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-full active:scale-95 transition-all text-center">Reiniciar</button>
      </div>
    </div>`;
}
