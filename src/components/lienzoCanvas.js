import Sortable from "sortablejs";
import { getSession, supabase } from "../auth.js";
import { blocksService } from "../services/blocks.service.js";
import { blockRegistry } from "../strategies/blockRegistry.js";
import { emitCustomEvent, FOCO_EVENTS } from "../utils/events.js";
import { localStore } from "../services/storage.service.js";

const LOCAL_BLOCKS_KEY = "foco-local-blocks";

class FocoLienzoCanvas extends HTMLElement {
  connectedCallback() {
    this.className = "flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-slate-100 foco-scrollbar";
    // (Mantenemos la estructura HTML original de los 4 bloques intacta)
    this.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- BLOQUE 1: Objetivos Activos -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap-icon lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide"> Objetivos Activos</h2>
            </div>
          </div>
          <div id="bloque-objetivos-activos" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>

        <!-- BLOQUE 2: Bloque Personal -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-id-card-icon lucide-id-card"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Bloque Personal</h2>
            </div>
          </div>
          <div id="bloque-personal" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>

        <!-- BLOQUE 3: Inspiración y Creatividad -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-image-icon lucide-book-image"><path d="m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><circle cx="10" cy="8" r="2"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Inspiración y Creatividad</h2>
            </div>
          </div>
          <div id="bloque-inspiracion" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>

        <!-- BLOQUE 4: Archivo de Vida -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award-icon lucide-award"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Archivo de Vida</h2>
            </div>
          </div>
          <div id="bloque-archivo-vida" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"></div>
        </section>
        
      </div>
    `;
    this.blocksData = []; 
    this.activarDragAndDrop();
    this.cargarBlocks();
    this.aplicarVisibilidad(JSON.parse(localStorage.getItem("foco-board-visibility") || "{}"));

    this.onVisibilityChanged = (event) => this.aplicarVisibilidad(event.detail);
    window.addEventListener("foco:visibility-changed", this.onVisibilityChanged);

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
        // Ahora pasamos el objeto ítem completo para poder leer isTask y checked
        const tarjeta = this.crearElementoTarjeta(item, block.id);
        zona.appendChild(tarjeta);
      });
    });
  }

  // Modificado para recibir un objeto Item (Nota o Tarea) y renderizar dinámicamente
  crearElementoTarjeta(item, blockId) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30 relative group transition-all cursor-grab active:cursor-grabbing";
    
    if (item.id) tarjeta.dataset.noteId = item.id;
    if (blockId) tarjeta.dataset.blockId = blockId;

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
      titulo.className = "text-xs font-bold text-slate-800 mb-1";
      titulo.textContent = item.title;
      tarjeta.appendChild(titulo);
    }

    // Contenedor Flex para alinear checkbox y texto
    const contenidoFlex = document.createElement("div");
    contenidoFlex.className = "flex items-start gap-2 mt-0.5";
    
    const esTarea = item.isTask === true;

    // Generación del Checkbox si es Tarea
    if (esTarea) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "mt-0.5 cursor-pointer w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-foco-blue-deep focus:ring-foco-blue-deep";
      checkbox.checked = item.checked || false;
      
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
    cuerpo.className = `text-[11px] text-slate-600 flex-1 whitespace-pre-wrap transition-colors ${esTarea && item.checked ? 'line-through text-slate-400' : ''}`;
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
        tarjeta.remove();
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
            n.id === noteId ? { ...n, checked: newState } : n
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
              n.id === noteId ? { ...n, checked: newState } : n
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
        isTask: isTask,
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

    textarea.addEventListener("blur", async () => {
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
      } else {
        tarjetaTemporal.remove();
      }
    });
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
            const notaAMover = notaOriginal ? { ...notaOriginal } : { 
              id: noteId, 
              text: elementoAgregado.querySelector("p")?.textContent || "",
              isTask: false,
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
}

customElements.define('foco-lienzo-canvas', FocoLienzoCanvas);