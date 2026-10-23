import { getSession } from '../auth.js';
import { blocksService } from './blocks.service.js';
import { localStore } from './storage.service.js';
import { showToastAlert } from '../components/ui/toast.jsx';
import { emitCustomEvent, FOCO_EVENTS } from '../utils/events.js';

const LOCAL_BLOCKS_KEY = 'foco-local-blocks';

/**
 * Mutadores de Estado del Lienzo (Canvas State Mutators)
 * Vincula acciones del NLU directamente con las mutaciones reactivas del lienzo y la barra de productividad.
 */
export class CanvasMutators {
  /**
   * Muestra confirmación visual flotante (Toast no intrusivo).
   */
  static notify(title, message) {
    try {
      showToastAlert(title, message);
    } catch {
      // Fallback silencioso si no está montado el toast
    }
  }

  /**
   * Agrega una tarjeta (Nota o Tarea) directamente al lienzo y persiste en backend o localStorage.
   *
   * @param {object} payload
   * @param {string} payload.text Contenido de la tarjeta
   * @param {string} [payload.targetBlock='active_objectives'] Cuadrante P.A.R.A. destino
   * @param {boolean} [payload.isTask=false] Verdadero si es tarea con checkbox
   * @param {string} [payload.title=null] Título opcional
   * @returns {Promise<{ success: boolean, item: object }>}
   */
  async addCard({ text, targetBlock = 'active_objectives', isTask = false, title = null } = {}) {
    const cleanText = String(text || '').trim();
    if (!cleanText) {
      throw new Error('El texto de la tarjeta no puede estar vacío');
    }

    const canvas = document.querySelector('foco-lienzo-canvas');
    let itemSaved = null;

    if (canvas && typeof canvas.guardarItemEnBackend === 'function') {
      itemSaved = await canvas.guardarItemEnBackend(cleanText, targetBlock, isTask);
      if (typeof canvas.cargarBlocks === 'function') {
        await canvas.cargarBlocks();
      }
    } else {
      // Fallback para ejecución en tests o entornos sin web component renderizado
      const sesion = await getSession();
      const nuevaNota = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}`,
        text: cleanText,
        title: title || null,
        type: isTask ? 'task' : 'note',
        isTask: Boolean(isTask),
        checked: false,
        createdAt: new Date().toISOString()
      };

      if (!sesion) {
        const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
        let bloqueLocal = locales.find((b) => b.type === targetBlock);
        if (bloqueLocal) {
          bloqueLocal.content.notes = [...(bloqueLocal.content.notes || []), nuevaNota];
        } else {
          bloqueLocal = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `blk-${Date.now()}`,
            type: targetBlock,
            content: { notes: [nuevaNota] }
          };
          locales.push(bloqueLocal);
        }
        localStore.setItem(LOCAL_BLOCKS_KEY, locales);
        itemSaved = { noteId: nuevaNota.id, blockId: bloqueLocal.id, item: nuevaNota };
      } else {
        const blocks = await blocksService.fetchBlocks(sesion.access_token, sesion.user.id);
        const existing = blocks.find((b) => b.type === targetBlock);
        if (existing) {
          const updated = [...(existing.content?.notes || []), nuevaNota];
          await blocksService.updateBlock(existing.id, { ...existing.content, notes: updated }, sesion.access_token);
        } else {
          await blocksService.saveBlock(targetBlock, { notes: [nuevaNota] }, sesion.access_token);
        }
        itemSaved = { noteId: nuevaNota.id, item: nuevaNota };
      }
    }

    // Despacho global de evento para refresco del tablero
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foco:refresh-canvas'));
      emitCustomEvent(window, FOCO_EVENTS.BLOCK_SAVED, { targetBlock, text: cleanText });
    }

    // Scroll suave hacia la sección afectada si está presente en el DOM
    try {
      const blockDomMap = {
        active_objectives: 'seccion-objetivos-activos',
        personal_block: 'seccion-personal',
        inspiration_creativity: 'seccion-inspiracion',
        life_archive: 'seccion-archivo-vida'
      };
      const sectionId = blockDomMap[targetBlock] || 'seccion-objetivos-activos';
      const sectionEl = document.getElementById(sectionId);
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch {}

    const labelTipo = isTask ? 'Tarea agregada' : 'Nota agregada';
    CanvasMutators.notify('Lienzo actualizado', `${labelTipo}: "${cleanText}"`);

    return { success: true, item: itemSaved };
  }

  /**
   * Inicia el temporizador Pomodoro en la barra de productividad derecha.
   *
   * @param {object} payload
   * @param {number} [payload.focusMinutes=25] Minutos de enfoque
   * @returns {Promise<{ success: boolean, focusMinutes: number }>}
   */
  async startPomodoro({ focusMinutes = 25 } = {}) {
    const minutes = Number(focusMinutes) || 25;
    const sidebar = document.querySelector('foco-productivity-sidebar');

    if (sidebar) {
      // Expandir la barra si estaba colapsada
      if (sidebar.classList.contains('w-16')) {
        sidebar.classList.remove('w-16');
        sidebar.classList.add('w-80');
      }

      if (sidebar.pomodoroManager) {
        sidebar.pomodoroManager.updateConfig({ focusMinutes: minutes });
        sidebar.pomodoroManager.startTimer();
      }

      if (typeof sidebar.render === 'function') {
        sidebar.render();
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foco:start-pomodoro', { detail: { focusMinutes: minutes } }));
      window.dispatchEvent(new CustomEvent('foco:quick-pomodoro'));
      emitCustomEvent(window, FOCO_EVENTS.POMODORO_PHASE_CHANGE, { phase: 'focus', focusMinutes: minutes });
    }

    CanvasMutators.notify('Pomodoro iniciado', `Comenzando ciclo de ${minutes} minutos.`);

    return { success: true, focusMinutes: minutes };
  }

  /**
   * Agrega un nuevo hábito al tracker de hábitos y abre la barra lateral.
   *
   * @param {string} habitName Nombre del hábito
   * @returns {Promise<{ success: boolean, name: string }>}
   */
  async addHabit(habitName) {
    const name = String(habitName || '').trim();
    if (!name) {
      throw new Error('El nombre del hábito no puede estar vacío');
    }

    const sidebar = document.querySelector('foco-productivity-sidebar');

    if (sidebar) {
      if (sidebar.classList.contains('w-16')) {
        sidebar.classList.remove('w-16');
        sidebar.classList.add('w-80');
      }

      if (sidebar.habitManager) {
        await sidebar.habitManager.addHabit(name);
      }

      if (typeof sidebar.render === 'function') {
        sidebar.render();
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foco:add-habit', { detail: { name } }));
      window.dispatchEvent(new CustomEvent('foco:refresh-habits'));
      emitCustomEvent(window, FOCO_EVENTS.HABIT_ADDED, { name });
    }

    CanvasMutators.notify('Hábito creado', `"${name}" registrado en tu tracker.`);

    return { success: true, name };
  }

  /**
   * Alterna el estado de cumplimiento de un hábito.
   *
   * @param {string} habitId
   * @returns {Promise<{ success: boolean }>}
   */
  async toggleHabit(habitId) {
    const sidebar = document.querySelector('foco-productivity-sidebar');
    if (sidebar && sidebar.habitManager) {
      await sidebar.habitManager.toggleHabit(habitId);
      if (typeof sidebar.render === 'function') sidebar.render();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('foco:toggle-habit', { detail: { habitId } }));
    }
    return { success: true };
  }

  /**
   * Despacha y ejecuta la acción NLU identificada de manera polimórfica.
   *
   * @param {string} actionTaken Tipo de acción
   * @param {object} [actionPayload={}] Argumentos extraídos por NLU
   * @returns {Promise<{ success: boolean, action: string, data?: any }>}
   */
  async executeNluAction(actionTaken, actionPayload = {}) {
    const payloadType = actionPayload?.type;
    if (!actionTaken && !payloadType) return { success: false, error: 'No action provided' };

    // 1. Inserción de Tarjeta / Tarea en el Lienzo (add_card o alertas conversacionales)
    if (
      payloadType === 'add_card' ||
      actionTaken === 'INJECT_CONVERSATIONAL_ALERT' ||
      actionTaken === 'RECOMMEND_PROJECT_PLAN' ||
      actionTaken === 'PROMPT_BRAIN_DUMP' ||
      actionTaken === 'PROMPT_WEEKLY_PLANNING' ||
      actionTaken === 'SUGGEST_INTEREST_CARD' ||
      actionTaken === 'ADD_NOTE' ||
      actionTaken === 'ADD_TASK' ||
      actionTaken === 'ADD_CARD' ||
      actionTaken === 'CREATE_BLOCK_ITEM'
    ) {
      const cardText = actionPayload?.content || actionPayload?.text || actionPayload?.title || 'Nueva tarjeta sugerida';
      const targetBlock = actionPayload?.block_type || actionPayload?.targetBlock || 'active_objectives';
      const isTask = actionPayload?.isTask !== undefined
        ? Boolean(actionPayload.isTask)
        : (actionTaken === 'ADD_TASK' || actionTaken === 'INJECT_CONVERSATIONAL_ALERT');
      const title = actionPayload?.title || null;

      const res = await this.addCard({
        text: cardText,
        targetBlock,
        isTask,
        title
      });
      return { success: true, action: actionTaken || 'ADD_CARD', data: res };
    }

    // 2. Temporizador Pomodoro
    if (
      payloadType === 'start_pomodoro' ||
      actionTaken === 'CONFIG_POMODORO' ||
      actionTaken === 'START_POMODORO'
    ) {
      const minutes = actionPayload?.focusMinutes || 25;
      const res = await this.startPomodoro({ focusMinutes: minutes });
      return { success: true, action: actionTaken || 'START_POMODORO', data: res };
    }

    // 3. Creación o Reenganche de Hábitos
    if (
      payloadType === 'add_habit' ||
      actionTaken === 'ADD_HABIT' ||
      actionTaken === 'CREATE_HABIT' ||
      actionTaken === 'SUGGEST_HABIT_LOG' ||
      actionTaken === 'HIGHLIGHT_HABIT_TRACKER'
    ) {
      const name = actionPayload?.title || actionPayload?.name || actionPayload?.content || actionPayload?.text || 'Nuevo hábito';
      const res = await this.addHabit(name);
      return { success: true, action: actionTaken || 'ADD_HABIT', data: res };
    }

    // 4. Alternancia de Estado de Hábito
    if (payloadType === 'toggle_habit' || actionTaken === 'TOGGLE_HABIT') {
      const res = await this.toggleHabit(actionPayload?.habitId);
      return { success: true, action: actionTaken || 'TOGGLE_HABIT', data: res };
    }

    // 5. Alerta de Pausa / Cooldown
    if (
      payloadType === 'break_prompt' ||
      actionTaken === 'SHOW_BREAK_PROMPT_UI' ||
      actionTaken === 'LOCK_POMODORO_COOLDOWN'
    ) {
      const breakMsg = actionPayload?.content || 'Tomate 10 minutos para despejarte y volver con energía.';
      CanvasMutators.notify('Pausa sugerida', breakMsg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foco:break-prompt', { detail: actionPayload }));
      }
      return { success: true, action: actionTaken || 'BREAK_PROMPT' };
    }

    console.warn('[CanvasMutators] Acción desconocida:', actionTaken, actionPayload);
    return { success: false, error: `Acción desconocida: ${actionTaken}` };
  }
}

export const canvasMutators = new CanvasMutators();
export default canvasMutators;
