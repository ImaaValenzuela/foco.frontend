/**
 * Utility: Validators
 * Reglas puras de validación de campos.
 * Cumple con SRP al aislar la lógica de validación sin acoplamiento con la UI o el DOM.
 */

export const validators = {
  isEmail: (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
  isName: (name) => typeof name === 'string' && name.trim().length >= 3,
  isPassword: (pass) => typeof pass === 'string' && pass.length >= 6,
  isMatch: (val1, val2) => val1 === val2,
};
