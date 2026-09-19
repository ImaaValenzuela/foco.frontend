import { continueAsGuest, getSession, isGuest, signInWithGoogle, signOut, supabase } from '../auth.js';
import logoUrl from '../images/logo.svg';

class FocoHeader extends HTMLElement {
  connectedCallback() {
    this.className = "block z-10 shadow-sm border-b border-[--color-header-borde,theme(colors.slate.200)] bg-[--color-header-bg,white]";
    this.innerHTML = `
        <header class="flex justify-between items-center h-16 bg-[--color-header-bg,white] px-6 border-b border-[--color-header-borde,theme(colors.slate.200)] shadow-sm z-10">
          
          <!-- Sección Izquierda: Logo y Acrónimo -->
          <div class="flex items-center space-x-3">
          <!-- Icono/Logo FOCO -->
          <div class="w-12 h-12 rounded-full bg-[--color-header-logo-bg,#DDE2F2] flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden p-1">
              <img src="${logoUrl}" alt="F.O.C.O. Logo" class="w-full h-full object-contain">
          </div>
          <div>
              <h1 class="text-xl font-extrabold tracking-tight text-[--color-header-titulo,#22298A] flex items-center gap-1.5">
              F.O.C.O.
              <span class="text-xs font-medium text-[--color-header-subtitulo,theme(colors.slate.500)] hidden md:inline border-l border-slate-300 pl-2">
                  Filtro Operativo contra el Caos y la Omisión
              </span>
              </h1>
          </div>
          </div>

          <!-- Sección Derecha: Perfil -->
          
          <!-- Información del Usuario -->
          <div class="flex items-center space-x-2">
              <span data-auth-name class="text-sm font-semibold text-[--color-header-usuario,theme(colors.slate.700)] hidden sm:inline">Invitado</span>
              <button data-google-action type="button" class="rounded-lg border border-[--color-header-cerrar-borde,theme(colors.slate.200)] px-3 py-2 text-sm font-semibold text-[--color-header-cerrar-texto,theme(colors.slate.700)] bg-[--color-header-cerrar-bg,transparent]">Iniciar sesión con Google</button>
              <button data-guest-action type="button" class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">Continuar como invitado</button>
          </div>
          </div>

      </header>
    `;
    const name = this.querySelector('[data-auth-name]');
    const googleAction = this.querySelector('[data-google-action]');
    const guestAction = this.querySelector('[data-guest-action]');
    const render = (session) => {
      const user = session?.user;
      name.textContent = user?.user_metadata?.full_name || user?.email || (isGuest() ? 'Invitado' : 'Sin sesión');
      googleAction.textContent = user ? 'Cerrar sesión' : 'Iniciar sesión con Google';
      guestAction.hidden = Boolean(user) || isGuest();
    };
    getSession().then(render).catch(() => render(null));
    googleAction.addEventListener('click', async () => {
      const session = await getSession();
      if (session) await signOut();
      else await signInWithGoogle();
    });
    guestAction.addEventListener('click', () => {
      continueAsGuest();
      render(null);
    });
    supabase?.auth.onAuthStateChange((_event, session) => render(session));
  }
}

// Registro del Custom Element global en el navegador
customElements.define('foco-header', FocoHeader);
