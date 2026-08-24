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

        const tarjeta = document.createElement("div");
        tarjeta.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30";
        if (contenido.title) {
          const titulo = document.createElement("h3");
          titulo.className = "text-xs font-bold text-slate-800";
          titulo.textContent = contenido.title;
          tarjeta.appendChild(titulo);
        }
        const cuerpo = document.createElement("p");
        cuerpo.className = "text-[11px] text-slate-600 mt-0.5 whitespace-pre-wrap";
        cuerpo.textContent = texto;
        tarjeta.appendChild(cuerpo);
        zona.appendChild(tarjeta);
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

  // Envía la nota al Backend mediante POST, usando el servicio de bloques abstracto
  async guardarNotaEnBackend(texto, tipoDeBloque) {
    try {
      const sesion = await getSession();
      const block = { id: crypto.randomUUID(), type: tipoDeBloque, content: { text: texto } };
      if (!sesion) {
        const locales = localStore.getItem(LOCAL_BLOCKS_KEY) || [];
        localStore.setItem(LOCAL_BLOCKS_KEY, [...locales, block]);
        tarjetaNota.dataset.localBlock = "true";
        this.mostrarAvisoLocal(true);
        return;
      }
      const datos = await blocksService.saveBlock(tipoDeBloque, block.content, sesion.access_token);
      console.log("Nota guardada en el backend:", datos);
      emitCustomEvent(this, FOCO_EVENTS.BLOCK_SAVED, { type: tipoDeBloque, content: texto, data: datos });
    } catch (error) {
      console.error("Error al guardar la nota:", error);
    }
  }

  // Reemplaza el clon del botón "Nota" por una tarjeta real, con un área de texto editable.
  crearTarjetaNota(botonClonado) {
    var tarjetaNota = document.createElement("div");
    tarjetaNota.className = "foco-tarjeta p-3 bg-blue-50/50 rounded-xl border border-blue-100/30";

    var areaDeTexto = document.createElement("div");
    areaDeTexto.className = "text-xs text-slate-700 outline-none";
    areaDeTexto.contentEditable = "true";

    tarjetaNota.appendChild(areaDeTexto);

    // Reemplaza el clon (que todavía tenía forma de botón) por la tarjeta nueva
    botonClonado.replaceWith(tarjetaNota);

    // Busca el id del bloque contenedor para saber qué tipo de bloque corresponde según el registro extensible (OCP)
    var idDelBloque = tarjetaNota.closest(".foco-drop-zone").id;
    var tipoDeBloque = blockRegistry.getBackendType(idDelBloque);

    var componenteActual = this;

    areaDeTexto.addEventListener("blur", function () {
      var textoEscrito = areaDeTexto.textContent;
      componenteActual.guardarNotaEnBackend(textoEscrito, tipoDeBloque);
    });

    // Deja el cursor listo para escribir apenas se crea
    areaDeTexto.focus();
  }

}

// Registro en el navegador
customElements.define('foco-lienzo-canvas', FocoLienzoCanvas);
