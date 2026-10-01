import { getToken } from '../auth.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class NotificationService {
  async #getHeaders() {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async getNotifications() {
    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        if (res.status === 401) return { notifications: [], unread_count: 0 };
        throw new Error('Error al obtener notificaciones');
      }

      return await res.json();
    } catch (err) {
      console.warn('[NotificationService] Fallo al consultar notificaciones:', err.message);
      return { notifications: [], unread_count: 0 };
    }
  }

  async markAsRead(id) {
    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
      });

      if (!res.ok) throw new Error('Error al marcar notificación como leída');
      return await res.json();
    } catch (err) {
      console.warn('[NotificationService] Error:', err.message);
      return null;
    }
  }

  async markAllAsRead() {
    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers,
      });

      if (!res.ok) throw new Error('Error al marcar todas las notificaciones como leídas');
      return await res.json();
    } catch (err) {
      console.warn('[NotificationService] Error:', err.message);
      return { success: false };
    }
  }

  async dismissNotification(id) {
    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Error al descartar notificación');
      return true;
    } catch (err) {
      console.warn('[NotificationService] Error:', err.message);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
