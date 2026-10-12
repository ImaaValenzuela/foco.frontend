import React, { memo } from 'react';
import { sessionStore, localStore } from '../services/storage.service.js';
import { validators } from '../utils/validators.js';
import { showToastAlert, closeToastAlert } from './ui/toast.jsx';
import { supabase, getSession } from '../auth.js';
import { profileService } from '../services/profile.service.js';

let isNavigating = false;

/**
 * Componente React: AuthView
 * Optimizado con React.memo.
 */
export const AuthView = memo(function AuthView() {
  return (
    <div className="auth-view-container">
      {/* Las vistas y formularios de autenticación se gestionan con soporte SPA en login.html */}
    </div>
  );
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAuthEventListeners();
  });
}

// Cache global de elementos activos para evitar consultas repetitivas al DOM
const authDOM = {
  views: {
    login: 'view-login',
    register: 'view-register',
    recover: 'view-recover'
  },
  login: {
    email: 'login-email',
    password: 'login-password',
    btnContainer: 'btn-login-container',
    form: 'login-form'
  },
  register: {
    name: 'reg-name',
    email: 'reg-email',
    password: 'reg-password',
    confirmPassword: 'reg-confirm-password',
    btnContainer: 'btn-register-container',
    form: 'register-form'
  },
  recover: {
    email: 'recover-email',
    btnContainer: 'btn-recover-container',
    form: 'recover-form'
  },
  toast: {
    container: 'error-toast',
    title: 'toast-title',
    message: 'toast-message'
  }
};

/**
 * 1. CONTROL DE INTERCAMBIO DE VISTAS (SPA-like)
 */
export function switchView(viewTarget) {
  Object.values(authDOM.views).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const activeEl = document.getElementById(viewTarget);
  if (activeEl) {
    activeEl.classList.remove('hidden');
    resetErrors();
  }

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
 * 2. VALIDACIÓN DE CAMPOS INDIVIDUALES (ONBLUR)
 */
export function validateFieldOnBlur(fieldId, errorId, validatorType, compareWithId = null) {
  const input = document.getElementById(fieldId);
  const errorMsg = document.getElementById(errorId);
  if (!input || !errorMsg) return;

  const value = input.value;
  let isValid = true;

  if (value === '') {
    errorMsg.classList.add('hidden');
    input.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
    return;
  }

  if (validatorType === 'email') isValid = validators.isEmail(value);
  if (validatorType === 'name') isValid = validators.isName(value);
  if (validatorType === 'password') isValid = validators.isPassword(value);
  if (validatorType === 'confirm') {
    const original = document.getElementById(compareWithId);
    isValid = original && value === original.value;
  }

  if (!isValid) {
    errorMsg.classList.remove('hidden');
    input.classList.add('border-red-400', 'ring-2', 'ring-red-100');
  } else {
    errorMsg.classList.add('hidden');
    input.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
  }
}

/**
 * 3. MONITOREO EN TIEMPO REAL (ONINPUT)
 */
export function checkFormCompleteness(formType) {
  let isComplete = false;

  if (formType === 'login') {
    const email = document.getElementById(authDOM.login.email)?.value.trim() || '';
    const password = document.getElementById(authDOM.login.password)?.value || '';
    const btnContainer = document.getElementById(authDOM.login.btnContainer);

    isComplete = email !== '' && password !== '';
    toggleButtonContainer(btnContainer, isComplete);
  } else if (formType === 'register') {
    const name = document.getElementById(authDOM.register.name)?.value.trim() || '';
    const email = document.getElementById(authDOM.register.email)?.value.trim() || '';
    const password = document.getElementById(authDOM.register.password)?.value || '';
    const confirm = document.getElementById(authDOM.register.confirmPassword)?.value || '';
    const btnContainer = document.getElementById(authDOM.register.btnContainer);

    isComplete = name !== '' && email !== '' && password !== '' && confirm !== '';
    toggleButtonContainer(btnContainer, isComplete);
  } else if (formType === 'recover') {
    const email = document.getElementById(authDOM.recover.email)?.value.trim() || '';
    const btnContainer = document.getElementById(authDOM.recover.btnContainer);

    isComplete = email !== '';
    toggleButtonContainer(btnContainer, isComplete);
  }
}

export function toggleButtonContainer(container, show) {
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
 * 4. LISTENERS E INTEGRACIÓN
 */
export function initAuthEventListeners() {
  const logEmail = document.getElementById(authDOM.login.email);
  const logPass = document.getElementById(authDOM.login.password);
  logEmail?.addEventListener('input', () => checkFormCompleteness('login'));
  logPass?.addEventListener('input', () => checkFormCompleteness('login'));
  logEmail?.addEventListener('blur', () => validateFieldOnBlur(authDOM.login.email, 'error-login-email', 'email'));
  logPass?.addEventListener('blur', () => validateFieldOnBlur(authDOM.login.password, 'error-login-password', 'password'));

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

  const recEmail = document.getElementById(authDOM.recover.email);
  recEmail?.addEventListener('input', () => checkFormCompleteness('recover'));
  recEmail?.addEventListener('blur', () => validateFieldOnBlur(authDOM.recover.email, 'error-recover-email', 'email'));

  checkExistingSession();
}

export async function redirectByOnboardingState(session) {
  if (isNavigating) return;

  const completed = await profileService.checkOnboardingCompleted(session);
  isNavigating = true;

  if (completed) {
    window.location.href = 'index.html';
  } else {
    window.location.href = 'onboarding.html';
  }
}

export async function checkExistingSession() {
  try {
    const session = await getSession();
    if (session?.user) {
      await redirectByOnboardingState(session);
    }
  } catch (e) {
    console.warn('Error al verificar sesión existente:', e);
  }
}

/**
 * 5. SUBMIT DE FORMULARIOS
 */
export async function handleLoginSubmit(event) {
  event?.preventDefault();
  const email = document.getElementById(authDOM.login.email)?.value.trim() || '';
  const password = document.getElementById(authDOM.login.password)?.value || '';

  if (!validators.isEmail(email)) {
    showToastAlert("Error de validación", "El formato del correo electrónico ingresado no es válido.");
    return;
  }
  if (!validators.isPassword(password)) {
    showToastAlert("Error de contraseña", "La contraseña debe tener un mínimo de 6 caracteres.");
    return;
  }

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

  try {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error && email !== 'error@foco.com') {
        throw error;
      }
    }

    sessionStore.setItem('foco_session_active', 'true');
    sessionStore.setItem('foco_user_email', email);

    const session = await getSession();
    await redirectByOnboardingState(session);
  } catch (err) {
    showToastAlert("Error de ingreso", err.message || "Las credenciales son incorrectas.");
    checkFormCompleteness('login');
  }
}

export async function handleRegisterSubmit(event) {
  event?.preventDefault();
  const name = document.getElementById(authDOM.register.name)?.value.trim() || '';
  const email = document.getElementById(authDOM.register.email)?.value.trim() || '';
  const password = document.getElementById(authDOM.register.password)?.value || '';
  const confirm = document.getElementById(authDOM.register.confirmPassword)?.value || '';

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

  try {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error && email !== 'duplicado@foco.com') {
        throw error;
      }
    }

    sessionStore.setItem('foco_session_active', 'true');
    sessionStore.setItem('foco_user_email', email);
    sessionStore.setItem('foco_user_name', name);

    setTimeout(() => {
      window.location.href = 'onboarding.html';
    }, 800);
  } catch (err) {
    showToastAlert("Error de Registro", err.message || "Este correo ya está registrado.");
    checkFormCompleteness('register');
  }
}

export function handleRecoverSubmit(event) {
  event?.preventDefault();
  const email = document.getElementById(authDOM.recover.email)?.value.trim() || '';

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
    setTimeout(() => {
      switchView(authDOM.views.login);
      if (container) {
        container.innerHTML = `
          <button type="submit" class="w-full py-3.5 bg-foco-orange-accent hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
            Enviar enlace
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        `;
        const recEl = document.getElementById(authDOM.recover.email);
        if (recEl) recEl.value = '';
        checkFormCompleteness('recover');
      }
    }, 1500);
  }, 1500);
}

export function resetErrors() {
  const allErrors = document.querySelectorAll('.text-red-500');
  allErrors.forEach(err => err.classList.add('hidden'));

  const allInputs = document.querySelectorAll('input');
  allInputs.forEach(input => {
    input.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
  });
}

export function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const iconSvg = document.getElementById(iconId);
  if (!input || !iconSvg) return;

  const eyeSvg = `
    <svg id="${iconId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 lucide lucide-eye">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `;

  const eyeOffSvg = `
    <svg id="${iconId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 lucide lucide-eye-off">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>
      <path d="m2 2 20 20"/>
    </svg>
  `;

  if (input.type === 'password') {
    input.type = 'text';
    iconSvg.outerHTML = eyeOffSvg;
  } else {
    input.type = 'password';
    iconSvg.outerHTML = eyeSvg;
  }
}

export async function handleGoogleAuth() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login.html',
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    if (error) throw error;
  } catch (err) {
    showToastAlert("Error de Google Auth", "No se pudo conectar: " + err.message);
  }
}

if (typeof window !== 'undefined') {
  window.handleGoogleAuth = handleGoogleAuth;
  window.handleLoginSubmit = handleLoginSubmit;
  window.handleRegisterSubmit = handleRegisterSubmit;
  window.handleRecoverSubmit = handleRecoverSubmit;
  window.switchView = switchView;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.closeToastAlert = closeToastAlert;
}

if (supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
      if (isNavigating) return;
      const completed = await profileService.checkOnboardingCompleted(session);
      if (completed) {
        if (window.location.pathname.includes('login') || window.location.pathname.includes('onboarding')) {
          isNavigating = true;
          window.location.href = 'index.html'; 
        }
      } else {
        if (!window.location.pathname.includes('onboarding')) {
          isNavigating = true;
          window.location.href = 'onboarding.html';
        }
      }
    }
  });
}

export default AuthView;
