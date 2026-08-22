/**
 * Service: AuthService
 * Encapsula las operaciones de autenticación con Supabase y estado de invitado.
 * Cumple con DIP al desacoplar los componentes de la instancia concreta de Supabase y de localStorage.
 */

import { createClient } from '@supabase/supabase-js';
import { localStore } from './storage.service.js';

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
      options: { redirectTo: window.location.origin },
    });
  }

  async signOut() {
    if (!this.client) return;
    return this.client.auth.signOut();
  }

  async getSession() {
    if (!this.client) return null;
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  onAuthStateChange(callback) {
    if (!this.client) return { unsubscribe: () => {} };
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
