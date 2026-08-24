/**
 * Service: BlocksService
 * Capa de abstracción para la gestión de bloques P.A.R.A. mediante la API REST del backend.
 * Cumple con DIP aislando la URL base, la estrategia de fetch y la serialización del cliente de UI.
 */

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class BlocksService {
  constructor(baseUrl = DEFAULT_API_URL) {
    this.baseUrl = baseUrl;
  }

  async saveBlock(type, content, token) {
    if (!token) {
      throw new Error('Se requiere un token de autenticación para guardar el bloque.');
    }

    const response = await fetch(`${this.baseUrl}/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, content })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al guardar bloque: Status ${response.status}`);
    }

    return response.json();
  }

  async fetchBlocks(token, userId) {
    if (!token) return [];

    if (!userId) return [];

    const response = await fetch(`${this.baseUrl}/blocks/user/${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener bloques: Status ${response.status}`);
    }

    return response.json();
  }

  async deleteBlock(id, token) {
    const response = await fetch(`${this.baseUrl}/blocks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error al eliminar bloque: Status ${response.status}`);
  }

  async updateBlock(id, type, token) {
    const response = await fetch(`${this.baseUrl}/blocks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type }),
    });
    if (!response.ok) throw new Error(`Error al actualizar bloque: Status ${response.status}`);
    return response.json();
  }
}

export const blocksService = new BlocksService();
