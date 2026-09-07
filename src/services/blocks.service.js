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

  // Método para actualizar el contenido de una nota (Edición)
  async updateBlock(id, content, token) {
    if (!token || !id) throw new Error('Se requiere un token e ID para actualizar.');
    const response = await fetch(`${this.baseUrl}/blocks/${id}`, {
      method: 'PUT', // o PATCH, dependiendo de tu backend
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error(`Error al actualizar bloque: Status ${response.status}`);
    return response.json();
  }

  // Método para eliminar una nota
  async deleteBlock(id, token) {
    if (!token || !id) throw new Error('Se requiere un token e ID para eliminar.');
    const response = await fetch(`${this.baseUrl}/blocks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Error al eliminar bloque: Status ${response.status}`);
    return true;
  }
}


export const blocksService = new BlocksService();
