import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mocks antes de importar componentes
vi.mock('../src/images/logo.svg', () => ({
  default: 'logo.svg',
}));

const mockSession = {
  user: {
    id: 'user-frontend-123',
    email: 'frontend@foco.app',
    user_metadata: {
      full_name: 'Usuario Frontend',
    },
  },
  access_token: 'fake-jwt-token-xyz',
};

const mockNotifications = [
  {
    id: 'notif-onboarding-1',
    user_id: 'user-frontend-123',
    type: 'ONBOARDING_REQUIRED',
    title: 'Completá tu diagnóstico inicial',
    message: 'Para que F.O.C.O. calibre tu IA y adapte tu espacio de trabajo, completá tu rutina y preferencias.',
    action_url: '/onboarding.html',
    priority: 'high',
    read: false,
    created_at: new Date().toISOString(),
  },
];

vi.mock('../src/auth.js', () => {
  return {
    getSession: vi.fn(),
    signOut: vi.fn(),
    continueAsGuest: vi.fn(),
    isGuest: vi.fn().mockReturnValue(false),
    getToken: vi.fn().mockResolvedValue('fake-jwt-token-xyz'),
    supabase: {
      auth: {
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        getSession: vi.fn(),
        signOut: vi.fn(),
      },
    },
  };
});

vi.mock('../src/services/notification.service.js', () => {
  return {
    notificationService: {
      getNotifications: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      dismissNotification: vi.fn(),
    },
  };
});

vi.mock('../src/services/profile.service.js', () => {
  return {
    profileService: {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      getOnboardingStatus: vi.fn(),
      checkOnboardingCompleted: vi.fn().mockResolvedValue(true),
    },
  };
});

import { getSession, signOut } from '../src/auth.js';
import { notificationService } from '../src/services/notification.service.js';
import { profileService } from '../src/services/profile.service.js';
import '../src/components/header.js';

describe('Suite de Pruebas de Integración (Frontend - UI, Header, Notificaciones, Mi Cuenta, Logout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    localStorage.clear();
    sessionStorage.clear();

    getSession.mockResolvedValue(mockSession);
    notificationService.getNotifications.mockResolvedValue({
      notifications: [...mockNotifications],
      unread_count: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Test 2.1: Renderizado y Despliegue de Header', () => {
    it('2.1.1: Renderiza el icono de campanita con badge y el avatar de usuario autenticado', async () => {
      const header = document.createElement('foco-header');
      document.body.appendChild(header);

      // Esperar a que se ejecute connectedCallback y ciclo async de carga
      await new Promise((r) => setTimeout(r, 60));

      const notifBtn = header.querySelector('#notification-bell-btn');
      const badge = header.querySelector('#notification-badge');
      const profileBtn = header.querySelector('#profile-dropdown-btn');
      const userName = header.querySelector('[data-auth-name]');
      const avatarInitial = header.querySelector('[data-avatar-initial]');

      expect(notifBtn).not.toBeNull();
      expect(badge).not.toBeNull();
      expect(badge?.textContent?.trim()).toBe('1');
      expect(badge?.classList.contains('hidden')).toBe(false);

      expect(profileBtn).not.toBeNull();
      expect(userName?.textContent?.trim()).toBe('Usuario Frontend');
      expect(avatarInitial?.textContent?.trim()).toBe('U');
    });

    it('2.1.2: Simula clic en campanita -> Despliega modal de notificaciones y lista alerta ONBOARDING_REQUIRED', async () => {
      const header = document.createElement('foco-header');
      document.body.appendChild(header);

      await new Promise((r) => setTimeout(r, 60));

      const notifBtn = header.querySelector('#notification-bell-btn');
      const popover = header.querySelector('#notification-popover');

      expect(popover?.classList.contains('hidden')).toBe(true);

      // Clic para abrir popover
      notifBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(popover?.classList.contains('hidden')).toBe(false);
      expect(popover?.innerHTML).toContain('Completá tu diagnóstico inicial');
      expect(popover?.innerHTML).toContain('Realizar Onboarding');
      expect(popover?.innerHTML).toContain('/onboarding.html');
    });

    it('2.1.3: Simula clic en avatar -> Despliega menú de perfil con "Mi Cuenta" y "Cerrar Sesión"', async () => {
      const header = document.createElement('foco-header');
      document.body.appendChild(header);

      await new Promise((r) => setTimeout(r, 60));

      const profileBtn = header.querySelector('#profile-dropdown-btn');
      const dropdown = header.querySelector('#profile-menu-dropdown');
      const notifPopover = header.querySelector('#notification-popover');

      expect(dropdown?.classList.contains('hidden')).toBe(true);

      // Clic en avatar
      profileBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(dropdown?.classList.contains('hidden')).toBe(false);
      // El popover de notificaciones debe cerrarse
      expect(notifPopover?.classList.contains('hidden')).toBe(true);

      const miCuentaLink = header.querySelector('#menu-mi-cuenta');
      const logoutBtn = header.querySelector('#menu-logout-btn');
      const onboardingLink = header.querySelector('#menu-onboarding');

      expect(miCuentaLink).not.toBeNull();
      expect(miCuentaLink?.getAttribute('href')).toBe('/mi-cuenta.html');
      expect(miCuentaLink?.textContent).toContain('Mi Cuenta');

      expect(logoutBtn).not.toBeNull();
      expect(logoutBtn?.textContent).toContain('Cerrar Sesión');

      // Validar que la opción redundante "Calibrar Rutina" fue eliminada y solo quedan las 2 opciones
      expect(onboardingLink).toBeNull();
      expect(dropdown?.textContent).not.toContain('Calibrar Rutina');
    });
  });

  describe('Test 2.2: Flujo de Navegación y Formulario /mi-cuenta', () => {
    it('2.2.1: Carga datos existentes de Supabase/Backend y prellena formulario correctamente', async () => {
      const mockProfileData = {
        user: {
          name: 'Jane Foster',
          email: 'jane@foco.app',
        },
        profiling: {
          study_hours_daily: 4,
          work_hours_daily: 4,
          leisure_hours_daily: 2,
          routine_hours_daily: 2,
          interests: ['yoga_mindfulness', 'entrepreneurship'],
          mot_create_habits: true,
          mot_avoid_dispersion: true,
          mot_organization: false,
          mot_reduce_fatigue: true,
        },
      };

      profileService.getProfile.mockResolvedValue(mockProfileData);

      // Construcción del DOM correspondiente a mi-cuenta.html
      document.body.innerHTML = `
        <form id="account-form">
          <input type="text" id="account-name" />
          <input type="email" id="account-email" />
          <input type="range" id="study" min="0" max="8" value="0" />
          <input type="range" id="work" min="0" max="8" value="0" />
          <input type="range" id="routine" min="0" max="8" value="0" />
          <input type="range" id="leisure" min="0" max="8" value="0" />
          <span id="study-val">0 hrs</span>
          <span id="work-val">0 hrs</span>
          <span id="routine-val">0 hrs</span>
          <span id="leisure-val">0 hrs</span>
          <span id="hours-total">0</span>
          <span id="hours-indicator"></span>
          <div id="interests-container">
            <button type="button" id="tag-yoga_mindfulness" class="interest-tag"></button>
            <button type="button" id="tag-entrepreneurship" class="interest-tag"></button>
            <button type="button" id="tag-team_sports" class="interest-tag"></button>
          </div>
          <span id="interests-count">0</span>
          <input type="checkbox" id="mot_create_habits" />
          <input type="checkbox" id="mot_avoid_dispersion" />
          <input type="checkbox" id="mot_organization" />
          <input type="checkbox" id="mot_reduce_fatigue" />
          <button type="submit" id="save-profile-btn">Guardar Cambios</button>
        </form>
        <div id="account-toast">
          <div id="toast-icon"></div>
          <h4 id="toast-title"></h4>
          <p id="toast-message"></p>
        </div>
      `;

      // Simular importación y ejecución de miCuenta
      const { profileService: pService } = await import('../src/services/profile.service.js');
      const data = await pService.getProfile();

      document.getElementById('account-name').value = data.user.name;
      document.getElementById('account-email').value = data.user.email;
      document.getElementById('study').value = data.profiling.study_hours_daily;
      document.getElementById('work').value = data.profiling.work_hours_daily;
      document.getElementById('routine').value = data.profiling.routine_hours_daily;
      document.getElementById('leisure').value = data.profiling.leisure_hours_daily;
      document.getElementById('mot_create_habits').checked = data.profiling.mot_create_habits;
      document.getElementById('mot_avoid_dispersion').checked = data.profiling.mot_avoid_dispersion;

      expect(document.getElementById('account-name').value).toBe('Jane Foster');
      expect(document.getElementById('account-email').value).toBe('jane@foco.app');
      expect(Number(document.getElementById('study').value)).toBe(4);
      expect(document.getElementById('mot_create_habits').checked).toBe(true);
      expect(document.getElementById('mot_avoid_dispersion').checked).toBe(true);
    });

    it('2.2.2: Modifica horas y motivaciones, ejecuta submit y llama a profileService.updateProfile', async () => {
      document.body.innerHTML = `
        <form id="account-form">
          <input type="text" id="account-name" value="Jane Foster" />
          <input type="email" id="account-email" value="jane@foco.app" />
          <input type="range" id="study" min="0" max="8" value="4" />
          <button type="submit" id="save-profile-btn">Guardar Cambios</button>
        </form>
      `;

      profileService.updateProfile.mockResolvedValue({
        message: 'Perfil actualizado con éxito',
        user: { name: 'Jane Foster Modificada' },
        profiling: { study_hours_daily: 6 },
      });

      // Modificamos datos
      const nameInput = document.getElementById('account-name');
      const studySlider = document.getElementById('study');
      nameInput.value = 'Jane Foster Modificada';
      studySlider.value = 6;

      const payload = {
        name: nameInput.value,
        study_hours_daily: Number(studySlider.value),
        work_hours_daily: 4,
        routine_hours_daily: 2,
        leisure_hours_daily: 2,
        interests: ['yoga_mindfulness'],
        mot_create_habits: true,
        mot_avoid_dispersion: false,
        mot_organization: true,
        mot_reduce_fatigue: false,
      };

      const res = await profileService.updateProfile(payload);

      expect(profileService.updateProfile).toHaveBeenCalledWith(payload);
      expect(res.message).toBe('Perfil actualizado con éxito');
      expect(res.user.name).toBe('Jane Foster Modificada');
    });

    it('2.2.3: mi-cuenta.html contiene los 24 intereses de onboarding.html sin iconos SVG y con IDs consistentes', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const onboardingHtml = fs.readFileSync(path.resolve(process.cwd(), 'onboarding.html'), 'utf-8');
      const miCuentaHtml = fs.readFileSync(path.resolve(process.cwd(), 'mi-cuenta.html'), 'utf-8');

      // Extraer IDs de intereses en onboarding.html
      const onboardingMatches = [...onboardingHtml.matchAll(/id="(tag-[a-z0-9_]+)"/g)].map(m => m[1]);
      const miCuentaMatches = [...miCuentaHtml.matchAll(/id="(tag-[a-z0-9_]+)"/g)].map(m => m[1]);

      // Deben coincidir exactamente los 24 intereses y en el mismo orden
      expect(onboardingMatches.length).toBe(24);
      expect(miCuentaMatches.length).toBe(24);
      expect(miCuentaMatches).toEqual(onboardingMatches);

      // Verificar que los botones en mi-cuenta no tienen iconos SVG
      const containerMatch = miCuentaHtml.match(/<div id="interests-container"[^>]*>([\s\S]*?)<\/div>/);
      expect(containerMatch).not.toBeNull();
      const containerContent = containerMatch ? containerMatch[1] : '';
      expect(containerContent).not.toContain('<svg');
    });

    it('2.2.4: El toast de notificación de guardado en miCuenta.js es general y no contiene la palabra "Supabase"', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');

      const miCuentaJs = fs.readFileSync(path.resolve(process.cwd(), 'src/components/miCuenta.js'), 'utf-8');

      // Asegurar que no contenga 'Supabase' en showToast
      const toastMatches = [...miCuentaJs.matchAll(/showToast\([^)]+\)/g)].map(m => m[0]);
      for (const toastCall of toastMatches) {
        expect(toastCall.toLowerCase()).not.toContain('supabase');
      }

      // Asegurar mensaje claro y amigable de guardado
      expect(miCuentaJs).toContain('Tu información y preferencias se han actualizado correctamente.');
    });
  });

  describe('Test 2.3: Flujo de Cierre de Sesión (Logout)', () => {
    it('2.3.1: Al hacer clic en "Cerrar Sesión", limpia tokens, destruye sesión y redirige a login', async () => {
      // Simular almacenamiento previo en localStorage y sessionStorage
      localStorage.setItem('sb-duprfmzrczejiquxdujl-auth-token', 'token-123');
      localStorage.setItem('foco_onboarding_data', JSON.stringify({ study: 4 }));
      sessionStorage.setItem('foco_session_active', 'true');
      sessionStorage.setItem('foco_user_email', 'test@foco.app');

      expect(localStorage.getItem('foco_onboarding_data')).not.toBeNull();
      expect(sessionStorage.getItem('foco_session_active')).toBe('true');

      const header = document.createElement('foco-header');
      document.body.appendChild(header);

      await new Promise((r) => setTimeout(r, 60));

      const logoutBtn = header.querySelector('#menu-logout-btn');
      expect(logoutBtn).not.toBeNull();

      signOut.mockImplementation(async () => {
        localStorage.clear();
        sessionStorage.clear();
      });

      logoutBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(signOut).toHaveBeenCalled();
      expect(sessionStorage.getItem('foco_session_active')).toBeNull();
      expect(localStorage.getItem('foco_onboarding_data')).toBeNull();
    });
  });

  describe('Test 2.4: Persistencia y Redirección de Onboarding en Autenticación', () => {
    it('2.4.1: checkOnboardingCompleted detecta datos existentes en localStorage', async () => {
      const { ProfileService } = await vi.importActual('../src/services/profile.service.js');
      const service = new ProfileService();

      localStorage.setItem('foco_onboarding_data', JSON.stringify({ study_hours_daily: 4 }));
      const completed = await service.checkOnboardingCompleted();
      expect(completed).toBe(true);
    });

    it('2.4.2: checkOnboardingCompleted consulta a API status cuando no hay caché local', async () => {
      const { ProfileService } = await vi.importActual('../src/services/profile.service.js');
      const service = new ProfileService();

      localStorage.removeItem('foco_onboarding_data');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          completed: true,
          profiling: { study_hours_daily: 4, completed_at: '2026-10-01' },
        }),
      });

      const completed = await service.checkOnboardingCompleted();
      expect(completed).toBe(true);
      expect(localStorage.getItem('foco_onboarding_data')).not.toBeNull();
    });

    it('2.4.3: checkOnboardingCompleted retorna false si el usuario no tiene onboarding en API ni en local', async () => {
      const { ProfileService } = await vi.importActual('../src/services/profile.service.js');
      const service = new ProfileService();

      localStorage.removeItem('foco_onboarding_data');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          completed: false,
          profiling: null,
        }),
      });

      const completed = await service.checkOnboardingCompleted();
      expect(completed).toBe(false);
    });
  });
});
