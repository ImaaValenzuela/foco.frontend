/**
 * Utility & Registry: ValidatorRegistry
 * Reglas puras de validación de campos con soporte para registro extensible.
 * Cumple con SRP (validaciones puras) y OCP (permite añadir nuevos validadores sin modificar el módulo).
 */

class ValidatorRegistry {
  constructor() {
    this.strategies = new Map([
      ['email', (val) => typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())],
      ['name', (val) => typeof val === 'string' && val.trim().length >= 3],
      ['password', (val) => typeof val === 'string' && val.length >= 6],
      ['confirm', (val, compareWith) => val === compareWith],
    ]);
  }

  registerValidator(name, fn) {
    if (typeof fn === 'function') {
      this.strategies.set(name, fn);
    }
  }

  validate(type, value, extraParam = null) {
    const fn = this.strategies.get(type);
    if (!fn) return true;
    return fn(value, extraParam);
  }

  // Métodos directos convenientes
  isEmail(val) { return this.validate('email', val); }
  isName(val) { return this.validate('name', val); }
  isPassword(val) { return this.validate('password', val); }
}

export const validators = new ValidatorRegistry();
