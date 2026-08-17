/**
 * Componente: SidebarActions
 * Barra de herramientas lateral izquierda con botones arrastrables simulados.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */
class FocoSidebarActions extends HTMLElement {
  connectedCallback() {
    this.className = "w-20 bg-foco-gray-sidebar flex flex-col items-center py-6 border-r border-slate-200 space-y-6 select-none flex-shrink-0";
    this.innerHTML = `
      <div class="flex flex-col items-center space-y-5 w-full">
        
        <!-- Botón: Nota -->
        <div class="flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Nota">
          <div class="w-12 h-12 rounded-2xl bg-foco-blue-accent text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Nota (+) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
              <path d="M5 12h14"/>
              <path d="M12 5v14"/>
            </svg>
          </div>
          <span class="text-[10px] font-semibold text-foco-blue-deep mt-1 group-hover:text-indigo-700 transition-colors">Nota</span>
        </div>

        <!-- Botón: Tarea -->
        <div class="flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Tarea">
          <div class="w-12 h-12 rounded-2xl bg-foco-blue-mid text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Tarea (Checklist) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            </svg>
          </div>
          <span class="text-[10px] font-semibold text-foco-blue-deep mt-1 group-hover:text-indigo-700 transition-colors">Tarea</span>
        </div>

        <!-- Botón: Flecha (Conector Visual) -->
        <div class="flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para conectar ideas con una Flecha">
          <div class="w-12 h-12 rounded-2xl bg-foco-orange-light text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Flecha (Derecha) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-right">
              <path d="M18 8L22 12L18 16"/>
              <path d="M2 12H22"/>
            </svg>
          </div>
          <span class="text-[10px] font-semibold text-foco-orange-accent mt-1 group-hover:text-orange-700 transition-colors">Flecha</span>
        </div>

        <!-- Botón: Lista -->
        <div class="flex flex-col items-center group cursor-grab active:cursor-grabbing" title="Arrastrá para crear una Lista">
          <div class="w-12 h-12 rounded-2xl bg-foco-blue-light text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <!-- Icono SVG de Lista (Bullet Points) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list">
              <path d="M3 5h.01"/>
              <path d="M3 12h.01"/>
              <path d="M3 19h.01"/>
              <path d="M8 5h13"/>
              <path d="M8 12h13"/>
              <path d="M8 19h13"/>
            </svg>
          </div>
          <span class="text-[10px] font-semibold text-foco-blue-deep mt-1 group-hover:text-indigo-700 transition-colors">Lista</span>
        </div>

      </div>
    `;
  }
}

// Registro en el navegador
customElements.define('foco-sidebar-actions', FocoSidebarActions);

