/**
 * Componente: LienzoCanvas
 * Renderiza el espacio de trabajo principal de F.O.C.O.
 * Divide la pantalla en 4 bloques estáticos e independientes bajo el método P.A.R.A.
 * Utiliza Custom Elements de HTML5 (Vanilla JS) para modularizar sin librerías.
 */

import Sortable from "sortablejs";
import { getSession, supabase } from "../auth.js";
import { blocksService } from "../services/blocks.service.js";
import { blockRegistry } from "../strategies/blockRegistry.js";
import { emitCustomEvent, FOCO_EVENTS } from "../utils/events.js";
import { localStore } from "../services/storage.service.js";

const LOCAL_BLOCKS_KEY = "foco-local-blocks";


class FocoLienzoCanvas extends HTMLElement {
  connectedCallback() {
    this.className = "flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)] bg-foco-azul-gray foco-scrollbar";
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
      this.renderBlocks(localStore.getItem(LOCAL_BLOCKS_KEY) || []);
      return;
    }

    try {
      const blocks = await blocksService.fetchBlocks(sesion.access_token, sesion.user.id);
      this.renderBlocks(blocks);
      await this.migrarBlocksLocales(sesion);
    } catch (error) {
      console.error("Error al cargar los blocks:", error);
    }
  }

renderBlocks(blocks) {
    blocks.forEach((block) => {
      const domId = [...blockRegistry.registry.entries()]
        .find(([, backendType]) => backendType === block.type)?.[0];
      const zona = domId ? this.querySelector(`#${CSS.escape(domId)}`) : null;
      if (!zona) return;

      const contenido = block.content || {};
      const texto = contenido.text || contenido.texto || "";
      if (!texto && !contenido.title) return;

      const tarjeta = this.crearElementoTarjeta(block.id, contenido.title, texto);
      zona.appendChild(tarjeta);
    });
  }

  // Centraliza la creación del DOM de una tarjeta con sus controles
  crearElementoTarjeta(id, tituloTexto, cuerpoTexto) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30 relative group transition-all";
    if (id) tarjeta.dataset.id = id;

    // Contenedor de controles (Oculto por defecto, visible al hacer hover)
    const controles = document.createElement("div");
    controles.className = "absolute top-2 right-2 hidden group-hover:flex space-x-2 bg-blue-50/90 rounded px-1";
    
    // Botón Editar
    const btnEditar = document.createElement("button");
    btnEditar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-blue-600"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
    
    // Botón Eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-500 hover:text-red-600"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    
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

    // LÓGICA DE ELIMINACIÓN
    btnEliminar.addEventListener("click", async () => {
      const blockId = tarjeta.dataset.id;
      if (!blockId) return; // Si es local o aún no tiene ID, podrías simplemente removerla
      
      // Reactividad inmediata en UI
      tarjeta.style.opacity = '0.5'; 
      try {
        const sesion = await getSession();
        if (sesion) {
          await blocksService.deleteBlock(blockId, sesion.access_token);
        }
        tarjeta.remove(); // Remover reactivamente del bloque
      } catch (error) {
        console.error("Error al eliminar la nota:", error);
        tarjeta.style.opacity = '1'; // Revertir si falla
        alert("No se pudo eliminar la nota.");
      }
    });

    // LÓGICA DE EDICIÓN (Transformación a Textarea)
    btnEditar.addEventListener("click", () => {
      cuerpo.classList.add("hidden"); // Ocultamos el texto normal
      controles.classList.add("hidden"); // Ocultamos botones durante edición
      tarjeta.classList.remove("group"); // Quitamos temporalmente el comportamiento hover

      const textarea = document.createElement("textarea");
      textarea.className = "w-full text-[11px] text-slate-700 bg-white border border-blue-200 rounded p-1 outline-none resize-none foco-scrollbar";
      textarea.value = cuerpo.textContent;
      textarea.rows = 3;
      
      tarjeta.appendChild(textarea);
      textarea.focus();

      // Guardar cambios al perder el foco
      textarea.addEventListener("blur", async () => {
        const nuevoTexto = textarea.value.trim();
        const blockId = tarjeta.dataset.id;
        
        textarea.remove(); // Quitamos el textarea
        cuerpo.textContent = nuevoTexto; // Actualizamos el DOM
        cuerpo.classList.remove("hidden");
        controles.classList.remove("hidden");
        tarjeta.classList.add("group");

        // Solo actualizar en DB si el texto cambió y tenemos ID
        if (nuevoTexto !== cuerpoTexto && blockId) {
          try {
            const sesion = await getSession();
            if (sesion) {
              await blocksService.updateBlock(blockId, { text: nuevoTexto }, sesion.access_token);
            }
            cuerpoTexto = nuevoTexto; // Actualizamos la referencia en memoria
          } catch (error) {
            console.error("Error al actualizar la nota:", error);
            cuerpo.textContent = cuerpoTexto; // Rollback visual si falla
          }
        }
      });
    });

    return tarjeta;
  }

  // Se actualiza para devolver la data completa y así poder obtener el ID asignado por Supabase
  async guardarNotaEnBackend(texto, tipoDeBloque) {
    try {
      const sesion = await getSession();
      const block = { id: crypto.randomUUID(), type: tipoDeBloque, content: { text: texto } };
      if (!sesion) {
        const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
        localStore.setItem(LOCAL_BLOCKS_KEY, [...locales, block]);
        this.mostrarAvisoLocal(true);
        return block;
      }
      const datos = await blocksService.saveBlock(tipoDeBloque, block.content, sesion.access_token);
      emitCustomEvent(this, FOCO_EVENTS.BLOCK_SAVED, { type: tipoDeBloque, content: texto, data: datos });
      return datos; // Retornamos los datos generados por el backend (incluyendo el ID final)
    } catch (error) {
      console.error("Error al guardar la nota:", error);
      return null;
    }
  }

  // Reemplaza el clon del botón "Nota" por una tarjeta temporal y luego por la definitiva
    crearTarjetaNota(botonClonado) {
      const tarjetaTemporal = document.createElement("div");
      tarjetaTemporal.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30";

      const textarea = document.createElement("textarea");
      textarea.className = "w-full text-[11px] text-slate-700 bg-transparent outline-none resize-none foco-scrollbar";
      textarea.placeholder = "Escribe una nota...";
      textarea.rows = 3;

      tarjetaTemporal.appendChild(textarea);
      
      // Reemplaza el clon por la tarjeta temporal interactiva
      botonClonado.replaceWith(tarjetaTemporal);
      textarea.focus();

      const zonaDrop = tarjetaTemporal.closest(".foco-drop-zone");
      if (!zonaDrop) return;
      
      const idDelBloque = zonaDrop.id;
      const tipoDeBloque = blockRegistry.getBackendType(idDelBloque);

      // Evento al terminar de escribir
      textarea.addEventListener("blur", async () => {
        const textoEscrito = textarea.value.trim();
        
        if (!textoEscrito) {
          tarjetaTemporal.remove(); // Descartar si quedó vacía
          return;
        }

        // Feedback visual mientras guarda en el backend
        textarea.disabled = true; 
        textarea.classList.add("opacity-50");

        const datosGuardados = await this.guardarNotaEnBackend(textoEscrito, tipoDeBloque);
        
        if (datosGuardados) {
          // Extraemos el ID dependiendo de cómo responda tu API
          const idGenerado = datosGuardados.id || (Array.isArray(datosGuardados) ? datosGuardados[0]?.id : null);
          
          // Generamos la tarjeta definitiva usando la MISMA función del renderizado inicial
          const tarjetaDefinitiva = this.crearElementoTarjeta(idGenerado, null, textoEscrito);
          
          // El paso clave: sustituir el elemento temporal por el que tiene los botones
          tarjetaTemporal.replaceWith(tarjetaDefinitiva);
        } else {
          tarjetaTemporal.remove(); // Descartamos si hubo un error en la red
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
    aviso.textContent = "Estás usando F.O.C.O. como invitado. Tus bloques se guardan solo en este dispositivo. Iniciá sesión con Google para sincronizarlos y no perderlos.";
  }

  async migrarBlocksLocales(session) {
    const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
    if (!locales.length || !session?.access_token) return;
    for (const block of locales) {
      await blocksService.saveBlock(block.type, block.content, session.access_token);
    }
    localStore.removeItem(LOCAL_BLOCKS_KEY);
    this.querySelectorAll(".foco-tarjeta[data-local-block]").forEach((card) => card.remove());
    await this.cargarBlocks();
  }

  aplicarVisibilidad(estado) {
    this.querySelectorAll(".foco-drop-zone").forEach((zona) => {
      const visible = estado[zona.id] !== false;
      zona.closest("section").classList.toggle("hidden", !visible);
    });
  }

  // Busca todos los bloques marcados como "zona de drop" y activa SortableJS en cada uno,
  // permite arrastrar tarjetas dentro del mismo bloque o hacia otro bloque conectado.
  activarDragAndDrop() {
    var listaDeZonas = this.querySelectorAll(".foco-drop-zone");

    for (var i = 0; i < listaDeZonas.length; i++) {
      var zonaActual = listaDeZonas[i];
      var componenteActual = this;

      Sortable.create(zonaActual, {
        group: "foco-tarjetas",
        ghostClass: "foco-tarjeta-fantasma",
        draggable: ".foco-tarjeta",

        onAdd: function (evento) {
          var elementoAgregado = evento.item;

          // Si lo que se soltó es el clon del botón "Nota", lo reemplazamos por una tarjeta editable
          if (elementoAgregado.classList.contains("foco-crear-nota")) {
            componenteActual.crearTarjetaNota(elementoAgregado);
          }
        }
      });
    }
  }

}

// Registro en el navegador
customElements.define('foco-lienzo-canvas', FocoLienzoCanvas);
