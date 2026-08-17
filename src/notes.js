const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const userId = import.meta.env.VITE_USER_ID;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]);
}

function noteCard(block) {
  const content = typeof block.content === 'object' && block.content !== null
    ? block.content
    : { text: block.content };
  const title = escapeHtml(content.title || block.type || 'Nota');
  const text = escapeHtml(content.text || content.description || '');

  return `
    <article class="p-3 bg-yellow-50/60 rounded-xl border border-yellow-100/50">
      <h3 class="text-xs font-bold text-slate-800">${title}</h3>
      <p class="text-xs text-slate-600 font-serif leading-relaxed mt-1">${text}</p>
    </article>
  `;
}

export async function loadNotes() {
  const container = document.querySelector('#notes-list');
  if (!container || !userId) return;

  try {
    const response = await fetch(`${apiUrl}/api/blocks/user/${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const blocks = await response.json();
    container.innerHTML = blocks.length
      ? blocks.map(noteCard).join('')
      : '<p class="text-xs text-slate-400">Todavía no hay notas guardadas.</p>';
  } catch (error) {
    console.error('No se pudieron cargar las notas:', error);
    container.innerHTML = '<p class="text-xs text-red-500">No se pudieron cargar las notas.</p>';
  }
}

loadNotes();
