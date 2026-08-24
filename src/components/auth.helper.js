/**
 * F.O.C.O. - Módulo de Autenticación y Validación de Clientes
 * Centraliza las reglas de negocio de la Épica 1 (Autenticación e Inducción)
 */
import { sessionStore } from '../services/storage.service.js';
import { validators } from '../utils/validators.js';
import { showToastAlert, closeToastAlert } from './ui/toast.js';
import { supabase } from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de escuchadores en tiempo real
  initAuthEventListeners();
});

// Cache global de elementos activos para evitar consultas repetitivas al DOM
const authDOM = {
  // Formularios / Vistas
  views: {
    login: 'view-login',
    register: 'view-register',
    recover: 'view-recover'
  },
  // Inputs Login
  login: {
    email: 'login-email',
    password: 'login-password',
    btnContainer: 'btn-login-container',
    form: 'login-form'
  },
  // Inputs Registro
  register: {
    name: 'reg-name',
    email: 'reg-email',
    password: 'reg-password',
    confirmPassword: 'reg-confirm-password',
    btnContainer: 'btn-register-container',
    form: 'register-form'
  },
  // Inputs Recuperación
  recover: {
    email: 'recover-email',
    btnContainer: 'btn-recover-container',
    form: 'recover-form'
  },
  // Toast de error global
  toast: {
    container: 'error-toast',
    title: 'toast-title',
    message: 'toast-message'
  }
};

/**
 * 1. CONTROL DE INTERCAMBIO DE VISTAS (SPA-like)
 * Cambia dinámicamente entre Login, Registro y Recuperación de contraseña sin recargar página
 */
function switchView(viewTarget) {
  // Ocultar todas las secciones de formulario
  Object.values(authDOM.views).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Mostrar sección objetivo
  const activeEl = document.getElementById(viewTarget);
  if (activeEl) {
    activeEl.classList.remove('hidden');
    // Reiniciar los campos y estados de error al cambiar de vista
    resetErrors();
  }

  // Actualizar clases de los botones superiores tipo pestaña (Tabs)
  const tabLogin = document.getElementById('tab-login-btn');
  const tabRegister = document.getElementById('tab-register-btn');

  if (viewTarget === authDOM.views.login) {
    tabLogin?.classList.add('bg-foco-blue-deep', 'text-white', 'shadow');
    tabLogin?.classList.remove('text-slate-500', 'hover:text-foco-blue-deep');
    tabRegister?.classList.remove('bg-foco-blue-deep', 'text-white', 'shadow');
    tabRegister?.classList.add('text-slate-500', 'hover:text-foco-blue-deep');
  } else if (viewTarget === authDOM.views.register) {
    tabRegister?.classList.add('bg-foco-blue-deep', 'text-white', 'shadow');
    tabRegister?.classList.remove('text-slate-500', 'hover:text-foco-blue-deep');
    tabLogin?.classList.remove('bg-foco-blue-deep', 'text-white', 'shadow');
    tabLogin?.classList.add('text-slate-500', 'hover:text-foco-blue-deep');
  }
}

/**
 * 2. FUNCIONES DE VALIDACIÓN PURAS (Importadas desde validators.js)
 */


/**
 * 3. VALIDACIÓN DE CAMPOS INDIVIDUALES (ONBLUR)
 * Muestra el error sutil debajo del input si el dato es incorrecto al salir del foco
 */
function validateFieldOnBlur(fieldId, errorId, validatorType, compareWithId = null) {
  const input = document.getElementById(fieldId);
  const errorMsg = document.getElementById(errorId);
  if (!input || !errorMsg) return;

  const value = input.value;
  let isValid = true;

  // Evitar alertar error si el campo está vacío al salir del foco (UX limpia)
  if (value === '') {
    errorMsg.classList.add('hidden');
    input.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
    return;
  }

  // Ejecutar validador correspondiente
  if (validatorType === 'email') isValid = validators.isEmail(value);
  if (validatorType === 'name') isValid = validators.isName(value);
  if (validatorType === 'password') isValid = validators.isPassword(value);
  if (validatorType === 'confirm') {
    const original = document.getElementById(compareWithId);
    isValid = original && value === original.value;
  }

  // Actualizar UI
  if (!isValid) {
    errorMsg.classList.remove('hidden');
    input.classList.add('border-red-400', 'ring-2', 'ring-red-100');
  } else {
    errorMsg.classList.add('hidden');
    input.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
  }
}

/**
 * 4. MONITOREO EN TIEMPO REAL (ONINPUT)
 * Controla la visualización del botón de envío únicamente al completar todos los datos requeridos
 */
function checkFormCompleteness(formType) {
  let isComplete = false;

  if (formType === 'login') {
    const email = document.getElementById(authDOM.login.email).value.trim();
    const password = document.getElementById(authDOM.login.password).value;
    const btnContainer = document.getElementById(authDOM.login.btnContainer);

    isComplete = email !== '' && password !== '';
    toggleButtonContainer(btnContainer, isComplete);
  }

  else if (formType === 'register') {
    const name = document.getElementById(authDOM.register.name).value.trim();
    const email = document.getElementById(authDOM.register.email).value.trim();
    const password = document.getElementById(authDOM.register.password).value;
    const confirm = document.getElementById(authDOM.register.confirmPassword).value;
    const btnContainer = document.getElementById(authDOM.register.btnContainer);

    isComplete = name !== '' && email !== '' && password !== '' && confirm !== '';
    toggleButtonContainer(btnContainer, isComplete);
  }

  else if (formType === 'recover') {
    const email = document.getElementById(authDOM.recover.email).value.trim();
    const btnContainer = document.getElementById(authDOM.recover.btnContainer);

    isComplete = email !== '';
    toggleButtonContainer(btnContainer, isComplete);
  }
}

/**
 * Cambia los estilos de visibilidad con animaciones Tailwind fluidas (scale, opacity)
 */
function toggleButtonContainer(container, show) {
  if (!container) return;

  if (show) {
    container.classList.remove('opacity-0', 'pointer-events-none', 'scale-90', 'h-0', 'overflow-hidden');
    container.classList.add('opacity-100', 'scale-100', 'mt-4');
  } else {
    container.classList.add('opacity-0', 'pointer-events-none', 'scale-90', 'h-0', 'overflow-hidden');
    container.classList.remove('opacity-100', 'scale-100', 'mt-4');
  }
}

/**
 * 5. CONTROLADOR GLOBAL DEL TOAST DE ERROR (Importado desde ui/toast.js)
 */


/**
 * 6. LISTENERS E INTEGRACIÓN DE SUBMITS (Simulado con lógica de negocio)
 */
function initAuthEventListeners() {
  // Login Inputs
  const logEmail = document.getElementById(authDOM.login.email);
  const logPass = document.getElementById(authDOM.login.password);
  logEmail?.addEventListener('input', () => checkFormCompleteness('login'));
  logPass?.addEventListener('input', () => checkFormCompleteness('login'));
  logEmail?.addEventListener('blur', () => validateFieldOnBlur(authDOM.login.email, 'error-login-email', 'email'));
  logPass?.addEventListener('blur', () => validateFieldOnBlur(authDOM.login.password, 'error-login-password', 'password'));

  // Register Inputs
  const regName = document.getElementById(authDOM.register.name);
  const regEmail = document.getElementById(authDOM.register.email);
  const regPass = document.getElementById(authDOM.register.password);
  const regConf = document.getElementById(authDOM.register.confirmPassword);

  regName?.addEventListener('input', () => checkFormCompleteness('register'));
  regEmail?.addEventListener('input', () => checkFormCompleteness('register'));
  regPass?.addEventListener('input', () => checkFormCompleteness('register'));
  regConf?.addEventListener('input', () => checkFormCompleteness('register'));

  regName?.addEventListener('blur', () => validateFieldOnBlur(authDOM.register.name, 'error-reg-name', 'name'));
  regEmail?.addEventListener('blur', () => validateFieldOnBlur(authDOM.register.email, 'error-reg-email', 'email'));
  regPass?.addEventListener('blur', () => validateFieldOnBlur(authDOM.register.password, 'error-reg-password', 'password'));
  regConf?.addEventListener('blur', () => validateFieldOnBlur(authDOM.register.confirmPassword, 'error-reg-confirm', 'confirm', authDOM.register.password));

  // Recover Inputs
  const recEmail = document.getElementById(authDOM.recover.email);
  recEmail?.addEventListener('input', () => checkFormCompleteness('recover'));
  recEmail?.addEventListener('blur', () => validateFieldOnBlur(authDOM.recover.email, 'error-recover-email', 'email'));
}

/**
 * 7. PROCESO DE REGISTRO E INGRESO (SUBMIT DE FORMULARIOS)
 */
function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById(authDOM.login.email).value.trim();
  const password = document.getElementById(authDOM.login.password).value;

  // Doble chequeo de seguridad
  if (!validators.isEmail(email)) {
    showToastAlert("Error de validación", "El formato del correo electrónico ingresado no es válido.");
    return;
  }
  if (!validators.isPassword(password)) {
    showToastAlert("Error de contraseña", "La contraseña debe tener un mínimo de 6 caracteres.");
    return;
  }

  // Simulación de credenciales de error predefinidas
  if (email === 'error@foco.com') {
    showToastAlert("Error de Autenticación", "Las credenciales son incorrectas o la cuenta no ha sido activada aún.");
    return;
  }

  // Guardar sesión e ingresar directamente al Onboarding
  sessionStore.setItem('foco_session_active', 'true');
  sessionStore.setItem('foco_user_email', email);

  // Animación de botón de éxito en la interfaz
  const container = document.getElementById(authDOM.login.btnContainer);
  if (container) {
    container.innerHTML = `
      <div class="w-full py-3.5 bg-green-600 text-white text-sm font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse">
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Validando ingreso... ¡Bienvenido!
      </div>
    `;
  }

  setTimeout(() => {
    window.location.href = 'onboarding.html';
  }, 1200);
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  const name = document.getElementById(authDOM.register.name).value.trim();
  const email = document.getElementById(authDOM.register.email).value.trim();
  const password = document.getElementById(authDOM.register.password).value;
  const confirm = document.getElementById(authDOM.register.confirmPassword).value;

  if (!validators.isName(name)) {
    showToastAlert("Error de Registro", "Por favor ingresa tu nombre completo (mínimo 3 caracteres).");
    return;
  }
  if (!validators.isEmail(email)) {
    showToastAlert("Error de Registro", "El formato del correo electrónico ingresado no es válido.");
    return;
  }
  if (!validators.isPassword(password)) {
    showToastAlert("Error de Seguridad", "La contraseña es demasiado corta. Debe tener al menos 6 caracteres.");
    return;
  }
  if (password !== confirm) {
    showToastAlert("Error de Verificación", "Las contraseñas no coinciden. Por favor corrígelas.");
    return;
  }

  // Simulación de cuenta duplicada en BD
  if (email === 'duplicado@foco.com') {
    showToastAlert("Error de Registro", "Este correo electrónico ya está registrado. Probá iniciando sesión.");
    return;
  }

  // Guardar datos temporales de registro para inicializar onboarding
  sessionStore.setItem('foco_session_active', 'true');
  sessionStore.setItem('foco_user_email', email);
  sessionStore.setItem('foco_user_name', name);

  const container = document.getElementById(authDOM.register.btnContainer);
  if (container) {
    container.innerHTML = `
      <div class="w-full py-3.5 bg-green-600 text-white text-sm font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse">
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creando perfil de usuario...
      </div>
    `;
  }

  setTimeout(() => {
    window.location.href = 'onboarding.html';
  }, 1200);
}

function handleRecoverSubmit(event) {
  event.preventDefault();
  const email = document.getElementById(authDOM.recover.email).value.trim();

  if (!validators.isEmail(email)) {
    showToastAlert("Error de Validación", "El formato del correo electrónico ingresado no es válido.");
    return;
  }

  const container = document.getElementById(authDOM.recover.btnContainer);
  if (container) {
    container.innerHTML = `
      <div class="w-full py-3.5 bg-foco-blue-deep text-white text-sm font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Enviando correo de recuperación...
      </div>
    `;
  }

  setTimeout(() => {
    showToastAlert("Correo enviado", "Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu casilla.");
    // Restablecer vista de botón
    setTimeout(() => {
      switchView(authDOM.views.login);
      // Volver a instanciar el botón de enviar link
      if (container) {
        container.innerHTML = `
          <button type="submit" class="w-full py-3.5 bg-foco-orange-accent hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
            Enviar enlace
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        `;
        document.getElementById(authDOM.recover.email).value = '';
        checkFormCompleteness('recover');
      }
    }, 1500);
  }, 1500);
}

/**
 * Auxiliar para limpiar alertas visuales al rotar entre formularios
 */
function resetErrors() {
  const allErrors = document.querySelectorAll('.text-red-500');
  allErrors.forEach(err => err.classList.add('hidden'));

  const allInputs = document.querySelectorAll('input');
  allInputs.forEach(input => {
    input.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
  });
}

/**
    8. CONTROL DE VISIBILIDAD DE CONTRASEÑA
 * Alterna dinámicamente el tipo de input (password/text) y reemplaza el icono SVG del ojo
 */
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const iconSvg = document.getElementById(iconId);
  if (!input || !iconSvg) return;

  // 1. Icono Ojo (Ver contraseña)
  // Se le agrega la clase 'w-5 h-5' para que se adapte perfectamente al input sin desbordar
  const eyeSvg = `
    <svg id="${iconId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 lucide lucide-eye">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  // 2. Icono Ojo Tachado (Ocultar contraseña)
  const eyeOffSvg = `
    <svg id="${iconId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 lucide lucide-eye-off">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
      <path d="m2 2 20 20"/>
    </svg>
  `;

  // 3. Alternar el tipo de input y reemplazar el nodo SVG en el DOM
  if (input.type === 'password') {
    input.type = 'text';
    iconSvg.outerHTML = eyeOffSvg; // Reemplaza por el ojo tachado
  } else {
    input.type = 'password';
    iconSvg.outerHTML = eyeSvg;    // Reemplaza por el ojo abierto
  }
}


/**
 * Inicia el flujo de autenticación de Google con Supabase
 */
async function handleGoogleAuth() {
  try {
    // 'supabase' debe estar inicializado previamente en tu proyecto
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Al tener éxito, Google redirecciona al usuario al Onboarding
        redirectTo: window.location.origin + '/onboarding.html' 
      }
    });
    
    if (error) throw error;
  } catch (err) {
    // Reutilizamos el Toast de alertas que ya creamos en tu helper
    showToastAlert("Error de Google Auth", "No se pudo conectar: " + err.message);
  }
}

window.handleGoogleAuth = handleGoogleAuth;

// Dentro de initAuthEventListeners() o al cargar el DOM:
if (supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      // 1. Consultamos si el usuario ya tiene cargado su perfil en la tabla de onboarding
      const { data, error } = await supabase
        .from('onboarding_profiling')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      // 2. Si no existe el registro, forzamos la redirección a onboarding
      if (!data || error) {
        window.location.href = 'onboarding.html';
      } else {
        // Si ya está perfilado, va directo al lienzo core
        window.location.href = 'index.html'; 
      }
    }
  });
}
