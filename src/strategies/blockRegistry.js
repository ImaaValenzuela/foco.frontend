/**
 * Strategy/Registry: BlockRegistry
 * Permite registrar y mapear tipos de bloques P.A.R.A. de forma extensible.
 * Cumple con el principio Open/Closed (OCP) evitando modificar componentes de UI al añadir nuevos bloques.
 */

export class BlockRegistry {
  constructor() {
    this.registry = new Map([
      ["bloque-objetivos-activos", "active_objectives"],
      ["bloque-personal", "personal_block"],
      ["bloque-inspiracion", "inspiration_creativity"],
      ["bloque-archivo-vida", "life_archive"]
    ]);
  }

  registerBlockType(domId, backendType) {
    this.registry.set(domId, backendType);
  }

  getBackendType(domId) {
    return this.registry.get(domId) || "custom_block";
  }

  hasBlockType(domId) {
    return this.registry.has(domId);
  }
}

export const blockRegistry = new BlockRegistry();
