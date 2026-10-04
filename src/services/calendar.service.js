/**
 * Service: CalendarService
 * Cliente HTTP para la API de Google Calendar de F.O.C.O.
 */

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class CalendarService {
  constructor(baseUrl = DEFAULT_API_URL) {
    this.baseUrl = baseUrl;
  }

  async saveTokens(tokenData, authToken) {
    if (!authToken) throw new Error('Token de autenticación requerido');

    const res = await fetch(`${this.baseUrl}/calendar/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(tokenData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error guardando tokens: ${res.status}`);
    }

    return res.json();
  }

  async getStatus(authToken) {
    if (!authToken) return { connected: false, hasRefreshToken: false };

    const res = await fetch(`${this.baseUrl}/calendar/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!res.ok) {
      return { connected: false, hasRefreshToken: false };
    }

    return res.json();
  }

  async getEvents(params, authToken) {
    if (!authToken) return [];

    let query = '';
    if (typeof params === 'string') {
      query = `date=${encodeURIComponent(params)}`;
    } else if (params && typeof params === 'object') {
      const qp = new URLSearchParams();
      if (params.date) qp.append('date', params.date);
      if (params.timeMin) qp.append('timeMin', params.timeMin);
      if (params.timeMax) qp.append('timeMax', params.timeMax);
      if (params.timeZone) qp.append('timeZone', params.timeZone);
      query = qp.toString();
    }

    const url = query
      ? `${this.baseUrl}/calendar/events?${query}`
      : `${this.baseUrl}/calendar/events`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.events || [];
  }

  async createEvent(eventPayload, authToken) {
    if (!authToken) throw new Error('Token de autenticación requerido');

    const res = await fetch(`${this.baseUrl}/calendar/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(eventPayload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error creando evento: ${res.status}`);
    }

    return res.json();
  }

  async disconnect(authToken) {
    if (!authToken) return;

    const res = await fetch(`${this.baseUrl}/calendar/disconnect`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return res.json();
  }
}

export const calendarService = new CalendarService();
