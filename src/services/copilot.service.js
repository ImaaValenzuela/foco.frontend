import { getToken } from '../auth.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Servicio de Frontend para el Copiloto de IA y RAG (Fase 4)
 */
export class CopilotService {
  async #getHeaders() {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Obtiene el prompt contextual dinámico ensamblado por el backend.
   *
   * @param {string} [query] Consulta o contexto del usuario
   * @returns {Promise<{ systemPrompt: string, meta: object, retrievedPassages: Array }>}
   */
  async getAssembledPrompt(query = null) {
    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/ai/copilot/prompt`, {
        method: query ? 'POST' : 'GET',
        headers,
        ...(query ? { body: JSON.stringify({ query }) } : {})
      });

      if (!res.ok) {
        throw new Error(`Error al obtener prompt del copiloto (${res.status})`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[CopilotService] Fallo al consultar orquestador RAG:', err.message);
      return {
        systemPrompt: '',
        meta: { usedFallback: true },
        retrievedPassages: []
      };
    }
  }

  /**
   * Ejecuta búsqueda semántica directa en los bloques del lienzo.
   *
   * @param {string} query
   * @param {number} [limit=5]
   * @param {number} [threshold=0.25]
   * @returns {Promise<Array>}
   */
  async searchSemantic(query, limit = 5, threshold = 0.25) {
    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/ai/rag/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, limit, threshold })
      });

      if (!res.ok) {
        throw new Error(`Error en búsqueda semántica (${res.status})`);
      }

      const data = await res.json();
      return data.passages || [];
    } catch (err) {
      console.warn('[CopilotService] Fallo en búsqueda semántica:', err.message);
      return [];
    }
  }

  /**
   * Envía feedback sobre una respuesta del copiloto vinculada a la telemetría de ai_inference_logs.
   *
   * @param {object} payload
   * @param {string} payload.messageId
   * @param {string|number} [payload.logId]
   * @param {'positive'|'negative'} payload.rating
   * @param {string} [payload.actionTaken]
   * @param {string} [payload.feedback]
   * @returns {Promise<{ success: boolean, savedLocally?: boolean }>}
   */
  async sendFeedback({ messageId, logId = null, rating, actionTaken = null, feedback = '' }) {
    const payload = {
      messageId,
      logId,
      rating,
      actionTaken,
      feedback,
      timestamp: new Date().toISOString()
    };

    try {
      const feedbackLogs = JSON.parse(localStorage.getItem('foco_ai_feedback_logs') || '[]');
      feedbackLogs.push(payload);
      localStorage.setItem('foco_ai_feedback_logs', JSON.stringify(feedbackLogs.slice(-50)));
    } catch {
      // Ignorar fallback de storage
    }

    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/ai/copilot/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        return { success: true, savedLocally: true };
      }

      return await res.json();
    } catch (err) {
      console.warn('[CopilotService] Fallo al enviar telemetría de feedback (guardado localmente):', err.message);
      return { success: true, savedLocally: true };
    }
  }

  /**
   * Interpreta un mensaje del usuario integrando RAG y reglas de inferencia.
   *
   * @param {string} messageText
   * @returns {Promise<{ reply: string, actionTaken: string|null, actionLabel: string|null, actionDescription: string|null, logId: string|number|null }>}
   */
  async interpretMessage(messageText) {
    const promptData = await this.getAssembledPrompt(messageText);
    const lower = (messageText || '').toLowerCase().trim();

    let actionTaken = null;
    let actionLabel = null;
    let actionDescription = null;

    // 1. Identificar acción por telemetría RAG o por intención semántica
    if (lower.includes('pomodoro') || lower.includes('foco') || lower.includes('temporizador') || lower.includes('concentrar')) {
      actionTaken = 'CONFIG_POMODORO';
      actionLabel = 'Configurar temporizador pomodoro';
      actionDescription = 'Iniciar un ciclo de enfoque de 25 minutos para impulsar tu concentración.';
    } else if (lower.includes('nota') || lower.includes('anotar') || lower.includes('tarea') || lower.includes('objetivo')) {
      actionTaken = 'ADD_NOTE';
      actionLabel = 'Añadir nota/s';
      actionDescription = 'Crear una nueva tarjeta directamente en tu bloque de Objetivos Activos.';
    } else if (lower.includes('habito') || lower.includes('hábito') || lower.includes('rutina')) {
      actionTaken = 'ADD_HABIT';
      actionLabel = 'Añadir hábito';
      actionDescription = 'Registrar un nuevo hábito diario en la barra de productividad.';
    } else if (lower.includes('descanso') || lower.includes('pausa') || lower.includes('cansado') || lower.includes('recreo')) {
      actionTaken = 'SHOW_BREAK_PROMPT_UI';
      actionLabel = 'Pausa activa y descanso';
      actionDescription = 'Tomar un recreo de 10 minutos para despejar la mente y evitar fatiga.';
    } else if (promptData?.meta?.actionTaken && promptData.meta.actionTaken !== 'GENERAL_COPILOT_GUIDANCE') {
      actionTaken = promptData.meta.actionTaken;
      if (actionTaken === 'INJECT_CONVERSATIONAL_ALERT') {
        actionLabel = 'Revisar objetivos pendientes';
        actionDescription = 'Identificamos tareas que requieren tu atención en el lienzo.';
      } else if (actionTaken === 'RECOMMEND_PROJECT_PLAN') {
        actionLabel = 'Dividir tareas de proyecto';
        actionDescription = 'Desglosar tarjetas inactivas en acciones más pequeñas.';
      } else if (actionTaken === 'LOCK_POMODORO_COOLDOWN') {
        actionLabel = 'Pausa de enfriamiento';
        actionDescription = 'Pausa sugerida tras sesiones continuas de concentración.';
      } else {
        actionLabel = 'Acción sugerida';
        actionDescription = 'Optimización recomendada según tu ritmo de trabajo.';
      }
    }

    // 2. Generación de respuesta contextual
    let reply = '';
    if (actionTaken === 'CONFIG_POMODORO') {
      reply = '¡Excelente momento para concentrarse! Te sugiero iniciar un ciclo Pomodoro de 25 minutos. Podés activarlo haciendo clic en el badge azul de abajo.';
    } else if (actionTaken === 'ADD_NOTE') {
      reply = 'Perfecto, registrar tus pensamientos en notas despeja tu carga mental. Hacé clic en la acción sugerida para plasmarla en tu lienzo.';
    } else if (actionTaken === 'ADD_HABIT') {
      reply = 'La constancia construye grandes logros. Podés registrar tu hábito en el tracker haciendo clic en la acción sugerida.';
    } else if (actionTaken === 'SHOW_BREAK_PROMPT_UI') {
      reply = 'Noté que necesitás un respiro. Tomarte unos minutos para estirar o hidratarte mejorará tu rendimiento cognitivo.';
    } else if (promptData?.retrievedPassages?.length > 0) {
      const topTitle = promptData.retrievedPassages[0].title || promptData.retrievedPassages[0].text || '';
      reply = `Encontré información relacionada en tu segundo cerebro: "${topTitle}". ¿Te gustaría que la vinculemos a una tarea o configuremos un bloque de estudio?`;
    } else {
      reply = `Entendido: "${messageText}". Como Copiloto de F.O.C.O., estoy listo para ayudarte a organizar notas, planificar tu rutina o monitorear tus hábitos.`;
    }

    return {
      reply,
      actionTaken,
      actionLabel,
      actionDescription,
      logId: promptData?.contextSnapshot?.lastInferenceLogId || null
    };
  }
}

export const copilotService = new CopilotService();
