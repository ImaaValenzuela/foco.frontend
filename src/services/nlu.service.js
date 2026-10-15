import { getToken } from '../auth.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Servicio NLU (Natural Language Understanding) de F.O.C.O.
 * Interpreta intenciones operativas desde texto o audio (Whisper STT).
 */
export class NluService {
  /**
   * Limpia palabras de relleno para extraer la entidad real de la orden.
   */
  static cleanEntity(rawText, patterns = []) {
    let clean = String(rawText || '').trim();
    for (const pat of patterns) {
      clean = clean.replace(pat, ' ');
    }
    // Limpiar palabras funcionales y artículos al inicio de la frase
    clean = clean.replace(/^(?:\s*(?:de|para|que|un|una|unos|unas|el|la|los|las|mis?|tus?)\s+)+/gi, ' ');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
  }

  /**
   * Clasificador NLU local ultra-rápido para intenciones operativas de F.O.C.O.
   * Procesa órdenes como:
   *  - "Agregá una nota de repasar React"
   *  - "Creá un hábito de tomar agua"
   *  - "Iniciá un Pomodoro de 25 min"
   *
   * @param {string} rawText Texto dictado o escrito por el usuario
   * @returns {object} { intent, actionTaken, actionLabel, actionDescription, actionPayload, reply }
   */
  parseIntent(rawText) {
    const text = String(rawText || '').trim();

    // 1. INTENCIÓN: POMODORO (Temporizador de enfoque)
    const isPomodoro = /(?:^|[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_])(?:pomodoro|temporizador|timer|sesi[oó]n\s+de\s+foco|modo\s+foco|concentraci[oó]n)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/i.test(text);
    if (isPomodoro) {
      // Extraer minutos si fueron especificados (ej: "de 25 min", "30 minutos", "45m")
      const minMatch = text.match(/\b(\d{1,3})\s*(?:minutos?|mins?|m)\b/i) || text.match(/\b(\d{1,3})\b/);
      let focusMinutes = 25;
      if (minMatch) {
        const parsed = parseInt(minMatch[1], 10);
        if (parsed > 0 && parsed <= 180) {
          focusMinutes = parsed;
        }
      }

      return {
        intent: 'START_POMODORO',
        actionTaken: 'CONFIG_POMODORO',
        actionLabel: `Pomodoro: ${focusMinutes} min de enfoque`,
        actionDescription: `Iniciar un ciclo de trabajo de ${focusMinutes} minutos en la barra de productividad.`,
        actionPayload: { focusMinutes },
        reply: `¡Listo para enfocarnos! Preparé un ciclo Pomodoro de ${focusMinutes} minutos. Hacé clic en "Ejecutar en el lienzo" para comenzarlo de inmediato.`
      };
    }

    // 2. INTENCIÓN: HÁBITO (Tracker de Hábitos)
    const isHabit = /(?:^|[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_])(?:h[aá]bitos?|rutinas?)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/i.test(text);
    if (isHabit) {
      const habitName = NluService.cleanEntity(text, [
        /(?:^|[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_])(?:foco|crea|crear|cre[aá]|agrega|agregar|agreg[aá]|nuevo|nueva|anota|anotar|h[aá]bitos?|rutinas?)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/gi
      ]) || 'Nuevo hábito';

      return {
        intent: 'CREATE_HABIT',
        actionTaken: 'ADD_HABIT',
        actionLabel: `Hábito: ${habitName}`,
        actionDescription: `Registrar "${habitName}" en tu tracker diario de hábitos.`,
        actionPayload: { name: habitName },
        reply: `¡Excelente iniciativa! La constancia es la clave del progreso. Podés registrar el hábito "${habitName}" haciendo clic en "Ejecutar en el lienzo".`
      };
    }

    // 3. INTENCIÓN: TAREA (Task con checkbox en Objetivos Activos)
    const isTask = /(?:^|[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_])(?:tareas?|pendientes?|recordatorios?|to-?do)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/i.test(text);
    if (isTask) {
      const taskText = NluService.cleanEntity(text, [
        /(?:^|[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_])(?:foco|crea|crear|cre[aá]|agrega|agregar|agreg[aá]|nueva|nuevo|anota|anotar|tareas?|pendientes?|recordatorios?)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/gi,
        /(?:en|para)?\s*(?:el|la)?\s*(?:bloque\s+)?(?:de\s+)?(?:objetivos?\s+activos?|personal|inspiraci[oó]n|archivo\s+de\s+vida)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/gi
      ]) || text;

      let targetBlock = 'active_objectives';
      if (/\bpersonal\b/i.test(text)) targetBlock = 'personal_block';

      return {
        intent: 'CREATE_BLOCK_ITEM',
        actionTaken: 'ADD_NOTE',
        actionLabel: `Tarea: ${taskText}`,
        actionDescription: `Crear tarjeta de tarea verificable en Objetivos Activos.`,
        actionPayload: { text: taskText, targetBlock, isTask: true },
        reply: `Anotado. Tener tus tareas pendientes visibles reduce la sobrecarga cognitiva. Hacé clic en "Ejecutar en el lienzo" para insertar "${taskText}".`
      };
    }

    // 4. INTENCIÓN: NOTA / TARJETA GENERAL (Lienzo Canvas)
    const isNote = /(?:^|[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_])(?:notas?|apuntes?|anotaci[oó]n|anotar|anot[aá]|recordar|guardar|guarda|guard[aá]|escribir|agreg[aá]r?|cre[aá]r?)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/i.test(text);
    if (isNote) {
      const noteText = NluService.cleanEntity(text, [
        /(?:^|[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_])(?:foco|crea|crear|cre[aá]|agrega|agregar|agreg[aá]|nueva|nuevo|anota|anotar|anot[aá]|guardar|guarda|guard[aá]|notas?|apuntes?)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/gi,
        /(?:en|para)?\s*(?:el|la)?\s*(?:bloque\s+)?(?:de\s+)?(?:objetivos?\s+activos?|personal|inspiraci[oó]n|archivo\s+de\s+vida)(?=[^a-záéíóúñA-ZÁÉÍÓÚÑ0-9_]|$)/gi
      ]) || text;

      let targetBlock = 'active_objectives';
      let blockHumanName = 'Objetivos Activos';

      if (/\bpersonal\b/i.test(text)) {
        targetBlock = 'personal_block';
        blockHumanName = 'Bloque Personal';
      } else if (/\binspiraci[oó]n|creatividad|ideas?\b/i.test(text)) {
        targetBlock = 'inspiration_creativity';
        blockHumanName = 'Inspiración y Creatividad';
      } else if (/\barchivo|bit[aá]cora|vida\b/i.test(text)) {
        targetBlock = 'life_archive';
        blockHumanName = 'Archivo de Vida';
      }

      return {
        intent: 'CREATE_BLOCK_ITEM',
        actionTaken: 'ADD_NOTE',
        actionLabel: `Nota: ${noteText}`,
        actionDescription: `Añadir tarjeta al bloque de ${blockHumanName}.`,
        actionPayload: { text: noteText, targetBlock, isTask: false },
        reply: `Entendido. Despejar tu mente anotando tus pensamientos en el lienzo es fundamental. Hacé clic en "Ejecutar en el lienzo" para plasmar "${noteText}".`
      };
    }

    // 5. INTENCIÓN: PAUSA / DESCANSO
    const isBreak = /\b(descans[ao]|pausa|recreo|cansad[oa]|fatiga|respiro)\b/i.test(text);
    if (isBreak) {
      return {
        intent: 'SHOW_BREAK_PROMPT_UI',
        actionTaken: 'SHOW_BREAK_PROMPT_UI',
        actionLabel: 'Pausa activa y descanso',
        actionDescription: 'Tomar un recreo de 10 minutos para despejar la mente y evitar fatiga.',
        actionPayload: { breakMinutes: 10 },
        reply: 'Identifiqué que necesitás un respiro. Tomarte unos minutos para estirar el cuerpo o tomar agua mejorará tu concentración.'
      };
    }

    // Fallback conversacional general
    return {
      intent: 'GENERAL_CHAT',
      actionTaken: null,
      actionLabel: null,
      actionDescription: null,
      actionPayload: null,
      reply: `Recibí tu mensaje: "${text}". Como Copiloto de F.O.C.O., podés pedirme que agregue una nota, cree un hábito o inicie un Pomodoro.`
    };
  }

  /**
   * Interpreta un texto combinando el análisis local de alta velocidad con el backend si está disponible.
   *
   * @param {string} text Entrada de texto o transcripción de audio
   * @returns {Promise<object>} Resultado de interpretación NLU
   */
  async processInput(text) {
    // 1. Inferencia local ultra-rápida y determinista
    const localResult = this.parseIntent(text);

    // Si reconoció una intención operativa clara, retornarla de inmediato
    if (localResult.actionTaken) {
      return localResult;
    }

    // 2. Si es general, intentar consultar backend NLU / RAG con timeout seguro
    try {
      const token = await getToken();
      if (token) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const res = await fetch(`${API_BASE}/nlu/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.type) {
            return {
              ...localResult,
              actionTaken: data.type === 'HABIT' ? 'ADD_HABIT' : 'ADD_NOTE',
              actionLabel: data.message || 'Elemento detectado por IA',
              actionDescription: 'Integración automática detectada en backend.',
              actionPayload: data.data || { text }
            };
          }
        }
      }
    } catch {
      // Ignorar fallback de red
    }

    return localResult;
  }
}

export const nluService = new NluService();
export default nluService;
