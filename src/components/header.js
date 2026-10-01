import { continueAsGuest, getSession, isGuest, signOut, supabase } from '../auth.js';
import { notificationService } from '../services/notification.service.js';
import logoUrl from '../images/logo.svg';

class FocoHeader extends HTMLElement {
  constructor() {
    super();
    this.notifications = [];
    this.unreadCount = 0;
    this.currentUser = null;
    this.isNotificationOpen = false;
    this.isProfileOpen = false;
  }

  connectedCallback() {
    this.className = "block z-30 shadow-sm border-b border-[--color-header-borde,theme(colors.slate.200)] bg-[--color-header-bg,white] relative";
    this.render();
    this.initEvents();
    this.initAuth();
  }

  render() {
    this.innerHTML = `
      <header class="flex justify-between items-center h-16 bg-[--color-header-bg,white] px-4 md:px-6 border-b border-[--color-header-borde,theme(colors.slate.200)] shadow-sm relative z-30 select-none">
        
        <!-- Sección Izquierda: Logo y Marca -->
        <a href="/" class="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[--color-header-logo-bg,#DDE2F2] flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden p-1">
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
        </a>

        <!-- Sección Derecha: Notificaciones + Perfil o Auth -->
        <div class="flex items-center space-x-3 md:space-x-4">
          
          <!-- Contenedor Campana de Notificaciones (NotificationBell) -->
          <div data-notifications-wrapper class="relative hidden" id="notification-wrapper">
            <button
              id="notification-bell-btn"
              data-notification-btn
              type="button"
              class="relative p-2 text-slate-600 hover:text-foco-blue-deep hover:bg-slate-100 rounded-xl transition-all focus:outline-none"
              aria-label="Abrir notificaciones"
              title="Notificaciones"
            >
              <!-- Icono de Campanita SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>

              <!-- Badge indicador de no leídas -->
              <span
                id="notification-badge"
                data-notification-badge
                class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-foco-orange-accent text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md hidden animate-pulse"
              >
                0
              </span>
            </button>

            <!-- Modal / Popover Desplegable de Notificaciones -->
            <div
              id="notification-popover"
              data-notification-dropdown
              class="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 text-slate-800 hidden transition-all"
            >
              <div class="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-sm text-foco-blue-deep">Notificaciones</h3>
                  <span data-unread-count-pill class="text-xs bg-orange-100 text-foco-orange-accent font-semibold px-2 py-0.5 rounded-full hidden">
                    0 nuevas
                  </span>
                </div>
                <button
                  id="mark-all-read-btn"
                  data-mark-all-read
                  type="button"
                  class="text-xs text-foco-blue-accent hover:text-foco-blue-deep font-semibold transition-colors"
                >
                  Marcar todo como leído
                </button>
              </div>

              <!-- Lista scrolleable de notificaciones -->
              <div
                id="notification-list"
                data-notification-list
                class="max-h-80 overflow-y-auto divide-y divide-slate-100"
              >
                <div class="p-6 text-center text-slate-400 text-xs">
                  Cargando notificaciones...
                </div>
              </div>
            </div>
          </div>

          <!-- Contenedor Menú de Perfil (HeaderDropdown) -->
          <div data-profile-wrapper class="relative hidden" id="profile-wrapper">
            <button
              id="profile-dropdown-btn"
              data-profile-btn
              type="button"
              class="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-all focus:outline-none"
              aria-label="Abrir menú de perfil"
            >
              <div
                data-avatar-container
                class="w-9 h-9 rounded-full bg-gradient-to-tr from-foco-blue-deep to-foco-blue-accent text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-white"
              >
                <span data-avatar-initial>U</span>
              </div>
              <span data-auth-name class="text-sm font-semibold text-slate-700 hidden sm:inline max-w-[120px] truncate">
                Usuario
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400 transition-transform" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <!-- Menú Desplegable de Perfil -->
            <div
              id="profile-menu-dropdown"
              data-profile-dropdown
              class="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 hidden"
            >
              <div class="px-4 py-2 border-b border-slate-100">
                <p data-profile-menu-name class="text-xs font-bold text-slate-800 truncate">Usuario</p>
                <p data-profile-menu-email class="text-[11px] text-slate-500 truncate">usuario@email.com</p>
              </div>

              <div class="py-1">
                <!-- Opción 1: Mi Cuenta -->
                <a
                  href="/mi-cuenta.html"
                  id="menu-mi-cuenta"
                  data-nav-account
                  class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-foco-blue-deep font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span>Mi Cuenta</span>
                </a>

                <!-- Opción: Onboarding / Calibración -->
                <a
                  href="/onboarding.html"
                  id="menu-onboarding"
                  data-nav-onboarding
                  class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-foco-blue-deep font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                  <span>Calibrar Rutina</span>
                </a>
              </div>

              <div class="border-t border-slate-100 py-1">
                <!-- Opción 2: Cerrar Sesión -->
                <button
                  id="menu-logout-btn"
                  data-action-logout
                  type="button"
                  class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Contenedor Estado Invitado / Sin Sesión -->
          <div data-anon-wrapper class="flex items-center space-x-2">
            <span data-guest-pill class="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full hidden">
              Modo Invitado
            </span>
            <a
              href="/login.html"
              id="header-login-btn"
              data-login-action
              class="rounded-xl bg-foco-blue-deep hover:bg-opacity-95 text-white px-3.5 py-2 text-xs md:text-sm font-bold shadow-sm transition-all"
            >
              Iniciar Sesión
            </a>
            <button
              id="header-guest-btn"
              data-guest-action
              type="button"
              class="rounded-xl border border-slate-200 px-3 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all hidden"
            >
              Continuar como invitado
            </button>
          </div>

        </div>
      </header>
    `;
  }

  initEvents() {
    const notifBtn = this.querySelector('[data-notification-btn]');
    const profileBtn = this.querySelector('[data-profile-btn]');
    const markAllBtn = this.querySelector('[data-mark-all-read]');
    const logoutBtn = this.querySelector('[data-action-logout]');
    const guestBtn = this.querySelector('[data-guest-action]');

    notifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNotifications();
    });

    profileBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleProfile();
    });

    markAllBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await notificationService.markAllAsRead();
      await this.loadNotifications();
    });

    logoutBtn?.addEventListener('click', async () => {
      await signOut();
      window.location.href = '/login.html';
    });

    guestBtn?.addEventListener('click', () => {
      continueAsGuest();
      this.updateUI(null);
    });

    // Cerrar popovers al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) {
        this.closeAllDropdowns();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });
  }

  toggleNotifications() {
    this.isNotificationOpen = !this.isNotificationOpen;
    this.isProfileOpen = false;

    const notifPop = this.querySelector('[data-notification-dropdown]');
    const profPop = this.querySelector('[data-profile-dropdown]');

    profPop?.classList.add('hidden');

    if (this.isNotificationOpen) {
      notifPop?.classList.remove('hidden');
      this.loadNotifications();
    } else {
      notifPop?.classList.add('hidden');
    }
  }

  toggleProfile() {
    this.isProfileOpen = !this.isProfileOpen;
    this.isNotificationOpen = false;

    const notifPop = this.querySelector('[data-notification-dropdown]');
    const profPop = this.querySelector('[data-profile-dropdown]');

    notifPop?.classList.add('hidden');

    if (this.isProfileOpen) {
      profPop?.classList.remove('hidden');
    } else {
      profPop?.classList.add('hidden');
    }
  }

  closeAllDropdowns() {
    this.isNotificationOpen = false;
    this.isProfileOpen = false;
    this.querySelector('[data-notification-dropdown]')?.classList.add('hidden');
    this.querySelector('[data-profile-dropdown]')?.classList.add('hidden');
  }

  async initAuth() {
    try {
      const session = await getSession();
      this.updateUI(session);
      if (session?.user) {
        await this.loadNotifications();
      }
    } catch {
      this.updateUI(null);
    }

    supabase?.auth.onAuthStateChange(async (_event, session) => {
      this.updateUI(session);
      if (session?.user) {
        await this.loadNotifications();
      }
    });
  }

  updateUI(session) {
    const user = session?.user;
    this.currentUser = user;

    const notifWrapper = this.querySelector('[data-notifications-wrapper]');
    const profileWrapper = this.querySelector('[data-profile-wrapper]');
    const anonWrapper = this.querySelector('[data-anon-wrapper]');
    const guestPill = this.querySelector('[data-guest-pill]');
    const loginAction = this.querySelector('[data-login-action]');
    const guestAction = this.querySelector('[data-guest-action]');

    const nameEl = this.querySelector('[data-auth-name]');
    const menuNameEl = this.querySelector('[data-profile-menu-name]');
    const menuEmailEl = this.querySelector('[data-profile-menu-email]');
    const avatarInitial = this.querySelector('[data-avatar-initial]');

    if (user) {
      notifWrapper?.classList.remove('hidden');
      profileWrapper?.classList.remove('hidden');
      anonWrapper?.classList.add('hidden');

      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
      const email = user.email || '';
      const initial = (displayName[0] || 'U').toUpperCase();

      if (nameEl) nameEl.textContent = displayName;
      if (menuNameEl) menuNameEl.textContent = displayName;
      if (menuEmailEl) menuEmailEl.textContent = email;
      if (avatarInitial) avatarInitial.textContent = initial;
    } else if (isGuest()) {
      notifWrapper?.classList.add('hidden');
      profileWrapper?.classList.add('hidden');
      anonWrapper?.classList.remove('hidden');
      guestPill?.classList.remove('hidden');
      loginAction?.classList.remove('hidden');
      guestAction?.classList.add('hidden');
    } else {
      notifWrapper?.classList.add('hidden');
      profileWrapper?.classList.add('hidden');
      anonWrapper?.classList.remove('hidden');
      guestPill?.classList.add('hidden');
      loginAction?.classList.remove('hidden');
      guestAction?.classList.remove('hidden');
    }
  }

  async loadNotifications() {
    if (!this.currentUser) return;

    const data = await notificationService.getNotifications();
    this.notifications = data.notifications || [];
    this.unreadCount = data.unread_count || 0;

    this.renderNotificationList();
    this.updateNotificationBadge();
  }

  updateNotificationBadge() {
    const badge = this.querySelector('[data-notification-badge]');
    const pill = this.querySelector('[data-unread-count-pill]');

    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (pill) {
      if (this.unreadCount > 0) {
        pill.textContent = `${this.unreadCount} nuevas`;
        pill.classList.remove('hidden');
      } else {
        pill.classList.add('hidden');
      }
    }
  }

  renderNotificationList() {
    const listContainer = this.querySelector('[data-notification-list]');
    if (!listContainer) return;

    if (this.notifications.length === 0) {
      listContainer.innerHTML = `
        <div class="p-8 text-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p class="text-xs font-medium">No tenés notificaciones pendientes</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.notifications.map((item) => {
      const isUnread = !item.read;
      const isHigh = item.priority === 'high' || item.type === 'ONBOARDING_REQUIRED';

      return `
        <div class="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 relative ${isUnread ? 'bg-orange-50/30' : ''}" data-item-id="${item.id}">
          <!-- Icono de estado -->
          <div class="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
            isHigh ? 'bg-orange-100 text-foco-orange-accent' : 'bg-blue-100 text-foco-blue-deep'
          }">
            ${
              isHigh
                ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
            }
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-slate-800 truncate ${isUnread ? 'text-foco-blue-deep' : ''}">
                ${item.title}
              </h4>
              <span class="text-[10px] text-slate-400">
                ${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p class="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
              ${item.message}
            </p>

            ${
              item.action_url
                ? `
              <div class="mt-2 flex items-center gap-2">
                <a
                  href="${item.action_url}"
                  class="text-[11px] font-bold text-white bg-foco-orange-accent hover:bg-orange-600 px-3 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1 w-fit"
                >
                  ${item.type === 'ONBOARDING_REQUIRED' ? 'Realizar Onboarding' : 'Ver detalle'}
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>
            `
                : ''
            }
          </div>

          <!-- Acciones individuales: Marcar como leída / Descartar -->
          <div class="flex flex-col items-center gap-1.5 ml-1">
            ${
              isUnread
                ? `
              <button
                type="button"
                data-mark-read="${item.id}"
                title="Marcar como leída"
                class="text-slate-400 hover:text-green-600 p-1 rounded hover:bg-slate-200/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
              </button>
            `
                : ''
            }
            <button
              type="button"
              data-dismiss="${item.id}"
              title="Eliminar notificación"
              class="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-slate-200/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind event listeners para acciones individuales
    listContainer.querySelectorAll('[data-mark-read]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-mark-read');
        await notificationService.markAsRead(id);
        await this.loadNotifications();
      });
    });

    listContainer.querySelectorAll('[data-dismiss]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-dismiss');
        await notificationService.dismissNotification(id);
        await this.loadNotifications();
      });
    });
  }
}

// Registro global del componente Custom Element
if (!customElements.get('foco-header')) {
  customElements.define('foco-header', FocoHeader);
}

export { FocoHeader };
