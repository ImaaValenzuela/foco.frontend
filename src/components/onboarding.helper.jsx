import React, { memo } from 'react';
import { localStore } from '../services/storage.service.js';
import { getSession } from '../auth.js';
import { profileService } from '../services/profile.service.js';

/**
 * Componente React: OnboardingView
 * Optimizado con React.memo.
 */
export const OnboardingView = memo(function OnboardingView() {
  return (
    <div className="onboarding-view-container">
      {/* Vistas y controles de onboarding en onboarding.html */}
    </div>
  );
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
  });
}

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
export async function initOnboarding() {
  try {
    const session = await getSession();
    if (session?.user) {
      const completed = await profileService.checkOnboardingCompleted(session);
      if (completed) {
        window.location.href = 'index.html';
        return;
      }
    }
  } catch (err) {
    console.warn('Error comprobando sesión en onboarding:', err);
  }

  const sliders = Object.values(onboardingDOM.sliders).map(id => document.getElementById(id));
  sliders.forEach(slider => {
    if (slider) {
      slider.addEventListener('input', updateHoursAndSliders);
    }
  });

  const tags = document.querySelectorAll('.interest-tag');
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      const interestId = tag.id.replace('tag-', '');
      handleInterestToggle(interestId, tag);
    });
  });

  const motivs = ['mot_create_habits', 'mot_avoid_dispersion', 'mot_organization', 'mot_reduce_fatigue'];
  motivs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', checkOnboardingCompleteness);
    }
  });

  const submitBtn = document.getElementById(onboardingDOM.submitBtn);
  if (submitBtn) {
    submitBtn.addEventListener('click', submitOnboardingProfiling);
  }

  const closeBtn = document.getElementById(onboardingDOM.closeToast);
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAlertToast);
  }

  updateHoursAndSliders();
}

export function paintSliderTrack(slider) {
  if (!slider) return;
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 8;
  const val = parseFloat(slider.value) || 0;
  const percentage = ((val - min) / (max - min)) * 100;
  const isOrange = slider.classList.contains('slider-orange');
  const activeColor = isOrange ? '#FC7206' : '#22298A';
  slider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, #E2E8F0 ${percentage}%, #E2E8F0 100%)`;
}

export function updateHoursAndSliders() {
  const s = parseInt(document.getElementById(onboardingDOM.sliders.study)?.value) || 0;
  const w = parseInt(document.getElementById(onboardingDOM.sliders.work)?.value) || 0;
  const r = parseInt(document.getElementById(onboardingDOM.sliders.routine)?.value) || 0;
  const l = parseInt(document.getElementById(onboardingDOM.sliders.leisure)?.value) || 0;

  const studyVal = document.getElementById(onboardingDOM.vals.study);
  const workVal = document.getElementById(onboardingDOM.vals.work);
  const routineVal = document.getElementById(onboardingDOM.vals.routine);
  const leisureVal = document.getElementById(onboardingDOM.vals.leisure);

  if (studyVal) studyVal.textContent = `${s} hrs`;
  if (workVal) workVal.textContent = `${w} hrs`;
  if (routineVal) routineVal.textContent = `${r} hrs`;
  if (leisureVal) leisureVal.textContent = `${l} hrs`;

  paintSliderTrack(document.getElementById(onboardingDOM.sliders.study));
  paintSliderTrack(document.getElementById(onboardingDOM.sliders.work));
  paintSliderTrack(document.getElementById(onboardingDOM.sliders.routine));
  paintSliderTrack(document.getElementById(onboardingDOM.sliders.leisure));

  const total = s + w + r + l;
  const totalEl = document.getElementById(onboardingDOM.total);
  if (totalEl) totalEl.textContent = total;

  const indicator = document.getElementById(onboardingDOM.indicator);
  const errorMsg = document.getElementById(onboardingDOM.errorHours);

  if (total > 24) {
    if (indicator) indicator.className = 'text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-full animate-bounce';
    errorMsg?.classList.remove('hidden');
    showOnboardingAlert("Presupuesto excedido", "La carga total de actividades no puede superar las 24 horas diarias del día.");
  } else {
    errorMsg?.classList.add('hidden');
    if (indicator) {
      if (total === 24) {
        indicator.className = 'text-xs font-bold px-3 py-1 bg-green-100 text-green-800 rounded-full';
      } else {
        indicator.className = 'text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full';
      }
    }
  }

  checkOnboardingCompleteness();
}

export function handleInterestToggle(interestId, element) {
  const idx = onboardingState.selectedInterests.indexOf(interestId);
  const container = document.getElementById(onboardingDOM.container);

  if (idx > -1) {
    onboardingState.selectedInterests.splice(idx, 1);
    element.classList.remove('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
    element.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
    container?.appendChild(element);
  } else {
    if (onboardingState.selectedInterests.length >= onboardingState.maxInterests) {
      showOnboardingAlert("Límite de intereses", "¡Atención! Podés elegir hasta un máximo de 6 temas para calibrar tu IA.");
      return;
    }

    onboardingState.selectedInterests.push(interestId);
    element.classList.add('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
    element.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');
    container?.insertBefore(element, container.firstChild);
  }

  const countLabel = document.getElementById(onboardingDOM.countLabel);
  if (countLabel) countLabel.textContent = onboardingState.selectedInterests.length;
  checkOnboardingCompleteness();
}

export function checkOnboardingCompleteness() {
  const s = parseInt(document.getElementById(onboardingDOM.sliders.study)?.value) || 0;
  const w = parseInt(document.getElementById(onboardingDOM.sliders.work)?.value) || 0;
  const r = parseInt(document.getElementById(onboardingDOM.sliders.routine)?.value) || 0;
  const l = parseInt(document.getElementById(onboardingDOM.sliders.leisure)?.value) || 0;
  const total = s + w + r + l;

  const isHoursValid = total > 0 && total <= 24;
  const hasInterests = onboardingState.selectedInterests.length > 0 && onboardingState.selectedInterests.length <= 6;

  const m1 = document.getElementById('mot_create_habits')?.checked;
  const m2 = document.getElementById('mot_avoid_dispersion')?.checked;
  const m3 = document.getElementById('mot_organization')?.checked;
  const m4 = document.getElementById('mot_reduce_fatigue')?.checked;
  const hasMotivations = Boolean(m1 || m2 || m3 || m4);

  const isComplete = isHoursValid && hasInterests && hasMotivations;

  const btnContainer = document.getElementById(onboardingDOM.btnContainer);
  if (btnContainer) {
    if (isComplete) {
      btnContainer.classList.remove('opacity-0', 'pointer-events-none', 'scale-90', 'h-0', 'overflow-hidden');
      btnContainer.classList.add('opacity-100', 'scale-100', 'mt-8');
    } else {
      btnContainer.classList.add('opacity-0', 'pointer-events-none', 'scale-90', 'h-0', 'overflow-hidden');
      btnContainer.classList.remove('opacity-100', 'scale-100', 'mt-8');
    }
  }
}

export function showOnboardingAlert(title, message) {
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

export function closeAlertToast() {
  const container = document.getElementById(onboardingDOM.toast);
  if (container) {
    container.classList.add('opacity-0', 'pointer-events-none', 'translate-y-12');
    container.classList.remove('opacity-100', 'translate-y-0');
  }
}

export async function submitOnboardingProfiling() {
  const s = parseInt(document.getElementById(onboardingDOM.sliders.study)?.value) || 0;
  const w = parseInt(document.getElementById(onboardingDOM.sliders.work)?.value) || 0;
  const r = parseInt(document.getElementById(onboardingDOM.sliders.routine)?.value) || 0;
  const l = parseInt(document.getElementById(onboardingDOM.sliders.leisure)?.value) || 0;
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
    mot_create_habits: Boolean(document.getElementById('mot_create_habits')?.checked),
    mot_avoid_dispersion: Boolean(document.getElementById('mot_avoid_dispersion')?.checked),
    mot_organization: Boolean(document.getElementById('mot_organization')?.checked),
    mot_reduce_fatigue: Boolean(document.getElementById('mot_reduce_fatigue')?.checked)
  };

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

  try {
    const session = await getSession();
    if (!session) throw new Error('La sesión expiró. Inicia sesión nuevamente.');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(profilingData),
    });
    if (!response.ok) throw new Error('No se pudo guardar el onboarding.');
    localStore.setItem('foco_onboarding_data', profilingData);
    window.location.href = 'index.html';
  } catch (error) {
    showOnboardingAlert('Error de guardado', error.message);
    if (mainBtn) mainBtn.disabled = false;
  }
}

export default OnboardingView;
