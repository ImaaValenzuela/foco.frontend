/**
 * Service: AuthService
 * Encapsula las operaciones de autenticación con Supabase y estado de invitado.
 * Cumple con DIP al desacoplar los componentes de la instancia concreta de Supabase y de localStorage.
 */

import { createClient } from '@supabase/supabase-js';
import { localStore, sessionStore } from './storage.service.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class AuthService {
  constructor(client = null) {
    this.client = client || (supabaseUrl && supabaseAnonKey
      ? createClient(supabaseUrl, supabaseAnonKey)
      : null);
  }

  getSupabaseClient() {
    return this.client;
  }

  async signInWithGoogle() {
    if (!this.client) throw new Error('Faltan las variables de entorno de Supabase.');
    return this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  }

  async signInWithPassword(email, password) {
    if (!this.client) throw new Error('Cliente de Supabase no configurado.');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    localStore.removeItem('foco_guest');
    sessionStore.setItem('foco_session_active', 'true');
    sessionStore.setItem('foco_user_email', email);
    return data;
  }

  async signUp(email, password, name) {
    if (!this.client) throw new Error('Cliente de Supabase no configurado.');
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
    localStore.removeItem('foco_guest');
    sessionStore.setItem('foco_session_active', 'true');
    sessionStore.setItem('foco_user_email', email);
    sessionStore.setItem('foco_user_name', name);
    return data;
  }

  async signOut() {
    try {
      if (this.client) {
        await this.client.auth.signOut();
      }
    } catch (e) {
      console.warn('Error al cerrar sesión en Supabase:', e);
    } finally {
      localStore.removeItem('foco_guest');
      localStore.removeItem('foco_onboarding_data');
      sessionStore.clear();
      // Limpiar tokens residuales en localStorage
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('sb-') || key.startsWith('foco_')) {
            localStorage.removeItem(key);
          }
        }
      } catch (err) {
        console.warn('Error limpiando localStorage:', err);
      }
    }
  }

  async getSession() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (e) {
      console.warn('No se pudo obtener la sesión:', e);
      return null;
    }
  }

  async getToken() {
    const session = await this.getSession();
    return session?.access_token || null;
  }

  onAuthStateChange(callback) {
    if (!this.client) return { data: { subscription: { unsubscribe: () => {} } } };
    return this.client.auth.onAuthStateChange(callback);
  }

  continueAsGuest() {
    localStore.setItem('foco_guest', 'true');
  }

  isGuest() {
    return localStore.getItem('foco_guest') === 'true';
  }
}

export const authService = new AuthService();
