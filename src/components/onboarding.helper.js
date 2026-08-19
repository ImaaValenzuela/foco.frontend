/**
 * F.O.C.O. - Módulo Controlador de Onboarding y Calibración del Motor de IA
 * Centraliza las reglas de la Épica 1 - Feature 1.2
 */

document.addEventListener('DOMContentLoaded', () => {
  initOnboarding();
});

// Cache global de elementos del DOM de Onboarding
const onboardingDOM = {
  sliders: {
    study: 'study',
    work: 'work',
    routine: 'routine',
    leisure: 'leisure'
  },
  vals: {
    study: 'study-val',
    work: 'work-val',
    routine: 'routine-val',
    leisure: 'leisure-val'
  },
  total: 'hours-total',
  indicator: 'hours-indicator',
  errorHours: 'error-hours',
  container: 'interests-container',
  countLabel: 'interests-count',
  btnContainer: 'btn-onboarding-container',
  submitBtn: 'submit-onboarding-btn',
  toast: 'alert-toast',
  toastTitle: 'toast-title',
  toastMessage: 'toast-message',
  closeToast: 'close-toast-btn'
};

const onboardingState = {
  selectedInterests: [],
  maxInterests: 6,
  toastTimeout: null
};

/**
 * Inicialización y enrutamiento de escuchadores
 */
function initOnboarding() {
  // Bind de sliders
  const sliders = Object.values(onboardingDOM.sliders).map(id => document.getElementById(id));
  sliders.forEach(slider => {
    if (slider) {
      slider.addEventListener('input', updateHoursAndSliders);
    }
  });

  // Bind de tags de intereses estáticos
  const tags = document.querySelectorAll('.interest-tag');
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      // Extrae el ID del interés desde su id tag "tag-{interest_id}"
      const interestId = tag.id.replace('tag-', '');
      handleInterestToggle(interestId, tag);
    });
  });

  // Bind de motivaciones
  const motivs = ['mot_create_habits', 'mot_avoid_dispersion', 'mot_organization', 'mot_reduce_fatigue'];
  motivs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', checkOnboardingCompleteness);
    }
  });

  // Botón Submit e indicador de cerrado de toast
  const submitBtn = document.getElementById(onboardingDOM.submitBtn);
  if (submitBtn) {
    submitBtn.addEventListener('click', submitOnboardingProfiling);
  }

  const closeBtn = document.getElementById(onboardingDOM.closeToast);
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAlertToast);
  }

  // Inicializar render de horas
  updateHoursAndSliders();
}

/**
 * Pinta el track de los sliders a la izquierda del punto del mismo color que su botón
 */
function paintSliderTrack(slider) {
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 8;
  const val = parseFloat(slider.value) || 0;
  const percentage = ((val - min) / (max - min)) * 100;
  const isOrange = slider.classList.contains('slider-orange');
  const activeColor = isOrange ? '#FC7206' : '#22298A';
  slider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, #E2E8F0 ${percentage}%, #E2E8F0 100%)`;
}

/**
 * Manejo y balanceo de carga de horas de rutina
 */
function updateHoursAndSliders() {
  const s = parseInt(document.getElementById(onboardingDOM.sliders.study).value) || 0;
  const w = parseInt(document.getElementById(onboardingDOM.sliders.work).value) || 0;
  const r = parseInt(document.getElementById(onboardingDOM.sliders.routine).value) || 0;
  const l = parseInt(document.getElementById(onboardingDOM.sliders.leisure).value) || 0;

  document.getElementById(onboardingDOM.vals.study).textContent = `${s} hrs`;
  document.getElementById(onboardingDOM.vals.work).textContent = `${w} hrs`;
  document.getElementById(onboardingDOM.vals.routine).textContent = `${r} hrs`;
  document.getElementById(onboardingDOM.vals.leisure).textContent = `${l} hrs`;

  // Actualizar gradiente izquierdo de los 4 tracks
  paintSliderTrack(document.getElementById(onboardingDOM.sliders.study));
  paintSliderTrack(document.getElementById(onboardingDOM.sliders.work));
  paintSliderTrack(document.getElementById(onboardingDOM.sliders.routine));
  paintSliderTrack(document.getElementById(onboardingDOM.sliders.leisure));

  const total = s + w + r + l;
  document.getElementById(onboardingDOM.total).textContent = total;

  const indicator = document.getElementById(onboardingDOM.indicator);
  const errorMsg = document.getElementById(onboardingDOM.errorHours);

  if (total > 24) {
    indicator.className = 'text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-full animate-bounce';
    errorMsg.classList.remove('hidden');
    showOnboardingAlert("Presupuesto excedido", "La carga total de actividades no puede superar las 24 horas diarias del día.");
  } else {
    errorMsg.classList.add('hidden');
    if (total === 24) {
      indicator.className = 'text-xs font-bold px-3 py-1 bg-green-100 text-green-800 rounded-full';
    } else {
      indicator.className = 'text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full';
    }
  }

  checkOnboardingCompleteness();
}

/**
 * Gestión de marcado, movimiento e inserción al tope y límite estricto de 6 intereses
 */
function handleInterestToggle(interestId, element) {
  const idx = onboardingState.selectedInterests.indexOf(interestId);
  const container = document.getElementById(onboardingDOM.container);

  if (idx > -1) {
    // Deseleccionar interés
    onboardingState.selectedInterests.splice(idx, 1);
    element.classList.remove('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
    element.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');

    // Al desmarcar, enviamos al final de la fila de manera elegante
    container.appendChild(element);
  } else {
    // Límite crítico de 6 intereses obligatorios
    if (onboardingState.selectedInterests.length >= onboardingState.maxInterests) {
      showOnboardingAlert("Límite de intereses", "¡Atención! Podés elegir hasta un máximo de 6 temas para calibrar tu IA.");
      return;
    }

    // Seleccionar interés
    onboardingState.selectedInterests.push(interestId);
    element.classList.add('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
    element.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');

    // Mover dinámicamente al principio exacto del contenedor
    container.insertBefore(element, container.firstChild);
  }

  // Actualizar contador visual 0/6
  document.getElementById(onboardingDOM.countLabel).textContent = onboardingState.selectedInterests.length;
  checkOnboardingCompleteness();
}

/**
 * Validación y visibilidad reactiva del botón comenzar
 */
function checkOnboardingCompleteness() {
  const s = parseInt(document.getElementById(onboardingDOM.sliders.study).value) || 0;
  const w = parseInt(document.getElementById(onboardingDOM.sliders.work).value) || 0;
  const r = parseInt(document.getElementById(onboardingDOM.sliders.routine).value) || 0;
  const l = parseInt(document.getElementById(onboardingDOM.sliders.leisure).value) || 0;
  const total = s + w + r + l;

  const isHoursValid = total > 0 && total <= 24;
  const hasInterests = onboardingState.selectedInterests.length > 0 && onboardingState.selectedInterests.length <= 6;

  const m1 = document.getElementById('mot_create_habits').checked;
  const m2 = document.getElementById('mot_avoid_dispersion').checked;
  const m3 = document.getElementById('mot_organization').checked;
  const m4 = document.getElementById('mot_reduce_fatigue').checked;
  const hasMotivations = m1 || m2 || m3 || m4;

  const isComplete = isHoursValid && hasInterests && hasMotivations;

  const btnContainer = document.getElementById(onboardingDOM.btnContainer);
  if (isComplete) {
    btnContainer.classList.remove('opacity-0', 'pointer-events-none', 'scale-90', 'h-0', 'overflow-hidden');
    btnContainer.classList.add('opacity-100', 'scale-100', 'mt-8');
  } else {
    btnContainer.classList.add('opacity-0', 'pointer-events-none', 'scale-90', 'h-0', 'overflow-hidden');
    btnContainer.classList.remove('opacity-100', 'scale-100', 'mt-8');
  }
}

/**
 * Despliega alerta en esquina inferior derecha
 */
function showOnboardingAlert(title, message) {
  const container = document.getElementById(onboardingDOM.toast);
  const titleEl = document.getElementById(onboardingDOM.toastTitle);
  const msgEl = document.getElementById(onboardingDOM.toastMessage);

  if (!container || !titleEl || !msgEl) return;

  titleEl.textContent = title;
  msgEl.textContent = message;

  container.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-12');
  container.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(onboardingState.toastTimeout);
  onboardingState.toastTimeout = setTimeout(() => {
    closeAlertToast();
  }, 7000);
}

function closeAlertToast() {
  const container = document.getElementById(onboardingDOM.toast);
  if (container) {
    container.classList.add('opacity-0', 'pointer-events-none', 'translate-y-12');
    container.classList.remove('opacity-100', 'translate-y-0');
  }
}

/**
 * Persistencia del Onboarding en LocalStorage y redirección
 */
function submitOnboardingProfiling() {
  const s = parseInt(document.getElementById(onboardingDOM.sliders.study).value) || 0;
  const w = parseInt(document.getElementById(onboardingDOM.sliders.work).value) || 0;
  const r = parseInt(document.getElementById(onboardingDOM.sliders.routine).value) || 0;
  const l = parseInt(document.getElementById(onboardingDOM.sliders.leisure).value) || 0;
  const total = s + w + r + l;

  if (total > 24) {
    showOnboardingAlert("Error de guardado", "El presupuesto total de horas excede las 24 horas diarias permitidas.");
    return;
  }

  const profilingData = {
    study_hours_daily: s,
    work_hours_daily: w,
    routine_hours_daily: r,
    leisure_hours_daily: l,
    interests: onboardingState.selectedInterests,
    mot_create_habits: document.getElementById('mot_create_habits').checked,
    mot_avoid_dispersion: document.getElementById('mot_avoid_dispersion').checked,
    mot_organization: document.getElementById('mot_organization').checked,
    mot_reduce_fatigue: document.getElementById('mot_reduce_fatigue').checked
  };

  localStorage.setItem('foco_onboarding_data', JSON.stringify(profilingData));

  // Animación del botón al presionar
  const mainBtn = document.getElementById(onboardingDOM.submitBtn);
  if (mainBtn) {
    mainBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Calibrando Motor de IA...
    `;
  }

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
}