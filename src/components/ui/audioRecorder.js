// src/components/ui/audioRecorder.js
import { getSession } from "../../auth.js";
import { ingestService } from "../../services/ingest.service.js";
import { emitCustomEvent } from "../../utils/events.js";
// Importamos el worker usando la sintaxis nativa de Vite
import WhisperWorker from '../../workers/whisper.worker.js?worker';

class FocoAudioRecorder extends HTMLElement {
  connectedCallback() {
    this.className = "fixed bottom-8 right-8 z-50 flex items-center gap-3";
    
    // UI del botón
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

    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    // Inicializar Worker
    this.worker = new WhisperWorker();
    this.setupWorkerListeners();
    
    // Cargar modelo en background
    this.worker.postMessage({ type: 'LOAD_MODEL' });

    this.btn.addEventListener('click', () => this.toggleRecording());
  }

  setupWorkerListeners() {
    this.worker.addEventListener('message', async (e) => {
      const { status, text, error } = e.data;

      if (status === 'loading') this.showStatus('Cargando Motor IA...');
      if (status === 'ready') this.showStatus('IA Lista', 2000);
      if (status === 'transcribing') this.showStatus('Transcribiendo audio (Local)...');
      
      if (status === 'success') {
        this.showStatus('Enviando a F.O.C.O...');
        console.log("Texto detectado:", text); // Validación Capa 1
        await this.sendToBackend(text);
      }

      if (status === 'error') {
        console.error("Error en Whisper:", error);
        this.showStatus('Error en transcripción', 3000);
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
        audio: { 
          noiseSuppression: true, 
          echoCancellation: true,
          autoGainControl: true 
        } 
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
      
      // UI Updates
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
      
      // UI Updates
      this.btn.classList.replace('bg-red-500', 'bg-foco-blue-deep');
      this.btn.classList.replace('hover:bg-red-600', 'hover:bg-blue-800');
      this.pulse.classList.remove('animate-ping', 'opacity-100');
    }
  }

  // Convierte el Blob a Float32Array a 16kHz exactos (Requisito estricto de Whisper)
  async processAudioBlob(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    // AudioContext maneja el resampling automáticamente a 16000Hz
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const float32Data = audioBuffer.getChannelData(0); // Canal mono
    
    // Enviar al Worker
    this.worker.postMessage({ type: 'TRANSCRIBE', audioData: float32Data });
  }

  async sendToBackend(text) {
    try {
      const sesion = await getSession();
      if (!sesion) throw new Error("Debes iniciar sesión para usar la IA");

      // Enviamos el texto al backend para la clasificación BERT/SBERT
      const result = await ingestService.ingestText(text, sesion.access_token);
      
      this.showStatus('¡Bloque actualizado!', 3000);
      
      // Disparamos un evento global para que lienzoCanvas se recargue
      emitCustomEvent(document, 'foco:refresh-canvas');

    } catch (error) {
      console.error(error);
      this.showStatus('Error de conexión', 3000);
    }
  }

  showStatus(msg, timeout = 0) {
    this.statusUI.textContent = msg;
    this.statusUI.classList.remove('hidden');
    if (timeout > 0) {
      setTimeout(() => this.statusUI.classList.add('hidden'), timeout);
    }
  }
}

customElements.define('foco-audio-recorder', FocoAudioRecorder);