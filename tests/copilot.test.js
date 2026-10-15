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
});
