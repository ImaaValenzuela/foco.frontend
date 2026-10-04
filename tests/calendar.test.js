import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '../src/services/auth.service.js';
import { CalendarService } from '../src/services/calendar.service.js';
import { CalendarManager } from '../src/managers/calendarManager.js';
import { renderCalendarWidget } from '../src/components/CalendarWidget.jsx';

describe('Frontend Google Calendar Integration Suite', () => {
  describe('1. Autenticación y Scopes OAuth', () => {
    it('debe solicitar los scopes de calendar.events y calendar.readonly con access_type offline y prompt consent', async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null });
      const mockClient = {
        auth: {
          signInWithOAuth: mockSignInWithOAuth,
        }
      };

      const authService = new AuthService(mockClient);
      await authService.signInWithGoogle();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.any(String),
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
    });
  });

  describe('2. CalendarService HTTP Client', () => {
    let calendarService;
    let originalFetch;

    beforeEach(() => {
      calendarService = new CalendarService('http://localhost:4000/api');
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('saveTokens envía provider_token y provider_refresh_token con header Bearer', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const res = await calendarService.saveTokens({
        provider_token: 'google-access-tok',
        provider_refresh_token: 'google-refresh-tok',
        expires_at: 1700000000
      }, 'user-jwt-token');

      expect(res.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/calendar/tokens',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer user-jwt-token'
          }),
          body: JSON.stringify({
            provider_token: 'google-access-tok',
            provider_refresh_token: 'google-refresh-tok',
            expires_at: 1700000000
          })
        })
      );
    });

    it('createEvent envía summary, description, start y end a la API de calendario', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          event: { id: 'evt-1', summary: 'Reunión Scrum' }
        })
      });

      const res = await calendarService.createEvent({
        summary: 'Reunión Scrum',
        description: 'Arrastrado desde lienzo',
        start: '2026-10-04T10:00:00Z',
        end: '2026-10-04T11:00:00Z'
      }, 'jwt-token-123');

      expect(res.success).toBe(true);
      expect(res.event.id).toBe('evt-1');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/calendar/events',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            summary: 'Reunión Scrum',
            description: 'Arrastrado desde lienzo',
            start: '2026-10-04T10:00:00Z',
            end: '2026-10-04T11:00:00Z'
          })
        })
      );
    });
  });

  describe('3. CalendarWidget Rendering & Drop Zone', () => {
    it('renderiza botón de conexión cuando isConnected es false', () => {
      const html = renderCalendarWidget({ isConnected: false });
      expect(html).toContain('Sin conectar');
      expect(html).toContain('Conectar Google Calendar');
      expect(html).toContain('foco-calendar-dropzone');
    });

    it('renderiza listado de eventos cuando isConnected es true y hay eventos', () => {
      const mockEvents = [
        {
          id: 'ev-1',
          title: 'Daily Standup',
          start: '2026-10-04T10:00:00Z',
          end: '2026-10-04T10:30:00Z',
          allDay: false
        }
      ];

      const html = renderCalendarWidget({
        isConnected: true,
        events: mockEvents
      });

      expect(html).toContain('Sincronizado');
      expect(html).toContain('Daily Standup');
      expect(html).toContain('Agenda Google Calendar');
    });

    it('renderiza modal de confirmación cuando isModalOpen es true y hay tarjeta arrastrada', () => {
      const html = renderCalendarWidget({
        isConnected: true,
        isModalOpen: true,
        draggedCardData: {
          title: 'Terminar presentación',
          text: 'Diapositivas de ventas'
        }
      });

      expect(html).toContain('calendar-schedule-modal');
      expect(html).toContain('Agendar en Google Calendar');
      expect(html).toContain('Terminar presentación');
      expect(html).toContain('modal-confirm-schedule-btn');
    });
  });

  describe('4. CalendarManager & Drag and Drop Flow', () => {
    it('scheduleCard invoca createEvent y despacha foco:calendar-event-created', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          event: { id: 'evt-dropped-1', summary: 'Tarea Arrastrada' }
        })
      });

      const eventListenerSpy = vi.fn();
      document.addEventListener('foco:calendar-event-created', eventListenerSpy);

      const manager = new CalendarManager();
      // Simular usuario autenticado con token
      vi.spyOn(manager, 'loadEvents').mockResolvedValue();

      // Mock getToken en authService
      const { authService } = await import('../src/services/auth.service.js');
      vi.spyOn(authService, 'getToken').mockResolvedValue('fake-access-token');

      const card = {
        noteId: 'card-1',
        blockId: 'active_objectives',
        title: 'Tarea Arrastrada',
        text: 'Contenido de la tarjeta'
      };

      await manager.scheduleCard(card, '2026-10-04T14:00:00Z', '2026-10-04T15:00:00Z');

      expect(eventListenerSpy).toHaveBeenCalled();
      const dispatchedEvent = eventListenerSpy.mock.calls[0][0];
      expect(dispatchedEvent.detail.card.noteId).toBe('card-1');

      document.removeEventListener('foco:calendar-event-created', eventListenerSpy);
      global.fetch = originalFetch;
      manager.destroy();
    });
  });
});
