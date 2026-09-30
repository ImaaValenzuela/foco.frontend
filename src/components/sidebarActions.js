/**
 * Componente: SidebarActions
 * Barra de herramientas lateral izquierda con botones arrastrables simulados.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */
import Sortable from "sortablejs";
import { obtenerPaletas, obtenerPaletaActual, guardarPaleta } from "../managers/paletteManager.js";

class FocoSidebarActions extends HTMLElement {
  connectedCallback() {
    this.className = "w-20 h-full bg-[--color-sidebar-bg,#F1F3F9] flex flex-col items-center py-6 border-r border-[--color-sidebar-borde,theme(colors.slate.200)] select-none";
    this.innerHTML = `
      <div class="flex flex-col items-center gap-5 w-full">
        
        <!-- Botón: Nota -->
        <div class="foco-crear-nota flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Nota">
          <div class="w-12 h-12 rounded-2xl bg-[--color-sidebar-boton,#7C83DE] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div> 
          <span class="text-[10px] font-semibold text-[--color-sidebar-texto,#22298A] mt-1 group-hover:text-indigo-700 transition-colors">Nota</span>
        </div>

        <!-- Botón: Tarea -->
        <div class="foco-crear-tarea flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Tarea">
          <div class="w-12 h-12 rounded-2xl bg-[--color-sidebar-boton,#5966B2] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Tarea (Checklist) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
          </div>
          <span class="text-[10px] font-semibold text-[--color-sidebar-texto,#22298A] mt-1 group-hover:text-indigo-700 transition-colors">Tarea</span>
        </div>

        <!-- Botón: Flecha (Conector Visual) -->
        <div id="btn-herramienta-flecha" class="foco-herramienta-flecha flex flex-col items-center group cursor-pointer select-none" title="Hacé clic para conectar dos tarjetas con una Flecha">
          <div id="btn-flecha-circulo" class="w-12 h-12 rounded-2xl bg-[--color-sidebar-boton,#FDA35D] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Flecha (Derecha) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-right"><path d="M18 8L22 12L18 16"/><path d="M2 12H22"/></svg>
          </div>
          <span class="text-[10px] font-semibold text-[--color-sidebar-texto,#22298A] mt-1 group-hover:text-orange-700 transition-colors">Flecha</span>
        </div>

        <!-- Botón: Lista -->
        <div class="foco-crear-lista flex flex-col items-center group cursor-grab active:cursor-grabbing select-none" title="Arrastrá para crear una Lista">
          <div class="w-12 h-12 rounded-2xl bg-[--color-sidebar-boton,#C6C9F1] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Lista (Bullet Points) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>
          </div>
          <span class="text-[10px] font-semibold text-[--color-sidebar-texto,#22298A] mt-1 group-hover:text-indigo-700 transition-colors">Lista</span>
        </div>
        
      </div>
      <div class="mt-auto flex flex-col-reverse gap-3">
        <button type="button" data-action="settings" class="foco-sidebar-action" aria-label="Abrir ajustes" title="Ajustes">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button type="button" data-action="help" class="foco-sidebar-action" aria-label="Abrir ayuda" title="Ayuda">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.4 1.6c-.9 1.1-2 1.3-2 2.9"/><path d="M12 17h.01"/></svg>
        </button>
      </div>
    `;
    this.activarCrearNota();
    this.activarBotonFlecha();
    this.querySelector('[data-action="settings"]').addEventListener('click', () => this.abrirModal('settings'));
    this.querySelector('[data-action="help"]').addEventListener('click', () => this.abrirModal('help'));
  } 

  abrirModal(tipo) {
    const settings = tipo === 'settings';
    const bloques = ['bloque-objetivos-activos', 'bloque-personal', 'bloque-inspiracion', 'bloque-archivo-vida'];
    const nombres = ['Objetivos activos', 'Bloque personal', 'Inspiración y creatividad', 'Archivo de vida'];
    const estado = JSON.parse(localStorage.getItem('foco-board-visibility') || '{}');
    
    const paletaActual = obtenerPaletaActual();
    const coloresPaletas = obtenerPaletas();
    const paletas = [
      { id: 'preestablecida', nombre: 'Clásico', colorA: coloresPaletas.preestablecida.colorA, colorB: coloresPaletas.preestablecida.colorB, borde: 'border-blue-600' },
      { id: 'glaciar', nombre: 'Glaciar', colorA: coloresPaletas.glaciar.colorA, colorB: coloresPaletas.glaciar.colorB, borde: 'border-sky-500' },
      { id: 'bosque', nombre: 'Bosque', colorA: coloresPaletas.bosque.colorA, colorB: coloresPaletas.bosque.colorB, borde: 'border-green-700' },
      { id: 'coral', nombre: 'Coral', colorA: coloresPaletas.coral.colorA, colorB: coloresPaletas.coral.colorB, borde: 'border-red-200'},
      { id: 'lavanda', nombre: 'Lavanda', colorA: coloresPaletas.lavanda.colorA, colorB: coloresPaletas.lavanda.colorB, borde: 'border-purple-400' },
      { id: 'modoOscuro', nombre: 'Clásico (Oscuro)', colorA: '#21373f', colorB: coloresPaletas.modoOscuro.colorB, borde: 'border-orange-700'},
      { id: 'cosmos', nombre: 'Cosmos', colorA: '#21373f', colorB: coloresPaletas.cosmos.colorB, borde: 'border-purple-600'},
    ];

    const contenido = settings ? `<p class="text-sm text-slate-500 mb-4">Elegí qué partes querés ver en tu espacio de trabajo.</p><div class="space-y-3">${bloques.map((id, i) => `<label class="flex items-center justify-between text-sm font-medium text-slate-700"><span>${nombres[i]}</span><input type="checkbox" data-block="${id}" ${estado[id] !== false ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-indigo-600"></label>`).join('')}<label class="flex items-center justify-between text-sm font-medium text-slate-700"><span>Sidebar de productividad</span><input type="checkbox" data-sidebar="productivity" ${localStorage.getItem('foco-productivity-sidebar') !== 'false' ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-indigo-600"></label></div><div class="mt-5 pt-4 border-t border-slate-100"><p class="text-sm text-slate-500 mb-3">Elegí una paleta de colores para el tablero.</p><div class="grid grid-cols-4 gap-3">${paletas.map((p) => `<button type="button" data-palette="${p.id}" class="h-24 flex flex-col items-center justify-center rounded-xl border-2 ${paletaActual === p.id ? p.borde : 'border-slate-200'} p-2 text-center"><div class="w-6 h-6 rounded-full mb-1" style="background: linear-gradient(90deg, ${p.colorA} 50%, ${p.colorB} 50%);"></div><span class="text-xs font-medium text-slate-700 leading-tight">${p.nombre}</span></button>`).join('')}</div></div>` : `<div class="space-y-4 text-sm text-slate-600"><p><strong class="text-slate-800">1. Creá:</strong> arrastrá Nota, Tarea o Lista desde esta barra.</p><p><strong class="text-slate-800">2. Organizá:</strong> mové tus tarjetas entre los bloques.</p><p><strong class="text-slate-800">3. Personalizá:</strong> ocultá bloques o la sidebar derecha desde Ajustes.</p></div>`;
    const modal = document.createElement('div');
    modal.className = 'foco-modal fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `<div class="absolute inset-0 bg-slate-900/30" data-close></div><section role="dialog" aria-modal="true" class="relative w-full max-w-md rounded-2xl bg-[--color-bloque-bg,white] p-6 shadow-2xl"><div class="flex items-center justify-between mb-5"><h2 class="text-lg font-bold text-[--color-pomodoro-titulo,#22298A]">${settings ? 'Ajustes del tablero' : 'Cómo usar F.O.C.O.'}</h2><button data-close class="text-2xl leading-none text-[--color-pomodoro-titulo,theme(colors.slate.400)] hover:text-slate-700" aria-label="Cerrar">&times;</button></div><div class="[&_*]:!text-[--color-pomodoro-titulo,theme(colors.slate.500)]">${contenido}</div><div class="mt-6 flex justify-end"><button data-close class="rounded-lg bg-[--color-btn-iniciar,#22298A] px-4 py-2 text-sm font-semibold text-white">Listo</button></div></section>`;
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
    modal.querySelectorAll('[data-palette]').forEach((button) => button.addEventListener('click', (event) => {
      const selectedPalette = event.currentTarget.dataset.palette;
      guardarPaleta(selectedPalette);
      paletas.forEach((p) => {
        const btn = modal.querySelector(`[data-palette="${p.id}"]`);
        btn.classList.remove(p.borde, 'border-slate-200');
        btn.classList.add(p.id === selectedPalette ? p.borde : 'border-slate-200');
      });
    }));
    document.body.appendChild(modal);
  }

  // Activa SortableJS sobre los botones arrastrables (Nota, Tarea, Lista),
  // configurado para que al arrastrarlos se cree una copia en el destino.
  activarCrearNota() {
    var contenedorBotones = this.querySelector(".flex.flex-col.items-center.gap-5");
    Sortable.create(contenedorBotones, {
      group: {
        name: "foco-tarjetas",
        pull: "clone",
        put: false
      },
      sort: false,
      draggable: ".foco-crear-nota, .foco-crear-tarea, .foco-crear-lista"
    });
  }

  // Activa el toggle del modo de conexión con flecha
  activarBotonFlecha() {
    const btnFlecha = this.querySelector("#btn-herramienta-flecha");
    const circuloFlecha = this.querySelector("#btn-flecha-circulo");
    if (!btnFlecha || !circuloFlecha) return;

    btnFlecha.addEventListener("click", () => {
      const activo = circuloFlecha.classList.toggle("ring-4");
      circuloFlecha.classList.toggle("ring-orange-400", activo);
      circuloFlecha.classList.toggle("shadow-lg", activo);
      window.dispatchEvent(new CustomEvent("foco:toggle-arrow-mode", { detail: { active: activo } }));
    });

    window.addEventListener("foco:arrow-mode-changed", (event) => {
      const activo = Boolean(event.detail?.active);
      circuloFlecha.classList.toggle("ring-4", activo);
      circuloFlecha.classList.toggle("ring-orange-400", activo);
      circuloFlecha.classList.toggle("shadow-lg", activo);
    });
  }
}

// Registro en el navegador
customElements.define('foco-sidebar-actions', FocoSidebarActions);
