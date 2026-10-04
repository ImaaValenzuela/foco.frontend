/**
 * Manager: CalendarManager
 * Encapsula el estado, sincronización periódica y reglas de negocio del Widget de Google Calendar.
 * Cumple con SRP desacoplando la gestión de eventos de Google Calendar del componente UI.
 */

import { calendarService } from '../services/calendar.service.js';
import { authService } from '../services/auth.service.js';

export class CalendarManager {
  constructor(onUpdateCallback = null) {
    this.onUpdate = onUpdateCallback;
    this.isConnected = false;
    this.hasRefreshToken = false;
    this.isLoading = false;
    this.events = [];
    this.error = null;
    this.lastSynced = null;
    this.selectedDate = new Date();
    this.pollInterval = null;
    this.isModalOpen = false;
    this.draggedCardData = null;
    this.authSubscription = null;

    // Escuchar eventos globales de sincronización
    this.onRefreshHandler = () => this.loadEvents(true);
    document.addEventListener('foco:refresh-calendar', this.onRefreshHandler);
  }

  notify() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.getState());
    }
  }

  getState() {
    return {
      isConnected: this.isConnected,
      hasRefreshToken: this.hasRefreshToken,
      isLoading: this.isLoading,
      events: this.events,
      error: this.error,
      lastSynced: this.lastSynced,
      selectedDate: this.selectedDate,
      isModalOpen: this.isModalOpen,
      draggedCardData: this.draggedCardData
    };
  }

  async init() {
    this.isLoading = true;
    this.notify();

    try {
      const session = await authService.getSession();
      const token = session?.access_token || null;

      // 1. Sincronización transparente de tokens de Google si están presentes en la sesión
      if (session && (session.provider_token || session.provider_refresh_token)) {
        try {
          await calendarService.saveTokens({
            provider_token: session.provider_token,
            provider_refresh_token: session.provider_refresh_token,
            expires_at: session.expires_at
          }, token);
        } catch (syncErr) {
          console.warn('Aviso: no se pudo guardar tokens de Google al inicio:', syncErr.message);
        }
      }

      // 2. Verificar estado de conexión con Google Calendar
      if (token) {
        const status = await calendarService.getStatus(token);
        this.isConnected = Boolean(status.connected);
        this.hasRefreshToken = Boolean(status.hasRefreshToken);

        if (this.isConnected) {
          await this.loadEvents(false);
        }
      } else {
        this.isConnected = false;
      }

      // 3. Iniciar polling periódico silencioso (cada 60 segundos)
      this.startPolling();

      // 4. Escuchar cambios de autenticación para reaccionar a login con Google
      const { data } = authService.onAuthStateChange(async (event, newSession) => {
        if (newSession && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
          if (newSession.provider_token || newSession.provider_refresh_token) {
            try {
              await calendarService.saveTokens({
                provider_token: newSession.provider_token,
                provider_refresh_token: newSession.provider_refresh_token,
                expires_at: newSession.expires_at
              }, newSession.access_token);
              this.isConnected = true;
              await this.loadEvents(true);
            } catch (e) {
              console.warn('Error sincronizando tokens tras login:', e);
            }
          }
        }
      });
      this.authSubscription = data?.subscription;

    } catch (err) {
      console.error('Error inicializando CalendarManager:', err);
      this.error = err.message;
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  async loadEvents(silent = false) {
    if (!silent) {
      this.isLoading = true;
      this.notify();
    }

    try {
      const token = await authService.getToken();
      if (!token) return;

      const dateStr = this.selectedDate.toISOString().split('T')[0];
      const events = await calendarService.getEvents(dateStr, token);
      this.events = Array.isArray(events) ? events : [];
      this.lastSynced = new Date();
      this.error = null;
    } catch (err) {
      console.warn('Error cargando eventos de Google Calendar:', err);
      this.error = 'No se pudieron sincronizar los eventos';
    } finally {
      if (!silent) {
        this.isLoading = false;
      }
      this.notify();
    }
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (this.isConnected) {
        this.loadEvents(true);
      }
    }, 60000); // Polling silencioso cada 60s
  }

  async connectGoogleCalendar() {
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      console.error('Error iniciando Google Calendar OAuth:', err);
      this.error = err.message;
      this.notify();
    }
  }

  openScheduleModal(cardData) {
    this.draggedCardData = cardData;
    this.isModalOpen = true;
    this.notify();
  }

  closeScheduleModal() {
    this.isModalOpen = false;
    this.draggedCardData = null;
    this.notify();
  }

  async scheduleCard(cardData, startDateTime, endDateTime) {
    this.isLoading = true;
    this.notify();

    try {
      const token = await authService.getToken();
      if (!token) throw new Error('Debes iniciar sesión para agendar eventos');

      const summary = cardData.title || cardData.text || 'Tarea de FOCO';
      const description = `Importado desde FOCO: ${cardData.text || ''}\nBloque: ${cardData.blockId || 'Lienzo'}`;

      const res = await calendarService.createEvent({
        summary,
        description,
        start: startDateTime,
        end: endDateTime
      }, token);

      this.closeScheduleModal();
      await this.loadEvents(true);

      document.dispatchEvent(new CustomEvent('foco:calendar-event-created', {
        detail: { event: res.event, card: cardData }
      }));

      return res;
    } catch (err) {
      console.error('Error agendando tarjeta en Google Calendar:', err);
      this.error = err.message;
      this.notify();
      throw err;
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.authSubscription && typeof this.authSubscription.unsubscribe === 'function') {
      this.authSubscription.unsubscribe();
    }
    document.removeEventListener('foco:refresh-calendar', this.onRefreshHandler);
  }
}
