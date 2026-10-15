import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nluService } from '../src/services/nlu.service.js';
import { canvasMutators } from '../src/services/canvasMutators.js';
import { useCanvas } from '../src/hooks/useCanvas.js';

vi.mock('../src/images/logo.svg', () => ({
  default: 'logo.svg',
}));

vi.mock('../src/auth.js', () => ({
  getToken: vi.fn(() => Promise.resolve('mock-jwt-token')),
  getSession: vi.fn(() => Promise.resolve(null)), // Guest mode by default in tests
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('../src/components/ui/toast.jsx', () => ({
  showToastAlert: vi.fn(),
}));

import { showToastAlert } from '../src/components/ui/toast.jsx';
import '../src/components/ChatbotModal.jsx';

describe('Pipeline NLU y Acciones "Ejecutar en el Lienzo" (Integración)', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Clasificador NLU (nluService.parseIntent)', () => {
    it('Interpreta intenciones de Pomodoro con minutos personalizados o por defecto (25m)', () => {
      const resDefault = nluService.parseIntent('Iniciá un Pomodoro');
      expect(resDefault.intent).toBe('START_POMODORO');
      expect(resDefault.actionTaken).toBe('CONFIG_POMODORO');
      expect(resDefault.actionPayload?.focusMinutes).toBe(25);
      expect(resDefault.reply).toContain('Pomodoro');

      const resCustom = nluService.parseIntent('Iniciá un Pomodoro de 45 min');
      expect(resCustom.intent).toBe('START_POMODORO');
      expect(resCustom.actionTaken).toBe('CONFIG_POMODORO');
      expect(resCustom.actionPayload?.focusMinutes).toBe(45);
      expect(resCustom.actionLabel).toContain('45 min');
    });

    it('Interpreta intención de crear un nuevo hábito', () => {
      const res = nluService.parseIntent('Creá un hábito de tomar agua');
      expect(res.intent).toBe('CREATE_HABIT');
      expect(res.actionTaken).toBe('ADD_HABIT');
      expect(res.actionPayload?.name).toBe('Tomar agua');
      expect(res.actionLabel).toContain('Tomar agua');
      expect(res.reply).toContain('Tomar agua');
    });

    it('Interpreta intención de agregar una tarea en Objetivos Activos', () => {
      const res = nluService.parseIntent('Agregá una tarea de repasar React');
      expect(res.intent).toBe('CREATE_BLOCK_ITEM');
      expect(res.actionTaken).toBe('ADD_NOTE');
      expect(res.actionPayload?.isTask).toBe(true);
      expect(res.actionPayload?.targetBlock).toBe('active_objectives');
      expect(res.actionPayload?.text).toBe('Repasar React');
    });

    it('Interpreta intención de agregar una nota en bloques específicos (Personal, Inspiración, Archivo)', () => {
      const resPersonal = nluService.parseIntent('Guardá una nota en bloque personal de comprar café');
      expect(resPersonal.actionTaken).toBe('ADD_NOTE');
      expect(resPersonal.actionPayload?.targetBlock).toBe('personal_block');
      expect(resPersonal.actionPayload?.isTask).toBe(false);

      const resInspiracion = nluService.parseIntent('Anotá una nota de creatividad sobre nueva app');
      expect(resInspiracion.actionTaken).toBe('ADD_NOTE');
      expect(resInspiracion.actionPayload?.targetBlock).toBe('inspiration_creativity');

      const resVida = nluService.parseIntent('Guardá en archivo de vida una nota de viaje 2025');
      expect(resVida.actionTaken).toBe('ADD_NOTE');
      expect(resVida.actionPayload?.targetBlock).toBe('life_archive');
    });

    it('Interpreta intenciones dictadas por voz con cláusulas explícitas (que diga, con el texto, etc.)', () => {
      const resDiga = nluService.parseIntent('Crear nota que diga comprar café');
      expect(resDiga.actionTaken).toBe('ADD_NOTE');
      expect(resDiga.actionPayload?.text).toBe('Comprar café');
      expect(resDiga.actionPayload?.isTask).toBe(false);

      const resTexto = nluService.parseIntent('Crear una nota con el texto terminar informe para mañana');
      expect(resTexto.actionTaken).toBe('ADD_NOTE');
      expect(resTexto.actionPayload?.text).toBe('Terminar informe para mañana');

      const resTengo = nluService.parseIntent('Agregar tarea que tengo que pagar la luz');
      expect(resTengo.actionTaken).toBe('ADD_NOTE');
      expect(resTengo.actionPayload?.isTask).toBe(true);
      expect(resTengo.actionPayload?.text).toBe('Pagar la luz');
    });

    it('Interpreta órdenes de voz directas ("Crear nota...", "Agregar tarea...") con fallbacks seguros', () => {
      const resNota = nluService.parseIntent('Crear nota repasar React');
      expect(resNota.actionTaken).toBe('ADD_NOTE');
      expect(resNota.actionPayload?.text).toBe('Repasar React');
      expect(resNota.actionPayload?.targetBlock).toBe('active_objectives');

      const resTarea = nluService.parseIntent('Agregar tarea entregar informe');
      expect(resTarea.actionTaken).toBe('ADD_NOTE');
      expect(resTarea.actionPayload?.isTask).toBe(true);
      expect(resTarea.actionPayload?.text).toBe('Entregar informe');

      const resVacia = nluService.parseIntent('Crear nota');
      expect(resVacia.actionTaken).toBe('ADD_NOTE');
      expect(resVacia.actionPayload?.text).toBe('Nota rápida');

      const resTareaVacia = nluService.parseIntent('Agregar tarea');
      expect(resTareaVacia.actionTaken).toBe('ADD_NOTE');
      expect(resTareaVacia.actionPayload?.text).toBe('Tarea rápida');
    });

    it('Fallback para conversación general sin intenciones operativas', () => {
      const res = nluService.parseIntent('¿Cómo estás hoy?');
      expect(res.intent).toBe('GENERAL_CHAT');
      expect(res.actionTaken).toBeNull();
      expect(res.actionPayload).toBeNull();
    });
  });

  describe('2. Mutadores de Estado del Lienzo (canvasMutators)', () => {
    it('addCard() guarda en localStorage (modo invitado) y dispara foco:refresh-canvas', async () => {
      let canvasRefreshed = false;
      window.addEventListener('foco:refresh-canvas', () => {
        canvasRefreshed = true;
      });

      const res = await canvasMutators.addCard({
        text: 'Estudiar testing con Vitest',
        targetBlock: 'active_objectives',
        isTask: true,
      });

      expect(res.success).toBe(true);
      expect(canvasRefreshed).toBe(true);
      expect(showToastAlert).toHaveBeenCalledWith(
        'Lienzo actualizado',
        expect.stringContaining('Estudiar testing con Vitest')
      );

      // Verificamos que se guardó en foco-local-blocks
      const stored = JSON.parse(localStorage.getItem('foco-local-blocks') || '[]');
      const activeBlock = stored.find((b) => b.type === 'active_objectives');
      expect(activeBlock).toBeDefined();
      expect(activeBlock.content.notes.some((n) => n.text === 'Estudiar testing con Vitest')).toBe(true);
    });

    it('startPomodoro() dispara foco:start-pomodoro y foco:quick-pomodoro', async () => {
      let pomodoroStarted = false;
      let quickPomodoro = false;

      window.addEventListener('foco:start-pomodoro', (e) => {
        if (e.detail?.focusMinutes === 30) pomodoroStarted = true;
      });
      window.addEventListener('foco:quick-pomodoro', () => {
        quickPomodoro = true;
      });

      const res = await canvasMutators.startPomodoro({ focusMinutes: 30 });
      expect(res.success).toBe(true);
      expect(res.focusMinutes).toBe(30);
      expect(pomodoroStarted).toBe(true);
      expect(quickPomodoro).toBe(true);
      expect(showToastAlert).toHaveBeenCalledWith('Pomodoro iniciado', expect.any(String));
    });

    it('addHabit() dispara foco:add-habit y foco:refresh-habits', async () => {
      let habitAdded = false;
      let habitsRefreshed = false;

      window.addEventListener('foco:add-habit', (e) => {
        if (e.detail?.name === 'Leer 10 páginas') habitAdded = true;
      });
      window.addEventListener('foco:refresh-habits', () => {
        habitsRefreshed = true;
      });

      const res = await canvasMutators.addHabit('Leer 10 páginas');
      expect(res.success).toBe(true);
      expect(res.name).toBe('Leer 10 páginas');
      expect(habitAdded).toBe(true);
      expect(habitsRefreshed).toBe(true);
      expect(showToastAlert).toHaveBeenCalledWith('Hábito creado', expect.any(String));
    });

    it('executeNluAction() procesa polimórficamente intenciones', async () => {
      const resPom = await canvasMutators.executeNluAction('CONFIG_POMODORO', { focusMinutes: 20 });
      expect(resPom.success).toBe(true);

      const resHabit = await canvasMutators.executeNluAction('ADD_HABIT', { name: 'Meditar' });
      expect(resHabit.success).toBe(true);

      const resNote = await canvasMutators.executeNluAction('ADD_NOTE', { text: 'Nota prueba' });
      expect(resNote.success).toBe(true);
    });
  });

  describe('3. Hook useCanvas', () => {
    it('expone las funciones mutadoras del lienzo correctamente', async () => {
      const React = await import('react');
      const { createRoot } = await import('react-dom/client');

      let hookResult = null;
      function TestComponent() {
        hookResult = useCanvas();
        return null;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      await React.act(async () => {
        root.render(React.createElement(TestComponent));
      });

      expect(hookResult).not.toBeNull();
      expect(typeof hookResult.addCard).toBe('function');
      expect(typeof hookResult.startPomodoro).toBe('function');
      expect(typeof hookResult.addHabit).toBe('function');
      expect(typeof hookResult.toggleHabit).toBe('function');
      expect(typeof hookResult.executeAction).toBe('function');
      expect(hookResult.mutators).toBe(canvasMutators);

      await React.act(async () => {
        root.unmount();
      });
      container.remove();
    });
  });

  describe('4. Interacción en ChatbotModal: Botón azul "Ejecutar en el lienzo"', () => {
    it('Renderiza tarjeta con botón azul #2563EB y tras hacer clic ejecuta la mutación y cambia a "✓ Ejecutado en el lienzo"', async () => {
      const modalElement = document.createElement('foco-chatbot-modal');
      document.body.appendChild(modalElement);

      const launcherBtn = modalElement.querySelector('#foco-chatbot-launcher-btn');
      launcherBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Enviar orden de pomodoro
      const form = modalElement.querySelector('#chatbot-input-form');
      const textInput = modalElement.querySelector('#chatbot-text-input');
      textInput.value = 'Iniciá un Pomodoro de 25 min';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await new Promise((r) => setTimeout(r, 60));

      // Verificar existencia de tarjeta de acción
      const actionCard = modalElement.querySelector('[data-action-card="CONFIG_POMODORO"]');
      expect(actionCard).not.toBeNull();

      // Botón azul con leyenda explícita "Ejecutar en el lienzo"
      const actionBtn = modalElement.querySelector('[data-action-trigger="CONFIG_POMODORO"]');
      expect(actionBtn).not.toBeNull();
      expect(actionBtn?.textContent).toContain('Ejecutar en el lienzo');
      expect(actionBtn?.className).toContain('bg-[#2563EB]');

      // Escuchar evento
      let executed = false;
      window.addEventListener('foco:quick-pomodoro', () => {
        executed = true;
      });

      // Clic en "Ejecutar en el lienzo"
      actionBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 60));

      expect(executed).toBe(true);

      // El botón ahora debe reflejar la confirmación visual "✓ Ejecutado en el lienzo"
      const updatedBtn = modalElement.querySelector('[data-action-trigger="CONFIG_POMODORO"]');
      expect(updatedBtn?.textContent).toContain('✓ Ejecutado en el lienzo');
      expect(updatedBtn?.className).toContain('bg-emerald-600');
    });
  });
});
