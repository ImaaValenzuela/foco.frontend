import { useCallback } from 'react';
import { canvasMutators } from '../services/canvasMutators.js';

/**
 * Hook de React: useCanvas
 * Expone las funciones mutadoras del estado del lienzo para componentes React.
 */
export function useCanvas() {
  const addCard = useCallback(async (payload) => {
    return await canvasMutators.addCard(payload);
  }, []);

  const startPomodoro = useCallback(async (payload) => {
    return await canvasMutators.startPomodoro(payload);
  }, []);

  const addHabit = useCallback(async (name) => {
    return await canvasMutators.addHabit(name);
  }, []);

  const toggleHabit = useCallback(async (habitId) => {
    return await canvasMutators.toggleHabit(habitId);
  }, []);

  const executeAction = useCallback(async (actionTaken, actionPayload) => {
    return await canvasMutators.executeNluAction(actionTaken, actionPayload);
  }, []);

  return {
    addCard,
    startPomodoro,
    addHabit,
    toggleHabit,
    executeAction,
    mutators: canvasMutators
  };
}

export default useCanvas;
