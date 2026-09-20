/**
 * Módulo: paletteManager
 * Centraliza la definición de las paletas de colores del tablero de FOCO.
 * Los colores se aplican vía CSS: setea data-palette en <html> y las variables
 * de styles.css hacen el trabajo junto con Tailwind.
 * 
 * Persistencia:
 * 1. Base de datos (Supabase Auth, perfil de usuario en la nube).
 * 2. LocalStorage (fallback inmediato).
 */

import { supabase, getSession } from '../auth.js';

const CLAVE_STORAGE = 'foco-color-palette';
const EVENTO_CAMBIO = 'foco:palette-changed';

const PALETAS = {
  preestablecida: {
    id: 'preestablecida',
    nombre: 'Preestablecida',
    colorA: '#323888',
    colorB: '#f39045',
  },
  bosque: {
    id: 'bosque',
    nombre: 'Bosque',
    colorA: '#168a67',
    colorB: '#dbf9ee',
  },
  lavanda: {
    id: 'lavanda',
    nombre: 'Lavanda',
    colorA: '#474973',
    colorB: '#a69cac',
  },
  glaciar: {
    id: 'glaciar',
    nombre: 'Glaciar',
    colorA: '#14213D',
    colorB: '#b9d6f2',
  },
  coral: {
    id: 'coral',
    nombre: 'Coral',
    colorA: '#fce2c0',
    colorB: '#f87171',
  },
  cosmos: {
    id: 'cosmos',
    nombre: 'Cosmos (Modo Oscuro)',
    colorA: '#13232c',
    colorB: '#8f48c3',
  },
  modoOscuro: {
    id: 'modoOscuro',
    nombre: 'Modo oscuro',
    colorA: '#13232c',
    colorB: '#00398e',
  }
};

export function obtenerPaletas() {
  return PALETAS;
}

export function obtenerPaletaActual() {
  return localStorage.getItem(CLAVE_STORAGE) || 'preestablecida';
}

/*Guarda la paleta elegida*/
export async function guardarPaleta(nombrePaleta) {
  // 1. Fallback local
  localStorage.setItem(CLAVE_STORAGE, nombrePaleta);
  window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: nombrePaleta }));
  
  // 2. Persistencia en la nube
  try {
    if (supabase) {
      const session = await getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { color_palette: nombrePaleta }
        });
      }
    }
  } catch (error) {
    console.warn('No se pudo guardar la paleta en la base de datos, usando localStorage como fallback:', error);
  }
}

export function escucharCambiosDePaleta(callback) {
  const manejador = (evento) => callback(evento.detail);
  window.addEventListener(EVENTO_CAMBIO, manejador);
  return () => window.removeEventListener(EVENTO_CAMBIO, manejador);
}

// Setea el atributo data-palette en <html> para que styles.css aplique las variables
export function aplicarPaleta(nombrePaleta) {
  const paleta = (nombrePaleta && nombrePaleta !== 'preestablecida')
    ? PALETAS[nombrePaleta]
    : null;

  document.documentElement.setAttribute('data-palette', paleta ? paleta.id : 'preestablecida');
}

/**
 * Sincroniza la paleta al cargar la app
 * Aplica localStorage de inmediato. Si hay sesión en Supabase con paleta guardada en la BD, la sincroniza.
 */
export async function inicializarPaleta() {
  // Carga inmediata desde LocalStorage
  const paletaLocal = obtenerPaletaActual();
  aplicarPaleta(paletaLocal);

  // Sincronización con base de datos
  try {
    if (!supabase) return;
    const session = await getSession();
    const paletaRemota = session?.user?.user_metadata?.color_palette;

    if (paletaRemota && paletaRemota !== paletaLocal && PALETAS[paletaRemota]) {
      localStorage.setItem(CLAVE_STORAGE, paletaRemota);
      aplicarPaleta(paletaRemota);
      window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: paletaRemota }));
    }

    supabase.auth.onAuthStateChange(async (_event, nuevaSesion) => {
      const paletaUsuario = nuevaSesion?.user?.user_metadata?.color_palette;
      if (paletaUsuario && PALETAS[paletaUsuario]) {
        localStorage.setItem(CLAVE_STORAGE, paletaUsuario);
        aplicarPaleta(paletaUsuario);
        window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: paletaUsuario }));
      }
    });
  } catch (err) {
    console.warn('Error al sincronizar paleta con Supabase:', err);
  }
}

inicializarPaleta();