/**
 * UI Component/Service: ToastAlert
 * Encapsula la presentación y temporización del Toast de alertas globales.
 * Cumple con SRP aislando la manipulación visual del Toast del resto de lógica de formularios.
 */

let toastTimeout = null;

export function showToastAlert(title, message, containerId = 'error-toast', titleId = 'toast-title', messageId = 'toast-message') {
  const container = document.getElementById(containerId);
  const titleEl = document.getElementById(titleId);
  const msgEl = document.getElementById(messageId);

  if (!container || !titleEl || !msgEl) return;

  titleEl.textContent = title;
  msgEl.textContent = message;

  // Animación de entrada
  container.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-12');
  container.classList.add('opacity-100', 'translate-y-0');

  // Limpiar timer previo si hay alertas consecutivas
  if (toastTimeout) clearTimeout(toastTimeout);

  // Cierre automático tras 7 segundos
  toastTimeout = setTimeout(() => {
    closeToastAlert(containerId);
  }, 7000);
}

export function closeToastAlert(containerId = 'error-toast') {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.add('opacity-0', 'pointer-events-none', 'translate-y-12');
    container.classList.remove('opacity-100', 'translate-y-0');
  }
}
