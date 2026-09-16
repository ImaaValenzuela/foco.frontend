// src/workers/whisper.worker.js
import { pipeline, env } from '@xenova/transformers';

// Deshabilitamos modelos locales para que lo descargue desde HuggingFace al caché del navegador
env.allowLocalModels = false;

let transcriber = null;

// Escuchamos los mensajes del hilo principal
self.addEventListener('message', async (event) => {
  const { type, audioData } = event.data;

  if (type === 'LOAD_MODEL') {
    try {
      self.postMessage({ status: 'loading' });
      // Cargamos el modelo Whisper-base
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base');
    self.postMessage({ status: 'ready' });
    } catch (error) {
      self.postMessage({ status: 'error', error: error.message });
    }
  } 
  
  else if (type === 'TRANSCRIBE' && transcriber) {
    try {
      self.postMessage({ status: 'transcribing' });
      // Ejecutamos la inferencia sobre el Float32Array (audioData)
      const output = await transcriber(audioData, {
        language: 'spanish',
        task: 'transcribe',
        no_repeat_ngram_size: 2, // Prohíbe repetir secuencias de palabras
        without_timestamps: true, // Mejora drásticamente audios cortos sin contexto
        // Le damos algún contexto a la IA de vocabulario habitual de FOCO para que no intente adivinar
        prompt: "Foco, bloques, objetivos activos, personal, inspiración, tarea, nota, pomodoro, habitos"
      });
      self.postMessage({ status: 'success', text: output.text });
    } catch (error) {
      self.postMessage({ status: 'error', error: error.message });
    }
  }
});