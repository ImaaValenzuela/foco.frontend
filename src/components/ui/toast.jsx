import React, { memo } from 'react';

/**
 * UI Component: ToastAlert (React .jsx)
 * Encapsula la presentación y temporización del Toast de alertas globales.
 * Optimizado con React.memo para evitar re-renderizados innecesarios.
 */
export const ToastAlert = memo(function ToastAlert({
  id = 'error-toast',
  title = 'Mensaje de Alerta',
  message = 'Ha ocurrido una inconsistencia.',
  onClose,
}) {
  return (
    <div
      id={id}
      className="fixed bottom-4 right-4 max-w-sm w-80 bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-2xl shadow-2xl transform translate-y-12 opacity-0 pointer-events-none transition-all duration-300 flex items-start gap-3 z-50"
    >
      <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-red-900" id="toast-title">{title}</h4>
        <p className="text-xs text-red-700 mt-1" id="toast-message">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose || (() => closeToastAlert(id))}
        className="text-red-400 hover:text-red-600 transition-colors focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

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

export default ToastAlert;
