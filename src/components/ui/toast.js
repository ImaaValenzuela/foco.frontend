/**
 * UI Component/Service: ToastAlert
 * Encapsula la presentación y temporización del Toast de alertas globales.
 * Cumple con SRP aislando la manipulación visual del Toast del resto de lógica de formularios.
 */

let toastTimeout = null;

export function showToastAlert(title, message, containerId = 'error-toast', titleId = 'toast-title', messageId = 'toast-message') {
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'foco-toast fixed bottom-5 right-5 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 opacity-0 pointer-events-none translate-y-12 shadow-xl transition-all';
    container.innerHTML = `<strong id="${titleId}" class="block text-sm text-slate-900"></strong><p id="${messageId}" class="mt-1 text-xs text-slate-600"></p>`;
    document.body.appendChild(container);
  }
  const titleEl = container.querySelector(`#${titleId}`);
  const msgEl = container.querySelector(`#${messageId}`);

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
