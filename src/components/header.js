/**
 * Componente: Header
 * Botón superior de F.O.C.O. con avatar de usuario.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */
class FocoHeader extends HTMLElement {
  connectedCallback() {
    this.className = "block z-10 shadow-sm border-b border-slate-200 bg-white";
    this.innerHTML = `
        <header class="flex justify-between items-center h-16 bg-white px-6 border-b border-slate-200 shadow-sm z-10">
            
            <!-- Sección Izquierda: Logo y Acrónimo -->
            <div class="flex items-center space-x-3">
            <!-- Icono/Logo FOCO -->
            <div class="w-12 h-12 rounded-full bg-foco-blue-gray flex items-center justify-center text-white font-bold text-sm shadow-md">
                <img src="src/images/logo.svg" alt="">
            </div>
            <div>
                <h1 class="text-xl font-extrabold tracking-tight text-foco-blue-deep flex items-center gap-1.5">
                F.O.C.O.
                <span class="text-xs font-medium text-slate-500 hidden md:inline border-l border-slate-300 pl-2">
                    Filtro Operativo contra el Caos y la Omisión
                </span>
                </h1>
            </div>
            </div>

            <!-- Sección Derecha: Perfil -->
            
            <!-- Información del Usuario -->
            <div class="flex items-center space-x-2">
                <span class="text-sm font-semibold text-slate-700 hidden sm:inline">Hola, Alex</span>
                <div class="w-9 h-9 rounded-full bg-foco-blue-deep text-white font-bold flex items-center justify-center border-2 border-foco-orange-accent">
                A
                </div>
            </div>
            </div>

        </header>
    `;
  }
}

// Registro del Custom Element global en el navegador
customElements.define('foco-header', FocoHeader);
