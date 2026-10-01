import Sortable from "sortablejs";
import { getSession, supabase } from "../auth.js";
import { blocksService } from "../services/blocks.service.js";
import { blockRegistry } from "../strategies/blockRegistry.js";
import { emitCustomEvent, FOCO_EVENTS } from "../utils/events.js";
import { localStore } from "../services/storage.service.js";
import { aplicarPaleta, obtenerPaletaActual, escucharCambiosDePaleta } from "../managers/paletteManager.js";
import "./ui/audioRecorder.js";

const LOCAL_BLOCKS_KEY = "foco-local-blocks";

class FocoLienzoCanvas extends HTMLElement {
  connectedCallback() {
    this.className = "flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-[--color-lienzo-bg,theme(colors.slate.100)] foco-scrollbar relative";
    // (Mantenemos la estructura HTML original de los 4 bloques intacta)
    this.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        <!-- BLOQUE 1: Objetivos Activos -->
        <section id="seccion-objetivos-activos" class="bg-[--color-bloque-bg,white] rounded-2xl shadow-sm border border-[--color-bloque-borde,theme(colors.slate.200)] p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-[--color-bloque-divisor,theme(colors.slate.100)]">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icono-objetivos,#22298A)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap-icon lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
              <h2 class="text-sm font-bold text-[--color-bloque-titulo,#22298A] uppercase tracking-wide"> Objetivos Activos</h2>
            </div>
          </div>
          <div id="bloque-objetivos-activos" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>

        <!-- BLOQUE 2: Bloque Personal -->
        <section id="seccion-personal" class="bg-[--color-bloque-bg,white] rounded-2xl shadow-sm border border-[--color-bloque-borde,theme(colors.slate.200)] p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-[--color-bloque-divisor,theme(colors.slate.100)]">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icono-personal,#22298A)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-id-card-icon lucide-id-card"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
              <h2 class="text-sm font-bold text-[--color-bloque-titulo,#22298A] uppercase tracking-wide">Bloque Personal</h2>
            </div>
          </div>
          <div id="bloque-personal" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>

        <!-- BLOQUE 3: Inspiración y Creatividad (Corresponde a "Recursos" del método P.A.R.A) -->
        <section id="seccion-inspiracion" class="bg-[--color-bloque-bg,white] rounded-2xl shadow-sm border border-[--color-bloque-borde,theme(colors.slate.200)] p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-[--color-bloque-divisor,theme(colors.slate.100)]">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icono-inspiracion,#22298A)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-image-icon lucide-book-image"><path d="m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><circle cx="10" cy="8" r="2"/></svg>
              <h2 class="text-sm font-bold text-[--color-bloque-titulo,#22298A] uppercase tracking-wide">Inspiración y Creatividad</h2>
            </div>
          </div>
          <div id="bloque-inspiracion" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>

        <!-- BLOQUE 4: Archivo de Vida y Bitácoras -->
        <section id="seccion-archivo-vida" class="bg-[--color-bloque-bg,white] rounded-2xl shadow-sm border border-[--color-bloque-borde,theme(colors.slate.200)] p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-[--color-bloque-divisor,theme(colors.slate.100)]">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-icono-archivo,#22298A)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award-icon lucide-award"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
              <h2 class="text-sm font-bold text-[--color-bloque-titulo,#22298A] uppercase tracking-wide">Archivo de Vida</h2>
            </div>
          </div>
          <div id="bloque-archivo-vida" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>
        
      </div>
    `;
    this.blocksData = []; 
    this.arrowMode = false;
    this.selectedSourceCard = null;

    this.activarDragAndDrop();
    this.cargarBlocks();
    this.aplicarVisibilidad(JSON.parse(localStorage.getItem("foco-board-visibility") || "{}"));
    aplicarPaleta(obtenerPaletaActual());

    this.onVisibilityChanged = (event) => {
      this.aplicarVisibilidad(event.detail);
    };
    window.addEventListener("foco:visibility-changed", this.onVisibilityChanged);

    this.onToggleArrowMode = (e) => {
      this.arrowMode = Boolean(e.detail?.active);
      if (!this.arrowMode && this.selectedSourceCard) {
        this.selectedSourceCard.classList.remove("foco-tarjeta-asociando-origen", "ring-4", "ring-orange-400", "shadow-xl");
        this.selectedSourceCard = null;
      }
      this.actualizarEstiloCursorModoFlecha();
    };
    window.addEventListener("foco:toggle-arrow-mode", this.onToggleArrowMode);
    window.addEventListener("foco:toggle-associate-mode", this.onToggleArrowMode);

    this.onKeyDownCanvas = (e) => {
      if (e.key === "Escape" && this.arrowMode) {
        this.arrowMode = false;
        if (this.selectedSourceCard) {
          this.selectedSourceCard.classList.remove("foco-tarjeta-asociando-origen", "ring-4", "ring-orange-400", "shadow-xl");
          this.selectedSourceCard = null;
        }
        this.actualizarEstiloCursorModoFlecha();
        window.dispatchEvent(new CustomEvent("foco:arrow-mode-changed", { detail: { active: false } }));
        window.dispatchEvent(new CustomEvent("foco:associate-mode-changed", { detail: { active: false } }));
      }
    };
    window.addEventListener("keydown", this.onKeyDownCanvas);

    escucharCambiosDePaleta((nombrePaleta) => {
      aplicarPaleta(nombrePaleta);
      if (this.tarjetaResaltadaId) {
        this.resaltarAsociacionesDeTarjeta(this.tarjetaResaltadaId);
      }
    });
    // Escuchamos el evento de éxito del micrófono para recargar los bloques
    window.addEventListener("foco:refresh-canvas", () => this.cargarBlocks());

    // Inyectamos el botón de micrófono en el Canvas
    const audioComponent = document.createElement('foco-audio-recorder');
    this.appendChild(audioComponent);

    supabase?.auth.onAuthStateChange((_event, session) => {
      if (session) this.migrarBlocksLocales(session);
      this.mostrarAvisoLocal(!session);
    });
  }

  async cargarBlocks() {
    const sesion = await getSession();
    this.mostrarAvisoLocal(!sesion);
    if (!sesion?.user?.id) {
      this.blocksData = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
      this.renderBlocks(this.blocksData);
      return;
    }
    try {
      const blocks = await blocksService.fetchBlocks(sesion.access_token, sesion.user.id);
      this.blocksData = blocks;
      this.renderBlocks(blocks);
      await this.migrarBlocksLocales(sesion);
    } catch (error) {
      console.error("Error al cargar los blocks:", error);
    }
  }

  renderBlocks(blocks) {
    this.querySelectorAll(".foco-drop-zone").forEach((zona) => {
      zona.innerHTML = "";
    });

    blocks.forEach((block) => {
      const domId = [...blockRegistry.registry.entries()]
        .find(([, backendType]) => backendType === block.type)?.[0];
      const zona = domId ? this.querySelector(`#${CSS.escape(domId)}`) : null;
      if (!zona) return;

      const contenido = block.content || {};
      const notes = contenido.notes || [];

      const oldText = contenido.text || contenido.texto || "";
      if (oldText && notes.length === 0) {
        notes.push({ id: crypto.randomUUID(), text: oldText, title: contenido.title || null, isTask: false });
      }

      notes.forEach((item) => {
        const esTarea = item.type === "task" || Boolean(item.isTask);
        const esLista = !esTarea && (item.type === "list" || (Array.isArray(item.items) && item.items.length > 0 && item.type !== "note"));
        const tarjeta = esLista
          ? this.crearElementoTarjetaLista(item, block.id)
          : this.crearElementoTarjeta(item, block.id);
        zona.appendChild(tarjeta);
      });
    });
    aplicarPaleta(obtenerPaletaActual());
    this.actualizarBadgesDeAsociacion();
  }

  // Modificado para recibir un objeto Item (Nota o Tarea) y renderizar dinámicamente
  crearElementoTarjeta(item, blockId) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "foco-tarjeta p-3 bg-[--color-tarjeta-bg,#eff6ff] rounded-xl border border-blue-100/30 relative group transition-all cursor-grab active:cursor-grabbing";
    
    if (item.id) tarjeta.dataset.noteId = item.id;
    if (blockId) tarjeta.dataset.blockId = blockId;

    tarjeta.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      if (this.arrowMode) {
        e.stopPropagation();
        this.gestionarClickTarjetaParaFlecha(tarjeta);
      }
    });

    const controles = document.createElement("div");
    controles.className = "absolute top-2 right-2.5 hidden group-hover:flex flex-row items-center gap-2 bg-blue-50/90 rounded px-2 py-1 shadow-sm";

    const btnEditar = document.createElement("button");
    btnEditar.className = "flex items-center justify-center shrink-0 p-0.5 hover:scale-105 transition-transform";
    btnEditar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-blue-600 transition-colors"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "flex items-center justify-center shrink-0 p-0.5 hover:scale-105 transition-transform";
    btnEliminar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-red-600 transition-colors"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    controles.appendChild(btnEditar);
    controles.appendChild(btnEliminar);
    tarjeta.appendChild(controles);

    if (item.title) {
      const titulo = document.createElement("h3");
      titulo.className = "text-xs font-bold text-[--color-tarjeta-texto,#1e293b] mb-1";
      titulo.textContent = item.title;
      tarjeta.appendChild(titulo);
    }

    // Contenedor Flex para alinear checkbox y texto
    const contenidoFlex = document.createElement("div");
    contenidoFlex.className = "flex items-start gap-2 mt-0.5";
    
    const esTarea = item.isTask === true || item.type === "task";
    item.isTask = esTarea;
    item.type = esTarea ? "task" : (item.type || "note");

    // Generación del Checkbox si es Tarea
    if (esTarea) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "mt-0.5 cursor-pointer w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-foco-blue-deep focus:ring-foco-blue-deep";
      checkbox.checked = Boolean(item.checked);
      
      // Listener para actualizar el estado del Check en la Base de Datos
      checkbox.addEventListener("change", async (e) => {
        const newState = e.target.checked;
        cuerpo.classList.toggle("line-through", newState);
        cuerpo.classList.toggle("text-slate-400", newState);
        await this.actualizarEstadoCheckbox(item.id, tarjeta.dataset.blockId, newState);
      });
      contenidoFlex.appendChild(checkbox);
    }

    const cuerpo = document.createElement("p");
    cuerpo.className = `text-[11px] text-[--color-tarjeta-texto,#475569] flex-1 whitespace-pre-wrap transition-colors ${esTarea && item.checked ? 'line-through text-slate-400' : ''}`;
    cuerpo.textContent = item.text;
    
    contenidoFlex.appendChild(cuerpo);
    tarjeta.appendChild(contenidoFlex);

    btnEliminar.addEventListener("click", async () => {
      const noteId = tarjeta.dataset.noteId;
      const bId = tarjeta.dataset.blockId;
      tarjeta.style.opacity = '0.5';

      try {
        const sesion = await getSession();
        if (sesion && bId) {
          const bloque = this.blocksData.find(b => b.id === bId);
          if (bloque) {
            const notasActualizadas = (bloque.content.notes || []).filter(n => n.id !== noteId);
            const nuevoContenido = { ...bloque.content, notes: notasActualizadas };
            await blocksService.updateBlock(bId, nuevoContenido, sesion.access_token);
            bloque.content = nuevoContenido; 
          }
        } else {
          const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
          const updatedLocales = locales.map(b => {
            if (b.id === bId) {
              const notes = (b.content.notes || []).filter(n => n.id !== noteId);
              return { ...b, content: { ...b.content, notes } };
            }
            return b;
          });
          localStore.setItem(LOCAL_BLOCKS_KEY, updatedLocales);
          this.blocksData = updatedLocales;
        }
        await this.eliminarConexionesDeTarjeta(noteId);
        tarjeta.remove();
        this.solicitarRenderConectores();
      } catch (error) {
        console.error("Error al eliminar el item:", error);
        tarjeta.style.opacity = '1';
        alert("No se pudo eliminar.");
      }
    });

    btnEditar.addEventListener("click", () => {
      contenidoFlex.classList.add("hidden");
      tarjeta.classList.remove("group");
      
      const textarea = document.createElement("textarea");
      textarea.className = "w-full text-[11px] text-slate-700 bg-white border border-blue-200 rounded p-1 outline-none resize-none foco-scrollbar";
      textarea.value = cuerpo.textContent;
      textarea.rows = 3;
      tarjeta.appendChild(textarea);
      textarea.focus();

      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          textarea.blur(); // Dispara la persistencia existente
        } else if (e.key === "Escape") {
          textarea.value = item.text; // Revierte el texto
          textarea.blur();
        }
      });

      textarea.addEventListener("blur", async () => {
        const nuevoTexto = textarea.value.trim();
        const noteId = tarjeta.dataset.noteId;
        const bId = tarjeta.dataset.blockId;

        textarea.remove();
        cuerpo.textContent = nuevoTexto;
        contenidoFlex.classList.remove("hidden");
        tarjeta.classList.add("group");

        if (nuevoTexto && nuevoTexto !== item.text) {
          try {
            const sesion = await getSession();
            if (sesion && bId) {
              const bloque = this.blocksData.find(b => b.id === bId);
              if (bloque) {
                // Al hacer spread (...n), preservamos intactos el "isTask" y el "checked"
                const notasActualizadas = (bloque.content.notes || []).map(n => {
                  if (n.id === noteId) return { ...n, text: nuevoTexto };
                  return n;
                });
                const nuevoContenido = { ...bloque.content, notes: notasActualizadas };

                await blocksService.updateBlock(bId, nuevoContenido, sesion.access_token);
                bloque.content = nuevoContenido;
              }
            } else {
              const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
              const updatedLocales = locales.map(b => {
                if (b.id === bId) {
                  const notes = (b.content.notes || []).map(n => {
                    if (n.id === noteId) return { ...n, text: nuevoTexto };
                    return n;
                  });
                  return { ...b, content: { ...b.content, notes } };
                }
                return b;
              });
              localStore.setItem(LOCAL_BLOCKS_KEY, updatedLocales);
              this.blocksData = updatedLocales;
            }
            item.text = nuevoTexto;
          } catch (error) {
            console.error("Error al actualizar el texto:", error);
            cuerpo.textContent = item.text;
          }
        }
      });
    });

    return tarjeta;
  }

  // Nuevo método dedicado a persistir el Toggle del Checkbox sin modificar el texto
  async actualizarEstadoCheckbox(noteId, blockId, newState) {
    try {
      const sesion = await getSession();
      if (sesion && blockId) {
        const bloque = this.blocksData.find(b => b.id === blockId);
        if (bloque) {
          const notasActualizadas = (bloque.content.notes || []).map(n => 
            n.id === noteId ? { ...n, checked: newState, isTask: true, type: "task" } : n
          );
          const nuevoContenido = { ...bloque.content, notes: notasActualizadas };
          await blocksService.updateBlock(blockId, nuevoContenido, sesion.access_token);
          bloque.content = nuevoContenido;
        }
      } else {
        const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
        const updatedLocales = locales.map(b => {
          if (b.id === blockId) {
            const notes = (b.content.notes || []).map(n => 
              n.id === noteId ? { ...n, checked: newState, isTask: true, type: "task" } : n
            );
            return { ...b, content: { ...b.content, notes } };
          }
          return b;
        });
        localStore.setItem(LOCAL_BLOCKS_KEY, updatedLocales);
        this.blocksData = updatedLocales;
      }
    } catch (error) {
      console.error("Error al actualizar el estado de la tarea:", error);
    }
  }

  // Modificado para soportar Tareas mediante el parámetro isTask
  async guardarItemEnBackend(texto, tipoDeBloque, isTask = false) {
    try {
      const sesion = await getSession();
      const nuevaNota = {
        id: crypto.randomUUID(),
        text: texto,
        title: null,
        type: isTask ? "task" : "note",
        isTask: Boolean(isTask),
        checked: false,
        createdAt: new Date().toISOString()
      };

      if (!sesion) {
        const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
        let bloqueLocal = locales.find((b) => b.type === tipoDeBloque);
        
        if (bloqueLocal) {
          bloqueLocal.content.notes = [...(bloqueLocal.content.notes || []), nuevaNota];
        } else {
          bloqueLocal = {
            id: crypto.randomUUID(),
            type: tipoDeBloque,
            content: { notes: [nuevaNota] }
          };
          locales.push(bloqueLocal);
        }
        
        localStore.setItem(LOCAL_BLOCKS_KEY, locales);
        this.blocksData = locales;
        this.mostrarAvisoLocal(true);
        
        return { noteId: nuevaNota.id, blockId: bloqueLocal.id, item: nuevaNota };
      }

      let bloqueExistente = this.blocksData.find((b) => b.type === tipoDeBloque);

      if (bloqueExistente) {
        const notasActualizadas = [...(bloqueExistente.content.notes || []), nuevaNota];
        const nuevoContenido = { ...bloqueExistente.content, notes: notasActualizadas };

        await blocksService.updateBlock(bloqueExistente.id, nuevoContenido, sesion.access_token);
        bloqueExistente.content = nuevoContenido;

        return { noteId: nuevaNota.id, blockId: bloqueExistente.id, item: nuevaNota };
      } else {
        const nuevoContenido = { notes: [nuevaNota] };
        const datosCreados = await blocksService.saveBlock(tipoDeBloque, nuevoContenido, sesion.access_token);
        
        this.blocksData.push(datosCreados);
        emitCustomEvent(this, FOCO_EVENTS.BLOCK_SAVED, { type: tipoDeBloque, content: texto, data: datosCreados });
        
        return { noteId: nuevaNota.id, blockId: datosCreados.id, item: nuevaNota };
      }
    } catch (error) {
      console.error("Error al guardar el item en backend:", error);
      return null;
    }
  }

  // Unifica la creación de ambos elementos arrastrados
  crearTarjetaItem(botonClonado, isTask) {
      const tarjetaTemporal = document.createElement("div");
      tarjetaTemporal.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30 flex items-start gap-2";

      if (isTask) {
        const checkboxIcon = document.createElement("div");
        checkboxIcon.className = "mt-0.5 w-3.5 h-3.5 shrink-0 rounded border border-slate-300 opacity-50";
        tarjetaTemporal.appendChild(checkboxIcon);
      }

      const textarea = document.createElement("textarea");
      textarea.className = "w-full text-[11px] text-slate-700 bg-transparent outline-none resize-none foco-scrollbar";
      textarea.placeholder = isTask ? "Escribe una tarea..." : "Escribe una nota...";
      textarea.rows = 3;
      tarjetaTemporal.appendChild(textarea);

      botonClonado.replaceWith(tarjetaTemporal);
      textarea.focus();

      const zonaDrop = tarjetaTemporal.closest(".foco-drop-zone");
      if (!zonaDrop) return;

      const idDelBloque = zonaDrop.id;
      const tipoDeBloque = blockRegistry.getBackendType(idDelBloque);

      let fueCancelado = false;

      // === Escucha de teclado para Enter y Escape ===
      textarea.addEventListener("keydown", (e) => {
        // 1. Enter (sin Shift) para confirmar y guardar
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          textarea.blur(); 
        } 
        // 2. Escape para cancelar la creación
        else if (e.key === "Escape") {
          e.preventDefault();
          fueCancelado = true;
          tarjetaTemporal.remove(); // Elimina la tarjeta inmediatamente del DOM
        }
      });

      textarea.addEventListener("blur", async () => {
        // Si fue cancelado con Escape, evitamos que intente guardar nada
        if (fueCancelado) return;

        const textoEscrito = textarea.value.trim();
        if (!textoEscrito) {
          tarjetaTemporal.remove();
          return;
        }

        textarea.disabled = true;
        textarea.classList.add("opacity-50");

        const datosGuardados = await this.guardarItemEnBackend(textoEscrito, tipoDeBloque, isTask);

        if (datosGuardados) {
          const tarjetaDefinitiva = this.crearElementoTarjeta(
            datosGuardados.item, 
            datosGuardados.blockId
          );
          tarjetaTemporal.replaceWith(tarjetaDefinitiva);
          aplicarPaleta(obtenerPaletaActual());
          this.solicitarRenderConectores();
        } else {
          tarjetaTemporal.remove();
        }
      });
    }

  // Instancia el borrador interactivo para nombrar y crear una lista arrastrada
  crearTarjetaLista(botonClonado) {
    const tarjetaTemporal = document.createElement("div");
    tarjetaTemporal.className = "foco-tarjeta p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 shadow-xs flex flex-col gap-2";

    const encabezado = document.createElement("div");
    encabezado.className = "flex items-center gap-1.5 text-indigo-700 font-semibold text-xs";
    encabezado.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>
      <span>Nueva Lista</span>
    `;

    const inputTitulo = document.createElement("input");
    inputTitulo.type = "text";
    inputTitulo.placeholder = "Título de la lista (Enter para guardar)...";
    inputTitulo.className = "w-full text-xs font-semibold text-slate-700 bg-white border border-indigo-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-400";

    tarjetaTemporal.appendChild(encabezado);
    tarjetaTemporal.appendChild(inputTitulo);

    botonClonado.replaceWith(tarjetaTemporal);
    inputTitulo.focus();

    const zonaDrop = tarjetaTemporal.closest(".foco-drop-zone");
    if (!zonaDrop) return;
    const idDelBloque = zonaDrop.id;
    const tipoDeBloque = blockRegistry.getBackendType(idDelBloque);

    let cancelado = false;

    inputTitulo.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        inputTitulo.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelado = true;
        tarjetaTemporal.remove();
      }
    });

    inputTitulo.addEventListener("blur", async () => {
      if (cancelado) return;
      const tituloEscrito = inputTitulo.value.trim();
      if (!tituloEscrito) {
        tarjetaTemporal.remove();
        return;
      }

      inputTitulo.disabled = true;
      inputTitulo.classList.add("opacity-50");

      const nuevaLista = {
        id: crypto.randomUUID(),
        title: tituloEscrito,
        text: tituloEscrito,
        type: "list",
        isTask: false,
        checked: false,
        items: [],
        createdAt: new Date().toISOString()
      };

      const guardado = await this.guardarItemListaEnBackend(nuevaLista, tipoDeBloque);

      if (guardado) {
        const tarjetaDefinitiva = this.crearElementoTarjetaLista(guardado.item, guardado.blockId);
        tarjetaTemporal.replaceWith(tarjetaDefinitiva);
        aplicarPaleta(obtenerPaletaActual());
        this.solicitarRenderConectores();
      } else {
        tarjetaTemporal.remove();
      }
    });
  }

  // Persiste la estructura de una lista nueva en el backend o localStorage
  async guardarItemListaEnBackend(nuevaLista, tipoDeBloque) {
    try {
      const sesion = await getSession();

      if (!sesion) {
        const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
        let bloqueLocal = locales.find((b) => b.type === tipoDeBloque);

        if (bloqueLocal) {
          bloqueLocal.content.notes = [...(bloqueLocal.content.notes || []), nuevaLista];
        } else {
          bloqueLocal = {
            id: crypto.randomUUID(),
            type: tipoDeBloque,
            content: { notes: [nuevaLista] }
          };
          locales.push(bloqueLocal);
        }

        localStore.setItem(LOCAL_BLOCKS_KEY, locales);
        this.blocksData = locales;
        this.mostrarAvisoLocal(true);

        return { noteId: nuevaLista.id, blockId: bloqueLocal.id, item: nuevaLista };
      }

      let bloqueExistente = this.blocksData.find((b) => b.type === tipoDeBloque);

      if (bloqueExistente) {
        const notasActualizadas = [...(bloqueExistente.content.notes || []), nuevaLista];
        const nuevoContenido = { ...bloqueExistente.content, notes: notasActualizadas };

        await blocksService.updateBlock(bloqueExistente.id, nuevoContenido, sesion.access_token);
        bloqueExistente.content = nuevoContenido;

        return { noteId: nuevaLista.id, blockId: bloqueExistente.id, item: nuevaLista };
      } else {
        const nuevoContenido = { notes: [nuevaLista] };
        const datosCreados = await blocksService.saveBlock(tipoDeBloque, nuevoContenido, sesion.access_token);

        this.blocksData.push(datosCreados);
        emitCustomEvent(this, FOCO_EVENTS.BLOCK_SAVED, {
          type: tipoDeBloque,
          content: nuevaLista.title,
          data: datosCreados
        });

        return { noteId: nuevaLista.id, blockId: datosCreados.id, item: nuevaLista };
      }
    } catch (error) {
      console.error("Error al guardar la lista en backend:", error);
      return null;
    }
  }

  // Renderiza el componente de lista dinámica con sus checkboxes y sub-ítems
  crearElementoTarjetaLista(item, blockId) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "foco-tarjeta p-3.5 bg-[--color-tarjeta-bg,#eff6ff] rounded-xl border border-blue-100/40 relative group transition-all cursor-grab active:cursor-grabbing shadow-xs";

    if (item.id) tarjeta.dataset.noteId = item.id;
    if (blockId) tarjeta.dataset.blockId = blockId;

    tarjeta.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      if (this.arrowMode) {
        e.stopPropagation();
        this.gestionarClickTarjetaParaFlecha(tarjeta);
      }
    });

    const controles = document.createElement("div");
    controles.className = "absolute top-2 right-2.5 hidden group-hover:flex flex-row items-center gap-2 bg-blue-50/90 rounded px-2 py-1 shadow-sm z-10";

    const btnEditar = document.createElement("button");
    btnEditar.className = "flex items-center justify-center shrink-0 p-0.5 hover:scale-105 transition-transform";
    btnEditar.title = "Editar título de la lista";
    btnEditar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-blue-600 transition-colors"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "flex items-center justify-center shrink-0 p-0.5 hover:scale-105 transition-transform";
    btnEliminar.title = "Eliminar lista";
    btnEliminar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-red-600 transition-colors"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    controles.appendChild(btnEditar);
    controles.appendChild(btnEliminar);
    tarjeta.appendChild(controles);

    const headerDiv = document.createElement("div");
    headerDiv.className = "flex items-center gap-1.5 mb-2.5 pr-14";

    const iconoLista = document.createElement("span");
    iconoLista.className = "text-indigo-600 text-xs shrink-0 select-none";
    iconoLista.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>`;

    const tituloEl = document.createElement("h3");
    tituloEl.className = "text-xs font-bold text-[--color-tarjeta-texto,#1e293b] truncate";
    tituloEl.textContent = item.title || "Lista";

    headerDiv.appendChild(iconoLista);
    headerDiv.appendChild(tituloEl);
    tarjeta.appendChild(headerDiv);

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "space-y-1.5";
    tarjeta.appendChild(itemsContainer);

    const renderItems = () => {
      itemsContainer.innerHTML = "";
      item.items = item.items || [];

      item.items.forEach((subItem, index) => {
        const row = document.createElement("div");
        row.className = "flex items-center gap-2 group/item px-1 py-0.5 rounded hover:bg-white/60 transition-colors";

        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = Boolean(subItem.checked);
        chk.className = "cursor-pointer w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-foco-blue-deep focus:ring-foco-blue-deep";

        const txt = document.createElement("span");
        txt.className = `text-[11px] flex-1 break-words select-text ${subItem.checked ? "line-through text-slate-400" : "text-[--color-tarjeta-texto,#334155]"}`;
        txt.textContent = subItem.text;

        chk.addEventListener("change", async (e) => {
          subItem.checked = e.target.checked;
          txt.classList.toggle("line-through", subItem.checked);
          txt.classList.toggle("text-slate-400", subItem.checked);
          await this.persistirCambiosLista(item, tarjeta.dataset.blockId);
        });

        const btnBorrarSub = document.createElement("button");
        btnBorrarSub.className = "opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 text-xs px-1 leading-none transition-opacity";
        btnBorrarSub.innerHTML = "&times;";
        btnBorrarSub.title = "Eliminar ítem";
        btnBorrarSub.addEventListener("click", async () => {
          item.items.splice(index, 1);
          renderItems();
          this.solicitarRenderConectores();
          await this.persistirCambiosLista(item, tarjeta.dataset.blockId);
        });

        row.appendChild(chk);
        row.appendChild(txt);
        row.appendChild(btnBorrarSub);
        itemsContainer.appendChild(row);
      });
    };

    renderItems();

    const inputNuevoSub = document.createElement("input");
    inputNuevoSub.type = "text";
    inputNuevoSub.placeholder = "+ Agregar ítem (Enter)...";
    inputNuevoSub.className = "mt-2 w-full text-[10px] bg-white/70 border border-slate-200/80 rounded px-2 py-1 outline-none text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-300 transition-all";

    inputNuevoSub.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const texto = inputNuevoSub.value.trim();
        if (texto) {
          item.items = item.items || [];
          item.items.push({
            id: crypto.randomUUID(),
            text: texto,
            checked: false
          });
          inputNuevoSub.value = "";
          renderItems();
          this.solicitarRenderConectores();
          await this.persistirCambiosLista(item, tarjeta.dataset.blockId);
        }
      }
    });

    tarjeta.appendChild(inputNuevoSub);

    btnEliminar.addEventListener("click", async () => {
      const noteId = tarjeta.dataset.noteId;
      const bId = tarjeta.dataset.blockId;
      tarjeta.style.opacity = "0.5";

      try {
        const sesion = await getSession();
        if (sesion && bId) {
          const bloque = this.blocksData.find((b) => b.id === bId);
          if (bloque) {
            bloque.content.notes = (bloque.content.notes || []).filter((n) => n.id !== noteId);
            await blocksService.updateBlock(bId, bloque.content, sesion.access_token);
          }
        } else {
          const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
          const updatedLocales = locales.map((b) => {
            if (b.id === bId) {
              const notes = (b.content.notes || []).filter((n) => n.id !== noteId);
              return { ...b, content: { ...b.content, notes } };
            }
            return b;
          });
          localStore.setItem(LOCAL_BLOCKS_KEY, updatedLocales);
          this.blocksData = updatedLocales;
        }
        await this.eliminarConexionesDeTarjeta(noteId);
        tarjeta.remove();
        this.solicitarRenderConectores();
      } catch (error) {
        console.error("Error al eliminar la lista:", error);
        tarjeta.style.opacity = "1";
        alert("No se pudo eliminar la lista.");
      }
    });

    btnEditar.addEventListener("click", () => {
      const inputEdicion = document.createElement("input");
      inputEdicion.type = "text";
      inputEdicion.className = "w-full text-xs font-bold text-slate-800 bg-white border border-indigo-300 rounded px-1.5 py-0.5 outline-none";
      inputEdicion.value = item.title || "";

      headerDiv.classList.add("hidden");
      headerDiv.after(inputEdicion);
      inputEdicion.focus();

      const finalizarEdicion = async () => {
        const nuevoTitulo = inputEdicion.value.trim();
        inputEdicion.remove();
        headerDiv.classList.remove("hidden");

        if (nuevoTitulo && nuevoTitulo !== item.title) {
          item.title = nuevoTitulo;
          tituloEl.textContent = nuevoTitulo;
          await this.persistirCambiosLista(item, tarjeta.dataset.blockId);
        }
      };

      inputEdicion.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inputEdicion.blur();
        } else if (e.key === "Escape") {
          inputEdicion.value = item.title || "";
          inputEdicion.blur();
        }
      });

      inputEdicion.addEventListener("blur", finalizarEdicion);
    });

    return tarjeta;
  }

  async persistirCambiosLista(item, blockId) {
    item.text = [item.title, ...(item.items || []).map((i) => i.text)].filter(Boolean).join(" - ");

    try {
      const sesion = await getSession();
      if (sesion && blockId) {
        const bloque = this.blocksData.find((b) => b.id === blockId);
        if (bloque) {
          bloque.content.notes = (bloque.content.notes || []).map((n) =>
            n.id === item.id ? item : n
          );
          await blocksService.updateBlock(blockId, bloque.content, sesion.access_token);
        }
      } else {
        const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
        const updatedLocales = locales.map((b) => {
          if (b.id === blockId) {
            const notes = (b.content.notes || []).map((n) =>
              n.id === item.id ? item : n
            );
            return { ...b, content: { ...b.content, notes } };
          }
          return b;
        });
        localStore.setItem(LOCAL_BLOCKS_KEY, updatedLocales);
        this.blocksData = updatedLocales;
      }
    } catch (error) {
      console.error("Error al persistir cambios en la lista:", error);
    }
  }

  mostrarAvisoLocal(esInvitado) {
    let aviso = this.querySelector("[data-local-warning]");
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.dataset.localWarning = "true";
      aviso.className = "mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900";
      this.prepend(aviso);
    }
    aviso.hidden = !esInvitado;
    aviso.textContent = "Estás usando F.O.C.O. como invitado. Tus bloques se guardan solo en este dispositivo. Iniciá sesión para sincronizarlos y no perderlos.";
  }

  async migrarBlocksLocales(session) {
    const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
    if (!locales.length || !session?.access_token) return;

    try {
      for (const localBlock of locales) {
        let bloqueExistente = this.blocksData.find((b) => b.type === localBlock.type);

        if (bloqueExistente) {
          const notasOnline = bloqueExistente.content.notes || [];
          const notasLocales = localBlock.content.notes || [];

          const mapaNotas = new Map();
          notasOnline.forEach(n => mapaNotas.set(n.id, n));
          notasLocales.forEach(n => mapaNotas.set(n.id, n));

          const notasFusionadas = Array.from(mapaNotas.values());
          const nuevoContenido = { ...bloqueExistente.content, notes: notasFusionadas };

          await blocksService.updateBlock(bloqueExistente.id, nuevoContenido, session.access_token);
        } else {
          await blocksService.saveBlock(localBlock.type, localBlock.content, session.access_token);
        }
      }

      localStore.removeItem(LOCAL_BLOCKS_KEY);
      this.querySelectorAll(".foco-tarjeta").forEach((card) => card.remove());
      await this.cargarBlocks();
    } catch (error) {
      console.error("Error durante la migración de bloques locales:", error);
    }
  }

  aplicarVisibilidad(estado) {
    this.querySelectorAll(".foco-drop-zone").forEach((zona) => {
      const visible = estado[zona.id] !== false;
      zona.closest("section").classList.toggle("hidden", !visible);
    }); 
  }

  activarDragAndDrop() {
    var listaDeZonas = this.querySelectorAll(".foco-drop-zone");
    for (var i = 0; i < listaDeZonas.length; i++) {
      var zonaActual = listaDeZonas[i];
      var componenteActual = this;

      Sortable.create(zonaActual, {
        group: "foco-tarjetas",
        ghostClass: "foco-tarjeta-fantasma",
        draggable: ".foco-tarjeta",
        onEnd: function () {
          componenteActual.solicitarRenderConectores();
        },
        onAdd: async function (evento) {
          var elementoAgregado = evento.item;

          // 1. Detectamos si soltamos un clon de Nota o Tarea
          if (elementoAgregado.classList.contains("foco-crear-nota")) {
            componenteActual.crearTarjetaItem(elementoAgregado, false); 
            return;
          }
          if (elementoAgregado.classList.contains("foco-crear-tarea")) {
            componenteActual.crearTarjetaItem(elementoAgregado, true); 
            return;
          }
          if (elementoAgregado.classList.contains("foco-crear-lista")) {
            componenteActual.crearTarjetaLista(elementoAgregado);
            return;
          }

          // 2. Transición relacional en la base de datos (Arrastrar entre bloques)
          const noteId = elementoAgregado.dataset.noteId;
          const oldBlockId = elementoAgregado.dataset.blockId;
          const newZoneId = evento.to.id;
          const newBlockType = blockRegistry.getBackendType(newZoneId);

          if (!noteId || !oldBlockId) return;

          try {
            const sesion = await getSession();
            
            // Buscamos el objeto original en caché para no perder propiedades como 'isTask' y 'checked'
            const bloqueOrigenData = componenteActual.blocksData.find(b => b.id === oldBlockId);
            const notaOriginal = (bloqueOrigenData?.content?.notes || []).find(n => n.id === noteId);
            
            // Si por algún motivo no estuviera en caché, creamos un fallback leyendo el DOM
            const tieneCheckbox = Boolean(elementoAgregado.querySelector('input[type="checkbox"]'));
            const tieneLista = Boolean(elementoAgregado.querySelector('.lucide-list'));
            const tipoFallback = tieneCheckbox ? "task" : (tieneLista ? "list" : "note");

            const notaAMover = notaOriginal ? { ...notaOriginal } : { 
              id: noteId, 
              text: elementoAgregado.querySelector("p")?.textContent || "",
              type: tipoFallback,
              isTask: tieneCheckbox,
              checked: false 
            };

            if (sesion) {
              const bloqueOrigen = componenteActual.blocksData.find(b => b.id === oldBlockId);
              if (bloqueOrigen) {
                bloqueOrigen.content.notes = (bloqueOrigen.content.notes || []).filter(n => n.id !== noteId);
                await blocksService.updateBlock(oldBlockId, bloqueOrigen.content, sesion.access_token);
              }

              let bloqueDestino = componenteActual.blocksData.find(b => b.type === newBlockType);
              if (bloqueDestino) {
                bloqueDestino.content.notes = [...(bloqueDestino.content.notes || []), notaAMover];
                await blocksService.updateBlock(bloqueDestino.id, bloqueDestino.content, sesion.access_token);
                elementoAgregado.dataset.blockId = bloqueDestino.id;
              } else {
                const nuevoContenido = { notes: [notaAMover] };
                const datosCreados = await blocksService.saveBlock(newBlockType, nuevoContenido, sesion.access_token);
                componenteActual.blocksData.push(datosCreados);
                elementoAgregado.dataset.blockId = datosCreados.id;
              }
            } else {
              const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
              const updatedLocales = locales.map(b => {
                if (b.id === oldBlockId) {
                  const notes = (b.content.notes || []).filter(n => n.id !== noteId);
                  return { ...b, content: { ...b.content, notes } };
                }
                return b;
              });

              let destBlock = updatedLocales.find(b => b.type === newBlockType);
              if (destBlock) {
                destBlock.content.notes = [...(destBlock.content.notes || []), notaAMover];
                elementoAgregado.dataset.blockId = destBlock.id;
              } else {
                const newId = crypto.randomUUID();
                destBlock = {
                  id: newId,
                  type: newBlockType,
                  content: { notes: [notaAMover] }
                };
                updatedLocales.push(destBlock);
                elementoAgregado.dataset.blockId = newId;
              }
              localStore.setItem(LOCAL_BLOCKS_KEY, updatedLocales);
              componenteActual.blocksData = updatedLocales;
            }
          } catch (error) {
            console.error("Error al transferir la nota entre bloques:", error);
            alert("No se pudo reubicar el elemento en la base de datos.");
            componenteActual.cargarBlocks();
          }
        }
      });
    }
  }

  actualizarEstiloCursorModoFlecha() {
    this.classList.toggle("cursor-crosshair", this.arrowMode);
    this.querySelectorAll(".foco-tarjeta").forEach((t) => {
      t.classList.toggle("cursor-pointer", this.arrowMode);
    });
  }

  obtenerTodasLasConexiones() {
    return (this.blocksData || []).flatMap((b) => b.content?.connections || []);
  }

  obtenerNotaPorId(noteId) {
    for (const block of this.blocksData || []) {
      const notes = block.content?.notes || [];
      const found = notes.find((n) => n.id === noteId);
      if (found) {
        return {
          ...found,
          blockId: block.id,
          blockType: block.type
        };
      }
    }
    return null;
  }

  obtenerConexionesDeTarjeta(noteId) {
    if (!noteId) return [];
    const todas = this.obtenerTodasLasConexiones();
    return todas.filter((c) => c.sourceId === noteId || c.targetId === noteId);
  }

  actualizarBadgesDeAsociacion() {
    const tarjetas = this.querySelectorAll(".foco-tarjeta[data-note-id]");
    tarjetas.forEach((tarjeta) => {
      const noteId = tarjeta.dataset.noteId;
      this.renderizarBadgeInfo(tarjeta, noteId);
    });
  }

  renderizarBadgeInfo(tarjeta, noteId) {
    const conexiones = this.obtenerConexionesDeTarjeta(noteId);
    let badgeWrapper = tarjeta.querySelector(".foco-badge-info-wrapper");

    if (!conexiones || conexiones.length === 0) {
      if (badgeWrapper) badgeWrapper.remove();
      return;
    }

    if (!badgeWrapper) {
      badgeWrapper = document.createElement("div");
      badgeWrapper.className = "foco-badge-info-wrapper absolute top-2.5 right-2.5 z-10 group-hover:right-16 transition-all select-none";
      tarjeta.appendChild(badgeWrapper);
    }

    badgeWrapper.innerHTML = "";

    const btnInfo = document.createElement("button");
    btnInfo.type = "button";
    btnInfo.className = "foco-btn-info flex items-center justify-center w-5 h-5 rounded-full bg-[--color-asociacion-suave,#eef2ff] text-[--color-asociacion-primario,#323888] hover:bg-[--color-asociacion-primario,#323888] hover:text-white border border-[--color-asociacion-borde,#c7d2fe] text-[10px] font-bold shadow-xs hover:scale-110 transition-all cursor-pointer";
    btnInfo.innerHTML = "i";
    btnInfo.title = `Tarjeta asociada (${conexiones.length}) - Clic para ver información de asociaciones`;

    btnInfo.addEventListener("click", (e) => {
      e.stopPropagation();
      this.abrirModalAsociaciones(noteId);
    });

    btnInfo.addEventListener("mouseenter", () => {
      this.resaltarAsociacionesDeTarjeta(noteId);
    });

    btnInfo.addEventListener("mouseleave", () => {
      if (!document.querySelector(`.foco-modal-asociaciones[data-active-note-id="${CSS.escape(noteId)}"]`)) {
        this.limpiarResaltadoAsociaciones();
      }
    });

    badgeWrapper.appendChild(btnInfo);
  }

  abrirModalAsociaciones(noteId) {
    // Si ya existe un modal de asociaciones abierto, eliminarlo antes
    const modalExistente = document.querySelector(".foco-modal-asociaciones");
    if (modalExistente) modalExistente.remove();

    const conexiones = this.obtenerConexionesDeTarjeta(noteId);
    if (!conexiones || conexiones.length === 0) return;

    this.resaltarAsociacionesDeTarjeta(noteId);

    const notaActual = this.obtenerNotaPorId(noteId);
    const tituloActual = notaActual
      ? (notaActual.title || notaActual.text || "Tarjeta sin título")
      : "Tarjeta seleccionada";

    const modal = document.createElement("div");
    modal.className = "foco-modal foco-modal-asociaciones fixed inset-0 z-[100] flex items-center justify-center p-4";
    modal.dataset.activeNoteId = noteId;

    const renderContenidoModal = () => {
      const conns = this.obtenerConexionesDeTarjeta(noteId);
      if (!conns || conns.length === 0) {
        cerrarModal();
        return;
      }

      modal.innerHTML = `
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" data-close></div>
        <section role="dialog" aria-modal="true" class="relative w-full max-w-lg rounded-2xl bg-[--color-bloque-bg,white] p-6 shadow-2xl border border-[--color-asociacion-borde,theme(colors.slate.200)] z-10 flex flex-col max-h-[85vh]">
          
          <!-- Encabezado -->
          <div class="flex items-center justify-between pb-3 border-b border-[--color-bloque-divisor,theme(colors.slate.200)]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-[--color-asociacion-suave,#eef2ff] text-[--color-asociacion-primario,#323888] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-2"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold text-[--color-bloque-titulo,#22298A]">Acciones Asociadas</h2>
                  <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-[--color-asociacion-suave,#eef2ff] text-[--color-asociacion-primario,#323888] border border-[--color-asociacion-borde,#c7d2fe]">
                    ${conns.length}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5 truncate max-w-xs" title="${tituloActual}">
                  Vinculadas a: <span class="font-medium text-slate-700">${tituloActual}</span>
                </p>
              </div>
            </div>
            <button data-close class="text-2xl leading-none text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Cerrar">&times;</button>
          </div>

          <!-- Lista de Asociaciones -->
          <div class="mt-4 flex-1 overflow-y-auto pr-1 space-y-2.5 foco-scrollbar">
            ${conns.map((conn) => {
              const esOrigen = conn.sourceId === noteId;
              const otroId = esOrigen ? conn.targetId : conn.sourceId;
              const otraNota = this.obtenerNotaPorId(otroId);

              const tipo = otraNota?.type === "list"
                ? "Lista"
                : (otraNota?.type === "task" || otraNota?.isTask ? "Tarea" : "Nota");

              const tituloOtro = otraNota
                ? (otraNota.title || otraNota.text || "Tarjeta sin título")
                : "Tarjeta vinculada";

              const tipoColorClase = tipo === "Tarea"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : (tipo === "Lista"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-amber-50 text-amber-700 border-amber-200");

              return `
                <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-all border border-slate-200/80 group">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${tipoColorClase}">
                        ${tipo}
                      </span>
                      <span class="text-[11px] font-semibold text-[--color-asociacion-primario,#323888] flex items-center gap-1">
                        ${esOrigen ? "➔ Vinculada hacia" : "⬅ Vinculada desde"}
                      </span>
                    </div>
                    <p class="text-xs font-medium text-slate-800 break-words line-clamp-2">
                      ${tituloOtro}
                    </p>
                  </div>
                  <button type="button" data-desvincular-id="${conn.id}" class="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all flex-shrink-0" title="Desvincular acción">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-unlink"><path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="m5.16 11.75-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71"/><line x1="2" x2="6" y1="2" y2="6"/><line x1="22" x2="18" y1="22" y2="18"/></svg>
                    <span>Desvincular</span>
                  </button>
                </div>
              `;
            }).join("")}
          </div>

          <!-- Pie del Modal -->
          <div class="mt-5 pt-3 border-t border-[--color-bloque-divisor,theme(colors.slate.200)] flex justify-end">
            <button data-close class="rounded-xl bg-[--color-asociacion-primario,#323888] hover:opacity-90 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all">
              Listo
            </button>
          </div>
        </section>
      `;

      // Event listeners dentro del modal
      modal.querySelectorAll("[data-close]").forEach((btn) => {
        btn.addEventListener("click", cerrarModal);
      });

      modal.querySelectorAll("[data-desvincular-id]").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const connId = btn.dataset.desvincularId;
          await this.eliminarConexion(connId);
          renderContenidoModal();
        });
      });
    };

    const cerrarModal = () => {
      document.removeEventListener("keydown", onKeyDown);
      this.limpiarResaltadoAsociaciones();
      modal.remove();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        cerrarModal();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    renderContenidoModal();
    document.body.appendChild(modal);
  }

  resaltarAsociacionesDeTarjeta(noteId) {
    this.limpiarResaltadoAsociaciones();

    const conexiones = this.obtenerConexionesDeTarjeta(noteId);
    if (!conexiones || conexiones.length === 0) return;

    this.tarjetaResaltadaId = noteId;

    const tarjetaPrincipal = this.querySelector(`[data-note-id="${CSS.escape(noteId)}"]`);
    if (tarjetaPrincipal) {
      tarjetaPrincipal.classList.add("foco-tarjeta-asociada-activa");
    }

    conexiones.forEach((conn) => {
      const otroId = conn.sourceId === noteId ? conn.targetId : conn.sourceId;
      const tarjetaAsociada = this.querySelector(`[data-note-id="${CSS.escape(otroId)}"]`);
      if (tarjetaAsociada) {
        tarjetaAsociada.classList.add("foco-tarjeta-asociada-vinculada");
      }
    });
  }

  limpiarResaltadoAsociaciones() {
    this.tarjetaResaltadaId = null;

    this.querySelectorAll(".foco-tarjeta").forEach((t) => {
      t.classList.remove(
        "foco-tarjeta-asociada-activa",
        "foco-tarjeta-asociada-vinculada",
        "foco-tarjeta-asociando-origen",
        "ring-4",
        "ring-orange-500",
        "ring-orange-400",
        "shadow-2xl",
        "shadow-xl",
        "bg-orange-50/40"
      );
    });
  }

  gestionarClickTarjetaParaFlecha(tarjeta) {
    if (!this.arrowMode) return;
    const noteId = tarjeta.dataset.noteId;
    const blockId = tarjeta.dataset.blockId;
    if (!noteId || !blockId) return;

    if (!this.selectedSourceCard) {
      this.selectedSourceCard = tarjeta;
      tarjeta.classList.add("foco-tarjeta-asociando-origen");
    } else {
      const sourceNoteId = this.selectedSourceCard.dataset.noteId;
      const sourceBlockId = this.selectedSourceCard.dataset.blockId;
      this.selectedSourceCard.classList.remove("foco-tarjeta-asociando-origen");
      this.selectedSourceCard = null;

      if (sourceNoteId !== noteId) {
        this.crearConector(sourceNoteId, sourceBlockId, noteId, blockId);
      }
    }
  }

  async crearConector(sourceNoteId, sourceBlockId, targetNoteId, targetBlockId) {
    const nuevaConexion = {
      id: crypto.randomUUID(),
      sourceId: sourceNoteId,
      targetId: targetNoteId,
      sourceBlockId,
      targetBlockId,
      createdAt: new Date().toISOString()
    };

    const bloque = this.blocksData.find((b) => b.id === sourceBlockId);
    if (!bloque) return;

    if (!bloque.content) bloque.content = {};
    if (!Array.isArray(bloque.content.connections)) bloque.content.connections = [];

    const yaExiste = bloque.content.connections.some(
      (c) => (c.sourceId === sourceNoteId && c.targetId === targetNoteId) ||
             (c.sourceId === targetNoteId && c.targetId === sourceNoteId)
    );
    if (yaExiste) return;

    bloque.content.connections.push(nuevaConexion);
    this.actualizarBadgesDeAsociacion();

    // Resaltar visualmente la asociación recién creada durante 1.8 segundos
    this.resaltarAsociacionesDeTarjeta(sourceNoteId);
    setTimeout(() => {
      this.limpiarResaltadoAsociaciones();
    }, 1800);

    // Finalizar el modo de asociación
    this.arrowMode = false;
    this.actualizarEstiloCursorModoFlecha();
    window.dispatchEvent(new CustomEvent("foco:arrow-mode-changed", { detail: { active: false } }));
    window.dispatchEvent(new CustomEvent("foco:associate-mode-changed", { detail: { active: false } }));

    try {
      const sesion = await getSession();
      if (sesion) {
        await blocksService.updateBlock(sourceBlockId, bloque.content, sesion.access_token);
      } else {
        localStore.setItem(LOCAL_BLOCKS_KEY, this.blocksData);
      }
    } catch (err) {
      console.error("Error al persistir asociación:", err);
    }
  }

  async eliminarConexion(connectionId) {
    let bloqueModificado = null;
    this.blocksData.forEach((b) => {
      if (b.content?.connections) {
        const prevLen = b.content.connections.length;
        b.content.connections = b.content.connections.filter((c) => c.id !== connectionId);
        if (b.content.connections.length !== prevLen) {
          bloqueModificado = b;
        }
      }
    });

    this.limpiarResaltadoAsociaciones();
    this.actualizarBadgesDeAsociacion();

    if (bloqueModificado) {
      try {
        const sesion = await getSession();
        if (sesion) {
          await blocksService.updateBlock(bloqueModificado.id, bloqueModificado.content, sesion.access_token);
        } else {
          localStore.setItem(LOCAL_BLOCKS_KEY, this.blocksData);
        }
      } catch (err) {
        console.error("Error al eliminar conexión:", err);
      }
    }
  }

  async eliminarConexionesDeTarjeta(noteId) {
    let bloquesActualizados = [];
    this.blocksData.forEach((b) => {
      if (b.content?.connections) {
        const prev = b.content.connections.length;
        b.content.connections = b.content.connections.filter(
          (c) => c.sourceId !== noteId && c.targetId !== noteId
        );
        if (b.content.connections.length !== prev) {
          bloquesActualizados.push(b);
        }
      }
    });

    this.limpiarResaltadoAsociaciones();
    this.actualizarBadgesDeAsociacion();

    const sesion = await getSession();
    for (const b of bloquesActualizados) {
      try {
        if (sesion) {
          await blocksService.updateBlock(b.id, b.content, sesion.access_token);
        }
      } catch (e) {
        console.error("Error al limpiar conexiones huérfanas:", e);
      }
    }
    if (!sesion && bloquesActualizados.length > 0) {
      localStore.setItem(LOCAL_BLOCKS_KEY, this.blocksData);
    }
  }
}

customElements.define('foco-lienzo-canvas', FocoLienzoCanvas);