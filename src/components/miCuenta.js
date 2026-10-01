import { getSession, signOut, supabase } from '../auth.js';
import { profileService } from '../services/profile.service.js';
import { localStore } from '../services/storage.service.js';

let selectedInterests = [];
const MAX_INTERESTS = 6;
let toastTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  initMiCuenta();
});

async function initMiCuenta() {
  // 1. Verificar autenticación
  const session = await getSession();
  if (!session?.user) {
    window.location.href = '/login.html';
    return;
  }

  // 2. Event listeners para sliders
  ['study', 'work', 'routine', 'leisure'].forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', updateHoursAndTotal);
  });

  // 3. Event listeners para tags de intereses
  document.querySelectorAll('.interest-tag').forEach((btn) => {
    btn.addEventListener('click', () => {
      const interestId = btn.id.replace('tag-', '');
      toggleInterest(interestId, btn);
    });
  });

  // 4. Form submit listener
  const form = document.getElementById('account-form');
  form?.addEventListener('submit', handleSaveProfile);

  // 5. Cargar datos del usuario y perfil
  await loadUserData();
}

function updateHoursAndTotal() {
  const s = parseInt(document.getElementById('study')?.value) || 0;
  const w = parseInt(document.getElementById('work')?.value) || 0;
  const r = parseInt(document.getElementById('routine')?.value) || 0;
  const l = parseInt(document.getElementById('leisure')?.value) || 0;

  document.getElementById('study-val').textContent = `${s} hrs`;
  document.getElementById('work-val').textContent = `${w} hrs`;
  document.getElementById('routine-val').textContent = `${r} hrs`;
  document.getElementById('leisure-val').textContent = `${l} hrs`;

  paintSlider(document.getElementById('study'), '#FC7206');
  paintSlider(document.getElementById('work'), '#22298A');
  paintSlider(document.getElementById('routine'), '#FC7206');
  paintSlider(document.getElementById('leisure'), '#22298A');

  const total = s + w + r + l;
  const totalEl = document.getElementById('hours-total');
  const indicator = document.getElementById('hours-indicator');

  if (totalEl) totalEl.textContent = total;

  if (indicator) {
    if (total > 24) {
      indicator.className = 'text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-full animate-pulse';
    } else if (total === 24) {
      indicator.className = 'text-xs font-bold px-3 py-1 bg-green-100 text-green-800 rounded-full';
    } else {
      indicator.className = 'text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full';
    }
  }
}

function paintSlider(slider, color) {
  if (!slider) return;
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 8;
  const val = parseFloat(slider.value) || 0;
  const percentage = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #E2E8F0 ${percentage}%, #E2E8F0 100%)`;
}

function toggleInterest(interestId, element) {
  const idx = selectedInterests.indexOf(interestId);
  const container = document.getElementById('interests-container');

  if (idx > -1) {
    selectedInterests.splice(idx, 1);
    element.classList.remove('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
    element.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
    container?.appendChild(element);
  } else {
    if (selectedInterests.length >= MAX_INTERESTS) {
      showToast('Límite de intereses', 'Podés elegir hasta 6 intereses principales.', 'warning');
      return;
    }
    selectedInterests.push(interestId);
    element.classList.add('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
    element.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');
    container?.insertBefore(element, container.firstChild);
  }

  const countLabel = document.getElementById('interests-count');
  if (countLabel) countLabel.textContent = selectedInterests.length;
}

async function loadUserData() {
  try {
    let data = null;
    try {
      data = await profileService.getProfile();
    } catch (err) {
      console.warn('Error al cargar datos de perfil desde la API:', err.message);
    }

    const session = await getSession().catch(() => null);
    const localData = localStore.getItem('foco_onboarding_data') || {};

    const user = data?.user || {
      name: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || '',
      email: session?.user?.email || '',
    };
    const profiling = data?.profiling || localData || {};

    // 1. Datos personales
    const nameInput = document.getElementById('account-name');
    const emailInput = document.getElementById('account-email');
    if (nameInput) nameInput.value = user.name || session?.user?.user_metadata?.full_name || '';
    if (emailInput) emailInput.value = user.email || session?.user?.email || '';

    // 2. Sliders de rutina
    if (document.getElementById('study')) document.getElementById('study').value = profiling.study_hours_daily ?? 0;
    if (document.getElementById('work')) document.getElementById('work').value = profiling.work_hours_daily ?? 0;
    if (document.getElementById('routine')) document.getElementById('routine').value = profiling.routine_hours_daily ?? 0;
    if (document.getElementById('leisure')) document.getElementById('leisure').value = profiling.leisure_hours_daily ?? 0;

    updateHoursAndTotal();

    // 3. Intereses
    selectedInterests = Array.isArray(profiling.interests) ? [...profiling.interests] : [];
    const container = document.getElementById('interests-container');

    document.querySelectorAll('.interest-tag').forEach((btn) => {
      const id = btn.id.replace('tag-', '');
      if (selectedInterests.includes(id)) {
        btn.classList.add('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
        btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');
      } else {
        btn.classList.remove('bg-foco-blue-deep', 'text-white', 'border-foco-blue-deep');
        btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
      }
    });

    // Reordenar para que los seleccionados aparezcan primero en el contenedor (idéntico a onboarding)
    if (container) {
      for (let i = selectedInterests.length - 1; i >= 0; i--) {
        const btn = document.getElementById(`tag-${selectedInterests[i]}`);
        if (btn) {
          container.insertBefore(btn, container.firstChild);
        }
      }
    }

    const countLabel = document.getElementById('interests-count');
    if (countLabel) countLabel.textContent = selectedInterests.length;

    // 4. Motivaciones booleanas
    if (document.getElementById('mot_create_habits')) {
      document.getElementById('mot_create_habits').checked = !!profiling.mot_create_habits;
    }
    if (document.getElementById('mot_avoid_dispersion')) {
      document.getElementById('mot_avoid_dispersion').checked = !!profiling.mot_avoid_dispersion;
    }
    if (document.getElementById('mot_organization')) {
      document.getElementById('mot_organization').checked = !!profiling.mot_organization;
    }
    if (document.getElementById('mot_reduce_fatigue')) {
      document.getElementById('mot_reduce_fatigue').checked = !!profiling.mot_reduce_fatigue;
    }
  } catch (err) {
    console.warn('Error al cargar datos de perfil:', err.message);
    showToast('Aviso', 'Completá tus datos para calibrar tu cuenta.', 'info');
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();

  const s = parseInt(document.getElementById('study')?.value) || 0;
  const w = parseInt(document.getElementById('work')?.value) || 0;
  const r = parseInt(document.getElementById('routine')?.value) || 0;
  const l = parseInt(document.getElementById('leisure')?.value) || 0;
  const total = s + w + r + l;

  if (total > 24) {
    showToast('Presupuesto excedido', 'El total de horas asignadas no puede superar 24 horas diarias.', 'error');
    return;
  }

  const name = document.getElementById('account-name')?.value.trim();
  if (!name) {
    showToast('Campo obligatorio', 'Por favor ingresá tu nombre completo.', 'error');
    return;
  }

  const payload = {
    name,
    study_hours_daily: s,
    work_hours_daily: w,
    routine_hours_daily: r,
    leisure_hours_daily: l,
    interests: selectedInterests,
    mot_create_habits: document.getElementById('mot_create_habits')?.checked || false,
    mot_avoid_dispersion: document.getElementById('mot_avoid_dispersion')?.checked || false,
    mot_organization: document.getElementById('mot_organization')?.checked || false,
    mot_reduce_fatigue: document.getElementById('mot_reduce_fatigue')?.checked || false,
  };

  const submitBtn = document.getElementById('save-profile-btn');
  const originalText = submitBtn?.innerHTML;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Guardando cambios...
    `;
  }

  try {
    const res = await profileService.updateProfile(payload);
    localStore.setItem('foco_onboarding_data', payload);

    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: payload.name,
            name: payload.name,
            interests: payload.interests,
            onboarding_completed: true,
          },
        });
      } catch (sbErr) {
        console.warn('Advertencia al sincronizar metadatos con Supabase:', sbErr);
      }
    }

    showToast('¡Guardado con éxito!', 'Tu información y preferencias se han actualizado correctamente.', 'success');
  } catch (err) {
    console.error('Error guardando perfil:', err);
    showToast('Error de guardado', err.message || 'No se pudo guardar la información.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText || 'Guardar Cambios';
    }
  }
}

function showToast(title, message, type = 'info') {
  const toast = document.getElementById('account-toast');
  const titleEl = document.getElementById('toast-title');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');

  if (!toast || !titleEl || !msgEl) return;

  titleEl.textContent = title;
  msgEl.textContent = message;

  toast.className = 'fixed bottom-6 right-6 max-w-sm w-84 p-4 rounded-2xl shadow-2xl flex items-start gap-3 z-50 transition-all duration-300 border text-sm';
  if (type === 'success') {
    toast.classList.add('bg-green-50', 'border-green-200', 'text-green-800');
    if (iconEl) iconEl.innerHTML = `<svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
  } else if (type === 'error') {
    toast.classList.add('bg-red-50', 'border-red-200', 'text-red-800');
    if (iconEl) iconEl.innerHTML = `<svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
  } else {
    toast.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-800');
    if (iconEl) iconEl.innerHTML = `<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  }

  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-8');
  toast.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-8');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 4500);
}

window.closeAccountToast = () => {
  const toast = document.getElementById('account-toast');
  toast?.classList.add('opacity-0', 'pointer-events-none', 'translate-y-8');
  toast?.classList.remove('opacity-100', 'translate-y-0');
};
