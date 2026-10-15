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
}

export const copilotService = new CopilotService();
