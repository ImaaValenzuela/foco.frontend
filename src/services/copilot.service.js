import { getToken } from '../auth.js';
import { nluService } from './nlu.service.js';

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
   * Ejecuta la inferencia estructurada LangChain en el backend (Fase 5)
   * Consume el prompt RAG de Fase 4 y devuelve JSON con rule_id, suggested_message, action_taken y action_payload.
   *
   * @param {string} messageText
   * @param {object} [options]
   * @returns {Promise<object|null>}
   */
  async inferStructured(messageText, options = {}) {
    try {
      const headers = await this.#getHeaders();
      const res = await fetch(`${API_BASE}/ai/infer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: messageText,
          rule_id: options.ruleId || null,
          customAction: options.customAction || null
        })
      });

      if (!res.ok) {
        throw new Error(`Inferencia estructurada respondió con HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[CopilotService] Inferencia remota no disponible. Activando fallback local:', err.message);
      return null;
    }
  }

  /**
   * Interpreta un mensaje del usuario integrando LangChain Structured Outputs (Fase 5),
   * NLU, RAG y reglas de inferencia.
   *
   * @param {string} messageText
   * @param {object} [options]
   * @returns {Promise<{ reply: string, actionTaken: string|null, actionLabel: string|null, actionDescription: string|null, actionPayload: object|null, intent: string|null, logId: string|number|null, ruleId?: string }>}
   */
  async interpretMessage(messageText, options = {}) {
    // 1. INTENTO PRINCIPAL (FASE 5): Inferencia Estructurada con LangChain y Prompt de Fase 4
    const structuredResult = await this.inferStructured(messageText, options);

    if (structuredResult && (structuredResult.suggested_message || structuredResult.rule_id)) {
      const actionTaken = structuredResult.action_taken || null;
      const actionPayload = structuredResult.action_payload || null;
      const logId = structuredResult.log_id || structuredResult.id || null;

      let actionLabel = null;
      let actionDescription = null;

      if (actionPayload && (actionPayload.type || actionPayload.title)) {
        actionLabel = actionPayload.title || 'Acción sugerida';
        actionDescription = actionPayload.content || 'Optimización recomendada según tu ritmo de trabajo.';

        if (actionPayload.type === 'add_card') {
          actionLabel = actionPayload.title || 'Agregar al lienzo';
          actionDescription = actionPayload.content || 'Tarea sugerida por el copiloto para despejar la mente.';
        } else if (actionPayload.type === 'start_pomodoro') {
          actionLabel = `Iniciar Pomodoro (${actionPayload.focusMinutes || 25} min)`;
          actionDescription = 'Ciclo de enfoque recomendado para avanzar con claridad.';
        } else if (actionPayload.type === 'add_habit') {
          actionLabel = `Hábito: ${actionPayload.title || 'Nuevo hábito'}`;
          actionDescription = 'Meta mínima en tu tracker de productividad.';
        } else if (actionPayload.type === 'break_prompt') {
          actionLabel = 'Pausa recomendada';
          actionDescription = actionPayload.content || 'Momento para desconectar y recargar energías.';
        }
      }

      return {
        reply: structuredResult.suggested_message,
        actionTaken,
        actionLabel,
        actionDescription,
        actionPayload,
        intent: actionTaken || 'STRUCTURED_INFERENCE',
        ruleId: structuredResult.rule_id,
        logId
      };
    }

    // 2. FALLBACK RESILIENTE: NLU Local y Contexto RAG ensamblado
    const nluResult = await nluService.processInput(messageText);
    const promptData = await this.getAssembledPrompt(messageText);
    const logId = promptData?.contextSnapshot?.lastInferenceLogId || null;

    if (nluResult && nluResult.actionTaken) {
      return {
        reply: nluResult.reply,
        actionTaken: nluResult.actionTaken,
        actionLabel: nluResult.actionLabel,
        actionDescription: nluResult.actionDescription,
        actionPayload: nluResult.actionPayload || {},
        intent: nluResult.intent || null,
        logId
      };
    }

    if (promptData?.meta?.actionTaken && promptData.meta.actionTaken !== 'GENERAL_COPILOT_GUIDANCE') {
      const actionTaken = promptData.meta.actionTaken;
      let actionLabel = 'Acción sugerida';
      let actionDescription = 'Optimización recomendada según tu ritmo de trabajo.';

      if (actionTaken === 'INJECT_CONVERSATIONAL_ALERT') {
        actionLabel = 'Revisar objetivos pendientes';
        actionDescription = 'Identificamos tareas que requieren tu atención en el lienzo.';
      } else if (actionTaken === 'RECOMMEND_PROJECT_PLAN') {
        actionLabel = 'Dividir tareas de proyecto';
        actionDescription = 'Desglosar tarjetas inactivas en acciones más pequeñas.';
      } else if (actionTaken === 'LOCK_POMODORO_COOLDOWN') {
        actionLabel = 'Pausa de enfriamiento';
        actionDescription = 'Pausa sugerida tras sesiones continuas de concentración.';
      }

      return {
        reply: promptData.systemPrompt || 'Identifiqué una sugerencia basada en tu ritmo de trabajo en F.O.C.O.',
        actionTaken,
        actionLabel,
        actionDescription,
        actionPayload: {},
        intent: actionTaken,
        logId
      };
    }

    let reply = '';
    if (promptData?.retrievedPassages?.length > 0) {
      const topTitle = promptData.retrievedPassages[0].title || promptData.retrievedPassages[0].text || '';
      reply = `Encontré información relacionada en tu segundo cerebro: "${topTitle}". ¿Te gustaría que la vinculemos a una tarea o configuremos un bloque de estudio?`;
    } else {
      reply = nluResult.reply || `Entendido: "${messageText}". Como Copiloto de F.O.C.O., estoy listo para ayudarte a organizar notas, planificar tu rutina o monitorear tus hábitos.`;
    }

    return {
      reply,
      actionTaken: null,
      actionLabel: null,
      actionDescription: null,
      actionPayload: null,
      intent: 'GENERAL_CHAT',
      logId
    };
  }
}

export const copilotService = new CopilotService();

