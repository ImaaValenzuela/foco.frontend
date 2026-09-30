import { getSession } from "../../auth.js";
import { ingestService } from "../../services/ingest.service.js";
import { emitCustomEvent } from "../../utils/events.js";
import WhisperWorker from '../../workers/whisper.worker.js?worker';

class FocoAudioRecorder extends HTMLElement {
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

    // BLINDAJE 1: La función se ancla a la memoria de la instancia apenas nace.
    // Esto evita que el "Hot Module Replacement" de Vite la vuelva invisible.
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
    // BLINDAJE 2: Congelamos el contexto para los eventos asíncronos del Worker
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
      this.showStatus('Escuchando...'); // Ya no lanzará undefined
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

customElements.define('foco-audio-recorder', FocoAudioRecorder);