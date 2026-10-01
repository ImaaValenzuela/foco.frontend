import { authService } from './services/auth.service.js';

export const supabase = authService.getSupabaseClient();

export async function signInWithGoogle() {
  return authService.signInWithGoogle();
}

export async function signInWithPassword(email, password) {
  return authService.signInWithPassword(email, password);
}

export async function signUp(email, password, name) {
  return authService.signUp(email, password, name);
}

export async function signOut() {
  return authService.signOut();
}

export async function getSession() {
  return authService.getSession();
}

export async function getToken() {
  return authService.getToken();
}

export function continueAsGuest() {
  authService.continueAsGuest();
}

export function isGuest() {
  return authService.isGuest();
}

export { authService };
