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
    colorA: '#22298A',
    colorB: '#FC7206',
    bordeSelector: 'border-foco-blue-deep'
    // Resetea todo automáticamente al diseño original de Tailwind
  },
  vibrante: {
    id: 'vibrante',
    nombre: 'Bosque',

    // 1. Barra Superior (Header)
    headerFondo: '#FFFFFF',
    headerLogoFondo: '#dff8ea',
    headerTitulo: '#001207',
    headerSubtitulo: '#64748b',
    headerUsuario: '#001207',
    headerBotonCerrar: '#4e0063',
    headerBotonCerrarFondo: '#eacbf9',
    headerBotonCerrarBorde: '#eacbf9',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#eefdf5',
    sidebarBoton: '#108981',
    sidebarTexto: '#092015',

    // 3. Lienzo Central
    lienzoFondo: '#f6f6f6',
    lienzoPatron: '',
    lienzoPatronSize: '',
    bloqueFondo: '#ffffff',
    bloqueBorde: '#e7e9e9',
    bloqueTitulo: '#092015',

    // Íconos individuales de cada bloque
    iconoObjetivosColor: '#31008c',
    iconoPersonalColor: '#5a0073', //'#108981',
    iconoInspiracionColor: '#ff8600',
    iconoArchivoColor: '#204a2e',
    tarjetaFondo: '#f7fffc',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#f6f6f6',
    botonToggleProdFondo: '#eefdf5', //'#eecefc',

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
    bordeSelector: 'border-blue-800'
  },
  lavanda: {
    id: 'lavanda',
    nombre: 'Lavanda',

    // 1. Barra Superior (Header)
    headerFondo: '#fdf5ff',
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

    // 3. Lienzo Central
    lienzoFondo: '#f7edfb',
    lienzoPatron: 'radial-gradient(#ded0e6 1.7px, transparent 2px), radial-gradient(#a69cac 0.2px, transparent 2px)',
    lienzoPatronSize: '36px 36px, 36px 36px',
    lienzoPatronPosition: '0 0, 18px 18px',
    bloqueFondo: '#faf1fd',
    bloqueBorde: '#e4daf9',
    bloqueTitulo: '#392b4a',

    // Íconos individuales de cada bloque en Lavanda:
    iconoObjetivosColor: '#7b2cbf',       // Violeta fuerte
    iconoPersonalColor: '#ff8600',        // Naranja cálido (diferente)
    iconoInspiracionColor: '#0e9594',     // Turquesa / jade (diferente)
    iconoArchivoColor: '#474973',         // Ciruela suave (diferente)
    tarjetaFondo: '#f6e3ff', //'#fbeeff',

    // 4. Barra Lateral Derecha (Productividad)
    productividadFondo: '#f8ecfe',//'#fdf5ff',
    botonToggleProdFondo: '#e4d0ed', //,

    // Pomodoro
    pomodoroFondoBloque: '#f0d6fb', //'#ffffff',//'#e1d7e6', //'#ede3f2',
    pomodoroTituloTexto: '#392b4a',
    timerTexto: '#392b4a',
    botonesConfigProd: '#474973',
    botonIniciarPomodoro: '#7b2cbf', //'#d5fb3e',
    botonReiniciarPomodoro: '#ffffff',

    // Hábitos
    habitosFondoBloque: '#f0d6fb',//'#ffffff',//'#e1d7e6', //'#f7edfb', //'#f7e7ff', //'#f9f8e9',
    habitosTituloTexto: '#392b4a',
    calendarioFondo: '#fdf5ff',
    calendarioTextoDias: '#474973',
    diaSeleccionadoFondo: '#7b2cbf',
    diaSeleccionadoTexto: '#ffffff',
    botonAgregarHabito: '#7b2cbf', //'#d5fb3e',
    tagHoyHabitos: '#a69cac',

    iconosProdBarra: '#474973',
    colorA: '#474973',
    colorB: '#a69cac',
    bordeSelector: 'border-purple-500'
  },
  glaciar: {
    id: 'glaciar',
    nombre: 'Glaciar',

    // 1. Barra Superior (Header)
    headerFondo: '#fcfdff',
    headerLogoFondo: '#e9e8fa', //'#b9d6f2',
    headerTitulo: '#14213D',
    headerSubtitulo: '#64748b',
    headerUsuario: '#14213D',
    headerBotonCerrar: '#ffffff',
    headerBotonCerrarFondo: '#00398e',    // Fondo azul en Cerrar Sesión
    headerBotonCerrarBorde: '#00398e',

    // 2. Barra Lateral Izquierda
    sidebarFondo: '#14213D',
    sidebarBoton: '#b9d6f2',
    sidebarTexto: '#ffffff',

    // 3. Lienzo Central
    lienzoFondo: '#f6f7f9',
    lienzoPatron: '',
    lienzoPatronSize: '',
    bloqueFondo: '#fbfbfb',
    bloqueBorde: '#e3e3e3',
    bloqueTitulo: '#14213D',

    // Íconos individuales de cada bloque en Glaciar:
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
    bordeSelector: 'border-sky-500'
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

export function aplicarPaleta(nombrePaleta) {
  const paleta = (nombrePaleta && nombrePaleta !== 'preestablecida') 
    ? PALETAS[nombrePaleta] 
    : null;

  aplicarEnHeader(paleta);
  aplicarEnSidebarIzquierda(paleta);
  aplicarEnLienzo(paleta);
  aplicarEnProductividad(paleta);
}

// 0. Barra Superior (Header)
function aplicarEnHeader(paleta) {
  const headerComponent = document.querySelector('foco-header');
  if (!headerComponent) return;

  const fondo = paleta ? paleta.headerFondo : '';
  headerComponent.style.backgroundColor = fondo;
  const headerInner = headerComponent.querySelector('header');
  if (headerInner) {
    headerInner.style.backgroundColor = fondo;
    headerInner.style.borderColor = paleta ? 'transparent' : '';
  }

  // Círculo del Logo de FOCO
  const circuloLogo = headerComponent.querySelector('.rounded-full');
  if (circuloLogo) {
    circuloLogo.style.setProperty('background-color', paleta ? (paleta.headerLogoFondo || '') : '', 'important');
  }

  // Letras "F.O.C.O."
  const h1 = headerComponent.querySelector('h1');
  if (h1) {
    h1.style.setProperty('color', paleta ? paleta.headerTitulo : '', 'important');
    const subtitulo = h1.querySelector('span');
    if (subtitulo) {
      subtitulo.style.setProperty('color', paleta ? paleta.headerSubtitulo : '', 'important');
    }
  }

 //Usuario
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
    
    // Soporte para patrón de puntos, degradado o imagen de fondo
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

  // Colores individuales para cada ícono de los bloques
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

    const dropZone = seccion.querySelector('.foco-drop-zone');
    const idBloque = dropZone ? dropZone.id : '';

    if (titulo) {
      titulo.style.setProperty('color', paleta ? paleta.bloqueTitulo : '', 'important');
    }
    if (icono) {
      // Aplica el color individual para el ícono de este bloque específico
      const colorIcono = coloresIconos[idBloque] || (paleta ? paleta.bloqueTitulo : '');
      icono.style.setProperty('stroke', colorIcono, 'important');
      icono.style.setProperty('color', colorIcono, 'important');
    }

    tarjetas.forEach((tarjeta) => {
      tarjeta.style.backgroundColor = paleta ? paleta.tarjetaFondo : '';
    });
  });
}

// 3. Barra Lateral Derecha (Productividad y Modal de Configuración)
function aplicarEnProductividad(paleta) {
  const sidebarDerecha = document.querySelector('foco-productivity-sidebar');
  if (!sidebarDerecha) return;

  sidebarDerecha.style.backgroundColor = paleta ? (paleta.productividadFondo || '#FFFFFF') : '';
  const headerSidebar = sidebarDerecha.querySelector('.h-14');
  if (headerSidebar) {
    headerSidebar.style.backgroundColor = paleta ? (paleta.productividadFondo || '#FFFFFF') : '';
    headerSidebar.style.borderColor = paleta ? 'transparent' : '';
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

  // Íconos barra cerrada
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

  // Título Hábitos Diarios
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

  // MODAL DE CONFIGURACIÓN DE TIEMPOS (#config-overlay):
  // Le quita el naranja al botón "Guardar" y adapta el cuadro al tema
  const modalConfig = sidebarDerecha.querySelector('#config-overlay') || document.querySelector('#config-overlay');
  if (modalConfig) {
    const cajaModal = modalConfig.querySelector('.bg-white, [class*="rounded-2xl"]');
    if (cajaModal) {
      cajaModal.style.setProperty('background-color', paleta ? (paleta.pomodoroFondoBloque || '#ffffff') : '', 'important');
    }

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