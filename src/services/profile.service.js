import { getToken } from '../auth.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ProfileService {
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

  async getProfile() {
    const headers = await this.#getHeaders();
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo cargar el perfil`);
    }

    return await res.json();
  }

  async updateProfile(profileData) {
    const headers = await this.#getHeaders();
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error ${res.status}: No se pudo actualizar el perfil`);
    }

    return await res.json();
  }

  async getOnboardingStatus() {
    const headers = await this.#getHeaders();
    const res = await fetch(`${API_BASE}/onboarding/status`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      return { completed: false, profiling: null };
    }

    return await res.json();
  }
}

export const profileService = new ProfileService();
