/**
 * Componente: LienzoCanvas
 * Renderiza el espacio de trabajo principal de F.O.C.O.
 * Divide la pantalla en 4 bloques estáticos e independientes bajo el método P.A.R.A.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */

import Sortable from "sortablejs";

class FocoLienzoCanvas extends HTMLElement {
  connectedCallback() {
    this.className = "flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-foco-blue-gray foco-scrollbar";
    this.innerHTML = `
    <!-- Estructura de Grilla de 2 Columnas para Desktop (lg:grid-cols-2) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- BLOQUE 1: Objetivos Activos (Proyectos) -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Objetivos Activos</h2>
            </div>
            <span class="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Proyectos</span>
          </div>
          
          <!-- Contenido del Bloque -->
          <div id="notes-list" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar">
            
            <div class="foco-tarjeta p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-grab active:cursor-grabbing transition-all">
              <div class="flex items-start space-x-2.5 text-xs">
                <input type="checkbox" checked class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer" />
                <span class="line-through text-slate-400">Maquetar Frontend</span>
              </div>
            </div>
            
            <div class="foco-tarjeta p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-grab active:cursor-grabbing transition-all">
              <div class="flex items-start space-x-2.5 text-xs">
                <input type="checkbox" checked class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer" />
                <span class="line-through text-slate-400">Conectar API REST</span>
              </div>
            </div>

            <div class="foco-tarjeta p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-grab active:cursor-grabbing transition-all">
              <div class="flex items-start space-x-2.5 text-xs">
                <input type="checkbox" class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer" />
                <span class="text-slate-700 font-medium">Configurar variables de entorno</span>
              </div>
            </div>

            <div class="foco-tarjeta p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-grab active:cursor-grabbing transition-all">
              <div class="flex items-start space-x-2.5 text-xs">
                <input type="checkbox" class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer" />
                <span class="text-slate-700 font-medium">Presentar avance del MVP al equipo</span>
              </div>
            </div>
            
          </div>
        </section>

        <!-- BLOQUE 2: Bloque Personal (Áreas) -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-id-card"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Bloque Personal</h2>
            </div>
            <span class="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Áreas</span>
          </div>

          <!-- Contenido del Bloque -->
          <div id="bloque-personal" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar">
            
            <div class="foco-tarjeta p-3 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100/30 cursor-grab active:cursor-grabbing transition-all">
              <h3 class="text-xs font-bold text-slate-800">Rutina Equilibrada</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">Controlar el presupuesto de tiempo diario.</p>
              <span class="inline-block mt-1.5 text-[9px] font-bold text-foco-orange-accent bg-orange-50 px-1.5 py-0.5 rounded">
                8h Trabajo, 2h Estudio, 2h Ocio
              </span>
            </div>

            <div class="foco-tarjeta p-3 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100/30 cursor-grab active:cursor-grabbing transition-all">
              <h3 class="text-xs font-bold text-slate-800">Gimnasio</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">Ir 3 veces por semana para despejar la mente.</p>
            </div>

            <div class="foco-tarjeta p-3 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100/30 cursor-grab active:cursor-grabbing transition-all">
              <h3 class="text-xs font-bold text-slate-800">Meditación</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">10 minutos diarios antes de iniciar la jornada laboral.</p>
            </div>

            <div class="foco-tarjeta p-3 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100/30 cursor-grab active:cursor-grabbing transition-all">
              <h3 class="text-xs font-bold text-slate-800">Organizar apuntes</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">Mover las notas rápidas recopiladas al archivo final.</p>
            </div>

          </div>
        </section>

        <!-- BLOQUE 3: Inspiración y Creatividad (Recursos) -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-image"><path d="m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><circle cx="10" cy="8" r="2"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Inspiración y Creatividad</h2>
            </div>
            <span class="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Recursos</span>
          </div>

          <!-- Contenido del Bloque -->
          <div id="bloque-inspiracion" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar">

            <div class="foco-tarjeta p-3 bg-yellow-50/60 hover:bg-yellow-50 rounded-xl border border-yellow-100/50 relative cursor-grab active:cursor-grabbing transition-all">
              <div class="absolute top-2 right-2 text-xs text-yellow-500">📌</div>
              <p class="text-xs text-slate-600 font-serif leading-relaxed pr-5">
                "Nota de lectura: Método P.A.R.A. de Tiago Forte para evitar el caos cognitivo y estructurar carpetas."
              </p>
            </div>

          </div>
        </section>

        <!-- BLOQUE 4: Archivo de Vida y Bitácoras (Archivo) -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Archivo de Vida</h2>
            </div>
            <span class="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Archivo</span>
          </div>

          <!-- Contenido del Bloque -->
          <div id="bloque-archivo-vida" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar">
            <div class="foco-tarjeta p-3 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-emerald-100/30 cursor-grab active:cursor-grabbing transition-all">
              <h3 class="text-xs font-bold text-slate-800">Sprint Q1 Completado</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">Lanzamiento oficial del primer prototipo F.O.C.O.</p>
            </div>
          </div>
        </section>
        
      </div>

    `;
    this.activarDragAndDrop();
  }

  activarDragAndDrop() {
    const listaDeZonas = this.querySelectorAll(".foco-drop-zone");

    listaDeZonas.forEach((zonaActual) => {
      Sortable.create(zonaActual, {
        group: "foco-tarjetas",
        ghostClass: "opacity-40",
        animation: 150,
        draggable: ".foco-tarjeta"
      });
    });
  }
}

// Registro en el navegador
customElements.define('foco-lienzo-canvas', FocoLienzoCanvas);
