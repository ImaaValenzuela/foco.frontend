import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../src/images/logo.svg', () => ({
  default: 'logo.svg',
}));

vi.mock('../src/auth.js', () => ({
  getToken: vi.fn(() => Promise.resolve('mock-jwt-token')),
  getSession: vi.fn(() => Promise.resolve({ access_token: 'mock-jwt-token' })),
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('../src/services/copilot.service.js', () => {
  return {
    copilotService: {
      getAssembledPrompt: vi.fn().mockResolvedValue({
        systemPrompt: 'System prompt mock',
        meta: { actionTaken: 'CONFIG_POMODORO' },
        retrievedPassages: [],
      }),
      interpretMessage: vi.fn().mockImplementation(async (text) => {
        if (text.includes('pomodoro')) {
          return {
            reply: 'Te sugiero iniciar un ciclo Pomodoro de 25 minutos.',
            actionTaken: 'CONFIG_POMODORO',
            actionLabel: 'Configurar temporizador pomodoro',
            actionDescription: 'Iniciar un ciclo de enfoque de 25 minutos.',
            logId: 'log-123',
          };
        }
        return {
          reply: `Respuesta a: ${text}`,
          actionTaken: null,
          actionLabel: null,
          actionDescription: null,
          logId: null,
        };
      }),
      sendFeedback: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

import { copilotService } from '../src/services/copilot.service.js';
import '../src/components/ChatbotModal.jsx';

describe('Chatbot F.O.C.O. - Componente UI y Modal (Pruebas de Integración)', () => {
  let container;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Renderiza el botón disparador (launcher) con logo de F.O.C.O. y estado inicial cerrado', () => {
    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    const modalWindow = modalElement.querySelector('#foco-chatbot-modal-window');

    expect(launcherBtn).not.toBeNull();
    expect(launcherBtn?.getAttribute('aria-label')).toBe('Abrir Chatbot F.O.C.O.');

    const logoImg = launcherBtn?.querySelector('img');
    expect(logoImg).not.toBeNull();
    expect(logoImg?.getAttribute('src')).toBe('logo.svg');

    // Inicialmente el modal debe estar con opacity-0 / invisible
    expect(modalWindow?.classList.contains('opacity-0')).toBe(true);
    expect(modalWindow?.classList.contains('invisible')).toBe(true);
  });

  it('2. Al hacer clic en el launcher se despliega la ventana emergente flotante con entrada dual (audio + texto)', () => {
    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const modalWindow = modalElement.querySelector('#foco-chatbot-modal-window');
    expect(modalWindow?.classList.contains('opacity-100')).toBe(true);
    expect(modalWindow?.classList.contains('visible')).toBe(true);

    // Entrada Dual: Micrófono (STT) + Campo de texto + Botón Enviar
    const micBtn = modalElement.querySelector('#chatbot-mic-toggle-btn');
    const textInput = modalElement.querySelector('#chatbot-text-input');
    const sendBtn = modalElement.querySelector('#chatbot-send-btn');

    expect(micBtn).not.toBeNull();
    expect(textInput).not.toBeNull();
    expect(sendBtn).not.toBeNull();
  });

  it('3. Envío de mensaje por texto añade globo de usuario y respuesta del copiloto', async () => {
    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const form = modalElement.querySelector('#chatbot-input-form');
    const textInput = modalElement.querySelector('#chatbot-text-input');

    textInput.value = 'Quiero organizar mi sesión de pomodoro';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 60));

    expect(copilotService.interpretMessage).toHaveBeenCalledWith('Quiero organizar mi sesión de pomodoro');

    // Debe renderizarse el mensaje del usuario y la respuesta del copiloto
    const messages = modalElement.querySelectorAll('#chatbot-messages-list > div');
    expect(messages.length).toBeGreaterThanOrEqual(2);

    const textContent = modalElement.querySelector('#chatbot-messages-list')?.textContent;
    expect(textContent).toContain('Quiero organizar mi sesión de pomodoro');
    expect(textContent).toContain('Te sugiero iniciar un ciclo Pomodoro de 25 minutos.');
  });

  it('4. Validación de Acción Sugerida (Badges en Azul): renderiza tarjeta destacada para action_taken', async () => {
    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const form = modalElement.querySelector('#chatbot-input-form');
    const textInput = modalElement.querySelector('#chatbot-text-input');

    textInput.value = 'pomodoro foco';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 60));

    // Verificamos que se renderice la tarjeta azul de acción sugerida
    const actionCard = modalElement.querySelector('[data-action-card="CONFIG_POMODORO"]');
    expect(actionCard).not.toBeNull();
    expect(actionCard?.textContent).toContain('Acción Sugerida');
    expect(actionCard?.textContent).toContain('Configurar temporizador pomodoro');

    // Botón de ejecución en el lienzo
    const actionTriggerBtn = modalElement.querySelector('[data-action-trigger="CONFIG_POMODORO"]');
    expect(actionTriggerBtn).not.toBeNull();
    expect(actionTriggerBtn?.textContent).toContain('Ejecutar en el lienzo');

    // Simular clic en la acción y verificar que dispara el evento global
    let triggeredEvent = false;
    window.addEventListener('foco:quick-pomodoro', () => {
      triggeredEvent = true;
    });

    actionTriggerBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(triggeredEvent).toBe(true);
  });

  it('5. Mecanismo de Feedback: pulgar arriba (👍) y pulgar abajo (👎) envían telemetría', async () => {
    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const form = modalElement.querySelector('#chatbot-input-form');
    const textInput = modalElement.querySelector('#chatbot-text-input');

    textInput.value = 'pomodoro';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 60));

    const positiveBtns = modalElement.querySelectorAll('[data-feedback-btn="positive"]');
    const positiveBtn = positiveBtns[positiveBtns.length - 1];

    expect(positiveBtn).not.toBeNull();

    // Clic en feedback positivo (👍) de la respuesta generada
    positiveBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 40));

    expect(copilotService.sendFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 'positive',
        actionTaken: 'CONFIG_POMODORO',
      })
    );
  });

  it('6. Opción "Borrar Historial" vacía la conversación tras confirmación', async () => {
    // Simulamos historial preexistente
    localStorage.setItem(
      'foco_chat_history_v1',
      JSON.stringify([
        { id: '1', role: 'user', content: 'Mensaje antiguo 1' },
        { id: '2', role: 'assistant', content: 'Respuesta antigua 2' },
      ])
    );

    window.confirm = vi.fn().mockReturnValue(true);

    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const clearBtn = modalElement.querySelector('#chatbot-clear-history-btn');
    expect(clearBtn).not.toBeNull();

    clearBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(window.confirm).toHaveBeenCalled();
    const messages = modalElement.querySelectorAll('#chatbot-messages-list > div');
    expect(messages.length).toBe(1); // Solo el mensaje de bienvenida inicial
  });

  it('7. Posición sobre el lienzo sin solapar la barra de productividad según el estado', () => {
    // 1. Caso: Sin barra o barra oculta -> right: 2rem (32px)
    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);
    expect(modalElement.getRightOffset()).toBe('2rem');

    // 2. Caso: Barra colapsada (w-16 = 64px) -> right: 6rem (96px, 32px de margen a la izquierda de la barra)
    const sidebar = document.createElement('foco-productivity-sidebar');
    sidebar.className = 'w-16';
    document.body.appendChild(sidebar);
    expect(modalElement.getRightOffset()).toBe('6rem');

    // 3. Caso: Barra expandida (w-80 = 320px) -> right: 21.5rem (344px, libre de solapamiento)
    sidebar.className = 'w-80';
    expect(modalElement.getRightOffset()).toBe('21.5rem');
  });

  it('8. Sugerencias conversacionales en texto plano no renderizan tarjeta de acción ni botón en el lienzo', async () => {
    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const form = modalElement.querySelector('#chatbot-input-form');
    const textInput = modalElement.querySelector('#chatbot-text-input');

    textInput.value = '¿Cómo estás hoy?';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise((r) => setTimeout(r, 60));

    // Debe mostrar la respuesta en texto
    const textContent = modalElement.querySelector('#chatbot-messages-list')?.textContent;
    expect(textContent).toContain('Respuesta a: ¿Cómo estás hoy?');

    // NO debe existir tarjeta de acción ni botón "Ejecutar en el lienzo"
    const actionCards = modalElement.querySelectorAll('[data-action-card]');
    expect(actionCards.length).toBe(0);

    const actionTriggers = modalElement.querySelectorAll('[data-action-trigger]');
    expect(actionTriggers.length).toBe(0);
  });

  it('9. Mensajes con alertas conversacionales (ej. INJECT_CONVERSATIONAL_ALERT o CONVERSATIONAL_SUGGESTION) no renderizan tarjeta de acción', async () => {
    // Simulamos historial preexistente con mensajes conversacionales
    localStorage.setItem(
      'foco_chat_history_v1',
      JSON.stringify([
        {
          id: 'msg-alert-1',
          role: 'assistant',
          content: 'Noté que tenés metas pendientes, pero date un respiro.',
          actionTaken: 'INJECT_CONVERSATIONAL_ALERT',
          actionPayload: null,
          ruleId: 'GENERAL_CONVERSATION'
        },
        {
          id: 'msg-sugg-2',
          role: 'assistant',
          content: 'Un buen consejo para hoy es avanzar de a una sola tarea.',
          actionTaken: 'CONVERSATIONAL_SUGGESTION',
          actionPayload: null,
          ruleId: 'GENERAL_CONVERSATION'
        }
      ])
    );

    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Verificamos que se rendericen los textos de los mensajes
    const textContent = modalElement.querySelector('#chatbot-messages-list')?.textContent;
    expect(textContent).toContain('Noté que tenés metas pendientes');
    expect(textContent).toContain('Un buen consejo para hoy');

    // Ninguno de estos mensajes conversacionales debe tener tarjeta de acción ni botón "Ejecutar en el lienzo"
    const actionCards = modalElement.querySelectorAll('[data-action-card]');
    expect(actionCards.length).toBe(0);

    const actionTriggers = modalElement.querySelectorAll('[data-action-trigger]');
    expect(actionTriggers.length).toBe(0);
  });

  it('10. Mensajes de creación de tarea o nota renderizan tarjeta de Acción Sugerida y botón de ejecución', async () => {
    localStorage.setItem(
      'foco_chat_history_v1',
      JSON.stringify([
        {
          id: 'msg-task-1',
          role: 'assistant',
          content: 'He preparado la tarea para tu lienzo.',
          actionTaken: 'ADD_TASK',
          actionPayload: {
            type: 'add_card',
            isTask: true,
            title: 'Hacer compras',
            content: 'Leche, pan, café'
          },
          actionLabel: 'Crear tarea: Hacer compras',
          actionDescription: 'Agregar tarea interactiva al lienzo'
        }
      ])
    );

    const modalElement = document.createElement('foco-chatbot-modal');
    document.body.appendChild(modalElement);

    const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
    launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const actionCard = modalElement.querySelector('[data-action-card="ADD_TASK"]');
    expect(actionCard).not.toBeNull();
    expect(actionCard?.textContent).toContain('Acción Sugerida');
    expect(actionCard?.textContent).toContain('Crear tarea: Hacer compras');

    const actionTrigger = modalElement.querySelector('[data-action-trigger="ADD_TASK"]');
    expect(actionTrigger).not.toBeNull();
    expect(actionTrigger?.textContent).toContain('Ejecutar en el lienzo');
  });
});


