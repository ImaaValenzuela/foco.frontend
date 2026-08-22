export function renderHabitTracker({ daysHtml, habitsHtml, addHabitFormHtml, statusBadge }) {
  return `
    <div class="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300 space-y-3">
      <div class="w-full flex justify-between items-center border-b border-slate-100 pb-2">
        <div class="flex items-center space-x-2 text-foco-blue-deep">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check-icon lucide-calendar-check"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="m9 15 2 2 4-4"/></svg>
          <span class="text-xs font-bold uppercase tracking-wide">Hábitos diarios</span>
        </div>
        ${statusBadge}
      </div>
      <div class="flex justify-between items-center bg-slate-50 border border-slate-200/80 rounded-xl p-1 w-full overflow-hidden gap-0.5">${daysHtml}</div>
      <div class="space-y-1.5">${habitsHtml}</div>
      ${addHabitFormHtml}
    </div>`;
}
