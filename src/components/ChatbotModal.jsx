import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import logoUrl from '../images/logo.svg';
import { copilotService } from '../services/copilot.service.js';
import { canvasMutators } from '../services/canvasMutators.js';
import { AudioRecorderController } from './ui/audioRecorder.jsx';
import { escucharCambiosDePaleta, aplicarPaleta, obtenerPaletaActual } from '../managers/paletteManager.js';

const STORAGE_CHAT_KEY = 'foco_chat_history_v1';

const INITIAL_WELCOME_MESSAGE = {
  id: 'msg-welcome-0',
  role: 'assistant',
  content: '¡Hola! Soy tu Copiloto F.O.C.O. 🧠\n\nPuedo ayudarte a organizar tus notas, planificar bloques de trabajo, configurar tu Pomodoro o registrar nuevos hábitos.\n\nPodés escribirme o hablarme por voz en cualquier momento (ej: "Agregá una nota de repasar React", "Iniciá un Pomodoro de 25 min", "Creá un hábito de tomar agua").',
  timestamp: new Date().toISOString(),
  actionTaken: null,
  actionLabel: null,
  actionDescription: null,
  actionPayload: null,
  isExecuted: false,
  feedback: null,
};

/**
 * Componente React: ChatbotModal (F.O.C.O. Floating AI Copilot & Voice STT)
 * Integra entrada dual de voz y texto, pipeline NLU, botón azul "Ejecutar en el lienzo"
 * y binding reactivo con los mutadores de estado del tablero.
 */
export const ChatbotModal = memo(function ChatbotModal({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[ChatbotModal] Error al cargar historial del chat:', e);
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sttStatus, setSttStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [rightOffset, setRightOffset] = useState('6rem'); // 96px por defecto (sidebar colapsada)

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const audioControllerRef = useRef(null);
  const modalContainerRef = useRef(null);

  // 1. Guardar historial en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('[ChatbotModal] No se pudo guardar historial:', e);
    }
  }, [messages]);

  // 2. Desplazar al último mensaje (garantiza scroll persistente al fondo)
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (smooth && typeof container.scrollTo === 'function') {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end'
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      const timer = setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
    const frameId = requestAnimationFrame(() => {
      scrollToBottom(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, [messages, isLoading, sttStatus, scrollToBottom]);

  // 3. Ajuste responsivo de posición sin solapamiento con la barra de productividad
  const calculatePositionOffset = useCallback(() => {
    const sidebar = document.querySelector('foco-productivity-sidebar');
    if (!sidebar || sidebar.classList.contains('hidden') || sidebar.style.display === 'none') {
      setRightOffset('2rem'); // 32px cuando no hay sidebar
      return;
    }
    if (sidebar.classList.contains('w-80')) {
      setRightOffset('21.5rem'); // 344px cuando la sidebar está expandida
      return;
    }
    setRightOffset('6rem'); // 96px cuando la sidebar está colapsada (w-16 = 64px + 32px margen)
  }, []);

  useEffect(() => {
    calculatePositionOffset();

    const sidebar = document.querySelector('foco-productivity-sidebar');
    let observer = null;
    if (sidebar) {
      observer = new MutationObserver(() => calculatePositionOffset());
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class', 'style'] });
    }

    const onVisibilityChange = () => calculatePositionOffset();
    const onResize = () => calculatePositionOffset();

    window.addEventListener('foco:productivity-visibility-changed', onVisibilityChange);
    window.addEventListener('resize', onResize);

    const removePaletteListener = escucharCambiosDePaleta((palette) => {
      aplicarPaleta(palette);
    });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('foco:productivity-visibility-changed', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      removePaletteListener();
    };
  }, [calculatePositionOffset]);

  // 4. Inicializar AudioRecorderController (Speech-to-Text)
  useEffect(() => {
    const controller = new AudioRecorderController({
      onStatus: (status, timeout = 0) => {
        setSttStatus(status);
        if (timeout > 0) {
          setTimeout(() => setSttStatus((curr) => (curr === status ? '' : curr)), timeout);
        }
      },
      onTranscription: (text) => {
        if (!text) return;
        setIsRecording(false);
        setSttStatus('Voz procesada');
        setTimeout(() => setSttStatus(''), 2000);
        // Pipeline NLU: procesar la orden capturada por voz directamente
        handleSendMessageDirect(text);
      },
      onError: (err) => {
        console.warn('[ChatbotModal] Error de voz:', err);
        setIsRecording(false);
        setSttStatus('Error de micrófono');
        setTimeout(() => setSttStatus(''), 3000);
      },
    });

    audioControllerRef.current = controller;

    return () => {
      controller.destroy();
    };
  }, []);

  // 5. Alternancia de apertura del modal
  const handleToggle = useCallback(() => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  }, [controlledOnToggle]);

  // 6. Grabación de voz (STT)
  const handleToggleVoice = useCallback(async () => {
    if (!audioControllerRef.current) return;
    if (isRecording) {
      audioControllerRef.current.stop();
      setIsRecording(false);
      setSttStatus('Transcribiendo audio...');
    } else {
      const started = await audioControllerRef.current.start();
      if (started) {
        setIsRecording(true);
        setSttStatus('Escuchando...');
      }
    }
  }, [isRecording]);

  // 7. Envío directo al pipeline NLU (texto o audio)
  const handleSendMessageDirect = useCallback(async (textToSend) => {
    const trimmed = (textToSend || '').trim();
    if (!trimmed) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await copilotService.interpretMessage(trimmed);

      const assistantMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        actionTaken: response.actionTaken,
        actionLabel: response.actionLabel,
        actionDescription: response.actionDescription,
        actionPayload: response.actionPayload || null,
        isExecuted: false,
        logId: response.logId,
        feedback: null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[ChatbotModal] Error en pipeline NLU:', err);
      const fallbackMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: 'No se pudo procesar la solicitud con el copiloto NLU. Podés intentar nuevamente.',
        timestamp: new Date().toISOString(),
        actionTaken: null,
        actionLabel: null,
        actionDescription: null,
        actionPayload: null,
        isExecuted: false,
        feedback: null,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      handleSendMessageDirect(inputText);
    },
    [handleSendMessageDirect, inputText]
  );

  // 8. Manejo de Feedback (👍 / 👎)
  const handleFeedback = useCallback(async (messageId, rating) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const currentRating = msg.feedback;
          const nextRating = currentRating === rating ? null : rating;
          return { ...msg, feedback: nextRating };
        }
        return msg;
      })
    );

    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    try {
      await copilotService.sendFeedback({
        messageId,
        logId: targetMsg.logId || null,
        rating,
        actionTaken: targetMsg.actionTaken || null,
        feedback: rating === 'positive' ? 'Respuesta útil' : 'Respuesta no útil',
      });
    } catch (err) {
      console.warn('[ChatbotModal] Fallo no crítico de feedback:', err);
    }
  }, [messages]);

  // 9. Borrar Historial
  const handleClearHistory = useCallback(() => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setShowConfirmClear(false);
    try {
      localStorage.removeItem(STORAGE_CHAT_KEY);
    } catch {}
  }, []);

  // 10. Binding Real con el Lienzo (Canvas Binding) al presionar "Ejecutar en el lienzo"
  const handleExecuteAction = useCallback(async (msgId, actionTaken, actionPayload) => {
    if (!actionTaken) return;

    try {
      await canvasMutators.executeNluAction(actionTaken, actionPayload || {});

      // Actualizar estado de ejecución para confirmación visual inmediata
      setMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, isExecuted: true } : msg))
      );
    } catch (err) {
      console.error('[ChatbotModal] Error ejecutando acción en el lienzo:', err);
    }
  }, []);

  const formatTime = useCallback((isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, []);

  return (
    <>
      {/* ========================================================
          A. Disparador Flotante (Launcher Icon F.O.C.O. Chatbot)
          ======================================================== */}
      <div
        id="foco-chatbot-launcher-container"
        className="fixed bottom-8 z-50 flex items-center transition-all duration-300 ease-in-out"
        style={{ right: rightOffset }}
      >
        <button
          id="foco-chatbot-launcher-btn"
          type="button"
          onClick={handleToggle}
          aria-label={isOpen ? 'Cerrar Chatbot F.O.C.O.' : 'Abrir Chatbot F.O.C.O.'}
          title={isOpen ? 'Cerrar ventana de Copiloto' : 'Abrir Copiloto F.O.C.O. (Chat & Voz)'}
          className={`w-14 h-14 rounded-full bg-[--color-btn-iniciar,#22298A] text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group relative border-2 ${
            isOpen ? 'border-[--color-asociacion-acento,#FC7206] ring-4 ring-orange-400/30' : 'border-white/30'
          }`}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img src={logoUrl} alt="Logo F.O.C.O." className="w-full h-full object-contain pointer-events-none drop-shadow-sm" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[--color-asociacion-acento,#FC7206] rounded-full border-2 border-[--color-btn-iniciar,#22298A] flex items-center justify-center">
                <span className="w-1 h-1 bg-white rounded-full"></span>
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </button>
      </div>

      {/* ========================================================
          B. Ventana Emergente Modal / Drawer Flotante
          ======================================================== */}
      <div
        id="foco-chatbot-modal-window"
        ref={modalContainerRef}
        className={`fixed bottom-24 z-50 w-[92vw] sm:w-[390px] md:w-[420px] h-[580px] max-h-[calc(100vh-7.5rem)] bg-[--color-bloque-bg,#ffffff] border border-[--color-bloque-borde,#e2e8f0] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none invisible'
        }`}
        style={{ right: rightOffset }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-header-title"
      >
        {/* Encabezado */}
        <div className="h-14 px-4 bg-[--color-btn-iniciar,#22298A] text-white flex items-center justify-between border-b border-white/10 select-none shadow-xs shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 p-1 flex items-center justify-center shadow-xs overflow-hidden">
              <img src={logoUrl} alt="Logo F.O.C.O." className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 id="chatbot-header-title" className="text-sm font-bold tracking-tight leading-tight">
                Copiloto F.O.C.O.
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              id="chatbot-clear-history-btn"
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Borrar historial de conversación"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>

            <button
              id="chatbot-close-modal-btn"
              type="button"
              onClick={handleToggle}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Cerrar chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal de confirmación para Borrar Historial */}
        {showConfirmClear && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 max-w-xs w-full text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800">¿Vaciar conversación?</h4>
              <p className="text-xs text-slate-500">Se eliminarán todos los mensajes guardados de este chat.</p>
              <div className="flex gap-2 pt-1">
                <button
                  id="confirm-clear-yes"
                  type="button"
                  onClick={handleClearHistory}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                >
                  Sí, borrar
                </button>
                <button
                  id="confirm-clear-no"
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Mensajes */}
        <div
          id="chatbot-messages-list"
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 foco-scrollbar bg-[--color-lienzo-bg,#f8fafc]"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                data-message-id={msg.id}
                data-role={msg.role}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-xs md:text-sm shadow-xs break-words max-w-[88%] leading-relaxed ${
                    isUser
                      ? 'bg-[--color-btn-iniciar,#22298A] text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* ========================================================
                      C. Tarjeta con Botón Azul "Ejecutar en el lienzo"
                      ======================================================== */}
                  {!isUser && Boolean(
                    (msg.actionPayload && (msg.actionPayload.type || msg.actionPayload.title || msg.actionPayload.focusMinutes)) ||
                    (msg.actionTaken && !['CONVERSATIONAL_SUGGESTION', 'GENERAL_COPILOT_GUIDANCE', 'NONE'].includes(msg.actionTaken) && (msg.actionLabel || msg.actionPayload))
                  ) && (
                    <div
                      data-action-card={msg.actionTaken || msg.actionPayload?.type}
                      className="mt-3 p-3.5 rounded-xl bg-[--color-asociacion-suave,#eef2ff] border border-[--color-asociacion-borde,#c7d2fe] text-[--color-asociacion-primario,#323888] shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/90 text-[--color-asociacion-primario,#323888]">
                          Acción Sugerida
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>

                      <h5 className="text-xs font-bold text-[--color-asociacion-primario,#323888] mb-1">
                        {msg.actionLabel || msg.actionPayload?.title || msg.actionTaken}
                      </h5>

                      {(msg.actionDescription || msg.actionPayload?.content) && (
                        <p className="text-[11px] text-slate-600 mb-2.5 leading-tight">
                          {msg.actionDescription || msg.actionPayload?.content}
                        </p>
                      )}

                      {/* Botón Azul Requerido (#2563EB) con leyenda "Ejecutar en el lienzo" */}
                      <button
                        type="button"
                        data-action-trigger={msg.actionTaken || msg.actionPayload?.type}
                        onClick={() => handleExecuteAction(msg.id, msg.actionTaken, msg.actionPayload)}
                        className={`w-full py-2 px-3 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
                          msg.isExecuted
                            ? 'bg-emerald-600 hover:bg-emerald-700 cursor-default'
                            : 'bg-[#2563EB] hover:bg-blue-700'
                        }`}
                      >
                        {msg.isExecuted ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>✓ Ejecutado en el lienzo</span>
                          </>
                        ) : (
                          <>
                            <span>Ejecutar en el lienzo</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Feedback */}
                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-[10px] text-slate-400">¿Fue útil esta respuesta?</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          data-feedback-btn="positive"
                          data-active={msg.feedback === 'positive'}
                          onClick={() => handleFeedback(msg.id, 'positive')}
                          className={`p-1 rounded-md transition-all ${
                            msg.feedback === 'positive'
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold scale-105'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                          title="Respuesta útil (👍)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 10v12" />
                            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          data-feedback-btn="negative"
                          data-active={msg.feedback === 'negative'}
                          onClick={() => handleFeedback(msg.id, 'negative')}
                          className={`p-1 rounded-md transition-all ${
                            msg.feedback === 'negative'
                              ? 'text-rose-700 bg-rose-50 border border-rose-200 font-bold scale-105'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                          }`}
                          title="Respuesta no útil (👎)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 14V2" />
                            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
              <div className="w-5 h-5 rounded-full bg-[--color-asociacion-suave,#eef2ff] p-0.5 flex items-center justify-center">
                <img src={logoUrl} alt="FOCO" className="w-full h-full object-contain animate-spin" />
              </div>
              <span className="italic">El Copiloto está analizando la intención con NLU...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Estado STT en vivo */}
        {sttStatus && (
          <div className="px-3.5 py-1.5 bg-blue-50/90 border-t border-blue-100 flex items-center space-x-2 text-xs text-blue-700 font-medium select-none">
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-blue-600'}`}></span>
            <span>{sttStatus}</span>
          </div>
        )}

        {/* Barra de Entrada Dual */}
        <form
          onSubmit={handleFormSubmit}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 select-none shrink-0"
        >
          <button
            id="chatbot-mic-toggle-btn"
            type="button"
            onClick={handleToggleVoice}
            aria-label={isRecording ? 'Detener grabación de voz' : 'Iniciar grabación de voz'}
            title={isRecording ? 'Detener micrófono' : 'Grabar mensaje por voz (STT)'}
            className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md'
                : 'text-slate-500 hover:text-[--color-btn-iniciar,#22298A] hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>

          <input
            ref={inputRef}
            id="chatbot-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? 'Grabando audio...' : 'Escribí o hablá con tu Copiloto...'}
            disabled={isRecording}
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-[--color-btn-iniciar,#22298A] focus:bg-white rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-800 focus:outline-none transition-all placeholder:text-slate-400"
          />

          <button
            id="chatbot-send-btn"
            type="submit"
            disabled={!inputText.trim() || isRecording || isLoading}
            aria-label="Enviar mensaje"
            title="Enviar mensaje"
            className="p-2.5 rounded-xl bg-[--color-btn-iniciar,#22298A] hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 text-white transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
});

/**
 * Custom Element Wrapper: FocoChatbotModal
 * Permite inserción directa en el DOM vía <foco-chatbot-modal>.
 */
export class FocoChatbotModal extends HTMLElement {
  connectedCallback() {
    this.isOpen = false;
    this.messages = [];

    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) this.messages = parsed;
      }
    } catch {}
    if (this.messages.length === 0) {
      this.messages = [INITIAL_WELCOME_MESSAGE];
    }

    this.render();
    this.initListeners();
  }

  disconnectedCallback() {
    if (this.audioController) {
      this.audioController.destroy();
    }
    if (this.sidebarObserver) {
      this.sidebarObserver.disconnect();
    }
  }

  getRightOffset() {
    const sidebar = document.querySelector('foco-productivity-sidebar');
    if (!sidebar || sidebar.classList.contains('hidden') || sidebar.style.display === 'none') {
      return '2rem';
    }
    if (sidebar.classList.contains('w-80')) {
      return '21.5rem';
    }
    return '6rem';
  }

  render() {
    const offset = this.getRightOffset();

    this.innerHTML = `
      <div id="foco-chatbot-launcher-container" class="fixed bottom-8 z-50 flex items-center transition-all duration-300 ease-in-out" style="right: ${offset}">
        <button id="foco-chatbot-launcher-btn" type="button" aria-label="${this.isOpen ? 'Cerrar Chatbot F.O.C.O.' : 'Abrir Chatbot F.O.C.O.'}" class="w-14 h-14 rounded-full bg-[--color-btn-iniciar,#22298A] text-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative border-2 ${this.isOpen ? 'border-[--color-asociacion-acento,#FC7206] ring-4 ring-orange-400/30' : 'border-white/30'}">
          ${this.isOpen ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ` : `
            <div class="relative w-8 h-8 flex items-center justify-center">
              <img src="${logoUrl}" alt="Logo F.O.C.O." class="w-full h-full object-contain pointer-events-none drop-shadow-sm" />
              <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[--color-asociacion-acento,#FC7206] rounded-full border-2 border-[--color-btn-iniciar,#22298A]"></span>
            </div>
          `}
        </button>
      </div>

      <div id="foco-chatbot-modal-window" class="fixed bottom-24 z-50 w-[92vw] sm:w-[390px] md:w-[420px] h-[580px] max-h-[calc(100vh-7.5rem)] bg-[--color-bloque-bg,#ffffff] border border-[--color-bloque-borde,#e2e8f0] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${this.isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible' : 'opacity-0 scale-95 translate-y-4 pointer-events-none invisible'}" style="right: ${offset}">
        <div class="h-14 px-4 bg-[--color-btn-iniciar,#22298A] text-white flex items-center justify-between border-b border-white/10 select-none shadow-xs shrink-0">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-full bg-white/15 p-1 flex items-center justify-center">
              <img src="${logoUrl}" alt="Logo" class="w-8 h-8 object-contain" />
            </div>
            <div>
              <h3 class="text-sm font-bold tracking-tight leading-tight">Copiloto F.O.C.O.</h3>
            </div>
          </div>
          <div class="flex items-center space-x-1">
            <button id="chatbot-clear-history-btn" type="button" class="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors" title="Borrar historial">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
            <button id="chatbot-close-modal-btn" type="button" class="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors" title="Cerrar chat">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div id="chatbot-messages-list" class="flex-1 overflow-y-auto p-4 space-y-4 foco-scrollbar bg-[--color-lienzo-bg,#f8fafc]">
          ${this.renderMessagesHtml()}
        </div>

        <div id="chatbot-stt-status-bar" class="hidden px-3.5 py-1.5 bg-blue-50/90 border-t border-blue-100 flex items-center space-x-2 text-xs text-blue-700 font-medium select-none">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span id="chatbot-stt-status-text">Escuchando...</span>
        </div>

        <form id="chatbot-input-form" class="p-3 bg-white border-t border-slate-100 flex items-center gap-2 select-none shrink-0">
          <button id="chatbot-mic-toggle-btn" type="button" class="p-2.5 rounded-xl text-slate-500 hover:text-[--color-btn-iniciar,#22298A] hover:bg-slate-100 transition-all" title="Entrada por voz">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          <input id="chatbot-text-input" type="text" placeholder="Escribí o hablá con tu Copiloto..." class="flex-1 bg-slate-50 border border-slate-200 focus:border-[--color-btn-iniciar,#22298A] focus:bg-white rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-800 focus:outline-none transition-all" />
          <button id="chatbot-send-btn" type="submit" class="p-2.5 rounded-xl bg-[--color-btn-iniciar,#22298A] hover:opacity-90 text-white transition-all shadow-xs" title="Enviar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    `;

    if (this.isOpen) {
      this.scrollToBottom(false);
    }
  }

  scrollToBottom(smooth = false) {
    const list = this.querySelector('#chatbot-messages-list');
    if (list) {
      if (smooth && typeof list.scrollTo === 'function') {
        list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      } else {
        list.scrollTop = list.scrollHeight;
      }
      requestAnimationFrame(() => {
        if (list) list.scrollTop = list.scrollHeight;
      });
    }
  }

  renderMessagesHtml() {
    return this.messages.map((msg) => {
      const isUser = msg.role === 'user';
      return `
        <div class="flex flex-col ${isUser ? 'items-end' : 'items-start'}" data-message-id="${msg.id}">
          <div class="p-3.5 rounded-2xl text-xs md:text-sm shadow-xs max-w-[88%] leading-relaxed ${
            isUser ? 'bg-[--color-btn-iniciar,#22298A] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
          }">
            <div class="whitespace-pre-line">${msg.content}</div>
            ${!isUser && (msg.actionTaken || msg.actionPayload) ? `
              <div data-action-card="${msg.actionTaken || msg.actionPayload?.type}" class="mt-3 p-3.5 rounded-xl bg-[--color-asociacion-suave,#eef2ff] border border-[--color-asociacion-borde,#c7d2fe] text-[--color-asociacion-primario,#323888] shadow-xs">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/90 text-[--color-asociacion-primario,#323888]">Acción Sugerida</span>
                </div>
                <h5 class="text-xs font-bold text-[--color-asociacion-primario,#323888] mb-1">${msg.actionLabel || msg.actionPayload?.title || msg.actionTaken}</h5>
                ${(msg.actionDescription || msg.actionPayload?.content) ? `<p class="text-[11px] text-slate-600 mb-2.5 leading-tight">${msg.actionDescription || msg.actionPayload?.content}</p>` : ''}
                <button type="button" data-action-trigger="${msg.actionTaken || msg.actionPayload?.type}" class="w-full py-2 px-3 rounded-xl ${msg.isExecuted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#2563EB] hover:bg-blue-700'} text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98">
                  ${msg.isExecuted ? '<span>✓ Ejecutado en el lienzo</span>' : '<span>Ejecutar en el lienzo</span>'}
                </button>
              </div>
            ` : ''}
            ${!isUser ? `
              <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span class="text-[10px]">¿Fue útil?</span>
                <div class="flex items-center gap-1">
                  <button type="button" data-feedback-btn="positive" data-active="${msg.feedback === 'positive'}" class="p-1 rounded ${msg.feedback === 'positive' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold' : 'hover:text-emerald-600'}">👍</button>
                  <button type="button" data-feedback-btn="negative" data-active="${msg.feedback === 'negative'}" class="p-1 rounded ${msg.feedback === 'negative' ? 'text-rose-700 bg-rose-50 border border-rose-200 font-bold' : 'hover:text-rose-600'}">👎</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  initListeners() {
    this.querySelector('#foco-chatbot-launcher-btn')?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.render();
      this.initListeners();
      if (this.isOpen) {
        this.scrollToBottom(false);
      }
    });

    this.querySelector('#chatbot-close-modal-btn')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
      this.initListeners();
    });

    this.querySelector('#chatbot-clear-history-btn')?.addEventListener('click', () => {
      if (confirm('¿Vaciar todo el historial de la conversación?')) {
        this.messages = [INITIAL_WELCOME_MESSAGE];
        localStorage.removeItem(STORAGE_CHAT_KEY);
        this.render();
        this.initListeners();
      }
    });

    const form = this.querySelector('#chatbot-input-form');
    const input = this.querySelector('#chatbot-text-input');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = input?.value.trim();
      if (!val) return;
      await this.handleSendMessage(val);
    });

    // Listeners de acción "Ejecutar en el lienzo"
    this.querySelectorAll('[data-action-trigger]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action-trigger');
        const card = btn.closest('[data-message-id]');
        const msgId = card?.getAttribute('data-message-id');
        const msg = this.messages.find((m) => m.id === msgId);

        try {
          await canvasMutators.executeNluAction(action, msg?.actionPayload || {});
          if (msg) {
            msg.isExecuted = true;
            localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(this.messages));
            this.render();
            this.initListeners();
          }
        } catch (err) {
          console.error('[FocoChatbotModal] Error al ejecutar acción:', err);
        }
      });
    });

    // Micrófono STT
    const micBtn = this.querySelector('#chatbot-mic-toggle-btn');
    const statusBar = this.querySelector('#chatbot-stt-status-bar');
    const statusText = this.querySelector('#chatbot-stt-status-text');

    if (!this.audioController) {
      this.audioController = new AudioRecorderController({
        onStatus: (status) => {
          if (statusBar && statusText) {
            statusText.textContent = status;
            statusBar.classList.remove('hidden');
          }
        },
        onTranscription: async (transcribedText) => {
          if (statusBar) statusBar.classList.add('hidden');
          if (micBtn) micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
          if (!transcribedText) return;
          await this.handleSendMessage(transcribedText);
        },
        onError: () => {
          if (statusBar) statusBar.classList.add('hidden');
          if (micBtn) micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
        }
      });
    }

    micBtn?.addEventListener('click', async () => {
      if (this.audioController.isRecording) {
        this.audioController.stop();
        micBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
        if (statusBar) statusBar.classList.add('hidden');
      } else {
        const started = await this.audioController.start();
        if (started) {
          micBtn.classList.add('bg-red-500', 'text-white', 'animate-pulse');
          if (statusBar) statusBar.classList.remove('hidden');
        }
      }
    });

    // Listeners de feedback
    this.querySelectorAll('[data-feedback-btn]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const rating = btn.getAttribute('data-feedback-btn');
        const card = btn.closest('[data-message-id]');
        const msgId = card?.getAttribute('data-message-id');
        if (msgId) {
          const target = this.messages.find((m) => m.id === msgId);
          if (target) {
            target.feedback = target.feedback === rating ? null : rating;
            localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(this.messages));
            await copilotService.sendFeedback({
              messageId: msgId,
              logId: target.logId || null,
              rating,
              actionTaken: target.actionTaken || null,
            });
            this.render();
            this.initListeners();
          }
        }
      });
    });

    // Observer para la barra de productividad
    const sidebar = document.querySelector('foco-productivity-sidebar');
    if (sidebar && !this.sidebarObserver) {
      this.sidebarObserver = new MutationObserver(() => {
        const offset = this.getRightOffset();
        const launcher = this.querySelector('#foco-chatbot-launcher-container');
        const modal = this.querySelector('#foco-chatbot-modal-window');
        if (launcher) launcher.style.right = offset;
        if (modal) modal.style.right = offset;
      });
      this.sidebarObserver.observe(sidebar, { attributes: true, attributeFilter: ['class', 'style'] });
    }
  }

  async handleSendMessage(val) {
    this.messages.push({
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: val,
      timestamp: new Date().toISOString(),
    });
    this.render();
    this.initListeners();
    this.scrollToBottom(false);

    try {
      const response = await copilotService.interpretMessage(val);
      this.messages.push({
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        actionTaken: response.actionTaken,
        actionLabel: response.actionLabel,
        actionDescription: response.actionDescription,
        actionPayload: response.actionPayload || null,
        isExecuted: false,
        logId: response.logId,
        feedback: null,
      });
    } catch {
      this.messages.push({
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content: 'No se pudo procesar tu solicitud con el copiloto.',
        timestamp: new Date().toISOString(),
        actionTaken: null,
        actionLabel: null,
        actionDescription: null,
        actionPayload: null,
        isExecuted: false,
        feedback: null,
      });
    }
    localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(this.messages));
    this.render();
    this.initListeners();
    this.scrollToBottom(true);
  }
}

if (!customElements.get('foco-chatbot-modal')) {
  customElements.define('foco-chatbot-modal', FocoChatbotModal);
}

export default ChatbotModal;
