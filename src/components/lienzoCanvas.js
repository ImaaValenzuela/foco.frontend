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
    this.innerHTML = `
    <!-- Estructura de Grilla de 2 Columnas para Desktop (lg:grid-cols-2) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- BLOQUE 1: Objetivos Activos -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap-icon lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide"> Objetivos Activos</h2>
            </div>
          </div>
          
          <!-- Contenido del Bloque con Scroll Interno Personalizado (.foco-scrollbar) -->
          <div id="bloque-objetivos-activos" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar"> 

          </div>
        </section>

        <!-- BLOQUE 2: Bloque Personal -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-id-card-icon lucide-id-card"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Bloque Personal</h2>
            </div>
          </div>

          <!-- Contenido del Bloque con Scroll Interno Personalizado (.foco-scrollbar) -->
          <!-- Le agregamos "id" y la clase "foco-drop-zone" para que SortableJS reconozca este bloque como una zona donde se puede soltar tarjetas -->
          <div id="bloque-personal" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar">
            
            <!-- La clase "foco-tarjeta" marca qué elementos se pueden arrastrar dentro de una zona -->
          </div>
        </section>

        <!-- BLOQUE 3: Inspiración y Creatividad (Corresponde a "Recursos" del método P.A.R.A) -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-image-icon lucide-book-image"><path d="m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><circle cx="10" cy="8" r="2"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Inspiración y Creatividad</h2>
            </div>
          </div>

          <!-- Contenido del Bloque con Scroll Interno Personalizado (.foco-scrollbar) -->
          <div id="bloque-inspiracion" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar">

          </div>
        </section>

        <!-- BLOQUE 4: Archivo de Vida y Bitácoras -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-[280px]">
          
          <!-- Encabezado del Bloque -->
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22298A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award-icon lucide-award"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
              <h2 class="text-sm font-bold text-foco-blue-deep uppercase tracking-wide">Archivo de Vida</h2>
            </div>
          </div>

          <!-- Contenido del Bloque con Scroll Interno Personalizado (.foco-scrollbar) -->
          <div id="bloque-archivo-vida" class="foco-drop-zone flex-1 overflow-y-auto mt-4 pr-1 space-y-3 foco-scrollbar">
            

          </div>
        </section>
        
      </div>

    `;
        this.blocksData = []; // Caché local para evitar lecturas de red concurrentes
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
    // Limpiamos los contenedores antes de renderizar
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

      // Soporte de compatibilidad con versiones previas (si el contenido guardaba un único texto plano)
      const oldText = contenido.text || contenido.texto || "";
      if (oldText && notes.length === 0) {
        notes.push({ id: crypto.randomUUID(), text: oldText, title: contenido.title || null });
      }

      notes.forEach((note) => {
        // Cada tarjeta almacena su propio id de nota, el id del bloque en BD, el título y el texto
        const tarjeta = this.crearElementoTarjeta(note.id, block.id, note.title, note.text);
        zona.appendChild(tarjeta);
      });
    });
  }

  crearElementoTarjeta(id, blockId, tituloTexto, cuerpoTexto) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30 relative group transition-all cursor-grab active:cursor-grabbing";
    
    // Inyectamos metadatos clave como data-attributes
    if (id) tarjeta.dataset.noteId = id;
    if (blockId) tarjeta.dataset.blockId = blockId;

    // Contenedor de controles
    const controles = document.createElement("div");
    controles.className = "absolute top-2 right-2.5 hidden group-hover:flex flex-row items-center gap-2 bg-blue-50/90 rounded px-2 py-1 shadow-sm";

    // Botón Editar
    const btnEditar = document.createElement("button");
    btnEditar.className = "flex items-center justify-center shrink-0 p-0.5 hover:scale-105 transition-transform";
    btnEditar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-blue-600 transition-colors"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;

    // Botón Eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "flex items-center justify-center shrink-0 p-0.5 hover:scale-105 transition-transform";
    btnEliminar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-red-600 transition-colors"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

    controles.appendChild(btnEditar);
    controles.appendChild(btnEliminar);
    tarjeta.appendChild(controles);

    if (tituloTexto) {
      const titulo = document.createElement("h3");
      titulo.className = "text-xs font-bold text-slate-800 mb-1";
      titulo.textContent = tituloTexto;
      tarjeta.appendChild(titulo);
    }

    const cuerpo = document.createElement("p");
    cuerpo.className = "text-[11px] text-slate-600 mt-0.5 whitespace-pre-wrap";
    cuerpo.textContent = cuerpoTexto;
    tarjeta.appendChild(cuerpo);

    // LÓGICA DE ELIMINACIÓN (Filtra la nota del array y actualiza el bloque JSONB)
    btnEliminar.addEventListener("click", async () => {
      const noteId = tarjeta.dataset.noteId;
      const bId = tarjeta.dataset.blockId;

      tarjeta.style.opacity = '0.5';

      try {
        const sesion = await getSession();
        if (sesion && bId) {
          const bloque = this.blocksData.find(b => b.id === bId);
          if (bloque) {
            // Removemos únicamente la nota seleccionada
            const notasActualizadas = (bloque.content.notes || []).filter(n => n.id !== noteId);
            const nuevoContenido = { ...bloque.content, notes: notasActualizadas };

            await blocksService.updateBlock(bId, nuevoContenido, sesion.access_token);
            bloque.content = nuevoContenido; // Sincronización en caché local
          }
        } else {
          // Flujo offline
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
        console.error("Error al eliminar la nota:", error);
        tarjeta.style.opacity = '1';
        alert("No se pudo eliminar la nota.");
      }
    });

    // LÓGICA DE EDICIÓN (Modifica el texto en el array e implementa UPDATE en JSONB)
    btnEditar.addEventListener("click", () => {
      cuerpo.classList.add("hidden");
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
        cuerpo.classList.remove("hidden");
        tarjeta.classList.add("group");

        if (nuevoTexto && nuevoTexto !== cuerpoTexto) {
          try {
            const sesion = await getSession();
            if (sesion && bId) {
              const bloque = this.blocksData.find(b => b.id === bId);
              if (bloque) {
                const notasActualizadas = (bloque.content.notes || []).map(n => {
                  if (n.id === noteId) return { ...n, text: nuevoTexto };
                  return n;
                });
                const nuevoContenido = { ...bloque.content, notes: notasActualizadas };

                await blocksService.updateBlock(bId, nuevoContenido, sesion.access_token);
                bloque.content = nuevoContenido;
              }
            } else {
              // Flujo offline
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
            cuerpoTexto = nuevoTexto;
          } catch (error) {
            console.error("Error al actualizar la nota:", error);
            cuerpo.textContent = cuerpoTexto;
          }
        }
      });
    });

    return tarjeta;
  }

  async guardarNotaEnBackend(texto, tipoDeBloque) {
    try {
      const sesion = await getSession();
      const nuevaNota = {
        id: crypto.randomUUID(),
        text: texto,
        title: null,
        createdAt: new Date().toISOString()
      };

      if (!sesion) {
        // Flujo offline
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
        
        return { noteId: nuevaNota.id, blockId: bloqueLocal.id, text: texto };
      }

      // Flujo online con sesión de Supabase
      // Buscamos si el usuario ya posee el bloque de este tipo creado
      let bloqueExistente = this.blocksData.find((b) => b.type === tipoDeBloque);

      if (bloqueExistente) {
        const notasActualizadas = [...(bloqueExistente.content.notes || []), nuevaNota];
        const nuevoContenido = { ...bloqueExistente.content, notes: notasActualizadas };

        await blocksService.updateBlock(bloqueExistente.id, nuevoContenido, sesion.access_token);
        bloqueExistente.content = nuevoContenido;

        return { noteId: nuevaNota.id, blockId: bloqueExistente.id, text: texto };
      } else {
        // Es la primera nota en este bloque, se hace un POST para instanciar la fila por primera vez
        const nuevoContenido = { notes: [nuevaNota] };
        const datosCreados = await blocksService.saveBlock(tipoDeBloque, nuevoContenido, sesion.access_token);
        
        this.blocksData.push(datosCreados);
        emitCustomEvent(this, FOCO_EVENTS.BLOCK_SAVED, { type: tipoDeBloque, content: texto, data: datosCreados });
        
        return { noteId: nuevaNota.id, blockId: datosCreados.id, text: texto };
      }
    } catch (error) {
      console.error("Error al guardar la nota en backend:", error);
      return null;
    }
  }

  crearTarjetaNota(botonClonado) {
    const tarjetaTemporal = document.createElement("div");
    tarjetaTemporal.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30";

    const textarea = document.createElement("textarea");
    textarea.className = "w-full text-[11px] text-slate-700 bg-transparent outline-none resize-none foco-scrollbar";
    textarea.placeholder = "Escribe una nota...";
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

      const datosGuardados = await this.guardarNotaEnBackend(textoEscrito, tipoDeBloque);

      if (datosGuardados) {
        const tarjetaDefinitiva = this.crearElementoTarjeta(
          datosGuardados.noteId,
          datosGuardados.blockId,
          null,
          textoEscrito
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
          // Fusionamos las notas evitando colisiones de ID
          const notasOnline = bloqueExistente.content.notes || [];
          const notasLocales = localBlock.content.notes || [];

          const mapaNotas = new Map();
          notasOnline.forEach(n => mapaNotas.set(n.id, n));
          notasLocales.forEach(n => mapaNotas.set(n.id, n));

          const notasFusionadas = Array.from(mapaNotas.values());
          const nuevoContenido = { ...bloqueExistente.content, notes: notasFusionadas };

          await blocksService.updateBlock(bloqueExistente.id, nuevoContenido, session.access_token);
        } else {
          // No existía el bloque de este tipo online, lo instanciamos directo
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

          // 1. Si soltamos el clon de botón de creación
          if (elementoAgregado.classList.contains("foco-crear-nota")) {
            componenteActual.crearTarjetaNota(elementoAgregado);
            return;
          }

          // 2. Si arrastramos una tarjeta entre bloques distintos (Transición relacional en la base de datos)
          const noteId = elementoAgregado.dataset.noteId;
          const oldBlockId = elementoAgregado.dataset.blockId;
          const newZoneId = evento.to.id; // ID del contenedor de destino (ej: 'bloque-personal')
          const newBlockType = blockRegistry.getBackendType(newZoneId);

          if (!noteId || !oldBlockId) return;

          try {
            const sesion = await getSession();
            const textoCard = elementoAgregado.querySelector("p")?.textContent || "";
            const tituloCard = elementoAgregado.querySelector("h3")?.textContent || null;
            const notaAMover = { id: noteId, text: textoCard, title: tituloCard };

            if (sesion) {
              // FLUJO ONLINE (SUPABASE Y REST API)
              
              // A. Remover de bloque de origen
              const bloqueOrigen = componenteActual.blocksData.find(b => b.id === oldBlockId);
              if (bloqueOrigen) {
                bloqueOrigen.content.notes = (bloqueOrigen.content.notes || []).filter(n => n.id !== noteId);
                await blocksService.updateBlock(oldBlockId, bloqueOrigen.content, sesion.access_token);
              }

              // B. Insertar en bloque de destino
              let bloqueDestino = componenteActual.blocksData.find(b => b.type === newBlockType);
              if (bloqueDestino) {
                bloqueDestino.content.notes = [...(bloqueDestino.content.notes || []), notaAMover];
                await blocksService.updateBlock(bloqueDestino.id, bloqueDestino.content, sesion.access_token);
                elementoAgregado.dataset.blockId = bloqueDestino.id; // Actualizamos el id contenedor de la tarjeta
              } else {
                // Instanciar el bloque destino por primera vez
                const nuevoContenido = { notes: [notaAMover] };
                const datosCreados = await blocksService.saveBlock(newBlockType, nuevoContenido, sesion.access_token);
                componenteActual.blocksData.push(datosCreados);
                elementoAgregado.dataset.blockId = datosCreados.id;
              }
            } else {
              // FLUJO OFFLINE (LOCALSTORAGE)
              const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];

              // Remover de origen local
              const updatedLocales = locales.map(b => {
                if (b.id === oldBlockId) {
                  const notes = (b.content.notes || []).filter(n => n.id !== noteId);
                  return { ...b, content: { ...b.content, notes } };
                }
                return b;
              });

              // Insertar en destino local
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
            alert("No se pudo reubicar la nota en la base de datos.");
            componenteActual.cargarBlocks(); // Recarga para restaurar el estado consistente
          }
        }
      });
    }
  }
}

customElements.define('foco-lienzo-canvas', FocoLienzoCanvas);
