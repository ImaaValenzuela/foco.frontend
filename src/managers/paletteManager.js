/**
 * Módulo: paletteManager
 * Centraliza la definición de las paletas de colores del tablero de FOCO
 * y la lógica para aplicarlas dinámicamente a todos los componentes de la interfaz.
 */

const CLAVE_STORAGE = 'foco-color-palette';
const EVENTO_CAMBIO = 'foco:palette-changed';

const PALETAS = {
  preestablecida: {
    id: 'preestablecida',
    nombre: 'Preestablecida',
    colorA: '#323888',
    colorB: '#f39045',
    bordeSelector: 'border-foco-blue-deep'
    // Resetea todo automáticamente al diseño original de Tailwind
  },
  bosque: {
    id: 'bosque',
    nombre: 'Bosque',

    // 1. Barra Superior (Header)
    headerFondo: '#FFFFFF',
    headerLogoFondo: '#dff8ea',
    headerTitulo: '#001207',
    headerSubtitulo: '#679683',
    headerUsuario: '#001207',
    headerBotonCerrar: '#4e0063',
    headerBotonCerrarFondo: '#eacbf9',
    headerBotonCerrarBorde: '#eacbf9',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#eefdf5',
    sidebarBoton: '#108981',
    sidebarTexto: '#092015',
    sidebarHoverFondo: '#c0f0d6',

    // 3. Lienzo Central
    lienzoFondo: '#f6f6f6',
    lienzoPatron: '',
    lienzoPatronSize: '',
    bloqueFondo: '#ffffff',
    bloqueBorde: '#e7e9e9',
    bloqueTitulo: '#092015',

    // Íconos individuales de cada bloque
    iconoObjetivosColor: '#31008c',
    iconoPersonalColor: '#5a0073',
    iconoInspiracionColor: '#ff8600',
    iconoArchivoColor: '#204a2e',
    tarjetaFondo: '#f7fffc',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#f6f6f6',
    botonToggleProdFondo: '#eefdf5',

    // Pomodoro
    pomodoroFondoBloque: '#eefdf5',
    pomodoroTituloTexto: '#092015',
    timerTexto: '#000303',
    botonesConfigProd: '#092015',
    botonIniciarPomodoro: '#108981',
    botonReiniciarPomodoro: '#ffffff',

    // Hábitos
    habitosFondoBloque: '#ffffff',
    habitosTituloTexto: '#092d25',
    calendarioFondo: '#ffffff',
    calendarioTextoDias: '#092d25',
    diaSeleccionadoFondo: '#eecefc',
    diaSeleccionadoTexto: '#090000',
    botonAgregarHabito: '#108981',
    tagHoyHabitos: '#819989',

    iconosProdBarra: '#092019',
    colorA: '#168a67',
    colorB: '#dbf9ee',
    bordeSelector: 'border-blue-800',
  },
  lavanda: {
    id: 'lavanda',
    nombre: 'Lavanda',

    // 1. Barra Superior (Header)
    headerFondo: '#f8ecfe',
    headerLogoFondo: '#e1d7e6',
    headerTitulo: '#392b4a',
    headerSubtitulo: '#7c7689',
    headerUsuario: '#474973',
    headerBotonCerrar: '#ffffff',
    headerBotonCerrarFondo: '#7b2cbf',
    headerBotonCerrarBorde: '#7b2cbf',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#474973',
    sidebarBoton: '#a69cac',
    sidebarTexto: '#ffffff',
    sidebarHoverFondo: '#5a5c7b',

    // 3. Lienzo Central
    lienzoFondo: '#f7edfb',
    lienzoPatron: 'radial-gradient(#ded0e6 1.7px, transparent 2px), radial-gradient(#a69cac 0.2px, transparent 2px)',
    lienzoPatronSize: '36px 36px, 36px 36px',
    lienzoPatronPosition: '0 0, 18px 18px',
    bloqueFondo: '#faf1fd',
    bloqueBorde: '#e4daf9',
    bloqueTitulo: '#392b4a',

    // Íconos individuales de cada bloque en Lavanda (con colores propios, no el genérico)
    iconoObjetivosColor: '#7b2cbf',
    iconoPersonalColor: '#ff8600',
    iconoInspiracionColor: '#0e9594',
    iconoArchivoColor: '#474973',
    tarjetaFondo: '#f6e3ff',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#f8ecfe',
    botonToggleProdFondo: '#e4d0ed',

    // Pomodoro
    pomodoroFondoBloque: '#f0d6fb',
    pomodoroTituloTexto: '#392b4a',
    timerTexto: '#392b4a',
    botonesConfigProd: '#474973',
    botonIniciarPomodoro: '#7b2cbf',
    botonReiniciarPomodoro: '#ffffff',

    // Hábitos
    habitosFondoBloque: '#f0d6fb',
    habitosTituloTexto: '#392b4a',
    calendarioFondo: '#fdf5ff',
    calendarioTextoDias: '#474973',
    diaSeleccionadoFondo: '#7b2cbf',
    diaSeleccionadoTexto: '#ffffff',
    botonAgregarHabito: '#7b2cbf',
    tagHoyHabitos: '#a69cac',

    iconosProdBarra: '#474973',
    colorA: '#474973',
    colorB: '#a69cac',
    bordeSelector: 'border-purple-500',
  },
  glaciar: {
    id: 'glaciar',
    nombre: 'Glaciar',

    // 1. Barra Superior (Header)
    headerFondo: '#fcfdff',
    headerLogoFondo: '#e9e8fa',
    headerTitulo: '#14213D',
    headerSubtitulo: '#597a81',
    headerUsuario: '#14213D',
    headerBotonCerrar: '#ffffff',
    headerBotonCerrarFondo: '#00398e',
    headerBotonCerrarBorde: '#00398e',
    lineaDivisoria: '#3a3a4a',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#14213D',
    sidebarBoton: '#b9d6f2',
    sidebarTexto: '#ffffff',
    sidebarHoverFondo: '#263045',

    // 3. Lienzo Central
    lienzoFondo: '#f6f7f9',
    lienzoPatron: '',
    lienzoPatronSize: '',
    bloqueFondo: '#fbfbfb',
    bloqueBorde: '#e3e3e3',
    bloqueTitulo: '#14213D',

    // Íconos individuales de cada bloque en Glaciar
    iconoObjetivosColor: '#00398e',
    iconoPersonalColor: '#197278',
    iconoInspiracionColor: '#4895ef',
    iconoArchivoColor: '#14213D',
    tarjetaFondo: '#e9e8fa',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#f0f1f2',
    botonToggleProdFondo: '#ffffff',

    // Pomodoro
    pomodoroFondoBloque: '#ffffff',
    pomodoroTituloTexto: '#14213D',
    timerTexto: '#14213D',
    botonesConfigProd: '#64748b',
    botonIniciarPomodoro: '#00398e',
    botonReiniciarPomodoro: '#ffffff',

    // Hábitos
    habitosFondoBloque: '#ffffff',
    habitosTituloTexto: '#14213D',
    calendarioFondo: '#ffffff',
    calendarioTextoDias: '#14213D',
    diaSeleccionadoFondo: '#00398e',
    diaSeleccionadoTexto: '#ffffff',
    botonAgregarHabito: '#004e97',
    tagHoyHabitos: '#52718f',

    iconosProdBarra: '#14213D',
    colorA: '#14213D',
    colorB: '#b9d6f2',
    bordeSelector: 'border-sky-500',
  },
  coral: {
    id: 'coral',
    nombre: 'Coral',

    // 1. Barra Superior (Header)
    headerFondo: '#fef7ed',
    headerLogoFondo: '#fff4e6',
    headerTitulo: '#1f2937',
    headerSubtitulo: '#6b7280',
    headerUsuario: '#1f2937',
    headerBotonCerrar: '#6b7280',
    headerBotonCerrarFondo: '#fef7ed',
    headerBotonCerrarBorde: '#bea59a',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#fce2c0',
    sidebarBoton: '#f87171',
    sidebarTexto: '#1f2937',
    sidebarHoverFondo: '#faeddc',

    // 3. Lienzo Central
    lienzoFondo: '#fef7ed',
    lienzoPatron: '',
    lienzoPatronSize: '',
    bloqueFondo: '#fef7ed',
    bloqueBorde: '#e3e3e3',
    bloqueTitulo: '#1f2937',

    // Íconos individuales de cada bloque
    iconoObjetivosColor: '#1f2937',
    iconoPersonalColor: '#1f2937',
    iconoInspiracionColor: '#1f2937',
    iconoArchivoColor: '#1f2937',
    tarjetaFondo: '#faeddc',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#fef7ed',
    botonToggleProdFondo: '#faeddc',

    // Pomodoro
    pomodoroFondoBloque: '#fce2c0',
    pomodoroTituloTexto: '#1f2937',
    timerTexto: '#1f2937',
    botonesConfigProd: '#1f2937',
    botonIniciarPomodoro: '#f87171',
    botonReiniciarPomodoro: '#fef7ed',

    // Hábitos
    habitosFondoBloque: '#fef7ed',
    habitosTituloTexto: '#14213D',
    calendarioFondo: '#fef7ed',
    calendarioTextoDias: '#14213D',
    diaSeleccionadoFondo: '#f87171',
    diaSeleccionadoTexto: '#fffefe',
    botonAgregarHabito: '#f87171',
    tagHoyHabitos: '#e3b19a',

    iconosProdBarra: '#14213D',
    colorA: '#fce2c0',
    colorB: '#f87171',
    bordeSelector: '#fad6a8',
  },
  cosmos: {
    id: 'cosmos',
    nombre: 'Cosmos (Modo Oscuro)',

    // 1. Barra Superior (Header)
    headerFondo: '#13232c',
    headerLogoFondo: '#1e2e37',
    headerTitulo: '#f9f9f9',
    headerSubtitulo: '#728f95',
    headerUsuario: '#fdfdfd',
    headerBotonCerrar: '#ffffff',
    headerBotonCerrarFondo: '#21373f',
    headerBotonCerrarBorde: '#21373f',

    // Separadores
    lineaHeader: '#182127',
    lineaSidebarIzquierda: '#13232c',
    lineaSidebarDerecha: '#13232c',
    lineaDivisoria: '#13232c',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#13232c',
    sidebarBoton: '#8f48c3',
    sidebarTexto: '#ffffff',
    sidebarHoverFondo: '#855fa0',

    // 3. Lienzo Central
    lienzoFondo: '#11151c',
    lienzoPatron: '',
    lienzoPatronSize: '',
    bloqueFondo: '#13232c',
    bloqueBorde: '#1a242a',
    bloqueTitulo: '#ffffff',

    // Texto de las tarjetas
    tarjetaTexto: '#cbd5e1',
    tarjetaPlaceholder: '#64748b',

    // Scrollbars
    scrollBarFondo: '#111827',
    scrollBarThumb: '#475569',
    scrollBarThumbHover: '#64748b',

    // Íconos individuales de cada bloque
    iconoObjetivosColor: '#ffffff',
    iconoPersonalColor: '#ffffff',
    iconoInspiracionColor: '#ffffff',
    iconoArchivoColor: '#ffffff',
    tarjetaFondo: '#21373f',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#13232c',
    botonToggleProdFondo: '#21373f',

    // Pomodoro
    pomodoroFondoBloque: '#21373f',
    pomodoroTituloTexto: '#ffffff',
    timerTexto: '#ffffff',
    botonesConfigProd: '#ffffff',
    botonIniciarPomodoro: '#8f48c3',
    botonReiniciarPomodoro: '#ffffff',

    // Hábitos
    habitosFondoBloque: '#21373f',
    habitosTituloTexto: '#ffffff',
    calendarioFondo: '#21373f',
    calendarioTextoDias: '#ffffff',
    diaSeleccionadoFondo: '#8f48c3',
    diaSeleccionadoTexto: '#ffffff',
    botonAgregarHabito: '#8f48c3',
    tagHoyHabitos: '#52718f',

    iconosProdBarra: '#ffffff',
    colorA: '#13232c',
    colorB: '#8f48c3',
    bordeSelector: '#8f48c3',
  },
  modoOscuro: {
    id: 'modoOscuro',
    nombre: 'Modo oscuro',

    // 1. Barra Superior (Header)
    headerFondo: '#13232c',
    headerLogoFondo: '#1e2e37',
    headerTitulo: '#f9f9f9',
    headerSubtitulo: '#728f95',
    headerUsuario: '#fdfdfd',
    headerBotonCerrar: '#ffffff',
    headerBotonCerrarFondo: '#21373f',
    headerBotonCerrarBorde: '#21373f',

    // Separadores
    lineaHeader: '#1e2e37',
    lineaSidebarIzquierda: '#13232c',
    lineaSidebarDerecha: '#13232c',
    lineaDivisoria: '#21373f',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#13232c',
    sidebarBoton: '#00398e',
    sidebarTexto: '#ffffff',
    sidebarHoverFondo: '#f76345',

    // 3. Lienzo Central
    lienzoFondo: '#11151c',
    lienzoPatron: '',
    lienzoPatronSize: '',
    bloqueFondo: '#13232c',
    bloqueBorde: '#1a242a',
    bloqueTitulo: '#ffffff',

    // Texto de las tarjetas
    tarjetaTexto: '#cbd5e1',
    tarjetaPlaceholder: '#64748b',

    // Scrollbars
    scrollBarFondo: '#111827',
    scrollBarThumb: '#475569',
    scrollBarThumbHover: '#64748b',

    // Íconos individuales de cada bloque
    iconoObjetivosColor: '#ffffff',
    iconoPersonalColor: '#ffffff',
    iconoInspiracionColor: '#ffffff',
    iconoArchivoColor: '#ffffff',
    tarjetaFondo: '#21373f',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#13232c',
    botonToggleProdFondo: '#f76345',

    // Pomodoro
    pomodoroFondoBloque: '#21373f',
    pomodoroTituloTexto: '#ffffff',
    timerTexto: '#ffffff',
    botonesConfigProd: '#ffffff',
    botonIniciarPomodoro: '#f55536',
    botonReiniciarPomodoro: '#ffffff',

    // Hábitos
    habitosFondoBloque: '#21373f',
    habitosTituloTexto: '#ffffff',
    calendarioFondo: '#21373f',
    calendarioTextoDias: '#ffffff',
    diaSeleccionadoFondo: '#0d3f8b',
    diaSeleccionadoTexto: '#ffffff',
    botonAgregarHabito: '#00398e',
    tagHoyHabitos: '#52718f',

    iconosProdBarra: '#ffffff',
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

export function guardarPaleta(nombrePaleta) {
  localStorage.setItem(CLAVE_STORAGE, nombrePaleta);
  window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO, { detail: nombrePaleta }));
}

export function escucharCambiosDePaleta(callback) {
  const manejador = (evento) => callback(evento.detail);
  window.addEventListener(EVENTO_CAMBIO, manejador);
  return () => window.removeEventListener(EVENTO_CAMBIO, manejador);
}

// Resetea la paleta en los 4 grandes bloques de la interfaz.
export function aplicarPaleta(nombrePaleta) {
  const paleta = (nombrePaleta && nombrePaleta !== 'preestablecida')
    ? PALETAS[nombrePaleta]
    : null;

  aplicarEnHeader(paleta);
  aplicarEnSidebarIzquierda(paleta);
  aplicarEnLienzo(paleta);
  aplicarEnProductividad(paleta);
}

// Los modales de Ajustes/Ayuda ya se pintan solos vía CSS variables + data-palette.
// Esta función queda vacía por compatibilidad, por si algo más la sigue importando.
export function aplicarPaletaEnModal(modalElement) {}

// 0. Barra Superior (Header) — migrado a CSS variables + Tailwind
function aplicarEnHeader(paleta) {
  document.documentElement.setAttribute('data-palette', paleta ? paleta.id : 'preestablecida');
}

// 1. Barra Lateral Izquierda
function aplicarEnSidebarIzquierda(paleta) {
  const sidebar = document.querySelector('foco-sidebar-actions');
  if (!sidebar) return;

  sidebar.style.backgroundColor = paleta ? paleta.sidebarFondo : '';
  sidebar.style.borderRightColor = paleta ? (paleta.lineaSidebarIzquierda || '') : '';
  sidebar.style.borderRightWidth = paleta ? '1px' : '';
  sidebar.style.borderRightStyle = paleta ? 'solid' : '';
  // Variable CSS usada por el :hover de los botones (definido en styles.css)
  sidebar.style.setProperty('--foco-sidebar-hover-bg', paleta ? (paleta.sidebarHoverFondo || paleta.sidebarBoton || '') : '');

  sidebar.querySelectorAll('.foco-sidebar-action').forEach((boton) => {
    boton.style.color = paleta ? (paleta.sidebarTexto || '#FFFFFF') : '';
  });

  const items = sidebar.querySelectorAll('.group');
  const coloresBotones = [
    paleta?.botonNotaFondo || paleta?.sidebarBoton || '',
    paleta?.botonTareaFondo || paleta?.sidebarBoton || '',
    paleta?.botonFlechaFondo || paleta?.sidebarBoton || '',
    paleta?.botonListaFondo || paleta?.sidebarBoton || ''
  ];

  items.forEach((item, index) => {
    const cajaIcono = item.querySelector('.w-12');
    if (cajaIcono) {
      cajaIcono.style.backgroundColor = paleta ? coloresBotones[index] : '';
    }

    const texto = item.querySelector('span');
    if (texto) {
      texto.style.setProperty('color', paleta ? paleta.sidebarTexto : '', 'important');
    }
  });
}

// 2. Lienzo Central — migrado a CSS variables + Tailwind
function aplicarEnLienzo(paleta) {
  // El atributo data-palette ya lo setea aplicarEnHeader() sobre <html>,
  // así que acá no hace falta hacer nada más: el CSS se encarga solo.
}

// 3. Barra Lateral Derecha (Productividad) — migrado a CSS variables + Tailwind
function aplicarEnProductividad(paleta) {
  // El atributo data-palette ya lo setea aplicarEnHeader() sobre <html>,
  // así que acá no hace falta hacer nada más: el CSS se encarga solo.
}