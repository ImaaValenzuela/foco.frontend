/**
 * Componente: CalendarWidget (F.O.C.O. Google Calendar Integration)
 * Renderiza el widget de agenda diaria y zona de caída (Drop Zone) para arrastrar tarjetas desde el lienzo.
 */

export function renderCalendarWidget(state = {}) {
  const {
    isConnected = false,
    isLoading = false,
    events = [],
    error = null,
    isModalOpen = false,
    draggedCardData = null
  } = state;

  // 1. Estado de Conexión (Badge y Acciones)
  const connectionBadge = isConnected
    ? `
      <div class="flex items-center space-x-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-medium">Sincronizado</span>
      </div>
    `
    : `
      <div class="flex items-center space-x-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span class="font-medium">Sin conectar</span>
      </div>
    `;

  // 2. Contenido Principal según el estado
  let contentHtml = '';

  if (!isConnected) {
    contentHtml = `
      <div class="flex flex-col items-center justify-center p-4 text-center space-y-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
        <p class="text-xs text-slate-500 font-normal leading-relaxed">
          Sincronizá tus reuniones y arrastrá tarjetas del lienzo para agendarlas en Google Calendar.
        </p>
        <button 
          id="btn-connect-calendar" 
          class="flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all w-full focus:outline-none"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Conectar Google Calendar</span>
        </button>
      </div>
    `;
  } else if (isLoading && events.length === 0) {
    contentHtml = `
      <div class="flex items-center justify-center p-6 text-slate-400 space-x-2 text-xs">
        <svg class="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span>Sincronizando agenda...</span>
      </div>
    `;
  } else if (events.length === 0) {
    contentHtml = `
      <div class="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p class="text-xs text-slate-500 font-medium">No tenés eventos agendados para hoy</p>
        <p class="text-[11px] text-slate-400">Arrastrá una tarea acá para programarla</p>
      </div>
    `;
  } else {
    // Listado timeline de eventos del día
    const eventsList = events.map(event => {
      let timeText = 'Todo el día';
      if (!event.allDay && event.start) {
        const d = new Date(event.start);
        timeText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const linkAttr = event.htmlLink ? `href="${event.htmlLink}" target="_blank" rel="noopener noreferrer"` : '';

      return `
        <a ${linkAttr} class="flex items-start space-x-2.5 p-2 rounded-xl bg-white hover:bg-orange-50/50 border border-slate-200/70 hover:border-orange-200 transition-all group block shadow-2xs">
          <div class="flex flex-col items-center justify-center min-w-[42px] px-1 py-0.5 rounded bg-slate-100 group-hover:bg-orange-100 text-slate-600 group-hover:text-orange-700 transition-colors">
            <span class="text-[10px] font-bold">${timeText}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-semibold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
              ${event.title}
            </h4>
            ${event.description ? `<p class="text-[10px] text-slate-400 truncate mt-0.5">${event.description}</p>` : ''}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 group-hover:text-orange-500 transition-colors mt-0.5 shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
        </a>
      `;
    }).join('');

    contentHtml = `<div class="space-y-1.5 max-h-48 overflow-y-auto foco-scrollbar pr-0.5">${eventsList}</div>`;
  }

  // 3. Modal liviano para confirmar agendamiento tras Drag & Drop
  const modalHtml = isModalOpen && draggedCardData ? `
    <div id="calendar-schedule-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2 text-foco-orange-accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>
            <h3 class="font-bold text-sm text-slate-800">Agendar en Google Calendar</h3>
          </div>
          <button id="modal-close-btn" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-500 font-medium mb-1">Título del evento</label>
            <input id="modal-event-title" type="text" value="${draggedCardData.title || draggedCardData.text || ''}" class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-foco-orange-accent font-medium text-slate-800" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-500 font-medium mb-1">Fecha</label>
              <input id="modal-event-date" type="date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-foco-orange-accent text-slate-700" />
            </div>
            <div>
              <label class="block text-slate-500 font-medium mb-1">Hora inicio</label>
              <input id="modal-event-time" type="time" value="${(() => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return d.toTimeString().slice(0, 5); })()}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-foco-orange-accent text-slate-700" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button id="modal-cancel-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
          <button id="modal-confirm-schedule-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-foco-orange-accent hover:bg-orange-600 shadow-sm transition-all flex items-center space-x-1">
            <span>Agendar Evento</span>
          </button>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <div 
      id="foco-calendar-widget" 
      class="foco-calendar-dropzone w-full bg-[--color-habitos-bg,white] border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300 space-y-3 hover:border-orange-300"
    >
      <div class="w-full flex justify-between items-center border-b border-[--color-header-borde,theme(colors.slate.100)] pb-2">
        <div class="flex items-center space-x-2 text-[--color-pomodoro-titulo,#22298A]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
          <span class="text-xs font-bold uppercase tracking-wide">Agenda Google Calendar</span>
        </div>
        <div class="flex items-center space-x-1.5">
          ${connectionBadge}
          ${isConnected ? `
            <button id="btn-refresh-calendar" class="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors" title="Actualizar agenda">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${isLoading ? 'animate-spin' : ''}"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            </button>
          ` : ''}
        </div>
      </div>

      ${error ? `<div class="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">${error}</div>` : ''}

      ${contentHtml}

      <div class="drop-zone-hint hidden text-center py-2 px-3 bg-orange-100/70 border-2 border-dashed border-orange-400 rounded-xl text-orange-800 text-xs font-semibold animate-pulse">
        ¡Soltá la tarjeta acá para agendar!
      </div>
    </div>
    ${modalHtml}
  `;
}

export default renderCalendarWidget;
