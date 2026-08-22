import { authService } from './services/auth.service.js';

export const supabase = authService.getSupabaseClient();

export async function signInWithGoogle() {
  return authService.signInWithGoogle();
}

export async function signOut() {
  return authService.signOut();
}

export async function getSession() {
  return authService.getSession();
}

export function continueAsGuest() {
  authService.continueAsGuest();
}

export function isGuest() {
  return authService.isGuest();
}
