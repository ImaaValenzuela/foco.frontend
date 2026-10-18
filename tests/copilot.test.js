import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CopilotService } from '../src/services/copilot.service';

vi.mock('../src/auth.js', () => ({
  getToken: vi.fn(() => Promise.resolve('mock-jwt-token'))
}));

describe('CopilotService (Frontend)', () => {
  let copilotService;

  beforeEach(() => {
    vi.clearAllMocks();
    copilotService = new CopilotService();
    global.fetch = vi.fn();
  });

  it('getAssembledPrompt ejecuta GET cuando no se pasa query', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        systemPrompt: '[ROL Y PERSONALIDAD]...',
        meta: { ruleId: 'F_FAT_PREVENCION_DUMP' },
        retrievedPassages: []
      })
    });

    const result = await copilotService.getAssembledPrompt();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/copilot/prompt'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result.meta.ruleId).toBe('F_FAT_PREVENCION_DUMP');
  });

  it('getAssembledPrompt ejecuta POST cuando se pasa query', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        systemPrompt: '[ROL Y PERSONALIDAD]...',
        meta: { passagesCount: 1 },
        retrievedPassages: [{ id: 'note-1' }]
      })
    });

    const result = await copilotService.getAssembledPrompt('mi proyecto');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/copilot/prompt'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'mi proyecto' })
      })
    );
    expect(result.retrievedPassages).toHaveLength(1);
  });

  it('searchSemantic ejecuta POST /ai/rag/search y retorna pasajes', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        query: 'matematicas',
        passages: [{ id: 'p-1', title: 'Apuntes de mates' }]
      })
    });

    const passages = await copilotService.searchSemantic('matematicas', 3, 0.3);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/rag/search'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'matematicas', limit: 3, threshold: 0.3 })
      })
    );
    expect(passages).toHaveLength(1);
    expect(passages[0].title).toBe('Apuntes de mates');
  });

  it('retorna fallback seguro ante error de red en getAssembledPrompt', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await copilotService.getAssembledPrompt();
    expect(result.meta.usedFallback).toBe(true);
    expect(result.retrievedPassages).toEqual([]);
  });

  describe('Fase 5: Structured Outputs con LangChain y Feedback Loop', () => {
    it('inferStructured ejecuta POST /ai/infer y retorna objeto estructurado', async () => {
      const mockStructured = {
        rule_id: 'F_DISP_DESVIO_ESTUDIO',
        suggested_message: "¡Hola! Noté que tenés un objetivo pendiente ('Repasar React'). ¿Qué tal si hoy le dedicamos un solo ciclo Pomodoro?",
        action_taken: 'INJECT_CONVERSATIONAL_ALERT',
        action_payload: {
          type: 'add_card',
          block_type: 'active_objectives',
          title: 'Repasar React - Ciclo Pomodoro',
          content: 'Tarea sugerida por el copiloto para despejar la mente'
        },
        log_id: 'log-fase5-test-1'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStructured)
      });

      const res = await copilotService.inferStructured('Repasar React', { ruleId: 'F_DISP_DESVIO_ESTUDIO' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai/infer'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message: 'Repasar React',
            rule_id: 'F_DISP_DESVIO_ESTUDIO',
            customAction: null
          })
        })
      );
      expect(res.rule_id).toBe('F_DISP_DESVIO_ESTUDIO');
      expect(res.action_payload.type).toBe('add_card');
    });

    it('interpretMessage procesa y mapea la respuesta estructurada de Fase 5', async () => {
      const mockStructured = {
        rule_id: 'F_DISP_DESVIO_ESTUDIO',
        suggested_message: '¡Hola, Alex! Noté que tenés un objetivo pendiente...',
        action_taken: 'INJECT_CONVERSATIONAL_ALERT',
        action_payload: {
          type: 'add_card',
          block_type: 'active_objectives',
          title: 'Repasar React - Ciclo Pomodoro',
          content: 'Tarea sugerida por el copiloto'
        },
        log_id: 'log-fase5-789'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStructured)
      });

      const interpreted = await copilotService.interpretMessage('Repasar React');
      expect(interpreted.reply).toBe('¡Hola, Alex! Noté que tenés un objetivo pendiente...');
      expect(interpreted.actionTaken).toBe('INJECT_CONVERSATIONAL_ALERT');
      expect(interpreted.actionPayload.type).toBe('add_card');
      expect(interpreted.actionLabel).toBe('Repasar React - Ciclo Pomodoro');
      expect(interpreted.logId).toBe('log-fase5-789');
    });

    it('sendFeedback envía POST /ai/copilot/feedback con logId y persistencia', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, logId: 'log-fase5-789', user_feedback: 'positive' })
      });

      const feedbackRes = await copilotService.sendFeedback({
        messageId: 'msg-123',
        logId: 'log-fase5-789',
        rating: 'positive',
        actionTaken: 'INJECT_CONVERSATIONAL_ALERT'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai/copilot/feedback'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"logId":"log-fase5-789"')
        })
      );
      expect(feedbackRes.success).toBe(true);
    });
  });
});

