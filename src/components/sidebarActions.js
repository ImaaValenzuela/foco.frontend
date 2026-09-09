/**
 * Componente: SidebarActions
 * Barra de herramientas lateral izquierda con botones arrastrables simulados.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */
import Sortable from "sortablejs";

class FocoSidebarActions extends HTMLElement {
  connectedCallback() {
    this.className = "w-20 h-full bg-foco-gray-sidebar flex flex-col items-center py-6 border-r border-slate-200 select-none";
    this.innerHTML = `
      <div class="flex flex-col items-center gap-5 w-full">
        
        <!-- Botón: Nota -->
        <div class="foco-crear-nota flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Nota">
          <div class="w-12 h-12 rounded-2xl bg-foco-blue-accent text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div> 
          <span class="text-[10px] font-semibold text-foco-blue-deep mt-1 group-hover:text-indigo-700 transition-colors">Nota</span>
        </div>

        <!-- Botón: Tarea -->
        <div class="foco-crear-tarea flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Tarea">
          <div class="w-12 h-12 rounded-2xl bg-foco-blue-mid text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Tarea (Checklist) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-icon lucide-clipboard"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span class="text-[10px] font-semibold text-foco-blue-deep mt-1 group-hover:text-indigo-700 transition-colors">Tarea</span>
        </div>

        <!-- Botón: Flecha (Conector Visual) -->
        <div class="flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para conectar ideas con una Flecha">
          <div class="w-12 h-12 rounded-2xl bg-foco-orange-light text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Flecha (Derecha) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-right-icon lucide-move-right"><path d="M18 8L22 12L18 16"/><path d="M2 12H22"/></svg>              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <span class="text-[10px] font-semibold text-foco-orange-accent mt-1 group-hover:text-orange-700 transition-colors">Flecha</span>
        </div>

        <!-- Botón: Lista -->
        <div class="flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Lista">
          <div class="w-12 h-12 rounded-2xl bg-foco-blue-light text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Lista (Bullet Points) -->
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-icon lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <span class="text-[10px] font-semibold text-foco-blue-deep mt-1 group-hover:text-indigo-700 transition-colors">Lista</span>
        </div>

      </div>
      <div class="mt-auto flex flex-col-reverse gap-3">
        <button type="button" data-action="settings" class="foco-sidebar-action" aria-label="Abrir ajustes" title="Ajustes">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6.5v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1H15v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>
        </button>
        <button type="button" data-action="help" class="foco-sidebar-action" aria-label="Abrir ayuda" title="Ayuda">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.4 1.6c-.9 1.1-2 1.3-2 2.9"/><path d="M12 17h.01"/></svg>
        </button>
      </div>
    `;
    this.activarCrearNota();
    this.querySelector('[data-action="settings"]').addEventListener('click', () => this.abrirModal('settings'));
    this.querySelector('[data-action="help"]').addEventListener('click', () => this.abrirModal('help'));
  }

  abrirModal(tipo) {
    const settings = tipo === 'settings';
    const bloques = ['bloque-objetivos-activos', 'bloque-personal', 'bloque-inspiracion', 'bloque-archivo-vida'];
    const nombres = ['Objetivos activos', 'Bloque personal', 'Inspiración y creatividad', 'Archivo de vida'];
    const estado = JSON.parse(localStorage.getItem('foco-board-visibility') || '{}');
    const contenido = settings ? `<p class="text-sm text-slate-500 mb-4">Elegí qué partes querés ver en tu espacio de trabajo.</p><div class="space-y-3">${bloques.map((id, i) => `<label class="flex items-center justify-between text-sm font-medium text-slate-700"><span>${nombres[i]}</span><input type="checkbox" data-block="${id}" ${estado[id] !== false ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-indigo-600"></label>`).join('')}<label class="flex items-center justify-between text-sm font-medium text-slate-700"><span>Sidebar de productividad</span><input type="checkbox" data-sidebar="productivity" ${localStorage.getItem('foco-productivity-sidebar') !== 'false' ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-indigo-600"></label></div>` : `<div class="space-y-4 text-sm text-slate-600"><p><strong class="text-slate-800">1. Creá:</strong> arrastrá Nota, Tarea o Lista desde esta barra.</p><p><strong class="text-slate-800">2. Organizá:</strong> mové tus tarjetas entre los bloques.</p><p><strong class="text-slate-800">3. Personalizá:</strong> ocultá bloques o la sidebar derecha desde Ajustes.</p></div>`;
    const modal = document.createElement('div');
    modal.className = 'foco-modal fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `<div class="absolute inset-0 bg-slate-900/30" data-close></div><section role="dialog" aria-modal="true" class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between mb-5"><h2 class="text-lg font-bold text-foco-blue-deep">${settings ? 'Ajustes del tablero' : 'Cómo usar F.O.C.O.'}</h2><button data-close class="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Cerrar">&times;</button></div>${contenido}<div class="mt-6 flex justify-end"><button data-close class="rounded-lg bg-foco-blue-deep px-4 py-2 text-sm font-semibold text-white">Listo</button></div></section>`;
    modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => modal.remove()));
    modal.querySelectorAll('[data-block]').forEach((input) => input.addEventListener('change', (event) => {
      const next = JSON.parse(localStorage.getItem('foco-board-visibility') || '{}');
      next[event.target.dataset.block] = event.target.checked;
      localStorage.setItem('foco-board-visibility', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('foco:visibility-changed', { detail: next }));
    }));
    modal.querySelector('[data-sidebar]')?.addEventListener('change', (event) => {
      localStorage.setItem('foco-productivity-sidebar', String(event.target.checked));
      window.dispatchEvent(new CustomEvent('foco:productivity-visibility-changed', { detail: event.target.checked }));
    });
    document.body.appendChild(modal);
  }

  // Activa SortableJS sobre el botón "Nota", configurado para que al arrastrarlo
  // se cree una copia en el destino, sin mover ni eliminar el botón original.
  activarCrearNota() {
      var contenedorBotones = this.querySelector(".flex.flex-col.items-center.gap-5");
      Sortable.create(contenedorBotones, {
        group: {
          name: "foco-tarjetas",
          pull: "clone",
          put: false
        },
        sort: false,
        draggable: ".foco-crear-nota, .foco-crear-tarea" // Se añade la nueva clase
      });
    }
  }

// Registro en el navegador
customElements.define('foco-sidebar-actions', FocoSidebarActions);
