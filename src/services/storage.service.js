/**
 * Service: StorageService
 * Proporciona una capa de abstracción sobre localStorage y sessionStorage.
 * Aplica el principio de Inversión de Dependencias (DIP) aislando la API global del navegador.
 */

export class StorageService {
  constructor(storageEngine = localStorage) {
    this.engine = storageEngine;
  }

  getItem(key) {
    try {
      const value = this.engine.getItem(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (e) {
      console.error(`Error leyendo clave "${key}" de Storage:`, e);
      return null;
    }
  }

  setItem(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      this.engine.setItem(key, serialized);
    } catch (e) {
      console.error(`Error guardando clave "${key}" en Storage:`, e);
    }
  }

  removeItem(key) {
    try {
      this.engine.removeItem(key);
    } catch (e) {
      console.error(`Error removiendo clave "${key}" de Storage:`, e);
    }
  }

  clear() {
    try {
      this.engine.clear();
    } catch (e) {
      console.error('Error limpiando Storage:', e);
    }
  }
}

export const localStore = new StorageService(typeof window !== 'undefined' ? window.localStorage : null);
export const sessionStore = new StorageService(typeof window !== 'undefined' ? window.sessionStorage : null);
