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
  window.addEventListener(EVENTO_CAMBIO, (evento) => callback(evento.detail));
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

export function aplicarPaletaEnModal(modalElement) {
  const nombrePaleta = obtenerPaletaActual();
  if (nombrePaleta === 'preestablecida') return;

  const paleta = PALETAS[nombrePaleta];
  if (!paleta) return;

  const caja = modalElement.querySelector('section');
  const titulo = modalElement.querySelector('h2');
  const botonCerrarX = modalElement.querySelector('[data-close].text-2xl');
  const botonListo = modalElement.querySelector('.mt-6 button');

  const colorTextoModal = paleta.pomodoroTituloTexto || paleta.bloqueTitulo || '#ffffff';

  if (caja) caja.style.setProperty('background-color', paleta.bloqueFondo || paleta.productividadFondo || '#ffffff', 'important');
  if (titulo) titulo.style.setProperty('color', paleta.headerTitulo || paleta.bloqueTitulo || '', 'important');
  if (botonCerrarX) botonCerrarX.style.setProperty('color', colorTextoModal, 'important');

  if (caja) {
    caja.querySelectorAll('p, label, strong, span').forEach((elemento) => {
      elemento.style.setProperty('color', colorTextoModal, 'important');
    });
  }

  if (botonListo) {
    botonListo.style.setProperty('background-color', paleta.botonIniciarPomodoro || paleta.colorA || '', 'important');
    botonListo.style.setProperty('color', '#FFFFFF', 'important');
  }
}

// 0. Barra Superior (Header)
function aplicarEnHeader(paleta) {
  const headerComponent = document.querySelector('foco-header');
  if (!headerComponent) return;

  const fondo = paleta ? paleta.headerFondo : '';
  headerComponent.style.backgroundColor = fondo;
  headerComponent.style.borderBottomColor = paleta ? (paleta.lineaHeader || '') : '';
  headerComponent.style.borderBottomWidth = paleta ? '1px' : '';
  headerComponent.style.borderBottomStyle = paleta ? 'solid' : '';

  const headerInner = headerComponent.querySelector('header');
  if (headerInner) {
    headerInner.style.backgroundColor = fondo;
    headerInner.style.borderBottomColor = paleta ? (paleta.lineaHeader || 'transparent') : '';
    headerInner.style.borderBottomWidth = paleta ? '1px' : '';
    headerInner.style.borderBottomStyle = paleta ? 'solid' : '';
  }

  // Circulo del logo de FOCO
  const circuloLogo = headerComponent.querySelector('.rounded-full');
  if (circuloLogo) {
    circuloLogo.style.setProperty('background-color', paleta ? (paleta.headerLogoFondo || '') : '', 'important');
  }

  // Letras FOCO
  const h1 = headerComponent.querySelector('h1');
  if (h1) {
    h1.style.setProperty('color', paleta ? paleta.headerTitulo : '', 'important');
    const subtitulo = h1.querySelector('span');
    if (subtitulo) {
      subtitulo.style.setProperty('color', paleta ? paleta.headerSubtitulo : '', 'important');
    }
  }

  // Usuario
  const nombreUsuario = headerComponent.querySelector('[data-auth-name]');
  if (nombreUsuario) {
    nombreUsuario.style.setProperty('color', paleta ? paleta.headerUsuario : '', 'important');
  }

  // Botón "Cerrar sesión" (Fondo, Texto y Borde)
  const botonSesion = headerComponent.querySelector('[data-google-action]');
  if (botonSesion) {
    const colorTexto = paleta ? (paleta.headerBotonCerrar || '') : '';
    const colorFondo = paleta ? (paleta.headerBotonCerrarFondo || '') : '';
    const colorBorde = paleta ? (paleta.headerBotonCerrarBorde || colorTexto || '') : '';

    botonSesion.style.setProperty('color', colorTexto, 'important');
    botonSesion.style.setProperty('background-color', colorFondo, 'important');
    botonSesion.style.setProperty('border-color', colorBorde, 'important');
  }
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

// 2. Lienzo Central (Fondos, Patrones e Íconos Individuales)
function aplicarEnLienzo(paleta) {
  const lienzo = document.querySelector('foco-lienzo-canvas');
  if (lienzo) {
    lienzo.style.backgroundColor = paleta ? (paleta.lienzoFondo || '') : '';

    if (paleta && paleta.lienzoPatron) {
      lienzo.style.backgroundImage = paleta.lienzoPatron;
      lienzo.style.backgroundSize = paleta.lienzoPatronSize || 'auto';
      lienzo.style.backgroundPosition = paleta.lienzoPatronPosition || '0 0';
    } else {
      lienzo.style.backgroundImage = '';
      lienzo.style.backgroundSize = '';
      lienzo.style.backgroundPosition = '';
    }
  }

  const coloresIconos = {
    'bloque-objetivos-activos': paleta?.iconoObjetivosColor || paleta?.bloqueIconoColor || paleta?.bloqueTitulo || '',
    'bloque-personal': paleta?.iconoPersonalColor || paleta?.bloqueIconoColor || paleta?.bloqueTitulo || '',
    'bloque-inspiracion': paleta?.iconoInspiracionColor || paleta?.bloqueIconoColor || paleta?.bloqueTitulo || '',
    'bloque-archivo-vida': paleta?.iconoArchivoColor || paleta?.bloqueIconoColor || paleta?.bloqueTitulo || ''
  };

  document.querySelectorAll('foco-lienzo-canvas section').forEach((seccion) => {
    const titulo = seccion.querySelector('h2');
    const icono = seccion.querySelector('svg');
    const tarjetas = seccion.querySelectorAll('.foco-tarjeta');

    seccion.style.backgroundColor = paleta ? paleta.bloqueFondo : '';
    seccion.style.borderColor = paleta ? paleta.bloqueBorde : '';

    const divisorTitulo = seccion.querySelector('.border-b.border-slate-100');
    if (divisorTitulo) {
      divisorTitulo.style.setProperty('border-color', paleta ? (paleta.lineaDivisoria || '') : '', 'important');
    }

    const dropZone = seccion.querySelector('.foco-drop-zone');
    const idBloque = dropZone ? dropZone.id : '';

    if (titulo) {
      titulo.style.setProperty('color', paleta ? paleta.bloqueTitulo : '', 'important');
    }
    if (icono) {
      const colorIcono = coloresIconos[idBloque] || (paleta ? paleta.bloqueTitulo : '');
      icono.style.setProperty('stroke', colorIcono, 'important');
      icono.style.setProperty('color', colorIcono, 'important');
    }

    tarjetas.forEach((tarjeta) => {
      tarjeta.style.setProperty('background-color', paleta ? paleta.tarjetaFondo : '', 'important');
      tarjeta.querySelectorAll('input, textarea, span, p, div').forEach((elemento) => {
        elemento.style.setProperty('color', paleta ? (paleta.tarjetaTexto || paleta.bloqueTitulo || '') : '', 'important');
      });
    });
  });
}

// 3. Barra Lateral Derecha (Productividad y Modal de Configuración del Pomodoro)
function aplicarEnProductividad(paleta) {
  const sidebarDerecha = document.querySelector('foco-productivity-sidebar');
  if (!sidebarDerecha) return;

  sidebarDerecha.style.backgroundColor = paleta ? (paleta.productividadFondo || '#FFFFFF') : '';
  sidebarDerecha.style.borderLeftColor = paleta ? (paleta.lineaSidebarDerecha || '') : '';
  sidebarDerecha.style.borderLeftWidth = paleta ? '1px' : '';
  sidebarDerecha.style.borderLeftStyle = paleta ? 'solid' : '';

  const headerSidebar = sidebarDerecha.querySelector('.h-14');
  if (headerSidebar) {
    headerSidebar.style.backgroundColor = paleta ? (paleta.productividadFondo || '#FFFFFF') : '';
    headerSidebar.style.setProperty('border-color', paleta ? (paleta.lineaDivisoria || 'transparent') : '', 'important');
  }

  // Botón de abrir/cerrar (#toggle-sidebar)
  const btnToggle = sidebarDerecha.querySelector('#toggle-sidebar');
  if (btnToggle) {
    btnToggle.style.setProperty('background-color', paleta ? (paleta.botonToggleProdFondo || '') : '', 'important');
    btnToggle.style.setProperty('color', paleta ? paleta.iconosProdBarra : '', 'important');
    const svgToggle = btnToggle.querySelector('svg');
    if (svgToggle) {
      svgToggle.style.setProperty('stroke', paleta ? paleta.iconosProdBarra : '', 'important');
    }
  }

  // Íconos barra cerrada (Pomodoro/Hábitos colapsados)
  sidebarDerecha.querySelectorAll('#quick-pomodoro, #quick-habits').forEach((item) => {
    const color = paleta ? paleta.iconosProdBarra : '';
    item.style.color = color;
    const svg = item.querySelector('svg');
    if (svg) svg.style.stroke = color;
    const txt = item.querySelector('span');
    if (txt) txt.style.color = color;
  });

  // Fondos tarjetas Pomodoro y Hábitos
  const tarjetaPomodoro = sidebarDerecha.querySelector('#pomodoro-container');
  if (tarjetaPomodoro) {
    tarjetaPomodoro.style.setProperty('background-color', paleta ? (paleta.pomodoroFondoBloque || '') : '', 'important');
    tarjetaPomodoro.style.borderColor = paleta ? (paleta.bloqueBorde || '') : '';
  }

  const tarjetas = sidebarDerecha.querySelectorAll('.flex-1 > div');
  tarjetas.forEach((caja) => {
    if (caja.id !== 'pomodoro-container') {
      caja.style.setProperty('background-color', paleta ? (paleta.habitosFondoBloque || '') : '', 'important');
      caja.style.borderColor = paleta ? (paleta.bloqueBorde || '') : '';
    }
  });

  // Título Pomodoro
  const headerPomodoro = sidebarDerecha.querySelector('#pomodoro-header');
  if (headerPomodoro) {
    headerPomodoro.style.setProperty('border-color', paleta ? (paleta.lineaDivisoria || '') : '', 'important');

    headerPomodoro.querySelectorAll('span, h1, h2, h3, h4, p').forEach((el) => {
      if (!el.closest('#open-config') && !el.closest('#expand-pomodoro')) {
        el.style.setProperty('color', paleta ? paleta.pomodoroTituloTexto : '', 'important');
      }
    });
    headerPomodoro.querySelectorAll('svg').forEach((svg) => {
      if (!svg.closest('#open-config') && !svg.closest('#expand-pomodoro')) {
        svg.style.setProperty('stroke', paleta ? paleta.pomodoroTituloTexto : '', 'important');
      }
    });
  }

  const divisorHabitos = sidebarDerecha.querySelector('.border-b.border-slate-100:not(#pomodoro-header)');
  if (divisorHabitos) {
    divisorHabitos.style.setProperty('border-color', paleta ? (paleta.lineaDivisoria || '') : '', 'important');
  }

  // Botones Configurar y Expandir
  const btnConfig = sidebarDerecha.querySelector('#open-config');
  if (btnConfig) {
    btnConfig.style.setProperty('color', paleta ? paleta.botonesConfigProd : '', 'important');
  }
  const btnExpand = sidebarDerecha.querySelector('#expand-pomodoro');
  if (btnExpand) {
    btnExpand.style.setProperty('color', paleta ? paleta.botonesConfigProd : '', 'important');
    btnExpand.querySelectorAll('svg').forEach((svg) => {
      svg.style.setProperty('stroke', paleta ? paleta.botonesConfigProd : '', 'important');
    });
  }

  // Título "Hábitos diarios" (se busca por texto, no por id, ya que el elemento no tiene uno propio)
  sidebarDerecha.querySelectorAll('span, h1, h2, h3, h4, p, div').forEach((el) => {
    const textoLimpio = el.textContent
      ? el.textContent.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
      : '';

    if (textoLimpio === 'HABITOS DIARIOS' && el.children.length === 0) {
      el.style.setProperty('color', paleta ? paleta.habitosTituloTexto : '', 'important');
      const headerFila = el.closest('div');
      const iconoCalendario = headerFila?.querySelector('svg');
      if (iconoCalendario && !iconoCalendario.closest('button')) {
        iconoCalendario.style.setProperty('stroke', paleta ? paleta.habitosTituloTexto : '', 'important');
      }
    }
  });

  // Nombres de cada hábito individual (se crean dinámicamente al agregar un hábito nuevo)
  sidebarDerecha.querySelectorAll('.habit-row span').forEach((span) => {
    span.style.setProperty('color', paleta ? (paleta.habitosTituloTexto || '') : '', 'important');
  });

  // Reloj y temporizador
  const displayReloj = sidebarDerecha.querySelector('#pomodoro-display');
  if (displayReloj) displayReloj.style.setProperty('color', paleta ? paleta.timerTexto : '', 'important');
  const statusReloj = sidebarDerecha.querySelector('#pomodoro-status');
  if (statusReloj) statusReloj.style.setProperty('color', paleta ? paleta.timerTexto : '', 'important');
  const cycleReloj = sidebarDerecha.querySelector('#pomodoro-cycle');
  if (cycleReloj) cycleReloj.style.setProperty('color', paleta ? paleta.timerTexto : '', 'important');

  // Calendario semanal
  const primerBotonDia = sidebarDerecha.querySelector('.day-selector-btn');
  const contenedorCalendario = primerBotonDia?.parentElement;
  if (contenedorCalendario) {
    contenedorCalendario.style.setProperty('background-color', paleta ? (paleta.calendarioFondo || '') : '', 'important');
  }

  sidebarDerecha.querySelectorAll('.day-selector-btn').forEach((btn) => {
    const esSeleccionado = btn.classList.contains('bg-foco-orange-accent') ||
                           btn.classList.contains('font-bold');

    if (!esSeleccionado) {
      const colorTexto = paleta ? (paleta.calendarioTextoDias || '') : '';
      btn.querySelectorAll('span').forEach((span) => {
        span.style.setProperty('color', colorTexto, 'important');
      });
    }
  });

  const diaSeleccionado = sidebarDerecha.querySelector('.day-selector-btn.bg-foco-orange-accent, .day-selector-btn[class*="orange"]');
  if (diaSeleccionado) {
    const fondoDia = paleta ? (paleta.diaSeleccionadoFondo || '') : '';
    const textoDia = paleta ? (paleta.diaSeleccionadoTexto || '#FFFFFF') : '';
    diaSeleccionado.style.setProperty('background-color', fondoDia, 'important');
    diaSeleccionado.querySelectorAll('span').forEach((span) => {
      span.style.setProperty('color', textoDia, 'important');
    });
  }

  // Botón Iniciar Pomodoro
  const botonIniciar = sidebarDerecha.querySelector('#start-pomodoro');
  if (botonIniciar) {
    const colorIniciar = paleta ? (paleta.botonIniciarPomodoro || '') : '';
    botonIniciar.style.setProperty('background-color', colorIniciar, 'important');
    botonIniciar.style.color = paleta ? '#FFFFFF' : '';
  }

  // Botón Reiniciar Pomodoro
  const botonReiniciar = sidebarDerecha.querySelector('#reset-pomodoro');
  if (botonReiniciar && paleta && paleta.botonReiniciarPomodoro) {
    botonReiniciar.style.backgroundColor = paleta.botonReiniciarPomodoro;
  }

  // Botón "+" para añadir hábito
  const botonAgregarHabito = sidebarDerecha.querySelector('#add-habit-btn');
  if (botonAgregarHabito) {
    const colorAgregar = paleta ? (paleta.botonAgregarHabito || '') : '';
    botonAgregarHabito.style.setProperty('background-color', colorAgregar, 'important');
    botonAgregarHabito.style.color = paleta ? '#FFFFFF' : '';
  }

  // Tag "Hoy"
  sidebarDerecha.querySelectorAll('span').forEach((span) => {
    if (span.textContent.trim() === 'Hoy' && !span.closest('.day-selector-btn')) {
      const colorTag = paleta ? (paleta.tagHoyHabitos || '') : '';
      span.style.setProperty('background-color', colorTag, 'important');
      span.style.color = paleta ? '#FFFFFF' : '';
      span.style.borderColor = colorTag;
    }
  });

  const modalConfig = sidebarDerecha.querySelector('#config-overlay') || document.querySelector('#config-overlay');
  if (modalConfig) {
    const cajaModal = modalConfig.querySelector('.bg-white, [class*="rounded-2xl"]');
    if (cajaModal) {
      cajaModal.style.setProperty('background-color', paleta ? (paleta.pomodoroFondoBloque || '#ffffff') : '', 'important');
    }

    const colorTextoModal = paleta ? (paleta.pomodoroTituloTexto || paleta.bloqueTitulo || '') : '';

    const tituloModal = modalConfig.querySelector('h3');
    if (tituloModal) tituloModal.style.setProperty('color', colorTextoModal, 'important');

    const btnCerrarModal = modalConfig.querySelector('#close-config');
    if (btnCerrarModal) btnCerrarModal.style.setProperty('color', colorTextoModal, 'important');

    modalConfig.querySelectorAll('label').forEach((etiqueta) => {
      etiqueta.style.setProperty('color', colorTextoModal, 'important');
    });

    modalConfig.querySelectorAll('input').forEach((input) => {
      input.style.setProperty('color', paleta ? '#000000' : '', 'important');
      input.style.setProperty('background-color', paleta ? '#ffffff' : '', 'important');
    });

    const btnCancelarModal = modalConfig.querySelector('#cancel-config');
    if (btnCancelarModal) btnCancelarModal.style.setProperty('color', colorTextoModal, 'important');

    const btnGuardarConfig = modalConfig.querySelector('#save-config');
    if (btnGuardarConfig) {
      let colorGuardar = '';
      if (paleta && paleta.id === 'lavanda') {
        colorGuardar = paleta.headerBotonCerrarFondo || paleta.colorB || '';
      } else {
        colorGuardar = paleta ? (paleta.botonIniciarPomodoro || paleta.colorB || '') : '';
      }
      btnGuardarConfig.style.setProperty('background-color', colorGuardar, 'important');
      btnGuardarConfig.style.color = paleta ? '#FFFFFF' : '';
    }
  }
}