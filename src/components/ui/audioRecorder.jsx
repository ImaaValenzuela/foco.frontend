import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { getSession } from "../../auth.js";
import { ingestService } from "../../services/ingest.service.js";
import { emitCustomEvent } from "../../utils/events.js";
import WhisperWorker from '../../workers/whisper.worker.js?worker';

/**
 * Controlador de grabación de voz y transcripción Whisper local.
 * Reutilizable por AudioRecorder y ChatbotModal.
 */
export class AudioRecorderController {
  constructor({ onStatus, onTranscription, onError } = {}) {
    this.onStatus = onStatus || (() => {});
    this.onTranscription = onTranscription || (() => {});
    this.onError = onError || (() => {});
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.worker = null;
    this.stream = null;
    this.initWorker();
  }

  initWorker() {
    try {
      if (typeof Worker !== 'undefined') {
        this.worker = new WhisperWorker();
        this.worker.addEventListener('message', async (e) => {
          const { status, text, error } = e.data || {};
          if (status === 'loading') this.onStatus('Cargando Motor IA...');
          if (status === 'ready') this.onStatus('IA Lista', 2000);
          if (status === 'transcribing') this.onStatus('Transcribiendo audio (Local)...');
          if (status === 'success') {
            this.onStatus('Transcripción completada', 2000);
            if (text) {
              this.onTranscription(text);
            }
          }
          if (status === 'error') {
            console.error('[AudioRecorderController] Error en Whisper:', error);
            this.onStatus('Error en transcripción', 3000);
            this.onError(error);
          }
        });
        this.worker.postMessage({ type: 'LOAD_MODEL' });
      }
    } catch (err) {
      console.warn('[AudioRecorderController] Worker no inicializado:', err?.message);
    }
  }

  async start() {
    if (this.isRecording) return false;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de micrófono no soportada en este entorno');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
      });
      this.stream = stream;
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          await this.processAudioBlob(audioBlob);
        } catch (procErr) {
          console.error('[AudioRecorderController] Error procesando audio:', procErr);
          this.onStatus('Error procesando audio', 3000);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.onStatus('Escuchando...');
      return true;
    } catch (err) {
      console.error('[AudioRecorderController] Permiso de micrófono denegado:', err);
      this.onStatus('Micrófono denegado', 3000);
      this.onError(err);
      return false;
    }
  }

  stop() {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch {}
      if (this.stream) {
        try {
          this.stream.getTracks().forEach((track) => track.stop());
        } catch {}
        this.stream = null;
      }
      this.isRecording = false;
    }
  }

  async toggle() {
    if (!this.isRecording) {
      return await this.start();
    } else {
      this.stop();
      return false;
    }
  }

  async processAudioBlob(blob) {
    if (!this.worker) return;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) throw new Error('AudioContext no soportado');
      const audioContext = new AudioCtx({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const float32Data = audioBuffer.getChannelData(0);
      this.worker.postMessage({ type: 'TRANSCRIBE', audioData: float32Data });
    } catch (err) {
      console.error('[AudioRecorderController] Error procesando buffer de audio:', err);
      this.onStatus('Error procesando audio', 3000);
    }
  }

  destroy() {
    this.stop();
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
  }
}

/**
 * Componente React: AudioRecorder (F.O.C.O. Voice & AI Ingestion)
 * Optimizado con React.memo, useCallback y manejo eficiente de estados.
 */
export const AudioRecorder = memo(function AudioRecorder() {
  const [statusMsg, setStatusMsg] = useState('');
  const [statusVisible, setStatusVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const workerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const showStatus = useCallback((msg, timeout = 0) => {
    setStatusMsg(msg);
    setStatusVisible(true);
    if (timeout > 0) {
      setTimeout(() => setStatusVisible(false), timeout);
    }
  }, []);

  const sendToBackend = useCallback(async (text) => {
    try {
      const sesion = await getSession();
      if (!sesion) throw new Error("Debes iniciar sesión");

      const result = await ingestService.ingestText(text, sesion.access_token);
      showStatus(result.message || '¡Guardado!', 3000);

      if (result.type === 'HABIT') {
        emitCustomEvent(document, 'foco:refresh-habits');
      } else {
        emitCustomEvent(document, 'foco:refresh-canvas');
      }
    } catch (error) {
      console.error("Error al enviar al backend:", error);
      showStatus('Error de conexión', 3000);
    }
  }, [showStatus]);

  useEffect(() => {
    const worker = new WhisperWorker();
    workerRef.current = worker;

    worker.addEventListener('message', async (e) => {
      const { status, text, error } = e.data;

      if (status === 'loading') showStatus('Cargando Motor IA...');
      if (status === 'ready') showStatus('IA Lista', 2000);
      if (status === 'transcribing') showStatus('Transcribiendo audio (Local)...');

      if (status === 'success') {
        showStatus('Enviando a F.O.C.O...');
        console.log("Texto detectado:", text);
        await sendToBackend(text);
      }

      if (status === 'error') {
        console.error("Error en Whisper:", error);
        showStatus('Error en transcripción', 3000);
      }
    });

    worker.postMessage({ type: 'LOAD_MODEL' });

    return () => {
      worker.terminate();
    };
  }, [sendToBackend, showStatus]);

  const processAudioBlob = useCallback(async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const float32Data = audioBuffer.getChannelData(0);

    workerRef.current?.postMessage({ type: 'TRANSCRIBE', audioData: float32Data });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      showStatus('Escuchando...');
    } catch (err) {
      console.error("Permiso de micrófono denegado:", err);
      showStatus('Micrófono denegado', 3000);
    }
  }, [processAudioBlob, showStatus]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
      <div
        id="ai-status"
        className={`${statusVisible ? '' : 'hidden'} bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg transition-all`}
      >
        {statusMsg || 'Cargando IA...'}
      </div>
      <button
        id="mic-btn"
        onClick={toggleRecording}
        className={`w-14 h-14 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-foco-blue-deep hover:bg-blue-800'} text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 group relative`}
      >
        <svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        <div id="recording-pulse" className={`absolute inset-0 rounded-full border-4 border-red-500 ${isRecording ? 'animate-ping opacity-100' : 'opacity-0 scale-100'} transition-all`}></div>
      </button>
    </div>
  );
});

/**
 * Custom Element Wrapper FocoAudioRecorder
 * Garantiza compatibilidad retroactiva con <foco-audio-recorder> en el lienzo canvas.
 */
export class FocoAudioRecorder extends HTMLElement {
  connectedCallback() {
    this.className = "fixed bottom-8 right-8 z-50 flex items-center gap-3";
    
    this.innerHTML = `
      <div id="ai-status" class="hidden bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg transition-all">
        Cargando IA...
      </div>
      <button id="mic-btn" class="w-14 h-14 bg-foco-blue-deep hover:bg-blue-800 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 group relative">
        <svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        <div id="recording-pulse" class="absolute inset-0 rounded-full border-4 border-red-500 opacity-0 scale-100 transition-all"></div>
      </button>
    `;

    this.btn = this.querySelector('#mic-btn');
    this.icon = this.querySelector('#mic-icon');
    this.pulse = this.querySelector('#recording-pulse');
    this.statusUI = this.querySelector('#ai-status');

    this.showStatus = (msg, timeout = 0) => {
      if (!this.statusUI) return;
      this.statusUI.textContent = msg;
      this.statusUI.classList.remove('hidden');
      if (timeout > 0) {
        setTimeout(() => this.statusUI.classList.add('hidden'), timeout);
      }
    };

    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    this.worker = new WhisperWorker();
    this.setupWorkerListeners();
    this.worker.postMessage({ type: 'LOAD_MODEL' });

    this.btn.addEventListener('click', () => this.toggleRecording());
  }

  setupWorkerListeners() {
    const self = this; 

    this.worker.addEventListener('message', async (e) => {
      const { status, text, error } = e.data;

      if (status === 'loading') self.showStatus('Cargando Motor IA...');
      if (status === 'ready') self.showStatus('IA Lista', 2000);
      if (status === 'transcribing') self.showStatus('Transcribiendo audio (Local)...');
      
      if (status === 'success') {
        self.showStatus('Enviando a F.O.C.O...');
        console.log("Texto detectado:", text); 
        await self.sendToBackend(text);
      }

      if (status === 'error') {
        console.error("Error en Whisper:", error);
        self.showStatus('Error en transcripción', 3000);
      }
    });
  }

  async toggleRecording() {
    if (!this.isRecording) {
      await this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } 
      });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.processAudioBlob(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      
      this.btn.classList.replace('bg-foco-blue-deep', 'bg-red-500');
      this.btn.classList.replace('hover:bg-blue-800', 'hover:bg-red-600');
      this.pulse.classList.add('animate-ping', 'opacity-100');
      this.showStatus('Escuchando...');
    } catch (err) {
      console.error("Permiso de micrófono denegado:", err);
      this.showStatus('Micrófono denegado', 3000);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
      
      this.btn.classList.replace('bg-red-500', 'bg-foco-blue-deep');
      this.btn.classList.replace('hover:bg-red-600', 'hover:bg-blue-800');
      this.pulse.classList.remove('animate-ping', 'opacity-100');
    }
  }

  async processAudioBlob(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const float32Data = audioBuffer.getChannelData(0);
    
    this.worker.postMessage({ type: 'TRANSCRIBE', audioData: float32Data });
  }

  async sendToBackend(text) {
    try {
      const sesion = await getSession();
      if (!sesion) throw new Error("Debes iniciar sesión");

      const result = await ingestService.ingestText(text, sesion.access_token);
      this.showStatus(result.message || '¡Guardado!', 3000);
      
      if (result.type === 'HABIT') {
        emitCustomEvent(document, 'foco:refresh-habits'); 
      } else {
        emitCustomEvent(document, 'foco:refresh-canvas'); 
      }
    } catch (error) {
      console.error("Error al enviar al backend:", error);
      this.showStatus('Error de conexión', 3000);
    }
  }
}

if (!customElements.get('foco-audio-recorder')) {
  customElements.define('foco-audio-recorder', FocoAudioRecorder);
}

export default AudioRecorder;
